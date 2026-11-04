import React from 'react';
import Svg, { Circle, G, Path, Rect } from 'react-native-svg';
import { colors } from '@/theme';

/** A leaf sprig used as a quiet motif on heroes and headers. */
export const Sprig: React.FC<{ size?: number; color?: string; opacity?: number }> = ({ size = 120, color = colors.sage, opacity = 0.2 }) => (
  <Svg width={size} height={size} viewBox="0 0 170 170" opacity={opacity} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
    <Path d="M20 168C30 110 60 60 130 14" fill="none" stroke={color} strokeWidth={3} strokeLinecap="round" />
    <G fill={color}>
      <Path d="M0 0C12-11 30-11 42 0C30 11 12 11 0 0z" transform="translate(34 128) rotate(-20)" />
      <Path d="M0 0C12-11 30-11 42 0C30 11 12 11 0 0z" transform="translate(36 124) rotate(-150)" />
      <Path d="M0 0C12-11 30-11 42 0C30 11 12 11 0 0z" transform="translate(62 84) rotate(-30)" />
      <Path d="M0 0C12-11 30-11 42 0C30 11 12 11 0 0z" transform="translate(64 80) rotate(-155)" />
      <Path d="M0 0C12-11 30-11 42 0C30 11 12 11 0 0z" transform="translate(96 46) rotate(-40)" />
      <Path d="M0 0C12-11 30-11 42 0C30 11 12 11 0 0z" transform="translate(98 42) rotate(-150)" />
    </G>
  </Svg>
);

/** Welcome illustration: a capsule held in a pine circle, a sprig, a coral sun and a dashed orbit. */
export const WelcomeArt: React.FC<{ width?: number }> = ({ width = 300 }) => (
  <Svg width={width} height={(width * 250) / 320} viewBox="0 0 320 250" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
    <Circle cx={160} cy={125} r={118} fill={colors.primary50} />
    <Circle cx={160} cy={125} r={108} fill="none" stroke={colors.coralSoft} strokeWidth={2} strokeDasharray="2 9" strokeLinecap="round" />
    <Circle cx={160} cy={125} r={86} fill={colors.pine} />
    <G transform="rotate(-35 160 125)">
      <Path d="M160 101h-38a24 24 0 0 0 0 48h38z" fill={colors.coralSoft} />
      <Path d="M160 101h38a24 24 0 0 1 0 48h-38z" fill="#FFFBF3" />
      <Rect x={128} y={108} width={24} height={5} rx={2.5} fill="#FFFFFF" opacity={0.4} />
    </G>
    <Circle cx={256} cy={44} r={15} fill={colors.coralSoft} />
    <G transform="translate(44 232) scale(0.62)">
      <Path d="M0 0C10-70 60-120 130-170" fill="none" stroke={colors.pine2} strokeWidth={4} strokeLinecap="round" />
      <G fill={colors.pine2}>
        <Path d="M0 0C12-11 30-11 42 0C30 11 12 11 0 0z" transform="translate(8 -44) rotate(-20)" />
        <Path d="M0 0C12-11 30-11 42 0C30 11 12 11 0 0z" transform="translate(10 -48) rotate(-150)" />
        <Path d="M0 0C12-11 30-11 42 0C30 11 12 11 0 0z" transform="translate(40 -92) rotate(-35)" />
        <Path d="M0 0C12-11 30-11 42 0C30 11 12 11 0 0z" transform="translate(42 -96) rotate(-155)" />
        <Path d="M0 0C12-11 30-11 42 0C30 11 12 11 0 0z" transform="translate(84 -134) rotate(-40)" />
      </G>
    </G>
  </Svg>
);
