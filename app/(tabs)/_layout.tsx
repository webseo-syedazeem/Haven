import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { StyleSheet } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { AppFonts } from '@/constants/theme';

const menuIcons: Record<string, keyof typeof Ionicons.glyphMap> = {
  home: 'home-outline',
  mood: 'happy-outline',
  tools: 'leaf-outline',
  progress: 'stats-chart-outline',
  profile: 'person-outline',
};

function TabIcon({ color, name }: { color: string; name: keyof typeof Ionicons.glyphMap }) {
  return <Ionicons color={color} name={name} size={22} style={styles.tabIcon} />;
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#3770FC',
        tabBarInactiveTintColor: '#8C8C8C',
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarLabelStyle: {
          fontFamily: AppFonts.sansMedium,
          fontSize: 12,
          fontWeight: '500',
          letterSpacing: 0.4,
          lineHeight: 16,
          marginTop: 2,
          textAlign: 'center',
        },
        tabBarStyle: {
          position: 'absolute',
          left: 8,
          right: 8,
          bottom: 8,
          height: 68,
          borderRadius: 24,
          borderTopWidth: 0,
          backgroundColor: '#FFFFFF',
          shadowColor: '#3770FC',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.16,
          shadowRadius: 16,
          elevation: 10,
          paddingTop: 8,
          paddingBottom: 8,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <TabIcon color={color} name={menuIcons.home} />,
        }}
      />
      <Tabs.Screen
        name="mood"
        options={{
          title: 'Mood',
          tabBarIcon: ({ color }) => <TabIcon color={color} name={menuIcons.mood} />,
        }}
      />
      <Tabs.Screen
        name="tools"
        options={{
          title: 'Tools',
          tabBarIcon: ({ color }) => <TabIcon color={color} name={menuIcons.tools} />,
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: 'Progress',
          tabBarIcon: ({ color }) => <TabIcon color={color} name={menuIcons.progress} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <TabIcon color={color} name={menuIcons.profile} />,
        }}
      />
      <Tabs.Screen
        name="screen4"
        options={{
          title: 'Privacy',
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
  tabIcon: {
    height: 24,
    width: 24,
  },
});
