import { Ionicons } from '@expo/vector-icons';
import { useRouter, type Href } from 'expo-router';
import { useState } from 'react';
import {
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { SwipeTabsWrapper } from '@/components/navigation/SwipeTabsWrapper';
import { AppFonts } from '@/constants/theme';
import { AvatarPreview } from '@/components/profile/AvatarPreview';
import { ProfileAvatar } from '@/components/profile/ProfileAvatar';
import { useUser } from '@/hooks/useUser';
import { getDisplayName } from '@/lib/api/user';
import { getUkGreeting } from '@/lib/utils/greeting';

const backgroundImage = require('@/assets/images/4a78c0b5bcbe750563b0d0e3ecbe9951c1d0f0cc.png');

const settingRows = [
  { title: 'Notification', subtitle: 'Daily Reminders', icon: 'notifications-outline', route: '/profile/notification' },
  { title: 'Account Setting', subtitle: 'Your Data is private', icon: 'settings-outline', route: '/profile/account-setting' },
] as const;

type ProfileRow = (typeof settingRows)[number];

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
  const { data: me } = useUser();
  const [avatarPreviewVisible, setAvatarPreviewVisible] = useState(false);
  const greeting = getUkGreeting();
  const displayName = getDisplayName(me) || 'there';
  const profileImageUrl = me?.profile?.profile_image_url ?? '';

  return (
    <SwipeTabsWrapper>
      <ImageBackground source={backgroundImage} resizeMode="cover" style={styles.screen}>
        <SafeAreaView edges={['top']} style={styles.safeArea}>
          <ScrollView
            bounces
            contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 112 }]}
            overScrollMode="always"
            showsVerticalScrollIndicator={false}
            style={styles.scrollView}>
          <View style={styles.headerRow}>
            <View style={styles.greetingBlock}>
              <Text style={styles.greetingLine}>{`${greeting},`}</Text>
              <Text style={styles.greetingName}>{displayName}</Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.86}
              disabled={!profileImageUrl}
              onPress={() => {
                if (profileImageUrl) {
                  setAvatarPreviewVisible(true);
                }
              }}>
              <ProfileAvatar
                imageUrl={profileImageUrl}
                size={56}
                style={styles.avatarRing}
              />
            </TouchableOpacity>
          </View>
          <SectionCard label="Setting" rows={settingRows} />
          </ScrollView>
        </SafeAreaView>
        <AvatarPreview
          visible={avatarPreviewVisible}
          imageUrl={profileImageUrl}
          onClose={() => setAvatarPreviewVisible(false)}
        />
      </ImageBackground>
    </SwipeTabsWrapper>
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
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 28,
  },
  greetingBlock: {
    flex: 1,
    paddingRight: 12,
  },
  greetingLine: {
    color: '#173F5F',
    fontFamily: AppFonts.sansMedium,
    fontSize: 18,
    fontWeight: '500',
    lineHeight: 26,
    opacity: 0.85,
  },
  greetingName: {
    color: '#173F5F',
    fontFamily: AppFonts.displayBold,
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 36,
    marginTop: 2,
  },
  avatarRing: {},
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
