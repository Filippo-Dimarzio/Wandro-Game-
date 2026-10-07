import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GameBackdrop } from '@/components/GameBackdrop';
import { ScreenHeader } from '@/components/ScreenHeader';
import {
  useBlankPhotoSweep,
  useIsModerator,
  useModerationActions,
  useModerationQueue,
} from '@/data/moderation';
import { t } from '@/i18n';
import { radius, space, useColors } from '@/theme';

export default function Moderation() {
  const c = useColors();
  const isMod = useIsModerator();
  const queue = useModerationQueue();
  const actions = useModerationActions();
  const sweep = useBlankPhotoSweep();

  if (!isMod) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
        <GameBackdrop />
        <ScreenHeader title={t('mod.title')} />
        <Text style={{ color: c.textMuted, padding: space.lg }}>{t('mod.forbidden')}</Text>
      </SafeAreaView>
    );
  }
  const q = queue.data;
  const empty = q && !q.submissions.length && !q.reports.length && !q.flagged.length;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <GameBackdrop />
      <ScreenHeader title={t('mod.title')} />
      <ScrollView contentContainerStyle={styles.container}>
        {queue.isLoading && <ActivityIndicator />}
        {empty && <Text style={{ color: c.textMuted }}>{t('mod.empty')}</Text>}

        <View style={[styles.card, { backgroundColor: c.surface }]}>
          <Text style={{ color: c.text, fontWeight: '800' }}>{t('mod.photos')}</Text>
          <Text style={{ color: c.textMuted }}>{t('mod.photosHint')}</Text>
          <Pressable
            onPress={() => sweep.mutate()}
            disabled={sweep.isPending}
            accessibilityRole="button"
            style={[styles.btn, { backgroundColor: c.accent, alignSelf: 'flex-start' }]}
            testID="sweep-photos"
          >
            <Text style={{ color: c.accentOn, fontWeight: '800' }}>{t('mod.photosSweep')}</Text>
          </Pressable>
          {sweep.data && (
            <Text style={{ color: c.text }} testID="sweep-result">
              {t('mod.photosResult', sweep.data)}
            </Text>
          )}
          {sweep.isError && <Text style={{ color: c.danger }}>{t('mod.photosFailed')}</Text>}
        </View>

        {!!q?.submissions.length && (
          <Text style={[styles.section, { color: c.text }]}>{t('mod.submissions')}</Text>
        )}
        {q?.submissions.map((s) => (
          <View key={s.id} style={[styles.card, { backgroundColor: c.surface }]}>
            <Text style={{ color: c.text, fontWeight: '800', fontSize: 16 }}>{s.name}</Text>
            <Text style={{ color: c.textMuted }}>
              {t(`category.${s.category}`)} · {s.lat.toFixed(4)}, {s.lng.toFixed(4)} · @{s.username}
            </Text>
            {!!s.description && <Text style={{ color: c.text }}>{s.description}</Text>}
            <Actions
              yes={t('mod.approve')}
              no={t('mod.reject')}
              onYes={() => actions.reviewSubmission.mutate({ id: s.id, approve: true })}
              onNo={() => actions.reviewSubmission.mutate({ id: s.id, approve: false })}
            />
          </View>
        ))}

        {!!q?.reports.length && (
          <Text style={[styles.section, { color: c.text }]}>{t('mod.reports')}</Text>
        )}
        {q?.reports.map((r) => (
          <View key={r.id} style={[styles.card, { backgroundColor: c.surface }]}>
            <Text style={{ color: c.text, fontWeight: '700' }}>
              {r.targetType} · {r.reason}
            </Text>
            <Actions
              yes={t('mod.remove')}
              no={t('mod.dismiss')}
              onYes={() => actions.resolveReport.mutate({ id: r.id, remove: true })}
              onNo={() => actions.resolveReport.mutate({ id: r.id, remove: false })}
            />
          </View>
        ))}

        {!!q?.flagged.length && (
          <Text style={[styles.section, { color: c.text }]}>{t('mod.flagged')}</Text>
        )}
        {q?.flagged.map((f) => (
          <View key={f.id} style={[styles.card, { backgroundColor: c.surface }]}>
            <Text style={{ color: c.text, fontWeight: '700' }}>
              @{f.username} · {f.place}
            </Text>
            <Text style={{ color: c.textMuted }}>{f.reason}</Text>
            <Actions
              yes={t('mod.approve')}
              no={t('mod.reject')}
              onYes={() => actions.reviewFlagged.mutate({ id: f.id, approve: true })}
              onNo={() => actions.reviewFlagged.mutate({ id: f.id, approve: false })}
            />
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function Actions({
  yes,
  no,
  onYes,
  onNo,
}: {
  yes: string;
  no: string;
  onYes: () => void;
  onNo: () => void;
}) {
  const c = useColors();
  return (
    <View style={styles.row}>
      <Pressable
        onPress={onYes}
        accessibilityRole="button"
        style={[styles.btn, { backgroundColor: c.accent }]}
      >
        <Text style={{ color: c.accentOn, fontWeight: '800' }}>{yes}</Text>
      </Pressable>
      <Pressable
        onPress={onNo}
        accessibilityRole="button"
        style={[styles.btn, { borderColor: c.border, borderWidth: 1 }]}
      >
        <Text style={{ color: c.text, fontWeight: '700' }}>{no}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: space.lg, gap: space.md },
  section: { fontSize: 18, fontWeight: '800', marginTop: space.sm },
  card: { borderRadius: radius.md, padding: space.md, gap: space.sm },
  row: { flexDirection: 'row', gap: space.sm },
  btn: {
    flex: 1,
    borderRadius: radius.pill,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
