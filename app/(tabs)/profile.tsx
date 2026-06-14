import { Ionicons } from '@expo/vector-icons';
import { useRouter, type Href } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppFonts } from '@/constants/theme';
import { getCurrentUser } from '@/lib/haven-api';

const backgroundImage = require('@/assets/images/4a78c0b5bcbe750563b0d0e3ecbe9951c1d0f0cc.png');

const planRows = [
  { title: 'Goals', subtitle: 'Set goal', icon: 'radio-button-on-outline', route: '/profile/goals' },
  { title: 'Favourite tools', subtitle: 'Breathing, grounding', icon: 'construct-outline', route: '/profile/favourite-tools' },
  { title: 'Stress Profile', subtitle: 'View Triggers', icon: 'happy-outline', route: '/profile/stress-profile' },
] as const;

const settingRows = [
  { title: 'Notification', subtitle: 'Daily Reminders', icon: 'notifications-outline', route: '/profile/notification' },
  { title: 'Privacy', subtitle: 'Your Data is private', icon: 'shield-checkmark-outline', route: '/profile/privacy' },
  { title: 'Account Setting', subtitle: 'Your Data is private', icon: 'settings-outline', route: '/profile/account-setting' },
] as const;

type ProfileRow = (typeof planRows)[number] | (typeof settingRows)[number];
type ProfileUser = Record<string, unknown>;

function getStringValue(source: unknown, keys: string[]) {
  if (!source || typeof source !== 'object') {
    return '';
  }

  const record = source as Record<string, unknown>;

  for (const key of keys) {
    const value = record[key];

    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }

  return '';
}

function getNestedRecord(source: unknown, key: string) {
  if (!source || typeof source !== 'object') {
    return null;
  }

  const value = (source as Record<string, unknown>)[key];

  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null;
}

function unwrapCurrentUser(response: unknown) {
  const root = response && typeof response === 'object' ? (response as Record<string, unknown>) : {};
  const data = getNestedRecord(root, 'data');

  return (
    getNestedRecord(data, 'user') ??
    getNestedRecord(root, 'user') ??
    getNestedRecord(data, 'profile') ??
    getNestedRecord(root, 'profile') ??
    root
  );
}

function getDisplayName(user: ProfileUser | null) {
  const profile = getNestedRecord(user, 'profile');
  const metadata = getNestedRecord(user, 'user_metadata');
  const firstName = getStringValue(user, ['first_name', 'firstName']);
  const lastName = getStringValue(user, ['last_name', 'lastName']);
  const profileFirstName = getStringValue(profile, ['first_name', 'firstName']);
  const profileLastName = getStringValue(profile, ['last_name', 'lastName']);
  const joinedName = [firstName || profileFirstName, lastName || profileLastName]
    .filter(Boolean)
    .join(' ')
    .trim();

  if (joinedName) {
    return joinedName;
  }

  const directName = getStringValue(user, ['name', 'full_name', 'fullName', 'display_name', 'username']);
  const metadataName = getStringValue(metadata, ['name', 'full_name', 'fullName', 'display_name']);
  const profileName = getStringValue(profile, ['name', 'full_name', 'fullName', 'display_name', 'username']);
  const email = getStringValue(user, ['email']);

  return directName || metadataName || profileName || (email ? email.split('@')[0] : 'Joy');
}

function getTimeGreeting() {
  const hour = new Date().getHours();

  if (hour < 12) {
    return 'Good morning';
  }

  if (hour < 17) {
    return 'Good afternoon';
  }

  if (hour < 21) {
    return 'Good evening';
  }

  return 'Good night';
}

function SectionCard({ label, rows }: { label: string; rows: readonly ProfileRow[] }) {
  const router = useRouter();
  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>{label}</Text>
      <View style={styles.card}>
        {rows.map((row, index) => (
          <TouchableOpacity
            key={row.title}
            activeOpacity={0.75}
            onPress={() => router.push(row.route as Href)}
            style={[styles.row, index < rows.length - 1 && styles.rowDivider]}>
            <View style={styles.iconCircle}>
              <Ionicons name={row.icon as keyof typeof Ionicons.glyphMap} size={20} color="#6339FB" />
            </View>
            <View style={styles.rowCopy}>
              <Text style={styles.rowTitle}>{row.title}</Text>
              <Text style={styles.rowSubtitle}>{row.subtitle}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#AAAAAA" />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const [displayName, setDisplayName] = useState('Joy');
  const [greeting, setGreeting] = useState(getTimeGreeting());

  useEffect(() => {
    let isMounted = true;

    setGreeting(getTimeGreeting());

    getCurrentUser()
      .then((response) => {
        if (!isMounted) {
          return;
        }

        const user = unwrapCurrentUser(response);
        setDisplayName(getDisplayName(user));
      })
      .catch(() => {
        if (isMounted) {
          setDisplayName('Joy');
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <ImageBackground source={backgroundImage} resizeMode="cover" style={styles.screen}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ScrollView
          bounces
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 120 }]}
          overScrollMode="always"
          showsVerticalScrollIndicator={false}
          style={styles.scrollView}>
          <Text style={styles.greeting}>{`${greeting},\n${displayName}`}</Text>
          <SectionCard label="Your Plan" rows={planRows} />
          <SectionCard label="Setting" rows={settingRows} />
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#C8BFEE' },
  safeArea: { flex: 1 },
  content: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 60,
  },
  greeting: {
    color: '#173F5F',
    fontFamily: AppFonts.displayBold,
    fontSize: 34,
    fontWeight: '700',
    lineHeight: 42,
    marginBottom: 28,
  },
  section: { marginBottom: 20 },
  sectionLabel: {
   
    fontFamily: AppFonts.sansMedium,
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.2,
    lineHeight: 20,
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.90)',
    borderRadius: 14,
    overflow: 'hidden',
    paddingHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    minHeight: 72,
    paddingHorizontal: 12,
  },
  rowDivider: {
    borderBottomColor: 'rgba(23,63,95,0.07)',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconCircle: {
    alignItems: 'center',
    backgroundColor: 'rgba(123,97,255,0.10)',
    borderRadius: 22,
    height: 44,
    justifyContent: 'center',
    marginRight: 14,
    width: 44,
  },
  rowCopy: { flex: 1 },
  rowTitle: {
    color: '#1A1A1A',
    fontFamily: AppFonts.sansSemiBold,
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 22,
  },
  rowSubtitle: {
    color: '#9A9A9A',
    fontFamily: AppFonts.sansRegular,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 1,
  },
  scrollView: {
    flex: 1,
  },
});
