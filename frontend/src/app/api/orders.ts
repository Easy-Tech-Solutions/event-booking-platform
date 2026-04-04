import apiClient from './client';

export interface OrderItem {
  ticketType: string;
  quantity: number;
}

export interface CreateOrderPayload {
  eventId: string;
  items: OrderItem[];
  billingDetails: {
    name: string;
    email: string;
    address?: {
      line1?: string;
      city?: string;
      state?: string;
      postal_code?: string;
      country?: string;
    };
  };
}

export interface ConfirmOrderPayload {
  orderId: string;
  paymentIntentId: string;
}

export const ordersAPI = {
  createOrder: (data: CreateOrderPayload) => apiClient.post('/orders', data),
  confirmOrder: (data: ConfirmOrderPayload) => apiClient.post('/orders/confirm', data),
  getMyOrders: (params?: { page?: number; limit?: number }) => apiClient.get('/orders', { params }),
  getOrderById: (id: string) => apiClient.get(`/orders/${id}`),
};
