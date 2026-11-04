import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { AppTabsParamList } from '@/navigation/AppTabs';
import { useCheckinDrafts } from '@/store/CheckinDraftContext';
import { useWizard } from '@/store/WizardContext';
import type { WizardCheckin } from '@/wizard/types';

export function useEditCheckin() {
  const navigation = useNavigation<BottomTabNavigationProp<AppTabsParamList>>();
  const { open } = useCheckinDrafts();
  const { setStep } = useWizard();
  return (record: WizardCheckin | null) => {
    open(record); setStep(5); navigation.navigate('Guided');
  };
}
