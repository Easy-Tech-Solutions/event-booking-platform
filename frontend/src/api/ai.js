import apiClient from './client';

export const aiAPI = {
  generate: (type, context) => apiClient.post('/ai/generate', { type, context }),
};
