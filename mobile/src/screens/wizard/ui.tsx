import React, { useRef, useState } from 'react';
import { GestureResponderEvent, Linking, PanResponder, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, shadow, spacing } from '@/theme';
import { citationToLink } from '@/wizard/engine';
import type { AlertLevel, Tier } from '@/wizard/engine';

/* ---------- Section card ---------- */
export const Section: React.FC<{ children: React.ReactNode; style?: object }> = ({ children, style }) => (
  <View style={[styles.section, style]}>{children}</View>
);

/* ---------- Accordion (progressive disclosure) ---------- */
export const Accordion: React.FC<{
  title: string;
  subtitle?: string;
  badge?: string | number;
  defaultOpen?: boolean;
  children: React.ReactNode;
}> = ({ title, subtitle, badge, defaultOpen = false, children }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <View style={styles.section}>
      <Pressable style={styles.accHead} onPress={() => setOpen((o) => !o)}>
        <View style={{ flex: 1 }}>
          <View style={styles.accTitleRow}>
            <Text style={styles.taglineTitle}>{title}</Text>
            {badge !== undefined && badge !== '' ? (
              <View style={styles.accBadge}>
                <Text style={styles.accBadgeText}>{badge}</Text>
              </View>
            ) : null}
          </View>
          {subtitle ? <Text style={styles.taglineBody}>{subtitle}</Text> : null}
        </View>
        <Text style={styles.accChevron}>{open ? '▾' : '▸'}</Text>
      </Pressable>
      {open ? <View style={{ gap: spacing.md, marginTop: spacing.md }}>{children}</View> : null}
    </View>
  );
};

/* ---------- Help note (collapsible "How this works") ---------- */
export const HelpNote: React.FC<{
  title?: string;
  what?: string;
  why?: string;
  children?: React.ReactNode;
}> = ({ title = 'How this step works', what, why, children }) => {
  const [open, setOpen] = useState(false);
  return (
    <View style={styles.help}>
      <Pressable style={styles.helpHead} onPress={() => setOpen((o) => !o)} hitSlop={6}>
        <Text style={styles.helpIcon}>ⓘ</Text>
        <Text style={styles.helpTitle}>{title}</Text>
        <Text style={styles.helpChevron}>{open ? '▾' : '▸'}</Text>
      </Pressable>
      {open ? (
        <View style={styles.helpBody}>
          {what ? <Text style={styles.helpWhat}>{what}</Text> : null}
          {why ? <Text style={styles.helpWhy}>Why it matters: {why}</Text> : null}
          {children}
        </View>
      ) : null}
    </View>
  );
};

/* ---------- Tagline (bold lead + body) ---------- */
export const Tagline: React.FC<{ title: string; body?: string }> = ({ title, body }) => (
  <View style={{ gap: 4 }}>
    <Text style={styles.taglineTitle}>{title}</Text>
    {body ? <Text style={styles.taglineBody}>{body}</Text> : null}
  </View>
);

/* ---------- Divider ---------- */
export const Divider: React.FC = () => <View style={styles.divider} />;

/* ---------- Fine print ---------- */
export const FinePrint: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Text style={styles.finePrint}>{children}</Text>
);

/* ---------- Note box ---------- */
export const NoteBox: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <View style={styles.note}>
    <Text style={styles.noteText}>{children}</Text>
  </View>
);

/* ---------- Key/Value list item ---------- */
export const KVItem: React.FC<{ k: string; children: React.ReactNode }> = ({ k, children }) => (
  <View style={styles.kvItem}>
    <Text style={styles.kvKey}>{k}</Text>
    <Text style={styles.kvValue}>{children}</Text>
  </View>
);

/* ---------- Tier pill ---------- */
const TIER_COLORS: Record<Tier, { bg: string; fg: string }> = {
  High: { bg: colors.successBg, fg: colors.success },
  Moderate: { bg: colors.warningBg, fg: colors.warning },
  Low: { bg: colors.surfaceAlt, fg: colors.textMuted },
};
export const TierPill: React.FC<{ tier: Tier }> = ({ tier }) => {
  const c = TIER_COLORS[tier];
  return (
    <View style={[styles.pill, { backgroundColor: c.bg }]}>
      <Text style={[styles.pillText, { color: c.fg }]}>{tier}</Text>
    </View>
  );
};

/* ---------- Alert box (interactions / contraindications) ---------- */
const ALERT_COLORS: Record<AlertLevel, { bg: string; border: string; fg: string }> = {
  High: { bg: colors.dangerBg, border: '#FECACA', fg: colors.danger },
  Moderate: { bg: colors.warningBg, border: '#FDE68A', fg: colors.warning },
  Low: { bg: colors.surfaceAlt, border: colors.borderSoft, fg: colors.textSoft },
};
export const AlertBox: React.FC<{ title: string; level: AlertLevel; note: string; action: string }> = ({
  title,
  level,
  note,
  action,
}) => {
  const c = ALERT_COLORS[level];
  return (
    <View style={[styles.alert, { backgroundColor: c.bg, borderColor: c.border }]}>
      <View style={styles.alertHead}>
        <Text style={[styles.alertTitle, { color: c.fg }]}>{title}</Text>
        <View style={[styles.pill, { backgroundColor: '#FFFFFF' }]}>
          <Text style={[styles.pillText, { color: c.fg }]}>{level}</Text>
        </View>
      </View>
      <Text style={styles.alertNote}>{note}</Text>
      <Text style={styles.alertAction}>→ {action}</Text>
    </View>
  );
};

/* ---------- Citation chip (opens PubMed/PMC) ---------- */
export const CiteChip: React.FC<{ token: string }> = ({ token }) => {
  const url = citationToLink(token);
  return (
    <Pressable
      onPress={url ? () => Linking.openURL(url).catch(() => undefined) : undefined}
      style={styles.cite}
    >
      <Text style={[styles.citeText, url && styles.citeLink]}>{token}</Text>
    </Pressable>
  );
};

/* ---------- 0–10 slider (stepper buttons) ---------- */
const SCALE_MAX = 10;

export const ScaleRow: React.FC<{
  label: string;
  value: number;
  onChange: (v: number) => void;
  minLabel?: string;
  maxLabel?: string;
}> = ({ label, value, onChange, minLabel = 'Worst', maxLabel = 'Best' }) => {
  const widthRef = useRef(0);

  const valueFromX = (x: number): number => {
    const w = widthRef.current;
    if (w <= 0) return value;
    const ratio = Math.max(0, Math.min(1, x / w));
    return Math.round(ratio * SCALE_MAX);
  };

  const handle = (e: GestureResponderEvent) => {
    const next = valueFromX(e.nativeEvent.locationX);
    if (next !== value) onChange(next);
  };

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: handle,
      onPanResponderMove: handle,
    }),
  ).current;

  const pct = (value / SCALE_MAX) * 100;

  return (
    <View style={styles.scaleWrap}>
      <View style={styles.scaleHead}>
        <Text style={styles.scaleLabel}>{label}</Text>
        <Text style={styles.scaleValue}>
          {value}
          <Text style={styles.scaleValueMax}> / {SCALE_MAX}</Text>
        </Text>
      </View>
      <View
        style={styles.sliderTrack}
        onLayout={(e) => {
          widthRef.current = e.nativeEvent.layout.width;
        }}
        {...pan.panHandlers}
      >
        <View style={styles.sliderBase} />
        <View style={[styles.sliderFill, { width: `${pct}%` }]} />
        <View style={[styles.sliderThumb, { left: `${pct}%` }]} />
      </View>
      <View style={styles.sliderEnds}>
        <Text style={styles.sliderEndText}>{minLabel}</Text>
        <Text style={styles.sliderEndText}>{maxLabel}</Text>
      </View>
    </View>
  );
};

/* ---------- Segmented control ---------- */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { label: string; value: T }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <View style={styles.segWrap}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            style={[styles.segItem, active && styles.segItemActive]}
          >
            <Text style={[styles.segText, active && styles.segTextActive]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/* ---------- Toggle switch row ---------- */
export const ToggleRow: React.FC<{ label: string; value: boolean; onChange: (v: boolean) => void }> = ({
  label,
  value,
  onChange,
}) => (
  <Pressable onPress={() => onChange(!value)} style={styles.toggleRow}>
    <Text style={styles.toggleLabel}>{label}</Text>
    <View style={[styles.toggleTrack, value && styles.toggleTrackOn]}>
      <View style={[styles.toggleThumb, value && styles.toggleThumbOn]} />
    </View>
  </Pressable>
);

const styles = StyleSheet.create({
  section: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    padding: spacing.lg,
    gap: spacing.md,
    ...shadow.card,
  },
  taglineTitle: { fontSize: 16, fontWeight: '700', color: colors.text, letterSpacing: -0.2 },
  taglineBody: { fontSize: 13, color: colors.textMuted, lineHeight: 19 },

  help: { backgroundColor: colors.primary50, borderRadius: radius.md, borderWidth: 1, borderColor: colors.primary100 },
  helpHead: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: spacing.md, paddingVertical: 11 },
  helpIcon: { fontSize: 14, fontWeight: '800', color: colors.primary },
  helpTitle: { flex: 1, fontSize: 13.5, fontWeight: '700', color: colors.primaryDark },
  helpChevron: { fontSize: 14, color: colors.primary, fontWeight: '700' },
  helpBody: { paddingHorizontal: spacing.md, paddingBottom: spacing.md, gap: 6 },
  helpWhat: { fontSize: 13, color: colors.primaryDark, lineHeight: 19 },
  helpWhy: { fontSize: 12.5, color: colors.primaryDark, opacity: 0.85, lineHeight: 18 },
  helpBullet: { fontSize: 12.5, color: colors.primaryDark, opacity: 0.9, lineHeight: 18 },

  accHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  accTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  accBadge: { minWidth: 22, height: 22, borderRadius: 11, paddingHorizontal: 7, backgroundColor: colors.primary50, alignItems: 'center', justifyContent: 'center' },
  accBadgeText: { fontSize: 12, fontWeight: '800', color: colors.primary },
  accChevron: { fontSize: 16, color: colors.textMuted, fontWeight: '700' },
  divider: { height: 1, backgroundColor: colors.borderSoft },
  finePrint: { fontSize: 12, color: colors.textDim, lineHeight: 17 },

  note: { backgroundColor: colors.primary50, borderRadius: radius.md, padding: spacing.md, borderWidth: 1, borderColor: colors.primary100 },
  noteText: { fontSize: 13, color: colors.primaryDark, lineHeight: 19 },

  kvItem: { paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.borderSoft, gap: 3 },
  kvKey: { fontSize: 12, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.4 },
  kvValue: { fontSize: 14, color: colors.text, lineHeight: 20 },

  pill: { borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 3 },
  pillText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.3 },

  alert: { borderRadius: radius.md, borderWidth: 1, padding: spacing.md, gap: 6 },
  alertHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  alertTitle: { fontSize: 14, fontWeight: '700', flexShrink: 1 },
  alertNote: { fontSize: 13, color: colors.textSoft, lineHeight: 19 },
  alertAction: { fontSize: 13, color: colors.text, fontWeight: '600', lineHeight: 19 },

  cite: { backgroundColor: colors.primary50, borderRadius: radius.sm, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1, borderColor: colors.primary100 },
  citeText: { fontSize: 12, fontWeight: '700', color: colors.textSoft },
  citeLink: { color: colors.primary, textDecorationLine: 'underline' },

  scaleWrap: { gap: 10 },
  scaleHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  scaleLabel: { fontSize: 14, fontWeight: '600', color: colors.text },
  scaleValue: { fontSize: 20, fontWeight: '800', color: colors.primary },
  scaleValueMax: { fontSize: 13, fontWeight: '700', color: colors.textDim },
  sliderTrack: {
    height: 32,
    justifyContent: 'center',
    paddingVertical: 13,
  },
  sliderBase: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.surfaceAlt,
  },
  sliderFill: {
    position: 'absolute',
    left: 0,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  sliderThumb: {
    position: 'absolute',
    width: 22,
    height: 22,
    borderRadius: 11,
    marginLeft: -11,
    backgroundColor: colors.primary,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    ...shadow.raised,
  },
  sliderEnds: { flexDirection: 'row', justifyContent: 'space-between' },
  sliderEndText: { fontSize: 11, fontWeight: '600', color: colors.textDim },

  segWrap: { flexDirection: 'row', backgroundColor: colors.surfaceAlt, borderRadius: radius.md, padding: 3, gap: 3 },
  segItem: { flex: 1, paddingVertical: 9, borderRadius: radius.sm, alignItems: 'center' },
  segItemActive: { backgroundColor: colors.primary, ...shadow.card },
  segText: { fontSize: 13, fontWeight: '600', color: colors.textMuted },
  segTextActive: { color: '#FFFFFF' },

  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 6 },
  toggleLabel: { fontSize: 14, color: colors.text, fontWeight: '500', flexShrink: 1, paddingRight: 12 },
  toggleTrack: { width: 46, height: 28, borderRadius: 14, backgroundColor: colors.border, padding: 3, justifyContent: 'center' },
  toggleTrackOn: { backgroundColor: colors.primary },
  toggleThumb: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#FFFFFF' },
  toggleThumbOn: { alignSelf: 'flex-end' },
});
