import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText as Text } from '@/components/AppText';
import { useWizard } from '@/store/WizardContext';
import { useTranslation } from '@/hooks/useTranslation';
import { colors } from '@/theme';
import { useAuth } from '@/auth/AuthContext';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

export const SaveState: React.FC = () => {
  const { saveStatus, retrySave } = useWizard();
  const { t } = useTranslation();
  const { isGuest } = useAuth();
  const { ready, online } = useNetworkStatus();
  if (saveStatus === 'saved' || (isGuest && saveStatus === 'device')) return null;
  if (ready && !online && (saveStatus === 'device' || saveStatus === 'pending')) return null;
  const retry = saveStatus === 'pending' || saveStatus === 'error' || saveStatus === 'unavailable' || (!isGuest && saveStatus === 'device');
  const bad = saveStatus === 'error' || saveStatus === 'unavailable';
  const busy = saveStatus === 'saving' || saveStatus === 'loading';
  const tone = bad ? { fg: colors.danger } : busy ? { fg: colors.primaryDark } : { fg: colors.warning };
  return <View style={[styles.row, bad && styles.alert]} accessibilityLiveRegion={bad ? 'assertive' : 'polite'}>
    <View style={[styles.pill, { backgroundColor: 'transparent' }]}>
      <View style={[styles.dot, { backgroundColor: tone.fg }]} accessible={false} />
      <Text style={[styles.text, { color: tone.fg }]}>{t(`tracking.save.${saveStatus}`)}</Text>
    </View>
    {retry ? <Pressable accessibilityRole="button" onPress={() => { void retrySave().catch(() => undefined); }} style={styles.retry}><Text style={styles.link}>{t('tracking.retry')}</Text></Pressable> : null}
  </View>;
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, minHeight: 32 },
  alert: { backgroundColor: colors.dangerBg, borderRadius: 14, borderWidth: 1, borderColor: colors.danger, paddingHorizontal: 12, paddingVertical: 5 },
  pill: { flexShrink: 1, flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 999, paddingVertical: 6, paddingHorizontal: 0 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  text: { flexShrink: 1, fontSize: 15, lineHeight: 21, fontWeight: '500', color: colors.textMuted },
  error: { color: colors.danger },
  retry: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 8 },
  link: { fontSize: 15, color: colors.primary, fontWeight: '500' },
});
