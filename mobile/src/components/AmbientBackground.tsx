import { useVisualPreferences } from '@/store/VisualPreferencesContext';
import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, AppState, Easing, Image, Keyboard, StyleSheet, View, type ImageStyle, type StyleProp } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/theme';
import { LinearGradient } from 'expo-linear-gradient';

/** Shared branding stays still while typing, off screen, or with reduced motion. */
export const BrandWatermark: React.FC<{ style?: StyleProp<ImageStyle> }> = ({ style }) => {
  const { brandMotion } = useVisualPreferences();
  const motion = useRef(new Animated.Value(0)).current;
  const focused = useIsFocused();
  const [reducedMotion, setReducedMotion] = useState(true);
  const [active, setActive] = useState(AppState.currentState === 'active');
  const [typing, setTyping] = useState(false);

  useEffect(() => {
    let mounted = true;
    void AccessibilityInfo.isReduceMotionEnabled().then(value => {
      if (mounted) setReducedMotion(value);
    }).catch(() => { /* Keep the static background if the preference is unavailable. */ });
    const reduce = AccessibilityInfo.addEventListener('reduceMotionChanged', setReducedMotion);
    const app = AppState.addEventListener('change', state => setActive(state === 'active'));
    const show = Keyboard.addListener('keyboardDidShow', () => setTyping(true));
    const hide = Keyboard.addListener('keyboardDidHide', () => setTyping(false));
    return () => { mounted = false; reduce.remove(); app.remove(); show.remove(); hide.remove(); };
  }, []);

  useEffect(() => {
    if (reducedMotion || !brandMotion) { motion.setValue(0); return; }
    if (!active || !focused || typing) return;
    const animation = Animated.loop(Animated.sequence([
      Animated.timing(motion, { toValue: 1, duration: 12000, easing: Easing.inOut(Easing.sin), useNativeDriver: true, isInteraction: false }),
      Animated.timing(motion, { toValue: 0, duration: 12000, easing: Easing.inOut(Easing.sin), useNativeDriver: true, isInteraction: false }),
    ]));
    animation.start();
    return () => animation.stop();
  }, [active, focused, motion, reducedMotion, typing, brandMotion]);

  return <Animated.Image source={require('../../assets/brand-mark.png')} resizeMode="contain" accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[style, {
      transform: [
        { translateX: motion.interpolate({ inputRange: [0, 1], outputRange: [0, -5] }) },
        { translateY: motion.interpolate({ inputRange: [0, 1], outputRange: [3, -5] }) },
        { scale: motion.interpolate({ inputRange: [0, 1], outputRange: [1, 1.035] }) },
      ],
    }]} />;
};

/** Clip page decoration below the status bar, including every animated frame. */
export const AmbientBackground: React.FC<{ backgroundColor?: string; gradientEndColor?: string; markOpacity?: number; markStyle?: StyleProp<ImageStyle> }> = ({ backgroundColor, gradientEndColor, markOpacity, markStyle }) => {
  const insets = useSafeAreaInsets();
  return <View style={[styles.background, { top: insets.top }, backgroundColor ? { backgroundColor } : null]} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
    {gradientEndColor ? <LinearGradient colors={[backgroundColor || colors.background, gradientEndColor]} start={{ x: 0.15, y: 0 }} end={{ x: 0.85, y: 1 }} style={StyleSheet.absoluteFill} /> : null}
    <Image source={require('../../assets/glass-medicine-background-v1.png')} resizeMode="cover" style={[StyleSheet.absoluteFill, { opacity: .32, top: -90, bottom: -20 }]} accessible={false} />
    <LinearGradient colors={['rgba(245,247,252,0)', 'rgba(245,247,252,0.65)']} style={StyleSheet.absoluteFill} />
    {markOpacity !== 0 ? <BrandWatermark style={[styles.mark, markStyle, markOpacity === undefined ? undefined : { opacity: markOpacity }]} /> : null}
  </View>;
};

const styles = StyleSheet.create({
  background: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: colors.background, overflow: 'hidden' },
  mark: { position: 'absolute', top: 20, right: 4, width: 110, height: 110, tintColor: '#263A59', opacity: 0.05 },
});
