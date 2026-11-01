import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText as Text } from '@/components/AppText';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from '@/hooks/useTranslation';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { colors } from '@/theme';
import { useWizard } from '@/store/WizardContext';

/** Inline offline notice — sits in layout flow (does not overlap headers). */
export const OfflineBanner: React.FC<{ respectStatusBar?: boolean }> = ({ respectStatusBar = false }) => {
  const { t } = useTranslation();
  const { online, ready } = useNetworkStatus();
  const { saveStatus, hydrated } = useWizard();
  const insets = useSafeAreaInsets();

  if (!ready || online) return null;

  return (
    <View style={[styles.wrap, { paddingTop: (respectStatusBar ? insets.top : 0) + 4 }]} accessibilityLiveRegion="polite">
      <View style={styles.banner}>
        <View style={styles.dot} accessible={false} />
        <Text style={styles.bannerText}>{t(hydrated && ['saved', 'device', 'pending'].includes(saveStatus) ? 'polish.offline_saved' : 'polish.offline')}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 20,
    paddingBottom: 2,
    backgroundColor: colors.background,
  },
  banner: {
    flexDirection: 'row',
    gap: 7,
    paddingVertical: 2,
    alignItems: 'center',
  },
  bannerText: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.warning,
    flex: 1,
    lineHeight: 21,
  },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.warning },
});
