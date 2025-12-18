import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  Progress,
  Tag,
  Space,
  Typography,
  Row,
  Col,
  message,
  Tabs,
  Badge,
  Tooltip,
  Statistic,
  Upload,
  Spin,
  Alert,
  Rate,
  Divider,
  InputNumber,
  Radio,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ProjectOutlined,
  UserOutlined,
  ReloadOutlined,
  FlagOutlined,
  FileOutlined,
  UploadOutlined,
  PlayCircleOutlined,
  CheckOutlined,
  CloseOutlined,
  EyeOutlined,
  StarOutlined,
  TrophyOutlined 
} from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../../services/api';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

// API service wrapper for action items
const actionItemsAPI = {
  // Get action items with filters
  getActionItems: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `/action-items?${queryString}` : '/action-items';
    const response = await api.get(url);
    return response.data;
  },

  // Get statistics
  getStats: async () => {
    const response = await api.get('/action-items/stats');
    return response.data;
  },

  // Create personal task
  createPersonalTask: async (taskData) => {
    const response = await api.post('/action-items/personal', taskData);
    return response.data;
  },

  // Create milestone task (assigned to others)
  createMilestoneTask: async (taskData) => {
    const response = await api.post('/action-items/milestone/task', taskData);
    return response.data;
  },

  // Update task status
  updateTaskStatus: async (taskId, status) => {
    const response = await api.patch(`/action-items/${taskId}/status`, { status });
    return response.data;
  },

  // Submit for completion
  submitForCompletion: async (taskId, formData) => {
    const response = await api.post(
      `/action-items/${taskId}/assignee/submit-completion`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    );
    return response.data;
  },

  // Approve completion
  approveCompletion: async (taskId, assigneeId, approvalData) => {
    const response = await api.post(
      `/action-items/${taskId}/assignee/${assigneeId}/approve-completion`,
      approvalData
    );
    return response.data;
  },

  // Reject completion
  rejectCompletion: async (taskId, assigneeId, comments) => {
    const response = await api.post(
      `/action-items/${taskId}/assignee/${assigneeId}/reject-completion`,
      { comments }
    );
    return response.data;
  },

  // Delete task
  deleteTask: async (taskId) => {
    const response = await api.delete(`/action-items/${taskId}`);
    return response.data;
  }
};

// KPI API service
const kpiAPI = {
  // Get approved KPIs for linking
  getApprovedKPIs: async (userId) => {
    const response = await api.get(`/kpis/approved-for-linking?userId=${userId}`);
    return response.data;
  }
};

// Project API service
const projectAPI = {
  // Get active projects
  getActiveProjects: async () => {
    const response = await api.get('/projects/active');
    return response.data;
  },

  // Get user's milestones
  getMyMilestones: async () => {
    const response = await api.get('/projects/my-milestones');
    return response.data;
  }
};

// User API service
const userAPI = {
  // Get active users
  getActiveUsers: async () => {
    const response = await api.get('/auth/active-users');
    return response.data;
  },

  // Get user by email
  getUserByEmail: async (email) => {
    const response = await api.get(`/auth/user-by-email?email=${encodeURIComponent(email)}`);
    return response.data;
  }
};

const ActionItemsManagement = () => {
  const navigate = useNavigate();
  const [actionItems, setActionItems] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [submitCompletionModalVisible, setSubmitCompletionModalVisible] = useState(false);
  const [viewTaskModalVisible, setViewTaskModalVisible] = useState(false);
  const [approvalModalVisible, setApprovalModalVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [taskAssignmentType, setTaskAssignmentType] = useState('myself');
  const [selectedAssignee, setSelectedAssignee] = useState(null);
  const [availableKPIs, setAvailableKPIs] = useState([]);
  const [loadingKPIs, setLoadingKPIs] = useState(false);
  const [milestones, setMilestones] = useState([]);
  const [loadingMilestones, setLoadingMilestones] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState(null);
  const [remainingWeight, setRemainingWeight] = useState(100);
  const [activeTab, setActiveTab] = useState('my-tasks');
  const [stats, setStats] = useState({
    total: 0,
    notStarted: 0,
    inProgress: 0,
    completed: 0,
    onHold: 0,
    overdue: 0
  });
  const [form] = Form.useForm();
  const [completionForm] = Form.useForm();
  const [approvalForm] = Form.useForm();
  const [uploadingFiles, setUploadingFiles] = useState([]);
  const [submittingCompletion, setSubmittingCompletion] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);

  const userInfo = JSON.parse(localStorage.getItem('user') || '{}');
  const currentUserId = userInfo.userId || userInfo.id;
  const userRole = userInfo.role;

  useEffect(() => {
    loadInitialData();
  }, [activeTab]);

  const loadInitialData = async () => {
    await Promise.all([
      fetchActionItems(),
      fetchStats(),
      fetchProjects(),
      fetchUsers()
    ]);
  };

  const validateUserHasKPIs = (userId) => {
    if (!userId) return false;
    return availableKPIs.length > 0;
  };

  const getKPIValidationMessage = () => {
    if (!selectedAssignee) {
      return 'Please select who will work on this task first';
    }
    if (loadingKPIs) {
      return 'Loading KPIs...';
    }
    if (availableKPIs.length === 0) {
      return taskAssignmentType === 'myself'
        ? 'You have no approved KPIs. Please create and get your KPIs approved first.'
        : 'This user has no approved KPIs. They must create and get KPIs approved first.';
    }
    return 'Select at least one KPI';
  };

  const calculateKPIContribution = (taskWeight, grade) => {
    return (grade / 5) * taskWeight;
  };

  const formatMilestoneName = (milestone) => {
    return `${milestone.project.name} - ${milestone.milestone.title}`;
  };

  const fetchUserKPIs = async (userId) => {
    try {
      setLoadingKPIs(true);
      
      console.log('Fetching KPIs for user:', userId);
      
      let actualUserId = userId;
      
      // Handle fallback user IDs (emp_X_email format)
      if (typeof userId === 'string' && userId.startsWith('emp_')) {
        const emailMatch = userId.match(/emp_\d+_(.+)/);
        if (emailMatch && emailMatch[1]) {
          const email = emailMatch[1];
          console.log('Fallback user detected, searching by email:', email);
          
          try {
            const userResult = await userAPI.getUserByEmail(email);
            
            if (userResult.success && userResult.data) {
              actualUserId = userResult.data._id;
              console.log('✅ Found real user ID:', actualUserId);
            } else {
              message.error('This user is not registered in the system. They must register first.');
              setAvailableKPIs([]);
              setLoadingKPIs(false);
              return;
            }
          } catch (error) {
            console.error('Error finding user by email:', error);
            message.error('This user is not registered in the system. They must register first.');
            setAvailableKPIs([]);
            setLoadingKPIs(false);
            return;
          }
        }
      }
      
      const result = await kpiAPI.getApprovedKPIs(actualUserId);
      
      if (result.success && result.data && result.data.kpis) {
        console.log(`✅ Found ${result.data.kpis.length} approved KPIs`);
        
        const kpisWithDocId = result.data.kpis.map((kpi, index) => ({
          ...kpi,
          kpiDocId: result.data._id,
          kpiIndex: index
        }));
        
        setAvailableKPIs(kpisWithDocId);
        
        if (result.data.kpis.length === 0) {
          message.warning('This user has no approved KPIs for the current quarter');
        }
      } else {
        console.log('⚠️ No KPIs found:', result.message);
        setAvailableKPIs([]);
        message.warning(result.message || 'User has no approved KPIs. They must create and get KPIs approved first.');
      }
    } catch (error) {
      console.error('Error fetching KPIs:', error);
      message.error('Failed to fetch KPIs');
      setAvailableKPIs([]);
    } finally {
      setLoadingKPIs(false);
    }
  };

  const fetchMilestones = async () => {
    try {
      setLoadingMilestones(true);
      const result = await projectAPI.getMyMilestones();
      
      if (result.success) {
        console.log(`Loaded ${result.data.length} milestones`);
        setMilestones(result.data || []);
      } else {
        setMilestones([]);
      }
    } catch (error) {
      console.error('Error fetching milestones:', error);
      setMilestones([]);
    } finally {
      setLoadingMilestones(false);
    }
  };

  const handleAssignmentTypeChange = (e) => {
    const type = e.target.value;
    setTaskAssignmentType(type);
    
    if (type === 'myself') {
      setSelectedAssignee(currentUserId);
      fetchUserKPIs(currentUserId);
      form.setFieldsValue({ assignedTo: undefined });
    } else {
      setSelectedAssignee(null);
      setAvailableKPIs([]);
      form.setFieldsValue({ linkedKPIs: undefined });
    }
  };

  const handleAssigneeChange = async (userId) => {
    setSelectedAssignee(userId);
    
    if (typeof userId === 'string' && userId.startsWith('emp_')) {
      const emailMatch = userId.match(/emp_\d+_(.+)/);
      if (emailMatch && emailMatch[1]) {
        const email = emailMatch[1];
        const user = users.find(u => u.email === email);
        
        message.info(
          `Selected: ${user?.fullName}. Checking if they have approved KPIs...`,
          3
        );
      }
    }
    
    await fetchUserKPIs(userId);
    form.setFieldsValue({ linkedKPIs: undefined });
  };

  const handleMilestoneChange = (milestoneId) => {
    if (milestoneId) {
      const milestone = milestones.find(m => m.milestone._id === milestoneId);
      if (milestone) {
        const stats = milestone.milestone.taskStats;
        setSelectedMilestone(milestone);
        setRemainingWeight(stats?.weightRemaining || 100);
        
        if (stats?.weightRemaining <= 0) {
          message.error('This milestone has no remaining weight capacity');
          form.setFieldsValue({ milestoneId: undefined, taskWeight: undefined });
          setSelectedMilestone(null);
        }
      }
    } else {
      setSelectedMilestone(null);
      setRemainingWeight(100);
      form.setFieldsValue({ taskWeight: undefined });
    }
  };

  const fetchActionItems = async () => {
    try {
      setLoading(true);
      
      const params = {};
      
      if (activeTab === 'my-tasks') {
        params.view = 'my-tasks';
      } else if (activeTab === 'team-tasks') {
        params.view = 'team-tasks';
      } else if (activeTab === 'my-approvals') {
        params.view = 'my-approvals';
      }

      const result = await actionItemsAPI.getActionItems(params);

      if (result.success) {
        setActionItems(result.data || []);
      } else {
        message.error(result.message || 'Failed to fetch action items');
      }
    } catch (error) {
      console.error('Error fetching action items:', error);
      message.error('Failed to load action items');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const result = await actionItemsAPI.getStats();
      if (result.success) {
        setStats(result.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchProjects = async () => {
    try {
      const result = await projectAPI.getActiveProjects();
      if (result.success) {
        setProjects(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      setUsersLoading(true);
      
      try {
        const result = await userAPI.getActiveUsers();

        if (result.success && result.data && result.data.length > 0) {
          console.log(`✅ Loaded ${result.data.length} registered users from database`);
          setUsers(result.data);
          return;
        }
      } catch (error) {
        console.log('Database users not available, falling back to department structure');
      }

      // Fallback to department structure
      const { getAllEmployees } = require('../../utils/departmentStructure');
      const allEmployees = getAllEmployees();

      const formattedUsers = allEmployees
        .filter(emp => emp.name && emp.email && emp.name !== 'Field Technicians' && emp.name !== 'NOC Operators' && emp.name !== 'Site Supervisors')
        .map((emp, idx) => ({
          _id: `emp_${idx}_${emp.email}`,
          id: emp.email,
          fullName: emp.name,
          name: emp.name,
          email: emp.email,
          position: emp.position,
          department: emp.department,
          role: emp.role || 'employee',
          isActive: true,
          isRegistered: false
        }))
        .sort((a, b) => a.fullName.localeCompare(b.fullName));

      console.log(`⚠️ Loaded ${formattedUsers.length} users from department structure (may not be registered)`);
      setUsers(formattedUsers);
    } catch (error) {
      console.error('Error loading users:', error);
      setUsers([]);
    } finally {
      setUsersLoading(false);
    }
  };

  const handleStartTask = async (taskId) => {
    try {
      const result = await actionItemsAPI.updateTaskStatus(taskId, 'In Progress');

      if (result.success) {
        message.success('Task started! You can now work on it.');
        await fetchActionItems();
        await fetchStats();
      } else {
        message.error(result.message || 'Failed to start task');
      }
    } catch (error) {
      console.error('Error starting task:', error);
      message.error('Failed to start task');
    }
  };

  const handleSaveTask = async (values) => {
    try {
      setLoading(true);
      
      if (!values.linkedKPIs || values.linkedKPIs.length === 0) {
        message.error('Please select at least one KPI to link this task');
        setLoading(false);
        return;
      }

      if (values.milestoneId && !values.taskWeight) {
        message.error('Task weight is required when milestone is selected');
        setLoading(false);
        return;
      }

      if (values.milestoneId && values.taskWeight > remainingWeight) {
        message.error(`Task weight cannot exceed remaining capacity: ${remainingWeight}%`);
        setLoading(false);
        return;
      }

      const linkedKPIs = values.linkedKPIs.map(kpiIndex => {
        const kpi = availableKPIs[kpiIndex];
        
        return {
          kpiDocId: kpi.kpiDocId,
          kpiIndex: kpi.kpiIndex !== undefined ? kpi.kpiIndex : kpiIndex
        };
      });

      console.log('✅ Linked KPIs:', linkedKPIs);

      let actualAssigneeId = taskAssignmentType === 'myself' ? currentUserId : values.assignedTo;
      
      // Handle fallback users
      if (taskAssignmentType === 'other' && typeof actualAssigneeId === 'string' && actualAssigneeId.startsWith('emp_')) {
        const emailMatch = actualAssigneeId.match(/emp_\d+_(.+)/);
        if (emailMatch && emailMatch[1]) {
          const email = emailMatch[1];
          
          try {
            const userResult = await userAPI.getUserByEmail(email);
            
            if (userResult.success && userResult.data) {
              actualAssigneeId = userResult.data._id;
              console.log('✅ Using real user ID:', actualAssigneeId);
            } else {
              message.error('Selected user is not registered in the system');
              setLoading(false);
              return;
            }
          } catch (error) {
            console.error('Error finding user:', error);
            message.error('Failed to verify user. Please try again.');
            setLoading(false);
            return;
          }
        }
      }

      let result;
      
      if (taskAssignmentType === 'myself') {
        const taskData = {
          title: values.title,
          description: values.description,
          priority: values.priority,
          dueDate: values.dueDate.format('YYYY-MM-DD'),
          linkedKPIs: linkedKPIs,
          notes: values.notes || '',
          milestoneId: values.milestoneId || null,
          taskWeight: values.taskWeight || 0
        };
        
        result = await actionItemsAPI.createPersonalTask(taskData);
      } else {
        const taskData = {
          projectId: values.projectId || null,
          milestoneId: values.milestoneId || null,
          title: values.title,
          description: values.description,
          priority: values.priority,
          dueDate: values.dueDate.format('YYYY-MM-DD'),
          taskWeight: values.taskWeight || 0,
          assignedTo: [actualAssigneeId],
          linkedKPIs: linkedKPIs,
          notes: values.notes || ''
        };
        
        result = await actionItemsAPI.createMilestoneTask(taskData);
      }

      console.log('📤 Submitted task result:', result);

      if (result.success) {
        if (taskAssignmentType === 'myself') {
          message.success('Personal task created and sent to your supervisor for approval');
        } else {
          message.success('Task created and assigned successfully');
        }
        
        setModalVisible(false);
        form.resetFields();
        setTaskAssignmentType('myself');
        setSelectedAssignee(null);
        setAvailableKPIs([]);
        setSelectedMilestone(null);
        await fetchActionItems();
        await fetchStats();
      } else {
        message.error(result.message || 'Failed to create task');
      }
    } catch (error) {
      console.error('Error saving task:', error);
      message.error('Failed to save task');
    } finally {
      setLoading(false);
    }
  };

  const openSubmitCompletionModal = (task) => {
    const myAssignment = task.assignedTo.find(a => 
      a.user && (a.user._id === currentUserId || a.user.id === currentUserId)
    );
    
    setSelectedTask(task);
    setSelectedAssignee(myAssignment);
    completionForm.resetFields();
    setUploadingFiles([]);
    setSubmitCompletionModalVisible(true);
  };

  const handleSubmitForCompletion = async (values) => {
    try {
      console.log('📤 Submitting task for completion...', {
        taskId: selectedTask._id,
        filesCount: uploadingFiles.length,
        completionNotes: values.completionNotes
      });

      if (uploadingFiles.length === 0) {
        message.error('Please upload at least one document as proof of completion');
        return;
      }

      setSubmittingCompletion(true);

      const formData = new FormData();
      formData.append('completionNotes', values.completionNotes || '');

      // Verify files are being added correctly
      let filesAdded = 0;
      uploadingFiles.forEach(file => {
        if (file.originFileObj) {
          formData.append('documents', file.originFileObj);
          filesAdded++;
          console.log('✅ Added file:', file.name);
        } else {
          console.warn('⚠️ File missing originFileObj:', file.name);
        }
      });

      if (filesAdded === 0) {
        message.error('No valid files to upload. Please try adding files again.');
        setSubmittingCompletion(false);
        return;
      }

      console.log(`📎 Uploading ${filesAdded} files...`);

      const result = await actionItemsAPI.submitForCompletion(selectedTask._id, formData);

      console.log('✅ Submission result:', result);

      if (result.success) {
        message.success({
          content: 'Task submitted for completion approval! Your supervisor will review it.',
          duration: 5
        });
        
        // Close modal first
        setSubmitCompletionModalVisible(false);
        
        // Reset form and files
        setUploadingFiles([]);
        completionForm.resetFields();
        setSelectedTask(null);
        
        // Reload data with a small delay to ensure backend has processed
        setTimeout(async () => {
          await fetchActionItems();
          await fetchStats();
        }, 500);
      } else {
        message.error(result.message || 'Failed to submit task for completion');
        console.error('❌ Submission failed:', result);
      }
    } catch (error) {
      console.error('❌ Error submitting for completion:', error);
      
      // Show more specific error message
      if (error.response) {
        message.error(`Failed: ${error.response.data?.message || error.message}`);
      } else if (error.request) {
        message.error('Network error: Unable to reach server');
      } else {
        message.error('Failed to submit task for completion');
      }
    } finally {
      setSubmittingCompletion(false);
    }
  };

  const openApprovalModal = (task, assignee) => {
    setSelectedTask(task);
    setSelectedAssignee(assignee);
    approvalForm.resetFields();
    setApprovalModalVisible(true);
  };

  const handleApproveCompletion = async (values) => {
    try {
      const result = await actionItemsAPI.approveCompletion(
        selectedTask._id,
        selectedAssignee.user._id,
        {
          grade: values.grade,
          qualityNotes: values.qualityNotes,
          comments: values.comments
        }
      );

      if (result.success) {
        message.success(`Completion approved with grade ${values.grade}/5`);
        setApprovalModalVisible(false);
        await fetchActionItems();
        await fetchStats();
      } else {
        message.error(result.message || 'Failed to approve completion');
      }
    } catch (error) {
      console.error('Error approving completion:', error);
      message.error('Failed to approve completion');
    }
  };

  const handleRejectCompletion = async (assigneeUserId) => {
    Modal.confirm({
      title: 'Reject Completion',
      content: (
        <Input.TextArea 
          placeholder="Provide reason for rejection..." 
          id="rejection-reason"
        />
      ),
      onOk: async () => {
        const comments = document.getElementById('rejection-reason').value;
        if (!comments) {
          message.error('Please provide a reason for rejection');
          return;
        }

        try {
          const result = await actionItemsAPI.rejectCompletion(
            selectedTask._id,
            assigneeUserId,
            comments
          );

          if (result.success) {
            message.success('Completion rejected - sent back for revision');
            setApprovalModalVisible(false);
            await fetchActionItems();
            await fetchStats();
          } else {
            message.error(result.message || 'Failed to reject completion');
          }
        } catch (error) {
          console.error('Error rejecting completion:', error);
          message.error('Failed to reject completion');
        }
      }
    });
  };

  const openViewTaskModal = (task) => {
    setSelectedTask(task);
    setViewTaskModalVisible(true);
  };

  const openModal = (item = null) => {
    setEditingItem(item);
    setTaskAssignmentType('myself');
    setSelectedAssignee(currentUserId);
    setAvailableKPIs([]);
    setSelectedMilestone(null);
    setRemainingWeight(100);
    
    if (item) {
      form.setFieldsValue({
        title: item.title,
        description: item.description,
        priority: item.priority,
        dueDate: dayjs(item.dueDate),
        projectId: item.projectId?._id || undefined,
        milestoneId: item.milestoneId || undefined,
        taskWeight: item.taskWeight || undefined,
        notes: item.notes
      });
    } else {
      form.resetFields();
      fetchUserKPIs(currentUserId);
      fetchMilestones();
    }
    
    setModalVisible(true);
  };

  const handleDelete = (taskId) => {
    Modal.confirm({
      title: 'Delete Task',
      content: 'Are you sure you want to delete this task?',
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          const result = await actionItemsAPI.deleteTask(taskId);
          
          if (result.success) {
            message.success('Task deleted successfully');
            await fetchActionItems();
            await fetchStats();
          } else {
            message.error(result.message || 'Failed to delete task');
          }
        } catch (error) {
          console.error('Error deleting task:', error);
          message.error('Failed to delete task');
        }
      }
    });
  };

  const getPriorityColor = (priority) => {
    const colors = {
      'LOW': 'green',
      'MEDIUM': 'blue',
      'HIGH': 'orange',
      'CRITICAL': 'red'
    };
    return colors[priority] || 'default';
  };

  const getStatusColor = (status) => {
    const colors = {
      'Not Started': 'default',
      'In Progress': 'processing',
      'Pending Approval': 'warning',
      'Pending Completion Approval': 'cyan',
      'Completed': 'success',
      'On Hold': 'warning',
      'Rejected': 'error'
    };
    return colors[status] || 'default';
  };

  const isOverdue = (dueDate, status) => {
    if (status === 'Completed') return false;
    return dayjs(dueDate).isBefore(dayjs(), 'day');
  };

  const isAssignedToMe = (task) => {
    if (!task.assignedTo || !Array.isArray(task.assignedTo)) return false;
    return task.assignedTo.some(assignee => 
      assignee.user && (assignee.user._id === currentUserId || assignee.user.id === currentUserId)
    );
  };

  const getMyAssignment = (task) => {
    if (!task.assignedTo) return null;
    return task.assignedTo.find(a => 
      a.user && (a.user._id === currentUserId || a.user.id === currentUserId)
    );
  };

  const canStartTask = (task) => {
    if (!isAssignedToMe(task)) return false;
    return task.status === 'Not Started';
  };

  const canSubmitForCompletion = (task) => {
    if (!isAssignedToMe(task)) return false;
    const myAssignment = getMyAssignment(task);
    return task.status === 'In Progress' && 
           myAssignment && 
           myAssignment.completionStatus === 'pending';
  };

  const isSupervisor = (task) => {
    return task.supervisor && task.supervisor.email === userInfo.email;
  };

  const canApproveCompletion = (task) => {
    if (!isSupervisor(task)) return false;
    return task.status === 'Pending Completion Approval';
  };

  const uploadProps = {
    fileList: uploadingFiles,
    onChange: (info) => {
      setUploadingFiles(info.fileList);
    },
    onRemove: (file) => {
      setUploadingFiles(uploadingFiles.filter(f => f.uid !== file.uid));
    },
    beforeUpload: () => false,
    multiple: true
  };

  const columns = [
    {
      title: 'Task',
      key: 'task',
      render: (_, record) => (
        <div>
          <Text strong>{record.title}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.description?.substring(0, 50)}...
          </Text>
          <br />
          <Space size="small" wrap style={{ marginTop: 4 }}>
            {record.projectId && (
              <Tag size="small" color="blue" icon={<ProjectOutlined />}>
                {record.projectId.name}
              </Tag>
            )}
            {record.milestoneId && (
              <Tag size="small" color="purple" icon={<FlagOutlined />}>
                Milestone
              </Tag>
            )}
            {record.taskWeight > 0 && (
              <Tag size="small" color="gold">
                Weight: {record.taskWeight}%
              </Tag>
            )}
            {record.linkedKPIs && record.linkedKPIs.length > 0 && (
              <Tag size="small" color="orange" icon={<TrophyOutlined />}>
                {record.linkedKPIs.length} KPI{record.linkedKPIs.length > 1 ? 's' : ''}
              </Tag>
            )}
          </Space>
        </div>
      ),
      width: 320
    },
    {
      title: 'Assigned To',
      key: 'assignedTo',
      render: (_, record) => {
        if (!record.assignedTo || record.assignedTo.length === 0) {
          return <Text type="secondary">Unassigned</Text>;
        }
        
        return (
          <div>
            {record.assignedTo.map((assignee, idx) => (
              <div key={idx} style={{ marginBottom: 4 }}>
                <Text strong style={{ fontSize: '12px' }}>
                  {assignee.user?.fullName || 'Unknown'}
                </Text>
                <br />
                <Tag size="small" color={
                  assignee.completionStatus === 'approved' ? 'green' :
                  assignee.completionStatus === 'submitted' ? 'blue' :
                  assignee.completionStatus === 'rejected' ? 'red' :
                  'default'
                }>
                  {assignee.completionStatus}
                </Tag>
                {assignee.completionGrade?.score && (
                  <Tag size="small" color="gold" icon={<StarOutlined />}>
                    {assignee.completionGrade.score}/5
                  </Tag>
                )}
              </div>
            ))}
          </div>
        );
      },
      width: 180
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority) => (
        <Tag color={getPriorityColor(priority)} icon={<FlagOutlined />}>
          {priority}
        </Tag>
      ),
      width: 100
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={getStatusColor(status)}>
          {status}
        </Tag>
      ),
      width: 150
    },
    {
      title: 'Progress',
      key: 'progress',
      render: (_, record) => (
        <div style={{ width: 120 }}>
          <Progress 
            percent={record.progress || 0} 
            size="small"
            status={record.progress === 100 ? 'success' : 'active'}
          />
        </div>
      ),
      width: 130
    },
    {
      title: 'Due Date',
      key: 'dueDate',
      render: (_, record) => {
        const overdue = isOverdue(record.dueDate, record.status);
        return (
          <div>
            <Text type={overdue ? 'danger' : 'secondary'}>
              {dayjs(record.dueDate).format('MMM DD, YYYY')}
            </Text>
            {overdue && (
              <>
                <br />
                <Tag color="red" size="small">Overdue</Tag>
              </>
            )}
          </div>
        );
      },
      width: 120
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="small" wrap>
          <Tooltip title="View Details">
            <Button
              size="small"
              icon={<EyeOutlined />}
              onClick={() => openViewTaskModal(record)}
            />
          </Tooltip>
          
          {canStartTask(record) && (
            <Tooltip title="Start working on this task">
              <Button
                size="small"
                type="primary"
                icon={<PlayCircleOutlined />}
                onClick={() => handleStartTask(record._id)}
              >
                Start
              </Button>
            </Tooltip>
          )}
          
          {canSubmitForCompletion(record) && (
            <Tooltip title="Submit task for completion approval">
              <Button
                size="small"
                type="primary"
                icon={<CheckOutlined />}
                onClick={() => openSubmitCompletionModal(record)}
                style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
              >
                Submit
              </Button>
            </Tooltip>
          )}
          
          {canApproveCompletion(record) && (
            <Tooltip title="Review & Grade Completion">
              <Button
                size="small"
                type="primary"
                icon={<StarOutlined />}
                onClick={() => {
                  const submittedAssignee = record.assignedTo.find(a => a.completionStatus === 'submitted');
                  if (submittedAssignee) {
                    openApprovalModal(record, submittedAssignee);
                  }
                }}
                style={{ backgroundColor: '#1890ff', borderColor: '#1890ff' }}
              >
                Review
              </Button>
            </Tooltip>
          )}
          
          {record.status === 'Pending Approval' && (
            <Tooltip title="Awaiting supervisor approval">
              <Button size="small" type="dashed" disabled>
                Pending
              </Button>
            </Tooltip>
          )}
          
          {['Not Started', 'In Progress'].includes(record.status) && isSupervisor(record) && (
            <>
              <Tooltip title="Edit">
                <Button
                  size="small"
                  icon={<EditOutlined />}
                  onClick={() => openModal(record)}
                />
              </Tooltip>
              <Tooltip title="Delete">
                <Button
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => handleDelete(record._id)}
                />
              </Tooltip>
            </>
          )}
        </Space>
      ),
      width: 250,
      fixed: 'right'
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '24px'
        }}>
          <Title level={2} style={{ margin: 0 }}>
            <CheckCircleOutlined /> Action Items Management
          </Title>
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={loadInitialData}
              loading={loading}
            >
              Refresh
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => openModal()}
            >
              New Task
            </Button>
          </Space>
        </div>

        <Card size="small" style={{ marginBottom: '24px', backgroundColor: '#f0f8ff' }}>
          <Row gutter={16}>
            <Col xs={12} sm={8} md={4}>
              <Statistic
                title="Total Tasks"
                value={stats.total}
                prefix={<CheckCircleOutlined />}
              />
            </Col>
            <Col xs={12} sm={8} md={4}>
              <Statistic
                title="Not Started"
                value={stats.notStarted}
                valueStyle={{ color: '#8c8c8c' }}
              />
            </Col>
            <Col xs={12} sm={8} md={4}>
              <Statistic
                title="In Progress"
                value={stats.inProgress}
                valueStyle={{ color: '#1890ff' }}
              />
            </Col>
            <Col xs={12} sm={8} md={4}>
              <Statistic
                title="Completed"
                value={stats.completed}
                valueStyle={{ color: '#52c41a' }}
              />
            </Col>
            <Col xs={12} sm={8} md={4}>
              <Statistic
                title="On Hold"
                value={stats.onHold}
                valueStyle={{ color: '#faad14' }}
              />
            </Col>
            <Col xs={12} sm={8} md={4}>
              <Statistic
                title="Overdue"
                value={stats.overdue}
                valueStyle={{ color: '#f5222d' }}
              />
            </Col>
          </Row>
        </Card>

        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab}
          style={{ marginBottom: '16px' }}
        >
          <Tabs.TabPane 
            tab={
              <Badge count={stats.inProgress} size="small">
                <span>My Tasks</span>
              </Badge>
            } 
            key="my-tasks"
          />
          <Tabs.TabPane 
            tab="Team Tasks" 
            key="team-tasks"
          />
          {['supervisor', 'admin'].includes(userRole) && (
            <Tabs.TabPane 
              tab={
                <Badge count={actionItems.filter(t => t.status === 'Pending Approval' || t.status === 'Pending Completion Approval').length} size="small">
                  <span>My Approvals</span>
                </Badge>
              }
              key="my-approvals"
            />
          )}
        </Tabs>

        <Table
          columns={columns}
          dataSource={actionItems}
          loading={loading}
          rowKey="_id"
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `Total ${total} tasks`
          }}
          scroll={{ x: 1400 }}
          size="small"
        />
      </Card>

      {/* Create Task Modal */}
      <Modal
        title={<Space><PlusOutlined />Create New Task</Space>}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setTaskAssignmentType('myself');
          setSelectedAssignee(null);
          setAvailableKPIs([]);
          setSelectedMilestone(null);
          form.resetFields();
        }}
        footer={null}
        width={800}
        destroyOnClose
      >
        <Alert
          message="Task Creation Requirements"
          description="All tasks must be linked to at least one KPI. If assigning to another user, you become the supervisor for that task."
          type="info"
          showIcon
          style={{ marginBottom: '16px' }}
        />

        {availableKPIs.length === 0 && selectedAssignee && !loadingKPIs && (
          <Alert
            message="No Approved KPIs Found"
            description={
              <Space direction="vertical">
                <Text>
                  {taskAssignmentType === 'myself'
                    ? "You don't have any approved KPIs for the current quarter."
                    : `${users.find(u => u._id === selectedAssignee)?.fullName} doesn't have any approved KPIs for the current quarter.`}
                </Text>
                <Text strong>Required Actions:</Text>
                <ul style={{ marginBottom: 0, paddingLeft: 20 }}>
                  <li>Create quarterly KPIs</li>
                  <li>Submit KPIs for approval</li>
                  <li>Get supervisor approval</li>
                  <li>Return here to create tasks</li>
                </ul>
                {taskAssignmentType === 'myself' && (
                  <Button 
                    type="link" 
                    onClick={() => navigate('/employee/kpis')}
                    style={{ paddingLeft: 0 }}
                  >
                    Go to KPI Management →
                  </Button>
                )}
              </Space>
            }
            type="error"
            showIcon
            style={{ marginBottom: '16px' }}
          />
        )}

        <Form form={form} layout="vertical" onFinish={handleSaveTask}>
          <Form.Item label="Who will work on this task?">
            <Radio.Group value={taskAssignmentType} onChange={handleAssignmentTypeChange}>
              <Radio value="myself"><UserOutlined /> Assign to Myself</Radio>
              <Radio value="other"><UserOutlined /> Assign to Another User</Radio>
            </Radio.Group>
          </Form.Item>

          {taskAssignmentType === 'other' && (
            <Form.Item
              name="assignedTo"
              label="Assign To"
              rules={[{ required: true, message: 'Please select a user to assign' }]}
            >
              <Select
                placeholder="Select user to assign task"
                showSearch
                loading={usersLoading}
                onChange={handleAssigneeChange}
                filterOption={(input, option) => {
                  const usr = users.find(u => u._id === option.value);
                  if (!usr) return false;
                  return (
                    (usr.fullName || usr.name || '').toLowerCase().includes(input.toLowerCase()) ||
                    (usr.position || '').toLowerCase().includes(input.toLowerCase()) ||
                    (usr.department || '').toLowerCase().includes(input.toLowerCase())
                  );
                }}
              >
                {users.map(usr => (
                  <Option key={usr._id} value={usr._id}>
                    <div>
                      <Text strong>{usr.fullName || usr.name}</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        {usr.position || 'Employee'} | {usr.department}
                      </Text>
                    </div>
                  </Option>
                ))}
              </Select>
            </Form.Item>
          )}

          <Form.Item
            name="linkedKPIs"
            label={<Space><TrophyOutlined />Link to KPIs</Space>}
            rules={[{ required: true, message: 'Please select at least one KPI' }]}
            tooltip="Task completion will contribute to the selected KPIs"
          >
            <Select
              mode="multiple"
              placeholder={
                loadingKPIs 
                  ? "Loading KPIs..." 
                  : availableKPIs.length === 0
                  ? "No approved KPIs found"
                  : "Select KPIs to link"
              }
              loading={loadingKPIs}
              disabled={!selectedAssignee || loadingKPIs}
            >
              {availableKPIs.map((kpi, index) => (
                <Option key={index} value={index}>
                  <div>
                    <Text strong>{kpi.title}</Text>
                    <Tag color="blue" style={{ marginLeft: 8 }}>Weight: {kpi.weight}%</Tag>
                    <br />
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {kpi.description?.substring(0, 60)}...
                    </Text>
                  </div>
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Divider />

          <Form.Item name="title" label="Task Title" rules={[{ required: true }]}>
            <Input placeholder="e.g., Configure network infrastructure" />
          </Form.Item>

          <Form.Item name="description" label="Description" rules={[{ required: true }]}>
            <TextArea rows={3} />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="priority" label="Priority" rules={[{ required: true }]}>
                <Select>
                  <Option value="LOW">🟢 Low</Option>
                  <Option value="MEDIUM">🟡 Medium</Option>
                  <Option value="HIGH">🟠 High</Option>
                  <Option value="CRITICAL">🔴 Critical</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="dueDate" label="Due Date" rules={[{ required: true }]}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item>
            <Space>
              <Button onClick={() => setModalVisible(false)}>Cancel</Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                icon={<PlusOutlined />}
                disabled={availableKPIs.length === 0}
              >
                Create Task
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Submit Completion Modal */}
      <Modal
        title={<Space><CheckOutlined style={{ color: '#52c41a' }} />Submit Task for Completion</Space>}
        open={submitCompletionModalVisible}
        onCancel={() => {
          setSubmitCompletionModalVisible(false);
          completionForm.resetFields();
          setUploadingFiles([]);
        }}
        footer={null}
        width={600}
      >
        {selectedTask && (
          <>
            <Alert
              message="Task Completion Requirements"
              description="Please upload proof of completion (documents, screenshots, reports, etc.) and provide completion notes. Your supervisor will review and grade your submission."
              type="info"
              showIcon
              style={{ marginBottom: '16px' }}
            />

            <Card size="small" style={{ marginBottom: '16px', backgroundColor: '#f5f5f5' }}>
              <Text strong>Task: </Text><Text>{selectedTask.title}</Text>
              <br />
              <Text strong>Description: </Text><Text type="secondary">{selectedTask.description}</Text>
            </Card>

            <Form form={completionForm} layout="vertical" onFinish={handleSubmitForCompletion}>
              <Form.Item
                name="completionNotes"
                label="Completion Notes"
                rules={[{ required: true, message: 'Please provide completion notes' }]}
                tooltip="Describe what you accomplished and any important details"
              >
                <TextArea 
                  rows={4} 
                  placeholder="Describe what you completed, any challenges faced, outcomes achieved, etc."
                />
              </Form.Item>

              <Form.Item
                label={
                  <Space>
                    <FileOutlined />
                    Proof of Completion Documents
                    <Text type="danger">*</Text>
                  </Space>
                }
                required
                tooltip="Upload documents, screenshots, reports, or any proof of task completion"
              >
                <Upload {...uploadProps} listType="picture-card">
                  <div>
                    <UploadOutlined />
                    <div style={{ marginTop: 8 }}>Upload</div>
                  </div>
                </Upload>
                {uploadingFiles.length === 0 && (
                  <Text type="danger" style={{ fontSize: '12px' }}>
                    At least one document is required
                  </Text>
                )}
                {uploadingFiles.length > 0 && (
                  <Text type="success" style={{ fontSize: '12px' }}>
                    ✓ {uploadingFiles.length} file(s) ready to upload
                  </Text>
                )}
              </Form.Item>

              <Divider />

              <Form.Item>
                <Space>
                  <Button 
                    onClick={() => {
                      setSubmitCompletionModalVisible(false);
                      completionForm.resetFields();
                      setUploadingFiles([]);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={submittingCompletion}
                    icon={<CheckOutlined />}
                    disabled={uploadingFiles.length === 0}
                    style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
                  >
                    {submittingCompletion ? 'Submitting...' : 'Submit for Approval'}
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </>
        )}
      </Modal>

      {/* View Task Modal */}
      <Modal
        title={<Space><EyeOutlined />Task Details</Space>}
        open={viewTaskModalVisible}
        onCancel={() => {
          setViewTaskModalVisible(false);
          setSelectedTask(null);
        }}
        footer={[
          <Button key="close" onClick={() => setViewTaskModalVisible(false)}>
            Close
          </Button>
        ]}
        width={700}
      >
        {selectedTask && (
          <div>
            <Card size="small" style={{ marginBottom: '16px' }}>
              <Title level={4}>{selectedTask.title}</Title>
              <Text>{selectedTask.description}</Text>
              
              <Divider />
              
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Text strong>Priority: </Text>
                  <Tag color={getPriorityColor(selectedTask.priority)}>
                    {selectedTask.priority}
                  </Tag>
                </Col>
                <Col span={12}>
                  <Text strong>Status: </Text>
                  <Tag color={getStatusColor(selectedTask.status)}>
                    {selectedTask.status}
                  </Tag>
                </Col>
                <Col span={12}>
                  <Text strong>Due Date: </Text>
                  <Text>{dayjs(selectedTask.dueDate).format('MMM DD, YYYY')}</Text>
                </Col>
                <Col span={12}>
                  <Text strong>Progress: </Text>
                  <Progress percent={selectedTask.progress || 0} size="small" />
                </Col>
              </Row>
            </Card>

            {selectedTask.linkedKPIs && selectedTask.linkedKPIs.length > 0 && (
              <Card size="small" title={<Space><TrophyOutlined />Linked KPIs</Space>} style={{ marginBottom: '16px' }}>
                {selectedTask.linkedKPIs.map((kpi, idx) => (
                  <Tag key={idx} color="orange" style={{ marginBottom: '8px' }}>
                    {kpi.title}
                  </Tag>
                ))}
              </Card>
            )}

            {selectedTask.assignedTo && selectedTask.assignedTo.length > 0 && (
              <Card size="small" title="Assignees" style={{ marginBottom: '16px' }}>
                {selectedTask.assignedTo.map((assignee, idx) => (
                  <div key={idx} style={{ marginBottom: '12px' }}>
                    <Text strong>{assignee.user?.fullName || 'Unknown'}</Text>
                    <br />
                    <Space size="small" wrap>
                      <Tag color={
                        assignee.completionStatus === 'approved' ? 'green' :
                        assignee.completionStatus === 'submitted' ? 'blue' :
                        assignee.completionStatus === 'rejected' ? 'red' :
                        'default'
                      }>
                        {assignee.completionStatus}
                      </Tag>
                      {assignee.completionGrade?.score && (
                        <>
                          <Tag color="gold">
                            Grade: {assignee.completionGrade.score}/5
                          </Tag>
                          <Rate disabled value={assignee.completionGrade.score} style={{ fontSize: '14px' }} />
                        </>
                      )}
                    </Space>
                    {assignee.completionNotes && (
                      <>
                        <br />
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          Notes: {assignee.completionNotes}
                        </Text>
                      </>
                    )}
                  </div>
                ))}
              </Card>
            )}
          </div>
        )}
      </Modal>

      {/* Approval Modal */}
      <Modal
        title={<Space><StarOutlined style={{ color: '#faad14' }} />Review & Grade Task Completion</Space>}
        open={approvalModalVisible}
        onCancel={() => {
          setApprovalModalVisible(false);
          approvalForm.resetFields();
        }}
        footer={null}
        width={700}
      >
        {selectedTask && selectedAssignee && (
          <>
            <Alert
              message="Grading Guidelines"
              description={
                <div>
                  <p>Grade the task completion quality (1-5 stars):</p>
                  <ul style={{ marginBottom: 0 }}>
                    <li><strong>5 stars:</strong> Exceptional - Exceeded expectations</li>
                    <li><strong>4 stars:</strong> Excellent - Met all requirements with high quality</li>
                    <li><strong>3 stars:</strong> Good - Satisfactory completion</li>
                    <li><strong>2 stars:</strong> Fair - Needs improvement</li>
                    <li><strong>1 star:</strong> Poor - Significant issues</li>
                  </ul>
                </div>
              }
              type="info"
              showIcon
              style={{ marginBottom: '16px' }}
            />

            <Card size="small" style={{ marginBottom: '16px', backgroundColor: '#f5f5f5' }}>
              <Text strong>Task: </Text><Text>{selectedTask.title}</Text>
              <br />
              <Text strong>Completed by: </Text><Text>{selectedAssignee.user?.fullName}</Text>
              <br />
              <Text strong>Completion Notes: </Text>
              <Text type="secondary">{selectedAssignee.completionNotes || 'No notes provided'}</Text>
              
              {selectedAssignee.completionDocuments && selectedAssignee.completionDocuments.length > 0 && (
                <>
                  <Divider style={{ margin: '12px 0' }} />
                  <Text strong>Submitted Documents: </Text>
                  <div style={{ marginTop: '8px' }}>
                    {selectedAssignee.completionDocuments.map((doc, idx) => (
                      <Tag key={idx} icon={<FileOutlined />} color="blue">
                        <a href={doc.url} target="_blank" rel="noopener noreferrer">
                          {doc.filename}
                        </a>
                      </Tag>
                    ))}
                  </div>
                </>
              )}
            </Card>

            <Form form={approvalForm} layout="vertical" onFinish={handleApproveCompletion}>
              <Form.Item
                name="grade"
                label={<Space><StarOutlined />Task Completion Grade</Space>}
                rules={[{ required: true, message: 'Please provide a grade' }]}
              >
                <Rate allowHalf />
              </Form.Item>

              <Form.Item
                name="qualityNotes"
                label="Quality Assessment"
                tooltip="Evaluate the quality, completeness, and professionalism of the work"
              >
                <TextArea 
                  rows={3}
                  placeholder="Assess the quality of deliverables, attention to detail, professionalism, etc."
                />
              </Form.Item>

              <Form.Item
                name="comments"
                label="Additional Comments"
              >
                <TextArea 
                  rows={2}
                  placeholder="Any additional feedback or notes..."
                />
              </Form.Item>

              <Divider />

              <Form.Item>
                <Space>
                  <Button
                    onClick={() => {
                      setApprovalModalVisible(false);
                      approvalForm.resetFields();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    danger
                    icon={<CloseOutlined />}
                    onClick={() => handleRejectCompletion(selectedAssignee.user._id)}
                  >
                    Reject
                  </Button>
                  <Button
                    type="primary"
                    htmlType="submit"
                    icon={<CheckOutlined />}
                    style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
                  >
                    Approve & Grade
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </>
        )}
      </Modal>
    </div>
  );
};

export default ActionItemsManagement;










// import React, { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import {
//   Card,
//   Table,
//   Button,
//   Modal,
//   Form,
//   Input,
//   Select,
//   DatePicker,
//   Progress,
//   Tag,
//   Space,
//   Typography,
//   Row,
//   Col,
//   message,
//   Tabs,
//   Badge,
//   Tooltip,
//   Statistic,
//   Upload,
//   Spin,
//   Alert,
//   Rate,
//   Divider,
//   InputNumber,
//   Radio,
// } from 'antd';
// import {
//   PlusOutlined,
//   EditOutlined,
//   DeleteOutlined,
//   CheckCircleOutlined,
//   ClockCircleOutlined,
//   ProjectOutlined,
//   UserOutlined,
//   ReloadOutlined,
//   FlagOutlined,
//   FileOutlined,
//   UploadOutlined,
//   PlayCircleOutlined,
//   CheckOutlined,
//   CloseOutlined,
//   EyeOutlined,
//   StarOutlined,
//   TrophyOutlined 
// } from '@ant-design/icons';
// import dayjs from 'dayjs';
// import api from '../../services/api';

// const { Title, Text } = Typography;
// const { TextArea } = Input;
// const { Option } = Select;

// // API service wrapper for action items
// const actionItemsAPI = {
//   // Get action items with filters
//   getActionItems: async (params = {}) => {
//     const queryString = new URLSearchParams(params).toString();
//     const url = queryString ? `/action-items?${queryString}` : '/action-items';
//     const response = await api.get(url);
//     return response.data;
//   },

//   // Get statistics
//   getStats: async () => {
//     const response = await api.get('/action-items/stats');
//     return response.data;
//   },

//   // Create personal task
//   createPersonalTask: async (taskData) => {
//     const response = await api.post('/action-items/personal', taskData);
//     return response.data;
//   },

//   // Create milestone task (assigned to others)
//   createMilestoneTask: async (taskData) => {
//     const response = await api.post('/action-items/milestone/task', taskData);
//     return response.data;
//   },

//   // Update task status
//   updateTaskStatus: async (taskId, status) => {
//     const response = await api.patch(`/action-items/${taskId}/status`, { status });
//     return response.data;
//   },

//   // Submit for completion
//   submitForCompletion: async (taskId, formData) => {
//     const response = await api.post(
//       `/action-items/${taskId}/assignee/submit-completion`,
//       formData,
//       {
//         headers: {
//           'Content-Type': 'multipart/form-data'
//         }
//       }
//     );
//     return response.data;
//   },

//   // Approve completion
//   approveCompletion: async (taskId, assigneeId, approvalData) => {
//     const response = await api.post(
//       `/action-items/${taskId}/assignee/${assigneeId}/approve-completion`,
//       approvalData
//     );
//     return response.data;
//   },

//   // Reject completion
//   rejectCompletion: async (taskId, assigneeId, comments) => {
//     const response = await api.post(
//       `/action-items/${taskId}/assignee/${assigneeId}/reject-completion`,
//       { comments }
//     );
//     return response.data;
//   },

//   // Delete task
//   deleteTask: async (taskId) => {
//     const response = await api.delete(`/action-items/${taskId}`);
//     return response.data;
//   }
// };

// // KPI API service
// const kpiAPI = {
//   // Get approved KPIs for linking
//   getApprovedKPIs: async (userId) => {
//     const response = await api.get(`/kpis/approved-for-linking?userId=${userId}`);
//     return response.data;
//   }
// };

// // Project API service
// const projectAPI = {
//   // Get active projects
//   getActiveProjects: async () => {
//     const response = await api.get('/projects/active');
//     return response.data;
//   },

//   // Get user's milestones
//   getMyMilestones: async () => {
//     const response = await api.get('/projects/my-milestones');
//     return response.data;
//   }
// };

// // User API service
// const userAPI = {
//   // Get active users
//   getActiveUsers: async () => {
//     const response = await api.get('/auth/active-users');
//     return response.data;
//   },

//   // Get user by email
//   getUserByEmail: async (email) => {
//     const response = await api.get(`/auth/user-by-email?email=${encodeURIComponent(email)}`);
//     return response.data;
//   }
// };

// const ActionItemsManagement = () => {
//   const navigate = useNavigate();
//   const [actionItems, setActionItems] = useState([]);
//   const [projects, setProjects] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [modalVisible, setModalVisible] = useState(false);
//   const [submitCompletionModalVisible, setSubmitCompletionModalVisible] = useState(false);
//   const [viewTaskModalVisible, setViewTaskModalVisible] = useState(false);
//   const [approvalModalVisible, setApprovalModalVisible] = useState(false);
//   const [selectedTask, setSelectedTask] = useState(null);
//   const [taskAssignmentType, setTaskAssignmentType] = useState('myself');
//   const [selectedAssignee, setSelectedAssignee] = useState(null);
//   const [availableKPIs, setAvailableKPIs] = useState([]);
//   const [loadingKPIs, setLoadingKPIs] = useState(false);
//   const [milestones, setMilestones] = useState([]);
//   const [loadingMilestones, setLoadingMilestones] = useState(false);
//   const [selectedMilestone, setSelectedMilestone] = useState(null);
//   const [remainingWeight, setRemainingWeight] = useState(100);
//   const [activeTab, setActiveTab] = useState('my-tasks');
//   const [stats, setStats] = useState({
//     total: 0,
//     notStarted: 0,
//     inProgress: 0,
//     completed: 0,
//     onHold: 0,
//     overdue: 0
//   });
//   const [form] = Form.useForm();
//   const [completionForm] = Form.useForm();
//   const [approvalForm] = Form.useForm();
//   const [uploadingFiles, setUploadingFiles] = useState([]);
//   const [submittingCompletion, setSubmittingCompletion] = useState(false);
//   const [editingItem, setEditingItem] = useState(null);
//   const [users, setUsers] = useState([]);
//   const [usersLoading, setUsersLoading] = useState(false);

//   const userInfo = JSON.parse(localStorage.getItem('user') || '{}');
//   const currentUserId = userInfo.userId || userInfo.id;
//   const userRole = userInfo.role;

//   useEffect(() => {
//     loadInitialData();
//   }, [activeTab]);

//   const loadInitialData = async () => {
//     await Promise.all([
//       fetchActionItems(),
//       fetchStats(),
//       fetchProjects(),
//       fetchUsers()
//     ]);
//   };

//   const validateUserHasKPIs = (userId) => {
//     if (!userId) return false;
//     return availableKPIs.length > 0;
//   };

//   const getKPIValidationMessage = () => {
//     if (!selectedAssignee) {
//       return 'Please select who will work on this task first';
//     }
//     if (loadingKPIs) {
//       return 'Loading KPIs...';
//     }
//     if (availableKPIs.length === 0) {
//       return taskAssignmentType === 'myself'
//         ? 'You have no approved KPIs. Please create and get your KPIs approved first.'
//         : 'This user has no approved KPIs. They must create and get KPIs approved first.';
//     }
//     return 'Select at least one KPI';
//   };

//   const calculateKPIContribution = (taskWeight, grade) => {
//     return (grade / 5) * taskWeight;
//   };

//   const formatMilestoneName = (milestone) => {
//     return `${milestone.project.name} - ${milestone.milestone.title}`;
//   };

//   const fetchUserKPIs = async (userId) => {
//     try {
//       setLoadingKPIs(true);
      
//       console.log('Fetching KPIs for user:', userId);
      
//       let actualUserId = userId;
      
//       // Handle fallback user IDs (emp_X_email format)
//       if (typeof userId === 'string' && userId.startsWith('emp_')) {
//         const emailMatch = userId.match(/emp_\d+_(.+)/);
//         if (emailMatch && emailMatch[1]) {
//           const email = emailMatch[1];
//           console.log('Fallback user detected, searching by email:', email);
          
//           try {
//             const userResult = await userAPI.getUserByEmail(email);
            
//             if (userResult.success && userResult.data) {
//               actualUserId = userResult.data._id;
//               console.log('✅ Found real user ID:', actualUserId);
//             } else {
//               message.error('This user is not registered in the system. They must register first.');
//               setAvailableKPIs([]);
//               setLoadingKPIs(false);
//               return;
//             }
//           } catch (error) {
//             console.error('Error finding user by email:', error);
//             message.error('This user is not registered in the system. They must register first.');
//             setAvailableKPIs([]);
//             setLoadingKPIs(false);
//             return;
//           }
//         }
//       }
      
//       const result = await kpiAPI.getApprovedKPIs(actualUserId);
      
//       if (result.success && result.data && result.data.kpis) {
//         console.log(`✅ Found ${result.data.kpis.length} approved KPIs`);
        
//         const kpisWithDocId = result.data.kpis.map((kpi, index) => ({
//           ...kpi,
//           kpiDocId: result.data._id,
//           kpiIndex: index
//         }));
        
//         setAvailableKPIs(kpisWithDocId);
        
//         if (result.data.kpis.length === 0) {
//           message.warning('This user has no approved KPIs for the current quarter');
//         }
//       } else {
//         console.log('⚠️ No KPIs found:', result.message);
//         setAvailableKPIs([]);
//         message.warning(result.message || 'User has no approved KPIs. They must create and get KPIs approved first.');
//       }
//     } catch (error) {
//       console.error('Error fetching KPIs:', error);
//       message.error('Failed to fetch KPIs');
//       setAvailableKPIs([]);
//     } finally {
//       setLoadingKPIs(false);
//     }
//   };

//   const fetchMilestones = async () => {
//     try {
//       setLoadingMilestones(true);
//       const result = await projectAPI.getMyMilestones();
      
//       if (result.success) {
//         console.log(`Loaded ${result.data.length} milestones`);
//         setMilestones(result.data || []);
//       } else {
//         setMilestones([]);
//       }
//     } catch (error) {
//       console.error('Error fetching milestones:', error);
//       setMilestones([]);
//     } finally {
//       setLoadingMilestones(false);
//     }
//   };

//   const handleAssignmentTypeChange = (e) => {
//     const type = e.target.value;
//     setTaskAssignmentType(type);
    
//     if (type === 'myself') {
//       setSelectedAssignee(currentUserId);
//       fetchUserKPIs(currentUserId);
//       form.setFieldsValue({ assignedTo: undefined });
//     } else {
//       setSelectedAssignee(null);
//       setAvailableKPIs([]);
//       form.setFieldsValue({ linkedKPIs: undefined });
//     }
//   };

//   const handleAssigneeChange = async (userId) => {
//     setSelectedAssignee(userId);
    
//     if (typeof userId === 'string' && userId.startsWith('emp_')) {
//       const emailMatch = userId.match(/emp_\d+_(.+)/);
//       if (emailMatch && emailMatch[1]) {
//         const email = emailMatch[1];
//         const user = users.find(u => u.email === email);
        
//         message.info(
//           `Selected: ${user?.fullName}. Checking if they have approved KPIs...`,
//           3
//         );
//       }
//     }
    
//     await fetchUserKPIs(userId);
//     form.setFieldsValue({ linkedKPIs: undefined });
//   };

//   const handleMilestoneChange = (milestoneId) => {
//     if (milestoneId) {
//       const milestone = milestones.find(m => m.milestone._id === milestoneId);
//       if (milestone) {
//         const stats = milestone.milestone.taskStats;
//         setSelectedMilestone(milestone);
//         setRemainingWeight(stats?.weightRemaining || 100);
        
//         if (stats?.weightRemaining <= 0) {
//           message.error('This milestone has no remaining weight capacity');
//           form.setFieldsValue({ milestoneId: undefined, taskWeight: undefined });
//           setSelectedMilestone(null);
//         }
//       }
//     } else {
//       setSelectedMilestone(null);
//       setRemainingWeight(100);
//       form.setFieldsValue({ taskWeight: undefined });
//     }
//   };

//   const fetchActionItems = async () => {
//     try {
//       setLoading(true);
      
//       const params = {};
      
//       if (activeTab === 'my-tasks') {
//         params.view = 'my-tasks';
//       } else if (activeTab === 'team-tasks') {
//         params.view = 'team-tasks';
//       } else if (activeTab === 'my-approvals') {
//         params.view = 'my-approvals';
//       }

//       const result = await actionItemsAPI.getActionItems(params);

//       if (result.success) {
//         setActionItems(result.data || []);
//       } else {
//         message.error(result.message || 'Failed to fetch action items');
//       }
//     } catch (error) {
//       console.error('Error fetching action items:', error);
//       message.error('Failed to load action items');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const fetchStats = async () => {
//     try {
//       const result = await actionItemsAPI.getStats();
//       if (result.success) {
//         setStats(result.data);
//       }
//     } catch (error) {
//       console.error('Error fetching stats:', error);
//     }
//   };

//   const fetchProjects = async () => {
//     try {
//       const result = await projectAPI.getActiveProjects();
//       if (result.success) {
//         setProjects(result.data || []);
//       }
//     } catch (error) {
//       console.error('Error fetching projects:', error);
//     }
//   };

//   const fetchUsers = async () => {
//     try {
//       setUsersLoading(true);
      
//       try {
//         const result = await userAPI.getActiveUsers();

//         if (result.success && result.data && result.data.length > 0) {
//           console.log(`✅ Loaded ${result.data.length} registered users from database`);
//           setUsers(result.data);
//           return;
//         }
//       } catch (error) {
//         console.log('Database users not available, falling back to department structure');
//       }

//       // Fallback to department structure
//       const { getAllEmployees } = require('../../utils/departmentStructure');
//       const allEmployees = getAllEmployees();

//       const formattedUsers = allEmployees
//         .filter(emp => emp.name && emp.email && emp.name !== 'Field Technicians' && emp.name !== 'NOC Operators' && emp.name !== 'Site Supervisors')
//         .map((emp, idx) => ({
//           _id: `emp_${idx}_${emp.email}`,
//           id: emp.email,
//           fullName: emp.name,
//           name: emp.name,
//           email: emp.email,
//           position: emp.position,
//           department: emp.department,
//           role: emp.role || 'employee',
//           isActive: true,
//           isRegistered: false
//         }))
//         .sort((a, b) => a.fullName.localeCompare(b.fullName));

//       console.log(`⚠️ Loaded ${formattedUsers.length} users from department structure (may not be registered)`);
//       setUsers(formattedUsers);
//     } catch (error) {
//       console.error('Error loading users:', error);
//       setUsers([]);
//     } finally {
//       setUsersLoading(false);
//     }
//   };

//   const handleStartTask = async (taskId) => {
//     try {
//       const result = await actionItemsAPI.updateTaskStatus(taskId, 'In Progress');

//       if (result.success) {
//         message.success('Task started! You can now work on it.');
//         fetchActionItems();
//         fetchStats();
//       } else {
//         message.error(result.message || 'Failed to start task');
//       }
//     } catch (error) {
//       console.error('Error starting task:', error);
//       message.error('Failed to start task');
//     }
//   };

//   const handleSaveTask = async (values) => {
//     try {
//       setLoading(true);
      
//       if (!values.linkedKPIs || values.linkedKPIs.length === 0) {
//         message.error('Please select at least one KPI to link this task');
//         setLoading(false);
//         return;
//       }

//       if (values.milestoneId && !values.taskWeight) {
//         message.error('Task weight is required when milestone is selected');
//         setLoading(false);
//         return;
//       }

//       if (values.milestoneId && values.taskWeight > remainingWeight) {
//         message.error(`Task weight cannot exceed remaining capacity: ${remainingWeight}%`);
//         setLoading(false);
//         return;
//       }

//       const linkedKPIs = values.linkedKPIs.map(kpiIndex => {
//         const kpi = availableKPIs[kpiIndex];
        
//         return {
//           kpiDocId: kpi.kpiDocId,
//           kpiIndex: kpi.kpiIndex !== undefined ? kpi.kpiIndex : kpiIndex
//         };
//       });

//       console.log('✅ Linked KPIs:', linkedKPIs);

//       let actualAssigneeId = taskAssignmentType === 'myself' ? currentUserId : values.assignedTo;
      
//       // Handle fallback users
//       if (taskAssignmentType === 'other' && typeof actualAssigneeId === 'string' && actualAssigneeId.startsWith('emp_')) {
//         const emailMatch = actualAssigneeId.match(/emp_\d+_(.+)/);
//         if (emailMatch && emailMatch[1]) {
//           const email = emailMatch[1];
          
//           try {
//             const userResult = await userAPI.getUserByEmail(email);
            
//             if (userResult.success && userResult.data) {
//               actualAssigneeId = userResult.data._id;
//               console.log('✅ Using real user ID:', actualAssigneeId);
//             } else {
//               message.error('Selected user is not registered in the system');
//               setLoading(false);
//               return;
//             }
//           } catch (error) {
//             console.error('Error finding user:', error);
//             message.error('Failed to verify user. Please try again.');
//             setLoading(false);
//             return;
//           }
//         }
//       }

//       let result;
      
//       if (taskAssignmentType === 'myself') {
//         const taskData = {
//           title: values.title,
//           description: values.description,
//           priority: values.priority,
//           dueDate: values.dueDate.format('YYYY-MM-DD'),
//           linkedKPIs: linkedKPIs,
//           notes: values.notes || '',
//           milestoneId: values.milestoneId || null,
//           taskWeight: values.taskWeight || 0
//         };
        
//         result = await actionItemsAPI.createPersonalTask(taskData);
//       } else {
//         const taskData = {
//           projectId: values.projectId || null,
//           milestoneId: values.milestoneId || null,
//           title: values.title,
//           description: values.description,
//           priority: values.priority,
//           dueDate: values.dueDate.format('YYYY-MM-DD'),
//           taskWeight: values.taskWeight || 0,
//           assignedTo: [actualAssigneeId],
//           linkedKPIs: linkedKPIs,
//           notes: values.notes || ''
//         };
        
//         result = await actionItemsAPI.createMilestoneTask(taskData);
//       }

//       console.log('📤 Submitted task result:', result);

//       if (result.success) {
//         if (taskAssignmentType === 'myself') {
//           message.success('Personal task created and sent to your supervisor for approval');
//         } else {
//           message.success('Task created and assigned successfully');
//         }
        
//         setModalVisible(false);
//         form.resetFields();
//         setTaskAssignmentType('myself');
//         setSelectedAssignee(null);
//         setAvailableKPIs([]);
//         setSelectedMilestone(null);
//         fetchActionItems();
//         fetchStats();
//       } else {
//         message.error(result.message || 'Failed to create task');
//       }
//     } catch (error) {
//       console.error('Error saving task:', error);
//       message.error('Failed to save task');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const openSubmitCompletionModal = (task) => {
//     const myAssignment = task.assignedTo.find(a => 
//       a.user && (a.user._id === currentUserId || a.user.id === currentUserId)
//     );
    
//     setSelectedTask(task);
//     setSelectedAssignee(myAssignment);
//     completionForm.resetFields();
//     setUploadingFiles([]);
//     setSubmitCompletionModalVisible(true);
//   };

//   const handleSubmitForCompletion = async (values) => {
//     try {
//       if (uploadingFiles.length === 0) {
//         message.error('Please upload at least one document');
//         return;
//       }

//       setSubmittingCompletion(true);

//       const formData = new FormData();
//       formData.append('completionNotes', values.completionNotes || '');

//       uploadingFiles.forEach(file => {
//         if (file.originFileObj) {
//           formData.append('documents', file.originFileObj);
//         }
//       });

//       const result = await actionItemsAPI.submitForCompletion(selectedTask._id, formData);

//       if (result.success) {
//         message.success('Task submitted for completion approval!');
//         setSubmitCompletionModalVisible(false);
//         setUploadingFiles([]);
//         completionForm.resetFields();
//         setSelectedTask(null);
//         fetchActionItems();
//         fetchStats();
//       } else {
//         message.error(result.message || 'Failed to submit task for completion');
//       }
//     } catch (error) {
//       console.error('Error submitting for completion:', error);
//       message.error('Failed to submit task for completion');
//     } finally {
//       setSubmittingCompletion(false);
//     }
//   };

//   const openApprovalModal = (task, assignee) => {
//     setSelectedTask(task);
//     setSelectedAssignee(assignee);
//     approvalForm.resetFields();
//     setApprovalModalVisible(true);
//   };

//   const handleApproveCompletion = async (values) => {
//     try {
//       const result = await actionItemsAPI.approveCompletion(
//         selectedTask._id,
//         selectedAssignee.user._id,
//         {
//           grade: values.grade,
//           qualityNotes: values.qualityNotes,
//           comments: values.comments
//         }
//       );

//       if (result.success) {
//         message.success(`Completion approved with grade ${values.grade}/5`);
//         setApprovalModalVisible(false);
//         fetchActionItems();
//         fetchStats();
//       } else {
//         message.error(result.message || 'Failed to approve completion');
//       }
//     } catch (error) {
//       console.error('Error approving completion:', error);
//       message.error('Failed to approve completion');
//     }
//   };

//   const handleRejectCompletion = async (assigneeUserId) => {
//     Modal.confirm({
//       title: 'Reject Completion',
//       content: (
//         <Input.TextArea 
//           placeholder="Provide reason for rejection..." 
//           id="rejection-reason"
//         />
//       ),
//       onOk: async () => {
//         const comments = document.getElementById('rejection-reason').value;
//         if (!comments) {
//           message.error('Please provide a reason for rejection');
//           return;
//         }

//         try {
//           const result = await actionItemsAPI.rejectCompletion(
//             selectedTask._id,
//             assigneeUserId,
//             comments
//           );

//           if (result.success) {
//             message.success('Completion rejected - sent back for revision');
//             setApprovalModalVisible(false);
//             fetchActionItems();
//             fetchStats();
//           } else {
//             message.error(result.message || 'Failed to reject completion');
//           }
//         } catch (error) {
//           console.error('Error rejecting completion:', error);
//           message.error('Failed to reject completion');
//         }
//       }
//     });
//   };

//   const openViewTaskModal = (task) => {
//     setSelectedTask(task);
//     setViewTaskModalVisible(true);
//   };

//   const openModal = (item = null) => {
//     setEditingItem(item);
//     setTaskAssignmentType('myself');
//     setSelectedAssignee(currentUserId);
//     setAvailableKPIs([]);
//     setSelectedMilestone(null);
//     setRemainingWeight(100);
    
//     if (item) {
//       form.setFieldsValue({
//         title: item.title,
//         description: item.description,
//         priority: item.priority,
//         dueDate: dayjs(item.dueDate),
//         projectId: item.projectId?._id || undefined,
//         milestoneId: item.milestoneId || undefined,
//         taskWeight: item.taskWeight || undefined,
//         notes: item.notes
//       });
//     } else {
//       form.resetFields();
//       fetchUserKPIs(currentUserId);
//       fetchMilestones();
//     }
    
//     setModalVisible(true);
//   };

//   const handleDelete = (taskId) => {
//     Modal.confirm({
//       title: 'Delete Task',
//       content: 'Are you sure you want to delete this task?',
//       okText: 'Delete',
//       okType: 'danger',
//       onOk: async () => {
//         try {
//           const result = await actionItemsAPI.deleteTask(taskId);
          
//           if (result.success) {
//             message.success('Task deleted successfully');
//             fetchActionItems();
//             fetchStats();
//           } else {
//             message.error(result.message || 'Failed to delete task');
//           }
//         } catch (error) {
//           console.error('Error deleting task:', error);
//           message.error('Failed to delete task');
//         }
//       }
//     });
//   };

//   const getPriorityColor = (priority) => {
//     const colors = {
//       'LOW': 'green',
//       'MEDIUM': 'blue',
//       'HIGH': 'orange',
//       'CRITICAL': 'red'
//     };
//     return colors[priority] || 'default';
//   };

//   const getStatusColor = (status) => {
//     const colors = {
//       'Not Started': 'default',
//       'In Progress': 'processing',
//       'Pending Approval': 'warning',
//       'Pending Completion Approval': 'cyan',
//       'Completed': 'success',
//       'On Hold': 'warning',
//       'Rejected': 'error'
//     };
//     return colors[status] || 'default';
//   };

//   const isOverdue = (dueDate, status) => {
//     if (status === 'Completed') return false;
//     return dayjs(dueDate).isBefore(dayjs(), 'day');
//   };

//   const isAssignedToMe = (task) => {
//     if (!task.assignedTo || !Array.isArray(task.assignedTo)) return false;
//     return task.assignedTo.some(assignee => 
//       assignee.user && (assignee.user._id === currentUserId || assignee.user.id === currentUserId)
//     );
//   };

//   const getMyAssignment = (task) => {
//     if (!task.assignedTo) return null;
//     return task.assignedTo.find(a => 
//       a.user && (a.user._id === currentUserId || a.user.id === currentUserId)
//     );
//   };

//   const canStartTask = (task) => {
//     if (!isAssignedToMe(task)) return false;
//     return task.status === 'Not Started';
//   };

//   const canSubmitForCompletion = (task) => {
//     if (!isAssignedToMe(task)) return false;
//     const myAssignment = getMyAssignment(task);
//     return task.status === 'In Progress' && 
//            myAssignment && 
//            myAssignment.completionStatus === 'pending';
//   };

//   const isSupervisor = (task) => {
//     return task.supervisor && task.supervisor.email === userInfo.email;
//   };

//   const canApproveCompletion = (task) => {
//     if (!isSupervisor(task)) return false;
//     return task.status === 'Pending Completion Approval';
//   };

//   const uploadProps = {
//     fileList: uploadingFiles,
//     onChange: (info) => {
//       setUploadingFiles(info.fileList);
//     },
//     onRemove: (file) => {
//       setUploadingFiles(uploadingFiles.filter(f => f.uid !== file.uid));
//     },
//     beforeUpload: () => false,
//     multiple: true
//   };

//   const columns = [
//     {
//       title: 'Task',
//       key: 'task',
//       render: (_, record) => (
//         <div>
//           <Text strong>{record.title}</Text>
//           <br />
//           <Text type="secondary" style={{ fontSize: '12px' }}>
//             {record.description?.substring(0, 50)}...
//           </Text>
//           <br />
//           <Space size="small" wrap style={{ marginTop: 4 }}>
//             {record.projectId && (
//               <Tag size="small" color="blue" icon={<ProjectOutlined />}>
//                 {record.projectId.name}
//               </Tag>
//             )}
//             {record.milestoneId && (
//               <Tag size="small" color="purple" icon={<FlagOutlined />}>
//                 Milestone
//               </Tag>
//             )}
//             {record.taskWeight > 0 && (
//               <Tag size="small" color="gold">
//                 Weight: {record.taskWeight}%
//               </Tag>
//             )}
//             {record.linkedKPIs && record.linkedKPIs.length > 0 && (
//               <Tag size="small" color="orange" icon={<TrophyOutlined />}>
//                 {record.linkedKPIs.length} KPI{record.linkedKPIs.length > 1 ? 's' : ''}
//               </Tag>
//             )}
//           </Space>
//         </div>
//       ),
//       width: 320
//     },
//     {
//       title: 'Assigned To',
//       key: 'assignedTo',
//       render: (_, record) => {
//         if (!record.assignedTo || record.assignedTo.length === 0) {
//           return <Text type="secondary">Unassigned</Text>;
//         }
        
//         return (
//           <div>
//             {record.assignedTo.map((assignee, idx) => (
//               <div key={idx} style={{ marginBottom: 4 }}>
//                 <Text strong style={{ fontSize: '12px' }}>
//                   {assignee.user?.fullName || 'Unknown'}
//                 </Text>
//                 <br />
//                 <Tag size="small" color={
//                   assignee.completionStatus === 'approved' ? 'green' :
//                   assignee.completionStatus === 'submitted' ? 'blue' :
//                   assignee.completionStatus === 'rejected' ? 'red' :
//                   'default'
//                 }>
//                   {assignee.completionStatus}
//                 </Tag>
//                 {assignee.completionGrade?.score && (
//                   <Tag size="small" color="gold" icon={<StarOutlined />}>
//                     {assignee.completionGrade.score}/5
//                   </Tag>
//                 )}
//               </div>
//             ))}
//           </div>
//         );
//       },
//       width: 180
//     },
//     {
//       title: 'Priority',
//       dataIndex: 'priority',
//       key: 'priority',
//       render: (priority) => (
//         <Tag color={getPriorityColor(priority)} icon={<FlagOutlined />}>
//           {priority}
//         </Tag>
//       ),
//       width: 100
//     },
//     {
//       title: 'Status',
//       dataIndex: 'status',
//       key: 'status',
//       render: (status) => (
//         <Tag color={getStatusColor(status)}>
//           {status}
//         </Tag>
//       ),
//       width: 150
//     },
//     {
//       title: 'Progress',
//       key: 'progress',
//       render: (_, record) => (
//         <div style={{ width: 120 }}>
//           <Progress 
//             percent={record.progress || 0} 
//             size="small"
//             status={record.progress === 100 ? 'success' : 'active'}
//           />
//         </div>
//       ),
//       width: 130
//     },
//     {
//       title: 'Due Date',
//       key: 'dueDate',
//       render: (_, record) => {
//         const overdue = isOverdue(record.dueDate, record.status);
//         return (
//           <div>
//             <Text type={overdue ? 'danger' : 'secondary'}>
//               {dayjs(record.dueDate).format('MMM DD, YYYY')}
//             </Text>
//             {overdue && (
//               <>
//                 <br />
//                 <Tag color="red" size="small">Overdue</Tag>
//               </>
//             )}
//           </div>
//         );
//       },
//       width: 120
//     },
//     {
//       title: 'Actions',
//       key: 'actions',
//       render: (_, record) => (
//         <Space size="small" wrap>
//           <Tooltip title="View Details">
//             <Button
//               size="small"
//               icon={<EyeOutlined />}
//               onClick={() => openViewTaskModal(record)}
//             />
//           </Tooltip>
          
//           {canStartTask(record) && (
//             <Tooltip title="Start working on this task">
//               <Button
//                 size="small"
//                 type="primary"
//                 icon={<PlayCircleOutlined />}
//                 onClick={() => handleStartTask(record._id)}
//               >
//                 Start
//               </Button>
//             </Tooltip>
//           )}
          
//           {canSubmitForCompletion(record) && (
//             <Tooltip title="Submit task for completion approval">
//               <Button
//                 size="small"
//                 type="primary"
//                 icon={<CheckOutlined />}
//                 onClick={() => openSubmitCompletionModal(record)}
//                 style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
//               >
//                 Submit
//               </Button>
//             </Tooltip>
//           )}
          
//           {canApproveCompletion(record) && (
//             <Tooltip title="Review & Grade Completion">
//               <Button
//                 size="small"
//                 type="primary"
//                 icon={<StarOutlined />}
//                 onClick={() => {
//                   const submittedAssignee = record.assignedTo.find(a => a.completionStatus === 'submitted');
//                   if (submittedAssignee) {
//                     openApprovalModal(record, submittedAssignee);
//                   }
//                 }}
//                 style={{ backgroundColor: '#1890ff', borderColor: '#1890ff' }}
//               >
//                 Review
//               </Button>
//             </Tooltip>
//           )}
          
//           {record.status === 'Pending Approval' && (
//             <Tooltip title="Awaiting supervisor approval">
//               <Button size="small" type="dashed" disabled>
//                 Pending
//               </Button>
//             </Tooltip>
//           )}
          
//           {['Not Started', 'In Progress'].includes(record.status) && isSupervisor(record) && (
//             <>
//               <Tooltip title="Edit">
//                 <Button
//                   size="small"
//                   icon={<EditOutlined />}
//                   onClick={() => openModal(record)}
//                 />
//               </Tooltip>
//               <Tooltip title="Delete">
//                 <Button
//                   size="small"
//                   danger
//                   icon={<DeleteOutlined />}
//                   onClick={() => handleDelete(record._id)}
//                 />
//               </Tooltip>
//             </>
//           )}
//         </Space>
//       ),
//       width: 250,
//       fixed: 'right'
//     }
//   ];

//   return (
//     <div style={{ padding: '24px' }}>
//       <Card>
//         <div style={{ 
//           display: 'flex', 
//           justifyContent: 'space-between', 
//           alignItems: 'center',
//           marginBottom: '24px'
//         }}>
//           <Title level={2} style={{ margin: 0 }}>
//             <CheckCircleOutlined /> Action Items Management
//           </Title>
//           <Space>
//             <Button
//               icon={<ReloadOutlined />}
//               onClick={loadInitialData}
//               loading={loading}
//             >
//               Refresh
//             </Button>
//             <Button
//               type="primary"
//               icon={<PlusOutlined />}
//               onClick={() => openModal()}
//             >
//               New Task
//             </Button>
//           </Space>
//         </div>

//         <Card size="small" style={{ marginBottom: '24px', backgroundColor: '#f0f8ff' }}>
//           <Row gutter={16}>
//             <Col xs={12} sm={8} md={4}>
//               <Statistic
//                 title="Total Tasks"
//                 value={stats.total}
//                 prefix={<CheckCircleOutlined />}
//               />
//             </Col>
//             <Col xs={12} sm={8} md={4}>
//               <Statistic
//                 title="Not Started"
//                 value={stats.notStarted}
//                 valueStyle={{ color: '#8c8c8c' }}
//               />
//             </Col>
//             <Col xs={12} sm={8} md={4}>
//               <Statistic
//                 title="In Progress"
//                 value={stats.inProgress}
//                 valueStyle={{ color: '#1890ff' }}
//               />
//             </Col>
//             <Col xs={12} sm={8} md={4}>
//               <Statistic
//                 title="Completed"
//                 value={stats.completed}
//                 valueStyle={{ color: '#52c41a' }}
//               />
//             </Col>
//             <Col xs={12} sm={8} md={4}>
//               <Statistic
//                 title="On Hold"
//                 value={stats.onHold}
//                 valueStyle={{ color: '#faad14' }}
//               />
//             </Col>
//             <Col xs={12} sm={8} md={4}>
//               <Statistic
//                 title="Overdue"
//                 value={stats.overdue}
//                 valueStyle={{ color: '#f5222d' }}
//               />
//             </Col>
//           </Row>
//         </Card>

//         <Tabs 
//           activeKey={activeTab} 
//           onChange={setActiveTab}
//           style={{ marginBottom: '16px' }}
//         >
//           <Tabs.TabPane 
//             tab={
//               <Badge count={stats.inProgress} size="small">
//                 <span>My Tasks</span>
//               </Badge>
//             } 
//             key="my-tasks"
//           />
//           <Tabs.TabPane 
//             tab="Team Tasks" 
//             key="team-tasks"
//           />
//           {['supervisor', 'admin'].includes(userRole) && (
//             <Tabs.TabPane 
//               tab={
//                 <Badge count={actionItems.filter(t => t.status === 'Pending Approval' || t.status === 'Pending Completion Approval').length} size="small">
//                   <span>My Approvals</span>
//                 </Badge>
//               }
//               key="my-approvals"
//             />
//           )}
//         </Tabs>

//         <Table
//           columns={columns}
//           dataSource={actionItems}
//           loading={loading}
//           rowKey="_id"
//           pagination={{
//             showSizeChanger: true,
//             showQuickJumper: true,
//             showTotal: (total) => `Total ${total} tasks`
//           }}
//           scroll={{ x: 1400 }}
//           size="small"
//         />
//       </Card>

//       {/* Modals remain the same but use state values instead of fetching */}
//       {/* I'll include the key modals below */}
      
//       <Modal
//         title={<Space><PlusOutlined />Create New Task</Space>}
//         open={modalVisible}
//         onCancel={() => {
//           setModalVisible(false);
//           setTaskAssignmentType('myself');
//           setSelectedAssignee(null);
//           setAvailableKPIs([]);
//           setSelectedMilestone(null);
//           form.resetFields();
//         }}
//         footer={null}
//         width={800}
//         destroyOnClose
//       >
//         <Alert
//           message="Task Creation Requirements"
//           description="All tasks must be linked to at least one KPI. If assigning to another user, you become the supervisor for that task."
//           type="info"
//           showIcon
//           style={{ marginBottom: '16px' }}
//         />

//         {availableKPIs.length === 0 && selectedAssignee && !loadingKPIs && (
//           <Alert
//             message="No Approved KPIs Found"
//             description={
//               <Space direction="vertical">
//                 <Text>
//                   {taskAssignmentType === 'myself'
//                     ? "You don't have any approved KPIs for the current quarter."
//                     : `${users.find(u => u._id === selectedAssignee)?.fullName} doesn't have any approved KPIs for the current quarter.`}
//                 </Text>
//                 <Text strong>Required Actions:</Text>
//                 <ul style={{ marginBottom: 0, paddingLeft: 20 }}>
//                   <li>Create quarterly KPIs</li>
//                   <li>Submit KPIs for approval</li>
//                   <li>Get supervisor approval</li>
//                   <li>Return here to create tasks</li>
//                 </ul>
//                 {taskAssignmentType === 'myself' && (
//                   <Button 
//                     type="link" 
//                     onClick={() => navigate('/employee/kpis')}
//                     style={{ paddingLeft: 0 }}
//                   >
//                     Go to KPI Management →
//                   </Button>
//                 )}
//               </Space>
//             }
//             type="error"
//             showIcon
//             style={{ marginBottom: '16px' }}
//           />
//         )}

//         <Form form={form} layout="vertical" onFinish={handleSaveTask}>
//           <Form.Item label="Who will work on this task?">
//             <Radio.Group value={taskAssignmentType} onChange={handleAssignmentTypeChange}>
//               <Radio value="myself"><UserOutlined /> Assign to Myself</Radio>
//               <Radio value="other"><UserOutlined /> Assign to Another User</Radio>
//             </Radio.Group>
//           </Form.Item>

//           {taskAssignmentType === 'other' && (
//             <Form.Item
//               name="assignedTo"
//               label="Assign To"
//               rules={[{ required: true, message: 'Please select a user to assign' }]}
//             >
//               <Select
//                 placeholder="Select user to assign task"
//                 showSearch
//                 loading={usersLoading}
//                 onChange={handleAssigneeChange}
//                 filterOption={(input, option) => {
//                   const usr = users.find(u => u._id === option.value);
//                   if (!usr) return false;
//                   return (
//                     (usr.fullName || usr.name || '').toLowerCase().includes(input.toLowerCase()) ||
//                     (usr.position || '').toLowerCase().includes(input.toLowerCase()) ||
//                     (usr.department || '').toLowerCase().includes(input.toLowerCase())
//                   );
//                 }}
//               >
//                 {users.map(usr => (
//                   <Option key={usr._id} value={usr._id}>
//                     <div>
//                       <Text strong>{usr.fullName || usr.name}</Text>
//                       <br />
//                       <Text type="secondary" style={{ fontSize: '12px' }}>
//                         {usr.position || 'Employee'} | {usr.department}
//                       </Text>
//                     </div>
//                   </Option>
//                 ))}
//               </Select>
//             </Form.Item>
//           )}

//           <Form.Item
//             name="linkedKPIs"
//             label={<Space><TrophyOutlined />Link to KPIs</Space>}
//             rules={[{ required: true, message: 'Please select at least one KPI' }]}
//             tooltip="Task completion will contribute to the selected KPIs"
//           >
//             <Select
//               mode="multiple"
//               placeholder={
//                 loadingKPIs 
//                   ? "Loading KPIs..." 
//                   : availableKPIs.length === 0
//                   ? "No approved KPIs found"
//                   : "Select KPIs to link"
//               }
//               loading={loadingKPIs}
//               disabled={!selectedAssignee || loadingKPIs}
//             >
//               {availableKPIs.map((kpi, index) => (
//                 <Option key={index} value={index}>
//                   <div>
//                     <Text strong>{kpi.title}</Text>
//                     <Tag color="blue" style={{ marginLeft: 8 }}>Weight: {kpi.weight}%</Tag>
//                     <br />
//                     <Text type="secondary" style={{ fontSize: '12px' }}>
//                       {kpi.description?.substring(0, 60)}...
//                     </Text>
//                   </div>
//                 </Option>
//               ))}
//             </Select>
//           </Form.Item>

//           <Divider />

//           <Form.Item name="title" label="Task Title" rules={[{ required: true }]}>
//             <Input placeholder="e.g., Configure network infrastructure" />
//           </Form.Item>

//           <Form.Item name="description" label="Description" rules={[{ required: true }]}>
//             <TextArea rows={3} />
//           </Form.Item>

//           <Row gutter={16}>
//             <Col span={12}>
//               <Form.Item name="priority" label="Priority" rules={[{ required: true }]}>
//                 <Select>
//                   <Option value="LOW">🟢 Low</Option>
//                   <Option value="MEDIUM">🟡 Medium</Option>
//                   <Option value="HIGH">🟠 High</Option>
//                   <Option value="CRITICAL">🔴 Critical</Option>
//                 </Select>
//               </Form.Item>
//             </Col>
//             <Col span={12}>
//               <Form.Item name="dueDate" label="Due Date" rules={[{ required: true }]}>
//                 <DatePicker style={{ width: '100%' }} />
//               </Form.Item>
//             </Col>
//           </Row>

//           <Form.Item>
//             <Space>
//               <Button onClick={() => setModalVisible(false)}>Cancel</Button>
//               <Button
//                 type="primary"
//                 htmlType="submit"
//                 loading={loading}
//                 icon={<PlusOutlined />}
//                 disabled={availableKPIs.length === 0}
//               >
//                 Create Task
//               </Button>
//             </Space>
//           </Form.Item>
//         </Form>
//       </Modal>
//     </div>
//   );
// };

// export default ActionItemsManagement;








// import React, { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import {
//   Card,
//   Table,
//   Button,
//   Modal,
//   Form,
//   Input,
//   Select,
//   DatePicker,
//   Progress,
//   Tag,
//   Space,
//   Typography,
//   Row,
//   Col,
//   message,
//   Tabs,
//   Badge,
//   Tooltip,
//   Statistic,
//   Upload,
//   Spin,
//   Alert,
//   Rate,
//   Divider,
//   InputNumber,
//   Radio,

// } from 'antd';
// import {
//   PlusOutlined,
//   EditOutlined,
//   DeleteOutlined,
//   CheckCircleOutlined,
//   ClockCircleOutlined,
//   ProjectOutlined,
//   UserOutlined,
//   ReloadOutlined,
//   FlagOutlined,
//   FileOutlined,
//   UploadOutlined,
//   PlayCircleOutlined,
//   CheckOutlined,
//   CloseOutlined,
//   EyeOutlined,
//   StarOutlined,
//   TrophyOutlined 
// } from '@ant-design/icons';
// import dayjs from 'dayjs';

// const { Title, Text } = Typography;
// const { TextArea } = Input;
// const { Option } = Select;

// const ActionItemsManagement = () => {
//   const navigate = useNavigate();
//   const [actionItems, setActionItems] = useState([]);
//   const [projects, setProjects] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [modalVisible, setModalVisible] = useState(false);
//   const [submitCompletionModalVisible, setSubmitCompletionModalVisible] = useState(false);
//   const [viewTaskModalVisible, setViewTaskModalVisible] = useState(false);
//   const [approvalModalVisible, setApprovalModalVisible] = useState(false);
//   const [selectedTask, setSelectedTask] = useState(null);
//   const [taskAssignmentType, setTaskAssignmentType] = useState('myself'); // 'myself' or 'other'
//   const [selectedAssignee, setSelectedAssignee] = useState(null);
//   const [availableKPIs, setAvailableKPIs] = useState([]);
//   const [loadingKPIs, setLoadingKPIs] = useState(false);
//   const [milestones, setMilestones] = useState([]);
//   const [loadingMilestones, setLoadingMilestones] = useState(false);
//   const [selectedMilestone, setSelectedMilestone] = useState(null);
//   const [remainingWeight, setRemainingWeight] = useState(100);
//   const [activeTab, setActiveTab] = useState('my-tasks');
//   const [stats, setStats] = useState({
//     total: 0,
//     notStarted: 0,
//     inProgress: 0,
//     completed: 0,
//     onHold: 0,
//     overdue: 0
//   });
//   const [form] = Form.useForm();
//   const [completionForm] = Form.useForm();
//   const [approvalForm] = Form.useForm();
//   const [uploadingFiles, setUploadingFiles] = useState([]);
//   const [submittingCompletion, setSubmittingCompletion] = useState(false);
//   const [editingItem, setEditingItem] = useState(null);
//   const [users, setUsers] = useState([]);
//   const [usersLoading, setUsersLoading] = useState(false);
//   const [isAssigning, setIsAssigning] = useState(false);

//   const userInfo = JSON.parse(localStorage.getItem('user') || '{}');
//   const currentUserId = userInfo.userId || userInfo.id;
//   const userRole = userInfo.role;

//   useEffect(() => {
//     loadInitialData();
//   }, [activeTab]);

//   const loadInitialData = async () => {
//     await Promise.all([
//       fetchActionItems(),
//       fetchStats(),
//       fetchProjects(),
//       fetchUsers()
//     ]);
//   };

//   /**
//    * Validate if user has approved KPIs before allowing task creation
//    */
//   const validateUserHasKPIs = (userId) => {
//     if (!userId) return false;
//     return availableKPIs.length > 0;
//   };

//   /**
//    * Get validation message for KPI selection
//    */
//   const getKPIValidationMessage = () => {
//     if (!selectedAssignee) {
//       return 'Please select who will work on this task first';
//     }
//     if (loadingKPIs) {
//       return 'Loading KPIs...';
//     }
//     if (availableKPIs.length === 0) {
//       return taskAssignmentType === 'myself'
//         ? 'You have no approved KPIs. Please create and get your KPIs approved first.'
//         : 'This user has no approved KPIs. They must create and get KPIs approved first.';
//     }
//     return 'Select at least one KPI';
//   };

//   /**
//    * Calculate effective contribution to KPI based on grade
//    */
//   const calculateKPIContribution = (taskWeight, grade) => {
//     return (grade / 5) * taskWeight;
//   };

//   /**
//    * Format milestone display name
//    */
//   const formatMilestoneName = (milestone) => {
//     return `${milestone.project.name} - ${milestone.milestone.title}`;
//   };

//   // FIXED: fetchUserKPIs function
//   const fetchUserKPIs = async (userId) => {
//     try {
//       setLoadingKPIs(true);
//       const token = localStorage.getItem('token');
      
//       console.log('Fetching KPIs for user:', userId);
      
//       // NEW: Handle fallback user IDs (emp_X_email format)
//       let actualUserId = userId;
      
//       // If it's a fallback ID, extract email and find real user
//       if (typeof userId === 'string' && userId.startsWith('emp_')) {
//         const emailMatch = userId.match(/emp_\d+_(.+)/);
//         if (emailMatch && emailMatch[1]) {
//           const email = emailMatch[1];
//           console.log('Fallback user detected, searching by email:', email);
          
//           // Try to find real user by email
//           try {
//             const userResponse = await fetch(
//               `http://localhost:5001/api/auth/user-by-email?email=${encodeURIComponent(email)}`,
//               {
//                 headers: {
//                   'Authorization': `Bearer ${token}`,
//                   'Content-Type': 'application/json'
//                 }
//               }
//             );
            
//             if (userResponse.ok) {
//               const userResult = await userResponse.json();
//               if (userResult.success && userResult.data) {
//                 actualUserId = userResult.data._id;
//                 console.log('✅ Found real user ID:', actualUserId);
//               } else {
//                 message.error('This user is not registered in the system. They must register first.');
//                 setAvailableKPIs([]);
//                 setLoadingKPIs(false);
//                 return;
//               }
//             } else {
//               message.error('This user is not registered in the system. They must register first.');
//               setAvailableKPIs([]);
//               setLoadingKPIs(false);
//               return;
//             }
//           } catch (error) {
//             console.error('Error finding user by email:', error);
//             message.error('This user is not registered in the system. They must register first.');
//             setAvailableKPIs([]);
//             setLoadingKPIs(false);
//             return;
//           }
//         }
//       }
      
//       const response = await fetch(
//         `http://localhost:5001/api/kpis/approved-for-linking?userId=${actualUserId}`,
//         {
//           headers: {
//             'Authorization': `Bearer ${token}`,
//             'Content-Type': 'application/json'
//           }
//         }
//       );

//       const result = await response.json();
      
//       if (result.success && result.data && result.data.kpis) {
//         console.log(`✅ Found ${result.data.kpis.length} approved KPIs`);
        
//         // CRITICAL FIX: Store the parent document ID with each KPI
//         const kpisWithDocId = result.data.kpis.map((kpi, index) => ({
//           ...kpi,
//           kpiDocId: result.data._id, // Parent document ID
//           kpiIndex: index // Original index in the array
//         }));
        
//         setAvailableKPIs(kpisWithDocId);
        
//         if (result.data.kpis.length === 0) {
//           message.warning('This user has no approved KPIs for the current quarter');
//         }
//       } else {
//         console.log('⚠️ No KPIs found:', result.message);
//         setAvailableKPIs([]);
//         message.warning(result.message || 'User has no approved KPIs. They must create and get KPIs approved first.');
//       }
//     } catch (error) {
//       console.error('Error fetching KPIs:', error);
//       message.error('Failed to fetch KPIs');
//       setAvailableKPIs([]);
//     } finally {
//       setLoadingKPIs(false);
//     }
//   };

//   // NEW: Fetch available milestones
//   const fetchMilestones = async () => {
//     try {
//       setLoadingMilestones(true);
//       const token = localStorage.getItem('token');
      
//       const response = await fetch(
//         'http://localhost:5001/api/projects/my-milestones',
//         {
//           headers: {
//             'Authorization': `Bearer ${token}`,
//             'Content-Type': 'application/json'
//           }
//         }
//       );

//       const result = await response.json();
      
//       if (result.success) {
//         console.log(`Loaded ${result.data.length} milestones`);
//         setMilestones(result.data || []);
//       } else {
//         setMilestones([]);
//       }
//     } catch (error) {
//       console.error('Error fetching milestones:', error);
//       setMilestones([]);
//     } finally {
//       setLoadingMilestones(false);
//     }
//   };

//   // NEW: Handle assignment type change
//   const handleAssignmentTypeChange = (e) => {
//     const type = e.target.value;
//     setTaskAssignmentType(type);
    
//     if (type === 'myself') {
//       setSelectedAssignee(currentUserId);
//       fetchUserKPIs(currentUserId);
//       form.setFieldsValue({ assignedTo: undefined });
//     } else {
//       setSelectedAssignee(null);
//       setAvailableKPIs([]);
//       form.setFieldsValue({ linkedKPIs: undefined });
//     }
//   };

//   // // NEW: Handle assignee selection
//   // const handleAssigneeChange = (userId) => {
//   //   setSelectedAssignee(userId);
//   //   fetchUserKPIs(userId);
//   //   form.setFieldsValue({ linkedKPIs: undefined }); // Reset KPI selection
//   // };

//   // Handle assignee selection with fallback user support
//   const handleAssigneeChange = async (userId) => {
//     setSelectedAssignee(userId);
    
//     // NEW: If it's a fallback user, check if they exist in the system first
//     if (typeof userId === 'string' && userId.startsWith('emp_')) {
//       const emailMatch = userId.match(/emp_\d+_(.+)/);
//       if (emailMatch && emailMatch[1]) {
//         const email = emailMatch[1];
//         const user = users.find(u => u.email === email);
        
//         message.info(
//           `Selected: ${user?.fullName}. Checking if they have approved KPIs...`,
//           3
//         );
//       }
//     }
    
//     // Fetch KPIs (function now handles fallback users internally)
//     await fetchUserKPIs(userId);
    
//     // Reset KPI selection
//     form.setFieldsValue({ linkedKPIs: undefined });
//   };

//   // NEW: Handle milestone selection
//   const handleMilestoneChange = (milestoneId) => {
//     if (milestoneId) {
//       const milestone = milestones.find(m => m.milestone._id === milestoneId);
//       if (milestone) {
//         const stats = milestone.milestone.taskStats;
//         setSelectedMilestone(milestone);
//         setRemainingWeight(stats?.weightRemaining || 100);
        
//         if (stats?.weightRemaining <= 0) {
//           message.error('This milestone has no remaining weight capacity');
//           form.setFieldsValue({ milestoneId: undefined, taskWeight: undefined });
//           setSelectedMilestone(null);
//         }
//       }
//     } else {
//       setSelectedMilestone(null);
//       setRemainingWeight(100);
//       form.setFieldsValue({ taskWeight: undefined });
//     }
//   };

//   const fetchActionItems = async () => {
//     try {
//       setLoading(true);
//       const token = localStorage.getItem('token');
      
//       let url = 'http://localhost:5001/api/action-items';
//       const params = new URLSearchParams();
      
//       if (activeTab === 'my-tasks') {
//         params.append('view', 'my-tasks');
//       } else if (activeTab === 'team-tasks') {
//         params.append('view', 'team-tasks');
//       } else if (activeTab === 'my-approvals') {
//         params.append('view', 'my-approvals');
//       }

//       if (params.toString()) {
//         url += `?${params.toString()}`;
//       }

//       const response = await fetch(url, {
//         headers: {
//           'Authorization': `Bearer ${token}`,
//           'Content-Type': 'application/json'
//         }
//       });

//       const result = await response.json();

//       if (result.success) {
//         setActionItems(result.data || []);
//       } else {
//         message.error(result.message || 'Failed to fetch action items');
//       }
//     } catch (error) {
//       console.error('Error fetching action items:', error);
//       message.error('Failed to load action items');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const fetchStats = async () => {
//     try {
//       const token = localStorage.getItem('token');
//       const response = await fetch('http://localhost:5001/api/action-items/stats', {
//         headers: {
//           'Authorization': `Bearer ${token}`
//         }
//       });

//       const result = await response.json();
//       if (result.success) {
//         setStats(result.data);
//       }
//     } catch (error) {
//       console.error('Error fetching stats:', error);
//     }
//   };

//   const fetchProjects = async () => {
//     try {
//       const token = localStorage.getItem('token');
//       const response = await fetch('http://localhost:5001/api/projects/active', {
//         headers: {
//           'Authorization': `Bearer ${token}`
//         }
//       });

//       const result = await response.json();
//       if (result.success) {
//         setProjects(result.data || []);
//       }
//     } catch (error) {
//       console.error('Error fetching projects:', error);
//     }
//   };

//   const fetchUsers = async () => {
//     try {
//       setUsersLoading(true);
      
//       // Try to fetch from active users endpoint
//       try {
//         const response = await fetch('http://localhost:5001/api/auth/active-users', {
//           headers: {
//             'Authorization': `Bearer ${localStorage.getItem('token')}`,
//             'Content-Type': 'application/json'
//           }
//         });

//         if (response.ok) {
//           const result = await response.json();
//           if (result.success && result.data && result.data.length > 0) {
//             console.log(`✅ Loaded ${result.data.length} registered users from database`);
//             setUsers(result.data);
//             return;
//           }
//         }
//       } catch (error) {
//         console.log('Database users not available, falling back to department structure');
//       }

//       // Fallback to department structure
//       const { getAllEmployees } = require('../../utils/departmentStructure');
//       const allEmployees = getAllEmployees();

//       const formattedUsers = allEmployees
//         .filter(emp => emp.name && emp.email && emp.name !== 'Field Technicians' && emp.name !== 'NOC Operators' && emp.name !== 'Site Supervisors')
//         .map((emp, idx) => ({
//           _id: `emp_${idx}_${emp.email}`,
//           id: emp.email,
//           fullName: emp.name,
//           name: emp.name,
//           email: emp.email,
//           position: emp.position,
//           department: emp.department,
//           role: emp.role || 'employee',
//           isActive: true,
//           isRegistered: false // Mark as not registered
//         }))
//         .sort((a, b) => a.fullName.localeCompare(b.fullName));

//       console.log(`⚠️ Loaded ${formattedUsers.length} users from department structure (may not be registered)`);
//       setUsers(formattedUsers);
//     } catch (error) {
//       console.error('Error loading users:', error);
//       setUsers([]);
//     } finally {
//       setUsersLoading(false);
//     }
//   };


//   const handleStartTask = async (taskId) => {
//     try {
//       const token = localStorage.getItem('token');
//       const response = await fetch(`http://localhost:5001/api/action-items/${taskId}/status`, {
//         method: 'PATCH',
//         headers: {
//           'Authorization': `Bearer ${token}`,
//           'Content-Type': 'application/json'
//         },
//         body: JSON.stringify({ status: 'In Progress' })
//       });

//       const result = await response.json();
//       if (result.success) {
//         message.success('Task started! You can now work on it.');
//         fetchActionItems();
//         fetchStats();
//       } else {
//         message.error(result.message || 'Failed to start task');
//       }
//     } catch (error) {
//       console.error('Error starting task:', error);
//       message.error('Failed to start task');
//     }
//   };


//   const handleSaveTask = async (values) => {
//     try {
//       setLoading(true);
      
//       // Validate KPI selection
//       if (!values.linkedKPIs || values.linkedKPIs.length === 0) {
//         message.error('Please select at least one KPI to link this task');
//         setLoading(false);
//         return;
//       }

//       // Validate task weight if milestone selected
//       if (values.milestoneId && !values.taskWeight) {
//         message.error('Task weight is required when milestone is selected');
//         setLoading(false);
//         return;
//       }

//       if (values.milestoneId && values.taskWeight > remainingWeight) {
//         message.error(`Task weight cannot exceed remaining capacity: ${remainingWeight}%`);
//         setLoading(false);
//         return;
//       }

//       const token = localStorage.getItem('token');
      
//       // CRITICAL FIX: Build linked KPIs array correctly
//       const linkedKPIs = values.linkedKPIs.map(kpiIndex => {
//         const kpi = availableKPIs[kpiIndex];
        
//         return {
//           kpiDocId: kpi.kpiDocId, // Already stored from fetchUserKPIs
//           kpiIndex: kpi.kpiIndex !== undefined ? kpi.kpiIndex : kpiIndex // Use stored index
//         };
//       });

//       console.log('✅ Linked KPIs:', linkedKPIs);

//       // Determine actual user ID (handle fallback users)
//       let actualAssigneeId = taskAssignmentType === 'myself' ? currentUserId : values.assignedTo;
      
//       // NEW: If assigning to fallback user, get their real ID
//       if (taskAssignmentType === 'other' && typeof actualAssigneeId === 'string' && actualAssigneeId.startsWith('emp_')) {
//         const emailMatch = actualAssigneeId.match(/emp_\d+_(.+)/);
//         if (emailMatch && emailMatch[1]) {
//           const email = emailMatch[1];
          
//           try {
//             const userResponse = await fetch(
//               `http://localhost:5001/api/auth/user-by-email?email=${encodeURIComponent(email)}`,
//               {
//                 headers: {
//                   'Authorization': `Bearer ${token}`,
//                   'Content-Type': 'application/json'
//                 }
//               }
//             );
            
//             if (userResponse.ok) {
//               const userResult = await userResponse.json();
//               if (userResult.success && userResult.data) {
//                 actualAssigneeId = userResult.data._id;
//                 console.log('✅ Using real user ID:', actualAssigneeId);
//               } else {
//                 message.error('Selected user is not registered in the system');
//                 setLoading(false);
//                 return;
//               }
//             } else {
//               message.error('Selected user is not registered in the system');
//               setLoading(false);
//               return;
//             }
//           } catch (error) {
//             console.error('Error finding user:', error);
//             message.error('Failed to verify user. Please try again.');
//             setLoading(false);
//             return;
//           }
//         }
//       }

//       // Determine endpoint and task data based on assignment type
//       let endpoint, taskData;
      
//       if (taskAssignmentType === 'myself') {
//         // Personal task (self-assigned)
//         endpoint = 'http://localhost:5001/api/action-items/personal';
//         taskData = {
//           title: values.title,
//           description: values.description,
//           priority: values.priority,
//           dueDate: values.dueDate.format('YYYY-MM-DD'),
//           linkedKPIs: linkedKPIs,
//           notes: values.notes || '',
//           milestoneId: values.milestoneId || null,
//           taskWeight: values.taskWeight || 0
//         };
//       } else {
//         // Assigned to another user (becomes supervisor task)
//         endpoint = 'http://localhost:5001/api/action-items/milestone/task';
//         taskData = {
//           projectId: values.projectId || null,
//           milestoneId: values.milestoneId || null,
//           title: values.title,
//           description: values.description,
//           priority: values.priority,
//           dueDate: values.dueDate.format('YYYY-MM-DD'),
//           taskWeight: values.taskWeight || 0,
//           assignedTo: [actualAssigneeId], // Use real user ID
//           linkedKPIs: linkedKPIs,
//           notes: values.notes || ''
//         };
//       }

//       console.log('📤 Submitting task:', taskData);

//       const response = await fetch(endpoint, {
//         method: 'POST',
//         headers: {
//           'Authorization': `Bearer ${token}`,
//           'Content-Type': 'application/json'
//         },
//         body: JSON.stringify(taskData)
//       });

//       const result = await response.json();

//       if (result.success) {
//         if (taskAssignmentType === 'myself') {
//           message.success('Personal task created and sent to your supervisor for approval');
//         } else {
//           message.success('Task created and assigned successfully');
//         }
        
//         setModalVisible(false);
//         form.resetFields();
//         setTaskAssignmentType('myself');
//         setSelectedAssignee(null);
//         setAvailableKPIs([]);
//         setSelectedMilestone(null);
//         fetchActionItems();
//         fetchStats();
//       } else {
//         message.error(result.message || 'Failed to create task');
//       }
//     } catch (error) {
//       console.error('Error saving task:', error);
//       message.error('Failed to save task');
//     } finally {
//       setLoading(false);
//     }
//   };



//   const openSubmitCompletionModal = (task) => {
//     const myAssignment = task.assignedTo.find(a => 
//       a.user && (a.user._id === currentUserId || a.user.id === currentUserId)
//     );
    
//     setSelectedTask(task);
//     setSelectedAssignee(myAssignment);
//     completionForm.resetFields();
//     setUploadingFiles([]);
//     setSubmitCompletionModalVisible(true);
//   };

//   const handleSubmitForCompletion = async (values) => {
//     try {
//       if (uploadingFiles.length === 0) {
//         message.error('Please upload at least one document');
//         return;
//       }

//       setSubmittingCompletion(true);

//       const formData = new FormData();
//       formData.append('completionNotes', values.completionNotes || '');

//       uploadingFiles.forEach(file => {
//         if (file.originFileObj) {
//           formData.append('documents', file.originFileObj);
//         }
//       });

//       const token = localStorage.getItem('token');
//       const response = await fetch(
//         `http://localhost:5001/api/action-items/${selectedTask._id}/assignee/submit-completion`,
//         {
//           method: 'POST',
//           headers: {
//             'Authorization': `Bearer ${token}`
//           },
//           body: formData
//         }
//       );

//       const result = await response.json();

//       if (result.success) {
//         message.success('Task submitted for completion approval!');
//         setSubmitCompletionModalVisible(false);
//         setUploadingFiles([]);
//         completionForm.resetFields();
//         setSelectedTask(null);
//         fetchActionItems();
//         fetchStats();
//       } else {
//         message.error(result.message || 'Failed to submit task for completion');
//       }
//     } catch (error) {
//       console.error('Error submitting for completion:', error);
//       message.error('Failed to submit task for completion');
//     } finally {
//       setSubmittingCompletion(false);
//     }
//   };

//   const openApprovalModal = (task, assignee) => {
//     setSelectedTask(task);
//     setSelectedAssignee(assignee);
//     approvalForm.resetFields();
//     setApprovalModalVisible(true);
//   };

//   const handleApproveCompletion = async (values) => {
//     try {
//       const token = localStorage.getItem('token');
//       const response = await fetch(
//         `http://localhost:5001/api/action-items/${selectedTask._id}/assignee/${selectedAssignee.user._id}/approve-completion`,
//         {
//           method: 'POST',
//           headers: {
//             'Authorization': `Bearer ${token}`,
//             'Content-Type': 'application/json'
//           },
//           body: JSON.stringify({
//             grade: values.grade,
//             qualityNotes: values.qualityNotes,
//             comments: values.comments
//           })
//         }
//       );

//       const result = await response.json();
//       if (result.success) {
//         message.success(`Completion approved with grade ${values.grade}/5`);
//         setApprovalModalVisible(false);
//         fetchActionItems();
//         fetchStats();
//       } else {
//         message.error(result.message || 'Failed to approve completion');
//       }
//     } catch (error) {
//       console.error('Error approving completion:', error);
//       message.error('Failed to approve completion');
//     }
//   };

//   const handleRejectCompletion = async (assigneeUserId) => {
//     Modal.confirm({
//       title: 'Reject Completion',
//       content: (
//         <Input.TextArea 
//           placeholder="Provide reason for rejection..." 
//           id="rejection-reason"
//         />
//       ),
//       onOk: async () => {
//         const comments = document.getElementById('rejection-reason').value;
//         if (!comments) {
//           message.error('Please provide a reason for rejection');
//           return;
//         }

//         try {
//           const token = localStorage.getItem('token');
//           const response = await fetch(
//             `http://localhost:5001/api/action-items/${selectedTask._id}/assignee/${assigneeUserId}/reject-completion`,
//             {
//               method: 'POST',
//               headers: {
//                 'Authorization': `Bearer ${token}`,
//                 'Content-Type': 'application/json'
//               },
//               body: JSON.stringify({ comments })
//             }
//           );

//           const result = await response.json();
//           if (result.success) {
//             message.success('Completion rejected - sent back for revision');
//             setApprovalModalVisible(false);
//             fetchActionItems();
//             fetchStats();
//           } else {
//             message.error(result.message || 'Failed to reject completion');
//           }
//         } catch (error) {
//           console.error('Error rejecting completion:', error);
//           message.error('Failed to reject completion');
//         }
//       }
//     });
//   };

//   const openViewTaskModal = (task) => {
//     setSelectedTask(task);
//     setViewTaskModalVisible(true);
//   };

//   const openModal = (item = null) => {
//     setEditingItem(item);
//     setTaskAssignmentType('myself');
//     setSelectedAssignee(currentUserId);
//     setAvailableKPIs([]);
//     setSelectedMilestone(null);
//     setRemainingWeight(100);
    
//     if (item) {
//       // Editing existing task
//       form.setFieldsValue({
//         title: item.title,
//         description: item.description,
//         priority: item.priority,
//         dueDate: dayjs(item.dueDate),
//         projectId: item.projectId?._id || undefined,
//         milestoneId: item.milestoneId || undefined,
//         taskWeight: item.taskWeight || undefined,
//         notes: item.notes
//       });
//     } else {
//       // New task - fetch user's own KPIs
//       form.resetFields();
//       fetchUserKPIs(currentUserId);
//       fetchMilestones();
//     }
    
//     setModalVisible(true);
//   };


//   const handleDelete = (taskId) => {
//     Modal.confirm({
//       title: 'Delete Task',
//       content: 'Are you sure you want to delete this task?',
//       okText: 'Delete',
//       okType: 'danger',
//       onOk: async () => {
//         try {
//           const token = localStorage.getItem('token');
//           const response = await fetch(`http://localhost:5001/api/action-items/${taskId}`, {
//             method: 'DELETE',
//             headers: {
//               'Authorization': `Bearer ${token}`
//             }
//           });

//           const result = await response.json();
          
//           if (result.success) {
//             message.success('Task deleted successfully');
//             fetchActionItems();
//             fetchStats();
//           } else {
//             message.error(result.message || 'Failed to delete task');
//           }
//         } catch (error) {
//           console.error('Error deleting task:', error);
//           message.error('Failed to delete task');
//         }
//       }
//     });
//   };

//   const getPriorityColor = (priority) => {
//     const colors = {
//       'LOW': 'green',
//       'MEDIUM': 'blue',
//       'HIGH': 'orange',
//       'CRITICAL': 'red'
//     };
//     return colors[priority] || 'default';
//   };

//   const getStatusColor = (status) => {
//     const colors = {
//       'Not Started': 'default',
//       'In Progress': 'processing',
//       'Pending Approval': 'warning',
//       'Pending Completion Approval': 'cyan',
//       'Completed': 'success',
//       'On Hold': 'warning',
//       'Rejected': 'error'
//     };
//     return colors[status] || 'default';
//   };

//   const isOverdue = (dueDate, status) => {
//     if (status === 'Completed') return false;
//     return dayjs(dueDate).isBefore(dayjs(), 'day');
//   };

//   const isAssignedToMe = (task) => {
//     if (!task.assignedTo || !Array.isArray(task.assignedTo)) return false;
//     return task.assignedTo.some(assignee => 
//       assignee.user && (assignee.user._id === currentUserId || assignee.user.id === currentUserId)
//     );
//   };

//   const getMyAssignment = (task) => {
//     if (!task.assignedTo) return null;
//     return task.assignedTo.find(a => 
//       a.user && (a.user._id === currentUserId || a.user.id === currentUserId)
//     );
//   };

//   const canStartTask = (task) => {
//     if (!isAssignedToMe(task)) return false;
//     return task.status === 'Not Started';
//   };

//   const canSubmitForCompletion = (task) => {
//     if (!isAssignedToMe(task)) return false;
//     const myAssignment = getMyAssignment(task);
//     return task.status === 'In Progress' && 
//            myAssignment && 
//            myAssignment.completionStatus === 'pending';
//   };

//   const isSupervisor = (task) => {
//     return task.supervisor && task.supervisor.email === userInfo.email;
//   };

//   const canApproveCompletion = (task) => {
//     if (!isSupervisor(task)) return false;
//     return task.status === 'Pending Completion Approval';
//   };

//   const uploadProps = {
//     fileList: uploadingFiles,
//     onChange: (info) => {
//       setUploadingFiles(info.fileList);
//     },
//     onRemove: (file) => {
//       setUploadingFiles(uploadingFiles.filter(f => f.uid !== file.uid));
//     },
//     beforeUpload: () => false,
//     multiple: true
//   };

//   const columns = [
//     {
//       title: 'Task',
//       key: 'task',
//       render: (_, record) => (
//         <div>
//           <Text strong>{record.title}</Text>
//           <br />
//           <Text type="secondary" style={{ fontSize: '12px' }}>
//             {record.description?.substring(0, 50)}...
//           </Text>
//           <br />
//           <Space size="small" wrap style={{ marginTop: 4 }}>
//             {record.projectId && (
//               <Tag size="small" color="blue" icon={<ProjectOutlined />}>
//                 {record.projectId.name}
//               </Tag>
//             )}
//             {record.milestoneId && (
//               <Tag size="small" color="purple" icon={<FlagOutlined />}>
//                 Milestone
//               </Tag>
//             )}
//             {record.taskWeight > 0 && (
//               <Tag size="small" color="gold">
//                 Weight: {record.taskWeight}%
//               </Tag>
//             )}
//             {record.linkedKPIs && record.linkedKPIs.length > 0 && (
//               <Tag size="small" color="orange" icon={<TrophyOutlined />}>
//                 {record.linkedKPIs.length} KPI{record.linkedKPIs.length > 1 ? 's' : ''}
//               </Tag>
//             )}
//           </Space>
//         </div>
//       ),
//       width: 320
//     },
//     {
//       title: 'Assigned To',
//       key: 'assignedTo',
//       render: (_, record) => {
//         if (!record.assignedTo || record.assignedTo.length === 0) {
//           return <Text type="secondary">Unassigned</Text>;
//         }
        
//         return (
//           <div>
//             {record.assignedTo.map((assignee, idx) => (
//               <div key={idx} style={{ marginBottom: 4 }}>
//                 <Text strong style={{ fontSize: '12px' }}>
//                   {assignee.user?.fullName || 'Unknown'}
//                 </Text>
//                 <br />
//                 <Tag size="small" color={
//                   assignee.completionStatus === 'approved' ? 'green' :
//                   assignee.completionStatus === 'submitted' ? 'blue' :
//                   assignee.completionStatus === 'rejected' ? 'red' :
//                   'default'
//                 }>
//                   {assignee.completionStatus}
//                 </Tag>
//                 {assignee.completionGrade?.score && (
//                   <Tag size="small" color="gold" icon={<StarOutlined />}>
//                     {assignee.completionGrade.score}/5
//                   </Tag>
//                 )}
//               </div>
//             ))}
//           </div>
//         );
//       },
//       width: 180
//     },
//     {
//       title: 'Priority',
//       dataIndex: 'priority',
//       key: 'priority',
//       render: (priority) => (
//         <Tag color={getPriorityColor(priority)} icon={<FlagOutlined />}>
//           {priority}
//         </Tag>
//       ),
//       width: 100
//     },
//     {
//       title: 'Status',
//       dataIndex: 'status',
//       key: 'status',
//       render: (status) => (
//         <Tag color={getStatusColor(status)}>
//           {status}
//         </Tag>
//       ),
//       width: 150
//     },
//     {
//       title: 'Progress',
//       key: 'progress',
//       render: (_, record) => (
//         <div style={{ width: 120 }}>
//           <Progress 
//             percent={record.progress || 0} 
//             size="small"
//             status={record.progress === 100 ? 'success' : 'active'}
//           />
//         </div>
//       ),
//       width: 130
//     },
//     {
//       title: 'Due Date',
//       key: 'dueDate',
//       render: (_, record) => {
//         const overdue = isOverdue(record.dueDate, record.status);
//         return (
//           <div>
//             <Text type={overdue ? 'danger' : 'secondary'}>
//               {dayjs(record.dueDate).format('MMM DD, YYYY')}
//             </Text>
//             {overdue && (
//               <>
//                 <br />
//                 <Tag color="red" size="small">Overdue</Tag>
//               </>
//             )}
//           </div>
//         );
//       },
//       width: 120
//     },
//     {
//       title: 'Actions',
//       key: 'actions',
//       render: (_, record) => (
//         <Space size="small" wrap>
//           <Tooltip title="View Details">
//             <Button
//               size="small"
//               icon={<EyeOutlined />}
//               onClick={() => openViewTaskModal(record)}
//             />
//           </Tooltip>
          
//           {canStartTask(record) && (
//             <Tooltip title="Start working on this task">
//               <Button
//                 size="small"
//                 type="primary"
//                 icon={<PlayCircleOutlined />}
//                 onClick={() => handleStartTask(record._id)}
//               >
//                 Start
//               </Button>
//             </Tooltip>
//           )}
          
//           {canSubmitForCompletion(record) && (
//             <Tooltip title="Submit task for completion approval">
//               <Button
//                 size="small"
//                 type="primary"
//                 icon={<CheckOutlined />}
//                 onClick={() => openSubmitCompletionModal(record)}
//                 style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
//               >
//                 Submit
//               </Button>
//             </Tooltip>
//           )}
          
//           {canApproveCompletion(record) && (
//             <Tooltip title="Review & Grade Completion">
//               <Button
//                 size="small"
//                 type="primary"
//                 icon={<StarOutlined />}
//                 onClick={() => {
//                   const submittedAssignee = record.assignedTo.find(a => a.completionStatus === 'submitted');
//                   if (submittedAssignee) {
//                     openApprovalModal(record, submittedAssignee);
//                   }
//                 }}
//                 style={{ backgroundColor: '#1890ff', borderColor: '#1890ff' }}
//               >
//                 Review
//               </Button>
//             </Tooltip>
//           )}
          
//           {record.status === 'Pending Approval' && (
//             <Tooltip title="Awaiting supervisor approval">
//               <Button size="small" type="dashed" disabled>
//                 Pending
//               </Button>
//             </Tooltip>
//           )}
          
//           {['Not Started', 'In Progress'].includes(record.status) && isSupervisor(record) && (
//             <>
//               <Tooltip title="Edit">
//                 <Button
//                   size="small"
//                   icon={<EditOutlined />}
//                   onClick={() => openModal(record)}
//                 />
//               </Tooltip>
//               <Tooltip title="Delete">
//                 <Button
//                   size="small"
//                   danger
//                   icon={<DeleteOutlined />}
//                   onClick={() => handleDelete(record._id)}
//                 />
//               </Tooltip>
//             </>
//           )}
//         </Space>
//       ),
//       width: 250,
//       fixed: 'right'
//     }
//   ];

//   return (
//     <div style={{ padding: '24px' }}>
//       <Card>
//         <div style={{ 
//           display: 'flex', 
//           justifyContent: 'space-between', 
//           alignItems: 'center',
//           marginBottom: '24px'
//         }}>
//           <Title level={2} style={{ margin: 0 }}>
//             <CheckCircleOutlined /> Action Items Management
//           </Title>
//           <Space>
//             <Button
//               icon={<ReloadOutlined />}
//               onClick={loadInitialData}
//               loading={loading}
//             >
//               Refresh
//             </Button>
//             <Button
//               type="primary"
//               icon={<PlusOutlined />}
//               onClick={() => openModal()}
//             >
//               New Task
//             </Button>
//           </Space>
//         </div>

//         <Card size="small" style={{ marginBottom: '24px', backgroundColor: '#f0f8ff' }}>
//           <Row gutter={16}>
//             <Col xs={12} sm={8} md={4}>
//               <Statistic
//                 title="Total Tasks"
//                 value={stats.total}
//                 prefix={<CheckCircleOutlined />}
//               />
//             </Col>
//             <Col xs={12} sm={8} md={4}>
//               <Statistic
//                 title="Not Started"
//                 value={stats.notStarted}
//                 valueStyle={{ color: '#8c8c8c' }}
//               />
//             </Col>
//             <Col xs={12} sm={8} md={4}>
//               <Statistic
//                 title="In Progress"
//                 value={stats.inProgress}
//                 valueStyle={{ color: '#1890ff' }}
//               />
//             </Col>
//             <Col xs={12} sm={8} md={4}>
//               <Statistic
//                 title="Completed"
//                 value={stats.completed}
//                 valueStyle={{ color: '#52c41a' }}
//               />
//             </Col>
//             <Col xs={12} sm={8} md={4}>
//               <Statistic
//                 title="On Hold"
//                 value={stats.onHold}
//                 valueStyle={{ color: '#faad14' }}
//               />
//             </Col>
//             <Col xs={12} sm={8} md={4}>
//               <Statistic
//                 title="Overdue"
//                 value={stats.overdue}
//                 valueStyle={{ color: '#f5222d' }}
//               />
//             </Col>
//           </Row>
//         </Card>

//         <Tabs 
//           activeKey={activeTab} 
//           onChange={setActiveTab}
//           style={{ marginBottom: '16px' }}
//         >
//           <Tabs.TabPane 
//             tab={
//               <Badge count={stats.inProgress} size="small">
//                 <span>My Tasks</span>
//               </Badge>
//             } 
//             key="my-tasks"
//           />
//           <Tabs.TabPane 
//             tab="Team Tasks" 
//             key="team-tasks"
//           />
//           {['supervisor', 'admin'].includes(userRole) && (
//             <Tabs.TabPane 
//               tab={
//                 <Badge count={actionItems.filter(t => t.status === 'Pending Approval' || t.status === 'Pending Completion Approval').length} size="small">
//                   <span>My Approvals</span>
//                 </Badge>
//               }
//               key="my-approvals"
//             />
//           )}
//         </Tabs>

//         <Table
//           columns={columns}
//           dataSource={actionItems}
//           loading={loading}
//           rowKey="_id"
//           pagination={{
//             showSizeChanger: true,
//             showQuickJumper: true,
//             showTotal: (total) => `Total ${total} tasks`
//           }}
//           scroll={{ x: 1400 }}
//           size="small"
//         />
//       </Card>

//       <Modal
//         title={
//           <Space>
//             <PlusOutlined />
//             Create New Task
//           </Space>
//         }
//         open={modalVisible}
//         onCancel={() => {
//           setModalVisible(false);
//           setTaskAssignmentType('myself');
//           setSelectedAssignee(null);
//           setAvailableKPIs([]);
//           setSelectedMilestone(null);
//           form.resetFields();
//         }}
//         footer={null}
//         width={800}
//         destroyOnClose
//       >
//         <Alert
//           message="Task Creation Requirements"
//           description="All tasks must be linked to at least one KPI. If assigning to another user, you become the supervisor for that task."
//           type="info"
//           showIcon
//           style={{ marginBottom: '16px' }}
//         />

//         {availableKPIs.length === 0 && selectedAssignee && !loadingKPIs && (
//           <Alert
//             message="No Approved KPIs Found"
//             description={
//               <Space direction="vertical">
//                 <Text>
//                   {taskAssignmentType === 'myself'
//                     ? "You don't have any approved KPIs for the current quarter."
//                     : `${users.find(u => u._id === selectedAssignee)?.fullName} doesn't have any approved KPIs for the current quarter.`}
//                 </Text>
//                 <Text strong>Required Actions:</Text>
//                 <ul style={{ marginBottom: 0, paddingLeft: 20 }}>
//                   <li>Create quarterly KPIs</li>
//                   <li>Submit KPIs for approval</li>
//                   <li>Get supervisor approval</li>
//                   <li>Return here to create tasks</li>
//                 </ul>
//                 {taskAssignmentType === 'myself' && (
//                   <Button 
//                     type="link" 
//                     onClick={() => navigate('/employee/kpis')}
//                     style={{ paddingLeft: 0 }}
//                   >
//                     Go to KPI Management →
//                   </Button>
//                 )}
//               </Space>
//             }
//             type="error"
//             showIcon
//             style={{ marginBottom: '16px' }}
//           />
//         )}

//         {selectedMilestone && remainingWeight <= 0 && (
//           <Alert
//             message="Milestone Capacity Full"
//             description="This milestone has no remaining weight capacity. All 100% has been allocated to existing tasks."
//             type="error"
//             showIcon
//             style={{ marginBottom: '16px' }}
//           />
//         )}

//         <Form
//           form={form}
//           layout="vertical"
//           onFinish={handleSaveTask}
//         >
//           {/* Assignment Type Selection */}
//           <Form.Item label="Who will work on this task?">
//             <Radio.Group 
//               value={taskAssignmentType} 
//               onChange={handleAssignmentTypeChange}
//             >
//               <Radio value="myself">
//                 <UserOutlined /> Assign to Myself
//               </Radio>
//               <Radio value="other">
//                 <UserOutlined /> Assign to Another User
//               </Radio>
//             </Radio.Group>
//           </Form.Item>

//           {/* Assignee Selection (only if assigning to other) */}
//           {taskAssignmentType === 'other' && (
//             <Form.Item
//               name="assignedTo"
//               label="Assign To"
//               rules={[{ required: true, message: 'Please select a user to assign' }]}
//             >
//               <Select
//                 placeholder="Select user to assign task"
//                 showSearch
//                 loading={usersLoading}
//                 onChange={handleAssigneeChange}
//                 filterOption={(input, option) => {
//                   const usr = users.find(u => u._id === option.value);
//                   if (!usr) return false;
//                   return (
//                     (usr.fullName || usr.name || '').toLowerCase().includes(input.toLowerCase()) ||
//                     (usr.position || '').toLowerCase().includes(input.toLowerCase()) ||
//                     (usr.department || '').toLowerCase().includes(input.toLowerCase())
//                   );
//                 }}
//               >
//                 {users.map(usr => (
//                   <Option key={usr._id} value={usr._id}>
//                     <div>
//                       <Text strong>{usr.fullName || usr.name}</Text>
//                       <br />
//                       <Text type="secondary" style={{ fontSize: '12px' }}>
//                         {usr.position || 'Employee'} | {usr.department}
//                       </Text>
//                     </div>
//                   </Option>
//                 ))}
//               </Select>
//             </Form.Item>
//           )}

//           {/* KPI Selection */}
//           <Form.Item
//             name="linkedKPIs"
//             label={
//               <Space>
//                 <TrophyOutlined />
//                 Link to KPIs
//               </Space>
//             }
//             rules={[{ required: true, message: 'Please select at least one KPI' }]}
//             tooltip="Task completion will contribute to the selected KPIs"
//           >
//             <Select
//               mode="multiple"
//               placeholder={
//                 loadingKPIs 
//                   ? "Loading KPIs..." 
//                   : availableKPIs.length === 0
//                   ? "No approved KPIs found"
//                   : "Select KPIs to link"
//               }
//               loading={loadingKPIs}
//               disabled={!selectedAssignee || loadingKPIs}
//               notFoundContent={
//                 loadingKPIs ? (
//                   <Spin size="small" />
//                 ) : (
//                   <Alert
//                     message="No Approved KPIs"
//                     description="User must create and get KPIs approved first"
//                     type="warning"
//                     showIcon
//                   />
//                 )
//               }
//             >
//               {availableKPIs.map((kpi, index) => (
//                 <Option key={index} value={index}>
//                   <div>
//                     <Text strong>{kpi.title}</Text>
//                     <Tag color="blue" style={{ marginLeft: 8 }}>
//                       Weight: {kpi.weight}%
//                     </Tag>
//                     <br />
//                     <Text type="secondary" style={{ fontSize: '12px' }}>
//                       {kpi.description?.substring(0, 60)}...
//                     </Text>
//                   </div>
//                 </Option>
//               ))}
//             </Select>
//           </Form.Item>

//           <Divider />

//           {/* Task Details */}
//           <Form.Item
//             name="title"
//             label="Task Title"
//             rules={[{ required: true, message: 'Please enter task title' }]}
//           >
//             <Input placeholder="e.g., Configure network infrastructure" />
//           </Form.Item>

//           <Form.Item
//             name="description"
//             label="Description"
//             rules={[{ required: true, message: 'Please enter description' }]}
//           >
//             <TextArea rows={3} placeholder="Detailed task description" />
//           </Form.Item>

//           <Row gutter={16}>
//             <Col span={12}>
//               <Form.Item
//                 name="priority"
//                 label="Priority"
//                 rules={[{ required: true, message: 'Please select priority' }]}
//               >
//                 <Select placeholder="Select priority">
//                   <Option value="LOW">🟢 Low</Option>
//                   <Option value="MEDIUM">🟡 Medium</Option>
//                   <Option value="HIGH">🟠 High</Option>
//                   <Option value="CRITICAL">🔴 Critical</Option>
//                 </Select>
//               </Form.Item>
//             </Col>
//             <Col span={12}>
//               <Form.Item
//                 name="dueDate"
//                 label="Due Date"
//                 rules={[{ required: true, message: 'Please select due date' }]}
//               >
//                 <DatePicker style={{ width: '100%' }} />
//               </Form.Item>
//             </Col>
//           </Row>

//           {/* Project Selection (Optional) */}
//           {taskAssignmentType === 'other' && (
//             <Form.Item
//               name="projectId"
//               label="Associated Project (Optional)"
//             >
//               <Select placeholder="Select project (optional)" allowClear>
//                 {projects.map(project => (
//                   <Option key={project._id} value={project._id}>
//                     <Space>
//                       <Text strong>{project.name}</Text>
//                       <Tag size="small">{project.code}</Tag>
//                     </Space>
//                   </Option>
//                 ))}
//               </Select>
//             </Form.Item>
//           )}

//           {/* Milestone Selection (Optional) */}
//           <Form.Item
//             name="milestoneId"
//             label="Milestone (Optional)"
//             tooltip="Link this task to a milestone for progress tracking"
//           >
//             <Select
//               placeholder={
//                 loadingMilestones 
//                   ? "Loading milestones..." 
//                   : "Select milestone (optional)"
//               }
//               loading={loadingMilestones}
//               allowClear
//               onChange={handleMilestoneChange}
//             >
//               {milestones.map(item => (
//                 <Option 
//                   key={item.milestone._id} 
//                   value={item.milestone._id}
//                   disabled={item.milestone.taskStats?.weightRemaining <= 0}
//                 >
//                   <div>
//                     <Text strong>{item.project.name}</Text>
//                     <Text type="secondary"> - {item.milestone.title}</Text>
//                     <br />
//                     <Space size="small">
//                       <Tag size="small" color="blue">
//                         Progress: {item.milestone.progress}%
//                       </Tag>
//                       <Tag 
//                         size="small" 
//                         color={
//                           item.milestone.taskStats?.weightRemaining > 50 ? 'green' :
//                           item.milestone.taskStats?.weightRemaining > 0 ? 'orange' :
//                           'red'
//                         }
//                       >
//                         Remaining: {item.milestone.taskStats?.weightRemaining || 0}%
//                       </Tag>
//                     </Space>
//                   </div>
//                 </Option>
//               ))}
//             </Select>
//           </Form.Item>

//           {/* Task Weight (Required if milestone selected) */}
//           {selectedMilestone && (
//             <Form.Item
//               name="taskWeight"
//               label="Task Weight (%)"
//               rules={[
//                 { required: true, message: 'Task weight is required for milestone tasks' },
//                 {
//                   validator: (_, value) => {
//                     if (value && value > remainingWeight) {
//                       return Promise.reject(
//                         `Cannot exceed remaining weight: ${remainingWeight}%`
//                       );
//                     }
//                     if (value && value <= 0) {
//                       return Promise.reject('Weight must be greater than 0');
//                     }
//                     return Promise.resolve();
//                   }
//                 }
//               ]}
//             >
//               <InputNumber
//                 min={1}
//                 max={remainingWeight}
//                 style={{ width: '100%' }}
//                 formatter={value => `${value}%`}
//                 parser={value => value.replace('%', '')}
//                 placeholder={`Max: ${remainingWeight}%`}
//               />
//             </Form.Item>
//           )}

//           {selectedMilestone && (
//             <Alert
//               message="Milestone Weight Information"
//               description={`This milestone has ${remainingWeight}% weight remaining. Your task weight will contribute to the milestone's overall progress.`}
//               type="info"
//               showIcon
//               style={{ marginBottom: '16px' }}
//             />
//           )}

//           <Form.Item
//             name="notes"
//             label="Notes"
//           >
//             <TextArea rows={2} placeholder="Additional notes or instructions" />
//           </Form.Item>

//           <Form.Item>
//             <Space>
//               <Button onClick={() => {
//                 setModalVisible(false);
//                 setTaskAssignmentType('myself');
//                 setSelectedAssignee(null);
//                 setAvailableKPIs([]);
//                 setSelectedMilestone(null);
//                 form.resetFields();
//               }}>
//                 Cancel
//               </Button>
//               <Button
//                 type="primary"
//                 htmlType="submit"
//                 loading={loading}
//                 icon={<PlusOutlined />}
//                 disabled={availableKPIs.length === 0}
//               >
//                 Create Task
//               </Button>
//             </Space>
//           </Form.Item>
//         </Form>
//       </Modal>


//       {/* Submit for Completion Modal */}
//       <Modal
//         title={
//           <Space>
//             <CheckOutlined style={{ color: '#52c41a' }} />
//             Submit Task for Completion Approval
//           </Space>
//         }
//         open={submitCompletionModalVisible}
//         onCancel={() => {
//           setSubmitCompletionModalVisible(false);
//           setSelectedTask(null);
//           setUploadingFiles([]);
//           completionForm.resetFields();
//         }}
//         footer={null}
//         width={700}
//       >
//         {selectedTask && (
//           <div>
//             <Alert
//               message="Task Completion Submission"
//               description="Upload completion documents and provide notes. Your supervisor will review and grade your work."
//               type="info"
//               showIcon
//               style={{ marginBottom: '16px' }}
//             />

//             <Card size="small" style={{ marginBottom: '16px', backgroundColor: '#fafafa' }}>
//               <Text strong>Task: </Text>
//               <Text>{selectedTask.title}</Text>
//               <br />
//               <Text strong>Description: </Text>
//               <Text type="secondary">{selectedTask.description}</Text>
//             </Card>

//             <Form
//               form={completionForm}
//               layout="vertical"
//               onFinish={handleSubmitForCompletion}
//             >
//               <Form.Item
//                 name="completionNotes"
//                 label="Completion Notes"
//                 rules={[{ required: true, message: 'Please describe what you completed' }]}
//               >
//                 <TextArea 
//                   rows={4} 
//                   placeholder="Describe what was completed, any challenges faced, and relevant details..." 
//                 />
//               </Form.Item>

//               <Form.Item
//                 label="Completion Documents"
//                 required
//                 tooltip="Upload screenshots, reports, or any evidence of completion"
//               >
//                 <Upload
//                   {...uploadProps}
//                   listType="picture"
//                   accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.zip"
//                 >
//                   <Button icon={<UploadOutlined />} block>
//                     Click or Drag Files Here to Upload
//                   </Button>
//                 </Upload>
//                 <Text type="secondary" style={{ fontSize: '12px', marginTop: '8px', display: 'block' }}>
//                   {uploadingFiles.length} file(s) selected. Supported: PDF, Word, Excel, Images, ZIP
//                 </Text>
//               </Form.Item>

//               <Form.Item>
//                 <Space>
//                   <Button onClick={() => {
//                     setSubmitCompletionModalVisible(false);
//                     setSelectedTask(null);
//                     setUploadingFiles([]);
//                     completionForm.resetFields();
//                   }}>
//                     Cancel
//                   </Button>
//                   <Button
//                     type="primary"
//                     htmlType="submit"
//                     loading={submittingCompletion}
//                     disabled={uploadingFiles.length === 0}
//                     icon={<CheckOutlined />}
//                     style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
//                   >
//                     Submit for Approval
//                   </Button>
//                 </Space>
//               </Form.Item>
//             </Form>
//           </div>
//         )}
//       </Modal>

//       {/* Approval Modal */}
//       <Modal
//         title={
//           <Space>
//             <StarOutlined style={{ color: '#faad14' }} />
//             Review & Grade Task Completion
//           </Space>
//         }
//         open={approvalModalVisible}
//         onCancel={() => {
//           setApprovalModalVisible(false);
//           setSelectedTask(null);
//           setSelectedAssignee(null);
//           approvalForm.resetFields();
//         }}
//         footer={null}
//         width={700}
//       >
//         {selectedTask && selectedAssignee && (
//           <div>
//             <Alert
//               message="Grade Task Completion"
//               description="Review the submitted work and assign a grade from 1-5. This grade will contribute to the employee's KPI achievement."
//               type="info"
//               showIcon
//               style={{ marginBottom: '16px' }}
//             />

//             <Card size="small" style={{ marginBottom: '16px', backgroundColor: '#fafafa' }}>
//               <Text strong>Task: </Text>
//               <Text>{selectedTask.title}</Text>
//               <br />
//               <Text strong>Submitted by: </Text>
//               <Text>{selectedAssignee.user?.fullName}</Text>
//               <br />
//               <Text strong>Completion Notes: </Text>
//               <Text type="secondary">{selectedAssignee.completionNotes || 'No notes provided'}</Text>
//               <br />
//               <Text strong>Documents: </Text>
//               <Text>{selectedAssignee.completionDocuments?.length || 0} file(s)</Text>
//             </Card>

//             <Form
//               form={approvalForm}
//               layout="vertical"
//               onFinish={handleApproveCompletion}
//             >
//               <Form.Item
//                 name="grade"
//                 label="Quality Grade"
//                 rules={[{ required: true, message: 'Please assign a grade' }]}
//               >
//                 <Rate count={5} tooltips={['Poor', 'Below Average', 'Average', 'Good', 'Excellent']} />
//               </Form.Item>

//               <Form.Item
//                 name="qualityNotes"
//                 label="Quality Assessment"
//               >
//                 <TextArea 
//                   rows={3} 
//                   placeholder="Provide feedback on the quality of work..." 
//                 />
//               </Form.Item>

//               <Form.Item
//                 name="comments"
//                 label="Additional Comments"
//               >
//                 <TextArea 
//                   rows={2} 
//                   placeholder="Any additional feedback or suggestions..." 
//                 />
//               </Form.Item>

//               <Divider />

//               <Form.Item>
//                 <Space>
//                   <Button 
//                     danger
//                     icon={<CloseOutlined />}
//                     onClick={() => handleRejectCompletion(selectedAssignee.user._id)}
//                   >
//                     Reject
//                   </Button>
//                   <Button onClick={() => {
//                     setApprovalModalVisible(false);
//                     setSelectedTask(null);
//                     setSelectedAssignee(null);
//                     approvalForm.resetFields();
//                   }}>
//                     Cancel
//                   </Button>
//                   <Button
//                     type="primary"
//                     htmlType="submit"
//                     icon={<CheckOutlined />}
//                     style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
//                   >
//                     Approve & Grade
//                   </Button>
//                 </Space>
//               </Form.Item>
//             </Form>
//           </div>
//         )}
//       </Modal>

//       {/* View Task Details Modal */}
//       <Modal
//         title={
//           <Space>
//             <EyeOutlined />
//             Task Details
//           </Space>
//         }
//         open={viewTaskModalVisible}
//         onCancel={() => {
//           setViewTaskModalVisible(false);
//           setSelectedTask(null);
//         }}
//         footer={
//           <Button onClick={() => setViewTaskModalVisible(false)}>
//             Close
//           </Button>
//         }
//         width={900}
//       >
//         {selectedTask && (
//           <div>
//             {/* Basic Task Information */}
//             <Card size="small" style={{ marginBottom: '16px' }}>
//               <Row gutter={[16, 16]}>
//                 <Col span={12}>
//                   <Text strong>Task Title:</Text>
//                   <br />
//                   <Text>{selectedTask.title}</Text>
//                 </Col>
//                 <Col span={12}>
//                   <Text strong>Priority:</Text>
//                   <br />
//                   <Tag color={getPriorityColor(selectedTask.priority)}>
//                     {selectedTask.priority}
//                   </Tag>
//                 </Col>
//                 <Col span={12}>
//                   <Text strong>Status:</Text>
//                   <br />
//                   <Tag color={getStatusColor(selectedTask.status)}>
//                     {selectedTask.status}
//                   </Tag>
//                 </Col>
//                 <Col span={12}>
//                   <Text strong>Due Date:</Text>
//                   <br />
//                   <Text>{dayjs(selectedTask.dueDate).format('MMM DD, YYYY')}</Text>
//                 </Col>
//                 <Col span={24}>
//                   <Text strong>Description:</Text>
//                   <br />
//                   <Text type="secondary">{selectedTask.description}</Text>
//                 </Col>
//                 {selectedTask.projectId && (
//                   <Col span={12}>
//                     <Text strong>Project:</Text>
//                     <br />
//                     <Tag color="blue" icon={<ProjectOutlined />}>
//                       {selectedTask.projectId.name}
//                     </Tag>
//                   </Col>
//                 )}
//                 {selectedTask.milestoneId && (
//                   <Col span={12}>
//                     <Text strong>Milestone:</Text>
//                     <br />
//                     <Tag color="purple" icon={<FlagOutlined />}>
//                       Milestone Task
//                     </Tag>
//                   </Col>
//                 )}
//                 {selectedTask.taskWeight > 0 && (
//                   <Col span={12}>
//                     <Text strong>Task Weight:</Text>
//                     <br />
//                     <Tag color="gold">{selectedTask.taskWeight}%</Tag>
//                   </Col>
//                 )}
//                 <Col span={12}>
//                   <Text strong>Progress:</Text>
//                   <br />
//                   <Progress percent={selectedTask.progress || 0} size="small" />
//                 </Col>
//               </Row>
//             </Card>

//             {/* NEW: Linked KPIs Section */}
//             {selectedTask.linkedKPIs && selectedTask.linkedKPIs.length > 0 && (
//               <>
//                 <Divider>
//                   <Space>
//                     <TrophyOutlined style={{ color: '#faad14' }} />
//                     Linked KPIs
//                   </Space>
//                 </Divider>
                
//                 <Space direction="vertical" style={{ width: '100%', marginBottom: '16px' }}>
//                   {selectedTask.linkedKPIs.map((kpi, idx) => (
//                     <Card 
//                       key={idx} 
//                       size="small" 
//                       style={{ backgroundColor: '#fff7e6', borderColor: '#ffd666' }}
//                     >
//                       <Row gutter={[16, 8]}>
//                         <Col span={18}>
//                           <Space direction="vertical" size="small">
//                             <Text strong>{kpi.kpiTitle}</Text>
//                             <Space size="small">
//                               <Tag color="blue">Weight: {kpi.kpiWeight}%</Tag>
//                               {kpi.contributionToKPI > 0 && (
//                                 <Tag color="green">
//                                   Contribution: {kpi.contributionToKPI.toFixed(1)}%
//                                 </Tag>
//                               )}
//                             </Space>
//                           </Space>
//                         </Col>
//                         <Col span={6} style={{ textAlign: 'right' }}>
//                           <TrophyOutlined style={{ fontSize: '24px', color: '#faad14' }} />
//                         </Col>
//                       </Row>
//                     </Card>
//                   ))}
//                 </Space>

//                 <Alert
//                   message="KPI Contribution"
//                   description={
//                     selectedTask.status === 'Completed'
//                       ? "This task's completion has been graded and contributed to the linked KPIs."
//                       : "Upon completion and approval, this task will contribute to the linked KPIs based on the quality grade."
//                   }
//                   type={selectedTask.status === 'Completed' ? 'success' : 'info'}
//                   showIcon
//                   style={{ marginBottom: '16px' }}
//                 />
//               </>
//             )}

//             {/* Assigned Team Members Section */}
//             <Divider>Assigned Team Members</Divider>

//             {selectedTask.assignedTo && selectedTask.assignedTo.length > 0 ? (
//               <Space direction="vertical" style={{ width: '100%' }}>
//                 {selectedTask.assignedTo.map((assignee, idx) => (
//                   <Card key={idx} size="small" style={{ backgroundColor: '#fafafa' }}>
//                     <Row gutter={[16, 8]}>
//                       <Col span={12}>
//                         <Text strong>{assignee.user?.fullName || 'Unknown'}</Text>
//                         <br />
//                         <Text type="secondary" style={{ fontSize: '12px' }}>
//                           {assignee.user?.department || 'N/A'}
//                         </Text>
//                       </Col>
//                       <Col span={12} style={{ textAlign: 'right' }}>
//                         <Tag color={
//                           assignee.completionStatus === 'approved' ? 'green' :
//                           assignee.completionStatus === 'submitted' ? 'blue' :
//                           assignee.completionStatus === 'rejected' ? 'red' :
//                           'default'
//                         }>
//                           {assignee.completionStatus}
//                         </Tag>
//                       </Col>
//                       {assignee.completionGrade?.score && (
//                         <>
//                           <Col span={24}>
//                             <Divider style={{ margin: '8px 0' }} />
//                           </Col>
//                           <Col span={12}>
//                             <Text type="secondary">Quality Grade:</Text>
//                           </Col>
//                           <Col span={12} style={{ textAlign: 'right' }}>
//                             <Space>
//                               <Rate disabled value={assignee.completionGrade.score} count={5} />
//                               <Text strong>({assignee.completionGrade.score}/5)</Text>
//                             </Space>
//                           </Col>
//                           {assignee.completionGrade.effectiveScore && (
//                             <>
//                               <Col span={12}>
//                                 <Text type="secondary">Effective Score:</Text>
//                               </Col>
//                               <Col span={12} style={{ textAlign: 'right' }}>
//                                 <Tag color="gold">
//                                   {assignee.completionGrade.effectiveScore.toFixed(2)}%
//                                 </Tag>
//                               </Col>
//                             </>
//                           )}
//                           {assignee.completionGrade.qualityNotes && (
//                             <Col span={24}>
//                               <Text type="secondary">Quality Notes: </Text>
//                               <Text>{assignee.completionGrade.qualityNotes}</Text>
//                             </Col>
//                           )}
//                         </>
//                       )}
//                       {assignee.completionNotes && (
//                         <Col span={24}>
//                           <Text type="secondary">Completion Notes: </Text>
//                           <Text>{assignee.completionNotes}</Text>
//                         </Col>
//                       )}
//                       {assignee.completionDocuments && assignee.completionDocuments.length > 0 && (
//                         <Col span={24}>
//                           <Space>
//                             <FileOutlined />
//                             <Text type="secondary">
//                               {assignee.completionDocuments.length} document(s) uploaded
//                             </Text>
//                           </Space>
//                         </Col>
//                       )}
//                     </Row>
//                   </Card>
//                 ))}
//               </Space>
//             ) : (
//               <Alert message="No assignees" type="info" />
//             )}

//             {/* Supervisor Information */}
//             {selectedTask.supervisor && (
//               <>
//                 <Divider>Supervisor</Divider>
//                 <Card size="small" style={{ backgroundColor: '#f0f5ff' }}>
//                   <Space direction="vertical">
//                     <Text strong>{selectedTask.supervisor.name}</Text>
//                     <Text type="secondary">{selectedTask.supervisor.email}</Text>
//                     <Tag color="blue">{selectedTask.supervisor.department}</Tag>
//                   </Space>
//                 </Card>
//               </>
//             )}

//             {/* Additional Notes */}
//             {selectedTask.notes && (
//               <>
//                 <Divider>Additional Notes</Divider>
//                 <Card size="small">
//                   <Text>{selectedTask.notes}</Text>
//                 </Card>
//               </>
//             )}
//           </div>
//         )}
//       </Modal>
//     </div>
//   );
// };

// export default ActionItemsManagement;










// import React, { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import {
//   Card,
//   Table,
//   Button,
//   Modal,
//   Form,
//   Input,
//   Select,
//   DatePicker,
//   Progress,
//   Tag,
//   Space,
//   Typography,
//   Row,
//   Col,
//   message,
//   Tabs,
//   Badge,
//   Tooltip,
//   Statistic,
//   Upload,
//   Spin,
//   Alert,
//   Rate,
//   Divider
// } from 'antd';
// import {
//   PlusOutlined,
//   EditOutlined,
//   DeleteOutlined,
//   CheckCircleOutlined,
//   ClockCircleOutlined,
//   ProjectOutlined,
//   UserOutlined,
//   ReloadOutlined,
//   FlagOutlined,
//   FileOutlined,
//   UploadOutlined,
//   PlayCircleOutlined,
//   CheckOutlined,
//   CloseOutlined,
//   EyeOutlined,
//   StarOutlined
// } from '@ant-design/icons';
// import dayjs from 'dayjs';

// const { Title, Text } = Typography;
// const { TextArea } = Input;
// const { Option } = Select;

// const ActionItemsManagement = () => {
//   const navigate = useNavigate();
//   const [actionItems, setActionItems] = useState([]);
//   const [projects, setProjects] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [modalVisible, setModalVisible] = useState(false);
//   const [submitCompletionModalVisible, setSubmitCompletionModalVisible] = useState(false);
//   const [viewTaskModalVisible, setViewTaskModalVisible] = useState(false);
//   const [approvalModalVisible, setApprovalModalVisible] = useState(false);
//   const [selectedTask, setSelectedTask] = useState(null);
//   const [selectedAssignee, setSelectedAssignee] = useState(null);
//   const [activeTab, setActiveTab] = useState('my-tasks');
//   const [stats, setStats] = useState({
//     total: 0,
//     notStarted: 0,
//     inProgress: 0,
//     completed: 0,
//     onHold: 0,
//     overdue: 0
//   });
//   const [form] = Form.useForm();
//   const [completionForm] = Form.useForm();
//   const [approvalForm] = Form.useForm();
//   const [uploadingFiles, setUploadingFiles] = useState([]);
//   const [submittingCompletion, setSubmittingCompletion] = useState(false);

//   const userInfo = JSON.parse(localStorage.getItem('user') || '{}');
//   const currentUserId = userInfo.userId || userInfo.id;
//   const userRole = userInfo.role;

//   useEffect(() => {
//     loadInitialData();
//   }, [activeTab]);

//   const loadInitialData = async () => {
//     await Promise.all([
//       fetchActionItems(),
//       fetchStats(),
//       fetchProjects()
//     ]);
//   };

//   const fetchActionItems = async () => {
//     try {
//       setLoading(true);
//       const token = localStorage.getItem('token');
      
//       let url = 'http://localhost:5001/api/action-items';
//       const params = new URLSearchParams();
      
//       if (activeTab === 'my-tasks') {
//         params.append('view', 'my-tasks');
//       } else if (activeTab === 'team-tasks') {
//         params.append('view', 'team-tasks');
//       } else if (activeTab === 'my-approvals') {
//         params.append('view', 'my-approvals');
//       }

//       if (params.toString()) {
//         url += `?${params.toString()}`;
//       }

//       const response = await fetch(url, {
//         headers: {
//           'Authorization': `Bearer ${token}`,
//           'Content-Type': 'application/json'
//         }
//       });

//       const result = await response.json();

//       if (result.success) {
//         setActionItems(result.data || []);
//       } else {
//         message.error(result.message || 'Failed to fetch action items');
//       }
//     } catch (error) {
//       console.error('Error fetching action items:', error);
//       message.error('Failed to load action items');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const fetchStats = async () => {
//     try {
//       const token = localStorage.getItem('token');
//       const response = await fetch('http://localhost:5001/api/action-items/stats', {
//         headers: {
//           'Authorization': `Bearer ${token}`
//         }
//       });

//       const result = await response.json();
//       if (result.success) {
//         setStats(result.data);
//       }
//     } catch (error) {
//       console.error('Error fetching stats:', error);
//     }
//   };

//   const fetchProjects = async () => {
//     try {
//       const token = localStorage.getItem('token');
//       const response = await fetch('http://localhost:5001/api/projects/active', {
//         headers: {
//           'Authorization': `Bearer ${token}`
//         }
//       });

//       const result = await response.json();
//       if (result.success) {
//         setProjects(result.data || []);
//       }
//     } catch (error) {
//       console.error('Error fetching projects:', error);
//     }
//   };

//   const handleStartTask = async (taskId) => {
//     try {
//       const token = localStorage.getItem('token');
//       const response = await fetch(`http://localhost:5001/api/action-items/${taskId}/status`, {
//         method: 'PATCH',
//         headers: {
//           'Authorization': `Bearer ${token}`,
//           'Content-Type': 'application/json'
//         },
//         body: JSON.stringify({ status: 'In Progress' })
//       });

//       const result = await response.json();
//       if (result.success) {
//         message.success('Task started! You can now work on it.');
//         fetchActionItems();
//         fetchStats();
//       } else {
//         message.error(result.message || 'Failed to start task');
//       }
//     } catch (error) {
//       console.error('Error starting task:', error);
//       message.error('Failed to start task');
//     }
//   };

//   const openSubmitCompletionModal = (task) => {
//     const myAssignment = task.assignedTo.find(a => 
//       a.user && (a.user._id === currentUserId || a.user.id === currentUserId)
//     );
    
//     setSelectedTask(task);
//     setSelectedAssignee(myAssignment);
//     completionForm.resetFields();
//     setUploadingFiles([]);
//     setSubmitCompletionModalVisible(true);
//   };

//   const handleSubmitForCompletion = async (values) => {
//     try {
//       if (uploadingFiles.length === 0) {
//         message.error('Please upload at least one document');
//         return;
//       }

//       setSubmittingCompletion(true);

//       const formData = new FormData();
//       formData.append('completionNotes', values.completionNotes || '');

//       uploadingFiles.forEach(file => {
//         if (file.originFileObj) {
//           formData.append('documents', file.originFileObj);
//         }
//       });

//       const token = localStorage.getItem('token');
//       const response = await fetch(
//         `http://localhost:5001/api/action-items/${selectedTask._id}/assignee/submit-completion`,
//         {
//           method: 'POST',
//           headers: {
//             'Authorization': `Bearer ${token}`
//           },
//           body: formData
//         }
//       );

//       const result = await response.json();

//       if (result.success) {
//         message.success('Task submitted for completion approval!');
//         setSubmitCompletionModalVisible(false);
//         setUploadingFiles([]);
//         completionForm.resetFields();
//         setSelectedTask(null);
//         fetchActionItems();
//         fetchStats();
//       } else {
//         message.error(result.message || 'Failed to submit task for completion');
//       }
//     } catch (error) {
//       console.error('Error submitting for completion:', error);
//       message.error('Failed to submit task for completion');
//     } finally {
//       setSubmittingCompletion(false);
//     }
//   };

//   const openApprovalModal = (task, assignee) => {
//     setSelectedTask(task);
//     setSelectedAssignee(assignee);
//     approvalForm.resetFields();
//     setApprovalModalVisible(true);
//   };

//   const handleApproveCompletion = async (values) => {
//     try {
//       const token = localStorage.getItem('token');
//       const response = await fetch(
//         `http://localhost:5001/api/action-items/${selectedTask._id}/assignee/${selectedAssignee.user._id}/approve-completion`,
//         {
//           method: 'POST',
//           headers: {
//             'Authorization': `Bearer ${token}`,
//             'Content-Type': 'application/json'
//           },
//           body: JSON.stringify({
//             grade: values.grade,
//             qualityNotes: values.qualityNotes,
//             comments: values.comments
//           })
//         }
//       );

//       const result = await response.json();
//       if (result.success) {
//         message.success(`Completion approved with grade ${values.grade}/5`);
//         setApprovalModalVisible(false);
//         fetchActionItems();
//         fetchStats();
//       } else {
//         message.error(result.message || 'Failed to approve completion');
//       }
//     } catch (error) {
//       console.error('Error approving completion:', error);
//       message.error('Failed to approve completion');
//     }
//   };

//   const handleRejectCompletion = async (assigneeUserId) => {
//     Modal.confirm({
//       title: 'Reject Completion',
//       content: (
//         <Input.TextArea 
//           placeholder="Provide reason for rejection..." 
//           id="rejection-reason"
//         />
//       ),
//       onOk: async () => {
//         const comments = document.getElementById('rejection-reason').value;
//         if (!comments) {
//           message.error('Please provide a reason for rejection');
//           return;
//         }

//         try {
//           const token = localStorage.getItem('token');
//           const response = await fetch(
//             `http://localhost:5001/api/action-items/${selectedTask._id}/assignee/${assigneeUserId}/reject-completion`,
//             {
//               method: 'POST',
//               headers: {
//                 'Authorization': `Bearer ${token}`,
//                 'Content-Type': 'application/json'
//               },
//               body: JSON.stringify({ comments })
//             }
//           );

//           const result = await response.json();
//           if (result.success) {
//             message.success('Completion rejected - sent back for revision');
//             setApprovalModalVisible(false);
//             fetchActionItems();
//             fetchStats();
//           } else {
//             message.error(result.message || 'Failed to reject completion');
//           }
//         } catch (error) {
//           console.error('Error rejecting completion:', error);
//           message.error('Failed to reject completion');
//         }
//       }
//     });
//   };

//   const openViewTaskModal = (task) => {
//     setSelectedTask(task);
//     setViewTaskModalVisible(true);
//   };

//   const handleDelete = (taskId) => {
//     Modal.confirm({
//       title: 'Delete Task',
//       content: 'Are you sure you want to delete this task?',
//       okText: 'Delete',
//       okType: 'danger',
//       onOk: async () => {
//         try {
//           const token = localStorage.getItem('token');
//           const response = await fetch(`http://localhost:5001/api/action-items/${taskId}`, {
//             method: 'DELETE',
//             headers: {
//               'Authorization': `Bearer ${token}`
//             }
//           });

//           const result = await response.json();
          
//           if (result.success) {
//             message.success('Task deleted successfully');
//             fetchActionItems();
//             fetchStats();
//           } else {
//             message.error(result.message || 'Failed to delete task');
//           }
//         } catch (error) {
//           console.error('Error deleting task:', error);
//           message.error('Failed to delete task');
//         }
//       }
//     });
//   };

//   const getPriorityColor = (priority) => {
//     const colors = {
//       'LOW': 'green',
//       'MEDIUM': 'blue',
//       'HIGH': 'orange',
//       'CRITICAL': 'red'
//     };
//     return colors[priority] || 'default';
//   };

//   const getStatusColor = (status) => {
//     const colors = {
//       'Not Started': 'default',
//       'In Progress': 'processing',
//       'Pending Approval': 'warning',
//       'Pending Completion Approval': 'cyan',
//       'Completed': 'success',
//       'On Hold': 'warning',
//       'Rejected': 'error'
//     };
//     return colors[status] || 'default';
//   };

//   const isOverdue = (dueDate, status) => {
//     if (status === 'Completed') return false;
//     return dayjs(dueDate).isBefore(dayjs(), 'day');
//   };

//   const isAssignedToMe = (task) => {
//     if (!task.assignedTo || !Array.isArray(task.assignedTo)) return false;
//     return task.assignedTo.some(assignee => 
//       assignee.user && (assignee.user._id === currentUserId || assignee.user.id === currentUserId)
//     );
//   };

//   const getMyAssignment = (task) => {
//     if (!task.assignedTo) return null;
//     return task.assignedTo.find(a => 
//       a.user && (a.user._id === currentUserId || a.user.id === currentUserId)
//     );
//   };

//   const canStartTask = (task) => {
//     if (!isAssignedToMe(task)) return false;
//     return task.status === 'Not Started';
//   };

//   const canSubmitForCompletion = (task) => {
//     if (!isAssignedToMe(task)) return false;
//     const myAssignment = getMyAssignment(task);
//     return task.status === 'In Progress' && 
//            myAssignment && 
//            myAssignment.completionStatus === 'pending';
//   };

//   const isSupervisor = (task) => {
//     return task.supervisor && task.supervisor.email === userInfo.email;
//   };

//   const canApproveCompletion = (task) => {
//     if (!isSupervisor(task)) return false;
//     return task.status === 'Pending Completion Approval';
//   };

//   const uploadProps = {
//     fileList: uploadingFiles,
//     onChange: (info) => {
//       setUploadingFiles(info.fileList);
//     },
//     onRemove: (file) => {
//       setUploadingFiles(uploadingFiles.filter(f => f.uid !== file.uid));
//     },
//     beforeUpload: () => false,
//     multiple: true
//   };

//   const columns = [
//     {
//       title: 'Task',
//       key: 'task',
//       render: (_, record) => (
//         <div>
//           <Text strong>{record.title}</Text>
//           <br />
//           <Text type="secondary" style={{ fontSize: '12px' }}>
//             {record.description?.substring(0, 50)}...
//           </Text>
//           {record.projectId && (
//             <>
//               <br />
//               <Tag size="small" color="blue" icon={<ProjectOutlined />}>
//                 {record.projectId.name}
//               </Tag>
//             </>
//           )}
//           {record.milestoneId && (
//             <Tag size="small" color="purple">
//               Milestone Task
//             </Tag>
//           )}
//           {record.taskWeight > 0 && (
//             <Tag size="small" color="gold">
//               Weight: {record.taskWeight}%
//             </Tag>
//           )}
//         </div>
//       ),
//       width: 300
//     },
//     {
//       title: 'Assigned To',
//       key: 'assignedTo',
//       render: (_, record) => {
//         if (!record.assignedTo || record.assignedTo.length === 0) {
//           return <Text type="secondary">Unassigned</Text>;
//         }
        
//         return (
//           <div>
//             {record.assignedTo.map((assignee, idx) => (
//               <div key={idx} style={{ marginBottom: 4 }}>
//                 <Text strong style={{ fontSize: '12px' }}>
//                   {assignee.user?.fullName || 'Unknown'}
//                 </Text>
//                 <br />
//                 <Tag size="small" color={
//                   assignee.completionStatus === 'approved' ? 'green' :
//                   assignee.completionStatus === 'submitted' ? 'blue' :
//                   assignee.completionStatus === 'rejected' ? 'red' :
//                   'default'
//                 }>
//                   {assignee.completionStatus}
//                 </Tag>
//                 {assignee.completionGrade?.score && (
//                   <Tag size="small" color="gold" icon={<StarOutlined />}>
//                     {assignee.completionGrade.score}/5
//                   </Tag>
//                 )}
//               </div>
//             ))}
//           </div>
//         );
//       },
//       width: 180
//     },
//     {
//       title: 'Priority',
//       dataIndex: 'priority',
//       key: 'priority',
//       render: (priority) => (
//         <Tag color={getPriorityColor(priority)} icon={<FlagOutlined />}>
//           {priority}
//         </Tag>
//       ),
//       width: 100
//     },
//     {
//       title: 'Status',
//       dataIndex: 'status',
//       key: 'status',
//       render: (status) => (
//         <Tag color={getStatusColor(status)}>
//           {status}
//         </Tag>
//       ),
//       width: 150
//     },
//     {
//       title: 'Progress',
//       key: 'progress',
//       render: (_, record) => (
//         <div style={{ width: 120 }}>
//           <Progress 
//             percent={record.progress || 0} 
//             size="small"
//             status={record.progress === 100 ? 'success' : 'active'}
//           />
//         </div>
//       ),
//       width: 130
//     },
//     {
//       title: 'Due Date',
//       key: 'dueDate',
//       render: (_, record) => {
//         const overdue = isOverdue(record.dueDate, record.status);
//         return (
//           <div>
//             <Text type={overdue ? 'danger' : 'secondary'}>
//               {dayjs(record.dueDate).format('MMM DD, YYYY')}
//             </Text>
//             {overdue && (
//               <>
//                 <br />
//                 <Tag color="red" size="small">Overdue</Tag>
//               </>
//             )}
//           </div>
//         );
//       },
//       width: 120
//     },
//     {
//       title: 'Actions',
//       key: 'actions',
//       render: (_, record) => (
//         <Space size="small" wrap>
//           <Tooltip title="View Details">
//             <Button
//               size="small"
//               icon={<EyeOutlined />}
//               onClick={() => openViewTaskModal(record)}
//             />
//           </Tooltip>
          
//           {canStartTask(record) && (
//             <Tooltip title="Start working on this task">
//               <Button
//                 size="small"
//                 type="primary"
//                 icon={<PlayCircleOutlined />}
//                 onClick={() => handleStartTask(record._id)}
//               >
//                 Start
//               </Button>
//             </Tooltip>
//           )}
          
//           {canSubmitForCompletion(record) && (
//             <Tooltip title="Submit task for completion approval">
//               <Button
//                 size="small"
//                 type="primary"
//                 icon={<CheckOutlined />}
//                 onClick={() => openSubmitCompletionModal(record)}
//                 style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
//               >
//                 Submit
//               </Button>
//             </Tooltip>
//           )}
          
//           {canApproveCompletion(record) && (
//             <Tooltip title="Review & Grade Completion">
//               <Button
//                 size="small"
//                 type="primary"
//                 icon={<StarOutlined />}
//                 onClick={() => {
//                   const submittedAssignee = record.assignedTo.find(a => a.completionStatus === 'submitted');
//                   if (submittedAssignee) {
//                     openApprovalModal(record, submittedAssignee);
//                   }
//                 }}
//                 style={{ backgroundColor: '#1890ff', borderColor: '#1890ff' }}
//               >
//                 Review
//               </Button>
//             </Tooltip>
//           )}
          
//           {record.status === 'Pending Approval' && (
//             <Tooltip title="Awaiting supervisor approval">
//               <Button size="small" type="dashed" disabled>
//                 Pending
//               </Button>
//             </Tooltip>
//           )}
          
//           {['Not Started', 'In Progress'].includes(record.status) && isSupervisor(record) && (
//             <Tooltip title="Delete">
//               <Button
//                 size="small"
//                 danger
//                 icon={<DeleteOutlined />}
//                 onClick={() => handleDelete(record._id)}
//               />
//             </Tooltip>
//           )}
//         </Space>
//       ),
//       width: 200,
//       fixed: 'right'
//     }
//   ];

//   return (
//     <div style={{ padding: '24px' }}>
//       <Card>
//         <div style={{ 
//           display: 'flex', 
//           justifyContent: 'space-between', 
//           alignItems: 'center',
//           marginBottom: '24px'
//         }}>
//           <Title level={2} style={{ margin: 0 }}>
//             <CheckCircleOutlined /> Action Items Management
//           </Title>
//           <Space>
//             <Button
//               icon={<ReloadOutlined />}
//               onClick={loadInitialData}
//               loading={loading}
//             >
//               Refresh
//             </Button>
//           </Space>
//         </div>

//         <Card size="small" style={{ marginBottom: '24px', backgroundColor: '#f0f8ff' }}>
//           <Row gutter={16}>
//             <Col xs={12} sm={8} md={4}>
//               <Statistic
//                 title="Total Tasks"
//                 value={stats.total}
//                 prefix={<CheckCircleOutlined />}
//               />
//             </Col>
//             <Col xs={12} sm={8} md={4}>
//               <Statistic
//                 title="Not Started"
//                 value={stats.notStarted}
//                 valueStyle={{ color: '#8c8c8c' }}
//               />
//             </Col>
//             <Col xs={12} sm={8} md={4}>
//               <Statistic
//                 title="In Progress"
//                 value={stats.inProgress}
//                 valueStyle={{ color: '#1890ff' }}
//               />
//             </Col>
//             <Col xs={12} sm={8} md={4}>
//               <Statistic
//                 title="Completed"
//                 value={stats.completed}
//                 valueStyle={{ color: '#52c41a' }}
//               />
//             </Col>
//             <Col xs={12} sm={8} md={4}>
//               <Statistic
//                 title="On Hold"
//                 value={stats.onHold}
//                 valueStyle={{ color: '#faad14' }}
//               />
//             </Col>
//             <Col xs={12} sm={8} md={4}>
//               <Statistic
//                 title="Overdue"
//                 value={stats.overdue}
//                 valueStyle={{ color: '#f5222d' }}
//               />
//             </Col>
//           </Row>
//         </Card>

//         <Tabs 
//           activeKey={activeTab} 
//           onChange={setActiveTab}
//           style={{ marginBottom: '16px' }}
//         >
//           <Tabs.TabPane 
//             tab={
//               <Badge count={stats.inProgress} size="small">
//                 <span>My Tasks</span>
//               </Badge>
//             } 
//             key="my-tasks"
//           />
//           <Tabs.TabPane 
//             tab="Team Tasks" 
//             key="team-tasks"
//           />
//           {['supervisor', 'admin'].includes(userRole) && (
//             <Tabs.TabPane 
//               tab={
//                 <Badge count={actionItems.filter(t => t.status === 'Pending Approval' || t.status === 'Pending Completion Approval').length} size="small">
//                   <span>My Approvals</span>
//                 </Badge>
//               }
//               key="my-approvals"
//             />
//           )}
//         </Tabs>

//         <Table
//           columns={columns}
//           dataSource={actionItems}
//           loading={loading}
//           rowKey="_id"
//           pagination={{
//             showSizeChanger: true,
//             showQuickJumper: true,
//             showTotal: (total) => `Total ${total} tasks`
//           }}
//           scroll={{ x: 1400 }}
//           size="small"
//         />
//       </Card>

//       {/* Submit for Completion Modal */}
//       <Modal
//         title={
//           <Space>
//             <CheckOutlined style={{ color: '#52c41a' }} />
//             Submit Task for Completion Approval
//           </Space>
//         }
//         open={submitCompletionModalVisible}
//         onCancel={() => {
//           setSubmitCompletionModalVisible(false);
//           setSelectedTask(null);
//           setUploadingFiles([]);
//           completionForm.resetFields();
//         }}
//         footer={null}
//         width={700}
//       >
//         {selectedTask && (
//           <div>
//             <Alert
//               message="Task Completion Submission"
//               description="Upload completion documents and provide notes. Your supervisor will review and grade your work."
//               type="info"
//               showIcon
//               style={{ marginBottom: '16px' }}
//             />

//             <Card size="small" style={{ marginBottom: '16px', backgroundColor: '#fafafa' }}>
//               <Text strong>Task: </Text>
//               <Text>{selectedTask.title}</Text>
//               <br />
//               <Text strong>Description: </Text>
//               <Text type="secondary">{selectedTask.description}</Text>
//             </Card>

//             <Form
//               form={completionForm}
//               layout="vertical"
//               onFinish={handleSubmitForCompletion}
//             >
//               <Form.Item
//                 name="completionNotes"
//                 label="Completion Notes"
//                 rules={[{ required: true, message: 'Please describe what you completed' }]}
//               >
//                 <TextArea 
//                   rows={4} 
//                   placeholder="Describe what was completed, any challenges faced, and relevant details..." 
//                 />
//               </Form.Item>

//               <Form.Item
//                 label="Completion Documents"
//                 required
//                 tooltip="Upload screenshots, reports, or any evidence of completion"
//               >
//                 <Upload
//                   {...uploadProps}
//                   listType="picture"
//                   accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.zip"
//                 >
//                   <Button icon={<UploadOutlined />} block>
//                     Click or Drag Files Here to Upload
//                   </Button>
//                 </Upload>
//                 <Text type="secondary" style={{ fontSize: '12px', marginTop: '8px', display: 'block' }}>
//                   {uploadingFiles.length} file(s) selected. Supported: PDF, Word, Excel, Images, ZIP
//                 </Text>
//               </Form.Item>

//               <Form.Item>
//                 <Space>
//                   <Button onClick={() => {
//                     setSubmitCompletionModalVisible(false);
//                     setSelectedTask(null);
//                     setUploadingFiles([]);
//                     completionForm.resetFields();
//                   }}>
//                     Cancel
//                   </Button>
//                   <Button
//                     type="primary"
//                     htmlType="submit"
//                     loading={submittingCompletion}
//                     disabled={uploadingFiles.length === 0}
//                     icon={<CheckOutlined />}
//                     style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
//                   >
//                     Submit for Approval
//                   </Button>
//                 </Space>
//               </Form.Item>
//             </Form>
//           </div>
//         )}
//       </Modal>

//       {/* Approval Modal */}
//       <Modal
//         title={
//           <Space>
//             <StarOutlined style={{ color: '#faad14' }} />
//             Review & Grade Task Completion
//           </Space>
//         }
//         open={approvalModalVisible}
//         onCancel={() => {
//           setApprovalModalVisible(false);
//           setSelectedTask(null);
//           setSelectedAssignee(null);
//           approvalForm.resetFields();
//         }}
//         footer={null}
//         width={700}
//       >
//         {selectedTask && selectedAssignee && (
//           <div>
//             <Alert
//               message="Grade Task Completion"
//               description="Review the submitted work and assign a grade from 1-5. This grade will contribute to the employee's KPI achievement."
//               type="info"
//               showIcon
//               style={{ marginBottom: '16px' }}
//             />

//             <Card size="small" style={{ marginBottom: '16px', backgroundColor: '#fafafa' }}>
//               <Text strong>Task: </Text>
//               <Text>{selectedTask.title}</Text>
//               <br />
//               <Text strong>Submitted by: </Text>
//               <Text>{selectedAssignee.user?.fullName}</Text>
//               <br />
//               <Text strong>Completion Notes: </Text>
//               <Text type="secondary">{selectedAssignee.completionNotes || 'No notes provided'}</Text>
//               <br />
//               <Text strong>Documents: </Text>
//               <Text>{selectedAssignee.completionDocuments?.length || 0} file(s)</Text>
//             </Card>

//             <Form
//               form={approvalForm}
//               layout="vertical"
//               onFinish={handleApproveCompletion}
//             >
//               <Form.Item
//                 name="grade"
//                 label="Quality Grade"
//                 rules={[{ required: true, message: 'Please assign a grade' }]}
//               >
//                 <Rate count={5} tooltips={['Poor', 'Below Average', 'Average', 'Good', 'Excellent']} />
//               </Form.Item>

//               <Form.Item
//                 name="qualityNotes"
//                 label="Quality Assessment"
//               >
//                 <TextArea 
//                   rows={3} 
//                   placeholder="Provide feedback on the quality of work..." 
//                 />
//               </Form.Item>

//               <Form.Item
//                 name="comments"
//                 label="Additional Comments"
//               >
//                 <TextArea 
//                   rows={2} 
//                   placeholder="Any additional feedback or suggestions..." 
//                 />
//               </Form.Item>

//               <Divider />

//               <Form.Item>
//                 <Space>
//                   <Button 
//                     danger
//                     icon={<CloseOutlined />}
//                     onClick={() => handleRejectCompletion(selectedAssignee.user._id)}
//                   >
//                     Reject
//                   </Button>
//                   <Button onClick={() => {
//                     setApprovalModalVisible(false);
//                     setSelectedTask(null);
//                     setSelectedAssignee(null);
//                     approvalForm.resetFields();
//                   }}>
//                     Cancel
//                   </Button>
//                   <Button
//                     type="primary"
//                     htmlType="submit"
//                     icon={<CheckOutlined />}
//                     style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
//                   >
//                     Approve & Grade
//                   </Button>
//                 </Space>
//               </Form.Item>
//             </Form>
//           </div>
//         )}
//       </Modal>

//       {/* View Task Details Modal */}
//       <Modal
//         title={
//           <Space>
//             <EyeOutlined />
//             Task Details
//           </Space>
//         }
//         open={viewTaskModalVisible}
//         onCancel={() => {
//           setViewTaskModalVisible(false);
//           setSelectedTask(null);
//         }}
//         footer={
//           <Button onClick={() => setViewTaskModalVisible(false)}>
//             Close
//           </Button>
//         }
//         width={800}
//       >
//         {selectedTask && (
//           <div>
//             <Card size="small" style={{ marginBottom: '16px' }}>
//               <Row gutter={[16, 16]}>
//                 <Col span={12}>
//                   <Text strong>Task Title:</Text>
//                   <br />
//                   <Text>{selectedTask.title}</Text>
//                 </Col>
//                 <Col span={12}>
//                   <Text strong>Priority:</Text>
//                   <br />
//                   <Tag color={getPriorityColor(selectedTask.priority)}>
//                     {selectedTask.priority}
//                   </Tag>
//                 </Col>
//                 <Col span={12}>
//                   <Text strong>Status:</Text>
//                   <br />
//                   <Tag color={getStatusColor(selectedTask.status)}>
//                     {selectedTask.status}
//                   </Tag>
//                 </Col>
//                 <Col span={12}>
//                   <Text strong>Due Date:</Text>
//                   <br />
//                   <Text>{dayjs(selectedTask.dueDate).format('MMM DD, YYYY')}</Text>
//                 </Col>
//                 <Col span={24}>
//                   <Text strong>Description:</Text>
//                   <br />
//                   <Text type="secondary">{selectedTask.description}</Text>
//                 </Col>
//                 {selectedTask.projectId && (
//                   <Col span={24}>
//                     <Text strong>Project:</Text>
//                     <br />
//                     <Tag color="blue">{selectedTask.projectId.name}</Tag>
//                   </Col>
//                 )}
//                 {selectedTask.taskWeight > 0 && (
//                   <Col span={12}>
//                     <Text strong>Task Weight:</Text>
//                     <br />
//                     <Tag color="gold">{selectedTask.taskWeight}%</Tag>
//                   </Col>
//                 )}
//                 <Col span={12}>
//                   <Text strong>Progress:</Text>
//                   <br />
//                   <Progress percent={selectedTask.progress || 0} size="small" />
//                 </Col>
//               </Row>
//             </Card>

//             <Divider>Assigned Team Members</Divider>

//             {selectedTask.assignedTo && selectedTask.assignedTo.length > 0 ? (
//               <Space direction="vertical" style={{ width: '100%' }}>
//                 {selectedTask.assignedTo.map((assignee, idx) => (
//                   <Card key={idx} size="small" style={{ backgroundColor: '#fafafa' }}>
//                     <Row gutter={[16, 8]}>
//                       <Col span={12}>
//                         <Text strong>{assignee.user?.fullName || 'Unknown'}</Text>
//                       </Col>
//                       <Col span={12} style={{ textAlign: 'right' }}>
//                         <Tag color={
//                           assignee.completionStatus === 'approved' ? 'green' :
//                           assignee.completionStatus === 'submitted' ? 'blue' :
//                           assignee.completionStatus === 'rejected' ? 'red' :
//                           'default'
//                         }>
//                           {assignee.completionStatus}
//                         </Tag>
//                       </Col>
//                       {assignee.completionGrade?.score && (
//                         <>
//                           <Col span={12}>
//                             <Text type="secondary">Grade:</Text>
//                           </Col>
//                           <Col span={12} style={{ textAlign: 'right' }}>
//                             <Rate disabled value={assignee.completionGrade.score} count={5} />
//                             <Text strong> ({assignee.completionGrade.score}/5)</Text>
//                           </Col>
//                         </>
//                       )}
//                       {assignee.completionNotes && (
//                         <Col span={24}>
//                           <Text type="secondary">Notes: </Text>
//                           <Text>{assignee.completionNotes}</Text>
//                         </Col>
//                       )}
//                       {assignee.completionDocuments && assignee.completionDocuments.length > 0 && (
//                         <Col span={24}>
//                           <Text type="secondary">Documents: </Text>
//                           <Text>{assignee.completionDocuments.length} file(s) uploaded</Text>
//                         </Col>
//                       )}
//                     </Row>
//                   </Card>
//                 ))}
//               </Space>
//             ) : (
//               <Alert message="No assignees" type="info" />
//             )}

//             {selectedTask.supervisor && (
//               <>
//                 <Divider>Supervisor</Divider>
//                 <Card size="small">
//                   <Text strong>{selectedTask.supervisor.name}</Text>
//                   <br />
//                   <Text type="secondary">{selectedTask.supervisor.email}</Text>
//                   <br />
//                   <Tag>{selectedTask.supervisor.department}</Tag>
//                 </Card>
//               </>
//             )}
//           </div>
//         )}
//       </Modal>
//     </div>
//   );
// };

// export default ActionItemsManagement;










// import React, { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import {
//   Card,
//   Table,
//   Button,
//   Modal,
//   Form,
//   Input,
//   Select,
//   DatePicker,
//   Progress,
//   Tag,
//   Space,
//   Typography,
//   Row,
//   Col,
//   message,
//   Tabs,
//   Badge,
//   Tooltip,
//   Statistic,
//   Upload,
//   Spin,
//   Alert,
//   Steps
// } from 'antd';
// import {
//   PlusOutlined,
//   EditOutlined,
//   DeleteOutlined,
//   CheckCircleOutlined,
//   ClockCircleOutlined,
//   ProjectOutlined,
//   UserOutlined,
//   ReloadOutlined,
//   FlagOutlined,
//   FileOutlined,
//   UploadOutlined,
//   PlayCircleOutlined,
//   CheckOutlined
// } from '@ant-design/icons';
// import dayjs from 'dayjs';

// const { Title, Text } = Typography;
// const { TextArea } = Input;
// const { Option } = Select;
// const { Step } = Steps;

// const ActionItemsManagement = () => {
//   const navigate = useNavigate();
//   const [actionItems, setActionItems] = useState([]);
//   const [projects, setProjects] = useState([]);
//   const [users, setUsers] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [usersLoading, setUsersLoading] = useState(false);
//   const [modalVisible, setModalVisible] = useState(false);
//   const [submitCompletionModalVisible, setSubmitCompletionModalVisible] = useState(false);
//   const [updateStatusModalVisible, setUpdateStatusModalVisible] = useState(false);
//   const [editingItem, setEditingItem] = useState(null);
//   const [selectedTaskForCompletion, setSelectedTaskForCompletion] = useState(null);
//   const [selectedTaskForStatus, setSelectedTaskForStatus] = useState(null);
//   const [activeTab, setActiveTab] = useState('my-tasks');
//   const [selectedProject, setSelectedProject] = useState(null);
//   const [isAssigning, setIsAssigning] = useState(false);
//   const [approvedKPIs, setApprovedKPIs] = useState(null);
//   const [stats, setStats] = useState({
//     total: 0,
//     notStarted: 0,
//     inProgress: 0,
//     completed: 0,
//     onHold: 0,
//     overdue: 0
//   });
//   const [form] = Form.useForm();
//   const [completionForm] = Form.useForm();
//   const [statusForm] = Form.useForm();
//   const [uploadingFiles, setUploadingFiles] = useState([]);
//   const [submittingCompletion, setSubmittingCompletion] = useState(false);

//   const userInfo = JSON.parse(localStorage.getItem('user') || '{}');
//   const currentUserId = userInfo.userId || userInfo.id;

//   useEffect(() => {
//     loadInitialData();
//   }, [activeTab, selectedProject]);

//   const loadInitialData = async () => {
//     await Promise.all([
//       fetchActionItems(),
//       fetchStats(),
//       fetchProjects(),
//       fetchUsers()
//     ]);
//   };

//   const fetchActionItems = async () => {
//     try {
//       setLoading(true);
//       const token = localStorage.getItem('token');
      
//       let url = 'http://localhost:5001/api/action-items';
//       const params = new URLSearchParams();
      
//       if (activeTab === 'my-tasks') {
//         params.append('view', 'my-tasks');
//       } else if (activeTab === 'team-tasks') {
//         params.append('view', 'team-tasks');
//       } else if (activeTab === 'project-tasks' && selectedProject) {
//         params.append('projectId', selectedProject);
//       }

//       if (params.toString()) {
//         url += `?${params.toString()}`;
//       }

//       const response = await fetch(url, {
//         headers: {
//           'Authorization': `Bearer ${token}`,
//           'Content-Type': 'application/json'
//         }
//       });

//       const result = await response.json();

//       if (result.success) {
//         setActionItems(result.data || []);
//       } else {
//         message.error(result.message || 'Failed to fetch action items');
//       }
//     } catch (error) {
//       console.error('Error fetching action items:', error);
//       message.error('Failed to load action items');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const fetchStats = async () => {
//     try {
//       const token = localStorage.getItem('token');
//       const response = await fetch('http://localhost:5001/api/action-items/stats', {
//         headers: {
//           'Authorization': `Bearer ${token}`
//         }
//       });

//       const result = await response.json();
//       if (result.success) {
//         setStats(result.data);
//       }
//     } catch (error) {
//       console.error('Error fetching stats:', error);
//     }
//   };

//   const fetchProjects = async () => {
//     try {
//       const token = localStorage.getItem('token');
//       const response = await fetch('http://localhost:5001/api/projects/active', {
//         headers: {
//           'Authorization': `Bearer ${token}`
//         }
//       });

//       const result = await response.json();
//       if (result.success) {
//         setProjects(result.data || []);
//       }
//     } catch (error) {
//       console.error('Error fetching projects:', error);
//     }
//   };

//   const fetchUsers = async () => {
//     try {
//       setUsersLoading(true);
//       const token = localStorage.getItem('token');
//       const response = await fetch('http://localhost:5001/api/auth/active-users', {
//         headers: {
//           'Authorization': `Bearer ${token}`
//         }
//       });

//       const result = await response.json();
//       if (result.success) {
//         setUsers(result.data || []);
//       }
//     } catch (error) {
//       console.error('Error fetching users:', error);
//     } finally {
//       setUsersLoading(false);
//     }
//   };

//   const loadApprovedKPIs = async () => {
//     try {
//       const token = localStorage.getItem('token');
//       const response = await fetch('http://localhost:5001/api/kpis/approved-for-linking', {
//         headers: {
//           'Authorization': `Bearer ${token}`
//         }
//       });

//       const result = await response.json();
//       if (result.success && result.data) {
//         setApprovedKPIs(result.data);
//       }
//     } catch (error) {
//       console.error('Error loading KPIs:', error);
//     }
//   };

//   useEffect(() => {
//     if (modalVisible) {
//       loadApprovedKPIs();
//     }
//   }, [modalVisible]);

//   const handleStartTask = async (taskId) => {
//     try {
//       const token = localStorage.getItem('token');
//       const response = await fetch(`http://localhost:5001/api/action-items/${taskId}/status`, {
//         method: 'PATCH',
//         headers: {
//           'Authorization': `Bearer ${token}`,
//           'Content-Type': 'application/json'
//         },
//         body: JSON.stringify({ status: 'In Progress' })
//       });

//       const result = await response.json();
//       if (result.success) {
//         message.success('Task status updated to In Progress');
//         fetchActionItems();
//         fetchStats();
//       } else {
//         message.error(result.message || 'Failed to update status');
//       }
//     } catch (error) {
//       console.error('Error starting task:', error);
//       message.error('Failed to start task');
//     }
//   };

//   const handleUpdateProgress = async (taskId, progress) => {
//     try {
//       const token = localStorage.getItem('token');
//       const response = await fetch(`http://localhost:5001/api/action-items/${taskId}/progress`, {
//         method: 'PATCH',
//         headers: {
//           'Authorization': `Bearer ${token}`,
//           'Content-Type': 'application/json'
//         },
//         body: JSON.stringify({ progress })
//       });

//       const result = await response.json();
//       if (result.success) {
//         message.success('Progress updated');
//         fetchActionItems();
//         fetchStats();
//       } else {
//         message.error(result.message || 'Failed to update progress');
//       }
//     } catch (error) {
//       console.error('Error updating progress:', error);
//       message.error('Failed to update progress');
//     }
//   };

//   const openSubmitCompletionModal = (task) => {
//     setSelectedTaskForCompletion(task);
//     completionForm.resetFields();
//     setUploadingFiles([]);
//     setSubmitCompletionModalVisible(true);
//   };

//   const handleSubmitForCompletion = async (values) => {
//     try {
//       if (uploadingFiles.length === 0) {
//         message.error('Please upload at least one document');
//         return;
//       }

//       setSubmittingCompletion(true);

//       const formData = new FormData();
//       formData.append('completionNotes', values.completionNotes || '');

//       uploadingFiles.forEach(file => {
//         if (file.originFileObj) {
//           formData.append('documents', file.originFileObj);
//         }
//       });

//       const token = localStorage.getItem('token');
//       const response = await fetch(
//         `http://localhost:5001/api/action-items/${selectedTaskForCompletion._id}/submit-completion`,
//         {
//           method: 'POST',
//           headers: {
//             'Authorization': `Bearer ${token}`
//           },
//           body: formData
//         }
//       );

//       const result = await response.json();

//       if (result.success) {
//         message.success('Task submitted for completion approval!');
//         setSubmitCompletionModalVisible(false);
//         setUploadingFiles([]);
//         completionForm.resetFields();
//         setSelectedTaskForCompletion(null);
//         fetchActionItems();
//         fetchStats();
//       } else {
//         message.error(result.message || 'Failed to submit task for completion');
//       }
//     } catch (error) {
//       console.error('Error submitting for completion:', error);
//       message.error('Failed to submit task for completion');
//     } finally {
//       setSubmittingCompletion(false);
//     }
//   };

//   const handleDelete = (taskId) => {
//     Modal.confirm({
//       title: 'Delete Task',
//       content: 'Are you sure you want to delete this task?',
//       okText: 'Delete',
//       okType: 'danger',
//       onOk: async () => {
//         try {
//           const token = localStorage.getItem('token');
//           const response = await fetch(`http://localhost:5001/api/action-items/${taskId}`, {
//             method: 'DELETE',
//             headers: {
//               'Authorization': `Bearer ${token}`
//             }
//           });

//           const result = await response.json();
          
//           if (result.success) {
//             message.success('Task deleted successfully');
//             fetchActionItems();
//             fetchStats();
//           } else {
//             message.error(result.message || 'Failed to delete task');
//           }
//         } catch (error) {
//           console.error('Error deleting task:', error);
//           message.error('Failed to delete task');
//         }
//       }
//     });
//   };

//   const getPriorityColor = (priority) => {
//     const colors = {
//       'LOW': 'green',
//       'MEDIUM': 'blue',
//       'HIGH': 'orange',
//       'CRITICAL': 'red'
//     };
//     return colors[priority] || 'default';
//   };

//   const getStatusColor = (status) => {
//     const colors = {
//       'Not Started': 'default',
//       'In Progress': 'processing',
//       'Pending Approval': 'warning',
//       'Pending Completion Approval': 'cyan',
//       'Completed': 'success',
//       'On Hold': 'warning',
//       'Rejected': 'error'
//     };
//     return colors[status] || 'default';
//   };

//   const isOverdue = (dueDate, status) => {
//     if (status === 'Completed') return false;
//     return dayjs(dueDate).isBefore(dayjs(), 'day');
//   };

//   const isAssignedToMe = (task) => {
//     if (!task.assignedTo || !Array.isArray(task.assignedTo)) return false;
//     return task.assignedTo.some(assignee => 
//       assignee.user && (assignee.user._id === currentUserId || assignee.user.id === currentUserId)
//     );
//   };

//   const canSubmitForCompletion = (task) => {
//     if (!isAssignedToMe(task)) return false;
    
//     const myAssignment = task.assignedTo.find(a => 
//       a.user && (a.user._id === currentUserId || a.user.id === currentUserId)
//     );
    
//     return task.status === 'In Progress' && 
//            myAssignment && 
//            myAssignment.completionStatus === 'pending';
//   };

//   const canStartTask = (task) => {
//     if (!isAssignedToMe(task)) return false;
//     return task.status === 'Not Started';
//   };

//   const uploadProps = {
//     fileList: uploadingFiles,
//     onChange: (info) => {
//       setUploadingFiles(info.fileList);
//     },
//     onRemove: (file) => {
//       setUploadingFiles(uploadingFiles.filter(f => f.uid !== file.uid));
//     },
//     beforeUpload: () => false,
//     multiple: true
//   };

//   const columns = [
//     {
//       title: 'Task',
//       key: 'task',
//       render: (_, record) => (
//         <div>
//           <Text strong>{record.title}</Text>
//           <br />
//           <Text type="secondary" style={{ fontSize: '12px' }}>
//             {record.description?.substring(0, 50)}...
//           </Text>
//           {record.projectId && (
//             <>
//               <br />
//               <Tag size="small" color="blue" icon={<ProjectOutlined />}>
//                 {record.projectId.name}
//               </Tag>
//             </>
//           )}
//           {record.milestoneId && (
//             <Tag size="small" color="purple">
//               Milestone Task
//             </Tag>
//           )}
//           {record.taskWeight && (
//             <Tag size="small" color="gold">
//               Weight: {record.taskWeight}%
//             </Tag>
//           )}
//         </div>
//       ),
//       width: 300
//     },
//     {
//       title: 'Assigned To',
//       key: 'assignedTo',
//       render: (_, record) => {
//         if (!record.assignedTo || record.assignedTo.length === 0) {
//           return <Text type="secondary">Unassigned</Text>;
//         }
        
//         return (
//           <div>
//             {record.assignedTo.map((assignee, idx) => (
//               <div key={idx} style={{ marginBottom: 4 }}>
//                 <Text strong style={{ fontSize: '12px' }}>
//                   {assignee.user?.fullName || 'Unknown'}
//                 </Text>
//                 <br />
//                 <Tag size="small" color={
//                   assignee.completionStatus === 'approved' ? 'green' :
//                   assignee.completionStatus === 'submitted' ? 'blue' :
//                   assignee.completionStatus === 'rejected' ? 'red' :
//                   'default'
//                 }>
//                   {assignee.completionStatus}
//                 </Tag>
//               </div>
//             ))}
//           </div>
//         );
//       },
//       width: 180
//     },
//     {
//       title: 'Priority',
//       dataIndex: 'priority',
//       key: 'priority',
//       render: (priority) => (
//         <Tag color={getPriorityColor(priority)} icon={<FlagOutlined />}>
//           {priority}
//         </Tag>
//       ),
//       width: 100
//     },
//     {
//       title: 'Status',
//       dataIndex: 'status',
//       key: 'status',
//       render: (status) => (
//         <Tag color={getStatusColor(status)}>
//           {status}
//         </Tag>
//       ),
//       width: 150
//     },
//     {
//       title: 'Progress',
//       key: 'progress',
//       render: (_, record) => (
//         <div style={{ width: 120 }}>
//           <Progress 
//             percent={record.progress || 0} 
//             size="small"
//             status={record.progress === 100 ? 'success' : 'active'}
//           />
//         </div>
//       ),
//       width: 130
//     },
//     {
//       title: 'Due Date',
//       key: 'dueDate',
//       render: (_, record) => {
//         const overdue = isOverdue(record.dueDate, record.status);
//         return (
//           <div>
//             <Text type={overdue ? 'danger' : 'secondary'}>
//               {dayjs(record.dueDate).format('MMM DD, YYYY')}
//             </Text>
//             {overdue && (
//               <>
//                 <br />
//                 <Tag color="red" size="small">Overdue</Tag>
//               </>
//             )}
//           </div>
//         );
//       },
//       width: 120
//     },
//     {
//       title: 'Actions',
//       key: 'actions',
//       render: (_, record) => (
//         <Space size="small" wrap>
//           {canStartTask(record) && (
//             <Tooltip title="Start working on this task">
//               <Button
//                 size="small"
//                 type="primary"
//                 icon={<PlayCircleOutlined />}
//                 onClick={() => handleStartTask(record._id)}
//               >
//                 Start
//               </Button>
//             </Tooltip>
//           )}
//           {canSubmitForCompletion(record) && (
//             <Tooltip title="Submit task for completion approval">
//               <Button
//                 size="small"
//                 type="primary"
//                 icon={<CheckOutlined />}
//                 onClick={() => openSubmitCompletionModal(record)}
//                 style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
//               >
//                 Submit
//               </Button>
//             </Tooltip>
//           )}
//           {record.status === 'Pending Approval' && (
//             <Tooltip title="Awaiting supervisor approval">
//               <Button size="small" type="dashed" disabled>
//                 Pending
//               </Button>
//             </Tooltip>
//           )}
//           {['Not Started', 'In Progress'].includes(record.status) && !isAssignedToMe(record) && (
//             <Tooltip title="Delete">
//               <Button
//                 size="small"
//                 danger
//                 icon={<DeleteOutlined />}
//                 onClick={() => handleDelete(record._id)}
//               />
//             </Tooltip>
//           )}
//         </Space>
//       ),
//       width: 150,
//       fixed: 'right'
//     }
//   ];

//   const getFilteredItems = () => {
//     let filtered = actionItems;

//     if (activeTab === 'project-tasks' && selectedProject) {
//       filtered = filtered.filter(item => item.projectId?._id === selectedProject);
//     } else if (activeTab === 'standalone-tasks') {
//       filtered = filtered.filter(item => !item.projectId);
//     }

//     return filtered;
//   };

//   return (
//     <div style={{ padding: '24px' }}>
//       <Card>
//         <div style={{ 
//           display: 'flex', 
//           justifyContent: 'space-between', 
//           alignItems: 'center',
//           marginBottom: '24px'
//         }}>
//           <Title level={2} style={{ margin: 0 }}>
//             <CheckCircleOutlined /> My Action Items
//           </Title>
//           <Space>
//             <Button
//               icon={<ReloadOutlined />}
//               onClick={loadInitialData}
//               loading={loading}
//             >
//               Refresh
//             </Button>
//           </Space>
//         </div>

//         <Card size="small" style={{ marginBottom: '24px', backgroundColor: '#f0f8ff' }}>
//           <Row gutter={16}>
//             <Col xs={12} sm={8} md={4}>
//               <Statistic
//                 title="Total Tasks"
//                 value={stats.total}
//                 prefix={<CheckCircleOutlined />}
//               />
//             </Col>
//             <Col xs={12} sm={8} md={4}>
//               <Statistic
//                 title="Not Started"
//                 value={stats.notStarted}
//                 valueStyle={{ color: '#8c8c8c' }}
//               />
//             </Col>
//             <Col xs={12} sm={8} md={4}>
//               <Statistic
//                 title="In Progress"
//                 value={stats.inProgress}
//                 valueStyle={{ color: '#1890ff' }}
//               />
//             </Col>
//             <Col xs={12} sm={8} md={4}>
//               <Statistic
//                 title="Completed"
//                 value={stats.completed}
//                 valueStyle={{ color: '#52c41a' }}
//               />
//             </Col>
//             <Col xs={12} sm={8} md={4}>
//               <Statistic
//                 title="On Hold"
//                 value={stats.onHold}
//                 valueStyle={{ color: '#faad14' }}
//               />
//             </Col>
//             <Col xs={12} sm={8} md={4}>
//               <Statistic
//                 title="Overdue"
//                 value={stats.overdue}
//                 valueStyle={{ color: '#f5222d' }}
//               />
//             </Col>
//           </Row>
//         </Card>

//         <Tabs 
//           activeKey={activeTab} 
//           onChange={setActiveTab}
//           style={{ marginBottom: '16px' }}
//         >
//           <Tabs.TabPane 
//             tab={
//               <Badge count={stats.inProgress} size="small">
//                 <span>My Tasks</span>
//               </Badge>
//             } 
//             key="my-tasks"
//           />
//           <Tabs.TabPane 
//             tab="Project Tasks" 
//             key="project-tasks"
//           />
//           <Tabs.TabPane 
//             tab="Standalone Tasks" 
//             key="standalone-tasks"
//           />
//         </Tabs>

//         {activeTab === 'project-tasks' && (
//           <div style={{ marginBottom: '16px' }}>
//             <Select
//               placeholder="Select a project"
//               style={{ width: 300 }}
//               onChange={setSelectedProject}
//               value={selectedProject}
//               allowClear
//             >
//               {projects.map(project => (
//                 <Option key={project._id} value={project._id}>
//                   {project.name} ({project.code})
//                 </Option>
//               ))}
//             </Select>
//           </div>
//         )}

//         <Table
//           columns={columns}
//           dataSource={getFilteredItems()}
//           loading={loading}
//           rowKey="_id"
//           pagination={{
//             showSizeChanger: true,
//             showQuickJumper: true,
//             showTotal: (total) => `Total ${total} tasks`
//           }}
//           scroll={{ x: 1400 }}
//           size="small"
//         />
//       </Card>

//       {/* Submit for Completion Modal */}
//       <Modal
//         title={
//           <Space>
//             <CheckOutlined style={{ color: '#52c41a' }} />
//             Submit Task for Completion Approval
//           </Space>
//         }
//         open={submitCompletionModalVisible}
//         onCancel={() => {
//           setSubmitCompletionModalVisible(false);
//           setSelectedTaskForCompletion(null);
//           setUploadingFiles([]);
//           completionForm.resetFields();
//         }}
//         footer={null}
//         width={700}
//       >
//         {selectedTaskForCompletion && (
//           <div>
//             <Alert
//               message="Task Completion Submission"
//               description="Upload completion documents and provide notes. Your supervisor will review and grade your work."
//               type="info"
//               showIcon
//               style={{ marginBottom: '16px' }}
//             />

//             <Card size="small" style={{ marginBottom: '16px', backgroundColor: '#fafafa' }}>
//               <Text strong>Task: </Text>
//               <Text>{selectedTaskForCompletion.title}</Text>
//               <br />
//               <Text strong>Description: </Text>
//               <Text type="secondary">{selectedTaskForCompletion.description}</Text>
//             </Card>

//             <Form
//               form={completionForm}
//               layout="vertical"
//               onFinish={handleSubmitForCompletion}
//             >
//               <Form.Item
//                 name="completionNotes"
//                 label="Completion Notes"
//                 rules={[{ required: true, message: 'Please describe what you completed' }]}
//               >
//                 <TextArea 
//                   rows={4} 
//                   placeholder="Describe what was completed, any challenges faced, and relevant details..." 
//                 />
//               </Form.Item>

//               <Form.Item
//                 label="Completion Documents"
//                 required
//                 tooltip="Upload screenshots, reports, or any evidence of completion"
//               >
//                 <Upload
//                   {...uploadProps}
//                   listType="picture"
//                   accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.zip"
//                 >
//                   <Button icon={<UploadOutlined />} block>
//                     Click or Drag Files Here to Upload
//                   </Button>
//                 </Upload>
//                 <Text type="secondary" style={{ fontSize: '12px', marginTop: '8px', display: 'block' }}>
//                   {uploadingFiles.length} file(s) selected. Supported: PDF, Word, Excel, Images, ZIP
//                 </Text>
//               </Form.Item>

//               <Form.Item>
//                 <Space>
//                   <Button onClick={() => {
//                     setSubmitCompletionModalVisible(false);
//                     setSelectedTaskForCompletion(null);
//                     setUploadingFiles([]);
//                     completionForm.resetFields();
//                   }}>
//                     Cancel
//                   </Button>
//                   <Button
//                     type="primary"
//                     htmlType="submit"
//                     loading={submittingCompletion}
//                     disabled={uploadingFiles.length === 0}
//                     icon={<CheckOutlined />}
//                     style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
//                   >
//                     Submit for Approval
//                   </Button>
//                 </Space>
//               </Form.Item>
//             </Form>
//           </div>
//         )}
//       </Modal>
//     </div>
//   );
// };

// export default ActionItemsManagement;



