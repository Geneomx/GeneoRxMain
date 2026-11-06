import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, type ScrollViewInstance, StyleSheet, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import { AppText as Text } from './AppText';
import { AppIcon, type AppIconName } from './AppIcon';
import { Button } from './Button';
import { useToast } from './Toast';
import { useTranslation } from '@/hooks/useTranslation';
import { colors } from '@/theme';

export type SnapshotAction = { key: string; title: string; icon: AppIconName; onPress: () => void; loading?: boolean };

/** A reading sheet. Copy/share/export keep the complete record, including hidden detail. */
export const SnapshotPreview: React.FC<{
  visible: boolean; text: string; title?: string; subtitle?: string; children?: React.ReactNode;
  actions?: SnapshotAction[]; icon?: AppIconName; onClose: () => void; onShare?: () => void;
  primaryAction?: { title: string; onPress: () => void };
  /** Visible Copy and Print buttons under the text, like the website's popup. */
  quickActions?: { copy?: boolean; print?: { title: string; onPress: () => void; loading?: boolean } };
  reading?: { label: string; stopLabel: string; onStop: () => void };
}> = ({ visible, text, title, subtitle, children, actions = [], icon = 'file', onClose, onShare, primaryAction, reading, quickActions }) => {
  const { t } = useTranslation();
  const toast = useToast();
  const { fontScale } = useWindowDimensions();
  const body = useRef<ScrollViewInstance>(null);
  const [moreOpen, setMoreOpen] = useState(false);
  const busy = actions.some(action => action.loading);
  useEffect(() => { if (!visible) setMoreOpen(false); }, [visible]);
  const close = () => { setMoreOpen(false); onClose(); };
  const copy = async () => {
    setMoreOpen(false);
    try { await Clipboard.setStringAsync(text); toast.show(t('toast.copied')); }
    catch { toast.show(t('mobile.alert.try_again'), 'error'); }
  };
  const menu: SnapshotAction[] = [...(onShare ? [{ key: 'copy', title: t('modal.snapshot.copy'), icon: 'copy' as const, onPress: () => { void copy(); } }] : []), ...actions];
  return <Modal visible={visible} transparent animationType="slide" onShow={() => body.current?.scrollTo({ y: 0, animated: false })} onRequestClose={() => moreOpen ? setMoreOpen(false) : close()}>
    <View style={s.overlay}>
      <Pressable style={StyleSheet.absoluteFill} onPress={close} accessibilityRole="button" accessibilityLabel={t('common.close')} />
      <SafeAreaView style={s.sheet} edges={['bottom', 'left', 'right']} accessibilityViewIsModal>
        <View style={s.grip} accessible={false} />
        <View style={s.header}>
          {fontScale <= 1.3 ? <View style={s.documentIcon} accessible={false}><AppIcon name={icon} size={22} /></View> : null}
          <View style={s.headerCopy}><Text accessibilityRole="header" style={s.title}>{title || t('modal.snapshot.title')}</Text>{subtitle ? <Text style={s.subtitle}>{subtitle}</Text> : null}</View>
          <Pressable accessibilityRole="button" accessibilityLabel={t('common.close')} onPress={close} style={s.close}><AppIcon name="close" size={20} color={colors.textMuted} /></Pressable>
        </View>
        {reading ? <View style={[s.readingStatus, fontScale > 1.3 && { flexDirection: 'column', alignItems: 'flex-start', paddingTop: 8 }]}><Text accessibilityLiveRegion="polite" style={[s.subtitle, { flex: fontScale > 1.3 ? 0 : 1 }]}>{reading.label}</Text><Pressable accessibilityRole="button" accessibilityLabel={reading.stopLabel} onPress={reading.onStop} style={s.stopReading}><AppIcon name="stop" size={18} /><Text style={s.moreLabel}>{reading.stopLabel}</Text></Pressable></View> : null}
        <ScrollView ref={body} style={s.reading} contentContainerStyle={s.content} showsVerticalScrollIndicator>{children || <Text selectable style={s.body}>{text}</Text>}</ScrollView>
        {quickActions ? <View style={s.quickRow}>
          {quickActions.copy ? <Pressable accessibilityRole="button" accessibilityLabel={t('modal.snapshot.copy')} onPress={() => { void copy(); }} style={({ pressed }) => [s.quick, pressed && { opacity: .65 }]}><AppIcon name="copy" size={18} color={colors.text} /><Text style={s.quickText}>{t('modal.snapshot.copy')}</Text></Pressable> : null}
          {quickActions.print ? <Pressable accessibilityRole="button" accessibilityLabel={quickActions.print.title} disabled={busy || quickActions.print.loading} onPress={quickActions.print.onPress} style={({ pressed }) => [s.quick, pressed && { opacity: .65 }]}>{quickActions.print.loading ? <ActivityIndicator color={colors.text} /> : <AppIcon name="download" size={18} color={colors.text} />}<Text style={s.quickText}>{quickActions.print.title}</Text></Pressable> : null}
        </View> : null}
        {moreOpen ? <View style={s.options}>
          <Text accessibilityRole="header" style={s.optionsTitle}>{t('calm.summary_options')}</Text>
          <ScrollView showsVerticalScrollIndicator contentContainerStyle={s.optionRows}>{menu.map((action, index) => <Pressable key={action.key} accessibilityRole="button" accessibilityLabel={action.title} accessibilityState={{ disabled: busy, busy: !!action.loading }} disabled={busy} onPress={() => { setMoreOpen(false); action.onPress(); }} style={({ pressed }) => [s.option, index < menu.length - 1 && s.optionDivider, pressed && { opacity: .6 }]}>
            <AppIcon name={action.icon} size={21} color={colors.primary} /><Text style={s.optionText}>{action.title}</Text>{action.loading ? <ActivityIndicator color={colors.primary} /> : <AppIcon name="chevron" size={15} color={colors.textDim} />}
          </Pressable>)}</ScrollView>
        </View> : null}
        {onShare || primaryAction || menu.length ? <View style={[s.footer, fontScale > 1.3 && s.footerLarge]}>
          <View style={[s.share, fontScale > 1.3 && { flex: 0 }]}><Button title={primaryAction?.title || t(onShare ? 'portal.share' : 'common.close')} disabled={busy} onPress={primaryAction?.onPress || onShare || close} /></View>
          {menu.length ? <Pressable accessibilityRole="button" accessibilityLabel={t('calm.more')} accessibilityState={{ expanded: moreOpen, disabled: busy, busy }} disabled={busy} onPress={() => setMoreOpen(open => !open)} style={({ pressed }) => [s.more, pressed && { opacity: .65 }]}>{busy ? <ActivityIndicator color={colors.primary} /> : <Text style={s.moreLabel}>{t('calm.more')}</Text>}</Pressable> : null}
        </View> : null}
      </SafeAreaView>
    </View>
  </Modal>;
};
const s = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', alignItems: 'center', backgroundColor: colors.overlay },
  sheet: { width: '100%', maxWidth: 640, height: '94%', backgroundColor: colors.surface, borderTopLeftRadius: 30, borderTopRightRadius: 30, overflow: 'hidden' },
  grip: { width: 32, height: 4, marginTop: 10, marginBottom: 8, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center' },
  header: { flexShrink: 0, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingTop: 8, paddingBottom: 18, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.borderSoft },
  documentIcon: { width: 42, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary50 },
  headerCopy: { flex: 1, gap: 4 }, title: { fontSize: 20, lineHeight: 27, fontWeight: '600', color: colors.text, letterSpacing: -.4 },
  subtitle: { fontSize: 15, lineHeight: 22, color: colors.textMuted }, close: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceAlt },
  reading: { flex: 1, minHeight: 0 }, content: { padding: 22, paddingBottom: 30 }, body: { fontSize: 17, lineHeight: 26, color: colors.textSoft },
  footer: { flexShrink: 0, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 14, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.borderSoft },
  footerLarge: { flexDirection: 'column', alignItems: 'stretch', gap: 4 }, share: { flex: 1 }, more: { minWidth: 84, minHeight: 48, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 18, backgroundColor: colors.primary50, alignSelf: 'center', alignItems: 'center', justifyContent: 'center' }, moreLabel: { fontSize: 16, lineHeight: 24, fontWeight: '500', color: colors.primary },
  quickRow: { flexShrink: 0, flexDirection: 'row', gap: 10, paddingHorizontal: 20, paddingTop: 10 },
  quick: { flex: 1, minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 22, backgroundColor: '#F2F2F7' },
  quickText: { fontSize: 15, lineHeight: 20, fontWeight: '600', color: colors.text },
  options: { flexShrink: 1, maxHeight: '48%', marginHorizontal: 20, marginBottom: 12, paddingHorizontal: 16, paddingTop: 14, borderRadius: 20, backgroundColor: colors.surfaceAlt },
  optionsTitle: { color: colors.textMuted, fontSize: 15, lineHeight: 22, fontWeight: '500' }, optionRows: { paddingVertical: 6 },
  option: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 56, paddingVertical: 14 }, optionDivider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  optionText: { flex: 1, color: colors.text, fontSize: 17, lineHeight: 25, fontWeight: '500' },
  readingStatus: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, backgroundColor: colors.primary50 },
  stopReading: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: 6, paddingVertical: 10, paddingHorizontal: 8 },
});
