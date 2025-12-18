import api from './api';

export const itemAPI = {
  // Get all items (with filtering)
  getItems: async (params = {}) => {
    try {
      const response = await api.get('/items', { params });
      return {
        success: true,
        data: response.data.items,
        total: response.data.total
      };
    } catch (error) {
      console.error('Error fetching items:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch items'
      };
    }
  },

  // Get active items only (for purchase requisition forms) - FIXED
  getActiveItems: async (categoryFilter = null) => {
    try {
      const params = { 
        isActive: true,
        ...(categoryFilter && categoryFilter !== 'all' && { category: categoryFilter })
      };
      
      console.log('API call params:', params);
      
      const response = await api.get('/items/active', { params });
      
      console.log('Raw API response:', response.data);
      
      // Make sure we return the data array, not the whole response
      return {
        success: true,
        data: response.data.data || response.data 
      };
    } catch (error) {
      console.error('Error fetching active items:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch active items'
      };
    }
  },

  // Create new item (Supply Chain only)
  createItem: async (itemData) => {
    try {
      const response = await api.post('/items', itemData);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error creating item:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to create item'
      };
    }
  },

  // Update item (Supply Chain only)
  updateItem: async (itemId, itemData) => {
    try {
      const response = await api.put(`/items/${itemId}`, itemData);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error updating item:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update item'
      };
    }
  },

  // Toggle item status (Supply Chain only)
  toggleItemStatus: async (itemId, isActive) => {
    try {
      const response = await api.patch(`/items/${itemId}/status`, { isActive });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error toggling item status:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update item status'
      };
    }
  },

  // Delete item (Supply Chain only)
  deleteItem: async (itemId) => {
    try {
      await api.delete(`/items/${itemId}`);
      return {
        success: true
      };
    } catch (error) {
      console.error('Error deleting item:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to delete item'
      };
    }
  },

  // Get item by ID
  getItemById: async (itemId) => {
    try {
      const response = await api.get(`/items/${itemId}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error fetching item:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch item'
      };
    }
  },

  // Search items by description or code
  searchItems: async (query) => {
    try {
      const response = await api.get(`/items/search`, { 
        params: { q: query, isActive: true } 
      });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error searching items:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to search items'
      };
    }
  },

  // Get categories and subcategories
  getCategories: async () => {
    try {
      const response = await api.get('/items/categories');
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error fetching categories:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch categories'
      };
    }
  },

  // Import items from CSV (Supply Chain only)
  importItems: async (formData) => {
    try {
      const response = await api.post('/items/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error importing items:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to import items'
      };
    }
  },

  // Export items to CSV (Supply Chain only)
  exportItems: async (filters = {}) => {
    try {
      const response = await api.get('/items/export', { 
        params: filters,
        responseType: 'blob'
      });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error exporting items:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to export items'
      };
    }
  },

  // Request new item (Employee request to Supply Chain)
  requestNewItem: async (requestData) => {
    try {
      const response = await api.post('/items/requests', requestData);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error requesting new item:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to submit item request'
      };
    }
  },

  // Get item requests (Supply Chain only)
  getItemRequests: async (status = 'all') => {
    try {
      const params = status !== 'all' ? { status } : {};
      const response = await api.get('/items/requests', { params });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error fetching item requests:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch item requests'
      };
    }
  },

  // Process item request (Supply Chain only)
  processItemRequest: async (requestId, action, itemData = null) => {
    try {
      const response = await api.patch(`/items/requests/${requestId}`, {
        action, // 'approve', 'reject', 'create_item'
        itemData
      });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error processing item request:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to process item request'
      };
    }
  }
};