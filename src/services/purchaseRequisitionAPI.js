import axios from 'axios';

const API_BASE_URL = 'http://localhost:5001/api';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Purchase Requisition API Methods
export const purchaseRequisitionAPI = {
  createRequisition: async (requisitionData) => {
    const formData = new FormData();
    
    // Append regular fields
    Object.keys(requisitionData).forEach(key => {
      if (key === 'items') {
        formData.append(key, JSON.stringify(requisitionData[key]));
      } else if (key === 'attachments') {
        // : Handle file attachments properly
        if (requisitionData.attachments && requisitionData.attachments.length > 0) {
          requisitionData.attachments.forEach((file, index) => {
            // Handle both File objects and uploaded file objects
            if (file.originFileObj) {
              // From Ant Design Upload component
              formData.append('attachments', file.originFileObj);
            } else if (file instanceof File) {
              // Direct File object
              formData.append('attachments', file);
            } else if (file.file) {
              // Nested file object
              formData.append('attachments', file.file);
            }
          });
        }
      } else if (requisitionData[key] !== undefined && requisitionData[key] !== null) {
        formData.append(key, requisitionData[key]);
      }
    });

    // : Validate items before submission
    if (requisitionData.items && requisitionData.items.length > 0) {
      const itemIds = requisitionData.items.map(item => item.itemId).filter(Boolean);
      
      if (itemIds.length > 0) {
        try {
          const validationResponse = await apiClient.post('/items/validate', { itemIds });
          
          if (!validationResponse.data.valid) {
            return {
              success: false,
              message: 'One or more selected items are not available in the database'
            };
          }
        } catch (validationError) {
          console.warn('Item validation failed, proceeding anyway:', validationError);
        }
      }
    }

    try {
      const response = await apiClient.post('/purchase-requisitions/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000, // 30 second timeout for file uploads
      });
      return response.data;
    } catch (error) {
      console.error('Create requisition error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to create requisition'
      };
    }
  },

  getEmployeeRequisitions: async () => {
    try {
      const response = await apiClient.get('/purchase-requisitions/employee');
      return response.data;
    } catch (error) {
      console.error('Get employee requisitions error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch requisitions'
      };
    }
  },

  // : Get requisition with attachment handling
  getRequisition: async (requisitionId) => {
    try {
      const response = await apiClient.get(`/purchase-requisitions/${requisitionId}`);
      
      // : Process attachments to ensure proper URLs
      if (response.data.success && response.data.data.attachments) {
        response.data.data.attachments = response.data.data.attachments.map(attachment => ({
          ...attachment,
          // Ensure we have a working download URL
          downloadUrl: attachment.url || attachment.downloadUrl,
          // Add helper methods
          canPreview: ['jpg', 'jpeg', 'png', 'gif', 'pdf'].includes(
            (attachment.format || attachment.name?.split('.').pop() || '').toLowerCase()
          ),
          fileType: attachment.format || attachment.name?.split('.').pop() || 'unknown',
          fileSize: attachment.size || 0,
          fileName: attachment.name || 'Unknown File'
        }));
      }
      
      return response.data;
    } catch (error) {
      console.error('Get requisition error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch requisition'
      };
    }
  },

  // : Download attachment with proper error handling
  downloadAttachment: async (requisitionId, attachmentId) => {
    try {
      const response = await apiClient.get(
        `/purchase-requisitions/${requisitionId}/attachments/${attachmentId}/download`
      );
      
      if (response.data.success) {
        const { downloadUrl, filename, mimetype } = response.data.data;
        
        // Create a temporary link to trigger download
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = filename || 'attachment';
        link.target = '_blank';
        
        // Append to body, click, and remove
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        return {
          success: true,
          message: 'Download started'
        };
      } else {
        throw new Error(response.data.message || 'Failed to get download URL');
      }
    } catch (error) {
      console.error('Download attachment error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to download attachment'
      };
    }
  },

  // : Preview attachment (for images and PDFs)
  previewAttachment: async (requisitionId, attachmentId) => {
    try {
      const response = await apiClient.get(
        `/purchase-requisitions/${requisitionId}/attachments/${attachmentId}/download`
      );
      
      if (response.data.success) {
        const { downloadUrl, mimetype } = response.data.data;
        
        // Open in new window for preview
        if (mimetype?.includes('image/') || mimetype?.includes('pdf')) {
          window.open(downloadUrl, '_blank');
          return {
            success: true,
            message: 'Preview opened'
          };
        } else {
          // For non-previewable files, trigger download
          return this.downloadAttachment(requisitionId, attachmentId);
        }
      } else {
        throw new Error(response.data.message || 'Failed to get preview URL');
      }
    } catch (error) {
      console.error('Preview attachment error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to preview attachment'
      };
    }
  },

  saveDraft: async (draftData) => {
    try {
      // : Validate items if they exist
      if (draftData.items && draftData.items.length > 0) {
        const itemIds = draftData.items.map(item => item.itemId).filter(Boolean);
        
        if (itemIds.length > 0) {
          try {
            const validationResponse = await apiClient.post('/items/validate', { itemIds });
            
            if (!validationResponse.data.valid) {
              return {
                success: false,
                message: 'One or more selected items are not available in the database'
              };
            }
          } catch (validationError) {
            console.warn('Item validation failed for draft, proceeding anyway:', validationError);
          }
        }
      }

      const response = await apiClient.post('/purchase-requisitions/draft', draftData);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error saving draft:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to save draft'
      };
    }
  },

  updateRequisition: async (requisitionId, updateData) => {
    try {
      const response = await apiClient.put(`/purchase-requisitions/${requisitionId}`, updateData);
      return response.data;
    } catch (error) {
      console.error('Update requisition error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update requisition'
      };
    }
  },

  deleteRequisition: async (requisitionId) => {
    try {
      const response = await apiClient.delete(`/purchase-requisitions/${requisitionId}`);
      return response.data;
    } catch (error) {
      console.error('Delete requisition error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to delete requisition'
      };
    }
  },

  // Supervisor endpoints
  getSupervisorRequisitions: async () => {
    try {
      const response = await apiClient.get('/purchase-requisitions/supervisor');
      return response.data;
    } catch (error) {
      console.error('Get supervisor requisitions error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch supervisor requisitions'
      };
    }
  },

  processSupervisorDecision: async (requisitionId, decision, comments) => {
    try {
      const response = await apiClient.put(`/purchase-requisitions/${requisitionId}/supervisor`, {
        decision,
        comments,
      });
      return response.data;
    } catch (error) {
      console.error('Process supervisor decision error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to process supervisor decision'
      };
    }
  },

  // Finance endpoints
  getFinanceRequisitions: async () => {
    try {
      const response = await apiClient.get('/purchase-requisitions/finance');
      return response.data;
    } catch (error) {
      console.error('Get finance requisitions error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch finance requisitions'
      };
    }
  },

  processFinanceVerification: async (requisitionId, verificationData) => {
    try {
      const response = await apiClient.put(`/purchase-requisitions/${requisitionId}/finance-verification`, verificationData);
      return response.data;
    } catch (error) {
      console.error('Process finance verification error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to process finance verification'
      };
    }
  },

  // Budget Code Management endpoints
  getBudgetCodes: async () => {
    try {
      const response = await apiClient.get('/budget-codes');
      return response.data;
    } catch (error) {
      console.error('Error fetching budget codes:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch budget codes'
      };
    }
  },

  createBudgetCode: async (budgetCodeData) => {
    try {
      const response = await apiClient.post('/budget-codes', budgetCodeData);
      return response.data;
    } catch (error) {
      console.error('Error creating budget code:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to create budget code'
      };
    }
  },

  updateBudgetCode: async (budgetCodeId, budgetCodeData) => {
    try {
      const response = await apiClient.put(`/budget-codes/${budgetCodeId}`, budgetCodeData);
      return response.data;
    } catch (error) {
      console.error('Error updating budget code:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update budget code'
      };
    }
  },

  deleteBudgetCode: async (budgetCodeId) => {
    try {
      const response = await apiClient.delete(`/budget-codes/${budgetCodeId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting budget code:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to delete budget code'
      };
    }
  },

  getBudgetCodeUtilization: async (budgetCodeId, period = 'monthly') => {
    try {
      const response = await apiClient.get(`/budget-codes/${budgetCodeId}/utilization`, {
        params: { period }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching budget code utilization:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch utilization data'
      };
    }
  },

  getPendingForSupervisor: async () => {
    try {
      const response = await apiClient.get('/budget-codes/supervisor/pending');
      return response.data;
    } catch (error) {
      console.error('Error fetching pending budget codes:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch pending budget codes'
      };
    }
  },

  processApproval: async (budgetCodeId, approvalData) => {
    try {
      const response = await apiClient.post(`/budget-codes/${budgetCodeId}/approve`, approvalData);
      return response.data;
    } catch (error) {
      console.error('Error processing approval:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to process approval'
      };
    }
  },

  submitForApproval: async (budgetCodeId) => {
    try {
      const response = await apiClient.post(`/budget-codes/${budgetCodeId}/submit`);
      return response.data;
    } catch (error) {
      console.error('Error submitting for approval:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to submit for approval'
      };
    }
  },

  getSupervisorStats: async () => {
    try {
      const response = await apiClient.get('/budget-codes/supervisor/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching supervisor stats:', error);
      return {
        success: false,
        data: { pending: 0, approved: 0, rejected: 0, total: 0 }
      };
    }
  },

  // Supply Chain endpoints
  getSupplyChainRequisitions: async () => {
    try {
      const response = await apiClient.get('/purchase-requisitions/supply-chain');
      return response.data;
    } catch (error) {
      console.error('Get supply chain requisitions error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch supply chain requisitions'
      };
    }
  },

  processSupplyChainDecision: async (requisitionId, decisionData) => {
    try {
      const response = await apiClient.put(`/purchase-requisitions/${requisitionId}/supply-chain`, decisionData);
      return response.data;
    } catch (error) {
      console.error('Process supply chain decision error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to process supply chain decision'
      };
    }
  },

  // Buyer assignment endpoints
  getAvailableBuyers: async () => {
    try {
      const response = await apiClient.get('/purchase-requisitions/buyers/available');
      return response.data;
    } catch (error) {
      console.error('Get available buyers error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch available buyers'
      };
    }
  },

  assignBuyer: async (requisitionId, assignmentData) => {
    try {
      const response = await apiClient.put(`/purchase-requisitions/${requisitionId}/assign-buyer`, assignmentData);
      return response.data;
    } catch (error) {
      console.error('Assign buyer error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to assign buyer'
      };
    }
  },

  // Head approval endpoints
  getHeadApprovalRequisitions: async () => {
    try {
      const response = await apiClient.get('/purchase-requisitions/head-approval');
      return response.data;
    } catch (error) {
      console.error('Get head approval requisitions error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch head approval requisitions'
      };
    }
  },

  processHeadApproval: async (requisitionId, decision, comments) => {
    try {
      const response = await apiClient.put(`/purchase-requisitions/${requisitionId}/head-approval`, {
        decision,
        comments,
      });
      return response.data;
    } catch (error) {
      console.error('Process head approval error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to process head approval'
      };
    }
  },

  // Buyer endpoints
  getBuyerRequisitions: async () => {
    try {
      const response = await apiClient.get('/purchase-requisitions/buyer');
      return response.data;
    } catch (error) {
      console.error('Get buyer requisitions error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch buyer requisitions'
      };
    }
  },

  // Admin endpoints
  getAllRequisitions: async (params = {}) => {
    try {
      const response = await apiClient.get('/purchase-requisitions/admin', { params });
      return response.data;
    } catch (error) {
      console.error('Get all requisitions error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch all requisitions'
      };
    }
  },

  // Utility endpoints
  getApprovalChainPreview: async (employeeName, department) => {
    try {
      const response = await apiClient.post('/purchase-requisitions/preview-approval-chain', {
        employeeName,
        department,
      });
      return response.data;
    } catch (error) {
      console.error('Get approval chain preview error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to get approval chain preview'
      };
    }
  },

  // Analytics endpoints
  getDashboardStats: async () => {
    try {
      const response = await apiClient.get('/purchase-requisitions/dashboard/stats');
      return response.data;
    } catch (error) {
      console.error('Get dashboard stats error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch dashboard stats'
      };
    }
  },

  getCategoryAnalytics: async (period = 'quarterly') => {
    try {
      const response = await apiClient.get('/purchase-requisitions/analytics/categories', {
        params: { period }
      });
      return response.data;
    } catch (error) {
      console.error('Get category analytics error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch category analytics'
      };
    }
  },

  getVendorPerformance: async () => {
    try {
      const response = await apiClient.get('/purchase-requisitions/analytics/vendors');
      return response.data;
    } catch (error) {
      console.error('Get vendor performance error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch vendor performance'
      };
    }
  },

  getProcurementPlanningData: async () => {
    try {
      const response = await apiClient.get('/purchase-requisitions/procurement/planning');
      return response.data;
    } catch (error) {
      console.error('Get procurement planning data error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch procurement planning data'
      };
    }
  },

  // Generic role-based endpoint
  getRequisitionsByRole: async (params = {}) => {
    try {
      const response = await apiClient.get('/purchase-requisitions/role', { params });
      return response.data;
    } catch (error) {
      console.error('Get requisitions by role error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch requisitions by role'
      };
    }
  },

  // Enhanced Finance Analytics
  getFinanceDashboardStats: async () => {
    try {
      const response = await apiClient.get('/finance/dashboard/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching finance dashboard stats:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch finance dashboard stats'
      };
    }
  },

  getBudgetAllocationReport: async (params = {}) => {
    try {
      const response = await apiClient.get('/finance/budget-allocation-report', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching budget allocation report:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch budget allocation report'
      };
    }
  },

  getSpendingAnalytics: async (period = 'quarterly') => {
    try {
      const response = await apiClient.get('/finance/spending-analytics', {
        params: { period }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching spending analytics:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch spending analytics'
      };
    }
  },

  getFinanceDashboardData: async () => {
    try {
      const response = await apiClient.get('/purchase-requisitions/finance/dashboard-data');
      return response.data;
    } catch (error) {
      console.error('Error fetching finance dashboard data:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch finance dashboard data'
      };
    }
  }
};

export default purchaseRequisitionAPI;


