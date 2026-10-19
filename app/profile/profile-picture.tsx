import * as ImagePicker from 'expo-image-picker';
import { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { ConfirmDialog } from '@/components/ConfirmDialog';
import { OptionSheet, type SheetOption } from '@/components/OptionSheet';
import { RequireAuth } from '@/components/RequireAuth';
import { ProfileAvatar } from '@/components/profile/ProfileAvatar';
import { SettingsGroup, SettingsRow } from '@/components/SettingsRow';
import { SettingsPrimaryButton, SettingsScreen } from '@/components/SettingsScreen';
import { Toast, useToast } from '@/components/Toast';
import { HalcyonColors } from '@/constants/design';
import { AppFonts } from '@/constants/theme';
import { useRemoveProfileImage, useUploadProfileImage, useUser } from '@/hooks/useUser';
import { getDisplayName } from '@/lib/api/user';
import { firstFieldError, parseAuthError } from '@/lib/auth/form-errors';

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const SUPPORTED_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp']);
const SUPPORTED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

const pickerOptions: ImagePicker.ImagePickerOptions = {
  mediaTypes: ['images'],
  allowsEditing: true,
  aspect: [1, 1],
  quality: 0.85,
};

type PickerSource = 'camera' | 'library';

const SOURCE_OPTIONS: readonly SheetOption<PickerSource>[] = [
  { value: 'camera', label: 'Take a photo' },
  { value: 'library', label: 'Choose from your library' },
];

/** `POST /api/upload-profile-image` and `DELETE /api/remove-profile-image`. */
function ProfilePictureContent() {
  const { notice, showToast } = useToast();
  const { data: me } = useUser();
  const uploadImage = useUploadProfileImage();
  const removeImage = useRemoveProfileImage();

  const [sourceSheetVisible, setSourceSheetVisible] = useState(false);
  const [removeVisible, setRemoveVisible] = useState(false);

  const profileImageUrl = me?.profile?.profile_image_url ?? '';
  const hasImage = !!profileImageUrl;
  const displayName = getDisplayName(me);
  const busy = uploadImage.isPending || removeImage.isPending;

  const uploadFromResult = useCallback(
    async (result: ImagePicker.ImagePickerResult) => {
      if (result.canceled || !result.assets[0]) return;

      const asset = result.assets[0];
      const fileName = asset.fileName ?? `profile-${Date.now()}.jpg`;
      const mimeType = asset.mimeType ?? 'image/jpeg';
      const extension = fileName.split('.').pop()?.toLowerCase() ?? '';

      if (asset.fileSize && asset.fileSize > MAX_FILE_SIZE) {
        showToast('Image must be 5MB or smaller');
        return;
      }
      if (!SUPPORTED_EXTENSIONS.has(extension) || !SUPPORTED_MIME_TYPES.has(mimeType)) {
        showToast('Supported image formats are jpg, jpeg, png and webp');
        return;
      }

      try {
        await uploadImage.mutateAsync({
          uri: asset.uri,
          name: fileName,
          type: mimeType,
        });
        showToast('Profile picture updated.');
      } catch (error) {
        const parsed = parseAuthError(error, 'Could not upload that picture. Try again.');
        showToast(firstFieldError(parsed.fields) ?? parsed.message);
      }
    },
    [showToast, uploadImage]
  );

  const handlePick = useCallback(
    async (source: PickerSource) => {
      const permission =
        source === 'camera'
          ? await ImagePicker.requestCameraPermissionsAsync()
          : await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        showToast(
          source === 'camera'
            ? 'Allow camera access to take a picture.'
            : 'Allow photo access to choose a picture.'
        );
        return;
      }

      const result =
        source === 'camera'
          ? await ImagePicker.launchCameraAsync(pickerOptions)
          : await ImagePicker.launchImageLibraryAsync(pickerOptions);

      await uploadFromResult(result);
    },
    [showToast, uploadFromResult]
  );

  const handleRemove = useCallback(async () => {
    try {
      await removeImage.mutateAsync();
      setRemoveVisible(false);
      showToast('Profile picture removed.');
    } catch (error) {
      setRemoveVisible(false);
      showToast(
        error instanceof Error ? error.message : 'Could not remove that picture. Try again.'
      );
    }
  }, [removeImage, showToast]);

  return (
    <SettingsScreen
      backgroundImage={require('@/assets/images/profile-picture-studio-realistic-v2.webp')}
      overlay={
        <>
          <ConfirmDialog
            confirmLabel="Remove"
            destructive
            icon="trash-outline"
            loading={removeImage.isPending}
            message="Your profile will fall back to the default avatar."
            onCancel={() => setRemoveVisible(false)}
            onConfirm={() => void handleRemove()}
            title="Remove your picture?"
            visible={removeVisible}
          />
          <Toast bottom={72} notice={notice} />
        </>
      }
      subtitle="How you appear across Passage."
      title="Profile Picture">
      <View style={styles.avatarBlock}>
        <ProfileAvatar
          iconColor={HalcyonColors.textSecondary}
          imageUrl={profileImageUrl}
          placeholderBackgroundColor={HalcyonColors.surfaceRaised}
          size={140}
          style={styles.avatar}
        />
        {!!displayName && <Text style={styles.name}>{displayName}</Text>}
      </View>

      <SettingsPrimaryButton
        disabled={busy}
        label={hasImage ? 'Change picture' : 'Add a picture'}
        onPress={() => setSourceSheetVisible(true)}>
        {uploadImage.isPending ? (
          <ActivityIndicator color={HalcyonColors.background} />
        ) : undefined}
      </SettingsPrimaryButton>

      {hasImage && (
        <View style={styles.removeGroup}>
          <SettingsGroup>
            <SettingsRow
              busy={removeImage.isPending}
              destructive
              icon="trash-outline"
              label="Remove picture"
              onPress={() => setRemoveVisible(true)}
              showChevron={false}
            />
          </SettingsGroup>
        </View>
      )}

      <OptionSheet
        onClose={() => setSourceSheetVisible(false)}
        onSelect={(source) => void handlePick(source)}
        options={SOURCE_OPTIONS}
        title="Profile picture"
        value={null}
        visible={sourceSheetVisible}
      />
    </SettingsScreen>
  );
}

const styles = StyleSheet.create({
  avatarBlock: {
    alignItems: 'center',
    marginBottom: 28,
  },
  avatar: {
    borderColor: HalcyonColors.border,
    borderWidth: 1,
  },
  name: {
    color: HalcyonColors.textPrimary,
    fontFamily: AppFonts.displaySemiBold,
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 27,
    marginTop: 16,
  },
  removeGroup: {
    marginTop: 22,
  },
});

/**
 * The gate renders ProfilePictureContent only once there is a session, so a deep link
 * here while signed out shows the prompt instead of firing a request that can
 * only come back 401.
 */
export default function ProfilePictureScreen() {
  return (
    <RequireAuth message="Your profile picture is part of your account.">
      <ProfilePictureContent />
    </RequireAuth>
  );
}
