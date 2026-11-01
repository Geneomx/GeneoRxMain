import { AppIcon } from '@/components/AppIcon';
import { MedicationLabelSheet } from '@/components/MedicationLabelSheet';
import { Accordion } from '@/screens/wizard/ui';
import { EditorSheet, ListRow, refined } from '@/components/RefinedUI';
import React, { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { AppText as Text } from '@/components/AppText';
import { Button } from '@/components/Button';
import { CalendarDateInput } from '@/components/CalendarDateInput';
import { DropdownSelect } from '@/components/DropdownSelect';
import { Input } from '@/components/Input';
import { useWizard } from '@/store/WizardContext';
import { useMedCatalog, findMedName } from '@/store/MedCatalogContext';
import { searchMeds } from '@/wizard/medSearch';
import { isoFromCalendarDate, todayISO } from '@/wizard/calendarDate';
import { fmtDate } from '@/wizard/engine';
import type { Dose } from '@/wizard/types';
import { medicationDurationMonths, medicationDetail } from '@/wizard/medicationTracking';
import { useTranslation } from '@/hooks/useTranslation';
import { FinePrint, Section, ToggleRow } from '@/screens/wizard/ui';
import { colors, spacing } from '@/theme';
import { trackingJourney } from '@/wizard/trackingJourney';
import { useToast } from '@/components/Toast';
import { LinearGradient } from 'expo-linear-gradient';
import { useWizardHeaderAction } from '@/components/WizardDock';

/** A stored YYYY-MM-DD start date shown the way other dates are ("Oct 1, 2026"). */
const startDateLabel = (value?: string) => value ? fmtDate(isoFromCalendarDate(value) ?? '') || value : '';

export const MedicationsStep: React.FC = () => {
  const { state, update, setStep } = useWizard();
  const { catalog, mergeCustomMeds } = useMedCatalog();
  const { fontScale } = useWindowDimensions();
  const { t } = useTranslation();
  const toast = useToast();
  const journey = trackingJourney(state);
  const [query, setQuery] = useState('');
  const [labelOpen, setLabelOpen] = useState(false);
  const [editor, setEditor] = useState<'catalog' | 'custom' | 'edit' | null>(null);
  const [pickId, setPickId] = useState('');
  const [custom, setCustom] = useState('');
  const [strength, setStrength] = useState('');
  const [frequency, setFrequency] = useState('');
  const [dose, setDose] = useState<Dose>('unknown');
  const [startDate, setStartDate] = useState('');
  const [dateError, setDateError] = useState(false);
  const available = catalog.filter(med => !state.meds.some(entry => entry.medId === med.id));
  const matches = useMemo(() => searchMeds(available, query), [available, query]);
  const open = (mode: 'catalog' | 'custom' | 'edit', id = '') => {
    const existing = state.meds.find(med => med.medId === id);
    setDose(existing?.dose || 'unknown');
    setPickId(id); setCustom(''); setStrength(existing?.strength || ''); setFrequency(existing?.frequency || ''); setStartDate(existing?.startDate || ''); setDateError(false); setEditor(mode);
  };
  const save = () => {
    const calendarDate = startDate.split('-').map((part, index) => index === 0 ? part : part.padStart(2, '0')).join('-');
    const parsedDate = startDate ? isoFromCalendarDate(startDate.split('-').map((part, index) => index === 0 ? part : part.padStart(2, '0')).join('-')) : null;
    if (startDate && (!parsedDate || calendarDate > todayISO())) { setDateError(true); return; }
    let id = pickId;
    if (editor === 'custom') {
      const name = custom.trim();
      if (!name) { Alert.alert(t('meds.title'), t('meds.alert_name')); return; }
      const existing = catalog.find(med => med.name.replace(/ \(custom\)$/i, '').toLowerCase() === name.toLowerCase());
      id = existing?.id || `custom_${name.toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 40) || 'medication'}_${Date.now().toString(36)}`;
      if (!existing) mergeCustomMeds([{ id, name, symptomChips: [], claims: [] }]);
    }
    if (!id) { Alert.alert(t('meds.title'), t('meds.alert_select')); return; }
    update(draft => {
      const existing = draft.meds.find(med => med.medId === id);
      const duration = parsedDate ? medicationDurationMonths({ startDate: calendarDate, durationMonths: 0 }) : null;
      const details = { dose, durationMonths: duration ?? 0, modelInputsConfirmed: dose !== 'unknown' && duration !== null, strength: strength.trim(), frequency: frequency.trim(), startDate: parsedDate ? calendarDate : '' };
      if (existing) Object.assign(existing, details);
      else draft.meds.push({ medId: id, ...details });
      draft.symptomOnlyMode = false;
    });
    setEditor(null); setQuery('');
    toast.show(t('journey.medicine_added'));
  };
  useWizardHeaderAction({ title: t('meds.add_btn'), onPress: () => { setQuery(''); open('catalog'); } });
  return <View style={{ gap: spacing.md }}>
    <FinePrint>{t(journey.firstUpdate ? 'journey.medicine_help' : 'calm.medicines_help')}</FinePrint>
    <MedicationLabelSheet visible={labelOpen} onClose={() => setLabelOpen(false)} catalog={catalog} onApply={draft => {
      setTimeout(() => { setQuery(''); open(state.meds.some(med => med.medId === draft.medId) ? 'edit' : 'catalog', draft.medId); if (draft.strength) setStrength(draft.strength); if (draft.frequency) setFrequency(draft.frequency); }, 400);
    }} />
    <Section>
      {state.meds.map((med, medIndex) => <Pressable key={med.medId} accessibilityRole="button" accessibilityLabel={`${t('tracking.edit')} ${findMedName(catalog, med.medId)}`} onPress={() => open('edit', med.medId)} style={[styles.row, styles.medRow, fontScale > 1.3 && { flexDirection: 'column', alignItems: 'flex-start' }, medIndex === state.meds.length - 1 && { borderBottomWidth: 0 }]}><View style={{ width: 40, height: 40, borderRadius: 14, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.primary50 }} accessible={false}><AppIcon name="pill" size={22} /></View><View style={{ flex: fontScale > 1.3 ? 0 : 1, gap: 4 }}><Text style={styles.title}>{findMedName(catalog, med.medId)}</Text><FinePrint>{medicationDetail({ ...med, startDate: startDateLabel(med.startDate) }) || t('tracking.details_missing')}</FinePrint></View><AppIcon name="chevron" size={16} color={colors.textMuted} /></Pressable>)}
      {!state.meds.length ? <FinePrint>{t('meds.none_yet')}</FinePrint> : null}
    </Section>
    {journey.firstUpdate && (state.meds.length > 0 || state.symptomOnlyMode) ? <Button title={t('journey.first-update.action')} onPress={() => setStep(5)} /> : null}
    <Button title={t('meds.add_btn')} variant={state.meds.length > 0 ? 'ghost' : 'primary'} onPress={() => { setQuery(''); open('catalog'); }} />
    <Button title={t('easy.scan_label')} variant="ghost" onPress={() => setLabelOpen(true)} />
    {!state.meds.length ? <ToggleRow label={t('meds.no_meds_btn')} value={state.symptomOnlyMode} onChange={value => update(draft => { draft.symptomOnlyMode = value; })} /> : null}
    <EditorSheet visible={editor !== null} title={t(editor === 'edit' ? 'tracking.edit_medication' : 'meds.add_btn')} onClose={() => setEditor(null)} footer={<Button title={t(editor === 'edit' ? 'tracking.save_details' : 'meds.add_btn')} onPress={save} />}>
            {editor === 'custom' ? <Input label={t('design.med_name')} value={custom} onChangeText={setCustom} maxLength={100} /> : editor === 'edit' ? <Text style={styles.title}>{findMedName(catalog, pickId)}</Text> : <>
              <Input label={t('meds.search')} placeholder={t('design.med_search')} value={query} onChangeText={setQuery} autoCapitalize="none" />
              <DropdownSelect label={t('meds.list')} value={pickId} options={matches.map(({ med }) => ({ value: med.id, label: med.name }))} onChange={setPickId} />
              {!matches.length ? <FinePrint>{t('meds.no_match')}</FinePrint> : null}
              <Button title={t('meds.add_custom')} variant="ghost" compact onPress={() => setEditor('custom')} />
            </>}
            <Accordion key={`${editor}-${pickId}`} title={t('journey.prescription_details')} subtitle={t('design.optional')} defaultOpen={editor === 'edit' || !!strength || !!frequency || !!startDate}>
            <FinePrint>{t('tracking.copy_label')}</FinePrint>
            <Input label={t('tracking.strength')} placeholder="500 mg" value={strength} onChangeText={setStrength} maxLength={100} />
            <Input label={t('tracking.frequency')} placeholder={t('tracking.frequency_example')} value={frequency} onChangeText={setFrequency} maxLength={100} />
            <CalendarDateInput label={t('tracking.start_date')} value={startDate} onChange={value => { setStartDate(value); setDateError(false); }} error={dateError ? t('tracking.date_error') : undefined} />
            </Accordion>
            {editor === 'edit' ? <Button title={t('meds.remove')} variant="ghost" onPress={() => { update(draft => { draft.meds = draft.meds.filter(med => med.medId !== pickId); }); setEditor(null); }} /> : null}
    </EditorSheet>
  </View>;
};
const styles = StyleSheet.create({ medRow: { flexDirection: 'row', alignItems: 'center', gap: 14 }, medRowStacked: { gap: 10, alignItems: 'flex-start' }, editPill: { minHeight: 44, minWidth: 64, borderRadius: 12, backgroundColor: colors.primary50, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14 }, editText: { fontSize: 16, fontWeight: '500', color: colors.primaryDark }, actions: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10 }, row: { minHeight: 64, paddingVertical: 12, gap: 5, borderBottomWidth: 1, borderBottomColor: colors.borderSoft }, title: { fontSize: 17, fontWeight: '500', color: colors.text }, link: { fontSize: 15, color: colors.primary }, overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(20,29,42,.35)' }, sheet: { maxHeight: '90%', backgroundColor: colors.surface, padding: 20, borderTopLeftRadius: 24, borderTopRightRadius: 24 }, heading: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 } });
