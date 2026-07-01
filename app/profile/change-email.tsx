import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ExploreButton } from '@/components/ExploreButton';
import { ConfirmActionModal } from '@/components/profile/ConfirmActionModal';
import { AppFonts } from '@/constants/theme';
import { useUser } from '@/hooks/useUser';
import { getProfileEmail } from '@/lib/api/user';
import { clearUserSession } from '@/lib/auth/clearSession';
import { deleteAccount } from '@/lib/haven-api';

const noFocusOutline = Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : null;

export default function ChangeEmailScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: me } = useUser();
  const email = getProfileEmail(me);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  async function confirmDeleteAccount() {
    setDeletingAccount(true);
    try {
      await deleteAccount();
      await clearUserSession(queryClient);
      setShowDeleteAccountModal(false);
      router.dismissAll();
      router.replace('/login');
    } catch (error) {
      Alert.alert(
        'Could not delete account',
        error instanceof Error ? error.message : 'Please try again in a moment.'
      );
    } finally {
      setDeletingAccount(false);
    }
  }

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}>
        <View style={styles.content}>

          {/* Back */}
          <Pressable
            accessibilityLabel="Go back"
            hitSlop={12}
            onPress={() => router.back()}
            style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
            <Ionicons name="chevron-back" size={18} color="#000000" />
          </Pressable>

          {/* Header */}
          <Text style={styles.title}>Change Email</Text>

          {/* Form */}
          <View style={styles.form}>
            <View style={styles.inputCard}>
              <Text style={styles.inputLabel}>Current Email</Text>
              <TextInput
                editable={false}
                placeholder="your@email.com"
                placeholderTextColor="#C0C0C0"
                style={[styles.input, styles.inputReadOnly, noFocusOutline]}
                value={email}
              />
            </View>

            {/* Delete Account */}
            <View style={styles.deleteSection}>
              <Text style={styles.deleteSectionLabel}>Account Action</Text>
              <View style={styles.deleteCard}>
                <Pressable
                  onPress={() => setShowDeleteAccountModal(true)}
                  style={({ pressed }) => [styles.deleteRow, pressed && styles.pressed]}>
                  <Text style={styles.deleteLabel}>Delete my account</Text>
                  <Ionicons name="chevron-forward" size={16} color="#FF0059" />
                </Pressable>
              </View>
            </View>

            <ExploreButton
              label="Continue"
              onPress={() => router.back()}
              style={styles.actionBtn}
            />
          </View>

        </View>
      </KeyboardAvoidingView>
      <ConfirmActionModal
        confirmLabel="Delete account"
        icon="alert-circle-outline"
        loading={deletingAccount}
        message="This will permanently delete your account and data. This process cannot be undone."
        title="Delete account?"
        visible={showDeleteAccountModal}
        onCancel={() => setShowDeleteAccountModal(false)}
        onConfirm={confirmDeleteAccount}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F0EEF8' },
  flex: { flex: 1 },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 76,
  },
  backButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 16,
    height: 32,
    justifyContent: 'center',
    left: 18,
    position: 'absolute',
    top: 15,
    width: 32,
    zIndex: 3,
  },
  title: {
    color: '#173F5F',
    fontFamily: AppFonts.displayBold,
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 40,
    marginBottom: 32,
  },
  form: { gap: 16 },
  inputCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  inputLabel: {
    color: '#8C8C8C',
    fontFamily: AppFonts.sansRegular,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 4,
  },
  input: {
    color: '#173F5F',
    fontFamily: AppFonts.sansSemiBold,
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 24,
    padding: 0,
  },
  inputReadOnly: {
    color: '#8C8C8C',
  },
  deleteSection: { marginTop: 8 },
  deleteSectionLabel: {
    color: '#6339FB',
    fontFamily: AppFonts.sansSemiBold,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  deleteCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  deleteRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 56,
    paddingHorizontal: 16,
  },
  deleteLabel: {
    color: '#FF0059',
    fontFamily: AppFonts.sansSemiBold,
    fontSize: 15,
    fontWeight: '600',
  },
  actionBtn: {
    alignSelf: 'center',
    marginTop: 24,
    maxWidth: 348,
    width: '100%',
  },
  pressed: { opacity: 0.86, transform: [{ scale: 0.99 }] },
});
