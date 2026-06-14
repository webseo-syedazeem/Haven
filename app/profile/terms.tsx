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

const termsHeroImage = require('@/assets/images/change-pass-image.png');

type TermsSection = {
  body: string[];
  bullets?: string[];
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
};

const TERMS_SECTIONS: TermsSection[] = [
  {
    icon: 'checkbox-outline',
    title: '1. Acceptance of Terms',
    body: [
      'By accessing or using Haven, you agree to be bound by these Terms of Service and our Privacy Policy. If you do not agree, please do not use the app.',
    ],
  },
  {
    icon: 'leaf-outline',
    title: '2. About Haven',
    body: [
      'Haven is a wellbeing app that provides tools for mood tracking, meditation, sleep, breathwork, reflections and insights to support your mental well-being. Haven is not a medical service and does not replace professional advice, diagnosis or treatment.',
    ],
  },
  {
    icon: 'person-outline',
    title: '3. Your Account',
    body: [],
    bullets: [
      'You must be at least 13 years old to use Haven.',
      'You are responsible for maintaining the confidentiality of your account.',
      'You agree to provide accurate and complete information when creating your account.',
    ],
  },
  {
    icon: 'shield-checkmark-outline',
    title: '4. Acceptable Use',
    body: ['You agree not to:'],
    bullets: [
      'Use the app for any illegal or unauthorized purpose.',
      'Attempt to access or interfere with our systems.',
      "Misuse or share other users' content.",
      'Upload harmful, offensive or inappropriate content.',
    ],
  },
  {
    icon: 'card-outline',
    title: '5. Subscriptions & Payments',
    body: ['Some features may require a subscription.'],
    bullets: [
      'Payments are charged through your app store account.',
      'Subscriptions auto-renew unless turned off at least 24 hours before the end of the current period.',
      'Refunds are managed by the App Store or Google Play.',
    ],
  },
  {
    icon: 'at-circle-outline',
    title: '6. Intellectual Property',
    body: [
      'All content, designs, logos, features and materials in Haven are owned by us and protected by copyright and trademark laws. You may not copy, modify or distribute any part of the app without permission.',
    ],
  },
  {
    icon: 'warning-outline',
    title: '7. Limitation of Liability',
    body: [
      'Haven is provided "as is" without warranties of any kind. We are not liable for any indirect, incidental or consequential damages arising from your use of the app.',
    ],
  },
  {
    icon: 'close-outline',
    title: '8. Termination',
    body: [
      'We may suspend or terminate your account if you violate these Terms or misuse the app. You may also delete your account at any time.',
    ],
  },
  {
    icon: 'refresh-outline',
    title: '9. Changes to Terms',
    body: [
      'We may update these Terms from time to time. We will notify you of important changes. Continued use of the app means you accept the updated Terms.',
    ],
  },
  {
    icon: 'headset-outline',
    title: '10. Contact Us',
    body: [
      'If you have any questions about these Terms, please contact us at support@haven.app',
    ],
  },
];

export default function TermsScreen() {
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
          source={termsHeroImage}
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
              <Text style={styles.title}>Terms of Service</Text>
              <Text style={styles.updated}>Last updated: 20 May 2024</Text>
            </View>
          </SafeAreaView>
        </ImageBackground>

        <View style={styles.contentCard}>
          <View style={styles.introCard}>
            <Text style={styles.introText}>
              Welcome to Haven. By using our app, you agree to these Terms of Service. Please read
              them carefully.
            </Text>
          </View>

          {TERMS_SECTIONS.map((section, index) => (
            <View
              key={section.title}
              style={[
                styles.section,
                index < TERMS_SECTIONS.length - 1 && styles.sectionBorder,
              ]}>
              <View style={styles.iconCircle}>
                <Ionicons color="#7B61FF" name={section.icon} size={25} />
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
              <Ionicons color="#7E56D9" name="heart-circle-outline" size={30} />
            </View>
            <Text style={styles.footerText}>
              Thank you for being a part of Haven. Together, let's build a calmer, healthier you.
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
    backgroundColor: '#7B61FF14',
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
