import type { Href } from 'expo-router';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

import { OnboardingContinueButton } from '@/components/onboarding/OnboardingContinueButton';
import { OnboardingScaffold } from '@/components/onboarding/OnboardingScaffold';
import { HalcyonColors, HalcyonRadius } from '@/constants/design';
import { getTypicalDurationLabel } from '@/constants/filters';
import type { ModeId } from '@/constants/modes';
import { AppFonts } from '@/constants/theme';
import { getOnboardingAnswers, type GuestOnboardingAnswers } from '@/lib/onboarding';

const fitBanner = require('@/assets/images/your-fit-banner.jpg');

type FitQuote = {
  quote: string;
  attribution: string;
};

const FIT_HEADING: Record<ModeId, string> = {
  sleep: 'Built around how you rest.',
  focus: 'Built around how you work.',
  relax: 'Built around how you feel.',
};

const FIT_QUOTE: Record<ModeId, FitQuote> = {
  sleep: {
    quote: 'The room fades away before I notice I’m drifting.',
    attribution: 'Alex, writer',
  },
  focus: {
    quote: 'Within minutes, I stop noticing the room.',
    attribution: 'Alex, writer',
  },
  relax: {
    quote: 'Passage helps me switch off and stop overthinking.',
    attribution: 'Alex, teacher',
  },
};

const DEFAULT_SETTING: Record<ModeId, string> = {
  focus: 'At a desk',
  sleep: 'In bed',
  relax: 'At home',
};

const DEFAULT_CHALLENGE: Record<ModeId, string> = {
  focus: 'Noise + racing thoughts',
  sleep: 'Racing mind',
  relax: 'Overthinking & tension',
};

function buildFitRows(answers: GuestOnboardingAnswers, mode: ModeId) {
  const settingValue =
    answers.environments.length > 0
      ? answers.environments.join(', ')
      : DEFAULT_SETTING[mode] || 'At a desk';

  const challengeValue =
    answers.situation.length > 0
      ? answers.situation.join(' + ')
      : DEFAULT_CHALLENGE[mode] || 'Noise + racing thoughts';

  const rhythmValue =
    answers.sessionLength
      ? getTypicalDurationLabel(answers.sessionLength)
      : '45 minutes';

  return [
    { label: 'Your setting', value: settingValue },
    { label: 'Your challenge', value: challengeValue },
    { label: 'Your rhythm', value: rhythmValue },
  ];
}

export default function YourFitScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<ModeId | null>(null);
  const [rows, setRows] = useState<{ label: string; value: string }[]>([]);

  useEffect(() => {
    let active = true;
    void getOnboardingAnswers().then((answers) => {
      if (!active) return;
      const currentMode = answers.startingMode || 'focus';
      setMode(currentMode);
      setRows(buildFitRows(answers, currentMode));
    });
    return () => {
      active = false;
    };
  }, [router]);

  const quote = mode ? FIT_QUOTE[mode] : FIT_QUOTE.focus;

  return (
    <OnboardingScaffold
      contentContainerStyle={styles.content}
      footer={
        <OnboardingContinueButton
          disabled={!mode}
          label="Preview my passages"
          onPress={() => router.push('/onboarding/trust' as Href)}
          showArrow
        />
      }>
      <Text style={styles.heading}>{mode ? FIT_HEADING[mode] : 'Built around how you work.'}</Text>

      <View style={styles.bannerContainer}>
        <Image source={fitBanner} style={styles.bannerImage} />
      </View>

      <View style={styles.summary}>
        {rows.map((row, index) => (
          <View
            key={row.label}
            style={[styles.summaryRow, index === rows.length - 1 && styles.summaryRowLast]}>
            <Text style={styles.summaryLabel}>{row.label}</Text>
            <Text numberOfLines={1} style={styles.summaryValue}>
              {row.value}
            </Text>
          </View>
        ))}
      </View>

      {quote ? (
        <View style={styles.quoteCard}>
          <Text style={styles.quoteText}>“{quote.quote}”</Text>
          <Text style={styles.quoteAttribution}>— {quote.attribution}</Text>
        </View>
      ) : null}
    </OnboardingScaffold>
  );
}

const styles = StyleSheet.create({
  bannerContainer: {
    borderColor: '#242428',
    borderRadius: 16,
    borderWidth: 1,
    height: 136,
    marginTop: 18,
    overflow: 'hidden',
    width: '100%',
  },
  bannerImage: {
    height: '100%',
    resizeMode: 'cover',
    width: '100%',
  },
  content: {
    paddingBottom: 24,
    paddingTop: 16,
  },
  heading: {
    color: '#FFFFFF',
    fontFamily: AppFonts.playfairRegular,
    fontSize: 34,
    fontWeight: '400',
    letterSpacing: -0.3,
    lineHeight: 42,
    textAlign: 'left',
  },
  quoteAttribution: {
    color: '#8A8A8E',
    fontFamily: AppFonts.sansRegular,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 8,
  },
  quoteCard: {
    backgroundColor: '#121215',
    borderColor: '#242428',
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 22,
    padding: 18,
  },
  quoteText: {
    color: '#F4F4F6',
    fontFamily: AppFonts.displayRegular,
    fontSize: 18,
    fontStyle: 'italic',
    lineHeight: 26,
  },
  summary: {
    marginTop: 18,
  },
  summaryLabel: {
    color: '#8A8A8E',
    flex: 1,
    fontFamily: AppFonts.sansRegular,
    fontSize: 13,
    lineHeight: 18,
  },
  summaryRow: {
    borderBottomColor: '#242428',
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    paddingVertical: 13,
  },
  summaryRowLast: {
    borderBottomWidth: 0,
  },
  summaryValue: {
    color: '#FFFFFF',
    flex: 1,
    fontFamily: AppFonts.sansMedium,
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'right',
  },
});
