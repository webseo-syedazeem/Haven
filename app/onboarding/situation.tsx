import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { Href } from 'expo-router';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { OnboardingBrandHeader } from '@/components/onboarding/OnboardingBrandHeader';
import { OnboardingContinueButton } from '@/components/onboarding/OnboardingContinueButton';
import type { ModeId } from '@/constants/modes';
import { RELAX_ONBOARDING } from '@/constants/relax-onboarding';
import { AppFonts } from '@/constants/theme';
import { safeGoBack } from '@/lib/navigation';
import {
  getOnboardingAnswers,
  saveOnboardingAnswers,
} from '@/lib/onboarding';

const focusBackground = require('@/assets/images/what-breaks-your-focus.webp');
const sleepBackground = require('@/assets/images/what-gets-in-the-way-of-sleep.webp');

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
  const [selected, setSelected] = useState<string[]>([]);
  const [hydrating, setHydrating] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const hydrate = async () => {
      const answers = await getOnboardingAnswers();
      if (!active) return;
      if (answers.startingMode) {
        setMode(answers.mode ?? answers.startingMode);
      }
      setSelected(answers.mode_breakers);
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
    if (hydrating || selected.length === 0 || saving) return;
    setSaving(true);
    setSaveError(null);
    try {
      await saveOnboardingAnswers({ mode_breakers: selected });
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
        source={isSleep ? sleepBackground : focusBackground}
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
          <OnboardingBrandHeader onBack={() => safeGoBack(router)} />

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
                    disabled={hydrating}
                    key={option}
                    onPress={() => toggleOption(option)}
                    style={() => [
                      styles.optionCard,
                      isSelected
                        ? [styles.optionCardSelected, { borderColor: themeColor }]
                        : styles.optionCardUnselected,
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
              disabled={hydrating || selected.length === 0}
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
  backgroundImage: {
    flex: 1,
  },
  checkCircle: {
    alignItems: 'center',
    borderRadius: RELAX_ONBOARDING.optionRow.indicatorSize / 2,
    height: RELAX_ONBOARDING.optionRow.indicatorSize,
    justifyContent: 'center',
    width: RELAX_ONBOARDING.optionRow.indicatorSize,
  },
  checkCircleSelected: {
    backgroundColor: '#F4B34C',
  },
  checkCircleUnselected: {
    borderColor: '#3E414A',
    borderWidth: 1,
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
  optionCard: {
    alignItems: 'center',
    borderRadius: RELAX_ONBOARDING.optionRow.borderRadius,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: RELAX_ONBOARDING.optionRow.minHeight,
    paddingHorizontal: RELAX_ONBOARDING.optionRow.paddingHorizontal,
    paddingVertical: RELAX_ONBOARDING.optionRow.paddingVertical,
  },
  optionCardSelected: {
    backgroundColor: 'rgba(26, 27, 32, 0.85)',
    borderColor: '#F4B34C',
  },
  optionCardUnselected: {
    backgroundColor: 'rgba(18, 19, 23, 0.72)',
    borderColor: '#26282E',
  },
  optionText: {
    color: '#D4D2CD',
    fontFamily: AppFonts.sansMedium,
    fontSize: RELAX_ONBOARDING.optionRow.labelFontSize,
    fontWeight: '500',
    letterSpacing: 0.1,
    lineHeight: RELAX_ONBOARDING.optionRow.labelLineHeight,
  },
  optionTextSelected: {
    color: '#FFFFFF',
  },
  optionsList: {
    gap: RELAX_ONBOARDING.gaps.optionRows,
    marginTop: 26,
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
    marginTop: 8,
  },
});
