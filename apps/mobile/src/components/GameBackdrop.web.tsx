import { Asset } from 'expo-asset';
import { useIsDark } from '@/theme';

/* eslint-disable @typescript-eslint/no-require-imports -- static asset requires for Metro */
const LIGHT = require('../../assets/backdrop/light.png');
const DARK = require('../../assets/backdrop/dark.png');
/* eslint-enable @typescript-eslint/no-require-imports */

/** Web: the same treasure-map backdrop, tiled with CSS (react-native-web's Image doesn't repeat). */
export function GameBackdrop() {
  const dark = useIsDark();
  const uri = Asset.fromModule(dark ? DARK : LIGHT).uri;
  return (
    <div
      aria-hidden
      data-testid="game-backdrop"
      style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `url(${uri})`,
        backgroundRepeat: 'repeat',
        backgroundSize: '360px 360px',
        pointerEvents: 'none',
      }}
    />
  );
}
