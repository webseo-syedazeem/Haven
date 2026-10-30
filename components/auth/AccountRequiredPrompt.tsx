import { Ionicons } from '@expo/vector-icons';
import { useRouter, type Href } from 'expo-router';
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import {
  PassageColors,
  PassageModal,
  PassageRadius,
  PassageSpacing,
  Typography,
} from '@/constants/design';
import { AppFonts } from '@/constants/theme';

type PromptOptions = {
  title?: string;
  message?: string;
};

type AccountRequiredPromptValue = {
  showAccountRequiredPrompt: (options?: PromptOptions) => void;
  dismissAccountRequiredPrompt: () => void;
};

const AccountRequiredPromptContext = createContext<AccountRequiredPromptValue>({
  showAccountRequiredPrompt: () => undefined,
  dismissAccountRequiredPrompt: () => undefined,
});

const DEFAULT_TITLE = 'Log in to continue';
const DEFAULT_MESSAGE =
  'To keep your guest details, please sign up or log in. Otherwise, your guest data will be removed when guest mode ends.';

/** One app-wide, centered account prompt shared by every guest-only gate. */
export function AccountRequiredPromptProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [prompt, setPrompt] = useState<Required<PromptOptions> | null>(null);

  const dismissAccountRequiredPrompt = useCallback(() => setPrompt(null), []);
  const showAccountRequiredPrompt = useCallback((options: PromptOptions = {}) => {
    setPrompt({
      title: options.title ?? DEFAULT_TITLE,
      message: DEFAULT_MESSAGE,
    });
  }, []);

  const value = useMemo(
    () => ({ dismissAccountRequiredPrompt, showAccountRequiredPrompt }),
    [dismissAccountRequiredPrompt, showAccountRequiredPrompt]
  );

  const openLoginFlow = useCallback(() => {
    dismissAccountRequiredPrompt();
    router.push('/welcome' as Href);
  }, [dismissAccountRequiredPrompt, router]);

  return (
    <AccountRequiredPromptContext.Provider value={value}>
      {children}
      <Modal
        animationType="fade"
        navigationBarTranslucent
        onRequestClose={dismissAccountRequiredPrompt}
        statusBarTranslucent
        transparent
        visible={prompt !== null}>
        <View style={styles.modalRoot}>
          <Pressable
            accessibilityLabel="Dismiss login prompt"
            onPress={dismissAccountRequiredPrompt}
            style={StyleSheet.absoluteFill}
          />

          <View accessibilityViewIsModal style={styles.card}>
            <Pressable
              accessibilityLabel="Close"
              accessibilityRole="button"
              hitSlop={10}
              onPress={dismissAccountRequiredPrompt}
              style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}>
              <Ionicons color={PassageColors.textSecondary} name="close" size={19} />
            </Pressable>

            <Text style={styles.title}>{prompt?.title ?? DEFAULT_TITLE}</Text>
            <Text style={styles.message}>{prompt?.message ?? DEFAULT_MESSAGE}</Text>

            <Pressable
              accessibilityLabel="Log in"
              accessibilityRole="button"
              onPress={openLoginFlow}
              style={({ pressed }) => [
                styles.loginButton,
                pressed && styles.loginButtonPressed,
              ]}>
              <Text style={styles.loginLabel}>Sign up or log in</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </AccountRequiredPromptContext.Provider>
  );
}

export function useAccountRequiredPrompt() {
  return useContext(AccountRequiredPromptContext);
}

const styles = StyleSheet.create({
  modalRoot: {
    alignItems: 'center',
    backgroundColor: PassageModal.backdrop,
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: PassageSpacing.screenX,
  },
  card: {
    alignItems: 'center',
    backgroundColor: PassageColors.surface,
    borderColor: PassageColors.border,
    borderRadius: PassageRadius.card,
    borderWidth: 1,
    maxWidth: 360,
    padding: 24,
    width: '100%',
  },
  closeButton: {
    alignItems: 'center',
    height: 32,
    justifyContent: 'center',
    position: 'absolute',
    right: 10,
    top: 10,
    width: 32,
  },
  pressed: { opacity: 0.7 },
  title: {
    ...Typography.sectionHeading,
    paddingHorizontal: 24,
    textAlign: 'center',
  },
  message: {
    ...Typography.body,
    marginTop: 8,
    maxWidth: 280,
    textAlign: 'center',
  },
  loginButton: {
    alignItems: 'center',
    backgroundColor: PassageColors.accent,
    borderRadius: PassageRadius.pill,
    justifyContent: 'center',
    marginTop: 26,
    minHeight: 50,
    width: '100%',
  },
  loginButtonPressed: { backgroundColor: PassageColors.accentPressed },
  loginLabel: {
    color: PassageColors.background,
    fontFamily: AppFonts.sansSemiBold,
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
  },
});
