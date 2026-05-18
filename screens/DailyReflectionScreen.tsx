import { router } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  type TextStyle,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MultiSelectOptionCard } from '@/components/onboarding/MultiSelectOptionCard';
import { OnboardingContinueButton } from '../components/onboarding/OnboardingContinueButton';

const SF_PRO_FONT = Platform.select({
  ios: 'SF Pro',
  web: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  default: 'sans-serif',
});

const stressOptions = [
  { id: 'work-study', label: 'Work/study', icon: require('@/assets/images/work.svg') },
  { id: 'overthinking', label: 'Overthinking', icon: require('@/assets/images/overthinking.svg') },
  { id: 'poor-sleep', label: 'Poor sleep', icon: require('@/assets/images/poor_sleep.svg') },
  { id: 'social-stress', label: 'Social stress', icon: require('@/assets/images/social_stress.svg') },
  { id: 'finances', label: 'Finances', icon: require('@/assets/images/dashicons_money-alt.svg') },
  { id: 'health', label: 'Health', icon: require('@/assets/images/boxicons_brain.svg') },
];

const helpedOptions = [
  { id: 'breathwork', label: 'Breathwork', icon: require('@/assets/images/ph_flower-lotus-light.svg') },
  { id: 'movement', label: 'Movement', icon: require('@/assets/images/hugeicons_running-shoes.svg') },
  {
    id: 'soundscape',
    label: 'Soundscape',
    icon: require('@/assets/images/ph_flower-lotus-light.svg'),
  },
  { id: 'meditation', label: 'Meditation', icon: require('@/assets/images/solar_meditation-linear.svg') },
  { id: 'journaling', label: 'Journaling', icon: require('@/assets/images/icon-park-outline_journey.svg') },
  { id: 'rest', label: 'Rest', icon: require('@/assets/images/boxicons_brain.svg') },
];

function toggleOption(selectedValues: string[], optionId: string) {
  if (selectedValues.includes(optionId)) {
    return selectedValues.filter((value) => value !== optionId);
  }

  return [...selectedValues, optionId];
}

export function DailyReflectionScreen() {
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

            <OnboardingContinueButton onPress={handleContinuePress} />

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
    backgroundColor: '#F3F3F7',
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
    paddingHorizontal: 12,
    paddingTop: 43,
    paddingBottom: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  stepText: {
    fontFamily: SF_PRO_FONT,
    fontWeight: '590' as TextStyle['fontWeight'],
    fontSize: 16,
    lineHeight: 26,
    textAlign: 'center',
    color: '#7B61FF',
    marginBottom: 4,
  },
  heading: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontWeight: '700',
    fontSize: 32,
    lineHeight: 34,
    letterSpacing: 0,
    textAlign: 'center',
    color: '#173F5F',
    marginBottom: 7,
  },
  subtitle: {
    fontFamily: SF_PRO_FONT,
    fontWeight: '590' as TextStyle['fontWeight'],
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
    fontFamily: SF_PRO_FONT,
    fontWeight: '590' as TextStyle['fontWeight'],
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
    fontFamily: SF_PRO_FONT,
    fontWeight: '510' as TextStyle['fontWeight'],
    fontSize: 14,
    lineHeight: 22,
    color: '#54555A',
  },
  validationText: {
    color: '#7B61FF',
    fontSize: 12,
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
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 24,
    textAlign: 'center',
  },
});
