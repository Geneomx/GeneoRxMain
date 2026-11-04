import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText as Text } from '@/components/AppText';
import { AppIcon } from '@/components/AppIcon';
import { AskBubble } from '@/components/AskBubble';
import { BrandIdentity } from '@/components/BrandHeader';
import { useTranslation } from '@/hooks/useTranslation';
import { colors } from '@/theme';

/** The logo and the Ask GeneoRx assistant, one tap away on every main tab. */
export const TopBar: React.FC<{ onReviewSymptoms?: () => void }> = ({ onReviewSymptoms }) => {
  const { t } = useTranslation();
  return <View style={styles.bar}>
    <BrandIdentity />
    <AskBubble onReviewSymptoms={onReviewSymptoms} trigger={open => <Pressable accessibilityRole="button" accessibilityLabel={t('ai.general_title')} onPress={open} style={({ pressed }) => [styles.pill, pressed && { opacity: 0.7 }]}>
      <AppIcon name="spark" size={18} color={colors.pine} />
      <Text style={styles.text}>{t('ai.general_title')}</Text>
    </Pressable>} />
  </View>;
};

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  pill: { minHeight: 44, flexShrink: 1, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, borderRadius: 22, backgroundColor: colors.primary50, borderWidth: 1.5, borderColor: colors.sage },
  text: { flexShrink: 1, fontSize: 15, lineHeight: 20, fontWeight: '700', color: colors.pine },
});
