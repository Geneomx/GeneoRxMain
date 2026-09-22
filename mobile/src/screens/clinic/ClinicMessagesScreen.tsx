import React, { useCallback, useEffect, useState } from 'react';
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
  closeThread,
  fetchClinicThreads,
  fetchPatientSummary,
  markThreadRead,
  replyAsDoctor,
  type ClinicThread,
  type PatientSummary,
} from '@/api/clinic';

/**
 * The doctor's conversations, and the one they have opened.
 *
 * A list and a reading view rather than a separate screen: the doctor's whole
 * job here is read-then-reply, and a push notification should land them in the
 * conversation, not in a list they then have to search.
 */
export const ClinicMessagesScreen: React.FC = () => {
  const { t } = useTranslation();
  const { page, scrollBottom } = useResponsiveLayout();

  const [threads, setThreads] = useState<ClinicThread[]>([]);
  const [openId, setOpenId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [failed, setFailed] = useState(false);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [summary, setSummary] = useState<PatientSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  const open = threads.find((x) => x.id === openId) ?? null;

  const load = useCallback(async () => {
    setFailed(false);
    try {
      const res = await fetchClinicThreads();
      setThreads(res.threads);
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

  const openThread = async (thread: ClinicThread) => {
    setOpenId(thread.id);
    setDraft('');
    // A new conversation means a different patient's summary.
    setSummary(null);
    if (thread.unread > 0) {
      // Opening it is what marks the patient's turns as seen.
      try {
        await markThreadRead(thread.id);
        setThreads((prev) => prev.map((x) => (x.id === thread.id ? { ...x, unread: 0 } : x)));
      } catch {
        // Not worth interrupting the doctor over; it retries on the next open.
      }
    }
  };

  const send = async () => {
    if (!open || sending || !draft.trim()) return;
    setSending(true);
    try {
      const res = await replyAsDoctor(open.id, draft.trim());
      setDraft('');
      setThreads((prev) => prev.map((x) => (x.id === open.id ? res.thread : x)));
    } catch {
      Alert.alert(t('clinic.failed_title'), t('clinic.reply_failed'));
      await load();
    } finally {
      setSending(false);
    }
  };

  /**
   * Fetched only when the doctor asks for it, so a patient's medications are
   * never carried around inside a list of conversations.
   */
  const loadSummary = async () => {
    if (!open?.patient_id || summaryLoading) return;
    setSummaryLoading(true);
    try {
      setSummary(await fetchPatientSummary(open.patient_id));
    } catch {
      Alert.alert(t('clinic.failed_title'), t('clinic.summary_failed'));
    } finally {
      setSummaryLoading(false);
    }
  };

  const finish = async () => {
    if (!open) return;
    Alert.alert(t('clinic.close_title'), t('clinic.close_body'), [
      { text: t('common.no'), style: 'cancel' },
      {
        text: t('clinic.close_confirm'),
        style: 'destructive',
        onPress: async () => {
          try {
            await closeThread(open.id);
            setOpenId(null);
            await load();
          } catch {
            Alert.alert(t('clinic.failed_title'), t('clinic.failed_body'));
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <AmbientBackground />

      <View style={[page, styles.head]}>
        <Text style={styles.h1}>
          {open ? (open.patient ?? t('clinic.deleted_account')) : t('clinic.messages_title')}
        </Text>
        <Text style={styles.sub}>
          {open
            ? open.contact_mobile
              ? t('clinic.patient_gave_number', { number: open.contact_mobile })
              : t('clinic.thread_sub')
            : t('clinic.messages_sub')}
        </Text>
        {open ? (
          <Pressable onPress={() => setOpenId(null)} style={styles.back} hitSlop={8}>
            <Text style={styles.backText}>‹ {t('clinic.all_messages')}</Text>
          </Pressable>
        ) : null}
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

        {/* ── One conversation ── */}
        {/* Only offered when this patient has chosen to share it. */}
        {!loading && open && open.summary_shared ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{t('clinic.summary_title')}</Text>
            {!summary ? (
              <>
                <Text style={styles.fine}>{t('clinic.summary_intro')}</Text>
                <View style={{ marginTop: spacing.sm }}>
                  <Button
                    title={summaryLoading ? t('clinic.summary_loading') : t('clinic.summary_view')}
                    variant="secondary"
                    onPress={loadSummary}
                    disabled={summaryLoading}
                  />
                </View>
              </>
            ) : (
              <>
                <Text style={styles.sumLine}>
                  {t('clinic.summary_age')}: {summary.age ?? '—'} · {t('clinic.summary_gender')}:{' '}
                  {summary.gender ?? '—'} · {t('clinic.summary_checkins')}: {summary.checkins_total}
                </Text>

                {summary.flags.length ? (
                  <View style={styles.flags}>
                    {summary.flags.map((f) => (
                      <View key={f} style={styles.flag}>
                        <Text style={styles.flagText}>{f}</Text>
                      </View>
                    ))}
                  </View>
                ) : null}

                <Text style={styles.sumLine}>
                  {t('clinic.summary_medicines')}:{' '}
                  {summary.medications.length ? summary.medications.join(', ') : t('clinic.summary_none')}
                </Text>
                <Text style={styles.sumLine}>
                  {t('clinic.summary_symptoms')}:{' '}
                  {summary.symptoms.length ? summary.symptoms.join(', ') : t('clinic.summary_none')}
                </Text>

                {summary.latest_checkin ? (
                  <>
                    <Text style={styles.sumLine}>
                      {t('clinic.summary_last_checkin')}: {summary.latest_checkin.date ?? '—'}
                      {summary.latest_checkin.adherence !== null
                        ? ` · ${t('clinic.summary_took', { percent: summary.latest_checkin.adherence })}`
                        : ''}
                    </Text>
                    <View style={styles.ratings}>
                      {Object.entries(summary.latest_checkin.ratings).map(([key, value]) => (
                        <View key={key} style={styles.rating}>
                          {/* A skipped rating shows a dash. Never a zero — a
                              zero reads as "terrible", not "not answered". */}
                          <Text style={styles.ratingText}>
                            {key} {value === null ? '—' : `${value}/10`}
                          </Text>
                        </View>
                      ))}
                    </View>
                    {summary.latest_checkin.side_effects.length ? (
                      <Text style={styles.sumLine}>
                        {t('clinic.summary_side_effects')}: {summary.latest_checkin.side_effects.join(', ')}
                      </Text>
                    ) : null}
                    {summary.latest_checkin.notes ? (
                      <Text style={styles.sumLine}>
                        {t('clinic.summary_notes')}: {summary.latest_checkin.notes}
                      </Text>
                    ) : null}
                  </>
                ) : (
                  <Text style={styles.sumLine}>{t('clinic.summary_no_checkin')}</Text>
                )}

                <Text style={styles.fine}>{t('clinic.summary_self_reported')}</Text>
              </>
            )}
          </View>
        ) : null}

        {!loading && open ? (
          <View style={styles.card}>
            <View style={styles.chat}>
              {open.thread.map((turn, i) => (
                <View
                  key={`${turn.from}-${turn.id}-${i}`}
                  style={[styles.turn, turn.from === 'doctor' ? styles.turnRight : styles.turnLeft]}
                >
                  <View style={[styles.bubble, turn.from === 'doctor' && styles.bubbleMine]}>
                    <Text style={styles.bubbleText}>{turn.body}</Text>
                  </View>
                  <Text style={styles.turnWho}>
                    {turn.from === 'doctor' ? t('clinic.you') : (open.patient ?? t('clinic.patient'))}
                  </Text>
                </View>
              ))}
            </View>

            {open.status === 'closed' ? (
              <Text style={styles.fine}>{t('clinic.closed_note')}</Text>
            ) : (
              <>
                <Text style={styles.label}>{t('clinic.reply_label')}</Text>
                <TextInput
                  value={draft}
                  onChangeText={setDraft}
                  placeholder={t('clinic.reply_hint')}
                  placeholderTextColor={colors.textDim}
                  multiline
                  maxLength={4000}
                  style={styles.input}
                />
                <View style={{ marginTop: spacing.sm }}>
                  <Button
                    title={sending ? t('clinic.saving') : t('clinic.send_reply')}
                    onPress={send}
                    disabled={sending || !draft.trim()}
                  />
                </View>
                <Pressable onPress={finish} hitSlop={8} style={{ marginTop: spacing.sm }}>
                  <Text style={styles.closeLink}>{t('clinic.close_thread')}</Text>
                </Pressable>
              </>
            )}
          </View>
        ) : null}

        {/* ── The list ── */}
        {!loading && !open ? (
          threads.length === 0 ? (
            <View style={styles.card}>
              <Text style={styles.fine}>{t('clinic.no_messages')}</Text>
            </View>
          ) : (
            threads.map((th) => (
              <Pressable key={th.id} onPress={() => openThread(th)} style={styles.card}>
                <View style={styles.rowTop}>
                  <Text style={styles.who}>{th.patient ?? t('clinic.deleted_account')}</Text>
                  {th.unread > 0 ? (
                    <View style={[styles.pill, styles.pillNew]}>
                      <Text style={[styles.pillText, styles.pillTextNew]}>
                        {t('clinic.new_count', { count: th.unread })}
                      </Text>
                    </View>
                  ) : null}
                  <View
                    style={[
                      styles.pill,
                      th.status === 'answered' ? styles.pillOk
                        : th.status === 'closed' ? styles.pillDone : styles.pillWait,
                    ]}
                  >
                    <Text
                      style={[
                        styles.pillText,
                        th.status === 'answered' ? styles.pillTextOk
                          : th.status === 'closed' ? styles.pillTextDone : styles.pillTextWait,
                      ]}
                    >
                      {th.status === 'new' ? t('clinic.needs_reply') : t(`doctor.status.${th.status}`)}
                    </Text>
                  </View>
                </View>
                <Text style={styles.preview} numberOfLines={2}>{th.latest}</Text>
              </Pressable>
            ))
          )
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
  back: { marginTop: 4 },
  backText: { fontSize: 15, fontWeight: '700', color: colors.primary },

  bodyWrap: { gap: spacing.sm, paddingTop: spacing.sm },

  card: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    borderRadius: radius.card,
    padding: spacing.md,
    gap: spacing.sm,
  },
  rowTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  who: { flex: 1, fontSize: 16, fontWeight: '700', color: colors.text },
  preview: { fontSize: 15, lineHeight: 21, color: colors.textSoft },
  cardTitle: { fontSize: 17, fontWeight: '700', color: colors.text },
  sumLine: { fontSize: 15, lineHeight: 22, color: colors.text },
  flags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  flag: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    backgroundColor: colors.warningBg,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.32)',
  },
  flagText: { fontSize: 12, fontWeight: '800', color: colors.warning },
  ratings: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  rating: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  ratingText: { fontSize: 13, color: colors.textSoft },
  fine: { fontSize: 13, lineHeight: 19, color: colors.textDim },
  closeLink: { fontSize: 14, fontWeight: '600', color: colors.textMuted },

  label: { fontSize: 14, fontWeight: '600', color: colors.textSoft, marginTop: 2 },
  input: {
    minHeight: 96,
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

  /* The patient on the left, this doctor on the right. */
  chat: { gap: spacing.sm },
  turn: { maxWidth: '86%' },
  turnLeft: { alignSelf: 'flex-start', alignItems: 'flex-start' },
  turnRight: { alignSelf: 'flex-end', alignItems: 'flex-end' },
  bubble: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.buttonBg,
    borderRadius: radius.md,
    borderBottomLeftRadius: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  bubbleMine: {
    borderColor: 'rgba(40, 225, 255, 0.32)',
    backgroundColor: colors.primary50,
    borderBottomLeftRadius: radius.md,
    borderBottomRightRadius: 4,
  },
  bubbleText: { fontSize: 16, lineHeight: 23, color: colors.text },
  turnWho: { fontSize: 12, color: colors.textDim, marginTop: 3 },

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
  pillDone: { backgroundColor: colors.ghostBg },
  pillNew: { backgroundColor: colors.dangerBg },
  pillText: { fontSize: 12, fontWeight: '800' },
  pillTextWait: { color: colors.warning },
  pillTextOk: { color: colors.success },
  pillTextDone: { color: colors.textMuted },
  pillTextNew: { color: colors.danger },
});
