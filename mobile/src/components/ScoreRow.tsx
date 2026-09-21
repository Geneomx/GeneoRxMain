// A single score on the Home dashboard.
//
// This replaced three side-by-side tiles that showed bare numbers. They were
// about 110px wide — too narrow for any explanation — and, worse, they were not
// on the same scale: weekly health and completion are 0-100 while the body
// systems average is 0-10. Three identical boxes reading 78 / 64 / 6.2 invited
// the reading that body systems had collapsed, when 6.2 of 10 was the best of
// the three. Every value therefore states its unit, and an unanswered score
// shows a dash with the reason it is empty — never a zero.

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, spacing, touchMin } from '@/theme';

export const ScoreRow: React.FC<{
  title: string;
  /** Plain-language description. Always shown. */
  description: string;
  /** The number, or null when it cannot be computed yet. */
  value: number | null;
  /** "out of 100" / "out of 10". Required whenever there is a value. */
  unit: string;
  /** Accent for the number. Falls back to body text. */
  tint?: string;
  /** "5 of 7 answered" — shown when the score has one. */
  answered?: string | null;
  /** Why the score is empty, e.g. "After your first check-in". */
  emptyReason?: string;
  /** Change vs the previous period, already formatted. */
  delta?: string | null;
  onPress?: () => void;
}> = ({ title, description, value, unit, tint, answered, emptyReason, delta, onPress }) => {
  const hasValue = typeof value === 'number' && Number.isFinite(value);
  const footnote = hasValue ? answered : emptyReason;

  return (
    <Pressable
      onPress={onPress}
      style={styles.row}
      accessibilityRole="button"
      accessibilityLabel={
        hasValue ? `${title}, ${value} ${unit}${answered ? `, ${answered}` : ''}` : `${title}, ${emptyReason ?? ''}`
      }
    >
      <View style={styles.meta}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
        {footnote ? <Text style={styles.footnote}>{footnote}</Text> : null}
      </View>

      <View style={styles.valueCol}>
        {hasValue ? (
          <>
            <Text style={[styles.value, tint ? { color: tint } : null]}>{value}</Text>
            <Text style={styles.unit}>{unit}</Text>
            {delta ? <Text style={styles.delta}>{delta}</Text> : null}
          </>
        ) : (
          <Text style={styles.dash}>—</Text>
        )}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingVertical: 13,
    minHeight: touchMin,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSoft,
  },
  meta: { flex: 1, minWidth: 0 },
  title: { fontSize: 16, fontWeight: '700', color: colors.text },
  description: { fontSize: 14, lineHeight: 19, color: colors.textMuted, marginTop: 2 },
  footnote: { fontSize: 11, color: colors.textDim, marginTop: 4, letterSpacing: 0.3 },

  valueCol: { alignItems: 'flex-end' },
  value: {
    fontSize: 26,
    fontWeight: '800',
    lineHeight: 28,
    letterSpacing: -0.6,
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  unit: { fontSize: 11, color: colors.textMuted },
  delta: { fontSize: 13, fontWeight: '700', color: colors.success, marginTop: 2 },
  dash: { fontSize: 26, fontWeight: '600', lineHeight: 28, color: colors.textDim },
});
