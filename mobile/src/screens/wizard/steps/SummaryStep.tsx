import React, { useMemo } from 'react';
import { View } from 'react-native';
import { useWizard } from '@/store/WizardContext';
import { MED_DB } from '@/content/wizardData';
import {
  computeContraindications,
  computeDrugInteractions,
  computeInsightEngine,
  computeMedicationSuccessPrediction,
  detectHealthPatterns,
  fmtDate,
  latestCheckin,
  safetyFlags,
} from '@/wizard/engine';
import { HelpNote, KVItem, Section, Tagline } from '@/screens/wizard/ui';

export const SummaryStep: React.FC = () => {
  const { state } = useWizard();

  const data = useMemo(() => {
    const meds = state.meds.map((m) => {
      const med = MED_DB.find((x) => x.id === m.medId);
      return med ? med.name : m.medId.replace(/^custom:/, '').replace(/-/g, ' ');
    });
    return {
      meds,
      last: latestCheckin(state),
      flags: safetyFlags(state),
      insight: computeInsightEngine(state),
      success: computeMedicationSuccessPrediction(state),
      patterns: detectHealthPatterns(state),
      interactions: computeDrugInteractions(state),
      contraindications: computeContraindications(state),
    };
  }, [state]);

  return (
    <View style={{ gap: 16 }}>
      <HelpNote
        what="A one-screen recap of everything from this session — your meds, symptoms, flags, predictions, and latest check-in."
        why="Use it as a quick review before you leave, or to copy details when talking to your clinician."
      />
      <Section>
      <Tagline title="GeneoRx summary" body="Your overall dashboard view before you leave the portal." />
      <KVItem k="Account">{(state.account.email || 'Guest')} • Consent: {state.account.consent ? 'Yes' : 'No'}</KVItem>
      <KVItem k="Medications">{data.meds.length ? data.meds.join(', ') : 'No medications added.'}</KVItem>
      <KVItem k="Symptoms">{state.symptoms.selected.length ? state.symptoms.selected.join(', ') : 'No symptoms selected.'}</KVItem>
      <KVItem k="Safety flags">{data.flags.length ? data.flags.join(', ') : 'None'}</KVItem>
      <KVItem k="Medication success prediction">{data.success.score}% • {data.success.level}{'\n'}{data.success.reason}</KVItem>
      <KVItem k="Detected pattern">{data.patterns.length ? `${data.patterns[0].title} — ${data.patterns[0].note}` : 'No strong pattern detected yet.'}</KVItem>
      <KVItem k="Drug interactions">{data.interactions.length ? data.interactions.map((x) => x.title).join(', ') : 'No interaction alerts triggered.'}</KVItem>
      <KVItem k="Contraindications & cautions">{data.contraindications.length ? data.contraindications.map((x) => x.title).join(', ') : 'No contraindication alerts triggered.'}</KVItem>
      <KVItem k="GeneoRx insight">{data.insight.summary}{'\n'}{data.insight.meaning}</KVItem>
      <KVItem k="Latest check-in">{data.last ? `${fmtDate(data.last.dateISO)} • Adherence ${data.last.adherencePct}%` : 'No check-ins yet.'}</KVItem>
      </Section>
    </View>
  );
};
