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
  computeNutrientScores,
  computeWeeklyCoachMessage,
  computeWeeklyHealthScore,
  fmtDate,
  impactLabel,
  latestCheckin,
} from '@/wizard/engine';
import { shareClinicianSnapshot, downloadDoctorReport } from '@/wizard/reports';
import { buildTrendSeries } from '@/wizard/trends';
import { TrendChart, type TrendLine } from '@/components/TrendChart';
import { ScoreRing } from '@/components/ScoreRing';
import { useTranslation } from '@/hooks/useTranslation';
import { useDashboardNavigation } from '@/navigation/useDashboardNavigation';
import { Divider, FinePrint, HelpNote, NoteBox, Section, Tagline } from '@/screens/wizard/ui';
import { colors, radius, spacing } from '@/theme';

const SYMPTOM_COLORS = ['#22d3ee', '#f472b6', '#fbbf24', '#a78bfa', '#34d399', '#fb923c'];

export const ProgressStep: React.FC = () => {
  const { state } = useWizard();
  const { catalog } = useMedCatalog();
  const { t, language } = useTranslation();
  const toast = useToast();
  const goToDashboard = useDashboardNavigation();
  const [snapOpen, setSnapOpen] = useState(false);
  const [reportPickerOpen, setReportPickerOpen] = useState(false);
  const [reportIndex, setReportIndex] = useState<number | undefined>();

  const coach = useMemo(() => computeWeeklyCoachMessage(state, t, catalog), [state, language, t, catalog]);
  const last = useMemo(() => latestCheckin(state), [state]);
  const weekly = useMemo(() => computeWeeklyHealthScore(state), [state]);
  const trends = useMemo(() => buildTrendSeries(state.checkins), [state.checkins]);
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

  const symptomItems = last ? last.symptoms.items || [] : [];
  const mostImproved = symptomItems.length
    ? symptomItems.reduce((acc, x) => ((x.changeScore || 0) > (acc.changeScore || 0) ? x : acc))
    : null;
  const leastImproved = symptomItems.length
    ? symptomItems.reduce((acc, x) => ((x.changeScore || 0) < (acc.changeScore || 0) ? x : acc))
    : null;
  const nutrientScores = useMemo(() => computeNutrientScores(state, catalog), [state, catalog]);
  const topDriver = nutrientScores.length ? `${nutrientScores[0][0]} (${nutrientScores[0][1]}%)` : null;

  const shareSnapshot = async () => {
    const ok = await shareClinicianSnapshot(state, t, { catalog, title: t('portal.share') });
    if (ok) toast.show(t('toast.shared'));
  };

  const copySnapshot = async () => {
    try {
      await Clipboard.setStringAsync(snapshot);
      toast.show(t('toast.copied'));
    } catch {
      // clipboard unavailable — nothing to surface
    }
  };

  const downloadReport = async (idx: number) => {
    const ok = await downloadDoctorReport(state, t, idx, catalog, language);
    if (ok) {
      toast.show(t('toast.report_downloaded'));
      goToDashboard();
    } else {
      toast.show(t('toast.report_failed'), 'error');
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

      {/* Weekly Health Score — sits directly above the trend charts it
          summarises, rather than in a separate place from its own evidence. */}
      <Section>
        <Tagline title={t('insights.this_week')} body={t('insights.weekly_basis')} />
        <View style={styles.weeklyRow}>
          <ScoreRing value={weekly.score} size={78} stroke={8} gradient />
          <View style={styles.weeklyBody}>
            {weekly.delta !== null ? (
              <Text style={[styles.weeklyDelta, weekly.delta >= 0 ? styles.weeklyUp : styles.weeklyDown]}>
                {weekly.delta >= 0 ? '▲' : '▼'} {Math.abs(weekly.delta)} {t('insights.vs_last_week')}
              </Text>
            ) : (
              <Text style={styles.weeklyMuted}>{t('insights.no_comparison')}</Text>
            )}
            {weekly.drivers.map((d) => (
              <Text key={d.key} style={styles.weeklyDriver}>
                {t(`wellbeing.${d.key}`)} {d.delta > 0 ? '+' : ''}{d.delta}
              </Text>
            ))}
          </View>
        </View>
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
          {mostImproved ? (
            <View style={styles.rowBetween}>
              <Text style={styles.metaLabel}>{t('progress.most_improved')}</Text>
              <Text style={styles.changeVal}>
                {mostImproved.symptom} ({impactLabel(mostImproved.change, t)})
              </Text>
            </View>
          ) : null}
          {leastImproved ? (
            <View style={styles.rowBetween}>
              <Text style={styles.metaLabel}>{t('progress.least_improved')}</Text>
              <Text style={styles.changeVal}>
                {leastImproved.symptom} ({impactLabel(leastImproved.change, t)})
              </Text>
            </View>
          ) : null}
          {topDriver ? (
            <View style={styles.rowBetween}>
              <Text style={styles.metaLabel}>{t('progress.top_driver')}</Text>
              <Text style={styles.changeVal}>{topDriver}</Text>
            </View>
          ) : null}
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

      {trends.window && trends.points.length ? (
        <Section>
          <Tagline title={t('progress.trends_title')} body={t('progress.trends_sub')} />
          <Text style={styles.chartLabel}>{t('progress.trends_wellbeing')}</Text>
          <TrendChart
            fromT={trends.window.fromT}
            toT={trends.window.toT}
            yMax={10}
            yCaption="0-10"
            lines={[
              { label: t('wellbeing.energy').replace(/\s*\([^)]*\)\s*$/, ''), color: colors.amber, points: trends.points.map((p) => [p.t, p.energy] as [number, number]) },
              { label: t('wellbeing.mood').replace(/\s*\([^)]*\)\s*$/, ''), color: colors.pink, points: trends.points.map((p) => [p.t, p.mood] as [number, number]) },
              { label: t('wellbeing.sleep').replace(/\s*\([^)]*\)\s*$/, ''), color: colors.primary, points: trends.points.map((p) => [p.t, p.sleep] as [number, number]) },
              { label: t('wellbeing.focus').replace(/\s*\([^)]*\)\s*$/, ''), color: colors.violet, points: trends.points.map((p) => [p.t, p.focus] as [number, number]) },
            ]}
          />
          <Text style={styles.chartLabel}>{t('checkin.adherence')}</Text>
          <TrendChart
            fromT={trends.window.fromT}
            toT={trends.window.toT}
            yMax={100}
            yCaption="0-100%"
            lines={[
              { label: t('checkin.adherence'), color: colors.success, points: trends.points.map((p) => [p.t, p.adherence] as [number, number]) },
            ]}
          />
          {Object.keys(trends.symptoms).length ? (
            <>
              <Text style={styles.chartLabel}>{t('progress.trends_symptoms')}</Text>
              <TrendChart
                fromT={trends.window.fromT}
                toT={trends.window.toT}
                yMax={10}
                yCaption="0-10"
                lines={Object.entries(trends.symptoms).slice(0, 6).map(([name, series], i): TrendLine => ({
                  label: name,
                  color: SYMPTOM_COLORS[i % SYMPTOM_COLORS.length],
                  points: series.map((pt) => [pt.t, pt.severity] as [number, number]),
                }))}
              />
              <FinePrint>{t('progress.trends_symptoms_hint')}</FinePrint>
            </>
          ) : null}
        </Section>
      ) : null}

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
        <Button title={t('nav.home')} variant="ghost" onPress={goToDashboard} />
      </Section>
    </View>
  );
};

const styles = StyleSheet.create({
  signal: { backgroundColor: colors.primary50, borderColor: colors.primary100 },
  kicker: { fontSize: 11, fontWeight: '800', color: colors.primary, letterSpacing: 1 },
  head: { fontSize: 17, fontWeight: '700', color: colors.text },
  bullet: { fontSize: 13, color: colors.textSoft, lineHeight: 19 },

  weeklyRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  weeklyBody: { flex: 1, gap: 3 },
  weeklyDelta: { fontSize: 15, fontWeight: '800' },
  weeklyUp: { color: colors.success },
  weeklyDown: { color: colors.danger },
  weeklyMuted: { fontSize: 14, fontWeight: '700', color: colors.textMuted },
  weeklyDriver: { fontSize: 12, color: colors.textMuted },
  deltaGrid: { flexDirection: 'row', gap: spacing.sm },
  deltaCell: { flex: 1, backgroundColor: colors.surfaceAlt, borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center', gap: 2 },
  deltaLabel: { fontSize: 11, color: colors.textMuted, textTransform: 'capitalize' },
  deltaVal: { fontSize: 20, fontWeight: '800' },

  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4, gap: 12 },
  metaLabel: { fontSize: 14, color: colors.textSoft },
  metaVal: { fontSize: 15, fontWeight: '700', color: colors.text },
  changeVal: { fontSize: 14, fontWeight: '700', color: colors.text, flexShrink: 1, textAlign: 'right' },

  chartLabel: { fontSize: 13, fontWeight: '700', color: colors.textMuted, marginTop: 10, marginBottom: 2 },
  timelineItem: { gap: 2, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.borderSoft },
  tlTitle: { fontSize: 14, fontWeight: '700', color: colors.text },
  tlBody: { fontSize: 13, color: colors.textSoft },

  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15,31,27,0.45)' },
  modalWrap: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', padding: spacing.lg },
  modal: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, gap: 12, maxHeight: '82%' },
  snapText: { fontSize: 12, color: colors.textSoft, fontFamily: undefined, lineHeight: 18 },
});
