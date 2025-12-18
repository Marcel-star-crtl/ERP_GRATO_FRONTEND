import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Card,
    Button,
    Form,
    Typography,
    Tag,
    Space,
    Input,
    InputNumber,
    Alert,
    Spin,
    message,
    Descriptions,
    Table,
    Modal,
    Divider,
    Row,
    Col
} from 'antd';
import {
    ArrowLeftOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    DownloadOutlined,
    FileOutlined,
    UserOutlined,
    TrophyOutlined,
    StarOutlined
} from '@ant-design/icons';
import { actionItemAPI } from '../../services/actionItemAPI';
import moment from 'moment';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const SupervisorTaskCompletionApproval = () => {
    const { taskId, assigneeId } = useParams();
    const navigate = useNavigate();
    const [form] = Form.useForm();
    const [task, setTask] = useState(null);
    const [assignee, setAssignee] = useState(null);
    const [loading, setLoading] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [decision, setDecision] = useState(null);

    useEffect(() => {
        fetchTaskDetails();
    }, [taskId, assigneeId]);

    const fetchTaskDetails = async () => {
        try {
            setLoading(true);
            const result = await actionItemAPI.getActionItem(taskId);

            if (result.success) {
                setTask(result.data);

                const assigneeData = result.data.assignedTo?.find(a => a.user._id === assigneeId);
                if (!assigneeData) {
                    message.error('Assignee not found for this task');
                    navigate('/supervisor/action-items');
                    return;
                }

                if (assigneeData.completionStatus !== 'submitted') {
                    message.warning('This assignee has not submitted completion yet');
                    navigate('/supervisor/action-items');
                    return;
                }

                setAssignee(assigneeData);
            } else {
                message.error(result.message);
                navigate('/supervisor/action-items');
            }
        } catch (error) {
            console.error('Error fetching task:', error);
            message.error('Failed to load task details');
            navigate('/supervisor/action-items');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (values) => {
        if (!decision) {
            message.error('Please select approve or reject');
            return;
        }

        if (decision === 'approve' && !values.grade) {
            message.error('Please assign a grade');
            return;
        }

        if (decision === 'reject' && !values.comments) {
            message.error('Please provide rejection reason');
            return;
        }

        Modal.confirm({
            title: `Confirm ${decision === 'approve' ? 'Approval' : 'Rejection'}`,
            content: decision === 'approve' 
                ? `Are you sure you want to approve this completion with grade ${values.grade}/5.0?`
                : 'Are you sure you want to reject this completion?',
            okText: decision === 'approve' ? 'Approve' : 'Reject',
            okType: decision === 'approve' ? 'primary' : 'danger',
            onOk: async () => {
                try {
                    setProcessing(true);

                    let result;
                    if (decision === 'approve') {
                        result = await actionItemAPI.approveCompletionForAssignee(
                            taskId,
                            assigneeId,
                            values.grade,
                            values.qualityNotes || '',
                            values.comments || ''
                        );
                    } else {
                        result = await actionItemAPI.rejectCompletionForAssignee(
                            taskId,
                            assigneeId,
                            values.comments
                        );
                    }

                    if (result.success) {
                        message.success(`Completion ${decision}d successfully!`);
                        navigate('/supervisor/action-items');
                    } else {
                        message.error(result.message || `Failed to ${decision} completion`);
                    }
                } catch (error) {
                    console.error('Error processing approval:', error);
                    message.error(`Failed to ${decision} completion`);
                } finally {
                    setProcessing(false);
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

    const getScoreColor = (score) => {
        const percentage = (score / 5) * 100;
        if (percentage >= 80) return '#52c41a';
        if (percentage >= 60) return '#1890ff';
        if (percentage >= 40) return '#faad14';
        return '#ff4d4f';
    };

    const renderStars = (score) => {
        const fullStars = Math.floor(score);
        const decimal = score - fullStars;
        const stars = [];

        for (let i = 0; i < fullStars; i++) {
            stars.push(<StarOutlined key={`full-${i}`} style={{ color: '#fadb14', fontSize: '20px' }} />);
        }

        if (decimal > 0) {
            stars.push(
                <span key="partial" style={{ position: 'relative', display: 'inline-block' }}>
                    <StarOutlined style={{ color: '#d9d9d9', fontSize: '20px' }} />
                    <span style={{ 
                        position: 'absolute', 
                        left: 0, 
                        top: 0, 
                        overflow: 'hidden', 
                        width: `${decimal * 100}%` 
                    }}>
                        <StarOutlined style={{ color: '#fadb14', fontSize: '20px' }} />
                    </span>
                </span>
            );
        }

        const emptyStars = 5 - Math.ceil(score);
        for (let i = 0; i < emptyStars; i++) {
            stars.push(<StarOutlined key={`empty-${i}`} style={{ color: '#d9d9d9', fontSize: '20px' }} />);
        }

        return stars;
    };

    const documentsColumns = [
        {
            title: 'Document Name',
            dataIndex: 'name',
            key: 'name',
            render: (text) => (
                <Space>
                    <FileOutlined />
                    <Text>{text}</Text>
                </Space>
            )
        },
        {
            title: 'Size',
            dataIndex: 'size',
            key: 'size',
            width: 100,
            render: (size) => `${(size / 1024).toFixed(2)} KB`
        },
        {
            title: 'Uploaded',
            dataIndex: 'uploadedAt',
            key: 'uploadedAt',
            width: 180,
            render: (date) => moment(date).format('MMM DD, YYYY HH:mm')
        },
        // {
        //     title: 'Action',
        //     key: 'action',
        //     width: 100,
        //     render: (_, record) => (
        //         <Button
        //             type="link"
        //             size="small"
        //             icon={<DownloadOutlined />}
        //             href={`http://localhost:5001${record.url}`}
        //             download
        //         >
        //             Download
        //         </Button>
        //     )
        // }
        {
            title: 'Action',
            key: 'action',
            width: 100,
            render: (_, record) => (
                <Button
                    type="link"
                    size="small"
                    icon={<DownloadOutlined />}
                    href={`${process.env.REACT_APP_API_URL}/action-items/download/${taskId}/${record.publicId}`}
                    download
                >
                    Download
                </Button>
            )
        }
    ];

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
                <Spin size="large" />
            </div>
        );
    }

    if (!task || !assignee) {
        return (
            <div style={{ padding: '24px' }}>
                <Alert
                    message="Task Not Found"
                    description="The task completion you are trying to review does not exist or is not available."
                    type="error"
                    showIcon
                />
            </div>
        );
    }

    const isOverdue = moment(task.dueDate).isBefore(moment()) && task.status !== 'Completed';

    return (
        <div style={{ padding: '24px' }}>
            <Card>
                <Space style={{ marginBottom: 24 }}>
                    <Button
                        icon={<ArrowLeftOutlined />}
                        onClick={() => navigate('/supervisor/action-items')}
                    >
                        Back to Tasks
                    </Button>
                    <Title level={3} style={{ margin: 0 }}>
                        <CheckCircleOutlined /> Review Task Completion
                    </Title>
                </Space>

                <Alert
                    message="Decimal Grading System"
                    description="Grade the completion on a scale of 1.0-5.0 (decimal values allowed). Your grade will affect the employee's KPI achievement and milestone progress. Use decimals for more precise evaluations (e.g., 3.5, 4.2, 4.8)."
                    type="info"
                    showIcon
                    style={{ marginBottom: 24 }}
                />

                {/* Task Summary */}
                <Card size="small" style={{ marginBottom: 24, backgroundColor: '#f0f8ff' }}>
                    <Title level={5}>Task Details</Title>
                    <Descriptions bordered column={2} size="small">
                        <Descriptions.Item label="Task" span={2}>
                            <Text strong>{task.title}</Text>
                        </Descriptions.Item>
                        <Descriptions.Item label="Description" span={2}>
                            <Paragraph style={{ margin: 0 }}>{task.description}</Paragraph>
                        </Descriptions.Item>
                        <Descriptions.Item label="Employee">
                            <Space>
                                <UserOutlined />
                                <Text strong>{assignee.user.fullName}</Text>
                            </Space>
                            <br />
                            <Text type="secondary" style={{ fontSize: '12px' }}>
                                {assignee.user.department}
                            </Text>
                        </Descriptions.Item>
                        <Descriptions.Item label="Priority">
                            <Tag color={getPriorityColor(task.priority)}>
                                {task.priority}
                            </Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label="Due Date">
                            <Text type={isOverdue ? 'danger' : 'default'}>
                                {moment(task.dueDate).format('MMMM DD, YYYY')}
                            </Text>
                            {isOverdue && (
                                <>
                                    <br />
                                    <Tag color="red" size="small">Overdue</Tag>
                                </>
                            )}
                        </Descriptions.Item>
                        <Descriptions.Item label="Submitted">
                            {moment(assignee.submittedAt).format('MMM DD, YYYY HH:mm')}
                        </Descriptions.Item>
                        {task.taskWeight > 0 && (
                            <Descriptions.Item label="Task Weight" span={2}>
                                <Tag color="blue">{task.taskWeight}% of milestone</Tag>
                            </Descriptions.Item>
                        )}
                    </Descriptions>
                </Card>

                {/* Linked KPIs */}
                {task.linkedKPIs && task.linkedKPIs.length > 0 && (
                    <Card size="small" style={{ marginBottom: 24 }}>
                        <Title level={5}>
                            <TrophyOutlined /> Linked KPIs
                        </Title>
                        <Alert
                            message="Your grade will contribute to these KPI achievements"
                            type="warning"
                            showIcon
                            style={{ marginBottom: 12 }}
                        />
                        <Space wrap>
                            {task.linkedKPIs.map((kpi, idx) => (
                                <Tag key={idx} color="gold">
                                    {kpi.kpiTitle} (Weight: {kpi.kpiWeight}%)
                                </Tag>
                            ))}
                        </Space>
                    </Card>
                )}

                {/* Completion Submission */}
                <Card size="small" style={{ marginBottom: 24 }}>
                    <Title level={5}>Employee's Completion Notes</Title>
                    <Paragraph style={{ 
                        padding: 16, 
                        backgroundColor: '#f5f5f5', 
                        borderRadius: 4,
                        whiteSpace: 'pre-wrap'
                    }}>
                        {assignee.completionNotes || 'No notes provided'}
                    </Paragraph>
                </Card>

                {/* Completion Documents */}
                <Card size="small" style={{ marginBottom: 24 }}>
                    <Title level={5}>Completion Documents ({assignee.completionDocuments?.length || 0})</Title>
                    {assignee.completionDocuments && assignee.completionDocuments.length > 0 ? (
                        <Table
                            columns={documentsColumns}
                            dataSource={assignee.completionDocuments}
                            rowKey="publicId"
                            pagination={false}
                            size="small"
                        />
                    ) : (
                        <Alert message="No documents uploaded" type="warning" showIcon />
                    )}
                </Card>

                <Divider />

                {/* Approval Form */}
                <Card size="small">
                    <Title level={5}>Your Review</Title>
                    
                    <Form
                        form={form}
                        layout="vertical"
                        onFinish={handleSubmit}
                    >
                        <Alert
                            message="Select Your Decision"
                            type="info"
                            showIcon
                            style={{ marginBottom: 16 }}
                        />

                        <Space size="large" style={{ marginBottom: 24 }}>
                            <Button
                                type={decision === 'approve' ? 'primary' : 'default'}
                                size="large"
                                icon={<CheckCircleOutlined />}
                                onClick={() => setDecision('approve')}
                                style={{ 
                                    backgroundColor: decision === 'approve' ? '#52c41a' : undefined,
                                    borderColor: decision === 'approve' ? '#52c41a' : undefined
                                }}
                            >
                                Approve Completion
                            </Button>
                            <Button
                                type={decision === 'reject' ? 'primary' : 'default'}
                                size="large"
                                danger={decision === 'reject'}
                                icon={<CloseCircleOutlined />}
                                onClick={() => setDecision('reject')}
                            >
                                Reject Completion
                            </Button>
                        </Space>

                        {decision === 'approve' && (
                            <>
                                <Alert
                                    message="Decimal Grading Scale (1.0 - 5.0)"
                                    description={
                                        <div>
                                            <ul style={{ marginBottom: 0, paddingLeft: 20 }}>
                                                <li><strong>4.5-5.0 (Excellent):</strong> Exceptional work, exceeded expectations significantly</li>
                                                <li><strong>4.0-4.4 (Very Good):</strong> Exceeded expectations consistently</li>
                                                <li><strong>3.5-3.9 (Good):</strong> Met expectations with good quality</li>
                                                <li><strong>3.0-3.4 (Average):</strong> Met basic requirements adequately</li>
                                                <li><strong>2.5-2.9 (Below Average):</strong> Partially met requirements</li>
                                                <li><strong>2.0-2.4 (Poor):</strong> Needs significant improvement</li>
                                                <li><strong>1.0-1.9 (Very Poor):</strong> Significantly below expectations</li>
                                            </ul>
                                            <div style={{ marginTop: 8, fontStyle: 'italic', color: '#666' }}>
                                                Use decimals for precision (e.g., 3.5 for "above average", 4.7 for "nearly perfect")
                                            </div>
                                        </div>
                                    }
                                    type="info"
                                    showIcon
                                    style={{ marginBottom: 16 }}
                                />

                                <Form.Item
                                    name="grade"
                                    label="Completion Grade (1.0-5.0)"
                                    rules={[
                                        { required: true, message: 'Please assign a grade' },
                                        { 
                                            type: 'number', 
                                            min: 1.0, 
                                            max: 5.0, 
                                            message: 'Grade must be between 1.0 and 5.0' 
                                        }
                                    ]}
                                >
                                    <InputNumber
                                        min={1.0}
                                        max={5.0}
                                        step={0.1}
                                        precision={1}
                                        style={{ width: '200px' }}
                                        placeholder="Enter grade (1.0 - 5.0)"
                                        addonAfter="/ 5.0"
                                    />
                                </Form.Item>

                                <Form.Item
                                    noStyle
                                    shouldUpdate={(prevValues, currentValues) => prevValues.grade !== currentValues.grade}
                                >
                                    {({ getFieldValue }) => {
                                        const grade = getFieldValue('grade');
                                        if (grade) {
                                            return (
                                                <Card 
                                                    size="small" 
                                                    style={{ 
                                                        marginBottom: 16, 
                                                        backgroundColor: '#f6ffed',
                                                        borderColor: getScoreColor(grade)
                                                    }}
                                                >
                                                    <Space direction="vertical" size={4}>
                                                        <Text strong>Grade Preview:</Text>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                            {renderStars(grade)}
                                                            <Text strong style={{ fontSize: '18px', color: getScoreColor(grade) }}>
                                                                {grade.toFixed(1)}/5.0
                                                            </Text>
                                                        </div>
                                                        <Text type="secondary" style={{ fontSize: '12px' }}>
                                                            Effective Score: {((grade / 5) * task.taskWeight).toFixed(2)}% 
                                                            {' '}(Task Weight: {task.taskWeight}%)
                                                        </Text>
                                                    </Space>
                                                </Card>
                                            );
                                        }
                                        return null;
                                    }}
                                </Form.Item>

                                <Form.Item
                                    name="qualityNotes"
                                    label="Quality Assessment Notes"
                                    rules={[
                                        { required: true, message: 'Please provide quality assessment' },
                                        { min: 20, message: 'Please provide detailed feedback (at least 20 characters)' }
                                    ]}
                                >
                                    <TextArea
                                        rows={4}
                                        placeholder="Provide feedback on the quality of work, what was done well, areas for improvement..."
                                        showCount
                                        maxLength={500}
                                    />
                                </Form.Item>

                                <Form.Item
                                    name="comments"
                                    label="Additional Comments (Optional)"
                                >
                                    <TextArea
                                        rows={2}
                                        placeholder="Any additional feedback or comments..."
                                        maxLength={300}
                                    />
                                </Form.Item>

                                <Alert
                                    message="Grade Impact"
                                    description={`Grade affects: Task completion (${task.taskWeight || 0}% of milestone) and KPI achievement. Formula: Effective Score = (Grade/5.0) × Task Weight`}
                                    type="warning"
                                    showIcon
                                    style={{ marginBottom: 16 }}
                                />
                            </>
                        )}

                        {decision === 'reject' && (
                            <>
                                <Alert
                                    message="Rejection Effect"
                                    description="The task will be sent back to the employee for revision. They will need to make corrections and resubmit."
                                    type="warning"
                                    showIcon
                                    style={{ marginBottom: 16 }}
                                />

                                <Form.Item
                                    name="comments"
                                    label="Rejection Reason"
                                    rules={[
                                        { required: true, message: 'Please provide rejection reason' },
                                        { min: 20, message: 'Please provide detailed feedback (at least 20 characters)' }
                                    ]}
                                >
                                    <TextArea
                                        rows={5}
                                        placeholder="Explain clearly what needs to be revised or improved. Be specific about what was unsatisfactory..."
                                        showCount
                                        maxLength={500}
                                    />
                                </Form.Item>
                            </>
                        )}

                        <Form.Item>
                            <Space>
                                <Button onClick={() => navigate('/supervisor/action-items')}>
                                    Cancel
                                </Button>
                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    loading={processing}
                                    disabled={!decision}
                                    style={{
                                        backgroundColor: decision === 'approve' ? '#52c41a' : undefined,
                                        borderColor: decision === 'approve' ? '#52c41a' : undefined
                                    }}
                                >
                                    {decision === 'approve' ? 'Approve with Grade' : 'Reject Completion'}
                                </Button>
                            </Space>
                        </Form.Item>
                    </Form>
                </Card>
            </Card>
        </div>
    );
};

export default SupervisorTaskCompletionApproval;











// import React, { useState, useEffect } from 'react';
// import { useParams, useNavigate } from 'react-router-dom';
// import {
//     Card,
//     Button,
//     Form,
//     Typography,
//     Tag,
//     Space,
//     Input,
//     Rate,
//     Alert,
//     Spin,
//     message,
//     Descriptions,
//     Table,
//     Modal,
//     Divider,
//     Row,
//     Col
// } from 'antd';
// import {
//     ArrowLeftOutlined,
//     CheckCircleOutlined,
//     CloseCircleOutlined,
//     DownloadOutlined,
//     FileOutlined,
//     UserOutlined,
//     TrophyOutlined
// } from '@ant-design/icons';
// import { actionItemAPI } from '../../services/actionItemAPI';
// import moment from 'moment';

// const { Title, Text, Paragraph } = Typography;
// const { TextArea } = Input;

// const SupervisorTaskCompletionApproval = () => {
//     const { taskId, assigneeId } = useParams();
//     const navigate = useNavigate();
//     const [form] = Form.useForm();
//     const [task, setTask] = useState(null);
//     const [assignee, setAssignee] = useState(null);
//     const [loading, setLoading] = useState(false);
//     const [processing, setProcessing] = useState(false);
//     const [decision, setDecision] = useState(null);

//     useEffect(() => {
//         fetchTaskDetails();
//     }, [taskId, assigneeId]);

//     const fetchTaskDetails = async () => {
//         try {
//             setLoading(true);
//             const result = await actionItemAPI.getActionItem(taskId);

//             if (result.success) {
//                 setTask(result.data);

//                 // Find the specific assignee
//                 const assigneeData = result.data.assignedTo?.find(a => a.user._id === assigneeId);
//                 if (!assigneeData) {
//                     message.error('Assignee not found for this task');
//                     navigate('/supervisor/action-items');
//                     return;
//                 }

//                 // Check if submitted
//                 if (assigneeData.completionStatus !== 'submitted') {
//                     message.warning('This assignee has not submitted completion yet');
//                     navigate('/supervisor/action-items');
//                     return;
//                 }

//                 setAssignee(assigneeData);
//             } else {
//                 message.error(result.message);
//                 navigate('/supervisor/action-items');
//             }
//         } catch (error) {
//             console.error('Error fetching task:', error);
//             message.error('Failed to load task details');
//             navigate('/supervisor/action-items');
//         } finally {
//             setLoading(false);
//         }
//     };

//     const handleSubmit = async (values) => {
//         if (!decision) {
//             message.error('Please select approve or reject');
//             return;
//         }

//         if (decision === 'approve' && !values.grade) {
//             message.error('Please assign a grade');
//             return;
//         }

//         if (decision === 'reject' && !values.comments) {
//             message.error('Please provide rejection reason');
//             return;
//         }

//         Modal.confirm({
//             title: `Confirm ${decision === 'approve' ? 'Approval' : 'Rejection'}`,
//             content: decision === 'approve' 
//                 ? `Are you sure you want to approve this completion with grade ${values.grade}/5?`
//                 : 'Are you sure you want to reject this completion?',
//             okText: decision === 'approve' ? 'Approve' : 'Reject',
//             okType: decision === 'approve' ? 'primary' : 'danger',
//             onOk: async () => {
//                 try {
//                     setProcessing(true);

//                     let result;
//                     if (decision === 'approve') {
//                         result = await actionItemAPI.approveCompletionForAssignee(
//                             taskId,
//                             assigneeId,
//                             values.grade,
//                             values.qualityNotes || '',
//                             values.comments || ''
//                         );
//                     } else {
//                         result = await actionItemAPI.rejectCompletionForAssignee(
//                             taskId,
//                             assigneeId,
//                             values.comments
//                         );
//                     }

//                     if (result.success) {
//                         message.success(`Completion ${decision}d successfully!`);
//                         navigate('/supervisor/action-items');
//                     } else {
//                         message.error(result.message || `Failed to ${decision} completion`);
//                     }
//                 } catch (error) {
//                     console.error('Error processing approval:', error);
//                     message.error(`Failed to ${decision} completion`);
//                 } finally {
//                     setProcessing(false);
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

//     const documentsColumns = [
//         {
//             title: 'Document Name',
//             dataIndex: 'name',
//             key: 'name',
//             render: (text) => (
//                 <Space>
//                     <FileOutlined />
//                     <Text>{text}</Text>
//                 </Space>
//             )
//         },
//         {
//             title: 'Size',
//             dataIndex: 'size',
//             key: 'size',
//             width: 100,
//             render: (size) => `${(size / 1024).toFixed(2)} KB`
//         },
//         {
//             title: 'Uploaded',
//             dataIndex: 'uploadedAt',
//             key: 'uploadedAt',
//             width: 180,
//             render: (date) => moment(date).format('MMM DD, YYYY HH:mm')
//         },
//         {
//             title: 'Action',
//             key: 'action',
//             width: 100,
//             render: (_, record) => (
//                 <Button
//                     type="link"
//                     size="small"
//                     icon={<DownloadOutlined />}
//                     href={`http://localhost:5001${record.url}`}
//                     download
//                 >
//                     Download
//                 </Button>
//             )
//         }
//     ];

//     if (loading) {
//         return (
//             <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
//                 <Spin size="large" />
//             </div>
//         );
//     }

//     if (!task || !assignee) {
//         return (
//             <div style={{ padding: '24px' }}>
//                 <Alert
//                     message="Task Not Found"
//                     description="The task completion you are trying to review does not exist or is not available."
//                     type="error"
//                     showIcon
//                 />
//             </div>
//         );
//     }

//     const isOverdue = moment(task.dueDate).isBefore(moment()) && task.status !== 'Completed';

//     return (
//         <div style={{ padding: '24px' }}>
//             <Card>
//                 <Space style={{ marginBottom: 24 }}>
//                     <Button
//                         icon={<ArrowLeftOutlined />}
//                         onClick={() => navigate('/supervisor/action-items')}
//                     >
//                         Back to Tasks
//                     </Button>
//                     <Title level={3} style={{ margin: 0 }}>
//                         <CheckCircleOutlined /> Review Task Completion
//                     </Title>
//                 </Space>

//                 <Alert
//                     message="Completion Review & Grading"
//                     description="Review the submitted documents and notes. Grade the completion on a scale of 1-5. Your grade will affect the employee's KPI achievement and milestone progress."
//                     type="info"
//                     showIcon
//                     style={{ marginBottom: 24 }}
//                 />

//                 {/* Task Summary */}
//                 <Card size="small" style={{ marginBottom: 24, backgroundColor: '#f0f8ff' }}>
//                     <Title level={5}>Task Details</Title>
//                     <Descriptions bordered column={2} size="small">
//                         <Descriptions.Item label="Task" span={2}>
//                             <Text strong>{task.title}</Text>
//                         </Descriptions.Item>
//                         <Descriptions.Item label="Description" span={2}>
//                             <Paragraph style={{ margin: 0 }}>{task.description}</Paragraph>
//                         </Descriptions.Item>
//                         <Descriptions.Item label="Employee">
//                             <Space>
//                                 <UserOutlined />
//                                 <Text strong>{assignee.user.fullName}</Text>
//                             </Space>
//                             <br />
//                             <Text type="secondary" style={{ fontSize: '12px' }}>
//                                 {assignee.user.department}
//                             </Text>
//                         </Descriptions.Item>
//                         <Descriptions.Item label="Priority">
//                             <Tag color={getPriorityColor(task.priority)}>
//                                 {task.priority}
//                             </Tag>
//                         </Descriptions.Item>
//                         <Descriptions.Item label="Due Date">
//                             <Text type={isOverdue ? 'danger' : 'default'}>
//                                 {moment(task.dueDate).format('MMMM DD, YYYY')}
//                             </Text>
//                             {isOverdue && (
//                                 <>
//                                     <br />
//                                     <Tag color="red" size="small">Overdue</Tag>
//                                 </>
//                             )}
//                         </Descriptions.Item>
//                         <Descriptions.Item label="Submitted">
//                             {moment(assignee.submittedAt).format('MMM DD, YYYY HH:mm')}
//                         </Descriptions.Item>
//                         {task.taskWeight > 0 && (
//                             <Descriptions.Item label="Task Weight" span={2}>
//                                 <Tag color="blue">{task.taskWeight}% of milestone</Tag>
//                             </Descriptions.Item>
//                         )}
//                     </Descriptions>
//                 </Card>

//                 {/* Linked KPIs */}
//                 {task.linkedKPIs && task.linkedKPIs.length > 0 && (
//                     <Card size="small" style={{ marginBottom: 24 }}>
//                         <Title level={5}>
//                             <TrophyOutlined /> Linked KPIs
//                         </Title>
//                         <Alert
//                             message="Your grade will contribute to these KPI achievements"
//                             type="warning"
//                             showIcon
//                             style={{ marginBottom: 12 }}
//                         />
//                         <Space wrap>
//                             {task.linkedKPIs.map((kpi, idx) => (
//                                 <Tag key={idx} color="gold">
//                                     {kpi.kpiTitle} (Weight: {kpi.kpiWeight}%)
//                                 </Tag>
//                             ))}
//                         </Space>
//                     </Card>
//                 )}

//                 {/* Completion Submission */}
//                 <Card size="small" style={{ marginBottom: 24 }}>
//                     <Title level={5}>Employee's Completion Notes</Title>
//                     <Paragraph style={{ 
//                         padding: 16, 
//                         backgroundColor: '#f5f5f5', 
//                         borderRadius: 4,
//                         whiteSpace: 'pre-wrap'
//                     }}>
//                         {assignee.completionNotes || 'No notes provided'}
//                     </Paragraph>
//                 </Card>

//                 {/* Completion Documents */}
//                 <Card size="small" style={{ marginBottom: 24 }}>
//                     <Title level={5}>Completion Documents ({assignee.completionDocuments?.length || 0})</Title>
//                     {assignee.completionDocuments && assignee.completionDocuments.length > 0 ? (
//                         <Table
//                             columns={documentsColumns}
//                             dataSource={assignee.completionDocuments}
//                             rowKey="publicId"
//                             pagination={false}
//                             size="small"
//                         />
//                     ) : (
//                         <Alert message="No documents uploaded" type="warning" showIcon />
//                     )}
//                 </Card>

//                 <Divider />

//                 {/* Approval Form */}
//                 <Card size="small">
//                     <Title level={5}>Your Review</Title>
                    
//                     <Form
//                         form={form}
//                         layout="vertical"
//                         onFinish={handleSubmit}
//                     >
//                         <Alert
//                             message="Select Your Decision"
//                             type="info"
//                             showIcon
//                             style={{ marginBottom: 16 }}
//                         />

//                         <Space size="large" style={{ marginBottom: 24 }}>
//                             <Button
//                                 type={decision === 'approve' ? 'primary' : 'default'}
//                                 size="large"
//                                 icon={<CheckCircleOutlined />}
//                                 onClick={() => setDecision('approve')}
//                                 style={{ 
//                                     backgroundColor: decision === 'approve' ? '#52c41a' : undefined,
//                                     borderColor: decision === 'approve' ? '#52c41a' : undefined
//                                 }}
//                             >
//                                 Approve Completion
//                             </Button>
//                             <Button
//                                 type={decision === 'reject' ? 'primary' : 'default'}
//                                 size="large"
//                                 danger={decision === 'reject'}
//                                 icon={<CloseCircleOutlined />}
//                                 onClick={() => setDecision('reject')}
//                             >
//                                 Reject Completion
//                             </Button>
//                         </Space>

//                         {decision === 'approve' && (
//                             <>
//                                 <Alert
//                                     message="Grading Scale"
//                                     description={
//                                         <ul style={{ marginBottom: 0, paddingLeft: 20 }}>
//                                             <li><strong>5 (Excellent):</strong> Exceptional work, exceeded expectations</li>
//                                             <li><strong>4 (Good):</strong> Met expectations with good quality</li>
//                                             <li><strong>3 (Average):</strong> Met basic requirements</li>
//                                             <li><strong>2 (Below Average):</strong> Needs improvement</li>
//                                             <li><strong>1 (Poor):</strong> Significantly below expectations</li>
//                                         </ul>
//                                     }
//                                     type="info"
//                                     showIcon
//                                     style={{ marginBottom: 16 }}
//                                 />

//                                 <Form.Item
//                                     name="grade"
//                                     label="Completion Grade (1-5)"
//                                     rules={[
//                                         { required: true, message: 'Please assign a grade' }
//                                     ]}
//                                 >
//                                     <Rate 
//                                         count={5} 
//                                         style={{ fontSize: 40 }}
//                                         tooltips={['Poor', 'Below Average', 'Average', 'Good', 'Excellent']}
//                                     />
//                                 </Form.Item>

//                                 <Form.Item
//                                     name="qualityNotes"
//                                     label="Quality Assessment Notes"
//                                     rules={[
//                                         { required: true, message: 'Please provide quality assessment' },
//                                         { min: 20, message: 'Please provide detailed feedback (at least 20 characters)' }
//                                     ]}
//                                 >
//                                     <TextArea
//                                         rows={4}
//                                         placeholder="Provide feedback on the quality of work, what was done well, areas for improvement..."
//                                         showCount
//                                         maxLength={500}
//                                     />
//                                 </Form.Item>

//                                 <Form.Item
//                                     name="comments"
//                                     label="Additional Comments (Optional)"
//                                 >
//                                     <TextArea
//                                         rows={2}
//                                         placeholder="Any additional feedback or comments..."
//                                         maxLength={300}
//                                     />
//                                 </Form.Item>

//                                 <Alert
//                                     message="Grade Impact"
//                                     description={`Grade affects: Task completion (${task.taskWeight || 0}% of milestone) and KPI achievement. Formula: Effective Score = (Grade/5) × Task Weight`}
//                                     type="warning"
//                                     showIcon
//                                     style={{ marginBottom: 16 }}
//                                 />
//                             </>
//                         )}

//                         {decision === 'reject' && (
//                             <>
//                                 <Alert
//                                     message="Rejection Effect"
//                                     description="The task will be sent back to the employee for revision. They will need to make corrections and resubmit."
//                                     type="warning"
//                                     showIcon
//                                     style={{ marginBottom: 16 }}
//                                 />

//                                 <Form.Item
//                                     name="comments"
//                                     label="Rejection Reason"
//                                     rules={[
//                                         { required: true, message: 'Please provide rejection reason' },
//                                         { min: 20, message: 'Please provide detailed feedback (at least 20 characters)' }
//                                     ]}
//                                 >
//                                     <TextArea
//                                         rows={5}
//                                         placeholder="Explain clearly what needs to be revised or improved. Be specific about what was unsatisfactory..."
//                                         showCount
//                                         maxLength={500}
//                                     />
//                                 </Form.Item>
//                             </>
//                         )}

//                         <Form.Item>
//                             <Space>
//                                 <Button onClick={() => navigate('/supervisor/action-items')}>
//                                     Cancel
//                                 </Button>
//                                 <Button
//                                     type="primary"
//                                     htmlType="submit"
//                                     loading={processing}
//                                     disabled={!decision}
//                                     style={{
//                                         backgroundColor: decision === 'approve' ? '#52c41a' : undefined,
//                                         borderColor: decision === 'approve' ? '#52c41a' : undefined
//                                     }}
//                                 >
//                                     {decision === 'approve' ? 'Approve with Grade' : 'Reject Completion'}
//                                 </Button>
//                             </Space>
//                         </Form.Item>
//                     </Form>
//                 </Card>
//             </Card>
//         </div>
//     );
// };

// export default SupervisorTaskCompletionApproval;