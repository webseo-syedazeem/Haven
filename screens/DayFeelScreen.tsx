import { router } from 'expo-router';
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

const dayFeelOptions = [
  { id: 'busy-mornings', label: 'Busy mornings', icon: require('@/assets/images/busy_mornings.svg') },
  { id: 'long-workdays', label: 'Long workdays', icon: require('@/assets/images/long_workdays.svg') },
  { id: 'energy-dips', label: 'Energy dips', icon: require('@/assets/images/energy_dips.svg') },
  { id: 'caring-for-others', label: 'Caring for others', icon: require('@/assets/images/caring_for_others.svg') },
  { id: 'irregular-rouine', label: 'Irregular rouine', icon: require('@/assets/images/irregular_rouine.svg') },
  {
    id: 'evenings-feel-hardest',
    label: 'Evenings feel hardest',
    icon: require('@/assets/images/evenings_feel_hardest.svg'),
  },
];

export function DayFeelScreen() {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [validationMessage, setValidationMessage] = useState('');

  const handleOptionPress = (optionId: string) => {
    setSelectedOption(optionId);
    setValidationMessage('');
  };

  const handleContinuePress = () => {
    if (!selectedOption) {
      setValidationMessage('Please select how your day usually feels before continuing.');
      return;
    }

    router.push('/most-helpful');
  };

  return (
    <View style={styles.screen}>
      <ImageBackground
        source={require('@/assets/images/dayfeel.png')}
        resizeMode="cover"
        style={styles.background}>
        <SafeAreaView style={styles.safeArea} edges={['top', 'right', 'bottom', 'left']}>
          <ScrollView
            bounces={false}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
              <Text style={styles.heading}>How does your day{'\n'}usually feel?</Text>
              <Text style={styles.subtitle}>Choose what fit best</Text>
            </View>

            <View style={styles.optionList}>
              {dayFeelOptions.map((option) => (
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
                Heaven adapts support into your real life, not a{'\n'}perfect routine.
              </Text>
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
    backgroundColor: '#020A45',
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
    paddingHorizontal: 20,
    paddingBottom: 24,
    paddingTop: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 31,
  },
  heading: {
    ...wellnessTypography.heading,
    color: '#173F5F',
    textAlign: 'center',
    marginBottom: 10,
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
    marginBottom: 24,
  },
  infoBox: {
    height: 85,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
    backgroundColor: '#FFFFFFE5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 33,
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  infoText: {
    color: '#000000',
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 24,
    textAlign: 'center',
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
