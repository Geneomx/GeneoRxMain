import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { colors, radius, spacing, touchMin, typography } from '@/theme';

interface Props extends TextInputProps {
  label?: string;
  error?: string;
}

export const Input: React.FC<Props> = ({ label, error, style, onFocus, onBlur, ...rest }) => {
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.wrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        placeholderTextColor="rgba(169, 180, 214, 0.75)"
        style={[styles.input, focused && styles.inputFocused, error && styles.inputError, style]}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        {...rest}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { gap: spacing.xs },
  label: { ...typography.bodyMuted, color: colors.text, fontWeight: '700', fontSize: 15 },
  input: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.inputBg,
    borderRadius: radius.button,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
    fontSize: 16,
    color: colors.text,
    minHeight: touchMin,
  },
  // Website auth focus ring: cyan border glow
  inputFocused: { borderColor: 'rgba(40, 225, 255, 0.45)' },
  inputError: { borderColor: colors.danger },
  error: { color: colors.danger, fontSize: 14 },
});
