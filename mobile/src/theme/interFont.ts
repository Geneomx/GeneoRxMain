import React from 'react';
import { StyleSheet, Text, TextInput } from 'react-native';

/**
 * Applies the Inter typeface globally so the app's typography matches the
 * website (which uses Inter). React Native does not let a single family carry
 * weights, so we map each fontWeight to the matching Inter variant and inject
 * it into every <Text> / <TextInput> via their forwardRef render.
 *
 * This is intentionally defensive: any failure falls back to the original
 * element (system font), so a bad style can never crash text rendering.
 * Call patchInterFont() once, AFTER the Inter fonts have loaded.
 */

const WEIGHT_TO_FAMILY: Record<string, string> = {
  '100': 'Inter_300Light',
  '200': 'Inter_300Light',
  '300': 'Inter_300Light',
  '400': 'Inter_400Regular',
  '500': 'Inter_500Medium',
  '600': 'Inter_600SemiBold',
  '700': 'Inter_700Bold',
  '800': 'Inter_800ExtraBold',
  '900': 'Inter_900Black',
  normal: 'Inter_400Regular',
  bold: 'Inter_700Bold',
};

function familyFor(style: unknown): string {
  const flat = (StyleSheet.flatten(style as never) || {}) as {
    fontFamily?: string;
    fontWeight?: string | number;
  };
  // Respect an explicit fontFamily (e.g. a monospace snapshot block).
  if (flat.fontFamily) return flat.fontFamily;
  return WEIGHT_TO_FAMILY[String(flat.fontWeight ?? '400')] ?? 'Inter_400Regular';
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
        return React.cloneElement(el, { style: [{ fontFamily: family }, el.props.style] });
      } catch {
        return element;
      }
    };
    Comp.__interPatched = true;
  }
}
