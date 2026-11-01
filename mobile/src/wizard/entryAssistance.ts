import { medicationAdherence } from './medicationTracking';
import type { MedEntry } from '@/content/wizardData';
import type { TranslateFn } from './engine';
import { fmtDate } from './engine';
import { checkinsInRange, knownAdherenceAverage, symptomRatingSeries, wellbeingRatingSeries, type ReviewRange } from './reviewData';
import type { SymptomChange, WizardState } from './types';

export const symptomAliases: Record<string, string[]> = {
  Fatigue: ['fatigue', 'tired', 'tiredness', 'exhausted', 'cansado', 'cansada', 'fatiga'],
  'Brain fog': ['brain fog', 'foggy thinking'], Dizziness: ['dizziness', 'dizzy', 'lightheaded', 'mareo', 'mareado', 'mareada'],
  Headache: ['headache', 'headaches', 'dolor de cabeza'], Nausea: ['nausea', 'nauseous', 'náuseas', 'nauseas'],
  Constipation: ['constipation', 'constipated'], 'Low mood': ['low mood', 'feeling down'],
  'Sleep problems': ['sleep problems', 'trouble sleeping', 'cannot sleep', "can't sleep"],
};
const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** "no headache", "don't have a headache", "free of nausea": a denial within three words before the symptom. */
const SYMPTOM_NEGATION = /\b(?:no|not|sin|without|denies|never|no longer|don't|dont|doesn't|doesnt|didn't|didnt|haven't|havent|hasn't|hasnt|hadn't|hadnt|isn't|isnt|wasn't|wasnt|aren't|arent|free of|free from)\b(?:\s+\w+){0,3}\s*$/;
/** "headache-free", "headache free". */
const FREE_SUFFIX = /^\s*-?\s*free\b/;
/** "not better", "no worse", "isn't any better": a denial within two words before the change word. */
const CHANGE_NEGATION = /\b(?:no|not|never|isn't|isnt|hasn't|hasnt|wasn't|wasnt|doesn't|doesnt|didn't|didnt|hadn't|hadnt|aren't|arent)\b(?:\s+\w+){0,2}\s*$/;
const CHANGE_WORDS: Array<[RegExp, SymptomChange]> = [
  [/\b(much better|a lot better|much improved)\b/, 'Much better'],
  [/\b(worse|worsened|worsening)\b/, 'Worse'],
  [/\b(better|improved|improving)\b/, 'Slightly better'],
  [/\b(same|unchanged|no change)\b/, 'No change'],
];

/** A change the clause states outright; a negated change word ("not better") sets nothing. */
function describedChange(clause: string): SymptomChange | undefined {
  if (/\b(?:not sure|unsure|maybe|might|possibly|could|whether|if)\b/.test(clause)) return undefined;
  if (/\b(?:better|improved|improving)\b/.test(clause) && /\b(?:worse|worsened|worsening)\b/.test(clause)) return undefined;
  for (const [pattern, change] of CHANGE_WORDS) {
    const match = pattern.exec(clause);
    if (match && !CHANGE_NEGATION.test(clause.slice(0, match.index))) return change;
  }
  return undefined;
}

/** Local text matching only. A draft never asserts a symptom until confirmed. */
export function symptomEntryDraft(text: string, vocabulary: string[]) {
  const notes = text.trim().slice(0, 2000);
  const clauses = notes.toLowerCase().replace(/[’‘]/g, "'").split(/[.!?;,\n]|\b(?:but|and)\b/);
  const changes: Record<string, SymptomChange> = {};
  const names = [...new Set([...vocabulary, ...Object.keys(symptomAliases)])].filter(name => {
    const terms = [...new Set([name, ...(symptomAliases[name] || [])])];
    const clause = clauses.find(part => terms.some(term => {
      const match = new RegExp(`\\b${escape(term.toLowerCase())}\\b`).exec(part);
      if (!match) return false;
      if (/\b(?:if|might|may|could|worried|worry|afraid|risk|possible|possibly|maybe|not sure|unsure|mother|father|husband|wife|patient)\b/.test(part.slice(0, match.index))) return false;
      if (FREE_SUFFIX.test(part.slice(match.index + match[0].length))) return false;
      // "No change in headache" reports a symptom; it does not deny headache.
      return !SYMPTOM_NEGATION.test(part.slice(0, match.index).replace(/\bno change\b/g, 'unchanged'));
    }));
    if (!clause) return false;
    const change = describedChange(clause);
    if (change) changes[name] = change;
    return true;
  });
  return { names, notes, changes };
}

/** Label details remain literal: never turn tablet strength into a daily dose. */
export function medicationLabelDraft(text: string, catalog: MedEntry[]) {
  const lines = text.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  const matches = catalog.filter(med => [med.name.replace(/\s*\(.*?\)/g, ''), med.id, ...(med.aliases || [])].some(name => new RegExp(`\\b${escape(name)}\\b`, 'i').test(text)));
  const strengths = [...new Set((text.match(/\b\d+(?:\.\d+)?\s*(?:mg|mcg|µg|g|mL)(?:\s*\/\s*\d*(?:\.\d+)?\s*(?:mL|mg))?\b/gi) || []).map(value => value.trim()))];
  const instructions = lines.filter(line => /\b(take|apply|inhale|inject|instill)\b/i.test(line));
  const strength = matches.length === 1 && strengths.length === 1 ? strengths[0] : '';
  // An incomplete instruction must never look like a complete direction.
  const frequency = matches.length === 1 && instructions.length === 1 && instructions[0].length <= 100 ? instructions[0] : '';
  return { matches, strength, frequency, uncertain: { medicine: matches.length !== 1, strength: !strength, frequency: !frequency } };
}

/** Explain recorded facts locally; no causation, treatment advice or cloud input. */
export function explainTrackingProgress(state: WizardState, range: ReviewRange, t: TranslateFn, now = new Date()) {
  const checkins = checkinsInRange(state.checkins, range, now);
  if (!checkins.length) return t('parity.no_period_records');
  const lines = [t('easy.explain_basis', { count: checkins.length, range: t('parity.range.' + range) })];
  const series = Object.entries(symptomRatingSeries(checkins));
  if (!series.length) series.push([t('wellbeing.energy'), wellbeingRatingSeries(checkins, 'energy')]);
  for (const [symptom, points] of series.slice(0, 3)) {
    if (points.length < 2) continue;
    lines.push(t('easy.explain_rating', { symptom, first: points[0][1], last: points.at(-1)![1], from: fmtDate(new Date(points[0][0]).toISOString()), to: fmtDate(new Date(points.at(-1)![0]).toISOString()) }));
  }
  const average = knownAdherenceAverage(checkins);
  if (lines.length === 1) lines.push(t('review.not_enough_ratings'));
  lines.push(average === null ? t('parity.unknown_overview') : t('review.average_taken', { value: average }));
  lines.push(t('easy.explain_unknown', { count: checkins.filter(c => medicationAdherence(c) === null).length }), t('easy.explain_note'));
  return lines.join('\n\n');
}
