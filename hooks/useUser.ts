import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useHasSession } from '@/hooks/useSession';
import { userApi } from '@/lib/api/user';
import { cacheProfile } from '@/lib/auth/offline-session';

export const ME_QUERY_KEY = ['me'] as const;

export function useUser() {
  const hasSession = useHasSession();

  return useQuery({
    queryKey: ME_QUERY_KEY,
    // Every successful `/api/me` refreshes the offline copy, so the greeting
    // and avatar still render on a launch with no connection.
    queryFn: async () => {
      const response = await userApi.get();
      void cacheProfile(response);
      return response;
    },
    // Never hit `/api/me` until a session is restored from storage or created
    // by a sign in, otherwise the request fails with a missing auth header.
    enabled: hasSession,
    // A persisted cache may belong to an earlier signed-in session. Never
    // expose its identity while the explicit guest flag has queries disabled.
    select: (response) => (hasSession ? response.data : undefined),
  });
}

export function useUpdateName() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: userApi.updateName,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ME_QUERY_KEY });
    },
  });
}

export function useChangePassword() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: userApi.changePassword,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ME_QUERY_KEY });
    },
  });
}

export function useUploadProfileImage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: userApi.uploadProfileImage,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ME_QUERY_KEY });
    },
  });
}

export function useRemoveProfileImage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: userApi.removeProfileImage,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ME_QUERY_KEY });
    },
  });
}
