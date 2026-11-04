import { medicationDetail } from '@/wizard/medicationTracking';
import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText as Text } from '@/components/AppText';
import { fetchAiSummary, type AiSummaryResult } from '@/api/aiSummary';
import { useTranslation } from '@/hooks/useTranslation';
import { findMedName, useMedCatalog } from '@/store/MedCatalogContext';
import { useWizard } from '@/store/WizardContext';
import { FinePrint } from '@/screens/wizard/ui';
import { colors } from '@/theme';
import { Button } from './Button';

export const MedicationSymptomSummary: React.FC = () => {
  const { state } = useWizard();
  const { catalog } = useMedCatalog();
  const { t, language } = useTranslation();
  const medications = state.meds.map(row => [findMedName(catalog, row.medId), medicationDetail(row)].filter(Boolean).join(' · '));
  const key = JSON.stringify([medications, state.meds, state.symptoms.selected, state.symptoms.severity, language]);
  const request = useRef<AbortController | null>(null);
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [result, setResult] = useState<(AiSummaryResult & { key: string }) | null>(null);

  useEffect(() => () => { request.current?.abort(); request.current = null; }, [key]);

  const generate = async () => {
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setPendingKey(key);
    const timer = setTimeout(() => controller.abort(), 30000);
    const overview = t('clean.review_facts', {
      medications: medications.join(', ') || t('summary.none'),
      symptoms: state.symptoms.selected.join(', ') || t('clean.none_confirmed'),
    });
    try {
      const response = await fetchAiSummary({ medications, symptoms: [...state.symptoms.selected], summary: overview, meaning: '', language }, controller.signal);
      if (request.current === controller) setResult({ ...response, summary: response.summary || overview, key });
    } catch {
      if (request.current === controller) setResult({ key, source: 'fallback', summary: overview });
    } finally {
      clearTimeout(timer);
      if (request.current === controller) setPendingKey(null);
    }
  };

  const currentResult = result?.key === key ? result : null;
  return (
    <View style={{ gap: 12 }}>
      <FinePrint>{t('clean.summary_confirmed_note')}</FinePrint>
      <Button title={t('clean.generate_summary')} variant="secondary" loading={pendingKey === key} onPress={() => { void generate(); }} />
      {currentResult?.summary ? (
        <>
          <FinePrint>{t(currentResult.source === 'ai' ? 'report.ai_summary_title' : 'summary.panel_title')}</FinePrint>
          <Text style={styles.body} accessibilityLiveRegion="polite">{currentResult.summary}</Text>
        </>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({ body: { fontSize: 17, lineHeight: 25, color: colors.text } });
