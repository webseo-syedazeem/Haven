import { router, type Href } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { ScreenWrapper, useScreenBottomPadding } from '@/components/ScreenWrapper';
import { SleepOptionCard } from '@/components/sleep-check/SleepOptionCard';
import { AppFonts } from '@/constants/theme';
import { useSetup } from '@/contexts/SetupContext';

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

const goalById: Record<string, string> = {
  'feel-calmer-first': 'Feel calmer first',
  'sleep-better': 'Sleep better',
  'focus-more': 'Focus More',
  'build-healthy-habits': 'Build healthy habits',
  'stop-spiraling': 'Stop spiraling',
  'recover-after-work': 'Recover after work',
};

export function MostHelpfulScreen() {
  const { updateAnswers } = useSetup();
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [validationMessage, setValidationMessage] = useState('');
  const bottomPadding = useScreenBottomPadding();

  const handleOptionPress = (optionId: string) => {
    setSelectedOption(optionId);
    setValidationMessage('');
  };

  const handleContinuePress = async () => {
    if (!selectedOption) {
      setValidationMessage('Please select what feels most helpful before continuing.');
      return;
    }

    updateAnswers({ goal: goalById[selectedOption] });
    router.push('/feels-realistic' as Href);
  };

  return (
    <View style={styles.screen}>
      <ScreenWrapper
        backgroundImage={require('@/assets/images/fell_most_helpful.png')}
        bottomReserve={0}
        middleContent={
          <ScrollView
            bounces={false}
            contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPadding }]}
            showsVerticalScrollIndicator={false}
            style={styles.scrollView}>
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
                  labelStyle={styles.optionLabel}
                  selected={selectedOption === option.id}
                  onPress={() => handleOptionPress(option.id)}
                  softInsetShadow
                />
              ))}
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
    backgroundColor: '#85CDF6',
  },
  content: {
    paddingHorizontal: 20,
    width: '100%',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingTop: 60,
    width: '100%',
  },
  header: {
    alignItems: 'center',
    marginBottom: 28,
  },
  heading: {
    color: '#173F5F',
    fontFamily: AppFonts.displaySemiBold,
    fontSize: 32,
    fontWeight: '600',
    letterSpacing: 0,
    lineHeight: 42,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    color: '#173F5F',
    fontFamily: AppFonts.sansMedium,
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: 0,
    lineHeight: 26,
    textAlign: 'center',
  },
  optionList: {
    width: '100%',
    maxWidth: '100%',
    gap: 10,
    marginBottom: 33,
  },
  scrollView: {
    width: '100%',
  },
  optionLabel: {
    fontFamily: AppFonts.sansMedium,
    fontWeight: '500',
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
    color: '#FFFFFF',
    fontFamily: AppFonts.sansMedium,
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
    fontFamily: AppFonts.sansMedium,
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 24,
    textAlign: 'center',
  },
});
