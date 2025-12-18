// services/behavioralEvaluationAPI.js

import api from './api';

export const behavioralEvaluationAPI = {
  /**
   * Get default evaluation criteria
   */
  getDefaultCriteria: async () => {
    try {
      const response = await api.get('/behavioral-evaluations/default-criteria');
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('Error fetching default criteria:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch default criteria',
        data: []
      };
    }
  },

  /**
   * Get employee's own evaluations
   * @param {string} quarter - Optional quarter filter (e.g., "Q1-2025")
   */
  getMyEvaluations: async (quarter = null) => {
    try {
      const params = quarter ? { quarter } : {};
      const response = await api.get('/behavioral-evaluations/my-evaluations', { params });
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

  /**
   * Get evaluations (for supervisors - only their evaluations)
   * @param {object} filters - Optional filters { quarter, status, employeeId }
   */
  getEvaluations: async (filters = {}) => {
    try {
      const response = await api.get('/behavioral-evaluations', { params: filters });
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

  /**
   * Get single evaluation by ID
   * @param {string} id - Evaluation ID
   */
  getEvaluation: async (id) => {
    try {
      const response = await api.get(`/behavioral-evaluations/${id}`);
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

  /**
   * Create or update evaluation
   * @param {string} employeeId - Employee ID
   * @param {string} quarter - Quarter (e.g., "Q1-2025")
   * @param {array} criteria - Array of { name, score, comments }
   * @param {string} overallComments - Overall feedback
   */
  createOrUpdateEvaluation: async (employeeId, quarter, criteria, overallComments = '') => {
    try {
      const response = await api.post('/behavioral-evaluations', {
        employeeId,
        quarter,
        criteria,
        overallComments
      });
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      console.error('Error saving evaluation:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to save evaluation'
      };
    }
  },

  /**
   * Submit evaluation (locks it and notifies employee)
   * @param {string} id - Evaluation ID
   */
  submitEvaluation: async (id) => {
    try {
      const response = await api.post(`/behavioral-evaluations/${id}/submit`);
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

  /**
   * Acknowledge evaluation (employee acknowledges receipt)
   * @param {string} id - Evaluation ID
   */
  acknowledgeEvaluation: async (id) => {
    try {
      const response = await api.post(`/behavioral-evaluations/${id}/acknowledge`);
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

  /**
   * Delete evaluation (draft only)
   * @param {string} id - Evaluation ID
   */
  deleteEvaluation: async (id) => {
    try {
      const response = await api.delete(`/behavioral-evaluations/${id}`);
      return {
        success: true,
        message: response.data.message
      };
    } catch (error) {
      console.error('Error deleting evaluation:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to delete evaluation'
      };
    }
  }
};

export default behavioralEvaluationAPI;









// import api from './api';

// export const behavioralEvaluationAPI = {
//   // Get default criteria
//   getDefaultCriteria: async () => {
//     try {
//       const response = await api.get('/api/behavioral-evaluations/default-criteria');
//       return {
//         success: true,
//         data: response.data.data
//       };
//     } catch (error) {
//       console.error('Error fetching default criteria:', error);
//       return {
//         success: false,
//         message: error.response?.data?.message || 'Failed to fetch default criteria',
//         data: []
//       };
//     }
//   },

//   // Get employee's evaluations
//   getMyEvaluations: async (quarter = null) => {
//     try {
//       const params = quarter ? { quarter } : {};
//       const response = await api.get('/api/behavioral-evaluations/my-evaluations', { params });
//       return {
//         success: true,
//         data: response.data.data || []
//       };
//     } catch (error) {
//       console.error('Error fetching evaluations:', error);
//       return {
//         success: false,
//         message: error.response?.data?.message || 'Failed to fetch evaluations',
//         data: []
//       };
//     }
//   },

//   // Get evaluations (for supervisors)
//   getEvaluations: async (filters = {}) => {
//     try {
//       const response = await api.get('/api/behavioral-evaluations', { params: filters });
//       return {
//         success: true,
//         data: response.data.data || [],
//         count: response.data.count
//       };
//     } catch (error) {
//       console.error('Error fetching evaluations:', error);
//       return {
//         success: false,
//         message: error.response?.data?.message || 'Failed to fetch evaluations',
//         data: []
//       };
//     }
//   },

//   // Get single evaluation
//   getEvaluation: async (id) => {
//     try {
//       const response = await api.get(`/api/behavioral-evaluations/${id}`);
//       return {
//         success: true,
//         data: response.data.data
//       };
//     } catch (error) {
//       console.error('Error fetching evaluation:', error);
//       return {
//         success: false,
//         message: error.response?.data?.message || 'Failed to fetch evaluation'
//       };
//     }
//   },

//   // Create or update evaluation
//   createOrUpdateEvaluation: async (employeeId, quarter, criteria, overallComments = '') => {
//     try {
//       const response = await api.post('/api/behavioral-evaluations', {
//         employeeId,
//         quarter,
//         criteria,
//         overallComments
//       });
//       return {
//         success: true,
//         data: response.data.data,
//         message: response.data.message
//       };
//     } catch (error) {
//       console.error('Error saving evaluation:', error);
//       return {
//         success: false,
//         message: error.response?.data?.message || 'Failed to save evaluation'
//       };
//     }
//   },

//   // Submit evaluation
//   submitEvaluation: async (id) => {
//     try {
//       const response = await api.post(`/api/behavioral-evaluations/${id}/submit`);
//       return {
//         success: true,
//         data: response.data.data,
//         message: response.data.message
//       };
//     } catch (error) {
//       console.error('Error submitting evaluation:', error);
//       return {
//         success: false,
//         message: error.response?.data?.message || 'Failed to submit evaluation'
//       };
//     }
//   },

//   // Acknowledge evaluation
//   acknowledgeEvaluation: async (id) => {
//     try {
//       const response = await api.post(`/api/behavioral-evaluations/${id}/acknowledge`);
//       return {
//         success: true,
//         data: response.data.data,
//         message: response.data.message
//       };
//     } catch (error) {
//       console.error('Error acknowledging evaluation:', error);
//       return {
//         success: false,
//         message: error.response?.data?.message || 'Failed to acknowledge evaluation'
//       };
//     }
//   },

//   // Delete evaluation
//   deleteEvaluation: async (id) => {
//     try {
//       const response = await api.delete(`/api/behavioral-evaluations/${id}`);
//       return {
//         success: true,
//         message: response.data.message
//       };
//     } catch (error) {
//       console.error('Error deleting evaluation:', error);
//       return {
//         success: false,
//         message: error.response?.data?.message || 'Failed to delete evaluation'
//       };
//     }
//   }
// };