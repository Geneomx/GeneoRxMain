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
import { useAuth } from '@/auth/AuthContext';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { useTranslation } from '@/hooks/useTranslation';
import { colors, radius, spacing, touchMin } from '@/theme';
import {
  askDoctor,
  fetchAppointments,
  fetchDoctorMessages,
  fetchDoctors,
  requestAppointment,
  type AppointmentRequest,
  type Doctor,
  type DoctorMessage,
  type TimeWindow,
} from '@/api/doctors';

type Tab = 'ask' | 'appointments';

const TIME_WINDOWS: TimeWindow[] = ['morning', 'afternoon', 'evening'];

/** YYYY-MM-DD, n days from today. Used for the quick date choices. */
function isoIn(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function prettyDate(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
}

/**
 * Ask a doctor a question, and request an appointment.
 *
 * Both are asynchronous and the screen says so before anything is sent: a
 * message box in a health app implies somebody is reading it, and an
 * appointment "request" is not a booking. Those two notices are not decoration
 * — they are the difference between a useful feature and a dangerous one.
 */
export const DoctorScreen: React.FC = () => {
  const { t } = useTranslation();
  const { page, scrollBottom } = useResponsiveLayout();
  const { isGuest, signOut } = useAuth();

  const [tab, setTab] = useState<Tab>('ask');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sending, setSending] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [messages, setMessages] = useState<DoctorMessage[]>([]);
  const [appointments, setAppointments] = useState<AppointmentRequest[]>([]);

  // Compose state
  const [doctorId, setDoctorId] = useState<number | null>(null);
  const [body, setBody] = useState('');
  const [mobile, setMobile] = useState('');
  const [date, setDate] = useState<string | null>(null);
  const [window, setWindow] = useState<TimeWindow | null>(null);
  const [note, setNote] = useState('');

  const load = useCallback(async () => {
    // Every doctor endpoint needs a real account (auth:sanctum). A guest holds
    // a local placeholder token, so the request would 401 — and an empty
    // directory with no explanation is the worst possible way to show that.
    if (isGuest) {
      setLoading(false);
      setRefreshing(false);
      return;
    }
    setLoadError(false);
    try {
      const [d, m, a] = await Promise.all([
        fetchDoctors(),
        fetchDoctorMessages(),
        fetchAppointments(),
      ]);
      setDoctors(d);
      setMessages(m);
      setAppointments(a);
    } catch {
      // Say so. Swallowing this silently is how a 401, a missing table and
      // "no doctors yet" all looked identical on the phone.
      setLoadError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isGuest]);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  const send = async () => {
    if (!body.trim() || sending) return;
    setSending(true);
    try {
      await askDoctor({ doctorId, body: body.trim(), contactMobile: mobile.trim() || null });
      setBody('');
      Alert.alert(t('doctor.sent_title'), t('doctor.sent_body'));
      await load();
    } catch {
      Alert.alert(t('doctor.failed_title'), t('doctor.failed_body'));
    } finally {
      setSending(false);
    }
  };

  const openRequest = appointments.find((a) => a.status === 'requested');

  const submitAppointment = async () => {
    if (sending) return;
    setSending(true);
    try {
      await requestAppointment({
        doctorId,
        preferredDate: date,
        preferredTime: window,
        note: note.trim() || null,
        contactMobile: mobile.trim() || null,
      });
      setNote('');
      setDate(null);
      setWindow(null);
      Alert.alert(t('doctor.appt_sent_title'), t('doctor.appt_sent_body'));
      await load();
    } catch (e) {
      // The server returns 409 when one is already open. That is worth saying
      // plainly, because the patient's first request is still live.
      const already = String((e as Error)?.message ?? '').includes('409');
      Alert.alert(
        t('doctor.failed_title'),
        already ? t('doctor.appt_already') : t('doctor.failed_body'),
      );
    } finally {
      setSending(false);
    }
  };

  const statusLabel = (s: string) => t(`doctor.status.${s}`);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <AmbientBackground />

      <View style={[page, styles.head]}>
        <Text style={styles.h1}>{t('doctor.title')}</Text>
        <Text style={styles.sub}>{t('doctor.sub')}</Text>

        <View style={styles.segment}>
          {(['ask', 'appointments'] as Tab[]).map((k) => (
            <Pressable
              key={k}
              onPress={() => setTab(k)}
              style={[styles.seg, tab === k && styles.segOn]}
              accessibilityRole="tab"
              accessibilityState={{ selected: tab === k }}
            >
              <Text style={[styles.segText, tab === k && styles.segTextOn]}>
                {t(`doctor.tab.${k}`)}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[page, styles.body, { paddingBottom: scrollBottom }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* The boundary, before anything can be sent. */}
        <View style={styles.notice}>
          <Text style={styles.noticeText}>{t('doctor.not_emergency')}</Text>
        </View>

        {isGuest ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{t('doctor.guest_title')}</Text>
            <Text style={styles.sub}>{t('doctor.guest_body')}</Text>
            <View style={{ marginTop: spacing.sm }}>
              {/* For a guest, signOut() clears the placeholder token, which
                  returns the app to the sign-in / create-account screen. */}
              <Button title={t('doctor.guest_cta')} onPress={() => signOut()} />
            </View>
          </View>
        ) : null}

        {loadError && !isGuest ? (
          <View style={styles.notice}>
            <Text style={styles.noticeText}>{t('doctor.load_failed')}</Text>
          </View>
        ) : null}

        {loading ? <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.lg }} /> : null}

        {/* ── Who to ask ── */}
        {!loading && !isGuest ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{t('doctor.who')}</Text>
            <View style={styles.chips}>
              <Pressable
                onPress={() => setDoctorId(null)}
                style={[styles.chip, doctorId === null && styles.chipOn]}
              >
                <Text style={[styles.chipText, doctorId === null && styles.chipTextOn]}>
                  {t('doctor.any')}
                </Text>
              </Pressable>
              {doctors.map((d) => (
                <Pressable
                  key={d.id}
                  onPress={() => setDoctorId(d.id)}
                  style={[styles.chip, doctorId === d.id && styles.chipOn]}
                >
                  <Text style={[styles.chipText, doctorId === d.id && styles.chipTextOn]}>
                    {d.name}
                  </Text>
                </Pressable>
              ))}
            </View>
            {doctors.length === 0 ? (
              <Text style={styles.fine}>{t('doctor.none_yet')}</Text>
            ) : null}
          </View>
        ) : null}

        {/* ── Ask ── */}
        {!loading && !isGuest && tab === 'ask' ? (
          <>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{t('doctor.your_question')}</Text>
              <TextInput
                value={body}
                onChangeText={setBody}
                placeholder={t('doctor.question_hint')}
                placeholderTextColor={colors.textDim}
                multiline
                maxLength={4000}
                style={[styles.input, styles.inputTall]}
              />

              <Text style={styles.label}>{t('doctor.mobile_label')}</Text>
              <TextInput
                value={mobile}
                onChangeText={setMobile}
                placeholder={t('doctor.mobile_hint')}
                placeholderTextColor={colors.textDim}
                keyboardType="phone-pad"
                maxLength={40}
                style={styles.input}
              />
              <Text style={styles.fine}>{t('doctor.mobile_note')}</Text>

              <View style={{ marginTop: spacing.md }}>
                <Button
                  title={sending ? t('doctor.sending') : t('doctor.send')}
                  onPress={send}
                  disabled={sending || !body.trim()}
                />
              </View>
            </View>

            <Text style={styles.sectionTitle}>{t('doctor.your_questions')}</Text>
            {messages.length === 0 ? (
              <View style={styles.card}>
                <Text style={styles.fine}>{t('doctor.no_questions')}</Text>
              </View>
            ) : (
              messages.map((m) => (
                <View key={m.id} style={styles.card}>
                  <View style={styles.rowTop}>
                    <Text style={styles.who}>{m.doctor ?? t('doctor.any')}</Text>
                    <View style={[styles.pill, m.reply ? styles.pillOk : styles.pillWait]}>
                      <Text style={[styles.pillText, m.reply ? styles.pillTextOk : styles.pillTextWait]}>
                        {statusLabel(m.status)}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.msgBody}>{m.body}</Text>
                  {m.reply ? (
                    <View style={styles.reply}>
                      <Text style={styles.replyWho}>
                        {m.doctor ? t('doctor.reply_from', { name: m.doctor }) : t('doctor.reply')}
                      </Text>
                      <Text style={styles.replyBody}>{m.reply}</Text>
                    </View>
                  ) : (
                    <Text style={styles.fine}>{t('doctor.waiting')}</Text>
                  )}
                </View>
              ))
            )}
          </>
        ) : null}

        {/* ── Appointments ── */}
        {!loading && !isGuest && tab === 'appointments' ? (
          <>
            {openRequest ? (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>{t('doctor.appt_open_title')}</Text>
                <Text style={styles.fine}>{t('doctor.appt_open_body')}</Text>
              </View>
            ) : (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>{t('doctor.appt_new')}</Text>
                <Text style={styles.fine}>{t('doctor.appt_not_booking')}</Text>

                <Text style={styles.label}>{t('doctor.appt_when')}</Text>
                <View style={styles.chips}>
                  {[1, 3, 7, 14].map((n) => {
                    const iso = isoIn(n);
                    return (
                      <Pressable
                        key={n}
                        onPress={() => setDate(date === iso ? null : iso)}
                        style={[styles.chip, date === iso && styles.chipOn]}
                      >
                        <Text style={[styles.chipText, date === iso && styles.chipTextOn]}>
                          {prettyDate(iso)}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                <Text style={styles.label}>{t('doctor.appt_time')}</Text>
                <View style={styles.chips}>
                  {TIME_WINDOWS.map((w) => (
                    <Pressable
                      key={w}
                      onPress={() => setWindow(window === w ? null : w)}
                      style={[styles.chip, window === w && styles.chipOn]}
                    >
                      <Text style={[styles.chipText, window === w && styles.chipTextOn]}>
                        {t(`doctor.window.${w}`)}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                <Text style={styles.label}>{t('doctor.appt_note')}</Text>
                <TextInput
                  value={note}
                  onChangeText={setNote}
                  placeholder={t('doctor.appt_note_hint')}
                  placeholderTextColor={colors.textDim}
                  multiline
                  maxLength={2000}
                  style={[styles.input, styles.inputTall]}
                />

                <Text style={styles.label}>{t('doctor.mobile_label')}</Text>
                <TextInput
                  value={mobile}
                  onChangeText={setMobile}
                  placeholder={t('doctor.mobile_hint')}
                  placeholderTextColor={colors.textDim}
                  keyboardType="phone-pad"
                  maxLength={40}
                  style={styles.input}
                />

                <View style={{ marginTop: spacing.md }}>
                  <Button
                    title={sending ? t('doctor.sending') : t('doctor.appt_send')}
                    onPress={submitAppointment}
                    disabled={sending}
                  />
                </View>
              </View>
            )}

            <Text style={styles.sectionTitle}>{t('doctor.your_appts')}</Text>
            {appointments.length === 0 ? (
              <View style={styles.card}>
                <Text style={styles.fine}>{t('doctor.no_appts')}</Text>
              </View>
            ) : (
              appointments.map((a) => (
                <View key={a.id} style={styles.card}>
                  <View style={styles.rowTop}>
                    <Text style={styles.who}>{a.doctor ?? t('doctor.any')}</Text>
                    <View
                      style={[
                        styles.pill,
                        a.status === 'confirmed' ? styles.pillOk
                          : a.status === 'declined' ? styles.pillNo : styles.pillWait,
                      ]}
                    >
                      <Text
                        style={[
                          styles.pillText,
                          a.status === 'confirmed' ? styles.pillTextOk
                            : a.status === 'declined' ? styles.pillTextNo : styles.pillTextWait,
                        ]}
                      >
                        {statusLabel(a.status)}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.msgBody}>
                    {a.preferred_date ? prettyDate(a.preferred_date) : t('doctor.appt_no_date')}
                    {a.preferred_time ? ` · ${t(`doctor.window.${a.preferred_time}`)}` : ''}
                  </Text>
                  {a.note ? <Text style={styles.fine}>{a.note}</Text> : null}
                  {a.response ? (
                    <View style={styles.reply}>
                      <Text style={styles.replyWho}>{t('doctor.clinic_said')}</Text>
                      <Text style={styles.replyBody}>{a.response}</Text>
                    </View>
                  ) : null}
                </View>
              ))
            )}
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },

  head: { paddingTop: spacing.sm, gap: 4 },
  h1: { fontSize: 24, fontWeight: '800', color: colors.text, letterSpacing: -0.5 },
  sub: { fontSize: 15, lineHeight: 21, color: colors.textMuted },

  segment: {
    flexDirection: 'row',
    gap: 6,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  seg: {
    flex: 1,
    minHeight: 46,
    borderRadius: radius.button,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segOn: { backgroundColor: colors.primary50, borderColor: colors.primary },
  segText: { fontSize: 15, fontWeight: '700', color: colors.textSoft },
  segTextOn: { color: colors.primary },

  body: { gap: spacing.sm, paddingTop: spacing.sm },

  notice: {
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.32)',
    backgroundColor: colors.warningBg,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  noticeText: { fontSize: 14, lineHeight: 20, color: colors.text },

  card: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    borderRadius: radius.card,
    padding: spacing.md,
    gap: spacing.sm,
  },
  cardTitle: { fontSize: 17, fontWeight: '700', color: colors.text },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textMuted,
    marginTop: spacing.md,
    letterSpacing: 0.2,
  },

  label: { fontSize: 14, fontWeight: '600', color: colors.textSoft, marginTop: spacing.sm },
  input: {
    minHeight: touchMin,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.inputBg,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
  },
  inputTall: { minHeight: 104, textAlignVertical: 'top' },
  fine: { fontSize: 13, lineHeight: 19, color: colors.textDim },

  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  chip: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.ghostBg,
  },
  chipOn: { backgroundColor: colors.primary100, borderColor: colors.primary },
  chipText: { fontSize: 15, color: colors.textSoft },
  chipTextOn: { color: colors.primary, fontWeight: '700' },

  rowTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  who: { flex: 1, fontSize: 16, fontWeight: '700', color: colors.text },
  msgBody: { fontSize: 16, lineHeight: 23, color: colors.text },

  pill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.pill },
  pillWait: { backgroundColor: colors.warningBg },
  pillOk: { backgroundColor: colors.successBg },
  pillNo: { backgroundColor: colors.dangerBg },
  pillText: { fontSize: 12, fontWeight: '800' },
  pillTextWait: { color: colors.warning },
  pillTextOk: { color: colors.success },
  pillTextNo: { color: colors.danger },

  reply: {
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
    backgroundColor: colors.primary50,
    borderRadius: radius.sm,
    padding: spacing.md,
    gap: 4,
  },
  replyWho: { fontSize: 13, fontWeight: '700', color: colors.primary },
  replyBody: { fontSize: 16, lineHeight: 23, color: colors.text },
});
