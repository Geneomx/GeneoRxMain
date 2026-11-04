import React from 'react';
import { Pressable, View } from 'react-native';
import { AppText as Text } from '@/components/AppText';
import { useWizard } from '@/store/WizardContext';
import { useTranslation } from '@/hooks/useTranslation';
import { progressExplanationFacts } from '@/wizard/progressExplanation';
import { fmtDate } from '@/wizard/recordFormatting';
import { useMedCatalog } from '@/store/MedCatalogContext';
import type { WizardCheckin } from '@/wizard/types';
import { checkinsInRange, reviewPeriod, type ReviewRange } from '@/wizard/reviewData';
import { FinePrint } from '@/screens/wizard/ui';
import { refined } from './RefinedUI';

/** A factual explanation computed on this device; this component has no network calls. */
export const TrackingExplanation: React.FC<{ range: ReviewRange; measure?: string; onOpenRecord?: (record: WizardCheckin) => void }> = ({ range, measure, onOpenRecord }) => {
  const { state } = useWizard();
  const { t } = useTranslation();
  const { catalog } = useMedCatalog();
  const checkins = checkinsInRange(state.checkins, range);
  const facts = progressExplanationFacts(state, range, t, catalog, measure);
  return <View style={{ gap: 14 }}>
    <FinePrint>{reviewPeriod(range, checkins).label}</FinePrint>
    <FinePrint>{t('review.local_explanation')}</FinePrint>
    {!facts.length ? <Text style={refined.body}>{t('parity.no_period_records')}</Text> : facts.map(fact => <View key={fact.id} style={{ gap: 8, paddingVertical: 12 }}>
      <Text accessibilityRole="header" style={refined.rowTitle}>{fact.title}</Text><Text style={refined.body} selectable>{fact.text}</Text>
      {onOpenRecord ? <View style={{ gap: 4 }}>{[...new Set(fact.records)].map(record => <Pressable key={record.clientId || record.id || record.dateISO} accessibilityRole="button" accessibilityLabel={t('parity.open_checkin', { date: fmtDate(record.dateISO) })} onPress={() => onOpenRecord(record)} style={{ minHeight: 48, justifyContent: 'center', paddingVertical: 10 }}><Text style={refined.linkText}>{t('assist.view_record', { date: fmtDate(record.dateISO) })}</Text></Pressable>)}</View> : null}
    </View>)}
    <FinePrint>{t('review.no_cause')}</FinePrint>
  </View>;
};
