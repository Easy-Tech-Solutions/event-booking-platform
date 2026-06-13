import apiClient from './client';

export const trackingLinkAPI = {
  getLinks: (params) => apiClient.get('/tracking-links', { params }),
  create: (data) => apiClient.post('/tracking-links', data),
  remove: (id) => apiClient.delete(`/tracking-links/${id}`),
};
