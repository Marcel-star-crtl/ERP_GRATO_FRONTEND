import api from './api';

export const kpiAPI = {
  // Get employee's KPIs
  getMyKPIs: async (quarter = null) => {
    try {
      const params = quarter ? { quarter } : {};
      const response = await api.get('/kpis/my-kpis', { params });
      return {
        success: true,
        data: response.data.data || [],
        currentQuarter: response.data.currentQuarter
      };
    } catch (error) {
      console.error('Error fetching KPIs:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch KPIs',
        data: []
      };
    }
  },

  // Get approved KPIs for task linking
  getApprovedKPIsForLinking: async (quarter = null) => {
    try {
      const params = quarter ? { quarter } : {};
      const response = await api.get('/kpis/approved-for-linking', { params });
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('Error fetching approved KPIs:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch approved KPIs',
        data: null
      };
    }
  },

  // Get pending KPI approvals (for supervisors)
  getPendingApprovals: async () => {
    try {
      const response = await api.get('/kpis/pending-approvals');
      return {
        success: true,
        data: response.data.data || [],
        count: response.data.count
      };
    } catch (error) {
      console.error('Error fetching pending approvals:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch pending approvals',
        data: []
      };
    }
  },

  // Get single KPI
  getKPI: async (id) => {
    try {
      const response = await api.get(`/kpis/${id}`);
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('Error fetching KPI:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch KPI'
      };
    }
  },

  // Create or update KPIs
  createOrUpdateKPIs: async (quarter, kpis) => {
    try {
      const response = await api.post('/kpis', { quarter, kpis });
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      console.error('Error saving KPIs:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to save KPIs'
      };
    }
  },

  // Submit KPIs for approval
  submitForApproval: async (id) => {
    try {
      const response = await api.post(`/kpis/${id}/submit`);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      console.error('Error submitting KPIs:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to submit KPIs'
      };
    }
  },

  // Approve/reject KPIs
  processApproval: async (id, decision, comments = '') => {
    try {
      const response = await api.post(`/kpis/${id}/approve`, {
        decision,
        comments
      });
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      console.error('Error processing approval:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to process approval'
      };
    }
  },

  // // Get approved KPIs for task linking
  // getApprovedKPIsForLinking: async (userId = null, quarter = null) => {
  //   try {
  //     const params = {};
  //     if (quarter) params.quarter = quarter;
  //     if (userId) params.userId = userId;
      
  //     const response = await api.get('/kpis/approved-for-linking', { params });
  //     return {
  //       success: true,
  //       data: response.data.data
  //     };
  //   } catch (error) {
  //     console.error('Error fetching approved KPIs:', error);
  //     return {
  //       success: false,
  //       message: error.response?.data?.message || 'Failed to fetch approved KPIs',
  //       data: null
  //     };
  //   }
  // },


  // Get approved KPIs for task linking
  getApprovedKPIsForLinking: async (userId = null, quarter = null) => {
    try {
      const params = {};
      if (quarter) params.quarter = quarter;
      if (userId) params.userId = userId; // Pass userId to fetch specific user's KPIs
      
      const response = await api.get('/kpis/approved-for-linking', { params });
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('Error fetching approved KPIs:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch approved KPIs',
        data: null
      };
    }
  },

  // Delete KPIs
  deleteKPIs: async (id) => {
    try {
      const response = await api.delete(`/kpis/${id}`);
      return {
        success: true,
        message: response.data.message
      };
    } catch (error) {
      console.error('Error deleting KPIs:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to delete KPIs'
      };
    }
  }
};