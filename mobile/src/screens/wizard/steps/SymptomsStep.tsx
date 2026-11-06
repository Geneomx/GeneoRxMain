import { useSetup } from '@/store/SetupContext';
import { EntryDraftSheet } from '@/components/EntryDraftSheet';
import { trackingJourney } from '@/wizard/trackingJourney';
import React, { useEffect, useMemo, useState } from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';
import { AppText as Text } from '@/components/AppText';
import { CalendarDateInput } from '@/components/CalendarDateInput';
import { normalizeCalendarInput } from '@/wizard/checkinEntry';
import { todayISO } from '@/wizard/calendarDate';
import { Button } from '@/components/Button';
import { EditorSheet, ListRow, refined } from '@/components/RefinedUI';
import { latestUpdate } from '@/wizard/latestUpdate';
import { useWizardHeaderAction } from '@/components/WizardDock';
import { Input } from '@/components/Input';
import { Chip } from '@/components/Chip';
import { MedicationSymptomSummary } from '@/components/MedicationSymptomSummary';
import { fetchSymptomSuggestions, type SymptomSuggestionResult } from '@/api/symptomSuggestions';
import { useWizard } from '@/store/WizardContext';
import { useMedCatalog } from '@/store/MedCatalogContext';
import { getSymptomUniverse } from '@/wizard/engine';
import { medicationSymptomSuggestions, prioritizeSymptomSuggestions } from '@/wizard/symptomSuggestions';
import { useTranslation } from '@/hooks/useTranslation';
import type { Severity } from '@/wizard/types';
import { Accordion, FinePrint, Section, Segmented, Tagline } from '@/screens/wizard/ui';
import { colors, radius, spacing } from '@/theme';

export const SymptomsStep: React.FC = () => {
  const setup = useSetup();
  const { state, update, setStep } = useWizard();
  const { catalog } = useMedCatalog();
  const { t } = useTranslation();
  const [detailFor, setDetailFor] = useState<string | null>(null);
  const [onset, setOnset] = useState('');
  const [detailSeverity, setDetailSeverity] = useState<Severity | ''>('');
  const [detailNotes, setDetailNotes] = useState('');
  const [dateError, setDateError] = useState(false);
  const [custom, setCustom] = useState('');
  const [query, setQuery] = useState('');
  const [explained, setExplained] = useState<string | null>(null);
  const [customOpen, setCustomOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [draftOpen, setDraftOpen] = useState(false);
  const [allSuggestions, setAllSuggestions] = useState(false);
  const [pendingSymptoms, setPendingSymptoms] = useState<string[]>([]);
  const openAdd = () => { setQuery(''); setPendingSymptoms([...state.symptoms.selected]); setAllSuggestions(false); setExplained(null); setAddOpen(true); };
  const proposed = new Set(pendingSymptoms);
  const local = useMemo(() => medicationSymptomSuggestions(state.meds, catalog), [state.meds, catalog]);
  const requestKey = JSON.stringify([state.meds.map(row => row.medId).sort(), local]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [remote, setRemote] = useState<(SymptomSuggestionResult & { key: string }) | null>(null);
  const result = remote?.key === requestKey ? remote : null;
  const recommended = prioritizeSymptomSuggestions(local, result?.suggestions);
  const remaining = getSymptomUniverse(state, catalog).filter(symptom => !recommended.some(row => row.symptom === symptom));
  const selected = new Set(state.symptoms.selected);
  const latest = latestUpdate(state.checkins, t);
  const matches = [...new Set([...remaining, ...recommended.map(item => item.symptom)])].filter(symptom => !selected.has(symptom) && (!query.trim() || symptom.toLowerCase().includes(query.trim().toLowerCase()))).slice(0, 8);
  const toggleProposed = (symptom: string) => setPendingSymptoms(values => values.includes(symptom) ? values.filter(name => name !== symptom) : [...values, symptom]);

  useEffect(() => {
    if (!local.length || !state.account.consent) return;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    setSuggestionsLoading(true);
    void fetchSymptomSuggestions([...new Set(state.meds.map(row => row.medId))], controller.signal)
      .then(response => { if (!controller.signal.aborted) setRemote({ ...response, key: requestKey }); })
      .catch(() => { /* Keep the local catalog suggestions available offline. */ })
      .finally(() => { clearTimeout(timer); setSuggestionsLoading(false); });
    return () => { clearTimeout(timer); controller.abort(); };
  }, [requestKey, state.account.consent]);

  const sevOpts = useMemo(() => [
    { label: t('symptoms.severity.mild'), value: 'mild' as Severity },
    { label: t('symptoms.severity.moderate'), value: 'moderate' as Severity },
    { label: t('symptoms.severity.severe'), value: 'severe' as Severity },
  ], [t]);

  const toggle = (symptom: string) => update(draft => {
    const confirmed = new Set(draft.symptoms.selected);
    if (confirmed.has(symptom)) confirmed.delete(symptom);
    else confirmed.add(symptom);
    draft.symptoms.selected = [...confirmed];
  });

  const editDetails = (symptom: string) => {
    const detail = state.symptoms.details?.[symptom];
    setDetailFor(symptom); setOnset(detail?.onsetDate || ''); setDetailSeverity(detail?.severity || ''); setDetailNotes(detail?.notes || ''); setDateError(false);
  };
  const saveDetails = () => {
    if (!detailFor) return;
    const date = onset ? normalizeCalendarInput(onset) : null;
    if (onset && (!date || date > todayISO())) { setDateError(true); return; }
    update(draft => { draft.symptoms.details = { ...draft.symptoms.details }; draft.symptoms.details[detailFor] = { onsetDate: date || '', ...(detailSeverity ? { severity: detailSeverity } : {}), notes: detailNotes.trim() }; });
    setDetailFor(null);
  };
  const addCustom = () => {
    const entered = custom.trim();
    const value = [...state.symptoms.custom, ...state.symptoms.selected, ...getSymptomUniverse(state, catalog)].find(name => name.toLowerCase() === entered.toLowerCase()) || entered;
    if (!value) return;
    update(draft => {
      if (!draft.symptoms.custom.includes(value)) draft.symptoms.custom.push(value);
      if (!draft.symptoms.selected.includes(value)) draft.symptoms.selected.push(value);
    });
    setCustom(''); setCustomOpen(false);
  };
  // Same as the website's Clear: drops every selected symptom, keeps the ones the user typed in as options.
  const clearSelected = () => { setPendingSymptoms([]); update(draft => { draft.symptoms.selected = []; }); };
  useWizardHeaderAction({ title: t('symptoms.add_btn'), onPress: openAdd });

  return (
    <View style={{ gap: spacing.md }}>
      <FinePrint>{t('calm.symptoms_help')}</FinePrint>
      <EntryDraftSheet visible={draftOpen} onClose={() => setDraftOpen(false)} mode="symptoms" vocabulary={getSymptomUniverse(state, catalog)} onApply={entry => update(draft => {
        draft.symptoms.selected = [...new Set([...draft.symptoms.selected, ...entry.names])];
        draft.symptoms.custom = [...new Set([...draft.symptoms.custom, ...entry.names.filter(name => !getSymptomUniverse(state, catalog).includes(name))])];
        for (const name of entry.names) draft.symptoms.details = { ...draft.symptoms.details, [name]: { ...draft.symptoms.details?.[name], notes: [draft.symptoms.details?.[name]?.notes, entry.notes].filter(Boolean).join('\n').slice(0, 2000) } };
      })} />
      <View style={refined.listGroup}>{[...selected].map((symptom, index) => <ListRow key={symptom} icon="heart" title={symptom} detail={latest.symptomEntries.find(entry => entry.name === symptom)?.status || t('light.not_recorded')} last={index === selected.size - 1} onPress={() => editDetails(symptom)} />)}
        {!selected.size ? <FinePrint>{t('simple.choose_below')}</FinePrint> : null}
      </View>
      <Button title={t('symptoms.add_btn')} variant={selected.size ? 'ghost' : 'secondary'} full onPress={openAdd} />
      <Button title={t('easy.describe_symptom')} variant="ghost" full onPress={() => setDraftOpen(true)} />
      {selected.size ? <View style={styles.clearWrap}><Button title={t('symptoms.clear')} variant="ghost" compact onPress={clearSelected} /></View> : null}
      {!setup.active && trackingJourney(state).firstUpdate ? <Button title={t('setup.resume')} variant="secondary" onPress={() => { void setup.begin(2); }} /> : null}
      <EditorSheet visible={addOpen} title={t('symptoms.add_btn')} onClose={() => setAddOpen(false)} footer={<Button title={t(pendingSymptoms.length === 1 ? 'setup.confirm_symptom' : 'assist.confirm_symptoms', { count: pendingSymptoms.length })} disabled={pendingSymptoms.length === selected.size && pendingSymptoms.every(name => selected.has(name))} onPress={() => { update(draft => { draft.symptoms.selected = [...pendingSymptoms]; }); setAddOpen(false); }} />}>
        <FinePrint>{t('assist.symptom_selection_help')}</FinePrint>
        <Input label={t('simple.find_symptom')} placeholder={t('simple.find_symptom')} value={query} onChangeText={setQuery} />
        <Button title={t('design.add_own')} variant="ghost" compact onPress={() => { setAddOpen(false); setTimeout(() => setCustomOpen(true), 350); }} />

      {recommended.length && !query.trim() ? <Accordion plain defaultOpen title={t(result?.source === 'ai' ? 'clean.ai_suggestions' : 'design.suggested_for')}>
        <FinePrint>{t('clean.suggestion_note')}</FinePrint>
        <FinePrint>{t(suggestionsLoading ? 'ai.suggestions_loading' : result?.source === 'ai' ? 'ai.ai_order' : 'ai.catalog_order')}</FinePrint>
        <View style={styles.suggestions}>
          {(allSuggestions ? recommended : recommended.slice(0, 4)).map(item => {
            const checked = proposed.has(item.symptom);
            return <View key={item.symptom} style={[styles.option, checked && styles.optionSelected]}>
              <View style={styles.optionCopy}>
                <Pressable accessibilityRole="checkbox" accessibilityLabel={item.symptom} accessibilityState={{ checked }} onPress={() => toggleProposed(item.symptom)} style={styles.catalogRow}><Text style={[styles.optionTitle, { flex: 1 }]}>{item.symptom}</Text><Text style={styles.reasonLink}>{checked ? '✓' : '+'}</Text></Pressable>
                <Pressable accessibilityRole="button" accessibilityLabel={`${t('simple.suggestion_why')} ${item.symptom}`} accessibilityState={{ expanded: explained === item.symptom }} onPress={() => setExplained(value => value === item.symptom ? null : item.symptom)} style={styles.explanationButton}><Text style={styles.reasonLink}>{t('simple.suggestion_why')}</Text></Pressable>
                {explained === item.symptom ? <View style={{ gap: 8 }}>
                  <Text style={styles.reason}>{t('simple.suggestion_context', { medications: item.medications.join(', ') })}</Text>
                  {item.sources?.length ? item.sources.map(source => <View key={source.url} style={{ gap: 4 }}><Text style={styles.reason}>{source.reason}</Text><Button title={source.title} variant="ghost" compact onPress={() => { void Linking.openURL(source.url).catch(() => undefined); }} /><FinePrint>{t('tracking.source_checked', { date: source.checkedAt })}</FinePrint></View>) : <FinePrint>{t('tracking.catalog_only')}</FinePrint>}
                </View> : null}
              </View>
            </View>;
          })}
        </View>
        {recommended.length > 4 ? <Button compact variant="ghost" title={t(allSuggestions ? 'easy.show_less' : 'easy.all_suggestions', { count: recommended.length })} onPress={() => setAllSuggestions(!allSuggestions)} /> : null}
        <FinePrint>{t('simple.suggestion_limit')}</FinePrint>
      </Accordion> : null}

        {query.trim() || !recommended.length ? <View>{matches.map(symptom => <Pressable key={symptom} accessibilityRole="checkbox" accessibilityLabel={symptom} accessibilityState={{ checked: proposed.has(symptom) }} onPress={() => toggleProposed(symptom)} style={styles.catalogRow}><Text style={[styles.optionTitle, { flex: 1 }]}>{symptom}</Text><Text style={styles.reasonLink}>{proposed.has(symptom) ? '✓' : '+'}</Text></Pressable>)}</View> : null}
      <Accordion title={t('design.symptom_strength')} subtitle={t('design.optional')}>
        <Tagline title={t('design.symptom_strength')} body={t('design.symptom_strength_sub')} />
        <Segmented value={state.symptoms.severity} onChange={value => update(draft => { draft.symptoms.severity = value; })} options={sevOpts} />
      </Accordion>
      <Accordion plain title={t('clean.review_summary')}><MedicationSymptomSummary /></Accordion>
      </EditorSheet>
      <EditorSheet visible={customOpen} title={t('design.add_own')} onClose={() => setCustomOpen(false)} footer={<Button title={t('symptoms.add_btn')} onPress={addCustom} disabled={!custom.trim()} />}><Input label={t('symptoms.add_custom')} placeholder={t('symptoms.custom_placeholder')} value={custom} onChangeText={setCustom} maxLength={100} onSubmitEditing={addCustom} returnKeyType="done" /></EditorSheet>
      <EditorSheet visible={detailFor !== null} title={detailFor || ''} onClose={() => setDetailFor(null)} footer={<Button title={t('tracking.save_details')} onPress={saveDetails} />}>
              <CalendarDateInput label={t('tracking.onset_date')} value={onset} onChange={value => { setOnset(value); setDateError(false); }} error={dateError ? t('tracking.date_error') : undefined} />
              <Text style={styles.optionTitle}>{t('tracking.severity_optional')}</Text>
              <View style={styles.chips}>{sevOpts.map(option => <Chip key={option.value} label={option.label} selected={detailSeverity === option.value} onPress={() => setDetailSeverity(option.value)} />)}<Chip label={t('checkin.unsure')} selected={!detailSeverity} onPress={() => setDetailSeverity('')} /></View>
              <Input label={t('tracking.symptom_notes')} value={detailNotes} onChangeText={setDetailNotes} multiline maxLength={2000} />
              <Button title={t('simple.remove_symptom')} variant="ghost" onPress={() => { if (detailFor) toggle(detailFor); setDetailFor(null); }} />
      </EditorSheet>
    </View>
  );
};

const styles = StyleSheet.create({
  clearWrap: { alignSelf: 'flex-start' },
  catalogRow: { minHeight: 56, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.borderSoft },
  trackedRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  suggestions: { gap: 8 },
  option: { minHeight: 64, paddingVertical: 12, borderBottomWidth: 1, borderColor: colors.borderSoft, backgroundColor: colors.surface, flexDirection: 'row', alignItems: 'center', gap: 12 },
  optionSelected: { borderColor: colors.primary },
  optionCopy: { flex: 1 },
  optionTitle: { fontSize: 17, fontWeight: '500', color: colors.text },
  explanationButton: { minHeight: 48, justifyContent: 'center' },
  reasonLink: { fontSize: 15, color: colors.primary },
  reason: { fontSize: 16, color: colors.textSoft, marginTop: 4 },
  selection: { fontSize: 22, color: colors.textMuted },
  selectionOn: { color: colors.primary },
});
