import React, { useRef, useState } from 'react';
import { Image, Keyboard, View } from 'react-native';
import { AppText as Text } from './AppText';
import * as ImagePicker from 'expo-image-picker';
import { Button } from './Button';
import { EditorSheet, refined } from './RefinedUI';
import { Input } from './Input';
import { DropdownSelect } from './DropdownSelect';
import { ReviewChoice } from './ReviewChoice';
import { useTranslation } from '@/hooks/useTranslation';
import { ApiError, apiRequest } from '@/api/client';
import { medicationLabelDraft } from '@/wizard/entryAssistance';
import type { MedEntry } from '@/content/wizardData';

export const MedicationLabelSheet: React.FC<{ visible: boolean; onClose: () => void; catalog: MedEntry[]; onApply: (draft: { medId: string; strength: string; frequency: string }) => void }> = ({ visible, onClose, catalog, onApply }) => {
  const { t } = useTranslation();
  const [photo, setPhoto] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [reviewing, setReviewing] = useState(false);
  const [medId, setMedId] = useState('');
  const [strength, setStrength] = useState('');
  const [frequency, setFrequency] = useState('');
  const [confirmed, setConfirmed] = useState<string[]>([]);
  const request = useRef<AbortController | null>(null);
  const close = () => { request.current?.abort(); setPhoto(null); setText(''); setError(''); setBusy(false); setReviewing(false); setConfirmed([]); onClose(); };
  const pick = async (camera: boolean) => {
    setError('');
    try {
      if (camera && !(await ImagePicker.requestCameraPermissionsAsync()).granted) { setError(t('easy.camera_permission')); return; }
      const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], base64: true, quality: 0.6, allowsEditing: false, exif: false };
      const result = camera ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
      if (!result.canceled) { setPhoto(result.assets[0]); setText(''); }
    } catch { setError(t('easy.photo_error')); }
  };
  /** Server replies carry a plain-language message on 422; other failures get a fixed explanation. */
  const readErrorMessage = (error: unknown): string => {
    if (error instanceof ApiError) {
      if (error.status === 422) {
        const body = error.body as { message?: unknown } | null;
        const message = body && typeof body === 'object' && typeof body.message === 'string' ? body.message.trim() : '';
        return message || t('easy.read_error');
      }
      if (error.status === 429) return t('easy.read_rate_limited');
      if (error.status === 503) return t('easy.read_unavailable');
      return t('easy.read_error');
    }
    // apiRequest throws a plain Error (not ApiError) only for connection and timeout failures.
    return t('easy.read_offline');
  };
  const read = async () => {
    if (!photo?.base64) { setError(t('easy.photo_error')); return; }
    if (photo.base64.length > 5600000) { setError(t('easy.photo_size')); return; }
    const controller = new AbortController(); request.current = controller; setBusy(true); setError('');
    try {
      const result = await apiRequest<{ text: string }>('/mobile/medication-label', { method: 'POST', body: { consent: true, image: photo.base64 }, timeoutMs: 60000, signal: controller.signal });
      if (!controller.signal.aborted) setText(result.text);
    } catch (error) { if (!controller.signal.aborted) setError(readErrorMessage(error)); }
    finally { if (!controller.signal.aborted) setBusy(false); }
  };
  const draft = medicationLabelDraft(text, catalog);
  const review = () => { Keyboard.dismiss(); setMedId(draft.matches.length === 1 ? draft.matches[0].id : ''); setStrength(draft.strength); setFrequency(draft.frequency); setConfirmed([]); setReviewing(true); };
  const toggle = (key: string) => setConfirmed(values => values.includes(key) ? values.filter(value => value !== key) : [...values, key]);
  const apply = () => { if (!medId || !confirmed.includes('medicine')) return; onApply({ medId, strength: confirmed.includes('strength') ? strength.trim() : '', frequency: confirmed.includes('frequency') ? frequency.trim() : '' }); close(); };
  return <EditorSheet contentKey={reviewing ? "review" : "label"} visible={visible} title={t(reviewing ? 'assist.label_review_title' : 'easy.scan_label')} onClose={close} footer={reviewing ? <Button title={t('assist.use_confirmed')} disabled={!medId || !confirmed.includes('medicine')} onPress={apply} /> : text.trim() ? <Button title={t('easy.review_medication')} disabled={busy} onPress={review} /> : photo ? <Button title={t('easy.read_photo')} loading={busy} onPress={() => { void read(); }} /> : undefined}>
    {reviewing ? <>
      <Text style={refined.meta}>{t('assist.label_review_help')}</Text>
      <View style={{ gap: 10 }}>
        <DropdownSelect label={t('meds.list')} value={medId} options={catalog.map(med => ({ value: med.id, label: med.name }))} onChange={value => { setMedId(value); setStrength(''); setFrequency(''); setConfirmed([]); }} />
        {draft.uncertain.medicine ? <Text style={refined.meta}>{t('assist.label_medicine_uncertain')}</Text> : null}
        <ReviewChoice label={t('assist.correct_medicine')} disabled={!medId} checked={confirmed.includes('medicine')} onChange={() => toggle('medicine')} />
        <Input label={t('tracking.strength')} value={strength} onChangeText={value => { setStrength(value); setConfirmed(values => values.filter(key => key !== 'strength')); }} maxLength={100} />
        {draft.uncertain.strength ? <Text style={refined.meta}>{t('assist.label_strength_uncertain')}</Text> : null}
        <ReviewChoice label={t('assist.include_strength')} disabled={!strength.trim()} checked={confirmed.includes('strength')} onChange={() => toggle('strength')} />
        <Input label={t('tracking.frequency')} value={frequency} onChangeText={value => { setFrequency(value); setConfirmed(values => values.filter(key => key !== 'frequency')); }} maxLength={100} multiline />
        {draft.uncertain.frequency ? <Text style={refined.meta}>{t('assist.label_directions_uncertain')}</Text> : null}
        <ReviewChoice label={t('assist.include_directions')} disabled={!frequency.trim()} checked={confirmed.includes('frequency')} onChange={() => toggle('frequency')} />
      </View>
      <Button title={t('assist.review_label_text')} variant="ghost" onPress={() => setReviewing(false)} />
    </> : <>
    <Text style={refined.body}>{t('easy.label_privacy')}</Text>
    <Button variant="secondary" title={t('easy.take_photo')} disabled={busy} onPress={() => { void pick(true); }} />
    <Button compact variant="ghost" title={t('easy.choose_photo')} disabled={busy} onPress={() => { void pick(false); }} />
    {photo ? <Image source={{ uri: photo.uri }} style={{ width: '100%', height: 160, borderRadius: 12 }} resizeMode="contain" accessibilityLabel={t('easy.label_photo')} /> : null}
    {error ? <Text accessibilityRole="alert" style={refined.body}>{error}</Text> : null}
    <Input label={t('easy.label_text')} value={text} onChangeText={setText} multiline maxLength={10000} editable={!busy} style={{ minHeight: 100, textAlignVertical: 'top' }} />
    <Text style={refined.meta}>{t(draft.matches.length > 1 ? 'easy.multiple_meds' : 'easy.check_label')}</Text>
    </>}
    <Button title={t('assist.enter_manually')} variant="ghost" disabled={busy} onPress={() => { onApply({ medId: '', strength: '', frequency: '' }); close(); }} />
  </EditorSheet>;
};
