import api from './api';

export const analyticsService = {
  getDashboard: async () => {
    const response = await api.get('/analytics/dashboard');
    return response.data;
  },
  getCategories: async () => {
    const response = await api.get('/analytics/categories');
    return response.data;
  },
  getEvents: async () => {
    const response = await api.get('/analytics/events');
    return response.data;
  },
  getCashflow: async (months = 6) => {
    const response = await api.get(`/analytics/cashflow?months=${months}`);
    return response.data;
  }
};
