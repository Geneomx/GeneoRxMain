// Presentation state for the vertical step list.
//
// PURELY DESCRIPTIVE. Nothing here gates navigation: `stepLockReason` returns a
// label, not a permission. Every visible step stayed tappable in the old pill
// tray and stays tappable now — turning one of these into a real gate would
// take away access the user already has.

import { computeNutrientScores, detectHealthPatterns, latestCheckin, type TranslateFn } from '@/wizard/engine';
import { daysSince } from '@/wizard/calendarDate';
import type { MedEntry } from '@/content/wizardData';
import type { WizardState } from '@/wizard/types';

/** A week between check-ins — the cadence the reminder cron already uses. */
const CHECKIN_DUE_DAYS = 7;

/**
 * Counted labels carry a `_one` variant, because "1 weeks" reads as a bug to
 * anyone looking at it. Only the four genuinely countable values need it —
 * "1 active" and "1 tracked" are already correct English.
 */
export function counted(t: TranslateFn, key: string, n: number): string {
  return n === 1 ? t(`${key}_one`, { n }) : t(key, { n });
}

export type StepState =
  /** Answered. Shows what is in it. */
  | 'done'
  /** The step that is open right now. Exactly one per screen. */
  | 'current'
  /** Has something to show and is tappable — just not current. */
  | 'available'
  /** Reachable, but would be empty until a prerequisite is met. */
  | 'locked';

/** Steps 1-4 (plus 0 for guests) are set once. They fold into a single band. */
export const SETUP_STEPS = [0, 1, 2, 3, 4];

export function isSetupStep(idx: number): boolean {
  return SETUP_STEPS.includes(idx);
}

/**
 * Has the user got far enough that folding setup is honest? Only fold once
 * there is something in it — otherwise a first-run user would see their one
 * remaining task hidden behind a summary band.
 */
export function isSetupComplete(s: WizardState): boolean {
  const hasMeds = s.meds.length > 0 || s.symptomOnlyMode;
  const hasSymptoms = s.symptoms.selected.length + s.symptoms.custom.length > 0;
  return hasMeds && hasSymptoms;
}

/** True when this week's check-in has not been logged yet. */
export function isCheckinDue(s: WizardState): boolean {
  const last = latestCheckin(s);
  if (!last?.dateISO) return true;
  return daysSince(last.dateISO) >= CHECKIN_DUE_DAYS;
}

/**
 * The reason a step has nothing to show yet, or null when it has. Only steps
 * that would genuinely render empty are described this way — a step that works
 * with the data on hand is never labelled locked.
 */
export function stepLockReason(s: WizardState, idx: number, t: TranslateFn): string | null {
  const hasMeds = s.meds.length > 0;
  const hasCheckins = s.checkins.length > 0;

  switch (idx) {
    case 4:
      // Results is computed from medications. Symptom-only mode is a supported
      // path through the wizard, so it counts as having something to show.
      return hasMeds || s.symptomOnlyMode ? null : t('step.lock.needsMed');
    case 6:
    case 7:
      return hasCheckins ? null : t('step.lock.needsCheckin');
    default:
      return null;
  }
}

/** Done / current / available / locked, for one step. */
export function stepStateOf(s: WizardState, idx: number, currentStep: number, t: TranslateFn): StepState {
  if (idx === currentStep) return 'current';
  if (stepLockReason(s, idx, t)) return 'locked';

  const hasMeds = s.meds.length > 0 || s.symptomOnlyMode;
  const hasSymptoms = s.symptoms.selected.length + s.symptoms.custom.length > 0;

  switch (idx) {
    case 0: return s.account.consent ? 'done' : 'available';
    case 1: return hasMeds ? 'done' : 'available';
    case 2: return hasSymptoms ? 'done' : 'available';
    // The baseline always holds four numbers, so "done" here means the steps it
    // depends on are answered — not that the user typed anything new.
    case 3: return hasMeds && hasSymptoms ? 'done' : 'available';
    case 4: return 'done';
    case 5: return isCheckinDue(s) ? 'available' : 'done';
    default: return 'available';
  }
}

/**
 * The short value shown on the right of a step row — 3 active, 6 weeks, Due
 * now. Returns null when there is nothing true to say, and the row renders a
 * dash rather than a zero.
 */
export function stepSummary(
  s: WizardState,
  idx: number,
  t: TranslateFn,
  catalog?: MedEntry[],
): string | null {
  switch (idx) {
    case 0:
      return s.account.consent ? t('step.sum.set') : null;

    case 1: {
      if (s.meds.length > 0) return t('step.sum.meds', { n: s.meds.length });
      return s.symptomOnlyMode ? t('step.sum.symptomsOnly') : null;
    }

    case 2: {
      const n = s.symptoms.selected.length + s.symptoms.custom.length;
      return n > 0 ? t('step.sum.symptoms', { n }) : null;
    }

    case 3: {
      const b = s.wellbeingBaseline;
      return t('step.sum.baseline', { v: `${b.energy}·${b.mood}·${b.sleep}·${b.focus}` });
    }

    case 4: {
      const n = computeNutrientScores(s, catalog).length;
      return n > 0 ? counted(t, 'step.sum.signals', n) : null;
    }

    // Deliberately says "Due now" rather than a dash when there is no history
    // at all: a user who has never checked in is exactly who needs telling.
    case 5:
      return isCheckinDue(s) ? t('step.sum.due') : t('step.sum.logged');

    case 6: {
      const n = s.checkins.length;
      return n > 0 ? counted(t, 'step.sum.weeks', n) : null;
    }

    case 7: {
      if (!s.checkins.length) return null;
      const n = detectHealthPatterns(s, t).length;
      return n > 0 ? counted(t, 'step.sum.patterns', n) : null;
    }

    case 8:
      return s.meds.length > 0 || s.symptomOnlyMode ? t('step.sum.ready') : null;

    default:
      return null;
  }
}

/**
 * The one-line digest under the folded setup band — everything the five rows
 * were carrying, comma-free so it reads as a single mono strip.
 */
export function setupDigest(s: WizardState, t: TranslateFn, catalog?: MedEntry[]): string {
  const parts: string[] = [];
  for (const idx of [1, 2, 3, 4]) {
    const v = stepSummary(s, idx, t, catalog);
    if (v) parts.push(v);
  }
  return parts.join(' · ');
}
