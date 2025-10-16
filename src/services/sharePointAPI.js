import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5001/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

api.interceptors.response.use((response) => {
  return response;
}, (error) => {
  if (error.response?.status === 401) {
    localStorage.removeItem('token');
    window.location = '/login';
  }
  return Promise.reject(error);
});

export default {
  // ============ FOLDER OPERATIONS ============
  
  createFolder: (folderData) => 
    api.post('/sharepoint/folders', folderData),
  
  getFolders: (params) => 
    api.get('/sharepoint/folders', { params }),
  
  getFolder: (folderId) => 
    api.get(`/sharepoint/folders/${folderId}`),
  
  updateFolder: (folderId, folderData) => 
    api.put(`/sharepoint/folders/${folderId}`, folderData),
  
  deleteFolder: (folderId) => 
    api.delete(`/sharepoint/folders/${folderId}`),

  // ============ FILE OPERATIONS ============
  
  uploadFile: (folderId, formData) => 
    api.post(`/sharepoint/folders/${folderId}/files`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000 // 60 second timeout for large files
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

  // ============ USER-SPECIFIC OPERATIONS ============
  
  getUserFiles: (params) => 
    api.get('/sharepoint/my-files', { params }),
  
  getUserStats: () => 
    api.get('/sharepoint/user-stats'),

  // ============ SHARING OPERATIONS ============
  
  shareFile: (fileId, shareData) => 
    api.post(`/sharepoint/files/${fileId}/share`, shareData),
  
  revokeAccess: (fileId, userId) => 
    api.delete(`/sharepoint/files/${fileId}/access/${userId}`),
  
  generateShareLink: (fileId, expiresIn) => 
    api.post(`/sharepoint/files/${fileId}/share-link`, { expiresIn }),

  // ============ SEARCH & DISCOVERY ============
  
  globalSearch: (params) => 
    api.get('/sharepoint/search', { params }),
  
  getRecentFiles: (limit = 10) => 
    api.get('/sharepoint/recent', { params: { limit } }),

  // ============ BULK OPERATIONS ============
  
  bulkUpload: (folderId, formData) => 
    api.post(`/sharepoint/folders/${folderId}/bulk-upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 120000 // 2 minute timeout for bulk uploads
    }),

  // ============ ANALYTICS (Admin) ============
  
  getStorageStats: (params) => 
    api.get('/sharepoint/stats/storage', { params }),
  
  getActivityLog: (params) => 
    api.get('/sharepoint/stats/activity', { params }),
  
  getDepartmentStats: (department) => 
    api.get(`/sharepoint/stats/department/${department}`),

  // ============ VERSION CONTROL ============
  
  createFileVersion: (fileId, formData) => 
    api.post(`/sharepoint/files/${fileId}/version`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  
  getFileVersions: (fileId) => 
    api.get(`/sharepoint/files/${fileId}/versions`),
  
  restoreFileVersion: (fileId, versionIndex) => 
    api.post(`/sharepoint/files/${fileId}/restore/${versionIndex}`)
};





