import React from 'react';
import { View } from 'react-native';
import { useWizard } from '@/store/WizardContext';
import { HelpNote, ScaleRow, Section, Tagline } from '@/screens/wizard/ui';

export const WellbeingStep: React.FC = () => {
  const { state, update } = useWizard();
  const b = state.wellbeingBaseline;

  return (
    <View style={{ gap: 16 }}>
      <HelpNote
        what="Slide each bar to rate how you feel today, from 0 (worst) to 10 (best)."
        why="This is your starting point. Future check-ins compare against it, so you can see real improvement instead of guessing."
      />
      <Section>
        <Tagline title="Wellbeing baseline" body="Rate how you feel today (0–10). We compare future check-ins to this baseline to show real improvement." />
        <ScaleRow label="Energy" value={b.energy} onChange={(v) => update((d) => { d.wellbeingBaseline.energy = v; })} />
        <ScaleRow label="Mood" value={b.mood} onChange={(v) => update((d) => { d.wellbeingBaseline.mood = v; })} />
        <ScaleRow label="Sleep" value={b.sleep} onChange={(v) => update((d) => { d.wellbeingBaseline.sleep = v; })} />
        <ScaleRow label="Focus" value={b.focus} onChange={(v) => update((d) => { d.wellbeingBaseline.focus = v; })} />
      </Section>
    </View>
  );
};
