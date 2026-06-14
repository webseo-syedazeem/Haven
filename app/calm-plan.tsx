import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppFonts } from '@/constants/theme';
import { useSetup, type SetupActivity } from '@/contexts/SetupContext';

const backgroundImage = require('@/assets/images/third-bg.png');
const heartIcon = require('@/assets/images/heart.svg');
const monnIcon = require('@/assets/images/monn.svg');
const sunIcon = require('@/assets/images/sun.svg');
const linesIcon = require('@/assets/images/lines.svg');

function getActivityIcon(activity: SetupActivity) {
  const key = (activity.icon || activity.type || '').toLowerCase();

  if (key.includes('breath')) {
    return linesIcon;
  }

  if (key.includes('moon') || key.includes('sleep') || key.includes('wind')) {
    return monnIcon;
  }

  if (key.includes('sun')) {
    return sunIcon;
  }

  return sunIcon;
}

export default function PlanScreen() {
  const router = useRouter();
  const { plan, resetSetup } = useSetup();
  const activities = plan?.activities ?? [];

  const handleDone = () => {
    resetSetup();
    router.replace('/(tabs)');
  };

  return (
    <View style={styles.screen}>
      <Image source={backgroundImage} style={styles.backgroundImage} contentFit="cover" />

      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          bounces={false}>
          <View style={styles.header}>
            <Text style={styles.title}>{plan?.plan_title ?? 'Your first calm plan\nis ready.'}</Text>
            <Text style={styles.subtitle}>
              {plan?.plan_subtitle ?? 'Small actions to help lower stress'}
            </Text>
          </View>

          <View style={styles.planList}>
            {activities.length ? (
              activities.map((item) => (
                <View key={`${item.title}-${item.duration}`} style={styles.planCard}>
                  <View style={styles.planContent}>
                    <View style={styles.planInner}>
                    <View style={styles.planIconFrame}>
                      <Image
                        source={getActivityIcon(item)}
                        style={styles.planSvgIcon}
                        contentFit="contain"
                      />
                    </View>
                    <View style={styles.planTextGroup}>
                      <Text style={styles.planTitle}>{item.title}</Text>
                      {!!item.duration && <Text style={styles.planSubtitle}>{item.duration}</Text>}
                      {!!item.description && (
                        <Text style={styles.planSubtitle}>{item.description}</Text>
                      )}
                    </View>
                  </View>
                </View>
              </View>
              ))
            ) : (
              <Text style={styles.emptyPlanText}>
                Your plan is not available yet. Please go back and complete your setup.
              </Text>
            )}
          </View>

          <View style={styles.noteCard}>
            <View style={styles.noteInner}>
              <View style={styles.noteIconFrame}>
                <Image source={heartIcon} style={styles.noteIcon} contentFit="contain" />
              </View>
              <Text style={styles.noteText}>
                {plan?.message ?? 'Heaven adapts support into your real life,\nnot a perfect routine.'}
              </Text>
            </View>
          </View>

          <View style={styles.actions}>
            <View style={styles.actionsInner}>
              <Pressable
                onPress={handleDone}
                style={({ pressed }) => [styles.continueButton, pressed && styles.pressed]}>
                <LinearGradient
                  colors={['#5AA1E2', '#0D6FD0']}
                  end={{ x: 0, y: 1 }}
                  locations={[0.0379, 0.75]}
                  start={{ x: 0, y: 0 }}
                  style={styles.continueGradient}>
                  <View pointerEvents="none" style={styles.innerShadow}>
                    <LinearGradient
                      colors={['rgba(255, 255, 255, 0.5)', 'rgba(255, 255, 255, 0)']}
                      end={{ x: 0, y: 1 }}
                      start={{ x: 0, y: 0 }}
                      style={styles.innerShadowTop}
                    />
                    <LinearGradient
                      colors={['rgba(255, 255, 255, 0.5)', 'rgba(255, 255, 255, 0)']}
                      end={{ x: 1, y: 0 }}
                      start={{ x: 0, y: 0 }}
                      style={styles.innerShadowLeft}
                    />
                  </View>
                  <Text style={styles.continueText}>Done</Text>
                </LinearGradient>
              </Pressable>
              <Pressable onPress={() => router.back()} style={styles.backButton}>
                <Text style={styles.backText}>Back</Text>
              </Pressable>
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
    backgroundColor: '#edb45d',
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
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingBottom: 28,
    paddingTop: 60,
    flexGrow: 1,
    width: '100%',
  },
  header: {
    width: '100%',
    alignItems: 'center',
    gap: 8,
    opacity: 1,
  },
  title: {
    width: '100%',
    color: '#173F5F',
    fontFamily: AppFonts.displaySemiBold,
    fontSize: 32,
    lineHeight: 42,
    letterSpacing: 0,
    textAlign: 'center',
    opacity: 1,
  },
  subtitle: {
    width: '100%',
    color: '#173F5F',
    fontFamily: AppFonts.sansMedium,
    fontSize: 16,
    lineHeight: 26,
    letterSpacing: 0,
    textAlign: 'center',
    opacity: 1,
  },
  planList: {
    width: '100%',
    maxWidth: 348,
    gap: 8,
    marginTop: 54,
    opacity: 1,
  },
  planCard: {
    width: '100%',
    minHeight: 74,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    paddingTop: 8,
    paddingRight: 16,
    paddingBottom: 8,
    paddingLeft: 16,
    gap: 10,
    opacity: 1,
    boxShadow: 'inset 4px 4px 16px 0px #FFFFFF80',
  },
  planContent: {
    width: '100%',
    minHeight: 56,
    gap: 10,
    padding: 10,
    opacity: 1,
  },
  planInner: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    opacity: 1,
  },
  planIconFrame: {
    width: 24,
    height: 24,
    marginTop: 5,
    position: 'relative',
    opacity: 1,
  },
  symbolIcon: {
    width: 20,
    height: 20,
    color: '#3770FC',
    fontSize: 22,
    lineHeight: 20,
    textAlign: 'center',
  },
  planSvgIcon: {
    height: 20,
    opacity: 1,
    width: 20,
  },
  planTextGroup: {
    flex: 1,
    opacity: 1,
  },
  planTitle: {
    color: '#000000',
    fontFamily: AppFonts.sansSemiBold,
    fontSize: 14,
    lineHeight: 24,
    letterSpacing: 0,
    opacity: 1,
  },
  planSubtitle: {
    color: '#8C8C8C',
    fontFamily: AppFonts.sansSemiBold,
    fontSize: 12,
    lineHeight: 22,
    letterSpacing: 0,
    opacity: 1,
  },
  emptyPlanText: {
    color: '#FFFFFF',
    fontFamily: AppFonts.sansMedium,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 22,
    textAlign: 'center',
  },
  noteCard: {
    width: '100%',
    maxWidth: 348,
    height: 88,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: '#FFFFFFE5',
    borderWidth: 1,
    borderColor: '#FFFFFF80',
    marginTop: 28,
    paddingTop: 8,
    paddingRight: 24,
    paddingBottom: 8,
    paddingLeft: 24,
    gap: 10,
    opacity: 1,
    boxShadow: '0px 4px 16px 0px #00000014',
  },
  noteInner: {
    width: 281,
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    opacity: 1,
  },
  noteIconFrame: {
    width: 24,
    height: 24,
    position: 'relative',
    opacity: 1,
  },
  noteIcon: {
    position: 'absolute',
    top: 3,
    left: 2,
    width: 20,
    height: 18.350000381469727,
    opacity: 1,
  },
  noteText: {
    width: 247,
    height: 44,
    color: '#173F5F',
    fontFamily: AppFonts.sansRegular,
    fontSize: 12,
    lineHeight: 22,
    letterSpacing: 0,
  },
  actions: {
    width: '100%',
    maxWidth: 348,
    height: 102,
    marginTop: 44,
    opacity: 1,
  },
  actionsInner: {
    width: '100%',
    height: 102,
    alignItems: 'center',
    gap: 16,
    opacity: 1,
  },
  continueButton: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: '#0d6fd0',
    width: '100%',
    height: 54,
    maxWidth: 348,
    overflow: 'hidden',
    borderRadius: 27,
    elevation: 0,
    opacity: 1,
  },
  continueGradient: {
    alignItems: 'center',
    height: '100%',
    justifyContent: 'center',
    width: '100%',
  },
  continueText: {
    color: '#FFFFFF',
    fontFamily: AppFonts.sansMedium,
    fontSize: 18,
    fontWeight: '500',
    lineHeight: 26,
    letterSpacing: 0,
    textAlign: 'center',
  },
  innerShadow: {
    ...StyleSheet.absoluteFillObject,
  },
  innerShadowLeft: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    top: 4,
    width: 16,
  },
  innerShadowTop: {
    height: 16,
    left: 4,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  pressed: {
    opacity: 0.86,
    transform: [{ scale: 0.99 }],
  },
  backButton: {
    width: '100%',
    height: 26,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 1,
  },
  backText: {
    width: '100%',
    height: 26,
    color: '#FFFFFF',
    fontFamily: AppFonts.sansBold,
    fontSize: 16,
    lineHeight: 26,
    letterSpacing: 0,
    textAlign: 'center',
    opacity: 1,
  },
});
