import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius } from '@/theme';

/**
 * A labelled horizontal bar. Used by Body Systems and the Depletion Risk
 * scoreboard.
 *
 * `value === null` means the question was not answered: the track renders empty
 * and the figure is an em dash. It is deliberately NOT a zero-width bar, which
 * would read identically to a genuine score of 0.
 */
type Props = {
  label: string;
  value: number | null;
  max?: number;
  /** Shown on the right; defaults to the rounded value. */
  display?: string;
  tone?: 'brand' | 'good' | 'warn' | 'bad';
};

const TONES: Record<NonNullable<Props['tone']>, string> = {
  brand: colors.primary,
  good: colors.success,
  warn: colors.warning,
  bad: colors.danger,
};

export const MeterRow: React.FC<Props> = ({ label, value, max = 10, display, tone = 'brand' }) => {
  const answered = typeof value === 'number' && Number.isFinite(value);
  const pct = answered ? Math.max(0, Math.min(1, value / max)) * 100 : 0;

  return (
    <View style={styles.row}>
      <Text style={[styles.label, !answered && styles.dim]} numberOfLines={1}>
        {label}
      </Text>
      <View style={styles.track}>
        {answered ? <View style={[styles.fill, { width: `${pct}%`, backgroundColor: TONES[tone] }]} /> : null}
      </View>
      <Text style={[styles.value, !answered && styles.dim]}>
        {display ?? (answered ? String(Math.round(value * 10) / 10) : '—')}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 5 },
  label: { flex: 0, width: 92, fontSize: 13, color: colors.textSoft },
  track: { flex: 1, height: 6, borderRadius: 3, backgroundColor: colors.surfaceAlt, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: radius.sm },
  value: { width: 36, textAlign: 'right', fontSize: 13, fontWeight: '700', color: colors.text },
  dim: { color: colors.textDim },
});
