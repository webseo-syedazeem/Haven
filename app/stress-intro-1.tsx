import { useRouter } from 'expo-router';
import type { Href } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { OnboardingContinueButton } from '@/components/onboarding/OnboardingContinueButton';
import { OnboardingScaffold } from '@/components/onboarding/OnboardingScaffold';
import { HalcyonColors } from '@/constants/design';
import { AppFonts } from '@/constants/theme';

export default function StressIntroOneScreen() {
  const router = useRouter();

  return (
    <OnboardingScaffold
      contentContainerStyle={styles.content}
      footer={
        <OnboardingContinueButton
          onPress={() => router.push('/stress-intro-2' as Href)}
          showArrow
        />
      }
      onBack={() => router.back()}
      scroll={false}>
      <View style={styles.copyBlock}>
        <View style={styles.ornament}>
          <View style={styles.ornamentLine} />
          <View style={styles.ornamentDot} />
          <View style={styles.ornamentLine} />
        </View>

        <Text style={styles.eyebrow}>Reduce stress</Text>
        <Text style={styles.heading}>Quieter thoughts.{'\n'}Brighter days.</Text>
        <Text style={styles.body}>
          Calming soundscapes to help you release tension, slow down and feel more in control.
        </Text>
      </View>
    </OnboardingScaffold>
  );
}

const styles = StyleSheet.create({
  body: {
    color: HalcyonColors.textPrimary,
    fontFamily: AppFonts.sansRegular,
    fontSize: 15,
    lineHeight: 24,
    marginTop: 22,
    maxWidth: 320,
    textAlign: 'center',
  },
  content: {
    justifyContent: 'center',
    paddingBottom: 40,
  },
  copyBlock: {
    alignItems: 'center',
    marginTop: -22,
  },
  eyebrow: {
    color: HalcyonColors.accent,
    fontFamily: AppFonts.sansSemiBold,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.6,
    marginTop: 22,
    textTransform: 'uppercase',
  },
  heading: {
    color: HalcyonColors.textPrimary,
    fontFamily: AppFonts.displayRegular,
    fontSize: 38,
    fontWeight: '500',
    letterSpacing: -0.3,
    lineHeight: 44,
    marginTop: 14,
    textAlign: 'center',
  },
  ornament: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  ornamentDot: {
    backgroundColor: HalcyonColors.accent,
    borderRadius: 3,
    height: 5,
    marginHorizontal: 8,
    width: 5,
  },
  ornamentLine: {
    backgroundColor: 'rgba(195,161,122,0.54)',
    height: StyleSheet.hairlineWidth,
    width: 30,
  },
});
