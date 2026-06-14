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
import { DropdownSelect } from '@/components/DropdownSelect';
import { Loader } from '@/components/Loader';
import { useToast } from '@/components/Toast';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { useTranslation } from '@/hooks/useTranslation';
import { useMedCatalog, findMedName } from '@/store/MedCatalogContext';
import type { WizardMed } from '@/wizard/types';
import { Button } from '@/components/Button';
import { colors, portalCard, radius, spacing } from '@/theme';

const MED_PALETTES = [
  { bg: 'rgba(255, 107, 91, 0.18)', dot: '#FF6B5B' },
  { bg: 'rgba(107, 127, 255, 0.18)', dot: '#6B7FFF' },
  { bg: 'rgba(76, 175, 125, 0.18)', dot: '#4CAF7D' },
  { bg: 'rgba(255, 153, 64, 0.18)', dot: '#FF9940' },
  { bg: 'rgba(155, 107, 255, 0.18)', dot: '#9B6BFF' },
];

const MedIcon: React.FC<{ index: number }> = ({ index }) => {
  const p = MED_PALETTES[index % MED_PALETTES.length];
  return (
    <View style={[styles.medIcon, { backgroundColor: p.bg }]}>
      <View style={[styles.medIconDot, { backgroundColor: p.dot }]} />
    </View>
  );
};

export const TreatmentsScreen: React.FC = () => {
  const { t } = useTranslation();
  const { data, loading, refresh, save } = useProfile();
  const { catalog } = useMedCatalog();
  const toast = useToast();
  const { page, scrollBottom } = useResponsiveLayout();
  const [showModal, setShowModal] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [medPickId, setMedPickId] = useState('');
  const [medCustomName, setMedCustomName] = useState('');
  const [medDose, setMedDose] = useState('medium');
  const [medMonths, setMedMonths] = useState('12');
  const [saving, setSaving] = useState(false);

  const meds = useMemo<WizardMed[]>(
    () => (data?.medications ?? []).map((m) => ({
      medId: m.medId,
      dose: (m.dose === 'low' || m.dose === 'high' ? m.dose : 'med') as WizardMed['dose'],
      durationMonths: m.durationMonths ?? 0,
    })),
    [data],
  );
  const medOptions = useMemo(
    () => [
      { value: '', label: t('common.select') },
      ...catalog.map((m) => ({ value: m.id, label: m.name })),
    ],
    [t, catalog],
  );
  const checkins = useMemo(() => data?.checkins ?? [], [data]);

  // Recent adherence from logged check-ins (last 7). Null when nothing logged yet.
  const avgAdherence = useMemo(() => {
    if (checkins.length === 0) return null;
    const recent = checkins.slice(0, 7);
    const sum = recent.reduce((a, c) => a + (c.adherencePct ?? 0), 0);
    return Math.round(sum / recent.length);
  }, [checkins]);

  async function persist(nextMeds: WizardMed[]) {
    setSaving(true);
    try {
      await save({
        medications: nextMeds.map((m) => ({
          medId: m.medId,
          dose: m.dose === 'med' ? 'medium' : m.dose,
          durationMonths: m.durationMonths,
        })),
        portal_state: { symptomOnlyMode: nextMeds.length === 0 },
      });
      toast.show(t('toast.saved'));
    } catch (err) {
      toast.show(err instanceof Error ? err.message : 'Could not save', 'error');
    } finally {
      setSaving(false);
    }
  }

  function openAdd() {
    setEditingIndex(null);
    setMedPickId('');
    setMedCustomName('');
    setMedDose('medium');
    setMedMonths('12');
    setShowModal(true);
  }

  function openEdit(idx: number) {
    const m = meds[idx];
    const known = catalog.find((x) => x.id === m.medId);
    setEditingIndex(idx);
    setMedPickId(known ? m.medId : '');
    setMedCustomName(known ? '' : findMedName(catalog, m.medId));
    setMedDose(m.dose === 'med' ? 'medium' : m.dose);
    setMedMonths(m.durationMonths ? String(m.durationMonths) : '12');
    setShowModal(true);
  }

  function resolveMedId(): string {
    if (medPickId) return medPickId;
    const custom = medCustomName.trim();
    if (!custom) return '';
    return `custom_${custom.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 50)}`;
  }

  function doseFromInput(): WizardMed['dose'] {
    const v = medDose.trim().toLowerCase();
    if (v === 'low') return 'low';
    if (v === 'high') return 'high';
    return 'med';
  }

  function submitMedication() {
    const medId = resolveMedId();
    if (!medId) return;
    const next: WizardMed = {
      medId,
      dose: doseFromInput(),
      durationMonths: Number.parseInt(medMonths, 10) || 0,
    };
    setShowModal(false);
    const nextMeds = editingIndex !== null
      ? meds.map((m, i) => (i === editingIndex ? next : m))
      : [...meds, next];
    setEditingIndex(null);
    persist(nextMeds);
  }

  function removeMedication(idx: number) {
    Alert.alert(t('mobile.treatments.remove_title'), t('mobile.treatments.remove_confirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.remove'), style: 'destructive', onPress: () => persist(meds.filter((_, i) => i !== idx)) },
    ]);
  }

  if (loading && !data) return <Loader />;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: scrollBottom }]}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={page}>
        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.pageTitle} numberOfLines={2}>{t('meds.title')}</Text>
          <TouchableOpacity style={styles.addBtn} onPress={openAdd} activeOpacity={0.8}>
            <Text style={styles.addBtnText}>+</Text>
          </TouchableOpacity>
        </View>

        {/* ADHERENCE CARD */}
        <View style={styles.adherenceCard}>
          <View style={styles.adherenceCircle}>
            <Text style={styles.adherencePct}>{avgAdherence !== null ? `${avgAdherence}%` : '—'}</Text>
          </View>
          <View style={styles.adherenceInfo}>
            <Text style={styles.adherenceTitle}>
              {avgAdherence !== null
                ? t('mobile.treatments.adherence_recent', { pct: avgAdherence })
                : t('mobile.treatments.adherence_none')}
            </Text>
            <Text style={styles.adherenceSub}>
              {avgAdherence !== null
                ? (() => {
                    const n = Math.min(checkins.length, 7);
                    return n === 1
                      ? t('mobile.treatments.adherence_from_one', { count: n })
                      : t('mobile.treatments.adherence_from_many', { count: n });
                  })()
                : t('mobile.treatments.adherence_log')}
            </Text>
          </View>
        </View>

        {/* ACTIVE MEDICATIONS */}
        <Text style={styles.sectionLabel}>{t('mobile.treatments.active_section')}</Text>

        <View style={styles.medsCard}>
          {meds.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>{t('mobile.treatments.empty')}</Text>
              <Text style={styles.emptySub}>{t('mobile.treatments.empty_sub')}</Text>
            </View>
          ) : (
            meds.map((med, i) => (
              <React.Fragment key={`${med.medId}-${i}`}>
                <TouchableOpacity
                  style={styles.medRow}
                  onPress={() => openEdit(i)}
                  onLongPress={() => removeMedication(i)}
                  activeOpacity={0.7}
                >
                  <MedIcon index={i} />
                  <View style={styles.medInfo}>
                    <Text style={styles.medName}>{findMedName(catalog, med.medId)}</Text>
                    <Text style={styles.medMeta}>
                      {med.dose ? `${med.dose === 'med' ? 'medium' : med.dose} · ` : ''}
                      {med.durationMonths
                        ? `${med.durationMonths} mo · Since ${getStartDate(med.durationMonths)}`
                        : ''}
                    </Text>
                  </View>
                  <View style={styles.activeBadge}>
                    <Text style={styles.activeBadgeText}>{t('mobile.treatments.active_badge')}</Text>
                  </View>
                </TouchableOpacity>
                {i < meds.length - 1 && <View style={styles.divider} />}
              </React.Fragment>
            ))
          )}
        </View>

        <Button title={t('mobile.treatments.add_btn')} onPress={openAdd} style={styles.bigAddBtn} />

        {meds.length > 0 && (
          <Text style={styles.hint}>{t('mobile.treatments.hint')}</Text>
        )}
        <Text style={styles.legal}>{t('mobile.legal')}</Text>
        </View>
      </ScrollView>

      {/* ADD MEDICATION MODAL */}
      <Modal visible={showModal} transparent animationType="slide" onRequestClose={() => setShowModal(false)}>
        <View style={styles.overlay}>
          <TouchableOpacity style={styles.overlayBg} onPress={() => setShowModal(false)} activeOpacity={1} />
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>
              {editingIndex !== null ? t('mobile.treatments.edit_title') : t('mobile.treatments.add_title')}
            </Text>

            <DropdownSelect
              label={`${t('meds.list')} *`}
              placeholder={t('common.select')}
              value={medPickId}
              options={medOptions}
              onChange={(value) => {
                setMedPickId(value);
                if (value) setMedCustomName('');
              }}
            />

            <Text style={styles.fieldLabel}>{t('meds.add_custom')}</Text>
            <TextInput
              style={styles.input}
              value={medCustomName}
              onChangeText={(text) => {
                setMedCustomName(text);
                if (text.trim()) setMedPickId('');
              }}
              placeholder={t('meds.custom_placeholder')}
              placeholderTextColor={colors.textDim}
            />

            <Text style={styles.fieldLabel}>{t('meds.dose')}</Text>
            <View style={styles.freqRow}>
              {(['low', 'medium', 'high'] as const).map((d) => (
                <TouchableOpacity
                  key={d}
                  style={[styles.freqChip, medDose === d && styles.freqChipActive]}
                  onPress={() => setMedDose(d)}
                >
                  <Text style={[styles.freqChipText, medDose === d && styles.freqChipTextActive]}>
                    {t(`dose.${d === 'medium' ? 'medium' : d}`)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.fieldLabel}>{t('meds.duration')}</Text>
            <TextInput
              style={styles.input}
              value={medMonths}
              onChangeText={setMedMonths}
              keyboardType="number-pad"
              placeholder="0"
              placeholderTextColor={colors.textDim}
            />

            <View style={styles.sheetActions}>
              <Button title={t('common.cancel')} variant="ghost" onPress={() => setShowModal(false)} style={styles.sheetBtn} />
              <Button
                title={saving ? t('mobile.treatments.saving') : editingIndex !== null ? t('common.save') : t('common.add')}
                onPress={submitMedication}
                disabled={!resolveMedId() || saving}
                loading={saving}
                style={styles.sheetBtnPrimary}
              />
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
  safe: { flex: 1, backgroundColor: colors.background },
  content: { alignItems: 'center', paddingTop: spacing.md },

  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 18,
  },
  pageTitle: { fontSize: 26, fontWeight: '800', color: colors.text, letterSpacing: -0.5, flex: 1, minWidth: 0 },
  addBtn: {
    width: 36, height: 36, borderRadius: radius.button,
    backgroundColor: colors.ghostBg,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.border,
  },
  addBtnText: { fontSize: 22, fontWeight: '300', color: colors.primary, lineHeight: 28 },

  adherenceCard: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    ...portalCard,
    padding: 18, marginBottom: 22,
  },
  adherenceCircle: {
    width: 68, height: 68, borderRadius: 34,
    borderWidth: 4.5, borderColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.backgroundAlt,
  },
  adherencePct: { fontSize: 16, fontWeight: '800', color: colors.primary },
  adherenceInfo: { flex: 1 },
  adherenceTitle: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 4 },
  adherenceSub: { fontSize: 13, color: colors.textMuted },

  sectionLabel: {
    fontSize: 11.5, fontWeight: '700', color: colors.textMuted,
    letterSpacing: 1, marginBottom: 10,
  },

  medsCard: {
    ...portalCard,
    overflow: 'hidden',
    marginBottom: 16,
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
  divider: { height: 1, backgroundColor: colors.borderSoft, marginLeft: 74 },

  activeBadge: {
    paddingVertical: 5, paddingHorizontal: 12, borderRadius: 999,
    borderWidth: 1, borderColor: 'rgba(40, 225, 255, 0.45)',
    backgroundColor: 'rgba(40, 225, 255, 0.12)',
  },
  activeBadgeText: { fontSize: 12, fontWeight: '700', color: colors.primary },

  emptyState: { padding: 32, alignItems: 'center' },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 5 },
  emptySub: { fontSize: 13, color: colors.textMuted, textAlign: 'center' },

  bigAddBtn: { marginBottom: 12 },

  hint: { fontSize: 11, color: colors.textDim, textAlign: 'center', marginBottom: 4 },
  legal: { fontSize: 11.5, color: colors.textMuted, textAlign: 'center' },

  overlay: { flex: 1, justifyContent: 'flex-end' },
  overlayBg: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(4, 6, 12, 0.72)' },
  sheet: {
    backgroundColor: colors.backgroundAlt,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    borderWidth: 1, borderColor: colors.border,
    padding: 24, paddingBottom: 40,
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
    backgroundColor: colors.inputBg, borderRadius: radius.button,
    borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: 14, paddingVertical: 13,
    fontSize: 15, color: colors.text, marginBottom: 16,
  },
  freqRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  freqChip: {
    paddingVertical: 7, paddingHorizontal: 14, borderRadius: 999,
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.ghostBg,
  },
  freqChipActive: {
    borderColor: 'rgba(40, 225, 255, 0.45)',
    backgroundColor: 'rgba(40, 225, 255, 0.18)',
  },
  freqChipText: { fontSize: 13, fontWeight: '600', color: colors.textSoft },
  freqChipTextActive: { color: colors.text, fontWeight: '900' },
  sheetActions: { flexDirection: 'row', gap: 12, marginTop: 6 },
  sheetBtn: { flex: 1 },
  sheetBtnPrimary: { flex: 2 },
});
