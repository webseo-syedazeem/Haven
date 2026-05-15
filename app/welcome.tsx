import { useRouter } from 'expo-router';
import { ImageBackground, SafeAreaView, StyleSheet, Text, View } from 'react-native';

import { AuthButton } from '@/components/AuthButton';
import { useBottomSafeSpacing } from '@/hooks/use-bottom-safe-spacing';

const welcomeBackground = require('@/assets/images/welcome-background.png');
const googleIcon = require('@/assets/icons/google.png');
const appleIcon = require('@/assets/icons/apple.png');
const emailIcon = require('@/assets/icons/email.png');

export default function WelcomeScreen() {
  const router = useRouter();
  const bottomPadding = useBottomSafeSpacing();
  const handleGooglePress = () => {};
  const handleApplePress = () => {};
  const handleEmailPress = () => {
    router.push('/login');
  };

  return (
    <ImageBackground source={welcomeBackground} resizeMode="cover" style={styles.background}>
      <View style={styles.readabilityOverlay} />
      <SafeAreaView style={styles.safeArea}>
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

        <Text style={[styles.footer, { bottom: bottomPadding }]}>
          By continuing, you agree to our{' '}
          <Text style={styles.footerLink}>Terms of Service</Text>
          {' and '}
          <Text style={styles.footerLink}>Privacy Policy</Text>.
        </Text>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  buttonGroup: {
    gap: 11,
    marginTop: 25,
    width: '100%',
  },
  centerContent: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingBottom: 74,
    width: '100%',
  },
  footer: {
    alignSelf: 'center',
    color: '#ffffff',
    fontFamily: 'SF Pro',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0,
    lineHeight: 26,
    maxWidth: 310,
    paddingHorizontal: 24,
    position: 'absolute',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.32)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    width: '100%',
  },
  footerLink: {
    textDecorationLine: 'underline',
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
  readabilityOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  safeArea: {
    flex: 1,
  },
});
