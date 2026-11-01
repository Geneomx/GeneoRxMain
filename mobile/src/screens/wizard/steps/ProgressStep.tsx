import { medicationAdherence } from '@/wizard/medicationTracking';
import { TrackingExplanation } from '@/components/TrackingExplanation';
import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { AppText as Text } from '@/components/AppText';
import { Button } from '@/components/Button';
import { DropdownSelect } from '@/components/DropdownSelect';
import { RatingBars } from '@/components/RatingBars';
import { recordedRatings } from '@/wizard/ratingBars';
import { AppIcon } from '@/components/AppIcon';
import { CheckinDetailModal } from '@/components/CheckinDetailModal';
import { ReviewRangeSelect } from '@/components/ReviewRangeSelect';
import { EditorSheet, ListRow, refined } from '@/components/RefinedUI';
import { useWizard } from '@/store/WizardContext';
import { useTranslation } from '@/hooks/useTranslation';
import { wellbeingRatingSeries, checkinsInRange, knownAdherenceAverage, symptomRatingSeries, type ReviewRange } from '@/wizard/reviewData';
import { adherenceLabel } from '@/wizard/medicationTracking';
import { fmtDate, impactLabel, type TranslateFn } from '@/wizard/engine';
import type { WizardCheckin } from '@/wizard/types';
import { Section, FinePrint } from '@/screens/wizard/ui';
import { colors } from '@/theme';

/** The two facts shown on every check-in row, so same-day records stay tellable apart. */
const checkinSymptomSummary = (c: WizardCheckin, t: TranslateFn) => c.symptoms.items.slice(0, 2).map(i => `${i.symptom} · ${impactLabel(i.change, t)}`).join(', ');
const checkinAdherence = (c: WizardCheckin, t: TranslateFn) => medicationAdherence(c) !== null ? t('parity.percent_taken', { value: medicationAdherence(c)! }) : t('parity.unknown_doses');

export const ProgressStep: React.FC = () => {
  const { state, setStep } = useWizard();
  const { t } = useTranslation();
  const { fontScale } = useWindowDimensions();
  const [range, setRange] = useState<ReviewRange>('7');
  const [selection, setSelection] = useState({ scope: '', key: '' });
  const [measure, setMeasure] = useState('');
  const [historyOpen, setHistoryOpen] = useState(false);
  const [explainOpen, setExplainOpen] = useState(false);
  const [detailIndex, setDetailIndex] = useState<number | null>(null);
  const checkins = useMemo(() => checkinsInRange(state.checkins, range), [state.checkins, range]);
  const symptomSeries = useMemo(() => symptomRatingSeries(checkins), [checkins]);
  const wellbeingKeys = ['energy', 'mood', 'sleep', 'focus'] as const;
  const choices = [...Object.keys(symptomSeries), ...wellbeingKeys];
  const active = choices.includes(measure) ? measure : choices[0];
  const isWellbeing = (wellbeingKeys as readonly string[]).includes(active);
  const measureLabel = (key: string) => (wellbeingKeys as readonly string[]).includes(key) ? t(`wellbeing.${key}`).replace(/\s*\([^)]*\)\s*$/, '') : t('calm.symptom_severity', { name: key });
  const rawPoints: Array<[number, number]> = isWellbeing ? wellbeingRatingSeries(checkins, active as typeof wellbeingKeys[number]) : symptomSeries[active] || [];
  const points = recordedRatings(rawPoints);
  const scope = `${range}:${active}`;
  const picked = (selection.scope === scope ? points.find(point => point.key === selection.key) : undefined) || points.at(-1);
  const label = measureLabel(active);
  const value = picked?.value ?? null;
  const delta = points.length > 1 && picked ? picked.value - points[0].value : null;
  const average = knownAdherenceAverage(checkins);
  const shortDate = (timestamp: number) => new Date(timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  const detail = detailIndex === null ? null : state.checkins[detailIndex];
  return <View style={{ gap: 12 }}>
    <View style={[styles.rangeRow, fontScale > 1.3 && { flexDirection: 'column', alignItems: 'flex-start' }]}><FinePrint>{t('calm.recorded_changes')}</FinePrint><ReviewRangeSelect compact value={range} onChange={setRange} /></View>
    {checkins.length ? <View style={styles.trend}>
      <View style={[styles.valueRow, fontScale > 1.3 && { flexDirection: 'column', alignItems: 'flex-start' }]}>
        <View style={{ flex: fontScale > 1.3 ? 0 : 1, gap: 6 }}><DropdownSelect inline accessibilityLabel={t('clean.progress_measure')} value={active} options={choices.map(choice => ({ value: choice, label: measureLabel(choice) }))} onChange={setMeasure} /><Text style={styles.value}>{value ?? '—'}<Text style={styles.unit}> / 10</Text></Text></View>
        {picked ? <Text style={styles.dateBadge}>{shortDate(picked.time)}</Text> : null}
      </View>
      {points.length ? <>
        <RatingBars points={points} selected={picked?.key} onSelect={key => setSelection({ scope, key })} />
        {delta !== null ? <View style={styles.changeNote}><AppIcon name="chart" size={17} color={delta !== 0 && (isWellbeing ? delta > 0 : delta < 0) ? colors.success : colors.textMuted} /><Text style={[styles.caption, { flexShrink: 1, color: delta !== 0 && (isWellbeing ? delta > 0 : delta < 0) ? colors.success : colors.textMuted }]}>{t('dashboard.progress.change_since', { change: t(delta === 0 ? 'parity.rating_same' : delta > 0 ? Math.abs(delta) === 1 ? 'parity.point_higher' : 'parity.points_higher' : Math.abs(delta) === 1 ? 'parity.point_lower' : 'parity.points_lower', { count: Math.abs(delta) }), date: shortDate(points[0].time) })}</Text></View> : null}
      </> : <FinePrint>{t('parity.no_ratings')}</FinePrint>}
    </View> : <Section><Text style={refined.headingText}>{t('design.no_checkins_title')}</Text><Text style={refined.body}>{t('parity.no_period_records')}</Text><Button title={t('simple.check_in')} onPress={() => setStep(5)} /></Section>}
    <View style={[styles.metrics, fontScale > 1.3 && { flexDirection: 'column' }]}>
      <View style={styles.metric}><Text style={styles.caption}>{t('calm.saved_checkins')}</Text><Text style={styles.stat}>{checkins.length}</Text></View>
      <View style={styles.metric}><Text style={styles.caption}>{t('calm.symptoms_tracked')}</Text><Text style={styles.stat}>{state.symptoms.selected.length}</Text></View>
    </View>
    {checkins.length ? <ListRow icon="calendar" title={t('clean.checkin_history')} onPress={() => setHistoryOpen(true)} last /> : null}
    {checkins.length ? <Button variant="ghost" title={t('easy.explain_progress')} onPress={() => setExplainOpen(true)} /> : null}
    <EditorSheet visible={explainOpen} title={t('easy.explain_progress')} onClose={() => setExplainOpen(false)}><TrackingExplanation range={range} measure={active} onOpenRecord={record => { setExplainOpen(false); setTimeout(() => setDetailIndex(state.checkins.indexOf(record)), 350); }} /></EditorSheet>
    <EditorSheet visible={historyOpen} title={t('ai.history_title')} onClose={() => setHistoryOpen(false)}><FinePrint>{t('parity.medication_taken')}: {adherenceLabel(average, t('checkin.not_answered'))}</FinePrint><FinePrint>{t('parity.known_average')}</FinePrint><View>{[...checkins].reverse().map((c, index, all) => { const taken = checkinAdherence(c, t); const symptoms = checkinSymptomSummary(c, t); return <Pressable key={c.clientId || c.id || c.dateISO} accessibilityRole="button" accessibilityLabel={`${t('parity.open_checkin', { date: fmtDate(c.dateISO) })}, ${taken}${symptoms ? `, ${symptoms}` : ''}`} onPress={() => { setHistoryOpen(false); setDetailIndex(state.checkins.indexOf(c)); }} style={({ pressed }) => [{ minHeight: 48, paddingVertical: 10, gap: 4, borderBottomWidth: index === all.length - 1 ? 0 : StyleSheet.hairlineWidth, borderBottomColor: colors.borderSoft }, pressed && { opacity: 0.65 }]}><Text style={refined.rowTitle}>{fmtDate(c.dateISO)}</Text><Text style={refined.meta}>{symptoms ? `${taken} · ${symptoms}` : taken}</Text></Pressable>; })}</View></EditorSheet>
    <CheckinDetailModal visible={detail !== null} checkin={detail} index={detailIndex ?? 0} onClose={() => setDetailIndex(null)} />
  </View>;
};

const styles = StyleSheet.create({
  rangeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  trend: { backgroundColor: colors.glass, borderRadius: 26, padding: 20, gap: 20, borderWidth: 1, borderColor: colors.glassBorder },
  valueRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  value: { color: colors.text, fontSize: 45, lineHeight: 54, fontWeight: '500', letterSpacing: -1.6 },
  unit: { color: colors.textMuted, fontSize: 17 },
  caption: { color: colors.textMuted, fontSize: 15, lineHeight: 22 },
  plot: { flexDirection: 'row', gap: 8 },
  axis: { justifyContent: 'space-between', paddingVertical: 16 },
  dates: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  dateBadge: { fontSize: 15, lineHeight: 22, color: colors.textMuted, backgroundColor: colors.surfaceAlt, borderRadius: 9, paddingVertical: 4, paddingHorizontal: 8 },
  changeNote: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  metrics: { flexDirection: 'row', paddingVertical: 4, gap: 12 },
  metric: { flex: 1, gap: 6, backgroundColor: colors.glass, padding: 16, borderRadius: 24, borderWidth: 1, borderColor: colors.glassBorder },
  stat: { color: colors.primaryDark, fontSize: 28, lineHeight: 36, fontWeight: '600' },
});
