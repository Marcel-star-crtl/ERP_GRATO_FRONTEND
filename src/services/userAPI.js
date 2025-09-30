import api from './api';

export const userAPI = {
  getUsers: async (filters = {}) => {
    try {
      // Use department endpoints instead of admin-restricted user endpoints
      const allEmployees = [];
      
      // Get employees from all departments using the working invoice endpoint
      const departments = ['Technical', 'Business Development & Supply Chain', 'HR & Admin', 'Executive'];
      
      for (const department of departments) {
        try {
          const response = await api.get(`/api/invoices/departments/${encodeURIComponent(department)}/employees`);
          
          if (response.data?.success && response.data?.data) {
            const deptEmployees = response.data.data.map(emp => ({
              _id: emp.email, // Use email as ID since we don't have actual user IDs
              fullName: emp.name,
              email: emp.email,
              department: emp.department,
              position: emp.position,
              role: emp.role || 'employee',
              departmentRole: emp.departmentRole || 'staff',
              specializations: emp.specializations || []
            }));
            
            allEmployees.push(...deptEmployees);
          }
        } catch (deptError) {
          console.warn(`Failed to fetch employees from ${department}:`, deptError.message);
        }
      }
      
      // Apply filters if provided
      let filteredEmployees = allEmployees;
      if (filters.role) {
        filteredEmployees = allEmployees.filter(emp => emp.role === filters.role);
      }
      if (filters.department) {
        filteredEmployees = allEmployees.filter(emp => emp.department === filters.department);
      }
      
      return {
        success: true,
        data: filteredEmployees
      };
    } catch (error) {
      console.error('Error fetching users from departments:', error);
      
      // Fallback to admin endpoints if department method fails
      try {
        const response = await api.get('/api/auth/users', { params: filters });
        return {
          success: true,
          data: response.data.data?.users || response.data.data || response.data.users || response.data || []
        };
      } catch (adminError) {
        console.warn('Admin endpoints also failed:', adminError.message);
        
        try {
          console.log('Trying alternative users endpoint...');
          const altResponse = await api.get('/api/users', { params: filters });
          return {
            success: true,
            data: altResponse.data.data?.users || altResponse.data.data || altResponse.data.users || altResponse.data || []
          };
        } catch (altError) {
          console.error('Alternative users endpoint also failed:', altError);
          return {
            success: false,
            message: error.response?.data?.message || 'Failed to fetch users',
            data: []
          };
        }
      }
    }
  },

  // Get supervisors only
  getSupervisors: async () => {
    try {
      const response = await api.get('/api/auth/supervisors');
      return {
        success: true,
        data: response.data.data || []
      };
    } catch (error) {
      console.error('Error fetching supervisors:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch supervisors',
        data: []
      };
    }
  },

  // Get users by role
  getUsersByRole: async (role) => {
    try {
      const response = await api.get('/api/auth/users', { 
        params: { role } 
      });
      return {
        success: true,
        data: response.data.data?.users || response.data.data || []
      };
    } catch (error) {
      console.error('Error fetching users by role:', error);
      return {
        success: false,
        message: error.response?.data?.message || `Failed to fetch ${role}s`,
        data: []
      };
    }
  },

  getProjectManagers: async () => {
    try {
      // Get users with roles that can manage projects
      const roles = ['supervisor', 'supply_chain', 'admin', 'manager'];
      const allUsers = [];

      // Try to get all users first and filter
      const allUsersResponse = await userAPI.getUsers({ isActive: true });
      if (allUsersResponse.success && allUsersResponse.data.length > 0) {
        const projectManagers = allUsersResponse.data.filter(user => 
          roles.includes(user.role) && user.isActive !== false
        );
        
        if (projectManagers.length > 0) {
          return {
            success: true,
            data: projectManagers
          };
        }
      }

      // Fallback: Try each role separately
      for (const role of roles) {
        try {
          const response = await api.get('/api/auth/users', { 
            params: { role, isActive: true } 
          });
          
          let roleUsers = [];
          if (response.data.data?.users) {
            roleUsers = response.data.data.users;
          } else if (response.data.data && Array.isArray(response.data.data)) {
            roleUsers = response.data.data;
          } else if (response.data.users) {
            roleUsers = response.data.users;
          } else if (Array.isArray(response.data)) {
            roleUsers = response.data;
          }
          
          allUsers.push(...roleUsers);
        } catch (roleError) {
          console.warn(`Failed to fetch ${role}s:`, roleError);
        }
      }

      // Remove duplicates
      const uniqueUsers = allUsers.filter((user, index, self) => 
        index === self.findIndex(u => (u._id || u.id) === (user._id || user.id))
      );

      return {
        success: true,
        data: uniqueUsers.filter(user => user.isActive !== false)
      };
    } catch (error) {
      console.error('Error fetching project managers:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch project managers',
        data: []
      };
    }
  },

  // Get users with high access levels for project management
  getHighAccessEmployees: async () => {
    try {
      // Try to get all users first, then filter on frontend
      const allUsersResponse = await userAPI.getUsers({ isActive: true });
      
      if (allUsersResponse.success && allUsersResponse.data.length > 0) {
        // Define high access roles and positions for project management
        const highAccessRoles = ['admin', 'supervisor', 'manager', 'team_lead', 'supply_chain', 'finance', 'hr'];
        const highAccessPositions = [
          'Technical Director', 'Head of Business Dev & Supply Chain', 'HR & Admin Head',
          'Project Manager', 'Operations Manager', 'Supply Chain Coordinator', 
          'HSE Coordinator', 'Head of Refurbishment', 'Finance Officer'
        ];
        
        // Filter users by high access roles or positions
        const highAccessUsers = allUsersResponse.data.filter(user => {
          const hasHighRole = highAccessRoles.includes(user.role);
          const hasHighPosition = highAccessPositions.some(pos => 
            user.position?.includes(pos) || pos.includes(user.position || '')
          );
          const isActive = user.isActive !== false;
          
          return (hasHighRole || hasHighPosition) && isActive;
        });

        // Sort by role/position priority, then by name
        const rolePriority = { 'admin': 1, 'supervisor': 2, 'manager': 3, 'team_lead': 4, 'supply_chain': 5, 'finance': 6, 'hr': 7 };
        const positionPriority = {
          'Technical Director': 1,
          'Head of Business Dev & Supply Chain': 2, 
          'HR & Admin Head': 3,
          'Project Manager': 4,
          'Operations Manager': 5,
          'Supply Chain Coordinator': 6,
          'Finance Officer': 7
        };
        
        highAccessUsers.sort((a, b) => {
          // First sort by role priority
          const aPriority = rolePriority[a.role] || 10;
          const bPriority = rolePriority[b.role] || 10;
          if (aPriority !== bPriority) {
            return aPriority - bPriority;
          }
          
          // Then by position priority
          const aPosPriority = Object.keys(positionPriority).find(pos => 
            a.position?.includes(pos) || pos.includes(a.position || '')
          );
          const bPosPriority = Object.keys(positionPriority).find(pos => 
            b.position?.includes(pos) || pos.includes(b.position || '')
          );
          
          if (aPosPriority && bPosPriority) {
            const aPosVal = positionPriority[aPosPriority] || 10;
            const bPosVal = positionPriority[bPosPriority] || 10;
            if (aPosVal !== bPosVal) {
              return aPosVal - bPosVal;
            }
          }
          
          // Finally by name
          return (a.fullName || a.name || '').localeCompare(b.fullName || b.name || '');
        });

        return {
          success: true,
          data: highAccessUsers,
          message: `Found ${highAccessUsers.length} high access employees`
        };
      }

      // Fallback to empty array if no users found
      console.warn('No users found for high access filter');
      return {
        success: true,
        data: [],
        message: 'No high access employees found'
      };
    } catch (error) {
      console.error('Error fetching high access employees:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch high access employees',
        data: []
      };
    }
  },

  // Get user profile
  getUserProfile: async (userId = 'me') => {
    try {
      const endpoint = userId === 'me' ? '/api/auth/me' : `/api/auth/users/${userId}`;
      const response = await api.get(endpoint);
      return {
        success: true,
        data: response.data.user || response.data.data?.user
      };
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch user profile'
      };
    }
  },

  // Search users
  searchUsers: async (query, filters = {}) => {
    try {
      const response = await api.get('/api/auth/users/search', { 
        params: { query, ...filters } 
      });
      return {
        success: true,
        data: response.data.data?.users || response.data.data || []
      };
    } catch (error) {
      console.error('Error searching users:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to search users',
        data: []
      };
    }
  },

  // Get users by department
  getUsersByDepartment: async (department) => {
    try {
      const response = await api.get('/api/auth/users', { 
        params: { department } 
      });
      return {
        success: true,
        data: response.data.data?.users || response.data.data || []
      };
    } catch (error) {
      console.error('Error fetching users by department:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch department users',
        data: []
      };
    }
  }
};

// Export commonly used functions for easier access
export const getUsers = userAPI.getUsers;
export const getHighAccessEmployees = userAPI.getHighAccessEmployees;
export const getUserProfile = userAPI.getUserProfile;

export default userAPI;