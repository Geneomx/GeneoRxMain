import React, { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { colors, radius, spacing, touchMin, typography } from '@/theme';

export type DropdownOption = {
  value: string;
  label: string;
};

type Props = {
  label?: string;
  placeholder?: string;
  value: string;
  options: DropdownOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
};

export const DropdownSelect: React.FC<Props> = ({
  label,
  placeholder = 'Select…',
  value,
  options,
  onChange,
  disabled = false,
}) => {
  const [open, setOpen] = useState(false);

  const selectedLabel = useMemo(
    () => options.find((o) => o.value === value)?.label,
    [options, value],
  );

  function choose(next: string) {
    setOpen(false);
    onChange(next);
  }

  return (
    <View style={styles.wrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <Pressable
        onPress={() => !disabled && setOpen(true)}
        disabled={disabled}
        style={({ pressed }) => [
          styles.trigger,
          disabled && styles.triggerDisabled,
          pressed && !disabled && { opacity: 0.85 },
        ]}
        accessibilityRole="button"
      >
        <Text
          style={[styles.triggerText, !selectedLabel && styles.triggerPlaceholder]}
          numberOfLines={1}
        >
          {selectedLabel ?? placeholder}
        </Text>
        <Text style={styles.chevron}>▾</Text>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            {label ? <Text style={styles.sheetTitle}>{label}</Text> : null}
            <ScrollView style={styles.list} bounces={false} keyboardShouldPersistTaps="handled">
              {options.map((item) => {
                const selected = item.value === value;
                const isPlaceholder = !item.value;
                return (
                  <Pressable
                    key={item.value || '__placeholder__'}
                    onPress={() => choose(item.value)}
                    style={({ pressed }) => [
                      styles.option,
                      selected && styles.optionSelected,
                      isPlaceholder && styles.optionPlaceholder,
                      pressed && { opacity: 0.85 },
                    ]}
                  >
                    <Text
                      style={[
                        styles.optionLabel,
                        selected && styles.optionLabelSelected,
                        isPlaceholder && styles.optionLabelPlaceholder,
                      ]}
                    >
                      {item.label}
                    </Text>
                    {selected && item.value ? <Text style={styles.check}>✓</Text> : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { gap: spacing.xs },
  label: { ...typography.label },
  trigger: {
    minHeight: touchMin,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  triggerDisabled: { opacity: 0.55 },
  triggerText: { flex: 1, fontSize: 16, color: colors.text, fontWeight: '500' },
  triggerPlaceholder: { color: colors.textMuted, fontWeight: '400' },
  chevron: { fontSize: 14, color: colors.textMuted },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    maxHeight: '70%',
    backgroundColor: colors.backgroundAlt,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  list: { paddingHorizontal: spacing.md },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: 16,
    minHeight: touchMin,
    borderRadius: radius.md,
    marginBottom: 4,
  },
  optionSelected: {
    backgroundColor: colors.primary50,
    borderWidth: 1,
    borderColor: colors.primary100,
  },
  optionPlaceholder: { borderBottomWidth: 1, borderBottomColor: colors.borderSoft },
  optionLabel: { flex: 1, fontSize: 16, color: colors.text, fontWeight: '500' },
  optionLabelSelected: { color: colors.primary, fontWeight: '700' },
  optionLabelPlaceholder: { color: colors.textMuted },
  check: { fontSize: 16, fontWeight: '800', color: colors.primary },
});
