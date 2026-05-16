import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GradientProgressBar } from '@/components/feeling-lately/GradientProgressBar';
import { MoodOption } from '@/components/feeling-lately/MoodOption';
import {
  wellnessColors,
  wellnessRadius,
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
  const [progress, setProgress] = useState(0.28);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [validationMessage, setValidationMessage] = useState('');
  const accessibilityMood = useMemo(() => selectedMood ?? getMoodFromProgress(progress), [progress, selectedMood]);

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

  const handleContinue = () => {
    if (!selectedMood) {
      setValidationMessage('Please select how you feel before continuing.');
      return;
    }

    router.push('/sleep-check');
  };

  return (
    <View style={styles.screen}>
      <ImageBackground
        source={require('@/assets/images/feeling-lately-background.png')}
        resizeMode="cover"
        style={styles.background}
        imageStyle={styles.backgroundImage}>
        <SafeAreaView style={styles.safeArea} edges={[]}>
          <View style={styles.content}>
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

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Continue"
              accessibilityHint={`Selected mood is ${accessibilityMood}`}
              onPress={handleContinue}
              style={({ pressed }) => [styles.buttonShadow, pressed && styles.buttonPressed]}>
              <LinearGradient
                colors={[
                  wellnessColors.button.left,
                  wellnessColors.button.center,
                  wellnessColors.button.right,
                ]}
                locations={[0, 0.485, 1]}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={styles.button}>
                <Text style={styles.buttonText}>Continue</Text>
              </LinearGradient>
            </Pressable>
          </View>
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
    backgroundColor: wellnessColors.surface,
  },
  background: {
    flex: 1,
    width: '100%',
  },
  backgroundImage: {
    borderRadius: 0,
  },
  safeArea: {
    flex: 1,
    width: '100%',
  },
  content: {
    flex: 1,
    width: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: wellnessSpacing.contentHorizontal,
    paddingBottom: wellnessSpacing.bottom,
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
    marginBottom: wellnessSpacing.moodsToButton,
  },
  buttonShadow: {
    width: '100%',
    height: 58,
    borderRadius: 29,
    shadowColor: wellnessColors.button.left,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 18,
    elevation: 7,
  },
  validationText: {
    color: '#173F5F',
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 8,
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  button: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 29,
  },
  buttonText: {
    ...wellnessTypography.button,
    color: wellnessColors.white,
    textAlign: 'center',
  },
});
