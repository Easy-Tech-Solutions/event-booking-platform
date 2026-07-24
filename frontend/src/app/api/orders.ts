import apiClient from './client';

export interface OrderItem {
  ticketType: string;
  quantity: number;
}

export interface OrderRecipient {
  name: string;
  email: string;
  phone?: string;
  ticketTypeName?: string;
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
  promoCode?: string;
  ref?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  paymentGateway?: 'stripe' | 'momo';
  recipients?: OrderRecipient[];
}

export interface ConfirmOrderPayload {
  orderId: string;
  paymentMethodId: string;
}

export interface ConfirmMomoPayload {
  orderId: string;
  momoPhone: string;
}

export const ordersAPI = {
  createOrder: (data: CreateOrderPayload) => apiClient.post('/orders', data),
  confirmOrder: (data: ConfirmOrderPayload) => apiClient.post('/orders/confirm', data, { timeout: 40000 }),
  confirmMomoOrder: (data: ConfirmMomoPayload) => apiClient.post(`/orders/${data.orderId}/confirm-momo`, { momoPhone: data.momoPhone }),
  getMyOrders: (params?: { page?: number; limit?: number }) => apiClient.get('/orders', { params }),
  getOrderById: (id: string) => apiClient.get(`/orders/${id}`),
};
