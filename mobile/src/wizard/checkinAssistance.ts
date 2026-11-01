import { symptomAliases, symptomEntryDraft } from './entryAssistance';
import type { SymptomChange, Wellbeing } from './types';

type WellbeingKey = 'energy' | 'mood' | 'sleep' | 'focus';
export type EntrySuggestions = {
  notes: string;
  symptoms: Array<{ name: string; evidence: string; change?: SymptomChange; severity?: number }>;
  wellbeing: Array<{ key: WellbeingKey; value: number; evidence: string }>;
};
export type ConfirmedEntryDraft = {
  names: string[]; notes: string; changes: Record<string, SymptomChange>;
  severities: Record<string, number>; wellbeing: Partial<Wellbeing>;
};
const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const clauses = (text: string) => text.split(/[.!?;\n]|,\s*|\b(?:but|and)\b/i).map(value => value.trim()).filter(Boolean);
const uncertain = /\b(?:not sure|unsure|maybe|might|could|possibly|if|used to|previously)\b/i;

/** Only a literal, unambiguous 0–10 answer. Descriptive words never invent a number. */
function explicitRating(text: string): number | undefined {
  if (uncertain.test(text)) return undefined;
  const matches = [...text.matchAll(/(?:^|[^\d.\-])\b(\d+(?:\.\d+)?)\s*(?:\/|out\s+of)\s*10\b/gi)];
  if (matches.length !== 1) return undefined;
  if (/\b(?:not|no|isn't|wasn't|isnt|wasnt)(?:\s+at)?\s*$/i.test(text.slice(0, matches[0].index))) return undefined;
  const value = Number(matches[0][1]);
  return Number.isInteger(value) && value >= 0 && value <= 10 ? value : undefined;
}

/** Offline matching: all candidates remain separate from both form answers and stored records. */
export function prepareEntrySuggestions(text: string, vocabulary: string[]): EntrySuggestions {
  const base = symptomEntryDraft(text, vocabulary);
  const parts = clauses(base.notes);
  return {
    notes: base.notes,
    symptoms: base.names.map(name => {
      const terms = [name, ...(symptomAliases[name] || [])];
      // Reuse the denial checks so an earlier "no headache" cannot supply the rating.
      const evidence = parts.find(part => symptomEntryDraft(part, [name]).names.includes(name) && terms.some(term => new RegExp(`\\b${escape(term)}\\b`, 'i').test(part))) || base.notes;
      const multipleSymptoms = base.names.filter(other => [other, ...(symptomAliases[other] || [])].some(term => new RegExp(`\\b${escape(term)}\\b`, 'i').test(evidence))).length > 1;
      const severity = multipleSymptoms || /\b(?:energy|mood|sleep|focus)\b/i.test(evidence) ? undefined : explicitRating(evidence);
      return { name, evidence, ...(base.changes[name] ? { change: base.changes[name] } : {}), ...(severity === undefined ? {} : { severity }) };
    }),
    wellbeing: (['energy', 'mood', 'sleep', 'focus'] as const).flatMap(key => {
      const evidence = parts.find(part => new RegExp(`\\b${key}\\b`, 'i').test(part) && !/\b(?:mother|father|husband|wife|patient|no|not|without)\b/i.test(part));
      const keyAt = evidence ? new RegExp(`\\b${key}\\b`, 'i').exec(evidence) : null;
      const answer = keyAt ? evidence!.slice(keyAt.index + keyAt[0].length) : '';
      const value = /^\s*(?:level\s*)?(?:(?:is|was|rated|rating|score|at|of)\s*|[:=]\s*)?(?:is\s*)?\d/i.test(answer) ? explicitRating(answer) : undefined;
      // "energy and mood 4/10" cannot be assigned to two measures.
      const measures = evidence ? (['energy', 'mood', 'sleep', 'focus'] as const).filter(other => new RegExp(`\\b${other}\\b`, 'i').test(evidence)) : [];
      return value === undefined || measures.length !== 1 ? [] : [{ key, value, evidence: evidence! }];
    }),
  };
}

/** A positive selection is required for each structured suggestion. Notes have their own control. */
export function confirmEntrySuggestions(suggestions: EntrySuggestions, selected: string[], includeNotes: boolean): ConfirmedEntryDraft {
  const approved = new Set(selected);
  const symptoms = suggestions.symptoms.filter(item => approved.has(`symptom:${item.name}`));
  return {
    names: symptoms.map(item => item.name), notes: includeNotes ? suggestions.notes : '',
    changes: Object.fromEntries(symptoms.filter(item => item.change !== undefined).map(item => [item.name, item.change!])),
    severities: Object.fromEntries(symptoms.filter(item => item.severity !== undefined).map(item => [item.name, item.severity!])),
    wellbeing: Object.fromEntries(suggestions.wellbeing.filter(item => approved.has(`wellbeing:${item.key}`)).map(item => [item.key, item.value])),
  };
}

/** Preserve any answer the user already entered; helpers fill only blank fields. */
export function mergeConfirmedEntry(current: { names: string[]; notes: string; changes: Record<string, SymptomChange>; severities: Record<string, number>; wellbeing: Wellbeing }, confirmed: ConfirmedEntryDraft) {
  return {
    names: [...new Set([...current.names, ...confirmed.names])],
    notes: confirmed.notes && !current.notes.includes(confirmed.notes) ? [current.notes, confirmed.notes].filter(Boolean).join('\n').slice(0, 10000) : current.notes,
    changes: { ...confirmed.changes, ...current.changes }, severities: { ...confirmed.severities, ...current.severities },
    wellbeing: { ...current.wellbeing, ...Object.fromEntries(Object.entries(confirmed.wellbeing).filter(([key]) => current.wellbeing[key as WellbeingKey] == null)) },
  };
}
