import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, StyleSheet, Text } from 'react-native';

import { RequireAuth } from '@/components/RequireAuth';

import { FieldError, SettingsField } from '@/components/SettingsField';
import { SettingsPrimaryButton, SettingsScreen } from '@/components/SettingsScreen';
import { SupportSuccess } from '@/components/SupportSuccess';
import { PassageColors } from '@/constants/design';
import { AppFonts } from '@/constants/theme';
import { useHasSession } from '@/hooks/useSession';
import { useContactSupport } from '@/hooks/useSupport';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * R-10. `POST /api/support/contact` needs a `message`; `subject` is optional.
 * Auth is optional too, but a guest must supply `contact_email`, so the email
 * field only appears when there is no session to identify the sender.
 */
function ContactSupportContent() {
  const router = useRouter();
  const hasSession = useHasSession();
  const contact = useContactSupport();

  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const handleSubmit = () => {
    const cleanMessage = message.trim();
    const cleanEmail = email.trim();

    if (!cleanMessage) {
      setError('Tell us what is going on and we will take a look.');
      return;
    }

    if (!hasSession && !EMAIL_PATTERN.test(cleanEmail)) {
      setError('Add an email address so we can reply.');
      return;
    }

    setError(null);

    contact.mutate(
      {
        subject: subject.trim() || null,
        message: cleanMessage,
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
        backgroundImage={require('@/assets/images/contact-winter-robin-v2.webp')}
        title="Contact Support">
        <SupportSuccess
          message="We usually reply within a couple of days."
          onPrimary={() => router.back()}
          onSecondary={() => {
            setSent(false);
            setSubject('');
            setMessage('');
          }}
          primaryLabel="Done"
          secondaryLabel="Send another message"
          title="Message sent"
        />
      </SettingsScreen>
    );
  }

  return (
    <SettingsScreen
      backgroundImage={require('@/assets/images/contact-winter-robin-v2.webp')}
      subtitle="Tell us what happened and we will help."
      title="Contact Support">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <SettingsField
          autoCapitalize="sentences"
          label="Subject"
          maxLength={120}
          onChangeText={setSubject}
          placeholder="What is this about?"
          returnKeyType="next"
          value={subject}
        />

        <SettingsField
          autoCapitalize="sentences"
          label="Message"
          maxLength={2000}
          multiline
          onChangeText={setMessage}
          placeholder="The timer stops early when…"
          value={message}
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
          disabled={contact.isPending}
          label="Send message"
          onPress={handleSubmit}>
          {contact.isPending ? <ActivityIndicator color={PassageColors.background} /> : undefined}
        </SettingsPrimaryButton>

        <Text style={styles.footnote}>We usually reply within a couple of days.</Text>
      </KeyboardAvoidingView>
    </SettingsScreen>
  );
}

export default function ContactSupportScreen() {
  return (
    <RequireAuth message="Support requests are tied to your account.">
      <ContactSupportContent />
    </RequireAuth>
  );
}
const styles = StyleSheet.create({
  footnote: {
    color: PassageColors.textSecondary,
    fontFamily: AppFonts.sansRegular,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 14,
    textAlign: 'center',
  },
});
