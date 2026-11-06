import { FormFocusContext } from './FormScrollView';
import React, { useContext, useRef, useState } from 'react';
import { StyleSheet, type TextInputInstance, TextInputProps, View } from 'react-native';
import { AppText as Text, AppTextInput as TextInput } from '@/components/AppText';
import { colors, radius, spacing, touchMin, typography } from '@/theme';

interface Props extends TextInputProps {
  label?: string;
  error?: string;
}

export const Input: React.FC<Props> = ({ label, error, style, onFocus, onBlur, ...rest }) => {
  const revealFocus = useContext(FormFocusContext);
  const inputRef = useRef<TextInputInstance>(null);
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.wrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        ref={inputRef}
        accessibilityLabel={label}
        placeholderTextColor={colors.textMuted}
        keyboardAppearance="light"
        selectionColor={colors.primary}
        style={[styles.input, focused && styles.inputFocused, error && styles.inputError, style]}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
          revealFocus(inputRef.current);
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
  label: { ...typography.bodyMuted, color: colors.text, fontWeight: '500', fontSize: 16 },
  input: {
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: '#F2F2F7',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: spacing.sm + 4,
    fontSize: 17,
    color: colors.text,
    minHeight: touchMin,
  },
  // A soft grey field; the blue ring appears only while typing.
  inputFocused: { borderColor: colors.primary, backgroundColor: '#FFFFFF' },
  inputError: { borderColor: colors.danger },
  error: { color: colors.danger, fontSize: 17 },
});
