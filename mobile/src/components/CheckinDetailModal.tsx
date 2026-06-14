import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/Button';
import { useTranslation } from '@/hooks/useTranslation';
import { fmtDate, impactLabel } from '@/wizard/engine';
import type { WizardCheckin } from '@/wizard/types';
import { colors, radius, spacing } from '@/theme';

type Props = {
  visible: boolean;
  checkin: WizardCheckin | null;
  index: number;
  onClose: () => void;
};

export const CheckinDetailModal: React.FC<Props> = ({ visible, checkin, index, onClose }) => {
  const { t } = useTranslation();
  if (!checkin) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.title}>
            {t('checkin.label_n')} {index + 1} • {fmtDate(checkin.dateISO)}
          </Text>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.meta}>
              {t('checkin.adherence')}: {checkin.adherencePct}%
            </Text>
            {checkin.supplementsTaken.length ? (
              <Text style={styles.meta}>
                {t('checkin.supplements_title')}: {checkin.supplementsTaken.join(', ')}
              </Text>
            ) : null}
            {checkin.symptoms.items.length ? (
              <View style={styles.block}>
                <Text style={styles.blockTitle}>{t('checkin.symptom_improvement')}</Text>
                {checkin.symptoms.items.map((x) => (
                  <Text key={x.symptom} style={styles.line}>
                    • {x.symptom}: {impactLabel(x.change, t)}
                    {x.severityNow != null ? ` (${x.severityNow}/10)` : ''}
                  </Text>
                ))}
              </View>
            ) : null}
            <View style={styles.block}>
              <Text style={styles.blockTitle}>{t('checkin.wellbeing_title')}</Text>
              {(['energy', 'mood', 'sleep', 'focus'] as const).map((k) => (
                <Text key={k} style={styles.line}>
                  {t(`wellbeing.${k}`)}: {checkin.wellbeing[k]}/10
                </Text>
              ))}
            </View>
            {checkin.sideEffects ? (
              <Text style={styles.meta}>
                {t('checkin.side_effects')}: {checkin.sideEffects}
              </Text>
            ) : null}
            {checkin.notes ? (
              <Text style={styles.meta}>
                {t('checkin.notes')}: {checkin.notes}
              </Text>
            ) : null}
          </ScrollView>
          <Button title={t('modal.snapshot.close')} variant="secondary" onPress={onClose} />
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  sheet: {
    backgroundColor: colors.backgroundAlt,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
    maxHeight: '82%',
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  title: { fontSize: 17, fontWeight: '800', color: colors.text },
  meta: { fontSize: 13, color: colors.textSoft, lineHeight: 19, marginBottom: 4 },
  block: { gap: 4, marginVertical: spacing.sm },
  blockTitle: { fontSize: 13, fontWeight: '700', color: colors.text },
  line: { fontSize: 13, color: colors.textSoft, lineHeight: 19 },
});
