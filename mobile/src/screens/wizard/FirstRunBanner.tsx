import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from '@/hooks/useTranslation';
import { colors, radius, spacing } from '@/theme';

/**
 * The deck's "3 simple steps" funnel, as a framing layer over the steps that
 * already capture this data — Symptoms (2), Medications (1) and Results (4).
 *
 * Deliberately NOT a parallel onboarding flow. A second path that collects
 * medications and symptoms would duplicate the engine's inputs and drift from
 * the wizard the first time either side changed, which is the failure mode this
 * codebase has hit repeatedly. This gives a first-time user the promised
 * 30-second narrative without a second source of truth.
 *
 * Hides itself once the user has a check-in: by then they are a returning user
 * and the funnel framing is noise.
 */
type Props = {
  /** 1, 2 or 3 — the position in the funnel, not the wizard step number. */
  position: 1 | 2 | 3;
  titleKey: string;
  subKey: string;
};

export const FirstRunBanner: React.FC<Props> = ({ position, titleKey, subKey }) => {
  const { t } = useTranslation();

  return (
    <View style={styles.wrap}>
      <View style={styles.dots}>
        {([1, 2, 3] as const).map((n) => (
          <View key={n} style={[styles.dot, n === position && styles.dotOn]}>
            {n === position ? <Text style={styles.dotNum}>{n}</Text> : null}
          </View>
        ))}
        <Text style={styles.of}>{t('firstrun.step_of', { n: position })}</Text>
      </View>
      <Text style={styles.title}>{t(titleKey)}</Text>
      <Text style={styles.sub}>{t(subKey)}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    borderWidth: 1,
    borderColor: 'rgba(40, 225, 255, 0.28)',
    borderRadius: radius.card,
    backgroundColor: 'rgba(40, 225, 255, 0.06)',
    padding: spacing.md,
    gap: 6,
  },
  dots: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotOn: { backgroundColor: colors.primary, borderColor: 'transparent' },
  dotNum: { fontSize: 10, fontWeight: '800', color: colors.onPrimary },
  of: { marginLeft: 4, fontSize: 11, color: colors.textMuted },
  title: { fontSize: 18, fontWeight: '700', color: colors.text, letterSpacing: -0.3 },
  sub: { fontSize: 13, color: colors.textSoft, lineHeight: 18 },
});
