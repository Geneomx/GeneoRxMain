import React, { forwardRef } from 'react';
import { StyleSheet, Text as NativeText, TextInput as NativeTextInput, type TextInputInstance, type TextInputProps, type TextInstance, type TextProps, type TextStyle } from 'react-native';
import { useAppFontsReady } from '@/store/TypographyContext';

/** Explicit font adoption, preserving native scaling and any caller-specified family. */
export const AppText = forwardRef<TextInstance, TextProps>(({ style, ...props }, ref) => {
  const ready = useAppFontsReady();
  const flat = StyleSheet.flatten(style);
  const weight = flat?.fontWeight === 'bold' ? 700 : Number(flat?.fontWeight) || 400;
  // Titles (19pt and up, medium weight or heavier) use the serif; everything else the sans.
  const serif = Number(flat?.fontSize) >= 19 && weight >= 500;
  const font: TextStyle | undefined = ready && !flat?.fontFamily ? serif ? {
    fontFamily: 'GeneoRxFraunces700',
    fontWeight: 'normal',
  } : {
    fontFamily: weight >= 700 ? 'GeneoRxSans700' : weight >= 600 ? 'GeneoRxSans600' : weight >= 500 ? 'GeneoRxSans500' : 'GeneoRxSans400',
    fontWeight: 'normal',
  } : undefined;
  return <NativeText {...props} ref={ref} style={[style, font]} />;
});
AppText.displayName = 'AppText';

/** Typed text and placeholders use the same sans as the labels around them. */
export const AppTextInput = forwardRef<TextInputInstance, TextInputProps>(({ style, ...props }, ref) => {
  const ready = useAppFontsReady();
  const flat = StyleSheet.flatten(style);
  const font: TextStyle | undefined = ready && !flat?.fontFamily ? { fontFamily: 'GeneoRxSans500', fontWeight: 'normal' } : undefined;
  return <NativeTextInput {...props} ref={ref} style={[style, font]} />;
});
AppTextInput.displayName = 'AppTextInput';
