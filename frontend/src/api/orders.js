import apiClient from './client';

export const orderAPI = {
  createOrder: (orderData) => apiClient.post('/orders', orderData),
  confirmOrder: (confirmData) => apiClient.post('/orders/confirm', confirmData),
  getMyOrders: (params) => apiClient.get('/orders', { params }),
  getOrderById: (id) => apiClient.get(`/orders/${id}`),
};