import { Asset } from 'expo-asset';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Image, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppFonts } from '@/constants/theme';

const backIcon = require('@/assets/icons/back icon.svg');
const background = require('@/assets/images/environment-background.webp');
const buttonBackground = require('@/assets/images/button backgound.jpg');
const backgroundUri = Asset.fromModule(background).uri;
const buttonBackgroundUri = Asset.fromModule(buttonBackground).uri;

const options = [
  {
    id: 'sleep',
    title: 'Sleep',
    description: 'Calm, predictable environments for settling into the night.',
    icon: require('@/assets/icons/sleep-icon.webp'),
  },
  {
    id: 'relax',
    title: 'Relax',
    description: 'Steady environments for unwinding and creating space.',
    icon: require('@/assets/icons/reset-icon.webp'),
  },
  {
    id: 'focus',
    title: 'Focus',
    description: 'Low-distraction environments for writing, reading, studying, and deep work.',
    icon: require('@/assets/icons/focus-icon.webp'),
  },
] as const;

type EnvironmentId = (typeof options)[number]['id'];

const colors = {
  background: '#050505',
  surface: '#0E0E0F',
  primary: '#F1E9DD',
  secondary: '#B8AFA4',
  gold: '#BB834F',
  border: '#3A3028',
  buttonText: '#12100E',
};

export default function EnvironmentScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState<EnvironmentId[]>([]);

  const toggleOption = (id: EnvironmentId) => {
    setSelected((current) =>
      current.includes(id) ? current.filter((selectedId) => selectedId !== id) : [...current, id]
    );
  };

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Pressable
            accessibilityLabel="Go back"
            hitSlop={12}
            onPress={() => router.back()}
            style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
            <Image resizeMode="contain" source={backIcon} style={styles.backIcon} />
          </Pressable>

          <View style={styles.header}>
            <Text style={styles.heading}>Create the right environment for every moment.</Text>
            <Text style={styles.description}>
              Passage helps you find complete, precisely labelled soundscapes for the exact moment you're in.
            </Text>
          </View>

          <View style={styles.optionList}>
            {options.map((option) => {
              const isSelected = selected.includes(option.id);
              return (
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  key={option.id}
                  onPress={() => toggleOption(option.id)}
                  style={({ pressed }) => [
                    styles.optionCard,
                    isSelected && styles.optionCardSelected,
                    pressed && styles.pressed,
                  ]}>
                  <Image resizeMode="cover" source={option.icon} style={styles.optionIcon} />
                  <View style={styles.optionCopy}>
                    <Text style={styles.optionTitle}>{option.title}</Text>
                    <Text style={styles.optionDescription}>{option.description}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>

          <Pressable
            accessibilityRole="button"
            disabled={selected.length === 0}
            onPress={() => router.push('/how-it-works')}
            style={({ pressed }) => [
              styles.continueButton,
              selected.length === 0 && styles.continueButtonDisabled,
              pressed && selected.length > 0 && styles.pressed,
            ]}>
            <Text style={styles.continueText}>Continue</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.background,
    backgroundImage: `url("${backgroundUri}")`,
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    backgroundSize: 'cover',
    flex: 1,
  } as any,
  safeArea: { flex: 1 },
  content: { minHeight: '100%', paddingBottom: 40, paddingHorizontal: 30, paddingTop: 90 },
  backButton: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    height: 35,
    justifyContent: 'center',
    left: 20,
    paddingRight: 3,
    position: 'fixed',
    top: 20,
    width: 35,
    zIndex: 10,
  } as any,
  backIcon: { height: 20, width: 20 },
  header: { marginBottom: 28 },
  heading: {
    color: colors.primary,
    fontFamily: AppFonts.displayRegular,
    fontSize: 35,
    fontWeight: '500',
    lineHeight: 42,
  },
  description: {
    color: colors.secondary,
    fontFamily: AppFonts.sansRegular,
    fontSize: 15,
    lineHeight: 24,
    marginTop: 18,
  },
  optionList: { gap: 16 },
  optionCard: {
    alignItems: 'center',
    backgroundColor: 'rgba(14, 14, 15, 0.82)',
    borderColor: colors.border,
    borderRadius: 22,
    borderWidth: 1,
    flexDirection: 'row',
    padding: 16,
  },
  optionCardSelected: {
    borderColor: colors.gold,
    elevation: 10,
    shadowColor: colors.gold,
    shadowOffset: { height: 0, width: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 14,
  },
  optionIcon: { height: 88, width: 88 },
  optionCopy: { flex: 1, marginLeft: 20 },
  optionTitle: {
    color: colors.primary,
    fontFamily: AppFonts.displayRegular,
    fontSize: 25,
    fontWeight: '500',
    lineHeight: 34,
  },
  optionDescription: {
    color: colors.secondary,
    fontFamily: AppFonts.sansRegular,
    fontSize: 14,
    lineHeight: 22,
    marginTop: 6,
  },
  continueButton: {
    alignItems: 'center',
    backgroundColor: colors.gold,
    backgroundImage: `url("${buttonBackgroundUri}")`,
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    backgroundSize: 'cover',
    borderColor: '#28221D',
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    marginTop: 28,
    overflow: 'hidden',
    paddingVertical: 20,
  } as any,
  continueText: {
    color: colors.buttonText,
    fontFamily: AppFonts.sansMedium,
    fontSize: 15,
    fontWeight: '500',
  },
  continueButtonDisabled: { opacity: 0.45 },
  pressed: { opacity: 0.88 },
});
