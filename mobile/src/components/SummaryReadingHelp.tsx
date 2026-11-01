import React from 'react';
import { View } from 'react-native';
import { AppText as Text } from './AppText';
import { refined } from './RefinedUI';
import { useTranslation } from '@/hooks/useTranslation';
import { REPORT_TERM_KEYS } from '@/wizard/reportReading';

/** Reviewed meanings of report labels; never rewrites or diagnoses from a personal record. */
export const SummaryReadingHelp: React.FC = () => {
  const { t } = useTranslation();
  return <View style={{ gap: 22 }}><Text style={refined.meta}>{t('assist.terms_help')}</Text>{REPORT_TERM_KEYS.map(key => <View key={key} style={{ gap: 6 }}><Text accessibilityRole="header" style={refined.rowTitle}>{t(`assist.term.${key}`)}</Text><Text style={refined.body}>{t(`assist.meaning.${key}`)}</Text></View>)}</View>;
};
