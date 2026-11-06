import React, { useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, type ScrollViewInstance, StyleSheet, View, useWindowDimensions } from 'react-native';
import { AppText as Text } from './AppText';
import { CheckinDetailModal } from './CheckinDetailModal';
import { useWizard } from '@/store/WizardContext';
import { useTranslation } from '@/hooks/useTranslation';
import { dashboardWeek } from '@/wizard/dashboardWeek';
import { todayISO } from '@/wizard/calendarDate';
import Svg, { Circle } from 'react-native-svg';
import { medicationAdherence } from '@/wizard/medicationTracking';
import { colors } from '@/theme';

const RING = 40;
const STROKE = 3;
const RADIUS = (RING - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/** A thin ring that fills with the day's medicine percentage. Without a percentage it is drawn full but faint. */
const DayRing: React.FC<{ percent: number | null }> = ({ percent }) => {
  const known = typeof percent === 'number' && Number.isFinite(percent);
  const filled = known ? Math.max(0, Math.min(100, percent)) / 100 : 1;
  return <Svg width={RING} height={RING} style={styles.ring} pointerEvents="none">
    <Circle cx={RING / 2} cy={RING / 2} r={RADIUS} stroke="#E5E5EA" strokeWidth={STROKE} fill="none" />
    <Circle cx={RING / 2} cy={RING / 2} r={RADIUS} stroke={known ? colors.buttonPrimary : '#B5D4F4'} strokeWidth={STROKE} fill="none" strokeLinecap="round" strokeDasharray={`${CIRCUMFERENCE * filled} ${CIRCUMFERENCE}`} transform={`rotate(-90 ${RING / 2} ${RING / 2})`} />
  </Svg>;
};

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
            <Text style={[styles.weekday, day.today && styles.weekdayNow]}>{day.date.toLocaleDateString(language, { weekday: 'short' })}</Text>
            <View style={styles.circle}>
              {day.count ? <DayRing percent={medicationAdherence(state.checkins[day.latestIndex!])} /> : null}
              <View style={[styles.inner, day.today && styles.now]}><Text style={[styles.number, day.today && styles.selectedText]}>{day.date.getDate()}</Text></View>
            </View>
          </>;
          const style = [styles.day, { width: dayWidth }];
          return day.latestIndex !== null || day.today ? <Pressable key={day.key} accessibilityRole="button" accessibilityLabel={day.count ? t(day.count === 1 ? 'glass.day_recorded_one' : 'glass.day_recorded', { date: label, count: day.count }) : t('glass.day_today', { date: label })} accessibilityState={{ selected: day.today }} onPress={() => day.latestIndex !== null ? setSelected(day.latestIndex) : onRecord()} style={style}>{content}</Pressable> : <View key={day.key} accessible accessibilityLabel={t('glass.day_empty', { date: label })} style={style}>{content}</View>;
        })}
      </ScrollView>
    </View>
    <CheckinDetailModal visible={selected !== null} checkin={selected === null ? null : state.checkins[selected]} index={selected ?? 0} onClose={() => setSelected(null)} />
  </View>;
};
const styles = StyleSheet.create({
  surface: { backgroundColor: 'transparent', borderRadius: 18 },
  day: { minHeight: 72, paddingVertical: 4, gap: 4, alignItems: 'center', justifyContent: 'center' },
  circle: { width: RING, height: RING, alignItems: 'center', justifyContent: 'center' },
  ring: { position: 'absolute', top: 0, left: 0 },
  inner: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  now: { backgroundColor: colors.buttonPrimary },
  weekday: { fontSize: 13, lineHeight: 18, color: colors.textMuted },
  weekdayNow: { color: colors.buttonPrimary, fontWeight: '600' },
  number: { fontSize: 18, lineHeight: 24, fontWeight: '600', color: colors.pine },
  selectedText: { color: colors.onPrimary },
});
