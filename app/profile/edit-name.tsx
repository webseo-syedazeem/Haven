import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppFonts } from '@/constants/theme';
import { SaveSuccessModal } from '@/components/profile/SaveSuccessModal';
import { apiClient } from '@/lib/api/client';

const noFocusOutline = Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : null;

function InnerShadow() {
  return (
    <View pointerEvents="none" style={styles.innerShadow}>
      <LinearGradient
        colors={['rgba(255, 255, 255, 0.5)', 'rgba(255, 255, 255, 0)']}
        end={{ x: 0, y: 1 }}
        start={{ x: 0, y: 0 }}
        style={styles.innerShadowTop}
      />
      <LinearGradient
        colors={['rgba(255, 255, 255, 0.5)', 'rgba(255, 255, 255, 0)']}
        end={{ x: 1, y: 0 }}
        start={{ x: 0, y: 0 }}
        style={styles.innerShadowLeft}
      />
    </View>
  );
}

export default function EditNameScreen() {
  const router = useRouter();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showSavedModal, setShowSavedModal] = useState(false);

  async function handleSave() {
    if (!firstName.trim() || !lastName.trim()) {
      setError('Please enter both first and last name.');
      return;
    }
    setError('');
    setSaving(true);
    try {
      await apiClient('/api/update-name', {
        method: 'PUT',
        body: JSON.stringify({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
        }),
      });
      setShowSavedModal(true);
    } catch (err: any) {
      setError(err?.message ?? 'Something went wrong.');
    } finally {
      setSaving(false);
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
          <Text style={styles.title}>Edit Name</Text>

          {/* Form */}
          <View style={styles.form}>
            {/* First Name */}
            <View style={styles.inputCard}>
              <Text style={styles.inputLabel}>First Name</Text>
              <TextInput
                autoCapitalize="words"
                onChangeText={setFirstName}
                placeholder="John"
                placeholderTextColor="#C0C0C0"
                style={[styles.input, noFocusOutline]}
                value={firstName}
              />
            </View>

            {/* Last Name */}
            <View style={styles.inputCard}>
              <Text style={styles.inputLabel}>Last Name</Text>
              <TextInput
                autoCapitalize="words"
                onChangeText={setLastName}
                placeholder="Doe"
                placeholderTextColor="#C0C0C0"
                style={[styles.input, noFocusOutline]}
                value={lastName}
              />
            </View>

            {!!error && <Text style={styles.errorText}>{error}</Text>}

            {/* Save button */}
            <Pressable
              disabled={saving}
              onPress={handleSave}
              style={({ pressed }) => [
                styles.saveBtn,
                pressed && !saving && styles.pressed,
                saving && styles.disabled,
              ]}>
              <LinearGradient
                colors={['#6D67CE', '#528AE1', '#6AAFE9']}
                end={{ x: 1, y: 0.58 }}
                locations={[0.0254, 0.5327, 0.9044]}
                start={{ x: 0, y: 0.42 }}
                style={styles.saveGradient}>
                <InnerShadow />
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.saveText}>Save</Text>
                )}
              </LinearGradient>
            </Pressable>
          </View>

        </View>
        <SaveSuccessModal
          visible={showSavedModal}
          title="Name saved"
          message="Your name has been updated successfully."
          onClose={() => setShowSavedModal(false)}
        />
      </KeyboardAvoidingView>
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
  errorText: {
    color: '#FF0059',
    fontFamily: AppFonts.sansRegular,
    fontSize: 13,
    textAlign: 'center',
  },
  saveBtn: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: '#528ae1',
    borderRadius: 27,
    height: 54,
    marginTop: 24,
    maxWidth: 348,
    overflow: 'hidden',
    width: '100%',
  },
  saveGradient: {
    alignItems: 'center',
    height: '100%',
    justifyContent: 'center',
    width: '100%',
  },
  saveText: {
    color: '#FFFFFF',
    fontFamily: AppFonts.sansMedium,
    fontSize: 18,
    fontWeight: '500',
    letterSpacing: 0,
    lineHeight: 26,
    textAlign: 'center',
  },
  pressed: { opacity: 0.86, transform: [{ scale: 0.99 }] },
  disabled: { opacity: 0.78 },
  innerShadow: {
    ...StyleSheet.absoluteFillObject,
  },
  innerShadowLeft: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    top: 4,
    width: 16,
  },
  innerShadowTop: {
    height: 16,
    left: 4,
    position: 'absolute',
    right: 0,
    top: 0,
  },
});
