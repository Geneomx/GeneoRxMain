import React from 'react';
import { View } from 'react-native';
import Svg, { Path, Circle, Polygon, Rect } from 'react-native-svg';
import { OfflineBanner } from '@/components/OfflineBanner';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { HomeScreen } from '@/screens/HomeScreen';
import { TreatmentsScreen } from '@/screens/TreatmentsScreen';
import { CheckInsScreen } from '@/screens/CheckInsScreen';
import { InsightsScreen } from '@/screens/InsightsScreen';
import { WizardScreen } from '@/screens/wizard/WizardScreen';
import { ProfileStack } from '@/navigation/ProfileStack';
import { AppTabBar } from '@/navigation/AppTabBar';
import { colors } from '@/theme';

export type AppTabsParamList = {
  Home: undefined;
  Guided: undefined;
  Treatments: undefined;
  CheckIns: undefined;
  Insights: undefined;
  Profile: undefined;
};

const Tabs = createBottomTabNavigator<AppTabsParamList>();

const ICON = 22;

const HomeIcon = ({ color }: { color: string }) => (
  <Svg width={ICON} height={ICON} viewBox="0 0 24 24" fill="none">
    <Path
      d="M3 11l9-7 9 7v9a2 2 0 0 1-2 2h-4v-7h-6v7H5a2 2 0 0 1-2-2v-9z"
      stroke={color} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round"
    />
  </Svg>
);

const PillIcon = ({ color, filled }: { color: string; filled?: boolean }) => (
  <Svg width={ICON} height={ICON} viewBox="0 0 24 24" fill="none">
    <Path
      d="M10.5 3.5a4 4 0 0 1 5.657 5.657L7.5 17.814A4 4 0 0 1 1.843 12.157L10.5 3.5z"
      stroke={color} strokeWidth={1.9} fill={filled ? color : 'none'}
      strokeLinecap="round" strokeLinejoin="round"
    />
    <Path d="M6 12l6-6" stroke={filled ? colors.textInverse : color} strokeWidth={1.5} strokeLinecap="round" />
  </Svg>
);

const CheckIcon = ({ color }: { color: string }) => (
  <Svg width={ICON} height={ICON} viewBox="0 0 24 24" fill="none">
    <Rect x="3" y="3" width="18" height="18" rx="4" stroke={color} strokeWidth={1.9} />
    <Path d="M7.5 12l3 3 6-6" stroke={color} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const BoltIcon = ({ color }: { color: string }) => (
  <Svg width={ICON} height={ICON} viewBox="0 0 24 24" fill="none">
    <Path
      d="M13 2L4 14h7l-1 8 9-12h-7l1-8z"
      stroke={color} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round"
    />
  </Svg>
);

const CompassIcon = ({ color }: { color: string }) => (
  <Svg width={ICON} height={ICON} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth={1.9} />
    <Polygon
      points="15.5,8.5 11,11 8.5,15.5 13,13"
      stroke={color} strokeWidth={1.6} fill="none" strokeLinejoin="round"
    />
  </Svg>
);

const PersonIcon = ({ color }: { color: string }) => (
  <Svg width={ICON} height={ICON} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="8" r="4" stroke={color} strokeWidth={1.9} />
    <Path
      d="M4 20c0-3.5 3.5-6 8-6s8 2.5 8 6"
      stroke={color} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round"
    />
  </Svg>
);

const AppTabsNavigator: React.FC = () => (
  <Tabs.Navigator
    tabBar={(props) => <AppTabBar {...props} />}
    screenOptions={{
      headerShown: false,
      tabBarShowLabel: false,
    }}
  >
    <Tabs.Screen
      name="Home"
      component={HomeScreen}
      options={{
        tabBarIcon: ({ color }) => <HomeIcon color={color} />,
      }}
    />
    <Tabs.Screen
      name="Guided"
      component={WizardScreen}
      options={{
        tabBarIcon: ({ color }) => <CompassIcon color={color} />,
      }}
    />
    <Tabs.Screen
      name="Treatments"
      component={TreatmentsScreen}
      options={{
        tabBarIcon: ({ focused, color }) => (
          <PillIcon color={color} filled={focused} />
        ),
      }}
    />
    <Tabs.Screen
      name="CheckIns"
      component={CheckInsScreen}
      options={{
        tabBarIcon: ({ color }) => <CheckIcon color={color} />,
      }}
    />
    <Tabs.Screen
      name="Insights"
      component={InsightsScreen}
      options={{
        tabBarIcon: ({ color }) => <BoltIcon color={color} />,
      }}
    />
    <Tabs.Screen
      name="Profile"
      component={ProfileStack}
      options={{
        tabBarIcon: ({ color }) => <PersonIcon color={color} />,
      }}
    />
  </Tabs.Navigator>
);

export const AppTabs: React.FC = () => (
  <View style={{ flex: 1 }}>
    <OfflineBanner />
    <View style={{ flex: 1 }}>
      <AppTabsNavigator />
    </View>
  </View>
);
