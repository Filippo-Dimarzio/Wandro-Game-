import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

/**
 * Pick a photo and re-encode it as a resized JPEG. Re-encoding drops all EXIF metadata,
 * including GPS coordinates, so uploads never leak where (or when) a photo was taken.
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
  return saved.uri;
}
