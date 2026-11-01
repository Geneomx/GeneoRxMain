import React, { createContext, useContext, useEffect } from 'react';
import { useWindowDimensions, View } from 'react-native';
import { DropdownSelect } from './DropdownSelect';
import type { ReviewRange } from '@/wizard/reviewData';
import { useTranslation } from '@/hooks/useTranslation';

type HeaderRange = { value: ReviewRange; onChange: (value: ReviewRange) => void };
export const WizardRangeContext = createContext<React.Dispatch<React.SetStateAction<HeaderRange | null>> | null>(null);
export function useHeaderRange(value: ReviewRange, onChange: (value: ReviewRange) => void) {
  const register = useContext(WizardRangeContext);
  useEffect(() => { if (!register) return; register({ value, onChange }); return () => register(null); }, [register, value, onChange]);
  return !!register;
}
export const ReviewRangeSelect: React.FC<HeaderRange & { compact?: boolean }> = ({ value, onChange, compact = false }) => {
  const { t } = useTranslation();
  const { fontScale, width } = useWindowDimensions();
  return <View style={{ alignSelf: compact ? 'center' : 'flex-end', width: fontScale > 1.3 ? Math.min(width - 48, 240) : 152 }}><DropdownSelect label={compact ? undefined : t('parity.date_range')} accessibilityLabel={t('parity.date_range')} inline value={value} onChange={v => onChange(v as ReviewRange)} options={(['7', '30', 'all'] as const).map(v => ({ value: v, label: t('parity.range.' + v) }))} /></View>;
};
