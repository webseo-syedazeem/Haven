import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { ScreenWrapper } from '@/components/ScreenWrapper';
import { AppFonts } from '@/constants/theme';
import { changePassword } from '@/lib/haven-api';

const changePasswordBackground = require('@/assets/images/change-pass-image.png');
const noFocusOutline = Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : null;

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

export default function ChangePasswordScreen() {
  const router = useRouter();
  const [confirmPassword, setConfirmPassword] = useState('');
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [newVisible, setNewVisible] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [oldVisible, setOldVisible] = useState(false);

  const handleUpdatePassword = async () => {
    if (isSubmitting) {
      return;
    }

    if (!oldPassword || !newPassword || !confirmPassword) {
      setErrorMessage('Please enter your current password and confirm the new password.');
      return;
    }

    if (newPassword.length < 8) {
      setErrorMessage('Password must be at least 8 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setErrorMessage('');
    setIsSubmitting(true);

    try {
      await changePassword({ oldPassword, newPassword });
      Alert.alert('Password updated', 'Your password has been updated successfully.');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to update password right now.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScreenWrapper backgroundImage={changePasswordBackground}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}>
        <View style={styles.content}>
          <Pressable
            accessibilityLabel="Go back"
            hitSlop={12}
            onPress={() => router.back()}
            style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
            <Ionicons color="#000000" name="chevron-back" size={18} />
          </Pressable>

          <Text style={styles.heading}>Change Password</Text>

          <View style={styles.form}>
            <View style={styles.inputWrap}>
              <InnerShadow />
              <TextInput
                autoCapitalize="none"
                onChangeText={setOldPassword}
                placeholder="Current password"
                placeholderTextColor="#8C8C8C"
                secureTextEntry={!oldVisible}
                style={[styles.input, noFocusOutline]}
                value={oldPassword}
              />
              <Pressable
                accessibilityLabel={oldVisible ? 'Hide password' : 'Show password'}
                hitSlop={10}
                onPress={() => setOldVisible((visible) => !visible)}
                style={styles.eyeButton}>
                <Ionicons
                  color="#1F2937"
                  name={oldVisible ? 'eye-off-outline' : 'eye-outline'}
                  size={17}
                />
              </Pressable>
            </View>

            <View style={styles.inputWrap}>
              <InnerShadow />
              <TextInput
                autoCapitalize="none"
                onChangeText={setNewPassword}
                placeholder="New password"
                placeholderTextColor="#8C8C8C"
                secureTextEntry={!newVisible}
                style={[styles.input, noFocusOutline]}
                value={newPassword}
              />
              <Pressable
                accessibilityLabel={newVisible ? 'Hide password' : 'Show password'}
                hitSlop={10}
                onPress={() => setNewVisible((visible) => !visible)}
                style={styles.eyeButton}>
                <Ionicons
                  color="#1F2937"
                  name={newVisible ? 'eye-off-outline' : 'eye-outline'}
                  size={17}
                />
              </Pressable>
            </View>

            <View style={styles.inputWrap}>
              <InnerShadow />
              <TextInput
                autoCapitalize="none"
                onChangeText={setConfirmPassword}
                placeholder="Confirm password"
                placeholderTextColor="#8C8C8C"
                secureTextEntry={!confirmVisible}
                style={[styles.input, noFocusOutline]}
                value={confirmPassword}
              />
              <Pressable
                accessibilityLabel={confirmVisible ? 'Hide password' : 'Show password'}
                hitSlop={10}
                onPress={() => setConfirmVisible((visible) => !visible)}
                style={styles.eyeButton}>
                <Ionicons
                  color="#1F2937"
                  name={confirmVisible ? 'eye-off-outline' : 'eye-outline'}
                  size={17}
                />
              </Pressable>
            </View>

            {!!errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}

            <Pressable
              accessibilityRole="button"
              disabled={isSubmitting}
              onPress={handleUpdatePassword}
              style={({ pressed }) => [
                styles.updateButton,
                isSubmitting && styles.disabled,
                pressed && styles.pressed,
              ]}>
              <LinearGradient
                colors={['#B087E5', '#7863DC']}
                end={{ x: 0, y: 1 }}
                locations={[0.0379, 0.75]}
                start={{ x: 0, y: 0 }}
                style={styles.updateGradient}>
                <InnerShadow />
                {isSubmitting ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.updateText}>Update Password</Text>
                )}
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  backButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 16,
    height: 32,
    justifyContent: 'center',
    left: 18,
    position: 'absolute',
    top: 15,
    width: 32,
    zIndex: 3,
  },
  content: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 18,
    width: '100%',
  },
  errorText: {
    color: '#173F5F',
    fontFamily: AppFonts.sansMedium,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 18,
    marginTop: -4,
    textAlign: 'center',
  },
  disabled: {
    opacity: 0.72,
  },
  eyeButton: {
    alignItems: 'center',
    bottom: 0,
    justifyContent: 'center',
    position: 'absolute',
    right: 18,
    top: 0,
    width: 30,
  },
  form: {
    gap: 14,
    marginTop: 32,
    width: '100%',
  },
  heading: {
    color: '#173F5F',
    fontFamily: AppFonts.displaySemiBold,
    fontSize: 32,
    fontWeight: '600',
    letterSpacing: 0,
    lineHeight: 42,
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
    color: '#000000',
    flex: 1,
    fontFamily: AppFonts.sansMedium,
    fontSize: 16,
    fontWeight: '500',
    height: '100%',
    letterSpacing: 0,
    lineHeight: 26,
    paddingLeft: 21,
    paddingRight: 57,
  },
  inputWrap: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 0,
    elevation: 4,
    flexDirection: 'row',
    height: 54,
    overflow: 'hidden',
    shadowColor: '#ffffff',
    shadowOffset: {
      width: 4,
      height: 4,
    },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    width: '100%',
  },
  keyboardView: {
    flex: 1,
  },
  pressed: {
    opacity: 0.86,
    transform: [{ scale: 0.99 }],
  },
  updateButton: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: '#7863dc',
    borderRadius: 27,
    height: 54,
    marginTop: 0,
    maxWidth: 310,
    overflow: 'hidden',
    width: '100%',
  },
  updateGradient: {
    alignItems: 'center',
    height: '100%',
    justifyContent: 'center',
    width: '100%',
  },
  updateText: {
    color: '#ffffff',
    fontFamily: AppFonts.sansMedium,
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: 0,
    lineHeight: 26,
    textAlign: 'center',
  },
});
