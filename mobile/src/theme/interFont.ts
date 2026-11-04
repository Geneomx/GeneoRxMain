import React from 'react';
import { StyleSheet, Text, TextInput } from 'react-native';

/**
 * Applies the app typefaces (DM Sans for text, Fraunces for titles) to every
 * native <Text> / <TextInput>, so screens that import Text straight from
 * react-native match the ones using AppText. React Native does not let a single
 * family carry weights, so each fontWeight maps to the matching variant.
 *
 * This is intentionally defensive: any failure falls back to the original
 * element (system font), so a bad style can never crash text rendering.
 * Call patchInterFont() once, AFTER the fonts have loaded.
 */

const WEIGHT_TO_FAMILY: Record<string, string> = {
  '100': 'GeneoRxSans400', '200': 'GeneoRxSans400', '300': 'GeneoRxSans400', '400': 'GeneoRxSans400',
  '500': 'GeneoRxSans500', '600': 'GeneoRxSans600', '700': 'GeneoRxSans700', '800': 'GeneoRxSans700', '900': 'GeneoRxSans700',
  normal: 'GeneoRxSans400', bold: 'GeneoRxSans700',
};

function familyFor(style: unknown): string | null {
  const flat = (StyleSheet.flatten(style as never) || {}) as { fontFamily?: string; fontWeight?: string | number; fontSize?: number };
  // Respect an explicit fontFamily (a monospace snapshot block, a heading style).
  if (flat.fontFamily) return null;
  const weight = String(flat.fontWeight ?? '400');
  if (Number(flat.fontSize) >= 19 && (Number(weight) >= 500 || weight === 'bold')) return 'GeneoRxFraunces700';
  return WEIGHT_TO_FAMILY[weight] ?? 'GeneoRxSans400';
}

let patched = false;

export function patchInterFont(): void {
  if (patched) return;
  patched = true;

  for (const Comp of [Text, TextInput] as unknown as Array<{
    render?: (props: any, ref: any) => unknown;
    __interPatched?: boolean;
  }>) {
    const orig = Comp.render;
    if (typeof orig !== 'function' || Comp.__interPatched) continue;
    Comp.render = function interRender(props: any, ref: any) {
      const element = orig(props, ref);
      if (!React.isValidElement(element)) return element;
      try {
        const el = element as React.ReactElement<{ style?: unknown }>;
        const family = familyFor(el.props.style);
        if (!family) return element;
        return React.cloneElement(el, { style: [el.props.style, { fontFamily: family, fontWeight: 'normal' }] });
      } catch {
        return element;
      }
    };
    Comp.__interPatched = true;
  }
}
