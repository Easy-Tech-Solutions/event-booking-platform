import apiClient from './client';

export interface EventsParams {
  page?: number;
  limit?: number;
  category?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  location?: string;
  status?: string;
}

export interface CreateEventPayload {
  title: string;
  description: string;
  category: string;
  startDate: string;
  endDate: string;
  capacity: number;
  location?: {
    venue?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
  };
  isOnline?: boolean;
  onlineLink?: string;
  tags?: string[];
  images?: string[];
}

export const eventsAPI = {
  getEvents: (params?: EventsParams) => apiClient.get('/events', { params }),
  getEventById: (id: string) => apiClient.get(`/events/${id}`),
  createEvent: (data: CreateEventPayload) => apiClient.post('/events', data),
  updateEvent: (id: string, data: Partial<CreateEventPayload>) => apiClient.put(`/events/${id}`, data),
  deleteEvent: (id: string) => apiClient.delete(`/events/${id}`),
  getMyEvents: (params?: { page?: number; limit?: number }) => apiClient.get('/events/my-events', { params }),
};
