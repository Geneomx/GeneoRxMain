import { EntryDraftSheet } from '@/components/EntryDraftSheet';
import { EditorSheet, refined } from '@/components/RefinedUI';
import { adherenceLabel, combinedAdherence, doseEntryValid, mergeDoseEntry } from '@/wizard/medicationTracking';
import * as Crypto from 'expo-crypto';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Keyboard, Modal, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { AppText as Text } from '@/components/AppText';
import { AppIcon } from '@/components/AppIcon';
import { track } from '@/api/analytics';
import { ApiError } from '@/api/client';
import type { CheckIn } from '@/types/api';
import { MONTHLY_CHECK_DAYS, daysSince, isoFromCalendarDate, isPastOrToday } from '@/wizard/calendarDate';
import { Button } from '@/components/Button';
import { usePinnedWizardAction, useWizardHeaderAction } from '@/components/WizardDock';
import { checkinSymptomItems, hasCheckinAnswers, normalizeCalendarInput } from '@/wizard/checkinEntry';
import { mergeConfirmedEntry } from '@/wizard/checkinAssistance';
import { CalendarDateInput } from '@/components/CalendarDateInput';
import { CheckinDetailModal } from '@/components/CheckinDetailModal';
import { Chip } from '@/components/Chip';
import { Input } from '@/components/Input';
import { useToast } from '@/components/Toast';
import { useWizard } from '@/store/WizardContext';
import { getSymptomUniverse, impactLabel } from '@/wizard/engine';
import { findMedName, useMedCatalog } from '@/store/MedCatalogContext';
import { upsertCheckin } from '@/wizard/sync';
import { useTranslation } from '@/hooks/useTranslation';
import { LIFESTYLE_KEYS, type MedicationDoseEntry, type LifestyleKey, type Rating, type SymptomChange, type TriState, type Wellbeing, type WizardCheckin } from '@/wizard/types';
import { Accordion, Divider, FinePrint, OptionalScaleRow, Section, Tagline, TriStateRow } from '@/screens/wizard/ui';
import { colors, radius, spacing } from '@/theme';
import { useCheckinDrafts } from '@/store/CheckinDraftContext';
import { useSetup } from '@/store/SetupContext';
import { buildCheckinRecord, checkinEditorKey, createCheckinForm, hasUnfinishedCheckin, readableCheckinDate, replaceEditedCheckin, type CheckinFormDraft } from '@/wizard/checkinEditor';

const CHANGE_VALUES: { value: SymptomChange; score: number }[] = [
  { value: 'Worse', score: -2 },
  { value: 'No change', score: 0 },
  { value: 'Slightly better', score: 1 },
  { value: 'Much better', score: 2 },
  { value: 'Not present', score: 0 },
];
const QUICK_CHANGES: { value: SymptomChange; label: string }[] = [{ value: 'Slightly better', label: 'simple.better' }, { value: 'No change', label: 'simple.same' }, { value: 'Worse', label: 'simple.worse' }];

export const CheckinStep: React.FC = () => {
  const editor = useCheckinDrafts();
  const { t } = useTranslation();
  const key = checkinEditorKey(editor.original);
  if (!editor.ready) return <FinePrint>{t('journey.loading')}</FinePrint>;
  return <CheckinForm key={`${key}:${editor.session}`} initial={editor.drafts[key] || createCheckinForm(editor.original)} draftKey={key} />;
};

const CheckinForm: React.FC<{ initial: CheckinFormDraft; draftKey: string }> = ({ initial, draftKey }) => {
  const setup = useSetup();
  const { state, setStep, savePayload, openPlanHub } = useWizard();
  const editor = useCheckinDrafts();
  const [original] = useState(initial.original);
  const finished = useRef(false);
  const resumed = useRef(hasUnfinishedCheckin(initial) && !initial.original);
  const [savedRecord, setSavedRecord] = useState<WizardCheckin | null>(null);
  const [viewSaved, setViewSaved] = useState(false);
  const { catalog } = useMedCatalog();
  const { t, language } = useTranslation();
  const toast = useToast();
  const { fontScale } = useWindowDimensions();
  const largeText = fontScale > 1.3;
  const [saving, setSaving] = useState(false);
  const [savedOpen, setSavedOpen] = useState(false);
  const [draftOpen, setDraftOpen] = useState(false);
  const [stagedSymptoms, setStagedSymptoms] = useState<string[]>(initial.stagedSymptoms);
  const [symptomOpen, setSymptomOpen] = useState(false);
  const [symptomName, setSymptomName] = useState('');
  const [symptomDetail, setSymptomDetail] = useState<string | null>(null);
  const [detailIndex, setDetailIndex] = useState<number | null>(null);
  const [checkinDate, setCheckinDate] = useState(initial.checkinDate);
  const [dateError, setDateError] = useState<string | null>(null);
  // New entries start unanswered. Editing only restores the selected record,
  // and unfinished entries restore this device's draft.
  const [doseEntries, setDoseEntries] = useState<Record<string, MedicationDoseEntry>>(initial.doseEntries);
  const [editingDose, setEditingDose] = useState<string | null>(null);
  const [savedOutcome, setSavedOutcome] = useState<'synced' | 'device' | 'pending'>('device');
  const [adherenceError, setAdherenceError] = useState(false);
  const [editingDate, setEditingDate] = useState(false);
  // One clientId per form session, minted on the first save attempt and kept
  // until the save succeeds. A retry after a rejected sync then resubmits the
  // same record (dedupeCheckins and the server both key on clientId) instead
  // of minting a sibling that would be stored twice.
  const clientIdRef = useRef<string | null>(initial.clientId);
  const medicines = original ? (original.medicationDoses || []) : state.meds.map(med => ({ ...med, medicationName: findMedName(catalog, med.medId) }));
  const medicationDoses = medicines.map(med => doseEntries[med.medId]).filter((entry): entry is MedicationDoseEntry => Boolean(entry));
  const adherence = combinedAdherence(medicationDoses);
  const setDoseEntry = (medId: string, patch: Partial<MedicationDoseEntry>) => {
    const med = medicines.find(row => row.medId === medId)!;
    setDoseEntries(previous => ({ ...previous, [medId]: mergeDoseEntry(previous[medId], { medId, medicationName: med.medicationName, strength: med.strength, frequency: med.frequency, status: 'unsure' }, patch) }));
    setAdherenceError(false);
  };
  const [taken, setTaken] = useState<Set<string>>(
    new Set<string>(initial.taken),
  );
  const [changes, setChanges] = useState<Record<string, SymptomChange>>(initial.changes);
  const [severities, setSeverities] = useState<Record<string, number>>(initial.severities);
  const [wb, setWb] = useState<Wellbeing>(initial.wb);
  // Optional ratings stay unanswered in a fresh entry.
  const [digestive, setDigestive] = useState<Rating>(initial.digestive);
  const [circulation, setCirculation] = useState<Rating>(initial.circulation);
  const [immunity, setImmunity] = useState<Rating>(initial.immunity);

  // Monthly answers are restored only for an explicit edit or unfinished draft.
  const [labsDone, setLabsDone] = useState<TriState | null>(initial.labsDone);
  const [prescriberSeen, setPrescriberSeen] = useState<TriState | null>(initial.prescriberSeen);
  const [lifestyle, setLifestyle] = useState<Partial<Record<LifestyleKey, TriState | null>>>(initial.lifestyle);

  const [sideEffects, setSideEffects] = useState(initial.sideEffects);
  const [notes, setNotes] = useState(initial.notes);
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteDraft, setNoteDraft] = useState('');
  const [effectsDraft, setEffectsDraft] = useState('');

  const allSupplements = original ? [...new Set([...(original.supplementsPlanned || []), ...(original.supplementsTaken || [])])] : state.plan.recommendedSupplements;
  const form: CheckinFormDraft = { original, clientId: clientIdRef.current, checkinDate, doseEntries, taken: [...taken], changes, severities, wb, digestive, circulation, immunity, labsDone, prescriberSeen, lifestyle, sideEffects, notes, stagedSymptoms };
  const serializedForm = JSON.stringify(form);
  useEffect(() => {
    if (!finished.current) editor.put(draftKey, hasUnfinishedCheckin(form) ? form : null);
  }, [serializedForm, draftKey, editor.put]);
  const cancelEdit = () => !saving && Alert.alert(t(original ? 'easy_use.discard_title' : 'easy_use.restart_title'), t(original ? 'easy_use.discard_body' : 'easy_use.restart_body'), [
    { text: t('easy_use.keep_editing'), style: 'cancel' },
    { text: t(original ? 'easy_use.discard' : 'easy_use.start_over'), style: 'destructive', onPress: () => { finished.current = true; editor.finish(); if (original) openPlanHub(); } },
  ]);
  const closeSaved = () => { setSavedOpen(false); editor.finish(); };

  // Suggestions are only tracked after the user confirms them.
  const symptomsToRate = [...new Set([...(original ? original.symptoms.items.map(item => item.symptom) : state.symptoms.selected), ...stagedSymptoms])];
  const otherSymptoms = getSymptomUniverse(state, catalog).filter(symptom => !symptomsToRate.includes(symptom));

  // Ask the monthly block only when it is actually due: find the most recent
  // check-in that carries answers and re-prompt once it is 28 days old. A
  // check-in that was never asked does not reset the clock. The form's own
  // record (committed locally after a rejected sync) must not count either, or
  // the retry would silently drop the monthly answers it is resubmitting.
  const monthlyDue = (() => {
    if (original) return !!original.completion;
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
    if (finished.current && savedRecord && setup.active) {
      if (await setup.advance(savedRecord)) editor.finish();
      return;
    }
    // A shape-valid but impossible date ("2026-13-45") used to reach
    // new Date(...).toISOString() and throw RangeError, losing the check-in;
    // an invalid one ("2026-02-30") silently rolled over to another day.
    // Refuse both explicitly rather than storing a date the user did not pick.
    const calendarDay = normalizeCalendarInput(checkinDate.trim()) || '';
    const dateISO = isoFromCalendarDate(calendarDay);
    if (!dateISO || !isPastOrToday(calendarDay)) {
      setDateError(t('checkin.date_invalid'));
      return;
    }
    setDateError(null);

    if (medicationDoses.length !== medicines.length || medicationDoses.some(entry => !doseEntryValid(entry))) {
      setAdherenceError(true);
      Alert.alert(t('simple.save_error'), t('tracking.dose_error'));
      return;
    }
    setAdherenceError(false);
    const items = checkinSymptomItems(symptomsToRate, changes, severities);

    if (!clientIdRef.current) clientIdRef.current = Crypto.randomUUID();
    const checkin = buildCheckinRecord({ ...form, checkinDate: calendarDay, doseEntries: Object.fromEntries(medicationDoses.map(entry => [entry.medId, entry])) }, {
      clientId: clientIdRef.current, dateISO, names: symptomsToRate, supplements: allSupplements, monthlyDue,
    });
    if (!original && !hasCheckinAnswers(checkin)) {
      Alert.alert(t('journey.empty_update_title'), t('journey.empty_update_body'));
      return;
    }
    Keyboard.dismiss();
    setSaving(true);
    try {
      const outcome = await savePayload({
        checkins: (original ? replaceEditedCheckin(state.checkins, original, checkin) : upsertCheckin(state.checkins, checkin)) as unknown as CheckIn[],
        ...(!original && stagedSymptoms.length ? {
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
      if (error instanceof Error && error.message === 'checkin_missing') Alert.alert(t('simple.save_error'), t('easy_use.missing_record'));
      else if (error instanceof ApiError) Alert.alert(t('mobile.profile.save_error_title'), t('design.checkin_sync_failed'));
      else Alert.alert(t('mobile.profile.save_error_title'), t('mobile.profile.save_error_body'));
      return;
    } finally { setSaving(false); }
    if (!original) track('checkin_saved', {
      index: state.checkins.length + 1,
      adherencePct: adherence,
      symptoms: items.length,
    });
    finished.current = true;
    editor.put(draftKey, null);
    setSavedRecord(checkin);
    if (setup.active) {
      toast.show(t('setup.saved'));
      if (await setup.advance(checkin)) editor.finish();
      return;
    }
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
  const saveTitle = t(setup.active ? finished.current ? 'setup.continue_results' : 'setup.save_continue' : original ? 'easy_use.save_changes' : 'checkin.save');
  const pinned = usePinnedWizardAction({ title: saveTitle, onPress: save, loading: saving });
  useWizardHeaderAction({ title: t(original ? 'common.cancel' : 'easy_use.start_over'), onPress: cancelEdit });

  return (
    <View style={{ gap: spacing.md }} pointerEvents={saving ? 'none' : 'auto'} accessibilityState={{ busy: saving }}>
      <View style={{ gap: 4 }}>
        {resumed.current ? <FinePrint>{t('easy_use.draft_restored')}</FinePrint> : null}
        {editor.error ? <Text accessibilityRole="alert" style={styles.error}>{t('easy_use.draft_error')}</Text> : null}
        <Pressable accessibilityRole="button" accessibilityLabel={`${t('simple.change_date')}. ${readableCheckinDate(checkinDate, language)}`} onPress={() => setEditingDate(open => !open)} style={styles.dateControl}>
          <AppIcon name="calendar" size={20} /><Text style={[styles.answerText, { flex: 1 }]}>{t('easy_use.checkin_date', { date: readableCheckinDate(checkinDate, language) })}</Text><Text style={styles.editLink}>{t('tracking.edit')}</Text>
        </Pressable>
        <FinePrint>{t('easy_use.period_hint')}</FinePrint>
      </View>
      {editingDate ? <CalendarDateInput label={t('checkin.date')} value={checkinDate} onChange={value => { setCheckinDate(value); setDateError(null); }} error={dateError ?? undefined} /> : null}
      {dateError && !editingDate ? <Text style={styles.error} accessibilityRole="alert">{dateError}</Text> : null}
      <Pressable accessibilityRole="button" accessibilityLabel={t('assist.checkin_title')} accessibilityHint={t('assist.checkin_hint')} onPress={() => setDraftOpen(true)} style={({ pressed }) => [styles.assistanceRow, pressed && { opacity: .65 }]}>
        <AppIcon name="spark" size={20} /><View style={{ flex: 1, gap: 3 }}><Text style={[styles.symName, { color: colors.primary }]}>{t('assist.checkin_title')}</Text></View><AppIcon name="chevron" size={16} color={colors.primary} />
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
        {!medicines.length ? <FinePrint>{t('tracking.no_scheduled_medication')}</FinePrint> : null}
        {medicines.map(med => {
          const entry = doseEntries[med.medId];
          const name = med.medicationName;
          const complete = entry && entry.status !== 'some' && editingDose !== med.medId;
          if (complete) return <Pressable key={med.medId} accessibilityRole="button" accessibilityLabel={t('ease.edit_dose', { name, status: t(`tracking.dose.${entry.status}`) })} onPress={() => setEditingDose(med.medId)} style={styles.completedMedicine}>
            <View style={styles.medicineIcon} accessible={false}><AppIcon name="pill" size={22} /></View>
            <View style={{ flex: 1, gap: 4 }}><Text style={styles.symName}>{name}</Text><View style={styles.doseAnswer}>{entry.status === 'all' ? <AppIcon name="check" size={16} /> : null}<Text style={styles.answerText}>{t(`tracking.dose.${entry.status}`)}</Text></View></View>
            <Text style={styles.editLink}>{t('tracking.edit')}</Text>
          </Pressable>;
          return <View key={med.medId} style={styles.symRow}>
            <View style={styles.medicineHeading}><View style={styles.medicineIcon}><AppIcon name="pill" size={23} /></View><View style={{ flex: 1, gap: 3 }}><Text style={styles.symName}>{med.medicationName}</Text>{[med.strength, med.frequency].some(Boolean) ? <FinePrint>{[med.strength, med.frequency].filter(Boolean).join(' · ')}</FinePrint> : null}</View></View>
            <View style={[styles.changeWrap, largeText && { flexDirection: 'column', flexWrap: 'nowrap', alignItems: 'stretch' }]}>
              {(['all', 'some', 'unsure'] as const).map(status => <Pressable key={status} accessibilityRole="button" accessibilityLabel={`${med.medicationName}: ${t(`tracking.dose.${status}`)}`} accessibilityState={{ selected: entry?.status === status }} onPress={() => { setDoseEntry(med.medId, { status }); setEditingDose(null); }} style={[styles.changeChip, largeText && { flex: 0, alignSelf: 'stretch', width: '100%' }, entry?.status === status && styles.changeChipActive]}><Text style={[styles.changeText, entry?.status === status && styles.changeTextActive]}>{entry?.status === status ? '✓ ' : ''}{t(`tracking.dose.${status}`)}</Text></Pressable>)}
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
          <View style={styles.supHead}><Text style={[styles.question, { flex: 1 }]}>{t('step.2')}</Text><Pressable accessibilityRole="button" accessibilityLabel={t('symptoms.add_btn')} onPress={() => { setSymptomName(''); setSymptomOpen(true); }} style={styles.iconButton}><Text style={{ fontSize: 27, lineHeight: 32, color: colors.primary }}>+</Text></Pressable></View>
          {symptomsToRate.length > 1 ? <Pressable accessibilityRole="button" accessibilityState={{ disabled: symptomsToRate.every(symptom => changes[symptom] === 'No change') }} disabled={symptomsToRate.every(symptom => changes[symptom] === 'No change')} onPress={markSymptomsUnchanged} style={styles.quickSame}><AppIcon name={symptomsToRate.every(symptom => changes[symptom] === 'No change') ? 'check' : 'arrow'} size={17} /><Text style={styles.editLink}>{t(symptomsToRate.every(symptom => changes[symptom] === 'No change') ? 'ease.all_same' : 'ease.same_for_all')}</Text></Pressable> : null}
          {symptomsToRate.map((sym) => (
            <View key={sym} style={styles.symptomAnswer}>
              <View style={[styles.symptomHeader, largeText && { flexDirection: 'column', alignItems: 'flex-start' }]}><Text style={[styles.symName, { flexShrink: 1 }]}>{sym}</Text><Pressable accessibilityRole="button" accessibilityLabel={`${sym}: ${t('simple.more_detail')}`} onPress={() => setSymptomDetail(sym)} style={styles.unsureButton}><Text style={styles.unsureText}>{t('airy.details')}</Text></Pressable></View>
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
                <Button title={t('checkin.unsure')} variant="ghost" compact onPress={() => { setChanges(previous => { const next = { ...previous }; delete next[sym]; return next; }); setSeverities(previous => { const next = { ...previous }; delete next[sym]; return next; }); setSymptomDetail(null); }} />
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

      <Accordion plain title={t('easy_use.add_details')} subtitle={t('design.optional')}>
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

      {allSupplements.length ? <Accordion title={t('checkin.supplements_title')} subtitle={t('design.supplements_hint')}>
        {allSupplements.length ? (
          <>
            <View style={styles.supHead}>
              <Text style={styles.label}>{t('checkin.supplements_title')}</Text>
              <View style={styles.supActions}>
                <Pressable accessibilityRole="button" onPress={selectAllSupplements} style={styles.smallAction}>
                  <Text style={styles.supAction}>{t('checkin.select_all')}</Text>
                </Pressable>
                <Text style={styles.supSep}>·</Text>
                <Pressable accessibilityRole="button" onPress={clearSupplements} style={styles.smallAction}>
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
              <Pressable key={c.clientId || c.id || i} accessibilityRole="button" accessibilityLabel={t('parity.open_checkin', { date: readableCheckinDate(c.dateISO, language) })} onPress={() => setDetailIndex(i)} style={{ minHeight: 48, justifyContent: 'center' }}>
                <Text style={styles.savedRow}>{readableCheckinDate(c.dateISO, language)} • {t('common.adherence')} {adherenceLabel(c.adherencePct, t('checkin.unsure'))}</Text>
                {i < state.checkins.length - 1 ? <Divider /> : null}
              </Pressable>
            ))}
          <Button title={t('checkin.delete_last')} variant="danger" onPress={deleteLast} />
        </Accordion>
      ) : null}

      {!pinned ? <Button title={saveTitle} onPress={save} loading={saving} /> : null}
      <Modal visible={savedOpen} transparent animationType="fade" onRequestClose={closeSaved}>
        <View style={styles.savedOverlay}><View style={styles.savedDialog} accessibilityViewIsModal>
          <Text style={styles.savedIcon}>✓</Text><Tagline title={t(original ? 'easy_use.changes_saved' : 'design.checkin_saved')} body={t(`tracking.saved.${savedOutcome}`)} />
          <Button title={t('easy_use.view_update')} onPress={() => { setSavedOpen(false); setViewSaved(true); }} />
          <Button title={t('common.close')} variant="ghost" compact onPress={closeSaved} />
        </View></View>
      </Modal>
      <CheckinDetailModal visible={viewSaved} checkin={savedRecord} index={Math.max(0, state.checkins.findIndex(c => c.clientId === savedRecord?.clientId))} onClose={() => { setViewSaved(false); editor.finish(); }} />
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
  dateControl: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 48, paddingVertical: 8 },
  smallAction: { minHeight: 48, minWidth: 48, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 6 },
  assistanceRow: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 48, paddingVertical: 8 },
  completedMedicine: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 76, paddingVertical: 10 },
  doseAnswer: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  answerText: { flex: 1, fontSize: 16, lineHeight: 24, color: colors.primary },
  editLink: { flexShrink: 1, fontSize: 16, lineHeight: 24, fontWeight: '500', color: colors.primary },
  quickSame: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 48, alignSelf: 'flex-start', paddingHorizontal: 0 },
  noteRow: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 68, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 22, backgroundColor: colors.glass },
  savedOverlay: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: colors.overlay },
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
  question: { fontSize: 18, lineHeight: 26, fontWeight: '500', letterSpacing: -.3, color: colors.text },
  medicineHeading: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 6 },
  medicineIcon: { width: 39, height: 39, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary50 },
  iconButton: { minWidth: 48, minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  symptomAnswer: { gap: 9, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.borderSoft },
  symptomHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  changeWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  error: { color: colors.danger, fontSize: 16, lineHeight: 24 },
  changeChip: { minHeight: 48, minWidth: 70, alignItems: 'center', justifyContent: 'center', borderRadius: 13, flex: 1, paddingHorizontal: 7, paddingVertical: 9, backgroundColor: colors.surfaceAlt, borderWidth: 1, borderColor: 'transparent' },
  changeChipActive: {
    backgroundColor: colors.primary50,
    borderColor: colors.primary,
  },
  changeText: { fontSize: 16, fontWeight: '500', color: colors.textMuted },
  changeTextActive: { color: colors.primary, fontWeight: '500' },
  // Same look as <Button compact variant="ghost">.
  unsureButton: { minHeight: 48, paddingVertical: 9, paddingHorizontal: 4, borderRadius: radius.button, alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent' },
  unsureText: { textAlign: 'center', fontSize: 15, lineHeight: 23, color: colors.primary },
  savedRow: { fontSize: 16, color: colors.textSoft, paddingVertical: 6 },
});
