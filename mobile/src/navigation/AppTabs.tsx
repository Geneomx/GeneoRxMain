import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { HomeScreen } from '@/screens/HomeScreen';
import { TreatmentsScreen } from '@/screens/TreatmentsScreen';
import { CheckInsScreen } from '@/screens/CheckInsScreen';
import { ProfileStack } from './ProfileStack';
import { colors } from '@/theme';

export type AppTabsParamList = {
  Home: undefined;
  Treatments: undefined;
  CheckIns: undefined;
  Profile: undefined;
};

const Tabs = createBottomTabNavigator<AppTabsParamList>();

// SVG-based tab icons (no emoji, professional)
const HomeIcon = ({ color }: { color: string }) => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
    <Path d="M3 11l9-7 9 7v9a2 2 0 0 1-2 2h-4v-7h-6v7H5a2 2 0 0 1-2-2v-9z"
      stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const PillIcon = ({ color }: { color: string }) => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
    <Rect x="3" y="9" width="18" height="6" rx="3"
      stroke={color} strokeWidth={1.8} />
    <Path d="M12 9v6" stroke={color} strokeWidth={1.8} strokeLinecap="round"/>
  </Svg>
);

const ChartIcon = ({ color }: { color: string }) => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
    <Path d="M3 19l5-5 4 4 8-9"
      stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"/>
    <Path d="M14 9h6v6"
      stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const UserIcon = ({ color }: { color: string }) => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="8" r="4"
      stroke={color} strokeWidth={1.8} />
    <Path d="M4 21c0-4 4-6 8-6s8 2 8 6"
      stroke={color} strokeWidth={1.8} strokeLinecap="round"/>
  </Svg>
);

type IconRenderer = (color: string) => React.ReactElement;
const renderIcon = (Component: IconRenderer) => ({ focused }: { focused: boolean }) =>
  Component(focused ? colors.primary : colors.textMuted);

export const AppTabs: React.FC = () => (
  <Tabs.Navigator
    screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: colors.primary,
      tabBarInactiveTintColor: colors.textMuted,
      tabBarLabelStyle: {
        fontSize: 11,
        fontWeight: '600',
        letterSpacing: 0.2,
        marginTop: 2,
      },
      tabBarStyle: {
        backgroundColor: colors.background,
        borderTopColor: colors.borderSoft,
        borderTopWidth: 1,
        height: Platform.OS === 'ios' ? 84 : 64,
        paddingTop: 8,
        paddingBottom: Platform.OS === 'ios' ? 28 : 10,
      },
      tabBarItemStyle: { paddingVertical: 2 },
    }}
  >
    <Tabs.Screen
      name="Home"
      component={HomeScreen}
      options={{ tabBarIcon: renderIcon((c) => <HomeIcon color={c} />) }}
    />
    <Tabs.Screen
      name="Treatments"
      component={TreatmentsScreen}
      options={{ tabBarIcon: renderIcon((c) => <PillIcon color={c} />) }}
    />
    <Tabs.Screen
      name="CheckIns"
      component={CheckInsScreen}
      options={{
        tabBarLabel: 'Check-ins',
        tabBarIcon: renderIcon((c) => <ChartIcon color={c} />),
      }}
    />
    <Tabs.Screen
      name="Profile"
      component={ProfileStack}
      options={{ tabBarIcon: renderIcon((c) => <UserIcon color={c} />) }}
    />
  </Tabs.Navigator>
);
