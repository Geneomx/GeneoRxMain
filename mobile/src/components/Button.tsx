import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import { colors, radius, touchMin, typography } from '@/theme';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface Props {
  title: string;
  onPress?: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  compact?: boolean;
}

export const Button: React.FC<Props> = ({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
  compact = false,
}) => {
  const palette = paletteFor(variant);
  const isDisabled = disabled || loading;
  const pressedStyle = (pressed: boolean) => {
    if (!pressed || isDisabled) return null;
    if (variant === 'ghost') {
      return { backgroundColor: colors.primary50 };
    }
    return { opacity: 0.9 };
  };

  const label = loading ? (
    <ActivityIndicator color={palette.fg} />
  ) : (
    <Text style={[styles.label, typography.button, { color: palette.fg }, palette.labelExtra]}>
      {title}
    </Text>
  );

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: isDisabled }}
      style={({ pressed }) => [
        styles.base,
        compact && styles.compact,
        {
          backgroundColor: palette.bg,
          borderColor: palette.border,
          borderWidth: palette.borderWidth,
        },
        palette.shadow ?? null,
        isDisabled && styles.disabled,
        pressedStyle(pressed),
        style,
      ]}
    >
      {label}
    </Pressable>
  );
};

function paletteFor(variant: Variant) {
  switch (variant) {
    case 'secondary':
      return {
        bg: colors.buttonBg,
        fg: colors.text,
        border: colors.border,
        borderWidth: 1,
        shadow: undefined,
        labelExtra: { fontWeight: '600' as const },
      };
    case 'ghost':
      return {
        bg: 'transparent',
        fg: colors.primary,
        border: colors.primary,
        borderWidth: 1.5,
        shadow: undefined,
        labelExtra: { fontWeight: '700' as const },
      };
    case 'danger':
      return {
        bg: colors.dangerBg,
        fg: colors.danger,
        border: 'rgba(251, 113, 133, 0.35)',
        borderWidth: 1,
        shadow: undefined,
        labelExtra: { fontWeight: '700' as const },
      };
    case 'primary':
    default:
      return {
        bg: colors.buttonPrimary,
        fg: colors.buttonText,
        border: 'rgba(255, 255, 255, 0.14)',
        borderWidth: 1,
        shadow: undefined,
        labelExtra: { fontWeight: '800' as const },
      };
  }
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: radius.button,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: touchMin,
  },
  compact: {
    minHeight: 44,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  label: { textAlign: 'center', fontSize: 16, backgroundColor: 'transparent' },
  disabled: { opacity: 0.45 },
});
