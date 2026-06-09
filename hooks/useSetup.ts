import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { setupApi } from '@/lib/api';

export function useSetup() {
  return useQuery({
    queryKey: ['setup'],
    queryFn: setupApi.get,
  });
}

export function useSaveSetup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: setupApi.save,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['setup'] });
    },
  });
}
