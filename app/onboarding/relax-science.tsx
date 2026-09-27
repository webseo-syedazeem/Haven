import type { Href } from 'expo-router';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { RelaxContinueButton } from '@/components/onboarding/RelaxContinueButton';
import { OnboardingScaffold } from '@/components/onboarding/OnboardingScaffold';
import { RelaxStepHeader } from '@/components/onboarding/RelaxStepHeader';
import { RELAX_ONBOARDING } from '@/constants/relax-onboarding';
import { AppFonts } from '@/constants/theme';

const background = require('@/assets/images/relax-science-bg.webp');

const FINDINGS = [
  {
    icon: 'brain',
    label: 'Binaural rhythms support relaxation',
  },
  {
    icon: 'soundwave',
    label: 'Nature soundscapes lower stress levels',
  },
  {
    icon: 'heart',
    label: 'Shown to reduce anxiety in research reviews',
  },
] as const;

type ScienceIconName = (typeof FINDINGS)[number]['icon'];

function ScienceIcon({ name }: { name: ScienceIconName }) {
  if (name === 'brain') {
    return (
      <Svg height={38} viewBox="0 0 48 48" width={38}>
        <Path
          d="M24 10c-1.6-3-6.4-4.6-9-2.4-4.5-.9-7.7 3.3-6.9 7.7-3.4 1.4-4.8 5.6-2.5 8.7-1.3 3.6 1.2 7.5 5 8.1.1 4.5 4.2 7.2 8.3 5.8 1.5 1.8 3.2 2.6 5.1 2.7V10Zm0 0c1.6-3 6.4-4.6 9-2.4 4.5-.9 7.7 3.3 6.9 7.7 3.4 1.4 4.8 5.6 2.5 8.7 1.3 3.6-1.2 7.5-5 8.1-.1 4.5-4.2 7.2-8.3 5.8-1.5 1.8-3.2 2.6-5.1 2.7"
          fill="none"
          stroke="#FFFFFF"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
        />
        <Path
          d="M15 14c4 0 6 2.4 6 5.5M12.5 24.5c3-2 6.5-1.2 8.5 1.5M16.5 34.5c1-2.8 3.5-4.3 7.5-4.3M33 14c-4 0-6 2.4-6 5.5m8.5 5c-3-2-6.5-1.2-8.5 1.5m4.5 8.5c-1-2.8-3.5-4.3-7.5-4.3"
          fill="none"
          stroke="#FFFFFF"
          strokeLinecap="round"
          strokeWidth={1.8}
        />
      </Svg>
    );
  }

  if (name === 'soundwave') {
    return (
      <Svg height={38} viewBox="0 0 48 48" width={38}>
        <Path
          d="M5 24h1m5-7v14m6-20v26m7-32v38m7-31v24m6-17v10m5-5h1"
          fill="none"
          stroke="#FFFFFF"
          strokeLinecap="round"
          strokeWidth={3}
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

export default function RelaxScienceScreen() {
  const router = useRouter();

  return (
    <OnboardingScaffold
      backgroundImage={background}
      contentContainerStyle={styles.content}
      header={<RelaxStepHeader currentStep={3} onBack={() => router.back()} />}>
      <View style={styles.copyBlock}>
        <Text style={styles.heading}>Backed by{'\n'}real science.</Text>
        <Text style={styles.body}>
          Our soundscapes use proven auditory techniques to help activate your
          parasympathetic nervous system{' \u2014 '}your body&apos;s natural calm mode.
        </Text>
      </View>

      <View style={styles.findings}>
        {FINDINGS.map((finding, index) => (
          <View key={finding.label} style={styles.findingGroup}>
            <View style={styles.findingRow}>
              <View style={styles.iconCircle}>
                <ScienceIcon name={finding.icon} />
              </View>
              <Text style={styles.findingText}>{finding.label}</Text>
            </View>
            {index < FINDINGS.length - 1 ? <View style={styles.divider} /> : null}
          </View>
        ))}
      </View>

      <Text style={styles.disclaimer}>
        {/* {'Passage supports wellbeing\u003B it is not a substitute for professional care.'} */}
      </Text>
      <View style={styles.buttonWrap}>
        <RelaxContinueButton
          label="Next"
          onPress={() => router.push('/onboarding/relax-main-goal' as Href)}
        />
      </View>
    </OnboardingScaffold>
  );
}

const styles = StyleSheet.create({
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
    marginTop: RELAX_ONBOARDING.button.contentGap,
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
  disclaimer: {
    color: 'rgba(255,255,255,0.48)',
    fontFamily: AppFonts.sansRegular,
    fontSize: 10,
    lineHeight: 14,
    marginTop: 'auto',
    maxWidth: 330,
    paddingTop: 12,
    textAlign: 'center',
  },
  divider: {
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(255,255,255,0.15)',
    height: StyleSheet.hairlineWidth,
    width: 214,
  },
  findingGroup: {
    width: 300,
  },
  findingText: {
    color: '#FFFFFF',
    flex: 1,
    fontFamily: AppFonts.sansMedium,
    fontSize: 18,
    lineHeight: 25,
    marginLeft: 20,
  },
  findingRow: {
    alignItems: 'center',
    flexDirection: 'row',
    minHeight: 70,
  },
  findings: {
    alignItems: 'center',
    marginTop: RELAX_ONBOARDING.gaps.bodyToContent,
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
