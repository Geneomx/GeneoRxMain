import { checkinsInRange } from './reviewData';
import type { WizardCheckin } from './types';

const DOSE_STATUS: Record<string, string> = { all: 'all taken', some: 'missed some', unsure: 'not sure', 'not-scheduled': 'not scheduled' };
const clip = (value: string, max: number) => value.length > max ? value.slice(0, max - 1) + '…' : value;
const byDate = (a: WizardCheckin, b: WizardCheckin) => new Date(a.dateISO).getTime() - new Date(b.dateISO).getTime();

/**
 * The user's track record as short factual lines, oldest first, one per recent
 * check-in. Only what they entered: no scores or conclusions are inferred here.
 * Guests send these as context; signed-in users are grounded server-side.
 */
export function assistantRecordLines(checkins: WizardCheckin[], limit = 8): string[] {
  return [...checkins].sort(byDate).slice(-limit).map((c) => {
    const parts: string[] = [];
    const doses = (c.medicationDoses || []).map((d) => `${d.medicationName} ${DOSE_STATUS[d.status] ?? d.status}`);
    if (doses.length) parts.push(`medicines: ${doses.join(', ')}`);
    else if (typeof c.adherencePct === 'number') parts.push(`medicines taken: ${c.adherencePct}%`);
    const symptoms = (c.symptoms?.items || [])
      .filter((item) => item.change !== 'Not answered')
      .map((item) => `${item.symptom} ${String(item.change).toLowerCase()}${typeof item.severityNow === 'number' ? ` (${item.severityNow}/10)` : ''}`);
    if (symptoms.length) parts.push(`symptoms: ${symptoms.join(', ')}`);
    const wellbeing = (['energy', 'mood', 'sleep', 'focus'] as const)
      .filter((key) => typeof c.wellbeing?.[key] === 'number')
      .map((key) => `${key} ${c.wellbeing[key]}/10`);
    if (wellbeing.length) parts.push(`wellbeing: ${wellbeing.join(', ')}`);
    if (c.notes?.trim()) parts.push(`note: "${clip(c.notes.trim(), 120)}"`);
    return clip(`${c.dateISO.slice(0, 10)} · ${parts.join(' · ') || 'saved with no details'}`, 480);
  });
}

/** What the assistant sheet shows above the chat: how much record there is to talk about. */
export function assistantRecordSnapshot(checkins: WizardCheckin[], now = new Date()) {
  const recent = checkinsInRange(checkins, '30', now);
  const latest = [...checkins].sort(byDate).pop();
  return { count: recent.length, latestISO: latest ? latest.dateISO.slice(0, 10) : null, total: checkins.length };
}
