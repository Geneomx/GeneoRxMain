import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/Button';
import { ReportPickerModal } from '@/components/ReportPickerModal';
import { useToast } from '@/components/Toast';
import { fetchAiSummary } from '@/api/summary';
import { useWizard } from '@/store/WizardContext';
import { useMedCatalog, findMedName } from '@/store/MedCatalogContext';
import {
  computeDrugInteractions,
  computeInsightEngine,
  computeMedicationSuccessPrediction,
  detectHealthPatterns,
  fmtDate,
  latestCheckin,
  safetyFlags,
  successLabel,
} from '@/wizard/engine';
import { shareClinicianSnapshot } from '@/wizard/reports';
import { useTranslation } from '@/hooks/useTranslation';
import { useDashboardNavigation } from '@/navigation/useDashboardNavigation';
import { Accordion, FinePrint, KVItem, Section, Tagline } from '@/screens/wizard/ui';
import { colors, spacing } from '@/theme';

export const SummaryStep: React.FC = () => {
  const { state } = useWizard();
  const { catalog } = useMedCatalog();
  const { t, language } = useTranslation();
  const toast = useToast();
  const goToDashboard = useDashboardNavigation();
  const [reportPickerOpen, setReportPickerOpen] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [aiSource, setAiSource] = useState<'ai' | 'fallback' | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const data = useMemo(() => {
    const meds = state.meds.map((m) => findMedName(catalog, m.medId));
    return {
      meds,
      last: latestCheckin(state),
      flags: safetyFlags(state, t),
      insight: computeInsightEngine(state, t),
      success: computeMedicationSuccessPrediction(state, t),
      patterns: detectHealthPatterns(state, t),
      interactions: computeDrugInteractions(state, t),
    };
  }, [state, language, t, catalog]);

  const loadAiSummary = useCallback(async () => {
    setAiLoading(true);
    try {
      const res = await fetchAiSummary({
        medications: data.meds,
        symptoms: state.symptoms.selected,
        summary: data.insight.summary,
        meaning: data.insight.meaning,
        doctor_prompt: data.insight.doctorPrompt,
        language,
      });
      if (res.summary) {
        setAiSummary(res.summary);
        setAiSource(res.source);
      } else {
        setAiSummary(null);
        setAiSource(null);
        toast.show(t('summary.ai_unavailable'));
      }
    } catch {
      setAiSummary(null);
      setAiSource(null);
      toast.show(t('summary.ai_unavailable'));
    } finally {
      setAiLoading(false);
    }
  }, [data, state.symptoms.selected, language, t, toast]);

  async function handleShare() {
    const ok = await shareClinicianSnapshot(state, t, { catalog, title: t('summary.share_btn') });
    if (ok) toast.show(t('toast.shared'));
  }

  return (
    <View style={{ gap: 16 }}>
      <Section>
        <Tagline
          title={t('summary.panel_title')}
          body={`${state.profile.age || '—'} · ${state.profile.gender || '—'}`}
        />
        <KVItem k={t('sidebar.meds')}>{data.meds.length ? data.meds.join(', ') : t('sidebar.none_yet')}</KVItem>
        <KVItem k={t('step.2')}>{state.symptoms.selected.length ? state.symptoms.selected.join(', ') : t('sidebar.none_yet')}</KVItem>
        <KVItem k={t('sidebar.plan')}>
          {state.plan.started
            ? `${t('pill.started')} ${fmtDate(state.plan.startDate)}${state.plan.recommendedSupplements.length ? ` · ${state.plan.recommendedSupplements.join(', ')}` : ''}`
            : t('sidebar.not_started')}
        </KVItem>
        <KVItem k={t('sidebar.checkins')}>
          {data.last ? `${fmtDate(data.last.dateISO)} · ${t('sidebar.adherence')} ${data.last.adherencePct}%` : t('sidebar.no_checkins')}
        </KVItem>
        {data.flags.length ? <KVItem k={t('summary.safety')}>{data.flags.join(', ')}</KVItem> : null}
        <Button title={t('summary.share_btn')} onPress={handleShare} />
        {state.checkins.length ? (
          <Button title={t('progress.download_report')} variant="secondary" onPress={() => setReportPickerOpen(true)} />
        ) : null}
      </Section>

      <Section>
        <Tagline title={t('summary.ai_title')} body={t('summary.ai_sub')} />
        <Button
          title={aiSummary ? t('summary.ai_regenerate') : t('summary.ai_btn')}
          variant="secondary"
          onPress={loadAiSummary}
          loading={aiLoading}
          disabled={aiLoading}
        />
        {aiLoading ? (
          <View style={styles.aiLoading}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.aiLoadingText}>{t('summary.ai_loading')}</Text>
          </View>
        ) : aiSummary ? (
          <View style={{ gap: spacing.sm }}>
            {aiSource === 'ai' ? (
              <View style={styles.aiBadge}>
                <Text style={styles.aiBadgeText}>{t('summary.ai_badge')}</Text>
              </View>
            ) : null}
            <Text style={styles.aiBody}>{aiSummary}</Text>
            <FinePrint>{t('summary.ai_disclaimer')}</FinePrint>
          </View>
        ) : (
          <FinePrint>{t('summary.ai_hint')}</FinePrint>
        )}
      </Section>

      <Accordion title={t('step.4')} subtitle={t('step.4.sub')}>
        <KVItem k={t('summary.success_prediction')}>
          {data.success.score}% · {successLabel(data.success.level, t)}{'\n'}{data.success.reason}
        </KVItem>
        <KVItem k={t('summary.pattern')}>
          {data.patterns.length ? `${data.patterns[0].title} — ${data.patterns[0].note}` : t('summary.no_pattern')}
        </KVItem>
        <KVItem k={t('summary.interactions_field')}>
          {data.interactions.length ? data.interactions.map((x) => x.title).join(', ') : t('summary.none_flagged')}
        </KVItem>
        <KVItem k={t('summary.engine_insight')}>
          {data.insight.summary}{'\n'}{data.insight.meaning}
        </KVItem>
        <KVItem k={t('summary.doctor_questions')}>{data.insight.doctorPrompt}</KVItem>
      </Accordion>

      <Section>
        <Tagline title={t('mobile.wizard.complete_title')} body={t('mobile.wizard.complete_sub')} />
        <Button title={t('nav.dashboard')} onPress={goToDashboard} />
      </Section>

      <ReportPickerModal
        visible={reportPickerOpen}
        onClose={() => setReportPickerOpen(false)}
        onSuccess={goToDashboard}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  aiLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  aiLoadingText: {
    fontSize: 14,
    color: colors.textMuted,
  },
  aiBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primary50,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  aiBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 0.3,
  },
  aiBody: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.text,
  },
});
