import React, { useState } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { AppText as Text } from './AppText';
import { AppIcon, type AppIconName } from './AppIcon';
import { CheckinDetailModal } from './CheckinDetailModal';
import { useTranslation } from '@/hooks/useTranslation';
import { fmtDate } from '@/wizard/engine';
import type { LatestUpdate, UpdateStatusEntry } from '@/wizard/latestUpdate';
import { dashboardPalette as palette } from '@/theme/dashboard';
import { shadow } from '@/theme';

export const LatestUpdateCard: React.FC<{ update: LatestUpdate; loading: boolean; onCheckin: () => void }> = ({ update, loading, onCheckin }) => {
  const { t, language } = useTranslation();
  const { width, fontScale } = useWindowDimensions();
  const [detailsOpen, setDetailsOpen] = useState(false);
  const { checkin } = update;
  const stacked = fontScale > 1.3 || width < 340;
  const lines = stacked ? undefined : 2;
  const date = checkin ? new Date(checkin.dateISO) : null;
  const dateLabel = date?.toLocaleDateString(language, { month: 'short', day: 'numeric', ...(date.getFullYear() !== new Date().getFullYear() ? { year: 'numeric' } : {}) });
  const entries = (items: UpdateStatusEntry[], icon: AppIconName, category: string) => <View style={styles.entries}>
    {items.length ? items.slice(0, 2).map((entry, index) => {
      const tone = statusTones[entry.tone];
      const severity = entry.severity === undefined ? '' : t('dashboard.update.severity', { value: entry.severity });
      return <View key={index} style={styles.entry} accessible accessibilityLabel={[category, entry.name, entry.status, severity].filter(Boolean).join('. ')}>
        <AppIcon name={icon} size={17} color={palette.accent} />
        <View style={[styles.entryContent, stacked && styles.entryContentStacked]}>
          <View style={[styles.entryNameCopy, stacked && styles.entryNameCopyStacked]}><Text style={styles.entryName} numberOfLines={lines}>{entry.name}</Text></View>
          <View style={[styles.status, stacked && styles.statusStacked]}>{icon === 'pill' && entry.tone === 'positive' ? <AppIcon name="check" size={15} color={tone.foreground} /> : null}<Text style={[styles.statusText, { color: tone.foreground }]}>{entry.status}</Text></View>
        </View>
      </View>;
    }) : <View style={styles.entry} accessible accessibilityLabel={`${category}. ${t('dashboard.update.not_recorded')}`}>
      <AppIcon name={icon} size={17} color={palette.accent} /><Text style={[styles.detail, { flex: 1 }]}>{category}</Text><Text style={styles.more}>{t('light.not_recorded')}</Text>
    </View>}
    {items.length > 2 ? <Text style={styles.more}>{t('dashboard.more_count', { count: items.length - 2 })}</Text> : null}
  </View>;

  const heading = <><Text accessibilityRole="header" style={[styles.title, !stacked && { flex: 1 }]}>{t('dashboard.update.title')}</Text><View style={styles.dateAction}>{checkin ? <Text style={styles.date}>{dateLabel}</Text> : null}{checkin && !loading ? <AppIcon name="chevron" size={15} color={palette.accent} /> : null}</View></>;
  return <View style={styles.card}>
    {checkin && !loading ? <Pressable accessibilityRole="button" accessibilityLabel={`${t('dashboard.update.details')}. ${fmtDate(checkin.dateISO)}`} onPress={() => setDetailsOpen(true)} style={({ pressed }) => [styles.heading, stacked && styles.headingStacked, pressed && styles.pressed]}>{heading}</Pressable> : <View style={styles.heading}>{heading}</View>}
    {loading ? <Text style={styles.detail}>{t('tracking.save.loading')}</Text> : checkin ? <>
      <View style={styles.record}>
        {entries(update.medicationEntries, 'pill', t('step.1'))}
        <View style={styles.groupDivider} />
        {entries(update.symptomEntries, 'heart', t('step.2'))}
      </View>
      <View style={styles.progress} accessibilityLabel={t('dashboard.update.progress_line', { progress: update.progress })}>
        {update.progressItems.length ? update.progressItems.map(item => <View key={item.kind} style={[styles.progressPill, { backgroundColor: progressTones[item.kind].background }]}><Text style={[styles.progressText, { color: progressTones[item.kind].foreground }]}>{item.text}</Text></View>) : <><AppIcon name="chart" size={16} color={palette.accent} /><Text style={styles.progressText}>{update.progress}</Text></>}
        {update.notes ? <View style={styles.noteFlag}><AppIcon name="file" size={15} color={palette.muted} /><Text style={styles.more}>{t('light.notes_added')}</Text></View> : null}
      </View>
      <CheckinDetailModal visible={detailsOpen} checkin={checkin} index={update.index} onClose={() => setDetailsOpen(false)} />
    </> : <>
      <Text style={styles.detail}>{t('dashboard.update.empty')}</Text>
      <Pressable accessibilityRole="button" onPress={onCheckin} style={({ pressed }) => [styles.link, pressed && styles.pressed]}>
        <Text style={styles.linkText}>{t('dashboard.update.first_checkin')}</Text><AppIcon name="chevron" size={14} color={palette.accent} />
      </Pressable>
    </>}
  </View>;
};

const statusTones = {
  positive: { foreground: '#3B6C50' },
  negative: { foreground: '#923E34' },
  neutral: { foreground: palette.muted },
  warning: { foreground: '#8D5D22' },
};
const progressTones = {
  better: { foreground: '#3B6C50', background: '#EAF3EE' },
  worse: { foreground: '#923E34', background: '#FBEFEB' },
  unchanged: { foreground: palette.muted, background: '#EDF1F8' },
  absent: { foreground: palette.muted, background: '#EDF1F8' },
};

const styles = StyleSheet.create({
  card: { paddingHorizontal: 18, paddingVertical: 16, borderRadius: 28, backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.border, ...shadow.card },
  heading: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', columnGap: 8, rowGap: 4 },
  headingStacked: { flexDirection: 'column', alignItems: 'flex-start' },
  dateAction: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  title: { color: palette.ink, fontSize: 18, lineHeight: 25, fontWeight: '500', letterSpacing: -0.3 },
  date: { color: palette.muted, fontSize: 15, lineHeight: 22 },
  record: { marginTop: 10 },
  entries: { gap: 4 },
  entry: { minHeight: 32, flexDirection: 'row', alignItems: 'center', gap: 9 },
  entryContent: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  entryContentStacked: { flexDirection: 'column', alignItems: 'stretch', gap: 5, paddingVertical: 4 },
  entryNameCopy: { flex: 1, gap: 1 },
  entryNameCopyStacked: { flex: 0 },
  entryName: { fontSize: 16, lineHeight: 23, fontWeight: '500', color: palette.ink },
  status: { maxWidth: '58%', flexShrink: 1, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 3 },
  statusStacked: { alignSelf: 'flex-start', maxWidth: '100%' },
  statusText: { fontSize: 15, lineHeight: 21, flexShrink: 1 },
  groupDivider: { height: StyleSheet.hairlineWidth, backgroundColor: palette.divider, marginVertical: 6 },
  detail: { fontSize: 16, lineHeight: 23, color: palette.body },
  more: { fontSize: 15, lineHeight: 22, color: palette.muted },
  progress: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6, marginTop: 12, paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: palette.divider },
  progressPill: { borderRadius: 9, paddingVertical: 4, paddingHorizontal: 8, maxWidth: '100%' },
  progressText: { flexShrink: 1, fontSize: 15, lineHeight: 22, color: palette.muted },
  noteFlag: { flexDirection: 'row', alignItems: 'center', gap: 5, marginLeft: 'auto', paddingVertical: 4 },
  link: { minHeight: 48, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: palette.divider, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8, marginTop: 6 },
  linkText: { flexShrink: 1, fontSize: 16, lineHeight: 23, color: palette.accent, fontWeight: '500' },
  pressed: { backgroundColor: palette.quietAccent },
});
