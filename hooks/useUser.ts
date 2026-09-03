import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useHasSession } from '@/hooks/useSession';
import { userApi } from '@/lib/api/user';

export const ME_QUERY_KEY = ['me'] as const;

export function useUser() {
  const hasSession = useHasSession();

  return useQuery({
    queryKey: ME_QUERY_KEY,
    queryFn: userApi.get,
    // Never hit `/api/me` until a session is restored from storage or created
    // by a sign in, otherwise the request fails with a missing auth header.
    enabled: hasSession,
    select: (response) => response.data,
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
