import React, { useState } from 'react';
import { Alert, Linking, Text, View } from 'react-native';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { useWizard } from '@/store/WizardContext';
import { FinePrint, HelpNote, Section, Segmented, Tagline, ToggleRow } from '@/screens/wizard/ui';
import { colors } from '@/theme';

const TYPES = [
  { label: 'Bug', value: 'Bug' },
  { label: 'Suggestion', value: 'Suggestion' },
  { label: 'Question', value: 'Question' },
  { label: 'Other', value: 'Other' },
];

export const FeedbackStep: React.FC = () => {
  const { state, update } = useWizard();
  const [type, setType] = useState('Suggestion');
  const [canContact, setCanContact] = useState(true);
  const [message, setMessage] = useState('');

  const send = () => {
    const msg = message.trim();
    if (!msg) {
      Alert.alert('Add a message', 'Please write your feedback before sending.');
      return;
    }
    const email = state.account.email || 'anonymous';
    update((d) => {
      d.feedback.push({ dateISO: new Date().toISOString(), type, message: msg, canContact, email });
    });
    const subj = encodeURIComponent(`GeneoRx Portal Feedback (${type})`);
    const body = encodeURIComponent(`Type: ${type}\nFrom: ${email}\nCan we contact you?: ${canContact ? 'Yes' : 'No'}\n\nMessage:\n${msg}\n`);
    Linking.openURL(`mailto:info@geneorx.com?subject=${subj}&body=${body}`).catch(() =>
      Alert.alert('Saved', 'Your feedback was saved. Email could not be opened on this device.'),
    );
    setMessage('');
  };

  return (
    <View style={{ gap: 16 }}>
      <HelpNote
        what="Pick a type, write your message, and tap Send. It opens your email app with the message pre-filled to the GeneoRx team."
        why="Your notes directly shape what we fix and build next."
      />
      <Section>
      <Tagline title="Your feedback is valuable" body="Send questions or improvement ideas to the GeneoRx team." />

      <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>Feedback type</Text>
      <Segmented value={type} onChange={setType} options={TYPES} />

      <ToggleRow label="GeneoRx can contact me about this feedback" value={canContact} onChange={setCanContact} />

      <Input label="Message" placeholder="Tell us what you liked, what was confusing, and what you want next…" value={message} onChangeText={setMessage} multiline style={{ minHeight: 110, textAlignVertical: 'top' }} />

      <Button title="Send to info@geneorx.com" onPress={send} />
      <FinePrint>Opens your email app with a pre-filled message. A copy is saved on this device.</FinePrint>
      </Section>
    </View>
  );
};
