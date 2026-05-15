import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useBottomSafeSpacing } from '@/hooks/use-bottom-safe-spacing';

const resetPasswordBackground = require('@/assets/images/reset-password-background-image.png');

function InnerShadow() {
  return (
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
  );
}

export default function ResetPasswordScreen() {
  const bottomPadding = useBottomSafeSpacing();

  return (
    <ImageBackground source={resetPasswordBackground} resizeMode="cover" style={styles.background}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardView}>
          <View style={styles.content}>
            <View style={styles.copy}>
              <Text style={styles.heading}>{`Reset your\npassword`}</Text>
              <Text style={styles.description}>
                {"Enter your email and we'll send you a reset link"}
              </Text>
            </View>

            <View style={styles.inputWrap}>
              <InnerShadow />
              <Ionicons color="#173F5F" name="mail-outline" size={18} style={styles.inputIcon} />
              <TextInput
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                placeholder="Enter Email"
                placeholderTextColor="#8C8C8C"
                style={styles.input}
              />
            </View>
          </View>

          <Pressable
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.resetButton,
              { bottom: bottomPadding },
              pressed && styles.pressed,
            ]}>
            <LinearGradient
              colors={['#B087E5', '#7863DC']}
              end={{ x: 0, y: 1 }}
              locations={[0.0379, 0.75]}
              start={{ x: 0, y: 0 }}
              style={styles.resetGradient}>
              <InnerShadow />
              <Text style={styles.resetText}>Send reset Link</Text>
            </LinearGradient>
          </Pressable>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  content: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingBottom: 102,
    paddingHorizontal: 18,
    width: '100%',
  },
  copy: {
    alignItems: 'center',
    marginBottom: 64,
  },
  description: {
    color: '#173F5F',
    fontFamily: 'SF Pro',
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: 0,
    lineHeight: 26,
    maxWidth: 300,
    textAlign: 'center',
  },
  heading: {
    color: '#173F5F',
    fontFamily: 'PlayfairDisplay-SemiBold',
    fontSize: 32,
    fontWeight: '600',
    letterSpacing: 0,
    lineHeight: 42,
    marginBottom: 8,
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
  input: {
    color: '#173F5F',
    flex: 1,
    fontFamily: 'SF Pro',
    fontSize: 16,
    fontWeight: '600',
    height: '100%',
    letterSpacing: 0,
    lineHeight: 26,
    paddingLeft: 43,
    paddingRight: 18,
  },
  inputIcon: {
    left: 20,
    position: 'absolute',
    zIndex: 1,
  },
  inputWrap: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 10,
    flexDirection: 'row',
    height: 54,
    maxWidth: 310,
    overflow: 'hidden',
    width: '100%',
  },
  keyboardView: {
    flex: 1,
  },
  pressed: {
    opacity: 0.86,
    transform: [{ scale: 0.99 }],
  },
  resetButton: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: '#7863dc',
    borderRadius: 27,
    height: 54,
    maxWidth: 348,
    overflow: 'hidden',
    position: 'absolute',
    width: '91%',
  },
  resetGradient: {
    alignItems: 'center',
    height: '100%',
    justifyContent: 'center',
    width: '100%',
  },
  resetText: {
    color: '#ffffff',
    fontFamily: 'SF Pro',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0,
    lineHeight: 26,
    textAlign: 'center',
  },
  safeArea: {
    flex: 1,
  },
});
