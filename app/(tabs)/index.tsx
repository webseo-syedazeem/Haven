import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
    Animated,
    ImageBackground,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';

import { AvatarPreview } from '@/components/profile/AvatarPreview';
import { SwipeTabsWrapper } from '@/components/navigation/SwipeTabsWrapper';
import { dashboardChecklistTasks } from '@/constants/checklistTasks';
import { AppFonts } from '@/constants/theme';
import { useChecklist } from '@/contexts/ChecklistContext';
import { useDailyEase } from '@/contexts/DailyEaseContext';
import { useUser } from '@/hooks/useUser';
import { apiClient } from '@/lib/api/client';
import { getDisplayName } from '@/lib/api/user';

const progressSize = 112;
const progressStroke = 8;
const progressRadius = (progressSize - progressStroke) / 2;
const progressCircumference = 2 * Math.PI * progressRadius;
const progressDotRadius = 8;
const progressDotCenter = progressSize / 2;
const progressDotDistance = progressRadius;

function calcProgress(score: number) {
  const progress = Math.max(0, Math.min(score, 100));
  const percent = progress / 100;
  const dashOffset = progressCircumference - percent * progressCircumference;
  const angle = percent * 360 - 90;
  return {
    progress,
    dashOffset,
    dotX: progressDotCenter + progressDotDistance * Math.cos((angle * Math.PI) / 180),
    dotY: progressDotCenter + progressDotDistance * Math.sin((angle * Math.PI) / 180),
  };
}

const backgroundImage = require('@/assets/images/dashbord-background-img.png');
const avatarImage = require('@/assets/images/profile-pic.jpg');
const nextStepIcon = require('@/assets/icons/dashbord-flower-icon.svg');
const stressHeartIcon = require('@/assets/icons/dashbord-heart-icon.svg');
const resetClockIcon = require('@/assets/icons/dashbord-clock-icon.svg');

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

function SkeletonPulse({ width, height, borderRadius }: { width: number; height: number; borderRadius: number }) {
  const opacity = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.85, duration: 900, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.35, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, [opacity]);

  return <Animated.View style={{ width, height, borderRadius, backgroundColor: '#D6CAFF', opacity }} />;
}

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: me, isLoading: userLoading } = useUser();
  const [avatarPreviewVisible, setAvatarPreviewVisible] = useState(false);
  const { refreshTodayChecklist, savingTaskName, todayTasks, toggleTask } = useChecklist();
  const {
    dailyEase,
    loading: dailyEaseLoading,
    refreshDailyEase,
  } = useDailyEase();

  const dailyEaseScore = dailyEaseLoading ? 0 : dailyEase.score;
  const dailyEaseLabel = dailyEase.label;
  const dailyEaseMessage = dailyEase.message;
  const {
    progress: dailyEaseProgress,
    dashOffset: dailyEaseDashOffset,
    dotX: progressDotX,
    dotY: progressDotY,
  } = calcProgress(dailyEaseScore);

  const displayName = getDisplayName(me);
  const avatarUri =
    me?.profile?.profile_image_url ||
    me?.user?.user_metadata?.avatar_url ||
    '';
  const greeting = getTimeGreeting();
  const avatarSource = avatarUri ? { uri: avatarUri } : avatarImage;

  useFocusEffect(
    useCallback(() => {
      void refreshTodayChecklist();
      void refreshDailyEase();
    }, [refreshDailyEase, refreshTodayChecklist])
  );

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
    return Boolean(todayTasks.find((task) => task.apiName === taskName)?.completed);
  }

  return (
    <SwipeTabsWrapper>
      <ImageBackground
        source={backgroundImage}
        resizeMode="cover"
        imageStyle={styles.backgroundImage}
        style={styles.screen}>
        <SafeAreaView edges={['top']} style={styles.safeArea}>
          <ScrollView
            bounces={false}
            contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 112 }]}
            showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <View style={styles.headerCopy}>
              {userLoading ? (
                <>
                  <SkeletonPulse width={180} height={30} borderRadius={8} />
                  <View style={{ marginTop: 8 }}>
                    <SkeletonPulse width={220} height={22} borderRadius={6} />
                  </View>
                </>
              ) : (
                <>
                  <Text style={styles.greeting}>{greeting}{displayName ? `, ${displayName}` : ''}</Text>
                  <Text style={styles.subtitle}>Small stress today, stronger you{'\n'}tomorrow</Text>
                </>
              )}
            </View>
            <Pressable
              accessibilityRole={avatarUri ? 'button' : undefined}
              disabled={!avatarUri || userLoading}
              onPress={() => {
                if (avatarUri) {
                  setAvatarPreviewVisible(true);
                }
              }}
              style={({ pressed }) => [styles.avatarRing, pressed && avatarUri && styles.pressed]}>
              {userLoading ? (
                <SkeletonPulse width={56} height={56} borderRadius={28} />
              ) : (
                <Image source={avatarSource} style={styles.avatar} contentFit="cover" />
              )}
            </Pressable>
          </View>

          <View style={styles.easeCard}>
            <View style={styles.easeCopy}>
              <Text style={styles.easeTitle}>{dailyEaseMessage}</Text>
            </View>

            <View style={styles.easeMeter}>
              <Text style={styles.easeLabel}>Daily Ease</Text>
              <View style={styles.progressWrap}>
                <Svg width={progressSize} height={progressSize} viewBox={`0 0 ${progressSize} ${progressSize}`}>
                  <Circle
                    cx={progressDotCenter}
                    cy={progressDotCenter}
                    r={progressRadius}
                    stroke="#FFFFFF"
                    strokeWidth={progressStroke}
                    fill="transparent"
                  />
                  {dailyEaseProgress > 0 ? (
                    <Circle
                      cx={progressDotCenter}
                      cy={progressDotCenter}
                      r={progressRadius}
                      stroke="#8264F9"
                      strokeWidth={progressStroke}
                      fill="transparent"
                      strokeDasharray={progressCircumference}
                      strokeDashoffset={dailyEaseDashOffset}
                      strokeLinecap="round"
                      transform={`rotate(-90 ${progressDotCenter} ${progressDotCenter})`}
                    />
                  ) : null}
                </Svg>
                {dailyEaseProgress > 0 ? (
                  <View
                    style={[
                      styles.progressDot,
                      {
                        left: progressDotX - progressDotRadius,
                        top: progressDotY - progressDotRadius,
                      },
                    ]}
                  />
                ) : null}
              </View>
              <View style={styles.progressCenter}>
                <Text style={styles.progressValue}>{dailyEaseLoading ? '...' : dailyEaseScore}</Text>
                <Text style={styles.progressCaption}>{dailyEaseLabel}</Text>
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
            {dashboardChecklistTasks.map((plan, index) => (
                <Pressable
                accessibilityRole="button"
                accessibilityState={{ checked: isChecklistTaskCompleted(plan.apiName) }}
                disabled={Boolean(savingTaskName)}
                key={plan.id}
                onPress={() => toggleTask(plan.apiName)}
                style={[
                  styles.planRow,
                  index < dashboardChecklistTasks.length - 1 && styles.planDivider,
                  index === dashboardChecklistTasks.length - 1 && styles.planRowLast,
                ]}>
                <View style={[styles.planIconWrap, { backgroundColor: plan.iconBackground }]}>
                  <Image
                    source={plan.dashboardIcon}
                    style={[styles.planIcon, { tintColor: plan.iconColor }]}
                    contentFit="contain"
                  />
                </View>
                <View style={styles.planCopy}>
                  <Text style={styles.planTitle}>{plan.apiName}</Text>
                  <Text style={styles.planSubtitle}>{plan.description}</Text>
                </View>
                <Text style={styles.planMeta}>{plan.duration}</Text>
                <View style={[styles.checkCircle, isChecklistTaskCompleted(plan.apiName) && styles.checkCircleActive]}>
                  {isChecklistTaskCompleted(plan.apiName) ? (
                    <Ionicons name="checkmark" size={10} color="#FFFFFF" />
                  ) : null}
                </View>
              </Pressable>
            ))}
          </View>

          <View style={styles.stressCard}>
            <View style={styles.stressIconWrap}>
              <Image source={stressHeartIcon} style={styles.stressIcon} contentFit="contain" />
            </View>
            <View style={styles.stressCopy}>
              <Text style={styles.stressTitle}>Stress today?</Text>
              <Text style={styles.stressSubtitle}>
                Your nightly check-in helps Halcyon learn support You
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
        <AvatarPreview
          visible={avatarPreviewVisible}
          imageUrl={avatarUri}
          onClose={() => setAvatarPreviewVisible(false)}
        />
      </ImageBackground>
    </SwipeTabsWrapper>
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
  },
  header: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerCopy: {
    flex: 1,
    paddingRight: 12,
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
    borderRadius: 28,
    height: 56,
    justifyContent: 'center',
    flexShrink: 0,
    marginLeft: 8,
    marginTop: 5,
    overflow: 'hidden',
    width: 56,
  },
  avatar: {
    borderRadius: 28,
    height: 56,
    width: 56,
  },
  easeCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 185,
    overflow: 'hidden',
    paddingBottom: 18,
    paddingHorizontal: 18,
    paddingTop: 20,
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
    paddingVertical: 10,
  },
  planRow: {
    alignItems: 'center',
    flexDirection: 'row',
    paddingBottom: 10,
  },
  planDivider: {
    borderBottomColor: 'rgba(23,63,95,0.08)',
    borderBottomWidth: 1,
    marginBottom: 10,
  },
  planRowLast: {
    paddingBottom: 0,
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
