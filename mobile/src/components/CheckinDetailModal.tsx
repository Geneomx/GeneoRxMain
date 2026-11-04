import { medicationAdherence } from '@/wizard/medicationTracking';
import { adherenceLabel, doseCountsLabel } from '@/wizard/medicationTracking';
import React from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { AppText as Text } from '@/components/AppText';
import { SnapshotPreview } from './SnapshotPreview';
import { AppIcon, type AppIconName } from './AppIcon';
import { useTranslation } from '@/hooks/useTranslation';
import { fmtDate, impactLabel, sideEffectList } from '@/wizard/engine';
import { BODY_SYSTEM_KEYS, LIFESTYLE_KEYS, type WizardCheckin } from '@/wizard/types';
import { colors } from '@/theme';
import { useEditCheckin } from '@/hooks/useEditCheckin';
import { readableCheckinDate } from '@/wizard/checkinEditor';

type Props = {
  visible: boolean;
  checkin: WizardCheckin | null;
  index: number;
  onClose: () => void;
};

export const CheckinDetailModal: React.FC<Props> = ({ visible, checkin, index, onClose }) => {
  const { t, language } = useTranslation();
  const { fontScale } = useWindowDimensions();
  const edit = useEditCheckin();
  if (!checkin) return null;
  // Rows hydrated from an older local draft may lack these fields entirely.
  const medicationDoses = checkin.medicationDoses || [];
  const supplementsTaken = checkin.supplementsTaken || [];
  const symptomItems = checkin.symptoms?.items || [];
  const wellbeing = checkin.wellbeing || {};
  const sideEffects = sideEffectList(checkin.sideEffects);
  const completion = checkin.completion;
  const large = fontScale > 1.3;
  const known = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 10;
  const answer = (value: unknown) => value === 'yes' || value === 'no' ? t('common.' + value) : value === 'unsure' ? t('checkin.unsure') : t('checkin.not_answered');
  const heading = (icon: AppIconName, title: string) => <View style={styles.heading}><AppIcon name={icon} size={20} /><Text accessibilityRole="header" style={styles.sectionTitle}>{title}</Text></View>;
  const row = (label: string, value: string, detail?: string) => <View key={label} style={[styles.row, large && styles.stacked]}><Text style={[styles.rowLabel, large && { flex: 0 }]}>{label}</Text><View style={[styles.answer, large && { alignItems: 'flex-start' }]}><Text style={styles.rowValue}>{value}</Text>{detail ? <Text style={styles.caption}>{detail}</Text> : null}</View></View>;
  const date = new Date(checkin.dateISO);
  const weekday = Number.isFinite(date.getTime()) ? date.toLocaleDateString(language, { weekday: 'long' }) : '';
  return <SnapshotPreview visible={visible} title={readableCheckinDate(checkin.dateISO, language)} subtitle={`${t('checkin.label_n')} ${index + 1}${weekday ? ` · ${weekday}` : ''}`} icon="calendar" text="" onClose={onClose} primaryAction={{ title: t('easy_use.edit_record'), onPress: () => { onClose(); edit(checkin); } }}>
    <View style={styles.document}>
      <View style={[styles.status, large && styles.stacked]}><View style={[styles.statusCopy, large && { flex: 0 }]}><Text style={styles.caption}>{t('checkin.adherence')}</Text><Text style={styles.statusValue}>{adherenceLabel(medicationAdherence(checkin), t(medicationDoses.length ? 'checkin.unsure' : 'checkin.not_answered'))}</Text></View>{!large ? <View style={styles.statusIcon} accessible={false}><AppIcon name="pill" size={30} /></View> : null}</View>
      <View style={styles.section}>{heading('pill', t('easy_use.medication_period'))}{medicationDoses.length ? medicationDoses.map((entry, i) => <View key={`${entry.medId}-${i}`} style={styles.medicine}>
        <Text style={styles.name}>{entry.medicationName}</Text>{entry.strength || entry.frequency ? <Text style={styles.caption}>{[entry.strength, entry.frequency].filter(Boolean).join(' · ')}</Text> : null}
        <Text style={[styles.body, entry.status === 'all' && { color: colors.success }]}>{t(`tracking.dose.${entry.status}`)}{doseCountsLabel(entry) ? ` ${doseCountsLabel(entry)}` : ''}</Text>
      </View>) : <Text style={styles.caption}>{t('report.no_dose_answers')}</Text>}</View>
      {symptomItems.length ? <View style={styles.section}>{heading('heart', t('checkin.symptom_improvement'))}{symptomItems.map(item => <View key={item.symptom} style={styles.symptom}>
        <View style={[styles.symptomTop, large && styles.stacked]}><Text style={styles.name}>{item.symptom}</Text><Text style={[styles.body, item.change === 'Worse' && { color: colors.danger }]}>{impactLabel(item.change, t) || t('checkin.not_answered')}</Text></View>
        {known(item.severityNow) ? <Text style={styles.caption}>{t('dashboard.update.severity', { value: item.severityNow })}</Text> : null}
      </View>)}</View> : null}
      <View style={styles.section}>{heading('sun', t('step.3'))}<View style={styles.ratings}>{BODY_SYSTEM_KEYS.filter((key, i) => i < 4 || Object.prototype.hasOwnProperty.call(wellbeing, key)).map(key => <View key={key} style={[styles.rating, { width: large ? '100%' : '48%' }]}><Text style={styles.caption}>{t('wellbeing.' + key).replace(/\s*\([^)]*\)\s*$/, '')}</Text><Text style={[styles.ratingValue, !known(wellbeing[key]) && styles.unknown]}>{known(wellbeing[key]) ? `${wellbeing[key]}/10` : t('checkin.not_answered')}</Text></View>)}</View></View>
      {supplementsTaken.length ? <View style={styles.section}>{heading('pill', t('checkin.supplements_title'))}<Text selectable style={styles.body}>{supplementsTaken.join(', ')}</Text></View> : null}
      {completion ? <View style={styles.section}>{heading('calendar', t('checkin.monthly_title'))}
        {row(t('checkin.labs_q'), answer(completion.labs), completion.labsDateISO ? fmtDate(completion.labsDateISO) : undefined)}
        {row(t('checkin.prescriber_q'), answer(completion.prescriber), completion.prescriberDateISO ? fmtDate(completion.prescriberDateISO) : undefined)}
        {LIFESTYLE_KEYS.filter(key => Object.prototype.hasOwnProperty.call(completion.lifestyle || {}, key)).map(key => row(t('checkin.lifestyle.' + key), answer(completion.lifestyle?.[key])))}
      </View> : null}
      {sideEffects.length ? <View style={styles.section}>{heading('heart', t('checkin.side_effects'))}<Text selectable style={styles.body}>{sideEffects.join(', ')}</Text></View> : null}
      {checkin.notes ? <View style={styles.section}>{heading('file', t('polish.notes'))}<Text selectable style={styles.note}>{checkin.notes}</Text></View> : null}
    </View>
  </SnapshotPreview>;
};

const styles = StyleSheet.create({
  document: { gap: 26 }, section: { gap: 12 }, heading: { flexDirection: 'row', alignItems: 'center', gap: 9 }, sectionTitle: { flex: 1, fontSize: 18, lineHeight: 27, fontWeight: '600', color: colors.text },
  status: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 16, padding: 20, borderRadius: 24, backgroundColor: colors.primary50 }, statusCopy: { flex: 1, gap: 6 }, statusValue: { fontSize: 28, lineHeight: 37, fontWeight: '500', color: colors.primaryDark }, statusIcon: { width: 52, height: 52, borderRadius: 18, backgroundColor: colors.primary100, alignItems: 'center', justifyContent: 'center' },
  medicine: { padding: 16, borderRadius: 18, backgroundColor: colors.surfaceAlt, gap: 5 }, name: { color: colors.text, fontSize: 17, lineHeight: 25, fontWeight: '500', flexShrink: 1 },
  body: { color: colors.textSoft, fontSize: 17, lineHeight: 26, flexShrink: 1 }, caption: { color: colors.textMuted, fontSize: 15, lineHeight: 23 },
  symptom: { paddingVertical: 12, gap: 6, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.borderSoft }, symptomTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  ratings: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 10 }, rating: { padding: 15, borderRadius: 18, backgroundColor: colors.surfaceAlt, gap: 5 }, ratingValue: { color: colors.text, fontSize: 22, lineHeight: 30, fontWeight: '500' }, unknown: { fontSize: 16, lineHeight: 24, color: colors.textMuted },
  row: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.borderSoft }, rowLabel: { flex: 1, color: colors.textSoft, fontSize: 16, lineHeight: 24 }, rowValue: { color: colors.text, fontSize: 17, lineHeight: 25 }, answer: { gap: 3, flexShrink: 1, alignItems: 'flex-end' },
  stacked: { flexDirection: 'column', alignItems: 'flex-start' }, note: { color: colors.textSoft, fontSize: 17, lineHeight: 27, padding: 16, borderRadius: 18, backgroundColor: colors.surfaceAlt },
});
