import { medicationAdherence } from '@/wizard/medicationTracking';
import { adherenceLabel } from '@/wizard/medicationTracking';
import React, { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { AppText as Text } from '@/components/AppText';
import { Button } from '@/components/Button';
import { useWizard } from '@/store/WizardContext';
import { useMedCatalog } from '@/store/MedCatalogContext';
import { useToast } from '@/components/Toast';
import { useTranslation } from '@/hooks/useTranslation';
import { fmtDate } from '@/wizard/engine';
import { buildTrackingReportText, downloadDoctorReport } from '@/wizard/reports';
import { colors, radius, spacing } from '@/theme';

type Props = {
  visible: boolean;
  onClose: () => void;
  preferredIndex?: number;
  /** Called after a report is successfully generated/shared. */
  onSuccess?: () => void;
};

export const ReportPickerModal: React.FC<Props> = ({ visible, onClose, preferredIndex, onSuccess }) => {
  const { state } = useWizard();
  const { catalog } = useMedCatalog();
  const { t, language } = useTranslation();
  const toast = useToast();
  const [selected, setSelected] = useState(0);
  const [preview, setPreview] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!visible) return;
    const fallback = state.checkins.length ? state.checkins.length - 1 : 0;
    const idx =
      typeof preferredIndex === 'number' && preferredIndex >= 0 && preferredIndex < state.checkins.length
        ? preferredIndex
        : fallback;
    setSelected(idx); setPreview(false);
  }, [visible, preferredIndex, state.checkins.length]);

  async function handleDownload() {
    if (busy) return; // guard double-taps opening two share sheets
    setBusy(true);
    try {
      const ok = await downloadDoctorReport(state, t, selected, catalog, language);
      if (ok) {
        toast.show(t('toast.report_downloaded'));
        onClose();
        onSuccess?.();
        return;
      }
      // Never fail silently — a bare close is indistinguishable from success
      toast.show(t('toast.report_failed'), 'error');
      onClose();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.title}>{t('modal.report.title')}</Text>
          <Text style={styles.sub}>{t('modal.report.sub')}</Text>

          <ScrollView style={styles.list} bounces={false}>
            {preview ? <Text style={{fontSize: 16,lineHeight: 25,color:colors.textSoft}}>{buildTrackingReportText(state,t,selected,catalog)}</Text> : null}
            {!preview ? <>
            {[...state.checkins].reverse().map((c, displayIndex) => {
              const idx = state.checkins.length - 1 - displayIndex;
              const isOn = idx === selected;
              const isLatest = idx === state.checkins.length - 1;
              return (
                <Pressable
                  key={`${c.dateISO}-${idx}`}
                  onPress={() => setSelected(idx)}
                  style={[styles.item, isOn && styles.itemOn]}
                >
                  <Text style={[styles.itemTitle, isOn && styles.itemTitleOn]}>
                    {t('checkin.label_n')} {idx + 1}
                    {isLatest ? ` · ${t('common.latest')}` : ''}
                  </Text>
                  <Text style={styles.itemSub}>
                    {fmtDate(c.dateISO)} · {t('common.adherence')} {adherenceLabel(medicationAdherence(c), t('checkin.unsure'))}
                  </Text>
                </Pressable>
              );
            })}</> : null}
          </ScrollView>

          <View style={styles.actions}>
            <View style={{ flex: 1 }}>
              <Button title={t('modal.report.close')} variant="secondary" onPress={onClose} />
            </View>
            <View style={{ flex: 1.4 }}>
              <Button title={t(preview ? 'ai.pdf_create' : 'ai.pdf_preview')} loading={busy} disabled={!state.checkins.length || busy} onPress={() => { if (preview) void handleDownload(); else setPreview(true); }} />
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    maxHeight: '75%',
    backgroundColor: colors.backgroundAlt,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  title: { fontSize: 18, fontWeight: '500', color: colors.text },
  sub: { fontSize: 17, color: colors.textMuted, lineHeight: 24 },
  list: { maxHeight: 280, marginVertical: spacing.sm },
  item: {
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    marginBottom: 8,
    backgroundColor: colors.surface,
  },
  itemOn: { borderColor: colors.primary, backgroundColor: colors.primary50 },
  itemTitle: { fontSize: 17, fontWeight: '500', color: colors.text },
  itemTitleOn: { color: colors.primary },
  itemSub: { fontSize: 16, color: colors.textMuted, marginTop: 2 },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
});
