import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
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

import { AvatarPreview } from '@/components/profile/AvatarPreview';
import { ExploreButton } from '@/components/ExploreButton';
import { ProfileAvatar } from '@/components/profile/ProfileAvatar';
import { SaveSuccessModal } from '@/components/profile/SaveSuccessModal';
import { AppFonts } from '@/constants/theme';
import { useUpdateName, useUser } from '@/hooks/useUser';
import { getFirstName, getLastName } from '@/lib/api/user';

const noFocusOutline = Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : null;

function getInitials(first: string, last: string) {
  const a = first.trim().charAt(0).toUpperCase();
  const b = last.trim().charAt(0).toUpperCase();
  if (a && b) return `${a}${b}`;
  return a || b || '?';
}

export default function EditNameScreen() {
  const router = useRouter();
  const { data: me, isLoading } = useUser();
  const updateName = useUpdateName();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState('');
  const [showSavedModal, setShowSavedModal] = useState(false);
  const [prefilled, setPrefilled] = useState(false);
  const [avatarPreviewVisible, setAvatarPreviewVisible] = useState(false);

  const savedFirstName = getFirstName(me);
  const savedLastName = getLastName(me);
  const initials = useMemo(
    () => getInitials(savedFirstName, savedLastName),
    [savedFirstName, savedLastName],
  );
  const hasSavedName = !!(savedFirstName || savedLastName);
  const profileImageUrl = me?.profile?.profile_image_url ?? '';

  useEffect(() => {
    if (!me || prefilled) return;
    setFirstName(savedFirstName);
    setLastName(savedLastName);
    setPrefilled(true);
  }, [me, prefilled, savedFirstName, savedLastName]);

  async function handleSave() {
    if (!firstName.trim() || !lastName.trim()) {
      setError('Please enter both first and last name.');
      return;
    }
    setError('');
    try {
      await updateName.mutateAsync({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
      });
      setShowSavedModal(true);
    } catch (err: any) {
      setError(err?.message ?? 'Something went wrong.');
    }
  }

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}>
        <View style={styles.content}>
          <Pressable
            accessibilityLabel="Go back"
            hitSlop={12}
            onPress={() => router.back()}
            style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
            <Ionicons name="chevron-back" size={18} color="#000000" />
          </Pressable>

          <Text style={styles.title}>Edit Name</Text>

          {isLoading ? (
            <ActivityIndicator color="#6339FB" style={styles.loader} />
          ) : hasSavedName ? (
            <View style={styles.nameCard}>
              {profileImageUrl ? (
                <Pressable hitSlop={8} onPress={() => setAvatarPreviewVisible(true)}>
                  <ProfileAvatar
                    imageUrl={profileImageUrl}
                    size={52}
                    style={styles.initialsCircle}
                  />
                </Pressable>
              ) : (
                <LinearGradient
                  colors={['#B087E5', '#7863DC']}
                  end={{ x: 1, y: 1 }}
                  start={{ x: 0, y: 0 }}
                  style={styles.initialsCircle}>
                  <Text style={styles.initials}>{initials}</Text>
                </LinearGradient>
              )}
              <View style={styles.nameCopy}>
                <Text style={styles.nameLabel}>Your name</Text>
                <Text style={styles.nameValue}>
                  {savedFirstName}
                  {savedLastName ? ` ${savedLastName}` : ''}
                </Text>
              </View>
            </View>
          ) : null}

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

            <ExploreButton

              label="Save"

              loading={updateName.isPending}

              disabled={updateName.isPending || isLoading}

              onPress={handleSave}

              style={styles.saveBtn}

            />

          </View>



        </View>

        <AvatarPreview
          visible={avatarPreviewVisible}
          imageUrl={profileImageUrl}
          onClose={() => setAvatarPreviewVisible(false)}
        />

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
    marginBottom: 16,
  },
  nameCard: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    flexDirection: 'row',
    marginBottom: 24,
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: '#6339FB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
  },
  initialsCircle: {
    alignItems: 'center',
    borderRadius: 26,
    height: 52,
    justifyContent: 'center',
    marginRight: 14,
    width: 52,
  },
  initials: {
    color: '#FFFFFF',
    fontFamily: AppFonts.sansSemiBold,
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  nameCopy: {
    flex: 1,
  },
  nameLabel: {
    color: '#8C8C8C',
    fontFamily: AppFonts.sansRegular,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 2,
  },
  nameValue: {
    color: '#173F5F',
    fontFamily: AppFonts.displaySemiBold,
    fontSize: 20,
    lineHeight: 28,
  },
  loader: {

    alignSelf: 'flex-start',

    marginBottom: 24,

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

    alignSelf: 'center',

    marginTop: 24,

    maxWidth: 348,

    width: '100%',

  },

  pressed: { opacity: 0.86, transform: [{ scale: 0.99 }] },

});

