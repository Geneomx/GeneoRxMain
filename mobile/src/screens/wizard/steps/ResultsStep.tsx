import React, { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/Button';
import { useToast } from '@/components/Toast';
import { useWizard } from '@/store/WizardContext';
import {
  aggregateEvidenceByNutrient,
  buildRoutineFromSupplements,
  citationToLink,
  claimsForSelectedMeds,
  computeContraindications,
  computeDrugInteractions,
  computeInsightEngine,
  computeMedicationSuccessPrediction,
  computeNutrientScores,
  computePopulationInsights,
  computeWeeklyCoachMessage,
  detectHealthPatterns,
  evidenceCoverage,
  evidencePanel,
  recommendSupplements,
  safetyFlags,
  successLabel,
  summarizeSourceQuality,
  tierFromScore,
  uniq,
  type Tier,
} from '@/wizard/engine';
import type { SourceQuality } from '@/content/wizardData';
import { useTranslation } from '@/hooks/useTranslation';
import {
  AlertBox,
  CiteChip,
  Divider,
  FinePrint,
  KVItem,
  NoteBox,
  Section,
  Tagline,
  TierPill,
} from '@/screens/wizard/ui';
import { colors, radius, spacing } from '@/theme';

function tierLabel(tier: Tier | SourceQuality, t: (key: string) => string): string {
  const key = `tier.${String(tier).toLowerCase()}`;
  const out = t(key);
  return out !== key ? out : String(tier);
}

function topInlineCites(
  nutrient: string,
  claims: ReturnType<typeof aggregateEvidenceByNutrient>[string] | undefined,
  t: (key: string) => string,
) {
  const seen = new Set<string>();
  const cites: string[] = [];
  for (const c of claims || []) {
    for (const id of c.citations || []) {
      const tok = String(id || '').trim();
      if (!tok || seen.has(tok)) continue;
      if (!citationToLink(tok)) continue;
      seen.add(tok);
      cites.push(tok);
    }
  }
  const top = cites.slice(0, 2);
  if (!top.length) {
    return <FinePrint>{t('results.citations_not_loaded')}</FinePrint>;
  }
  return (
    <View style={{ gap: 6 }}>
      <FinePrint>{t('results.citations_label')}</FinePrint>
      <View style={styles.citeRow}>
        {top.map((c) => (
          <CiteChip key={c} token={c} />
        ))}
      </View>
    </View>
  );
}

export const ResultsStep: React.FC = () => {
  const { state, update } = useWizard();
  const { t, language } = useTranslation();
  const toast = useToast();
  const [insightOpen, setInsightOpen] = useState(false);
  const [openEvidence, setOpenEvidence] = useState<Record<string, boolean>>({});

  const scores = useMemo(() => computeNutrientScores(state), [state]);
  const recs = useMemo(() => recommendSupplements(scores), [scores]);
  const claims = useMemo(() => claimsForSelectedMeds(state), [state]);
  const evidenceMap = useMemo(() => aggregateEvidenceByNutrient(claims), [claims]);
  const cov = useMemo(() => evidenceCoverage(state), [state]);
  const flags = useMemo(() => safetyFlags(state, t), [state, language, t]);
  const coach = useMemo(() => computeWeeklyCoachMessage(state, t), [state, language, t]);
  const insight = useMemo(() => computeInsightEngine(state, t), [state, language, t]);
  const success = useMemo(() => computeMedicationSuccessPrediction(state, t), [state, language, t]);
  const patterns = useMemo(() => detectHealthPatterns(state, t), [state, language, t]);
  const population = useMemo(() => computePopulationInsights(state, t), [state, language, t]);
  const interactions = useMemo(() => computeDrugInteractions(state, t), [state, language, t]);
  const contraindications = useMemo(() => computeContraindications(state, t), [state, language, t]);

  const topSignal = scores.length
    ? { nutrient: scores[0][0], score: scores[0][1], tier: tierFromScore(scores[0][1]) }
    : null;
  const recentSymptoms = state.symptoms.selected.length ? state.symptoms.selected.slice(0, 6) : [];
  const symptomText = recentSymptoms.length ? recentSymptoms.join(', ') : t('results.no_symptoms_yet');

  const whyReason = topSignal
    ? t('results.why_reason_signal', { nutrient: topSignal.nutrient, symptoms: symptomText })
    : state.symptomOnlyMode
      ? t('results.why_reason_symptom_only', { symptoms: symptomText })
      : t('results.why_reason_need_more');

  const doctorTopics = useMemo(
    () =>
      uniq([
        ...(topSignal ? [t('results.doctor_topic_testing', { nutrient: topSignal.nutrient })] : []),
        ...interactions.map((x) => `${x.title}: ${x.action}`),
        ...contraindications.map((x) => `${x.title}: ${x.action}`),
      ]).slice(0, 4),
    [topSignal, interactions, contraindications, t],
  );

  const planSupps = state.plan.recommendedSupplements.length
    ? state.plan.recommendedSupplements
    : recs.map((r) => r.supplement);
  const routine = useMemo(() => buildRoutineFromSupplements(planSupps), [planSupps]);

  const improveText =
    success.score >= 75
      ? t('results.improve_high')
      : success.score >= 50
        ? t('results.improve_mid')
        : t('results.improve_low');

  const scoreBadgeStyle =
    success.score >= 75 ? styles.scoreBadgeHigh : success.score >= 50 ? styles.scoreBadgeMid : styles.scoreBadgeLow;
  const scoreBadgeTextStyle =
    success.score >= 75 ? styles.scoreBadgeTextHigh : success.score >= 50 ? styles.scoreBadgeTextMid : styles.scoreBadgeTextLow;

  const customMeds = useMemo(
    () => state.meds.filter((m) => m.medId.startsWith('custom:')),
    [state.meds],
  );

  const startPlan = () => {
    const supps = recs.map((r) => r.supplement);
    update((d) => {
      d.plan.started = true;
      d.plan.startDate = new Date().toISOString();
      d.plan.recommendedSupplements = supps;
      d.plan.routine = buildRoutineFromSupplements(supps);
    });
    toast.show(t('toast.plan_saved'));
  };

  const action1Body = topSignal
    ? t('results.action1_focus', { nutrient: topSignal.nutrient })
    : t('results.action1_log_more');

  return (
    <View style={{ gap: spacing.md }}>
      {/* AI Coach — matches website coachBox */}
      <Section style={styles.coach}>
        <View style={styles.coachTitleRow}>
          <Text style={styles.coachSpark}>✦</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.coachTitle}>{t('results.coach_title')}</Text>
            <Text style={styles.coachSub}>{t('results.coach_sub')}</Text>
          </View>
        </View>
        <Text style={styles.coachHead}>{coach.headline}</Text>
        {coach.bullets.map((b, i) => (
          <Text key={i} style={styles.coachBullet}>• {b}</Text>
        ))}
        <Divider />
        <Text style={styles.coachAction}>
          <Text style={styles.coachActionBold}>{t('results.next_best_action')} </Text>
          {coach.nextBestAction}
        </Text>
      </Section>

      {/* Results header + evidence coverage + safety banner */}
      <Section>
        <Tagline title={t('results.title')} body={t('results.sub')} />
        <FinePrint>
          {t('results.evidence_coverage')} <Text style={styles.strong}>{cov.evidenceCount}/{cov.selectedCount}</Text>
        </FinePrint>
        {flags.length ? (
          <View style={styles.banner}>
            <Text style={styles.bannerText}>
              <Text style={styles.strong}>{t('results.banner_title')} </Text>
              {t('results.banner_body', { flags: flags.join(', ') })}
            </Text>
          </View>
        ) : null}
        {customMeds.length ? (
          <NoteBox>
            {customMeds.length === 1
              ? t('results.custom_med_one')
              : t('results.custom_med_many', { count: customMeds.length })}
          </NoteBox>
        ) : null}
      </Section>

      {/* Why might I feel this way? */}
      <Section>
        <Tagline title={t('results.why_title')} body={t('results.why_sub')} />
        <KVItem k={t('results.likely_explanation')}>{whyReason}</KVItem>
        <KVItem k={t('results.current_inputs')}>
          {t('results.symptoms_label')} {symptomText}
          {topSignal
            ? `\n${t('results.top_signal')} ${topSignal.nutrient} (${topSignal.score}% • ${tierLabel(topSignal.tier, t)})`
            : ''}
        </KVItem>
      </Section>

      {/* Doctor discussion topics */}
      <Section>
        <Tagline title={t('results.doctor_title')} body={t('results.doctor_sub')} />
        {doctorTopics.length ? (
          doctorTopics.map((topic, i) => (
            <KVItem key={i} k={`${t('results.topic')} ${i + 1}`}>
              {topic}
            </KVItem>
          ))
        ) : (
          <FinePrint>{t('results.doctor_empty')}</FinePrint>
        )}
      </Section>

      {/* Daily action plan */}
      <Section>
        <Tagline title={t('results.action_title')} body={t('results.action_sub')} />
        <KVItem k={t('results.action1_title')}>{action1Body}</KVItem>
        <KVItem k={t('results.action2_title')}>{t('results.action2_body')}</KVItem>
        <KVItem k={t('results.action3_title')}>{t('results.action3_body')}</KVItem>
        <KVItem k={t('results.action4_title')}>{t('results.action4_body')}</KVItem>
      </Section>

      {/* GeneoRx Insight popup */}
      <Section>
        <Tagline title={t('results.insight_title')} body={t('results.insight_sub')} />
        <Button title={t('results.insight_btn')} onPress={() => setInsightOpen(true)} />
      </Section>

      {/* Detected patterns */}
      <Section>
        <Tagline title={t('results.patterns_title')} body={t('results.patterns_sub')} />
        <KVItem k={t('results.patterns_detected')}>
          {patterns.length
            ? `${patterns[0].title}\n${patterns[0].note}`
            : t('results.patterns_none')}
        </KVItem>
      </Section>

      {/* Success / population / improve metrics */}
      <Section>
        <View style={styles.metricCard}>
          <Text style={styles.metricKey}>{t('results.success_prob')}</Text>
          <View style={styles.metricRow}>
            <View style={[styles.scoreBadge, scoreBadgeStyle]}>
              <Text style={[styles.scoreBadgeText, scoreBadgeTextStyle]}>{success.score}%</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.metricStrong}>{successLabel(success.level, t)}</Text>
              <FinePrint>{success.reason}</FinePrint>
            </View>
          </View>
        </View>

        <View style={styles.metricCard}>
          <Text style={styles.metricKey}>{t('results.population')}</Text>
          <FinePrint>{population.message}</FinePrint>
          {population.trackedSymptoms.length ? (
            <Text style={styles.metricVal}>
              {t('results.population_tracked')} {population.trackedSymptoms.join(', ')}
            </Text>
          ) : (
            <Text style={styles.metricMuted}>{t('results.population_unlock')}</Text>
          )}
        </View>

        <View style={styles.metricCard}>
          <Text style={styles.metricKey}>{t('results.improve_success')}</Text>
          <FinePrint>{improveText}</FinePrint>
        </View>
      </Section>

      {/* Drug interactions */}
      <Section>
        <Tagline title={t('results.interactions_title')} body={t('results.interactions_sub')} />
        {interactions.length ? (
          interactions.map((a) => <AlertBox key={a.title} {...a} />)
        ) : (
          <FinePrint>{t('results.interactions_none')}</FinePrint>
        )}
      </Section>

      {/* Contraindications */}
      <Section>
        <Tagline title={t('results.contraindications_title')} body={t('results.contraindications_sub')} />
        {contraindications.length ? (
          contraindications.map((a) => <AlertBox key={a.title} {...a} />)
        ) : (
          <FinePrint>{t('results.contraindications_none')}</FinePrint>
        )}
      </Section>

      {/* Daily routine */}
      <Section>
        <Tagline title={t('results.routine_title')} body={t('results.routine_sub')} />
        <KVItem k={t('results.routine.morning')}>
          {routine.morning.length ? routine.morning.map((x) => `• ${x}`).join('\n') : ' '}
        </KVItem>
        <KVItem k={t('results.routine.midday')}>
          {routine.midday.length ? routine.midday.map((x) => `• ${x}`).join('\n') : ' '}
        </KVItem>
        <KVItem k={t('results.routine.night')}>
          {routine.night.length ? routine.night.map((x) => `• ${x}`).join('\n') : ' '}
        </KVItem>
        <KVItem k={t('results.routine.notes')}>
          {routine.notes.length ? routine.notes.map((x) => `• ${x}`).join('\n') : ' '}
        </KVItem>
      </Section>

      {/* Nutrient signals */}
      <Section>
        <Tagline title={t('results.nutrient_title')} body={t('results.nutrient_sub')} />
        {!scores.length ? (
          <FinePrint>{t('results.nutrient_none')}</FinePrint>
        ) : (
          scores.slice(0, 10).map(([nut, sc], idx) => {
            const label = tierFromScore(sc);
            const claimsForNut = evidenceMap[nut] || [];
            const q = claimsForNut.length ? summarizeSourceQuality(claimsForNut) : ('Pending' as SourceQuality);
            const ev = evidencePanel(nut, claimsForNut);
            const open = !!openEvidence[nut];
            return (
              <View key={nut} style={styles.nutItem}>
                <KVItem k={nut}>
                  <Text style={styles.metricStrong}>
                    {tierLabel(label, t)} {t('results.signal')} ({sc}%)
                  </Text>
                </KVItem>
                <View style={[styles.sourceBadge, q === 'Pending' && styles.sourceBadgePending]}>
                  <Text style={styles.sourceBadgeText}>
                    {t('results.source_quality')} {tierLabel(q, t)}
                  </Text>
                </View>
                {topInlineCites(nut, claimsForNut, t)}
                <View style={styles.evRow}>
                  <FinePrint>{t('results.transparent_evidence')}</FinePrint>
                  <Pressable onPress={() => setOpenEvidence((p) => ({ ...p, [nut]: !p[nut] }))}>
                    <Text style={styles.evToggle}>{open ? t('results.evidence_hide') : t('results.evidence_toggle')}</Text>
                  </Pressable>
                </View>
                {open ? (
                  <View style={{ gap: 8 }}>
                    {ev.citations.length ? (
                      <View style={styles.citeRow}>
                        {ev.citations.map((c) => (
                          <CiteChip key={c} token={c} />
                        ))}
                      </View>
                    ) : (
                      <FinePrint>{t('results.no_citations')}</FinePrint>
                    )}
                    {ev.noteText ? <Text style={styles.evNote}>{ev.noteText}</Text> : null}
                    {ev.labs.length ? <FinePrint>{t('results.labs_label')} {ev.labs.join(', ')}</FinePrint> : null}
                  </View>
                ) : null}
                {idx < Math.min(scores.length, 10) - 1 ? <Divider /> : null}
              </View>
            );
          })
        )}
      </Section>

      {/* Supplements + start plan */}
      <Section>
        <Tagline title={t('results.supplements_title')} body={t('results.supplements_sub')} />
        {!recs.length ? (
          <FinePrint>{t('results.supplements_none')}</FinePrint>
        ) : (
          <>
            {recs.map((r) => (
              <View key={r.supplement} style={styles.recRow}>
                <KVItem k={r.supplement}>
                  <View style={styles.recMeta}>
                    <TierPill tier={r.tier} />
                    <Text style={styles.recDriven}>
                      {' '}• {t('results.driven_by')} {r.nutrient} ({r.score}%)
                    </Text>
                  </View>
                </KVItem>
              </View>
            ))}
            <FinePrint>{t('results.supplements_disclaimer')}</FinePrint>
          </>
        )}

        <Divider />

        <Tagline title={t('results.start_plan')} body={t('results.start_plan_hint')} />
        <Button
          title={state.plan.started ? t('results.update_plan_btn') : t('results.start_plan_btn')}
          onPress={startPlan}
          disabled={!recs.length}
        />
        {!recs.length ? <FinePrint>{t('results.add_inputs_first')}</FinePrint> : null}
      </Section>

      {/* Insight modal */}
      <Modal visible={insightOpen} transparent animationType="fade" onRequestClose={() => setInsightOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setInsightOpen(false)} />
        <View style={styles.modalWrap} pointerEvents="box-none">
          <View style={styles.modal}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalKicker}>{t('modal.insight.title').toUpperCase()}</Text>
              <Text style={styles.modalSummary}>{insight.summary}</Text>
              <Text style={styles.modalLabel}>{t('modal.insight.means')}</Text>
              <Text style={styles.modalBody}>{insight.meaning}</Text>
              <Text style={styles.modalLabel}>{t('modal.insight.doctor')}</Text>
              <Text style={styles.modalBody}>{insight.doctorPrompt}</Text>
              <Text style={styles.modalLabel}>{t('modal.insight.why')}</Text>
              <Text style={styles.modalBody}>
                {insight.patterns.length ? `${t('summary.pattern')}: ${insight.patterns[0].title}\n` : ''}
                {insight.interactions.length ? `${t('summary.interactions_field')}: ${insight.interactions.length}\n` : ''}
                {insight.contraindications.length ? `${t('summary.contraindications_field')}: ${insight.contraindications.length}\n` : ''}
                {t('summary.success_prediction')}: {insight.prediction.score}% ({successLabel(insight.prediction.level, t)})
              </Text>
            </ScrollView>
            <Button title={t('modal.insight.close')} variant="secondary" onPress={() => setInsightOpen(false)} />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  coach: { backgroundColor: colors.primary50, borderColor: colors.primary100 },
  coachTitleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  coachSpark: { fontSize: 18, color: colors.primary, marginTop: 2 },
  coachTitle: { fontSize: 16, fontWeight: '900', color: colors.text },
  coachSub: { fontSize: 12, color: colors.textMuted, marginTop: 2, lineHeight: 17 },
  coachHead: { fontSize: 15, fontWeight: '700', color: colors.text, marginTop: 10 },
  coachBullet: { fontSize: 13, color: colors.textSoft, lineHeight: 19 },
  coachAction: { fontSize: 14, color: colors.textSoft, lineHeight: 20 },
  coachActionBold: { fontWeight: '800', color: colors.text },

  strong: { fontWeight: '800', color: colors.text },
  banner: {
    marginTop: 10,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.warningBg,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.35)',
  },
  bannerText: { fontSize: 13, color: colors.textSoft, lineHeight: 19 },

  metricCard: {
    gap: 6,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSoft,
  },
  metricKey: { fontSize: 11, fontWeight: '800', color: colors.textMuted, letterSpacing: 0.4, textTransform: 'uppercase' },
  metricRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 4 },
  metricStrong: { fontSize: 14, fontWeight: '700', color: colors.text },
  metricVal: { fontSize: 13, color: colors.textSoft, marginTop: 4 },
  metricMuted: { fontSize: 12, color: colors.textMuted, marginTop: 4 },

  scoreBadge: {
    minWidth: 52,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  scoreBadgeHigh: { backgroundColor: colors.successBg, borderWidth: 1, borderColor: 'rgba(52, 211, 153, 0.35)' },
  scoreBadgeMid: { backgroundColor: colors.warningBg, borderWidth: 1, borderColor: 'rgba(251, 191, 36, 0.35)' },
  scoreBadgeLow: { backgroundColor: colors.dangerBg, borderWidth: 1, borderColor: 'rgba(251, 113, 133, 0.35)' },
  scoreBadgeText: { fontSize: 16, fontWeight: '900' },
  scoreBadgeTextHigh: { color: colors.success },
  scoreBadgeTextMid: { color: colors.warning },
  scoreBadgeTextLow: { color: colors.danger },

  nutItem: { gap: 8, paddingVertical: 6 },
  sourceBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  sourceBadgePending: { backgroundColor: colors.ghostBg },
  sourceBadgeText: { fontSize: 11, fontWeight: '700', color: colors.textSoft },
  evRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  evToggle: { fontSize: 12, fontWeight: '700', color: colors.primary },
  citeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  evNote: { fontSize: 13, color: colors.textSoft, lineHeight: 19 },

  recRow: { paddingVertical: 2 },
  recMeta: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 4 },
  recDriven: { fontSize: 13, color: colors.textMuted },

  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(4, 6, 12, 0.72)' },
  modalWrap: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', padding: spacing.lg },
  modal: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, gap: 8, maxHeight: '80%' },
  modalKicker: { fontSize: 11, fontWeight: '800', color: colors.primary, letterSpacing: 1 },
  modalSummary: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 6 },
  modalLabel: { fontSize: 12, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.3, marginTop: 8 },
  modalBody: { fontSize: 14, color: colors.textSoft, lineHeight: 20 },
});
