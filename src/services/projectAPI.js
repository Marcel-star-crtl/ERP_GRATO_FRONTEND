import axios from 'axios';

// SINGLE source of truth for base URL - NO TRAILING SLASH
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

console.log('🔗 Project API Base URL:', API_BASE_URL);

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    console.log('📤 API Request:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      fullURL: `${config.baseURL}${config.url}`,
      params: config.params
    });
    
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log('✅ API Response:', {
      url: response.config.url,
      status: response.status
    });
    return response;
  },
  (error) => {
    console.error('❌ API Error:', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.message,
      data: error.response?.data
    });
    
    if (error.response?.status === 401) {
      if (!window.location.pathname.includes('/login')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

// ========== UNIFIED PROJECT API ==========
export const projectAPI = {
  // ========== PROJECT CRUD OPERATIONS ==========

  /**
   * Create or save project (with draft option)
   * @param {Object} projectData - Project data
   * @param {boolean} isDraft - Save as draft
   */
  createOrSaveProject: async (projectData, isDraft = false) => {
    try {
      console.log('➕ Creating/Saving project, isDraft:', isDraft);
      const response = await api.post('/projects', {
        ...projectData,
        isDraft
      });
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      console.error('❌ createOrSaveProject error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to create/save project'
      };
    }
  },

  /**
   * Update project (only draft or rejected)
   * @param {string} projectId - Project ID
   * @param {Object} projectData - Updated project data
   * @param {boolean} isDraft - Keep as draft
   */
  updateProject: async (projectId, projectData, isDraft = false) => {
    try {
      console.log('✏️ Updating project:', projectId, 'isDraft:', isDraft);
      const response = await api.put(`/projects/${projectId}`, {
        ...projectData,
        isDraft
      });
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      console.error('❌ updateProject error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update project'
      };
    }
  },

  /**
   * Submit project for approval
   * @param {string} projectId - Project ID
   */
  submitForApproval: async (projectId) => {
    try {
      console.log('📤 Submitting project for approval:', projectId);
      const response = await api.post(`/projects/${projectId}/submit`);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      console.error('❌ submitForApproval error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to submit project for approval'
      };
    }
  },

  /**
   * Delete project (only draft or rejected)
   * @param {string} projectId - Project ID
   */
  deleteProject: async (projectId) => {
    try {
      console.log('🗑️ Deleting project:', projectId);
      const response = await api.delete(`/projects/${projectId}`);
      return {
        success: true,
        message: response.data.message
      };
    } catch (error) {
      console.error('❌ deleteProject error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to delete project'
      };
    }
  },

  // ========== PROJECT RETRIEVAL ==========

  /**
   * Get all projects with filtering
   * @param {Object} filters - Filter options (isDraft, status, department, etc.)
   */
  getProjects: async (filters = {}) => {
    try {
      console.log('🔍 Fetching projects with filters:', filters);
      const response = await api.get('/projects', { params: filters });
      return {
        success: true,
        data: response.data.data?.projects || response.data.data || [],
        pagination: response.data.data?.pagination
      };
    } catch (error) {
      console.error('❌ getProjects error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch projects',
        data: []
      };
    }
  },

  /**
   * Get my projects (including drafts)
   * @param {Object} filters - Filter options
   */
  getMyProjects: async (filters = {}) => {
    try {
      console.log('📁 Fetching my projects');
      const response = await api.get('/projects/my-projects', { params: filters });
      return {
        success: true,
        data: response.data.data || []
      };
    } catch (error) {
      console.error('❌ getMyProjects error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch your projects',
        data: []
      };
    }
  },

  /**
   * Get active projects only
   */
  getActiveProjects: async () => {
    try {
      console.log('🔍 Fetching active projects');
      const response = await api.get('/projects/active');
      return {
        success: true,
        data: response.data.data || []
      };
    } catch (error) {
      console.error('❌ getActiveProjects error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch active projects',
        data: []
      };
    }
  },

  /**
   * Get project by ID
   * @param {string} projectId - Project ID
   */
  getProjectById: async (projectId) => {
    try {
      console.log('🔍 Fetching project:', projectId);
      const response = await api.get(`/projects/${projectId}`);
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('❌ getProjectById error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch project'
      };
    }
  },

  /**
   * Search projects
   * @param {string} searchQuery - Search query
   * @param {Object} filters - Additional filters
   */
  searchProjects: async (searchQuery, filters = {}) => {
    try {
      console.log('🔎 Searching projects:', searchQuery);
      const response = await api.get('/projects/search', { 
        params: { q: searchQuery, ...filters } 
      });
      return {
        success: true,
        data: response.data.data || [],
        count: response.data.count
      };
    } catch (error) {
      console.error('❌ searchProjects error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to search projects',
        data: []
      };
    }
  },

  /**
   * Get projects by department
   * @param {string} department - Department name
   * @param {Object} filters - Additional filters
   */
  getProjectsByDepartment: async (department, filters = {}) => {
    try {
      console.log('🏢 Fetching department projects:', department);
      const response = await api.get(`/projects/department/${department}`, { 
        params: filters 
      });
      return {
        success: true,
        data: response.data.data || []
      };
    } catch (error) {
      console.error('❌ getProjectsByDepartment error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch department projects',
        data: []
      };
    }
  },

  // ========== APPROVAL WORKFLOW ==========

  /**
   * Get pending approvals (for authorized roles)
   */
  getPendingApprovals: async () => {
    try {
      console.log('📋 Fetching pending approvals');
      const response = await api.get('/projects/pending-approvals');
      return {
        success: true,
        data: response.data.data || [],
        count: response.data.count
      };
    } catch (error) {
      console.error('❌ getPendingApprovals error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch pending approvals',
        data: []
      };
    }
  },

  /**
   * Approve or reject project
   * @param {string} projectId - Project ID
   * @param {string} decision - 'approve' or 'reject'
   * @param {string} comments - Optional comments
   */
  processApproval: async (projectId, decision, comments = '') => {
    try {
      console.log('✅ Processing approval:', projectId, decision);
      const response = await api.post(`/projects/${projectId}/approve`, {
        decision,
        comments
      });
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      console.error('❌ processApproval error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to process approval'
      };
    }
  },

  // ========== MILESTONE MANAGEMENT ==========

  /**
   * Get supervisor's assigned milestones
   */
  getSupervisorMilestones: async () => {
    try {
      console.log('📋 Fetching supervisor milestones');
      const response = await api.get('/projects/my-milestones');
      return {
        success: true,
        data: response.data.data || [],
        count: response.data.count
      };
    } catch (error) {
      console.error('❌ getSupervisorMilestones error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch milestones',
        data: []
      };
    }
  },

  /**
   * Get milestone details
   * @param {string} projectId - Project ID
   * @param {string} milestoneId - Milestone ID
   */
  getMilestoneDetails: async (projectId, milestoneId) => {
    try {
      console.log('🔍 Fetching milestone details:', milestoneId);
      const response = await api.get(`/projects/${projectId}/milestones/${milestoneId}`);
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('❌ getMilestoneDetails error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch milestone details'
      };
    }
  },

  /**
   * Complete milestone
   * @param {string} projectId - Project ID
   * @param {string} milestoneId - Milestone ID
   */
  completeMilestone: async (projectId, milestoneId) => {
    try {
      console.log('✅ Completing milestone:', milestoneId);
      const response = await api.post(`/projects/${projectId}/milestones/${milestoneId}/complete`);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      console.error('❌ completeMilestone error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to complete milestone'
      };
    }
  },

  // ========== SUB-MILESTONE OPERATIONS ==========

  /**
   * Add sub-milestone to milestone
   * @param {string} projectId - Project ID
   * @param {string} milestoneId - Parent milestone ID
   * @param {Object} subMilestoneData - Sub-milestone data
   */
  addSubMilestone: async (projectId, milestoneId, subMilestoneData) => {
    try {
      console.log('➕ Adding sub-milestone to:', milestoneId);
      const response = await api.post(
        `/projects/${projectId}/milestones/${milestoneId}/sub-milestones`,
        subMilestoneData
      );
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      console.error('❌ addSubMilestone error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to add sub-milestone'
      };
    }
  },

  /**
   * Update sub-milestone
   * @param {string} projectId - Project ID
   * @param {string} milestoneId - Parent milestone ID
   * @param {string} subMilestoneId - Sub-milestone ID
   * @param {Object} updateData - Update data
   */
  updateSubMilestone: async (projectId, milestoneId, subMilestoneId, updateData) => {
    try {
      console.log('✏️ Updating sub-milestone:', subMilestoneId);
      const response = await api.patch(
        `/projects/${projectId}/milestones/${milestoneId}/sub-milestones/${subMilestoneId}`,
        updateData
      );
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      console.error('❌ updateSubMilestone error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update sub-milestone'
      };
    }
  },

  /**
   * Update sub-milestone progress
   * @param {string} projectId - Project ID
   * @param {string} milestoneId - Parent milestone ID
   * @param {string} subMilestoneId - Sub-milestone ID
   * @param {number} progress - Progress percentage
   * @param {string} notes - Optional notes
   */
  updateSubMilestoneProgress: async (projectId, milestoneId, subMilestoneId, progress, notes) => {
    try {
      console.log('📊 Updating sub-milestone progress:', subMilestoneId, progress);
      const response = await api.patch(
        `/projects/${projectId}/milestones/${milestoneId}/sub-milestones/${subMilestoneId}/progress`,
        { progress, notes }
      );
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      console.error('❌ updateSubMilestoneProgress error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update sub-milestone progress'
      };
    }
  },

  /**
   * Delete sub-milestone
   * @param {string} projectId - Project ID
   * @param {string} milestoneId - Parent milestone ID
   * @param {string} subMilestoneId - Sub-milestone ID
   */
  deleteSubMilestone: async (projectId, milestoneId, subMilestoneId) => {
    try {
      console.log('🗑️ Deleting sub-milestone:', subMilestoneId);
      const response = await api.delete(
        `/projects/${projectId}/milestones/${milestoneId}/sub-milestones/${subMilestoneId}`
      );
      return {
        success: true,
        message: response.data.message
      };
    } catch (error) {
      console.error('❌ deleteSubMilestone error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to delete sub-milestone'
      };
    }
  },

  // ========== PROJECT STATUS & PROGRESS ==========

  /**
   * Update project status
   * @param {string} projectId - Project ID
   * @param {Object} statusData - Status data
   */
  updateProjectStatus: async (projectId, statusData) => {
    try {
      console.log('🔄 Updating project status:', projectId);
      const response = await api.patch(`/projects/${projectId}/status`, statusData);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      console.error('❌ updateProjectStatus error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update project status'
      };
    }
  },

  /**
   * Update project progress (recalculates from milestones)
   * @param {string} projectId - Project ID
   */
  updateProjectProgress: async (projectId) => {
    try {
      console.log('📊 Updating project progress:', projectId);
      const response = await api.patch(`/projects/${projectId}/progress`);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      console.error('❌ updateProjectProgress error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update project progress'
      };
    }
  },

  // ========== STATISTICS & ANALYTICS ==========

  /**
   * Get project statistics
   */
  getProjectStats: async () => {
    try {
      console.log('📊 Fetching project stats');
      const response = await api.get('/projects/stats');
      return {
        success: true,
        data: response.data.data || response.data
      };
    } catch (error) {
      console.error('❌ getProjectStats error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch project statistics',
        data: {
          summary: { total: 0, active: 0, completed: 0, overdue: 0 },
          budget: { totalAllocated: 0, utilization: 0 }
        }
      };
    }
  },

  /**
   * Get project analytics
   * @param {string} projectId - Project ID
   */
  getProjectAnalytics: async (projectId) => {
    try {
      console.log('📈 Fetching project analytics:', projectId);
      const response = await api.get(`/projects/${projectId}/analytics`);
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('❌ getProjectAnalytics error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch analytics'
      };
    }
  },

  // ========== RISK MANAGEMENT ==========

  /**
   * Add risk to project
   * @param {string} projectId - Project ID
   * @param {Object} riskData - Risk data
   */
  addRisk: async (projectId, riskData) => {
    try {
      console.log('⚠️ Adding risk to project:', projectId);
      const response = await api.post(`/projects/${projectId}/risks`, riskData);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      console.error('❌ addRisk error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to add risk'
      };
    }
  },

  /**
   * Update risk status
   * @param {string} projectId - Project ID
   * @param {string} riskId - Risk ID
   * @param {string} status - New status
   * @param {string} notes - Optional notes
   */
  updateRiskStatus: async (projectId, riskId, status, notes) => {
    try {
      console.log('🔄 Updating risk status:', riskId);
      const response = await api.patch(`/projects/${projectId}/risks/${riskId}/status`, {
        status,
        notes
      });
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      console.error('❌ updateRiskStatus error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update risk'
      };
    }
  },

  // ========== ISSUE MANAGEMENT ==========

  /**
   * Add issue to project
   * @param {string} projectId - Project ID
   * @param {Object} issueData - Issue data
   */
  addIssue: async (projectId, issueData) => {
    try {
      console.log('🐛 Adding issue to project:', projectId);
      const response = await api.post(`/projects/${projectId}/issues`, issueData);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      console.error('❌ addIssue error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to add issue'
      };
    }
  },

  /**
   * Resolve issue
   * @param {string} projectId - Project ID
   * @param {string} issueId - Issue ID
   * @param {string} resolution - Resolution description
   */
  resolveIssue: async (projectId, issueId, resolution) => {
    try {
      console.log('✅ Resolving issue:', issueId);
      const response = await api.patch(`/projects/${projectId}/issues/${issueId}/resolve`, {
        resolution
      });
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      console.error('❌ resolveIssue error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to resolve issue'
      };
    }
  },

  // ========== CHANGE REQUEST MANAGEMENT ==========

  /**
   * Add change request
   * @param {string} projectId - Project ID
   * @param {Object} changeData - Change request data
   */
  addChangeRequest: async (projectId, changeData) => {
    try {
      console.log('📝 Adding change request to project:', projectId);
      const response = await api.post(`/projects/${projectId}/change-requests`, changeData);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      console.error('❌ addChangeRequest error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to add change request'
      };
    }
  },

  /**
   * Process change request
   * @param {string} projectId - Project ID
   * @param {string} changeRequestId - Change request ID
   * @param {string} decision - 'approve' or 'reject'
   * @param {string} comments - Optional comments
   */
  processChangeRequest: async (projectId, changeRequestId, decision, comments) => {
    try {
      console.log('🔄 Processing change request:', changeRequestId);
      const response = await api.post(
        `/projects/${projectId}/change-requests/${changeRequestId}/process`,
        { decision, comments }
      );
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      console.error('❌ processChangeRequest error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to process change request'
      };
    }
  },

  // ========== MEETING MANAGEMENT ==========

  /**
   * Log meeting
   * @param {string} projectId - Project ID
   * @param {Object} meetingData - Meeting data
   */
  logMeeting: async (projectId, meetingData) => {
    try {
      console.log('📅 Logging meeting for project:', projectId);
      const response = await api.post(`/projects/${projectId}/meetings`, meetingData);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      console.error('❌ logMeeting error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to log meeting'
      };
    }
  },

  // ========== BUDGET & METADATA ==========

  /**
   * Get available budget codes
   */
  getAvailableBudgetCodes: async () => {
    try {
      console.log('💰 Fetching available budget codes');
      const response = await api.get('/budget-codes/available');
      return {
        success: true,
        data: response.data.data || []
      };
    } catch (error) {
      console.warn('❌ Budget codes endpoint unavailable, using mock data');
      return {
        success: true,
        data: [
          {
            _id: 'budget-1',
            code: 'DEPT-IT-2024',
            name: 'IT Department 2024',
            department: 'IT',
            budgetType: 'departmental',
            totalBudget: 5000000,
            used: 1200000,
            available: 3800000,
            utilizationRate: 24,
            status: 'active'
          },
          {
            _id: 'budget-2',
            code: 'PROJ-OFFICE-2024',
            name: 'Office Supplies 2024',
            department: 'Operations',
            budgetType: 'operational',
            totalBudget: 2000000,
            used: 450000,
            available: 1550000,
            utilizationRate: 23,
            status: 'active'
          },
          {
            _id: 'budget-3',
            code: 'EQUIP-2024',
            name: 'Equipment Purchase 2024',
            department: 'Supply Chain',
            budgetType: 'capital',
            totalBudget: 10000000,
            used: 3500000,
            available: 6500000,
            utilizationRate: 35,
            status: 'active'
          }
        ]
      };
    }
  },

  /**
   * Get project metadata (types, departments, priorities)
   */
  getProjectMetadata: async () => {
    try {
      return {
        success: true,
        data: {
          projectTypes: [
            'Infrastructure',
            'IT Implementation',
            'Process Improvement',
            'Product Development',
            'Marketing Campaign',
            'Training Program',
            'Facility Upgrade',
            'Equipment Installation',
            'System Integration',
            'Research & Development',
            'Maintenance',
            'Other'
          ],
          departments: [
            'Operations',
            'IT',
            'Finance',
            'HR',
            'Marketing',
            'Supply Chain',
            'Facilities'
          ],
          priorities: ['Low', 'Medium', 'High', 'Critical']
        }
      };
    } catch (error) {
      console.error('❌ getProjectMetadata error:', error);
      return {
        success: false,
        message: 'Failed to fetch project metadata',
        data: {
          projectTypes: [],
          departments: [],
          priorities: []
        }
      };
    }
  }
};

export default projectAPI;














// import axios from 'axios';
// import { store } from '../store/store';

// // Fix the typo in the environment variable name
// const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/';

// console.log('API Base URL configured:', API_BASE_URL);

// const api = axios.create({
//   baseURL: API_BASE_URL,
//   timeout: 30000,
//   headers: {
//     'Content-Type': 'application/json',
//   },
// });

// // Request interceptor for auth token
// api.interceptors.request.use(
//   (config) => {
//     const state = store.getState();
//     const token = state.auth.token;
    
//     if (token) {
//       config.headers.Authorization = `Bearer ${token}`;
//     }
    
//     console.log('API Request:', {
//       method: config.method,
//       url: config.url,
//       baseURL: config.baseURL,
//       fullURL: `${config.baseURL}${config.url}`
//     });
    
//     return config;
//   },
//   (error) => {
//     console.error('Request interceptor error:', error);
//     return Promise.reject(error);
//   }
// );

// // Response interceptor for error handling
// api.interceptors.response.use(
//   (response) => {
//     console.log('API Response:', {
//       url: response.config.url,
//       status: response.status,
//       data: response.data
//     });
//     return response;
//   },
//   (error) => {
//     console.error('API Response Error:', {
//       url: error.config?.url,
//       status: error.response?.status,
//       message: error.message,
//       data: error.response?.data
//     });
    
//     if (error.response?.status === 401) {
//       // store.dispatch(logout());
//     }
//     return Promise.reject(error);
//   }
// );


// export const projectAPI = {
//   // ========== DRAFT & APPROVAL WORKFLOW ==========

//   // Create or save project (with draft option)
//   createOrSaveProject: async (projectData, saveAsDraft = false) => {
//     try {
//       const response = await api.post('/projects', {
//         ...projectData,
//         saveAsDraft
//       });
//       return {
//         success: true,
//         data: response.data.data,
//         message: response.data.message
//       };
//     } catch (error) {
//       console.error('Error creating/saving project:', error);
//       return {
//         success: false,
//         message: error.response?.data?.message || 'Failed to create/save project'
//       };
//     }
//   },

//   // Update project (only draft or rejected)
//   updateProject: async (projectId, projectData, saveAsDraft = false) => {
//     try {
//       const response = await api.put(`/projects/${projectId}`, {
//         ...projectData,
//         saveAsDraft
//       });
//       return {
//         success: true,
//         data: response.data.data,
//         message: response.data.message
//       };
//     } catch (error) {
//       console.error('Error updating project:', error);
//       return {
//         success: false,
//         message: error.response?.data?.message || 'Failed to update project'
//       };
//     }
//   },

//   // Submit project for approval
//   submitForApproval: async (projectId) => {
//     try {
//       const response = await api.post(`/projects/${projectId}/submit`);
//       return {
//         success: true,
//         data: response.data.data,
//         message: response.data.message
//       };
//     } catch (error) {
//       console.error('Error submitting project:', error);
//       return {
//         success: false,
//         message: error.response?.data?.message || 'Failed to submit project for approval'
//       };
//     }
//   },

//   // Get my projects (including drafts)
//   getMyProjects: async (filters = {}) => {
//     try {
//       const response = await api.get('/projects/my-projects', { params: filters });
//       return {
//         success: true,
//         data: response.data.data || []
//       };
//     } catch (error) {
//       console.error('Error fetching my projects:', error);
//       return {
//         success: false,
//         message: error.response?.data?.message || 'Failed to fetch your projects',
//         data: []
//       };
//     }
//   },

//   // Get pending approvals (for authorized roles)
//   getPendingApprovals: async () => {
//     try {
//       const response = await api.get('/projects/pending-approvals');
//       return {
//         success: true,
//         data: response.data.data || [],
//         count: response.data.count
//       };
//     } catch (error) {
//       console.error('Error fetching pending approvals:', error);
//       return {
//         success: false,
//         message: error.response?.data?.message || 'Failed to fetch pending approvals',
//         data: []
//       };
//     }
//   },

//   // Approve/Reject project
//   processApproval: async (projectId, decision, comments = '') => {
//     try {
//       const response = await api.post(`/projects/${projectId}/approve`, {
//         decision,
//         comments
//       });
//       return {
//         success: true,
//         data: response.data.data,
//         message: response.data.message
//       };
//     } catch (error) {
//       console.error('Error processing project approval:', error);
//       return {
//         success: false,
//         message: error.response?.data?.message || 'Failed to process project approval'
//       };
//     }
//   },

//   // Delete project (only draft or rejected)
//   deleteProject: async (projectId) => {
//     try {
//       const response = await api.delete(`/projects/${projectId}`);
//       return {
//         success: true,
//         message: response.data.message
//       };
//     } catch (error) {
//       console.error('Error deleting project:', error);
//       return {
//         success: false,
//         message: error.response?.data?.message || 'Failed to delete project'
//       };
//     }
//   },

//   // Get all projects with filtering
//   getProjects: async (filters = {}) => {
//     try {
//       const response = await api.get('/projects', { params: filters });
//       return {
//         success: true,
//         data: response.data.data?.projects || response.data.data || response.data.projects || response.data || [],
//         pagination: response.data.pagination
//       };
//     } catch (error) {
//       console.error('Error fetching projects:', error);
//       try {
//         console.log('Trying alternative projects endpoint...');
//         const altResponse = await api.get('/projects', { params: filters });
//         return {
//           success: true,
//           data: altResponse.data.data?.projects || altResponse.data.data || altResponse.data.projects || altResponse.data || [],
//           pagination: altResponse.data.pagination
//         };
//       } catch (altError) {
//         console.error('Alternative projects endpoint failed:', altError);
//         return {
//           success: false,
//           message: error.response?.data?.message || 'Failed to fetch projects',
//           data: []
//         };
//       }
//     }
//   },

//   // Get supervisor's assigned milestones
//   getSupervisorMilestones: async () => {
//     try {
//       const response = await api.get('/projects/my-milestones');
//       return {
//         success: true,
//         data: response.data.data || [],
//         count: response.data.count
//       };
//     } catch (error) {
//       console.error('Error fetching supervisor milestones:', error);
//       return {
//         success: false,
//         message: error.response?.data?.message || 'Failed to fetch milestones',
//         data: []
//       };
//     }
//   },

//   // Get milestone details
//   getMilestoneDetails: async (projectId, milestoneId) => {
//     try {
//       const response = await api.get(`/projects/${projectId}/milestones/${milestoneId}`);
//       return {
//         success: true,
//         data: response.data.data
//       };
//     } catch (error) {
//       console.error('Error fetching milestone details:', error);
//       return {
//         success: false,
//         message: error.response?.data?.message || 'Failed to fetch milestone details'
//       };
//     }
//   },

//   // Complete milestone
//   completeMilestone: async (projectId, milestoneId) => {
//     try {
//       const response = await api.post(`/projects/${projectId}/milestones/${milestoneId}/complete`);
//       return {
//         success: true,
//         data: response.data.data,
//         message: response.data.message
//       };
//     } catch (error) {
//       console.error('Error completing milestone:', error);
//       return {
//         success: false,
//         message: error.response?.data?.message || 'Failed to complete milestone'
//       };
//     }
//   },

//   // Get active projects only
//   getActiveProjects: async () => {
//     try {
//       const response = await api.get('/projects/active');
//       return {
//         success: true,
//         data: response.data.data?.projects || response.data.data || response.data.projects || response.data || []
//       };
//     } catch (error) {
//       console.error('Error fetching active projects:', error);
//       try {
//         console.log('Trying alternative active projects endpoint...');
//         const altResponse = await api.get('/supply-chain/projects/active');
//         return {
//           success: true,
//           data: altResponse.data.data?.projects || altResponse.data.data || altResponse.data.projects || altResponse.data || []
//         };
//       } catch (altError) {
//         try {
//           console.log('Trying to get all projects and filter for active...');
//           const allProjectsResponse = await api.get('/projects');
//           const allProjects = allProjectsResponse.data.data?.projects || allProjectsResponse.data.data || allProjectsResponse.data.projects || allProjectsResponse.data || [];
//           const activeProjects = allProjects.filter(project => 
//             ['Planning', 'Approved', 'In Progress', 'Active'].includes(project.status)
//           );
//           return {
//             success: true,
//             data: activeProjects
//           };
//         } catch (finalError) {
//           console.error('All project endpoints failed:', finalError);
//           return {
//             success: false,
//             message: error.response?.data?.message || 'Failed to fetch active projects',
//             data: []
//           };
//         }
//       }
//     }
//   },

//   // Get project by ID
//   getProjectById: async (projectId) => {
//     try {
//       const response = await api.get(`/projects/${projectId}`);
//       return {
//         success: true,
//         data: response.data.data
//       };
//     } catch (error) {
//       console.error('Error fetching project:', error);
//       return {
//         success: false,
//         message: error.response?.data?.message || 'Failed to fetch project'
//       };
//     }
//   },

//   // Create new project
//   createProject: async (projectData) => {
//     try {
//       const response = await api.post('/projects', projectData);
//       return {
//         success: true,
//         data: response.data.data,
//         message: response.data.message
//       };
//     } catch (error) {
//       console.error('Error creating project:', error);
//       return {
//         success: false,
//         message: error.response?.data?.message || 'Failed to create project'
//       };
//     }
//   },

//   // Update project
//   updateProject: async (projectId, projectData) => {
//     try {
//       const response = await api.put(`/projects/${projectId}`, projectData);
//       return {
//         success: true,
//         data: response.data.data,
//         message: response.data.message
//       };
//     } catch (error) {
//       console.error('Error updating project:', error);
//       return {
//         success: false,
//         message: error.response?.data?.message || 'Failed to update project'
//       };
//     }
//   },

//   // Update project status
//   updateProjectStatus: async (projectId, statusData) => {
//     try {
//       const response = await api.patch(`/projects/${projectId}/status`, statusData);
//       return {
//         success: true,
//         data: response.data.data,
//         message: response.data.message
//       };
//     } catch (error) {
//       console.error('Error updating project status:', error);
//       return {
//         success: false,
//         message: error.response?.data?.message || 'Failed to update project status'
//       };
//     }
//   },

//   // Update project progress (recalculates from milestones)
//   updateProjectProgress: async (projectId) => {
//     try {
//       const response = await api.patch(`/projects/${projectId}/progress`);
//       return {
//         success: true,
//         data: response.data.data,
//         message: response.data.message
//       };
//     } catch (error) {
//       console.error('Error updating project progress:', error);
//       return {
//         success: false,
//         message: error.response?.data?.message || 'Failed to update project progress'
//       };
//     }
//   },

//   // Get project statistics
//   getProjectStats: async () => {
//     try {
//       const response = await api.get('/projects/stats');
//       return {
//         success: true,
//         data: response.data.data || response.data
//       };
//     } catch (error) {
//       console.error('Error fetching project stats:', error);
//       try {
//         console.log('Trying alternative stats endpoint...');
//         const altResponse = await api.get('/supply-chain/projects/stats');
//         return {
//           success: true,
//           data: altResponse.data.data || altResponse.data
//         };
//       } catch (altError) {
//         console.error('Alternative stats endpoint failed:', altError);
//         return {
//           success: false,
//           message: error.response?.data?.message || 'Failed to fetch project statistics',
//           data: {
//             summary: { total: 0, active: 0, completed: 0, overdue: 0 },
//             budget: { totalAllocated: 0, utilization: 0 }
//           }
//         };
//       }
//     }
//   },

//   // Get project metadata
//   getProjectMetadata: async () => {
//     try {
//       return {
//         success: true,
//         data: {
//           projectTypes: [
//             'Infrastructure',
//             'IT Implementation',
//             'Process Improvement',
//             'Product Development',
//             'Marketing Campaign',
//             'Training Program',
//             'Facility Upgrade',
//             'Equipment Installation',
//             'System Integration',
//             'Research & Development',
//             'Maintenance',
//             'Other'
//           ],
//           departments: [
//             'Operations',
//             'IT',
//             'Finance',
//             'HR',
//             'Marketing',
//             'Supply Chain',
//             'Facilities'
//           ],
//           priorities: ['Low', 'Medium', 'High', 'Critical']
//         }
//       };
//     } catch (error) {
//       console.error('Error fetching project metadata:', error);
//       return {
//         success: false,
//         message: 'Failed to fetch project metadata',
//         data: {
//           projectTypes: [],
//           departments: [],
//           priorities: []
//         }
//       };
//     }
//   },

//   // Search projects
//   searchProjects: async (searchQuery, filters = {}) => {
//     try {
//       const response = await api.get('/projects/search', { 
//         params: { q: searchQuery, ...filters } 
//       });
//       return {
//         success: true,
//         data: response.data.data || [],
//         count: response.data.count
//       };
//     } catch (error) {
//       console.error('Error searching projects:', error);
//       return {
//         success: false,
//         message: error.response?.data?.message || 'Failed to search projects',
//         data: []
//       };
//     }
//   },

//   // Get user's projects
//   getUserProjects: async (filters = {}) => {
//     try {
//       const response = await api.get('/projects/my-projects', { params: filters });
//       return {
//         success: true,
//         data: response.data.data || []
//       };
//     } catch (error) {
//       console.error('Error fetching user projects:', error);
//       return {
//         success: false,
//         message: error.response?.data?.message || 'Failed to fetch your projects',
//         data: []
//       };
//     }
//   },

//   // Get projects by department
//   getProjectsByDepartment: async (department, filters = {}) => {
//     try {
//       const response = await api.get(`/projects/department/${department}`, { params: filters });
//       return {
//         success: true,
//         data: response.data.data || []
//       };
//     } catch (error) {
//       console.error('Error fetching department projects:', error);
//       return {
//         success: false,
//         message: error.response?.data?.message || 'Failed to fetch department projects',
//         data: []
//       };
//     }
//   },

//   // Delete project
//   deleteProject: async (projectId) => {
//     try {
//       const response = await api.delete(`/projects/${projectId}`);
//       return {
//         success: true,
//         message: response.data.message
//       };
//     } catch (error) {
//       console.error('Error deleting project:', error);
//       return {
//         success: false,
//         message: error.response?.data?.message || 'Failed to delete project'
//       };
//     }
//   },

//   // Get available budget codes
//   getAvailableBudgetCodes: async () => {
//     try {
//       const response = await api.get('/budget-codes/available');
//       return {
//         success: true,
//         data: response.data.data || []
//       };
//     } catch (error) {
//       console.error('Error fetching available budget codes:', error);
//       return {
//         success: true,
//         data: [
//           {
//             _id: 'budget-1',
//             code: 'DEPT-IT-2024',
//             name: 'IT Department 2024',
//             department: 'IT',
//             budgetType: 'departmental',
//             totalBudget: 5000000,
//             used: 1200000,
//             available: 3800000,
//             utilizationRate: 24,
//             status: 'active'
//           },
//           {
//             _id: 'budget-2', 
//             code: 'PROJ-OFFICE-2024',
//             name: 'Office Supplies 2024',
//             department: 'Operations',
//             budgetType: 'operational',
//             totalBudget: 2000000,
//             used: 450000,
//             available: 1550000,
//             utilizationRate: 23,
//             status: 'active'
//           },
//           {
//             _id: 'budget-3',
//             code: 'EQUIP-2024', 
//             name: 'Equipment Purchase 2024',
//             department: 'Supply Chain',
//             budgetType: 'capital',
//             totalBudget: 10000000,
//             used: 3500000,
//             available: 6500000,
//             utilizationRate: 35,
//             status: 'active'
//           }
//         ]
//       };
//     }
//   },

//   // ========== SUB-MILESTONE OPERATIONS ==========

//   // Add sub-milestone to milestone
//   addSubMilestone: async (projectId, milestoneId, subMilestoneData) => {
//     try {
//       const response = await api.post(
//         `/projects/${projectId}/milestones/${milestoneId}/sub-milestones`,
//         subMilestoneData
//       );
//       return {
//         success: true,
//         data: response.data.data,
//         message: response.data.message
//       };
//     } catch (error) {
//       console.error('Error adding sub-milestone:', error);
//       return {
//         success: false,
//         message: error.response?.data?.message || 'Failed to add sub-milestone'
//       };
//     }
//   },

//   // Update sub-milestone
//   updateSubMilestone: async (projectId, milestoneId, subMilestoneId, updateData) => {
//     try {
//       const response = await api.patch(
//         `/projects/${projectId}/milestones/${milestoneId}/sub-milestones/${subMilestoneId}`,
//         updateData
//       );
//       return {
//         success: true,
//         data: response.data.data,
//         message: response.data.message
//       };
//     } catch (error) {
//       console.error('Error updating sub-milestone:', error);
//       return {
//         success: false,
//         message: error.response?.data?.message || 'Failed to update sub-milestone'
//       };
//     }
//   },

//   // Update sub-milestone progress
//   updateSubMilestoneProgress: async (projectId, milestoneId, subMilestoneId, progress, notes) => {
//     try {
//       const response = await api.patch(
//         `/projects/${projectId}/milestones/${milestoneId}/sub-milestones/${subMilestoneId}/progress`,
//         { progress, notes }
//       );
//       return {
//         success: true,
//         data: response.data.data,
//         message: response.data.message
//       };
//     } catch (error) {
//       console.error('Error updating sub-milestone progress:', error);
//       return {
//         success: false,
//         message: error.response?.data?.message || 'Failed to update sub-milestone progress'
//       };
//     }
//   },

//   // Delete sub-milestone
//   deleteSubMilestone: async (projectId, milestoneId, subMilestoneId) => {
//     try {
//       const response = await api.delete(
//         `/projects/${projectId}/milestones/${milestoneId}/sub-milestones/${subMilestoneId}`
//       );
//       return {
//         success: true,
//         message: response.data.message
//       };
//     } catch (error) {
//       console.error('Error deleting sub-milestone:', error);
//       return {
//         success: false,
//         message: error.response?.data?.message || 'Failed to delete sub-milestone'
//       };
//     }
//   },
//   // Analytics
//   getProjectAnalytics: async (projectId) => {
//     try {
//       const response = await api.get(`/projects/${projectId}/analytics`);
//       return response.data;
//     } catch (error) {
//       console.error('Error fetching project analytics:', error);
//       throw error;
//     }
//   },

//   // Risk Management
//   addRisk: async (projectId, riskData) => {
//     try {
//       const response = await api.post(`/projects/${projectId}/risks`, riskData);
//       return response.data;
//     } catch (error) {
//       console.error('Error adding risk:', error);
//       throw error;
//     }
//   },

//   updateRiskStatus: async (projectId, riskId, status, notes) => {
//     try {
//       const response = await api.patch(`/projects/${projectId}/risks/${riskId}/status`, {
//         status,
//         notes
//       });
//       return response.data;
//     } catch (error) {
//       console.error('Error updating risk:', error);
//       throw error;
//     }
//   },

//   // Issue Management
//   addIssue: async (projectId, issueData) => {
//     try {
//       const response = await api.post(`/projects/${projectId}/issues`, issueData);
//       return response.data;
//     } catch (error) {
//       console.error('Error adding issue:', error);
//       throw error;
//     }
//   },

//   resolveIssue: async (projectId, issueId, resolution) => {
//     try {
//       const response = await api.patch(`/projects/${projectId}/issues/${issueId}/resolve`, {
//         resolution
//       });
//       return response.data;
//     } catch (error) {
//       console.error('Error resolving issue:', error);
//       throw error;
//     }
//   },

//   // Add change request
//   addChangeRequest: async (projectId, changeData) => {
//     try {
//       const response = await api.post(`/projects/${projectId}/change-requests`, changeData);
//       return response.data;
//     } catch (error) {
//       console.error('Error adding change request:', error);
//       throw error;
//     }
//   },

//   // Process change request
//   processChangeRequest: async (projectId, changeRequestId, decision, comments) => {
//     try {
//       const response = await api.post(
//         `/projects/${projectId}/change-requests/${changeRequestId}/process`,
//         { decision, comments }
//       );
//       return response.data;
//     } catch (error) {
//       console.error('Error processing change request:', error);
//       throw error;
//     }
//   },

//   // Log meeting
//   logMeeting: async (projectId, meetingData) => {
//     try {
//       const response = await api.post(`/projects/${projectId}/meetings`, meetingData);
//       return response.data;
//     } catch (error) {
//       console.error('Error logging meeting:', error);
//       throw error;
//     }
//   }
// };



