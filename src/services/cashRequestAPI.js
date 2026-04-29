import axios from 'axios';
import { store } from '../store/store';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

console.log('API Base URL configured:', API_BASE_URL);

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

    console.log('API Request:', {
      method: config.method,
      url: config.url,
      baseURL: config.baseURL,
      fullURL: `${config.baseURL}${config.url}`
    });

    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log('API Response:', {
      url: response.config.url,
      status: response.status,
      data: response.data
    });
    return response;
  },
  (error) => {
    console.error('API Response Error:', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.message,
      data: error.response?.data
    });

    if (error.response?.status === 401) {
      // store.dispatch(logout());
    }
    return Promise.reject(error);
  }
);

// ─────────────────────────────────────────────────────────────
// Projects API
// ─────────────────────────────────────────────────────────────
export const projectsAPI = {
  getActiveProjects: async () => {
    try {
      console.log('=== CALLING GET ACTIVE PROJECTS ===');
      const response = await api.get('/projects/active');
      return response.data;
    } catch (error) {
      console.error('API: Error fetching active projects:', error);
      throw error;
    }
  },

  getAllProjects: async (params = {}) => {
    try {
      const response = await api.get('/projects', { params });
      return response.data;
    } catch (error) {
      console.error('API: Error fetching all projects:', error);
      throw error;
    }
  },

  getProjectById: async (projectId) => {
    try {
      const response = await api.get(`/projects/${projectId}`);
      return response.data;
    } catch (error) {
      console.error('API: Error fetching project details:', error);
      throw error;
    }
  },

  createProject: async (projectData) => {
    try {
      const response = await api.post('/projects', projectData);
      return response.data;
    } catch (error) {
      console.error('API: Error creating project:', error);
      throw error;
    }
  },

  updateProject: async (projectId, projectData) => {
    try {
      const response = await api.put(`/projects/${projectId}`, projectData);
      return response.data;
    } catch (error) {
      console.error('API: Error updating project:', error);
      throw error;
    }
  }
};

// ─────────────────────────────────────────────────────────────
// Budget Codes API
// ─────────────────────────────────────────────────────────────
export const budgetCodesAPI = {
  getAvailableBudgetCodes: async () => {
    try {
      console.log('=== CALLING GET AVAILABLE BUDGET CODES ===');
      const response = await api.get('/budget-codes/available');
      return response.data;
    } catch (error) {
      console.error('API: Error fetching available budget codes:', error);
      throw error;
    }
  },

  getAllBudgetCodes: async (params = {}) => {
    try {
      const response = await api.get('/budget-codes', { params });
      return response.data;
    } catch (error) {
      console.error('API: Error fetching budget codes:', error);
      throw error;
    }
  },

  getBudgetCodeById: async (codeId) => {
    try {
      const response = await api.get(`/budget-codes/${codeId}`);
      return response.data;
    } catch (error) {
      console.error('API: Error fetching budget code details:', error);
      throw error;
    }
  },

  createBudgetCode: async (budgetCodeData) => {
    try {
      const response = await api.post('/budget-codes', budgetCodeData);
      return response.data;
    } catch (error) {
      console.error('API: Error creating budget code:', error);
      throw error;
    }
  },

  updateBudgetCode: async (codeId, budgetCodeData) => {
    try {
      const response = await api.put(`/budget-codes/${codeId}`, budgetCodeData);
      return response.data;
    } catch (error) {
      console.error('API: Error updating budget code:', error);
      throw error;
    }
  }
};

// ─────────────────────────────────────────────────────────────
// Cash Requests API
// ─────────────────────────────────────────────────────────────
export const cashRequestAPI = {

  // ── Employee ──────────────────────────────────────────────

  create: async (formData) => {
    console.log('API: Creating cash request...');
    for (let [key, val] of formData.entries()) {
      console.log(val instanceof File ? `${key}: File - ${val.name} (${val.size} bytes)` : `${key}:`, val);
    }
    try {
      const response = await api.post('/cash-requests', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 60000,
      });
      console.log('API: Cash request created successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('API: Error creating cash request:', error);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }
      throw error;
    }
  },

  getEmployeeRequests: async (params = {}) => {
    try {
      const response = await api.get('/cash-requests/employee', { params });
      return response.data;
    } catch (error) {
      console.error('API: Error fetching employee cash requests:', error);
      throw error;
    }
  },

  getRequestById: async (requestId) => {
    try {
      const response = await api.get(`/cash-requests/${requestId}`);
      return response.data;
    } catch (error) {
      console.error('API: Error fetching cash request details:', error);
      throw error;
    }
  },

  updateRequest: async (requestId, updateData) => {
    try {
      const response = await api.put(`/cash-requests/${requestId}`, updateData);
      return response.data;
    } catch (error) {
      console.error('API: Error updating cash request:', error);
      throw error;
    }
  },

  deleteRequest: async (requestId) => {
    try {
      const response = await api.delete(`/cash-requests/${requestId}`);
      return response.data;
    } catch (error) {
      console.error('API: Error deleting cash request:', error);
      throw error;
    }
  },

  // ── Supervisor ────────────────────────────────────────────

  getSupervisorRequests: async (params = {}) => {
    try {
      const response = await api.get('/cash-requests/supervisor', { params });
      return response.data;
    } catch (error) {
      console.error('API: Error fetching supervisor cash requests:', error);
      throw error;
    }
  },

  processSupervisorDecision: async (requestId, decision) => {
    try {
      const response = await api.put(`/cash-requests/${requestId}/supervisor`, decision);
      return response.data;
    } catch (error) {
      console.error('API: Error processing supervisor decision:', error);
      throw error;
    }
  },

  getSupervisorJustifications: async (params = {}) => {
    try {
      const response = await api.get('/cash-requests/supervisor/pending', { params });
      return response.data;
    } catch (error) {
      console.error('API: Error fetching supervisor justifications:', error);
      throw error;
    }
  },

  processJustificationDecision: async (requestId, decision) => {
    try {
      const response = await api.put(`/cash-requests/justification/${requestId}/decision`, decision);
      return response.data;
    } catch (error) {
      console.error('API: Error processing supervisor justification decision:', error);
      throw error;
    }
  },

  // FIX: was calling response.json() which doesn't exist on an axios response
  getSupervisorJustification: async (requestId) => {
    try {
      const response = await api.get(`/cash-requests/${requestId}`);
      return response.data; // axios already parses JSON — never call .json() on it
    } catch (error) {
      console.error('Error fetching justification:', error);
      throw error;
    }
  },

  // ── Finance ───────────────────────────────────────────────

  getFinanceRequests: async (params = {}) => {
    try {
      const response = await api.get('/cash-requests/finance', { params });
      return response.data;
    } catch (error) {
      console.error('API: Error fetching finance cash requests:', error);
      throw error;
    }
  },

  processFinanceDecision: async (requestId, decision) => {
    try {
      console.log('=== API SERVICE: processFinanceDecision ===');
      console.log('Request ID:', requestId);
      console.log('Decision payload:', JSON.stringify(decision, null, 2));

      if (!decision.decision) {
        throw new Error('Decision is required (approved or rejected)');
      }
      if (decision.decision === 'approved' && !decision.budgetCodeId) {
        throw new Error('Budget code is required for approval');
      }

      const response = await api.put(`/cash-requests/${requestId}/finance`, decision);
      console.log('API Response:', response.data);
      return response.data;
    } catch (error) {
      console.error('API: Error processing finance decision:', error);
      console.error('Error response:', error.response?.data);
      throw error;
    }
  },

  getFinanceJustifications: async (params = {}) => {
    try {
      const response = await api.get('/cash-requests/finance/justifications', { params });
      return response.data;
    } catch (error) {
      console.error('API: Error fetching finance justifications:', error);
      throw error;
    }
  },

  processFinanceJustificationDecision: async (requestId, decision) => {
    try {
      const response = await api.put(`/cash-requests/${requestId}/finance/justification`, decision);
      return response.data;
    } catch (error) {
      console.error('API: Error processing finance justification decision:', error);
      throw error;
    }
  },

  // ── Admin ─────────────────────────────────────────────────

  getAllRequests: async (params = {}) => {
    try {
      const response = await api.get('/cash-requests/admin', { params });
      return response.data;
    } catch (error) {
      console.error('API: Error fetching all cash requests:', error);
      throw error;
    }
  },

  getAdminRequestDetails: async (requestId) => {
    try {
      const response = await api.get(`/cash-requests/admin/${requestId}`);
      return response.data;
    } catch (error) {
      console.error('API: Error fetching admin request details:', error);
      throw error;
    }
  },

  // ── Justification ─────────────────────────────────────────

  submitJustification: async (requestId, formData) => {
    console.log('API: Submitting justification...');
    for (let [key, val] of formData.entries()) {
      console.log(val instanceof File ? `${key}: File - ${val.name} (${val.size} bytes)` : `${key}:`, val);
    }
    try {
      const response = await api.post(`/cash-requests/${requestId}/justification`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 60000,
      });
      console.log('API: Justification submitted successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('API: Error submitting justification:', error);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }
      throw error;
    }
  },

  getRequestForJustification: async (requestId) => {
    try {
      const response = await api.get(`/cash-requests/employee/${requestId}/justify`);
      return response.data;
    } catch (error) {
      console.error('API: Error fetching request for justification:', error);
      throw error;
    }
  },

  // ── Reimbursement ─────────────────────────────────────────

  // FIX 1: Removed duplicate definition that used wrong '/api/cash-requests/reimbursement' path.
  //         The baseURL is already 'http://localhost:5001/' so prepending /api/ again
  //         produced http://localhost:5001/api/api/cash-requests/reimbursement → 404.
  // FIX 2: There was only ONE correct definition; the bad one overwrote it in JS object
  //         literal evaluation (last key wins). Now there is exactly one definition.
  createReimbursementRequest: async (formData) => {
    console.log('API: Creating reimbursement request...');
    for (let [key, val] of formData.entries()) {
      console.log(val instanceof File ? `${key}: File - ${val.name} (${val.size} bytes)` : `${key}:`, val);
    }
    try {
      const response = await api.post('/cash-requests/reimbursement', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 60000,
      });
      console.log('API: Reimbursement request created successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('API: Error creating reimbursement request:', error);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }
      throw error;
    }
  },

  // FIX: Simplified — was wrapping response.data in an extra object unnecessarily
  getReimbursementLimitStatus: async () => {
    try {
      console.log('API: Fetching reimbursement limit status...');
      const response = await api.get('/cash-requests/reimbursement/limit-status');
      return response.data;
    } catch (error) {
      console.error('API: Error fetching reimbursement limit status:', error);
      if (error.response?.status === 401) {
        throw new Error('Authentication required. Please login again.');
      }
      throw error;
    }
  },

  // ── Analytics / Reporting ─────────────────────────────────

  getFinanceReportsData: async (filters) => {
    return api.get('/cash-requests/reports/analytics', { params: filters });
  },

  getStats: async (params = {}) => {
    try {
      const response = await api.get('/cash-requests/analytics/statistics', { params });
      return response.data;
    } catch (error) {
      console.error('API: Error fetching cash request stats:', error);
      throw error;
    }
  },

  getDashboardStats: async () => {
    try {
      const response = await api.get('/cash-requests/dashboard/stats');
      return response.data;
    } catch (error) {
      console.error('API: Error fetching dashboard stats:', error);
      throw error;
    }
  },

  getApprovalChainPreview: async (employeeName, department) => {
    try {
      const response = await api.post('/cash-requests/preview-approval-chain', {
        employeeName,
        department
      });
      return response.data;
    } catch (error) {
      console.error('API: Error getting approval chain preview:', error);
      throw error;
    }
  },

  // ── File helpers ──────────────────────────────────────────

  downloadAttachment: async (publicId) => {
    try {
      const response = await api.get(
        `/files/download/${encodeURIComponent(publicId)}`,
        { responseType: 'blob' }
      );
      return response.data;
    } catch (error) {
      console.error('API: Error downloading attachment:', error);
      throw error;
    }
  },

  viewAttachment: async (publicId) => {
    try {
      const response = await api.get(
        `/files/view/${encodeURIComponent(publicId)}`,
        { responseType: 'blob' }
      );
      return response.data;
    } catch (error) {
      console.error('API: Error viewing attachment:', error);
      throw error;
    }
  },

  getFileInfo: async (publicId) => {
    try {
      const response = await api.get(`/files/info/${encodeURIComponent(publicId)}`);
      return response.data;
    } catch (error) {
      console.error('API: Error getting file info:', error);
      throw error;
    }
  },

  // ── Approvals ─────────────────────────────────────────────

  getAdminApprovals: async (params = {}) => {
    try {
      const response = await api.get('/cash-requests/admin-approvals', { params });
      return response.data;
    } catch (error) {
      console.error('API: Error fetching admin approvals:', error);
      throw error;
    }
  },

  processApprovalDecision: async (requestId, decision) => {
    try {
      const response = await api.put(`/cash-requests/${requestId}/approve`, decision);
      return response.data;
    } catch (error) {
      console.error('API: Error processing approval decision:', error);
      throw error;
    }
  },

  // ── PDF / Disbursements ───────────────────────────────────

  generateRequestPDF: async (requestId) => {
    try {
      const response = await api.get(`/cash-requests/${requestId}/pdf`, {
        responseType: 'blob'
      });
      return response;
    } catch (error) {
      console.error('Generate PDF error:', error);
      throw error;
    }
  },

  processDisbursement: async (requestId, data) => {
    try {
      const response = await api.post(`/cash-requests/${requestId}/disburse`, data);
      return response.data;
    } catch (error) {
      console.error('Process disbursement error:', error);
      throw error;
    }
  },

  getDisbursementHistory: async (requestId) => {
    try {
      const response = await api.get(`/cash-requests/${requestId}/disbursements`);
      return response.data;
    } catch (error) {
      console.error('Get disbursement history error:', error);
      throw error;
    }
  },

  getPendingDisbursements: async () => {
    try {
      const response = await api.get('/cash-requests/finance/pending-disbursements');
      return response.data;
    } catch (error) {
      console.error('Get pending disbursements error:', error);
      throw error;
    }
  },
};

export default api;