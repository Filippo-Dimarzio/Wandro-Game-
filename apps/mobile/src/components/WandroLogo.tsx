import { Image } from 'expo-image';

/** The Wandro "W" mark: a route-shaped W with a "you are here" dot (assets/logo.png). */
export function WandroLogo({ size = 40, label }: { size?: number; label?: string }) {
  return (
    <Image
      // eslint-disable-next-line @typescript-eslint/no-require-imports -- static asset for Metro
      source={require('../../assets/logo.png')}
      style={{ width: size, height: size }}
      accessible={!!label}
      accessibilityLabel={label}
      testID="wandro-logo"
    />
  );
}
