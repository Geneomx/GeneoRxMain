import type { WizardCheckin, WizardState } from './types';

// Collect information before opening the screens that explain the saved record.
const ORDER = [0, 1, 2, 3, 5, 4, 6, 8] as const;
export type SetupStep = typeof ORDER[number];
export type SetupProgress = {
  version: 1;
  status: 'in-progress' | 'complete';
  step: SetupStep;
  checkinKey?: string;
};

export function setupSteps(isGuest: boolean): readonly SetupStep[] {
  return isGuest ? ORDER : ORDER.filter(step => step !== 0);
}

export function readSetupProgress(value: unknown): SetupProgress | null {
  if (!value || typeof value !== 'object') return null;
  const p = value as Partial<SetupProgress>;
  if (p.version !== 1 || !ORDER.includes(p.step as SetupStep) || !['in-progress', 'complete'].includes(p.status || '')) return null;
  return { version: 1, status: p.status!, step: p.step!, ...(typeof p.checkinKey === 'string' ? { checkinKey: p.checkinKey } : {}) };
}

export function needsSetup(state: WizardState, progress: SetupProgress | null): boolean {
  if (progress) return progress.status === 'in-progress';
  return state.checkins.length === 0;
}

export function resumeSetupStep(state: WizardState, progress: SetupProgress | null, isGuest: boolean): SetupStep {
  const steps = setupSteps(isGuest);
  if (progress?.status === 'in-progress' && steps.includes(progress.step)) return progress.step;
  // Existing first-time users who already added medicines can continue their list.
  if (state.meds.length || state.symptomOnlyMode) return 1;
  return steps[0];
}

export function adjacentSetupStep(step: SetupStep, isGuest: boolean, direction: 1 | -1): SetupStep | null {
  const steps = setupSteps(isGuest);
  const index = steps.indexOf(step);
  return index < 0 ? null : steps[index + direction] ?? null;
}

export function setupCheckinKey(record: WizardCheckin): string {
  return record.clientId ? `client:${record.clientId}` : record.id != null ? `id:${record.id}` : `date:${record.dateISO}`;
}

export function setupRecord(state: WizardState, progress: SetupProgress | null): WizardCheckin | null {
  if (progress?.checkinKey) return state.checkins.find(record => setupCheckinKey(record) === progress.checkinKey) ?? null;
  // Recover a first save that completed just before the setup bookmark was written.
  return state.checkins.length === 1 ? state.checkins[0] : null;
}
