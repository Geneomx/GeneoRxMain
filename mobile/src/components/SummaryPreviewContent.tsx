import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText as Text } from './AppText';
import { AppIcon, type AppIconName } from './AppIcon';
import { useTranslation } from '@/hooks/useTranslation';
import { fmtDate } from '@/wizard/engine';
import type { WizardCheckin } from '@/wizard/types';
import { colors } from '@/theme';

/** Keep every report paragraph visible; headings give the long text a clear rhythm. */
export const SummaryPreviewContent: React.FC<{ fullText: string; checkins: WizardCheckin[]; hideStory?: boolean }> = ({ fullText, checkins, hideStory }) => {
  const { t } = useTranslation();
  const headings = new Map<string, AppIconName>([[t('report.health_story_title'), 'spark'], [t('report.summary_heading'), 'file'], [t('review.current_medications'), 'pill'], [t('review.current_symptoms'), 'heart'], [t('summary.safety_flags_line'), 'plan'], [t('summary.detected_pattern'), 'spark'], [t('report.nutrient_information'), 'sun'], [t('summary.drug_interactions'), 'plan'], [t('summary.contraindications'), 'plan'], [t('report.recorded_protocol'), 'pill'], [t('report.lab_topics'), 'file'], [t('summary.insight_summary'), 'spark'], [t('parity.recent_checkins'), 'calendar']]);
  const dates = new Set(checkins.map(c => fmtDate(c.dateISO)));
  const sections: Array<{ title: string; icon?: AppIconName; kind: 'story' | 'section' | 'date' | 'note'; lines: string[] }> = [];
  // Title and selected period are already in the sheet header.
  for (const line of fullText.split('\n').slice(2)) {
    if (headings.has(line)) sections.push({ title: line, icon: headings.get(line), kind: line === t('report.health_story_title') ? 'story' : 'section', lines: [] });
    else if (dates.has(line)) sections.push({ title: line, icon: 'calendar', kind: 'date', lines: [] });
    else if (line === t('parity.record_note')) sections.push({ title: '', kind: 'note', lines: [line] });
    else if (sections.length) sections[sections.length - 1].lines.push(line);
    else if (line.trim()) sections.push({ title: '', kind: 'section', lines: [line] });
  }
  const shown = hideStory ? sections.filter(section => section.kind !== 'story') : sections;
  return <View style={s.document}>{shown.map((section, index) => <View key={index} style={[s.section, section.kind === 'story' && s.story, section.kind === 'date' && s.dated]}>
    {section.title ? <View style={s.heading}>{section.icon ? <AppIcon name={section.icon} size={20} /> : null}<Text accessibilityRole="header" style={[s.sectionTitle, section.kind === 'story' && s.storyTitle, section.kind === 'date' && s.dateTitle]}>{section.title}</Text></View> : null}
    {section.lines.join('\n').trim() ? <Text selectable style={[s.body, section.kind === 'note' && s.note]}>{section.lines.join('\n').trim()}</Text> : null}
  </View>)}</View>;
};
const s = StyleSheet.create({
  document: { gap: 26 }, section: { gap: 12 }, story: { padding: 18, borderRadius: 22, backgroundColor: colors.surfaceAlt, gap: 16 },
  heading: { flexDirection: 'row', alignItems: 'center', gap: 9 }, sectionTitle: { flex: 1, fontSize: 18, lineHeight: 27, fontWeight: '600', color: colors.text },
  storyTitle: { fontSize: 20, lineHeight: 29, color: colors.primaryDark }, body: { color: colors.textSoft, fontSize: 17, lineHeight: 27 },
  dated: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.borderSoft, paddingTop: 20 }, dateTitle: { fontSize: 17, color: colors.primary },
  note: { fontSize: 15, lineHeight: 24, color: colors.textMuted },
});
