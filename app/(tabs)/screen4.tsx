import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppFonts } from '@/constants/theme';

const backgroundImage = require('@/assets/images/bg-4.png');
const backIcon = require('@/assets/images/back.svg');
const rightArrowIcon = require('@/assets/images/right-arrow.svg');
const pinkHeartIcon = require('@/assets/images/pink-heart.svg');
const googleHeartIcon = require('@/assets/images/google-heart.svg');

const connectedApps = [
  {
    title: 'Apple health',
    status: 'Connected',
    icon: 'heart',
  },
  {
    title: 'Google fit',
    status: 'Connected',
    icon: 'google',
  },
] as const;

const privacyActions = ['Manage permission', 'Download my data', 'Delete my data'] as const;

export default function PrivacyScreen() {
  const router = useRouter();

  return (
    <View style={styles.screen}>
      <Image source={backgroundImage} style={styles.backgroundImage} contentFit="cover" />

      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          bounces={false}>
          <View style={styles.mainContainer}>
            <View style={styles.header}>
              <View style={styles.backTitleGroup}>
                <Pressable style={styles.backButton} onPress={() => router.back()}>
                  <Image source={backIcon} style={styles.backIcon} contentFit="contain" />
                </Pressable>

                <View style={styles.titleGroup}>
                  <Text style={styles.title}>Privacy</Text>
                  <Text style={styles.subtitle}>Set Your daily reminder.</Text>
                </View>
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Connected data</Text>

              <View style={styles.connectedList}>
                {connectedApps.map((app) => (
                  <Pressable key={app.title} style={styles.connectedRow}>
                    <View
                      style={
                        app.icon === 'google' ? styles.googleAppIconCircle : styles.appIconCircle
                      }>
                      <Image
                        source={app.icon === 'heart' ? pinkHeartIcon : googleHeartIcon}
                        style={styles.appIcon}
                        contentFit="contain"
                      />
                    </View>

                    <View style={styles.appTextGroup}>
                      <Text style={styles.appTitle}>{app.title}</Text>
                      <Text style={styles.connectedText}>{app.status}</Text>
                    </View>

                    <View style={styles.chevronFrame}>
                      <Image
                        source={rightArrowIcon}
                        style={styles.chevronIcon}
                        contentFit="contain"
                      />
                    </View>
                  </Pressable>
                ))}
              </View>

              <View style={styles.dataPrivacySection}>
                <Text style={styles.sectionTitle}>Data & Privacy</Text>

                <View style={styles.actionList}>
                  {privacyActions.map((action) => (
                    <Pressable key={action} style={styles.actionRow}>
                      <View style={styles.actionRowInner}>
                        <Text style={styles.actionText}>{action}</Text>
                        <View style={styles.chevronFrame}>
                          <Image
                            source={rightArrowIcon}
                            style={styles.chevronIcon}
                            contentFit="contain"
                          />
                        </View>
                      </View>
                    </Pressable>
                  ))}
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: '#d8d7eb',
  },
  backgroundImage: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 24,
  },
  mainContainer: {
    width: '100%',
    maxWidth: 361,
    gap: 51,
    opacity: 1,
  },
  header: {
    width: '100%',
    gap: 16,
    opacity: 1,
  },
  backTitleGroup: {
    width: '100%',
    gap: 24,
    opacity: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    paddingTop: 8,
    paddingRight: 4,
    paddingBottom: 8,
    paddingLeft: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    opacity: 1,
  },
  backIcon: {
    width: 8,
    height: 14,
    opacity: 1,
  },
  titleGroup: {
    gap: 8,
  },
  title: {
    color: '#173F5F',
    fontFamily: AppFonts.displaySemiBold,
    fontSize: 26,
    lineHeight: 34,
    letterSpacing: 0,
  },
  subtitle: {
    color: '#173F5F',
    fontFamily: AppFonts.sansMedium,
    fontSize: 14,
    lineHeight: 22,
    letterSpacing: 0,
  },
  card: {
    width: '100%',
    minHeight: 496,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    gap: 16,
    padding: 16,
    opacity: 1,
  },
  cardTitle: {
    width: '100%',
    height: 26,
    color: '#173F5F',
    fontFamily: AppFonts.sansSemiBold,
    fontSize: 16,
    lineHeight: 26,
    letterSpacing: 0,
  },
  connectedList: {
    width: '100%',
    height: 170,
    gap: 10,
    opacity: 1,
  },
  connectedRow: {
    width: '100%',
    height: 80,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    borderRadius: 12,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    opacity: 1,
  },
  appIconCircle: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 40,
    backgroundColor: '#FF005914',
    opacity: 1,
  },
  googleAppIconCircle: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 40,
    backgroundColor: '#3770FC14',
    opacity: 1,
  },
  appIcon: {
    width: 24,
    height: 24,
    opacity: 1,
  },
  appTextGroup: {
    flex: 1,
    height: 38,
    gap: 4,
    opacity: 1,
  },
  appTitle: {
    width: 161,
    height: 22,
    color: '#173F5F',
    fontFamily: AppFonts.sansSemiBold,
    fontSize: 12,
    lineHeight: 22,
    letterSpacing: 0,
    opacity: 1,
  },
  connectedText: {
    width: 182,
    height: 12,
    color: '#28B92A',
    fontFamily: AppFonts.sansMedium,
    fontSize: 12,
    lineHeight: 12,
    letterSpacing: 0,
    opacity: 1,
  },
  chevronFrame: {
    width: 24,
    height: 24,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 1,
  },
  chevronIcon: {
    width: 8,
    height: 14,
    opacity: 1,
  },
  dataPrivacySection: {
    width: '100%',
    height: 238,
    gap: 16,
    opacity: 1,
  },
  sectionTitle: {
    width: '100%',
    height: 26,
    color: '#173F5F',
    fontFamily: AppFonts.sansSemiBold,
    fontSize: 16,
    lineHeight: 26,
    letterSpacing: 0,
    opacity: 1,
  },
  actionList: {
    width: '100%',
    height: 196,
    gap: 8,
    opacity: 1,
  },
  actionRow: {
    width: '100%',
    height: 60,
    justifyContent: 'center',
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    paddingTop: 16,
    paddingRight: 8,
    paddingBottom: 16,
    paddingLeft: 8,
    opacity: 1,
  },
  actionRowInner: {
    width: 313,
    height: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    opacity: 1,
  },
  actionText: {
    width: 273,
    height: 22,
    color: '#173F5F',
    fontFamily: AppFonts.sansSemiBold,
    fontSize: 14,
    lineHeight: 22,
    letterSpacing: 0,
    opacity: 1,
  },
});
