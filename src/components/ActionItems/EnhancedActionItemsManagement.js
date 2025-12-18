import React, { useState, useEffect } from 'react';
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
    Select,
    Alert
} from 'antd';
import {
    PlusOutlined,
    ReloadOutlined,
    CheckCircleOutlined,
    FlagOutlined,
    UserOutlined,
    TrophyOutlined,
    FileOutlined
} from '@ant-design/icons';
import { actionItemAPI } from '../../services/actionItemAPI';
import { useSelector } from 'react-redux';
import moment from 'moment';
import CreatePersonalTask from './CreatePersonalTask';

const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;

const EnhancedActionItemsManagement = () => {
    const { user } = useSelector((state) => state.auth);
    const [actionItems, setActionItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('my-tasks');
    const [personalTaskModalVisible, setPersonalTaskModalVisible] = useState(false);
    const [stats, setStats] = useState({
        total: 0,
        notStarted: 0,
        inProgress: 0,
        completed: 0,
        pending: 0
    });

    useEffect(() => {
        loadActionItems();
        loadStats();
    }, [activeTab]);

    const loadActionItems = async () => {
        try {
            setLoading(true);
            const filters = { view: activeTab };
            const result = await actionItemAPI.getActionItems(filters);

            if (result.success) {
                setActionItems(result.data);
            } else {
                message.error(result.message);
            }
        } catch (error) {
            console.error('Error loading action items:', error);
            message.error('Failed to load tasks');
        } finally {
            setLoading(false);
        }
    };

    const loadStats = async () => {
        try {
            const result = await actionItemAPI.getActionItemStats();
            if (result.success) {
                setStats(result.data);
            }
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    };

    const handleSubmitForCompletion = async (taskId) => {
        // Navigate to submission page
        window.location.href = `/employee/task/${taskId}/submit-completion`;
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

    const canSubmitForCompletion = (task) => {
        // Check if user is an assignee
        const userAssignment = task.assignedTo?.find(a => a.user._id === user._id);
        if (!userAssignment) return false;

        // Check status
        return ['In Progress', 'Not Started'].includes(task.status) && 
               userAssignment.completionStatus === 'pending';
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
                    <Space size={4} wrap style={{ marginTop: 4 }}>
                        <Tag size="small" color={getPriorityColor(record.priority)} icon={<FlagOutlined />}>
                            {record.priority}
                        </Tag>
                        {record.milestoneId && (
                            <Tag size="small" color="purple">
                                Milestone Task
                            </Tag>
                        )}
                        {record.taskWeight > 0 && (
                            <Tag size="small" color="blue">
                                Weight: {record.taskWeight}%
                            </Tag>
                        )}
                        {!record.milestoneId && (
                            <Tag size="small" color="cyan">
                                Personal Task
                            </Tag>
                        )}
                    </Space>
                </div>
            ),
            width: 300
        },
        {
            title: 'Linked KPIs',
            key: 'kpis',
            render: (_, record) => (
                <div>
                    {record.linkedKPIs && record.linkedKPIs.length > 0 ? (
                        record.linkedKPIs.map((kpi, idx) => (
                            <Tag key={idx} size="small" color="gold" icon={<TrophyOutlined />}>
                                {kpi.kpiTitle} ({kpi.kpiWeight}%)
                            </Tag>
                        ))
                    ) : (
                        <Text type="secondary">No KPIs linked</Text>
                    )}
                </div>
            ),
            width: 200
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
            render: (_, record) => {
                // Find user's assignment
                const userAssignment = record.assignedTo?.find(a => a.user._id === user._id);
                
                return (
                    <div>
                        <Progress 
                            percent={record.progress || 0} 
                            size="small"
                            status={record.progress === 100 ? 'success' : 'active'}
                        />
                        {userAssignment && (
                            <Text type="secondary" style={{ fontSize: '11px' }}>
                                Your status: {userAssignment.completionStatus}
                            </Text>
                        )}
                    </div>
                );
            },
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
                const userAssignment = record.assignedTo?.find(a => a.user._id === user._id);
                
                return (
                    <Space size="small">
                        {record.status === 'Pending Approval' && (
                            <Tooltip title="Awaiting supervisor approval">
                                <Tag color="warning">Pending</Tag>
                            </Tooltip>
                        )}
                        {canSubmitForCompletion(record) && (
                            <Tooltip title="Submit for completion approval">
                                <Button
                                    size="small"
                                    type="primary"
                                    icon={<FileOutlined />}
                                    onClick={() => handleSubmitForCompletion(record._id)}
                                >
                                    Submit
                                </Button>
                            </Tooltip>
                        )}
                        {userAssignment?.completionStatus === 'submitted' && (
                            <Tag color="blue">Awaiting Approval</Tag>
                        )}
                        {userAssignment?.completionStatus === 'approved' && userAssignment.completionGrade && (
                            <Tooltip title={`Grade: ${userAssignment.completionGrade.score}/5`}>
                                <Tag color="green">
                                    <CheckCircleOutlined /> Approved ({userAssignment.completionGrade.score}/5)
                                </Tag>
                            </Tooltip>
                        )}
                        {userAssignment?.completionStatus === 'rejected' && (
                            <Tag color="red">Rejected - Revise</Tag>
                        )}
                    </Space>
                );
            },
            width: 180,
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
                        <CheckCircleOutlined /> My Tasks
                    </Title>
                    <Space>
                        <Button
                            icon={<ReloadOutlined />}
                            onClick={() => {
                                loadActionItems();
                                loadStats();
                            }}
                            loading={loading}
                        >
                            Refresh
                        </Button>
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={() => setPersonalTaskModalVisible(true)}
                        >
                            Create Personal Task
                        </Button>
                    </Space>
                </div>

                <Alert
                    message="Task Management"
                    description="You can create personal tasks linked to your KPIs, or be assigned tasks by your supervisor under project milestones. All tasks require supervisor approval before starting and upon completion."
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
                                title="Pending Approval"
                                value={stats.pending || 0}
                                valueStyle={{ color: '#faad14' }}
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
                    </Row>
                </Card>

                <Tabs activeKey={activeTab} onChange={setActiveTab} style={{ marginBottom: '16px' }}>
                    <TabPane 
                        tab={
                            <Badge count={stats.inProgress} size="small">
                                <span>My Active Tasks</span>
                            </Badge>
                        } 
                        key="my-tasks"
                    />
                    <TabPane 
                        tab="Milestone Tasks" 
                        key="project-tasks"
                    />
                    <TabPane 
                        tab="Personal Tasks" 
                        key="standalone-tasks"
                    />
                    <TabPane 
                        tab={
                            <Badge count={stats.completed} size="small">
                                <span>Completed</span>
                            </Badge>
                        } 
                        key="completed"
                    />
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

            <CreatePersonalTask
                visible={personalTaskModalVisible}
                onClose={() => setPersonalTaskModalVisible(false)}
                onSuccess={() => {
                    loadActionItems();
                    loadStats();
                }}
            />
        </div>
    );
};

export default EnhancedActionItemsManagement;

