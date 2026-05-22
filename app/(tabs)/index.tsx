import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import {
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, {
  Circle,
  Defs,
  LinearGradient as SvgLinearGradient,
  Stop,
} from 'react-native-svg';

const dailyEaseProgress = 74;
const progressSize = 112;
const progressStroke = 8;
const progressRadius = (progressSize - progressStroke) / 2;
const progressCircumference = 2 * Math.PI * progressRadius;
const progressPercent = dailyEaseProgress / 100;
const progressOffset = progressCircumference * (1 - progressPercent);
const progressAngle = progressPercent * 360 - 90;
const progressDotRadius = 8;
const progressDotCenter = progressSize / 2;
const progressDotDistance = progressRadius;
const progressDotX =
  progressDotCenter + progressDotDistance * Math.cos((progressAngle * Math.PI) / 180);
const progressDotY =
  progressDotCenter + progressDotDistance * Math.sin((progressAngle * Math.PI) / 180);

const backgroundImage = require('@/assets/images/first-page-background-image.png');
const avatarImage = require('@/assets/images/Ellipse 15.png');

const todayPlans = [
  {
    icon: 'sunny-outline' as const,
    iconColor: '#FFC43D',
    title: 'Morning Sunlight',
    meta: '10 min',
    checked: true,
  },
  {
    icon: 'leaf-outline' as const,
    iconColor: '#34C759',
    title: 'Breathing Practice',
    meta: '5 min',
    checked: false,
  },
  {
    icon: 'gift-outline' as const,
    iconColor: '#5E7BFF',
    title: 'Evening Reflection',
    meta: '3 min',
    checked: false,
  },
];

export default function HomeScreen() {
  return (
    <ImageBackground
      source={backgroundImage}
      resizeMode="cover"
      imageStyle={styles.backgroundImage}
      style={styles.screen}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ScrollView
          bounces={false}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <View>
              <Text style={styles.greeting}>Good morning, Joi</Text>
              <Text style={styles.subtitle}>Small stress today, stronger you{'\n'}tomorrow</Text>
            </View>

            <View style={styles.avatarRing}>
              <Image source={avatarImage} style={styles.avatar} contentFit="cover" />
            </View>
          </View>

          <View style={styles.easeCard}>
            <View style={styles.easeCopy}>
              <Text style={styles.easeTitle}>
                You are building calm,{'\n'}and consistency. Keep{'\n'}going!
              </Text>
            </View>

            <View style={styles.easeMeter}>
              <Text style={styles.easeLabel}>Daily Ease</Text>
              <View style={styles.progressWrap}>
                <Svg width={progressSize} height={progressSize} viewBox={`0 0 ${progressSize} ${progressSize}`}>
                  <Defs>
                    <SvgLinearGradient id="dailyEaseGradient" x1="0" y1="0" x2="1" y2="1">
                      <Stop offset="0" stopColor="#70D48A" />
                      <Stop offset="0.42" stopColor="#F9F4F0" />
                      <Stop offset="1" stopColor="#7863DC" />
                    </SvgLinearGradient>
                  </Defs>
                  <Circle
                    cx={progressDotCenter}
                    cy={progressDotCenter}
                    r={progressRadius}
                    stroke="#FFFFFF"
                    strokeWidth={progressStroke}
                    fill="transparent"
                  />
                  <Circle
                    cx={progressDotCenter}
                    cy={progressDotCenter}
                    r={progressRadius}
                    stroke="url(#dailyEaseGradient)"
                    strokeWidth={progressStroke}
                    fill="transparent"
                    strokeDasharray={`${progressCircumference} ${progressCircumference}`}
                    strokeDashoffset={progressOffset}
                    strokeLinecap="round"
                    rotation="-90"
                    origin={`${progressDotCenter}, ${progressDotCenter}`}
                  />
                </Svg>
                <View
                  style={[
                    styles.progressDot,
                    {
                      left: progressDotX - progressDotRadius,
                      top: progressDotY - progressDotRadius,
                    },
                  ]}
                />
              </View>
              <View style={styles.progressCenter}>
                <Text style={styles.progressValue}>{dailyEaseProgress}</Text>
                <Text style={styles.progressCaption}>Supported</Text>
              </View>
            </View>
          </View>

          <View style={styles.nextCard}>
            <View style={styles.nextIconWrap}>
              <Ionicons name="flower-outline" size={25} color="#7863DC" />
            </View>
            <View style={styles.nextCopy}>
              <Text style={styles.nextTitle}>Your next best step</Text>
              <Text style={styles.nextSubtitle}>Box breathing{'\n'}5 min. Reduce stress</Text>
            </View>
            <LinearGradient
              colors={['#B087E5', '#7863DC']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.startButton}>
              <Text style={styles.startText}>Start Now</Text>
            </LinearGradient>
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Today&apos;s Plan</Text>
            <Text style={styles.viewAll}>View All</Text>
          </View>

          <View style={styles.planCard}>
            {todayPlans.map((plan, index) => (
              <View
                key={`${plan.title}-${plan.icon}`}
                style={[styles.planRow, index < todayPlans.length - 1 && styles.planDivider]}>
                <View style={[styles.planIconWrap, { borderColor: `${plan.iconColor}33` }]}>
                  <Ionicons name={plan.icon} size={18} color={plan.iconColor} />
                </View>
                <View style={styles.planCopy}>
                  <Text style={styles.planTitle}>{plan.title}</Text>
                  <Text style={styles.planSubtitle}>Boost mood and regulate your body check</Text>
                </View>
                <Text style={styles.planMeta}>{plan.meta}</Text>
                <View style={[styles.checkCircle, plan.checked && styles.checkCircleActive]}>
                  {plan.checked ? <Ionicons name="checkmark" size={10} color="#FFFFFF" /> : null}
                </View>
              </View>
            ))}
          </View>

          <View style={styles.stressCard}>
            <View style={styles.stressHeader}>
              <View style={styles.heartIcon}>
                <Ionicons name="heart-outline" size={19} color="#FF2F7D" />
              </View>
              <Text style={styles.stressTitle}>Stress today?</Text>
            </View>
            <View style={styles.stressMeterTrack}>
              <LinearGradient
                colors={['#C06CE6', '#EE6B9A']}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={styles.stressMeterFill}
              />
            </View>
          </View>

          <View style={styles.resetCard}>
            <View style={styles.clockIcon}>
              <Ionicons name="time-outline" size={20} color="#7863DC" />
            </View>
            <View style={styles.resetCopy}>
              <Text style={styles.resetTitle}>2 minute Reset</Text>
              <Text style={styles.resetSubtitle}>A quick reset for busy{'\n'}moments</Text>
            </View>
            <View style={styles.resetButton}>
              <Text style={styles.resetButtonText}>Start</Text>
              <Ionicons name="play" size={13} color="#7863DC" />
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F4EAF8',
  },
  backgroundImage: {
    opacity: 0.86,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 12,
    paddingTop: 24,
    paddingBottom: 112,
  },
  header: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  greeting: {
    color: '#173F5F',
    fontFamily: 'PlayfairDisplay-SemiBold',
    fontSize: 30,
    fontWeight: '600',
    lineHeight: 37,
  },
  subtitle: {
    color: '#173F5F',
    fontFamily: 'SF Pro',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
    marginTop: 4,
  },
  avatarRing: {
    alignItems: 'center',
    backgroundColor: '#F0E1CF',
    borderColor: '#FFFFFF',
    borderRadius: 19,
    borderWidth: 2,
    height: 38,
    justifyContent: 'center',
    marginTop: 5,
    width: 38,
  },
  avatar: {
    borderRadius: 16,
    height: 32,
    width: 32,
  },
  easeCard: {
    backgroundColor: 'rgba(255,255,255,0.76)',
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 185,
    overflow: 'hidden',
    paddingBottom: 18,
    paddingHorizontal: 18,
    paddingTop: 20,
    width: '100%',
  },
  easeCopy: {
    justifyContent: 'center',
    maxWidth: 150,
  },
  easeTitle: {
    color: '#173F5F',
    fontFamily: 'SF Pro',
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 20,
  },
  easeMeter: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 120,
  },
  easeLabel: {
    color: '#111827',
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 6,
  },
  progressWrap: {
    height: progressSize,
    position: 'relative',
    width: progressSize,
  },
  progressCenter: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    top: 48,
  },
  progressValue: {
    color: '#173F5F',
    fontSize: 42,
    fontWeight: '400',
    lineHeight: 46,
  },
  progressCaption: {
    color: '#7863DC',
    fontSize: 10,
    fontWeight: '700',
  },
  progressDot: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
    borderRadius: progressDotRadius,
    borderWidth: 2,
    elevation: 4,
    height: progressDotRadius * 2,
    position: 'absolute',
    shadowColor: '#173F5F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    width: progressDotRadius * 2,
  },
  nextCard: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderRadius: 12,
    flexDirection: 'row',
    marginTop: 13,
    minHeight: 78,
    paddingHorizontal: 14,
  },
  nextIconWrap: {
    alignItems: 'center',
    backgroundColor: '#F0EBFF',
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    marginRight: 12,
    width: 40,
  },
  nextCopy: {
    flex: 1,
  },
  nextTitle: {
    color: '#173F5F',
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 17,
  },
  nextSubtitle: {
    color: '#7C8592',
    fontSize: 10,
    lineHeight: 14,
    marginTop: 2,
  },
  startButton: {
    alignItems: 'center',
    borderRadius: 24,
    height: 48,
    justifyContent: 'center',
    width: 96,
  },
  startText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    marginTop: 12,
  },
  sectionTitle: {
    color: '#173F5F',
    fontFamily: 'PlayfairDisplay-SemiBold',
    fontSize: 14,
    lineHeight: 18,
  },
  viewAll: {
    color: '#7863DC',
    fontSize: 11,
    fontWeight: '700',
  },
  planCard: {
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderRadius: 12,
    overflow: 'hidden',
    paddingHorizontal: 10,
  },
  planRow: {
    alignItems: 'center',
    flexDirection: 'row',
    minHeight: 58,
  },
  planDivider: {
    borderBottomColor: 'rgba(23,63,95,0.08)',
    borderBottomWidth: 1,
  },
  planIconWrap: {
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    height: 32,
    justifyContent: 'center',
    marginRight: 12,
    width: 32,
  },
  planCopy: {
    flex: 1,
  },
  planTitle: {
    color: '#173F5F',
    fontSize: 11,
    fontWeight: '800',
    lineHeight: 15,
  },
  planSubtitle: {
    color: '#7C8592',
    fontSize: 9,
    lineHeight: 13,
  },
  planMeta: {
    color: '#8A93A1',
    fontSize: 9,
    marginRight: 8,
  },
  checkCircle: {
    alignItems: 'center',
    borderColor: '#CED5E2',
    borderRadius: 9,
    borderWidth: 1,
    height: 18,
    justifyContent: 'center',
    width: 18,
  },
  checkCircleActive: {
    backgroundColor: '#7863DC',
    borderColor: '#7863DC',
  },
  stressCard: {
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderRadius: 12,
    marginTop: 13,
    padding: 14,
  },
  stressHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 10,
  },
  heartIcon: {
    alignItems: 'center',
    backgroundColor: '#FFF1F6',
    borderRadius: 18,
    height: 36,
    justifyContent: 'center',
    marginRight: 10,
    width: 36,
  },
  stressTitle: {
    color: '#173F5F',
    fontSize: 13,
    fontWeight: '700',
  },
  stressMeterTrack: {
    alignSelf: 'flex-end',
    backgroundColor: '#F2E7FB',
    borderRadius: 16,
    height: 24,
    overflow: 'hidden',
    width: 122,
  },
  stressMeterFill: {
    borderRadius: 16,
    height: '100%',
    width: '80%',
  },
  resetCard: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 12,
    flexDirection: 'row',
    marginTop: 13,
    minHeight: 72,
    paddingHorizontal: 14,
  },
  clockIcon: {
    alignItems: 'center',
    backgroundColor: '#F0EBFF',
    borderRadius: 18,
    height: 36,
    justifyContent: 'center',
    marginRight: 12,
    width: 36,
  },
  resetCopy: {
    flex: 1,
  },
  resetTitle: {
    color: '#173F5F',
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 16,
  },
  resetSubtitle: {
    color: '#7C8592',
    fontSize: 10,
    lineHeight: 14,
    marginTop: 2,
  },
  resetButton: {
    alignItems: 'center',
    borderColor: '#E7E0FC',
    borderRadius: 22,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    height: 40,
    justifyContent: 'center',
    width: 83,
  },
  resetButtonText: {
    color: '#7863DC',
    fontSize: 11,
    fontWeight: '700',
  },
});
