import React, { useEffect } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/Button';
import { useAuth } from '@/auth/AuthContext';
import { useWizard } from '@/store/WizardContext';
import {
  nextVisibleStep,
  normalizeStep,
  prevVisibleStep,
  visibleSteps,
} from '@/content/wizardData';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { useTranslation } from '@/hooks/useTranslation';
import { useDashboardNavigation } from '@/navigation/useDashboardNavigation';
import { colors, radius, spacing } from '@/theme';
import { AccountStep } from '@/screens/wizard/steps/AccountStep';
import { MedicationsStep } from '@/screens/wizard/steps/MedicationsStep';
import { SymptomsStep } from '@/screens/wizard/steps/SymptomsStep';
import { WellbeingStep } from '@/screens/wizard/steps/WellbeingStep';
import { ResultsStep } from '@/screens/wizard/steps/ResultsStep';
import { CheckinStep } from '@/screens/wizard/steps/CheckinStep';
import { ProgressStep } from '@/screens/wizard/steps/ProgressStep';
import { SummaryStep } from '@/screens/wizard/steps/SummaryStep';
import { FeedbackStep } from '@/screens/wizard/steps/FeedbackStep';

const CheckinStepScreen: React.FC = () => <CheckinStep advanceToProgress />;

const SkippedStep: React.FC = () => null;

const STEP_COMPONENTS = [
  AccountStep, MedicationsStep, SymptomsStep, WellbeingStep, ResultsStep,
  CheckinStepScreen, ProgressStep, SkippedStep, SummaryStep, FeedbackStep,
];

const PHASES: { key: string; steps: number[] }[] = [
  { key: 'mobile.phase.setup', steps: [0, 1, 2, 3] },
  { key: 'mobile.phase.results', steps: [4, 5, 6] },
  { key: 'mobile.phase.review', steps: [8] },
];

function phaseIndexForStep(step: number): number {
  return PHASES.findIndex((p) => p.steps.includes(step));
}

export const WizardScreen: React.FC = () => {
  const { state, setStep, reset } = useWizard();
  const { isGuest } = useAuth();
  const { t } = useTranslation();
  const goToDashboard = useDashboardNavigation();
  const insets = useSafeAreaInsets();
  const { isNarrow, horizontal, scrollBottom } = useResponsiveLayout();
  const compactStepper = isNarrow;

  const steps = visibleSteps(isGuest);
  const step = normalizeStep(state.step, isGuest);
  const stepIndex = steps.indexOf(step);
  const total = steps.length;
  const StepComponent = STEP_COMPONENTS[step];
  const isFirst = stepIndex <= 0;
  const isLast = stepIndex >= total - 1;
  const activePhase = phaseIndexForStep(step);

  useEffect(() => {
    if (step !== state.step) setStep(step);
  }, [step, state.step, setStep]);

  const confirmReset = () =>
    Alert.alert(t('mobile.reset.title'), t('mobile.reset.body'), [
      { text: t('common.no'), style: 'cancel' },
      { text: t('mobile.reset.confirm'), style: 'destructive', onPress: reset },
    ]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={[styles.header, { paddingHorizontal: horizontal }]}>
        <View style={styles.phaseRow}>
          {PHASES.map((p, pi) => {
            const isActive = pi === activePhase;
            const isDone = pi < activePhase;
            const idx = p.steps.indexOf(step);
            const fill = isDone ? 1 : isActive ? (idx + 1) / p.steps.length : 0;
            return (
              <Pressable
                key={p.key}
                style={styles.phaseSeg}
                onPress={() => setStep(p.steps[0])}
                disabled={pi > activePhase}
              >
                <Text
                  style={[styles.phaseName, (isActive || isDone) && styles.phaseNameOn]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.75}
                >
                  {t(p.key)}
                </Text>
                <View style={styles.phaseTrack}>
                  <View style={[styles.phaseFill, { width: `${fill * 100}%` }]} />
                </View>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.stepper}>
          {steps.map((idx, i) => {
            const isOn = idx === step;
            const isDone = i < stepIndex;
            const isLastNode = i === steps.length - 1;
            const shortKey = `step.${idx}.short`;
            const shortLabel = t(shortKey) !== shortKey ? t(shortKey) : t(`step.${idx}`);
            return (
              <React.Fragment key={idx}>
                <Pressable onPress={() => setStep(idx)} style={styles.stepperNode}>
                  <View style={[styles.stepperDot, isOn && styles.stepperDotOn, isDone && !isOn && styles.stepperDotDone]}>
                    {isDone && !isOn ? (
                      <Text style={styles.stepperCheck}>✓</Text>
                    ) : (
                      <Text style={[styles.stepperNum, isOn && styles.stepperNumOn]}>{i + 1}</Text>
                    )}
                  </View>
                  {!compactStepper ? (
                    <Text
                      style={[styles.stepperLabel, isOn && styles.stepperLabelOn]}
                      numberOfLines={2}
                      adjustsFontSizeToFit
                      minimumFontScale={0.65}
                    >
                      {shortLabel}
                    </Text>
                  ) : null}
                </Pressable>
                {!isLastNode ? (
                  <View style={[styles.stepperLine, i < stepIndex && styles.stepperLineDone]} />
                ) : null}
              </React.Fragment>
            );
          })}
        </View>

        <View style={styles.titleRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.kicker}>{t('mobile.wizard.step_of', { current: stepIndex + 1, total })}</Text>
            <Text style={styles.title} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.85}>
              {t(`step.${step}`)}
            </Text>
          </View>
          <Pressable onPress={confirmReset} hitSlop={8} style={styles.resetBtn}>
            <Text style={styles.resetText}>{t('common.reset')}</Text>
          </Pressable>
        </View>
        <Text style={styles.sub} numberOfLines={3}>{t(`step.${step}.sub`)}</Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.body, { paddingHorizontal: horizontal, paddingBottom: scrollBottom }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <StepComponent />
      </ScrollView>

      <View style={[styles.nav, { paddingHorizontal: horizontal, paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
        {!isFirst ? (
          <View style={{ flex: 1 }}>
            <Button
              title={t('nav.back')}
              variant="secondary"
              onPress={() => setStep(prevVisibleStep(step, isGuest))}
            />
          </View>
        ) : null}
        <View style={{ flex: isFirst ? 1 : 1.5 }}>
          <Button
            title={isLast ? t('nav.dashboard') : t('nav.continue')}
            onPress={isLast ? goToDashboard : () => setStep(nextVisibleStep(step, isGuest))}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSoft,
    backgroundColor: colors.surface,
  },

  phaseRow: { flexDirection: 'row', gap: 10 },
  phaseSeg: { flex: 1, gap: 6, minWidth: 0 },
  phaseName: { fontSize: 12, fontWeight: '700', color: colors.textDim, letterSpacing: 0.2, textAlign: 'center' },
  phaseNameOn: { color: colors.primary },
  phaseTrack: { height: 4, borderRadius: 2, backgroundColor: colors.surfaceAlt, overflow: 'hidden' },
  phaseFill: { height: 4, borderRadius: 2, backgroundColor: colors.primary },

  stepper: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 4,
  },
  stepperNode: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    minWidth: 0,
  },
  stepperDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.ghostBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperDotOn: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  stepperDotDone: {
    backgroundColor: colors.primary50,
    borderColor: colors.primary100,
  },
  stepperNum: { fontSize: 12, fontWeight: '800', color: colors.textMuted },
  stepperNumOn: { color: colors.textInverse },
  stepperCheck: { fontSize: 12, fontWeight: '900', color: colors.primary },
  stepperLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textDim,
    textAlign: 'center',
    width: '100%',
    lineHeight: 13,
    paddingHorizontal: 1,
  },
  stepperLabelOn: { color: colors.primary, fontWeight: '800' },
  stepperLine: {
    flex: 1,
    height: 2,
    backgroundColor: colors.borderSoft,
    marginTop: 12,
    marginHorizontal: 1,
    minWidth: 4,
  },
  stepperLineDone: { backgroundColor: colors.primary100 },

  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  kicker: { fontSize: 11, fontWeight: '800', color: colors.textMuted, letterSpacing: 1 },
  title: { fontSize: 22, fontWeight: '800', color: colors.text, letterSpacing: -0.5, marginTop: 2 },
  sub: { fontSize: 16, color: colors.textMuted, lineHeight: 24, marginTop: -4 },
  resetBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.pill, backgroundColor: colors.surfaceAlt },
  resetText: { fontSize: 12, fontWeight: '700', color: colors.textMuted },

  body: { gap: spacing.md, paddingTop: spacing.lg },

  nav: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderSoft,
    backgroundColor: colors.surface,
  },
});
