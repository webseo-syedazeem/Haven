import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppFonts } from '@/constants/theme';
import { apiClient } from '@/lib/api/client';
import { supabase } from '@/lib/supabase';

const SETTINGS_ROWS = [
  {
    key: 'name',
    label: 'Name',
    icon: 'person-outline' as const,
  },
  {
    key: 'email',
    label: 'Email adress',
    icon: 'mail-outline' as const,
  },
  {
    key: 'password',
    label: 'Password',
    icon: 'lock-closed-outline' as const,
  },
];

export default function AccountSettingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  async function handleLogout() {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiClient('/api/logout', { method: 'POST' });
          } catch {}
          await supabase.auth.signOut();
          router.replace('/welcome');
        },
      },
    ]);
  }

function handleRowPress(key: string) {
  if (key === 'name') router.push('/profile/edit-name');
  else if (key === 'email') router.push('/profile/change-email');
  else if (key === 'password') router.push('/profile/update-password');
}

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <ScrollView
        bounces={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}>

        {/* Back */}
        <Pressable
          accessibilityLabel="Go back"
          hitSlop={12}
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
          <Ionicons name="chevron-back" size={18} color="#000000" />
        </Pressable>

        {/* Header */}
        <Text style={styles.title}>Account Setting</Text>
        <Text style={styles.subtitle}>Set Your daily reminder</Text>

        {/* Settings rows */}
        <View style={styles.card}>
          {SETTINGS_ROWS.map((row, index) => (
            <Pressable
              key={row.key}
              onPress={() => handleRowPress(row.key)}
              style={({ pressed }) => [
                styles.row,
                index < SETTINGS_ROWS.length - 1 && styles.rowDivider,
                pressed && styles.rowPressed,
              ]}>
              <View style={styles.iconCircle}>
                <Ionicons name={row.icon} size={20} color="#6339FB" />
              </View>
              <Text style={styles.rowLabel}>{row.label}</Text>
              <Ionicons name="chevron-forward" size={16} color="#8C8C8C" />
            </Pressable>
          ))}
        </View>

        {/* Account Action */}
        <Text style={styles.sectionLabel}>Account Action</Text>
        <View style={styles.card}>
          <Pressable
            onPress={handleLogout}
            style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}>
            <View style={[styles.iconCircle, styles.logoutIconCircle]}>
              <Ionicons name="log-out-outline" size={20} color="#FF0059" />
            </View>
            <Text style={styles.logoutLabel}>Logout</Text>
          </Pressable>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F0EEF8',
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 76,
  },

  backButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 16,
    height: 32,
    justifyContent: 'center',
    left: 18,
    position: 'absolute',
    top: 15,
    width: 32,
    zIndex: 3,
  },
  pressed: { opacity: 0.86, transform: [{ scale: 0.99 }] },

  title: {
    color: '#173F5F',
    fontFamily: AppFonts.displayBold,
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 40,
    marginBottom: 6,
  },
  subtitle: {
    color: '#8C8C8C',
    fontFamily: AppFonts.sansRegular,
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 24,
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },

  row: {
    alignItems: 'center',
    flexDirection: 'row',
    minHeight: 70,
    paddingHorizontal: 16,
  },
  rowDivider: {
    borderBottomColor: 'rgba(23,63,95,0.07)',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowPressed: {
    backgroundColor: 'rgba(99,57,251,0.04)',
  },

  iconCircle: {
    alignItems: 'center',
    backgroundColor: '#7B61FF14',
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    marginRight: 14,
    width: 40,
  },
  logoutIconCircle: {
    backgroundColor: '#FF005914',
  },

  rowLabel: {
    color: '#173F5F',
    flex: 1,
    fontFamily: AppFonts.sansSemiBold,
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 22,
  },
  logoutLabel: {
    color: '#FF0059',
    flex: 1,
    fontFamily: AppFonts.sansSemiBold,
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 22,
  },

  sectionLabel: {
    color: '#6339FB',
    fontFamily: AppFonts.sansSemiBold,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.3,
    marginBottom: 8,
    paddingHorizontal: 2,
  },
});
