import { checkinsInRange } from './reviewData';
import { localCalendarDate } from './calendarDate';
import type { WizardState } from './types';

export type TrackingStage = 'new' | 'first-update' | 'returning' | 'today';

/** Guidance describes the record; it never changes answers or restricts navigation. */
export function trackingJourney(state: WizardState, now = new Date()) {
  const records = checkinsInRange(state.checkins, 'all', now);
  const latest = records.at(-1);
  const started = state.meds.length > 0 || state.symptoms.selected.length > 0 || state.symptomOnlyMode;
  const stage: TrackingStage = latest
    ? localCalendarDate(new Date(latest.dateISO)) === localCalendarDate(now) ? 'today' : 'returning'
    : started ? 'first-update' : 'new';
  return {
    stage, latest,
    firstUpdate: !latest,
    step: stage === 'new' ? 1 : stage === 'today' ? 8 : 5,
    title: `journey.${stage}.title`,
    body: `journey.${stage}.body`,
    action: `journey.${stage}.action`,
  };
}
