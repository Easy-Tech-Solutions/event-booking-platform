import apiClient from './client';

export const vipAPI = {
  issueComp: (data) => apiClient.post('/tickets/comp', data),
  getVipAttendees: (eventId) => apiClient.get(`/tickets/vip/${eventId}`),
};
