import { apiClient } from './client';

export const setupApi = {
  get: () => apiClient<any>('/api/setup'),
  save: (payload: {
    mood: string;
    sleep_quality: string;
    day_feel: string;
    goal: string;
    time_preference: string;
    support_types: string[];
  }) => apiClient<any>('/api/setup', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  update: (payload: Partial<{
    mood: string;
    sleep_quality: string;
    day_feel: string;
    goal: string;
    time_preference: string;
    support_types: string[];
  }>) => apiClient<any>('/api/setup', {
    method: 'PUT',
    body: JSON.stringify(payload),
  }),
};
