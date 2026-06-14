import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, shadow, spacing } from '@/theme';

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
        pressed && { opacity: 0.88 },
      ]}
    >
      <Text style={[styles.text, selected ? styles.textSelected : styles.textUnselected]}>
        {label}
      </Text>
      {onRemove ? (
        <View style={[styles.removeIcon, selected && styles.removeIconSelected]}>
          <Text style={[styles.removeIconText, selected && styles.removeIconTextSelected]}>×</Text>
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
    paddingHorizontal: 14,
    paddingVertical: 11,
    minHeight: 44,
    borderWidth: 1,
    ...shadow.card,
  },
  selected: {
    backgroundColor: colors.primary100,
    borderColor: colors.primary,
  },
  unselected: {
    backgroundColor: 'rgba(15, 23, 54, 0.45)',
    borderColor: colors.border,
  },
  text: { fontSize: 15, fontWeight: '600' },
  textSelected: { color: colors.text, fontWeight: '900' },
  textUnselected: { color: colors.text },

  removeIcon: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 2,
  },
  removeIconSelected: { backgroundColor: 'rgba(6, 16, 24, 0.15)' },
  removeIconText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textMuted,
    lineHeight: 16,
  },
  removeIconTextSelected: { color: colors.buttonText },
});
