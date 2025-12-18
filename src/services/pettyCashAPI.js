import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

class PettyCashAPI {
  /**
   * Get petty cash forms for logged-in buyer
   */
  async getBuyerPettyCashForms(params = {}) {
    try {
      const response = await axios.get(`${API_URL}/buyer/petty-cash-forms`, {
        params,
        headers: this.getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Get buyer petty cash forms error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch petty cash forms',
        error: error.message
      };
    }
  }

  /**
   * Get petty cash form details
   * ✅ FIXED: Changed from /buyer/requisition/:id/details to /buyer/petty-cash-forms/:formId
   */
  async getPettyCashFormDetails(formId) {
    try {
      const response = await axios.get(
        `${API_URL}/buyer/petty-cash-forms/${formId}`,
        { headers: this.getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Get petty cash form details error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch form details',
        error: error.message
      };
    }
  }

  /**
   * Download petty cash form PDF
   * ✅ FIXED: Changed from /buyer/requisition/:id/download to /buyer/petty-cash-forms/:formId/download
   */
  async downloadPettyCashFormPDF(formId) {
    try {
      const response = await axios.get(
        `${API_URL}/buyer/petty-cash-forms/${formId}/download`,
        {
          headers: this.getAuthHeaders(),
          responseType: 'blob' // Important for PDF download
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Download petty cash form PDF error:', error);
      throw new Error(
        error.response?.data?.message || 'Failed to download PDF'
      );
    }
  }

  /**
   * Get buyer petty cash statistics
   * ✅ NEW: Added endpoint for statistics
   */
  async getBuyerPettyCashStats() {
    try {
      const response = await axios.get(`${API_URL}/buyer/petty-cash-forms/stats`, {
        headers: this.getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Get petty cash stats error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch statistics',
        error: error.message
      };
    }
  }

  /**
   * Get authorization headers
   */
  getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }
}

export const pettyCashAPI = new PettyCashAPI();