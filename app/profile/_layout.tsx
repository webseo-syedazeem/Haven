import { Stack } from 'expo-router';

export default function ProfileLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,      
      }}>

      <Stack.Screen name="goals" options={{ headerShown: false }} />
      <Stack.Screen name="favourite-tools" options={{ headerShown: false }} />
      <Stack.Screen name="stress-profile" options={{ headerShown: false }} />
      <Stack.Screen name="notification" options={{ headerShown: false }} />
      <Stack.Screen name="privacy" options={{ headerShown: false }} />
      <Stack.Screen name="account-setting" options={{ headerShown: false }} />
    </Stack>
  );
}