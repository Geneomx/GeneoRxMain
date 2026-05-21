import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { colors, radius, shadow, spacing, typography } from '@/theme';

interface Props {
  title?: string;
  subtitle?: string;
  children?: React.ReactNode;
  style?: ViewStyle;
  accent?: boolean;
}

export const Card: React.FC<Props> = ({ title, subtitle, children, style, accent }) => (
  <View style={[styles.card, accent && styles.accent, style]}>
    {title ? <Text style={styles.title}>{title}</Text> : null}
    {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    {children}
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    ...shadow.card,
  },
  accent: {
    backgroundColor: colors.primary50,
    borderColor: colors.primary100,
  },
  title:    { ...typography.h3 },
  subtitle: { ...typography.bodyMuted },
});
