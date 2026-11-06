import React, { useState } from 'react';
import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { AppText as Text } from './AppText';
import { FloatingMark } from './FloatingMark';
import { AppIcon } from './AppIcon';
import { useWizard } from '@/store/WizardContext';
import { useTranslation } from '@/hooks/useTranslation';
import { trackingJourney } from '@/wizard/trackingJourney';
import { colors, shadow } from '@/theme';
import { CheckinDetailModal } from './CheckinDetailModal';
import { useCheckinDrafts } from '@/store/CheckinDraftContext';
import { useEditCheckin } from '@/hooks/useEditCheckin';
import { hasUnfinishedCheckin } from '@/wizard/checkinEditor';
import { useSetup } from '@/store/SetupContext';

/** One next action, with setup guidance retained for first-time users. */
export const MedicationFocusCard: React.FC<{ onGo: (step: number) => void; onSetup: () => void }> = ({ onGo, onSetup }) => {
  const { state } = useWizard();
  const { t } = useTranslation();
  const { fontScale } = useWindowDimensions();
  const { drafts, ready } = useCheckinDrafts();
  const edit = useEditCheckin();
  const setup = useSetup();
  const [showUpdate, setShowUpdate] = useState(false);
  const journey = trackingJourney(state);
  const starting = journey.stage === 'new';
  const unfinished = ready && hasUnfinishedCheckin(drafts.new);
  const completed = !setup.pending && journey.stage === 'today' && !unfinished;
  const action = t(setup.pending ? setup.progress ? 'setup.resume' : 'setup.start' : unfinished ? 'easy_use.continue' : completed ? 'easy_use.view_update' : starting ? journey.action : 'easy_use.record_checkin');
  return <View style={styles.card}>
    <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={StyleSheet.absoluteFill}>
      <FloatingMark size={170} tint="#0071E3" opacity={0.09} travel={8} tilt={6} duration={4600} style={{ right: -26, bottom: -52 }} />
    </View>
    <View style={styles.copy}>
      {completed ? <AppIcon name="check" size={22} color={colors.primary} /> : null}
      <Text accessibilityRole="header" style={styles.title}>{t(setup.pending ? 'setup.title' : unfinished ? 'easy_use.unfinished' : completed ? 'easy_use.saved_today' : starting ? journey.title : 'easy_use.record_checkin')}</Text>
      <Text style={styles.detail}>{t(setup.pending ? setup.progress ? 'setup.resume_body' : 'setup.body' : unfinished ? 'easy_use.resume_body' : completed ? 'easy_use.saved_body' : starting ? journey.body : 'airy.checkin_body')}</Text>
    </View>
    <View style={[styles.actions, fontScale > 1.3 && { flexDirection: 'column', alignItems: 'stretch' }]}>
    <Pressable accessibilityRole="button" accessibilityLabel={action} disabled={!setup.ready || setup.busy} accessibilityState={{ disabled: !setup.ready || setup.busy }} onPress={() => setup.pending ? onSetup() : completed ? setShowUpdate(true) : starting && !unfinished ? onGo(journey.step) : edit(null)} style={({ pressed }) => [styles.action, fontScale > 1.3 && styles.actionLarge, pressed && { opacity: .8 }]}>
      <Text style={styles.actionText}>{action}</Text><AppIcon name="arrow" size={18} color={colors.onPrimary} />
    </Pressable>
    {completed && journey.latest ? <Pressable accessibilityRole="button" onPress={() => edit(journey.latest!)} style={styles.secondary}><Text style={styles.secondaryText}>{t('easy_use.edit_update')}</Text></Pressable> : null}
    </View>
    <CheckinDetailModal visible={showUpdate} checkin={journey.latest || null} index={journey.latest ? state.checkins.indexOf(journey.latest) : 0} onClose={() => setShowUpdate(false)} />
  </View>;
};

const styles = StyleSheet.create({
  card: { borderRadius: 32, padding: 24, overflow: 'hidden', gap: 20, backgroundColor: '#EAF3FF', borderWidth: 1, borderColor: '#D6E8FD' },
  art: { position: 'absolute', right: -30, bottom: -36 },
  copy: { gap: 7 },
  title: { fontSize: 28, lineHeight: 34, fontWeight: '700', color: colors.text, letterSpacing: -.7 },
  detail: { fontSize: 16, lineHeight: 24, color: colors.textSoft },
  action: { alignSelf: 'flex-start', maxWidth: '100%', minWidth: 140, minHeight: 44, paddingVertical: 8, paddingHorizontal: 18, borderRadius: 22, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, backgroundColor: colors.buttonPrimary, ...shadow.cta },
  actionLarge: { alignSelf: 'stretch' },
  actionText: { flexShrink: 1, textAlign: 'center', fontSize: 15, lineHeight: 20, fontWeight: '600', color: colors.onPrimary },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, alignItems: 'center' },
  secondary: { alignSelf: 'flex-start', minHeight: 48, justifyContent: 'center', paddingHorizontal: 6 },
  secondaryText: { color: colors.primary, fontSize: 16, lineHeight: 24, fontWeight: '700' },
});
