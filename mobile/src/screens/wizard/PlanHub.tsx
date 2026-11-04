import React from 'react';
import { View } from 'react-native';
import { ListRow, refined, SectionHeading } from '@/components/RefinedUI';
import { useWizard } from '@/store/WizardContext';
import { useTranslation } from '@/hooks/useTranslation';
import { useAuth } from '@/auth/AuthContext';
import { Button } from '@/components/Button';
import { AppText as Text } from '@/components/AppText';
import { useSetup } from '@/store/SetupContext';
import type { SetupStep } from '@/wizard/setupFlow';

export const PlanHub: React.FC = () => {
  const { setStep, state } = useWizard();
  const { isGuest } = useAuth();
  const { t } = useTranslation();
  const setup = useSetup();
  const go = (step: SetupStep) => { if (setup.pending) void setup.begin(step); else setStep(step); };
  return <View style={{ gap: 18 }}>
    {setup.pending ? <View style={{ gap: 8 }}><Text style={refined.body}>{t(setup.progress ? 'setup.resume_body' : 'setup.body')}</Text><Button title={t(setup.progress ? 'setup.resume' : 'setup.start')} onPress={() => { void setup.begin(); }} loading={setup.busy} /></View> : null}
    {setup.error ? <Text accessibilityRole="alert" style={refined.body}>{t('setup.error')}</Text> : null}
    <View style={refined.listGroup}>
      {isGuest ? <ListRow icon="account" title={t('refined.account_title')} onPress={() => go(0)} /> : null}
      <ListRow icon="pill" title={t('step.1')} value={state.meds.length} onPress={() => go(1)} />
      <ListRow icon="heart" title={t('step.2')} value={state.symptoms.selected.length} onPress={() => go(2)} />
      <ListRow last icon="sun" title={t('step.3')} onPress={() => go(3)} />
    </View>
    <SectionHeading title={t('parity.your_record')} />
    <View style={refined.listGroup}>
      <ListRow icon="calendar" title={t('parity.weekly_checkin')} onPress={() => go(5)} />
      <ListRow icon="chart" title={t('step.6')} onPress={() => go(6)} />
      <ListRow icon="spark" title={t('step.4')} onPress={() => go(4)} />
      <ListRow last icon="file" title={t('step.8')} onPress={() => go(8)} />
    </View>
  </View>;
};
