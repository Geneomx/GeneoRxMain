import type { MedEntry } from '@/content/wizardData';
import type { TranslateFn } from './engine';
import { fmtDate, impactLabel, sideEffectList } from './recordFormatting';
import { medicationAdherence, medicationDetail } from './medicationTracking';
import { type WizardCheckin, type WizardState } from './types';
import { compareCheckins } from './checkinOrder';

export type ReviewRange = '7' | '30' | 'all';

export function reviewPeriod(range: ReviewRange, checkins: WizardCheckin[], now = new Date()) {
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const start = range === 'all' ? new Date(checkins[0]?.dateISO || end) : new Date(now.getFullYear(), now.getMonth(), now.getDate() - Number(range) + 1);
  return { from: start.toISOString(), to: end.toISOString(), label: `${fmtDate(start.toISOString())} – ${fmtDate(end.toISOString())}` };
}

/** Include record contents so a saved edit can be marked stale after an edit, delete or new check-in. */
export function summaryBasis(state: WizardState, range: ReviewRange, now = new Date()) {
  const value = JSON.stringify([state.meds, state.symptoms, checkinsInRange(state.checkins, range, now)]);
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) hash = Math.imul(hash ^ value.charCodeAt(i), 16777619);
  return `${value.length}:${hash >>> 0}`;
}
export function checkinsInRange(checkins: WizardCheckin[], range: ReviewRange, now = new Date()) {
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime();
  const start = range === 'all' ? -Infinity : new Date(now.getFullYear(), now.getMonth(), now.getDate() - Number(range) + 1).getTime();
  return checkins.filter(c => { const time = new Date(c.dateISO).getTime(); return time >= start && time < end; }).sort(compareCheckins);
}
export function knownAdherenceAverage(checkins: WizardCheckin[]): number | null {
  const values = checkins.map(medicationAdherence).filter((v): v is number => typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= 100);
  return values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : null;
}
export function symptomRatingSeries(checkins: WizardCheckin[]) {
  const series: Record<string, Array<[number, number]>> = {};
  for (const c of checkins) for (const item of c.symptoms?.items || []) {
    if (typeof item.severityNow === 'number' && Number.isFinite(item.severityNow)) (series[item.symptom] ||= []).push([new Date(c.dateISO).getTime(), item.severityNow]);
  }
  return series;
}
export function trackingOverview(state: WizardState, t: TranslateFn) {
  const counts = [t(state.meds.length === 1 ? 'design.medication_one' : 'design.medication_many', { count: state.meds.length }),
    t(state.symptoms.selected.length === 1 ? 'design.symptom_one' : 'design.symptom_many', { count: state.symptoms.selected.length }),
    t(state.checkins.length === 1 ? 'design.checkin_one' : 'design.checkin_many', { count: state.checkins.length })].join(' · ') + '.';
  const average = knownAdherenceAverage(state.checkins);
  const trend = Object.entries(symptomRatingSeries(state.checkins)).find(([, points]) => points.length > 1);
  return [counts, trend ? `${trend[0]}: ${trend[1][0][1]} → ${trend[1].at(-1)![1]}/10.` : '', state.checkins.length ? average === null ? t('parity.unknown_overview') : t('review.average_taken', { value: average }) : t('design.no_checkins_body')].filter(Boolean).join(' ');
}

/** The reference's narrative format, grounded only in the selected records. */
export function trackingHealthStory(state: WizardState, t: TranslateFn, catalog: MedEntry[] = []): string {
  const records = [...state.checkins].filter(c => Number.isFinite(new Date(c.dateISO).getTime())).sort(compareCheckins);
  const latest = records.at(-1);
  const names = state.meds.map(med => catalog.find(item => item.id === med.medId)?.name || med.medId.replace(/^custom[:_]/, '').replace(/[_-]/g, ' '));
  const medicationText = names.slice(0, 2).join(', ') + (names.length > 2 ? t('report.story_other_meds') : '');
  const symptomText = state.symptoms.selected.slice(0, 3).join(', ') + (state.symptoms.selected.length > 3 ? t('report.story_other_symptoms') : '');
  const paragraphs = [t(names.length ? 'report.story_meds' : 'report.story_no_meds', { medications: medicationText }), t(symptomText ? 'report.story_symptoms' : 'report.story_no_symptoms', { symptoms: symptomText })];
  if (!latest) return [...paragraphs, t('report.story_no_checkins')].join('\n\n');
  paragraphs.push(t('report.story_period', { count: records.length, from: fmtDate(records[0].dateISO), to: fmtDate(latest.dateISO) }));
  const changes = (latest.symptoms?.items || []).slice(0, 3).map(item => `${item.symptom}: ${impactLabel(item.change, t)}`).join('; ');
  if (changes) paragraphs.push(t('report.story_latest', { date: fmtDate(latest.dateISO), changes }));
  const trends = Object.entries(symptomRatingSeries(records)).flatMap(([name, points]) => {
    const valid = points.filter(([, value]) => value >= 0 && value <= 10);
    if (valid.length < 2) return [];
    const first = valid[0], last = valid.at(-1)!;
    return [t('report.story_trend', { symptom: name, first: first[1], last: last[1], from: fmtDate(new Date(first[0]).toISOString()), to: fmtDate(new Date(last[0]).toISOString()) })];
  });
  if (trends.length) paragraphs.push(trends.slice(0, 3).join(' '));
  const average = knownAdherenceAverage(records);
  paragraphs.push(average === null ? t('report.story_unknown_doses') : t('report.story_adherence', { value: average }));
  const wellbeing = (['energy', 'mood', 'sleep', 'focus'] as const).flatMap(key => {
    const value = latest.wellbeing?.[key];
    return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 10 ? [`${t('wellbeing.' + key).replace(/\s*\([^)]*\)\s*$/, '')}: ${value}/10`] : [];
  });
  if (wellbeing.length) paragraphs.push(t('report.story_wellbeing', { date: fmtDate(latest.dateISO), ratings: wellbeing.join(', ') }));
  return paragraphs.join('\n\n');
}

/** Highlights come from recorded answers, with dates; no calculated health or success score. */
export function reviewHighlights(state: WizardState, t: TranslateFn, catalog: MedEntry[]) {
  const records = checkinsInRange(state.checkins, 'all');
  const latest = records.at(-1);
  const medications = state.meds.map(med => {
    const answers = records.flatMap(c => (c.medicationDoses || []).filter(d => d.medId === med.medId));
    const current = latest?.medicationDoses?.find(d => d.medId === med.medId);
    return { id: med.medId, name: catalog.find(m => m.id === med.medId)?.name || med.medId.replace(/^custom[:_]/, '').replace(/[-_]/g, ' '), details: medicationDetail(med),
      status: current ? t('tracking.dose.' + current.status) : t('checkin.not_answered'),
      counts: answers.length ? t('review.medication_counts', { all: answers.filter(a => a.status === 'all').length, some: answers.filter(a => a.status === 'some').length, unsure: answers.filter(a => a.status === 'unsure').length }) : '' };
  });
  const names = [...new Set([...state.symptoms.selected, ...records.flatMap(c => (c.symptoms?.items || []).map(i => i.symptom))])];
  const symptoms = names.map(name => {
    const entries = records.flatMap(c => (c.symptoms?.items || []).filter(i => i.symptom === name).map(item => ({ ...item, date: c.dateISO })));
    const last = entries.at(-1);
    const rated = entries.filter(i => typeof i.severityNow === 'number' && Number.isFinite(i.severityNow) && i.severityNow >= 0 && i.severityNow <= 10);
    const first = rated[0]; const end = rated.at(-1);
    const latestRated = !!last && typeof last.severityNow === 'number' && Number.isFinite(last.severityNow) && last.severityNow >= 0 && last.severityNow <= 10;
    return { name, date: last?.date, status: last ? impactLabel(last.change, t) : t('checkin.not_answered'),
      rating: !latestRated ? '' : rated.length > 1 ? `${first.severityNow} → ${end!.severityNow}/10` : `${last!.severityNow}/10`,
      comparison: latestRated && rated.length > 1 ? `${fmtDate(first.date)} – ${fmtDate(end!.date)}` : '' };
  });
  const notes = [...records].reverse().flatMap(c => {
    const text = [sideEffectList(c.sideEffects).join(', '), c.notes?.trim()].filter(Boolean).join('\n');
    return text ? [{ date: c.dateISO, text }] : [];
  });
  return { latest, medications, symptoms, notes };
}
/** Unknown wellbeing is omitted from charts instead of becoming a zero. */
export function wellbeingRatingSeries(checkins: WizardCheckin[], key: 'energy' | 'mood' | 'sleep' | 'focus'): Array<[number, number]> {
  return checkins.flatMap(c => typeof c.wellbeing?.[key] === 'number' && Number.isFinite(c.wellbeing[key]) ? [[new Date(c.dateISO).getTime(), c.wellbeing[key]] as [number, number]] : []);
}
