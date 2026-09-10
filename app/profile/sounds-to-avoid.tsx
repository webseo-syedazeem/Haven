import { useCallback } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { ErrorState } from '@/components/EmptyState';
import { ChipGroup, FilterChip } from '@/components/FilterChip';
import { RequireAuth } from '@/components/RequireAuth';
import { SettingsScreen } from '@/components/SettingsScreen';
import { Toast, useToast } from '@/components/Toast';
import { HalcyonColors } from '@/constants/design';
import { getFilterGroupValues } from '@/constants/filters';
import { AppFonts } from '@/constants/theme';
import { useOptimisticSoundPreferences } from '@/hooks/usePreferences';

/** The same list the Library filter sheet calls "Avoid". */
const AVOIDS = getFilterGroupValues('avoids');

/**
 * R-04. Writes `excluded_sounds` on `PUT /api/preferences/sound` — the same
 * column the Library "Avoid" group and the recommendations endpoint already
 * respect, so an exclusion set here holds everywhere.
 *
 * Chips come from local state and the save is debounced, so a tap lands on the
 * next frame and a burst of them leaves as one request. The body carries the
 * whole row, `preferred_*` included, so saving here never clips what Sound
 * Preferences owns.
 */
function SoundsToAvoidContent() {
  const { notice, showToast } = useToast();
  const { preferences, isInitialLoading, isError, refetch, apply } =
    useOptimisticSoundPreferences({
      onSaveError: () => showToast('Could not save that. Try again.'),
    });

  const excluded = preferences?.excluded_sounds ?? [];

  const toggle = useCallback(
    (value: string) => {
      // Read through the updater rather than the render's copy: taps can come
      // faster than React re-renders, and each one has to build on the last.
      apply((current) => ({
        excluded_sounds: current.excluded_sounds.includes(value)
          ? current.excluded_sounds.filter((entry) => entry !== value)
          : [...current.excluded_sounds, value],
      }));
    },
    [apply]
  );

  const clear = useCallback(() => apply(() => ({ excluded_sounds: [] })), [apply]);

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
        <Text style={styles.explainer}>
          Soundscapes containing these will be hidden from you.
        </Text>

        <View style={styles.chips}>
          <ChipGroup>
            <FilterChip
              icon="checkmark-circle-outline"
              label="None"
              onPress={() => {
                if (excluded.length) clear();
              }}
              selected={excluded.length === 0}
            />
            {AVOIDS.map((value) => (
              <FilterChip
                isExclusion
                key={value}
                label={value}
                onPress={() => toggle(value)}
                selected={excluded.includes(value)}
              />
            ))}
          </ChipGroup>
        </View>

        <Text style={styles.footnote}>
          {excluded.length === 0
            ? 'Nothing is excluded — you will see the whole catalogue.'
            : `${excluded.length} excluded. These also apply to the Library's Avoid filter and to what we recommend.`}
        </Text>
      </>
    );
  };

  return (
    <SettingsScreen
      overlay={<Toast bottom={72} notice={notice} />}
      subtitle="Anything you would rather never hear."
      title="Sounds to Avoid">
      {renderBody()}
    </SettingsScreen>
  );
}

const styles = StyleSheet.create({
  loading: {
    paddingVertical: 64,
  },
  explainer: {
    color: HalcyonColors.textSecondary,
    fontFamily: AppFonts.sansRegular,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 18,
  },
  chips: {
    marginBottom: 18,
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
 * The gate renders SoundsToAvoidContent only once there is a session, so a deep link
 * here while signed out shows the prompt instead of firing a request that can
 * only come back 401.
 */
export default function SoundsToAvoidScreen() {
  return (
    <RequireAuth message="The sounds you leave out are saved to your account.">
      <SoundsToAvoidContent />
    </RequireAuth>
  );
}
