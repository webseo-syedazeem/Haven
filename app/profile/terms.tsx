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
      'By creating an account or using Steadia, you agree to these Terms of Service and our Privacy Policy. If you do not agree, please do not use the app.',
    ],
  },
  {
    icon: 'leaf-outline',
    title: '2. About Steadia',
    body: [
      'Steadia is a stress-navigation and wellbeing app. It offers tools such as mood check-ins, nightly stress reflection, breathing exercises, soundscapes, daily routines, and personalised insights to help you understand and manage everyday stress.',
    ],
  },
  {
    icon: 'medical-outline',
    title: '3. Not Medical Advice',
    body: [
      'Steadia supports general wellbeing and stress awareness. It is not a medical device and does not provide medical advice, diagnosis, or treatment.',
      'Insights are based on the information you provide and are not a substitute for professional care. Always consult a qualified professional for any medical or mental-health concerns.',
      'If you ever feel unsafe or are in crisis, contact your local emergency services or a crisis support line immediately.',
    ],
  },
  {
    icon: 'person-outline',
    title: '4. Eligibility & Your Account',
    body: ['To use Steadia:'],
    bullets: [
      'You must be at least 13 years old.',
      'You are responsible for keeping your login details secure.',
      'You agree to provide accurate information and keep it up to date.',
      'You are responsible for activity that happens under your account.',
    ],
  },
  {
    icon: 'card-outline',
    title: '5. Subscriptions & Payments',
    body: ['Steadia may offer premium features through a paid subscription:'],
    bullets: [
      'Subscriptions are billed through your App Store (Apple) account.',
      'Your subscription auto-renews unless you turn off auto-renew at least 24 hours before the end of the current period.',
      'You can manage or cancel your subscription anytime in your App Store account settings.',
      'Any unused portion of a free trial is forfeited when you start a paid subscription.',
      'Refunds are handled by Apple under their policies.',
    ],
  },
  {
    icon: 'create-outline',
    title: '6. Your Content',
    body: [
      'The reflections, notes, moods, and other entries you create remain yours.',
      'You grant us permission to store and process this content only to operate and personalise the app for you. We do not sell it.',
    ],
  },
  {
    icon: 'shield-checkmark-outline',
    title: '7. Acceptable Use',
    body: ['You agree not to:'],
    bullets: [
      'Use Steadia for any unlawful or unauthorised purpose.',
      'Attempt to access, disrupt, or reverse-engineer our systems.',
      'Upload harmful, offensive, or infringing content.',
      'Interfere with other users or the security of the app.',
    ],
  },
  {
    icon: 'pulse-outline',
    title: '8. Connected Health Data',
    body: [
      'Connecting Apple Health or Android Health Connect is optional and fully under your control.',
      'You can connect or disconnect these sources at any time. See our Privacy Policy for how this data is used.',
    ],
  },
  {
    icon: 'at-circle-outline',
    title: '9. Intellectual Property',
    body: [
      'The Steadia name, design, content, soundscapes, and software are owned by us or our licensors and protected by intellectual-property laws. You may not copy, modify, distribute, or create derivative works without our written permission.',
    ],
  },
  {
    icon: 'warning-outline',
    title: '10. Disclaimers & Limitation of Liability',
    body: [
      'Steadia is provided "as is" and "as available" without warranties of any kind.',
      'To the maximum extent permitted by law, we are not liable for any indirect, incidental, or consequential damages arising from your use of the app.',
    ],
  },
  {
    icon: 'close-outline',
    title: '11. Termination',
    body: [
      'We may suspend or end your access if you breach these Terms or misuse the app. You can stop using Steadia and delete your account at any time from the app settings.',
    ],
  },
  {
    icon: 'refresh-outline',
    title: '12. Changes to These Terms',
    body: [
      'We may update these Terms from time to time. We will update the date above and, where appropriate, notify you in the app. Continued use after changes means you accept the updated Terms.',
    ],
  },
  {
    icon: 'globe-outline',
    title: '13. Governing Law',
    body: [
      'These Terms are governed by the laws of [GOVERNING JURISDICTION], without regard to conflict-of-law rules.',
    ],
  },
  {
    icon: 'headset-outline',
    title: '14. Contact Us',
    body: ['If you have any questions about these Terms, please contact us at [CONTACT EMAIL].'],
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
              <Text style={styles.updated}>Last updated: [INSERT LAUNCH DATE]</Text>
            </View>
          </SafeAreaView>
        </ImageBackground>

        <View style={styles.contentCard}>
          <View style={styles.introCard}>
            <Text style={styles.introText}>
              Welcome to Steadia. By using our app, you agree to these Terms of Service. Please read
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
              Thank you for being a part of Steadia. Together, let's build a calmer, healthier you.
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
