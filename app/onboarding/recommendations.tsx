import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import type { Href } from 'expo-router';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CoverImage } from '@/components/CoverImage';
import { OnboardingContinueButton } from '@/components/onboarding/OnboardingContinueButton';
import { OnboardingScaffold } from '@/components/onboarding/OnboardingScaffold';
import { HalcyonColors, HalcyonRadius } from '@/constants/design';
import { AppFonts } from '@/constants/theme';
import { useSinglePress } from '@/hooks/useSinglePress';
import { coverUrl } from '@/lib/image-url';
import type { Soundscape } from '@/lib/api/home';
import {
  finishOnboardingForAppEntry,
  getOnboardingRecommendations,
  getOnboardingRecommendationsQueryKey,
} from '@/lib/onboarding';
import { formatDuration } from '@/lib/utils/duration';

export default function FirstRecommendationsScreen() {
  const router = useRouter();
  const [starting, setStarting] = useState(false);
  const [notice, setNotice] = useState('');
  const query = useQuery({
    queryKey: getOnboardingRecommendationsQueryKey(),
    queryFn: () => getOnboardingRecommendations(4),
    staleTime: 5 * 60 * 1000,
  });
  const best = query.data?.best_match ?? null;
  const alternatives = query.data?.alternatives ?? [];

  // The very first screen a new user sees after onboarding — prefetch its covers (sm variant,
  // matching what these small cards actually render at) as soon as the data arrives, so they
  // are already decoded by the time the fade-in transition would otherwise show them loading.
  useEffect(() => {
    const recommendations = query.data;
    if (!recommendations) return;

    const urls = [recommendations.best_match, ...recommendations.alternatives]
      .map((item) => coverUrl(item?.artwork_url, 'sm'))
      .filter((url): url is string => !!url);
    if (urls.length === 0) return;
    void Image.prefetch(urls, { cachePolicy: 'memory-disk' });
  }, [query.data]);

  // Neither button marks onboarding complete here: guest mode is only ever
  // entered from the explicit "Continue as guest" tap on /welcome, so the
  // picked track (if any) is just passed along for that screen to play.
  const enterWithoutTrack = () => {
    if (starting) return;
    router.push('/welcome' as Href);
  };

  const startListening = () => {
    if (!best || starting) return;
    router.push('/welcome?startTrack=1' as Href);
  };

  const saveSpace = async () => {
    if (starting) return;
    setNotice('');
    setStarting(true);
    try {
      await finishOnboardingForAppEntry();
      router.push('/welcome' as Href);
    } catch {
      setNotice('We could not save your onboarding progress. Please try again.');
      setStarting(false);
    }
  };
  const handleSaveSpacePress = useSinglePress(() => void saveSpace());

  return (
    <OnboardingScaffold
      footer={
        <View style={styles.footer}>
          <OnboardingContinueButton
            label={best ? 'Start listening' : 'Enter Passage'}
            loading={starting}
            onPress={() => void (best ? startListening() : enterWithoutTrack())}
            showArrow
          />
          <Pressable
            accessibilityRole="button"
            disabled={starting}
            hitSlop={8}
            onPress={handleSaveSpacePress}
            style={({ pressed }) => [
              starting && styles.linkDisabled,
              pressed && !starting && styles.pressed,
            ]}>
            <Text style={styles.saveLink}>Save your space with an account</Text>
          </Pressable>
        </View>
      }>
      <Text style={styles.eyebrow}>MADE FOR YOU</Text>
      <Text style={styles.heading}>Your first soundscapes</Text>

      {query.isInitialLoading ? (
        <RecommendationSkeleton />
      ) : best ? (
        <>
          <FeaturedCard soundscape={best} />
          <View style={styles.alternatives}>
            {alternatives.map((soundscape) => (
              <AlternativeCard key={soundscape.id} soundscape={soundscape} />
            ))}
          </View>
        </>
      ) : (
        <View style={styles.empty}>
          <Ionicons color={HalcyonColors.accent} name="cloud-offline-outline" size={28} />
          <Text style={styles.emptyTitle}>Your picks are not ready yet.</Text>
          <Text style={styles.emptyBody}>
            You can still enter Passage now, or try loading recommendations again.
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => void query.refetch()}
            style={({ pressed }) => [styles.retry, pressed && styles.pressed]}>
            <Text style={styles.retryLabel}>Try again</Text>
          </Pressable>
        </View>
      )}
      {notice ? <Text style={styles.notice}>{notice}</Text> : null}
    </OnboardingScaffold>
  );
}

function FeaturedCard({ soundscape }: { soundscape: Soundscape }) {
  return (
    <View style={styles.featured}>
      <CoverImage size="md" style={styles.featuredImage} uri={soundscape.artwork_url} />
      <View style={styles.featuredScrim} />
      <View style={styles.featuredCopy}>
        <View style={styles.featuredText}>
          <Text numberOfLines={1} style={styles.featuredTitle}>{soundscape.title}</Text>
          <Text style={styles.meta}>{metaFor(soundscape)}</Text>
        </View>
        <View style={styles.playCircle}>
          <Ionicons color={HalcyonColors.background} name="play" size={16} />
        </View>
      </View>
    </View>
  );
}

function AlternativeCard({ soundscape }: { soundscape: Soundscape }) {
  return (
    <View style={styles.alternative}>
      <CoverImage size="sm" style={styles.thumb} uri={soundscape.artwork_url} />
      <View style={styles.alternativeCopy}>
        <Text numberOfLines={1} style={styles.alternativeTitle}>{soundscape.title}</Text>
        <Text numberOfLines={1} style={styles.meta}>{metaFor(soundscape)}</Text>
      </View>
    </View>
  );
}

function RecommendationSkeleton() {
  return (
    <View style={styles.skeletonWrap}>
      <View style={styles.skeletonFeatured} />
      {[0, 1, 2].map((item) => <View key={item} style={styles.skeletonRow} />)}
    </View>
  );
}

function metaFor(soundscape: Soundscape) {
  const mode = soundscape.mode
    ? soundscape.mode.charAt(0).toUpperCase() + soundscape.mode.slice(1)
    : '';
  return [mode, formatDuration(soundscape.duration_seconds)].filter(Boolean).join(' - ');
}

const styles = StyleSheet.create({
  alternative: {
    alignItems: 'center',
    backgroundColor: HalcyonColors.surface,
    borderColor: HalcyonColors.border,
    borderRadius: HalcyonRadius.artwork,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 64,
    overflow: 'hidden',
    padding: 7,
  },
  alternativeCopy: { flex: 1, marginLeft: 11 },
  alternatives: { gap: 8, marginTop: 10 },
  alternativeTitle: {
    color: HalcyonColors.textPrimary,
    fontFamily: AppFonts.sansMedium,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 19,
  },
  empty: {
    alignItems: 'center',
    backgroundColor: HalcyonColors.surface,
    borderColor: HalcyonColors.border,
    borderRadius: HalcyonRadius.card,
    borderWidth: 1,
    marginTop: 24,
    padding: 26,
  },
  emptyBody: {
    color: HalcyonColors.textSecondary,
    fontFamily: AppFonts.sansRegular,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 7,
    textAlign: 'center',
  },
  emptyTitle: {
    color: HalcyonColors.textPrimary,
    fontFamily: AppFonts.displayRegular,
    fontSize: 22,
    lineHeight: 27,
    marginTop: 12,
  },
  eyebrow: {
    color: HalcyonColors.accent,
    fontFamily: AppFonts.sansSemiBold,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1.6,
    marginTop: 10,
    textAlign: 'center',
  },
  featured: {
    backgroundColor: HalcyonColors.surface,
    borderColor: HalcyonColors.accent,
    borderRadius: HalcyonRadius.card,
    borderWidth: 1,
    height: 172,
    marginTop: 22,
    overflow: 'hidden',
  },
  featuredCopy: {
    alignItems: 'flex-end',
    bottom: 0,
    flexDirection: 'row',
    left: 0,
    padding: 16,
    position: 'absolute',
    right: 0,
  },
  featuredImage: { height: '100%', width: '100%' },
  featuredScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(8,8,10,0.38)',
  },
  featuredText: { flex: 1 },
  featuredTitle: {
    color: HalcyonColors.textPrimary,
    fontFamily: AppFonts.displaySemiBold,
    fontSize: 22,
    fontWeight: '600',
    lineHeight: 27,
  },
  footer: { alignItems: 'center', gap: 11 },
  heading: {
    color: HalcyonColors.textPrimary,
    fontFamily: AppFonts.displayRegular,
    fontSize: 31,
    lineHeight: 36,
    marginTop: 4,
    textAlign: 'center',
  },
  imageFallback: { backgroundColor: HalcyonColors.surfaceRaised },
  linkDisabled: { opacity: 0.45 },
  meta: {
    color: HalcyonColors.textSecondary,
    fontFamily: AppFonts.sansRegular,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 3,
  },
  notice: {
    color: HalcyonColors.textPrimary,
    fontFamily: AppFonts.sansRegular,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 12,
    textAlign: 'center',
  },
  playCircle: {
    alignItems: 'center',
    backgroundColor: HalcyonColors.accent,
    borderRadius: 18,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  pressed: { opacity: 0.72 },
  retry: {
    borderColor: HalcyonColors.border,
    borderRadius: 18,
    borderWidth: 1,
    marginTop: 18,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  retryLabel: {
    color: HalcyonColors.accent,
    fontFamily: AppFonts.sansMedium,
    fontSize: 13,
  },
  saveLink: {
    color: HalcyonColors.textSecondary,
    fontFamily: AppFonts.sansRegular,
    fontSize: 12,
    lineHeight: 18,
    textDecorationLine: 'underline',
  },
  skeletonFeatured: {
    backgroundColor: HalcyonColors.skeleton,
    borderRadius: HalcyonRadius.card,
    height: 172,
  },
  skeletonRow: {
    backgroundColor: HalcyonColors.skeleton,
    borderRadius: HalcyonRadius.artwork,
    height: 64,
  },
  skeletonWrap: { gap: 8, marginTop: 22 },
  thumb: {
    borderRadius: 10,
    height: 50,
    width: 64,
  },
});
