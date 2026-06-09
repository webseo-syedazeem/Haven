import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import {
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { AppFonts } from '@/constants/theme';

const backgroundImage = require('@/assets/images/4a78c0b5bcbe750563b0d0e3ecbe9951c1d0f0cc.png');

const CONNECTED_APPS = [
  {
    key: 'apple',
    name: 'Apple health',
    status: 'Connected',
    icon: require('@/assets/icons/dashbord-heart-icon.svg'),
    iconBg: '#FF005914',
    iconColor: '#FF0059',
  },
  {
    key: 'google',
    name: 'Google fit',
    status: 'Connected',
    icon: require('@/assets/icons/dashbord-flower-icon.svg'),
    iconBg: '#3770FC14',
    iconColor: '#3770FC',
  },
];

const PRIVACY_ACTIONS = [
  { key: 'permission', label: 'Manage permission' },
  { key: 'download',   label: 'Download my data' },
  { key: 'delete',     label: 'Delete my data' },
];

export default function PrivacyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <ImageBackground source={backgroundImage} resizeMode="cover" style={styles.screen}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ScrollView
          bounces={false}
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 100 }]}
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
          <Text style={styles.title}>Privacy</Text>
          <Text style={styles.subtitle}>Set Your daily reminder</Text>

          {/* Main Card */}
          <View style={styles.card}>

            {/* Connected data */}
            <Text style={styles.sectionTitle}>Connected data</Text>
            <View style={styles.connectedList}>
              {CONNECTED_APPS.map((app, index) => (
                <Pressable
                  key={app.key}
                  style={[
                    styles.connectedRow,
                    index < CONNECTED_APPS.length - 1 && styles.rowDivider,
                  ]}>
                  <View style={[styles.appIconCircle, { backgroundColor: app.iconBg }]}>
                    <Image
                      source={app.icon}
                      style={[styles.appIcon, { tintColor: app.iconColor }]}
                      contentFit="contain"
                    />
                  </View>
                  <View style={styles.appText}>
                    <Text style={styles.appName}>{app.name}</Text>
                    <Text style={styles.appStatus}>{app.status}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#8C8C8C" />
                </Pressable>
              ))}
            </View>

            {/* Divider */}
            <View style={styles.sectionDivider} />

            {/* Data & Privacy */}
            <Text style={styles.sectionTitle}>Data & Privacy</Text>
            <View style={styles.actionList}>
              {PRIVACY_ACTIONS.map((action, index) => (
                <Pressable
                  key={action.key}
                  style={[
                    styles.actionRow,
                    index < PRIVACY_ACTIONS.length - 1 && styles.rowDivider,
                  ]}>
                  <Text style={styles.actionLabel}>{action.label}</Text>
                  <Ionicons name="chevron-forward" size={16} color="#8C8C8C" />
                </Pressable>
              ))}
            </View>

          </View>

        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#C8BFEE' },
  safeArea: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingTop: 76 },

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
    fontSize: 34,
    fontWeight: '700',
    lineHeight: 42,
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
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },

  sectionTitle: {
    color: '#173F5F',
    fontFamily: AppFonts.sansSemiBold,
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 24,
    marginBottom: 12,
  },

  // Connected apps
  connectedList: { gap: 0 },
  connectedRow: {
    alignItems: 'center',
    flexDirection: 'row',
    minHeight: 72,
    paddingVertical: 8,
  },
  appIconCircle: {
    alignItems: 'center',
    borderRadius: 24,
    height: 48,
    justifyContent: 'center',
    marginRight: 14,
    width: 48,
  },
  appIcon: { height: 24, width: 24 },
  appText: { flex: 1 },
  appName: {
    color: '#173F5F',
    fontFamily: AppFonts.sansSemiBold,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 22,
  },
  appStatus: {
    color: '#2EB668',
    fontFamily: AppFonts.sansMedium,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 2,
  },

  sectionDivider: {
    backgroundColor: 'rgba(23,63,95,0.08)',
    height: 1,
    marginVertical: 16,
  },

  // Privacy actions
  actionList: { gap: 0 },
  actionRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 56,
    paddingVertical: 8,
  },
  actionLabel: {
    color: '#173F5F',
    fontFamily: AppFonts.sansMedium,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 22,
  },
  rowDivider: {
    borderBottomColor: 'rgba(23,63,95,0.07)',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
