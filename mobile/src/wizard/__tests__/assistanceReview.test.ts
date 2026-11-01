import { MED_DB } from '@/content/wizardData';
import { translate } from '@/content/i18n';
import { prepareEntrySuggestions, confirmEntrySuggestions, mergeConfirmedEntry } from '../checkinAssistance';
import { checkinSymptomItems } from '../checkinEntry';
import { medicationLabelDraft, symptomEntryDraft } from '../entryAssistance';
import { defaultWizardState, type WizardCheckin } from '../types';
import { applySavePayload } from '../sync';
import { impactLabel } from '../recordFormatting';
import { progressExplanationFacts } from '../progressExplanation';
import { speechChunks, REPORT_TERM_KEYS } from '../reportReading';

const t = (key: string, vars?: Record<string, string | number | null | undefined>) => translate(key, 'en', vars);
const entry = 'I felt tired after lunch. My headache is better, 3 out of 10. Energy 0 out of 10. I took my medicine.';

test('preparing suggestions never fills unchecked fields or guesses medicine answers', () => {
  const suggestions = prepareEntrySuggestions(entry, ['Fatigue', 'Headache']);
  expect(suggestions.symptoms).toEqual([
    { name: 'Fatigue', evidence: 'I felt tired after lunch' },
    { name: 'Headache', evidence: 'My headache is better', change: 'Slightly better' },
  ]);
  expect(suggestions.wellbeing).toEqual([{ key: 'energy', value: 0, evidence: 'Energy 0 out of 10' }]);
  expect(confirmEntrySuggestions(suggestions, [], false)).toEqual({ names: [], notes: '', changes: {}, severities: {}, wellbeing: {} });
  const confirmed = confirmEntrySuggestions(suggestions, ['symptom:Headache', 'wellbeing:energy'], true);
  expect(confirmed.names).toEqual(['Headache']);
  expect(confirmed.changes).toEqual({ Headache: 'Slightly better' });
  expect(confirmed.wellbeing).toEqual({ energy: 0 });
  expect(confirmed.notes).toBe(entry);
  expect(confirmed).not.toHaveProperty('medicationDoses');
});

test('a rating is attached only to an explicit, unambiguous field', () => {
  const suggestions = prepareEntrySuggestions('Headache 0/10. Energy is 4 out of 10. Mood 11/10. Focus -2/10. Sleep 1.5/10.', []);
  expect(suggestions.symptoms.find(item => item.name === 'Headache')?.severity).toBe(0);
  expect(suggestions.wellbeing).toEqual([{ key: 'energy', value: 4, evidence: 'Energy is 4 out of 10' }]);
  expect(prepareEntrySuggestions('I feel tired with energy 7/10', []).symptoms[0]).not.toHaveProperty('severity');
  expect(prepareEntrySuggestions('Headache 5/10 with energy okay', []).wellbeing).toEqual([]);
  expect(prepareEntrySuggestions('Sleep problems 6/10', []).wellbeing).toEqual([]);
  expect(prepareEntrySuggestions('Energy might be 4/10', []).wellbeing).toEqual([]);
  expect(prepareEntrySuggestions('Headache 3/10 or 6/10', []).symptoms[0]).not.toHaveProperty('severity');
});

test('denials, uncertainty and descriptions about someone else are not reported symptoms', () => {
  for (const text of ["I don’t have a headache", 'If I get nausea', 'My mother has fatigue', 'I am worried about dizziness', 'No headache or dizziness']) {
    expect(symptomEntryDraft(text, []).names).toEqual([]);
  }
  expect(symptomEntryDraft('Headache better or worse', []).changes).toEqual({});
  expect(symptomEntryDraft('Headache is not better', []).changes).toEqual({});
  expect(symptomEntryDraft('Me siento cansado', []).names).toEqual(['Fatigue']);
  expect(symptomEntryDraft('Sin fatiga', []).names).toEqual([]);
  expect(symptomEntryDraft('No change in headache', [])).toMatchObject({ names: ['Headache'], changes: { Headache: 'No change' } });
  expect(prepareEntrySuggestions('Headache is not 3/10', []).symptoms[0]).not.toHaveProperty('severity');
});

test('confirmed suggestions fill blanks and preserve manually entered answers and long notes', () => {
  const current = { names: ['Fatigue'], changes: { Headache: 'Worse' as const }, severities: { Headache: 8 }, wellbeing: { energy: 7, mood: null, sleep: null, focus: null }, notes: 'Existing note '.repeat(200) };
  const untouched = JSON.stringify(current);
  const confirmed = confirmEntrySuggestions(prepareEntrySuggestions('Headache is better 3/10. Energy 0/10. Mood 6/10.', []), ['symptom:Headache', 'wellbeing:energy', 'wellbeing:mood'], true);
  const merged = mergeConfirmedEntry(current, confirmed);
  expect(merged.changes.Headache).toBe('Worse');
  expect(merged.severities.Headache).toBe(8);
  expect(merged.wellbeing.energy).toBe(7); expect(merged.wellbeing.mood).toBe(6);
  expect(merged.notes).toContain(current.notes);
  expect(mergeConfirmedEntry(merged, confirmed).notes).toBe(merged.notes);
  expect(JSON.stringify(current)).toBe(untouched);
});

test('severity-only answers remain separate from unchanged symptoms, including a real zero', () => {
  const items = checkinSymptomItems(['Headache', 'Fatigue', 'Nausea'], {}, { Headache: 0, Fatigue: 11 });
  expect(items).toEqual([{ symptom: 'Headache', change: 'Not answered', changeScore: 0, severityNow: 0 }]);
  expect(impactLabel(items[0].change, t)).toBe(t('checkin.not_answered'));
});

test('one final save retains a confirmed custom symptom without losing existing details', () => {
  const state = defaultWizardState();
  state.symptoms.details = { Fatigue: { notes: 'Existing context' } };
  applySavePayload(state, { symptoms: [{ name: 'New symptom' }], portal_state: { symptoms: { custom: ['New symptom'], details: state.symptoms.details } } });
  expect(state.symptoms.selected).toEqual(['New symptom']);
  expect(state.symptoms.custom).toEqual(['New symptom']);
  expect(state.symptoms.details?.Fatigue.notes).toBe('Existing context');
});

test('ambiguous label numbers and incomplete directions are left for confirmation', () => {
  const draft = medicationLabelDraft('Metformin 500 mg\nTake 1000 mg daily.', MED_DB);
  expect(draft.strength).toBe(''); expect(draft.uncertain.strength).toBe(true);
  const longInstruction = 'Take one tablet ' + 'with food '.repeat(15);
  expect(medicationLabelDraft('Metformin 500 mg\n' + longInstruction, MED_DB).frequency).toBe('');
  const clear = medicationLabelDraft('Metformin 500 mg\nTake one tablet twice daily.', MED_DB);
  expect(clear).toMatchObject({ strength: '500 mg', frequency: 'Take one tablet twice daily.', uncertain: { medicine: false, strength: false, frequency: false } });
});

test('progress comparisons link the actual selected records and exclude unknown ratings', () => {
  const state = defaultWizardState();
  const record = (dateISO: string, severity?: number): WizardCheckin => ({ dateISO, adherencePct: null, medicationDoses: [], supplementsTaken: [], notes: '', sideEffects: [], wellbeing: { energy: null, mood: null, sleep: null, focus: null }, symptoms: { items: severity === undefined ? [] : [{ symptom: 'Fatigue', change: 'Not answered', changeScore: 0, severityNow: severity }] } });
  state.checkins = [record('2026-10-01', 9), record('2026-10-25', 7), record('2026-10-26'), record('2026-10-29', 0)];
  const facts = progressExplanationFacts(state, '7', t, MED_DB, 'Fatigue', new Date(2026, 9, 30));
  expect(facts[0].records).toEqual([state.checkins[1], state.checkins[3]]);
  expect(facts[0].text).toContain('7/10'); expect(facts[0].text).toContain('0/10');
  expect(facts.find(fact => fact.id === 'medicines')?.text).toContain('0 answered check-ins out of 3');
  expect(facts.some(fact => fact.id.startsWith('wellbeing:'))).toBe(false);
});

test('read-aloud chunks include the complete report, within speech limits and without broken emoji', () => {
  const report = ('Your full report. GX 💙\n\nMedicine details and symptom answers. ').repeat(300);
  const chunks = speechChunks(report, 100);
  expect(chunks.every(chunk => chunk.length <= 100)).toBe(true);
  expect(chunks.join(' ').replace(/\s+/g, ' ').trim()).toBe(report.replace(/\s+/g, ' ').trim());
  expect(chunks.some(chunk => /[\uD800-\uDBFF]$/.test(chunk))).toBe(false);
  expect(speechChunks('')).toEqual([]);
  for (const key of REPORT_TERM_KEYS) {
    expect(t(`assist.term.${key}`)).not.toContain('assist.term.');
    expect(t(`assist.meaning.${key}`)).not.toContain('assist.meaning.');
  }
});
