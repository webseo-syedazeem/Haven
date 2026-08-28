import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    BackHandler,
    Image,
    ImageBackground,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';

import { AppFonts } from '@/constants/theme';
import { signInWithApple } from '@/lib/apple-auth';
import { signInWithGoogle } from '@/lib/google-auth';
import { signIn } from '@/lib/haven-api';

const backIcon = require('@/assets/icons/back icon.svg');
const appleIcon = require('@/assets/icons/apple icon.png');
const googleIcon = require('@/assets/icons/google icon.png');
const facebookIcon = require('@/assets/icons/facebook icon.png');
const pageBackground = require('@/assets/images/sign-in-background.png');
const buttonBackground = require('@/assets/images/button backgound.jpg');

const colors = {
  background: '#050505',
  surface: '#0E0E0F',
  primary: '#F1E9DD',
  secondary: '#B8AFA4',
  muted: '#77716A',
  gold: '#BB834F',
  button: '#BB834F',
  buttonText: '#12100E',
  border: '#28221D',
  goldBorder: '#BB834F',
};

const noFocusOutline = Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : null;

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const goToWelcome = useCallback(() => router.replace('/welcome'), [router]);

  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
        goToWelcome();
        return true;
      });
      return () => subscription.remove();
    }, [goToWelcome])
  );

  const handleLogin = async () => {
    if (isSubmitting) return;
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setErrorMessage('Please enter your email and password.');
      return;
    }
    setErrorMessage('');
    setIsSubmitting(true);
    try {
      await signIn({ email: trimmedEmail, password });
      router.replace('/(tabs)');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to login right now.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGooglePress = async () => {
    if (isSubmitting) return;
    setErrorMessage('');
    setIsSubmitting(true);
    try {
      const session = await signInWithGoogle();
      if (session?.session?.access_token) router.replace('/(tabs)');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Google sign in failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApplePress = async () => {
    if (isSubmitting) return;
    setErrorMessage('');
    setIsSubmitting(true);
    try {
      const session = await signInWithApple();
      if (session) router.replace('/(tabs)');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Apple sign in failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ImageBackground source={pageBackground} resizeMode="cover" imageStyle={styles.backgroundImage} style={styles.safeArea}>
      <SafeAreaView style={styles.safeAreaContent}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboardView}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Pressable accessibilityLabel="Go back" hitSlop={12} onPress={goToWelcome} style={styles.backButton}>
              <Image source={backIcon} resizeMode="contain" style={styles.backIcon} />
            </Pressable>
            <Text style={styles.heading}>Welcome back</Text>
            <Text style={styles.subtitle}>Sign in to your account</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                onChangeText={setEmail}
                placeholder="hello@halcyon.com"
                placeholderTextColor={colors.muted}
                style={[styles.input, noFocusOutline]}
                value={email}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.passwordWrap}>
                <TextInput
                  autoCapitalize="none"
                  autoComplete="password"
                  onChangeText={setPassword}
                  placeholder="Password"
                  placeholderTextColor={colors.muted}
                  secureTextEntry={!passwordVisible}
                  style={[styles.input, styles.passwordInput, noFocusOutline]}
                  value={password}
                />
                <Pressable accessibilityLabel={passwordVisible ? 'Hide password' : 'Show password'} hitSlop={10} onPress={() => setPasswordVisible((visible) => !visible)} style={styles.eyeButton}>
                  <Ionicons color={colors.gold} name={passwordVisible ? 'eye-off-outline' : 'eye-outline'} size={20} />
                </Pressable>
              </View>
              <Pressable accessibilityRole="button" onPress={() => router.push('/reset-password')} style={styles.forgotButton}>
                <Text style={styles.forgotText}>Forgot password?</Text>
              </Pressable>
            </View>

            {!!errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}

            <Pressable accessibilityRole="button" disabled={isSubmitting} onPress={handleLogin} style={({ pressed }) => [styles.signInButton, pressed && styles.pressed, isSubmitting && styles.disabled]}>
              <ImageBackground source={buttonBackground} resizeMode="cover" imageStyle={styles.buttonImageStyle} style={styles.buttonBackground}>
                {isSubmitting ? <ActivityIndicator color={colors.buttonText} /> : <Text style={styles.signInText}>Sign in</Text>}
              </ImageBackground>
            </Pressable>

            <View style={styles.dividerRow}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>or continue with</Text>
              <View style={styles.divider} />
            </View>

            <View style={styles.socialRow}>
              <Pressable accessibilityLabel="Continue with Apple" disabled={isSubmitting} onPress={handleApplePress} style={styles.socialButton}>
                <Image source={appleIcon} resizeMode="contain" style={styles.socialIcon} />
              </Pressable>
              <Pressable accessibilityLabel="Continue with Google" disabled={isSubmitting} onPress={handleGooglePress} style={styles.socialButton}>
                <Image source={googleIcon} resizeMode="contain" style={styles.socialIcon} />
              </Pressable>
              <Pressable accessibilityLabel="Continue with Facebook" onPress={() => setErrorMessage('Facebook sign in is not available.')} style={styles.socialButton}>
                <Image source={facebookIcon} resizeMode="contain" style={styles.socialIcon} />
              </Pressable>
            </View>

            <Pressable accessibilityRole="button" onPress={() => router.push('/create-account')} style={styles.signupButton}>
              <Text style={styles.signupPrompt}>Don’t have an account? <Text style={styles.signupLink}>Sign up</Text></Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: colors.background,
    flex: 1,
  } as any,
  backgroundImage: { resizeMode: 'cover' },
  safeAreaContent: { flex: 1 },
  keyboardView: { flex: 1 },
  scrollContent: { minHeight: '100%', paddingBottom: 40, paddingHorizontal: 30, paddingTop: 90 },
  header: { alignItems: 'flex-start', marginBottom: 30 },
  backButton: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    height: 35,
    justifyContent: 'center',
    left: 20,
    paddingRight: 3,
    position: 'fixed',
    top: 20,
    width: 35,
    zIndex: 10,
  } as any,
  backIcon: { height: 20, width: 20 },
  heading: { color: colors.primary, fontFamily: AppFonts.displayRegular, fontSize: 35, fontWeight: '500', lineHeight: 40 },
  subtitle: { color: colors.secondary, fontFamily: AppFonts.sansRegular, fontSize: 15, marginTop: 8 },
  form: { marginTop: 4, width: '100%' },
  fieldGroup: { marginBottom: 16 },
  label: { color: colors.secondary, fontFamily: AppFonts.sansMedium, fontSize: 14, marginBottom: 8 },
  input: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 14, borderWidth: 1, color: colors.primary, fontFamily: AppFonts.sansRegular, fontSize: 15, paddingHorizontal: 16, paddingVertical: 20 },
  passwordWrap: { position: 'relative' },
  passwordInput: { paddingRight: 52 },
  eyeButton: { alignItems: 'center', height: 42, justifyContent: 'center', position: 'absolute', right: 8, top: 4, width: 42 },
  forgotButton: { alignSelf: 'flex-end', marginTop: 8 },
  forgotText: { color: colors.gold, fontFamily: AppFonts.sansMedium, fontSize: 14, fontWeight: '500' },
  errorText: { color: colors.primary, fontFamily: AppFonts.sansMedium, fontSize: 13, marginBottom: 2, textAlign: 'center' },
  signInButton: {
    alignItems: 'center',
    backgroundColor: colors.gold,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    marginTop: 4,
    overflow: 'hidden',
    paddingVertical: 20,
  } as any,
  buttonBackground: { alignItems: 'center', flex: 1, justifyContent: 'center', width: '100%' },
  buttonImageStyle: { resizeMode: 'cover' },
  signInText: { color: colors.buttonText, fontFamily: AppFonts.sansMedium, fontSize: 15, fontWeight: '500' },
  dividerRow: { alignItems: 'center', flexDirection: 'row', gap: 12, marginTop: 24 },
  divider: { backgroundColor: colors.gold, flex: 1, height: 1 },
  dividerText: { color: colors.secondary, fontFamily: AppFonts.sansRegular, fontSize: 13 },
  socialRow: { flexDirection: 'row', gap: 12, justifyContent: 'center', marginTop: 18 },
  socialButton: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 15, borderWidth: 1, justifyContent: 'center', paddingHorizontal: 25, paddingVertical: 20 },
  socialIcon: { height: 30, width: 30 },
  signupButton: { alignItems: 'center', marginTop: 28, paddingVertical: 6 },
  signupPrompt: { color: colors.secondary, fontFamily: AppFonts.sansRegular, fontSize: 14 },
  signupLink: { color: colors.gold, fontFamily: AppFonts.sansMedium, fontWeight: '500' },
  pressed: { opacity: 0.88 },
  disabled: { opacity: 0.6 },
});
