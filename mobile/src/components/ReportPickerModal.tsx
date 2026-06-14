import React, { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/Button';
import { useWizard } from '@/store/WizardContext';
import { useMedCatalog } from '@/store/MedCatalogContext';
import { useToast } from '@/components/Toast';
import { useTranslation } from '@/hooks/useTranslation';
import { fmtDate } from '@/wizard/engine';
import { downloadDoctorReport } from '@/wizard/reports';
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
  const { t } = useTranslation();
  const toast = useToast();
  const [selected, setSelected] = useState(0);

  useEffect(() => {
    if (!visible) return;
    const fallback = state.checkins.length ? state.checkins.length - 1 : 0;
    const idx =
      typeof preferredIndex === 'number' && preferredIndex >= 0 && preferredIndex < state.checkins.length
        ? preferredIndex
        : fallback;
    setSelected(idx);
  }, [visible, preferredIndex, state.checkins.length]);

  async function handleDownload() {
    const ok = await downloadDoctorReport(state, t, selected, catalog);
    if (ok) {
      toast.show(t('toast.report_downloaded'));
      onClose();
      onSuccess?.();
      return;
    }
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.title}>{t('modal.report.title')}</Text>
          <Text style={styles.sub}>{t('modal.report.sub')}</Text>

          <ScrollView style={styles.list} bounces={false}>
            {state.checkins.map((c, idx) => {
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
                    {fmtDate(c.dateISO)} · {t('common.adherence')} {c.adherencePct}%
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <View style={styles.actions}>
            <View style={{ flex: 1 }}>
              <Button title={t('modal.report.close')} variant="secondary" onPress={onClose} />
            </View>
            <View style={{ flex: 1.4 }}>
              <Button title={t('modal.report.download')} onPress={handleDownload} />
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
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
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
  title: { fontSize: 18, fontWeight: '800', color: colors.text },
  sub: { fontSize: 14, color: colors.textMuted, lineHeight: 20 },
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
  itemTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  itemTitleOn: { color: colors.primary },
  itemSub: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
});
