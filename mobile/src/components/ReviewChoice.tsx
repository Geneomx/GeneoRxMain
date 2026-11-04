import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText as Text } from './AppText';
import { AppIcon } from './AppIcon';
import { colors } from '@/theme';

/** A full-width, explicit choice that also works with screen readers and larger text. */
export const ReviewChoice: React.FC<{ label: string; detail?: string; checked: boolean; disabled?: boolean; grouped?: boolean; onChange: () => void; children?: React.ReactNode }> = ({ label, detail, checked, disabled = false, grouped = false, onChange, children }) => <View style={[s.card, grouped && s.grouped, checked && s.selected]}>
  <Pressable accessibilityRole="checkbox" accessibilityLabel={label} accessibilityHint={detail} accessibilityState={{ checked, disabled }} disabled={disabled} onPress={onChange} style={({ pressed }) => [s.choice, (pressed || disabled) && { opacity: .65 }]}>
    <View style={[s.box, checked && s.boxSelected]} accessible={false}>{checked ? <AppIcon name="check" size={17} color={colors.onPrimary} /> : null}</View>
    <View style={s.copy}><Text style={s.label}>{label}</Text>{detail ? <Text style={s.detail}>{detail}</Text> : null}</View>
  </Pressable>
  {children ? <View style={s.children}>{children}</View> : null}
</View>;
const s = StyleSheet.create({
  card: { borderRadius: 18, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, overflow: 'hidden' },
  grouped: { borderRadius: 0, borderWidth: 0, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.borderSoft },
  selected: { borderColor: colors.primary, backgroundColor: colors.primary50 },
  choice: { minHeight: 64, flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 15 },
  box: { width: 24, height: 24, flexShrink: 0, marginTop: 2, borderRadius: 7, borderWidth: 1.5, borderColor: colors.textMuted, justifyContent: 'center', alignItems: 'center' },
  boxSelected: { backgroundColor: colors.primary, borderColor: colors.primary }, copy: { flex: 1, gap: 5 },
  label: { color: colors.text, fontSize: 17, lineHeight: 25, fontWeight: '500' }, detail: { color: colors.textMuted, fontSize: 16, lineHeight: 24 },
  children: { paddingHorizontal: 15, paddingBottom: 15, gap: 8 },
});
