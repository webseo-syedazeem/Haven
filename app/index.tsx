import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as SecureStore from 'expo-secure-store';

import { ExploreButton } from '@/components/ExploreButton';
import { ScreenWrapper } from '@/components/ScreenWrapper';
import { AppFonts } from '@/constants/theme';
import { setAccessToken, setAuthTokens, checkSession, refreshSession, clearAuthTokens } from '@/lib/haven-api';

const firstPageBackground = require('@/assets/images/first-page-background-image.png');

function getWebStorage() {
  return typeof globalThis !== 'undefined'
    ? (globalThis as unknown as { localStorage?: Storage }).localStorage
    : undefined;
}

async function getStoredItem(key: string) {
  if (Platform.OS === 'web') {
    return getWebStorage()?.getItem(key) ?? null;
  }

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
        if (refreshToken) {
          setAuthTokens({ refreshToken });
        }

        try {
          // Validate token via check-session endpoint
          await checkSession();
          router.replace('/(tabs)');
          return;
        } catch {
          // Access token invalid/expired, try refresh
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
            } catch {
              // Refresh failed too
            }
          }
        }

        // All checks failed — clear stale tokens
        clearAuthTokens();
        await deleteStoredItem('access_token');
        await deleteStoredItem('haven.auth.access_token');
        await deleteStoredItem('haven.auth.refresh_token');
      } catch {}

      setChecking(false);
    })();
  }, [router]);

  if (checking) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator color="#7863DC" size="large" />
      </View>
    );
  }

  return (
    <>
      <StatusBar hidden />
      <ScreenWrapper
        backgroundImage={firstPageBackground}
        bottomReserve={170}
        bottomContent={
          <>
            <ExploreButton
              label="Get Started"
              onPress={() => router.push('/create-account')}
              style={styles.getStartedButton}
            />

            <Pressable
              accessibilityRole="button"
              onPress={() => router.push('/welcome')}
              style={styles.loginLinkButton}>
              <Text style={styles.loginPrompt}>
                Already have an account? <Text style={styles.loginLink}>Login</Text>
              </Text>
            </Pressable>
          </>
        }
        bottomContentStyle={styles.bottomArea}
        middleContent={
          <View style={styles.copy}>
            <Text style={styles.heading}>{`Feel better now.\nThink clearer later`}</Text>
            <Text style={styles.description}>Understand your stress, sleep</Text>
          </View>
        }
        middleContentStyle={styles.content}
      />
    </>
  );
}

const styles = StyleSheet.create({
  loadingScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F4EAF8',
  },
  bottomArea: {
    paddingHorizontal: 12,
  },
  content: {
    paddingHorizontal: 20,
  },
  copy: {
    alignItems: 'center',
  },
  description: {
    color: '#173F5F',
    fontFamily: AppFonts.sansMedium,
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: 0,
    lineHeight: 26,
    textAlign: 'center',
  },
  getStartedButton: {
    alignSelf: 'center',
    maxWidth: 348,
    width: '100%',
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
  loginLink: {
    color: '#ffffff',
  },
  loginLinkButton: {
    alignSelf: 'center',
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  loginPrompt: {
    color: '#ffffff',
    fontFamily: AppFonts.sansMedium,
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: 0,
    lineHeight: 26,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
