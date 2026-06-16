import { Image } from 'expo-image';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  ImageBackground,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { ExploreButton } from '@/components/ExploreButton';
import { ExploreGradientFill } from '@/components/explore-gradient';
import { ExploreTabChip } from '@/components/ExploreTabChip';
import { AppFonts } from '@/constants/theme';
import { startBreathingSession, updateBreathingSession } from '@/lib/breathing/api';
import {
  formatBreathingCountdown,
  formatBreathingDuration,
  getBreathingCycleDuration,
  getBreathingPatternText,
  getBreathingTypeConfig,
} from '@/lib/breathing/config';

const backgroundImage = require('@/assets/images/285a294ece0614f030198845adc4dff0100bbeff.png');
const globeImage = require('@/assets/images/44fd4a7516deff4e42e926f2962b61ff703723fc.png');
const CompleteBgImage = require('@/assets/images/f5ba11e8f8ac0e212b9f2ccbc46b4cb9ca0f3233.png');

type Phase = 'inhale' | 'hold1' | 'exhale' | 'hold2';
const PHASE_LABELS: Record<Phase, string> = {
  inhale: 'Inhale',
  hold1: 'Hold',
  exhale: 'Exhale',
  hold2: 'Hold',
};

const MOODS = [
  { label: '😊', value: 'great' },
  { label: '🙂', value: 'good' },
  { label: '😐', value: 'neutral' },
  { label: '😟', value: 'bad' },
  { label: '😢', value: 'terrible' },
];

const MOOD_COLORS: Record<string, string> = {
  great: '#FF66D8',
  good: '#2DCB52',
  neutral: '#8C8C8C',
  bad: '#FF5A3D',
  terrible: '#FFB800',
};

const TAB_ITEMS = [
  { label: 'Home', icon: 'home-outline', route: '/(tabs)', active: false },
  { label: 'Mood', icon: 'happy-outline', route: '/(tabs)/mood', active: false },
  { label: 'Tools', icon: 'leaf-outline', route: '/(tabs)/tools', active: true },
  { label: 'Progress', icon: 'stats-chart-outline', route: '/(tabs)/progress', active: false },
  { label: 'Profile', icon: 'person-outline', route: '/(tabs)/profile', active: false },
] as const;

export default function BreathingSessionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    sessionId: string;
    apiType: string;
    name: string;
    inhale: string;
    hold1: string;
    exhale: string;
    hold2: string;
    total: string;
  }>();

  const sessionIdRef = useRef(params.sessionId ?? '');
  const creatingSessionRef = useRef(false);
  const pendingProgressRef = useRef<number | null>(null);

  const fallbackConfig =
    getBreathingTypeConfig(params.name ?? '') ??
    getBreathingTypeConfig('Box Breathing')!;

  const inhaleT = Number(params.inhale) || fallbackConfig.inhale;
  const hold1T = Number(params.hold1) || fallbackConfig.hold1;
  const exhaleT = Number(params.exhale) || fallbackConfig.exhale;
  const hold2T = Number(params.hold2) || fallbackConfig.hold2;
  const totalSeconds = Number(params.total) || fallbackConfig.total_duration_seconds;
  const cycleDuration = getBreathingCycleDuration({
    inhale: inhaleT,
    hold1: hold1T,
    exhale: exhaleT,
    hold2: hold2T,
    total_duration_seconds: totalSeconds,
  });

  const patternText = getBreathingPatternText({
    inhale: inhaleT,
    hold1: hold1T,
    exhale: exhaleT,
    hold2: hold2T,
    total_duration_seconds: totalSeconds,
  });

  const [elapsed, setElapsed] = useState(0);
  const [phase, setPhase] = useState<Phase>('inhale');
  const [phaseCount, setPhaseCount] = useState(inhaleT);
  const [paused, setPaused] = useState(false);
  const [showPauseModal, setShowPauseModal] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [showComplete, setShowComplete] = useState(false);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [sessionKey, setSessionKey] = useState(0);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const phaseTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (sessionIdRef.current || creatingSessionRef.current) return;

    const apiType = params.apiType || params.name;
    if (!apiType) return;

    creatingSessionRef.current = true;
    void startBreathingSession(apiType).then((id) => {
      creatingSessionRef.current = false;
      if (!id) return;
      sessionIdRef.current = id;
      if (pendingProgressRef.current !== null) {
        updateBreathingSession(id, pendingProgressRef.current);
        pendingProgressRef.current = null;
      }
    });
  }, [params.apiType, params.name]);

  function saveSessionProgress(seconds: number) {
    pendingProgressRef.current = seconds;
    const sessionId = sessionIdRef.current || params.sessionId;
    if (sessionId) {
      updateBreathingSession(sessionId, seconds);
      pendingProgressRef.current = null;
    }
  }

  function handleBack() {
    saveSessionProgress(elapsed);
    router.back();
  }

  useEffect(() => {
    if (paused) return;
    intervalRef.current = setInterval(() => {
      setElapsed(prev => {
        const next = prev + 1;
        if (next >= totalSeconds) {
          clearInterval(intervalRef.current!);
          setShowComplete(true);
          saveSessionProgress(totalSeconds);
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current!);
  }, [paused, totalSeconds]);

  useEffect(() => {
    if (paused) return;
    const phases: Phase[] = ['inhale', ...(hold1T > 0 ? ['hold1' as Phase] : []), 'exhale', ...(hold2T > 0 ? ['hold2' as Phase] : [])];
    const durations = [inhaleT, ...(hold1T > 0 ? [hold1T] : []), exhaleT, ...(hold2T > 0 ? [hold2T] : [])];
    let idx = 0; let cnt = durations[0];
    setPhase(phases[0]); setPhaseCount(cnt);
    phaseTimerRef.current = setInterval(() => {
      cnt -= 1;
      if (cnt <= 0) { idx = (idx + 1) % phases.length; cnt = durations[idx]; setPhase(phases[idx]); }
      setPhaseCount(cnt);
    }, 1000);
    return () => clearInterval(phaseTimerRef.current!);
  }, [paused, inhaleT, hold1T, exhaleT, hold2T, sessionKey]);

  function formatTime(secs: number) {
    return formatBreathingCountdown(totalSeconds - secs);
  }

  function handleExit() {
    setShowExitModal(false);
    saveSessionProgress(elapsed);
    router.back();
  }

  function handleDone() {
    router.back();
    saveSessionProgress(totalSeconds);
  }

  function handleRestart() {
    setElapsed(0);
    setPaused(false);
    setPhase('inhale');
    setPhaseCount(inhaleT);
    setSessionKey((key) => key + 1);
    saveSessionProgress(0);
  }

  const phases: Phase[] = ['inhale', ...(hold1T > 0 ? ['hold1' as Phase] : []), 'exhale', ...(hold2T > 0 ? ['hold2' as Phase] : [])];

  // ── Complete ───────────────────────────────────────────────────────────────
  if (showComplete) {
    return (
      <View style={styles.completeScreen}>
        <ImageBackground source={CompleteBgImage} resizeMode="cover" style={styles.completeHeroBg} />
        <LinearGradient
          colors={['rgba(245,245,248,0)', '#F5F5F8']}
          locations={[0, 0.9]}
          style={styles.completeHeroFade}
        />
        <SafeAreaView edges={['top', 'bottom']} style={styles.completeSafe}>
          <Pressable
            accessibilityLabel="Go back"
            hitSlop={12}
            onPress={handleDone}
            style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
            <Ionicons name="chevron-back" size={18} color="#000000" />
          </Pressable>

          <View style={styles.completeContent}>
          <Text style={styles.completeTitle}>Great Job!</Text>
          <Text style={styles.completeSubtitle}>Your are completed Your breathing{'\n'}session</Text>
          <View style={styles.completeTick}>
            <ExploreGradientFill borderRadius={68} />
            <Text style={styles.completeTickIcon}>✓</Text>
          </View>
          <View style={styles.statsCard}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Session time</Text>
              <Text style={styles.statValue}>{formatBreathingDuration(totalSeconds)}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Cycle completed</Text>
              <Text style={styles.statValue}>{Math.floor(totalSeconds / cycleDuration)}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Breathig Rate</Text>
              <Text style={styles.statValue}>{cycleDuration}s</Text>
            </View>
          </View>
          <View style={styles.moodCard}>
            <Text style={styles.moodTitle}>How you feel?</Text>
            <Text style={styles.moodSubtitle}>Track Your mood after this session</Text>
            <View style={styles.moodRow}>
              {MOODS.map(m => (
                <Pressable
                  key={m.value}
                  onPress={() => setSelectedMood(m.value)}
                  style={[
                 
                  ]}>
                  <Text style={styles.moodEmoji}>{m.label}</Text>
                </Pressable>
              ))}
            </View>
          </View>
          <ExploreButton
            label="Done"
            onPress={handleDone}
            style={styles.doneBtn}
          />
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <ImageBackground source={backgroundImage} resizeMode="cover" style={[styles.screen, { opacity: 1 }]}>
      {/* Top half: background image */}
      <View style={styles.topHalf}>
        <SafeAreaView edges={['top']} style={styles.topSafe}>
          {/* Back button */}
          <Pressable
            accessibilityLabel="Go back"
            hitSlop={12}
            onPress={handleBack}
            style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
            <Ionicons name="chevron-back" size={18} color="#000000" />
          </Pressable>

          {/* Header */}
          <Text style={styles.sessionTitle}>{params.name}</Text>
          <Text style={styles.sessionSubtitle}>Choose support for how you feel</Text>

          {/* Globe image — full size, no ring */}
          <View style={styles.globeWrapper}>
            <View style={styles.globeStage}>
              <Image source={globeImage} style={styles.globeImage} contentFit="contain" />
              {/* Phase text centered over globe */}
              <View style={styles.phaseOverlay}>
                <Text style={styles.phaseLabel}>{PHASE_LABELS[phase]}</Text>
                <Text style={styles.phaseCount}>{phaseCount}</Text>
              </View>
            </View>
          </View>
        </SafeAreaView>
      </View>

      {/* Bottom half: white/blur card */}
      <View style={styles.bottomCard}>
      
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
        <ScrollView
          bounces={false}
          contentContainerStyle={[styles.bottomContent, { paddingBottom: insets.bottom + 40 }]}
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled
          style={styles.bottomScroll}
          showsVerticalScrollIndicator={false}>
          {/* Pattern chip */}
          <View style={styles.patternChip}>
            <Text style={styles.patternText}>{patternText}</Text>
          </View>

          {/* Timer */}
          <Text style={styles.timer}>{formatTime(elapsed)}</Text>

          {/* Phase tabs — rounded pill */}
          <LinearGradient
            colors={['#F5F8FD', '#FFFFFF', '#E3E9F2']}
            end={{ x: 0.5, y: 1 }}
            locations={[0, 0.45, 1]}
            start={{ x: 0.5, y: 0 }}
            style={styles.phaseTabs}>
            {phases.map((p) => (
              <ExploreTabChip
                key={p}
                active={phase === p}
                label={PHASE_LABELS[p]}
                variant="tab"
              />
            ))}
          </LinearGradient>

          {/* Controls */}
          <View style={styles.controls}>
            <Pressable onPress={handleRestart} style={styles.controlBtn}>
              <View style={styles.controlIconShadow}>
                <LinearGradient
                  colors={['#F5F8FD', '#FFFFFF', '#E3E9F2']}
                  end={{ x: 0.5, y: 1 }}
                  locations={[0, 0.45, 1]}
                  start={{ x: 0.5, y: 0 }}
                  style={styles.controlIconWrap}>
                  <Ionicons name="refresh" size={22} color="#173F5F" />
                </LinearGradient>
              </View>
              <Text style={styles.controlLabel}>Restart</Text>
            </Pressable>

            <Pressable onPress={() => { setPaused(true); setShowPauseModal(true); }} style={styles.pauseBtn}>
              <View style={styles.pauseGradient}>
                <ExploreGradientFill borderRadius={36} />
                <View style={styles.pauseBtnContent}>
                  <Ionicons name="pause" size={28} color="#FFF" />
                </View>
              </View>
            </Pressable>

            <Pressable onPress={() => setShowExitModal(true)} style={styles.controlBtn}>
              <View style={styles.controlIconShadow}>
                <LinearGradient
                  colors={['#F5F8FD', '#FFFFFF', '#E3E9F2']}
                  end={{ x: 0.5, y: 1 }}
                  locations={[0, 0.45, 1]}
                  start={{ x: 0.5, y: 0 }}
                  style={styles.controlIconWrap}>
                  <Ionicons name="close" size={22} color="#173F5F" />
                </LinearGradient>
              </View>
              <Text style={styles.controlLabel}>Exit</Text>
            </Pressable>
          </View>

          {/* Info box */}
          <View style={styles.infoBox}>
            <Text style={styles.infoIcon}>✦</Text>
            <Text style={styles.infoText}>
              {params.name} activate your body naturally Clam response help You feel grounded, center and in control
            </Text>
          </View>
          <View style={styles.scrollSpacer} />
        </ScrollView>
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

      {/* Pause modal */}
      <Modal transparent visible={showPauseModal} animationType="fade">
        <ImageBackground source={backgroundImage} resizeMode="cover" style={styles.modalBg}>
          <Pressable
            hitSlop={12}
            onPress={() => { setPaused(false); setShowPauseModal(false); }}
            style={({ pressed }) => [styles.modalScreenBackBtn, { top: insets.top + 16 }, pressed && styles.pressed]}>
            <Ionicons name="chevron-back" size={18} color="#000000" />
          </Pressable>
          <View style={styles.pauseModalContent}>
            <Text style={styles.pauseModalTitle}>Session Paused</Text>
            <Text style={styles.pauseModalSubtitle}>Take Your time. You can resume{'\n'}whenever. You're ready.</Text>
            <Pressable onPress={() => { setPaused(false); setShowPauseModal(false); }} style={styles.resumeBtn}>
              <View style={styles.resumeGradient}>
                <ExploreGradientFill borderRadius={40} />
                <View style={styles.resumeBtnContent}>
                  <Ionicons name="play" size={32} color="#FFF" />
                </View>
              </View>
            </Pressable>
            <View style={styles.divider} />
            <Pressable onPress={() => { setShowPauseModal(false); setShowExitModal(true); }}>
              <Text style={styles.endSessionText}>End Session</Text>
            </Pressable>
          </View>
        </ImageBackground>
      </Modal>

      {/* Exit modal */}
      <Modal transparent visible={showExitModal} animationType="fade">
        <ImageBackground source={backgroundImage} resizeMode="cover" style={styles.modalBg}>
          <Pressable
            hitSlop={12}
            onPress={() => { setShowExitModal(false); setShowPauseModal(true); }}
            style={({ pressed }) => [styles.modalScreenBackBtn, { top: insets.top + 16 }, pressed && styles.pressed]}>
            <Ionicons name="chevron-back" size={18} color="#000000" />
          </Pressable>
          <View style={styles.exitModalContent}>
            <Text style={styles.pauseModalTitle}>End Session?</Text>
            <Text style={styles.pauseModalSubtitle}>Are you sure u want to end{'\n'}this session</Text>
            <ExploreButton
              label="Yes, End"
              onPress={handleExit}
              style={styles.yesEndBtn}
            />
            <View style={styles.divider} />
        <Pressable onPress={() => { setShowExitModal(false); setShowPauseModal(true); }}>
  <Text style={styles.cancelText}>Cancel</Text>
</Pressable>
          </View>
        </ImageBackground>
      </Modal>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F0EEFF' },

  // Top half
  topHalf: {
    height: '44%',
    backgroundColor: 'transparent',
  },
  topSafe: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  backButton: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 16,
    height: 32,
    justifyContent: 'center',
    marginBottom: 16,
    width: 32,
  },
  pressed: { opacity: 0.86, transform: [{ scale: 0.99 }] },
  sessionTitle: {
    color: '#173F5F',
    fontFamily: AppFonts.displayBold,
    fontSize: 26,
    marginTop: -14,
    textAlign: 'center',
    marginBottom: 2,
  },
  sessionSubtitle: {
    color: '#6B7280',
    fontFamily: AppFonts.sansRegular,
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 8,
  },

  // Globe
  globeWrapper: {
    alignItems: 'center',
    flex: 1,

    justifyContent: 'center',
    
    width: '100%',
  },
  globeStage: {
  alignItems: 'center',
  height: 430,
  justifyContent: 'center',
  width: 430,
  marginTop: 40,
},
  globeImage: {
    height: 430,
    width: 430,
  },
  phaseOverlay: {
    alignItems: 'center',
    bottom: 0,
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    transform: [{ translateY: -10 }],
  },
  phaseLabel: {
    color: '#173F5F',
    fontFamily: AppFonts.sansMedium,
    fontSize: 20,
    marginBottom: -14,
  },
  phaseCount: {
    color: '#173F5F',
    fontFamily: AppFonts.displayBold,
    fontSize: 72,
    lineHeight: 80,
  },

  // Bottom card
  bottomCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    flex: 1,
    marginTop: 64,
    overflow: 'visible',
    paddingHorizontal: 20,
  
  },
  fogFade: {
    height: 160,
    left: 0,
    position: 'absolute',
    right: 0,
    top: -116,
  },
  fogVeil: {
    height: 130,
    left: 0,
    position: 'absolute',
    right: 0,
    top: -86,
  },
 fogOverlay: {
  ...StyleSheet.absoluteFillObject,
  backgroundColor: 'transparent',
},
  bottomScroll: {
    flex: 1,
  },
  bottomContent: {
    flexGrow: 1,
    paddingTop: 0,
  },

  // Pattern chip
  patternChip: {
    alignSelf: 'center',
    backgroundColor: 'rgba(200,185,255,0.35)',
    borderRadius: 20,
    marginBottom: 8,
    paddingHorizontal: 18,
    paddingVertical: 5,
  },
  patternText: {
    color: '#6B5BCC',
    fontFamily: AppFonts.sansRegular,
    fontSize: 13,
  },

  // Timer
  timer: {
    color: '#173F5F',
    fontFamily: AppFonts.sansBold,
    fontSize: 30,
    marginBottom: 14,
    textAlign: 'center',
  },

  // Phase tabs — single border + inner gradient for 3D depth
  phaseTabs: {
    borderColor: 'rgba(227,227,227,0.55)',
    borderRadius: 34,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 4,
    marginBottom: 20,
    overflow: 'hidden',
    padding: 4,
  },

  // Controls
  controls: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 40,
    justifyContent: 'center',
    marginBottom: 16,
  },
  controlBtn: { alignItems: 'center', gap: 6 },
  controlIconShadow: {
    borderRadius: 22,
    shadowColor: '#5275E8',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.24,
    shadowRadius: 14,
  },
  controlIconWrap: {
    alignItems: 'center',
    borderColor: 'rgba(227,227,227,0.55)',
    borderRadius: 22,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 44,
  },
  controlLabel: {
    color: '#173F5F',
    fontFamily: AppFonts.sansRegular,
    fontSize: 13,
  },
  pauseBtn: {
    borderRadius: 36,
    elevation: 8,
    height: 72,
    overflow: 'hidden',
    shadowColor: 'rgb(110, 95, 230)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    width: 72,
  },
  pauseGradient: {
    borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: 36,
    borderWidth: 1,
    flex: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  pauseBtnContent: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    position: 'relative',
    zIndex: 1,
  },

  // Info box
  infoBox: {
    alignItems: 'flex-start',
    backgroundColor: 'rgba(220,210,255,0.35)',
    borderRadius: 16,
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
    padding: 14,
  },
  scrollSpacer: {
    height: 20,
  },
  transitionFog: {
  position: 'absolute',
  left: 0,
  right: 0,
  top: -90,
  height: 90,
  zIndex: 50,
},
  infoIcon: { color: '#8c8af0', fontSize: 16, marginTop: 2 },
  infoText: {
    color: '#4B3B8C',
    flex: 1,
    fontFamily: AppFonts.sansRegular,
    fontSize: 13,
    lineHeight: 20,
  },

  // Floating tab bar
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
  // Modals
  modalBg: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  pauseModalContent: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 28,
    gap: 8,
    padding: 32,
    width: '85%',
  },
  exitModalContent: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 28,
    gap: 8,
    padding: 32,
    width: '85%',
  },
  modalScreenBackBtn: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 16,
    height: 32,
    justifyContent: 'center',
    left: 20,
    position: 'absolute',
    width: 32,
    zIndex: 10,
  },
  pauseModalTitle: {
    color: '#173F5F',
    fontFamily: AppFonts.displayBold,
    fontSize: 22,
    textAlign: 'center',
  },
  pauseModalSubtitle: {
    color: '#6B7280',
    fontFamily: AppFonts.sansRegular,
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 8,
  },
  resumeBtn: { borderRadius: 40, height: 80, overflow: 'hidden', width: 80 },
  resumeGradient: {
    borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: 40,
    borderWidth: 1,
    flex: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  resumeBtnContent: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    position: 'relative',
    zIndex: 1,
  },
  divider: {
    backgroundColor: 'rgba(0,0,0,0.12)',
    height: 1,
    width: '80%',
    marginVertical: 4,
  },
  endSessionText: {
    color: '#6B7280',
    fontFamily: AppFonts.sansMedium,
    fontSize: 16,
    marginTop: 4,
  },
  yesEndBtn: {
    width: '100%',
  },
  cancelText: {
    color: '#6B7280',
    fontFamily: AppFonts.sansMedium,
    fontSize: 16,
    marginTop: 4,
  },

  // Complete screen
  completeScreen: { backgroundColor: '#F5F5F8', flex: 1 },
  completeHeroBg: {
    height: 250,
    left: 0,
    opacity: 0.72,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  completeHeroFade: {
    height: 310,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  completeSafe: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  completeContent: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: 12,
  },
  completeTitle: {
    color: '#173F5F',
    fontFamily: AppFonts.displayBold,
    fontSize: 30,
    marginBottom: 8,
    marginTop: 8,
    textAlign: 'center',
  },
  completeSubtitle: {
    color: '#173F5F',
    fontFamily: AppFonts.sansMedium,
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 26,
    textAlign: 'center',
  },
  completeTick: {
    alignItems: 'center',
    borderRadius: 68,
    height: 136,
    justifyContent: 'center',
    marginBottom: 24,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: 'rgb(110, 95, 230)',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 22,
    width: 136,
  },
  completeTickIcon: {
    color: '#FFF',
    fontSize: 72,
    fontWeight: '300',
    lineHeight: 78,
    position: 'relative',
    zIndex: 1,
  },
  statsCard: {
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 20,
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    paddingHorizontal: 12,
    paddingVertical: 18,
    width: '100%',
  },
  statDivider: { backgroundColor: 'transparent', height: 40, width: 1 },
  statItem: { alignItems: 'center', flex: 1 },
  statLabel: { color: '#8C8C8C', fontFamily: AppFonts.sansRegular, fontSize: 10, textAlign: 'center' },
  statValue: { color: '#173F5F', fontFamily: AppFonts.sansMedium, fontSize: 17, marginTop: 10 },
  moodCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginBottom: 'auto',
    paddingHorizontal: 16,
    paddingVertical: 14,
    width: '100%',
  },
  moodTitle: {
    color: '#173F5F',
    fontFamily: AppFonts.displayBold,
    fontSize: 18,
    marginBottom: 4,
  },
  moodSubtitle: {
    color: '#071A78',
    fontFamily: AppFonts.sansMedium,
    fontSize: 11,
    marginBottom: 18,
  },
  moodRow: { flexDirection: 'row', justifyContent: 'space-between' },
  moodBtn: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 2,
    height: 26,
    justifyContent: 'center',
    width: 26,
  },
  moodBtnSelected: { backgroundColor: 'rgba(123,97,255,0.1)' },
  moodEmoji: { fontSize: 22, lineHeight: 26 },
  doneBtn: {
    marginBottom: 22,
    width: '100%',
  },
});
