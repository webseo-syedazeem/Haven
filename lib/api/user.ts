import { apiClient, apiClientFormData } from './client';

export type UserProfile = {
  id: number;
  auth_user_id: string;
  name: string;
  email: string;
  profile_image_url?: string | null;
  is_verified?: boolean;
  last_sign_in_at?: string;
  created_at?: string;
  updated_at?: string;
};

export type MeUserMetadata = {
  first_name?: string;
  last_name?: string;
  full_name?: string;
  display_name?: string;
  username?: string;
  name?: string;
  email?: string;
};

export type MeUser = {
  id: string;
  email?: string;
  user_metadata?: MeUserMetadata;
};

export type MeData = {
  user: MeUser;
  profile: UserProfile;
};

type MeApiResponse = {
  success: boolean;
  data: MeData;
};

export function getDisplayName(me?: MeData | null): string {
  if (!me) return '';

  const meta = me.user?.user_metadata;
  const first = meta?.first_name?.trim() ?? '';
  const last = meta?.last_name?.trim() ?? '';
  if (first && last) return `${first} ${last}`;

  if (me.profile?.name?.trim()) return me.profile.name.trim();
  if (first) return first;
  if (last) return last;
  if (meta?.full_name?.trim()) return meta.full_name.trim();
  if (meta?.display_name?.trim()) return meta.display_name.trim();
  if (meta?.username?.trim()) return meta.username.trim();
  if (meta?.name?.trim()) return meta.name.trim();
  if (me.user?.email) return me.user.email.split('@')[0] ?? '';
  if (me.profile?.email) return me.profile.email.split('@')[0] ?? '';
  return '';
}

export function getFirstName(me?: MeData | null): string {
  if (!me) return '';
  const meta = me.user?.user_metadata;
  if (meta?.first_name?.trim()) return meta.first_name.trim();
  if (me.profile?.name?.trim()) return me.profile.name.trim().split(/\s+/)[0] ?? '';
  const display = getDisplayName(me);
  return display.split(/\s+/)[0] ?? '';
}

export function getLastName(me?: MeData | null): string {
  if (!me) return '';
  const meta = me.user?.user_metadata;
  if (meta?.last_name?.trim()) return meta.last_name.trim();
  if (me.profile?.name?.trim()) {
    const parts = me.profile.name.trim().split(/\s+/);
    return parts.length > 1 ? parts.slice(1).join(' ') : '';
  }
  const display = getDisplayName(me);
  const parts = display.split(/\s+/);
  return parts.length > 1 ? parts.slice(1).join(' ') : '';
}

export function getProfileEmail(me?: MeData | null): string {
  return me?.profile?.email ?? me?.user?.email ?? me?.user?.user_metadata?.email ?? '';
}

export type ProfileImageUpload = {
  uri: string;
  name: string;
  type: string;
};

export const userApi = {
  get: () => apiClient<MeApiResponse>('/api/me'),
  updateName: (payload: { first_name: string; last_name: string }) =>
    apiClient('/api/update-name', {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  changePassword: (payload: { oldPassword: string; newPassword: string }) =>
    apiClient('/api/change-password', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  uploadProfileImage: (image: ProfileImageUpload) => {
    const formData = new FormData();
    formData.append('image', image as unknown as Blob);
    return apiClientFormData<{ success: boolean; data: { profile_image_url: string } }>(
      '/api/upload-profile-image',
      formData
    );
  },
  removeProfileImage: () =>
    apiClient<{ success: boolean; data: { profile: UserProfile } }>('/api/remove-profile-image', {
      method: 'DELETE',
    }),
};
