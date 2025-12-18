import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

class UnifiedSupplierAPI {
  constructor() {
    // Create axios instance with interceptors
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Request interceptor - add auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor - centralized error handling
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        const message = error.response?.data?.message || error.message || 'An error occurred';
        console.error('API Error:', message);
        
        // Auto logout on 401
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          window.location.href = '/login';
        }
        
        return Promise.reject(new Error(message));
      }
    );
  }

  // ===============================
  // SUPPLIER OPERATIONS
  // ===============================

  async registerAndOnboard(formData) {
    try {
      const config = {
        headers: { 'Content-Type': 'multipart/form-data' }
      };
      const response = await this.api.post('/suppliers/register-onboard', formData, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async getCompleteProfile(supplierId) {
    try {
      const response = await this.api.get(`/suppliers/${supplierId}/complete-profile`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async updateProfile(supplierId, profileData) {
    try {
      const response = await this.api.put(`/suppliers/${supplierId}/profile`, profileData);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async getAllSuppliers(params = {}) {
    try {
      const response = await this.api.get('/suppliers/admin/all', { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async bulkImport(suppliers) {
    try {
      const response = await this.api.post('/suppliers/bulk-import', { suppliers });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async approveOrReject(supplierId, action, comments) {
    try {
      const response = await this.api.post(`/suppliers/${supplierId}/approve-reject`, {
        action,
        comments
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async updateSupplierStatus(supplierId, statusData) {
    try {
      const response = await this.api.put(`/suppliers/admin/${supplierId}/status`, statusData);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async getSupplierDashboard() {
    try {
      const response = await this.api.get('/suppliers/dashboard');
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async verifyEmail(token) {
    try {
      const response = await this.api.get(`/suppliers/verify-email/${token}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async login(credentials) {
    try {
      const response = await this.api.post('/suppliers/login', credentials);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // ===============================
  // SUPPLIER APPROVAL WORKFLOW
  // ===============================

  async getPendingApprovals() {
    try {
      const response = await this.api.get('/suppliers/admin/approvals/pending');
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async getSupplierApprovalDetails(supplierId) {
    try {
      const response = await this.api.get(`/suppliers/admin/approvals/${supplierId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async processApproval(supplierId, data) {
    try {
      const response = await this.api.post(`/suppliers/admin/approvals/${supplierId}/decision`, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async getApprovalStatistics() {
    try {
      const response = await this.api.get('/suppliers/admin/approvals/statistics');
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async getApprovalTimeline(supplierId) {
    try {
      const response = await this.api.get(`/suppliers/admin/approvals/${supplierId}/timeline`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async bulkProcessApprovals(data) {
    try {
      const response = await this.api.post('/suppliers/admin/approvals/bulk-process', data);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async getApprovalDashboard() {
    try {
      const response = await this.api.get('/suppliers/admin/approvals/dashboard');
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // ===============================
  // SUPPLIER INVOICES
  // ===============================

  async submitInvoice(formData) {
    try {
      const config = {
        headers: { 'Content-Type': 'multipart/form-data' }
      };
      const response = await this.api.post('/suppliers/invoices', formData, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async getSupplierInvoices(params = {}) {
    try {
      const response = await this.api.get('/suppliers/invoices', { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async getInvoiceDetails(invoiceId) {
    try {
      const response = await this.api.get(`/suppliers/invoices/${invoiceId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async getInvoicesForFinance(params = {}) {
    try {
      const response = await this.api.get('/suppliers/admin/invoices', { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // ===============================
  // SUPPLIER RFQ & QUOTES
  // ===============================

  async getSupplierRfqRequests(params = {}) {
    try {
      const response = await this.api.get('/suppliers/rfq-requests', { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async getRfqDetails(rfqId) {
    try {
      const response = await this.api.get(`/suppliers/rfq-requests/${rfqId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async submitQuote(rfqId, formData) {
    try {
      const config = {
        headers: { 'Content-Type': 'multipart/form-data' }
      };
      const response = await this.api.post(`/suppliers/rfq-requests/${rfqId}/submit-quote`, formData, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async getSupplierQuotes(params = {}) {
    try {
      const response = await this.api.get('/suppliers/quotes', { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // ===============================
  // CONTRACT OPERATIONS
  // ===============================

  async createContract(contractData, files = null) {
    try {
      let payload;
      let config = {};

      if (files && files.length > 0) {
        const formData = new FormData();
        
        Object.keys(contractData).forEach(key => {
          if (contractData[key] !== undefined && contractData[key] !== null) {
            if (typeof contractData[key] === 'object' && !Array.isArray(contractData[key])) {
              formData.append(key, JSON.stringify(contractData[key]));
            } else {
              formData.append(key, contractData[key]);
            }
          }
        });

        files.forEach(file => {
          formData.append('contractDocuments', file.originFileObj || file);
        });

        payload = formData;
        config.headers = { 'Content-Type': 'multipart/form-data' };
      } else {
        payload = contractData;
      }

      const response = await this.api.post('/suppliers/contracts', payload, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async getSupplierContracts(supplierId, filters = {}) {
    try {
      const response = await this.api.get(`/suppliers/${supplierId}/contracts`, {
        params: filters
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async getAllContracts(params = {}) {
    try {
      const response = await this.api.get('/contracts/admin/all', { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async getContractById(contractId) {
    try {
      const response = await this.api.get(`/contracts/${contractId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async updateContract(contractId, contractData, files = null) {
    try {
      let payload;
      let config = {};

      if (files && files.length > 0) {
        const formData = new FormData();
        
        Object.keys(contractData).forEach(key => {
          if (contractData[key] !== undefined && contractData[key] !== null) {
            if (typeof contractData[key] === 'object' && !Array.isArray(contractData[key])) {
              formData.append(key, JSON.stringify(contractData[key]));
            } else {
              formData.append(key, contractData[key]);
            }
          }
        });

        files.forEach(file => {
          formData.append('contractDocuments', file.originFileObj || file);
        });

        payload = formData;
        config.headers = { 'Content-Type': 'multipart/form-data' };
      } else {
        payload = contractData;
      }

      const response = await this.api.put(`/contracts/${contractId}`, payload, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async renewContract(contractId, renewalData) {
    try {
      const response = await this.api.post(`/contracts/${contractId}/renew`, renewalData);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async createAmendment(contractId, amendmentData, files = null) {
    try {
      let payload;
      let config = {};

      if (files && files.length > 0) {
        const formData = new FormData();
        
        Object.keys(amendmentData).forEach(key => {
          if (amendmentData[key] !== undefined && amendmentData[key] !== null) {
            formData.append(key, typeof amendmentData[key] === 'object' 
              ? JSON.stringify(amendmentData[key]) 
              : amendmentData[key]
            );
          }
        });

        files.forEach(file => {
          formData.append('amendmentDocuments', file.originFileObj || file);
        });

        payload = formData;
        config.headers = { 'Content-Type': 'multipart/form-data' };
      } else {
        payload = amendmentData;
      }

      const response = await this.api.post(`/contracts/${contractId}/amendments`, payload, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async addMilestone(contractId, milestoneData) {
    try {
      const response = await this.api.post(`/contracts/${contractId}/milestones`, milestoneData);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async updateContractStatus(contractId, statusData) {
    try {
      const response = await this.api.put(`/contracts/${contractId}/status`, statusData);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async deleteContract(contractId) {
    try {
      const response = await this.api.delete(`/contracts/${contractId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async getContractStatistics() {
    try {
      const response = await this.api.get('/contracts/statistics');
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async getExpiringContracts(days = 30) {
    try {
      const response = await this.api.get('/contracts/expiring', {
        params: { days }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async exportContracts(filters = {}) {
    try {
      const response = await this.api.get('/contracts/export', {
        params: { ...filters, format: 'excel' },
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // ===============================
  // CONTRACT-INVOICE LINKING
  // ===============================

  async linkInvoiceToContract(contractId, invoiceId) {
    try {
      const response = await this.api.post(
        `/suppliers/contracts/${contractId}/link-invoice`,
        { invoiceId }
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async unlinkInvoiceFromContract(contractId, invoiceId) {
    try {
      const response = await this.api.delete(
        `/suppliers/contracts/${contractId}/invoices/${invoiceId}`
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async getContractWithInvoices(contractId) {
    try {
      const response = await this.api.get(
        `/suppliers/contracts/${contractId}/with-invoices`
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // ===============================
  // ONBOARDING OPERATIONS
  // ===============================

  async getAllOnboardingApplications(params = {}) {
    try {
      const response = await this.api.get('/suppliers/admin/onboarding/applications', {
        params
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async getOnboardingApplicationById(applicationId) {
    try {
      const response = await this.api.get(
        `/suppliers/admin/onboarding/applications/${applicationId}`
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async updateApplicationStatus(applicationId, statusData) {
    try {
      const response = await this.api.put(
        `/suppliers/admin/onboarding/applications/${applicationId}/status`,
        statusData
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // ===============================
  // UTILITY METHODS
  // ===============================

  formatCurrency(amount, currency = 'XAF') {
    return `${currency} ${amount.toLocaleString()}`;
  }

  calculateDaysUntilExpiry(endDate) {
    const today = new Date();
    const end = new Date(endDate);
    const diffTime = end - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  getContractStatusLabel(status) {
    const labels = {
      draft: 'Draft',
      pending_approval: 'Pending Approval',
      active: 'Active',
      expiring_soon: 'Expiring Soon',
      expired: 'Expired',
      terminated: 'Terminated',
      renewed: 'Renewed',
      suspended: 'Suspended'
    };
    return labels[status] || status;
  }

  validateContractData(data) {
    const errors = {};

    if (!data.supplierId) errors.supplierId = 'Supplier is required';
    if (!data.title) errors.title = 'Title is required';
    if (!data.type) errors.type = 'Contract type is required';
    if (!data.category) errors.category = 'Category is required';
    if (!data.startDate) errors.startDate = 'Start date is required';
    if (!data.endDate) errors.endDate = 'End date is required';
    if (!data.totalValue || data.totalValue <= 0) errors.totalValue = 'Valid contract value is required';

    if (data.startDate && data.endDate) {
      if (new Date(data.startDate) >= new Date(data.endDate)) {
        errors.endDate = 'End date must be after start date';
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }

  validateRenewalData(data) {
    const errors = {};

    if (!data.newEndDate) errors.newEndDate = 'New end date is required';
    if (!data.renewalType) errors.renewalType = 'Renewal type is required';

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }

  validateAmendmentData(data) {
    const errors = {};

    if (!data.type) errors.type = 'Amendment type is required';
    if (!data.description) errors.description = 'Description is required';
    if (!data.effectiveDate) errors.effectiveDate = 'Effective date is required';

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }

  async exportAndDownload(filters = {}) {
    try {
      const blob = await this.exportContracts(filters);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `contracts-export-${Date.now()}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      throw error;
    }
  }
}

export default new UnifiedSupplierAPI();












// import axios from 'axios';

// const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

// class UnifiedSupplierAPI {
//   constructor() {
//     // Create axios instance with interceptors
//     this.api = axios.create({
//       baseURL: API_BASE_URL,
//       headers: {
//         'Content-Type': 'application/json'
//       }
//     });

//     // Request interceptor - add auth token
//     this.api.interceptors.request.use(
//       (config) => {
//         const token = localStorage.getItem('token');
//         if (token) {
//           config.headers.Authorization = `Bearer ${token}`;
//         }
//         return config;
//       },
//       (error) => Promise.reject(error)
//     );

//     // Response interceptor - centralized error handling
//     this.api.interceptors.response.use(
//       (response) => response,
//       (error) => {
//         const message = error.response?.data?.message || error.message || 'An error occurred';
//         console.error('API Error:', message);
//         return Promise.reject(new Error(message));
//       }
//     );
//   }

//   // ===============================
//   // SUPPLIER OPERATIONS
//   // ===============================

//   async registerAndOnboard(formData) {
//     try {
//       const config = {
//         headers: { 'Content-Type': 'multipart/form-data' }
//       };
//       const response = await this.api.post('/suppliers/register-onboard', formData, config);
//       return response.data;
//     } catch (error) {
//       throw error;
//     }
//   }

//   async getCompleteProfile(supplierId) {
//     try {
//       const response = await this.api.get(`/suppliers/${supplierId}/complete-profile`);
//       return response.data;
//     } catch (error) {
//       throw error;
//     }
//   }

//   async updateProfile(supplierId, profileData) {
//     try {
//       const response = await this.api.put(`/suppliers/${supplierId}/profile`, profileData);
//       return response.data;
//     } catch (error) {
//       throw error;
//     }
//   }

//   async getAllSuppliers(params = {}) {
//     try {
//       const response = await this.api.get('/suppliers/admin/all', { params });
//       return response.data;
//     } catch (error) {
//       throw error;
//     }
//   }

//   async bulkImport(suppliers) {
//     try {
//       const response = await this.api.post('/suppliers/bulk-import', { suppliers });
//       return response.data;
//     } catch (error) {
//       throw error;
//     }
//   }

//   async approveOrReject(supplierId, action, comments) {
//     try {
//       const response = await this.api.post(`/suppliers/${supplierId}/approve-reject`, {
//         action,
//         comments
//       });
//       return response.data;
//     } catch (error) {
//       throw error;
//     }
//   }

//   async updateSupplierStatus(supplierId, statusData) {
//     try {
//       const response = await this.api.put(`/suppliers/admin/${supplierId}/status`, statusData);
//       return response.data;
//     } catch (error) {
//       throw error;
//     }
//   }

//   async getSupplierDashboard() {
//     try {
//       const response = await this.api.get('/suppliers/dashboard');
//       return response.data;
//     } catch (error) {
//       throw error;
//     }
//   }

//   // ===============================
//   // CONTRACT OPERATIONS
//   // ===============================

//   async createContract(contractData, files = null) {
//     try {
//       let payload;
//       let config = {};

//       if (files && files.length > 0) {
//         // If files are provided, use FormData
//         const formData = new FormData();
        
//         // Append all contract data
//         Object.keys(contractData).forEach(key => {
//           if (contractData[key] !== undefined && contractData[key] !== null) {
//             if (typeof contractData[key] === 'object' && !Array.isArray(contractData[key])) {
//               formData.append(key, JSON.stringify(contractData[key]));
//             } else {
//               formData.append(key, contractData[key]);
//             }
//           }
//         });

//         // Append files
//         files.forEach(file => {
//           formData.append('contractDocuments', file.originFileObj || file);
//         });

//         payload = formData;
//         config.headers = { 'Content-Type': 'multipart/form-data' };
//       } else {
//         // No files, send JSON
//         payload = contractData;
//       }

//       const response = await this.api.post('/suppliers/contracts', payload, config);
//       return response.data;
//     } catch (error) {
//       throw error;
//     }
//   }

//   async getSupplierContracts(supplierId, filters = {}) {
//     try {
//       const response = await this.api.get(`/suppliers/${supplierId}/contracts`, {
//         params: filters
//       });
//       return response.data;
//     } catch (error) {
//       throw error;
//     }
//   }

//   async getAllContracts(params = {}) {
//     try {
//       const response = await this.api.get('/contracts/admin/all', { params });
//       return response.data;
//     } catch (error) {
//       throw error;
//     }
//   }

//   async getContractById(contractId) {
//     try {
//       const response = await this.api.get(`/contracts/${contractId}`);
//       return response.data;
//     } catch (error) {
//       throw error;
//     }
//   }

//   async updateContract(contractId, contractData, files = null) {
//     try {
//       let payload;
//       let config = {};

//       if (files && files.length > 0) {
//         const formData = new FormData();
        
//         Object.keys(contractData).forEach(key => {
//           if (contractData[key] !== undefined && contractData[key] !== null) {
//             if (typeof contractData[key] === 'object' && !Array.isArray(contractData[key])) {
//               formData.append(key, JSON.stringify(contractData[key]));
//             } else {
//               formData.append(key, contractData[key]);
//             }
//           }
//         });

//         files.forEach(file => {
//           formData.append('contractDocuments', file.originFileObj || file);
//         });

//         payload = formData;
//         config.headers = { 'Content-Type': 'multipart/form-data' };
//       } else {
//         payload = contractData;
//       }

//       const response = await this.api.put(`/contracts/${contractId}`, payload, config);
//       return response.data;
//     } catch (error) {
//       throw error;
//     }
//   }

//   async renewContract(contractId, renewalData) {
//     try {
//       const response = await this.api.post(`/contracts/${contractId}/renew`, renewalData);
//       return response.data;
//     } catch (error) {
//       throw error;
//     }
//   }

//   async createAmendment(contractId, amendmentData, files = null) {
//     try {
//       let payload;
//       let config = {};

//       if (files && files.length > 0) {
//         const formData = new FormData();
        
//         Object.keys(amendmentData).forEach(key => {
//           if (amendmentData[key] !== undefined && amendmentData[key] !== null) {
//             formData.append(key, typeof amendmentData[key] === 'object' 
//               ? JSON.stringify(amendmentData[key]) 
//               : amendmentData[key]
//             );
//           }
//         });

//         files.forEach(file => {
//           formData.append('amendmentDocuments', file.originFileObj || file);
//         });

//         payload = formData;
//         config.headers = { 'Content-Type': 'multipart/form-data' };
//       } else {
//         payload = amendmentData;
//       }

//       const response = await this.api.post(`/contracts/${contractId}/amendments`, payload, config);
//       return response.data;
//     } catch (error) {
//       throw error;
//     }
//   }

//   async addMilestone(contractId, milestoneData) {
//     try {
//       const response = await this.api.post(`/contracts/${contractId}/milestones`, milestoneData);
//       return response.data;
//     } catch (error) {
//       throw error;
//     }
//   }

//   async updateContractStatus(contractId, statusData) {
//     try {
//       const response = await this.api.put(`/contracts/${contractId}/status`, statusData);
//       return response.data;
//     } catch (error) {
//       throw error;
//     }
//   }

//   async deleteContract(contractId) {
//     try {
//       const response = await this.api.delete(`/contracts/${contractId}`);
//       return response.data;
//     } catch (error) {
//       throw error;
//     }
//   }

//   async getContractStatistics() {
//     try {
//       const response = await this.api.get('/contracts/statistics');
//       return response.data;
//     } catch (error) {
//       throw error;
//     }
//   }

//   async getExpiringContracts(days = 30) {
//     try {
//       const response = await this.api.get('/contracts/expiring', {
//         params: { days }
//       });
//       return response.data;
//     } catch (error) {
//       throw error;
//     }
//   }

//   async exportContracts(filters = {}) {
//     try {
//       const response = await this.api.get('/contracts/export', {
//         params: { ...filters, format: 'excel' },
//         responseType: 'blob'
//       });
//       return response.data;
//     } catch (error) {
//       throw error;
//     }
//   }

//   // ===============================
//   // CONTRACT-INVOICE LINKING
//   // ===============================

//   async linkInvoiceToContract(contractId, invoiceId) {
//     try {
//       const response = await this.api.post(
//         `/suppliers/contracts/${contractId}/link-invoice`,
//         { invoiceId }
//       );
//       return response.data;
//     } catch (error) {
//       throw error;
//     }
//   }

//   async unlinkInvoiceFromContract(contractId, invoiceId) {
//     try {
//       const response = await this.api.delete(
//         `/suppliers/contracts/${contractId}/invoices/${invoiceId}`
//       );
//       return response.data;
//     } catch (error) {
//       throw error;
//     }
//   }

//   async getContractWithInvoices(contractId) {
//     try {
//       const response = await this.api.get(
//         `/suppliers/contracts/${contractId}/with-invoices`
//       );
//       return response.data;
//     } catch (error) {
//       throw error;
//     }
//   }

//   // ===============================
//   // ONBOARDING OPERATIONS
//   // ===============================

//   async getAllOnboardingApplications(params = {}) {
//     try {
//       const response = await this.api.get('/suppliers/admin/onboarding/applications', {
//         params
//       });
//       return response.data;
//     } catch (error) {
//       throw error;
//     }
//   }

//   async getOnboardingApplicationById(applicationId) {
//     try {
//       const response = await this.api.get(
//         `/suppliers/admin/onboarding/applications/${applicationId}`
//       );
//       return response.data;
//     } catch (error) {
//       throw error;
//     }
//   }

//   async updateApplicationStatus(applicationId, statusData) {
//     try {
//       const response = await this.api.put(
//         `
//         /suppliers/admin/onboarding/applications/${applicationId}/status`,
//         statusData
//       );
//       return response.data;
//     } catch (error) {
//       throw error;
//     }
//   }

//   // ===============================
//   // UTILITY METHODS
//   // ===============================

//   formatCurrency(amount, currency = 'XAF') {
//     return `${currency} ${amount.toLocaleString()}`;
//   }

//   calculateDaysUntilExpiry(endDate) {
//     const today = new Date();
//     const end = new Date(endDate);
//     const diffTime = end - today;
//     return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
//   }

//   getContractStatusLabel(status) {
//     const labels = {
//       draft: 'Draft',
//       pending_approval: 'Pending Approval',
//       active: 'Active',
//       expiring_soon: 'Expiring Soon',
//       expired: 'Expired',
//       terminated: 'Terminated',
//       renewed: 'Renewed',
//       suspended: 'Suspended'
//     };
//     return labels[status] || status;
//   }

//   validateContractData(data) {
//     const errors = {};

//     if (!data.supplierId) errors.supplierId = 'Supplier is required';
//     if (!data.title) errors.title = 'Title is required';
//     if (!data.type) errors.type = 'Contract type is required';
//     if (!data.category) errors.category = 'Category is required';
//     if (!data.startDate) errors.startDate = 'Start date is required';
//     if (!data.endDate) errors.endDate = 'End date is required';
//     if (!data.totalValue || data.totalValue <= 0) errors.totalValue = 'Valid contract value is required';

//     if (data.startDate && data.endDate) {
//       if (new Date(data.startDate) >= new Date(data.endDate)) {
//         errors.endDate = 'End date must be after start date';
//       }
//     }

//     return {
//       isValid: Object.keys(errors).length === 0,
//       errors
//     };
//   }

//   validateRenewalData(data) {
//     const errors = {};

//     if (!data.newEndDate) errors.newEndDate = 'New end date is required';
//     if (!data.renewalType) errors.renewalType = 'Renewal type is required';

//     return {
//       isValid: Object.keys(errors).length === 0,
//       errors
//     };
//   }

//   validateAmendmentData(data) {
//     const errors = {};

//     if (!data.type) errors.type = 'Amendment type is required';
//     if (!data.description) errors.description = 'Description is required';
//     if (!data.effectiveDate) errors.effectiveDate = 'Effective date is required';

//     return {
//       isValid: Object.keys(errors).length === 0,
//       errors
//     };
//   }

//   async exportAndDownload(filters = {}) {
//     try {
//       const blob = await this.exportContracts(filters);
//       const url = window.URL.createObjectURL(blob);
//       const link = document.createElement('a');
//       link.href = url;
//       link.download = `contracts-export-${Date.now()}.xlsx`;
//       document.body.appendChild(link);
//       link.click();
//       document.body.removeChild(link);
//       window.URL.revokeObjectURL(url);
//     } catch (error) {
//       throw error;
//     }
//   }
// }

// export default new UnifiedSupplierAPI();