import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppFonts } from '@/constants/theme';

const backgroundImage = require('@/assets/images/screen 2.png');
const heartIcon = require('@/assets/images/mdi_heart.svg');
const moonIcon = require('@/assets/images/moon.svg');
const focusIcon = require('@/assets/images/round-focus.svg');
const leafIcon = require('@/assets/images/leaf.svg');
const roundIcon = require('@/assets/images/round.svg');
const roundBorderIcon = require('@/assets/images/round-border.svg');
const roundFillIcon = require('@/assets/images/round-fill.svg');
const starsNoteIcon = require('@/assets/images/gm-stars.svg');

const times = ['3 min', '5 min', '10 min', '15 min'];
const supportOptions = [
  { label: 'Breathwork', icon: heartIcon, iconWidth: 20, iconHeight: 18.35, iconTop: 3, iconLeft: 2 },
  { label: 'Soundscapes', icon: moonIcon, iconWidth: 20, iconHeight: 18.35, iconTop: 3, iconLeft: 2 },
  { label: 'Movements', icon: focusIcon, iconWidth: 20, iconHeight: 20, iconTop: 2, iconLeft: 2 },
  { label: 'Check-ins', icon: leafIcon, iconWidth: 17.172945022583008, iconHeight: 19.00011444091797, iconTop: 3, iconLeft: 2.9 },
  { label: 'Reflection', icon: roundIcon, iconWidth: 24, iconHeight: 20.756000518798828, iconTop: 1.62, iconLeft: 0 },
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
            <Text style={styles.subtitle}>Choose what fits best</Text>
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
            <Text style={styles.supportSubtitle}>Pick what helps most</Text>
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
                    <Text style={styles.optionText}>{option.label}</Text>
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
    alignItems: 'center',
    paddingBottom: 28,
  },
  header: {
    width: 330,
    marginTop: 38,
    alignItems: 'center',
    gap: 8,
    opacity: 1,
  },
  title: {
    width: 330,
    color: '#173F5F',
    fontFamily: AppFonts.displaySemiBold,
    fontSize: 29,
    lineHeight: 36,
    letterSpacing: 0,
    textAlign: 'center',
    opacity: 1,
  },
  subtitle: {
    width: 330,
    color: '#173F5F',
    fontFamily: AppFonts.sansMedium,
    fontSize: 16,
    lineHeight: 26,
    letterSpacing: 0,
    textAlign: 'center',
    opacity: 1,
  },
  timeButtons: {
    width: 343,
    height: 40,
    marginTop: 26,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    opacity: 1,
  },
  timeButton: {
    width: 72,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    paddingTop: 8,
    paddingBottom: 8,
    opacity: 1,
  },
  timeButtonInactive: {
    backgroundColor: '#FFFFFF',
  },
  timeText: {
    color: '#173F5F',
    fontFamily: AppFonts.sansSemiBold,
    fontSize: 14,
    lineHeight: 24,
    letterSpacing: 0,
    textAlign: 'center',
    opacity: 1,
  },
  timeTextActive: {
    color: '#FFFFFF',
  },
  supportHeader: {
    width: 330,
    alignItems: 'center',
    gap: 8,
    marginTop: 32,
    opacity: 1,
  },
  supportTitle: {
    width: 330,
    color: '#173F5F',
    fontFamily: AppFonts.sansBold,
    fontSize: 18,
    lineHeight: 30,
    letterSpacing: 0,
    textAlign: 'center',
    opacity: 1,
  },
  supportSubtitle: {
    width: 330,
    color: '#173F5F',
    fontFamily: AppFonts.sansMedium,
    fontSize: 16,
    lineHeight: 26,
    letterSpacing: 0,
    textAlign: 'center',
    opacity: 1,
  },
  optionList: {
    width: 345,
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
    paddingHorizontal: 24,
    gap: 16,
    opacity: 1,
    boxShadow: 'inset 4px 4px 16px 0px #FFFFFF80',
  },
  optionIconFrame: {
    width: 24,
    height: 24,
    position: 'relative',
    opacity: 1,
  },
  optionIcon: {
    position: 'relative',
    opacity: 1,
  },
  optionText: {
    flex: 1,
    color: '#000000',
    fontFamily: AppFonts.sansSemiBold,
    fontSize: 14,
    lineHeight: 24,
    letterSpacing: 0,
    opacity: 1,
  },
  checkIconFrame: {
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
    marginTop: 28,
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
