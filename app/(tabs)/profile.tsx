import { Ionicons } from '@expo/vector-icons';
import { useRouter, type Href } from 'expo-router';
import {
  ImageBackground,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppFonts } from '@/constants/theme';

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

  return (
    <ImageBackground source={backgroundImage} resizeMode="cover" style={styles.screen}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={[styles.content, { paddingBottom: insets.bottom }]}>
          <Text style={styles.greeting}>{'Good morning,\nJon'}</Text>
          <SectionCard label="Your Plan" rows={planRows} />
          <SectionCard label="Setting" rows={settingRows} />
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#C8BFEE' },
  safeArea: { flex: 1 },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 28,
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
});