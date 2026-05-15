import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const quoteIcon = require('@/assets/images/simple.svg');
const starIcon = require('@/assets/images/Star 3.svg');
const verifiedIcon = require('@/assets/images/Vector.svg');
const avatarImage = require('@/assets/images/Ellipse 15.png');
const backgroundImage = require('@/assets/images/bg1.png');

export default function HomeScreen() {
  return (
    <View style={styles.screen}>
      <Image source={backgroundImage} style={styles.backgroundImage} contentFit="cover" />

      <SafeAreaView style={styles.content}>
        <View style={styles.testimonial}>
          <View style={styles.quoteIcons}>
            <Image source={quoteIcon} style={styles.quoteIcon} tintColor="#B13AB1" />
            <Image source={quoteIcon} style={styles.quoteIcon} tintColor="#B13AB1" />
          </View>
          <Text style={styles.quoteText}>
            I started with Five{'\n'}
            minutes a day{'\n'}
            within two weeks I{'\n'}
            felt steadier sleep{'\n'}
            better, and stop{'\n'}
            Crying work{'\n'}
            stress{'\n'}
            into the evening
          </Text>

          <View style={styles.profileWrap}>
            <Image source={avatarImage} style={styles.avatar} contentFit="cover" />
          </View>
          <Text style={styles.name}>Ayesha, 34</Text>
          <View style={styles.verifiedRow}>
            <Text style={styles.role}>Verified User</Text>
            <Image source={verifiedIcon} style={styles.verifiedIcon} tintColor="#3770FC" />
          </View>

          <View style={styles.stars}>
            {Array.from({ length: 5 }).map((_, index) => (
              <Image
                key={index}
                source={starIcon}
                style={styles.star}
                tintColor="#B13AB1"
              />
            ))}
          </View>
          <Text style={styles.rating}>4.8 avg rating</Text>
        </View>

        <View style={styles.actions}>
          <View style={styles.actionsInner}>
            <Pressable>
              <LinearGradient
                colors={['#6339FB', '#3770FC', '#6AAFE9']}
                locations={[0.0247, 0.5499, 1]}
                start={{ x: 0, y: 0.415 }}
                end={{ x: 1, y: 0.585 }}
                style={styles.continueButton}>
                <Text style={styles.continueText}>Continue</Text>
              </LinearGradient>
            </Pressable>
            <Pressable style={styles.backButton}>
              <Text style={styles.backText}>Back</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: '#7d82c8',
  },
  backgroundImage: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 30,
    paddingBottom: 17,
  },
  testimonial: {
    alignItems: 'center',
  },
  quoteIcon: {
    width: 32,
    height: 32,
  },
  quoteIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 0,
    marginBottom: 6,
  },
  quoteText: {
    width: 290,
    color: '#0B1D3B',
    fontFamily: 'Playfair Display',
    fontSize: 24,
    fontWeight: '600',
    lineHeight: 34,
    letterSpacing: 0,
    textAlign: 'center',
  },
  profileWrap: {
    width: 86,
    height: 86,
    marginTop: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 43,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    backgroundColor: '#FFFFFF',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  name: {
    marginTop: 5,
    width: 106,
    height: 24,
    color: '#173F5F',
    fontFamily: 'SF Pro',
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 24,
    letterSpacing: 0,
    textAlign: 'center',
    opacity: 1,
  },
  role: {
    color: '#2453A6',
    fontSize: 9,
    fontWeight: '700',
    lineHeight: 12,
    textAlign: 'center',
  },
  verifiedRow: {
    marginTop: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  verifiedIcon: {
    width: 16.5,
    height: 15.6975,
    opacity: 1,
  },
  stars: {
    width: 180,
    height: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    marginTop: 18,
  },
  star: {
    width: 32,
    height: 32,
  },
  rating: {
    marginTop: 6,
    color: '#0B1D3B',
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 16,
    textAlign: 'center',
  },
  actions: {
    position: 'absolute',
    top: 710,
    left: '50%',
    width: 345,
    height: 102,
    gap: 340,
    opacity: 1,
    transform: [{ translateX: -172.5 }],
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
    fontFamily: 'SF Pro',
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 26,
    letterSpacing: 0,
    textAlign: 'center',
  },
  backButton: {
    minHeight: 26,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  backText: {
    color: '#FFFFFF',
    fontFamily: 'SF Pro',
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 26,
    letterSpacing: 0,
    textAlign: 'center',
  },
});
