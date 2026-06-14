import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { AppTabsParamList } from '@/navigation/AppTabs';

/** Switch to the Home tab (main dashboard). */
export function useDashboardNavigation() {
  const navigation = useNavigation<BottomTabNavigationProp<AppTabsParamList>>();
  return () => navigation.navigate('Home');
}
