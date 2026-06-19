import { Ionicons } from '@expo/vector-icons';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Tabs } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { AppFonts } from '@/constants/theme';

const menuIcons: Record<string, keyof typeof Ionicons.glyphMap> = {
  index: 'home-outline',
  mood: 'happy-outline',
  progress: 'stats-chart-outline',
  profile: 'person-outline',
};

function ToolsTabIcon({ color }: { color: string }) {
  return (
    <Svg height={24} style={styles.tabBarIcon} viewBox="0 0 18 21" width={24}>
      <Path
        clipRule="evenodd"
        d="M11.7139 2.343C11.0319 1.293 10.1669 0.47 9.45986 0.113C9.31779 0.0390376 9.16003 0.000283905 8.99986 1.22525e-08C8.83978 -2.50455e-05 8.68202 0.0383847 8.53986 0.112C7.83286 0.47 6.96886 1.292 6.28586 2.343C5.82604 3.04843 5.47762 3.82049 5.25286 4.632C4.53086 4.184 3.74586 3.862 2.81586 3.552C2.68143 3.50729 2.53904 3.49166 2.39811 3.50613C2.25719 3.52061 2.12094 3.56486 1.99841 3.63596C1.87588 3.70706 1.76985 3.80339 1.68735 3.91855C1.60485 4.03372 1.54776 4.1651 1.51986 4.304C1.26286 5.589 1.10686 6.862 1.32786 8.111C1.46215 8.88589 1.74501 9.6275 2.16086 10.295C1.55373 10.5111 0.976982 10.8045 0.444864 11.168C0.253967 11.2954 0.112707 11.4846 0.044789 11.7038C-0.0231285 11.9231 -0.0135688 12.159 0.0718639 12.372C0.361864 13.095 1.09186 13.875 2.43986 14.526C3.65586 15.113 5.42886 15.624 7.99986 15.908V18C7.99986 18.2652 8.10522 18.5196 8.29276 18.7071C8.48029 18.8946 8.73465 19 8.99986 19C9.26508 19 9.51943 18.8946 9.70697 18.7071C9.89451 18.5196 9.99986 18.2652 9.99986 18V15.908C12.5719 15.624 14.3439 15.112 15.5599 14.526C16.9069 13.876 17.6389 13.096 17.9289 12.372C18.0142 12.1589 18.0236 11.9229 17.9555 11.7036C17.8874 11.4844 17.7459 11.2953 17.5549 11.168C17.0227 10.8045 16.446 10.5111 15.8389 10.295C16.2699 9.596 16.5389 8.872 16.6719 8.111C16.8919 6.861 16.7379 5.589 16.4809 4.304C16.453 4.16499 16.3959 4.03349 16.3133 3.91824C16.2307 3.80298 16.1246 3.7066 16.002 3.63548C15.8793 3.56437 15.7429 3.52015 15.6019 3.50575C15.4608 3.49136 15.3184 3.50713 15.1839 3.552C14.2539 3.862 13.4699 4.184 12.7469 4.632C12.5221 3.82049 12.1737 3.04843 11.7139 2.343ZM9.99986 13.895C12.2939 13.625 13.7659 13.171 14.6899 12.725C14.9542 12.6007 15.2072 12.4535 15.4459 12.285C14.7629 12 14.3009 12 14.0299 12H13.9999C13.8021 12 13.6088 11.9413 13.4444 11.8314C13.28 11.7215 13.1519 11.5654 13.0762 11.3827C13.0005 11.2 12.9807 10.9989 13.0193 10.805C13.0578 10.611 13.1531 10.4329 13.2929 10.293C14.1619 9.424 14.5539 8.606 14.7029 7.763C14.8049 7.187 14.7979 6.566 14.7129 5.863C13.9089 6.21 13.3099 6.604 12.7069 7.207C12.567 7.34681 12.3888 7.44202 12.1949 7.48058C12.0009 7.51915 11.7999 7.49935 11.6172 7.42368C11.4345 7.34801 11.2783 7.21987 11.1685 7.05546C11.0586 6.89105 10.9999 6.69775 10.9999 6.5C10.9999 5.339 10.5839 4.275 10.0359 3.432C9.74635 2.98195 9.39792 2.57265 8.99986 2.215C8.6018 2.57265 8.25338 2.98195 7.96386 3.432C7.41586 4.275 6.99986 5.34 6.99986 6.5C6.99982 6.69775 6.94115 6.89105 6.83127 7.05546C6.72138 7.21987 6.56522 7.34801 6.38252 7.42368C6.19982 7.49935 5.99879 7.51915 5.80483 7.48058C5.61088 7.44202 5.43272 7.34681 5.29286 7.207C4.68986 6.604 4.09186 6.21 3.28786 5.862C3.20186 6.566 3.19586 7.187 3.29786 7.764C3.44586 8.606 3.83786 9.424 4.70786 10.294C4.84739 10.434 4.94232 10.6121 4.98066 10.806C5.01899 10.9999 4.99903 11.2008 4.92327 11.3833C4.84752 11.5658 4.71938 11.7218 4.55503 11.8316C4.39068 11.9414 4.19749 12 3.99986 12H3.96986C3.69986 12 3.23686 11.999 2.55386 12.285C2.74486 12.422 2.99186 12.571 3.30986 12.725C4.23386 13.171 5.70586 13.625 7.99986 13.895V11C7.99986 10.7348 8.10522 10.4804 8.29276 10.2929C8.48029 10.1054 8.73465 10 8.99986 10C9.26508 10 9.51943 10.1054 9.70697 10.2929C9.89451 10.4804 9.99986 10.7348 9.99986 11V13.895Z"
        fill={color}
        fillRule="evenodd"
      />
    </Svg>
  );
}

function FloatingTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.floatingTabBar, { bottom: insets.bottom + 8 }]}>
      {state.routes.map((route, index) => {
        const options = descriptors[route.key]?.options;

        if ((options as { href?: string | null } | undefined)?.href === null) {
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
          const iconColor = isFocused ? '#3770FC' : '#8C8C8C';

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
            {route.name === 'tools' ? (
              <ToolsTabIcon color={iconColor} />
            ) : (
              <Ionicons name={icon} size={22} color={iconColor} style={styles.tabBarIcon} />
            )}
            <Text style={[styles.tabBarLabel, isFocused && styles.tabBarLabelActive]}>
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
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
    </Tabs>
  );
}

const styles = StyleSheet.create({
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
