import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { AppTabsParamList } from '@/navigation/AppTabs';
import { useAuth } from '@/auth/AuthContext';
import { useWizard } from '@/store/WizardContext';
import { visibleSteps } from '@/content/wizardData';

/** Return to the portal home: the first step of the guided wizard. */
export function useDashboardNavigation() {
  const navigation = useNavigation<BottomTabNavigationProp<AppTabsParamList>>();
  const { setStep } = useWizard();
  const { isGuest } = useAuth();
  return () => {
    setStep(visibleSteps(isGuest)[0]);
    navigation.navigate('Guided');
  };
}
