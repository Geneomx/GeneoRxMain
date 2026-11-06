import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText as Text } from '@/components/AppText';
import { colors, radius } from '@/theme';

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
      accessibilityRole={onRemove ? 'button' : 'checkbox'}
      accessibilityLabel={label}
      accessibilityState={onRemove ? undefined : { checked: Boolean(selected) }}
      style={({ pressed }) => [
        styles.base,
        selected ? styles.selected : styles.unselected,
        pressed && { opacity: 0.88 },
      ]}
    >
      <Text style={[styles.text, selected ? styles.textSelected : styles.textUnselected]}>
        {selected && !onRemove ? '✓ ' : ''}{label}
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
    borderRadius: radius.button,
    paddingHorizontal: 12,
    paddingVertical: 9,
    minHeight: 48,
    borderWidth: 1,
  },
  selected: {
    backgroundColor: colors.primary50,
    borderColor: 'transparent',
  },
  unselected: {
    backgroundColor: '#F2F2F7',
    borderColor: 'transparent',
  },
  text: { flexShrink: 1, fontSize: 17, fontWeight: '500' },
  textSelected: { color: colors.primary, fontWeight: '600' },
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
    fontSize: 17,
    fontWeight: '500',
    color: colors.textMuted,
    lineHeight: 20,
  },
  removeIconTextSelected: { color: colors.buttonText },
});
