import * as Linking from 'expo-linking';
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

import { AuthLegalFooter } from '@/components/auth/AuthLegalFooter';
import { AuthTextField } from '@/components/auth/AuthTextField';
import { OnboardingContinueButton } from '@/components/onboarding/OnboardingContinueButton';
import { OnboardingScaffold } from '@/components/onboarding/OnboardingScaffold';
import { HalcyonColors, Typography } from '@/constants/design';
import { AppFonts } from '@/constants/theme';
import {
  emailIssue,
  nameIssue,
  parseAuthError,
  passwordIssue,
  type AuthFieldErrors,
} from '@/lib/auth/form-errors';
import { signUp } from '@/lib/haven-api';
import { safeGoBack } from '@/lib/navigation';

const background = require('@/assets/images/create-account-moonlit-lake-background.webp');

function firstParam(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? '' : value ?? '';
}

export default function CreateAccountScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string | string[] }>();
  const initialEmail = useMemo(() => firstParam(params.email), [params.email]);
  const [email, setEmail] = useState(initialEmail);
  const [errorMessage, setErrorMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState<AuthFieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [name, setName] = useState('');

  const clearFieldError = (field: string) => {
    if (fieldErrors[field]) setFieldErrors((current) => ({ ...current, [field]: '' }));
  };

  const handleCreateAccount = async () => {
    if (isSubmitting) return;
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedName = name.trim();

    const nextFieldErrors: AuthFieldErrors = {};
    const usernameError = nameIssue(trimmedName, 'username', 2);
    const emailError = emailIssue(trimmedEmail);
    const passwordError = passwordIssue(password, 'password', true);
    if (usernameError) nextFieldErrors.username = usernameError;
    if (emailError) nextFieldErrors.email = emailError;
    if (passwordError) nextFieldErrors.password = passwordError;

    if (Object.keys(nextFieldErrors).length) {
      setFieldErrors(nextFieldErrors);
      setErrorMessage('Please provide valid signup details');
      return;
    }

    setErrorMessage('');
    setFieldErrors({});
    setIsSubmitting(true);
    try {
      await signUp({
        email: trimmedEmail,
        password,
        username: trimmedName,
        emailRedirectTo: Linking.createURL('auth/callback', {
          queryParams: { flow: 'signup' },
        }),
      });
      router.replace({
        pathname: '/verify-email',
        params: { email: trimmedEmail },
      } as never);
    } catch (error) {
      const parsed = parseAuthError(error, 'Unable to create your account right now.');
      const nextErrors = { ...parsed.fields };
      if (parsed.code === 'EMAIL_ALREADY_REGISTERED' && !nextErrors.email) {
        nextErrors.email = parsed.message;
      }
      setFieldErrors(nextErrors);
      setErrorMessage(parsed.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.keyboardView}>
      <OnboardingScaffold
        backgroundImage={background}
        backgroundOverlayColor="rgba(7, 11, 16, 0.30)"
        contentContainerStyle={styles.scrollContent}
        footer={<AuthLegalFooter />}
        onBack={() => safeGoBack(router)}>
        <View style={styles.content}>
        <Text style={styles.heading}>Create your account</Text>
        <Text style={styles.subtitle}>Join Passage today.</Text>

        <View style={styles.form}>
          <AuthTextField
            autoCapitalize={'words'}
            autoComplete={'name'}
            errorMessage={fieldErrors.username}
            onChangeText={(value) => {
              setName(value);
              if (fieldErrors.username) {
                setFieldErrors((current) => ({ ...current, username: '' }));
              }
            }}
            placeholder={'Name'}
            returnKeyType={'next'}
            value={name}
          />
          <AuthTextField autoCapitalize={'none'} autoComplete={'email'} errorMessage={fieldErrors.email} keyboardType={'email-address'} onChangeText={(value) => { setEmail(value); clearFieldError('email'); }} placeholder={'Email address'} returnKeyType={'next'} value={email} />
          <AuthTextField autoCapitalize={'none'} autoComplete={'new-password'} errorMessage={fieldErrors.password} onChangeText={(value) => { setPassword(value); clearFieldError('password'); }} onSubmitEditing={() => void handleCreateAccount()} onToggleSecureText={() => setPasswordVisible((visible) => !visible)} placeholder={'Password'} returnKeyType={'done'} secureTextEntry={!passwordVisible} secureTextVisible={passwordVisible} value={password} />
          {errorMessage ? (
            <Text accessibilityLiveRegion={'polite'} style={styles.errorText}>{errorMessage}</Text>
          ) : null}
          <OnboardingContinueButton label={'Create account'} loading={isSubmitting} onPress={() => void handleCreateAccount()} style={styles.primaryButton} />
        </View>

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
    ...Typography.screenHeading,
    color: HalcyonColors.textPrimary,
    textAlign: 'center',
  },
  keyboardView: {
    backgroundColor: HalcyonColors.background,
    flex: 1,
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
    fontFamily: AppFonts.sansSemiBold,
    fontWeight: '600',
  },
  signInPrompt: {
    color: 'rgba(255, 255, 255, 0.72)',
    fontFamily: AppFonts.sansRegular,
    fontSize: 15,
    lineHeight: 22,
  },
  subtitle: {
    ...Typography.body,
    color: 'rgba(255, 255, 255, 0.72)',
    marginTop: 8,
    textAlign: 'center',
  },
});
