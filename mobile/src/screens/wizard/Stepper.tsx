// The vertical step list that replaced the horizontal pill tray.
//
// Ten labelled steps cannot fit across a 375px screen, so the tray had to wrap
// into rows, scroll most steps out of view, or shrink into unlabelled dots.
// Vertically they fit, keep their names, and can each carry what is in them.
//
// Every row here is pressable, including the ones drawn as 'locked'. That state
// is a label ("needs 1 check-in"), not a gate — see stepStatus.ts.
//
// Layout note: the node sits in a fixed-width flex column, NOT absolutely
// positioned. Yoga places an absolute child from its parent's CONTENT box,
// where CSS uses the padding box, so an absolute node inside a padded row lands
// one full indent to the right — on top of the label.

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients, radius, spacing } from '@/theme';
import type { StepState } from '@/wizard/stepStatus';

/** Rail geometry. The spine and every node centre on RAIL_X.
 *  Sized for the older adults who are most of this app's users: the node holds
 *  a 12px numeral legibly, and the row clears theme `touchMin` (52) on its own
 *  rather than leaning on hitSlop to make an invisible target big enough. */
const RAIL_X = 13;
const NODE = 26;
const NODE_ON = 32;
const INDENT = 42;

/** Small extra margin only — the visible row already meets touchMin. */
const ROW_SLOP = { top: 6, bottom: 6, left: 8, right: 8 };

export const StepSpine: React.FC<{ progress: number }> = ({ progress }) => (
  <View style={styles.spine} pointerEvents="none">
    <View style={[styles.spineFill, { height: `${Math.round(Math.max(0, Math.min(1, progress)) * 100)}%` }]} />
  </View>
);

/** Centres a node of `size` on the rail, inside the fixed-width rail column. */
const railOffset = (size: number) => ({ marginLeft: RAIL_X - size / 2 });

const Node: React.FC<{ state: StepState; label: string }> = ({ state, label }) => {
  if (state === 'current') {
    return (
      <View style={[styles.node, styles.nodeOn, railOffset(NODE_ON)]}>
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
      <View style={[styles.node, styles.nodeBase, styles.nodeDone, railOffset(NODE)]}>
        <Text style={styles.nodeTextDone}>✓</Text>
      </View>
    );
  }
  return (
    <View
      style={[
        styles.node,
        styles.nodeBase,
        state === 'locked' ? styles.nodeLocked : styles.nodeAvailable,
        railOffset(NODE),
      ]}
    >
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
  /** The open step's content. */
  children?: React.ReactNode;
}> = ({ index, title, value, sub, state, onPress, children }) => {
  const isCurrent = state === 'current';

  return (
    <View style={styles.step}>
      <Pressable
        onPress={onPress}
        hitSlop={ROW_SLOP}
        style={styles.head}
        accessibilityRole="tab"
        accessibilityState={{ selected: isCurrent }}
        accessibilityLabel={`${title}${value ? `, ${value}` : ''}`}
      >
        <View style={[styles.rail, isCurrent && styles.railOn]}>
          <Node state={state} label={String(index)} />
        </View>

        <View style={styles.headBody}>
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
        </View>
      </Pressable>

      {/* The open step's content. Deliberately NOT wrapped in a card: every step
          already renders its own `Section` cards, so a wrapper would double the
          borders. Full width, because `step` carries no padding of its own. */}
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
      style={styles.head}
      accessibilityRole="button"
      accessibilityLabel={`${title}, ${count}. ${digest}`}
    >
      <View style={styles.rail}>
        <Node state="done" label="✓" />
      </View>

      <View style={styles.headBody}>
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
      </View>
    </Pressable>
  </View>
);

const styles = StyleSheet.create({
  spine: {
    position: 'absolute',
    left: RAIL_X,
    top: 14,
    bottom: 10,
    width: 2,
    backgroundColor: colors.borderSoft,
  },
  spineFill: { width: '100%', backgroundColor: colors.primary, opacity: 0.55 },

  step: { paddingBottom: 16 },
  head: { flexDirection: 'row', alignItems: 'flex-start' },

  /** Fixed-width column holding the node. Never padded — see the header note. */
  rail: { width: INDENT, paddingTop: 2 },
  railOn: { paddingTop: 0 },

  headBody: { flex: 1, minWidth: 0 },

  node: {
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  nodeBase: {
    width: NODE,
    height: NODE,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  nodeOn: { width: NODE_ON, height: NODE_ON },
  nodeDone: { backgroundColor: 'rgba(52, 211, 153, 0.14)', borderColor: 'rgba(52, 211, 153, 0.45)' },
  nodeAvailable: { backgroundColor: colors.surfaceAlt, borderColor: colors.border },
  nodeLocked: { backgroundColor: colors.background, borderStyle: 'dashed', borderColor: 'rgba(255,255,255,0.14)' },

  nodeText: { fontSize: 12, fontWeight: '700', color: colors.textSoft },
  nodeTextLocked: { color: colors.textDim },
  nodeTextDone: { fontSize: 14, fontWeight: '700', color: colors.success },
  nodeTextOn: { fontSize: 14, fontWeight: '900', color: colors.onPrimary },

  row: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm, minHeight: 30 },
  spacer: { flex: 1 },

  name: { fontSize: 17, fontWeight: '600', color: colors.text, letterSpacing: -0.1 },
  nameOn: { fontSize: 22, fontWeight: '800', color: colors.text, letterSpacing: -0.5 },
  nameLocked: { color: colors.textDim, fontWeight: '500' },

  value: { fontSize: 15, color: colors.textSoft, fontVariant: ['tabular-nums'] },
  valueDone: { color: colors.textSoft },
  valueOn: { color: colors.primary },
  valueLocked: { color: colors.textDim, fontStyle: 'italic' },

  chev: { fontSize: 20, lineHeight: 22, color: colors.textMuted },
  sub: { marginTop: 4, fontSize: 15, lineHeight: 22, color: colors.textMuted },

  panel: { marginTop: spacing.md, gap: spacing.md },

  band: {
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 4,
  },
  bandTitle: { fontSize: 17, fontWeight: '700', color: colors.text },
  bandCount: { fontSize: 15, color: colors.textSoft, fontVariant: ['tabular-nums'] },
  caret: { fontSize: 15, lineHeight: 18, color: colors.textMuted },
  bandDigest: { fontSize: 14, lineHeight: 20, color: colors.textMuted },

  stackHint: { height: 6 },
  stackLine1: {
    position: 'absolute', left: 5, right: 5, top: 2, height: 1, backgroundColor: colors.borderSoft,
  },
  stackLine2: {
    position: 'absolute', left: 10, right: 10, top: 5, height: 1, backgroundColor: colors.borderSoft, opacity: 0.6,
  },
});
