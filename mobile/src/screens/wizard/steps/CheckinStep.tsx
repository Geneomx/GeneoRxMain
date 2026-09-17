import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { track } from '@/api/analytics';
import { MONTHLY_CHECK_DAYS, daysSince, isoFromCalendarDate, todayISO } from '@/wizard/calendarDate';
import { Button } from '@/components/Button';
import { CheckinDetailModal } from '@/components/CheckinDetailModal';
import { Chip } from '@/components/Chip';
import { FeedbackModal } from '@/components/FeedbackModal';
import { Input } from '@/components/Input';
import { useToast } from '@/components/Toast';
import { useAuth } from '@/auth/AuthContext';
import { useWizard } from '@/store/WizardContext';
import { fmtDate, getSymptomUniverse, impactLabel, latestCheckin } from '@/wizard/engine';
import { useMedCatalog } from '@/store/MedCatalogContext';
import { dedupeCheckins } from '@/wizard/sync';
import { useTranslation } from '@/hooks/useTranslation';
import { LIFESTYLE_KEYS, type CheckinCompletion, type CheckinSymptomItem, type LifestyleKey, type Rating, type SymptomChange, type TriState, type Wellbeing } from '@/wizard/types';
import { Divider, FinePrint, HelpNote, OptionalScaleRow, ScaleRow, Section, Tagline, TriStateRow } from '@/screens/wizard/ui';
import { colors, radius, spacing } from '@/theme';

const CHANGE_VALUES: { value: SymptomChange; score: number }[] = [
  { value: 'Worse', score: -2 },
  { value: 'No change', score: 0 },
  { value: 'Slightly better', score: 1 },
  { value: 'Much better', score: 2 },
  { value: 'Not present', score: 0 },
];
const PROGRESS_STEP = 6;

type Props = {
  advanceToProgress?: boolean;
};

export const CheckinStep: React.FC<Props> = ({ advanceToProgress = false }) => {
  const { state, update, setStep, savePayload } = useWizard();
  const { catalog } = useMedCatalog();
  const { isGuest } = useAuth();
  const { t } = useTranslation();
  const toast = useToast();
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [detailIndex, setDetailIndex] = useState<number | null>(null);
  const [checkinDate, setCheckinDate] = useState(todayISO());
  const [dateError, setDateError] = useState<string | null>(null);
  // Mirror the website: prefill from the previous check-in when there is one
  // (script.blade.php renderCheckin -> defaultAdh / defaultWell / taken).
  // Supplements in particular must NOT default to "all taken" — that recorded
  // adherence the user never asserted and printed it in the doctor report.
  const last = latestCheckin(state);
  const [adherence, setAdherence] = useState(last ? last.adherencePct : 70);
  const [taken, setTaken] = useState<Set<string>>(
    new Set(last?.supplementsTaken?.length ? last.supplementsTaken : []),
  );
  const [changes, setChanges] = useState<Record<string, SymptomChange>>({});
  const [severities, setSeverities] = useState<Record<string, number>>({});
  const [wb, setWb] = useState<Wellbeing>(last ? last.wellbeing : state.wellbeingBaseline);
  // The three v3 body systems. They start unanswered EVERY week and are never
  // prefilled from `last` — prefilling would silently re-assert a number the
  // user did not look at, which is the severityNow bug at triple scale.
  const [digestive, setDigestive] = useState<Rating>(null);
  const [circulation, setCirculation] = useState<Rating>(null);
  const [immunity, setImmunity] = useState<Rating>(null);

  // Monthly treatment check — likewise never prefilled.
  const [labsDone, setLabsDone] = useState<TriState | null>(null);
  const [prescriberSeen, setPrescriberSeen] = useState<TriState | null>(null);
  const [lifestyle, setLifestyle] = useState<Partial<Record<LifestyleKey, TriState | null>>>({});

  const [sideEffects, setSideEffects] = useState('');
  const [notes, setNotes] = useState('');

  const allSupplements = state.plan.recommendedSupplements;

  // Like the website: when no symptoms are selected yet, rate the first 12
  // of the symptom universe so there is always something to log.
  // Exactly the website's two-stage cap: fall back to the first 12 of the
  // universe, then cap the rated list at 10 either way. Without the final
  // slice a mobile check-in rated more symptoms than the web for the same
  // input, so improvementScore (and the whole Progress chart) diverged.
  const symptomsToRate = (
    state.symptoms.selected.length
      ? state.symptoms.selected
      : getSymptomUniverse(state, catalog).slice(0, 12)
  ).slice(0, 10);

  // Ask the monthly block only when it is actually due: find the most recent
  // check-in that carries answers and re-prompt once it is 28 days old. A
  // check-in that was never asked does not reset the clock.
  const monthlyDue = (() => {
    const answered = [...state.checkins]
      .filter((c) => c.completion && (c.completion.labs !== null || c.completion.prescriber !== null))
      .sort((a, b) => a.dateISO.localeCompare(b.dateISO));
    const lastAnswered = answered[answered.length - 1];
    return !lastAnswered || daysSince(lastAnswered.dateISO) >= MONTHLY_CHECK_DAYS;
  })();

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
    // A shape-valid but impossible date ("2026-13-45") used to reach
    // new Date(...).toISOString() and throw RangeError, losing the check-in;
    // an invalid one ("2026-02-30") silently rolled over to another day.
    // Refuse both explicitly rather than storing a date the user did not pick.
    const dateISO = isoFromCalendarDate(checkinDate.trim() || todayISO());
    if (!dateISO) {
      setDateError(t('checkin.date_invalid'));
      return;
    }
    setDateError(null);

    const items: CheckinSymptomItem[] = symptomsToRate.map((symptom) => {
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
        // The three new ratings ride inside `wellbeing` deliberately: the web
        // dedupe key hashes that object, so a sibling field would be invisible
        // to it and two same-day check-ins differing only in these would
        // silently collapse into one.
        wellbeing: { ...wb, digestive, circulation, immunity },
        // Snapshot the plan as it stood this week; the live plan may change.
        supplementsPlanned: [...allSupplements],
        ...(monthlyDue
          ? {
              completion: {
                labs: labsDone,
                labsDateISO: labsDone === 'yes' ? dateISO : null,
                prescriber: prescriberSeen,
                prescriberDateISO: prescriberSeen === 'yes' ? dateISO : null,
                lifestyle,
              } satisfies CheckinCompletion,
            }
          : {}),
        sideEffects: sideEffects.split(',').map((x) => x.trim()).filter(Boolean),
        notes,
      });
      d.checkins = dedupeCheckins(d.checkins);
    });
    track('checkin_saved', {
      index: state.checkins.length + 1,
      adherencePct: adherence,
      symptoms: items.length,
    });
    toast.show(t(isGuest ? 'toast.checkin_guest' : 'toast.checkin_saved'));
    setSideEffects('');
    setNotes('');
    setDigestive(null);
    setCirculation(null);
    setImmunity(null);
    setLabsDone(null);
    setPrescriberSeen(null);
    setLifestyle({});
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
          // Capture the server id (carried on the check-in at runtime) so the
          // deletion is sent explicitly — a merge save alone would leave the
          // row on the server.
          const removed = state.checkins[state.checkins.length - 1] as { id?: string | number } | undefined;
          const removedId = removed?.id;
          update((d) => {
            d.checkins.pop();
          });
          if (removedId != null) {
            void savePayload({ deleted_checkins: [removedId] }).catch(() => undefined);
          }
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
          onChangeText={(v) => {
            setCheckinDate(v);
            if (dateError) setDateError(null);
          }}
          placeholder="YYYY-MM-DD"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="numbers-and-punctuation"
          maxLength={10}
          error={dateError ?? undefined}
        />

        <Input
          label={t('checkin.adherence')}
          value={String(adherence)}
          onChangeText={(txt) => {
            const digits = txt.replace(/[^0-9]/g, '');
            setAdherence(digits === '' ? 0 : Math.min(100, parseInt(digits, 10)));
          }}
          keyboardType="number-pad"
          maxLength={3}
        />

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

      {symptomsToRate.length ? (
        <Section>
          <Tagline title={t('checkin.symptom_improvement')} body={t('checkin.symptom_improvement_sub')} />
          {symptomsToRate.map((sym) => (
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

        <Divider />
        <Tagline title={t('checkin.systems_title')} body={t('checkin.systems_sub')} />
        <OptionalScaleRow
          label={t('wellbeing.digestive')}
          value={digestive}
          onChange={setDigestive}
          notAnsweredLabel={t('checkin.not_answered')}
        />
        <OptionalScaleRow
          label={t('wellbeing.circulation')}
          value={circulation}
          onChange={setCirculation}
          notAnsweredLabel={t('checkin.not_answered')}
        />
        <OptionalScaleRow
          label={t('wellbeing.immunity')}
          value={immunity}
          onChange={setImmunity}
          notAnsweredLabel={t('checkin.not_answered')}
        />
        <FinePrint>{t('checkin.systems_note')}</FinePrint>
      </Section>

      {monthlyDue ? (
        <Section>
          <Tagline title={t('checkin.monthly_title')} body={t('checkin.monthly_sub')} />
          <TriStateRow
            label={t('checkin.labs_q')}
            value={labsDone}
            onChange={setLabsDone}
            labels={{ yes: t('common.yes'), no: t('common.no'), unsure: t('checkin.unsure') }}
          />
          <TriStateRow
            label={t('checkin.prescriber_q')}
            value={prescriberSeen}
            onChange={setPrescriberSeen}
            labels={{ yes: t('common.yes'), no: t('common.no'), unsure: t('checkin.unsure') }}
          />
          <Divider />
          {LIFESTYLE_KEYS.map((key) => (
            <TriStateRow
              key={key}
              label={t(`checkin.lifestyle.${key}`)}
              value={lifestyle[key] ?? null}
              onChange={(v) => setLifestyle((prev) => ({ ...prev, [key]: v }))}
              labels={{ yes: t('common.yes'), no: t('common.no'), unsure: t('checkin.unsure') }}
            />
          ))}
          <FinePrint>{t('checkin.monthly_note')}</FinePrint>
        </Section>
      ) : null}

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
