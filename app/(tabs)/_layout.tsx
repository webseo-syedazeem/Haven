import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

import { HapticTab } from '@/components/haptic-tab';

const tabItems = {
  explore: ['happy-outline', 'happy'] as const,
  index: ['home-outline', 'home'] as const,
  mood: ['heart-outline', 'heart'] as const,
  profile: ['person-outline', 'person'] as const,
  progress: ['bar-chart-outline', 'bar-chart'] as const,
};

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => {
        const names = tabItems[route.name as keyof typeof tabItems] ?? tabItems.index;

        return {
          headerShown: false,
          tabBarActiveTintColor: '#7C63E6',
          tabBarButton: HapticTab,
          tabBarInactiveTintColor: '#7B8092',
          tabBarLabelStyle: {
            fontFamily: 'SF Pro',
            fontSize: 11,
            fontWeight: '600',
          },
          tabBarStyle: {
            backgroundColor: '#FFFFFF',
            borderColor: '#ECE8FA',
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            height: 72,
            paddingBottom: 10,
            paddingTop: 8,
            position: 'absolute',
          },
          tabBarIcon: ({ color, focused }) => (
            <Ionicons color={color} name={focused ? names[1] : names[0]} size={22} />
          ),
        };
      }}>
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="explore" options={{ title: 'Mood' }} />
      <Tabs.Screen name="mood" options={{ title: 'Tools' }} />
      <Tabs.Screen name="progress" options={{ title: 'Progress' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}
