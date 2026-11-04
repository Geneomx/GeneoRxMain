import React from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { AppText as Text } from '@/components/AppText';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from '@/hooks/useTranslation';
import type { AppTabsParamList } from '@/navigation/AppTabs';
import type { ClinicTabsParamList } from '@/navigation/ClinicTabs';
import { TAB_BAR_HEIGHT } from '@/hooks/useResponsiveLayout';
import { colors, shadow, touchMin } from '@/theme';
import { useWizard } from '@/store/WizardContext';
import { dashboardPalette as palette } from '@/theme/dashboard';

/**
 * This bar is shared by the patient tabs and the clinician's two, so the order
 * comes from whichever navigator rendered it rather than a list here — a fixed
 * list silently rendered nothing at all for the clinic.
 */
type TabKey = keyof AppTabsParamList | keyof ClinicTabsParamList;

const TAB_LABEL_KEYS: Record<TabKey, string> = {
  Home: 'mobile.tab.home',
  Guided: 'mobile.tab.guided',
  Profile: 'mobile.tab.profile',
  Appointments: 'clinic.tab.appointments',
  Messages: 'clinic.tab.messages',
};

const ICON_SIZE = 22;
const ICON_SIZE_COMPACT = 24;

export const AppTabBar: React.FC<BottomTabBarProps> = ({ state, descriptors, navigation }) => {
  const { t } = useTranslation();
  const { openPlanHub } = useWizard();
  const insets = useSafeAreaInsets();
  const { width, fontScale } = useWindowDimensions();
  const navigationScale = Math.min(fontScale, 1.5);
  const iconOnly = false;
  const bottomInset = Math.max(insets.bottom, 8);

  return (
    <View style={[styles.wrap, { minHeight: TAB_BAR_HEIGHT + bottomInset, height: Math.max(TAB_BAR_HEIGHT, 40 + 34 * navigationScale) + bottomInset, paddingBottom: bottomInset }]}>
      <View style={styles.row}>
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const { options } = descriptors[route.key];
          const icon = options.tabBarIcon?.({
            focused,
            color: focused ? colors.onPine : palette.muted,
            size: iconOnly ? ICON_SIZE_COMPACT : ICON_SIZE,
          });

          const label = t(TAB_LABEL_KEYS[route.name as TabKey] ?? route.name);

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!event.defaultPrevented && route.name === 'Guided') openPlanHub();
            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityLabel={label}
              accessibilityState={focused ? { selected: true } : {}}
              onPress={onPress}
              onLongPress={() => navigation.emit({ type: 'tabLongPress', target: route.key })}
              style={styles.item}
            >
              <View style={[styles.pill, focused ? styles.pillOn : styles.pillOff]}>
                <View style={[styles.iconWrap, focused && styles.iconWrapFocused, iconOnly && styles.iconWrapLarge]}>{icon}</View>
                {!iconOnly ? (
                  <Text
                    maxFontSizeMultiplier={1.5}
                    numberOfLines={1}
                    style={[styles.label, focused ? styles.labelOn : styles.labelOff]}
                  >
                    {label}
                  </Text>
                ) : null}
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.background,
    paddingTop: 6,
    paddingHorizontal: 16,
  },
  row: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 4,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 34,
    padding: 6,
    ...shadow.raised,
  },
  item: {
    flex: 1,
    minWidth: 0,
    minHeight: touchMin - 8,
    alignItems: 'center',
  },
  pill: {
    width: '100%',
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    paddingHorizontal: 2,
    borderRadius: 28,
    borderWidth: 0,
    gap: 3,
    overflow: 'hidden',
  },
  pillOff: {
    backgroundColor: 'transparent',
  },
  pillOn: {
    backgroundColor: colors.pine,
  },
  iconWrap: {
    width: 44,
    height: 27,
    borderRadius: 12,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapFocused: { backgroundColor: 'transparent' },
  iconWrapLarge: {
    height: ICON_SIZE_COMPACT + 4,
  },
  label: {
    fontSize: 12.5,
    lineHeight: 18,
    textAlign: 'center',
    maxWidth: '100%',
    paddingHorizontal: 1,
  },
  labelOff: {
    fontWeight: '700',
    color: palette.muted,
  },
  labelOn: {
    fontWeight: '700',
    color: colors.onPine,
  },
});
