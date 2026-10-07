import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import type { Href } from 'expo-router';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Image,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type ImageSourcePropType,
} from 'react-native';

import { OnboardingBrandHeader } from '@/components/onboarding/OnboardingBrandHeader';
import { OnboardingContinueButton } from '@/components/onboarding/OnboardingContinueButton';
import { OnboardingScaffold } from '@/components/onboarding/OnboardingScaffold';
import type { ModeId } from '@/constants/modes';
import { AppFonts } from '@/constants/theme';
import { safeGoBack } from '@/lib/navigation';
import { getOnboardingAnswers } from '@/lib/onboarding';

const trustHeroDesk = require('@/assets/images/trust-hero-desk.webp');
const trustFocusFullBackground = require('@/assets/images/trust-focus-full-background.webp');
const mayaAvatar = require('@/assets/images/rating-person-3.webp');
const danielAvatar = require('@/assets/images/rating-person-2.webp');
const sophieAvatar = require('@/assets/images/rating-person-4.webp');
const jamesAvatar = require('@/assets/images/rating-person-1.webp');

type Testimonial = {
  quote: string;
  name: string;
  role: string;
  avatar: ImageSourcePropType;
};

type TrustCopy = {
  heading: string;
  testimonials: readonly [Testimonial, Testimonial];
  featuredIn: readonly string[];
};

const TRUST_COPY: Record<ModeId, TrustCopy> = {
  sleep: {
    heading: 'Trusted by people\nwho want quieter nights.',
    testimonials: [
      {
        quote: 'It has become the last part of my evening routine.',
        name: 'Maya',
        role: 'Designer',
        avatar: mayaAvatar,
      },
      {
        quote: 'The Night Train soundscape helps bedtime feel like a destination.',
        name: 'Daniel',
        role: 'Postgraduate student',
        avatar: danielAvatar,
      },
    ],
    featuredIn: ['Form', 'Horizon', 'Wellbeing', 'The Edit'],
  },
  focus: {
    heading: 'Trusted by people\nwho need to focus.',
    testimonials: [
      {
        quote: 'Passage turns a noisy room into somewhere I can actually work.',
        name: 'Maya',
        role: 'Freelance designer',
        avatar: mayaAvatar,
      },
      {
        quote: 'It has become the cue that tells my brain it is time to begin.',
        name: 'Daniel',
        role: 'Postgraduate student',
        avatar: danielAvatar,
      },
    ],
    featuredIn: ['Form', 'Horizon', 'Wellbeing', 'The Edit'],
  },
  relax: {
    heading: 'Trusted by people\nwho feel calmer now.',
    testimonials: [
      {
        quote: 'Passage has genuinely helped me feel less anxious and more present.',
        name: 'Sophie',
        role: 'Marketing manager',
        avatar: sophieAvatar,
      },
      {
        quote: 'I use it after work to unwind, it makes a huge difference to my stress levels.',
        name: 'James',
        role: 'Business owner',
        avatar: jamesAvatar,
      },
    ],
    featuredIn: ['Form', 'Horizon', 'Wellbeing', 'The Edit'],
  },
};

export default function TrustScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<ModeId | null>(null);
  const { height: screenHeight, width: screenWidth } = useWindowDimensions();

  // Scale this screen's vertical measurements on shorter devices so the whole
  // client composition remains inside the safe-area viewport without scrolling.
  const layoutScale = Math.min(1, Math.max(0.66, (screenHeight - 50) / 850));
  const scale = (value: number) => Math.round(value * layoutScale);
  const isVeryCompact = screenHeight < 620;
  const isNarrow = screenWidth < 360;
  const cardHeight = isVeryCompact ? 84 : Math.max(92, scale(112));

  useEffect(() => {
    let active = true;
    void getOnboardingAnswers().then((answers) => {
      if (!active) return;
      setMode(answers.startingMode || 'focus');
    });
    return () => {
      active = false;
    };
  }, [router]);

  const copy = mode ? TRUST_COPY[mode] : TRUST_COPY.focus;

  const isSleep = mode === 'sleep';
  const themeColor = isSleep ? '#9FAEFD' : '#F4B34C';
  const usesFullScreenBackground = mode === 'focus';

  const customHeader = (
    <View
      style={[
        styles.headerContainer,
        {
          paddingBottom: Math.max(5, scale(12)),
        },
      ]}>
      <OnboardingBrandHeader onBack={() => safeGoBack(router)} />
      <View
        style={[
          styles.dashRow,
          {
            gap: Math.max(4, scale(6)),
            marginTop: Math.max(7, scale(14)),
          },
        ]}>
        {Array.from({ length: 7 }).map((_, index) => (
          <View
            key={index}
            style={[
              styles.dash,
              index === 6
                ? [styles.dashActive, { backgroundColor: themeColor }]
                : styles.dashInactive,
            ]}
          />
        ))}
      </View>
    </View>
  );

  return (
    <OnboardingScaffold
      backgroundImage={usesFullScreenBackground ? trustFocusFullBackground : undefined}
      backgroundOverlayColor={
        usesFullScreenBackground ? 'rgba(11,11,13,0.08)' : undefined
      }
      contentContainerStyle={[
        styles.content,
        { paddingBottom: Math.max(2, scale(12)) },
      ]}
      footer={
        <View style={styles.footerContainer}>
          <OnboardingContinueButton
            disabled={!copy}
            label="Preview the soundscapes"
            onPress={() => router.push(`/onboarding/try-passage?mode=${mode ?? 'focus'}` as Href)}
            showArrow
            style={{ minHeight: Math.max(44, scale(60)) }}
            variant={isSleep ? 'lavender' : 'amber'}
          />
          <Text
            numberOfLines={1}
            style={[
              styles.footerCommitment,
              {
                fontSize: Math.max(10, scale(13)),
                lineHeight: Math.max(12, scale(18)),
                marginTop: Math.max(4, scale(10)),
              },
            ]}>
            Three one-minute previews. No commitment.
          </Text>
        </View>
      }
      header={customHeader}
      scroll={false}>
      <View
        style={[
          styles.heroContainer,
          {
            height: scale(370),
            marginTop: -scale(96),
          },
        ]}>
        {!usesFullScreenBackground ? (
          <>
            <Image source={trustHeroDesk} style={styles.heroImage} />
            <BlurView
              experimentalBlurMethod="dimezisBlurView"
              intensity={12}
              style={styles.heroOutsideBlur}
              tint="default"
            />
            <LinearGradient
              colors={[
                '#0B0B0D',
                'rgba(11,11,13,0.7)',
                'rgba(11,11,13,0.06)',
                'rgba(11,11,13,0.12)',
                '#0B0B0D',
              ]}
              locations={[0, 0.12, 0.32, 0.7, 1]}
              style={StyleSheet.absoluteFill}
            />
          </>
        ) : null}
        <Text
          style={[
            styles.heroHeading,
            {
              fontSize: Math.max(29, scale(38)),
              left: isNarrow ? 24 : 30,
              lineHeight: Math.max(34, scale(44)),
              top: scale(128),
            },
          ]}>
          {copy.heading}
        </Text>
      </View>

      <View style={[styles.featuredSection, { marginTop: Math.max(0, scale(4)) }]}>
        <View style={styles.featuredDivider}>
          <View style={styles.featuredLine} />
          <Text
            style={[
              styles.featuredLabel,
              {
                fontSize: Math.max(8, scale(10)),
                paddingHorizontal: Math.max(8, scale(12)),
              },
            ]}>
            FEATURED IN
          </Text>
          <View style={styles.featuredLine} />
        </View>
        <View
          style={[
            styles.featuredBrands,
            { marginTop: Math.max(6, scale(10)), paddingHorizontal: isNarrow ? 0 : 4 },
          ]}>
          {copy.featuredIn.map((name) => (
            <Text
              key={name}
              style={[
                styles.featuredBrand,
                {
                  fontSize: Math.max(10, scale(14)),
                  letterSpacing: Math.max(0.7, 1.4 * layoutScale),
                },
              ]}>
              {name.toUpperCase()}
            </Text>
          ))}
        </View>
      </View>

      <View
        style={[
          styles.cards,
          {
            gap: Math.max(8, scale(14)),
            marginTop: Math.max(8, scale(18)),
          },
        ]}>
        {copy.testimonials.map((testimonial) => (
          <View
            key={testimonial.name}
            style={[
              styles.card,
              {
                borderRadius: Math.max(13, scale(18)),
                height: cardHeight,
                minHeight: 0,
                padding: Math.max(9, scale(16)),
              },
            ]}>
            <Image
              source={testimonial.avatar}
              style={[
                styles.avatar,
                {
                  borderRadius: Math.max(24, scale(34)),
                  height: Math.max(48, scale(68)),
                  width: Math.max(48, scale(68)),
                },
              ]}
            />
            <View
              style={[
                styles.cardContent,
                { marginLeft: Math.max(10, scale(16)) },
              ]}>
              <View style={styles.cardStars}>
                {Array.from({ length: 5 }).map((_, index) => (
                  <Ionicons
                    color={themeColor}
                    key={index}
                    name="star"
                    size={Math.max(12, scale(16))}
                  />
                ))}
              </View>
              <Text
                numberOfLines={2}
                style={[
                  styles.cardQuote,
                  {
                    fontSize: Math.max(12, 15.5 * layoutScale),
                    lineHeight: Math.max(16, scale(22)),
                    marginTop: Math.max(3, scale(6)),
                  },
                ]}>
                “{testimonial.quote}”
              </Text>
              <Text
                adjustsFontSizeToFit
                numberOfLines={1}
                style={[
                  styles.cardAttribution,
                  {
                    fontSize: Math.max(10, scale(13)),
                    lineHeight: Math.max(13, scale(18)),
                    marginTop: Math.max(3, scale(6)),
                  },
                ]}>
                {testimonial.name} — {testimonial.role}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </OnboardingScaffold>
  );
}

const styles = StyleSheet.create({
  avatar: {
    borderRadius: 34,
    height: 68,
    resizeMode: 'cover',
    width: 68,
  },
  card: {
    alignItems: 'center',
    backgroundColor: '#0F1317',
    borderColor: '#1E2328',
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 112,
    padding: 16,
  },
  cardAttribution: {
    color: '#8A8A8E',
    fontFamily: AppFonts.sansRegular,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 6,
  },
  cardContent: {
    flex: 1,
    marginLeft: 16,
  },
  cardQuote: {
    color: '#E5E5EA',
    fontFamily: AppFonts.sansRegular,
    fontSize: 15.5,
    lineHeight: 22,
    marginTop: 6,
  },
  cardStars: {
    flexDirection: 'row',
    gap: 3,
  },
  cards: {
    gap: 14,
    marginTop: 18,
  },
  content: {
    paddingBottom: 24,
    paddingTop: 0,
  },
  dash: {
    borderRadius: 1,
    flex: 1,
    height: 2,
    maxWidth: 42,
  },
  dashActive: {
    backgroundColor: '#F4B34C',
  },
  dashInactive: {
    backgroundColor: '#383D43',
  },
  dashRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    marginTop: 14,
    paddingHorizontal: 16,
    width: '100%',
  },
  featuredBrand: {
    color: '#9E9EA3',
    fontFamily: AppFonts.displayRegular,
    fontSize: 14,
    letterSpacing: 1.4,
  },
  featuredBrands: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingHorizontal: 4,
  },
  featuredDivider: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
  },
  featuredLabel: {
    color: '#8A8A8E',
    fontFamily: AppFonts.sansSemiBold,
    fontSize: 10,
    letterSpacing: 2,
    paddingHorizontal: 12,
  },
  featuredLine: {
    backgroundColor: '#262A30',
    flex: 1,
    height: 1,
  },
  featuredSection: {
    marginTop: 4,
  },
  footerCommitment: {
    color: '#8A8A8E',
    fontFamily: AppFonts.sansRegular,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 10,
    textAlign: 'center',
  },
  footerContainer: {
    alignItems: 'center',
    width: '100%',
  },
  headerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 12,
    position: 'relative',
    width: '100%',
    zIndex: 10,
  },
  heroContainer: {
    alignSelf: 'stretch',
    height: 370,
    marginHorizontal: -20,
    marginTop: -96,
    overflow: 'visible',
    position: 'relative',
  },
  heroHeading: {
    color: '#FFFFFF',
    fontFamily: AppFonts.playfairRegular,
    fontSize: 38,
    fontWeight: '400',
    left: 30,
    letterSpacing: -0.3,
    lineHeight: 44,
    position: 'absolute',
    right: 24,
    textAlign: 'left',
    top: 128,
    zIndex: 10,
  },
  heroImage: {
    ...StyleSheet.absoluteFillObject,
    height: '100%',
    resizeMode: 'cover',
    width: '100%',
  },
  heroOutsideBlur: {
    height: 32,
    left: 0,
    position: 'absolute',
    right: 0,
    top: -24,
    zIndex: 2,
  },
});
