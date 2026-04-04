import apiClient from './client';

export interface CreateTicketTypePayload {
  event: string;
  name: string;
  description?: string;
  price: number;
  quantity: number;
  maxPerOrder?: number;
  saleStartDate?: string;
  saleEndDate?: string;
  benefits?: string[];
}

export const ticketsAPI = {
  getTicketTypes: (eventId: string) => apiClient.get(`/tickets/event/${eventId}`),
  createTicketType: (data: CreateTicketTypePayload) => apiClient.post('/tickets', data),
  updateTicketType: (id: string, data: Partial<CreateTicketTypePayload>) => apiClient.put(`/tickets/${id}`, data),
  deleteTicketType: (id: string) => apiClient.delete(`/tickets/${id}`),
};
