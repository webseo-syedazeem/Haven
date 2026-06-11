import { apiClient } from './client';

export const notificationsApi = {
  get: () => apiClient<any>('/api/notifications'),
  save: (payload: Record<string, unknown>) =>
    apiClient<any>('/api/notifications', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  update: (payload: Record<string, unknown>) =>
    apiClient<any>('/api/notifications', {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
};