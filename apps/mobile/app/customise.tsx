import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EXPLORER_IDS, explorerStage, SHOP_ITEMS, type ShopItem } from '@wandro/shared';
import { ExplorerAvatar, explorerImage } from '@/components/ExplorerAvatar';
import { GameBackdrop } from '@/components/GameBackdrop';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useMyExplorer, useSetExplorer } from '@/data/explorer';
import { useLoadout } from '@/data/loadout';
import { useEquipItem } from '@/data/shop';
import { useWallet } from '@/data/wallet';
import { t, type TranslationKey } from '@/i18n';
import { column, radius, shadow, space, useColors } from '@/theme';

type Part = 'explorer' | 'outfit' | 'hat';
const PARTS: { key: Part; icon: React.ComponentProps<typeof Ionicons>['name'] }[] = [
  { key: 'explorer', icon: 'happy' },
  { key: 'outfit', icon: 'shirt' },
  { key: 'hat', icon: 'school' },
];
const TILE = 84;

/**
 * Dress up your explorer: pick who you are, then an outfit and a hat. Your explorer stands on a
 * little stage at the top and changes as you tap; everything you own is one tap away, and things
 * you haven't got yet show a lock and take you to the Store.
 */
export default function Customise() {
  const c = useColors();
  const explorer = useMyExplorer();
  const setExplorer = useSetExplorer();
  const loadout = useLoadout();
  const equip = useEquipItem();
  const { level } = useWallet();
  const [part, setPart] = useState<Part>('explorer');

  const items = (kind: 'skin' | 'hat') => SHOP_ITEMS.filter((i) => i.kind === kind);
  const owns = (i: ShopItem) => loadout.owned.has(i.code);
  const wear = (slot: 'skin' | 'hat', item: ShopItem | null) => {
    if (item && !owns(item)) return router.push('/shop');
    equip.mutate({ slot, code: item?.code });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <GameBackdrop />
      <ScreenHeader title={t('customise.title')} />
      <ScrollView contentContainerStyle={[styles.container, column]}>
        <LinearGradient
          colors={[c.accentSoft, c.goldSoft]}
          style={[styles.stage, shadow]}
          testID="customise-stage"
        >
          <View style={[styles.spot, { backgroundColor: c.card }]} />
          <ExplorerAvatar
            explorer={explorer}
            skin={loadout.skin}
            hat={loadout.hat}
            level={level}
            size={150}
            accessibilityLabel={t('customise.preview')}
          />
          <View style={[styles.rank, { backgroundColor: c.card }]}>
            <Text style={{ color: c.text, fontWeight: '900' }}>{explorerStage(level)}</Text>
          </View>
        </LinearGradient>

        <View style={[styles.tabs, { backgroundColor: c.surface }]} accessibilityRole="tablist">
          {PARTS.map((p) => {
            const on = part === p.key;
            return (
              <Pressable
                key={p.key}
                onPress={() => setPart(p.key)}
                accessibilityRole="tab"
                accessibilityState={{ selected: on }}
                style={[styles.tab, on && [styles.tabOn, { backgroundColor: c.card }]]}
                testID={`customise-tab-${p.key}`}
              >
                <Ionicons name={p.icon} size={18} color={on ? c.accent : c.textMuted} />
                <Text style={{ color: on ? c.text : c.textMuted, fontWeight: '800' }}>
                  {t(`customise.${p.key}` as TranslationKey)}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.grid} accessibilityRole="radiogroup">
          {part === 'explorer' &&
            EXPLORER_IDS.map((id) => (
              <Option
                key={id}
                label={t(`explorer.${id}` as TranslationKey)}
                selected={id === explorer}
                hideLabel
                onPress={() => setExplorer.mutate(id)}
                testID={`customise-explorer-${id}`}
              >
                <Image
                  source={explorerImage(id, loadout.skin)}
                  style={styles.face}
                  accessible={false}
                />
              </Option>
            ))}

          {part === 'outfit' && (
            <>
              <Option
                label={t('customise.defaultOutfit')}
                selected={!loadout.skin}
                onPress={() => wear('skin', null)}
                testID="customise-outfit-default"
              >
                <Image source={explorerImage(explorer)} style={styles.face} accessible={false} />
              </Option>
              {items('skin').map((item) => (
                <Option
                  key={item.code}
                  label={item.name}
                  selected={loadout.skin === item.code}
                  locked={!owns(item)}
                  onPress={() => wear('skin', item)}
                  testID={`customise-outfit-${item.code}`}
                >
                  <Image
                    source={explorerImage(explorer, item.code)}
                    style={styles.face}
                    accessible={false}
                  />
                </Option>
              ))}
            </>
          )}

          {part === 'hat' && (
            <>
              <Option
                label={t('customise.noHat')}
                selected={!loadout.hat}
                onPress={() => wear('hat', null)}
                testID="customise-hat-none"
              >
                <Ionicons name="close-circle-outline" size={40} color={c.textMuted} />
              </Option>
              {items('hat').map((item) => (
                <Option
                  key={item.code}
                  label={item.name}
                  selected={loadout.hat === item.code}
                  locked={!owns(item)}
                  onPress={() => wear('hat', item)}
                  testID={`customise-hat-${item.code}`}
                >
                  <Text style={{ fontSize: 40 }}>{item.emoji}</Text>
                </Option>
              ))}
            </>
          )}
        </View>

        {part !== 'explorer' && (
          <Text style={{ color: c.textMuted, textAlign: 'center' }}>
            {t('customise.storeHint')}
          </Text>
        )}

        <Pressable
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/profile'))}
          accessibilityRole="button"
          style={[styles.done, { backgroundColor: c.accent }]}
          testID="customise-done"
        >
          <Text style={{ color: c.accentOn, fontWeight: '900', fontSize: 16 }}>
            {t('customise.done')}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

/** One choice in the grid: ringed when worn, dimmed with a lock when you don't own it yet. */
function Option({
  label,
  selected,
  locked = false,
  hideLabel = false,
  onPress,
  testID,
  children,
}: {
  label: string;
  selected: boolean;
  locked?: boolean;
  /** The picture says it all (the explorers); the label stays for screen readers. */
  hideLabel?: boolean;
  onPress: () => void;
  testID: string;
  children: React.ReactNode;
}) {
  const c = useColors();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={locked ? t('customise.locked', { name: label }) : label}
      style={styles.option}
      testID={testID}
    >
      <View
        style={[
          styles.tile,
          {
            backgroundColor: c.card,
            borderColor: selected ? c.accent : c.border,
            borderWidth: selected ? 4 : 2,
          },
        ]}
      >
        <View style={{ opacity: locked ? 0.35 : 1 }}>{children}</View>
        {locked && (
          <View style={[styles.lock, { backgroundColor: c.text }]}>
            <Ionicons name="lock-closed" size={12} color={c.bg} />
          </View>
        )}
        {selected && (
          <View style={[styles.check, { backgroundColor: c.accent }]}>
            <Ionicons name="checkmark" size={14} color={c.accentOn} />
          </View>
        )}
      </View>
      {!hideLabel && (
        <Text style={[styles.label, { color: c.text }]} numberOfLines={2}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { padding: space.lg, gap: space.md, paddingBottom: space.xxl },
  stage: {
    height: 230,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  spot: {
    position: 'absolute',
    bottom: 34,
    width: 170,
    height: 34,
    borderRadius: 85,
    opacity: 0.7,
  },
  rank: {
    position: 'absolute',
    bottom: 12,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 3,
  },
  tabs: { flexDirection: 'row', borderRadius: radius.pill, padding: 4, gap: 4 },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 40,
    borderRadius: radius.pill,
  },
  tabOn: shadow,
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md, justifyContent: 'center' },
  option: { width: TILE + 8, alignItems: 'center', gap: 4 },
  tile: {
    width: TILE,
    height: TILE,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  face: { width: TILE - 14, height: TILE - 14, borderRadius: (TILE - 14) / 2 },
  lock: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  check: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { fontSize: 11, fontWeight: '700', textAlign: 'center' },
  done: {
    borderRadius: radius.pill,
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
