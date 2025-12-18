import api from './api';

export const actionItemAPI = {
  // Get action items with filters
  getActionItems: async (filters = {}) => {
    try {
      const response = await api.get('/action-items', { params: filters });
      return {
        success: true,
        data: response.data.data || [],
        pagination: response.data.pagination
      };
    } catch (error) {
      console.error('Error fetching action items:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch action items',
        data: []
      };
    }
  },

  // Get action item statistics
  getActionItemStats: async () => {
    try {
      const response = await api.get('/action-items/stats');
      return {
        success: true,
        data: response.data.data || {}
      };
    } catch (error) {
      console.error('Error fetching stats:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch statistics',
        data: {}
      };
    }
  },

  // Get single action item
  getActionItem: async (id) => {
    try {
      const response = await api.get(`/action-items/${id}`);
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('Error fetching action item:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch action item'
      };
    }
  },

  // Create action item
  createActionItem: async (data) => {
    try {
      const response = await api.post('/action-items', data);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      console.error('Error creating action item:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to create action item'
      };
    }
  },

  // Update action item
  updateActionItem: async (id, data) => {
    try {
      const response = await api.put(`/action-items/${id}`, data);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      console.error('Error updating action item:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update action item'
      };
    }
  },

  // Update progress
  updateProgress: async (id, progress) => {
    try {
      const response = await api.patch(`/action-items/${id}/progress`, { progress });
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      console.error('Error updating progress:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update progress'
      };
    }
  },

  // Update status
  updateStatus: async (id, status, notes = '') => {
    try {
      const response = await api.patch(`/action-items/${id}/status`, { status, notes });
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      console.error('Error updating status:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update status'
      };
    }
  },

  // Submit completion for current user (assignee)
  submitForCompletion: async (taskId, formData) => {
    try {
      const response = await api.post(
        `/action-items/${taskId}/assignee/submit-completion`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      console.error('Error submitting completion:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to submit completion'
      };
    }
  },

  // Approve completion for specific assignee
  approveCompletionForAssignee: async (taskId, assigneeId, grade, qualityNotes, comments) => {
    try {
      const response = await api.post(
        `/action-items/${taskId}/assignee/${assigneeId}/approve-completion`,
        {
          grade,
          qualityNotes,
          comments
        }
      );
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      console.error('Error approving completion:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to approve completion'
      };
    }
  },

  // Reject completion for specific assignee
  rejectCompletionForAssignee: async (taskId, assigneeId, comments) => {
    try {
      const response = await api.post(
        `/action-items/${taskId}/assignee/${assigneeId}/reject-completion`,
        {
          comments
        }
      );
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      console.error('Error rejecting completion:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to reject completion'
      };
    }
  },

  // Create personal task
  createPersonalTask: async (taskData) => {
    try {
      const response = await api.post('/action-items/personal', taskData);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      console.error('Error creating personal task:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to create personal task'
      };
    }
  },

  // Get milestone tasks
  getMilestoneTasks: async (milestoneId) => {
    try {
      const response = await api.get(`/action-items/milestone/${milestoneId}`);
      return {
        success: true,
        data: response.data.data || []
      };
    } catch (error) {
      console.error('Error fetching milestone tasks:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch milestone tasks',
        data: []
      };
    }
  },

  // Reassign task
  reassignTask: async (taskId, newAssignees) => {
    try {
      const response = await api.post(`/action-items/${taskId}/reassign`, {
        newAssignees
      });
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      console.error('Error reassigning task:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to reassign task'
      };
    }
  },

  // Approve/Reject creation
  processCreationApproval: async (id, decision, comments = '') => {
    try {
      const response = await api.post(`/action-items/${id}/approve-creation`, {
        decision,
        comments
      });
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      console.error('Error processing creation approval:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to process approval'
      };
    }
  },

  // Approve/Reject completion
  processCompletionApproval: async (id, decision, comments = '') => {
    try {
      const response = await api.post(`/action-items/${id}/approve-completion`, {
        decision,
        comments
      });
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      console.error('Error processing completion approval:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to process completion approval'
      };
    }
  },

  // Delete action item
  deleteActionItem: async (id) => {
    try {
      const response = await api.delete(`/action-items/${id}`);
      return {
        success: true,
        message: response.data.message
      };
    } catch (error) {
      console.error('Error deleting action item:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to delete action item'
      };
    }
  },

  // Get project action items
  getProjectActionItems: async (projectId) => {
    try {
      const response = await api.get(`/action-items/project/${projectId}`);
      return {
        success: true,
        data: response.data.data || [],
        project: response.data.project
      };
    } catch (error) {
      console.error('Error fetching project action items:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch project action items',
        data: []
      };
    }
  }
};