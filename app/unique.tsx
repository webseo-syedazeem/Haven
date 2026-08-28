import { Asset } from 'expo-asset';
import { useRouter } from 'expo-router';
import { Image, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppFonts } from '@/constants/theme';

const backIcon = require('@/assets/icons/back icon.svg');
const background = require('@/assets/images/what-make-unique-background.webp');
const buttonBackground = require('@/assets/images/button backgound.jpg');
const backgroundUri = Asset.fromModule(background).uri;
const buttonBackgroundUri = Asset.fromModule(buttonBackground).uri;

const features = [
  {
    title: 'Layered soundscapes',
    subtitle: 'Built with depth and intention',
    icon: require('@/assets/icons/what-make-icon-1.webp'),
  },
  {
    title: 'Backed by science',
    subtitle: 'Guided by research in sound and wellbeing',
    icon: require('@/assets/icons/what-make-icon-2.webp'),
  },
  {
    title: 'No ads, no interruptions',
    subtitle: 'Just pure, immersive listening',
    icon: require('@/assets/icons/what-make-icon-3.webp'),
  },
  {
    title: 'Personalized routines',
    subtitle: 'Support tailored to your rhythm',
    icon: require('@/assets/icons/what-make-icon-4.webp'),
  },
];

const colors = {
  background: '#050505',
  surface: '#0E0E0F',
  primary: '#F1E9DD',
  secondary: '#B8AFA4',
  gold: '#D39C69',
  border: '#3A3028',
  buttonText: '#12100E',
};

export default function WhatMakesUniqueScreen() {
  const router = useRouter();

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Pressable
            accessibilityLabel="Go back"
            hitSlop={12}
            onPress={() => router.back()}
            style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
            <Image resizeMode="contain" source={backIcon} style={styles.backIcon} />
          </Pressable>

          <Text style={styles.heading}>What makes Halcyon unique?</Text>

          <View style={styles.ornamentRow}>
            <View style={styles.ornamentLine} />
            <Text style={styles.ornamentStar}>✦</Text>
          </View>

          <View style={styles.featureList}>
            {features.map((feature, index) => (
              <View key={feature.title} style={[styles.featureRow, index < features.length - 1 && styles.featureBorder]}>
                <View style={styles.featureIconCircle}>
                  <Image resizeMode="contain" source={feature.icon} style={styles.featureIcon} />
                </View>
                <View style={styles.featureTextGroup}>
                  <Text style={styles.featureTitle}>{feature.title}</Text>
                  <Text style={styles.featureSubtitle}>{feature.subtitle}</Text>
                </View>
              </View>
            ))}
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/halcyon-help')}
            style={({ pressed }) => [styles.continueButton, pressed && styles.pressed]}>
            <Text style={styles.continueText}>Continue</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.background,
    backgroundImage: `url("${backgroundUri}")`,
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    backgroundSize: 'cover',
    flex: 1,
  } as any,
  safeArea: { flex: 1 },
  content: { minHeight: '100%', paddingBottom: 40, paddingHorizontal: 30, paddingTop: 90 },
  backButton: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    height: 35,
    justifyContent: 'center',
    left: 20,
    paddingRight: 3,
    position: 'fixed',
    top: 20,
    width: 35,
    zIndex: 10,
  } as any,
  backIcon: { height: 20, width: 20 },
  heading: {
    color: colors.primary,
    fontFamily: AppFonts.displayRegular,
    fontSize: 35,
    fontWeight: '500',
    lineHeight: 42,
  },
  ornamentRow: { alignItems: 'center', flexDirection: 'row', marginTop: 22 },
  ornamentLine: { backgroundColor: colors.gold, height: 1, width: 150 },
  ornamentStar: { color: colors.gold, fontSize: 25, marginLeft: 10 },
  featureList: { marginTop: 30 },
  featureRow: { alignItems: 'center', flexDirection: 'row', minHeight: 106, paddingVertical: 12 },
  featureBorder: { borderBottomColor: 'rgba(211, 156, 105, 0.38)', borderBottomWidth: 1 },
  featureIconCircle: {
    alignItems: 'center',
    backgroundColor: 'rgba(5,5,5,0.58)',
    borderColor: colors.gold,
    borderRadius: 999,
    borderWidth: 1,
    height: 70,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 70,
  },
  featureIcon: { height: 35, width: 35 },
  featureTextGroup: { flex: 1, marginLeft: 24 },
  featureTitle: {
    color: colors.primary,
    fontFamily: AppFonts.displayRegular,
    fontSize: 22,
  },
  featureSubtitle: {
    color: colors.secondary,
    fontFamily: AppFonts.sansRegular,
    fontSize: 14,
    marginTop: 4,
  },
  continueButton: {
    alignItems: 'center',
    backgroundColor: colors.gold,
    backgroundImage: `url("${buttonBackgroundUri}")`,
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    backgroundSize: 'cover',
    borderColor: '#28221D',
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    marginTop: 34,
    overflow: 'hidden',
    paddingVertical: 20,
  } as any,
  continueText: {
    color: colors.buttonText,
    fontFamily: AppFonts.sansMedium,
    fontSize: 15,
    fontWeight: '500',
  },
  pressed: { opacity: 0.88 },
});
