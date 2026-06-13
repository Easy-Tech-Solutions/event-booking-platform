import apiClient from './client';

export const seatAPI = {
  getSeats: (eventId, ticketTypeId) =>
    apiClient.get(`/seats/${eventId}`, { params: ticketTypeId ? { ticketTypeId } : {} }),
  initSeats: (data) => apiClient.post('/seats/init', data),
  holdSeats: (data) => apiClient.post('/seats/hold', data),
  releaseSeats: (data) => apiClient.post('/seats/release', data),
};
