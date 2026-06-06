import React, { useMemo } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Path, Polygon, Rect } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useProfile } from '@/store/ProfileContext';
import { useAuth } from '@/auth/AuthContext';
import { useWizard } from '@/store/WizardContext';
import { useDailyDoses } from '@/store/useDailyDoses';
import {
  computeMedicationSuccessPrediction,
  computeNutrientScores,
  recommendSupplements,
} from '@/wizard/engine';
import { MED_DB, STEP_LABELS } from '@/content/wizardData';
import { Loader } from '@/components/Loader';
import { colors, spacing } from '@/theme';

const RESULTS_STEP = STEP_LABELS.indexOf('Results');

const medName = (id: string): string => {
  const m = MED_DB.find((x) => x.id === id);
  return m ? m.name : id.replace(/^custom:/, '').replace(/-/g, ' ');
};

const medSchedule = (dose: string, durationMonths: number): string => {
  const parts: string[] = [];
  if (dose) parts.push(dose);
  if (durationMonths) parts.push(`${durationMonths} mo${durationMonths > 1 ? 's' : ''}`);
  return parts.length ? parts.join(' · ') : 'No dose details';
};
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { AppTabsParamList } from '@/navigation/AppTabs';

type Props = BottomTabScreenProps<AppTabsParamList, 'Home'>;

const MED_PALETTES = [
  { bg: '#FFF0EE', dot: '#FF6B5B' },
  { bg: '#EEF0FF', dot: '#6B7FFF' },
  { bg: '#F0FFF4', dot: '#4CAF7D' },
  { bg: '#FFF8EE', dot: '#FF9940' },
  { bg: '#F5EEFF', dot: '#9B6BFF' },
];

type QuickActionKey = 'Guided' | 'Treatments' | 'CheckIns' | 'Insights';
const QUICK_ACTIONS: {
  key: QuickActionKey;
  label: string;
  sub: string;
  bg: string;
  fg: string;
}[] = [
  { key: 'Guided', label: 'Guided setup', sub: 'Step-by-step plan', bg: '#ECF6F3', fg: '#0E7C66' },
  { key: 'Treatments', label: 'Medications', sub: 'View & add meds', bg: '#FFF0EE', fg: '#FF6B5B' },
  { key: 'CheckIns', label: 'Check-in', sub: 'Log how you feel', bg: '#EEF0FF', fg: '#6B7FFF' },
  { key: 'Insights', label: 'Insights', sub: 'Patterns & signals', bg: '#FFF8EE', fg: '#FF9940' },
];

const QuickIcon: React.FC<{ name: QuickActionKey; color: string }> = ({ name, color }) => {
  switch (name) {
    case 'Guided':
      return (
        <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
          <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth={1.8} />
          <Polygon points="15.5,8.5 11,11 8.5,15.5 13,13" stroke={color} strokeWidth={1.6} fill="none" strokeLinejoin="round" />
        </Svg>
      );
    case 'Treatments':
      return (
        <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
          <Path d="M10.5 3.5a4 4 0 0 1 5.657 5.657L7.5 17.814A4 4 0 0 1 1.843 12.157L10.5 3.5z" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M6 12l6-6" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
        </Svg>
      );
    case 'CheckIns':
      return (
        <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
          <Rect x="3" y="3" width="18" height="18" rx="4" stroke={color} strokeWidth={1.8} />
          <Path d="M7.5 12l3 3 6-6" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'Insights':
      return (
        <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
          <Path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
  }
};

const MedIcon: React.FC<{ index: number }> = ({ index }) => {
  const p = MED_PALETTES[index % MED_PALETTES.length];
  return (
    <View style={[styles.medIcon, { backgroundColor: p.bg }]}>
      <View style={[styles.medIconDot, { backgroundColor: p.dot }]} />
    </View>
  );
};

const CheckCircle: React.FC<{ checked: boolean }> = ({ checked }) => (
  <View style={[styles.check, checked && styles.checkDone]}>
    {checked && <Text style={styles.checkMark}>✓</Text>}
  </View>
);

export const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const { data, loading, refresh } = useProfile();
  const { user } = useAuth();
  const { state: wizState, hydrated: wizHydrated, setStep: setWizStep } = useWizard();
  const { checked, toggle } = useDailyDoses();

  const wizardResults = useMemo(() => {
    const hasInputs = wizState.meds.length > 0 || wizState.symptoms.selected.length > 0;
    if (!hasInputs) return null;
    const scores = computeNutrientScores(wizState);
    const recs = recommendSupplements(scores);
    const success = computeMedicationSuccessPrediction(wizState);
    return {
      planStarted: wizState.plan.started,
      topRecs: recs.slice(0, 3).map((r) => r.supplement),
      recCount: recs.length,
      success,
    };
  }, [wizState]);

  const openWizardResults = () => {
    setWizStep(RESULTS_STEP);
    navigation.navigate('Guided');
  };


  if (loading && !data) return <Loader />;

  const nameToShow = data?.user?.name || user?.name || 'there';
  const meds = data?.medications ?? [];
  const checkins = data?.checkins ?? [];
  const lastCheckin = checkins[0];
  const adherence = lastCheckin?.adherencePct ?? null;
  const checkedCount = meds.filter((m) => checked[m.medId]).length;
  const firstRun = meds.length === 0 && checkins.length === 0;

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning,';
    if (h < 18) return 'Good afternoon,';
    return 'Good evening,';
  })();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refresh} tintColor="#FFFFFF" />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* ── HERO BANNER ── */}
        <View style={styles.hero}>
          <View style={styles.heroCircle1} />
          <View style={styles.heroCircle2} />
          <View style={styles.heroTopRow}>
            <View style={styles.heroIntro}>
              <Text style={styles.heroGreeting}>{greeting}</Text>
              <Text style={styles.heroName}>{nameToShow} 👋</Text>
            </View>
          </View>
          {firstRun ? (
            <Text style={styles.heroHint}>
              Welcome to GeneoRx. Let's set up your health profile — it only takes a minute.
            </Text>
          ) : (
            <View style={styles.heroStats}>
              <View style={styles.heroStat}>
                <Text style={styles.heroStatNum}>{checkedCount}/{meds.length || '—'}</Text>
                <Text style={styles.heroStatLabel}>Today's doses</Text>
              </View>
              <View style={styles.heroStatDivider} />
              <View style={styles.heroStat}>
                <Text style={styles.heroStatNum}>{adherence !== null ? `${adherence}%` : '—'}</Text>
                <Text style={styles.heroStatLabel}>Weekly adherence</Text>
              </View>
              <View style={styles.heroStatDivider} />
              <View style={styles.heroStat}>
                <Text style={styles.heroStatNum}>{checkins.length > 0 ? checkins.length : '0'}</Text>
                <Text style={styles.heroStatLabel}>Check-ins</Text>
              </View>
            </View>
          )}
        </View>

        {/* ── GUIDED RESULTS (surfaced from the wizard) ── */}
        {wizHydrated && wizardResults ? (
          <>
            <View style={styles.sectionRow}>
              <Text style={styles.sectionLabel}>YOUR GENEORX PLAN</Text>
            </View>
            <TouchableOpacity style={styles.resultsCard} activeOpacity={0.88} onPress={openWizardResults}>
              <View style={styles.resultsCircle} />
              <Text style={styles.resultsKicker}>
                {wizardResults.planStarted ? 'PLAN ACTIVE' : 'RESULTS READY'}
              </Text>
              <Text style={styles.resultsTitle}>
                {wizardResults.success.score}% success signal · {wizardResults.success.level}
              </Text>
              {wizardResults.topRecs.length > 0 ? (
                <Text style={styles.resultsBody}>
                  Top support: {wizardResults.topRecs.join(', ')}
                  {wizardResults.recCount > wizardResults.topRecs.length
                    ? ` +${wizardResults.recCount - wizardResults.topRecs.length} more`
                    : ''}
                </Text>
              ) : (
                <Text style={styles.resultsBody}>
                  Open your results to see nutrient signals, evidence, and a routine.
                </Text>
              )}
              <Text style={styles.resultsLink}>View full results →</Text>
            </TouchableOpacity>
          </>
        ) : null}

        {firstRun ? (
          /* ── FIRST RUN: one clear path ── */
          <View style={styles.startCard}>
            <Text style={styles.startKicker}>START HERE</Text>
            <Text style={styles.startTitle}>Set up your health profile</Text>
            <Text style={styles.startBody}>
              The Guided setup walks you through it step by step — then you'll get personalized,
              evidence-backed insights.
            </Text>

            <View style={styles.startSteps}>
              {[
                { n: '1', t: 'Add your medications' },
                { n: '2', t: 'Pick your symptoms' },
                { n: '3', t: 'See your results & plan' },
              ].map((s) => (
                <View key={s.n} style={styles.startStepRow}>
                  <View style={styles.startStepNum}><Text style={styles.startStepNumText}>{s.n}</Text></View>
                  <Text style={styles.startStepText}>{s.t}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity style={styles.startBtn} onPress={() => navigation.navigate('Guided')} activeOpacity={0.85}>
              <Text style={styles.startBtnText}>Start Guided setup →</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.startBtnGhost} onPress={() => navigation.navigate('Treatments')} activeOpacity={0.7}>
              <Text style={styles.startBtnGhostText}>Or add medications manually</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* ── QUICK ACTIONS ── */}
            <View style={styles.sectionRow}>
              <Text style={styles.sectionLabel}>QUICK ACTIONS</Text>
            </View>
            <View style={styles.quickGrid}>
              {QUICK_ACTIONS.map((a) => (
                <TouchableOpacity
                  key={a.key}
                  style={styles.quickTile}
                  activeOpacity={0.85}
                  onPress={() => navigation.navigate(a.key)}
                >
                  <View style={[styles.quickIcon, { backgroundColor: a.bg }]}>
                    <QuickIcon name={a.key} color={a.fg} />
                  </View>
                  <Text style={styles.quickLabel}>{a.label}</Text>
                  <Text style={styles.quickSub}>{a.sub}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* ── TODAY'S MEDICATIONS ── */}
            <View style={styles.sectionRow}>
              <Text style={styles.sectionLabel}>TODAY'S MEDICATIONS</Text>
            </View>

            <View style={styles.card}>
              {meds.length === 0 ? (
                <TouchableOpacity style={styles.emptyState} onPress={() => navigation.navigate('Treatments')} activeOpacity={0.7}>
                  <Text style={styles.emptyTitle}>No medications added yet</Text>
                  <Text style={styles.emptySub}>Tap to add your medications →</Text>
                </TouchableOpacity>
              ) : (
                meds.map((med, i) => (
                  <React.Fragment key={`med-${i}`}>
                    <TouchableOpacity style={styles.medRow} onPress={() => toggle(med.medId)} activeOpacity={0.7}>
                      <MedIcon index={i} />
                      <View style={styles.medInfo}>
                        <Text style={styles.medName}>{medName(med.medId)}</Text>
                        <Text style={styles.medMeta}>{medSchedule(med.dose, med.durationMonths)}</Text>
                      </View>
                      <CheckCircle checked={!!checked[med.medId]} />
                    </TouchableOpacity>
                    {i < meds.length - 1 && <View style={styles.divider} />}
                  </React.Fragment>
                ))
              )}
            </View>

            {/* ── LATEST INSIGHT ── */}
            {checkins.length > 0 && (
              <>
                <View style={styles.sectionRow}>
                  <Text style={styles.sectionLabel}>LATEST INSIGHT</Text>
                </View>
                <TouchableOpacity style={styles.insightCard} activeOpacity={0.88} onPress={() => navigation.navigate('Insights')}>
                  <View style={styles.insightCircle1} />
                  <View style={styles.insightCircle2} />
                  <View style={styles.insightTags}>
                    <View style={styles.tagSignal}>
                      <Text style={styles.tagSignalText}>{lastCheckin?.notes ? 'Your note' : 'Latest check-in'}</Text>
                    </View>
                    {meds[0] && (
                      <View style={styles.tagMed}><Text style={styles.tagMedText}>{medName(meds[0].medId)}</Text></View>
                    )}
                  </View>
                  <Text style={styles.insightTitle}>
                    {lastCheckin?.notes ? lastCheckin.notes : 'Review your health patterns'}
                  </Text>
                  <Text style={styles.insightBody}>
                    {adherence !== null
                      ? `Your last check-in shows ${adherence}% adherence. Keep tracking to uncover meaningful patterns.`
                      : 'Log more check-ins to get personalized insights connecting your medications and symptoms.'}
                  </Text>
                  <Text style={styles.insightLink}>View full insight →</Text>
                </TouchableOpacity>
              </>
            )}

            {/* Nudge: tracked meds but never checked in → point to Guided */}
            {meds.length > 0 && checkins.length === 0 && (
              <TouchableOpacity style={styles.nudge} onPress={() => navigation.navigate('Guided')} activeOpacity={0.85}>
                <Text style={styles.nudgeTitle}>Next: get your personalized insights</Text>
                <Text style={styles.nudgeBody}>Run the Guided setup to see nutrient signals, evidence, and a plan →</Text>
              </TouchableOpacity>
            )}
          </>
        )}

        <Text style={styles.legal}>Educational guidance only · not medical advice</Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#EDF2F0' },
  content: { paddingBottom: 32 },

  /* HERO */
  hero: {
    backgroundColor: '#0A4A38',
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    borderRadius: 20,
    padding: 22,
    paddingBottom: 24,
    overflow: 'hidden',
  },
  heroCircle1: {
    position: 'absolute', right: -30, top: -30,
    width: 130, height: 130, borderRadius: 65,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  heroCircle2: {
    position: 'absolute', right: 30, bottom: -40,
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  heroTopRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  heroIntro: { flex: 1 },
  heroGreeting: { fontSize: 14, color: 'rgba(255,255,255,0.72)', fontWeight: '500', marginBottom: 3 },
  heroName: { fontSize: 28, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.5, marginBottom: 20 },
  heroHint: { fontSize: 14.5, color: 'rgba(255,255,255,0.82)', fontWeight: '500', lineHeight: 21, marginBottom: 2 },
  heroStats: { flexDirection: 'row', alignItems: 'center' },
  heroStat: { flex: 1, alignItems: 'center' },
  heroStatNum: { fontSize: 22, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.4 },
  heroStatLabel: { fontSize: 11, color: 'rgba(255,255,255,0.62)', fontWeight: '500', marginTop: 4, textAlign: 'center' },
  heroStatDivider: { width: 1, height: 34, backgroundColor: 'rgba(255,255,255,0.18)' },

  /* SECTION */
  sectionRow: { paddingHorizontal: spacing.lg, marginTop: 22, marginBottom: 10 },
  sectionLabel: { fontSize: 11.5, fontWeight: '700', color: colors.textMuted, letterSpacing: 1 },

  /* QUICK ACTIONS */
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: spacing.lg, gap: 12 },
  quickTile: {
    flexBasis: '47%',
    flexGrow: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#0F1F1B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  quickIcon: {
    width: 44, height: 44, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', marginBottom: 10,
  },
  quickLabel: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 2 },
  quickSub: { fontSize: 12.5, color: colors.textMuted },

  /* CARD */
  card: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: spacing.lg,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#0F1F1B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },

  /* MED ROW */
  medRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14, gap: 12,
  },
  medIcon: {
    width: 44, height: 44, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  medIconDot: { width: 20, height: 20, borderRadius: 10 },
  medInfo: { flex: 1 },
  medName: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 2, textTransform: 'capitalize' },
  medMeta: { fontSize: 13, color: colors.textMuted },
  divider: { height: 1, backgroundColor: '#F2F5F4', marginLeft: 72 },

  /* CHECK */
  check: {
    width: 28, height: 28, borderRadius: 14,
    borderWidth: 1.5, borderColor: '#D5DDD9',
    backgroundColor: '#FAFAFA',
    alignItems: 'center', justifyContent: 'center',
  },
  checkDone: { backgroundColor: colors.primary50, borderColor: colors.primary },
  checkMark: { fontSize: 13, fontWeight: '700', color: colors.primary },

  /* EMPTY */
  emptyState: { padding: 28, alignItems: 'center' },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 5 },
  emptySub: { fontSize: 13, color: colors.primaryDark, fontWeight: '600' },

  /* INSIGHT CARD */
  insightCard: {
    backgroundColor: '#0A4A38',
    marginHorizontal: spacing.lg,
    borderRadius: 16,
    padding: 20,
    overflow: 'hidden',
    shadowColor: '#0A4A38',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 14,
    elevation: 8,
  },
  insightCircle1: {
    position: 'absolute', right: -20, top: -20,
    width: 110, height: 110, borderRadius: 55,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  insightCircle2: {
    position: 'absolute', right: 40, bottom: -30,
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  insightTags: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  tagSignal: {
    backgroundColor: 'rgba(255,255,255,0.16)', paddingVertical: 4,
    paddingHorizontal: 10, borderRadius: 999,
  },
  tagSignalText: { fontSize: 11.5, fontWeight: '700', color: '#FFFFFF' },
  tagMed: {
    backgroundColor: 'rgba(255,255,255,0.10)', paddingVertical: 4,
    paddingHorizontal: 10, borderRadius: 999,
  },
  tagMedText: { fontSize: 11.5, fontWeight: '600', color: 'rgba(255,255,255,0.82)' },
  insightTitle: {
    fontSize: 19, fontWeight: '800', color: '#FFFFFF',
    letterSpacing: -0.3, lineHeight: 24, marginBottom: 8,
  },
  insightBody: {
    fontSize: 14, color: 'rgba(255,255,255,0.75)', lineHeight: 21, marginBottom: 14,
  },
  insightLink: { fontSize: 13.5, fontWeight: '700', color: 'rgba(255,255,255,0.62)' },

  /* GUIDED RESULTS CARD */
  resultsCard: {
    backgroundColor: '#0A4A38',
    marginHorizontal: spacing.lg,
    borderRadius: 16,
    padding: 20,
    overflow: 'hidden',
    shadowColor: '#0A4A38',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 14,
    elevation: 8,
  },
  resultsCircle: {
    position: 'absolute', right: -24, top: -24,
    width: 110, height: 110, borderRadius: 55,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  resultsKicker: { fontSize: 11, fontWeight: '800', color: 'rgba(255,255,255,0.7)', letterSpacing: 1, marginBottom: 8 },
  resultsTitle: { fontSize: 19, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.3, lineHeight: 24, marginBottom: 8 },
  resultsBody: { fontSize: 14, color: 'rgba(255,255,255,0.78)', lineHeight: 21, marginBottom: 14 },
  resultsLink: { fontSize: 13.5, fontWeight: '700', color: 'rgba(255,255,255,0.7)' },

  /* START HERE (first run) */
  startCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: spacing.lg,
    marginTop: 18,
    borderRadius: 18,
    padding: spacing.lg,
    shadowColor: '#0F1F1B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  startKicker: { fontSize: 11, fontWeight: '800', color: colors.primary, letterSpacing: 1.2, marginBottom: 6 },
  startTitle: { fontSize: 21, fontWeight: '800', color: colors.text, letterSpacing: -0.4, marginBottom: 6 },
  startBody: { fontSize: 14, color: colors.textMuted, lineHeight: 21, marginBottom: 16 },
  startSteps: { gap: 12, marginBottom: 20 },
  startStepRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  startStepNum: {
    width: 26, height: 26, borderRadius: 13, backgroundColor: colors.primary50,
    alignItems: 'center', justifyContent: 'center',
  },
  startStepNumText: { fontSize: 13, fontWeight: '800', color: colors.primary },
  startStepText: { fontSize: 14.5, fontWeight: '600', color: colors.text },
  startBtn: { backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  startBtnText: { fontSize: 15, fontWeight: '800', color: '#FFFFFF' },
  startBtnGhost: { paddingVertical: 12, alignItems: 'center' },
  startBtnGhostText: { fontSize: 13.5, fontWeight: '700', color: colors.textMuted },

  /* NUDGE */
  nudge: {
    backgroundColor: colors.primary50,
    marginHorizontal: spacing.lg,
    marginTop: 18,
    borderRadius: 16,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.primary100,
  },
  nudgeTitle: { fontSize: 15.5, fontWeight: '800', color: colors.primaryDark, marginBottom: 4, letterSpacing: -0.2 },
  nudgeBody: { fontSize: 13.5, color: colors.primaryDark, lineHeight: 20, opacity: 0.85 },

  legal: { fontSize: 11.5, color: colors.textMuted, textAlign: 'center', marginTop: 24, paddingHorizontal: spacing.lg },
});
