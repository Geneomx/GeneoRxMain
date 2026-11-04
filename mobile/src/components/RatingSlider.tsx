import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText as Text } from './AppText';
import { AppIcon, type AppIconName } from './AppIcon';
import { useTranslation } from '@/hooks/useTranslation';
import { colors } from '@/theme';

/** Every exact rating is a labeled tap target; an unanswered rating stays null. */
export const RatingSlider: React.FC<{
  label: string; value: number | null; onChange: (value: number) => void;
  hint?: string; icon?: AppIconName; minLabel?: string; maxLabel?: string; emptyLabel?: string;
}> = ({ label, value, onChange, hint, icon, minLabel, maxLabel, emptyLabel }) => {
  const { t } = useTranslation();
  return <View style={s.wrap}>
    <View style={s.head}>{icon ? <AppIcon name={icon} size={22} /> : null}<View style={{ flex: 1, gap: 4 }}><Text style={s.label}>{label}</Text>{hint ? <Text style={s.hint}>{hint}</Text> : null}</View><Text style={s.value}>{value === null ? (emptyLabel || '—') : `${value}/10`}</Text></View>
    <View style={s.exact}>{Array.from({ length: 11 }, (_, score) => <Pressable key={score} accessibilityRole="button" accessibilityLabel={`${label}: ${score}/10`} accessibilityState={{ selected: value === score }} onPress={() => onChange(score)} style={[s.number, value === score && s.selected]}><Text style={[s.label, value === score && { color: colors.onPrimary }]}>{score}</Text></Pressable>)}</View>
    <View style={s.endpoints}><Text style={s.hint}>{minLabel || t('easy.rating_low')}</Text><Text style={s.hint}>{maxLabel || t('easy.rating_high')}</Text></View>
  </View>;
};
const s = StyleSheet.create({
  wrap: { gap: 10, paddingVertical: 8 }, head: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  label: { color: colors.text, fontSize: 17, lineHeight: 25, fontWeight: '500' }, value: { color: colors.primary, fontSize: 16, fontWeight: '500', flexShrink: 1 },
  hint: { color: colors.textMuted, fontSize: 15, lineHeight: 23, flexShrink: 1 },
  selected: { backgroundColor: colors.primary },
  exact: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 }, number: { flexGrow: 1, maxWidth: 64, minWidth: 48, minHeight: 48, padding: 10, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: colors.surfaceAlt },
  endpoints: { flexDirection: 'row', justifyContent: 'space-between', gap: 16 },
});
