import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import type { Href } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { OnboardingContinueButton } from '@/components/onboarding/OnboardingContinueButton';
import { OnboardingScaffold } from '@/components/onboarding/OnboardingScaffold';
import { HalcyonColors } from '@/constants/design';
import { AppFonts } from '@/constants/theme';

const BENEFITS = [
  { icon: 'pulse-outline', label: 'Reduce stress and anxiety' },
  { icon: 'time-outline', label: 'Feel calmer in minutes' },
  { icon: 'heart-outline', label: 'A more balanced you' },
] as const;

export default function StressIntroTwoScreen() {
  const router = useRouter();

  return (
    <OnboardingScaffold
      contentContainerStyle={styles.content}
      footer={
        <OnboardingContinueButton
          onPress={() => router.push('/passage-help' as Href)}
          showArrow
        />
      }
      onBack={() => router.back()}>
      <Text style={styles.heading}>It’s more than just sound.</Text>
      <Text style={styles.body}>
        Our soundscapes are designed to calm your nervous system, quiet mental noise and help you
        feel more present.
      </Text>

      <View style={styles.benefits}>
        {BENEFITS.map((benefit) => (
          <View key={benefit.label} style={styles.benefitRow}>
            <View style={styles.iconCircle}>
              <Ionicons color={HalcyonColors.accent} name={benefit.icon} size={18} />
            </View>
            <Text style={styles.benefitLabel}>{benefit.label}</Text>
          </View>
        ))}
      </View>
    </OnboardingScaffold>
  );
}

const styles = StyleSheet.create({
  benefitLabel: {
    color: HalcyonColors.textPrimary,
    fontFamily: AppFonts.sansMedium,
    fontSize: 15,
    lineHeight: 20,
    marginLeft: 14,
  },
  benefitRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: 18,
  },
  benefits: {
    marginTop: 30,
  },
  body: {
    color: HalcyonColors.textSecondary,
    fontFamily: AppFonts.sansRegular,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 12,
  },
  content: {
    paddingBottom: 18,
    paddingTop: 24,
  },
  heading: {
    color: HalcyonColors.textPrimary,
    fontFamily: AppFonts.displayRegular,
    fontSize: 34,
    fontWeight: '500',
    letterSpacing: -0.3,
    lineHeight: 40,
  },
  iconCircle: {
    alignItems: 'center',
    backgroundColor: HalcyonColors.surface,
    borderColor: HalcyonColors.accent,
    borderRadius: 22,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
});
