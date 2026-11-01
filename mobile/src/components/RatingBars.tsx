import React, { useRef } from 'react';
import { Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AppText as Text } from './AppText';
import type { RecordedRating } from '@/wizard/ratingBars';
import { useTranslation } from '@/hooks/useTranslation';
import { colors } from '@/theme';

export const RatingBars: React.FC<{ points: RecordedRating[]; selected?: string; onSelect: (key: string) => void }> = ({ points, selected, onSelect }) => {
  const { t, language } = useTranslation();
  const { fontScale } = useWindowDimensions();
  const scroll = useRef<ScrollView>(null);
  return <ScrollView ref={scroll} horizontal showsHorizontalScrollIndicator={false} onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: false })} contentContainerStyle={styles.content}>
    {points.map((point, index) => {
      const date = new Date(point.time).toLocaleDateString(language, { month: 'short', day: 'numeric', ...(new Date(point.time).getFullYear() !== new Date().getFullYear() ? { year: 'numeric' } : {}) });
      return <Pressable key={point.key} accessibilityRole="button" accessibilityLabel={t('calm.rating_entry', { date, value: point.value, index: index + 1 })} accessibilityState={{ selected: point.key === selected }} onPress={() => onSelect(point.key)} style={[styles.column, { minWidth: fontScale > 1.3 ? 78 : 44 }]}>
        <View style={styles.track}><View style={[styles.fill, { height: Math.max(3, point.value / 10 * 124) }]}>{point.key === selected ? <LinearGradient colors={['#7291DA', '#3159B3']} style={StyleSheet.absoluteFill} /> : null}</View></View>
        <Text style={styles.date}>{date}</Text>
      </Pressable>;
    })}
  </ScrollView>;
};
const styles = StyleSheet.create({
  content: { flexGrow: 1, gap: 10, alignItems: 'stretch', paddingTop: 6 },
  column: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', gap: 12, paddingHorizontal: 1 },
  track: { height: 124, width: 36, borderRadius: 13, backgroundColor: '#EEF2FA', justifyContent: 'flex-end', overflow: 'hidden' },
  fill: { width: '100%', borderRadius: 13, backgroundColor: '#D1DEF7', overflow: 'hidden' },
  date: { fontSize: 15, lineHeight: 22, textAlign: 'center', color: colors.textMuted },
});
