import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import { BackHandler, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { AuthButton } from '@/components/AuthButton';
import { LegalDisclaimer } from '@/components/LegalDisclaimer';
import { ScreenWrapper } from '@/components/ScreenWrapper';
import { AppFonts } from '@/constants/theme';
import { signInWithApple } from '@/lib/apple-auth';
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

  const handleApplePress = async () => {
    try {
      const session = await signInWithApple();
      if (session) {
        router.replace('/(tabs)');
      }
    } catch (error) {
      console.error('Apple sign in error:', error);
    }
  };
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
        <LegalDisclaimer
          linkStyle={styles.footerLink}
          style={styles.footerDisclaimer}
          textStyle={styles.footer}
        />
      }
      middleContent={
        <View style={styles.centerContent}>
          <Text style={styles.heading}>{`Welcome!\nTake a breath and\ncome in`}</Text>

          <View style={styles.buttonGroup}>
            <AuthButton
              iconSource={googleIcon}
              label="Continue with Google"
              onPress={handleGooglePress}
            />
        {(Platform.OS === 'ios' || __DEV__) && (
              <AuthButton
                iconSource={appleIcon}
                label="Continue with Apple"
                onPress={handleApplePress}
              />
            )}
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
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.32)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  footerDisclaimer: {
    maxWidth: 310,
    paddingHorizontal: 24,
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

