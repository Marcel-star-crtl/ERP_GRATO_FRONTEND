import axios from 'axios';
import { store } from '../store/store';

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

const suggestionAPI = {
  // Get suggestions based on user role (replaces getEmployeeSuggestions, getHRSuggestions)
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

  // Create a new suggestion -  SYNTAX
  createSuggestion: async (suggestionData, attachments = []) => {
    try {
      const formData = new FormData();
  
      // Debug: Log what we're about to send
      console.log('Creating suggestion with data:', suggestionData);
      console.log('Attachments:', attachments);
  
      // Append suggestion data - ensure all fields are included
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
  
      console.log('FormData entries:');
      for (let [key, value] of formData.entries()) {
        console.log(`${key}: ${value}`);
      }
  
      // Append attachments
      attachments.forEach((file, index) => {
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

  // Get suggestion details
  getSuggestionDetails: async (suggestionId) => {
    try {
      const response = await api.get(`/suggestions/${suggestionId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching suggestion details:', error);
      throw error;
    }
  },

  // Vote on suggestion
  voteSuggestion: async (suggestionId, voteType) => {
    try {
      const response = await api.post(`/suggestions/${suggestionId}/vote`, {
        voteType: voteType // 'up' or 'down'
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
      const response = await api.post(`/suggestions/${suggestionId}/comments`, {
        comment: comment
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

  // Get trending suggestions
  getTrendingSuggestions: async () => {
    try {
      const response = await api.get('/suggestions/community/trending');
      return response.data;
    } catch (error) {
      console.error('Error fetching trending suggestions:', error);
      throw error;
    }
  },

  // Get featured suggestions
  getFeaturedSuggestions: async () => {
    try {
      const response = await api.get('/suggestions/community/featured');
      return response.data;
    } catch (error) {
      console.error('Error fetching featured suggestions:', error);
      throw error;
    }
  },

  // HR specific methods
  getHRSuggestions: async (params = {}) => {
    // This now uses the role-based endpoint
    return suggestionAPI.getSuggestionsByRole(params);
  },

  // Submit HR review
  submitHRReview: async (suggestionId, reviewData) => {
    try {
      const response = await api.put(`/suggestions/hr/${suggestionId}/review`, reviewData);
      return response.data;
    } catch (error) {
      console.error('Error submitting HR review:', error);
      throw error;
    }
  },

  // Update suggestion status
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

  // Toggle feature suggestion
  toggleFeatureSuggestion: async (suggestionId, featured = true) => {
    try {
      const response = await api.put(`/suggestions/admin/${suggestionId}/feature`, {
        featured: featured
      });
      return response.data;
    } catch (error) {
      console.error('Error toggling feature suggestion:', error);
      throw error;
    }
  },

  // Award recognition
  awardRecognition: async (suggestionId, recognitionData) => {
    try {
      const response = await api.put(`/suggestions/admin/${suggestionId}/recognition`, recognitionData);
      return response.data;
    } catch (error) {
      console.error('Error awarding recognition:', error);
      throw error;
    }
  },

  // Update implementation status
  updateImplementationStatus: async (suggestionId, implementationData) => {
    try {
      const response = await api.put(`/suggestions/management/${suggestionId}/implementation`, implementationData);
      return response.data;
    } catch (error) {
      console.error('Error updating implementation status:', error);
      throw error;
    }
  },

  // Supervisor specific methods
  submitSupervisorEndorsement: async (suggestionId, endorsementData) => {
    try {
      const response = await api.put(`/suggestions/supervisor/${suggestionId}/endorsement`, endorsementData);
      return response.data;
    } catch (error) {
      console.error('Error submitting supervisor endorsement:', error);
      throw error;
    }
  },

  // Employee specific methods (for backward compatibility)
  getEmployeeSuggestions: async (params = {}) => {
    // This now uses the role-based endpoint
    return suggestionAPI.getSuggestionsByRole(params);
  }
};

// Export the suggestion API methods
export const suggestions = suggestionAPI;
export default suggestionAPI;


