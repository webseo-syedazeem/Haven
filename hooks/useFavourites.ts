import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { favouritesApi } from '@/lib/api';

export function useFavourites() {
  return useQuery({
    queryKey: ['favourites'],
    queryFn: favouritesApi.get,
  });
}

export function useRemoveFavourite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => favouritesApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favourites'] });
    },
  });
}
