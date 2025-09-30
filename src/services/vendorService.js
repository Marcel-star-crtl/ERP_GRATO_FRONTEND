import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const vendorService = {
  // Get all vendors with filters
  getAllVendors: async (params = {}) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/vendors`, { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get vendor details
  getVendorDetails: async (vendorId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/vendors/${vendorId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Create new vendor
  createVendor: async (vendorData) => {
    try {
      const formData = new FormData();
      
      // Add text fields
      Object.keys(vendorData).forEach(key => {
        if (key !== 'documents' && vendorData[key] !== undefined) {
          if (typeof vendorData[key] === 'object') {
            formData.append(key, JSON.stringify(vendorData[key]));
          } else {
            formData.append(key, vendorData[key]);
          }
        }
      });

      // Add documents
      if (vendorData.documents && vendorData.documents.length > 0) {
        vendorData.documents.forEach(file => {
          formData.append('documents', file);
        });
      }

      const response = await axios.post(`${API_BASE_URL}/vendors`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Update vendor
  updateVendor: async (vendorId, vendorData) => {
    try {
      const response = await axios.put(`${API_BASE_URL}/vendors/${vendorId}`, vendorData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Update vendor status
  updateVendorStatus: async (vendorId, status, reason) => {
    try {
      const response = await axios.put(`${API_BASE_URL}/vendors/${vendorId}/status`,
      { status, reason });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Add vendor note
  addVendorNote: async (vendorId, note, category) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/vendors/${vendorId}/notes`, {
        note,
        category
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Record vendor performance
  recordVendorPerformance: async (vendorId, performanceData) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/vendors/${vendorId}/performance`, performanceData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get vendor analytics
  getVendorAnalytics: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/vendors/analytics`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get top performing vendors
  getTopPerformingVendors: async (limit = 10) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/vendors/top-performers`, {
        params: { limit }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Search vendors
  searchVendors: async (searchParams) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/vendors/search`, {
        params: searchParams
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get vendors by category
  getVendorsByCategory: async (category, activeOnly = true) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/vendors/category/${category}`, {
        params: { activeOnly }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Generate vendor report
  generateVendorReport: async (vendorId, period = 'quarterly') => {
    try {
      const response = await axios.get(`${API_BASE_URL}/vendors/${vendorId}/report`, {
        params: { period }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Delete vendor (admin only)
  deleteVendor: async (vendorId) => {
    try {
      const response = await axios.delete(`${API_BASE_URL}/vendors/${vendorId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Bulk update vendor status
  bulkUpdateVendorStatus: async (vendorIds, status, reason) => {
    try {
      const response = await axios.patch(`${API_BASE_URL}/vendors/bulk/status`, {
        vendorIds,
        status,
        reason
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get dashboard statistics
  getDashboardStats: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/vendors/dashboard/stats`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};

export default vendorService;