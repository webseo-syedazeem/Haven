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
import { routeAfterSignIn } from '@/lib/auth/onboarding-routing';
import { resetToMainApp } from '@/lib/navigation';

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
  const isLaunchLanding = launch === '1' || from === 'intro';
  const canGoBack = signedOut !== '1' && !isLaunchLanding;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Back returns to whichever screen opened Login (Arrival, or Save your space),
  // never to the start of onboarding.
  const goBack = useCallback(
    () => (router.canGoBack() ? router.back() : router.replace('/')),
    [router]
  );

  useFocusEffect(useCallback(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (authenticated) return true;
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
  }, [authenticated, canGoBack, goBack, isLaunchLanding]));

  const finishAuthentication = async () => {
    await routeAfterSignIn(router);
  };

  const retryPreferenceSync = async () => {
    if (isSubmitting) return;
    setErrorMessage('');
    setIsSubmitting(true);
    try {
      await finishAuthentication();
    } catch {
      setErrorMessage('Your preferences still could not be saved. Check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogin = async () => {
    if (isSubmitting) return;
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setErrorMessage('Please enter your email and password.');
      return;
    }
    setErrorMessage('');
    setIsSubmitting(true);
    let signedIn = false;
    try {
      await signIn({ email: trimmedEmail, password });
      signedIn = true;
      setAuthenticated(true);
      await finishAuthentication();
    } catch (error) {
      setErrorMessage(
        signedIn
          ? 'You are signed in, but your Passage preferences could not be saved. Try again.'
          : error instanceof Error
            ? error.message
            : 'Unable to sign in right now.'
      );
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
        setAuthenticated(true);
        await finishAuthentication();
      }
    } catch (error) {
      setErrorMessage(
        signedIn
          ? 'You are signed in, but your Passage preferences could not be saved. Try again.'
          : error instanceof Error
            ? error.message
            : 'Google sign in failed.'
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
        setAuthenticated(true);
        await finishAuthentication();
      }
    } catch (error) {
      setErrorMessage(
        signedIn
          ? 'You are signed in, but your Passage preferences could not be saved. Try again.'
          : error instanceof Error
            ? error.message
            : 'Apple sign in failed.'
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
          <AuthTextField autoCapitalize={'none'} autoComplete={'email'} editable={!authenticated && !isSubmitting} keyboardType={'email-address'} onChangeText={setEmail} placeholder={'Email address'} returnKeyType={'next'} value={email} />
          <AuthTextField autoCapitalize={'none'} autoComplete={'password'} editable={!authenticated && !isSubmitting} onChangeText={setPassword} onSubmitEditing={() => void (authenticated ? retryPreferenceSync() : handleLogin())} onToggleSecureText={() => setPasswordVisible((visible) => !visible)} placeholder={'Password'} returnKeyType={'done'} secureTextEntry={!passwordVisible} secureTextVisible={passwordVisible} value={password} />
          <Pressable accessibilityRole={'button'} disabled={authenticated} hitSlop={8} onPress={() => router.push('/reset-password')} style={styles.forgotButton}>
            <Text style={styles.forgotText}>Forgot password?</Text>
          </Pressable>
          {errorMessage ? <Text accessibilityLiveRegion={'polite'} style={styles.errorText}>{errorMessage}</Text> : null}
          <OnboardingContinueButton label={authenticated ? 'Retry saving preferences' : 'Sign in'} loading={isSubmitting} onPress={() => void (authenticated ? retryPreferenceSync() : handleLogin())} style={styles.primaryButton} />
          {authenticated && errorMessage ? (
            <OnboardingContinueButton
              label="Continue to Home"
              onPress={() => resetToMainApp(router)}
              variant="secondary"
            />
          ) : null}
        </View>
        {!authenticated ? (
          <>
            <View style={styles.dividerRow}><View style={styles.divider} /><Text style={styles.dividerText}>or</Text><View style={styles.divider} /></View>
            <View style={styles.socialButtons}>
              <AuthSocialButton disabled={isSubmitting} icon={appleIcon} label={'Continue with Apple'} onPress={() => void handleApplePress()} />
              <AuthSocialButton disabled={isSubmitting} icon={googleIcon} label={'Continue with Google'} onPress={() => void handleGooglePress()} />
            </View>
            <Pressable accessibilityRole={'button'} hitSlop={8} onPress={() => router.push('/welcome')} style={styles.signupButton}>
              <Text style={styles.signupPrompt}>Don&apos;t have an account? <Text style={styles.signupLink}>Sign up</Text></Text>
            </Pressable>
          </>
        ) : null}
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
