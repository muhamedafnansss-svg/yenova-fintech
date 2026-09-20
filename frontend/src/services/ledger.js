import api from './api';

export const ledgerService = {
  getSummary: async () => {
    const response = await api.get('/dashboard/summary');
    return response.data;
  },
  getRecentTransactions: async (limit = 5) => {
    const response = await api.get(`/dashboard/recent-transactions?limit=${limit}`);
    return response.data;
  },
  getLedger: async (skip = 0, limit = 100, search = '') => {
    const response = await api.get(`/ledger?skip=${skip}&limit=${limit}&search=${search}`);
    return response.data;
  },
  getLedgerSummary: async (search = '') => {
    const response = await api.get(`/ledger/summary?search=${encodeURIComponent(search)}`);
    return response.data;
  },
  getOpeningBalance: async (financialYear = '2026-2027') => {
    const response = await api.get(`/opening-balance/${financialYear}`);
    return response.data;
  },
  getBalanceDetails: async () => {
    const response = await api.get('/opening-balance/current/details');
    return response.data;
  },
  setOpeningBalance: async (data) => {
    const response = await api.post('/opening-balance', data);
    return response.data;
  },
  addIncome: async (data) => {
    const response = await api.post('/income', data);
    return response.data;
  },
  addExpense: async (data) => {
    const response = await api.post('/expenses', data);
    return response.data;
  },
  deleteTransaction: async (id) => {
    const response = await api.delete(`/ledger/${id}?permanent=true`);
    return response.data;
  },
  voidTransaction: async (id, reason) => {
    const url = reason 
      ? `/ledger/${id}?permanent=false&reason=${encodeURIComponent(reason)}` 
      : `/ledger/${id}?permanent=false`;
    const response = await api.delete(url);
    return response.data;
  },
  bulkDelete: async (transactionIds, permanent = true, reason = '') => {
    const response = await api.post('/ledger/bulk-delete', {
      transaction_ids: transactionIds,
      permanent,
      reason
    });
    return response.data;
  },
  bulkVerify: async (transactionIds) => {
    const response = await api.post('/ledger/bulk-verify', {
      transaction_ids: transactionIds
    });
    return response.data;
  },
  verifyTransaction: async (id) => {
    const response = await api.post(`/ledger/${id}/verify`);
    return response.data;
  },
  parseExcelPayments: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/ledger/import/parse', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },
  commitExcelPayments: async (payload) => {
    const response = await api.post('/ledger/import/commit', payload);
    return response.data;
  }
};
