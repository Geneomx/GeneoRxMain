import React, { useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AppText as Text } from './AppText';
import { CheckinDetailModal } from './CheckinDetailModal';
import { useWizard } from '@/store/WizardContext';
import { useTranslation } from '@/hooks/useTranslation';
import { dashboardWeek } from '@/wizard/dashboardWeek';
import { todayISO } from '@/wizard/calendarDate';
import { colors, shadow } from '@/theme';

export const RecentUpdateStrip: React.FC<{ onRecord: () => void }> = ({ onRecord }) => {
  const { state } = useWizard();
  const { t, language } = useTranslation();
  const { fontScale } = useWindowDimensions();
  const scroll = useRef<ScrollView>(null);
  const dayKey = todayISO();
  const days = useMemo(() => dashboardWeek(state.checkins), [state.checkins, dayKey]);
  const [selected, setSelected] = useState<number | null>(null);
  return <View style={{ gap: 5 }}>
    <View style={styles.surface}>
      <ScrollView horizontal ref={scroll} showsHorizontalScrollIndicator={false} onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: false })} contentContainerStyle={{ flexGrow: 1 }}>
        {days.map(day => {
          const label = day.date.toLocaleDateString(language, { weekday: 'short', month: 'short', day: 'numeric' });
          const content = <>
            {day.today ? <LinearGradient colors={['#4264B5', '#3159B3']} style={StyleSheet.absoluteFill} /> : null}
            <Text style={[styles.weekday, day.today && styles.white]}>{day.date.toLocaleDateString(language, { weekday: 'short' })}</Text>
            <Text style={[styles.number, day.today && styles.white]}>{day.date.getDate()}</Text>
            <View style={[styles.dot, { backgroundColor: day.count ? day.today ? '#FFFFFF' : '#348462' : 'transparent' }]} />
          </>;
          const style = [styles.day, { minWidth: fontScale > 1.3 ? 72 : 44 }];
          return day.latestIndex !== null || day.today ? <Pressable key={day.key} accessibilityRole="button" accessibilityLabel={day.count ? t(day.count === 1 ? 'glass.day_recorded_one' : 'glass.day_recorded', { date: label, count: day.count }) : t('glass.day_today', { date: label })} accessibilityState={{ selected: day.today }} onPress={() => day.latestIndex !== null ? setSelected(day.latestIndex) : onRecord()} style={style}>{content}</Pressable> : <View key={day.key} accessible accessibilityLabel={t('glass.day_empty', { date: label })} style={style}>{content}</View>;
        })}
      </ScrollView>
    </View>
    <CheckinDetailModal visible={selected !== null} checkin={selected === null ? null : state.checkins[selected]} index={selected ?? 0} onClose={() => setSelected(null)} />
  </View>;
};
const styles = StyleSheet.create({
  surface: { backgroundColor: 'transparent', borderRadius: 18 },
  day: { flex: 1, minHeight: 64, paddingVertical: 5, paddingHorizontal: 3, gap: 3, alignItems: 'center', justifyContent: 'center', borderRadius: 18, overflow: 'hidden' },
  weekday: { fontSize: 15, lineHeight: 21, color: colors.textMuted },
  number: { fontSize: 18, lineHeight: 25, fontWeight: '600', color: colors.text },
  white: { color: '#FFFFFF' },
  dot: { width: 5, height: 5, borderRadius: 3 },
});
