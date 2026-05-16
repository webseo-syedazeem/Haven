import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
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

import { useBottomSafeSpacing } from '@/hooks/use-bottom-safe-spacing';
import { signUp } from '@/lib/haven-api';

const createAccountBackground = require('@/assets/images/create-account-page-background-image.png');
const googleIcon = require('@/assets/icons/google.png');

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
  const bottomPadding = useBottomSafeSpacing();
  const [email, setEmail] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [username, setUsername] = useState('');

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
      router.replace('/(tabs)');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to create account right now.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ImageBackground source={createAccountBackground} resizeMode="cover" style={styles.background}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardView}>
          <ScrollView
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: bottomPadding + 24, paddingTop: bottomPadding + 24 },
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            style={styles.scrollView}>
            <View style={styles.content}>
              <View style={styles.copy}>
                <Text style={styles.heading}>Create Account</Text>
                <Text style={styles.description}>Start checking in and feel better slowly</Text>
              </View>

              <Pressable
                accessibilityRole="button"
                onPress={() => {}}
                style={({ pressed }) => [styles.googleButton, pressed && styles.pressed]}>
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
                  <Ionicons color="#173F5F" name="person-outline" size={18} style={styles.inputIcon} />
                  <TextInput
                    autoCapitalize="words"
                    autoComplete="name"
                    onChangeText={setUsername}
                    placeholder="Name"
                    placeholderTextColor="#8C8C8C"
                    style={styles.input}
                    value={username}
                  />
                </View>

                <View style={styles.inputWrap}>
                  <Ionicons color="#173F5F" name="mail-outline" size={18} style={styles.inputIcon} />
                  <TextInput
                    autoCapitalize="none"
                    autoComplete="email"
                    keyboardType="email-address"
                    onChangeText={setEmail}
                    placeholder="Enter Email"
                    placeholderTextColor="#8C8C8C"
                    style={styles.input}
                    value={email}
                  />
                </View>

                <View style={styles.inputWrap}>
                  <Ionicons color="#173F5F" name="lock-closed" size={16} style={styles.inputIcon} />
                  <TextInput
                    autoCapitalize="none"
                    onChangeText={setPassword}
                    placeholder="Password"
                    placeholderTextColor="#8C8C8C"
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
              </View>

              <Text style={styles.termsText}>
                By continuing, you agree to our Terms of Service and Privacy Policy.
              </Text>

              {!!errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}
            </View>

            <View style={styles.bottomArea}>
              <Pressable
                accessibilityRole="button"
                disabled={isSubmitting}
                onPress={handleCreateAccount}
                style={({ pressed }) => [styles.createButton, pressed && styles.pressed]}>
                <LinearGradient
                  colors={['#B087E5', '#7863DC']}
                  end={{ x: 0, y: 1 }}
                  locations={[0.0379, 0.75]}
                  start={{ x: 0, y: 0 }}
                  style={styles.createGradient}>
                  <InnerShadow />
                  {isSubmitting ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <Text style={styles.createText}>Create Account</Text>
                  )}
                </LinearGradient>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                onPress={() => router.push('/welcome')}
                style={styles.loginLinkButton}>
                <Text style={styles.loginPrompt}>
                  Already have an account? <Text style={styles.loginLink}>Login</Text>
                </Text>
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  bottomArea: {
    paddingHorizontal: 12,
    width: '100%',
  },
  content: {
    alignItems: 'center',
    flexGrow: 1,
    justifyContent: 'center',
    paddingBottom: 24,
    paddingHorizontal: 18,
    width: '100%',
  },
  copy: {
    alignItems: 'center',
    marginBottom: 17,
  },
  createButton: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: '#7863dc',
    borderRadius: 27,
    height: 54,
    maxWidth: 348,
    overflow: 'hidden',
    width: '100%',
  },
  createGradient: {
    alignItems: 'center',
    height: '100%',
    justifyContent: 'center',
    width: '100%',
  },
  createText: {
    color: '#ffffff',
    fontFamily: 'SF Pro',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0,
    lineHeight: 26,
    textAlign: 'center',
  },
  description: {
    color: '#173F5F',
    fontFamily: 'SF Pro',
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: 0,
    lineHeight: 26,
    textAlign: 'center',
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
    fontFamily: 'SF Pro',
    fontSize: 13,
    fontWeight: '700',
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
    borderRadius: 9,
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
    fontFamily: 'SF Pro',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0,
    lineHeight: 26,
    paddingHorizontal: 62,
    textAlign: 'center',
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
    color: '#173F5F',
    flex: 1,
    fontFamily: 'SF Pro',
    fontSize: 16,
    fontWeight: '600',
    height: '100%',
    letterSpacing: 0,
    lineHeight: 26,
    paddingLeft: 43,
    paddingRight: 18,
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
  keyboardView: {
    flex: 1,
  },
  loginLink: {
    color: '#173F5F',
  },
  loginLinkButton: {
    alignSelf: 'center',
    marginTop: 14,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  loginPrompt: {
    color: '#173F5F',
    fontFamily: 'SF Pro',
    fontSize: 16,
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
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
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
    fontFamily: 'SF Pro',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0,
    lineHeight: 20,
  },
  termsText: {
    color: '#173F5F',
    fontFamily: 'SF Pro',
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0,
    lineHeight: 18,
    marginTop: 12,
    maxWidth: 310,
    textAlign: 'center',
  },
});
