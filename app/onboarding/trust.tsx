import { LinearGradient } from 'expo-linear-gradient';
import type { Href } from 'expo-router';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { OnboardingBrandHeader } from '@/components/onboarding/OnboardingBrandHeader';
import { OnboardingContinueButton } from '@/components/onboarding/OnboardingContinueButton';
import { OnboardingScaffold } from '@/components/onboarding/OnboardingScaffold';
import type { ModeId } from '@/constants/modes';
import { AppFonts } from '@/constants/theme';
import { safeGoBack } from '@/lib/navigation';
import { getOnboardingAnswers } from '@/lib/onboarding';
import { useRemoteTestimonials } from '@/lib/remote-testimonials';

const sleepBackground = require('@/assets/images/trust-sleep-bedroom-v2.webp');
const focusBackground = require('@/assets/images/trust-focus-studio-v2.webp');
const COPY: Record<ModeId, { heading: string; fallbackTitle: string; benefit: string }> = {
  sleep: {
    heading: 'A quieter way\nto end the day.',
    fallbackTitle: 'Your evening, uninterrupted',
    benefit: 'Let the day fade gently with immersive soundscapes that flow without sudden interruptions.',
  },
  focus: {
    heading: 'A space made\nfor deep focus.',
    fallbackTitle: 'Your space to focus',
    benefit: 'Settle into meaningful work with immersive soundscapes designed to stay quietly in the background.',
  },
  relax: {
    heading: 'A gentler space\nto slow things down.',
    fallbackTitle: 'A softer pause',
    benefit: 'Step away from the noise for a moment with steady soundscapes made for slowing down.',
  },
};

export default function TrustScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<ModeId>('focus');
  const { height } = useWindowDimensions();
  const { testimonials } = useRemoteTestimonials(mode);
  useEffect(() => { let active = true; void getOnboardingAnswers().then((answers) => { if (active) setMode(answers.startingMode || 'focus'); }); return () => { active = false; }; }, []);
  const copy = COPY[mode];
  const scale = Math.min(1, Math.max(0.75, height / 850));
  const hasTestimonials = testimonials.length > 0;
  const footer = (
    <View style={styles.footer}>
      {!hasTestimonials && (
        <View style={styles.quoteCard}>
          <Text style={styles.quoteText}>Thank you for being part of the Passage community.</Text>
          <Text style={styles.quoteAttribution}>{'—'} The Passage Team</Text>
        </View>
      )}
      <OnboardingContinueButton
        label={'Preview the soundscapes'}
        onPress={() => router.push(`/onboarding/try-passage?mode=${mode}` as Href)}
        showArrow
        variant={mode === 'sleep' ? 'lavender' : 'amber'}
      />
      <Text style={styles.note}>Three one-minute previews. No commitment.</Text>
    </View>
  );
  return <OnboardingScaffold
    backgroundImage={mode === 'focus' ? focusBackground : undefined}
    backgroundOverlayColor={mode === 'focus' ? 'rgba(11,11,13,0.35)' : undefined}
    contentContainerStyle={styles.content}
    header={<OnboardingBrandHeader onBack={() => safeGoBack(router)} />}
    footer={footer}>
    <View style={[styles.hero, { height: 330 * scale }]}>
      {mode !== 'focus' ? <><Image source={sleepBackground} style={styles.heroImage} /><LinearGradient colors={['#0B0B0D', '#0B0B0D', 'rgba(11,11,13,0.0)', 'rgba(11,11,13,0.7)', '#0B0B0D']} locations={[0, 0.18, 0.52, 0.82, 1]} style={StyleSheet.absoluteFill} /></> : null}
      <Text style={styles.heading}>{copy.heading}</Text>
    </View>
    <View style={styles.cards}>
      {testimonials.length ? testimonials.map((item) => <View key={item.id} style={styles.card}>
        {item.avatar_url ? <Image source={{ uri: item.avatar_url }} style={styles.avatar} /> : null}
        <View style={styles.cardCopy}><Text style={styles.quote}>”{item.quote}”</Text><Text style={styles.attribution}>{item.name}{item.role ? ` — ${item.role}` : ''}</Text></View>
      </View>) : <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No testimonials yet</Text>
          <Text style={styles.emptyBody}>We're just getting started. Real stories from our community will appear here soon.</Text>
        </View>}
    </View>
  </OnboardingScaffold>;
}

const styles = StyleSheet.create({
  attribution: { color: '#8A8A8E', fontFamily: AppFonts.sansRegular, fontSize: 13, marginTop: 8 },
  avatar: { borderRadius: 32, height: 64, width: 64 },
  card: { alignItems: 'center', backgroundColor: '#0F1317', borderColor: '#1E2328', borderRadius: 18, borderWidth: 1, flexDirection: 'row', minHeight: 104, padding: 16 },
  cardCopy: { flex: 1, marginLeft: 4 },
  cardTitle: { color: '#FFFFFF', fontFamily: AppFonts.sansSemiBold, fontSize: 15, marginBottom: 8 },
  cards: { gap: 14, marginTop: 14 },
  content: { paddingBottom: 20, paddingTop: 0 },
  footer: { alignItems: 'center', width: '100%' },
  heading: { color: '#FFFFFF', fontFamily: AppFonts.playfairRegular, fontSize: 38, left: 26, lineHeight: 44, position: 'absolute', right: 24, top: 88 },
  hero: { alignSelf: 'stretch', marginHorizontal: -20, marginTop: -66, overflow: 'hidden' },
  heroImage: { ...StyleSheet.absoluteFillObject, height: '100%', resizeMode: 'cover', width: '100%' },
  note: { color: '#8A8A8E', fontFamily: AppFonts.sansRegular, fontSize: 12, marginTop: 8 },
  emptyBody: { color: '#8A8A8E', fontFamily: AppFonts.sansRegular, fontSize: 15, lineHeight: 22, marginTop: 10, textAlign: 'center' },
  emptyState: { alignItems: 'center', paddingHorizontal: 8, paddingTop: 16 },
  emptyTitle: { color: '#FFFFFF', fontFamily: AppFonts.sansSemiBold, fontSize: 22, textAlign: 'center' },
  quoteAttribution: { color: 'rgba(255,255,255,0.78)', fontFamily: AppFonts.sansRegular, fontSize: 16, lineHeight: 23, marginTop: 12 },
  quoteCard: { backgroundColor: '#1C2A2D', borderColor: 'rgba(255,255,255,0.06)', borderRadius: 18, borderWidth: 1, marginBottom: 16, paddingHorizontal: 20, paddingVertical: 18 },
  quoteText: { color: '#F4F1EC', fontFamily: AppFonts.displayMediumItalic, fontSize: 23, lineHeight: 30 },
  quote: { color: '#E5E5EA', fontFamily: AppFonts.sansRegular, fontSize: 15, lineHeight: 22 },
});
