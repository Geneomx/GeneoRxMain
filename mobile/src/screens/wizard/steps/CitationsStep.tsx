import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useWizard } from '@/store/WizardContext';
import { buildCitationsRegistry, evidenceCoverage } from '@/wizard/engine';
import { CiteChip, Divider, FinePrint, HelpNote, Section, Tagline } from '@/screens/wizard/ui';
import { colors, spacing } from '@/theme';

export const CitationsStep: React.FC = () => {
  const { state } = useWizard();
  const reg = useMemo(() => buildCitationsRegistry(state), [state]);
  const cov = useMemo(() => evidenceCoverage(state), [state]);

  return (
    <View style={{ gap: spacing.md }}>
      <HelpNote
        what="Every research source used in your session, grouped by ID type. Tap any ID to open the study on PubMed."
        why="GeneoRx shows its sources so you — and your doctor — can check the evidence yourselves."
      >
        <Text style={styles.note}>PMID and PMCID are just ID numbers for studies in the public PubMed library.</Text>
      </HelpNote>
      <Section>
      <Tagline title="Citations registry" body="Every source referenced in your session. Tap a PMID/PMCID to open it on PubMed." />
      <FinePrint>Coverage: {cov.evidenceCount}/{cov.selectedCount} medications with attached evidence.</FinePrint>
      <Divider />

      <Text style={styles.group}>PMID ({reg.pmid.length})</Text>
      {reg.pmid.length ? (
        <View style={styles.chips}>{reg.pmid.map((t) => <CiteChip key={t} token={t} />)}</View>
      ) : (
        <FinePrint>None yet.</FinePrint>
      )}

      <Divider />

      <Text style={styles.group}>PMCID ({reg.pmcid.length})</Text>
      {reg.pmcid.length ? (
        <View style={styles.chips}>{reg.pmcid.map((t) => <CiteChip key={t} token={t} />)}</View>
      ) : (
        <FinePrint>None yet.</FinePrint>
      )}
      </Section>
    </View>
  );
};

const styles = StyleSheet.create({
  group: { fontSize: 12, fontWeight: '800', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.4 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  note: { fontSize: 12.5, color: colors.primaryDark, opacity: 0.9, lineHeight: 18 },
});
