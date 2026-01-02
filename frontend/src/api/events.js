import apiClient from './client';

export const eventAPI = {
  getEvents: (params) => apiClient.get('/events', { params }),
  getEventById: (id) => apiClient.get(`/events/${id}`),
  createEvent: (eventData) => apiClient.post('/events', eventData),
  updateEvent: (id, eventData) => apiClient.put(`/events/${id}`, eventData),
  deleteEvent: (id) => apiClient.delete(`/events/${id}`),
  getMyEvents: (params) => apiClient.get('/events/my-events', { params }),
};