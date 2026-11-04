import React, { useState } from 'react';
import { Keyboard, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { AppText as Text } from './AppText';
import { AppIcon } from './AppIcon';
import { Button } from './Button';
import { ReviewChoice } from './ReviewChoice';
import { Input } from './Input';
import { EditorSheet, refined } from './RefinedUI';
import { useTranslation } from '@/hooks/useTranslation';
import { confirmEntrySuggestions, prepareEntrySuggestions, type ConfirmedEntryDraft, type EntrySuggestions } from '@/wizard/checkinAssistance';
import { impactLabel } from '@/wizard/recordFormatting';
import { colors } from '@/theme';

export type EntryDraft = ConfirmedEntryDraft;
export const EntryDraftSheet: React.FC<{ visible: boolean; onClose: () => void; vocabulary: string[]; mode: 'symptoms' | 'checkin'; onApply: (draft: EntryDraft) => void }> = ({ visible, onClose, vocabulary, mode, onApply }) => {
  const { t } = useTranslation();
  const { fontScale } = useWindowDimensions();
  const largeText = fontScale > 1.3;
  const [text, setText] = useState('');
  const [draft, setDraft] = useState<EntrySuggestions | null>(null);
  const [custom, setCustom] = useState('');
  const [customOpen, setCustomOpen] = useState(false);
  const [wordsOpen, setWordsOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [includeNotes, setIncludeNotes] = useState(true);
  const close = () => { Keyboard.dismiss(); setText(''); setDraft(null); setCustom(''); setCustomOpen(false); setWordsOpen(false); setSelected([]); setIncludeNotes(true); onClose(); };
  const create = () => { Keyboard.dismiss(); setDraft(prepareEntrySuggestions(text, vocabulary)); setSelected([]); setWordsOpen(false); };
  const toggle = (key: string) => setSelected(values => values.includes(key) ? values.filter(value => value !== key) : [...values, key]);
  const apply = () => {
    if (!draft) return;
    const confirmed = confirmEntrySuggestions(draft, selected, mode === 'checkin' && includeNotes);
    const customName = custom.trim();
    if (customName) confirmed.names = [...new Set([...confirmed.names, vocabulary.find(name => name.toLowerCase() === customName.toLowerCase()) || customName])];
    onApply(confirmed);
    close();
  };
  const hasSelection = selected.length > 0 || !!custom.trim() || (includeNotes && mode === 'checkin');
  const count = selected.length;
  const hasSuggestions = draft && (draft.symptoms.length > 0 || (mode === 'checkin' && draft.wellbeing.length > 0));
  return <EditorSheet contentKey={draft ? 'review' : 'write'} visible={visible} title={t(draft ? 'assist.review_title' : mode === 'symptoms' ? 'easy.describe_symptom' : 'assist.checkin_title')} onClose={close} footer={<>
    {draft && mode === 'checkin' ? <Text style={s.footerHint}>{t('ease.save_later')}</Text> : null}
    <Button title={t(draft ? 'assist.use_confirmed' : 'assist.review_answers')} disabled={!text.trim() || (!!draft && !hasSelection)} onPress={draft ? apply : create} />
  </>}>
    {!draft ? <>
      <Input label={t('easy.your_words')} placeholder={t('assist.example')} value={text} onChangeText={setText} multiline maxLength={2000} style={{ minHeight: 150, textAlignVertical: 'top' }} />
      <Text style={refined.meta}>{t('easy.dictation_hint')}</Text>
      <Text style={s.privacy}>{t('ease.on_device')}</Text>
    </> : <>
      <View style={s.reviewHeading}><Text style={[refined.meta, { flex: 1 }]}>{t('ease.choose_correct')}</Text>{count ? <Text style={s.count} accessibilityLiveRegion="polite">{t('ease.selected_count', { count })}</Text> : null}</View>
      {!hasSuggestions ? <Text style={refined.body}>{t('assist.no_matches')}</Text> : <View style={s.group}>
        {draft.symptoms.map(item => <ReviewChoice grouped key={item.name} label={item.name} checked={selected.includes(`symptom:${item.name}`)} onChange={() => toggle(`symptom:${item.name}`)} detail={[item.change ? impactLabel(item.change, t) : t('assist.change_unanswered'), item.severity !== undefined ? t('assist.severity_value', { value: item.severity }) : ''].filter(Boolean).join(' · ')} />)}
        {mode === 'checkin' ? draft.wellbeing.map(item => <ReviewChoice grouped key={item.key} label={`${t('wellbeing.' + item.key).replace(/\s*\([^)]*\)\s*$/, '')}: ${item.value}/10`} checked={selected.includes(`wellbeing:${item.key}`)} onChange={() => toggle(`wellbeing:${item.key}`)} />) : null}
      </View>}
      {mode === 'checkin' ? <ReviewChoice label={t('assist.keep_note')} checked={includeNotes} onChange={() => setIncludeNotes(value => !value)} /> : null}
      <View style={s.words}>
        <View style={[s.reviewHeading, largeText && { flexDirection: 'column', alignItems: 'stretch' }]}><Pressable accessibilityRole="button" accessibilityState={{ expanded: wordsOpen }} onPress={() => setWordsOpen(value => !value)} style={[s.wordAction, { flex: largeText ? 0 : 1 }]}><AppIcon name="file" size={19} /><Text style={[refined.linkText, { flex: 1 }]}>{t('ease.original_words')}</Text><AppIcon name={wordsOpen ? 'down' : 'chevron'} size={17} /></Pressable><Button title={t('assist.edit_words')} compact variant="ghost" onPress={() => setDraft(null)} /></View>
        {wordsOpen ? <Text style={refined.body}>{draft.notes}</Text> : null}
      </View>
      {customOpen ? <Input label={t('easy.other_symptom')} value={custom} onChangeText={setCustom} maxLength={100} autoFocus /> : <Button title={t('ease.add_other')} compact variant="ghost" onPress={() => setCustomOpen(true)} />}
    </>}
  </EditorSheet>;
};
const s = StyleSheet.create({
  group: { borderRadius: 20, borderWidth: 1, borderColor: colors.border, overflow: 'hidden', backgroundColor: colors.surface },
  reviewHeading: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 10 },
  count: { fontSize: 15, lineHeight: 23, color: colors.primary, fontWeight: '500' },
  words: { gap: 8 }, wordAction: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 10 },
  footerHint: { fontSize: 15, lineHeight: 22, color: colors.textMuted, textAlign: 'center' },
  privacy: { fontSize: 15, lineHeight: 22, color: colors.textMuted },
});
