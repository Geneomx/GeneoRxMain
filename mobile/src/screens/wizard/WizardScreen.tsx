import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { track } from '@/api/analytics';
import { AmbientBackground } from '@/components/AmbientBackground';
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
import { StepRow, StepSpine } from '@/screens/wizard/Stepper';
import { stepStateOf } from '@/wizard/stepStatus';
import { AccountStep } from '@/screens/wizard/steps/AccountStep';
import { MedicationsStep } from '@/screens/wizard/steps/MedicationsStep';
import { SymptomsStep } from '@/screens/wizard/steps/SymptomsStep';
import { WellbeingStep } from '@/screens/wizard/steps/WellbeingStep';
import { ResultsStep } from '@/screens/wizard/steps/ResultsStep';
import { CheckinStep } from '@/screens/wizard/steps/CheckinStep';
import { InsightsStep } from '@/screens/wizard/steps/InsightsStep';
import { ProgressStep } from '@/screens/wizard/steps/ProgressStep';
import { SummaryStep } from '@/screens/wizard/steps/SummaryStep';
import { FeedbackStep } from '@/screens/wizard/steps/FeedbackStep';

const CheckinStepScreen: React.FC = () => <CheckinStep advanceToProgress />;

const STEP_COMPONENTS = [
  AccountStep, MedicationsStep, SymptomsStep, WellbeingStep, ResultsStep,
  CheckinStepScreen, ProgressStep, InsightsStep, SummaryStep, FeedbackStep,
];

export const WizardScreen: React.FC = () => {
  const { state, setStep, reset } = useWizard();
  const { isGuest } = useAuth();
  const { t } = useTranslation();
  const goToDashboard = useDashboardNavigation();
  const { horizontal, scrollBottom } = useResponsiveLayout();

  const steps = useMemo(() => visibleSteps(isGuest), [isGuest]);
  const step = normalizeStep(state.step, isGuest);
  const stepIndex = steps.indexOf(step);
  const total = steps.length;
  const StepComponent = STEP_COMPONENTS[step];
  const isFirst = stepIndex <= 0;
  const isLast = stepIndex >= total - 1;

  useEffect(() => {
    if (step !== state.step) setStep(step);
  }, [step, state.step, setStep]);

  // Wizard funnel, mirroring the web portal's three events and their names.
  // Keyed off the NORMALIZED step so tab presses, Back/Continue and direct
  // setStep calls are all covered by this one seam; the ref makes it fire only
  // on an actual change (a language switch re-runs the effect but must not
  // re-log the step).
  const lastTrackedStep = useRef<number | null>(null);
  useEffect(() => {
    if (lastTrackedStep.current === step) return;
    lastTrackedStep.current = step;

    track('wizard_step_viewed', { step, label: t(`step.${step}`) });
    if (step === 4) track('results_viewed');
    if (step === 8) track('wizard_completed');
  }, [step, t]);

  const confirmReset = () =>
    Alert.alert(t('mobile.reset.title'), t('mobile.reset.body'), [
      { text: t('common.no'), style: 'cancel' },
      { text: t('mobile.reset.confirm'), style: 'destructive', onPress: reset },
    ]);

  // Keeps the open step in view after a jump, the way the old horizontal tray
  // scrolled the active pill into view.
  const bodyRef = useRef<ScrollView | null>(null);
  const currentY = useRef(0);
  useEffect(() => {
    bodyRef.current?.scrollTo({ y: Math.max(0, currentY.current - 8), animated: true });
  }, [step]);

  // The forward button lives at the END of the open step rather than in a fixed
  // bar. It names where it goes, because "Continue" on its own does not say
  // what happens next.
  const forwardTitle = isLast
    ? t('nav.home')
    : t('nav.next_named', { step: t(`step.${nextVisibleStep(step, isGuest)}.short`) });

  const renderStep = (idx: number) => {
    const isCurrent = idx === step;
    const row = (
      <StepRow
        key={idx}
        index={idx}
        title={t(`step.${idx}.short`)}
        state={stepStateOf(state, idx, step, t)}
        onPress={() => setStep(idx)}
      >
        {isCurrent ? (
          <>
            <StepComponent />
            <View style={styles.forward}>
              <Button
                title={forwardTitle}
                onPress={isLast ? goToDashboard : () => setStep(nextVisibleStep(step, isGuest))}
              />
            </View>
          </>
        ) : null}
      </StepRow>
    );

    if (!isCurrent) return row;
    return (
      <View key={idx} onLayout={(e) => { currentY.current = e.nativeEvent.layout.y; }}>
        {row}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <AmbientBackground />

      {/* One 50px bar and a progress line, replacing the old title + subtitle +
          pill-tray stack. The step names live in the list below, where all of
          them fit and each row is just a number and a name. */}
      <View style={[styles.appbar, { paddingHorizontal: horizontal }]}>
        {/* Back is a chevron here rather than a button in a bar at the bottom.
            This row already existed and held only the brand and Reset, so Back
            costs no height at all. Absent on the first step, never disabled. */}
        {!isFirst ? (
          <Pressable
            onPress={() => setStep(prevVisibleStep(step, isGuest))}
            hitSlop={10}
            style={styles.backBtn}
            accessibilityRole="button"
            accessibilityLabel={t('nav.back')}
          >
            <Text style={styles.backIcon}>‹</Text>
          </Pressable>
        ) : null}
        <Text style={styles.brand}>GeneoRx</Text>
        <View style={styles.spacer} />
        <Pressable onPress={confirmReset} hitSlop={10} style={styles.resetBtn}>
          <Text style={styles.resetText}>{t('common.reset')}</Text>
        </Pressable>
      </View>

      <View
        style={[styles.meter, { paddingHorizontal: horizontal }]}
        accessibilityRole="progressbar"
        accessibilityLabel={t('wizard.stepOf', { n: stepIndex + 1, total })}
      >
        <Text style={styles.meterLab}>{t('wizard.stepOf', { n: stepIndex + 1, total })}</Text>
        <View style={styles.track}>
          <View style={[styles.trackFill, { width: `${Math.round(((stepIndex + 1) / total) * 100)}%` }]} />
        </View>
      </View>

      <ScrollView
        ref={bodyRef}
        contentContainerStyle={[styles.body, { paddingHorizontal: horizontal, paddingBottom: scrollBottom }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.stepper}>
          <StepSpine progress={total > 1 ? stepIndex / (total - 1) : 1} />

          {steps.map(renderStep)}
        </View>
      </ScrollView>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },

  appbar: {
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  brand: { fontSize: 15, fontWeight: '800', color: colors.text, letterSpacing: -0.1 },
  spacer: { flex: 1 },
  resetBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border },
  resetText: { fontSize: 13, fontWeight: '700', color: colors.textSoft },

  meter: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingBottom: spacing.sm },
  meterLab: { fontSize: 13, color: colors.textMuted, fontVariant: ['tabular-nums'] },
  track: { flex: 1, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.09)', overflow: 'hidden' },
  trackFill: { height: '100%', backgroundColor: colors.primary },

  body: { paddingTop: spacing.sm },
  stepper: { position: 'relative' },

  /* Sits at the end of the open step's content, not in a fixed bar. */
  forward: { marginTop: spacing.sm },

  backBtn: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: { fontSize: 22, lineHeight: 24, color: colors.textSoft, marginTop: -2 },
});
