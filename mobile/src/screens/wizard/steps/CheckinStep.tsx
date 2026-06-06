import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
import { Input } from '@/components/Input';
import { useWizard } from '@/store/WizardContext';
import { fmtDate } from '@/wizard/engine';
import type { CheckinSymptomItem, SymptomChange, Wellbeing } from '@/wizard/types';
import { Divider, FinePrint, HelpNote, ScaleRow, Section, Tagline } from '@/screens/wizard/ui';
import { colors, radius, spacing } from '@/theme';

const CHANGE_OPTS: { label: string; value: SymptomChange; score: number }[] = [
  { label: 'Worse', value: 'Worse', score: -2 },
  { label: 'No change', value: 'No change', score: 0 },
  { label: 'Slightly better', value: 'Slightly better', score: 1 },
  { label: 'Much better', value: 'Much better', score: 2 },
  { label: 'Not present', value: 'Not present', score: 0 },
];
const ADHERENCE_STEPS = [40, 50, 60, 70, 80, 90, 100];

export const CheckinStep: React.FC = () => {
  const { state, update } = useWizard();
  const [adherence, setAdherence] = useState(80);
  const [taken, setTaken] = useState<Set<string>>(new Set(state.plan.recommendedSupplements));
  const [changes, setChanges] = useState<Record<string, SymptomChange>>({});
  const [wb, setWb] = useState<Wellbeing>(state.wellbeingBaseline);
  const [sideEffects, setSideEffects] = useState('');
  const [notes, setNotes] = useState('');

  const toggleTaken = (s: string) =>
    setTaken((prev) => {
      const n = new Set(prev);
      if (n.has(s)) n.delete(s);
      else n.add(s);
      return n;
    });

  const save = () => {
    const items: CheckinSymptomItem[] = state.symptoms.selected.map((symptom) => {
      const change = changes[symptom] ?? 'No change';
      const score = CHANGE_OPTS.find((o) => o.value === change)?.score ?? 0;
      return { symptom, change, changeScore: score };
    });
    update((d) => {
      d.checkins.push({
        dateISO: new Date().toISOString(),
        adherencePct: adherence,
        supplementsTaken: [...taken],
        symptoms: { items },
        wellbeing: wb,
        sideEffects,
        notes,
      });
    });
    Alert.alert('Saved', 'Your check-in was saved.');
    setSideEffects('');
    setNotes('');
    setChanges({});
  };

  const deleteLast = () => {
    if (!state.checkins.length) return;
    Alert.alert('Delete last check-in?', 'This removes your most recent check-in.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => update((d) => { d.checkins.pop(); }) },
    ]);
  };

  return (
    <View style={{ gap: spacing.md }}>
      <HelpNote
        what="Each week, set how often you took things, mark which supplements you took, rate each symptom and your wellbeing, then tap Save check-in."
        why="Regular check-ins are what turn single ratings into a trend GeneoRx can read over time."
      />
      <Section>
        <Tagline title="Weekly check-in" body="Log how you're doing so GeneoRx can show real progress over time." />

        <Text style={styles.label}>Adherence this week: {adherence}%</Text>
        <FinePrint>Adherence = roughly what share of your doses you actually took this week.</FinePrint>
        <View style={styles.chips}>
          {ADHERENCE_STEPS.map((a) => (
            <Chip key={a} label={`${a}%`} selected={adherence === a} onPress={() => setAdherence(a)} />
          ))}
        </View>

        {state.plan.recommendedSupplements.length ? (
          <>
            <Text style={styles.label}>Supplements taken</Text>
            <View style={styles.chips}>
              {state.plan.recommendedSupplements.map((s) => (
                <Chip key={s} label={s} selected={taken.has(s)} onPress={() => toggleTaken(s)} />
              ))}
            </View>
          </>
        ) : (
          <FinePrint>Start a plan in Results to track supplements here.</FinePrint>
        )}
      </Section>

      {state.symptoms.selected.length ? (
        <Section>
          <Tagline title="Symptom improvement" body="How is each symptom compared to your baseline?" />
          {state.symptoms.selected.map((sym) => (
            <View key={sym} style={styles.symRow}>
              <Text style={styles.symName}>{sym}</Text>
              <View style={styles.changeWrap}>
                {CHANGE_OPTS.map((o) => {
                  const active = (changes[sym] ?? 'No change') === o.value;
                  return (
                    <Pressable key={o.value} onPress={() => setChanges((p) => ({ ...p, [sym]: o.value }))} style={[styles.changeChip, active && styles.changeChipActive]}>
                      <Text style={[styles.changeText, active && styles.changeTextActive]}>{o.label}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ))}
        </Section>
      ) : null}

      <Section>
        <Tagline title="Wellbeing now" body="Rate today's wellbeing (0–10)." />
        <ScaleRow label="Energy" value={wb.energy} onChange={(v) => setWb((p) => ({ ...p, energy: v }))} />
        <ScaleRow label="Mood" value={wb.mood} onChange={(v) => setWb((p) => ({ ...p, mood: v }))} />
        <ScaleRow label="Sleep" value={wb.sleep} onChange={(v) => setWb((p) => ({ ...p, sleep: v }))} />
        <ScaleRow label="Focus" value={wb.focus} onChange={(v) => setWb((p) => ({ ...p, focus: v }))} />
      </Section>

      <Section>
        <Input label="Side effects (optional)" placeholder="Any side effects this week?" value={sideEffects} onChangeText={setSideEffects} multiline />
        <Input label="Notes (optional)" placeholder="Anything else to remember?" value={notes} onChangeText={setNotes} multiline />
        <Button title="Save check-in" onPress={save} />
      </Section>

      {state.checkins.length ? (
        <Section>
          <Tagline title={`Saved check-ins (${state.checkins.length})`} />
          {state.checkins
            .slice()
            .reverse()
            .map((c, i) => (
              <View key={i}>
                <Text style={styles.savedRow}>{fmtDate(c.dateISO)} • Adherence {c.adherencePct}%</Text>
                {i < state.checkins.length - 1 ? <Divider /> : null}
              </View>
            ))}
          <Button title="Delete last check-in" variant="danger" onPress={deleteLast} />
        </Section>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  label: { fontSize: 13, fontWeight: '700', color: colors.text },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  symRow: { gap: 6, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: colors.borderSoft },
  symName: { fontSize: 14, fontWeight: '700', color: colors.text },
  changeWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  changeChip: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, paddingHorizontal: 11, paddingVertical: 6, backgroundColor: colors.surface },
  changeChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  changeText: { fontSize: 12, fontWeight: '600', color: colors.textMuted },
  changeTextActive: { color: '#FFFFFF' },
  savedRow: { fontSize: 13, color: colors.textSoft, paddingVertical: 6 },
});
