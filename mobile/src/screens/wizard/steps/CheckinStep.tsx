import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/Button';
import { CheckinDetailModal } from '@/components/CheckinDetailModal';
import { Chip } from '@/components/Chip';
import { FeedbackModal } from '@/components/FeedbackModal';
import { Input } from '@/components/Input';
import { useToast } from '@/components/Toast';
import { useAuth } from '@/auth/AuthContext';
import { useWizard } from '@/store/WizardContext';
import { fmtDate, impactLabel } from '@/wizard/engine';
import { dedupeCheckins } from '@/wizard/sync';
import { useTranslation } from '@/hooks/useTranslation';
import type { CheckinSymptomItem, SymptomChange, Wellbeing } from '@/wizard/types';
import { Divider, FinePrint, HelpNote, ScaleRow, Section, Tagline } from '@/screens/wizard/ui';
import { colors, radius, spacing } from '@/theme';

const CHANGE_VALUES: { value: SymptomChange; score: number }[] = [
  { value: 'Worse', score: -2 },
  { value: 'No change', score: 0 },
  { value: 'Slightly better', score: 1 },
  { value: 'Much better', score: 2 },
  { value: 'Not present', score: 0 },
];
const ADHERENCE_STEPS = [40, 50, 60, 70, 80, 90, 100];
const PROGRESS_STEP = 6;

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

type Props = {
  advanceToProgress?: boolean;
};

export const CheckinStep: React.FC<Props> = ({ advanceToProgress = false }) => {
  const { state, update, setStep } = useWizard();
  const { isGuest } = useAuth();
  const { t } = useTranslation();
  const toast = useToast();
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [detailIndex, setDetailIndex] = useState<number | null>(null);
  const [checkinDate, setCheckinDate] = useState(todayISO());
  const [adherence, setAdherence] = useState(80);
  const [taken, setTaken] = useState<Set<string>>(new Set(state.plan.recommendedSupplements));
  const [changes, setChanges] = useState<Record<string, SymptomChange>>({});
  const [severities, setSeverities] = useState<Record<string, number>>({});
  const [wb, setWb] = useState<Wellbeing>(state.wellbeingBaseline);
  const [sideEffects, setSideEffects] = useState('');
  const [notes, setNotes] = useState('');

  const allSupplements = state.plan.recommendedSupplements;

  const toggleTaken = (s: string) =>
    setTaken((prev) => {
      const n = new Set(prev);
      if (n.has(s)) n.delete(s);
      else n.add(s);
      return n;
    });

  const selectAllSupplements = () => setTaken(new Set(allSupplements));
  const clearSupplements = () => setTaken(new Set());

  const save = () => {
    const dateStr = checkinDate.trim() || todayISO();
    const dateISO = /^\d{4}-\d{2}-\d{2}$/.test(dateStr)
      ? new Date(`${dateStr}T12:00:00`).toISOString()
      : new Date().toISOString();

    const items: CheckinSymptomItem[] = state.symptoms.selected.map((symptom) => {
      const change = changes[symptom] ?? 'No change';
      const score = CHANGE_VALUES.find((o) => o.value === change)?.score ?? 0;
      const severityNow = severities[symptom] ?? 5;
      return { symptom, change, changeScore: score, severityNow };
    });
    const improvementScore = items.reduce((acc, x) => acc + (x.changeScore || 0), 0);

    update((d) => {
      d.checkins.push({
        dateISO,
        adherencePct: adherence,
        supplementsTaken: [...taken],
        symptoms: { items, improvementScore },
        wellbeing: wb,
        sideEffects,
        notes,
      });
      d.checkins = dedupeCheckins(d.checkins);
    });
    toast.show(t(isGuest ? 'toast.checkin_guest' : 'toast.checkin_saved'));
    setSideEffects('');
    setNotes('');
    setChanges({});
    setSeverities({});
    if (advanceToProgress) setStep(PROGRESS_STEP);
    setFeedbackOpen(true);
  };

  const deleteLast = () => {
    if (!state.checkins.length) return;
    Alert.alert(t('checkin.delete_last'), t('checkin.no_delete_alert'), [
      { text: t('common.no'), style: 'cancel' },
      {
        text: t('checkin.delete_last'),
        style: 'destructive',
        onPress: () => {
          update((d) => {
            d.checkins.pop();
          });
          toast.show(t('toast.deleted'));
        },
      },
    ]);
  };

  const detailCheckin = detailIndex != null ? state.checkins[state.checkins.length - 1 - detailIndex] : null;

  return (
    <View style={{ gap: spacing.md }}>
      <HelpNote what={t('checkin.sub')} why={t('checkin.wellbeing_sub')} />
      <Section>
        <Tagline title={t('checkin.weekly_title')} body={t('checkin.sub')} />

        <Input
          label={t('checkin.date')}
          value={checkinDate}
          onChangeText={setCheckinDate}
          placeholder="YYYY-MM-DD"
          autoCapitalize="none"
        />

        <Text style={styles.label}>{t('checkin.adherence')}: {adherence}%</Text>
        <View style={styles.chips}>
          {ADHERENCE_STEPS.map((a) => (
            <Chip key={a} label={`${a}%`} selected={adherence === a} onPress={() => setAdherence(a)} />
          ))}
        </View>

        {allSupplements.length ? (
          <>
            <View style={styles.supHead}>
              <Text style={styles.label}>{t('checkin.supplements_title')}</Text>
              <View style={styles.supActions}>
                <Pressable onPress={selectAllSupplements}>
                  <Text style={styles.supAction}>{t('checkin.select_all')}</Text>
                </Pressable>
                <Text style={styles.supSep}>·</Text>
                <Pressable onPress={clearSupplements}>
                  <Text style={styles.supAction}>{t('checkin.clear')}</Text>
                </Pressable>
              </View>
            </View>
            <View style={styles.chips}>
              {allSupplements.map((s) => (
                <Chip key={s} label={s} selected={taken.has(s)} onPress={() => toggleTaken(s)} />
              ))}
            </View>
          </>
        ) : (
          <FinePrint>{t('checkin.supplements_none')}</FinePrint>
        )}

        <FinePrint>{t(isGuest ? 'checkin.storage_guest' : 'checkin.storage_account')}</FinePrint>
      </Section>

      {state.symptoms.selected.length ? (
        <Section>
          <Tagline title={t('checkin.symptom_improvement')} body={t('checkin.symptom_improvement_sub')} />
          {state.symptoms.selected.map((sym) => (
            <View key={sym} style={styles.symRow}>
              <Text style={styles.symName}>{sym}</Text>
              <View style={styles.changeWrap}>
                {CHANGE_VALUES.map((o) => {
                  const active = (changes[sym] ?? 'No change') === o.value;
                  return (
                    <Pressable
                      key={o.value}
                      onPress={() => setChanges((p) => ({ ...p, [sym]: o.value }))}
                      style={[styles.changeChip, active && styles.changeChipActive]}
                    >
                      <Text style={[styles.changeText, active && styles.changeTextActive]}>
                        {impactLabel(o.value, t)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              <ScaleRow
                label={t('checkin.severity_now')}
                value={severities[sym] ?? 5}
                onChange={(v) => setSeverities((p) => ({ ...p, [sym]: v }))}
              />
            </View>
          ))}
        </Section>
      ) : null}

      <Section>
        <Tagline title={t('checkin.wellbeing_title')} body={t('checkin.wellbeing_sub')} />
        <ScaleRow label={t('wellbeing.energy')} value={wb.energy} onChange={(v) => setWb((p) => ({ ...p, energy: v }))} />
        <ScaleRow label={t('wellbeing.mood')} value={wb.mood} onChange={(v) => setWb((p) => ({ ...p, mood: v }))} />
        <ScaleRow label={t('wellbeing.sleep')} value={wb.sleep} onChange={(v) => setWb((p) => ({ ...p, sleep: v }))} />
        <ScaleRow label={t('wellbeing.focus')} value={wb.focus} onChange={(v) => setWb((p) => ({ ...p, focus: v }))} />
      </Section>

      <Section>
        <Input label={t('checkin.side_effects')} placeholder={t('checkin.side_effects_placeholder')} value={sideEffects} onChangeText={setSideEffects} multiline />
        <Input label={t('checkin.notes')} placeholder={t('checkin.notes_placeholder')} value={notes} onChangeText={setNotes} multiline />
        <Button title={t('checkin.save')} onPress={save} />
      </Section>

      {state.checkins.length ? (
        <Section>
          <Tagline title={t('checkin.saved_title', { count: state.checkins.length })} />
          {state.checkins
            .slice()
            .reverse()
            .map((c, i) => (
              <Pressable key={i} onPress={() => setDetailIndex(i)}>
                <Text style={styles.savedRow}>{fmtDate(c.dateISO)} • {t('common.adherence')} {c.adherencePct}%</Text>
                {i < state.checkins.length - 1 ? <Divider /> : null}
              </Pressable>
            ))}
          <Button title={t('checkin.delete_last')} variant="danger" onPress={deleteLast} />
        </Section>
      ) : null}

      <FeedbackModal visible={feedbackOpen} onClose={() => setFeedbackOpen(false)} />
      <CheckinDetailModal
        visible={detailIndex != null}
        checkin={detailCheckin}
        index={detailIndex != null ? state.checkins.length - 1 - detailIndex : 0}
        onClose={() => setDetailIndex(null)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  label: { fontSize: 13, fontWeight: '700', color: colors.text },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  supHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 },
  supActions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  supAction: { fontSize: 12, fontWeight: '700', color: colors.primary },
  supSep: { fontSize: 12, color: colors.textDim },
  symRow: { gap: 6, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: colors.borderSoft },
  symName: { fontSize: 14, fontWeight: '700', color: colors.text },
  changeWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  changeChip: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, paddingHorizontal: 11, paddingVertical: 6, backgroundColor: colors.surface },
  changeChipActive: {
    backgroundColor: 'rgba(40, 225, 255, 0.18)',
    borderColor: 'rgba(40, 225, 255, 0.45)',
  },
  changeText: { fontSize: 12, fontWeight: '600', color: colors.textMuted },
  changeTextActive: { color: colors.text, fontWeight: '900' },
  savedRow: { fontSize: 13, color: colors.textSoft, paddingVertical: 6 },
});
