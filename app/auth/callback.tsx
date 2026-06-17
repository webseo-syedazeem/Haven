import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { supabase } from '@/lib/supabase';
import { apiClient } from '@/lib/api/client';

WebBrowser.maybeCompleteAuthSession();

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Mobile: URL se tokens lo
        const url = await Linking.getInitialURL();

        if (url) {
          const parsedUrl = new URL(url);
          const params = new URLSearchParams(
            parsedUrl.hash ? parsedUrl.hash.substring(1) : parsedUrl.search
          );

          const access_token = params.get('access_token');
          const refresh_token = params.get('refresh_token');

          if (access_token && refresh_token) {
            await supabase.auth.setSession({ access_token, refresh_token });
            try {
              await apiClient('/api/auth/sync-profile', { method: 'POST' });
            } catch (e) {
              console.warn('Profile sync failed:', e);
            }
          }
        }

        router.replace('/(tabs)');
      } catch (error) {
        console.error('Callback error:', error);
        router.replace('/welcome');
      }
    };

    handleCallback();
  }, [router]);

  return (
    <View style={{ alignItems: 'center', backgroundColor: '#16102A', flex: 1, justifyContent: 'center' }}>
      <ActivityIndicator color="#7863DC" size="large" />
    </View>
  );
}