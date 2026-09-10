import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';

import { RequireAuth } from '@/components/RequireAuth';
import { FieldError, RevealToggle, SettingsField } from '@/components/SettingsField';
import { SettingsPrimaryButton, SettingsScreen } from '@/components/SettingsScreen';
import { Toast, useToast } from '@/components/Toast';
import { HalcyonColors } from '@/constants/design';
import { useChangePassword } from '@/hooks/useUser';

const MIN_LENGTH = 8;

/** `POST /api/change-password` takes the old password and the new one. */
function UpdatePasswordContent() {
  const router = useRouter();
  const { notice, showToast } = useToast();
  const changePassword = useChangePassword();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpdate = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Fill in all three fields.');
      return;
    }

    if (newPassword.length < MIN_LENGTH) {
      setError(`Your new password needs at least ${MIN_LENGTH} characters.`);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('The new passwords do not match.');
      return;
    }

    setError(null);

    changePassword.mutate(
      { oldPassword: currentPassword, newPassword },
      {
        onSuccess: () => {
          showToast('Password updated.');
          router.back();
        },
        onError: (saveError) =>
          setError(
            saveError instanceof Error
              ? saveError.message
              : 'Could not change your password. Try again.'
          ),
      }
    );
  };

  return (
    <SettingsScreen
      overlay={<Toast bottom={72} notice={notice} />}
      subtitle="Choose something only you would know."
      title="Change Password">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <SettingsField
          accessory={<RevealToggle onPress={() => setShowCurrent((v) => !v)} shown={showCurrent} />}
          autoCapitalize="none"
          autoCorrect={false}
          label="Current password"
          onChangeText={setCurrentPassword}
          placeholder="••••••••"
          secureTextEntry={!showCurrent}
          value={currentPassword}
        />

        <SettingsField
          accessory={<RevealToggle onPress={() => setShowNew((v) => !v)} shown={showNew} />}
          autoCapitalize="none"
          autoCorrect={false}
          hint={`At least ${MIN_LENGTH} characters.`}
          label="New password"
          onChangeText={setNewPassword}
          placeholder="••••••••"
          secureTextEntry={!showNew}
          value={newPassword}
        />

        <SettingsField
          accessory={<RevealToggle onPress={() => setShowConfirm((v) => !v)} shown={showConfirm} />}
          autoCapitalize="none"
          autoCorrect={false}
          label="Confirm new password"
          onChangeText={setConfirmPassword}
          placeholder="••••••••"
          secureTextEntry={!showConfirm}
          value={confirmPassword}
        />

        <FieldError message={error} />

        <SettingsPrimaryButton
          disabled={changePassword.isPending}
          label="Update password"
          onPress={handleUpdate}>
          {changePassword.isPending ? (
            <ActivityIndicator color={HalcyonColors.background} />
          ) : undefined}
        </SettingsPrimaryButton>
      </KeyboardAvoidingView>
    </SettingsScreen>
  );
}

/**
 * The gate renders UpdatePasswordContent only once there is a session, so a deep link
 * here while signed out shows the prompt instead of firing a request that can
 * only come back 401.
 */
export default function UpdatePasswordScreen() {
  return (
    <RequireAuth message="Your password is part of your account.">
      <UpdatePasswordContent />
    </RequireAuth>
  );
}
