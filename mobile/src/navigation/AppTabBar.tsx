import React from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from '@/hooks/useTranslation';
import type { AppTabsParamList } from '@/navigation/AppTabs';
import { TAB_BAR_HEIGHT } from '@/hooks/useResponsiveLayout';
import { colors, radius, touchMin } from '@/theme';

type TabKey = keyof AppTabsParamList;

const TAB_ORDER: TabKey[] = ['Home', 'Guided', 'Treatments', 'CheckIns', 'Insights', 'Profile'];

const TAB_LABEL_KEYS: Record<TabKey, string> = {
  Home: 'mobile.tab.home',
  Guided: 'mobile.tab.guided',
  Treatments: 'mobile.tab.meds',
  CheckIns: 'mobile.tab.checkin',
  Insights: 'mobile.tab.insights',
  Profile: 'mobile.tab.profile',
};

const ICON_SIZE = 22;
const ICON_SIZE_COMPACT = 24;

export const AppTabBar: React.FC<BottomTabBarProps> = ({ state, descriptors, navigation }) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const iconOnly = width < 360;
  const bottomInset = Math.max(insets.bottom, 8);

  const routesByName = Object.fromEntries(state.routes.map((r) => [r.name, r]));

  return (
    <View style={[styles.wrap, { height: TAB_BAR_HEIGHT + bottomInset, paddingBottom: bottomInset }]}>
      <View style={styles.row}>
        {TAB_ORDER.map((name) => {
          const route = routesByName[name];
          if (!route) return null;

          const index = state.routes.findIndex((r) => r.key === route.key);
          const focused = state.index === index;
          const { options } = descriptors[route.key];
          const icon = options.tabBarIcon?.({
            focused,
            color: focused ? colors.buttonText : colors.textSoft,
            size: iconOnly ? ICON_SIZE_COMPACT : ICON_SIZE,
          });

          const label = t(TAB_LABEL_KEYS[name]);

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
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
                <View style={[styles.iconWrap, iconOnly && styles.iconWrapLarge]}>{icon}</View>
                {!iconOnly ? (
                  <Text
                    style={[styles.label, focused ? styles.labelOn : styles.labelOff]}
                    numberOfLines={2}
                    adjustsFontSizeToFit
                    minimumFontScale={0.8}
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
    backgroundColor: colors.backgroundAlt,
    borderTopWidth: 1,
    borderTopColor: colors.borderSoft,
    paddingTop: 6,
    paddingHorizontal: 4,
  },
  row: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 3,
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
    paddingVertical: 5,
    paddingHorizontal: 2,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: 3,
  },
  pillOff: {
    backgroundColor: colors.ghostBg,
    borderColor: colors.borderSoft,
  },
  pillOn: {
    backgroundColor: colors.buttonPrimary,
    borderColor: 'rgba(255, 255, 255, 0.14)',
  },
  iconWrap: {
    height: ICON_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapLarge: {
    height: ICON_SIZE_COMPACT + 4,
  },
  label: {
    fontSize: 10.5,
    lineHeight: 12,
    textAlign: 'center',
    maxWidth: '100%',
    paddingHorizontal: 1,
  },
  labelOff: {
    fontWeight: '600',
    color: colors.textSoft,
  },
  labelOn: {
    fontWeight: '800',
    color: colors.buttonText,
  },
});
