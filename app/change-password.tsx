import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';

import { AuthTextField } from '@/components/auth/AuthTextField';
import { OnboardingContinueButton } from '@/components/onboarding/OnboardingContinueButton';
import { OnboardingScaffold } from '@/components/onboarding/OnboardingScaffold';
import { HalcyonColors } from '@/constants/design';
import { AppFonts } from '@/constants/theme';
import {
  parseAuthError,
  passwordIssue,
  type AuthFieldErrors,
} from '@/lib/auth/form-errors';
import { changePassword, resetPassword } from '@/lib/haven-api';
import { safeGoBack } from '@/lib/navigation';

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default function ChangePasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    access_token?: string | string[];
    token?: string | string[];
  }>();
  const resetToken = firstParam(params.access_token) ?? firstParam(params.token);
  const isResetFlow = Boolean(resetToken);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState<AuthFieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [newVisible, setNewVisible] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [oldVisible, setOldVisible] = useState(false);

  const handleUpdatePassword = async () => {
    if (isSubmitting) return;

    const nextFieldErrors: AuthFieldErrors = {};
    if (!isResetFlow) {
      const oldError = passwordIssue(oldPassword, 'oldPassword', false);
      if (oldError) nextFieldErrors.oldPassword = oldError;
    }
    const newError = passwordIssue(newPassword, 'newPassword', true);
    if (newError) nextFieldErrors.newPassword = newError;
    if (!confirmPassword) nextFieldErrors.confirmPassword = 'confirmPassword is required';
    else if (newPassword !== confirmPassword) nextFieldErrors.confirmPassword = 'Passwords do not match';
    if (!isResetFlow && oldPassword && newPassword && oldPassword === newPassword) {
      nextFieldErrors.newPassword = 'newPassword must be different from oldPassword';
    }
    if (Object.keys(nextFieldErrors).length) {
      setFieldErrors(nextFieldErrors);
      setErrorMessage(isResetFlow
        ? 'A valid token and new password are required'
        : 'Please provide valid password values');
      return;
    }

    setErrorMessage('');
    setFieldErrors({});
    setIsSubmitting(true);

    try {
      if (isResetFlow) {
        await resetPassword({ newPassword, token: resetToken });
      } else {
        await changePassword({ oldPassword, newPassword });
      }

      Alert.alert('Password updated', 'Your password has been updated successfully.');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');

      if (isResetFlow) {
        router.replace('/login');
      }
    } catch (error) {
      const parsed = parseAuthError(error, 'Unable to update your password right now.');
      const nextErrors = { ...parsed.fields };
      if (parsed.code === 'INVALID_CREDENTIALS' && !nextErrors.oldPassword) {
        nextErrors.oldPassword = parsed.message;
      }
      setFieldErrors(nextErrors);
      setErrorMessage(Object.keys(nextErrors).length ? '' : parsed.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const clearError = () => {
    if (errorMessage) setErrorMessage('');
  };

  const clearFieldError = (field: string) => {
    if (fieldErrors[field]) setFieldErrors((current) => ({ ...current, [field]: '' }));
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.keyboardView}>
      <OnboardingScaffold
        contentContainerStyle={styles.scrollContent}
        onBack={() => safeGoBack(router, isResetFlow ? '/login' : '/')}>
        <View style={styles.content}>
          <View style={styles.iconCircle}>
            <Ionicons color={HalcyonColors.accent} name="key-outline" size={27} />
          </View>

          <Text style={styles.heading}>
            {isResetFlow ? 'Choose a new password' : 'Change your password'}
          </Text>
          <Text style={styles.description}>
            {isResetFlow
              ? 'Use at least 8 characters to keep your Passage account secure.'
              : 'Confirm your current password, then choose a new one.'}
          </Text>

          <View style={styles.form}>
            {!isResetFlow ? (
              <AuthTextField
                autoCapitalize="none"
                autoComplete="current-password"
                errorMessage={fieldErrors.oldPassword}
                onChangeText={(value) => {
                  setOldPassword(value);
                  clearError();
                  clearFieldError('oldPassword');
                }}
                onToggleSecureText={() => setOldVisible((visible) => !visible)}
                placeholder="Current password"
                returnKeyType="next"
                secureTextEntry={!oldVisible}
                secureTextVisible={oldVisible}
                value={oldPassword}
              />
            ) : null}

            <AuthTextField
              autoCapitalize="none"
              autoComplete="new-password"
              errorMessage={fieldErrors.newPassword}
              onChangeText={(value) => {
                setNewPassword(value);
                clearError();
                clearFieldError('newPassword');
              }}
              onToggleSecureText={() => setNewVisible((visible) => !visible)}
              placeholder="New password"
              returnKeyType="next"
              secureTextEntry={!newVisible}
              secureTextVisible={newVisible}
              value={newPassword}
            />

            <AuthTextField
              autoCapitalize="none"
              autoComplete="new-password"
              errorMessage={fieldErrors.confirmPassword}
              onChangeText={(value) => {
                setConfirmPassword(value);
                clearError();
                clearFieldError('confirmPassword');
              }}
              onSubmitEditing={() => void handleUpdatePassword()}
              onToggleSecureText={() => setConfirmVisible((visible) => !visible)}
              placeholder="Confirm new password"
              returnKeyType="done"
              secureTextEntry={!confirmVisible}
              secureTextVisible={confirmVisible}
              value={confirmPassword}
            />

            {errorMessage ? (
              <Text accessibilityLiveRegion="polite" style={styles.errorText}>
                {errorMessage}
              </Text>
            ) : null}

            <OnboardingContinueButton
              label={isResetFlow ? 'Reset password' : 'Update password'}
              loading={isSubmitting}
              onPress={() => void handleUpdatePassword()}
              style={styles.submitButton}
            />
          </View>
        </View>
      </OnboardingScaffold>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  content: {
    alignSelf: 'center',
    justifyContent: 'center',
    maxWidth: 440,
    paddingBottom: 30,
    width: '100%',
  },
  description: {
    color: HalcyonColors.textSecondary,
    fontFamily: AppFonts.sansRegular,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 10,
    maxWidth: 350,
    textAlign: 'center',
  },
  errorText: {
    color: '#DFA196',
    fontFamily: AppFonts.sansRegular,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
  form: {
    marginTop: 30,
    rowGap: 12,
    width: '100%',
  },
  heading: {
    color: HalcyonColors.textPrimary,
    fontFamily: AppFonts.displayRegular,
    fontSize: 36,
    fontWeight: '400',
    lineHeight: 41,
    marginTop: 24,
    textAlign: 'center',
  },
  iconCircle: {
    alignItems: 'center',
    alignSelf: 'center',
    borderColor: HalcyonColors.accent,
    borderRadius: 28,
    borderWidth: 1,
    height: 56,
    justifyContent: 'center',
    width: 56,
  },
  keyboardView: {
    backgroundColor: HalcyonColors.background,
    flex: 1,
  },
  scrollContent: {
    justifyContent: 'center',
  },
  submitButton: {
    marginTop: 5,
  },
});
