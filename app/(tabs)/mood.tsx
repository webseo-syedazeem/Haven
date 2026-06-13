import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppFonts } from '@/constants/theme';

const backgroundImage = require('@/assets/images/mood-page-backgorund-image.png');

type MoodOption = {
  icon: number;
  label: string;
};

const moodOptions: MoodOption[] = [
  { icon: require('@/assets/images/stressed-icon.svg'), label: 'Stressed' },
  { icon: require('@/assets/images/peace-icon.svg'), label: 'Peace' },
  { icon: require('@/assets/images/neutral-icon.svg'), label: 'Neutral' },
  { icon: require('@/assets/images/happy-icon.svg'), label: 'Happy' },
  { icon: require('@/assets/images/tired.svg'), label: 'Sad' },
];

export default function MoodScreen() {
  const [selectedMood, setSelectedMood] = useState('Peace');

  return (
    <View style={styles.screen}>
      <Image source={backgroundImage} style={styles.backgroundImage} contentFit="cover" />

      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ScrollView
          bounces={false}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.title}>{`How are you feeling\ntoday?`}</Text>
            <Text style={styles.subtitle}>Choose one option</Text>
          </View>

          <View style={styles.options}>
            {moodOptions.map((option) => {
              const isSelected = selectedMood === option.label;

              return (
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  key={option.label}
                  onPress={() => setSelectedMood(option.label)}
                  style={({ pressed }) => [
                    styles.optionCard,
                    isSelected && styles.selectedOption,
                    pressed && (isSelected ? styles.selectedPressedOption : styles.pressed),
                  ]}>
                  <View style={styles.iconCircle}>
                    <Image source={option.icon} style={styles.optionIcon} contentFit="contain" />
                  </View>
                  <Text style={styles.optionText}>{option.label}</Text>
                </Pressable>
              );
            })}
          </View>

          <Pressable
            accessibilityRole="button"
            style={({ pressed }) => [styles.doneButton, pressed && styles.pressed]}>
            <LinearGradient
              colors={['#5AA1E2', '#0D6FD0']}
              end={{ x: 0, y: 1 }}
              locations={[0.0379, 0.75]}
              start={{ x: 0, y: 0 }}
              style={styles.doneGradient}>
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
              <Text style={styles.doneText}>Done</Text>
            </LinearGradient>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 17,
    paddingBottom: 112,
    paddingTop: 60,
  },
  doneButton: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: '#0d6fd0',
    borderRadius: 27,
    elevation: 0,
    height: 54,
    marginTop: 22,
    maxWidth: 348,
    overflow: 'hidden',
    width: '100%',
  },
  doneGradient: {
    alignItems: 'center',
    height: '100%',
    justifyContent: 'center',
    width: '100%',
  },
  doneText: {
    color: '#FFFFFF',
    fontFamily: AppFonts.sansMedium,
    fontSize: 18,
    fontWeight: '500',
    letterSpacing: 0,
    lineHeight: 26,
    textAlign: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 31,
  },
  iconCircle: {
    alignItems: 'center',
    backgroundColor: '#FD572814',
    borderRadius: 12,
    gap: 10,
    height: 48,
    justifyContent: 'center',
    padding: 4,
    width: 48,
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
  optionCard: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    flexDirection: 'row',
    gap: 16,
    height: 75,
    paddingHorizontal: 17,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 14,
    width: '100%',
  },
  optionIcon: {
    height: 31.5,
    width: 31.5,
  },
  optionText: {
    color: '#000000',
    fontFamily: AppFonts.sansSemiBold,
    fontSize: 18,
    fontWeight: '500',
    letterSpacing: 0,
    lineHeight: 24,
  },
  options: {
    gap: 10,
    maxWidth: 348,
    width: '100%',
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.99 }],
  },
  safeArea: {
    flex: 1,
  },
  screen: {
    backgroundColor: '#F9E8DE',
    flex: 1,
    overflow: 'hidden',
  },
  selectedOption: {
    borderColor: '#0D6FD0',
    borderWidth: 2,
    elevation: 5,
    shadowColor: '#0D6FD0',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    transform: [{ scale: 1.05 }],
  },
  selectedPressedOption: {
    opacity: 0.9,
    transform: [{ scale: 1.03 }],
  },
  subtitle: {
    color: '#54555A',
    fontFamily: AppFonts.sansMedium,
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: 0,
    lineHeight: 26,
    textAlign: 'center',
  },
  title: {
    color: '#173F5F',
    fontFamily: AppFonts.displayBold,
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: 0,
    lineHeight: 34,
    textAlign: 'center',
  },
});
