import React, { useMemo, useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useProfile } from '@/store/ProfileContext';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Loader } from '@/components/Loader';
import { colors, spacing } from '@/theme';
import type { CheckIn } from '@/types/api';

export const CheckInsScreen: React.FC = () => {
  const { data, loading, refresh, save } = useProfile();
  const [adherence, setAdherence] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const checkins = useMemo<CheckIn[]>(() => data?.checkins ?? [], [data]);

  const avgAdherence = useMemo(() => {
    if (checkins.length === 0) return null;
    const sum = checkins.reduce((acc, c) => acc + (c.adherencePct ?? 0), 0);
    return Math.round(sum / checkins.length);
  }, [checkins]);

  const last7Count = useMemo(() => {
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return checkins.filter((c) => new Date(c.dateISO).getTime() >= cutoff).length;
  }, [checkins]);

  async function logCheckIn() {
    const pct = Number.parseInt(adherence, 10);
    if (Number.isNaN(pct) || pct < 0 || pct > 100) {
      Alert.alert('Invalid adherence', 'Enter a number between 0 and 100.');
      return;
    }
    const next: CheckIn = {
      dateISO: new Date().toISOString(),
      adherencePct: pct,
      notes: notes.trim(),
    };
    setSaving(true);
    try {
      await save({ checkins: [next, ...checkins] });
      setAdherence('');
      setNotes('');
    } catch (err) {
      Alert.alert('Could not save', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setSaving(false);
    }
  }

  async function deleteCheckIn(idx: number) {
    const next = checkins.filter((_, i) => i !== idx);
    try {
      await save({ checkins: next });
    } catch (err) {
      Alert.alert('Could not delete', err instanceof Error ? err.message : 'Please try again.');
    }
  }

  if (loading && !data) return <Loader />;

  const getAdherenceColor = (pct: number): string => {
    if (pct >= 80) return colors.success;
    if (pct >= 60) return colors.warning;
    return colors.danger;
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER */}
        <View style={styles.brandRow}>
          <Image
            source={require('../../assets/logo.png')}
            style={styles.brandLogo}
            resizeMode="contain"
          />
          <Text style={styles.brandName}>GeneoRx</Text>
        </View>

        {/* PAGE HEADER */}
        <View style={styles.pageHead}>
          <Text style={styles.eyebrow}>  Check-ins</Text>
          <Text style={styles.title}>
            Log how you are <Text style={styles.titleItalic}>feeling</Text>.
          </Text>
          <Text style={styles.subtitle}>
            Weekly check-ins build a meaningful profile that improves the accuracy of your insights.
          </Text>
        </View>

        {/* STATS STRIP */}
        {checkins.length > 0 && (
          <View style={styles.statsStrip}>
            <View style={styles.statItem}>
              <Text style={styles.statNum}>{checkins.length}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNum}>{avgAdherence}%</Text>
              <Text style={styles.statLabel}>Average adherence</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNum}>{last7Count}</Text>
              <Text style={styles.statLabel}>This week</Text>
            </View>
          </View>
        )}

        {/* NEW CHECK-IN */}
        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <View>
              <Text style={styles.sectionTitle}>New check-in</Text>
              <Text style={styles.sectionSub}>Adherence is the percentage of doses taken as planned.</Text>
            </View>
          </View>

          <Input
            label="Adherence (%)"
            value={adherence}
            onChangeText={setAdherence}
            keyboardType="number-pad"
            placeholder="0 – 100"
          />
          <Input
            label="Notes"
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
            placeholder="How are you feeling today?"
            style={{ minHeight: 90, textAlignVertical: 'top', paddingVertical: 12 }}
          />
          <Button title="Log check-in" onPress={logCheckIn} loading={saving} />
        </View>

        {/* HISTORY */}
        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <View>
              <Text style={styles.sectionTitle}>History</Text>
              <Text style={styles.sectionSub}>{checkins.length} {checkins.length === 1 ? 'entry' : 'entries'}</Text>
            </View>
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{checkins.length}</Text>
            </View>
          </View>

          {checkins.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>No check-ins yet</Text>
              <Text style={styles.emptyBody}>Log your first check-in above to start tracking your progress.</Text>
            </View>
          ) : (
            <View style={styles.list}>
              {checkins.map((c, i) => {
                const date = new Date(c.dateISO);
                const adherenceColor = getAdherenceColor(c.adherencePct);
                return (
                  <View key={`${c.id ?? 'new'}-${i}`} style={styles.entry}>
                    <View style={styles.entryDate}>
                      <Text style={styles.entryDay}>
                        {date.toLocaleDateString('en-US', { day: 'numeric' })}
                      </Text>
                      <Text style={styles.entryMonth}>
                        {date.toLocaleDateString('en-US', { month: 'short' })}
                      </Text>
                    </View>
                    <View style={styles.entryBody}>
                      <View style={styles.entryHeader}>
                        <Text style={styles.entryWeekday}>
                          {date.toLocaleDateString('en-US', { weekday: 'long' })}
                        </Text>
                        <View style={[styles.entryAdherence, { backgroundColor: `${adherenceColor}18` }]}>
                          <Text style={[styles.entryAdherenceText, { color: adherenceColor }]}>
                            {c.adherencePct}%
                          </Text>
                        </View>
                      </View>
                      {c.notes ? <Text style={styles.entryNotes}>{c.notes}</Text> : (
                        <Text style={styles.entryNotesEmpty}>No notes</Text>
                      )}
                    </View>
                    <Pressable
                      onPress={() => deleteCheckIn(i)}
                      style={({ pressed }) => [styles.deleteBtn, pressed && { opacity: 0.6 }]}
                      hitSlop={8}
                    >
                      <Text style={styles.deleteBtnText}>×</Text>
                    </Pressable>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        <Text style={styles.legal}>
          Educational guidance only   not medical advice.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.backgroundAlt },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },

  /* BRAND */
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  brandLogo: { width: 26, height: 26 },
  brandName: { fontSize: 14.5, fontWeight: '800', color: colors.text, letterSpacing: -0.2 },

  /* PAGE HEAD */
  pageHead: { paddingVertical: 8 },
  eyebrow: {
    fontSize: 11.5,
    fontWeight: '700',
    color: colors.primaryDark,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.7,
    lineHeight: 34,
    marginBottom: 8,
  },
  titleItalic: { fontStyle: 'italic', fontWeight: '400', color: colors.primaryDark },
  subtitle: { fontSize: 14.5, color: colors.textSoft, lineHeight: 21 },

  /* STATS STRIP */
  statsStrip: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderRadius: 13,
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statNum: {
    fontSize: 21,
    fontWeight: '800',
    color: colors.primaryDark,
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 10.5,
    color: colors.textMuted,
    fontWeight: '600',
    marginTop: 3,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  statDivider: { width: 1, backgroundColor: colors.borderSoft, marginVertical: 4 },

  /* SECTION */
  section: {
    backgroundColor: colors.background,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    padding: spacing.lg,
    gap: spacing.md,
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: colors.text, letterSpacing: -0.3 },
  sectionSub: { fontSize: 13, color: colors.textMuted, marginTop: 3, maxWidth: 260 },
  countBadge: {
    minWidth: 28, height: 28,
    paddingHorizontal: 8,
    borderRadius: 999,
    backgroundColor: colors.primary50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countBadgeText: { fontSize: 13, fontWeight: '800', color: colors.primaryDark },

  /* EMPTY */
  empty: {
    paddingVertical: 24,
    paddingHorizontal: 16,
    borderRadius: 11,
    backgroundColor: colors.backgroundAlt,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    alignItems: 'center',
  },
  emptyTitle: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 4 },
  emptyBody: { fontSize: 13, color: colors.textMuted, textAlign: 'center', lineHeight: 19 },

  /* LIST */
  list: { gap: 8 },
  entry: {
    flexDirection: 'row',
    gap: 12,
    padding: 12,
    borderRadius: 11,
    backgroundColor: colors.backgroundAlt,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  entryDate: {
    width: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    borderRadius: 9,
    paddingVertical: 6,
  },
  entryDay: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.primaryDark,
    lineHeight: 20,
  },
  entryMonth: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  entryBody: { flex: 1, gap: 5 },
  entryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  entryWeekday: { fontSize: 14, fontWeight: '700', color: colors.text },
  entryAdherence: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 5,
  },
  entryAdherenceText: { fontSize: 11.5, fontWeight: '800' },
  entryNotes: { fontSize: 13, color: colors.textSoft, lineHeight: 19 },
  entryNotesEmpty: { fontSize: 12.5, color: colors.textDim, fontStyle: 'italic' },
  deleteBtn: {
    width: 30, height: 30,
    borderRadius: 15,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtnText: { fontSize: 18, color: colors.textMuted, lineHeight: 20 },

  legal: {
    fontSize: 11.5,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
