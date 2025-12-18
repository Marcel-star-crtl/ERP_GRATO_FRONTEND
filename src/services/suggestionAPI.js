import axios from 'axios';
import { store } from '../store/store';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

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
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log('API Response:', {
      status: response.status,
      url: response.config.url,
      data: response.data
    });
    return response;
  },
  (error) => {
    console.error('API Error:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      url: error.config?.url
    });
    
    if (error.response?.status === 401) {
      // Optionally dispatch logout action
      // store.dispatch(logout());
    }
    return Promise.reject(error);
  }
);

const suggestionAPI = {
  // Get suggestions based on user role
  getSuggestionsByRole: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      if (params.status) queryParams.append('status', params.status);
      if (params.category) queryParams.append('category', params.category);
      if (params.priority) queryParams.append('priority', params.priority);
      if (params.page) queryParams.append('page', params.page);
      if (params.limit) queryParams.append('limit', params.limit);

      const response = await api.get(`/suggestions/role?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      throw error;
    }
  },

  // Get suggestion details - ENHANCED with validation
  getSuggestionDetails: async (suggestionId) => {
    try {
      // Validate suggestion ID format
      if (!suggestionId) {
        throw new Error('Suggestion ID is required');
      }

      // Validate MongoDB ObjectId format (24 hex characters)
      if (!suggestionId.match(/^[0-9a-fA-F]{24}$/)) {
        throw new Error('Invalid suggestion ID format');
      }

      console.log('Fetching suggestion details for ID:', suggestionId);
      
      const response = await api.get(`/suggestions/${suggestionId}`);
      
      console.log('Suggestion details response:', response.data);
      
      return response.data;
    } catch (error) {
      console.error('Error fetching suggestion details:', error);
      
      // Enhanced error handling
      if (error.response) {
        // Server responded with error status
        throw new Error(error.response.data?.message || `Server error: ${error.response.status}`);
      } else if (error.request) {
        // Request made but no response received
        throw new Error('No response from server. Please check your connection.');
      } else {
        // Error in request setup
        throw error;
      }
    }
  },

  // Create a new suggestion
  createSuggestion: async (suggestionData, attachments = []) => {
    try {
      const formData = new FormData();
  
      console.log('Creating suggestion with data:', suggestionData);
      console.log('Attachments:', attachments);
  
      // Append suggestion data
      Object.keys(suggestionData).forEach(key => {
        const value = suggestionData[key];
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            formData.append(key, JSON.stringify(value));
          } else {
            formData.append(key, value.toString());
          }
        }
      });
  
      // Append attachments
      attachments.forEach((file) => {
        if (file.originFileObj) {
          formData.append('attachments', file.originFileObj);
        }
      });
  
      const response = await api.post('/suggestions', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
  
      return response.data;
    } catch (error) {
      console.error('Error creating suggestion:', error);
      throw error;
    }
  },

  // Vote on suggestion
  voteSuggestion: async (suggestionId, voteType) => {
    try {
      if (!['up', 'down'].includes(voteType)) {
        throw new Error('Vote type must be "up" or "down"');
      }

      const response = await api.post(`/suggestions/${suggestionId}/vote`, {
        voteType: voteType
      });
      return response.data;
    } catch (error) {
      console.error('Error voting on suggestion:', error);
      throw error;
    }
  },

  // Remove vote
  removeVote: async (suggestionId) => {
    try {
      const response = await api.delete(`/suggestions/${suggestionId}/vote`);
      return response.data;
    } catch (error) {
      console.error('Error removing vote:', error);
      throw error;
    }
  },

  // Add comment
  addComment: async (suggestionId, comment) => {
    try {
      if (!comment || comment.trim().length === 0) {
        throw new Error('Comment cannot be empty');
      }

      const response = await api.post(`/suggestions/${suggestionId}/comments`, {
        comment: comment.trim()
      });
      return response.data;
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  },

  // Get comments
  getComments: async (suggestionId) => {
    try {
      const response = await api.get(`/suggestions/${suggestionId}/comments`);
      return response.data;
    } catch (error) {
      console.error('Error fetching comments:', error);
      throw error;
    }
  },

  // Get dashboard stats
  getDashboardStats: async () => {
    try {
      const response = await api.get('/suggestions/analytics/dashboard');
      return response.data;
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw error;
    }
  },

  // Search suggestions
  searchSuggestions: async (query, filters = {}) => {
    try {
      const params = new URLSearchParams();
      params.append('q', query);
      
      Object.keys(filters).forEach(key => {
        if (filters[key]) {
          params.append(key, filters[key]);
        }
      });

      const response = await api.get(`/suggestions/search?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error searching suggestions:', error);
      throw error;
    }
  },

  // HR specific methods
  submitHRReview: async (suggestionId, reviewData) => {
    try {
      const response = await api.put(`/suggestions/hr/${suggestionId}/review`, reviewData);
      return response.data;
    } catch (error) {
      console.error('Error submitting HR review:', error);
      throw error;
    }
  },

  updateSuggestionStatus: async (suggestionId, statusData) => {
    try {
      const response = await api.put(`/suggestions/hr/${suggestionId}/status`, statusData);
      return response.data;
    } catch (error) {
      console.error('Error updating suggestion status:', error);
      throw error;
    }
  },

  // Admin methods
  getAllSuggestions: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      Object.keys(params).forEach(key => {
        if (params[key]) queryParams.append(key, params[key]);
      });

      const response = await api.get(`/suggestions/admin?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching all suggestions:', error);
      throw error;
    }
  },

  updateImplementationStatus: async (suggestionId, implementationData) => {
    try {
      const response = await api.put(`/suggestions/management/${suggestionId}/implementation`, implementationData);
      return response.data;
    } catch (error) {
      console.error('Error updating implementation status:', error);
      throw error;
    }
  },

  // Supervisor methods
  submitSupervisorEndorsement: async (suggestionId, endorsementData) => {
    try {
      const response = await api.put(`/suggestions/supervisor/${suggestionId}/endorsement`, endorsementData);
      return response.data;
    } catch (error) {
      console.error('Error submitting supervisor endorsement:', error);
      throw error;
    }
  }
};

export const suggestions = suggestionAPI;
export default suggestionAPI;