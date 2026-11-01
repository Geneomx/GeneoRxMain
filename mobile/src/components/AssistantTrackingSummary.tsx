import React, { useMemo, useState } from 'react';
import { Keyboard, Share, StyleSheet, Text, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Button } from './Button';
import { FormScrollView } from './FormScrollView';
import { Input } from './Input';
import { ReviewRangeSelect } from './ReviewRangeSelect';
import { useWizard } from '@/store/WizardContext';
import { useMedCatalog } from '@/store/MedCatalogContext';
import { useTranslation } from '@/hooks/useTranslation';
import { useToast } from './Toast';
import { summaryBasis, type ReviewRange } from '@/wizard/reviewData';
import { trackingRecordText, trackingSummaryForRange } from '@/wizard/trackingReport';
import { colors } from '@/theme';

/** An on-device record summary stays separate from chat messages and requests. */
export const AssistantTrackingSummary: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { state, savePayload } = useWizard();
  const { catalog } = useMedCatalog();
  const { t } = useTranslation();
  const toast = useToast();
  const [range, setRange] = useState<ReviewRange>('30');
  const [drafts, setDrafts] = useState<Partial<Record<ReviewRange, string>>>({});
  const [preview, setPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const summary = useMemo(() => trackingSummaryForRange(state, range, t, catalog), [state, range, t, catalog]);
  const draft = drafts[range] ?? summary.overview;
  const text = useMemo(() => trackingRecordText(summary.filtered, draft.trim(), summary.period.label, t, catalog), [summary.filtered, draft, range, t, catalog]);

  const save = async () => {
    if (!draft.trim() || saving) return;
    Keyboard.dismiss();
    setSaving(true);
    try {
      const outcome = await savePayload({ portal_state: { summaryOverview: { ...state.summaryOverview, [range]: draft.trim() }, summaryOverviewBasis: { ...state.summaryOverviewBasis, [range]: summaryBasis(state, range) } } });
      toast.show(t('tracking.saved.' + outcome));
    } catch (error) {
      toast.show(error instanceof Error ? error.message : t('mobile.alert.try_again'), 'error');
    } finally { setSaving(false); }
  };

  const share = async () => {
    try { await Share.share({ title: t('parity.record_title'), message: text }); }
    catch { toast.show(t('mobile.alert.try_again'), 'error'); }
  };

  return <View style={styles.wrap}>
    <FormScrollView key={preview ? 'preview' : 'edit'} style={styles.scroll} nestedScrollEnabled showsVerticalScrollIndicator={false} contentContainerStyle={styles.body}>
      <Button compact title={t(preview ? 'ai.summary_edit' : 'ai.summary_back')} variant="ghost" disabled={saving} onPress={() => { Keyboard.dismiss(); if (preview) setPreview(false); else onBack(); }} />
      <Text accessibilityRole="header" style={styles.title}>{t('ai.summary_title')}</Text>
      <Text style={styles.note}>{t('ai.summary_local_note')}</Text>
      {!preview ? <ReviewRangeSelect compact value={range} onChange={value => { Keyboard.dismiss(); setRange(value); }} /> : <Text style={styles.label}>{t('parity.range.' + range)}</Text>}
      {preview ? <Text style={styles.preview} selectable>{text}</Text> : <>
        <Text style={styles.note}>{t('ai.summary_period_note')}</Text>
        {/* Above the field: the overview can grow to many lines, and this must stay reachable without scrolling past it. */}
        <Button compact title={t('parity.use_generated')} variant="ghost" disabled={saving} onPress={() => setDrafts(previous => ({ ...previous, [range]: summary.generated }))} />
        <Input accessibilityLabel={t('parity.your_overview')} label={t('parity.your_overview')} value={draft} multiline maxLength={2000} editable={!saving} onChangeText={value => setDrafts(previous => ({ ...previous, [range]: value }))} style={{ minHeight: 150, textAlignVertical: 'top' }} />
      </>}
    </FormScrollView>
    <View style={styles.footer}>
      {preview ? <>
        <Button title={t('modal.snapshot.copy')} variant="secondary" onPress={() => { void Clipboard.setStringAsync(text).then(() => toast.show(t('toast.copied'))).catch(() => toast.show(t('mobile.alert.try_again'), 'error')); }} />
        <Button title={t('portal.share')} onPress={() => { void share(); }} />
      </> : <>
        <Button title={t('ai.summary_save')} variant="secondary" loading={saving} disabled={!draft.trim()} onPress={() => { void save(); }} />
        <Button title={t('parity.preview_summary')} disabled={saving || !draft.trim()} onPress={() => { Keyboard.dismiss(); setPreview(true); }} />
      </>}
    </View>
  </View>;
};

const styles = StyleSheet.create({
  // The host sheet gives this the space left under its heading; the body
  // takes what the footer leaves and scrolls, so the footer stays on screen.
  wrap: { flex: 1, minHeight: 0 },
  scroll: { flex: 1, minHeight: 0 },
  body: { paddingTop: 8, paddingBottom: 20, gap: 12 },
  title: { color: colors.text, fontSize: 19, lineHeight: 26, fontWeight: '500' },
  note: { color: colors.textMuted, fontSize: 16, lineHeight: 24 },
  label: { color: colors.primary, fontSize: 16, fontWeight: '500' },
  preview: { color: colors.textSoft, fontSize: 17, lineHeight: 23, paddingBottom: 20 },
  footer: { gap: 8, paddingTop: 10, borderTopColor: colors.borderSoft, borderTopWidth: StyleSheet.hairlineWidth },
});
