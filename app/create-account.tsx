import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { AuthTextField } from '@/components/auth/AuthTextField';
import { LegalDisclaimer } from '@/components/LegalDisclaimer';
import { OnboardingContinueButton } from '@/components/onboarding/OnboardingContinueButton';
import { OnboardingScaffold } from '@/components/onboarding/OnboardingScaffold';
import { HalcyonColors } from '@/constants/design';
import { AppFonts } from '@/constants/theme';
import { signUp } from '@/lib/haven-api';

function firstParam(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? '' : value ?? '';
}

export default function CreateAccountScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string | string[] }>();
  const initialEmail = useMemo(() => firstParam(params.email), [params.email]);
  const [email, setEmail] = useState(initialEmail);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [name, setName] = useState('');

  const handleCreateAccount = async () => {
    if (isSubmitting) return;
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedName = name.trim();

    if (!trimmedName || !trimmedEmail || !password) {
      setErrorMessage('Please fill in your name, email, and password.');
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(trimmedEmail)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters.');
      return;
    }

    setErrorMessage('');
    setIsSubmitting(true);
    try {
      await signUp({ email: trimmedEmail, password, username: trimmedName });
      router.replace({
        pathname: '/verify-email',
        params: { email: trimmedEmail },
      } as never);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Unable to create your account right now.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.keyboardView}>
      <OnboardingScaffold contentContainerStyle={styles.scrollContent} onBack={() => router.back()}>
        <View style={styles.content}>
        <Text style={styles.heading}>Create your account</Text>
        <Text style={styles.subtitle}>Join Passage today.</Text>

        <View style={styles.form}>
          <AuthTextField autoCapitalize={'words'} autoComplete={'name'} onChangeText={setName} placeholder={'Name'} returnKeyType={'next'} value={name} />
          <AuthTextField autoCapitalize={'none'} autoComplete={'email'} keyboardType={'email-address'} onChangeText={setEmail} placeholder={'Email address'} returnKeyType={'next'} value={email} />
          <AuthTextField autoCapitalize={'none'} autoComplete={'new-password'} onChangeText={setPassword} onSubmitEditing={() => void handleCreateAccount()} onToggleSecureText={() => setPasswordVisible((visible) => !visible)} placeholder={'Password'} returnKeyType={'done'} secureTextEntry={!passwordVisible} secureTextVisible={passwordVisible} value={password} />
          {errorMessage ? (
            <Text accessibilityLiveRegion={'polite'} style={styles.errorText}>{errorMessage}</Text>
          ) : null}
          <OnboardingContinueButton label={'Create account'} loading={isSubmitting} onPress={() => void handleCreateAccount()} style={styles.primaryButton} />
        </View>

        <LegalDisclaimer linkStyle={styles.legalLink} style={styles.legal} textStyle={styles.legalText} />

        <Pressable accessibilityRole={'button'} hitSlop={8} onPress={() => router.replace('/login')} style={styles.signInButton}>
          <Text style={styles.signInPrompt}>Already have an account? <Text style={styles.signInLink}>Sign in</Text></Text>
        </Pressable>
        </View>
      </OnboardingScaffold>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  content: {
    alignSelf: 'center',
    maxWidth: 440,
    paddingBottom: 20,
    paddingTop: 22,
    width: '100%',
  },
  errorText: {
    color: '#DFA196',
    fontFamily: AppFonts.sansRegular,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
  form: {
    marginTop: 28,
    rowGap: 12,
  },
  heading: {
    color: HalcyonColors.textPrimary,
    fontFamily: AppFonts.displayRegular,
    fontSize: 36,
    fontWeight: '400',
    lineHeight: 41,
  },
  keyboardView: {
    backgroundColor: HalcyonColors.background,
    flex: 1,
  },
  legal: {
    marginTop: 24,
    paddingHorizontal: 8,
  },
  legalLink: {
    color: HalcyonColors.textPrimary,
    textDecorationLine: 'underline',
  },
  legalText: {
    color: HalcyonColors.textSecondary,
    fontFamily: AppFonts.sansRegular,
    fontSize: 10,
    lineHeight: 16,
    textAlign: 'center',
  },
  primaryButton: { marginTop: 7 },
  scrollContent: { justifyContent: 'center' },
  signInButton: {
    alignItems: 'center',
    marginTop: 20,
    paddingVertical: 6,
  },
  signInLink: {
    color: HalcyonColors.accent,
    fontFamily: AppFonts.sansMedium,
    fontWeight: '500',
  },
  signInPrompt: {
    color: HalcyonColors.textSecondary,
    fontFamily: AppFonts.sansRegular,
    fontSize: 12,
    lineHeight: 18,
  },
  subtitle: {
    color: HalcyonColors.textSecondary,
    fontFamily: AppFonts.sansRegular,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 7,
  },
});
