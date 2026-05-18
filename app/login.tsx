import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { ScreenWrapper, useScreenBottomPadding } from '@/components/ScreenWrapper';
import { signIn } from '@/lib/haven-api';

const loginBackground = require('@/assets/images/login_page_background.png');

export default function LoginScreen() {
  const router = useRouter();
  const bottomPadding = useScreenBottomPadding();
  const [email, setEmail] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);

  const handleLogin = async () => {
    if (isSubmitting) {
      return;
    }

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

  return (
    <ScreenWrapper backgroundImage={loginBackground} overlay={<View style={styles.blueOverlay} />}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}>
        <View style={styles.contentWrapper}>
          <View style={styles.content}>
            <Text style={styles.heading}>{`Let's check in\ngently`}</Text>

            <View style={styles.form}>
              <View style={styles.inputWrap}>
                <Ionicons color="#273044" name="mail-outline" size={18} style={styles.inputIcon} />
                <TextInput
                  autoCapitalize="none"
                  autoComplete="email"
                  keyboardType="email-address"
                  onChangeText={setEmail}
                  placeholder="Enter Email"
                  placeholderTextColor="#7f8490"
                  style={styles.input}
                  value={email}
                />
              </View>

              <View style={styles.inputWrap}>
                <Ionicons color="#111827" name="lock-closed" size={16} style={styles.inputIcon} />
                <TextInput
                  autoCapitalize="none"
                  onChangeText={setPassword}
                  placeholder="Password"
                  placeholderTextColor="#7f8490"
                  secureTextEntry={!passwordVisible}
                  style={[styles.input, styles.passwordInput]}
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

              <Pressable
                accessibilityRole="button"
                onPress={() => router.push('/reset-password')}
                style={styles.forgotButton}>
                <Text style={styles.forgotText}>Forget Password?</Text>
              </Pressable>

              {!!errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}
            </View>
          </View>

          <View style={[styles.bottomArea, { paddingBottom: bottomPadding }]}>
            <Pressable
              accessibilityRole="button"
              disabled={isSubmitting}
              onPress={handleLogin}
              style={({ pressed }) => [
                styles.loginButton,
                isSubmitting && styles.disabled,
                pressed && styles.pressed,
              ]}>
              <LinearGradient
                colors={['#5AA1E2', '#0D6FD0']}
                end={{ x: 1, y: 1 }}
                start={{ x: 0, y: 0 }}
                style={styles.loginGradient}>
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
                {isSubmitting ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.loginText}>Login</Text>
                )}
              </LinearGradient>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              onPress={() => router.push('/create-account')}
              style={styles.signupLinkButton}>
              <Text style={styles.signupPrompt}>
                Not registered yet? <Text style={styles.signupLink}>Sign up</Text>
              </Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  blueOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(20, 135, 220, 0.12)',
  },
  bottomArea: {
    alignItems: 'center',
    paddingHorizontal: 12,
    width: '100%',
  },
  content: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 18,
    width: '100%',
  },
  contentWrapper: {
    flex: 1,
    justifyContent: 'space-between',
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
  disabled: {
    opacity: 0.72,
  },
  errorText: {
    alignSelf: 'center',
    color: '#ffffff',
    fontFamily: 'SF Pro',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
    maxWidth: 310,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.34)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  forgotButton: {
    alignSelf: 'center',
    marginTop: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  forgotText: {
    color: '#ffffff',
    fontFamily: 'SF Pro',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0,
    lineHeight: 26,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.34)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  form: {
    marginTop: 84,
    width: '100%',
  },
  heading: {
    color: '#173F5F',
    fontFamily: 'PlayfairDisplay-SemiBold',
    fontSize: 32,
    fontWeight: '600',
    letterSpacing: 0,
    lineHeight: 42,
    textAlign: 'center',
    textShadowColor: 'rgba(255, 255, 255, 0.36)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  input: {
    color: '#1f2937',
    flex: 1,
    fontFamily: 'SF Pro',
    fontSize: 16,
    fontWeight: '600',
    height: '100%',
    letterSpacing: 0,
    lineHeight: 26,
    paddingLeft: 42,
    paddingRight: 16,
  },
  inputIcon: {
    left: 20,
    position: 'absolute',
    zIndex: 1,
  },
  inputWrap: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 10,
    elevation: 5,
    flexDirection: 'row',
    height: 54,
    marginBottom: 19,
    maxWidth: 310,
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
  keyboardView: {
    flex: 1,
  },
  loginButton: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: '#0d6fd0',
    borderRadius: 27,
    elevation: 0,
    height: 54,
    maxWidth: 348,
    overflow: 'hidden',
    width: '100%',
  },
  loginGradient: {
    alignItems: 'center',
    height: '100%',
    justifyContent: 'center',
    width: '100%',
  },
  loginText: {
    color: '#ffffff',
    fontFamily: 'SF Pro',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0,
    lineHeight: 26,
    textAlign: 'center',
  },
  passwordInput: {
    paddingRight: 54,
  },
  pressed: {
    opacity: 0.86,
    transform: [{ scale: 0.99 }],
  },
  signupLink: {
    color: '#ffffff',
  },
  signupLinkButton: {
    alignSelf: 'center',
    marginTop: 14,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  signupPrompt: {
    color: '#ffffff',
    fontFamily: 'SF Pro',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0,
    lineHeight: 18,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.34)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
