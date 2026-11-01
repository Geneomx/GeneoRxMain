import type { MedEntry } from '@/content/wizardData';
import type { TranslateFn } from './engine';
import type { WizardState } from './types';
import { reviewHighlights } from './reviewData';
import { fmtDate } from './recordFormatting';

/** Input is already filtered to the selected period. Missing values stay unknown. */
export function summaryRows(state: WizardState, t: TranslateFn, catalog: MedEntry[]) {
  const highlights = reviewHighlights(state, t, catalog);
  const reported = highlights.symptoms.filter(symptom => symptom.date).sort((a, b) => new Date(b.date!).getTime() - new Date(a.date!).getTime());
  const wellbeing = (['energy', 'mood', 'sleep', 'focus'] as const).flatMap(key => {
    const value = highlights.latest?.wellbeing?.[key];
    return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 10
      ? [`${t('wellbeing.' + key).replace(/\s*\([^)]*\)\s*$/, '')}: ${value}/10`] : [];
  });
  const more = (count: number) => count > 2 ? t('polish.more_preview', { count: count - 2 }) : undefined;
  return [
    { key: 'medications' as const, label: t('step.1'), count: highlights.medications.length, recorded: highlights.medications.length > 0, value: highlights.medications.length ? highlights.medications.slice(0, 2).map(med => `${med.name} — ${med.status}`).join('\n') : t('meds.none_yet'), detail: more(highlights.medications.length) },
    { key: 'symptoms' as const, label: t('step.2'), count: reported.length, recorded: reported.length > 0, value: reported.length ? reported.slice(0, 2).map(symptom => `${symptom.name} — ${symptom.status}`).join('\n') : t('polish.not_recorded_period'), detail: more(reported.length) },
    { key: 'wellbeing' as const, label: t('step.3'), count: wellbeing.length, recorded: wellbeing.length > 0, value: wellbeing.length ? wellbeing.slice(0, 2).join('\n') : t('polish.not_recorded_period'), detail: more(wellbeing.length) },
    { key: 'notes' as const, label: t('polish.notes'), count: highlights.notes.length, recorded: highlights.notes.length > 0, value: highlights.notes[0]?.text || t('polish.no_notes'), detail: highlights.notes[0] ? fmtDate(highlights.notes[0].date) : undefined },
  ];
}
