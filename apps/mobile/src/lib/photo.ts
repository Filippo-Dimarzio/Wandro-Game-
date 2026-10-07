import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';
import jpeg from 'jpeg-js';
import { photoLooksBlank } from '@wandro/shared';

/** Thrown when the picked photo is blank (black, white or one flat colour). */
export class BlankPhotoError extends Error {
  constructor() {
    super('blank_photo');
  }
}

const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

/** Small base64 decoder (atob isn't on every React Native runtime). */
export function base64ToBytes(b64: string): Uint8Array {
  const clean = b64.replace(/[^A-Za-z0-9+/]/g, '');
  const out = new Uint8Array(Math.floor((clean.length * 3) / 4));
  let bits = 0;
  let value = 0;
  let o = 0;
  for (const ch of clean) {
    value = (value << 6) | B64.indexOf(ch);
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      out[o++] = (value >> bits) & 0xff;
    }
  }
  return out.subarray(0, o);
}

/** Decodes a small thumbnail of the photo and applies the shared blank rule. */
export async function isBlankPhoto(uri: string): Promise<boolean> {
  const thumb = await ImageManipulator.manipulate(uri).resize({ width: 48 }).renderAsync();
  const { base64 } = await thumb.saveAsync({
    format: SaveFormat.JPEG,
    compress: 0.9,
    base64: true,
  });
  if (!base64) return false;
  const img = jpeg.decode(base64ToBytes(base64), { useTArray: true });
  return photoLooksBlank(img.data);
}

/** Where a photo comes from: the back camera, the front camera (a live photo's selfie), the
 * camera roll, or the phone's files. */
export type PhotoSource = 'camera' | 'selfie' | 'library' | 'files';

async function pickRaw(source: PhotoSource): Promise<string | null> {
  const opts: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 1, exif: false };
  if (source === 'camera' || source === 'selfie') {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return null;
    const res = await ImagePicker.launchCameraAsync({
      ...opts,
      cameraType: source === 'selfie' ? ImagePicker.CameraType.front : ImagePicker.CameraType.back,
    });
    return res.canceled ? null : (res.assets[0]?.uri ?? null);
  }
  // The browser's file picker covers both the camera roll and files on the web.
  if (source === 'files' && Platform.OS !== 'web') {
    const res = await DocumentPicker.getDocumentAsync({
      type: 'image/*',
      copyToCacheDirectory: true,
    });
    return res.canceled ? null : (res.assets[0]?.uri ?? null);
  }
  const res = await ImagePicker.launchImageLibraryAsync(opts);
  return res.canceled ? null : (res.assets[0]?.uri ?? null);
}

/**
 * Pick a photo and re-encode it as a resized JPEG. Re-encoding drops all EXIF metadata,
 * including GPS coordinates, so uploads never leak where (or when) a photo was taken.
 * Blank photos are refused here; the server checks every upload again (check-photo).
 */
export async function pickCleanPhoto(source: PhotoSource): Promise<string | null> {
  const uri = await pickRaw(source);
  if (!uri) return null;
  const ref = await ImageManipulator.manipulate(uri).resize({ width: 1440 }).renderAsync();
  const saved = await ref.saveAsync({ compress: 0.8, format: SaveFormat.JPEG });
  if (await isBlankPhoto(saved.uri)) throw new BlankPhotoError();
  return saved.uri;
}

/** A live photo, BeReal style: what you see (back camera), then you (front camera). */
export interface LivePhoto {
  photo: string;
  selfie?: string;
}

export async function takeLivePhoto(): Promise<LivePhoto | null> {
  const photo = await pickCleanPhoto('camera');
  if (!photo) return null;
  const selfie = await pickCleanPhoto('selfie');
  return { photo, selfie: selfie ?? undefined };
}

/** Width kept for photos saved on the device in demo mode: sharp on phones, small to store. */
export const KEPT_PHOTO_WIDTH = 800;

/**
 * A copy of the photo that survives reloads, app updates and new deploys. Picked photos live in a
 * temporary file (or a blob: URL on the web) that's gone after a reload, so demo mode stores the
 * photo itself, re-encoded as a compact JPEG data URI. The server keeps photos in Storage instead.
 */
export async function keepPhoto(uri: string): Promise<string> {
  if (uri.startsWith('data:')) return uri;
  const ref = await ImageManipulator.manipulate(uri)
    .resize({ width: KEPT_PHOTO_WIDTH })
    .renderAsync();
  const { base64 } = await ref.saveAsync({ format: SaveFormat.JPEG, compress: 0.7, base64: true });
  if (!base64) throw new Error('photo_not_saved');
  return `data:image/jpeg;base64,${base64}`;
}
