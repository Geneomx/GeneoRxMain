import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/Button';
import { ReportPickerModal } from '@/components/ReportPickerModal';
import { useToast } from '@/components/Toast';
import { useAuth } from '@/auth/AuthContext';
import { useWizard } from '@/store/WizardContext';
import { useMedCatalog, findMedName } from '@/store/MedCatalogContext';
import {
  computeContraindications,
  computeDrugInteractions,
  computeInsightEngine,
  computeMedicationSuccessPrediction,
  detectHealthPatterns,
  fmtDate,
  generateDynamicHealthStory,
  latestCheckin,
  safetyFlags,
  successLabel,
} from '@/wizard/engine';
import { shareClinicianSnapshot } from '@/wizard/reports';
import { useTranslation } from '@/hooks/useTranslation';
import { useDashboardNavigation } from '@/navigation/useDashboardNavigation';
import { FinePrint, InsightModal, KVItem, RevealAnimationModal, Section, Tagline } from '@/screens/wizard/ui';
import { colors, spacing } from '@/theme';

export const SummaryStep: React.FC = () => {
  const { state } = useWizard();
  const { catalog } = useMedCatalog();
  const { user } = useAuth();
  const { t, language } = useTranslation();
  const toast = useToast();
  const goToDashboard = useDashboardNavigation();
  const [reportPickerOpen, setReportPickerOpen] = useState(false);
  const [revealOpen, setRevealOpen] = useState(false);
  const [insightOpen, setInsightOpen] = useState(false);

  const data = useMemo(() => {
    const meds = state.meds.map((m) => findMedName(catalog, m.medId));
    return {
      meds,
      last: latestCheckin(state),
      flags: safetyFlags(state, t),
      insight: computeInsightEngine(state, t, catalog),
      success: computeMedicationSuccessPrediction(state, t),
      patterns: detectHealthPatterns(state, t),
      interactions: computeDrugInteractions(state, t),
      contraindications: computeContraindications(state, t),
      story: generateDynamicHealthStory(state, t, catalog),
    };
  }, [state, language, t, catalog]);

  async function handleShare() {
    const ok = await shareClinicianSnapshot(state, t, { catalog, title: t('progress.snapshot_btn') });
    if (ok) toast.show(t('toast.shared'));
  }

  const consentLabel = state.account.consent ? t('common.yes') : t('common.no');
  const accountLine = `${user?.email || state.account.email || t('common.guest')} • ${t('account.consent')}: ${consentLabel}`;

  return (
    <View style={{ gap: 16 }}>
      {/* Health Story — matches the website's narrative summary at the top of Summary */}
      <Section>
        <Tagline title={t('summary.health_story_title')} body={t('summary.health_story_sub')} />
        <FinePrint>{t('summary.health_story_lead')}</FinePrint>
        <Text style={styles.storyBody}>{data.story}</Text>
        <View style={{ gap: spacing.sm }}>
          <Button title={t('progress.snapshot_btn')} onPress={handleShare} />
          <Button title={t('results.insight_btn')} variant="secondary" onPress={() => setRevealOpen(true)} />
        </View>
      </Section>

      {/* Dashboard — same rows, same order as the website's GeneoRx Summary list */}
      <Section>
        <Tagline title={t('summary.dashboard_title')} body={t('summary.dashboard_sub')} />
        <KVItem k={t('summary.account_label')}>{accountLine}</KVItem>
        <KVItem k={t('sidebar.meds')}>{data.meds.length ? data.meds.join(', ') : t('sidebar.none_yet')}</KVItem>
        <KVItem k={t('step.2')}>{state.symptoms.selected.length ? state.symptoms.selected.join(', ') : t('sidebar.none_yet')}</KVItem>
        <KVItem k={t('summary.safety')}>{data.flags.length ? data.flags.join(', ') : t('summary.none_flagged')}</KVItem>
        <KVItem k={t('summary.success_prediction')}>
          {data.success.score}% · {successLabel(data.success.level, t)}{'\n'}{data.success.reason}
        </KVItem>
        <KVItem k={t('summary.pattern')}>
          {data.patterns.length ? `${data.patterns[0].title} — ${data.patterns[0].note}` : t('summary.no_pattern')}
        </KVItem>
        <KVItem k={t('summary.interactions_field')}>
          {data.interactions.length ? data.interactions.map((x) => x.title).join(', ') : t('results.interactions_none')}
        </KVItem>
        <KVItem k={t('summary.contraindications_field')}>
          {data.contraindications.length ? data.contraindications.map((x) => x.title).join(', ') : t('results.contraindications_none')}
        </KVItem>
        <KVItem k={t('summary.engine_insight')}>
          {data.insight.summary}{'\n'}{data.insight.meaning}
        </KVItem>
        <KVItem k={t('summary.doctor_questions')}>{data.insight.doctorPrompt}</KVItem>
        <KVItem k={t('sidebar.checkins')}>
          {data.last ? `${fmtDate(data.last.dateISO)} · ${t('sidebar.adherence')} ${data.last.adherencePct}%` : t('sidebar.no_checkins')}
        </KVItem>
        {state.checkins.length ? (
          <Button title={t('progress.download_report')} variant="secondary" onPress={() => setReportPickerOpen(true)} />
        ) : null}
      </Section>

      <Section>
        <Tagline title={t('mobile.wizard.complete_title')} body={t('mobile.wizard.complete_sub')} />
        <Button title={t('nav.home')} onPress={goToDashboard} />
      </Section>

      <RevealAnimationModal
        visible={revealOpen}
        onComplete={() => { setRevealOpen(false); setInsightOpen(true); }}
      />
      <InsightModal visible={insightOpen} onClose={() => setInsightOpen(false)} insight={data.insight} />

      <ReportPickerModal
        visible={reportPickerOpen}
        onClose={() => setReportPickerOpen(false)}
        onSuccess={goToDashboard}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  storyBody: {
    fontSize: 15,
    lineHeight: 23,
    color: colors.textSoft,
  },
});
