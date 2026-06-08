import React, { useMemo } from 'react';
import { View } from 'react-native';
import { useWizard } from '@/store/WizardContext';
import { MED_DB } from '@/content/wizardData';
import {
  computeDrugInteractions,
  computeInsightEngine,
  computeMedicationSuccessPrediction,
  detectHealthPatterns,
  fmtDate,
  latestCheckin,
  safetyFlags,
} from '@/wizard/engine';
import { KVItem, Section, Tagline, Accordion } from '@/screens/wizard/ui';

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
    };
  }, [state]);

  return (
    <View style={{ gap: 16 }}>
      <Section>
        <Tagline
          title="Your session"
          body={`${state.profile.age || '—'} yrs · ${state.profile.gender || '—'}`}
        />
        <KVItem k="Medications">{data.meds.length ? data.meds.join(', ') : 'None added.'}</KVItem>
        <KVItem k="Symptoms">{state.symptoms.selected.length ? state.symptoms.selected.join(', ') : 'None selected.'}</KVItem>
        <KVItem k="Plan">
          {state.plan.started
            ? `Started ${fmtDate(state.plan.startDate)}${state.plan.recommendedSupplements.length ? ` · ${state.plan.recommendedSupplements.join(', ')}` : ''}`
            : 'Not started yet.'}
        </KVItem>
        <KVItem k="Latest check-in">
          {data.last ? `${fmtDate(data.last.dateISO)} · Adherence ${data.last.adherencePct}%` : 'None yet.'}
        </KVItem>
        {data.flags.length ? <KVItem k="Safety flags">{data.flags.join(', ')}</KVItem> : null}
      </Section>

      <Accordion title="Clinical details" subtitle="Predictions, patterns, and insight">
        <KVItem k="Success prediction">{data.success.score}% · {data.success.level}{'\n'}{data.success.reason}</KVItem>
        <KVItem k="Pattern">
          {data.patterns.length ? `${data.patterns[0].title} — ${data.patterns[0].note}` : 'No strong pattern yet.'}
        </KVItem>
        <KVItem k="Interactions">
          {data.interactions.length ? data.interactions.map((x) => x.title).join(', ') : 'None flagged.'}
        </KVItem>
        <KVItem k="Insight">{data.insight.summary}{'\n'}{data.insight.meaning}</KVItem>
      </Accordion>
    </View>
  );
};
