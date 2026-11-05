import React from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { AppText as Text } from '@/components/AppText';
import { colors, fonts } from '@/theme';

export const BrandIdentity: React.FC = () => <View style={styles.identity} accessible accessibilityLabel="GeneoRx">
  <View style={styles.mark}><Image source={require('../../assets/brand-mark-dark.png')} style={styles.logo} resizeMode="contain" /></View>
</View>;

export const BrandHeader: React.FC<{ title?: string; right?: React.ReactNode; accountLabel?: string; initial?: string; onAccount?: () => void }> = ({ title, right, accountLabel, initial, onAccount }) => (
  <View style={styles.header}>
    <BrandIdentity />
    {right ?? (onAccount ? <Pressable accessibilityRole="button" accessibilityLabel={accountLabel} onPress={onAccount} style={styles.avatar}><Text style={styles.initial}>{initial || 'G'}</Text></Pressable> : <Text style={styles.title}>{title}</Text>)}
  </View>
);

const styles = StyleSheet.create({
  header: { minHeight: 54, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.background },
  identity: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  mark: { width: 52, height: 52, alignItems: 'center', justifyContent: 'center' },
  logo: { width: 52, height: 52 },
  name: { fontFamily: fonts.serif, fontSize: 20, letterSpacing: -.5, color: colors.pine },
  title: { fontSize: 15, color: colors.textMuted },
  avatar: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  initial: { width: 30, height: 30, borderRadius: 15, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.primary50, color: colors.primary, fontSize: 16, fontWeight: '500', textAlign: 'center', textAlignVertical: 'center', lineHeight: 28 },
});
