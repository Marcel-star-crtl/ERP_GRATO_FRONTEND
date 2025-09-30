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
    Timeline,
    Row,
    Col,
    Statistic,
    Divider,
    Tooltip,
    Tabs,
    DatePicker,
    Progress,
    Avatar,
    List
} from 'antd';
import {
    ProjectOutlined,
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    EyeOutlined,
    CheckCircleOutlined,
    ExclamationCircleOutlined,
    UserOutlined,
    ReloadOutlined,
    BulbOutlined,
    WarningOutlined,
    PlayCircleOutlined,
    PauseCircleOutlined,
    StopOutlined,
    ClockCircleOutlined,
    BankOutlined,
    DollarOutlined,
    BarChartOutlined
} from '@ant-design/icons';
import moment from 'moment';
import { projectAPI } from '../../services/projectAPI';
import { getAllEmployees } from '../../utils/departmentStructure';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const { TabPane } = Tabs;
const { RangePicker } = DatePicker;

const EnhancedProjectManagement = () => {
    // State declarations
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(false);
    const [projectModalVisible, setProjectModalVisible] = useState(false);
    const [detailsModalVisible, setDetailsModalVisible] = useState(false);
    const [selectedProject, setSelectedProject] = useState(null);
    const [activeTab, setActiveTab] = useState('active');
    const [editingProject, setEditingProject] = useState(null);
    const [stats, setStats] = useState({
        total: 0,
        active: 0,
        completed: 0,
        overdue: 0,
        totalBudget: 0,
        budgetUtilization: 0
    });
    const [form] = Form.useForm();
    const [projectManagers, setProjectManagers] = useState([]);
    const [projectManagersLoading, setProjectManagersLoading] = useState(false);
    const [projectMetadata, setProjectMetadata] = useState({
        projectTypes: [],
        departments: [],
        priorities: []
    });
    const [budgetCodes, setBudgetCodes] = useState([]);
    const [loadingBudgetCodes, setLoadingBudgetCodes] = useState(false);

    // useEffect hooks
    useEffect(() => {
        fetchProjects();
        fetchStats();
        fetchProjectManagers();
        fetchProjectMetadata();
        fetchBudgetCodes();
    }, []);

    // API fetch functions
    const fetchProjects = async (filters = {}) => {
        try {
            setLoading(true);
            const result = await projectAPI.getProjects(filters);
            
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
                setStats({
                    total: data.summary?.total || 0,
                    active: data.summary?.active || 0,
                    completed: data.summary?.completed || 0,
                    overdue: data.summary?.overdue || 0,
                    totalBudget: data.budget?.totalAllocated || 0,
                    budgetUtilization: data.budget?.utilization || 0
                });
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
            message.error('Failed to fetch project statistics');
        }
    };

    const fetchProjectManagers = async () => {
        try {
            setProjectManagersLoading(true);
            
            console.log('Loading active users from database...');
            
            // Try to get actual database users first
            try {
                const response = await fetch('http://localhost:5001/api/auth/active-users', {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    const result = await response.json();
                    if (result.success && result.data && result.data.length > 0) {
                        console.log(`Successfully loaded ${result.data.length} users from database`);
                        setProjectManagers(result.data);
                        return;
                    }
                }
                
                console.log('Database users not available, falling back to department structure');
            } catch (error) {
                console.log('Error fetching database users, using fallback:', error);
            }
            
            // Fallback to department structure if database users are not available
            console.log('Loading all employees from local department structure...');
            
            // Get all employees from the local department structure
            const allEmployees = getAllEmployees();
            
            // Format employees to match the expected structure
            const formattedEmployees = allEmployees
                .filter(employee => employee.name && employee.email) // Only include valid employees
                .map((employee, index) => ({
                    _id: `emp_${index}_${employee.email}`, // Create unique _id for Select component
                    id: employee.email, // Keep id as email for compatibility
                    fullName: employee.name,
                    name: employee.name,
                    email: employee.email,
                    position: employee.position,
                    department: employee.department,
                    role: employee.role,
                    isActive: true
                }))
                .sort((a, b) => a.fullName.localeCompare(b.fullName));
            
            console.log(`Successfully loaded ${formattedEmployees.length} employees from department structure`);
            console.log('⚠️ Note: These are local employees. For production, ensure users are registered in the database.');
            setProjectManagers(formattedEmployees);
            
        } catch (error) {
            console.error('Error loading project managers:', error);
            setProjectManagers([]);
        } finally {
            setProjectManagersLoading(false);
        }
    };

    const fetchProjectMetadata = async () => {
        try {
            const result = await projectAPI.getProjectMetadata();
            if (result.success) {
                setProjectMetadata(result.data);
            }
        } catch (error) {
            console.error('Error fetching project metadata:', error);
        }
    };

    const fetchBudgetCodes = async () => {
        try {
            setLoadingBudgetCodes(true);
            const result = await projectAPI.getAvailableBudgetCodes();
            
            if (result.success) {
                setBudgetCodes(result.data || []);
                console.log(`Loaded ${result.data?.length || 0} budget codes for project management`);
            } else {
                console.warn('Failed to fetch budget codes:', result.message);
                setBudgetCodes([]);
            }
        } catch (error) {
            console.error('Error fetching budget codes:', error);
            setBudgetCodes([]);
        } finally {
            setLoadingBudgetCodes(false);
        }
    };

    // Handler functions
    const handleCreateProject = async (values) => {
        try {
            setLoading(true);
            
            console.log('Form values before transformation:', values);
            
            // Validate required fields with specific error messages
            if (!values.name) {
                message.error('Please enter project name');
                return;
            }
            if (!values.description) {
                message.error('Please enter project description');
                return;
            }
            if (!values.projectType) {
                message.error('Please select project type');
                return;
            }
            if (!values.priority) {
                message.error('Please select project priority');
                return;
            }
            if (!values.department) {
                message.error('Please select department');
                return;
            }
            if (!values.projectManager) {
                message.error('Please select project manager');
                return;
            }
            if (!values.timeline || values.timeline.length !== 2) {
                message.error('Please select both start and end dates');
                return;
            }
            
            // Validate project manager exists
            const selectedManager = projectManagers.find(pm => pm._id === values.projectManager);
            if (!selectedManager) {
                message.error('Selected project manager is no longer available. Please refresh and try again.');
                return;
            }
            
            // Validate timeline dates
            const startDate = values.timeline[0];
            const endDate = values.timeline[1];
            if (endDate.isBefore(startDate)) {
                message.error('End date must be after start date');
                return;
            }
            
            // Validate budget code if selected
            if (values.budgetCodeId) {
                const selectedBudgetCode = budgetCodes.find(bc => bc._id === values.budgetCodeId);
                if (!selectedBudgetCode) {
                    message.warning('Selected budget code is no longer available. Continuing without budget code.');
                    values.budgetCodeId = null;
                }
            }
            
            // Transform form data to match backend schema
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
                milestones: values.milestones?.map(milestone => ({
                    title: milestone.title,
                    dueDate: milestone.dueDate ? milestone.dueDate.format('YYYY-MM-DD') : null,
                    status: 'Pending'
                })) || []
            };

            console.log('Transformed project data:', projectData);

            const result = await projectAPI.createProject(projectData);
            
            if (result.success) {
                message.success(`Project "${values.name}" created successfully!`);
                setProjectModalVisible(false);
                form.resetFields();
                
                // Refresh data to show new project
                await Promise.all([
                    fetchProjects(),
                    fetchStats(),
                    fetchBudgetCodes()
                ]);
            } else {
                // Handle specific API error messages
                const errorMessage = result.message || result.error || 'Failed to create project';
                
                if (errorMessage.includes('duplicate') || errorMessage.includes('already exists')) {
                    message.error('A project with this name already exists. Please choose a different name.');
                } else if (errorMessage.includes('budget')) {
                    message.error('Budget-related error: ' + errorMessage);
                } else if (errorMessage.includes('manager')) {
                    message.error('Project manager error: ' + errorMessage);
                } else if (errorMessage.includes('permission') || errorMessage.includes('unauthorized')) {
                    message.error('You do not have permission to create projects. Please contact your administrator.');
                } else {
                    message.error(`Failed to create project: ${errorMessage}`);
                }
            }
        } catch (error) {
            console.error('Error creating project:', error);
            
            // Handle network and other errors
            if (error.response) {
                const status = error.response.status;
                const errorData = error.response.data;
                
                if (status === 403) {
                    message.error('You do not have permission to create projects. Please contact your administrator.');
                } else if (status === 400) {
                    message.error('Invalid project data: ' + (errorData?.message || 'Please check your inputs.'));
                } else if (status === 500) {
                    message.error('Server error occurred. Please try again later or contact support.');
                } else {
                    message.error(`Error ${status}: ${errorData?.message || 'Failed to create project'}`);
                }
            } else if (error.request) {
                message.error('Network error: Unable to connect to server. Please check your connection.');
            } else {
                message.error('An unexpected error occurred: ' + error.message);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateProject = async (values) => {
        try {
            setLoading(true);
            
            // Validate required fields
            if (!values.name || !values.description || !values.projectType || !values.priority || 
                !values.department || !values.projectManager || !values.timeline) {
                message.error('Please fill in all required fields');
                return;
            }

            // Validate timeline
            if (!values.timeline || values.timeline.length !== 2) {
                message.error('Please select both start and end dates');
                return;
            }

            // Validate budget code if selected (no longer validates budget allocation)
            if (values.budgetCodeId && values.budgetCodeId !== editingProject?.budgetCode?._id) {
                const selectedBudgetCode = budgetCodes.find(bc => bc._id === values.budgetCodeId);
                if (!selectedBudgetCode) {
                    message.warning('Selected budget code is no longer available');
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
                milestones: values.milestones?.map(milestone => ({
                    title: milestone.title,
                    dueDate: milestone.dueDate ? milestone.dueDate.format('YYYY-MM-DD') : null,
                    status: milestone.status || 'Pending'
                })) || []
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

    const handleUpdateStatus = async (projectId, newStatus) => {
        try {
            setLoading(true);
            
            const result = await projectAPI.updateProjectStatus(projectId, { 
                status: newStatus 
            });
            
            if (result.success) {
                message.success(`Project status updated to ${newStatus}`);
                fetchProjects();
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

    // Utility functions
    const openProjectModal = (project = null) => {
        setEditingProject(project);
        if (project) {
            form.setFieldsValue({
                name: project.name,
                description: project.description,
                projectType: project.projectType,
                priority: project.priority,
                department: project.department,
                projectManager: project.projectManager?._id,
                budgetCodeId: project.budgetCode?._id,
                timeline: [
                    moment(project.timeline?.startDate),
                    moment(project.timeline?.endDate)
                ],
                milestones: project.milestones?.map(milestone => ({
                    title: milestone.title,
                    dueDate: milestone.dueDate ? moment(milestone.dueDate) : null
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

    const getBudgetCodeStatusColor = (budgetCode) => {
        if (!budgetCode) return 'default';
        const utilizationRate = budgetCode.utilizationRate || 0;
        if (utilizationRate >= 90) return 'red';
        if (utilizationRate >= 75) return 'orange';
        if (utilizationRate >= 50) return 'blue';
        return 'green';
    };

    const getFilteredProjects = () => {
        switch (activeTab) {
            case 'active':
                return projects.filter(p => ['Planning', 'Approved', 'In Progress'].includes(p.status));
            case 'completed':
                return projects.filter(p => p.status === 'Completed');
            case 'overdue':
                return projects.filter(p => {
                    if (p.status === 'Completed') return false;
                    return moment(p.timeline?.endDate).isBefore(moment());
                });
            default:
                return projects;
        }
    };

    // Table columns configuration
    const columns = [
        {
            title: 'Project Details',
            key: 'details',
            render: (_, record) => (
                <div>
                    <Text strong>{record.name}</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                        {record.code}
                    </Text>
                    <br />
                    <Tag size="small" color="blue">{record.projectType}</Tag>
                    <Tag size="small" color={getPriorityColor(record.priority)}>
                        {record.priority}
                    </Tag>
                    {record.budgetCode && (
                        <Tag size="small" color={getBudgetCodeStatusColor(record.budgetCode)} icon={<BankOutlined />}>
                            {record.budgetCode.code}
                        </Tag>
                    )}
                </div>
            ),
            width: 280
        },
        {
            title: 'Project Manager',
            key: 'manager',
            render: (_, record) => (
                <div>
                    <Avatar size="small" icon={<UserOutlined />} style={{ marginRight: 8 }} />
                    <Text strong>{record.projectManager?.fullName}</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                        {record.department}
                    </Text>
                </div>
            ),
            width: 180
        },
        {
            title: 'Budget & Code',
            key: 'budget',
            render: (_, record) => {
                const budget = record.budget || { allocated: 0, spent: 0 };
                const utilization = budget.allocated > 0 ? 
                    Math.round((budget.spent / budget.allocated) * 100) : 0;
                return (
                    <div>
                        <Text strong style={{ color: '#1890ff' }}>
                            XAF {budget.allocated?.toLocaleString() || 0}
                        </Text>
                        <br />
                        <Progress 
                            percent={utilization} 
                            size="small" 
                            status={utilization > 90 ? 'exception' : 'active'}
                        />
                        {record.budgetCode && (
                            <>
                                <br />
                                <Text type="secondary" style={{ fontSize: '11px' }}>
                                    Code: {record.budgetCode.code}
                                </Text>
                                <br />
                                <Text type="secondary" style={{ fontSize: '11px' }}>
                                    Available: XAF {(record.budgetCode.budget - record.budgetCode.used).toLocaleString()}
                                </Text>
                            </>
                        )}
                        {!record.budgetCode && (
                            <>
                                <br />
                                <Text type="warning" style={{ fontSize: '11px' }}>
                                    No Budget Code
                                </Text>
                            </>
                        )}
                    </div>
                );
            },
            width: 170
        },
        {
            title: 'Progress',
            key: 'progress',
            render: (_, record) => {
                const progress = record.progress || { percentage: 0 };
                return (
                    <div>
                        <Progress 
                            percent={progress.percentage} 
                            size="small"
                            status={progress.percentage === 100 ? 'success' : 'active'}
                        />
                        <Text type="secondary" style={{ fontSize: '11px' }}>
                            {record.team?.length || 0} team members
                        </Text>
                    </div>
                );
            },
            width: 120
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
                        {!isOverdue && record.status !== 'Completed' && timeline.endDate && (
                            <Text type="secondary" style={{ fontSize: '11px' }}>
                                {moment(timeline.endDate).diff(moment(), 'days')} days left
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
                <Tag color={getStatusColor(status)} icon={
                    status === 'In Progress' ? <PlayCircleOutlined /> :
                    status === 'Completed' ? <CheckCircleOutlined /> :
                    status === 'On Hold' ? <PauseCircleOutlined /> :
                    status === 'Cancelled' ? <StopOutlined /> :
                    <ClockCircleOutlined />
                }>
                    {status}
                </Tag>
            ),
            width: 120
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => (
                <Space size="small">
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
                    <Tooltip title="Edit Project">
                        <Button
                            size="small"
                            icon={<EditOutlined />}
                            onClick={() => openProjectModal(record)}
                        />
                    </Tooltip>
                    <Tooltip title="Update Status">
                        <Select
                            size="small"
                            value={record.status}
                            style={{ width: 120 }}
                            onChange={(value) => handleUpdateStatus(record._id, value)}
                            dropdownMatchSelectWidth={false}
                        >
                            <Option value="Planning">Planning</Option>
                            <Option value="Approved">Approved</Option>
                            <Option value="In Progress">In Progress</Option>
                            <Option value="On Hold">On Hold</Option>
                            <Option value="Completed">Completed</Option>
                            <Option value="Cancelled">Cancelled</Option>
                        </Select>
                    </Tooltip>
                </Space>
            ),
            width: 220,
            fixed: 'right'
        }
    ];

    // Form component for Create/Edit Project Modal
    const ProjectForm = () => (
        <Form
            form={form}
            layout="vertical"
            onFinish={editingProject ? handleUpdateProject : handleCreateProject}
        >
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
                            <Option value="Infrastructure">Infrastructure</Option>
                            <Option value="IT Implementation">IT Implementation</Option>
                            <Option value="Process Improvement">Process Improvement</Option>
                            <Option value="Product Development">Product Development</Option>
                            <Option value="Marketing Campaign">Marketing Campaign</Option>
                            <Option value="Training Program">Training Program</Option>
                            <Option value="Facility Upgrade">Facility Upgrade</Option>
                            <Option value="Equipment Installation">Equipment Installation</Option>
                            <Option value="System Integration">System Integration</Option>
                            <Option value="Research & Development">Research & Development</Option>
                            <Option value="Maintenance">Maintenance</Option>
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
                            <Option value="Operations">Operations</Option>
                            <Option value="IT">IT Department</Option>
                            <Option value="Finance">Finance</Option>
                            <Option value="HR">Human Resources</Option>
                            <Option value="Marketing">Marketing</Option>
                            <Option value="Supply Chain">Supply Chain</Option>
                            <Option value="Facilities">Facilities</Option>
                        </Select>
                    </Form.Item>
                </Col>
                <Col span={8}>
                    <Form.Item
                        name="projectManager"
                        label="Project Manager"
                        rules={[{ required: true, message: 'Please select project manager' }]}
                        help={projectManagers.length > 0 && projectManagers[0]._id?.startsWith('emp_') 
                            ? "⚠️ Using local employee data. Contact admin to register users in database for production use." 
                            : "Select any active employee to be the project manager"
                        }
                    >
                        <Select
                            placeholder={projectManagersLoading ? "Loading employees..." : "Select project manager"}
                            showSearch
                            loading={projectManagersLoading}
                            filterOption={(input, option) => {
                                const manager = projectManagers.find(m => m._id === option.value);
                                if (!manager) return false;
                                return (
                                    (manager.fullName || manager.name || '').toLowerCase().includes(input.toLowerCase()) ||
                                    (manager.role || '').toLowerCase().includes(input.toLowerCase()) ||
                                    (manager.department && manager.department.toLowerCase().includes(input.toLowerCase())) ||
                                    (manager.email && manager.email.toLowerCase().includes(input.toLowerCase()))
                                );
                            }}
                            notFoundContent={projectManagersLoading ? <Spin size="small" /> : "No employees found"}
                        >
                            {projectManagers.map(manager => {
                                // Define role display mapping with more inclusive roles
                                const roleDisplayMap = {
                                    'admin': '👑 Administrator',
                                    'supervisor': '👔 Supervisor', 
                                    'manager': '📊 Manager',
                                    'team_lead': '🎯 Team Lead',
                                    'supply_chain': '📦 Supply Chain',
                                    'finance': '💰 Finance',
                                    'hr': '👥 HR',
                                    'employee': '👤 Employee',
                                    'analyst': '📈 Analyst',
                                    'coordinator': '🔗 Coordinator',
                                    'specialist': '🔧 Specialist',
                                    'assistant': '🤝 Assistant'
                                };
                                
                                const roleDisplay = roleDisplayMap[manager.role] || `� ${manager.role || 'Employee'}`;
                                
                                return (
                                    <Option key={manager._id} value={manager._id}>
                                        <div>
                                            <Text strong>{manager.fullName || manager.name || 'Unknown Name'}</Text>
                                            <br />
                                            <Text type="secondary" style={{ fontSize: '12px' }}>
                                                {roleDisplay} {manager.department ? `| ${manager.department}` : ''}
                                            </Text>
                                            {manager.email && (
                                                <>
                                                    <br />
                                                    <Text type="secondary" style={{ fontSize: '11px' }}>
                                                        {manager.email}
                                                    </Text>
                                                </>
                                            )}
                                        </div>
                                    </Option>
                                );
                            })}
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
                    placeholder="Detailed description of the project objectives, scope, and expected outcomes..."
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
                help="Select a budget code to track and manage project expenses"
            >
                <Select
                    placeholder="Select budget code (optional)"
                    allowClear
                    loading={loadingBudgetCodes}
                    showSearch
                    filterOption={(input, option) => {
                        const budgetCode = budgetCodes.find(bc => bc._id === option.value);
                        return budgetCode && (
                            budgetCode.code.toLowerCase().includes(input.toLowerCase()) ||
                            budgetCode.name.toLowerCase().includes(input.toLowerCase())
                        );
                    }}
                >
                    {budgetCodes.map(budgetCode => (
                        <Option 
                            key={budgetCode._id} 
                            value={budgetCode._id}
                            disabled={budgetCode.status === 'critical'}
                        >
                            <div>
                                <Text strong>{budgetCode.code}</Text> - {budgetCode.name}
                                <br />
                                <Text type="secondary" style={{ fontSize: '12px' }}>
                                    Available: XAF {budgetCode.available.toLocaleString()} 
                                    ({budgetCode.utilizationRate}% used) | 
                                    {budgetCode.budgetType} | {budgetCode.department}
                                </Text>
                                {budgetCode.status === 'critical' && (
                                    <Tag size="small" color="red" style={{ marginLeft: 8 }}>
                                        Critical Usage
                                    </Tag>
                                )}
                                {budgetCode.status === 'high' && (
                                    <Tag size="small" color="orange" style={{ marginLeft: 8 }}>
                                        High Usage
                                    </Tag>
                                )}
                            </div>
                        </Option>
                    ))}
                </Select>
            </Form.Item>

            {form.getFieldValue('budgetCodeId') && (
                <Alert
                    message="Budget Code Information"
                    description={(() => {
                        const selectedBudgetCode = budgetCodes.find(bc => bc._id === form.getFieldValue('budgetCodeId'));
                        return selectedBudgetCode ? (
                            <div>
                                <Descriptions column={2} size="small" style={{ marginTop: '8px' }}>
                                    <Descriptions.Item label="Budget Code">
                                        {selectedBudgetCode.code} - {selectedBudgetCode.name}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Department">
                                        {selectedBudgetCode.department}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Total Budget">
                                        XAF {selectedBudgetCode.totalBudget.toLocaleString()}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Available">
                                        XAF {selectedBudgetCode.available.toLocaleString()}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Utilization">
                                        {selectedBudgetCode.utilizationRate}%
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Budget Type">
                                        {selectedBudgetCode.budgetType}
                                    </Descriptions.Item>
                                </Descriptions>
                                <div style={{ marginTop: '8px' }}>
                                    <Text type="success">
                                        <CheckCircleOutlined /> Budget code selected - Project expenses will be tracked under this budget
                                    </Text>
                                </div>
                            </div>
                        ) : null;
                    })()}
                    type="info"
                    showIcon
                    style={{ marginBottom: '16px' }}
                />
            )}

            <Form.Item label="Project Milestones (Optional)">
                <Form.List name="milestones">
                    {(fields, { add, remove }) => (
                        <>
                            {fields.map(({ key, name, ...restField }) => (
                                <div key={key} style={{ display: 'flex', marginBottom: 8, alignItems: 'center' }}>
                                    <Form.Item
                                        {...restField}
                                        name={[name, 'title']}
                                        style={{ flex: 2, marginRight: 8 }}
                                        rules={[{ required: true, message: 'Milestone title is required' }]}
                                    >
                                        <Input placeholder="Milestone title" />
                                    </Form.Item>
                                    <Form.Item
                                        {...restField}
                                        name={[name, 'dueDate']}
                                        style={{ flex: 1, marginRight: 8 }}
                                        rules={[{ required: true, message: 'Due date is required' }]}
                                    >
                                        <DatePicker 
                                            placeholder="Due date" 
                                            style={{ width: '100%' }}
                                            disabledDate={(current) => current && current < moment()}
                                        />
                                    </Form.Item>
                                    <Button 
                                        type="link" 
                                        onClick={() => remove(name)}
                                        icon={<DeleteOutlined />}
                                        danger
                                    />
                                </div>
                            ))}
                            <Form.Item>
                                <Button
                                    type="dashed"
                                    onClick={() => add()}
                                    block
                                    icon={<PlusOutlined />}
                                >
                                    Add Milestone
                                </Button>
                            </Form.Item>
                        </>
                    )}
                </Form.List>
            </Form.Item>

            {budgetCodes.length > 0 && (
                <Alert
                    message="Budget Code Information"
                    description={`${budgetCodes.length} budget codes available. ${budgetCodes.filter(bc => bc.status !== 'critical').length} have sufficient funds for new projects.`}
                    type="info"
                    showIcon
                    style={{ marginBottom: 16 }}
                    action={
                        <Button
                            size="small"
                            onClick={() => {
                                Modal.info({
                                    title: 'Available Budget Codes',
                                    content: (
                                        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                            {budgetCodes.map(budgetCode => (
                                                <div key={budgetCode._id} style={{ marginBottom: '12px', padding: '8px', background: '#f5f5f5', borderRadius: '4px' }}>
                                                    <Text strong>{budgetCode.code}</Text> - {budgetCode.name}
                                                    <br />
                                                    <Text type="secondary" style={{ fontSize: '12px' }}>
                                                        Department: {budgetCode.department} | Type: {budgetCode.budgetType}
                                                    </Text>
                                                    <br />
                                                    <Text type="secondary" style={{ fontSize: '12px' }}>
                                                        Available: XAF {budgetCode.available.toLocaleString()} 
                                                        ({budgetCode.utilizationRate}% utilized)
                                                    </Text>
                                                    {budgetCode.status === 'critical' && (
                                                        <Tag size="small" color="red" style={{ marginLeft: 8 }}>
                                                            Critical Usage
                                                        </Tag>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    ),
                                    width: 600
                                });
                            }}
                        >
                            View All Codes
                        </Button>
                    }
                />
            )}

            {budgetCodes.length === 0 && !loadingBudgetCodes && (
                <Alert
                    message="No Budget Codes Available"
                    description="No budget codes found. The project can still be created, but budget tracking will be limited. Contact the Finance team to create budget codes."
                    type="warning"
                    showIcon
                    style={{ marginBottom: 16 }}
                />
            )}

            {projectManagers.length > 0 && (
                <Alert
                    message="Available Employees for Project Management"
                    description={`${projectManagers.length} active employees are available for selection as project managers. You can choose from any active employee in the organization.`}
                    type="info"
                    showIcon
                    style={{ marginBottom: 16 }}
                    action={
                        <Button
                            size="small"
                            onClick={() => {
                                Modal.info({
                                    title: 'Available Employees',
                                    content: (
                                        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                            {projectManagers.map(manager => {
                                                const roleDisplayMap = {
                                                    'admin': '👑 Administrator',
                                                    'supervisor': '👔 Supervisor', 
                                                    'manager': '📊 Manager',
                                                    'team_lead': '🎯 Team Lead',
                                                    'supply_chain': '📦 Supply Chain',
                                                    'finance': '💰 Finance',
                                                    'hr': '👥 HR',
                                                    'employee': '👤 Employee',
                                                    'analyst': '📈 Analyst',
                                                    'coordinator': '🔗 Coordinator',
                                                    'specialist': '🔧 Specialist',
                                                    'assistant': '🤝 Assistant'
                                                };
                                                const roleDisplay = roleDisplayMap[manager.role] || `� ${manager.role || 'Employee'}`;
                                                
                                                return (
                                                    <div key={manager._id} style={{ marginBottom: '8px', padding: '8px', background: '#f5f5f5', borderRadius: '4px' }}>
                                                        <Text strong>{manager.fullName || manager.name || 'Unknown Name'}</Text>
                                                        <br />
                                                        <Text type="secondary" style={{ fontSize: '12px' }}>
                                                            {roleDisplay} {manager.department ? `| ${manager.department}` : ''}
                                                        </Text>
                                                        {manager.email && (
                                                            <>
                                                                <br />
                                                                <Text type="secondary" style={{ fontSize: '11px' }}>
                                                                    {manager.email}
                                                                </Text>
                                                            </>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ),
                                    width: 600
                                });
                            }}
                        >
                            View All Employees
                        </Button>
                    }
                />
            )}

            {projectManagers.length === 0 && !projectManagersLoading && (
                <Alert
                    message="No Employees Found"
                    description="No active employees found in the system. Please contact the HR department to ensure employees are properly registered."
                    type="error"
                    showIcon
                    style={{ marginBottom: 16 }}
                />
            )}

            <Form.Item>
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
                        disabled={projectManagers.length === 0}
                    >
                        {editingProject ? 'Update Project' : 'Create Project'}
                    </Button>
                </Space>
            </Form.Item>
        </Form>
    );

    // Main component render
    return (
        <div style={{ padding: '24px' }}>
            <Card>
                {/* Header Section */}
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

                {/* Statistics Cards */}
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
                                prefix={<PlayCircleOutlined />}
                                valueStyle={{ color: '#52c41a' }}
                            />
                        </Col>
                        <Col span={6}>
                            <Statistic
                                title="Completed"
                                value={stats.completed}
                                prefix={<CheckCircleOutlined />}
                                valueStyle={{ color: '#722ed1' }}
                            />
                        </Col>
                        <Col span={6}>
                            <Statistic
                                title="Overdue"
                                value={stats.overdue}
                                prefix={<WarningOutlined />}
                                valueStyle={{ color: '#f5222d' }}
                            />
                        </Col>
                    </Row>
                    <Divider />
                    <Row gutter={16}>
                        <Col span={8}>
                            <Statistic
                                title="Total Budget Allocated"
                                value={`XAF ${stats.totalBudget.toLocaleString()}`}
                                prefix={<DollarOutlined />}
                                valueStyle={{ color: '#faad14' }}
                            />
                        </Col>
                        <Col span={8}>
                            <Statistic
                                title="Budget Utilization"
                                value={stats.budgetUtilization}
                                suffix="%"
                                prefix={<BarChartOutlined />}
                                valueStyle={{ color: '#13c2c2' }}
                            />
                        </Col>
                        <Col span={8}>
                            <Statistic
                                title="Available Budget Codes"
                                value={budgetCodes.filter(bc => bc.status !== 'critical').length}
                                prefix={<BankOutlined />}
                                valueStyle={{ color: '#52c41a' }}
                            />
                        </Col>
                    </Row>
                </Card>

                {/* Projects Table with Tabs */}
                <Tabs activeKey={activeTab} onChange={setActiveTab} style={{ marginBottom: '16px' }}>
                    <TabPane 
                        tab={
                            <Badge count={projects.filter(p => ['Planning', 'Approved', 'In Progress'].includes(p.status)).length} size="small">
                                <span>Active Projects</span>
                            </Badge>
                        } 
                        key="active"
                    />
                    <TabPane 
                        tab={
                            <Badge count={projects.filter(p => p.status === 'Completed').length} size="small">
                                <span>Completed</span>
                            </Badge>
                        } 
                        key="completed"
                    />
                    <TabPane 
                        tab={
                            <Badge count={projects.filter(p => {
                                if (p.status === 'Completed') return false;
                                return p.timeline?.endDate && moment(p.timeline.endDate).isBefore(moment());
                            }).length} size="small">
                                <span>Overdue</span>
                            </Badge>
                        } 
                        key="overdue"
                    />
                    <TabPane 
                        tab={
                            <Badge count={projects.length} size="small">
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
                    locale={{ 
                        emptyText: loading ? <Spin /> : 'No projects found'
                    }}
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
                width={900}
                destroyOnClose
            >
                <ProjectForm />
            </Modal>

            {/* Project Details Modal */}
            <Modal
                title={
                    <Space>
                        <ProjectOutlined />
                        Project Details - {selectedProject?.code}
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
                width={1000}
            >
                {selectedProject ? (
                    <div>
                        <Descriptions bordered column={2} size="small" style={{ marginBottom: '20px' }}>
                            <Descriptions.Item label="Project Code" span={2}>
                                <Text code copyable>{selectedProject.code}</Text>
                            </Descriptions.Item>
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
                                {selectedProject.projectManager?.fullName}
                            </Descriptions.Item>
                            <Descriptions.Item label="Progress">
                                <Progress 
                                    percent={selectedProject.progress?.percentage || 0} 
                                    size="small" 
                                />
                            </Descriptions.Item>
                            {selectedProject.budgetCode && (
                                <>
                                    <Descriptions.Item label="Budget Code" span={2}>
                                        <Tag color={getBudgetCodeStatusColor(selectedProject.budgetCode)} icon={<BankOutlined />}>
                                            {selectedProject.budgetCode.code} - {selectedProject.budgetCode.name}
                                        </Tag>
                                        <br />
                                        <Text type="secondary" style={{ fontSize: '12px' }}>
                                            Available: XAF {(selectedProject.budgetCode.budget - selectedProject.budgetCode.used).toLocaleString()} 
                                            ({selectedProject.budgetCode.utilizationRate || 0}% utilized)
                                        </Text>
                                    </Descriptions.Item>
                                </>
                            )}
                        </Descriptions>

                        <Row gutter={16} style={{ marginBottom: '20px' }}>
                            <Col span={12}>
                                <Card size="small" title="Budget Information">
                                    <Statistic
                                        title="Allocated"
                                        value={selectedProject.budget?.allocated || 0}
                                        prefix="XAF "
                                        valueStyle={{ color: '#1890ff' }}
                                        formatter={value => value.toLocaleString()}
                                    />
                                    <Divider />
                                    <Statistic
                                        title="Spent"
                                        value={selectedProject.budget?.spent || 0}
                                        prefix="XAF "
                                        valueStyle={{ color: '#f5222d' }}
                                        formatter={value => value.toLocaleString()}
                                    />
                                    <Divider />
                                    <Progress 
                                        percent={selectedProject.budget?.allocated ? 
                                            Math.round(((selectedProject.budget.spent || 0) / selectedProject.budget.allocated) * 100) : 0}
                                        status={(selectedProject.budget?.spent || 0) > (selectedProject.budget?.allocated || 1) * 0.9 ? 'exception' : 'active'}
                                    />
                                    {selectedProject.budgetCode && (
                                        <>
                                            <Divider />
                                            <div style={{ padding: '8px', background: '#f0f8ff', borderRadius: '4px' }}>
                                                <Text strong>Budget Code Details:</Text>
                                                <br />
                                                <Text>Code: {selectedProject.budgetCode.code}</Text>
                                                <br />
                                                <Text>Department: {selectedProject.budgetCode.department}</Text>
                                                <br />
                                                <Text>Available: XAF {(selectedProject.budgetCode.budget - selectedProject.budgetCode.used).toLocaleString()}</Text>
                                            </div>
                                        </>
                                    )}
                                </Card>
                            </Col>
                            <Col span={12}>
                                <Card size="small" title="Timeline Information">
                                    <div style={{ marginBottom: '8px' }}>
                                        <Text strong>Planned:</Text>
                                        <br />
                                        <Text>
                                            {selectedProject.timeline?.startDate ? 
                                                moment(selectedProject.timeline.startDate).format('MMM DD, YYYY') : 'N/A'} - {' '}
                                            {selectedProject.timeline?.endDate ? 
                                                moment(selectedProject.timeline.endDate).format('MMM DD, YYYY') : 'N/A'}
                                        </Text>
                                    </div>
                                    {selectedProject.timeline?.actualStartDate && (
                                        <div style={{ marginBottom: '8px' }}>
                                            <Text strong>Actual Start:</Text>
                                            <br />
                                            <Text>{moment(selectedProject.timeline.actualStartDate).format('MMM DD, YYYY')}</Text>
                                        </div>
                                    )}
                                    <div>
                                        <Text strong>Days Remaining:</Text>
                                        <br />
                                        <Text style={{ 
                                            color: selectedProject.timeline?.endDate ? 
                                                (moment(selectedProject.timeline.endDate).diff(moment(), 'days') < 0 ? '#f5222d' : '#52c41a') : '#d9d9d9'
                                        }}>
                                            {selectedProject.timeline?.endDate ? 
                                                moment(selectedProject.timeline.endDate).diff(moment(), 'days') : 'N/A'} days
                                        </Text>
                                    </div>
                                </Card>
                            </Col>
                        </Row>

                        <Card size="small" title="Project Description" style={{ marginBottom: '20px' }}>
                            <Paragraph>{selectedProject.description}</Paragraph>
                        </Card>

                        <Row gutter={16} style={{ marginBottom: '20px' }}>
                            <Col span={12}>
                                <Card size="small" title="Team Members">
                                    <List
                                        dataSource={selectedProject.team || []}
                                        renderItem={(teamMember) => (
                                            <List.Item>
                                                <List.Item.Meta
                                                    avatar={<Avatar size="small" icon={<UserOutlined />} />}
                                                    title={teamMember.member?.fullName || 'Unknown User'}
                                                    description={teamMember.role}
                                                />
                                            </List.Item>
                                        )}
                                        locale={{ emptyText: 'No team members assigned' }}
                                    />
                                </Card>
                            </Col>
                            <Col span={12}>
                                <Card size="small" title="Project Milestones">
                                    <Timeline>
                                        {selectedProject.milestones?.map((milestone, index) => {
                                            let color = 'gray';
                                            let icon = <ClockCircleOutlined />;

                                            if (milestone.status === 'Completed') {
                                                color = 'green';
                                                icon = <CheckCircleOutlined />;
                                            } else if (milestone.status === 'In Progress') {
                                                color = 'blue';
                                                icon = <PlayCircleOutlined />;
                                            }

                                            return (
                                                <Timeline.Item key={index} color={color} dot={icon}>
                                                    <div>
                                                        <Text strong>{milestone.title}</Text>
                                                        <br />
                                                        <Text type="secondary">
                                                            Due: {milestone.dueDate ? 
                                                                moment(milestone.dueDate).format('MMM DD, YYYY') : 'Not set'}
                                                        </Text>
                                                        {milestone.completedDate && (
                                                            <>
                                                                <br />
                                                                <Text type="success">
                                                                    Completed: {moment(milestone.completedDate).format('MMM DD, YYYY')}
                                                                </Text>
                                                            </>
                                                        )}
                                                    </div>
                                                </Timeline.Item>
                                            );
                                        })}
                                        {(!selectedProject.milestones || selectedProject.milestones.length === 0) && (
                                            <Timeline.Item color="gray" dot={<BulbOutlined />}>
                                                <Text type="secondary">No milestones defined</Text>
                                            </Timeline.Item>
                                        )}
                                    </Timeline>
                                </Card>
                            </Col>
                        </Row>
                    </div>
                ) : (
                    <Spin size="large" />
                )}
            </Modal>
        </div>
    );
};

export default EnhancedProjectManagement;


