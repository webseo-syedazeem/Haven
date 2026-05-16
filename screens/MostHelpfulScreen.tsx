import { router, type Href } from 'expo-router';
import { useState } from 'react';
import {
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  type TextStyle,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SleepOptionCard } from '@/components/sleep-check/SleepOptionCard';
import { wellnessTypography } from '@/constants/wellness-theme';
import { OnboardingContinueButton } from '../components/onboarding/OnboardingContinueButton';

const mostHelpfulOptions = [
  {
    id: 'feel-calmer-first',
    label: 'Feel calmer first',
    icon: require('@/assets/images/feel_calmer_first.svg'),
  },
  { id: 'sleep-better', label: 'Sleep better', icon: require('@/assets/images/sleep_better.svg') },
  { id: 'focus-more', label: 'Focus more', icon: require('@/assets/images/focus_more.svg') },
  {
    id: 'build-healthy-habits',
    label: 'Build healthy habits',
    icon: require('@/assets/images/build_healthy_habits.svg'),
  },
  { id: 'stop-spiraling', label: 'Stop spiraling', icon: require('@/assets/images/stop_spirlaing.svg') },
  {
    id: 'recover-after-work',
    label: 'Recover after work',
    icon: require('@/assets/images/recover_after_work.svg'),
  },
];

export function MostHelpfulScreen() {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [validationMessage, setValidationMessage] = useState('');

  const handleOptionPress = (optionId: string) => {
    setSelectedOption(optionId);
    setValidationMessage('');
  };

  const handleContinuePress = () => {
    if (!selectedOption) {
      setValidationMessage('Please select what feels most helpful before continuing.');
      return;
    }

    router.push('/stress-step' as Href);
  };

  return (
    <View style={styles.screen}>
      <ImageBackground
        source={require('@/assets/images/fell_most_helpful.png')}
        resizeMode="cover"
        style={styles.background}>
        <SafeAreaView style={styles.safeArea} edges={['top', 'right', 'bottom', 'left']}>
          <ScrollView
            bounces={false}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
              <Text style={styles.heading}>What would feel{'\n'}most helpful right{'\n'}now?</Text>
              <Text style={styles.subtitle}>Choose what fits best</Text>
            </View>

            <View style={styles.optionList}>
              {mostHelpfulOptions.map((option) => (
                <SleepOptionCard
                  key={option.id}
                  icon={option.icon}
                  label={option.label}
                  selected={selectedOption === option.id}
                  onPress={() => handleOptionPress(option.id)}
                  softInsetShadow
                />
              ))}
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
        </SafeAreaView>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    width: '100%',
    overflow: 'hidden',
    backgroundColor: '#85CDF6',
  },
  background: {
    flex: 1,
    width: '100%',
  },
  safeArea: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    flexGrow: 1,
    width: '100%',
    justifyContent: 'flex-end',
    paddingHorizontal: 12,
    paddingBottom: 24,
    paddingTop: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 28,
  },
  heading: {
    ...wellnessTypography.heading,
    color: '#173F5F',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'SF Pro',
    color: '#173F5F',
    fontSize: 16,
    fontWeight: '510' as TextStyle['fontWeight'],
    lineHeight: 26,
    letterSpacing: 0,
    textAlign: 'center',
  },
  optionList: {
    width: '100%',
    maxWidth: '100%',
    gap: 10,
    marginBottom: 33,
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
