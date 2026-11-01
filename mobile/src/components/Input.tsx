import { FormFocusContext } from './FormScrollView';
import React, { useContext, useRef, useState } from 'react';
import { StyleSheet, TextInput, TextInputProps, View } from 'react-native';
import { AppText as Text } from '@/components/AppText';
import { colors, radius, spacing, touchMin, typography } from '@/theme';
import { useAppFontsReady } from '@/store/TypographyContext';

interface Props extends TextInputProps {
  label?: string;
  error?: string;
}

export const Input: React.FC<Props> = ({ label, error, style, onFocus, onBlur, ...rest }) => {
  const revealFocus = useContext(FormFocusContext);
  const inputRef = useRef<TextInput>(null);
  const [focused, setFocused] = useState(false);
  const fontsReady = useAppFontsReady();
  return (
    <View style={styles.wrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        ref={inputRef}
        accessibilityLabel={label}
        placeholderTextColor={colors.textMuted}
        style={[styles.input, fontsReady && { fontFamily: 'GeneoRxInter400' }, focused && styles.inputFocused, error && styles.inputError, style]}
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
    borderWidth: 1,
    borderColor: colors.controlBorder,
    backgroundColor: colors.inputBg,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: spacing.sm + 4,
    fontSize: 17,
    color: colors.text,
    minHeight: touchMin,
  },
  // Keep the complete field boundary visible on the soft background.
  inputFocused: { borderColor: colors.primary },
  inputError: { borderColor: colors.danger },
  error: { color: colors.danger, fontSize: 17 },
});
