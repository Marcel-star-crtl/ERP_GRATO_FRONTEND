import api from './api';

export const quarterlyEvaluationAPI = {
  // Get employee's evaluations
  getMyEvaluations: async (quarter = null) => {
    try {
      const params = quarter ? { quarter } : {};
      const response = await api.get('/quarterly-evaluations/my-evaluations', { params });
      return {
        success: true,
        data: response.data.data || []
      };
    } catch (error) {
      console.error('Error fetching evaluations:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch evaluations',
        data: []
      };
    }
  },

  // Get evaluations (for supervisors/admins)
  getEvaluations: async (filters = {}) => {
    try {
      const response = await api.get('/quarterly-evaluations', { params: filters });
      return {
        success: true,
        data: response.data.data || [],
        count: response.data.count
      };
    } catch (error) {
      console.error('Error fetching evaluations:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch evaluations',
        data: []
      };
    }
  },

  // Get single evaluation
  getEvaluation: async (id) => {
    try {
      const response = await api.get(`/quarterly-evaluations/${id}`);
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('Error fetching evaluation:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch evaluation'
      };
    }
  },

  // Generate quarterly evaluation
  generateEvaluation: async (employeeId, quarter) => {
    try {
      const response = await api.post('/quarterly-evaluations/generate', {
        employeeId,
        quarter
      });
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      console.error('Error generating evaluation:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to generate evaluation'
      };
    }
  },

  // Submit evaluation
  submitEvaluation: async (id, supervisorComments = '') => {
    try {
      const response = await api.post(`/quarterly-evaluations/${id}/submit`, {
        supervisorComments
      });
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      console.error('Error submitting evaluation:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to submit evaluation'
      };
    }
  },

  // Approve evaluation (admin only)
  approveEvaluation: async (id, comments = '') => {
    try {
      const response = await api.post(`/quarterly-evaluations/${id}/approve`, {
        comments
      });
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      console.error('Error approving evaluation:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to approve evaluation'
      };
    }
  },

  // Acknowledge evaluation
  acknowledgeEvaluation: async (id, employeeComments = '') => {
    try {
      const response = await api.post(`/quarterly-evaluations/${id}/acknowledge`, {
        employeeComments
      });
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      console.error('Error acknowledging evaluation:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to acknowledge evaluation'
      };
    }
  },

  // Get statistics
  getStatistics: async (quarter = null, department = null) => {
    try {
      const params = {};
      if (quarter) params.quarter = quarter;
      if (department) params.department = department;
      
      const response = await api.get('/quarterly-evaluations/statistics', { params });
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('Error fetching statistics:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch statistics',
        data: null
      };
    }
  }
};