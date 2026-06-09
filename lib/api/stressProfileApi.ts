import { apiClient } from './client';

export const stressProfileApi = {
  get: () => apiClient<any>('/api/stress-profile'),
  save: (stress_triggers: string[]) =>
    apiClient<any>('/api/stress-profile', {
      method: 'POST',
      body: JSON.stringify({ stress_triggers }),
    }),
  update: (stress_triggers: string[]) =>
    apiClient<any>('/api/stress-profile', {
      method: 'PUT',
      body: JSON.stringify({ stress_triggers }),
    }),
};