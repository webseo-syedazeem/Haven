import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ScreenWrapper, useScreenBottomPadding } from '@/components/ScreenWrapper';
import { OnboardingContinueButton } from '@/components/onboarding/OnboardingContinueButton';
import { SleepOptionCard } from '@/components/sleep-check/SleepOptionCard';
import { wellnessTypography } from '@/constants/wellness-theme';

const sleepOptions = [
  { id: 'restful', label: 'Restful', icon: require('@/assets/images/Restful.svg') },
  { id: 'light-sleep', label: 'Light sleep', icon: require('@/assets/images/lightsleep.svg') },
  { id: 'watching-often', label: 'Watching often', icon: require('@/assets/images/gala_clock.svg') },
  { id: 'hard-to-fall-asleep', label: 'Hard to fall asleep', icon: require('@/assets/images/asleeps.svg') },
  { id: 'very-tired', label: 'Very tired', icon: require('@/assets/images/tired.svg') },
];

export function SleepCheckScreen() {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [validationMessage, setValidationMessage] = useState('');
  const bottomPadding = useScreenBottomPadding();

  const handleOptionPress = (optionId: string) => {
    setSelectedOption(optionId);
    setValidationMessage('');
  };

  const handleContinuePress = () => {
    if (!selectedOption) {
      setValidationMessage('Please select your sleep status before continuing.');
      return;
    }

    router.push('/day-feel');
  };

  const handleBackPress = () => {
    router.back();
  };

  return (
    <View style={styles.screen}>
      <ScreenWrapper
        backgroundImage={require('@/assets/images/sleep-background.png')}
        bottomReserve={0}
        middleContent={
          <ScrollView
            bounces={false}
            contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPadding }]}
            showsVerticalScrollIndicator={false}
            style={styles.scrollView}>
            <View style={styles.header}>
              <Text style={styles.heading}>How has your{'\n'}sleep been lately?</Text>
              <Text style={styles.subtitle}>Choose what fit best</Text>
            </View>

            <View style={styles.optionList}>
              {sleepOptions.map((option) => (
                <SleepOptionCard
                  key={option.id}
                  icon={option.icon}
                  label={option.label}
                  selected={selectedOption === option.id}
                  onPress={() => handleOptionPress(option.id)}
                />
              ))}
            </View>

            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                Science Shows sleep quality shapes stress{'\n'}resilience and focus for the day{' '}
                ahead
              </Text>
            </View>

            <OnboardingContinueButton onPress={handleContinuePress} />

            {validationMessage ? <Text style={styles.validationText}>{validationMessage}</Text> : null}

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Back"
              hitSlop={12}
              onPress={handleBackPress}
              style={styles.backButton}>
              <Text style={styles.backText}>Back</Text>
            </Pressable>
          </ScrollView>
        }
        middleContentStyle={styles.content}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    width: '100%',
    overflow: 'hidden',
    backgroundColor: '#020A45',
  },
  content: {
    paddingHorizontal: 20,
    width: '100%',
  },
  header: {
    alignItems: 'center',
    marginBottom: 31,
  },
  heading: {
    ...wellnessTypography.heading,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
    textAlign: 'center',
  },
  optionList: {
    width: '100%',
    maxWidth: '100%',
    gap: 10,
    marginBottom: 24,
  },
  infoBox: {
    height: 85,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.86)',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginBottom: 33,
  },
  infoText: {
    color: '#000000',
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 24,
    textAlign: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingTop: 60,
    width: '100%',
  },
  scrollView: {
    width: '100%',
  },
  validationText: {
    color: '#FFFFFF',
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
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 24,
    textAlign: 'center',
  },
});
