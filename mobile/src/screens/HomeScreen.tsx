import React, { useMemo, useState } from 'react';
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
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { useProfile } from '@/store/ProfileContext';
import { useAuth } from '@/auth/AuthContext';
import { useWizard } from '@/store/WizardContext';
import { useDailyDoses } from '@/store/useDailyDoses';
import {
  computeMedicationSuccessPrediction,
  computeNutrientScores,
  recommendSupplements,
} from '@/wizard/engine';
import { useTranslation } from '@/hooks/useTranslation';
import { STEP_LABELS } from '@/content/wizardData';
import { useMedCatalog, findMedName } from '@/store/MedCatalogContext';
import { Button } from '@/components/Button';
import { Loader } from '@/components/Loader';
import { ReportPickerModal } from '@/components/ReportPickerModal';
import { useToast } from '@/components/Toast';
import { shareClinicianSnapshot } from '@/wizard/reports';
import type { AppTabsParamList } from '@/navigation/AppTabs';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { colors, layout, portalCard, radius, spacing, touchMin } from '@/theme';

type Props = BottomTabScreenProps<AppTabsParamList, 'Home'>;

const RESULTS_STEP = STEP_LABELS.indexOf('Results');

const medSchedule = (
  dose: string,
  durationMonths: number,
  noDetails: string,
  monthLabel: string,
  monthsLabel: string,
): string => {
  const parts: string[] = [];
  if (dose) parts.push(dose);
  if (durationMonths) {
    parts.push(`${durationMonths} ${durationMonths > 1 ? monthsLabel : monthLabel}`);
  }
  return parts.length ? parts.join(' · ') : noDetails;
};

type QuickActionKey = 'Guided' | 'Treatments' | 'CheckIns' | 'Insights';

const QUICK_ACTION_KEYS: { key: QuickActionKey; labelKey: string; subKey: string }[] = [
  { key: 'Guided', labelKey: 'mobile.home.quick.guided', subKey: 'mobile.home.quick.guided_sub' },
  { key: 'Treatments', labelKey: 'mobile.home.quick.meds', subKey: 'mobile.home.quick.meds_sub' },
  { key: 'CheckIns', labelKey: 'mobile.home.quick.checkin', subKey: 'mobile.home.quick.checkin_sub' },
  { key: 'Insights', labelKey: 'mobile.home.quick.insights', subKey: 'mobile.home.quick.insights_sub' },
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

const MedIcon: React.FC = () => (
  <View style={styles.medIcon}>
    <View style={styles.medIconDot} />
  </View>
);

const CheckCircle: React.FC<{ checked: boolean }> = ({ checked }) => (
  <View style={[styles.check, checked && styles.checkDone]}>
    {checked && <Text style={styles.checkMark}>✓</Text>}
  </View>
);

export const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const { data, loading, refresh } = useProfile();
  const { user } = useAuth();
  const { state: wizState, hydrated: wizHydrated, setStep: setWizStep } = useWizard();
  const { catalog } = useMedCatalog();
  const { checked, toggle } = useDailyDoses();
  const { t, language } = useTranslation();
  const toast = useToast();
  const { page, scrollBottom, isCompact } = useResponsiveLayout();
  const [reportPickerOpen, setReportPickerOpen] = useState(false);

  const wizardResults = useMemo(() => {
    const hasInputs = wizState.meds.length > 0 || wizState.symptoms.selected.length > 0;
    if (!hasInputs) return null;
    const scores = computeNutrientScores(wizState);
    const recs = recommendSupplements(scores);
    const success = computeMedicationSuccessPrediction(wizState, t);
    return {
      planStarted: wizState.plan.started,
      topRecs: recs.slice(0, 3).map((r) => r.supplement),
      recCount: recs.length,
      success,
    };
  }, [wizState, language, t]);

  const openWizardResults = () => {
    setWizStep(RESULTS_STEP);
    navigation.navigate('Guided');
  };

  async function handleShare() {
    const ok = await shareClinicianSnapshot(wizState, t, { catalog, title: t('portal.share') });
    if (ok) toast.show(t('toast.shared'));
  }

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
    if (h < 12) return t('mobile.home.greeting_morning');
    if (h < 18) return t('mobile.home.greeting_afternoon');
    return t('mobile.home.greeting_evening');
  })();

  const quickActions = QUICK_ACTION_KEYS.map((a) => ({
    ...a,
    label: t(a.labelKey),
    sub: t(a.subKey),
  }));

  const startSteps = [
    { n: '1', t: t('mobile.home.step_meds') },
    { n: '2', t: t('mobile.home.step_symptoms') },
    { n: '3', t: t('mobile.home.step_results') },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: scrollBottom }]}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refresh} tintColor={colors.primary} />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.page, page]}>
          {/* Greeting */}
          <View style={styles.greetingCard}>
            <Text style={styles.heroGreeting}>{greeting}</Text>
            <Text style={styles.heroName} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.85}>
              {nameToShow}
            </Text>
            {firstRun ? (
              <Text style={styles.heroHint}>{t('mobile.home.welcome_hint')}</Text>
            ) : (
              <View style={styles.statsRow}>
                <View style={styles.stat}>
                  <Text style={styles.statNum}>{checkedCount}/{meds.length || '—'}</Text>
                  <Text style={styles.statLabel}>{t('mobile.home.todays_doses')}</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.stat}>
                  <Text style={styles.statNum}>{adherence !== null ? `${adherence}%` : '—'}</Text>
                  <Text style={styles.statLabel}>{t('mobile.home.weekly_adherence')}</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.stat}>
                  <Text style={styles.statNum}>{checkins.length}</Text>
                  <Text style={styles.statLabel}>{t('mobile.home.checkins')}</Text>
                </View>
              </View>
            )}
          </View>

          {/* Plan summary */}
          {wizHydrated && wizardResults ? (
            <View style={styles.block}>
              <Text style={styles.sectionLabel}>{t('mobile.home.your_plan')}</Text>
              <TouchableOpacity style={styles.planCard} activeOpacity={0.88} onPress={openWizardResults}>
                <View style={styles.planAccent} />
                <View style={styles.planBody}>
                  <Text style={styles.planKicker}>
                    {wizardResults.planStarted ? t('mobile.home.plan_active') : t('mobile.home.results_ready')}
                  </Text>
                  <Text style={styles.planTitle}>
                    {t('mobile.home.success_signal', {
                      score: wizardResults.success.score,
                      level: wizardResults.success.level,
                    })}
                  </Text>
                  {wizardResults.topRecs.length > 0 ? (
                    <Text style={styles.planBodyText}>
                      {t('mobile.home.top_support', { items: wizardResults.topRecs.join(', ') })}
                      {wizardResults.recCount > wizardResults.topRecs.length
                        ? ` ${t('mobile.home.more_recs', { count: wizardResults.recCount - wizardResults.topRecs.length })}`
                        : ''}
                    </Text>
                  ) : (
                    <Text style={styles.planBodyText}>{t('mobile.home.open_results')}</Text>
                  )}
                  <Text style={styles.planLink}>{t('mobile.home.view_results')}</Text>
                </View>
              </TouchableOpacity>
            </View>
          ) : null}

          {firstRun ? (
            <View style={styles.block}>
              <View style={styles.startCard}>
                <Text style={styles.startKicker}>{t('mobile.home.start_here')}</Text>
                <Text style={styles.startTitle}>{t('mobile.home.setup_title')}</Text>
                <Text style={styles.startBody}>{t('mobile.home.setup_body')}</Text>
                <View style={styles.startSteps}>
                  {startSteps.map((s) => (
                    <View key={s.n} style={styles.startStepRow}>
                      <View style={styles.startStepNum}>
                        <Text style={styles.startStepNumText}>{s.n}</Text>
                      </View>
                      <Text style={styles.startStepText}>{s.t}</Text>
                    </View>
                  ))}
                </View>
                <Button title={t('mobile.home.start_guided')} onPress={() => navigation.navigate('Guided')} />
                <Button
                  title={t('mobile.home.add_meds_manual')}
                  variant="ghost"
                  onPress={() => navigation.navigate('Treatments')}
                />
              </View>
            </View>
          ) : (
            <>
              <View style={styles.block}>
                <Text style={styles.sectionLabel}>{t('mobile.home.quick_actions')}</Text>
                <View style={styles.quickGrid}>
                  {quickActions.map((a) => (
                    <TouchableOpacity
                      key={a.key}
                      style={[styles.quickTile, isCompact && styles.quickTileFull]}
                      activeOpacity={0.85}
                      onPress={() => navigation.navigate(a.key)}
                    >
                      <View style={styles.quickIcon}>
                        <QuickIcon name={a.key} color={colors.primary} />
                      </View>
                      <Text style={styles.quickLabel}>{a.label}</Text>
                      <Text style={styles.quickSub}>{a.sub}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.block}>
                <Text style={styles.sectionLabel}>{t('mobile.home.todays_meds')}</Text>
                <View style={styles.card}>
                  {meds.length === 0 ? (
                    <TouchableOpacity
                      style={styles.emptyState}
                      onPress={() => navigation.navigate('Treatments')}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.emptyTitle}>{t('mobile.home.no_meds')}</Text>
                      <Text style={styles.emptySub}>{t('mobile.home.tap_add_meds')}</Text>
                    </TouchableOpacity>
                  ) : (
                    meds.map((med, i) => (
                      <React.Fragment key={`med-${i}`}>
                        <TouchableOpacity
                          style={styles.medRow}
                          onPress={() => toggle(med.medId)}
                          activeOpacity={0.7}
                        >
                          <MedIcon />
                          <View style={styles.medInfo}>
                            <Text style={styles.medName}>{findMedName(catalog, med.medId)}</Text>
                            <Text style={styles.medMeta}>
                              {medSchedule(
                                med.dose,
                                med.durationMonths,
                                t('mobile.home.no_dose_details'),
                                t('mobile.home.months'),
                                t('mobile.home.months_plural'),
                              )}
                            </Text>
                          </View>
                          <CheckCircle checked={!!checked[med.medId]} />
                        </TouchableOpacity>
                        {i < meds.length - 1 ? <View style={styles.divider} /> : null}
                      </React.Fragment>
                    ))
                  )}
                </View>
              </View>

              {checkins.length > 0 ? (
                <View style={styles.block}>
                  <Text style={styles.sectionLabel}>{t('mobile.home.latest_insight')}</Text>
                  <TouchableOpacity
                    style={styles.insightCard}
                    activeOpacity={0.88}
                    onPress={() => navigation.navigate('Insights')}
                  >
                    <View style={styles.insightTags}>
                      <View style={styles.tag}>
                        <Text style={styles.tagText}>
                          {lastCheckin?.notes ? t('mobile.home.your_note') : t('mobile.home.latest_checkin')}
                        </Text>
                      </View>
                      {meds[0] ? (
                        <View style={[styles.tag, styles.tagMuted]}>
                          <Text style={[styles.tagText, styles.tagTextMuted]}>
                            {findMedName(catalog, meds[0].medId)}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                    <Text style={styles.insightTitle}>
                      {lastCheckin?.notes ? lastCheckin.notes : t('mobile.home.review_patterns')}
                    </Text>
                    <Text style={styles.insightBody}>
                      {adherence !== null
                        ? t('mobile.home.adherence_insight', { pct: adherence })
                        : t('mobile.home.log_more')}
                    </Text>
                    <Text style={styles.insightLink}>{t('mobile.home.view_insight')}</Text>
                  </TouchableOpacity>
                </View>
              ) : null}

              {meds.length > 0 && checkins.length === 0 ? (
                <TouchableOpacity
                  style={styles.nudge}
                  onPress={() => navigation.navigate('Guided')}
                  activeOpacity={0.85}
                >
                  <Text style={styles.nudgeTitle}>{t('mobile.home.nudge_title')}</Text>
                  <Text style={styles.nudgeBody}>{t('mobile.home.nudge_body')}</Text>
                </TouchableOpacity>
              ) : null}
            </>
          )}

          {wizHydrated && wizState.checkins.length > 0 ? (
            <View style={styles.shareRow}>
              <Button title={t('mobile.home.share')} variant="secondary" onPress={handleShare} style={styles.shareBtn} />
              <Button
                title={t('mobile.home.download_report')}
                variant="secondary"
                onPress={() => setReportPickerOpen(true)}
                style={styles.shareBtn}
              />
            </View>
          ) : null}

          <Text style={styles.legal}>{t('mobile.legal')}</Text>
        </View>
      </ScrollView>

      <ReportPickerModal visible={reportPickerOpen} onClose={() => setReportPickerOpen(false)} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { alignItems: 'center' },
  page: { width: '100%', maxWidth: layout.contentMaxWidth, paddingTop: spacing.md, gap: spacing.md },

  greetingCard: {
    ...portalCard,
    marginHorizontal: 0,
    padding: spacing.lg,
    gap: spacing.sm,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  heroGreeting: { fontSize: 15, color: colors.textMuted, fontWeight: '600' },
  heroName: { fontSize: 26, fontWeight: '800', color: colors.text, letterSpacing: -0.4 },
  heroHint: { fontSize: 16, color: colors.textSoft, lineHeight: 24, marginTop: 4 },

  statsRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm, paddingTop: spacing.sm },
  stat: { flex: 1, alignItems: 'center', gap: 4 },
  statNum: { fontSize: 22, fontWeight: '800', color: colors.primary },
  statLabel: { fontSize: 13, color: colors.textMuted, fontWeight: '600', textAlign: 'center' },
  statDivider: { width: 1, height: 36, backgroundColor: colors.borderSoft },

  block: { gap: spacing.sm },
  sectionLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textSoft,
    paddingHorizontal: 0,
  },

  planCard: {
    ...portalCard,
    marginHorizontal: 0,
    flexDirection: 'row',
    overflow: 'hidden',
    padding: 0,
  },
  planAccent: { width: 4, backgroundColor: colors.primary },
  planBody: { flex: 1, padding: spacing.lg, gap: 6 },
  planKicker: { fontSize: 12, fontWeight: '800', color: colors.primary, letterSpacing: 0.6 },
  planTitle: { fontSize: 18, fontWeight: '800', color: colors.text, lineHeight: 24 },
  planBodyText: { fontSize: 15, color: colors.textSoft, lineHeight: 22 },
  planLink: { fontSize: 14, fontWeight: '700', color: colors.primary, marginTop: 4 },

  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  quickTile: {
    ...portalCard,
    flexBasis: '47%',
    flexGrow: 1,
    padding: spacing.md,
    minHeight: touchMin + 36,
    gap: 4,
    minWidth: 0,
  },
  quickTileFull: { flexBasis: '100%' },
  quickIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.primary50,
    borderWidth: 1,
    borderColor: colors.primary100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  quickLabel: { fontSize: 16, fontWeight: '700', color: colors.text },
  quickSub: { fontSize: 13, color: colors.textMuted, lineHeight: 18 },

  card: { ...portalCard, marginHorizontal: 0, overflow: 'hidden', padding: 0 },

  medRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    gap: 12,
    minHeight: touchMin,
  },
  medIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.primary50,
    borderWidth: 1,
    borderColor: colors.primary100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  medIconDot: { width: 14, height: 14, borderRadius: 7, backgroundColor: colors.primary },
  medInfo: { flex: 1 },
  medName: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 2 },
  medMeta: { fontSize: 14, color: colors.textMuted },
  divider: { height: 1, backgroundColor: colors.borderSoft, marginLeft: 72 },

  check: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.backgroundAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkDone: { backgroundColor: colors.primary50, borderColor: colors.primary },
  checkMark: { fontSize: 14, fontWeight: '800', color: colors.primary },

  emptyState: { padding: spacing.xl, alignItems: 'center', gap: 6 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  emptySub: { fontSize: 14, color: colors.primary, fontWeight: '600' },

  insightCard: { ...portalCard, marginHorizontal: 0, padding: spacing.lg, gap: 8 },
  insightTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: {
    backgroundColor: colors.primary50,
    borderWidth: 1,
    borderColor: colors.primary100,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: radius.pill,
  },
  tagMuted: { backgroundColor: colors.ghostBg, borderColor: colors.borderSoft },
  tagText: { fontSize: 12, fontWeight: '700', color: colors.primary },
  tagTextMuted: { color: colors.textSoft },
  insightTitle: { fontSize: 18, fontWeight: '800', color: colors.text, lineHeight: 24 },
  insightBody: { fontSize: 15, color: colors.textSoft, lineHeight: 22 },
  insightLink: { fontSize: 14, fontWeight: '700', color: colors.primary, marginTop: 4 },

  startCard: { ...portalCard, marginHorizontal: 0, padding: spacing.lg, gap: spacing.sm },
  startKicker: { fontSize: 12, fontWeight: '800', color: colors.primary, letterSpacing: 0.6 },
  startTitle: { fontSize: 22, fontWeight: '800', color: colors.text, letterSpacing: -0.3 },
  startBody: { fontSize: 16, color: colors.textSoft, lineHeight: 24 },
  startSteps: { gap: 12, marginVertical: spacing.sm },
  startStepRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  startStepNum: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary50,
    borderWidth: 1,
    borderColor: colors.primary100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startStepNumText: { fontSize: 14, fontWeight: '800', color: colors.primary },
  startStepText: { flex: 1, fontSize: 15, fontWeight: '600', color: colors.text },

  nudge: {
    ...portalCard,
    marginHorizontal: 0,
    padding: spacing.lg,
    borderColor: colors.primary100,
    backgroundColor: colors.primary50,
    gap: 4,
  },
  nudgeTitle: { fontSize: 16, fontWeight: '800', color: colors.text },
  nudgeBody: { fontSize: 15, color: colors.textSoft, lineHeight: 22 },

  shareRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  shareBtn: { flex: 1, minWidth: 120 },

  legal: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 19,
    marginTop: spacing.md,
  },
});
