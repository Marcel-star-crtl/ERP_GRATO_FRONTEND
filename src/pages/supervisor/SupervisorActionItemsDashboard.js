import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Card,
    Table,
    Button,
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
    Progress,
    Avatar,
    Alert,
    Modal,
    Form,
    Rate,
    Input
} from 'antd';
import {
    CheckCircleOutlined,
    CloseCircleOutlined,
    EyeOutlined,
    ReloadOutlined,
    FlagOutlined,
    UserOutlined,
    FileOutlined,
    PlayCircleOutlined,
    CheckOutlined,
    StarOutlined,
    EditOutlined,
    DeleteOutlined,
    SafetyOutlined
} from '@ant-design/icons';
import { actionItemAPI } from '../../services/actionItemAPI';
import moment from 'moment';
const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { TextArea } = Input;

const SupervisorActionItemsDashboard = () => {
    const navigate = useNavigate();
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('pending-completions');
    const [stats, setStats] = useState({
        total: 0,
        pendingCreation: 0,
        pendingCompletion: 0,
        inProgress: 0,
        completed: 0
    });

    // NEW: Additional state for modals and user info
    const [viewTaskModalVisible, setViewTaskModalVisible] = useState(false);
    const [approvalModalVisible, setApprovalModalVisible] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    const [selectedAssignee, setSelectedAssignee] = useState(null);
    const [approvalForm] = Form.useForm();

    // NEW: Get current user info
    const userInfo = JSON.parse(localStorage.getItem('user') || '{}');
    const currentUserId = userInfo.userId || userInfo.id;

    useEffect(() => {
        loadTasks();
        loadStats();
    }, [activeTab]);

    const loadTasks = async () => {
        try {
            setLoading(true);
            const filters = { view: 'my-approvals' };
            const result = await actionItemAPI.getActionItems(filters);

            if (result.success) {
                let filteredTasks = result.data;

                if (activeTab === 'pending-creations') {
                    filteredTasks = filteredTasks.filter(t => t.status === 'Pending Approval');
                } else if (activeTab === 'pending-completions') {
                    filteredTasks = filteredTasks.filter(t =>
                        t.status === 'Pending Completion Approval' ||
                        (t.assignedTo && t.assignedTo.some(a => a.completionStatus === 'submitted'))
                    );
                } else if (activeTab === 'my-tasks') {
                    filteredTasks = filteredTasks.filter(t =>
                        ['Not Started', 'In Progress'].includes(t.status)
                    );
                }
                setTasks(filteredTasks);
            } else {
                message.error(result.message);
            }
        } catch (error) {
            console.error('Error loading tasks:', error);
            message.error('Failed to load tasks');
        } finally {
            setLoading(false);
        }
    };

    const loadStats = async () => {
        try {
            const result = await actionItemAPI.getActionItemStats();
            if (result.success) {
                const data = result.data;
                
                // Count pending completions by checking assignees
                const allTasks = await actionItemAPI.getActionItems({ view: 'my-approvals' });
                const pendingCompletions = allTasks.data?.filter(t => 
                    t.assignedTo && t.assignedTo.some(a => a.completionStatus === 'submitted')
                ).length || 0;

                setStats({
                    total: data.total,
                    pendingCreation: data.pending || 0,
                    pendingCompletion: pendingCompletions,
                    inProgress: data.inProgress,
                    completed: data.completed
                });
            }
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    };

    // NEW: Handler functions
    const openViewTaskModal = (task) => {
        setSelectedTask(task);
        setViewTaskModalVisible(true);
    };

    const openApprovalModal = (task, assignee) => {
        setSelectedTask(task);
        setSelectedAssignee(assignee);
        approvalForm.resetFields();
        setApprovalModalVisible(true);
    };

    const handleStartTask = async (taskId) => {
        try {

            const token = localStorage.getItem('token');
            const response = await fetch(`${process.env.REACT_APP_API_URL}/action-items/${taskId}/status`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: 'In Progress' })
            });

            const result = await response.json();
            if (result.success) {
                message.success('Task started! You can now work on it.');
                loadTasks();
                loadStats();
            } else {
                message.error(result.message || 'Failed to start task');
            }
        } catch (error) {
            console.error('Error starting task:', error);
            message.error('Failed to start task');
        }
    };

    const openSubmitCompletionModal = (task) => {
        navigate(`/employee/action-items`); // Redirect to full action items page for submission
    };

    const openModal = (task) => {
        navigate(`/supervisor/task/${task._id}`);
    };

    const handleDelete = (taskId) => {
        Modal.confirm({
            title: 'Delete Task',
            content: 'Are you sure you want to delete this task?',
            okText: 'Delete',
            okType: 'danger',
            onOk: async () => {
                try {
                    // const token = localStorage.getItem('token');
                    // const response = await fetch(`http://localhost:5001/api/action-items/${taskId}`, {
                    //     method: 'DELETE',
                    //     headers: {
                    //         'Authorization': `Bearer ${token}`
                    //     }
                    // });

                    const token = localStorage.getItem('token');
                    const response = await fetch(`${process.env.REACT_APP_API_URL}/action-items/${taskId}`, {
                        method: 'DELETE',
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });

                    const result = await response.json();
                    
                    if (result.success) {
                        message.success('Task deleted successfully');
                        loadTasks();
                        loadStats();
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

    const handleApproveCompletion = async (values) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(
                `${process.env.REACT_APP_API_URL}/action-items/${selectedTask._id}/assignee/${selectedAssignee.user._id}/approve-completion`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        grade: values.grade,
                        qualityNotes: values.qualityNotes,
                        comments: values.comments
                    })
                }
            );

            const result = await response.json();
            if (result.success) {
                message.success(`Completion approved with grade ${values.grade}/5`);
                setApprovalModalVisible(false);
                loadTasks();
                loadStats();
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
                    // const token = localStorage.getItem('token');
                    // const response = await fetch(
                    //     `http://localhost:5001/api/action-items/${selectedTask._id}/assignee/${assigneeUserId}/reject-completion`,
                    //     {
                    //         method: 'POST',
                    //         headers: {
                    //             'Authorization': `Bearer ${token}`,
                    //             'Content-Type': 'application/json'
                    //         },
                    //         body: JSON.stringify({ comments })
                    //     }
                    // );

                    const token = localStorage.getItem('token');
                    const response = await fetch(
                        `${process.env.REACT_APP_API_URL}/action-items/${selectedTask._id}/assignee/${assigneeUserId}/reject-completion`,
                        {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${token}`,
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({ comments })
                        }
                    );

                    const result = await response.json();
                    if (result.success) {
                        message.success('Completion rejected - sent back for revision');
                        setApprovalModalVisible(false);
                        loadTasks();
                        loadStats();
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

    const handleApproveCreation = async (taskId, decision, comments) => {
        try {
            const result = await actionItemAPI.processCreationApproval(taskId, decision, comments);
            
            if (result.success) {
                message.success(`Task creation ${decision}d successfully`);
                loadTasks();
                loadStats();
            } else {
                message.error(result.message);
            }
        } catch (error) {
            console.error('Error processing approval:', error);
            message.error('Failed to process approval');
        }
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

    const columns = [
        {
            title: 'Task',
            key: 'task',
            render: (_, record) => {
                const isTaskSupervisor = record.supervisor && 
                                        record.supervisor.email === userInfo.email;
                
                return (
                    <div>
                        <Space align="start">
                            <div style={{ flex: 1 }}>
                                <Text strong>{record.title}</Text>
                                {isTaskSupervisor && (
                                    <Tag 
                                        size="small" 
                                        color="orange" 
                                        style={{ marginLeft: 8 }}
                                    >
                                        You're Supervisor
                                    </Tag>
                                )}
                            </div>
                        </Space>
                        <br />
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                            {record.description?.substring(0, 50)}...
                        </Text>
                        <br />
                        <Space size={4} wrap style={{ marginTop: 4 }}>
                            <Tag size="small" color={getPriorityColor(record.priority)} icon={<FlagOutlined />}>
                                {record.priority}
                            </Tag>
                            {record.milestoneId && (
                                <Tag size="small" color="purple">Milestone Task</Tag>
                            )}
                            {!record.milestoneId && (
                                <Tag size="small" color="cyan">Personal Task</Tag>
                            )}
                            {record.taskWeight > 0 && (
                                <Tag size="small" color="blue">Weight: {record.taskWeight}%</Tag>
                            )}
                        </Space>
                    </div>
                );
            },
            width: 340
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
                                    <Space size={4}>
                                        <Avatar size="small" icon={<UserOutlined />} />
                                        <Text style={{ fontSize: '12px' }}>
                                            {assignee.user?.fullName || 'Unknown'}
                                        </Text>
                                        {assignee.completionStatus === 'submitted' && (
                                            <Tag size="small" color="blue">
                                                <FileOutlined /> Submitted
                                            </Tag>
                                        )}
                                        {assignee.completionStatus === 'approved' && (
                                            <Tag size="small" color="green">
                                                Approved ({assignee.completionGrade?.score}/5)
                                            </Tag>
                                        )}
                                    </Space>
                                </div>
                            ))}
                            {record.assignedTo.length > 2 && (
                                <Text type="secondary" style={{ fontSize: '11px' }}>
                                    +{record.assignedTo.length - 2} more
                                </Text>
                            )}
                        </>
                    ) : (
                        <Text type="secondary">No assignees</Text>
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
            render: (_, record) => {
                // Check if current user is the supervisor
                const isTaskSupervisor = record.supervisor && 
                                record.supervisor.email === userInfo.email;
        
                const isAssignedToMe = record.assignedTo?.some(a => 
                    a.user && (a.user._id === currentUserId || a.user.id === currentUserId)
                );

                // Get my assignment if assigned to me
                const myAssignment = isAssignedToMe 
                    ? record.assignedTo.find(a => 
                        a.user && (a.user._id === currentUserId || a.user.id === currentUserId)
                    )
                    : null;

                // Determine available actions
                const canStart = isAssignedToMe && record.status === 'Not Started';
                
                const canSubmit = isAssignedToMe && 
                                record.status === 'In Progress' && 
                                myAssignment?.completionStatus === 'pending';
                
                const canGrade = isTaskSupervisor && 
                                record.status === 'Pending Completion Approval' &&
                                record.assignedTo?.some(a => a.completionStatus === 'submitted');

                const canApproveCreation = isTaskSupervisor && record.status === 'Pending Approval';

                const needsL2Review = record.status === 'Pending L2 Review';
                const assignee = record.assignedTo?.[0];

                return (
                    <Space size="small" wrap>
                        <Tooltip title="View Details">
                            <Button
                                size="small"
                                icon={<EyeOutlined />}
                                onClick={() => openViewTaskModal(record)}
                            />
                        </Tooltip>
                        
                        {canApproveCreation && (
                            <Tooltip title="Approve Task Creation">
                                <Button
                                    size="small"
                                    type="primary"
                                    icon={<CheckCircleOutlined />}
                                    onClick={() => navigate(`/supervisor/task-creation-approval/${record._id}`)}
                                >
                                    Review
                                </Button>
                            </Tooltip>
                        )}
                        
                        {canStart && (
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
                        
                        {canSubmit && (
                            <Tooltip title="Submit task for supervisor approval">
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
                        
                        {canGrade && (
                            <Tooltip title="Review & Grade (You are the supervisor)">
                                <Button
                                    size="small"
                                    type="primary"
                                    icon={<StarOutlined />}
                                    onClick={() => {
                                        const submittedAssignee = record.assignedTo.find(
                                            a => a.completionStatus === 'submitted'
                                        );
                                        if (submittedAssignee) {
                                            openApprovalModal(record, submittedAssignee);
                                        }
                                    }}
                                    style={{ backgroundColor: '#faad14', borderColor: '#faad14' }}
                                >
                                    Grade
                                </Button>
                            </Tooltip>
                        )}

                        {needsL2Review && assignee && (
                            <Tooltip title="Level 2 Review (Supervisor's Supervisor)">
                                <Button
                                    type="primary"
                                    size="small"
                                    icon={<SafetyOutlined />}
                                    onClick={() => navigate(`/supervisor/action-items/${record._id}/assignee/${assignee.user._id}/review-l2`)}
                                    style={{ backgroundColor: '#fa8c16', borderColor: '#fa8c16' }}
                                >
                                    Review (L2)
                                </Button>
                            </Tooltip>
                        )}
                        
                        {['Not Started', 'In Progress'].includes(record.status) && isTaskSupervisor && (
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
                );
            },
            width: 280,
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
                        <CheckCircleOutlined /> Task Approvals & Management
                    </Title>
                    <Button
                        icon={<ReloadOutlined />}
                        onClick={() => {
                            loadTasks();
                            loadStats();
                        }}
                        loading={loading}
                    >
                        Refresh
                    </Button>
                </div>

                <Alert
                    message="Supervisor Responsibilities"
                    description="Approve task creation requests, review and grade completed work. Your grades affect employee KPI achievements and project progress."
                    type="info"
                    showIcon
                    style={{ marginBottom: 24 }}
                />

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
                                title="Pending Creation"
                                value={stats.pendingCreation}
                                valueStyle={{ color: '#faad14' }}
                            />
                        </Col>
                        <Col xs={12} sm={8} md={4}>
                            <Statistic
                                title="Pending Grading"
                                value={stats.pendingCompletion}
                                valueStyle={{ color: '#1890ff' }}
                            />
                        </Col>
                        <Col xs={12} sm={8} md={4}>
                            <Statistic
                                title="In Progress"
                                value={stats.inProgress}
                                valueStyle={{ color: '#52c41a' }}
                            />
                        </Col>
                        <Col xs={12} sm={8} md={4}>
                            <Statistic
                                title="Completed"
                                value={stats.completed}
                                valueStyle={{ color: '#722ed1' }}
                            />
                        </Col>
                    </Row>
                </Card>

                <Tabs activeKey={activeTab} onChange={setActiveTab} style={{ marginBottom: '16px' }}>
                    <TabPane 
                        tab={
                            <Badge count={stats.pendingCompletion} size="small">
                                <span>Pending Grading</span>
                            </Badge>
                        } 
                        key="pending-completions"
                    />
                    <TabPane 
                        tab={
                            <Badge count={stats.pendingCreation} size="small">
                                <span>Creation Approvals</span>
                            </Badge>
                        } 
                        key="pending-creations"
                    />
                    <TabPane 
                        tab="My Tasks" 
                        key="my-tasks"
                    />
                    <TabPane 
                        tab="All Team Tasks" 
                        key="all-tasks"
                    />
                </Tabs>

                <Table
                    columns={columns}
                    dataSource={tasks}
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

            {/* Approval Modal */}
            <Modal
                title={
                    <Space>
                        <StarOutlined style={{ color: '#faad14' }} />
                        Review & Grade Task Completion
                    </Space>
                }
                open={approvalModalVisible}
                onCancel={() => {
                    setApprovalModalVisible(false);
                    setSelectedTask(null);
                    setSelectedAssignee(null);
                    approvalForm.resetFields();
                }}
                footer={null}
                width={700}
            >
                {selectedTask && selectedAssignee && (
                    <div>
                        <Alert
                            message="Grade Task Completion"
                            description="Review the submitted work and assign a grade from 1-5. This grade will contribute to the employee's KPI achievement."
                            type="info"
                            showIcon
                            style={{ marginBottom: '16px' }}
                        />

                        <Card size="small" style={{ marginBottom: '16px', backgroundColor: '#fafafa' }}>
                            <Text strong>Task: </Text>
                            <Text>{selectedTask.title}</Text>
                            <br />
                            <Text strong>Submitted by: </Text>
                            <Text>{selectedAssignee.user?.fullName}</Text>
                            <br />
                            <Text strong>Completion Notes: </Text>
                            <Text type="secondary">{selectedAssignee.completionNotes || 'No notes provided'}</Text>
                            <br />
                            <Text strong>Documents: </Text>
                            <Text>{selectedAssignee.completionDocuments?.length || 0} file(s)</Text>
                        </Card>

                        <Form
                            form={approvalForm}
                            layout="vertical"
                            onFinish={handleApproveCompletion}
                        >
                            <Form.Item
                                name="grade"
                                label="Quality Grade"
                                rules={[{ required: true, message: 'Please assign a grade' }]}
                            >
                                <Rate count={5} tooltips={['Poor', 'Below Average', 'Average', 'Good', 'Excellent']} />
                            </Form.Item>

                            <Form.Item
                                name="qualityNotes"
                                label="Quality Assessment"
                            >
                                <TextArea 
                                    rows={3} 
                                    placeholder="Provide feedback on the quality of work..." 
                                />
                            </Form.Item>

                            <Form.Item
                                name="comments"
                                label="Additional Comments"
                            >
                                <TextArea 
                                    rows={2} 
                                    placeholder="Any additional feedback or suggestions..." 
                                />
                            </Form.Item>

                            <Form.Item>
                                <Space>
                                    <Button 
                                        danger
                                        icon={<CloseCircleOutlined />}
                                        onClick={() => handleRejectCompletion(selectedAssignee.user._id)}
                                    >
                                        Reject
                                    </Button>
                                    <Button onClick={() => {
                                        setApprovalModalVisible(false);
                                        setSelectedTask(null);
                                        setSelectedAssignee(null);
                                        approvalForm.resetFields();
                                    }}>
                                        Cancel
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
                    </div>
                )}
            </Modal>

            {/* View Task Modal - Simple version */}
            <Modal
                title="Task Details"
                open={viewTaskModalVisible}
                onCancel={() => {
                    setViewTaskModalVisible(false);
                    setSelectedTask(null);
                }}
                footer={
                    <Button onClick={() => setViewTaskModalVisible(false)}>
                        Close
                    </Button>
                }
                width={800}
            >
                {selectedTask && (
                    <div>
                        <Card size="small">
                            <Text strong>Title: </Text>
                            <Text>{selectedTask.title}</Text>
                            <br />
                            <Text strong>Description: </Text>
                            <Text>{selectedTask.description}</Text>
                            <br />
                            <Text strong>Status: </Text>
                            <Tag color={getStatusColor(selectedTask.status)}>{selectedTask.status}</Tag>
                            <br />
                            <Text strong>Priority: </Text>
                            <Tag color={getPriorityColor(selectedTask.priority)}>{selectedTask.priority}</Tag>
                        </Card>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default SupervisorActionItemsDashboard;










// // frontend/src/components/Supervisor/SupervisorActionItemsDashboard.jsx

// import React, { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import {
//     Card,
//     Table,
//     Button,
//     Tag,
//     Space,
//     Typography,
//     Row,
//     Col,
//     message,
//     Tabs,
//     Badge,
//     Tooltip,
//     Statistic,
//     Progress,
//     Avatar,
//     Alert
// } from 'antd';
// import {
//     CheckCircleOutlined,
//     CloseCircleOutlined,
//     EyeOutlined,
//     ReloadOutlined,
//     FlagOutlined,
//     UserOutlined,
//     FileOutlined
// } from '@ant-design/icons';
// import { actionItemAPI } from '../../services/actionItemAPI';
// import moment from 'moment';

// const { Title, Text } = Typography;
// const { TabPane } = Tabs;

// const SupervisorActionItemsDashboard = () => {
//     const navigate = useNavigate();
//     const [tasks, setTasks] = useState([]);
//     const [loading, setLoading] = useState(false);
//     const [activeTab, setActiveTab] = useState('pending-completions');
//     const [stats, setStats] = useState({
//         total: 0,
//         pendingCreation: 0,
//         pendingCompletion: 0,
//         inProgress: 0,
//         completed: 0
//     });

//     useEffect(() => {
//         loadTasks();
//         loadStats();
//     }, [activeTab]);

//     const loadTasks = async () => {
//         try {
//             setLoading(true);
//             const filters = { view: 'my-approvals' };
//             const result = await actionItemAPI.getActionItems(filters);

//             if (result.success) {
//                 let filteredTasks = result.data;

//                 if (activeTab === 'pending-creations') {
//                     filteredTasks = filteredTasks.filter(t => t.status === 'Pending Approval');
//                 } else if (activeTab === 'pending-completions') {
//                 filteredTasks = filteredTasks.filter(t =>
//                 t.status === 'Pending Completion Approval' ||
//                 (t.assignedTo && t.assignedTo.some(a => a.completionStatus === 'submitted'))
//                 );
//                 } else if (activeTab === 'my-tasks') {
//                 filteredTasks = filteredTasks.filter(t =>
//                 ['Not Started', 'In Progress'].includes(t.status)
//                 );
//                 }
//                 setTasks(filteredTasks);
//         } else {
//             message.error(result.message);
//         }
//     } catch (error) {
//         console.error('Error loading tasks:', error);
//         message.error('Failed to load tasks');
//     } finally {
//         setLoading(false);
//     }
// };

// const loadStats = async () => {
//     try {
//         const result = await actionItemAPI.getActionItemStats();
//         if (result.success) {
//             const data = result.data;
            
//             // Count pending completions by checking assignees
//             const allTasks = await actionItemAPI.getActionItems({ view: 'my-approvals' });
//             const pendingCompletions = allTasks.data?.filter(t => 
//                 t.assignedTo && t.assignedTo.some(a => a.completionStatus === 'submitted')
//             ).length || 0;

//             setStats({
//                 total: data.total,
//                 pendingCreation: data.pending || 0,
//                 pendingCompletion: pendingCompletions,
//                 inProgress: data.inProgress,
//                 completed: data.completed
//             });
//         }
//     } catch (error) {
//         console.error('Error loading stats:', error);
//     }
// };

// const handleApproveCreation = async (taskId, decision, comments) => {
//     try {
//         const result = await actionItemAPI.processCreationApproval(taskId, decision, comments);
        
//         if (result.success) {
//             message.success(`Task creation ${decision}d successfully`);
//             loadTasks();
//             loadStats();
//         } else {
//             message.error(result.message);
//         }
//     } catch (error) {
//         console.error('Error processing approval:', error);
//         message.error('Failed to process approval');
//     }
// };

// const getPriorityColor = (priority) => {
//     const colors = {
//         'LOW': 'green',
//         'MEDIUM': 'blue',
//         'HIGH': 'orange',
//         'CRITICAL': 'red'
//     };
//     return colors[priority] || 'default';
// };

// const getStatusColor = (status) => {
//     const colors = {
//         'Not Started': 'default',
//         'In Progress': 'processing',
//         'Pending Approval': 'warning',
//         'Pending Completion Approval': 'cyan',
//         'Completed': 'success',
//         'On Hold': 'warning',
//         'Rejected': 'error'
//     };
//     return colors[status] || 'default';
// };

// const columns = [
//     {
//         title: 'Task',
//         key: 'task',
//         render: (_, record) => (
//             <div>
//                 <Text strong>{record.title}</Text>
//                 <br />
//                 <Text type="secondary" style={{ fontSize: '12px' }}>
//                     {record.description?.substring(0, 50)}...
//                 </Text>
//                 <br />
//                 <Space size={4} wrap style={{ marginTop: 4 }}>
//                     <Tag size="small" color={getPriorityColor(record.priority)} icon={<FlagOutlined />}>
//                         {record.priority}
//                     </Tag>
//                     {record.milestoneId && (
//                         <Tag size="small" color="purple">Milestone Task</Tag>
//                     )}
//                     {!record.milestoneId && (
//                         <Tag size="small" color="cyan">Personal Task</Tag>
//                     )}
//                     {record.taskWeight > 0 && (
//                         <Tag size="small" color="blue">Weight: {record.taskWeight}%</Tag>
//                     )}
//                 </Space>
//             </div>
//         ),
//         width: 300
//     },
//     {
//         title: 'Assignees',
//         key: 'assignees',
//         render: (_, record) => (
//             <div>
//                 {record.assignedTo && record.assignedTo.length > 0 ? (
//                     <>
//                         {record.assignedTo.slice(0, 2).map((assignee, idx) => (
//                             <div key={idx} style={{ marginBottom: 4 }}>
//                                 <Space size={4}>
//                                     <Avatar size="small" icon={<UserOutlined />} />
//                                     <Text style={{ fontSize: '12px' }}>
//                                         {assignee.user?.fullName || 'Unknown'}
//                                     </Text>
//                                     {assignee.completionStatus === 'submitted' && (
//                                         <Tag size="small" color="blue">
//                                             <FileOutlined /> Submitted
//                                         </Tag>
//                                     )}
//                                     {assignee.completionStatus === 'approved' && (
//                                         <Tag size="small" color="green">
//                                             Approved ({assignee.completionGrade?.score}/5)
//                                         </Tag>
//                                     )}
//                                 </Space>
//                             </div>
//                         ))}
//                         {record.assignedTo.length > 2 && (
//                             <Text type="secondary" style={{ fontSize: '11px' }}>
//                                 +{record.assignedTo.length - 2} more
//                             </Text>
//                         )}
//                     </>
//                 ) : (
//                     <Text type="secondary">No assignees</Text>
//                 )}
//             </div>
//         ),
//         width: 200
//     },
//     {
//         title: 'Progress',
//         key: 'progress',
//         render: (_, record) => (
//             <Progress 
//                 percent={record.progress || 0} 
//                 size="small"
//                 status={record.progress === 100 ? 'success' : 'active'}
//             />
//         ),
//         width: 120
//     },
//     {
//         title: 'Status',
//         dataIndex: 'status',
//         key: 'status',
//         render: (status) => (
//             <Tag color={getStatusColor(status)}>
//                 {status}
//             </Tag>
//         ),
//         width: 150
//     },
//     {
//         title: 'Due Date',
//         key: 'dueDate',
//         render: (_, record) => {
//             const isOverdue = moment(record.dueDate).isBefore(moment()) && record.status !== 'Completed';
//             return (
//                 <div>
//                     <Text type={isOverdue ? 'danger' : 'secondary'}>
//                         {moment(record.dueDate).format('MMM DD, YYYY')}
//                     </Text>
//                     {isOverdue && (
//                         <>
//                             <br />
//                             <Tag color="red" size="small">Overdue</Tag>
//                         </>
//                     )}
//                 </div>
//             );
//         },
//         width: 120
//     },
//     // {
//     //     title: 'Actions',
//     //     key: 'actions',
//     //     render: (_, record) => {
//     //         // Check if there are submitted completions
//     //         const submittedAssignees = record.assignedTo?.filter(a => a.completionStatus === 'submitted') || [];

//     //         return (
//     //             <Space size="small">
//     //                 {record.status === 'Pending Approval' && (
//     //                     <>
//     //                         <Tooltip title="Approve Task Creation">
//     //                             <Button
//     //                                 size="small"
//     //                                 type="primary"
//     //                                 icon={<CheckCircleOutlined />}
//     //                                 onClick={() => navigate(`/supervisor/task-creation-approval/${record._id}`)}
//     //                             >
//     //                                 Review
//     //                             </Button>
//     //                         </Tooltip>
//     //                     </>
//     //                 )}
//     //                 {submittedAssignees.length > 0 && (
//     //                     <>
//     //                         {submittedAssignees.map(assignee => (
//     //                             <Tooltip key={assignee.user._id} title={`Review ${assignee.user.fullName}'s completion`}>
//     //                                 <Button
//     //                                     size="small"
//     //                                     type="primary"
//     //                                     icon={<CheckCircleOutlined />}
//     //                                     onClick={() => navigate(`/supervisor/task-completion-approval/${record._id}/${assignee.user._id}`)}
//     //                                 >
//     //                                     Grade
//     //                                 </Button>
//     //                             </Tooltip>
//     //                         ))}
//     //                     </>
//     //                 )}
//     //                 <Tooltip title="View Details">
//     //                     <Button
//     //                         size="small"
//     //                         icon={<EyeOutlined />}
//     //                         onClick={() => navigate(`/supervisor/task/${record._id}`)}
//     //                     />
//     //                 </Tooltip>
//     //             </Space>
//     //         );
//     //     },
//     //     width: 200,
//     //     fixed: 'right'
//     // }

//     {
//         title: 'Actions',
//         key: 'actions',
//         render: (_, record) => {
//             // NEW: Check if current user is the supervisor
//             const isTaskSupervisor = record.supervisor && 
//                                     record.supervisor.email === userInfo.email;
            
//             // NEW: Check if current user is assigned
//             const isAssignedToMe = record.assignedTo?.some(a => 
//             a.user && (a.user._id === currentUserId || a.user.id === currentUserId)
//             );

//             // Get my assignment if assigned to me
//             const myAssignment = isAssignedToMe 
//             ? record.assignedTo.find(a => 
//                 a.user && (a.user._id === currentUserId || a.user.id === currentUserId)
//                 )
//             : null;

//             // Determine available actions
//             const canStart = isAssignedToMe && record.status === 'Not Started';
            
//             const canSubmit = isAssignedToMe && 
//                             record.status === 'In Progress' && 
//                             myAssignment?.completionStatus === 'pending';
            
//             const canGrade = isTaskSupervisor && 
//                             record.status === 'Pending Completion Approval' &&
//                             record.assignedTo?.some(a => a.completionStatus === 'submitted');

//             return (
//             <Space size="small" wrap>
//                 <Tooltip title="View Details">
//                 <Button
//                     size="small"
//                     icon={<EyeOutlined />}
//                     onClick={() => openViewTaskModal(record)}
//                 />
//                 </Tooltip>
                
//                 {canStart && (
//                 <Tooltip title="Start working on this task">
//                     <Button
//                     size="small"
//                     type="primary"
//                     icon={<PlayCircleOutlined />}
//                     onClick={() => handleStartTask(record._id)}
//                     >
//                     Start
//                     </Button>
//                 </Tooltip>
//                 )}
                
//                 {canSubmit && (
//                 <Tooltip title="Submit task for supervisor approval">
//                     <Button
//                     size="small"
//                     type="primary"
//                     icon={<CheckOutlined />}
//                     onClick={() => openSubmitCompletionModal(record)}
//                     style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
//                     >
//                     Submit
//                     </Button>
//                 </Tooltip>
//                 )}
                
//                 {canGrade && (
//                 <Tooltip title={`Review & Grade (You are the supervisor)`}>
//                     <Button
//                     size="small"
//                     type="primary"
//                     icon={<StarOutlined />}
//                     onClick={() => {
//                         const submittedAssignee = record.assignedTo.find(
//                         a => a.completionStatus === 'submitted'
//                         );
//                         if (submittedAssignee) {
//                         openApprovalModal(record, submittedAssignee);
//                         }
//                     }}
//                     style={{ backgroundColor: '#faad14', borderColor: '#faad14' }}
//                     >
//                     Grade
//                     </Button>
//                 </Tooltip>
//                 )}
                
//                 {record.status === 'Pending Approval' && (
//                 <Tooltip title={
//                     isTaskSupervisor 
//                     ? "Approve task creation" 
//                     : "Awaiting supervisor approval"
//                 }>
//                     <Button size="small" type="dashed" disabled={!isTaskSupervisor}>
//                     Pending
//                     </Button>
//                 </Tooltip>
//                 )}
                
//                 {['Not Started', 'In Progress'].includes(record.status) && isTaskSupervisor && (
//                 <>
//                     <Tooltip title="Edit">
//                     <Button
//                         size="small"
//                         icon={<EditOutlined />}
//                         onClick={() => openModal(record)}
//                     />
//                     </Tooltip>
//                     <Tooltip title="Delete">
//                     <Button
//                         size="small"
//                         danger
//                         icon={<DeleteOutlined />}
//                         onClick={() => handleDelete(record._id)}
//                     />
//                     </Tooltip>
//                 </>
//                 )}
//             </Space>
//             );
//         },
//         width: 280,
//         fixed: 'right'
//         }
// ];

// return (
//     <div style={{ padding: '24px' }}>
//         <Card>
//             <div style={{ 
//                 display: 'flex', 
//                 justifyContent: 'space-between', 
//                 alignItems: 'center',
//                 marginBottom: '24px'
//             }}>
//                 <Title level={2} style={{ margin: 0 }}>
//                     <CheckCircleOutlined /> Task Approvals & Management
//                 </Title>
//                 <Button
//                     icon={<ReloadOutlined />}
//                     onClick={() => {
//                         loadTasks();
//                         loadStats();
//                     }}
//                     loading={loading}
//                 >
//                     Refresh
//                 </Button>
//             </div>

//             <Alert
//                 message="Supervisor Responsibilities"
//                 description="Approve task creation requests, review and grade completed work. Your grades affect employee KPI achievements and project progress."
//                 type="info"
//                 showIcon
//                 style={{ marginBottom: 24 }}
//             />

//             <Card size="small" style={{ marginBottom: '24px', backgroundColor: '#f0f8ff' }}>
//                 <Row gutter={16}>
//                     <Col xs={12} sm={8} md={4}>
//                         <Statistic
//                             title="Total Tasks"
//                             value={stats.total}
//                             prefix={<CheckCircleOutlined />}
//                         />
//                     </Col>
//                     <Col xs={12} sm={8} md={4}>
//                         <Statistic
//                             title="Pending Creation"
//                             value={stats.pendingCreation}
//                             valueStyle={{ color: '#faad14' }}
//                         />
//                     </Col>
//                     <Col xs={12} sm={8} md={4}>
//                         <Statistic
//                             title="Pending Grading"
//                             value={stats.pendingCompletion}
//                             valueStyle={{ color: '#1890ff' }}
//                         />
//                     </Col>
//                     <Col xs={12} sm={8} md={4}>
//                         <Statistic
//                             title="In Progress"
//                             value={stats.inProgress}
//                             valueStyle={{ color: '#52c41a' }}
//                         />
//                     </Col>
//                     <Col xs={12} sm={8} md={4}>
//                         <Statistic
//                             title="Completed"
//                             value={stats.completed}
//                             valueStyle={{ color: '#722ed1' }}
//                         />
//                     </Col>
//                 </Row>
//             </Card>

//             <Tabs activeKey={activeTab} onChange={setActiveTab} style={{ marginBottom: '16px' }}>
//                 <TabPane 
//                     tab={
//                         <Badge count={stats.pendingCompletion} size="small">
//                             <span>Pending Grading</span>
//                         </Badge>
//                     } 
//                     key="pending-completions"
//                 />
//                 <TabPane 
//                     tab={
//                         <Badge count={stats.pendingCreation} size="small">
//                             <span>Creation Approvals</span>
//                         </Badge>
//                     } 
//                     key="pending-creations"
//                 />
//                 <TabPane 
//                     tab="My Tasks" 
//                     key="my-tasks"
//                 />
//                 <TabPane 
//                     tab="All Team Tasks" 
//                     key="all-tasks"
//                 />
//             </Tabs>

//             <Table
//                 columns={columns}
//                 dataSource={tasks}
//                 loading={loading}
//                 rowKey="_id"
//                 pagination={{
//                     showSizeChanger: true,
//                     showQuickJumper: true,
//                     showTotal: (total) => `Total ${total} tasks`
//                 }}
//                 scroll={{ x: 1400 }}
//                 size="small"
//             />
//         </Card>
//     </div>
// );
// };
// export default SupervisorActionItemsDashboard;