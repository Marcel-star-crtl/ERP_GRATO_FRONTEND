import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({ baseURL: API_URL, headers: { 'Content-Type': 'application/json' } });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const sharepointAPI = {

  // ── FOLDERS ──────────────────────────────────────────────────────────────────
  createFolder:  (data)              => api.post('/sharepoint/folders', data),
  getFolders:    (params)            => api.get('/sharepoint/folders', { params }),
  getFolder:     (folderId)          => api.get(`/sharepoint/folders/${folderId}`),
  updateFolder:  (folderId, data)    => api.put(`/sharepoint/folders/${folderId}`, data),
  deleteFolder:  (folderId)          => api.delete(`/sharepoint/folders/${folderId}`),

  // ── FOLDER ACCESS ─────────────────────────────────────────────────────────────
  inviteUsersToFolder:   (folderId, data)   => api.post(`/sharepoint/folders/${folderId}/invite`, data),
  revokeUserAccess:      (folderId, userId) => api.delete(`/sharepoint/folders/${folderId}/revoke/${userId}`),
  blockUserFromFolder:   (folderId, data)   => api.post(`/sharepoint/folders/${folderId}/block`, data),
  unblockUserFromFolder: (folderId, userId) => api.delete(`/sharepoint/folders/${folderId}/unblock/${userId}`),
  getFolderAccess:       (folderId)         => api.get(`/sharepoint/folders/${folderId}/access`),
  updateUserPermission:  (folderId, userId, data) => api.patch(`/sharepoint/folders/${folderId}/permission/${userId}`, data),

  // ── FILES ─────────────────────────────────────────────────────────────────────
  uploadFile: (folderId, formData) =>
    api.post(`/sharepoint/folders/${folderId}/files`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),

  getFiles:       (folderId, params) => api.get(`/sharepoint/folders/${folderId}/files`, { params }),
  getFileDetails: (fileId)           => api.get(`/sharepoint/files/${fileId}`),
  deleteFile:     (fileId, permanently = false) => api.delete(`/sharepoint/files/${fileId}`, { params: { permanently } }),

  /**
   * Download — opens in new tab; works for both local files and Cloudinary.
   * The server redirects to the Cloudinary URL automatically for cloud-stored files.
   */
  openFileDownload: async (fileId, fileName = 'download') => {
    const token = localStorage.getItem('token');
    
    const response = await fetch(`${API_URL}/sharepoint/files/${fileId}/download`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) throw new Error('Download failed');

    // Try to get filename from Content-Disposition header if available
    const disposition = response.headers.get('Content-Disposition');
    if (disposition) {
      const match = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
      if (match?.[1]) fileName = match[1].replace(/['"]/g, '');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  },

  // ── CHECK-OUT / CHECK-IN ──────────────────────────────────────────────────────
  /**
   * Lock a file for exclusive editing.
   * @param {string} fileId
   * @param {string} [note] - Optional note about what you're working on
   */
  checkoutFile: (fileId, note = '') =>
    api.post(`/sharepoint/files/${fileId}/checkout`, { note }),

  /**
   * Release the lock. Optionally upload a new version in the same request.
   * @param {string} fileId
   * @param {File|null} [newFile] - Optional updated file
   * @param {string}    [changeNote]
   */
  checkinFile: (fileId, newFile = null, changeNote = '') => {
    if (newFile) {
      const formData = new FormData();
      formData.append('file', newFile);
      if (changeNote) formData.append('changeNote', changeNote);
      return api.post(`/sharepoint/files/${fileId}/checkin`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
    }
    return api.post(`/sharepoint/files/${fileId}/checkin`, { changeNote });
  },

  /** Force-release a lock (admin or checkout owner) */
  forceCheckin: (fileId) => api.delete(`/sharepoint/files/${fileId}/checkout`),

  // ── VERSIONS ──────────────────────────────────────────────────────────────────
  createFileVersion: (fileId, formData) =>
    api.post(`/sharepoint/files/${fileId}/version`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),

  getFileVersions:    (fileId)              => api.get(`/sharepoint/files/${fileId}/versions`),
  restoreFileVersion: (fileId, versionIndex) => api.post(`/sharepoint/files/${fileId}/restore/${versionIndex}`),

  // ── COMMENTS ──────────────────────────────────────────────────────────────────
  addComment:    (fileId, text, versionIndex = null) => api.post(`/sharepoint/files/${fileId}/comments`, { text, versionIndex }),
  deleteComment: (fileId, commentId)                 => api.delete(`/sharepoint/files/${fileId}/comments/${commentId}`),

  // ── COLLABORATORS ─────────────────────────────────────────────────────────────
  addCollaborator:    (fileId, userEmail, permission) => api.post(`/sharepoint/files/${fileId}/collaborators`, { userEmail, permission }),
  removeCollaborator: (fileId, userId)                => api.delete(`/sharepoint/files/${fileId}/collaborators/${userId}`),
  getFileAuditTrail:  (fileId)                        => api.get(`/sharepoint/files/${fileId}/audit`),

  // ── SHARING ───────────────────────────────────────────────────────────────────
  shareFile:       (fileId, data)               => api.post(`/sharepoint/files/${fileId}/share`, data),
  revokeFileAccess:(fileId, userId)             => api.delete(`/sharepoint/files/${fileId}/access/${userId}`),
  generateShareLink:(fileId, expiresIn = 604800) => api.post(`/sharepoint/files/${fileId}/share-link`, { expiresIn }),

  // ── USER ──────────────────────────────────────────────────────────────────────
  getUserFiles:   (params) => api.get('/sharepoint/my-files', { params }),
  getUserStats:   ()       => api.get('/sharepoint/user-stats'),
  searchUsers:    (query)  => api.get('/sharepoint/users/search', { params: { q: query } }),

  // ── SEARCH ────────────────────────────────────────────────────────────────────
  globalSearch:   (params) => api.get('/sharepoint/search', { params }),
  getRecentFiles: (params) => api.get('/sharepoint/recent', { params }),

  // ── BULK ──────────────────────────────────────────────────────────────────────
  bulkUploadFiles: (folderId, formData) =>
    api.post(`/sharepoint/folders/${folderId}/bulk-upload`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),

  // ── ANALYTICS ─────────────────────────────────────────────────────────────────
  getStorageStats:           (params)      => api.get('/sharepoint/stats/storage', { params }),
  getActivityLog:            (params)      => api.get('/sharepoint/stats/activity', { params }),
  getDepartmentStats:        (department)  => api.get(`/sharepoint/stats/department/${department}`),
  getSharePointDashboardStats: ()          => api.get('/sharepoint/dashboard-stats')
};

export default sharepointAPI;










// import axios from 'axios';

// const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// // Create axios instance with auth token
// const api = axios.create({
//   baseURL: API_URL,
//   headers: {
//     'Content-Type': 'application/json'
//   }
// });

// // Add token to requests
// api.interceptors.request.use((config) => {
//   const token = localStorage.getItem('token');
//   if (token) {
//     config.headers.Authorization = `Bearer ${token}`;
//   }
//   return config;
// });

// const sharepointAPI = {
//   // ============================================
//   // FOLDER OPERATIONS
//   // ============================================
  
//   createFolder: (data) => api.post('/sharepoint/folders', data),
  
//   getFolders: (params) => api.get('/sharepoint/folders', { params }),
  
//   getFolder: (folderId) => api.get(`/sharepoint/folders/${folderId}`),
  
//   updateFolder: (folderId, data) => api.put(`/sharepoint/folders/${folderId}`, data),
  
//   deleteFolder: (folderId) => api.delete(`/sharepoint/folders/${folderId}`),

//   // ============================================
//   // NEW: FOLDER ACCESS MANAGEMENT
//   // ============================================
  
//   /**
//    * Invite users to folder
//    * @param {string} folderId 
//    * @param {Object} data - { userEmails: string[], permission: string }
//    */
//   inviteUsersToFolder: (folderId, data) => 
//     api.post(`/sharepoint/folders/${folderId}/invite`, data),
  
//   /**
//    * Revoke user access from folder
//    * @param {string} folderId 
//    * @param {string} userId 
//    */
//   revokeUserAccess: (folderId, userId) => 
//     api.delete(`/sharepoint/folders/${folderId}/revoke/${userId}`),
  
//   /**
//    * Block user from folder
//    * @param {string} folderId 
//    * @param {Object} data - { userEmail: string, reason: string }
//    */
//   blockUserFromFolder: (folderId, data) => 
//     api.post(`/sharepoint/folders/${folderId}/block`, data),
  
//   /**
//    * Unblock user from folder
//    * @param {string} folderId 
//    * @param {string} userId 
//    */
//   unblockUserFromFolder: (folderId, userId) => 
//     api.delete(`/sharepoint/folders/${folderId}/unblock/${userId}`),
  
//   /**
//    * Get folder access list
//    * @param {string} folderId 
//    */
//   getFolderAccess: (folderId) => 
//     api.get(`/sharepoint/folders/${folderId}/access`),
  
//   /**
//    * Update user permission in folder
//    * @param {string} folderId 
//    * @param {string} userId 
//    * @param {Object} data - { permission: string }
//    */
//   updateUserPermission: (folderId, userId, data) => 
//     api.patch(`/sharepoint/folders/${folderId}/permission/${userId}`, data),

//   // ============================================
//   // FILE OPERATIONS
//   // ============================================
  
//   uploadFile: (folderId, formData) => 
//     api.post(`/sharepoint/folders/${folderId}/files`, formData, {
//       headers: { 'Content-Type': 'multipart/form-data' }
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

//   // ============================================
//   // FILE SHARING (Enhanced)
//   // ============================================
  
//   /**
//    * Share file with user or department
//    * @param {string} fileId 
//    * @param {Object} data - { shareWith: string, permission: string, type: 'user'|'department' }
//    */
//   shareFile: (fileId, data) => 
//     api.post(`/sharepoint/files/${fileId}/share`, data),
  
//   revokeFileAccess: (fileId, userId) => 
//     api.delete(`/sharepoint/files/${fileId}/access/${userId}`),
  
//   /**
//    * Generate shareable link for file
//    * @param {string} fileId 
//    * @param {number} expiresIn - Expiration time in seconds
//    */
//   generateShareLink: (fileId, expiresIn = 604800) => 
//     api.post(`/sharepoint/files/${fileId}/share-link`, { expiresIn }),

//   // ============================================
//   // USER OPERATIONS
//   // ============================================
  
//   getUserFiles: (params) => 
//     api.get('/sharepoint/my-files', { params }),
  
//   getUserStats: () => 
//     api.get('/sharepoint/user-stats'),
  
//   /**
//    * Search users for invitation
//    * @param {string} query - Search query
//    */
//   searchUsers: (query) => 
//     api.get('/sharepoint/users/search', { params: { q: query } }),

//   // ============================================
//   // SEARCH & DISCOVERY
//   // ============================================
  
//   globalSearch: (params) => 
//     api.get('/sharepoint/search', { params }),
  
//   getRecentFiles: (params) => 
//     api.get('/sharepoint/recent', { params }),

//   // ============================================
//   // BULK OPERATIONS
//   // ============================================
  
//   bulkUploadFiles: (folderId, formData) => 
//     api.post(`/sharepoint/folders/${folderId}/bulk-upload`, formData, {
//       headers: { 'Content-Type': 'multipart/form-data' }
//     }),

//   // ============================================
//   // ANALYTICS
//   // ============================================
  
//   getStorageStats: (params) => 
//     api.get('/sharepoint/stats/storage', { params }),
  
//   getActivityLog: (params) => 
//     api.get('/sharepoint/stats/activity', { params }),
  
//   getDepartmentStats: (department) => 
//     api.get(`/sharepoint/stats/department/${department}`),
  
//   getSharePointDashboardStats: () => 
//     api.get('/sharepoint/dashboard-stats'),

//   // ============================================
//   // VERSION CONTROL
//   // ============================================
  
//   createFileVersion: (fileId, formData) => 
//     api.post(`/sharepoint/files/${fileId}/version`, formData, {
//       headers: { 'Content-Type': 'multipart/form-data' }
//     }),
  
//   getFileVersions: (fileId) => 
//     api.get(`/sharepoint/files/${fileId}/versions`),
  
//   restoreFileVersion: (fileId, versionIndex) => 
//     api.post(`/sharepoint/files/${fileId}/restore/${versionIndex}`)
// };

// export default sharepointAPI;
