import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
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
import { supabase } from '@/lib/supabase';

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

export default function ChangeEmailScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setEmail(data.session?.user?.email ?? '');
    });
  }, []);

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
          <Text style={styles.title}>Change email</Text>

          {/* Form */}
          <View style={styles.form}>
            {/* Current email - read only */}
            <View style={styles.inputCard}>
              <Text style={styles.inputLabel}>Current email</Text>
              <TextInput
                editable={false}
                placeholder="your@email.com"
                placeholderTextColor="#C0C0C0"
                style={[styles.input, styles.inputReadOnly, noFocusOutline]}
                value={email}
              />
            </View>

            {/* New email - read only info */}
            <View style={styles.inputCard}>
              <Text style={styles.inputLabel}>New email</Text>
              <TextInput
                editable={false}
                placeholder="Contact support to change email"
                placeholderTextColor="#C0C0C0"
                style={[styles.input, styles.inputReadOnly, noFocusOutline]}
              />
            </View>

            {/* Delete Account */}
            <View style={styles.deleteSection}>
              <Text style={styles.deleteSectionLabel}>Account Action</Text>
              <View style={styles.deleteCard}>
                <Pressable style={styles.deleteRow}>
                  <Text style={styles.deleteLabel}>Delete my account</Text>
                  <Ionicons name="chevron-forward" size={16} color="#FF0059" />
                </Pressable>
              </View>
            </View>

            {/* Continue button */}
            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => [styles.continueBtn, pressed && styles.pressed]}>
              <LinearGradient
                colors={['#6D67CE', '#528AE1', '#6AAFE9']}
                end={{ x: 1, y: 0.58 }}
                locations={[0.0254, 0.5327, 0.9044]}
                start={{ x: 0, y: 0.42 }}
                style={styles.continueGradient}>
                <InnerShadow />
                <Text style={styles.continueText}>Continue</Text>
              </LinearGradient>
            </Pressable>

            <Text style={styles.infoText}>
              We will send a verification link to your new email
            </Text>
          </View>

        </View>
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
  continueBtn: {
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
  continueGradient: {
    alignItems: 'center',
    height: '100%',
    justifyContent: 'center',
    width: '100%',
  },
  continueText: {
    color: '#FFFFFF',
    fontFamily: AppFonts.sansMedium,
    fontSize: 18,
    fontWeight: '500',
    letterSpacing: 0,
    lineHeight: 26,
    textAlign: 'center',
  },
  infoText: {
    color: '#8C8C8C',
    fontFamily: AppFonts.sansRegular,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
  },
  pressed: { opacity: 0.86, transform: [{ scale: 0.99 }] },
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
