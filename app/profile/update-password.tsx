import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ExploreButton } from '@/components/ExploreButton';
import { AppFonts } from '@/constants/theme';
import { SaveSuccessModal } from '@/components/profile/SaveSuccessModal';
import { useChangePassword } from '@/hooks/useUser';

const noFocusOutline = Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : null;

export default function UpdatePasswordScreen() {
  const router = useRouter();
  const changePassword = useChangePassword();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [showSavedModal, setShowSavedModal] = useState(false);

  async function handleUpdate() {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }
    setError('');
    try {
      await changePassword.mutateAsync({
        oldPassword: currentPassword,
        newPassword,
      });
      setShowSavedModal(true);
    } catch (err: any) {
      setError(err?.message ?? 'Something went wrong.');
    }
  }

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}>
        <View style={styles.content}>

          {/* Back */}
          <Pressable
            accessibilityLabel="Go back"
            hitSlop={12}
            onPress={() => router.back()}
            style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
            <Ionicons name="chevron-back" size={18} color="#000000" />
          </Pressable>

          {/* Header */}
          <Text style={styles.title}>Change Password</Text>

          {/* Form */}
          <View style={styles.form}>

            {/* Current Password */}
            <View style={styles.inputCard}>
              <Text style={styles.inputLabel}>Current Password</Text>
              <View style={styles.inputRow}>
                <TextInput
                  autoCapitalize="none"
                  onChangeText={setCurrentPassword}
                  placeholder="••••••••••"
                  placeholderTextColor="#C0C0C0"
                  secureTextEntry={!showCurrent}
                  style={[styles.input, noFocusOutline]}
                  value={currentPassword}
                />
                <Pressable hitSlop={10} onPress={() => setShowCurrent(v => !v)}>
                  <Ionicons
                    color="#8C8C8C"
                    name={showCurrent ? 'eye-off-outline' : 'eye-outline'}
                    size={18}
                  />
                </Pressable>
              </View>
            </View>

            {/* New Password */}
            <View style={styles.inputCard}>
              <Text style={styles.inputLabel}>New passowrd</Text>
              <View style={styles.inputRow}>
                <TextInput
                  autoCapitalize="none"
                  onChangeText={setNewPassword}
                  placeholder="••••••••••••"
                  placeholderTextColor="#C0C0C0"
                  secureTextEntry={!showNew}
                  style={[styles.input, noFocusOutline]}
                  value={newPassword}
                />
                <Pressable hitSlop={10} onPress={() => setShowNew(v => !v)}>
                  <Ionicons
                    color="#8C8C8C"
                    name={showNew ? 'eye-off-outline' : 'eye-outline'}
                    size={18}
                  />
                </Pressable>
              </View>
            </View>

            {/* Confirm Password */}
            <View style={styles.inputCard}>
              <Text style={styles.inputLabel}>Confirm password</Text>
              <View style={styles.inputRow}>
                <TextInput
                  autoCapitalize="none"
                  onChangeText={setConfirmPassword}
                  placeholder="••••••••••••••"
                  placeholderTextColor="#C0C0C0"
                  secureTextEntry={!showConfirm}
                  style={[styles.input, noFocusOutline]}
                  value={confirmPassword}
                />
                <Pressable hitSlop={10} onPress={() => setShowConfirm(v => !v)}>
                  <Ionicons
                    color="#8C8C8C"
                    name={showConfirm ? 'eye-off-outline' : 'eye-outline'}
                    size={18}
                  />
                </Pressable>
              </View>
            </View>

            {!!error && <Text style={styles.errorText}>{error}</Text>}

            {/* Update button */}
            <ExploreButton
              label="Update password"
              loading={changePassword.isPending}
              disabled={changePassword.isPending}
              onPress={handleUpdate}
              style={styles.updateBtn}
            />

          </View>
        </View>
        <SaveSuccessModal
          visible={showSavedModal}
          title="Password updated"
          message="Your password has been changed successfully."
          onClose={() => setShowSavedModal(false)}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F0EEF8' },
  flex: { flex: 1 },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 76,
  },
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
  title: {
    color: '#173F5F',
    fontFamily: AppFonts.displayBold,
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 40,
    marginBottom: 32,
  },
  form: { gap: 16 },
  inputCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  inputLabel: {
    color: '#8C8C8C',
    fontFamily: AppFonts.sansRegular,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 4,
  },
  inputRow: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  input: {
    color: '#173F5F',
    flex: 1,
    fontFamily: AppFonts.sansSemiBold,
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 24,
    padding: 0,
  },
  errorText: {
    color: '#FF0059',
    fontFamily: AppFonts.sansRegular,
    fontSize: 13,
    textAlign: 'center',
  },
  updateBtn: {
    alignSelf: 'center',
    marginTop: 24,
    maxWidth: 348,
    width: '100%',
  },
  pressed: { opacity: 0.86, transform: [{ scale: 0.99 }] },
});
