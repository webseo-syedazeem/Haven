import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';

import { AppFonts } from '@/constants/theme';
import { ChecklistAuthError, getTodayChecklist } from '@/services/checklistService';

const backgroundImage = require('@/assets/images/tool-page-bg-image.png');

const progressSize = 80;
const progressStroke = 5;
const progressRadius = (progressSize - progressStroke) / 2;
const progressCircumference = 2 * Math.PI * progressRadius;
type ChecklistItem = {
  apiName: string;
  icon?: number;
  iconBackground: string;
  iconColor: string;
  iconName?: keyof typeof Ionicons.glyphMap;
  meta: string;
  subtitle: string;
  title: string;
};

const checklistItems: ChecklistItem[] = [
  {
    apiName: 'Morning Sunlight',
    icon: require('@/assets/images/sun.svg'),
    iconBackground: '#FFC1031A',
    iconColor: '#FFC43D',
    meta: '10 min',
    subtitle: 'Morning light helps regulate cortisol rhythm and support better sleep later',
    title: 'Morning Sunlight',
  },
  {
    apiName: 'Breathwork',
    icon: require('@/assets/images/lines.svg'),
    iconBackground: '#3770FC14',
    iconColor: '#3770FC',
    meta: '20 min',
    subtitle: 'Boost mood and regulate your body check',
    title: 'Breath work',
  },
  {
    apiName: 'Movement',
    icon: require('@/assets/images/hugeicons_running-shoes.svg'),
    iconBackground: '#28B92A14',
    iconColor: '#2EB668',
    meta: '5 min',
    subtitle: 'Boost mood and regulate your body check',
    title: 'Movements',
  },
  {
    apiName: 'Hydration',
    icon: require('@/assets/images/hydration-checklist-icon.svg'),
    iconBackground: '#3770FC14',
    iconColor: '#3770FC',
    meta: '2 glasses',
    subtitle: 'Boost mood and regulate your body check',
    title: 'Hydration',
  },
  {
    apiName: 'Deep Work',
    icon: require('@/assets/images/deep-work-checklist-icon.svg'),
    iconBackground: '#7B61FF14',
    iconColor: '#7B61FF',
    meta: '3 tasks',
    subtitle: 'Boost mood and regulate your body check',
    title: 'Deep work',
  },
  {
    apiName: 'Wind-down',
    icon: require('@/assets/images/wind-down-checklist-icon.svg'),
    iconBackground: '#7B61FF14',
    iconColor: '#7B61FF',
    meta: '20 min',
    subtitle: 'Boost mood and regulate your body check',
    title: 'Wind-down',
  },
];

export default function ChecklistScreen() {
  const router = useRouter();
  const [completedTasks, setCompletedTasks] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const totalHabits = checklistItems.length;
  const completedHabits = completedTasks.length;
  const progressPercent = totalHabits ? completedHabits / totalHabits : 0;
  const progressOffset = progressCircumference * (1 - progressPercent);
  const progressText = `${Math.round(progressPercent * 100)}%`;
  const completedTaskSet = useMemo(() => new Set(completedTasks), [completedTasks]);

  useEffect(() => {
    let isMounted = true;

    async function loadTodayChecklist() {
      setIsLoading(true);
      setErrorMessage('');

      try {
        const todayChecklist = await getTodayChecklist();

        if (!isMounted) {
          return;
        }

        setCompletedTasks(
          Array.isArray(todayChecklist?.completed_tasks)
            ? todayChecklist.completed_tasks.filter((task) =>
                checklistItems.some((item) => item.apiName === task)
              )
            : []
        );
      } catch (error) {
        if (isMounted) {
          if (error instanceof ChecklistAuthError) {
            setErrorMessage(error.message);
            router.replace('/login');
          } else {
            setErrorMessage(error instanceof Error ? error.message : 'Unable to load checklist.');
          }
          setCompletedTasks([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadTodayChecklist();

    return () => {
      isMounted = false;
    };
  }, [router]);

  return (
    <View style={styles.screen}>
      <Image source={backgroundImage} style={styles.backgroundImage} contentFit="cover" />

      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ScrollView
          bounces={false}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}>
          <Pressable
            accessibilityLabel="Go back"
            hitSlop={12}
            onPress={() => router.back()}
            style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
            <Ionicons color="#000000" name="chevron-back" size={18} />
          </Pressable>

          <View style={styles.header}>
            <Text style={styles.title}>Checklist</Text>
            <Text style={styles.subtitle}>Small actions that help lower stress</Text>
          </View>

          {isLoading ? (
            <View style={styles.stateCard}>
              <ActivityIndicator color="#7B61FF" />
              <Text style={styles.stateText}>Loading checklist...</Text>
            </View>
          ) : null}

          <LinearGradient
            colors={['rgba(255, 255, 255, 0.4)', 'rgba(255, 255, 255, 0)']}
            end={{ x: 1, y: 1 }}
            start={{ x: 0, y: 0 }}
            style={styles.progressCard}>
            <View style={styles.progressTopRow}>
              <View style={styles.circleWrap}>
                <Svg height={progressSize} width={progressSize} viewBox={`0 0 ${progressSize} ${progressSize}`}>
                  <Defs>
                    <SvgLinearGradient id="checklistProgress" x1="0" y1="0" x2="1" y2="1">
                      <Stop offset="0.58" stopColor="#7B61FF" />
                      <Stop offset="0.75" stopColor="#FD7494" />
                    </SvgLinearGradient>
                  </Defs>
                  <Circle
                    cx={progressSize / 2}
                    cy={progressSize / 2}
                    fill="transparent"
                    r={progressRadius}
                    stroke="#D9D9D9"
                    strokeWidth={progressStroke}
                  />
                  <Circle
                    cx={progressSize / 2}
                    cy={progressSize / 2}
                    fill="transparent"
                    origin={`${progressSize / 2}, ${progressSize / 2}`}
                    r={progressRadius}
                    rotation="-90"
                    stroke="url(#checklistProgress)"
                    strokeDasharray={`${progressCircumference} ${progressCircumference}`}
                    strokeDashoffset={progressOffset}
                    strokeLinecap="round"
                    strokeWidth={progressStroke}
                  />
                </Svg>
                <Text style={styles.circleText}>{progressText}</Text>
              </View>

              <View style={styles.weekCopy}>
                <Text style={styles.weekTitle}>This Week</Text>
                <Text style={styles.weekDescription}>
                  Complete gentle habits to support calmer energy, steadier mood, and better sleep
                </Text>
              </View>
            </View>

            <View style={styles.progressMetaRow}>
              <Text style={styles.completedText}>
                {completedHabits} of {totalHabits} completed
              </Text>
              <View style={styles.barTrack}>
                <LinearGradient
                  colors={['#6339FB', '#FC74A0']}
                  end={{ x: 1, y: 0 }}
                  start={{ x: 0, y: 0 }}
                  style={[styles.barFill, { width: `${progressPercent * 100}%` }]}
                />
              </View>
            </View>
          </LinearGradient>

          <View style={styles.listCard}>
            {checklistItems.map((item, index) => (
              <View
                key={item.title}
                style={[
                  styles.habitRow,
                  index < checklistItems.length - 1 && styles.habitDivider,
                ]}>
                <View
                  style={[
                    styles.checkCircle,
                    !completedTaskSet.has(item.apiName) && styles.checkCircleInactive,
                  ]}>
                  <Ionicons
                    color={completedTaskSet.has(item.apiName) ? '#FFFFFF' : 'transparent'}
                    name="checkmark"
                    size={14}
                  />
                </View>
                <View style={[styles.habitIconWrap, { backgroundColor: item.iconBackground }]}>
                  {item.icon ? (
                    <Image
                      source={item.icon}
                      style={[styles.habitIcon, { tintColor: item.iconColor }]}
                      contentFit="contain"
                    />
                  ) : (
                    <Ionicons color={item.iconColor} name={item.iconName ?? 'ellipse-outline'} size={20} />
                  )}
                </View>
                <View style={styles.habitCopy}>
                  <Text style={styles.habitTitle}>{item.title}</Text>
                  <Text style={styles.habitSubtitle}>{item.subtitle}</Text>
                </View>
                <Text style={styles.habitMeta}>{item.meta}</Text>
              </View>
            ))}
          </View>

          {!!errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  barFill: {
    borderRadius: 12,
    height: '100%',
    width: '50%',
  },
  barTrack: {
    backgroundColor: '#D9D9D9',
    borderRadius: 12,
    flex: 1,
    height: 13,
    overflow: 'hidden',
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
  checkCircle: {
    alignItems: 'center',
    backgroundColor: '#7B61FF',
    borderRadius: 16,
    height: 26,
    justifyContent: 'center',
    width: 26,
  },
  checkCircleInactive: {
    backgroundColor: '#7B61FF14',
  },
  circleText: {
    color: '#000000',
    fontFamily: AppFonts.sansBold,
    fontSize: 15,
    fontWeight: '700',
    left: 0,
    lineHeight: 20,
    position: 'absolute',
    right: 0,
    textAlign: 'center',
    top: 30,
  },
  circleWrap: {
    alignItems: 'center',
    height: 80,
    justifyContent: 'center',
    padding: 0,
    width: 80,
  },
  completedText: {
    color: '#000000',
    fontFamily: AppFonts.sansRegular,
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 22,
  },
  content: {
    paddingBottom: 60,
    paddingHorizontal: 17,
    paddingTop: 60,
  },
  errorText: {
    color: '#173F5F',
    fontFamily: AppFonts.sansMedium,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 10,
    textAlign: 'center',
  },
  habitCopy: {
    flex: 1,
    gap: 2,
  },
  habitDivider: {
    borderBottomColor: 'rgba(23, 63, 95, 0.08)',
    borderBottomWidth: 1,
  },
  habitIcon: {
    height: 30,
    width: 30,
  },
  habitIconWrap: {
    alignItems: 'center',
    borderRadius: 500,
    height: 48,
    justifyContent: 'center',
    paddingBottom: 4,
    paddingTop: 4,
    width: 48,
  },
  habitMeta: {
    color: '#54555A',
    fontFamily: AppFonts.sansRegular,
    fontSize: 10,
    fontWeight: '400',
    lineHeight: 18,
    minWidth: 42,
    textAlign: 'right',
  },
  habitRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    minHeight: 62,
    paddingVertical: 8,
  },
  habitSubtitle: {
    color: '#54555A',
    fontFamily: AppFonts.sansRegular,
    fontSize: 10,
    fontWeight: '400',
    lineHeight: 14,
  },
  habitTitle: {
    color: '#173F5F',
    fontFamily: AppFonts.sansBold,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  header: {
    marginBottom: 26,
  },
  listCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    gap: 8,
    marginTop: 12,
    padding: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 14,
    width: '100%',
  },
  progressCard: {
    borderRadius: 12,
    gap: 16,
    paddingBottom: 8,
    paddingLeft: 16,
    paddingRight: 16,
    paddingTop: 8,
    width: '100%',
  },
  progressMetaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  progressTopRow: {
    flexDirection: 'row',
    gap: 16,
  },
  pressed: {
    opacity: 0.86,
    transform: [{ scale: 0.99 }],
  },
  safeArea: {
    flex: 1,
  },
  screen: {
    backgroundColor: '#EEF0FF',
    flex: 1,
    overflow: 'hidden',
  },
  subtitle: {
    color: '#173F5F',
    fontFamily: AppFonts.sansMedium,
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 26,
  },
  stateCard: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    gap: 8,
    marginBottom: 12,
    padding: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 14,
  },
  stateText: {
    color: '#173F5F',
    fontFamily: AppFonts.sansMedium,
    fontSize: 12,
    lineHeight: 18,
  },
  title: {
    color: '#173F5F',
    fontFamily: AppFonts.displayBold,
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 42,
  },
  weekCopy: {
    flex: 1,
    paddingTop: 4,
  },
  weekDescription: {
    color: '#173F5F',
    fontFamily: AppFonts.sansRegular,
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 22,
  },
  weekTitle: {
    color: '#173F5F',
    fontFamily: AppFonts.displayBold,
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 26,
  },
});
