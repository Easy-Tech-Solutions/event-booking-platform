import apiClient from './client';

export const promoCodeAPI = {
  validate: (data) => apiClient.post('/promo-codes/validate', data),
  getMyCodes: (params) => apiClient.get('/promo-codes', { params }),
  create: (data) => apiClient.post('/promo-codes', data),
  update: (id, data) => apiClient.patch(`/promo-codes/${id}`, data),
  remove: (id) => apiClient.delete(`/promo-codes/${id}`),
};
