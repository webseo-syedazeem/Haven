import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import { BackHandler, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { AuthButton } from '@/components/AuthButton';
import { ScreenWrapper } from '@/components/ScreenWrapper';
import { AppFonts } from '@/constants/theme';
import { signInWithGoogle } from '@/lib/google-auth';

const welcomeBackground = require('@/assets/images/welcome-background.png');
const googleIcon = require('@/assets/icons/google.png');
const appleIcon = require('@/assets/icons/apple.png');
const emailIcon = require('@/assets/icons/email.png');

export default function WelcomeScreen() {
  const router = useRouter();

  const goBackToLanding = useCallback(() => {
    router.replace('/');
  }, [router]);

  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
        goBackToLanding();
        return true;
      });

      return () => subscription.remove();
    }, [goBackToLanding])
  );

  const handleGooglePress = async () => {
    try {
      const session = await signInWithGoogle();
      if (session) {
        router.replace('/(tabs)');
      }
    } catch (error) {
      console.error('Google sign in error:', error);
    }
  };

  const handleApplePress = () => {};
  const handleEmailPress = () => {
    router.push('/login');
  };

  return (
    <ScreenWrapper
      backgroundImage={welcomeBackground}
      topContent={
        <Pressable
          accessibilityLabel="Go back"
          hitSlop={12}
          onPress={goBackToLanding}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
          <Ionicons color="#000000" name="chevron-back" size={18} />
        </Pressable>
      }
      topContentStyle={styles.topContent}
      bottomContent={
        <Text style={styles.footer}>
          By continuing, you agree to our{' '}
          <Text onPress={() => router.push('/profile/terms' as any)} style={styles.footerLink}>
            Terms of Service
          </Text>
          {' and '}
          <Text onPress={() => router.push('/profile/privacy-policy' as any)} style={styles.footerLink}>
            Privacy Policy
          </Text>
          .
        </Text>
      }
      middleContent={
        <View style={styles.centerContent}>
          <Text style={styles.heading}>{`Welcome!\nTake a breath and\ncome in`}</Text>

          <View style={styles.buttonGroup}>
            <AuthButton
              iconSource={googleIcon}
              label="Continue with google"
              onPress={handleGooglePress}
            />
            <AuthButton
              iconSource={appleIcon}
              label="Continue with Apple"
              onPress={handleApplePress}
            />
            <AuthButton
              iconSource={emailIcon}
              label="Continue with Email"
              onPress={handleEmailPress}
            />
          </View>
        </View>
      }
      overlay={<View style={styles.readabilityOverlay} />}
    />
  );
}

const styles = StyleSheet.create({
  backButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 16,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  buttonGroup: {
    gap: 11,
    marginTop: 25,
    width: '100%',
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  footer: {
    color: '#ffffff',
    fontFamily: AppFonts.sansMedium,
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: 0,
    lineHeight: 26,
    maxWidth: 310,
    paddingHorizontal: 24,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.32)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    width: '100%',
  },
  footerLink: {
    textDecorationLine: 'underline',
    textDecorationStyle: 'solid',
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
  pressed: {
    opacity: 0.86,
    transform: [{ scale: 0.99 }],
  },
  readabilityOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  topContent: {
    left: 18,
    position: 'absolute',
    top: 15,
    zIndex: 3,
  },
});
