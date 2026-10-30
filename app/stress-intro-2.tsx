import type { Href } from 'expo-router';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { RelaxContinueButton } from '@/components/onboarding/RelaxContinueButton';
import { OnboardingScaffold } from '@/components/onboarding/OnboardingScaffold';
import { RelaxStepHeader } from '@/components/onboarding/RelaxStepHeader';
import { RELAX_ONBOARDING } from '@/constants/relax-onboarding';
import { AppFonts } from '@/constants/theme';
import { safeGoBack } from '@/lib/navigation';

const background = require('@/assets/images/relax-intro-2-bg-realistic.webp');

const BENEFITS = [
  { icon: 'waves', label: 'Make space to unwind' },
  { icon: 'crystal', label: 'Settle in, at your own pace' },
  { icon: 'heart', label: 'A gentler listening routine' },
] as const;

type BenefitIconName = (typeof BENEFITS)[number]['icon'];

function BenefitIcon({ name }: { name: BenefitIconName }) {
  if (name === 'waves') {
    return (
      <Svg height={34} viewBox="0 0 44 40" width={38}>
        <Path
          d="M3 9c4-4 8-4 12 0s8 4 12 0 8-4 14 0M3 20c4-4 8-4 12 0s8 4 12 0 8-4 14 0M3 31c4-4 8-4 12 0s8 4 12 0 8-4 14 0"
          fill="none"
          stroke="#FFFFFF"
          strokeLinecap="round"
          strokeWidth={2.4}
        />
      </Svg>
    );
  }

  if (name === 'crystal') {
    return (
      <Svg height={38} viewBox="0 0 48 48" width={38}>
        <Path
          d="M24 4 33 20l-4 19H19l-4-19 9-16ZM15 15 5 20l2 16 12 3-4-19Zm18 1 10 5-3 15-11 3 4-19ZM12 42h24"
          fill="none"
          stroke="#FFFFFF"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2.2}
        />
      </Svg>
    );
  }

  return (
    <Svg height={38} viewBox="0 0 48 48" width={38}>
      <Path
        d="M24 42S6 31 6 17c0-6.5 4.5-11 10.5-11 4 0 6.5 2.1 7.5 5 1-2.9 3.5-5 7.5-5C37.5 6 42 10.5 42 17c0 14-18 25-18 25Z"
        fill="none"
        stroke="#FFFFFF"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2.2}
      />
    </Svg>
  );
}

export default function StressIntroTwoScreen() {
  const router = useRouter();

  return (
    <OnboardingScaffold
      backgroundImage={background}
      contentContainerStyle={styles.content}
      header={<RelaxStepHeader currentStep={2} onBack={() => safeGoBack(router)} />}
      scroll={false}>
      <View style={styles.copyBlock}>
        <Text style={styles.heading}>It&apos;s more than{'\n'}just sound.</Text>
        <Text style={styles.body}>
          Our soundscapes are designed to provide a steady background for quiet
          moments and help you feel more present.
        </Text>
      </View>

      <View style={styles.benefits}>
        {BENEFITS.map((benefit) => (
          <View key={benefit.label} style={styles.benefitRow}>
            <View style={styles.iconCircle}>
              <BenefitIcon name={benefit.icon} />
            </View>
            <Text style={styles.benefitLabel}>{benefit.label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.buttonWrap}>
        <RelaxContinueButton
          label="Next"
          onPress={() => router.push('/onboarding/relax-science' as Href)}
        />
      </View>
    </OnboardingScaffold>
  );
}

const styles = StyleSheet.create({
  benefitLabel: {
    color: '#FFFFFF',
    flex: 1,
    fontFamily: AppFonts.sansMedium,
    fontSize: 18,
    lineHeight: 25,
    marginLeft: 20,
  },
  benefitRow: {
    alignItems: 'center',
    flexDirection: 'row',
    minHeight: 66,
    width: 286,
  },
  benefits: {
    alignItems: 'center',
    gap: 14,
    marginTop: RELAX_ONBOARDING.gaps.bodyToContent,
    width: '100%',
  },
  body: {
    color: '#FFFFFF',
    fontFamily: AppFonts.sansRegular,
    fontSize: RELAX_ONBOARDING.body.fontSize,
    lineHeight: RELAX_ONBOARDING.body.lineHeight,
    marginTop: RELAX_ONBOARDING.gaps.headingToBody,
    maxWidth: 345,
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
    width: '100%',
  },
  heading: {
    color: '#FFFFFF',
    fontFamily: AppFonts.playfairRegular,
    fontSize: RELAX_ONBOARDING.heading.fontSize,
    fontWeight: '600',
    letterSpacing: RELAX_ONBOARDING.heading.letterSpacing,
    lineHeight: RELAX_ONBOARDING.heading.lineHeight,
    maxWidth: 350,
    textAlign: 'center',
  },
  iconCircle: {
    alignItems: 'center',
    borderColor: 'rgba(255,255,255,0.32)',
    borderRadius: 33,
    borderWidth: 1,
    height: 66,
    justifyContent: 'center',
    width: 66,
  },
});
