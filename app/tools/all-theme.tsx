import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { memo, useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  ImageBackground,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';

import { ExploreButton } from '@/components/ExploreButton';
import { ExploreTabChip } from '@/components/ExploreTabChip';
import { useScreenBottomPadding } from '@/components/ScreenWrapper';
import { AppFonts } from '@/constants/theme';
import { apiClient } from '@/lib/api/client';

const backgroundImage = require('@/assets/images/fa705fcbeb88072529fa645d7e8bbe09af950627.png');

const soundscapeThumbImages = [
  require('@/assets/images/Soundscapes/2908a0f59f35c9c7ae2c8285f7fbae865b961900.jpg'),
  require('@/assets/images/Soundscapes/62d5eea8a9bf6a378613529ceb2d49c516fe4649.png'),
  require('@/assets/images/Soundscapes/62d5eea8a9bf6a378613529ceb2d49c516fe4649.png'),
  require('@/assets/images/Soundscapes/6abde34cdd0f9b832382330833ec78ea26a91a16.png'),
  require('@/assets/images/Soundscapes/9776a63951638391cc6e9b9a6997f3fa69894165.png'),
  require('@/assets/images/Soundscapes/9e81e68b5662f67c64b9f492aa64a3427a106a17.png'),
  require('@/assets/images/Soundscapes/bfc2c315ed41cb92e2ac63a7365a52ac904a9b60.png'),
  require('@/assets/images/Soundscapes/ca2d4c60250f55608f15f65ef6ff07a253556f64.png'),
];

const CATEGORIES = ['All', 'Calm', 'Sleep', 'Focus', 'Meditate', 'Nature', 'Noise', 'Music', 'Frequencies', 'Premixed'];

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

function getThumb(soundscape: any, index: number) {
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

type SoundscapeGridCardProps = {
  soundscape: any;
  index: number;
  width: number;
  isPlaying: boolean;
  isLoading: boolean;
  onPress: (soundscape: any) => void;
};

const SoundscapeGridCard = memo(function SoundscapeGridCard({
  soundscape,
  index,
  width,
  isPlaying,
  isLoading,
  onPress,
}: SoundscapeGridCardProps) {
  return (
    <Pressable
      onPress={() => onPress(soundscape)}
      style={({ pressed }) => [
        styles.gridCard,
        { width },
        pressed && styles.cardPressed,
      ]}>
      <Image source={getThumb(soundscape, index)} style={styles.gridCardImage} contentFit="cover" />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.72)']}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={styles.gridCardContent}>
        <Text style={styles.gridCardSub} numberOfLines={1}>{soundscape.subcategory}</Text>
        <Text style={styles.gridCardTitle} numberOfLines={2}>{soundscape.title}</Text>
        <Text style={styles.gridCardDuration}>{formatDuration(soundscape.duration_seconds)}</Text>
      </View>
      <View style={styles.gridPlayBtn}>
        {isLoading ? (
          <ActivityIndicator color="#FFF" size="small" />
        ) : (
          <Ionicons name={isPlaying ? 'pause' : 'play'} size={17} color="#FFF" />
        )}
      </View>
    </Pressable>
  );
});

export default function AllThemeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const bottomPadding = useScreenBottomPadding();
  const { width } = useWindowDimensions();
  const cardWidth = (width - 40 - 12) / 2;
  const soundRef = useRef<Audio.Sound | null>(null);

  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeSubcategory, setActiveSubcategory] = useState('All');
  const [draftCategory, setDraftCategory] = useState('All');
  const [draftSubcategory, setDraftSubcategory] = useState('All');
  const [showFilter, setShowFilter] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [audioLoading, setAudioLoading] = useState(false);
  const [visibleCount, setVisibleCount] = useState(100);
  const deferredSearch = useDeferredValue(search);

  const { data, isLoading } = useQuery({
    queryKey: ['soundscapes'],
    queryFn: () => apiClient<any>('/api/soundscapes'),
  });

  const grouped: Record<string, any[]> = useMemo(() => (data as any)?.data ?? {}, [data]);

  const allSoundscapes = useMemo(() => {
    return CATEGORIES.filter((cat) => cat !== 'All').flatMap((cat) =>
      (grouped[cat] ?? []).map((soundscape: any) => ({ ...soundscape, category: cat }))
    );
  }, [grouped]);

  const categoryFiltered = useMemo(() => {
    if (activeCategory === 'All') {
      return allSoundscapes;
    }
    return allSoundscapes.filter((s: any) => s.category === activeCategory);
  }, [activeCategory, allSoundscapes]);

  const subcategories = useMemo(() => {
    return ['All', ...Array.from(new Set(categoryFiltered.map((s: any) => s.subcategory).filter(Boolean)))];
  }, [categoryFiltered]);

  const modalSubcategories = useMemo(() => {
    const source = draftCategory === 'All'
      ? allSoundscapes
      : allSoundscapes.filter((s: any) => s.category === draftCategory);
    return ['All', ...Array.from(new Set(source.map((s: any) => s.subcategory).filter(Boolean)))];
  }, [allSoundscapes, draftCategory]);

  const filtered = useMemo(() => {
    let list = categoryFiltered;

    if (activeSubcategory !== 'All') {
      list = list.filter((s: any) => s.subcategory === activeSubcategory);
    }

    if (deferredSearch.trim()) {
      const q = deferredSearch.trim().toLowerCase();
      list = list.filter((s: any) =>
        String(s.title ?? '').toLowerCase().includes(q) ||
        String(s.subcategory ?? '').toLowerCase().includes(q) ||
        String(s.category ?? '').toLowerCase().includes(q)
      );
    }

    return list;
  }, [activeSubcategory, categoryFiltered, deferredSearch]);

  const visibleSoundscapes = useMemo(() => {
    return filtered.slice(0, visibleCount);
  }, [filtered, visibleCount]);

  useEffect(() => {
    if (!subcategories.includes(activeSubcategory)) {
      setActiveSubcategory('All');
    }
  }, [activeSubcategory, subcategories]);

  useEffect(() => {
    setVisibleCount(100);
  }, [activeCategory, activeSubcategory, deferredSearch]);

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

  function openFilter() {
    setDraftCategory(activeCategory);
    setDraftSubcategory(activeSubcategory);
    setShowFilter(true);
  }

  function applyFilter() {
    setActiveCategory(draftCategory);
    setActiveSubcategory(draftSubcategory);
    setShowFilter(false);
  }

  const handleGridCardPress = useCallback((soundscape: any) => {
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

  const renderGridCard = useCallback(({ item, index }: { item: any; index: number }) => (
    <SoundscapeGridCard
      index={index}
      isLoading={audioLoading && playingId === item.id}
      isPlaying={playingId === item.id}
      onPress={handleGridCardPress}
      soundscape={item}
      width={cardWidth}
    />
  ), [audioLoading, cardWidth, handleGridCardPress, playingId]);

  const listFooter = useMemo(() => {
    if (visibleCount >= filtered.length) return null;

    return (
      <ExploreButton
        label="View more"
        onPress={() => setVisibleCount((prev) => prev + 100)}
        style={styles.viewMoreButton}
      />
    );
  }, [filtered.length, visibleCount]);

  return (
    <ImageBackground source={backgroundImage} resizeMode="cover" style={styles.screen}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.header}>
          <Pressable
            accessibilityLabel="Go back"
            hitSlop={12}
            onPress={() => router.back()}
            style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
            <Ionicons name="chevron-back" size={18} color="#000000" />
          </Pressable>

          <Text style={styles.title}>All Theme</Text>
          <Text style={styles.subtitle}>Find your calm</Text>

          <View style={styles.searchRow}>
            <View style={styles.searchBox}>
              <Ionicons name="search-outline" size={18} color="#8C8C8C" style={styles.searchIcon} />
              <TextInput
                onChangeText={setSearch}
                placeholder="Search soundscape"
                placeholderTextColor="#9A9A9A"
                returnKeyType="search"
                style={styles.searchInput}
                value={search}
              />
            </View>
            <Pressable onPress={openFilter} style={styles.filterBtn}>
              <Ionicons name="options-outline" size={20} color="#3770FC" />
            </Pressable>
          </View>
        </View>

          {isLoading ? (
            <View style={styles.loadingState}>
              <ActivityIndicator color="#7B61FF" size="large" />
            </View>
          ) : (
            <>
              <View style={styles.subTabsShell}>
                <ScrollView
                  horizontal
                  bounces={false}
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.subTabsContent}>
                  {subcategories.map((sub) => {
                    const isActive = activeSubcategory === sub;
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
                        onPress={() => setActiveSubcategory(sub)}
                        style={sub === 'All' ? styles.subTabCompact : undefined}
                        variant="subtab"
                      />
                    );
                  })}
                </ScrollView>
              </View>
              <View style={styles.contentPanel}>
                <View style={styles.panelWhite} />
                <LinearGradient
                  colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.92)', '#FFFFFF']}
                  locations={[0, 0.5, 1]}
                  style={styles.panelFog}
                />
                <FlatList
                  bounces={false}
                  columnWrapperStyle={styles.gridRow}
                  contentContainerStyle={[styles.grid, { paddingBottom: insets.bottom + 96 }]}
                  data={visibleSoundscapes}
                  initialNumToRender={6}
                  keyExtractor={(item, index) => String(item.id ?? item.title ?? index)}
                  ListFooterComponent={listFooter}
                  maxToRenderPerBatch={6}
                  numColumns={2}
                  removeClippedSubviews
                  renderItem={renderGridCard}
                  showsVerticalScrollIndicator={false}
                  updateCellsBatchingPeriod={40}
                  windowSize={5}
                />
              </View>
            </>
          )}
      </SafeAreaView>

      <Modal
        animationType="fade"
        onRequestClose={() => setShowFilter(false)}
        statusBarTranslucent
        transparent
        visible={showFilter}>
        <View style={styles.modalBackdrop}>
          <View pointerEvents="none" style={[styles.statusBarDim, { height: insets.top }]} />
          <Pressable style={StyleSheet.absoluteFillObject} onPress={() => setShowFilter(false)} />
          <View style={[styles.filterSheet, { paddingBottom: bottomPadding }]}>
            <Pressable
              onPress={() => setShowFilter(false)}
              onLongPress={() => setShowFilter(false)}
              style={styles.sheetHandleHitbox}>
              <View style={styles.sheetHandle} />
            </Pressable>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Filter soundscapes</Text>
              <Pressable onPress={() => setShowFilter(false)} style={styles.sheetCloseBtn}>
                <Ionicons name="close" size={20} color="#173F5F" />
              </Pressable>
            </View>
            <Text style={styles.sheetSection}>Category</Text>
            <View style={styles.optionGrid}>
              {CATEGORIES.map((cat) => {
                const isActive = draftCategory === cat;
                return (
                  <ExploreTabChip
                    key={cat}
                    active={isActive}
                    label={cat}
                    onPress={() => {
                      setDraftCategory(cat);
                      setDraftSubcategory('All');
                    }}
                    variant="chip"
                  />
                );
              })}
            </View>

            <Text style={styles.sheetSection}>Sub category</Text>
            <ScrollView style={styles.modalSubScroll} showsVerticalScrollIndicator={false}>
              <View style={styles.optionGrid}>
                {modalSubcategories.map((sub) => {
                  const isActive = draftSubcategory === sub;
                  return (
                    <ExploreTabChip
                      key={sub}
                      active={isActive}
                      label={sub}
                      onPress={() => setDraftSubcategory(sub)}
                      variant="chip"
                    />
                  );
                })}
              </View>
            </ScrollView>

            <ExploreButton
              label="Save Filter"
              onPress={applyFilter}
              style={styles.applyButton}
            />
          </View>
        </View>
      </Modal>

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
  header: { paddingHorizontal: 20, paddingTop: 16 },
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
    marginBottom: 16,
    textAlign: 'center',
  },
  searchRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  searchBox: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 24,
    elevation: 3,
    flex: 1,
    flexDirection: 'row',
    minHeight: 48,
    paddingHorizontal: 14,
    shadowColor: '#5275E8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  searchIcon: { marginRight: 8 },
  searchInput: {
    color: '#173F5F',
    flex: 1,
    fontFamily: AppFonts.sansRegular,
    fontSize: 14,
    paddingVertical: 0,
  },
  filterBtn: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 22,
    elevation: 3,
    height: 48,
    justifyContent: 'center',
    shadowColor: '#5275E8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    width: 48,
  },
  subTabsShell: {
    marginBottom: 8,
    marginHorizontal: 16,
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
  countRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  countText: { color: '#8C8C8C', fontFamily: AppFonts.sansRegular, fontSize: 13 },
  loadingState: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 260,
  },
  contentPanel: {
    backgroundColor: 'transparent',
    flex: 1,
    marginHorizontal: 0,
    minHeight: 520,
    overflow: 'visible',
    paddingHorizontal: 20,
    paddingTop: 14,
  },
  panelWhite: {
    backgroundColor: '#FFFFFF',
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 100,
  },
  panelFog: {
    height: 92,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 52,
  },
  grid: { paddingTop: 14 },
  gridRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  gridCard: {
    borderRadius: 18,
    elevation: 4,
    height: 174,
    overflow: 'hidden',
  },
  gridCardImage: {
    ...StyleSheet.absoluteFillObject,
  },
  cardPressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },
  gridCardContent: {
    bottom: 0,
    left: 0,
    padding: 12,
    position: 'absolute',
    right: 0,
  },
  gridCardSub: {
    color: 'rgba(255,255,255,0.78)',
    fontFamily: AppFonts.sansRegular,
    fontSize: 10,
    marginBottom: 3,
  },
  gridCardTitle: {
    color: '#FFFFFF',
    fontFamily: AppFonts.sansBold,
    fontSize: 14,
    lineHeight: 18,
    marginBottom: 4,
  },
  gridCardDuration: {
    color: 'rgba(255,255,255,0.85)',
    fontFamily: AppFonts.sansMedium,
    fontSize: 12,
  },
  gridPlayBtn: {
    alignItems: 'center',
    backgroundColor: 'rgba(123,97,255,0.82)',
    borderRadius: 20,
    height: 38,
    justifyContent: 'center',
    position: 'absolute',
    right: 12,
    top: 12,
    width: 38,
  },
  viewMoreButton: {
    alignSelf: 'center',
    marginTop: 8,
  },
  modalBackdrop: {
    backgroundColor: 'rgba(23, 63, 95, 0.48)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  statusBarDim: {
    backgroundColor: 'rgba(23, 63, 95, 0.48)',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 2,
  },
  filterSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '82%',
    padding: 20,
    width: '100%',
  },
  sheetHandleHitbox: {
    alignSelf: 'center',
    alignItems: 'center',
    height: 24,
    justifyContent: 'center',
  },
  sheetHandle: {
    backgroundColor: '#E3E3E3',
    borderRadius: 3,
    height: 5,
    width: 48,
  },
  sheetHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sheetTitle: {
    color: '#173F5F',
    fontFamily: AppFonts.displayBold,
    fontSize: 20,
  },
  sheetCloseBtn: {
    alignItems: 'center',
    backgroundColor: '#F4F5FA',
    borderRadius: 16,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  sheetSection: {
    color: '#173F5F',
    fontFamily: AppFonts.sansSemiBold,
    fontSize: 15,
    marginBottom: 10,
    marginTop: 8,
  },
  optionGrid: {
    alignItems: 'stretch',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  modalSubScroll: {
    maxHeight: 230,
  },
  applyButton: {
    alignSelf: 'center',
    marginTop: 18,
    maxWidth: 348,
    width: '100%',
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
