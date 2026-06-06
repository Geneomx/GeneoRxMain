import React, { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/Button';
import { useWizard } from '@/store/WizardContext';
import {
  buildClinicianSnapshotText,
  computeWeeklyCoachMessage,
  fmtDate,
  latestCheckin,
} from '@/wizard/engine';
import { Divider, FinePrint, HelpNote, NoteBox, Section, Tagline } from '@/screens/wizard/ui';
import { colors, radius, spacing } from '@/theme';

export const ProgressStep: React.FC = () => {
  const { state } = useWizard();
  const [snapOpen, setSnapOpen] = useState(false);

  const coach = useMemo(() => computeWeeklyCoachMessage(state), [state]);
  const last = useMemo(() => latestCheckin(state), [state]);
  const snapshot = useMemo(() => buildClinicianSnapshotText(state), [state]);

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
    try {
      await Share.share({ message: snapshot, title: 'GeneoRx Doctor Visit Snapshot' });
    } catch {
      // user cancelled
    }
  };

  return (
    <View style={{ gap: spacing.md }}>
      <HelpNote
        what="See your weekly signal, what's changed since your baseline, and grab a short summary you can show your doctor."
        why="This needs at least one check-in. The more weeks you log, the clearer the picture becomes."
      />
      <Section style={styles.signal}>
        <Text style={styles.kicker}>WEEKLY HEALTH SIGNAL</Text>
        <Text style={styles.head}>{coach.headline}</Text>
        {coach.bullets.map((b, i) => (
          <Text key={i} style={styles.bullet}>• {b}</Text>
        ))}
        <NoteBox>Next best action: {coach.nextBestAction}</NoteBox>
      </Section>

      {deltas ? (
        <Section>
          <Tagline title="What changed since baseline" />
          <View style={styles.deltaGrid}>
            {(['energy', 'mood', 'sleep', 'focus'] as const).map((k) => {
              const v = deltas[k];
              const color = v > 0 ? colors.success : v < 0 ? colors.danger : colors.textMuted;
              return (
                <View key={k} style={styles.deltaCell}>
                  <Text style={styles.deltaLabel}>{k}</Text>
                  <Text style={[styles.deltaVal, { color }]}>{v >= 0 ? `+${v}` : v}</Text>
                </View>
              );
            })}
          </View>
          <Divider />
          <View style={styles.rowBetween}>
            <Text style={styles.metaLabel}>Improvement score</Text>
            <Text style={styles.metaVal}>{improvementScore >= 0 ? `+${improvementScore}` : improvementScore}</Text>
          </View>
          <FinePrint>Improvement score adds up how much your symptoms changed — higher (more positive) is better.</FinePrint>
          <View style={styles.rowBetween}>
            <Text style={styles.metaLabel}>Latest adherence</Text>
            <Text style={styles.metaVal}>{last?.adherencePct}%</Text>
          </View>
        </Section>
      ) : (
        <Section>
          <Tagline title="No check-ins yet" body="Log a check-in to unlock your progress signal and clinician snapshot." />
        </Section>
      )}

      <Section>
        <Tagline title="Doctor visit snapshot" body="A 30-second summary you can share with your clinician." />
        <Button title="View snapshot" onPress={() => setSnapOpen(true)} />
        <Button title="Share snapshot" variant="secondary" onPress={shareSnapshot} />
      </Section>

      {state.checkins.length ? (
        <Section>
          <Tagline title="Symptom timeline" body="See how your check-ins build a story over time." />
          {state.checkins.map((c, idx) => (
            <View key={idx} style={styles.timelineItem}>
              <Text style={styles.tlTitle}>Check-in {idx + 1} • {fmtDate(c.dateISO)}</Text>
              <Text style={styles.tlBody}>Adherence {c.adherencePct}%</Text>
              {c.symptoms.items.length ? (
                <FinePrint>Tracked: {c.symptoms.items.map((x) => x.symptom).join(', ')}</FinePrint>
              ) : null}
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
              <Button title="Share" onPress={shareSnapshot} />
              <Button title="Close" variant="secondary" onPress={() => setSnapOpen(false)} />
            </View>
          </View>
        </View>
      </Modal>
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
