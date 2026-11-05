import React, { useEffect, useRef } from 'react';
import { AccessibilityInfo, Animated, Easing, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

/**
 * The GeneoRx mark as a soft watermark that drifts up and down and tilts a little.
 * Purely decorative; it stands still when the device asks for reduced motion.
 */
export const FloatingMark: React.FC<{
  size?: number; opacity?: number; tint?: string; travel?: number; tilt?: number; duration?: number; delay?: number; style?: StyleProp<ViewStyle>;
}> = ({ size = 180, opacity = 0.1, tint = '#FFFFFF', travel = 12, tilt = 6, duration = 4200, delay = 0, style }) => {
  const t = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let loop: Animated.CompositeAnimation | undefined;
    let cancelled = false;
    void AccessibilityInfo.isReduceMotionEnabled().then(reduced => {
      if (cancelled || reduced) return;
      loop = Animated.loop(Animated.sequence([
        Animated.timing(t, { toValue: 1, duration, delay, easing: Easing.inOut(Easing.sin), useNativeDriver: true, isInteraction: false }),
        Animated.timing(t, { toValue: 0, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true, isInteraction: false }),
      ]));
      loop.start();
    }).catch(() => { /* Keep the mark still if the preference is unavailable. */ });
    return () => { cancelled = true; loop?.stop(); };
  }, [t, duration, delay]);

  return <Animated.View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[styles.wrap, { width: size, height: size, opacity, transform: [
    { translateY: t.interpolate({ inputRange: [0, 1], outputRange: [travel, -travel] }) },
    { rotate: t.interpolate({ inputRange: [0, 1], outputRange: [`${-tilt}deg`, `${tilt}deg`] }) },
    { scale: t.interpolate({ inputRange: [0, 1], outputRange: [0.97, 1.04] }) },
  ] }, style]}>
    <Animated.Image source={require('../../assets/brand-mark.png')} resizeMode="contain" style={{ width: size, height: size, tintColor: tint }} />
  </Animated.View>;
};

const styles = StyleSheet.create({ wrap: { position: 'absolute' } });
