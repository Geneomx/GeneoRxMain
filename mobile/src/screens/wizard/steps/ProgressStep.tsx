import { useSetup } from '@/store/SetupContext';
import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { AppText as Text } from '@/components/AppText';
import { AppIcon } from '@/components/AppIcon';
import { DropdownSelect } from '@/components/DropdownSelect';
import { ProgressRatingBars } from '@/components/ProgressRatingBars';
import { CheckinDetailModal } from '@/components/CheckinDetailModal';
import { TrackingExplanation } from '@/components/TrackingExplanation';
import { EditorSheet, ListRow, refined } from '@/components/RefinedUI';
import { useWizard } from '@/store/WizardContext';
import { useTranslation } from '@/hooks/useTranslation';
import { checkinsInRange, knownAdherenceAverage, reviewPeriod, type ReviewRange } from '@/wizard/reviewData';
import { progressPoints, progressComparison, type ProgressMeasure } from '@/wizard/progressChart';
import { latestUpdate } from '@/wizard/latestUpdate';
import { medicationAdherence, adherenceLabel } from '@/wizard/medicationTracking';
import { fmtDate, impactLabel, type TranslateFn } from '@/wizard/engine';
import { BODY_SYSTEM_KEYS, type WizardCheckin } from '@/wizard/types';
import { FinePrint } from '@/screens/wizard/ui';
import { progressPalette as palette } from '@/theme/progress';
import { colors } from '@/theme';
import { readableCheckinDate } from '@/wizard/checkinEditor';

const checkinSymptomSummary = (c: WizardCheckin, t: TranslateFn) => c.symptoms.items.slice(0, 2).map(i => `${i.symptom} · ${impactLabel(i.change, t)}`).join(', ');
const checkinAdherence = (c: WizardCheckin, t: TranslateFn) => medicationAdherence(c) !== null ? t('parity.percent_taken', { value: medicationAdherence(c)! }) : t('parity.unknown_doses');

export const ProgressStep: React.FC = () => {
  const setup = useSetup();
  const { state, setStep } = useWizard();
  const { t, language } = useTranslation();
  const { fontScale } = useWindowDimensions();
  const [range, setRange] = useState<ReviewRange>('7');
  const [measure, setMeasure] = useState('');
  const [sheet, setSheet] = useState<'more' | 'history' | 'explain' | null>(null);
  const [detailIndex, setDetailIndex] = useState<number | null>(null);
  const checkins = useMemo(() => checkinsInRange(state.checkins, range), [state.checkins, range]);
  const symptomNames = [...new Set(checkins.flatMap(c => c.symptoms.items.map(item => item.symptom)))];
  const choices = [
    ...symptomNames.map(name => ({ value: `symptom:${name}`, label: name, measure: { kind: 'symptom', name } as ProgressMeasure })),
    ...BODY_SYSTEM_KEYS.map(name => ({ value: `wellbeing:${name}`, label: t(`wellbeing.${name}`).replace(/\s*\([^)]*\)\s*$/, ''), measure: { kind: 'wellbeing', name } as ProgressMeasure })),
  ];
  const active = choices.find(choice => choice.value === measure) || choices[0];
  const points = progressPoints(checkins, active.measure);
  const { first, last, hasComparison } = progressComparison(points);
  const update = latestUpdate(checkins, t);
  const latest = update.checkin;
  const average = knownAdherenceAverage(checkins);
  const period = reviewPeriod(range, checkins);
  const shortDate = (time: number | string) => new Date(time).toLocaleDateString(language, { month: 'short', day: 'numeric', ...(range === 'all' ? { year: 'numeric' } : {}) });
  const detail = detailIndex === null ? null : state.checkins[detailIndex] ?? null;
  const openRecord = (record: WizardCheckin) => {
    const index = state.checkins.indexOf(record);
    if (index >= 0) setDetailIndex(index);
  };
  const openFromSheet = (record: WizardCheckin) => { setSheet(null); setTimeout(() => openRecord(record), 350); };
  const changeSheet = (next: 'history' | 'explain') => { setSheet(null); setTimeout(() => setSheet(next), 350); };
  const stacked = fontScale > 1.3;

  return <View style={styles.page}>
    <View style={[styles.rangeRow, stacked && styles.stacked]}>
      <Text style={[styles.caption, { flexShrink: 1 }]}>{shortDate(period.from)} – {shortDate(period.to)}</Text>
      <View style={{ width: stacked ? '100%' : 140 }}><DropdownSelect inline appearance="dark" accessibilityLabel={t('parity.date_range')} value={range} onChange={value => setRange(value as ReviewRange)} options={(['7', '30', 'all'] as const).map(value => ({ value, label: t('parity.range.' + value) }))} /></View>
    </View>
    {checkins.length ? <>
      <View style={styles.card}>
        <View style={[styles.measureRow, stacked && styles.stacked]}>
          <View style={{ flex: stacked ? undefined : 1, alignSelf: 'stretch' }}><DropdownSelect inline appearance="dark" accessibilityLabel={t('clean.progress_measure')} value={active.value} options={choices.map(({ value, label }) => ({ value, label }))} onChange={setMeasure} /></View>
          <Text style={[styles.caption, { flexShrink: 1 }]}>{t(active.measure.kind === 'symptom' ? 'easy_use.severity' : 'easy_use.wellbeing_rating')}</Text>
        </View>
        <View style={{ gap: 4 }}>
          <Text style={styles.comparison} accessibilityLabel={hasComparison ? t('easy_use.rating_change', { from: first!.value!, to: last!.value! }) : last ? t('progress_view.rating_value', { value: last.value! }) : t('progress_view.not_rated')}>{hasComparison ? `${first!.value} → ${last!.value}` : last?.value ?? '—'}<Text style={styles.unit}> {t('easy_use.out_of_ten')}</Text></Text>
          <Text style={styles.caption}>{hasComparison ? t('progress_view.comparison_dates', { from: shortDate(first!.time), to: shortDate(last!.time) }) : last ? shortDate(last.time) : t('parity.no_ratings')}</Text>
        </View>
        <ProgressRatingBars key={`${range}:${active.value}`} points={points} highlighted={last?.key} onOpen={point => openRecord(point.record)} />
        <Text style={styles.caption}>{t(active.measure.kind === 'symptom' ? 'easy_use.severity_scale' : 'easy_use.wellbeing_scale')}</Text>
        {points.some(point => point.value === null) ? <Text style={styles.caption}>— {t('progress_view.not_rated')}</Text> : null}
      </View>
      {latest ? <View style={styles.card}>
        <Text accessibilityRole="header" style={styles.cardTitle}>{t('progress_view.latest')}</Text>
        <Text style={styles.body}>{update.symptomProgress ? t('progress_view.reported', { changes: update.progress }) : t('progress_view.no_changes')}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel={t('parity.open_checkin', { date: fmtDate(latest.dateISO) })} onPress={() => openRecord(latest)} style={({ pressed }) => [styles.latestLink, pressed && styles.pressed]}>
          <Text style={styles.linkText}>{t('progress_view.view_date', { date: readableCheckinDate(latest.dateISO, language) })}</Text>
          <AppIcon name="arrow" size={17} color={palette.accent} />
        </Pressable>
      </View> : null}
    </> : <View style={styles.card}>
      <Text style={styles.cardTitle}>{t('design.no_checkins_title')}</Text>
      <Text style={styles.body}>{t('parity.no_period_records')}</Text>
      <Pressable accessibilityRole="button" onPress={() => setStep(5)} style={({ pressed }) => [styles.emptyAction, pressed && styles.pressed]}><Text style={[styles.linkText, { color: palette.background }]}>{t('simple.check_in')}</Text></Pressable>
    </View>}
    <View style={styles.footer}>
      {!setup.active ? <Pressable accessibilityRole="button" onPress={() => setStep(8)} style={({ pressed }) => [styles.summaryLink, pressed && styles.pressed]}><Text style={styles.linkText}>{t('progress_view.summary')}</Text><AppIcon name="file" size={17} color={palette.accent} /></Pressable> : null}
      {checkins.length ? <Pressable accessibilityRole="button" accessibilityLabel={t('progress_view.more')} onPress={() => setSheet('more')} style={({ pressed }) => [styles.more, pressed && styles.pressed]}><Text style={{ color: palette.accent, fontSize: 24 }}>···</Text></Pressable> : null}
    </View>
    <EditorSheet visible={sheet === 'more'} title={t('progress_view.more')} onClose={() => setSheet(null)}><ListRow icon="calendar" title={t('clean.checkin_history')} onPress={() => changeSheet('history')} /><ListRow icon="spark" title={t('easy.explain_progress')} onPress={() => changeSheet('explain')} last /></EditorSheet>
    <EditorSheet visible={sheet === 'explain'} title={t('easy.explain_progress')} onClose={() => setSheet(null)}><TrackingExplanation range={range} measure={active.value} onOpenRecord={openFromSheet} /></EditorSheet>
    <EditorSheet visible={sheet === 'history'} title={t('ai.history_title')} onClose={() => setSheet(null)}>
      <FinePrint>{t('parity.medication_taken')}: {adherenceLabel(average, t('checkin.not_answered'))}</FinePrint><FinePrint>{t('parity.known_average')}</FinePrint>
      <View>{[...checkins].reverse().map((record, index, all) => {
        const taken = checkinAdherence(record, t), symptoms = checkinSymptomSummary(record, t);
        return <Pressable key={`${record.clientId || record.id || record.dateISO}:${index}`} accessibilityRole="button" accessibilityLabel={`${t('parity.open_checkin', { date: fmtDate(record.dateISO) })}, ${taken}${symptoms ? `, ${symptoms}` : ''}`} onPress={() => openFromSheet(record)} style={({ pressed }) => [{ minHeight: 48, paddingVertical: 10, gap: 4, borderBottomWidth: index === all.length - 1 ? 0 : StyleSheet.hairlineWidth, borderBottomColor: colors.borderSoft }, pressed && styles.pressed]}><Text style={refined.rowTitle}>{fmtDate(record.dateISO)}</Text><Text style={refined.meta}>{symptoms ? `${taken} · ${symptoms}` : taken}</Text></Pressable>;
      })}</View>
    </EditorSheet>
    <CheckinDetailModal visible={detail !== null} checkin={detail} index={detailIndex ?? 0} onClose={() => setDetailIndex(null)} />
  </View>;
};

const styles = StyleSheet.create({
  page: { gap: 16 },
  rangeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  stacked: { flexDirection: 'column', alignItems: 'stretch' },
  card: { backgroundColor: palette.surface, borderRadius: 24, padding: 18, gap: 12 },
  measureRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  cardTitle: { color: palette.text, fontSize: 17, lineHeight: 24, fontWeight: '600' },
  comparison: { color: palette.text, fontSize: 34, lineHeight: 43, fontWeight: '500', letterSpacing: -1 },
  unit: { color: palette.muted, fontSize: 15, lineHeight: 22, letterSpacing: 0 },
  caption: { color: palette.muted, fontSize: 14, lineHeight: 21 },
  body: { color: palette.text, fontSize: 17, lineHeight: 26 },
  latestLink: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', minHeight: 48, gap: 9 },
  linkText: { color: palette.accent, fontSize: 17, lineHeight: 24, fontWeight: '500', flexShrink: 1 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  summaryLink: { flexDirection: 'row', alignItems: 'center', minHeight: 48, flexShrink: 1, gap: 9 },
  more: { width: 48, minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  emptyAction: { backgroundColor: palette.accent, minHeight: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', padding: 12 },
  pressed: { opacity: 0.65 },
});
