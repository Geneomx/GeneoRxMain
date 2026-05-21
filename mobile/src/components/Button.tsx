import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import { colors, radius, spacing, typography } from '@/theme';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface Props {
  title: string;
  onPress?: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

export const Button: React.FC<Props> = ({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
}) => {
  const palette = paletteFor(variant);
  const isDisabled = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: palette.bg,
          borderColor: palette.border,
          borderWidth: palette.borderWidth,
        },
        isDisabled && styles.disabled,
        pressed && !isDisabled && { opacity: 0.85 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={palette.fg} />
      ) : (
        <Text style={[styles.label, typography.button, { color: palette.fg }]}>{title}</Text>
      )}
    </Pressable>
  );
};

function paletteFor(variant: Variant) {
  switch (variant) {
    case 'secondary':
      return {
        bg: colors.background,
        fg: colors.text,
        border: colors.border,
        borderWidth: 1,
      };
    case 'ghost':
      return {
        bg: 'transparent',
        fg: colors.textSoft,
        border: 'transparent',
        borderWidth: 0,
      };
    case 'danger':
      return {
        bg: colors.dangerBg,
        fg: colors.danger,
        border: '#FECACA',
        borderWidth: 1,
      };
    case 'primary':
    default:
      return {
        bg: colors.primary,
        fg: colors.textInverse,
        border: colors.primary,
        borderWidth: 0,
      };
  }
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: spacing.md - 2,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  label:    { textAlign: 'center' },
  disabled: { opacity: 0.45 },
});
