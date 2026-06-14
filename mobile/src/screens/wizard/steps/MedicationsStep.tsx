import React, { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/Button';
import { DropdownSelect } from '@/components/DropdownSelect';
import { Input } from '@/components/Input';
import { useWizard } from '@/store/WizardContext';
import { useMedCatalog } from '@/store/MedCatalogContext';
import type { MedEntry } from '@/content/wizardData';
import { useTranslation } from '@/hooks/useTranslation';
import type { Dose } from '@/wizard/types';
import { FinePrint, HelpNote, Section, Segmented, Tagline, ToggleRow } from '@/screens/wizard/ui';
import { colors, spacing } from '@/theme';

export const MedicationsStep: React.FC = () => {
  const { state, update } = useWizard();
  const { catalog, mergeCustomMeds } = useMedCatalog();
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [pickId, setPickId] = useState('');
  const [pickDose, setPickDose] = useState<Dose>('med');
  const [pickDuration, setPickDuration] = useState('12');
  const [custom, setCustom] = useState('');

  const doseOpts = useMemo(
    () => [
      { label: t('dose.low'), value: 'low' as Dose },
      { label: t('dose.medium'), value: 'med' as Dose },
      { label: t('dose.high'), value: 'high' as Dose },
    ],
    [t],
  );

  const selectedIds = useMemo(() => new Set(state.meds.map((m) => m.medId)), [state.meds]);
  const dropdownOptions = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = catalog
      .filter((m) => !selectedIds.has(m.id))
      .filter((m) => !q || m.name.toLowerCase().includes(q) || m.id.toLowerCase().includes(q))
      .sort((a, b) => a.name.localeCompare(b.name));

    return [
      { value: '', label: t('common.select') },
      ...list.map((m) => ({ value: m.id, label: m.name })),
    ];
  }, [query, selectedIds, t, catalog]);

  const addMed = (id: string, dose: Dose, durationMonths: number) => {
    if (!id) return false;
    update((d) => {
      if (!d.meds.some((m) => m.medId === id)) {
        d.meds.push({ medId: id, dose, durationMonths });
      }
      d.symptomOnlyMode = false;
    });
    return true;
  };

  const addFromPicker = () => {
    if (!pickId) {
      Alert.alert(t('meds.title'), t('meds.alert_select'));
      return;
    }
    const months = parseInt(pickDuration, 10) || 0;
    addMed(pickId, pickDose, months);
    setPickId('');
    setQuery('');
  };

  const removeMed = (id: string) => update((d) => { d.meds = d.meds.filter((m) => m.medId !== id); });
  const setDose = (id: string, dose: Dose) => update((d) => { const m = d.meds.find((x) => x.medId === id); if (m) m.dose = dose; });
  const setDuration = (id: string, months: number) => update((d) => { const m = d.meds.find((x) => x.medId === id); if (m) m.durationMonths = months; });

  const addCustom = () => {
    const name = custom.trim();
    if (!name) {
      Alert.alert(t('meds.title'), t('meds.alert_name'));
      return;
    }
    const id = `custom_${name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 50)}`;
    const existing = catalog.find(
      (m) => m.id === id || m.name.toLowerCase() === name.toLowerCase(),
    );
    const useId = existing?.id ?? id;
    if (!existing) {
      const entry: MedEntry = {
        id: useId,
        name: `${name} (custom)`,
        symptomChips: ['Fatigue', 'Dizziness', 'Brain fog', 'GI discomfort', 'Mood changes', 'Sleep changes'],
        claims: [],
      };
      mergeCustomMeds([entry]);
    }
    const months = parseInt(pickDuration, 10) || 0;
    addMed(useId, pickDose, months);
    setCustom('');
    setPickId('');
  };

  return (
    <View style={{ gap: spacing.md }}>
      <HelpNote what={t('step.1.sub')} why={t('meds.sub')} />
      <Section>
        <Tagline title={t('meds.title')} body={t('meds.sub')} />
        <Input
          label={t('meds.search')}
          placeholder={t('meds.search_placeholder')}
          value={query}
          onChangeText={(text) => {
            setQuery(text);
            if (pickId) {
              const stillVisible = catalog.some(
                (m) => m.id === pickId && (!text.trim() || m.name.toLowerCase().includes(text.trim().toLowerCase())),
              );
              if (!stillVisible) setPickId('');
            }
          }}
          autoCapitalize="none"
        />

        <DropdownSelect
          label={t('meds.list')}
          placeholder={t('common.select')}
          value={pickId}
          options={dropdownOptions}
          onChange={setPickId}
        />

        <Text style={styles.fieldLabel}>{t('meds.dose')}</Text>
        <Segmented value={pickDose} onChange={setPickDose} options={doseOpts} />

        <Input
          label={t('meds.duration')}
          placeholder={t('meds.duration_placeholder')}
          value={pickDuration}
          onChangeText={setPickDuration}
          keyboardType="number-pad"
        />

        <Button title={t('meds.add_btn')} onPress={addFromPicker} />

        <FinePrint>{t('meds.custom_hint')}</FinePrint>

        <Input
          label={t('meds.add_custom')}
          placeholder={t('meds.custom_placeholder')}
          value={custom}
          onChangeText={setCustom}
          onSubmitEditing={addCustom}
          returnKeyType="done"
        />
        <Button title={t('meds.add_custom_btn')} variant="secondary" onPress={addCustom} />

        <ToggleRow
          label={t('meds.no_meds_btn')}
          value={state.symptomOnlyMode}
          onChange={(v) => update((d) => { d.symptomOnlyMode = v; if (v) d.meds = []; })}
        />
        <FinePrint>{t('meds.tip')}</FinePrint>
      </Section>

      {state.meds.length ? (
        <Section>
          <Tagline title={t('meds.list')} />
          {state.meds.map((mi) => {
            const med = catalog.find((x) => x.id === mi.medId);
            const name = med ? med.name : mi.medId.replace(/^custom:/, '').replace(/-/g, ' ');
            return (
              <View key={mi.medId} style={styles.medCard}>
                <View style={styles.medHead}>
                  <Text style={styles.medName}>{name}</Text>
                  <Pressable onPress={() => removeMed(mi.medId)}>
                    <Text style={styles.remove}>{t('meds.remove')}</Text>
                  </Pressable>
                </View>
                <Text style={styles.fieldLabel}>{t('meds.dose')}</Text>
                <Segmented value={mi.dose} onChange={(v) => setDose(mi.medId, v)} options={doseOpts} />
                <Text style={styles.fieldLabel}>{t('meds.duration')}</Text>
                <Segmented
                  value={String(mi.durationMonths)}
                  onChange={(v) => setDuration(mi.medId, parseInt(v, 10))}
                  options={[
                    { label: '3', value: '3' },
                    { label: '6', value: '6' },
                    { label: '12', value: '12' },
                    { label: '24', value: '24' },
                  ]}
                />
              </View>
            );
          })}
        </Section>
      ) : (
        <FinePrint>{t('meds.none_yet')}</FinePrint>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  fieldLabel: { fontSize: 15, fontWeight: '700', color: colors.textMuted, marginTop: 4 },
  medCard: { gap: 8, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.borderSoft },
  medHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  medName: { fontSize: 15, fontWeight: '700', color: colors.text, flex: 1 },
  remove: { fontSize: 13, fontWeight: '700', color: colors.danger },
});
