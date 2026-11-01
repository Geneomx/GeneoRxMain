import React from 'react';
import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AppText as Text } from './AppText';
import { BrandWatermark } from './AmbientBackground';
import { AppIcon } from './AppIcon';
import { useWizard } from '@/store/WizardContext';
import { useMedCatalog, findMedName } from '@/store/MedCatalogContext';
import { useTranslation } from '@/hooks/useTranslation';
import { trackingJourney } from '@/wizard/trackingJourney';
import { dashboardPalette as palette } from '@/theme/dashboard';
import { shadow } from '@/theme';

export const MedicationFocusCard: React.FC<{ onGo: (step: number) => void }> = ({ onGo }) => {
  const { state } = useWizard();
  const { catalog } = useMedCatalog();
  const { t } = useTranslation();
  const { fontScale, width } = useWindowDimensions();
  const journey = trackingJourney(state);
  const med = state.meds[0];
  const large = fontScale > 1.3 || width < 360;
  const title = med ? state.meds.length === 1 ? findMedName(catalog, med.medId) : t('glass.medications_count', { count: state.meds.length }) : t(journey.title);
  const details = med ? state.meds.length === 1 ? [med.strength, med.frequency].filter(Boolean).join(' · ') : state.meds.slice(0, 2).map(row => findMedName(catalog, row.medId)).join(' · ') : journey.stage === 'new' ? '' : t(journey.body);
  const actionTitle = journey.stage === 'new' ? t(journey.action) : t('glass.check_in');
  return <View style={styles.card}>
    <LinearGradient colors={['#4264B5', '#284A96']} start={{ x: 0, y: 0 }} end={{ x: 1, y: .6 }} style={StyleSheet.absoluteFill} />
    <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={StyleSheet.absoluteFill}><BrandWatermark style={styles.art} /></View>
    <View style={[styles.top, large && styles.topLarge]}>
      <View style={[styles.copy, large && { flex: 0, alignSelf: 'stretch' }]}>
        <Text style={styles.caption}>{t(med ? 'calm.daily_care' : 'journey.start_here')}</Text>
        <Text accessibilityRole="header" style={styles.title}>{title}</Text>
        {details ? <Text style={styles.detail}>{details}</Text> : null}
      </View>
      {!large && med ? <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.capsule}><LinearGradient colors={['#FFFFFF', '#DCE7FC']} style={styles.capsuleHalf} /><LinearGradient colors={['#A7C5FB', '#7099DC']} style={styles.capsuleHalf} /><View style={styles.capsuleShine} /></View> : null}
    </View>
    <View style={[styles.actions, large && { flexDirection: 'column' }]}>
      <Pressable accessibilityRole="button" accessibilityLabel={actionTitle} onPress={() => onGo(journey.stage === 'new' ? journey.step : 5)} style={({ pressed }) => [styles.action, styles.primary, large && { alignSelf: 'stretch' }, pressed && { opacity: .8 }]}><Text style={styles.primaryText}>{actionTitle}</Text><AppIcon name="arrow" size={17} color="#2B4E9C" /></Pressable>
      {med ? <Pressable accessibilityRole="button" accessibilityLabel={t('calm.my_medicines')} onPress={() => onGo(1)} style={({ pressed }) => [styles.action, styles.secondary, large && { alignSelf: 'stretch' }, pressed && { opacity: .8 }]}><Text style={styles.secondaryText}>{t('calm.my_medicines')}</Text></Pressable> : null}
    </View>
  </View>;
};
const styles = StyleSheet.create({
  card: { borderRadius: 29, padding: 22, minHeight: 186, overflow: 'hidden', gap: 20, backgroundColor: palette.checkin, ...shadow.raised },
  art: { position: 'absolute', width: 160, height: 160, right: -18, top: -15, opacity: .11, tintColor: '#FFFFFF' },
  top: { flexDirection: 'row', alignItems: 'flex-start', gap: 15 }, topLarge: { flexDirection: 'column', alignItems: 'flex-start' },
  capsule: { width: 50, height: 74, borderRadius: 28, borderWidth: 1, borderColor: '#FFFFFF99', overflow: 'hidden', transform: [{ rotate: '35deg' }], marginHorizontal: 6 },
  capsuleHalf: { width: '100%', height: '50%' }, capsuleShine: { position: 'absolute', width: 7, height: 24, borderRadius: 8, left: 7, top: 7, backgroundColor: '#FFFFFF99' },
  copy: { flex: 1, gap: 5 }, caption: { fontSize: 15, lineHeight: 22, color: '#FFFFFF' },
  title: { fontSize: 25, lineHeight: 32, fontWeight: '500', color: '#FFFFFF', letterSpacing: -.7 },
  detail: { fontSize: 15, lineHeight: 23, color: '#FFFFFF' },
  actions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  action: { minHeight: 48, paddingVertical: 12, borderRadius: 17, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 9 },
  primary: { backgroundColor: '#FFFFFF', minWidth: 145, paddingHorizontal: 18 }, secondary: { flexShrink: 1 },
  primaryText: { fontSize: 16, lineHeight: 23, fontWeight: '500', color: '#2B4E9C', textAlign: 'center', flexShrink: 1 },
  secondaryText: { fontSize: 15, lineHeight: 23, fontWeight: '500', color: '#FFFFFF', textAlign: 'center' },
});
