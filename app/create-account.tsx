import { Ionicons } from '@expo/vector-icons';
import { Asset } from 'expo-asset';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { LegalDisclaimer } from '@/components/LegalDisclaimer';
import { AppFonts } from '@/constants/theme';
import { signUp } from '@/lib/haven-api';

const backIcon = require('@/assets/icons/back icon.svg');
const pageBackground = require('@/assets/images/sign-in-background.png');
const buttonBackground = require('@/assets/images/button backgound.jpg');
const pageBackgroundUri = Asset.fromModule(pageBackground).uri;
const buttonBackgroundUri = Asset.fromModule(buttonBackground).uri;

const colors = {
  background: '#050505',
  surface: '#0E0E0F',
  primary: '#F1E9DD',
  secondary: '#B8AFA4',
  muted: '#77716A',
  gold: '#BB834F',
  buttonText: '#12100E',
  border: '#28221D',
};

const noFocusOutline = Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : null;

export default function CreateAccountScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [username, setUsername] = useState('');

  const handleCreateAccount = async () => {
    if (isSubmitting) return;

    const trimmedEmail = email.trim();
    const trimmedUsername = username.trim();

    if (!trimmedUsername || !trimmedEmail || !password) {
      setErrorMessage('Please fill in your name, email, and password.');
      return;
    }

    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters.');
      return;
    }

    setErrorMessage('');
    setIsSubmitting(true);

    try {
      await signUp({ email: trimmedEmail, password, username: trimmedUsername });
      router.replace('/environment');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to create account right now.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboardView}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            <Pressable
              accessibilityLabel="Go back"
              hitSlop={12}
              onPress={() => router.back()}
              style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
              <Image resizeMode="contain" source={backIcon} style={styles.backIcon} />
            </Pressable>

            <View style={styles.header}>
              <Text style={styles.heading}>Create your account</Text>
              <Text style={styles.description}>Start your journey.</Text>
            </View>

            <View style={styles.form}>
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Full name</Text>
                <View style={styles.inputWrap}>
                  <TextInput
                    autoCapitalize="words"
                    autoComplete="name"
                    onChangeText={setUsername}
                    placeholder="Enter your full name"
                    placeholderTextColor={colors.muted}
                    style={[styles.input, noFocusOutline]}
                    value={username}
                  />
                  <Ionicons color={colors.gold} name="person-outline" size={22} style={styles.inputIcon} />
                </View>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Email</Text>
                <View style={styles.inputWrap}>
                  <TextInput
                    autoCapitalize="none"
                    autoComplete="email"
                    keyboardType="email-address"
                    onChangeText={setEmail}
                    placeholder="name@halcyon.com"
                    placeholderTextColor={colors.muted}
                    style={[styles.input, noFocusOutline]}
                    value={email}
                  />
                  <Ionicons color={colors.gold} name="mail-outline" size={22} style={styles.inputIcon} />
                </View>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Password</Text>
                <View style={styles.inputWrap}>
                  <TextInput
                    autoCapitalize="none"
                    autoComplete="new-password"
                    onChangeText={setPassword}
                    placeholder="Create a password"
                    placeholderTextColor={colors.muted}
                    secureTextEntry={!passwordVisible}
                    style={[styles.input, noFocusOutline]}
                    value={password}
                  />
                  <Pressable
                    accessibilityLabel={passwordVisible ? 'Hide password' : 'Show password'}
                    hitSlop={10}
                    onPress={() => setPasswordVisible((visible) => !visible)}
                    style={styles.eyeButton}>
                    <Ionicons color={colors.gold} name={passwordVisible ? 'eye-off-outline' : 'eye-outline'} size={22} />
                  </Pressable>
                </View>
              </View>

              {!!errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}

              <Pressable
                accessibilityRole="button"
                disabled={isSubmitting}
                onPress={handleCreateAccount}
                style={({ pressed }) => [styles.createButton, pressed && styles.pressed, isSubmitting && styles.disabled]}>
                {isSubmitting ? (
                  <ActivityIndicator color={colors.buttonText} />
                ) : (
                  <Text style={styles.createButtonText}>Create account</Text>
                )}
              </Pressable>

              <LegalDisclaimer linkStyle={styles.termsLink} style={styles.terms} textStyle={styles.termsText} />

              <View style={styles.loginRow}>
                <Text style={styles.loginPrompt}>Already have an account?</Text>
                <Pressable accessibilityRole="button" hitSlop={6} onPress={() => router.push('/login')}>
                  <Text style={styles.loginLink}>Sign in</Text>
                </Pressable>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.background,
    backgroundImage: `url("${pageBackgroundUri}")`,
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    backgroundSize: 'cover',
    flex: 1,
  } as any,
  safeArea: { flex: 1 },
  keyboardView: { flex: 1 },
  scrollContent: { minHeight: '100%', paddingBottom: 40, paddingHorizontal: 30, paddingTop: 90 },
  backButton: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    height: 35,
    justifyContent: 'center',
    left: 20,
    paddingRight: 3,
    position: 'fixed',
    top: 20,
    width: 35,
    zIndex: 10,
  } as any,
  backIcon: { height: 20, width: 20 },
  header: { marginBottom: 34 },
  heading: {
    color: colors.primary,
    fontFamily: AppFonts.displayRegular,
    fontSize: 35,
    fontWeight: '500',
    lineHeight: 42,
  },
  description: {
    color: colors.secondary,
    fontFamily: AppFonts.sansRegular,
    fontSize: 15,
    marginTop: 8,
  },
  form: { width: '100%' },
  fieldGroup: { marginBottom: 20 },
  label: {
    color: colors.secondary,
    fontFamily: AppFonts.sansMedium,
    fontSize: 14,
    marginBottom: 8,
  },
  inputWrap: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
  },
  input: {
    color: colors.primary,
    flex: 1,
    fontFamily: AppFonts.sansRegular,
    fontSize: 15,
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  inputIcon: { marginRight: 16 },
  eyeButton: { alignItems: 'center', justifyContent: 'center', marginRight: 8, padding: 8 },
  errorText: {
    color: colors.primary,
    fontFamily: AppFonts.sansMedium,
    fontSize: 13,
    marginBottom: 8,
    textAlign: 'center',
  },
  createButton: {
    alignItems: 'center',
    backgroundColor: colors.gold,
    backgroundImage: `url("${buttonBackgroundUri}")`,
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    backgroundSize: 'cover',
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    marginTop: 4,
    overflow: 'hidden',
    paddingVertical: 20,
  } as any,
  createButtonText: {
    color: colors.buttonText,
    fontFamily: AppFonts.sansMedium,
    fontSize: 15,
    fontWeight: '500',
  },
  terms: { marginTop: 24 },
  termsText: {
    color: colors.secondary,
    fontFamily: AppFonts.sansRegular,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
  termsLink: { color: colors.gold, textDecorationLine: 'none' },
  loginRow: { flexDirection: 'row', gap: 4, justifyContent: 'center', marginTop: 20 },
  loginPrompt: { color: colors.secondary, fontFamily: AppFonts.sansRegular, fontSize: 14 },
  loginLink: { color: colors.gold, fontFamily: AppFonts.sansMedium, fontSize: 14 },
  pressed: { opacity: 0.88 },
  disabled: { opacity: 0.6 },
});
