import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { OnboardingContinueButton } from '@/components/onboarding/OnboardingContinueButton';
import { OnboardingScaffold } from '@/components/onboarding/OnboardingScaffold';
import { HalcyonColors } from '@/constants/design';
import { AppFonts } from '@/constants/theme';
import { OnboardingContinueButtonBlack } from '@/components/onboarding/OnboardingcontinueButtonBlack';

const STEPS = [
  {
    description: 'Answer a few simple questions about your goals and preferences.',
    icon: 'person-outline',
    title: 'Tell us how you want to feel',
  },
  {
    description: 'Passage uses your answers to find soundscapes suited to the moment.',
    icon: 'pulse-outline',
    title: 'We match a soundscape',
  },
  {
    description: 'Find a comfortable space, press play and simply settle in.',
    icon: 'play-outline',
    title: 'Press play and settle in',
  },
] as const;

export default function HowItWorksScreen() {
  const router = useRouter();

  return (
    <OnboardingScaffold
      contentContainerStyle={styles.content}
      footer={
        <OnboardingContinueButtonBlack
          onPress={() => router.push('/environment')}
        />
      }
      onBack={() => router.back()}>
      <Text style={styles.heading}>The right sound, in three steps.</Text>

      <View style={styles.timeline}>
        {STEPS.map((step, index) => (
          <View key={step.title} style={styles.stepRow}>
            <View style={styles.markerColumn}>
              <View style={styles.iconCircle}>
                <Ionicons color={HalcyonColors.accent} name={step.icon} size={22} />
              </View>
              {index < STEPS.length - 1 ? <View style={styles.connector} /> : null}
            </View>

            <View style={styles.stepCopy}>
              <Text style={styles.stepTitle}>{step.title}</Text>
              <Text style={styles.stepDescription}>{step.description}</Text>
            </View>
          </View>
        ))}
      </View>
    </OnboardingScaffold>
  );
}

const styles = StyleSheet.create({
  connector: {
    backgroundColor: 'rgba(195,161,122,0.46)',
    flex: 1,
    marginVertical: 7,
    minHeight: 33,
    width: StyleSheet.hairlineWidth,
  },
  content: {
    paddingBottom: 18,
    paddingTop: 24,
  },
  heading: {
    color: HalcyonColors.textPrimary,
    fontFamily: AppFonts.displayRegular,
    fontSize: 38,
    fontWeight: '500',
    letterSpacing: -0.25,
    lineHeight: 43,
    textAlign: 'center',
  },
  iconCircle: {
    alignItems: 'center',
    backgroundColor: HalcyonColors.surface,
    borderColor: HalcyonColors.accent,
    borderRadius: 24,
    borderWidth: 1,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  markerColumn: {
    alignItems: 'center',
    width: 52,
  },
  stepCopy: {
    flex: 1,
    paddingBottom: 28,
    paddingLeft: 15,
    paddingTop: 2,
  },
  stepDescription: {
    color: HalcyonColors.textSecondary,
    fontFamily: AppFonts.sansRegular,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 7,
    maxWidth: 270,
  },
  stepRow: {
    flexDirection: 'row',
  },
  stepTitle: {
    color: HalcyonColors.textPrimary,
    fontFamily: AppFonts.sansSemiBold,
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 21,
  },
  timeline: {
    marginTop: 34,
  },
});
