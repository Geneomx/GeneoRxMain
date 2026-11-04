import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText as Text } from '@/components/AppText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BrandIdentity } from '@/components/BrandHeader';
import { useAuth } from '@/auth/AuthContext';
import { useTranslation } from '@/hooks/useTranslation';
import { colors } from '@/theme';
import Svg, { Path, Rect } from 'react-native-svg';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { OfflineBanner } from '@/components/OfflineBanner';
import { AppTabBar } from '@/navigation/AppTabBar';
import { ClinicAppointmentsScreen } from '@/screens/clinic/ClinicAppointmentsScreen';
import { ClinicMessagesScreen } from '@/screens/clinic/ClinicMessagesScreen';

/**
 * What a clinician sees instead of the patient app.
 *
 * Two tabs, because a doctor has exactly two jobs here: answer the people who
 * booked a time, and answer the people who wrote. No Home, no wizard, no plan
 * — a doctor signing in used to land in the patient's own health journey,
 * which is not theirs and made no sense to them.
 *
 * No AskBubble either: the assistant is a patient-facing feature.
 */
export type ClinicTabsParamList = {
  Appointments: undefined;
  Messages: undefined;
};

const Tabs = createBottomTabNavigator<ClinicTabsParamList>();

const ICON = 22;

const CalendarIcon = ({ color }: { color: string }) => (
  <Svg width={ICON} height={ICON} viewBox="0 0 24 24" fill="none">
    <Rect x="3" y="5" width="18" height="16" rx="2" stroke={color} strokeWidth={1.9} />
    <Path d="M3 10h18M8 3v4M16 3v4" stroke={color} strokeWidth={1.9} strokeLinecap="round" />
  </Svg>
);

const ChatIcon = ({ color }: { color: string }) => (
  <Svg width={ICON} height={ICON} viewBox="0 0 24 24" fill="none">
    <Path
      d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
      stroke={color} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round"
    />
  </Svg>
);

const ClinicTabsNavigator: React.FC = () => (
  <Tabs.Navigator
    tabBar={(props) => <AppTabBar {...props} />}
    screenOptions={{ headerShown: false, tabBarShowLabel: false }}
  >
    <Tabs.Screen
      name="Appointments"
      component={ClinicAppointmentsScreen}
      options={{ tabBarIcon: ({ color }) => <CalendarIcon color={color} /> }}
    />
    <Tabs.Screen
      name="Messages"
      component={ClinicMessagesScreen}
      options={{ tabBarIcon: ({ color }) => <ChatIcon color={color} /> }}
    />
  </Tabs.Navigator>
);

export const ClinicTabs: React.FC = () => {
  const { signOut } = useAuth();
  const { t } = useTranslation();
  return <SafeAreaView style={{ flex: 1, backgroundColor: colors.surface }} edges={['top', 'left', 'right']}>
    <View style={styles.header}>
      <BrandIdentity />
      <Pressable onPress={signOut} accessibilityRole="button" accessibilityLabel={t('mobile.profile.sign_out')} style={styles.signOut}>
        <Text style={styles.signOutText}>{t('mobile.profile.sign_out')}</Text>
      </Pressable>
    </View>
    <OfflineBanner />
    <View style={{ flex: 1 }}>
      <ClinicTabsNavigator />
    </View>
  </SafeAreaView>;
};

const styles = StyleSheet.create({
  header: { minHeight: 52, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: colors.borderSoft },
  signOut: { minHeight: 44, paddingHorizontal: 8, justifyContent: 'center' },
  signOutText: { fontSize: 17, fontWeight: '500', color: colors.primaryDark },
});
