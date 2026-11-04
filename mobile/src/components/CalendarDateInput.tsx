import React from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { AppText as Text } from '@/components/AppText';
import { Input } from './Input';
import { colors } from '@/theme';
import { useTranslation } from '@/hooks/useTranslation';

/** Month/day/year entry keeps an ISO value for storage without exposing it as the UI. */
export const CalendarDateInput: React.FC<{ label: string; value: string; onChange: (value: string) => void; error?: string }> = ({ label, value, onChange, error }) => {
  const { t } = useTranslation();
  const { fontScale } = useWindowDimensions();
  const [year = '', month = '', day = ''] = value.split('-');
  const change = (part: number, next: string) => {
    const parts = [year, month, day];
    parts[part] = next.replace(/\D/g, '');
    onChange(parts.every(item => !item) ? '' : parts.join('-'));
  };
  return <View style={styles.wrap}>
    <Text style={styles.label}>{label}</Text>
    <View style={[styles.row, fontScale > 1.3 && styles.rowLarge]}>
      <View style={[styles.cell, fontScale > 1.3 && styles.cellLarge]}><Input label={t('tracking.month')} accessibilityLabel={`${label}, ${t('tracking.month')}`} value={month} onChangeText={text => change(1, text)} maxLength={2} placeholder="MM" keyboardType="number-pad" /></View>
      <View style={[styles.cell, fontScale > 1.3 && styles.cellLarge]}><Input label={t('tracking.day')} accessibilityLabel={`${label}, ${t('tracking.day')}`} value={day} onChangeText={text => change(2, text)} maxLength={2} placeholder="DD" keyboardType="number-pad" /></View>
      <View style={[styles.cell, fontScale > 1.3 && styles.cellLarge]}><Input label={t('tracking.year')} accessibilityLabel={`${label}, ${t('tracking.year')}`} value={year} onChangeText={text => change(0, text)} maxLength={4} placeholder="YYYY" keyboardType="number-pad" /></View>
    </View>
    {error ? <Text style={styles.error}>{error}</Text> : null}
  </View>;
};
const styles = StyleSheet.create({ wrap: { gap: 8 }, row: { flexDirection: 'row', gap: 8 }, rowLarge: { flexDirection: 'column' }, cell: { flex: 1 }, cellLarge: { flex: 0, width: '100%' }, label: { fontSize: 16, color: colors.text }, error: { fontSize: 15, color: colors.danger } });
