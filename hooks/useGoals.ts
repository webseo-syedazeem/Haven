import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { goalsApi } from '@/lib/api';

export function useGoals() {
  return useQuery({
    queryKey: ['goals'],
    queryFn: goalsApi.get,
  });
}

export function useSaveGoals() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (goals: string[]) => goalsApi.save(goals),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    },
  });
}

export function useUpdateGoals() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (goals: string[]) => goalsApi.update(goals),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    },
  });
}
