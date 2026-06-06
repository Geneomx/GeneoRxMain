import React from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/Button';
import { Loader } from '@/components/Loader';
import { useWizard } from '@/store/WizardContext';
import { STEP_LABELS, STEP_SUBS } from '@/content/wizardData';
import { colors, radius, spacing } from '@/theme';
import { AccountStep } from '@/screens/wizard/steps/AccountStep';
import { MedicationsStep } from '@/screens/wizard/steps/MedicationsStep';
import { SymptomsStep } from '@/screens/wizard/steps/SymptomsStep';
import { WellbeingStep } from '@/screens/wizard/steps/WellbeingStep';
import { ResultsStep } from '@/screens/wizard/steps/ResultsStep';
import { CheckinStep } from '@/screens/wizard/steps/CheckinStep';
import { ProgressStep } from '@/screens/wizard/steps/ProgressStep';
import { CitationsStep } from '@/screens/wizard/steps/CitationsStep';
import { SummaryStep } from '@/screens/wizard/steps/SummaryStep';
import { FeedbackStep } from '@/screens/wizard/steps/FeedbackStep';

const STEP_COMPONENTS = [
  AccountStep, MedicationsStep, SymptomsStep, WellbeingStep, ResultsStep,
  CheckinStep, ProgressStep, CitationsStep, SummaryStep, FeedbackStep,
];

// Three clear phases give a sense of place without a cramped 10-item strip.
const PHASES: { name: string; steps: number[] }[] = [
  { name: 'Setup', steps: [0, 1, 2, 3] },
  { name: 'Results', steps: [4, 5, 6] },
  { name: 'Review', steps: [7, 8, 9] },
];

function phaseIndexForStep(step: number): number {
  return PHASES.findIndex((p) => p.steps.includes(step));
}

const RESULTS_STEP = STEP_LABELS.indexOf('Results');

export const WizardScreen: React.FC = () => {
  const { state, hydrated, setStep, next, prev, reset } = useWizard();

  if (!hydrated) return <Loader />;

  const step = state.step;
  const total = STEP_LABELS.length;
  const label = STEP_LABELS[step];
  const StepComponent = STEP_COMPONENTS[step];
  const isFirst = step === 0;
  const isLast = step === total - 1;
  const activePhase = phaseIndexForStep(step);

  const confirmReset = () =>
    Alert.alert('Start over?', 'This clears everything you entered in the Guided flow.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Start over', style: 'destructive', onPress: reset },
    ]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        {/* Phase bar — three segments, fills as you progress through each */}
        <View style={styles.phaseRow}>
          {PHASES.map((p, pi) => {
            const isActive = pi === activePhase;
            const isDone = pi < activePhase;
            // progress within this phase (0..1)
            const idx = p.steps.indexOf(step);
            const fill = isDone ? 1 : isActive ? (idx + 1) / p.steps.length : 0;
            return (
              <Pressable
                key={p.name}
                style={styles.phaseSeg}
                onPress={() => setStep(p.steps[0])}
                disabled={pi > activePhase}
              >
                <Text style={[styles.phaseName, (isActive || isDone) && styles.phaseNameOn]}>{p.name}</Text>
                <View style={styles.phaseTrack}>
                  <View style={[styles.phaseFill, { width: `${fill * 100}%` }]} />
                </View>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.titleRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.kicker}>STEP {step + 1} OF {total}</Text>
            <Text style={styles.title}>{label}</Text>
          </View>
          <Pressable onPress={confirmReset} hitSlop={8} style={styles.resetBtn}>
            <Text style={styles.resetText}>Start over</Text>
          </Pressable>
        </View>
        <Text style={styles.sub}>{STEP_SUBS[label]}</Text>
      </View>

      {/* Body */}
      <ScrollView
        contentContainerStyle={styles.body}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <StepComponent />
      </ScrollView>

      {/* Nav */}
      <View style={styles.nav}>
        {!isFirst ? (
          <View style={{ flex: 1 }}>
            <Button title="‹  Back" variant="secondary" onPress={prev} />
          </View>
        ) : null}
        <View style={{ flex: isFirst ? 1 : 1.5 }}>
          <Button title={isLast ? 'See my results' : 'Continue  ›'} onPress={isLast ? () => setStep(RESULTS_STEP) : next} />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSoft,
    backgroundColor: colors.surface,
  },

  phaseRow: { flexDirection: 'row', gap: 10 },
  phaseSeg: { flex: 1, gap: 6 },
  phaseName: { fontSize: 11, fontWeight: '700', color: colors.textDim, letterSpacing: 0.4 },
  phaseNameOn: { color: colors.primary },
  phaseTrack: { height: 4, borderRadius: 2, backgroundColor: colors.surfaceAlt, overflow: 'hidden' },
  phaseFill: { height: 4, borderRadius: 2, backgroundColor: colors.primary },

  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  kicker: { fontSize: 11, fontWeight: '800', color: colors.textMuted, letterSpacing: 1 },
  title: { fontSize: 24, fontWeight: '800', color: colors.text, letterSpacing: -0.5, marginTop: 2 },
  sub: { fontSize: 14, color: colors.textMuted, lineHeight: 20, marginTop: -4 },
  resetBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.pill, backgroundColor: colors.surfaceAlt },
  resetText: { fontSize: 12, fontWeight: '700', color: colors.textMuted },

  body: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl },

  nav: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderSoft,
    backgroundColor: colors.surface,
  },
});
