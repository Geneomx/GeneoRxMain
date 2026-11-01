import React, { useEffect, useRef, useState } from 'react';
import { Linking, Modal, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { AppText as Text } from '@/components/AppText';
import { LinearGradient } from 'expo-linear-gradient';
import { Button } from '@/components/Button';
import { RatingSlider } from '@/components/RatingSlider';
import { useTranslation } from '@/hooks/useTranslation';
import { shadow, colors, gradients, radius, spacing, touchMin } from '@/theme';
import { citationToLink, successLabel } from '@/wizard/engine';
import type { AlertLevel, InsightResult, Tier } from '@/wizard/engine';
import type { Rating, TriState } from '@/wizard/types';

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
  plain?: boolean;
  children: React.ReactNode;
}> = ({ title, subtitle, badge, defaultOpen = false, plain = false, children }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <View style={plain ? styles.plainAccordion : styles.section}>
      <Pressable style={styles.accHead} accessibilityRole="button" accessibilityLabel={title} accessibilityState={{ expanded: open }} onPress={() => setOpen((o) => !o)}>
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
}> = ({ title, what, why, children }) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const head = title ?? t('mobile.help.title');
  return (
    <View style={styles.help}>
      <Pressable style={styles.helpHead} onPress={() => setOpen((o) => !o)} hitSlop={10}>
        <Text style={styles.helpIcon}>ⓘ</Text>
        <Text style={styles.helpTitle}>{head}</Text>
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

/* ---------- Tagline ----------
   A section heading, flat by default.

   It used to always render a cyan-tinted bordered box. But 32 of its 35 usages
   sit directly inside a <Section>, which is itself a bordered card with 24px
   padding — so the common case was two borders and ~38px of padding wrapping a
   single heading, which is what made screens like Progress look cramped and
   boxy. Pass `boxed` for the rare standalone callout that genuinely wants the
   tint. */
export const Tagline: React.FC<{ title: string; body?: string; boxed?: boolean }> = ({
  title,
  body,
  boxed = false,
}) => (
  <View style={boxed ? styles.taglineBox : styles.taglineFlat}>
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

/* ---------- Tier pill — "Tier: High" like the website ---------- */
const TIER_COLORS: Record<Tier, { bg: string; fg: string }> = {
  High: { bg: colors.successBg, fg: colors.success },
  Moderate: { bg: colors.warningBg, fg: colors.warning },
  Low: { bg: colors.surfaceAlt, fg: colors.textMuted },
};
export const TierPill: React.FC<{ tier: Tier }> = ({ tier }) => {
  const { t } = useTranslation();
  const c = TIER_COLORS[tier];
  const key = `tier.${tier.toLowerCase()}`;
  const label = t(key) !== key ? t(key) : tier;
  return (
    <View style={[styles.pill, { backgroundColor: c.bg }]}>
      <Text style={[styles.pillText, { color: c.fg }]}>{t('results.tier')} {label}</Text>
    </View>
  );
};

/* ---------- Alert box (interactions / contraindications) ---------- */
const ALERT_COLORS: Record<AlertLevel, { bg: string; border: string; fg: string; pillBg: string }> = {
  High: { bg: colors.dangerBg, border: 'rgba(251, 113, 133, 0.35)', fg: colors.danger, pillBg: 'rgba(251, 113, 133, 0.18)' },
  Moderate: { bg: colors.warningBg, border: 'rgba(251, 191, 36, 0.35)', fg: colors.warning, pillBg: 'rgba(251, 191, 36, 0.18)' },
  Low: { bg: colors.surfaceAlt, border: colors.borderSoft, fg: colors.textSoft, pillBg: colors.ghostBg },
};
export const AlertBox: React.FC<{ title: string; level: AlertLevel; note: string; action: string }> = ({
  title,
  level,
  note,
  action,
}) => {
  const { t } = useTranslation();
  const c = ALERT_COLORS[level];
  return (
    <View style={[styles.alert, { backgroundColor: c.bg, borderColor: c.border }]}>
      <View style={styles.alertHead}>
        <Text style={[styles.alertTitle, { color: c.fg }]}>{title}</Text>
        <View style={[styles.pill, { backgroundColor: c.pillBg, borderWidth: 1, borderColor: c.border }]}>
          <Text style={[styles.pillText, { color: c.fg }]}>{level} {t('results.priority')}</Text>
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
  const label = token === 'https://ods.od.nih.gov/factsheets/Magnesium-HealthProfessional/' ? 'NIH · Magnesium' : token;
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={label}
      onPress={url ? () => Linking.openURL(url).catch(() => undefined) : undefined}
      style={[styles.cite, { minHeight: 44, justifyContent: 'center', maxWidth: '100%' }]}
    >
      <Text style={[styles.citeText, url && styles.citeLink]}>{label}</Text>
    </Pressable>
  );
};

/* ---------- Compact 0–10 rating control ---------- */

export const ScaleRow: React.FC<{
  label: string;
  value: Rating;
  onChange: (v: number) => void;
  minLabel?: string;
  maxLabel?: string;
}> = ({ label, value, onChange, minLabel = 'Worst', maxLabel = 'Best' }) => {
  return <RatingSlider label={label} value={value} onChange={onChange} minLabel={minLabel} maxLabel={maxLabel} />;
};

/* ---------- 2×2 option grid (feedback types, etc.) ---------- */
export function OptionGrid<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { label: string; value: T }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <View style={styles.optionGrid}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            style={[styles.optionCell, active && styles.optionCellActive]}
          >
            <Text style={[styles.optionText, active && styles.optionTextActive]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

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
  const { width, fontScale } = useWindowDimensions();
  const wrap = fontScale > 1.3 || (options.length >= 4 && width < 400);

  return (
    <View style={[styles.segWrap, wrap && styles.segWrapStack]}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="button"
            accessibilityLabel={o.label}
            accessibilityState={{ selected: active }}
            onPress={() => onChange(o.value)}
            style={[styles.segItem, wrap && styles.segItemStack, active && styles.segItemActive]}
          >
            <Text
              style={[styles.segText, active && styles.segTextActive]}
            >
              {o.label}
            </Text>
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

/* ---------- Reveal animation — 4-step "analyzing" sequence before an
   insight modal opens, matching the website's openInsightModal()/advance().
   Shared by the Results and Summary steps. ---------- */
const REVEAL_STEP_KEYS = [
  { labelKey: 'modal.reveal.step1', hintKey: 'modal.reveal.step1_hint' },
  { labelKey: 'modal.reveal.step2', hintKey: 'modal.reveal.step2_hint' },
  { labelKey: 'modal.reveal.step3', hintKey: 'modal.reveal.step3_hint' },
  { labelKey: 'modal.reveal.step4', hintKey: 'modal.reveal.step4_hint' },
] as const;
const REVEAL_PROGRESS_KEYS = [
  'modal.reveal.progress1', 'modal.reveal.progress2', 'modal.reveal.progress3', 'modal.reveal.progress4',
] as const;
const REVEAL_STEPS = 4;
const REVEAL_STEP_MS = 420;
const REVEAL_READY_MS = 260;

export const RevealAnimationModal: React.FC<{ visible: boolean; onComplete: () => void }> = ({ visible, onComplete }) => {
  const { t } = useTranslation();
  const [step, setStep] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!visible) return;
    setStep(0);
    const tick = (i: number) => {
      setStep(i);
      timer.current = setTimeout(() => {
        if (i < REVEAL_STEPS) tick(i + 1);
        else onComplete();
      }, i < REVEAL_STEPS ? REVEAL_STEP_MS : REVEAL_READY_MS);
    };
    tick(0);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={() => undefined}>
      <View style={styles.revealBackdrop} />
      <View style={styles.revealWrap} pointerEvents="box-none">
        <View style={styles.revealModal}>
          <Text style={styles.revealTitle}>{t('modal.insight.title')}</Text>
          <View style={{ gap: 10 }}>
            {REVEAL_STEP_KEYS.map((s, idx) => {
              const isDone = idx < step || step >= REVEAL_STEPS;
              const isOn = idx === step && step < REVEAL_STEPS;
              return (
                <View key={s.labelKey} style={[styles.revealStep, isOn && styles.revealStepOn, isDone && styles.revealStepDone]}>
                  <View style={[styles.revealIcon, isOn && styles.revealIconOn, isDone && styles.revealIconDone]}>
                    <Text style={[styles.revealIconText, (isOn || isDone) && styles.revealIconTextActive]}>
                      {isDone ? '✓' : idx + 1}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.revealLabel}>{t(s.labelKey)}</Text>
                    <Text style={styles.revealHint}>{t(s.hintKey)}</Text>
                  </View>
                </View>
              );
            })}
          </View>
          <View style={styles.revealTrack}>
            <LinearGradient
              colors={gradients.primaryCta}
              start={gradients.start}
              end={gradients.end}
              style={[styles.revealBar, { width: `${Math.round((Math.min(step + 1, REVEAL_STEPS) / REVEAL_STEPS) * 100)}%` }]}
            />
          </View>
          <Text style={styles.revealFoot}>{step < REVEAL_STEPS ? t(REVEAL_PROGRESS_KEYS[step]) : t('modal.insight.ready')}</Text>
        </View>
      </View>
    </Modal>
  );
};

/* ---------- Insight modal — "What GeneoRx sees / means / doctor / why".
   Shared by the Results and Summary steps, opened after RevealAnimationModal. ---------- */
export const InsightModal: React.FC<{ visible: boolean; onClose: () => void; insight: InsightResult }> = ({
  visible,
  onClose,
  insight,
}) => {
  const { t } = useTranslation();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.revealBackdrop} onPress={onClose} />
      <View style={styles.revealWrap} pointerEvents="box-none">
        <View style={styles.insightModal}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.insightKicker}>{t('modal.insight.title').toUpperCase()}</Text>
            <Text style={styles.insightSummary}>{insight.summary}</Text>
            <Text style={styles.insightLabel}>{t('modal.insight.means')}</Text>
            <Text style={styles.insightBody}>{insight.meaning}</Text>
            <Text style={styles.insightLabel}>{t('modal.insight.doctor')}</Text>
            <Text style={styles.insightBody}>{insight.doctorPrompt}</Text>
            <Text style={styles.insightLabel}>{t('modal.insight.why')}</Text>
            <Text style={styles.insightBody}>
              {insight.patterns.length ? `${t('summary.pattern')}: ${insight.patterns[0].title}\n` : ''}
              {insight.interactions.length ? `${t('summary.interactions_field')}: ${insight.interactions.length}\n` : ''}
              {insight.contraindications.length ? `${t('summary.contraindications_field')}: ${insight.contraindications.length}\n` : ''}
              {t('review.no_cause')}
            </Text>
          </ScrollView>
          <Button title={t('modal.insight.close')} variant="secondary" onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
};

/**
 * A 0-10 row that can legitimately be left unanswered.
 *
 * Deliberately NOT a widened ScaleRow. ScaleRow's `value: number` means every
 * row always holds a number, which is how `severityNow` ended up defaulting to
 * 5 and silently asserting values nobody chose. The slider stays unanswered until touched,
 * and a chosen rating can be cleared without recording a zero.
 */
export const OptionalScaleRow: React.FC<{
  label: string;
  value: Rating;
  onChange: (v: Rating) => void;
  notAnsweredLabel: string;
  minLabel?: string;
  maxLabel?: string;
}> = ({ label, value, onChange, notAnsweredLabel, minLabel, maxLabel }) => {
  return (
    <View>
      <RatingSlider label={label} value={value} onChange={onChange} emptyLabel={notAnsweredLabel} minLabel={minLabel} maxLabel={maxLabel} />
      {value !== null ? <Pressable accessibilityRole="button" accessibilityLabel={`${label}: ${notAnsweredLabel}`} onPress={() => onChange(null)} style={{ minHeight: 48, justifyContent: 'center', alignSelf: 'flex-end' }}><Text style={{ color: colors.primary, fontSize: 15 }}>{notAnsweredLabel}</Text></Pressable> : null}
    </View>
  );
};

/** Yes / No / Unsure. `null` means the question was never answered. */
export const TriStateRow: React.FC<{
  label: string;
  value: TriState | null;
  onChange: (v: TriState | null) => void;
  labels: { yes: string; no: string; unsure: string };
}> = ({ label, value, onChange, labels }) => {
  const opts: { key: TriState; text: string }[] = [
    { key: 'yes', text: labels.yes },
    { key: 'no', text: labels.no },
    { key: 'unsure', text: labels.unsure },
  ];
  return (
    <View style={{ gap: 6 }}>
      <Text style={styles.scaleLabel}>{label}</Text>
      <View style={{ flexDirection: 'row', gap: 6 }}>
        {opts.map((o) => {
          const on = o.key === value;
          return (
            <Pressable
              key={o.key}
              // Tapping the selected answer clears it — an answer given by
              // mistake must be removable, not merely changeable.
              onPress={() => onChange(on ? null : o.key)}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              style={[styles.triPill, on && styles.scorePillOn]}
            >
              <Text style={[styles.scorePillText, on && styles.scorePillTextOn]}>{o.text}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  plainAccordion: { paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.borderSoft },
  // Shared mobile surface: one border and one consistent reading inset.
  section: {
    backgroundColor: colors.card,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    padding: 16,
    gap: 12,
  },
  taglineFlat: { gap: 3 },
  taglineBox: {
    gap: 4,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(40, 225, 255, 0.22)',
    backgroundColor: colors.primary50,
  },
  taglineTitle: { fontSize: 17, fontWeight: '500', color: colors.text, letterSpacing: -0.2 },
  taglineBody: { fontSize: 17, color: colors.textMuted, lineHeight: 25 },

  help: { backgroundColor: colors.primary50, borderRadius: radius.md, borderWidth: 1, borderColor: colors.primary100 },
  helpHead: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: spacing.md, paddingVertical: 14, minHeight: touchMin - 8 },
  helpIcon: { fontSize: 17, fontWeight: '500', color: colors.primary },
  helpTitle: { flex: 1, fontSize: 17, fontWeight: '500', color: colors.primaryDark },
  helpChevron: { fontSize: 17, color: colors.primary, fontWeight: '500' },
  helpBody: { paddingHorizontal: spacing.md, paddingBottom: spacing.md, gap: 6 },
  helpWhat: { fontSize: 17, color: colors.primaryDark, lineHeight: 22 },
  helpWhy: { fontSize: 17, color: colors.primaryDark, opacity: 0.85, lineHeight: 25 },
  helpBullet: { fontSize: 12.5, color: colors.primaryDark, opacity: 0.9, lineHeight: 22 },

  accHead: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 10 },
  accTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  accBadge: { minWidth: 22, height: 22, borderRadius: 11, paddingHorizontal: 7, backgroundColor: colors.primary50, alignItems: 'center', justifyContent: 'center' },
  accBadgeText: { fontSize: 15, fontWeight: '500', color: colors.primary },
  accChevron: { fontSize: 17, color: colors.textMuted, fontWeight: '500' },
  divider: { height: 1, backgroundColor: colors.borderSoft },
  finePrint: { fontSize: 15, color: colors.textMuted, lineHeight: 22 },

  note: { backgroundColor: colors.primary50, borderRadius: radius.md, padding: spacing.md, borderWidth: 1, borderColor: colors.primary100 },
  noteText: { fontSize: 16, color: colors.primaryDark, lineHeight: 23 },

  kvItem: { paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.borderSoft, gap: 3 },
  kvKey: { fontSize: 15, fontWeight: '500', color: colors.textMuted },
  kvValue: { fontSize: 17, color: colors.text, lineHeight: 22 },

  pill: { borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 3 },
  pillText: { fontSize: 14, fontWeight: '500', letterSpacing: 0.3 },

  alert: { borderRadius: radius.md, borderWidth: 1, padding: spacing.md, gap: 6 },
  alertHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  alertTitle: { fontSize: 17, fontWeight: '500', flexShrink: 1 },
  alertNote: { fontSize: 16, color: colors.textSoft, lineHeight: 23 },
  alertAction: { fontSize: 16, color: colors.text, fontWeight: '500', lineHeight: 23 },

  cite: { backgroundColor: colors.primary50, borderRadius: radius.sm, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1, borderColor: colors.primary100 },
  citeText: { fontSize: 15, fontWeight: '500', color: colors.textSoft },
  citeLink: { color: colors.primary, textDecorationLine: 'underline' },

  scaleWrap: { gap: 10 },
  scaleHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  scaleLabel: { fontSize: 17, fontWeight: '500', color: colors.text },
  scaleValue: { fontSize: 22, fontWeight: '500', color: colors.primary },
  scaleValueMax: { fontSize: 16, fontWeight: '500', color: colors.textDim },
  // Website .scorePill: dark navy pill, cyan when selected
  scorePillRow: { flexDirection: 'row', gap: 4 },
  scorePill: {
    flex: 1,
    height: 36,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scorePillWide: { paddingHorizontal: 10, minWidth: 74 },
  triPill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.inputBg,
  },
  scorePillOn: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    transform: [{ scale: 1.06 }],
  },
  scorePillText: { fontSize: 16, fontWeight: '500', color: colors.textSoft },
  scorePillTextOn: { color: '#FFFFFF' },
  sliderEnds: { flexDirection: 'row', justifyContent: 'space-between' },
  sliderEndText: { fontSize: 16, fontWeight: '500', color: colors.textDim },

  optionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  optionCell: {
    flexBasis: '47%',
    flexGrow: 1,
    maxWidth: '100%',
    minHeight: 52,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.ghostBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionCellActive: {
    backgroundColor: colors.primary100,
    borderColor: colors.primary,
  },
  optionText: { fontSize: 17, fontWeight: '500', color: colors.textMuted, textAlign: 'center' },
  optionTextActive: { color: colors.text, fontWeight: '500' },

  segWrap: { flexDirection: 'row', backgroundColor: colors.surfaceAlt, borderRadius: 12, padding: 4, gap: 4 },
  segWrapStack: { flexDirection: 'column' },
  segItem: { flex: 1, paddingVertical: 12, paddingHorizontal: 6, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center', minHeight: 48, minWidth: 0 },
  segItemStack: { flex: 0, width: '100%' },
  segItemActive: {
    backgroundColor: colors.surface,
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  segText: { fontSize: 17, fontWeight: '500', color: colors.textMuted, textAlign: 'center' },
  segTextActive: { color: colors.text, fontWeight: '500' },

  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 6 },
  toggleLabel: { fontSize: 17, color: colors.text, fontWeight: '500', flexShrink: 1, paddingRight: 12 },
  toggleTrack: { width: 54, height: 32, borderRadius: 16, backgroundColor: colors.border, padding: 3, justifyContent: 'center' },
  toggleTrackOn: { backgroundColor: colors.primary },
  toggleThumb: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#FFFFFF' },
  toggleThumbOn: { alignSelf: 'flex-end' },

  /* Reveal animation — mirrors website .revealModal/.revealStep/.revealBar */
  revealBackdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(4, 6, 12, 0.72)' },
  revealWrap: { ...StyleSheet.absoluteFill, justifyContent: 'center', padding: spacing.lg },
  revealModal: {
    backgroundColor: colors.surface, borderRadius: radius.lg,
    padding: spacing.lg, gap: 14, maxHeight: '86%',
  },
  revealTitle: { fontSize: 17, fontWeight: '500', color: colors.text, letterSpacing: -0.2 },
  revealStep: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    padding: 12, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.borderSoft, backgroundColor: colors.ghostBg,
    opacity: 0.55,
  },
  revealStepOn: { opacity: 1, borderColor: colors.primary100, backgroundColor: colors.primary50 },
  revealStepDone: { opacity: 1, borderColor: 'rgba(52, 211, 153, 0.28)', backgroundColor: colors.successBg },
  revealIcon: {
    width: 26, height: 26, borderRadius: 13,
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceAlt,
    alignItems: 'center', justifyContent: 'center',
  },
  revealIconOn: { borderColor: colors.primary100, backgroundColor: colors.primary50 },
  revealIconDone: { borderColor: 'rgba(52, 211, 153, 0.28)', backgroundColor: 'rgba(52, 211, 153, 0.14)' },
  revealIconText: { fontSize: 15, fontWeight: '500', color: colors.textMuted },
  revealIconTextActive: { color: colors.text },
  revealLabel: { fontSize: 17, fontWeight: '500', color: colors.text },
  revealHint: { fontSize: 15, color: colors.textMuted, lineHeight: 21, marginTop: 2 },
  revealTrack: { height: 6, borderRadius: 3, backgroundColor: colors.surfaceAlt, overflow: 'hidden' },
  revealBar: { height: '100%', borderRadius: 3 },
  revealFoot: { fontSize: 16, color: colors.textMuted, textAlign: 'center' },

  /* Insight modal */
  insightModal: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, gap: 8, maxHeight: '80%' },
  insightKicker: { fontSize: 14, fontWeight: '500', color: colors.primary, letterSpacing: 1 },
  insightSummary: { fontSize: 17, fontWeight: '500', color: colors.text, marginBottom: 6 },
  insightLabel: { fontSize: 15, fontWeight: '500', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.3, marginTop: 8 },
  insightBody: { fontSize: 17, color: colors.textSoft, lineHeight: 24 },
});
