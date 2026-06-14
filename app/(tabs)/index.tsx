import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { useCallback, useEffect, useState } from 'react';
import {
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, {
  Circle,
  Defs,
  LinearGradient as SvgLinearGradient,
  Stop,
} from 'react-native-svg';

import { AppFonts } from '@/constants/theme';
import { getCurrentUser } from '@/lib/haven-api';
import { apiClient } from '@/lib/api/client';
import { getTodayChecklist } from '@/services/checklistService';

const dailyEaseProgress = 74;
const progressSize = 112;
const progressStroke = 8;
const progressRadius = (progressSize - progressStroke) / 2;
const progressCircumference = 2 * Math.PI * progressRadius;
const progressPercent = dailyEaseProgress / 100;
const progressOffset = progressCircumference * (1 - progressPercent);
const progressAngle = progressPercent * 360 - 90;
const progressDotRadius = 8;
const progressDotCenter = progressSize / 2;
const progressDotDistance = progressRadius;
const progressDotX =
  progressDotCenter + progressDotDistance * Math.cos((progressAngle * Math.PI) / 180);
const progressDotY =
  progressDotCenter + progressDotDistance * Math.sin((progressAngle * Math.PI) / 180);

const backgroundImage = require('@/assets/images/dashbord-background-img.png');
const avatarImage = require('@/assets/images/profile-pic.jpg');
const nextStepIcon = require('@/assets/icons/dashbord-flower-icon.svg');
const stressHeartIcon = require('@/assets/icons/dashbord-heart-icon.svg');
const resetClockIcon = require('@/assets/icons/dashbord-clock-icon.svg');

type DashboardUser = Record<string, unknown>;

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

function getDisplayName(user: DashboardUser | null) {
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

function getAvatarUri(user: DashboardUser | null) {
  const profile = getNestedRecord(user, 'profile');
  const metadata = getNestedRecord(user, 'user_metadata');

  return (
    getStringValue(user, [
      'avatar_url',
      'avatarUrl',
      'profile_image',
      'profileImage',
      'profile_image_url',
      'profileImageUrl',
      'image_url',
      'imageUrl',
      'photo_url',
      'photoUrl',
      'picture',
    ]) ||
    getStringValue(profile, [
      'avatar_url',
      'avatarUrl',
      'profile_image',
      'profileImage',
      'profile_image_url',
      'profileImageUrl',
      'image_url',
      'imageUrl',
      'photo_url',
      'photoUrl',
      'picture',
    ]) ||
    getStringValue(metadata, ['avatar_url', 'picture', 'photo_url'])
  );
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

const todayPlans = [
  {
    icon: require('@/assets/icons/dashbord-morning-icon.svg'),
    iconBackground: '#FFC1031A',
    iconColor: '#FFC43D',
    title: 'Morning Sunlight',
    subtitle: 'Boost mood and regulate your body check',
    meta: '10 min',
    apiName: 'Morning Sunlight',
  },
  {
    icon: require('@/assets/icons/dashbord-breathing-icon.svg'),
    iconBackground: '#3770FC14',
    iconColor: '#3770FC',
    title: 'Movement',
    subtitle: 'A short walk to refresh',
    meta: '5 min',
    apiName: 'Movement',
  },
  {
    icon: require('@/assets/icons/dashbord-speed-icon.svg'),
    iconBackground: '#28B92A14',
    iconColor: '#2EB668',
    title: 'Box Breathing',
    subtitle: 'Clam Your mind',
    meta: '3 min',
    apiName: 'Breathwork',
  },
];

export default function HomeScreen() {
  const router = useRouter();
  const [avatarUri, setAvatarUri] = useState('');
  const [completedChecklistTasks, setCompletedChecklistTasks] = useState<string[]>([]);
  const [displayName, setDisplayName] = useState('Joy');
  const [greeting, setGreeting] = useState(getTimeGreeting());

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      getTodayChecklist()
        .then((checklist) => {
          if (!isActive) {
            return;
          }

          const completedTasks = Array.isArray(checklist?.completed_tasks)
            ? checklist.completed_tasks.filter((task): task is string => typeof task === 'string')
            : [];

          setCompletedChecklistTasks(completedTasks);
        })
        .catch(() => {
          if (isActive) {
            setCompletedChecklistTasks([]);
          }
        });

      return () => {
        isActive = false;
      };
    }, [])
  );

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
        setAvatarUri(getAvatarUri(user));
      })
      .catch(() => {
        if (isMounted) {
          setDisplayName('Joy');
          setAvatarUri('');
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleStartReset() {
    try {
      const res = await apiClient<any>('/api/breathing', {
        method: 'POST',
        body: JSON.stringify({ type: 'Physiological Sigh' }),
      });
      const session = res?.data?.session;

      router.push({
        pathname: '/tools/breathing-session',
        params: {
          sessionId: session?.id ?? '',
          name: 'Physiological Sigh',
          inhale: String(session?.inhale ?? 4),
          hold1: String(session?.hold1 ?? 2),
          exhale: String(session?.exhale ?? 8),
          hold2: String(session?.hold2 ?? 0),
          total: String(session?.total_duration_seconds ?? 126),
        },
      });
    } catch {
      router.push({
        pathname: '/tools/breathing-session',
        params: {
          sessionId: '',
          name: 'Physiological Sigh',
          inhale: '4',
          hold1: '2',
          exhale: '8',
          hold2: '0',
          total: '126',
        },
      });
    }
  }

  function isChecklistTaskCompleted(taskName: string) {
    return completedChecklistTasks.includes(taskName);
  }

  return (
    <ImageBackground
      source={backgroundImage}
      resizeMode="cover"
      imageStyle={styles.backgroundImage}
      style={styles.screen}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ScrollView
          bounces={false}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <View>
              <Text style={styles.greeting}>{greeting}, {displayName}</Text>
              <Text style={styles.subtitle}>Small stress today, stronger you{'\n'}tomorrow</Text>
            </View>

            <View style={styles.avatarRing}>
              <Image
                source={avatarUri ? { uri: avatarUri } : avatarImage}
                style={styles.avatar}
                contentFit="cover"
              />
            </View>
          </View>

          <View style={styles.easeCard}>
            <View style={styles.easeCopy}>
              <Text style={styles.easeTitle}>
                You are building calm,{'\n'}and consistency. Keep{'\n'}going!
              </Text>
            </View>

            <View style={styles.easeMeter}>
              <Text style={styles.easeLabel}>Daily Ease</Text>
              <View style={styles.progressWrap}>
                <Svg width={progressSize} height={progressSize} viewBox={`0 0 ${progressSize} ${progressSize}`}>
                  <Defs>
                    <SvgLinearGradient id="dailyEaseGradient" x1="0" y1="0" x2="1" y2="1">
                      <Stop offset="0" stopColor="#70D48A" />
                      <Stop offset="0.42" stopColor="#F9F4F0" />
                      <Stop offset="1" stopColor="#7863DC" />
                    </SvgLinearGradient>
                  </Defs>
                  <Circle
                    cx={progressDotCenter}
                    cy={progressDotCenter}
                    r={progressRadius}
                    stroke="#FFFFFF"
                    strokeWidth={progressStroke}
                    fill="transparent"
                  />
                  <Circle
                    cx={progressDotCenter}
                    cy={progressDotCenter}
                    r={progressRadius}
                    stroke="url(#dailyEaseGradient)"
                    strokeWidth={progressStroke}
                    fill="transparent"
                    strokeDasharray={`${progressCircumference} ${progressCircumference}`}
                    strokeDashoffset={progressOffset}
                    strokeLinecap="round"
                    rotation="-90"
                    origin={`${progressDotCenter}, ${progressDotCenter}`}
                  />
                </Svg>
                <View
                  style={[
                    styles.progressDot,
                    {
                      left: progressDotX - progressDotRadius,
                      top: progressDotY - progressDotRadius,
                    },
                  ]}
                />
              </View>
              <View style={styles.progressCenter}>
                <Text style={styles.progressValue}>{dailyEaseProgress}</Text>
                <Text style={styles.progressCaption}>Supported</Text>
              </View>
            </View>
          </View>

          <View style={styles.nextCard}>
            <View style={styles.nextIconWrap}>
              <Image source={nextStepIcon} style={styles.nextIcon} contentFit="contain" />
            </View>
            <View style={styles.nextCopy}>
              <Text style={styles.nextTitle}>Your next best step</Text>
              <Text style={styles.nextSubtitle}>Box breathing{'\n'}5 min. Reduce stress</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push('/tools/breathing')}
              style={({ pressed }) => pressed && styles.pressed}>
              <LinearGradient
                colors={['#7E5EFB', '#6AAFE9']}
                start={{ x: 1, y: 0.5 }}
                end={{ x: 0, y: 0.5 }}
                style={styles.startButton}>
                <Text style={styles.startText}>Start Now</Text>
              </LinearGradient>
            </Pressable>
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Today’s Plan</Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push('/tools/checklist')}
              style={({ pressed }) => pressed && styles.pressed}>
              <Text style={styles.viewAll}>View All</Text>
            </Pressable>
          </View>

          <View style={styles.planCard}>
            {todayPlans.map((plan, index) => (
              <View
                key={`${plan.title}-${plan.icon}`}
                style={[styles.planRow, index < todayPlans.length - 1 && styles.planDivider]}>
                <View style={[styles.planIconWrap, { backgroundColor: plan.iconBackground }]}>
                  <Image
                    source={plan.icon}
                    style={[styles.planIcon, { tintColor: plan.iconColor }]}
                    contentFit="contain"
                  />
                </View>
                <View style={styles.planCopy}>
                  <Text style={styles.planTitle}>{plan.title}</Text>
                  <Text style={styles.planSubtitle}>{plan.subtitle}</Text>
                </View>
                <Text style={styles.planMeta}>{plan.meta}</Text>
                <View style={[styles.checkCircle, isChecklistTaskCompleted(plan.apiName) && styles.checkCircleActive]}>
                  {isChecklistTaskCompleted(plan.apiName) ? (
                    <Ionicons name="checkmark" size={10} color="#FFFFFF" />
                  ) : null}
                </View>
              </View>
            ))}
          </View>

          <View style={styles.stressCard}>
            <View style={styles.stressIconWrap}>
              <Image source={stressHeartIcon} style={styles.stressIcon} contentFit="contain" />
            </View>
            <View style={styles.stressCopy}>
              <Text style={styles.stressTitle}>Stress today?</Text>
              <Text style={styles.stressSubtitle}>
                Your nightly check-in helps heaven learn support You
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push('/stress-step')}
              style={({ pressed }) => pressed && styles.pressed}>
              <LinearGradient
                colors={['#F38190', '#7B61FF']}
                start={{ x: 1, y: 0.5 }}
                end={{ x: 0, y: 0.5 }}
                style={styles.stressButton}>
                <Text style={styles.stressButtonText}>Log stress</Text>
              </LinearGradient>
            </Pressable>
          </View>

          <View style={styles.resetCard}>
            <View style={styles.clockIcon}>
              <Image source={resetClockIcon} style={styles.resetIcon} contentFit="contain" />
            </View>
            <View style={styles.resetCopy}>
              <Text style={styles.resetTitle}>2 minute Reset</Text>
              <Text style={styles.resetSubtitle}>A quick reset for busy moments</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              onPress={handleStartReset}
              style={({ pressed }) => pressed && styles.pressed}>
              <View style={styles.resetButton}>
                <Text style={styles.resetButtonText}>Start</Text>
              </View>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F4EAF8',
  },
  backgroundImage: {
    height: '100%',
    opacity: 1,
    width: '100%',
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 12,
    paddingTop: 60,
    paddingBottom: 112,
  },
  header: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  greeting: {
    color: '#173F5F',
    fontFamily: AppFonts.displayBold,
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: 0,
    lineHeight: 34,
  },
  subtitle: {
    color: '#173F5F',
    fontFamily: AppFonts.sansMedium,
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: 0,
    lineHeight: 26,
    marginTop: 4,
  },
  avatarRing: {
    alignItems: 'center',
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    marginTop: 5,
    overflow: 'hidden',
    width: 40,
  },
  avatar: {
    borderRadius: 20,
    height: 40,
    width: 40,
  },
  easeCard: {
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 185,
    overflow: 'hidden',
    paddingBottom: 18,
    paddingHorizontal: 18,
    paddingTop: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    width: '100%',
  },
  easeCopy: {
    justifyContent: 'center',
    maxWidth: 150,
  },
  easeTitle: {
    color: '#54555A',
    fontFamily: AppFonts.sansRegular,
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    letterSpacing: 0,
  },
  easeMeter: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 120,
  },
  easeLabel: {
    color: '#000000',
    fontFamily: AppFonts.sansMedium,
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0,
    lineHeight: 22,
    marginBottom: 6,
    textAlign: 'center',
  },
  progressWrap: {
    height: progressSize,
    position: 'relative',
    width: progressSize,
  },
  progressCenter: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    top: 48,
  },
  progressValue: {
    color: '#173F5F',
    fontFamily: AppFonts.displayMedium,
    fontSize: 48,
    fontWeight: '500',
    letterSpacing: 0,
    lineHeight: 58,
    marginTop: -10,
    textAlign: 'center',
  },
  progressCaption: {
    color: '#7B61FF',
    fontFamily: AppFonts.sansMedium,
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0,
    lineHeight: 24,
    textAlign: 'center',
  },
  progressDot: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
    borderRadius: progressDotRadius,
    borderWidth: 2,
    elevation: 4,
    height: progressDotRadius * 2,
    position: 'absolute',
    shadowColor: '#173F5F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    width: progressDotRadius * 2,
  },
  nextCard: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderRadius: 12,
    flexDirection: 'row',
    marginTop: 13,
    minHeight: 78,
    paddingHorizontal: 14,
  },
  nextIconWrap: {
    alignItems: 'center',
    backgroundColor: '#7B61FF4D',
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    marginRight: 12,
    width: 40,
  },
  nextIcon: {
    height: 30,
    tintColor: '#6339FB',
    width: 30,
  },
  nextCopy: {
    flex: 1,
  },
  nextTitle: {
    color: '#173F5F',
    fontFamily: AppFonts.displaySemiBold,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0,
    lineHeight: 22,
  },
  nextSubtitle: {
    color: '#8C8C8C',
    fontFamily: AppFonts.sansMedium,
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0,
    lineHeight: 22,
  },
  startButton: {
    alignItems: 'center',
    borderRadius: 24,
    height: 48,
    justifyContent: 'center',
    width: 96,
  },
  startText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    marginTop: 12,
  },
  sectionTitle: {
    color: '#173F5F',
    fontFamily: AppFonts.displaySemiBold,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0,
    lineHeight: 26,
  },
  viewAll: {
    color: '#7B61FF',
    fontFamily: AppFonts.sansBold,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0,
    lineHeight: 22,
  },
  planCard: {
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderRadius: 12,
    overflow: 'hidden',
    paddingHorizontal: 10,
  },
  planRow: {
    alignItems: 'center',
    flexDirection: 'row',
    minHeight: 58,
  },
  planDivider: {
    borderBottomColor: 'rgba(23,63,95,0.08)',
    borderBottomWidth: 1,
  },
  planIconWrap: {
    alignItems: 'center',
    borderRadius: 16,
    height: 32,
    justifyContent: 'center',
    marginRight: 12,
    width: 32,
  },
  planIcon: {
    height: 18,
    width: 18,
  },
  planCopy: {
    flex: 1,
  },
  planTitle: {
    color: '#000000',
    fontFamily: AppFonts.sansSemiBold,
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0,
    lineHeight: 22,
  },
  planSubtitle: {
    color: '#8C8C8C',
    fontFamily: AppFonts.sansRegular,
    fontSize: 10,
    fontWeight: '400',
    letterSpacing: 0,
    lineHeight: 18,
  },
  planMeta: {
    color: '#8C8C8C',
    fontFamily: AppFonts.sansRegular,
    fontSize: 10,
    fontWeight: '400',
    letterSpacing: 0,
    lineHeight: 18,
    marginRight: 8,
  },
  checkCircle: {
    alignItems: 'center',
    borderColor: '#CED5E2',
    borderRadius: 9,
    borderWidth: 1,
    height: 18,
    justifyContent: 'center',
    width: 18,
  },
  checkCircleActive: {
    backgroundColor: '#7863DC',
    borderColor: '#7863DC',
  },
  stressCard: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 13,
    minHeight: 72,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  stressCopy: {
    flex: 1,
    paddingRight: 12,
  },
  stressIconWrap: {
    alignItems: 'center',
    backgroundColor: '#FF005914',
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    marginRight: 12,
    width: 40,
  },
  stressIcon: {
    height: 18,
    tintColor: '#FF0059',
    width: 18,
  },
  stressTitle: {
    color: '#173F5F',
    fontFamily: AppFonts.displaySemiBold,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0,
    lineHeight: 22,
  },
  stressSubtitle: {
    color: '#8C8C8C',
    fontFamily: AppFonts.sansMedium,
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0,
    lineHeight: 22,
  },
  stressButton: {
    alignItems: 'center',
    borderRadius: 24,
    height: 42,
    justifyContent: 'center',
    width: 96,
  },
  stressButtonText: {
    color: '#FFFFFF',
    fontFamily: AppFonts.sansBold,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0,
    lineHeight: 26,
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.86,
    transform: [{ scale: 0.99 }],
  },
  resetCard: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 12,
    flexDirection: 'row',
    marginTop: 13,
    minHeight: 72,
    paddingHorizontal: 14,
  },
  clockIcon: {
    alignItems: 'center',
    backgroundColor: '#7B61FF14',
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    marginRight: 12,
    width: 40,
  },
  resetIcon: {
    height: 18,
    tintColor: '#7B61FF',
    width: 18,
  },
  resetCopy: {
    flex: 1,
  },
  resetTitle: {
    color: '#173F5F',
    fontFamily: AppFonts.displaySemiBold,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0,
    lineHeight: 22,
  },
  resetSubtitle: {
    color: '#8C8C8C',
    fontFamily: AppFonts.sansMedium,
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0,
    lineHeight: 22,
  },
  resetButton: {
    alignItems: 'center',
    borderColor: '#EDEDED',
    borderRadius: 22,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    height: 40,
    justifyContent: 'center',
    width: 83,
  },
  resetButtonText: {
    color: '#7B61FF',
    fontFamily: AppFonts.sansBold,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0,
    lineHeight: 26,
    textAlign: 'center',
  },
});
