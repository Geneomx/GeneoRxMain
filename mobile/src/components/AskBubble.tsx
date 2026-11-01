import React, { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/Button';
import { AssistantPanel } from '@/screens/AssistantScreen';
import { useTranslation } from '@/hooks/useTranslation';
import { colors } from '@/theme';

/** Optional inline entry: never floats over tracking controls. */
export const AskBubble: React.FC<{ inline?: boolean; onReviewSymptoms?: () => void; trigger?: (open: () => void) => React.ReactNode }> = ({ onReviewSymptoms, trigger }) => {
  const [open, setOpen] = useState(false);
  const [summaryMode, setSummaryMode] = useState(false);
  const { t } = useTranslation();
  return <>
    {trigger ? trigger(() => setOpen(true)) : <Button compact title={t('ai.general_title')} variant="ghost" onPress={() => setOpen(true)} />}
    <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
      <KeyboardAvoidingView style={styles.backdrop} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={StyleSheet.absoluteFill} accessibilityRole="button" accessibilityLabel={t('common.close')} onPress={() => setOpen(false)} />
        <SafeAreaView edges={['bottom']} style={styles.sheet} accessibilityViewIsModal>
          <View style={styles.handle} accessible={false} />
          <View style={styles.heading}><Text accessibilityRole="header" style={styles.title}>{t('ai.general_title')}</Text><Button compact title={t('common.close')} variant="ghost" onPress={() => setOpen(false)} /></View>
          <AssistantPanel onSummaryModeChange={setSummaryMode} />
          {onReviewSymptoms && !summaryMode ? <Button title={t('ai.review_symptoms')} variant="ghost" onPress={() => { setOpen(false); onReviewSymptoms(); }} /> : null}
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  </>;
};
const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(20,29,42,.35)' },
  sheet: { height: '88%', backgroundColor: colors.surface, borderTopLeftRadius: 26, borderTopRightRadius: 26, paddingHorizontal: 20, paddingTop: 10, paddingBottom: 12 },
  handle: { width: 32, height: 4, borderRadius: 2, backgroundColor: colors.borderStrong, alignSelf: 'center', marginBottom: 12 },
  heading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  title: { flex: 1, fontSize: 21, fontWeight: '500', color: colors.text },
});
