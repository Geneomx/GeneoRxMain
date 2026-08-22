import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Polyline, Text as SvgText } from 'react-native-svg';
import { colors } from '@/theme';

export interface TrendLine {
  label: string;
  color: string;
  /** Points as [timestampMs, value]. Sparse series are fine. */
  points: Array<[number, number]>;
}

interface Props {
  lines: TrendLine[];
  /** Inclusive x-axis bounds in ms. */
  fromT: number;
  toT: number;
  /** Y-axis max (e.g. 10 for wellbeing, 100 for adherence). */
  yMax: number;
  height?: number;
  /** Short y-axis caption, e.g. "0–10". */
  yCaption?: string;
}

const H_PAD = 8;
const V_PAD = 10;

/**
 * A small multi-line time-series chart for the Progress trends. Pure SVG so it
 * needs no chart library; react-native-svg is already a dependency. Handles
 * sparse lines (a symptom that appears in only some check-ins) and a
 * single-point series (draws a dot, since a one-point line is invisible).
 */
export const TrendChart: React.FC<Props> = ({ lines, fromT, toT, yMax, height = 140, yCaption }) => {
  // Measured lazily from layout so the chart fills its container width.
  const [width, setWidth] = React.useState(0);

  const span = Math.max(1, toT - fromT);
  const plotW = Math.max(1, width - H_PAD * 2);
  const plotH = Math.max(1, height - V_PAD * 2);

  const x = (t: number) => H_PAD + ((t - fromT) / span) * plotW;
  const y = (v: number) => V_PAD + (1 - Math.max(0, Math.min(yMax, v)) / yMax) * plotH;

  const hasData = lines.some((l) => l.points.length > 0);

  return (
    <View>
      <View style={styles.chartBox} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
        {width > 0 && (
          <Svg width={width} height={height}>
            {/* horizontal gridlines at 0 / 50% / 100% of yMax */}
            {[0, 0.5, 1].map((f) => (
              <Line
                key={f}
                x1={H_PAD}
                x2={width - H_PAD}
                y1={V_PAD + f * plotH}
                y2={V_PAD + f * plotH}
                stroke={colors.borderSoft}
                strokeWidth={1}
              />
            ))}
            {lines.map((line) => {
              if (line.points.length === 0) return null;
              if (line.points.length === 1) {
                const [t, v] = line.points[0];
                return <Circle key={line.label} cx={x(t)} cy={y(v)} r={3} fill={line.color} />;
              }
              const pts = line.points.map(([t, v]) => `${x(t)},${y(v)}`).join(' ');
              return (
                <Polyline
                  key={line.label}
                  points={pts}
                  fill="none"
                  stroke={line.color}
                  strokeWidth={2}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              );
            })}
            {yCaption ? (
              <SvgText x={H_PAD} y={V_PAD + 2} fontSize={9} fill={colors.textDim}>
                {yCaption}
              </SvgText>
            ) : null}
          </Svg>
        )}
        {!hasData && <Text style={styles.empty}>Not enough check-ins yet</Text>}
      </View>
      <View style={styles.legend}>
        {lines.map((line) => (
          <View key={line.label} style={styles.legendItem}>
            <View style={[styles.swatch, { backgroundColor: line.color }]} />
            <Text style={styles.legendLabel}>{line.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  chartBox: { position: 'relative', width: '100%', justifyContent: 'center' },
  empty: {
    position: 'absolute',
    alignSelf: 'center',
    color: colors.textDim,
    fontSize: 13,
  },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  swatch: { width: 10, height: 10, borderRadius: 3 },
  legendLabel: { fontSize: 12, color: colors.textMuted },
});
