import api from './api';

export const expenseRequestService = {
  getRequests: async () => {
    const response = await api.get('/expense-requests');
    return response.data;
  },
  
  createRequest: async (data) => {
    const response = await api.post('/expense-requests', data);
    return response.data;
  },
  
  getRequestById: async (id) => {
    const response = await api.get(`/expense-requests/${id}`);
    return response.data;
  },
  
  approveRequest: async (id, comments = "") => {
    const response = await api.post(`/expense-requests/${id}/approve`, { comments });
    return response.data;
  },

  rejectRequest: async (id, comments = "") => {
    const response = await api.post(`/expense-requests/${id}/reject`, { comments });
    return response.data;
  },

  deleteRequest: async (id) => {
    const response = await api.delete(`/expense-requests/${id}`);
    return response.data;
  }
};
