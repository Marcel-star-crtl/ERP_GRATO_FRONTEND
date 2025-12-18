// Create this file at: frontend/src/services/communicationAPI.js

import api from './api';

const communicationAPI = {
  // ============================================
  // COMMUNICATION CRUD
  // ============================================
  
  /**
   * Create new communication
   * @param {FormData} formData - Communication data with files
   */
  createCommunication: (formData) => {
    return api.post('/communications', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  /**
   * Get all communications with filters
   * @param {Object} params - Query parameters
   */
  getCommunications: (params) => {
    return api.get('/communications', { params });
  },

  /**
   * Get single communication by ID
   * @param {string} id - Communication ID
   */
  getCommunication: (id) => {
    return api.get(`/communications/${id}`);
  },

  /**
   * Update communication
   * @param {string} id - Communication ID
   * @param {FormData} formData - Updated data
   */
  updateCommunication: (id, formData) => {
    return api.put(`/communications/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  /**
   * Delete communication
   * @param {string} id - Communication ID
   */
  deleteCommunication: (id) => {
    return api.delete(`/communications/${id}`);
  },

  // ============================================
  // SENDING & SCHEDULING
  // ============================================

  /**
   * Send communication immediately
   * @param {string} id - Communication ID
   */
  sendCommunication: (id) => {
    return api.post(`/communications/${id}/send`);
  },

  /**
   * Preview recipient count
   * @param {Object} recipientCriteria - Recipient selection criteria
   */
  previewRecipients: (recipientCriteria) => {
    return api.post('/communications/preview-recipients', {
      recipients: recipientCriteria
    });
  },

  // ============================================
  // ATTACHMENTS
  // ============================================

  /**
   * Download attachment
   * @param {string} communicationId - Communication ID
   * @param {string} attachmentId - Attachment ID
   */
  downloadAttachment: (communicationId, attachmentId) => {
    return api.get(`/communications/${communicationId}/attachment/${attachmentId}`, {
      responseType: 'blob'
    });
  },

  /**
   * Delete attachment
   * @param {string} communicationId - Communication ID
   * @param {string} attachmentId - Attachment ID
   */
  deleteAttachment: (communicationId, attachmentId) => {
    return api.delete(`/communications/${communicationId}/attachments/${attachmentId}`);
  },

  // ============================================
  // STATISTICS & ANALYTICS
  // ============================================

  /**
   * Get dashboard statistics
   */
  getDashboardStats: () => {
    return api.get('/communications/stats/dashboard');
  },

  /**
   * Get detailed analytics
   * @param {Object} params - Date range and filters
   */
  getAnalytics: (params) => {
    return api.get('/communications/stats/analytics', { params });
  },

  // ============================================
  // TEMPLATES
  // ============================================

  /**
   * Get all templates
   */
  getTemplates: () => {
    return api.get('/communications/templates/list');
  },

  /**
   * Save communication as template
   * @param {string} id - Communication ID
   * @param {string} templateName - Template name
   */
  saveAsTemplate: (id, templateName) => {
    return api.post(`/communications/${id}/save-template`, {
      templateName
    });
  },

  // ============================================
  // READ TRACKING
  // ============================================

  /**
   * Mark communication as read (in-app)
   * @param {string} id - Communication ID
   */
  markAsRead: (id) => {
    return api.post(`/communications/${id}/mark-read`);
  },

  // ============================================
  // EMPLOYEE VIEW
  // ============================================

  /**
   * Get communications for current user (employee view)
   * @param {Object} params - Pagination and filters
   */
  getEmployeeCommunications: (params) => {
    return api.get('/communications/employee/list', { params });
  },

  /**
   * View communication (employee perspective)
   * @param {string} id - Communication ID
   */
  viewCommunication: (id) => {
    return api.get(`/communications/employee/view/${id}`);
  }
};

export default communicationAPI;