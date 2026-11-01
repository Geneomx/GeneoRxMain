import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { Button } from '@/components/Button';
import { AssistantTrackingSummary } from '@/components/AssistantTrackingSummary';
import { AmbientBackground } from '@/components/AmbientBackground';
import { askAssistant, fetchAssistantOptions, type AssistantOptions, type AssistantMessage } from '@/api/assistant';
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
export const AssistantPanel: React.FC<{ onSummaryModeChange?: (open: boolean) => void }> = ({ onSummaryModeChange }) => {
  const { state } = useWizard();
  const { catalog } = useMedCatalog();
  const { t, language } = useTranslation();

  const [options, setOptions] = useState<AssistantOptions | null>(null);
  const [summaryOpen, setSummaryOpen] = useState(false);
  useEffect(() => { onSummaryModeChange?.(summaryOpen); }, [summaryOpen, onSummaryModeChange]);
  const [optionsFailed, setOptionsFailed] = useState(false);
  useEffect(() => { let active = true; void fetchAssistantOptions().then(value => { if (active) setOptions(value); }).catch(() => { if (active) setOptionsFailed(true); }); return () => { active = false; }; }, []);
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
    async (text: string, promptId?: string) => {
      const content = text.trim();
      if (!content || loading || !options || (options.mode !== 'personalized' && !promptId)) return;

      const next: AssistantMessage[] = [...messages, { role: 'user', content }];
      setMessages(next);
      setDraft('');
      setLoading(true);
      setUnavailable(false);
      requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));

      try {
        const res = await askAssistant(options.mode === 'catalog_only' ? [{ role: 'user', content: 'General guidance' }] : next, { context: options.mode === 'personalized' ? context : undefined, language, promptId });
        if ((res.source === 'ai' || res.source === 'restricted') && res.reply) {
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
    [messages, loading, context, language, options],
  );

  const empty = messages.length === 0;

  if (summaryOpen) return <AssistantTrackingSummary onBack={() => setSummaryOpen(false)} />;

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
          <Button title={t('ai.summary_open')} variant="secondary" disabled={loading} onPress={() => setSummaryOpen(true)} />
          <Text style={s.noticeText}>{t(options?.mode === 'personalized' ? 'ai.personal_mode' : 'ai.general_mode')}</Text>
          {!options ? <Text style={s.noticeText}>{t(optionsFailed ? 'ai.unavailable' : 'ai.loading')}</Text> : null}
          {empty && options?.mode === 'personalized' ? (
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

          {empty && options?.mode === 'catalog_only' ? <View style={s.suggestWrap}>{options.prompts.map(prompt => <Pressable key={prompt.id} accessibilityRole="button" disabled={loading} style={s.suggestChip} onPress={() => { void send(prompt.label, prompt.id); }}><Text style={s.suggestChipText}>{prompt.label}</Text></Pressable>)}</View> : null}
          {loading ? (
            <View style={[s.bubble, s.aiBubble]}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : null}

          {unavailable ? (
            <View style={s.noticeBox}>
              <Text style={s.noticeText}>{t('assistant.unavailable')}</Text>
            </View>
          ) : null}
        </ScrollView>

        {!empty && options?.mode === 'catalog_only' ? <Button compact title={t('ai.ask_another')} variant="ghost" disabled={loading} onPress={() => { setMessages([]); setUnavailable(false); }} /> : null}
        <Text style={s.disclaimer}>{t('assistant.disclaimer')}</Text>

        {options?.mode === 'personalized' ? <View style={s.inputRow}>
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
        </View> : null}
    </KeyboardAvoidingView>
  );
};

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.xs },
  title: { fontSize: 20, fontWeight: '500', color: colors.primary },
  sub: { fontSize: 16, color: colors.textMuted, marginTop: 2 },
  scroll: { padding: spacing.lg, gap: spacing.sm, flexGrow: 1 },

  suggestWrap: { gap: spacing.sm, marginTop: spacing.md },
  suggestHint: { fontSize: 16, color: colors.textMuted, marginBottom: 2 },
  suggestChip: {
    minHeight: 44,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 13,
    backgroundColor: colors.primary50,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  suggestChipText: { color: colors.text, fontSize: 17 },

  bubble: { maxWidth: '88%', borderRadius: radius.card, padding: spacing.md },
  userBubble: { alignSelf: 'flex-end', backgroundColor: colors.primary50 },
  aiBubble: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primary50,
    borderWidth: 1,
    borderColor: colors.primary,
    gap: 4,
  },
  aiTag: { fontSize: 14, fontWeight: '500', color: colors.primary, letterSpacing: 0.3 },
  userText: { color: colors.text, fontSize: 17, lineHeight: 25 },
  aiText: { color: colors.text, fontSize: 17, lineHeight: 25 },

  noticeBox: {
    borderRadius: radius.card,
    backgroundColor: colors.warningBg,
    padding: spacing.md,
  },
  noticeText: { color: colors.text, fontSize: 17, lineHeight: 24 },

  disclaimer: {
    fontSize: 14,
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
    fontSize: 17,
  },
  sendBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.card,
    paddingHorizontal: 18,
    height: 44,
    justifyContent: 'center',
  },
  sendBtnOff: { opacity: 0.5 },
  sendBtnText: { color: '#fff', fontWeight: '500', fontSize: 17 },
});
