import { Ionicons } from '@expo/vector-icons';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Redirect, Tabs, useSegments } from 'expo-router';
import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MiniPlayer } from '@/components/MiniPlayer';
import { PASSAGE_TAB_BAR_HEIGHT, PassageColors } from '@/constants/design';
import { AppFonts } from '@/constants/theme';
import { isExplicitSignOutInFlight } from '@/lib/auth/session-state';
import { useHasSession, useSessionRestoring } from '@/hooks/useSession';

const menuIcons: Record<string, keyof typeof Ionicons.glyphMap> = {
  index: 'home-outline',
  explore: 'compass-outline',
  library: 'book-outline',
  saved: 'heart-outline',
  profile: 'person-outline',
};

const activeMenuIcons: Record<string, keyof typeof Ionicons.glyphMap> = {
  index: 'home',
  explore: 'compass',
  library: 'book',
  saved: 'heart',
  profile: 'person',
};

function FloatingTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.dock}>
      {/* Sits directly above the bar, so it is present on every tab. */}
      <MiniPlayer />
      <View
        style={[
          styles.tabBar,
          { height: PASSAGE_TAB_BAR_HEIGHT + insets.bottom, paddingBottom: insets.bottom },
        ]}>
        {state.routes.map((route, index) => {
          const options = descriptors[route.key]?.options;

          if ((options as { href?: string | null } | undefined)?.href === null) {
            return null;
          }

          const isFocused = state.index === index;
          const label =
            typeof options?.title === 'string'
              ? options.title
              : route.name.charAt(0).toUpperCase() + route.name.slice(1);
          const icon = isFocused
            ? activeMenuIcons[route.name] ?? menuIcons[route.name] ?? 'ellipse'
            : menuIcons[route.name] ?? 'ellipse-outline';
          const iconColor = isFocused ? PassageColors.accent : PassageColors.textSecondary;

          return (
            <Pressable
              accessibilityLabel={label}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              key={route.key}
              onPress={() => {
                const event = navigation.emit({
                  type: 'tabPress',
                  target: route.key,
                  canPreventDefault: true,
                });

                if (!isFocused && !event.defaultPrevented) {
                  navigation.navigate(route.name, route.params);
                }
              }}
              style={styles.tabBarItem}>
              <Ionicons name={icon} size={21} color={iconColor} style={styles.tabBarIcon} />
              <Text style={[styles.tabBarLabel, isFocused && styles.tabBarLabelActive]}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function TabLayout() {
  const segments = useSegments();
  const hasSession = useHasSession();
  const isRestoring = useSessionRestoring();
  const tabsAreActive = segments[0] === '(tabs)';

  if (tabsAreActive && isRestoring) {
    return (
      <View style={styles.authLoading}>
        <ActivityIndicator color={PassageColors.accent} size="large" />
      </View>
    );
  }

  // Stale navigation history and deep links cannot bypass authentication.
  // `isExplicitSignOutInFlight()` is skipped while an explicit sign-out or
  // account deletion is already clearing the session and about to navigate
  // to login itself — otherwise this fires on the same drop in `hasSession`
  // and lands on `/login?launch=1` moments before the explicit call lands on
  // `/login?signedOut=1`, mounting the login screen twice.
  if (tabsAreActive && !hasSession && !isExplicitSignOutInFlight()) {
    return <Redirect href="/login?launch=1" />;
  }
  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: PassageColors.background },
      }}>
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="explore" options={{ title: 'Explore' }} />
      <Tabs.Screen name="library" options={{ title: 'Library' }} />
      <Tabs.Screen name="saved" options={{ title: 'Saved' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  authLoading: {
    alignItems: 'center',
    backgroundColor: PassageColors.background,
    flex: 1,
    justifyContent: 'center',
  },
  dock: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
  },
  tabBar: {
    alignItems: 'center',
    backgroundColor: PassageColors.background,
    borderTopColor: PassageColors.border,
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 10,
  },
  tabBarItem: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-start',
  },
  tabBarIcon: {
    height: 22,
    width: 22,
  },
  tabBarLabel: {
    color: PassageColors.textSecondary,
    fontFamily: AppFonts.sansMedium,
    fontSize: 12,
    letterSpacing: 0.3,
    lineHeight: 16,
    marginTop: 5,
    textAlign: 'center',
  },
  tabBarLabelActive: {
    color: PassageColors.accent,
  },
});
