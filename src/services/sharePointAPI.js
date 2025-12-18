import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance with auth token
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const sharepointAPI = {
  // ============================================
  // FOLDER OPERATIONS
  // ============================================
  
  createFolder: (data) => api.post('/sharepoint/folders', data),
  
  getFolders: (params) => api.get('/sharepoint/folders', { params }),
  
  getFolder: (folderId) => api.get(`/sharepoint/folders/${folderId}`),
  
  updateFolder: (folderId, data) => api.put(`/sharepoint/folders/${folderId}`, data),
  
  deleteFolder: (folderId) => api.delete(`/sharepoint/folders/${folderId}`),

  // ============================================
  // NEW: FOLDER ACCESS MANAGEMENT
  // ============================================
  
  /**
   * Invite users to folder
   * @param {string} folderId 
   * @param {Object} data - { userEmails: string[], permission: string }
   */
  inviteUsersToFolder: (folderId, data) => 
    api.post(`/sharepoint/folders/${folderId}/invite`, data),
  
  /**
   * Revoke user access from folder
   * @param {string} folderId 
   * @param {string} userId 
   */
  revokeUserAccess: (folderId, userId) => 
    api.delete(`/sharepoint/folders/${folderId}/revoke/${userId}`),
  
  /**
   * Block user from folder
   * @param {string} folderId 
   * @param {Object} data - { userEmail: string, reason: string }
   */
  blockUserFromFolder: (folderId, data) => 
    api.post(`/sharepoint/folders/${folderId}/block`, data),
  
  /**
   * Unblock user from folder
   * @param {string} folderId 
   * @param {string} userId 
   */
  unblockUserFromFolder: (folderId, userId) => 
    api.delete(`/sharepoint/folders/${folderId}/unblock/${userId}`),
  
  /**
   * Get folder access list
   * @param {string} folderId 
   */
  getFolderAccess: (folderId) => 
    api.get(`/sharepoint/folders/${folderId}/access`),
  
  /**
   * Update user permission in folder
   * @param {string} folderId 
   * @param {string} userId 
   * @param {Object} data - { permission: string }
   */
  updateUserPermission: (folderId, userId, data) => 
    api.patch(`/sharepoint/folders/${folderId}/permission/${userId}`, data),

  // ============================================
  // FILE OPERATIONS
  // ============================================
  
  uploadFile: (folderId, formData) => 
    api.post(`/sharepoint/folders/${folderId}/files`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  
  getFiles: (folderId, params) => 
    api.get(`/sharepoint/folders/${folderId}/files`, { params }),
  
  getFileDetails: (fileId) => 
    api.get(`/sharepoint/files/${fileId}`),
  
  downloadFile: (fileId) => 
    api.get(`/sharepoint/files/${fileId}/download`, { 
      responseType: 'blob' 
    }),
  
  deleteFile: (fileId, permanently = false) => 
    api.delete(`/sharepoint/files/${fileId}`, { 
      params: { permanently } 
    }),

  // ============================================
  // FILE SHARING (Enhanced)
  // ============================================
  
  /**
   * Share file with user or department
   * @param {string} fileId 
   * @param {Object} data - { shareWith: string, permission: string, type: 'user'|'department' }
   */
  shareFile: (fileId, data) => 
    api.post(`/sharepoint/files/${fileId}/share`, data),
  
  revokeFileAccess: (fileId, userId) => 
    api.delete(`/sharepoint/files/${fileId}/access/${userId}`),
  
  /**
   * Generate shareable link for file
   * @param {string} fileId 
   * @param {number} expiresIn - Expiration time in seconds
   */
  generateShareLink: (fileId, expiresIn = 604800) => 
    api.post(`/sharepoint/files/${fileId}/share-link`, { expiresIn }),

  // ============================================
  // USER OPERATIONS
  // ============================================
  
  getUserFiles: (params) => 
    api.get('/sharepoint/my-files', { params }),
  
  getUserStats: () => 
    api.get('/sharepoint/user-stats'),
  
  /**
   * Search users for invitation
   * @param {string} query - Search query
   */
  searchUsers: (query) => 
    api.get('/sharepoint/users/search', { params: { q: query } }),

  // ============================================
  // SEARCH & DISCOVERY
  // ============================================
  
  globalSearch: (params) => 
    api.get('/sharepoint/search', { params }),
  
  getRecentFiles: (params) => 
    api.get('/sharepoint/recent', { params }),

  // ============================================
  // BULK OPERATIONS
  // ============================================
  
  bulkUploadFiles: (folderId, formData) => 
    api.post(`/sharepoint/folders/${folderId}/bulk-upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),

  // ============================================
  // ANALYTICS
  // ============================================
  
  getStorageStats: (params) => 
    api.get('/sharepoint/stats/storage', { params }),
  
  getActivityLog: (params) => 
    api.get('/sharepoint/stats/activity', { params }),
  
  getDepartmentStats: (department) => 
    api.get(`/sharepoint/stats/department/${department}`),
  
  getSharePointDashboardStats: () => 
    api.get('/sharepoint/dashboard-stats'),

  // ============================================
  // VERSION CONTROL
  // ============================================
  
  createFileVersion: (fileId, formData) => 
    api.post(`/sharepoint/files/${fileId}/version`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  
  getFileVersions: (fileId) => 
    api.get(`/sharepoint/files/${fileId}/versions`),
  
  restoreFileVersion: (fileId, versionIndex) => 
    api.post(`/sharepoint/files/${fileId}/restore/${versionIndex}`)
};

export default sharepointAPI;









// import axios from 'axios';

// const api = axios.create({
//   baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5001/api',
// });

// api.interceptors.request.use((config) => {
//   const token = localStorage.getItem('token');
//   if (token) {
//     config.headers['Authorization'] = `Bearer ${token}`;
//   }
//   return config;
// }, (error) => {
//   return Promise.reject(error);
// });

// api.interceptors.response.use((response) => {
//   return response;
// }, (error) => {
//   if (error.response?.status === 401) {
//     localStorage.removeItem('token');
//     window.location = '/login';
//   }
//   return Promise.reject(error);
// });

// export default {
//   // ============ FOLDER OPERATIONS ============
  
//   createFolder: (folderData) => 
//     api.post('/sharepoint/folders', folderData),
  
//   getFolders: (params) => 
//     api.get('/sharepoint/folders', { params }),
  
//   getFolder: (folderId) => 
//     api.get(`/sharepoint/folders/${folderId}`),
  
//   updateFolder: (folderId, folderData) => 
//     api.put(`/sharepoint/folders/${folderId}`, folderData),
  
//   deleteFolder: (folderId) => 
//     api.delete(`/sharepoint/folders/${folderId}`),

//   // ============ FILE OPERATIONS ============
  
//   uploadFile: (folderId, formData) => 
//     api.post(`/sharepoint/folders/${folderId}/files`, formData, {
//       headers: { 'Content-Type': 'multipart/form-data' },
//       timeout: 60000 // 60 second timeout for large files
//     }),
  
//   getFiles: (folderId, params) => 
//     api.get(`/sharepoint/folders/${folderId}/files`, { params }),
  
//   getFileDetails: (fileId) => 
//     api.get(`/sharepoint/files/${fileId}`),
  
//   downloadFile: (fileId) => 
//     api.get(`/sharepoint/files/${fileId}/download`, {
//       responseType: 'blob'
//     }),
  
//   deleteFile: (fileId, permanently = false) => 
//     api.delete(`/sharepoint/files/${fileId}`, {
//       params: { permanently }
//     }),

//   // ============ USER-SPECIFIC OPERATIONS ============
  
//   getUserFiles: (params) => 
//     api.get('/sharepoint/my-files', { params }),
  
//   getUserStats: () => 
//     api.get('/sharepoint/user-stats'),

//   // ============ SHARING OPERATIONS ============
  
//   shareFile: (fileId, shareData) => 
//     api.post(`/sharepoint/files/${fileId}/share`, shareData),
  
//   revokeAccess: (fileId, userId) => 
//     api.delete(`/sharepoint/files/${fileId}/access/${userId}`),
  
//   generateShareLink: (fileId, expiresIn) => 
//     api.post(`/sharepoint/files/${fileId}/share-link`, { expiresIn }),

//   // ============ SEARCH & DISCOVERY ============
  
//   globalSearch: (params) => 
//     api.get('/sharepoint/search', { params }),
  
//   getRecentFiles: (limit = 10) => 
//     api.get('/sharepoint/recent', { params: { limit } }),

//   // ============ BULK OPERATIONS ============
  
//   bulkUpload: (folderId, formData) => 
//     api.post(`/sharepoint/folders/${folderId}/bulk-upload`, formData, {
//       headers: { 'Content-Type': 'multipart/form-data' },
//       timeout: 120000 // 2 minute timeout for bulk uploads
//     }),

//   // ============ ANALYTICS (Admin) ============
  
//   getStorageStats: (params) => 
//     api.get('/sharepoint/stats/storage', { params }),
  
//   getActivityLog: (params) => 
//     api.get('/sharepoint/stats/activity', { params }),
  
//   getDepartmentStats: (department) => 
//     api.get(`/sharepoint/stats/department/${department}`),

//   // ============ VERSION CONTROL ============
  
//   createFileVersion: (fileId, formData) => 
//     api.post(`/sharepoint/files/${fileId}/version`, formData, {
//       headers: { 'Content-Type': 'multipart/form-data' }
//     }),
  
//   getFileVersions: (fileId) => 
//     api.get(`/sharepoint/files/${fileId}/versions`),
  
//   restoreFileVersion: (fileId, versionIndex) => 
//     api.post(`/sharepoint/files/${fileId}/restore/${versionIndex}`)
// };





