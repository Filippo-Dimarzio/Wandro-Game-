import { Image, StyleSheet, View } from 'react-native';
import { useIsDark } from '@/theme';

/* eslint-disable @typescript-eslint/no-require-imports -- static asset requires for Metro */
const LIGHT = require('../../assets/backdrop/light.png');
const DARK = require('../../assets/backdrop/dark.png');
/* eslint-enable @typescript-eslint/no-require-imports */

/**
 * The game's backdrop behind every screen: a faint treasure-map pattern (trails, a compass,
 * mountains, waves, X marks) tiled edge to edge, so even a wide window is part of the adventure
 * instead of empty white. Rendered by scripts/render-backdrop.mjs; the doodles are kept faint so
 * text on top stays readable.
 */
export function GameBackdrop() {
  const dark = useIsDark();
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none" testID="game-backdrop">
      <Image
        source={dark ? DARK : LIGHT}
        resizeMode="repeat"
        style={StyleSheet.absoluteFill}
        accessible={false}
      />
    </View>
  );
}
