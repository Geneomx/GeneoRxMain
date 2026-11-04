import { impactLabel, sideEffectList, type TranslateFn } from './engine';
import { checkinsInRange } from './reviewData';
import type { SymptomChange, WizardCheckin } from './types';

const isRating = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 10;
const medicationOrder: Record<string, number> = { some: 0, unsure: 1, all: 2, 'not-scheduled': 3 };
const symptomOrder: Record<SymptomChange | 'Not answered', number> = { Worse: 0, 'No change': 1, 'Slightly better': 2, 'Much better': 3, 'Not present': 4, 'Not answered': 5 };
type ProgressKind = 'worse' | 'better' | 'unchanged' | 'absent';
export type UpdateStatusEntry = {
  name: string;
  status: string;
  tone: 'positive' | 'neutral' | 'warning' | 'negative';
  severity?: number;
};

/** Only the latest dated check-in supplies the status; missing answers stay missing. */
export function latestUpdate(checkins: WizardCheckin[], t: TranslateFn, now = new Date()) {
  const records = checkinsInRange(checkins, 'all', now);
  const checkin = records.at(-1) ?? null;
  const empty = t('dashboard.update.not_recorded');
  const compact = (items: string[]) => [items.slice(0, 2).join(' · '), items.length > 2 ? t('dashboard.more_count', { count: items.length - 2 }) : ''].filter(Boolean).join(' · ');
  if (!checkin) return { checkin, index: 0, medications: '', medicationLines: [] as string[], medicationEntries: [] as UpdateStatusEntry[], symptoms: '', symptomLines: [] as string[], symptomEntries: [] as UpdateStatusEntry[], progress: '', progressItems: [] as Array<{ kind: ProgressKind; text: string }>, symptomProgress: false, notes: '' };

  // Use historical medication names and dose answers, never the current plan
  // or a legacy adherence percentage that may describe supplements instead.
  const medicationEntries = [...(checkin.medicationDoses ?? [])]
    .sort((a, b) => (medicationOrder[a.status] ?? 1) - (medicationOrder[b.status] ?? 1))
    .map((entry): UpdateStatusEntry => ({
      name: entry.medicationName,
      status: entry.status in medicationOrder ? t('tracking.dose.' + entry.status) : empty,
      tone: entry.status === 'all' ? 'positive' : entry.status === 'some' ? 'warning' : 'neutral',
    }));
  const medications = medicationEntries.map(entry => `${entry.name}: ${entry.status}`);
  const items = [...(checkin.symptoms?.items ?? [])].sort((a, b) => (symptomOrder[a.change] ?? 1) - (symptomOrder[b.change] ?? 1));
  const symptomEntries = items.map((item): UpdateStatusEntry => ({
    name: item.symptom,
    status: impactLabel(item.change, t) || empty,
    tone: item.change === 'Worse' ? 'negative' : item.change === 'Slightly better' || item.change === 'Much better' ? 'positive' : 'neutral',
    ...(isRating(item.severityNow) ? { severity: item.severityNow } : {}),
  }));
  const symptoms = items.map(item => isRating(item.severityNow)
    ? t('dashboard.symptom_score', { label: item.symptom, value: item.severityNow })
    : `${item.symptom}: ${impactLabel(item.change, t) || empty}`);

  // These are the user's reported changes, not an overall health score or a
  // claim that their medication caused an improvement. "Not present" stays separate.
  const counts = {
    worse: items.filter(item => item.change === 'Worse').length,
    better: items.filter(item => item.change === 'Slightly better' || item.change === 'Much better').length,
    unchanged: items.filter(item => item.change === 'No change').length,
    absent: items.filter(item => item.change === 'Not present').length,
  };
  const progressItems = (Object.entries(counts) as Array<[ProgressKind, number]>).filter(([, count]) => count > 0)
    .map(([kind, count]) => ({ kind, text: t(`dashboard.update.${kind}`, { count }) }));
  let progress = progressItems.map(item => item.text).join(' · ');
  const symptomProgress = !!progress;

  // If symptoms were skipped, compare an explicitly recorded wellbeing rating
  // with its previous recorded value; do not pull in an older symptom status.
  if (!progress) {
    for (const key of ['energy', 'mood', 'sleep', 'focus'] as const) {
      const current = checkin.wellbeing?.[key];
      if (!isRating(current)) continue;
      const previous = records.slice(0, -1).reverse().find(record => isRating(record.wellbeing?.[key]));
      if (!previous) continue;
      const delta = current - previous.wellbeing[key]!;
      const change = delta === 0 ? t('parity.rating_same') : Math.abs(delta) === 1
        ? t(delta > 0 ? 'dashboard.progress.one_higher' : 'dashboard.progress.one_lower')
        : t(delta > 0 ? 'parity.points_higher' : 'parity.points_lower', { count: Math.abs(delta) });
      const date = new Date(previous.dateISO).toLocaleDateString(undefined, { month: 'short', day: 'numeric', ...(new Date(previous.dateISO).getFullYear() !== now.getFullYear() ? { year: 'numeric' } : {}) });
      progress = `${t('wellbeing.' + key).replace(/\s*\([^)]*\)\s*$/, '')}: ${t('dashboard.progress.change_since', { change, date })}`;
      break;
    }
  }

  const effects = sideEffectList(checkin.sideEffects);
  const notes = [effects.length ? t('dashboard.update.reported_notes', { notes: effects.join(', ') }) : '', checkin.notes?.trim()].filter(Boolean).join('\n');
  return { checkin, index: records.length - 1, medications: compact(medications) || empty, medicationLines: medications, medicationEntries, symptoms: compact(symptoms) || empty, symptomLines: symptoms, symptomEntries, progress: progress || t('dashboard.update.no_comparison'), progressItems, symptomProgress, notes };
}

export type LatestUpdate = ReturnType<typeof latestUpdate>;
