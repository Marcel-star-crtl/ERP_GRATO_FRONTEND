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
    StarOutlined,
    SafetyOutlined,
    CrownOutlined
} from '@ant-design/icons';
import { actionItemAPI } from '../../services/actionItemAPI';
import moment from 'moment';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const SupervisorL3FinalApproval = () => {
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

                // Check if task is at L3 approval stage
                if (result.data.status !== 'Pending L3 Final Approval') {
                    message.warning('This task is not pending Level 3 final approval');
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
            title: `Confirm Level 3 ${decision === 'approve' ? 'Final Approval' : 'Rejection'}`,
            content: decision === 'approve' 
                ? 'Are you sure you want to give final approval? This will mark the task as COMPLETED.'
                : 'Are you sure you want to reject this completion? It will be sent back to the employee.',
            okText: decision === 'approve' ? 'Give Final Approval' : 'Reject',
            okType: decision === 'approve' ? 'primary' : 'danger',
            onOk: async () => {
                try {
                    setProcessing(true);

                    const response = await fetch(
                        `${process.env.REACT_APP_API_URL}/action-items/${taskId}/assignee/${assigneeId}/approve-l3`,
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
                        message.success(
                            decision === 'approve' 
                                ? 'Task approved! Marked as COMPLETED.' 
                                : 'Task rejected and sent back for revision.'
                        );
                        navigate('/supervisor/action-items');
                    } else {
                        message.error(result.message || `Failed to ${decision} at Level 3`);
                    }
                } catch (error) {
                    console.error('Error processing L3 approval:', error);
                    message.error(`Failed to ${decision} at Level 3`);
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
                    href={`${process.env.REACT_APP_API_URL}${record.url}`}
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
                        <CrownOutlined /> Level 3 Final Approval - Project Creator
                    </Title>
                </Space>

                <Alert
                    message="Level 3 Final Approval (Project Creator)"
                    description="You're the project creator performing the final approval. Level 1 (Immediate Supervisor) has graded the task, and Level 2 (Supervisor's Supervisor) has reviewed it. Your approval will mark this task as COMPLETED."
                    type="info"
                    showIcon
                    style={{ marginBottom: 24 }}
                />

                {/* Approval Chain Progress */}
                <Card size="small" style={{ marginBottom: 24, backgroundColor: '#f0f8ff' }}>
                    <Title level={5}>Approval Chain Progress</Title>
                    <Steps current={2} size="small">
                        <Steps.Step 
                            title="Level 1" 
                            description={l1?.approver?.name || 'Immediate Supervisor'}
                            status="finish"
                            icon={<CheckCircleOutlined />}
                        />
                        <Steps.Step 
                            title="Level 2" 
                            description={l2?.approver?.name || "Supervisor's Supervisor"}
                            status={l2?.status === 'approved' ? 'finish' : l2?.status === 'skipped' ? 'wait' : 'process'}
                            icon={l2?.status === 'approved' ? <CheckCircleOutlined /> : l2?.status === 'skipped' ? <CloseCircleOutlined /> : <SafetyOutlined />}
                        />
                        <Steps.Step 
                            title="Level 3" 
                            description={l3?.approver?.name || 'Project Creator'}
                            status="process"
                            icon={<CrownOutlined />}
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

                {/* Previous Approvals Summary */}
                <Row gutter={16} style={{ marginBottom: 24 }}>
                    {/* Level 1 */}
                    <Col span={12}>
                        <Card 
                            size="small" 
                            style={{ 
                                backgroundColor: '#f6ffed',
                                borderLeft: '4px solid #52c41a',
                                height: '100%'
                            }}
                        >
                            <Title level={5}>
                                <CheckCircleOutlined style={{ color: '#52c41a' }} /> Level 1 Grading
                            </Title>
                            <Space direction="vertical" size="small" style={{ width: '100%' }}>
                                <div>
                                    <Text strong>Graded By: </Text>
                                    <Text>{l1?.approver?.name}</Text>
                                </div>
                                <div>
                                    <Text strong>Grade: </Text>
                                    <div style={{ marginTop: 8 }}>
                                        {renderStars(assignee.completionGrade?.score || 0)}
                                        <Text strong style={{ fontSize: '18px', marginLeft: 12, color: '#52c41a' }}>
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
                                    <Text strong>Comments: </Text>
                                    <Paragraph style={{ margin: 0, fontSize: '12px' }}>
                                        {assignee.completionGrade?.qualityNotes || l1?.comments || 'No comments'}
                                    </Paragraph>
                                </div>
                            </Space>
                        </Card>
                    </Col>

                    {/* Level 2 */}
                    <Col span={12}>
                        <Card 
                            size="small" 
                            style={{ 
                                backgroundColor: l2?.status === 'skipped' ? '#f5f5f5' : '#f6ffed',
                                borderLeft: `4px solid ${l2?.status === 'skipped' ? '#d9d9d9' : '#52c41a'}`,
                                height: '100%'
                            }}
                        >
                            <Title level={5}>
                                {l2?.status === 'skipped' ? (
                                    <CloseCircleOutlined style={{ color: '#d9d9d9' }} />
                                ) : (
                                    <CheckCircleOutlined style={{ color: '#52c41a' }} />
                                )} Level 2 Review
                            </Title>
                            {l2?.status === 'skipped' ? (
                                <Alert 
                                    message="Level 2 Skipped" 
                                    description={l2?.comments || 'No supervisor\'s supervisor in hierarchy'}
                                    type="warning" 
                                    showIcon 
                                    size="small"
                                />
                            ) : (
                                <Space direction="vertical" size="small" style={{ width: '100%' }}>
                                    <div>
                                        <Text strong>Reviewed By: </Text>
                                        <Text>{l2?.approver?.name || 'N/A'}</Text>
                                    </div>
                                    <div>
                                        <Text strong>Status: </Text>
                                        <Tag color="green">Approved</Tag>
                                    </div>
                                    <div>
                                        <Text strong>Comments: </Text>
                                        <Paragraph style={{ margin: 0, fontSize: '12px' }}>
                                            {l2?.comments || 'No comments provided'}
                                        </Paragraph>
                                    </div>
                                    <div>
                                        <Text strong>Reviewed: </Text>
                                        <Text type="secondary" style={{ fontSize: '12px' }}>
                                            {l2?.reviewedAt ? moment(l2.reviewedAt).format('MMM DD, YYYY HH:mm') : 'N/A'}
                                        </Text>
                                    </div>
                                </Space>
                            )}
                        </Card>
                    </Col>
                </Row>

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

                {/* Level 3 Final Approval Form */}
                <Card size="small" style={{ backgroundColor: '#fff7e6', borderLeft: '4px solid #faad14' }}>
                    <Title level={5}>
                        <CrownOutlined /> Your Final Approval (Level 3)
                    </Title>
                    
                    <Alert
                        message="Final Approval Responsibility"
                        description="As the project creator, you have the final say. Your approval will mark this task as COMPLETED and update all linked KPIs and milestone progress. Your rejection will send it back to the employee for revision."
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
                                Give Final Approval
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
                                    message="Final Approval Effect"
                                    description={
                                        <div>
                                            <p style={{ margin: 0, marginBottom: 8 }}>Your approval will:</p>
                                            <ul style={{ marginBottom: 0, paddingLeft: 20 }}>
                                                <li>Mark the task as <strong>COMPLETED</strong></li>
                                                <li>Update linked KPIs with the effective score: <strong>{assignee.completionGrade?.effectiveScore?.toFixed(2) || 0}%</strong></li>
                                                <li>Update milestone progress: <strong>+{task.taskWeight}%</strong></li>
                                                <li>Notify the employee of completion</li>
                                            </ul>
                                        </div>
                                    }
                                    type="success"
                                    showIcon
                                    style={{ marginBottom: 16 }}
                                />

                                <Form.Item
                                    name="comments"
                                    label="Final Comments (Optional)"
                                >
                                    <TextArea
                                        rows={3}
                                        placeholder="Add any final remarks or congratulations to the employee..."
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
                                        placeholder="Explain clearly what needs to be revised. Be specific about what doesn't meet project standards..."
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
                                    {decision === 'approve' ? 'Give Final Approval' : 'Reject & Send Back'}
                                </Button>
                            </Space>
                        </Form.Item>
                    </Form>
                </Card>
            </Card>
        </div>
    );
};

export default SupervisorL3FinalApproval;

