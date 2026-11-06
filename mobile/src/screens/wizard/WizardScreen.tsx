import React, { useEffect, useRef, useState } from 'react';
import { Alert, BackHandler, Keyboard, KeyboardAvoidingView, LayoutAnimation, Platform, Pressable, type ScrollViewInstance, StyleSheet, View, type ViewInstance } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { AppTabsParamList } from '@/navigation/AppTabs';
import { useSetup } from '@/store/SetupContext';
import { adjacentSetupStep, type SetupStep } from '@/wizard/setupFlow';
import { AppText as Text } from '@/components/AppText';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { track } from '@/api/analytics';
import { AmbientBackground } from '@/components/AmbientBackground';
import { Button } from '@/components/Button';
import { FormScrollView } from '@/components/FormScrollView';
import { SaveState } from '@/components/SaveState';
import { AppIcon } from '@/components/AppIcon';
import { TopBar } from '@/components/TopBar';
import { WizardDockContext, WizardHeaderContext, type WizardAction } from '@/components/WizardDock';
import { ReviewRangeSelect, WizardRangeContext } from '@/components/ReviewRangeSelect';
import type { ReviewRange } from '@/wizard/reviewData';
import { useWizard } from '@/store/WizardContext';
import { useAuth } from '@/auth/AuthContext';
import { normalizeStep } from '@/content/wizardData';
import { useTranslation } from '@/hooks/useTranslation';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { StepRow } from './Stepper';
import { stepStateOf, stepSummary } from '@/wizard/stepStatus';
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
import { useCheckinDrafts } from '@/store/CheckinDraftContext';
import { hasUnfinishedCheckin } from '@/wizard/checkinEditor';
const Checkin: React.FC = () => <CheckinStep />;
const STEPS = [AccountStep, MedicationsStep, SymptomsStep, WellbeingStep, ResultsStep, Checkin, ProgressStep, InsightsStep, SummaryStep, FeedbackStep];

export const WizardScreen: React.FC = () => {
  const { state, planHubOpen, openPlanHub, setStep, saveStatus, hydrated } = useWizard();
  const { session: checkinSession, original: editingCheckin, drafts: checkinDrafts } = useCheckinDrafts();
  const { isGuest } = useAuth();
  const { t } = useTranslation();
  const setup = useSetup();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<BottomTabNavigationProp<AppTabsParamList>>();
  const { horizontal, scrollBottom } = useResponsiveLayout();
  const step = normalizeStep(state.step, isGuest);
  const Step = STEPS[step];
  const [action, setAction] = useState<WizardAction | null>(null);
  const guided = setup.active && !planHubOpen && setup.progress?.step === step;
  const nextStep = adjacentSetupStep(step as SetupStep, isGuest, 1);
  const missingMedicine = guided && step === 1 && !state.meds.length && !state.symptomOnlyMode;
  const leave = () => { Keyboard.dismiss(); setup.pause(); navigation.navigate('Home'); };
  const goBack = () => {
    if (setup.busy || action?.loading) return;
    Keyboard.dismiss();
    if (!guided) openPlanHub();
    else if (step === setup.steps[0]) leave();
    else void setup.back();
  };
  useFocusEffect(React.useCallback(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (!guided) return false;
      goBack(); return true;
    });
    return () => subscription.remove();
  }, [guided, step, setup.progress, setup.busy, action?.loading]));
  const goNext = async () => {
    Keyboard.dismiss();
    if (nextStep === null) { if (await setup.finish()) navigation.navigate('Home'); }
    else await setup.advance();
  };
  const skipCheckin = () => Alert.alert(t(editingCheckin ? 'setup.keep_title' : 'setup.skip_title'), t(editingCheckin ? 'setup.keep_body' : 'setup.skip_body'), [
    { text: t('common.cancel'), style: 'cancel' },
    { text: t(editingCheckin ? 'setup.keep_saved' : 'setup.skip_checkin'), onPress: () => { void goNext(); } },
  ]);
  const railSteps = [...(isGuest ? [0] : []), 1, 2, 3, 4, 5, 6, 8];
  const railLabel = (k: number) => k === 0 ? t('refined.account_title') : t('step.' + k);
  const selectStep = (next: number) => {
    Keyboard.dismiss();
    if (next === step) return;
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (setup.pending) void setup.begin(next as SetupStep); else setStep(next);
  };
  // Results, Progress and Summary are views, not answers: they count as done once you have moved past them.
  const railState = (k: number) => {
    const base = stepStateOf(state, k, step, t);
    if (base === 'current' || base === 'locked' || ![3, 4, 6, 8].includes(k)) return base;
    return railSteps.indexOf(k) < railSteps.indexOf(step) ? 'done' : 'available';
  };
  const followingStep =railSteps[railSteps.indexOf(step) + 1];
  const railTop = useRef(0);
  const rowTop = useRef<Record<number, number>>({});
  const [headerAction, setHeaderAction] = useState<WizardAction | null>(null);
  const [range, setRange] = useState<{ value: ReviewRange; onChange: (value: ReviewRange) => void } | null>(null);
  const viewport = useRef<ViewInstance>(null);
  const [keyboardTop, setKeyboardTop] = useState<number | null>(Keyboard.metrics()?.screenY ?? null);
  const [keyboardOverlap, setKeyboardOverlap] = useState(0);
  const measureKeyboard = () => {
    if (Platform.OS !== 'android' || keyboardTop === null) { setKeyboardOverlap(0); return; }
    // Android may report y=0 relative to the SafeArea surface; include its top inset.
    viewport.current?.measureInWindow((_x, y, _width, height) => setKeyboardOverlap(Math.max(0, Math.max(y, insets.top) + height - keyboardTop)));
  };
  useEffect(() => {
    const shown = Keyboard.addListener('keyboardDidShow', event => setKeyboardTop(event.endCoordinates.screenY));
    const hidden = Keyboard.addListener('keyboardDidHide', () => setKeyboardTop(null));
    return () => { shown.remove(); hidden.remove(); };
  }, []);
  useEffect(measureKeyboard, [keyboardTop, insets.top]);
  const bodyRef = useRef<ScrollViewInstance | null>(null);
  const tracked = useRef<number | null>(null);
  useEffect(() => {
    if (guided) { bodyRef.current?.scrollTo({ y: 0, animated: false }); return; }
    const timer = setTimeout(() => bodyRef.current?.scrollTo({ y: Math.max(0, railTop.current + (rowTop.current[step] ?? 0) - 12), animated: true }), 380);
    return () => clearTimeout(timer);
  }, [step, guided, checkinSession]);
  useEffect(() => {
    if (tracked.current === step) return;
    tracked.current = step;
    track('wizard_step_viewed', { step, label: t('step.' + step) });
    if (step === 4) track('results_viewed');
    if (step === 8) track('wizard_completed');
  }, [step, t]);
  return <WizardDockContext.Provider value={setAction}><WizardHeaderContext.Provider value={setHeaderAction}><WizardRangeContext.Provider value={setRange}><SafeAreaView style={styles.safe} edges={['top','left','right']}><AmbientBackground /><View ref={viewport} collapsable={false} onLayout={measureKeyboard} style={{ flex: 1, paddingBottom: keyboardOverlap }}><KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={insets.top}>
    <FormScrollView ref={bodyRef} style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: 20, paddingHorizontal: horizontal, paddingBottom: scrollBottom, gap: 16 }}>
      {!guided ? <TopBar /> : null}
      {!guided ? <Text accessibilityRole="header" style={styles.title}>{t('parity.plan_title')}</Text> : null}
      {guided ? <Text style={styles.sub}>{t('setup.step_count', { current: setup.steps.indexOf(step as SetupStep) + 1, total: setup.steps.length })}</Text> : null}
      {guided ? <View style={styles.heading}><Pressable accessibilityRole="button" accessibilityLabel={t('setup.back')} disabled={setup.busy || !!action?.loading} onPress={goBack} style={styles.back}><View style={{ transform: [{ rotate: '180deg' }] }}><AppIcon name="chevron" size={18} color={colors.primary} /></View></Pressable><Text accessibilityRole="header" style={styles.title}>{t(step === 0 ? 'setup.about_you' : step === 5 && editingCheckin ? 'easy_use.edit_title' : `design.step.${step}.title`)}</Text>{[1, 2].includes(step) && headerAction ? <Pressable accessibilityRole="button" accessibilityLabel={headerAction.title} onPress={headerAction.onPress} style={{ width: 48, minHeight: 48, borderRadius: 14, backgroundColor: colors.primary50, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: colors.primary, fontSize: 27, lineHeight: 32 }}>+</Text></Pressable> : null}{step === 5 && (editingCheckin || hasUnfinishedCheckin(checkinDrafts.new)) && headerAction ? <Button title={headerAction.title} variant="ghost" compact style={{ maxWidth: '38%' }} onPress={headerAction.onPress} /> : null}</View> : null}
      {guided && (step === 6 || step === 8) && range ? <View style={{ alignSelf: 'flex-end' }}><ReviewRangeSelect compact {...range} /></View> : null}
      <SaveState />
      {saveStatus === 'unavailable' ? <Text style={styles.sub}>{t('tracking.load_body')}</Text> : !hydrated ? <Text style={styles.sub}>{t('journey.loading')}</Text> : guided ? <Step /> : <View onLayout={event => { railTop.current = event.nativeEvent.layout.y; }}>
        {railSteps.map((k, i) => <StepRow key={k} index={i + 1} title={railLabel(k)} state={railState(k)} value={stepSummary(state, k, t)} last={i === railSteps.length - 1} passed={i < railSteps.indexOf(step)}onPress={() => selectStep(k)} onRow={y => { rowTop.current[k] = y; }}>
          {k === step ? <>
            {k === 5 && (editingCheckin || hasUnfinishedCheckin(checkinDrafts.new)) && headerAction ? <Button title={headerAction.title} variant="ghost" compact onPress={headerAction.onPress} /> : null}
            {(k === 6 || k === 8) && range ? <View style={{ alignSelf: 'flex-end' }}><ReviewRangeSelect compact {...range} /></View> : null}
            <Step />
            {k !== 5 && followingStep !== undefined ? <Button title={t('setup.next', { screen: railLabel(followingStep) })} onPress={() => selectStep(followingStep)} /> : null}
          </> : null}
        </StepRow>)}
      </View>}
    </FormScrollView>
    {hydrated && saveStatus !== 'unavailable' && (guided || step === 5 && action) ? <View style={[styles.dock,{paddingHorizontal:horizontal}]}>
      {setup.error && guided ? <Text accessibilityRole="alert" style={styles.sub}>{t('setup.error')}</Text> : null}
      <Button title={guided && step !== 0 && step !== 5 ? nextStep === null ? t('setup.finish') : t('setup.next', { screen: t(`design.step.${nextStep}.title`) }) : action?.title || t('journey.loading')} onPress={guided && step !== 0 && step !== 5 ? () => { void goNext(); } : action?.onPress} loading={setup.busy || !!action?.loading} disabled={missingMedicine || (step === 0 || step === 5) && !action} />
      {guided && keyboardTop === null ? <Button title={t(step === 5 ? editingCheckin ? 'setup.keep_saved' : 'setup.skip_checkin' : 'setup.finish_later')} variant="ghost" disabled={setup.busy || !!action?.loading} onPress={step === 5 ? skipCheckin : leave} /> : null}
    </View> : null}
  </KeyboardAvoidingView></View></SafeAreaView></WizardRangeContext.Provider></WizardHeaderContext.Provider></WizardDockContext.Provider>;
};
const styles=StyleSheet.create({safe:{flex:1,backgroundColor:colors.background},heading:{flexDirection:'row',alignItems:'center',gap:12},back:{width:48,height:48,borderRadius:24,backgroundColor:colors.surface,borderWidth:1.5,borderColor:colors.border,alignItems:'center',justifyContent:'center'},title:{flex:1,fontSize:31,lineHeight:37,fontWeight:'700',letterSpacing:-.8,color:colors.pine},sub:{fontSize:17,lineHeight:22,color:colors.textMuted},dock:{backgroundColor:colors.background,paddingVertical:8}});
