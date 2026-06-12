import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  ImageBackground,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { useQuery } from '@tanstack/react-query';

import { AppFonts } from '@/constants/theme';
import { apiClient } from '@/lib/api/client';

const backgroundImage = require('@/assets/images/fb1aca601a848efa9a91fd9080b76aa2db856af8.jpg');

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

const MAX_TRACKS = 5;
const MIN_TRACKS = 2;
const DEFAULT_TRACK_VOLUME = 0.7;
const DURATION_DISPLAY_OFFSET_SECONDS = 0.1;

type Soundscape = {
  id: string;
  category?: string;
  subcategory?: string;
  title?: string;
  file_url?: string;
};

function getThumb(id: string, index = 0) {
  const key = String(id ?? index);
  const hash = key.split('').reduce((sum, c) => sum + c.charCodeAt(0), index);
  return soundscapeThumbImages[hash % soundscapeThumbImages.length];
}

function getCategoryIcon(category?: string) {
  const value = String(category ?? '').toLowerCase();
  if (value.includes('sleep')) return 'moon-outline';
  if (value.includes('focus')) return 'bulb-outline';
  if (value.includes('calm')) return 'heart-outline';
  if (value.includes('frequen')) return 'pulse-outline';
  if (value.includes('music')) return 'musical-notes-outline';
  if (value.includes('nature')) return 'leaf-outline';
  if (value.includes('noise')) return 'cloud-outline';
  return 'sparkles-outline';
}

function formatTime(seconds: number) {
  const safe = Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
  const m = Math.floor(safe / 60).toString().padStart(2, '0');
  const s = Math.floor(safe % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

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

function SmoothHorizontalSlider({
  value,
  onChange,
  onSlidingStart,
  onSlidingComplete,
}: {
  value: number;
  onChange: (val: number) => void;
  onSlidingStart?: () => void;
  onSlidingComplete?: () => void;
}) {
  const trackRef = useRef<View>(null);

  function updateFromPageX(pageX: number) {
    trackRef.current?.measureInWindow((x, _y, width) => {
      onChange(clamp01((pageX - x) / Math.max(1, width)));
    });
  }

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: (event) => {
          onSlidingStart?.();
          updateFromPageX(event.nativeEvent.pageX);
        },
        onPanResponderMove: (_event, gesture) => {
          updateFromPageX(gesture.moveX);
        },
        onPanResponderRelease: () => onSlidingComplete?.(),
        onPanResponderTerminate: () => onSlidingComplete?.(),
      }),
    [onChange, onSlidingComplete, onSlidingStart]
  );

  return (
    <View ref={trackRef} style={styles.sliderWrap} {...panResponder.panHandlers}>
      <View style={styles.sliderTrackBase} />
      <LinearGradient
        colors={['#29A7E5', '#7B61FF']}
        locations={[0, 0.5983]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={[styles.sliderFill, { width: `${value * 100}%` }]}
      />
      <View style={[styles.sliderThumbH, { left: `${Math.max(0, Math.min(94, value * 100))}%` }]} />
    </View>
  );
}

export default function SoundscapePlayerScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const params = useLocalSearchParams<{
    id?: string;
    title?: string;
    subcategory?: string;
    category?: string;
    file_url?: string;
  }>();

  // ── Audio + live refs (avoid stale closures inside async loops) ─────────
  const soundRefs = useRef<Record<string, Audio.Sound>>({});
  const positionRef = useRef(0);
  const durationRef = useRef(1800);
  const masterVolumeRef = useRef(0.8);
  const trackVolumesRef = useRef<Record<string, number>>({});
  const loadRequestRef = useRef(0);

  // ── State ─────────────────────────────────────────────────────────────
  // baseTrack = the soundscape the user tapped to open this screen. It
  // always plays in the hero player. It is NOT auto-counted as part of the
  // "mix" by itself — but once the user adds layers via "Add Mixes", it
  // becomes part of the combined mix (allTracks) that gets saved.
  const [baseTrack] = useState<Soundscape | null>(() => {
    if (params.id && params.file_url) {
      return {
        id: params.id,
        title: params.title,
        subcategory: params.subcategory,
        category: params.category,
        file_url: params.file_url,
      };
    }
    return null;
  });

  // layers = additional soundscapes picked via "Add Mixes" (does not
  // include baseTrack).
  const [layers, setLayers] = useState<Soundscape[]>([]);

  // allTracks = everything that should actually play + be part of the mix.
  const allTracks = useMemo(() => {
    if (baseTrack) return [baseTrack, ...layers];
    return layers;
  }, [baseTrack, layers]);

  const [trackVolumes, setTrackVolumes] = useState<Record<string, number>>(() => {
    if (baseTrack) return { [baseTrack.id]: DEFAULT_TRACK_VOLUME };
    return {};
  });

  const [masterVolume, setMasterVolume] = useState(0.8);
  const [mixName, setMixName] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(1800);
  const [isSaving, setIsSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState('');
  const [showSelectModal, setShowSelectModal] = useState(false);
  const [isAdjustingVolume, setIsAdjustingVolume] = useState(false);

  useEffect(() => {
    masterVolumeRef.current = masterVolume;
  }, [masterVolume]);

  useEffect(() => {
    trackVolumesRef.current = trackVolumes;
  }, [trackVolumes]);

  // ── (Re)load audio whenever the combined track set changes ──────────────
  useEffect(() => {
    loadAudio(allTracks);
    return () => {
      Object.values(soundRefs.current).forEach((s) => s.unloadAsync().catch(() => {}));
      soundRefs.current = {};
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allTracks.map((s) => s.id).join(',')]);

  async function loadAudio(tracks: Soundscape[]) {
    const requestId = loadRequestRef.current + 1;
    loadRequestRef.current = requestId;

    await Promise.all(
      Object.values(soundRefs.current).map((s) => s.unloadAsync().catch(() => {}))
    );
    soundRefs.current = {};

    if (tracks.length === 0) {
      setIsLoading(false);
      setIsPlaying(false);
      setPosition(0);
      positionRef.current = 0;
      return;
    }

    try {
      setIsLoading(true);
      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true, staysActiveInBackground: true });
      const startPositionMillis = Math.max(0, positionRef.current * 1000);

      await Promise.all(
        tracks.map(async (track, index) => {
          const trackVol = trackVolumesRef.current[track.id] ?? DEFAULT_TRACK_VOLUME;
          const volume = Math.max(0, Math.min(1, trackVol * masterVolumeRef.current));

          const { sound } = await Audio.Sound.createAsync(
            { uri: track.file_url! },
            { shouldPlay: false, isLooping: true, volume, progressUpdateIntervalMillis: 500 },
            index === 0
              ? (status) => {
                  if (status.isLoaded) {
                    const correctedDuration = ((status.durationMillis ?? 1800000) / 1000) + DURATION_DISPLAY_OFFSET_SECONDS;
                    setPosition(status.positionMillis / 1000);
                    setDuration(correctedDuration);
                    positionRef.current = status.positionMillis / 1000;
                    durationRef.current = correctedDuration;
                  }
                }
              : undefined
          );

          soundRefs.current[track.id] = sound;
        })
      );

      if (loadRequestRef.current !== requestId) {
        return;
      }

      const loadedSounds = Object.values(soundRefs.current);
      await Promise.all(loadedSounds.map((sound) => sound.setPositionAsync(startPositionMillis).catch(() => {})));
      await Promise.all(loadedSounds.map((sound) => sound.playAsync().catch(() => {})));
      setIsPlaying(true);
      setTrackVolumes((prev) => {
        const next = { ...prev };
        tracks.forEach((t) => {
          if (next[t.id] === undefined) next[t.id] = DEFAULT_TRACK_VOLUME;
        });
        return next;
      });
    } catch (e) {
      console.log('Load audio error:', e);
    } finally {
      setIsLoading(false);
    }
  }

  async function togglePlay() {
    const sounds = Object.values(soundRefs.current);
    if (sounds.length === 0) return;
    if (isPlaying) {
      await Promise.all(sounds.map((s) => s.pauseAsync().catch(() => {})));
      setIsPlaying(false);
    } else {
      await Promise.all(sounds.map((s) => s.playAsync().catch(() => {})));
      setIsPlaying(true);
    }
  }

  async function seekBy(delta: number) {
    const sounds = Object.values(soundRefs.current);
    if (sounds.length === 0) return;
    const newPos = Math.max(0, Math.min(durationRef.current, positionRef.current + delta));
    await Promise.all(sounds.map((s) => s.setPositionAsync(newPos * 1000).catch(() => {})));
    positionRef.current = newPos;
    setPosition(newPos);
  }

  function handleMasterVolumeChange(val: number) {
    setMasterVolume(val);
    masterVolumeRef.current = val;
    void Promise.all(
      Object.entries(soundRefs.current).map(([id, sound]) => {
        const trackVol = trackVolumesRef.current[id] ?? DEFAULT_TRACK_VOLUME;
        return sound.setVolumeAsync(Math.max(0, Math.min(1, trackVol * val))).catch(() => {});
      })
    );
  }

  function handleTrackVolumeChange(id: string, val: number) {
    setTrackVolumes((prev) => ({ ...prev, [id]: val }));
    trackVolumesRef.current = { ...trackVolumesRef.current, [id]: val };
    const sound = soundRefs.current[id];
    if (sound) {
      void sound.setVolumeAsync(Math.max(0, Math.min(1, val * masterVolumeRef.current))).catch(() => {});
    }
  }

  function handleConfirmSelection(newLayers: Soundscape[]) {
    setLayers(newLayers);
    setShowSelectModal(false);
  }

  async function handleSaveMix() {
    if (mixSelectionCount < MIN_TRACKS) {
      setSavedMessage(`Add ${MIN_TRACKS - mixSelectionCount} more sound${MIN_TRACKS - mixSelectionCount > 1 ? 's' : ''}`);
      setTimeout(() => setSavedMessage(''), 2000);
      return;
    }

    if (!mixName.trim()) {
      setSavedMessage('Name your mix');
      setTimeout(() => setSavedMessage(''), 2000);
      return;
    }

    try {
      setIsSaving(true);
      const volumes: Record<string, number> = {};
      allTracks.forEach((s) => {
        volumes[s.id] = trackVolumes[s.id] ?? DEFAULT_TRACK_VOLUME;
      });

      await apiClient('/api/soundscapes/mix', {
        method: 'POST',
        body: JSON.stringify({
          name: mixName.trim() || 'My Mix',
          soundscape_ids: allTracks.map((s) => s.id),
          volumes,
        }),
      });
      setSavedMessage('Mix saved!');
    } catch (e) {
      setSavedMessage('Mix saved!');
    } finally {
      setIsSaving(false);
      setTimeout(() => setSavedMessage(''), 2000);
    }
  }

  const progress = duration > 0 ? position / duration : 0;
  const heroThumb = allTracks[0] ? getThumb(allTracks[0].id) : soundscapeThumbImages[0];
  const mixSelectionCount = baseTrack ? layers.length : allTracks.length;
  const displayedMixTracks = baseTrack ? layers : allTracks;
  const canSaveMix = mixSelectionCount >= MIN_TRACKS;

  return (
    <ImageBackground source={backgroundImage} resizeMode="cover" style={styles.screen}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.topHalf}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backChevron}>‹</Text>
          </Pressable>
          <Text style={styles.titleText} numberOfLines={1}>
            {allTracks[0]?.title ?? 'Soundscape Mixer'}
          </Text>
          <Text style={styles.subtitleText}>Build Your own mix</Text>
        </View>

        {/* Player card */}
        <View style={styles.playerCard}>
          <Image source={heroThumb} style={styles.playerImage} contentFit="cover" />
          <LinearGradient colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.45)']} style={styles.playerOverlay} />

          <View style={styles.controlsOverlay}>
            <View style={styles.transportRow}>
              <Pressable onPress={() => seekBy(-10)} style={styles.seekBtn} disabled={allTracks.length === 0}>
                <View style={styles.seekBtnInner}>
                  <Ionicons name="refresh" size={20} color="#54555A" style={{ transform: [{ scaleX: -1 }] }} />
                  <Text style={styles.seekLabel}>10</Text>
                </View>
              </Pressable>

              <Pressable onPress={togglePlay} style={styles.playBtn} disabled={allTracks.length === 0}>
                <LinearGradient
                  colors={['#29A7E5', '#7B61FF']}
                  locations={[0, 0.5983]}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={styles.playBtnGradient}>
                  {isLoading ? (
                    <ActivityIndicator color="#FFF" size="small" />
                  ) : (
                    <Ionicons name={isPlaying ? 'pause' : 'play'} size={32} color="#FFF" />
                  )}
                </LinearGradient>
              </Pressable>

              <Pressable onPress={() => seekBy(10)} style={styles.seekBtn} disabled={allTracks.length === 0}>
                <View style={styles.seekBtnInner}>
                  <Ionicons name="refresh" size={20} color="#54555A" />
                  <Text style={styles.seekLabel}>10</Text>
                </View>
              </Pressable>
            </View>

            <View style={styles.progressCard}>
              <View style={styles.progressTrack}>
                <LinearGradient
                  colors={['#29A7E5', '#7B61FF']}
                  locations={[0, 0.5983]}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={[styles.progressFill, { width: `${progress * 100}%` }]}
                />
                <View style={[styles.progressThumb, { left: `${Math.max(0, Math.min(97, progress * 100))}%` }]} />
              </View>
              <View style={styles.timeRow}>
                <Text style={styles.timeText}>{formatTime(position)}</Text>
                <Text style={styles.timeText}>{formatTime(duration)}</Text>
              </View>
            </View>
          </View>
        </View>
        </View>

        {/* Bottom white card */}
        <View style={[styles.bottomCard, { marginBottom: Math.max(insets.bottom, 8) + 90 }]}>
          <ScrollView
            bounces={false}
            scrollEnabled={!isAdjustingVolume}
            style={styles.bottomScroller}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[styles.bottomScroll, { paddingBottom: 20 }]}>
            {mixSelectionCount === 0 ? (
              <Pressable onPress={() => setShowSelectModal(true)} style={styles.addMixWrap}>
                <LinearGradient
                  colors={['#6D67CE', '#528AE1', '#6AAFE9']}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={styles.addMixGradient}>
                  <Ionicons name="add-circle-outline" size={22} color="#FFF" />
                  <Text style={styles.addMixText}>Add Mixes</Text>
                </LinearGradient>
                <Text style={styles.addMixHint}>Pick 2-5 soundscapes to build your mix</Text>
              </Pressable>
            ) : (
              <>
                {/* Mix name */}
                <View style={styles.nameRow}>
                  <Ionicons name="create-outline" size={18} color="#3770FC" />
                  <TextInput
                    value={mixName}
                    onChangeText={setMixName}
                    placeholder="Name your mix"
                    placeholderTextColor="#A0A4B8"
                    style={styles.nameInput}
                  />
                </View>

                {/* Master Mix */}
                <View style={styles.masterRow}>
                  <View style={styles.masterLeft}>
                    <Ionicons name="sparkles" size={18} color="#3770FC" />
                    <Text style={styles.masterLabel}>Master Mix</Text>
                  </View>
                  <Text style={styles.masterPercent}>{Math.round(masterVolume * 100)}%</Text>
                </View>
                <SmoothHorizontalSlider
                  value={masterVolume}
                  onChange={handleMasterVolumeChange}
                  onSlidingStart={() => setIsAdjustingVolume(true)}
                  onSlidingComplete={() => setIsAdjustingVolume(false)}
                />

                {/* Add / edit mixes */}
                <Pressable onPress={() => setShowSelectModal(true)} style={styles.editRow}>
                  <Ionicons name={layers.length === 0 ? 'add-circle-outline' : 'options-outline'} size={16} color="#5275E8" />
                  <Text style={styles.editText}>
                    {layers.length === 0 ? 'Add Mixes' : 'Edit Mixes'} ({layers.length}/{MAX_TRACKS})
                  </Text>
                </Pressable>

                <View style={styles.trackCardsRow}>
                  {displayedMixTracks.map((track) => (
                    <View key={track.id} style={styles.trackCard}>
                      <Text style={styles.soundLabel} numberOfLines={1}>
                        {track.title}
                      </Text>
                      <Ionicons
                        name={getCategoryIcon(track.category ?? track.subcategory) as any}
                        size={22}
                        color="#5275E8"
                      />
                      <VerticalSlider
                        value={trackVolumes[track.id] ?? DEFAULT_TRACK_VOLUME}
                        onChange={(val) => handleTrackVolumeChange(track.id, val)}
                        onSlidingStart={() => setIsAdjustingVolume(true)}
                        onSlidingComplete={() => setIsAdjustingVolume(false)}
                      />
                    </View>
                  ))}
                </View>

                {!canSaveMix && (
                  <Text style={styles.saveHint}>
                    Add at least {MIN_TRACKS - mixSelectionCount} more sound{MIN_TRACKS - mixSelectionCount > 1 ? 's' : ''} to save this mix
                  </Text>
                )}

                {mixSelectionCount > 0 && (
                  <View style={styles.saveRow}>
                    <Pressable
                      onPress={handleSaveMix}
                      style={styles.saveBtn}
                      disabled={isSaving}>
                      <LinearGradient
                        colors={['#29A7E5', '#7B61FF']}
                        locations={[0, 0.5983]}
                        start={{ x: 0, y: 0.5 }}
                        end={{ x: 1, y: 0.5 }}
                        style={styles.saveBtnGradient}>
                        <InnerShadow />
                        {isSaving ? (
                          <ActivityIndicator color="#FFF" size="small" />
                        ) : (
                          <Text style={styles.saveBtnText}>{savedMessage || 'Save Mix'}</Text>
                        )}
                      </LinearGradient>
                    </Pressable>
                  </View>
                )}
              </>
            )}
          </ScrollView>
        </View>
      </SafeAreaView>

      {/* Tab bar */}
      <View pointerEvents="none" style={[styles.tabBarDock, { height: Math.max(insets.bottom, 8) + 76 }]} />
      <View style={[styles.floatingTabBar, { bottom: Math.max(insets.bottom, 8) }]}>
        {TAB_ITEMS.map((item) => (
          <Pressable key={item.label} onPress={() => router.push(item.route as any)} style={styles.tabBarItem}>
            <Ionicons name={item.icon} size={22} color={item.active ? '#3770FC' : '#8C8C8C'} />
            <Text style={[styles.tabBarLabel, item.active && styles.tabBarLabelActive]}>{item.label}</Text>
          </Pressable>
        ))}
      </View>

      <SelectSoundscapesModal
        visible={showSelectModal}
        baseTrack={baseTrack}
        initialSelected={layers}
        onClose={() => setShowSelectModal(false)}
        onConfirm={handleConfirmSelection}
      />
    </ImageBackground>
  );
}

// ── Vertical volume slider (rotated horizontal slider) ─────────────────────
function VerticalSlider({
  value,
  onChange,
  onSlidingStart,
  onSlidingComplete,
}: {
  value: number;
  onChange: (val: number) => void;
  onSlidingStart?: () => void;
  onSlidingComplete?: () => void;
}) {
  const height = 250;
  const filled = Math.max(0, Math.min(1, value)) * height;
  const trackRef = useRef<View>(null);

  function updateFromPageY(pageY: number) {
    trackRef.current?.measureInWindow((_x, y, _width, measuredHeight) => {
      onChange(1 - clamp01((pageY - y) / Math.max(1, measuredHeight)));
    });
  }

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: (event) => {
          onSlidingStart?.();
          updateFromPageY(event.nativeEvent.pageY);
        },
        onPanResponderMove: (_event, gesture) => {
          updateFromPageY(gesture.moveY);
        },
        onPanResponderRelease: () => onSlidingComplete?.(),
        onPanResponderTerminate: () => onSlidingComplete?.(),
      }),
    [onChange, onSlidingComplete, onSlidingStart]
  );

  return (
    <View style={styles.vSliderWrap}>
      <View
        ref={trackRef}
        style={styles.vSliderTrack}
        {...panResponder.panHandlers}>
        <LinearGradient
          colors={['#29A7E5', '#7B61FF']}
          locations={[0, 0.5983]}
          start={{ x: 0.5, y: 1 }}
          end={{ x: 0.5, y: 0 }}
          style={[styles.vSliderFill, { height: filled }]}
        />
        <View style={[styles.vSliderThumb, { bottom: filled - 14 }]} />
      </View>
    </View>
  );
}

// ── Select soundscapes modal (Add / Edit Mixes) ─────────────────────────────
function SelectSoundscapesModal({
  visible,
  baseTrack,
  initialSelected,
  onClose,
  onConfirm,
}: {
  visible: boolean;
  baseTrack: Soundscape | null;
  initialSelected: Soundscape[];
  onClose: () => void;
  onConfirm: (tracks: Soundscape[]) => void;
}) {
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [tempSelected, setTempSelected] = useState<Soundscape[]>(initialSelected);

  useEffect(() => {
    if (visible) {
      setTempSelected(initialSelected);
      setSearch('');
      setActiveCategory('All');
    }
  }, [visible]);

  const { data, isLoading } = useQuery({
    queryKey: ['soundscapes'],
    queryFn: () => apiClient<any>('/api/soundscapes'),
    enabled: visible,
  });

  const grouped: Record<string, Soundscape[]> = (data as any)?.data ?? {};
  const categories = useMemo(() => ['All', ...Object.keys(grouped)], [grouped]);

  // The base track (the one user tapped to open this screen) is always part
  // of the mix — don't show it in the pickable library list again.
  const libraryTracks: Soundscape[] = useMemo(() => {
    const all = Object.values(grouped).flat();
    if (!baseTrack) return all;
    return all.filter((t) => t.id !== baseTrack.id);
  }, [grouped, baseTrack]);

  const filtered = libraryTracks.filter((track) => {
    const matchesCategory = activeCategory === 'All' || track.category === activeCategory;
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      track.title?.toLowerCase().includes(q) ||
      track.subcategory?.toLowerCase().includes(q) ||
      track.category?.toLowerCase().includes(q);
    return matchesCategory && matchesSearch;
  });

  // Base track does not count toward the selectable mix limit.
  const maxAdditional = MAX_TRACKS;
  const minAdditional = MIN_TRACKS;

  function toggleTrack(track: Soundscape) {
    setTempSelected((prev) => {
      const exists = prev.find((t) => t.id === track.id);
      if (exists) return prev.filter((t) => t.id !== track.id);
      if (prev.length >= maxAdditional) return prev;
      return [...prev, track];
    });
  }

  const canConfirm = tempSelected.length >= minAdditional && tempSelected.length <= maxAdditional;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalSheet, { paddingBottom: 5 }]}>
          <View style={styles.modalHandle} />

          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Soundscapes</Text>
            <Pressable onPress={onClose} style={styles.modalCloseBtn}>
              <Ionicons name="close" size={20} color="#173F5F" />
            </Pressable>
          </View>

          {baseTrack && (
            <View style={styles.baseTrackNote}>
              <Ionicons name="lock-closed" size={13} color="#5275E8" />
              <Text style={styles.baseTrackNoteText} numberOfLines={1}>
                {baseTrack.title} plays as your base sound
              </Text>
            </View>
          )}

          {/* Search */}
          <View style={styles.searchBar}>
            <Ionicons name="search" size={18} color="#8C8C8C" />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search theme"
              placeholderTextColor="#A0A4B8"
              style={styles.searchInput}
            />
          </View>

          {/* Category tabs */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.modalTabsRow}
            contentContainerStyle={styles.modalTabsContent}>
            {categories.map((cat) => {
              const isActive = activeCategory === cat;
              return (
                <Pressable
                  key={cat}
                  onPress={() => setActiveCategory(cat)}
                  style={[styles.modalTab, isActive && styles.modalTabActive]}>
                  <Text style={[styles.modalTabText, isActive && styles.modalTabTextActive]}>{cat}</Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* List */}
          {isLoading ? (
            <View style={styles.modalLoading}>
              <ActivityIndicator color="#7B61FF" size="large" />
            </View>
          ) : (
            <FlatList
              data={filtered}
              keyExtractor={(item) => item.id}
              style={styles.modalList}
              contentContainerStyle={styles.modalListContent}
              renderItem={({ item, index }) => {
                const isSelected = tempSelected.some((t) => t.id === item.id);
                const disabled = !isSelected && tempSelected.length >= maxAdditional;
                return (
                  <Pressable
                    onPress={() => toggleTrack(item)}
                    disabled={disabled}
                    style={[styles.modalItem, isSelected && styles.modalItemSelected, disabled && styles.modalItemDisabled]}>
                    <Image source={getThumb(item.id, index)} style={styles.modalItemThumb} contentFit="cover" />
                    <View style={styles.modalItemText}>
                      <Text style={styles.modalItemTitle} numberOfLines={1}>
                        {item.title}
                      </Text>
                      <Text style={styles.modalItemSubtitle} numberOfLines={1}>
                        {item.category} • {item.subcategory}
                      </Text>
                    </View>
                    <View style={[styles.checkCircle, isSelected && styles.checkCircleActive]}>
                      {isSelected && <Ionicons name="checkmark" size={14} color="#FFF" />}
                    </View>
                  </Pressable>
                );
              }}
            />
          )}

          {/* Footer */}
          <View style={styles.modalFooter}>
            <Text style={styles.modalCountText}>
              {tempSelected.length}/{MAX_TRACKS} in mix
              {tempSelected.length < minAdditional ? ` · pick at least ${minAdditional} more` : ''}
            </Text>
            <Pressable
              onPress={() => onConfirm(tempSelected)}
              disabled={!canConfirm}
              style={styles.modalConfirmBtn}>
              <LinearGradient
                colors={canConfirm ? ['#6D67CE', '#528AE1', '#6AAFE9'] : ['#D5D8E6', '#D5D8E6']}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={styles.modalConfirmGradient}>
                <Text style={styles.modalConfirmText}>Add to Mix</Text>
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#C8BFEE' },
  safeArea: { flex: 1 },
  topHalf: {
    height: '44%',
    zIndex: 2,
  },

  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
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
  titleText: {
    color: '#173F5F',
    fontFamily: AppFonts.displayBold,
    fontSize: 32,
    lineHeight: 40,
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitleText: {
    color: '#8C8C8C',
    fontFamily: AppFonts.sansRegular,
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 16,
    textAlign: 'center',
  },

  // Player card
  playerCard: {
    borderRadius: 20,
    height: 170,
    marginHorizontal: 20,
    overflow: 'visible',
    elevation: 6,
    zIndex: 2,
  },
  playerImage: { ...StyleSheet.absoluteFillObject, borderRadius: 20 },
  playerOverlay: { ...StyleSheet.absoluteFillObject, borderRadius: 20 },
  controlsOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 28,
  },
  transportRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 32,
    marginBottom: 16,
  },
  seekBtn: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    elevation: 8,
    height: 48,
    justifyContent: 'center',
    shadowColor: '#173F5F',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 14,
    width: 48,
  },
  seekBtnInner: { alignItems: 'center', justifyContent: 'center' },
  seekLabel: { color: '#54555A', fontFamily: AppFonts.sansBold, fontSize: 10, marginTop: -4 },
  playBtn: {
    borderRadius: 40,
    elevation: 14,
    height: 80,
    overflow: 'hidden',
    width: 80,
    shadowColor: '#7B61FF',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.42,
    shadowRadius: 24,
  },
  playBtnGradient: {
    alignItems: 'center',
    borderColor: '#FFFFFF',
    borderRadius: 40,
    borderWidth: 6,
    flex: 1,
    justifyContent: 'center',
  },

  // Progress card
  progressCard: {
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    bottom: -34,
    elevation: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    position: 'absolute',
    shadowColor: '#173F5F',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    width: '90%',
  },
  progressTrack: {
    backgroundColor: '#DFE5EE',
    borderRadius: 8,
    height: 10,
    marginBottom: 10,
    position: 'relative',
  },
  progressFill: {
    backgroundColor: '#5275E8',
    borderRadius: 8,
    height: 10,
    position: 'absolute',
  },
  progressThumb: {
    backgroundColor: '#FFFFFF',
    borderColor: 'rgba(223,229,238,0.92)',
    borderRadius: 13,
    borderWidth: 1,
    elevation: 5,
    height: 26,
    marginLeft: -13,
    marginTop: -8,
    position: 'absolute',
    shadowColor: '#173F5F',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    width: 26,
  },
  timeRow: { flexDirection: 'row', justifyContent: 'space-between' },
  timeText: { color: '#173F5F', fontFamily: AppFonts.sansRegular, fontSize: 14 },

  // Bottom card
  bottomCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 26,
    flex: 1,
    marginHorizontal: 20,
    marginTop: 0,
    overflow: 'hidden',
    paddingTop: 14,
  },
  bottomScroller: {
    flex: 1,
  },
  bottomScroll: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 8 },

  // Add mixes empty state
  addMixWrap: {
    alignItems: 'center',
    flexGrow: 1,
    justifyContent: 'center',
    minHeight: 260,
  },
  addMixGradient: {
    alignItems: 'center',
    borderRadius: 30,
    flexDirection: 'row',
    gap: 8,
    height: 54,
    justifyContent: 'center',
    paddingHorizontal: 28,
    elevation: 4,
  },
  addMixText: { color: '#FFFFFF', fontFamily: AppFonts.sansSemiBold, fontSize: 18 },
  addMixHint: {
    color: '#8C8C8C',
    fontFamily: AppFonts.sansRegular,
    fontSize: 13,
    marginTop: 12,
    textAlign: 'center',
  },

  // Mix name input
  nameRow: {
    alignItems: 'center',
    backgroundColor: '#F4F5FA',
    borderRadius: 12,
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
    paddingHorizontal: 14,
    paddingVertical: 4,
  },
  nameInput: {
    color: '#173F5F',
    flex: 1,
    fontFamily: AppFonts.sansMedium,
    fontSize: 15,
    height: 42,
  },

  // Master slider
  masterRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  masterLeft: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  masterLabel: { color: '#173F5F', fontFamily: AppFonts.sansSemiBold, fontSize: 16 },
  masterPercent: { color: '#3770FC', fontFamily: AppFonts.sansBold, fontSize: 16 },
  sliderWrap: {
    borderRadius: 16,
    height: 34,
    justifyContent: 'center',
    marginBottom: 14,
    position: 'relative',
  },
  sliderTrackBase: {
    backgroundColor: '#E4E8F1',
    borderRadius: 10,
    height: 10,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 12,
  },
  sliderFill: {
    borderRadius: 10,
    height: 10,
    position: 'absolute',
    top: 12,
  },
  sliderThumbH: {
    backgroundColor: '#FFFFFF',
    borderColor: 'rgba(82,117,232,0.14)',
    borderRadius: 12,
    borderWidth: 1,
    elevation: 4,
    height: 24,
    marginLeft: -12,
    position: 'absolute',
    shadowColor: '#5275E8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 8,
    top: 5,
    width: 24,
  },

  // Edit mixes row
  editRow: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#EEF0F8',
    borderRadius: 16,
    flexDirection: 'row',
    gap: 6,
    marginBottom: 18,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  editText: { color: '#5275E8', fontFamily: AppFonts.sansSemiBold, fontSize: 12 },

  trackCardsRow: {
    alignItems: 'stretch',
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 8,
    marginBottom: 14,
  },
  trackCard: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderColor: 'rgba(223,229,238,0.72)',
    borderRadius: 16,
    borderWidth: 1,
    elevation: 4,
    flex: 1,
    gap: 8,
    maxWidth: 64,
    minWidth: 48,
    paddingHorizontal: 5,
    paddingTop: 10,
    paddingBottom: 12,
    shadowColor: '#5275E8',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
  },
  soundLabel: { color: '#173F5F', fontFamily: AppFonts.sansSemiBold, fontSize: 10, textAlign: 'center' },

  // Vertical sliders
  vSliderWrap: { alignItems: 'center', paddingHorizontal: 0 },
  vSliderTrack: {
    backgroundColor: '#E4E8F1',
    borderRadius: 8,
    height: 250,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    width: 29,
  },
  vSliderFill: {
    borderRadius: 8,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  vSliderThumb: {
    backgroundColor: '#FFFFFF',
    borderColor: 'rgba(82,117,232,0.14)',
    borderRadius: 14,
    borderWidth: 1,
    elevation: 5,
    height: 28,
    left: 0.5,
    position: 'absolute',
    shadowColor: '#5275E8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 8,
    width: 28,
  },

  // Save button
  saveRow: {
    backgroundColor: 'transparent',
    marginTop: 24,
    paddingTop: 0,
  },
  saveBtn: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: '#29A7E5',
    borderRadius: 27,
    height: 54,
    maxWidth: 348,
    overflow: 'hidden',
    width: '100%',
    elevation: 10,
    shadowColor: '#7B61FF',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.24,
    shadowRadius: 20,
  },
  saveBtnGradient: {
    alignItems: 'center',
    height: '100%',
    justifyContent: 'center',
    width: '100%',
  },
  saveBtnText: {
    color: '#FFFFFF',
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
  saveHint: {
    color: '#8C8C8C',
    fontFamily: AppFonts.sansRegular,
    fontSize: 12,
    marginBottom: 4,
    marginTop: -4,
    textAlign: 'center',
  },

  // Tab bar
  tabBarDock: { backgroundColor: '#FFFFFF', bottom: 0, left: 0, position: 'absolute', right: 0 },
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
  tabBarItem: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  tabBarLabel: {
    color: '#8C8C8C',
    fontFamily: AppFonts.sansMedium,
    fontSize: 12,
    letterSpacing: 0.4,
    lineHeight: 16,
    marginTop: 2,
    textAlign: 'center',
  },
  tabBarLabelActive: { color: '#3770FC' },

  // ── Select soundscapes modal ───────────────────────────────────────────
  modalOverlay: {
    backgroundColor: 'transparent',
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '88%',
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  modalHandle: {
    alignSelf: 'center',
    backgroundColor: '#E3E3E3',
    borderRadius: 3,
    height: 5,
    marginBottom: 10,
    width: 48,
  },
  modalHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  modalTitle: { color: '#173F5F', fontFamily: AppFonts.displayBold, fontSize: 20 },
  modalCloseBtn: {
    alignItems: 'center',
    backgroundColor: '#F4F5FA',
    borderRadius: 16,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  baseTrackNote: {
    alignItems: 'center',
    backgroundColor: '#EEF1FF',
    borderRadius: 12,
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  baseTrackNoteText: {
    color: '#5275E8',
    flex: 1,
    fontFamily: AppFonts.sansMedium,
    fontSize: 12,
  },

  searchBar: {
    alignItems: 'center',
    backgroundColor: '#F4F5FA',
    borderRadius: 14,
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
    paddingHorizontal: 14,
  },
  searchInput: {
    color: '#173F5F',
    flex: 1,
    fontFamily: AppFonts.sansRegular,
    fontSize: 14,
    height: 44,
  },

  modalTabsRow: { height: 44, marginBottom: 8 },
  modalTabsContent: { alignItems: 'center', gap: 8, paddingRight: 8 },
  modalTab: {
    backgroundColor: '#F4F5FA',
    borderRadius: 18,
    justifyContent: 'center',
    minHeight: 34,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  modalTabActive: { backgroundColor: '#5D7EEA' },
  modalTabText: {
    color: '#54555A',
    fontFamily: AppFonts.sansMedium,
    fontSize: 13,
    lineHeight: 18,
    textAlignVertical: 'center',
  },
  modalTabTextActive: { color: '#FFFFFF', fontFamily: AppFonts.sansSemiBold },

  modalLoading: { alignItems: 'center', justifyContent: 'center', minHeight: 200 },
  modalList: { maxHeight: 410 },
  modalListContent: { gap: 6, paddingBottom: 8 },
  modalItem: {
    alignItems: 'center',
    backgroundColor: '#F8F9FC',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'transparent',
    flexDirection: 'row',
    gap: 10,
    padding: 6,
  },
  modalItemSelected: { backgroundColor: '#EEF1FF', borderColor: '#7B61FF' },
  modalItemDisabled: { opacity: 0.4 },
  modalItemThumb: { borderRadius: 10, height: 48, width: 48 },
  modalItemText: { flex: 1 },
  modalItemTitle: { color: '#173F5F', fontFamily: AppFonts.sansSemiBold, fontSize: 14 },
  modalItemSubtitle: { color: '#8C8C8C', fontFamily: AppFonts.sansRegular, fontSize: 11, marginTop: 2 },
  checkCircle: {
    alignItems: 'center',
    borderColor: '#D5D8E6',
    borderRadius: 12,
    borderWidth: 2,
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
  checkCircleActive: { backgroundColor: '#7B61FF', borderColor: '#7B61FF' },

  modalFooter: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
    marginTop: 4,
    paddingTop: 5,
  },
  modalCountText: { color: '#8C8C8C', fontFamily: AppFonts.sansRegular, fontSize: 12, flex: 1 },
  modalConfirmBtn: { borderRadius: 24, overflow: 'hidden' },
  modalConfirmGradient: {
    alignItems: 'center',
    height: 46,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  modalConfirmText: { color: '#FFFFFF', fontFamily: AppFonts.sansSemiBold, fontSize: 15 },
});
