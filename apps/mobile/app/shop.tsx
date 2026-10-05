import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  DEFAULT_SKIN_COLOR,
  SHOP_ITEMS,
  unlockProgress,
  type ShopItem,
  type ShopItemKind,
} from '@wandro/shared';
import { CoinCounter } from '@/components/CoinCounter';
import { OctopusAvatar } from '@/components/OctopusAvatar';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useLoadout } from '@/data/loadout';
import { useBuyItem, useEquipItem, useUnlockStats } from '@/data/shop';
import { useWallet } from '@/data/wallet';
import { CoinIcon } from '@/components/CoinIcon';
import { t, type TranslationKey } from '@/i18n';
import { column, radius, space, useColors } from '@/theme';

const SECTIONS: { kind: ShopItemKind; title: TranslationKey }[] = [
  { kind: 'boost', title: 'shop.boosts' },
  { kind: 'skin', title: 'shop.skins' },
  { kind: 'hat', title: 'shop.hats' },
];

export default function Shop() {
  const c = useColors();
  const wallet = useWallet();
  const loadout = useLoadout();
  const buy = useBuyItem();
  const equip = useEquipItem();
  const stats = useUnlockStats();
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const minutesLeft = Math.max(0, Math.ceil((loadout.trailEndsAt - Date.now()) / 60_000));

  const onBuy = (item: ShopItem) =>
    buy.mutate(item.code, {
      onSuccess: () => {
        setMessage({ text: t('shop.bought', { name: item.name }), ok: true });
        if (item.kind !== 'boost') equip.mutate({ slot: item.kind, code: item.code });
      },
      onError: (e) => {
        const code =
          ['insufficient_coins', 'already_owned', 'challenge_not_done'].find((k) =>
            e.message.includes(k),
          ) ?? 'unknown';
        setMessage({ text: t(`shop.error.${code}` as TranslationKey), ok: false });
      },
    });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <ScreenHeader title={t('shop.title')} />
      <ScrollView contentContainerStyle={[styles.container, column]}>
        <View style={[styles.hero, { backgroundColor: c.surface }]}>
          <OctopusAvatar
            size={88}
            skin={loadout.skin}
            hat={loadout.hat}
            glow={loadout.trailActive}
            accessibilityLabel="Your octopus"
          />
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={{ color: c.textMuted, fontWeight: '700' }}>{t('shop.balance')}</Text>
            <CoinCounter coins={wallet.coins} size={28} />
            {loadout.trailActive && (
              <Text style={{ color: c.gold, fontWeight: '800' }}>
                🪔 {t('shop.active', { min: minutesLeft })}
              </Text>
            )}
          </View>
        </View>
        <Text style={{ color: c.textMuted }}>{t('shop.earn')}</Text>
        {message && (
          <Text
            style={{ color: message.ok ? c.accent : c.danger, fontWeight: '700' }}
            accessibilityLiveRegion="polite"
            testID="shop-message"
          >
            {message.text}
          </Text>
        )}

        {SECTIONS.map((section) => (
          <View key={section.kind} style={{ gap: space.sm }}>
            <Text style={[styles.section, { color: c.text }]} accessibilityRole="header">
              {t(section.title)}
            </Text>
            {section.kind === 'skin' && (
              <ItemRow
                emoji="🐙"
                swatch={DEFAULT_SKIN_COLOR}
                name={t('shop.default')}
                description=""
                action={
                  !loadout.skin ? (
                    <Badge text={t('shop.equipped')} />
                  ) : (
                    <Action
                      label={t('shop.equip')}
                      onPress={() => equip.mutate({ slot: 'skin', code: undefined })}
                    />
                  )
                }
              />
            )}
            {SHOP_ITEMS.filter((i) => i.kind === section.kind).map((item) => {
              const owned = loadout.owned.has(item.code);
              const equipped =
                (item.kind === 'skin' && loadout.skin === item.code) ||
                (item.kind === 'hat' && loadout.hat === item.code);
              const progress = owned ? null : unlockProgress(item, stats);
              const affordable = wallet.coins >= item.price && (progress?.met ?? true);
              let action: React.ReactNode;
              const running = item.durationMinutes
                ? item.code.startsWith('incense')
                  ? loadout.trailActive
                  : Date.parse(loadout.activeUntil[item.code] ?? '') > Date.now()
                : false;
              const held = !!item.consumable && loadout.held.has(item.code);
              if (held) {
                action = <Badge text={t('shop.ready')} testID={`held-${item.code}`} />;
              } else if (item.kind === 'boost') {
                action = (
                  <Action
                    label={
                      running
                        ? t('shop.extend', { price: item.price })
                        : t('shop.buy', { price: item.price })
                    }
                    onPress={() => onBuy(item)}
                    disabled={!affordable || buy.isPending}
                    testID={`buy-${item.code}`}
                  />
                );
              } else if (equipped) {
                action = (
                  <Action
                    label={t('shop.unequip')}
                    secondary
                    onPress={() =>
                      equip.mutate({ slot: item.kind as 'skin' | 'hat', code: undefined })
                    }
                  />
                );
              } else if (owned) {
                action = (
                  <Action
                    label={t('shop.equip')}
                    onPress={() =>
                      equip.mutate({ slot: item.kind as 'skin' | 'hat', code: item.code })
                    }
                    testID={`equip-${item.code}`}
                  />
                );
              } else {
                action = (
                  <Action
                    label={t('shop.buy', { price: item.price })}
                    onPress={() => onBuy(item)}
                    disabled={!affordable || buy.isPending}
                    testID={`buy-${item.code}`}
                  />
                );
              }
              return (
                <ItemRow
                  key={item.code}
                  emoji={item.emoji}
                  swatch={item.color}
                  name={item.name}
                  description={item.description}
                  challenge={
                    progress && item.challenge ? { text: item.challenge, ...progress } : undefined
                  }
                  testID={`item-${item.code}`}
                  badge={
                    equipped
                      ? t('shop.equipped')
                      : owned
                        ? t('shop.owned')
                        : running && !item.code.startsWith('incense')
                          ? t('shop.running', {
                              hours: Math.max(
                                1,
                                Math.ceil(
                                  (Date.parse(loadout.activeUntil[item.code]) - Date.now()) /
                                    3_600_000,
                                ),
                              ),
                            })
                          : undefined
                  }
                  action={action}
                />
              );
            })}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function ItemRow({
  emoji,
  swatch,
  name,
  description,
  badge,
  challenge,
  action,
  testID,
}: {
  emoji: string;
  swatch?: string;
  name: string;
  description: string;
  badge?: string;
  /** Earn it first: the challenge and how far along you are. */
  challenge?: { text: string; done: number; total: number; met: boolean };
  action: React.ReactNode;
  testID?: string;
}) {
  const c = useColors();
  return (
    <View style={[styles.item, { backgroundColor: c.card, borderColor: c.border }]} testID={testID}>
      <View style={[styles.icon, { backgroundColor: swatch ?? c.surface }]}>
        <Text style={{ fontSize: 26 }}>{emoji}</Text>
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={{ color: c.text, fontWeight: '800' }}>
          {name}
          {badge ? <Text style={{ color: c.accent, fontWeight: '700' }}> · {badge}</Text> : null}
        </Text>
        {!!description && <Text style={{ color: c.textMuted, fontSize: 13 }}>{description}</Text>}
        {challenge && (
          <View
            style={[
              styles.challenge,
              { backgroundColor: challenge.met ? c.accentSoft : c.goldSoft },
            ]}
            testID={`${testID}-challenge`}
          >
            <Text style={{ color: c.text, fontWeight: '700', fontSize: 13 }}>
              {challenge.met ? '✅' : '🔒'} {t('shop.challenge')}: {challenge.text}
            </Text>
            <View style={styles.challengeRow}>
              <View style={[styles.track, { backgroundColor: c.border }]}>
                <View
                  style={[
                    styles.fill,
                    {
                      backgroundColor: challenge.met ? c.accent : c.gold,
                      width: `${(challenge.done / challenge.total) * 100}%`,
                    },
                  ]}
                />
              </View>
              <Text style={{ color: c.textMuted, fontWeight: '800', fontSize: 12 }}>
                {challenge.done}/{challenge.total}
              </Text>
            </View>
          </View>
        )}
        <View style={{ marginTop: 6, alignSelf: 'flex-start' }}>{action}</View>
      </View>
    </View>
  );
}

function Action({
  label,
  onPress,
  disabled,
  secondary,
  testID,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  secondary?: boolean;
  testID?: string;
}) {
  const c = useColors();
  const priced = /\d$/.test(label);
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      style={[
        styles.action,
        secondary
          ? { borderColor: c.border, borderWidth: 1 }
          : { backgroundColor: disabled ? c.border : c.accent },
      ]}
      testID={testID}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Text
          style={{
            color: secondary ? c.text : disabled ? c.textMuted : c.accentOn,
            fontWeight: '800',
          }}
        >
          {label}
        </Text>
        {priced && <CoinIcon size={16} />}
      </View>
    </Pressable>
  );
}

function Badge({ text, testID }: { text: string; testID?: string }) {
  const c = useColors();
  return (
    <Text style={{ color: c.accent, fontWeight: '800' }} testID={testID}>
      {text}
    </Text>
  );
}

const styles = StyleSheet.create({
  container: { padding: space.lg, gap: space.md },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.lg,
    borderRadius: radius.lg,
    padding: space.lg,
    paddingTop: space.xl,
  },
  section: { fontSize: 18, fontWeight: '800', marginTop: space.sm },
  item: {
    flexDirection: 'row',
    gap: space.md,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    padding: space.md,
  },
  challenge: { borderRadius: radius.sm, padding: space.sm, gap: 6, marginTop: 4 },
  challengeRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  track: { flex: 1, height: 6, borderRadius: 3, overflow: 'hidden' },
  fill: { height: 6, borderRadius: 3 },
  icon: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  action: {
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    minHeight: 38,
    justifyContent: 'center',
  },
});
