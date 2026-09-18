import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/Button';
import { useAuth } from '@/auth/AuthContext';
import { useProfile } from '@/store/ProfileContext';
import { useTranslation } from '@/hooks/useTranslation';
import { TAB_BAR_HEIGHT } from '@/hooks/useResponsiveLayout';
import { AssistantPanel } from '@/screens/AssistantScreen';
import { colors, gradients, radius, spacing, touchMin } from '@/theme';

const SparkIcon = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z"
      stroke={colors.onPrimary}
      strokeWidth={1.8}
      strokeLinejoin="round"
    />
  </Svg>
);

/**
 * Ask GeneoRx as a floating bubble rather than a tab.
 *
 * Two reasons it moved. It frees the fourth tab slot — with four tabs the bar
 * degrades to icon-only below 360px width — and it closes a parity divergence:
 * the website has no Ask tab, it exposes the assistant inside a step, so a
 * dedicated mobile tab was a mobile-only feature.
 *
 * Visibility rule, in one place:
 *   guest            -> bubble shown, tapping offers sign-up
 *   signed in        -> bubble shown, assistant works
 *   signed in, free, once the paid gate is switched on -> hidden entirely
 *
 * The paid gate is deliberately inert today: there is no purchase path in the
 * app, and gating app features behind web payment risks App Store 3.1.1. When
 * billing works, set ASK_REQUIRES_PAID to true and `entitled` does the rest.
 */
const ASK_REQUIRES_PAID = false;

export const AskBubble: React.FC = () => {
  const { isGuest } = useAuth();
  const { data } = useProfile();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);

  const isPaid = Boolean(
    (data?.account as { subscribed?: boolean } | undefined)?.subscribed,
  );

  // A free, signed-in account loses the bubble only once the gate is live.
  if (ASK_REQUIRES_PAID && !isGuest && !isPaid) return null;

  const bottom = TAB_BAR_HEIGHT + Math.max(insets.bottom, 8) + spacing.sm;

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={t('ask.open')}
        style={[styles.fab, { bottom }]}
      >
        <LinearGradient
          colors={gradients.primaryCta}
          start={gradients.start}
          end={gradients.end}
          style={StyleSheet.absoluteFill}
        />
        <SparkIcon />
      </Pressable>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)} />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
          <View style={styles.sheetHead}>
            <View style={styles.avatar}>
              <LinearGradient
                colors={gradients.primaryCta}
                start={gradients.start}
                end={gradients.end}
                style={StyleSheet.absoluteFill}
              />
              <Text style={styles.avatarGlyph}>✦</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.sheetTitle}>{t('assistant.title')}</Text>
              <Text style={styles.sheetSub}>{t('assistant.disclaimer')}</Text>
            </View>
            <Pressable onPress={() => setOpen(false)} hitSlop={10} accessibilityLabel={t('common.close')}>
              <Text style={styles.close}>✕</Text>
            </Pressable>
          </View>

          {isGuest ? (
            <View style={styles.gate}>
              <Text style={styles.gateTitle}>{t('ask.gate_title')}</Text>
              <Text style={styles.gateBody}>{t('ask.gate_body')}</Text>
              <Button title={t('nav.register')} onPress={() => setOpen(false)} />
              <Text style={styles.gateFine}>{t('ask.gate_signin')}</Text>
            </View>
          ) : (
            <View style={styles.panel}>
              <AssistantPanel />
            </View>
          )}
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: spacing.md,
    width: touchMin,
    height: touchMin,
    borderRadius: touchMin / 2,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 8,
  },
  backdrop: { flex: 1, backgroundColor: 'rgba(3, 5, 10, 0.6)' },
  sheet: {
    backgroundColor: colors.backgroundAlt,
    borderTopLeftRadius: radius.card,
    borderTopRightRadius: radius.card,
    borderTopWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
    maxHeight: '82%',
  },
  sheetHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarGlyph: { fontSize: 14, color: colors.onPrimary, fontWeight: '800' },
  sheetTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  sheetSub: { fontSize: 11, color: colors.textDim, lineHeight: 15 },
  close: { fontSize: 18, color: colors.textMuted, paddingHorizontal: 4 },
  panel: { flexShrink: 1 },
  gate: {
    borderWidth: 1,
    borderColor: 'rgba(40, 225, 255, 0.3)',
    backgroundColor: colors.primary50,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.sm,
  },
  gateTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  gateBody: { fontSize: 13, color: colors.textSoft, lineHeight: 19 },
  gateFine: { fontSize: 11, color: colors.textDim, textAlign: 'center' },
});
