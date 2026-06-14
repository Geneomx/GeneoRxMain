import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Chip } from '@/components/Chip';
import { useWizard } from '@/store/WizardContext';
import { getSymptomUniverse } from '@/wizard/engine';
import { useTranslation } from '@/hooks/useTranslation';
import type { Severity } from '@/wizard/types';
import { FinePrint, HelpNote, Section, Segmented, Tagline } from '@/screens/wizard/ui';
import { spacing } from '@/theme';

export const SymptomsStep: React.FC = () => {
  const { state, update } = useWizard();
  const { t } = useTranslation();
  const [custom, setCustom] = useState('');
  const universe = getSymptomUniverse(state);
  const selected = new Set(state.symptoms.selected);

  const sevOpts = useMemo(
    () => [
      { label: t('symptoms.severity.mild'), value: 'mild' as Severity },
      { label: t('symptoms.severity.moderate'), value: 'moderate' as Severity },
      { label: t('symptoms.severity.severe'), value: 'severe' as Severity },
    ],
    [t],
  );

  const toggle = (sym: string) =>
    update((d) => {
      const set = new Set(d.symptoms.selected);
      if (set.has(sym)) set.delete(sym);
      else set.add(sym);
      d.symptoms.selected = [...set];
    });

  const addCustom = () => {
    const v = custom.trim();
    if (!v) return;
    update((d) => {
      if (!d.symptoms.custom.includes(v)) d.symptoms.custom.push(v);
      if (!d.symptoms.selected.includes(v)) d.symptoms.selected.push(v);
    });
    setCustom('');
  };

  return (
    <View style={{ gap: spacing.md }}>
      <HelpNote what={t('step.2.sub')} why={t('symptoms.select_hint')} />
      <Section>
        <Tagline title={t('symptoms.select')} body={t('symptoms.select_hint')} />
        <View style={styles.chips}>
          {universe.map((sym) => (
            <Chip key={sym} label={sym} selected={selected.has(sym)} onPress={() => toggle(sym)} />
          ))}
        </View>

        <Input
          label={t('symptoms.add_custom')}
          placeholder={t('symptoms.custom_placeholder')}
          value={custom}
          onChangeText={setCustom}
          onSubmitEditing={addCustom}
          returnKeyType="done"
        />
        <Button title={t('symptoms.add_btn')} onPress={addCustom} />
        <FinePrint>
          {state.symptoms.selected.length} {t('symptoms.custom_saved_hint')}
        </FinePrint>
      </Section>

      <Section>
        <Tagline title={t('symptoms.severity')} body={t('step.2.sub')} />
        <Segmented value={state.symptoms.severity} onChange={(v) => update((d) => { d.symptoms.severity = v; })} options={sevOpts} />
      </Section>
    </View>
  );
};

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
});
