// "Report for your doctor" on the Home dashboard.
//
// Reuses downloadDoctorReport() from wizard/reports.ts, which already builds
// the report and is shared with ProgressStep and the report picker — this is a
// second entry point, not a second implementation. It is rendered only when a
// check-in exists: a disabled button with nothing behind it is worse than no
// button. The row names the date it will export so there is no doubt what is
// being sent to a clinician.

import React, { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useMedCatalog } from '@/store/MedCatalogContext';
import { useWizard } from '@/store/WizardContext';
import { useTranslation } from '@/hooks/useTranslation';
import { colors, radius, spacing, touchMin } from '@/theme';
import { fmtDate, latestCheckin } from '@/wizard/engine';
import { downloadDoctorReport } from '@/wizard/reports';

export const ReportDownloadRow: React.FC = () => {
  const { state } = useWizard();
  const { catalog } = useMedCatalog();
  const { t, language } = useTranslation();
  const [busy, setBusy] = useState(false);

  const last = latestCheckin(state);
  // Nothing to export, so nothing to show.
  if (!last || !state.checkins.length) return null;

  const onPress = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const ok = await downloadDoctorReport(state, t, state.checkins.length - 1, catalog, language);
      if (!ok) Alert.alert(t('home.report.title'), t('home.report.failed'));
    } catch {
      Alert.alert(t('home.report.title'), t('home.report.failed'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Pressable
      style={[styles.row, busy && styles.rowBusy]}
      onPress={onPress}
      disabled={busy}
      accessibilityRole="button"
      accessibilityState={{ busy, disabled: busy }}
      accessibilityLabel={`${t('home.report.title')}, ${fmtDate(last.dateISO)}`}
    >
      <View style={styles.icon}>
        <Text style={styles.iconText}>↓</Text>
      </View>

      <View style={styles.meta}>
        <Text style={styles.title}>{t('home.report.title')}</Text>
        <Text style={styles.sub} numberOfLines={1}>
          {busy ? t('home.report.working') : t('home.report.sub', { date: fmtDate(last.dateISO) })}
        </Text>
      </View>

      {busy ? (
        <ActivityIndicator color={colors.primary} />
      ) : (
        <View style={styles.btn}>
          <Text style={styles.btnText}>{t('home.report.action')}</Text>
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: touchMin,
    borderRadius: radius.button,
    backgroundColor: 'rgba(15, 23, 54, 0.50)',
    borderWidth: 1,
    borderColor: colors.borderSoft,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    marginTop: spacing.sm,
  },
  rowBusy: { opacity: 0.75 },

  icon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.primary50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: { fontSize: 17, fontWeight: '800', color: colors.primary },

  meta: { flex: 1, minWidth: 0 },
  title: { fontSize: 15, fontWeight: '700', color: colors.text },
  sub: { fontSize: 13, color: colors.textMuted, marginTop: 2 },

  btn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.pill, backgroundColor: colors.primary },
  btnText: { fontSize: 13, fontWeight: '800', color: colors.onPrimary },
});
