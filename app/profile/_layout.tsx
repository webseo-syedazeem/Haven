import { Stack } from 'expo-router';

import { HalcyonColors } from '@/constants/design';

/** Every profile, settings and support screen, on one stack. */
export default function ProfileLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: HalcyonColors.background },
      }}>
      <Stack.Screen name="account-setting" />
      <Stack.Screen name="edit-name" />
      <Stack.Screen name="change-email" />
      <Stack.Screen name="profile-picture" />
      <Stack.Screen name="update-password" />
      <Stack.Screen name="sound-preferences" />
      <Stack.Screen name="sounds-to-avoid" />
      <Stack.Screen name="playback-settings" />
      <Stack.Screen name="download-settings" />
      <Stack.Screen name="notification" />
      <Stack.Screen name="privacy-data" />
      <Stack.Screen name="privacy-policy" />
      <Stack.Screen name="terms" />
      <Stack.Screen name="help/index" />
      <Stack.Screen name="help/[slug]" />
      <Stack.Screen name="contact-support" />
      <Stack.Screen name="report-problem" />
      <Stack.Screen name="request-soundscape" />
    </Stack>
  );
}
