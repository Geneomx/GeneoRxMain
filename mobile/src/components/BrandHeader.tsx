import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '@/theme';

export const BrandIdentity: React.FC = () => <View style={styles.identity} accessible accessibilityLabel="GeneoRx">
  <View style={styles.mark}><Image source={require('../../assets/brand-mark.png')} style={styles.logo} resizeMode="contain" /></View>
  <Text style={styles.name}>GeneoRx</Text>
</View>;

export const BrandHeader: React.FC<{ title?: string; right?: React.ReactNode; accountLabel?: string; initial?: string; onAccount?: () => void }> = ({ title, right, accountLabel, initial, onAccount }) => (
  <View style={styles.header}>
    <BrandIdentity />
    {right ?? (onAccount ? <Pressable accessibilityRole="button" accessibilityLabel={accountLabel} onPress={onAccount} style={styles.avatar}><Text style={styles.initial}>{initial || 'G'}</Text></Pressable> : <Text style={styles.title}>{title}</Text>)}
  </View>
);

const styles = StyleSheet.create({
  header: { minHeight: 54, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.surface, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.borderSoft },
  identity: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  mark: { width: 30, height: 30, borderRadius: 9, backgroundColor: '#152231', alignItems: 'center', justifyContent: 'center' },
  logo: { width: 28, height: 28 },
  name: { fontSize: 17, fontWeight: '500', letterSpacing: -.4, color: colors.text },
  title: { fontSize: 15, color: colors.textMuted },
  avatar: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  initial: { width: 30, height: 30, borderRadius: 15, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.primary50, color: colors.primary, fontSize: 16, fontWeight: '500', textAlign: 'center', textAlignVertical: 'center', lineHeight: 28 },
});
