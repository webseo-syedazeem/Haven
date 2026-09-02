import { Asset } from 'expo-asset';
import { useRouter } from 'expo-router';
import { Image, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppFonts } from '@/constants/theme';

const backIcon = require('@/assets/icons/back icon.svg');
const background = require('@/assets/images/how-it-works-background.webp');
const buttonBackground = require('@/assets/images/button backgound.jpg');
const backgroundUri = Asset.fromModule(background).uri;
const buttonBackgroundUri = Asset.fromModule(buttonBackground).uri;

const benefits = [
  { label: 'Restful listening', icon: require('@/assets/icons/science-icon-1.png') },
  { label: 'Less unwanted distraction', icon: require('@/assets/icons/science-icon-2.png') },
  { label: 'Support for sustained focus', icon: require('@/assets/icons/science-icon-3.png') },
  { label: 'Calm, predictable environments', icon: require('@/assets/icons/science-icon-4.png') },
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

export default function BackedByScienceScreen() {
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

          <Text style={styles.heading}>Backed by science</Text>

          <View style={styles.ornamentRow}>
            <View style={styles.ornamentLine} />
            <Text style={styles.ornamentStar}>✦</Text>
          </View>

          <Text style={styles.description}>
            Passage is informed by research on natural sound, sound masking, and predictable listening
            environments. Individual responses vary, so Passage does not promise specific health, sleep, or
            productivity outcomes.
          </Text>

          <View style={styles.benefitList}>
            {benefits.map((benefit, index) => (
              <View key={benefit.label} style={[styles.benefitRow, index < benefits.length - 1 && styles.benefitBorder]}>
                <View style={styles.benefitIconCircle}>
                  <Image resizeMode="contain" source={benefit.icon} style={styles.benefitIcon} />
                </View>
                <Text style={styles.benefitLabel}>{benefit.label}</Text>
              </View>
            ))}
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/unique')}
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
  description: {
    color: colors.primary,
    fontFamily: AppFonts.sansRegular,
    fontSize: 17,
    lineHeight: 29,
    marginTop: 28,
  },
  benefitList: { marginTop: 30 },
  benefitRow: { alignItems: 'center', flexDirection: 'row', minHeight: 106, paddingVertical: 12 },
  benefitBorder: { borderBottomColor: 'rgba(211, 156, 105, 0.38)', borderBottomWidth: 1 },
  benefitIconCircle: {
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
  benefitIcon: { height: 35, width: 35 },
  benefitLabel: {
    color: colors.primary,
    flex: 1,
    fontFamily: AppFonts.displayRegular,
    fontSize: 22,
    marginLeft: 24,
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
