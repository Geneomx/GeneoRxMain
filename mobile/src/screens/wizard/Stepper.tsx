// The vertical step list that replaced the horizontal pill tray.
//
// Ten labelled steps cannot fit across a 375px screen, so the tray had to wrap
// into rows, scroll most steps out of view, or shrink into unlabelled dots.
// Vertically they fit, keep their names, and can each carry what is in them.
//
// Every row here is pressable, including the ones drawn as 'locked'. That state
// is a label ("needs 1 check-in"), not a gate — see stepStatus.ts.

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients, radius, spacing } from '@/theme';
import type { StepState } from '@/wizard/stepStatus';

/** Rail geometry — the node centre and the content indent both derive from it. */
const RAIL_X = 10;
const NODE = 18;
const NODE_ON = 22;
const INDENT = 32;

/** Rows are visually dense; hitSlop brings the touch target back up to touchMin. */
const ROW_SLOP = { top: 9, bottom: 9, left: 8, right: 8 };

export const StepSpine: React.FC<{ progress: number }> = ({ progress }) => (
  <View style={styles.spine} pointerEvents="none">
    <View style={[styles.spineFill, { height: `${Math.round(Math.max(0, Math.min(1, progress)) * 100)}%` }]} />
  </View>
);

const Node: React.FC<{ state: StepState; label: string }> = ({ state, label }) => {
  if (state === 'current') {
    return (
      <View style={[styles.node, styles.nodeOn]}>
        <LinearGradient
          colors={gradients.stepActive}
          start={gradients.start}
          end={gradients.end}
          style={StyleSheet.absoluteFill}
        />
        <Text style={styles.nodeTextOn}>{label}</Text>
      </View>
    );
  }
  if (state === 'done') {
    return (
      <View style={[styles.node, styles.nodeDone]}>
        <Text style={styles.nodeTextDone}>✓</Text>
      </View>
    );
  }
  return (
    <View style={[styles.node, state === 'locked' ? styles.nodeLocked : styles.nodeAvailable]}>
      <Text style={[styles.nodeText, state === 'locked' && styles.nodeTextLocked]}>{label}</Text>
    </View>
  );
};

export const StepRow: React.FC<{
  index: number;
  title: string;
  /** The short right-hand value, or null to render a dash. */
  value?: string | null;
  /** Shown under the title on the current step only. */
  sub?: string;
  state: StepState;
  onPress: () => void;
  /** The open step's content. Rendered in the one raised surface on screen. */
  children?: React.ReactNode;
}> = ({ index, title, value, sub, state, onPress, children }) => {
  const isCurrent = state === 'current';

  return (
    <View style={styles.step}>
      <Pressable
        onPress={onPress}
        hitSlop={ROW_SLOP}
        accessibilityRole="tab"
        accessibilityState={{ selected: isCurrent }}
        accessibilityLabel={`${title}${value ? `, ${value}` : ''}`}
      >
        <View style={[styles.nodeWrap, isCurrent && styles.nodeWrapOn]}>
          <Node state={state} label={String(index)} />
        </View>

        <View style={styles.row}>
          <Text
            style={[
              styles.name,
              isCurrent && styles.nameOn,
              state === 'locked' && styles.nameLocked,
            ]}
            numberOfLines={1}
          >
            {title}
          </Text>
          <View style={styles.spacer} />
          <Text
            style={[
              styles.value,
              state === 'done' && styles.valueDone,
              isCurrent && styles.valueOn,
              state === 'locked' && styles.valueLocked,
            ]}
            numberOfLines={1}
          >
            {value ?? '—'}
          </Text>
          {!isCurrent && state !== 'locked' ? <Text style={styles.chev}>›</Text> : null}
        </View>

        {isCurrent && sub ? <Text style={styles.sub}>{sub}</Text> : null}
      </Pressable>

      {isCurrent && children ? <View style={styles.panel}>{children}</View> : null}
    </View>
  );
};

/**
 * Setup (steps 1-4, plus Account for guests) folded into one band. Nothing is
 * lost — every value the individual rows carried is in the digest line. Tapping
 * unfolds them.
 */
export const SetupBand: React.FC<{
  title: string;
  count: string;
  digest: string;
  onPress: () => void;
}> = ({ title, count, digest, onPress }) => (
  <View style={styles.step}>
    <Pressable
      onPress={onPress}
      hitSlop={ROW_SLOP}
      accessibilityRole="button"
      accessibilityLabel={`${title}, ${count}. ${digest}`}
    >
      <View style={styles.nodeWrap}>
        <Node state="done" label="✓" />
      </View>

      <View style={styles.band}>
        <View style={styles.row}>
          <Text style={styles.bandTitle}>{title}</Text>
          <View style={styles.spacer} />
          <Text style={styles.bandCount}>{count}</Text>
          <Text style={styles.caret}>▾</Text>
        </View>
        <Text style={styles.bandDigest} numberOfLines={2}>{digest}</Text>
      </View>
      {/* Two hairlines peeking beneath, so the band reads as a stack of rows
          rather than one more row. */}
      <View style={styles.stackHint}>
        <View style={styles.stackLine1} />
        <View style={styles.stackLine2} />
      </View>
    </Pressable>
  </View>
);

const styles = StyleSheet.create({
  spine: {
    position: 'absolute',
    left: RAIL_X,
    top: 12,
    bottom: 10,
    width: 1,
    backgroundColor: colors.borderSoft,
  },
  spineFill: { width: '100%', backgroundColor: colors.primary, opacity: 0.55 },

  step: { position: 'relative', paddingBottom: 14, paddingLeft: INDENT },

  nodeWrap: {
    position: 'absolute',
    left: RAIL_X - NODE / 2,
    top: 0,
    width: NODE,
    height: NODE,
  },
  nodeWrapOn: { left: RAIL_X - NODE_ON / 2, top: -2, width: NODE_ON, height: NODE_ON },

  node: {
    width: '100%',
    height: '100%',
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  nodeDone: { backgroundColor: 'rgba(52, 211, 153, 0.14)', borderColor: 'rgba(52, 211, 153, 0.45)' },
  nodeOn: { borderWidth: 0 },
  nodeAvailable: { backgroundColor: colors.surfaceAlt, borderColor: colors.border },
  nodeLocked: { backgroundColor: 'transparent', borderStyle: 'dashed', borderColor: 'rgba(255,255,255,0.14)' },

  nodeText: { fontSize: 9, fontWeight: '700', color: colors.textSoft },
  nodeTextLocked: { color: colors.textDim },
  nodeTextDone: { fontSize: 10, fontWeight: '700', color: colors.success },
  nodeTextOn: { fontSize: 10, fontWeight: '900', color: colors.onPrimary },

  row: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm, minHeight: 18 },
  spacer: { flex: 1 },

  name: { fontSize: 13, fontWeight: '600', color: colors.textSoft, letterSpacing: -0.05 },
  nameOn: { fontSize: 17, fontWeight: '800', color: colors.text, letterSpacing: -0.4 },
  nameLocked: { color: colors.textDim, fontWeight: '500' },

  value: { fontSize: 11, color: colors.textMuted, fontVariant: ['tabular-nums'] },
  valueDone: { color: colors.textSoft },
  valueOn: { color: colors.primary },
  valueLocked: { color: colors.textDim, fontStyle: 'italic' },

  chev: { fontSize: 15, lineHeight: 15, color: colors.textDim },
  sub: { marginTop: 3, fontSize: 13, lineHeight: 19, color: colors.textMuted },

  /* The open step's content.
     Deliberately NOT a card: every step already renders its own `Section`
     cards, so a wrapper here would double the borders. The negative left
     margin cancels the rail indent, so step content keeps exactly the width it
     has today — nothing inside the steps had to change. */
  panel: {
    marginTop: spacing.md,
    marginLeft: -INDENT,
    gap: spacing.md,
  },

  band: {
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    paddingVertical: 9,
    paddingHorizontal: 11,
    gap: 3,
  },
  bandTitle: { fontSize: 13, fontWeight: '700', color: colors.textSoft },
  bandCount: { fontSize: 11, color: colors.textMuted, fontVariant: ['tabular-nums'] },
  caret: { fontSize: 11, lineHeight: 13, color: colors.textDim },
  bandDigest: { fontSize: 10, lineHeight: 15, color: colors.textDim },

  stackHint: { height: 6, marginTop: 0 },
  stackLine1: {
    position: 'absolute', left: 5, right: 5, top: 2, height: 1, backgroundColor: colors.borderSoft,
  },
  stackLine2: {
    position: 'absolute', left: 10, right: 10, top: 5, height: 1, backgroundColor: colors.borderSoft, opacity: 0.6,
  },
});
