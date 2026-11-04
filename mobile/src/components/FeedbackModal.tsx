import React, { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { AppText as Text } from '@/components/AppText';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { sendFeedback, toFeedbackType } from '@/api/feedback';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { useWizard } from '@/store/WizardContext';
import { useTranslation } from '@/hooks/useTranslation';
import { OptionGrid, ToggleRow } from '@/screens/wizard/ui';
import { colors, radius, spacing } from '@/theme';

type Props = {
  visible: boolean;
  onClose: () => void;
};

export const FeedbackModal: React.FC<Props> = ({ visible, onClose }) => {
  const { state, update } = useWizard();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [type, setType] = useState('Suggestion');
  const [canContact, setCanContact] = useState(true);
  const [message, setMessage] = useState('');

  const types = useMemo(
    () => [
      { label: t('feedback.type.bug.short'), value: 'Bug' },
      { label: t('feedback.type.suggestion.short'), value: 'Suggestion' },
      { label: t('feedback.type.question.short'), value: 'Question' },
      { label: t('feedback.type.other.short'), value: 'Other' },
    ],
    [t],
  );

  function handleSkip() {
    setMessage('');
    onClose();
  }

  function handleSend() {
    const msg = message.trim();
    if (!msg) {
      handleSkip();
      return;
    }
    const email = state.account.email || t('common.anonymous');
    update((d) => {
      d.feedback.push({ dateISO: new Date().toISOString(), type, message: msg, canContact, email });
    });

    // Reaches the admin feedback inbox. Fire-and-forget so a network failure
    // never blocks the check-in flow this modal appears in; the local copy
    // above is still kept either way.
    void sendFeedback({
      type: toFeedbackType(type),
      message: msg,
      canContact,
      contactEmail: state.account.email || null,
    }).catch(() => undefined);

    setMessage('');
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleSkip}>
      {/* 'padding' on both platforms: Android no longer resizes the window for
          the keyboard under edge-to-edge, and RN recomputes the offset on layout
          changes, so it stays correct where the window still resizes. */}
      <KeyboardAvoidingView style={styles.backdrop} behavior="padding">
        <Pressable style={StyleSheet.absoluteFill} accessibilityRole="button" accessibilityLabel={t('common.close')} onPress={handleSkip} />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
          <View style={styles.handle} />
          <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <Text style={styles.title}>{t('feedback.modal_title')}</Text>
            <Text style={styles.sub}>{t('feedback.sub')}</Text>

            <Text style={styles.label}>{t('feedback.type')}</Text>
            <OptionGrid value={type} onChange={setType} options={types} />

            <ToggleRow label={t('feedback.contact')} value={canContact} onChange={setCanContact} />

            <Input
              label={t('feedback.message')}
              placeholder={t('feedback.message_placeholder')}
              value={message}
              onChangeText={setMessage}
              multiline
              style={{ minHeight: 110, textAlignVertical: 'top' }}
            />

            <View style={styles.actions}>
              <Button title={t('feedback.send_short')} onPress={handleSend} />
              <Button title={t('common.close')} variant="secondary" onPress={handleSkip} />
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.backgroundAlt,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    maxHeight: '88%',
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderBottomWidth: 0,
  },
  // Lets the sheet shrink to the space above the keyboard; the body then scrolls to the buttons.
  scroll: { flexGrow: 0, flexShrink: 1 },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginBottom: spacing.md,
  },
  title: { fontSize: 18, fontWeight: '500', color: colors.text },
  sub: { fontSize: 17, color: colors.textMuted, lineHeight: 24, marginTop: 4, marginBottom: spacing.md },
  label: { fontSize: 16, fontWeight: '500', color: colors.text, marginBottom: spacing.sm },
  actions: { gap: spacing.sm, marginTop: spacing.md, marginBottom: spacing.xs },
});
