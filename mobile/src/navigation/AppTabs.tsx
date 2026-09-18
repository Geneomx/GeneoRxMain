import React from 'react';
import { View } from 'react-native';
import Svg, { Path, Circle, Polygon } from 'react-native-svg';
import { OfflineBanner } from '@/components/OfflineBanner';
import { AskBubble } from '@/components/AskBubble';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { HomeScreen } from '@/screens/HomeScreen';
import { WizardScreen } from '@/screens/wizard/WizardScreen';
import { ProfileStack } from '@/navigation/ProfileStack';
import { AppTabBar } from '@/navigation/AppTabBar';

/**
 * Three tabs, not four. Ask moved to a floating bubble (AskBubble): it frees the
 * fourth slot — with four tabs the bar degrades to icon-only below 360px width —
 * and it closes a parity divergence, since the website has no Ask tab either.
 */
export type AppTabsParamList = {
  Home: undefined;
  Guided: undefined;
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
      {/* Sits above the tab bar on every tab, so Ask is reachable from anywhere
          rather than only from its own screen. */}
      <AskBubble />
    </View>
  </View>
);
