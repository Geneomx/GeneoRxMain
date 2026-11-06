import { useSetup } from '@/store/SetupContext';
import type { SetupStep } from '@/wizard/setupFlow';
import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText as Text } from '@/components/AppText';
import { AppIcon } from '@/components/AppIcon';
import { Button } from '@/components/Button';
import { EditorSheet, ListRow, SectionHeading, refined } from '@/components/RefinedUI';
import { TrackingExplanation } from '@/components/TrackingExplanation';
import { checkinsInRange, reviewHighlights, weeklyCoach } from '@/wizard/reviewData';
import { useWizard } from '@/store/WizardContext';
import { useMedCatalog } from '@/store/MedCatalogContext';
import { aggregateEvidenceByNutrient, claimsForSelectedMeds, computeContraindications, computeDrugInteractions, computeNutrientScores, detectHealthPatterns, evidenceCoverage, evidencePanel, fmtDate, safetyFlags, uniq } from '@/wizard/engine';
import { useTranslation } from '@/hooks/useTranslation';
import { AlertBox, CiteChip, FinePrint, Section } from '@/screens/wizard/ui';
import { LatestUpdateCard } from '@/components/LatestUpdateCard';
import { latestUpdate } from '@/wizard/latestUpdate';
import { colors } from '@/theme';

export const ResultsStep: React.FC = () => {
  const setup = useSetup();
  const { state, focusTarget, setFocusTarget, setStep } = useWizard();
  const go = (step: SetupStep) => { if (setup.active) void setup.begin(step); else setStep(step); };
  const { catalog } = useMedCatalog();
  const { t } = useTranslation();
  const [sheet, setSheet] = useState<'ai' | 'notes' | 'sources' | 'safety' | null>(null);
  const records = checkinsInRange(state.checkins, 'all');
  const highlights = reviewHighlights({ ...state, checkins: records }, t, catalog);
  const evidence = useMemo(() => aggregateEvidenceByNutrient(claimsForSelectedMeds(state, catalog)), [state.meds, catalog]);
  const interactions = computeDrugInteractions(state, t);
  const cautions = computeContraindications(state, t);
  const coverage = evidenceCoverage(state, catalog);
  const update = latestUpdate(records, t);
  const coach = weeklyCoach(state, t, catalog);
  const flags = safetyFlags(state, t);
  const patterns = detectHealthPatterns(state, t);
  // Only the signal's name is shown, never a score.
  const topSignal = computeNutrientScores(state, catalog)[0]?.[0] ?? null;
  const symptomText = state.symptoms.selected.length ? state.symptoms.selected.slice(0, 6).join(', ') : t('results.no_symptoms_yet');
  const whyReason = topSignal ? t('results.why_reason_signal', { nutrient: topSignal, symptoms: symptomText })
    : state.symptomOnlyMode ? t('results.why_reason_symptom_only', { symptoms: symptomText }) : t('results.why_reason_need_more');
  const doctorTopics = uniq([
    ...(topSignal ? [t('results.doctor_topic_testing', { nutrient: topSignal })] : []),
    ...interactions.map(item => `${item.title}: ${item.action}`),
    ...cautions.map(item => `${item.title}: ${item.action}`),
  ]).slice(0, 4);
  useEffect(() => {
    if (!focusTarget) return;
    setSheet(focusTarget.kind === 'nutrient' ? 'sources' : 'safety');
    setFocusTarget(null);
  }, [focusTarget, setFocusTarget]);
  return <View style={{ gap: 16 }}>
    {update.checkin ? <LatestUpdateCard update={update} loading={false} onCheckin={() => go(5)} /> : <Section><Text style={refined.body}>{t('review.no_symptom_records')}</Text><Button title={t('simple.check_in')} onPress={() => go(5)} /></Section>}
    <View style={[styles.card, styles.coach]}>
      <View style={styles.coachHead}><AppIcon name="spark" size={20} color={colors.primary} /><View style={{ flex: 1 }}><Text accessibilityRole="header" style={styles.title}>{t('results.coach_title')}</Text><FinePrint>{t('results.coach_sub')}</FinePrint></View></View>
      <Text style={styles.strong}>{coach.headline}</Text>
      {coach.bullets.map(bullet => <Text key={bullet} style={refined.meta}>• {bullet}</Text>)}
      <Text style={refined.body}><Text style={styles.strong}>{t('results.next_best_action')}</Text> {coach.nextBestAction}</Text>
    </View>
    {flags.length ? <View style={styles.banner} accessibilityRole="alert"><Text style={refined.body}><Text style={styles.strong}>{t('results.banner_title')}</Text> {t('results.banner_body', { flags: flags.join(', ') })}</Text></View> : null}
    <View style={styles.card}>
      <Text accessibilityRole="header" style={styles.title}>{t('results.why_title')}</Text>
      <FinePrint>{t('results.why_sub')}</FinePrint>
      <Text style={styles.label}>{t('results.likely_explanation')}</Text>
      <Text style={refined.body}>{whyReason}</Text>
      <Text style={styles.label}>{t('results.current_inputs')}</Text>
      <Text style={refined.body}>{t('results.symptoms_label')} <Text style={styles.strong}>{symptomText}</Text></Text>
      {topSignal ? <Text style={refined.body}>{t('results.top_signal')} <Text style={styles.strong}>{topSignal}</Text></Text> : null}
    </View>
    <View style={styles.card}>
      <Text accessibilityRole="header" style={styles.title}>{t('results.doctor_title')}</Text>
      <FinePrint>{t('results.doctor_sub')}</FinePrint>
      {doctorTopics.length ? doctorTopics.map((topic, index) => <View key={topic} style={styles.topic}><Text style={styles.label}>{t('results.topic')} {index + 1}</Text><Text style={refined.body}>{topic}</Text></View>) : <FinePrint>{t('results.doctor_empty')}</FinePrint>}
    </View>
    <View style={styles.card}>
      <Text accessibilityRole="header" style={styles.title}>{t('results.patterns_title')}</Text>
      <FinePrint>{t('results.patterns_sub')}</FinePrint>
      <Text style={styles.label}>{t('results.patterns_detected')}</Text>
      {patterns.length ? patterns.map(pattern => <View key={pattern.title} style={{ gap: 2 }}><Text style={styles.strong}>{pattern.title}</Text><Text style={refined.body}>{pattern.note}</Text></View>) : <Text style={refined.body}>{t('results.patterns_none')}</Text>}
    </View>
    <View style={styles.card}>
      <Text accessibilityRole="header" style={styles.title}>{t('results.interactions_title')}</Text>
      <FinePrint>{t('results.interactions_sub')}</FinePrint>
      {interactions.length ? interactions.map(alert => <AlertBox key={alert.title} {...alert} />) : <FinePrint>{t('results.interactions_none')}</FinePrint>}
    </View>
    <View style={styles.card}>
      <Text accessibilityRole="header" style={styles.title}>{t('results.contraindications_title')}</Text>
      <FinePrint>{t('results.contraindications_sub')}</FinePrint>
      {cautions.length ? cautions.map(alert => <AlertBox key={alert.title} {...alert} />) : <FinePrint>{t('results.contraindications_none')}</FinePrint>}
    </View>
    <View style={refined.listGroup}>
      <ListRow icon="chart" title={t('parity.patterns_review')} onPress={() => go(6)} />
      <ListRow icon="plan" title={t('review.safety_title')} onPress={() => setSheet('safety')} />
      <ListRow icon="file" title={t('review.evidence_title')} onPress={() => setSheet('sources')} />
      <ListRow icon="heart" title={t('parity.side_notes')} onPress={() => setSheet('notes')} last />
    </View>
    {!setup.active ? <Button title={t('parity.preview_summary')} onPress={() => go(8)} /> : null}
    <Button title={t('review.ai_explanation')} variant="ghost" onPress={() => setSheet('ai')} />
    <FinePrint>{t('review.no_cause')}</FinePrint>
    <EditorSheet visible={sheet === 'ai'} title={t('review.ai_explanation')} onClose={() => setSheet(null)}><TrackingExplanation range="30" /></EditorSheet>
    <EditorSheet visible={sheet === 'notes'} title={t('parity.side_notes')} onClose={() => setSheet(null)}>
      {highlights.notes.length ? highlights.notes.map((note, index) => <View key={`${note.date}-${index}`} style={{ gap: 6 }}><Text style={refined.rowTitle}>{fmtDate(note.date)}</Text><Text style={refined.body}>{note.text}</Text></View>) : <Text style={refined.body}>{t('parity.notes_empty')}</Text>}
      <Button title={t('simple.check_in')} onPress={() => { setSheet(null); go(5); }} />
    </EditorSheet>
    <EditorSheet visible={sheet === 'sources'} title={t('review.evidence_title')} onClose={() => setSheet(null)}>
      <Text style={refined.body}>{t('review.evidence_general')}</Text>
      {Object.entries(evidence).map(([nutrient, claims]) => {
        const details = evidencePanel(nutrient, claims);
        return <Section key={nutrient}><Text style={refined.rowTitle}>{nutrient}</Text>
          <FinePrint>{[...new Set(claims.map(c => c.medName))].join(', ')}</FinePrint>
          <Text style={refined.body}>{details.noteText}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{details.citations.map(c => <CiteChip key={c} token={c} />)}</View>
        </Section>;
      })}
      {!Object.keys(evidence).length ? <FinePrint>{t('review.no_evidence')}</FinePrint> : null}
      <FinePrint>{t('review.no_cause')}</FinePrint>
    </EditorSheet>
    <EditorSheet visible={sheet === 'safety'} title={t('review.safety_title')} onClose={() => setSheet(null)}>
      <Text style={refined.body}>{t('review.limited_checks')}</Text>
      {interactions.map(alert => <AlertBox key={alert.title} {...alert} />)}
      {cautions.map(alert => <AlertBox key={alert.title} {...alert} />)}
      {!interactions.length && !cautions.length ? <FinePrint>{t('review.no_rule_alerts')}</FinePrint> : null}
      <FinePrint>{t('results.evidence_coverage')} {coverage.evidenceCount}/{coverage.selectedCount}</FinePrint>
      <FinePrint>{t('review.coverage_note')}</FinePrint>
      <Button title={t('parity.medication_list')} variant="secondary" onPress={() => { setSheet(null); setStep(1); }} />
    </EditorSheet>
  </View>;
};

// Flat soft cards: grey for information, blue for the coach, no outlines.
const styles = StyleSheet.create({
  card: { backgroundColor: colors.inputBg, borderRadius: 22, padding: 18, gap: 10 },
  coach: { backgroundColor: colors.primary50 },
  coachHead: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  banner: { backgroundColor: colors.warningBg, borderRadius: 18, padding: 16 },
  title: { color: colors.text, fontSize: 18, lineHeight: 25, fontWeight: '600', letterSpacing: -0.2 },
  strong: { color: colors.text, fontSize: 17, lineHeight: 25, fontWeight: '600' },
  label: { color: colors.textMuted, fontSize: 14, lineHeight: 20, fontWeight: '600', marginTop: 4 },
  topic: { gap: 2 },
});
