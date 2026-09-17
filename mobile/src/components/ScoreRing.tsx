import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { colors } from '@/theme';

/**
 * Arc gauge. Extracted from the AdherenceRing that was inlined in HomeScreen so
 * Insights, Results and Home all draw the same ring instead of three copies.
 *
 * `value` may be null — that renders the track with an em dash rather than a
 * zero-length arc, because "not answered" must never read as a score of 0.
 */
type Props = {
  value: number | null;
  max?: number;
  size?: number;
  stroke?: number;
  label?: string;
  color?: string;
  /** Use the brand cyan->violet sweep instead of a flat colour. */
  gradient?: boolean;
};

export const ScoreRing: React.FC<Props> = ({
  value,
  max = 100,
  size = 74,
  stroke = 7,
  label,
  color = colors.primary,
  gradient = false,
}) => {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const hasValue = typeof value === 'number' && Number.isFinite(value);
  const pct = hasValue ? Math.max(0, Math.min(1, value / max)) : 0;
  const gradId = `ring-${size}-${stroke}`;

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        {gradient && (
          <Defs>
            <LinearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0%" stopColor={colors.primary} />
              <Stop offset="100%" stopColor={colors.violet} />
            </LinearGradient>
          </Defs>
        )}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="rgba(255, 255, 255, 0.08)"
          strokeWidth={stroke}
          fill="none"
        />
        {hasValue && (
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={gradient ? `url(#${gradId})` : color}
            strokeWidth={stroke}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${c}`}
            strokeDashoffset={c * (1 - pct)}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        )}
      </Svg>
      <View style={styles.center} pointerEvents="none">
        <Text style={[styles.value, { fontSize: Math.round(size * 0.27) }]}>
          {hasValue ? Math.round(value) : '—'}
        </Text>
        {label ? <Text style={styles.label}>{label}</Text> : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  center: { position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center' },
  value: { fontWeight: '800', color: colors.text, letterSpacing: -0.5 },
  label: { fontSize: 9, color: colors.textMuted, marginTop: 1 },
});
