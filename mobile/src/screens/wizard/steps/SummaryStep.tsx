import React, { useMemo, useState } from 'react';
import { Pressable, Share, StyleSheet, View, useWindowDimensions } from 'react-native';
import { AppText as Text } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { ReviewRangeSelect } from '@/components/ReviewRangeSelect';
import { EditorSheet, iconTone, refined } from '@/components/RefinedUI';
import { SnapshotPreview } from '@/components/SnapshotPreview';
import { SummaryPreviewContent } from '@/components/SummaryPreviewContent';
import { TrackingExplanation } from '@/components/TrackingExplanation';
import { SummaryReadingHelp } from '@/components/SummaryReadingHelp';
import { useReportSpeech } from '@/hooks/useReportSpeech';
import { useToast } from '@/components/Toast';
import { useWizard } from '@/store/WizardContext';
import { useMedCatalog } from '@/store/MedCatalogContext';
import { useTranslation } from '@/hooks/useTranslation';
import { reviewHighlights, summaryBasis, type ReviewRange } from '@/wizard/reviewData';
import { trackingSummaryForRange } from '@/wizard/trackingReport';
import { fmtDate } from '@/wizard/engine';
import { downloadSummaryReport } from '@/wizard/reports';
import { Section, FinePrint } from '@/screens/wizard/ui';
import { summaryRows } from '@/wizard/summaryRows';
import { AppIcon, type AppIconName } from '@/components/AppIcon';
import { colors } from '@/theme';
import { useSetup } from '@/store/SetupContext';
import type { SetupStep } from '@/wizard/setupFlow';

export const SummaryStep: React.FC = () => {
  const { state, setStep, savePayload } = useWizard();
  const setup = useSetup();
  const go = (step: SetupStep) => { if (setup.active) void setup.begin(step); else setStep(step); };
  const { catalog } = useMedCatalog();
  const { t, language } = useTranslation();
  const { fontScale } = useWindowDimensions();
  const toast = useToast();
  const [range, setRange] = useState<ReviewRange>('7');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [readingHelp, setReadingHelp] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [sectionOpen, setSectionOpen] = useState<ReturnType<typeof summaryRows>[number]['key'] | null>(null);
  const summary = useMemo(() => trackingSummaryForRange(state, range, t, catalog), [state, range, t, catalog]);
  const speech = useReportSpeech(summary.text, language, previewOpen, () => toast.show(t('assist.speech_error'), 'error'));
  const highlights = useMemo(() => reviewHighlights(summary.filtered, t, catalog), [summary.filtered, t, catalog]);
  const rows = useMemo(() => summaryRows(summary.filtered, t, catalog), [summary.filtered, t, catalog]);
  const openEditor = () => { setDraft(summary.edited || summary.overview); setEditing(true); };
  const latestDate = highlights.latest ? new Date(highlights.latest.dateISO).toLocaleDateString(language, { month: 'short', day: 'numeric', ...(new Date(highlights.latest.dateISO).getFullYear() !== new Date().getFullYear() ? { year: 'numeric' } : {}) }) : '';
  const energy = highlights.latest?.wellbeing?.energy;
  const energyLabel = typeof energy === 'number' && Number.isFinite(energy) && energy >= 0 && energy <= 10 ? `${energy}/10` : t('light.not_recorded');
  const better = highlights.latest?.symptoms?.items?.filter(item => item.change === 'Slightly better' || item.change === 'Much better').length || 0;
  let periodLabel = summary.period.label;
  try {
    const from = new Date(summary.period.from), to = new Date(summary.period.to);
    const currentYear = new Date().getFullYear();
    const formatter = new Intl.DateTimeFormat(language, { month: 'short', day: 'numeric', ...(from.getFullYear() !== currentYear || to.getFullYear() !== currentYear ? { year: 'numeric' as const } : {}) });
    periodLabel = typeof formatter.formatRange === 'function' ? formatter.formatRange(from, to) : `${formatter.format(from)} – ${formatter.format(to)}`;
  } catch { /* Retain the full recorded period if localized formatting is unavailable. */ }
  const saveOverview = async (reset = false) => {
    if (!reset && !draft.trim()) return;
    setSaving(true);
    try {
      const outcome = await savePayload({ portal_state: {
        summaryOverview: { ...state.summaryOverview, [range]: reset ? '' : draft.trim() },
        summaryOverviewBasis: { ...state.summaryOverviewBasis, [range]: summaryBasis(state, range) },
      } });
      setEditing(false); toast.show(t('tracking.saved.' + outcome));
    } catch (error) { toast.show(error instanceof Error ? error.message : t('mobile.alert.try_again'), 'error'); }
    finally { setSaving(false); }
  };
  return <View style={{ gap: 16 }}>
    <View style={[styles.rangeRow, fontScale > 1.3 && { flexDirection: 'column', alignItems: 'flex-start' }]}><View style={{ flexShrink: 1 }}><FinePrint>{periodLabel}</FinePrint></View><ReviewRangeSelect compact value={range} onChange={setRange} /></View>
    <FinePrint>{[t(summary.filtered.checkins.length === 1 ? 'light.checkin_one' : 'light.checkin_many', { count: summary.filtered.checkins.length }), latestDate ? t('light.updated', { date: latestDate }) : ''].filter(Boolean).join(' · ')}</FinePrint>
    <View style={styles.tileGrid}>{rows.map(row => {
      const title = row.key === 'medications' ? t(row.count === 1 ? 'calm.medicine_one' : 'calm.medicine_many', { count: row.count }) : row.key === 'symptoms' ? t(highlights.symptoms.length === 1 ? 'setup.symptom_one' : 'calm.symptom_count', { count: highlights.symptoms.length }) : row.key === 'notes' ? t(row.count === 1 ? 'calm.note_one' : 'calm.note_many', { count: row.count }) : energyLabel;
      const detail = row.key === 'medications' ? highlights.medications[0]?.name || t('light.no_medications') : row.key === 'notes' ? t('calm.saved_observations') : row.key === 'symptoms' ? better ? t('dashboard.update.better', { count: better }) : t('calm.recorded_changes') : t('setup.latest_checkin');
      const tone = iconTone(rowIcons[row.key]);
      return <Pressable key={row.key} accessibilityRole="button" accessibilityLabel={`${row.label}. ${title}. ${detail}`} onPress={() => setSectionOpen(row.key)} style={({ pressed }) => [styles.tile, { width: fontScale > 1.3 ? '100%' : '48%' }, pressed && { opacity: .65 }]}>
        <View style={styles.tileTop}><View style={[refined.icon, { backgroundColor: tone.backgroundColor }]}><AppIcon name={rowIcons[row.key]} size={21} color={tone.color} /></View><AppIcon name="chevron" size={14} color={colors.textDim} /></View>
        {row.key === 'wellbeing' ? <Text style={styles.tileDetail}>{t('wellbeing.energy').replace(/\s*\([^)]*\)\s*$/, '')}</Text> : null}
        <Text style={styles.tileValue}>{title}</Text>
        {detail ? <Text style={[styles.tileDetail, row.key === 'symptoms' && better > 0 && styles.better]}>{detail}</Text> : null}
      </Pressable>;
    })}</View>
    <Button title={t('parity.preview_summary')} onPress={() => setPreviewOpen(true)} />
    <Button title={t('review.ai_explanation')} variant="ghost" onPress={() => setAiOpen(true)} />
    <EditorSheet visible={sectionOpen !== null} title={rows.find(row => row.key === sectionOpen)?.label || ''} onClose={() => setSectionOpen(null)}>
      {highlights.latest ? <FinePrint>{t('review.last_update', { date: fmtDate(highlights.latest.dateISO) })}</FinePrint> : null}
      {sectionOpen === 'medications' ? <>{highlights.medications.length ? highlights.medications.map(med => <Section key={med.id}>
      <Text style={refined.rowTitle}>{med.name}</Text>{med.details ? <FinePrint>{med.details}</FinePrint> : null}
      <Text style={refined.body}>{t('review.latest_status', { status: med.status })}</Text>{med.counts ? <FinePrint>{med.counts}</FinePrint> : null}
    </Section>) : <Text style={refined.body}>{t('meds.none_yet')}</Text>}</> : null}
      {sectionOpen === 'symptoms' ? <>{highlights.symptoms.length ? highlights.symptoms.map(symptom => <Section key={symptom.name}>
      <Text style={refined.rowTitle}>{symptom.name}</Text><Text style={refined.body}>{[symptom.status, symptom.rating].filter(Boolean).join(' · ')}</Text>
      {symptom.date ? <FinePrint>{symptom.comparison || fmtDate(symptom.date)}</FinePrint> : null}
    </Section>) : <Text style={refined.body}>{t('review.no_symptom_records')}</Text>}
      <Button title={t('review.view_progress')} compact variant="ghost" onPress={() => { setSectionOpen(null); go(6); }} /></> : null}
      {sectionOpen === 'wellbeing' ? <><FinePrint>{t('setup.checkin_ratings')}</FinePrint>{(['energy', 'mood', 'sleep', 'focus'] as const).map(key => {
        const value = highlights.latest?.wellbeing?.[key];
        return <View key={key} style={styles.wellbeingRow}><Text style={refined.rowTitle}>{t('wellbeing.' + key).replace(/\s*\([^)]*\)\s*$/, '')}</Text><Text style={refined.body}>{typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 10 ? `${value}/10` : t('light.not_recorded')}</Text></View>;
      })}<FinePrint>{t('calm.starting_ratings')}</FinePrint>{(['energy', 'mood', 'sleep', 'focus'] as const).map(key => {
        const value = state.wellbeingBaseline[key];
        return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 10 ? <View key={key} style={styles.wellbeingRow}><Text style={refined.rowTitle}>{t('wellbeing.' + key).replace(/\s*\([^)]*\)\s*$/, '')}</Text><Text style={refined.body}>{value}/10</Text></View> : null;
      })}<Button title={t('setup.view_starting')} variant="ghost" onPress={() => { setSectionOpen(null); go(3); }} /></> : null}
      {sectionOpen === 'notes' ? <>{highlights.notes.length ? highlights.notes.map((note, index) => <Section key={`${note.date}-${index}`}><FinePrint>{fmtDate(note.date)}</FinePrint><Text style={refined.body}>{note.text}</Text></Section>) : <Text style={refined.body}>{t('polish.no_notes')}</Text>}</> : null}
    </EditorSheet>
    <EditorSheet visible={aiOpen} title={t('review.ai_explanation')} onClose={() => setAiOpen(false)}><TrackingExplanation range={range} /></EditorSheet>
    <EditorSheet visible={readingHelp} title={t('assist.explain_terms')} onClose={() => setReadingHelp(false)}><SummaryReadingHelp /></EditorSheet>
    <EditorSheet visible={editing} title={t('polish.edit_text')} onClose={() => { if (!saving) setEditing(false); }} footer={<Button title={t('tracking.save_details')} loading={saving} disabled={!draft.trim()} onPress={() => { void saveOverview(); }} />}>
      <FinePrint>{t('polish.edit_help')}</FinePrint>
      {summary.stale ? <FinePrint>{t('polish.edited_stale')}</FinePrint> : null}
      <Input label={t('polish.summary_text')} value={draft} onChangeText={setDraft} multiline scrollEnabled style={{ height: 180, textAlignVertical: 'top' }} maxLength={2000} />
      <Button title={t('parity.use_generated')} disabled={saving} variant="ghost" onPress={() => { void saveOverview(true); }} />
    </EditorSheet>
    <SnapshotPreview visible={previewOpen} text={summary.text} title={t('calm.summary_title')} subtitle={`${periodLabel} · ${t(summary.filtered.checkins.length === 1 ? 'light.checkin_one' : 'light.checkin_many', { count: summary.filtered.checkins.length })}`} onClose={() => setPreviewOpen(false)} onShare={() => { void Share.share({ title: t('parity.record_title'), message: summary.text }).catch(() => toast.show(t('mobile.alert.try_again'), 'error')); }} actions={[
      { key: 'speech', title: t(speech.active ? 'assist.stop_reading' : 'assist.read_aloud'), icon: speech.active ? 'stop' : 'speaker', onPress: () => { void speech.start(); } },
      { key: 'terms', title: t('assist.explain_terms'), icon: 'file', onPress: () => { setPreviewOpen(false); setTimeout(() => setReadingHelp(true), 350); } },
      { key: 'edit', title: t('polish.edit_text'), icon: 'edit', onPress: () => { setPreviewOpen(false); setTimeout(openEditor, 350); } },
      { key: 'pdf', title: t('ai.pdf_create'), icon: 'download', loading: exporting, onPress: () => { if (exporting) return; setExporting(true); void downloadSummaryReport(summary.text, summary.period.label, t, language).then(ok => { if (!ok) toast.show(t('toast.report_failed'), 'error'); }).finally(() => setExporting(false)); } },
    ]} reading={speech.active ? { label: t(speech.preparing ? 'assist.preparing_voice' : 'assist.reading_summary'), stopLabel: t('assist.stop_reading'), onStop: speech.stop } : undefined}><SummaryPreviewContent key={`${range}:${previewOpen}`} fullText={summary.text} checkins={summary.filtered.checkins} /></SnapshotPreview>
  </View>;
};
const rowIcons: Record<string, AppIconName> = { medications: 'pill', symptoms: 'heart', wellbeing: 'sun', notes: 'file' };
const styles = StyleSheet.create({
  rangeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  tileGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 12 },
  tile: { minHeight: 150, padding: 18, borderRadius: 24, backgroundColor: colors.glass, borderWidth: 1, borderColor: colors.glassBorder, gap: 10 },
  tileTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 7 },
  tileValue: { fontSize: 20, lineHeight: 27, fontWeight: '500', letterSpacing: -.5, color: colors.text },
  tileDetail: { fontSize: 15, lineHeight: 22, color: colors.textMuted },
  better: { color: colors.success, backgroundColor: colors.successBg, borderRadius: 8, paddingVertical: 4, paddingHorizontal: 8, alignSelf: 'flex-start', maxWidth: '100%' },
  wellbeingRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8, paddingVertical: 10 },
});
