import React, { useMemo, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useProfile } from '@/store/ProfileContext';
import { Loader } from '@/components/Loader';
import { colors, spacing } from '@/theme';
import type { CheckIn } from '@/types/api';

// Symptom categories matching the mockup
const SYMPTOM_CATEGORIES: { label: string; symptoms: string[] }[] = [
  {
    label: 'ENERGY & FOCUS',
    symptoms: ['Fatigue', 'Brain fog', 'Low energy', 'Poor focus', 'Insomnia'],
  },
  {
    label: 'PHYSICAL',
    symptoms: ['Headache', 'Muscle ache', 'Nausea', 'Dizziness', 'Joint pain'],
  },
  {
    label: 'DIGESTION',
    symptoms: ['Bloating', 'Stomach pain', 'Constipation'],
  },
  {
    label: 'MOOD',
    symptoms: ['Anxious', 'Irritable', 'Low mood'],
  },
];

// Colors for selected chips by category
const CATEGORY_COLORS = [
  { border: colors.primary, bg: 'transparent', text: colors.primaryDark },       // Energy — teal
  { border: '#D97706', bg: 'transparent', text: '#B45309' },                      // Physical — amber
  { border: colors.text, bg: 'transparent', text: colors.text },                  // Digestion — dark
  { border: colors.text, bg: 'transparent', text: colors.text },                  // Mood — dark
];

interface SymptomChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  categoryIndex: number;
}

const SymptomChip: React.FC<SymptomChipProps> = ({ label, selected, onPress, categoryIndex }) => {
  const col = CATEGORY_COLORS[categoryIndex];
  return (
    <TouchableOpacity
      style={[
        styles.chip,
        selected && { borderColor: col.border, backgroundColor: col.bg },
        !selected && styles.chipUnsel,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.chipText, selected && { color: col.text, fontWeight: '700' }, !selected && styles.chipTextUnsel]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
};

export const CheckInsScreen: React.FC = () => {
  const { data, loading, save } = useProfile();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  const checkins = useMemo<CheckIn[]>(() => data?.checkins ?? [], [data]);

  const toggle = (symptom: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(symptom)) next.delete(symptom);
      else next.add(symptom);
      return next;
    });
  };

  const handleSave = async () => {
    if (selected.size === 0) {
      Alert.alert('No symptoms selected', 'Please select at least one symptom, or tap "I feel fine today".');
      return;
    }
    const next: CheckIn = {
      dateISO: new Date().toISOString(),
      adherencePct: 100,
      notes: Array.from(selected).join(', '),
    };
    setSaving(true);
    try {
      await save({ checkins: [next, ...checkins] });
      setSelected(new Set());
      Alert.alert('Check-in saved! ✓', 'Your symptoms have been logged.');
    } catch (err) {
      Alert.alert('Could not save', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleFineToday = async () => {
    const next: CheckIn = {
      dateISO: new Date().toISOString(),
      adherencePct: 100,
      notes: 'Feeling fine',
    };
    setSaving(true);
    try {
      await save({ checkins: [next, ...checkins] });
      setSelected(new Set());
      Alert.alert('Logged ✓', 'Great — glad you are feeling well today!');
    } catch (err) {
      Alert.alert('Could not save', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading && !data) return <Loader />;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.pageTitle}>How are you{'\n'}feeling today?</Text>
          <Text style={styles.pageSub}>Select all that apply</Text>
        </View>

        {/* SYMPTOM CATEGORIES */}
        {SYMPTOM_CATEGORIES.map((cat, catIdx) => (
          <View key={cat.label} style={styles.category}>
            <Text style={styles.catLabel}>{cat.label}</Text>
            <View style={styles.chipsRow}>
              {cat.symptoms.map((sym) => (
                <SymptomChip
                  key={sym}
                  label={sym}
                  selected={selected.has(sym)}
                  onPress={() => toggle(sym)}
                  categoryIndex={catIdx}
                />
              ))}
            </View>
          </View>
        ))}

        {/* SELECTED COUNT */}
        {selected.size > 0 && (
          <Text style={styles.selectedCount}>
            {selected.size} symptom{selected.size !== 1 ? 's' : ''} selected
          </Text>
        )}

        {/* SAVE CHECK-IN */}
        <TouchableOpacity
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          onPress={handleSave}
          activeOpacity={0.85}
          disabled={saving}
        >
          <Text style={styles.saveBtnText}>{saving ? 'Saving…' : 'Save Check-in'}</Text>
        </TouchableOpacity>

        {/* I FEEL FINE */}
        <TouchableOpacity
          style={styles.fineBtn}
          onPress={handleFineToday}
          activeOpacity={0.7}
          disabled={saving}
        >
          <Text style={styles.fineBtnText}>I feel fine today</Text>
        </TouchableOpacity>

        {/* RECENT HISTORY */}
        {checkins.length > 0 && (
          <View style={styles.historySection}>
            <Text style={styles.historyLabel}>RECENT CHECK-INS</Text>
            {checkins.slice(0, 3).map((c, i) => {
              const d = new Date(c.dateISO);
              const dayLabel = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short' });
              return (
                <View key={`checkin-${i}`} style={styles.historyRow}>
                  <View style={styles.historyDate}>
                    <Text style={styles.historyDateDay}>{d.getDate()}</Text>
                    <Text style={styles.historyDateMon}>{d.toLocaleDateString('en-US', { month: 'short' })}</Text>
                  </View>
                  <View style={styles.historyInfo}>
                    <Text style={styles.historyTitle}>{dayLabel}</Text>
                    <Text style={styles.historyNotes} numberOfLines={1}>
                      {c.notes || 'No notes'}
                    </Text>
                  </View>
                  <View style={[styles.adherencePill, {
                    backgroundColor: c.adherencePct >= 80 ? colors.successBg : c.adherencePct >= 60 ? colors.warningBg : colors.dangerBg
                  }]}>
                    <Text style={[styles.adherenceText, {
                      color: c.adherencePct >= 80 ? colors.success : c.adherencePct >= 60 ? colors.warning : colors.danger
                    }]}>{c.adherencePct}%</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        <Text style={styles.legal}>Educational guidance only · not medical advice</Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#EDF2F0' },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: 40 },

  /* HEADER */
  header: { marginBottom: 22 },
  pageTitle: { fontSize: 28, fontWeight: '800', color: colors.text, letterSpacing: -0.6, lineHeight: 34, marginBottom: 6 },
  pageSub: { fontSize: 14, color: colors.textMuted },

  /* CATEGORIES */
  category: { marginBottom: 22 },
  catLabel: {
    fontSize: 11.5, fontWeight: '700', color: colors.textMuted,
    letterSpacing: 1, marginBottom: 10,
  },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },

  /* CHIP */
  chip: {
    paddingVertical: 9, paddingHorizontal: 16,
    borderRadius: 999, borderWidth: 1.5, borderColor: colors.text,
  },
  chipUnsel: {
    borderColor: colors.borderSoft, backgroundColor: '#FFFFFF',
  },
  chipText: { fontSize: 14, fontWeight: '600', color: colors.text },
  chipTextUnsel: { color: colors.textMuted, fontWeight: '500' },

  /* SELECTED COUNT */
  selectedCount: {
    fontSize: 13, color: colors.primaryDark, fontWeight: '600',
    textAlign: 'center', marginBottom: 10,
  },

  /* SAVE BTN */
  saveBtn: {
    backgroundColor: colors.primary, borderRadius: 14,
    paddingVertical: 16, alignItems: 'center',
    shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28, shadowRadius: 12, elevation: 6,
    marginBottom: 12,
  },
  saveBtnDisabled: { backgroundColor: colors.borderSoft, shadowOpacity: 0 },
  saveBtnText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },

  /* FINE BTN */
  fineBtn: {
    borderRadius: 14, paddingVertical: 15,
    alignItems: 'center', borderWidth: 1.2,
    borderColor: colors.primary50,
    backgroundColor: 'rgba(14,124,102,0.04)',
    marginBottom: 28,
  },
  fineBtnText: { fontSize: 15, fontWeight: '600', color: colors.primaryDark },

  /* HISTORY */
  historySection: { marginBottom: 8 },
  historyLabel: {
    fontSize: 11.5, fontWeight: '700', color: colors.textMuted,
    letterSpacing: 1, marginBottom: 10,
  },
  historyRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#FFFFFF', borderRadius: 12, padding: 12,
    marginBottom: 8,
    shadowColor: '#0F1F1B', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  historyDate: {
    width: 44, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.backgroundAlt, borderRadius: 8, paddingVertical: 6,
  },
  historyDateDay: { fontSize: 18, fontWeight: '800', color: colors.primaryDark, lineHeight: 20 },
  historyDateMon: { fontSize: 9, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.4 },
  historyInfo: { flex: 1, gap: 2 },
  historyTitle: { fontSize: 13.5, fontWeight: '700', color: colors.text },
  historyNotes: { fontSize: 12.5, color: colors.textMuted },
  adherencePill: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 6 },
  adherenceText: { fontSize: 12, fontWeight: '800' },

  legal: { fontSize: 11.5, color: colors.textMuted, textAlign: 'center' },
});
