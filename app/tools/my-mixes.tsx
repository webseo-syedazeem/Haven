import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { DeleteMixModal } from '@/components/profile/DeleteMixModal';
import { ExploreTabChip } from '@/components/ExploreTabChip';
import { exploreGradientHorizontal } from '@/components/explore-gradient';
import { AppFonts } from '@/constants/theme';
import { type SoundscapeMix, type SoundscapeItem, soundscapeMixesApi } from '@/lib/api/soundscapeMixes';

const backgroundImage = require('@/assets/images/fa705fcbeb88072529fa645d7e8bbe09af950627.png');

const DEFAULT_TRACK_VOLUME = 0.7;

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

const TAB_ITEMS = [
  { label: 'Home', icon: 'home-outline', route: '/(tabs)', active: false },
  { label: 'Mood', icon: 'happy-outline', route: '/(tabs)/mood', active: false },
  { label: 'Tools', icon: 'leaf-outline', route: '/(tabs)/tools', active: true },
  { label: 'Progress', icon: 'stats-chart-outline', route: '/(tabs)/progress', active: false },
  { label: 'Profile', icon: 'person-outline', route: '/(tabs)/profile', active: false },
] as const;

const FILTER_TABS = ['All Mixes', 'Favorites', 'Recent'] as const;
type FilterTab = (typeof FILTER_TABS)[number];

const MIXES_QUERY_KEY = ['soundscape-mixes'] as const;

type MixesQueryData = {
  data: { mixes: SoundscapeMix[] };
};

function updateMixesCache(
  queryClient: ReturnType<typeof useQueryClient>,
  updater: (mixes: SoundscapeMix[]) => SoundscapeMix[]
) {
  queryClient.setQueryData<MixesQueryData>(MIXES_QUERY_KEY, (old) => {
    if (!old?.data?.mixes) return old;
    return {
      ...old,
      data: {
        mixes: updater(old.data.mixes),
      },
    };
  });
}

function getMixThumb(mix: SoundscapeMix, index = 0) {
  const key = String(mix.soundscapes?.[0]?.id ?? mix.id ?? index);
  const hash = key.split('').reduce((sum, char) => sum + char.charCodeAt(0), index);
  return soundscapeThumbImages[hash % soundscapeThumbImages.length];
}

function formatCreatedLabel(dateValue: string) {
  const created = new Date(dateValue);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfCreated = new Date(created.getFullYear(), created.getMonth(), created.getDate());
  const diffDays = Math.round((startOfToday.getTime() - startOfCreated.getTime()) / 86400000);

  if (diffDays <= 0) return 'Created Today';
  if (diffDays === 1) return 'Created Yesterday';
  if (diffDays < 7) return `Created ${diffDays} days ago`;
  return `Created ${created.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
}

function correctDurationSeconds(rawSeconds: number) {
  return Math.max(0, Math.round(rawSeconds));
}

function formatPlaybackTime(seconds: number) {
  const safe = Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
  const m = Math.floor(safe / 60).toString().padStart(2, '0');
  const s = Math.floor(safe % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function formatTotalDuration(seconds: number) {
  return formatPlaybackTime(correctDurationSeconds(seconds));
}

function formatDurationLabel(rawSeconds: number) {
  const minutes = Math.max(1, Math.round(correctDurationSeconds(rawSeconds) / 60));
  return `${minutes} min`;
}

function getMixTracks(mix: SoundscapeMix): SoundscapeItem[] {
  return (mix.soundscapes ?? []).filter((track) => Boolean(track.file_url));
}

type MixCardProps = {
  mix: SoundscapeMix;
  index: number;
  menuOpen: boolean;
  durationSeconds?: number | null;
  onToggleFavorite: (mix: SoundscapeMix) => void;
  onOpenMenu: (mixId: string) => void;
  onCloseMenu: () => void;
  onPlay: (mix: SoundscapeMix) => void;
  onUpdate: (mix: SoundscapeMix) => void;
  onDelete: (mix: SoundscapeMix) => void;
};

function MixCard({
  mix,
  index,
  menuOpen,
  durationSeconds,
  onToggleFavorite,
  onOpenMenu,
  onCloseMenu,
  onPlay,
  onUpdate,
  onDelete,
}: MixCardProps) {
  return (
    <View style={[styles.cardWrap, menuOpen && styles.cardWrapOpen]}>
      <View style={styles.card}>
        <Pressable
          onPress={() => onPlay(mix)}
          style={({ pressed }) => [styles.cardMain, pressed && styles.pressed]}>
          <View style={styles.thumbWrap}>
            <Image source={getMixThumb(mix, index)} style={styles.thumb} contentFit="cover" />
            <View style={styles.thumbPlayOverlay}>
              <View style={styles.thumbPlayBtn}>
                <Ionicons color="#6339FB" name="play" size={16} style={styles.playIconOffset} />
              </View>
            </View>
          </View>

          <View style={styles.cardBody}>
            <Text numberOfLines={1} style={styles.cardTitle}>
              {mix.name}
            </Text>
            <Text style={styles.cardMeta}>{formatCreatedLabel(mix.created_at)}</Text>
            <View style={styles.durationRow}>
              <Ionicons color="#8C8C8C" name="time-outline" size={14} />
              <Text style={styles.durationText}>
                {durationSeconds != null ? formatDurationLabel(durationSeconds) : '-- min'}
              </Text>
            </View>
          </View>
        </Pressable>

        <View style={styles.cardActions}>
          <Pressable
            hitSlop={8}
            onPress={(event) => {
              event.stopPropagation();
              onToggleFavorite(mix);
            }}
            style={({ pressed }) => [styles.starBtn, pressed && styles.pressed]}>
            <Ionicons
              color={mix.is_favorite ? '#6339FB' : '#C5C5C5'}
              name={mix.is_favorite ? 'star' : 'star-outline'}
              size={22}
            />
          </Pressable>

          <Pressable
            hitSlop={8}
            onPress={(event) => {
              event.stopPropagation();
              if (menuOpen) {
                onCloseMenu();
              } else {
                onOpenMenu(mix.id);
              }
            }}
            style={({ pressed }) => [styles.menuBtn, pressed && styles.pressed]}>
            <Ionicons color="#173F5F" name="ellipsis-vertical" size={18} />
          </Pressable>
        </View>
      </View>

      {menuOpen ? (
        <View style={styles.dropdown}>
          <Pressable
            onPress={() => {
              onCloseMenu();
              onUpdate(mix);
            }}
            style={({ pressed }) => [styles.dropdownItem, pressed && styles.dropdownItemPressed]}>
            <Ionicons color="#6339FB" name="create-outline" size={18} />
            <Text style={styles.dropdownLabel}>Update</Text>
          </Pressable>
          <View style={styles.dropdownDivider} />
          <Pressable
            onPress={() => {
              onCloseMenu();
              onDelete(mix);
            }}
            style={({ pressed }) => [styles.dropdownItem, pressed && styles.dropdownItemPressed]}>
            <Ionicons color="#FF0059" name="trash-outline" size={18} />
            <Text style={[styles.dropdownLabel, styles.dropdownLabelDanger]}>Delete</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

export default function MyMixesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<FilterTab>('All Mixes');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SoundscapeMix | null>(null);
  const [activeMix, setActiveMix] = useState<SoundscapeMix | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);

  const soundRefs = useRef<Record<string, Audio.Sound>>({});
  const loadRequestRef = useRef(0);
  const activeMixIdRef = useRef<string | null>(null);
  const pendingDeleteIdRef = useRef<string | null>(null);

  const stopAllAudio = useCallback(async () => {
    loadRequestRef.current += 1;
    const sounds = Object.values(soundRefs.current);
    soundRefs.current = {};
    await Promise.all(
      sounds.map(async (sound) => {
        await sound.stopAsync().catch(() => {});
        await sound.unloadAsync().catch(() => {});
      })
    );
    setIsPlaying(false);
    setIsAudioLoading(false);
    await Audio.setAudioModeAsync({ playsInSilentModeIOS: true, staysActiveInBackground: false }).catch(() => {});
  }, []);

  useFocusEffect(
    useCallback(() => {
      return () => {
        void stopAllAudio();
        activeMixIdRef.current = null;
        setActiveMix(null);
        setPosition(0);
      };
    }, [stopAllAudio])
  );

  useEffect(() => {
    return () => {
      void stopAllAudio();
    };
  }, [stopAllAudio]);

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: MIXES_QUERY_KEY,
    queryFn: () => soundscapeMixesApi.getAll(),
  });

  const mixes = data?.data?.mixes ?? [];

  const filteredMixes = useMemo(() => {
    if (activeTab === 'Favorites') {
      return mixes.filter((mix) => mix.is_favorite);
    }

    if (activeTab === 'Recent') {
      return [...mixes].sort((a, b) => {
        const aTime = new Date(a.last_played_at ?? a.updated_at ?? a.created_at).getTime();
        const bTime = new Date(b.last_played_at ?? b.updated_at ?? b.created_at).getTime();
        return bTime - aTime;
      });
    }

    return [...mixes].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [activeTab, mixes]);

  const favoriteMutation = useMutation({
    mutationFn: ({ id, isFavorite }: { id: string; isFavorite: boolean }) =>
      soundscapeMixesApi.setFavorite(id, isFavorite),
    onMutate: async ({ id, isFavorite }) => {
      await queryClient.cancelQueries({ queryKey: MIXES_QUERY_KEY });
      const previous = queryClient.getQueryData<MixesQueryData>(MIXES_QUERY_KEY);

      updateMixesCache(queryClient, (mixes) =>
        mixes.map((mix) => (mix.id === id ? { ...mix, is_favorite: isFavorite } : mix))
      );

      return { previous };
    },
    onError: (error: Error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(MIXES_QUERY_KEY, context.previous);
      }
      Alert.alert('Favorite failed', error.message || 'Could not update favorite. Please try again.');
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: MIXES_QUERY_KEY });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => soundscapeMixesApi.delete(id),
    onMutate: async (deletedId) => {
      await queryClient.cancelQueries({ queryKey: MIXES_QUERY_KEY });
      const previous = queryClient.getQueryData<MixesQueryData>(MIXES_QUERY_KEY);

      updateMixesCache(queryClient, (mixes) => mixes.filter((mix) => mix.id !== deletedId));

      setOpenMenuId(null);

      if (activeMixIdRef.current === deletedId) {
        activeMixIdRef.current = null;
        setActiveMix(null);
        setPosition(0);
        void stopAllAudio();
      }

      return { previous, deletedId };
    },
    onSuccess: () => {
      pendingDeleteIdRef.current = null;
      setDeleteTarget(null);
    },
    onError: (error: Error, _deletedId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(MIXES_QUERY_KEY, context.previous);
      }
      Alert.alert('Delete failed', error.message || 'Could not delete this mix. Please try again.');
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: MIXES_QUERY_KEY });
    },
  });

  const loadAndPlayMix = useCallback(
    async (mix: SoundscapeMix) => {
      const tracks = getMixTracks(mix);
      if (tracks.length === 0) {
        Alert.alert('Cannot play', 'This mix has no playable soundscapes.');
        return;
      }

      setOpenMenuId(null);
      setActiveMix(mix);
      activeMixIdRef.current = mix.id;

      void soundscapeMixesApi.recordPlay(mix.id).then(() => {
        void queryClient.invalidateQueries({ queryKey: MIXES_QUERY_KEY });
      });

      const requestId = loadRequestRef.current + 1;
      loadRequestRef.current = requestId;

      await Promise.all(Object.values(soundRefs.current).map((sound) => sound.unloadAsync().catch(() => {})));
      soundRefs.current = {};

      try {
        setIsAudioLoading(true);
        setPosition(0);
        setDuration(mix.soundscapes?.[0]?.duration_seconds ?? 0);
        await Audio.setAudioModeAsync({ playsInSilentModeIOS: true, staysActiveInBackground: false });

        await Promise.all(
          tracks.map(async (track, index) => {
            const trackVolume = mix.volumes?.[track.id] ?? DEFAULT_TRACK_VOLUME;
            const { sound } = await Audio.Sound.createAsync(
              { uri: track.file_url! },
              {
                shouldPlay: false,
                isLooping: true,
                volume: Math.max(0, Math.min(1, trackVolume)),
                progressUpdateIntervalMillis: 500,
              },
              index === 0
                ? (status) => {
                    if (status.isLoaded && activeMixIdRef.current === mix.id) {
                      setPosition(status.positionMillis / 1000);
                      if (mix.soundscapes?.[0]?.duration_seconds == null && status.durationMillis != null) {
                        setDuration(status.durationMillis / 1000);
                      }
                    }
                  }
                : undefined
            );
            soundRefs.current[track.id] = sound;
          })
        );

        if (loadRequestRef.current !== requestId || activeMixIdRef.current !== mix.id) {
          return;
        }

        const baseSound = soundRefs.current[tracks[0].id];
        if (baseSound && mix.soundscapes?.[0]?.duration_seconds == null) {
          const status = await baseSound.getStatusAsync();
          if (status.isLoaded && status.durationMillis != null) {
            setDuration(status.durationMillis / 1000);
          }
        }

        await Promise.all(Object.values(soundRefs.current).map((sound) => sound.playAsync().catch(() => {})));
        setIsPlaying(true);
      } catch (error) {
        console.log('Mix play error:', error);
        Alert.alert('Playback failed', 'Could not play this mix. Please try again.');
        if (activeMixIdRef.current === mix.id) {
          activeMixIdRef.current = null;
          setActiveMix(null);
        }
      } finally {
        setIsAudioLoading(false);
      }
    },
    [queryClient]
  );

  const togglePlayback = useCallback(async () => {
    const sounds = Object.values(soundRefs.current);
    if (sounds.length === 0) {
      if (activeMix) {
        await loadAndPlayMix(activeMix);
      }
      return;
    }

    if (isPlaying) {
      await Promise.all(sounds.map((sound) => sound.pauseAsync().catch(() => {})));
      setIsPlaying(false);
      return;
    }

    await Promise.all(sounds.map((sound) => sound.playAsync().catch(() => {})));
    setIsPlaying(true);
  }, [activeMix, isPlaying, loadAndPlayMix]);

  const handlePlayMix = useCallback(
    async (mix: SoundscapeMix) => {
      if (activeMix?.id === mix.id) {
        await togglePlayback();
        return;
      }
      await loadAndPlayMix(mix);
    },
    [activeMix?.id, loadAndPlayMix, togglePlayback]
  );

  const requestDelete = useCallback((mix: SoundscapeMix) => {
    setOpenMenuId(null);
    pendingDeleteIdRef.current = mix.id;
    setDeleteTarget(mix);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    const id = pendingDeleteIdRef.current ?? deleteTarget?.id;
    if (!id || deleteMutation.isPending) return;
    deleteMutation.mutate(id);
  }, [deleteMutation, deleteTarget?.id]);

  const handleCancelDelete = useCallback(() => {
    pendingDeleteIdRef.current = null;
    setDeleteTarget(null);
  }, []);

  const handleUpdate = useCallback(
    async (mix: SoundscapeMix) => {
      setOpenMenuId(null);
      await stopAllAudio();
      activeMixIdRef.current = null;
      setActiveMix(null);

      const first = mix.soundscapes?.[0];
      router.push({
        pathname: '/tools/soundscape-player',
        params: {
          mixId: mix.id,
          id: first?.id ?? '',
          title: first?.title ?? mix.name,
          subcategory: first?.subcategory ?? '',
          category: first?.category ?? '',
          file_url: first?.file_url ?? '',
        },
      });
    },
    [router, stopAllAudio]
  );

  const renderItem = useCallback(
    ({ item, index }: { item: SoundscapeMix; index: number }) => (
      <MixCard
        durationSeconds={item.soundscapes?.[0]?.duration_seconds}
        index={index}
        menuOpen={openMenuId === item.id}
        mix={item}
        onCloseMenu={() => setOpenMenuId(null)}
        onDelete={requestDelete}
        onOpenMenu={setOpenMenuId}
        onPlay={handlePlayMix}
        onToggleFavorite={(mixItem) =>
          favoriteMutation.mutate({ id: mixItem.id, isFavorite: !mixItem.is_favorite })
        }
        onUpdate={handleUpdate}
      />
    ),
    [favoriteMutation, handlePlayMix, handleUpdate, openMenuId, requestDelete]
  );

  return (
    <ImageBackground resizeMode="cover" source={backgroundImage} style={styles.screen}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.topBar}>
          <Pressable
            accessibilityLabel="Go back"
            hitSlop={12}
            onPress={() => router.back()}
            style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
            <Ionicons color="#000000" name="chevron-back" size={18} />
          </Pressable>

          <Pressable
            accessibilityLabel="Create new mix"
            hitSlop={12}
            onPress={() => router.push('/tools/all-theme')}
            style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
            <Ionicons color="#173F5F" name="add" size={22} />
          </Pressable>
        </View>

        <Text style={styles.title}>My Mixes</Text>
        <Text style={styles.subtitle}>All your saved mixes in one place.</Text>

        <View style={styles.tabs}>
          {FILTER_TABS.map((tab) => (
            <ExploreTabChip
              key={tab}
              active={activeTab === tab}
              label={tab}
              onPress={() => setActiveTab(tab)}
              style={styles.tabChip}
              variant="tab"
            />
          ))}
        </View>

        {isLoading ? (
          <View style={styles.loadingState}>
            <ActivityIndicator color="#7B61FF" size="large" />
          </View>
        ) : (
          <FlatList
            contentContainerStyle={[
              styles.listContent,
              { paddingBottom: insets.bottom + (activeMix ? 170 : 100) },
            ]}
            data={filteredMixes}
            keyExtractor={(item) => item.id}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons color="#6339FB" name="musical-notes-outline" size={42} />
                <Text style={styles.emptyTitle}>No mixes yet</Text>
                <Text style={styles.emptyText}>
                  {activeTab === 'Favorites'
                    ? 'Star a mix to see it here.'
                    : activeTab === 'Recent'
                      ? 'Play a mix and it will show up here.'
                      : 'Tap + to build your first mix.'}
                </Text>
              </View>
            }
            onRefresh={() => refetch()}
            onScrollBeginDrag={() => setOpenMenuId(null)}
            refreshing={isRefetching}
            renderItem={renderItem}
            showsVerticalScrollIndicator={false}
          />
        )}
      </SafeAreaView>

      {activeMix ? (
        <View style={[styles.miniPlayer, { bottom: Math.max(insets.bottom, 8) + 72 }]}>
          <LinearGradient {...exploreGradientHorizontal} style={styles.miniPlayerGradient}>
            <Image source={getMixThumb(activeMix)} style={styles.miniPlayerThumb} contentFit="cover" />
            <View style={styles.miniPlayerText}>
              <Text numberOfLines={1} style={styles.miniPlayerTitle}>
                {activeMix.name}
              </Text>
              <Text style={styles.miniPlayerTime}>
                {formatPlaybackTime(position)} / {formatTotalDuration(duration)}
              </Text>
            </View>
            <View style={styles.miniPlayerControls}>
              <Pressable
                disabled={isAudioLoading}
                onPress={() => void togglePlayback()}
                style={styles.miniPauseBtn}>
                {isAudioLoading ? (
                  <ActivityIndicator color="#6339FB" size="small" />
                ) : (
                  <Ionicons color="#6339FB" name={isPlaying ? 'pause' : 'play'} size={18} />
                )}
              </Pressable>
            </View>
          </LinearGradient>
        </View>
      ) : null}

      <View style={[styles.floatingTabBar, { bottom: Math.max(insets.bottom, 8) }]}>
        {TAB_ITEMS.map((item) => (
          <Pressable key={item.label} onPress={() => router.push(item.route as any)} style={styles.tabBarItem}>
            <Ionicons color={item.active ? '#3770FC' : '#8C8C8C'} name={item.icon} size={22} />
            <Text style={[styles.tabBarLabel, item.active && styles.tabBarLabelActive]}>{item.label}</Text>
          </Pressable>
        ))}
      </View>

      <DeleteMixModal
        loading={deleteMutation.isPending}
        message={`Are you sure you want to delete "${deleteTarget?.name ?? 'this mix'}"?`}
        onCancel={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="Delete mix?"
        visible={Boolean(deleteTarget)}
      />
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: '#C8BFEE', flex: 1 },
  safeArea: { flex: 1 },
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  iconButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 16,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  pressed: { opacity: 0.86, transform: [{ scale: 0.99 }] },
  title: {
    color: '#173F5F',
    fontFamily: AppFonts.displayBold,
    fontSize: 32,
    lineHeight: 40,
    marginBottom: 4,
    marginTop: 16,
    paddingHorizontal: 20,
    textAlign: 'center',
  },
  subtitle: {
    color: '#8C8C8C',
    fontFamily: AppFonts.sansRegular,
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 18,
    paddingHorizontal: 20,
    textAlign: 'center',
  },
  tabs: {
    backgroundColor: '#FFFFFF',
    borderRadius: 34,
    elevation: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    marginHorizontal: 20,
    overflow: 'hidden',
    padding: 4,
    shadowColor: '#8B8BA0',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.14,
    shadowRadius: 24,
  },
  tabChip: {
    flex: 1,
  },
  listContent: {
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 4,
  },
  loadingState: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    gap: 8,
    paddingTop: 80,
  },
  emptyTitle: {
    color: '#173F5F',
    fontFamily: AppFonts.displaySemiBold,
    fontSize: 22,
    lineHeight: 28,
  },
  emptyText: {
    color: '#8C8C8C',
    fontFamily: AppFonts.sansRegular,
    fontSize: 14,
    lineHeight: 22,
    paddingHorizontal: 24,
    textAlign: 'center',
  },
  cardWrap: {
    position: 'relative',
    zIndex: 1,
  },
  cardWrapOpen: {
    zIndex: 30,
  },
  card: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    elevation: 4,
    flexDirection: 'row',
    gap: 14,
    minHeight: 96,
    padding: 12,
    shadowColor: '#173F5F',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
  },
  cardMain: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: 14,
    minWidth: 0,
  },
  thumbWrap: {
    borderRadius: 14,
    height: 72,
    overflow: 'hidden',
    width: 72,
  },
  thumb: {
    height: '100%',
    width: '100%',
  },
  thumbPlayOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbPlayBtn: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 18,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  playIconOffset: {
    marginLeft: 2,
  },
  cardBody: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  cardTitle: {
    color: '#173F5F',
    fontFamily: AppFonts.sansBold,
    fontSize: 16,
    lineHeight: 22,
  },
  cardMeta: {
    color: '#8C8C8C',
    fontFamily: AppFonts.sansRegular,
    fontSize: 13,
    lineHeight: 18,
  },
  durationRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
    marginTop: 2,
  },
  durationText: {
    color: '#8C8C8C',
    fontFamily: AppFonts.sansRegular,
    fontSize: 12,
    lineHeight: 16,
  },
  cardActions: {
    alignItems: 'flex-end',
    alignSelf: 'stretch',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  starBtn: {
    padding: 2,
  },
  menuBtn: {
    padding: 2,
  },
  dropdown: {
    backgroundColor: '#FFFFFF',
    borderColor: 'rgba(99,57,251,0.1)',
    borderRadius: 14,
    borderWidth: 1,
    elevation: 16,
    minWidth: 148,
    position: 'absolute',
    right: 12,
    shadowColor: '#173F5F',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    top: 72,
    zIndex: 50,
  },
  dropdownItem: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  dropdownItemPressed: {
    backgroundColor: 'rgba(99,57,251,0.06)',
  },
  dropdownDivider: {
    backgroundColor: 'rgba(99,57,251,0.08)',
    height: 1,
  },
  dropdownLabel: {
    color: '#173F5F',
    fontFamily: AppFonts.sansSemiBold,
    fontSize: 14,
    lineHeight: 20,
  },
  dropdownLabelDanger: {
    color: '#FF0059',
  },
  miniPlayer: {
    left: 16,
    position: 'absolute',
    right: 16,
    zIndex: 5,
  },
  miniPlayerGradient: {
    alignItems: 'center',
    borderRadius: 18,
    flexDirection: 'row',
    gap: 12,
    minHeight: 64,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  miniPlayerThumb: {
    borderRadius: 10,
    height: 44,
    width: 44,
  },
  miniPlayerText: {
    flex: 1,
    minWidth: 0,
  },
  miniPlayerTitle: {
    color: '#FFFFFF',
    fontFamily: AppFonts.sansSemiBold,
    fontSize: 15,
    lineHeight: 20,
  },
  miniPlayerTime: {
    color: 'rgba(255,255,255,0.88)',
    fontFamily: AppFonts.sansRegular,
    fontSize: 12,
    lineHeight: 16,
    marginTop: 2,
  },
  miniPlayerControls: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  miniPauseBtn: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  floatingTabBar: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    elevation: 10,
    flexDirection: 'row',
    justifyContent: 'space-around',
    left: 16,
    paddingHorizontal: 8,
    paddingVertical: 10,
    position: 'absolute',
    right: 16,
    shadowColor: '#173F5F',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
  },
  tabBarItem: {
    alignItems: 'center',
    flex: 1,
    gap: 2,
    paddingVertical: 4,
  },
  tabBarLabel: {
    color: '#8C8C8C',
    fontFamily: AppFonts.sansMedium,
    fontSize: 11,
    lineHeight: 14,
  },
  tabBarLabelActive: {
    color: '#3770FC',
  },
});
