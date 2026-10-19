import type { Href } from 'expo-router';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { RelaxContinueButton } from '@/components/onboarding/RelaxContinueButton';
import { OnboardingScaffold } from '@/components/onboarding/OnboardingScaffold';
import { RelaxStepHeader } from '@/components/onboarding/RelaxStepHeader';
import { RELAX_ONBOARDING } from '@/constants/relax-onboarding';
import { AppFonts } from '@/constants/theme';
import { safeGoBack } from '@/lib/navigation';

const background = require('@/assets/images/relax-intro-1-bg-realistic.webp');

export default function StressIntroOneScreen() {
  const router = useRouter();

  return (
    <OnboardingScaffold
      backgroundImage={background}
      contentContainerStyle={styles.content}
      header={<RelaxStepHeader currentStep={1} onBack={() => safeGoBack(router)} />}
      scroll={false}>
      <View style={styles.copyBlock}>
        <Text style={styles.eyebrow}>REDUCE STRESS</Text>
        <Text style={styles.heading}>
          Quieter{'\n'}thoughts.{'\n'}Brighter days.
        </Text>
        <Text style={styles.body}>
          Calming soundscapes to help you release tension, slow down and feel
          more in control.
        </Text>
      </View>
      <View style={styles.buttonWrap}>
        <RelaxContinueButton
          label="Next"
          onPress={() => router.push('/stress-intro-2' as Href)}
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
    marginTop: 28,
    maxWidth: 330,
    textAlign: 'center',
  },
  buttonWrap: {
    marginTop: 'auto',
    paddingTop: RELAX_ONBOARDING.button.contentGap,
    width: '100%',
  },
  content: {
    justifyContent: 'flex-start',
    paddingBottom: RELAX_ONBOARDING.content.paddingBottom,
    paddingHorizontal: RELAX_ONBOARDING.screenPaddingHorizontal,
    paddingTop: RELAX_ONBOARDING.content.paddingTop,
  },
  copyBlock: {
    alignItems: 'center',
    paddingTop: 16,
  },
  eyebrow: {
    color: '#FFFFFF',
    fontFamily: AppFonts.sansSemiBold,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 3.2,
    textTransform: 'uppercase',
  },
  heading: {
    color: '#FFFFFF',
    fontFamily: AppFonts.playfairRegular,
    fontSize: 44,
    fontWeight: '600',
    letterSpacing: -0.8,
    lineHeight: 50,
    marginTop: 16,
    maxWidth: 360,
    textAlign: 'center',
  },
});
