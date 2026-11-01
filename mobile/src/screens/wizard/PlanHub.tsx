import React from 'react';
import { View } from 'react-native';
import { ListRow, refined, SectionHeading } from '@/components/RefinedUI';
import { useWizard } from '@/store/WizardContext';
import { useTranslation } from '@/hooks/useTranslation';
import { useAuth } from '@/auth/AuthContext';
import { Button } from '@/components/Button';
import { AppText as Text } from '@/components/AppText';
import { trackingJourney } from '@/wizard/trackingJourney';

export const PlanHub: React.FC = () => {
  const { setStep, state } = useWizard();
  const { isGuest } = useAuth();
  const { t } = useTranslation();
  const journey = trackingJourney(state);
  return <View style={{ gap: 18 }}>
    {journey.firstUpdate ? <View style={{ gap: 8 }}><Text style={refined.body}>{t(journey.body)}</Text><Button title={t(journey.action)} onPress={() => setStep(journey.step)} /></View> : null}
    <View style={refined.listGroup}>
      {isGuest ? <ListRow icon="account" title={t('refined.account_title')} onPress={() => setStep(0)} /> : null}
      <ListRow icon="pill" title={t('step.1')} value={state.meds.length} onPress={() => setStep(1)} />
      <ListRow icon="heart" title={t('step.2')} value={state.symptoms.selected.length} onPress={() => setStep(2)} />
      <ListRow last icon="sun" title={t('step.3')} onPress={() => setStep(3)} />
    </View>
    <SectionHeading title={t('parity.your_record')} />
    <View style={refined.listGroup}>
      <ListRow icon="calendar" title={t('parity.weekly_checkin')} onPress={() => setStep(5)} />
      <ListRow icon="chart" title={t('step.6')} onPress={() => setStep(6)} />
      <ListRow icon="spark" title={t('step.4')} onPress={() => setStep(4)} />
      <ListRow last icon="file" title={t('step.8')} onPress={() => setStep(8)} />
    </View>
  </View>;
};
