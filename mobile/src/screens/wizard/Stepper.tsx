// The vertical step list that replaced the horizontal pill tray.
//
// Ten labelled steps cannot fit across a 375px screen, so the tray had to wrap
// into rows, scroll most steps out of view, or shrink into unlabelled dots.
// Vertically they fit, keep their names, and can each carry what is in them.
//
// Every row here is pressable, including the ones drawn as 'locked'. That state
// is styling, not a gate — see stepStatus.ts.
//
// A row is deliberately just a number and a name. It briefly carried a value
// ("3 medicines"), a chevron and a subtitle as well, and with eight rows on
// screen that was four pieces of information per row and read as clutter. All
// steps must stay visible, so the way to make the screen simple is to put less
// on each one, not to show fewer of them.
//
// Layout note: the node sits in a fixed-width flex column, NOT absolutely
// positioned. Yoga places an absolute child from its parent's CONTENT box,
// where CSS uses the padding box, so an absolute node inside a padded row lands
// one full indent to the right — on top of the label.

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients, spacing } from '@/theme';
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
  state: StepState;
  onPress: () => void;
  /** The open step's content. */
  children?: React.ReactNode;
}> = ({ index, title, state, onPress, children }) => {
  const isCurrent = state === 'current';

  return (
    <View style={styles.step}>
      <Pressable
        onPress={onPress}
        hitSlop={ROW_SLOP}
        style={styles.head}
        accessibilityRole="tab"
        accessibilityState={{ selected: isCurrent }}
        accessibilityLabel={title}
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
          </View>
        </View>
      </Pressable>

      {/* The open step's content. Deliberately NOT wrapped in a card: every step
          already renders its own `Section` cards, so a wrapper would double the
          borders. Full width, because `step` carries no padding of its own. */}
      {isCurrent && children ? <View style={styles.panel}>{children}</View> : null}
    </View>
  );
};

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

  name: { fontSize: 17, fontWeight: '600', color: colors.text, letterSpacing: -0.1 },
  nameOn: { fontSize: 22, fontWeight: '800', color: colors.text, letterSpacing: -0.5 },
  nameLocked: { color: colors.textDim, fontWeight: '500' },


  panel: { marginTop: spacing.md, gap: spacing.md },

});
