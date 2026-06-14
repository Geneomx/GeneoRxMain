import React, { useMemo, useState } from 'react';
import { Alert, Linking, Text, View } from 'react-native';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { useWizard } from '@/store/WizardContext';
import { useTranslation } from '@/hooks/useTranslation';
import { useDashboardNavigation } from '@/navigation/useDashboardNavigation';
import { FinePrint, HelpNote, OptionGrid, Section, Tagline, ToggleRow } from '@/screens/wizard/ui';
import { colors, spacing } from '@/theme';

export const FeedbackStep: React.FC = () => {
  const { state, update } = useWizard();
  const { t } = useTranslation();
  const goToDashboard = useDashboardNavigation();
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

  const finish = () => {
    setMessage('');
    goToDashboard();
  };

  const send = () => {
    const msg = message.trim();
    if (!msg) {
      finish();
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
    finish();
  };

  return (
    <View style={{ gap: spacing.md }}>
      <HelpNote what={t('step.9.sub')} why={t('feedback.sub')} />
      <Section>
        <Tagline title={t('feedback.modal_title')} body={t('feedback.modal_sub')} />

        <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>{t('feedback.type')}</Text>
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

        <View style={{ gap: spacing.sm }}>
          <Button title={t('feedback.send_short')} onPress={send} />
          <Button title={t('nav.dashboard')} variant="secondary" onPress={finish} />
        </View>
        <FinePrint>{t('step.9.sub')}</FinePrint>
      </Section>
    </View>
  );
};
