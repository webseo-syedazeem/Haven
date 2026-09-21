import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { Href } from 'expo-router';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Image,
  StyleSheet,
  Text,
  View,
  type ImageSourcePropType,
} from 'react-native';

import { OnboardingContinueButton } from '@/components/onboarding/OnboardingContinueButton';
import { OnboardingScaffold } from '@/components/onboarding/OnboardingScaffold';
import { HalcyonColors } from '@/constants/design';
import type { ModeId } from '@/constants/modes';
import { AppFonts } from '@/constants/theme';
import { getOnboardingAnswers } from '@/lib/onboarding';

const brandIcon = require('@/assets/images/passage-brand-assets/screens-icon.webp');
const trustHeroDesk = require('@/assets/images/trust-hero-desk.jpg');
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

  const customHeader = (
    <View style={styles.headerCentered}>
      <View style={styles.brandRow}>
        <Image source={brandIcon} style={styles.brandIcon} />
        <Text style={styles.brandText}>Passage</Text>
      </View>
      <View style={styles.dashRow}>
        {Array.from({ length: 7 }).map((_, index) => (
          <View
            key={index}
            style={[styles.dash, index === 6 ? styles.dashActive : styles.dashInactive]}
          />
        ))}
      </View>
    </View>
  );

  return (
    <OnboardingScaffold
      contentContainerStyle={styles.content}
      footer={
        <View style={styles.footerContainer}>
          <OnboardingContinueButton
            disabled={!copy}
            label="Preview the soundscapes"
            onPress={() => router.push('/onboarding/try-passage' as Href)}
            showArrow
          />
          <Text style={styles.footerCommitment}>Three one-minute previews. No commitment.</Text>
        </View>
      }
      header={customHeader}>
      <View style={styles.heroContainer}>
        <Image source={trustHeroDesk} style={styles.heroImage} />
        <LinearGradient
          colors={['rgba(11,11,13,0.85)', 'rgba(11,11,13,0.25)', 'transparent']}
          locations={[0, 0.5, 1]}
          style={StyleSheet.absoluteFill}
        />
        <Text style={styles.heroHeading}>{copy.heading}</Text>
      </View>

      <View style={styles.featuredSection}>
        <View style={styles.featuredDivider}>
          <View style={styles.featuredLine} />
          <Text style={styles.featuredLabel}>FEATURED IN</Text>
          <View style={styles.featuredLine} />
        </View>
        <View style={styles.featuredBrands}>
          {copy.featuredIn.map((name) => (
            <Text key={name} style={styles.featuredBrand}>
              {name.toUpperCase()}
            </Text>
          ))}
        </View>
      </View>

      <View style={styles.cards}>
        {copy.testimonials.map((testimonial) => (
          <View key={testimonial.name} style={styles.card}>
            <Image source={testimonial.avatar} style={styles.avatar} />
            <View style={styles.cardContent}>
              <View style={styles.cardStars}>
                {Array.from({ length: 5 }).map((_, index) => (
                  <Ionicons color="#F4B34C" key={index} name="star" size={14} />
                ))}
              </View>
              <Text style={styles.cardQuote}>“{testimonial.quote}”</Text>
              <Text style={styles.cardAttribution}>
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
    borderRadius: 29,
    height: 58,
    resizeMode: 'cover',
    width: 58,
  },
  brandIcon: {
    height: 22,
    resizeMode: 'contain',
    width: 38,
  },
  brandRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  brandText: {
    color: HalcyonColors.textPrimary,
    fontFamily: AppFonts.sansBold,
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
    marginLeft: 9,
  },
  card: {
    alignItems: 'center',
    backgroundColor: '#0F1317',
    borderColor: '#1E2328',
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    padding: 14,
  },
  cardAttribution: {
    color: '#8A8A8E',
    fontFamily: AppFonts.sansRegular,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 4,
  },
  cardContent: {
    flex: 1,
    marginLeft: 14,
  },
  cardQuote: {
    color: '#E5E5EA',
    fontFamily: AppFonts.sansRegular,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
  cardStars: {
    flexDirection: 'row',
    gap: 3,
  },
  cards: {
    gap: 12,
    marginTop: 18,
  },
  content: {
    paddingBottom: 24,
    paddingTop: 12,
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
    fontSize: 13,
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
    marginTop: 20,
  },
  footerCommitment: {
    color: '#8A8A8E',
    fontFamily: AppFonts.sansRegular,
    fontSize: 12,
    lineHeight: 16,
    marginTop: 10,
    textAlign: 'center',
  },
  footerContainer: {
    alignItems: 'center',
    width: '100%',
  },
  headerCentered: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 6,
    width: '100%',
  },
  heroContainer: {
    borderColor: '#24282E',
    borderRadius: 18,
    borderWidth: 1,
    height: 270,
    marginTop: 16,
    overflow: 'hidden',
    position: 'relative',
    width: '100%',
  },
  heroHeading: {
    color: '#FFFFFF',
    fontFamily: AppFonts.playfairRegular,
    fontSize: 34,
    fontWeight: '400',
    left: 20,
    letterSpacing: -0.3,
    lineHeight: 40,
    position: 'absolute',
    right: 20,
    textAlign: 'left',
    top: 20,
    zIndex: 10,
  },
  heroImage: {
    ...StyleSheet.absoluteFillObject,
    height: '100%',
    resizeMode: 'cover',
    width: '100%',
  },
});
