const API_BASE_URL = process.env.REACT_APP_API_UR || 'http://localhost:5001/api';

// Utility function for making authenticated API requests
const makeAuthenticatedRequest = async (url, options = {}) => {
  const token = localStorage.getItem('token');
  
  const defaultHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  try {
    console.log('Making Budget Code API request:', { url, method: config.method || 'GET' });
    
    const response = await fetch(url, config);
    
    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;
      
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
        console.error('Budget Code API Error Response:', errorData);
      } catch (jsonError) {
        console.error('Could not parse error response as JSON');
      }
      
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log('Budget Code API Response:', data);
    return data;
  } catch (error) {
    console.error('Budget Code API Request Error:', error);
    throw error;
  }
};

export const budgetCodeAPI = {
  /**
   * Create new budget code (initiates approval workflow)
   */
  createBudgetCode: async (budgetCodeData) => {
    try {
      const url = `${API_BASE_URL}/budget-codes`;
      return await makeAuthenticatedRequest(url, {
        method: 'POST',
        body: JSON.stringify(budgetCodeData)
      });
    } catch (error) {
      console.error('Error creating budget code:', error);
      throw error;
    }
  },

  /**
   * Get all budget codes with filters
   */
  getBudgetCodes: async (filters = {}) => {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          queryParams.append(key, value);
        }
      });

      const url = `${API_BASE_URL}/budget-codes${queryParams.toString() ? `?${queryParams}` : ''}`;
      return await makeAuthenticatedRequest(url);
    } catch (error) {
      console.error('Error fetching budget codes:', error);
      throw error;
    }
  },

  /**
   * Get budget codes pending current user's approval
   */
  getPendingApprovals: async () => {
    try {
      const url = `${API_BASE_URL}/budget-codes/pending-approvals`;
      return await makeAuthenticatedRequest(url);
    } catch (error) {
      console.error('Error fetching pending approvals:', error);
      throw error;
    }
  },

  /**
   * Process approval/rejection
   */
  processApproval: async (codeId, approvalData) => {
    try {
      const url = `${API_BASE_URL}/budget-codes/${codeId}/approve`;
      return await makeAuthenticatedRequest(url, {
        method: 'POST',
        body: JSON.stringify(approvalData)
      });
    } catch (error) {
      console.error('Error processing approval:', error);
      throw error;
    }
  },

  /**
   * Get approval history
   */
  getApprovalHistory: async (codeId) => {
    try {
      const url = `${API_BASE_URL}/budget-codes/${codeId}/approval-history`;
      return await makeAuthenticatedRequest(url);
    } catch (error) {
      console.error('Error fetching approval history:', error);
      throw error;
    }
  },

  /**
   * Get single budget code details
   */
  getBudgetCode: async (codeId) => {
    try {
      const url = `${API_BASE_URL}/budget-codes/${codeId}`;
      return await makeAuthenticatedRequest(url);
    } catch (error) {
      console.error('Error fetching budget code:', error);
      throw error;
    }
  },

  /**
   * Update budget code
   */
  updateBudgetCode: async (codeId, updateData) => {
    try {
      const url = `${API_BASE_URL}/budget-codes/${codeId}`;
      return await makeAuthenticatedRequest(url, {
        method: 'PUT',
        body: JSON.stringify(updateData)
      });
    } catch (error) {
      console.error('Error updating budget code:', error);
      throw error;
    }
  },

  /**
   * Delete budget code
   */
  deleteBudgetCode: async (codeId) => {
    try {
      const url = `${API_BASE_URL}/budget-codes/${codeId}`;
      return await makeAuthenticatedRequest(url, {
        method: 'DELETE'
      });
    } catch (error) {
      console.error('Error deleting budget code:', error);
      throw error;
    }
  }
};

export default budgetCodeAPI;




