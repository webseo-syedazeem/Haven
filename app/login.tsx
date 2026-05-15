import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useBottomSafeSpacing } from '@/hooks/use-bottom-safe-spacing';

const loginBackground = require('@/assets/images/login_page_background.png');

export default function LoginScreen() {
  const router = useRouter();
  const bottomPadding = useBottomSafeSpacing();
  const [passwordVisible, setPasswordVisible] = useState(false);

  return (
    <ImageBackground source={loginBackground} resizeMode="cover" style={styles.background}>
      <View style={styles.blueOverlay} />
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardView}>
          <View style={styles.content}>
            <Text style={styles.heading}>{`Let's check in\ngently`}</Text>

            <View style={styles.form}>
              <View style={styles.inputWrap}>
                <Ionicons color="#273044" name="mail-outline" size={18} style={styles.inputIcon} />
                <TextInput
                  autoCapitalize="none"
                  autoComplete="email"
                  keyboardType="email-address"
                  placeholder="Enter Email"
                  placeholderTextColor="#7f8490"
                  style={styles.input}
                />
              </View>

              <View style={styles.inputWrap}>
                <Ionicons color="#111827" name="lock-closed" size={16} style={styles.inputIcon} />
                <TextInput
                  autoCapitalize="none"
                  placeholder="Password"
                  placeholderTextColor="#7f8490"
                  secureTextEntry={!passwordVisible}
                  style={[styles.input, styles.passwordInput]}
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
            </View>
          </View>

          <Pressable
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.loginButton,
              { bottom: bottomPadding },
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
              <Text style={styles.loginText}>Login</Text>
            </LinearGradient>
          </Pressable>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  blueOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(20, 135, 220, 0.12)',
  },
  content: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingBottom: 68,
    paddingHorizontal: 18,
    width: '100%',
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
    position: 'absolute',
    width: '91%',
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
  safeArea: {
    flex: 1,
  },
});
