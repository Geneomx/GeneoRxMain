import React, { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { AppText as Text } from '@/components/AppText';
import { colors, radius, spacing, touchMin, typography } from '@/theme';
import { progressPalette } from '@/theme/progress';

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
  inline?: boolean;
  accessibilityLabel?: string;
  appearance?: 'light' | 'dark';
};

export const DropdownSelect: React.FC<Props> = ({
  label,
  placeholder = 'Select…',
  value,
  options,
  onChange,
  disabled = false,
  inline = false,
  accessibilityLabel,
  appearance = 'dark',
}) => {
  const [open, setOpen] = useState(false);
  const dark = appearance === 'dark';

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
      {label ? <Text style={[styles.label, dark && { color: progressPalette.muted }]}>{label}</Text> : null}
      <Pressable
        onPress={() => !disabled && setOpen(true)}
        disabled={disabled}
        style={({ pressed }) => [
          styles.trigger,
          inline && styles.triggerInline,
          dark && { backgroundColor: 'transparent', borderColor: progressPalette.border },
          disabled && styles.triggerDisabled,
          pressed && !disabled && { opacity: 0.85 },
        ]}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel || label || placeholder}
        accessibilityValue={{ text: selectedLabel ?? placeholder }}
        accessibilityState={{ disabled }}
      >
        <Text
          style={[styles.triggerText, !selectedLabel && styles.triggerPlaceholder, dark && { color: progressPalette.text }]}
        >
          {selectedLabel ?? placeholder}
        </Text>
        <Text style={[styles.chevron, dark && { color: progressPalette.muted }]}>▾</Text>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={[styles.sheet, dark && { backgroundColor: progressPalette.surface, borderColor: progressPalette.border }]} onPress={(e) => e.stopPropagation()}>
            {label ? <Text style={[styles.sheetTitle, dark && { color: progressPalette.text }]}>{label}</Text> : null}
            <ScrollView style={styles.list} bounces={false} keyboardShouldPersistTaps="handled">
              {options.map((item) => {
                const selected = item.value === value;
                const isPlaceholder = !item.value;
                return (
                  <Pressable
                    key={item.value || '__placeholder__'}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    onPress={() => choose(item.value)}
                    style={({ pressed }) => [
                      styles.option,
                      selected && styles.optionSelected,
                      isPlaceholder && styles.optionPlaceholder,
                      dark && selected && { backgroundColor: progressPalette.soft, borderColor: progressPalette.border },
                      pressed && { opacity: 0.85 },
                    ]}
                  >
                    <Text
                      style={[
                        styles.optionLabel,
                        selected && styles.optionLabelSelected,
                        isPlaceholder && styles.optionLabelPlaceholder,
                        dark && { color: selected ? progressPalette.accent : progressPalette.text },
                      ]}
                    >
                      {item.label}
                    </Text>
                    {selected && item.value ? <Text style={[styles.check, dark && { color: progressPalette.accent }]}>✓</Text> : null}
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
    backgroundColor: '#F2F2F7',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: spacing.sm + 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  triggerDisabled: { opacity: 0.55 },
  triggerInline: { borderBottomWidth: 0, paddingHorizontal: 0, backgroundColor: 'transparent' },
  triggerText: { flex: 1, fontSize: 17, color: colors.text, fontWeight: '500' },
  triggerPlaceholder: { color: colors.textMuted, fontWeight: '400' },
  chevron: { fontSize: 17, color: colors.textMuted },
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
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
    fontSize: 17,
    fontWeight: '500',
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
  optionLabel: { flex: 1, fontSize: 17, color: colors.text, fontWeight: '500' },
  optionLabelSelected: { color: colors.primary, fontWeight: '500' },
  optionLabelPlaceholder: { color: colors.textMuted },
  check: { fontSize: 17, fontWeight: '500', color: colors.primary },
});
