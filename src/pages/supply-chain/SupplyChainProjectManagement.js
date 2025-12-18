import React, { useState, useEffect } from 'react';
import {
    Card,
    Table,
    Button,
    Modal,
    Form,
    Typography,
    Tag,
    Space,
    Input,
    Select,
    InputNumber,
    Descriptions,
    Alert,
    Spin,
    message,
    Badge,
    Row,
    Col,
    Statistic,
    Divider,
    Tooltip,
    Tabs,
    DatePicker,
    Progress,
    Avatar,
    List,
    Steps, 
    Switch
} from 'antd';
import {
    ProjectOutlined,
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    EyeOutlined,
    CheckCircleOutlined,
    UserOutlined,
    ReloadOutlined,
    WarningOutlined,
    MinusCircleOutlined,
    PlayCircleOutlined,
    PauseCircleOutlined,
    StopOutlined,
    BarChartOutlined,
    FlagOutlined,
    TrophyOutlined,
    ClockCircleOutlined,
    TeamOutlined,
    ExclamationCircleOutlined,
    SwapOutlined,
    CalendarOutlined,
    CloseCircleOutlined,
    DashboardOutlined,  
    SaveOutlined,         
    SendOutlined,         
} from '@ant-design/icons';
import moment from 'moment';
import { projectAPI } from '../../services/projectAPI';
import { getAllEmployees } from '../../utils/departmentStructure';
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    Legend,
    ResponsiveContainer,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    Radar
} from 'recharts';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const { TabPane } = Tabs;
const { RangePicker } = DatePicker;

const EnhancedProjectManagement = () => {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(false);
    const [projectModalVisible, setProjectModalVisible] = useState(false);
    const [detailsModalVisible, setDetailsModalVisible] = useState(false);
    const [statusModalVisible, setStatusModalVisible] = useState(false);
    const [analyticsModalVisible, setAnalyticsModalVisible] = useState(false);
    const [riskModalVisible, setRiskModalVisible] = useState(false);
    const [issueModalVisible, setIssueModalVisible] = useState(false);
    const [changeRequestModalVisible, setChangeRequestModalVisible] = useState(false);
    const [meetingModalVisible, setMeetingModalVisible] = useState(false);
    const [selectedProject, setSelectedProject] = useState(null);
    const [activeTab, setActiveTab] = useState('active');
    const [editingProject, setEditingProject] = useState(null);
    const [projectAnalytics, setProjectAnalytics] = useState(null);
    const [loadingAnalytics, setLoadingAnalytics] = useState(false);
    const [phases, setPhases] = useState([]);
    const [customFields, setCustomFields] = useState([]);
    const [resources, setResources] = useState({
        budget: { allocated: 0, currency: 'XAF' },
        manpower: [],
        equipment: []
    });
    const [currentStep, setCurrentStep] = useState(0);
    const [budgetEnabled, setBudgetEnabled] = useState(false);
    const [resourcesEnabled, setResourcesEnabled] = useState(false);
    const [phasesEnabled, setPhasesEnabled] = useState(false);
    const [myMilestones, setMyMilestones] = useState([]);
    const [milestoneTasks, setMilestoneTasks] = useState([]);
    const [loadingMilestones, setLoadingMilestones] = useState(false);
    const [selectedMilestone, setSelectedMilestone] = useState(null);
    const [taskApprovalModalVisible, setTaskApprovalModalVisible] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    const [taskApprovalForm] = Form.useForm();


    const [stats, setStats] = useState({
        total: 0,
        active: 0,
        completed: 0,
        overdue: 0,
        totalBudget: 0,
        budgetUtilization: 0,
        drafts: 0 
    });
    const [form] = Form.useForm();
    const [statusForm] = Form.useForm();
    const [riskForm] = Form.useForm();
    const [issueForm] = Form.useForm();
    const [changeRequestForm] = Form.useForm();
    const [meetingForm] = Form.useForm();
    const [projectManagers, setProjectManagers] = useState([]);
    const [supervisors, setSupervisors] = useState([]);
    const [projectManagersLoading, setProjectManagersLoading] = useState(false);
    const [budgetCodes, setBudgetCodes] = useState([]);
    const [loadingBudgetCodes, setLoadingBudgetCodes] = useState(false);

    useEffect(() => {
        fetchProjects();
        fetchStats();
        fetchProjectManagers();
        fetchBudgetCodes();
        fetchMyMilestones();
    }, []);

    // const fetchProjects = async (filters = {}) => {
    //     try {
    //         setLoading(true);
    //         const result = await projectAPI.getProjects(filters);

    //         if (result.success) {
    //             setProjects(result.data || []);
    //         } else {
    //             message.error(result.message || 'Failed to fetch projects');
    //         }
    //     } catch (error) {
    //         console.error('Error fetching projects:', error);
    //         message.error('Failed to fetch projects');
    //     } finally {
    //         setLoading(false);
    //     }
    // };

    const fetchProjects = async (filters = {}) => {
        try {
            setLoading(true);
            
            // Add draft filter based on active tab
            const isDraftParam = activeTab === 'drafts' ? 'true' : 'false';
            const queryParams = new URLSearchParams({
                isDraft: isDraftParam,
                ...filters
            });
            
            const result = await projectAPI.getProjects(Object.fromEntries(queryParams));

            if (result.success) {
                setProjects(result.data || []);
            } else {
                message.error(result.message || 'Failed to fetch projects');
            }
        } catch (error) {
            console.error('Error fetching projects:', error);
            message.error('Failed to fetch projects');
        } finally {
            setLoading(false);
        }
    };


    const fetchStats = async () => {
        try {
            const result = await projectAPI.getProjectStats();
            if (result.success) {
                const data = result.data;
                
                // Count drafts from current projects
                const draftCount = projects.filter(p => p.isDraft).length;
                
                setStats({
                    total: data.summary?.total || 0,
                    active: data.summary?.active || 0,
                    completed: data.summary?.completed || 0,
                    overdue: data.summary?.overdue || 0,
                    totalBudget: data.budget?.totalAllocated || 0,
                    budgetUtilization: data.budget?.utilization || 0,
                    drafts: draftCount  // ADD THIS LINE
                });
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
            message.error('Failed to fetch project statistics');
        }
    };

    const handleSaveDraft = async (values) => {
        try {
            setLoading(true);

            // For drafts, only require project name
            if (!values.name || values.name.trim().length === 0) {
                message.error('Project name is required');
                return;
            }

            const projectData = {
                name: values.name,
                description: values.description || '',
                projectType: values.projectType,
                priority: values.priority,
                department: values.department,
                projectManager: values.projectManager,
                timeline: values.timeline ? {
                    startDate: values.timeline[0].format('YYYY-MM-DD'),
                    endDate: values.timeline[1].format('YYYY-MM-DD')
                } : null,
                budgetCodeId: values.budgetCodeId || null,
                milestones: (values.milestones || []).map(milestone => ({
                    title: milestone.title || '',
                    description: milestone.description || '',
                    dueDate: milestone.dueDate ? milestone.dueDate.format('YYYY-MM-DD') : null,
                    weight: milestone.weight || 0,
                    assignedSupervisor: milestone.assignedSupervisor
                })),
                isDraft: true  // IMPORTANT: Mark as draft
            };

            const url = editingProject 
                ? `${API_BASE_URL}/projects/${editingProject._id}`
                : `${API_BASE_URL}/projects`;
            
            const method = editingProject ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(projectData)
            });

            const result = await response.json();

            if (result.success) {
                message.success('Project saved as draft successfully');
                setProjectModalVisible(false);
                form.resetFields();
                setEditingProject(null);
                await Promise.all([fetchProjects(), fetchStats()]);
            } else {
                message.error(result.message || 'Failed to save draft');
            }
        } catch (error) {
            console.error('Error saving draft:', error);
            message.error('Failed to save draft');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteProject = async (projectId) => {
        Modal.confirm({
            title: 'Delete Project?',
            content: 'Are you sure you want to delete this project? This action cannot be undone.',
            okText: 'Delete',
            okType: 'danger',
            cancelText: 'Cancel',
            icon: <DeleteOutlined />,
            onOk: async () => {
                try {
                    setLoading(true);
                    
                    const response = await fetch(`${API_BASE_URL}/projects/${projectId}`, {
                        method: 'DELETE',
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('token')}`,
                            'Content-Type': 'application/json'
                        }
                    });

                    const result = await response.json();

                    if (result.success) {
                        message.success('Project deleted successfully');
                        await Promise.all([fetchProjects(), fetchStats()]);
                    } else {
                        message.error(result.message || 'Failed to delete project');
                    }
                } catch (error) {
                    console.error('Error deleting project:', error);
                    message.error('Failed to delete project');
                } finally {
                    setLoading(false);
                }
            }
        });
    };


    const handleSubmitDraft = async (projectId) => {
        Modal.confirm({
            title: 'Submit Project?',
            content: 'Once submitted, this project will become active and visible to all team members. You cannot convert it back to draft. Are you sure?',
            okText: 'Yes, Submit',
            cancelText: 'Cancel',
            icon: <SendOutlined />,
            onOk: async () => {
                try {
                    setLoading(true);
                    
                    const project = projects.find(p => p._id === projectId);
                    
                    if (!project) {
                        message.error('Project not found');
                        return;
                    }

                    // Validate before submission
                    if (!project.milestones || project.milestones.length === 0) {
                        message.error('Please add at least one milestone before submitting');
                        return;
                    }

                    const totalWeight = project.milestones.reduce((sum, m) => sum + (m.weight || 0), 0);
                    if (totalWeight !== 100) {
                        message.error(`Milestone weights must sum to 100%. Current total: ${totalWeight}%`);
                        return;
                    }

                    // Check for required fields
                    if (!project.projectManager || !project.timeline?.startDate || !project.timeline?.endDate) {
                        message.error('Please complete all required fields before submitting');
                        return;
                    }

                    const response = await fetch(`${API_BASE_URL}/projects/${projectId}`, {
                        method: 'PUT',
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('token')}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            ...project,
                            isDraft: false,
                            status: 'Planning'
                        })
                    });

                    const result = await response.json();

                    if (result.success) {
                        message.success('Project submitted successfully!');
                        await Promise.all([fetchProjects(), fetchStats(), fetchBudgetCodes()]);
                    } else {
                        message.error(result.message || 'Failed to submit project');
                    }
                } catch (error) {
                    console.error('Error submitting project:', error);
                    message.error('Failed to submit project');
                } finally {
                    setLoading(false);
                }
            }
        });
    };



    const fetchProjectManagers = async () => {
        try {
            setProjectManagersLoading(true);

            try {
                const response = await fetch(`${API_BASE_URL}/auth/active-users`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    const result = await response.json();
                    if (result.success && result.data && result.data.length > 0) {
                        setProjectManagers(result.data);
                        
                        const supervisorList = result.data.filter(user => 
                            ['supervisor', 'admin', 'supply_chain', 'manager', 'hr', 'it', 'hse', 'technical'].includes(user.role)
                        );
                        setSupervisors(supervisorList);
                        return;
                    }
                }
            } catch (error) {
                console.log('Database users not available, using fallback');
            }

            const allEmployees = getAllEmployees();
            const formattedEmployees = allEmployees
                .filter(employee => employee.name && employee.email)
                .map((employee, index) => ({
                    _id: `emp_${index}_${employee.email}`,
                    id: employee.email,
                    fullName: employee.name,
                    name: employee.name,
                    email: employee.email,
                    position: employee.position,
                    department: employee.department,
                    role: employee.role,
                    isActive: true
                }))
                .sort((a, b) => a.fullName.localeCompare(b.fullName));

            setProjectManagers(formattedEmployees);
            
            const supervisorList = formattedEmployees.filter(emp => 
                ['supervisor', 'admin', 'supply_chain', 'manager', 'hr', 'it', 'hse', 'technical'].includes(emp.role)
            );
            setSupervisors(supervisorList);

        } catch (error) {
            console.error('Error loading users:', error);
            setProjectManagers([]);
            setSupervisors([]);
        } finally {
            setProjectManagersLoading(false);
        }
    };

    const fetchBudgetCodes = async () => {
        try {
            setLoadingBudgetCodes(true);
            const result = await projectAPI.getAvailableBudgetCodes();

            if (result.success) {
                setBudgetCodes(result.data || []);
            }
        } catch (error) {
            console.error('Error fetching budget codes:', error);
            setBudgetCodes([]);
        } finally {
            setLoadingBudgetCodes(false);
        }
    };

    const fetchMyMilestones = async () => {
        try {
            setLoadingMilestones(true);
            const response = await fetch(`${API_BASE_URL}/projects/my-milestones`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    setMyMilestones(result.data || []);
                }
            }
        } catch (error) {
            console.error('Error fetching milestones:', error);
        } finally {
            setLoadingMilestones(false);
        }
    };

    const fetchMilestoneTasks = async (projectId, milestoneId) => {
        try {
            setLoadingMilestones(true);
            const response = await fetch(
                `${API_BASE_URL}/projects/${projectId}/milestones/${milestoneId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    setMilestoneTasks(result.data.tasks || []);
                }
            }
        } catch (error) {
            console.error('Error fetching tasks:', error);
            message.error('Failed to fetch milestone tasks');
        } finally {
            setLoadingMilestones(false);
        }
    };

    const fetchProjectAnalytics = async (projectId) => {
        try {
            setLoadingAnalytics(true);
            const result = await projectAPI.getProjectAnalytics(projectId);
            if (result.success) {
                setProjectAnalytics(result.data);
            }
        } catch (error) {
            console.error('Error fetching analytics:', error);
            message.error('Failed to fetch project analytics');
        } finally {
            setLoadingAnalytics(false);
        }
    };

    const openAnalyticsModal = async (project) => {
        setSelectedProject(project);
        await fetchProjectAnalytics(project._id);
        setAnalyticsModalVisible(true);
    };


    const handleCreateProject = async (values) => {
        try {
            setLoading(true);

            if (!values.name || !values.description || !values.projectType || !values.priority || 
                !values.department || !values.projectManager || !values.timeline) {
                message.error('Please fill in all required fields');
                return;
            }

            if (!values.timeline || values.timeline.length !== 2) {
                message.error('Please select both start and end dates');
                return;
            }

            if (!values.milestones || values.milestones.length === 0) {
                message.error('At least one milestone is required');
                return;
            }

            const totalWeight = values.milestones.reduce((sum, m) => sum + (m.weight || 0), 0);
            if (totalWeight !== 100) {
                message.error(`Milestone weights must sum to 100%. Current total: ${totalWeight}%`);
                return;
            }

            for (const milestone of values.milestones) {
                if (!milestone.assignedSupervisor) {
                    message.error(`Milestone "${milestone.title}" must have an assigned supervisor`);
                    return;
                }
            }

            const projectData = {
                name: values.name,
                description: values.description,
                projectType: values.projectType,
                priority: values.priority,
                department: values.department,
                projectManager: values.projectManager,
                timeline: {
                    startDate: values.timeline[0].format('YYYY-MM-DD'),
                    endDate: values.timeline[1].format('YYYY-MM-DD')
                },
                budgetCodeId: values.budgetCodeId || null,
                milestones: values.milestones.map(milestone => ({
                    title: milestone.title,
                    description: milestone.description || '',
                    dueDate: milestone.dueDate ? milestone.dueDate.format('YYYY-MM-DD') : null,
                    weight: milestone.weight || 0,
                    assignedSupervisor: milestone.assignedSupervisor
                }))
            };

            const result = await projectAPI.createProject(projectData);

            if (result.success) {
                message.success(`Project "${values.name}" created successfully!`);
                setProjectModalVisible(false);
                form.resetFields();

                await Promise.all([
                    fetchProjects(),
                    fetchStats(),
                    fetchBudgetCodes()
                ]);
            } else {
                message.error(result.message || 'Failed to create project');
            }
        } catch (error) {
            console.error('Error creating project:', error);
            message.error('Failed to create project');
        } finally {
            setLoading(false);
        }
    };


    const handleUpdateProject = async (values) => {
        try {
            setLoading(true);

            if (!values.name || !values.description || !values.projectType || !values.priority || 
                !values.department || !values.projectManager || !values.timeline) {
                message.error('Please fill in all required fields');
                return;
            }

            if (!values.milestones || values.milestones.length === 0) {
                message.error('At least one milestone is required');
                return;
            }

            const totalWeight = values.milestones.reduce((sum, m) => sum + (m.weight || 0), 0);
            if (totalWeight !== 100) {
                message.error(`Milestone weights must sum to 100%. Current total: ${totalWeight}%`);
                return;
            }

            const projectData = {
                name: values.name,
                description: values.description,
                projectType: values.projectType,
                priority: values.priority,
                department: values.department,
                projectManager: values.projectManager,
                timeline: {
                    startDate: values.timeline[0].format('YYYY-MM-DD'),
                    endDate: values.timeline[1].format('YYYY-MM-DD')
                },
                budgetCodeId: values.budgetCodeId || null,
                milestones: values.milestones.map(milestone => ({
                    ...milestone,
                    dueDate: milestone.dueDate ? milestone.dueDate.format('YYYY-MM-DD') : null
                }))
            };

            const result = await projectAPI.updateProject(editingProject._id, projectData);

            if (result.success) {
                message.success('Project updated successfully');
                setProjectModalVisible(false);
                form.resetFields();
                setEditingProject(null);
                fetchProjects();
                fetchBudgetCodes();
            } else {
                message.error(result.message || 'Failed to update project');
            }
        } catch (error) {
            console.error('Error updating project:', error);
            message.error('Failed to update project');
        } finally {
            setLoading(false);
        }
    };

    const openStatusModal = (project) => {
        setSelectedProject(project);
        statusForm.setFieldsValue({
            status: project.status
        });
        setStatusModalVisible(true);
    };

    const handleUpdateStatus = async (values) => {
        try {
            setLoading(true);
            const result = await projectAPI.updateProjectStatus(selectedProject._id, { status: values.status });

            if (result.success) {
                message.success(`Project status updated to ${values.status}`);
                setStatusModalVisible(false);
                statusForm.resetFields();
                setSelectedProject(null);
                fetchProjects();
                fetchStats();
            } else {
                message.error(result.message || 'Failed to update project status');
            }
        } catch (error) {
            console.error('Error updating status:', error);
            message.error('Failed to update project status');
        } finally {
            setLoading(false);
        }
    };

    const handleAddRisk = async (values) => {
        try {
            setLoading(true);
            const result = await projectAPI.addRisk(selectedProject._id, values);
            
            if (result.success) {
                message.success('Risk added successfully');
                setRiskModalVisible(false);
                riskForm.resetFields();
                await fetchProjectAnalytics(selectedProject._id);
            }
        } catch (error) {
            console.error('Error adding risk:', error);
            message.error('Failed to add risk');
        } finally {
            setLoading(false);
        }
    };

    const handleAddIssue = async (values) => {
        try {
            setLoading(true);
            const result = await projectAPI.addIssue(selectedProject._id, values);
            
            if (result.success) {
                message.success('Issue added successfully');
                setIssueModalVisible(false);
                issueForm.resetFields();
                await fetchProjectAnalytics(selectedProject._id);
            }
        } catch (error) {
            console.error('Error adding issue:', error);
            message.error('Failed to add issue');
        } finally {
            setLoading(false);
        }
    };

    const handleAddChangeRequest = async (values) => {
        try {
            setLoading(true);
            const result = await projectAPI.addChangeRequest(selectedProject._id, values);
            
            if (result.success) {
                message.success('Change request submitted successfully');
                setChangeRequestModalVisible(false);
                changeRequestForm.resetFields();
                await fetchProjectAnalytics(selectedProject._id);
            }
        } catch (error) {
            console.error('Error adding change request:', error);
            message.error('Failed to submit change request');
        } finally {
            setLoading(false);
        }
    };

    const handleLogMeeting = async (values) => {
        try {
            setLoading(true);
            const result = await projectAPI.logMeeting(selectedProject._id, values);
            
            if (result.success) {
                message.success('Meeting logged successfully');
                setMeetingModalVisible(false);
                meetingForm.resetFields();
                await fetchProjectAnalytics(selectedProject._id);
            }
        } catch (error) {
            console.error('Error logging meeting:', error);
            message.error('Failed to log meeting');
        } finally {
            setLoading(false);
        }
    };

    const handleTaskApproval = async (values) => {
        try {
            setLoading(true);
            const { decision, comments } = values;
            
            const response = await fetch(
                `${API_BASE_URL}/action-items/${selectedTask._id}/assignee/${selectedTask.assignee._id}/approve-l3`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ decision, comments })
                }
            );

            const result = await response.json();

            if (result.success) {
                message.success(result.message);
                setTaskApprovalModalVisible(false);
                taskApprovalForm.resetFields();
                setSelectedTask(null);
                
                // Refresh milestone tasks
                if (selectedMilestone) {
                    await fetchMilestoneTasks(
                        selectedMilestone.project._id,
                        selectedMilestone.milestone._id
                    );
                }
            } else {
                message.error(result.message || 'Failed to process approval');
            }
        } catch (error) {
            console.error('Error processing approval:', error);
            message.error('Failed to process approval');
        } finally {
            setLoading(false);
        }
    };

    // const openProjectModal = (project = null) => {
    //     setEditingProject(project);
    //     if (project) {
    //         form.setFieldsValue({
    //             name: project.name,
    //             description: project.description,
    //             projectType: project.projectType,
    //             priority: project.priority,
    //             department: project.department,
    //             projectManager: project.projectManager?._id,
    //             budgetCodeId: project.budgetCode?._id,
    //             timeline: [
    //                 moment(project.timeline?.startDate),
    //                 moment(project.timeline?.endDate)
    //             ],
    //             milestones: project.milestones?.map(milestone => ({
    //                 title: milestone.title,
    //                 description: milestone.description || '',
    //                 dueDate: milestone.dueDate ? moment(milestone.dueDate) : null,
    //                 weight: milestone.weight || 0,
    //                 assignedSupervisor: milestone.assignedSupervisor?._id || milestone.assignedSupervisor
    //             })) || []
    //         });
    //     } else {
    //         form.resetFields();
    //     }
    //     setProjectModalVisible(true);
    // };

    const openProjectModal = (project = null) => {
        setEditingProject(project);
        if (project) {
            form.setFieldsValue({
                name: project.name,
                description: project.description,
                projectType: project.projectType,
                priority: project.priority,
                department: project.department,
                projectManager: project.projectManager?._id || project.projectManager,
                budgetCodeId: project.budgetCode?._id,
                timeline: [
                    moment(project.timeline?.startDate),
                    moment(project.timeline?.endDate)
                ],
                milestones: project.milestones?.map(milestone => ({
                    ...milestone,
                    title: milestone.title,
                    description: milestone.description || '',
                    dueDate: milestone.dueDate ? moment(milestone.dueDate) : null,
                    weight: milestone.weight || 0,
                    assignedSupervisor: milestone.assignedSupervisor?._id || milestone.assignedSupervisor
                })) || []
            });
        } else {
            form.resetFields();
        }
        setProjectModalVisible(true);
    };

    const getStatusColor = (status) => {
        const colors = {
            'Planning': 'blue',
            'Approved': 'cyan',
            'In Progress': 'orange',
            'On Hold': 'purple',
            'Completed': 'green',
            'Cancelled': 'red'
        };
        return colors[status] || 'default';
    };

    const getPriorityColor = (priority) => {
        const colors = {
            'Low': 'green',
            'Medium': 'blue',
            'High': 'orange',
            'Critical': 'red'
        };
        return colors[priority] || 'default';
    };

    const getFilteredProjects = () => {
        if (activeTab === 'drafts') {
            return projects.filter(p => p.isDraft);
        }
        
        switch (activeTab) {
            case 'active':
                return projects.filter(p => !p.isDraft && ['Planning', 'Approved', 'In Progress'].includes(p.status));
            case 'completed':
                return projects.filter(p => !p.isDraft && p.status === 'Completed');
            case 'overdue':
                return projects.filter(p => {
                    if (p.isDraft || p.status === 'Completed') return false;
                    return moment(p.timeline?.endDate).isBefore(moment());
                });
            default:
                return projects.filter(p => !p.isDraft);
        }
    };


    const columns = [
        {
            title: 'Project Details',
            key: 'details',
            render: (_, record) => (
                <div>
                    <Space align="center">
                        <Text strong>{record.name}</Text>
                        {record.isDraft && (
                            <Tag color="orange" icon={<ClockCircleOutlined />}>
                                DRAFT
                            </Tag>
                        )}
                    </Space>
                    <br />
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                        {record.code || 'No code assigned yet'}
                    </Text>
                    <br />
                    <Tag size="small" color="blue">{record.projectType}</Tag>
                    <Tag size="small" color={getPriorityColor(record.priority)}>
                        {record.priority}
                    </Tag>
                </div>
            ),
            width: 300
        },
        {
            title: 'Project Manager',
            key: 'manager',
            render: (_, record) => (
                <div>
                    <Avatar size="small" icon={<UserOutlined />} style={{ marginRight: 8 }} />
                    <Text strong>{record.projectManager?.fullName || 'N/A'}</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                        {record.department}
                    </Text>
                </div>
            ),
            width: 180
        },
        {
            title: 'Milestones',
            key: 'milestones',
            render: (_, record) => {
                const totalMilestones = record.milestones?.length || 0;
                const completedMilestones = record.milestones?.filter(m => m.status === 'Completed').length || 0;
                
                return (
                    <div>
                        <Text>
                            {completedMilestones}/{totalMilestones} Completed
                        </Text>
                        <br />
                        {record.milestones?.slice(0, 2).map((m, idx) => (
                            <Tag key={idx} size="small" color="blue" style={{ marginTop: 4 }}>
                                {m.title} ({m.weight}%)
                            </Tag>
                        ))}
                        {totalMilestones > 2 && (
                            <Tag size="small" color="default" style={{ marginTop: 4 }}>
                                +{totalMilestones - 2} more
                            </Tag>
                        )}
                    </div>
                );
            },
            width: 200
        },
        {
            title: 'Progress',
            key: 'progress',
            render: (_, record) => (
                <div>
                    <Progress 
                        percent={record.progress || 0} 
                        size="small"
                        status={record.progress === 100 ? 'success' : 'active'}
                    />
                </div>
            ),
            width: 150
        },
        {
            title: 'Timeline',
            key: 'timeline',
            render: (_, record) => {
                const timeline = record.timeline || {};
                const isOverdue = timeline.endDate && 
                                 moment(timeline.endDate).isBefore(moment()) && 
                                 record.status !== 'Completed';
                return (
                    <div>
                        <Text>
                            {timeline.startDate ? moment(timeline.startDate).format('MMM DD') : 'N/A'} - {' '}
                            {timeline.endDate ? moment(timeline.endDate).format('MMM DD, YYYY') : 'N/A'}
                        </Text>
                        <br />
                        {isOverdue && (
                            <Text type="danger" style={{ fontSize: '11px' }}>
                                <WarningOutlined /> Overdue
                            </Text>
                        )}
                    </div>
                );
            },
            width: 150
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
            width: 120
        },
        // {
        //     title: 'Actions',
        //     key: 'actions',
        //     render: (_, record) => (
        //         <Space size="small">
        //             <Tooltip title="View Details">
        //                 <Button
        //                     size="small"
        //                     icon={<EyeOutlined />}
        //                     onClick={() => {
        //                         setSelectedProject(record);
        //                         setDetailsModalVisible(true);
        //                     }}
        //                 />
        //             </Tooltip>
        //             <Tooltip title="Analytics">
        //                 <Button
        //                     size="small"
        //                     type="primary"
        //                     icon={<BarChartOutlined />}
        //                     onClick={() => openAnalyticsModal(record)}
        //                 />
        //             </Tooltip>
        //             <Tooltip title="Edit Project">
        //                 <Button
        //                     size="small"
        //                     icon={<EditOutlined />}
        //                     onClick={() => openProjectModal(record)}
        //                 />
        //             </Tooltip>
        //             <Tooltip title="Update Status">
        //                 <Button
        //                     size="small"
        //                     type="primary"
        //                     icon={<PlayCircleOutlined />}
        //                     onClick={() => openStatusModal(record)}
        //                 >
        //                     Status
        //                 </Button>
        //             </Tooltip>
        //         </Space>
        //     ),
        //     width: 240,
        //     fixed: 'right'
        // }
        {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => (
                <Space size="small">
                    {record.isDraft ? (
                        // DRAFT PROJECT ACTIONS
                        <>
                            <Tooltip title="Edit Draft">
                                <Button
                                    size="small"
                                    icon={<EditOutlined />}
                                    onClick={() => openProjectModal(record)}
                                />
                            </Tooltip>
                            <Tooltip title="Submit Project">
                                <Button
                                    size="small"
                                    type="primary"
                                    icon={<SendOutlined />}
                                    onClick={() => handleSubmitDraft(record._id)}
                                />
                            </Tooltip>
                            <Tooltip title="Delete Draft">
                                <Button
                                    size="small"
                                    danger
                                    icon={<DeleteOutlined />}
                                    onClick={() => handleDeleteProject(record._id)}
                                />
                            </Tooltip>
                        </>
                    ) : (
                        // ACTIVE PROJECT ACTIONS
                        <>
                            <Tooltip title="View Details">
                                <Button
                                    size="small"
                                    icon={<EyeOutlined />}
                                    onClick={() => {
                                        setSelectedProject(record);
                                        setDetailsModalVisible(true);
                                    }}
                                />
                            </Tooltip>
                            <Tooltip title="Analytics">
                                <Button
                                    size="small"
                                    type="primary"
                                    icon={<BarChartOutlined />}
                                    onClick={() => openAnalyticsModal(record)}
                                />
                            </Tooltip>
                            <Tooltip title="Edit Project">
                                <Button
                                    size="small"
                                    icon={<EditOutlined />}
                                    onClick={() => openProjectModal(record)}
                                />
                            </Tooltip>
                            <Tooltip title="Update Status">
                                <Button
                                    size="small"
                                    type="primary"
                                    icon={<PlayCircleOutlined />}
                                    onClick={() => openStatusModal(record)}
                                >
                                    Status
                                </Button>
                            </Tooltip>
                        </>
                    )}
                </Space>
            ),
            width: 280,
            fixed: 'right'
        }

    ];

    const ProjectForm = () => (
        <Form
            form={form}
            layout="vertical"
            onFinish={editingProject ? handleUpdateProject : handleCreateProject}
        >
            <Alert
                message="Save Options"
                description="You can save your project as a draft to continue working on it later, or submit it immediately to make it active. Drafts only require a project name."
                type="info"
                showIcon
                icon={<SaveOutlined />}
                style={{ marginBottom: 16 }}
            />
            <Row gutter={16}>
                <Col span={12}>
                    <Form.Item
                        name="name"
                        label="Project Name"
                        rules={[
                            { required: true, message: 'Please enter project name' },
                            { min: 5, message: 'Project name must be at least 5 characters' }
                        ]}
                    >
                        <Input placeholder="e.g., Office Infrastructure Upgrade" />
                    </Form.Item>
                </Col>
                <Col span={12}>
                    <Form.Item
                        name="projectType"
                        label="Project Type"
                        rules={[{ required: true, message: 'Please select project type' }]}
                    >
                        <Select placeholder="Select project type">
                            <Option value="Site Build">Site Build</Option>
                            <Option value="Roll Out">Roll Out</Option>
                            <Option value="Colocation">Colocation</Option>
                            <Option value="Power Projects">Power Projects</Option>
                            <Option value="Supply Chain">Supply Chain</Option>
                            <Option value="Finance">Finance</Option>
                            <Option value="Public Relations">Public Relations</Option>
                            <Option value="CEO office">CEO office</Option>
                            <Option value="Tower Maintenance">Tower Maintenance</Option>
                            <Option value="Refurbishment (Gen)">Refurbishment (Gen)</Option>
                            <Option value="Managed Service">Managed Service</Option>
                            <Option value="Kiosk">Kiosk</Option>
                            <Option value="IT">IT</Option>
                            <Option value="Process Improvement">Process Improvement</Option>
                            <Option value="Product Development">Product Development</Option>
                            <Option value="Marketing Campaign">Marketing Campaign</Option>
                            <Option value="Training Program">Training Program</Option>
                            <Option value="Other">Other</Option>
                        </Select>
                    </Form.Item>
                </Col>
            </Row>

            <Row gutter={16}>
                <Col span={8}>
                    <Form.Item
                        name="priority"
                        label="Priority Level"
                        rules={[{ required: true, message: 'Please select priority' }]}
                    >
                        <Select placeholder="Select priority">
                            <Option value="Low">🟢 Low</Option>
                            <Option value="Medium">🟡 Medium</Option>
                            <Option value="High">🟠 High</Option>
                            <Option value="Critical">🔴 Critical</Option>
                        </Select>
                    </Form.Item>
                </Col>
                <Col span={8}>
                    <Form.Item
                        name="department"
                        label="Department"
                        rules={[{ required: true, message: 'Please select department' }]}
                    >
                        <Select placeholder="Select department">
                            <Option value="Technical Operations">Technical Operations</Option>
                            <Option value="Technical Roll Out">Technical Roll Out</Option>
                            <Option value="Technical QHSE">Technical QHSE</Option>
                            <Option value="Site Build">Site Build</Option>
                            <Option value="IT">IT Department</Option>
                            <Option value="Finance">Finance</Option>
                            <Option value="HR">Human Resources</Option>
                            <Option value="Supply Chain">Supply Chain</Option>
                            <Option value="Business">Business</Option>
                            <Option value="Facilities">Facilities</Option>
                            
                        </Select>
                    </Form.Item>
                </Col>
                <Col span={8}>
                    <Form.Item
                        name="projectManager"
                        label="Project Manager"
                        rules={[{ required: true, message: 'Please select project manager' }]}
                    >
                        <Select
                            placeholder={projectManagersLoading ? "Loading..." : "Select project manager"}
                            showSearch
                            loading={projectManagersLoading}
                            filterOption={(input, option) => {
                                const manager = projectManagers.find(m => m._id === option.value);
                                if (!manager) return false;
                                return (
                                    (manager.fullName || manager.name || '').toLowerCase().includes(input.toLowerCase()) ||
                                    (manager.department || '').toLowerCase().includes(input.toLowerCase())
                                );
                            }}
                        >
                            {projectManagers.map(manager => (
                                <Option key={manager._id} value={manager._id}>
                                    <div>
                                        <Text strong>{manager.fullName || manager.name || 'Unknown'}</Text>
                                        <br />
                                        <Text type="secondary" style={{ fontSize: '12px' }}>
                                            {manager.role || 'Employee'} {manager.department ? `| ${manager.department}` : ''}
                                        </Text>
                                    </div>
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>
                </Col>
            </Row>

            <Form.Item
                name="description"
                label="Project Description"
                rules={[
                    { required: true, message: 'Please provide project description' },
                    { min: 20, message: 'Description must be at least 20 characters' }
                ]}
            >
                <TextArea
                    rows={3}
                    placeholder="Detailed description of the project objectives and scope..."
                    showCount
                    maxLength={1000}
                />
            </Form.Item>

            <Row gutter={16}>
                <Col span={24}>
                    <Form.Item
                        name="timeline"
                        label="Project Timeline"
                        rules={[{ required: true, message: 'Please select project timeline' }]}
                    >
                        <RangePicker
                            style={{ width: '100%' }}
                            placeholder={['Start Date', 'End Date']}
                            disabledDate={(current) => current && current < moment().subtract(1, 'day')}
                        />
                    </Form.Item>
                </Col>
            </Row>

            <Form.Item
                name="budgetCodeId"
                label="Budget Code Assignment (Optional)"
            >
                <Select
                    placeholder="Select budget code (optional)"
                    allowClear
                    loading={loadingBudgetCodes}
                >
                    {budgetCodes.map(budgetCode => (
                        <Option key={budgetCode._id} value={budgetCode._id}>
                            <div>
                                <Text strong>{budgetCode.code}</Text> - {budgetCode.name}
                                <br />
                                <Text type="secondary" style={{ fontSize: '12px' }}>
                                    Available: XAF {(budgetCode.available || 0).toLocaleString()}
                                </Text>
                            </div>
                        </Option>
                    ))}
                </Select>
            </Form.Item>

            <Divider>Milestones with Supervisor Assignment</Divider>

            <Alert
                message="Important: Milestone Weights"
                description="The description the sum of all milestone weights must equal 100%. Each milestone must have an assigned supervisor who will manage tasks for that milestone."
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
            />

            <Form.List name="milestones">
                {(fields, { add, remove }) => (
                    <>
                        {fields.map(({ key, name, ...restField }) => (
                            <Card key={key} size="small" style={{ marginBottom: 16, backgroundColor: '#fafafa' }}>
                                <Row gutter={16} align="middle">
                                    <Col span={10}>
                                        <Form.Item
                                            {...restField}
                                            name={[name, 'title']}
                                            label="Milestone Title"
                                            rules={[{ required: true, message: 'Required' }]}
                                        >
                                            <Input placeholder="e.g., Planning Phase" />
                                        </Form.Item>
                                    </Col>
                                    <Col span={6}>
                                        <Form.Item
                                            {...restField}
                                            name={[name, 'weight']}
                                            label="Weight (%)"
                                            rules={[{ required: true, message: 'Required' }]}
                                            initialValue={0}
                                        >
                                            <InputNumber
                                                min={0}
                                                max={100}
                                                formatter={value => `${value}%`}
                                                parser={value => value.replace('%', '')}
                                                style={{ width: '100%' }}
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col span={6}>
                                        <Form.Item
                                            {...restField}
                                            name={[name, 'dueDate']}
                                            label="Due Date"
                                        >
                                            <DatePicker placeholder="Due date" style={{ width: '100%' }} />
                                        </Form.Item>
                                    </Col>
                                    <Col span={2} style={{ paddingTop: 30 }}>
                                        <Button 
                                            type="link" 
                                            danger
                                            icon={<MinusCircleOutlined />}
                                            onClick={() => remove(name)}
                                        />
                                    </Col>
                                </Row>

                                <Form.Item
                                    {...restField}
                                    name={[name, 'description']}
                                    label="Description"
                                >
                                    <TextArea rows={2} placeholder="Optional milestone description" />
                                </Form.Item>

                                {/* <Form.Item
                                    {...restField}
                                    name={[name, 'assignedSupervisor']}
                                    label="Assigned Supervisor"
                                    rules={[{ required: true, message: 'Please assign a supervisor to this milestone' }]}
                                >
                                    <Select
                                        placeholder="Select supervisor"
                                        showSearch
                                        filterOption={(input, option) => {
                                            const sup = supervisors.find(s => s._id === option.value);
                                            if (!sup) return false;
                                            return (
                                                (sup.fullName || sup.name || '').toLowerCase().includes(input.toLowerCase()) ||
                                                (sup.department || '').toLowerCase().includes(input.toLowerCase())
                                            );
                                        }}
                                    >
                                        {supervisors.map(sup => (
                                            <Option key={sup._id} value={sup._id}>
                                                <div>
                                                    <Text strong>{sup.fullName || sup.name}</Text>
                                                    <br />
                                                    <Text type="secondary" style={{ fontSize: '12px' }}>
                                                        {sup.position || sup.role} | {sup.department}
                                                    </Text>
                                                </div>
                                            </Option>
                                        ))}
                                    </Select>
                                </Form.Item> */}
                                <Form.Item
                                    {...restField}
                                    name={[name, 'assignedSupervisor']}
                                    label="Assigned Supervisor"
                                    rules={[{ required: true, message: 'Please assign a supervisor to this milestone' }]}
                                >
                                    <Select
                                        placeholder={projectManagersLoading ? "Loading..." : "Select supervisor"}
                                        showSearch
                                        loading={projectManagersLoading}
                                        filterOption={(input, option) => {
                                            const manager = projectManagers.find(m => m._id === option.value);
                                            if (!manager) return false;
                                            return (
                                                (manager.fullName || manager.name || '').toLowerCase().includes(input.toLowerCase()) ||
                                                (manager.department || '').toLowerCase().includes(input.toLowerCase()) ||
                                                (manager.position || '').toLowerCase().includes(input.toLowerCase())
                                            );
                                        }}
                                    >
                                        {projectManagers.map(manager => (
                                            <Option key={manager._id} value={manager._id}>
                                                <div>
                                                    <Text strong>{manager.fullName || manager.name || 'Unknown'}</Text>
                                                    <br />
                                                    <Text type="secondary" style={{ fontSize: '12px' }}>
                                                        {manager.position || manager.role || 'Employee'} | {manager.department || 'N/A'}
                                                    </Text>
                                                </div>
                                            </Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                            </Card>
                        ))}
                        <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                            Add Milestone
                        </Button>
                    </>
                )}
            </Form.List>

            <Divider />

            {/* <Form.Item>
                <Space>
                    <Button onClick={() => {
                        setProjectModalVisible(false);
                        setEditingProject(null);
                        form.resetFields();
                    }}>
                        Cancel
                    </Button>
                    <Button
                        type="primary"
                        htmlType="submit"
                        loading={loading}
                        icon={editingProject ? <EditOutlined /> : <PlusOutlined />}
                    >
                        {editingProject ? 'Update Project' : 'Create Project'}
                    </Button>
                </Space>
            </Form.Item> */}

            <Form.Item style={{ marginBottom: 0 }}>
                <Space>
                    <Button onClick={() => {
                        setProjectModalVisible(false);
                        setEditingProject(null);
                        form.resetFields();
                    }}>
                        Cancel
                    </Button>
                    
                    {/* Save as Draft Button */}
                    <Button
                        icon={<SaveOutlined />}
                        onClick={() => {
                            // Only validate name for draft
                            form.validateFields(['name'])
                                .then(() => {
                                    const values = form.getFieldsValue();
                                    handleSaveDraft(values);
                                })
                                .catch(() => {
                                    message.warning('Please enter a project name to save as draft');
                                });
                        }}
                        loading={loading}
                    >
                        Save as Draft
                    </Button>
                    
                    {/* Submit/Update Button */}
                    <Button 
                        type="primary" 
                        htmlType="submit" 
                        loading={loading}
                        icon={editingProject ? <EditOutlined /> : <SendOutlined />}
                    >
                        {editingProject ? 'Update Project' : 'Submit Project'}
                    </Button>
                </Space>
            </Form.Item>

        </Form>
    );

    // Analytics Modal Component
    const AnalyticsModal = () => {
        if (!projectAnalytics) return null;

        const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

        const healthScoreData = [
            { subject: 'Schedule', value: projectAnalytics.healthScore.schedule },
            { subject: 'Budget', value: projectAnalytics.healthScore.budget },
            { subject: 'Scope', value: projectAnalytics.healthScore.scope },
            { subject: 'Quality', value: projectAnalytics.healthScore.quality },
            { subject: 'Team', value: projectAnalytics.healthScore.team }
        ];

        const milestoneData = [
            { name: 'Not Started', value: projectAnalytics.milestones.notStarted },
            { name: 'In Progress', value: projectAnalytics.milestones.inProgress },
            { name: 'Completed', value: projectAnalytics.milestones.completed },
            { name: 'Overdue', value: projectAnalytics.milestones.overdue }
        ];

        const taskPriorityData = [
            { name: 'Critical', value: projectAnalytics.tasks.byPriority.critical },
            { name: 'High', value: projectAnalytics.tasks.byPriority.high },
            { name: 'Medium', value: projectAnalytics.tasks.byPriority.medium },
            { name: 'Low', value: projectAnalytics.tasks.byPriority.low }
        ];

        return (
            <Modal
                title={
                    <Space>
                        <BarChartOutlined />
                        {selectedProject?.name} - Comprehensive Analytics
                    </Space>
                }
                open={analyticsModalVisible}
                onCancel={() => setAnalyticsModalVisible(false)}
                footer={[
                    <Button key="close" onClick={() => setAnalyticsModalVisible(false)}>
                        Close
                    </Button>,
                    <Button 
                        key="refresh" 
                        type="primary" 
                        icon={<ReloadOutlined />}
                        onClick={() => fetchProjectAnalytics(selectedProject._id)}
                    >
                        Refresh
                    </Button>
                ]}
                width={1400}
                style={{ top: 20 }}
            >
                <Spin spinning={loadingAnalytics}>
                    <Tabs defaultActiveKey="overview">
                        {/* Overview Tab */}
                        <TabPane tab="Overview" key="overview">
                            <Row gutter={[16, 16]}>
                                {/* Health Score */}
                                <Col span={24}>
                                    <Card 
                                        title="Project Health Score" 
                                        extra={
                                            <Tag color={
                                                projectAnalytics.healthScore.overall >= 80 ? 'green' :
                                                projectAnalytics.healthScore.overall >= 60 ? 'orange' : 'red'
                                            } style={{ fontSize: '18px', padding: '4px 12px' }}>
                                                {projectAnalytics.healthScore.overall}%
                                            </Tag>
                                        }
                                    >
                                        <ResponsiveContainer width="100%" height={300}>
                                            <RadarChart data={healthScoreData}>
                                                <PolarGrid />
                                                <PolarAngleAxis dataKey="subject" />
                                                <PolarRadiusAxis angle={90} domain={[0, 100]} />
                                                <Radar 
                                                    name="Health Score" 
                                                    dataKey="value" 
                                                    stroke="#8884d8" 
                                                    fill="#8884d8" 
                                                    fillOpacity={0.6} 
                                                />
                                                <RechartsTooltip />
                                            </RadarChart>
                                        </ResponsiveContainer>
                                        <Row gutter={16} style={{ marginTop: 16 }}>
                                            <Col span={12}>
                                                <Statistic
                                                    title="Schedule Performance"
                                                    value={projectAnalytics.healthScore.schedule}
                                                    suffix="%"
                                                    valueStyle={{ 
                                                        color: projectAnalytics.healthScore.schedule >= 80 ? '#52c41a' : 
                                                               projectAnalytics.healthScore.schedule >= 60 ? '#faad14' : '#f5222d'
                                                    }}
                                                />
                                            </Col>
                                            <Col span={12}>
                                                <Statistic
                                                    title="Budget Performance"
                                                    value={projectAnalytics.healthScore.budget}
                                                    suffix="%"
                                                    valueStyle={{ 
                                                        color: projectAnalytics.healthScore.budget >= 80 ? '#52c41a' : 
                                                               projectAnalytics.healthScore.budget >= 60 ? '#faad14' : '#f5222d'
                                                    }}
                                                />
                                            </Col>
                                        </Row>
                                    </Card>
                                </Col>

                                {/* Timeline Analysis */}
                                <Col span={24}>
                                    <Card title="Timeline Analysis">
                                        <Row gutter={16}>
                                            <Col span={6}>
                                                <Statistic
                                                    title="Time Elapsed"
                                                    value={projectAnalytics.timelineAnalysis.percentTimeElapsed}
                                                    suffix="%"
                                                />
                                                <Text type="secondary" style={{ fontSize: '12px' }}>
                                                    {projectAnalytics.timelineAnalysis.daysElapsed} days
                                                </Text>
                                            </Col>
                                            <Col span={6}>
                                                <Statistic
                                                    title="Progress"
                                                    value={projectAnalytics.timelineAnalysis.percentComplete}
                                                    suffix="%"
                                                />
                                            </Col>
                                            <Col span={6}>
                                                <Statistic
                                                    title="Days Remaining"
                                                    value={projectAnalytics.timelineAnalysis.daysRemaining}
                                                />
                                            </Col>
                                            <Col span={6}>
                                                <Statistic
                                                    title="Schedule Status"
                                                    value={
                                                        projectAnalytics.timelineAnalysis.isAheadOfSchedule ? 'Ahead' :
                                                        projectAnalytics.timelineAnalysis.isOnTrack ? 'On Track' : 'Behind'
                                                    }
                                                    valueStyle={{
                                                        color: projectAnalytics.timelineAnalysis.isAheadOfSchedule ? '#52c41a' :
                                                               projectAnalytics.timelineAnalysis.isOnTrack ? '#1890ff' : '#f5222d'
                                                    }}
                                                />
                                            </Col>
                                        </Row>
                                        <Progress
                                            percent={projectAnalytics.timelineAnalysis.percentComplete}
                                            success={{ 
                                                percent: Math.min(
                                                    projectAnalytics.timelineAnalysis.percentComplete,
                                                    projectAnalytics.timelineAnalysis.percentTimeElapsed
                                                )
                                            }}
                                            style={{ marginTop: 16 }}
                                        />
                                    </Card>
                                </Col>

                                {/* Quick Stats */}
                                <Col span={24}>
                                    <Row gutter={16}>
                                        <Col span={6}>
                                            <Card>
                                                <Statistic
                                                    title="Milestones"
                                                    value={projectAnalytics.milestones.completed}
                                                    suffix={`/ ${projectAnalytics.milestones.total}`}
                                                    prefix={<FlagOutlined />}
                                                    valueStyle={{ color: '#1890ff' }}
                                                />
                                                {projectAnalytics.milestones.overdue > 0 && (
                                                    <Alert
                                                        message={`${projectAnalytics.milestones.overdue} overdue`}
                                                        type="warning"
                                                        showIcon
                                                        style={{ marginTop: 8 }}
                                                    />
                                                )}
                                            </Card>
                                        </Col>
                                        <Col span={6}>
                                            <Card>
                                                <Statistic
                                                    title="Tasks"
                                                    value={projectAnalytics.tasks.completed}
                                                    suffix={`/ ${projectAnalytics.tasks.total}`}
                                                    prefix={<CheckCircleOutlined />}
                                                    valueStyle={{ color: '#52c41a' }}
                                                />
                                                {projectAnalytics.tasks.overdue > 0 && (
                                                    <Alert
                                                        message={`${projectAnalytics.tasks.overdue} overdue`}
                                                        type="error"
                                                        showIcon
                                                        style={{ marginTop: 8 }}
                                                    />
                                                )}
                                            </Card>
                                        </Col>
                                        <Col span={6}>
                                            <Card>
                                                <Statistic
                                                    title="Open Issues"
                                                    value={projectAnalytics.issues.open}
                                                    prefix={<WarningOutlined />}
                                                    valueStyle={{ 
                                                        color: projectAnalytics.issues.open > 5 ? '#f5222d' : '#faad14'
                                                    }}
                                                />
                                                {projectAnalytics.issues.bySeverity.critical > 0 && (
                                                    <Alert
                                                        message={`${projectAnalytics.issues.bySeverity.critical} critical`}
                                                        type="error"
                                                        showIcon
                                                        style={{ marginTop: 8 }}
                                                    />
                                                )}
                                            </Card>
                                        </Col>
                                        <Col span={6}>
                                            <Card>
                                                <Statistic
                                                    title="Active Risks"
                                                    value={projectAnalytics.risks.total - projectAnalytics.risks.byStatus.closed}
                                                    prefix={<ExclamationCircleOutlined />}
                                                    valueStyle={{ color: '#722ed1' }}
                                                />
                                            </Card>
                                        </Col>
                                    </Row>
                                </Col>
                            </Row>
                        </TabPane>

                        {/* Milestones Tab */}
                        <TabPane tab={`Milestones (${projectAnalytics.milestones.total})`} key="milestones">
                            <Row gutter={16}>
                                <Col span={12}>
                                    <Card title="Milestone Status Distribution">
                                        <ResponsiveContainer width="100%" height={300}>
                                            <PieChart>
                                                <Pie
                                                    data={milestoneData}
                                                    cx="50%"
                                                    cy="50%"
                                                    labelLine={false}
                                                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                                    outerRadius={80}
                                                    fill="#8884d8"
                                                    dataKey="value"
                                                >
                                                    {milestoneData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <RechartsTooltip />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </Card>
                                </Col>
                                <Col span={12}>
                                    <Card title="Milestone Statistics">
                                        <Space direction="vertical" style={{ width: '100%' }} size="large">
                                            <Statistic
                                                title="Completion Rate"
                                                value={projectAnalytics.milestones.completionRate}
                                                suffix="%"
                                                prefix={<TrophyOutlined />}
                                            />
                                            <Progress 
                                                percent={projectAnalytics.milestones.completionRate}
                                                strokeColor={{
                                                    '0%': '#108ee9',
                                                    '100%': '#87d068',
                                                }}
                                            />
                                            <Row gutter={16}>
                                                <Col span={12}>
                                                    <Statistic
                                                        title="In Progress"
                                                        value={projectAnalytics.milestones.inProgress}
                                                        valueStyle={{ color: '#1890ff' }}
                                                    />
                                                </Col>
                                                <Col span={12}>
                                                    <Statistic
                                                        title="Not Started"
                                                        value={projectAnalytics.milestones.notStarted}
                                                        valueStyle={{ color: '#faad14' }}
                                                    />
                                                </Col>
                                            </Row>
                                        </Space>
                                    </Card>
                                </Col>
                            </Row>
                        </TabPane>

                        {/* Tasks Tab */}
                        <TabPane tab={`Tasks (${projectAnalytics.tasks.total})`} key="tasks">
                            <Row gutter={16}>
                                <Col span={12}>
                                    <Card title="Task Priority Distribution">
                                        <ResponsiveContainer width="100%" height={300}>
                                            <BarChart data={taskPriorityData}>
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="name" />
                                                <YAxis />
                                                <RechartsTooltip />
                                                <Bar dataKey="value" fill="#8884d8">
                                                    {taskPriorityData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </Card>
                                </Col>
                                <Col span={12}>
                                    <Card title="Task Statistics">
                                        <Space direction="vertical" style={{ width: '100%' }} size="large">
                                            <Row gutter={16}>
                                                <Col span={12}>
                                                    <Statistic
                                                        title="Completed"
                                                        value={projectAnalytics.tasks.completed}
                                                        prefix={<CheckCircleOutlined />}
                                                        valueStyle={{ color: '#52c41a' }}
                                                    />
                                                </Col>
                                                <Col span={12}>
                                                    <Statistic
                                                        title="In Progress"
                                                        value={projectAnalytics.tasks.inProgress}
                                                        prefix={<PlayCircleOutlined />}
                                                        valueStyle={{ color: '#1890ff' }}
                                                    />
                                                </Col>
                                            </Row>
                                            <Row gutter={16}>
                                                <Col span={12}>
                                                    <Statistic
                                                        title="Not Started"
                                                        value={projectAnalytics.tasks.notStarted}
                                                        valueStyle={{ color: '#faad14' }}
                                                    />
                                                </Col>
                                                <Col span={12}>
                                                    <Statistic
                                                        title="Overdue"
                                                        value={projectAnalytics.tasks.overdue}
                                                        prefix={<WarningOutlined />}
                                                        valueStyle={{ color: '#f5222d' }}
                                                    />
                                                </Col>
                                            </Row>
                                            {projectAnalytics.tasks.averageCompletionTime > 0 && (
                                                <Statistic
                                                    title="Avg. Completion Time"
                                                    value={Math.round(projectAnalytics.tasks.averageCompletionTime / (1000 * 60 * 60 * 24))}
                                                    suffix="days"
                                                />
                                            )}
                                        </Space>
                                    </Card>
                                </Col>
                            </Row>
                        </TabPane>

                        <TabPane 
                            tab={
                                <Badge count={myMilestones.length} size="small">
                                    <span><TeamOutlined /> My Supervised Milestones</span>
                                </Badge>
                            } 
                            key="my-milestones"
                        />

                        {/* Budget Tab */}
                        {projectAnalytics.budget && (
                            <TabPane tab="Budget" key="budget">
                                <Row gutter={16}>
                                    <Col span={24}>
                                        <Card 
                                            title="Budget Overview"
                                            extra={
                                                projectAnalytics.budget.isOverBudget && (
                                                    <Tag color="red" icon={<WarningOutlined />}>
                                                        Over Budget
                                                    </Tag>
                                                )
                                            }
                                        >
                                            <Row gutter={16}>
                                                <Col span={8}>
                                                    <Statistic
                                                        title="Allocated Budget"
                                                        value={projectAnalytics.budget.allocated}
                                                        prefix="XAF"
                                                        precision={0}
                                                    />
                                                </Col>
                                                <Col span={8}>
                                                    <Statistic
                                                        title="Spent"
                                                        value={projectAnalytics.budget.spent}
                                                        prefix="XAF"
                                                        precision={0}
                                                        valueStyle={{ 
                                                            color: projectAnalytics.budget.isOverBudget ? '#f5222d' : '#52c41a'
                                                        }}
                                                    />
                                                </Col>
                                                <Col span={8}>
                                                    <Statistic
                                                        title="Remaining"
                                                        value={projectAnalytics.budget.remaining}
                                                        prefix="XAF"
                                                        precision={0}
                                                    />
                                                </Col>
                                            </Row>
                                            <Divider />
                                            <Row gutter={16}>
                                                <Col span={12}>
                                                    <Statistic
                                                        title="Utilization Rate"
                                                        value={projectAnalytics.budget.utilizationRate}
                                                        suffix="%"
                                                        precision={1}
                                                    />
                                                    <Progress
                                                        percent={projectAnalytics.budget.utilizationRate}
                                                        status={projectAnalytics.budget.isOverBudget ? 'exception' : 'active'}
                                                        style={{ marginTop: 8 }}
                                                    />
                                                </Col>
                                                <Col span={12}>
                                                    <Statistic
                                                        title="Daily Burn Rate"
                                                        value={projectAnalytics.budget.burnRate}
                                                        prefix="XAF"
                                                        precision={0}
                                                    />
                                                    <Alert
                                                        message={`Projected Total: XAF ${Math.round(projectAnalytics.budget.projectedTotal).toLocaleString()}`}
                                                        type={projectAnalytics.budget.projectedTotal > projectAnalytics.budget.allocated ? 'warning' : 'info'}
                                                        showIcon
                                                        style={{ marginTop: 8 }}
                                                    />
                                                </Col>
                                            </Row>
                                        </Card>
                                    </Col>
                                </Row>
                            </TabPane>
                        )}

                        {/* Risks Tab */}
                        <TabPane 
                            tab={
                                <Badge count={projectAnalytics.risks.total - projectAnalytics.risks.byStatus.closed}>
                                    <span>Risks</span>
                                </Badge>
                            } 
                            key="risks"
                        >
                            <Card
                                title="Risk Management"
                                extra={
                                    <Button
                                        type="primary"
                                        icon={<PlusOutlined />}
                                        onClick={() => setRiskModalVisible(true)}
                                    >
                                        Add Risk
                                    </Button>
                                }
                            >
                                <Row gutter={16}>
                                    <Col span={12}>
                                        <Card size="small" title="Risk Status">
                                            <Space direction="vertical" style={{ width: '100%' }}>
                                                <Row justify="space-between">
                                                    <Text>Identified</Text>
                                                    <Tag color="blue">{projectAnalytics.risks.byStatus.identified}</Tag>
                                                </Row>
                                                <Row justify="space-between">
                                                    <Text>Analyzing</Text>
                                                    <Tag color="cyan">{projectAnalytics.risks.byStatus.analyzing}</Tag>
                                                </Row>
                                                <Row justify="space-between">
                                                    <Text>Mitigating</Text>
                                                    <Tag color="orange">{projectAnalytics.risks.byStatus.mitigating}</Tag>
                                                </Row>
                                                <Row justify="space-between">
                                                    <Text>Monitoring</Text>
                                                    <Tag color="purple">{projectAnalytics.risks.byStatus.monitoring}</Tag>
                                                </Row>
                                                <Row justify="space-between">
                                                    <Text>Closed</Text>
                                                    <Tag color="green">{projectAnalytics.risks.byStatus.closed}</Tag>
                                                </Row>
                                            </Space>
                                        </Card>
                                    </Col>
                                    <Col span={12}>
                                        <Card size="small" title="Risk Impact">
                                            <Space direction="vertical" style={{ width: '100%' }}>
                                                <Row justify="space-between">
                                                    <Text><Badge status="error" /> Very High</Text>
                                                    <Tag color="red">{projectAnalytics.risks.byImpact.veryHigh}</Tag>
                                                </Row>
                                                <Row justify="space-between">
                                                    <Text><Badge status="warning" /> High</Text>
                                                    <Tag color="orange">{projectAnalytics.risks.byImpact.high}</Tag>
                                                </Row>
                                                <Row justify="space-between">
                                                    <Text><Badge status="processing" /> Medium</Text>
                                                    <Tag color="blue">{projectAnalytics.risks.byImpact.medium}</Tag>
                                                </Row>
                                                <Row justify="space-between">
                                                    <Text><Badge status="success" /> Low</Text>
                                                    <Tag color="green">{projectAnalytics.risks.byImpact.low}</Tag>
                                                </Row>
                                                <Row justify="space-between">
                                                    <Text><Badge status="default" /> Very Low</Text>
                                                    <Tag>{projectAnalytics.risks.byImpact.veryLow}</Tag>
                                                </Row>
                                            </Space>
                                        </Card>
                                    </Col>
                                </Row>
                            </Card>
                        </TabPane>

                        {/* Issues Tab */}
                        <TabPane 
                            tab={
                                <Badge count={projectAnalytics.issues.open}>
                                    <span>Issues</span>
                                </Badge>
                            } 
                            key="issues"
                        >
                            <Card
                                title="Issue Tracking"
                                extra={
                                    <Button
                                        type="primary"
                                        icon={<PlusOutlined />}
                                        onClick={() => setIssueModalVisible(true)}
                                    >
                                        Report Issue
                                    </Button>
                                }
                            >
                                <Row gutter={16}>
                                    <Col span={24}>
                                        <Space direction="vertical" style={{ width: '100%' }} size="large">
                                            <Row gutter={16}>
                                                <Col span={6}>
                                                    <Statistic
                                                        title="Open Issues"
                                                        value={projectAnalytics.issues.open}
                                                        prefix={<WarningOutlined />}
                                                        valueStyle={{ color: '#f5222d' }}
                                                    />
                                                </Col>
                                                <Col span={6}>
                                                    <Statistic
                                                        title="In Progress"
                                                        value={projectAnalytics.issues.inProgress}
                                                        valueStyle={{ color: '#1890ff' }}
                                                    />
                                                </Col>
                                                <Col span={6}>
                                                    <Statistic
                                                        title="Resolved"
                                                        value={projectAnalytics.issues.resolved}
                                                        valueStyle={{ color: '#52c41a' }}
                                                    />
                                                </Col>
                                                <Col span={6}>
                                                    <Statistic
                                                        title="Closed"
                                                        value={projectAnalytics.issues.closed}
                                                        valueStyle={{ color: '#8c8c8c' }}
                                                    />
                                                </Col>
                                            </Row>
                                            <Card size="small" title="Issues by Severity">
                                                <Row gutter={16}>
                                                    <Col span={6}>
                                                        <Statistic
                                                            title="Critical"
                                                            value={projectAnalytics.issues.bySeverity.critical}
                                                            valueStyle={{ color: '#f5222d' }}
                                                        />
                                                    </Col>
                                                    <Col span={6}>
                                                        <Statistic
                                                            title="High"
                                                            value={projectAnalytics.issues.bySeverity.high}
                                                            valueStyle={{ color: '#fa8c16' }}
                                                        />
                                                    </Col>
                                                    <Col span={6}>
                                                        <Statistic
                                                            title="Medium"
                                                            value={projectAnalytics.issues.bySeverity.medium}
                                                            valueStyle={{ color: '#1890ff' }}/>
                                                    </Col>
                                                    <Col span={6}>
                                                        <Statistic
                                                            title="Low"
                                                            value={projectAnalytics.issues.bySeverity.low}
                                                            valueStyle={{ color: '#52c41a' }}
                                                        />
                                                    </Col>
                                                </Row>
                                            </Card>
                                            {projectAnalytics.issues.averageResolutionTime > 0 && (
                                                <Alert
                                                    message={`Average Resolution Time: ${Math.round(projectAnalytics.issues.averageResolutionTime / (1000 * 60 * 60 * 24))} days`}
                                                    type="info"
                                                    showIcon
                                                />
                                            )}
                                        </Space>
                                    </Col>
                                </Row>
                            </Card>
                        </TabPane>

                        {/* Change Requests Tab */}
                        <TabPane 
                            tab={
                                <Badge count={projectAnalytics.changeRequests.pending}>
                                    <span>Change Requests</span>
                                </Badge>
                            } 
                            key="changes"
                        >
                            <Card
                                title="Change Management"
                                extra={
                                    <Button
                                        type="primary"
                                        icon={<PlusOutlined />}
                                        onClick={() => setChangeRequestModalVisible(true)}
                                    >
                                        Submit Change Request
                                    </Button>
                                }
                            >
                                <Row gutter={16}>
                                    <Col span={8}>
                                        <Statistic
                                            title="Total Requests"
                                            value={projectAnalytics.changeRequests.total}
                                        />
                                    </Col>
                                    <Col span={8}>
                                        <Statistic
                                            title="Pending Approval"
                                            value={projectAnalytics.changeRequests.pending}
                                            valueStyle={{ color: '#faad14' }}
                                        />
                                    </Col>
                                    <Col span={8}>
                                        <Statistic
                                            title="Approved"
                                            value={projectAnalytics.changeRequests.approved}
                                            valueStyle={{ color: '#52c41a' }}
                                        />
                                    </Col>
                                </Row>
                            </Card>
                        </TabPane>

                        {/* Team Tab */}
                        <TabPane tab={`Team (${projectAnalytics.team.totalMembers})`} key="team">
                            <Card title="Team Composition">
                                <Row gutter={16}>
                                    <Col span={12}>
                                        <Statistic
                                            title="Total Team Members"
                                            value={projectAnalytics.team.totalMembers}
                                            prefix={<TeamOutlined />}
                                        />
                                    </Col>
                                    <Col span={12}>
                                        <Card size="small" title="Roles Distribution">
                                            <Space direction="vertical" style={{ width: '100%' }}>
                                                {Object.entries(projectAnalytics.team.byRole).map(([role, count]) => (
                                                    <Row key={role} justify="space-between">
                                                        <Text>{role}</Text>
                                                        <Tag color="blue">{count}</Tag>
                                                    </Row>
                                                ))}
                                            </Space>
                                        </Card>
                                    </Col>
                                </Row>
                            </Card>
                        </TabPane>
                        {/* Meetings Tab */}
                        <TabPane tab="Meetings" key="meetings">
                            <Card
                                title="Project Meetings"
                                extra={
                                    <Button
                                        type="primary"
                                        icon={<PlusOutlined />}
                                        onClick={() => setMeetingModalVisible(true)}
                                    >
                                        Log Meeting
                                    </Button>
                                }
                            >
                                <Alert
                                    message="Meeting Management"
                                    description="Track all project meetings, decisions, and action items. Log meetings to maintain project documentation and accountability."
                                    type="info"
                                    showIcon
                                    style={{ marginBottom: 16 }}
                                />
                                
                                {projectAnalytics.meetings && projectAnalytics.meetings.length > 0 ? (
                                    <List
                                        itemLayout="vertical"
                                        dataSource={projectAnalytics.meetings}
                                        renderItem={(meeting) => (
                                            <List.Item
                                                key={meeting._id}
                                                extra={
                                                    <Space direction="vertical">
                                                        <Tag color="blue">
                                                            <ClockCircleOutlined /> {meeting.duration} min
                                                        </Tag>
                                                        <Text type="secondary" style={{ fontSize: '12px' }}>
                                                            {moment(meeting.date).format('MMM DD, YYYY HH:mm')}
                                                        </Text>
                                                    </Space>
                                                }
                                            >
                                                <List.Item.Meta
                                                    avatar={<Avatar icon={<CalendarOutlined />} />}
                                                    title={<Text strong>{meeting.title}</Text>}
                                                    description={
                                                        <Space direction="vertical" style={{ width: '100%' }}>
                                                            <Text type="secondary">
                                                                <TeamOutlined /> Attendees: {meeting.attendees?.length || 0}
                                                            </Text>
                                                            {meeting.agenda && meeting.agenda.length > 0 && (
                                                                <div>
                                                                    <Text strong>Agenda:</Text>
                                                                    <ul style={{ marginTop: 4, marginBottom: 8 }}>
                                                                        {meeting.agenda.map((item, idx) => (
                                                                            <li key={idx}><Text type="secondary">{item}</Text></li>
                                                                        ))}
                                                                    </ul>
                                                                </div>
                                                            )}
                                                            {meeting.actionItems && meeting.actionItems.length > 0 && (
                                                                <div>
                                                                    <Text strong>Action Items: </Text>
                                                                    <Tag color="orange">{meeting.actionItems.length} items</Tag>
                                                                </div>
                                                            )}
                                                        </Space>
                                                    }
                                                />
                                                {meeting.minutes && (
                                                    <Paragraph
                                                        ellipsis={{ rows: 2, expandable: true }}
                                                        style={{ marginTop: 8 }}
                                                    >
                                                        {meeting.minutes}
                                                    </Paragraph>
                                                )}
                                            </List.Item>
                                        )}
                                        pagination={{
                                            pageSize: 5,
                                            size: 'small'
                                        }}
                                    />
                                ) : (
                                    <Alert
                                        message="No meetings logged yet"
                                        description="Log your first project meeting to start tracking discussions and action items."
                                        type="info"
                                        showIcon
                                    />
                                )}
                            </Card>
                        </TabPane>
                    </Tabs>
                </Spin>
            </Modal>
        );
    };

    // Risk Modal Component
    const RiskModal = () => (
        <Modal
            title={
                <Space>
                    <ExclamationCircleOutlined />
                    Add Project Risk
                </Space>
            }
            open={riskModalVisible}
            onCancel={() => {
                setRiskModalVisible(false);
                riskForm.resetFields();
            }}
            footer={null}
            width={800}
        >
            <Form
                form={riskForm}
                layout="vertical"
                onFinish={handleAddRisk}
            >
                <Row gutter={16}>
                    <Col span={24}>
                        <Form.Item
                            name="title"
                            label="Risk Title"
                            rules={[{ required: true, message: 'Please enter risk title' }]}
                        >
                            <Input placeholder="e.g., Resource shortage risk" />
                        </Form.Item>
                    </Col>
                    <Col span={24}>
                        <Form.Item
                            name="description"
                            label="Description"
                            rules={[{ required: true, message: 'Please describe the risk' }]}
                        >
                            <TextArea rows={3} placeholder="Detailed description of the risk..." />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item
                            name="category"
                            label="Category"
                            rules={[{ required: true, message: 'Please select category' }]}
                        >
                            <Select placeholder="Select category">
                                <Option value="Technical">Technical</Option>
                                <Option value="Financial">Financial</Option>
                                <Option value="Resource">Resource</Option>
                                <Option value="Schedule">Schedule</Option>
                                <Option value="External">External</Option>
                                <Option value="Other">Other</Option>
                            </Select>
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item
                            name="probability"
                            label="Probability"
                            rules={[{ required: true, message: 'Please select probability' }]}
                        >
                            <Select placeholder="Select probability">
                                <Option value="Very Low">Very Low</Option>
                                <Option value="Low">Low</Option>
                                <Option value="Medium">Medium</Option>
                                <Option value="High">High</Option>
                                <Option value="Very High">Very High</Option>
                            </Select>
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item
                            name="impact"
                            label="Impact"
                            rules={[{ required: true, message: 'Please select impact' }]}
                        >
                            <Select placeholder="Select impact">
                                <Option value="Very Low">Very Low</Option>
                                <Option value="Low">Low</Option>
                                <Option value="Medium">Medium</Option>
                                <Option value="High">High</Option>
                                <Option value="Very High">Very High</Option>
                            </Select>
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            name="mitigation"
                            label="Mitigation Strategy"
                            rules={[{ required: true, message: 'Please enter mitigation strategy' }]}
                        >
                            <TextArea rows={2} placeholder="How will this risk be mitigated?" />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            name="contingency"
                            label="Contingency Plan"
                        >
                            <TextArea rows={2} placeholder="What's the backup plan if risk occurs?" />
                        </Form.Item>
                    </Col>
                </Row>

                <Form.Item>
                    <Space>
                        <Button onClick={() => {
                            setRiskModalVisible(false);
                            riskForm.resetFields();
                        }}>
                            Cancel
                        </Button>
                        <Button type="primary" htmlType="submit" loading={loading}>
                            Add Risk
                        </Button>
                    </Space>
                </Form.Item>
            </Form>
        </Modal>
    );

    // Issue Modal Component
    const IssueModal = () => (
        <Modal
            title={
                <Space>
                    <WarningOutlined />
                    Report Project Issue
                </Space>
            }
            open={issueModalVisible}
            onCancel={() => {
                setIssueModalVisible(false);
                issueForm.resetFields();
            }}
            footer={null}
            width={700}
        >
            <Form
                form={issueForm}
                layout="vertical"
                onFinish={handleAddIssue}
            >
                <Row gutter={16}>
                    <Col span={24}>
                        <Form.Item
                            name="title"
                            label="Issue Title"
                            rules={[{ required: true, message: 'Please enter issue title' }]}
                        >
                            <Input placeholder="e.g., Equipment delay" />
                        </Form.Item>
                    </Col>
                    <Col span={24}>
                        <Form.Item
                            name="description"
                            label="Description"
                            rules={[{ required: true, message: 'Please describe the issue' }]}
                        >
                            <TextArea rows={4} placeholder="Detailed description of the issue..." />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            name="severity"
                            label="Severity"
                            rules={[{ required: true, message: 'Please select severity' }]}
                        >
                            <Select placeholder="Select severity">
                                <Option value="Low">🟢 Low</Option>
                                <Option value="Medium">🟡 Medium</Option>
                                <Option value="High">🟠 High</Option>
                                <Option value="Critical">🔴 Critical</Option>
                            </Select>
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            name="assignedTo"
                            label="Assign To"
                            rules={[{ required: true, message: 'Please assign to someone' }]}
                        >
                            <Select
                                placeholder="Select team member"
                                showSearch
                                filterOption={(input, option) => {
                                    const manager = projectManagers.find(m => m._id === option.value);
                                    if (!manager) return false;
                                    return (
                                        (manager.fullName || manager.name || '').toLowerCase().includes(input.toLowerCase()) ||
                                        (manager.department || '').toLowerCase().includes(input.toLowerCase())
                                    );
                                }}
                            >
                                {projectManagers.map(manager => (
                                    <Option key={manager._id} value={manager._id}>
                                        <div>
                                            <Text strong>{manager.fullName || manager.name}</Text>
                                            <br />
                                            <Text type="secondary" style={{ fontSize: '12px' }}>
                                                {manager.role || 'Employee'} | {manager.department}
                                            </Text>
                                        </div>
                                    </Option>
                                ))}
                            </Select>
                        </Form.Item>
                    </Col>
                </Row>

                <Form.Item>
                    <Space>
                        <Button onClick={() => {
                            setIssueModalVisible(false);
                            issueForm.resetFields();
                        }}>
                            Cancel
                        </Button>
                        <Button type="primary" htmlType="submit" loading={loading}>
                            Report Issue
                        </Button>
                    </Space>
                </Form.Item>
            </Form>
        </Modal>
    );

    // Change Request Modal Component
    const ChangeRequestModal = () => (
        <Modal
            title={
                <Space>
                    <SwapOutlined />
                    Submit Change Request
                </Space>
            }
            open={changeRequestModalVisible}
            onCancel={() => {
                setChangeRequestModalVisible(false);
                changeRequestForm.resetFields();
            }}
            footer={null}
            width={800}
        >
            <Alert
                message="Important: Change Request Process"
                description="All change requests must be approved by the project manager before implementation. Consider the impact on schedule, budget, and resources."
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
            />
            
            <Form
                form={changeRequestForm}
                layout="vertical"
                onFinish={handleAddChangeRequest}
            >
                <Row gutter={16}>
                    <Col span={24}>
                        <Form.Item
                            name="title"
                            label="Change Title"
                            rules={[{ required: true, message: 'Please enter change title' }]}
                        >
                            <Input placeholder="e.g., Extend project timeline by 2 weeks" />
                        </Form.Item>
                    </Col>
                    <Col span={24}>
                        <Form.Item
                            name="description"
                            label="Description"
                            rules={[{ required: true, message: 'Please describe the change' }]}
                        >
                            <TextArea rows={3} placeholder="Detailed description of the proposed change..." />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            name="type"
                            label="Change Type"
                            rules={[{ required: true, message: 'Please select type' }]}
                        >
                            <Select placeholder="Select type">
                                <Option value="Scope">Scope Change</Option>
                                <Option value="Schedule">Schedule Change</Option>
                                <Option value="Budget">Budget Change</Option>
                                <Option value="Resources">Resources Change</Option>
                                <Option value="Quality">Quality Change</Option>
                                <Option value="Other">Other</Option>
                            </Select>
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            name="impact"
                            label="Impact Level"
                            rules={[{ required: true, message: 'Please describe impact' }]}
                        >
                            <Select placeholder="Select impact">
                                <Option value="Low - Minimal impact">Low - Minimal impact</Option>
                                <Option value="Medium - Moderate impact">Medium - Moderate impact</Option>
                                <Option value="High - Significant impact">High - Significant impact</Option>
                                <Option value="Critical - Major impact">Critical - Major impact</Option>
                            </Select>
                        </Form.Item>
                    </Col>
                    <Col span={24}>
                        <Form.Item
                            name="justification"
                            label="Justification"
                            rules={[{ required: true, message: 'Please justify the change' }]}
                        >
                            <TextArea rows={3} placeholder="Why is this change necessary? What are the benefits?" />
                        </Form.Item>
                    </Col>
                </Row>

                <Form.Item>
                    <Space>
                        <Button onClick={() => {
                            setChangeRequestModalVisible(false);
                            changeRequestForm.resetFields();
                        }}>
                            Cancel
                        </Button>
                        <Button type="primary" htmlType="submit" loading={loading}>
                            Submit Change Request
                        </Button>
                    </Space>
                </Form.Item>
            </Form>
        </Modal>
    );

    // Meeting Modal Component
    const MeetingModal = () => (
        <Modal
            title={
                <Space>
                    <CalendarOutlined />
                    Log Project Meeting
                </Space>
            }
            open={meetingModalVisible}
            onCancel={() => {
                setMeetingModalVisible(false);
                meetingForm.resetFields();
            }}
            footer={null}
            width={900}
        >
            <Form
                form={meetingForm}
                layout="vertical"
                onFinish={handleLogMeeting}
            >
                <Row gutter={16}>
                    <Col span={16}>
                        <Form.Item
                            name="title"
                            label="Meeting Title"
                            rules={[{ required: true, message: 'Please enter meeting title' }]}
                        >
                            <Input placeholder="e.g., Weekly Status Review" />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item
                            name="duration"
                            label="Duration (minutes)"
                            rules={[{ required: true, message: 'Please enter duration' }]}
                        >
                            <InputNumber min={15} max={480} style={{ width: '100%' }} placeholder="60" />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            name="date"
                            label="Meeting Date"
                            rules={[{ required: true, message: 'Please select date' }]}
                        >
                            <DatePicker showTime style={{ width: '100%' }} />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            name="attendees"
                            label="Attendees"
                            rules={[{ required: true, message: 'Please select attendees' }]}
                        >
                            <Select
                                mode="multiple"
                                placeholder="Select attendees"
                                showSearch
                                filterOption={(input, option) => {
                                    const manager = projectManagers.find(m => m._id === option.value);
                                    if (!manager) return false;
                                    return (manager.fullName || manager.name || '').toLowerCase().includes(input.toLowerCase());
                                }}
                            >
                                {projectManagers.map(manager => (
                                    <Option key={manager._id} value={manager._id}>
                                        {manager.fullName || manager.name}
                                    </Option>
                                ))}
                            </Select>
                        </Form.Item>
                    </Col>
                    <Col span={24}>
                        <Form.Item
                            name="agenda"
                            label="Agenda Items"
                            rules={[{ required: true, message: 'Please enter agenda' }]}
                        >
                            <Select
                                mode="tags"
                                placeholder="Enter agenda items (press Enter after each)"
                                style={{ width: '100%' }}
                            />
                        </Form.Item>
                    </Col>
                    <Col span={24}>
                        <Form.Item
                            name="minutes"
                            label="Meeting Minutes"
                            rules={[{ required: true, message: 'Please enter meeting minutes' }]}
                        >
                            <TextArea rows={5} placeholder="Summary of what was discussed..." />
                        </Form.Item>
                    </Col>
                </Row>

                <Divider>Action Items from Meeting</Divider>

                <Form.List name="actionItems">
                    {(fields, { add, remove }) => (
                        <>
                            {fields.map(({ key, name, ...restField }) => (
                                <Card key={key} size="small" style={{ marginBottom: 16 }}>
                                    <Row gutter={16} align="middle">
                                        <Col span={10}>
                                            <Form.Item
                                                {...restField}
                                                name={[name, 'description']}
                                                label="Action Item"
                                                rules={[{ required: true, message: 'Required' }]}
                                            >
                                                <Input placeholder="What needs to be done?" />
                                            </Form.Item>
                                        </Col>
                                        <Col span={8}>
                                            <Form.Item
                                                {...restField}
                                                name={[name, 'assignedTo']}
                                                label="Assigned To"
                                                rules={[{ required: true, message: 'Required' }]}
                                            >
                                                <Select placeholder="Select person">
                                                    {projectManagers.map(manager => (
                                                        <Option key={manager._id} value={manager._id}>
                                                            {manager.fullName || manager.name}
                                                        </Option>
                                                    ))}
                                                </Select>
                                            </Form.Item>
                                        </Col>
                                        <Col span={4}>
                                            <Form.Item
                                                {...restField}
                                                name={[name, 'dueDate']}
                                                label="Due Date"
                                                rules={[{ required: true, message: 'Required' }]}
                                            >
                                                <DatePicker style={{ width: '100%' }} />
                                            </Form.Item>
                                        </Col>
                                        <Col span={2} style={{ paddingTop: 30 }}>
                                            <Button 
                                                type="link" 
                                                danger
                                                icon={<MinusCircleOutlined />}
                                                onClick={() => remove(name)}
                                            />
                                        </Col>
                                    </Row>
                                </Card>
                            ))}
                            <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                                Add Action Item
                            </Button>
                        </>
                    )}
                </Form.List>

                <Form.Item style={{ marginTop: 16 }}>
                    <Space>
                        <Button onClick={() => {
                            setMeetingModalVisible(false);
                            meetingForm.resetFields();
                        }}>
                            Cancel
                        </Button>
                        <Button type="primary" htmlType="submit" loading={loading}>
                            Log Meeting
                        </Button>
                    </Space>
                </Form.Item>
            </Form>
        </Modal>
    );

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
                        <ProjectOutlined /> Project Management Portal
                    </Title>
                    <Space>
                        <Button
                            icon={<ReloadOutlined />}
                            onClick={() => {
                                fetchProjects();
                                fetchStats();
                                fetchBudgetCodes();
                            }}
                            loading={loading}
                        >
                            Refresh
                        </Button>
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={() => openProjectModal()}
                        >
                            Create Project
                        </Button>
                    </Space>
                </div>

                <Card size="small" style={{ marginBottom: '24px', backgroundColor: '#f0f8ff' }}>
                    <Row gutter={16}>
                        <Col span={6}>
                            <Statistic
                                title="Total Projects"
                                value={stats.total}
                                prefix={<ProjectOutlined />}
                                valueStyle={{ color: '#1890ff' }}
                            />
                        </Col>
                        <Col span={6}>
                            <Statistic
                                title="Active Projects"
                                value={stats.active}
                                valueStyle={{ color: '#52c41a' }}
                            />
                        </Col>
                        <Col span={6}>
                            <Statistic
                                title="Completed"
                                value={stats.completed}
                                valueStyle={{ color: '#722ed1' }}
                            />
                        </Col>
                        <Col span={6}>
                            <Statistic
                                title="Drafts"
                                value={stats.drafts}
                                prefix={<ClockCircleOutlined />}
                                valueStyle={{ color: '#faad14' }}
                            />
                        </Col>
                    </Row>
                </Card>

                <Tabs activeKey={activeTab} onChange={setActiveTab} style={{ marginBottom: '16px' }}>
                    <TabPane 
                        tab={
                            <Badge 
                                count={projects.filter(p => !p.isDraft && ['Planning', 'Approved', 'In Progress'].includes(p.status)).length} 
                                size="small"
                            >
                                <span>Active Projects</span>
                            </Badge>
                        } 
                        key="active"
                    />
                    <TabPane 
                        tab={
                            <Badge 
                                count={projects.filter(p => p.isDraft).length} 
                                size="small"
                                style={{ backgroundColor: '#faad14' }}
                            >
                                <span><ClockCircleOutlined /> Drafts</span>
                            </Badge>
                        } 
                        key="drafts"
                    />
                    <TabPane 
                        tab={
                            <Badge count={projects.filter(p => !p.isDraft && p.status === 'Completed').length} size="small">
                                <span>Completed</span>
                            </Badge>
                        } 
                        key="completed"
                    />
                    <TabPane 
                        tab={
                            <Badge count={stats.overdue} size="small">
                                <span>Overdue</span>
                            </Badge>
                        } 
                        key="overdue"
                    />
                    <TabPane 
                        tab={
                            <Badge count={projects.filter(p => !p.isDraft).length} size="small">
                                <span>All Projects</span>
                            </Badge>
                        } 
                        key="all"
                    />
                </Tabs>


                <Table
                    columns={columns}
                    dataSource={getFilteredProjects()}
                    loading={loading}
                    rowKey="_id"
                    pagination={{
                        showSizeChanger: true,
                        showQuickJumper: true,
                        showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} projects`,
                    }}
                    scroll={{ x: 1600 }}
                    size="small"
                />
            </Card>

            {/* Create/Edit Project Modal */}
            <Modal
                title={
                    <Space>
                        <ProjectOutlined />
                        {editingProject ? 'Edit Project' : 'Create New Project'}
                    </Space>
                }
                open={projectModalVisible}
                onCancel={() => {
                    setProjectModalVisible(false);
                    setEditingProject(null);
                    form.resetFields();
                }}
                footer={null}
                width={1100}
                destroyOnClose
            >
                <ProjectForm />
            </Modal>

            {/* Status Update Modal */}
            <Modal
                title={
                    <Space>
                        <PlayCircleOutlined />
                        Update Project Status
                    </Space>
                }
                open={statusModalVisible}
                onCancel={() => {
                    setStatusModalVisible(false);
                    setSelectedProject(null);
                    statusForm.resetFields();
                }}
                footer={null}
                width={600}
            >
                {selectedProject && (
                    <div>
                        <Alert
                            message="Project Status Workflow"
                            description={
                                <div>
                                    <Text>Planning → Approved → In Progress → Completed</Text>
                                    <br />
                                    <Text type="secondary" style={{ fontSize: '12px' }}>
                                        Select the appropriate status based on project phase
                                    </Text>
                                </div>
                            }
                            type="info"
                            showIcon
                            style={{ marginBottom: '16px' }}
                        />

                        <Card size="small" style={{ marginBottom: '16px', backgroundColor: '#fafafa' }}>
                            <Text strong>Project: </Text>
                            <Text>{selectedProject.name}</Text>
                            <br />
                            <Text strong>Current Status: </Text>
                            <Tag color={getStatusColor(selectedProject.status)}>
                                {selectedProject.status}
                            </Tag>
                        </Card>

                        <Form
                            form={statusForm}
                            layout="vertical"
                            onFinish={handleUpdateStatus}
                        >
                            <Form.Item
                                name="status"
                                label="New Status"
                                rules={[{ required: true, message: 'Please select a status' }]}
                            >
                                <Select
                                    size="large"
                                    placeholder="Select new status"
                                >
                                    <Option value="Planning">
                                        <Space>
                                            <EditOutlined style={{ color: '#1890ff' }} />
                                            Planning - Initial planning phase
                                        </Space>
                                    </Option>
                                    <Option value="Approved">
                                        <Space>
                                            <CheckCircleOutlined style={{ color: '#52c41a' }} />
                                            Approved - Ready to start
                                        </Space>
                                    </Option>
                                    <Option value="In Progress">
                                        <Space>
                                            <PlayCircleOutlined style={{ color: '#faad14' }} />
                                            In Progress - Active work ongoing
                                        </Space>
                                    </Option>
                                    <Option value="On Hold">
                                        <Space>
                                            <PauseCircleOutlined style={{ color: '#722ed1' }} />
                                            On Hold - Temporarily paused
                                        </Space>
                                    </Option>
                                    <Option value="Completed">
                                        <Space>
                                            <CheckCircleOutlined style={{ color: '#52c41a' }} />
                                            Completed - Project finished
                                        </Space>
                                    </Option>
                                    <Option value="Cancelled">
                                        <Space>
                                            <StopOutlined style={{ color: '#f5222d' }} />
                                            Cancelled - Project cancelled
                                        </Space>
                                    </Option>
                                </Select>
                            </Form.Item>

                            <Form.Item>
                                <Space>
                                    <Button onClick={() => {
                                        setStatusModalVisible(false);
                                        setSelectedProject(null);
                                        statusForm.resetFields();
                                    }}>
                                        Cancel
                                    </Button>
                                    <Button
                                        type="primary"
                                        htmlType="submit"
                                        loading={loading}
                                        icon={<PlayCircleOutlined />}
                                    >
                                        Update Status
                                    </Button>
                                </Space>
                            </Form.Item>
                        </Form>
                    </div>
                )}
            </Modal>

            {/* Project Details Modal */}
            <Modal
                title={
                    <Space>
                        <ProjectOutlined />
                        Project Details - {selectedProject?.name}
                    </Space>
                }
                open={detailsModalVisible}
                onCancel={() => {
                    setDetailsModalVisible(false);
                    setSelectedProject(null);
                }}
                footer={
                    <Space>
                        <Button onClick={() => setDetailsModalVisible(false)}>
                            Close
                        </Button>
                        <Button 
                            type="primary" 
                            onClick={() => {
                                setDetailsModalVisible(false);
                                openProjectModal(selectedProject);
                            }}
                        >
                            Edit Project
                        </Button>
                    </Space>
                }
                width={1200}
            >
                {selectedProject ? (
                    <div>
                        <Descriptions bordered column={2} size="small" style={{ marginBottom: '20px' }}>
                            <Descriptions.Item label="Project Name" span={2}>
                                <Text strong>{selectedProject.name}</Text>
                            </Descriptions.Item>
                            <Descriptions.Item label="Type">
                                <Tag color="blue">{selectedProject.projectType}</Tag>
                            </Descriptions.Item>
                            <Descriptions.Item label="Priority">
                                <Tag color={getPriorityColor(selectedProject.priority)}>
                                    {selectedProject.priority}
                                </Tag>
                            </Descriptions.Item>
                            <Descriptions.Item label="Status">
                                <Tag color={getStatusColor(selectedProject.status)}>
                                    {selectedProject.status}
                                </Tag>
                            </Descriptions.Item>
                            <Descriptions.Item label="Department">
                                <Tag color="green">{selectedProject.department}</Tag>
                            </Descriptions.Item>
                            <Descriptions.Item label="Project Manager">
                                <Avatar size="small" icon={<UserOutlined />} style={{ marginRight: 8 }} />
                                {selectedProject.projectManager?.fullName || 'N/A'}
                            </Descriptions.Item>
                            <Descriptions.Item label="Overall Progress">
                                <Progress percent={selectedProject.progress || 0} size="small" />
                            </Descriptions.Item>
                        </Descriptions>

                        <Card size="small" title="Project Description" style={{ marginBottom: '20px' }}>
                            <Paragraph>{selectedProject.description}</Paragraph>
                        </Card>

                        <Card size="small" title="Milestones & Assigned Supervisors" style={{ marginBottom: '20px' }}>
                            {selectedProject.milestones && selectedProject.milestones.length > 0 ? (
                                <Table
                                    columns={[
                                        {
                                            title: 'Milestone',
                                            dataIndex: 'title',
                                            key: 'title',
                                            render: (text, record) => (
                                                <div>
                                                    <Text strong>{text}</Text>
                                                    <br />
                                                    <Text type="secondary" style={{ fontSize: '12px' }}>
                                                        {record.description}
                                                    </Text>
                                                </div>
                                            )
                                        },
                                        {
                                            title: 'Weight',
                                            dataIndex: 'weight',
                                            key: 'weight',
                                            width: 80,
                                            render: (weight) => (
                                                <Tag color="blue">{weight}%</Tag>
                                            )
                                        },
                                        {
                                            title: 'Assigned Supervisor',
                                            dataIndex: 'assignedSupervisor',
                                            key: 'assignedSupervisor',
                                            render: (supervisor) => supervisor ? (
                                                <div>
                                                    <Avatar size="small" icon={<UserOutlined />} style={{ marginRight: 8 }} />
                                                    <Text>{supervisor.fullName || supervisor.name}</Text>
                                                    <br />
                                                    <Text type="secondary" style={{ fontSize: '12px' }}>
                                                        {supervisor.department}
                                                    </Text>
                                                </div>
                                            ) : 'Not Assigned'
                                        },
                                        {
                                            title: 'Progress',
                                            dataIndex: 'progress',
                                            key: 'progress',
                                            width: 150,
                                            render: (progress) => (
                                                <Progress percent={progress || 0} size="small" />
                                            )
                                        },
                                        {
                                            title: 'Status',
                                            dataIndex: 'status',
                                            key: 'status',
                                            width: 120,
                                            render: (status) => (
                                                <Tag color={
                                                    status === 'Completed' ? 'green' :
                                                    status === 'In Progress' ? 'blue' :
                                                    'default'
                                                }>
                                                    {status}
                                                </Tag>
                                            )
                                        },
                                        {
                                            title: 'Due Date',
                                            dataIndex: 'dueDate',
                                            key: 'dueDate',
                                            width: 120,
                                            render: (date) => date ? moment(date).format('MMM DD, YYYY') : 'N/A'
                                        }
                                    ]}
                                    dataSource={selectedProject.milestones}
                                    rowKey="_id"
                                    pagination={false}
                                    size="small"
                                />
                            ) : (
                                <Alert message="No milestones defined for this project" type="info" showIcon />
                            )}
                            {activeTab === 'my-milestones' && (
                                <Card title="Milestones I Supervise" loading={loadingMilestones}>
                                    <Row gutter={[16, 16]}>
                                        {myMilestones.map((item) => (
                                            <Col span={24} key={item.milestone._id}>
                                                <Card 
                                                    size="small"
                                                    style={{ 
                                                        borderLeft: `4px solid ${
                                                            item.milestone.status === 'Completed' ? '#52c41a' :
                                                            item.milestone.status === 'In Progress' ? '#1890ff' : '#faad14'
                                                        }`
                                                    }}
                                                    extra={
                                                        <Button
                                                            type="primary"
                                                            size="small"
                                                            onClick={() => {
                                                                setSelectedMilestone(item);
                                                                fetchMilestoneTasks(
                                                                    item.project._id,
                                                                    item.milestone._id
                                                                );
                                                            }}
                                                        >
                                                            View Tasks
                                                        </Button>
                                                    }
                                                >
                                                    <Row gutter={16}>
                                                        <Col span={12}>
                                                            <Space direction="vertical" size="small" style={{ width: '100%' }}>
                                                                <div>
                                                                    <Text type="secondary">Project:</Text>
                                                                    <br />
                                                                    <Text strong>{item.project.name}</Text>
                                                                    <Tag color="blue" style={{ marginLeft: 8 }}>
                                                                        {item.project.code}
                                                                    </Tag>
                                                                </div>
                                                                <div>
                                                                    <Text type="secondary">Milestone:</Text>
                                                                    <br />
                                                                    <Text strong style={{ fontSize: '16px' }}>
                                                                        {item.milestone.title}
                                                                    </Text>
                                                                </div>
                                                            </Space>
                                                        </Col>
                                                        <Col span={6}>
                                                            <Statistic
                                                                title="Weight"
                                                                value={item.milestone.weight}
                                                                suffix="%"
                                                                valueStyle={{ fontSize: '20px' }}
                                                            />
                                                            <Statistic
                                                                title="Progress"
                                                                value={item.milestone.progress}
                                                                suffix="%"
                                                                valueStyle={{ 
                                                                    fontSize: '20px',
                                                                    color: item.milestone.progress >= 100 ? '#52c41a' : '#1890ff'
                                                                }}
                                                            />
                                                        </Col>
                                                        <Col span={6}>
                                                            <Space direction="vertical" size="small">
                                                                <div>
                                                                    <Text type="secondary">Status:</Text>
                                                                    <br />
                                                                    <Tag color={
                                                                        item.milestone.status === 'Completed' ? 'green' :
                                                                        item.milestone.status === 'In Progress' ? 'blue' : 'default'
                                                                    }>
                                                                        {item.milestone.status}
                                                                    </Tag>
                                                                </div>
                                                                {item.milestone.dueDate && (
                                                                    <div>
                                                                        <Text type="secondary">Due Date:</Text>
                                                                        <br />
                                                                        <Text>{moment(item.milestone.dueDate).format('MMM DD, YYYY')}</Text>
                                                                    </div>
                                                                )}
                                                            </Space>
                                                        </Col>
                                                    </Row>
                                                </Card>
                                            </Col>
                                        ))}
                                        {myMilestones.length === 0 && (
                                            <Col span={24}>
                                                <Alert
                                                    message="No Milestones Assigned"
                                                    description="You don't have any milestones assigned to you as a supervisor."
                                                    type="info"
                                                    showIcon
                                                />
                                            </Col>
                                        )}
                                    </Row>
                                </Card>
                            )}
                        </Card>



                        <Row gutter={16}>
                            <Col span={12}>
                                <Card size="small" title="Timeline Information">
                                    <Descriptions column={1} size="small">
                                        <Descriptions.Item label="Start Date">
                                            {selectedProject.timeline?.startDate ? 
                                                moment(selectedProject.timeline.startDate).format('MMM DD, YYYY') : 'N/A'}
                                        </Descriptions.Item>
                                        <Descriptions.Item label="End Date">
                                            {selectedProject.timeline?.endDate ? 
                                                moment(selectedProject.timeline.endDate).format('MMM DD, YYYY') : 'N/A'}
                                        </Descriptions.Item>
                                        <Descriptions.Item label="Days Remaining">
                                            <Text style={{
                                                color: selectedProject.timeline?.endDate && moment(selectedProject.timeline.endDate).diff(moment(), 'days') < 0 ? '#f5222d' : '#52c41a'
                                            }}>
                                                {selectedProject.timeline?.endDate ? 
                                                    moment(selectedProject.timeline.endDate).diff(moment(), 'days') : 'N/A'} days
                                            </Text>
                                        </Descriptions.Item>
                                    </Descriptions>
                                </Card>
                            </Col>
                            <Col span={12}>
                                <Card size="small" title="Budget Information">
                                    {selectedProject.budgetCode ? (
                                        <Descriptions column={1} size="small">
                                            <Descriptions.Item label="Budget Code">
                                                <Tag color="blue">
                                                    {selectedProject.budgetCode.code}
                                                </Tag>
                                            </Descriptions.Item>
                                            <Descriptions.Item label="Budget Name">
                                                {selectedProject.budgetCode.name}
                                            </Descriptions.Item>
                                            <Descriptions.Item label="Available Funds">
                                                XAF {(selectedProject.budgetCode.available || 0).toLocaleString()}
                                            </Descriptions.Item>
                                        </Descriptions>
                                    ) : (
                                        <Alert message="No budget code assigned to this project" type="warning" showIcon />
                                    )}
                                </Card>
                            </Col>
                        </Row>
                    </div>
                ) : (
                    <Spin size="large" />
                )}
            </Modal>

            {/* Task Approval Modal - Level 3 */}
            <Modal
                title={
                    <Space>
                        <CheckCircleOutlined />
                        Level 3 Final Approval - Project Creator
                    </Space>
                }
                open={taskApprovalModalVisible}
                onCancel={() => {
                    setTaskApprovalModalVisible(false);
                    setSelectedTask(null);
                    taskApprovalForm.resetFields();
                }}
                footer={null}
                width={800}
            >
                {selectedTask && (
                    <div>
                        <Alert
                            message="Final Approval Required"
                            description="As the project creator, you're reviewing this task completion for final approval."
                            type="info"
                            showIcon
                            style={{ marginBottom: 16 }}
                        />

                        <Card size="small" style={{ marginBottom: 16, backgroundColor: '#fafafa' }}>
                            <Descriptions column={1} size="small">
                                <Descriptions.Item label="Task">
                                    <Text strong>{selectedTask.title}</Text>
                                </Descriptions.Item>
                                <Descriptions.Item label="Employee">
                                    {selectedTask.assignee.user.fullName}
                                </Descriptions.Item>
                                <Descriptions.Item label="L1 Grade">
                                    <Tag color="blue">
                                        {selectedTask.assignee.completionGrade?.score || 'N/A'}/5.0
                                    </Tag>
                                </Descriptions.Item>
                                <Descriptions.Item label="Approval Chain">
                                    <Steps size="small" current={2}>
                                        <Steps.Step 
                                            title="L1 Grading" 
                                            status="finish"
                                            description="Supervisor graded"
                                        />
                                        <Steps.Step 
                                            title="L2 Review" 
                                            status="finish"
                                            description="Supervisor's supervisor approved"
                                        />
                                        <Steps.Step 
                                            title="L3 Final" 
                                            status="process"
                                            description="Your approval needed"
                                        />
                                    </Steps>
                                </Descriptions.Item>
                            </Descriptions>
                        </Card>

                        {selectedTask.assignee.completionDocuments?.length > 0 && (
                            <Card size="small" title="Submitted Documents" style={{ marginBottom: 16 }}>
                                <List
                                    size="small"
                                    dataSource={selectedTask.assignee.completionDocuments}
                                    renderItem={doc => (
                                        <List.Item>
                                            <Text>{doc.name}</Text>
                                            <Button 
                                                type="link" 
                                                size="small"
                                                onClick={() => window.open(doc.url, '_blank')}
                                            >
                                                View
                                            </Button>
                                        </List.Item>
                                    )}
                                />
                            </Card>
                        )}

                        <Form
                            form={taskApprovalForm}
                            layout="vertical"
                            onFinish={handleTaskApproval}
                        >
                            <Form.Item
                                name="decision"
                                label="Your Decision"
                                rules={[{ required: true, message: 'Please make a decision' }]}
                            >
                                <Select size="large" placeholder="Approve or Reject">
                                    <Option value="approve">
                                        <Space>
                                            <CheckCircleOutlined style={{ color: '#52c41a' }} />
                                            Approve - Task meets requirements
                                        </Space>
                                    </Option>
                                    <Option value="reject">
                                        <Space>
                                            <CloseCircleOutlined style={{ color: '#f5222d' }} />
                                            Reject - Needs revision
                                        </Space>
                                    </Option>
                                </Select>
                            </Form.Item>

                            <Form.Item
                                name="comments"
                                label="Comments"
                                rules={[{ required: true, message: 'Please provide comments' }]}
                            >
                                <TextArea
                                    rows={4}
                                    placeholder="Provide feedback for the employee..."
                                />
                            </Form.Item>

                            <Form.Item>
                                <Space>
                                    <Button onClick={() => {
                                        setTaskApprovalModalVisible(false);
                                        setSelectedTask(null);
                                        taskApprovalForm.resetFields();
                                    }}>
                                        Cancel
                                    </Button>
                                    <Button
                                        type="primary"
                                        htmlType="submit"
                                        loading={loading}
                                        icon={<CheckCircleOutlined />}
                                    >
                                        Submit Decision
                                    </Button>
                                </Space>
                            </Form.Item>
                        </Form>
                    </div>
                )}
            </Modal>

            {/* Milestone Tasks Modal */}
            <Modal
                title={
                    selectedMilestone ? (
                        <Space>
                            <FlagOutlined />
                            {selectedMilestone.milestone.title} - Tasks
                        </Space>
                    ) : 'Tasks'
                }
                open={!!selectedMilestone && milestoneTasks.length > 0}
                onCancel={() => {
                    setSelectedMilestone(null);
                    setMilestoneTasks([]);
                }}
                footer={null}
                width={1200}
            >
                <Table
                    loading={loadingMilestones}
                    dataSource={milestoneTasks}
                    rowKey="_id"
                    size="small"
                    columns={[
                        {
                            title: 'Task',
                            dataIndex: 'title',
                            key: 'title',
                            render: (text, record) => (
                                <div>
                                    <Text strong>{text}</Text>
                                    <br />
                                    <Tag size="small" color={getPriorityColor(record.priority)}>
                                        {record.priority}
                                    </Tag>
                                </div>
                            )
                        },
                        {
                            title: 'Assignee',
                            key: 'assignee',
                            render: (_, record) => (
                                record.assignedTo?.map(a => (
                                    <div key={a._id}>
                                        <Avatar size="small" icon={<UserOutlined />} style={{ marginRight: 4 }} />
                                        <Text>{a.user?.fullName || 'N/A'}</Text>
                                    </div>
                                ))
                            )
                        },
                        {
                            title: 'Status',
                            dataIndex: 'status',
                            key: 'status',
                            render: (status) => (
                                <Tag color={getStatusColor(status)}>
                                    {status}
                                </Tag>
                            )
                        },
                        {
                            title: 'Progress',
                            dataIndex: 'progress',
                            key: 'progress',
                            render: (progress) => (
                                <Progress percent={progress || 0} size="small" />
                            )
                        },
                        {
                            title: 'Actions',
                            key: 'actions',
                            render: (_, record) => {
                                const needsL3Approval = record.status === 'Pending L3 Final Approval';
                                const assignee = record.assignedTo?.[0];
                                
                                if (needsL3Approval && assignee) {
                                    return (
                                        <Button
                                            type="primary"
                                            size="small"
                                            icon={<CheckCircleOutlined />}
                                            onClick={() => {
                                                setSelectedTask({
                                                    ...record,
                                                    assignee: assignee
                                                });
                                                setTaskApprovalModalVisible(true);
                                            }}
                                        >
                                            Review (L3)
                                        </Button>
                                    );
                                }
                                return <Text type="secondary">No action needed</Text>;
                            }
                        }
                    ]}
                />
            </Modal>

            {/* Analytics Modal */}
            <AnalyticsModal />

            {/* Risk Modal */}
            <RiskModal />

            {/* Issue Modal */}
            <IssueModal />

            {/* Change Request Modal */}
            <ChangeRequestModal />

            {/* Meeting Modal */}
            <MeetingModal />
        </div>
    );
};

export default EnhancedProjectManagement;













// import React, { useState, useEffect } from 'react';
// import {
//     Card,
//     Table,
//     Button,
//     Modal,
//     Form,
//     Typography,
//     Tag,
//     Space,
//     Input,
//     Select,
//     InputNumber,
//     Descriptions,
//     Alert,
//     Spin,
//     message,
//     Badge,
//     Row,
//     Col,
//     Statistic,
//     Divider,
//     Tooltip,
//     Tabs,
//     DatePicker,
//     Progress,
//     Avatar,
//     List,
//     Steps, 
//     Switch
// } from 'antd';
// import {
//     ProjectOutlined,
//     PlusOutlined,
//     EditOutlined,
//     DeleteOutlined,
//     EyeOutlined,
//     CheckCircleOutlined,
//     UserOutlined,
//     ReloadOutlined,
//     WarningOutlined,
//     MinusCircleOutlined,
//     PlayCircleOutlined,
//     PauseCircleOutlined,
//     StopOutlined,
//     BarChartOutlined,
//     FlagOutlined,
//     TrophyOutlined,
//     ClockCircleOutlined,
//     TeamOutlined,
//     ExclamationCircleOutlined,
//     SwapOutlined,
//     CalendarOutlined,
//     DashboardOutlined
// } from '@ant-design/icons';
// import moment from 'moment';
// import { projectAPI } from '../../services/projectAPI';
// import { getAllEmployees } from '../../utils/departmentStructure';
// import {
//     LineChart,
//     Line,
//     BarChart,
//     Bar,
//     PieChart,
//     Pie,
//     Cell,
//     XAxis,
//     YAxis,
//     CartesianGrid,
//     Tooltip as RechartsTooltip,
//     Legend,
//     ResponsiveContainer,
//     RadarChart,
//     PolarGrid,
//     PolarAngleAxis,
//     PolarRadiusAxis,
//     Radar
// } from 'recharts';

// const { Title, Text, Paragraph } = Typography;
// const { TextArea } = Input;
// const { Option } = Select;
// const { TabPane } = Tabs;
// const { RangePicker } = DatePicker;

// const EnhancedProjectManagement = () => {
//     const [projects, setProjects] = useState([]);
//     const [loading, setLoading] = useState(false);
//     const [projectModalVisible, setProjectModalVisible] = useState(false);
//     const [detailsModalVisible, setDetailsModalVisible] = useState(false);
//     const [statusModalVisible, setStatusModalVisible] = useState(false);
//     const [analyticsModalVisible, setAnalyticsModalVisible] = useState(false);
//     const [riskModalVisible, setRiskModalVisible] = useState(false);
//     const [issueModalVisible, setIssueModalVisible] = useState(false);
//     const [changeRequestModalVisible, setChangeRequestModalVisible] = useState(false);
//     const [meetingModalVisible, setMeetingModalVisible] = useState(false);
//     const [selectedProject, setSelectedProject] = useState(null);
//     const [activeTab, setActiveTab] = useState('active');
//     const [editingProject, setEditingProject] = useState(null);
//     const [projectAnalytics, setProjectAnalytics] = useState(null);
//     const [loadingAnalytics, setLoadingAnalytics] = useState(false);
//     const [phases, setPhases] = useState([]);
//     const [customFields, setCustomFields] = useState([]);
//     const [resources, setResources] = useState({
//         budget: { allocated: 0, currency: 'XAF' },
//         manpower: [],
//         equipment: []
//     });
//     const [currentStep, setCurrentStep] = useState(0);
//     const [budgetEnabled, setBudgetEnabled] = useState(false);
//     const [resourcesEnabled, setResourcesEnabled] = useState(false);
//     const [phasesEnabled, setPhasesEnabled] = useState(false);


//     const [stats, setStats] = useState({
//         total: 0,
//         active: 0,
//         completed: 0,
//         overdue: 0,
//         totalBudget: 0,
//         budgetUtilization: 0
//     });
//     const [form] = Form.useForm();
//     const [statusForm] = Form.useForm();
//     const [riskForm] = Form.useForm();
//     const [issueForm] = Form.useForm();
//     const [changeRequestForm] = Form.useForm();
//     const [meetingForm] = Form.useForm();
//     const [projectManagers, setProjectManagers] = useState([]);
//     const [supervisors, setSupervisors] = useState([]);
//     const [projectManagersLoading, setProjectManagersLoading] = useState(false);
//     const [budgetCodes, setBudgetCodes] = useState([]);
//     const [loadingBudgetCodes, setLoadingBudgetCodes] = useState(false);

//     useEffect(() => {
//         fetchProjects();
//         fetchStats();
//         fetchProjectManagers();
//         fetchBudgetCodes();
//     }, []);

//     const fetchProjects = async (filters = {}) => {
//         try {
//             setLoading(true);
//             const result = await projectAPI.getProjects(filters);

//             if (result.success) {
//                 setProjects(result.data || []);
//             } else {
//                 message.error(result.message || 'Failed to fetch projects');
//             }
//         } catch (error) {
//             console.error('Error fetching projects:', error);
//             message.error('Failed to fetch projects');
//         } finally {
//             setLoading(false);
//         }
//     };

//     const fetchStats = async () => {
//         try {
//             const result = await projectAPI.getProjectStats();
//             if (result.success) {
//                 const data = result.data;
//                 setStats({
//                     total: data.summary?.total || 0,
//                     active: data.summary?.active || 0,
//                     completed: data.summary?.completed || 0,
//                     overdue: data.summary?.overdue || 0,
//                     totalBudget: data.budget?.totalAllocated || 0,
//                     budgetUtilization: data.budget?.utilization || 0
//                 });
//             }
//         } catch (error) {
//             console.error('Error fetching stats:', error);
//             message.error('Failed to fetch project statistics');
//         }
//     };

//     const fetchProjectManagers = async () => {
//         try {
//             setProjectManagersLoading(true);

//             try {
//                 const response = await fetch('http://localhost:5001/api/auth/active-users', {
//                     headers: {
//                         'Authorization': `Bearer ${localStorage.getItem('token')}`,
//                         'Content-Type': 'application/json'
//                     }
//                 });

//                 if (response.ok) {
//                     const result = await response.json();
//                     if (result.success && result.data && result.data.length > 0) {
//                         setProjectManagers(result.data);
                        
//                         const supervisorList = result.data.filter(user => 
//                             ['supervisor', 'admin', 'supply_chain', 'manager', 'hr', 'it', 'hse', 'technical'].includes(user.role)
//                         );
//                         setSupervisors(supervisorList);
//                         return;
//                     }
//                 }
//             } catch (error) {
//                 console.log('Database users not available, using fallback');
//             }

//             const allEmployees = getAllEmployees();
//             const formattedEmployees = allEmployees
//                 .filter(employee => employee.name && employee.email)
//                 .map((employee, index) => ({
//                     _id: `emp_${index}_${employee.email}`,
//                     id: employee.email,
//                     fullName: employee.name,
//                     name: employee.name,
//                     email: employee.email,
//                     position: employee.position,
//                     department: employee.department,
//                     role: employee.role,
//                     isActive: true
//                 }))
//                 .sort((a, b) => a.fullName.localeCompare(b.fullName));

//             setProjectManagers(formattedEmployees);
            
//             const supervisorList = formattedEmployees.filter(emp => 
//                 ['supervisor', 'admin', 'supply_chain', 'manager', 'hr', 'it', 'hse', 'technical'].includes(emp.role)
//             );
//             setSupervisors(supervisorList);

//         } catch (error) {
//             console.error('Error loading users:', error);
//             setProjectManagers([]);
//             setSupervisors([]);
//         } finally {
//             setProjectManagersLoading(false);
//         }
//     };

//     const fetchBudgetCodes = async () => {
//         try {
//             setLoadingBudgetCodes(true);
//             const result = await projectAPI.getAvailableBudgetCodes();

//             if (result.success) {
//                 setBudgetCodes(result.data || []);
//             }
//         } catch (error) {
//             console.error('Error fetching budget codes:', error);
//             setBudgetCodes([]);
//         } finally {
//             setLoadingBudgetCodes(false);
//         }
//     };

//     const fetchProjectAnalytics = async (projectId) => {
//         try {
//             setLoadingAnalytics(true);
//             const result = await projectAPI.getProjectAnalytics(projectId);
//             if (result.success) {
//                 setProjectAnalytics(result.data);
//             }
//         } catch (error) {
//             console.error('Error fetching analytics:', error);
//             message.error('Failed to fetch project analytics');
//         } finally {
//             setLoadingAnalytics(false);
//         }
//     };

//     const openAnalyticsModal = async (project) => {
//         setSelectedProject(project);
//         await fetchProjectAnalytics(project._id);
//         setAnalyticsModalVisible(true);
//     };


//     // const handleCreateProject = async (values) => {
//     //     try {
//     //         setLoading(true);

//     //         if (!values.name || !values.description || !values.projectType || !values.priority || 
//     //             !values.department || !values.projectManager || !values.timeline) {
//     //             message.error('Please fill in all required fields');
//     //             return;
//     //         }

//     //         if (!values.timeline || values.timeline.length !== 2) {
//     //             message.error('Please select both start and end dates');
//     //             return;
//     //         }

//     //         if (!values.milestones || values.milestones.length === 0) {
//     //             message.error('At least one milestone is required');
//     //             return;
//     //         }

//     //         const totalWeight = values.milestones.reduce((sum, m) => sum + (m.weight || 0), 0);
//     //         if (totalWeight !== 100) {
//     //             message.error(`Milestone weights must sum to 100%. Current total: ${totalWeight}%`);
//     //             return;
//     //         }

//     //         for (const milestone of values.milestones) {
//     //             if (!milestone.assignedSupervisor) {
//     //                 message.error(`Milestone "${milestone.title}" must have an assigned supervisor`);
//     //                 return;
//     //             }
//     //         }

//     //         const projectData = {
//     //             name: values.name,
//     //             description: values.description,
//     //             projectType: values.projectType,
//     //             priority: values.priority,
//     //             department: values.department,
//     //             projectManager: values.projectManager,
//     //             timeline: {
//     //                 startDate: values.timeline[0].format('YYYY-MM-DD'),
//     //                 endDate: values.timeline[1].format('YYYY-MM-DD')
//     //             },
//     //             budgetCodeId: values.budgetCodeId || null,
//     //             milestones: values.milestones.map(milestone => ({
//     //                 title: milestone.title,
//     //                 description: milestone.description || '',
//     //                 dueDate: milestone.dueDate ? milestone.dueDate.format('YYYY-MM-DD') : null,
//     //                 weight: milestone.weight || 0,
//     //                 assignedSupervisor: milestone.assignedSupervisor
//     //             }))
//     //         };

//     //         const result = await projectAPI.createProject(projectData);

//     //         if (result.success) {
//     //             message.success(`Project "${values.name}" created successfully!`);
//     //             setProjectModalVisible(false);
//     //             form.resetFields();

//     //             await Promise.all([
//     //                 fetchProjects(),
//     //                 fetchStats(),
//     //                 fetchBudgetCodes()
//     //             ]);
//     //         } else {
//     //             message.error(result.message || 'Failed to create project');
//     //         }
//     //     } catch (error) {
//     //         console.error('Error creating project:', error);
//     //         message.error('Failed to create project');
//     //     } finally {
//     //         setLoading(false);
//     //     }
//     // };

//     const handleCreateProject = async (values) => {
//         try {
//             setLoading(true);

//             console.log('Form values:', values); // Debug log

//             // Validate basic required fields
//             if (!values.name || !values.description || !values.projectType || !values.priority || 
//                 !values.department || !values.projectManager || !values.timeline) {
//                 message.error('Please fill in all required fields in Basic Info step');
//                 setCurrentStep(0); // Go back to first step
//                 return;
//             }

//             if (!values.timeline || values.timeline.length !== 2) {
//                 message.error('Please select both start and end dates');
//                 setCurrentStep(1); // Go to timeline step
//                 return;
//             }

//             if (!values.milestones || values.milestones.length === 0) {
//                 message.error('At least one milestone is required');
//                 setCurrentStep(2); // Go to milestones step
//                 return;
//             }

//             const totalWeight = values.milestones.reduce((sum, m) => sum + (m.weight || 0), 0);
//             if (totalWeight !== 100) {
//                 message.error(`Milestone weights must sum to 100%. Current total: ${totalWeight}%`);
//                 setCurrentStep(2); // Go to milestones step
//                 return;
//             }

//             for (const milestone of values.milestones) {
//                 if (!milestone.assignedSupervisor) {
//                     message.error(`Milestone "${milestone.title}" must have an assigned supervisor`);
//                     setCurrentStep(2); // Go to milestones step
//                     return;
//                 }
//             }

//             const projectData = {
//                 name: values.name,
//                 description: values.description,
//                 projectType: values.projectType,
//                 priority: values.priority,
//                 department: values.department,
//                 projectManager: values.projectManager,
//                 timeline: {
//                     startDate: values.timeline[0].format('YYYY-MM-DD'),
//                     endDate: values.timeline[1].format('YYYY-MM-DD')
//                 },
//                 budgetCodeId: values.budgetCodeId || null,
//                 milestones: values.milestones.map(milestone => ({
//                     title: milestone.title,
//                     description: milestone.description || '',
//                     dueDate: milestone.dueDate ? milestone.dueDate.format('YYYY-MM-DD') : null,
//                     weight: milestone.weight || 0,
//                     assignedSupervisor: milestone.assignedSupervisor,
//                     completionCriteria: milestone.completionCriteria || []
//                 })),
//                 // Optional fields
//                 tags: values.tags || [],
//                 objectives: values.objectives || [],
//                 successCriteria: values.successCriteria || [],
//                 phases: values.phases?.map(phase => ({
//                     name: phase.name,
//                     description: phase.description || '',
//                     startDate: phase.duration ? phase.duration[0].format('YYYY-MM-DD') : null,
//                     endDate: phase.duration ? phase.duration[1].format('YYYY-MM-DD') : null,
//                     deliverables: phase.deliverables || []
//                 })) || [],
//                 teamMembers: values.teamMembers?.map(tm => ({
//                     user: tm.user,
//                     role: tm.role
//                 })) || [],
//                 resources: {
//                     budget: values.customBudget || {},
//                     manpower: values.manpowerRequirements || [],
//                     equipment: values.equipmentRequirements || []
//                 },
//                 dependencies: values.dependencies || [],
//                 stakeholders: values.stakeholders || [],
//                 qualityMetrics: values.qualityMetrics || []
//             };

//             console.log('Sending project data:', projectData); // Debug log

//             const result = await projectAPI.createProject(projectData);

//             if (result.success) {
//                 message.success(`Project "${values.name}" created successfully!`);
//                 setProjectModalVisible(false);
//                 form.resetFields();
//                 setCurrentStep(0);
//                 setBudgetEnabled(false);
//                 setResourcesEnabled(false);
//                 setPhasesEnabled(false);

//                 await Promise.all([
//                     fetchProjects(),
//                     fetchStats(),
//                     fetchBudgetCodes()
//                 ]);
//             } else {
//                 message.error(result.message || 'Failed to create project');
//             }
//         } catch (error) {
//             console.error('Error creating project:', error);
//             message.error(error.response?.data?.message || 'Failed to create project');
//         } finally {
//             setLoading(false);
//         }
//     };

//     const handleUpdateProject = async (values) => {
//         try {
//             setLoading(true);

//             if (!values.name || !values.description || !values.projectType || !values.priority || 
//                 !values.department || !values.projectManager || !values.timeline) {
//                 message.error('Please fill in all required fields');
//                 return;
//             }

//             if (!values.milestones || values.milestones.length === 0) {
//                 message.error('At least one milestone is required');
//                 return;
//             }

//             const totalWeight = values.milestones.reduce((sum, m) => sum + (m.weight || 0), 0);
//             if (totalWeight !== 100) {
//                 message.error(`Milestone weights must sum to 100%. Current total: ${totalWeight}%`);
//                 return;
//             }

//             const projectData = {
//                 name: values.name,
//                 description: values.description,
//                 projectType: values.projectType,
//                 priority: values.priority,
//                 department: values.department,
//                 projectManager: values.projectManager,
//                 timeline: {
//                     startDate: values.timeline[0].format('YYYY-MM-DD'),
//                     endDate: values.timeline[1].format('YYYY-MM-DD')
//                 },
//                 budgetCodeId: values.budgetCodeId || null,
//                 milestones: values.milestones.map(milestone => ({
//                     ...milestone,
//                     dueDate: milestone.dueDate ? milestone.dueDate.format('YYYY-MM-DD') : null
//                 }))
//             };

//             const result = await projectAPI.updateProject(editingProject._id, projectData);

//             if (result.success) {
//                 message.success('Project updated successfully');
//                 setProjectModalVisible(false);
//                 form.resetFields();
//                 setEditingProject(null);
//                 fetchProjects();
//                 fetchBudgetCodes();
//             } else {
//                 message.error(result.message || 'Failed to update project');
//             }
//         } catch (error) {
//             console.error('Error updating project:', error);
//             message.error('Failed to update project');
//         } finally {
//             setLoading(false);
//         }
//     };

//     const openStatusModal = (project) => {
//         setSelectedProject(project);
//         statusForm.setFieldsValue({
//             status: project.status
//         });
//         setStatusModalVisible(true);
//     };

//     const handleUpdateStatus = async (values) => {
//         try {
//             setLoading(true);
//             const result = await projectAPI.updateProjectStatus(selectedProject._id, { status: values.status });

//             if (result.success) {
//                 message.success(`Project status updated to ${values.status}`);
//                 setStatusModalVisible(false);
//                 statusForm.resetFields();
//                 setSelectedProject(null);
//                 fetchProjects();
//                 fetchStats();
//             } else {
//                 message.error(result.message || 'Failed to update project status');
//             }
//         } catch (error) {
//             console.error('Error updating status:', error);
//             message.error('Failed to update project status');
//         } finally {
//             setLoading(false);
//         }
//     };

//     const handleAddRisk = async (values) => {
//         try {
//             setLoading(true);
//             const result = await projectAPI.addRisk(selectedProject._id, values);
            
//             if (result.success) {
//                 message.success('Risk added successfully');
//                 setRiskModalVisible(false);
//                 riskForm.resetFields();
//                 await fetchProjectAnalytics(selectedProject._id);
//             }
//         } catch (error) {
//             console.error('Error adding risk:', error);
//             message.error('Failed to add risk');
//         } finally {
//             setLoading(false);
//         }
//     };

//     const handleAddIssue = async (values) => {
//         try {
//             setLoading(true);
//             const result = await projectAPI.addIssue(selectedProject._id, values);
            
//             if (result.success) {
//                 message.success('Issue added successfully');
//                 setIssueModalVisible(false);
//                 issueForm.resetFields();
//                 await fetchProjectAnalytics(selectedProject._id);
//             }
//         } catch (error) {
//             console.error('Error adding issue:', error);
//             message.error('Failed to add issue');
//         } finally {
//             setLoading(false);
//         }
//     };

//     const handleAddChangeRequest = async (values) => {
//         try {
//             setLoading(true);
//             const result = await projectAPI.addChangeRequest(selectedProject._id, values);
            
//             if (result.success) {
//                 message.success('Change request submitted successfully');
//                 setChangeRequestModalVisible(false);
//                 changeRequestForm.resetFields();
//                 await fetchProjectAnalytics(selectedProject._id);
//             }
//         } catch (error) {
//             console.error('Error adding change request:', error);
//             message.error('Failed to submit change request');
//         } finally {
//             setLoading(false);
//         }
//     };

//     const handleLogMeeting = async (values) => {
//         try {
//             setLoading(true);
//             const result = await projectAPI.logMeeting(selectedProject._id, values);
            
//             if (result.success) {
//                 message.success('Meeting logged successfully');
//                 setMeetingModalVisible(false);
//                 meetingForm.resetFields();
//                 await fetchProjectAnalytics(selectedProject._id);
//             }
//         } catch (error) {
//             console.error('Error logging meeting:', error);
//             message.error('Failed to log meeting');
//         } finally {
//             setLoading(false);
//         }
//     };

//     const openProjectModal = (project = null) => {
//         setEditingProject(project);
//         if (project) {
//             form.setFieldsValue({
//                 name: project.name,
//                 description: project.description,
//                 projectType: project.projectType,
//                 priority: project.priority,
//                 department: project.department,
//                 projectManager: project.projectManager?._id,
//                 budgetCodeId: project.budgetCode?._id,
//                 timeline: [
//                     moment(project.timeline?.startDate),
//                     moment(project.timeline?.endDate)
//                 ],
//                 milestones: project.milestones?.map(milestone => ({
//                     title: milestone.title,
//                     description: milestone.description || '',
//                     dueDate: milestone.dueDate ? moment(milestone.dueDate) : null,
//                     weight: milestone.weight || 0,
//                     assignedSupervisor: milestone.assignedSupervisor?._id || milestone.assignedSupervisor
//                 })) || []
//             });
//         } else {
//             form.resetFields();
//         }
//         setProjectModalVisible(true);
//     };

//     const getStatusColor = (status) => {
//         const colors = {
//             'Planning': 'blue',
//             'Approved': 'cyan',
//             'In Progress': 'orange',
//             'On Hold': 'purple',
//             'Completed': 'green',
//             'Cancelled': 'red'
//         };
//         return colors[status] || 'default';
//     };

//     const getPriorityColor = (priority) => {
//         const colors = {
//             'Low': 'green',
//             'Medium': 'blue',
//             'High': 'orange',
//             'Critical': 'red'
//         };
//         return colors[priority] || 'default';
//     };

//     const getFilteredProjects = () => {
//         switch (activeTab) {
//             case 'active':
//                 return projects.filter(p => ['Planning', 'Approved', 'In Progress'].includes(p.status));
//             case 'completed':
//                 return projects.filter(p => p.status === 'Completed');
//             case 'overdue':
//                 return projects.filter(p => {
//                     if (p.status === 'Completed') return false;
//                     return moment(p.timeline?.endDate).isBefore(moment());
//                 });
//             default:
//                 return projects;
//         }
//     };

//     const columns = [
//         {
//             title: 'Project Details',
//             key: 'details',
//             render: (_, record) => (
//                 <div>
//                     <Text strong>{record.name}</Text>
//                     <br />
//                     <Text type="secondary" style={{ fontSize: '12px' }}>
//                         {record.code || `PROJ-${record._id.slice(-6)}`}
//                     </Text>
//                     <br />
//                     <Tag size="small" color="blue">{record.projectType}</Tag>
//                     <Tag size="small" color={getPriorityColor(record.priority)}>
//                         {record.priority}
//                     </Tag>
//                 </div>
//             ),
//             width: 280
//         },
//         {
//             title: 'Project Manager',
//             key: 'manager',
//             render: (_, record) => (
//                 <div>
//                     <Avatar size="small" icon={<UserOutlined />} style={{ marginRight: 8 }} />
//                     <Text strong>{record.projectManager?.fullName || 'N/A'}</Text>
//                     <br />
//                     <Text type="secondary" style={{ fontSize: '12px' }}>
//                         {record.department}
//                     </Text>
//                 </div>
//             ),
//             width: 180
//         },
//         {
//             title: 'Milestones',
//             key: 'milestones',
//             render: (_, record) => {
//                 const totalMilestones = record.milestones?.length || 0;
//                 const completedMilestones = record.milestones?.filter(m => m.status === 'Completed').length || 0;
                
//                 return (
//                     <div>
//                         <Text>
//                             {completedMilestones}/{totalMilestones} Completed
//                         </Text>
//                         <br />
//                         {record.milestones?.slice(0, 2).map((m, idx) => (
//                             <Tag key={idx} size="small" color="blue" style={{ marginTop: 4 }}>
//                                 {m.title} ({m.weight}%)
//                             </Tag>
//                         ))}
//                         {totalMilestones > 2 && (
//                             <Tag size="small" color="default" style={{ marginTop: 4 }}>
//                                 +{totalMilestones - 2} more
//                             </Tag>
//                         )}
//                     </div>
//                 );
//             },
//             width: 200
//         },
//         {
//             title: 'Progress',
//             key: 'progress',
//             render: (_, record) => (
//                 <div>
//                     <Progress 
//                         percent={record.progress || 0} 
//                         size="small"
//                         status={record.progress === 100 ? 'success' : 'active'}
//                     />
//                 </div>
//             ),
//             width: 150
//         },
//         {
//             title: 'Timeline',
//             key: 'timeline',
//             render: (_, record) => {
//                 const timeline = record.timeline || {};
//                 const isOverdue = timeline.endDate && 
//                                  moment(timeline.endDate).isBefore(moment()) && 
//                                  record.status !== 'Completed';
//                 return (
//                     <div>
//                         <Text>
//                             {timeline.startDate ? moment(timeline.startDate).format('MMM DD') : 'N/A'} - {' '}
//                             {timeline.endDate ? moment(timeline.endDate).format('MMM DD, YYYY') : 'N/A'}
//                         </Text>
//                         <br />
//                         {isOverdue && (
//                             <Text type="danger" style={{ fontSize: '11px' }}>
//                                 <WarningOutlined /> Overdue
//                             </Text>
//                         )}
//                     </div>
//                 );
//             },
//             width: 150
//         },
//         {
//             title: 'Status',
//             dataIndex: 'status',
//             key: 'status',
//             render: (status) => (
//                 <Tag color={getStatusColor(status)}>
//                     {status}
//                 </Tag>
//             ),
//             width: 120
//         },
//         {
//             title: 'Actions',
//             key: 'actions',
//             render: (_, record) => (
//                 <Space size="small">
//                     <Tooltip title="View Details">
//                         <Button
//                             size="small"
//                             icon={<EyeOutlined />}
//                             onClick={() => {
//                                 setSelectedProject(record);
//                                 setDetailsModalVisible(true);
//                             }}
//                         />
//                     </Tooltip>
//                     <Tooltip title="Analytics">
//                         <Button
//                             size="small"
//                             type="primary"
//                             icon={<BarChartOutlined />}
//                             onClick={() => openAnalyticsModal(record)}
//                         />
//                     </Tooltip>
//                     <Tooltip title="Edit Project">
//                         <Button
//                             size="small"
//                             icon={<EditOutlined />}
//                             onClick={() => openProjectModal(record)}
//                         />
//                     </Tooltip>
//                     <Tooltip title="Update Status">
//                         <Button
//                             size="small"
//                             type="primary"
//                             icon={<PlayCircleOutlined />}
//                             onClick={() => openStatusModal(record)}
//                         >
//                             Status
//                         </Button>
//                     </Tooltip>
//                 </Space>
//             ),
//             width: 240,
//             fixed: 'right'
//         }
//     ];

//     // const ProjectForm = () => (
//     //     <Form
//     //         form={form}
//     //         layout="vertical"
//     //         onFinish={editingProject ? handleUpdateProject : handleCreateProject}
//     //     >
//     //         <Row gutter={16}>
//     //             <Col span={12}>
//     //                 <Form.Item
//     //                     name="name"
//     //                     label="Project Name"
//     //                     rules={[
//     //                         { required: true, message: 'Please enter project name' },
//     //                         { min: 5, message: 'Project name must be at least 5 characters' }
//     //                     ]}
//     //                 >
//     //                     <Input placeholder="e.g., Office Infrastructure Upgrade" />
//     //                 </Form.Item>
//     //             </Col>
//     //             <Col span={12}>
//     //                 <Form.Item
//     //                     name="projectType"
//     //                     label="Project Type"
//     //                     rules={[{ required: true, message: 'Please select project type' }]}
//     //                 >
//     //                     <Select placeholder="Select project type">
//     //                         <Option value="Site Build">Site Build</Option>
//     //                         <Option value="Colocation">Colocation</Option>
//     //                         <Option value="Power Projects">Power Projects</Option>
//     //                         <Option value="Tower Maintenance">Tower Maintenance</Option>
//     //                         <Option value="Refurbishment (Gen)">Refurbishment (Gen)</Option>
//     //                         <Option value="Managed Service">Managed Service</Option>
//     //                         <Option value="Kiosk">Kiosk</Option>
//     //                         <Option value="IT Implementation">IT Implementation</Option>
//     //                         <Option value="Process Improvement">Process Improvement</Option>
//     //                         <Option value="Product Development">Product Development</Option>
//     //                         <Option value="Marketing Campaign">Marketing Campaign</Option>
//     //                         <Option value="Training Program">Training Program</Option>
//     //                         <Option value="Other">Other</Option>
//     //                     </Select>
//     //                 </Form.Item>
//     //             </Col>
//     //         </Row>

//     //         <Row gutter={16}>
//     //             <Col span={8}>
//     //                 <Form.Item
//     //                     name="priority"
//     //                     label="Priority Level"
//     //                     rules={[{ required: true, message: 'Please select priority' }]}
//     //                 >
//     //                     <Select placeholder="Select priority">
//     //                         <Option value="Low">🟢 Low</Option>
//     //                         <Option value="Medium">🟡 Medium</Option>
//     //                         <Option value="High">🟠 High</Option>
//     //                         <Option value="Critical">🔴 Critical</Option>
//     //                     </Select>
//     //                 </Form.Item>
//     //             </Col>
//     //             <Col span={8}>
//     //                 <Form.Item
//     //                     name="department"
//     //                     label="Department"
//     //                     rules={[{ required: true, message: 'Please select department' }]}
//     //                 >
//     //                     <Select placeholder="Select department">
//     //                         <Option value="Operations">Operations</Option>
//     //                         <Option value="IT">IT Department</Option>
//     //                         <Option value="Finance">Finance</Option>
//     //                         <Option value="HR">Human Resources</Option>
//     //                         <Option value="Marketing">Marketing</Option>
//     //                         <Option value="Supply Chain">Supply Chain</Option>
//     //                         <Option value="Facilities">Facilities</Option>
//     //                         <Option value="Roll Out">Roll Out</Option>
//     //                     </Select>
//     //                 </Form.Item>
//     //             </Col>
//     //             <Col span={8}>
//     //                 <Form.Item
//     //                     name="projectManager"
//     //                     label="Project Manager"
//     //                     rules={[{ required: true, message: 'Please select project manager' }]}
//     //                 >
//     //                     <Select
//     //                         placeholder={projectManagersLoading ? "Loading..." : "Select project manager"}
//     //                         showSearch
//     //                         loading={projectManagersLoading}
//     //                         filterOption={(input, option) => {
//     //                             const manager = projectManagers.find(m => m._id === option.value);
//     //                             if (!manager) return false;
//     //                             return (
//     //                                 (manager.fullName || manager.name || '').toLowerCase().includes(input.toLowerCase()) ||
//     //                                 (manager.department || '').toLowerCase().includes(input.toLowerCase())
//     //                             );
//     //                         }}
//     //                     >
//     //                         {projectManagers.map(manager => (
//     //                             <Option key={manager._id} value={manager._id}>
//     //                                 <div>
//     //                                     <Text strong>{manager.fullName || manager.name || 'Unknown'}</Text>
//     //                                     <br />
//     //                                     <Text type="secondary" style={{ fontSize: '12px' }}>
//     //                                         {manager.role || 'Employee'} {manager.department ? `| ${manager.department}` : ''}
//     //                                     </Text>
//     //                                 </div>
//     //                             </Option>
//     //                         ))}
//     //                     </Select>
//     //                 </Form.Item>
//     //             </Col>
//     //         </Row>

//     //         <Form.Item
//     //             name="description"
//     //             label="Project Description"
//     //             rules={[
//     //                 { required: true, message: 'Please provide project description' },
//     //                 { min: 20, message: 'Description must be at least 20 characters' }
//     //             ]}
//     //         >
//     //             <TextArea
//     //                 rows={3}
//     //                 placeholder="Detailed description of the project objectives and scope..."
//     //                 showCount
//     //                 maxLength={1000}
//     //             />
//     //         </Form.Item>

//     //         <Row gutter={16}>
//     //             <Col span={24}>
//     //                 <Form.Item
//     //                     name="timeline"
//     //                     label="Project Timeline"
//     //                     rules={[{ required: true, message: 'Please select project timeline' }]}
//     //                 >
//     //                     <RangePicker
//     //                         style={{ width: '100%' }}
//     //                         placeholder={['Start Date', 'End Date']}
//     //                         disabledDate={(current) => current && current < moment().subtract(1, 'day')}
//     //                     />
//     //                 </Form.Item>
//     //             </Col>
//     //         </Row>

//     //         <Form.Item
//     //             name="budgetCodeId"
//     //             label="Budget Code Assignment (Optional)"
//     //         >
//     //             <Select
//     //                 placeholder="Select budget code (optional)"
//     //                 allowClear
//     //                 loading={loadingBudgetCodes}
//     //             >
//     //                 {budgetCodes.map(budgetCode => (
//     //                     <Option key={budgetCode._id} value={budgetCode._id}>
//     //                         <div>
//     //                             <Text strong>{budgetCode.code}</Text> - {budgetCode.name}
//     //                             <br />
//     //                             <Text type="secondary" style={{ fontSize: '12px' }}>
//     //                                 Available: XAF {(budgetCode.available || 0).toLocaleString()}
//     //                             </Text>
//     //                         </div>
//     //                     </Option>
//     //                 ))}
//     //             </Select>
//     //         </Form.Item>

//     //         <Divider>Milestones with Supervisor Assignment</Divider>

//     //         <Alert
//     //             message="Important: Milestone Weights"
//     //             description="The description the sum of all milestone weights must equal 100%. Each milestone must have an assigned supervisor who will manage tasks for that milestone."
//     //             type="info"
//     //             showIcon
//     //             style={{ marginBottom: 16 }}
//     //         />

//     //         <Form.List name="milestones">
//     //             {(fields, { add, remove }) => (
//     //                 <>
//     //                     {fields.map(({ key, name, ...restField }) => (
//     //                         <Card key={key} size="small" style={{ marginBottom: 16, backgroundColor: '#fafafa' }}>
//     //                             <Row gutter={16} align="middle">
//     //                                 <Col span={10}>
//     //                                     <Form.Item
//     //                                         {...restField}
//     //                                         name={[name, 'title']}
//     //                                         label="Milestone Title"
//     //                                         rules={[{ required: true, message: 'Required' }]}
//     //                                     >
//     //                                         <Input placeholder="e.g., Planning Phase" />
//     //                                     </Form.Item>
//     //                                 </Col>
//     //                                 <Col span={6}>
//     //                                     <Form.Item
//     //                                         {...restField}
//     //                                         name={[name, 'weight']}
//     //                                         label="Weight (%)"
//     //                                         rules={[{ required: true, message: 'Required' }]}
//     //                                         initialValue={0}
//     //                                     >
//     //                                         <InputNumber
//     //                                             min={0}
//     //                                             max={100}
//     //                                             formatter={value => `${value}%`}
//     //                                             parser={value => value.replace('%', '')}
//     //                                             style={{ width: '100%' }}
//     //                                         />
//     //                                     </Form.Item>
//     //                                 </Col>
//     //                                 <Col span={6}>
//     //                                     <Form.Item
//     //                                         {...restField}
//     //                                         name={[name, 'dueDate']}
//     //                                         label="Due Date"
//     //                                     >
//     //                                         <DatePicker placeholder="Due date" style={{ width: '100%' }} />
//     //                                     </Form.Item>
//     //                                 </Col>
//     //                                 <Col span={2} style={{ paddingTop: 30 }}>
//     //                                     <Button 
//     //                                         type="link" 
//     //                                         danger
//     //                                         icon={<MinusCircleOutlined />}
//     //                                         onClick={() => remove(name)}
//     //                                     />
//     //                                 </Col>
//     //                             </Row>

//     //                             <Form.Item
//     //                                 {...restField}
//     //                                 name={[name, 'description']}
//     //                                 label="Description"
//     //                             >
//     //                                 <TextArea rows={2} placeholder="Optional milestone description" />
//     //                             </Form.Item>

//     //                             <Form.Item
//     //                                 {...restField}
//     //                                 name={[name, 'assignedSupervisor']}
//     //                                 label="Assigned Supervisor"
//     //                                 rules={[{ required: true, message: 'Please assign a supervisor to this milestone' }]}
//     //                             >
//     //                                 <Select
//     //                                     placeholder="Select supervisor"
//     //                                     showSearch
//     //                                     filterOption={(input, option) => {
//     //                                         const sup = supervisors.find(s => s._id === option.value);
//     //                                         if (!sup) return false;
//     //                                         return (
//     //                                             (sup.fullName || sup.name || '').toLowerCase().includes(input.toLowerCase()) ||
//     //                                             (sup.department || '').toLowerCase().includes(input.toLowerCase())
//     //                                         );
//     //                                     }}
//     //                                 >
//     //                                     {supervisors.map(sup => (
//     //                                         <Option key={sup._id} value={sup._id}>
//     //                                             <div>
//     //                                                 <Text strong>{sup.fullName || sup.name}</Text>
//     //                                                 <br />
//     //                                                 <Text type="secondary" style={{ fontSize: '12px' }}>
//     //                                                     {sup.position || sup.role} | {sup.department}
//     //                                                 </Text>
//     //                                             </div>
//     //                                         </Option>
//     //                                     ))}
//     //                                 </Select>
//     //                             </Form.Item>
//     //                         </Card>
//     //                     ))}
//     //                     <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
//     //                         Add Milestone
//     //                     </Button>
//     //                 </>
//     //             )}
//     //         </Form.List>

//     //         <Divider />

//     //         <Form.Item>
//     //             <Space>
//     //                 <Button onClick={() => {
//     //                     setProjectModalVisible(false);
//     //                     setEditingProject(null);
//     //                     form.resetFields();
//     //                 }}>
//     //                     Cancel
//     //                 </Button>
//     //                 <Button
//     //                     type="primary"
//     //                     htmlType="submit"
//     //                     loading={loading}
//     //                     icon={editingProject ? <EditOutlined /> : <PlusOutlined />}
//     //                 >
//     //                     {editingProject ? 'Update Project' : 'Create Project'}
//     //                 </Button>
//     //             </Space>
//     //         </Form.Item>
//     //     </Form>
//     // );



// // Enhanced ProjectForm component - replace the existing one
// const ProjectForm = () => {
//     const steps = [
//         {
//             title: 'Basic Info',
//             icon: <ProjectOutlined />
//         },
//         {
//             title: 'Timeline & Budget',
//             icon: <CalendarOutlined />
//         },
//         {
//             title: 'Milestones',
//             icon: <FlagOutlined />
//         },
//         {
//             title: 'Resources',
//             icon: <TeamOutlined />
//         },
//         {
//             title: 'Review',
//             icon: <CheckCircleOutlined />
//         }
//     ];

//     const nextStep = async () => {
//         try {
//             // Only validate the specific fields for the current step
//             const fieldsToValidate = getFieldsForStep(currentStep);
            
//             if (fieldsToValidate.length > 0) {
//                 await form.validateFields(fieldsToValidate);
//             }
            
//             // Additional validation for milestones step
//             if (currentStep === 2) {
//                 const milestones = form.getFieldValue('milestones') || [];
//                 if (milestones.length === 0) {
//                     message.error('Please add at least one milestone');
//                     return;
//                 }
                
//                 const totalWeight = milestones.reduce((sum, m) => sum + (m?.weight || 0), 0);
//                 if (totalWeight !== 100) {
//                     message.error(`Milestone weights must sum to 100%. Current total: ${totalWeight}%`);
//                     return;
//                 }
//             }
            
//             setCurrentStep(currentStep + 1);
//         } catch (error) {
//             console.error('Validation failed:', error);
            
//             // Show specific error messages
//             if (error.errorFields && error.errorFields.length > 0) {
//                 const firstError = error.errorFields[0];
//                 message.error(firstError.errors[0] || 'Please fill in all required fields');
//             } else {
//                 message.error('Please fill in all required fields');
//             }
//         }
//     };

//     const prevStep = () => {
//         setCurrentStep(currentStep - 1);
//     };

//     const getFieldsForStep = (step) => {
//         switch (step) {
//             case 0:
//                 return ['name', 'description', 'projectType', 'priority', 'department', 'projectManager'];
//             case 1:
//                 return ['timeline'];
//             case 2:
//                 // Milestones validation is handled separately in nextStep
//                 return [];
//             case 3:
//                 // Resources are optional
//                 return [];
//             case 4:
//                 // Review step - no validation needed
//                 return [];
//             default:
//                 return [];
//         }
//     };


//     // Step 1: Basic Information
//     const renderBasicInfo = () => (
//         <div>
//             <Alert
//                 message="Project Basic Information"
//                 description="Start by defining the core details of your project. This information will be visible to all stakeholders."
//                 type="info"
//                 showIcon
//                 style={{ marginBottom: 24 }}
//             />

//             <Row gutter={16}>
//                 <Col span={16}>
//                     <Form.Item
//                         name="name"
//                         label="Project Name"
//                         rules={[
//                             { required: true, message: 'Please enter project name' },
//                             { min: 5, message: 'Project name must be at least 5 characters' },
//                             { max: 200, message: 'Project name cannot exceed 200 characters' }
//                         ]}
//                         tooltip="Choose a clear, descriptive name that identifies the project"
//                     >
//                         <Input 
//                             placeholder="e.g., Office Infrastructure Upgrade Q4 2024"
//                             size="large"
//                         />
//                     </Form.Item>
//                 </Col>
//                 <Col span={8}>
//                     <Form.Item
//                         name="priority"
//                         label="Priority Level"
//                         rules={[{ required: true, message: 'Please select priority' }]}
//                         tooltip="Set the urgency level for this project"
//                     >
//                         <Select placeholder="Select priority" size="large">
//                             <Option value="Low">
//                                 <Space>
//                                     🟢 Low
//                                     <Text type="secondary" style={{ fontSize: '11px' }}>
//                                         - Can be scheduled flexibly
//                                     </Text>
//                                 </Space>
//                             </Option>
//                             <Option value="Medium">
//                                 <Space>
//                                     🟡 Medium
//                                     <Text type="secondary" style={{ fontSize: '11px' }}>
//                                         - Normal timeline
//                                     </Text>
//                                 </Space>
//                             </Option>
//                             <Option value="High">
//                                 <Space>
//                                     🟠 High
//                                     <Text type="secondary" style={{ fontSize: '11px' }}>
//                                         - Requires attention
//                                     </Text>
//                                 </Space>
//                             </Option>
//                             <Option value="Critical">
//                                 <Space>
//                                     🔴 Critical
//                                     <Text type="secondary" style={{ fontSize: '11px' }}>
//                                         - Urgent priority
//                                     </Text>
//                                 </Space>
//                             </Option>
//                         </Select>
//                     </Form.Item>
//                 </Col>
//             </Row>

//             <Form.Item
//                 name="description"
//                 label="Project Description"
//                 rules={[
//                     { required: true, message: 'Please provide project description' },
//                     { min: 20, message: 'Description must be at least 20 characters' },
//                     { max: 2000, message: 'Description cannot exceed 2000 characters' }
//                 ]}
//                 tooltip="Provide a comprehensive overview of project objectives, scope, and expected outcomes"
//             >
//                 <TextArea
//                     rows={5}
//                     placeholder="Describe the project objectives, scope, deliverables, and expected outcomes in detail..."
//                     showCount
//                     maxLength={2000}
//                 />
//             </Form.Item>

//             <Row gutter={16}>
//                 <Col span={8}>
//                     <Form.Item
//                         name="projectType"
//                         label="Project Type"
//                         rules={[{ required: true, message: 'Please select project type' }]}
//                         tooltip="Categorize your project for better organization"
//                     >
//                         <Select placeholder="Select project type" size="large">
//                             <Option value="Site Build">🏗️ Site Build</Option>
//                             <Option value="Colocation">🏢 Colocation</Option>
//                             <Option value="Power Projects">⚡ Power Projects</Option>
//                             <Option value="Tower Maintenance">📡 Tower Maintenance</Option>
//                             <Option value="Refurbishment (Gen)">🔧 Refurbishment (Gen)</Option>
//                             <Option value="Managed Service">⚙️ Managed Service</Option>
//                             <Option value="Kiosk">🏪 Kiosk</Option>
//                             <Option value="IT Implementation">💻 IT Implementation</Option>
//                             <Option value="Process Improvement">📊 Process Improvement</Option>
//                             <Option value="Product Development">🎯 Product Development</Option>
//                             <Option value="Marketing Campaign">📢 Marketing Campaign</Option>
//                             <Option value="Training Program">📚 Training Program</Option>
//                             <Option value="Other">📌 Other</Option>
//                         </Select>
//                     </Form.Item>
//                 </Col>
//                 <Col span={8}>
//                     <Form.Item
//                         name="department"
//                         label="Responsible Department"
//                         rules={[{ required: true, message: 'Please select department' }]}
//                         tooltip="Which department will own this project?"
//                     >
//                         <Select placeholder="Select department" size="large">
//                             <Option value="Operations">Operations</Option>
//                             <Option value="IT">IT Department</Option>
//                             <Option value="Finance">Finance</Option>
//                             <Option value="HR">Human Resources</Option>
//                             <Option value="Marketing">Marketing</Option>
//                             <Option value="Supply Chain">Supply Chain</Option>
//                             <Option value="Facilities">Facilities</Option>
//                             <Option value="Roll Out">Roll Out</Option>
//                         </Select>
//                     </Form.Item>
//                 </Col>
//                 <Col span={8}>
//                     <Form.Item
//                         name="projectManager"
//                         label="Project Manager"
//                         rules={[{ required: true, message: 'Please select project manager' }]}
//                         tooltip="Who will be responsible for managing this project?"
//                     >
//                         <Select
//                             placeholder={projectManagersLoading ? "Loading..." : "Select project manager"}
//                             showSearch
//                             loading={projectManagersLoading}
//                             size="large"
//                             filterOption={(input, option) => {
//                                 const manager = projectManagers.find(m => m._id === option.value);
//                                 if (!manager) return false;
//                                 return (
//                                     (manager.fullName || manager.name || '').toLowerCase().includes(input.toLowerCase()) ||
//                                     (manager.department || '').toLowerCase().includes(input.toLowerCase())
//                                 );
//                             }}
//                         >
//                             {projectManagers.map(manager => (
//                                 <Option key={manager._id} value={manager._id}>
//                                     <div>
//                                         <Avatar size="small" icon={<UserOutlined />} style={{ marginRight: 8 }} />
//                                         <Text strong>{manager.fullName || manager.name || 'Unknown'}</Text>
//                                         <br />
//                                         <Text type="secondary" style={{ fontSize: '12px', marginLeft: 32 }}>
//                                             {manager.role || 'Employee'} {manager.department ? `• ${manager.department}` : ''}
//                                         </Text>
//                                     </div>
//                                 </Option>
//                             ))}
//                         </Select>
//                     </Form.Item>
//                 </Col>
//             </Row>

//             <Divider>Additional Information (Optional)</Divider>

//             <Form.Item
//                 name="tags"
//                 label="Project Tags"
//                 tooltip="Add tags to help categorize and search for this project"
//             >
//                 <Select
//                     mode="tags"
//                     placeholder="Add tags (e.g., infrastructure, urgent, Q4-2024)"
//                     style={{ width: '100%' }}
//                     tokenSeparators={[',']}
//                 >
//                     {['Infrastructure', 'Urgent', 'Strategic', 'Operational', 'Customer-Facing', 'Internal'].map(tag => (
//                         <Option key={tag} value={tag}>{tag}</Option>
//                     ))}
//                 </Select>
//             </Form.Item>

//             <Row gutter={16}>
//                 <Col span={12}>
//                     <Card size="small" title="Project Objectives" style={{ backgroundColor: '#f0f8ff' }}>
//                         <Form.Item
//                             name="objectives"
//                             label="Key Objectives"
//                             tooltip="What are the main goals of this project?"
//                         >
//                             <Select
//                                 mode="tags"
//                                 placeholder="Enter project objectives (press Enter after each)"
//                                 style={{ width: '100%' }}
//                             />
//                         </Form.Item>
//                     </Card>
//                 </Col>
//                 <Col span={12}>
//                     <Card size="small" title="Success Criteria" style={{ backgroundColor: '#f0f8ff' }}>
//                         <Form.Item
//                             name="successCriteria"
//                             label="How will success be measured?"
//                             tooltip="Define the criteria that will determine project success"
//                         >
//                             <Select
//                                 mode="tags"
//                                 placeholder="Enter success criteria (press Enter after each)"
//                                 style={{ width: '100%' }}
//                             />
//                         </Form.Item>
//                     </Card>
//                 </Col>
//             </Row>
//         </div>
//     );

//     // Step 2: Timeline & Budget
//     const renderTimelineAndBudget = () => (
//         <div>
//             <Alert
//                 message="Project Timeline & Budget"
//                 description="Define when the project will run and allocate budget resources if needed."
//                 type="info"
//                 showIcon
//                 style={{ marginBottom: 24 }}
//             />

//             <Card size="small" title="Project Timeline" style={{ marginBottom: 24, backgroundColor: '#f0f8ff' }}>
//                 <Row gutter={16}>
//                     <Col span={24}>
//                         <Form.Item
//                             name="timeline"
//                             label="Project Duration"
//                             rules={[{ required: true, message: 'Please select project timeline' }]}
//                             tooltip="When will this project start and end?"
//                         >
//                             <RangePicker
//                                 style={{ width: '100%' }}
//                                 size="large"
//                                 placeholder={['Start Date', 'End Date']}
//                                 disabledDate={(current) => current && current < moment().subtract(1, 'day')}
//                                 format="MMMM DD, YYYY"
//                                 onChange={(dates) => {
//                                     if (dates && dates[0] && dates[1]) {
//                                         const duration = dates[1].diff(dates[0], 'days');
//                                         message.info(`Project duration: ${duration} days`);
//                                     }
//                                 }}
//                             />
//                         </Form.Item>
//                     </Col>
//                 </Row>

//                 {/* Phases */}
//                 <Divider>
//                     <Space>
//                         <Text>Project Phases</Text>
//                         <Switch
//                             checked={phasesEnabled}
//                             onChange={setPhasesEnabled}
//                             checkedChildren="Enabled"
//                             unCheckedChildren="Disabled"
//                         />
//                     </Space>
//                 </Divider>

//                 {phasesEnabled && (
//                     <Card size="small" style={{ backgroundColor: '#fafafa' }}>
//                         <Text type="secondary" style={{ fontSize: '12px' }}>
//                             Break down your project into major phases for better planning
//                         </Text>
//                         <Form.List name="phases">
//                             {(fields, { add, remove }) => (
//                                 <>
//                                     {fields.map(({ key, name, ...restField }) => (
//                                         <Card key={key} size="small" style={{ marginTop: 16, marginBottom: 8 }}>
//                                             <Row gutter={16} align="middle">
//                                                 <Col span={10}>
//                                                     <Form.Item
//                                                         {...restField}
//                                                         name={[name, 'name']}
//                                                         label="Phase Name"
//                                                         rules={[{ required: true, message: 'Required' }]}
//                                                     >
//                                                         <Input placeholder="e.g., Planning & Design" />
//                                                     </Form.Item>
//                                                 </Col>
//                                                 <Col span={12}>
//                                                     <Form.Item
//                                                         {...restField}
//                                                         name={[name, 'duration']}
//                                                         label="Duration"
//                                                         rules={[{ required: true, message: 'Required' }]}
//                                                     >
//                                                         <RangePicker style={{ width: '100%' }} />
//                                                     </Form.Item>
//                                                 </Col>
//                                                 <Col span={2} style={{ paddingTop: 30 }}>
//                                                     <Button 
//                                                         type="link" 
//                                                         danger
//                                                         icon={<MinusCircleOutlined />}
//                                                         onClick={() => remove(name)}
//                                                     />
//                                                 </Col>
//                                             </Row>
//                                             <Form.Item
//                                                 {...restField}
//                                                 name={[name, 'description']}
//                                                 label="Phase Description"
//                                             >
//                                                 <TextArea rows={2} placeholder="What happens in this phase?" />
//                                             </Form.Item>
//                                             <Form.Item
//                                                 {...restField}
//                                                 name={[name, 'deliverables']}
//                                                 label="Key Deliverables"
//                                             >
//                                                 <Select
//                                                     mode="tags"
//                                                     placeholder="Enter deliverables (press Enter)"
//                                                     style={{ width: '100%' }}
//                                                 />
//                                             </Form.Item>
//                                         </Card>
//                                     ))}
//                                     <Button 
//                                         type="dashed" 
//                                         onClick={() => add()} 
//                                         block 
//                                         icon={<PlusOutlined />}
//                                         style={{ marginTop: 8 }}
//                                     >
//                                         Add Phase
//                                     </Button>
//                                 </>
//                             )}
//                         </Form.List>
//                     </Card>
//                 )}
//             </Card>

//             <Card size="small" title="Budget Allocation" style={{ backgroundColor: '#fff7e6' }}>
//                 <Space direction="vertical" style={{ width: '100%' }} size="large">
//                     <div>
//                         <Space>
//                             <Text strong>Enable Budget Tracking</Text>
//                             <Switch
//                                 checked={budgetEnabled}
//                                 onChange={setBudgetEnabled}
//                                 checkedChildren="Yes"
//                                 unCheckedChildren="No"
//                             />
//                         </Space>
//                         <br />
//                         <Text type="secondary" style={{ fontSize: '12px' }}>
//                             Track project expenses and budget utilization
//                         </Text>
//                     </div>

//                     {budgetEnabled && (
//                         <>
//                             <Form.Item
//                                 name="budgetCodeId"
//                                 label="Link to Budget Code"
//                                 tooltip="Connect this project to an existing budget code for tracking"
//                             >
//                                 <Select
//                                     placeholder="Select budget code (optional)"
//                                     allowClear
//                                     loading={loadingBudgetCodes}
//                                     size="large"
//                                     showSearch
//                                     filterOption={(input, option) => {
//                                         const code = budgetCodes.find(bc => bc._id === option.value);
//                                         return code ? 
//                                             code.code.toLowerCase().includes(input.toLowerCase()) ||
//                                             code.name.toLowerCase().includes(input.toLowerCase())
//                                             : false;
//                                     }}
//                                 >
//                                     {budgetCodes.map(budgetCode => (
//                                         <Option key={budgetCode._id} value={budgetCode._id}>
//                                             <div>
//                                                 <Text strong>{budgetCode.code}</Text> - {budgetCode.name}
//                                                 <br />
//                                                 <Text type="secondary" style={{ fontSize: '12px' }}>
//                                                     Available: XAF {(budgetCode.available || 0).toLocaleString()}
//                                                     {budgetCode.department && ` • ${budgetCode.department}`}
//                                                 </Text>
//                                             </div>
//                                         </Option>
//                                     ))}
//                                 </Select>
//                             </Form.Item>

//                             <Divider>Or Set Custom Budget</Divider>

//                             <Row gutter={16}>
//                                 <Col span={16}>
//                                     <Form.Item
//                                         name={['customBudget', 'allocated']}
//                                         label="Allocated Budget"
//                                         tooltip="Total budget allocated for this project"
//                                     >
//                                         <InputNumber
//                                             style={{ width: '100%' }}
//                                             size="large"
//                                             min={0}
//                                             formatter={value => `XAF ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
//                                             parser={value => value.replace(/XAF\s?|(,*)/g, '')}
//                                             placeholder="0"
//                                         />
//                                     </Form.Item>
//                                 </Col>
//                                 <Col span={8}>
//                                     <Form.Item
//                                         name={['customBudget', 'currency']}
//                                         label="Currency"
//                                         initialValue="XAF"
//                                     >
//                                         <Select size="large">
//                                             <Option value="XAF">XAF - CFA Franc</Option>
//                                             <Option value="USD">USD - US Dollar</Option>
//                                             <Option value="EUR">EUR - Euro</Option>
//                                         </Select>
//                                     </Form.Item>
//                                 </Col>
//                             </Row>

//                             <Alert
//                                 message="Budget Tracking"
//                                 description="You can track expenses against this budget throughout the project lifecycle. Budget utilization will be calculated automatically."
//                                 type="info"
//                                 showIcon
//                             />
//                         </>
//                     )}
//                 </Space>
//             </Card>
//         </div>
//     );

//     // Step 3: Milestones (Enhanced)
//     const renderMilestones = () => (
//         <div>
//             <Alert
//                 message="Project Milestones with Supervisor Assignment"
//                 description={
//                     <div>
//                         <Text>Define key project milestones and assign supervisors who will manage tasks within each milestone.</Text>
//                         <br />
//                         <Text strong style={{ color: '#f5222d' }}>Important: </Text>
//                         <Text type="secondary">The sum of all milestone weights must equal 100%</Text>
//                     </div>
//                 }
//                 type="warning"
//                 showIcon
//                 style={{ marginBottom: 16 }}
//             />

//             <Form.List name="milestones">
//                 {(fields, { add, remove }) => {
//                     // Calculate current total weight
//                     const currentValues = form.getFieldValue('milestones') || [];
//                     const totalWeight = currentValues.reduce((sum, m) => sum + (m?.weight || 0), 0);
//                     const remainingWeight = 100 - totalWeight;

//                     return (
//                         <>
//                             {/* Weight Summary Card */}
//                             <Card 
//                                 size="small" 
//                                 style={{ 
//                                     marginBottom: 16, 
//                                     backgroundColor: totalWeight === 100 ? '#f6ffed' : '#fff7e6',
//                                     borderColor: totalWeight === 100 ? '#52c41a' : '#faad14'
//                                 }}
//                             >
//                                 <Row gutter={16} align="middle">
//                                     <Col span={8}>
//                                         <Statistic
//                                             title="Total Weight Allocated"
//                                             value={totalWeight}
//                                             suffix="/ 100%"
//                                             valueStyle={{ 
//                                                 color: totalWeight === 100 ? '#52c41a' : 
//                                                        totalWeight > 100 ? '#f5222d' : '#faad14'
//                                             }}
//                                         />
//                                     </Col>
//                                     <Col span={8}>
//                                         <Statistic
//                                             title="Remaining Weight"
//                                             value={remainingWeight}
//                                             suffix="%"
//                                             valueStyle={{ 
//                                                 color: remainingWeight === 0 ? '#52c41a' : 
//                                                        remainingWeight < 0 ? '#f5222d' : '#1890ff'
//                                             }}
//                                         />
//                                     </Col>
//                                     <Col span={8}>
//                                         <Statistic
//                                             title="Milestones Defined"
//                                             value={fields.length}
//                                             prefix={<FlagOutlined />}
//                                         />
//                                     </Col>
//                                 </Row>
//                                 <Progress 
//                                     percent={Math.min(totalWeight, 100)} 
//                                     status={
//                                         totalWeight === 100 ? 'success' : 
//                                         totalWeight > 100 ? 'exception' : 'active'
//                                     }
//                                     style={{ marginTop: 16 }}
//                                 />
//                             </Card>

//                             {fields.map(({ key, name, ...restField }, index) => (
//                                 <Card 
//                                     key={key} 
//                                     size="small" 
//                                     style={{ 
//                                         marginBottom: 16, 
//                                         backgroundColor: '#fafafa',
//                                         border: '1px solid #d9d9d9'
//                                     }}
//                                     title={
//                                         <Space>
//                                             <Badge count={index + 1} style={{ backgroundColor: '#1890ff' }} />
//                                             <Text strong>Milestone {index + 1}</Text>
//                                         </Space>
//                                     }
//                                     extra={
//                                         <Button 
//                                             type="link" 
//                                             danger
//                                             size="small"
//                                             icon={<DeleteOutlined />}
//                                             onClick={() => remove(name)}
//                                         >
//                                             Remove
//                                         </Button>
//                                     }
//                                 >
//                                     <Row gutter={16}>
//                                         <Col span={14}>
//                                             <Form.Item
//                                                 {...restField}
//                                                 name={[name, 'title']}
//                                                 label="Milestone Title"
//                                                 rules={[
//                                                     { required: true, message: 'Title is required' },
//                                                     { min: 3, message: 'Title must be at least 3 characters' }
//                                                 ]}
//                                             >
//                                                 <Input 
//                                                     placeholder="e.g., Planning & Requirements Gathering" 
//                                                     size="large"
//                                                 />
//                                             </Form.Item>
//                                         </Col>
//                                         <Col span={6}>
//                                             <Form.Item
//                                                 {...restField}
//                                                 name={[name, 'weight']}
//                                                 label={
//                                                     <Space>
//                                                         <Text>Weight</Text>
//                                                         <Tooltip title="Percentage contribution to overall project completion">
//                                                             <ExclamationCircleOutlined style={{ color: '#1890ff' }} />
//                                                         </Tooltip>
//                                                     </Space>
//                                                 }
//                                                 rules={[
//                                                     { required: true, message: 'Required' },
//                                                     {
//                                                         validator: (_, value) => {
//                                                             if (value < 0 || value > 100) {
//                                                                 return Promise.reject('Weight must be between 0 and 100');
//                                                             }
//                                                             return Promise.resolve();
//                                                         }
//                                                     }
//                                                 ]}
//                                                 initialValue={0}
//                                             >
//                                                 <InputNumber
//                                                     min={0}
//                                                     max={100}
//                                                     formatter={value => `${value}%`}
//                                                     parser={value => value.replace('%', '')}
//                                                     style={{ width: '100%' }}
//                                                     size="large"
//                                                     onChange={(value) => {
//                                                         // Force re-render to update totals
//                                                         form.setFieldsValue({});
//                                                     }}
//                                                 />
//                                             </Form.Item>
//                                         </Col>
//                                         <Col span={4}>
//                                             <Form.Item
//                                                 {...restField}
//                                                 name={[name, 'dueDate']}
//                                                 label="Due Date"
//                                             >
//                                                 <DatePicker 
//                                                     placeholder="Select date" 
//                                                     style={{ width: '100%' }}
//                                                     size="large"
//                                                 />
//                                             </Form.Item>
//                                         </Col>
//                                     </Row>

//                                     <Form.Item
//                                         {...restField}
//                                         name={[name, 'description']}
//                                         label="Description"
//                                         tooltip="Describe what needs to be accomplished in this milestone"
//                                     >
//                                         <TextArea 
//                                             rows={2} 
//                                             placeholder="Detailed description of milestone objectives and deliverables..."
//                                             showCount
//                                             maxLength={500}
//                                         />
//                                     </Form.Item>

//                                     <Form.Item
//                                         {...restField}
//                                         name={[name, 'assignedSupervisor']}
//                                         label={
//                                             <Space>
//                                                 <UserOutlined />
//                                                 <Text strong>Assigned Supervisor</Text>
//                                                 <Tag color="red">Required</Tag>
//                                             </Space>
//                                         }
//                                         rules={[{ required: true, message: 'Please assign a supervisor to this milestone' }]}
//                                         tooltip="This supervisor will manage all tasks within this milestone"
//                                     >
//                                         <Select
//                                             placeholder="Select milestone supervisor"
//                                             showSearch
//                                             size="large"
//                                             filterOption={(input, option) => {
//                                                 const sup = supervisors.find(s => s._id === option.value);
//                                                 if (!sup) return false;
//                                                 return (
//                                                     (sup.fullName || sup.name || '').toLowerCase().includes(input.toLowerCase()) ||
//                                                     (sup.department || '').toLowerCase().includes(input.toLowerCase())
//                                                 );
//                                             }}
//                                         >
//                                             {supervisors.map(sup => (
//                                                 <Option key={sup._id} value={sup._id}>
//                                                     <div>
//                                                         <Avatar size="small" icon={<UserOutlined />} style={{ marginRight: 8 }} />
//                                                         <Text strong>{sup.fullName || sup.name}</Text>
//                                                         <br />
//                                                         <Text type="secondary" style={{ fontSize: '12px', marginLeft: 32 }}>
//                                                             {sup.position || sup.role} • {sup.department}
//                                                         </Text>
//                                                     </div>
//                                                 </Option>
//                                             ))}
//                                         </Select>
//                                     </Form.Item>

//                                     {/* Milestone Success Criteria */}
//                                     <Card size="small" style={{ backgroundColor: '#f0f8ff', marginTop: 8 }}>
//                                         <Form.Item
//                                             {...restField}
//                                             name={[name, 'completionCriteria']}
//                                             label="Completion Criteria"
//                                             tooltip="What must be completed to mark this milestone as done?"
//                                         >
//                                             <Select
//                                                 mode="tags"
//                                                 placeholder="Enter completion criteria (press Enter after each)"
//                                                 style={{ width: '100%' }}
//                                             />
//                                         </Form.Item>
//                                     </Card>
//                                 </Card>
//                             ))}

//                             <Button 
//                                 type="dashed" 
//                                 onClick={() => add()} 
//                                 block 
//                                 icon={<PlusOutlined />}
//                                 size="large"
//                                 style={{
//                                     height: '60px',
//                                     fontSize: '16px'
//                                 }}
//                             >
//                                 Add Milestone
//                             </Button>

//                             {fields.length > 0 && totalWeight !== 100 && (
//                                 <Alert
//                                     message={`Weight ${totalWeight > 100 ? 'Exceeded' : 'Remaining'}: ${Math.abs(remainingWeight)}%`}
//                                     description={
//                                         totalWeight > 100 
//                                             ? 'Total milestone weight exceeds 100%. Please adjust milestone weights.'
//                                             : `You need to allocate ${remainingWeight}% more weight to reach 100%.`
//                                     }
//                                     type={totalWeight > 100 ? 'error' : 'warning'}
//                                     showIcon
//                                     style={{ marginTop: 16 }}
//                                 />
//                             )}
//                         </>
//                     );
//                 }}
//             </Form.List>
//         </div>
//     );

//     // Step 4: Resources
//     const renderResources = () => (
//         <div>
//             <Alert
//                 message="Project Resources"
//                 description="Define the human resources, equipment, and other resources needed for this project."
//                 type="info"
//                 showIcon
//                 style={{ marginBottom: 24 }}
//             />

//             <Space direction="vertical" style={{ width: '100%' }} size="large">
//                 <div>
//                     <Space>
//                         <Text strong>Enable Resource Planning</Text>
//                         <Switch
//                             checked={resourcesEnabled}
//                             onChange={setResourcesEnabled}
//                             checkedChildren="Yes"
//                             unCheckedChildren="No"
//                         />
//                         </Space>
//                         <br />
//                         <Text type="secondary" style={{ fontSize: '12px' }}>
//                             Track manpower, equipment, and resource allocation
//                         </Text>
//                     </div>

//                     {resourcesEnabled && (
//                         <>
//                             {/* Team Members */}
//                             <Card size="small" title="Team Members" style={{ backgroundColor: '#f0f8ff' }}>
//                                 <Form.List name="teamMembers">
//                                     {(fields, { add, remove }) => (
//                                         <>
//                                             {fields.map(({ key, name, ...restField }) => (
//                                                 <Card key={key} size="small" style={{ marginBottom: 8, backgroundColor: '#fafafa' }}>
//                                                     <Row gutter={16} align="middle">
//                                                         <Col span={10}>
//                                                             <Form.Item
//                                                                 {...restField}
//                                                                 name={[name, 'user']}
//                                                                 label="Team Member"
//                                                                 rules={[{ required: true, message: 'Required' }]}
//                                                             >
//                                                                 <Select
//                                                                     placeholder="Select team member"
//                                                                     showSearch
//                                                                     filterOption={(input, option) => {
//                                                                         const manager = projectManagers.find(m => m._id === option.value);
//                                                                         if (!manager) return false;
//                                                                         return (manager.fullName || manager.name || '').toLowerCase().includes(input.toLowerCase());
//                                                                     }}
//                                                                 >
//                                                                     {projectManagers.map(manager => (
//                                                                         <Option key={manager._id} value={manager._id}>
//                                                                             <Avatar size="small" icon={<UserOutlined />} style={{ marginRight: 8 }} />
//                                                                             {manager.fullName || manager.name}
//                                                                         </Option>
//                                                                     ))}
//                                                                 </Select>
//                                                             </Form.Item>
//                                                         </Col>
//                                                         <Col span={12}>
//                                                             <Form.Item
//                                                                 {...restField}
//                                                                 name={[name, 'role']}
//                                                                 label="Role in Project"
//                                                                 rules={[{ required: true, message: 'Required' }]}
//                                                             >
//                                                                 <Input placeholder="e.g., Technical Lead, Designer" />
//                                                             </Form.Item>
//                                                         </Col>
//                                                         <Col span={2} style={{ paddingTop: 30 }}>
//                                                             <Button 
//                                                                 type="link" 
//                                                                 danger
//                                                                 icon={<MinusCircleOutlined />}
//                                                                 onClick={() => remove(name)}
//                                                             />
//                                                         </Col>
//                                                     </Row>
//                                                 </Card>
//                                             ))}
//                                             <Button 
//                                                 type="dashed" 
//                                                 onClick={() => add()} 
//                                                 block 
//                                                 icon={<PlusOutlined />}
//                                             >
//                                                 Add Team Member
//                                             </Button>
//                                         </>
//                                     )}
//                                 </Form.List>
//                             </Card>

//                             {/* Manpower Requirements */}
//                             <Card size="small" title="Manpower Requirements" style={{ backgroundColor: '#fff7e6' }}>
//                                 <Text type="secondary" style={{ fontSize: '12px' }}>
//                                     Define the roles and number of people needed for this project
//                                 </Text>
//                                 <Form.List name="manpowerRequirements">
//                                     {(fields, { add, remove }) => (
//                                         <>
//                                             {fields.map(({ key, name, ...restField }) => (
//                                                 <Card key={key} size="small" style={{ marginTop: 8, marginBottom: 8, backgroundColor: '#fafafa' }}>
//                                                     <Row gutter={16} align="middle">
//                                                         <Col span={10}>
//                                                             <Form.Item
//                                                                 {...restField}
//                                                                 name={[name, 'role']}
//                                                                 label="Role/Skill Required"
//                                                                 rules={[{ required: true, message: 'Required' }]}
//                                                             >
//                                                                 <Input placeholder="e.g., Software Engineer" />
//                                                             </Form.Item>
//                                                         </Col>
//                                                         <Col span={6}>
//                                                             <Form.Item
//                                                                 {...restField}
//                                                                 name={[name, 'count']}
//                                                                 label="Number Needed"
//                                                                 rules={[{ required: true, message: 'Required' }]}
//                                                                 initialValue={1}
//                                                             >
//                                                                 <InputNumber min={1} style={{ width: '100%' }} />
//                                                             </Form.Item>
//                                                         </Col>
//                                                         <Col span={6}>
//                                                             <Form.Item
//                                                                 {...restField}
//                                                                 name={[name, 'allocated']}
//                                                                 label="Allocated"
//                                                                 initialValue={0}
//                                                             >
//                                                                 <InputNumber min={0} style={{ width: '100%' }} />
//                                                             </Form.Item>
//                                                         </Col>
//                                                         <Col span={2} style={{ paddingTop: 30 }}>
//                                                             <Button 
//                                                                 type="link" 
//                                                                 danger
//                                                                 icon={<MinusCircleOutlined />}
//                                                                 onClick={() => remove(name)}
//                                                             />
//                                                         </Col>
//                                                     </Row>
//                                                 </Card>
//                                             ))}
//                                             <Button 
//                                                 type="dashed" 
//                                                 onClick={() => add()} 
//                                                 block 
//                                                 icon={<PlusOutlined />}
//                                             >
//                                                 Add Manpower Requirement
//                                             </Button>
//                                         </>
//                                     )}
//                                 </Form.List>
//                             </Card>

//                             {/* Equipment Requirements */}
//                             <Card size="small" title="Equipment & Resources" style={{ backgroundColor: '#f6ffed' }}>
//                                 <Text type="secondary" style={{ fontSize: '12px' }}>
//                                     List equipment, tools, or resources needed for the project
//                                 </Text>
//                                 <Form.List name="equipmentRequirements">
//                                     {(fields, { add, remove }) => (
//                                         <>
//                                             {fields.map(({ key, name, ...restField }) => (
//                                                 <Card key={key} size="small" style={{ marginTop: 8, marginBottom: 8, backgroundColor: '#fafafa' }}>
//                                                     <Row gutter={16} align="middle">
//                                                         <Col span={12}>
//                                                             <Form.Item
//                                                                 {...restField}
//                                                                 name={[name, 'name']}
//                                                                 label="Equipment/Resource Name"
//                                                                 rules={[{ required: true, message: 'Required' }]}
//                                                             >
//                                                                 <Input placeholder="e.g., Laptops, Software Licenses" />
//                                                             </Form.Item>
//                                                         </Col>
//                                                         <Col span={5}>
//                                                             <Form.Item
//                                                                 {...restField}
//                                                                 name={[name, 'quantity']}
//                                                                 label="Quantity"
//                                                                 rules={[{ required: true, message: 'Required' }]}
//                                                                 initialValue={1}
//                                                             >
//                                                                 <InputNumber min={1} style={{ width: '100%' }} />
//                                                             </Form.Item>
//                                                         </Col>
//                                                         <Col span={5}>
//                                                             <Form.Item
//                                                                 {...restField}
//                                                                 name={[name, 'status']}
//                                                                 label="Status"
//                                                                 initialValue="Needed"
//                                                             >
//                                                                 <Select>
//                                                                     <Option value="Needed">Needed</Option>
//                                                                     <Option value="Ordered">Ordered</Option>
//                                                                     <Option value="Available">Available</Option>
//                                                                 </Select>
//                                                             </Form.Item>
//                                                         </Col>
//                                                         <Col span={2} style={{ paddingTop: 30 }}>
//                                                             <Button 
//                                                                 type="link" 
//                                                                 danger
//                                                                 icon={<MinusCircleOutlined />}
//                                                                 onClick={() => remove(name)}
//                                                             />
//                                                         </Col>
//                                                     </Row>
//                                                 </Card>
//                                             ))}
//                                             <Button 
//                                                 type="dashed" 
//                                                 onClick={() => add()} 
//                                                 block 
//                                                 icon={<PlusOutlined />}
//                                             >
//                                                 Add Equipment/Resource
//                                             </Button>
//                                         </>
//                                     )}
//                                 </Form.List>
//                             </Card>

//                             {/* Dependencies */}
//                             <Card size="small" title="Project Dependencies" style={{ backgroundColor: '#fff1f0' }}>
//                                 <Text type="secondary" style={{ fontSize: '12px' }}>
//                                     Are there any other projects this depends on?
//                                 </Text>
//                                 <Form.Item
//                                     name="dependencies"
//                                     label="Dependent Projects"
//                                     tooltip="Select projects that must be completed before this one"
//                                 >
//                                     <Select
//                                         mode="multiple"
//                                         placeholder="Select dependent projects"
//                                         showSearch
//                                         filterOption={(input, option) => {
//                                             const project = projects.find(p => p._id === option.value);
//                                             return project ? project.name.toLowerCase().includes(input.toLowerCase()) : false;
//                                         }}
//                                     >
//                                         {projects
//                                             .filter(p => p._id !== editingProject?._id) // Don't show current project
//                                             .map(project => (
//                                                 <Option key={project._id} value={project._id}>
//                                                     <Space>
//                                                         <Tag color={getStatusColor(project.status)} size="small">
//                                                             {project.status}
//                                                         </Tag>
//                                                         {project.name}
//                                                     </Space>
//                                                 </Option>
//                                             ))}
//                                     </Select>
//                                 </Form.Item>
//                             </Card>
//                         </>
//                     )}

//                     {/* Stakeholders */}
//                     <Card size="small" title="Key Stakeholders" style={{ backgroundColor: '#f0f8ff' }}>
//                         <Text type="secondary" style={{ fontSize: '12px' }}>
//                             Who should be kept informed about this project?
//                         </Text>
//                         <Form.Item
//                             name="stakeholders"
//                             label="Stakeholders"
//                             tooltip="People who should receive project updates"
//                         >
//                             <Select
//                                 mode="multiple"
//                                 placeholder="Select stakeholders"
//                                 showSearch
//                                 filterOption={(input, option) => {
//                                     const manager = projectManagers.find(m => m._id === option.value);
//                                     if (!manager) return false;
//                                     return (manager.fullName || manager.name || '').toLowerCase().includes(input.toLowerCase());
//                                 }}
//                             >
//                                 {projectManagers.map(manager => (
//                                     <Option key={manager._id} value={manager._id}>
//                                         <Avatar size="small" icon={<UserOutlined />} style={{ marginRight: 8 }} />
//                                         {manager.fullName || manager.name}
//                                         <Text type="secondary" style={{ fontSize: '11px', marginLeft: 8 }}>
//                                             • {manager.department}
//                                         </Text>
//                                     </Option>
//                                 ))}
//                             </Select>
//                         </Form.Item>
//                     </Card>

//                     {/* Quality Metrics */}
//                     <Card size="small" title="Quality Metrics" style={{ backgroundColor: '#fff7e6' }}>
//                         <Text type="secondary" style={{ fontSize: '12px' }}>
//                             Define measurable quality standards for this project
//                         </Text>
//                         <Form.List name="qualityMetrics">
//                             {(fields, { add, remove }) => (
//                                 <>
//                                     {fields.map(({ key, name, ...restField }) => (
//                                         <Card key={key} size="small" style={{ marginTop: 8, marginBottom: 8, backgroundColor: '#fafafa' }}>
//                                             <Row gutter={16} align="middle">
//                                                 <Col span={10}>
//                                                     <Form.Item
//                                                         {...restField}
//                                                         name={[name, 'name']}
//                                                         label="Metric Name"
//                                                         rules={[{ required: true, message: 'Required' }]}
//                                                     >
//                                                         <Input placeholder="e.g., Code Coverage" />
//                                                     </Form.Item>
//                                                 </Col>
//                                                 <Col span={5}>
//                                                     <Form.Item
//                                                         {...restField}
//                                                         name={[name, 'target']}
//                                                         label="Target"
//                                                         rules={[{ required: true, message: 'Required' }]}
//                                                     >
//                                                         <InputNumber style={{ width: '100%' }} placeholder="85" />
//                                                     </Form.Item>
//                                                 </Col>
//                                                 <Col span={5}>
//                                                     <Form.Item
//                                                         {...restField}
//                                                         name={[name, 'unit']}
//                                                         label="Unit"
//                                                         rules={[{ required: true, message: 'Required' }]}
//                                                     >
//                                                         <Input placeholder="%" />
//                                                     </Form.Item>
//                                                 </Col>
//                                                 <Col span={2} style={{ paddingTop: 30 }}>
//                                                     <Button 
//                                                         type="link" 
//                                                         danger
//                                                         icon={<MinusCircleOutlined />}
//                                                         onClick={() => remove(name)}
//                                                     />
//                                                 </Col>
//                                             </Row>
//                                         </Card>
//                                     ))}
//                                     <Button 
//                                         type="dashed" 
//                                         onClick={() => add()} 
//                                         block 
//                                         icon={<PlusOutlined />}
//                                     >
//                                         Add Quality Metric
//                                     </Button>
//                                 </>
//                             )}
//                         </Form.List>
//                     </Card>
//                 </Space>
//             </div>
//         );

//         // Step 5: Review
//         const renderReview = () => {
//             const values = form.getFieldsValue();
//             const timeline = values.timeline;
//             const milestones = values.milestones || [];
//             const totalWeight = milestones.reduce((sum, m) => sum + (m?.weight || 0), 0);

//             return (
//                 <div>
//                     <Alert
//                         message="Review Your Project"
//                         description="Please review all project details before creating. You can edit these later if needed."
//                         type="info"
//                         showIcon
//                         style={{ marginBottom: 24 }}
//                     />

//                     {/* Basic Information Review */}
//                     <Card size="small" title="Basic Information" style={{ marginBottom: 16 }}>
//                         <Descriptions bordered column={2} size="small">
//                             <Descriptions.Item label="Project Name" span={2}>
//                                 <Text strong>{values.name}</Text>
//                             </Descriptions.Item>
//                             <Descriptions.Item label="Type">
//                                 <Tag color="blue">{values.projectType}</Tag>
//                             </Descriptions.Item>
//                             <Descriptions.Item label="Priority">
//                                 <Tag color={getPriorityColor(values.priority)}>
//                                     {values.priority}
//                                 </Tag>
//                             </Descriptions.Item>
//                             <Descriptions.Item label="Department">
//                                 <Tag color="green">{values.department}</Tag>
//                             </Descriptions.Item>
//                             <Descriptions.Item label="Project Manager">
//                                 {projectManagers.find(m => m._id === values.projectManager)?.fullName || 'N/A'}
//                             </Descriptions.Item>
//                             <Descriptions.Item label="Description" span={2}>
//                                 {values.description}
//                             </Descriptions.Item>
//                             {values.tags && values.tags.length > 0 && (
//                                 <Descriptions.Item label="Tags" span={2}>
//                                     <Space wrap>
//                                         {values.tags.map(tag => (
//                                             <Tag key={tag}>{tag}</Tag>
//                                         ))}
//                                     </Space>
//                                 </Descriptions.Item>
//                             )}
//                         </Descriptions>
//                     </Card>

//                     {/* Timeline Review */}
//                     <Card size="small" title="Timeline & Budget" style={{ marginBottom: 16 }}>
//                         <Descriptions bordered column={2} size="small">
//                             <Descriptions.Item label="Start Date">
//                                 {timeline && timeline[0] ? timeline[0].format('MMMM DD, YYYY') : 'Not set'}
//                             </Descriptions.Item>
//                             <Descriptions.Item label="End Date">
//                                 {timeline && timeline[1] ? timeline[1].format('MMMM DD, YYYY') : 'Not set'}
//                             </Descriptions.Item>
//                             <Descriptions.Item label="Duration" span={2}>
//                                 {timeline && timeline[0] && timeline[1] ? (
//                                     <Tag color="blue">
//                                         {timeline[1].diff(timeline[0], 'days')} days
//                                     </Tag>
//                                 ) : 'Not calculated'}
//                             </Descriptions.Item>
//                             {values.budgetCodeId && (
//                                 <Descriptions.Item label="Budget Code" span={2}>
//                                     {budgetCodes.find(bc => bc._id === values.budgetCodeId)?.code || 'N/A'}
//                                 </Descriptions.Item>
//                             )}
//                             {values.customBudget?.allocated && (
//                                 <Descriptions.Item label="Custom Budget" span={2}>
//                                     {values.customBudget.currency} {values.customBudget.allocated.toLocaleString()}
//                                 </Descriptions.Item>
//                             )}
//                         </Descriptions>

//                         {values.phases && values.phases.length > 0 && (
//                             <Card size="small" title="Phases" style={{ marginTop: 16, backgroundColor: '#fafafa' }}>
//                                 <List
//                                     size="small"
//                                     dataSource={values.phases}
//                                     renderItem={(phase, index) => (
//                                         <List.Item>
//                                             <Space>
//                                                 <Badge count={index + 1} style={{ backgroundColor: '#1890ff' }} />
//                                                 <Text strong>{phase.name}</Text>
//                                                 {phase.duration && phase.duration[0] && phase.duration[1] && (
//                                                     <Tag>
//                                                         {phase.duration[0].format('MMM DD')} - {phase.duration[1].format('MMM DD')}
//                                                     </Tag>
//                                                 )}
//                                             </Space>
//                                         </List.Item>
//                                     )}
//                                 />
//                             </Card>
//                         )}
//                     </Card>

//                     {/* Milestones Review */}
//                     <Card 
//                         size="small" 
//                         title={
//                             <Space>
//                                 <Text>Milestones</Text>
//                                 <Tag color={totalWeight === 100 ? 'success' : 'warning'}>
//                                     Total Weight: {totalWeight}%
//                                 </Tag>
//                             </Space>
//                         } 
//                         style={{ marginBottom: 16 }}
//                     >
//                         {milestones.length > 0 ? (
//                             <>
//                                 <Progress 
//                                     percent={totalWeight} 
//                                     status={totalWeight === 100 ? 'success' : totalWeight > 100 ? 'exception' : 'active'}
//                                     style={{ marginBottom: 16 }}
//                                 />
//                                 <List
//                                     size="small"
//                                     dataSource={milestones}
//                                     renderItem={(milestone, index) => (
//                                         <Card size="small" style={{ marginBottom: 8, backgroundColor: '#fafafa' }}>
//                                             <Row>
//                                                 <Col span={18}>
//                                                     <Space>
//                                                         <Badge count={index + 1} style={{ backgroundColor: '#1890ff' }} />
//                                                         <Text strong>{milestone.title}</Text>
//                                                         <Tag color="blue">{milestone.weight}%</Tag>
//                                                     </Space>
//                                                     <br />
//                                                     <Text type="secondary" style={{ fontSize: '12px', marginLeft: 28 }}>
//                                                         {milestone.description}
//                                                     </Text>
//                                                 </Col>
//                                                 <Col span={6} style={{ textAlign: 'right' }}>
//                                                     <Text type="secondary" style={{ fontSize: '11px' }}>
//                                                         Supervisor
//                                                     </Text>
//                                                     <br />
//                                                     <Text strong style={{ fontSize: '12px' }}>
//                                                         {supervisors.find(s => s._id === milestone.assignedSupervisor)?.fullName || 'N/A'}
//                                                     </Text>
//                                                 </Col>
//                                             </Row>
//                                         </Card>
//                                     )}
//                                 />
//                                 {totalWeight !== 100 && (
//                                     <Alert
//                                         message="Milestone Weight Issue"
//                                         description={`Total weight is ${totalWeight}%. Please go back and adjust milestone weights to equal 100%.`}
//                                         type="warning"
//                                         showIcon
//                                         style={{ marginTop: 8 }}
//                                     />
//                                 )}
//                             </>
//                         ) : (
//                             <Alert
//                                 message="No milestones defined"
//                                 description="At least one milestone is required. Please go back and add milestones."
//                                 type="error"
//                                 showIcon
//                             />
//                         )}
//                     </Card>

//                     {/* Resources Review */}
//                     {resourcesEnabled && (
//                         <Card size="small" title="Resources" style={{ marginBottom: 16 }}>
//                             {values.teamMembers && values.teamMembers.length > 0 && (
//                                 <Descriptions bordered column={1} size="small" title="Team Members">
//                                     <Descriptions.Item label="Team Size">
//                                         <Tag color="blue">{values.teamMembers.length} members</Tag>
//                                     </Descriptions.Item>
//                                 </Descriptions>
//                             )}
//                             {values.manpowerRequirements && values.manpowerRequirements.length > 0 && (
//                                 <Descriptions bordered column={1} size="small" title="Manpower Requirements" style={{ marginTop: 8 }}>
//                                     <Descriptions.Item label="Roles Needed">
//                                         <Tag color="orange">{values.manpowerRequirements.length} roles</Tag>
//                                     </Descriptions.Item>
//                                 </Descriptions>
//                             )}
//                             {values.equipmentRequirements && values.equipmentRequirements.length > 0 && (
//                                 <Descriptions bordered column={1} size="small" title="Equipment" style={{ marginTop: 8 }}>
//                                     <Descriptions.Item label="Equipment Items">
//                                         <Tag color="purple">{values.equipmentRequirements.length} items</Tag>
//                                     </Descriptions.Item>
//                                 </Descriptions>
//                             )}
//                         </Card>
//                     )}

//                     {/* Action Buttons */}
//                     <Alert
//                         message="Ready to Create?"
//                         description={
//                             totalWeight === 100 && milestones.length > 0 
//                                 ? "All requirements are met. You can now create this project."
//                                 : "Please ensure all required fields are filled and milestone weights sum to 100%."
//                         }
//                         type={totalWeight === 100 && milestones.length > 0 ? "success" : "warning"}
//                         showIcon
//                         style={{ marginTop: 16 }}
//                     />
//                 </div>
//             );
//         };

//         return (
//             <Form
//                 form={form}
//                 layout="vertical"
//                 onFinish={editingProject ? handleUpdateProject : handleCreateProject}
//                 scrollToFirstError
//                 preserve={true} // IMPORTANT: This prevents form from resetting values
//             >
//                 {/* Steps Navigation */}
//                 <Card style={{ marginBottom: 24 }}>
//                     <Steps current={currentStep} size="small">
//                         {steps.map((step, index) => (
//                             <Steps.Step 
//                                 key={index} 
//                                 title={step.title} 
//                                 icon={step.icon}
//                                 onClick={() => {
//                                     if (index < currentStep) {
//                                         setCurrentStep(index);
//                                     }
//                                 }}
//                                 style={{ cursor: index < currentStep ? 'pointer' : 'default' }}
//                             />
//                         ))}
//                     </Steps>
//                 </Card>

//                 {/* Step Content */}
//                 <div style={{ minHeight: '400px' }}>
//                     {currentStep === 0 && renderBasicInfo()}
//                     {currentStep === 1 && renderTimelineAndBudget()}
//                     {currentStep === 2 && renderMilestones()}
//                     {currentStep === 3 && renderResources()}
//                     {currentStep === 4 && renderReview()}
//                 </div>

//                 <Divider />

//                 {/* Navigation Buttons */}
//                 <Form.Item>
//                     <Space style={{ width: '100%', justifyContent: 'space-between' }}>
//                         <Space>
//                             <Button onClick={() => {
//                                 setProjectModalVisible(false);
//                                 setEditingProject(null);
//                                 form.resetFields();
//                                 setCurrentStep(0);
//                                 setBudgetEnabled(false);
//                                 setResourcesEnabled(false);
//                                 setPhasesEnabled(false);
//                             }}>
//                                 Cancel
//                             </Button>
//                             {currentStep > 0 && (
//                                 <Button onClick={prevStep}>
//                                     Previous
//                                 </Button>
//                             )}
//                         </Space>
//                         <Space>
//                             {currentStep < steps.length - 1 && (
//                                 <Button type="primary" onClick={nextStep}>
//                                     Next
//                                 </Button>
//                             )}
//                             {currentStep === steps.length - 1 && (
//                                 <Button
//                                     type="primary"
//                                     htmlType="submit"
//                                     loading={loading}
//                                     icon={editingProject ? <EditOutlined /> : <PlusOutlined />}
//                                     size="large"
//                                 >
//                                     {editingProject ? 'Update Project' : 'Create Project'}
//                                 </Button>
//                             )}
//                         </Space>
//                     </Space>
//                 </Form.Item>
//             </Form>
//         );
//     };

//     // Analytics Modal Component
//     const AnalyticsModal = () => {
//         if (!projectAnalytics) return null;

//         const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

//         const healthScoreData = [
//             { subject: 'Schedule', value: projectAnalytics.healthScore.schedule },
//             { subject: 'Budget', value: projectAnalytics.healthScore.budget },
//             { subject: 'Scope', value: projectAnalytics.healthScore.scope },
//             { subject: 'Quality', value: projectAnalytics.healthScore.quality },
//             { subject: 'Team', value: projectAnalytics.healthScore.team }
//         ];

//         const milestoneData = [
//             { name: 'Not Started', value: projectAnalytics.milestones.notStarted },
//             { name: 'In Progress', value: projectAnalytics.milestones.inProgress },
//             { name: 'Completed', value: projectAnalytics.milestones.completed },
//             { name: 'Overdue', value: projectAnalytics.milestones.overdue }
//         ];

//         const taskPriorityData = [
//             { name: 'Critical', value: projectAnalytics.tasks.byPriority.critical },
//             { name: 'High', value: projectAnalytics.tasks.byPriority.high },
//             { name: 'Medium', value: projectAnalytics.tasks.byPriority.medium },
//             { name: 'Low', value: projectAnalytics.tasks.byPriority.low }
//         ];

//         return (
//             <Modal
//                 title={
//                     <Space>
//                         <BarChartOutlined />
//                         {selectedProject?.name} - Comprehensive Analytics
//                     </Space>
//                 }
//                 open={analyticsModalVisible}
//                 onCancel={() => setAnalyticsModalVisible(false)}
//                 footer={[
//                     <Button key="close" onClick={() => setAnalyticsModalVisible(false)}>
//                         Close
//                     </Button>,
//                     <Button 
//                         key="refresh" 
//                         type="primary" 
//                         icon={<ReloadOutlined />}
//                         onClick={() => fetchProjectAnalytics(selectedProject._id)}
//                     >
//                         Refresh
//                     </Button>
//                 ]}
//                 width={1400}
//                 style={{ top: 20 }}
//             >
//                 <Spin spinning={loadingAnalytics}>
//                     <Tabs defaultActiveKey="overview">
//                         {/* Overview Tab */}
//                         <TabPane tab="Overview" key="overview">
//                             <Row gutter={[16, 16]}>
//                                 {/* Health Score */}
//                                 <Col span={24}>
//                                     <Card 
//                                         title="Project Health Score" 
//                                         extra={
//                                             <Tag color={
//                                                 projectAnalytics.healthScore.overall >= 80 ? 'green' :
//                                                 projectAnalytics.healthScore.overall >= 60 ? 'orange' : 'red'
//                                             } style={{ fontSize: '18px', padding: '4px 12px' }}>
//                                                 {projectAnalytics.healthScore.overall}%
//                                             </Tag>
//                                         }
//                                     >
//                                         <ResponsiveContainer width="100%" height={300}>
//                                             <RadarChart data={healthScoreData}>
//                                                 <PolarGrid />
//                                                 <PolarAngleAxis dataKey="subject" />
//                                                 <PolarRadiusAxis angle={90} domain={[0, 100]} />
//                                                 <Radar 
//                                                     name="Health Score" 
//                                                     dataKey="value" 
//                                                     stroke="#8884d8" 
//                                                     fill="#8884d8" 
//                                                     fillOpacity={0.6} 
//                                                 />
//                                                 <RechartsTooltip />
//                                             </RadarChart>
//                                         </ResponsiveContainer>
//                                         <Row gutter={16} style={{ marginTop: 16 }}>
//                                             <Col span={12}>
//                                                 <Statistic
//                                                     title="Schedule Performance"
//                                                     value={projectAnalytics.healthScore.schedule}
//                                                     suffix="%"
//                                                     valueStyle={{ 
//                                                         color: projectAnalytics.healthScore.schedule >= 80 ? '#52c41a' : 
//                                                                projectAnalytics.healthScore.schedule >= 60 ? '#faad14' : '#f5222d'
//                                                     }}
//                                                 />
//                                             </Col>
//                                             <Col span={12}>
//                                                 <Statistic
//                                                     title="Budget Performance"
//                                                     value={projectAnalytics.healthScore.budget}
//                                                     suffix="%"
//                                                     valueStyle={{ 
//                                                         color: projectAnalytics.healthScore.budget >= 80 ? '#52c41a' : 
//                                                                projectAnalytics.healthScore.budget >= 60 ? '#faad14' : '#f5222d'
//                                                     }}
//                                                 />
//                                             </Col>
//                                         </Row>
//                                     </Card>
//                                 </Col>

//                                 {/* Timeline Analysis */}
//                                 <Col span={24}>
//                                     <Card title="Timeline Analysis">
//                                         <Row gutter={16}>
//                                             <Col span={6}>
//                                                 <Statistic
//                                                     title="Time Elapsed"
//                                                     value={projectAnalytics.timelineAnalysis.percentTimeElapsed}
//                                                     suffix="%"
//                                                 />
//                                                 <Text type="secondary" style={{ fontSize: '12px' }}>
//                                                     {projectAnalytics.timelineAnalysis.daysElapsed} days
//                                                 </Text>
//                                             </Col>
//                                             <Col span={6}>
//                                                 <Statistic
//                                                     title="Progress"
//                                                     value={projectAnalytics.timelineAnalysis.percentComplete}
//                                                     suffix="%"
//                                                 />
//                                             </Col>
//                                             <Col span={6}>
//                                                 <Statistic
//                                                     title="Days Remaining"
//                                                     value={projectAnalytics.timelineAnalysis.daysRemaining}
//                                                 />
//                                             </Col>
//                                             <Col span={6}>
//                                                 <Statistic
//                                                     title="Schedule Status"
//                                                     value={
//                                                         projectAnalytics.timelineAnalysis.isAheadOfSchedule ? 'Ahead' :
//                                                         projectAnalytics.timelineAnalysis.isOnTrack ? 'On Track' : 'Behind'
//                                                     }
//                                                     valueStyle={{
//                                                         color: projectAnalytics.timelineAnalysis.isAheadOfSchedule ? '#52c41a' :
//                                                                projectAnalytics.timelineAnalysis.isOnTrack ? '#1890ff' : '#f5222d'
//                                                     }}
//                                                 />
//                                             </Col>
//                                         </Row>
//                                         <Progress
//                                             percent={projectAnalytics.timelineAnalysis.percentComplete}
//                                             success={{ 
//                                                 percent: Math.min(
//                                                     projectAnalytics.timelineAnalysis.percentComplete,
//                                                     projectAnalytics.timelineAnalysis.percentTimeElapsed
//                                                 )
//                                             }}
//                                             style={{ marginTop: 16 }}
//                                         />
//                                     </Card>
//                                 </Col>

//                                 {/* Quick Stats */}
//                                 <Col span={24}>
//                                     <Row gutter={16}>
//                                         <Col span={6}>
//                                             <Card>
//                                                 <Statistic
//                                                     title="Milestones"
//                                                     value={projectAnalytics.milestones.completed}
//                                                     suffix={`/ ${projectAnalytics.milestones.total}`}
//                                                     prefix={<FlagOutlined />}
//                                                     valueStyle={{ color: '#1890ff' }}
//                                                 />
//                                                 {projectAnalytics.milestones.overdue > 0 && (
//                                                     <Alert
//                                                         message={`${projectAnalytics.milestones.overdue} overdue`}
//                                                         type="warning"
//                                                         showIcon
//                                                         style={{ marginTop: 8 }}
//                                                     />
//                                                 )}
//                                             </Card>
//                                         </Col>
//                                         <Col span={6}>
//                                             <Card>
//                                                 <Statistic
//                                                     title="Tasks"
//                                                     value={projectAnalytics.tasks.completed}
//                                                     suffix={`/ ${projectAnalytics.tasks.total}`}
//                                                     prefix={<CheckCircleOutlined />}
//                                                     valueStyle={{ color: '#52c41a' }}
//                                                 />
//                                                 {projectAnalytics.tasks.overdue > 0 && (
//                                                     <Alert
//                                                         message={`${projectAnalytics.tasks.overdue} overdue`}
//                                                         type="error"
//                                                         showIcon
//                                                         style={{ marginTop: 8 }}
//                                                     />
//                                                 )}
//                                             </Card>
//                                         </Col>
//                                         <Col span={6}>
//                                             <Card>
//                                                 <Statistic
//                                                     title="Open Issues"
//                                                     value={projectAnalytics.issues.open}
//                                                     prefix={<WarningOutlined />}
//                                                     valueStyle={{ 
//                                                         color: projectAnalytics.issues.open > 5 ? '#f5222d' : '#faad14'
//                                                     }}
//                                                 />
//                                                 {projectAnalytics.issues.bySeverity.critical > 0 && (
//                                                     <Alert
//                                                         message={`${projectAnalytics.issues.bySeverity.critical} critical`}
//                                                         type="error"
//                                                         showIcon
//                                                         style={{ marginTop: 8 }}
//                                                     />
//                                                 )}
//                                             </Card>
//                                         </Col>
//                                         <Col span={6}>
//                                             <Card>
//                                                 <Statistic
//                                                     title="Active Risks"
//                                                     value={projectAnalytics.risks.total - projectAnalytics.risks.byStatus.closed}
//                                                     prefix={<ExclamationCircleOutlined />}
//                                                     valueStyle={{ color: '#722ed1' }}
//                                                 />
//                                             </Card>
//                                         </Col>
//                                     </Row>
//                                 </Col>
//                             </Row>
//                         </TabPane>

//                         {/* Milestones Tab */}
//                         <TabPane tab={`Milestones (${projectAnalytics.milestones.total})`} key="milestones">
//                             <Row gutter={16}>
//                                 <Col span={12}>
//                                     <Card title="Milestone Status Distribution">
//                                         <ResponsiveContainer width="100%" height={300}>
//                                             <PieChart>
//                                                 <Pie
//                                                     data={milestoneData}
//                                                     cx="50%"
//                                                     cy="50%"
//                                                     labelLine={false}
//                                                     label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
//                                                     outerRadius={80}
//                                                     fill="#8884d8"
//                                                     dataKey="value"
//                                                 >
//                                                     {milestoneData.map((entry, index) => (
//                                                         <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
//                                                     ))}
//                                                 </Pie>
//                                                 <RechartsTooltip />
//                                             </PieChart>
//                                         </ResponsiveContainer>
//                                     </Card>
//                                 </Col>
//                                 <Col span={12}>
//                                     <Card title="Milestone Statistics">
//                                         <Space direction="vertical" style={{ width: '100%' }} size="large">
//                                             <Statistic
//                                                 title="Completion Rate"
//                                                 value={projectAnalytics.milestones.completionRate}
//                                                 suffix="%"
//                                                 prefix={<TrophyOutlined />}
//                                             />
//                                             <Progress 
//                                                 percent={projectAnalytics.milestones.completionRate}
//                                                 strokeColor={{
//                                                     '0%': '#108ee9',
//                                                     '100%': '#87d068',
//                                                 }}
//                                             />
//                                             <Row gutter={16}>
//                                                 <Col span={12}>
//                                                     <Statistic
//                                                         title="In Progress"
//                                                         value={projectAnalytics.milestones.inProgress}
//                                                         valueStyle={{ color: '#1890ff' }}
//                                                     />
//                                                 </Col>
//                                                 <Col span={12}>
//                                                     <Statistic
//                                                         title="Not Started"
//                                                         value={projectAnalytics.milestones.notStarted}
//                                                         valueStyle={{ color: '#faad14' }}
//                                                     />
//                                                 </Col>
//                                             </Row>
//                                         </Space>
//                                     </Card>
//                                 </Col>
//                             </Row>
//                         </TabPane>

//                         {/* Tasks Tab */}
//                         <TabPane tab={`Tasks (${projectAnalytics.tasks.total})`} key="tasks">
//                             <Row gutter={16}>
//                                 <Col span={12}>
//                                     <Card title="Task Priority Distribution">
//                                         <ResponsiveContainer width="100%" height={300}>
//                                             <BarChart data={taskPriorityData}>
//                                                 <CartesianGrid strokeDasharray="3 3" />
//                                                 <XAxis dataKey="name" />
//                                                 <YAxis />
//                                                 <RechartsTooltip />
//                                                 <Bar dataKey="value" fill="#8884d8">
//                                                     {taskPriorityData.map((entry, index) => (
//                                                         <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
//                                                     ))}
//                                                 </Bar>
//                                             </BarChart>
//                                         </ResponsiveContainer>
//                                     </Card>
//                                 </Col>
//                                 <Col span={12}>
//                                     <Card title="Task Statistics">
//                                         <Space direction="vertical" style={{ width: '100%' }} size="large">
//                                             <Row gutter={16}>
//                                                 <Col span={12}>
//                                                     <Statistic
//                                                         title="Completed"
//                                                         value={projectAnalytics.tasks.completed}
//                                                         prefix={<CheckCircleOutlined />}
//                                                         valueStyle={{ color: '#52c41a' }}
//                                                     />
//                                                 </Col>
//                                                 <Col span={12}>
//                                                     <Statistic
//                                                         title="In Progress"
//                                                         value={projectAnalytics.tasks.inProgress}
//                                                         prefix={<PlayCircleOutlined />}
//                                                         valueStyle={{ color: '#1890ff' }}
//                                                     />
//                                                 </Col>
//                                             </Row>
//                                             <Row gutter={16}>
//                                                 <Col span={12}>
//                                                     <Statistic
//                                                         title="Not Started"
//                                                         value={projectAnalytics.tasks.notStarted}
//                                                         valueStyle={{ color: '#faad14' }}
//                                                     />
//                                                 </Col>
//                                                 <Col span={12}>
//                                                     <Statistic
//                                                         title="Overdue"
//                                                         value={projectAnalytics.tasks.overdue}
//                                                         prefix={<WarningOutlined />}
//                                                         valueStyle={{ color: '#f5222d' }}
//                                                     />
//                                                 </Col>
//                                             </Row>
//                                             {projectAnalytics.tasks.averageCompletionTime > 0 && (
//                                                 <Statistic
//                                                     title="Avg. Completion Time"
//                                                     value={Math.round(projectAnalytics.tasks.averageCompletionTime / (1000 * 60 * 60 * 24))}
//                                                     suffix="days"
//                                                 />
//                                             )}
//                                         </Space>
//                                     </Card>
//                                 </Col>
//                             </Row>
//                         </TabPane>

//                         {/* Budget Tab */}
//                         {projectAnalytics.budget && (
//                             <TabPane tab="Budget" key="budget">
//                                 <Row gutter={16}>
//                                     <Col span={24}>
//                                         <Card 
//                                             title="Budget Overview"
//                                             extra={
//                                                 projectAnalytics.budget.isOverBudget && (
//                                                     <Tag color="red" icon={<WarningOutlined />}>
//                                                         Over Budget
//                                                     </Tag>
//                                                 )
//                                             }
//                                         >
//                                             <Row gutter={16}>
//                                                 <Col span={8}>
//                                                     <Statistic
//                                                         title="Allocated Budget"
//                                                         value={projectAnalytics.budget.allocated}
//                                                         prefix="XAF"
//                                                         precision={0}
//                                                     />
//                                                 </Col>
//                                                 <Col span={8}>
//                                                     <Statistic
//                                                         title="Spent"
//                                                         value={projectAnalytics.budget.spent}
//                                                         prefix="XAF"
//                                                         precision={0}
//                                                         valueStyle={{ 
//                                                             color: projectAnalytics.budget.isOverBudget ? '#f5222d' : '#52c41a'
//                                                         }}
//                                                     />
//                                                 </Col>
//                                                 <Col span={8}>
//                                                     <Statistic
//                                                         title="Remaining"
//                                                         value={projectAnalytics.budget.remaining}
//                                                         prefix="XAF"
//                                                         precision={0}
//                                                     />
//                                                 </Col>
//                                             </Row>
//                                             <Divider />
//                                             <Row gutter={16}>
//                                                 <Col span={12}>
//                                                     <Statistic
//                                                         title="Utilization Rate"
//                                                         value={projectAnalytics.budget.utilizationRate}
//                                                         suffix="%"
//                                                         precision={1}
//                                                     />
//                                                     <Progress
//                                                         percent={projectAnalytics.budget.utilizationRate}
//                                                         status={projectAnalytics.budget.isOverBudget ? 'exception' : 'active'}
//                                                         style={{ marginTop: 8 }}
//                                                     />
//                                                 </Col>
//                                                 <Col span={12}>
//                                                     <Statistic
//                                                         title="Daily Burn Rate"
//                                                         value={projectAnalytics.budget.burnRate}
//                                                         prefix="XAF"
//                                                         precision={0}
//                                                     />
//                                                     <Alert
//                                                         message={`Projected Total: XAF ${Math.round(projectAnalytics.budget.projectedTotal).toLocaleString()}`}
//                                                         type={projectAnalytics.budget.projectedTotal > projectAnalytics.budget.allocated ? 'warning' : 'info'}
//                                                         showIcon
//                                                         style={{ marginTop: 8 }}
//                                                     />
//                                                 </Col>
//                                             </Row>
//                                         </Card>
//                                     </Col>
//                                 </Row>
//                             </TabPane>
//                         )}

//                         {/* Risks Tab */}
//                         <TabPane 
//                             tab={
//                                 <Badge count={projectAnalytics.risks.total - projectAnalytics.risks.byStatus.closed}>
//                                     <span>Risks</span>
//                                 </Badge>
//                             } 
//                             key="risks"
//                         >
//                             <Card
//                                 title="Risk Management"
//                                 extra={
//                                     <Button
//                                         type="primary"
//                                         icon={<PlusOutlined />}
//                                         onClick={() => setRiskModalVisible(true)}
//                                     >
//                                         Add Risk
//                                     </Button>
//                                 }
//                             >
//                                 <Row gutter={16}>
//                                     <Col span={12}>
//                                         <Card size="small" title="Risk Status">
//                                             <Space direction="vertical" style={{ width: '100%' }}>
//                                                 <Row justify="space-between">
//                                                     <Text>Identified</Text>
//                                                     <Tag color="blue">{projectAnalytics.risks.byStatus.identified}</Tag>
//                                                 </Row>
//                                                 <Row justify="space-between">
//                                                     <Text>Analyzing</Text>
//                                                     <Tag color="cyan">{projectAnalytics.risks.byStatus.analyzing}</Tag>
//                                                 </Row>
//                                                 <Row justify="space-between">
//                                                     <Text>Mitigating</Text>
//                                                     <Tag color="orange">{projectAnalytics.risks.byStatus.mitigating}</Tag>
//                                                 </Row>
//                                                 <Row justify="space-between">
//                                                     <Text>Monitoring</Text>
//                                                     <Tag color="purple">{projectAnalytics.risks.byStatus.monitoring}</Tag>
//                                                 </Row>
//                                                 <Row justify="space-between">
//                                                     <Text>Closed</Text>
//                                                     <Tag color="green">{projectAnalytics.risks.byStatus.closed}</Tag>
//                                                 </Row>
//                                             </Space>
//                                         </Card>
//                                     </Col>
//                                     <Col span={12}>
//                                         <Card size="small" title="Risk Impact">
//                                             <Space direction="vertical" style={{ width: '100%' }}>
//                                                 <Row justify="space-between">
//                                                     <Text><Badge status="error" /> Very High</Text>
//                                                     <Tag color="red">{projectAnalytics.risks.byImpact.veryHigh}</Tag>
//                                                 </Row>
//                                                 <Row justify="space-between">
//                                                     <Text><Badge status="warning" /> High</Text>
//                                                     <Tag color="orange">{projectAnalytics.risks.byImpact.high}</Tag>
//                                                 </Row>
//                                                 <Row justify="space-between">
//                                                     <Text><Badge status="processing" /> Medium</Text>
//                                                     <Tag color="blue">{projectAnalytics.risks.byImpact.medium}</Tag>
//                                                 </Row>
//                                                 <Row justify="space-between">
//                                                     <Text><Badge status="success" /> Low</Text>
//                                                     <Tag color="green">{projectAnalytics.risks.byImpact.low}</Tag>
//                                                 </Row>
//                                                 <Row justify="space-between">
//                                                     <Text><Badge status="default" /> Very Low</Text>
//                                                     <Tag>{projectAnalytics.risks.byImpact.veryLow}</Tag>
//                                                 </Row>
//                                             </Space>
//                                         </Card>
//                                     </Col>
//                                 </Row>
//                             </Card>
//                         </TabPane>

//                         {/* Issues Tab */}
//                         <TabPane 
//                             tab={
//                                 <Badge count={projectAnalytics.issues.open}>
//                                     <span>Issues</span>
//                                 </Badge>
//                             } 
//                             key="issues"
//                         >
//                             <Card
//                                 title="Issue Tracking"
//                                 extra={
//                                     <Button
//                                         type="primary"
//                                         icon={<PlusOutlined />}
//                                         onClick={() => setIssueModalVisible(true)}
//                                     >
//                                         Report Issue
//                                     </Button>
//                                 }
//                             >
//                                 <Row gutter={16}>
//                                     <Col span={24}>
//                                         <Space direction="vertical" style={{ width: '100%' }} size="large">
//                                             <Row gutter={16}>
//                                                 <Col span={6}>
//                                                     <Statistic
//                                                         title="Open Issues"
//                                                         value={projectAnalytics.issues.open}
//                                                         prefix={<WarningOutlined />}
//                                                         valueStyle={{ color: '#f5222d' }}
//                                                     />
//                                                 </Col>
//                                                 <Col span={6}>
//                                                     <Statistic
//                                                         title="In Progress"
//                                                         value={projectAnalytics.issues.inProgress}
//                                                         valueStyle={{ color: '#1890ff' }}
//                                                     />
//                                                 </Col>
//                                                 <Col span={6}>
//                                                     <Statistic
//                                                         title="Resolved"
//                                                         value={projectAnalytics.issues.resolved}
//                                                         valueStyle={{ color: '#52c41a' }}
//                                                     />
//                                                 </Col>
//                                                 <Col span={6}>
//                                                     <Statistic
//                                                         title="Closed"
//                                                         value={projectAnalytics.issues.closed}
//                                                         valueStyle={{ color: '#8c8c8c' }}
//                                                     />
//                                                 </Col>
//                                             </Row>
//                                             <Card size="small" title="Issues by Severity">
//                                                 <Row gutter={16}>
//                                                     <Col span={6}>
//                                                         <Statistic
//                                                             title="Critical"
//                                                             value={projectAnalytics.issues.bySeverity.critical}
//                                                             valueStyle={{ color: '#f5222d' }}
//                                                         />
//                                                     </Col>
//                                                     <Col span={6}>
//                                                         <Statistic
//                                                             title="High"
//                                                             value={projectAnalytics.issues.bySeverity.high}
//                                                             valueStyle={{ color: '#fa8c16' }}
//                                                         />
//                                                     </Col>
//                                                     <Col span={6}>
//                                                         <Statistic
//                                                             title="Medium"
//                                                             value={projectAnalytics.issues.bySeverity.medium}
//                                                             valueStyle={{ color: '#1890ff' }}/>
//                                                     </Col>
//                                                     <Col span={6}>
//                                                         <Statistic
//                                                             title="Low"
//                                                             value={projectAnalytics.issues.bySeverity.low}
//                                                             valueStyle={{ color: '#52c41a' }}
//                                                         />
//                                                     </Col>
//                                                 </Row>
//                                             </Card>
//                                             {projectAnalytics.issues.averageResolutionTime > 0 && (
//                                                 <Alert
//                                                     message={`Average Resolution Time: ${Math.round(projectAnalytics.issues.averageResolutionTime / (1000 * 60 * 60 * 24))} days`}
//                                                     type="info"
//                                                     showIcon
//                                                 />
//                                             )}
//                                         </Space>
//                                     </Col>
//                                 </Row>
//                             </Card>
//                         </TabPane>

//                         {/* Change Requests Tab */}
//                         <TabPane 
//                             tab={
//                                 <Badge count={projectAnalytics.changeRequests.pending}>
//                                     <span>Change Requests</span>
//                                 </Badge>
//                             } 
//                             key="changes"
//                         >
//                             <Card
//                                 title="Change Management"
//                                 extra={
//                                     <Button
//                                         type="primary"
//                                         icon={<PlusOutlined />}
//                                         onClick={() => setChangeRequestModalVisible(true)}
//                                     >
//                                         Submit Change Request
//                                     </Button>
//                                 }
//                             >
//                                 <Row gutter={16}>
//                                     <Col span={8}>
//                                         <Statistic
//                                             title="Total Requests"
//                                             value={projectAnalytics.changeRequests.total}
//                                         />
//                                     </Col>
//                                     <Col span={8}>
//                                         <Statistic
//                                             title="Pending Approval"
//                                             value={projectAnalytics.changeRequests.pending}
//                                             valueStyle={{ color: '#faad14' }}
//                                         />
//                                     </Col>
//                                     <Col span={8}>
//                                         <Statistic
//                                             title="Approved"
//                                             value={projectAnalytics.changeRequests.approved}
//                                             valueStyle={{ color: '#52c41a' }}
//                                         />
//                                     </Col>
//                                 </Row>
//                             </Card>
//                         </TabPane>

//                         {/* Team Tab */}
//                         <TabPane tab={`Team (${projectAnalytics.team.totalMembers})`} key="team">
//                             <Card title="Team Composition">
//                                 <Row gutter={16}>
//                                     <Col span={12}>
//                                         <Statistic
//                                             title="Total Team Members"
//                                             value={projectAnalytics.team.totalMembers}
//                                             prefix={<TeamOutlined />}
//                                         />
//                                     </Col>
//                                     <Col span={12}>
//                                         <Card size="small" title="Roles Distribution">
//                                             <Space direction="vertical" style={{ width: '100%' }}>
//                                                 {Object.entries(projectAnalytics.team.byRole).map(([role, count]) => (
//                                                     <Row key={role} justify="space-between">
//                                                         <Text>{role}</Text>
//                                                         <Tag color="blue">{count}</Tag>
//                                                     </Row>
//                                                 ))}
//                                             </Space>
//                                         </Card>
//                                     </Col>
//                                 </Row>
//                             </Card>
//                         </TabPane>
//                     </Tabs>
//                 </Spin>
//             </Modal>
//         );
//     };

//     // Risk Modal Component
//     const RiskModal = () => (
//         <Modal
//             title={
//                 <Space>
//                     <ExclamationCircleOutlined />
//                     Add Project Risk
//                 </Space>
//             }
//             open={riskModalVisible}
//             onCancel={() => {
//                 setRiskModalVisible(false);
//                 riskForm.resetFields();
//             }}
//             footer={null}
//             width={800}
//         >
//             <Form
//                 form={riskForm}
//                 layout="vertical"
//                 onFinish={handleAddRisk}
//             >
//                 <Row gutter={16}>
//                     <Col span={24}>
//                         <Form.Item
//                             name="title"
//                             label="Risk Title"
//                             rules={[{ required: true, message: 'Please enter risk title' }]}
//                         >
//                             <Input placeholder="e.g., Resource shortage risk" />
//                         </Form.Item>
//                     </Col>
//                     <Col span={24}>
//                         <Form.Item
//                             name="description"
//                             label="Description"
//                             rules={[{ required: true, message: 'Please describe the risk' }]}
//                         >
//                             <TextArea rows={3} placeholder="Detailed description of the risk..." />
//                         </Form.Item>
//                     </Col>
//                     <Col span={8}>
//                         <Form.Item
//                             name="category"
//                             label="Category"
//                             rules={[{ required: true, message: 'Please select category' }]}
//                         >
//                             <Select placeholder="Select category">
//                                 <Option value="Technical">Technical</Option>
//                                 <Option value="Financial">Financial</Option>
//                                 <Option value="Resource">Resource</Option>
//                                 <Option value="Schedule">Schedule</Option>
//                                 <Option value="External">External</Option>
//                                 <Option value="Other">Other</Option>
//                             </Select>
//                         </Form.Item>
//                     </Col>
//                     <Col span={8}>
//                         <Form.Item
//                             name="probability"
//                             label="Probability"
//                             rules={[{ required: true, message: 'Please select probability' }]}
//                         >
//                             <Select placeholder="Select probability">
//                                 <Option value="Very Low">Very Low</Option>
//                                 <Option value="Low">Low</Option>
//                                 <Option value="Medium">Medium</Option>
//                                 <Option value="High">High</Option>
//                                 <Option value="Very High">Very High</Option>
//                             </Select>
//                         </Form.Item>
//                     </Col>
//                     <Col span={8}>
//                         <Form.Item
//                             name="impact"
//                             label="Impact"
//                             rules={[{ required: true, message: 'Please select impact' }]}
//                         >
//                             <Select placeholder="Select impact">
//                                 <Option value="Very Low">Very Low</Option>
//                                 <Option value="Low">Low</Option>
//                                 <Option value="Medium">Medium</Option>
//                                 <Option value="High">High</Option>
//                                 <Option value="Very High">Very High</Option>
//                             </Select>
//                         </Form.Item>
//                     </Col>
//                     <Col span={12}>
//                         <Form.Item
//                             name="mitigation"
//                             label="Mitigation Strategy"
//                             rules={[{ required: true, message: 'Please enter mitigation strategy' }]}
//                         >
//                             <TextArea rows={2} placeholder="How will this risk be mitigated?" />
//                         </Form.Item>
//                     </Col>
//                     <Col span={12}>
//                         <Form.Item
//                             name="contingency"
//                             label="Contingency Plan"
//                         >
//                             <TextArea rows={2} placeholder="What's the backup plan if risk occurs?" />
//                         </Form.Item>
//                     </Col>
//                 </Row>

//                 <Form.Item>
//                     <Space>
//                         <Button onClick={() => {
//                             setRiskModalVisible(false);
//                             riskForm.resetFields();
//                         }}>
//                             Cancel
//                         </Button>
//                         <Button type="primary" htmlType="submit" loading={loading}>
//                             Add Risk
//                         </Button>
//                     </Space>
//                 </Form.Item>
//             </Form>
//         </Modal>
//     );

//     // Issue Modal Component
//     const IssueModal = () => (
//         <Modal
//             title={
//                 <Space>
//                     <WarningOutlined />
//                     Report Project Issue
//                 </Space>
//             }
//             open={issueModalVisible}
//             onCancel={() => {
//                 setIssueModalVisible(false);
//                 issueForm.resetFields();
//             }}
//             footer={null}
//             width={700}
//         >
//             <Form
//                 form={issueForm}
//                 layout="vertical"
//                 onFinish={handleAddIssue}
//             >
//                 <Row gutter={16}>
//                     <Col span={24}>
//                         <Form.Item
//                             name="title"
//                             label="Issue Title"
//                             rules={[{ required: true, message: 'Please enter issue title' }]}
//                         >
//                             <Input placeholder="e.g., Equipment delay" />
//                         </Form.Item>
//                     </Col>
//                     <Col span={24}>
//                         <Form.Item
//                             name="description"
//                             label="Description"
//                             rules={[{ required: true, message: 'Please describe the issue' }]}
//                         >
//                             <TextArea rows={4} placeholder="Detailed description of the issue..." />
//                         </Form.Item>
//                     </Col>
//                     <Col span={12}>
//                         <Form.Item
//                             name="severity"
//                             label="Severity"
//                             rules={[{ required: true, message: 'Please select severity' }]}
//                         >
//                             <Select placeholder="Select severity">
//                                 <Option value="Low">🟢 Low</Option>
//                                 <Option value="Medium">🟡 Medium</Option>
//                                 <Option value="High">🟠 High</Option>
//                                 <Option value="Critical">🔴 Critical</Option>
//                             </Select>
//                         </Form.Item>
//                     </Col>
//                     <Col span={12}>
//                         <Form.Item
//                             name="assignedTo"
//                             label="Assign To"
//                             rules={[{ required: true, message: 'Please assign to someone' }]}
//                         >
//                             <Select
//                                 placeholder="Select team member"
//                                 showSearch
//                                 filterOption={(input, option) => {
//                                     const manager = projectManagers.find(m => m._id === option.value);
//                                     if (!manager) return false;
//                                     return (
//                                         (manager.fullName || manager.name || '').toLowerCase().includes(input.toLowerCase()) ||
//                                         (manager.department || '').toLowerCase().includes(input.toLowerCase())
//                                     );
//                                 }}
//                             >
//                                 {projectManagers.map(manager => (
//                                     <Option key={manager._id} value={manager._id}>
//                                         <div>
//                                             <Text strong>{manager.fullName || manager.name}</Text>
//                                             <br />
//                                             <Text type="secondary" style={{ fontSize: '12px' }}>
//                                                 {manager.role || 'Employee'} | {manager.department}
//                                             </Text>
//                                         </div>
//                                     </Option>
//                                 ))}
//                             </Select>
//                         </Form.Item>
//                     </Col>
//                 </Row>

//                 <Form.Item>
//                     <Space>
//                         <Button onClick={() => {
//                             setIssueModalVisible(false);
//                             issueForm.resetFields();
//                         }}>
//                             Cancel
//                         </Button>
//                         <Button type="primary" htmlType="submit" loading={loading}>
//                             Report Issue
//                         </Button>
//                     </Space>
//                 </Form.Item>
//             </Form>
//         </Modal>
//     );

//     // Change Request Modal Component
//     const ChangeRequestModal = () => (
//         <Modal
//             title={
//                 <Space>
//                     <SwapOutlined />
//                     Submit Change Request
//                 </Space>
//             }
//             open={changeRequestModalVisible}
//             onCancel={() => {
//                 setChangeRequestModalVisible(false);
//                 changeRequestForm.resetFields();
//             }}
//             footer={null}
//             width={800}
//         >
//             <Alert
//                 message="Important: Change Request Process"
//                 description="All change requests must be approved by the project manager before implementation. Consider the impact on schedule, budget, and resources."
//                 type="info"
//                 showIcon
//                 style={{ marginBottom: 16 }}
//             />
            
//             <Form
//                 form={changeRequestForm}
//                 layout="vertical"
//                 onFinish={handleAddChangeRequest}
//             >
//                 <Row gutter={16}>
//                     <Col span={24}>
//                         <Form.Item
//                             name="title"
//                             label="Change Title"
//                             rules={[{ required: true, message: 'Please enter change title' }]}
//                         >
//                             <Input placeholder="e.g., Extend project timeline by 2 weeks" />
//                         </Form.Item>
//                     </Col>
//                     <Col span={24}>
//                         <Form.Item
//                             name="description"
//                             label="Description"
//                             rules={[{ required: true, message: 'Please describe the change' }]}
//                         >
//                             <TextArea rows={3} placeholder="Detailed description of the proposed change..." />
//                         </Form.Item>
//                     </Col>
//                     <Col span={12}>
//                         <Form.Item
//                             name="type"
//                             label="Change Type"
//                             rules={[{ required: true, message: 'Please select type' }]}
//                         >
//                             <Select placeholder="Select type">
//                                 <Option value="Scope">Scope Change</Option>
//                                 <Option value="Schedule">Schedule Change</Option>
//                                 <Option value="Budget">Budget Change</Option>
//                                 <Option value="Resources">Resources Change</Option>
//                                 <Option value="Quality">Quality Change</Option>
//                                 <Option value="Other">Other</Option>
//                             </Select>
//                         </Form.Item>
//                     </Col>
//                     <Col span={12}>
//                         <Form.Item
//                             name="impact"
//                             label="Impact Level"
//                             rules={[{ required: true, message: 'Please describe impact' }]}
//                         >
//                             <Select placeholder="Select impact">
//                                 <Option value="Low - Minimal impact">Low - Minimal impact</Option>
//                                 <Option value="Medium - Moderate impact">Medium - Moderate impact</Option>
//                                 <Option value="High - Significant impact">High - Significant impact</Option>
//                                 <Option value="Critical - Major impact">Critical - Major impact</Option>
//                             </Select>
//                         </Form.Item>
//                     </Col>
//                     <Col span={24}>
//                         <Form.Item
//                             name="justification"
//                             label="Justification"
//                             rules={[{ required: true, message: 'Please justify the change' }]}
//                         >
//                             <TextArea rows={3} placeholder="Why is this change necessary? What are the benefits?" />
//                         </Form.Item>
//                     </Col>
//                 </Row>

//                 <Form.Item>
//                     <Space>
//                         <Button onClick={() => {
//                             setChangeRequestModalVisible(false);
//                             changeRequestForm.resetFields();
//                         }}>
//                             Cancel
//                         </Button>
//                         <Button type="primary" htmlType="submit" loading={loading}>
//                             Submit Change Request
//                         </Button>
//                     </Space>
//                 </Form.Item>
//             </Form>
//         </Modal>
//     );

//     // Meeting Modal Component
//     const MeetingModal = () => (
//         <Modal
//             title={
//                 <Space>
//                     <CalendarOutlined />
//                     Log Project Meeting
//                 </Space>
//             }
//             open={meetingModalVisible}
//             onCancel={() => {
//                 setMeetingModalVisible(false);
//                 meetingForm.resetFields();
//             }}
//             footer={null}
//             width={900}
//         >
//             <Form
//                 form={meetingForm}
//                 layout="vertical"
//                 onFinish={handleLogMeeting}
//             >
//                 <Row gutter={16}>
//                     <Col span={16}>
//                         <Form.Item
//                             name="title"
//                             label="Meeting Title"
//                             rules={[{ required: true, message: 'Please enter meeting title' }]}
//                         >
//                             <Input placeholder="e.g., Weekly Status Review" />
//                         </Form.Item>
//                     </Col>
//                     <Col span={8}>
//                         <Form.Item
//                             name="duration"
//                             label="Duration (minutes)"
//                             rules={[{ required: true, message: 'Please enter duration' }]}
//                         >
//                             <InputNumber min={15} max={480} style={{ width: '100%' }} placeholder="60" />
//                         </Form.Item>
//                     </Col>
//                     <Col span={12}>
//                         <Form.Item
//                             name="date"
//                             label="Meeting Date"
//                             rules={[{ required: true, message: 'Please select date' }]}
//                         >
//                             <DatePicker showTime style={{ width: '100%' }} />
//                         </Form.Item>
//                     </Col>
//                     <Col span={12}>
//                         <Form.Item
//                             name="attendees"
//                             label="Attendees"
//                             rules={[{ required: true, message: 'Please select attendees' }]}
//                         >
//                             <Select
//                                 mode="multiple"
//                                 placeholder="Select attendees"
//                                 showSearch
//                                 filterOption={(input, option) => {
//                                     const manager = projectManagers.find(m => m._id === option.value);
//                                     if (!manager) return false;
//                                     return (manager.fullName || manager.name || '').toLowerCase().includes(input.toLowerCase());
//                                 }}
//                             >
//                                 {projectManagers.map(manager => (
//                                     <Option key={manager._id} value={manager._id}>
//                                         {manager.fullName || manager.name}
//                                     </Option>
//                                 ))}
//                             </Select>
//                         </Form.Item>
//                     </Col>
//                     <Col span={24}>
//                         <Form.Item
//                             name="agenda"
//                             label="Agenda Items"
//                             rules={[{ required: true, message: 'Please enter agenda' }]}
//                         >
//                             <Select
//                                 mode="tags"
//                                 placeholder="Enter agenda items (press Enter after each)"
//                                 style={{ width: '100%' }}
//                             />
//                         </Form.Item>
//                     </Col>
//                     <Col span={24}>
//                         <Form.Item
//                             name="minutes"
//                             label="Meeting Minutes"
//                             rules={[{ required: true, message: 'Please enter meeting minutes' }]}
//                         >
//                             <TextArea rows={5} placeholder="Summary of what was discussed..." />
//                         </Form.Item>
//                     </Col>
//                 </Row>

//                 <Divider>Action Items from Meeting</Divider>

//                 <Form.List name="actionItems">
//                     {(fields, { add, remove }) => (
//                         <>
//                             {fields.map(({ key, name, ...restField }) => (
//                                 <Card key={key} size="small" style={{ marginBottom: 16 }}>
//                                     <Row gutter={16} align="middle">
//                                         <Col span={10}>
//                                             <Form.Item
//                                                 {...restField}
//                                                 name={[name, 'description']}
//                                                 label="Action Item"
//                                                 rules={[{ required: true, message: 'Required' }]}
//                                             >
//                                                 <Input placeholder="What needs to be done?" />
//                                             </Form.Item>
//                                         </Col>
//                                         <Col span={8}>
//                                             <Form.Item
//                                                 {...restField}
//                                                 name={[name, 'assignedTo']}
//                                                 label="Assigned To"
//                                                 rules={[{ required: true, message: 'Required' }]}
//                                             >
//                                                 <Select placeholder="Select person">
//                                                     {projectManagers.map(manager => (
//                                                         <Option key={manager._id} value={manager._id}>
//                                                             {manager.fullName || manager.name}
//                                                         </Option>
//                                                     ))}
//                                                 </Select>
//                                             </Form.Item>
//                                         </Col>
//                                         <Col span={4}>
//                                             <Form.Item
//                                                 {...restField}
//                                                 name={[name, 'dueDate']}
//                                                 label="Due Date"
//                                                 rules={[{ required: true, message: 'Required' }]}
//                                             >
//                                                 <DatePicker style={{ width: '100%' }} />
//                                             </Form.Item>
//                                         </Col>
//                                         <Col span={2} style={{ paddingTop: 30 }}>
//                                             <Button 
//                                                 type="link" 
//                                                 danger
//                                                 icon={<MinusCircleOutlined />}
//                                                 onClick={() => remove(name)}
//                                             />
//                                         </Col>
//                                     </Row>
//                                 </Card>
//                             ))}
//                             <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
//                                 Add Action Item
//                             </Button>
//                         </>
//                     )}
//                 </Form.List>

//                 <Form.Item style={{ marginTop: 16 }}>
//                     <Space>
//                         <Button onClick={() => {
//                             setMeetingModalVisible(false);
//                             meetingForm.resetFields();
//                         }}>
//                             Cancel
//                         </Button>
//                         <Button type="primary" htmlType="submit" loading={loading}>
//                             Log Meeting
//                         </Button>
//                     </Space>
//                 </Form.Item>
//             </Form>
//         </Modal>
//     );

//     return (
//         <div style={{ padding: '24px' }}>
//             <Card>
//                 <div style={{ 
//                     display: 'flex', 
//                     justifyContent: 'space-between', 
//                     alignItems: 'center',
//                     marginBottom: '24px'
//                 }}>
//                     <Title level={2} style={{ margin: 0 }}>
//                         <ProjectOutlined /> Project Management Portal
//                     </Title>
//                     <Space>
//                         <Button
//                             icon={<ReloadOutlined />}
//                             onClick={() => {
//                                 fetchProjects();
//                                 fetchStats();
//                                 fetchBudgetCodes();
//                             }}
//                             loading={loading}
//                         >
//                             Refresh
//                         </Button>
//                         <Button
//                             type="primary"
//                             icon={<PlusOutlined />}
//                             onClick={() => openProjectModal()}
//                         >
//                             Create Project
//                         </Button>
//                     </Space>
//                 </div>

//                 <Card size="small" style={{ marginBottom: '24px', backgroundColor: '#f0f8ff' }}>
//                     <Row gutter={16}>
//                         <Col span={6}>
//                             <Statistic
//                                 title="Total Projects"
//                                 value={stats.total}
//                                 prefix={<ProjectOutlined />}
//                                 valueStyle={{ color: '#1890ff' }}
//                             />
//                         </Col>
//                         <Col span={6}>
//                             <Statistic
//                                 title="Active Projects"
//                                 value={stats.active}
//                                 valueStyle={{ color: '#52c41a' }}
//                             />
//                         </Col>
//                         <Col span={6}>
//                             <Statistic
//                                 title="Completed"
//                                 value={stats.completed}
//                                 valueStyle={{ color: '#722ed1' }}
//                             />
//                         </Col>
//                         <Col span={6}>
//                             <Statistic
//                                 title="Overdue"
//                                 value={stats.overdue}
//                                 valueStyle={{ color: '#f5222d' }}
//                             />
//                         </Col>
//                     </Row>
//                 </Card>

//                 <Tabs activeKey={activeTab} onChange={setActiveTab} style={{ marginBottom: '16px' }}>
//                     <TabPane 
//                         tab={
//                             <Badge count={projects.filter(p => ['Planning', 'Approved', 'In Progress'].includes(p.status)).length} size="small">
//                                 <span>Active Projects</span>
//                             </Badge>
//                         } 
//                         key="active"
//                     />
//                     <TabPane 
//                         tab={
//                             <Badge count={projects.filter(p => p.status === 'Completed').length} size="small">
//                                 <span>Completed</span>
//                             </Badge>
//                         } 
//                         key="completed"
//                     />
//                     <TabPane 
//                         tab={
//                             <Badge count={stats.overdue} size="small">
//                                 <span>Overdue</span>
//                             </Badge>
//                         } 
//                         key="overdue"
//                     />
//                     <TabPane 
//                         tab={
//                             <Badge count={projects.length} size="small">
//                                 <span>All Projects</span>
//                             </Badge>
//                         } 
//                         key="all"
//                     />
//                 </Tabs>

//                 <Table
//                     columns={columns}
//                     dataSource={getFilteredProjects()}
//                     loading={loading}
//                     rowKey="_id"
//                     pagination={{
//                         showSizeChanger: true,
//                         showQuickJumper: true,
//                         showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} projects`,
//                     }}
//                     scroll={{ x: 1600 }}
//                     size="small"
//                 />
//             </Card>

//             {/* Create/Edit Project Modal */}
//             <Modal
//                 title={
//                     <Space>
//                         <ProjectOutlined />
//                         {editingProject ? 'Edit Project' : 'Create New Project'}
//                     </Space>
//                 }
//                 open={projectModalVisible}
//                 onCancel={() => {
//                     setProjectModalVisible(false);
//                     setEditingProject(null);
//                     form.resetFields();
//                 }}
//                 footer={null}
//                 width={1100}
//                 destroyOnClose
//             >
//                 <ProjectForm />
//             </Modal>

//             {/* Status Update Modal */}
//             <Modal
//                 title={
//                     <Space>
//                         <PlayCircleOutlined />
//                         Update Project Status
//                     </Space>
//                 }
//                 open={statusModalVisible}
//                 onCancel={() => {
//                     setStatusModalVisible(false);
//                     setSelectedProject(null);
//                     statusForm.resetFields();
//                 }}
//                 footer={null}
//                 width={600}
//             >
//                 {selectedProject && (
//                     <div>
//                         <Alert
//                             message="Project Status Workflow"
//                             description={
//                                 <div>
//                                     <Text>Planning → Approved → In Progress → Completed</Text>
//                                     <br />
//                                     <Text type="secondary" style={{ fontSize: '12px' }}>
//                                         Select the appropriate status based on project phase
//                                     </Text>
//                                 </div>
//                             }
//                             type="info"
//                             showIcon
//                             style={{ marginBottom: '16px' }}
//                         />

//                         <Card size="small" style={{ marginBottom: '16px', backgroundColor: '#fafafa' }}>
//                             <Text strong>Project: </Text>
//                             <Text>{selectedProject.name}</Text>
//                             <br />
//                             <Text strong>Current Status: </Text>
//                             <Tag color={getStatusColor(selectedProject.status)}>
//                                 {selectedProject.status}
//                             </Tag>
//                         </Card>

//                         <Form
//                             form={statusForm}
//                             layout="vertical"
//                             onFinish={handleUpdateStatus}
//                         >
//                             <Form.Item
//                                 name="status"
//                                 label="New Status"
//                                 rules={[{ required: true, message: 'Please select a status' }]}
//                             >
//                                 <Select
//                                     size="large"
//                                     placeholder="Select new status"
//                                 >
//                                     <Option value="Planning">
//                                         <Space>
//                                             <EditOutlined style={{ color: '#1890ff' }} />
//                                             Planning - Initial planning phase
//                                         </Space>
//                                     </Option>
//                                     <Option value="Approved">
//                                         <Space>
//                                             <CheckCircleOutlined style={{ color: '#52c41a' }} />
//                                             Approved - Ready to start
//                                         </Space>
//                                     </Option>
//                                     <Option value="In Progress">
//                                         <Space>
//                                             <PlayCircleOutlined style={{ color: '#faad14' }} />
//                                             In Progress - Active work ongoing
//                                         </Space>
//                                     </Option>
//                                     <Option value="On Hold">
//                                         <Space>
//                                             <PauseCircleOutlined style={{ color: '#722ed1' }} />
//                                             On Hold - Temporarily paused
//                                         </Space>
//                                     </Option>
//                                     <Option value="Completed">
//                                         <Space>
//                                             <CheckCircleOutlined style={{ color: '#52c41a' }} />
//                                             Completed - Project finished
//                                         </Space>
//                                     </Option>
//                                     <Option value="Cancelled">
//                                         <Space>
//                                             <StopOutlined style={{ color: '#f5222d' }} />
//                                             Cancelled - Project cancelled
//                                         </Space>
//                                     </Option>
//                                 </Select>
//                             </Form.Item>

//                             <Form.Item>
//                                 <Space>
//                                     <Button onClick={() => {
//                                         setStatusModalVisible(false);
//                                         setSelectedProject(null);
//                                         statusForm.resetFields();
//                                     }}>
//                                         Cancel
//                                     </Button>
//                                     <Button
//                                         type="primary"
//                                         htmlType="submit"
//                                         loading={loading}
//                                         icon={<PlayCircleOutlined />}
//                                     >
//                                         Update Status
//                                     </Button>
//                                 </Space>
//                             </Form.Item>
//                         </Form>
//                     </div>
//                 )}
//             </Modal>

//             {/* Project Details Modal */}
//             <Modal
//                 title={
//                     <Space>
//                         <ProjectOutlined />
//                         Project Details - {selectedProject?.name}
//                     </Space>
//                 }
//                 open={detailsModalVisible}
//                 onCancel={() => {
//                     setDetailsModalVisible(false);
//                     setSelectedProject(null);
//                 }}
//                 footer={
//                     <Space>
//                         <Button onClick={() => setDetailsModalVisible(false)}>
//                             Close
//                         </Button>
//                         <Button 
//                             type="primary" 
//                             onClick={() => {
//                                 setDetailsModalVisible(false);
//                                 openProjectModal(selectedProject);
//                             }}
//                         >
//                             Edit Project
//                         </Button>
//                     </Space>
//                 }
//                 width={1200}
//             >
//                 {selectedProject ? (
//                     <div>
//                         <Descriptions bordered column={2} size="small" style={{ marginBottom: '20px' }}>
//                             <Descriptions.Item label="Project Name" span={2}>
//                                 <Text strong>{selectedProject.name}</Text>
//                             </Descriptions.Item>
//                             <Descriptions.Item label="Type">
//                                 <Tag color="blue">{selectedProject.projectType}</Tag>
//                             </Descriptions.Item>
//                             <Descriptions.Item label="Priority">
//                                 <Tag color={getPriorityColor(selectedProject.priority)}>
//                                     {selectedProject.priority}
//                                 </Tag>
//                             </Descriptions.Item>
//                             <Descriptions.Item label="Status">
//                                 <Tag color={getStatusColor(selectedProject.status)}>
//                                     {selectedProject.status}
//                                 </Tag>
//                             </Descriptions.Item>
//                             <Descriptions.Item label="Department">
//                                 <Tag color="green">{selectedProject.department}</Tag>
//                             </Descriptions.Item>
//                             <Descriptions.Item label="Project Manager">
//                                 <Avatar size="small" icon={<UserOutlined />} style={{ marginRight: 8 }} />
//                                 {selectedProject.projectManager?.fullName || 'N/A'}
//                             </Descriptions.Item>
//                             <Descriptions.Item label="Overall Progress">
//                                 <Progress percent={selectedProject.progress || 0} size="small" />
//                             </Descriptions.Item>
//                         </Descriptions>

//                         <Card size="small" title="Project Description" style={{ marginBottom: '20px' }}>
//                             <Paragraph>{selectedProject.description}</Paragraph>
//                         </Card>

//                         <Card size="small" title="Milestones & Assigned Supervisors" style={{ marginBottom: '20px' }}>
//                             {selectedProject.milestones && selectedProject.milestones.length > 0 ? (
//                                 <Table
//                                     columns={[
//                                         {
//                                             title: 'Milestone',
//                                             dataIndex: 'title',
//                                             key: 'title',
//                                             render: (text, record) => (
//                                                 <div>
//                                                     <Text strong>{text}</Text>
//                                                     <br />
//                                                     <Text type="secondary" style={{ fontSize: '12px' }}>
//                                                         {record.description}
//                                                     </Text>
//                                                 </div>
//                                             )
//                                         },
//                                         {
//                                             title: 'Weight',
//                                             dataIndex: 'weight',
//                                             key: 'weight',
//                                             width: 80,
//                                             render: (weight) => (
//                                                 <Tag color="blue">{weight}%</Tag>
//                                             )
//                                         },
//                                         {
//                                             title: 'Assigned Supervisor',
//                                             dataIndex: 'assignedSupervisor',
//                                             key: 'assignedSupervisor',
//                                             render: (supervisor) => supervisor ? (
//                                                 <div>
//                                                     <Avatar size="small" icon={<UserOutlined />} style={{ marginRight: 8 }} />
//                                                     <Text>{supervisor.fullName || supervisor.name}</Text>
//                                                     <br />
//                                                     <Text type="secondary" style={{ fontSize: '12px' }}>
//                                                         {supervisor.department}
//                                                     </Text>
//                                                 </div>
//                                             ) : 'Not Assigned'
//                                         },
//                                         {
//                                             title: 'Progress',
//                                             dataIndex: 'progress',
//                                             key: 'progress',
//                                             width: 150,
//                                             render: (progress) => (
//                                                 <Progress percent={progress || 0} size="small" />
//                                             )
//                                         },
//                                         {
//                                             title: 'Status',
//                                             dataIndex: 'status',
//                                             key: 'status',
//                                             width: 120,
//                                             render: (status) => (
//                                                 <Tag color={
//                                                     status === 'Completed' ? 'green' :
//                                                     status === 'In Progress' ? 'blue' :
//                                                     'default'
//                                                 }>
//                                                     {status}
//                                                 </Tag>
//                                             )
//                                         },
//                                         {
//                                             title: 'Due Date',
//                                             dataIndex: 'dueDate',
//                                             key: 'dueDate',
//                                             width: 120,
//                                             render: (date) => date ? moment(date).format('MMM DD, YYYY') : 'N/A'
//                                         }
//                                     ]}
//                                     dataSource={selectedProject.milestones}
//                                     rowKey="_id"
//                                     pagination={false}
//                                     size="small"
//                                 />
//                             ) : (
//                                 <Alert message="No milestones defined for this project" type="info" showIcon />
//                             )}
//                         </Card>

//                         <Row gutter={16}>
//                             <Col span={12}>
//                                 <Card size="small" title="Timeline Information">
//                                     <Descriptions column={1} size="small">
//                                         <Descriptions.Item label="Start Date">
//                                             {selectedProject.timeline?.startDate ? 
//                                                 moment(selectedProject.timeline.startDate).format('MMM DD, YYYY') : 'N/A'}
//                                         </Descriptions.Item>
//                                         <Descriptions.Item label="End Date">
//                                             {selectedProject.timeline?.endDate ? 
//                                                 moment(selectedProject.timeline.endDate).format('MMM DD, YYYY') : 'N/A'}
//                                         </Descriptions.Item>
//                                         <Descriptions.Item label="Days Remaining">
//                                             <Text style={{
//                                                 color: selectedProject.timeline?.endDate && moment(selectedProject.timeline.endDate).diff(moment(), 'days') < 0 ? '#f5222d' : '#52c41a'
//                                             }}>
//                                                 {selectedProject.timeline?.endDate ? 
//                                                     moment(selectedProject.timeline.endDate).diff(moment(), 'days') : 'N/A'} days
//                                             </Text>
//                                         </Descriptions.Item>
//                                     </Descriptions>
//                                 </Card>
//                             </Col>
//                             <Col span={12}>
//                                 <Card size="small" title="Budget Information">
//                                     {selectedProject.budgetCode ? (
//                                         <Descriptions column={1} size="small">
//                                             <Descriptions.Item label="Budget Code">
//                                                 <Tag color="blue">
//                                                     {selectedProject.budgetCode.code}
//                                                 </Tag>
//                                             </Descriptions.Item>
//                                             <Descriptions.Item label="Budget Name">
//                                                 {selectedProject.budgetCode.name}
//                                             </Descriptions.Item>
//                                             <Descriptions.Item label="Available Funds">
//                                                 XAF {(selectedProject.budgetCode.available || 0).toLocaleString()}
//                                             </Descriptions.Item>
//                                         </Descriptions>
//                                     ) : (
//                                         <Alert message="No budget code assigned to this project" type="warning" showIcon />
//                                     )}
//                                 </Card>
//                             </Col>
//                         </Row>
//                     </div>
//                 ) : (
//                     <Spin size="large" />
//                 )}
//             </Modal>

//             {/* Analytics Modal */}
//             <AnalyticsModal />

//             {/* Risk Modal */}
//             <RiskModal />

//             {/* Issue Modal */}
//             <IssueModal />

//             {/* Change Request Modal */}
//             <ChangeRequestModal />

//             {/* Meeting Modal */}
//             <MeetingModal />
//         </div>
//     );
// };

// export default EnhancedProjectManagement;









