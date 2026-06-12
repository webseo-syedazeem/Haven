import { Ionicons } from '@expo/vector-icons';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Tabs } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppFonts } from '@/constants/theme';

const menuIcons: Record<string, keyof typeof Ionicons.glyphMap> = {
  index: 'home-outline',
  mood: 'happy-outline',
  tools: 'leaf-outline',
  progress: 'stats-chart-outline',
  profile: 'person-outline',
};

const HIDDEN_ROUTES = new Set(['screen4']);

function FloatingTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <>
      <View
        pointerEvents="none"
        style={[styles.tabBarDock, { height: Math.max(insets.bottom, 8) + 76 }]}
      />

      <View style={[styles.floatingTabBar, { bottom: Math.max(insets.bottom, 8) }]}>
        {state.routes.map((route, index) => {
          const options = descriptors[route.key]?.options;

          if (HIDDEN_ROUTES.has(route.name) || (options as { href?: string | null } | undefined)?.href === null) {
            return null;
          }

          const isFocused = state.index === index;
          const label =
            typeof options?.title === 'string'
              ? options.title
              : route.name === 'index'
                ? 'Home'
                : route.name.charAt(0).toUpperCase() + route.name.slice(1);
          const icon = menuIcons[route.name] ?? 'ellipse-outline';

          return (
            <Pressable
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
              <Ionicons
                name={icon}
                size={22}
                color={isFocused ? '#3770FC' : '#8C8C8C'}
                style={styles.tabBarIcon}
              />
              <Text style={[styles.tabBarLabel, isFocused && styles.tabBarLabelActive]}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
        }}
      />
      <Tabs.Screen
        name="mood"
        options={{
          title: 'Mood',
        }}
      />
      <Tabs.Screen
        name="tools"
        options={{
          title: 'Tools',
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: 'Progress',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="screen4"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="checklist"
        options={{
          title: 'Checklist',
          href: null,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarDock: {
    backgroundColor: '#FFFFFF',
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
  },
  floatingTabBar: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: 'rgba(227,227,227,0.55)',
    borderRadius: 24,
    borderWidth: 1,
    elevation: 14,
    flexDirection: 'row',
    height: 68,
    justifyContent: 'space-around',
    left: 8,
    overflow: 'hidden',
    paddingBottom: 8,
    paddingTop: 8,
    position: 'absolute',
    right: 8,
    shadowColor: '#3770FC',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 24,
  },
  tabBarItem: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  tabBarIcon: {
    height: 24,
    width: 24,
  },
  tabBarLabel: {
    color: '#8C8C8C',
    fontFamily: AppFonts.sansMedium,
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.4,
    lineHeight: 16,
    marginTop: 2,
    textAlign: 'center',
  },
  tabBarLabelActive: {
    color: '#3770FC',
  },
});
