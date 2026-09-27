import type { Href } from 'expo-router';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { OnboardingContinueButton } from '@/components/onboarding/OnboardingContinueButton';
import { OnboardingScaffold } from '@/components/onboarding/OnboardingScaffold';
import type { ModeId } from '@/constants/modes';
import { RELAX_ONBOARDING } from '@/constants/relax-onboarding';
import { AppFonts } from '@/constants/theme';
import { getOnboardingAnswers } from '@/lib/onboarding';

type RitualCopy = {
  heading: string;
  steps: readonly [string, string, string];
  body: string;
  caption: string;
};

const RITUAL_COPY: Record<ModeId, RitualCopy> = {
  sleep: {
    heading: 'A cue to let go.',
    steps: ['Press play', 'Lights low', 'Rest'],
    body: 'Repeating the same wind-down ritual can make bedtime feel more familiar.',
    caption: 'Designed to support sleep, not force it.',
  },
  focus: {
    heading: 'A cue to begin.',
    steps: ['Press play', 'Settle in', 'Focus'],
    body: 'Repeating the same sound ritual can make starting feel easier.',
    caption: 'Designed to support focus, not force it.',
  },
  relax: {
    heading: 'A moment to breathe.',
    steps: ['Press play', 'Settle in', 'Relax'],
    body: 'The same simple ritual can help you feel calmer, anytime you need it.',
    caption: 'Designed to support a calmer mind, not replace professional care.',
  },
};

export default function TheRitualScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<ModeId | null>(null);

  useEffect(() => {
    let active = true;
    void getOnboardingAnswers().then((answers) => {
      if (!active) return;
      if (!answers.startingMode) {
        router.replace('/select-focus');
        return;
      }
      setMode(answers.startingMode);
    });
    return () => {
      active = false;
    };
  }, [router]);

  const copy = mode ? RITUAL_COPY[mode] : null;

  const isSleep = mode === 'sleep';
  const themeColor = isSleep ? '#9FAEFD' : AMBER;

  return (
    <OnboardingScaffold
      contentContainerStyle={styles.content}
      onBack={() => router.back()}
      scroll={false}>
      <View style={styles.topSection}>
        <Text adjustsFontSizeToFit numberOfLines={1} style={styles.heading}>
          {copy?.heading ?? ' '}
        </Text>

        {copy ? (
          <Text style={[styles.stepLine, { color: themeColor }]}>
            {copy.steps.join(' \u2014 ')}
          </Text>
        ) : null}

        <Text style={styles.body}>{copy?.body ?? ''}</Text>
      </View>

      <View style={styles.footerContainer}>
        <Text style={styles.caption}>{copy?.caption ?? ''}</Text>
        <OnboardingContinueButton
          disabled={!copy}
          label="Continue"
          onPress={() => router.push('/onboarding/your-fit' as Href)}
          showArrow
          variant={isSleep ? 'lavender' : 'amber'}
        />
      </View>
    </OnboardingScaffold>
  );
}

const AMBER = '#F4B34C';

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
  caption: {
    color: 'rgba(255,255,255,0.64)',
    fontFamily: AppFonts.sansRegular,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 16,
    maxWidth: 330,
    textAlign: 'center',
  },
  content: {
    paddingBottom: RELAX_ONBOARDING.content.paddingBottom,
    paddingHorizontal: RELAX_ONBOARDING.screenPaddingHorizontal,
    paddingTop: RELAX_ONBOARDING.content.paddingTop,
  },
  footerContainer: {
    alignItems: 'center',
    width: '100%',
  },
  heading: {
    color: '#FFFFFF',
    fontFamily: AppFonts.playfairRegular,
    fontSize: 44,
    fontWeight: '600',
    letterSpacing: -0.8,
    lineHeight: 50,
    textAlign: 'center',
    width: '100%',
  },
  stepLine: {
    color: AMBER,
    fontFamily: AppFonts.sansMedium,
    fontSize: 17,
    lineHeight: 25,
    marginTop: 32,
    textAlign: 'center',
  },
  topSection: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingBottom: 20,
  },
});
