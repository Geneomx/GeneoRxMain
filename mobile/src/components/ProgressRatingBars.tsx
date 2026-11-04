import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { AppText as Text } from './AppText';
import { useTranslation } from '@/hooks/useTranslation';
import { progressPalette as palette } from '@/theme/progress';
import type { ProgressPoint } from '@/wizard/progressChart';

export function ProgressRatingBars({ points, highlighted, onOpen }: {
  points: ProgressPoint[]; highlighted?: string; onOpen: (point: ProgressPoint) => void;
}) {
  const { t, language } = useTranslation();
  const { fontScale } = useWindowDimensions();
  const [plotWidth, setPlotWidth] = useState(0);
  const dayKey = (time: number) => new Date(time).toLocaleDateString(language);
  const sameMonth = new Set(points.map(point => `${new Date(point.time).getFullYear()}-${new Date(point.time).getMonth()}`)).size <= 1;
  const minColumnWidth = fontScale > 1.3 ? 82 : sameMonth ? 44 : 64;
  const visibleColumns = Math.max(1, Math.min(points.length, Math.floor((plotWidth + 8) / (minColumnWidth + 8))));
  const columnWidth = Math.max(minColumnWidth, (plotWidth - (visibleColumns - 1) * 8) / visibleColumns);
  const counts = new Map<string, number>();
  points.forEach(point => counts.set(dayKey(point.time), (counts.get(dayKey(point.time)) || 0) + 1));
  const seen = new Map<string, number>();
  // Keep the 0–10 scale fixed (13 px per point), but avoid a large empty
  // ceiling when all recorded values are low. Text still grows with the OS.
  const plotHeight = Math.max(90, Math.max(...points.map(point => point.value ?? 0), 0) * 13 + 20 * fontScale + 8);
  return <ScrollView horizontal showsHorizontalScrollIndicator={points.length > visibleColumns}
    onLayout={event => setPlotWidth(event.nativeEvent.layout.width)} snapToInterval={columnWidth + 8} decelerationRate="fast"
    contentContainerStyle={styles.plot}>
    {points.map((point, index) => {
      const key = dayKey(point.time);
      const occurrence = (seen.get(key) || 0) + 1;
      seen.set(key, occurrence);
      const duplicate = counts.get(key)! > 1;
      const date = new Date(point.time).toLocaleDateString(language, { day: 'numeric', ...(!sameMonth ? { month: 'short' as const } : {}) });
      const fullDate = new Date(point.time).toLocaleDateString(language, { year: 'numeric', month: 'long', day: 'numeric' });
      const rating = point.value === null ? t('progress_view.not_rated') : t('progress_view.rating_value', { value: point.value });
      return <Pressable key={point.key} accessibilityRole="button"
        accessibilityLabel={t('progress_view.open_rating', { date: fullDate, rating, index: index + 1 })}
        onPress={() => onOpen(point)} style={({ pressed }) => [styles.column, { width: columnWidth }, pressed && { opacity: 0.65 }]}>
        <View style={[styles.barArea, { height: plotHeight }]}>
          <Text style={styles.value}>{point.value ?? '—'}</Text>
          <View style={[styles.bar, { height: point.value === null ? 7 : Math.max(3, point.value * 13),
            backgroundColor: point.value === null ? palette.border : point.key === highlighted ? palette.accent : palette.soft }]} />
        </View>
        <Text style={styles.date}>{date}</Text>
        {duplicate ? <Text style={styles.sequence}>#{occurrence}</Text> : null}
      </Pressable>;
    })}
  </ScrollView>;
}

const styles = StyleSheet.create({
  plot: { flexGrow: 1, alignItems: 'flex-start', gap: 8, paddingBottom: 4 },
  column: { alignItems: 'center', paddingVertical: 6, gap: 7 },
  barArea: { alignItems: 'center', justifyContent: 'flex-end', gap: 8 },
  bar: { width: 29, borderTopLeftRadius: 6, borderTopRightRadius: 6 },
  value: { color: palette.muted, fontSize: 14, lineHeight: 20 },
  date: { color: palette.muted, fontSize: 14, lineHeight: 20, textAlign: 'center' },
  sequence: { color: palette.muted, fontSize: 12, lineHeight: 18 },
});
