import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppFonts } from '@/constants/theme';

const backgroundImage = require('@/assets/images/third-bg.png');
const heartIcon = require('@/assets/images/heart.svg');
const monnIcon = require('@/assets/images/monn.svg');
const sunIcon = require('@/assets/images/sun.svg');
const linesIcon = require('@/assets/images/lines.svg');

const planItems = [
  {
    title: 'Morning sunlight',
    detailLines: ['10 min'],
    icon: sunIcon,
    cardHeight: 74,
    titleWidth: 117,
    subtitleWidth: 117,
    textGroupHeight: 46,
    contentHeight: 56,
    contentPadding: 10,
    innerHeight: 46,
    iconWidth: 19.997783660888672,
    iconHeight: 19.998891830444336,
    iconTop: 2,
    iconLeft: 2,
    rotate: '180deg',
  },
  {
    title: 'Box breathing',
    detailLines: ['4 min'],
    icon: linesIcon,
    cardHeight: 74,
    titleWidth: 117,
    subtitleWidth: 117,
    textGroupHeight: 46,
    contentHeight: 66,
    contentPadding: 10,
    innerHeight: 46,
    iconWidth: 20.000288009643555,
    iconHeight: 15.777030944824219,
    iconTop: 4.11,
    iconLeft: 2,
    rotate: '0deg',
  },
  {
    title: 'Wind Down',
    detailLines: ['30 min', 'Screen time'],
    icon: monnIcon,
    cardHeight: 86,
    titleWidth: 117,
    subtitleWidth: 117,
    textGroupHeight: 68,
    contentHeight: 66,
    contentPadding: 10,
    innerHeight: 46,
    iconWidth: 20,
    iconHeight: 20,
    iconTop: 2,
    iconLeft: 2,
    rotate: '0deg',
  },
] as const;

export default function PlanScreen() {
  const router = useRouter();

  return (
    <View style={styles.screen}>
      <Image source={backgroundImage} style={styles.backgroundImage} contentFit="cover" />

      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          bounces={false}>
          <View style={styles.header}>
            <Text style={styles.title}>Your first calm plan{'\n'}is ready.</Text>
            <Text style={styles.subtitle}>Small actions to help lower stress</Text>
          </View>

          <View style={styles.planList}>
            {planItems.map((item) => (
              <View key={item.title} style={[styles.planCard, { height: item.cardHeight }]}>
                <View
                  style={[
                    styles.planContent,
                    { height: item.contentHeight, padding: item.contentPadding },
                  ]}>
                  <View style={[styles.planInner, { height: item.innerHeight }]}>
                    <View style={styles.planIconFrame}>
                      <Image
                        source={item.icon}
                        style={[
                          styles.planSvgIcon,
                          {
                            top: item.iconTop,
                            left: item.iconLeft,
                            width: item.iconWidth,
                            height: item.iconHeight,
                            transform: [{ rotate: item.rotate }],
                          },
                        ]}
                        contentFit="contain"
                      />
                    </View>
                    <View style={[styles.planTextGroup, { height: item.textGroupHeight }]}>
                      <Text style={[styles.planTitle, { width: item.titleWidth }]}>
                        {item.title}
                      </Text>
                      {item.detailLines.map((line, index) => (
                        <Text
                          key={line}
                          style={[
                            styles.planSubtitle,
                            { width: item.subtitleWidth },
                            index === item.detailLines.length - 1 &&
                              item.detailLines.length > 1 &&
                              styles.planSubtitleLast,
                          ]}>
                          {line}
                        </Text>
                      ))}
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </View>

          <View style={styles.noteCard}>
            <View style={styles.noteInner}>
              <View style={styles.noteIconFrame}>
                <Image source={heartIcon} style={styles.noteIcon} contentFit="contain" />
              </View>
              <Text style={styles.noteText}>
                Heaven adapts support into your real life,{'\n'}not a perfect routine.
              </Text>
            </View>
          </View>

          <View style={styles.actions}>
            <View style={styles.actionsInner}>
              <Pressable onPress={() => router.push('/screen4')}>
                <LinearGradient
                  colors={['#6339FB', '#3770FC', '#6AAFE9']}
                  locations={[0.0247, 0.5499, 1]}
                  start={{ x: 0.02, y: 0.5 }}
                  end={{ x: 1.06, y: 0.5 }}
                  style={styles.continueButton}>
                  <Text style={styles.continueText}>Continue</Text>
                </LinearGradient>
              </Pressable>
              <Pressable style={styles.backButton}>
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
    paddingBottom: 28,
  },
  header: {
    width: 315,
    marginTop: 58,
    alignItems: 'center',
    gap: 8,
    opacity: 1,
  },
  title: {
    width: 315,
    color: '#173F5F',
    fontFamily: AppFonts.displaySemiBold,
    fontSize: 30,
    lineHeight: 38,
    letterSpacing: 0,
    textAlign: 'center',
    opacity: 1,
  },
  subtitle: {
    width: 315,
    color: '#173F5F',
    fontFamily: AppFonts.sansMedium,
    fontSize: 16,
    lineHeight: 26,
    letterSpacing: 0,
    textAlign: 'center',
    opacity: 1,
  },
  planList: {
    width: 345,
    gap: 8,
    marginTop: 54,
    opacity: 1,
  },
  planCard: {
    width: 345,
    height: 74,
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
    width: 313,
    height: 56,
    gap: 10,
    padding: 10,
    opacity: 1,
  },
  planInner: {
    width: 293,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    opacity: 1,
  },
  planIconFrame: {
    width: 24,
    height: 24,
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
    position: 'absolute',
    opacity: 1,
  },
  planTextGroup: {
    width: 117,
    height: 46,
    opacity: 1,
  },
  planTitle: {
    height: 24,
    color: '#000000',
    fontFamily: AppFonts.sansSemiBold,
    fontSize: 14,
    lineHeight: 24,
    letterSpacing: 0,
    opacity: 1,
  },
  planSubtitle: {
    height: 22,
    color: '#8C8C8C',
    fontFamily: AppFonts.sansSemiBold,
    fontSize: 12,
    lineHeight: 22,
    letterSpacing: 0,
    opacity: 1,
  },
  planSubtitleLast: {
    transform: [{ translateY: -4 }],
  },
  noteCard: {
    width: 339,
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
    width: 345,
    height: 102,
    marginTop: 44,
    opacity: 1,
  },
  actionsInner: {
    width: 345,
    height: 102,
    alignItems: 'center',
    gap: 16,
    opacity: 1,
  },
  continueButton: {
    width: 345,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderRadius: 50,
    paddingTop: 16,
    paddingRight: 24,
    paddingBottom: 16,
    paddingLeft: 24,
    gap: 10,
    opacity: 1,
    boxShadow: 'inset 4px 4px 16px 0px #FFFFFF80',
  },
  continueText: {
    color: '#FFFFFF',
    fontFamily: AppFonts.sansBold,
    fontSize: 18,
    lineHeight: 26,
    letterSpacing: 0,
    textAlign: 'center',
  },
  backButton: {
    width: 345,
    height: 26,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 1,
  },
  backText: {
    width: 345,
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
