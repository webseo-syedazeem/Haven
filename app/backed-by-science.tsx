import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { OnboardingContinueButton } from '@/components/onboarding/OnboardingContinueButton';
import { OnboardingScaffold } from '@/components/onboarding/OnboardingScaffold';
import { HalcyonColors } from '@/constants/design';
import { AppFonts } from '@/constants/theme';
import { OnboardingContinueButtonBlack } from '@/components/onboarding/OnboardingcontinueButtonBlack';


export default function BackedByScienceScreen() {
  const router = useRouter();

  return (
    <OnboardingScaffold
    
      contentContainerStyle={styles.content}
      footer={
        <OnboardingContinueButtonBlack onPress={() => router.push('/passage-help')} />
      }
      onBack={() => router.back()}
      scroll={false}>
      <View style={styles.copyBlock}>
        <View style={styles.ornament}>
          <View style={styles.ornamentLine} />
          <View style={styles.ornamentDot} />
          <View style={styles.ornamentLine} />
        </View>

        <Text style={styles.heading}>Sound, backed{`\n`}by intention</Text>
        <Text style={styles.description}>
          Our soundscapes are designed with care, using research, nature and sound principles to
          support your wellbeing — not to promise instant results.
        </Text>
      </View>
    </OnboardingScaffold>
  );
}

const styles = StyleSheet.create({
  content: {
    justifyContent: 'center',
    paddingBottom: 40,
  },
  copyBlock: {
    alignItems: 'center',
    marginTop: -22,
  },
  description: {
    color: HalcyonColors.textPrimary,
    fontFamily: AppFonts.sansRegular,
    fontSize: 15,
    lineHeight: 24,
    marginTop: 22,
    maxWidth: 320,
    textAlign: 'center',
  },
  heading: {
    color: HalcyonColors.textPrimary,
    fontFamily: AppFonts.displayRegular,
    fontSize: 40,
    fontWeight: '500',
    letterSpacing: -0.3,
    lineHeight: 40,
    marginTop: 20,
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
