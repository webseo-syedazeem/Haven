import type { Href } from 'expo-router';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

import { OnboardingContinueButton } from '@/components/onboarding/OnboardingContinueButton';
import { OnboardingScaffold } from '@/components/onboarding/OnboardingScaffold';
import { getTypicalDurationLabel } from '@/constants/filters';
import type { ModeId } from '@/constants/modes';
import { RELAX_ONBOARDING } from '@/constants/relax-onboarding';
import { AppFonts } from '@/constants/theme';
import { safeGoBack } from '@/lib/navigation';
import { getOnboardingAnswers, type GuestOnboardingAnswers } from '@/lib/onboarding';

const FIT_BANNER = {
  focus: require('@/assets/images/your-fit-focus.webp'),
  relax: require('@/assets/images/your-fit-banner.webp'),
  sleep: require('@/assets/images/your-fit-sleep.webp'),
} as const;

type FitQuote = {
  quote: string;
  attribution: string;
};

const FIT_HEADING: Record<ModeId, string> = {
  sleep: 'Built around\nhow you rest.',
  focus: 'Built around\nhow you work.',
  relax: 'Built around\nhow you feel.',
};

const FIT_QUOTE: Record<ModeId, FitQuote> = {
  sleep: {
    quote: 'The room fades away before I notice I\u2019m drifting.',
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

const BANNER_MARGIN_TOP = 8;
const BANNER_MAX_HEIGHT = 240;
const BANNER_MIN_HEIGHT = 140;
const CONTENT_BOTTOM_PADDING = 24;
const CONTENT_TOP_PADDING = RELAX_ONBOARDING.content.paddingTop;
const LAYOUT_ROUNDING_BUFFER = 2;
const QUOTE_MARGIN_TOP = 16;
const SUMMARY_MARGIN_TOP = -1;

const DEFAULT_SETTING: Record<ModeId, string> = {
  focus: 'At a desk',
  sleep: 'Falling asleep',
  relax: 'At home',
};

const DEFAULT_CHALLENGE: Record<ModeId, string> = {
  focus: 'Noise + racing thoughts',
  sleep: 'Racing thoughts + outside noise',
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

  const rows = [
    { label: mode === 'sleep' ? 'Your moment' : 'Your setting', value: settingValue },
    { label: 'Your challenge', value: challengeValue },
  ];

  if (mode === 'relax') {
    const rhythmValue = answers.sessionLength
      ? getTypicalDurationLabel(answers.sessionLength)
      : '45 minutes';
    rows.push({ label: 'Your rhythm', value: rhythmValue });
  }

  return rows;
}

export default function YourFitScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<ModeId | null>(null);
  const [rows, setRows] = useState<{ label: string; value: string }[]>([]);
  const [viewportHeight, setViewportHeight] = useState(0);
  const [headingHeight, setHeadingHeight] = useState(0);
  const [summaryHeight, setSummaryHeight] = useState(0);
  const [quoteHeight, setQuoteHeight] = useState(0);

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
  const measuredBannerHeight =
    viewportHeight > 0 &&
    headingHeight > 0 &&
    summaryHeight > 0 &&
    quoteHeight > 0
      ? viewportHeight -
        CONTENT_TOP_PADDING -
        CONTENT_BOTTOM_PADDING -
        headingHeight -
        BANNER_MARGIN_TOP -
        summaryHeight -
        SUMMARY_MARGIN_TOP -
        quoteHeight -
        QUOTE_MARGIN_TOP -
        LAYOUT_ROUNDING_BUFFER
      : BANNER_MAX_HEIGHT;
  const bannerHeight = Math.min(
    BANNER_MAX_HEIGHT,
    Math.max(BANNER_MIN_HEIGHT, measuredBannerHeight)
  );

  return (
    <OnboardingScaffold
      contentContainerStyle={styles.content}
      footer={
        <OnboardingContinueButton
          disabled={!mode}
          label="Preview my passages"
          onPress={() => router.push('/onboarding/trust' as Href)}
          showArrow
          variant={mode === 'sleep' ? 'lavender' : 'amber'}
        />
      }
      onViewportLayout={(event) =>
        setViewportHeight(event.nativeEvent.layout.height)
      }
      onBack={() => safeGoBack(router)}>
      <Text
        onLayout={(event) => setHeadingHeight(event.nativeEvent.layout.height)}
        style={styles.heading}>
        {mode ? FIT_HEADING[mode] : FIT_HEADING.focus}
      </Text>

      <View style={[styles.bannerContainer, { height: bannerHeight }]}>
        <Image
          source={mode ? FIT_BANNER[mode] : FIT_BANNER.focus}
          style={styles.bannerImage}
        />
      </View>

      <View
        onLayout={(event) => setSummaryHeight(event.nativeEvent.layout.height)}
        style={styles.summary}>
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
        <View
          onLayout={(event) => setQuoteHeight(event.nativeEvent.layout.height)}
          style={styles.quoteCard}>
          <Text style={styles.quoteText}>&ldquo;{quote.quote}&rdquo;</Text>
          <Text style={styles.quoteAttribution}>
            {'\u2014'} {quote.attribution}
          </Text>
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
    marginTop: BANNER_MARGIN_TOP,
    overflow: 'hidden',
    width: '100%',
  },
  bannerImage: {
    height: '100%',
    resizeMode: 'cover',
    width: '100%',
  },
  content: {
    paddingBottom: CONTENT_BOTTOM_PADDING,
    paddingHorizontal: RELAX_ONBOARDING.screenPaddingHorizontal,
    paddingTop: CONTENT_TOP_PADDING,
  },
  heading: {
    color: '#FFFFFF',
    fontFamily: AppFonts.playfairRegular,
    fontSize: RELAX_ONBOARDING.heading.fontSize,
    fontWeight: '600',
    letterSpacing: RELAX_ONBOARDING.heading.letterSpacing,
    lineHeight: RELAX_ONBOARDING.heading.lineHeight,
    textAlign: 'left',
  },
  quoteAttribution: {
    color: 'rgba(255,255,255,0.78)',
    fontFamily: AppFonts.sansRegular,
    fontSize: 16,
    lineHeight: 23,
    marginTop: 12,
  },
  quoteCard: {
    backgroundColor: '#1C2A2D',
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 18,
    borderWidth: 1,
    marginTop: QUOTE_MARGIN_TOP,
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  quoteText: {
    color: '#F4F1EC',
    fontFamily: AppFonts.displayMediumItalic,
    fontSize: 23,
    lineHeight: 30,
  },
  summary: {
    marginTop: SUMMARY_MARGIN_TOP,
    paddingHorizontal: 16,
    width: '100%',
    zIndex: 1,
  },
  summaryLabel: {
    color: 'rgba(255,255,255,0.7)',
    flex: 0.9,
    fontFamily: AppFonts.sansRegular,
    fontSize: 15,
    lineHeight: 22,
  },
  summaryRow: {
    alignItems: 'center',
    borderBottomColor: 'rgba(255,255,255,0.17)',
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    minHeight: 46,
    paddingVertical: 10,
  },
  summaryRowLast: {
    borderBottomWidth: 0,
  },
  summaryValue: {
    color: '#FFFFFF',
    flex: 1.1,
    fontFamily: AppFonts.sansMedium,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'right',
  },
});
