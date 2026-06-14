import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from '@/hooks/useTranslation';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { colors, radius } from '@/theme';

/** Inline offline notice — sits in layout flow (does not overlap headers). */
export const OfflineBanner: React.FC = () => {
  const { t } = useTranslation();
  const { online, ready } = useNetworkStatus();
  const insets = useSafeAreaInsets();

  if (!ready || online) return null;

  return (
    <View style={[styles.wrap, { paddingTop: insets.top > 0 ? 4 : 8 }]}>
      <View style={styles.banner}>
        <Text style={styles.bannerText}>{t('mobile.offline.banner')}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    backgroundColor: colors.background,
  },
  banner: {
    backgroundColor: colors.warningBg,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.35)',
    borderRadius: radius.button,
    paddingVertical: 8,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  bannerText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.warning,
    textAlign: 'center',
  },
});
