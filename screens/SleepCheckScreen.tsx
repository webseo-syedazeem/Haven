import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import { ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SleepOptionCard } from '@/components/sleep-check/SleepOptionCard';
import { wellnessColors, wellnessTypography } from '@/constants/wellness-theme';

const sleepOptions = [
  { id: 'restful', label: 'Restful', icon: require('@/assets/images/Restful.svg') },
  { id: 'light-sleep', label: 'Light sleep', icon: require('@/assets/images/lightsleep.svg') },
  { id: 'watching-often', label: 'Watching often', icon: require('@/assets/images/gala_clock.svg') },
  { id: 'hard-to-fall-asleep', label: 'Hard to fall asleep', icon: require('@/assets/images/asleeps.svg') },
  { id: 'very-tired', label: 'Very tired', icon: require('@/assets/images/tired.svg') },
];

export function SleepCheckScreen() {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const handleBackPress = () => {
    router.back();
  };

  return (
    <View style={styles.screen}>
      <ImageBackground
        source={require('@/assets/images/sleep-background.png')}
        resizeMode="cover"
        style={styles.background}>
        <SafeAreaView style={styles.safeArea} edges={['top', 'right', 'bottom', 'left']}>
          <View style={styles.content}>
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
                  onPress={() => setSelectedOption(option.id)}
                />
              ))}
            </View>

            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                Science Shows sleep quality shapes stress{'\n'}resilience and focus fot the day ahead
              </Text>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Continue"
              onPress={() => router.push('/day-feel')}
              style={styles.buttonShadow}>
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

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Back"
              hitSlop={12}
              onPress={handleBackPress}
              style={styles.backButton}>
              <Text style={styles.backText}>Back</Text>
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
    backgroundColor: '#020A45',
  },
  background: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingBottom: 24,
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
    gap: 10,
    marginBottom: 24,
  },
  infoBox: {
    height: 85,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.86)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 33,
  },
  infoText: {
    color: '#000000',
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 24,
    textAlign: 'center',
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
    marginBottom: 18,
  },
  button: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 29,
  },
  buttonText: {
    ...wellnessTypography.button,
    color: '#FFFFFF',
    textAlign: 'center',
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
