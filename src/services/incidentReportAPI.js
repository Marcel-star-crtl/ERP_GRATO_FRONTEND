import axios from 'axios';
import { store } from '../store/store';
// import { logout } from '../store/slices/authSlice';

// Fix the typo in the environment variable name
const API_BASE_URL = process.env.REACT_APP_API_UR || 'http://localhost:5001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for auth token
api.interceptors.request.use(
  (config) => {
    const state = store.getState();
    const token = state.auth.token;
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
    //   store.dispatch(logout());
    }
    return Promise.reject(error);
  }
);

// Incident Reports API
export const incidentReportsAPI = {
  // Employee functions
  create: async (formData) => {
    console.log('API: Creating incident report...');
    const config = {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 60000,
    };
    
    try {
      const response = await api.post('/incident-reports', formData, config);
      console.log('API: Incident report created successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('API: Error creating incident report:', error);
      throw error;
    }
  },

  getEmployeeReports: async (params = {}) => {
    const response = await api.get('/incident-reports/employee/my-reports', { params });
    return response.data;
  },

  getReportById: async (reportId) => {
    const response = await api.get(`/incident-reports/${reportId}`);
    return response.data;
  },

  updateReport: async (reportId, updateData) => {
    const response = await api.put(`/incident-reports/${reportId}`, updateData);
    return response.data;
  },

  deleteReport: async (reportId) => {
    const response = await api.delete(`/incident-reports/${reportId}`);
    return response.data;
  },

  // Supervisor functions (view only)
  getSupervisorReports: async (params = {}) => {
    const response = await api.get('/incident-reports/supervisor/view', { params });
    return response.data;
  },

  // HSE functions (primary management)
  getHSEReports: async (params = {}) => {
    const response = await api.get('/incident-reports/hse/all', { params });
    return response.data;
  },

  updateIncidentStatus: async (reportId, statusData) => {
    const response = await api.patch(`/incident-reports/${reportId}/status`, statusData);
    return response.data;
  },

  startInvestigation: async (reportId, investigationData) => {
    const response = await api.post(`/incident-reports/${reportId}/investigation/start`, investigationData);
    return response.data;
  },

  completeInvestigation: async (reportId, completionData) => {
    const response = await api.post(`/incident-reports/${reportId}/investigation/complete`, completionData);
    return response.data;
  },

  addCorrectiveAction: async (reportId, actionData) => {
    const response = await api.post(`/incident-reports/${reportId}/corrective-action`, actionData);
    return response.data;
  },

  addPreventiveAction: async (reportId, actionData) => {
    const response = await api.post(`/incident-reports/${reportId}/preventive-action`, actionData);
    return response.data;
  },

  updateActionStatus: async (reportId, actionId, statusData) => {
    const response = await api.patch(`/incident-reports/${reportId}/action/${actionId}`, statusData);
    return response.data;
  },

  resolveIncident: async (reportId, resolutionData) => {
    const response = await api.post(`/incident-reports/${reportId}/resolve`, resolutionData);
    return response.data;
  },

  addHSEUpdate: async (reportId, updateData) => {
    const response = await api.post(`/incident-reports/${reportId}/update`, updateData);
    return response.data;
  },

  getHSEDashboardStats: async () => {
    const response = await api.get('/incident-reports/hse/dashboard');
    return response.data;
  },

  // Admin functions (view all)
  getAllReports: async (params = {}) => {
    const response = await api.get('/incident-reports/admin/all', { params });
    return response.data;
  },

  // Analytics
  getStats: async () => {
    const response = await api.get('/incident-reports/analytics/statistics');
    return response.data;
  },

  getDashboardStats: async () => {
    const response = await api.get('/incident-reports/dashboard/stats');
    return response.data;
  },

  downloadAttachment: async (filename, originalName) => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(
        `${API_BASE_URL}/incident-reports/download/${filename}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to download file');
      }

      // Get the blob
      const blob = await response.blob();

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = originalName || filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up
      window.URL.revokeObjectURL(url);

      return blob;
    } catch (error) {
      console.error('Download attachment error:', error);
      throw error;
    }
  },

  getAttachmentPreviewUrl: (filename) => {
    const token = localStorage.getItem('token');
    return `${API_BASE_URL}/incident-reports/download/${filename}?token=${token}`;
  }
};

export default api;










// // Incident Reports API
// export const incidentReportsAPI = {
//   // Employee functions
//   create: async (formData) => {
//     console.log('API: Creating incident report...');
//     console.log('FormData entries:');
    
//     // Debug FormData contents
//     for (let pair of formData.entries()) {
//       if (pair[1] instanceof File) {
//         console.log(`${pair[0]}: File - ${pair[1].name} (${pair[1].size} bytes)`);
//       } else {
//         console.log(`${pair[0]}:`, pair[1]);
//       }
//     }

//     const config = {
//       headers: {
//         'Content-Type': 'multipart/form-data',
//       },
//       timeout: 60000, // Increase timeout for file uploads
//     };
    
//     try {
//       const response = await api.post('/incident-reports', formData, config);
//       console.log('API: Incident report created successfully:', response.data);
//       return response.data;
//     } catch (error) {
//       console.error('API: Error creating incident report:', error);
      
//       // Enhanced error logging
//       if (error.response) {
//         console.error('Response status:', error.response.status);
//         console.error('Response data:', error.response.data);
//         console.error('Response headers:', error.response.headers);
//       }
      
//       throw error;
//     }
//   },

//   getEmployeeReports: async () => {
//     const response = await api.get('/incident-reports/employee');
//     return response.data;
//   },

//   getReportById: async (reportId) => {
//     const response = await api.get(`/incident-reports/${reportId}`);
//     return response.data;
//   },

//   updateReport: async (reportId, updateData) => {
//     const response = await api.put(`/incident-reports/${reportId}`, updateData);
//     return response.data;
//   },

//   deleteReport: async (reportId) => {
//     const response = await api.delete(`/incident-reports/${reportId}`);
//     return response.data;
//   },

//   // Supervisor functions
//   getSupervisorReports: async () => {
//     const response = await api.get('/incident-reports/supervisor');
//     return response.data;
//   },

//   processSupervisorDecision: async (reportId, decision) => {
//     const response = await api.put(`/incident-reports/${reportId}/supervisor`, decision);
//     return response.data;
//   },

//   // HR functions
//   getHRReports: async () => {
//     const response = await api.get('/incident-reports/hr');
//     return response.data;
//   },

//   processHRDecision: async (reportId, decision) => {
//     const response = await api.put(`/incident-reports/${reportId}/hr`, decision);
//     return response.data;
//   },

//   updateInvestigation: async (reportId, investigationData) => {
//     const response = await api.put(`/incident-reports/${reportId}/investigation`, investigationData);
//     return response.data;
//   },

//   // Admin functions
//   getAllReports: async (params = {}) => {
//     const response = await api.get('/incident-reports/admin', { params });
//     return response.data;
//   },

//   // Analytics
//   getStats: async () => {
//     const response = await api.get('/incident-reports/analytics/statistics');
//     return response.data;
//   },

//   getDashboardStats: async () => {
//     const response = await api.get('/incident-reports/dashboard/stats');
//     return response.data;
//   },

//   // Approval chain preview
//   getApprovalChainPreview: async () => {
//     const response = await api.post('/incident-reports/preview-approval-chain');
//     return response.data;
//   }
// };

// export default api;