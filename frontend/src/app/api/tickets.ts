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
  getTicketTypes: (eventId: string) => apiClient.get(`/ticket-types/event/${eventId}`),
  createTicketType: (data: CreateTicketTypePayload) => apiClient.post('/ticket-types', data),
  updateTicketType: (id: string, data: Partial<CreateTicketTypePayload>) => apiClient.put(`/ticket-types/${id}`, data),
  deleteTicketType: (id: string) => apiClient.delete(`/ticket-types/${id}`),
};
