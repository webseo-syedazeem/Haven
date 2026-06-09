import { apiClient } from './client';

export const goalsApi = {
  get: () => apiClient<any>('/api/goals'),
  save: (goals: string[]) => apiClient<any>('/api/goals', {
    method: 'POST',
    body: JSON.stringify({ goals }),
  }),
  update: (goals: string[]) => apiClient<any>('/api/goals', {
    method: 'PUT',
    body: JSON.stringify({ goals }),
  }),
};
