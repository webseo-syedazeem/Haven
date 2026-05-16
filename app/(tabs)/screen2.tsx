import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, TextStyle, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const backgroundImage = require('@/assets/images/screen 2.png');
const heartIcon = require('@/assets/images/mdi_heart.svg');
const moonIcon = require('@/assets/images/moon.svg');
const focusIcon = require('@/assets/images/round-focus.svg');
const leafIcon = require('@/assets/images/leaf.svg');
const roundIcon = require('@/assets/images/round.svg');
const roundBorderIcon = require('@/assets/images/round-border.svg');
const roundFillIcon = require('@/assets/images/round-fill.svg');
const starsNoteIcon = require('@/assets/images/gm-stars.svg');

const sfProFont = Platform.select({
  web: "'SF Pro Text', 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  ios: 'SF Pro Text',
  default: 'sans-serif',
});
const playfairFont = Platform.select({
  web: "'Playfair Display', Georgia, serif",
  default: 'serif',
});

const times = ['3 min', '5 min', '10 min', '15 min'];
const supportOptions = [
  { label: 'Breathwork', icon: heartIcon, textWidth: 80, iconWidth: 20, iconHeight: 18.35, iconTop: 3, iconLeft: 2 },
  { label: 'Soundscapes', icon: moonIcon, textWidth: 93, iconWidth: 20, iconHeight: 18.35, iconTop: 3, iconLeft: 2 },
  { label: 'Movements', icon: focusIcon, textWidth: 80, iconWidth: 20, iconHeight: 20, iconTop: 2, iconLeft: 2 },
  { label: 'Check-ins', icon: leafIcon, textWidth: 70, iconWidth: 17.172945022583008, iconHeight: 19.00011444091797, iconTop: 3, iconLeft: 2.9 },
  { label: 'Reflection', icon: roundIcon, textWidth: 70, iconWidth: 24, iconHeight: 20.756000518798828, iconTop: 1.62, iconLeft: 0 },
] as const;

export default function TimeScreen() {
  const router = useRouter();
  const [selectedTime, setSelectedTime] = useState('3 min');
  const [selectedSupport, setSelectedSupport] = useState<string[]>([
    'Breathwork',
    'Soundscapes',
    'Movements',
  ]);

  return (
    <View style={styles.screen}>
      <Image source={backgroundImage} style={styles.backgroundImage} contentFit="cover" />

      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          bounces={false}>
          <View style={styles.header}>
            <Text style={styles.title}>How much time feels realistic for you?</Text>
            <Text style={styles.subtitle}>Choose what fit best</Text>
          </View>

          <View style={styles.timeButtons}>
            {times.map((time) => {
              const isActive = selectedTime === time;

              return (
                <Pressable key={time} onPress={() => setSelectedTime(time)}>
                  {isActive ? (
                    <LinearGradient
                      colors={['#9B87FF', '#6339FB']}
                      start={{ x: 0.5, y: 0 }}
                      end={{ x: 0.5, y: 1 }}
                      style={styles.timeButton}>
                      <Text style={[styles.timeText, styles.timeTextActive]}>{time}</Text>
                    </LinearGradient>
                  ) : (
                    <View style={[styles.timeButton, styles.timeButtonInactive]}>
                      <Text style={styles.timeText}>{time}</Text>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>

          <View style={styles.supportHeader}>
            <Text style={styles.supportTitle}>What support do you prefer?</Text>
            <Text style={styles.supportSubtitle}>Pik What help most</Text>
          </View>

          <View style={styles.optionList}>
            {supportOptions.map((option) => {
              const isSelected = selectedSupport.includes(option.label);

              return (
                <Pressable
                  key={option.label}
                  onPress={() =>
                    setSelectedSupport((current) =>
                      current.includes(option.label)
                        ? current.filter((item) => item !== option.label)
                        : [...current, option.label]
                    )
                  }>
                  <View style={styles.optionCard}>
                    <View style={styles.optionIconFrame}>
                      <Image
                        source={option.icon}
                        style={[
                          styles.optionIcon,
                          {
                            top: option.iconTop,
                            left: option.iconLeft,
                            width: option.iconWidth,
                            height: option.iconHeight,
                          },
                        ]}
                        contentFit="contain"
                      />
                    </View>
                    <Text style={[styles.optionText, { width: option.textWidth }]}>
                      {option.label}
                    </Text>
                    <View style={styles.checkIconFrame}>
                      <Image
                        source={isSelected ? roundFillIcon : roundBorderIcon}
                        style={styles.checkIcon}
                        contentFit="contain"
                      />
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.noteCard}>
            <View style={styles.noteIconFrame}>
              <Image source={starsNoteIcon} style={styles.noteIcon} contentFit="contain" />
            </View>
            <Text style={styles.noteText}>
              Heaven adapts support into your real life,{'\n'}not a perfect routine.
            </Text>
          </View>

          <View style={styles.actions}>
            <View style={styles.actionsInner}>
              <Pressable onPress={() => router.push('/screen3')}>
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
    backgroundColor: '#9ecdec',
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
    minHeight: 1000,
    alignItems: 'center',
    paddingBottom: 17,
  },
  header: {
    width: 279,
    height: 160,
    marginTop: 46,
    alignItems: 'center',
    gap: 8,
    opacity: 1,
  },
  title: {
    width: 279,
    height: 126,
    color: '#173F5F',
    fontFamily: playfairFont,
    fontSize: 32,
    fontWeight: '600',
    lineHeight: 42,
    letterSpacing: 0,
    textAlign: 'center',
    opacity: 1,
  },
  subtitle: {
    width: 279,
    height: 26,
    color: '#173F5F',
    fontFamily: sfProFont,
    fontSize: 16,
    fontWeight: '510' as TextStyle['fontWeight'],
    lineHeight: 26,
    letterSpacing: 0,
    textAlign: 'center',
    opacity: 1,
  },
  timeButtons: {
    width: 343,
    height: 40,
    marginTop: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    opacity: 1,
  },
  timeButton: {
    width: 70,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    paddingTop: 8,
    paddingRight: 16,
    paddingBottom: 8,
    paddingLeft: 16,
    gap: 10,
    opacity: 1,
  },
  timeButtonInactive: {
    backgroundColor: '#FFFFFF',
  },
  timeText: {
    width: 46,
    height: 24,
    color: '#173F5F',
    fontFamily: sfProFont,
    fontSize: 14,
    fontWeight: '590' as TextStyle['fontWeight'],
    lineHeight: 24,
    letterSpacing: 0,
    textAlign: 'center',
    opacity: 1,
  },
  timeTextActive: {
    color: '#FFFFFF',
  },
  supportHeader: {
    width: 279,
    height: 64,
    alignItems: 'center',
    gap: 8,
    marginTop: 32,
    opacity: 1,
  },
  supportTitle: {
    width: 279,
    height: 30,
    color: '#173F5F',
    fontFamily: sfProFont,
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 30,
    letterSpacing: 0,
    textAlign: 'center',
    opacity: 1,
  },
  supportSubtitle: {
    width: 279,
    height: 26,
    color: '#173F5F',
    fontFamily: sfProFont,
    fontSize: 16,
    fontWeight: '510' as TextStyle['fontWeight'],
    lineHeight: 26,
    letterSpacing: 0,
    textAlign: 'center',
    opacity: 1,
  },
  optionList: {
    width: 345,
    height: 332,
    gap: 8,
    marginTop: 24,
    opacity: 1,
  },
  optionCard: {
    width: 345,
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    position: 'relative',
    opacity: 1,
    boxShadow: 'inset 4px 4px 16px 0px #FFFFFF80',
  },
  optionIconFrame: {
    width: 24,
    height: 24,
    position: 'absolute',
    top: 18,
    left: 24,
    opacity: 1,
  },
  optionIcon: {
    position: 'relative',
    opacity: 1,
  },
  optionText: {
    position: 'absolute',
    top: 18,
    left: 64,
    width: 80,
    height: 24,
    color: '#000000',
    fontFamily: sfProFont,
    fontSize: 14,
    fontWeight: '590' as TextStyle['fontWeight'],
    lineHeight: 24,
    letterSpacing: 0,
    textAlign: 'center',
    opacity: 1,
  },
  checkIconFrame: {
    position: 'absolute',
    top: 18,
    left: 305,
    width: 24,
    height: 24,
    borderRadius: 12,
    gap: 10,
    paddingTop: 8,
    paddingRight: 6,
    paddingBottom: 8,
    paddingLeft: 6,
    opacity: 1,
  },
  checkIcon: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 24,
    height: 24,
    opacity: 1,
  },
  noteCard: {
    width: 339,
    height: 88,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: '#FFFFFFE5',
    borderWidth: 1,
    borderColor: '#FFFFFF80',
    marginTop: 35,
    paddingTop: 8,
    paddingRight: 24,
    paddingBottom: 8,
    paddingLeft: 24,
    gap: 10,
    opacity: 1,
    boxShadow: '0px 4px 16px 0px #00000014',
  },
  noteIconFrame: {
    width: 32,
    height: 32,
    position: 'relative',
    opacity: 1,
  },
  noteIcon: {
    position: 'absolute',
    top: 5.33,
    left: 5.33,
    width: 22.66666603088379,
    height: 21.33333396911621,
    opacity: 1,
  },
  noteText: {
    width: 247,
    height: 44,
    color: '#173F5F',
    fontFamily: sfProFont,
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 22,
    letterSpacing: 0,
  },
  actions: {
    width: 345,
    height: 102,
    marginTop: 71.21368408203125,
    gap: 340,
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
    fontFamily: sfProFont,
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 26,
    letterSpacing: 0,
    textAlign: 'center',
  },
  backButton: {
    width: 345,
    height: 26,
    justifyContent: 'center',
    paddingHorizontal: 24,
    opacity: 1,
  },
  backText: {
    width: 345,
    height: 26,
    color: '#FFFFFF',
    fontFamily: sfProFont,
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 26,
    letterSpacing: 0,
    textAlign: 'center',
    opacity: 1,
  },
});
