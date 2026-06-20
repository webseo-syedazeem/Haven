import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MultiSelectOptionCard } from '@/components/onboarding/MultiSelectOptionCard';
import { AppFonts } from '@/constants/theme';

const stressOptions = [
  { id: 'work-study', label: 'Work/study', icon: 'work-study' },
  { id: 'overthinking', label: 'Overthinking', icon: 'overthinking' },
  { id: 'poor-sleep', label: 'Poor sleep', icon: 'poor-sleep' },
  { id: 'social-stress', label: 'Social stress', icon: 'social-stress' },
  { id: 'finances', label: 'Finances', icon: 'finances' },
  { id: 'health', label: 'Health', icon: 'health' },
] as const;

const helpedOptions = [
  { id: 'breathwork', label: 'Breathwork', icon: 'breathwork' },
  { id: 'movement', label: 'Movement', icon: 'movement' },
  {
    id: 'soundscape',
    label: 'Soundscape',
    icon: 'sound',
  },
  { id: 'meditation', label: 'Meditation', icon: 'meditation' },
  { id: 'journaling', label: 'Journaling', icon: 'journaling' },
  { id: 'rest', label: 'Rest', icon: 'health' },
] as const;

function toggleOption(selectedValues: string[], optionId: string) {
  if (selectedValues.includes(optionId)) {
    return selectedValues.filter((value) => value !== optionId);
  }

  return [...selectedValues, optionId];
}

export function DailyReflectionScreen() {
  const params = useLocalSearchParams<{ stress?: string }>();
  const [selectedStressOptions, setSelectedStressOptions] = useState<string[]>([]);
  const [selectedHelpedOptions, setSelectedHelpedOptions] = useState<string[]>([]);
  const [reflection, setReflection] = useState('');
  const [validationMessage, setValidationMessage] = useState('');

  const handleStressOptionPress = (optionId: string) => {
    setSelectedStressOptions((current) => toggleOption(current, optionId));
    setValidationMessage('');
  };

  const handleHelpedOptionPress = (optionId: string) => {
    setSelectedHelpedOptions((current) => toggleOption(current, optionId));
    setValidationMessage('');
  };

  const handleContinuePress = () => {
    if (!selectedStressOptions.length && !selectedHelpedOptions.length) {
      setValidationMessage('Please select at least one option before continuing.');
      return;
    }

    setValidationMessage('');
    router.push({
      pathname: '/thank-you',
      params: params.stress ? { stress: params.stress } : {},
    });
  };

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'right', 'bottom', 'left']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardView}>
          <ScrollView
            bounces={false}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
              <Text allowFontScaling={false} style={styles.stepText}>
                Step 2 of 3
              </Text>
              <Text allowFontScaling={false} style={styles.heading}>
                What shaped your day?
              </Text>
              <Text style={styles.subtitle}>Select all that apply</Text>
            </View>

            <View style={styles.section}>
              <Text allowFontScaling={false} style={styles.sectionTitle}>
                What added to your stress?
              </Text>
              <View style={styles.optionGrid}>
                {stressOptions.map((option) => (
                  <MultiSelectOptionCard
                    key={option.id}
                    icon={option.icon}
                    label={option.label}
                    selected={selectedStressOptions.includes(option.id)}
                    onPress={() => handleStressOptionPress(option.id)}
                  />
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text allowFontScaling={false} style={styles.sectionTitle}>
                What helped you today?
              </Text>
              <View style={styles.optionGrid}>
                {helpedOptions.map((option) => (
                  <MultiSelectOptionCard
                    key={option.id}
                    icon={option.icon}
                    label={option.label}
                    selected={selectedHelpedOptions.includes(option.id)}
                    onPress={() => handleHelpedOptionPress(option.id)}
                  />
                ))}
              </View>
            </View>

            <View style={styles.reflectionSection}>
              <Text allowFontScaling={false} style={styles.sectionTitle}>
                Anything you would like to reflect on?
              </Text>
              <TextInput
                multiline
                onChangeText={setReflection}
                placeholder="Write your own thoughts"
                placeholderTextColor="#8C8C8C"
                style={styles.textInput}
                textAlignVertical="top"
                value={reflection}
              />
            </View>

            <Pressable
              accessibilityRole="button"
              onPress={handleContinuePress}
              style={({ pressed }) => [styles.continueButton, pressed && styles.pressed]}>
              <LinearGradient
                colors={['#5AA1E2', '#0D6FD0']}
                end={{ x: 0, y: 1 }}
                locations={[0.0379, 0.75]}
                start={{ x: 0, y: 0 }}
                style={styles.continueGradient}>
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
                <Text style={styles.continueText}>Continue</Text>
              </LinearGradient>
            </Pressable>

            {validationMessage ? <Text style={styles.validationText}>{validationMessage}</Text> : null}

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Back"
              hitSlop={12}
              onPress={() => router.back()}
              style={styles.backButton}>
              <Text style={styles.backText}>Back</Text>
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    width: '100%',
    overflow: 'hidden',
    backgroundColor: '#F4F5F9',
  },
  safeArea: {
    flex: 1,
    width: '100%',
  },
  keyboardView: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    flexGrow: 1,
    width: '100%',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  stepText: {
    fontFamily: AppFonts.sansMedium,
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 26,
    textAlign: 'center',
    color: '#7B61FF',
    marginBottom: 4,
  },
  heading: {
    fontFamily: AppFonts.displaySemiBold,
    fontWeight: '600',
    fontSize: 32,
    lineHeight: 34,
    letterSpacing: 0,
    textAlign: 'center',
    color: '#173F5F',
    marginBottom: 7,
  },
  subtitle: {
    fontFamily: AppFonts.sansMedium,
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 26,
    textAlign: 'center',
    color: '#8C8C8C',
  },
  section: {
    width: '100%',
    marginBottom: 22,
  },
  sectionTitle: {
    fontFamily: AppFonts.sansMedium,
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 26,
    letterSpacing: 0,
    color: '#000000',
    marginBottom: 12,
  },
  optionGrid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 11,
  },
  reflectionSection: {
    width: '100%',
    marginBottom: 16,
  },
  textInput: {
    width: '100%',
    minHeight: 88,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 12,
    fontFamily: AppFonts.sansMedium,
    fontWeight: '500',
    fontSize: 14,
    lineHeight: 22,
    color: '#54555A',
  },
  continueButton: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: '#0d6fd0',
    borderRadius: 27,
    elevation: 0,
    height: 54,
    marginBottom: 18,
    maxWidth: 348,
    overflow: 'hidden',
    width: '100%',
  },
  continueGradient: {
    alignItems: 'center',
    height: '100%',
    justifyContent: 'center',
    width: '100%',
  },
  continueText: {
    color: '#ffffff',
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
  pressed: {
    opacity: 0.86,
    transform: [{ scale: 0.99 }],
  },
  validationText: {
    color: '#7B61FF',
    fontSize: 12,
    fontFamily: AppFonts.sansMedium,
    fontWeight: '500',
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 8,
  },
  backButton: {
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 2,
  },
  backText: {
    color: '#7B61FF',
    fontFamily: AppFonts.sansBold,
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 24,
    textAlign: 'center',
  },
});
