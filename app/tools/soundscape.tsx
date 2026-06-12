import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';

import { AppFonts } from '@/constants/theme';
import { apiClient } from '@/lib/api/client';

const backgroundImage = require('@/assets/images/fa705fcbeb88072529fa645d7e8bbe09af950627.png');
const featuredImage = require('@/assets/images/2908a0f59f35c9c7ae2c8285f7fbae865b961900.jpg');
const soundscapeThumbImages = [
  require('@/assets/images/Soundscapes/2908a0f59f35c9c7ae2c8285f7fbae865b961900.jpg'),
  require('@/assets/images/Soundscapes/3dbcdd076af765b79c5c520db6e470325d396cb1.png'),
  require('@/assets/images/Soundscapes/62d5eea8a9bf6a378613529ceb2d49c516fe4649.png'),
  require('@/assets/images/Soundscapes/6abde34cdd0f9b832382330833ec78ea26a91a16.png'),
  require('@/assets/images/Soundscapes/9776a63951638391cc6e9b9a6997f3fa69894165.png'),
  require('@/assets/images/Soundscapes/9e81e68b5662f67c64b9f492aa64a3427a106a17.png'),
  require('@/assets/images/Soundscapes/bfc2c315ed41cb92e2ac63a7365a52ac904a9b60.png'),
  require('@/assets/images/Soundscapes/ca2d4c60250f55608f15f65ef6ff07a253556f64.png'),
];

const CATEGORIES = ['Calm', 'Sleep', 'Focus', 'Meditate', 'Nature', 'Noise', 'Music', 'Frequencies', 'Premixed'];

const TAB_ITEMS = [
  { label: 'Home', icon: 'home-outline', route: '/(tabs)', active: false },
  { label: 'Mood', icon: 'happy-outline', route: '/(tabs)/mood', active: false },
  { label: 'Tools', icon: 'leaf-outline', route: '/(tabs)/tools', active: true },
  { label: 'Progress', icon: 'stats-chart-outline', route: '/(tabs)/progress', active: false },
  { label: 'Profile', icon: 'person-outline', route: '/(tabs)/profile', active: false },
] as const;

function getSubcategoryIcon(subcategory: string) {
  const value = String(subcategory ?? 'all').toLowerCase();

  if (value === 'all') return 'grid-outline';
  if (value.includes('sleep') || value.includes('nap') || value.includes('insomnia')) return 'moon-outline';
  if (value.includes('anxiety') || value.includes('calm')) return 'heart-outline';
  if (value.includes('burnout') || value.includes('recovery')) return 'leaf-outline';
  if (value.includes('rain') || value.includes('ocean') || value.includes('wind')) return 'cloud-outline';
  if (value.includes('music') || value.includes('lullaby') || value.includes('piano')) return 'musical-notes-outline';
  if (value.includes('asmr')) return 'headset-outline';
  if (value.includes('frequency')) return 'pulse-outline';

  return 'sparkles-outline';
}

function getSoundscapeThumb(soundscape: any, index: number) {
  const key = String(soundscape?.id ?? soundscape?.title ?? index);
  const hash = key.split('').reduce((sum, char) => sum + char.charCodeAt(0), index);
  return soundscapeThumbImages[hash % soundscapeThumbImages.length];
}

type SoundscapeListCardProps = {
  soundscape: any;
  index: number;
  isPlaying: boolean;
  isLoading: boolean;
  onPress: (soundscape: any) => void;
};

const SoundscapeListCard = memo(function SoundscapeListCard({
  soundscape,
  index,
  isPlaying,
  isLoading,
  onPress,
}: SoundscapeListCardProps) {
  return (
    <Pressable
      onPress={() => onPress(soundscape)}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}>
      <View style={styles.thumbWrap}>
        <Image source={getSoundscapeThumb(soundscape, index)} style={styles.thumb} contentFit="cover" />
        <View style={styles.thumbOverlay}>
          {isLoading ? (
            <ActivityIndicator color="#FFF" size="small" />
          ) : (
            <Ionicons name={isPlaying ? 'pause' : 'play'} size={14} color="#FFF" />
          )}
        </View>
      </View>
      <View style={styles.cardText}>
        <Text style={styles.cardTitle} numberOfLines={1}>{soundscape.title}</Text>
        <Text style={styles.cardSubtitle}>{soundscape.subcategory}</Text>
      </View>
      <View style={[styles.playSmall, isPlaying && styles.playSmallActive]}>
        <Ionicons
          name={isPlaying ? 'pause' : 'play'}
          size={13}
          color={isPlaying ? '#FFF' : '#173F5F'}
        />
      </View>
    </Pressable>
  );
});

export default function SoundscapeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const categoryTabInset = 4;
  const tabWidth = Math.max(96, (screenWidth - 40 - 12 - categoryTabInset * 2) / 3);
  const [activeCategory, setActiveCategory] = useState('Calm');
  const [activeSubcategory, setActiveSubcategory] = useState<string>('All');
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [audioLoading, setAudioLoading] = useState(false);
  const soundRef = useRef<Audio.Sound | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['soundscapes'],
    queryFn: () => apiClient<any>('/api/soundscapes'),
  });

  const grouped: Record<string, any[]> = (data as any)?.data ?? {};
  const currentList: any[] = grouped[activeCategory] ?? [];
  const subcategories = ['All', ...Array.from(new Set(currentList.map((s: any) => s.subcategory)))];
  const filtered = activeSubcategory === 'All'
    ? currentList
    : currentList.filter((s: any) => s.subcategory === activeSubcategory);
  const featured = filtered[0] ?? null;
  const rest = filtered.slice(1);

  useEffect(() => {
    setActiveSubcategory('All');
  }, [activeCategory]);

  useEffect(() => {
    return () => { soundRef.current?.unloadAsync().catch(() => {}); };
  }, []);

  const togglePlay = useCallback(async (soundscape: any) => {
    try {
      if (playingId === soundscape.id) {
        await soundRef.current?.pauseAsync();
        setPlayingId(null);
        return;
      }

      setAudioLoading(true);
      await soundRef.current?.unloadAsync().catch(() => {});
      soundRef.current = null;
      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true, staysActiveInBackground: true });
      const { sound } = await Audio.Sound.createAsync(
        { uri: soundscape.file_url },
        { shouldPlay: true, isLooping: true }
      );
      soundRef.current = sound;
      setPlayingId(soundscape.id);
    } catch (e) {
      console.log('Audio error:', e);
    } finally {
      setAudioLoading(false);
    }
  }, [playingId]);

  const handleListCardPress = useCallback((soundscape: any) => {
    router.push({
      pathname: '/tools/soundscape-player',
      params: {
        id: soundscape.id,
        title: soundscape.title,
        subcategory: soundscape.subcategory,
        file_url: soundscape.file_url,
      },
    });
  }, [router]);

  const renderListCard = useCallback(({ item, index }: { item: any; index: number }) => (
    <SoundscapeListCard
      index={index}
      isLoading={audioLoading && playingId === item.id}
      isPlaying={playingId === item.id}
      onPress={handleListCardPress}
      soundscape={item}
    />
  ), [audioLoading, handleListCardPress, playingId]);

  return (
    <ImageBackground source={backgroundImage} resizeMode="cover" style={styles.screen}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ScrollView
          bounces={false}
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 68 }]}
          showsVerticalScrollIndicator={false}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backChevron}>‹</Text>
          </Pressable>

          <Text style={styles.title}>Soundscapes</Text>
          <Text style={styles.subtitle}>Find your calm</Text>

          <View style={styles.tabsShell}>
            <ScrollView
              horizontal
              bounces={false}
              contentContainerStyle={styles.tabsContent}
              showsHorizontalScrollIndicator={false}>
              {CATEGORIES.map((cat) => {
                const isActive = activeCategory === cat;

                return (
                  <Pressable
                    key={cat}
                    onPress={() => setActiveCategory(cat)}
                    style={[styles.tab, { width: tabWidth }]}>
                    {isActive && (
                      <LinearGradient
                        colors={['#A987E2', '#5D7EEA']}
                        locations={[0, 1]}
                        start={{ x: 0.5, y: -0.55 }}
                        end={{ x: 0.5, y: 1 }}
                        style={StyleSheet.absoluteFillObject}
                      />
                    )}
                    <Text style={[styles.tabText, isActive && styles.tabTextActive]} numberOfLines={1}>
                      {cat}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {!isLoading && (
            <View style={styles.subTabsShell}>
              <ScrollView
                key={activeCategory}
                horizontal
                bounces={false}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.subTabsContent}>
                {subcategories.map((sub) => {
                  const isActive = activeSubcategory === sub;

                  return (
                    <Pressable
                      key={sub}
                      onPress={() => setActiveSubcategory(sub)}
                      style={[styles.subTab, sub === 'All' && styles.subTabCompact]}>
                      <View style={styles.subTabFill}>
                        {isActive && (
                          <LinearGradient
                            colors={['#A987E2', '#5D7EEA']}
                            locations={[0, 1]}
                            start={{ x: 0.5, y: -0.55 }}
                            end={{ x: 0.5, y: 1 }}
                            style={StyleSheet.absoluteFillObject}
                          />
                        )}
                        <Ionicons
                          name={getSubcategoryIcon(sub) as any}
                          size={20}
                          color={isActive ? '#FFFFFF' : '#54555A'}
                        />
                        <Text style={[styles.subTabText, isActive && styles.subTabTextActive]} numberOfLines={2}>
                          {sub}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {isLoading ? (
            <View style={styles.loadingState}>
              <ActivityIndicator color="#7B61FF" size="large" />
            </View>
          ) : (
            <>
              <View style={styles.seeAllRow}>
                <Text style={styles.seeAllCount}>{filtered.length} tracks</Text>
                <Pressable onPress={() => router.push('/tools/all-theme' as any)}>
                  <Text style={styles.seeAllText}>See all</Text>
                </Pressable>
              </View>

              {featured && (
                <Pressable onPress={() => router.push({ pathname: '/tools/soundscape-player', params: { id: featured.id, title: featured.title, subcategory: featured.subcategory, file_url: featured.file_url } })} style={styles.featuredCard}>
                  <Image source={featuredImage} style={styles.featuredBg} contentFit="cover" />
                  <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.65)']}
                    style={StyleSheet.absoluteFillObject}
                  />
                  <View style={styles.featuredContent}>
                    <Text style={styles.featuredSub}>{featured.subcategory}</Text>
                    <Text style={styles.featuredTitle}>{featured.title}</Text>
                    <View style={styles.featuredBottom}>
                      <View style={[styles.playBtn, audioLoading && !playingId && { opacity: 0.7 }]}>
                        {audioLoading && playingId === null ? (
                          <ActivityIndicator color="#FFF" size="small" />
                        ) : (
                          <Ionicons name={playingId === featured.id ? 'pause' : 'play'} size={18} color="#FFF" />
                        )}
                      </View>
                      <Text style={styles.featuredDuration}>20.00</Text>
                    </View>
                  </View>
                </Pressable>
              )}

              <View style={styles.contentPanel}>
                <LinearGradient
                  colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.92)', '#FFFFFF']}
                  locations={[0, 0.55, 1]}
                  style={styles.panelFog}
                />
                <FlatList
                  contentContainerStyle={styles.list}
                  data={rest}
                  initialNumToRender={8}
                  keyExtractor={(item, index) => String(item.id ?? item.title ?? index)}
                  maxToRenderPerBatch={8}
                  nestedScrollEnabled
                  removeClippedSubviews
                  renderItem={renderListCard}
                  scrollEnabled={false}
                  updateCellsBatchingPeriod={40}
                  windowSize={5}
                />
              </View>
            </>
          )}
        </ScrollView>
      </SafeAreaView>

      <View
        pointerEvents="none"
        style={[styles.tabBarDock, { height: Math.max(insets.bottom, 8) + 76 }]}
      />

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
  backChevron: { color: '#173F5F', fontSize: 26, fontWeight: '300', lineHeight: 30, marginTop: -2 },
  title: {
    color: '#173F5F',
    fontFamily: AppFonts.displayBold,
    fontSize: 32,
    lineHeight: 40,
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    color: '#8C8C8C',
    fontFamily: AppFonts.sansRegular,
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 20,
    textAlign: 'center',
  },
  tabsShell: {
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: 30,
    marginBottom: 12,
    overflow: 'hidden',
    padding: 6,
    shadowColor: '#5275E8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  tabsContent: {
    alignItems: 'center',
    gap: 0,
    paddingLeft: 4,
    paddingRight: 4,
  },
  tab: {
    alignItems: 'center',
    borderRadius: 24,
    height: 48,
    justifyContent: 'center',
    overflow: 'hidden',
    paddingHorizontal: 8,
  },
  tabText: {
    color: '#54555A',
    fontFamily: AppFonts.sansMedium,
    fontSize: 15,
    lineHeight: 20,
    textAlign: 'center',
  },
  tabTextActive: {
    color: '#FFFFFF',
    fontFamily: AppFonts.sansSemiBold,
  },
  subTabsShell: {
    marginBottom: 16,
    marginHorizontal: -4,
  },
  subTabsContent: {
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 4,
    paddingRight: 28,
  },
  subTab: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 14,
    elevation: 3,
    minHeight: 62,
    minWidth: 104,
    overflow: 'hidden',
    padding: 5,
    shadowColor: '#5275E8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  subTabCompact: {
    minWidth: 76,
  },
  subTabFill: {
    alignItems: 'center',
    borderRadius: 10,
    flexDirection: 'row',
    gap: 9,
    justifyContent: 'center',
    minHeight: 52,
    overflow: 'hidden',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  subTabText: {
    color: '#54555A',
    flexShrink: 1,
    fontFamily: AppFonts.sansMedium,
    fontSize: 14,
    lineHeight: 18,
  },
  subTabTextActive: {
    color: '#FFFFFF',
    fontFamily: AppFonts.sansSemiBold,
  },
  loadingState: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 260,
  },
  contentPanel: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: -20,
    marginTop: -96,
    minHeight: 520,
    overflow: 'visible',
    paddingHorizontal: 20,
    paddingTop: 112,
    zIndex: 0,
  },
  panelFog: {
    height: 92,
    left: 0,
    position: 'absolute',
    right: 0,
    top: -46,
  },
  featuredCard: {
    borderRadius: 20,
    height: 200,
    marginBottom: 0,
    overflow: 'hidden',
    elevation: 4,
    zIndex: 2,
  },
  featuredBg: { ...StyleSheet.absoluteFillObject },
  featuredContent: {
    bottom: 0,
    left: 0,
    padding: 16,
    position: 'absolute',
    right: 0,
  },
  featuredSub: {
    color: 'rgba(255,255,255,0.8)',
    fontFamily: AppFonts.sansRegular,
    fontSize: 11,
    marginBottom: 4,
  },
  featuredTitle: {
    color: '#FFFFFF',
    fontFamily: AppFonts.displayBold,
    fontSize: 20,
    lineHeight: 26,
    marginBottom: 8,
  },
  featuredBottom: { alignItems: 'center', flexDirection: 'row', gap: 12 },
  playBtn: {
    alignItems: 'center',
    backgroundColor: 'rgba(123,97,255,0.85)',
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  featuredDuration: { color: '#FFFFFF', fontFamily: AppFonts.sansMedium, fontSize: 14 },
  seeAllRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    marginTop: -2,
  },
  seeAllCount: { color: '#8C8C8C', fontFamily: AppFonts.sansRegular, fontSize: 13 },
  seeAllText: { color: '#3770FC', fontFamily: AppFonts.sansMedium, fontSize: 16 },
  list: { gap: 10, paddingBottom: 20 },
  card: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 14,
    flexDirection: 'row',
    overflow: 'hidden',
    elevation: 3,
  },
  cardPressed: { opacity: 0.88, transform: [{ scale: 0.99 }] },
  thumbWrap: { height: 68, width: 90 },
  thumb: { height: 68, width: 90 },
  thumbOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.22)',
    justifyContent: 'center',
  },
  cardText: { flex: 1, paddingHorizontal: 12, paddingVertical: 8 },
  cardTitle: {
    color: '#173F5F',
    fontFamily: AppFonts.sansSemiBold,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 3,
  },
  cardSubtitle: {
    color: '#8C8C8C',
    fontFamily: AppFonts.sansRegular,
    fontSize: 11,
    lineHeight: 15,
  },
  playSmall: {
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    borderRadius: 16,
    height: 32,
    justifyContent: 'center',
    marginRight: 12,
    width: 32,
  },
  playSmallActive: { backgroundColor: '#7B61FF' },
  tabBarDock: {
    backgroundColor: '#FFFFFF',
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
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
