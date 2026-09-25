import type { Href } from 'expo-router';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { OnboardingContinueButton } from '@/components/onboarding/OnboardingContinueButton';
import { OnboardingScaffold } from '@/components/onboarding/OnboardingScaffold';
import { HalcyonColors } from '@/constants/design';
import type { ModeId } from '@/constants/modes';
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
        router.replace('/environment');
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
      footer={
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
      }
      scroll={false}>
      <View style={styles.topSection}>
        <Text style={styles.heading}>{copy?.heading ?? ' '}</Text>

        {copy ? (
          <View style={styles.stepsRow}>
            {copy.steps.map((step, index) => (
              <View key={step} style={styles.stepItem}>
                <Text style={[styles.stepLabel, { color: themeColor }]}>{step}</Text>
                {index < copy.steps.length - 1 ? (
                  <View style={[styles.stepDash, { backgroundColor: themeColor }]} />
                ) : null}
              </View>
            ))}
          </View>
        ) : null}

        <Text style={styles.body}>{copy?.body ?? ''}</Text>
      </View>
    </OnboardingScaffold>
  );
}

const AMBER = '#F4B34C';

const styles = StyleSheet.create({
  body: {
    color: '#ECECEC',
    fontFamily: AppFonts.sansRegular,
    fontSize: 16,
    lineHeight: 25,
    marginTop: 36,
    maxWidth: 310,
    textAlign: 'center',
  },
  caption: {
    color: '#8A8A8E',
    fontFamily: AppFonts.sansRegular,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 18,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 22,
    paddingTop: 48,
  },
  footerContainer: {
    alignItems: 'center',
    width: '100%',
  },
  heading: {
    color: '#FFFFFF',
    fontFamily: AppFonts.playfairRegular,
    fontSize: 42,
    fontWeight: '400',
    letterSpacing: -0.5,
    lineHeight: 48,
    textAlign: 'center',
    width: '100%',
  },
  stepDash: {
    backgroundColor: AMBER,
    height: 1.5,
    marginHorizontal: 10,
    marginTop: 3,
    width: 26,
  },
  stepItem: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  stepLabel: {
    color: AMBER,
    fontFamily: AppFonts.sansMedium,
    fontSize: 15,
    letterSpacing: 0.2,
  },
  stepsRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 34,
  },
  topSection: {
    alignItems: 'center',
    width: '100%',
  },
});
