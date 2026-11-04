import React, { useState } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { AppText as Text } from './AppText';
import { AppIcon } from './AppIcon';
import { CheckinDetailModal } from './CheckinDetailModal';
import { useTranslation } from '@/hooks/useTranslation';
import type { LatestUpdate } from '@/wizard/latestUpdate';
import { dashboardPalette as palette } from '@/theme/dashboard';
import { colors } from '@/theme';
import { readableCheckinDate } from '@/wizard/checkinEditor';

/** Quiet rows summarize the saved record; the date opens its complete answers. */
export const LatestUpdateCard: React.FC<{ update: LatestUpdate; loading: boolean; onCheckin: () => void }> = ({ update, loading, onCheckin }) => {
  const { t, language } = useTranslation();
  const { fontScale } = useWindowDimensions();
  const [detailsOpen, setDetailsOpen] = useState(false);
  const { checkin } = update;
  const dateLabel = checkin ? readableCheckinDate(checkin.dateISO, language) : '';
  return <View style={styles.section}>
    <View style={[styles.heading, styles.headingLarge]}>
      <Text accessibilityRole="header" style={styles.title}>{t('easy_use.last_checkin')}</Text>
      {checkin ? <Pressable disabled={loading} accessibilityRole="button" accessibilityLabel={`${t('dashboard.update.details')}. ${dateLabel}`} onPress={() => setDetailsOpen(true)} style={styles.dateAction}>
        <Text style={styles.date}>{dateLabel}</Text><AppIcon name="chevron" size={16} color={palette.accent} />
      </Pressable> : null}
    </View>
    {loading ? <Text style={styles.detail}>{t('tracking.save.loading')}</Text> : checkin ? <>
      {update.medicationEntries.length ? <Text style={styles.detail}>{t('easy_use.medication_period')}</Text> : null}
      <View>
        {update.medicationEntries.length ? update.medicationEntries.slice(0, 2).map((entry, index) => <View key={index} style={styles.row} accessible accessibilityLabel={`${entry.name}. ${entry.status}`}>
          <View style={styles.icon}><AppIcon name="pill" size={21} color={palette.accent} /></View>
          <View style={styles.copy}><Text style={styles.name}>{entry.name}</Text><Text style={[styles.detail, entry.tone === 'warning' && styles.warning]}>{entry.status}</Text></View>
          {entry.tone === 'positive' ? <AppIcon name="check" size={18} color={colors.success} /> : null}
        </View>) : <View style={styles.row}><View style={styles.icon}><AppIcon name="pill" size={21} /></View><View style={styles.copy}><Text style={styles.name}>{t('step.1')}</Text><Text style={styles.detail}>{t('dashboard.update.not_recorded')}</Text></View></View>}
        {update.medicationEntries.length > 2 ? <Text style={styles.more}>{t('dashboard.more_count', { count: update.medicationEntries.length - 2 })}</Text> : null}
        <View style={styles.row}>
          <View style={styles.icon}><AppIcon name="heart" size={21} color={palette.accent} /></View>
          <View style={styles.copy}><Text style={styles.name}>{t('step.2')}</Text><Text style={styles.detail}>{update.symptomProgress ? update.progress : update.symptoms}</Text></View>
        </View>
        {!update.symptomProgress ? <View style={styles.note}><AppIcon name="chart" size={17} color={palette.muted} /><Text style={[styles.detail, styles.noteCopy]}>{update.progress}</Text></View> : null}
        {update.notes ? <View style={styles.note}><AppIcon name="file" size={17} color={palette.muted} /><Text style={[styles.detail, styles.noteCopy]} numberOfLines={fontScale > 1.3 ? undefined : 2}>{update.notes}</Text></View> : null}
      </View>
      <CheckinDetailModal visible={detailsOpen} checkin={checkin} index={update.index} onClose={() => setDetailsOpen(false)} />
    </> : <><Text style={styles.detail}>{t('dashboard.update.empty')}</Text><Pressable accessibilityRole="button" onPress={onCheckin} style={styles.dateAction}><Text style={styles.date}>{t('dashboard.update.first_checkin')}</Text><AppIcon name="chevron" size={16} /></Pressable></>}
  </View>;
};

const styles = StyleSheet.create({
  section: { gap: 8, padding: 20, borderRadius: 28, backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border },
  heading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  headingLarge: { flexDirection: 'column', alignItems: 'flex-start', gap: 0 },
  title: { flexShrink: 1, fontSize: 20, lineHeight: 27, fontWeight: '700', letterSpacing: -.3, color: colors.pine },
  dateAction: { alignSelf: 'flex-start', minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 2 },
  date: { fontSize: 15, lineHeight: 23, color: palette.accent, fontWeight: '500' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 13, paddingVertical: 17, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: palette.divider },
  icon: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.quietAccent },
  copy: { flex: 1, gap: 4 },
  name: { fontSize: 17, lineHeight: 25, fontWeight: '500', color: palette.ink },
  detail: { fontSize: 16, lineHeight: 24, color: palette.muted },
  warning: { color: colors.warning },
  more: { fontSize: 15, lineHeight: 23, color: palette.muted, paddingVertical: 5 },
  note: { flexDirection: 'row', alignItems: 'flex-start', gap: 9, paddingTop: 15 },
  noteCopy: { flex: 1 },
});
