/**
 * Trend-series builder for the 6-week Progress charts.
 *
 * Pure, deterministic, and shared in spirit with the web portal's
 * buildTrendSeries() in resources/views/include/script.blade.php — keep the two
 * in sync (a test asserts the mobile side against fixed fixtures).
 *
 * Design notes:
 *  - The window is anchored to the MOST RECENT check-in, not "now", so the
 *    chart is never empty just because the user has not checked in this week,
 *    and so the output is deterministic for a given input (testable).
 *  - Symptom series are SPARSE: `symptoms.items` reflects the symptom set the
 *    user had selected at each check-in, so a symptom can appear and disappear
 *    between check-ins. Never assume every check-in carries every symptom.
 */

import type { WizardCheckin } from '@/wizard/types';

export interface TrendPoint {
  /** Local calendar day, YYYY-MM-DD. */
  date: string;
  /** ms since epoch for the day, for x-axis positioning. */
  t: number;
  adherence: number;
  energy: number;
  mood: number;
  sleep: number;
  focus: number;
}

export interface SymptomSeriesPoint {
  date: string;
  t: number;
  severity: number;
}

export interface TrendSeries {
  /** Chronological wellbeing + adherence points within the window. */
  points: TrendPoint[];
  /** Per-symptom sparse severity series, keyed by symptom name. */
  symptoms: Record<string, SymptomSeriesPoint[]>;
  /** Inclusive window bounds (ms), or null when there is no data. */
  window: { fromT: number; toT: number } | null;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** Parse a check-in's dateISO to a day-anchored timestamp, or null if unusable. */
function dayTimestamp(dateISO: string | undefined): number | null {
  if (!dateISO) return null;
  const d = new Date(dateISO);
  if (Number.isNaN(d.getTime())) return null;
  // Anchor to the local calendar day so same-day check-ins collapse together.
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

function dayString(t: number): string {
  const d = new Date(t);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function clampScore(n: unknown, max: number): number {
  const v = typeof n === 'number' && Number.isFinite(n) ? n : 0;
  return Math.max(0, Math.min(max, v));
}

/**
 * Build trend series over the trailing `days` window (default 42 = 6 weeks),
 * anchored to the most recent check-in.
 */
export function buildTrendSeries(checkins: WizardCheckin[], days = 42): TrendSeries {
  const dated = (checkins ?? [])
    .map((c) => ({ c, t: dayTimestamp(c?.dateISO) }))
    .filter((x): x is { c: WizardCheckin; t: number } => x.t !== null)
    .sort((a, b) => a.t - b.t);

  if (dated.length === 0) {
    return { points: [], symptoms: {}, window: null };
  }

  const toT = dated[dated.length - 1].t;
  const fromT = toT - (days - 1) * DAY_MS;
  const inWindow = dated.filter((x) => x.t >= fromT);

  // Collapse multiple check-ins on the same day to the latest one, so each day
  // is a single point on the line.
  const byDay = new Map<number, WizardCheckin>();
  for (const { c, t } of inWindow) byDay.set(t, c);

  const points: TrendPoint[] = [...byDay.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([t, c]) => ({
      date: dayString(t),
      t,
      adherence: clampScore(c.adherencePct, 100),
      energy: clampScore(c.wellbeing?.energy, 10),
      mood: clampScore(c.wellbeing?.mood, 10),
      sleep: clampScore(c.wellbeing?.sleep, 10),
      focus: clampScore(c.wellbeing?.focus, 10),
    }));

  const symptoms: Record<string, SymptomSeriesPoint[]> = {};
  for (const [t, c] of byDay) {
    for (const item of c.symptoms?.items ?? []) {
      if (typeof item?.severityNow !== 'number') continue;
      const name = item.symptom;
      (symptoms[name] ??= []).push({ date: dayString(t), t, severity: clampScore(item.severityNow, 10) });
    }
  }
  for (const name of Object.keys(symptoms)) {
    symptoms[name].sort((a, b) => a.t - b.t);
  }

  return { points, symptoms, window: { fromT, toT } };
}
