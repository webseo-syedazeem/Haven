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

import { OnboardingContinueButton } from '@/components/onboarding/OnboardingContinueButton';
import { HalcyonColors } from '@/constants/design';
import type { ModeId } from '@/constants/modes';
import { AppFonts } from '@/constants/theme';
import {
  getOnboardingAnswers,
  saveOnboardingAnswers,
} from '@/lib/onboarding';

const brandIcon = require('@/assets/images/passage-brand-assets/screens-icon.webp');
const mountainBg = require('@/assets/images/understand-bg.webp');

const FOCUS_DISTRACTIONS = [
  'Background noise',
  'Racing thoughts',
  'Phone distractions',
  'Low energy',
  'Getting started',
] as const;

const SLEEP_DISTRACTIONS = [
  'Racing thoughts',
  'Outside noise',
  'Restlessness',
  'An inconsistent routine',
  'Waking in the night',
] as const;

export default function SituationScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<ModeId>('focus');
  const [selected, setSelected] = useState<string[]>([
    'Background noise',
    'Racing thoughts',
  ]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const hydrate = async () => {
      const answers = await getOnboardingAnswers();
      if (!active) return;
      if (answers.startingMode) {
        setMode(answers.startingMode);
      }
      if (answers.situation && answers.situation.length > 0) {
        setSelected(answers.situation);
      } else if (answers.startingMode === 'sleep') {
        setSelected(['Racing thoughts', 'Outside noise']);
      }
    };
    void hydrate();
    return () => {
      active = false;
    };
  }, []);

  const isSleep = mode === 'sleep';
  const themeColor = isSleep ? '#9FAEFD' : '#F4B34C';
  const options = isSleep ? SLEEP_DISTRACTIONS : FOCUS_DISTRACTIONS;

  const toggleOption = (option: string) => {
    setSaveError(null);
    setSelected((prev) =>
      prev.includes(option)
        ? prev.filter((item) => item !== option)
        : [...prev, option]
    );
  };

  const handleContinue = async () => {
    if (selected.length === 0 || saving) return;
    setSaving(true);
    setSaveError(null);
    try {
      await saveOnboardingAnswers({ situation: selected });
      router.push('/onboarding/personalise' as Href);
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
        source={mountainBg}
        style={styles.backgroundImage}>
        <LinearGradient
          colors={[
            'rgba(10, 11, 13, 0.2)',
            'rgba(10, 11, 13, 0.65)',
            '#0A0B0D',
            '#0A0B0D',
          ]}
          locations={[0, 0.35, 0.62, 1]}
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

            <Pressable
              accessibilityLabel="Go back"
              hitSlop={12}
              onPress={() => router.back()}
              style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
              <Ionicons color="#FFFFFF" name="chevron-back" size={22} />
            </Pressable>

            <View style={styles.headerSpacer} />
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            <View style={styles.titleContainer}>
              <Text style={styles.title}>
                {isSleep ? 'What gets in the\nway of sleep?' : 'What breaks\nyour focus?'}
              </Text>
              <Text style={styles.subtitle}>
                {isSleep
                  ? 'Choose what keeps you awake, so we can tailor your experience.'
                  : 'Choose what gets in the way, so we can tailor your experience.'}
              </Text>
            </View>

            <View style={styles.optionsList}>
              {options.map((option) => {
                const isSelected = selected.includes(option);
                return (
                  <Pressable
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: isSelected }}
                    key={option}
                    onPress={() => toggleOption(option)}
                    style={({ pressed }) => [
                      styles.optionCard,
                      isSelected
                        ? [styles.optionCardSelected, { borderColor: themeColor }]
                        : styles.optionCardUnselected,
                      pressed && styles.pressedCard,
                    ]}>
                    <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                      {option}
                    </Text>
                    <View
                      style={[
                        styles.checkCircle,
                        isSelected
                          ? [styles.checkCircleSelected, { backgroundColor: themeColor }]
                          : styles.checkCircleUnselected,
                      ]}>
                      {isSelected ? (
                        <Ionicons color="#0B0B0D" name="checkmark" size={15} />
                      ) : null}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>

          <View style={styles.footer}>
            {saveError ? <Text style={styles.errorText}>{saveError}</Text> : null}
            <OnboardingContinueButton
              disabled={selected.length === 0}
              label="CONTINUE"
              loading={saving}
              onPress={() => void handleContinue()}
              showArrow
              variant={isSleep ? 'lavender' : 'amber'}
            />
          </View>
        </SafeAreaView>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  backButton: {
    alignItems: 'center',
    height: 40,
    justifyContent: 'center',
    width: 40,
    zIndex: 1,
  },
  backgroundImage: {
    flex: 1,
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
    height: 22,
    resizeMode: 'contain',
    width: 38,
  },
  brandText: {
    color: '#FFFFFF',
    fontFamily: AppFonts.sansBold,
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
    marginLeft: 9,
  },
  checkCircle: {
    alignItems: 'center',
    borderRadius: 12,
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
  checkCircleSelected: {
    backgroundColor: '#F4B34C',
  },
  checkCircleUnselected: {
    borderColor: '#3E414A',
    borderWidth: 1.5,
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
  optionCard: {
    alignItems: 'center',
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 58,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  optionCardSelected: {
    backgroundColor: 'rgba(26, 27, 32, 0.85)',
    borderColor: '#F4B34C',
    borderWidth: 1.5,
  },
  optionCardUnselected: {
    backgroundColor: 'rgba(18, 19, 23, 0.72)',
    borderColor: '#26282E',
    borderWidth: 1,
  },
  optionText: {
    color: '#D4D2CD',
    fontFamily: AppFonts.sansRegular,
    fontSize: 16,
    letterSpacing: 0.1,
  },
  optionTextSelected: {
    color: '#FFFFFF',
    fontFamily: AppFonts.sansSemiBold,
  },
  optionsList: {
    gap: 12,
    marginTop: 26,
  },
  pressed: {
    opacity: 0.7,
  },
  pressedCard: {
    opacity: 0.9,
  },
  safeArea: {
    flex: 1,
  },
  screen: {
    backgroundColor: '#0A0B0D',
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
    paddingHorizontal: 22,
    paddingTop: 16,
  },
  subtitle: {
    color: '#9E9A92',
    fontFamily: AppFonts.sansRegular,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 8,
  },
  title: {
    color: '#FFFFFF',
    fontFamily: AppFonts.playfairRegular,
    fontSize: 34,
    letterSpacing: -0.3,
    lineHeight: 40,
  },
  titleContainer: {
    marginTop: 8,
  },
});
