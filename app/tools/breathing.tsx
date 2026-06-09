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
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppFonts } from '@/constants/theme';
import { apiClient } from '@/lib/api/client';

const backgroundImage = require('@/assets/images/45fbaa58583a9264f393398d7cbf7a6e3d1e3e55.png');

const CATEGORIES = ['Calm', 'Sleep', 'Clam'];

const EXERCISES = [
  {
    name: 'Box Breathing',
    desc: 'For overwhelm & Racing thoughts',
    pattern: 'Inhale 4. Hold4. Exhale 4. Hold 4.',
    duration: '5:00',
    featured: true,
    color: '#7B61FF',
    bg: '#7B61FF14',
    image: require('@/assets/images/b5c4219216cc408d891c840d14db71d10c54f0c6.png'),
    categories: ['Calm', 'Clam'],
  },
  {
    name: '4-7-8 sleep reset',
    desc: 'For sleep & relaxation',
    pattern: 'Inhale 4. Hold 7. Exhale 8.',
    duration: '5:00',
    featured: false,
    color: '#3770FC',
    bg: '#3770FC14',
    image: require('@/assets/images/9e81e68b5662f67c64b9f492aa64a3427a106a17.png'),
    apiName: '4-7-8 Sleep Reset',
    categories: ['Sleep', 'Calm'],
  },
  {
    name: 'Physiological Sigh',
    desc: 'For quick stress relief',
    pattern: 'Inhale 4. Hold 2. Exhale 8.',
    duration: '2:06',
    featured: false,
    color: '#2EB668',
    bg: '#2EB66814',
    image: require('@/assets/images/9e81e68b5662f67c64b9f492aa64a3427a106a17.png'),
    categories: ['Calm', 'Clam'],
  },
  {
    name: 'Resonant Breathing',
    desc: 'For balance & calm',
    pattern: 'Inhale 5. Exhale 5.',
    duration: '6:00',
    featured: false,
    color: '#FFC43D',
    bg: '#FFC1031A',
    image: require('@/assets/images/9e81e68b5662f67c64b9f492aa64a3427a106a17.png'),
    categories: ['Calm', 'Clam'],
  },
  {
    name: 'Focus Reset',
    desc: 'For clarity & focus',
    pattern: 'Inhale 4. Hold 4. Exhale 6.',
    duration: '3:02',
    featured: false,
    color: '#FF0059',
    bg: '#FF005914',
    image: require('@/assets/images/9e81e68b5662f67c64b9f492aa64a3427a106a17.png'),
    categories: ['Calm', 'Clam'],
  },
  {
    name: 'Morning Lift',
    desc: 'For energy & motivation',
    pattern: 'Inhale 4. Exhale 4.',
    duration: '4:00',
    featured: false,
    color: '#FFC43D',
    bg: '#FFC1031A',
    image: require('@/assets/images/9e81e68b5662f67c64b9f492aa64a3427a106a17.png'),
    categories: ['Calm', 'Clam'],
  },
];

export default function BreathingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activeCategory, setActiveCategory] = useState('Clam');

  async function handleStart(exerciseName: string) {
    const apiName = EXERCISES.find((e) => e.name === exerciseName)?.apiName ?? exerciseName;
    try {
      const res = await apiClient<any>('/api/breathing', {
        method: 'POST',
        body: JSON.stringify({ type: apiName }),
      });
      const sessionId = res?.data?.session?.id;
      const session = res?.data?.session;
      router.push({
        pathname: '/tools/breathing-session',
        params: {
          sessionId: sessionId ?? '',
          name: exerciseName,
          inhale: String(session?.inhale ?? 4),
          hold1: String(session?.hold1 ?? 4),
          exhale: String(session?.exhale ?? 4),
          hold2: String(session?.hold2 ?? 4),
          total: String(session?.total_duration_seconds ?? 300),
        },
      });
    } catch {
      router.push({
        pathname: '/tools/breathing-session',
        params: {
          sessionId: '',
          name: exerciseName,
          inhale: '4',
          hold1: apiName === '4-7-8 Sleep Reset' ? '7' : '4',
          exhale: apiName === '4-7-8 Sleep Reset' ? '8' : '4',
          hold2: '0',
          total: '300',
        },
      });
    }
  }

  const featured = EXERCISES[0];
  const filtered = EXERCISES.filter((e) => !e.featured && e.categories?.includes(activeCategory));

  return (
    <ImageBackground source={backgroundImage} resizeMode="cover" style={styles.screen}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ScrollView
          bounces={false}
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 100 }]}
          showsVerticalScrollIndicator={false}>

          {/* Back */}
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backChevron}>‹</Text>
          </Pressable>

          {/* Header */}
          <Text style={styles.title}>Breathing</Text>
          <Text style={styles.subtitle}>Choose support for{'\n'}how you feel</Text>

          {/* Category tabs */}
          <View style={styles.tabs}>
            {CATEGORIES.map((cat) => (
              <Pressable
                key={cat}
                onPress={() => setActiveCategory(cat)}
                style={[styles.tab, activeCategory === cat && styles.tabActive]}>
                {activeCategory === cat && (
                  <LinearGradient
                    colors={['#8779EE', '#5275E8']}
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 1, y: 0.5 }}
                    style={StyleSheet.absoluteFillObject}
                  />
                )}
                <Text style={[styles.tabText, activeCategory === cat && styles.tabTextActive]}>
                  {cat}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Featured card */}
          <Pressable onPress={() => handleStart(featured.name)} style={styles.featuredCard}>
            <LinearGradient
              colors={['#E8DEFF', '#C8B8FF']}
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
                <View style={styles.featuredIconCircle}>
                  <Image
                    source={require('@/assets/icons/dashbord-breathing-icon.svg')}
                    style={[styles.featuredIcon, { tintColor: '#7B61FF' }]}
                    contentFit="contain"
                  />
                </View>
                <View style={styles.featuredText}>
                  <Text style={styles.featuredTitle}>{featured.name}</Text>
                  <Text style={styles.featuredDesc}>{featured.desc}</Text>
                  <Text style={styles.featuredPattern}>{featured.pattern}</Text>
                </View>
                <Pressable
                  onPress={() => handleStart(featured.name)}
                  style={styles.playCircle}>
                  <LinearGradient
                    colors={['#9174EC', '#5275E8']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.playCircleGradient}>
                    <Text style={styles.playIcon}>▶</Text>
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
                  <Text style={styles.playSmallIcon}>▶</Text>
                </View>
              </Pressable>
            ))}
          </View>

        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#C8BFEE' },
  safeArea: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingTop: 16 },

  backButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.70)',
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    marginBottom: 16,
    width: 40,
    elevation: 3,
  },
  backChevron: {
    color: '#173F5F',
    fontSize: 26,
    fontWeight: '300',
    lineHeight: 30,
    marginTop: -2,
  },

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
    alignItems: 'center',
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
  tab: {
    alignItems: 'center',
    borderRadius: 28,
    flex: 1,
    justifyContent: 'center',
    minHeight: 40,
    overflow: 'hidden',
  },
  tabActive: {},
  tabText: {
    color: '#565660',
    fontFamily: AppFonts.sansMedium,
    fontSize: 14,
    lineHeight: 24,
  },
  tabTextActive: {
    color: '#FFFFFF',
    fontFamily: AppFonts.sansSemiBold,
    fontSize: 14,
    lineHeight: 24,
  },

  // Featured
  featuredCard: {
    borderRadius: 20,
    marginBottom: 22,
    overflow: 'hidden',
    shadowColor: '#8367E8',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 8,
  },
  featuredGradient: {
    borderRadius: 26,
    overflow: 'hidden',
    minHeight: 110,
  },
  featuredBgImage: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.15,
  },
  featuredContent: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 16,
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
  featuredText: { flex: 1 },
  featuredTitle: {
    color: '#071A78',
    fontFamily: AppFonts.displayBold,
    fontSize: 18,
    lineHeight: 24,
  },
  featuredDesc: {
    color: '#6F56B8',
    fontFamily: AppFonts.sansRegular,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 6,
  },
  featuredPattern: {
    color: '#6F56B8',
    fontFamily: AppFonts.sansRegular,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 4,
  },
  playCircle: {
    alignItems: 'center',
    borderRadius: 22,
    height: 44,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 44,
    shadowColor: '#5275E8',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 18,
    elevation: 7,
  },
  playCircleGradient: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    width: '100%',
  },
  playIcon: { color: '#FFF', fontSize: 16, marginLeft: 4 },

  // List
  list: { gap: 14 },
  card: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    flexDirection: 'row',
    minHeight: 76,
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: '#B7C1D9',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.24,
    shadowRadius: 26,
    elevation: 8,
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
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    height: 36,
    justifyContent: 'center',
    width: 36,
    shadowColor: '#B7C1D9',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.28,
    shadowRadius: 22,
    elevation: 8,
  },
  playSmallIcon: {
    color: '#173F5F',
    fontSize: 14,
    lineHeight: 26,
    marginLeft: 4,
  },
});
