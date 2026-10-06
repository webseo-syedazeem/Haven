import { useFocusEffect } from '@react-navigation/native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
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
import { clearIntroSeen } from '@/lib/auth/intro-flag';
import { endExplicitSignOut } from '@/lib/auth/session-state';
import { resetToMainApp, safeGoBack } from '@/lib/navigation';

const appleIcon = require('@/assets/icons/apple icon.png');
const googleIcon = require('@/assets/icons/google icon.png');
const background = require('@/assets/images/welcome-back-moonlit-lake-background.webp');

export default function LoginScreen() {
  const router = useRouter();
  const { signedOut, from, launch } = useLocalSearchParams<{
    signedOut?: string;
    from?: string;
    launch?: string;
  }>();
  const isFromIntro = from === 'intro';
  const isSignedOut = signedOut === '1';
  const isSignedOutLaunch = launch === '1';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState<AuthFieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Signals that whichever navigation got here (the explicit sign-out's own
  // replace, or the tabs layout's automatic redirect) has landed, so a later,
  // unrelated session expiry can still trigger that automatic redirect.
  useEffect(() => {
    endExplicitSignOut();
  }, []);

  const goBack = useCallback(() => {
    if (isFromIntro || isSignedOut || isSignedOutLaunch) {
      void clearIntroSeen().then(() => router.replace('/?reset=1'));
    } else {
      safeGoBack(router);
    }
  }, [isFromIntro, isSignedOut, isSignedOutLaunch, router]);

  useFocusEffect(useCallback(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      goBack();
      return true;
    });
    return () => subscription.remove();
  }, [goBack]));

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
        backgroundImage={background}
        backgroundOverlayColor="rgba(7, 11, 16, 0.30)"
        contentContainerStyle={styles.scrollContent}
        footer={<AuthLegalFooter />}
        onBack={goBack}>
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
    color: 'rgba(255, 255, 255, 0.72)',
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
    color: 'rgba(255, 255, 255, 0.72)',
    marginTop: 8,
    textAlign: 'center',
  },
});
