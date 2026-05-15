import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ImageBackground, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '@/components/primary-button';
import { AppColors, AppFonts, AppSpacing } from '@/constants/design';

const backgroundSource = require('@/assets/images/first-bg.png');

export default function HomeScreen() {
  const router = useRouter();

  const handleGetStarted = () => {
    router.replace('/(tabs)/explore');
  };

  const handleLogin = () => {
    console.log('Login pressed');
  };

  return (
    <View style={styles.container}>
      <ImageBackground source={backgroundSource} style={styles.background} imageStyle={styles.backgroundImage}>
        <View style={styles.backdrop} />
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.content}>
            <View style={styles.hero}>
              <Text style={styles.heading}>Feel better now.{'\n'}Think clearer later</Text>
              <Text style={styles.subheading}>Understand your stress, sleep</Text>
            </View>
            <View style={styles.actions}>
              <PrimaryButton label="Get Started" onPress={handleGetStarted} style={styles.getStartedButton} />
              <Pressable onPress={handleLogin} style={styles.loginButton} android_ripple={{ color: 'rgba(255,255,255,0.16)' }}>
                <Text style={styles.loginText}>Already have an account? Login</Text>
              </Pressable>
            </View>
          </View>
        </SafeAreaView>
        <StatusBar style="light" />
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  background: {
    flex: 1,
  },
  backgroundImage: {
    resizeMode: 'cover',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: AppSpacing.lg,
    justifyContent: 'space-between',
  },
  hero: {
    alignItems: 'center',
    marginTop: AppSpacing.xxl,
  },
  heading: {
    color: AppColors.headlineText,
    fontFamily: AppFonts.display,
    fontWeight: '600',
    fontSize: 32,
    lineHeight: 42,
    textAlign: 'center',
  },
  subheading: {
    marginTop: AppSpacing.sm,
    color: AppColors.headlineText,
    fontFamily: AppFonts.sans,
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 26,
    textAlign: 'center',
  },
  actions: {
    paddingBottom: AppSpacing.xxl,
    gap: AppSpacing.sm,
  },
  getStartedButton: {
    minHeight: 56,
  },
  loginButton: {
    alignItems: 'center',
  },
  loginText: {
    color: AppColors.textPrimary,
    fontFamily: AppFonts.sans,
    fontWeight: '700',
    fontSize: 16,
    lineHeight: 26,
    textAlign: 'center',
  },
});
