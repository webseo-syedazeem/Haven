import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ExploreButton } from '@/components/ExploreButton';
import { ProfileAvatar } from '@/components/profile/ProfileAvatar';
import { ConfirmActionModal } from '@/components/profile/ConfirmActionModal';
import { ProfileImageSourceSheet } from '@/components/profile/ProfileImageSourceSheet';
import { SaveSuccessModal } from '@/components/profile/SaveSuccessModal';
import { AppFonts } from '@/constants/theme';
import { useRemoveProfileImage, useUploadProfileImage, useUser } from '@/hooks/useUser';
import { getDisplayName } from '@/lib/api/user';

const pickerOptions: ImagePicker.ImagePickerOptions = {
  mediaTypes: ['images'],
  allowsEditing: true,
  aspect: [1, 1],
  quality: 0.85,
};

export default function ProfilePictureScreen() {
  const router = useRouter();
  const { data: me } = useUser();
  const uploadImage = useUploadProfileImage();
  const removeImage = useRemoveProfileImage();
  const [showSourceSheet, setShowSourceSheet] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [showSavedModal, setShowSavedModal] = useState(false);
  const [savedModalCopy, setSavedModalCopy] = useState({
    title: 'Profile updated',
    message: 'Your profile picture has been updated successfully.',
  });

  const profileImageUrl = me?.profile?.profile_image_url;
  const hasImage = !!profileImageUrl;
  const displayName = getDisplayName(me);

  async function uploadFromResult(result: ImagePicker.ImagePickerResult) {
    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    const uri = asset.uri;
    const name = asset.fileName ?? `profile-${Date.now()}.jpg`;
    const type = asset.mimeType ?? 'image/jpeg';

    try {
      await uploadImage.mutateAsync({ uri, name, type });
      setSavedModalCopy({
        title: 'Profile updated',
        message: 'Your profile picture has been updated successfully.',
      });
      setShowSavedModal(true);
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'Failed to upload profile picture.');
    }
  }

  async function handlePickCamera() {
    setShowSourceSheet(false);
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Please allow camera access to take a profile picture.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync(pickerOptions);
    await uploadFromResult(result);
  }

  async function handlePickFiles() {
    setShowSourceSheet(false);
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Please allow file access to choose a profile picture.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync(pickerOptions);
    await uploadFromResult(result);
  }

  function handleRemovePress() {
    setShowRemoveModal(true);
  }

  async function handleRemoveImage() {
    try {
      await removeImage.mutateAsync();
      setShowRemoveModal(false);
      setSavedModalCopy({
        title: 'Image removed',
        message: 'Your profile picture has been removed successfully.',
      });
      setShowSavedModal(true);
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'Failed to remove profile picture.');
    }
  }

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <ScrollView
        bounces={false}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}>
        <Pressable
          accessibilityLabel="Go back"
          hitSlop={12}
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
          <Ionicons color="#000000" name="chevron-back" size={18} />
        </Pressable>

        <Text style={styles.title}>Profile Picture</Text>
        <Text style={styles.subtitle}>Update how you appear across Haven</Text>

        <View style={styles.avatarSection}>
          <ProfileAvatar imageUrl={profileImageUrl} size={138} style={styles.avatarRing} />
          {!!displayName && <Text style={styles.nameLabel}>{displayName}</Text>}
        </View>

        <ExploreButton
          disabled={uploadImage.isPending || removeImage.isPending}
          label="Change Image"
          loading={uploadImage.isPending}
          onPress={() => setShowSourceSheet(true)}
          style={styles.actionButton}
        />

        {hasImage ? (
          <Pressable
            accessibilityRole="button"
            disabled={uploadImage.isPending || removeImage.isPending}
            onPress={handleRemovePress}
            style={({ pressed }) => [
              styles.removeButton,
              pressed && styles.pressed,
              (uploadImage.isPending || removeImage.isPending) && styles.disabledButton,
            ]}>
            <Ionicons color="#FF0059" name="trash-outline" size={18} />
            <Text style={styles.removeButtonText}>Remove Image</Text>
          </Pressable>
        ) : null}
      </ScrollView>

      <ProfileImageSourceSheet
        visible={showSourceSheet}
        onClose={() => setShowSourceSheet(false)}
        onPickCamera={handlePickCamera}
        onPickFiles={handlePickFiles}
      />

      <ConfirmActionModal
        confirmLabel="Remove"
        icon="trash-outline"
        loading={removeImage.isPending}
        message="Are you sure you want to delete your profile picture?"
        title="Remove image?"
        visible={showRemoveModal}
        onCancel={() => setShowRemoveModal(false)}
        onConfirm={handleRemoveImage}
      />

      <SaveSuccessModal
        message={savedModalCopy.message}
        title={savedModalCopy.title}
        visible={showSavedModal}
        onClose={() => setShowSavedModal(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#F0EEF8',
    flex: 1,
  },
  scroll: {
    paddingBottom: 32,
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
  pressed: {
    opacity: 0.86,
    transform: [{ scale: 0.99 }],
  },
  title: {
    color: '#173F5F',
    fontFamily: AppFonts.displayBold,
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 40,
    marginBottom: 6,
  },
  subtitle: {
    color: '#8C8C8C',
    fontFamily: AppFonts.sansRegular,
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 32,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarRing: {
    borderColor: 'rgba(99,57,251,0.18)',
    borderRadius: 72,
    borderWidth: 3,
    marginBottom: 12,
    shadowColor: '#6339FB',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 6,
  },
  nameLabel: {
    color: '#173F5F',
    fontFamily: AppFonts.displaySemiBold,
    fontSize: 20,
    lineHeight: 28,
  },
  actionButton: {
    alignSelf: 'center',
    maxWidth: 348,
    width: '100%',
  },
  disabledButton: {
    opacity: 0.6,
  },
  removeButton: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: 'rgba(255,0,89,0.18)',
    borderRadius: 28,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    height: 54,
    justifyContent: 'center',
    marginTop: 14,
    maxWidth: 348,
    shadowColor: '#FF0059',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    width: '100%',
    elevation: 3,
  },
  removeButtonText: {
    color: '#FF0059',
    fontFamily: AppFonts.sansSemiBold,
    fontSize: 15,
    lineHeight: 22,
  },
});
