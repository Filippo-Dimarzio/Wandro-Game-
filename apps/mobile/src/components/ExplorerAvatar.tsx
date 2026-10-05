import { Image } from 'expo-image';
import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import {
  DEFAULT_EXPLORER,
  explorerKit,
  isExplorerId,
  shopItem,
  type ExplorerId,
} from '@wandro/shared';
import { EXPLORER_ART, KIT_ART, type OutfitKey } from '@/explorerArt';

interface Props {
  /** Which explorer to draw (see EXPLORER_IDS); unknown ids fall back to the default. */
  explorer?: ExplorerId | string | null;
  /** Equipped outfit (a Store "skin" code). */
  skin?: string;
  hat?: string;
  /** Player level: from Explorer rank up, the explorer's kit badge shows (map, backpack, camera). */
  level?: number;
  size?: number;
  /** Incense trail glow. */
  glow?: boolean;
  accessibilityLabel?: string;
}

/** The picture for an explorer in an outfit (the default jacket for unknown or no outfit). */
export function explorerImage(explorer?: string | null, skin?: string) {
  const id = isExplorerId(explorer) ? explorer : DEFAULT_EXPLORER;
  const outfit = (skin && skin in EXPLORER_ART[id] ? skin : 'default') as OutfitKey;
  return EXPLORER_ART[id][outfit];
}

/** A player's explorer: their chosen character, outfit, hat, kit badge and incense glow. */
export function ExplorerAvatar({
  explorer,
  skin,
  hat,
  level,
  size = 64,
  glow,
  accessibilityLabel,
}: Props) {
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!glow) return;
    const loop = Animated.loop(
      Animated.timing(pulse, {
        toValue: 1,
        duration: 1800,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [glow, pulse]);
  const hatEmoji = shopItem(hat)?.emoji;
  const kit = level ? explorerKit(level) : null;
  const badge = Math.max(16, Math.round(size * 0.38));

  return (
    <View
      style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}
      accessible={!!accessibilityLabel}
      accessibilityLabel={accessibilityLabel}
      testID="explorer-avatar"
    >
      {glow && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.glow,
            {
              width: size * 1.8,
              height: size * 1.8,
              borderRadius: size,
              opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.55, 0] }),
              transform: [
                { scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1.15] }) },
              ],
            },
          ]}
        />
      )}
      <View style={[styles.frame, { width: size, height: size, borderRadius: size / 2 }]}>
        <Image
          source={explorerImage(explorer, skin)}
          style={{ width: '100%', height: '100%' }}
          contentFit="cover"
          accessible={false}
        />
      </View>
      {hatEmoji && (
        <Text style={[styles.hat, { fontSize: size * 0.4, top: -size * 0.26 }]}>{hatEmoji}</Text>
      )}
      {kit && (
        <Image
          source={KIT_ART[kit]}
          style={[styles.kit, { width: badge, height: badge, right: -badge * 0.15 }]}
          accessible={false}
          testID={`kit-${kit}`}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  glow: { position: 'absolute', backgroundColor: '#F6AD55' },
  frame: { overflow: 'hidden', borderWidth: 3, borderColor: '#fff', backgroundColor: '#FBF1E4' },
  hat: { position: 'absolute' },
  kit: { position: 'absolute', bottom: -2 },
});
