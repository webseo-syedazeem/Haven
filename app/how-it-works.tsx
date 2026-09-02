import { Asset } from 'expo-asset';
import { useRouter } from 'expo-router';
import { Image, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppFonts } from '@/constants/theme';

const backIcon = require('@/assets/icons/back icon.svg');
const background = require('@/assets/images/how-it-works-background.webp');
const buttonBackground = require('@/assets/images/button backgound.jpg');
const backgroundUri = Asset.fromModule(background).uri;
const buttonBackgroundUri = Asset.fromModule(buttonBackground).uri;

const steps = [
  {
    number: '1',
    title: 'Tell us what you need',
    description: 'Share your sleep, relax, and focus preferences so Passage can understand what fits the moment.',
  },
  {
    number: '2',
    title: 'Find your exact environment',
    description: 'Passage matches your preferences with complete, precisely labelled soundscapes.',
  },
  {
    number: '3',
    title: 'Press play and let go',
    description: 'Start listening instantly and return to your saved environments anytime.',
  },
];

const colors = {
  background: '#050505',
  surface: '#0E0E0F',
  primary: '#F1E9DD',
  secondary: '#B8AFA4',
  gold: '#BB834F',
  border: '#3A3028',
  buttonText: '#12100E',
};

export default function HowItWorksScreen() {
  const router = useRouter();

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

          <Text style={styles.heading}>How Passage works</Text>

          <View style={styles.timeline}>
            {steps.map((step, index) => (
              <View key={step.number} style={styles.stepRow}>
                <View style={styles.markerColumn}>
                  <View style={styles.numberCircle}>
                    {index > 0 ? <View style={[styles.circleDot, styles.circleDotTop]} /> : null}
                    <Text style={[styles.number, index === 2 ? styles.numberThree : styles.numberOneTwo]}>
                      {step.number}
                    </Text>
                    {index < steps.length - 1 ? <View style={[styles.circleDot, styles.circleDotBottom]} /> : null}
                  </View>
                  {index < steps.length - 1 ? <View style={styles.connector} /> : null}
                </View>
                <View style={styles.stepCopy}>
                  <Text style={styles.stepTitle}>{step.title}</Text>
                  <Text style={styles.stepDescription}>{step.description}</Text>
                </View>
              </View>
            ))}
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/trusted')}
            style={({ pressed }) => [styles.continueButton, pressed && styles.pressed]}>
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
  heading: {
    color: colors.primary,
    fontFamily: AppFonts.displayRegular,
    fontSize: 35,
    fontWeight: '500',
    lineHeight: 42,
  },
  timeline: { marginTop: 48 },
  stepRow: { flexDirection: 'row', minHeight: 180 },
  markerColumn: { alignItems: 'center', width: 64 },
  numberCircle: {
    alignItems: 'center',
    backgroundColor: 'rgba(14, 14, 15, 0.75)',
    borderColor: '#D39C69',
    borderRadius: 999,
    borderWidth: 1.5,
    height: 58,
    justifyContent: 'center',
    shadowColor: '#D39C69',
    shadowOffset: { height: 0, width: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    width: 58,
    zIndex: 1,
  },
  number: {
    color: colors.primary,
    fontFamily: AppFonts.displayRegular,
    fontSize: 35,
    lineHeight: 40,
  },
  numberOneTwo: { marginTop: -8 },
  numberThree: { marginTop: -15 },
  circleDot: {
    backgroundColor: '#D39C69',
    borderRadius: 4,
    height: 8,
    left: '50%',
    position: 'absolute',
    shadowColor: colors.gold,
    shadowOffset: { height: 0, width: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 5,
    transform: [{ translateX: -3.2 }],
    width: 8,
    zIndex: 2,
  },
  circleDotTop: { top: -5 },
  circleDotBottom: { bottom: -5 },
  connector: { backgroundColor: colors.gold, flex: 1, opacity: 0.8, width: 1 },
  stepCopy: { flex: 1, paddingBottom: 32, paddingLeft: 20, paddingTop: 4 },
  stepTitle: {
    color: colors.primary,
    fontFamily: AppFonts.displayRegular,
    fontSize: 25,
    fontWeight: '500',
    lineHeight: 30,
  },
  stepDescription: {
    color: colors.secondary,
    fontFamily: AppFonts.sansRegular,
    fontSize: 14,
    lineHeight: 23,
    marginTop: 12,
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
    marginTop: 8,
    overflow: 'hidden',
    paddingVertical: 20,
  } as any,
  continueText: {
    color: colors.buttonText,
    fontFamily: AppFonts.sansMedium,
    fontSize: 15,
    fontWeight: '500',
  },
  pressed: { opacity: 0.88 },
});
