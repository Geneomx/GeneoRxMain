import { EntryDraftSheet } from '@/components/EntryDraftSheet';
import { EditorSheet, refined } from '@/components/RefinedUI';
import { adherenceLabel, combinedAdherence, doseEntryValid, mergeDoseEntry } from '@/wizard/medicationTracking';
import * as Crypto from 'expo-crypto';
import React, { useRef, useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { AppText as Text } from '@/components/AppText';
import { AppIcon } from '@/components/AppIcon';
import { track } from '@/api/analytics';
import { ApiError } from '@/api/client';
import type { CheckIn } from '@/types/api';
import { MONTHLY_CHECK_DAYS, daysSince, isoFromCalendarDate, isPastOrToday, todayISO } from '@/wizard/calendarDate';
import { Button } from '@/components/Button';
import { usePinnedWizardAction } from '@/components/WizardDock';
import { checkinSymptomItems, hasCheckinAnswers, normalizeCalendarInput } from '@/wizard/checkinEntry';
import { mergeConfirmedEntry } from '@/wizard/checkinAssistance';
import { CalendarDateInput } from '@/components/CalendarDateInput';
import { CheckinDetailModal } from '@/components/CheckinDetailModal';
import { Chip } from '@/components/Chip';
import { Input } from '@/components/Input';
import { useToast } from '@/components/Toast';
import { useAuth } from '@/auth/AuthContext';
import { useWizard } from '@/store/WizardContext';
import { fmtDate, getSymptomUniverse, impactLabel } from '@/wizard/engine';
import { findMedName, useMedCatalog } from '@/store/MedCatalogContext';
import { upsertCheckin } from '@/wizard/sync';
import { useTranslation } from '@/hooks/useTranslation';
import { LIFESTYLE_KEYS, type MedicationDoseEntry, type CheckinCompletion, type CheckinSymptomItem, type LifestyleKey, type Rating, type SymptomChange, type TriState, type Wellbeing } from '@/wizard/types';
import { Accordion, Divider, FinePrint, OptionalScaleRow, Section, Tagline, TriStateRow } from '@/screens/wizard/ui';
import { colors, radius, spacing } from '@/theme';

const CHANGE_VALUES: { value: SymptomChange; score: number }[] = [
  { value: 'Worse', score: -2 },
  { value: 'No change', score: 0 },
  { value: 'Slightly better', score: 1 },
  { value: 'Much better', score: 2 },
  { value: 'Not present', score: 0 },
];
const QUICK_CHANGES: { value: SymptomChange; label: string }[] = [{ value: 'Slightly better', label: 'simple.better' }, { value: 'No change', label: 'simple.same' }, { value: 'Worse', label: 'simple.worse' }];
const PROGRESS_STEP = 6;

type Props = {
  advanceToProgress?: boolean;
};

export const CheckinStep: React.FC<Props> = ({ advanceToProgress = false }) => {
  const { state, setStep, savePayload } = useWizard();
  const { catalog } = useMedCatalog();
  const { isGuest } = useAuth();
  const { t, language } = useTranslation();
  const toast = useToast();
  const { fontScale } = useWindowDimensions();
  const largeText = fontScale > 1.3;
  const [saving, setSaving] = useState(false);
  const [savedOpen, setSavedOpen] = useState(false);
  const [draftOpen, setDraftOpen] = useState(false);
  const [stagedSymptoms, setStagedSymptoms] = useState<string[]>([]);
  const [symptomOpen, setSymptomOpen] = useState(false);
  const [symptomName, setSymptomName] = useState('');
  const [symptomDetail, setSymptomDetail] = useState<string | null>(null);
  const [detailIndex, setDetailIndex] = useState<number | null>(null);
  const [checkinDate, setCheckinDate] = useState(todayISO());
  const [dateError, setDateError] = useState<string | null>(null);
  // Unlike the website, nothing is prefilled from the previous check-in:
  // every answer starts blank so a prior week's rating is never re-recorded.
  const [doseEntries, setDoseEntries] = useState<Record<string, MedicationDoseEntry>>({});
  const [editingDose, setEditingDose] = useState<string | null>(null);
  const [savedOutcome, setSavedOutcome] = useState<'synced' | 'device' | 'pending'>('device');
  const [adherenceError, setAdherenceError] = useState(false);
  const [editingDate, setEditingDate] = useState(false);
  // One clientId per form session, minted on the first save attempt and kept
  // until the save succeeds. A retry after a rejected sync then resubmits the
  // same record (dedupeCheckins and the server both key on clientId) instead
  // of minting a sibling that would be stored twice.
  const clientIdRef = useRef<string | null>(null);
  const medicationDoses = state.meds.map(med => doseEntries[med.medId]).filter((entry): entry is MedicationDoseEntry => Boolean(entry));
  const adherence = combinedAdherence(medicationDoses);
  const setDoseEntry = (medId: string, patch: Partial<MedicationDoseEntry>) => {
    const med = state.meds.find(row => row.medId === medId)!;
    setDoseEntries(previous => ({ ...previous, [medId]: mergeDoseEntry(previous[medId], { medId, medicationName: findMedName(catalog, medId), strength: med.strength, frequency: med.frequency, status: 'unsure' }, patch) }));
    setAdherenceError(false);
  };
  const [taken, setTaken] = useState<Set<string>>(
    new Set<string>(),
  );
  const [changes, setChanges] = useState<Record<string, SymptomChange>>({});
  const [severities, setSeverities] = useState<Record<string, number>>({});
  const [wb, setWb] = useState<Wellbeing>({ energy: null, mood: null, sleep: null, focus: null });
  // The three v3 body systems. They start unanswered EVERY week and are never
  // prefilled from the previous check-in — prefilling would silently re-assert a number the
  // user did not look at, which is the severityNow bug at triple scale.
  const [digestive, setDigestive] = useState<Rating>(null);
  const [circulation, setCirculation] = useState<Rating>(null);
  const [immunity, setImmunity] = useState<Rating>(null);

  // Monthly treatment check — likewise never prefilled.
  const [labsDone, setLabsDone] = useState<TriState | null>(null);
  const [prescriberSeen, setPrescriberSeen] = useState<TriState | null>(null);
  const [lifestyle, setLifestyle] = useState<Partial<Record<LifestyleKey, TriState | null>>>({});

  const [sideEffects, setSideEffects] = useState('');
  const [notes, setNotes] = useState('');
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteDraft, setNoteDraft] = useState('');
  const [effectsDraft, setEffectsDraft] = useState('');

  const allSupplements = state.plan.recommendedSupplements;

  // Suggestions are only tracked after the user confirms them.
  const symptomsToRate = [...new Set([...state.symptoms.selected, ...stagedSymptoms])];
  const otherSymptoms = getSymptomUniverse(state, catalog).filter(symptom => !symptomsToRate.includes(symptom));

  // Ask the monthly block only when it is actually due: find the most recent
  // check-in that carries answers and re-prompt once it is 28 days old. A
  // check-in that was never asked does not reset the clock. The form's own
  // record (committed locally after a rejected sync) must not count either, or
  // the retry would silently drop the monthly answers it is resubmitting.
  const monthlyDue = (() => {
    const answered = [...state.checkins]
      .filter((c) => !(clientIdRef.current && c.clientId === clientIdRef.current) && c.completion && (c.completion.labs !== null || c.completion.prescriber !== null))
      .sort((a, b) => a.dateISO.localeCompare(b.dateISO));
    const lastAnswered = answered[answered.length - 1];
    return !lastAnswered || daysSince(lastAnswered.dateISO) >= MONTHLY_CHECK_DAYS;
  })();

  const toggleTaken = (s: string) =>
    setTaken((prev) => {
      const n = new Set(prev);
      if (n.has(s)) n.delete(s);
      else n.add(s);
      return n;
    });

  const selectAllSupplements = () => setTaken(new Set(allSupplements));
  const clearSupplements = () => setTaken(new Set());

  const markSymptomsUnchanged = () => {
    const mark = () => setChanges(Object.fromEntries(symptomsToRate.map(symptom => [symptom, 'No change' as SymptomChange])));
    if (symptomsToRate.some(symptom => changes[symptom] && changes[symptom] !== 'No change')) {
      Alert.alert(t('ease.same_for_all'), t('easy.replace_changes'), [{ text: t('common.cancel'), style: 'cancel' }, { text: t('easy.mark_unchanged'), onPress: mark }]);
    } else mark();
  };

  const save = async () => {
    if (saving) return;
    // A shape-valid but impossible date ("2026-13-45") used to reach
    // new Date(...).toISOString() and throw RangeError, losing the check-in;
    // an invalid one ("2026-02-30") silently rolled over to another day.
    // Refuse both explicitly rather than storing a date the user did not pick.
    const calendarDay = normalizeCalendarInput(checkinDate.trim()) || (checkinDate.trim() ? '' : todayISO());
    const dateISO = isoFromCalendarDate(calendarDay);
    if (!dateISO || !isPastOrToday(calendarDay)) {
      setDateError(t('checkin.date_invalid'));
      return;
    }
    setDateError(null);

    if (medicationDoses.length !== state.meds.length || medicationDoses.some(entry => !doseEntryValid(entry))) {
      setAdherenceError(true);
      Alert.alert(t('simple.save_error'), t('tracking.dose_error'));
      return;
    }
    setAdherenceError(false);
    const items = checkinSymptomItems(symptomsToRate, changes, severities);
    const improvementScore = items.reduce((acc, x) => acc + (x.changeScore || 0), 0);

    if (!clientIdRef.current) clientIdRef.current = Crypto.randomUUID();
    const checkin = {
        clientId: clientIdRef.current,
        dateISO,
        adherencePct: adherence,
        medicationDoses,
        supplementsTaken: [...taken],
        symptoms: { items, improvementScore },
        // The three new ratings ride inside `wellbeing` deliberately: the web
        // dedupe key hashes that object, so a sibling field would be invisible
        // to it and two same-day check-ins differing only in these would
        // silently collapse into one.
        wellbeing: { ...wb, digestive, circulation, immunity },
        // Snapshot the plan as it stood this week; the live plan may change.
        supplementsPlanned: [...allSupplements],
        ...(monthlyDue
          ? {
              completion: {
                labs: labsDone,
                labsDateISO: labsDone === 'yes' ? dateISO : null,
                prescriber: prescriberSeen,
                prescriberDateISO: prescriberSeen === 'yes' ? dateISO : null,
                lifestyle,
              } satisfies CheckinCompletion,
            }
          : {}),
        sideEffects: sideEffects.split(',').map((x) => x.trim()).filter(Boolean),
        notes,
      };
    if (!hasCheckinAnswers(checkin)) {
      Alert.alert(t('journey.empty_update_title'), t('journey.empty_update_body'));
      return;
    }
    setSaving(true);
    try {
      const outcome = await savePayload({
        checkins: upsertCheckin(state.checkins, checkin) as unknown as CheckIn[],
        ...(stagedSymptoms.length ? {
          symptoms: symptomsToRate.map(name => ({ name })),
          portal_state: { symptoms: { ...state.symptoms, custom: [...new Set([...state.symptoms.custom, ...stagedSymptoms.filter(name => !getSymptomUniverse(state, catalog).includes(name))])] } },
        } : {}),
      });
      setSavedOutcome(outcome);
    } catch (error) {
      // An ApiError means the local copy was committed and only the server
      // rejected it, so "saved on this device, tap Save again" is true. Any
      // other failure happened before the local write (account not loaded,
      // disk write failed): nothing was saved, so say so.
      if (error instanceof ApiError) Alert.alert(t('mobile.profile.save_error_title'), t('design.checkin_sync_failed'));
      else Alert.alert(t('mobile.profile.save_error_title'), t('mobile.profile.save_error_body'));
      return;
    } finally { setSaving(false); }
    track('checkin_saved', {
      index: state.checkins.length + 1,
      adherencePct: adherence,
      symptoms: items.length,
    });
    clientIdRef.current = null;
    setDoseEntries({});
    setEditingDose(null);
    setTaken(new Set());
    setCheckinDate(todayISO());
    setEditingDate(false);
    setSideEffects('');
    setNotes('');
    setDigestive(null);
    setCirculation(null);
    setImmunity(null);
    setLabsDone(null);
    setPrescriberSeen(null);
    setLifestyle({});
    setWb({ energy: null, mood: null, sleep: null, focus: null });
    setChanges({});
    setSeverities({});
    setStagedSymptoms([]);
    setSavedOpen(true);
  };

  const deleteLast = () => {
    if (!state.checkins.length) return;
    Alert.alert(t('checkin.delete_last'), t('design.delete_checkin_prompt'), [
      { text: t('common.no'), style: 'cancel' },
      {
        text: t('checkin.delete_last'),
        style: 'destructive',
        onPress: async () => {
          // Capture the server id (carried on the check-in at runtime) so the
          // deletion is sent explicitly — a merge save alone would leave the
          // row on the server.
          const removed = state.checkins[state.checkins.length - 1] as { id?: string | number } | undefined;
          const removedId = removed?.id;
          try {
            await savePayload({ checkins: state.checkins.slice(0, -1) as unknown as CheckIn[], ...(removedId != null ? { deleted_checkins: [removedId] } : {}) });
          } catch {
            Alert.alert(t('mobile.profile.save_error_title'), t('mobile.profile.save_error_body'));
            return;
          }
          toast.show(t('toast.deleted'));
        },
      },
    ]);
  };

  const detailCheckin = detailIndex != null ? state.checkins[state.checkins.length - 1 - detailIndex] : null;
  const pinned = usePinnedWizardAction({ title: t('checkin.save'), onPress: save, loading: saving });

  return (
    <View style={{ gap: spacing.md }}>
      <View style={[styles.supHead, largeText && { flexDirection: 'column', alignItems: 'flex-start' }]}><View style={{ flex: largeText ? 0 : 1 }}><FinePrint>{t('calm.checkin_period', { date: new Date(isoFromCalendarDate(checkinDate) || todayISO()).toLocaleDateString(language, { month: 'short', day: 'numeric', ...(new Date(checkinDate).getFullYear() !== new Date().getFullYear() ? { year: 'numeric' } : {}) }) })}</FinePrint></View><Pressable accessibilityRole="button" accessibilityLabel={t('simple.change_date')} onPress={() => setEditingDate(open => !open)} style={styles.iconButton}><AppIcon name="calendar" size={19} /></Pressable></View>
      {editingDate ? <CalendarDateInput label={t('checkin.date')} value={checkinDate} onChange={value => { setCheckinDate(value); setDateError(null); }} error={dateError ?? undefined} /> : null}
      {dateError && !editingDate ? <Text style={styles.error} accessibilityRole="alert">{dateError}</Text> : null}
      <Pressable accessibilityRole="button" accessibilityLabel={t('assist.checkin_title')} accessibilityHint={t('assist.checkin_hint')} onPress={() => setDraftOpen(true)} style={({ pressed }) => [styles.assistanceRow, pressed && { opacity: .65 }]}>
        <View style={styles.medicineIcon} accessible={false}><AppIcon name="spark" size={22} /></View><View style={{ flex: 1, gap: 3 }}><Text style={styles.symName}>{t('assist.checkin_title')}</Text></View><AppIcon name="chevron" size={16} color={colors.textMuted} />
      </Pressable>
      <EditorSheet visible={symptomOpen} title={t('symptoms.add_btn')} onClose={() => setSymptomOpen(false)} footer={<Button title={t('symptoms.add_btn')} disabled={!symptomName.trim()} onPress={() => {
        const input = symptomName.trim();
        const universe = getSymptomUniverse(state, catalog);
        const name = [...symptomsToRate, ...universe].find(value => value.toLowerCase() === input.toLowerCase()) || input;
        if (!name) return;
        setStagedSymptoms(previous => [...new Set([...previous, name])]);
        setSymptomOpen(false); setSymptomName('');
      }} />}><Input label={t('symptoms.add_custom')} value={symptomName} onChangeText={setSymptomName} maxLength={100} />
        {getSymptomUniverse(state, catalog).filter(name => !state.symptoms.selected.includes(name) && name.toLowerCase().includes(symptomName.trim().toLowerCase())).slice(0, 5).map(name => <Pressable key={name} accessibilityRole="button" onPress={() => setSymptomName(name)} style={{ minHeight: 48, paddingVertical: 10 }}><Text style={refined.rowTitle}>{name}</Text></Pressable>)}
      </EditorSheet>
      <EntryDraftSheet visible={draftOpen} onClose={() => setDraftOpen(false)} vocabulary={getSymptomUniverse(state, catalog)} mode="checkin" onApply={entry => {
        const merged = mergeConfirmedEntry({ names: stagedSymptoms, notes, changes, severities, wellbeing: wb }, entry);
        setStagedSymptoms(merged.names); setNotes(merged.notes); setChanges(merged.changes); setSeverities(merged.severities); setWb(merged.wellbeing);
        toast.show(t('easy.draft_applied'));
      }} />
      <Section>
        <Text style={styles.question}>{t('easy.medicines_question')}</Text>
        {!state.meds.length ? <FinePrint>{t('tracking.no_scheduled_medication')}</FinePrint> : null}
        {state.meds.map(med => {
          const entry = doseEntries[med.medId];
          const name = findMedName(catalog, med.medId);
          const complete = entry && entry.status !== 'some' && editingDose !== med.medId;
          if (complete) return <Pressable key={med.medId} accessibilityRole="button" accessibilityLabel={t('ease.edit_dose', { name, status: t(`tracking.dose.${entry.status}`) })} onPress={() => setEditingDose(med.medId)} style={styles.completedMedicine}>
            <View style={styles.medicineIcon} accessible={false}><AppIcon name="pill" size={22} /></View>
            <View style={{ flex: 1, gap: 4 }}><Text style={styles.symName}>{name}</Text><View style={styles.doseAnswer}><AppIcon name="check" size={16} /><Text style={styles.answerText}>{t(`tracking.dose.${entry.status}`)}</Text></View></View>
            <Text style={styles.editLink}>{t('tracking.edit')}</Text>
          </Pressable>;
          return <View key={med.medId} style={styles.symRow}>
            <View style={styles.medicineHeading}><View style={styles.medicineIcon}><AppIcon name="pill" size={23} /></View><View style={{ flex: 1, gap: 3 }}><Text style={styles.symName}>{findMedName(catalog, med.medId)}</Text>{[med.strength, med.frequency].some(Boolean) ? <FinePrint>{[med.strength, med.frequency].filter(Boolean).join(' · ')}</FinePrint> : null}</View></View>
            <View style={[styles.changeWrap, largeText && { flexDirection: 'column', flexWrap: 'nowrap', alignItems: 'stretch' }]}>
              {(['all', 'some', 'unsure'] as const).map(status => <Pressable key={status} accessibilityRole="button" accessibilityLabel={`${findMedName(catalog, med.medId)}: ${t(`tracking.dose.${status}`)}`} accessibilityState={{ selected: entry?.status === status }} onPress={() => { setDoseEntry(med.medId, { status }); setEditingDose(null); }} style={[styles.changeChip, largeText && { flex: 0, alignSelf: 'stretch', width: '100%' }, entry?.status === status && styles.changeChipActive]}><Text style={[styles.changeText, entry?.status === status && styles.changeTextActive]}>{entry?.status === status ? '✓ ' : ''}{t(`tracking.dose.${status}`)}</Text></Pressable>)}
            </View>
            {entry?.status === 'some' ? <>
              <Input label={t('simple.scheduled_doses')} value={entry.scheduled === undefined ? '' : String(entry.scheduled)} onChangeText={value => setDoseEntry(med.medId, { scheduled: /^\d+$/.test(value) ? Number(value) : undefined })} keyboardType="number-pad" maxLength={5} />
              <Input label={t('simple.missed_count')} value={entry.missed === undefined ? '' : String(entry.missed)} onChangeText={value => setDoseEntry(med.medId, { missed: /^\d+$/.test(value) ? Number(value) : undefined })} keyboardType="number-pad" maxLength={5} />
            </> : null}
            <Button title={t('tracking.dose.not-scheduled')} variant="ghost" compact onPress={() => { setDoseEntry(med.medId, { status: 'not-scheduled' }); setEditingDose(null); }} />
            {entry?.status === 'not-scheduled' ? <FinePrint>{t('tracking.no_doses_recorded')}</FinePrint> : null}
          </View>;
        })}
        {adherenceError ? <Text style={styles.error} accessibilityRole="alert">{t('tracking.dose_error')}</Text> : null}

      </Section>
      {!symptomsToRate.length ? <Button title={t('symptoms.add_btn')} variant="ghost" compact onPress={() => { setSymptomName(''); setSymptomOpen(true); }} /> : null}
      {symptomsToRate.length ? (
        <Section>
          <View style={styles.supHead}><Text style={[styles.question, { flex: 1 }]}>{t('calm.symptoms_question')}</Text><Pressable accessibilityRole="button" accessibilityLabel={t('symptoms.add_btn')} onPress={() => { setSymptomName(''); setSymptomOpen(true); }} style={styles.iconButton}><Text style={{ fontSize: 27, lineHeight: 32, color: colors.primary }}>+</Text></Pressable></View>
          {symptomsToRate.length > 1 ? <Pressable accessibilityRole="button" accessibilityState={{ disabled: symptomsToRate.every(symptom => changes[symptom] === 'No change') }} disabled={symptomsToRate.every(symptom => changes[symptom] === 'No change')} onPress={markSymptomsUnchanged} style={styles.quickSame}><AppIcon name="check" size={17} /><Text style={styles.editLink}>{t(symptomsToRate.every(symptom => changes[symptom] === 'No change') ? 'ease.all_same' : 'ease.same_for_all')}</Text></Pressable> : null}
          {symptomsToRate.map((sym) => (
            <View key={sym} style={styles.symptomAnswer}>
              <View style={[styles.symptomHeader, largeText && { flexDirection: 'column', alignItems: 'flex-start' }]}><Text style={[styles.symName, { flexShrink: 1 }]}>{sym}</Text><View style={{ flexDirection: 'row', alignItems: 'center' }}><Pressable accessibilityRole="button" accessibilityLabel={`${sym}: ${t('checkin.unsure')}`} onPress={() => { setChanges(previous => { const next = { ...previous }; delete next[sym]; return next; }); setSeverities(previous => { const next = { ...previous }; delete next[sym]; return next; }); }} style={styles.unsureButton}><Text style={styles.unsureText}>{t('checkin.unsure')}</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel={`${sym}: ${t('simple.more_detail')}`} onPress={() => setSymptomDetail(sym)} style={styles.iconButton}><AppIcon name="down" size={17} /></Pressable></View></View>
              <View style={[styles.changeWrap, largeText && { flexDirection: 'column', flexWrap: 'nowrap', alignItems: 'stretch' }]}>
                {QUICK_CHANGES.map((o) => {
                  const active = changes[sym] === o.value || (o.value === 'Slightly better' && changes[sym] === 'Much better');
                  return (
                    <Pressable
                      key={o.value}
                      accessibilityRole="button"
                      accessibilityLabel={`${sym}: ${t(o.label)}`}
                      accessibilityState={{ selected: active }}
                      onPress={() => setChanges((p) => ({ ...p, [sym]: o.value }))}
                      style={[styles.changeChip, largeText && { flex: 0, alignSelf: 'stretch', width: '100%' }, active && styles.changeChipActive]}
                    >
                      <Text style={[styles.changeText, active && styles.changeTextActive]}>
                        {active ? '✓ ' : ''}{t(o.label)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              <EditorSheet visible={symptomDetail === sym} title={sym} onClose={() => setSymptomDetail(null)}>
                <View style={[styles.changeWrap, largeText && { flexDirection: 'column', flexWrap: 'nowrap', alignItems: 'stretch' }]}>
                  {CHANGE_VALUES.filter(option => ['Much better', 'Not present'].includes(option.value)).map(option => {
                    const active = changes[sym] === option.value;
                    return (
                      <Pressable key={option.value} accessibilityRole="button" accessibilityLabel={`${sym}: ${impactLabel(option.value, t)}`} accessibilityState={{ selected: active }} onPress={() => setChanges(previous => ({ ...previous, [sym]: option.value }))} style={[styles.changeChip, largeText && { flex: 0, alignSelf: 'stretch', width: '100%' }, active && styles.changeChipActive]}>
                        <Text style={[styles.changeText, active && styles.changeTextActive]}>{active ? '✓ ' : ''}{impactLabel(option.value, t)}</Text>
                      </Pressable>
                    );
                  })}
                </View>
                <OptionalScaleRow notAnsweredLabel={t('checkin.not_answered')} label={t('checkin.severity_now')} minLabel={t('summary.none')} maxLabel={t('symptoms.severity.severe')} value={severities[sym] ?? null} onChange={value => setSeverities(previous => { const next = { ...previous }; if (value === null) delete next[sym]; else next[sym] = value; return next; })} />
              </EditorSheet>
            </View>
          ))}
        </Section>
      ) : null}

      <Pressable accessibilityRole="button" accessibilityLabel={t(notes.trim() || sideEffects.trim() ? 'ease.edit_note' : 'ease.add_note')} onPress={() => { setNoteDraft(notes); setEffectsDraft(sideEffects); setNoteOpen(true); }} style={styles.noteRow}>
        <View style={styles.medicineIcon} accessible={false}><AppIcon name="file" size={21} /></View>
        <View style={{ flex: 1, gap: 4 }}><Text style={styles.symName}>{t(notes.trim() || sideEffects.trim() ? 'ease.your_note' : 'ease.add_note')}</Text>{notes.trim() || sideEffects.trim() ? <Text style={refined.meta} numberOfLines={largeText ? undefined : 2}>{[notes.trim(), sideEffects.trim()].filter(Boolean).join(' · ')}</Text> : null}</View><AppIcon name="chevron" size={17} />
      </Pressable>
      <EditorSheet visible={noteOpen} title={t('ease.your_note')} onClose={() => setNoteOpen(false)} footer={<Button title={t('ease.use_note')} onPress={() => { setNotes(noteDraft); setSideEffects(effectsDraft); setNoteOpen(false); }} />}>
        <Input label={t('checkin.notes')} placeholder={t('checkin.notes_placeholder')} value={noteDraft} onChangeText={setNoteDraft} multiline maxLength={10000} style={{ minHeight: 110, textAlignVertical: 'top' }} />
        <Input label={t('checkin.side_effects')} placeholder={t('checkin.side_effects_placeholder')} value={effectsDraft} onChangeText={setEffectsDraft} multiline maxLength={10000} />
        <Text style={refined.meta}>{t('ease.save_later')}</Text>
      </EditorSheet>

      <Accordion plain title={t('easy.feeling_question')} subtitle={(['energy', 'mood', 'sleep', 'focus'] as const).filter(key => wb[key] !== null).map(key => `${t('wellbeing.' + key).replace(/\s*\([^)]*\)\s*$/, '')} ${wb[key]}/10`).join(' · ') || undefined}>
        <OptionalScaleRow notAnsweredLabel={t('checkin.unsure')} label={t('wellbeing.energy')} value={wb.energy} onChange={(v) => setWb((p) => ({ ...p, energy: v }))} />
        <Accordion title={t('design.more_wellbeing')} subtitle={t('design.optional')}>
        <OptionalScaleRow notAnsweredLabel={t('checkin.unsure')} label={t('wellbeing.mood')} value={wb.mood} onChange={(v) => setWb((p) => ({ ...p, mood: v }))} />
        <OptionalScaleRow notAnsweredLabel={t('checkin.unsure')} label={t('wellbeing.sleep')} value={wb.sleep} onChange={(v) => setWb((p) => ({ ...p, sleep: v }))} />
        <OptionalScaleRow notAnsweredLabel={t('checkin.unsure')} label={t('wellbeing.focus')} value={wb.focus} onChange={(v) => setWb((p) => ({ ...p, focus: v }))} />

        <OptionalScaleRow
          label={t('wellbeing.digestive')}
          value={digestive}
          onChange={setDigestive}
          notAnsweredLabel={t('checkin.not_answered')}
        />
        <OptionalScaleRow
          label={t('wellbeing.circulation')}
          value={circulation}
          onChange={setCirculation}
          notAnsweredLabel={t('checkin.not_answered')}
        />
        <OptionalScaleRow
          label={t('wellbeing.immunity')}
          value={immunity}
          onChange={setImmunity}
          notAnsweredLabel={t('checkin.not_answered')}
        />
        <FinePrint>{t('checkin.systems_note')}</FinePrint>
        </Accordion>
      </Accordion>

      <Accordion plain title={t('easy.more_options')}>
      {allSupplements.length ? <Accordion title={t('checkin.supplements_title')} subtitle={t('design.supplements_hint')}>
        {allSupplements.length ? (
          <>
            <View style={styles.supHead}>
              <Text style={styles.label}>{t('checkin.supplements_title')}</Text>
              <View style={styles.supActions}>
                <Pressable onPress={selectAllSupplements}>
                  <Text style={styles.supAction}>{t('checkin.select_all')}</Text>
                </Pressable>
                <Text style={styles.supSep}>·</Text>
                <Pressable onPress={clearSupplements}>
                  <Text style={styles.supAction}>{t('checkin.clear')}</Text>
                </Pressable>
              </View>
            </View>
            <View style={styles.chips}>
              {allSupplements.map((s) => (
                <Chip key={s} label={s} selected={taken.has(s)} onPress={() => toggleTaken(s)} />
              ))}
            </View>
          </>
        ) : (
          <FinePrint>{t('checkin.supplements_none')}</FinePrint>
        )}

      </Accordion> : null}

      {otherSymptoms.length ? <Accordion title={t('design.add_own')}><View style={styles.chips}>{otherSymptoms.map(symptom => <Chip key={symptom} label={symptom} onPress={() => setStagedSymptoms(previous => [...new Set([...previous, symptom])])} />)}</View></Accordion> : null}

      {monthlyDue ? (
        <Accordion title={t('checkin.monthly_title')} subtitle={t('design.monthly_sub')}>
          <TriStateRow
            label={t('checkin.labs_q')}
            value={labsDone}
            onChange={setLabsDone}
            labels={{ yes: t('common.yes'), no: t('common.no'), unsure: t('checkin.unsure') }}
          />
          <TriStateRow
            label={t('checkin.prescriber_q')}
            value={prescriberSeen}
            onChange={setPrescriberSeen}
            labels={{ yes: t('common.yes'), no: t('common.no'), unsure: t('checkin.unsure') }}
          />
          <Divider />
          {LIFESTYLE_KEYS.map((key) => (
            <TriStateRow
              key={key}
              label={t(`checkin.lifestyle.${key}`)}
              value={lifestyle[key] ?? null}
              onChange={(v) => setLifestyle((prev) => ({ ...prev, [key]: v }))}
              labels={{ yes: t('common.yes'), no: t('common.no'), unsure: t('checkin.unsure') }}
            />
          ))}
          <FinePrint>{t('checkin.monthly_note')}</FinePrint>
        </Accordion>
      ) : null}


      </Accordion>

      {state.checkins.length ? (
        <Accordion title={t('design.past_checkins')} badge={state.checkins.length}>
          {state.checkins
            .slice()
            .reverse()
            .map((c, i) => (
              <Pressable key={i} onPress={() => setDetailIndex(i)}>
                <Text style={styles.savedRow}>{fmtDate(c.dateISO)} • {t('common.adherence')} {adherenceLabel(c.adherencePct, t('checkin.unsure'))}</Text>
                {i < state.checkins.length - 1 ? <Divider /> : null}
              </Pressable>
            ))}
          <Button title={t('checkin.delete_last')} variant="danger" onPress={deleteLast} />
        </Accordion>
      ) : null}

      {!pinned ? <Button title={t('checkin.save')} onPress={save} loading={saving} /> : null}
      <Modal visible={savedOpen} transparent animationType="fade" onRequestClose={() => setSavedOpen(false)}>
        <View style={styles.savedOverlay}><View style={styles.savedDialog} accessibilityViewIsModal>
          <Text style={styles.savedIcon}>✓</Text><Tagline title={t('design.checkin_saved')} body={t(`tracking.saved.${savedOutcome}`)} />
          <Button title={t('design.see_progress')} onPress={() => { setSavedOpen(false); if (advanceToProgress) setStep(PROGRESS_STEP); }} />
          <Button title={t('common.close')} variant="ghost" compact onPress={() => setSavedOpen(false)} />
        </View></View>
      </Modal>
      <CheckinDetailModal
        visible={detailIndex != null}
        checkin={detailCheckin}
        index={detailIndex != null ? state.checkins.length - 1 - detailIndex : 0}
        onClose={() => setDetailIndex(null)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  assistanceRow: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 64, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 22, backgroundColor: colors.glass, borderWidth: 1, borderColor: colors.glassBorder },
  completedMedicine: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 76, paddingVertical: 10 },
  doseAnswer: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  answerText: { flex: 1, fontSize: 16, lineHeight: 24, color: colors.primary },
  editLink: { flexShrink: 1, fontSize: 16, lineHeight: 24, fontWeight: '500', color: colors.primary },
  quickSame: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 48, alignSelf: 'flex-start', paddingHorizontal: 8, borderRadius: 14, backgroundColor: colors.primary50 },
  noteRow: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 68, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 22, backgroundColor: colors.glass },
  savedOverlay: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: 'rgba(20,29,42,.35)' },
  savedDialog: { borderRadius: 22, backgroundColor: colors.surface, padding: 24, gap: 16 },
  savedIcon: { color: colors.primary, fontSize: 32, textAlign: 'center' },
  label: { fontSize: 16, fontWeight: '500', color: colors.text },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  supHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 },
  supActions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  supAction: { fontSize: 15, fontWeight: '500', color: colors.primary },
  supSep: { fontSize: 15, color: colors.textDim },
  symRow: { gap: 6, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: colors.borderSoft },
  symName: { fontSize: 17, fontWeight: '500', color: colors.text },
  question: { fontSize: 20, lineHeight: 28, fontWeight: '500', letterSpacing: -.4, color: colors.text },
  medicineHeading: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 6 },
  medicineIcon: { width: 48, height: 48, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary50 },
  iconButton: { minWidth: 48, minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  symptomAnswer: { gap: 9, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.borderSoft },
  symptomHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  changeWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  error: { color: colors.danger, fontSize: 16, lineHeight: 24 },
  changeChip: { minHeight: 48, minWidth: 70, alignItems: 'center', justifyContent: 'center', borderRadius: 13, flex: 1, paddingHorizontal: 7, paddingVertical: 9, backgroundColor: colors.surfaceAlt, borderWidth: 1, borderColor: 'transparent' },
  changeChipActive: {
    backgroundColor: '#E5EDFF',
    borderColor: '#9BB5EC',
  },
  changeText: { fontSize: 16, fontWeight: '500', color: colors.textMuted },
  changeTextActive: { color: colors.text, fontWeight: '500' },
  // Same look as <Button compact variant="ghost">.
  unsureButton: { minHeight: 48, paddingVertical: 9, paddingHorizontal: 4, borderRadius: radius.button, alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent' },
  unsureText: { textAlign: 'center', fontSize: 15, lineHeight: 23, color: colors.primary },
  savedRow: { fontSize: 16, color: colors.textSoft, paddingVertical: 6 },
});
