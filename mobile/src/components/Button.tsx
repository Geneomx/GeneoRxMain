import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View, ViewStyle } from 'react-native';
import { AppText as Text } from '@/components/AppText';
import { colors, shadow } from '@/theme';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'inverse';
interface Props {
  title: string;
  onPress?: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  compact?: boolean;
  /** Stretch a quiet (ghost) button to the full width, so stacked actions line up. */
  full?: boolean;
}

/** The visible shape is 44dp; the outer press target stays at least 48dp. */
export const Button: React.FC<Props> = ({ title, onPress, variant = 'primary', loading = false, disabled = false, style, compact = false, full = false }) => {
  const isDisabled = disabled || loading;
  const filled = variant === 'primary' || variant === 'inverse' || variant === 'danger';
  const stretch = !compact && (variant !== 'ghost' || full);
  const backgroundColor = variant === 'primary' ? colors.buttonPrimary : variant === 'inverse' ? colors.surface : variant === 'danger' ? colors.dangerBg : variant === 'secondary' ? colors.primary50 : '#F2F2F7';
  const color = variant === 'primary' ? colors.onPrimary : variant === 'danger' ? colors.danger : variant === 'secondary' ? colors.buttonPrimary : colors.pine;
  return <Pressable
    accessible
    accessibilityRole="button"
    accessibilityLabel={title}
    accessibilityState={{ disabled: isDisabled, busy: loading }}
    disabled={isDisabled}
    onPress={onPress}
    style={({ pressed }) => [styles.target, stretch && { alignSelf: 'stretch', width: '100%' }, isDisabled && styles.disabled, pressed && !isDisabled && { opacity: 0.7 }, style]}
  >
    <View importantForAccessibility="no-hide-descendants" style={[styles.shape, compact && styles.compact, filled && styles.filled, variant === 'primary' && shadow.cta, variant === 'ghost' && styles.ghostShape, variant === 'secondary' && styles.softShape, stretch && { width: '100%' }, { backgroundColor }]}>
      <Text style={[styles.label, { color }, loading && { opacity: 0 }]}>{title}</Text>
      {loading ? <ActivityIndicator color={color} style={StyleSheet.absoluteFill} /> : null}
    </View>
  </Pressable>;
};

const styles = StyleSheet.create({
  target: { alignSelf: 'center', maxWidth: '100%', minHeight: 48, minWidth: 48, paddingVertical: 2, justifyContent: 'center', alignItems: 'center' },
  shape: { maxWidth: '100%', minHeight: 44, paddingVertical: 8, paddingHorizontal: 18, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  filled: { paddingHorizontal: 24, minWidth: 96 },
  // Soft fills, no outlines: grey for quiet actions, blue tint for secondary ones.
  ghostShape: {},
  softShape: {},
  compact: { paddingHorizontal: 12 },
  label: { textAlign: 'center', fontSize: 15, lineHeight: 20, fontWeight: '600', letterSpacing: -0.1 },
  disabled: { opacity: 0.45 },
});
