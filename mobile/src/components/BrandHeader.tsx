import React from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { AppText as Text } from '@/components/AppText';
import { colors, fonts } from '@/theme';

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
  header: { minHeight: 54, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.background },
  identity: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  mark: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.pine, alignItems: 'center', justifyContent: 'center' },
  // brand-mark.png draws the GX left of centre inside its square: nudge it back so it sits centred in the circle.
  logo: { width: 30, height: 30, transform: [{ translateX: 2.5 }, { scale: 1.1 }] },
  name: { fontFamily: fonts.serif, fontSize: 20, letterSpacing: -.5, color: colors.pine },
  title: { fontSize: 15, color: colors.textMuted },
  avatar: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  initial: { width: 30, height: 30, borderRadius: 15, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.primary50, color: colors.primary, fontSize: 16, fontWeight: '500', textAlign: 'center', textAlignVertical: 'center', lineHeight: 28 },
});
