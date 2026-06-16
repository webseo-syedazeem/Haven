import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
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
import { forgotPassword } from '@/lib/haven-api';

const resetPasswordBackground = require('@/assets/images/reset-password-background-image.png');
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

export default function ResetPasswordScreen() {
  const router = useRouter();
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
          <Pressable
            accessibilityLabel="Go back"
            hitSlop={12}
            onPress={() => router.back()}
            style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
            <Ionicons color="#000000" name="chevron-back" size={18} />
          </Pressable>

          <View style={styles.content}>
            <View style={styles.copy}>
              <Text style={styles.heading}>{`Reset your\npassword`}</Text>
              <Text style={styles.description}>
                {"Enter your email and we'll send you a reset link"}
              </Text>
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

            {!!errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}
          </View>

          <View style={[styles.bottomArea, { paddingBottom: bottomPadding }]}>
            <ExploreButton
              label="Send reset Link"
              loading={isSubmitting}
              disabled={isSubmitting}
              onPress={handleSendResetLink}
              style={styles.resetButton}
              gradientColors={['#B087E5', '#7863DC']}
              gradientLocations={[0.0379, 0.75]}
              gradientStart={{ x: 0, y: 0 }}
              gradientEnd={{ x: 0, y: 1 }}
              shadowColor="rgb(120, 99, 220)"
            />
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
    fontFamily: AppFonts.sansMedium,
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: 0,
    lineHeight: 26,
    maxWidth: 300,
    textAlign: 'center',
  },
  errorText: {
    color: '#173F5F',
    fontFamily: AppFonts.sansMedium,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
    marginTop: 14,
    maxWidth: 310,
    textAlign: 'center',
  },
  heading: {
    color: '#173F5F',
    fontFamily: AppFonts.displaySemiBold,
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
    color: '#000000',
    flex: 1,
    fontFamily: AppFonts.sansMedium,
    fontSize: 16,
    fontWeight: '500',
    height: '100%',
    letterSpacing: 0,
    lineHeight: 26,
    paddingLeft: 43,
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
    flexDirection: 'row',
    height: 54,
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
    alignSelf: 'center',
    maxWidth: 348,
    width: '100%',
  },
});
