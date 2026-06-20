import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { memo, startTransition, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { StatusBar } from 'expo-status-bar';

import { ExploreTabChip } from '@/components/ExploreTabChip';
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
const LIST_CARD_HEIGHT = 68;
const LIST_SEPARATOR_HEIGHT = 10;
const LIST_ROW_HEIGHT = LIST_CARD_HEIGHT + LIST_SEPARATOR_HEIGHT;

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
  if (soundscape?.thumbSource) return soundscape.thumbSource;

  const key = String(soundscape?.id ?? soundscape?.title ?? index);
  const hash = key.split('').reduce((sum, char) => sum + char.charCodeAt(0), index);
  return soundscapeThumbImages[hash % soundscapeThumbImages.length];
}

function formatDuration(seconds?: number) {
  const safe = Number.isFinite(seconds) ? Math.max(0, Math.round(seconds!)) : 180;
  const m = Math.floor(safe / 60).toString().padStart(2, '0');
  const s = Math.floor(safe % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
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
      <View style={styles.playSmall}>
        <Ionicons name="play" size={13} color="#173F5F" style={styles.playSmallIcon} />
      </View>
    </Pressable>
  );
});

export default function SoundscapeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { height: screenHeight, width: screenWidth } = useWindowDimensions();
  const imageSectionHeight = screenHeight * 0.5;
  const tabWidth = Math.max(104, (screenWidth - 40 - 12 - 8) / 3);
  const [activeCategory, setActiveCategory] = useState('Calm');
  const [activeSubcategory, setActiveSubcategory] = useState<string>('All');
  const [selectedCategory, setSelectedCategory] = useState('Calm');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('All');
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [audioLoading, setAudioLoading] = useState(false);
  const soundRef = useRef<Audio.Sound | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['soundscapes'],
    queryFn: () => apiClient<any>('/api/soundscapes'),
  });

  const grouped: Record<string, any[]> = useMemo(() => (data as any)?.data ?? {}, [data]);
  const currentList: any[] = useMemo(() => grouped[activeCategory] ?? [], [activeCategory, grouped]);
  const subcategories = useMemo(
    () => ['All', ...Array.from(new Set(currentList.map((s: any) => s.subcategory)))],
    [currentList]
  );
  const filtered = useMemo(
    () => activeSubcategory === 'All'
      ? currentList
      : currentList.filter((s: any) => s.subcategory === activeSubcategory),
    [activeSubcategory, currentList]
  );
  const featured = filtered[0] ?? null;
  const rest = useMemo(
    () => filtered.slice(1).map((soundscape: any, index: number) => ({
      ...soundscape,
      thumbSource: getSoundscapeThumb(soundscape, index),
    })),
    [filtered]
  );

  const handleCategoryPress = useCallback((category: string) => {
    setSelectedCategory(category);
    setSelectedSubcategory('All');

    startTransition(() => {
      setActiveCategory(category);
      setActiveSubcategory('All');
    });
  }, []);

  const handleSubcategoryPress = useCallback((subcategory: string) => {
    setSelectedSubcategory(subcategory);

    startTransition(() => {
      setActiveSubcategory(subcategory);
    });
  }, []);

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
        duration_seconds: String(soundscape.duration_seconds ?? 180),
      },
    });
  }, [router]);

  const getItemLayout = useCallback((_: ArrayLike<any> | null | undefined, index: number) => ({
    length: LIST_ROW_HEIGHT,
    offset: LIST_ROW_HEIGHT * index,
    index,
  }), []);

  const renderListCard = useCallback(({ item, index }: { item: any; index: number }) => (
    <View style={styles.listItemWrap}>
      <SoundscapeListCard
        index={index}
        isLoading={audioLoading && playingId === item.id}
        isPlaying={playingId === item.id}
        onPress={handleListCardPress}
        soundscape={item}
      />
    </View>
  ), [audioLoading, handleListCardPress, playingId]);

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" translucent backgroundColor="transparent" />
      <View style={styles.safeArea}>
        <FlatList
          bounces={false}
          contentContainerStyle={[
            styles.scroll,
            { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 68 },
          ]}
          data={isLoading ? [] : rest}
          getItemLayout={getItemLayout}
          initialNumToRender={6}
          ItemSeparatorComponent={() => <View style={styles.itemSeparator} />}
          keyExtractor={(item, index) => String(item.id ?? item.title ?? index)}
          maxToRenderPerBatch={6}
          removeClippedSubviews
          renderItem={renderListCard}
          showsVerticalScrollIndicator={false}
          style={styles.list}
          updateCellsBatchingPeriod={60}
          windowSize={7}
          ListFooterComponent={() => <View style={styles.listFooter} />}
          ListHeaderComponent={
            <View style={styles.headerWrap}>
              <View
                pointerEvents="none"
                style={[
                  styles.scrollWhiteBg,
                  { minHeight: screenHeight * 2, top: imageSectionHeight - 16 },
                ]}
              />
              <View
                pointerEvents="none"
                style={[
                  styles.scrollImageBg,
                  { height: imageSectionHeight + insets.top, top: -(16 + insets.top) },
                ]}>
                <Image source={backgroundImage} style={styles.scrollImageFill} contentFit="cover" />
                <LinearGradient
                  colors={[
                    'rgba(255,255,255,0)',
                    'rgba(255,255,255,0.4)',
                    'rgba(255,255,255,0.85)',
                    '#FFFFFF',
                  ]}
                  locations={[0, 0.3, 0.7, 1]}
                  style={styles.transitionFog}
                />
              </View>

              <View style={styles.headerContent}>
              <Pressable
                accessibilityLabel="Go back"
                hitSlop={12}
                onPress={() => router.back()}
                style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
                <Ionicons name="chevron-back" size={18} color="#000000" />
              </Pressable>

              <Text style={styles.title}>Soundscapes</Text>
              <Text style={styles.subtitle}>Find your calm</Text>

              <View style={styles.tabs}>
                <ScrollView
                  horizontal
                  bounces={false}
                  contentContainerStyle={styles.tabsContent}
                  showsHorizontalScrollIndicator={false}>
                  {CATEGORIES.map((cat) => (
                    <ExploreTabChip
                      key={cat}
                      active={selectedCategory === cat}
                      label={cat}
                      onPress={() => handleCategoryPress(cat)}
                      style={[styles.tabChip, { width: tabWidth }]}
                      variant="tab"
                    />
                  ))}
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
                      const isActive = selectedSubcategory === sub;

                      return (
                        <ExploreTabChip
                          key={sub}
                          active={isActive}
                          icon={
                            <Ionicons
                              name={getSubcategoryIcon(sub) as any}
                              size={20}
                              color={isActive ? '#FFFFFF' : '#54555A'}
                            />
                          }
                          label={sub}
                          onPress={() => handleSubcategoryPress(sub)}
                          style={sub === 'All' ? styles.subTabCompact : undefined}
                          variant="subtab"
                        />
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
                    <Pressable
                      onPress={() => router.push({ pathname: '/tools/soundscape-player', params: { id: featured.id, title: featured.title, subcategory: featured.subcategory, file_url: featured.file_url, duration_seconds: String(featured.duration_seconds ?? 180) } })}
                      style={styles.featuredCard}>
                      <Image source={featuredImage} style={styles.featuredBg} contentFit="cover" />
                      <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.65)']}
                        style={StyleSheet.absoluteFillObject}
                      />
                      <View style={styles.featuredContent}>
                        <Text style={styles.featuredSub}>{featured.subcategory}</Text>
                        <Text style={styles.featuredTitle}>{featured.title}</Text>
                        <View style={styles.featuredBottom}>
                          <View style={[styles.playCircle, audioLoading && !playingId && { opacity: 0.7 }]}>
                            <LinearGradient
                              colors={['#9174EC', '#5275E8']}
                              start={{ x: 0, y: 0 }}
                              end={{ x: 1, y: 1 }}
                              style={styles.playCircleGradient}>
                              {audioLoading && playingId === null ? (
                                <ActivityIndicator color="#FFF" size="small" />
                              ) : (
                                <Ionicons
                                  name={playingId === featured.id ? 'pause' : 'play'}
                                  size={18}
                                  color="#FFFFFF"
                                  style={styles.playCircleIcon}
                                />
                              )}
                            </LinearGradient>
                          </View>
                          <Text style={styles.featuredDuration}>{formatDuration(featured.duration_seconds)}</Text>
                        </View>
                      </View>
                    </Pressable>
                  )}

                  <View style={styles.listGap} />
                </>
              )}
              </View>
            </View>
          }
        />
      </View>

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
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: '#FFFFFF', flex: 1 },
  safeArea: { backgroundColor: '#FFFFFF', flex: 1 },
  list: { backgroundColor: '#FFFFFF', flex: 1 },
  scroll: { backgroundColor: '#FFFFFF', paddingHorizontal: 20 },
  headerWrap: {
    overflow: 'visible',
    position: 'relative',
    zIndex: 1,
  },
  scrollImageBg: {
    left: -20,
    overflow: 'hidden',
    position: 'absolute',
    right: -20,
    zIndex: 1,
  },
  scrollWhiteBg: {
    backgroundColor: '#FFFFFF',
    left: -20,
    position: 'absolute',
    right: -20,
    zIndex: 0,
  },
  headerContent: {
    position: 'relative',
    zIndex: 2,
  },
  scrollImageFill: {
    ...StyleSheet.absoluteFillObject,
  },
  transitionFog: {
    bottom: 0,
    height: 90,
    left: 0,
    position: 'absolute',
    right: 0,
    zIndex: 2,
  },
  listItemWrap: {
    backgroundColor: '#FFFFFF',
  },
  itemSeparator: {
    backgroundColor: '#FFFFFF',
    height: 10,
  },
  listFooter: {
    height: 16,
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
  tabs: {
    backgroundColor: '#FFFFFF',
    borderRadius: 34,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    marginHorizontal: 0,
    overflow: 'hidden',
    padding: 4,
    shadowColor: '#8B8BA0',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.14,
    shadowRadius: 24,
    elevation: 8,
  },
  tabsContent: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  tabChip: {
    flex: 0,
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
  subTabCompact: {
    minWidth: 76,
  },
  loadingState: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 260,
  },
  listGap: {
    height: 14,
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
    borderRadius: 22,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  playCircleIcon: {
    marginLeft: 0,
  },
  featuredDuration: { color: '#FFFFFF', fontFamily: AppFonts.sansMedium, fontSize: 14 },
  seeAllRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    marginTop: -2,
  },
  seeAllCount: { color: '#000000', fontFamily: AppFonts.sansRegular, fontSize: 13 },
  seeAllText: { color: '#000000', fontFamily: AppFonts.sansMedium, fontSize: 16 },
  card: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 14,
    flexDirection: 'row',
    overflow: 'hidden',
    borderColor: 'rgba(227,227,227,0.55)',
    borderWidth: 1,
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
    marginRight: 12,
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
