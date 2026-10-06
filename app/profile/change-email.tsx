import { useRouter } from 'expo-router';

import { RequireAuth } from '@/components/RequireAuth';
import { SettingsField } from '@/components/SettingsField';
import { SettingsGroup, SettingsRow } from '@/components/SettingsRow';
import { SettingsScreen } from '@/components/SettingsScreen';
import { useUser } from '@/hooks/useUser';
import { getProfileEmail } from '@/lib/api/user';

/**
 * The email on the account, read only.
 *
 * There is no change-email endpoint — the auth routes cover name, password,
 * profile image and deletion, and nothing else — so this screen shows the
 * address and hands anyone who needs it changed to support rather than
 * pretending at a form that has nowhere to post.
 *
 * Deleting the account used to live here; it now sits on the Account screen
 * with the other irreversible actions.
 */
function ChangeEmailContent() {
  const router = useRouter();
  const { data: me, isInitialLoading, isError } = useUser();
  const email = getProfileEmail(me);

  const value = email || (isInitialLoading ? 'Loading…' : isError ? 'Unavailable' : 'Not set');

  return (
    <SettingsScreen
      backgroundImage={require('@/assets/images/email-compact-dusk-mountains-bg.webp')}
      subtitle="The address your account signs in with."
      title="Email">
      <SettingsField
        editable={false}
        hint="Your email is how you sign in and how we reach you about your account."
        label="Current email"
        value={value}
      />

      <SettingsGroup title="Need to change it?">
        <SettingsRow
          description="We will move your library across to the new address."
          icon="chatbubble-ellipses-outline"
          label="Contact Support"
          onPress={() => router.push('/profile/contact-support')}
        />
      </SettingsGroup>
    </SettingsScreen>
  );
}

/**
 * The gate renders ChangeEmailContent only once there is a session, so a deep link
 * here while signed out shows the prompt instead of firing a request that can
 * only come back 401.
 */
export default function ChangeEmailScreen() {
  return (
    <RequireAuth message="Your email address is part of your account.">
      <ChangeEmailContent />
    </RequireAuth>
  );
}
