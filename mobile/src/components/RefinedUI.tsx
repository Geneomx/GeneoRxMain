import React, { useEffect, useRef, useState } from 'react';
import { Image, Keyboard, KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, View } from 'react-native';
import { AppText as Text } from '@/components/AppText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppIcon, type AppIconName } from './AppIcon';
import { Button } from './Button';
import { FormScrollView } from './FormScrollView';
import { useTranslation } from '@/hooks/useTranslation';
import { shadow, colors } from '@/theme';

export const iconTone = (name?: AppIconName) => name === 'heart' ? { backgroundColor: '#F8EDF2', color: '#AC6E84' } : name === 'sun' ? { backgroundColor: '#FCF3E4', color: '#9B7739' } : name === 'spark' || name === 'moon' ? { backgroundColor: '#EEEEFB', color: '#7A73B0' } : name === 'file' ? { backgroundColor: '#EAF4EE', color: '#4E8166' } : { backgroundColor: colors.primary50, color: '#4064AF' };

export const ListRow: React.FC<{ title: string; detail?: string; icon?: AppIconName; value?: string | number; onPress: () => void; last?: boolean }> = ({ title, detail, icon, value, onPress, last }) => <Pressable accessibilityRole="button" accessibilityLabel={[title, detail, value].filter(v => v !== undefined && v !== '').join('. ')} onPress={onPress} style={({ pressed }) => [refined.row, last && { borderBottomWidth: 0 }, pressed && { opacity: 0.65 }]}>
  {icon ? <View style={[refined.icon, { backgroundColor: iconTone(icon).backgroundColor }]}><AppIcon name={icon} size={22} color={iconTone(icon).color} /></View> : null}
  <View style={{ flex: 1, gap: 4 }}><Text style={refined.rowTitle}>{title}</Text>{detail ? <Text style={refined.meta}>{detail}</Text> : null}</View>{value !== undefined ? <Text style={refined.meta}>{value}</Text> : null}<AppIcon name="chevron" color={colors.textDim} size={16} />
</Pressable>;

/** The main accent surface, with readable white text and a quiet white action. */
export const HeroCard: React.FC<{ title: string; body?: string; action: string; onPress: () => void; icon?: AppIconName; meta?: string[] }> = ({ title, body, action, onPress, icon = 'calendar', meta }) => <View style={refined.hero}>
  <View style={{ flexDirection: 'row', gap: 14, alignItems: 'flex-start' }}>
    <View style={{ flex: 1, gap: 6 }}><Text accessibilityRole="header" style={refined.heroTitle}>{title}</Text>{body ? <Text style={refined.heroBody}>{body}</Text> : null}</View>
    <View style={refined.heroIcon} accessible={false}><AppIcon name={icon} size={30} color={colors.onPrimary} /></View>
  </View>
  {meta?.length ? <View style={refined.heroMetaRow}>{meta.map(item => <View key={item} style={refined.heroMeta}><Text style={refined.heroMetaText}>{item}</Text></View>)}</View> : null}
  <Button title={action} variant="inverse" onPress={onPress} />
</View>;

/** Tinted rounded square holding a line icon, used beside screen titles. */
export const IconTile: React.FC<{ name: AppIconName; size?: number }> = ({ name, size = 56 }) => <View style={[refined.tile, { width: size, height: size, borderRadius: Math.round(size * 0.3) }]} accessible={false}><AppIcon name={name} size={Math.round(size * 0.5)} /></View>;

export const SectionHeading: React.FC<{ title: string; action?: string; onPress?: () => void }> = ({ title, action, onPress }) => <View style={refined.heading}><Text style={refined.headingText} accessibilityRole="header">{title}</Text>{action && onPress ? <Pressable accessibilityRole="button" onPress={onPress} style={refined.link}><Text style={refined.linkText}>{action}</Text></Pressable> : null}</View>;

export const EditorSheet: React.FC<{ visible: boolean; title: string; onClose: () => void; children: React.ReactNode; footer?: React.ReactNode; contentKey?: string }> = ({ visible, title, onClose, children, footer, contentKey }) => {
  const { t } = useTranslation();
  const [keyboardOpen, setKeyboardOpen] = useState(Keyboard.isVisible());
  const [keyboardHeight, setKeyboardHeight] = useState(Keyboard.metrics()?.height ?? 0);
  const [viewportHeight, setViewportHeight] = useState(0);
  const fullViewportHeight = useRef(0);
  useEffect(() => {
    const shown = Keyboard.addListener('keyboardDidShow', event => { setKeyboardOpen(true); setKeyboardHeight(event.endCoordinates.height); });
    const hidden = Keyboard.addListener('keyboardDidHide', () => { setKeyboardOpen(false); setKeyboardHeight(0); });
    return () => { shown.remove(); hidden.remove(); };
  }, []);
  const fitAndroidKeyboard = Platform.OS === 'android' && keyboardOpen;
  // Modal windows can resize before their percentage-height children do.
  // Bound the sheet explicitly, retaining a fixed footer and a scrollable form.
  const keyboardSpace = fullViewportHeight.current > 0 ? Math.max(0, fullViewportHeight.current - keyboardHeight) : viewportHeight;
  const androidHeight = Math.min(viewportHeight, keyboardSpace || viewportHeight);
  return <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
    <KeyboardAvoidingView style={refined.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined} onLayout={event => { const height = event.nativeEvent.layout.height; if (!keyboardOpen) fullViewportHeight.current = Math.max(fullViewportHeight.current, height); setViewportHeight(height); }}>
      <Pressable style={StyleSheet.absoluteFill} accessibilityRole="button" accessibilityLabel={t('common.close')} onPress={onClose} />
      <SafeAreaView style={[refined.sheet, fitAndroidKeyboard && androidHeight > 0 && { height: androidHeight, maxHeight: androidHeight }]} edges={['bottom']} accessibilityViewIsModal>
        <Image source={require('../../assets/glass-medicine-background-v1.png')} resizeMode="cover" style={[StyleSheet.absoluteFill, { opacity: .25 }]} accessible={false} />
        <View style={refined.sheetHandle} accessible={false} />
        <View style={refined.heading}><Text accessibilityRole="header" style={refined.sheetTitle}>{title}</Text><Button compact variant="ghost" title={t('common.close')} onPress={onClose} /></View>
        <FormScrollView key={contentKey} style={fitAndroidKeyboard ? { flex: 1 } : undefined} showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 16, paddingBottom: 20 }}>{children}</FormScrollView>
        {footer ? <View style={refined.sheetFooter}>{footer}</View> : null}
      </SafeAreaView>
    </KeyboardAvoidingView>
  </Modal>;
};

export const refined = StyleSheet.create({
  listGroup: { backgroundColor: colors.glass, borderRadius: 26, paddingHorizontal: 16, borderWidth: 1, borderColor: colors.glassBorder, ...shadow.card },
  row: { minHeight: 70, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomColor: colors.borderSoft, borderBottomWidth: StyleSheet.hairlineWidth },
  rowTitle: { color: colors.text, fontSize: 17, fontWeight: '500', lineHeight: 24 },
  meta: { color: colors.textMuted, fontSize: 16, lineHeight: 23 },
  icon: { width: 40, height: 40, borderRadius: 14, backgroundColor: colors.primary50, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  heading: { flexWrap: 'wrap', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  headingText: { flex: 1, fontSize: 18, fontWeight: '500', color: colors.text, letterSpacing: -0.1 },
  link: { minHeight: 48, paddingHorizontal: 6, justifyContent: 'center' },
  linkText: { fontSize: 16, fontWeight: '500', color: colors.primary },
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(30,55,98,.24)' },
  sheet: { backgroundColor: '#F8FAFF', maxHeight: '90%', borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingHorizontal: 20, paddingBottom: 20, paddingTop: 10, gap: 16, overflow: 'hidden' },
  sheetHandle: { width: 32, height: 4, borderRadius: 2, backgroundColor: colors.borderStrong, alignSelf: 'center' },
  sheetTitle: { flex: 1, fontSize: 19, fontWeight: '500', color: colors.text },
  sheetFooter: { flexShrink: 0, gap: 8 },
  body: { fontSize: 17, lineHeight: 23, color: colors.textSoft },
  metricRow: { flexDirection: 'row', gap: 12 },
  hero: { backgroundColor: colors.primary, borderRadius: 24, padding: 20, gap: 16, shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 12, elevation: 2 },
  heroTitle: { color: colors.onPrimary, fontSize: 19, lineHeight: 25, fontWeight: '500', letterSpacing: -0.1 },
  heroBody: { color: colors.onPrimary, opacity: 0.92, fontSize: 17, lineHeight: 25 },
  heroIcon: { width: 56, height: 56, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  tile: { backgroundColor: colors.primary50, alignItems: 'center', justifyContent: 'center' },
  heroMetaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  heroMeta: { backgroundColor: 'rgba(255,255,255,0.16)', borderRadius: 999, paddingVertical: 6, paddingHorizontal: 12 },
  heroMetaText: { color: colors.onPrimary, fontSize: 15, lineHeight: 20, fontWeight: '500' },
  pill: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 999, paddingVertical: 5, paddingHorizontal: 12 },
  metric: { flex: 1, borderRadius: 20, padding: 16, gap: 5, backgroundColor: colors.surface, borderWidth: 0, borderColor: colors.border, ...shadow.card },
  metricValue: { fontSize: 26, fontWeight: '500', color: colors.primaryDark, letterSpacing: -0.4 },
});
