import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { Href } from 'expo-router';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Image,
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { OnboardingBackButton } from '@/components/onboarding/OnboardingBackButton';
import { OnboardingContinueButton } from '@/components/onboarding/OnboardingContinueButton';
import type { ModeId } from '@/constants/modes';
import { DURATION_STEP_ENABLED } from '@/constants/onboarding';
import { AppFonts } from '@/constants/theme';
import { safeGoBack } from '@/lib/navigation';
import {
  getOnboardingAnswers,
  saveOnboardingAnswers,
} from '@/lib/onboarding';

const brandIcon = require('@/assets/images/passage-brand-assets/screens-icon.webp');
const focusBackground = require('@/assets/images/personalise-focus-background.webp');
const sleepBackground = require('@/assets/images/personalise-sleep-background.webp');

const FOCUS_CONTEXTS = [
  {
    id: 'desk',
    label: 'At a desk',
    image: require('@/assets/images/personalise-desk.webp'),
  },
  {
    id: 'studying',
    label: 'Studying',
    image: require('@/assets/images/personalise-study.webp'),
  },
  {
    id: 'creative',
    label: 'Creative work',
    image: require('@/assets/images/personalise-creative.webp'),
  },
  {
    id: 'move',
    label: 'On the move',
    image: require('@/assets/images/personalise-move.webp'),
  },
] as const;

const SLEEP_CONTEXTS = [
  {
    id: 'falling-asleep',
    label: 'Falling asleep',
    image: require('@/assets/images/personalise-falling-asleep.webp'),
  },
  {
    id: 'after-late-work',
    label: 'After late work',
    image: require('@/assets/images/personalise-late-work.webp'),
  },
  {
    id: 'during-travel',
    label: 'During travel',
    image: require('@/assets/images/personalise-travel.webp'),
  },
  {
    id: 'after-waking',
    label: 'After waking',
    image: require('@/assets/images/personalise-waking.webp'),
  },
] as const;

const FOCUS_DURATIONS = ['25 min', '45 min', '90+ min'] as const;
const SLEEP_DURATIONS = ['20 min', '45 min', '90+ min'] as const;

function durationMinutes(value: string): number {
  return Number.parseInt(value, 10);
}

export default function PersonaliseScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<ModeId>('focus');
  const [selectedContexts, setSelectedContexts] = useState<string[]>([]);
  const [selectedDuration, setSelectedDuration] = useState<number | null>(null);
  const [hydrating, setHydrating] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const hydrate = async () => {
      const answers = await getOnboardingAnswers();
      if (!active) return;
      const savedMode = answers.mode ?? answers.startingMode ?? 'focus';
      const availableContexts =
        savedMode === 'sleep' ? SLEEP_CONTEXTS : FOCUS_CONTEXTS;
      setMode(savedMode);
      setSelectedContexts(
        availableContexts
          .filter(
            (item) =>
              answers.mode_areas.includes(item.label) ||
              answers.mode_areas.includes(item.id)
          )
          .map((item) => item.label)
      );
      setSelectedDuration(answers.target_minutes);
    };
    void hydrate()
      .catch(() => {
        if (active) setSaveError('We could not load your saved choices.');
      })
      .finally(() => {
        if (active) setHydrating(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const isSleep = mode === 'sleep';
  const themeColor = isSleep ? '#9FAEFD' : '#F4B34C';
  const contexts = isSleep ? SLEEP_CONTEXTS : FOCUS_CONTEXTS;
  const durations = isSleep ? SLEEP_DURATIONS : FOCUS_DURATIONS;

  const toggleContext = (label: string) => {
    setSaveError(null);
    setSelectedContexts((current) =>
      current.includes(label)
        ? current.filter((item) => item !== label)
        : [...current, label]
    );
  };

  const handleContinue = async () => {
    if (hydrating || selectedContexts.length === 0 || (DURATION_STEP_ENABLED && !selectedDuration) || saving) return;
    setSaving(true);
    setSaveError(null);
    try {
      await saveOnboardingAnswers({
        mode_areas: selectedContexts,
        ...(DURATION_STEP_ENABLED && selectedDuration !== null ? { target_minutes: selectedDuration } : {}),
      });
      router.push('/backed-by-science' as Href);
    } catch {
      setSaveError('We could not save that just yet. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.screen}>
      <ImageBackground
        resizeMode="cover"
        source={isSleep ? sleepBackground : focusBackground}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
        {/* Header with back button and centered brand */}
        <View style={styles.header}>
          {/* Absolute centered Brand - locked to horizontal center */}
          <View pointerEvents="none" style={styles.brandCenterAbsolute}>
            <Image source={brandIcon} style={styles.brandIcon} />
            <Text style={styles.brandText}>Passage</Text>
          </View>

          <OnboardingBackButton
            onPress={() => safeGoBack(router)}
            style={styles.backButtonLayer}
          />

          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>
              {isSleep ? 'When do you\nneed help sleeping?' : 'Where do you\nneed it most?'}
            </Text>
            <Text style={styles.subtitle}>
              {isSleep
                ? 'Choose your main moment, then how long you usually need.'
                : 'Choose your main context, then how long you usually focus for.'}
            </Text>
          </View>

          {/* 2x2 Grid */}
          <View style={styles.grid}>
            {contexts.map((item) => {
              const isSelected = selectedContexts.includes(item.label);
              return (
                <Pressable
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: isSelected }}
                  disabled={hydrating}
                  key={item.id}
                  onPress={() => toggleContext(item.label)}
                  style={[
                    styles.card,
                    isSelected
                      ? [styles.cardSelected, { borderColor: themeColor }]
                      : styles.cardUnselected,
                  ]}>
                  <ImageBackground
                    resizeMode="cover"
                    source={item.image}
                    style={StyleSheet.absoluteFill}>
                    <LinearGradient
                      colors={['transparent', 'rgba(10, 11, 13, 0.45)', 'rgba(10, 11, 13, 0.88)']}
                      locations={[0.3, 0.65, 1]}
                      style={StyleSheet.absoluteFill}
                    />
                  </ImageBackground>

                  {/* Circular check indicator top right */}
                  <View
                    style={[
                      styles.cardCheck,
                      isSelected
                        ? [styles.cardCheckSelected, { backgroundColor: themeColor }]
                        : styles.cardCheckUnselected,
                    ]}>
                    {isSelected ? (
                      <Ionicons color="#0B0B0D" name="checkmark" size={14} />
                    ) : null}
                  </View>

                  {/* Label bottom left */}
                  <Text style={styles.cardLabel}>{item.label}</Text>
                </Pressable>
              );
            })}
          </View>

          {/* Duration section: hidden when DURATION_STEP_ENABLED is false.
              Flip to true in constants/onboarding.ts to restore when soundscape
              durations vary. */}
          {DURATION_STEP_ENABLED && (
            <>
              {/* Divider with centered label */}
              <View style={styles.dividerContainer}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>
                  {isSleep ? 'HOW LONG DO YOU USUALLY NEED?' : 'HOW LONG DO YOU USUALLY FOCUS?'}
                </Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Duration Pills */}
              <View style={styles.durationRow}>
                {durations.map((dur) => {
                  const minutes = durationMinutes(dur);
                  const isSelected = selectedDuration === minutes;
                  return (
                    <Pressable
                      accessibilityRole="radio"
                      accessibilityState={{ selected: isSelected }}
                      disabled={hydrating}
                      key={dur}
                      onPress={() => {
                        setSaveError(null);
                        setSelectedDuration(minutes);
                      }}
                      style={[
                        styles.durationPill,
                        isSelected
                          ? [styles.durationPillSelected, { backgroundColor: themeColor }]
                          : styles.durationPillUnselected,
                      ]}>
                      <Text
                        style={[
                          styles.durationText,
                          isSelected ? styles.durationTextSelected : styles.durationTextUnselected,
                        ]}>
                        {dur}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </>
          )}
        </ScrollView>

        <View style={styles.footer}>
          {saveError ? <Text style={styles.errorText}>{saveError}</Text> : null}
          <OnboardingContinueButton
            disabled={hydrating || selectedContexts.length === 0 || (DURATION_STEP_ENABLED && !selectedDuration)}
            label="CONTINUE"
            loading={saving}
            onPress={() => void handleContinue()}
            showArrow
            variant={isSleep ? 'lavender' : 'amber'}
          />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  backButtonLayer: {
    zIndex: 1,
  },
  brandCenterAbsolute: {
    alignItems: 'center',
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 0,
  },
  brandIcon: {
    height: 38,
    resizeMode: 'contain',
    width: 58,
  },
  brandText: {
    color: '#FFFFFF',
    fontFamily: AppFonts.sansBold,
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
    marginLeft: -9,
  },
  card: {
    borderWidth: 1,
    borderRadius: 14,
    height: 136,
    justifyContent: 'space-between',
    overflow: 'hidden',
    padding: 12,
    width: '48%',
  },
  cardCheck: {
    alignItems: 'center',
    alignSelf: 'flex-end',
    borderWidth: 1.5,
    borderRadius: 12,
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
  cardCheckSelected: {
    backgroundColor: '#F4B34C',
    borderColor: 'transparent',
  },
  cardCheckUnselected: {
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    borderColor: 'rgba(255, 255, 255, 0.45)',
  },
  cardLabel: {
    color: '#FFFFFF',
    fontFamily: AppFonts.sansSemiBold,
    fontSize: 15.5,
    fontWeight: '600',
    lineHeight: 20,
  },
  cardSelected: {
    borderColor: '#F4B34C',
  },
  cardUnselected: {
    borderColor: '#26282E',
  },
  dividerContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    marginVertical: 20,
  },
  dividerLine: {
    backgroundColor: '#26282E',
    flex: 1,
    height: 1,
  },
  dividerText: {
    color: '#7E7A74',
    fontFamily: AppFonts.sansSemiBold,
    fontSize: 11,
    letterSpacing: 1.2,
    paddingHorizontal: 10,
  },
  durationPill: {
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    flex: 1,
    height: 44,
    justifyContent: 'center',
  },
  durationPillSelected: {
    backgroundColor: '#F4B34C',
    borderColor: 'transparent',
  },
  durationPillUnselected: {
    backgroundColor: '#141518',
    borderColor: '#26282E',
  },
  durationRow: {
    flexDirection: 'row',
    gap: 10,
  },
  durationText: {
    fontFamily: AppFonts.sansMedium,
    fontSize: 16,
    fontWeight: '500',
  },
  durationTextSelected: {
    color: '#0B0B0D',
  },
  durationTextUnselected: {
    color: '#EDE6DD',
  },
  errorText: {
    color: '#D9A39B',
    fontFamily: AppFonts.sansRegular,
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 8,
    textAlign: 'center',
  },
  footer: {
    paddingBottom: 14,
    paddingHorizontal: 22,
    paddingTop: 10,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
    marginTop: 20,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    height: 52,
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    position: 'relative',
    width: '100%',
  },
  headerSpacer: {
    height: 40,
    width: 40,
    zIndex: 1,
  },
  safeArea: {
    flex: 1,
  },
  screen: {
    backgroundColor: '#0A0B0D',
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
    paddingHorizontal: 22,
    paddingTop: 12,
  },
  subtitle: {
    color: '#FFFFFF',
    fontFamily: AppFonts.sansRegular,
    fontSize: 16,
    lineHeight: 24,
    marginTop: 8,
  },
  title: {
    color: '#FFFFFF',
    fontFamily: AppFonts.playfairRegular,
    fontSize: 40,
    letterSpacing: -0.3,
    lineHeight: 46,
  },
  titleContainer: {
    marginTop: 4,
  },
});
