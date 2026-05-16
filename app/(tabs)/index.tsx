import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Platform, Pressable, ScrollView, StyleSheet, Text, TextStyle, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const quoteIcon = require('@/assets/images/simple.svg');
const starIcon = require('@/assets/images/Star 3.svg');
const verifiedIcon = require('@/assets/images/Vector.svg');
const avatarImage = require('@/assets/images/Ellipse 15.png');
const backgroundImage = require('@/assets/images/bg1.png');
const sfProFont = Platform.select({
  web: "'SF Pro Text', 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  ios: 'SF Pro Text',
  default: 'sans-serif',
});
const playfairFont = Platform.select({
  web: "'Playfair Display', Georgia, serif",
  default: 'serif',
});

export default function HomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.screen}>
      <Image source={backgroundImage} style={styles.backgroundImage} contentFit="cover" />

      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          bounces={false}>
          <View style={styles.testimonial}>
            <View style={styles.quoteContainer}>
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
            </View>

            <View style={styles.profileContainer}>
              <Image source={avatarImage} style={styles.avatar} contentFit="cover" />
              <View style={styles.profileTextContainer}>
                <Text style={styles.name}>Ayesha, 34</Text>
                <View style={styles.verifiedRow}>
                  <Text style={styles.role}>Verified User</Text>
                  <View style={styles.verifiedIconFrame}>
                    <Image source={verifiedIcon} style={styles.verifiedIcon} tintColor="#3770FC" />
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.ratingContainer}>
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
              <Text style={styles.rating}>4.8 avg Rating</Text>
            </View>
          </View>

          <View style={styles.actions}>
            <View style={styles.actionsInner}>
              <Pressable onPress={() => router.push('/screen2')}>
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
    backgroundColor: '#7d82c8',
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
    minHeight: 940,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 30,
    paddingBottom: 17,
  },
  testimonial: {
    alignItems: 'center',
  },
  quoteContainer: {
    width: 205,
    minHeight: 320.78631591796875,
    marginTop: 50,
    alignItems: 'center',
    gap: 24,
    opacity: 1,
  },
  quoteIcons: {
    width: 205,
    height: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 0,
    opacity: 1,
  },
  quoteIcon: {
    width: 24,
    height: 24,
    opacity: 1,
  },
  quoteText: {
    width: 205,
    minHeight: 272,
    color: '#173F5F',
    fontFamily: playfairFont,
    fontSize: 24,
    fontWeight: '600',
    lineHeight: 34,
    letterSpacing: 0,
    textAlign: 'center',
  },
  profileContainer: {
    width: 106,
    height: 138,
    marginTop: 16,
    alignItems: 'center',
    gap: 8,
    opacity: 1,
  },
  avatar: {
    width: 80,
    height: 80,
    backgroundColor: '#D9D9D9',
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    opacity: 1,
  },
  profileTextContainer: {
    width: 106,
    height: 50,
    alignItems: 'center',
    gap: 4,
    opacity: 1,
  },
  name: {
    width: 106,
    height: 24,
    color: '#173F5F',
    fontFamily: sfProFont,
    fontSize: 16,
    fontWeight: '590' as TextStyle['fontWeight'],
    lineHeight: 24,
    letterSpacing: 0,
    textAlign: 'center',
    opacity: 1,
  },
  role: {
    width: 79,
    height: 22,
    color: '#173F5F',
    fontFamily: sfProFont,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 22,
    letterSpacing: 0,
    textAlign: 'center',
    opacity: 1,
  },
  verifiedRow: {
    width: 112,
    height: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    opacity: 1,
  },
  verifiedIconFrame: {
    width: 18,
    height: 18,
    position: 'relative',
    opacity: 1,
  },
  verifiedIcon: {
    position: 'absolute',
    top: 1.16,
    left: 0.75,
    width: 16.5,
    height: 15.6975,
    opacity: 1,
  },
  ratingContainer: {
    width: 180,
    height: 66,
    alignItems: 'center',
    gap: 10,
    marginTop: 18,
    opacity: 1,
  },
  stars: {
    width: 180,
    height: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    opacity: 1,
  },
  star: {
    width: 32,
    height: 32,
    opacity: 1,
  },
  rating: {
    width: 180,
    height: 24,
    color: '#173F5F',
    fontFamily: sfProFont,
    fontSize: 16,
    fontWeight: '590' as TextStyle['fontWeight'],
    lineHeight: 24,
    letterSpacing: 0,
    textAlign: 'center',
    opacity: 1,
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
