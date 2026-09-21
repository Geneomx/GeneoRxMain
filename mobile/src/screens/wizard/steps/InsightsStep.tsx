import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
import { MeterRow } from '@/components/MeterRow';
import { ScoreRing } from '@/components/ScoreRing';
import { useMedCatalog } from '@/store/MedCatalogContext';
import { useWizard } from '@/store/WizardContext';
import { useTranslation } from '@/hooks/useTranslation';
import {
  buildLabRecommendations,
  computeBodySystemsView,
  computeMedicationCompletion,
  computeNutrientScores,
  computeWeeklyHealthScore,
  detectHealthPatterns,
  tierLabel,
  type Tier,
} from '@/wizard/engine';
import { Accordion, Divider, FinePrint, Section, Tagline, TierPill } from '@/screens/wizard/ui';
import { colors, radius, spacing } from '@/theme';

const RESULTS_STEP = 4;
const CHECKIN_STEP = 5;

function toneForTier(tier: Tier): 'good' | 'warn' | 'bad' {
  return tier === 'High' ? 'bad' : tier === 'Moderate' ? 'warn' : 'good';
}

/**
 * Step 7 — the Insights hub.
 *
 * Reclaimed from the dead `SkippedStep` slot, so it needs no renumbering: it
 * sits after Progress and before the terminal Summary, which is exactly where
 * an analytics hub belongs.
 *
 * Section order is the parity contract with the web portal's renderInsights():
 * §1 at a glance, §2 depletion risk, §3 timeline, §4 body systems,
 * §5 patterns, §6 labs, then the footer actions.
 */
export const InsightsStep: React.FC = () => {
  const { state, setStep, setFocusTarget } = useWizard();
  const { catalog } = useMedCatalog();
  const { t } = useTranslation();

  const scores = useMemo(() => computeNutrientScores(state, catalog), [state, catalog]);
  const weekly = useMemo(() => computeWeeklyHealthScore(state), [state]);
  const completion = useMemo(() => computeMedicationCompletion(state), [state]);
  const systems = useMemo(() => computeBodySystemsView(state), [state]);
  const patterns = useMemo(() => detectHealthPatterns(state, t), [state, t]);
  const labs = useMemo(() => buildLabRecommendations(state, catalog), [state, catalog]);

  const top = scores[0];
  const hasCheckins = state.checkins.length > 0;

  return (
    <View style={{ gap: spacing.md }}>
      <Tagline title={t('insights.title')} body={t('insights.sub')} />

      {/* -------- §1 at a glance -------- */}
      <Section style={styles.hero}>
        <View style={styles.heroRow}>
          <ScoreRing value={weekly.score} label={t('insights.this_week')} size={88} stroke={8} gradient />
          <View style={styles.heroBody}>
            {weekly.delta !== null ? (
              <Text style={[styles.delta, weekly.delta >= 0 ? styles.up : styles.down]}>
                {weekly.delta >= 0 ? '▲' : '▼'} {Math.abs(weekly.delta)} {t('insights.vs_last_week')}
              </Text>
            ) : (
              <Text style={styles.deltaMuted}>{t('insights.no_comparison')}</Text>
            )}
            <FinePrint>{t('insights.weekly_basis')}</FinePrint>
          </View>
        </View>

        {/* These three are NOT on the same scale: completion and the depletion
            score are 0-100, systems.average is a 0-10 mean. Without the unit,
            "64 86 6.2" in identical tiles reads as a collapse in body systems
            when 6.2 of 10 is the healthiest of the three. Same defect that was
            fixed on Home. */}
        <View style={styles.tiles}>
          <View style={styles.tile}>
            <View style={styles.tileValRow}>
              <Text style={styles.tileVal}>{completion.score ?? '—'}</Text>
              {completion.score !== null ? (
                <Text style={styles.tileUnit}>{t('insights.of_100')}</Text>
              ) : null}
            </View>
            <Text style={styles.tileLab}>{t('insights.completion')}</Text>
            <Text style={styles.tileMeta}>
              {t('insights.answered_of', { answered: completion.answered, total: completion.total })}
            </Text>
          </View>
          <View style={styles.tile}>
            <View style={styles.tileValRow}>
              <Text style={styles.tileVal}>{top ? top[1] : '—'}</Text>
              {top ? <Text style={styles.tileUnit}>{t('insights.of_100')}</Text> : null}
            </View>
            <Text style={styles.tileLab}>{t('insights.top_risk')}</Text>
            <Text style={styles.tileMeta} numberOfLines={1}>{top ? top[0] : t('insights.none_yet')}</Text>
          </View>
          <View style={styles.tile}>
            <View style={styles.tileValRow}>
              <Text style={styles.tileVal}>{systems.average ?? '—'}</Text>
              {systems.average !== null ? (
                <Text style={styles.tileUnit}>{t('insights.of_10')}</Text>
              ) : null}
            </View>
            <Text style={styles.tileLab}>{t('insights.systems')}</Text>
            <Text style={styles.tileMeta}>
              {t('insights.answered_of', { answered: systems.answered, total: systems.total })}
            </Text>
          </View>
        </View>
      </Section>

      {/* -------- §2 depletion risk -------- */}
      <Section>
        <Text style={styles.h}>{t('insights.depletion_title')}</Text>
        {scores.length ? (
          <>
            {scores.slice(0, 6).map(([nutrient, score]) => (
              <MeterRow
                key={nutrient}
                label={nutrient}
                value={score}
                max={100}
                display={String(score)}
                tone={toneForTier(score >= 70 ? 'High' : score >= 45 ? 'Moderate' : 'Low')}
              />
            ))}
            <Divider />
            <Button
              title={t('insights.open_evidence')}
              variant="secondary"
              compact
              onPress={() => {
                if (top) setFocusTarget({ kind: 'nutrient', value: top[0] });
                setStep(RESULTS_STEP);
              }}
            />
          </>
        ) : (
          <FinePrint>{t('insights.depletion_empty')}</FinePrint>
        )}
        <FinePrint>{t('insights.depletion_note')}</FinePrint>
      </Section>

      {/* -------- §3 timeline -------- */}
      <Accordion title={t('insights.timeline_title')} subtitle={t('insights.timeline_sub')}>
        {state.meds.length ? (
          <View style={{ gap: spacing.sm }}>
            {state.meds.slice(0, 3).map((m) => {
              const months = Math.max(0, m.durationMonths || 0);
              return (
                <View key={m.medId} style={styles.tlRow}>
                  <Text style={styles.tlName}>{m.medId}</Text>
                  <MeterRow
                    label={t('insights.months', { count: months })}
                    value={months}
                    max={24}
                    display={`${months}m`}
                  />
                </View>
              );
            })}
            <FinePrint>{t('insights.timeline_note')}</FinePrint>
          </View>
        ) : (
          <FinePrint>{t('insights.timeline_empty')}</FinePrint>
        )}
      </Accordion>

      {/* -------- §4 body systems -------- */}
      <Accordion
        title={t('insights.systems_title')}
        subtitle={t('insights.answered_of', { answered: systems.answered, total: systems.total })}
        // Badge takes string | number, so the unit rides along with the value.
        // A bare 6.2 beside a section called "Body systems" reads as a failure.
        badge={systems.average !== null ? `${systems.average}${t('insights.of_10')}` : '—'}
      >
        <View style={{ gap: 2 }}>
          {systems.rows.map((row) => (
            <MeterRow key={row.key} label={t(`wellbeing.${row.key}`)} value={row.value} max={10} />
          ))}
        </View>
        <Divider />
        <FinePrint>{t('insights.systems_note')}</FinePrint>
        {systems.answered < systems.total ? (
          <Button
            title={t('insights.rate_missing')}
            variant="secondary"
            compact
            onPress={() => setStep(CHECKIN_STEP)}
          />
        ) : null}
      </Accordion>

      {/* -------- §5 patterns -------- */}
      <Accordion
        title={t('insights.patterns_title')}
        subtitle={t('insights.patterns_sub')}
        badge={patterns.length}
      >
        {patterns.length ? (
          <View style={{ gap: spacing.sm }}>
            {patterns.map((p, i) => (
              <View key={`${p.title}-${i}`} style={styles.pattern}>
                <View style={styles.patternHead}>
                  <Text style={styles.patternTitle}>{p.title}</Text>
                  <TierPill tier={p.confidence === 'High' ? 'High' : 'Moderate'} />
                </View>
                <Text style={styles.patternNote}>{p.note}</Text>
              </View>
            ))}
          </View>
        ) : (
          <FinePrint>{t('insights.patterns_empty')}</FinePrint>
        )}
        <FinePrint>{t('insights.patterns_note')}</FinePrint>
      </Accordion>

      {/* -------- §6 labs -------- */}
      <Accordion title={t('insights.labs_title')} subtitle={t('insights.labs_sub')} badge={labs.length}>
        {labs.length ? (
          <View style={{ gap: spacing.sm }}>
            {labs.map((rec) => (
              <View key={rec.nutrient} style={styles.labRow}>
                <View style={styles.patternHead}>
                  <Text style={styles.patternTitle}>{rec.nutrient}</Text>
                  <TierPill tier={rec.tier} />
                </View>
                {rec.noRoutineLab ? (
                  <Text style={styles.patternNote}>{t('insights.labs_none')}</Text>
                ) : (
                  <View style={styles.chips}>
                    {rec.labs.map((l) => (
                      <Chip key={l} label={l} />
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>
        ) : (
          <FinePrint>{t('insights.labs_empty')}</FinePrint>
        )}
        <FinePrint>{t('insights.labs_note')}</FinePrint>
      </Accordion>

      {/* -------- footer -------- */}
      <View style={styles.footer}>
        <Button
          title={t('insights.open_progress')}
          variant="secondary"
          onPress={() => setStep(6)}
          disabled={!hasCheckins}
        />
        {/* No Ask button here any more: the floating bubble is present on every
            screen, so a second entry point that navigated away was misleading. */}
      </View>
      <FinePrint>{t('summary.ai_disclaimer')}</FinePrint>
    </View>
  );
};

const styles = StyleSheet.create({
  hero: { borderColor: 'rgba(40, 225, 255, 0.28)' },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  heroBody: { flex: 1, gap: 4 },
  delta: { fontSize: 14, fontWeight: '800' },
  up: { color: colors.success },
  down: { color: colors.danger },
  deltaMuted: { fontSize: 14, fontWeight: '700', color: colors.textMuted },

  tiles: { flexDirection: 'row', gap: spacing.sm },
  tile: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: radius.md,
    padding: 10,
    gap: 2,
    backgroundColor: 'rgba(7, 10, 18, 0.35)',
  },
  tileValRow: { flexDirection: 'row', alignItems: 'baseline', gap: 2 },
  tileVal: { fontSize: 20, fontWeight: '800', color: colors.text, letterSpacing: -0.5 },
  tileUnit: { fontSize: 11, color: colors.textMuted, fontWeight: '600' },
  tileLab: { fontSize: 11, color: colors.textSoft },
  tileMeta: { fontSize: 10, color: colors.textDim },

  h: { fontSize: 16, fontWeight: '700', color: colors.text, letterSpacing: -0.3 },

  tlRow: { gap: 2 },
  tlName: { fontSize: 13, fontWeight: '700', color: colors.text },

  pattern: { gap: 4 },
  patternHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  patternTitle: { flex: 1, fontSize: 14, fontWeight: '700', color: colors.text },
  patternNote: { fontSize: 13, color: colors.textMuted, lineHeight: 18 },

  labRow: { gap: 6 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },

  footer: { gap: spacing.sm },
});
