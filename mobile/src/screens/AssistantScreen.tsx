import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AmbientBackground } from '@/components/AmbientBackground';
import { askAssistant, type AssistantMessage } from '@/api/assistant';
import { useWizard } from '@/store/WizardContext';
import { useMedCatalog } from '@/store/MedCatalogContext';
import { MED_DB } from '@/content/wizardData';
import { useTranslation } from '@/hooks/useTranslation';
import { colors, radius, spacing } from '@/theme';

/**
 * The Ask GeneoRx chat, with no screen chrome, so it can be hosted anywhere.
 *
 * Extracted when Ask moved from a bottom tab to a floating bubble: the sheet
 * needs the conversation without a SafeAreaView, ambient background or page
 * header wrapped around it. All state lives here, so each host gets its own
 * independent thread.
 */
export const AssistantPanel: React.FC = () => {
  const { state } = useWizard();
  const { catalog } = useMedCatalog();
  const { t, language } = useTranslation();

  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  // Guest grounding (ignored server-side for signed-in users, who are grounded
  // from their own records).
  const context = useMemo(() => {
    const db = catalog?.length ? catalog : MED_DB;
    return {
      medications: state.meds.map((m) => db.find((x) => x.id === m.medId)?.name ?? m.medId),
      symptoms: state.symptoms.selected ?? [],
    };
  }, [state.meds, state.symptoms.selected, catalog]);

  const suggestions = useMemo(
    () => [
      t('assistant.prompt_why_score'),
      t('assistant.prompt_interactions'),
      t('assistant.prompt_what_changed'),
    ],
    [t],
  );

  const send = useCallback(
    async (text: string) => {
      const content = text.trim();
      if (!content || loading) return;

      const next: AssistantMessage[] = [...messages, { role: 'user', content }];
      setMessages(next);
      setDraft('');
      setLoading(true);
      setUnavailable(false);
      requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));

      try {
        const res = await askAssistant(next, { context, language });
        if (res.source === 'ai' && res.reply) {
          setMessages((m) => [...m, { role: 'assistant', content: res.reply as string }]);
        } else {
          setUnavailable(true);
        }
      } catch {
        setUnavailable(true);
      } finally {
        setLoading(false);
        requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
      }
    },
    [messages, loading, context, language],
  );

  const empty = messages.length === 0;

  return (
    <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
        >
          {empty ? (
            <View style={s.suggestWrap}>
              <Text style={s.suggestHint}>{t('assistant.try_asking')}</Text>
              {suggestions.map((sug) => (
                <Pressable key={sug} style={s.suggestChip} onPress={() => send(sug)}>
                  <Text style={s.suggestChipText}>{sug}</Text>
                </Pressable>
              ))}
            </View>
          ) : (
            messages.map((m, i) => (
              <View key={i} style={[s.bubble, m.role === 'user' ? s.userBubble : s.aiBubble]}>
                {m.role === 'assistant' ? <Text style={s.aiTag}>✦ {t('assistant.ai_tag')}</Text> : null}
                <Text style={m.role === 'user' ? s.userText : s.aiText}>{m.content}</Text>
              </View>
            ))
          )}

          {loading ? (
            <View style={[s.bubble, s.aiBubble]}>
              <ActivityIndicator color={colors.violet} />
            </View>
          ) : null}

          {unavailable ? (
            <View style={s.noticeBox}>
              <Text style={s.noticeText}>{t('assistant.unavailable')}</Text>
            </View>
          ) : null}
        </ScrollView>

        <Text style={s.disclaimer}>{t('assistant.disclaimer')}</Text>

        <View style={s.inputRow}>
          <TextInput
            style={s.input}
            value={draft}
            onChangeText={setDraft}
            placeholder={t('assistant.placeholder')}
            placeholderTextColor={colors.textDim}
            multiline
            editable={!loading}
            onSubmitEditing={() => send(draft)}
          />
          <Pressable
            style={[s.sendBtn, (!draft.trim() || loading) && s.sendBtnOff]}
            onPress={() => send(draft)}
            disabled={!draft.trim() || loading}
          >
            <Text style={s.sendBtnText}>{t('assistant.send')}</Text>
          </Pressable>
        </View>
    </KeyboardAvoidingView>
  );
};

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.xs },
  title: { fontSize: 20, fontWeight: '800', color: colors.violet },
  sub: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  scroll: { padding: spacing.lg, gap: spacing.sm, flexGrow: 1 },

  suggestWrap: { gap: spacing.sm, marginTop: spacing.md },
  suggestHint: { fontSize: 13, color: colors.textMuted, marginBottom: 2 },
  suggestChip: {
    borderWidth: 1,
    borderColor: colors.violet,
    borderRadius: radius.pill ?? 999,
    backgroundColor: 'rgba(167,139,250,0.08)',
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  suggestChipText: { color: colors.text, fontSize: 14 },

  bubble: { maxWidth: '88%', borderRadius: radius.card, padding: spacing.md },
  userBubble: { alignSelf: 'flex-end', backgroundColor: colors.primary50 },
  aiBubble: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(167,139,250,0.10)',
    borderWidth: 1,
    borderColor: colors.violet,
    gap: 4,
  },
  aiTag: { fontSize: 11, fontWeight: '800', color: colors.violet, letterSpacing: 0.3 },
  userText: { color: colors.text, fontSize: 15, lineHeight: 21 },
  aiText: { color: colors.text, fontSize: 15, lineHeight: 21 },

  noticeBox: {
    borderRadius: radius.card,
    backgroundColor: colors.warningBg,
    padding: spacing.md,
  },
  noticeText: { color: colors.text, fontSize: 14, lineHeight: 20 },

  disclaimer: {
    fontSize: 11,
    color: colors.textDim,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: 4,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    paddingTop: 4,
  },
  input: {
    flex: 1,
    maxHeight: 120,
    minHeight: 44,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    backgroundColor: colors.inputBg,
    color: colors.text,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 12,
    fontSize: 15,
  },
  sendBtn: {
    backgroundColor: colors.violet,
    borderRadius: radius.card,
    paddingHorizontal: 18,
    height: 44,
    justifyContent: 'center',
  },
  sendBtnOff: { opacity: 0.5 },
  sendBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
