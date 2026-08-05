import React, { useMemo } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { AmbientBackground } from '@/components/AmbientBackground';
import { Button } from '@/components/Button';
import { useAuth } from '@/auth/AuthContext';
import { useWizard } from '@/store/WizardContext';
import { useMedCatalog } from '@/store/MedCatalogContext';
import {
  computeWeeklyCoachMessage,
  fmtDate,
  impactLabel,
  latestCheckin,
} from '@/wizard/engine';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { useTranslation } from '@/hooks/useTranslation';
import type { AppTabsParamList } from '@/navigation/AppTabs';
import { colors, portalCard, radius, spacing } from '@/theme';

type Props = BottomTabScreenProps<AppTabsParamList, 'Home'>;

const RING_SIZE = 116;
const RING_STROKE = 10;

/** Adherence ring — SVG arc, same recipe as the website's score circle. */
const AdherenceRing: React.FC<{ pct: number }> = ({ pct }) => {
  const r = (RING_SIZE - RING_STROKE) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, pct));
  return (
    <View style={{ width: RING_SIZE, height: RING_SIZE }}>
      <Svg width={RING_SIZE} height={RING_SIZE}>
        <Circle
          cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={r}
          stroke="rgba(255, 255, 255, 0.08)" strokeWidth={RING_STROKE} fill="none"
        />
        <Circle
          cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={r}
          stroke={colors.primary} strokeWidth={RING_STROKE} fill="none"
          strokeLinecap="round"
          strokeDasharray={`${c}`}
          strokeDashoffset={c * (1 - clamped / 100)}
          transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`}
        />
      </Svg>
      <View style={styles.ringCenter} pointerEvents="none">
        <Text style={styles.ringPct}>{Math.round(clamped)}%</Text>
      </View>
    </View>
  );
};

const FlameIcon = ({ color }: { color: string }) => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 3c1 3-2 4.5-2 7a2 2 0 0 0 4 .5C15.5 12 17 13.5 17 16a5 5 0 0 1-10 0c0-4 3.5-6.5 5-13z"
      stroke={color} strokeWidth={1.8} strokeLinejoin="round"
    />
  </Svg>
);

/** Consecutive weeks (ending this week or last) with at least one check-in. */
export function weeklyCheckinStreak(dates: string[], now: Date = new Date()): number {
  if (!dates.length) return 0;
  const weekOf = (d: Date) => {
    const day = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const dow = (day.getDay() + 6) % 7; // Monday = 0
    day.setDate(day.getDate() - dow);
    return day.getTime();
  };
  const weeks = new Set(
    dates
      .map((iso) => new Date(iso))
      .filter((d) => !Number.isNaN(d.getTime()))
      .map((d) => weekOf(d)),
  );
  const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
  let cursor = weekOf(now);
  if (!weeks.has(cursor)) cursor -= WEEK_MS; // grace: streak alive if last week logged
  let streak = 0;
  while (weeks.has(cursor)) {
    streak += 1;
    cursor -= WEEK_MS;
  }
  return streak;
}

export const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const { user } = useAuth();
  const { state, setStep, syncing, refresh } = useWizard();
  const { catalog } = useMedCatalog();
  const { t } = useTranslation();
  const { page, scrollBottom } = useResponsiveLayout();

  const firstName = (user?.name || '').trim().split(/\s+/)[0] || t('mobile.profile.your_account');
  const last = latestCheckin(state);
  const coach = useMemo(
    () => computeWeeklyCoachMessage(state, t, catalog),
    [state, t, catalog],
  );
  const streak = useMemo(
    () => weeklyCheckinStreak(state.checkins.map((c) => c.dateISO)),
    [state.checkins],
  );

  const isEmpty = state.meds.length === 0 && state.checkins.length === 0;

  const goToStep = (step: number) => {
    setStep(step);
    navigation.navigate('Guided');
  };

  const lastSymptom = last?.symptoms?.items?.[0];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <AmbientBackground />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: scrollBottom }]}
        refreshControl={<RefreshControl refreshing={syncing} onRefresh={refresh} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={[page, styles.stack]}>
          {/* Greeting + streak */}
          <View style={styles.headRow}>
            <Text style={styles.greeting}>{t('home.greeting', { name: firstName })}</Text>
            {streak >= 2 ? (
              <View style={styles.streak}>
                <FlameIcon color={colors.amber} />
                <Text style={styles.streakText}>{t('home.streak', { count: streak })}</Text>
              </View>
            ) : null}
          </View>

          {isEmpty ? (
            /* Empty state — first run, nothing tracked yet */
            <View style={[portalCard, styles.card, styles.emptyCard]}>
              <Text style={styles.emptyTitle}>{t('home.empty_title')}</Text>
              <Text style={styles.emptyBody}>{t('home.empty_body')}</Text>
              <Button title={t('home.empty_cta')} onPress={() => navigation.navigate('Guided')} />
            </View>
          ) : (
            <>
              {/* Adherence ring */}
              <View style={styles.ringWrap}>
                <AdherenceRing pct={last?.adherencePct ?? 0} />
                <Text style={styles.ringLabel}>
                  {last ? t('home.adherence_sub') : t('home.no_checkin_yet')}
                </Text>
              </View>

              {/* Today's insight */}
              <View style={styles.insightCard}>
                <Text style={styles.insightTag}>{t('home.insight_label')}</Text>
                <Text style={styles.insightBody}>{coach.headline}</Text>
                {coach.nextBestAction ? (
                  <Text style={styles.insightNext}>{coach.nextBestAction}</Text>
                ) : null}
                <Pressable style={styles.insightCta} onPress={() => goToStep(4)}>
                  <Text style={styles.insightCtaText}>{t('home.insight_cta')} →</Text>
                </Pressable>
              </View>

              {/* Last check-in row */}
              {last ? (
                <Pressable style={styles.checkinRow} onPress={() => goToStep(6)}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.checkinLabel}>
                      {t('home.last_checkin')} · {fmtDate(last.dateISO)}
                    </Text>
                    {lastSymptom ? (
                      <Text style={styles.checkinDetail}>
                        {lastSymptom.symptom}: {impactLabel(lastSymptom.change, t)}
                      </Text>
                    ) : null}
                  </View>
                  <Text style={styles.chevron}>›</Text>
                </Pressable>
              ) : (
                <Button title={t('home.first_checkin_cta')} variant="secondary" onPress={() => goToStep(5)} />
              )}
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { paddingTop: spacing.md },
  stack: { gap: spacing.sm },

  headRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  greeting: { fontSize: 22, fontWeight: '800', color: colors.text, letterSpacing: -0.5 },
  streak: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(251, 191, 36, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.30)',
  },
  streakText: { fontSize: 12, fontWeight: '700', color: colors.amber },

  ringWrap: { alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  ringCenter: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  ringPct: { fontSize: 26, fontWeight: '900', color: colors.text },
  ringLabel: { fontSize: 13, color: colors.textMuted },

  card: { padding: spacing.lg, gap: spacing.sm },

  insightCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(40, 225, 255, 0.22)',
    backgroundColor: colors.primary50,
    padding: spacing.md,
    gap: 6,
    marginBottom: spacing.sm,
  },
  insightTag: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: colors.primary,
  },
  insightBody: { fontSize: 15, color: colors.text, lineHeight: 22 },
  insightNext: { fontSize: 13, color: colors.textSoft, lineHeight: 19 },
  insightCta: {
    alignSelf: 'flex-start',
    marginTop: 4,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
  },
  insightCtaText: { fontSize: 13, fontWeight: '800', color: colors.onPrimary },

  checkinRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radius.button,
    backgroundColor: 'rgba(15, 23, 54, 0.50)',
    borderWidth: 1,
    borderColor: colors.borderSoft,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
  },
  checkinLabel: { fontSize: 13, fontWeight: '700', color: colors.textSoft },
  checkinDetail: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  chevron: { fontSize: 20, color: colors.textDim, fontWeight: '700' },

  emptyCard: { alignItems: 'stretch', gap: spacing.md },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: colors.text, letterSpacing: -0.2 },
  emptyBody: { fontSize: 15, color: colors.textSoft, lineHeight: 22 },
});
