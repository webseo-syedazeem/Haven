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
  HalcyonColors,
  HalcyonModal,
  HalcyonRadius,
  HalcyonSpacing,
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
const DEFAULT_MESSAGE = 'Log in to use this account feature.';

/** One app-wide, centered account prompt shared by every guest-only gate. */
export function AccountRequiredPromptProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [prompt, setPrompt] = useState<Required<PromptOptions> | null>(null);

  const dismissAccountRequiredPrompt = useCallback(() => setPrompt(null), []);
  const showAccountRequiredPrompt = useCallback((options: PromptOptions = {}) => {
    setPrompt({
      title: options.title ?? DEFAULT_TITLE,
      message: options.message ?? DEFAULT_MESSAGE,
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
              <Ionicons color={HalcyonColors.textSecondary} name="close" size={19} />
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
              <Text style={styles.loginLabel}>Log in</Text>
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
    backgroundColor: HalcyonModal.backdrop,
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: HalcyonSpacing.screenX,
  },
  card: {
    alignItems: 'center',
    backgroundColor: HalcyonColors.surface,
    borderColor: HalcyonColors.border,
    borderRadius: HalcyonRadius.card,
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
    backgroundColor: HalcyonColors.accent,
    borderRadius: HalcyonRadius.pill,
    justifyContent: 'center',
    marginTop: 26,
    minHeight: 50,
    width: '100%',
  },
  loginButtonPressed: { backgroundColor: HalcyonColors.accentPressed },
  loginLabel: {
    color: HalcyonColors.background,
    fontFamily: AppFonts.sansSemiBold,
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
  },
});
