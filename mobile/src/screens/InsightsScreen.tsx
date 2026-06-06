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
import {
  computeContraindications,
  computeDrugInteractions,
  computeInsightEngine,
  computeNutrientScores,
  detectHealthPatterns,
  recommendSupplements,
  tierFromScore,
  type AlertItem,
} from '@/wizard/engine';
import { STEP_LABELS } from '@/content/wizardData';
import { Loader } from '@/components/Loader';
import { colors, spacing } from '@/theme';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { AppTabsParamList } from '@/navigation/AppTabs';

type Props = BottomTabScreenProps<AppTabsParamList, 'Insights'>;

const RESULTS_STEP = STEP_LABELS.indexOf('Results');

// Map a card "priority" string to its badge colors.
const PRIORITY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  High: { bg: '#FEF2F2', text: '#DC2626', border: '#FCA5A5' },
  Moderate: { bg: '#FFFBEB', text: '#D97706', border: '#FCD34D' },
  Low: { bg: '#EFF6FF', text: '#2563EB', border: '#BFDBFE' },
  Info: { bg: '#EFF6FF', text: '#2563EB', border: '#BFDBFE' },
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

  // Real adherence summary still comes from logged check-ins (last 7).
  const checkins = useMemo(() => data?.checkins ?? [], [data]);
  const avgAdherence = useMemo(() => {
    if (checkins.length === 0) return null;
    const recent = checkins.slice(0, 7);
    const sum = recent.reduce((a, c) => a + (c.adherencePct ?? 0), 0);
    return Math.round(sum / recent.length);
  }, [checkins]);

  const hasInputs = wizState.meds.length > 0 || wizState.symptoms.selected.length > 0;

  const insight = useMemo(() => computeInsightEngine(wizState), [wizState]);
  const interactions = useMemo(() => computeDrugInteractions(wizState), [wizState]);
  const contraindications = useMemo(() => computeContraindications(wizState), [wizState]);
  const scores = useMemo(() => computeNutrientScores(wizState), [wizState]);
  const recs = useMemo(() => recommendSupplements(scores), [scores]);
  const patterns = useMemo(() => detectHealthPatterns(wizState), [wizState]);

  // Secondary cards: alerts first (safety), then top nutrient signals.
  const secondaryCards = useMemo<SecondaryCard[]>(() => {
    const cards: SecondaryCard[] = [];
    const alertCard = (a: AlertItem, icon: string): SecondaryCard => ({
      id: a.title,
      icon,
      title: a.title,
      body: `${a.note} ${a.action}`.trim(),
      priority: a.level,
      link: 'Discuss with your clinician',
    });
    interactions.forEach((a) => cards.push(alertCard(a, '⚠️')));
    contraindications.forEach((a) => cards.push(alertCard(a, '🛡️')));
    scores.slice(0, 3).forEach(([nut, sc]) => {
      const tier = tierFromScore(sc);
      const rec = recs.find((r) => r.nutrient === nut);
      cards.push({
        id: `nut-${nut}`,
        icon: '🌿',
        title: `${nut} signal`,
        body: rec
          ? `Estimated ${tier.toLowerCase()} support signal (${sc}%). Often supported with ${rec.supplement}.`
          : `Estimated ${tier.toLowerCase()} support signal (${sc}%) based on your medications and symptoms.`,
        priority: tier,
        link: 'View full results →',
      });
    });
    return cards;
  }, [interactions, contraindications, scores, recs]);

  const reviewCount = interactions.length + contraindications.length;

  const openResults = () => {
    if (RESULTS_STEP >= 0) setStep(RESULTS_STEP);
    navigation.navigate('Guided');
  };

  if ((loading && !data) || !hydrated) return <Loader />;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.pageTitle}>Your Insights</Text>
          {reviewCount > 0 && (
            <View style={styles.newBadge}>
              <Text style={styles.newBadgeText}>{reviewCount} to review</Text>
            </View>
          )}
        </View>

        {!hasInputs ? (
          /* EMPTY — no wizard inputs to analyze yet */
          <View style={styles.emptyFeatured}>
            <Text style={styles.emptyFeaturedTitle}>No insights yet</Text>
            <Text style={styles.emptyFeaturedSub}>
              Run the Guided setup to add your medications and symptoms. GeneoRx will then surface
              interactions, nutrient signals, and cautions personalized to you.
            </Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={openResults} activeOpacity={0.85}>
              <Text style={styles.emptyBtnText}>Start Guided setup →</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* FEATURED — engine summary */}
            <TouchableOpacity style={styles.featuredCard} activeOpacity={0.88} onPress={openResults}>
              <View style={styles.featuredCircle1} />
              <View style={styles.featuredCircle2} />
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
              <Text style={styles.featuredLink}>View full results & evidence →</Text>
            </TouchableOpacity>

            {/* DOCTOR PROMPT */}
            <View style={styles.doctorCard}>
              <Text style={styles.doctorLabel}>DISCUSS WITH YOUR DOCTOR</Text>
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

        {/* ADHERENCE SUMMARY */}
        <Text style={styles.sectionLabel}>ADHERENCE SUMMARY</Text>

        <View style={styles.adherenceCard}>
          <View style={styles.adherenceCircle}>
            <Text style={styles.adherencePct}>{avgAdherence !== null ? `${avgAdherence}%` : '—'}</Text>
          </View>
          <View style={styles.adherenceInfo}>
            <Text style={styles.adherenceTitle}>
              {avgAdherence === null
                ? 'Keep tracking your doses!'
                : avgAdherence >= 80
                  ? 'Great adherence this week!'
                  : 'Keep tracking your doses!'}
            </Text>
            <Text style={styles.adherenceSub}>
              {checkins.length > 0
                ? `Based on your last ${Math.min(checkins.length, 7)} check-in${Math.min(checkins.length, 7) !== 1 ? 's' : ''}`
                : 'Log check-ins to see your adherence'}
            </Text>
          </View>
        </View>

        <Text style={styles.legal}>Educational guidance only · not medical advice</Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#EDF2F0' },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: 40 },

  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 18,
  },
  pageTitle: { fontSize: 26, fontWeight: '800', color: colors.text, letterSpacing: -0.5 },
  newBadge: {
    paddingVertical: 5, paddingHorizontal: 12, borderRadius: 999,
    borderWidth: 1.2, borderColor: colors.primary, backgroundColor: colors.primary50,
  },
  newBadgeText: { fontSize: 12.5, fontWeight: '700', color: colors.primaryDark },

  /* FEATURED */
  featuredCard: {
    backgroundColor: '#0A4A38', borderRadius: 18,
    padding: 22, marginBottom: 14, overflow: 'hidden',
    shadowColor: '#0A4A38', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22, shadowRadius: 14, elevation: 8,
  },
  featuredCircle1: {
    position: 'absolute', right: -20, top: -20,
    width: 110, height: 110, borderRadius: 55,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  featuredCircle2: {
    position: 'absolute', right: 40, bottom: -30,
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  featuredTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  featuredTagPriority: {
    backgroundColor: 'rgba(255,255,255,0.16)',
    paddingVertical: 4, paddingHorizontal: 10, borderRadius: 999,
  },
  featuredTagPriorityText: { fontSize: 11.5, fontWeight: '700', color: '#FFFFFF' },
  featuredTagType: {
    backgroundColor: 'rgba(255,255,255,0.10)',
    paddingVertical: 4, paddingHorizontal: 10, borderRadius: 999,
  },
  featuredTagTypeText: { fontSize: 11.5, fontWeight: '600', color: 'rgba(255,255,255,0.82)' },
  featuredTitle: {
    fontSize: 19, fontWeight: '800', color: '#FFFFFF',
    letterSpacing: -0.3, lineHeight: 25, marginBottom: 10,
  },
  featuredBody: {
    fontSize: 14, color: 'rgba(255,255,255,0.76)', lineHeight: 21, marginBottom: 14,
  },
  featuredLink: { fontSize: 13.5, fontWeight: '700', color: 'rgba(255,255,255,0.62)' },

  /* DOCTOR PROMPT */
  doctorCard: {
    backgroundColor: colors.primary50, borderRadius: 14, padding: 16, marginBottom: 14,
    borderWidth: 1, borderColor: colors.primary100,
  },
  doctorLabel: { fontSize: 11, fontWeight: '800', color: colors.primary, letterSpacing: 0.8, marginBottom: 6 },
  doctorBody: { fontSize: 13.5, color: colors.textSoft, lineHeight: 20 },

  /* EMPTY FEATURED */
  emptyFeatured: {
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 24,
    alignItems: 'center', marginBottom: 14,
    borderWidth: 1, borderColor: colors.borderSoft,
  },
  emptyFeaturedTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 8 },
  emptyFeaturedSub: { fontSize: 13.5, color: colors.textMuted, textAlign: 'center', lineHeight: 20, marginBottom: 16 },
  emptyBtn: {
    backgroundColor: colors.primary, borderRadius: 12,
    paddingVertical: 12, paddingHorizontal: 20, alignItems: 'center',
  },
  emptyBtnText: { fontSize: 14.5, fontWeight: '700', color: '#FFFFFF' },

  /* SECONDARY CARDS */
  secCard: {
    backgroundColor: '#FFFFFF', borderRadius: 14,
    padding: 16, marginBottom: 10,
    shadowColor: '#0F1F1B', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
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
  secLink: { fontSize: 12.5, fontWeight: '700', color: colors.primaryDark, marginTop: 2 },

  /* ADHERENCE */
  sectionLabel: {
    fontSize: 11.5, fontWeight: '700', color: colors.textMuted,
    letterSpacing: 1, marginBottom: 10, marginTop: 8,
  },
  adherenceCard: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    backgroundColor: colors.primary50, borderRadius: 16, padding: 18,
    borderWidth: 1, borderColor: colors.primary100, marginBottom: 20,
    shadowColor: '#0F1F1B', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  adherenceCircle: {
    width: 68, height: 68, borderRadius: 34,
    borderWidth: 4.5, borderColor: colors.primary,
    alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF',
  },
  adherencePct: { fontSize: 16, fontWeight: '800', color: colors.primaryDark },
  adherenceInfo: { flex: 1 },
  adherenceTitle: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 4 },
  adherenceSub: { fontSize: 13, color: colors.textMuted },

  legal: { fontSize: 11.5, color: colors.textMuted, textAlign: 'center' },
});
