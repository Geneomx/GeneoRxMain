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
import { Chip } from '@/components/Chip';
import { Loader } from '@/components/Loader';
import { colors, spacing, typography } from '@/theme';
import type { Medication, Symptom } from '@/types/api';

export const TreatmentsScreen: React.FC = () => {
  const { data, loading, refresh, save } = useProfile();
  const [medName, setMedName] = useState('');
  const [medDose, setMedDose] = useState('');
  const [medMonths, setMedMonths] = useState('');
  const [symptomName, setSymptomName] = useState('');
  const [saving, setSaving] = useState(false);

  const meds = useMemo<Medication[]>(() => data?.medications ?? [], [data]);
  const symptoms = useMemo<Symptom[]>(() => data?.symptoms ?? [], [data]);

  async function persist(nextMeds: Medication[], nextSymptoms: Symptom[]) {
    setSaving(true);
    try {
      await save({ medications: nextMeds, symptoms: nextSymptoms });
    } catch (err) {
      Alert.alert('Could not save', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setSaving(false);
    }
  }

  function addMedication() {
    if (!medName.trim()) return;
    const next: Medication = {
      medId: medName.trim(),
      dose: medDose.trim(),
      durationMonths: Number.parseInt(medMonths, 10) || 0,
    };
    setMedName('');
    setMedDose('');
    setMedMonths('');
    persist([...meds, next], symptoms);
  }

  function removeMedication(idx: number) {
    persist(meds.filter((_, i) => i !== idx), symptoms);
  }

  function addSymptom() {
    if (!symptomName.trim()) return;
    const next: Symptom = { name: symptomName.trim() };
    setSymptomName('');
    persist(meds, [...symptoms, next]);
  }

  function removeSymptom(idx: number) {
    persist(meds, symptoms.filter((_, i) => i !== idx));
  }

  if (loading && !data) return <Loader />;

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
          <Text style={styles.eyebrow}>  Treatments</Text>
          <Text style={styles.title}>
            Your <Text style={styles.titleItalic}>treatment plan</Text>.
          </Text>
          <Text style={styles.subtitle}>
            Manage the medications you take and the symptoms you track.
          </Text>
        </View>

        {/* MEDICATIONS SECTION */}
        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <View>
              <Text style={styles.sectionTitle}>Medications</Text>
              <Text style={styles.sectionSub}>{meds.length} {meds.length === 1 ? 'medication' : 'medications'}</Text>
            </View>
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{meds.length}</Text>
            </View>
          </View>

          {meds.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>No medications added yet</Text>
              <Text style={styles.emptyBody}>Add what you take to start spotting patterns.</Text>
            </View>
          ) : (
            <View style={styles.list}>
              {meds.map((m, i) => (
                <View key={`${m.id ?? 'new'}-${i}`} style={styles.medCard}>
                  <View style={styles.medIcon}>
                    <Text style={styles.medIconText}>Rx</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.medName}>{m.medId}</Text>
                    <Text style={styles.medMeta}>
                      {m.dose ? `${m.dose} • ` : ''}
                      {m.durationMonths ? `${m.durationMonths} mo` : 'Ongoing'}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => removeMedication(i)}
                    style={({ pressed }) => [styles.removeBtn, pressed && { opacity: 0.6 }]}
                    hitSlop={8}
                  >
                    <Text style={styles.removeBtnText}>×</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          )}

          <View style={styles.addBlock}>
            <Text style={styles.addBlockTitle}>Add a medication</Text>
            <Input label="Name" value={medName} onChangeText={setMedName} placeholder="e.g. Metformin" />
            <Input label="Dose" value={medDose} onChangeText={setMedDose} placeholder="e.g. 500 mg" />
            <Input
              label="Duration (months)"
              value={medMonths}
              onChangeText={setMedMonths}
              keyboardType="number-pad"
              placeholder="0   ongoing"
            />
            <Button title="Add medication" onPress={addMedication} loading={saving} />
          </View>
        </View>

        {/* SYMPTOMS SECTION */}
        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <View>
              <Text style={styles.sectionTitle}>Symptoms</Text>
              <Text style={styles.sectionSub}>{symptoms.length} {symptoms.length === 1 ? 'symptom' : 'symptoms'} tracked</Text>
            </View>
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{symptoms.length}</Text>
            </View>
          </View>

          {symptoms.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>No symptoms tracked yet</Text>
              <Text style={styles.emptyBody}>Add how you have been feeling to refine your profile.</Text>
            </View>
          ) : (
            <View style={styles.chipsWrap}>
              {symptoms.map((s, i) => (
                <Chip key={`${s.id ?? 'new'}-${i}`} label={s.name} onRemove={() => removeSymptom(i)} />
              ))}
            </View>
          )}

          <View style={styles.addBlock}>
            <Text style={styles.addBlockTitle}>Add a symptom</Text>
            <Input
              label="Symptom"
              value={symptomName}
              onChangeText={setSymptomName}
              placeholder="e.g. Fatigue, brain fog"
            />
            <Button title="Add symptom" onPress={addSymptom} loading={saving} variant="secondary" />
          </View>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: colors.text, letterSpacing: -0.3 },
  sectionSub: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
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
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderRadius: 11,
    backgroundColor: colors.backgroundAlt,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    alignItems: 'center',
  },
  emptyTitle: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 3 },
  emptyBody: { fontSize: 13, color: colors.textMuted, textAlign: 'center' },

  /* MED LIST */
  list: { gap: 8 },
  medCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 11,
    backgroundColor: colors.backgroundAlt,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  medIcon: {
    width: 36, height: 36,
    borderRadius: 9,
    backgroundColor: colors.primary50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  medIconText: { fontSize: 12, fontWeight: '800', color: colors.primaryDark },
  medName: { fontSize: 14.5, fontWeight: '700', color: colors.text },
  medMeta: { fontSize: 12.5, color: colors.textMuted, marginTop: 2 },
  removeBtn: {
    width: 32, height: 32,
    borderRadius: 16,
    backgroundColor: colors.backgroundAlt,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeBtnText: { fontSize: 20, color: colors.textMuted, lineHeight: 22 },

  /* CHIPS */
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },

  /* ADD BLOCK */
  addBlock: {
    gap: spacing.sm,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderSoft,
  },
  addBlockTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSoft,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    marginBottom: 4,
  },

  legal: {
    fontSize: 11.5,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
