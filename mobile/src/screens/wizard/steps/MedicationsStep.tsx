import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Input } from '@/components/Input';
import { Chip } from '@/components/Chip';
import { useWizard } from '@/store/WizardContext';
import { MED_DB } from '@/content/wizardData';
import type { Dose } from '@/wizard/types';
import { FinePrint, HelpNote, Section, Segmented, Tagline, ToggleRow } from '@/screens/wizard/ui';
import { colors, radius, spacing } from '@/theme';

const DOSE_OPTS: { label: string; value: Dose }[] = [
  { label: 'Low', value: 'low' },
  { label: 'Medium', value: 'med' },
  { label: 'High', value: 'high' },
];

export const MedicationsStep: React.FC = () => {
  const { state, update } = useWizard();
  const [query, setQuery] = useState('');
  const [custom, setCustom] = useState('');

  const selectedIds = useMemo(() => new Set(state.meds.map((m) => m.medId)), [state.meds]);
  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    return MED_DB.filter((m) => !selectedIds.has(m.id) && (!q || m.name.toLowerCase().includes(q))).slice(0, 8);
  }, [query, selectedIds]);

  const addMed = (id: string) => {
    update((d) => {
      if (!d.meds.some((m) => m.medId === id)) d.meds.push({ medId: id, dose: 'med', durationMonths: 6 });
      d.symptomOnlyMode = false;
    });
    setQuery('');
  };
  const removeMed = (id: string) => update((d) => { d.meds = d.meds.filter((m) => m.medId !== id); });
  const setDose = (id: string, dose: Dose) => update((d) => { const m = d.meds.find((x) => x.medId === id); if (m) m.dose = dose; });
  const setDuration = (id: string, months: number) => update((d) => { const m = d.meds.find((x) => x.medId === id); if (m) m.durationMonths = months; });

  const addCustom = () => {
    const name = custom.trim();
    if (!name) return;
    const id = `custom:${name.toLowerCase().replace(/\s+/g, '-')}`;
    // Custom meds aren't in MED_DB, so we store a placeholder entry id; engine ignores unknown ids gracefully.
    update((d) => {
      if (!d.meds.some((m) => m.medId === id)) d.meds.push({ medId: id, dose: 'med', durationMonths: 6 });
      d.symptomOnlyMode = false;
    });
    setCustom('');
  };

  return (
    <View style={{ gap: spacing.md }}>
      <HelpNote
        what="Search for each medicine you take and add it. Then set how strong your dose is and how long you've been on it."
        why="Some medicines can lower certain nutrients over time. Your dose and how long you've taken it change how strong that effect may be."
      />
      <Section>
        <Tagline title="Your medications" body="Pick from the list or search. Add dose and how long you've been taking each." />
        <Input label="Search medications" placeholder="e.g. metformin, statin, PPI…" value={query} onChangeText={setQuery} autoCapitalize="none" />
        {matches.length ? (
          <View style={styles.matchList}>
            {matches.map((m) => (
              <Pressable key={m.id} style={styles.matchRow} onPress={() => addMed(m.id)}>
                <Text style={styles.matchName}>{m.name}</Text>
                <Text style={styles.matchAdd}>+ Add</Text>
              </Pressable>
            ))}
          </View>
        ) : (
          <FinePrint>{query.trim() ? 'No matches — add it as a custom medication below.' : 'Start typing or add a custom medication.'}</FinePrint>
        )}

        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-end' }}>
          <View style={{ flex: 1 }}>
            <Input label="Custom medication" placeholder="Type a medication name" value={custom} onChangeText={setCustom} />
          </View>
          <Pressable style={styles.customBtn} onPress={addCustom}>
            <Text style={styles.customBtnText}>Add</Text>
          </Pressable>
        </View>

        <ToggleRow
          label="I'm not taking any medications (symptom-only mode)"
          value={state.symptomOnlyMode}
          onChange={(v) => update((d) => { d.symptomOnlyMode = v; if (v) d.meds = []; })}
        />
        <FinePrint>Turn this on if you take no medicines — you'll still get suggestions based on your symptoms.</FinePrint>
      </Section>

      {state.meds.length ? (
        <Section>
          <Tagline title={`Added (${state.meds.length})`} />
          {state.meds.map((mi) => {
            const med = MED_DB.find((x) => x.id === mi.medId);
            const isCustom = mi.medId.startsWith('custom:');
            const name = med ? med.name : mi.medId.replace(/^custom:/, '').replace(/-/g, ' ');
            return (
              <View key={mi.medId} style={styles.medCard}>
                <View style={styles.medCardHead}>
                  <View style={styles.medNameRow}>
                    <Text style={styles.medName}>{name}</Text>
                    {isCustom ? (
                      <View style={styles.customTag}><Text style={styles.customTagText}>Custom</Text></View>
                    ) : null}
                  </View>
                  <Pressable onPress={() => removeMed(mi.medId)}><Text style={styles.remove}>Remove</Text></Pressable>
                </View>
                <Text style={styles.fieldLabel}>Dose</Text>
                <Text style={styles.fieldHint}>Roughly how strong your dose is — not the exact mg.</Text>
                <Segmented value={mi.dose} onChange={(v) => setDose(mi.medId, v)} options={DOSE_OPTS} />
                <Text style={[styles.fieldLabel, { marginTop: 8 }]}>Duration: {mi.durationMonths} {mi.durationMonths === 1 ? 'month' : 'months'}</Text>
                <View style={styles.durRow}>
                  {[1, 3, 6, 12, 24].map((mo) => (
                    <Chip key={mo} label={`${mo}m`} selected={mi.durationMonths === mo} onPress={() => setDuration(mi.medId, mo)} />
                  ))}
                </View>
              </View>
            );
          })}
          {state.meds.some((m) => m.medId.startsWith('custom:')) ? (
            <FinePrint>
              Custom medications aren’t in our research database yet, so they won’t generate nutrient
              signals or interaction/caution checks — but they’re still saved to your profile.
            </FinePrint>
          ) : null}
        </Section>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  matchList: { borderWidth: 1, borderColor: colors.borderSoft, borderRadius: radius.md, overflow: 'hidden' },
  matchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 11, paddingHorizontal: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.borderSoft },
  matchName: { fontSize: 14, color: colors.text, fontWeight: '500' },
  matchAdd: { fontSize: 13, color: colors.primary, fontWeight: '700' },
  customBtn: { backgroundColor: colors.primary, borderRadius: radius.md, paddingHorizontal: spacing.md, height: 44, alignItems: 'center', justifyContent: 'center' },
  customBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
  medCard: { borderWidth: 1, borderColor: colors.borderSoft, borderRadius: radius.md, padding: spacing.md, gap: 6, backgroundColor: colors.backgroundAlt },
  medCardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  medNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 },
  medName: { fontSize: 15, fontWeight: '700', color: colors.text, flexShrink: 1, textTransform: 'capitalize' },
  customTag: {
    paddingVertical: 2, paddingHorizontal: 8, borderRadius: 999,
    backgroundColor: colors.surfaceAlt, borderWidth: 1, borderColor: colors.borderSoft,
  },
  customTagText: { fontSize: 10.5, fontWeight: '700', color: colors.textMuted, letterSpacing: 0.3 },
  remove: { fontSize: 13, color: colors.danger, fontWeight: '600' },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.3 },
  fieldHint: { fontSize: 12, color: colors.textMuted, lineHeight: 17, marginTop: -2, marginBottom: 4 },
  durRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 2 },
});
