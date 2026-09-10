import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';

import { AuthTextField } from '@/components/auth/AuthTextField';
import { OnboardingContinueButton } from '@/components/onboarding/OnboardingContinueButton';
import { OnboardingScaffold } from '@/components/onboarding/OnboardingScaffold';
import { HalcyonColors } from '@/constants/design';
import { AppFonts } from '@/constants/theme';
import { forgotPassword } from '@/lib/haven-api';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSendResetLink = async () => {
    if (isSubmitting) return;

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      setErrorMessage('Please enter your email address.');
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(trimmedEmail)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setErrorMessage('');
    setIsSubmitting(true);

    try {
      await forgotPassword(trimmedEmail);
      Alert.alert(
        'Reset link sent',
        'Check your inbox for a secure link to choose a new password.'
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Unable to send a reset link right now.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.keyboardView}>
      <OnboardingScaffold
        contentContainerStyle={styles.scrollContent}
        onBack={() => router.back()}>
        <View style={styles.content}>
          <View style={styles.iconCircle}>
            <Ionicons color={HalcyonColors.accent} name="mail-outline" size={27} />
          </View>

          <Text style={styles.heading}>Reset your password</Text>
          <Text style={styles.description}>
            Enter the email address linked to your account and we&apos;ll send you a reset link.
          </Text>

          <View style={styles.form}>
            <AuthTextField
              autoCapitalize="none"
              autoComplete="email"
              error={Boolean(errorMessage)}
              keyboardType="email-address"
              onChangeText={(value) => {
                setEmail(value);
                if (errorMessage) setErrorMessage('');
              }}
              onSubmitEditing={() => void handleSendResetLink()}
              placeholder="Email address"
              returnKeyType="send"
              trailingIcon="mail-outline"
              value={email}
            />

            {errorMessage ? (
              <Text accessibilityLiveRegion="polite" style={styles.errorText}>
                {errorMessage}
              </Text>
            ) : null}

            <OnboardingContinueButton
              label="Send reset link"
              loading={isSubmitting}
              onPress={() => void handleSendResetLink()}
              style={styles.submitButton}
            />
          </View>

          <Text style={styles.helperText}>
            It can take a minute to arrive. Check your spam folder if you don&apos;t see it.
          </Text>
        </View>
      </OnboardingScaffold>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  content: {
    alignSelf: 'center',
    justifyContent: 'center',
    maxWidth: 440,
    paddingBottom: 30,
    width: '100%',
  },
  description: {
    color: HalcyonColors.textSecondary,
    fontFamily: AppFonts.sansRegular,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 10,
    maxWidth: 350,
    textAlign: 'center',
  },
  errorText: {
    color: '#DFA196',
    fontFamily: AppFonts.sansRegular,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
  form: {
    marginTop: 30,
    rowGap: 12,
    width: '100%',
  },
  heading: {
    color: HalcyonColors.textPrimary,
    fontFamily: AppFonts.displayRegular,
    fontSize: 36,
    fontWeight: '400',
    lineHeight: 41,
    marginTop: 24,
    textAlign: 'center',
  },
  helperText: {
    color: HalcyonColors.textSecondary,
    fontFamily: AppFonts.sansRegular,
    fontSize: 11,
    lineHeight: 17,
    marginTop: 18,
    paddingHorizontal: 18,
    textAlign: 'center',
  },
  iconCircle: {
    alignItems: 'center',
    alignSelf: 'center',
    borderColor: HalcyonColors.accent,
    borderRadius: 28,
    borderWidth: 1,
    height: 56,
    justifyContent: 'center',
    width: 56,
  },
  keyboardView: {
    backgroundColor: HalcyonColors.background,
    flex: 1,
  },
  scrollContent: {
    justifyContent: 'center',
  },
  submitButton: {
    marginTop: 5,
  },
});
