import { useSetup } from '@/store/SetupContext';
import type { SetupStep } from '@/wizard/setupFlow';
import React, { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { AppText as Text } from '@/components/AppText';
import { Button } from '@/components/Button';
import { EditorSheet, ListRow, SectionHeading, refined } from '@/components/RefinedUI';
import { TrackingExplanation } from '@/components/TrackingExplanation';
import { checkinsInRange, reviewHighlights, trackingOverview } from '@/wizard/reviewData';
import { useWizard } from '@/store/WizardContext';
import { useMedCatalog } from '@/store/MedCatalogContext';
import { aggregateEvidenceByNutrient, claimsForSelectedMeds, computeContraindications, computeDrugInteractions, evidenceCoverage, evidencePanel, fmtDate } from '@/wizard/engine';
import { useTranslation } from '@/hooks/useTranslation';
import { AlertBox, CiteChip, FinePrint, Section } from '@/screens/wizard/ui';
import { LatestUpdateCard } from '@/components/LatestUpdateCard';
import { latestUpdate } from '@/wizard/latestUpdate';

export const ResultsStep: React.FC = () => {
  const setup = useSetup();
  const { state, focusTarget, setFocusTarget, setStep } = useWizard();
  const go = (step: SetupStep) => { if (setup.active) void setup.begin(step); else setStep(step); };
  const { catalog } = useMedCatalog();
  const { t } = useTranslation();
  const [sheet, setSheet] = useState<'ai' | 'notes' | 'sources' | 'safety' | null>(null);
  const records = checkinsInRange(state.checkins, 'all');
  const highlights = reviewHighlights({ ...state, checkins: records }, t, catalog);
  const evidence = useMemo(() => aggregateEvidenceByNutrient(claimsForSelectedMeds(state, catalog)), [state.meds, catalog]);
  const interactions = computeDrugInteractions(state, t);
  const cautions = computeContraindications(state, t);
  const coverage = evidenceCoverage(state, catalog);
  const update = latestUpdate(records, t);
  useEffect(() => {
    if (!focusTarget) return;
    setSheet(focusTarget.kind === 'nutrient' ? 'sources' : 'safety');
    setFocusTarget(null);
  }, [focusTarget, setFocusTarget]);
  return <View style={{ gap: 16 }}>
    {update.checkin ? <LatestUpdateCard update={update} loading={false} onCheckin={() => go(5)} /> : <Section><Text style={refined.body}>{t('review.no_symptom_records')}</Text><Button title={t('simple.check_in')} onPress={() => go(5)} /></Section>}
    <View style={refined.listGroup}>
      <ListRow icon="chart" title={t('parity.patterns_review')} onPress={() => go(6)} />
      <ListRow icon="plan" title={t('review.safety_title')} onPress={() => setSheet('safety')} />
      <ListRow icon="file" title={t('review.evidence_title')} onPress={() => setSheet('sources')} />
      <ListRow icon="heart" title={t('parity.side_notes')} onPress={() => setSheet('notes')} last />
    </View>
    {!setup.active ? <Button title={t('parity.preview_summary')} onPress={() => go(8)} /> : null}
    <Button title={t('review.ai_explanation')} variant="ghost" onPress={() => setSheet('ai')} />
    <FinePrint>{t('review.no_cause')}</FinePrint>
    <EditorSheet visible={sheet === 'ai'} title={t('review.ai_explanation')} onClose={() => setSheet(null)}><TrackingExplanation range="30" /></EditorSheet>
    <EditorSheet visible={sheet === 'notes'} title={t('parity.side_notes')} onClose={() => setSheet(null)}>
      {highlights.notes.length ? highlights.notes.map((note, index) => <View key={`${note.date}-${index}`} style={{ gap: 6 }}><Text style={refined.rowTitle}>{fmtDate(note.date)}</Text><Text style={refined.body}>{note.text}</Text></View>) : <Text style={refined.body}>{t('parity.notes_empty')}</Text>}
      <Button title={t('simple.check_in')} onPress={() => { setSheet(null); go(5); }} />
    </EditorSheet>
    <EditorSheet visible={sheet === 'sources'} title={t('review.evidence_title')} onClose={() => setSheet(null)}>
      <Text style={refined.body}>{t('review.evidence_general')}</Text>
      {Object.entries(evidence).map(([nutrient, claims]) => {
        const details = evidencePanel(nutrient, claims);
        return <Section key={nutrient}><Text style={refined.rowTitle}>{nutrient}</Text>
          <FinePrint>{[...new Set(claims.map(c => c.medName))].join(', ')}</FinePrint>
          <Text style={refined.body}>{details.noteText}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{details.citations.map(c => <CiteChip key={c} token={c} />)}</View>
        </Section>;
      })}
      {!Object.keys(evidence).length ? <FinePrint>{t('review.no_evidence')}</FinePrint> : null}
      <FinePrint>{t('review.no_cause')}</FinePrint>
    </EditorSheet>
    <EditorSheet visible={sheet === 'safety'} title={t('review.safety_title')} onClose={() => setSheet(null)}>
      <Text style={refined.body}>{t('review.limited_checks')}</Text>
      {interactions.map(alert => <AlertBox key={alert.title} {...alert} />)}
      {cautions.map(alert => <AlertBox key={alert.title} {...alert} />)}
      {!interactions.length && !cautions.length ? <FinePrint>{t('review.no_rule_alerts')}</FinePrint> : null}
      <FinePrint>{t('results.evidence_coverage')} {coverage.evidenceCount}/{coverage.selectedCount}</FinePrint>
      <FinePrint>{t('review.coverage_note')}</FinePrint>
      <Button title={t('parity.medication_list')} variant="secondary" onPress={() => { setSheet(null); setStep(1); }} />
    </EditorSheet>
  </View>;
};
