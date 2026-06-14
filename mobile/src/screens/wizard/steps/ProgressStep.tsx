import React, { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Button } from '@/components/Button';
import { ReportPickerModal } from '@/components/ReportPickerModal';
import { useToast } from '@/components/Toast';
import { useWizard } from '@/store/WizardContext';
import { useMedCatalog } from '@/store/MedCatalogContext';
import {
  buildClinicianSnapshotText,
  computeWeeklyCoachMessage,
  fmtDate,
  latestCheckin,
} from '@/wizard/engine';
import { shareClinicianSnapshot, downloadDoctorReport } from '@/wizard/reports';
import { useTranslation } from '@/hooks/useTranslation';
import { useDashboardNavigation } from '@/navigation/useDashboardNavigation';
import { Divider, FinePrint, HelpNote, NoteBox, Section, Tagline } from '@/screens/wizard/ui';
import { colors, radius, spacing } from '@/theme';

export const ProgressStep: React.FC = () => {
  const { state } = useWizard();
  const { catalog } = useMedCatalog();
  const { t, language } = useTranslation();
  const toast = useToast();
  const goToDashboard = useDashboardNavigation();
  const [snapOpen, setSnapOpen] = useState(false);
  const [reportPickerOpen, setReportPickerOpen] = useState(false);
  const [reportIndex, setReportIndex] = useState<number | undefined>();

  const coach = useMemo(() => computeWeeklyCoachMessage(state, t), [state, language, t]);
  const last = useMemo(() => latestCheckin(state), [state]);
  const snapshot = useMemo(() => buildClinicianSnapshotText(state, t, undefined, catalog), [state, language, t, catalog]);

  const base = state.wellbeingBaseline;
  const deltas = last
    ? {
        energy: last.wellbeing.energy - base.energy,
        mood: last.wellbeing.mood - base.mood,
        sleep: last.wellbeing.sleep - base.sleep,
        focus: last.wellbeing.focus - base.focus,
      }
    : null;

  const improvementScore = last
    ? (last.symptoms.items || []).reduce((acc, x) => acc + (x.changeScore || 0), 0)
    : 0;

  const shareSnapshot = async () => {
    const ok = await shareClinicianSnapshot(state, t, { catalog, title: t('portal.share') });
    if (ok) toast.show(t('toast.shared'));
  };

  const copySnapshot = async () => {
    await Clipboard.setStringAsync(snapshot);
    toast.show(t('toast.copied'));
  };

  const downloadReport = async (idx: number) => {
    const ok = await downloadDoctorReport(state, t, idx, catalog);
    if (ok) {
      toast.show(t('toast.report_downloaded'));
      goToDashboard();
    }
  };

  return (
    <View style={{ gap: spacing.md }}>
      <HelpNote what={t('step.6.sub')} why={t('checkin.sub')} />
      <Section style={styles.signal}>
        <Text style={styles.kicker}>{t('results.coach_title').toUpperCase()}</Text>
        <Text style={styles.head}>{coach.headline}</Text>
        {coach.bullets.map((b, i) => (
          <Text key={i} style={styles.bullet}>• {b}</Text>
        ))}
        <NoteBox>{t('results.next_best_action')} {coach.nextBestAction}</NoteBox>
      </Section>

      {deltas ? (
        <Section>
          <Tagline title={t('progress.what_changed')} />
          <View style={styles.deltaGrid}>
            {(['energy', 'mood', 'sleep', 'focus'] as const).map((k) => {
              const v = deltas[k];
              const color = v > 0 ? colors.success : v < 0 ? colors.danger : colors.textMuted;
              return (
                <View key={k} style={styles.deltaCell}>
                  <Text style={styles.deltaLabel}>{t(`wellbeing.${k}`).replace(/\s*\([^)]*\)\s*$/, '')}</Text>
                  <Text style={[styles.deltaVal, { color }]}>{v >= 0 ? `+${v}` : v}</Text>
                </View>
              );
            })}
          </View>
          <Divider />
          <View style={styles.rowBetween}>
            <Text style={styles.metaLabel}>{t('progress.symptom_score')}</Text>
            <Text style={styles.metaVal}>{improvementScore >= 0 ? `+${improvementScore}` : improvementScore}</Text>
          </View>
          <FinePrint>{t('progress.symptom_score_sub')}</FinePrint>
          <View style={styles.rowBetween}>
            <Text style={styles.metaLabel}>{t('checkin.adherence')}</Text>
            <Text style={styles.metaVal}>{last?.adherencePct}%</Text>
          </View>
        </Section>
      ) : (
        <Section>
          <Tagline title={t('sidebar.no_checkins')} body={t('checkin.sub')} />
        </Section>
      )}

      <Section>
        <Tagline title={t('modal.snapshot.title')} body={t('progress.weekly_sub')} />
        <Button title={t('progress.snapshot_btn')} onPress={() => setSnapOpen(true)} />
        <Button title={t('portal.share')} variant="secondary" onPress={shareSnapshot} />
        {state.checkins.length ? (
          <Button
            title={t('progress.download_report')}
            variant="secondary"
            onPress={() => {
              setReportIndex(undefined);
              setReportPickerOpen(true);
            }}
          />
        ) : null}
      </Section>

      {state.checkins.length ? (
        <Section>
          <Tagline title={t('progress.timeline_title')} body={t('progress.timeline_sub')} />
          {state.checkins.map((c, idx) => (
            <View key={idx} style={styles.timelineItem}>
              <Text style={styles.tlTitle}>{t('checkin.label_n')} {idx + 1} • {fmtDate(c.dateISO)}</Text>
              <Text style={styles.tlBody}>{t('common.adherence')} {c.adherencePct}%</Text>
              {c.symptoms.items.length ? (
                <FinePrint>{t('progress.tracked_symptoms')} {c.symptoms.items.map((x) => x.symptom).join(', ')}</FinePrint>
              ) : null}
              <Button
                title={t('progress.download_report')}
                variant="secondary"
                onPress={() => downloadReport(idx)}
              />
            </View>
          ))}
        </Section>
      ) : null}

      <Modal visible={snapOpen} transparent animationType="fade" onRequestClose={() => setSnapOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setSnapOpen(false)} />
        <View style={styles.modalWrap} pointerEvents="box-none">
          <View style={styles.modal}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.snapText}>{snapshot}</Text>
            </ScrollView>
            <View style={{ gap: 8 }}>
              <Button title={t('modal.snapshot.copy')} onPress={copySnapshot} />
              <Button title={t('modal.snapshot.close')} variant="secondary" onPress={() => setSnapOpen(false)} />
            </View>
          </View>
        </View>
      </Modal>

      <ReportPickerModal
        visible={reportPickerOpen}
        preferredIndex={reportIndex}
        onClose={() => setReportPickerOpen(false)}
        onSuccess={goToDashboard}
      />

      <Section>
        <Button title={t('nav.dashboard')} variant="ghost" onPress={goToDashboard} />
      </Section>
    </View>
  );
};

const styles = StyleSheet.create({
  signal: { backgroundColor: colors.primary50, borderColor: colors.primary100 },
  kicker: { fontSize: 11, fontWeight: '800', color: colors.primary, letterSpacing: 1 },
  head: { fontSize: 17, fontWeight: '700', color: colors.text },
  bullet: { fontSize: 13, color: colors.textSoft, lineHeight: 19 },

  deltaGrid: { flexDirection: 'row', gap: spacing.sm },
  deltaCell: { flex: 1, backgroundColor: colors.surfaceAlt, borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center', gap: 2 },
  deltaLabel: { fontSize: 11, color: colors.textMuted, textTransform: 'capitalize' },
  deltaVal: { fontSize: 20, fontWeight: '800' },

  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  metaLabel: { fontSize: 14, color: colors.textSoft },
  metaVal: { fontSize: 15, fontWeight: '700', color: colors.text },

  timelineItem: { gap: 2, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.borderSoft },
  tlTitle: { fontSize: 14, fontWeight: '700', color: colors.text },
  tlBody: { fontSize: 13, color: colors.textSoft },

  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15,31,27,0.45)' },
  modalWrap: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', padding: spacing.lg },
  modal: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, gap: 12, maxHeight: '82%' },
  snapText: { fontSize: 12, color: colors.textSoft, fontFamily: undefined, lineHeight: 18 },
});
