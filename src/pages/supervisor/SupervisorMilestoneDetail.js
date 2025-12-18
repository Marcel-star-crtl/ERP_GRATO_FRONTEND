import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
    DatePicker,
    InputNumber,
    Descriptions,
    Alert,
    Spin,
    message,
    Progress,
    Row,
    Col,
    Statistic,
    Divider,
    Tooltip,
    Avatar,
    Badge,
    Tree,
    Collapse,
    Menu,
    Dropdown,
    Checkbox
} from 'antd';
import {
    ArrowLeftOutlined,
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    FlagOutlined,
    UserOutlined,
    ReloadOutlined,
    CheckCircleOutlined,
    WarningOutlined,
    TrophyOutlined,
    DownOutlined,
    FolderOutlined,
    FolderOpenOutlined,
    FileOutlined,
    EllipsisOutlined,
    ApartmentOutlined,
    RightOutlined
} from '@ant-design/icons';
import moment from 'moment';
import api from '../../services/api';
import { kpiAPI } from '../../services/kpiAPI';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const { Panel } = Collapse;

const SupervisorMilestoneDetail = () => {
    const { projectId, milestoneId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [milestoneData, setMilestoneData] = useState(null);
    const [hierarchyData, setHierarchyData] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [stats, setStats] = useState(null);
    const [taskModalVisible, setTaskModalVisible] = useState(false);
    const [subMilestoneModalVisible, setSubMilestoneModalVisible] = useState(false);
    const [editingTask, setEditingTask] = useState(null);
    const [selectedSubMilestone, setSelectedSubMilestone] = useState(null);
    const [parentSubMilestone, setParentSubMilestone] = useState(null);
    const [viewMode, setViewMode] = useState('tree'); // 'tree' or 'table'
    const [expandedKeys, setExpandedKeys] = useState([]);
    const [form] = Form.useForm();
    const [subMilestoneForm] = Form.useForm();
    const [users, setUsers] = useState([]);
    const [usersLoading, setUsersLoading] = useState(false);
    const [selectedAssignees, setSelectedAssignees] = useState([]);
    const [assigneeKPIs, setAssigneeKPIs] = useState({});
    const [loadingKPIs, setLoadingKPIs] = useState({});
    const [creatorKPIs, setCreatorKPIs] = useState(null);

    useEffect(() => {
        fetchMilestoneHierarchy();
        fetchUsers();
    }, [projectId, milestoneId]);

    const fetchMilestoneHierarchy = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/projects/${projectId}/milestones/${milestoneId}/hierarchy`);

            if (response.data.success) {
                setHierarchyData(response.data.data.hierarchy);
                setMilestoneData(response.data.data);
                
                // Flatten all tasks from hierarchy
                const allTasks = flattenTasksFromHierarchy(response.data.data.hierarchy);
                setTasks(allTasks);
                
                // Calculate overall stats
                const totalTasks = allTasks.length;
                const completedTasks = allTasks.filter(t => t.status === 'Completed').length;
                const totalWeight = response.data.data.hierarchy.weight || 0;
                
                setStats({
                    totalTasks,
                    completedTasks,
                    totalWeightAssigned: totalWeight,
                    weightRemaining: 100 - totalWeight
                });
            } else {
                message.error(response.data.message || 'Failed to fetch milestone hierarchy');
            }
        } catch (error) {
            console.error('Error fetching milestone hierarchy:', error);
            message.error('Failed to load milestone hierarchy');
        } finally {
            setLoading(false);
        }
    };

    const flattenTasksFromHierarchy = (node) => {
        let tasks = [];
        
        // Add tasks from current node (if any)
        if (node.tasks && Array.isArray(node.tasks)) {
            tasks = [...tasks, ...node.tasks];
        }
        
        // Recursively add tasks from sub-milestones
        if (node.subMilestones && node.subMilestones.length > 0) {
            node.subMilestones.forEach(subMilestone => {
                tasks = [...tasks, ...flattenTasksFromHierarchy(subMilestone)];
            });
        }
        
        return tasks;
    };

    const fetchUsers = async () => {
        try {
            setUsersLoading(true);
            
            try {
                const response = await api.get('/auth/users');

                if (response.data.success && response.data.data && response.data.data.length > 0) {
                    setUsers(response.data.data);
                    return;
                }
            } catch (error) {
                console.log('Database users not available');
            }

            const { getAllEmployees } = require('../../utils/departmentStructure');
            const allEmployees = getAllEmployees();

            const formattedUsers = allEmployees
                .filter(emp => emp.name && emp.email)
                .map((emp, idx) => ({
                    _id: `emp_${idx}_${emp.email}`,
                    id: emp.email,
                    fullName: emp.name,
                    name: emp.name,
                    email: emp.email,
                    position: emp.position,
                    department: emp.department,
                    role: emp.role || 'employee',
                    isActive: true
                }))
                .sort((a, b) => a.fullName.localeCompare(b.fullName));

            setUsers(formattedUsers);

        } catch (error) {
            console.error('Error loading users:', error);
            setUsers([]);
        } finally {
            setUsersLoading(false);
        }
    };

    const fetchUserKPIs = async (userId) => {
        if (assigneeKPIs[userId]) {
            return;
        }

        const user = users.find(u => u._id === userId);

        try {
            setLoadingKPIs(prev => ({ ...prev, [userId]: true }));
            
            const result = await kpiAPI.getApprovedKPIsForLinking(userId);
            
            if (result.success && result.data && result.data.kpis && result.data.kpis.length > 0) {
                setAssigneeKPIs(prev => ({
                    ...prev,
                    [userId]: result.data
                }));
                
                message.success(`Loaded ${result.data.kpis.length} KPIs for ${user?.fullName || 'user'}`);
            } else {
                setAssigneeKPIs(prev => ({
                    ...prev,
                    [userId]: null
                }));
                
                message.warning(
                    result.message || 
                    `${user?.fullName || 'User'} has no approved KPIs for current quarter.`,
                    5
                );
            }
        } catch (error) {
            console.error('Error fetching user KPIs:', error);
            setAssigneeKPIs(prev => ({
                ...prev,
                [userId]: null
            }));
            message.error(`Failed to fetch KPIs for ${user?.fullName || 'user'}`);
        } finally {
            setLoadingKPIs(prev => ({ ...prev, [userId]: false }));
        }
    };

    const handleAssigneeChange = (assigneeIds) => {
        setSelectedAssignees(assigneeIds);
        
        assigneeIds.forEach(userId => {
            if (!assigneeKPIs[userId] && !loadingKPIs[userId]) {
                fetchUserKPIs(userId);
            }
        });
    };

    const openSubMilestoneModal = async (parent = null) => {
        setParentSubMilestone(parent);
        subMilestoneForm.resetFields();
        
        // Fetch creator's KPIs for current quarter
        try {
            setLoadingKPIs(true);
            const userId = localStorage.getItem('userId'); // Or get from context
            const result = await kpiAPI.getApprovedKPIsForLinking(userId);
            
            if (result.success && result.data && result.data.kpis.length > 0) {
            setCreatorKPIs(result.data);
            } else {
            setCreatorKPIs(null);
            }
        } catch (error) {
            console.error('Failed to fetch KPIs:', error);
            setCreatorKPIs(null);
        } finally {
            setLoadingKPIs(false);
        }
        
        setSubMilestoneModalVisible(true);
    };

    const handleCreateSubMilestone = async (values) => {
        try {
            setLoading(true);

            const subMilestoneData = {
                title: values.title,
                description: values.description || '',
                weight: values.weight,
                dueDate: values.dueDate ? values.dueDate.format('YYYY-MM-DD') : null,
                assignedSupervisor: values.assignedSupervisor,
                parentSubMilestoneId: parentSubMilestone?._id || null
            };

            const response = await api.post(
                `/projects/${projectId}/milestones/${milestoneId}/sub-milestones`,
                subMilestoneData
            );

            if (response.data.success) {
                message.success('Sub-milestone created successfully!');
                setSubMilestoneModalVisible(false);
                subMilestoneForm.resetFields();
                setParentSubMilestone(null);
                fetchMilestoneHierarchy();
            } else {
                message.error(response.data.message || 'Failed to create sub-milestone');
            }
        } catch (error) {
            console.error('Error creating sub-milestone:', error);
            message.error(error.response?.data?.message || 'Failed to create sub-milestone');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteSubMilestone = (subMilestoneId) => {
        Modal.confirm({
            title: 'Delete Sub-Milestone',
            content: 'Are you sure? This will delete all nested sub-milestones and tasks.',
            okText: 'Delete',
            okType: 'danger',
            onOk: async () => {
                try {
                    const response = await api.delete(
                        `/projects/${projectId}/milestones/${milestoneId}/sub-milestones/${subMilestoneId}`
                    );
                    
                    if (response.data.success) {
                        message.success('Sub-milestone deleted successfully');
                        fetchMilestoneHierarchy();
                    } else {
                        message.error(response.data.message || 'Failed to delete sub-milestone');
                    }
                } catch (error) {
                    console.error('Error deleting sub-milestone:', error);
                    message.error(error.response?.data?.message || 'Failed to delete sub-milestone');
                }
            }
        });
    };

    const openTaskModal = (subMilestone = null) => {
        setSelectedSubMilestone(subMilestone);
        form.resetFields();
        setSelectedAssignees([]);
        setAssigneeKPIs({});
        setTaskModalVisible(true);
    };

    const handleCreateTask = async (values) => {
        try {
            setLoading(true);

            if (!values.title || !values.description || !values.priority || !values.dueDate || !values.taskWeight) {
                message.error('Please fill in all required fields');
                return;
            }

            if (values.assignedTo && values.assignedTo.length > 0) {
                for (const userId of values.assignedTo) {
                    const userKPISelections = values[`kpis_${userId}`];
                    if (!userKPISelections || userKPISelections.length === 0) {
                        const user = users.find(u => u._id === userId);
                        message.error(`Please select at least one KPI for ${user?.fullName || 'assignee'}`);
                        return;
                    }
                }
            }

            const linkedKPIs = [];
            if (values.assignedTo && values.assignedTo.length > 0) {
                for (const userId of values.assignedTo) {
                    const userKPISelections = values[`kpis_${userId}`] || [];
                    const userKPIDoc = assigneeKPIs[userId];
                    
                    if (userKPIDoc) {
                        userKPISelections.forEach(kpiIndex => {
                            linkedKPIs.push({
                                userId,
                                kpiDocId: userKPIDoc._id,
                                kpiIndex
                            });
                        });
                    }
                }
            }

            const endpoint = selectedSubMilestone 
                ? '/action-items/sub-milestone-task'
                : '/action-items/milestone/task';

            const taskData = {
                projectId,
                milestoneId,
                ...(selectedSubMilestone && { subMilestoneId: selectedSubMilestone._id }),
                title: values.title,
                description: values.description,
                priority: values.priority,
                dueDate: values.dueDate.format('YYYY-MM-DD'),
                taskWeight: values.taskWeight,
                assignedTo: values.assignedTo || [],
                linkedKPIs,
                notes: values.notes || ''
            };

            const response = await api.post(endpoint, taskData);

            if (response.data.success) {
                message.success(
                    selectedSubMilestone 
                        ? 'Task created under sub-milestone!' 
                        : 'Task created under milestone!'
                );
                setTaskModalVisible(false);
                form.resetFields();
                setSelectedAssignees([]);
                setAssigneeKPIs({});
                setSelectedSubMilestone(null);
                fetchMilestoneHierarchy();
            } else {
                message.error(response.data.message || 'Failed to create task');
            }
        } catch (error) {
            console.error('Error creating task:', error);
            message.error(error.response?.data?.message || 'Failed to create task');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteTask = (taskId) => {
        Modal.confirm({
            title: 'Delete Task',
            content: 'Are you sure you want to delete this task?',
            okText: 'Delete',
            okType: 'danger',
            onOk: async () => {
                try {
                    const response = await api.delete(`/action-items/${taskId}`);
                    
                    if (response.data.success) {
                        message.success('Task deleted successfully');
                        fetchMilestoneHierarchy();
                    } else {
                        message.error(response.data.message || 'Failed to delete task');
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

    // Build tree data for hierarchy view
    const buildTreeData = (node, level = 0) => {
        const treeNode = {
            key: node._id,
            title: (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                    <Space>
                        {level === 0 ? <FlagOutlined /> : <FolderOutlined />}
                        <Text strong>{node.title}</Text>
                        <Tag color="blue">{node.weight}%</Tag>
                        <Progress 
                            percent={node.progress || 0} 
                            size="small"
                            style={{ width: 100 }}
                        />
                        <Badge count={node.taskCount} showZero style={{ backgroundColor: '#52c41a' }}>
                            <FileOutlined />
                        </Badge>
                        {node.subMilestones && node.subMilestones.length > 0 && (
                            <Badge count={node.subMilestones.length} style={{ backgroundColor: '#1890ff' }}>
                                <FolderOutlined />
                            </Badge>
                        )}
                    </Space>
                    <Dropdown
                        overlay={
                            <Menu>
                                <Menu.Item 
                                    key="add-sub" 
                                    icon={<PlusOutlined />}
                                    onClick={() => openSubMilestoneModal(node)}
                                >
                                    Add Sub-Milestone
                                </Menu.Item>
                                <Menu.Item 
                                    key="add-task" 
                                    icon={<FileOutlined />}
                                    onClick={() => openTaskModal(node)}
                                >
                                    Add Task
                                </Menu.Item>
                                {level > 0 && (
                                    <>
                                        <Menu.Divider />
                                        <Menu.Item 
                                            key="delete" 
                                            danger
                                            icon={<DeleteOutlined />}
                                            onClick={() => handleDeleteSubMilestone(node._id)}
                                        >
                                            Delete
                                        </Menu.Item>
                                    </>
                                )}
                            </Menu>
                        }
                        trigger={['click']}
                    >
                        <Button type="text" size="small" icon={<EllipsisOutlined />} />
                    </Dropdown>
                </div>
            ),
            data: node
        };

        if (node.subMilestones && node.subMilestones.length > 0) {
            treeNode.children = node.subMilestones.map(sub => buildTreeData(sub, level + 1));
        }

        return treeNode;
    };

    // Render sub-milestone cards recursively
    const renderSubMilestoneCards = (subMilestones, level = 1) => {
        return subMilestones.map(subMilestone => (
            <Card
                key={subMilestone._id}
                size="small"
                style={{ 
                    marginBottom: 12,
                    marginLeft: level * 20,
                    backgroundColor: level % 2 === 0 ? '#fafafa' : '#f0f0f0'
                }}
                title={
                    <Space>
                        <FolderOutlined />
                        <Text strong>{subMilestone.title}</Text>
                        <Tag color="blue">{subMilestone.weight}%</Tag>
                        <Tag color={
                            subMilestone.status === 'Completed' ? 'green' :
                            subMilestone.status === 'In Progress' ? 'blue' :
                            'default'
                        }>
                            {subMilestone.status}
                        </Tag>
                    </Space>
                }
                extra={
                    <Space>
                        <Progress 
                            type="circle" 
                            percent={subMilestone.progress || 0}
                            width={40}
                        />
                        <Dropdown
                            overlay={
                                <Menu>
                                    <Menu.Item 
                                        key="add-sub" 
                                        icon={<PlusOutlined />}
                                        onClick={() => openSubMilestoneModal(subMilestone)}
                                    >
                                        Add Sub-Milestone
                                    </Menu.Item>
                                    <Menu.Item 
                                        key="add-task" 
                                        icon={<FileOutlined />}
                                        onClick={() => openTaskModal(subMilestone)}
                                    >
                                        Add Task
                                    </Menu.Item>
                                    <Menu.Divider />
                                    <Menu.Item 
                                        key="delete" 
                                        danger
                                        icon={<DeleteOutlined />}
                                        onClick={() => handleDeleteSubMilestone(subMilestone._id)}
                                    >
                                        Delete
                                    </Menu.Item>
                                </Menu>
                            }
                            trigger={['click']}
                        >
                            <Button type="text" size="small" icon={<EllipsisOutlined />} />
                        </Dropdown>
                    </Space>
                }
            >
                <Row gutter={8}>
                    <Col span={12}>
                        <Text type="secondary">Description:</Text>
                        <Paragraph ellipsis={{ rows: 2 }}>
                            {subMilestone.description || 'No description'}
                        </Paragraph>
                    </Col>
                    <Col span={6}>
                        <Statistic 
                            title="Tasks" 
                            value={subMilestone.taskCount} 
                            prefix={<FileOutlined />}
                        />
                    </Col>
                    <Col span={6}>
                        <Statistic 
                            title="Sub-Milestones" 
                            value={subMilestone.subMilestones?.length || 0}
                            prefix={<FolderOutlined />}
                        />
                    </Col>
                </Row>

                {/* Recursively render nested sub-milestones */}
                {subMilestone.subMilestones && subMilestone.subMilestones.length > 0 && (
                    <div style={{ marginTop: 12 }}>
                        {renderSubMilestoneCards(subMilestone.subMilestones, level + 1)}
                    </div>
                )}
            </Card>
        ));
    };

    const taskColumns = [
        {
            title: 'Task',
            key: 'task',
            render: (_, record) => (
                <div>
                    <Text strong>{record.title}</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                        {record.description?.substring(0, 60)}...
                    </Text>
                    <br />
                    <Tag size="small" color={getPriorityColor(record.priority)} icon={<FlagOutlined />}>
                        {record.priority}
                    </Tag>
                    <Tag size="small" color="blue">
                        Weight: {record.taskWeight}%
                    </Tag>
                </div>
            ),
            width: 300
        },
        {
            title: 'Assignees',
            key: 'assignees',
            render: (_, record) => (
                <div>
                    {record.assignedTo && record.assignedTo.length > 0 ? (
                        <>
                            {record.assignedTo.slice(0, 2).map((assignee, idx) => (
                                <div key={idx} style={{ marginBottom: 4 }}>
                                    <Avatar size="small" icon={<UserOutlined />} style={{ marginRight: 4 }} />
                                    <Text style={{ fontSize: '12px' }}>
                                        {assignee.user?.fullName || 'Unknown'}
                                    </Text>
                                    <Tag size="small" color={
                                        assignee.completionStatus === 'approved' ? 'green' :
                                        assignee.completionStatus === 'submitted' ? 'blue' :
                                        assignee.completionStatus === 'rejected' ? 'red' :
                                        'default'
                                    } style={{ marginLeft: 4 }}>
                                        {assignee.completionStatus}
                                    </Tag>
                                </div>
                            ))}
                            {record.assignedTo.length > 2 && (
                                <Text type="secondary" style={{ fontSize: '11px' }}>
                                    +{record.assignedTo.length - 2} more
                                </Text>
                            )}
                        </>
                    ) : (
                        <Text type="secondary">Unassigned</Text>
                    )}
                </div>
            ),
            width: 200
        },
        {
            title: 'Progress',
            key: 'progress',
            render: (_, record) => (
                <Progress 
                    percent={record.progress || 0} 
                    size="small"
                    status={record.progress === 100 ? 'success' : 'active'}
                />
            ),
            width: 120
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
            title: 'Due Date',
            key: 'dueDate',
            render: (_, record) => {
                const isOverdue = moment(record.dueDate).isBefore(moment()) && record.status !== 'Completed';
                return (
                    <div>
                        <Text type={isOverdue ? 'danger' : 'secondary'}>
                            {moment(record.dueDate).format('MMM DD, YYYY')}
                        </Text>
                        {isOverdue && (
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
                <Space size="small">
                    <Tooltip title="View Details">
                        <Button
                            size="small"
                            icon={<EditOutlined />}
                            onClick={() => navigate(`/supervisor/task/${record._id}`)}
                        />
                    </Tooltip>
                    {['Not Started', 'In Progress'].includes(record.status) && (
                        <Tooltip title="Delete">
                            <Button
                                size="small"
                                danger
                                icon={<DeleteOutlined />}
                                onClick={() => handleDeleteTask(record._id)}
                            />
                        </Tooltip>
                    )}
                </Space>
            ),
            width: 100,
            fixed: 'right'
        }
    ];

    if (loading && !hierarchyData) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
                <Spin size="large" />
            </div>
        );
    }

    if (!hierarchyData) {
        return (
            <div style={{ padding: '24px' }}>
                <Alert
                    message="Milestone Not Found"
                    description="The milestone you are trying to access does not exist or you don't have permission to view it."
                    type="error"
                    showIcon
                />
            </div>
        );
    }

    const treeData = [buildTreeData(hierarchyData)];

    return (
        <div style={{ padding: '24px' }}>
            <Card>
                <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    marginBottom: '24px'
                }}>
                    <Space>
                        <Button
                            icon={<ArrowLeftOutlined />}
                            onClick={() => navigate('/supervisor/milestones')}
                        >
                            Back to Milestones
                        </Button>
                        <Title level={3} style={{ margin: 0 }}>
                            <FlagOutlined /> {hierarchyData.title}
                        </Title>
                    </Space>
                    <Space>
                        <Button
                            icon={<ReloadOutlined />}
                            onClick={fetchMilestoneHierarchy}
                            loading={loading}
                        >
                            Refresh
                        </Button>
                        <Button
                            icon={<ApartmentOutlined />}
                            onClick={() => setViewMode(viewMode === 'tree' ? 'cards' : 'tree')}
                        >
                            {viewMode === 'tree' ? 'Card View' : 'Tree View'}
                        </Button>
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={() => openSubMilestoneModal()}
                        >
                            Add Sub-Milestone
                        </Button>
                        <Button
                            type="primary"
                            icon={<FileOutlined />}
                            onClick={() => openTaskModal()}
                        >
                            Add Task
                        </Button>
                    </Space>
                </div>

                {/* Milestone Info Card */}
                {/* <Card size="small" style={{ marginBottom: '24px', backgroundColor: '#f0f8ff' }}>
                    <Row gutter={16}>
                        <Col span={24}>
                            <Descriptions bordered column={3} size="small">
                                <Descriptions.Item label="Project">
                                    <Text strong>{milestoneData.project.name}</Text>
                                </Descriptions.Item>
                                <Descriptions.Item label="Milestone Weight">
                                    <Tag color="blue">{hierarchyData.weight}%</Tag>
                                </Descriptions.Item>
                                <Descriptions.Item label="Status">
                                    <Tag color={
                                        hierarchyData.status === 'Completed' ? 'green' :
                                        hierarchyData.status === 'In Progress' ? 'blue' :
                                        'default'
                                    }>
                                        {hierarchyData.status}
                                    </Tag>
                                </Descriptions.Item>
                                <Descriptions.Item label="Description" span={3}>
                                    <Paragraph style={{ margin: 0 }}>
                                        {hierarchyData.description || 'No description provided'}
                                    </Paragraph>
                                </Descriptions.Item>
                            </Descriptions>
                        </Col>
                    </Row>
                </Card> */}

                <Card size="small" style={{ marginBottom: '24px', backgroundColor: '#f0f8ff' }}>
                    <Row gutter={16}>
                        <Col span={24}>
                            <Descriptions bordered column={3} size="small">
                                <Descriptions.Item label="Project">
                                    <Text strong>{milestoneData?.project?.name || 'N/A'}</Text>
                                </Descriptions.Item>
                                <Descriptions.Item label="Milestone Weight">
                                    <Tag color="blue">{hierarchyData.weight}%</Tag>
                                </Descriptions.Item>
                                <Descriptions.Item label="Status">
                                    <Tag color={
                                        hierarchyData.status === 'Completed' ? 'green' :
                                        hierarchyData.status === 'In Progress' ? 'blue' :
                                        'default'
                                    }>
                                        {hierarchyData.status}
                                    </Tag>
                                </Descriptions.Item>
                                <Descriptions.Item label="Description" span={3}>
                                    <Paragraph style={{ margin: 0 }}>
                                        {hierarchyData.description || 'No description provided'}
                                    </Paragraph>
                                </Descriptions.Item>
                            </Descriptions>
                        </Col>
                    </Row>
                </Card>

                {/* Statistics Card */}
                <Card size="small" style={{ marginBottom: '24px' }}>
                    <Row gutter={16}>
                        <Col span={6}>
                            <Statistic
                                title="Overall Progress"
                                value={hierarchyData.progress || 0}
                                suffix="%"
                                valueStyle={{ color: '#1890ff' }}
                            />
                            <Progress 
                                percent={hierarchyData.progress || 0} 
                                size="small"
                                style={{ marginTop: 8 }}
                            />
                        </Col>
                        <Col span={6}>
                            <Statistic
                                title="Total Tasks"
                                value={stats?.totalTasks || 0}
                                prefix={<FileOutlined />}
                            />
                        </Col>
                        <Col span={6}>
                            <Statistic
                                title="Completed Tasks"
                                value={stats?.completedTasks || 0}
                                valueStyle={{ color: '#52c41a' }}
                                prefix={<CheckCircleOutlined />}
                            />
                        </Col>
                        <Col span={6}>
                            <Statistic
                                title="Sub-Milestones"
                                value={hierarchyData.subMilestones?.length || 0}
                                prefix={<FolderOutlined />}
                            />
                        </Col>
                    </Row>
                </Card>

                <Divider />

                {/* Hierarchy View */}
                {viewMode === 'tree' ? (
                    <Card title={<><ApartmentOutlined /> Milestone Hierarchy</>}>
                        <Alert
                            message="Hierarchy View"
                            description="Expand nodes to see sub-milestones and tasks. Right-click on any node to add sub-milestones or tasks."
                            type="info"
                            showIcon
                            style={{ marginBottom: 16 }}
                        />
                        <Tree
                            showLine
                            showIcon
                            defaultExpandAll
                            treeData={treeData}
                            style={{ fontSize: '14px' }}
                        />
                    </Card>
                ) : (
                    <div>
                        <Title level={4}>Sub-Milestones</Title>
                        {hierarchyData.subMilestones && hierarchyData.subMilestones.length > 0 ? (
                            renderSubMilestoneCards(hierarchyData.subMilestones)
                        ) : (
                            <Alert
                                message="No Sub-Milestones"
                                description="Break down this milestone into smaller sub-milestones for better organization."
                                type="info"
                                showIcon
                                action={
                                    <Button
                                        type="primary"
                                        icon={<PlusOutlined />}
                                        onClick={() => openSubMilestoneModal()}
                                    >
                                        Add Sub-Milestone
                                    </Button>
                                }
                            />
                        )}
                    </div>
                )}

                <Divider />

                {/* All Tasks Table */}
                <Title level={4}>All Tasks</Title>
                {tasks.length === 0 ? (
                    <Alert
                        message="No Tasks Created Yet"
                        description="Create tasks under this milestone or its sub-milestones."
                        type="info"
                        showIcon
                        action={
                            <Button
                                type="primary"
                                icon={<PlusOutlined />}
                                onClick={() => openTaskModal()}
                            >
                                Create First Task
                            </Button>
                        }
                    />
                ) : (
                    <Table
                        columns={taskColumns}
                        dataSource={tasks}
                        rowKey="_id"
                        loading={loading}
                        pagination={{
                            showSizeChanger: true,
                            showTotal: (total) => `Total ${total} tasks`
                        }}
                        scroll={{ x: 1200 }}
                        size="small"
                    />
                )}
            </Card>

            {/* Create Sub-Milestone Modal */}
            {/* <Modal
                title={
                    <Space>
                        <FolderOutlined />
                        {parentSubMilestone 
                            ? `Create Sub-Milestone under "${parentSubMilestone.title}"`
                            : 'Create Sub-Milestone'
                        }
                    </Space>
                }
                open={subMilestoneModalVisible}
                onCancel={() => {
                    setSubMilestoneModalVisible(false);
                    subMilestoneForm.resetFields();
                    setParentSubMilestone(null);
                }}
                footer={null}
                width={700}
                destroyOnClose
            >
                <Alert
                    message="Sub-Milestone Weight"
                    description={
                        parentSubMilestone
                            ? "Sub-milestones under a parent must sum to 100%."
                            : "Sub-milestones under the main milestone must sum to 100%."
                    }
                    type="info"
                    showIcon
                    style={{ marginBottom: 16 }}
                />

                <Form
                    form={subMilestoneForm}
                    layout="vertical"
                    onFinish={handleCreateSubMilestone}
                >
                    <Form.Item
                        name="title"
                        label="Sub-Milestone Title"
                        rules={[{ required: true, message: 'Please enter title' }]}
                    >
                        <Input placeholder="e.g., Phase 1 - Planning" />
                    </Form.Item>

                    <Form.Item
                        name="description"
                        label="Description"
                    >
                        <TextArea rows={3} placeholder="Describe this sub-milestone" />
                    </Form.Item>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                name="weight"
                                label="Weight (%)"
                                rules={[
                                    { required: true, message: 'Please enter weight' },
                                    { type: 'number', min: 1, max: 100, message: 'Weight must be 1-100' }
                                ]}
                            >
                                <InputNumber
                                    min={1}
                                    max={100}
                                    style={{ width: '100%' }}
                                    formatter={value => `${value}%`}
                                    parser={value => value.replace('%', '')}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name="dueDate"
                                label="Due Date"
                            >
                                <DatePicker style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item
                        name="assignedSupervisor"
                        label="Assigned Supervisor"
                        rules={[{ required: true, message: 'Please select supervisor' }]}
                    >
                        <Select
                            placeholder="Select supervisor"
                            showSearch
                            loading={usersLoading}
                            filterOption={(input, option) => {
                                const user = users.find(u => u._id === option.value);
                                if (!user) return false;
                                return (
                                    (user.fullName || user.name || '').toLowerCase().includes(input.toLowerCase()) ||
                                    (user.department || '').toLowerCase().includes(input.toLowerCase())
                                );
                            }}
                        >
                            {users.map(user => (
                                <Option key={user._id} value={user._id}>
                                    <div>
                                        <Text strong>{user.fullName || user.name}</Text>
                                        <br />
                                        <Text type="secondary" style={{ fontSize: '12px' }}>
                                            {user.position || user.role} | {user.department}
                                        </Text>
                                    </div>
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Form.Item>
                        <Space>
                            <Button onClick={() => {
                                setSubMilestoneModalVisible(false);
                                subMilestoneForm.resetFields();
                                setParentSubMilestone(null);
                            }}>
                                Cancel
                            </Button>
                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={loading}
                                icon={<PlusOutlined />}
                            >
                                Create Sub-Milestone
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal> */}


            <Modal
                title={
                    <Space>
                    <FolderOutlined />
                    {parentSubMilestone 
                        ? `Create Sub-Milestone under "${parentSubMilestone.title}"`
                        : 'Create Sub-Milestone'
                    }
                    </Space>
                }
                open={subMilestoneModalVisible}
                onCancel={() => {
                    setSubMilestoneModalVisible(false);
                    subMilestoneForm.resetFields();
                    setParentSubMilestone(null);
                    setCreatorKPIs(null);
                }}
                footer={null}
                width={850}
                destroyOnClose
                >
                <Alert
                    message="Sub-milestone Weight"
                    description={
                    parentSubMilestone
                        ? "Sub-milestones under a parent must sum to 100%."
                        : "Sub-milestones under the main milestone must sum to 100%."
                    }
                    type="info"
                    showIcon
                    style={{ marginBottom: 16 }}
                />

                <Form
                    form={subMilestoneForm}
                    layout="vertical"
                    onFinish={(values) => {
                    // Validate KPI contributions if any are selected
                    const selectedKPIs = values.selectedKPIs || [];
                    if (selectedKPIs.length > 0) {
                        let total = 0;
                        selectedKPIs.forEach(idx => {
                        total += values[`contribution_${idx}`] || 0;
                        });
                        
                        if (total !== 100) {
                        message.error(`KPI contribution weights must sum to 100%. Current total: ${total}%`);
                        return;
                        }
                    }
                    
                    handleCreateSubMilestone(values);
                    }}
                >
                    <Form.Item
                    name="title"
                    label="Sub-Milestone Title"
                    rules={[{ required: true, message: 'Please enter title' }]}
                    >
                    <Input placeholder="e.g., Phase 1 - Planning" />
                    </Form.Item>

                    <Form.Item
                    name="description"
                    label="Description"
                    >
                    <TextArea rows={3} placeholder="Describe this sub-milestone" />
                    </Form.Item>

                    <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item
                        name="weight"
                        label="Weight (%)"
                        rules={[
                            { required: true, message: 'Please enter weight' },
                            { type: 'number', min: 1, max: 100, message: 'Weight must be 1-100' }
                        ]}
                        >
                        <InputNumber
                            min={1}
                            max={100}
                            style={{ width: '100%' }}
                            formatter={value => `${value}%`}
                            parser={value => value.replace('%', '')}
                        />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                        name="dueDate"
                        label="Due Date"
                        >
                        <DatePicker style={{ width: '100%' }} />
                        </Form.Item>
                    </Col>
                    </Row>

                    <Form.Item
                    name="assignedSupervisor"
                    label="Assigned Supervisor"
                    rules={[{ required: true, message: 'Please select supervisor' }]}
                    >
                    <Select
                        placeholder="Select supervisor"
                        showSearch
                        loading={usersLoading}
                        filterOption={(input, option) => {
                        const user = users.find(u => u._id === option.value);
                        if (!user) return false;
                        return (
                            (user.fullName || user.name || '').toLowerCase().includes(input.toLowerCase()) ||
                            (user.department || '').toLowerCase().includes(input.toLowerCase())
                        );
                        }}
                    >
                        {users.map(user => (
                        <Option key={user._id} value={user._id}>
                            <div>
                            <Text strong>{user.fullName || user.name}</Text>
                            <br />
                            <Text type="secondary" style={{ fontSize: '12px' }}>
                                {user.position || user.role} | {user.department}
                            </Text>
                            </div>
                        </Option>
                        ))}
                    </Select>
                    </Form.Item>

                    <Divider />

                    {/* KPI Linking Section */}
                    <Card 
                    size="small" 
                    title={
                        <Space>
                        <TrophyOutlined />
                        <Text strong>Link to My KPIs (Optional)</Text>
                        </Space>
                    }
                    style={{ marginBottom: 16 }}
                    >
                    {loadingKPIs ? (
                        <div style={{ textAlign: 'center', padding: '20px' }}>
                        <Spin />
                        </div>
                    ) : !creatorKPIs || creatorKPIs.kpis.length === 0 ? (
                        <Alert
                        message="No Approved KPIs"
                        description="You don't have any approved KPIs for the current quarter."
                        type="warning"
                        showIcon
                        />
                    ) : (
                        <>
                        <Alert
                            message="How it works"
                            description="Select KPIs that this sub-milestone contributes to. When the sub-milestone progresses, your selected KPIs will be automatically updated. Total contribution must equal 100%."
                            type="info"
                            showIcon
                            style={{ marginBottom: 16 }}
                        />

                        <Form.Item name="selectedKPIs" noStyle>
                            <Checkbox.Group style={{ width: '100%' }}>
                            {creatorKPIs.kpis.map((kpi, index) => (
                                <Card 
                                key={index}
                                size="small" 
                                style={{ marginBottom: 12, backgroundColor: '#fafafa' }}
                                >
                                <Row gutter={16} align="middle">
                                    <Col span={14}>
                                    <Checkbox value={index}>
                                        <Space direction="vertical" size={0}>
                                        <Text strong>{kpi.title}</Text>
                                        <Text type="secondary" style={{ fontSize: '12px' }}>
                                            {kpi.description.substring(0, 80)}...
                                        </Text>
                                        <Space>
                                            <Tag color="blue">Weight: {kpi.weight}%</Tag>
                                            <Tag color="green">Current: {kpi.progress}%</Tag>
                                        </Space>
                                        </Space>
                                    </Checkbox>
                                    </Col>
                                    <Col span={10}>
                                    <Form.Item
                                        noStyle
                                        shouldUpdate={(prevValues, currentValues) => 
                                        prevValues.selectedKPIs !== currentValues.selectedKPIs
                                        }
                                    >
                                        {({ getFieldValue }) => {
                                        const selectedKPIs = getFieldValue('selectedKPIs') || [];
                                        return selectedKPIs.includes(index) ? (
                                            <Form.Item
                                            name={`contribution_${index}`}
                                            label="Contribution %"
                                            rules={[
                                                { required: true, message: 'Required' },
                                                { type: 'number', min: 1, max: 100, message: '1-100' }
                                            ]}
                                            style={{ marginBottom: 0 }}
                                            >
                                            <InputNumber
                                                min={1}
                                                max={100}
                                                style={{ width: '100%' }}
                                                formatter={value => `${value}%`}
                                                parser={value => value.replace('%', '')}
                                                placeholder="e.g., 30"
                                            />
                                            </Form.Item>
                                        ) : null;
                                        }}
                                    </Form.Item>
                                    </Col>
                                </Row>
                                </Card>
                            ))}
                            </Checkbox.Group>
                        </Form.Item>

                        <Form.Item
                            noStyle
                            shouldUpdate={(prevValues, currentValues) => 
                            prevValues.selectedKPIs !== currentValues.selectedKPIs ||
                            Object.keys(prevValues).some(key => 
                                key.startsWith('contribution_') && 
                                prevValues[key] !== currentValues[key]
                            )
                            }
                        >
                            {({ getFieldValue }) => {
                            const selectedKPIs = getFieldValue('selectedKPIs') || [];
                            if (selectedKPIs.length === 0) return null;

                            let total = 0;
                            selectedKPIs.forEach(idx => {
                                total += getFieldValue(`contribution_${idx}`) || 0;
                            });

                            return (
                                <Card 
                                size="small"
                                style={{ 
                                    backgroundColor: total === 100 ? '#f6ffed' : '#fff2e8',
                                    borderColor: total === 100 ? '#52c41a' : '#fa8c16',
                                    marginTop: 12
                                }}
                                >
                                <Row justify="space-between" align="middle">
                                    <Col>
                                    <Space>
                                        {total === 100 ? (
                                        <CheckCircleOutlined style={{ color: '#52c41a', fontSize: '20px' }} />
                                        ) : (
                                        <WarningOutlined style={{ color: '#fa8c16', fontSize: '20px' }} />
                                        )}
                                        <Text strong>Total Contribution:</Text>
                                    </Space>
                                    </Col>
                                    <Col>
                                    <Tag 
                                        color={total === 100 ? 'success' : 'warning'}
                                        style={{ fontSize: '16px', padding: '4px 12px' }}
                                    >
                                        {total}%
                                    </Tag>
                                    </Col>
                                </Row>
                                {total !== 100 && (
                                    <Text type="warning" style={{ fontSize: '12px', display: 'block', marginTop: 8 }}>
                                    Must total 100% to create with KPI links
                                    </Text>
                                )}
                                </Card>
                            );
                            }}
                        </Form.Item>
                        </>
                    )}
                    </Card>

                    <Form.Item>
                    <Space>
                        <Button onClick={() => {
                        setSubMilestoneModalVisible(false);
                        subMilestoneForm.resetFields();
                        setParentSubMilestone(null);
                        setCreatorKPIs(null);
                        }}>
                        Cancel
                        </Button>
                        <Button
                        type="primary"
                        htmlType="submit"
                        loading={loading}
                        icon={<PlusOutlined />}
                        >
                        Create Sub-Milestone
                        </Button>
                    </Space>
                    </Form.Item>
                </Form>
            </Modal>

            {/* Create Task Modal */}
            <Modal
                title={
                    <Space>
                        <FileOutlined />
                        {selectedSubMilestone 
                            ? `Create Task under "${selectedSubMilestone.title}"`
                            : 'Create Task under Milestone'
                        }
                    </Space>
                }
                open={taskModalVisible}
                onCancel={() => {
                    setTaskModalVisible(false);
                    form.resetFields();
                    setSelectedAssignees([]);
                    setAssigneeKPIs({});
                    setSelectedSubMilestone(null);
                }}
                footer={null}
                width={900}
                destroyOnClose
            >
                <Alert
                    message="Task Weight Management"
                    description="Tasks must sum to 100% of the parent milestone/sub-milestone weight."
                    type="info"
                    showIcon
                    style={{ marginBottom: 16 }}
                />

                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleCreateTask}
                >
                    <Form.Item
                        name="title"
                        label="Task Title"
                        rules={[{ required: true, message: 'Please enter task title' }]}
                    >
                        <Input placeholder="e.g., Configure network infrastructure" />
                    </Form.Item>

                    <Form.Item
                        name="description"
                        label="Description"
                        rules={[{ required: true, message: 'Please enter description' }]}
                    >
                        <TextArea rows={3} placeholder="Detailed task description" />
                    </Form.Item>

                    <Row gutter={16}>
                        <Col span={8}>
                            <Form.Item
                                name="priority"
                                label="Priority"
                                rules={[{ required: true, message: 'Please select priority' }]}
                            >
                                <Select placeholder="Select priority">
                                    <Option value="LOW">🟢 Low</Option>
                                    <Option value="MEDIUM">🟡 Medium</Option>
                                    <Option value="HIGH">🟠 High</Option>
                                    <Option value="CRITICAL">🔴 Critical</Option>
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item
                                name="taskWeight"
                                label="Task Weight (%)"
                                rules={[{ required: true, message: 'Please enter task weight' }]}
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
                        <Col span={8}>
                            <Form.Item
                                name="dueDate"
                                label="Due Date"
                                rules={[{ required: true, message: 'Please select due date' }]}
                            >
                                <DatePicker style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item
                        name="assignedTo"
                        label="Assign To (Optional - leave empty to assign to yourself)"
                    >
                        <Select
                            mode="multiple"
                            placeholder="Select assignees"
                            loading={usersLoading}
                            showSearch
                            onChange={handleAssigneeChange}
                            filterOption={(input, option) => {
                                const user = users.find(u => u._id === option.value);
                                if (!user) return false;
                                return (
                                    (user.fullName || user.name || '').toLowerCase().includes(input.toLowerCase()) ||
                                    (user.department || '').toLowerCase().includes(input.toLowerCase())
                                );
                            }}
                        >
                            {users.map(user => (
                                <Option key={user._id} value={user._id}>
                                    <div>
                                        <Text strong>{user.fullName || user.name}</Text>
                                        <br />
                                        <Text type="secondary" style={{ fontSize: '12px' }}>
                                            {user.position || user.role} | {user.department}
                                        </Text>
                                    </div>
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>

                    {/* KPI Selection for Each Assignee */}
                    {selectedAssignees.length > 0 && (
                        <Card size="small" title={<><TrophyOutlined /> Link to KPIs</>} style={{ marginBottom: 16 }}>
                            <Alert
                                message="KPI Linkage Required"
                                description="Each assignee must have at least one KPI selected."
                                type="warning"
                                showIcon
                                style={{ marginBottom: 16 }}
                            />
                            
                            {selectedAssignees.map(userId => {
                                const user = users.find(u => u._id === userId);
                                const userKPIs = assigneeKPIs[userId];
                                const isLoading = loadingKPIs[userId];

                                return (
                                    <Card 
                                        key={userId} 
                                        size="small" 
                                        style={{ marginBottom: 12, backgroundColor: '#fafafa' }}
                                        title={
                                            <Space>
                                                <Avatar size="small" icon={<UserOutlined />} />
                                                <Text strong>{user?.fullName || user?.name}</Text>
                                            </Space>
                                        }
                                    >
                                        {isLoading ? (
                                            <Spin size="small" />
                                        ) : userKPIs && userKPIs.kpis && userKPIs.kpis.length > 0 ? (
                                            <Form.Item
                                                name={`kpis_${userId}`}
                                                label="Select KPIs"
                                                rules={[{ required: true, message: 'Please select at least one KPI' }]}
                                            >
                                                <Select
                                                    mode="multiple"
                                                    placeholder="Select KPIs"
                                                >
                                                    {userKPIs.kpis.map((kpi, index) => (
                                                        <Option key={index} value={index}>
                                                            <div>
                                                                <Text strong>{kpi.title}</Text>
                                                                <Tag color="blue" style={{ marginLeft: 8 }}>
                                                                    {kpi.weight}%
                                                                </Tag>
                                                                <br />
                                                                <Text type="secondary" style={{ fontSize: '12px' }}>
                                                                    {kpi.description.substring(0, 50)}...
                                                                </Text>
                                                            </div>
                                                        </Option>
                                                    ))}
                                                </Select>
                                            </Form.Item>
                                        ) : (
                                            <Alert
                                                message="No Approved KPIs"
                                                description="This user has no approved KPIs for the current quarter."
                                                type="error"
                                                showIcon
                                            />
                                        )}
                                    </Card>
                                );
                            })}
                        </Card>
                    )}

                    <Form.Item
                        name="notes"
                        label="Notes"
                    >
                        <TextArea rows={2} placeholder="Additional notes or instructions" />
                    </Form.Item>

                    <Form.Item>
                        <Space>
                            <Button onClick={() => {
                                setTaskModalVisible(false);
                                form.resetFields();
                                setSelectedAssignees([]);
                                setAssigneeKPIs({});
                                setSelectedSubMilestone(null);
                            }}>
                                Cancel
                            </Button>
                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={loading}
                                icon={<PlusOutlined />}
                            >
                                Create Task
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default SupervisorMilestoneDetail;












// import React, { useState, useEffect } from 'react';
// import { useParams, useNavigate } from 'react-router-dom';
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
//     DatePicker,
//     InputNumber,
//     Descriptions,
//     Alert,
//     Spin,
//     message,
//     Progress,
//     Row,
//     Col,
//     Statistic,
//     Divider,
//     Tooltip,
//     Avatar,
//     Badge
// } from 'antd';
// import {
//     ArrowLeftOutlined,
//     PlusOutlined,
//     EditOutlined,
//     DeleteOutlined,
//     FlagOutlined,
//     UserOutlined,
//     ReloadOutlined,
//     CheckCircleOutlined,
//     WarningOutlined,
//     TrophyOutlined
// } from '@ant-design/icons';
// import moment from 'moment';
// import api from '../../services/api';
// import { kpiAPI } from '../../services/kpiAPI';

// const { Title, Text, Paragraph } = Typography;
// const { TextArea } = Input;
// const { Option } = Select;

// const SupervisorMilestoneDetail = () => {
//     const { projectId, milestoneId } = useParams();
//     const navigate = useNavigate();
//     const [loading, setLoading] = useState(false);
//     const [milestoneData, setMilestoneData] = useState(null);
//     const [tasks, setTasks] = useState([]);
//     const [stats, setStats] = useState(null);
//     const [taskModalVisible, setTaskModalVisible] = useState(false);
//     const [editingTask, setEditingTask] = useState(null);
//     const [form] = Form.useForm();
//     const [users, setUsers] = useState([]);
//     const [usersLoading, setUsersLoading] = useState(false);
//     const [selectedAssignees, setSelectedAssignees] = useState([]);
//     const [assigneeKPIs, setAssigneeKPIs] = useState({});
//     const [loadingKPIs, setLoadingKPIs] = useState({});

//     useEffect(() => {
//         fetchMilestoneDetails();
//         fetchUsers();
//     }, [projectId, milestoneId]);

//     const fetchMilestoneDetails = async () => {
//         try {
//             setLoading(true);
//             const response = await api.get(`/projects/${projectId}/milestones/${milestoneId}`);

//             if (response.data.success) {
//                 setMilestoneData(response.data.data);
//                 setTasks(response.data.data.tasks || []);
//                 setStats(response.data.data.stats || {});
//             } else {
//                 message.error(response.data.message || 'Failed to fetch milestone details');
//             }
//         } catch (error) {
//             console.error('Error fetching milestone details:', error);
//             message.error('Failed to load milestone details');
//         } finally {
//             setLoading(false);
//         }
//     };

//     const fetchUsers = async () => {
//         try {
//             setUsersLoading(true);
            
//             // Try database users first
//             try {
//                 const response = await api.get('/auth/active-users');

//                 if (response.data.success && response.data.data && response.data.data.length > 0) {
//                     setUsers(response.data.data);
//                     return;
//                 }
//             } catch (error) {
//                 console.log('Database users not available');
//             }

//             // Fallback to department structure
//             const { getAllEmployees } = require('../../utils/departmentStructure');
//             const allEmployees = getAllEmployees();

//             const formattedUsers = allEmployees
//                 .filter(emp => emp.name && emp.email)
//                 .map((emp, idx) => ({
//                     _id: `emp_${idx}_${emp.email}`,
//                     id: emp.email,
//                     fullName: emp.name,
//                     name: emp.name,
//                     email: emp.email,
//                     position: emp.position,
//                     department: emp.department,
//                     role: emp.role || 'employee',
//                     isActive: true
//                 }))
//                 .sort((a, b) => a.fullName.localeCompare(b.fullName));

//             setUsers(formattedUsers);

//         } catch (error) {
//             console.error('Error loading users:', error);
//             setUsers([]);
//         } finally {
//             setUsersLoading(false);
//         }
//     };

//     const fetchUserKPIs = async (userId) => {
//         if (assigneeKPIs[userId]) {
//             console.log('KPIs already cached for user:', userId);
//             return; // Already loaded
//         }

//         const user = users.find(u => u._id === userId);
//         console.log('=== Fetching KPIs ===');
//         console.log('User ID:', userId);
//         console.log('User Name:', user?.fullName);
//         console.log('User Email:', user?.email);

//         try {
//             setLoadingKPIs(prev => ({ ...prev, [userId]: true }));
            
//             // Pass the userId to fetch that user's KPIs
//             const result = await kpiAPI.getApprovedKPIsForLinking(userId);
            
//             console.log('KPI Fetch Result:', result);
            
//             if (result.success && result.data && result.data.kpis && result.data.kpis.length > 0) {
//                 console.log('✅ KPIs Found:', {
//                     count: result.data.kpis.length,
//                     quarter: result.data.quarter,
//                     totalWeight: result.data.totalWeight,
//                     employee: result.data.employee?.fullName
//                 });
                
//                 setAssigneeKPIs(prev => ({
//                     ...prev,
//                     [userId]: result.data
//                 }));
                
//                 message.success(`Loaded ${result.data.kpis.length} KPIs for ${user?.fullName || 'user'}`);
//             } else {
//                 console.log('⚠️ No KPIs found:', result.message);
//                 setAssigneeKPIs(prev => ({
//                     ...prev,
//                     [userId]: null
//                 }));
                
//                 message.warning(
//                     result.message || 
//                     `${user?.fullName || 'User'} has no approved KPIs for Q4-2025. They need to create and get their KPIs approved first.`,
//                     5
//                 );
//             }
//         } catch (error) {
//             console.error('❌ Error fetching user KPIs:', error);
//             setAssigneeKPIs(prev => ({
//                 ...prev,
//                 [userId]: null
//             }));
//             message.error(`Failed to fetch KPIs for ${user?.fullName || 'user'}: ${error.message}`);
//         } finally {
//             setLoadingKPIs(prev => ({ ...prev, [userId]: false }));
//         }
//     };

//     const handleAssigneeChange = (assigneeIds) => {
//         setSelectedAssignees(assigneeIds);
        
//         // Fetch KPIs for each newly selected assignee
//         assigneeIds.forEach(userId => {
//             if (!assigneeKPIs[userId] && !loadingKPIs[userId]) {
//                 fetchUserKPIs(userId);
//             }
//         });
//     };

//     const handleCreateTask = async (values) => {
//         try {
//             setLoading(true);

//             console.log('Creating task with values:', values);

//             // Validate required fields
//             if (!values.title || !values.description || !values.priority || !values.dueDate || !values.taskWeight) {
//                 message.error('Please fill in all required fields');
//                 return;
//             }

//             // Validate assignees and KPIs
//             if (!values.assignedTo || values.assignedTo.length === 0) {
//                 // No assignees = task belongs to supervisor
//                 message.info('No assignees selected - task will be assigned to you');
//             } else {
//                 // Validate each assignee has selected KPI
//                 for (const userId of values.assignedTo) {
//                     const userKPISelections = values[`kpis_${userId}`];
//                     if (!userKPISelections || userKPISelections.length === 0) {
//                         const user = users.find(u => u._id === userId);
//                         message.error(`Please select at least one KPI for ${user?.fullName || 'assignee'}`);
//                         return;
//                     }
//                 }
//             }

//             // Build linkedKPIs array
//             const linkedKPIs = [];
//             if (values.assignedTo && values.assignedTo.length > 0) {
//                 for (const userId of values.assignedTo) {
//                     const userKPISelections = values[`kpis_${userId}`] || [];
//                     const userKPIDoc = assigneeKPIs[userId];
                    
//                     if (userKPIDoc) {
//                         userKPISelections.forEach(kpiIndex => {
//                             linkedKPIs.push({
//                                 userId,
//                                 kpiDocId: userKPIDoc._id,
//                                 kpiIndex
//                             });
//                         });
//                     }
//                 }
//             }

//             const taskData = {
//                 projectId,
//                 milestoneId,
//                 title: values.title,
//                 description: values.description,
//                 priority: values.priority,
//                 dueDate: values.dueDate.format('YYYY-MM-DD'),
//                 taskWeight: values.taskWeight,
//                 assignedTo: values.assignedTo || [],
//                 linkedKPIs,
//                 notes: values.notes || ''
//             };

//             console.log('Task data to send:', taskData);

//             const response = await api.post('/action-items/milestone/task', taskData);

//             if (response.data.success) {
//                 message.success('Task created successfully under milestone!');
//                 setTaskModalVisible(false);
//                 form.resetFields();
//                 setSelectedAssignees([]);
//                 setAssigneeKPIs({});
//                 fetchMilestoneDetails();
//             } else {
//                 message.error(response.data.message || 'Failed to create task');
//             }
//         } catch (error) {
//             console.error('Error creating task:', error);
//             message.error('Failed to create task');
//         } finally {
//             setLoading(false);
//         }
//     };

//     const handleReassignTask = async (taskId) => {
//         // TODO: Implement task reassignment
//         message.info('Task reassignment feature coming soon');
//     };

//     const handleDeleteTask = (taskId) => {
//         Modal.confirm({
//             title: 'Delete Task',
//             content: 'Are you sure you want to delete this task? This action cannot be undone.',
//             okText: 'Delete',
//             okType: 'danger',
//             onOk: async () => {
//                 try {
//                     const response = await api.delete(`/action-items/${taskId}`);
                    
//                     if (response.data.success) {
//                         message.success('Task deleted successfully');
//                         fetchMilestoneDetails();
//                     } else {
//                         message.error(response.data.message || 'Failed to delete task');
//                     }
//                 } catch (error) {
//                     console.error('Error deleting task:', error);
//                     message.error('Failed to delete task');
//                 }
//             }
//         });
//     };

//     const getPriorityColor = (priority) => {
//         const colors = {
//             'LOW': 'green',
//             'MEDIUM': 'blue',
//             'HIGH': 'orange',
//             'CRITICAL': 'red'
//         };
//         return colors[priority] || 'default';
//     };

//     const getStatusColor = (status) => {
//         const colors = {
//             'Not Started': 'default',
//             'In Progress': 'processing',
//             'Pending Approval': 'warning',
//             'Pending Completion Approval': 'cyan',
//             'Completed': 'success',
//             'On Hold': 'warning',
//             'Rejected': 'error'
//         };
//         return colors[status] || 'default';
//     };

//     const taskColumns = [
//         {
//             title: 'Task',
//             key: 'task',
//             render: (_, record) => (
//                 <div>
//                     <Text strong>{record.title}</Text>
//                     <br />
//                     <Text type="secondary" style={{ fontSize: '12px' }}>
//                         {record.description?.substring(0, 60)}...
//                     </Text>
//                     <br />
//                     <Tag size="small" color={getPriorityColor(record.priority)} icon={<FlagOutlined />}>
//                         {record.priority}
//                     </Tag>
//                     <Tag size="small" color="blue">
//                         Weight: {record.taskWeight}%
//                     </Tag>
//                 </div>
//             ),
//             width: 300
//         },
//         {
//             title: 'Assignees',
//             key: 'assignees',
//             render: (_, record) => (
//                 <div>
//                     {record.assignedTo && record.assignedTo.length > 0 ? (
//                         <>
//                             {record.assignedTo.slice(0, 2).map((assignee, idx) => (
//                                 <div key={idx} style={{ marginBottom: 4 }}>
//                                     <Avatar size="small" icon={<UserOutlined />} style={{ marginRight: 4 }} />
//                                     <Text style={{ fontSize: '12px' }}>
//                                         {assignee.user?.fullName || 'Unknown'}
//                                     </Text>
//                                     <Tag size="small" color={
//                                         assignee.completionStatus === 'approved' ? 'green' :
//                                         assignee.completionStatus === 'submitted' ? 'blue' :
//                                         assignee.completionStatus === 'rejected' ? 'red' :
//                                         'default'
//                                     } style={{ marginLeft: 4 }}>
//                                         {assignee.completionStatus}
//                                     </Tag>
//                                 </div>
//                             ))}
//                             {record.assignedTo.length > 2 && (
//                                 <Text type="secondary" style={{ fontSize: '11px' }}>
//                                     +{record.assignedTo.length - 2} more
//                                 </Text>
//                             )}
//                         </>
//                     ) : (
//                         <Text type="secondary">Unassigned</Text>
//                     )}
//                 </div>
//             ),
//             width: 200
//         },
//         {
//             title: 'Progress',
//             key: 'progress',
//             render: (_, record) => (
//                 <Progress 
//                     percent={record.progress || 0} 
//                     size="small"
//                     status={record.progress === 100 ? 'success' : 'active'}
//                 />
//             ),
//             width: 120
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
//             width: 150
//         },
//         {
//             title: 'Due Date',
//             key: 'dueDate',
//             render: (_, record) => {
//                 const isOverdue = moment(record.dueDate).isBefore(moment()) && record.status !== 'Completed';
//                 return (
//                     <div>
//                         <Text type={isOverdue ? 'danger' : 'secondary'}>
//                             {moment(record.dueDate).format('MMM DD, YYYY')}
//                         </Text>
//                         {isOverdue && (
//                             <>
//                                 <br />
//                                 <Tag color="red" size="small">Overdue</Tag>
//                             </>
//                         )}
//                     </div>
//                 );
//             },
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
//                             icon={<EditOutlined />}
//                             onClick={() => navigate(`/supervisor/task/${record._id}`)}
//                         />
//                     </Tooltip>
//                     {['Not Started', 'In Progress'].includes(record.status) && (
//                         <Tooltip title="Delete">
//                             <Button
//                                 size="small"
//                                 danger
//                                 icon={<DeleteOutlined />}
//                                 onClick={() => handleDeleteTask(record._id)}
//                             />
//                         </Tooltip>
//                     )}
//                 </Space>
//             ),
//             width: 100,
//             fixed: 'right'
//         }
//     ];

//     if (loading && !milestoneData) {
//         return (
//             <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
//                 <Spin size="large" />
//             </div>
//         );
//     }

//     if (!milestoneData) {
//         return (
//             <div style={{ padding: '24px' }}>
//                 <Alert
//                     message="Milestone Not Found"
//                     description="The milestone you are trying to access does not exist or you don't have permission to view it."
//                     type="error"
//                     showIcon
//                 />
//             </div>
//         );
//     }

//     return (
//         <div style={{ padding: '24px' }}>
//             <Card>
//                 <div style={{ 
//                     display: 'flex', 
//                     justifyContent: 'space-between', 
//                     alignItems: 'center',
//                     marginBottom: '24px'
//                 }}>
//                     <Space>
//                         <Button
//                             icon={<ArrowLeftOutlined />}
//                             onClick={() => navigate('/supervisor/milestones')}
//                         >
//                             Back to Milestones
//                         </Button>
//                         <Title level={3} style={{ margin: 0 }}>
//                             <FlagOutlined /> {milestoneData.milestone.title}
//                         </Title>
//                     </Space>
//                     <Space>
//                         <Button
//                             icon={<ReloadOutlined />}
//                             onClick={fetchMilestoneDetails}
//                             loading={loading}
//                         >
//                             Refresh
//                         </Button>
//                         <Button
//                             type="primary"
//                             icon={<PlusOutlined />}
//                             onClick={() => setTaskModalVisible(true)}
//                             disabled={stats?.weightRemaining <= 0}
//                         >
//                             Create Task
//                         </Button>
//                     </Space>
//                 </div>

//                 {/* Milestone Info Card */}
//                 <Card size="small" style={{ marginBottom: '24px', backgroundColor: '#f0f8ff' }}>
//                     <Row gutter={16}>
//                         <Col span={24}>
//                             <Descriptions bordered column={3} size="small">
//                                 <Descriptions.Item label="Project">
//                                     <Text strong>{milestoneData.project.name}</Text>
//                                 </Descriptions.Item>
//                                 <Descriptions.Item label="Milestone Weight">
//                                     <Tag color="blue">{milestoneData.milestone.weight}%</Tag>
//                                 </Descriptions.Item>
//                                 <Descriptions.Item label="Status">
//                                     <Tag color={
//                                         milestoneData.milestone.status === 'Completed' ? 'green' :
//                                         milestoneData.milestone.status === 'In Progress' ? 'blue' :
//                                         'default'
//                                     }>
//                                         {milestoneData.milestone.status}
//                                     </Tag>
//                                 </Descriptions.Item>
//                                 <Descriptions.Item label="Description" span={3}>
//                                     <Paragraph style={{ margin: 0 }}>
//                                         {milestoneData.milestone.description || 'No description provided'}
//                                     </Paragraph>
//                                 </Descriptions.Item>
//                             </Descriptions>
//                         </Col>
//                     </Row>
//                 </Card>

//                 {/* Statistics Card */}
//                 <Card size="small" style={{ marginBottom: '24px' }}>
//                     <Row gutter={16}>
//                         <Col span={6}>
//                             <Statistic
//                                 title="Progress"
//                                 value={milestoneData.milestone.progress || 0}
//                                 suffix="%"
//                                 valueStyle={{ color: '#1890ff' }}
//                             />
//                             <Progress 
//                                 percent={milestoneData.milestone.progress || 0} 
//                                 size="small"
//                                 style={{ marginTop: 8 }}
//                             />
//                         </Col>
//                         <Col span={6}>
//                             <Statistic
//                                 title="Total Tasks"
//                                 value={stats?.totalTasks || 0}
//                             />
//                         </Col>
//                         <Col span={6}>
//                             <Statistic
//                                 title="Completed Tasks"
//                                 value={stats?.completedTasks || 0}
//                                 valueStyle={{ color: '#52c41a' }}
//                             />
//                         </Col>
//                         <Col span={6}>
//                             <Statistic
//                                 title="Task Weight Assigned"
//                                 value={`${stats?.totalWeightAssigned || 0}%`}
//                                 suffix="/ 100%"
//                             />
//                             {stats?.weightRemaining > 0 && (
//                                 <Alert
//                                     message={`${stats.weightRemaining}% unassigned`}
//                                     type="warning"
//                                     showIcon
//                                     style={{ marginTop: 8 }}
//                                 />
//                             )}
//                         </Col>
//                     </Row>
//                 </Card>

//                 <Divider />

//                 {/* Tasks Table */}
//                 <Title level={4}>Tasks Under This Milestone</Title>
//                 {tasks.length === 0 ? (
//                     <Alert
//                         message="No Tasks Created Yet"
//                         description="Create tasks and assign them to team members. The sum of task weights should equal 100% for accurate milestone progress tracking."
//                         type="info"
//                         showIcon
//                         action={
//                             <Button
//                                 type="primary"
//                                 icon={<PlusOutlined />}
//                                 onClick={() => setTaskModalVisible(true)}
//                             >
//                                 Create First Task
//                             </Button>
//                         }
//                     />
//                 ) : (
//                     <Table
//                         columns={taskColumns}
//                         dataSource={tasks}
//                         rowKey="_id"
//                         loading={loading}
//                         pagination={{
//                             showSizeChanger: true,
//                             showTotal: (total) => `Total ${total} tasks`
//                         }}
//                         scroll={{ x: 1200 }}
//                         size="small"
//                     />
//                 )}
//             </Card>

//             {/* Create Task Modal */}
//             <Modal
//                 title={
//                     <Space>
//                         <PlusOutlined />
//                         Create Task Under Milestone
//                     </Space>
//                 }
//                 open={taskModalVisible}
//                 onCancel={() => {
//                     setTaskModalVisible(false);
//                     form.resetFields();
//                     setSelectedAssignees([]);
//                     setAssigneeKPIs({});
//                 }}
//                 footer={null}
//                 width={900}
//                 destroyOnClose
//             >
//                 <Alert
//                     message="Task Weight Management"
//                     description={`Available weight: ${stats?.weightRemaining || 0}%. The sum of all task weights under this milestone must equal 100% for accurate progress tracking.`}
//                     type="info"
//                     showIcon
//                     style={{ marginBottom: 16 }}
//                 />

//                 <Form
//                     form={form}
//                     layout="vertical"
//                     onFinish={handleCreateTask}
//                 >
//                     <Form.Item
//                         name="title"
//                         label="Task Title"
//                         rules={[{ required: true, message: 'Please enter task title' }]}
//                     >
//                         <Input placeholder="e.g., Configure network infrastructure" />
//                     </Form.Item>

//                     <Form.Item
//                         name="description"
//                         label="Description"
//                         rules={[{ required: true, message: 'Please enter description' }]}
//                     >
//                         <TextArea rows={3} placeholder="Detailed task description" />
//                     </Form.Item>

//                     <Row gutter={16}>
//                         <Col span={8}>
//                             <Form.Item
//                                 name="priority"
//                                 label="Priority"
//                                 rules={[{ required: true, message: 'Please select priority' }]}
//                             >
//                                 <Select placeholder="Select priority">
//                                     <Option value="LOW">🟢 Low</Option>
//                                     <Option value="MEDIUM">🟡 Medium</Option>
//                                     <Option value="HIGH">🟠 High</Option>
//                                     <Option value="CRITICAL">🔴 Critical</Option>
//                                 </Select>
//                             </Form.Item>
//                         </Col>
//                         <Col span={8}>
//                             <Form.Item
//                                 name="taskWeight"
//                                 label="Task Weight (%)"
//                                 rules={[
//                                     { required: true, message: 'Please enter task weight' },
//                                     { 
//                                         validator: (_, value) => {
//                                             if (value && value > (stats?.weightRemaining || 0)) {
//                                                 return Promise.reject(`Cannot exceed available weight: ${stats?.weightRemaining || 0}%`);
//                                             }
//                                             return Promise.resolve();
//                                         }
//                                     }
//                                 ]}
//                             >
//                                 <InputNumber
//                                     min={0}
//                                     max={100}
//                                     style={{ width: '100%' }}
//                                     formatter={value => `${value}%`}
//                                     parser={value => value.replace('%', '')}
//                                 />
//                             </Form.Item>
//                         </Col>
//                         <Col span={8}>
//                             <Form.Item
//                                 name="dueDate"
//                                 label="Due Date"
//                                 rules={[{ required: true, message: 'Please select due date' }]}
//                             >
//                                 <DatePicker style={{ width: '100%' }} />
//                             </Form.Item>
//                         </Col>
//                     </Row>

//                     <Form.Item
//                         name="assignedTo"
//                         label="Assign To (Optional - leave empty to assign to yourself)"
//                     >
//                         <Select
//                             mode="multiple"
//                             placeholder="Select assignees"
//                             loading={usersLoading}
//                             showSearch
//                             onChange={handleAssigneeChange}
//                             filterOption={(input, option) => {
//                                 const user = users.find(u => u._id === option.value);
//                                 if (!user) return false;
//                                 return (
//                                     (user.fullName || user.name || '').toLowerCase().includes(input.toLowerCase()) ||
//                                     (user.department || '').toLowerCase().includes(input.toLowerCase())
//                                 );
//                             }}
//                         >
//                             {users.map(user => (
//                                 <Option key={user._id} value={user._id}>
//                                     <div>
//                                         <Text strong>{user.fullName || user.name}</Text>
//                                         <br />
//                                         <Text type="secondary" style={{ fontSize: '12px' }}>
//                                             {user.position || user.role} | {user.department}
//                                         </Text>
//                                     </div>
//                                 </Option>
//                             ))}
//                         </Select>
//                     </Form.Item>

//                     {/* KPI Selection for Each Assignee */}
//                     {selectedAssignees.length > 0 && (
//                         <Card size="small" title={<><TrophyOutlined /> Link to KPIs</>} style={{ marginBottom: 16 }}>
//                             <Alert
//                                 message="KPI Linkage Required"
//                                 description="Each assignee must have at least one KPI selected. Task completion will contribute to the linked KPIs."
//                                 type="warning"
//                                 showIcon
//                                 style={{ marginBottom: 16 }}
//                             />
                            
//                             {selectedAssignees.map(userId => {
//                                 const user = users.find(u => u._id === userId);
//                                 const userKPIs = assigneeKPIs[userId];
//                                 const isLoading = loadingKPIs[userId];

//                                 return (
//                                     <Card 
//                                         key={userId} 
//                                         size="small" 
//                                         style={{ marginBottom: 12, backgroundColor: '#fafafa' }}
//                                         title={
//                                             <Space>
//                                                 <Avatar size="small" icon={<UserOutlined />} />
//                                                 <Text strong>{user?.fullName || user?.name}</Text>
//                                             </Space>
//                                         }
//                                     >
//                                         {isLoading ? (
//                                             <Spin size="small" />
//                                         ) : userKPIs && userKPIs.kpis && userKPIs.kpis.length > 0 ? (
//                                             <Form.Item
//                                                 name={`kpis_${userId}`}
//                                                 label="Select KPIs"
//                                                 rules={[{ required: true, message: 'Please select at least one KPI' }]}
//                                             >
//                                                 <Select
//                                                     mode="multiple"
//                                                     placeholder="Select KPIs"
//                                                 >
//                                                     {userKPIs.kpis.map((kpi, index) => (
//                                                         <Option key={index} value={index}>
//                                                             <div>
//                                                                 <Text strong>{kpi.title}</Text>
//                                                                 <Tag color="blue" style={{ marginLeft: 8 }}>
//                                                                     {kpi.weight}%
//                                                                 </Tag>
//                                                                 <br />
//                                                                 <Text type="secondary" style={{ fontSize: '12px' }}>
//                                                                     {kpi.description.substring(0, 50)}...
//                                                                 </Text>
//                                                             </div>
//                                                         </Option>
//                                                     ))}
//                                                 </Select>
//                                             </Form.Item>
//                                         ) : (
//                                             <Alert
//                                                 message="No Approved KPIs"
//                                                 description="This user has no approved KPIs for the current quarter. They cannot be assigned tasks until they set up their KPIs."
//                                                 type="error"
//                                                 showIcon
//                                             />
//                                         )}
//                                     </Card>
//                                 );
//                             })}
//                         </Card>
//                     )}

//                     <Form.Item
//                         name="notes"
//                         label="Notes"
//                     >
//                         <TextArea rows={2} placeholder="Additional notes or instructions" />
//                     </Form.Item>

//                     <Form.Item>
//                         <Space>
//                             <Button onClick={() => {
//                                 setTaskModalVisible(false);
//                                 form.resetFields();
//                                 setSelectedAssignees([]);
//                                 setAssigneeKPIs({});
//                             }}>
//                                 Cancel
//                             </Button>
//                             <Button
//                                 type="primary"
//                                 htmlType="submit"
//                                 loading={loading}
//                                 icon={<PlusOutlined />}
//                             >
//                                 Create Task
//                             </Button>
//                         </Space>
//                     </Form.Item>
//                 </Form>
//             </Modal>
//         </div>
//     );
// };

// export default SupervisorMilestoneDetail;













// import React, { useState, useEffect } from 'react';
// import { useParams, useNavigate } from 'react-router-dom';
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
//     DatePicker,
//     InputNumber,
//     Descriptions,
//     Alert,
//     Spin,
//     message,
//     Progress,
//     Row,
//     Col,
//     Statistic,
//     Divider,
//     Tooltip,
//     Avatar,
//     Badge
// } from 'antd';
// import {
//     ArrowLeftOutlined,
//     PlusOutlined,
//     EditOutlined,
//     DeleteOutlined,
//     FlagOutlined,
//     UserOutlined,
//     ReloadOutlined,
//     CheckCircleOutlined,
//     WarningOutlined,
//     TrophyOutlined
// } from '@ant-design/icons';
// import moment from 'moment';
// import { kpiAPI } from '../../services/kpiAPI';

// const { Title, Text, Paragraph } = Typography;
// const { TextArea } = Input;
// const { Option } = Select;

// const SupervisorMilestoneDetail = () => {
//     const { projectId, milestoneId } = useParams();
//     const navigate = useNavigate();
//     const [loading, setLoading] = useState(false);
//     const [milestoneData, setMilestoneData] = useState(null);
//     const [tasks, setTasks] = useState([]);
//     const [stats, setStats] = useState(null);
//     const [taskModalVisible, setTaskModalVisible] = useState(false);
//     const [editingTask, setEditingTask] = useState(null);
//     const [form] = Form.useForm();
//     const [users, setUsers] = useState([]);
//     const [usersLoading, setUsersLoading] = useState(false);
//     const [selectedAssignees, setSelectedAssignees] = useState([]);
//     const [assigneeKPIs, setAssigneeKPIs] = useState({});
//     const [loadingKPIs, setLoadingKPIs] = useState({});

//     useEffect(() => {
//         fetchMilestoneDetails();
//         fetchUsers();
//     }, [projectId, milestoneId]);

//     const fetchMilestoneDetails = async () => {
//         try {
//             setLoading(true);
//             const token = localStorage.getItem('token');
//             const response = await fetch(
//                 `http://localhost:5001/api/projects/${projectId}/milestones/${milestoneId}`,
//                 {
//                     headers: {
//                         'Authorization': `Bearer ${token}`,
//                         'Content-Type': 'application/json'
//                     }
//                 }
//             );

//             if (!response.ok) {
//                 throw new Error('Failed to fetch milestone details');
//             }

//             const result = await response.json();
            
//             if (result.success) {
//                 setMilestoneData(result.data);
//                 setTasks(result.data.tasks || []);
//                 setStats(result.data.stats || {});
//             } else {
//                 message.error(result.message || 'Failed to fetch milestone details');
//             }
//         } catch (error) {
//             console.error('Error fetching milestone details:', error);
//             message.error('Failed to load milestone details');
//         } finally {
//             setLoading(false);
//         }
//     };

//     const fetchUsers = async () => {
//         try {
//             setUsersLoading(true);
            
//             // Try database users first
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
//                         setUsers(result.data);
//                         return;
//                     }
//                 }
//             } catch (error) {
//                 console.log('Database users not available');
//             }

//             // Fallback to department structure
//             const { getAllEmployees } = require('../../utils/departmentStructure');
//             const allEmployees = getAllEmployees();

//             const formattedUsers = allEmployees
//                 .filter(emp => emp.name && emp.email)
//                 .map((emp, idx) => ({
//                     _id: `emp_${idx}_${emp.email}`,
//                     id: emp.email,
//                     fullName: emp.name,
//                     name: emp.name,
//                     email: emp.email,
//                     position: emp.position,
//                     department: emp.department,
//                     role: emp.role || 'employee',
//                     isActive: true
//                 }))
//                 .sort((a, b) => a.fullName.localeCompare(b.fullName));

//             setUsers(formattedUsers);

//         } catch (error) {
//             console.error('Error loading users:', error);
//             setUsers([]);
//         } finally {
//             setUsersLoading(false);
//         }
//     };


//     const fetchUserKPIs = async (userId) => {
//         if (assigneeKPIs[userId]) {
//             console.log('KPIs already cached for user:', userId);
//             return; // Already loaded
//         }

//         const user = users.find(u => u._id === userId);
//         console.log('=== Fetching KPIs ===');
//         console.log('User ID:', userId);
//         console.log('User Name:', user?.fullName);
//         console.log('User Email:', user?.email);

//         try {
//             setLoadingKPIs(prev => ({ ...prev, [userId]: true }));
            
//             // Pass the userId to fetch that user's KPIs
//             const result = await kpiAPI.getApprovedKPIsForLinking(userId);
            
//             console.log('KPI Fetch Result:', result);
            
//             if (result.success && result.data && result.data.kpis && result.data.kpis.length > 0) {
//                 console.log('✅ KPIs Found:', {
//                     count: result.data.kpis.length,
//                     quarter: result.data.quarter,
//                     totalWeight: result.data.totalWeight,
//                     employee: result.data.employee?.fullName
//                 });
                
//                 setAssigneeKPIs(prev => ({
//                     ...prev,
//                     [userId]: result.data
//                 }));
                
//                 message.success(`Loaded ${result.data.kpis.length} KPIs for ${user?.fullName || 'user'}`);
//             } else {
//                 console.log('⚠️ No KPIs found:', result.message);
//                 setAssigneeKPIs(prev => ({
//                     ...prev,
//                     [userId]: null
//                 }));
                
//                 message.warning(
//                     result.message || 
//                     `${user?.fullName || 'User'} has no approved KPIs for Q4-2025. They need to create and get their KPIs approved first.`,
//                     5
//                 );
//             }
//         } catch (error) {
//             console.error('❌ Error fetching user KPIs:', error);
//             setAssigneeKPIs(prev => ({
//                 ...prev,
//                 [userId]: null
//             }));
//             message.error(`Failed to fetch KPIs for ${user?.fullName || 'user'}: ${error.message}`);
//         } finally {
//             setLoadingKPIs(prev => ({ ...prev, [userId]: false }));
//         }
//     };

//     const handleAssigneeChange = (assigneeIds) => {
//         setSelectedAssignees(assigneeIds);
        
//         // Fetch KPIs for each newly selected assignee
//         assigneeIds.forEach(userId => {
//             if (!assigneeKPIs[userId] && !loadingKPIs[userId]) {
//                 fetchUserKPIs(userId);
//             }
//         });
//     };

//     const handleCreateTask = async (values) => {
//         try {
//             setLoading(true);

//             console.log('Creating task with values:', values);

//             // Validate required fields
//             if (!values.title || !values.description || !values.priority || !values.dueDate || !values.taskWeight) {
//                 message.error('Please fill in all required fields');
//                 return;
//             }

//             // Validate assignees and KPIs
//             if (!values.assignedTo || values.assignedTo.length === 0) {
//                 // No assignees = task belongs to supervisor
//                 message.info('No assignees selected - task will be assigned to you');
//             } else {
//                 // Validate each assignee has selected KPI
//                 for (const userId of values.assignedTo) {
//                     const userKPISelections = values[`kpis_${userId}`];
//                     if (!userKPISelections || userKPISelections.length === 0) {
//                         const user = users.find(u => u._id === userId);
//                         message.error(`Please select at least one KPI for ${user?.fullName || 'assignee'}`);
//                         return;
//                     }
//                 }
//             }

//             // Build linkedKPIs array
//             const linkedKPIs = [];
//             if (values.assignedTo && values.assignedTo.length > 0) {
//                 for (const userId of values.assignedTo) {
//                     const userKPISelections = values[`kpis_${userId}`] || [];
//                     const userKPIDoc = assigneeKPIs[userId];
                    
//                     if (userKPIDoc) {
//                         userKPISelections.forEach(kpiIndex => {
//                             linkedKPIs.push({
//                                 userId,
//                                 kpiDocId: userKPIDoc._id,
//                                 kpiIndex
//                             });
//                         });
//                     }
//                 }
//             }

//             const taskData = {
//                 projectId,
//                 milestoneId,
//                 title: values.title,
//                 description: values.description,
//                 priority: values.priority,
//                 dueDate: values.dueDate.format('YYYY-MM-DD'),
//                 taskWeight: values.taskWeight,
//                 assignedTo: values.assignedTo || [],
//                 linkedKPIs,
//                 notes: values.notes || ''
//             };

//             console.log('Task data to send:', taskData);

//             const token = localStorage.getItem('token');
//             const response = await fetch('http://localhost:5001/api/action-items/milestone/task', {
//                 method: 'POST',
//                 headers: {
//                     'Authorization': `Bearer ${token}`,
//                     'Content-Type': 'application/json'
//                 },
//                 body: JSON.stringify(taskData)
//             });

//             const result = await response.json();

//             if (result.success) {
//                 message.success('Task created successfully under milestone!');
//                 setTaskModalVisible(false);
//                 form.resetFields();
//                 setSelectedAssignees([]);
//                 setAssigneeKPIs({});
//                 fetchMilestoneDetails();
//             } else {
//                 message.error(result.message || 'Failed to create task');
//             }
//         } catch (error) {
//             console.error('Error creating task:', error);
//             message.error('Failed to create task');
//         } finally {
//             setLoading(false);
//         }
//     };

//     const handleReassignTask = async (taskId) => {
//         // TODO: Implement task reassignment
//         message.info('Task reassignment feature coming soon');
//     };

//     const handleDeleteTask = (taskId) => {
//         Modal.confirm({
//             title: 'Delete Task',
//             content: 'Are you sure you want to delete this task? This action cannot be undone.',
//             okText: 'Delete',
//             okType: 'danger',
//             onOk: async () => {
//                 try {
//                     const token = localStorage.getItem('token');
//                     const response = await fetch(`http://localhost:5001/api/action-items/${taskId}`, {
//                         method: 'DELETE',
//                         headers: {
//                             'Authorization': `Bearer ${token}`
//                         }
//                     });

//                     const result = await response.json();
                    
//                     if (result.success) {
//                         message.success('Task deleted successfully');
//                         fetchMilestoneDetails();
//                     } else {
//                         message.error(result.message || 'Failed to delete task');
//                     }
//                 } catch (error) {
//                     console.error('Error deleting task:', error);
//                     message.error('Failed to delete task');
//                 }
//             }
//         });
//     };

//     const getPriorityColor = (priority) => {
//         const colors = {
//             'LOW': 'green',
//             'MEDIUM': 'blue',
//             'HIGH': 'orange',
//             'CRITICAL': 'red'
//         };
//         return colors[priority] || 'default';
//     };

//     const getStatusColor = (status) => {
//         const colors = {
//             'Not Started': 'default',
//             'In Progress': 'processing',
//             'Pending Approval': 'warning',
//             'Pending Completion Approval': 'cyan',
//             'Completed': 'success',
//             'On Hold': 'warning',
//             'Rejected': 'error'
//         };
//         return colors[status] || 'default';
//     };

//     const taskColumns = [
//         {
//             title: 'Task',
//             key: 'task',
//             render: (_, record) => (
//                 <div>
//                     <Text strong>{record.title}</Text>
//                     <br />
//                     <Text type="secondary" style={{ fontSize: '12px' }}>
//                         {record.description?.substring(0, 60)}...
//                     </Text>
//                     <br />
//                     <Tag size="small" color={getPriorityColor(record.priority)} icon={<FlagOutlined />}>
//                         {record.priority}
//                     </Tag>
//                     <Tag size="small" color="blue">
//                         Weight: {record.taskWeight}%
//                     </Tag>
//                 </div>
//             ),
//             width: 300
//         },
//         {
//             title: 'Assignees',
//             key: 'assignees',
//             render: (_, record) => (
//                 <div>
//                     {record.assignedTo && record.assignedTo.length > 0 ? (
//                         <>
//                             {record.assignedTo.slice(0, 2).map((assignee, idx) => (
//                                 <div key={idx} style={{ marginBottom: 4 }}>
//                                     <Avatar size="small" icon={<UserOutlined />} style={{ marginRight: 4 }} />
//                                     <Text style={{ fontSize: '12px' }}>
//                                         {assignee.user?.fullName || 'Unknown'}
//                                     </Text>
//                                     <Tag size="small" color={
//                                         assignee.completionStatus === 'approved' ? 'green' :
//                                         assignee.completionStatus === 'submitted' ? 'blue' :
//                                         assignee.completionStatus === 'rejected' ? 'red' :
//                                         'default'
//                                     } style={{ marginLeft: 4 }}>
//                                         {assignee.completionStatus}
//                                     </Tag>
//                                 </div>
//                             ))}
//                             {record.assignedTo.length > 2 && (
//                                 <Text type="secondary" style={{ fontSize: '11px' }}>
//                                     +{record.assignedTo.length - 2} more
//                                 </Text>
//                             )}
//                         </>
//                     ) : (
//                         <Text type="secondary">Unassigned</Text>
//                     )}
//                 </div>
//             ),
//             width: 200
//         },
//         {
//             title: 'Progress',
//             key: 'progress',
//             render: (_, record) => (
//                 <Progress 
//                     percent={record.progress || 0} 
//                     size="small"
//                     status={record.progress === 100 ? 'success' : 'active'}
//                 />
//             ),
//             width: 120
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
//             width: 150
//         },
//         {
//             title: 'Due Date',
//             key: 'dueDate',
//             render: (_, record) => {
//                 const isOverdue = moment(record.dueDate).isBefore(moment()) && record.status !== 'Completed';
//                 return (
//                     <div>
//                         <Text type={isOverdue ? 'danger' : 'secondary'}>
//                             {moment(record.dueDate).format('MMM DD, YYYY')}
//                         </Text>
//                         {isOverdue && (
//                             <>
//                                 <br />
//                                 <Tag color="red" size="small">Overdue</Tag>
//                             </>
//                         )}
//                     </div>
//                 );
//             },
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
//                             icon={<EditOutlined />}
//                             onClick={() => navigate(`/supervisor/task/${record._id}`)}
//                         />
//                     </Tooltip>
//                     {['Not Started', 'In Progress'].includes(record.status) && (
//                         <Tooltip title="Delete">
//                             <Button
//                                 size="small"
//                                 danger
//                                 icon={<DeleteOutlined />}
//                                 onClick={() => handleDeleteTask(record._id)}
//                             />
//                         </Tooltip>
//                     )}
//                 </Space>
//             ),
//             width: 100,
//             fixed: 'right'
//         }
//     ];

//     if (loading && !milestoneData) {
//         return (
//             <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
//                 <Spin size="large" />
//             </div>
//         );
//     }

//     if (!milestoneData) {
//         return (
//             <div style={{ padding: '24px' }}>
//                 <Alert
//                     message="Milestone Not Found"
//                     description="The milestone you are trying to access does not exist or you don't have permission to view it."
//                     type="error"
//                     showIcon
//                 />
//             </div>
//         );
//     }

//     return (
//         <div style={{ padding: '24px' }}>
//             <Card>
//                 <div style={{ 
//                     display: 'flex', 
//                     justifyContent: 'space-between', 
//                     alignItems: 'center',
//                     marginBottom: '24px'
//                 }}>
//                     <Space>
//                         <Button
//                             icon={<ArrowLeftOutlined />}
//                             onClick={() => navigate('/supervisor/milestones')}
//                         >
//                             Back to Milestones
//                         </Button>
//                         <Title level={3} style={{ margin: 0 }}>
//                             <FlagOutlined /> {milestoneData.milestone.title}
//                         </Title>
//                     </Space>
//                     <Space>
//                         <Button
//                             icon={<ReloadOutlined />}
//                             onClick={fetchMilestoneDetails}
//                             loading={loading}
//                         >
//                             Refresh
//                         </Button>
//                         <Button
//                             type="primary"
//                             icon={<PlusOutlined />}
//                             onClick={() => setTaskModalVisible(true)}
//                             disabled={stats?.weightRemaining <= 0}
//                         >
//                             Create Task
//                         </Button>
//                     </Space>
//                 </div>

//                 {/* Milestone Info Card */}
//                 <Card size="small" style={{ marginBottom: '24px', backgroundColor: '#f0f8ff' }}>
//                     <Row gutter={16}>
//                         <Col span={24}>
//                             <Descriptions bordered column={3} size="small">
//                                 <Descriptions.Item label="Project">
//                                     <Text strong>{milestoneData.project.name}</Text>
//                                 </Descriptions.Item>
//                                 <Descriptions.Item label="Milestone Weight">
//                                     <Tag color="blue">{milestoneData.milestone.weight}%</Tag>
//                                 </Descriptions.Item>
//                                 <Descriptions.Item label="Status">
//                                     <Tag color={
//                                         milestoneData.milestone.status === 'Completed' ? 'green' :
//                                         milestoneData.milestone.status === 'In Progress' ? 'blue' :
//                                         'default'
//                                     }>
//                                         {milestoneData.milestone.status}
//                                     </Tag>
//                                 </Descriptions.Item>
//                                 <Descriptions.Item label="Description" span={3}>
//                                     <Paragraph style={{ margin: 0 }}>
//                                         {milestoneData.milestone.description || 'No description provided'}
//                                     </Paragraph>
//                                 </Descriptions.Item>
//                             </Descriptions>
//                         </Col>
//                     </Row>
//                 </Card>

//                 {/* Statistics Card */}
//                 <Card size="small" style={{ marginBottom: '24px' }}>
//                     <Row gutter={16}>
//                         <Col span={6}>
//                             <Statistic
//                                 title="Progress"
//                                 value={milestoneData.milestone.progress || 0}
//                                 suffix="%"
//                                 valueStyle={{ color: '#1890ff' }}
//                             />
//                             <Progress 
//                                 percent={milestoneData.milestone.progress || 0} 
//                                 size="small"
//                                 style={{ marginTop: 8 }}
//                             />
//                         </Col>
//                         <Col span={6}>
//                             <Statistic
//                                 title="Total Tasks"
//                                 value={stats?.totalTasks || 0}
//                             />
//                         </Col>
//                         <Col span={6}>
//                             <Statistic
//                                 title="Completed Tasks"
//                                 value={stats?.completedTasks || 0}
//                                 valueStyle={{ color: '#52c41a' }}
//                             />
//                         </Col>
//                         <Col span={6}>
//                             <Statistic
//                                 title="Task Weight Assigned"
//                                 value={`${stats?.totalWeightAssigned || 0}%`}
//                                 suffix="/ 100%"
//                             />
//                             {stats?.weightRemaining > 0 && (
//                                 <Alert
//                                     message={`${stats.weightRemaining}% unassigned`}
//                                     type="warning"
//                                     showIcon
//                                     style={{ marginTop: 8 }}
//                                 />
//                             )}
//                         </Col>
//                     </Row>
//                 </Card>

//                 <Divider />

//                 {/* Tasks Table */}
//                 <Title level={4}>Tasks Under This Milestone</Title>
//                 {tasks.length === 0 ? (
//                     <Alert
//                         message="No Tasks Created Yet"
//                         description="Create tasks and assign them to team members. The sum of task weights should equal 100% for accurate milestone progress tracking."
//                         type="info"
//                         showIcon
//                         action={
//                             <Button
//                                 type="primary"
//                                 icon={<PlusOutlined />}
//                                 onClick={() => setTaskModalVisible(true)}
//                             >
//                                 Create First Task
//                             </Button>
//                         }
//                     />
//                 ) : (
//                     <Table
//                         columns={taskColumns}
//                         dataSource={tasks}
//                         rowKey="_id"
//                         loading={loading}
//                         pagination={{
//                             showSizeChanger: true,
//                             showTotal: (total) => `Total ${total} tasks`
//                         }}
//                         scroll={{ x: 1200 }}
//                         size="small"
//                     />
//                 )}
//             </Card>

//             {/* Create Task Modal */}
//             <Modal
//                 title={
//                     <Space>
//                         <PlusOutlined />
//                         Create Task Under Milestone
//                     </Space>
//                 }
//                 open={taskModalVisible}
//                 onCancel={() => {
//                     setTaskModalVisible(false);
//                     form.resetFields();
//                     setSelectedAssignees([]);
//                     setAssigneeKPIs({});
//                 }}
//                 footer={null}
//                 width={900}
//                 destroyOnClose
//             >
//                 <Alert
//                     message="Task Weight Management"
//                     description={`Available weight: ${stats?.weightRemaining || 0}%. The sum of all task weights under this milestone must equal 100% for accurate progress tracking.`}
//                     type="info"
//                     showIcon
//                     style={{ marginBottom: 16 }}
//                 />

//                 <Form
//                     form={form}
//                     layout="vertical"
//                     onFinish={handleCreateTask}
//                 >
//                     <Form.Item
//                         name="title"
//                         label="Task Title"
//                         rules={[{ required: true, message: 'Please enter task title' }]}
//                     >
//                         <Input placeholder="e.g., Configure network infrastructure" />
//                     </Form.Item>

//                     <Form.Item
//                         name="description"
//                         label="Description"
//                         rules={[{ required: true, message: 'Please enter description' }]}
//                     >
//                         <TextArea rows={3} placeholder="Detailed task description" />
//                     </Form.Item>

//                     <Row gutter={16}>
//                         <Col span={8}>
//                             <Form.Item
//                                 name="priority"
//                                 label="Priority"
//                                 rules={[{ required: true, message: 'Please select priority' }]}
//                             >
//                                 <Select placeholder="Select priority">
//                                     <Option value="LOW">🟢 Low</Option>
//                                     <Option value="MEDIUM">🟡 Medium</Option>
//                                     <Option value="HIGH">🟠 High</Option>
//                                     <Option value="CRITICAL">🔴 Critical</Option>
//                                 </Select>
//                             </Form.Item>
//                         </Col>
//                         <Col span={8}>
//                             <Form.Item
//                                 name="taskWeight"
//                                 label="Task Weight (%)"
//                                 rules={[
//                                     { required: true, message: 'Please enter task weight' },
//                                     { 
//                                         validator: (_, value) => {
//                                             if (value && value > (stats?.weightRemaining || 0)) {
//                                                 return Promise.reject(`Cannot exceed available weight: ${stats?.weightRemaining || 0}%`);
//                                             }
//                                             return Promise.resolve();
//                                         }
//                                     }
//                                 ]}
//                             >
//                                 <InputNumber
//                                     min={0}
//                                     max={100}
//                                     style={{ width: '100%' }}
//                                     formatter={value => `${value}%`}
//                                     parser={value => value.replace('%', '')}
//                                 />
//                             </Form.Item>
//                         </Col>
//                         <Col span={8}>
//                             <Form.Item
//                                 name="dueDate"
//                                 label="Due Date"
//                                 rules={[{ required: true, message: 'Please select due date' }]}
//                             >
//                                 <DatePicker style={{ width: '100%' }} />
//                             </Form.Item>
//                         </Col>
//                     </Row>

//                     <Form.Item
//                         name="assignedTo"
//                         label="Assign To (Optional - leave empty to assign to yourself)"
//                     >
//                         <Select
//                             mode="multiple"
//                             placeholder="Select assignees"
//                             loading={usersLoading}
//                             showSearch
//                             onChange={handleAssigneeChange}
//                             filterOption={(input, option) => {
//                                 const user = users.find(u => u._id === option.value);
//                                 if (!user) return false;
//                                 return (
//                                     (user.fullName || user.name || '').toLowerCase().includes(input.toLowerCase()) ||
//                                     (user.department || '').toLowerCase().includes(input.toLowerCase())
//                                 );
//                             }}
//                         >
//                             {users.map(user => (
//                                 <Option key={user._id} value={user._id}>
//                                     <div>
//                                         <Text strong>{user.fullName || user.name}</Text>
//                                         <br />
//                                         <Text type="secondary" style={{ fontSize: '12px' }}>
//                                             {user.position || user.role} | {user.department}
//                                         </Text>
//                                     </div>
//                                 </Option>
//                             ))}
//                         </Select>
//                     </Form.Item>

//                     {/* KPI Selection for Each Assignee */}
//                     {selectedAssignees.length > 0 && (
//                         <Card size="small" title={<><TrophyOutlined /> Link to KPIs</>} style={{ marginBottom: 16 }}>
//                             <Alert
//                                 message="KPI Linkage Required"
//                                 description="Each assignee must have at least one KPI selected. Task completion will contribute to the linked KPIs."
//                                 type="warning"
//                                 showIcon
//                                 style={{ marginBottom: 16 }}
//                             />
                            
//                             {selectedAssignees.map(userId => {
//                                 const user = users.find(u => u._id === userId);
//                                 const userKPIs = assigneeKPIs[userId];
//                                 const isLoading = loadingKPIs[userId];

//                                 return (
//                                     <Card 
//                                         key={userId} 
//                                         size="small" 
//                                         style={{ marginBottom: 12, backgroundColor: '#fafafa' }}
//                                         title={
//                                             <Space>
//                                                 <Avatar size="small" icon={<UserOutlined />} />
//                                                 <Text strong>{user?.fullName || user?.name}</Text>
//                                             </Space>
//                                         }
//                                     >
//                                         {isLoading ? (
//                                             <Spin size="small" />
//                                         ) : userKPIs && userKPIs.kpis && userKPIs.kpis.length > 0 ? (
//                                             <Form.Item
//                                                 name={`kpis_${userId}`}
//                                                 label="Select KPIs"
//                                                 rules={[{ required: true, message: 'Please select at least one KPI' }]}
//                                             >
//                                                 <Select
//                                                     mode="multiple"
//                                                     placeholder="Select KPIs"
//                                                 >
//                                                     {userKPIs.kpis.map((kpi, index) => (
//                                                         <Option key={index} value={index}>
//                                                             <div>
//                                                                 <Text strong>{kpi.title}</Text>
//                                                                 <Tag color="blue" style={{ marginLeft: 8 }}>
//                                                                     {kpi.weight}%
//                                                                 </Tag>
//                                                                 <br />
//                                                                 <Text type="secondary" style={{ fontSize: '12px' }}>
//                                                                     {kpi.description.substring(0, 50)}...
//                                                                 </Text>
//                                                             </div>
//                                                         </Option>
//                                                     ))}
//                                                 </Select>
//                                             </Form.Item>
//                                         ) : (
//                                             <Alert
//                                                 message="No Approved KPIs"
//                                                 description="This user has no approved KPIs for the current quarter. They cannot be assigned tasks until they set up their KPIs."
//                                                 type="error"
//                                                 showIcon
//                                             />
//                                         )}
//                                     </Card>
//                                 );
//                             })}
//                         </Card>
//                     )}

//                     <Form.Item
//                         name="notes"
//                         label="Notes"
//                     >
//                         <TextArea rows={2} placeholder="Additional notes or instructions" />
//                     </Form.Item>

//                     <Form.Item>
//                         <Space>
//                             <Button onClick={() => {
//                                 setTaskModalVisible(false);
//                                 form.resetFields();
//                                 setSelectedAssignees([]);
//                                 setAssigneeKPIs({});
//                             }}>
//                                 Cancel
//                             </Button>
//                             <Button
//                                 type="primary"
//                                 htmlType="submit"
//                                 loading={loading}
//                                 icon={<PlusOutlined />}
//                             >
//                                 Create Task
//                             </Button>
//                         </Space>
//                     </Form.Item>
//                 </Form>
//             </Modal>
//         </div>
//     );
// };

// export default SupervisorMilestoneDetail;


