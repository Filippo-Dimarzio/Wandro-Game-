import { Image } from 'expo-image';
import { Pressable, StyleSheet, View } from 'react-native';
import { EXPLORER_IDS, type ExplorerId } from '@wandro/shared';
import { t, type TranslationKey } from '@/i18n';
import { useColors } from '@/theme';
import { explorerImage } from './ExplorerAvatar';

/** A grid of the explorers to choose from; the chosen one gets a ring. */
export function ExplorerPicker({
  value,
  onChange,
  skin,
  size = 64,
}: {
  value: ExplorerId;
  onChange: (id: ExplorerId) => void;
  /** Show them in the player's outfit. */
  skin?: string;
  size?: number;
}) {
  const c = useColors();
  return (
    <View style={styles.grid} accessibilityRole="radiogroup">
      {EXPLORER_IDS.map((id) => {
        const on = id === value;
        return (
          <Pressable
            key={id}
            onPress={() => onChange(id)}
            accessibilityRole="radio"
            accessibilityState={{ checked: on }}
            accessibilityLabel={t(`explorer.${id}` as TranslationKey)}
            testID={`explorer-${id}`}
            style={[
              styles.option,
              {
                width: size + 12,
                height: size + 12,
                borderRadius: (size + 12) / 2,
                borderColor: on ? c.accent : 'transparent',
              },
            ]}
          >
            <Image
              source={explorerImage(id, skin)}
              style={{ width: size, height: size, borderRadius: size / 2 }}
              accessible={false}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  option: { borderWidth: 3, alignItems: 'center', justifyContent: 'center' },
});
