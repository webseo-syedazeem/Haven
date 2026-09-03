import { Asset } from 'expo-asset';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    ImageBackground,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppFonts } from '@/constants/theme';
import { restoreSession } from '@/lib/auth/restore-session';

const background = require('@/assets/images/welcome-page-background.webp');
const buttonBackground = require('@/assets/images/button backgound.jpg');
const buttonBackgroundUri = Asset.fromModule(buttonBackground).uri;

export default function FirstPageScreen() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let active = true;

    void restoreSession().then((restored) => {
      if (!active) return;

      if (restored) {
        router.replace('/(tabs)');
      } else {
        setChecking(false);
      }
    });

    return () => {
      active = false;
    };
  }, [router]);

  if (checking) {
    return (
      <View style={styles.loadingScreen}>
        <StatusBar style="light" />
        <ActivityIndicator color="#BB834F" size="small" />
      </View>
    );
  }

  return (
    <ImageBackground
      imageStyle={styles.backgroundImage}
      resizeMode="cover"
      source={background}
      style={[styles.background, Platform.OS === 'web' && styles.backgroundWeb]}>
      <StatusBar style="light" translucent />
      <View pointerEvents="none" style={styles.overlay} />

      <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
        <View style={styles.content}>
          <View style={styles.brandBlock}>
            <Text style={styles.heading}>Passage — Escape the Noise</Text>
            <Text style={styles.tagline}>Focus, Sleep & Reset</Text>
          </View>

          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push('/create-account')}
              style={({ pressed }) => [styles.button, styles.primaryButton, pressed && styles.pressed]}>
              <Text style={styles.primaryLabel}>Get started</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              onPress={() => router.push('/login')}
              style={({ pressed }) => [styles.button, styles.secondaryButton, pressed && styles.pressed]}>
              <Text style={styles.secondaryLabel}>Sign in</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  actions: {
    gap: 14,
    marginHorizontal: '19%',
  },
  background: {
    backgroundColor: '#050505',
    flex: 1,
    overflow: 'hidden',
    width: '100%',
  },
  backgroundImage: {
    height: '100%',
    width: '100%',
  },
  backgroundWeb: {
    height: '100vh' as unknown as number,
    minHeight: '100vh' as unknown as number,
  },
  brandBlock: {
    alignItems: 'center',
    marginTop: '17%',
  },
  button: {
    alignItems: 'center',
    borderColor: '#28221D',
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 54,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingBottom: 38,
  },
  heading: {
    color: '#F1E9DD',
    fontFamily: AppFonts.displayRegular,
    fontSize: 35,
    fontWeight: '500',
    lineHeight: 42,
    textAlign: 'center',
  },
  loadingScreen: {
    alignItems: 'center',
    backgroundColor: '#050505',
    flex: 1,
    justifyContent: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.10)',
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.99 }],
  },
  primaryButton: {
    backgroundColor: '#D2AE7E',
    backgroundImage: `url("${buttonBackgroundUri}")`,
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    backgroundSize: 'cover',
  } as any,
  primaryLabel: {
    color: '#12100E',
    fontFamily: AppFonts.sansMedium,
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  safeArea: {
    flex: 1,
  },
  secondaryButton: {
    backgroundColor: 'rgba(5,5,5,0.58)',
  },
  secondaryLabel: {
    color: '#F1E9DD',
    fontFamily: AppFonts.sansMedium,
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  tagline: {
    color: '#F1E9DD',
    fontFamily: AppFonts.displayRegular,
    fontSize: 25,
    fontWeight: '400',
    letterSpacing: 0.6,
    lineHeight: 34,
    marginTop: 14,
    textAlign: 'center',
  },
});
