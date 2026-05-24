import React, { useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useProfile } from '@/store/ProfileContext';
import { useAuth } from '@/auth/AuthContext';
import { Loader } from '@/components/Loader';
import { colors, spacing } from '@/theme';
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

const MED_TIMES = ['Morning', 'Morning', 'Lunch', 'Evening'];

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
  const [checkedMeds, setCheckedMeds] = useState<Record<number, boolean>>({});

  if (loading && !data) return <Loader />;

  const nameToShow = data?.user?.name || user?.name || 'there';
  const meds = data?.medications ?? [];
  const checkins = data?.checkins ?? [];
  const lastCheckin = checkins[0];
  const adherence = lastCheckin?.adherencePct ?? null;
  const checkedCount = Object.values(checkedMeds).filter(Boolean).length;

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning,';
    if (h < 18) return 'Good afternoon,';
    return 'Good evening,';
  })();

  const toggleMed = (i: number) =>
    setCheckedMeds((prev) => ({ ...prev, [i]: !prev[i] }));

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
          <Text style={styles.heroGreeting}>{greeting}</Text>
          <Text style={styles.heroName}>{nameToShow} 👋</Text>
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
                <TouchableOpacity style={styles.medRow} onPress={() => toggleMed(i)} activeOpacity={0.7}>
                  <MedIcon index={i} />
                  <View style={styles.medInfo}>
                    <Text style={styles.medName}>{med.medId}</Text>
                    <Text style={styles.medMeta}>
                      {med.dose ? `${med.dose} · ` : ''}{MED_TIMES[i % MED_TIMES.length]}
                    </Text>
                  </View>
                  <CheckCircle checked={!!checkedMeds[i]} />
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
            <TouchableOpacity style={styles.insightCard} activeOpacity={0.88} onPress={() => navigation.navigate('Profile')}>
              <View style={styles.insightCircle1} />
              <View style={styles.insightCircle2} />
              <View style={styles.insightTags}>
                <View style={styles.tagSignal}><Text style={styles.tagSignalText}>⚡ New Signal</Text></View>
                {meds[0] && (
                  <View style={styles.tagMed}><Text style={styles.tagMedText}>{meds[0].medId.slice(0, 8)}</Text></View>
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

        {/* ── FIRST RUN ── */}
        {checkins.length === 0 && meds.length === 0 && (
          <View style={styles.promptCard}>
            <Text style={styles.promptNum}>01</Text>
            <Text style={styles.promptTitle}>Get started with GeneoRx</Text>
            <Text style={styles.promptBody}>
              Add your medications and log a check-in to start getting personalized insights.
            </Text>
            <TouchableOpacity style={styles.promptBtn} onPress={() => navigation.navigate('Treatments')} activeOpacity={0.8}>
              <Text style={styles.promptBtnText}>Set up your profile →</Text>
            </TouchableOpacity>
          </View>
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
  heroGreeting: { fontSize: 14, color: 'rgba(255,255,255,0.72)', fontWeight: '500', marginBottom: 3 },
  heroName: { fontSize: 28, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.5, marginBottom: 20 },
  heroStats: { flexDirection: 'row', alignItems: 'center' },
  heroStat: { flex: 1, alignItems: 'center' },
  heroStatNum: { fontSize: 22, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.4 },
  heroStatLabel: { fontSize: 11, color: 'rgba(255,255,255,0.62)', fontWeight: '500', marginTop: 4, textAlign: 'center' },
  heroStatDivider: { width: 1, height: 34, backgroundColor: 'rgba(255,255,255,0.18)' },

  /* SECTION */
  sectionRow: { paddingHorizontal: spacing.lg, marginTop: 22, marginBottom: 10 },
  sectionLabel: { fontSize: 11.5, fontWeight: '700', color: colors.textMuted, letterSpacing: 1 },

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
  medName: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 2 },
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

  /* PROMPT */
  promptCard: {
    backgroundColor: colors.text, marginHorizontal: spacing.lg,
    borderRadius: 16, padding: spacing.lg, marginTop: 4,
  },
  promptNum: {
    fontSize: 11, fontWeight: '800', color: colors.primaryLight,
    fontStyle: 'italic', marginBottom: 8, letterSpacing: 1,
  },
  promptTitle: { fontSize: 18, fontWeight: '800', color: '#FFFFFF', marginBottom: 8, letterSpacing: -0.3 },
  promptBody: { fontSize: 14, color: 'rgba(255,255,255,0.72)', lineHeight: 21, marginBottom: 16 },
  promptBtn: { backgroundColor: colors.primary, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  promptBtnText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },

  legal: { fontSize: 11.5, color: colors.textMuted, textAlign: 'center', marginTop: 24, paddingHorizontal: spacing.lg },
});
