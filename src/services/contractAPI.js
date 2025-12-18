import api from './api';

class ContractApiService {


  async getAllContracts(params = {}) {
    try {
      const response = await api.get('/contracts', { params });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getContractById(contractId) {
    try {
      const response = await api.get(`/contracts/${contractId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async createContract(contractData, documents = []) {
    try {
      const formData = new FormData();
      
      // Add basic contract data
      Object.keys(contractData).forEach(key => {
        if (contractData[key] !== null && contractData[key] !== undefined) {
          if (typeof contractData[key] === 'object' && !(contractData[key] instanceof File)) {
            formData.append(key, JSON.stringify(contractData[key]));
          } else {
            formData.append(key, contractData[key]);
          }
        }
      });

      // Add contract documents
      if (documents && documents.length > 0) {
        documents.forEach(file => {
          const fileObj = file.originFileObj || file;
          if (fileObj instanceof File) {
            formData.append('contractDocuments', fileObj);
          }
        });
      }

      const response = await api.post('/contracts', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 120000 
      });

      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async updateContract(contractId, contractData, documents = []) {
    try {
      const formData = new FormData();
      
      // Add updated contract data
      Object.keys(contractData).forEach(key => {
        if (contractData[key] !== null && contractData[key] !== undefined) {
          if (typeof contractData[key] === 'object' && !(contractData[key] instanceof File)) {
            formData.append(key, JSON.stringify(contractData[key]));
          } else {
            formData.append(key, contractData[key]);
          }
        }
      });

      // Add new documents if any
      if (documents && documents.length > 0) {
        documents.forEach(file => {
          const fileObj = file.originFileObj || file;
          if (fileObj instanceof File) {
            formData.append('contractDocuments', fileObj);
          }
        });
      }

      const response = await api.put(`/contracts/${contractId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 120000
      });

      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async deleteContract(contractId) {
    try {
      const response = await api.delete(`/contracts/${contractId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async updateContractStatus(contractId, statusData) {
    try {
      const response = await api.put(`/contracts/${contractId}/status`, statusData);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async approveContract(contractId, approvalData = {}) {
    try {
      const response = await api.post(`/contracts/${contractId}/approve`, approvalData);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async terminateContract(contractId, terminationData) {
    try {
      const response = await api.post(`/contracts/${contractId}/terminate`, terminationData);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async suspendContract(contractId, suspensionData) {
    try {
      const response = await api.post(`/contracts/${contractId}/suspend`, suspensionData);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }



  async renewContract(contractId, renewalData) {
    try {
      const response = await api.post(`/contracts/${contractId}/renew`, renewalData);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  

  async createAmendment(contractId, amendmentData, documents = []) {
    try {
      const formData = new FormData();
      
      // Add amendment data
      Object.keys(amendmentData).forEach(key => {
        if (amendmentData[key] !== null && amendmentData[key] !== undefined) {
          if (typeof amendmentData[key] === 'object' && !(amendmentData[key] instanceof File)) {
            formData.append(key, JSON.stringify(amendmentData[key]));
          } else {
            formData.append(key, amendmentData[key]);
          }
        }
      });

      // Add amendment documents
      if (documents && documents.length > 0) {
        documents.forEach(file => {
          const fileObj = file.originFileObj || file;
          if (fileObj instanceof File) {
            formData.append('amendmentDocuments', fileObj);
          }
        });
      }

      const response = await api.post(`/contracts/${contractId}/amendments`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 120000
      });

      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async approveAmendment(contractId, amendmentId, approvalData = {}) {
    try {
      const response = await api.put(`/contracts/${contractId}/amendments/${amendmentId}/approve`, approvalData);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  

  async addMilestone(contractId, milestoneData) {
    try {
      const response = await api.post(`/contracts/${contractId}/milestones`, milestoneData);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async updateMilestone(contractId, milestoneId, milestoneData) {
    try {
      const response = await api.put(`/contracts/${contractId}/milestones/${milestoneId}`, milestoneData);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  

  async addCommunication(contractId, communicationData) {
    try {
      const response = await api.post(`/contracts/${contractId}/communications`, communicationData);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  

  async uploadDocuments(contractId, documents = [], documentType = 'other', description = '') {
    try {
      const formData = new FormData();
      
      formData.append('documentType', documentType);
      formData.append('description', description);

      documents.forEach(file => {
        const fileObj = file.originFileObj || file;
        if (fileObj instanceof File) {
          formData.append('documents', fileObj);
        }
      });

      const response = await api.post(`/contracts/${contractId}/documents`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 120000
      });

      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async downloadDocument(contractId, documentId) {
    try {
      const response = await api.get(`/contracts/${contractId}/documents/${documentId}`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }


  

  async getContractStatistics() {
    try {
      const response = await api.get('/contracts/analytics/statistics');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getExpiringContracts(days = 30) {
    try {
      const response = await api.get('/contracts/analytics/expiring', {
        params: { days }
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getContractsBySupplier(supplierId) {
    try {
      const response = await api.get(`/contracts/analytics/by-supplier/${supplierId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getContractsByDepartment(department) {
    try {
      const response = await api.get(`/contracts/analytics/by-department/${department}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  
  async exportContracts(params = {}) {
    try {
      const response = await api.get('/contracts/export', {
        params,
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  

  async getMyContractNotifications() {
    try {
      const response = await api.get('/contracts/notifications/my-contracts');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async acknowledgeNotification(contractId, notificationId) {
    try {
      const response = await api.put(`/contracts/notifications/${contractId}/${notificationId}/acknowledge`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }


  async bulkUpdateStatus(contractIds, status, reason = '') {
    try {
      const response = await api.put('/contracts/bulk/status', {
        contractIds,
        status,
        reason
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }



  async searchContracts(searchParams) {
    try {
      const response = await api.post('/contracts/search', searchParams);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async advancedSearch(params) {
    try {
      const searchParams = {
        searchTerm: params.search || '',
        filters: {
          status: params.status,
          type: params.type,
          category: params.category,
          department: params.department,
          priority: params.priority,
          dateRange: params.dateRange,
          valueRange: params.valueRange
        },
        sortBy: params.sortBy || 'dates.creationDate',
        sortOrder: params.sortOrder || 'desc',
        page: params.page || 1,
        limit: params.limit || 20
      };

      // Remove undefined/null filters
      Object.keys(searchParams.filters).forEach(key => {
        if (searchParams.filters[key] === undefined || searchParams.filters[key] === null) {
          delete searchParams.filters[key];
        }
      });

      const response = await api.post('/contracts/search', searchParams);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }


  async getDashboardData() {
    try {
      const [stats, expiring, notifications] = await Promise.all([
        this.getContractStatistics(),
        this.getExpiringContracts(30),
        this.getMyContractNotifications()
      ]);

      return {
        statistics: stats.data,
        expiringContracts: expiring.data,
        notifications: notifications.data,
        success: true
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }


  validateContractData(contractData) {
    const errors = {};
    
    // Required fields validation
    const requiredFields = [
      'title',
      'description',
      'type',
      'category',
      'supplierId',
      'totalValue',
      'startDate',
      'endDate',
      'paymentTerms',
      'deliveryTerms'
    ];

    requiredFields.forEach(field => {
      if (!contractData[field] || contractData[field].toString().trim() === '') {
        errors[field] = `${field} is required`;
      }
    });

    // Date validation
    if (contractData.startDate && contractData.endDate) {
      const startDate = new Date(contractData.startDate);
      const endDate = new Date(contractData.endDate);
      
      if (endDate <= startDate) {
        errors.endDate = 'End date must be after start date';
      }
    }

    // Value validation
    if (contractData.totalValue) {
      const value = parseFloat(contractData.totalValue);
      if (isNaN(value) || value <= 0) {
        errors.totalValue = 'Contract value must be a positive number';
      }
    }

    // Title length validation
    if (contractData.title && contractData.title.length > 200) {
      errors.title = 'Title must be less than 200 characters';
    }

    // Description length validation
    if (contractData.description && contractData.description.length > 1000) {
      errors.description = 'Description must be less than 1000 characters';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }

  validateRenewalData(renewalData) {
    const errors = {};

    // Required fields
    if (!renewalData.newEndDate) {
      errors.newEndDate = 'New end date is required';
    }

    if (!renewalData.renewalType) {
      errors.renewalType = 'Renewal type is required';
    }

    // Date validation
    if (renewalData.newEndDate && renewalData.currentEndDate) {
      const newEndDate = new Date(renewalData.newEndDate);
      const currentEndDate = new Date(renewalData.currentEndDate);
      
      if (newEndDate <= currentEndDate) {
        errors.newEndDate = 'New end date must be after current end date';
      }
    }

    // Adjustment validation
    if (renewalData.adjustments && renewalData.adjustments.totalValue) {
      const value = parseFloat(renewalData.adjustments.totalValue);
      if (isNaN(value) || value <= 0) {
        errors.adjustments = 'Adjusted contract value must be a positive number';
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }

  validateAmendmentData(amendmentData) {
    const errors = {};

    // Required fields
    const requiredFields = ['type', 'description', 'effectiveDate'];
    
    requiredFields.forEach(field => {
      if (!amendmentData[field] || amendmentData[field].toString().trim() === '') {
        errors[field] = `${field} is required`;
      }
    });

    // Date validation
    if (amendmentData.effectiveDate) {
      const effectiveDate = new Date(amendmentData.effectiveDate);
      const today = new Date();
      
      if (effectiveDate < today) {
        errors.effectiveDate = 'Effective date cannot be in the past';
      }
    }

    // Financial impact validation
    if (amendmentData.financialImpact && amendmentData.financialImpact.amount) {
      const amount = parseFloat(amendmentData.financialImpact.amount);
      if (isNaN(amount) || amount < 0) {
        errors.financialImpact = 'Financial impact amount must be a positive number';
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }


  getContractStatusLabel(status) {
    const statusLabels = {
      'draft': 'Draft',
      'pending_approval': 'Pending Approval',
      'approved': 'Approved',
      'active': 'Active',
      'expiring_soon': 'Expiring Soon',
      'expired': 'Expired',
      'terminated': 'Terminated',
      'suspended': 'Suspended',
      'renewed': 'Renewed',
      'cancelled': 'Cancelled'
    };
    
    return statusLabels[status] || status;
  }

  getContractTypeLabel(type) {
    const typeLabels = {
      'Supply Agreement': 'Supply Agreement',
      'Service Agreement': 'Service Agreement',
      'Framework Agreement': 'Framework Agreement',
      'Purchase Order': 'Purchase Order',
      'Maintenance Contract': 'Maintenance Contract',
      'Consulting Agreement': 'Consulting Agreement',
      'Lease Agreement': 'Lease Agreement',
      'Other': 'Other'
    };
    
    return typeLabels[type] || type;
  }

  getPriorityColor(priority) {
    const colorMap = {
      'Low': '#52c41a',
      'Medium': '#faad14',
      'High': '#ff4d4f',
      'Critical': '#722ed1'
    };
    
    return colorMap[priority] || '#666';
  }

  getStatusColor(status) {
    const colorMap = {
      'draft': '#666',
      'pending_approval': '#faad14',
      'approved': '#52c41a',
      'active': '#1890ff',
      'expiring_soon': '#fa8c16',
      'expired': '#ff4d4f',
      'terminated': '#ff4d4f',
      'suspended': '#faad14',
      'renewed': '#722ed1',
      'cancelled': '#ff4d4f'
    };
    
    return colorMap[status] || '#666';
  }

  calculateDaysUntilExpiry(endDate) {
    const today = new Date();
    const expiry = new Date(endDate);
    const diffTime = expiry - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  formatCurrency(amount, currency = 'XAF') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  generateContractNumber() {
    const year = new Date().getFullYear();
    const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `CON-${year}-${randomSuffix}`;
  }

  async downloadContractAsBlob(contractId, documentId) {
    try {
      const blob = await this.downloadDocument(contractId, documentId);
      return blob;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  downloadBlobAsFile(blob, filename) {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  async exportAndDownload(params = {}, filename = null) {
    try {
      const blob = await this.exportContracts(params);
      const defaultFilename = `contracts-export-${new Date().toISOString().split('T')[0]}.xlsx`;
      this.downloadBlobAsFile(blob, filename || defaultFilename);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  handleError(error) {
    if (error.response) {
      const { status, data } = error.response;
      
      switch (status) {
        case 401:
          localStorage.removeItem('token');
          window.location.href = '/login';
          throw new Error('Session expired. Please log in again.');
        
        case 403:
          throw new Error(data.message || 'Access denied. Insufficient permissions.');
        
        case 404:
          throw new Error(data.message || 'Contract not found.');
        
        case 409:
          throw new Error(data.message || 'Conflict: Contract already exists or is in use.');
        
        case 422:
          if (data.errors) {
            const errorMessages = Object.values(data.errors).flat().join(', ');
            throw new Error(errorMessages);
          }
          throw new Error(data.message || 'Validation error.');
        
        case 429:
          throw new Error('Too many requests. Please try again later.');
        
        case 500:
          throw new Error('Server error. Please try again later or contact support.');
        
        default:
          throw new Error(data.message || `Request failed with status ${status}`);
      }
    } else if (error.request) {
      throw new Error('Network error. Please check your connection and try again.');
    } else {
      throw new Error(error.message || 'An unexpected error occurred.');
    }
  }
}

// Export singleton instance
const contractApiService = new ContractApiService();
export default contractApiService;