import React, { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/Button';
import { useWizard } from '@/store/WizardContext';
import { MED_DB } from '@/content/wizardData';
import {
  aggregateEvidenceByNutrient,
  buildRoutineFromSupplements,
  claimsForSelectedMeds,
  computeContraindications,
  computeDrugInteractions,
  computeInsightEngine,
  computeMedicationSuccessPrediction,
  computeNutrientScores,
  computePopulationInsights,
  computeWeeklyCoachMessage,
  detectHealthPatterns,
  evidencePanel,
  fmtDate,
  recommendSupplements,
  tierFromScore,
} from '@/wizard/engine';
import { Accordion, AlertBox, CiteChip, Divider, FinePrint, HelpNote, NoteBox, Section, Tagline, TierPill } from '@/screens/wizard/ui';
import { colors, radius, spacing } from '@/theme';

export const ResultsStep: React.FC = () => {
  const { state, update } = useWizard();
  const [insightOpen, setInsightOpen] = useState(false);
  const [openEvidence, setOpenEvidence] = useState<Record<string, boolean>>({});

  const scores = useMemo(() => computeNutrientScores(state), [state]);
  const recs = useMemo(() => recommendSupplements(scores), [scores]);
  const claims = useMemo(() => claimsForSelectedMeds(state), [state]);
  const evidenceMap = useMemo(() => aggregateEvidenceByNutrient(claims), [claims]);
  const coach = useMemo(() => computeWeeklyCoachMessage(state), [state]);
  const insight = useMemo(() => computeInsightEngine(state), [state]);
  const success = useMemo(() => computeMedicationSuccessPrediction(state), [state]);
  const patterns = useMemo(() => detectHealthPatterns(state), [state]);
  const population = useMemo(() => computePopulationInsights(state), [state]);
  const interactions = useMemo(() => computeDrugInteractions(state), [state]);
  const contraindications = useMemo(() => computeContraindications(state), [state]);

  const startPlan = () => {
    const supps = recs.map((r) => r.supplement);
    update((d) => {
      d.plan.started = true;
      d.plan.startDate = new Date().toISOString();
      d.plan.recommendedSupplements = supps;
      d.plan.routine = buildRoutineFromSupplements(supps);
    });
  };

  const noData = !state.meds.length && !state.symptoms.selected.length;
  const customMeds = useMemo(
    () => state.meds.filter((m) => m.medId.startsWith('custom:')),
    [state.meds],
  );

  return (
    <View style={{ gap: spacing.md }}>
      <HelpNote
        what="This is your personalized read-out. Open each card to see signals, evidence, and a suggested routine — then tap Start plan."
        why="Everything here is educational and built from your inputs plus published research. Always confirm changes with your clinician."
      >
        <Text style={styles.legend}>• Signal % bar = estimated strength of the signal for that nutrient.</Text>
        <Text style={styles.legend}>• Tier (High / Moderate / Low) = how strong the evidence and likelihood are.</Text>
        <Text style={styles.legend}>• Success prediction = an estimate of how likely your plan helps — not a guarantee.</Text>
      </HelpNote>

      {/* AI Coach */}
      <Section style={styles.coach}>
        <Text style={styles.coachKicker}>GENEORX COACH</Text>
        <Text style={styles.coachHead}>{coach.headline}</Text>
        {coach.bullets.map((b, i) => (
          <Text key={i} style={styles.coachBullet}>• {b}</Text>
        ))}
        <NoteBox>Next best action: {coach.nextBestAction}</NoteBox>
      </Section>

      {customMeds.length && !noData ? (
        <Section>
          <NoteBox>
            {customMeds.length === 1 ? 'One custom medication isn’t' : `${customMeds.length} custom medications aren’t`} in our
            research database yet, so {customMeds.length === 1 ? "it isn't" : "they aren't"} included in the nutrient-signal,
            interaction, or caution analysis below. {customMeds.length === 1 ? "It's" : "They're"} still saved to your profile.
          </NoteBox>
        </Section>
      ) : null}

      {noData ? (
        <Section>
          <Tagline title="Add inputs to see results" body="Go back and add medications and symptoms to generate nutrient signals, evidence, and recommendations." />
          <FinePrint>Until then, GeneoRx can't estimate a success prediction or detect patterns — those numbers would just be defaults, not your results.</FinePrint>
        </Section>
      ) : null}

      {/* Insight + metrics are only meaningful once there are inputs */}
      {!noData ? (
        <>
          {/* Insight button */}
          <Button title="Open GeneoRx Insight" variant="secondary" onPress={() => setInsightOpen(true)} />

          {/* Metric grid */}
          <View style={styles.grid}>
            <View style={styles.metric}>
              <Text style={styles.metricLabel}>Success prediction</Text>
              <Text style={styles.metricBig}>{success.score}%</Text>
              <Text style={styles.metricSub}>{success.level}</Text>
            </View>
            <View style={styles.metric}>
              <Text style={styles.metricLabel}>Detected pattern</Text>
              <Text style={styles.metricMed}>{patterns.length ? patterns[0].title : 'None yet'}</Text>
              <Text style={styles.metricSub}>{patterns.length ? patterns[0].confidence : '—'}</Text>
            </View>
            <View style={styles.metric}>
              <Text style={styles.metricLabel}>Check-ins logged</Text>
              <Text style={styles.metricBig}>{population.checkinCount}</Text>
              <Text style={styles.metricSub}>Population signal</Text>
            </View>
          </View>
        </>
      ) : null}

      {/* Alerts */}
      {interactions.length ? (
        <Section>
          <Tagline title="Drug interactions" />
          {interactions.map((a) => (
            <AlertBox key={a.title} {...a} />
          ))}
        </Section>
      ) : null}
      {contraindications.length ? (
        <Section>
          <Tagline title="Contraindications & cautions" />
          {contraindications.map((a) => (
            <AlertBox key={a.title} {...a} />
          ))}
        </Section>
      ) : null}

      {/* Nutrient signals + evidence */}
      {scores.length ? (
        <Accordion
          title="Nutrient signals"
          subtitle="Tap to see estimated support signals from your meds and symptoms, with evidence."
          badge={scores.length}
        >
          {scores.map(([nut, sc]) => {
            const tier = tierFromScore(sc);
            const ev = evidencePanel(nut, evidenceMap[nut] || []);
            const open = !!openEvidence[nut];
            return (
              <View key={nut} style={styles.nutRow}>
                <View style={styles.nutHead}>
                  <Text style={styles.nutName}>{nut}</Text>
                  <View style={styles.nutRight}>
                    <Text style={styles.nutScore}>{sc}%</Text>
                    <TierPill tier={tier} />
                  </View>
                </View>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { width: `${sc}%` }]} />
                </View>
                <Pressable onPress={() => setOpenEvidence((p) => ({ ...p, [nut]: !p[nut] }))}>
                  <Text style={styles.evToggle}>{open ? 'Hide evidence ▲' : 'Show evidence ▼'}</Text>
                </Pressable>
                {open ? (
                  <View style={{ gap: 8 }}>
                    {ev.citations.length ? (
                      <View style={styles.citeRow}>
                        {ev.citations.map((c) => (
                          <CiteChip key={c} token={c} />
                        ))}
                      </View>
                    ) : (
                      <FinePrint>No citations attached yet for this nutrient.</FinePrint>
                    )}
                    {ev.noteText ? <Text style={styles.evNote}>{ev.noteText}</Text> : null}
                    {ev.labs.length ? <FinePrint>Optional labs: {ev.labs.join(', ')}</FinePrint> : null}
                  </View>
                ) : null}
              </View>
            );
          })}
        </Accordion>
      ) : null}

      {/* Recommendations */}
      {recs.length ? (
        <Accordion
          title="Recommended support"
          subtitle="Educational suggestions, ranked by signal tier. Confirm with your clinician."
          badge={recs.length}
        >
          {recs.map((r) => (
            <View key={r.supplement} style={styles.recRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.recName}>{r.supplement}</Text>
                <Text style={styles.recNut}>{r.nutrient}</Text>
              </View>
              <TierPill tier={r.tier} />
            </View>
          ))}
        </Accordion>
      ) : null}

      {/* Start plan / routine */}
      <Section>
        {state.plan.started ? (
          <>
            <Tagline title="Your plan is active" body={`Started ${fmtDate(state.plan.startDate)}.`} />
            {(['morning', 'midday', 'night'] as const).map((slot) =>
              state.plan.routine[slot].length ? (
                <View key={slot} style={styles.routineSlot}>
                  <Text style={styles.routineLabel}>{slot.toUpperCase()}</Text>
                  {state.plan.routine[slot].map((item, i) => (
                    <Text key={i} style={styles.routineItem}>• {item}</Text>
                  ))}
                </View>
              ) : null,
            )}
            {state.plan.routine.notes.length ? (
              <View style={{ gap: 4 }}>
                <Divider />
                {state.plan.routine.notes.map((n, i) => (
                  <FinePrint key={i}>• {n}</FinePrint>
                ))}
              </View>
            ) : null}
            <Button title="Restart plan with today's date" variant="secondary" onPress={startPlan} />
          </>
        ) : (
          <>
            <Tagline title="Start your plan" body="Save these recommendations and build a daily routine you can track in check-ins." />
            <Button title="Start plan" onPress={startPlan} disabled={!recs.length} />
            {!recs.length ? <FinePrint>Add meds or symptoms first to generate a plan.</FinePrint> : null}
          </>
        )}
      </Section>

      {/* Insight modal */}
      <Modal visible={insightOpen} transparent animationType="fade" onRequestClose={() => setInsightOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setInsightOpen(false)} />
        <View style={styles.modalWrap} pointerEvents="box-none">
          <View style={styles.modal}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalKicker}>GENEORX INSIGHT</Text>
              <Text style={styles.modalSummary}>{insight.summary}</Text>
              <Text style={styles.modalLabel}>What this may mean</Text>
              <Text style={styles.modalBody}>{insight.meaning}</Text>
              <Text style={styles.modalLabel}>Discuss with your doctor</Text>
              <Text style={styles.modalBody}>{insight.doctorPrompt}</Text>
              <Text style={styles.modalLabel}>Why GeneoRx generated this</Text>
              <Text style={styles.modalBody}>
                {insight.patterns.length ? `Pattern: ${insight.patterns[0].title}\n` : ''}
                {insight.interactions.length ? `Interactions: ${insight.interactions.length}\n` : ''}
                {insight.contraindications.length ? `Cautions: ${insight.contraindications.length}\n` : ''}
                Success prediction: {insight.prediction.score}% ({insight.prediction.level})
              </Text>
            </ScrollView>
            <Button title="Close" variant="secondary" onPress={() => setInsightOpen(false)} />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  legend: { fontSize: 12.5, color: colors.primaryDark, opacity: 0.9, lineHeight: 18 },
  coach: { backgroundColor: colors.primary50, borderColor: colors.primary100 },
  coachKicker: { fontSize: 11, fontWeight: '800', color: colors.primary, letterSpacing: 1 },
  coachHead: { fontSize: 17, fontWeight: '700', color: colors.text },
  coachBullet: { fontSize: 13, color: colors.textSoft, lineHeight: 19 },

  grid: { flexDirection: 'row', gap: spacing.sm },
  metric: { flex: 1, backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.borderSoft, padding: spacing.md, gap: 2, alignItems: 'flex-start' },
  metricLabel: { fontSize: 10, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.3 },
  metricBig: { fontSize: 22, fontWeight: '800', color: colors.primary },
  metricMed: { fontSize: 13, fontWeight: '700', color: colors.text },
  metricSub: { fontSize: 11, color: colors.textMuted },

  nutRow: { gap: 6, paddingVertical: 6 },
  nutHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  nutName: { fontSize: 14, fontWeight: '700', color: colors.text },
  nutRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  nutScore: { fontSize: 13, fontWeight: '700', color: colors.textSoft },
  barTrack: { height: 7, borderRadius: 4, backgroundColor: colors.surfaceAlt, overflow: 'hidden' },
  barFill: { height: 7, borderRadius: 4, backgroundColor: colors.primary },
  evToggle: { fontSize: 12, fontWeight: '700', color: colors.primary },
  citeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  evNote: { fontSize: 13, color: colors.textSoft, lineHeight: 19 },

  recRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.borderSoft },
  recName: { fontSize: 14, fontWeight: '600', color: colors.text },
  recNut: { fontSize: 12, color: colors.textMuted },

  routineSlot: { gap: 3 },
  routineLabel: { fontSize: 11, fontWeight: '800', color: colors.primary, letterSpacing: 0.6 },
  routineItem: { fontSize: 13, color: colors.textSoft, lineHeight: 19 },

  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15,31,27,0.45)' },
  modalWrap: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', padding: spacing.lg },
  modal: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, gap: 8, maxHeight: '80%' },
  modalKicker: { fontSize: 11, fontWeight: '800', color: colors.primary, letterSpacing: 1 },
  modalSummary: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 6 },
  modalLabel: { fontSize: 12, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.3, marginTop: 8 },
  modalBody: { fontSize: 14, color: colors.textSoft, lineHeight: 20 },
});
