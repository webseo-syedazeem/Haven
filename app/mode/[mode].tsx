import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { OnboardingBackButton } from '@/components/onboarding/OnboardingBackButton';
import { SectionRail } from '@/components/SectionRail';
import { SoundscapeCard } from '@/components/SoundscapeCard';
import {
  HalcyonCardGradient,
  HalcyonCardGradientLocations,
  HalcyonColors,
  HalcyonRadius,
  HalcyonSpacing,
} from '@/constants/design';
import { getModeConfig, MODES, type ModeId } from '@/constants/modes';
import { AppFonts } from '@/constants/theme';
import { useModeSections } from '@/hooks/useCatalogue';
import type { Soundscape } from '@/lib/api/home';
import { usePlayerActions } from '@/lib/player/PlayerProvider';

/**
 * Mode hub: every live soundscape for the mode, grouped into the approved
 * subcategories. A subcategory with nothing in it is never rendered, so no row
 * is ever a dead end. "See all" expands that subcategory into a grid in place
 * rather than pushing a near duplicate list screen.
 */
export default function ModeHubScreen() {
  const router = useRouter();
  const { mode: modeParam } = useLocalSearchParams<{ mode?: string }>();
  const mode = getModeConfig(modeParam) ?? MODES[0];
  const modeId = mode.id as ModeId;

  const { sections, totalCount, isLoading, isError, refetch, isRefetching } =
    useModeSections(modeId);
  const { playSoundscape } = usePlayerActions();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const openSoundscape = useCallback(
    (soundscape: Soundscape) => router.push(`/soundscape/${soundscape.id}` as Href),
    [router]
  );

  const toggleExpanded = useCallback(
    (key: string) => setExpanded((current) => ({ ...current, [key]: !current[key] })),
    []
  );

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <LinearGradient colors={mode.gradient} style={StyleSheet.absoluteFill} />
          <Image
            contentFit="cover"
            contentPosition={mode.artworkPosition ?? 'center'}
            source={mode.artwork}
            style={StyleSheet.absoluteFill}
            transition={220}
          />
          <LinearGradient
            colors={HalcyonCardGradient as unknown as readonly [string, string, ...string[]]}
            locations={
              HalcyonCardGradientLocations as unknown as readonly [number, number, ...number[]]
            }
            style={StyleSheet.absoluteFill}
          />
          <SafeAreaView edges={['top']} style={styles.heroSafeArea}>
            <OnboardingBackButton
              onPress={() => router.back()}
              style={styles.backButton}
            />
            <View style={styles.heroCopy}>
              <Text style={styles.heroTitle}>{mode.label.toUpperCase()}</Text>
              <Text style={styles.heroTagline}>{mode.tagline}</Text>
            </View>
          </SafeAreaView>
        </View>

        <Text style={styles.description}>{mode.description}</Text>

        {isLoading ? (
          <>
            <HubSectionSkeleton />
            <HubSectionSkeleton />
          </>
        ) : isError && sections.length === 0 ? (
          <View style={styles.stateBlock}>
            <Text style={styles.stateTitle}>We couldn&apos;t load this mode.</Text>
            <Text style={styles.stateBody}>Check your connection and try again.</Text>
            <Pressable
              accessibilityLabel="Try again"
              accessibilityRole="button"
              disabled={isRefetching}
              onPress={() => void refetch()}
              style={({ pressed }) => [styles.retryButton, pressed && styles.pressed]}>
              <Text style={styles.retryLabel}>{isRefetching ? 'Loading…' : 'Try again'}</Text>
            </Pressable>
          </View>
        ) : totalCount === 0 ? (
          <View style={styles.stateBlock}>
            <Text style={styles.stateTitle}>No soundscapes here yet.</Text>
            <Text style={styles.stateBody}>
              New {mode.label.toLowerCase()} places are added as the catalogue grows.
            </Text>
          </View>
        ) : (
          sections.map((section) => {
            const isExpanded = !!expanded[section.key];

            return (
              <SectionRail<Soundscape>
                data={section.items}
                key={section.key}
                keyExtractor={(item, index) => item.id ?? `${index}`}
                layout={isExpanded ? 'grid' : 'rail'}
                onSeeAll={section.items.length > 2 ? () => toggleExpanded(section.key) : undefined}
                renderItem={(soundscape) => (
                  <SoundscapeCard
                    onPlay={(item) => void playSoundscape(item, { queue: section.items })}
                    onPress={openSoundscape}
                    soundscape={soundscape}
                  />
                )}
                seeAllLabel={isExpanded ? 'Show less' : 'See all'}
                title={section.title}
              />
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

/** Placeholder shaped like a subcategory rail, shown while the hub loads. */
function HubSectionSkeleton() {
  return (
    <View style={styles.skeletonSection}>
      <View style={styles.skeletonHeading} />
      <View style={styles.skeletonRow}>
        {[0, 1, 2].map((index) => (
          <View key={index}>
            <View style={styles.skeletonCard} />
            <View style={[styles.skeletonLine, styles.skeletonLineWide]} />
            <View style={[styles.skeletonLine, styles.skeletonLineNarrow]} />
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: HalcyonColors.background,
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingBottom: 48,
  },
  hero: {
    justifyContent: 'flex-end',
    minHeight: 260,
    overflow: 'hidden',
  },
  heroSafeArea: {
    flex: 1,
    justifyContent: 'space-between',
  },
  backButton: {
    marginLeft: HalcyonSpacing.screenX,
    marginTop: 12,
  },
  pressed: {
    opacity: 0.82,
  },
  heroCopy: {
    paddingBottom: 22,
    paddingHorizontal: HalcyonSpacing.screenX,
    paddingTop: 56,
  },
  heroTitle: {
    color: HalcyonColors.textPrimary,
    fontFamily: AppFonts.displayRegular,
    fontSize: 46,
    letterSpacing: 1.5,
    lineHeight: 54,
  },
  heroTagline: {
    color: 'rgba(241,236,227,0.82)',
    fontFamily: AppFonts.sansRegular,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 2,
  },
  description: {
    color: HalcyonColors.textSecondary,
    fontFamily: AppFonts.sansRegular,
    fontSize: 15,
    lineHeight: 24,
    paddingHorizontal: HalcyonSpacing.screenX,
    paddingTop: 22,
  },
  stateBlock: {
    alignItems: 'flex-start',
    paddingHorizontal: HalcyonSpacing.screenX,
    paddingTop: 36,
  },
  stateTitle: {
    color: HalcyonColors.textPrimary,
    fontFamily: AppFonts.displaySemiBold,
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 28,
  },
  stateBody: {
    color: HalcyonColors.textSecondary,
    fontFamily: AppFonts.sansRegular,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 6,
  },
  retryButton: {
    borderColor: HalcyonColors.border,
    borderRadius: HalcyonRadius.pill,
    borderWidth: 1,
    marginTop: 18,
    paddingHorizontal: 26,
    paddingVertical: 12,
  },
  retryLabel: {
    color: HalcyonColors.textPrimary,
    fontFamily: AppFonts.sansMedium,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  skeletonSection: {
    marginTop: HalcyonSpacing.section,
  },
  skeletonHeading: {
    backgroundColor: HalcyonColors.skeleton,
    borderRadius: 6,
    height: 20,
    marginBottom: 16,
    marginHorizontal: HalcyonSpacing.screenX,
    width: 168,
  },
  skeletonRow: {
    columnGap: 14,
    flexDirection: 'row',
    paddingHorizontal: HalcyonSpacing.screenX,
  },
  skeletonCard: {
    backgroundColor: HalcyonColors.skeleton,
    borderRadius: 14,
    height: 132,
    width: 132,
  },
  skeletonLine: {
    backgroundColor: HalcyonColors.skeleton,
    borderRadius: 4,
    height: 10,
  },
  skeletonLineWide: {
    marginTop: 12,
    width: 104,
  },
  skeletonLineNarrow: {
    marginTop: 6,
    width: 62,
  },
});
