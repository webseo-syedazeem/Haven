import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';

import { ChipGroup, FilterChip } from '@/components/FilterChip';

import { RequireAuth } from '@/components/RequireAuth';
import { FieldError, SettingsField } from '@/components/SettingsField';
import { SettingsPrimaryButton, SettingsScreen } from '@/components/SettingsScreen';
import { SupportSuccess } from '@/components/SupportSuccess';
import { HalcyonColors } from '@/constants/design';
import { MODES } from '@/constants/modes';
import { AppFonts } from '@/constants/theme';
import { useHasSession } from '@/hooks/useSession';
import { useRequestSoundscape } from '@/hooks/useSupport';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * R-12. `POST /api/support/request-soundscape` takes a single `message`, so the
 * chosen modes are appended to the description rather than sent separately.
 *
 * This is also where the Library's empty result sends people — one screen, so a
 * request looks the same however it was started. A `query` param prefills the
 * search that found nothing.
 */
function RequestSoundscapeContent() {
  const router = useRouter();
  const hasSession = useHasSession();
  const params = useLocalSearchParams<{ query?: string }>();
  const request = useRequestSoundscape();

  const [description, setDescription] = useState('');
  const [modes, setModes] = useState<string[]>([]);
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    const query = params.query?.trim();
    if (query) setDescription(`I was looking for “${query}”.`);
  }, [params.query]);

  const toggleMode = (id: string) => {
    setModes((current) =>
      current.includes(id) ? current.filter((entry) => entry !== id) : [...current, id]
    );
  };

  const handleSubmit = () => {
    const cleanDescription = description.trim();
    const cleanEmail = email.trim();

    if (!cleanDescription) {
      setError('Describe what you were hoping to hear.');
      return;
    }

    if (!hasSession && !EMAIL_PATTERN.test(cleanEmail)) {
      setError('Add an email address so we can let you know.');
      return;
    }

    setError(null);

    const modeLabels = MODES.filter((mode) => modes.includes(mode.id)).map((mode) => mode.label);
    const message = modeLabels.length
      ? `${cleanDescription}\n\nFor: ${modeLabels.join(', ')}.`
      : cleanDescription;

    request.mutate(
      { message, contact_email: hasSession ? null : cleanEmail },
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
        backgroundImage={require('@/assets/images/contact-support-top-moonlit-lake-bg.webp')}
        title="Request a Soundscape">
        <SupportSuccess
          message="Thank you. We read every request when we plan what to record next."
          onPrimary={() => router.back()}
          primaryLabel="Done"
          title="Request sent"
        />
      </SettingsScreen>
    );
  }

  return (
    <SettingsScreen
      backgroundImage={require('@/assets/images/contact-support-top-moonlit-lake-bg.webp')}
      title="Request a Soundscape">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Text style={styles.intro}>
          Something missing from the catalogue? Tell us what you were hoping to hear and we will
          consider it for a future recording.
        </Text>

        <SettingsField
          autoCapitalize="sentences"
          label="What should it sound like?"
          maxLength={1000}
          multiline
          onChangeText={setDescription}
          placeholder="A long thunderstorm with heavy rain and no birds…"
          value={description}
        />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What would you use it for?</Text>
          <Text style={styles.sectionHint}>Optional.</Text>
          <ChipGroup>
            {MODES.map((mode) => (
              <FilterChip
                key={mode.id}
                label={mode.label}
                onPress={() => toggleMode(mode.id)}
                selected={modes.includes(mode.id)}
              />
            ))}
          </ChipGroup>
        </View>

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
          disabled={request.isPending}
          label="Send request"
          onPress={handleSubmit}>
          {request.isPending ? <ActivityIndicator color={HalcyonColors.background} /> : undefined}
        </SettingsPrimaryButton>
      </KeyboardAvoidingView>
    </SettingsScreen>
  );
}

export default function RequestSoundscapeScreen() {
  return (
    <RequireAuth message="Soundscape requests are tied to your account.">
      <RequestSoundscapeContent />
    </RequireAuth>
  );
}
const styles = StyleSheet.create({
  intro: {
    color: HalcyonColors.textSecondary,
    fontFamily: AppFonts.sansRegular,
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 20,
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
  },
  sectionHint: {
    color: HalcyonColors.textSecondary,
    fontFamily: AppFonts.sansRegular,
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 12,
    marginTop: 3,
  },
});
