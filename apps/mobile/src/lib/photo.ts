import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
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

/**
 * Pick a photo and re-encode it as a resized JPEG. Re-encoding drops all EXIF metadata,
 * including GPS coordinates, so uploads never leak where (or when) a photo was taken.
 * Blank photos are refused here; the server checks every upload again (check-photo).
 */
export async function pickCleanPhoto(source: 'camera' | 'library'): Promise<string | null> {
  const opts: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 1, exif: false };
  if (source === 'camera') {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return null;
  }
  const res =
    source === 'camera'
      ? await ImagePicker.launchCameraAsync(opts)
      : await ImagePicker.launchImageLibraryAsync(opts);
  if (res.canceled || !res.assets[0]) return null;
  const ref = await ImageManipulator.manipulate(res.assets[0].uri)
    .resize({ width: 1440 })
    .renderAsync();
  const saved = await ref.saveAsync({ compress: 0.8, format: SaveFormat.JPEG });
  if (await isBlankPhoto(saved.uri)) throw new BlankPhotoError();
  return saved.uri;
}
