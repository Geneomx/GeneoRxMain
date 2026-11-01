import type { MedicationDoseEntry, WizardCheckin, WizardMed } from './types';
import { adherenceFromDoses } from './checkinEntry';

export function medicationDetail(med: WizardMed): string {
  return [med.strength, med.frequency, med.startDate].filter(Boolean).join(' · ');
}

export function doseEntryValid(entry: MedicationDoseEntry): boolean {
  return entry.status !== 'some' || adherenceFromDoses(String(entry.scheduled ?? ''), String(entry.missed ?? '')) !== null;
}

/**
 * Apply a form patch to a medication's dose answer. Scheduled/missed counts
 * only mean something for "Missed some"; any other answer drops them so a
 * stale "(5/7)" never follows "Not sure" or "All taken" into the snapshot.
 */
export function mergeDoseEntry(previous: MedicationDoseEntry | undefined, defaults: MedicationDoseEntry, patch: Partial<MedicationDoseEntry>): MedicationDoseEntry {
  const merged: MedicationDoseEntry = { ...defaults, ...previous, ...patch };
  if (merged.status === 'some') return merged;
  const { scheduled: _scheduled, missed: _missed, ...rest } = merged;
  return rest;
}

/** "(taken/scheduled)" for a "Missed some" answer with real counts; empty otherwise. Mirrors the clinician snapshot. */
export function doseCountsLabel(entry: Pick<MedicationDoseEntry, 'status' | 'scheduled' | 'missed'>): string {
  if (entry.status !== 'some' || !Number.isSafeInteger(entry.scheduled) || !Number.isSafeInteger(entry.missed)) return '';
  return `(${entry.scheduled! - entry.missed!}/${entry.scheduled})`;
}

/** A combined percentage needs known denominators; unknown is never zero. */
export function combinedAdherence(entries: MedicationDoseEntry[]): number | null {
  const scheduled = entries.filter(entry => entry.status !== 'not-scheduled');
  if (!scheduled.length || scheduled.some(entry => entry.status === 'unsure' || !doseEntryValid(entry))) return null;
  if (scheduled.every(entry => entry.status === 'all')) return 100;
  if (scheduled.some(entry => !Number.isSafeInteger(entry.scheduled) || entry.scheduled! < 1)) return null;
  const total = scheduled.reduce((sum, entry) => sum + entry.scheduled!, 0);
  const missed = scheduled.reduce((sum, entry) => sum + (entry.status === 'all' ? 0 : entry.missed!), 0);
  return adherenceFromDoses(String(total), String(missed));
}

export function adherenceLabel(value: number | null | undefined, unknown = 'Not sure'): string {
  return typeof value === 'number' && Number.isFinite(value) ? `${value}%` : unknown;
}

/** Older percentages may describe supplements. Only dose answers establish medication adherence. */
export function medicationAdherence(checkin: WizardCheckin): number | null {
  return checkin.medicationDoses?.length ? combinedAdherence(checkin.medicationDoses) : null;
}

/** Plain reported status for the dashboard; legacy percentages cannot supply it. */
export function reportedDoseStatus(checkin?: WizardCheckin): 'all' | 'some' | 'unsure' | 'not-scheduled' | 'not-recorded' {
  const entries = checkin?.medicationDoses || [];
  if (!entries.length) return 'not-recorded';
  const scheduled = entries.filter(entry => entry.status !== 'not-scheduled');
  if (!scheduled.length) return 'not-scheduled';
  if (scheduled.some(entry => !['all', 'some'].includes(entry.status) || !doseEntryValid(entry))) return 'unsure';
  return scheduled.some(entry => entry.status === 'some' && entry.missed! > 0) ? 'some' : 'all';
}

/** Calendar months, recalculated from the actual start date; unknown is distinct from zero. */
export function medicationDurationMonths(med: Pick<WizardMed, 'startDate' | 'durationMonths'>, now = new Date()): number | null {
  if (med.startDate) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(med.startDate);
    if (!match) return null;
    const [, year, month, day] = match.map(Number);
    const start = new Date(year, month - 1, day);
    if (start.getFullYear() !== year || start.getMonth() !== month - 1 || start.getDate() !== day || start > now) return null;
    return Math.max(0, (now.getFullYear() - year) * 12 + now.getMonth() - month + 1 - (now.getDate() < day ? 1 : 0));
  }
  return Number.isFinite(med.durationMonths) && med.durationMonths >= 0 ? med.durationMonths : null;
}
