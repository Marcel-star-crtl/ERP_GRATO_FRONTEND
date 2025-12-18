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
    Alert,
    Spin,
    message,
    Descriptions,
    Table,
    Modal,
    Divider,
    Steps,
    Row,
    Col,
    Badge
} from 'antd';
import {
    ArrowLeftOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    DownloadOutlined,
    FileOutlined,
    UserOutlined,
    TrophyOutlined,
    StarOutlined,
    SafetyOutlined
} from '@ant-design/icons';
import { actionItemAPI } from '../../services/actionItemAPI';
import moment from 'moment';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const SupervisorL2Review = () => {
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

                // Check if task is at L2 approval stage
                if (result.data.status !== 'Pending L2 Review') {
                    message.warning('This task is not pending Level 2 review');
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

        if (decision === 'reject' && !values.comments) {
            message.error('Please provide rejection reason');
            return;
        }

        Modal.confirm({
            title: `Confirm Level 2 ${decision === 'approve' ? 'Approval' : 'Rejection'}`,
            content: decision === 'approve' 
                ? 'Are you sure you want to approve this completion and forward to Level 3 (Project Creator)?'
                : 'Are you sure you want to reject this completion? It will be sent back to the employee.',
            okText: decision === 'approve' ? 'Approve & Forward' : 'Reject',
            okType: decision === 'approve' ? 'primary' : 'danger',
            onOk: async () => {
                try {
                    setProcessing(true);

                    const response = await fetch(
                        `http://localhost:5001/api/action-items/${taskId}/assignee/${assigneeId}/approve-l2`,
                        {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                decision: decision,
                                comments: values.comments || ''
                            })
                        }
                    );

                    const result = await response.json();

                    if (result.success) {
                        message.success(`Level 2 ${decision}d successfully!`);
                        navigate('/supervisor/action-items');
                    } else {
                        message.error(result.message || `Failed to ${decision} at Level 2`);
                    }
                } catch (error) {
                    console.error('Error processing L2 approval:', error);
                    message.error(`Failed to ${decision} at Level 2`);
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

    const getApprovalStatus = (chain) => {
        if (!chain || chain.length === 0) return null;
        
        const l1 = chain.find(a => a.level === 1);
        const l2 = chain.find(a => a.level === 2);
        const l3 = chain.find(a => a.level === 3);

        return { l1, l2, l3 };
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
        {
            title: 'Action',
            key: 'action',
            width: 100,
            render: (_, record) => (
                <Button
                    type="link"
                    size="small"
                    icon={<DownloadOutlined />}
                    href={`http://localhost:5001${record.url}`}
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
                    description="The task you are trying to review does not exist or is not available."
                    type="error"
                    showIcon
                />
            </div>
        );
    }

    const approvalChain = assignee.completionApprovalChain || [];
    const { l1, l2, l3 } = getApprovalStatus(approvalChain);
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
                        <SafetyOutlined /> Level 2 Review - Supervisor's Supervisor
                    </Title>
                </Space>

                <Alert
                    message="Level 2 Review (Supervisor's Supervisor)"
                    description="You're reviewing the task completion at Level 2. Level 1 (Immediate Supervisor) has already graded this task. Your approval will forward it to Level 3 (Project Creator) for final approval."
                    type="info"
                    showIcon
                    style={{ marginBottom: 24 }}
                />

                {/* Approval Chain Progress */}
                <Card size="small" style={{ marginBottom: 24, backgroundColor: '#f0f8ff' }}>
                    <Title level={5}>Approval Chain Progress</Title>
                    <Steps current={1} size="small">
                        <Steps.Step 
                            title="Level 1" 
                            description={l1?.approver?.name || 'Immediate Supervisor'}
                            status={l1?.status === 'approved' ? 'finish' : l1?.status === 'skipped' ? 'wait' : 'process'}
                            icon={l1?.status === 'approved' ? <CheckCircleOutlined /> : undefined}
                        />
                        <Steps.Step 
                            title="Level 2" 
                            description={l2?.approver?.name || "Supervisor's Supervisor"}
                            status="process"
                            icon={<SafetyOutlined />}
                        />
                        <Steps.Step 
                            title="Level 3" 
                            description={l3?.approver?.name || 'Project Creator'}
                            status="wait"
                        />
                    </Steps>
                </Card>

                {/* Task Summary */}
                <Card size="small" style={{ marginBottom: 24 }}>
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

                {/* Level 1 Grading (Already Approved) */}
                <Card 
                    size="small" 
                    style={{ 
                        marginBottom: 24, 
                        backgroundColor: '#f6ffed',
                        borderLeft: '4px solid #52c41a'
                    }}
                >
                    <Row gutter={16}>
                        <Col span={12}>
                            <Title level={5}>
                                <CheckCircleOutlined style={{ color: '#52c41a' }} /> Level 1 Grading (Approved)
                            </Title>
                            <Space direction="vertical" size="small" style={{ width: '100%' }}>
                                <div>
                                    <Text strong>Graded By: </Text>
                                    <Text>{l1?.approver?.name}</Text>
                                </div>
                                <div>
                                    <Text strong>Grade Given: </Text>
                                    <div style={{ marginTop: 8 }}>
                                        {renderStars(assignee.completionGrade?.score || 0)}
                                        <Text strong style={{ fontSize: '20px', marginLeft: 12, color: '#52c41a' }}>
                                            {assignee.completionGrade?.score?.toFixed(1) || 'N/A'}/5.0
                                        </Text>
                                    </div>
                                </div>
                                <div>
                                    <Text strong>Effective Score: </Text>
                                    <Tag color="green" style={{ fontSize: '14px' }}>
                                        {assignee.completionGrade?.effectiveScore?.toFixed(2) || 0}%
                                    </Tag>
                                </div>
                                <div>
                                    <Text strong>Reviewed: </Text>
                                    <Text type="secondary">
                                        {l1?.reviewedAt ? moment(l1.reviewedAt).format('MMM DD, YYYY HH:mm') : 'N/A'}
                                    </Text>
                                </div>
                            </Space>
                        </Col>
                        <Col span={12}>
                            <Title level={5}>Quality Assessment Notes</Title>
                            <Paragraph style={{ 
                                padding: 12, 
                                backgroundColor: '#ffffff', 
                                borderRadius: 4,
                                border: '1px solid #d9d9d9',
                                whiteSpace: 'pre-wrap'
                            }}>
                                {assignee.completionGrade?.qualityNotes || l1?.comments || 'No notes provided'}
                            </Paragraph>
                        </Col>
                    </Row>
                </Card>

                {/* Linked KPIs */}
                {task.linkedKPIs && task.linkedKPIs.length > 0 && (
                    <Card size="small" style={{ marginBottom: 24 }}>
                        <Title level={5}>
                            <TrophyOutlined /> Linked KPIs
                        </Title>
                        <Space wrap>
                            {task.linkedKPIs.map((kpi, idx) => (
                                <Tag key={idx} color="gold">
                                    {kpi.kpiTitle} (Weight: {kpi.kpiWeight}%)
                                </Tag>
                            ))}
                        </Space>
                    </Card>
                )}

                {/* Employee's Completion Notes */}
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

                {/* Level 2 Review Form */}
                <Card size="small" style={{ backgroundColor: '#fffbe6', borderLeft: '4px solid #faad14' }}>
                    <Title level={5}>
                        <SafetyOutlined /> Your Level 2 Review
                    </Title>
                    
                    <Alert
                        message="Review Responsibility"
                        description="As the supervisor's supervisor, you're performing a quality control review. You cannot change the grade given by Level 1, but you can approve or reject based on overall quality and alignment with standards."
                        type="warning"
                        showIcon
                        style={{ marginBottom: 16 }}
                    />

                    <Form
                        form={form}
                        layout="vertical"
                        onFinish={handleSubmit}
                    >
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
                                Approve & Forward to L3
                            </Button>
                            <Button
                                type={decision === 'reject' ? 'primary' : 'default'}
                                size="large"
                                danger={decision === 'reject'}
                                icon={<CloseCircleOutlined />}
                                onClick={() => setDecision('reject')}
                            >
                                Reject (Send Back)
                            </Button>
                        </Space>

                        {decision === 'approve' && (
                            <>
                                <Alert
                                    message="Approval Effect"
                                    description="Your approval will forward this task to Level 3 (Project Creator) for final approval. The grade assigned by Level 1 will remain unchanged."
                                    type="success"
                                    showIcon
                                    style={{ marginBottom: 16 }}
                                />

                                <Form.Item
                                    name="comments"
                                    label="Review Comments (Optional)"
                                >
                                    <TextArea
                                        rows={3}
                                        placeholder="Add any observations or recommendations for Level 3 review..."
                                        maxLength={300}
                                    />
                                </Form.Item>
                            </>
                        )}

                        {decision === 'reject' && (
                            <>
                                <Alert
                                    message="Rejection Effect"
                                    description="The task will be sent back to the employee for revision. They will need to make corrections and resubmit, restarting the approval chain from Level 1."
                                    type="error"
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
                                        placeholder="Explain clearly what concerns you have about this completion. Be specific about quality issues or standards not met..."
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
                                    icon={decision === 'approve' ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
                                    style={{
                                        backgroundColor: decision === 'approve' ? '#52c41a' : undefined,
                                        borderColor: decision === 'approve' ? '#52c41a' : undefined
                                    }}
                                >
                                    {decision === 'approve' ? 'Approve & Forward' : 'Reject Completion'}
                                </Button>
                            </Space>
                        </Form.Item>
                    </Form>
                </Card>
            </Card>
        </div>
    );
};

export default SupervisorL2Review;