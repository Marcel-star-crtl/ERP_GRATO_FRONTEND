import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
const FILE_BASE_URL = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5001';

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
        return Promise.reject(new Error(message));
      }
    );
  }

  // ===============================
  // FILE DOWNLOAD HELPER
  // ===============================

  /**
   * Download or view supplier document
   * @param {object|string} fileData - File metadata object or URL string
   * @param {boolean} download - If true, download; if false, open in new tab
   */
  async handleSupplierDocument(fileData, download = false) {
    try {
      if (!fileData) {
        throw new Error('No file data provided');
      }

      console.log('🔍 Processing file data:', JSON.stringify(fileData, null, 2));

      // Extract URL from file metadata
      let fileUrl;
      let fileName = 'document';
      
      if (typeof fileData === 'string') {
        // It's already a URL or publicId/filename
        if (fileData.startsWith('http')) {
          fileUrl = fileData;
          fileName = fileData.split('/').pop();
        } else if (fileData.startsWith('/uploads/')) {
          fileUrl = `${FILE_BASE_URL}${fileData}`;
          fileName = fileData.split('/').pop();
        } else if (fileData.startsWith('/')) {
          fileUrl = `${FILE_BASE_URL}${fileData}`;
          fileName = fileData.split('/').pop();
        } else {
          // It's just a filename - need to find it
          // The file could be anywhere in /uploads/
          // Since we don't know the exact path, we'll have to guess based on naming
          if (fileData.startsWith('supplier_doc_')) {
            // Try supplier-documents first
            fileUrl = `${FILE_BASE_URL}/uploads/supplier-documents/${fileData}`;
          } else {
            // Try generic uploads
            fileUrl = `${FILE_BASE_URL}/uploads/${fileData}`;
          }
          fileName = fileData;
        }
      } else if (fileData.url) {
        // File metadata object with URL - THIS IS THE PREFERRED FORMAT
        // The URL should already be the correct relative path
        if (fileData.url.startsWith('http')) {
          fileUrl = fileData.url;
        } else if (fileData.url.startsWith('/uploads/')) {
          // Perfect! It's already a relative path from root
          fileUrl = `${FILE_BASE_URL}${fileData.url}`;
        } else if (fileData.url.startsWith('/')) {
          fileUrl = `${FILE_BASE_URL}${fileData.url}`;
        } else {
          // Relative path without leading slash
          fileUrl = `${FILE_BASE_URL}/${fileData.url}`;
        }
        fileName = fileData.originalName || fileData.name || fileData.url.split('/').pop();
      } else if (fileData.publicId || fileData.localPath) {
        // Try to construct URL from publicId or localPath
        let relativePath = null;
        
        if (fileData.localPath) {
          // Extract everything after 'uploads'
          // Handle both Windows and Unix paths
          const normalizedPath = fileData.localPath.replace(/\\/g, '/');
          const uploadsIndex = normalizedPath.lastIndexOf('uploads/');
          
          if (uploadsIndex !== -1) {
            relativePath = '/' + normalizedPath.substring(uploadsIndex);
          }
        }
        
        if (relativePath) {
          fileUrl = `${FILE_BASE_URL}${relativePath}`;
        } else if (fileData.publicId) {
          // Fallback to publicId
          if (fileData.publicId.startsWith('supplier_doc_')) {
            fileUrl = `${FILE_BASE_URL}/uploads/supplier-documents/${fileData.publicId}`;
          } else {
            fileUrl = `${FILE_BASE_URL}/uploads/${fileData.publicId}`;
          }
        }
        
        fileName = fileData.originalName || fileData.name || fileData.publicId || 'document';
      } else {
        throw new Error('Invalid file data format - no url, publicId, or localPath found');
      }

      // Clean up the file URL (remove double slashes except after http:)
      fileUrl = fileUrl.replace(/([^:]\/)\/+/g, '$1');

      console.log('📄 Final file URL:', fileUrl);
      console.log('📝 File name:', fileName);

      if (download) {
        // Download file
        try {
          const response = await fetch(fileUrl, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });

          if (!response.ok) {
            console.error(`❌ Download failed: HTTP ${response.status}`);
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = fileName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
          
          console.log('✅ File downloaded successfully');
          return { success: true, message: 'File downloaded successfully' };
        } catch (fetchError) {
          console.error('❌ Fetch error:', fetchError);
          console.log('⚠️ Attempting fallback: opening in new tab');
          // Fallback: try opening in new tab
          window.open(fileUrl, '_blank');
          return { success: true, message: 'File opened in new tab (download failed)' };
        }
      } else {
        // Open in new tab
        console.log('📂 Opening file in new tab');
        window.open(fileUrl, '_blank');
        return { success: true, message: 'File opened in new tab' };
      }
    } catch (error) {
      console.error('❌ Error handling file:', error);
      throw error;
    }
  }

  /**
   * View file inline
   */
  async viewFile(fileData) {
    return this.handleSupplierDocument(fileData, false);
  }

  /**
   * Download file
   */
  async downloadFile(fileData, fileName) {
    return this.handleSupplierDocument(fileData, true);
  }

  /**
   * Get file URL for viewing
   * @param {string|object} fileData - File publicId or file object
   * @returns {string} URL for viewing file
   */
  getFileViewUrl(fileData) {
    if (!fileData) return null;
    
    const publicId = typeof fileData === 'string' ? fileData : fileData.publicId;
    if (!publicId) return null;

    // For supplier documents, use public route
    if (publicId.startsWith('supplier_doc_')) {
      return `${API_BASE_URL.replace('/api', '')}/api/files/supplier-document-view/${publicId}`;
    }

    // For images, use image route
    const ext = publicId.split('.').pop().toLowerCase();
    if (['png', 'jpg', 'jpeg', 'gif', 'svg'].includes(ext)) {
      return `${API_BASE_URL.replace('/api', '')}/api/files/image/${publicId}`;
    }

    // For other files, use view route
    return `${API_BASE_URL.replace('/api', '')}/api/files/view/${publicId}`;
  }

  /**
   * Get file URL for downloading
   * @param {string|object} fileData - File publicId or file object
   * @returns {string} URL for downloading file
   */
  getFileDownloadUrl(fileData) {
    if (!fileData) return null;
    
    const publicId = typeof fileData === 'string' ? fileData : fileData.publicId;
    if (!publicId) return null;

    // For supplier documents, use public download route
    if (publicId.startsWith('supplier_doc_')) {
      return `${API_BASE_URL.replace('/api', '')}/api/files/supplier-document/${publicId}`;
    }

    // For other files, use authenticated download route
    return `${API_BASE_URL.replace('/api', '')}/api/files/download/${publicId}`;
  }

  // ===============================
  // SUPPLIER APPROVAL WORKFLOW
  // ===============================

  /**
   * Get suppliers pending approval for current user
   */
  async getPendingApprovals() {
    try {
      const response = await this.api.get('/suppliers/admin/approvals/pending');
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get single supplier with approval details
   */
  async getSupplierApprovalDetails(supplierId) {
    try {
      const response = await this.api.get(`/suppliers/admin/approvals/${supplierId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Process supplier approval/rejection
   * @param {string} supplierId - Supplier ID
   * @param {object} data - { decision: 'approved' | 'rejected', comments: string }
   */
  async processApproval(supplierId, data) {
    try {
      const response = await this.api.post(`/suppliers/admin/approvals/${supplierId}/decision`, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get approval statistics
   */
  async getApprovalStatistics() {
    try {
      const response = await this.api.get('/suppliers/admin/approvals/statistics');
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get supplier approval timeline
   */
  async getApprovalTimeline(supplierId) {
    try {
      const response = await this.api.get(`/suppliers/admin/approvals/${supplierId}/timeline`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Bulk process supplier approvals
   * @param {object} data - { supplierIds: string[], decision: 'approved' | 'rejected', comments: string }
   */
  async bulkProcessApprovals(data) {
    try {
      const response = await this.api.post('/suppliers/admin/approvals/bulk-process', data);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get approval dashboard data
   */
  async getApprovalDashboard() {
    try {
      const response = await this.api.get('/suppliers/admin/approvals/dashboard');
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // ===============================
  // SUPPLIER OPERATIONS
  // ===============================

  /**
   * Register and onboard supplier (unified process)
   */
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

  /**
   * Submit onboarding application (alias for registerAndOnboard for compatibility)
   */
  async submitOnboarding(formData) {
    return this.registerAndOnboard(formData);
  }

  /**
   * Get complete supplier profile
   */
  async getCompleteProfile(supplierId) {
    try {
      const response = await this.api.get(`/suppliers/${supplierId}/complete-profile`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update supplier profile
   */
  async updateProfile(supplierId, profileData) {
    try {
      const response = await this.api.put(`/suppliers/${supplierId}/profile`, profileData);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get all suppliers with filters
   */
  async getAllSuppliers(params = {}) {
    try {
      const response = await this.api.get('/suppliers/admin/all', { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Bulk import suppliers
   */
  async bulkImport(suppliers) {
    try {
      const response = await this.api.post('/suppliers/bulk-import', { suppliers });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Approve or reject supplier (legacy - use processApproval instead)
   * @deprecated Use processApproval instead
   */
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

  /**
   * Update supplier status
   */
  async updateSupplierStatus(supplierId, statusData) {
    try {
      const response = await this.api.put(`/suppliers/admin/${supplierId}/status`, statusData);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get supplier dashboard (for logged-in suppliers)
   */
  async getSupplierDashboard() {
    try {
      const response = await this.api.get('/suppliers/dashboard');
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Verify supplier email
   */
  async verifyEmail(token) {
    try {
      const response = await this.api.get(`/suppliers/verify-email/${token}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Supplier login
   */
  async login(credentials) {
    try {
      const response = await this.api.post('/suppliers/login', credentials);
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

  async addReviewNote(applicationId, noteData) {
    try {
      const response = await this.api.post(
        `/suppliers/admin/onboarding/applications/${applicationId}/notes`,
        noteData
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async uploadAdditionalDocuments(applicationId, formData) {
    try {
      const config = {
        headers: { 'Content-Type': 'multipart/form-data' }
      };
      const response = await this.api.post(
        `/suppliers/admin/onboarding/applications/${applicationId}/documents`,
        formData,
        config
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async downloadDocument(applicationId, documentId) {
    try {
      const response = await this.api.get(
        `/suppliers/admin/onboarding/applications/${applicationId}/documents/${documentId}`,
        { responseType: 'blob' }
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async getOnboardingStatistics() {
    try {
      const response = await this.api.get('/suppliers/admin/onboarding/statistics');
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async bulkUpdateApplications(data) {
    try {
      const response = await this.api.put('/suppliers/admin/onboarding/applications/bulk-update', data);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async exportApplications(filters = {}) {
    try {
      const response = await this.api.get('/suppliers/admin/onboarding/export', {
        params: filters,
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // ===============================
  // SUPPLIER INVOICES
  // ===============================

  /**
   * Submit supplier invoice
   */
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

  /**
   * Get supplier invoices
   */
  async getSupplierInvoices(params = {}) {
    try {
      const response = await this.api.get('/suppliers/invoices', { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get invoice details
   */
  async getInvoiceDetails(invoiceId) {
    try {
      const response = await this.api.get(`/suppliers/invoices/${invoiceId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get invoices for finance (admin)
   */
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

  /**
   * Get RFQ requests for supplier
   */
  async getSupplierRfqRequests(params = {}) {
    try {
      const response = await this.api.get('/suppliers/rfq-requests', { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get RFQ details
   */
  async getRfqDetails(rfqId) {
    try {
      const response = await this.api.get(`/suppliers/rfq-requests/${rfqId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Submit quote for RFQ
   */
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

  /**
   * Get supplier quotes
   */
  async getSupplierQuotes(params = {}) {
    try {
      const response = await this.api.get('/suppliers/quotes', { params });
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

  getSupplierStatusLabel(status) {
    const labels = {
      pending: 'Pending Review',
      pending_supply_chain: 'Pending Supply Chain',
      pending_head_of_business: 'Pending Executive',
      pending_finance: 'Pending Finance',
      approved: 'Approved',
      rejected: 'Rejected',
      suspended: 'Suspended',
      inactive: 'Inactive'
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

  validateSupplierData(data) {
    const errors = {};

    if (!data.companyName) errors.companyName = 'Company name is required';
    if (!data.contactName) errors.contactName = 'Contact person is required';
    if (!data.email) errors.email = 'Email is required';
    if (!data.phoneNumber) errors.phoneNumber = 'Phone number is required';
    if (!data.supplierType) errors.supplierType = 'Supplier type is required';

    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.email = 'Valid email is required';
    }

    return {
      isValid: Object.keys(errors).length === 0,errors
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

  async exportApplicationsAndDownload(filters = {}) {
    try {
      const blob = await this.exportApplications(filters);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `supplier-applications-${Date.now()}.xlsx`;
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
// const FILE_BASE_URL = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5001';

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
//   // FILE DOWNLOAD HELPER
//   // ===============================

//   /**
//    * Download or view supplier document
//    * @param {object|string} fileData - File metadata object or URL string
//    * @param {boolean} download - If true, download; if false, open in new tab
//    */
//   async handleSupplierDocument(fileData, download = false) {
//     try {
//       if (!fileData) {
//         throw new Error('No file data provided');
//       }

//       console.log('🔍 Processing file data:', JSON.stringify(fileData, null, 2));

//       // Extract URL from file metadata
//       let fileUrl;
//       let fileName = 'document';
      
//       if (typeof fileData === 'string') {
//         // It's already a URL or publicId/filename
//         if (fileData.startsWith('http')) {
//           fileUrl = fileData;
//           fileName = fileData.split('/').pop();
//         } else if (fileData.startsWith('/uploads/')) {
//           fileUrl = `${FILE_BASE_URL}${fileData}`;
//           fileName = fileData.split('/').pop();
//         } else if (fileData.startsWith('/')) {
//           fileUrl = `${FILE_BASE_URL}${fileData}`;
//           fileName = fileData.split('/').pop();
//         } else {
//           // It's just a filename - need to find it
//           // The file could be anywhere in /uploads/
//           // Since we don't know the exact path, we'll have to guess based on naming
//           if (fileData.startsWith('supplier_doc_')) {
//             // Try supplier-documents first
//             fileUrl = `${FILE_BASE_URL}/uploads/supplier-documents/${fileData}`;
//           } else {
//             // Try generic uploads
//             fileUrl = `${FILE_BASE_URL}/uploads/${fileData}`;
//           }
//           fileName = fileData;
//         }
//       } else if (fileData.url) {
//         // File metadata object with URL - THIS IS THE PREFERRED FORMAT
//         // The URL should already be the correct relative path
//         if (fileData.url.startsWith('http')) {
//           fileUrl = fileData.url;
//         } else if (fileData.url.startsWith('/uploads/')) {
//           // Perfect! It's already a relative path from root
//           fileUrl = `${FILE_BASE_URL}${fileData.url}`;
//         } else if (fileData.url.startsWith('/')) {
//           fileUrl = `${FILE_BASE_URL}${fileData.url}`;
//         } else {
//           // Relative path without leading slash
//           fileUrl = `${FILE_BASE_URL}/${fileData.url}`;
//         }
//         fileName = fileData.originalName || fileData.name || fileData.url.split('/').pop();
//       } else if (fileData.publicId || fileData.localPath) {
//         // Try to construct URL from publicId or localPath
//         let relativePath = null;
        
//         if (fileData.localPath) {
//           // Extract everything after 'uploads'
//           // Handle both Windows and Unix paths
//           const normalizedPath = fileData.localPath.replace(/\\/g, '/');
//           const uploadsIndex = normalizedPath.lastIndexOf('uploads/');
          
//           if (uploadsIndex !== -1) {
//             relativePath = '/' + normalizedPath.substring(uploadsIndex);
//           }
//         }
        
//         if (relativePath) {
//           fileUrl = `${FILE_BASE_URL}${relativePath}`;
//         } else if (fileData.publicId) {
//           // Fallback to publicId
//           if (fileData.publicId.startsWith('supplier_doc_')) {
//             fileUrl = `${FILE_BASE_URL}/uploads/supplier-documents/${fileData.publicId}`;
//           } else {
//             fileUrl = `${FILE_BASE_URL}/uploads/${fileData.publicId}`;
//           }
//         }
        
//         fileName = fileData.originalName || fileData.name || fileData.publicId || 'document';
//       } else {
//         throw new Error('Invalid file data format - no url, publicId, or localPath found');
//       }

//       // Clean up the file URL (remove double slashes except after http:)
//       fileUrl = fileUrl.replace(/([^:]\/)\/+/g, '$1');

//       console.log('📄 Final file URL:', fileUrl);
//       console.log('📝 File name:', fileName);

//       if (download) {
//         // Download file
//         try {
//           const response = await fetch(fileUrl, {
//             headers: {
//               'Authorization': `Bearer ${localStorage.getItem('token')}`
//             }
//           });

//           if (!response.ok) {
//             console.error(`❌ Download failed: HTTP ${response.status}`);
//             throw new Error(`HTTP error! status: ${response.status}`);
//           }

//           const blob = await response.blob();
//           const url = window.URL.createObjectURL(blob);
//           const link = document.createElement('a');
//           link.href = url;
//           link.download = fileName;
//           document.body.appendChild(link);
//           link.click();
//           document.body.removeChild(link);
//           window.URL.revokeObjectURL(url);
          
//           console.log('✅ File downloaded successfully');
//           return { success: true, message: 'File downloaded successfully' };
//         } catch (fetchError) {
//           console.error('❌ Fetch error:', fetchError);
//           console.log('⚠️ Attempting fallback: opening in new tab');
//           // Fallback: try opening in new tab
//           window.open(fileUrl, '_blank');
//           return { success: true, message: 'File opened in new tab (download failed)' };
//         }
//       } else {
//         // Open in new tab
//         console.log('📂 Opening file in new tab');
//         window.open(fileUrl, '_blank');
//         return { success: true, message: 'File opened in new tab' };
//       }
//     } catch (error) {
//       console.error('❌ Error handling file:', error);
//       throw error;
//     }
//   }

//   /**
//    * View file inline
//    */
//   async viewFile(fileData) {
//     return this.handleSupplierDocument(fileData, false);
//   }

//   /**
//    * Download file
//    */
//   async downloadFile(fileData, fileName) {
//     return this.handleSupplierDocument(fileData, true);
//   }

//   // ===============================
//   // SUPPLIER APPROVAL WORKFLOW
//   // ===============================

//   /**
//    * Get suppliers pending approval for current user
//    */
//   async getPendingApprovals() {
//     try {
//       const response = await this.api.get('/suppliers/admin/approvals/pending');
//       return response.data;
//     } catch (error) {
//       throw error;
//     }
//   }

//   /**
//    * Get single supplier with approval details
//    */
//   async getSupplierApprovalDetails(supplierId) {
//     try {
//       const response = await this.api.get(`/suppliers/admin/approvals/${supplierId}`);
//       return response.data;
//     } catch (error) {
//       throw error;
//     }
//   }

//   /**
//    * Process supplier approval/rejection
//    * @param {string} supplierId - Supplier ID
//    * @param {object} data - { decision: 'approved' | 'rejected', comments: string }
//    */
//   async processApproval(supplierId, data) {
//     try {
//       const response = await this.api.post(`/suppliers/admin/approvals/${supplierId}/decision`, data);
//       return response.data;
//     } catch (error) {
//       throw error;
//     }
//   }

//   /**
//    * Get approval statistics
//    */
//   async getApprovalStatistics() {
//     try {
//       const response = await this.api.get('/suppliers/admin/approvals/statistics');
//       return response.data;
//     } catch (error) {
//       throw error;
//     }
//   }

//   /**
//    * Get supplier approval timeline
//    */
//   async getApprovalTimeline(supplierId) {
//     try {
//       const response = await this.api.get(`/suppliers/admin/approvals/${supplierId}/timeline`);
//       return response.data;
//     } catch (error) {
//       throw error;
//     }
//   }

//   /**
//    * Bulk process supplier approvals
//    * @param {object} data - { supplierIds: string[], decision: 'approved' | 'rejected', comments: string }
//    */
//   async bulkProcessApprovals(data) {
//     try {
//       const response = await this.api.post('/suppliers/admin/approvals/bulk-process', data);
//       return response.data;
//     } catch (error) {
//       throw error;
//     }
//   }

//   /**
//    * Get approval dashboard data
//    */
//   async getApprovalDashboard() {
//     try {
//       const response = await this.api.get('/suppliers/admin/approvals/dashboard');
//       return response.data;
//     } catch (error) {
//       throw error;
//     }
//   }

//   // ===============================
//   // SUPPLIER OPERATIONS
//   // ===============================

//   /**
//    * Register and onboard supplier (unified process)
//    */
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

//   /**
//    * Submit onboarding application (alias for registerAndOnboard for compatibility)
//    */
//   async submitOnboarding(formData) {
//     return this.registerAndOnboard(formData);
//   }

//   /**
//    * Get complete supplier profile
//    */
//   async getCompleteProfile(supplierId) {
//     try {
//       const response = await this.api.get(`/suppliers/${supplierId}/complete-profile`);
//       return response.data;
//     } catch (error) {
//       throw error;
//     }
//   }

//   /**
//    * Update supplier profile
//    */
//   async updateProfile(supplierId, profileData) {
//     try {
//       const response = await this.api.put(`/suppliers/${supplierId}/profile`, profileData);
//       return response.data;
//     } catch (error) {
//       throw error;
//     }
//   }

//   /**
//    * Get all suppliers with filters
//    */
//   async getAllSuppliers(params = {}) {
//     try {
//       const response = await this.api.get('/suppliers/admin/all', { params });
//       return response.data;
//     } catch (error) {
//       throw error;
//     }
//   }

//   /**
//    * Bulk import suppliers
//    */
//   async bulkImport(suppliers) {
//     try {
//       const response = await this.api.post('/suppliers/bulk-import', { suppliers });
//       return response.data;
//     } catch (error) {
//       throw error;
//     }
//   }

//   /**
//    * Approve or reject supplier (legacy - use processApproval instead)
//    * @deprecated Use processApproval instead
//    */
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

//   /**
//    * Update supplier status
//    */
//   async updateSupplierStatus(supplierId, statusData) {
//     try {
//       const response = await this.api.put(`/suppliers/admin/${supplierId}/status`, statusData);
//       return response.data;
//     } catch (error) {
//       throw error;
//     }
//   }

//   /**
//    * Get supplier dashboard (for logged-in suppliers)
//    */
//   async getSupplierDashboard() {
//     try {
//       const response = await this.api.get('/suppliers/dashboard');
//       return response.data;
//     } catch (error) {
//       throw error;
//     }
//   }

//   /**
//    * Verify supplier email
//    */
//   async verifyEmail(token) {
//     try {
//       const response = await this.api.get(`/suppliers/verify-email/${token}`);
//       return response.data;
//     } catch (error) {
//       throw error;
//     }
//   }

//   /**
//    * Supplier login
//    */
//   async login(credentials) {
//     try {
//       const response = await this.api.post('/suppliers/login', credentials);
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
//         `/suppliers/admin/onboarding/applications/${applicationId}/status`,
//         statusData
//       );
//       return response.data;
//     } catch (error) {
//       throw error;
//     }
//   }

//   async addReviewNote(applicationId, noteData) {
//     try {
//       const response = await this.api.post(
//         `/suppliers/admin/onboarding/applications/${applicationId}/notes`,
//         noteData
//       );
//       return response.data;
//     } catch (error) {
//       throw error;
//     }
//   }

//   async uploadAdditionalDocuments(applicationId, formData) {
//     try {
//       const config = {
//         headers: { 'Content-Type': 'multipart/form-data' }
//       };
//       const response = await this.api.post(
//         `/suppliers/admin/onboarding/applications/${applicationId}/documents`,
//         formData,
//         config
//       );
//       return response.data;
//     } catch (error) {
//       throw error;
//     }
//   }

//   async downloadDocument(applicationId, documentId) {
//     try {
//       const response = await this.api.get(
//         `/suppliers/admin/onboarding/applications/${applicationId}/documents/${documentId}`,
//         { responseType: 'blob' }
//       );
//       return response.data;
//     } catch (error) {
//       throw error;
//     }
//   }

//   async getOnboardingStatistics() {
//     try {
//       const response = await this.api.get('/suppliers/admin/onboarding/statistics');
//       return response.data;
//     } catch (error) {
//       throw error;
//     }
//   }

//   async bulkUpdateApplications(data) {
//     try {
//       const response = await this.api.put('/suppliers/admin/onboarding/applications/bulk-update', data);
//       return response.data;
//     } catch (error) {
//       throw error;
//     }
//   }

//   async exportApplications(filters = {}) {
//     try {
//       const response = await this.api.get('/suppliers/admin/onboarding/export', {
//         params: filters,
//         responseType: 'blob'
//       });
//       return response.data;
//     } catch (error) {
//       throw error;
//     }
//   }

//   // ===============================
//   // SUPPLIER INVOICES
//   // ===============================

//   /**
//    * Submit supplier invoice
//    */
//   async submitInvoice(formData) {
//     try {
//       const config = {
//         headers: { 'Content-Type': 'multipart/form-data' }
//       };
//       const response = await this.api.post('/suppliers/invoices', formData, config);
//       return response.data;
//     } catch (error) {
//       throw error;
//     }
//   }

//   /**
//    * Get supplier invoices
//    */
//   async getSupplierInvoices(params = {}) {
//     try {
//       const response = await this.api.get('/suppliers/invoices', { params });
//       return response.data;
//     } catch (error) {
//       throw error;
//     }
//   }

//   /**
//    * Get invoice details
//    */
//   async getInvoiceDetails(invoiceId) {
//     try {
//       const response = await this.api.get(`/suppliers/invoices/${invoiceId}`);
//       return response.data;
//     } catch (error) {
//       throw error;
//     }
//   }

//   /**
//    * Get invoices for finance (admin)
//    */
//   async getInvoicesForFinance(params = {}) {
//     try {
//       const response = await this.api.get('/suppliers/admin/invoices', { params });
//       return response.data;
//     } catch (error) {
//       throw error;
//     }
//   }

//   // ===============================
//   // SUPPLIER RFQ & QUOTES
//   // ===============================

//   /**
//    * Get RFQ requests for supplier
//    */
//   async getSupplierRfqRequests(params = {}) {
//     try {
//       const response = await this.api.get('/suppliers/rfq-requests', { params });
//       return response.data;
//     } catch (error) {
//       throw error;
//     }
//   }

//   /**
//    * Get RFQ details
//    */
//   async getRfqDetails(rfqId) {
//     try {
//       const response = await this.api.get(`/suppliers/rfq-requests/${rfqId}`);
//       return response.data;
//     } catch (error) {
//       throw error;
//     }
//   }

//   /**
//    * Submit quote for RFQ
//    */
//   async submitQuote(rfqId, formData) {
//     try {
//       const config = {
//         headers: { 'Content-Type': 'multipart/form-data' }
//       };
//       const response = await this.api.post(`/suppliers/rfq-requests/${rfqId}/submit-quote`, formData, config);
//       return response.data;
//     } catch (error) {
//       throw error;
//     }
//   }

//   /**
//    * Get supplier quotes
//    */
//   async getSupplierQuotes(params = {}) {
//     try {
//       const response = await this.api.get('/suppliers/quotes', { params });
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

//   getSupplierStatusLabel(status) {
//     const labels = {
//       pending: 'Pending Review',
//       pending_supply_chain: 'Pending Supply Chain',
//       pending_head_of_business: 'Pending Executive',
//       pending_finance: 'Pending Finance',
//       approved: 'Approved',
//       rejected: 'Rejected',
//       suspended: 'Suspended',
//       inactive: 'Inactive'
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

//   validateSupplierData(data) {
//     const errors = {};

//     if (!data.companyName) errors.companyName = 'Company name is required';
//     if (!data.contactName) errors.contactName = 'Contact person is required';
//     if (!data.email) errors.email = 'Email is required';
//     if (!data.phoneNumber) errors.phoneNumber = 'Phone number is required';
//     if (!data.supplierType) errors.supplierType = 'Supplier type is required';

//     if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
//       errors.email = 'Valid email is required';
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

//   async exportApplicationsAndDownload(filters = {}) {
//     try {
//       const blob = await this.exportApplications(filters);
//       const url = window.URL.createObjectURL(blob);
//       const link = document.createElement('a');
//       link.href = url;
//       link.download = `supplier-applications-${Date.now()}.xlsx`;
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



