import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { AppTabsParamList } from '@/navigation/AppTabs';

/** Return to the Home dashboard. */
export function useDashboardNavigation() {
  const navigation = useNavigation<BottomTabNavigationProp<AppTabsParamList>>();
  return () => navigation.navigate('Home');
}
