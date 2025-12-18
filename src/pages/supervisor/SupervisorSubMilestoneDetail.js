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
    FolderOutlined,
    FileOutlined,
    EyeOutlined,
    ApartmentOutlined
} from '@ant-design/icons';
import moment from 'moment';
import api from '../../services/api';
import { kpiAPI } from '../../services/kpiAPI';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const SupervisorSubMilestoneDetail = () => {
    const { projectId, milestoneId, subMilestoneId } = useParams();
    const navigate = useNavigate();
    
    const [loading, setLoading] = useState(false);
    const [hierarchyData, setHierarchyData] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [stats, setStats] = useState(null);
    
    const [subMilestoneModalVisible, setSubMilestoneModalVisible] = useState(false);
    const [taskModalVisible, setTaskModalVisible] = useState(false);
    const [parentSubMilestone, setParentSubMilestone] = useState(null);
    const [selectedSubMilestone, setSelectedSubMilestone] = useState(null);
    
    const [subMilestoneForm] = Form.useForm();
    const [taskForm] = Form.useForm();
    
    const [users, setUsers] = useState([]);
    const [usersLoading, setUsersLoading] = useState(false);
    const [creatorKPIs, setCreatorKPIs] = useState(null);
    const [loadingKPIs, setLoadingKPIs] = useState(false);
    
    const [selectedAssignees, setSelectedAssignees] = useState([]);
    const [assigneeKPIs, setAssigneeKPIs] = useState({});
    const [loadingAssigneeKPIs, setLoadingAssigneeKPIs] = useState({});

    useEffect(() => {
        fetchSubMilestoneHierarchy();
        fetchUsers();
    }, [projectId, milestoneId, subMilestoneId]);

    // const fetchSubMilestoneHierarchy = async () => {
    //     try {
    //         setLoading(true);
    //         const response = await api.get(
    //             `/projects/${projectId}/milestones/${milestoneId}/sub-milestones/${subMilestoneId}/hierarchy`
    //         );

    //         if (response.data.success) {
    //             setHierarchyData(response.data.data.hierarchy);
                
    //             const allTasks = response.data.data.allTasks || [];
    //             setTasks(allTasks);
                
    //             const totalTasks = allTasks.length;
    //             const completedTasks = allTasks.filter(t => t.status === 'Completed').length;
                
    //             setStats({
    //                 totalTasks,
    //                 completedTasks,
    //                 totalWeightAssigned: response.data.data.hierarchy.weight || 0,
    //                 weightRemaining: 100 - (response.data.data.hierarchy.weight || 0)
    //             });
    //         } else {
    //             message.error(response.data.message || 'Failed to fetch sub-milestone');
    //         }
    //     } catch (error) {
    //         console.error('Error:', error);
    //         message.error('Failed to load sub-milestone hierarchy');
    //     } finally {
    //         setLoading(false);
    //     }
    // };

    const fetchUsers = async () => {
        try {
            setUsersLoading(true);
            const response = await api.get('/auth/active-users');

            if (response.data.success && response.data.data) {
                setUsers(response.data.data);
            } else {
                const { getAllEmployees } = require('../../utils/departmentStructure');
                const allEmployees = getAllEmployees();
                const formattedUsers = allEmployees
                    .filter(emp => emp.name && emp.email)
                    .map((emp, idx) => ({
                        _id: `emp_${idx}_${emp.email}`,
                        fullName: emp.name,
                        email: emp.email,
                        position: emp.position,
                        department: emp.department
                    }));
                setUsers(formattedUsers);
            }
        } catch (error) {
            console.error('Error loading users:', error);
        } finally {
            setUsersLoading(false);
        }
    };

    // Open sub-milestone modal - fetch CREATOR's KPIs
    const openSubMilestoneModal = async (parent = null) => {
        setParentSubMilestone(parent || hierarchyData);
        subMilestoneForm.resetFields();
        
        try {
            setLoadingKPIs(true);
            const userId = localStorage.getItem('userId');
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

            const linkedKPIs = [];
            if (values.selectedKPIs && values.selectedKPIs.length > 0) {
            values.selectedKPIs.forEach(kpiIndex => {
                linkedKPIs.push({
                kpiDocId: creatorKPIs._id,
                kpiIndex,
                contributionWeight: values[`contribution_${kpiIndex}`] || 0
                });
            });
            }

            const payload = {
            title: values.title,
            description: values.description || '',
            weight: values.weight,
            dueDate: values.dueDate ? values.dueDate.format('YYYY-MM-DD') : null,
            assignedSupervisor: values.assignedSupervisor,
            parentSubMilestoneId: parentSubMilestone._id, // Current sub-milestone becomes parent
            linkedKPIs
            };

            console.log('Creating nested sub-milestone with payload:', payload);

            const response = await api.post(
            `/projects/${projectId}/milestones/${milestoneId}/sub-milestones`,
            payload
            );

            if (response.data.success) {
            message.success('Sub-milestone created successfully!');
            
            // Close modal and reset state
            setSubMilestoneModalVisible(false);
            subMilestoneForm.resetFields();
            setParentSubMilestone(null);
            setCreatorKPIs(null);
            
            // Force refresh with a small delay to ensure database save is complete
            setTimeout(() => {
                fetchSubMilestoneHierarchy();
            }, 500);
            } else {
            message.error(response.data.message);
            }
        } catch (error) {
            console.error('Error creating sub-milestone:', error);
            message.error(error.response?.data?.message || 'Failed to create sub-milestone');
        } finally {
            setLoading(false);
        }
    };

    // Also update the fetchSubMilestoneHierarchy to add cache busting:
    const fetchSubMilestoneHierarchy = async () => {
    try {
        setLoading(true);
        
        // Add timestamp to prevent caching
        const timestamp = new Date().getTime();
        
        const response = await api.get(
        `/projects/${projectId}/milestones/${milestoneId}/sub-milestones/${subMilestoneId}/hierarchy?t=${timestamp}`
        );

        if (response.data.success) {
        console.log('Hierarchy fetched:', response.data.data.hierarchy);
        console.log('Sub-milestones in hierarchy:', response.data.data.hierarchy.subMilestones?.length || 0);
        
        setHierarchyData(response.data.data.hierarchy);
        
        const allTasks = response.data.data.allTasks || [];
        setTasks(allTasks);
        
        const totalTasks = allTasks.length;
        const completedTasks = allTasks.filter(t => t.status === 'Completed').length;
        
        setStats({
            totalTasks,
            completedTasks,
            totalWeightAssigned: response.data.data.hierarchy.weight || 0,
            weightRemaining: 100 - (response.data.data.hierarchy.weight || 0)
        });
        } else {
        message.error(response.data.message || 'Failed to fetch sub-milestone');
        }
    } catch (error) {
        console.error('Error fetching hierarchy:', error);
        message.error('Failed to load sub-milestone hierarchy');
    } finally {
        setLoading(false);
    }
    };

    // Fetch assignee's KPIs when creating task
    const fetchUserKPIs = async (userId) => {
        if (assigneeKPIs[userId]) return;

        try {
            setLoadingAssigneeKPIs(prev => ({ ...prev, [userId]: true }));
            const result = await kpiAPI.getApprovedKPIsForLinking(userId);
            
            if (result.success && result.data && result.data.kpis.length > 0) {
                setAssigneeKPIs(prev => ({
                    ...prev,
                    [userId]: result.data
                }));
            } else {
                setAssigneeKPIs(prev => ({
                    ...prev,
                    [userId]: null
                }));
                message.warning(`Selected user has no approved KPIs`);
            }
        } catch (error) {
            console.error('Error fetching user KPIs:', error);
            setAssigneeKPIs(prev => ({ ...prev, [userId]: null }));
        } finally {
            setLoadingAssigneeKPIs(prev => ({ ...prev, [userId]: false }));
        }
    };

    const handleAssigneeChange = (assigneeIds) => {
        setSelectedAssignees(assigneeIds);
        assigneeIds.forEach(userId => {
            if (!assigneeKPIs[userId] && !loadingAssigneeKPIs[userId]) {
                fetchUserKPIs(userId);
            }
        });
    };

    // Open task modal - fetch ASSIGNEES' KPIs
    const openTaskModal = (targetSubMilestone = null) => {
        setSelectedSubMilestone(targetSubMilestone || hierarchyData);
        taskForm.resetFields();
        setSelectedAssignees([]);
        setAssigneeKPIs({});
        setTaskModalVisible(true);
    };

    const handleCreateTask = async (values) => {
        try {
            setLoading(true);

            if (!values.assignedTo || values.assignedTo.length === 0) {
                message.error('Please select at least one assignee');
                return;
            }

            // Validate KPI selection for each assignee
            for (const userId of values.assignedTo) {
                const userKPISelections = values[`kpis_${userId}`];
                if (!userKPISelections || userKPISelections.length === 0) {
                    const user = users.find(u => u._id === userId);
                    message.error(`Please select at least one KPI for ${user?.fullName}`);
                    return;
                }
            }

            // Build linked KPIs
            const linkedKPIs = [];
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

            const payload = {
                projectId,
                milestoneId,
                subMilestoneId: selectedSubMilestone._id,
                title: values.title,
                description: values.description,
                priority: values.priority,
                dueDate: values.dueDate.format('YYYY-MM-DD'),
                taskWeight: values.taskWeight,
                assignedTo: values.assignedTo,
                linkedKPIs,
                notes: values.notes || ''
            };

            const response = await api.post('/action-items/sub-milestone-task', payload);

            if (response.data.success) {
                message.success('Task created successfully!');
                setTaskModalVisible(false);
                taskForm.resetFields();
                setSelectedAssignees([]);
                setAssigneeKPIs({});
                setSelectedSubMilestone(null);
                fetchSubMilestoneHierarchy();
            } else {
                message.error(response.data.message);
            }
        } catch (error) {
            console.error('Error:', error);
            message.error(error.response?.data?.message || 'Failed to create task');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteTask = (taskId) => {
        Modal.confirm({
            title: 'Delete Task',
            content: 'Are you sure?',
            onOk: async () => {
                try {
                    const response = await api.delete(`/action-items/${taskId}`);
                    if (response.data.success) {
                        message.success('Task deleted');
                        fetchSubMilestoneHierarchy();
                    }
                } catch (error) {
                    message.error('Failed to delete task');
                }
            }
        });
    };

    const renderSubMilestones = (subMilestones, level = 0) => {
        if (!subMilestones || subMilestones.length === 0) return null;

        return subMilestones.map(sm => (
            <Card
            key={sm._id}
            size="small"
            style={{
                marginLeft: level * 20,
                marginBottom: 12,
                backgroundColor: level % 2 === 0 ? '#fafafa' : '#f5f5f5'
            }}
            title={
                <Space>
                <FolderOutlined />
                <Text strong>{sm.title}</Text>
                <Tag color="blue">{sm.weight}%</Tag>
                <Tag color={sm.status === 'Completed' ? 'green' : 'blue'}>
                    {sm.status}
                </Tag>
                </Space>
            }
            extra={
                <Space>
                <Progress type="circle" percent={sm.progress || 0} width={40} />
                <Button
                    size="small"
                    icon={<PlusOutlined />}
                    onClick={() => openSubMilestoneModal(sm)}
                >
                    Add Sub
                </Button>
                <Button
                    size="small"
                    type="primary"
                    icon={<FileOutlined />}
                    onClick={() => openTaskModal(sm)}
                >
                    Add Task
                </Button>
                <Button
                    size="small"
                    icon={<EyeOutlined />}
                    onClick={() => navigate(
                    `/supervisor/sub-milestone/${projectId}/${milestoneId}/${sm._id}`
                    )}
                >
                    View
                </Button>
                </Space>
            }
            >
            <Row gutter={16}>
                <Col span={12}>
                <Text type="secondary">Description:</Text>
                <Paragraph ellipsis={{ rows: 2 }}>
                    {sm.description || 'No description'}
                </Paragraph>
                </Col>
                <Col span={6}>
                <Statistic
                    title="Tasks"
                    value={sm.taskCount || 0}
                    prefix={<FileOutlined />}
                />
                </Col>
                <Col span={6}>
                <Statistic
                    title="Sub-Milestones"
                    value={sm.subMilestones?.length || 0}
                    prefix={<FolderOutlined />}
                />
                </Col>
            </Row>

            {/* Recursively render nested sub-milestones */}
            {sm.subMilestones && sm.subMilestones.length > 0 && (
                <div style={{ marginTop: 12 }}>
                {renderSubMilestones(sm.subMilestones, level + 1)}
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
                    <Tag size="small" color={record.priority === 'CRITICAL' ? 'red' : 'blue'}>
                        {record.priority}
                    </Tag>
                    <Tag size="small">Weight: {record.taskWeight}%</Tag>
                </div>
            )
        },
        {
            title: 'Assignees',
            key: 'assignees',
            render: (_, record) => (
                <div>
                    {record.assignedTo?.map((a, idx) => (
                        <div key={idx}>
                            <Avatar size="small" icon={<UserOutlined />} />
                            <Text style={{ marginLeft: 8, fontSize: '12px' }}>
                                {a.user?.fullName}
                            </Text>
                        </div>
                    ))}
                </div>
            )
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status) => <Tag>{status}</Tag>
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => (
                <Space>
                    <Button size="small" icon={<EditOutlined />} 
                        onClick={() => navigate(`/supervisor/task/${record._id}`)} />
                    <Button size="small" danger icon={<DeleteOutlined />} 
                        onClick={() => handleDeleteTask(record._id)} />
                </Space>
            )
        }
    ];

    if (loading && !hierarchyData) {
        return (
            <div style={{ padding: '50px', textAlign: 'center' }}>
                <Spin size="large" />
            </div>
        );
    }

    if (!hierarchyData) {
        return (
            <Alert message="Sub-milestone not found" type="error" showIcon />
        );
    }

    return (
        <div style={{ padding: '24px' }}>
            <Card>
                <Space style={{ marginBottom: 24 }}>
                    <Button icon={<ArrowLeftOutlined />} 
                        onClick={() => navigate('/supervisor/milestones')}>
                        Back
                    </Button>
                    <Title level={3} style={{ margin: 0 }}>
                        <FolderOutlined /> {hierarchyData.title}
                    </Title>
                </Space>

                <Space style={{ float: 'right' }}>
                    <Button icon={<ReloadOutlined />} onClick={fetchSubMilestoneHierarchy} />
                    <Button type="primary" icon={<PlusOutlined />} 
                        onClick={() => openSubMilestoneModal()}>
                        Add Sub-Milestone
                    </Button>
                    <Button type="primary" icon={<FileOutlined />} 
                        onClick={() => openTaskModal()}>
                        Add Task
                    </Button>
                </Space>

                <Descriptions bordered size="small" style={{ marginTop: 16 }}>
                    <Descriptions.Item label="Weight">
                        <Tag color="blue">{hierarchyData.weight}%</Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="Status">
                        <Tag color={hierarchyData.status === 'Completed' ? 'green' : 'blue'}>
                            {hierarchyData.status}
                        </Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="Progress">
                        <Progress percent={hierarchyData.progress || 0} size="small" />
                    </Descriptions.Item>
                </Descriptions>

                <Divider />

                <div style={{ marginBottom: 24 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Title level={4}>
                        <FolderOutlined /> Nested Sub-Milestones
                        </Title>
                        <Badge count={hierarchyData.subMilestones?.length || 0} showZero>
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={() => openSubMilestoneModal()}
                        >
                            Add Sub-Milestone
                        </Button>
                        </Badge>
                    </div>

                    {hierarchyData.subMilestones && hierarchyData.subMilestones.length > 0 ? (
                        renderSubMilestones(hierarchyData.subMilestones)
                    ) : (
                        <Alert
                        message="No nested sub-milestones yet"
                        description="Break down this sub-milestone further by creating nested sub-milestones."
                        type="info"
                        showIcon
                        style={{ marginTop: 16 }}
                        />
                    )}
                    </div>

                <Divider />


                <Title level={4}>Tasks</Title>
                <Table
                    columns={taskColumns}
                    dataSource={tasks}
                    rowKey="_id"
                    size="small"
                />

                {/* Sub-milestone Modal */}
                <Modal
                    title="Create Sub-Milestone"
                    open={subMilestoneModalVisible}
                    onCancel={() => setSubMilestoneModalVisible(false)}
                    footer={null}
                    width={800}
                >
                    <Form form={subMilestoneForm} onFinish={handleCreateSubMilestone} layout="vertical">
                        <Form.Item name="title" label="Title" rules={[{ required: true }]}>
                            <Input />
                        </Form.Item>
                        <Form.Item name="description" label="Description">
                            <TextArea rows={3} />
                        </Form.Item>
                        <Form.Item name="weight" label="Weight (%)" rules={[{ required: true }]}>
                            <InputNumber min={1} max={100} style={{ width: '100%' }} />
                        </Form.Item>
                        <Form.Item name="dueDate" label="Due Date">
                            <DatePicker style={{ width: '100%' }} />
                        </Form.Item>
                        <Form.Item name="assignedSupervisor" label="Assign To" rules={[{ required: true }]}>
                            <Select showSearch loading={usersLoading}>
                                {users.map(u => (
                                    <Option key={u._id} value={u._id}>{u.fullName}</Option>
                                ))}
                            </Select>
                        </Form.Item>
                        {/* KPI Linking UI here (similar to previous) */}
                        <Button type="primary" htmlType="submit">Create</Button>
                    </Form>
                </Modal>

                {/* Task Modal - Show assignee KPIs */}
                <Modal
                    title={
                        <Space>
                            <FileOutlined />
                            {selectedSubMilestone 
                                ? `Create Task under "${selectedSubMilestone.title}"`
                                : 'Create Task under Sub-Milestone'
                            }
                        </Space>
                    }
                    open={taskModalVisible}
                    onCancel={() => {
                        setTaskModalVisible(false);
                        taskForm.resetFields();
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
                        description="Tasks must sum to 100% of the parent sub-milestone weight."
                        type="info"
                        showIcon
                        style={{ marginBottom: 16 }}
                    />

                    <Form
                        form={taskForm}
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
                            label="Assign To (Multiple assignees supported)"
                            rules={[{ required: true, message: 'Please select at least one assignee' }]}
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
                                    const isLoading = loadingAssigneeKPIs[userId];

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
                                                <div style={{ textAlign: 'center', padding: '20px' }}>
                                                    <Spin size="small" />
                                                    <div style={{ marginTop: 8 }}>
                                                        <Text type="secondary">Loading KPIs...</Text>
                                                    </div>
                                                </div>
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
                                    taskForm.resetFields();
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
            </Card>
        </div>
    );
};

export default SupervisorSubMilestoneDetail;