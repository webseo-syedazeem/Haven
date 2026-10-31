import { useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { AreaConfirmationModal } from '@/components/onboarding/AreaConfirmationModal';
import { OnboardingPillButton } from '@/components/onboarding/OnboardingPillButton';
import { OnboardingStepHeader, PASSAGE_GOLD, PASSAGE_SLEEP } from '@/components/onboarding/OnboardingStepHeader';
import { RELAX_ACCENT } from '@/constants/design';
import { AppFonts } from '@/constants/theme';
import { safeGoBack } from '@/lib/navigation';
import {
  getOnboardingAnswers,
  saveOnboardingAnswers,
} from '@/lib/onboarding';

const focusImage = require('@/assets/images/focus-mode-realistic-v2.webp');
const relaxImage = require('@/assets/images/relax-mode-realistic-v2.webp');
const sleepImage = require('@/assets/images/sleep-mode-realistic-v2.webp');

type FocusOption = {
  id: 'focus' | 'relax' | 'sleep';
  mode: 'focus' | 'relax' | 'sleep';
  image: any;
  label: string;
  description: string;
  buttonLabel: string;
};

const OPTIONS: readonly FocusOption[] = [
  {
    id: 'focus',
    mode: 'focus',
    image: focusImage,
    label: 'Focus',
    description: 'Create the conditions for deeper, steadier work.',
    buttonLabel: 'CONTINUE WITH FOCUS',
  },
  {
    id: 'relax',
    mode: 'relax',
    image: relaxImage,
    label: 'Relax',
    description: 'Release tension and find calm through natural spaces.',
    buttonLabel: 'CONTINUE WITH RELAX',
  },
  {
    id: 'sleep',
    mode: 'sleep',
    image: sleepImage,
    label: 'Sleep',
    description: 'Create the conditions to wind down and rest more easily.',
    buttonLabel: 'CONTINUE WITH SLEEP',
  },
] as const;

export default function SelectFocusScreen() {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<FocusOption['id'] | null>(null);
  const [hydrating, setHydrating] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    let active = true;
    void getOnboardingAnswers()
      .then((answers) => {
        if (active) setSelectedId(answers.mode);
      })
      .catch(() => {
        if (active) setSaveError('We could not load your saved choice.');
      })
      .finally(() => {
        if (active) setHydrating(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const selectedOption = OPTIONS.find((item) => item.id === selectedId);
  const selectedAccent =
    selectedOption?.mode === 'relax'
      ? RELAX_ACCENT
      : selectedOption?.mode === 'sleep'
        ? PASSAGE_SLEEP
        : selectedOption?.mode === 'focus'
          ? PASSAGE_GOLD
          : '#FFFFFF';

  const handleOptionSelect = (option: FocusOption) => {
    setSaveError('');
    setSelectedId(option.id);
  };

  // Opens confirmation modal — no navigation yet.
  const handleContinue = () => {
    if (hydrating || saving || !selectedOption) return;
    setSaveError('');
    setModalVisible(true);
  };

  // Called from inside the modal — saves and navigates.
  const handleConfirm = async () => {
    if (!selectedOption) return;
    setSaving(true);
    setSaveError('');
    setModalVisible(false);
    try {
      await saveOnboardingAnswers({ mode: selectedOption.mode });
      router.push(
        selectedOption.mode === 'relax'
          ? '/stress-intro-1'
          : '/onboarding/situation'
      );
    } catch (error) {
      console.warn('[select-focus] error saving starting mode:', error);
      setSaveError('We could not save that choice. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="light" />

      {/* Header with Step 4 Active & dynamic theme color */}
      <OnboardingStepHeader
        activeColor={selectedAccent}
        currentStep={4}
        onBack={() => safeGoBack(router)}
        showBack
        totalSteps={4}
      />

      <View style={styles.content}>
        {/* Heading */}
        <View style={styles.headerBlock}>
          <Text style={styles.heading}>
            What would you{'\n'}like help with most?
          </Text>
        </View>

        {/* 3 Selectable Vertical Cards */}
        <View style={styles.cardsRow}>
          {OPTIONS.map((option) => {
            const isSelected = option.id === selectedId;

            return (
              <Pressable
                key={option.id}
                accessibilityRole="radio"
                accessibilityState={{ selected: isSelected }}
                disabled={hydrating}
                onPress={() => handleOptionSelect(option)}
                style={styles.cardColumn}
              >
                <View
                  style={[
                    styles.imageCard,
                    isSelected
                      ? [
                          styles.imageCardSelected,
                          {
                            borderColor: selectedAccent,
                            shadowColor: selectedAccent,
                          },
                        ]
                      : styles.imageCardUnselected,
                  ]}
                >
                  <Image
                    resizeMode="cover"
                    source={option.image}
                    style={styles.cardImage}
                  />

                  {/* Selected checkmark badge in top-right */}
                  {isSelected ? (
                    <View
                      style={[
                        styles.checkBadge,
                        { backgroundColor: selectedAccent },
                      ]}>
                      <Ionicons color="#0B0B0D" name="checkmark" size={14} />
                    </View>
                  ) : null}
                </View>

                <Text style={styles.cardLabel}>{option.label}</Text>
              </Pressable>
            );
          })}
        </View>

        {/* Dynamic Descriptive Text */}
        <View style={styles.copyBlock}>
          <Text style={styles.descriptionText}>
            {selectedOption?.description ?? 'Select one option to continue.'}
          </Text>
        </View>
      </View>

      {/* Dynamic mode action button */}
      <View style={styles.footer}>
        {saveError ? <Text style={styles.errorText}>{saveError}</Text> : null}
        <OnboardingPillButton
          arrowAtEnd
          disabled={hydrating || saving || !selectedOption}
          label={selectedOption?.buttonLabel ?? 'SELECT A MODE'}
          onPress={handleContinue}
          style={
            selectedOption?.mode === 'relax'
              ? { backgroundColor: RELAX_ACCENT }
              : undefined
          }
          variant={
            !selectedOption
              ? 'white'
              : selectedOption.mode === 'sleep'
                ? 'sleep'
                : 'gold'
          }
        />
      </View>

      {/* ── Confirmation modal ── */}
      <AreaConfirmationModal
        disabled={saving}
        mode={selectedOption?.mode ?? null}
        onChooseAnother={() => setModalVisible(false)}
        onConfirm={handleConfirm}
        visible={modalVisible}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  cardColumn: {
    alignItems: 'center',
    flex: 1,
  },
  cardImage: {
    height: '100%',
    width: '100%',
  },
  cardLabel: {
    color: '#FFFFFF',
    fontFamily: AppFonts.sansMedium,
    fontSize: 14,
    fontWeight: '600',
    marginTop: 10,
    textAlign: 'center',
  },
  cardsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
    width: '100%',
  },
  checkBadge: {
    alignItems: 'center',
    borderRadius: 10,
    height: 20,
    justifyContent: 'center',
    position: 'absolute',
    right: 8,
    top: 8,
    width: 20,
    zIndex: 2,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  copyBlock: {
    alignItems: 'center',
    marginBottom: 8,
    marginTop: 16,
    paddingHorizontal: 12,
  },
  descriptionText: {
    color: 'rgba(255, 255, 255, 0.78)',
    fontFamily: AppFonts.sansRegular,
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
  footer: {
    paddingBottom: 14,
    paddingHorizontal: 24,
    paddingTop: 8,
    width: '100%',
  },
  errorText: {
    color: '#D9A39B',
    fontFamily: AppFonts.sansRegular,
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 8,
    textAlign: 'center',
  },
  headerBlock: {
    alignItems: 'center',
    paddingTop: 2,
    width: '100%',
  },
  heading: {
    color: '#FFFFFF',
    fontFamily: AppFonts.displayRegular,
    fontSize: 40,
    letterSpacing: -0.5,
    lineHeight: 46,
    textAlign: 'center',
  },
  imageCard: {
    borderRadius: 14,
    height: 360,
    overflow: 'hidden',
    position: 'relative',
    width: '100%',
  },
  imageCardSelected: {
    borderWidth: 2,
    elevation: 6,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.28,
    shadowRadius: 9,
  },
  imageCardUnselected: {
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
  },
  safeArea: {
    backgroundColor: '#0B0B0D',
    flex: 1,
  },
});
