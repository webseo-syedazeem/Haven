import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';

import { AuthButton } from '@/components/AuthButton';
import { AuthLegalFooter } from '@/components/auth/AuthLegalFooter';
import { OnboardingScaffold } from '@/components/onboarding/OnboardingScaffold';
import { PassageColors, Typography } from '@/constants/design';
import { AppFonts } from '@/constants/theme';
import { signInWithApple } from '@/lib/apple-auth';
import { routeAfterSignIn } from '@/lib/auth/onboarding-routing';
import { signInWithGoogle } from '@/lib/google-auth';

const appleIcon = require('@/assets/icons/apple icon.png');
const googleIcon = require('@/assets/icons/google icon.png');
const emailIcon = require('@/assets/icons/email.png');
const background = require('@/assets/images/auth-save-space-oak-meadow-v2.webp');

type Provider = 'apple' | 'email' | 'google' | null;

export default function AuthenticationChoiceScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState<Provider>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const handleProvider = async (provider: 'apple' | 'google') => {
    if (loading) return;
    setErrorMessage('');
    setLoading(provider);
    try {
      const session = provider === 'apple' ? await signInWithApple() : await signInWithGoogle();
      if (!session) {
        setLoading(null);
        return;
      }
      await routeAfterSignIn(router);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : `${provider === 'apple' ? 'Apple' : 'Google'} sign in is unavailable right now.`);
      setLoading(null);
    }
  };

  const handleEmail = () => {
    if (loading) return;
    setLoading('email');
    router.push('/create-account?from=onboarding');
    setLoading(null);
  };

  return (
    <OnboardingScaffold
      backgroundImage={background}
      backgroundOverlayColor="rgba(7, 11, 16, 0.30)"
      contentContainerStyle={styles.content}
      footer={<AuthLegalFooter />}
      onBack={() => router.back()}>
      <Text style={styles.heading}>Create your space</Text>
      <Text style={styles.body}>Create an account or sign in to continue to Passage.</Text>

      <View style={styles.buttons}>
        {Platform.OS !== 'android' ? (
          <AuthButton disabled={Boolean(loading)} iconSource={appleIcon} iconTintColor={PassageColors.textPrimary} label="Continue with Apple" loading={loading === 'apple'} onPress={() => void handleProvider('apple')} />
        ) : null}
        <AuthButton disabled={Boolean(loading)} iconSource={googleIcon} label="Continue with Google" loading={loading === 'google'} onPress={() => void handleProvider('google')} />
        <AuthButton disabled={Boolean(loading)} iconSource={emailIcon} iconTintColor={PassageColors.textPrimary} label="Sign up with email" loading={loading === 'email'} onPress={handleEmail} />
      </View>

      {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}

      <Pressable accessibilityRole="button" disabled={Boolean(loading)} hitSlop={8} onPress={() => router.push('/login')} style={styles.signInButton}>
        <Text style={styles.signInPrompt}>Already have an account? <Text style={styles.signInLink}>Sign in</Text></Text>
      </Pressable>
    </OnboardingScaffold>
  );
}

const styles = StyleSheet.create({
  body: { ...Typography.body, color: 'rgba(255, 255, 255, 0.72)', marginTop: 10, maxWidth: 300, textAlign: 'center' },
  buttons: { gap: 10, marginTop: 26, width: '100%' },
  content: { alignItems: 'center', justifyContent: 'center', paddingBottom: 28 },
  error: { color: PassageColors.textPrimary, fontFamily: AppFonts.sansRegular, fontSize: 12, lineHeight: 18, marginTop: 12, textAlign: 'center' },
  heading: { ...Typography.screenHeading, textAlign: 'center' },
  signInButton: { alignItems: 'center', marginTop: 20, paddingVertical: 4 },
  signInLink: { color: PassageColors.accent, fontFamily: AppFonts.sansSemiBold, fontWeight: '600' },
  signInPrompt: { color: 'rgba(255, 255, 255, 0.72)', fontFamily: AppFonts.sansRegular, fontSize: 15, lineHeight: 22 },
});
