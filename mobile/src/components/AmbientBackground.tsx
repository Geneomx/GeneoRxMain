import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, RadialGradient, Rect, Stop } from 'react-native-svg';

/**
 * Ambient background — mirrors the website body glow:
 *   radial cyan (top-left) + violet (top-right) + pink (bottom-left)
 *   over a vertical #070A12 → #0B1022 base.
 *
 * It paints its OWN opaque base, so it can sit as an absolutely-positioned
 * first child of any screen (behind the content) without needing the screen's
 * own background to be transparent. Purely decorative — never intercepts touches.
 */
export const AmbientBackground: React.FC = () => (
  <View style={StyleSheet.absoluteFill} pointerEvents="none">
    <Svg width="100%" height="100%">
      <Defs>
        <LinearGradient id="amb-base" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#070A12" />
          <Stop offset="1" stopColor="#0B1022" />
        </LinearGradient>
        <RadialGradient id="amb-cyan" cx="0.2" cy="0.02" r="0.65">
          <Stop offset="0" stopColor="#28E1FF" stopOpacity="0.12" />
          <Stop offset="1" stopColor="#28E1FF" stopOpacity="0" />
        </RadialGradient>
        <RadialGradient id="amb-violet" cx="0.86" cy="0.14" r="0.6">
          <Stop offset="0" stopColor="#A78BFA" stopOpacity="0.12" />
          <Stop offset="1" stopColor="#A78BFA" stopOpacity="0" />
        </RadialGradient>
        <RadialGradient id="amb-pink" cx="0.28" cy="1" r="0.65">
          <Stop offset="0" stopColor="#FF4FD8" stopOpacity="0.10" />
          <Stop offset="1" stopColor="#FF4FD8" stopOpacity="0" />
        </RadialGradient>
      </Defs>
      <Rect x="0" y="0" width="100%" height="100%" fill="url(#amb-base)" />
      <Rect x="0" y="0" width="100%" height="100%" fill="url(#amb-cyan)" />
      <Rect x="0" y="0" width="100%" height="100%" fill="url(#amb-violet)" />
      <Rect x="0" y="0" width="100%" height="100%" fill="url(#amb-pink)" />
    </Svg>
  </View>
);
