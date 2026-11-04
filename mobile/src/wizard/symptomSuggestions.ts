import referenceData from '@/content/symptomReferences.json';
import type { MedEntry } from '@/content/wizardData';
import type { WizardMed } from './types';

export interface SuggestionSource { title: string; url: string; checkedAt: string; reason: string }
const references = referenceData as Record<string, Record<string, SuggestionSource>>;
export interface SymptomSuggestion {
  symptom: string;
  medications: string[];
  sources?: SuggestionSource[];
}

export function medicationSymptomSuggestions(medications: WizardMed[], catalog: MedEntry[]): SymptomSuggestion[] {
  const suggestions = new Map<string, SymptomSuggestion>();
  for (const entry of medications) {
    const medication = catalog.find(row => row.id === entry.medId);
    if (!medication) continue;
    for (const symptom of medication.symptomChips || []) {
      if (!suggestions.has(symptom)) suggestions.set(symptom, { symptom, medications: [] });
      const item = suggestions.get(symptom)!;
      if (!item.medications.includes(medication.name)) item.medications.push(medication.name);
      const reference = references[entry.medId]?.[symptom];
      if (reference) { item.sources ||= []; if (!item.sources.some(source => source.url === reference.url)) item.sources.push(reference); }
    }
  }
  return [...suggestions.values()];
}

/** Enforce the local catalog allowlist even if the remote response is malformed. */
export function prioritizeSymptomSuggestions(local: SymptomSuggestion[], remote: unknown): SymptomSuggestion[] {
  if (!Array.isArray(remote)) return local;
  const remaining = new Map(local.map(row => [row.symptom, row]));
  const ordered: SymptomSuggestion[] = [];
  for (const row of remote) {
    const symptom = row && typeof row === 'object' ? row.symptom : undefined;
    if (typeof symptom === 'string' && remaining.has(symptom)) {
      ordered.push(remaining.get(symptom)!);
      remaining.delete(symptom);
    }
  }
  return [...ordered, ...remaining.values()];
}
