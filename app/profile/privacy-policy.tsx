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
    body: ['We collect information to provide and improve our services. This includes:'],
    bullets: [
      'Account information (name, email, preferences)',
      'Mood, reflections and journal entries',
      'Usage data (features you use, time spent)',
      'Device information (type, OS, unique identifiers)',
      'Health data (with your permission from Apple Health / Google Fit)',
    ],
  },
  {
    accent: '#7B61FF',
    bg: '#7B61FF14',
    icon: 'bar-chart-outline',
    title: '2. How We Use Your Information',
    body: ['We use your information to:'],
    bullets: [
      'Provide, personalize and improve Haven',
      'Generate insights and track your progress',
      'Communicate with you about your account and updates',
      'Ensure app security and prevent fraud',
      'Comply with legal obligations',
    ],
  },
  {
    accent: '#7B61FF',
    bg: '#7B61FF14',
    icon: 'heart-outline',
    title: '3. Health Data & Permissions',
    body: [
      'With your permission, we access health data to provide better insights (e.g., sleep, heart rate, steps).',
      'You can connect or disconnect anytime in the app settings.',
      'We never share your health data with third parties.',
    ],
  },
  {
    accent: '#7B61FF',
    bg: '#7B61FF14',
    icon: 'people-outline',
    title: '4. Data Sharing',
    body: ['We do not sell your personal data. We may share data only in these cases:'],
    bullets: [
      'With trusted service providers who help us operate the app (analytics, hosting, notifications)',
      'When required by law or to protect rights and safety',
      'In connection with a business transfer (merger, sale, etc.)',
    ],
  },
  {
    accent: '#7B61FF',
    bg: '#7B61FF14',
    icon: 'lock-closed-outline',
    title: '5. Data Storage & Security',
    body: [
      'We use industry-standard security measures to protect your data. Your information is encrypted in transit and at rest. We store data on secure servers and retain it only as long as necessary.',
    ],
  },
  {
    accent: '#7B61FF',
    bg: '#7B61FF14',
    icon: 'person-circle-outline',
    title: '6. Your Choices & Rights',
    body: ['You have control over your data:'],
    bullets: [
      'View, update or delete your information anytime',
      'Download your data',
      'Disconnect health data',
      'Delete your account (this will permanently remove your data)',
    ],
  },
  {
    accent: '#7B61FF',
    bg: '#7B61FF14',
    icon: 'happy-outline',
    title: "7. Children's Privacy",
    body: [
      'Haven is not intended for children under 13. We do not knowingly collect data from children under 13.',
    ],
  },
  {
    accent: '#7B61FF',
    bg: '#7B61FF14',
    icon: 'document-text-outline',
    title: '8. Changes to This Policy',
    body: [
      'We may update this Privacy Policy from time to time. We will notify you of important changes via the app or email.',
    ],
  },
  {
    accent: '#7B61FF',
    bg: '#7B61FF14',
    icon: 'mail-outline',
    title: '9. Contact Us',
    body: [
      'If you have questions about this Privacy Policy or your data, contact us at:',
      'Email: privacy@haven.app',
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
              <Text style={styles.updated}>Last updated: 20 May 2024</Text>
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
    left: 18,
    position: 'absolute',
    top: 15,
    width: 32,
    zIndex: 3,
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
    height: 240,
    overflow: 'hidden',
  },
  heroCopy: {
    alignItems: 'center',
    marginTop: 86,
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
