import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Loader } from '@/components/Loader';
import { ReportPickerModal } from '@/components/ReportPickerModal';
import { useWizard } from '@/store/WizardContext';
import { useMedCatalog } from '@/store/MedCatalogContext';
import { useToast } from '@/components/Toast';
import { CheckinStep } from '@/screens/wizard/steps/CheckinStep';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { useTranslation } from '@/hooks/useTranslation';
import { shareClinicianSnapshot } from '@/wizard/reports';
import { colors, radius, spacing } from '@/theme';

export const CheckInsScreen: React.FC = () => {
  const { state, hydrated } = useWizard();
  const { catalog } = useMedCatalog();
  const { t } = useTranslation();
  const toast = useToast();
  const { page, scrollBottom } = useResponsiveLayout();
  const [reportPickerOpen, setReportPickerOpen] = useState(false);

  if (!hydrated) return <Loader />;

  async function handleShare() {
    const ok = await shareClinicianSnapshot(state, t, { catalog, title: t('portal.share') });
    if (ok) toast.show(t('toast.shared'));
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: scrollBottom }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={page}>
          <View style={styles.header}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.pageTitle} numberOfLines={2}>{t('mobile.tab.checkin')}</Text>
              <Text style={styles.pageSub}>{t('checkin.sub')}</Text>
            </View>
            <View style={styles.headerActions}>
              <Pressable style={styles.headerBtn} onPress={handleShare}>
                <Text style={styles.headerBtnText}>{t('portal.share')}</Text>
              </Pressable>
              {state.checkins.length ? (
                <Pressable style={styles.headerBtn} onPress={() => setReportPickerOpen(true)}>
                  <Text style={styles.headerBtnText}>{t('progress.download_report')}</Text>
                </Pressable>
              ) : null}
            </View>
          </View>
          <CheckinStep />
          <Text style={styles.legal}>{t('mobile.legal')}</Text>
        </View>
      </ScrollView>
      <ReportPickerModal visible={reportPickerOpen} onClose={() => setReportPickerOpen(false)} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { alignItems: 'center', paddingTop: spacing.md, gap: spacing.md },
  header: { gap: 10, marginBottom: spacing.sm },
  pageTitle: { fontSize: 26, fontWeight: '800', color: colors.text, letterSpacing: -0.5 },
  pageSub: { fontSize: 14, color: colors.textMuted, lineHeight: 20 },
  headerActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  headerBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.ghostBg,
  },
  headerBtnText: { fontSize: 12, fontWeight: '700', color: colors.textSoft },
  legal: { fontSize: 11, color: colors.textDim, textAlign: 'center', marginTop: spacing.md },
});
