import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { ChipGroup, FilterChip } from '@/components/FilterChip';

import { RequireAuth } from '@/components/RequireAuth';
import { FieldError, SettingsField } from '@/components/SettingsField';
import { SettingsPrimaryButton, SettingsScreen } from '@/components/SettingsScreen';
import { SupportSuccess } from '@/components/SupportSuccess';
import { HalcyonColors, HalcyonRadius } from '@/constants/design';
import { AppFonts } from '@/constants/theme';
import { useSoundscape } from '@/hooks/useHome';
import { usePlayHistory } from '@/hooks/usePlayHistory';
import { useHasSession } from '@/hooks/useSession';
import { useReportAudioProblem } from '@/hooks/useSupport';
import { formatDuration } from '@/lib/utils/duration';

const REASONS = ['Audio cuts out', 'Wrong sounds', 'Poor quality', "Won't play"] as const;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * R-11. `POST /api/support/report-audio-problem` needs a `soundscape_id` that
 * exists, and takes one free-text `message` — there is no structured reason
 * field — so the chosen reasons are written into the top of the message and the
 * details follow.
 *
 * The soundscape normally arrives as a route param from the player or detail
 * overflow menu. Reached from the Help Centre with nothing selected, the screen
 * offers the most recently played soundscapes to pick from instead of
 * dead-ending.
 */
function ReportProblemContent() {
  const router = useRouter();
  const hasSession = useHasSession();
  const params = useLocalSearchParams<{ soundscapeId?: string }>();

  const [selectedId, setSelectedId] = useState(params.soundscapeId ?? '');
  const [reasons, setReasons] = useState<string[]>([]);
  const [details, setDetails] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const report = useReportAudioProblem();
  const { data: soundscape, isInitialLoading } = useSoundscape(selectedId || undefined);
  const history = usePlayHistory();

  /** Newest first, one entry per soundscape. */
  const recent = useMemo(() => {
    const seen = new Set<string>();
    const rows = [];

    for (const entry of history.data ?? []) {
      if (!entry.soundscape || seen.has(entry.soundscape_id)) continue;
      seen.add(entry.soundscape_id);
      rows.push(entry.soundscape);
      if (rows.length === 6) break;
    }

    return rows;
  }, [history.data]);

  const toggleReason = (value: string) => {
    setReasons((current) =>
      current.includes(value) ? current.filter((entry) => entry !== value) : [...current, value]
    );
  };

  const handleSubmit = () => {
    const cleanEmail = email.trim();

    if (!selectedId) {
      setError('Choose which soundscape had the problem.');
      return;
    }

    if (!reasons.length && !details.trim()) {
      setError('Pick what went wrong, or describe it below.');
      return;
    }

    if (!hasSession && !EMAIL_PATTERN.test(cleanEmail)) {
      setError('Add an email address so we can follow up.');
      return;
    }

    setError(null);

    const message = [
      reasons.length ? `Reported: ${reasons.join(', ')}.` : null,
      details.trim() || null,
    ]
      .filter(Boolean)
      .join('\n\n');

    report.mutate(
      {
        soundscape_id: selectedId,
        message,
        contact_email: hasSession ? null : cleanEmail,
      },
      {
        onSuccess: () => setSent(true),
        onError: (submitError) =>
          setError(
            submitError instanceof Error
              ? submitError.message
              : 'Could not send that. Try again in a moment.'
          ),
      }
    );
  };

  if (sent) {
    return (
      <SettingsScreen
        backgroundImage={require('@/assets/images/support-top-lake-realistic-final.webp')}
        scrollingBackground
        title="Report a Problem">
        <SupportSuccess
          message="Thank you. We will listen back and fix what we find."
          onPrimary={() => router.back()}
          primaryLabel="Done"
          title="Report sent"
        />
      </SettingsScreen>
    );
  }

  return (
    <SettingsScreen
      backgroundImage={require('@/assets/images/support-top-lake-realistic-final.webp')}
      scrollingBackground
      subtitle="Tell us what went wrong and we will listen back."
      title="Report a Problem">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {selectedId ? (
          <View style={styles.soundscapeCard}>
            {soundscape?.artwork_url ? (
              <Image
                contentFit="cover"
                cachePolicy="memory-disk"
                source={{ uri: soundscape.artwork_url }}
                style={styles.artwork}
                transition={200}
              />
            ) : (
              <View style={[styles.artwork, styles.artworkFallback]} />
            )}

            <View style={styles.soundscapeCopy}>
              <Text numberOfLines={2} style={styles.soundscapeTitle}>
                {soundscape?.title ?? (isInitialLoading ? 'Loading…' : 'Selected soundscape')}
              </Text>
              {!!soundscape?.duration_seconds && (
                <Text style={styles.soundscapeMeta}>
                  {formatDuration(soundscape.duration_seconds)}
                </Text>
              )}
            </View>

            {!params.soundscapeId && (
              <Pressable
                accessibilityLabel="Choose a different soundscape"
                accessibilityRole="button"
                onPress={() => setSelectedId('')}
                style={({ pressed }) => pressed && styles.pressed}>
                <Text style={styles.changeLabel}>Change</Text>
              </Pressable>
            )}
          </View>
        ) : (
          <View style={styles.picker}>
            <Text style={styles.sectionTitle}>Which soundscape?</Text>
            {history.isInitialLoading ? (
              <ActivityIndicator color={HalcyonColors.accent} style={styles.pickerLoading} />
            ) : recent.length ? (
              <ChipGroup>
                {recent.map((item) => (
                  <FilterChip
                    key={item.id}
                    label={item.short_title?.trim() || item.title}
                    onPress={() => setSelectedId(item.id)}
                  />
                ))}
              </ChipGroup>
            ) : (
              <Text style={styles.pickerEmpty}>
                Open the soundscape and choose “Report a problem” from its menu, and it will be
                attached here automatically.
              </Text>
            )}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What went wrong?</Text>
          <ChipGroup>
            {REASONS.map((reason) => (
              <FilterChip
                key={reason}
                label={reason}
                onPress={() => toggleReason(reason)}
                selected={reasons.includes(reason)}
              />
            ))}
          </ChipGroup>
        </View>

        <SettingsField
          autoCapitalize="sentences"
          label="Details"
          maxLength={2000}
          multiline
          onChangeText={setDetails}
          placeholder="It stopped about ten minutes in…"
          value={details}
        />

        {!hasSession && (
          <SettingsField
            autoCapitalize="none"
            autoCorrect={false}
            hint="You are not signed in, so we need somewhere to send our reply."
            keyboardType="email-address"
            label="Your email"
            onChangeText={setEmail}
            placeholder="you@example.com"
            value={email}
          />
        )}

        <FieldError message={error} />

        <SettingsPrimaryButton
          disabled={report.isPending}
          label="Send report"
          onPress={handleSubmit}>
          {report.isPending ? <ActivityIndicator color={HalcyonColors.background} /> : undefined}
        </SettingsPrimaryButton>
      </KeyboardAvoidingView>
    </SettingsScreen>
  );
}

export default function ReportProblemScreen() {
  return (
    <RequireAuth message="Audio problem reports are tied to your account.">
      <ReportProblemContent />
    </RequireAuth>
  );
}
const styles = StyleSheet.create({
  soundscapeCard: {
    alignItems: 'center',
    backgroundColor: HalcyonColors.surface,
    borderColor: HalcyonColors.border,
    borderRadius: HalcyonRadius.card,
    borderWidth: 1,
    columnGap: 14,
    flexDirection: 'row',
    marginBottom: 22,
    padding: 12,
  },
  artwork: {
    borderRadius: 10,
    height: 56,
    width: 56,
  },
  artworkFallback: {
    backgroundColor: HalcyonColors.skeleton,
  },
  soundscapeCopy: {
    flex: 1,
  },
  soundscapeTitle: {
    color: HalcyonColors.textPrimary,
    fontFamily: AppFonts.sansMedium,
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 21,
  },
  soundscapeMeta: {
    color: HalcyonColors.textSecondary,
    fontFamily: AppFonts.sansRegular,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 2,
  },
  changeLabel: {
    color: HalcyonColors.accent,
    fontFamily: AppFonts.sansMedium,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  pressed: {
    opacity: 0.75,
  },
  picker: {
    marginBottom: 24,
  },
  pickerLoading: {
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  pickerEmpty: {
    color: HalcyonColors.textSecondary,
    fontFamily: AppFonts.sansRegular,
    fontSize: 13,
    lineHeight: 19,
  },
  section: {
    marginBottom: 22,
  },
  sectionTitle: {
    color: HalcyonColors.textPrimary,
    fontFamily: AppFonts.displaySemiBold,
    fontSize: 19,
    fontWeight: '600',
    lineHeight: 26,
    marginBottom: 12,
  },
});
