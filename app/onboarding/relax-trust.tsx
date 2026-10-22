import { Ionicons } from '@expo/vector-icons';
import type { Href } from 'expo-router';
import { useRouter } from 'expo-router';
import { Image, StyleSheet, Text, View } from 'react-native';

import { RelaxContinueButton } from '@/components/onboarding/RelaxContinueButton';
import { OnboardingScaffold } from '@/components/onboarding/OnboardingScaffold';
import { RelaxStepHeader } from '@/components/onboarding/RelaxStepHeader';
import { HalcyonColors } from '@/constants/design';
import { RELAX_ONBOARDING } from '@/constants/relax-onboarding';
import { AppFonts } from '@/constants/theme';
import { safeGoBack } from '@/lib/navigation';

const background = require('@/assets/images/trust-relax-interior-v2.webp');
const sophieAvatar = require('@/assets/images/trust-sophie-portrait-v2.webp');
const jamesAvatar = require('@/assets/images/trust-james-portrait-v2.webp');
const featuredPublications = require('@/assets/images/relax-featured-publications.webp');

const STAR_COLOR = '#FFC400';

const TESTIMONIALS = [
  {
    avatar: sophieAvatar,
    name: 'Sophie',
    quote:
      'Passage has genuinely helped me feel less anxious and more present.',
    role: 'Marketing Manager',
  },
  {
    avatar: jamesAvatar,
    name: 'James',
    quote:
      'I use it after work to unwind. It makes a huge difference to my stress levels.',
    role: 'Business Owner',
  },
] as const;

export default function RelaxTrustScreen() {
  const router = useRouter();

  return (
    <OnboardingScaffold
      backgroundImage={background}
      contentContainerStyle={styles.content}
      footer={
        <View style={styles.footer}>
          <RelaxContinueButton
            label="Preview the soundscapes"
            onPress={() => router.push('/onboarding/try-passage?mode=relax' as Href)}
          />
          <Text style={styles.footerNote}>
            Three one-minute previews. No commitment.
          </Text>
        </View>
      }
      header={<RelaxStepHeader currentStep={8} onBack={() => safeGoBack(router)} />}>
      <Text style={styles.heading}>
        Trusted by people{'\n'}who feel calmer now.
      </Text>

      <View style={[styles.divider, styles.headingDivider]} />

      <View>
        {TESTIMONIALS.map((testimonial, index) => (
          <View key={testimonial.name}>
            <View style={styles.testimonial}>
              <Image source={testimonial.avatar} style={styles.avatar} />
              <View style={styles.testimonialCopy}>
                <View
                  accessibilityLabel="Five out of five stars"
                  style={styles.stars}>
                  {Array.from({ length: 5 }).map((_, starIndex) => (
                    <Ionicons
                      color={STAR_COLOR}
                      key={starIndex}
                      name="star"
                      size={18}
                    />
                  ))}
                </View>
                <Text style={styles.quote}>
                  &ldquo;{testimonial.quote}&rdquo;
                </Text>
                <Text style={styles.attribution}>
                  {'\u2014'} {testimonial.name} {'\u2014'} {testimonial.role}
                </Text>
              </View>
            </View>
            {index < TESTIMONIALS.length - 1 ? (
              <View style={styles.divider} />
            ) : null}
          </View>
        ))}
      </View>

      <View style={[styles.divider, styles.featuredDivider]} />
      <Text style={styles.featuredLabel}>FEATURED IN</Text>
      <Image
        accessibilityLabel="Featured in The Guardian, Forbes, and Wired"
        source={featuredPublications}
        style={styles.publicationImage}
      />
    </OnboardingScaffold>
  );
}

const styles = StyleSheet.create({
  attribution: {
    color: HalcyonColors.textSecondary,
    fontFamily: AppFonts.sansRegular,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 7,
  },
  avatar: {
    borderRadius: 42,
    height: 84,
    resizeMode: 'cover',
    width: 84,
  },
  content: {
    paddingBottom: 18,
    paddingHorizontal: RELAX_ONBOARDING.screenPaddingHorizontal,
    paddingTop: RELAX_ONBOARDING.content.paddingTop,
  },
  divider: {
    backgroundColor: 'rgba(255,255,255,0.20)',
    height: StyleSheet.hairlineWidth,
    width: '100%',
  },
  featuredDivider: {
    marginTop: 2,
  },
  featuredLabel: {
    color: 'rgba(255,255,255,0.82)',
    fontFamily: AppFonts.sansSemiBold,
    fontSize: 10,
    letterSpacing: 3.1,
    marginTop: 19,
    textAlign: 'center',
  },
  footer: {
    alignItems: 'center',
  },
  footerNote: {
    color: HalcyonColors.textSecondary,
    fontFamily: AppFonts.sansRegular,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 8,
    textAlign: 'center',
  },
  heading: {
    color: HalcyonColors.textPrimary,
    fontFamily: AppFonts.displayRegular,
    fontSize: RELAX_ONBOARDING.heading.fontSize,
    fontWeight: '500',
    letterSpacing: RELAX_ONBOARDING.heading.letterSpacing,
    lineHeight: RELAX_ONBOARDING.heading.lineHeight,
  },
  headingDivider: {
    marginTop: RELAX_ONBOARDING.gaps.headingToContent,
  },
  publicationImage: {
    height: 58,
    marginTop: 16,
    resizeMode: 'contain',
    width: '100%',
  },
  quote: {
    color: HalcyonColors.textPrimary,
    fontFamily: AppFonts.sansRegular,
    fontSize: RELAX_ONBOARDING.body.fontSize,
    lineHeight: RELAX_ONBOARDING.body.lineHeight,
    marginTop: 7,
  },
  stars: {
    flexDirection: 'row',
    gap: 2,
  },
  testimonial: {
    alignItems: 'center',
    flexDirection: 'row',
    paddingVertical: 18,
  },
  testimonialCopy: {
    flex: 1,
    marginLeft: 18,
  },
});
