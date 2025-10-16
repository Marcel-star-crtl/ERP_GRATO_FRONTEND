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
    List,
    Collapse,
    Slider
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
    BarChartOutlined,
    MinusCircleOutlined
} from '@ant-design/icons';
import moment from 'moment';
import { projectAPI } from '../../services/projectAPI';
import { getAllEmployees } from '../../utils/departmentStructure';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const { TabPane } = Tabs;
const { RangePicker } = DatePicker;
const { Panel } = Collapse;

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
    const [budgetCodes, setBudgetCodes] = useState([]);
    const [loadingBudgetCodes, setLoadingBudgetCodes] = useState(false);
    const [subMilestoneModalVisible, setSubMilestoneModalVisible] = useState(false);
    const [selectedMilestone, setSelectedMilestone] = useState(null);
    const [subMilestoneForm] = Form.useForm();

    useEffect(() => {
        fetchProjects();
        fetchStats();
        fetchProjectManagers();
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
            const allEmployees = getAllEmployees();

            // Format employees to match the expected structure
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

            console.log(`Successfully loaded ${formattedEmployees.length} employees from department structure`);
            setProjectManagers(formattedEmployees);

        } catch (error) {
            console.error('Error loading project managers:', error);
            setProjectManagers([]);
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
                    description: milestone.description || '',
                    dueDate: milestone.dueDate ? milestone.dueDate.format('YYYY-MM-DD') : null,
                    weight: milestone.weight || 20,
                    subMilestones: (milestone.subMilestones || []).map(sub => ({
                        title: sub.title,
                        description: sub.description || '',
                        dueDate: sub.dueDate ? sub.dueDate.format('YYYY-MM-DD') : null,
                        weight: sub.weight || 10,
                        assignedTo: sub.assignedTo || null,
                        notes: sub.notes || ''
                    }))
                })) || []
            };

            console.log('Transformed project data:', projectData);

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
                    ...milestone,
                    dueDate: milestone.dueDate ? milestone.dueDate.format('YYYY-MM-DD') : null,
                    subMilestones: (milestone.subMilestones || []).map(sub => ({
                        ...sub,
                        dueDate: sub.dueDate ? sub.dueDate.format('YYYY-MM-DD') : null
                    }))
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
            const result = await projectAPI.updateProjectStatus(projectId, { status: newStatus });

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

    const handleAddSubMilestone = async (values) => {
        try {
            setLoading(true);
            const result = await projectAPI.addSubMilestone(
                selectedProject._id,
                selectedMilestone._id,
                {
                    title: values.title,
                    description: values.description || '',
                    dueDate: values.dueDate ? values.dueDate.format('YYYY-MM-DD') : null,
                    weight: values.weight || 10,
                    assignedTo: values.assignedTo || null,
                    notes: values.notes || ''
                }
            );

            if (result.success) {
                message.success('Sub-milestone added successfully');
                setSubMilestoneModalVisible(false);
                subMilestoneForm.resetFields();
                await fetchProjects();
                
                // Refresh selected project details
                const updatedResult = await projectAPI.getProjectById(selectedProject._id);
                if (updatedResult.success) {
                    setSelectedProject(updatedResult.data);
                }
            } else {
                message.error(result.message || 'Failed to add sub-milestone');
            }
        } catch (error) {
            console.error('Error adding sub-milestone:', error);
            message.error('Failed to add sub-milestone');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateSubMilestoneProgress = async (projectId, milestoneId, subMilestoneId, progress) => {
        try {
            const result = await projectAPI.updateSubMilestoneProgress(
                projectId,
                milestoneId,
                subMilestoneId,
                progress,
                null
            );

            if (result.success) {
                message.success('Progress updated');
                await fetchProjects();
                
                // Refresh selected project if details modal is open
                if (detailsModalVisible && selectedProject) {
                    const updatedResult = await projectAPI.getProjectById(selectedProject._id);
                    if (updatedResult.success) {
                        setSelectedProject(updatedResult.data);
                    }
                }
            } else {
                message.error(result.message || 'Failed to update progress');
            }
        } catch (error) {
            console.error('Error updating progress:', error);
            message.error('Failed to update progress');
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
                    description: milestone.description || '',
                    dueDate: milestone.dueDate ? moment(milestone.dueDate) : null,
                    weight: milestone.weight || 20,
                    subMilestones: (milestone.subMilestones || []).map(sub => ({
                        title: sub.title,
                        description: sub.description || '',
                        dueDate: sub.dueDate ? moment(sub.dueDate) : null,
                        weight: sub.weight || 10,
                        assignedTo: sub.assignedTo?._id || sub.assignedTo || null,
                        notes: sub.notes || ''
                    }))
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
            'Cancelled': 'red',
            'Pending': 'default',
            'Overdue': 'red'
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
            title: 'Progress & Milestones',
            key: 'progress',
            render: (_, record) => {
                const totalMilestones = record.milestones?.length || 0;
                const totalSubMilestones = record.milestones?.reduce((sum, m) => 
                    sum + (m.subMilestones?.length || 0), 0) || 0;
                
                return (
                    <div>
                        <Progress 
                            percent={record.progress || 0} 
                            size="small"
                            status={record.progress === 100 ? 'success' : 'active'}
                        />
                        <Text type="secondary" style={{ fontSize: '11px' }}>
                            {totalMilestones} milestones • {totalSubMilestones} sub-tasks
                        </Text>
                    </div>
                );
            },
            width: 180
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
                    {budgetCodes.map(budgetCode => {
                        const totalBudget = budgetCode.totalBudget || budgetCode.budget || 0;
                        const used = budgetCode.used || 0;
                        const available = budgetCode.available !== undefined ? budgetCode.available : (totalBudget - used);
                        const utilizationRate = budgetCode.utilizationRate || 0;

                        return (
                            <Option 
                                key={budgetCode._id} 
                                value={budgetCode._id}
                                disabled={budgetCode.status === 'critical'}
                            >
                                <div>
                                    <Text strong>{budgetCode.code}</Text> - {budgetCode.name}
                                    <br />
                                    <Text type="secondary" style={{ fontSize: '12px' }}>
                                        Available: XAF {available.toLocaleString()} 
                                        ({utilizationRate}% used) | 
                                        {budgetCode.budgetType} | {budgetCode.department}
                                    </Text>
                                </div>
                            </Option>
                        );
                    })}
                </Select>
            </Form.Item>

            <Divider>Milestones & Sub-Milestones</Divider>

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
                                            name={[name, 'dueDate']}
                                            label="Due Date"
                                        >
                                            <DatePicker placeholder="Due date" style={{ width: '100%' }} />
                                        </Form.Item>
                                    </Col>
                                    <Col span={6}>
                                        <Form.Item
                                            {...restField}
                                            name={[name, 'weight']}
                                            label="Weight"
                                            initialValue={20}
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

                                <Divider style={{ margin: '12px 0' }}>Sub-Milestones</Divider>

                                <Form.List name={[name, 'subMilestones']}>
                                    {(subFields, { add: addSub, remove: removeSub }) => (
                                        <div style={{ paddingLeft: 16, backgroundColor: 'white', padding: 12, borderRadius: 4 }}>
                                            {subFields.map(({ key: subKey, name: subName, ...subRest }) => (
                                                <Card key={subKey} size="small" style={{ marginBottom: 8, backgroundColor: '#f5f5f5' }}>
                                                    <Row gutter={8} align="middle">
                                                        <Col span={8}>
                                                            <Form.Item
                                                                {...subRest}
                                                                name={[subName, 'title']}
                                                                label="Sub-Task"
                                                                style={{ marginBottom: 8 }}
                                                                rules={[{ required: true, message: 'Required' }]}
                                                            >
                                                                <Input placeholder="Sub-milestone title" size="small" />
                                                            </Form.Item>
                                                        </Col>
                                                        <Col span={6}>
                                                            <Form.Item
                                                                {...subRest}
                                                                name={[subName, 'dueDate']}
                                                                label="Due Date"
                                                                style={{ marginBottom: 8 }}
                                                            >
                                                                <DatePicker size="small" style={{ width: '100%' }} />
                                                            </Form.Item>
                                                        </Col>
                                                        <Col span={4}>
                                                            <Form.Item
                                                                {...subRest}
                                                                name={[subName, 'weight']}
                                                                label="Weight"
                                                                initialValue={10}
                                                                style={{ marginBottom: 8 }}
                                                            >
                                                                <InputNumber
                                                                    size="small"
                                                                    min={0}
                                                                    max={100}
                                                                    formatter={v => `${v}%`}
                                                                    parser={v => v.replace('%', '')}
                                                                    style={{ width: '100%' }}
                                                                />
                                                            </Form.Item>
                                                        </Col>
                                                        <Col span={5}>
                                                            <Form.Item
                                                                {...subRest}
                                                                name={[subName, 'assignedTo']}
                                                                label="Assign To"
                                                                style={{ marginBottom: 8 }}
                                                            >
                                                                <Select size="small" placeholder="Assign" allowClear>
                                                                    {projectManagers.map(pm => (
                                                                        <Option key={pm._id} value={pm._id}>
                                                                            {pm.fullName || pm.name}
                                                                        </Option>
                                                                    ))}
                                                                </Select>
                                                            </Form.Item>
                                                        </Col>
                                                        <Col span={1}>
                                                            <Button
                                                                type="link"
                                                                danger
                                                                size="small"
                                                                icon={<MinusCircleOutlined />}
                                                                onClick={() => removeSub(subName)}
                                                                style={{ marginTop: 22 }}
                                                            />
                                                        </Col>
                                                    </Row>
                                                    <Form.Item
                                                        {...subRest}
                                                        name={[subName, 'description']}
                                                        style={{ marginBottom: 0 }}
                                                    >
                                                        <TextArea 
                                                            size="small" 
                                                            rows={1} 
                                                            placeholder="Optional description"
                                                        />
                                                    </Form.Item>
                                                </Card>
                                            ))}
                                            <Button
                                                type="dashed"
                                                size="small"
                                                onClick={() => addSub()}
                                                icon={<PlusOutlined />}
                                                block
                                            >
                                                Add Sub-Milestone
                                            </Button>
                                        </div>
                                    )}
                                </Form.List>
                            </Card>
                        ))}
                        <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                            Add Milestone
                        </Button>
                    </>
                )}
            </Form.List>

            <Divider />

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

                        <Card size="small" title="Milestones & Sub-Milestones Tracking" style={{ marginBottom: '20px' }}>
                            {selectedProject.milestones && selectedProject.milestones.length > 0 ? (
                                <Collapse>
                                    {selectedProject.milestones.map((milestone, idx) => (
                                        <Panel
                                            header={
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                                                    <Space>
                                                        <Text strong>{milestone.title}</Text>
                                                        <Tag color={getStatusColor(milestone.status)}>{milestone.status}</Tag>
                                                        <Text type="secondary">Weight: {milestone.weight}%</Text>
                                                    </Space>
                                                    <Progress 
                                                        percent={milestone.progress || 0} 
                                                        size="small" 
                                                        style={{ width: 200 }}
                                                        status={milestone.progress === 100 ? 'success' : 'active'}
                                                    />
                                                </div>
                                            }
                                            key={idx}
                                        >
                                            {milestone.description && (
                                                <Alert 
                                                    message={milestone.description} 
                                                    type="info" 
                                                    style={{ marginBottom: 16 }}
                                                    showIcon
                                                />
                                            )}
                                            
                                            {milestone.dueDate && (
                                                <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
                                                    <ClockCircleOutlined /> Due: {moment(milestone.dueDate).format('MMM DD, YYYY')}
                                                </Text>
                                            )}

                                            {milestone.subMilestones && milestone.subMilestones.length > 0 ? (
                                                <List
                                                    size="small"
                                                    dataSource={milestone.subMilestones}
                                                    renderItem={(subMilestone) => (
                                                        <List.Item
                                                            actions={[
                                                                <div style={{ width: 200 }}>
                                                                    <Slider
                                                                        value={subMilestone.progress || 0}
                                                                        onChange={(value) => handleUpdateSubMilestoneProgress(
                                                                            selectedProject._id,
                                                                            milestone._id,
                                                                            subMilestone._id,
                                                                            value
                                                                        )}
                                                                        marks={{ 0: '0%', 50: '50%', 100: '100%' }}
                                                                        tipFormatter={value => `${value}%`}
                                                                    />
                                                                </div>
                                                            ]}
                                                        >
                                                            <List.Item.Meta
                                                                avatar={
                                                                    <Avatar 
                                                                        size="small" 
                                                                        style={{ 
                                                                            backgroundColor: subMilestone.progress === 100 ? '#52c41a' : 
                                                                                           subMilestone.progress > 0 ? '#1890ff' : '#d9d9d9'
                                                                        }}
                                                                    >
                                                                        {subMilestone.progress === 100 ? '✓' : `${subMilestone.progress || 0}%`}
                                                                    </Avatar>
                                                                }
                                                                title={
                                                                    <Space>
                                                                        <Text strong>{subMilestone.title}</Text>
                                                                        <Tag size="small" color={getStatusColor(subMilestone.status)}>
                                                                            {subMilestone.status}
                                                                        </Tag>
                                                                        {subMilestone.weight && (
                                                                            <Tag size="small" color="blue">Weight: {subMilestone.weight}%</Tag>
                                                                        )}
                                                                    </Space>
                                                                }
                                                                description={
                                                                    <Space direction="vertical" size="small" style={{ width: '100%' }}>
                                                                        {subMilestone.description && (
                                                                            <Text type="secondary">{subMilestone.description}</Text>
                                                                        )}
                                                                        {subMilestone.assignedTo && (
                                                                            <Text type="secondary">
                                                                                <UserOutlined /> Assigned: {subMilestone.assignedTo.fullName || subMilestone.assignedTo.name}
                                                                            </Text>
                                                                        )}
                                                                        {subMilestone.dueDate && (
                                                                            <Text type="secondary">
                                                                                <ClockCircleOutlined /> Due: {moment(subMilestone.dueDate).format('MMM DD, YYYY')}
                                                                            </Text>
                                                                        )}
                                                                        {subMilestone.completedDate && (
                                                                            <Text type="success">
                                                                                <CheckCircleOutlined /> Completed: {moment(subMilestone.completedDate).format('MMM DD, YYYY')}
                                                                            </Text>
                                                                        )}
                                                                        {subMilestone.notes && (
                                                                            <Text type="secondary" italic style={{ fontSize: '12px' }}>
                                                                                Notes: {subMilestone.notes}
                                                                            </Text>
                                                                        )}
                                                                    </Space>
                                                                }
                                                            />
                                                        </List.Item>
                                                    )}
                                                />
                                            ) : (
                                                <Alert message="No sub-milestones defined" type="info" showIcon />
                                            )}

                                            <Divider />
                                            <Button
                                                type="dashed"
                                                size="small"
                                                icon={<PlusOutlined />}
                                                onClick={() => {
                                                    setSelectedMilestone(milestone);
                                                    setSubMilestoneModalVisible(true);
                                                }}
                                            >
                                                Add Sub-Milestone
                                            </Button>
                                        </Panel>
                                    ))}
                                </Collapse>
                            ) : (
                                <Alert message="No milestones defined for this project" type="info" showIcon />
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
                                                <Tag color={getBudgetCodeStatusColor(selectedProject.budgetCode)}>
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

            {/* Add Sub-Milestone Modal */}
            <Modal
                title={<Space><PlusOutlined />Add Sub-Milestone to: {selectedMilestone?.title}</Space>}
                open={subMilestoneModalVisible}
                onCancel={() => {
                    setSubMilestoneModalVisible(false);
                    setSelectedMilestone(null);
                    subMilestoneForm.resetFields();
                }}
                footer={null}
                width={600}
            >
                <Form
                    form={subMilestoneForm}
                    layout="vertical"
                    onFinish={handleAddSubMilestone}
                >
                    <Form.Item
                        name="title"
                        label="Sub-Milestone Title"
                        rules={[{ required: true, message: 'Please enter title' }]}
                    >
                        <Input placeholder="Enter sub-milestone title" />
                    </Form.Item>

                    <Form.Item
                        name="description"
                        label="Description"
                    >
                        <TextArea rows={3} placeholder="Optional description" />
                    </Form.Item>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                name="dueDate"
                                label="Due Date"
                            >
                                <DatePicker style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name="weight"
                                label="Weight (%)"
                                initialValue={10}
                            >
                                <InputNumber
                                    min={0}
                                    max={100}
                                    style={{ width: '100%' }}
                                    formatter={value => `${value}%`}
                                    parser={value => value.replace('%', '')}
                                />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item
                        name="assignedTo"
                        label="Assign To"
                    >
                        <Select placeholder="Select team member" allowClear>
                            {projectManagers.map(pm => (
                                <Option key={pm._id} value={pm._id}>
                                    {pm.fullName || pm.name}
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Form.Item
                        name="notes"
                        label="Notes"
                    >
                        <TextArea rows={2} placeholder="Optional notes" />
                    </Form.Item>

                    <Form.Item>
                        <Space>
                            <Button onClick={() => {
                                setSubMilestoneModalVisible(false);
                                subMilestoneForm.resetFields();
                            }}>
                                Cancel
                            </Button>
                            <Button type="primary" htmlType="submit" loading={loading}>
                                Add Sub-Milestone
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default EnhancedProjectManagement;




