// The vertical step list, one step open at a time.
//
// Every step stays on screen with its real name, down a rail of numbers on the left.
// The open step shows its content right under its name; a finished step folds up to one
// line with a tick and a short value, and the next step opens below it.
//
// Every row is pressable, including the ones drawn as 'locked'. That state is styling,
// not a gate — see stepStatus.ts.
//
// Layout note: the node sits in a fixed-width flex column, NOT absolutely positioned.
// Yoga places an absolute child from its parent's CONTENT box, where CSS uses the
// padding box, so an absolute node inside a padded row lands one indent to the right.

import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText as Text } from '@/components/AppText';
import { colors } from '@/theme';
import type { StepState } from '@/wizard/stepStatus';

const NODE = 32;

export const StepRow: React.FC<{
  index: number;
  title: string;
  state: StepState;
  /** A short value shown on a finished row, for example "2 medicines". */
  value?: string | null;
  /** The last row draws no line below its number. */
  last?: boolean;
  /** True for rows above the open step: the line below them is drawn in blue, like a progress bar. */
  passed?: boolean;
  onPress: () => void;
  /** Reports the row's top edge inside the list so the screen can scroll to it. */
  onRow?: (y: number) => void;
  /** The open step's content. */
  children?: React.ReactNode;
}> = ({ index, title, state, value, last, passed, onPress, onRow, children }) => {
  const current = state === 'current';
  const done = state === 'done';
  return (
    <View style={styles.row} onLayout={event => onRow?.(event.nativeEvent.layout.y)}>
      <View style={styles.rail}>
        <View style={[styles.node, done && styles.nodeDone, current && styles.nodeOn]}>
          <Text style={[styles.nodeText, state === 'locked' && styles.nodeTextLocked, done && styles.nodeTextDone, current && styles.nodeTextOn]}>{done ? '✓' : index}</Text>
        </View>
        {last ? null : <View style={[styles.line, passed && styles.lineDone]} />}
      </View>
      <View style={styles.body}>
        <Pressable accessibilityRole="tab" accessibilityState={{ selected: current }} accessibilityLabel={title} onPress={onPress} hitSlop={{ top: 4, bottom: 4, left: 8, right: 8 }} style={styles.head}>
          <Text numberOfLines={1} style={[styles.name, current && styles.nameOn, done && styles.nameDone, state === 'locked' && styles.nameLocked]}>{title}</Text>
          {done && value ? <Text numberOfLines={1} style={styles.value}>{value}</Text> : null}
        </Pressable>
        {current && children ? <View style={styles.panel}>{children}</View> : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 14 },
  rail: { width: NODE, alignItems: 'center', paddingTop: 6 },
  node: { width: NODE, height: NODE, borderRadius: NODE / 2, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F0F0F3' },
  nodeDone: { backgroundColor: colors.primary50 },
  nodeOn: { backgroundColor: colors.buttonPrimary, boxShadow: '0 0 0 5px rgba(0,113,227,0.16)' },
  nodeText: { fontSize: 14, lineHeight: 18, fontWeight: '600', color: colors.textMuted },
  nodeTextLocked: { color: colors.textDim },
  nodeTextDone: { color: colors.buttonPrimary, fontSize: 16, fontWeight: '700' },
  nodeTextOn: { color: colors.onPrimary },
  // The line runs from just under this number to just above the next one, so the rail reads as one unbroken track.
  line: { flex: 1, width: 3, minHeight: 10, marginTop: 4, marginBottom: -2, borderRadius: 2, backgroundColor: '#E3E3E8' },
  lineDone: { backgroundColor: colors.buttonPrimary },
  body: { flex: 1, minWidth: 0, paddingBottom: 12 },
  head: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { flexShrink: 1, fontSize: 17, lineHeight: 22, fontWeight: '500', color: colors.pine },
  nameOn: { fontSize: 24, lineHeight: 30, fontWeight: '600', letterSpacing: -0.6 },
  nameDone: { color: colors.text },
  nameLocked: { color: colors.textMuted },
  value: { flex: 1, textAlign: 'right', fontSize: 14, lineHeight: 18, color: colors.textMuted },
  panel: { paddingTop: 4, paddingBottom: 12, gap: 14 },
});
