import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ScreenWrapper, useScreenBottomPadding } from '@/components/ScreenWrapper';
import { SleepOptionCard } from '@/components/sleep-check/SleepOptionCard';
import { AppFonts } from '@/constants/theme';
import { useSetup } from '@/contexts/SetupContext';

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

const dayFeelById: Record<string, string> = {
  'busy-mornings': 'Busy mornings',
  'long-workdays': 'Long workdays',
  'energy-dips': 'Energy dips',
  'caring-for-others': 'Caring for others',
  'irregular-rouine': 'Irregular routine',
  'evenings-feel-hardest': 'Evenings feel hardest',
};

export function DayFeelScreen() {
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
      setValidationMessage('Please select how your day usually feels before continuing.');
      return;
    }

    updateAnswers({ day_feel: dayFeelById[selectedOption] });
    router.push('/most-helpful');
  };

  return (
    <View style={styles.screen}>
      <ScreenWrapper
        backgroundImage={require('@/assets/images/dayfeel.png')}
        bottomReserve={0}
        middleContent={
          <ScrollView
            bounces={false}
            contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPadding }]}
            showsVerticalScrollIndicator={false}
            style={styles.scrollView}>
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
                  labelStyle={styles.optionLabel}
                  selected={selectedOption === option.id}
                  onPress={() => handleOptionPress(option.id)}
                />
              ))}
            </View>

            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                Halcyon adapts support into your real life, not a{'\n'}perfect routine.
              </Text>
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
    backgroundColor: '#020A45',
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
    marginBottom: 31,
  },
  heading: {
    color: '#173F5F',
    fontFamily: AppFonts.displaySemiBold,
    fontSize: 32,
    fontWeight: '600',
    letterSpacing: 0,
    lineHeight: 42,
    marginBottom: 10,
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
    marginBottom: 24,
  },
  scrollView: {
    width: '100%',
  },
  infoBox: {
    height: 85,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
    backgroundColor: '#FFFFFFE5',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    marginBottom: 33,
  },
  infoText: {
    color: '#000000',
    fontFamily: AppFonts.sansMedium,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 24,
    textAlign: 'center',
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
