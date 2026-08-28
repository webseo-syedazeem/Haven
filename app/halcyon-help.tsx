import { Ionicons } from '@expo/vector-icons';
import { Asset } from 'expo-asset';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Image, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppFonts } from '@/constants/theme';

const backIcon = require('@/assets/icons/back icon.svg');
const buttonBackground = require('@/assets/images/button backgound.jpg');
const buttonBackgroundUri = Asset.fromModule(buttonBackground).uri;

const options = [
  {
    id: 'sleep',
    title: 'Sleep better',
    description: 'Fall asleep faster\nand stay asleep longer',
    iconBackground: '#070C13',
    icon: require('@/assets/icons/halcyon-help-icon-1.png'),
  },
  {
    id: 'stress',
    title: 'Reduce stress',
    description: 'Lower stress and\nfeel more at ease',
    iconBackground: '#1D261F',
    icon: require('@/assets/icons/halcyon-help-icon-2.png'),
  },
  {
    id: 'focus',
    title: 'Focus & productivity',
    description: 'Improve concentration\nand get more done',
    iconBackground: '#13222D',
    icon: require('@/assets/icons/science-icon-4.png'),
  },
  {
    id: 'relax',
    title: 'Relax & unwind',
    description: 'Disconnect and\ncalm your mind',
    iconBackground: '#3B2514',
    icon: require('@/assets/icons/halcyon-help-icon-3.png'),
  },
  {
    id: 'soundscapes',
    title: 'Expert soundscapes',
    description: 'Curated by experts,\nmade for you',
    iconBackground: '#261E2E',
    icon: require('@/assets/icons/halcyon-help-icon-4.png'),
  },
] as const;

type HelpId = (typeof options)[number]['id'];

const colors = {
  background: '#02060B',
  surface: '#0E0E0F',
  primary: '#F1E9DD',
  secondary: '#B8AFA4',
  gold: '#BB834F',
  border: '#3A3028',
  buttonText: '#12100E',
  checkBackground: '#835827',
};

export default function HalcyonHelpScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState<HelpId[]>(['sleep']);

  const toggleOption = (id: HelpId) => {
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
            <Text style={styles.heading}>What would you like Halcyon to help with?</Text>
            <Text style={styles.description}>Choose all that apply</Text>
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
                  <View style={[styles.optionIconCircle, { backgroundColor: option.iconBackground }]}>
                    <Image resizeMode="contain" source={option.icon} style={styles.optionIcon} />
                  </View>
                  <View style={styles.optionCopy}>
                    <Text style={styles.optionTitle}>{option.title}</Text>
                    <Text style={styles.optionDescription}>{option.description}</Text>
                  </View>
                  <View style={[styles.checkCircle, isSelected && styles.checkCircleSelected]}>
                    {isSelected && <Ionicons color={colors.primary} name="checkmark" size={18} />}
                  </View>
                </Pressable>
              );
            })}
          </View>

          <Pressable
            accessibilityRole="button"
            disabled={selected.length === 0}
            onPress={() => router.push('/feeling-lately')}
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
    flex: 1,
  },
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
  optionIconCircle: {
    alignItems: 'center',
    borderRadius: 999,
    height: 72,
    justifyContent: 'center',
    width: 72,
  },
  optionIcon: { height: 34, width: 34 },
  optionCopy: { flex: 1, marginLeft: 20 },
  optionTitle: {
    color: colors.primary,
    fontFamily: AppFonts.displayRegular,
    fontSize: 22,
    fontWeight: '500',
    lineHeight: 30,
  },
  optionDescription: {
    color: colors.secondary,
    fontFamily: AppFonts.sansRegular,
    fontSize: 14,
    lineHeight: 22,
    marginTop: 6,
  },
  checkCircle: {
    alignItems: 'center',
    borderColor: 'rgba(241, 233, 221, 0.3)',
    borderRadius: 999,
    borderWidth: 1,
    height: 32,
    justifyContent: 'center',
    marginLeft: 12,
    width: 32,
  },
  checkCircleSelected: {
    backgroundColor: colors.checkBackground,
    borderColor: colors.checkBackground,
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
