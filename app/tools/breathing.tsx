import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { ExploreTabChip } from '@/components/ExploreTabChip';
import { AppFonts } from '@/constants/theme';
import {
  BREATHING_TYPES,
  formatBreathingDuration,
  getBreathingPatternText,
  getBreathingSessionParams,
  type BreathingTypeName,
} from '@/lib/breathing/config';

const backgroundImage = require('@/assets/images/45fbaa58583a9264f393398d7cbf7a6e3d1e3e55.png');
const boxBreathingIconImage = require('@/assets/images/466c3aaac798a9fda58c5d3cf86c108a80d46520.png');

const CATEGORIES = ['Calm', 'Sleep', 'Focus'];

const TAB_ITEMS = [
  { label: 'Home', icon: 'home-outline', route: '/(tabs)', active: false },
  { label: 'Mood', icon: 'happy-outline', route: '/(tabs)/mood', active: false },
  { label: 'Tools', icon: 'leaf-outline', route: '/(tabs)/tools', active: true },
  { label: 'Progress', icon: 'stats-chart-outline', route: '/(tabs)/progress', active: false },
  { label: 'Profile', icon: 'person-outline', route: '/(tabs)/profile', active: false },
] as const;

const EXERCISES = [
  {
    name: 'Box Breathing',
    desc: 'For overwhelm & Racing thoughts',
    apiName: 'Box Breathing' as BreathingTypeName,
    featured: true,
    color: '#7B61FF',
    bg: '#7B61FF14',
    image: require('@/assets/images/b5c4219216cc408d891c840d14db71d10c54f0c6.png'),
    categories: ['Calm', 'Focus'],
  },
  {
    name: '4-7-8 sleep reset',
    desc: 'For sleep & relaxation',
    apiName: '4-7-8 Sleep Reset' as BreathingTypeName,
    featured: false,
    color: '#3770FC',
    bg: '#3770FC14',
    image: require('@/assets/images/9e81e68b5662f67c64b9f492aa64a3427a106a17.png'),
    categories: ['Sleep', 'Calm'],
  },
  {
    name: 'Physiological Sigh',
    desc: 'For quick stress relief',
    apiName: 'Physiological Sigh' as BreathingTypeName,
    featured: false,
    color: '#2EB668',
    bg: '#2EB66814',
    image: require('@/assets/images/9e81e68b5662f67c64b9f492aa64a3427a106a17.png'),
    categories: ['Calm', 'Focus'],
  },
  {
    name: 'Resonant Breathing',
    desc: 'For balance & calm',
    apiName: 'Resonant Breathing' as BreathingTypeName,
    featured: false,
    color: '#FFC43D',
    bg: '#FFC1031A',
    image: require('@/assets/images/9e81e68b5662f67c64b9f492aa64a3427a106a17.png'),
    categories: ['Calm', 'Focus'],
  },
  {
    name: 'Focus Reset',
    desc: 'For clarity & focus',
    apiName: 'Focus Reset' as BreathingTypeName,
    featured: false,
    color: '#FF0059',
    bg: '#FF005914',
    image: require('@/assets/images/9e81e68b5662f67c64b9f492aa64a3427a106a17.png'),
    categories: ['Calm', 'Focus'],
  },
  {
    name: 'Morning Lift',
    desc: 'For energy & motivation',
    apiName: 'Morning Lift' as BreathingTypeName,
    featured: false,
    color: '#FFC43D',
    bg: '#FFC1031A',
    image: require('@/assets/images/9e81e68b5662f67c64b9f492aa64a3427a106a17.png'),
    categories: ['Calm', 'Focus'],
  },
].map((exercise) => {
  const timing = BREATHING_TYPES[exercise.apiName];
  return {
    ...exercise,
    duration: formatBreathingDuration(timing.total_duration_seconds),
    pattern: getBreathingPatternText(timing),
  };
});

export default function BreathingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();
  const [activeCategory, setActiveCategory] = useState('Calm');

  function handleStart(exerciseName: string) {
    const exercise = EXERCISES.find((e) => e.name === exerciseName);
    const apiName = exercise?.apiName ?? exerciseName;
    const fallbackParams = getBreathingSessionParams(apiName);
    if (!fallbackParams) return;

    router.push({
      pathname: '/tools/breathing-session',
      params: {
        sessionId: '',
        apiType: apiName,
        name: exerciseName,
        inhale: fallbackParams.inhale,
        hold1: fallbackParams.hold1,
        exhale: fallbackParams.exhale,
        hold2: fallbackParams.hold2,
        total: fallbackParams.total,
      },
    });
  }

  const featured = EXERCISES[0];
  const filtered = EXERCISES.filter((e) => !e.featured && e.categories?.includes(activeCategory));

  return (
    <ImageBackground source={backgroundImage} resizeMode="cover" style={styles.screen}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ScrollView
          bounces={false}
          contentContainerStyle={[styles.scroll, { minHeight: screenHeight, paddingBottom: insets.bottom + 100 }]}
          showsVerticalScrollIndicator={false}>
          <View pointerEvents="none" style={styles.fogBackdrop}>
            <LinearGradient
              colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.72)', '#FFFFFF']}
              locations={[0, 0.45, 1]}
              style={styles.fogGradient}
            />
            <View style={styles.fogWhiteFill} />
          </View>

          {/* Back */}
          <Pressable
            accessibilityLabel="Go back"
            hitSlop={12}
            onPress={() => router.back()}
            style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
            <Ionicons name="chevron-back" size={18} color="#000000" />
          </Pressable>

          {/* Header */}
          <Text style={styles.title}>Breathing</Text>
          <Text style={styles.subtitle}>Choose support for{'\n'}how you feel</Text>

          {/* Category tabs */}
          <View style={styles.tabs}>
            {CATEGORIES.map((cat) => (
              <ExploreTabChip
                key={cat}
                active={activeCategory === cat}
                label={cat}
                onPress={() => setActiveCategory(cat)}
                variant="tab"
              />
            ))}
          </View>

          {/* Featured card */}
          <Pressable onPress={() => handleStart(featured.name)} style={styles.featuredCard}>
            <LinearGradient
              colors={['#F6B9D8', '#EEE2FF', '#CBD6FF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.featuredGradient}>
              {/* Background pattern image */}
              <Image
                source={featured.image}
                style={styles.featuredBgImage}
                contentFit="cover"
              />
              <View style={styles.featuredContent}>
                <Image
                  source={boxBreathingIconImage}
                  style={styles.featuredIconImage}
                  contentFit="cover"
                />
                <View style={styles.featuredText}>
                  <Text style={styles.featuredTitle} numberOfLines={1}>{featured.name}</Text>
                  <Text style={styles.featuredDesc} numberOfLines={1}>{featured.desc}</Text>
                  <Text style={styles.featuredPattern} numberOfLines={1}>{featured.pattern}</Text>
                </View>
                <Pressable
                  onPress={() => handleStart(featured.name)}
                  style={styles.featuredPlayButton}>
                  <LinearGradient
                    colors={['#B98DE8', '#668DF4']}
                    start={{ x: 0.5, y: 0 }}
                    end={{ x: 0.5, y: 1 }}
                    style={styles.featuredPlayGradient}>
                    <Ionicons name="play" size={24} color="#FFFFFF" style={styles.featuredPlayIcon} />
                  </LinearGradient>
                </Pressable>
              </View>
            </LinearGradient>
          </Pressable>

          {/* Exercise list */}
          <View style={styles.list}>
            {filtered.map((ex) => (
              <Pressable
                key={ex.name}
                onPress={() => handleStart(ex.name)}
                style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}>
                {/* Thumbnail image */}
                <View style={styles.thumbWrap}>
                  <Image
                    source={ex.image}
                    style={styles.thumb}
                    contentFit="cover"
                  />
                </View>
                <View style={styles.cardText}>
                  <Text style={styles.cardTitle}>{ex.name}</Text>
                  <Text style={styles.cardSubtitle}>{ex.duration}</Text>
                </View>
                <View style={styles.playSmall}>
                  <Ionicons name="play" size={13} color="#173F5F" style={styles.playSmallIcon} />
                </View>
              </Pressable>
            ))}
          </View>

        </ScrollView>
      </SafeAreaView>

      <View style={[styles.floatingTabBar, { bottom: Math.max(insets.bottom, 8) }]}>
        {TAB_ITEMS.map((item) => (
          <Pressable
            key={item.label}
            onPress={() => router.push(item.route as any)}
            style={styles.tabBarItem}>
            <Ionicons
              name={item.icon}
              size={22}
              color={item.active ? '#3770FC' : '#8C8C8C'}
              style={styles.tabBarIcon}
            />
            <Text style={[styles.tabBarLabel, item.active && styles.tabBarLabelActive]}>
              {item.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#C8BFEE' },
  safeArea: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingTop: 16, position: 'relative' },
  fogBackdrop: {
    bottom: -240,
    left: -20,
    position: 'absolute',
    right: -20,
    top: 260,
  },
  fogGradient: {
    height: 150,
  },
  fogWhiteFill: {
    backgroundColor: '#FFFFFF',
    flex: 1,
  },

  backButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 16,
    height: 32,
    justifyContent: 'center',
    marginBottom: 16,
    width: 32,
  },
  pressed: { opacity: 0.86, transform: [{ scale: 0.99 }] },

  title: {
    color: '#173F5F',
    fontFamily: AppFonts.displayBold,
    fontSize: 34,
    lineHeight: 42,
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    color: '#8C8C8C',
    fontFamily: AppFonts.sansRegular,
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 20,
  },

  // Category tabs
  tabs: {
    backgroundColor: '#FFFFFF',
    borderRadius: 34,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    marginHorizontal: 0,
    padding: 4,
    shadowColor: '#8B8BA0',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.14,
    shadowRadius: 24,
    elevation: 8,
  },

  // Featured
  featuredCard: {
    borderRadius: 28,
    marginBottom: 22,
    overflow: 'hidden',
    elevation: 0,
  },
  featuredGradient: {
    borderRadius: 28,
    overflow: 'hidden',
    height: 104,
  },
  featuredBgImage: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.26,
  },
  featuredContent: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    minHeight: 104,
    paddingHorizontal: 16,
    paddingBottom: 6,
    paddingTop: 0,
  },
  featuredIconCircle: {
    alignItems: 'center',
    backgroundColor: 'rgba(123,97,255,0.18)',
    borderRadius: 16,
    height: 56,
    justifyContent: 'center',
    width: 56,
  },
  featuredIcon: { height: 28, width: 28 },
  featuredIconImage: {
    alignSelf: 'center',
    borderRadius: 15,
    height: 62,
    width: 62,
  },
  featuredText: { flex: 1, minWidth: 0 },
  featuredTitle: {
    color: '#071A78',
    fontFamily: AppFonts.displayRegular,
    fontSize: 24,
    fontWeight: '400',
    lineHeight: 30,
    letterSpacing: 0,
  },
  featuredDesc: {
    color: '#7357B8',
    fontFamily: AppFonts.sansRegular,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 3,
  },
  featuredPattern: {
    color: '#7357B8',
    fontFamily: AppFonts.sansRegular,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 3,
  },
  featuredPlayButton: {
    borderRadius: 24,
    flexShrink: 0,
    height: 48,
    backgroundColor: 'transparent',
    overflow: 'hidden',
    width: 48,
  },
  featuredPlayGradient: {
    alignItems: 'center',
    borderRadius: 24,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  featuredPlayIcon: {
    marginLeft: 3,
  },


  // List
  list: { gap: 14 },
  card: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: 'rgba(227,227,227,0.75)',
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 76,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  cardPressed: { opacity: 0.88, transform: [{ scale: 0.99 }] },
  thumbWrap: {
    borderRadius: 14,
    height: 64,
    overflow: 'hidden',
    width: 88,
  },
  thumb: {
    height: 64,
    width: 88,
  },
  cardText: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  cardTitle: {
    color: '#173F5F',
    fontFamily: AppFonts.sansBold,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
    marginBottom: 4,
  },
  cardSubtitle: {
    color: '#898989',
    fontFamily: AppFonts.sansRegular,
    fontSize: 12,
    lineHeight: 16,
  },
  playSmall: {
    alignItems: 'center',
    borderColor: 'rgba(227,227,227,0.55)',
    borderRadius: 16,
    borderWidth: 1,
    height: 32,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 32,
  },
  playSmallIcon: {
    marginLeft: 1,
  },
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
