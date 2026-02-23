import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const api = axios.create({
  baseURL: API_BASE_URL
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

class CustomerApiService {
  // Get all customers
  async getAllCustomers(params = {}) {
    try {
      const response = await api.get('/customers', { params });
      return {
        success: true,
        data: response.data.data || [],
        pagination: response.data.pagination || {}
      };
    } catch (error) {
      console.error('Error fetching customers:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch customers',
        data: []
      };
    }
  }

  // Get customer by ID
  async getCustomerById(id) {
    try {
      const response = await api.get(`/customers/${id}`);
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('Error fetching customer:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch customer'
      };
    }
  }

  // Create new customer
  async createCustomer(customerData) {
    try {
      const response = await api.post('/customers', customerData);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Customer created successfully'
      };
    } catch (error) {
      console.error('Error creating customer:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to create customer'
      };
    }
  }

  // Update customer
  async updateCustomer(id, customerData) {
    try {
      const response = await api.put(`/customers/${id}`, customerData);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Customer updated successfully'
      };
    } catch (error) {
      console.error('Error updating customer:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update customer'
      };
    }
  }

  // Update customer status
  async updateCustomerStatus(id, status, reason = '') {
    try {
      const response = await api.patch(`/customers/${id}/status`, { status, reason });
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Customer status updated successfully'
      };
    } catch (error) {
      console.error('Error updating customer status:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update customer status'
      };
    }
  }

  // Approve customer
  async approveCustomer(id, comments = '') {
    try {
      const response = await api.post(`/customers/${id}/approve`, { comments });
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Customer approved successfully'
      };
    } catch (error) {
      console.error('Error approving customer:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to approve customer'
      };
    }
  }

  // Reject customer
  async rejectCustomer(id, reason) {
    try {
      const response = await api.post(`/customers/${id}/reject`, { reason });
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Customer rejected'
      };
    } catch (error) {
      console.error('Error rejecting customer:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to reject customer'
      };
    }
  }

  // Add note to customer
  async addCustomerNote(id, note, type = 'General') {
    try {
      const response = await api.post(`/customers/${id}/notes`, { note, type });
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Note added successfully'
      };
    } catch (error) {
      console.error('Error adding note:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to add note'
      };
    }
  }

  // Get dashboard stats
  async getDashboardStats() {
    try {
      const response = await api.get('/customers/dashboard-stats');
      return {
        success: true,
        data: response.data.data || {}
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      return {
        success: false,
        data: {},
        message: error.response?.data?.message || 'Failed to fetch stats'
      };
    }
  }

  // Get pending approvals
  async getPendingApprovals() {
    try {
      const response = await api.get('/customers/pending-approvals');
      return {
        success: true,
        data: response.data.data || []
      };
    } catch (error) {
      console.error('Error fetching pending approvals:', error);
      return {
        success: false,
        data: [],
        message: error.response?.data?.message || 'Failed to fetch pending approvals'
      };
    }
  }

  // ==========================================
  // ONBOARDING APPLICATION METHODS
  // ==========================================

  // Create onboarding application
  async createOnboardingApplication(applicationData) {
    try {
      const response = await api.post('/customers/onboarding/applications', applicationData);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Application submitted successfully'
      };
    } catch (error) {
      console.error('Error creating onboarding application:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to submit application'
      };
    }
  }

  // Get all onboarding applications
  async getAllOnboardingApplications(params = {}) {
    try {
      const response = await api.get('/customers/onboarding/applications', { params });
      return {
        success: true,
        data: response.data.data || []
      };
    } catch (error) {
      console.error('Error fetching onboarding applications:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch applications',
        data: []
      };
    }
  }

  // Approve onboarding application
  async approveOnboardingApplication(id, comments = '') {
    try {
      const response = await api.post(`/customers/onboarding/applications/${id}/approve`, { comments });
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Application approved successfully'
      };
    } catch (error) {
      console.error('Error approving onboarding application:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to approve application'
      };
    }
  }

  // ==========================================
  // PURCHASE ORDER FUNCTIONS
  // ==========================================

  // Upload PO for customer
  async uploadPurchaseOrder(customerId, poData, file) {
    try {
      const formData = new FormData();
      formData.append('poNumber', poData.poNumber);
      formData.append('description', poData.description || '');
      formData.append('amount', poData.amount);
      formData.append('currency', poData.currency || 'XAF');
      formData.append('poDate', poData.poDate);
      formData.append('paymentTerms', poData.paymentTerms || '');
      formData.append('notes', poData.notes || '');
      
      if (poData.dueDate) {
        formData.append('dueDate', poData.dueDate);
      }
      
      if (file) {
        formData.append('file', file);
      }

      console.log('📤 Uploading PO with data:', { customerId, poData, hasFile: !!file });

      const response = await api.post(`/customers/${customerId}/purchase-orders`, formData);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Purchase Order uploaded successfully'
      };
    } catch (error) {
      console.error('❌ Error uploading purchase order:', error);
      console.error('Response status:', error.response?.status);
      console.error('Response data:', error.response?.data);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to upload purchase order'
      };
    }
  }

  // Get customer's purchase orders
  async getCustomerPurchaseOrders(customerId, params = {}) {
    try {
      const response = await api.get(`/customers/${customerId}/purchase-orders`, { params });
      return {
        success: true,
        data: response.data.data || [],
        pagination: response.data.pagination || {}
      };
    } catch (error) {
      console.error('Error fetching purchase orders:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch purchase orders',
        data: []
      };
    }
  }

  // Update PO status
  async updatePurchaseOrderStatus(customerId, poId, status, notes = '') {
    try {
      const response = await api.patch(`/customers/${customerId}/purchase-orders/${poId}`, {
        status,
        notes
      });
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Purchase Order status updated'
      };
    } catch (error) {
      console.error('Error updating PO status:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update PO status'
      };
    }
  }

  // Update customer PO details
  async updatePurchaseOrder(customerId, poId, poData, file) {
    try {
      const formData = new FormData();
      formData.append('poNumber', poData.poNumber);
      formData.append('description', poData.description || '');
      formData.append('amount', poData.amount);
      formData.append('currency', poData.currency || 'XAF');
      formData.append('poDate', poData.poDate);
      
      // Handle payment terms - can be string or array
      if (Array.isArray(poData.paymentTerms)) {
        formData.append('paymentTerms', JSON.stringify(poData.paymentTerms));
      } else {
        formData.append('paymentTerms', poData.paymentTerms || '');
      }
      
      formData.append('notes', poData.notes || '');
      
      if (poData.dueDate) {
        formData.append('dueDate', poData.dueDate);
      }
      
      if (file) {
        formData.append('file', file);
      }

      console.log('📤 Updating PO with data:', { customerId, poId, poData, hasFile: !!file });

      const response = await api.put(`/customers/${customerId}/purchase-orders/${poId}`, formData);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Purchase Order updated successfully'
      };
    } catch (error) {
      console.error('❌ Error updating purchase order:', error);
      console.error('Response status:', error.response?.status);
      console.error('Response data:', error.response?.data);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to update purchase order'
      };
    }
  }

  // Delete PO
  async deletePurchaseOrder(customerId, poId) {
    try {
      const response = await api.delete(`/customers/${customerId}/purchase-orders/${poId}`);
      return {
        success: true,
        message: response.data.message || 'Purchase Order deleted successfully'
      };
    } catch (error) {
      console.error('Error deleting purchase order:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to delete purchase order'
      };
    }
  }
}

export default new CustomerApiService();
