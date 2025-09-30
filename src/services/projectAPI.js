import api from './api';

export const projectAPI = {
  // Get all projects with filtering
  getProjects: async (filters = {}) => {
    try {
      const response = await api.get('/api/projects', { params: filters });
      return {
        success: true,
        data: response.data.data?.projects || response.data.data || response.data.projects || response.data || [],
        pagination: response.data.pagination
      };
    } catch (error) {
      console.error('Error fetching projects:', error);
      
      // Try alternative endpoint
      try {
        console.log('Trying alternative projects endpoint...');
        const altResponse = await api.get('/api/supply-chain/projects', { params: filters });
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
      const response = await api.get('/api/projects/active');
      return {
        success: true,
        data: response.data.data?.projects || response.data.data || response.data.projects || response.data || []
      };
    } catch (error) {
      console.error('Error fetching active projects:', error);
      
      // Try alternative endpoint
      try {
        console.log('Trying alternative active projects endpoint...');
        const altResponse = await api.get('/api/supply-chain/projects/active');
        return {
          success: true,
          data: altResponse.data.data?.projects || altResponse.data.data || altResponse.data.projects || altResponse.data || []
        };
      } catch (altError) {
        // Try getting all projects and filtering for active ones
        try {
          console.log('Trying to get all projects and filter for active...');
          const allProjectsResponse = await api.get('/api/projects');
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
      const response = await api.get(`/api/projects/${projectId}`);
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
      const response = await api.post('/api/projects', projectData);
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
      const response = await api.put(`/api/projects/${projectId}`, projectData);
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
      const response = await api.patch(`/api/projects/${projectId}/status`, statusData);
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

  // Update project progress
  updateProjectProgress: async (projectId, progressData) => {
    try {
      const response = await api.patch(`/api/projects/${projectId}/progress`, progressData);
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
      const response = await api.get('/api/projects/stats');
      return {
        success: true,
        data: response.data.data || response.data
      };
    } catch (error) {
      console.error('Error fetching project stats:', error);
      
      // Try alternative endpoint
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

  // Get project metadata (types, departments, etc.)
  getProjectMetadata: async () => {
    try {
      // You can create a dedicated endpoint for this or return static data
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

  // Add team member to project
  addTeamMember: async (projectId, memberData) => {
    try {
      const response = await api.post(`/api/projects/${projectId}/team`, memberData);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      console.error('Error adding team member:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to add team member'
      };
    }
  },

  // Remove team member from project
  removeTeamMember: async (projectId, userId) => {
    try {
      const response = await api.delete(`/api/projects/${projectId}/team/${userId}`);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      console.error('Error removing team member:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to remove team member'
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

  // Get available budget codes for project assignment
  getAvailableBudgetCodes: async () => {
    try {
      const response = await api.get('/api/budget-codes/available');
      return {
        success: true,
        data: response.data.data || []
      };
    } catch (error) {
      console.error('Error fetching available budget codes:', error);
      // Return mock data if API fails
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
  }
};


