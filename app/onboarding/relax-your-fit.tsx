import type { Href } from 'expo-router';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { RelaxContinueButton } from '@/components/onboarding/RelaxContinueButton';
import { OnboardingScaffold } from '@/components/onboarding/OnboardingScaffold';
import { RelaxStepHeader } from '@/components/onboarding/RelaxStepHeader';
import { HalcyonColors, RELAX_ACCENT } from '@/constants/design';
import { RELAX_ONBOARDING } from '@/constants/relax-onboarding';
import { AppFonts } from '@/constants/theme';
import { safeGoBack } from '@/lib/navigation';
import {
  getOnboardingAnswers,
  type GuestOnboardingAnswers,
} from '@/lib/onboarding';

const fitBanner = require('@/assets/images/relax-your-fit-banner.webp');

const BANNER_MARGIN_TOP = 8;
const BANNER_MAX_HEIGHT = 150;
const BANNER_MIN_HEIGHT = 80;
const CONTENT_BOTTOM_PADDING = 24;
const CONTENT_TOP_PADDING = RELAX_ONBOARDING.content.paddingTop;
const LAYOUT_ROUNDING_BUFFER = 2;
const QUOTE_MARGIN_TOP = 16;
const SUMMARY_MARGIN_TOP = -1;

function rhythmLabel(value: string | null) {
  if (!value) return 'Flexible';

  const labels: Record<string, string> = {
    'During the day': 'Daytime',
    'In the evenings': 'Evenings',
    'At night': 'Night',
    'Throughout the day': 'Throughout the day',
  };
  return labels[value] ?? value;
}

function summaryRows(answers: GuestOnboardingAnswers) {
  return [
    {
      label: 'Your goal',
      value: answers.mainGoal ?? 'Feel calmer',
    },
    {
      label: 'Main challenge',
      value: answers.relaxCauses[0] ?? 'Everyday stress',
    },
    {
      label: 'Your rhythm',
      value: rhythmLabel(answers.calmingMoments),
    },
    {
      label: 'Your environment',
      value: 'At home',
    },
  ];
}

export default function RelaxYourFitScreen() {
  const router = useRouter();
  const [answers, setAnswers] = useState<GuestOnboardingAnswers | null>(null);
  const [viewportHeight, setViewportHeight] = useState(0);
  const [headingHeight, setHeadingHeight] = useState(0);
  const [summaryHeight, setSummaryHeight] = useState(0);
  const [quoteHeight, setQuoteHeight] = useState(0);

  useEffect(() => {
    let active = true;
    void getOnboardingAnswers().then((value) => {
      if (active) setAnswers(value);
    });
    return () => {
      active = false;
    };
  }, []);

  const rows = useMemo(() => (answers ? summaryRows(answers) : []), [answers]);
  const measuredBannerHeight =
    answers &&
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
        <RelaxContinueButton
          label="Preview my passages"
          onPress={() => router.push('/onboarding/relax-trust' as Href)}
        />
      }
      onViewportLayout={(event) =>
        setViewportHeight(event.nativeEvent.layout.height)
      }
      header={<RelaxStepHeader currentStep={8} onBack={() => safeGoBack(router)} />}>
      <Text
        onLayout={(event) => setHeadingHeight(event.nativeEvent.layout.height)}
        style={styles.heading}>
        Built around{'\n'}how you feel.
      </Text>

      <View style={[styles.bannerStage, { height: bannerHeight }]}>
        <View style={styles.bannerContainer}>
          <Image contentFit="cover" source={fitBanner} style={styles.bannerImage} />
          <LinearGradient
            colors={[
              HalcyonColors.background,
              'rgba(11,11,13,0.58)',
              'rgba(11,11,13,0)',
            ]}
            locations={[0, 0.38, 1]}
            pointerEvents="none"
            style={[styles.innerFade, styles.innerFadeTop]}
          />
          <LinearGradient
            colors={[
              'rgba(11,11,13,0)',
              'rgba(11,11,13,0.56)',
              HalcyonColors.background,
            ]}
            locations={[0, 0.62, 1]}
            pointerEvents="none"
            style={[styles.innerFade, styles.innerFadeBottom]}
          />
        </View>
      </View>

      {answers ? (
        <View
          onLayout={(event) => setSummaryHeight(event.nativeEvent.layout.height)}
          style={styles.summary}>
          {rows.map((row, index) => (
            <View
              key={row.label}
              style={[
                styles.summaryRow,
                index === rows.length - 1 && styles.summaryRowLast,
              ]}>
              <Text style={styles.summaryLabel}>{row.label}</Text>
              <Text style={styles.summaryValue}>{row.value}</Text>
            </View>
          ))}
        </View>
      ) : (
        <ActivityIndicator
          color={RELAX_ACCENT}
          size="small"
          style={styles.loader}
        />
      )}

      <View
        onLayout={(event) => setQuoteHeight(event.nativeEvent.layout.height)}
        style={styles.quoteCard}>
        <Text style={styles.quoteText}>
          &ldquo;Passage helps me switch off and stop overthinking.&rdquo;
        </Text>
        <Text style={styles.quoteAttribution}>
          {'\u2014'} Alex, teacher
        </Text>
      </View>
    </OnboardingScaffold>
  );
}

const styles = StyleSheet.create({
  bannerContainer: {
    height: '100%',
    overflow: 'hidden',
    width: '100%',
  },
  bannerImage: {
    height: '100%',
    width: '100%',
  },
  bannerStage: {
    alignSelf: 'stretch',
    marginHorizontal: -RELAX_ONBOARDING.screenPaddingHorizontal,
    marginTop: BANNER_MARGIN_TOP,
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
    position: 'relative',
    zIndex: 3,
  },
  innerFade: {
    left: 0,
    position: 'absolute',
    right: 0,
  },
  innerFadeBottom: {
    bottom: 0,
    height: 44,
  },
  innerFadeTop: {
    height: 52,
    top: 0,
  },
  loader: {
    marginVertical: 38,
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
    width: '100%',
  },
  quoteText: {
    color: '#F4F1EC',
    flexShrink: 0,
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
    color: HalcyonColors.textPrimary,
    flex: 1.1,
    fontFamily: AppFonts.sansMedium,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'right',
  },
});
