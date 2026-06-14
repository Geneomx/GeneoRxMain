import React from 'react';
import { View } from 'react-native';
import { useWizard } from '@/store/WizardContext';
import { useTranslation } from '@/hooks/useTranslation';
import { HelpNote, ScaleRow, Section, Tagline } from '@/screens/wizard/ui';

export const WellbeingStep: React.FC = () => {
  const { state, update } = useWizard();
  const { t } = useTranslation();
  const b = state.wellbeingBaseline;

  return (
    <View style={{ gap: 16 }}>
      <HelpNote what={t('step.3.sub')} why={t('wellbeing.baseline_hint')} />
      <Section>
        <Tagline title={t('step.3')} body={t('wellbeing.baseline_hint')} />
        <ScaleRow label={t('wellbeing.energy')} value={b.energy} onChange={(v) => update((d) => { d.wellbeingBaseline.energy = v; })} />
        <ScaleRow label={t('wellbeing.mood')} value={b.mood} onChange={(v) => update((d) => { d.wellbeingBaseline.mood = v; })} />
        <ScaleRow label={t('wellbeing.sleep')} value={b.sleep} onChange={(v) => update((d) => { d.wellbeingBaseline.sleep = v; })} />
        <ScaleRow label={t('wellbeing.focus')} value={b.focus} onChange={(v) => update((d) => { d.wellbeingBaseline.focus = v; })} />
      </Section>
    </View>
  );
};
