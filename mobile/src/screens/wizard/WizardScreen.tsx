import React, { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { AppText as Text } from '@/components/AppText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { track } from '@/api/analytics';
import { AmbientBackground } from '@/components/AmbientBackground';
import { Button } from '@/components/Button';
import { FormScrollView } from '@/components/FormScrollView';
import { SaveState } from '@/components/SaveState';
import { IconTile } from '@/components/RefinedUI';
import type { AppIconName } from '@/components/AppIcon';
import { WizardDockContext, WizardHeaderContext, type WizardAction } from '@/components/WizardDock';
import { ReviewRangeSelect, WizardRangeContext } from '@/components/ReviewRangeSelect';
import type { ReviewRange } from '@/wizard/reviewData';
import { useWizard } from '@/store/WizardContext';
import { useAuth } from '@/auth/AuthContext';
import { normalizeStep } from '@/content/wizardData';
import { useTranslation } from '@/hooks/useTranslation';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { PlanHub } from './PlanHub';
import { AccountStep } from './steps/AccountStep';
import { MedicationsStep } from './steps/MedicationsStep';
import { SymptomsStep } from './steps/SymptomsStep';
import { WellbeingStep } from './steps/WellbeingStep';
import { ResultsStep } from './steps/ResultsStep';
import { CheckinStep } from './steps/CheckinStep';
import { InsightsStep } from './steps/InsightsStep';
import { ProgressStep } from './steps/ProgressStep';
import { SummaryStep } from './steps/SummaryStep';
import { FeedbackStep } from './steps/FeedbackStep';
import { colors } from '@/theme';
const Checkin: React.FC = () => <CheckinStep advanceToProgress />;
const STEPS = [AccountStep, MedicationsStep, SymptomsStep, WellbeingStep, ResultsStep, Checkin, ProgressStep, InsightsStep, SummaryStep, FeedbackStep];

export const WizardScreen: React.FC = () => {
  const { state, planHubOpen, saveStatus, hydrated } = useWizard();
  const { isGuest } = useAuth();
  const { t } = useTranslation();
  const { horizontal, scrollBottom } = useResponsiveLayout();
  const step = normalizeStep(state.step, isGuest);
  const Step = STEPS[step];
  const [action, setAction] = useState<WizardAction | null>(null);
  const [headerAction, setHeaderAction] = useState<WizardAction | null>(null);
  const [range, setRange] = useState<{ value: ReviewRange; onChange: (value: ReviewRange) => void } | null>(null);
  const bodyRef = useRef<ScrollView | null>(null);
  const tracked = useRef<number | null>(null);
  useEffect(() => { bodyRef.current?.scrollTo({ y: 0, animated: false }); }, [step, planHubOpen]);
  useEffect(() => {
    if (planHubOpen || tracked.current === step) return;
    tracked.current = step;
    track('wizard_step_viewed', { step, label: t('step.' + step) });
    if (step === 4) track('results_viewed');
    if (step === 8) track('wizard_completed');
  }, [step, planHubOpen, t]);
  return <WizardDockContext.Provider value={setAction}><WizardHeaderContext.Provider value={setHeaderAction}><WizardRangeContext.Provider value={setRange}><SafeAreaView style={styles.safe} edges={['top','left','right']}><AmbientBackground />
    <FormScrollView ref={bodyRef} style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: 20, paddingHorizontal: horizontal, paddingBottom: scrollBottom, gap: 16 }}>
      {planHubOpen || step !== 0 ? <View style={styles.heading}><Text accessibilityRole="header" style={styles.title}>{t(planHubOpen ? 'parity.plan_title' : `design.step.${step}.title`)}</Text>{!planHubOpen && [1, 2].includes(step) && headerAction ? <Pressable accessibilityRole="button" accessibilityLabel={headerAction.title} onPress={headerAction.onPress} style={{ width: 48, minHeight: 48, borderRadius: 24, backgroundColor: colors.primary50, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: colors.primary, fontSize: 27, lineHeight: 32 }}>+</Text></Pressable> : null}</View> : null}
      {!planHubOpen && (step === 6 || step === 8) && range ? <View style={{ alignSelf: 'flex-end' }}><ReviewRangeSelect compact {...range} /></View> : null}
      <SaveState />
      {saveStatus === 'unavailable' ? <Text style={styles.sub}>{t('tracking.load_body')}</Text> : !hydrated ? <Text style={styles.sub}>{t('journey.loading')}</Text> : planHubOpen ? <PlanHub /> : <Step />}
    </FormScrollView>
    {hydrated && !planHubOpen && step === 5 && action && saveStatus !== 'unavailable' ? <View style={[styles.dock,{paddingHorizontal:horizontal}]}><Button title={action.title} onPress={action.onPress} loading={action.loading} /></View> : null}
  </SafeAreaView></WizardRangeContext.Provider></WizardHeaderContext.Provider></WizardDockContext.Provider>;
};
const STEP_ICONS: Record<number, AppIconName> = { 0: 'account', 1: 'pill', 2: 'heart', 3: 'sun', 4: 'spark', 5: 'calendar', 6: 'chart', 7: 'chart', 8: 'file', 9: 'spark' };
const styles=StyleSheet.create({safe:{flex:1,backgroundColor:colors.background},heading:{flexDirection:'row',alignItems:'center',gap:14},title:{flex:1,fontSize:29,lineHeight:35,fontWeight:'600',letterSpacing:-1,color:colors.text},sub:{fontSize: 17,lineHeight:22,color:colors.textMuted},dock:{backgroundColor:colors.background,paddingVertical:8}});
