import React, { useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, type ScrollViewInstance, StyleSheet, View, useWindowDimensions } from 'react-native';
import { AppText as Text } from './AppText';
import { CheckinDetailModal } from './CheckinDetailModal';
import { useWizard } from '@/store/WizardContext';
import { useTranslation } from '@/hooks/useTranslation';
import { dashboardWeek } from '@/wizard/dashboardWeek';
import { todayISO } from '@/wizard/calendarDate';
import { colors } from '@/theme';

export const RecentUpdateStrip: React.FC<{ onRecord: () => void }> = ({ onRecord }) => {
  const { state } = useWizard();
  const { t, language } = useTranslation();
  const { fontScale } = useWindowDimensions();
  const [stripWidth, setStripWidth] = useState(0);
  const scroll = useRef<ScrollViewInstance>(null);
  const dayKey = todayISO();
  const days = useMemo(() => dashboardWeek(state.checkins), [state.checkins, dayKey]);
  const minimum = fontScale > 1.3 ? 72 : 44;
  const visibleDays = Math.max(1, Math.min(days.length, Math.floor((stripWidth + 4) / (minimum + 4))));
  const dayWidth = Math.max(minimum, (stripWidth - (visibleDays - 1) * 4) / visibleDays);
  const [selected, setSelected] = useState<number | null>(null);
  return <View style={{ gap: 5 }}>
    <View style={styles.surface}>
      <ScrollView horizontal ref={scroll} showsHorizontalScrollIndicator={false} onLayout={event => setStripWidth(event.nativeEvent.layout.width)}
        snapToInterval={dayWidth + 4} decelerationRate="fast"
        onContentSizeChange={width => { if (stripWidth > 0) scroll.current?.scrollTo({ x: Math.max(0, width - stripWidth), animated: false }); }}
        contentContainerStyle={{ flexGrow: 1, gap: 4 }}>
        {days.map(day => {
          const label = day.date.toLocaleDateString(language, { weekday: 'short', month: 'short', day: 'numeric' });
          const content = <>
            <Text style={[styles.weekday, day.today && styles.selectedText]}>{day.date.toLocaleDateString(language, { weekday: 'short' })}</Text>
            <Text style={[styles.number, day.today && styles.selectedText]}>{day.date.getDate()}</Text>
            <View style={[styles.dot, { backgroundColor: day.count ? day.today ? colors.onPrimary : colors.pine2 : 'transparent' }]} />
          </>;
          const style = [styles.day, day.count > 0 && !day.today && styles.done, day.today && styles.now, { width: dayWidth }];
          return day.latestIndex !== null || day.today ? <Pressable key={day.key} accessibilityRole="button" accessibilityLabel={day.count ? t(day.count === 1 ? 'glass.day_recorded_one' : 'glass.day_recorded', { date: label, count: day.count }) : t('glass.day_today', { date: label })} accessibilityState={{ selected: day.today }} onPress={() => day.latestIndex !== null ? setSelected(day.latestIndex) : onRecord()} style={style}>{content}</Pressable> : <View key={day.key} accessible accessibilityLabel={t('glass.day_empty', { date: label })} style={style}>{content}</View>;
        })}
      </ScrollView>
    </View>
    <CheckinDetailModal visible={selected !== null} checkin={selected === null ? null : state.checkins[selected]} index={selected ?? 0} onClose={() => setSelected(null)} />
  </View>;
};
const styles = StyleSheet.create({
  surface: { backgroundColor: 'transparent', borderRadius: 18 },
  day: { minHeight: 72, paddingVertical: 6, paddingHorizontal: 3, gap: 3, alignItems: 'center', justifyContent: 'center', borderRadius: 26, overflow: 'hidden', backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border },
  done: { backgroundColor: colors.primary50, borderColor: colors.sage },
  now: { backgroundColor: colors.buttonPrimary, borderColor: colors.buttonPrimary },
  weekday: { fontSize: 13, lineHeight: 20, color: colors.textMuted },
  number: { fontSize: 18, lineHeight: 25, fontWeight: '700', color: colors.pine },
  selectedText: { color: colors.onPrimary },
  dot: { width: 5, height: 5, borderRadius: 3 },
});
