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
    Statistic,
    Progress,
    message,
    Spin,
    Alert,
    Badge,
    Tooltip,
    Empty,
    Modal,
    Form,
    InputNumber,
    Input
} from 'antd';
import {
    FlagOutlined,
    PlusOutlined,
    EyeOutlined,
    CheckCircleOutlined,
    ReloadOutlined,
    WarningOutlined,
    PlayCircleOutlined,
    TrophyOutlined,
    FolderOutlined,
    RightOutlined
} from '@ant-design/icons';
import moment from 'moment';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

const { Title, Text } = Typography;
const { TextArea } = Input;

const SupervisorMilestoneDashboard = () => {
    const navigate = useNavigate();
    const [milestones, setMilestones] = useState([]);
    const [loading, setLoading] = useState(false);
    const [progressModalVisible, setProgressModalVisible] = useState(false);
    const [selectedMilestone, setSelectedMilestone] = useState(null);
    const [stats, setStats] = useState({
        total: 0,
        inProgress: 0,
        completed: 0,
        notStarted: 0
    });
    const [progressForm] = Form.useForm();

    useEffect(() => {
        fetchMyMilestones();
    }, []);

    const fetchMyMilestones = async () => {
        try {
            setLoading(true);
            const response = await api.get('/projects/my-milestones');

            if (!response.data.success) {
                throw new Error(response.data.message || 'Failed to fetch milestones');
            }

            setMilestones(response.data.data || []);
            
            const total = response.data.data.length;
            const inProgress = response.data.data.filter(m => m.milestone.status === 'In Progress').length;
            const completed = response.data.data.filter(m => m.milestone.status === 'Completed').length;
            const notStarted = response.data.data.filter(m => m.milestone.status === 'Not Started').length;
            
            setStats({ total, inProgress, completed, notStarted });
        } catch (error) {
            console.error('Error fetching milestones:', error);
            message.error(error.message || 'Failed to load your assigned milestones');
        } finally {
            setLoading(false);
        }
    };

    const openProgressModal = (projectRecord) => {
        setSelectedMilestone(projectRecord);
        progressForm.setFieldsValue({
            progress: projectRecord.milestone.progress || 0
        });
        setProgressModalVisible(true);
    };

    const handleUpdateProgress = async (values) => {
        try {
            const response = await api.patch(
                `/projects/${selectedMilestone.project._id}/milestones/${selectedMilestone.milestone._id}/progress`,
                {
                    progress: values.progress,
                    notes: values.notes
                }
            );

            if (!response.data.success) {
                throw new Error(response.data.message || 'Failed to update progress');
            }

            message.success('Milestone progress updated successfully!');
            setProgressModalVisible(false);
            progressForm.resetFields();
            setSelectedMilestone(null);
            fetchMyMilestones();
        } catch (error) {
            console.error('Error updating progress:', error);
            message.error(error.message || 'Failed to update milestone progress');
        }
    };

    const handleCompleteMilestone = async (projectId, milestoneId) => {
        try {
            const response = await api.post(
                `/projects/${projectId}/milestones/${milestoneId}/complete`
            );

            if (!response.data.success) {
                throw new Error(response.data.message || 'Failed to complete milestone');
            }

            message.success('Milestone marked as completed!');
            fetchMyMilestones();
        } catch (error) {
            console.error('Error completing milestone:', error);
            message.error(error.message || 'Failed to complete milestone');
        }
    };

    // const columns = [
    //     {
    //         title: 'Project',
    //         key: 'project',
    //         render: (_, record) => (
    //             <div>
    //                 <Text strong>{record.project.name}</Text>
    //                 <br />
    //                 <Text type="secondary" style={{ fontSize: '12px' }}>
    //                     {record.project.code}
    //                 </Text>
    //             </div>
    //         ),
    //         width: 250
    //     },
    //     {
    //         title: 'Milestone',
    //         key: 'milestone',
    //         render: (_, record) => (
    //             <div>
    //                 <Text strong>{record.milestone.title}</Text>
    //                 <br />
    //                 <Text type="secondary" style={{ fontSize: '12px' }}>
    //                     {record.milestone.description}
    //                 </Text>
    //                 <br />
    //                 <Tag color="blue" style={{ marginTop: 4 }}>
    //                     Weight: {record.milestone.weight}%
    //                 </Tag>
    //             </div>
    //         ),
    //         width: 300
    //     },
    //     {
    //         title: 'Progress',
    //         key: 'progress',
    //         render: (_, record) => (
    //             <div>
    //                 <Progress 
    //                     percent={record.milestone.progress || 0} 
    //                     size="small"
    //                     status={record.milestone.progress === 100 ? 'success' : 'active'}
    //                 />
    //                 <Text type="secondary" style={{ fontSize: '11px' }}>
    //                     Tasks: {record.milestone.taskStats?.completed || 0}/{record.milestone.taskStats?.total || 0}
    //                 </Text>
    //             </div>
    //         ),
    //         width: 150
    //     },
    //     {
    //         title: 'Task Weight',
    //         key: 'taskWeight',
    //         render: (_, record) => {
    //             const assigned = record.milestone.taskStats?.totalWeightAssigned || 0;
    //             const remaining = record.milestone.taskStats?.weightRemaining || 0;
    //             return (
    //                 <div>
    //                     <Text>{assigned}% / 100%</Text>
    //                     <br />
    //                     {remaining > 0 && (
    //                         <Text type="warning" style={{ fontSize: '11px' }}>
    //                             <WarningOutlined /> {remaining}% unassigned
    //                         </Text>
    //                     )}
    //                 </div>
    //             );
    //         },
    //         width: 120
    //     },
    //     {
    //         title: 'Status',
    //         dataIndex: ['milestone', 'status'],
    //         key: 'status',
    //         render: (status) => (
    //             <Tag color={
    //                 status === 'Completed' ? 'green' :
    //                 status === 'In Progress' ? 'blue' :
    //                 'default'
    //             }>
    //                 {status}
    //             </Tag>
    //         ),
    //         width: 120
    //     },
    //     {
    //         title: 'Due Date',
    //         key: 'dueDate',
    //         render: (_, record) => {
    //             const dueDate = record.milestone.dueDate;
    //             const isOverdue = dueDate && moment(dueDate).isBefore(moment()) && 
    //                              record.milestone.status !== 'Completed';
    //             return (
    //                 <div>
    //                     {dueDate ? (
    //                         <>
    //                             <Text type={isOverdue ? 'danger' : 'secondary'}>
    //                                 {moment(dueDate).format('MMM DD, YYYY')}
    //                             </Text>
    //                             {isOverdue && (
    //                                 <>
    //                                     <br />
    //                                     <Tag color="red" size="small">Overdue</Tag>
    //                                 </>
    //                             )}
    //                         </>
    //                     ) : (
    //                         <Text type="secondary">No due date</Text>
    //                     )}
    //                 </div>
    //             );
    //         },
    //         width: 120
    //     },
    //     {
    //         title: 'Actions',
    //         key: 'actions',
    //         render: (_, record) => (
    //             <Space size="small" direction="vertical">
    //                 <Tooltip title="View & Create Tasks">
    //                     <Button
    //                         size="small"
    //                         type="primary"
    //                         icon={<EyeOutlined />}
    //                         onClick={() => navigate(`/supervisor/milestone/${record.project._id}/${record.milestone._id}`)}
    //                         block
    //                     >
    //                         Manage Tasks
    //                     </Button>
    //                 </Tooltip>
                    
    //                 {record.milestone.status !== 'Completed' && (
    //                     <Tooltip title="Update Progress">
    //                         <Button
    //                             size="small"
    //                             icon={<PlayCircleOutlined />}
    //                             onClick={() => openProgressModal(record)}
    //                             block
    //                         >
    //                             Update Progress
    //                         </Button>
    //                     </Tooltip>
    //                 )}
                    
    //                 {record.milestone.progress >= 100 && !record.milestone.manuallyCompleted && (
    //                     <Tooltip title="Mark as Completed">
    //                         <Button
    //                             size="small"
    //                             type="primary"
    //                             icon={<CheckCircleOutlined />}
    //                             style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
    //                             onClick={() => handleCompleteMilestone(record.project._id, record.milestone._id)}
    //                             block
    //                         >
    //                             Complete
    //                         </Button>
    //                     </Tooltip>
    //                 )}
    //             </Space>
    //         ),
    //         width: 180,
    //         fixed: 'right'
    //     }
    // ];


    // Enhanced column definition to show sub-milestone indicator
    const columns = [
        {
            title: 'Project',
            key: 'project',
            render: (_, record) => (
                <div>
                    <Text strong>{record.project.name}</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                        {record.project.code}
                    </Text>
                </div>
            ),
            width: 250
        },
        {
            title: 'Milestone',
            key: 'milestone',
            render: (_, record) => (
                <div>
                    {/* Show badge if it's a sub-milestone */}
                    {record.milestone.type === 'sub-milestone' && (
                        <Tag color="purple" size="small" style={{ marginBottom: 4 }}>
                            <FolderOutlined /> Sub-Milestone
                        </Tag>
                    )}
                    <Text strong>{record.milestone.title}</Text>
                    <br />
                    {/* Show parent milestone for sub-milestones */}
                    {record.milestone.parentMilestone && (
                        <>
                            <Text type="secondary" style={{ fontSize: '11px' }}>
                                <RightOutlined style={{ fontSize: '10px' }} /> Under: {record.milestone.parentMilestone.title}
                            </Text>
                            <br />
                        </>
                    )}
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                        {record.milestone.description}
                    </Text>
                    <br />
                    <Tag color="blue" style={{ marginTop: 4 }}>
                        Weight: {record.milestone.weight}%
                    </Tag>
                </div>
            ),
            width: 350
        },
        {
            title: 'Progress',
            key: 'progress',
            render: (_, record) => (
                <div>
                    <Progress 
                        percent={record.milestone.progress || 0} 
                        size="small"
                        status={record.milestone.progress === 100 ? 'success' : 'active'}
                    />
                    <Text type="secondary" style={{ fontSize: '11px' }}>
                        Tasks: {record.milestone.taskStats?.completed || 0}/{record.milestone.taskStats?.total || 0}
                    </Text>
                </div>
            ),
            width: 150
        },
        {
            title: 'Task Weight',
            key: 'taskWeight',
            render: (_, record) => {
                const assigned = record.milestone.taskStats?.totalWeightAssigned || 0;
                const remaining = record.milestone.taskStats?.weightRemaining || 0;
                return (
                    <div>
                        <Text>{assigned}% / 100%</Text>
                        <br />
                        {remaining > 0 && (
                            <Text type="warning" style={{ fontSize: '11px' }}>
                                <WarningOutlined /> {remaining}% unassigned
                            </Text>
                        )}
                    </div>
                );
            },
            width: 120
        },
        {
            title: 'Status',
            dataIndex: ['milestone', 'status'],
            key: 'status',
            render: (status) => (
                <Tag color={
                    status === 'Completed' ? 'green' :
                    status === 'In Progress' ? 'blue' :
                    'default'
                }>
                    {status}
                </Tag>
            ),
            width: 120
        },
        {
            title: 'Due Date',
            key: 'dueDate',
            render: (_, record) => {
                const dueDate = record.milestone.dueDate;
                const isOverdue = dueDate && moment(dueDate).isBefore(moment()) && 
                                record.milestone.status !== 'Completed';
                return (
                    <div>
                        {dueDate ? (
                            <>
                                <Text type={isOverdue ? 'danger' : 'secondary'}>
                                    {moment(dueDate).format('MMM DD, YYYY')}
                                </Text>
                                {isOverdue && (
                                    <>
                                        <br />
                                        <Tag color="red" size="small">Overdue</Tag>
                                    </>
                                )}
                            </>
                        ) : (
                            <Text type="secondary">No due date</Text>
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
                <Space size="small" direction="vertical">
                    <Tooltip title="View & Create Tasks">
                        <Button
                            size="small"
                            type="primary"
                            icon={<EyeOutlined />}
                            onClick={() => {
                                // Check if it's a sub-milestone or main milestone
                                if (record.milestone.type === 'sub-milestone') {
                                    // Navigate to sub-milestone detail page
                                    navigate(`/supervisor/sub-milestone/${record.project._id}/${record.milestone.parentMilestone._id}/${record.milestone._id}`);
                                } else {
                                    // Navigate to main milestone detail page
                                    navigate(`/supervisor/milestone/${record.project._id}/${record.milestone._id}`);
                                }
                            }}
                            block
                        >
                            Manage Tasks
                        </Button>
                    </Tooltip>
                    
                    {record.milestone.status !== 'Completed' && (
                        <Tooltip title="Update Progress">
                            <Button
                                size="small"
                                icon={<PlayCircleOutlined />}
                                onClick={() => openProgressModal(record)}
                                block
                            >
                                Update Progress
                            </Button>
                        </Tooltip>
                    )}
                    
                    {record.milestone.progress >= 100 && !record.milestone.manuallyCompleted && (
                        <Tooltip title="Mark as Completed">
                            <Button
                                size="small"
                                type="primary"
                                icon={<CheckCircleOutlined />}
                                style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
                                onClick={() => handleCompleteMilestone(record.project._id, record.milestone._id)}
                                block
                            >
                                Complete
                            </Button>
                        </Tooltip>
                    )}
                </Space>
            ),
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
                        <FlagOutlined /> My Assigned Milestones
                    </Title>
                    <Button
                        icon={<ReloadOutlined />}
                        onClick={fetchMyMilestones}
                        loading={loading}
                    >
                        Refresh
                    </Button>
                </div>

                <Alert
                    message="Milestone Management"
                    description="These are milestones assigned to you from various projects. You can update progress, create tasks for your team, and mark milestones as complete when all work is done."
                    type="info"
                    showIcon
                    style={{ marginBottom: '24px' }}
                />

                <Card size="small" style={{ marginBottom: '24px', backgroundColor: '#f0f8ff' }}>
                    <Row gutter={16}>
                        <Col span={6}>
                            <Statistic
                                title="Total Milestones"
                                value={stats.total}
                                prefix={<FlagOutlined />}
                                valueStyle={{ color: '#1890ff' }}
                            />
                        </Col>
                        <Col span={6}>
                            <Statistic
                                title="Not Started"
                                value={stats.notStarted}
                                valueStyle={{ color: '#8c8c8c' }}
                            />
                        </Col>
                        <Col span={6}>
                            <Statistic
                                title="In Progress"
                                value={stats.inProgress}
                                valueStyle={{ color: '#52c41a' }}
                            />
                        </Col>
                        <Col span={6}>
                            <Statistic
                                title="Completed"
                                value={stats.completed}
                                prefix={<TrophyOutlined />}
                                valueStyle={{ color: '#722ed1' }}
                            />
                        </Col>
                    </Row>
                </Card>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '50px' }}>
                        <Spin size="large" />
                    </div>
                ) : milestones.length === 0 ? (
                    <Empty
                        description="No milestones assigned to you yet"
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                    />
                ) : (
                    <Table
                        columns={columns}
                        dataSource={milestones}
                        rowKey={(record) => `${record.project._id}-${record.milestone._id}`}
                        pagination={{
                            showSizeChanger: true,
                            showQuickJumper: true,
                            showTotal: (total) => `Total ${total} milestones`
                        }}
                        scroll={{ x: 1400 }}
                        size="small"
                    />
                )}
            </Card>

            {/* Progress Update Modal */}
            <Modal
                title={
                    <Space>
                        <PlayCircleOutlined />
                        Update Milestone Progress
                    </Space>
                }
                open={progressModalVisible}
                onCancel={() => {
                    setProgressModalVisible(false);
                    setSelectedMilestone(null);
                    progressForm.resetFields();
                }}
                footer={null}
                width={600}
            >
                {selectedMilestone && (
                    <div>
                        <Alert
                            message="Milestone Progress Tracking"
                            description="Update the progress percentage based on completed work. Progress is also automatically calculated from task completions."
                            type="info"
                            showIcon
                            style={{ marginBottom: '16px' }}
                        />

                        <Card size="small" style={{ marginBottom: '16px', backgroundColor: '#fafafa' }}>
                            <Text strong>Project: </Text>
                            <Text>{selectedMilestone.project.name}</Text>
                            <br />
                            <Text strong>Milestone: </Text>
                            <Text>{selectedMilestone.milestone.title}</Text>
                            <br />
                            <Text strong>Weight: </Text>
                            <Tag color="blue">{selectedMilestone.milestone.weight}%</Tag>
                            <br />
                            <Text strong>Current Progress: </Text>
                            <Tag color="orange">{selectedMilestone.milestone.progress || 0}%</Tag>
                        </Card>

                        <Form
                            form={progressForm}
                            layout="vertical"
                            onFinish={handleUpdateProgress}
                        >
                            <Form.Item
                                name="progress"
                                label="Progress Percentage"
                                rules={[{ required: true, message: 'Please set progress' }]}
                            >
                                <InputNumber
                                    min={0}
                                    max={100}
                                    formatter={value => `${value}%`}
                                    parser={value => value.replace('%', '')}
                                    style={{ width: '100%' }}
                                    size="large"
                                />
                            </Form.Item>

                            <Form.Item
                                name="notes"
                                label="Progress Notes (Optional)"
                            >
                                <TextArea 
                                    rows={3} 
                                    placeholder="Describe what has been completed..." 
                                />
                            </Form.Item>

                            <Form.Item>
                                <Space>
                                    <Button onClick={() => {
                                        setProgressModalVisible(false);
                                        setSelectedMilestone(null);
                                        progressForm.resetFields();
                                    }}>
                                        Cancel
                                    </Button>
                                    <Button
                                        type="primary"
                                        htmlType="submit"
                                        icon={<PlayCircleOutlined />}
                                    >
                                        Update Progress
                                    </Button>
                                </Space>
                            </Form.Item>
                        </Form>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default SupervisorMilestoneDashboard;









// import React, { useState, useEffect } from 'react';
// import {
//     Card,
//     Table,
//     Button,
//     Tag,
//     Space,
//     Typography,
//     Row,
//     Col,
//     Statistic,
//     Progress,
//     message,
//     Spin,
//     Alert,
//     Badge,
//     Tooltip,
//     Empty,
//     Modal,
//     Form,
//     InputNumber,
//     Input
// } from 'antd';
// import {
//     FlagOutlined,
//     PlusOutlined,
//     EyeOutlined,
//     CheckCircleOutlined,
//     ReloadOutlined,
//     WarningOutlined,
//     PlayCircleOutlined,
//     TrophyOutlined
// } from '@ant-design/icons';
// import moment from 'moment';
// import { useNavigate } from 'react-router-dom';

// const { Title, Text } = Typography;
// const { TextArea } = Input;

// const SupervisorMilestoneDashboard = () => {
//     const navigate = useNavigate();
//     const [milestones, setMilestones] = useState([]);
//     const [loading, setLoading] = useState(false);
//     const [progressModalVisible, setProgressModalVisible] = useState(false);
//     const [selectedMilestone, setSelectedMilestone] = useState(null);
//     const [stats, setStats] = useState({
//         total: 0,
//         inProgress: 0,
//         completed: 0,
//         notStarted: 0
//     });
//     const [progressForm] = Form.useForm();

//     useEffect(() => {
//         fetchMyMilestones();
//     }, []);

//     const fetchMyMilestones = async () => {
//         try {
//             setLoading(true);
//             const token = localStorage.getItem('token');
//             const response = await fetch('http://localhost:5001/api/projects/my-milestones', {
//                 headers: {
//                     'Authorization': `Bearer ${token}`,
//                     'Content-Type': 'application/json'
//                 }
//             });

//             if (!response.ok) {
//                 throw new Error('Failed to fetch milestones');
//             }

//             const result = await response.json();
            
//             if (result.success) {
//                 setMilestones(result.data || []);
                
//                 const total = result.data.length;
//                 const inProgress = result.data.filter(m => m.milestone.status === 'In Progress').length;
//                 const completed = result.data.filter(m => m.milestone.status === 'Completed').length;
//                 const notStarted = result.data.filter(m => m.milestone.status === 'Not Started').length;
                
//                 setStats({ total, inProgress, completed, notStarted });
//             } else {
//                 message.error(result.message || 'Failed to fetch milestones');
//             }
//         } catch (error) {
//             console.error('Error fetching milestones:', error);
//             message.error('Failed to load your assigned milestones');
//         } finally {
//             setLoading(false);
//         }
//     };

//     const openProgressModal = (projectRecord) => {
//         setSelectedMilestone(projectRecord);
//         progressForm.setFieldsValue({
//             progress: projectRecord.milestone.progress || 0
//         });
//         setProgressModalVisible(true);
//     };

//     const handleUpdateProgress = async (values) => {
//         try {
//             const token = localStorage.getItem('token');
//             const response = await fetch(
//                 `http://localhost:5001/api/projects/${selectedMilestone.project._id}/milestones/${selectedMilestone.milestone._id}/progress`,
//                 {
//                     method: 'PATCH',
//                     headers: {
//                         'Authorization': `Bearer ${token}`,
//                         'Content-Type': 'application/json'
//                     },
//                     body: JSON.stringify({
//                         progress: values.progress,
//                         notes: values.notes
//                     })
//                 }
//             );

//             const result = await response.json();
            
//             if (result.success) {
//                 message.success('Milestone progress updated successfully!');
//                 setProgressModalVisible(false);
//                 progressForm.resetFields();
//                 setSelectedMilestone(null);
//                 fetchMyMilestones();
//             } else {
//                 message.error(result.message || 'Failed to update progress');
//             }
//         } catch (error) {
//             console.error('Error updating progress:', error);
//             message.error('Failed to update milestone progress');
//         }
//     };

//     const handleCompleteMilestone = async (projectId, milestoneId) => {
//         try {
//             const token = localStorage.getItem('token');
//             const response = await fetch(
//                 `http://localhost:5001/api/projects/${projectId}/milestones/${milestoneId}/complete`,
//                 {
//                     method: 'POST',
//                     headers: {
//                         'Authorization': `Bearer ${token}`,
//                         'Content-Type': 'application/json'
//                     }
//                 }
//             );

//             const result = await response.json();
            
//             if (result.success) {
//                 message.success('Milestone marked as completed!');
//                 fetchMyMilestones();
//             } else {
//                 message.error(result.message || 'Failed to complete milestone');
//             }
//         } catch (error) {
//             console.error('Error completing milestone:', error);
//             message.error('Failed to complete milestone');
//         }
//     };

//     const columns = [
//         {
//             title: 'Project',
//             key: 'project',
//             render: (_, record) => (
//                 <div>
//                     <Text strong>{record.project.name}</Text>
//                     <br />
//                     <Text type="secondary" style={{ fontSize: '12px' }}>
//                         {record.project.code}
//                     </Text>
//                 </div>
//             ),
//             width: 250
//         },
//         {
//             title: 'Milestone',
//             key: 'milestone',
//             render: (_, record) => (
//                 <div>
//                     <Text strong>{record.milestone.title}</Text>
//                     <br />
//                     <Text type="secondary" style={{ fontSize: '12px' }}>
//                         {record.milestone.description}
//                     </Text>
//                     <br />
//                     <Tag color="blue" style={{ marginTop: 4 }}>
//                         Weight: {record.milestone.weight}%
//                     </Tag>
//                 </div>
//             ),
//             width: 300
//         },
//         {
//             title: 'Progress',
//             key: 'progress',
//             render: (_, record) => (
//                 <div>
//                     <Progress 
//                         percent={record.milestone.progress || 0} 
//                         size="small"
//                         status={record.milestone.progress === 100 ? 'success' : 'active'}
//                     />
//                     <Text type="secondary" style={{ fontSize: '11px' }}>
//                         Tasks: {record.milestone.taskStats?.completed || 0}/{record.milestone.taskStats?.total || 0}
//                     </Text>
//                 </div>
//             ),
//             width: 150
//         },
//         {
//             title: 'Task Weight',
//             key: 'taskWeight',
//             render: (_, record) => {
//                 const assigned = record.milestone.taskStats?.totalWeightAssigned || 0;
//                 const remaining = record.milestone.taskStats?.weightRemaining || 0;
//                 return (
//                     <div>
//                         <Text>{assigned}% / 100%</Text>
//                         <br />
//                         {remaining > 0 && (
//                             <Text type="warning" style={{ fontSize: '11px' }}>
//                                 <WarningOutlined /> {remaining}% unassigned
//                             </Text>
//                         )}
//                     </div>
//                 );
//             },
//             width: 120
//         },
//         {
//             title: 'Status',
//             dataIndex: ['milestone', 'status'],
//             key: 'status',
//             render: (status) => (
//                 <Tag color={
//                     status === 'Completed' ? 'green' :
//                     status === 'In Progress' ? 'blue' :
//                     'default'
//                 }>
//                     {status}
//                 </Tag>
//             ),
//             width: 120
//         },
//         {
//             title: 'Due Date',
//             key: 'dueDate',
//             render: (_, record) => {
//                 const dueDate = record.milestone.dueDate;
//                 const isOverdue = dueDate && moment(dueDate).isBefore(moment()) && 
//                                  record.milestone.status !== 'Completed';
//                 return (
//                     <div>
//                         {dueDate ? (
//                             <>
//                                 <Text type={isOverdue ? 'danger' : 'secondary'}>
//                                     {moment(dueDate).format('MMM DD, YYYY')}
//                                 </Text>
//                                 {isOverdue && (
//                                     <>
//                                         <br />
//                                         <Tag color="red" size="small">Overdue</Tag>
//                                     </>
//                                 )}
//                             </>
//                         ) : (
//                             <Text type="secondary">No due date</Text>
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
//                 <Space size="small" direction="vertical">
//                     <Tooltip title="View & Create Tasks">
//                         <Button
//                             size="small"
//                             type="primary"
//                             icon={<EyeOutlined />}
//                             onClick={() => navigate(`/supervisor/milestone/${record.project._id}/${record.milestone._id}`)}
//                             block
//                         >
//                             Manage Tasks
//                         </Button>
//                     </Tooltip>
                    
//                     {record.milestone.status !== 'Completed' && (
//                         <Tooltip title="Update Progress">
//                             <Button
//                                 size="small"
//                                 icon={<PlayCircleOutlined />}
//                                 onClick={() => openProgressModal(record)}
//                                 block
//                             >
//                                 Update Progress
//                             </Button>
//                         </Tooltip>
//                     )}
                    
//                     {record.milestone.progress >= 100 && !record.milestone.manuallyCompleted && (
//                         <Tooltip title="Mark as Completed">
//                             <Button
//                                 size="small"
//                                 type="primary"
//                                 icon={<CheckCircleOutlined />}
//                                 style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
//                                 onClick={() => handleCompleteMilestone(record.project._id, record.milestone._id)}
//                                 block
//                             >
//                                 Complete
//                             </Button>
//                         </Tooltip>
//                     )}
//                 </Space>
//             ),
//             width: 180,
//             fixed: 'right'
//         }
//     ];

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
//                         <FlagOutlined /> My Assigned Milestones
//                     </Title>
//                     <Button
//                         icon={<ReloadOutlined />}
//                         onClick={fetchMyMilestones}
//                         loading={loading}
//                     >
//                         Refresh
//                     </Button>
//                 </div>

//                 <Alert
//                     message="Milestone Management"
//                     description="These are milestones assigned to you from various projects. You can update progress, create tasks for your team, and mark milestones as complete when all work is done."
//                     type="info"
//                     showIcon
//                     style={{ marginBottom: '24px' }}
//                 />

//                 <Card size="small" style={{ marginBottom: '24px', backgroundColor: '#f0f8ff' }}>
//                     <Row gutter={16}>
//                         <Col span={6}>
//                             <Statistic
//                                 title="Total Milestones"
//                                 value={stats.total}
//                                 prefix={<FlagOutlined />}
//                                 valueStyle={{ color: '#1890ff' }}
//                             />
//                         </Col>
//                         <Col span={6}>
//                             <Statistic
//                                 title="Not Started"
//                                 value={stats.notStarted}
//                                 valueStyle={{ color: '#8c8c8c' }}
//                             />
//                         </Col>
//                         <Col span={6}>
//                             <Statistic
//                                 title="In Progress"
//                                 value={stats.inProgress}
//                                 valueStyle={{ color: '#52c41a' }}
//                             />
//                         </Col>
//                         <Col span={6}>
//                             <Statistic
//                                 title="Completed"
//                                 value={stats.completed}
//                                 prefix={<TrophyOutlined />}
//                                 valueStyle={{ color: '#722ed1' }}
//                             />
//                         </Col>
//                     </Row>
//                 </Card>

//                 {loading ? (
//                     <div style={{ textAlign: 'center', padding: '50px' }}>
//                         <Spin size="large" />
//                     </div>
//                 ) : milestones.length === 0 ? (
//                     <Empty
//                         description="No milestones assigned to you yet"
//                         image={Empty.PRESENTED_IMAGE_SIMPLE}
//                     />
//                 ) : (
//                     <Table
//                         columns={columns}
//                         dataSource={milestones}
//                         rowKey={(record) => `${record.project._id}-${record.milestone._id}`}
//                         pagination={{
//                             showSizeChanger: true,
//                             showQuickJumper: true,
//                             showTotal: (total) => `Total ${total} milestones`
//                         }}
//                         scroll={{ x: 1400 }}
//                         size="small"
//                     />
//                 )}
//             </Card>

//             {/* Progress Update Modal */}
//             <Modal
//                 title={
//                     <Space>
//                         <PlayCircleOutlined />
//                         Update Milestone Progress
//                     </Space>
//                 }
//                 open={progressModalVisible}
//                 onCancel={() => {
//                     setProgressModalVisible(false);
//                     setSelectedMilestone(null);
//                     progressForm.resetFields();
//                 }}
//                 footer={null}
//                 width={600}
//             >
//                 {selectedMilestone && (
//                     <div>
//                         <Alert
//                             message="Milestone Progress Tracking"
//                             description="Update the progress percentage based on completed work. Progress is also automatically calculated from task completions."
//                             type="info"
//                             showIcon
//                             style={{ marginBottom: '16px' }}
//                         />

//                         <Card size="small" style={{ marginBottom: '16px', backgroundColor: '#fafafa' }}>
//                             <Text strong>Project: </Text>
//                             <Text>{selectedMilestone.project.name}</Text>
//                             <br />
//                             <Text strong>Milestone: </Text>
//                             <Text>{selectedMilestone.milestone.title}</Text>
//                             <br />
//                             <Text strong>Weight: </Text>
//                             <Tag color="blue">{selectedMilestone.milestone.weight}%</Tag>
//                             <br />
//                             <Text strong>Current Progress: </Text>
//                             <Tag color="orange">{selectedMilestone.milestone.progress || 0}%</Tag>
//                         </Card>

//                         <Form
//                             form={progressForm}
//                             layout="vertical"
//                             onFinish={handleUpdateProgress}
//                         >
//                             <Form.Item
//                                 name="progress"
//                                 label="Progress Percentage"
//                                 rules={[{ required: true, message: 'Please set progress' }]}
//                             >
//                                 <InputNumber
//                                     min={0}
//                                     max={100}
//                                     formatter={value => `${value}%`}
//                                     parser={value => value.replace('%', '')}
//                                     style={{ width: '100%' }}
//                                     size="large"
//                                 />
//                             </Form.Item>

//                             <Form.Item
//                                 name="notes"
//                                 label="Progress Notes (Optional)"
//                             >
//                                 <TextArea 
//                                     rows={3} 
//                                     placeholder="Describe what has been completed..." 
//                                 />
//                             </Form.Item>

//                             <Form.Item>
//                                 <Space>
//                                     <Button onClick={() => {
//                                         setProgressModalVisible(false);
//                                         setSelectedMilestone(null);
//                                         progressForm.resetFields();
//                                     }}>
//                                         Cancel
//                                     </Button>
//                                     <Button
//                                         type="primary"
//                                         htmlType="submit"
//                                         icon={<PlayCircleOutlined />}
//                                     >
//                                         Update Progress
//                                     </Button>
//                                 </Space>
//                             </Form.Item>
//                         </Form>
//                     </div>
//                 )}
//             </Modal>
//         </div>
//     );
// };

// export default SupervisorMilestoneDashboard;

