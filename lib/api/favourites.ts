import { apiClient } from './client';

export const favouritesApi = {
  get: () => apiClient<any>('/api/favourites'),
  add: (payload: { tool_type: string; tool_id: string; tool_name: string }) =>
    apiClient<any>('/api/favourites', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  remove: (id: string) => apiClient<any>(`/api/favourites/${id}`, {
    method: 'PUT',
  }),
};
