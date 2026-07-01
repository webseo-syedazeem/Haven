import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppFonts } from '@/constants/theme';

const privacyHeroImage = require('@/assets/images/change-pass-image.png');

type PolicySection = {
  accent: string;
  bg: string;
  body: string[];
  bullets?: string[];
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
};

const POLICY_SECTIONS: PolicySection[] = [
  {
    accent: '#7B61FF',
    bg: '#7B61FF14',
    icon: 'person-outline',
    title: '1. Information We Collect',
    body: ['We only collect what helps Steadia work for you. This can include:'],
    bullets: [
      'Account details: your name and email, plus basic Google profile info if you sign in with Google',
      'Your entries: onboarding answers, mood check-ins, nightly stress reflections, notes, glimmers, tasks, and breathing sessions',
      'Soundscape preferences: saved mixes, layers, and favourites',
      'Optional health data (only if you choose to connect it)',
      'Limited device info such as device type, operating system, and app version',
    ],
  },
  {
    accent: '#7B61FF',
    bg: '#7B61FF14',
    icon: 'bar-chart-outline',
    title: '2. How We Use Your Information',
    body: [
      'We use your information to calculate your Daily Ease and compare it with your Stress Today, generate gentle plain-language insights, provide soundscapes and breathing tools, manage your account and subscription, and keep the app secure.',
      'We never use your data to diagnose, treat, or make medical claims.',
    ],
  },
  {
    accent: '#7B61FF',
    bg: '#7B61FF14',
    icon: 'heart-outline',
    title: '3. Health Data & Permissions',
    body: [
      'Connecting Apple Health (iOS) or Health Connect (Android) is optional. We only read the categories you allow, such as steps, sleep, heart rate, HRV, and resting heart rate.',
      'We read your health data but never write to it, and we store only the summary values needed for your insights — not your full health records.',
      'We never sell your health data or share it with third parties for their own purposes, and Apple Health data is never stored in iCloud.',
      'You can disconnect any health source at any time in settings.',
    ],
  },
  {
    accent: '#7B61FF',
    bg: '#7B61FF14',
    icon: 'eye-off-outline',
    title: '4. No Analytics or Ad Tracking',
    body: [
      'Steadia does not use third-party analytics, advertising, or tracking tools, and we do not track you across other apps or websites.',
    ],
  },
  {
    accent: '#7B61FF',
    bg: '#7B61FF14',
    icon: 'people-outline',
    title: '5. How We Share Information',
    body: ['We do not sell your personal data. We share it only with the providers needed to run Steadia:'],
    bullets: [
      'Supabase — secure sign-in, database, and storage (including your profile photo)',
      'RevenueCat — to manage your subscription',
      'Google — only if you choose to sign in with Google',
      'When required by law, or as part of a business transfer',
    ],
  },
  {
    accent: '#7B61FF',
    bg: '#7B61FF14',
    icon: 'card-outline',
    title: '6. Subscriptions',
    body: [
      'If you subscribe, payment is processed by the App Store (Apple). We and our subscription provider (RevenueCat) receive subscription status, such as the product and expiry date, to manage your access. We never receive your full payment-card details.',
    ],
  },
  {
    accent: '#7B61FF',
    bg: '#7B61FF14',
    icon: 'lock-closed-outline',
    title: '7. Data Storage & Security',
    body: [
      'Your data is encrypted in transit and at rest and stored on secure servers with reputable providers. No system is completely secure, but we take strong measures to protect your information.',
    ],
  },
  {
    accent: '#7B61FF',
    bg: '#7B61FF14',
    icon: 'person-circle-outline',
    title: '8. Your Choices & Rights',
    body: ['You are in control of your data. You can:'],
    bullets: [
      'Access, update, or correct your information',
      'Delete your account and data from the app settings',
      'Export a copy of your data',
      'Disconnect health data or withdraw consent at any time',
    ],
  },
  {
    accent: '#7B61FF',
    bg: '#7B61FF14',
    icon: 'happy-outline',
    title: "9. Children's Privacy",
    body: [
      'Steadia is not intended for children under 13, and we do not knowingly collect their data.',
    ],
  },
  {
    accent: '#7B61FF',
    bg: '#7B61FF14',
    icon: 'mail-outline',
    title: '10. Changes & Contact',
    body: [
      'We may update this Privacy Policy from time to time and will update the date above.',
      'If you have questions about this Privacy Policy or your data, contact us at [CONTACT EMAIL].',
    ],
  },
];

export default function PrivacyPolicyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.screen}>
      <ScrollView
        bounces={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 26 }}
        showsVerticalScrollIndicator={false}>
        <ImageBackground
          imageStyle={styles.heroImage}
          resizeMode="cover"
          source={privacyHeroImage}
          style={styles.hero}>
          <SafeAreaView edges={['top']} style={styles.heroSafe}>
            <Pressable
              accessibilityLabel="Go back"
              hitSlop={12}
              onPress={() => router.back()}
              style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
              <Ionicons color="#000000" name="chevron-back" size={18} />
            </Pressable>

            <View style={styles.heroCopy}>
              <Text style={styles.title}>Privacy Policy</Text>
              <Text style={styles.updated}>Last updated: [INSERT LAUNCH DATE]</Text>
            </View>
          </SafeAreaView>
        </ImageBackground>

        <View style={styles.contentCard}>
          <View style={styles.introCard}>
            <Text style={styles.introText}>
              Your privacy is important to us. This Privacy Policy explains how we collect, use,
              store and protect your information.
            </Text>
          </View>

          {POLICY_SECTIONS.map((section, index) => (
            <View
              key={section.title}
              style={[
                styles.section,
                index < POLICY_SECTIONS.length - 1 && styles.sectionBorder,
              ]}>
              <View style={[styles.iconCircle, { backgroundColor: section.bg }]}>
                <Ionicons color={section.accent} name={section.icon} size={20} />
              </View>

              <View style={styles.sectionContent}>
                <Text style={styles.sectionTitle}>{section.title}</Text>
                {section.body.map((line) => (
                  <Text key={line} style={styles.bodyText}>
                    {line}
                  </Text>
                ))}
                {!!section.bullets?.length && (
                  <View style={styles.bulletList}>
                    {section.bullets.map((bullet) => (
                      <View key={bullet} style={styles.bulletRow}>
                        <Text style={styles.bulletDot}>{'\u2022'}</Text>
                        <Text style={styles.bulletText}>{bullet}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </View>
          ))}

          <View style={styles.footerBanner}>
            <View style={styles.footerIconWrap}>
              <Ionicons color="#7E56D9" name="shield-checkmark-outline" size={28} />
            </View>
            <Text style={styles.footerText}>
              We are here to protect your privacy and support your wellbeing journey.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  backButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 16,
    height: 32,
    justifyContent: 'center',
    marginLeft: 18,
    marginTop: 8,
    width: 32,
  },
  bodyText: {
    color: '#4A5565',
    fontFamily: AppFonts.sansRegular,
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    marginTop: 5,
  },
  bulletDot: {
    color: '#4A5565',
    fontFamily: AppFonts.sansRegular,
    fontSize: 15,
    fontWeight: '400',
    lineHeight: 20,
    marginRight: 10,
    marginTop: 1,
  },
  bulletList: {
    gap: 0,
    marginTop: 5,
  },
  bulletRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
  },
  bulletText: {
    color: '#4A5565',
    flex: 1,
    fontFamily: AppFonts.sansRegular,
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
  },
  contentCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -24,
    paddingHorizontal: 18,
    paddingTop: 22,
  },
  footerBanner: {
    alignItems: 'center',
    backgroundColor: '#7B61FF14',
    borderColor: '#EBEBEB',
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 14,
    marginBottom: 10,
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  footerIconWrap: {
    alignItems: 'center',
    borderRadius: 12,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  footerText: {
    color: '#173F5F',
    flex: 1,
    fontFamily: AppFonts.sansMedium,
    fontSize: 13.5,
    fontWeight: '500',
    lineHeight: 21,
  },
  hero: {
    height: 260,
    overflow: 'hidden',
  },
  heroCopy: {
    alignItems: 'center',
    marginTop: 80,
    paddingHorizontal: 24,
  },
  heroImage: {
    transform: [{ scale: 1.05 }],
  },
  heroSafe: {
    flex: 1,
  },
  iconCircle: {
    alignItems: 'center',
    borderRadius: 10,
    height: 40,
    justifyContent: 'center',
    marginTop: 4,
    width: 40,
  },
  introCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#EBEBEB',
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    padding: 20,
  },
  introText: {
    color: '#4A5565',
    fontFamily: AppFonts.sansMedium,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  pressed: {
    opacity: 0.86,
    transform: [{ scale: 0.99 }],
  },
  screen: {
    backgroundColor: '#FFFFFF',
    flex: 1,
  },
  section: {
    flexDirection: 'row',
    gap: 16,
    paddingBottom: 24,
    paddingTop: 24,
  },
  sectionBorder: {
    borderBottomColor: '#D9D9D9',
    borderBottomWidth: 1,
  },
  sectionContent: {
    flex: 1,
  },
  sectionTitle: {
    color: '#0A0A0A',
    fontFamily: AppFonts.sansMedium,
    fontSize: 18,
    fontWeight: '500',
    lineHeight: 27,
  },
  title: {
    color: '#173F5F',
    fontFamily: AppFonts.displayBold,
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 40,
    textAlign: 'center',
  },
  updated: {
    color: '#173F5F',
    fontFamily: AppFonts.sansMedium,
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 26,
    marginTop: 8,
    textAlign: 'center',
  },
});
