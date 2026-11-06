import React from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { AppText as Text } from '@/components/AppText';
import Svg, { Circle, Defs, Line, LinearGradient, Path, Polyline, Stop, Text as SvgText } from 'react-native-svg';
import { colors } from '@/theme';
import { useTranslation } from '@/hooks/useTranslation';

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
  compact?: boolean;
  emphasize?: boolean;
}

const H_PAD = 8;
const V_PAD = 10;

/**
 * A small multi-line time-series chart for the Progress trends. Pure SVG so it
 * needs no chart library; react-native-svg is already a dependency. Handles
 * sparse lines (a symptom that appears in only some check-ins) and a
 * single-point series (draws a dot, since a one-point line is invisible).
 */
export const TrendChart: React.FC<Props> = ({ lines, fromT, toT, yMax, height = 140, yCaption, compact = false, emphasize = false }) => {
  // Measured lazily from layout so the chart fills its container width.
  const [width, setWidth] = React.useState(0);
  const { t } = useTranslation();
  const { fontScale } = useWindowDimensions();
  const gradientId = React.useId().replace(/[^a-zA-Z0-9]/g, '');
  const labelSize = 15 * fontScale;
  const horizontalPad = emphasize ? 20 : H_PAD;
  const verticalPad = emphasize ? labelSize + 12 : V_PAD;

  const span = Math.max(1, toT - fromT);
  const plotW = Math.max(1, width - horizontalPad * 2);
  const plotH = Math.max(1, height - verticalPad * 2);

  const x = (t: number) => fromT === toT ? width / 2 : horizontalPad + ((t - fromT) / span) * plotW;
  const y = (v: number) => verticalPad + (1 - Math.max(0, Math.min(yMax, v)) / yMax) * plotH;

  const hasData = lines.some((l) => l.points.length > 0);

  return (
    <View>
      <View style={styles.chartBox} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
        {width > 0 && (
          <Svg width={width} height={height}>
            {emphasize ? <Defs>{lines.map((line, index) => <LinearGradient key={line.label} id={`${gradientId}${index}`} x1="0%" y1="0%" x2="0%" y2="100%"><Stop offset="0%" stopColor={line.color} stopOpacity={0.16} /><Stop offset="100%" stopColor={line.color} stopOpacity={0.01} /></LinearGradient>)}</Defs> : null}
            {/* horizontal gridlines at 0 / 50% / 100% of yMax */}
            {[0, 0.5, 1].map((f) => (
              <Line
                key={f}
                x1={horizontalPad}
                x2={width - horizontalPad}
                y1={verticalPad + f * plotH}
                y2={verticalPad + f * plotH}
                stroke={colors.borderSoft}
                strokeWidth={1}
              />
            ))}
            {lines.map((line, lineIndex) => {
              if (line.points.length === 0) return null;
              if (line.points.length === 1 && !emphasize) {
                const [t, v] = line.points[0];
                return <Circle key={line.label} cx={x(t)} cy={y(v)} r={3} fill={line.color} />;
              }
              const pts = line.points.map(([t, v]) => `${x(t)},${y(v)}`).join(' ');
              const first = line.points[0];
              const last = line.points.at(-1)!;
              const area = `M${x(first[0])},${height - verticalPad} L${line.points.map(([t, v]) => `${x(t)},${y(v)}`).join(' L')} L${x(last[0])},${height - verticalPad} Z`;
              return (
                <React.Fragment key={line.label}>
                {emphasize && line.points.length > 1 ? <Path d={area} fill={`url(#${gradientId}${lineIndex})`} /> : null}
                <Polyline
                  points={pts}
                  fill="none"
                  stroke={line.color}
                  strokeWidth={emphasize ? 3 : 2}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
                {emphasize ? line.points.map(([time, value], index) => {
                  const endpoint = index === 0 || index === line.points.length - 1;
                  const latest = index === line.points.length - 1;
                  return <React.Fragment key={`${time}-${index}`}>
                    {latest ? <Circle cx={x(time)} cy={y(value)} r={9} fill={line.color} opacity={0.12} /> : null}
                    <Circle cx={x(time)} cy={y(value)} r={endpoint ? 4.5 : 3} fill={latest ? line.color : colors.surface} stroke={line.color} strokeWidth={2} />
                    {endpoint ? <SvgText x={x(time)} y={y(value) - 13} textAnchor={line.points.length === 1 ? 'middle' : index === 0 ? 'start' : 'end'} fill={colors.primaryDark} fontSize={labelSize} fontWeight="500">{value}</SvgText> : null}
                  </React.Fragment>;
                }) : null}
                </React.Fragment>
              );
            })}
            {yCaption ? (
              <SvgText x={H_PAD} y={V_PAD + 2} fontSize={12} fill={colors.textDim}>
                {yCaption}
              </SvgText>
            ) : null}
          </Svg>
        )}
        {!hasData && <Text style={styles.empty}>{t('app.trend_empty')}</Text>}
      </View>
      {!compact ? <View style={styles.legend}>
        {lines.map((line) => (
          <View key={line.label} style={styles.legendItem}>
            <View style={[styles.swatch, { backgroundColor: line.color }]} />
            <Text style={styles.legendLabel}>{line.label}</Text>
          </View>
        ))}
      </View> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  chartBox: { position: 'relative', width: '100%', justifyContent: 'center' },
  empty: {
    position: 'absolute',
    alignSelf: 'center',
    color: colors.textDim,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 2,
  },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  swatch: { width: 10, height: 10, borderRadius: 3 },
  legendLabel: { fontSize: 15, color: colors.textMuted },
});
