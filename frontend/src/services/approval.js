import api from './api';

export const approvalService = {
  getPendingApprovals: async () => {
    const response = await api.get('/approvals/pending');
    return response.data;
  },

  getAllApprovals: async (status = 'ALL') => {
    const response = await api.get(`/approvals/all?status=${status}`);
    return response.data;
  },
  
  approveRequest: async (requestId, comments = "") => {
    const response = await api.post(`/approvals/${requestId}/approve`, { comments });
    return response.data;
  },
  
  rejectRequest: async (requestId, comments = "") => {
    const response = await api.post(`/approvals/${requestId}/reject`, { comments });
    return response.data;
  },

  deleteRequest: async (requestId) => {
    const response = await api.delete(`/approvals/${requestId}`);
    return response.data;
  }
};
