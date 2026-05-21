import React from 'react';
import {
  Image,
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
import { Button } from '@/components/Button';
import { Loader } from '@/components/Loader';
import { colors, spacing, typography } from '@/theme';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { AppTabsParamList } from '@/navigation/AppTabs';

type Props = BottomTabScreenProps<AppTabsParamList, 'Home'>;

interface StatCardProps {
  label: string;
  value: number | string;
  onPress?: () => void;
  accent?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, onPress, accent }) => (
  <TouchableOpacity
    style={[styles.statCard, accent && styles.statCardAccent]}
    onPress={onPress}
    activeOpacity={onPress ? 0.75 : 1}
  >
    <Text style={[styles.statValue, accent && styles.statValueAccent]}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </TouchableOpacity>
);

export const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const { data, loading, refresh } = useProfile();
  const { user, isGuest } = useAuth();

  if (loading && !data) return <Loader />;

  const nameToShow   = data?.user?.name || user?.name || 'there';
  const initials     = nameToShow.charAt(0).toUpperCase();
  const medCount     = data?.medications?.length ?? 0;
  const symptomCount = data?.symptoms?.length ?? 0;
  const checkinCount = data?.checkins?.length ?? 0;
  const lastCheckin  = data?.checkins?.[0];
  const adherence    = lastCheckin?.adherencePct;

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  })();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refresh} tintColor={colors.primary} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER: BRAND + AVATAR */}
        <View style={styles.header}>
          <View style={styles.brandRow}>
            <Image
              source={require('../../assets/logo.png')}
              style={styles.brandLogo}
              resizeMode="contain"
            />
            <Text style={styles.brandName}>GeneoRx</Text>
          </View>
          <View style={[styles.planBadge, isGuest && styles.planBadgeGuest]}>
            <Text style={[styles.planBadgeText, isGuest && styles.planBadgeTextGuest]}>
              {isGuest ? 'Guest' : 'Free'}
            </Text>
          </View>
        </View>

        {/* HERO GREETING */}
        <View style={styles.hero}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.greetingLabel}>{greeting},</Text>
          <Text style={styles.greetingName}>
            {nameToShow}.
          </Text>
          <Text style={styles.greetingSub}>
            Here is your <Text style={styles.greetingItalic}>health snapshot</Text> for today.
          </Text>
        </View>

        {/* TODAY CARD */}
        <View style={styles.todayCard}>
          <View style={styles.todayHead}>
            <View>
              <Text style={styles.todayTag}>  Today</Text>
              <Text style={styles.todayTitle}>
                {lastCheckin ? 'Latest check-in' : 'No check-ins yet'}
              </Text>
            </View>
            {adherence !== undefined && adherence !== null && (
              <View style={styles.adherencePill}>
                <View style={styles.adherenceDot} />
                <Text style={styles.adherenceText}>{adherence}% adherence</Text>
              </View>
            )}
          </View>
          <Text style={styles.todayBody}>
            {lastCheckin
              ? `Recorded ${new Date(lastCheckin.dateISO).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}. Keep your streak going   log how you have been feeling this week.`
              : 'Start tracking your medications and symptoms to see meaningful patterns emerge over time.'}
          </Text>
          <Button
            title={lastCheckin ? 'Log another check-in' : 'Start your first check-in'}
            onPress={() => navigation.navigate('CheckIns')}
            style={{ marginTop: 6 }}
          />
        </View>

        {/* STATS */}
        <View style={styles.statsRow}>
          <StatCard
            label="Medications"
            value={medCount}
            accent
            onPress={() => navigation.navigate('Treatments')}
          />
          <StatCard
            label="Symptoms"
            value={symptomCount}
            onPress={() => navigation.navigate('Treatments')}
          />
          <StatCard
            label="Check-ins"
            value={checkinCount}
            onPress={() => navigation.navigate('CheckIns')}
          />
        </View>

        {/* TREATMENT PLAN */}
        <View style={styles.linkCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.linkCardTitle}>Treatment plan</Text>
            <Text style={styles.linkCardSub}>Review or update your medications and symptoms</Text>
          </View>
          <TouchableOpacity
            style={styles.linkCardArrow}
            onPress={() => navigation.navigate('Treatments')}
          >
            <Text style={styles.linkCardArrowText}>→</Text>
          </TouchableOpacity>
        </View>

        {/* FIRST-RUN PROMPT */}
        {checkinCount === 0 && (
          <View style={styles.prompt}>
            <Text style={styles.promptNum}>01</Text>
            <Text style={styles.promptTitle}>Get started with GeneoRx</Text>
            <Text style={styles.promptBody}>
              Add your medications and symptoms to get personalized insights connecting what you take to how you feel.
            </Text>
            <Button
              title="Set up your profile"
              variant="secondary"
              onPress={() => navigation.navigate('Treatments')}
              style={{ marginTop: 12 }}
            />
          </View>
        )}

        <Text style={styles.legal}>
          Educational guidance only   not medical advice.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },

  /* HEADER */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandLogo: { width: 28, height: 28 },
  brandName: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.2,
  },
  planBadge: {
    paddingVertical: 5,
    paddingHorizontal: 11,
    borderRadius: 6,
    backgroundColor: colors.primary50,
  },
  planBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primaryDark,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  planBadgeGuest: { backgroundColor: colors.surfaceAlt },
  planBadgeTextGuest: { color: colors.textMuted },

  /* HERO GREETING */
  hero: {
    paddingVertical: 12,
    marginBottom: 6,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primary50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
    borderWidth: 1.5,
    borderColor: colors.primary100,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  greetingLabel: {
    fontSize: 14,
    color: colors.textMuted,
    fontWeight: '500',
    marginBottom: 2,
  },
  greetingName: {
    fontSize: 30,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.8,
    lineHeight: 36,
    marginBottom: 10,
  },
  greetingSub: {
    fontSize: 15,
    color: colors.textSoft,
    lineHeight: 22,
  },
  greetingItalic: {
    fontStyle: 'italic',
    fontWeight: '400',
    color: colors.primaryDark,
  },

  /* TODAY CARD */
  todayCard: {
    backgroundColor: colors.background,
    borderRadius: 14,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    gap: 10,
    shadowColor: '#0F1F1B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  todayHead: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 4,
  },
  todayTag: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primaryDark,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  todayTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.3,
  },
  adherencePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: colors.successBg,
  },
  adherenceDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.success,
  },
  adherenceText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: colors.success,
  },
  todayBody: {
    fontSize: 14,
    color: colors.textSoft,
    lineHeight: 21,
  },

  /* STATS */
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 13,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    gap: 4,
  },
  statCardAccent: {
    backgroundColor: colors.primary50,
    borderColor: colors.primary100,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.5,
  },
  statValueAccent: { color: colors.primaryDark },
  statLabel: {
    fontSize: 11.5,
    color: colors.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },

  /* LINK CARD */
  linkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.background,
    borderRadius: 13,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  linkCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 2,
  },
  linkCardSub: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 18,
  },
  linkCardArrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkCardArrowText: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.primaryDark,
  },

  /* PROMPT */
  prompt: {
    backgroundColor: colors.text,
    borderRadius: 16,
    padding: spacing.lg,
  },
  promptNum: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primaryLight,
    fontStyle: 'italic',
    marginBottom: 10,
  },
  promptTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  promptBody: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.75)',
    lineHeight: 21,
  },

  legal: {
    fontSize: 11.5,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 6,
  },
});
