import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AmbientBackground } from '@/components/AmbientBackground';
import { Button } from '@/components/Button';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { useTranslation } from '@/hooks/useTranslation';
import { colors, radius, spacing } from '@/theme';
import {
  fetchClinicAppointments,
  respondToAppointment,
  type ClinicAppointment,
} from '@/api/clinic';

type Decision = 'confirmed' | 'declined' | 'done';

function prettyDate(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
}

function isToday(date: string | null): boolean {
  return !!date && date === new Date().toISOString().slice(0, 10);
}

/**
 * The doctor's appointments: today, then what is coming, then what is done.
 *
 * Confirming tells the patient it is going ahead; declining frees the time for
 * somebody else and sends them the reason. Both send a notification, so the
 * note written here is the thing the patient actually reads.
 */
export const ClinicAppointmentsScreen: React.FC = () => {
  const { t } = useTranslation();
  const { page, scrollBottom } = useResponsiveLayout();

  const [items, setItems] = useState<ClinicAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [failed, setFailed] = useState(false);
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [saving, setSaving] = useState<number | null>(null);

  const load = useCallback(async () => {
    setFailed(false);
    try {
      const res = await fetchClinicAppointments();
      setItems(res.appointments);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const groups = useMemo(() => {
    const live = items.filter((a) => a.status === 'requested' || a.status === 'confirmed');
    return {
      today: live.filter((a) => isToday(a.slot_date)),
      upcoming: live.filter((a) => a.slot_date && !isToday(a.slot_date)),
      undated: live.filter((a) => !a.slot_date),
      finished: items.filter((a) => a.status === 'declined' || a.status === 'done'),
    };
  }, [items]);

  const decide = async (a: ClinicAppointment, status: Decision) => {
    if (saving !== null) return;
    setSaving(a.id);
    try {
      await respondToAppointment(a.id, status, notes[a.id] ?? a.response);
      setNotes((prev) => ({ ...prev, [a.id]: '' }));
      await load();
    } catch {
      Alert.alert(t('clinic.failed_title'), t('clinic.failed_body'));
    } finally {
      setSaving(null);
    }
  };

  const card = (a: ClinicAppointment) => {
    const open = a.status === 'requested' || a.status === 'confirmed';
    return (
      <View key={a.id} style={styles.card}>
        <View style={styles.rowTop}>
          <Text style={styles.when}>
            {a.slot_time
              ? `${prettyDate(a.slot_date)} · ${a.slot_time}–${a.slot_ends}`
              : t('clinic.no_time')}
          </Text>
          <View
            style={[
              styles.pill,
              a.status === 'confirmed' ? styles.pillOk
                : a.status === 'declined' ? styles.pillNo
                  : a.status === 'done' ? styles.pillDone : styles.pillWait,
            ]}
          >
            <Text
              style={[
                styles.pillText,
                a.status === 'confirmed' ? styles.pillTextOk
                  : a.status === 'declined' ? styles.pillTextNo
                    : a.status === 'done' ? styles.pillTextDone : styles.pillTextWait,
              ]}
            >
              {t(`doctor.status.${a.status}`)}
            </Text>
          </View>
        </View>

        <Text style={styles.meta}>
          {a.patient ?? t('clinic.deleted_account')} · {a.mode_label}
          {a.contact_mobile ? ` · ${a.contact_mobile}` : ''}
        </Text>

        {a.note ? <Text style={styles.body}>{a.note}</Text> : null}

        {a.response ? (
          <View style={styles.said}>
            <Text style={styles.saidWho}>{t('clinic.you_said')}</Text>
            <Text style={styles.saidBody}>{a.response}</Text>
          </View>
        ) : null}

        {open ? (
          <>
            <Text style={styles.label}>{t('clinic.note_label')}</Text>
            <TextInput
              value={notes[a.id] ?? ''}
              onChangeText={(v) => setNotes((prev) => ({ ...prev, [a.id]: v }))}
              placeholder={t('clinic.note_hint')}
              placeholderTextColor={colors.textDim}
              multiline
              maxLength={2000}
              style={styles.input}
            />
            <View style={styles.actions}>
              {a.status !== 'confirmed' ? (
                <View style={styles.action}>
                  <Button
                    title={saving === a.id ? t('clinic.saving') : t('clinic.confirm')}
                    onPress={() => decide(a, 'confirmed')}
                    disabled={saving !== null}
                  />
                </View>
              ) : null}
              <View style={styles.action}>
                <Button
                  title={t('clinic.decline')}
                  variant="secondary"
                  onPress={() => decide(a, 'declined')}
                  disabled={saving !== null}
                />
              </View>
              {a.status === 'confirmed' ? (
                <View style={styles.action}>
                  <Button
                    title={t('clinic.mark_done')}
                    variant="secondary"
                    onPress={() => decide(a, 'done')}
                    disabled={saving !== null}
                  />
                </View>
              ) : null}
            </View>
            {/* Declining is not just a status: the time goes back on offer. */}
            <Text style={styles.fine}>{t('clinic.decline_note')}</Text>
          </>
        ) : null}
      </View>
    );
  };

  const section = (title: string, list: ClinicAppointment[], empty: string) => (
    <>
      <Text style={styles.sectionTitle}>{title}</Text>
      {list.length === 0 ? (
        <View style={styles.card}>
          <Text style={styles.fine}>{empty}</Text>
        </View>
      ) : (
        list.map(card)
      )}
    </>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <AmbientBackground />

      <View style={[page, styles.head]}>
        <Text style={styles.h1}>{t('clinic.appointments_title')}</Text>
        <Text style={styles.sub}>{t('clinic.appointments_sub')}</Text>
      </View>

      <ScrollView
        contentContainerStyle={[page, styles.bodyWrap, { paddingBottom: scrollBottom }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
            tintColor={colors.primary}
          />
        }
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {loading ? <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.lg }} /> : null}

        {failed ? (
          <View style={styles.notice}>
            <Text style={styles.noticeText}>{t('clinic.load_failed')}</Text>
          </View>
        ) : null}

        {!loading ? (
          <>
            {section(t('clinic.today'), groups.today, t('clinic.today_empty'))}
            {section(t('clinic.upcoming'), groups.upcoming, t('clinic.upcoming_empty'))}
            {groups.undated.length ? section(t('clinic.undated'), groups.undated, '') : null}
            {groups.finished.length ? section(t('clinic.finished'), groups.finished, '') : null}
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  head: { paddingTop: spacing.sm, gap: 4, paddingBottom: spacing.sm },
  h1: { fontSize: 24, fontWeight: '800', color: colors.text, letterSpacing: -0.5 },
  sub: { fontSize: 15, lineHeight: 21, color: colors.textMuted },

  bodyWrap: { gap: spacing.sm, paddingTop: spacing.sm },

  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textMuted,
    marginTop: spacing.md,
    letterSpacing: 0.2,
  },

  card: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    borderRadius: radius.card,
    padding: spacing.md,
    gap: spacing.sm,
  },
  rowTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  when: { flex: 1, fontSize: 16, fontWeight: '700', color: colors.text },
  meta: { fontSize: 14, color: colors.textMuted },
  body: { fontSize: 16, lineHeight: 23, color: colors.text },
  fine: { fontSize: 13, lineHeight: 19, color: colors.textDim },

  label: { fontSize: 14, fontWeight: '600', color: colors.textSoft, marginTop: 2 },
  input: {
    minHeight: 76,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.inputBg,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
  },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  action: { flexGrow: 1, minWidth: 140 },

  said: {
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
    backgroundColor: colors.primary50,
    borderRadius: radius.sm,
    padding: spacing.md,
    gap: 4,
  },
  saidWho: { fontSize: 13, fontWeight: '700', color: colors.primary },
  saidBody: { fontSize: 16, lineHeight: 23, color: colors.text },

  notice: {
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.32)',
    backgroundColor: colors.warningBg,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  noticeText: { fontSize: 14, lineHeight: 20, color: colors.text },

  pill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.pill },
  pillWait: { backgroundColor: colors.warningBg },
  pillOk: { backgroundColor: colors.successBg },
  pillNo: { backgroundColor: colors.dangerBg },
  pillDone: { backgroundColor: colors.ghostBg },
  pillText: { fontSize: 12, fontWeight: '800' },
  pillTextWait: { color: colors.warning },
  pillTextOk: { color: colors.success },
  pillTextNo: { color: colors.danger },
  pillTextDone: { color: colors.textMuted },
});
