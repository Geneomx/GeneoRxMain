import React, { useMemo, useState } from 'react';
import { Linking, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
    const subj = encodeURIComponent(`${t('feedback.title')} (${type})`);
    const body = encodeURIComponent(
      `${t('feedback.type')}: ${type}\n${t('account.email')}: ${email}\n${t('feedback.contact')}: ${canContact ? t('common.yes') : t('common.no')}\n\n${t('feedback.message')}:\n${msg}\n`,
    );
    void Linking.openURL(`mailto:info@geneorx.com?subject=${subj}&body=${body}`).catch(() => undefined);
    setMessage('');
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleSkip}>
      <Pressable style={styles.backdrop} onPress={handleSkip}>
        <Pressable
          style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.handle} />
          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <Text style={styles.title}>{t('feedback.modal_title')}</Text>
            <Text style={styles.sub}>{t('feedback.modal_sub')}</Text>

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
              <Button title={t('nav.continue')} variant="secondary" onPress={handleSkip} />
            </View>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
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
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginBottom: spacing.md,
  },
  title: { fontSize: 18, fontWeight: '800', color: colors.text },
  sub: { fontSize: 14, color: colors.textMuted, lineHeight: 20, marginTop: 4, marginBottom: spacing.md },
  label: { fontSize: 13, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  actions: { gap: spacing.sm, marginTop: spacing.md, marginBottom: spacing.xs },
});
