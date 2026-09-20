import api, { API_BASE_URL } from './api';
import { downloadBlob } from '../utils/fileDownloader';

const resolveFilename = (response, fallbackName) => {
  try {
    const disposition = response?.headers?.['content-disposition'];
    if (disposition) {
      const utfMatch = disposition.match(/filename\*=UTF-8''([^;\n]+)/i);
      if (utfMatch && utfMatch[1]) {
        return decodeURIComponent(utfMatch[1].trim());
      }
      const fnMatch = disposition.match(/filename=["']?([^"';\n]+)["']?/i);
      if (fnMatch && fnMatch[1]) {
        return fnMatch[1].trim();
      }
    }
  } catch (e) {
    // Ignore error
  }
  return fallbackName || 'document';
};

const isRenderableInBrowser = (filename, contentType) => {
  const lowerName = (filename || '').toLowerCase();
  const lowerType = (contentType || '').toLowerCase();
  
  if (lowerName.endsWith('.pdf') || lowerType.includes('pdf')) return true;
  if (lowerName.match(/\.(png|jpe?g|webp|gif|svg|txt)$/) || lowerType.startsWith('image/') || lowerType.startsWith('text/plain')) {
    return true;
  }
  return false;
};

export const documentService = {
  getDownloadUrl: (id) => {
    const token = localStorage.getItem('token');
    return `${API_BASE_URL}/documents/${id}/download${token ? `?token=${token}` : ''}`;
  },

  uploadDocument: async (file, data) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('document_category', data.document_category);
    if (data.transaction_id) formData.append('transaction_id', data.transaction_id);
    if (data.project_id) formData.append('project_id', data.project_id);

    const response = await api.post('/documents/upload', formData);
    return response.data;
  },

  getDocuments: async (filters = {}) => {
    let query = '';
    if (filters.transaction_id) query += `transaction_id=${filters.transaction_id}&`;
    if (filters.project_id) query += `project_id=${filters.project_id}&`;
    if (filters.category) query += `category=${filters.category}&`;
    
    const response = await api.get(`/documents?${query}`);
    return response.data;
  },

  deleteDocument: async (id) => {
    const response = await api.delete(`/documents/${id}`);
    return response.data;
  },

  downloadDocument: async (id, fileName) => {
    const response = await api.get(`/documents/${id}/download?disposition=attachment`, {
      responseType: 'blob'
    });
    const contentType = response.headers['content-type'];
    const resolvedName = resolveFilename(response, fileName);
    downloadBlob(response.data, resolvedName, contentType);
  },

  previewDocument: async (id, fileName = '') => {
    const response = await api.get(`/documents/${id}/download?disposition=inline`, {
      responseType: 'blob'
    });
    const contentType = response.headers['content-type'] || 'application/octet-stream';
    const resolvedName = resolveFilename(response, fileName);

    // If file cannot be previewed inline (e.g. Word .docx, Excel .xlsx, ZIP),
    // opening in _blank causes Chrome to download the blob as a raw UUID!
    // Instead, safely download it with its proper name and extension.
    if (!isRenderableInBrowser(resolvedName, contentType)) {
      downloadBlob(response.data, resolvedName, contentType);
      return;
    }

    // For inline viewable files (PDF, images), open safely in a new tab
    const blob = new Blob([response.data], { type: contentType });
    const url = window.URL.createObjectURL(blob);
    const previewWindow = window.open(url, '_blank');
    if (!previewWindow) {
      // If popup blocked, fallback to clean download
      downloadBlob(response.data, resolvedName, contentType);
    }
    setTimeout(() => {
      try {
        window.URL.revokeObjectURL(url);
      } catch (e) {}
    }, 60000);
  },

  processOcr: async (id) => {
    const formData = new FormData();
    formData.append('document_id', id);
    const response = await api.post('/documents/ocr', formData);
    return response.data;
  },

  getRepositoryStats: async () => {
    const response = await api.get('/repository/stats');
    return response.data;
  }
};
