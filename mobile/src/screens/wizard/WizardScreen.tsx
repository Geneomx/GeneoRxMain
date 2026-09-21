import React, { useEffect, useMemo, useRef } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
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
import { colors, gradients, radius, spacing } from '@/theme';
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

/**
 * The step header is a horizontal pill tray. That is what was chosen after
 * seeing it beside a vertical numbered list; the vertical version still exists
 * in Stepper.tsx and stepStatus.ts but is no longer referenced here, so it is
 * not bundled. Recoverable from git if the decision reverses again.
 *
 * Two things from the vertical experiment are kept on purpose, because they
 * were asked for separately and are not tied to the tray:
 *   - Back is a chevron in the title row, not a button in a bottom bar.
 *   - The forward button is the last thing in the content and names where it
 *     goes. Together those removed 88px of fixed bottom chrome.
 */
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

  // Keeps the active pill visible in the horizontal tray without the user
  // having to hunt for it after a jump.
  const trayRef = useRef<ScrollView | null>(null);
  const trayX = useRef<Record<number, number>>({});
  useEffect(() => {
    const x = trayX.current[step];
    if (x === undefined) return;
    // Nudge it left of centre so the following steps stay hinted at.
    trayRef.current?.scrollTo({ x: Math.max(0, x - 80), animated: true });
  }, [step]);

  // A new step means new content, so start it at the top rather than wherever
  // the previous step happened to be scrolled to.
  const bodyRef = useRef<ScrollView | null>(null);
  useEffect(() => {
    bodyRef.current?.scrollTo({ y: 0, animated: false });
  }, [step]);

  const forwardTitle = isLast
    ? t('nav.home')
    : t('nav.next_named', { step: t(`step.${nextVisibleStep(step, isGuest)}.short`) });

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <AmbientBackground />

      <View style={[styles.header, { paddingHorizontal: horizontal }]}>
        {/* Title + subtitle + pill tabs — mirrors the website portal header */}
        <View style={styles.titleRow}>
          {/* Back lives here rather than in a bottom bar: this row already
              exists, so it costs no height. Absent on the first step rather
              than present and disabled. */}
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
          <Text style={styles.title} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.85}>
            {t(`step.${step}`)}
          </Text>
          <Pressable onPress={confirmReset} hitSlop={8} style={styles.resetBtn}>
            <Text style={styles.resetText}>{t('common.reset')}</Text>
          </Pressable>
        </View>
        <Text style={styles.sub} numberOfLines={3}>{t(`step.${step}.sub`)}</Text>

        <ScrollView
          ref={trayRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabs}
          keyboardShouldPersistTaps="handled"
        >
          {steps.map((idx) => {
            const isOn = idx === step;
            return (
              <Pressable
                key={idx}
                onPress={() => setStep(idx)}
                onLayout={(e) => {
                  trayX.current[idx] = e.nativeEvent.layout.x;
                }}
                style={[styles.tab, isOn && styles.tabOn]}
                accessibilityRole="tab"
                accessibilityState={{ selected: isOn }}
              >
                {isOn && (
                  <LinearGradient
                    colors={gradients.stepActive}
                    start={gradients.start}
                    end={gradients.end}
                    style={StyleSheet.absoluteFill}
                  />
                )}
                <Text style={[styles.tabText, isOn && styles.tabTextOn]} numberOfLines={1}>
                  {/* step.N.short exists in every pack and was unused; the
                      full labels are what forced the tray to wrap. */}
                  {t(`step.${idx}.short`)}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        ref={bodyRef}
        contentContainerStyle={[styles.body, { paddingHorizontal: horizontal, paddingBottom: scrollBottom }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <StepComponent />

        {/* The forward action, at the end of the content rather than in a fixed
            bar. It names its destination, because "Continue" alone does not say
            what happens next. */}
        <View style={styles.forward}>
          <Button
            title={forwardTitle}
            onPress={isLast ? goToDashboard : () => setStep(nextVisibleStep(step, isGuest))}
          />
        </View>
      </ScrollView>
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

  /* Pill tab tray — one scrolling row. Deliberately NOT flexWrap: with nine
     steps the wrapping version ran to three rows and cost ~120px before any
     content rendered. */
  tabs: { flexDirection: 'row', gap: 8, paddingVertical: 2, paddingRight: 12 },
  tab: {
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.ghostBg,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  tabOn: { borderColor: 'rgba(40, 225, 255, 0.35)' },
  tabText: { fontSize: 13, color: colors.textSoft, fontWeight: '600' },
  tabTextOn: { color: colors.onPrimary, fontWeight: '900' },

  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  title: { flex: 1, fontSize: 22, fontWeight: '800', color: colors.text, letterSpacing: -0.5, marginTop: 2 },
  sub: { fontSize: 15, color: colors.textMuted, lineHeight: 22, marginTop: -4 },
  resetBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.pill, backgroundColor: colors.surfaceAlt },
  resetText: { fontSize: 12, fontWeight: '700', color: colors.textMuted },

  backBtn: {
    width: 34,
    height: 34,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: { fontSize: 20, lineHeight: 22, color: colors.textSoft, marginTop: -2 },

  body: { gap: spacing.md, paddingTop: spacing.lg },
  forward: { marginTop: spacing.sm },
});
