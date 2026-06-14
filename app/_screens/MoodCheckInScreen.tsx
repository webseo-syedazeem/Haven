import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ScreenWrapper } from '@/components/ScreenWrapper';
import { GradientProgressBar } from '@/components/feeling-lately/GradientProgressBar';
import { MoodOption } from '@/components/feeling-lately/MoodOption';
import { useSetup } from '@/contexts/SetupContext';
import { toSetupMood } from '@/lib/setup-api';
import {
  wellnessColors,
  wellnessSpacing,
  wellnessTypography,
} from '@/constants/wellness-theme';

const moodOptions = [
  { label: 'Calm', icon: require('@/assets/images/Calm.svg'), progress: 0 },
  { label: 'Tense', icon: require('@/assets/images/tense.svg'), progress: 0.33 },
  { label: 'Anxious', icon: require('@/assets/images/anxious.svg'), progress: 0.66 },
  { label: 'Overwhelmed', icon: require('@/assets/images/overwhelmed.svg'), progress: 1 },
];

const getMoodFromProgress = (value: number) => {
  const moodIndex = Math.min(moodOptions.length - 1, Math.floor(value * moodOptions.length));

  return moodOptions[moodIndex].label;
};

export function MoodCheckInScreen() {
  const { updateAnswers } = useSetup();
  const [progress, setProgress] = useState(0.28);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [validationMessage, setValidationMessage] = useState('');
  const accessibilityMood = useMemo(
    () => selectedMood ?? getMoodFromProgress(progress),
    [progress, selectedMood]
  );

  const handleMoodChange = (nextProgress: number) => {
    setProgress(nextProgress);
    setSelectedMood(getMoodFromProgress(nextProgress));
    setValidationMessage('');
  };

  const handleMoodPress = (nextProgress: number, label: string) => {
    setProgress(nextProgress);
    setSelectedMood(label);
    setValidationMessage('');
  };

  const handleContinue = async () => {
    if (!selectedMood) {
      setValidationMessage('Please select how you feel before continuing.');
      return;
    }

    updateAnswers({ mood: toSetupMood(selectedMood) });
    router.push('/sleep-check');
  };

  return (
    <View style={styles.screen}>
      <ScreenWrapper
        backgroundImage={require('@/assets/images/feeling-lately-background.png')}
        bottomReserve={0}
        bottomContent={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Continue"
            accessibilityHint={`Selected mood is ${accessibilityMood}`}
            onPress={handleContinue}
            style={({ pressed }) => [styles.continueButton, pressed && styles.buttonPressed]}>
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
              <Text style={styles.buttonText}>Continue</Text>
            </LinearGradient>
          </Pressable>
        }
        bottomContentStyle={styles.bottomContent}
        middleContent={
          <>
            <Text style={styles.heading}>How have you been{'\n'}feeling lately?</Text>

            <View style={styles.progressSection}>
              <GradientProgressBar value={progress} onChange={handleMoodChange} />
            </View>

            <View style={styles.moodRow}>
              {moodOptions.map((mood) => (
                <MoodOption
                  key={mood.label}
                  icon={mood.icon}
                  label={mood.label}
                  onPress={() => handleMoodPress(mood.progress, mood.label)}
                />
              ))}
            </View>

            {validationMessage ? <Text style={styles.validationText}>{validationMessage}</Text> : null}
          </>
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
    backgroundColor: wellnessColors.surface,
  },
  bottomContent: {
    paddingHorizontal: 12,
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: wellnessSpacing.contentHorizontal,
  },
  heading: {
    ...wellnessTypography.heading,
    width: '100%',
    color: wellnessColors.heading,
    textAlign: 'center',
    marginBottom: wellnessSpacing.titleToProgress,
  },
  progressSection: {
    width: '100%',
    marginBottom: wellnessSpacing.progressToMoods,
  },
  moodRow: {
    width: '100%',
    maxWidth: '100%',
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  continueButton: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: '#0d6fd0',
    borderRadius: 27,
    elevation: 0,
    height: 54,
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
  validationText: {
    color: '#173F5F',
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 12,
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  buttonText: {
    ...wellnessTypography.button,
    color: wellnessColors.white,
    textAlign: 'center',
  },
});
