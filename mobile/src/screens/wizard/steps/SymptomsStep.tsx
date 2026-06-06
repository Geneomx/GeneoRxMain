import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Input } from '@/components/Input';
import { Chip } from '@/components/Chip';
import { useWizard } from '@/store/WizardContext';
import { getSymptomUniverse } from '@/wizard/engine';
import type { Severity } from '@/wizard/types';
import { FinePrint, HelpNote, Section, Segmented, Tagline } from '@/screens/wizard/ui';
import { colors, radius, spacing } from '@/theme';

const SEV_OPTS: { label: string; value: Severity }[] = [
  { label: 'Mild', value: 'mild' },
  { label: 'Moderate', value: 'moderate' },
  { label: 'Severe', value: 'severe' },
];

export const SymptomsStep: React.FC = () => {
  const { state, update } = useWizard();
  const [custom, setCustom] = useState('');
  const universe = getSymptomUniverse(state);
  const selected = new Set(state.symptoms.selected);

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
      <HelpNote
        what="Tap any symptoms you've noticed, add your own if it's missing, then set how much they affect your day."
        why="Symptoms help GeneoRx connect what you feel to possible nutrient gaps from your medicines."
      />
      <Section>
        <Tagline title="What are you experiencing?" body={state.meds.length ? 'Suggestions are tailored to your medications.' : 'Pick any symptoms that apply.'} />
        <View style={styles.chips}>
          {universe.map((sym) => (
            <Chip key={sym} label={sym} selected={selected.has(sym)} onPress={() => toggle(sym)} />
          ))}
        </View>

        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-end' }}>
          <View style={{ flex: 1 }}>
            <Input label="Add a custom symptom" placeholder="Type a symptom" value={custom} onChangeText={setCustom} />
          </View>
          <Pressable style={styles.addBtn} onPress={addCustom}>
            <Text style={styles.addBtnText}>Add</Text>
          </Pressable>
        </View>
        <FinePrint>{state.symptoms.selected.length} selected.</FinePrint>
      </Section>

      <Section>
        <Tagline title="Overall severity" body="Roughly how much do these symptoms affect your day?" />
        <Segmented value={state.symptoms.severity} onChange={(v) => update((d) => { d.symptoms.severity = v; })} options={SEV_OPTS} />
      </Section>
    </View>
  );
};

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  addBtn: { backgroundColor: colors.primary, borderRadius: radius.md, paddingHorizontal: spacing.md, height: 44, alignItems: 'center', justifyContent: 'center' },
  addBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
});
