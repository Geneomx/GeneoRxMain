import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View, ViewStyle } from 'react-native';
import { AppText as Text } from '@/components/AppText';
import { colors } from '@/theme';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'inverse';
interface Props {
  title: string;
  onPress?: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  compact?: boolean;
}

/** The visible shape is 44dp; the outer press target stays at least 48dp. */
export const Button: React.FC<Props> = ({ title, onPress, variant = 'primary', loading = false, disabled = false, style, compact = false }) => {
  const isDisabled = disabled || loading;
  const filled = variant === 'primary' || variant === 'inverse' || variant === 'danger';
  const stretch = !compact && variant !== 'ghost';
  const backgroundColor = variant === 'primary' ? colors.primary : variant === 'inverse' ? colors.surface : variant === 'danger' ? colors.dangerBg : variant === 'secondary' ? colors.primary50 : 'transparent';
  const color = variant === 'primary' ? colors.onPrimary : variant === 'danger' ? colors.danger : colors.primary;
  return <Pressable
    accessible
    accessibilityRole="button"
    accessibilityLabel={title}
    accessibilityState={{ disabled: isDisabled, busy: loading }}
    disabled={isDisabled}
    onPress={onPress}
    style={({ pressed }) => [styles.target, stretch && { alignSelf: 'stretch', width: '100%' }, isDisabled && styles.disabled, pressed && !isDisabled && { opacity: 0.7 }, style]}
  >
    <View importantForAccessibility="no-hide-descendants" style={[styles.shape, compact && styles.compact, filled && styles.filled, stretch && { width: '100%' }, { backgroundColor }]}>
      <Text style={[styles.label, { color }, loading && { opacity: 0 }]}>{title}</Text>
      {loading ? <ActivityIndicator color={color} style={StyleSheet.absoluteFill} /> : null}
    </View>
  </Pressable>;
};

const styles = StyleSheet.create({
  target: { alignSelf: 'center', maxWidth: '100%', minHeight: 48, minWidth: 48, paddingVertical: 2, justifyContent: 'center', alignItems: 'center' },
  shape: { maxWidth: '100%', minHeight: 44, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  filled: { paddingHorizontal: 20, minWidth: 96 },
  compact: { paddingHorizontal: 12 },
  label: { textAlign: 'center', fontSize: 16, lineHeight: 24, fontWeight: '500' },
  disabled: { opacity: 0.45 },
});
