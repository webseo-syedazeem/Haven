import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import {
  ActivityIndicator,
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';

import { AppFonts } from '@/constants/theme';
import { apiClient } from '@/lib/api/client';

const backgroundImage = require('@/assets/images/4a78c0b5bcbe750563b0d0e3ecbe9951c1d0f0cc.png');

export default function SoundscapeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { data, isLoading } = useQuery({
    queryKey: ['soundscapes'],
    queryFn: () => apiClient<any>('/api/soundscapes'),
  });

  const soundscapes = data?.data?.soundscapes ?? data?.soundscapes ?? [];

  return (
    <ImageBackground source={backgroundImage} resizeMode="cover" style={styles.screen}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ScrollView
          bounces={false}
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 100 }]}
          showsVerticalScrollIndicator={false}>

          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backChevron}>‹</Text>
          </Pressable>

          <Text style={styles.title}>Focus Hub</Text>
          <Text style={styles.subtitle}>Improve focus</Text>

          {isLoading ? (
            <ActivityIndicator color="#7B61FF" size="large" style={{ marginTop: 40 }} />
          ) : (
            <View style={styles.list}>
              {soundscapes.map((s: any, index: number) => (
                <Pressable
                  key={s.id ?? index}
                  style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}>
                  <View style={styles.iconCircle}>
                    <Image
                      source={require('@/assets/icons/dashbord-clock-icon.svg')}
                      style={[styles.icon, { tintColor: '#3770FC' }]}
                      contentFit="contain"
                    />
                  </View>
                  <View style={styles.cardText}>
                    <Text style={styles.cardTitle}>{s.name ?? s.title}</Text>
                    <Text style={styles.cardSubtitle}>{s.category ?? 'Soundscape'}</Text>
                  </View>
                </Pressable>
              ))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#C8BFEE' },
  safeArea: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingTop: 16 },
  backButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.70)',
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    marginBottom: 20,
    width: 40,
    elevation: 3,
  },
  backChevron: { color: '#173F5F', fontSize: 26, fontWeight: '300', lineHeight: 30, marginTop: -2 },
  title: {
    color: '#173F5F',
    fontFamily: AppFonts.displayBold,
    fontSize: 34,
    fontWeight: '700',
    lineHeight: 42,
    marginBottom: 6,
  },
  subtitle: {
    color: '#8C8C8C',
    fontFamily: AppFonts.sansRegular,
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 24,
  },
  list: { gap: 12 },
  card: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 16,
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    elevation: 3,
  },
  cardPressed: { opacity: 0.88, transform: [{ scale: 0.99 }] },
  iconCircle: {
    alignItems: 'center',
    backgroundColor: '#3770FC14',
    borderRadius: 24,
    height: 48,
    justifyContent: 'center',
    marginRight: 16,
    width: 48,
  },
  icon: { height: 24, width: 24 },
  cardText: { flex: 1 },
  cardTitle: {
    color: '#173F5F',
    fontFamily: AppFonts.sansSemiBold,
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 22,
  },
  cardSubtitle: {
    color: '#8C8C8C',
    fontFamily: AppFonts.sansRegular,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 2,
  },
});