import React, { useMemo } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useProfile } from '@/store/ProfileContext';
import { useWizard } from '@/store/WizardContext';
import { useMedCatalog } from '@/store/MedCatalogContext';
import {
  buildRoutineFromSupplements,
  computeContraindications,
  computeDrugInteractions,
  computeInsightEngine,
  computeNutrientScores,
  detectHealthPatterns,
  latestCheckin,
  recommendSupplements,
  successLabel,
  tierFromScore,
  type AlertItem,
} from '@/wizard/engine';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { useTranslation } from '@/hooks/useTranslation';
import { STEP_LABELS } from '@/content/wizardData';
import { AmbientBackground } from '@/components/AmbientBackground';
import { Button } from '@/components/Button';
import { Loader } from '@/components/Loader';
import { colors, portalCard, radius, spacing } from '@/theme';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { AppTabsParamList } from '@/navigation/AppTabs';

type Props = BottomTabScreenProps<AppTabsParamList, 'Insights'>;

const RESULTS_STEP = STEP_LABELS.indexOf('Results');

// Map a card "priority" string to its badge colors.
const PRIORITY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  High: { bg: colors.dangerBg, text: colors.danger, border: 'rgba(251, 113, 133, 0.35)' },
  Moderate: { bg: colors.warningBg, text: colors.warning, border: 'rgba(251, 191, 36, 0.35)' },
  Low: { bg: colors.successBg, text: colors.success, border: 'rgba(52, 211, 153, 0.35)' },
  Info: { bg: colors.primary50, text: colors.primary, border: 'rgba(58, 207, 235, 0.35)' },
};

interface SecondaryCard {
  id: string;
  icon: string;
  title: string;
  body: string;
  priority: string;
  link: string;
}

export const InsightsScreen: React.FC<Props> = ({ navigation }) => {
  const { data, loading } = useProfile();
  const { state: wizState, hydrated, setStep } = useWizard();
  const { catalog } = useMedCatalog();
  const { t, language } = useTranslation();
  const { page, scrollBottom } = useResponsiveLayout();

  // Real adherence summary still comes from logged check-ins (last 7).
  const checkins = useMemo(() => data?.checkins ?? [], [data]);
  const avgAdherence = useMemo(() => {
    if (checkins.length === 0) return null;
    const recent = checkins.slice(0, 7);
    const sum = recent.reduce((a, c) => a + (c.adherencePct ?? 0), 0);
    return Math.round(sum / recent.length);
  }, [checkins]);

  const hasInputs = wizState.meds.length > 0 || wizState.symptoms.selected.length > 0;

  const insight = useMemo(() => computeInsightEngine(wizState, t, catalog), [wizState, language, t, catalog]);
  const interactions = useMemo(() => computeDrugInteractions(wizState, t), [wizState, language, t]);
  const contraindications = useMemo(() => computeContraindications(wizState, t), [wizState, language, t]);
  const scores = useMemo(() => computeNutrientScores(wizState, catalog), [wizState, catalog]);
  const recs = useMemo(() => recommendSupplements(scores), [scores]);
  const patterns = useMemo(() => detectHealthPatterns(wizState, t), [wizState, language, t]);

  // Secondary cards: alerts first (safety), then top nutrient signals.
  const secondaryCards = useMemo<SecondaryCard[]>(() => {
    const cards: SecondaryCard[] = [];
    const alertCard = (a: AlertItem, icon: string): SecondaryCard => ({
      id: a.title,
      icon,
      title: a.title,
      body: `${a.note} ${a.action}`.trim(),
      priority: a.level,
      link: t('mobile.insights.discuss'),
    });
    interactions.forEach((a) => cards.push(alertCard(a, '⚠️')));
    contraindications.forEach((a) => cards.push(alertCard(a, '🛡️')));
    scores.slice(0, 3).forEach(([nut, sc]) => {
      const tier = tierFromScore(sc);
      const rec = recs.find((r) => r.nutrient === nut);
      cards.push({
        id: `nut-${nut}`,
        icon: '🌿',
        title: t('mobile.insights.nutrient_signal', { nutrient: nut }),
        body: rec
          ? t('mobile.insights.nutrient_body_rec', { tier: tier.toLowerCase(), pct: sc, supplement: rec.supplement })
          : t('mobile.insights.nutrient_body', { tier: tier.toLowerCase(), pct: sc }),
        priority: tier,
        link: t('mobile.insights.view_results'),
      });
    });
    return cards;
  }, [interactions, contraindications, scores, recs, t]);

  const reviewCount = interactions.length + contraindications.length;

  // Progress trends — wellbeing change vs baseline + last check-in (mirrors ProgressStep).
  const lastCheckin = useMemo(() => latestCheckin(wizState), [wizState]);
  const base = wizState.wellbeingBaseline;
  const deltas = lastCheckin
    ? {
        energy: lastCheckin.wellbeing.energy - base.energy,
        mood: lastCheckin.wellbeing.mood - base.mood,
        sleep: lastCheckin.wellbeing.sleep - base.sleep,
        focus: lastCheckin.wellbeing.focus - base.focus,
      }
    : null;
  const improvementScore = lastCheckin
    ? (lastCheckin.symptoms.items || []).reduce((acc, x) => acc + (x.changeScore || 0), 0)
    : 0;

  // Plan — recommended supplements + daily routine (mirrors ResultsStep sourcing).
  const planSupps = useMemo(
    () =>
      wizState.plan.recommendedSupplements.length
        ? wizState.plan.recommendedSupplements
        : recs.map((r) => r.supplement),
    [wizState.plan.recommendedSupplements, recs],
  );
  const routine = useMemo(() => buildRoutineFromSupplements(planSupps), [planSupps]);
  const hasRoutine = routine.morning.length > 0 || routine.midday.length > 0 || routine.night.length > 0;

  const openResults = () => {
    if (RESULTS_STEP >= 0) setStep(RESULTS_STEP);
    navigation.navigate('Guided');
  };

  if ((loading && !data) || !hydrated) return <Loader />;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <AmbientBackground />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: scrollBottom }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={page}>
        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.pageTitle} numberOfLines={2}>{t('mobile.insights.title')}</Text>
          {reviewCount > 0 && (
            <View style={styles.newBadge}>
              <Text style={styles.newBadgeText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
                {t('mobile.insights.to_review', { count: reviewCount })}
              </Text>
            </View>
          )}
        </View>

        {!hasInputs ? (
          /* EMPTY — no wizard inputs to analyze yet */
          <View style={styles.emptyFeatured}>
            <Text style={styles.emptyFeaturedTitle}>{t('mobile.insights.empty_title')}</Text>
            <Text style={styles.emptyFeaturedSub}>{t('mobile.insights.empty_sub')}</Text>
            <Button title={t('mobile.insights.start_guided')} onPress={openResults} />
          </View>
        ) : (
          <>
            {/* FEATURED — engine summary */}
            <TouchableOpacity style={styles.featuredCard} activeOpacity={0.88} onPress={openResults}>
              <View style={styles.featuredTags}>
                <View style={styles.featuredTagPriority}>
                  <Text style={styles.featuredTagPriorityText}>
                    ⚡ {insight.prediction.score}% success · {insight.prediction.level}
                  </Text>
                </View>
                {patterns.length > 0 && (
                  <View style={styles.featuredTagType}>
                    <Text style={styles.featuredTagTypeText}>{patterns[0].title}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.featuredTitle}>{insight.summary}</Text>
              <Text style={styles.featuredBody}>{insight.meaning}</Text>
              <Text style={styles.featuredLink}>{t('mobile.insights.view_results')}</Text>
            </TouchableOpacity>

            {/* DOCTOR PROMPT */}
            <View style={styles.doctorCard}>
              <Text style={styles.doctorLabel}>{t('mobile.insights.doctor_label')}</Text>
              <Text style={styles.doctorBody}>{insight.doctorPrompt}</Text>
            </View>

            {/* SECONDARY INSIGHTS */}
            {secondaryCards.map((ins) => {
              const pCol = PRIORITY_COLORS[ins.priority] ?? PRIORITY_COLORS.Info;
              return (
                <TouchableOpacity key={ins.id} style={styles.secCard} activeOpacity={0.8} onPress={openResults}>
                  <View style={styles.secRow}>
                    <View style={styles.secIconWrap}>
                      <Text style={styles.secIcon}>{ins.icon}</Text>
                    </View>
                    <View style={styles.secMeta}>
                      <View style={styles.secTitleRow}>
                        <Text style={styles.secTitle}>{ins.title}</Text>
                        <View style={[styles.secBadge, { backgroundColor: pCol.bg, borderColor: pCol.border }]}>
                          <Text style={[styles.secBadgeText, { color: pCol.text }]}>{ins.priority}</Text>
                        </View>
                      </View>
                      <Text style={styles.secBody}>{ins.body}</Text>
                      <Text style={styles.secLink}>{ins.link}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </>
        )}

        {/* PROGRESS TRENDS — wellbeing change vs baseline */}
        {deltas && (
          <>
            <Text style={styles.sectionLabel}>{t('progress.what_changed')}</Text>
            <View style={styles.trendsCard}>
              <View style={styles.deltaGrid}>
                {(['energy', 'mood', 'sleep', 'focus'] as const).map((k) => {
                  const v = deltas[k];
                  const c = v > 0 ? colors.success : v < 0 ? colors.danger : colors.textMuted;
                  return (
                    <View key={k} style={styles.deltaCell}>
                      <Text style={styles.deltaLabel}>{t(`wellbeing.${k}`).replace(/\s*\([^)]*\)\s*$/, '')}</Text>
                      <Text style={[styles.deltaVal, { color: c }]}>{v >= 0 ? `+${v}` : v}</Text>
                    </View>
                  );
                })}
              </View>
              <View style={styles.trendScoreRow}>
                <Text style={styles.trendScoreLabel}>{t('progress.symptom_score')}</Text>
                <Text style={styles.trendScoreVal}>
                  {improvementScore >= 0 ? `+${improvementScore}` : improvementScore}
                </Text>
              </View>
            </View>
          </>
        )}

        {/* ADHERENCE SUMMARY */}
        <Text style={styles.sectionLabel}>{t('mobile.insights.adherence_label')}</Text>

        <View style={styles.adherenceCard}>
          <View style={styles.adherenceCircle}>
            <Text style={styles.adherencePct}>{avgAdherence !== null ? `${avgAdherence}%` : '—'}</Text>
          </View>
          <View style={styles.adherenceInfo}>
            <Text style={styles.adherenceTitle}>
              {avgAdherence === null || avgAdherence < 80
                ? t('mobile.insights.adherence_track')
                : t('mobile.insights.adherence_great')}
            </Text>
            <Text style={styles.adherenceSub}>
              {checkins.length > 0
                ? (() => {
                    const n = Math.min(checkins.length, 7);
                    return n === 1
                      ? t('mobile.insights.adherence_based_one', { count: n })
                      : t('mobile.insights.adherence_based_many', { count: n });
                  })()
                : t('mobile.insights.adherence_log')}
            </Text>
          </View>
        </View>

        {/* PLAN — recommended supplements + daily routine */}
        {planSupps.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>{t('results.supplements_title')}</Text>
            <View style={styles.planCard}>
              <View style={styles.suppWrap}>
                {planSupps.map((s) => (
                  <View key={s} style={styles.suppPill}>
                    <Text style={styles.suppPillText}>{s}</Text>
                  </View>
                ))}
              </View>

              {hasRoutine && (
                <View style={styles.routineWrap}>
                  {(['morning', 'midday', 'night'] as const).map((slot) =>
                    routine[slot].length > 0 ? (
                      <View key={slot} style={styles.routineRow}>
                        <Text style={styles.routineSlot}>{t(`results.routine.${slot}`)}</Text>
                        <Text style={styles.routineItems}>{routine[slot].join(', ')}</Text>
                      </View>
                    ) : null,
                  )}
                </View>
              )}

              <Text style={styles.planDisclaimer}>{t('results.supplements_disclaimer')}</Text>
            </View>
          </>
        )}

        <Text style={styles.legal}>{t('mobile.legal')}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { alignItems: 'center', paddingTop: spacing.md },

  header: {
    flexDirection: 'row', alignItems: 'flex-start',
    justifyContent: 'space-between', marginBottom: 18, gap: 10,
  },
  pageTitle: { fontSize: 26, fontWeight: '800', color: colors.text, letterSpacing: -0.5, flex: 1, minWidth: 0 },
  newBadge: {
    paddingVertical: 5, paddingHorizontal: 12, borderRadius: 999,
    borderWidth: 1, borderColor: 'rgba(58, 207, 235, 0.45)',
    backgroundColor: 'rgba(58, 207, 235, 0.12)',
    flexShrink: 0,
    maxWidth: '46%',
  },
  newBadgeText: { fontSize: 12.5, fontWeight: '700', color: colors.primary },

  /* FEATURED */
  featuredCard: {
    ...portalCard,
    padding: spacing.lg,
    marginBottom: 14,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    gap: 8,
  },
  featuredTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  featuredTagPriority: {
    backgroundColor: colors.primary50,
    borderWidth: 1,
    borderColor: colors.primary100,
    paddingVertical: 4, paddingHorizontal: 10, borderRadius: 999,
  },
  featuredTagPriorityText: { fontSize: 12, fontWeight: '700', color: colors.primary },
  featuredTagType: {
    backgroundColor: colors.ghostBg,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    paddingVertical: 4, paddingHorizontal: 10, borderRadius: 999,
  },
  featuredTagTypeText: { fontSize: 12, fontWeight: '600', color: colors.textSoft },
  featuredTitle: {
    fontSize: 18, fontWeight: '800', color: colors.text,
    letterSpacing: -0.3, lineHeight: 24,
  },
  featuredBody: {
    fontSize: 15, color: colors.textSoft, lineHeight: 22,
  },
  featuredLink: { fontSize: 14, fontWeight: '700', color: colors.primary, marginTop: 4 },

  /* DOCTOR PROMPT */
  doctorCard: {
    ...portalCard,
    padding: 16, marginBottom: 14,
    borderColor: 'rgba(58, 207, 235, 0.25)',
    backgroundColor: colors.primary50,
  },
  doctorLabel: { fontSize: 11, fontWeight: '800', color: colors.primary, letterSpacing: 0.8, marginBottom: 6 },
  doctorBody: { fontSize: 13.5, color: colors.textSoft, lineHeight: 20 },

  /* EMPTY FEATURED */
  emptyFeatured: {
    ...portalCard,
    padding: 24,
    alignItems: 'center', marginBottom: 14,
  },
  emptyFeaturedTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 8 },
  emptyFeaturedSub: { fontSize: 13.5, color: colors.textMuted, textAlign: 'center', lineHeight: 20, marginBottom: 16 },

  /* SECONDARY CARDS */
  secCard: {
    ...portalCard,
    padding: 16, marginBottom: 10,
  },
  secRow: { flexDirection: 'row', gap: 12 },
  secIconWrap: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: colors.backgroundAlt,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  secIcon: { fontSize: 22 },
  secMeta: { flex: 1, gap: 4 },
  secTitleRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 },
  secTitle: { fontSize: 14.5, fontWeight: '700', color: colors.text, flex: 1 },
  secBadge: {
    paddingVertical: 3, paddingHorizontal: 9,
    borderRadius: 999, borderWidth: 1, flexShrink: 0,
  },
  secBadgeText: { fontSize: 11.5, fontWeight: '700' },
  secBody: { fontSize: 13, color: colors.textSoft, lineHeight: 19 },
  secLink: { fontSize: 12.5, fontWeight: '700', color: colors.primary, marginTop: 2 },

  /* ADHERENCE */
  sectionLabel: {
    fontSize: 11.5, fontWeight: '700', color: colors.textMuted,
    letterSpacing: 1, marginBottom: 10, marginTop: 8,
  },
  adherenceCard: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    ...portalCard,
    padding: 18, marginBottom: 20,
  },
  adherenceCircle: {
    width: 68, height: 68, borderRadius: 34,
    borderWidth: 4.5, borderColor: colors.primary,
    alignItems: 'center', justifyContent: 'center', backgroundColor: colors.backgroundAlt,
  },
  adherencePct: { fontSize: 16, fontWeight: '800', color: colors.primary },
  adherenceInfo: { flex: 1 },
  adherenceTitle: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 4 },
  adherenceSub: { fontSize: 13, color: colors.textMuted },

  /* TRENDS */
  trendsCard: { ...portalCard, padding: 16, marginBottom: 20, gap: 12 },
  deltaGrid: { flexDirection: 'row', gap: spacing.sm },
  deltaCell: {
    flex: 1, backgroundColor: colors.surfaceAlt, borderRadius: radius.md,
    paddingVertical: spacing.md, alignItems: 'center', gap: 2,
  },
  deltaLabel: { fontSize: 11, color: colors.textMuted, textTransform: 'capitalize' },
  deltaVal: { fontSize: 20, fontWeight: '800' },
  trendScoreRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  trendScoreLabel: { fontSize: 14, color: colors.textSoft },
  trendScoreVal: { fontSize: 15, fontWeight: '800', color: colors.primary },

  /* PLAN */
  planCard: { ...portalCard, padding: 16, marginBottom: 20, gap: 12 },
  suppWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  suppPill: {
    paddingVertical: 6, paddingHorizontal: 12, borderRadius: 999,
    backgroundColor: colors.primary50, borderWidth: 1, borderColor: colors.primary100,
  },
  suppPillText: { fontSize: 13, fontWeight: '700', color: colors.primary },
  routineWrap: { gap: 8, borderTopWidth: 1, borderTopColor: colors.borderSoft, paddingTop: 12 },
  routineRow: { flexDirection: 'row', gap: 10 },
  routineSlot: { fontSize: 13, fontWeight: '700', color: colors.textSoft, width: 76, textTransform: 'capitalize' },
  routineItems: { flex: 1, fontSize: 13, color: colors.text, lineHeight: 19 },
  planDisclaimer: { fontSize: 11.5, color: colors.textDim, lineHeight: 16 },

  legal: { fontSize: 11.5, color: colors.textMuted, textAlign: 'center' },
});
