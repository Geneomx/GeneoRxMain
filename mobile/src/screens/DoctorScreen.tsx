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
import { useAuth } from '@/auth/AuthContext';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { useTranslation } from '@/hooks/useTranslation';
import { ApiError } from '@/api/client';
import { colors, radius, spacing, touchMin } from '@/theme';
import {
  askDoctor,
  fetchAppointments,
  fetchDoctorMessages,
  fetchDoctorSlots,
  fetchDoctors,
  replyToThread,
  requestAppointment,
  setDoctorShare,
  type AppointmentMode,
  type AppointmentRequest,
  type DaySlots,
  type Doctor,
  type DoctorMessage,
} from '@/api/doctors';

type Tab = 'ask' | 'appointments';

const MODES: AppointmentMode[] = ['chat', 'call', 'visit'];

/** How far ahead to offer days. The server allows 30. */
const DAYS_SHOWN = 14;

/** YYYY-MM-DD, n days from today. */
function isoIn(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

/** ISO weekday (1 = Monday … 7 = Sunday) for a YYYY-MM-DD date. */
function isoWeekday(date: string): number {
  const day = new Date(`${date}T00:00:00`).getDay();
  return day === 0 ? 7 : day;
}

function prettyDate(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
}

/**
 * Ask a doctor a question, and book an appointment.
 *
 * A question is a conversation: either side adds a turn, and a follow-up puts
 * the thread back in the doctor's queue rather than disappearing after one
 * answer. An appointment is a real booking on the doctor's own timetable —
 * doctor, then day, then one of their free times. A time somebody else holds
 * stays visible but disabled, because hiding it makes a half-empty day look
 * arbitrary.
 *
 * Both say plainly what they are before anything is sent: a message box in a
 * health app implies somebody is reading it, and a reply can take days.
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

  // Ask a question
  const [doctorId, setDoctorId] = useState<number | null>(null);
  const [body, setBody] = useState('');
  const [mobile, setMobile] = useState('');

  // Follow-ups, one draft per conversation.
  const [replyDrafts, setReplyDrafts] = useState<Record<number, string>>({});
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [sharingWith, setSharingWith] = useState<number | null>(null);

  // Book an appointment. A booking needs a named doctor — a time belongs to
  // somebody's calendar — so this is separate from the question's "any doctor".
  const [apptDoctorId, setApptDoctorId] = useState<number | null>(null);
  const [day, setDay] = useState<string | null>(null);
  const [daySlots, setDaySlots] = useState<DaySlots | null>(null);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsFailed, setSlotsFailed] = useState(false);
  const [slotAt, setSlotAt] = useState<string | null>(null);
  const [mode, setMode] = useState<AppointmentMode>('visit');
  const [note, setNote] = useState('');

  const days = useMemo(() => Array.from({ length: DAYS_SHOWN }, (_, i) => isoIn(i)), []);
  const apptDoctor = doctors.find((d) => d.id === apptDoctorId) ?? null;

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

  /** The chosen doctor's times for the chosen day. */
  const loadSlots = useCallback(async () => {
    setSlotAt(null);
    if (!apptDoctorId || !day) {
      setDaySlots(null);
      return;
    }
    setSlotsLoading(true);
    setSlotsFailed(false);
    try {
      setDaySlots(await fetchDoctorSlots(apptDoctorId, day));
    } catch {
      setDaySlots(null);
      setSlotsFailed(true);
    } finally {
      setSlotsLoading(false);
    }
  }, [apptDoctorId, day]);

  useEffect(() => {
    loadSlots();
  }, [loadSlots]);

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

  const sendReply = async (threadId: number) => {
    const text = (replyDrafts[threadId] ?? '').trim();
    if (!text || replyingTo !== null) return;
    setReplyingTo(threadId);
    try {
      await replyToThread(threadId, text);
      setReplyDrafts((prev) => ({ ...prev, [threadId]: '' }));
      await load();
    } catch (e) {
      // 409 here means the doctor closed the conversation while it was open.
      const closed = e instanceof ApiError && e.status === 409;
      Alert.alert(t('doctor.failed_title'), closed ? t('doctor.chat_closed') : t('doctor.failed_body'));
    } finally {
      setReplyingTo(null);
    }
  };

  /** Let one named doctor see the health summary, or take it back. */
  const toggleShare = async (d: Doctor) => {
    if (sharingWith !== null) return;
    setSharingWith(d.id);
    try {
      const res = await setDoctorShare(d.id, !d.shared);
      setDoctors((prev) => prev.map((x) => (x.id === d.id ? { ...x, shared: res.shared } : x)));
    } catch {
      Alert.alert(t('doctor.failed_title'), t('doctor.failed_body'));
    } finally {
      setSharingWith(null);
    }
  };

  const openRequest = appointments.find((a) => a.status === 'requested');

  const book = async () => {
    if (sending || !apptDoctorId || !slotAt) return;
    setSending(true);
    try {
      await requestAppointment({
        doctorId: apptDoctorId,
        slotAt,
        mode,
        note: note.trim() || null,
        contactMobile: mobile.trim() || null,
      });
      setNote('');
      setSlotAt(null);
      Alert.alert(t('doctor.appt_sent_title'), t('doctor.appt_sent_body'));
      await load();
      await loadSlots();
    } catch (e) {
      // 409 twice over: this patient already has an open request, or somebody
      // else took the time first. Each deserves its own sentence.
      const code = e instanceof ApiError ? (e.body as { code?: string } | null)?.code : undefined;
      const taken = code === 'slot_taken';
      Alert.alert(
        t('doctor.failed_title'),
        taken
          ? t('doctor.appt_slot_taken')
          : code === 'open_request'
            ? t('doctor.appt_already')
            : t('doctor.failed_body'),
      );
      // Their list is out of date if somebody beat them to it.
      if (taken) await loadSlots();
    } finally {
      setSending(false);
    }
  };

  const statusLabel = (s: string) => t(`doctor.status.${s}`);

  /** Times worth showing: one already gone is noise, one booked is not. */
  const bookable = (daySlots?.slots ?? []).filter((s) => s.reason !== 'past');

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

        {/* ── Ask ── */}
        {!loading && !isGuest && tab === 'ask' ? (
          <>
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
              {doctors.length === 0 ? <Text style={styles.fine}>{t('doctor.none_yet')}</Text> : null}

              <Text style={styles.label}>{t('doctor.your_question')}</Text>
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

            {/* Sharing is per doctor and revocable. */}
            {doctors.length ? (
              <>
                <Text style={styles.sectionTitle}>{t('doctor.share_title')}</Text>
                <View style={styles.card}>
                  <Text style={styles.fine}>{t('doctor.share_intro')}</Text>
                  {doctors.map((d) => (
                    <View key={d.id} style={styles.shareRow}>
                      <View style={styles.shareMeta}>
                        <Text style={styles.shareName}>{d.name}</Text>
                        <Text style={[styles.shareState, d.shared && styles.shareStateOn]}>
                          {d.shared ? t('doctor.share_on') : t('doctor.share_off')}
                        </Text>
                      </View>
                      <Pressable
                        onPress={() => toggleShare(d)}
                        disabled={sharingWith !== null}
                        style={[styles.chip, d.shared && styles.chipOn, sharingWith === d.id && styles.chipOff]}
                        accessibilityRole="button"
                      >
                        <Text style={[styles.chipText, d.shared && styles.chipTextOn]}>
                          {d.shared ? t('doctor.share_stop') : t('doctor.share_start')}
                        </Text>
                      </Pressable>
                    </View>
                  ))}
                  <Text style={styles.fine}>{t('doctor.share_note')}</Text>
                </View>
              </>
            ) : null}

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
                    <View
                      style={[
                        styles.pill,
                        m.status === 'answered'
                          ? styles.pillOk
                          : m.status === 'closed'
                            ? styles.pillDone
                            : styles.pillWait,
                      ]}
                    >
                      <Text
                        style={[
                          styles.pillText,
                          m.status === 'answered'
                            ? styles.pillTextOk
                            : m.status === 'closed'
                              ? styles.pillTextDone
                              : styles.pillTextWait,
                        ]}
                      >
                        {statusLabel(m.status)}
                      </Text>
                    </View>
                  </View>

                  {/* The conversation, oldest first, opening question included. */}
                  <View style={styles.chat}>
                    {m.thread.map((turn, i) => (
                      <View
                        key={`${turn.from}-${turn.id}-${i}`}
                        style={[styles.turn, turn.from === 'doctor' ? styles.turnRight : styles.turnLeft]}
                      >
                        <View style={[styles.bubble, turn.from === 'doctor' && styles.bubbleDoctor]}>
                          <Text style={styles.bubbleText}>{turn.body}</Text>
                        </View>
                        <Text style={styles.turnWho}>
                          {turn.from === 'doctor' ? (m.doctor ?? t('doctor.reply')) : t('doctor.you')}
                        </Text>
                      </View>
                    ))}
                  </View>

                  {m.status === 'closed' ? (
                    <Text style={styles.fine}>{t('doctor.chat_closed')}</Text>
                  ) : (
                    <>
                      {m.thread.length < 2 ? <Text style={styles.fine}>{t('doctor.waiting')}</Text> : null}
                      <Text style={styles.label}>{t('doctor.chat_reply_label')}</Text>
                      <TextInput
                        value={replyDrafts[m.id] ?? ''}
                        onChangeText={(v) => setReplyDrafts((prev) => ({ ...prev, [m.id]: v }))}
                        placeholder={t('doctor.chat_reply_hint')}
                        placeholderTextColor={colors.textDim}
                        multiline
                        maxLength={4000}
                        style={[styles.input, styles.inputMid]}
                      />
                      <View style={{ marginTop: spacing.sm }}>
                        <Button
                          title={replyingTo === m.id ? t('doctor.sending') : t('doctor.chat_send')}
                          variant="secondary"
                          onPress={() => sendReply(m.id)}
                          disabled={replyingTo !== null || !(replyDrafts[m.id] ?? '').trim()}
                        />
                      </View>
                    </>
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
            ) : doctors.length === 0 ? (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>{t('doctor.appt_new')}</Text>
                <Text style={styles.fine}>{t('doctor.appt_no_doctors')}</Text>
              </View>
            ) : (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>{t('doctor.appt_new')}</Text>
                <Text style={styles.fine}>{t('doctor.appt_not_booking')}</Text>

                <Text style={styles.label}>{t('doctor.appt_pick_doctor')}</Text>
                <View style={styles.chips}>
                  {doctors.map((d) => (
                    <Pressable
                      key={d.id}
                      onPress={() => {
                        setApptDoctorId(d.id);
                        // A day this doctor does not work must not stay chosen.
                        if (day && !d.available_days.includes(isoWeekday(day))) setDay(null);
                      }}
                      style={[styles.chip, apptDoctorId === d.id && styles.chipOn]}
                    >
                      <Text style={[styles.chipText, apptDoctorId === d.id && styles.chipTextOn]}>
                        {d.name}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                <Text style={styles.label}>{t('doctor.appt_pick_day')}</Text>
                <View style={styles.chips}>
                  {days.map((iso) => {
                    // Closed days are greyed rather than hidden: a patient should
                    // see that the day exists and this doctor is off.
                    const closed = !!apptDoctor && !apptDoctor.available_days.includes(isoWeekday(iso));
                    return (
                      <Pressable
                        key={iso}
                        onPress={() => !closed && setDay(iso)}
                        disabled={closed}
                        style={[styles.chip, day === iso && styles.chipOn, closed && styles.chipOff]}
                      >
                        <Text style={[styles.chipText, day === iso && styles.chipTextOn]}>
                          {prettyDate(iso)}
                        </Text>
                        {closed ? <Text style={styles.chipTag}>{t('doctor.appt_closed')}</Text> : null}
                      </Pressable>
                    );
                  })}
                </View>

                <Text style={styles.label}>{t('doctor.appt_pick_time')}</Text>
                {!apptDoctorId || !day ? (
                  <Text style={styles.fine}>{t('doctor.appt_choose_first')}</Text>
                ) : slotsLoading ? (
                  <ActivityIndicator color={colors.primary} style={styles.slotsSpinner} />
                ) : slotsFailed ? (
                  <Text style={styles.fine}>{t('doctor.appt_times_failed')}</Text>
                ) : !daySlots?.open || bookable.length === 0 ? (
                  <Text style={styles.fine}>{t('doctor.appt_no_times')}</Text>
                ) : (
                  <View style={styles.chips}>
                    {bookable.map((s) => (
                      <Pressable
                        key={s.at}
                        onPress={() => s.available && setSlotAt(s.at)}
                        disabled={!s.available}
                        style={[styles.chip, slotAt === s.at && styles.chipOn, !s.available && styles.chipOff]}
                      >
                        <Text style={[styles.chipText, slotAt === s.at && styles.chipTextOn]}>
                          {s.time}–{s.ends}
                        </Text>
                        {!s.available ? <Text style={styles.chipTag}>{t('doctor.appt_booked')}</Text> : null}
                      </Pressable>
                    ))}
                  </View>
                )}

                <Text style={styles.label}>{t('doctor.appt_mode')}</Text>
                <View style={styles.chips}>
                  {MODES.map((m) => (
                    <Pressable
                      key={m}
                      onPress={() => setMode(m)}
                      style={[styles.chip, mode === m && styles.chipOn]}
                    >
                      <Text style={[styles.chipText, mode === m && styles.chipTextOn]}>
                        {t(`doctor.mode.${m}`)}
                      </Text>
                    </Pressable>
                  ))}
                </View>
                <Text style={styles.fine}>{t('doctor.appt_mode_note')}</Text>

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
                    title={sending ? t('doctor.sending') : t('doctor.appt_book')}
                    onPress={book}
                    disabled={sending || !slotAt}
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
                        a.status === 'confirmed'
                          ? styles.pillOk
                          : a.status === 'declined'
                            ? styles.pillNo
                            : styles.pillWait,
                      ]}
                    >
                      <Text
                        style={[
                          styles.pillText,
                          a.status === 'confirmed'
                            ? styles.pillTextOk
                            : a.status === 'declined'
                              ? styles.pillTextNo
                              : styles.pillTextWait,
                        ]}
                      >
                        {statusLabel(a.status)}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.msgBody}>
                    {a.preferred_date ? prettyDate(a.preferred_date) : t('doctor.appt_no_date')}
                    {/* A booked slot shows its real time; a plain request from an
                        older build still only has a time of day. */}
                    {a.slot_time ? ` · ${a.slot_time}–${a.slot_ends}` : ''}
                    {!a.slot_time && a.preferred_time ? ` · ${t(`doctor.window.${a.preferred_time}`)}` : ''}
                    {` · ${t(`doctor.mode.${a.mode}`)}`}
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
  inputMid: { minHeight: 76, textAlignVertical: 'top' },
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
  /** A closed day, or a time somebody already holds: shown, not hidden. */
  chipOff: { opacity: 0.45 },
  chipText: { fontSize: 15, color: colors.textSoft },
  chipTextOn: { color: colors.primary, fontWeight: '700' },
  chipTag: { fontSize: 10, fontWeight: '800', letterSpacing: 0.4, color: colors.textDim, marginTop: 1 },

  shareRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSoft,
  },
  shareMeta: { flex: 1, minWidth: 0 },
  shareName: { fontSize: 16, fontWeight: '700', color: colors.text },
  shareState: { fontSize: 12, fontWeight: '800', letterSpacing: 0.3, color: colors.textDim, marginTop: 2 },
  shareStateOn: { color: colors.success },
  slotsSpinner: { alignSelf: 'flex-start', marginTop: 6 },

  rowTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  who: { flex: 1, fontSize: 16, fontWeight: '700', color: colors.text },
  msgBody: { fontSize: 16, lineHeight: 23, color: colors.text },

  /* Conversation bubbles: the patient on the left, the doctor on the right. */
  chat: { gap: spacing.sm, marginTop: 2 },
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
  bubbleDoctor: {
    borderColor: 'rgba(52, 211, 153, 0.32)',
    backgroundColor: colors.successBg,
    borderBottomLeftRadius: radius.md,
    borderBottomRightRadius: 4,
  },
  bubbleText: { fontSize: 16, lineHeight: 23, color: colors.text },
  turnWho: { fontSize: 12, color: colors.textDim, marginTop: 3 },

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
