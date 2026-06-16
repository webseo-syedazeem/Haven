import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { ExploreButton } from '@/components/ExploreButton';
import { ScreenWrapper, useScreenBottomPadding } from '@/components/ScreenWrapper';
import { AppFonts } from '@/constants/theme';
import { signInWithGoogle } from '@/lib/google-auth';
import { setAuthTokens, signUp } from '@/lib/haven-api';

const createAccountBackground = require('@/assets/images/create-account-page-background-image.png');
const googleIcon = require('@/assets/icons/google.png');
const noFocusOutline = Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : null;

function InnerShadow() {
  return (
    <View pointerEvents="none" style={styles.innerShadow}>
      <LinearGradient
        colors={['rgba(255, 255, 255, 0.5)', 'rgba(255, 255, 255, 0)']}
        end={{ x: 0, y: 1 }}
        start={{ x: 0, y: 0 }}
        style={styles.innerShadowTop}
      />
      <LinearGradient
        colors={['rgba(255, 255, 255, 0.5)', 'rgba(255, 255, 255, 0)']}
        end={{ x: 1, y: 0 }}
        start={{ x: 0, y: 0 }}
        style={styles.innerShadowLeft}
      />
    </View>
  );
}

export default function CreateAccountScreen() {
  const router = useRouter();
  const bottomPadding = useScreenBottomPadding();
  const [email, setEmail] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [username, setUsername] = useState('');

  const handleGooglePress = async () => {
    if (isSubmitting) {
      return;
    }

    setErrorMessage('');
    setIsSubmitting(true);

    try {
      const session = await signInWithGoogle();
      if (session?.session?.access_token) {
        setAuthTokens({
          accessToken: session.session.access_token,
          refreshToken: session.session.refresh_token,
        });
        router.replace('/feeling-lately');
      }
    } catch (error) {
      console.error('Google sign in error:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Google sign in failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateAccount = async () => {
    if (isSubmitting) {
      return;
    }

    const trimmedEmail = email.trim();
    const trimmedUsername = username.trim();

    if (!trimmedUsername || !trimmedEmail || !password) {
      setErrorMessage('Please fill in your name, email, and password.');
      return;
    }

    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters.');
      return;
    }

    setErrorMessage('');
    setIsSubmitting(true);

    try {
      await signUp({ email: trimmedEmail, password, username: trimmedUsername });
      router.replace('/feeling-lately');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to create account right now.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScreenWrapper backgroundImage={createAccountBackground}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}>
        <View style={styles.contentWrapper}>
          <Pressable
            accessibilityLabel="Go back"
            hitSlop={12}
            onPress={() => router.back()}
            style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
            <Ionicons color="#000000" name="chevron-back" size={18} />
          </Pressable>

          <View style={styles.content}>
            <View style={styles.copy}>
              <Text style={styles.heading}>Create Account</Text>
              <Text style={styles.description}>Start checking in and feel better slowly</Text>
            </View>

            <Pressable
              accessibilityRole="button"
              disabled={isSubmitting}
              onPress={handleGooglePress}
              style={({ pressed }) => [
                styles.googleButton,
                isSubmitting && styles.disabled,
                pressed && styles.pressed,
              ]}>
              <Image source={googleIcon} resizeMode="contain" style={styles.googleIcon} />
              <Text adjustsFontSizeToFit numberOfLines={1} style={styles.googleText}>
                Continue with google
              </Text>
            </Pressable>

            <View style={styles.separatorRow}>
              <View style={styles.separatorLine} />
              <Text style={styles.separatorText}>or</Text>
              <View style={styles.separatorLine} />
            </View>

            <View style={styles.form}>
              <View style={styles.inputWrap}>
                <InnerShadow />
                <Ionicons color="#173F5F" name="person-outline" size={20} style={styles.inputIcon} />
                <TextInput
                  autoCapitalize="words"
                  autoComplete="name"
                  onChangeText={setUsername}
                  placeholder="Name"
                  placeholderTextColor="#8C8C8C"
                  style={[styles.input, noFocusOutline]}
                  value={username}
                />
              </View>

              <View style={styles.inputWrap}>
                <InnerShadow />
                <Ionicons color="#173F5F" name="mail-outline" size={20} style={styles.inputIcon} />
                <TextInput
                  autoCapitalize="none"
                  autoComplete="email"
                  keyboardType="email-address"
                  onChangeText={setEmail}
                  placeholder="Enter Email"
                  placeholderTextColor="#8C8C8C"
                  style={[styles.input, noFocusOutline]}
                  value={email}
                />
              </View>

              <View style={styles.inputWrap}>
                <InnerShadow />
                <Ionicons color="#173F5F" name="lock-closed" size={20} style={styles.inputIcon} />
                <TextInput
                  autoCapitalize="none"
                  onChangeText={setPassword}
                  placeholder="Password"
                  placeholderTextColor="#8C8C8C"
                  secureTextEntry={!passwordVisible}
                  style={[styles.input, styles.passwordInput, noFocusOutline]}
                  value={password}
                />
                <Pressable
                  accessibilityLabel={passwordVisible ? 'Hide password' : 'Show password'}
                  hitSlop={10}
                  onPress={() => setPasswordVisible((visible) => !visible)}
                  style={styles.eyeButton}>
                  <Ionicons
                    color="#1f2937"
                    name={passwordVisible ? 'eye-off-outline' : 'eye-outline'}
                    size={18}
                  />
                </Pressable>
              </View>
            </View>

            <Text style={styles.termsText}>
              By continuing, you agree to our{' '}
              <Text onPress={() => router.push('/profile/terms' as any)} style={styles.textLink}>
                Terms of Service
              </Text>
              {' and '}
              <Text onPress={() => router.push('/profile/privacy-policy' as any)} style={styles.textLink}>
                Privacy Policy
              </Text>
              .
            </Text>

            {!!errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}
          </View>

          <View style={[styles.bottomArea, { paddingBottom: bottomPadding }]}>
            <ExploreButton
              disabled={isSubmitting}
              gradientColors={['#B087E5', '#7863DC']}
              gradientEnd={{ x: 0, y: 1 }}
              gradientLocations={[0.0379, 0.75]}
              gradientStart={{ x: 0, y: 0 }}
              label="Create Account"
              loading={isSubmitting}
              shadowColor="rgb(120, 99, 220)"
              style={styles.createButton}
              onPress={handleCreateAccount}
            />

           <View style={styles.loginRow}>
  <Text style={styles.loginPrompt}>Already have an account?</Text>
  <Pressable
    accessibilityRole="button"
    hitSlop={6}
    onPress={() => router.push('/welcome')}
    style={styles.loginLinkButton}>
    <Text style={styles.loginLink}>Login</Text>
  </Pressable>
</View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  bottomArea: {
    paddingHorizontal: 12,
    width: '100%',
  },
  backButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 16,
    height: 32,
    justifyContent: 'center',
    left: 18,
    position: 'absolute',
    top: 15,
    width: 32,
    zIndex: 3,
  },
  content: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 18,
    width: '100%',
  },
loginRow: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  marginTop: 6,  // button se 6 margin
  gap: 4,
},
  contentWrapper: {
    flex: 1,
    justifyContent: 'space-between',
  },
  copy: {
    alignItems: 'center',
    marginBottom: 17,
  },
  createButton: {
    alignSelf: 'center',
    maxWidth: 348,
    width: '100%',
  },
  description: {
    color: '#173F5F',
    fontFamily: AppFonts.sansMedium,
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: 0,
    lineHeight: 26,
    textAlign: 'center',
  },
  disabled: {
    opacity: 0.72,
  },
  eyeButton: {
    alignItems: 'center',
    bottom: 0,
    justifyContent: 'center',
    position: 'absolute',
    right: 17,
    top: 0,
    width: 28,
  },
  errorText: {
    color: '#173F5F',
    fontFamily: AppFonts.sansMedium,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
    marginTop: 8,
    maxWidth: 310,
    textAlign: 'center',
  },
  form: {
    gap: 14,
    width: '100%',
  },
  googleButton: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    elevation: 4,
    height: 54,
    justifyContent: 'center',
    maxWidth: 310,
    position: 'relative',
    shadowColor: '#ffffff',
    shadowOffset: {
      width: 4,
      height: 4,
    },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    width: '100%',
  },
  googleIcon: {
    height: 20,
    left: 24,
    position: 'absolute',
    width: 20,
  },
  googleText: {
    color: '#000000',
    fontFamily: AppFonts.sansMedium,
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: 0,
    lineHeight: 26,
    paddingHorizontal: 62,
    textAlign: 'center',
    width: '100%',
  },
  heading: {
    color: '#173F5F',
    fontFamily: AppFonts.displaySemiBold,
    fontSize: 32,
    fontWeight: '600',
    letterSpacing: 0,
    lineHeight: 42,
    textAlign: 'center',
  },
  innerShadow: {
    ...StyleSheet.absoluteFillObject,
  },
  innerShadowLeft: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    top: 4,
    width: 16,
  },
  innerShadowTop: {
    height: 16,
    left: 4,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  input: {
    color: '#000000',
    flex: 1,
    fontFamily: AppFonts.sansMedium,
    fontSize: 16,
    fontWeight: '500',
    height: '100%',
    letterSpacing: 0,
    lineHeight: 26,
    paddingLeft: 42,
    paddingRight: 18,
  },
  inputIcon: {
    left: 14,
    position: 'absolute',
    zIndex: 1,
  },
  inputWrap: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 0,
    elevation: 5,
    flexDirection: 'row',
    height: 54,
    overflow: 'hidden',
    shadowColor: '#ffffff',
    shadowOffset: {
      width: 4,
      height: 4,
    },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    width: '100%',
  },
  keyboardView: {
    flex: 1,
  },
  loginLink: {
    color: '#173F5F',
    fontFamily: AppFonts.sansMedium,
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: 0,
    lineHeight: 26,
    textAlign: 'center',
  },
  loginLinkButton: {
    margin: 0,
    padding: 0,
  },
 loginPrompt: {
  color: '#173F5F',
  fontFamily: AppFonts.sansMedium,
  fontSize: 16,
  fontWeight: '500',
  letterSpacing: 0,
  lineHeight: 26,  // 10 se 26 karo
  textAlign: 'center',
},
  passwordInput: {
    paddingRight: 54,
  },
  pressed: {
    opacity: 0.86,
    transform: [{ scale: 0.99 }],
  },
  separatorLine: {
    backgroundColor: 'rgba(23, 63, 95, 0.32)',
    flex: 1,
    height: 1,
  },
  separatorRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    marginVertical: 16,
    maxWidth: 310,
    width: '100%',
  },
  separatorText: {
    color: '#173F5F',
    fontFamily: AppFonts.sansMedium,
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: 0,
    lineHeight: 26,
  },
  termsText: {
    color: '#173F5F',
    fontFamily: AppFonts.sansMedium,
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: 0,
    lineHeight: 26,
    marginTop: 12,
    maxWidth: 310,
    textAlign: 'center',
  },
  textLink: {
    textDecorationLine: 'underline',
    textDecorationStyle: 'solid',
  },
});
