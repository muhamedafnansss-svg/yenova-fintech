import api from './api';
import { downloadBlob } from '../utils/fileDownloader';

const resolveFilename = (response, defaultName) => {
  try {
    const disposition = response?.headers?.['content-disposition'];
    if (disposition) {
      // Check for filename*=UTF-8''...
      const utfMatch = disposition.match(/filename\*=UTF-8''([^;\n]+)/i);
      if (utfMatch && utfMatch[1]) {
        return decodeURIComponent(utfMatch[1].trim());
      }
      // Check for filename="..."
      const fnMatch = disposition.match(/filename=["']?([^"';\n]+)["']?/i);
      if (fnMatch && fnMatch[1]) {
        return fnMatch[1].trim();
      }
    }
  } catch (e) {
    // Ignore header parsing error
  }
  return defaultName;
};

export const reportsService = {
  getDaily: async () => {
    const response = await api.get('/reports/daily');
    return response.data;
  },
  getWeekly: async () => {
    const response = await api.get('/reports/weekly');
    return response.data;
  },
  getMonthly: async () => {
    const response = await api.get('/reports/monthly');
    return response.data;
  },
  getYearly: async () => {
    const response = await api.get('/reports/yearly');
    return response.data;
  },
  getEventReport: async (projectId) => {
    const response = await api.get(`/reports/event/${projectId}`);
    return response.data;
  },
  
  // Export methods using authenticated requests and safe blob downloader
  exportPdf: async (type = 'daily', projectId = '', customName = '') => {
    const url = projectId 
      ? `/export/pdf?report_type=${type}&project_id=${projectId}`
      : `/export/pdf?report_type=${type}`;
    const response = await api.get(url, {
      responseType: 'blob'
    });
    
    const safeName = customName ? customName.replace(/[^a-zA-Z0-9_-]/g, '_') : `yenova_${type}`;
    const defaultFilename = `${safeName}_report_${new Date().toISOString().split('T')[0]}.pdf`;
    const filename = resolveFilename(response, defaultFilename);
    downloadBlob(response.data, filename, 'application/pdf');
  },
  
  exportExcel: async (type = 'all', projectId = '', customName = '') => {
    const url = projectId 
      ? `/export/excel?project_id=${projectId}&report_type=${type}` 
      : `/export/excel?report_type=${type}`;
    const response = await api.get(url, {
      responseType: 'blob'
    });
    
    const safeName = customName ? customName.replace(/[^a-zA-Z0-9_-]/g, '_') : `yenova_${type}`;
    const defaultFilename = `${safeName}_report_${new Date().toISOString().split('T')[0]}.xlsx`;
    const filename = resolveFilename(response, defaultFilename);
    downloadBlob(response.data, filename, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  },

  exportDocx: async (type = 'all', projectId = '', customName = '') => {
    const url = projectId
      ? `/export/docx?project_id=${projectId}&report_type=${type}`
      : `/export/docx?report_type=${type}`;
    const response = await api.get(url, {
      responseType: 'blob'
    });

    const safeName = customName ? customName.replace(/[^a-zA-Z0-9_-]/g, '_') : `yenova_${type}`;
    const defaultFilename = `${safeName}_report_${new Date().toISOString().split('T')[0]}.docx`;
    const filename = resolveFilename(response, defaultFilename);
    downloadBlob(response.data, filename, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
  },

  exportCsv: async (type = 'all', projectId = '', customName = '') => {
    const url = projectId
      ? `/export/csv?project_id=${projectId}&report_type=${type}`
      : `/export/csv?report_type=${type}`;
    const response = await api.get(url, {
      responseType: 'blob'
    });

    const safeName = customName ? customName.replace(/[^a-zA-Z0-9_-]/g, '_') : `yenova_${type}`;
    const defaultFilename = `${safeName}_data_${new Date().toISOString().split('T')[0]}.csv`;
    const filename = resolveFilename(response, defaultFilename);
    downloadBlob(response.data, filename, 'text/csv;charset=utf-8;');
  }
};
