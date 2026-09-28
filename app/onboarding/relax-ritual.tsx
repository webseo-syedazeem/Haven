import type { Href } from 'expo-router';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { RelaxContinueButton } from '@/components/onboarding/RelaxContinueButton';
import { OnboardingScaffold } from '@/components/onboarding/OnboardingScaffold';
import { RelaxStepHeader } from '@/components/onboarding/RelaxStepHeader';
import { RELAX_ONBOARDING } from '@/constants/relax-onboarding';
import { AppFonts } from '@/constants/theme';
import { safeGoBack } from '@/lib/navigation';

const background = require('@/assets/images/relax-ritual-bg.webp');

export default function RelaxRitualScreen() {
  const router = useRouter();

  return (
    <OnboardingScaffold
      backgroundImage={background}
      contentContainerStyle={styles.content}
      header={<RelaxStepHeader currentStep={7} onBack={() => safeGoBack(router)} />}
      scroll={false}>
      <View style={styles.copy}>
        <Text style={styles.heading}>A moment{'\n'}to breathe.</Text>
        <Text style={styles.stepLine}>
          Press play{' \u2014 '}Settle in{' \u2014 '}Relax
        </Text>
        <Text style={styles.body}>
          The same simple ritual can help you feel calmer, anytime you need it.
        </Text>
      </View>

      <View style={styles.bottomArea}>
        <Text style={styles.disclaimer}>
          Designed to support a calmer mind, not replace professional care.
        </Text>
        <RelaxContinueButton
          label="Continue"
          onPress={() => router.push('/onboarding/relax-your-fit' as Href)}
        />
      </View>
    </OnboardingScaffold>
  );
}

const styles = StyleSheet.create({
  body: {
    color: '#FFFFFF',
    fontFamily: AppFonts.sansMedium,
    fontSize: 18,
    lineHeight: 27,
    marginTop: 36,
    maxWidth: 310,
    textAlign: 'center',
  },
  bottomArea: {
    alignItems: 'center',
    width: '100%',
  },
  content: {
    paddingBottom: RELAX_ONBOARDING.content.paddingBottom,
    paddingHorizontal: RELAX_ONBOARDING.screenPaddingHorizontal,
    paddingTop: RELAX_ONBOARDING.content.paddingTop,
  },
  copy: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingBottom: 20,
  },
  disclaimer: {
    color: 'rgba(255,255,255,0.64)',
    fontFamily: AppFonts.sansRegular,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 16,
    maxWidth: 330,
    textAlign: 'center',
  },
  heading: {
    color: '#FFFFFF',
    fontFamily: AppFonts.playfairRegular,
    fontSize: 44,
    fontWeight: '600',
    letterSpacing: -0.8,
    lineHeight: 50,
    textAlign: 'center',
  },
  stepLine: {
    color: '#FFFFFF',
    fontFamily: AppFonts.sansMedium,
    fontSize: 17,
    lineHeight: 25,
    marginTop: 32,
    textAlign: 'center',
  },
});
