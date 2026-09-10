import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { OnboardingContinueButton } from '@/components/onboarding/OnboardingContinueButton';
import { OnboardingScaffold } from '@/components/onboarding/OnboardingScaffold';
import { HalcyonColors } from '@/constants/design';
import { AppFonts } from '@/constants/theme';
import { OnboardingContinueButtonBlack } from '@/components/onboarding/OnboardingcontinueButtonBlack';

const SOUND_OPTIONS = [
  {
    title: 'Focus',
    description: 'Deepen your\nconcentration',
    icon: 'head-cog-outline',
    iconColor: '#CBB08A',
    backgroundColor: '#171513',
    borderColor: 'rgba(203,176,138,0.35)',
  },

  {
    title: 'Sleep',
    description: 'Fall asleep and\nstay asleep',
    icon: 'moon-waning-crescent',
    iconColor: '#8EA7C7',
    backgroundColor: '#0D1927',
    borderColor: 'rgba(93,125,160,0.45)',
  },

  {
    title: 'Relax',
    description: 'Release stress and\nunwind',
    icon: 'weather-sunset-up',
    iconColor: '#D3A55F',
    backgroundColor: '#281D12',
    borderColor: 'rgba(190,140,65,0.35)',
  },
] as const;

export default function PromiseScreen() {
  const router = useRouter();

  return (
    <OnboardingScaffold
      contentContainerStyle={styles.content}
      footer={
        <OnboardingContinueButtonBlack
          onPress={() => router.push('/how-it-works')}
        />
      }
      onBack={() => router.back()}
      scroll={false}
    >
      <View style={styles.container}>
        <Text style={styles.heading}>
          Soundscapes
          crafted for
          how you feel.
        </Text>

        <View style={styles.cards}>
          {SOUND_OPTIONS.map((item) => (
            <View
              key={item.title}
              style={[
                styles.card,
                {
                  backgroundColor: item.backgroundColor,
                  borderColor: item.borderColor,
                },
              ]}
            >
           <View style={styles.iconCircle}>
<MaterialCommunityIcons
  name={item.icon}
  size={34}
  color={item.iconColor}
/>
              </View>

              <View style={styles.cardCopy}>
                <Text style={styles.cardTitle}>{item.title}</Text>

                <Text style={styles.cardDescription}>
                  {item.description}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </OnboardingScaffold>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 18,
    paddingHorizontal: 24,
   
  },

  container: {
    flex: 1,
    justifyContent: 'flex-start',
  },


  heading: {
    color: HalcyonColors.textPrimary,
    fontFamily: AppFonts.displayRegular,
    fontSize: 39,
    fontWeight: '500',
    letterSpacing: -0.4,
    lineHeight: 46,
    marginBottom: 30,
    paddingHorizontal: 6,
  },

  cards: {
    gap: 14,
  },

card: {
  alignItems: 'center',
  borderRadius: 18,
  borderWidth: 1,
  flexDirection: 'row',
  minHeight: 112,
  paddingHorizontal: 18,
  paddingVertical: 18,
},
iconCircle: {
  alignItems: 'center',
  borderColor: 'rgba(255,255,255,0.25)',
  borderRadius: 28,
  borderWidth: 1,
  height: 56,
  justifyContent: 'center',
  width: 56,
},
cardCopy: {
  flex: 1,
  marginLeft: 18,
  minWidth: 0,
},
cardTitle: {
  color: HalcyonColors.textPrimary,
  fontFamily: AppFonts.displayRegular,
  fontSize: 27,
  fontWeight: '500',
  lineHeight: 30,
},

  cardDescription: {
    color: HalcyonColors.textSecondary,
    fontFamily: AppFonts.sansRegular,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
  },
});