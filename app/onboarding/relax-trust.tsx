import type { Href } from 'expo-router';
import { useRouter } from 'expo-router';
import { Image, StyleSheet, Text, View } from 'react-native';
import { RelaxContinueButton } from '@/components/onboarding/RelaxContinueButton';
import { OnboardingScaffold } from '@/components/onboarding/OnboardingScaffold';
import { RelaxStepHeader } from '@/components/onboarding/RelaxStepHeader';
import { PassageColors } from '@/constants/design';
import { RELAX_ONBOARDING } from '@/constants/relax-onboarding';
import { AppFonts } from '@/constants/theme';
import { safeGoBack } from '@/lib/navigation';
import { useRemoteTestimonials } from '@/lib/remote-testimonials';

const background = require('@/assets/images/trust-relax-interior-v2.webp');

export default function RelaxTrustScreen() {
  const router = useRouter();
  const { testimonials } = useRemoteTestimonials('relax');
  return <OnboardingScaffold
    backgroundImage={background}
    contentContainerStyle={styles.content}
    footer={<View style={styles.footer}>
      {testimonials.length === 0 ? (
        <View style={styles.quoteCard}>
          <Text style={styles.quoteText}>Thank you for being part of the Passage community.</Text>
          <Text style={styles.quoteAttribution}>{'—'} The Passage Team</Text>
        </View>
      ) : null}
      <RelaxContinueButton label="Preview the soundscapes" onPress={() => router.push('/onboarding/try-passage?mode=relax' as Href)} />
      <Text style={styles.footerNote}>Three one-minute previews. No commitment.</Text>
    </View>}
    header={<RelaxStepHeader currentStep={8} onBack={() => safeGoBack(router)} />}>
    <Text style={styles.heading}>A gentler space{`\n`}to slow things down.</Text>
    <View style={[styles.divider, styles.headingDivider]} />
    {testimonials.length ? testimonials.map((testimonial, index) => <View key={testimonial.id}>
      <View style={styles.testimonial}>
        {testimonial.avatar_url ? <Image source={{ uri: testimonial.avatar_url }} style={styles.avatar} /> : null}
        <View style={styles.testimonialCopy}><Text style={styles.quote}>”{testimonial.quote}”</Text><Text style={styles.attribution}>— {testimonial.name}{testimonial.role ? ` — ${testimonial.role}` : ''}</Text></View>
      </View>
      {index < testimonials.length - 1 ? <View style={styles.divider} /> : null}
    </View>) : <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No testimonials yet</Text>
          <Text style={styles.emptyBody}>We're just getting started. Real stories from our community will appear here soon.</Text>
        </View>}
  </OnboardingScaffold>;
}

const styles = StyleSheet.create({
  attribution: { color: PassageColors.textSecondary, fontFamily: AppFonts.sansRegular, fontSize: 13, lineHeight: 19, marginTop: 7 },
  avatar: { borderRadius: 42, height: 84, resizeMode: 'cover', width: 84 },
  benefit: { backgroundColor: 'rgba(10,14,18,0.75)', borderColor: 'rgba(255,255,255,0.14)', borderRadius: 18, borderWidth: 1, marginTop: 22, padding: 20 },
  benefitTitle: { color: PassageColors.textPrimary, fontFamily: AppFonts.sansSemiBold, fontSize: 15, marginBottom: 8 },
  emptyBody: { color: PassageColors.textSecondary, fontFamily: AppFonts.sansRegular, fontSize: 15, lineHeight: 22, marginTop: 10, textAlign: 'center' },
  emptyState: { alignItems: 'center', flex: 1, justifyContent: 'center', paddingHorizontal: 8 },
  emptyTitle: { color: PassageColors.textPrimary, fontFamily: AppFonts.sansSemiBold, fontSize: 22, textAlign: 'center' },
  quoteAttribution: { color: 'rgba(255,255,255,0.78)', fontFamily: AppFonts.sansRegular, fontSize: 16, lineHeight: 23, marginTop: 12 },
  quoteCard: { backgroundColor: '#1C2A2D', borderColor: 'rgba(255,255,255,0.06)', borderRadius: 18, borderWidth: 1, marginBottom: 16, paddingHorizontal: 20, paddingVertical: 18 },
  quoteText: { color: '#F4F1EC', fontFamily: AppFonts.displayMediumItalic, fontSize: 23, lineHeight: 30 },
  content: { paddingBottom: 18, paddingHorizontal: RELAX_ONBOARDING.screenPaddingHorizontal, paddingTop: RELAX_ONBOARDING.content.paddingTop },
  divider: { backgroundColor: 'rgba(255,255,255,0.20)', height: StyleSheet.hairlineWidth, width: '100%' },
  footer: { alignItems: 'center' },
  footerNote: { color: PassageColors.textSecondary, fontFamily: AppFonts.sansRegular, fontSize: 11, lineHeight: 16, marginTop: 8, textAlign: 'center' },
  heading: { color: PassageColors.textPrimary, fontFamily: AppFonts.displayRegular, fontSize: RELAX_ONBOARDING.heading.fontSize, fontWeight: '500', letterSpacing: RELAX_ONBOARDING.heading.letterSpacing, lineHeight: RELAX_ONBOARDING.heading.lineHeight },
  headingDivider: { marginTop: RELAX_ONBOARDING.gaps.headingToContent },
  quote: { color: PassageColors.textPrimary, fontFamily: AppFonts.sansRegular, fontSize: RELAX_ONBOARDING.body.fontSize, lineHeight: RELAX_ONBOARDING.body.lineHeight },
  testimonial: { alignItems: 'center', flexDirection: 'row', paddingVertical: 18 },
  testimonialCopy: { flex: 1, marginLeft: 18 },
});
