import axios from 'axios';
import { store } from '../store/store';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const api = axios.create({ 
  baseURL: 'http://localhost:5001/api', // Fixed: Ensure correct API path
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
    
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
    //   store.dispatch(logout());
    }
    return Promise.reject(error);
  }
);


const leaveApi = {
  // Employee endpoints
  createLeave: async (formData) => {
    try {
      console.log('Creating leave request...');
      const response = await api.post('/leave', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      console.log('Create leave response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Create leave error:', error);
      throw error;
    }
  },

  getEmployeeLeaves: async (params = {}) => {
    try {
      console.log('Fetching employee leaves with params:', params);
      const response = await api.get('/leave/employee', { params });
      console.log('Employee leaves response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Get employee leaves error:', error);
      // Return a fallback response structure
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to fetch leaves',
        data: []
      };
    }
  },

  getEmployeeLeaveBalance: async (category) => {
    try {
      console.log('Fetching employee leave balance...');
      const params = category ? { category } : {};
      const response = await api.get('/leave/employee/balance', { params });
      console.log('Leave balance response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Get employee leave balance error:', error);
      // Return fallback balance data
      return {
        success: true,
        data: {
          vacation: { totalDays: 21, usedDays: 0, pendingDays: 0, remainingDays: 21 },
          medical: { totalDays: 10, usedDays: 0, pendingDays: 0, remainingDays: 10 },
          personal: { totalDays: 5, usedDays: 0, pendingDays: 0, remainingDays: 5 },
          emergency: { totalDays: 3, usedDays: 0, pendingDays: 0, remainingDays: 3 },
          family: { totalDays: 12, usedDays: 0, pendingDays: 0, remainingDays: 12 },
          bereavement: { totalDays: 5, usedDays: 0, pendingDays: 0, remainingDays: 5 },
          study: { totalDays: 10, usedDays: 0, pendingDays: 0, remainingDays: 10 }
        }
      };
    }
  },

  getLeaveById: async (leaveId) => {
    try {
      console.log('Fetching leave by ID:', leaveId);
      const response = await api.get(`/leave/${leaveId}`);
      console.log('Leave by ID response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Get leave by ID error:', error);
      throw error;
    }
  },

  updateLeave: async (leaveId, updateData) => {
    try {
      console.log('Updating leave:', leaveId, updateData);
      const response = await api.put(`/leave/${leaveId}`, updateData);
      console.log('Update leave response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Update leave error:', error);
      throw error;
    }
  },

  deleteLeave: async (leaveId) => {
    try {
      console.log('Deleting leave:', leaveId);
      const response = await api.delete(`/leave/${leaveId}`);
      console.log('Delete leave response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Delete leave error:', error);
      throw error;
    }
  },

  saveDraft: async (draftData) => {
    try {
      console.log('Saving draft:', draftData);
      const response = await api.post('/leave/draft', draftData);
      console.log('Save draft response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Save draft error:', error);
      throw error;
    }
  },

  // Supervisor endpoints
  getSupervisorLeaves: async (params = {}) => {
    try {
      const response = await api.get('/leave/supervisor', { params });
      return response.data;
    } catch (error) {
      console.error('Get supervisor leaves error:', error);
      throw error;
    }
  },

  processSupervisorDecision: async (leaveId, decision) => {
    try {
      const response = await api.put(`/leave/${leaveId}/supervisor`, decision);
      return response.data;
    } catch (error) {
      console.error('Process supervisor decision error:', error);
      throw error;
    }
  },

  // HR endpoints
  getHRLeaves: async (params = {}) => {
    try {
      const response = await api.get('/leave/hr', { params });
      return response.data;
    } catch (error) {
      console.error('Get HR leaves error:', error);
      throw error;
    }
  },

  processHRDecision: async (leaveId, decision) => {
    try {
      const response = await api.put(`/leave/${leaveId}/hr`, decision);
      return response.data;
    } catch (error) {
      console.error('Process HR decision error:', error);
      throw error;
    }
  },

  // Admin endpoints
  getAllLeaves: async (params = {}) => {
    try {
      const response = await api.get('/leave/admin', { params });
      return response.data;
    } catch (error) {
      console.error('Get all leaves error:', error);
      throw error;
    }
  },

  // Analytics and reporting
  getDashboardStats: async () => {
    try {
      const response = await api.get('/leave/dashboard/stats');
      return response.data;
    } catch (error) {
      console.error('Get dashboard stats error:', error);
      return { success: false, data: {} };
    }
  },

  getLeaveAnalytics: async (params = {}) => {
    try {
      const response = await api.get('/leave/analytics/general', { params });
      return response.data;
    } catch (error) {
      console.error('Get leave analytics error:', error);
      return { success: false, data: [] };
    }
  },

  getLeaveTrends: async (params = {}) => {
    try {
      const response = await api.get('/leave/analytics/trends', { params });
      return response.data;
    } catch (error) {
      console.error('Get leave trends error:', error);
      return { success: false, data: [] };
    }
  },

  getHRAnalytics: async () => {
    try {
      const response = await api.get('/leave/hr/analytics');
      return response.data;
    } catch (error) {
      console.error('Get HR analytics error:', error);
      return { success: false, data: {} };
    }
  },

  getLeaveStats: async (params = {}) => {
    try {
      const response = await api.get('/leave/statistics', { params });
      return response.data;
    } catch (error) {
      console.error('Get leave stats error:', error);
      return { success: false, data: {} };
    }
  },

  // Approval chain preview
  getApprovalChainPreview: async (employeeName, department, leaveCategory, totalDays) => {
    try {
      console.log('Getting approval chain preview:', { employeeName, department, leaveCategory, totalDays });
      const response = await api.post('/leave/preview-approval-chain', {
        employeeName,
        department,
        leaveCategory,
        totalDays
      });
      console.log('Approval chain preview response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Get approval chain preview error:', error);
      // Return fallback approval chain
      return {
        success: true,
        data: [
          {
            level: 1,
            approver: 'Direct Supervisor',
            role: 'Supervisor',
            department: department || 'Department'
          },
          {
            level: 2,
            approver: 'HR Team',
            role: 'HR',
            department: 'Human Resources'
          }
        ]
      };
    }
  },

  // Role-based fetch
  getLeavesByRole: async (params = {}) => {
    try {
      const response = await api.get('/leave/role', { params });
      return response.data;
    } catch (error) {
      console.error('Get leaves by role error:', error);
      throw error;
    }
  },

  // Leave types and information
  getLeaveTypes: async () => {
    try {
      console.log('Fetching leave types from API...');
      const response = await api.get('/leave/info/types');
      console.log('Leave types API response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Get leave types error:', error);
      // Return fallback leave types structure
      return {
        success: true,
        data: {
          medical: {
            category: 'Medical Leave',
            types: [
              { 
                value: 'sick_leave', 
                label: 'Sick Leave', 
                description: 'General illness requiring time off work', 
                requiresCertificate: true 
              },
              { 
                value: 'medical_appointment', 
                label: 'Medical Appointment', 
                description: 'Scheduled medical consultation', 
                requiresCertificate: false 
              },
              { 
                value: 'emergency_medical', 
                label: 'Emergency Medical Leave', 
                description: 'Urgent medical situation', 
                requiresCertificate: true 
              },
              { 
                value: 'mental_health', 
                label: 'Mental Health Leave', 
                description: 'Mental health and wellness support', 
                requiresCertificate: true 
              }
            ]
          },
          vacation: {
            category: 'Vacation Leave',
            types: [
              { 
                value: 'annual_leave', 
                label: 'Annual Leave', 
                description: 'Regular vacation time', 
                requiresCertificate: false 
              }
            ]
          },
          personal: {
            category: 'Personal Leave',
            types: [
              { 
                value: 'personal_time_off', 
                label: 'Personal Time Off', 
                description: 'Personal matters and appointments', 
                requiresCertificate: false 
              },
              { 
                value: 'wellness_day', 
                label: 'Wellness Day', 
                description: 'Personal wellness and self-care', 
                requiresCertificate: false 
              },
              { 
                value: 'birthday_leave', 
                label: 'Birthday Leave', 
                description: 'Birthday celebration leave', 
                requiresCertificate: false 
              }
            ]
          },
          family: {
            category: 'Family Leave',
            types: [
              { 
                value: 'family_care', 
                label: 'Family Care Leave', 
                description: 'Caring for sick family member', 
                requiresCertificate: false 
              },
              { 
                value: 'child_sick_care', 
                label: 'Child Sick Care', 
                description: 'Caring for sick child', 
                requiresCertificate: false 
              },
              { 
                value: 'elder_care', 
                label: 'Elder Care Leave', 
                description: 'Caring for elderly family members', 
                requiresCertificate: false 
              }
            ]
          },
          emergency: {
            category: 'Emergency Leave',
            types: [
              { 
                value: 'emergency_leave', 
                label: 'Emergency Leave', 
                description: 'Unexpected urgent situations', 
                requiresCertificate: false 
              }
            ]
          },
          bereavement: {
            category: 'Bereavement Leave',
            types: [
              { 
                value: 'bereavement_leave', 
                label: 'Bereavement Leave', 
                description: 'Death of family member or close friend', 
                requiresCertificate: false 
              }
            ]
          },
          study: {
            category: 'Study Leave',
            types: [
              { 
                value: 'study_leave', 
                label: 'Study Leave', 
                description: 'Educational pursuits and courses', 
                requiresCertificate: false 
              },
              { 
                value: 'training_leave', 
                label: 'Training Leave', 
                description: 'Professional training and development', 
                requiresCertificate: false 
              }
            ]
          }
        }
      };
    }
  },

  getLeavePolicies: async () => {
    try {
      console.log('Fetching leave policies from API...');
      const response = await api.get('/leave/info/policies');
      console.log('Leave policies API response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Get leave policies error:', error);
      // Return fallback policies
      return {
        success: true,
        data: {
          balances: {
            vacation: { annual: 21, description: 'Annual vacation days' },
            medical: { annual: 10, description: 'Sick leave days per year' },
            personal: { annual: 5, description: 'Personal time off days' },
            emergency: { annual: 3, description: 'Emergency leave days' },
            family: { annual: 12, description: 'Family care leave days' },
            bereavement: { annual: 5, description: 'Bereavement leave days' },
            study: { annual: 10, description: 'Professional development days' }
          },
          requirements: {
            medicalCertificate: {
              required: ['sick_leave', 'medical_procedure', 'recovery_leave', 'chronic_condition'],
              recommended: ['mental_health', 'emergency_medical'],
              threshold: 'Required for leaves exceeding 1 day'
            },
            advanceNotice: {
              routine: '2 weeks notice preferred',
              urgent: '48 hours notice minimum',
              emergency: 'Contact supervisor immediately, submit within 24 hours'
            }
          },
          approval: {
            supervisor: 'All leave requests require supervisor approval',
            hr: 'HR approval required for medical, family, and extended leaves (>5 days)',
            admin: 'Admin approval for sabbatical and extended unpaid leaves'
          }
        }
      };
    }
  },

  // Bulk operations
  bulkApprove: async (leaveIds, comments) => {
    try {
      const response = await api.post('/leave/bulk/approve', { leaveIds, comments });
      return response.data;
    } catch (error) {
      console.error('Bulk approve error:', error);
      throw error;
    }
  },

  bulkReject: async (leaveIds, comments) => {
    try {
      const response = await api.post('/leave/bulk/reject', { leaveIds, comments });
      return response.data;
    } catch (error) {
      console.error('Bulk reject error:', error);
      throw error;
    }
  },

  // Wellness tracking
  getEmployeeWellnessData: async (employeeId, timeframe = 12) => {
    try {
      const response = await api.get(`/leave/wellness/employee/${employeeId}`, {
        params: { timeframe }
      });
      return response.data;
    } catch (error) {
      console.error('Get employee wellness data error:', error);
      return { success: false, data: [] };
    }
  },

  getDepartmentWellnessData: async (department, timeframe = 12) => {
    try {
      const response = await api.get(`/leave/wellness/department/${department}`, {
        params: { timeframe }
      });
      return response.data;
    } catch (error) {
      console.error('Get department wellness data error:', error);
      return { success: false, data: [] };
    }
  },

  // Helper method to get leave category from type
  getLeaveCategory: (leaveType) => {
    const categoryMap = {
      // Medical
      'sick_leave': 'medical',
      'medical_appointment': 'medical',
      'emergency_medical': 'medical',
      'mental_health': 'medical',
      'medical_procedure': 'medical',
      'recovery_leave': 'medical',
      'chronic_condition': 'medical',
      
      // Vacation/Personal
      'annual_leave': 'vacation',
      'personal_time_off': 'personal',
      'floating_holiday': 'personal',
      'birthday_leave': 'personal',
      'wellness_day': 'personal',
      
      // Family
      'maternity_leave': 'maternity',
      'paternity_leave': 'paternity',
      'adoption_leave': 'family',
      'family_care': 'family',
      'child_sick_care': 'family',
      'elder_care': 'family',
      'parental_leave': 'family',
      
      // Emergency/Bereavement
      'emergency_leave': 'emergency',
      'bereavement_leave': 'bereavement',
      'funeral_leave': 'bereavement',
      'disaster_leave': 'emergency',
      
      // Study/Development
      'study_leave': 'study',
      'training_leave': 'study',
      'conference_leave': 'study',
      'examination_leave': 'study',
      
      // Special
      'sabbatical_leave': 'sabbatical',
      'compensatory_time': 'compensatory',
      'jury_duty': 'personal',
      'military_leave': 'personal',
      'volunteer_leave': 'personal',
      'unpaid_personal_leave': 'unpaid'
    };
    
    return categoryMap[leaveType] || 'personal';
  },

  // Helper method to check if medical certificate is required
  isMedicalCertificateRequired: (leaveType, totalDays = 1) => {
    const requiresCertificate = [
      'sick_leave',
      'medical_procedure', 
      'recovery_leave',
      'chronic_condition',
      'maternity_leave'
    ];

    const recommendedCertificate = [
      'mental_health',
      'emergency_medical'
    ];

    if (requiresCertificate.includes(leaveType)) {
      return totalDays > 1 ? 'required' : 'recommended';
    }

    if (recommendedCertificate.includes(leaveType)) {
      return 'recommended';
    }

    return 'not_required';
  },

  // Helper method to get leave type display name
  getLeaveTypeDisplay: (leaveType) => {
    const typeDisplayNames = {
      // Medical
      'sick_leave': 'Sick Leave',
      'medical_appointment': 'Medical Appointment',
      'emergency_medical': 'Emergency Medical Leave',
      'mental_health': 'Mental Health Leave',
      'medical_procedure': 'Medical Procedure',
      'recovery_leave': 'Recovery Leave',
      'chronic_condition': 'Chronic Condition Management',
      
      // Vacation/Personal
      'annual_leave': 'Annual Leave',
      'personal_time_off': 'Personal Time Off',
      'floating_holiday': 'Floating Holiday',
      'birthday_leave': 'Birthday Leave',
      'wellness_day': 'Wellness Day',
      
      // Family
      'maternity_leave': 'Maternity Leave',
      'paternity_leave': 'Paternity Leave',
      'adoption_leave': 'Adoption Leave',
      'family_care': 'Family Care Leave',
      'child_sick_care': 'Child Sick Care',
      'elder_care': 'Elder Care Leave',
      'parental_leave': 'Parental Leave',
      
      // Emergency/Bereavement
      'emergency_leave': 'Emergency Leave',
      'bereavement_leave': 'Bereavement Leave',
      'funeral_leave': 'Funeral Leave',
      'disaster_leave': 'Disaster Leave',
      
      // Study/Development
      'study_leave': 'Study Leave',
      'training_leave': 'Training Leave',
      'conference_leave': 'Conference Leave',
      'examination_leave': 'Examination Leave',
      
      // Special
      'sabbatical_leave': 'Sabbatical Leave',
      'compensatory_time': 'Compensatory Time',
      'jury_duty': 'Jury Duty',
      'military_leave': 'Military Leave',
      'volunteer_leave': 'Volunteer Leave',
      'unpaid_personal_leave': 'Unpaid Personal Leave'
    };
    
    return typeDisplayNames[leaveType] || leaveType?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown';
  },

  // Helper method to get leave category display name
  getLeaveCategoryDisplay: (leaveCategory) => {
    const categoryDisplayNames = {
      'medical': 'Medical Leave',
      'vacation': 'Vacation Leave',
      'personal': 'Personal Leave',
      'emergency': 'Emergency Leave',
      'family': 'Family Leave',
      'bereavement': 'Bereavement Leave',
      'study': 'Study Leave',
      'maternity': 'Maternity Leave',
      'paternity': 'Paternity Leave',
      'compensatory': 'Compensatory Time',
      'sabbatical': 'Sabbatical Leave',
      'unpaid': 'Unpaid Leave'
    };
    
    return categoryDisplayNames[leaveCategory] || leaveCategory?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown';
  },

  // Validation helpers
  validateLeaveRequest: (leaveData) => {
    const errors = [];

    if (!leaveData.leaveType) {
      errors.push('Leave type is required');
    }

    if (!leaveData.startDate || !leaveData.endDate) {
      errors.push('Leave dates are required');
    }

    if (!leaveData.reason || leaveData.reason.length < 10) {
      errors.push('Reason must be at least 10 characters long');
    }

    if (leaveData.startDate && leaveData.endDate) {
      const startDate = new Date(leaveData.startDate);
      const endDate = new Date(leaveData.endDate);
      
      if (startDate > endDate) {
        errors.push('Start date cannot be after end date');
      }

      // Allow past dates for emergency and medical leaves
      const allowPastDates = ['emergency_leave', 'sick_leave', 'emergency_medical'].includes(leaveData.leaveType);
      if (!allowPastDates && startDate < new Date().setHours(0, 0, 0, 0)) {
        errors.push('Leave cannot be scheduled for past dates (except for emergency/backdated requests)');
      }
    }

    // Medical leave specific validations
    const medicalLeaveTypes = ['sick_leave', 'medical_appointment', 'emergency_medical', 'mental_health', 'medical_procedure', 'recovery_leave', 'chronic_condition'];
    if (medicalLeaveTypes.includes(leaveData.leaveType)) {
      if (!leaveData.doctorName && leaveData.leaveType !== 'wellness_day') {
        errors.push('Doctor name is required for medical leaves');
      }
      
      if (!leaveData.hospitalName && leaveData.leaveType !== 'wellness_day') {
        errors.push('Hospital/clinic name is required for medical leaves');
      }
    }

    // Emergency contact validation
    if (!leaveData.emergencyContactName || !leaveData.emergencyContactPhone) {
      errors.push('Emergency contact information is required');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  },

  // API error handler helper
  handleApiError: (error) => {
    console.error('API Error:', error);
    
    if (error.response) {
      // Server responded with error status
      const status = error.response.status;
      const message = error.response.data?.message || 'Server error occurred';
      
      if (status === 401) {
        return { success: false, message: 'Authentication required. Please login again.' };
      } else if (status === 403) {
        return { success: false, message: 'Access denied. You do not have permission to perform this action.' };
      } else if (status === 404) {
        return { success: false, message: 'Requested resource not found.' };
      } else if (status === 422) {
        return { success: false, message: 'Invalid data provided.', errors: error.response.data?.errors };
      } else if (status >= 500) {
        return { success: false, message: 'Server error. Please try again later.' };
      } else {
        return { success: false, message };
      }
    } else if (error.request) {
      // Network error
      return { success: false, message: 'Network error. Please check your connection and try again.' };
    } else {
      // Other error
      return { success: false, message: error.message || 'An unexpected error occurred.' };
    }
  }
};

export default leaveApi;


