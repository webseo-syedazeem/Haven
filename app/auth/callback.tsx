import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { supabase } from '@/lib/supabase';

WebBrowser.maybeCompleteAuthSession();

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        if (typeof window !== 'undefined') {
          const hash = window.location.hash;
          const params = new URLSearchParams(hash.substring(1));
          const access_token = params.get('access_token');
          const refresh_token = params.get('refresh_token');

          if (access_token && refresh_token) {
            await supabase.auth.setSession({
              access_token,
              refresh_token,
            });
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
    <View style={{ alignItems: 'center', flex: 1, justifyContent: 'center' }}>
      <ActivityIndicator color="#7863DC" size="large" />
    </View>
  );
}
