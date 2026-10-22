import { useCallback, type ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { ErrorState } from '@/components/EmptyState';
import { ChipGroup, FilterChip } from '@/components/FilterChip';
import { RequireAuth } from '@/components/RequireAuth';
import { SettingsScreen } from '@/components/SettingsScreen';
import { Toast, useToast } from '@/components/Toast';
import { HalcyonColors } from '@/constants/design';
import {
  DETAIL_LEVEL_LABELS,
  DETAIL_LEVEL_VALUES,
  getFilterGroupValues,
  TYPICAL_DURATION_OPTIONS,
} from '@/constants/filters';
import { AppFonts } from '@/constants/theme';
import { useOptimisticSoundPreferences } from '@/hooks/usePreferences';
import type { DetailPreference } from '@/lib/api/preferences';

const ENVIRONMENTS = getFilterGroupValues('environments');
const SOUNDS = getFilterGroupValues('contains');

/**
 * R-03. The same vocabulary the Library filter sheet offers, so a preference
 * set here and a filter set there mean the same thing.
 *
 * Chips come from local state and the save is debounced, so a tap lands on the
 * next frame and a burst of them leaves as one `PUT /api/preferences/sound`.
 * The body carries the whole row, `excluded_sounds` included, so saving here
 * never clips exclusions captured during onboarding.
 */
function SoundPreferencesContent() {
  const { notice, showToast } = useToast();
  const { preferences, isInitialLoading, isError, refetch, apply } =
    useOptimisticSoundPreferences({
      onSaveError: () => showToast('Could not save that. Try again.'),
    });

  const toggleInList = useCallback(
    (field: 'preferred_environments' | 'preferred_sounds', value: string) => {
      // Read through the updater rather than the render's copy: taps can come
      // faster than React re-renders, and each one has to build on the last.
      apply((current) => {
        const list = current[field];

        return {
          [field]: list.includes(value)
            ? list.filter((entry) => entry !== value)
            : [...list, value],
        };
      });
    },
    [apply]
  );

  const toggleDetail = useCallback(
    (value: DetailPreference) => {
      apply((current) => ({
        detail_preference: current.detail_preference === value ? null : value,
      }));
    },
    [apply]
  );

  const toggleDuration = useCallback(
    (value: string) => {
      apply((current) => ({
        typical_duration: current.typical_duration === value ? null : value,
      }));
    },
    [apply]
  );

  const renderBody = () => {
    if (isInitialLoading) {
      return (
        <View style={styles.loading}>
          <ActivityIndicator color={HalcyonColors.accent} />
        </View>
      );
    }

    if (isError || !preferences) {
      return <ErrorState onRetry={() => void refetch()} />;
    }

    return (
      <>
        <Section
          hint="Places you want to hear more of."
          title="Preferred environments">
          <ChipGroup>
            {ENVIRONMENTS.map((value) => (
              <FilterChip
                key={value}
                label={value}
                onPress={() => toggleInList('preferred_environments', value)}
                selected={preferences.preferred_environments.includes(value)}
              />
            ))}
          </ChipGroup>
        </Section>

        <Section hint="Any of these, not all of them." title="Sounds you enjoy">
          <ChipGroup>
            {SOUNDS.map((value) => (
              <FilterChip
                key={value}
                label={value}
                onPress={() => toggleInList('preferred_sounds', value)}
                selected={preferences.preferred_sounds.includes(value)}
              />
            ))}
          </ChipGroup>
        </Section>

        <Section
          hint="How much is happening in a soundscape at once."
          title="Detail preference">
          <ChipGroup>
            {DETAIL_LEVEL_VALUES.map((value) => (
              <FilterChip
                key={value}
                label={DETAIL_LEVEL_LABELS[value]}
                onPress={() => toggleDetail(value as DetailPreference)}
                selected={preferences.detail_preference === value}
              />
            ))}
          </ChipGroup>
        </Section>

        <Section
          hint="Used to put the right lengths in front of you first."
          title="Typical session length">
          <ChipGroup>
            {TYPICAL_DURATION_OPTIONS.map((option) => (
              <FilterChip
                key={option.value}
                label={option.label}
                onPress={() => toggleDuration(option.value)}
                selected={preferences.typical_duration === option.value}
              />
            ))}
          </ChipGroup>
        </Section>

        <Text style={styles.footnote}>
          Saved as you go. Tap a selected chip again to clear it.
        </Text>
      </>
    );
  };

  return (
    <SettingsScreen
      backgroundImage={require('@/assets/images/sound-preferences-top-forest-realistic-final.webp')}
      overlay={<Toast bottom={72} notice={notice} />}
      scrollingBackground
      subtitle="What we lean towards when we choose for you."
      title="Sound Preferences">
      {renderBody()}
    </SettingsScreen>
  );
}

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {!!hint && <Text style={styles.sectionHint}>{hint}</Text>}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  loading: {
    paddingVertical: 64,
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    color: HalcyonColors.textPrimary,
    fontFamily: AppFonts.displaySemiBold,
    fontSize: 19,
    fontWeight: '600',
    lineHeight: 26,
  },
  sectionHint: {
    color: HalcyonColors.textSecondary,
    fontFamily: AppFonts.sansRegular,
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 12,
    marginTop: 3,
  },
  footnote: {
    color: HalcyonColors.textSecondary,
    fontFamily: AppFonts.sansRegular,
    fontSize: 12,
    lineHeight: 17,
    paddingHorizontal: 4,
  },
});

/**
 * The gate renders SoundPreferencesContent only once there is a session, so a deep link
 * here while signed out shows the prompt instead of firing a request that can
 * only come back 401.
 */
export default function SoundPreferencesScreen() {
  return (
    <RequireAuth message="Sound preferences live on your account, so they follow you to every device.">
      <SoundPreferencesContent />
    </RequireAuth>
  );
}
