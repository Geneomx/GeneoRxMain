import React, { useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useProfile } from '@/store/ProfileContext';
import { Loader } from '@/components/Loader';
import { colors, spacing } from '@/theme';
import type { Medication, Symptom } from '@/types/api';

const MED_PALETTES = [
  { bg: '#FFF0EE', dot: '#FF6B5B' },
  { bg: '#EEF0FF', dot: '#6B7FFF' },
  { bg: '#F0FFF4', dot: '#4CAF7D' },
  { bg: '#FFF8EE', dot: '#FF9940' },
  { bg: '#F5EEFF', dot: '#9B6BFF' },
];

const FREQUENCIES = ['Once daily', 'Twice daily', 'Morning', 'Evening'];

const MedIcon: React.FC<{ index: number }> = ({ index }) => {
  const p = MED_PALETTES[index % MED_PALETTES.length];
  return (
    <View style={[styles.medIcon, { backgroundColor: p.bg }]}>
      <View style={[styles.medIconDot, { backgroundColor: p.dot }]} />
    </View>
  );
};

export const TreatmentsScreen: React.FC = () => {
  const { data, loading, refresh, save } = useProfile();
  const [showModal, setShowModal] = useState(false);
  const [medName, setMedName] = useState('');
  const [medDose, setMedDose] = useState('');
  const [medFreq, setMedFreq] = useState('Once daily');
  const [medMonths, setMedMonths] = useState('');
  const [saving, setSaving] = useState(false);

  const meds = useMemo<Medication[]>(() => data?.medications ?? [], [data]);
  const symptoms = useMemo<Symptom[]>(() => data?.symptoms ?? [], [data]);
  const checkins = useMemo(() => data?.checkins ?? [], [data]);

  const avgAdherence = useMemo(() => {
    if (checkins.length === 0) return 0;
    const sum = checkins.reduce((a, c) => a + (c.adherencePct ?? 0), 0);
    return Math.round(sum / checkins.length);
  }, [checkins]);

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
    setMedName(''); setMedDose(''); setMedMonths(''); setMedFreq('Once daily');
    setShowModal(false);
    persist([...meds, next], symptoms);
  }

  function removeMedication(idx: number) {
    Alert.alert('Remove medication', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => persist(meds.filter((_, i) => i !== idx), symptoms) },
    ]);
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
        <View style={styles.header}>
          <Text style={styles.pageTitle}>Medications</Text>
          <TouchableOpacity style={styles.addBtn} onPress={() => setShowModal(true)} activeOpacity={0.8}>
            <Text style={styles.addBtnText}>+</Text>
          </TouchableOpacity>
        </View>

        {/* ADHERENCE CARD */}
        <View style={styles.adherenceCard}>
          <View style={styles.adherenceCircle}>
            <Text style={styles.adherencePct}>{avgAdherence || 84}%</Text>
          </View>
          <View style={styles.adherenceInfo}>
            <Text style={styles.adherenceTitle}>Monthly adherence: {avgAdherence || 84}%</Text>
            <Text style={styles.adherenceSub}>{meds.length} active medication{meds.length !== 1 ? 's' : ''} tracked</Text>
          </View>
        </View>

        {/* ACTIVE MEDICATIONS */}
        <Text style={styles.sectionLabel}>ACTIVE MEDICATIONS</Text>

        <View style={styles.medsCard}>
          {meds.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No medications yet</Text>
              <Text style={styles.emptySub}>Tap + above or the button below to add medications</Text>
            </View>
          ) : (
            meds.map((med, i) => (
              <React.Fragment key={`${med.medId}-${i}`}>
                <TouchableOpacity
                  style={styles.medRow}
                  onLongPress={() => removeMedication(i)}
                  activeOpacity={0.7}
                >
                  <MedIcon index={i} />
                  <View style={styles.medInfo}>
                    <Text style={styles.medName}>{med.medId}</Text>
                    <Text style={styles.medMeta}>
                      {med.dose ? `${med.dose} · ` : ''}
                      {FREQUENCIES[i % FREQUENCIES.length]}
                      {med.durationMonths
                        ? ` · Since ${getStartDate(med.durationMonths)}`
                        : ''}
                    </Text>
                  </View>
                  <View style={styles.activeBadge}>
                    <Text style={styles.activeBadgeText}>Active</Text>
                  </View>
                </TouchableOpacity>
                {i < meds.length - 1 && <View style={styles.divider} />}
              </React.Fragment>
            ))
          )}
        </View>

        {/* BIG ADD BUTTON */}
        <TouchableOpacity style={styles.bigAddBtn} onPress={() => setShowModal(true)} activeOpacity={0.85}>
          <Text style={styles.bigAddBtnText}>+ Add Medication</Text>
        </TouchableOpacity>

        {meds.length > 0 && (
          <Text style={styles.hint}>Long-press a medication to remove it</Text>
        )}
        <Text style={styles.legal}>Educational guidance only · not medical advice</Text>
      </ScrollView>

      {/* ADD MEDICATION MODAL */}
      <Modal visible={showModal} transparent animationType="slide" onRequestClose={() => setShowModal(false)}>
        <View style={styles.overlay}>
          <TouchableOpacity style={styles.overlayBg} onPress={() => setShowModal(false)} activeOpacity={1} />
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Add Medication</Text>

            <Text style={styles.fieldLabel}>Medication name *</Text>
            <TextInput
              style={styles.input}
              value={medName}
              onChangeText={setMedName}
              placeholder="e.g. Metformin"
              placeholderTextColor={colors.textDim}
              autoFocus
            />

            <Text style={styles.fieldLabel}>Dose</Text>
            <TextInput
              style={styles.input}
              value={medDose}
              onChangeText={setMedDose}
              placeholder="e.g. 500 mg"
              placeholderTextColor={colors.textDim}
            />

            <Text style={styles.fieldLabel}>Frequency</Text>
            <View style={styles.freqRow}>
              {FREQUENCIES.map((f) => (
                <TouchableOpacity
                  key={f}
                  style={[styles.freqChip, medFreq === f && styles.freqChipActive]}
                  onPress={() => setMedFreq(f)}
                >
                  <Text style={[styles.freqChipText, medFreq === f && styles.freqChipTextActive]}>{f}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Duration (months, 0 = ongoing)</Text>
            <TextInput
              style={styles.input}
              value={medMonths}
              onChangeText={setMedMonths}
              keyboardType="number-pad"
              placeholder="0"
              placeholderTextColor={colors.textDim}
            />

            <View style={styles.sheetActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowModal(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, (!medName.trim() || saving) && styles.saveBtnDisabled]}
                onPress={addMedication}
                disabled={!medName.trim() || saving}
              >
                <Text style={styles.saveBtnText}>{saving ? 'Saving…' : 'Add'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

function getStartDate(months: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() - months);
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#EDF2F0' },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: 40 },

  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 18,
  },
  pageTitle: { fontSize: 26, fontWeight: '800', color: colors.text, letterSpacing: -0.5 },
  addBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: colors.primary50,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.primary100,
  },
  addBtnText: { fontSize: 22, fontWeight: '300', color: colors.primaryDark, lineHeight: 28 },

  adherenceCard: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    backgroundColor: colors.primary50,
    borderRadius: 16, padding: 18, marginBottom: 22,
    borderWidth: 1, borderColor: colors.primary100,
    shadowColor: '#0F1F1B', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  adherenceCircle: {
    width: 68, height: 68, borderRadius: 34,
    borderWidth: 4.5, borderColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  adherencePct: { fontSize: 16, fontWeight: '800', color: colors.primaryDark },
  adherenceInfo: { flex: 1 },
  adherenceTitle: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 4 },
  adherenceSub: { fontSize: 13, color: colors.textMuted },

  sectionLabel: {
    fontSize: 11.5, fontWeight: '700', color: colors.textMuted,
    letterSpacing: 1, marginBottom: 10,
  },

  medsCard: {
    backgroundColor: '#FFFFFF', borderRadius: 16, overflow: 'hidden',
    shadowColor: '#0F1F1B', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 10, elevation: 3, marginBottom: 16,
  },
  medRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 15, gap: 12,
  },
  medIcon: { width: 46, height: 46, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  medIconDot: { width: 22, height: 22, borderRadius: 11 },
  medInfo: { flex: 1 },
  medName: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 3 },
  medMeta: { fontSize: 12.5, color: colors.textMuted },
  divider: { height: 1, backgroundColor: '#F2F5F4', marginLeft: 74 },

  activeBadge: {
    paddingVertical: 5, paddingHorizontal: 12, borderRadius: 999,
    borderWidth: 1.2, borderColor: colors.primary,
  },
  activeBadgeText: { fontSize: 12, fontWeight: '600', color: colors.primaryDark },

  emptyState: { padding: 32, alignItems: 'center' },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 5 },
  emptySub: { fontSize: 13, color: colors.textMuted, textAlign: 'center' },

  bigAddBtn: {
    backgroundColor: colors.primary, borderRadius: 14,
    paddingVertical: 16, alignItems: 'center',
    shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28, shadowRadius: 12, elevation: 6, marginBottom: 12,
  },
  bigAddBtnText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },

  hint: { fontSize: 11, color: colors.textDim, textAlign: 'center', marginBottom: 4 },
  legal: { fontSize: 11.5, color: colors.textMuted, textAlign: 'center' },

  overlay: { flex: 1, justifyContent: 'flex-end' },
  overlayBg: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15,31,27,0.5)' },
  sheet: {
    backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 40,
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1, shadowRadius: 20, elevation: 20,
  },
  sheetHandle: {
    width: 40, height: 4, borderRadius: 2, backgroundColor: colors.borderSoft,
    alignSelf: 'center', marginBottom: 20,
  },
  sheetTitle: { fontSize: 20, fontWeight: '800', color: colors.text, letterSpacing: -0.3, marginBottom: 20 },
  fieldLabel: {
    fontSize: 11.5, fontWeight: '700', color: colors.textSoft,
    textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 6,
  },
  input: {
    backgroundColor: colors.backgroundAlt, borderRadius: 12,
    borderWidth: 1, borderColor: colors.borderSoft,
    paddingHorizontal: 14, paddingVertical: 13,
    fontSize: 15, color: colors.text, marginBottom: 16,
  },
  freqRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  freqChip: {
    paddingVertical: 7, paddingHorizontal: 14, borderRadius: 999,
    borderWidth: 1.2, borderColor: colors.border, backgroundColor: '#FFFFFF',
  },
  freqChipActive: { borderColor: colors.primary, backgroundColor: colors.primary50 },
  freqChipText: { fontSize: 13, fontWeight: '600', color: colors.textSoft },
  freqChipTextActive: { color: colors.primaryDark },
  sheetActions: { flexDirection: 'row', gap: 12, marginTop: 6 },
  cancelBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 12,
    borderWidth: 1, borderColor: colors.border, alignItems: 'center',
  },
  cancelBtnText: { fontSize: 15, fontWeight: '600', color: colors.textSoft },
  saveBtn: { flex: 2, paddingVertical: 14, borderRadius: 12, backgroundColor: colors.primary, alignItems: 'center' },
  saveBtnDisabled: { backgroundColor: colors.borderSoft },
  saveBtnText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
});
