import AsyncStorage from '@react-native-async-storage/async-storage';

export const INTRO_STORAGE_KEY = 'is_intro';

/** Marks the onboarding intro as seen so later launches land on "Save your space". */
export async function setIntroSeen(): Promise<void> {
  try {
    await AsyncStorage.setItem(INTRO_STORAGE_KEY, 'true');
  } catch {
    // Best effort: failing to persist only means the intro shows again.
  }
}

export async function hasSeenIntro(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(INTRO_STORAGE_KEY)) === 'true';
  } catch {
    return false;
  }
}
