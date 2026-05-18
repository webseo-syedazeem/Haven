import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { ScreenWrapper, useScreenBottomPadding } from '@/components/ScreenWrapper';
import { forgotPassword } from '@/lib/haven-api';

const resetPasswordBackground = require('@/assets/images/reset-password-background-image.png');

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

export default function ResetPasswordScreen() {
  const bottomPadding = useScreenBottomPadding();
  const [email, setEmail] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSendResetLink = async () => {
    if (isSubmitting) {
      return;
    }

    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setErrorMessage('Please enter your email.');
      return;
    }

    setErrorMessage('');
    setIsSubmitting(true);

    try {
      await forgotPassword(trimmedEmail);
      Alert.alert('Reset link sent', 'Please check your inbox for the password reset link.');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to send reset link right now.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScreenWrapper backgroundImage={resetPasswordBackground}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}>
        <View style={styles.contentWrapper}>
          <View style={styles.content}>
            <View style={styles.copy}>
              <Text style={styles.heading}>{`Reset your\npassword`}</Text>
              <Text style={styles.description}>
                {"Enter your email and we'll send you a reset link"}
              </Text>
            </View>

            <View style={styles.inputWrap}>
              <InnerShadow />
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

            {!!errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}
          </View>

          <View style={[styles.bottomArea, { paddingBottom: bottomPadding }]}>
            <Pressable
              accessibilityRole="button"
              disabled={isSubmitting}
              onPress={handleSendResetLink}
              style={({ pressed }) => [
                styles.resetButton,
                isSubmitting && styles.disabled,
                pressed && styles.pressed,
              ]}>
              <LinearGradient
                colors={['#B087E5', '#7863DC']}
                end={{ x: 0, y: 1 }}
                locations={[0.0379, 0.75]}
                start={{ x: 0, y: 0 }}
                style={styles.resetGradient}>
                <InnerShadow />
                {isSubmitting ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.resetText}>Send reset Link</Text>
                )}
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
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
  copy: {
    alignItems: 'center',
    marginBottom: 32,
  },
  description: {
    color: '#173F5F',
    fontFamily: 'SF Pro',
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: 0,
    lineHeight: 26,
    maxWidth: 300,
    textAlign: 'center',
  },
  disabled: {
    opacity: 0.72,
  },
  errorText: {
    color: '#173F5F',
    fontFamily: 'SF Pro',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
    marginTop: 14,
    maxWidth: 310,
    textAlign: 'center',
  },
  heading: {
    color: '#173F5F',
    fontFamily: 'PlayfairDisplay-SemiBold',
    fontSize: 32,
    fontWeight: '600',
    letterSpacing: 0,
    lineHeight: 42,
    marginBottom: 8,
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
    flexDirection: 'row',
    height: 54,
    maxWidth: 310,
    overflow: 'hidden',
    width: '100%',
  },
  keyboardView: {
    flex: 1,
  },
  pressed: {
    opacity: 0.86,
    transform: [{ scale: 0.99 }],
  },
  resetButton: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: '#7863dc',
    borderRadius: 27,
    height: 54,
    maxWidth: 348,
    overflow: 'hidden',
    width: '100%',
  },
  resetGradient: {
    alignItems: 'center',
    height: '100%',
    justifyContent: 'center',
    width: '100%',
  },
  resetText: {
    color: '#ffffff',
    fontFamily: 'SF Pro',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0,
    lineHeight: 26,
    textAlign: 'center',
  },
});
