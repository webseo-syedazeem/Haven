import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppFonts } from '@/constants/theme';

const backgroundImage = require('@/assets/images/tool-page-bg-image.png');

type ToolOption = {
  icon: number;
  iconBackground: string;
  iconSize?: number;
  route: '/tools/breathing' | '/tools/soundscape' | '/tools/checklist' | '/tools/my-mixes';
  subtitle: string;
  title: string;
};

const toolOptions: ToolOption[] = [
  {
    icon: require('@/assets/images/tool-breathing-icon.svg'),
    iconBackground: '#7B61FF14',
    subtitle: 'Calm Your mind',
    title: 'Breathing',
    route: '/tools/breathing',
  },
  {
    icon: require('@/assets/images/tool-focus-hub-icon.svg'),
    iconBackground: '#3770FC14',
    iconSize: 31,
    subtitle: 'Improve focus',
    title: 'Focus Hub',
    route: '/tools/soundscape',
  },
  {
    icon: require('@/assets/images/tool-checklist-icon.svg'),
    iconBackground: '#28B92A14',
    iconSize: 31,
    subtitle: 'Daily habits',
    title: 'Checklist',
    route: '/tools/checklist',
  },
];

const myMixesOption: ToolOption = {
  icon: require('@/assets/images/tool-focus-hub-icon.svg'),
  iconBackground: '#6339FB14',
  iconSize: 31,
  subtitle: 'Your saved mixes',
  title: 'My Mixes',
  route: '/tools/my-mixes',
};

export default function ToolsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.screen}>
      <Image source={backgroundImage} style={styles.backgroundImage} contentFit="cover" />

      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ScrollView
          bounces={false}
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 112 }]}
          showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.title}>Tools</Text>
            <Text style={styles.subtitle}>Find Your calm</Text>
          </View>

          <View style={styles.options}>
            {toolOptions.map((option) => (
              <Pressable
                accessibilityRole="button"
                key={option.title}
                onPress={() => {
                  if (option.route) {
                    router.push(option.route);
                  }
                }}
                style={({ pressed }) => [styles.optionCard, pressed && styles.pressed]}>
                <View style={[styles.iconWrap, { backgroundColor: option.iconBackground }]}>
                  <Image
                    source={option.icon}
                    style={[
                      styles.optionIcon,
                      option.iconSize
                        ? { height: option.iconSize, width: option.iconSize }
                        : null,
                    ]}
                    contentFit="contain"
                  />
                </View>

                <View style={styles.optionCopy}>
                  <Text style={styles.optionTitle}>{option.title}</Text>
                  <Text style={styles.optionSubtitle}>{option.subtitle}</Text>
                </View>
              </Pressable>
            ))}
          </View>

          <View style={styles.myMixesSection}>
            <Text style={styles.sectionLabel}>Your Mixes</Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push(myMixesOption.route)}
              style={({ pressed }) => [styles.optionCard, pressed && styles.pressed]}>
              <View style={[styles.iconWrap, { backgroundColor: myMixesOption.iconBackground }]}>
                <Image
                  source={myMixesOption.icon}
                  style={[
                    styles.optionIcon,
                    { height: myMixesOption.iconSize, width: myMixesOption.iconSize },
                  ]}
                  contentFit="contain"
                />
              </View>
              <View style={styles.optionCopy}>
                <Text style={styles.optionTitle}>{myMixesOption.title}</Text>
                <Text style={styles.optionSubtitle}>{myMixesOption.subtitle}</Text>
              </View>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 17,
    paddingTop: 60,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  iconWrap: {
    alignItems: 'center',
    borderRadius: 12,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  optionCard: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    flexDirection: 'row',
    gap: 16,
    height: 88,
    paddingHorizontal: 17,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 14,
    width: '100%',
  },
  optionCopy: {
    flex: 1,
    gap: 2,
  },
  optionIcon: {
    height: 37,
    width: 37,
  },
  options: {
    gap: 10,
    maxWidth: 348,
    width: '100%',
  },
  myMixesSection: {
    marginTop: 24,
    maxWidth: 348,
    width: '100%',
  },
  optionSubtitle: {
    color: '#000000',
    fontFamily: AppFonts.sansRegular,
    fontSize: 14,
    fontWeight: '400',
    letterSpacing: 0,
    lineHeight: 24,
  },
  optionTitle: {
    color: '#173F5F',
    fontFamily: AppFonts.sansBold,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0,
    lineHeight: 24,
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.99 }],
  },
  safeArea: {
    flex: 1,
  },
  screen: {
    backgroundColor: '#EEF0FF',
    flex: 1,
    overflow: 'hidden',
  },
  sectionLabel: {
    color: '#173F5F',
    fontFamily: AppFonts.sansBold,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0,
    lineHeight: 24,
    marginBottom: 10,
    textAlign: 'left',
    width: '100%',
  },
  subtitle: {
    color: '#54555A',
    fontFamily: AppFonts.sansMedium,
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: 0,
    lineHeight: 26,
  },
  title: {
    color: '#173F5F',
    fontFamily: AppFonts.displayBold,
    fontSize: 32,
  
    letterSpacing: 0,
    lineHeight: 34,
    textAlign: 'center',
  },
});
