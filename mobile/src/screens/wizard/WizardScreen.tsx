import React, { useEffect } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
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
import { ProgressStep } from '@/screens/wizard/steps/ProgressStep';
import { SummaryStep } from '@/screens/wizard/steps/SummaryStep';
import { FeedbackStep } from '@/screens/wizard/steps/FeedbackStep';

const CheckinStepScreen: React.FC = () => <CheckinStep advanceToProgress />;

const SkippedStep: React.FC = () => null;

const STEP_COMPONENTS = [
  AccountStep, MedicationsStep, SymptomsStep, WellbeingStep, ResultsStep,
  CheckinStepScreen, ProgressStep, SkippedStep, SummaryStep, FeedbackStep,
];

export const WizardScreen: React.FC = () => {
  const { state, setStep, reset } = useWizard();
  const { isGuest } = useAuth();
  const { t } = useTranslation();
  const goToDashboard = useDashboardNavigation();
  const insets = useSafeAreaInsets();
  const { horizontal, scrollBottom } = useResponsiveLayout();

  const steps = visibleSteps(isGuest);
  const step = normalizeStep(state.step, isGuest);
  const stepIndex = steps.indexOf(step);
  const total = steps.length;
  const StepComponent = STEP_COMPONENTS[step];
  const isFirst = stepIndex <= 0;
  const isLast = stepIndex >= total - 1;

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
      <AmbientBackground />
      <View style={[styles.header, { paddingHorizontal: horizontal }]}>
        {/* Title + subtitle + pill tabs — mirrors the website portal header */}
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.85}>
            {t(`step.${step}`)}
          </Text>
          <Pressable onPress={confirmReset} hitSlop={8} style={styles.resetBtn}>
            <Text style={styles.resetText}>{t('common.reset')}</Text>
          </Pressable>
        </View>
        <Text style={styles.sub} numberOfLines={3}>{t(`step.${step}.sub`)}</Text>

        <View style={styles.tabs}>
          {steps.map((idx) => {
            const isOn = idx === step;
            return (
              <Pressable
                key={idx}
                onPress={() => setStep(idx)}
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
                  {t(`step.${idx}`)}
                </Text>
              </Pressable>
            );
          })}
        </View>
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
            title={isLast ? t('nav.home') : t('nav.continue')}
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

  /* Pill tab tray — wraps to new rows like website .steps (flex-wrap) */
  tabs: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingVertical: 2 },
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
