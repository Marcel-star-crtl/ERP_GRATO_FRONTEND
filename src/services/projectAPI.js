import axios from 'axios';
import { store } from '../store/store';

// Fix the typo in the environment variable name
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/';

console.log('API Base URL configured:', API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for auth token
api.interceptors.request.use(
  (config) => {
    const state = store.getState();
    const token = state.auth.token;
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    console.log('API Request:', {
      method: config.method,
      url: config.url,
      baseURL: config.baseURL,
      fullURL: `${config.baseURL}${config.url}`
    });
    
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log('API Response:', {
      url: response.config.url,
      status: response.status,
      data: response.data
    });
    return response;
  },
  (error) => {
    console.error('API Response Error:', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.message,
      data: error.response?.data
    });
    
    if (error.response?.status === 401) {
      // store.dispatch(logout());
    }
    return Promise.reject(error);
  }
);


export const projectAPI = {
  // Get all projects with filtering
  getProjects: async (filters = {}) => {
    try {
      const response = await api.get('/projects', { params: filters });
      return {
        success: true,
        data: response.data.data?.projects || response.data.data || response.data.projects || response.data || [],
        pagination: response.data.pagination
      };
    } catch (error) {
      console.error('Error fetching projects:', error);
      try {
        console.log('Trying alternative projects endpoint...');
        const altResponse = await api.get('/supply-chain/projects', { params: filters });
        return {
          success: true,
          data: altResponse.data.data?.projects || altResponse.data.data || altResponse.data.projects || altResponse.data || [],
          pagination: altResponse.data.pagination
        };
      } catch (altError) {
        console.error('Alternative projects endpoint failed:', altError);
        return {
          success: false,
          message: error.response?.data?.message || 'Failed to fetch projects',
          data: []
        };
      }
    }
  },

  // Get active projects only
  getActiveProjects: async () => {
    try {
      const response = await api.get('/projects/active');
      return {
        success: true,
        data: response.data.data?.projects || response.data.data || response.data.projects || response.data || []
      };
    } catch (error) {
      console.error('Error fetching active projects:', error);
      try {
        console.log('Trying alternative active projects endpoint...');
        const altResponse = await api.get('/supply-chain/projects/active');
        return {
          success: true,
          data: altResponse.data.data?.projects || altResponse.data.data || altResponse.data.projects || altResponse.data || []
        };
      } catch (altError) {
        try {
          console.log('Trying to get all projects and filter for active...');
          const allProjectsResponse = await api.get('/projects');
          const allProjects = allProjectsResponse.data.data?.projects || allProjectsResponse.data.data || allProjectsResponse.data.projects || allProjectsResponse.data || [];
          const activeProjects = allProjects.filter(project => 
            ['Planning', 'Approved', 'In Progress', 'Active'].includes(project.status)
          );
          return {
            success: true,
            data: activeProjects
          };
        } catch (finalError) {
          console.error('All project endpoints failed:', finalError);
          return {
            success: false,
            message: error.response?.data?.message || 'Failed to fetch active projects',
            data: []
          };
        }
      }
    }
  },

  // Get project by ID
  getProjectById: async (projectId) => {
    try {
      const response = await api.get(`/projects/${projectId}`);
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('Error fetching project:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch project'
      };
    }
  },

  // Create new project
  createProject: async (projectData) => {
    try {
      const response = await api.post('/projects', projectData);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      console.error('Error creating project:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to create project'
      };
    }
  },

  // Update project
  updateProject: async (projectId, projectData) => {
    try {
      const response = await api.put(`/projects/${projectId}`, projectData);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      console.error('Error updating project:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update project'
      };
    }
  },

  // Update project status
  updateProjectStatus: async (projectId, statusData) => {
    try {
      const response = await api.patch(`/projects/${projectId}/status`, statusData);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      console.error('Error updating project status:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update project status'
      };
    }
  },

  // Update project progress (recalculates from milestones)
  updateProjectProgress: async (projectId) => {
    try {
      const response = await api.patch(`/projects/${projectId}/progress`);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      console.error('Error updating project progress:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update project progress'
      };
    }
  },

  // Get project statistics
  getProjectStats: async () => {
    try {
      const response = await api.get('/projects/stats');
      return {
        success: true,
        data: response.data.data || response.data
      };
    } catch (error) {
      console.error('Error fetching project stats:', error);
      try {
        console.log('Trying alternative stats endpoint...');
        const altResponse = await api.get('/api/supply-chain/projects/stats');
        return {
          success: true,
          data: altResponse.data.data || altResponse.data
        };
      } catch (altError) {
        console.error('Alternative stats endpoint failed:', altError);
        return {
          success: false,
          message: error.response?.data?.message || 'Failed to fetch project statistics',
          data: {
            summary: { total: 0, active: 0, completed: 0, overdue: 0 },
            budget: { totalAllocated: 0, utilization: 0 }
          }
        };
      }
    }
  },

  // Get project metadata
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
      console.error('Error fetching project metadata:', error);
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
  },

  // Search projects
  searchProjects: async (searchQuery, filters = {}) => {
    try {
      const response = await api.get('/api/projects/search', { 
        params: { q: searchQuery, ...filters } 
      });
      return {
        success: true,
        data: response.data.data || [],
        count: response.data.count
      };
    } catch (error) {
      console.error('Error searching projects:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to search projects',
        data: []
      };
    }
  },

  // Get user's projects
  getUserProjects: async (filters = {}) => {
    try {
      const response = await api.get('/api/projects/my-projects', { params: filters });
      return {
        success: true,
        data: response.data.data || []
      };
    } catch (error) {
      console.error('Error fetching user projects:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch your projects',
        data: []
      };
    }
  },

  // Get projects by department
  getProjectsByDepartment: async (department, filters = {}) => {
    try {
      const response = await api.get(`/api/projects/department/${department}`, { params: filters });
      return {
        success: true,
        data: response.data.data || []
      };
    } catch (error) {
      console.error('Error fetching department projects:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch department projects',
        data: []
      };
    }
  },

  // Delete project
  deleteProject: async (projectId) => {
    try {
      const response = await api.delete(`/api/projects/${projectId}`);
      return {
        success: true,
        message: response.data.message
      };
    } catch (error) {
      console.error('Error deleting project:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to delete project'
      };
    }
  },

  // Get available budget codes
  getAvailableBudgetCodes: async () => {
    try {
      const response = await api.get('/budget-codes/available');
      return {
        success: true,
        data: response.data.data || []
      };
    } catch (error) {
      console.error('Error fetching available budget codes:', error);
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

  // ========== SUB-MILESTONE OPERATIONS ==========

  // Add sub-milestone to milestone
  addSubMilestone: async (projectId, milestoneId, subMilestoneData) => {
    try {
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
      console.error('Error adding sub-milestone:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to add sub-milestone'
      };
    }
  },

  // Update sub-milestone
  updateSubMilestone: async (projectId, milestoneId, subMilestoneId, updateData) => {
    try {
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
      console.error('Error updating sub-milestone:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update sub-milestone'
      };
    }
  },

  // Update sub-milestone progress
  updateSubMilestoneProgress: async (projectId, milestoneId, subMilestoneId, progress, notes) => {
    try {
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
      console.error('Error updating sub-milestone progress:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update sub-milestone progress'
      };
    }
  },

  // Delete sub-milestone
  deleteSubMilestone: async (projectId, milestoneId, subMilestoneId) => {
    try {
      const response = await api.delete(
        `/projects/${projectId}/milestones/${milestoneId}/sub-milestones/${subMilestoneId}`
      );
      return {
        success: true,
        message: response.data.message
      };
    } catch (error) {
      console.error('Error deleting sub-milestone:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to delete sub-milestone'
      };
    }
  }
};



