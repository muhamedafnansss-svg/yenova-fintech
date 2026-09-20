import api from './api';

export const auditService = {
  getAuditLogs: async (limit = 50) => {
    const response = await api.get(`/audit?limit=${limit}`);
    return response.data;
  }
};
