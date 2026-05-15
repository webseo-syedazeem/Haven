import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { useBottomSafeSpacing } from '@/hooks/use-bottom-safe-spacing';

const firstPageBackground = require('@/assets/images/first-page-background-image.png');

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

export default function FirstPageScreen() {
  const router = useRouter();
  const bottomPadding = useBottomSafeSpacing();

  return (
    <ImageBackground source={firstPageBackground} resizeMode="cover" style={styles.background}>
      <StatusBar hidden />
      <View style={styles.screen}>
        <View style={styles.content}>
          <View style={styles.copy}>
            <Text style={styles.heading}>{`Feel better now.\nThink clearer later`}</Text>
            <Text style={styles.description}>Understand your stress, sleep</Text>
          </View>
        </View>

        <View style={[styles.bottomArea, { paddingBottom: bottomPadding }]}>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/welcome')}
            style={({ pressed }) => [styles.getStartedButton, pressed && styles.pressed]}>
            <LinearGradient
              colors={['#6D67CE', '#528AE1', '#6AAFE9']}
              end={{ x: 1, y: 0.58 }}
              locations={[0.0254, 0.5327, 0.9044]}
              start={{ x: 0, y: 0.42 }}
              style={styles.getStartedGradient}>
              <InnerShadow />
              <Text style={styles.getStartedText}>Get Started</Text>
            </LinearGradient>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/login')}
            style={styles.loginLinkButton}>
            <Text style={styles.loginPrompt}>
              Already have an account? <Text style={styles.loginLink}>Login</Text>
            </Text>
          </Pressable>
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    height: '100%',
    width: '100%',
  },
  bottomArea: {
    bottom: 0,
    left: 0,
    paddingHorizontal: 12,
    position: 'absolute',
    right: 0,
  },
  content: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingBottom: 146,
    paddingHorizontal: 20,
    width: '100%',
  },
  copy: {
    alignItems: 'center',
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
  getStartedButton: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: '#528ae1',
    borderRadius: 27,
    height: 54,
    maxWidth: 348,
    overflow: 'hidden',
    width: '100%',
  },
  getStartedGradient: {
    alignItems: 'center',
    height: '100%',
    justifyContent: 'center',
    width: '100%',
  },
  getStartedText: {
    color: '#ffffff',
    fontFamily: 'SF Pro',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0,
    lineHeight: 26,
    textAlign: 'center',
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
  loginLink: {
    color: '#ffffff',
  },
  loginLinkButton: {
    alignSelf: 'center',
    marginTop: 13,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  loginPrompt: {
    color: '#ffffff',
    fontFamily: 'SF Pro',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0,
    lineHeight: 26,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  pressed: {
    opacity: 0.86,
    transform: [{ scale: 0.99 }],
  },
  screen: {
    flex: 1,
  },
});
