import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';

import { apiClient } from '@/lib/api/client';
import { AppFonts } from '@/constants/theme';
import { SaveSuccessModal } from '@/components/profile/SaveSuccessModal';
import { requestNotificationPermission, scheduleNotifications } from '@/lib/notifications';

const backgroundImage = require('@/assets/images/29dd3fece0aba2a99777eeac0658bccbe2ed402a.png');

function InnerShadow() {
  return (
    <View pointerEvents="none" style={styles.innerShadow}>
      <LinearGradient
        colors={['rgba(255, 255, 255, 0.5)', 'rgba(255, 255, 255, 0)']}
        end={{ x: 0, y: 1 }}
        start={{ x: 0, y: 0 }}
        style={styles.innerShadowTop}
      />
      <LinearGradient
        colors={['rgba(255, 255, 255, 0.5)', 'rgba(255, 255, 255, 0)']}
        end={{ x: 1, y: 0 }}
        start={{ x: 0, y: 0 }}
        style={styles.innerShadowLeft}
      />
    </View>
  );
}

// ── Notification rows config ──────────────────────────────────────────────────
const NOTIFICATIONS = [
  {
    key: 'morning_reminder',
    timeKey: 'morning_reminder_time',
    label: 'Morning Reminder',
    defaultTime: '9:00',
    icon: require('@/assets/icons/dashbord-morning-icon.svg'),
    iconColor: '#FFC43D',
    iconBg: '#FFC1031A',
  },
  {
    key: 'mood_checkin',
    timeKey: 'mood_checkin_time',
    label: 'Mood check-in',
    defaultTime: '6:00pm',
    icon: require('@/assets/icons/dashbord-clock-icon.svg'),
    iconColor: '#7B61FF',
    iconBg: '#7B61FF14',
  },
  {
    key: 'checklist_reminder',
    timeKey: 'checklist_reminder_time',
    label: 'Checklist Reminder',
    defaultTime: 'Daily',
    icon: require('@/assets/icons/dashbord-speed-icon.svg'),
    iconColor: '#3770FC',
    iconBg: '#3770FC14',
  },
  {
    key: 'evening_wind_down',
    timeKey: 'evening_wind_down_time',
    label: 'Evening wind down',
    defaultTime: '9:00 PM',
    icon: require('@/assets/icons/dashbord-clock-icon.svg'),
    iconColor: '#7B61FF',
    iconBg: '#7B61FF14',
  },
  {
    key: 'soundscape_reminder',
    timeKey: 'soundscape_reminder_time',
    label: 'Soundscape Reminder',
    defaultTime: 'Custom time',
    icon: require('@/assets/icons/dashbord-breathing-icon.svg'),
    iconColor: '#2EB668',
    iconBg: '#28B92A14',
  },
] as const;

type NotifKey = (typeof NOTIFICATIONS)[number]['key'];

type NotifState = {
  [K in NotifKey]: boolean;
} & {
  morning_reminder_time: string;
  mood_checkin_time: string;
  checklist_reminder_time: string;
  evening_wind_down_time: string;
  soundscape_reminder_time: string;
};

const DEFAULT_STATE: NotifState = {
  morning_reminder: false,
  morning_reminder_time: '09:00',
  mood_checkin: false,
  mood_checkin_time: '18:00',
  checklist_reminder: false,
  checklist_reminder_time: '16:00',
  evening_wind_down: false,
  evening_wind_down_time: '21:00',
  soundscape_reminder: false,
  soundscape_reminder_time: '22:00',
};

// ── API helpers ───────────────────────────────────────────────────────────────
async function fetchNotifications(): Promise<NotifState | null> {
  const data = await apiClient<any>('/api/notifications');
  return data.data?.notifications ?? null;
}

async function saveNotifications(payload: Partial<NotifState>): Promise<void> {
  try {
    await apiClient<any>('/api/notifications', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  } catch (err: any) {
    if (err?.message?.includes('already saved')) {
      await apiClient<any>('/api/notifications', {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      return;
    }
    throw err;
  }
}

// ── Screen ────────────────────────────────────────────────────────────────────
export default function NotificationScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const [state, setState] = useState<NotifState>(DEFAULT_STATE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSavedModal, setShowSavedModal] = useState(false);

  useEffect(() => {
    fetchNotifications()
      .then((data) => {
        if (data) setState({ ...DEFAULT_STATE, ...data });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function toggleNotif(key: NotifKey) {
    setState((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      // Request permission first
      const granted = await requestNotificationPermission();
      if (!granted) {
        Alert.alert(
          'Permission Required',
          'Please allow notifications in your phone settings to receive reminders.',
        );
        setSaving(false);
        return;
      }

      await saveNotifications(state);
      await scheduleNotifications(state);
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      setShowSavedModal(true);
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setSaving(false);
    }
  }

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
            <Ionicons color="#000000" name="chevron-back" size={18} />
          </Pressable>

          {/* Header */}
          <Text style={styles.title}>Notification</Text>
          <Text style={styles.subtitle}>Set Your daily reminder.</Text>

          {loading ? (
            <ActivityIndicator color="#7B61FF" size="large" style={{ marginTop: 40 }} />
          ) : (
            <View style={styles.list}>
              {NOTIFICATIONS.map((n, index) => (
                <View
                  key={n.key}
                  style={[
                    styles.row,
                    index < NOTIFICATIONS.length - 1 && styles.rowDivider,
                  ]}>
                  {/* Icon */}
                  <View style={[styles.iconCircle, { backgroundColor: n.iconBg }]}>
                    <Image
                      source={n.icon}
                      style={[styles.icon, { tintColor: n.iconColor }]}
                      contentFit="contain"
                    />
                  </View>

                  {/* Text */}
                  <View style={styles.rowText}>
                    <Text style={styles.rowTitle}>{n.label}</Text>
                    <Text style={styles.rowTime}>{n.defaultTime}</Text>
                  </View>

                  {/* Toggle */}
                  <Switch
                    value={state[n.key]}
                    onValueChange={() => toggleNotif(n.key)}
                    trackColor={{ false: '#E5E5EA', true: '#7B61FF' }}
                    thumbColor="#FFFFFF"
                    ios_backgroundColor="#E5E5EA"
                  />
                </View>
              ))}
            </View>
          )}

          {/* Save button */}
          <Pressable
            accessibilityRole="button"
            onPress={handleSave}
            disabled={saving}
            style={({ pressed }) => [
              styles.saveWrap,
              pressed && !saving && styles.pressed,
            ]}>
            <LinearGradient
              colors={['#6D67CE', '#528AE1', '#6AAFE9']}
              end={{ x: 1, y: 0.58 }}
              locations={[0.0254, 0.5327, 0.9044]}
              start={{ x: 0, y: 0.42 }}
              style={styles.saveButton}>
              <InnerShadow />
              {saving ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.saveText}>Save</Text>
              )}
            </LinearGradient>
          </Pressable>

        </ScrollView>
        <SaveSuccessModal
          visible={showSavedModal}
          title="Notifications saved"
          message="Your reminder settings have been updated successfully."
          onClose={() => setShowSavedModal(false)}
        />
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

  list: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 16,
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
    minHeight: 76,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  rowDivider: {
    borderBottomColor: 'rgba(23,63,95,0.07)',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconCircle: {
    alignItems: 'center',
    borderRadius: 24,
    height: 48,
    justifyContent: 'center',
    marginRight: 14,
    width: 48,
  },
  icon: { height: 24, width: 24 },
  rowText: { flex: 1 },
  rowTitle: {
    color: '#173F5F',
    fontFamily: AppFonts.sansSemiBold,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 22,
  },
  rowTime: {
    color: '#8C8C8C',
    fontFamily: AppFonts.sansRegular,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 1,
  },

  saveWrap: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: '#528ae1',
    borderRadius: 27,
    height: 54,
    justifyContent: 'center',
    marginTop: 24,
    maxWidth: 348,
    overflow: 'hidden',
    width: '100%',
  },
  saveButton: {
    alignItems: 'center',
    height: '100%',
    justifyContent: 'center',
    width: '100%',
  },
  saveText: {
    color: '#ffffff',
    fontFamily: AppFonts.sansMedium,
    fontSize: 18,
    fontWeight: '500',
    letterSpacing: 0,
    lineHeight: 26,
    textAlign: 'center',
  },
  innerShadow: {
    ...StyleSheet.absoluteFillObject,
  },
  innerShadowLeft: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    top: 4,
    width: 16,
  },
  innerShadowTop: {
    height: 16,
    left: 4,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  pressed: {
    opacity: 0.86,
    transform: [{ scale: 0.99 }],
  },
});
