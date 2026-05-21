import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '@/theme';

interface Props {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  onRemove?: () => void;
}

export const Chip: React.FC<Props> = ({ label, selected, onPress, onRemove }) => {
  return (
    <Pressable
      onPress={onRemove ?? onPress}
      style={({ pressed }) => [
        styles.base,
        selected ? styles.selected : styles.unselected,
        pressed && { opacity: 0.85 },
      ]}
    >
      <Text style={[styles.text, selected ? styles.textSelected : styles.textUnselected]}>
        {label}
      </Text>
      {onRemove ? (
        <View style={[styles.removeIcon, selected && styles.removeIconSelected]}>
          <Text style={[styles.removeIconText, selected && { color: '#FFFFFF' }]}>×</Text>
        </View>
      ) : null}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
  },
  selected: { backgroundColor: colors.primary, borderColor: colors.primary },
  unselected: { backgroundColor: colors.primary50, borderColor: colors.primary100 },
  text: { fontSize: 13, fontWeight: '600' },
  textSelected: { color: '#FFFFFF' },
  textUnselected: { color: colors.primaryDark },

  removeIcon: {
    width: 16, height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(14, 124, 102, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 2,
  },
  removeIconSelected: { backgroundColor: 'rgba(255, 255, 255, 0.25)' },
  removeIconText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primaryDark,
    lineHeight: 16,
  },
});
