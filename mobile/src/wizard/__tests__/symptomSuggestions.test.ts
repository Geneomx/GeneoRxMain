import { expect, test } from '@jest/globals';
import { medicationSymptomSuggestions, prioritizeSymptomSuggestions } from '../symptomSuggestions';
import type { MedEntry } from '@/content/wizardData';

const catalog: MedEntry[] = [
  { id: 'a', name: 'Medicine A', symptomChips: ['Fatigue', 'Nausea'], claims: [] },
  { id: 'b', name: 'Medicine B', symptomChips: ['Fatigue'], claims: [] },
];

test('deduplicates suggestions while retaining the medication provenance', () => {
  const suggestions = medicationSymptomSuggestions(['a', 'b', 'a', 'unknown'].map(medId => ({ medId, dose: 'low', durationMonths: 1 })), catalog);
  expect(suggestions).toEqual([
    { symptom: 'Fatigue', medications: ['Medicine A', 'Medicine B'] },
    { symptom: 'Nausea', medications: ['Medicine A'] },
  ]);
});

test('remote ranking cannot invent symptoms, duplicate rows, or change provenance', () => {
  const local = medicationSymptomSuggestions([{ medId: 'a', dose: 'low', durationMonths: 1 }], catalog);
  expect(prioritizeSymptomSuggestions(local, [null, { symptom: 'Invented' }, { symptom: 'Nausea', medications: ['Invented drug'] }, { symptom: 'Nausea' }])).toEqual([local[1], local[0]]);
  expect(prioritizeSymptomSuggestions(local, { malformed: true })).toEqual(local);
  expect(local[0].symptom).toBe('Fatigue');
});
