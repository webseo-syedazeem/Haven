import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';

const profileImage = require('@/assets/images/icon.png');

const planItems = [
  {
    color: '#F8C15D',
    icon: 'sunny-outline',
    time: '7 min',
    title: 'Morning Sunlight',
  },
  {
    color: '#57D079',
    icon: 'bed-outline',
    time: '10 min',
    title: 'Morning Sunlight',
  },
  {
    color: '#5A94F7',
    icon: 'bicycle-outline',
    time: '18 min',
    title: 'Morning Sunlight',
  },
] as const;

export default function HomeScreen() {
  return (
    <LinearGradient colors={['#F0ECFF', '#FFEDE6', '#F7F2FF']} style={styles.background}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        style={styles.scroll}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.greeting}>Good morning, Joi</Text>
            <Text style={styles.subtitle}>Small stress today, stranger you tomorrow</Text>
          </View>
          <View style={styles.avatarWrap}>
            <Image source={profileImage} style={styles.avatar} />
          </View>
        </View>

        <View style={styles.easeCard}>
          <View style={styles.easeCopy}>
            <Text style={styles.easeKicker}>Daily Ease</Text>
            <Text style={styles.easeText}>
              You are Building Clam, and consistency, keep Going!
            </Text>
          </View>
          <View style={styles.scoreWrap}>
            <Text style={styles.score}>74</Text>
            <Text style={styles.scoreLabel}>Supported</Text>
          </View>
        </View>

        <View style={styles.nextStepCard}>
          <View style={styles.stepIconWrap}>
            <Ionicons color="#7C63E6" name="leaf-outline" size={24} />
          </View>
          <View style={styles.nextStepText}>
            <Text style={styles.nextStepTitle}>Your next best step</Text>
            <Text style={styles.nextStepBody}>Box breathing</Text>
            <Text style={styles.nextStepBody}>5 min. Reduce stress</Text>
          </View>
          <View style={styles.startButton}>
            <Text style={styles.startButtonText}>Start Now</Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{"Today's Plan"}</Text>
          <Text style={styles.viewAll}>View All</Text>
        </View>

        <View style={styles.planCard}>
          {planItems.map((item, index) => (
            <View key={`${item.title}-${item.color}`} style={styles.planRow}>
              <View style={[styles.planIcon, { borderColor: item.color }]}>
                <Ionicons color={item.color} name={item.icon} size={20} />
              </View>
              <View style={styles.planCopy}>
                <Text style={styles.planTitle}>{item.title}</Text>
                <Text style={styles.planText}>Reset mood and regulate your body clock</Text>
              </View>
              <Text style={styles.planTime}>{item.time}</Text>
              <Ionicons
                color={index === 0 ? '#7C63E6' : '#D4D1DE'}
                name={index === 0 ? 'checkmark-circle' : 'ellipse-outline'}
                size={18}
              />
            </View>
          ))}
        </View>

        <View style={styles.windCard}>
          <View style={styles.windHeader}>
            <View style={styles.heartIcon}>
              <Ionicons color="#FF477E" name="heart-outline" size={20} />
            </View>
            <Text style={styles.windTitle}>Stress today?</Text>
          </View>
          <LinearGradient colors={['#A166E6', '#F2789B']} style={styles.windMeter}>
            <View style={styles.windTrack} />
          </LinearGradient>
        </View>

        <View style={styles.resetCard}>
          <View style={styles.resetIcon}>
            <Ionicons color="#7C63E6" name="time-outline" size={20} />
          </View>
          <View style={styles.resetCopy}>
            <Text style={styles.resetTitle}>2 minute Reset.</Text>
            <Text style={styles.resetText}>A quick reset for busy moments</Text>
          </View>
          <View style={styles.smallStart}>
            <Text style={styles.smallStartText}>Start</Text>
            <Ionicons color="#7C63E6" name="play" size={13} />
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  avatar: {
    borderRadius: 18,
    height: 34,
    width: 34,
  },
  avatarWrap: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    elevation: 4,
    padding: 3,
    shadowColor: '#A99AE3',
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  background: {
    flex: 1,
  },
  content: {
    paddingBottom: 110,
    paddingHorizontal: 14,
    paddingTop: 54,
  },
  easeCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.74)',
    borderRadius: 8,
    elevation: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 152,
    overflow: 'hidden',
    padding: 17,
    shadowColor: '#CABEF0',
    shadowOpacity: 0.28,
    shadowRadius: 18,
  },
  easeCopy: {
    flex: 1,
    justifyContent: 'center',
    paddingRight: 16,
  },
  easeKicker: {
    color: '#173F5F',
    fontFamily: 'SF Pro',
    fontSize: 11,
    fontWeight: '800',
    lineHeight: 16,
    marginBottom: 27,
    textAlign: 'right',
  },
  easeText: {
    color: '#60677E',
    fontFamily: 'SF Pro',
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 20,
  },
  greeting: {
    color: '#173F5F',
    fontFamily: 'PlayfairDisplay-SemiBold',
    fontSize: 30,
    fontWeight: '600',
    letterSpacing: 0,
    lineHeight: 38,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 22,
  },
  headerText: {
    flex: 1,
    paddingRight: 12,
  },
  heartIcon: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#FFD5E1',
    borderRadius: 17,
    borderWidth: 1,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  nextStepBody: {
    color: '#7B8092',
    fontFamily: 'SF Pro',
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 17,
  },
  nextStepCard: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    elevation: 3,
    flexDirection: 'row',
    marginTop: 14,
    paddingHorizontal: 14,
    paddingVertical: 13,
    shadowColor: '#CEC4F2',
    shadowOpacity: 0.25,
    shadowRadius: 14,
  },
  nextStepText: {
    flex: 1,
    marginLeft: 11,
  },
  nextStepTitle: {
    color: '#173F5F',
    fontFamily: 'SF Pro',
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 18,
    marginBottom: 3,
  },
  planCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    gap: 12,
    padding: 13,
  },
  planCopy: {
    flex: 1,
    marginLeft: 11,
  },
  planIcon: {
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  planRow: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  planText: {
    color: '#848899',
    fontFamily: 'SF Pro',
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 15,
  },
  planTime: {
    color: '#A1A4B3',
    fontFamily: 'SF Pro',
    fontSize: 10,
    fontWeight: '600',
    marginRight: 7,
  },
  planTitle: {
    color: '#173F5F',
    fontFamily: 'SF Pro',
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 17,
  },
  resetCard: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    flexDirection: 'row',
    marginTop: 10,
    padding: 13,
  },
  resetCopy: {
    flex: 1,
    marginLeft: 11,
  },
  resetIcon: {
    alignItems: 'center',
    backgroundColor: '#F5F2FF',
    borderRadius: 16,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  resetText: {
    color: '#85899A',
    fontFamily: 'SF Pro',
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 17,
  },
  resetTitle: {
    color: '#173F5F',
    fontFamily: 'SF Pro',
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 18,
  },
  score: {
    color: '#173F5F',
    fontFamily: 'PlayfairDisplay-SemiBold',
    fontSize: 34,
    fontWeight: '600',
    lineHeight: 42,
  },
  scoreLabel: {
    color: '#7C63E6',
    fontFamily: 'SF Pro',
    fontSize: 11,
    fontWeight: '800',
    lineHeight: 14,
  },
  scoreWrap: {
    alignItems: 'center',
    alignSelf: 'center',
    borderColor: '#8B6BEE',
    borderRadius: 58,
    borderTopWidth: 9,
    borderRightWidth: 9,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    height: 112,
    justifyContent: 'center',
    width: 112,
  },
  scroll: {
    flex: 1,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    marginTop: 17,
  },
  sectionTitle: {
    color: '#173F5F',
    fontFamily: 'PlayfairDisplay-SemiBold',
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 21,
  },
  smallStart: {
    alignItems: 'center',
    borderColor: '#EBE7FA',
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    height: 38,
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  smallStartText: {
    color: '#7C63E6',
    fontFamily: 'SF Pro',
    fontSize: 12,
    fontWeight: '800',
  },
  startButton: {
    alignItems: 'center',
    backgroundColor: '#8069E9',
    borderRadius: 24,
    height: 48,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontFamily: 'SF Pro',
    fontSize: 12,
    fontWeight: '800',
  },
  stepIconWrap: {
    alignItems: 'center',
    backgroundColor: '#F5F2FF',
    borderColor: '#DCD4FA',
    borderRadius: 18,
    borderWidth: 1,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  subtitle: {
    color: '#173F5F',
    fontFamily: 'SF Pro',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 22,
  },
  viewAll: {
    color: '#7C63E6',
    fontFamily: 'SF Pro',
    fontSize: 12,
    fontWeight: '800',
  },
  windCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginTop: 12,
    overflow: 'hidden',
    padding: 13,
  },
  windHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 11,
  },
  windMeter: {
    borderRadius: 16,
    height: 34,
    marginLeft: 46,
    marginTop: -4,
    overflow: 'hidden',
  },
  windTitle: {
    color: '#173F5F',
    flex: 1,
    fontFamily: 'SF Pro',
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 18,
  },
  windTrack: {
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
    borderRadius: 14,
    height: 26,
    marginHorizontal: 9,
    marginTop: 4,
  },
});
