// services/headApprovalAPI.js

import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

class HeadApprovalAPI {
  /**
   * Get pending head approvals
   */
  async getPendingHeadApprovals(params = {}) {
    try {
      const response = await axios.get(`${API_URL}/head-approval/requisitions`, {
        params,
        headers: this.getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Get pending head approvals error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch requisitions',
        error: error.message
      };
    }
  }

  /**
   * Get head approval statistics
   */
  async getHeadApprovalStats() {
    try {
      const response = await axios.get(`${API_URL}/head-approval/stats`, {
        headers: this.getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Get head approval stats error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch statistics',
        error: error.message
      };
    }
  }

  /**
   * Get requisition details
   */
  async getRequisitionDetails(requisitionId) {
    try {
      const response = await axios.get(
        `${API_URL}/purchase-requisitions/head-approval/${requisitionId}`,
        { headers: this.getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Get requisition details error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch requisition details',
        error: error.message
      };
    }
  }

  /**
   * Process head approval decision
   */
  async processHeadApproval(requisitionId, data) {
    try {
      const response = await axios.post(
        `${API_URL}/head-approval/requisitions/${requisitionId}/approve`,
        data,
        { headers: this.getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Process head approval error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to process approval',
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

export const headApprovalAPI = new HeadApprovalAPI();