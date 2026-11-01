import React, { useState } from 'react';
import { View } from 'react-native';
import { Input } from '@/components/Input';
import { RatingSlider } from '@/components/RatingSlider';
import { Button } from '@/components/Button';
import { EditorSheet, ListRow, refined } from '@/components/RefinedUI';
import { useToast } from '@/components/Toast';
import { useWizard } from '@/store/WizardContext';
import { useTranslation } from '@/hooks/useTranslation';
import type { BodySystemKey, Rating } from '@/wizard/types';
import { Accordion, FinePrint } from '@/screens/wizard/ui';
import type { AppIconName } from '@/components/AppIcon';

export const WellbeingStep: React.FC = () => {
  const { state, savePayload } = useWizard();
  const toast = useToast();
  const { t } = useTranslation();
  const b = state.wellbeingBaseline;
  const [editing, setEditing] = useState<BodySystemKey | 'notes' | null>(null);
  const [rating, setRating] = useState<Rating>(null);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const label = (key: BodySystemKey) => t(`wellbeing.${key}`).replace(/\s*\([^)]*\)\s*$/, '');
  const open = (key: BodySystemKey | 'notes') => {
    if (key === 'notes') setNotes(b.notes || '');
    else setRating(b[key] ?? null);
    setEditing(key);
  };
  const save = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      const outcome = await savePayload({ portal_state: { wellbeingBaseline: { ...b, [editing]: editing === 'notes' ? notes.trim() : rating } } });
      setEditing(null);
      toast.show(t('tracking.saved.' + outcome));
    } catch { toast.show(t('mobile.alert.try_again'), 'error'); }
    finally { setSaving(false); }
  };
  const icons: Partial<Record<BodySystemKey, AppIconName>> = { energy: 'sun', mood: 'heart', sleep: 'moon', focus: 'focus' };
  const row = (key: BodySystemKey) => <ListRow key={key} icon={icons[key]} title={label(key)} detail={b[key] == null ? t('light.not_recorded') : `${b[key]}/10`} onPress={() => open(key)} />;
  return <View style={{ gap: 16 }}>
    <FinePrint>{t('calm.starting_ratings')}</FinePrint>
    <View style={refined.listGroup}>{(['energy', 'mood', 'sleep', 'focus'] as const).map(row)}</View>
    <Accordion plain title={t('design.more_areas')}>
      {(['digestive', 'circulation', 'immunity'] as const).map(row)}
      <FinePrint>{t('checkin.systems_note')}</FinePrint>
    </Accordion>
    <ListRow title={t('design.baseline_note')} onPress={() => open('notes')} last />
    <EditorSheet visible={editing !== null} title={editing === 'notes' ? t('design.baseline_note') : editing ? label(editing) : ''} onClose={() => { if (!saving) setEditing(null); }} footer={<Button title={t('tracking.save_details')} loading={saving} onPress={() => { void save(); }} />}>
      {editing === 'notes' ? <Input label={t('design.baseline_note')} value={notes} onChangeText={setNotes} multiline maxLength={2000} /> : editing ? <>
        <RatingSlider label={label(editing)} value={rating} onChange={setRating} minLabel={t('design.low')} maxLabel={t('design.good')} />
        <Button compact variant="ghost" title={t('checkin.not_answered')} onPress={() => setRating(null)} />
      </> : null}
    </EditorSheet>
  </View>;
};
