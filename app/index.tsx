import { useQueryClient } from '@tanstack/react-query';
import { Asset } from 'expo-asset';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Image,
    ImageBackground,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppFonts } from '@/constants/theme';
import { ME_QUERY_KEY } from '@/hooks/useUser';
import { userApi } from '@/lib/api/user';
import { clearAuthTokens, refreshSession, setAccessToken, setAuthTokens } from '@/lib/haven-api';

const background = require('@/assets/images/welcome-page-background.webp');
const logo = require('@/assets/images/Logo.webp');
const buttonBackground = require('@/assets/images/button backgound.jpg');
const buttonBackgroundUri = Asset.fromModule(buttonBackground).uri;

function getWebStorage() {
  return typeof globalThis !== 'undefined'
    ? (globalThis as unknown as { localStorage?: Storage }).localStorage
    : undefined;
}

async function getStoredItem(key: string) {
  if (Platform.OS === 'web') return getWebStorage()?.getItem(key) ?? null;
  return SecureStore.getItemAsync(key);
}

async function setStoredItem(key: string, value: string) {
  if (Platform.OS === 'web') {
    getWebStorage()?.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

async function deleteStoredItem(key: string) {
  if (Platform.OS === 'web') {
    getWebStorage()?.removeItem(key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

export default function FirstPageScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const accessToken =
          (await getStoredItem('access_token')) ??
          (await getStoredItem('haven.auth.access_token'));
        const refreshToken = await getStoredItem('haven.auth.refresh_token');

        if (!accessToken) {
          setChecking(false);
          return;
        }

        setAccessToken(accessToken);
        if (refreshToken) setAuthTokens({ refreshToken });

        try {
          const meData = await userApi.get();
          queryClient.setQueryData(ME_QUERY_KEY, meData);
          router.replace('/(tabs)');
          return;
        } catch {
          if (refreshToken) {
            try {
              const res: any = await refreshSession(refreshToken);
              const session = res?.data?.session ?? res;
              const newAccessToken = session?.access_token ?? session?.accessToken ?? session?.token;
              const newRefreshToken = session?.refresh_token ?? session?.refreshToken;

              if (newAccessToken) {
                await setStoredItem('access_token', newAccessToken);
                if (newRefreshToken) {
                  await setStoredItem('haven.auth.refresh_token', newRefreshToken);
                }
                setAccessToken(newAccessToken);
                router.replace('/(tabs)');
                return;
              }
            } catch {}
          }
        }

        clearAuthTokens();
        await deleteStoredItem('access_token');
        await deleteStoredItem('haven.auth.access_token');
        await deleteStoredItem('haven.auth.refresh_token');
      } catch {}

      setChecking(false);
    })();
  }, [queryClient, router]);

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
            <Image resizeMode="contain" source={logo} style={styles.logo} />
            <Text style={styles.tagline}>{`Soundscapes for\nFocus, Sleep & Reset`}</Text>
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
  loadingScreen: {
    alignItems: 'center',
    backgroundColor: '#050505',
    flex: 1,
    justifyContent: 'center',
  },
  logo: {
    height: 150,
    width: '65%',
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
