import apiClient from './client';

export const categoryAPI = {
  getCategories: () => apiClient.get('/categories')
};
