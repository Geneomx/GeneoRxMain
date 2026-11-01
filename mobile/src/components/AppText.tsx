import React, { forwardRef } from 'react';
import { StyleSheet, Text as NativeText, type TextProps, type TextStyle } from 'react-native';
import { useAppFontsReady } from '@/store/TypographyContext';

/** Explicit font adoption, preserving native scaling and any caller-specified family. */
export const AppText = forwardRef<NativeText, TextProps>(({ style, ...props }, ref) => {
  const ready = useAppFontsReady();
  const flat = StyleSheet.flatten(style);
  const weight = flat?.fontWeight === 'bold' ? 700 : Number(flat?.fontWeight) || 400;
  const font: TextStyle | undefined = ready && !flat?.fontFamily ? {
    fontFamily: weight >= 600 ? 'GeneoRxInter600' : weight >= 500 ? 'GeneoRxInter500' : 'GeneoRxInter400',
    fontWeight: 'normal',
  } : undefined;
  return <NativeText {...props} ref={ref} style={[style, font]} />;
});
AppText.displayName = 'AppText';
