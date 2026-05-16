import apiClient from './client';

export interface RegisterPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role?: 'attendee' | 'organizer';
}

export interface LoginPayload {
  email: string;
  password: string;
}

export const authAPI = {
  register: (data: RegisterPayload) => apiClient.post('/auth/register', data),
  login: (data: LoginPayload) => apiClient.post('/auth/login', data),
  logout: () => apiClient.post('/auth/logout'),
  refreshToken: (refreshToken: string) => apiClient.post('/auth/refresh-token', { refreshToken }),
  getProfile: () => apiClient.get('/auth/profile'),
};
