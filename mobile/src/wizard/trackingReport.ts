import { MED_DB, type MedEntry } from '@/content/wizardData';
import { aggregateEvidenceByNutrient, claimsForSelectedMeds, computeContraindications, computeDrugInteractions, detectHealthPatterns, evidencePanel, safetyFlags, type TranslateFn } from './engine';
import { checkinsInRange, trackingHealthStory, trackingOverview, reviewPeriod, summaryBasis, type ReviewRange } from './reviewData';
import { fmtDate, impactLabel, sideEffectList } from './recordFormatting';
import { adherenceLabel, doseCountsLabel, medicationAdherence, medicationDetail } from './medicationTracking';
import { LIFESTYLE_KEYS, type TriState, type WizardCheckin, type WizardState } from './types';
import { isoFromCalendarDate } from './calendarDate';

/** Shared by Summary and the assistant; this never calls a cloud provider. */
export function trackingSummaryForRange(state: WizardState, range: ReviewRange, t: TranslateFn, catalog: MedEntry[], now = new Date()) {
  const filtered = { ...state, checkins: checkinsInRange(state.checkins, range, now) };
  const generated = trackingHealthStory(filtered, t, catalog);
  const edited = state.summaryOverview?.[range];
  const stale = !!edited && state.summaryOverviewBasis?.[range] !== summaryBasis(state, range, now);
  const overview = edited && !stale ? edited : generated;
  const period = reviewPeriod(range, filtered.checkins, now);
  return { filtered, generated, overview, edited, stale, period, text: trackingRecordText(filtered, overview, period.label, t, catalog) };
}

/** A tracking record contains the selected entries, without inferred diagnoses or probabilities. */
export function trackingRecordText(state: WizardState, overview: string, rangeLabel: string, t: TranslateFn, catalog: MedEntry[]) {
  const lines = [t('parity.record_title'), rangeLabel, '', t('report.health_story_title'), overview, '', t('report.summary_heading'), '', t('review.current_medications')];
  for (const med of state.meds) lines.push([catalog.find(m => m.id === med.medId)?.name || med.medId, medicationDetail({ ...med, startDate: med.startDate ? fmtDate(isoFromCalendarDate(med.startDate) || med.startDate) : '' })].filter(Boolean).join(' · '));
  if (!state.meds.length) lines.push(t('meds.none_yet'));
  const flags = safetyFlags(state, t);
  lines.push('', t('summary.safety_flags_line'), flags.length ? flags.join(', ') : t('report.no_flags_reported'));
  lines.push('', t('review.current_symptoms'));
  for (const name of state.symptoms.selected) { const detail = state.symptoms.details?.[name]; lines.push([name, detail?.onsetDate, detail?.severity ? t('symptoms.severity.' + detail.severity) : '', detail?.notes].filter(Boolean).join(' · ')); }
  const patterns = detectHealthPatterns(state, t);
  lines.push('', t('summary.detected_pattern'), t('report.pattern_context'));
  if (patterns.length) for (const pattern of patterns) lines.push(`${pattern.title}\n${pattern.note}`);
  else lines.push(t('report.no_pattern_match'));
  const nutrientEvidence = Object.entries(aggregateEvidenceByNutrient(claimsForSelectedMeds(state, catalog)));
  lines.push('', t('report.nutrient_information'), t('review.evidence_general'));
  for (const [nutrient, claims] of nutrientEvidence) {
    const evidence = evidencePanel(nutrient, claims);
    lines.push([nutrient, [...new Set(claims.map(claim => claim.medName))].join(', '), evidence.noteText].filter(Boolean).join(' · '));
    if (evidence.citations.length) lines.push(evidence.citations.join(' · '));
  }
  if (!nutrientEvidence.length) lines.push(t('review.no_evidence'));
  const interactions = computeDrugInteractions(state, t), cautions = computeContraindications(state, t);
  lines.push('', t('summary.drug_interactions'), t('review.limited_checks'));
  lines.push(...(interactions.length ? interactions.map(item => [item.title, item.note, item.action].filter(Boolean).join(' ')) : [t('report.no_internal_alerts')]));
  lines.push('', t('summary.contraindications'));
  lines.push(...(cautions.length ? cautions.map(item => [item.title, item.note, item.action].filter(Boolean).join(' ')) : [t('report.no_internal_alerts')]));
  lines.push('', t('report.recorded_protocol'), state.plan.started && state.plan.recommendedSupplements.length ? state.plan.recommendedSupplements.join(', ') : t('report.no_recorded_protocol'));
  const labTopics = [...new Set(nutrientEvidence.flatMap(([nutrient, claims]) => evidencePanel(nutrient, claims).labs))];
  lines.push('', t('report.lab_topics'), t('report.lab_topics_context'), labTopics.length ? labTopics.join('\n') : t('report.no_lab_topics'));
  lines.push('', t('summary.insight_summary'), trackingOverview(state, t));
  lines.push('', t('parity.recent_checkins'));
  // The same yes/no/unsure labels the monthly check showed the user.
  const triLabel = (value: TriState) => value === 'unsure' ? t('checkin.unsure') : t('common.' + value);
  for (const c of state.checkins) {
    lines.push(fmtDate(c.dateISO), `${t('parity.medication_taken')}: ${adherenceLabel(medicationAdherence(c), t('checkin.not_answered'))}`);
    if (!c.medicationDoses?.length && typeof c.adherencePct === 'number') lines.push(`${t('review.legacy_adherence')}: ${c.adherencePct}%`);
    for (const med of c.medicationDoses || []) lines.push([`• ${med.medicationName}: ${t('tracking.dose.' + med.status)}`, doseCountsLabel(med)].filter(Boolean).join(' '));
    const supplements = c.supplementsTaken || [];
    if (supplements.length) lines.push(`${t('checkin.detail.supplements_taken')}: ${supplements.join(', ')}`);
    for (const item of c.symptoms?.items || []) lines.push(`• ${item.symptom}: ${impactLabel(item.change, t)}${typeof item.severityNow === 'number' ? ` · ${item.severityNow}/10` : ''}`);
    const wellbeing = c.wellbeing || {};
    lines.push(...(['energy', 'mood', 'sleep', 'focus'] as const).map(key => `${t('wellbeing.' + key)}: ${typeof wellbeing[key] === 'number' ? `${wellbeing[key]}/10` : t('checkin.not_answered')}`));
    // The three body systems were only asked from v3 on; a skipped one stays
    // out of the record rather than reading as "Not answered" on older weeks.
    for (const key of ['digestive', 'circulation', 'immunity'] as const) if (typeof wellbeing[key] === 'number') lines.push(`${t('wellbeing.' + key)}: ${wellbeing[key]}/10`);
    const completion = c.completion;
    if (completion) {
      const answers: string[] = [];
      if (completion.labs) answers.push(`${t('checkin.labs_q')} ${triLabel(completion.labs)}`);
      if (completion.prescriber) answers.push(`${t('checkin.prescriber_q')} ${triLabel(completion.prescriber)}`);
      for (const key of LIFESTYLE_KEYS) { const value = completion.lifestyle?.[key]; if (value) answers.push(`${t('checkin.lifestyle.' + key)} ${triLabel(value)}`); }
      if (answers.length) lines.push(t('checkin.monthly_title'), ...answers);
    }
    const sideEffects = sideEffectList(c.sideEffects);
    if (sideEffects.length) lines.push(`${t('checkin.detail.side_effects')}: ${sideEffects.join(', ')}`);
    if (c.notes) lines.push(`${t('checkin.notes')}: ${c.notes}`);
    lines.push('');
  }
  lines.push(t('parity.record_note'));
  return lines.join('\n');
}

/**
 * A readable narrative of reported medications, symptoms, and dated answers.
 */
export function generateDynamicHealthStory(
  s: WizardState,
  t: TranslateFn,
  catalog?: MedEntry[],
  checkinOverride?: WizardCheckin | null,
): string {
  const records = checkinOverride !== undefined ? checkinOverride ? [checkinOverride] : [] : s.checkins;
  return trackingHealthStory({ ...s, checkins: checkinsInRange(records, 'all') }, t, catalog || MED_DB);
}

/* ---------- clinician snapshot ---------- */
/** All exports use the factual record; heuristic scores never enter a patient report. */
export function buildClinicianSnapshotText(
  s: WizardState, t: TranslateFn, checkinIndex?: number, catalog?: MedEntry[],
): string {
  const selected = typeof checkinIndex === 'number' && s.checkins[checkinIndex]
    ? [s.checkins[checkinIndex]] : s.checkins;
  const record = { ...s, checkins: checkinsInRange(selected, 'all') };
  return trackingRecordText(record, trackingHealthStory(record, t, catalog || MED_DB), t('parity.range.all'), t, catalog || MED_DB);
}
