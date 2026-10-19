import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';

import { RequireAuth } from '@/components/RequireAuth';
import { FieldError, SettingsField } from '@/components/SettingsField';
import { SettingsPrimaryButton, SettingsScreen } from '@/components/SettingsScreen';
import { Toast, useToast } from '@/components/Toast';
import { HalcyonColors } from '@/constants/design';
import { useUpdateName, useUser } from '@/hooks/useUser';
import { getFirstName, getLastName } from '@/lib/api/user';
import { nameIssue, parseAuthError, type AuthFieldErrors } from '@/lib/auth/form-errors';

/** `PUT /api/update-name` takes a first and last name, both required. */
function EditNameContent() {
  const router = useRouter();
  const { notice, showToast } = useToast();
  const { data: me, isInitialLoading } = useUser();
  const updateName = useUpdateName();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [prefilled, setPrefilled] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<AuthFieldErrors>({});

  useEffect(() => {
    if (!me || prefilled) return;
    setFirstName(getFirstName(me));
    setLastName(getLastName(me));
    setPrefilled(true);
  }, [me, prefilled]);

  const handleSave = () => {
    const nextFieldErrors: AuthFieldErrors = {};
    const firstNameError = nameIssue(firstName, 'first_name');
    const lastNameError = nameIssue(lastName, 'last_name');
    if (firstNameError) nextFieldErrors.first_name = firstNameError;
    if (lastNameError) nextFieldErrors.last_name = lastNameError;
    if (Object.keys(nextFieldErrors).length) {
      setFieldErrors(nextFieldErrors);
      setError('Please provide a valid first and last name');
      return;
    }

    setError(null);
    setFieldErrors({});

    updateName.mutate(
      { first_name: firstName.trim(), last_name: lastName.trim() },
      {
        onSuccess: () => {
          showToast('Name saved.');
          router.back();
        },
        onError: (saveError) => {
          const parsed = parseAuthError(saveError, 'Could not save that. Try again.');
          setFieldErrors(parsed.fields);
          setError(Object.keys(parsed.fields).length ? null : parsed.message);
        },
      }
    );
  };

  return (
    <SettingsScreen
      backgroundImage={require('@/assets/images/name-top-meadow-realistic-final.webp')}
      overlay={<Toast bottom={72} notice={notice} />}
      subtitle="How you appear across Passage."
      title="Your Name">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <SettingsField
          autoCapitalize="words"
          label="First name"
          errorMessage={fieldErrors.first_name}
          onChangeText={(value) => {
            setFirstName(value);
            setFieldErrors((current) => ({ ...current, first_name: '' }));
          }}
          placeholder="First name"
          returnKeyType="next"
          value={firstName}
        />

        <SettingsField
          autoCapitalize="words"
          label="Last name"
          errorMessage={fieldErrors.last_name}
          onChangeText={(value) => {
            setLastName(value);
            setFieldErrors((current) => ({ ...current, last_name: '' }));
          }}
          placeholder="Last name"
          returnKeyType="done"
          value={lastName}
        />

        <FieldError message={error} />

        <SettingsPrimaryButton
          disabled={updateName.isPending || isInitialLoading}
          label="Save"
          onPress={handleSave}>
          {updateName.isPending ? (
            <ActivityIndicator color={HalcyonColors.background} />
          ) : undefined}
        </SettingsPrimaryButton>
      </KeyboardAvoidingView>
    </SettingsScreen>
  );
}

/**
 * The gate renders EditNameContent only once there is a session, so a deep link
 * here while signed out shows the prompt instead of firing a request that can
 * only come back 401.
 */
export default function EditNameScreen() {
  return (
    <RequireAuth message="Your name is part of your account.">
      <EditNameContent />
    </RequireAuth>
  );
}
