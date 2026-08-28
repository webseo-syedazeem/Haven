import { Ionicons } from '@expo/vector-icons';
import { Asset } from 'expo-asset';
import { useRouter } from 'expo-router';
import { Image, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppFonts } from '@/constants/theme';

const backIcon = require('@/assets/icons/back icon.svg');
const background = require('@/assets/images/how-it-works-background.webp');
const buttonBackground = require('@/assets/images/button backgound.jpg');
const ratingPeople = [
  require('@/assets/images/rating-person-1.webp'),
  require('@/assets/images/rating-person-2.webp'),
  require('@/assets/images/rating-person-3.webp'),
  require('@/assets/images/rating-person-4.webp'),
  require('@/assets/images/rating-person-5.webp'),
];
const backgroundUri = Asset.fromModule(background).uri;
const buttonBackgroundUri = Asset.fromModule(buttonBackground).uri;

const colors = {
  background: '#050505',
  surface: '#0E0E0F',
  primary: '#F1E9DD',
  secondary: '#B8AFA4',
  gold: '#D39C69',
  border: '#3A3028',
  buttonText: '#12100E',
};

export default function TrustedScreen() {
  const router = useRouter();

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Pressable
            accessibilityLabel="Go back"
            hitSlop={12}
            onPress={() => router.back()}
            style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
            <Image resizeMode="contain" source={backIcon} style={styles.backIcon} />
          </Pressable>

          <Text style={styles.heading}>Trusted by thousands</Text>

          <View style={styles.ornamentRow}>
            <View style={styles.ornamentLine} />
            <Text style={styles.ornamentStar}>✦</Text>
            <View style={styles.ornamentLine} />
          </View>

          <Text adjustsFontSizeToFit numberOfLines={1} style={styles.total}>250,000+</Text>
          <Text style={styles.supportText}>people use Halcyon to support{`\n`}sleep, focus, and reset</Text>

          <View style={styles.divider} />

          <View style={styles.ratingRow}>
            <Text style={styles.ratingValue}>4.8</Text>
            <Text style={styles.ratingLabel}>rating</Text>
            <View style={styles.stars}>
              {[0, 1, 2, 3, 4].map((star) => (
                <Ionicons color={colors.gold} key={star} name="star" size={28} />
              ))}
            </View>
          </View>
          <Text style={styles.storeLabel}>App Store</Text>

          <View style={styles.avatarRow}>
            {ratingPeople.map((person, index) => (
              <Image key={index} resizeMode="cover" source={person} style={styles.avatar} />
            ))}
          </View>

          <View style={styles.quoteBlock}>
            <Text style={styles.quoteMark}>“</Text>
            <Text style={styles.quote}>Halcyon has completely changed how I relax and reset.”</Text>
            <Text style={styles.author}>— Sesh, 34</Text>
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/backed-by-science')}
            style={({ pressed }) => [styles.continueButton, pressed && styles.pressed]}>
            <Text style={styles.continueText}>Continue</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.background,
    backgroundImage: `url("${backgroundUri}")`,
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    backgroundSize: 'cover',
    flex: 1,
  } as any,
  safeArea: { flex: 1 },
  content: { alignItems: 'center', minHeight: '100%', paddingBottom: 40, paddingHorizontal: 30, paddingTop: 90 },
  backButton: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    height: 35,
    justifyContent: 'center',
    left: 20,
    paddingRight: 3,
    position: 'fixed',
    top: 20,
    width: 35,
    zIndex: 10,
  } as any,
  backIcon: { height: 20, width: 20 },
  heading: {
    color: colors.primary,
    fontFamily: AppFonts.displayRegular,
    fontSize: 35,
    fontWeight: '500',
    lineHeight: 42,
    textAlign: 'center',
  },
  ornamentRow: { alignItems: 'center', flexDirection: 'row', marginTop: 22 },
  ornamentLine: { backgroundColor: colors.gold, height: 1, width: 64 },
  ornamentStar: { color: colors.gold, fontSize: 25, marginHorizontal: 14 },
  total: {
    color: colors.gold,
    fontFamily: AppFonts.displayRegular,
    fontSize: 72,
    fontWeight: '500',
    lineHeight: 82,
    marginTop: 22,
    textAlign: 'center',
    width: '100%',
  },
  supportText: {
    color: colors.primary,
    fontFamily: AppFonts.sansRegular,
    fontSize: 18,
    lineHeight: 28,
    textAlign: 'center',
  },
  divider: { backgroundColor: colors.gold, height: 1, marginVertical: 30, opacity: 0.45, width: '100%' },
  ratingRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
  ratingValue: { color: colors.primary, fontFamily: AppFonts.displayRegular, fontSize: 42, lineHeight: 48 },
  ratingLabel: { color: colors.secondary, fontFamily: AppFonts.sansRegular, fontSize: 17, marginLeft: 10 },
  stars: { flexDirection: 'row', gap: 3, marginLeft: 18 },
  storeLabel: { color: colors.secondary, fontFamily: AppFonts.sansRegular, fontSize: 15, marginTop: 10 },
  avatarRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 34, width: '100%' },
  avatar: {
    borderColor: colors.gold,
    borderRadius: 999,
    borderWidth: 1,
    height: 64,
    marginHorizontal: -3,
    width: 64,
  },
  quoteBlock: { marginTop: 38, paddingHorizontal: 18, width: '100%' },
  quoteMark: { color: colors.gold, fontFamily: AppFonts.displayRegular, fontSize: 42, height: 30 },
  quote: {
    color: colors.primary,
    fontFamily: AppFonts.displayRegular,
    fontSize: 29,
    lineHeight: 37,
    paddingLeft: 24,
  },
  author: { color: colors.secondary, fontFamily: AppFonts.sansRegular, fontSize: 16, marginLeft: 24, marginTop: 18 },
  continueButton: {
    alignItems: 'center',
    alignSelf: 'stretch',
    backgroundColor: colors.gold,
    backgroundImage: `url("${buttonBackgroundUri}")`,
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    backgroundSize: 'cover',
    borderColor: '#28221D',
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    marginTop: 40,
    overflow: 'hidden',
    paddingVertical: 20,
  } as any,
  continueText: {
    color: colors.buttonText,
    fontFamily: AppFonts.sansMedium,
    fontSize: 15,
    fontWeight: '500',
  },
  pressed: { opacity: 0.88 },
});
