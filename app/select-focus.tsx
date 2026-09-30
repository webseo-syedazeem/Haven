import { useEffect, useState } from 'react';
import { Image, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { OnboardingPillButton } from '@/components/onboarding/OnboardingPillButton';
import { OnboardingStepHeader, PASSAGE_GOLD, PASSAGE_SLEEP } from '@/components/onboarding/OnboardingStepHeader';
import {
  HalcyonColors,
  HalcyonModal,
  HalcyonRadius,
  RELAX_ACCENT,
} from '@/constants/design';
import { AppFonts } from '@/constants/theme';
import { safeGoBack } from '@/lib/navigation';
import {
  getOnboardingAnswers,
  saveOnboardingAnswers,
} from '@/lib/onboarding';

const focusImage = require('@/assets/images/focus-mode.webp');
const relaxImage = require('@/assets/images/relax-mode.webp');
const sleepImage = require('@/assets/images/sleep-mode.webp');

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

function accentForMode(mode: FocusOption['mode'] | undefined): string {
  if (mode === 'relax') return RELAX_ACCENT;
  if (mode === 'sleep') return PASSAGE_SLEEP;
  return PASSAGE_GOLD;
}

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

  const otherOptions = OPTIONS.filter((item) => item.id !== selectedId);

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

  // Switches mode from inside the modal and returns to tile screen.
  const handleSwitchMode = (option: FocusOption) => {
    setModalVisible(false);
    setSaveError('');
    setSelectedId(option.id);
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
      <Modal
        animationType="fade"
        navigationBarTranslucent
        onRequestClose={() => setModalVisible(false)}
        statusBarTranslucent
        transparent
        visible={modalVisible}>
        <View style={styles.modalOverlay}>
          {/* Tap backdrop to dismiss without changing selection */}
          <Pressable
            accessibilityLabel="Close"
            onPress={() => setModalVisible(false)}
            style={StyleSheet.absoluteFill}
          />

          <View accessibilityViewIsModal style={styles.modalCard}>
            {/* X close button */}
            <Pressable
              accessibilityLabel="Close"
              accessibilityRole="button"
              hitSlop={10}
              onPress={() => setModalVisible(false)}
              style={({ pressed }) => [styles.modalClose, pressed && styles.pressed]}>
              <Ionicons color={HalcyonColors.textSecondary} name="close" size={19} />
            </Pressable>

            {/* Mode icon ring */}
            <View style={[styles.modalIconRing, { borderColor: selectedAccent }]}>
              <Ionicons
                color={selectedAccent}
                name={
                  selectedOption?.mode === 'sleep'
                    ? 'moon-outline'
                    : selectedOption?.mode === 'relax'
                      ? 'leaf-outline'
                      : 'flash-outline'
                }
                size={26}
              />
            </View>

            <Text style={styles.modalTitle}>
              You've chosen {selectedOption?.label}
            </Text>
            <Text style={styles.modalMessage}>
              {`We'll customise Passage around ${selectedOption?.label ?? 'your mode'}, but you can still explore the other areas anytime.`}
            </Text>

            {/* Primary confirm button */}
            <Pressable
              accessibilityLabel={`Continue with ${selectedOption?.label}`}
              accessibilityRole="button"
              onPress={handleConfirm}
              style={({ pressed }) => [
                styles.modalConfirm,
                { backgroundColor: selectedAccent },
                pressed && styles.pressed,
              ]}>
              <Text style={styles.modalConfirmLabel}>
                Continue with {selectedOption?.label}
              </Text>
            </Pressable>

            {/* Switch-mode tiles for the other two options */}
            <Text style={styles.modalSwitchHeading}>Or explore a different area</Text>
            <View style={styles.modalSwitchRow}>
              {otherOptions.map((option) => {
                const tileAccent = accentForMode(option.mode);
                return (
                  <Pressable
                    key={option.id}
                    accessibilityLabel={`Switch to ${option.label}`}
                    accessibilityRole="button"
                    onPress={() => handleSwitchMode(option)}
                    style={({ pressed }) => [
                      styles.modalSwitchTile,
                      { borderColor: tileAccent },
                      pressed && styles.pressed,
                    ]}>
                    <Image
                      resizeMode="cover"
                      source={option.image}
                      style={styles.modalSwitchImage}
                    />
                    <View style={styles.modalSwitchScrim} />
                    <Text style={[styles.modalSwitchLabel, { color: tileAccent }]}>
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>
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
    fontFamily: AppFonts.playfairRegular,
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
  // ── Modal ──
  modalOverlay: {
    alignItems: 'center',
    backgroundColor: HalcyonModal.backdrop,
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 26,
  },
  modalCard: {
    alignItems: 'center',
    backgroundColor: HalcyonColors.surface,
    borderColor: HalcyonColors.border,
    borderRadius: HalcyonRadius.card,
    borderWidth: 1,
    maxWidth: 360,
    paddingBottom: 24,
    paddingHorizontal: 24,
    paddingTop: 44,
    width: '100%',
  },
  modalClose: {
    alignItems: 'center',
    height: 32,
    justifyContent: 'center',
    position: 'absolute',
    right: 10,
    top: 10,
    width: 32,
  },
  modalIconRing: {
    alignItems: 'center',
    borderRadius: 28,
    borderWidth: 1,
    height: 56,
    justifyContent: 'center',
    marginBottom: 16,
    width: 56,
  },
  modalTitle: {
    color: HalcyonColors.textPrimary,
    fontFamily: AppFonts.sansSemiBold,
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 24,
    paddingHorizontal: 12,
    textAlign: 'center',
  },
  modalMessage: {
    color: HalcyonColors.textSecondary,
    fontFamily: AppFonts.sansRegular,
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 26,
    marginTop: 8,
    maxWidth: 280,
    textAlign: 'center',
  },
  modalConfirm: {
    alignItems: 'center',
    borderRadius: HalcyonRadius.pill,
    justifyContent: 'center',
    minHeight: 48,
    width: '100%',
  },
  modalConfirmLabel: {
    color: '#0B0B0D',
    fontFamily: AppFonts.sansSemiBold,
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 22,
  },
  modalSwitchHeading: {
    color: 'rgba(255,255,255,0.45)',
    fontFamily: AppFonts.sansRegular,
    fontSize: 12,
    letterSpacing: 0.4,
    marginBottom: 10,
    marginTop: 20,
    textAlign: 'center',
  },
  modalSwitchRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalSwitchTile: {
    borderRadius: 10,
    borderWidth: 1,
    flex: 1,
    height: 72,
    overflow: 'hidden',
    position: 'relative',
  },
  modalSwitchImage: {
    height: '100%',
    width: '100%',
  },
  modalSwitchScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(11,11,13,0.38)',
  },
  modalSwitchLabel: {
    bottom: 8,
    fontFamily: AppFonts.sansSemiBold,
    fontSize: 13,
    fontWeight: '600',
    left: 0,
    position: 'absolute',
    right: 0,
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.8,
  },
});
