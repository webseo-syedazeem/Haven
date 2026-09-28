import { useFocusEffect } from '@react-navigation/native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  BackHandler,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { AuthSocialButton } from '@/components/auth/AuthSocialButton';
import { AuthLegalFooter } from '@/components/auth/AuthLegalFooter';
import { AuthTextField } from '@/components/auth/AuthTextField';
import { OnboardingContinueButton } from '@/components/onboarding/OnboardingContinueButton';
import { OnboardingScaffold } from '@/components/onboarding/OnboardingScaffold';
import { HalcyonColors, Typography } from '@/constants/design';
import { AppFonts } from '@/constants/theme';
import { signInWithApple } from '@/lib/apple-auth';
import { signInWithGoogle } from '@/lib/google-auth';
import { signIn } from '@/lib/haven-api';
import {
  emailIssue,
  parseAuthError,
  passwordIssue,
  type AuthFieldErrors,
} from '@/lib/auth/form-errors';
import { routeAfterSignIn } from '@/lib/auth/onboarding-routing';
import { resetToMainApp, safeGoBack } from '@/lib/navigation';

const appleIcon = require('@/assets/icons/apple icon.png');
const googleIcon = require('@/assets/icons/google icon.png');

export default function LoginScreen() {
  const router = useRouter();
  const { signedOut, launch, from } = useLocalSearchParams<{
    signedOut?: string;
    launch?: string;
    from?: string;
  }>();
  // A user who just signed out has to sign back in or sign up — there is
  // nothing behind this screen worth going back to.
  // Opened straight from the first screen (or as the launch landing): nothing
  // meaningful is behind it, so back leaves the app.
  const isLaunchLanding = launch === '1' || from === 'intro' || signedOut === '1';
  const canGoBack = !isLaunchLanding;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState<AuthFieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Back returns to whichever screen opened Login (Arrival, or Save your space),
  // never to the start of onboarding.
  const goBack = useCallback(() => safeGoBack(router), [router]);

  useFocusEffect(useCallback(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      // The launch landing has nothing behind it, so back leaves the app.
      if (isLaunchLanding) {
        BackHandler.exitApp();
        return true;
      }
      if (!canGoBack) return true;
      goBack();
      return true;
    });
    return () => subscription.remove();
  }, [canGoBack, goBack, isLaunchLanding]));

  const finishAuthentication = async () => {
    await routeAfterSignIn(router);
  };

  const handleLogin = async () => {
    if (isSubmitting) return;
    const trimmedEmail = email.trim();
    const nextFieldErrors: AuthFieldErrors = {};
    const emailError = emailIssue(trimmedEmail);
    const passwordError = passwordIssue(password, 'password', false);
    if (emailError) nextFieldErrors.email = emailError;
    if (passwordError) nextFieldErrors.password = passwordError;
    if (Object.keys(nextFieldErrors).length) {
      setFieldErrors(nextFieldErrors);
      setErrorMessage('Please provide a valid email and password');
      return;
    }
    setErrorMessage('');
    setFieldErrors({});
    setIsSubmitting(true);
    let signedIn = false;
    try {
      await signIn({ email: trimmedEmail, password });
      signedIn = true;
      await finishAuthentication();
    } catch (error) {
      if (signedIn) {
        console.warn('[auth] finishing sign in failed; continuing to the app', error);
        resetToMainApp(router);
        return;
      }
      const parsed = parseAuthError(error, 'Unable to sign in right now.');
      setFieldErrors(parsed.fields);
      setErrorMessage(parsed.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGooglePress = async () => {
    if (isSubmitting) return;
    setErrorMessage('');
    setIsSubmitting(true);
    let signedIn = false;
    try {
      const result = await signInWithGoogle();
      if (result?.session?.access_token) {
        signedIn = true;
        await finishAuthentication();
      }
    } catch (error) {
      if (signedIn) {
        console.warn('[auth] finishing Google sign in failed; continuing to the app', error);
        resetToMainApp(router);
        return;
      }
      setErrorMessage(
        error instanceof Error ? error.message : 'Google sign in failed.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApplePress = async () => {
    if (isSubmitting) return;
    setErrorMessage('');
    setIsSubmitting(true);
    let signedIn = false;
    try {
      const result = await signInWithApple();
      if (result?.session?.access_token) {
        signedIn = true;
        await finishAuthentication();
      }
    } catch (error) {
      if (signedIn) {
        console.warn('[auth] finishing Apple sign in failed; continuing to the app', error);
        resetToMainApp(router);
        return;
      }
      setErrorMessage(
        error instanceof Error ? error.message : 'Apple sign in failed.'
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
        // No on-screen back arrow; the hardware back button is handled above.
        footer={<AuthLegalFooter />}>
        <View style={styles.content}>
        <Text style={styles.heading}>Welcome back</Text>
        <Text style={styles.subtitle}>Sign in to continue your journey.</Text>
        <View style={styles.form}>
          <AuthTextField autoCapitalize={'none'} autoComplete={'email'} editable={!isSubmitting} errorMessage={fieldErrors.email} keyboardType={'email-address'} onChangeText={(value) => { setEmail(value); setFieldErrors((current) => ({ ...current, email: '' })); }} placeholder={'Email address'} returnKeyType={'next'} value={email} />
          <AuthTextField autoCapitalize={'none'} autoComplete={'password'} editable={!isSubmitting} errorMessage={fieldErrors.password} onChangeText={(value) => { setPassword(value); setFieldErrors((current) => ({ ...current, password: '' })); }} onSubmitEditing={() => void handleLogin()} onToggleSecureText={() => setPasswordVisible((visible) => !visible)} placeholder={'Password'} returnKeyType={'done'} secureTextEntry={!passwordVisible} secureTextVisible={passwordVisible} value={password} />
          <Pressable accessibilityRole={'button'} hitSlop={8} onPress={() => router.push('/reset-password')} style={styles.forgotButton}>
            <Text style={styles.forgotText}>Forgot password?</Text>
          </Pressable>
          {errorMessage ? <Text accessibilityLiveRegion={'polite'} style={styles.errorText}>{errorMessage}</Text> : null}
          <OnboardingContinueButton label={'Sign in'} loading={isSubmitting} onPress={() => void handleLogin()} style={styles.primaryButton} />
        </View>
        <View style={styles.dividerRow}><View style={styles.divider} /><Text style={styles.dividerText}>or</Text><View style={styles.divider} /></View>
        <View style={styles.socialButtons}>
          <AuthSocialButton disabled={isSubmitting} icon={appleIcon} label={'Continue with Apple'} onPress={() => void handleApplePress()} />
          <AuthSocialButton disabled={isSubmitting} icon={googleIcon} label={'Continue with Google'} onPress={() => void handleGooglePress()} />
        </View>
        <Pressable accessibilityRole={'button'} hitSlop={8} onPress={() => router.push('/welcome')} style={styles.signupButton}>
          <Text style={styles.signupPrompt}>Don&apos;t have an account? <Text style={styles.signupLink}>Sign up</Text></Text>
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
    paddingBottom: 18,
    paddingTop: 22,
    width: '100%',
  },
  divider: {
    backgroundColor: HalcyonColors.border,
    flex: 1,
    height: 1,
  },
  dividerRow: {
    alignItems: 'center',
    columnGap: 12,
    flexDirection: 'row',
    marginTop: 24,
  },
  dividerText: {
    color: HalcyonColors.textSecondary,
    fontFamily: AppFonts.sansRegular,
    fontSize: 12,
    lineHeight: 18,
  },
  errorText: {
    color: '#DFA196',
    fontFamily: AppFonts.sansRegular,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
  forgotButton: {
    alignSelf: 'flex-end',
    marginTop: -2,
    paddingVertical: 2,
  },
  forgotText: {
    color: 'rgba(255, 255, 255, 0.72)',
    fontFamily: AppFonts.sansMedium,
    fontSize: 14,
    lineHeight: 20,
    textDecorationLine: 'underline',
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
  primaryButton: { marginTop: 6 },
  scrollContent: { justifyContent: 'center' },
  signupButton: {
    alignItems: 'center',
    marginTop: 24,
    paddingVertical: 6,
  },
  signupLink: {
    color: HalcyonColors.accent,
    fontFamily: AppFonts.sansSemiBold,
    fontWeight: '600',
  },
  signupPrompt: {
    color: 'rgba(255, 255, 255, 0.72)',
    fontFamily: AppFonts.sansRegular,
    fontSize: 15,
    lineHeight: 22,
  },
  socialButtons: {
    marginTop: 18,
    rowGap: 10,
  },
  subtitle: {
    ...Typography.body,
    color: HalcyonColors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
});
