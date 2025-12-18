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
    Upload,
    Alert,
    Spin,
    message,
    Descriptions,
    Progress,
    Divider
} from 'antd';
import {
    ArrowLeftOutlined,
    UploadOutlined,
    FileOutlined,
    CheckCircleOutlined,
    WarningOutlined
} from '@ant-design/icons';
import { actionItemAPI } from '../../services/actionItemAPI';
import { useSelector } from 'react-redux';
import moment from 'moment';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const TaskCompletionSubmission = () => {
    const { taskId } = useParams();
    const navigate = useNavigate();
    const { user } = useSelector((state) => state.auth);
    const [form] = Form.useForm();
    const [task, setTask] = useState(null);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [fileList, setFileList] = useState([]);

    useEffect(() => {
        fetchTaskDetails();
    }, [taskId]);

    const fetchTaskDetails = async () => {
        try {
            setLoading(true);
            const result = await actionItemAPI.getActionItem(taskId);

            if (result.success) {
                setTask(result.data);

                // Check if user is an assignee
                const userAssignment = result.data.assignedTo?.find(a => a.user._id === user._id);
                if (!userAssignment) {
                    message.error('You are not assigned to this task');
                    navigate('/employee/tasks');
                    return;
                }

                // Check if already submitted
                if (userAssignment.completionStatus === 'submitted') {
                    message.warning('You have already submitted this task for completion');
                }

                // Check if already approved
                if (userAssignment.completionStatus === 'approved') {
                    message.info('This task has already been approved');
                    navigate('/employee/tasks');
                    return;
                }
            } else {
                message.error(result.message);
                navigate('/employee/tasks');
            }
        } catch (error) {
            console.error('Error fetching task:', error);
            message.error('Failed to load task details');
            navigate('/employee/tasks');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (values) => {
        if (fileList.length === 0) {
            message.error('Please upload at least one completion document');
            return;
        }

        try {
            setSubmitting(true);

            const formData = new FormData();
            formData.append('completionNotes', values.completionNotes || '');

            fileList.forEach(file => {
                if (file.originFileObj) {
                    formData.append('documents', file.originFileObj);
                }
            });

            const result = await actionItemAPI.submitForCompletion(taskId, formData);

            if (result.success) {
                message.success('Task submitted for supervisor approval!');
                navigate('/employee/tasks');
            } else {
                message.error(result.message || 'Failed to submit task');
            }
        } catch (error) {
            console.error('Error submitting task:', error);
            message.error('Failed to submit task for completion');
        } finally {
            setSubmitting(false);
        }
    };

    const uploadProps = {
        fileList,
        onChange: (info) => {
            setFileList(info.fileList);
        },
        onRemove: (file) => {
            setFileList(fileList.filter(f => f.uid !== file.uid));
        },
        beforeUpload: () => false, // Prevent auto upload
        accept: '.pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.zip',
        multiple: true
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

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
                <Spin size="large" />
            </div>
        );
    }

    if (!task) {
        return (
            <div style={{ padding: '24px' }}>
                <Alert
                    message="Task Not Found"
                    description="The task you are trying to submit does not exist or you don't have access to it."
                    type="error"
                    showIcon
                />
            </div>
        );
    }

    const userAssignment = task.assignedTo?.find(a => a.user._id === user._id);
    const isOverdue = moment(task.dueDate).isBefore(moment()) && task.status !== 'Completed';

    return (
        <div style={{ padding: '24px' }}>
            <Card>
                <Space style={{ marginBottom: 24 }}>
                    <Button
                        icon={<ArrowLeftOutlined />}
                        onClick={() => navigate('/employee/tasks')}
                    >
                        Back to Tasks
                    </Button>
                    <Title level={3} style={{ margin: 0 }}>
                        <CheckCircleOutlined /> Submit Task Completion
                    </Title>
                </Space>

                <Alert
                    message="Completion Submission"
                    description="Upload proof of completion documents and provide notes about what you accomplished. Your supervisor will review and grade your work."
                    type="info"
                    showIcon
                    style={{ marginBottom: 24 }}
                />

                {/* Task Details */}
                <Card size="small" style={{ marginBottom: 24, backgroundColor: '#f0f8ff' }}>
                    <Descriptions bordered column={2} size="small">
                        <Descriptions.Item label="Task" span={2}>
                            <Text strong>{task.title}</Text>
                        </Descriptions.Item>
                        <Descriptions.Item label="Description" span={2}>
                            <Paragraph style={{ margin: 0 }}>{task.description}</Paragraph>
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
                                    <Tag color="red" size="small" icon={<WarningOutlined />}>
                                        Overdue
                                    </Tag>
                                </>
                            )}
                        </Descriptions.Item>
                        {task.milestoneId && (
                            <Descriptions.Item label="Type" span={2}>
                                <Tag color="purple">Milestone Task</Tag>
                                {task.taskWeight > 0 && (
                                    <Tag color="blue">Weight: {task.taskWeight}%</Tag>
                                )}
                            </Descriptions.Item>
                        )}
                        {!task.milestoneId && (
                            <Descriptions.Item label="Type" span={2}>
                                <Tag color="cyan">Personal Task</Tag>
                            </Descriptions.Item>
                        )}
                    </Descriptions>
                </Card>

                {/* Linked KPIs */}
                {task.linkedKPIs && task.linkedKPIs.length > 0 && (
                    <Card size="small" style={{ marginBottom: 24 }}>
                        <Title level={5}>Linked KPIs</Title>
                        <Space wrap>
                            {task.linkedKPIs.map((kpi, idx) => (
                                <Tag key={idx} color="gold">
                                    {kpi.kpiTitle} (Weight: {kpi.kpiWeight}%)
                                </Tag>
                            ))}
                        </Space>
                        <Alert
                            message="Your completion grade will contribute to these KPI achievements"
                            type="info"
                            showIcon
                            style={{ marginTop: 12 }}
                        />
                    </Card>
                )}

                {/* Current Progress */}
                <Card size="small" style={{ marginBottom: 24 }}>
                    <Title level={5}>Current Progress</Title>
                    <Progress percent={task.progress || 0} status="active" />
                    {userAssignment && (
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                            Your submission status: {userAssignment.completionStatus}
                        </Text>
                    )}
                </Card>

                <Divider />

                {/* Submission Form */}
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                >
                    <Form.Item
                        name="completionNotes"
                        label="Completion Notes"
                        rules={[
                            { required: true, message: 'Please provide completion notes' },
                            { min: 20, message: 'Please provide detailed notes (at least 20 characters)' }
                        ]}
                    >
                        <TextArea
                            rows={6}
                            placeholder="Describe what you completed, how you accomplished it, any challenges faced, and the outcomes achieved..."
                            showCount
                            maxLength={1000}
                        />
                    </Form.Item>

                    <Form.Item
                        label="Completion Documents"
                        required
                        extra="Upload proof of completion: screenshots, reports, documents, images, etc. (Max 10 files)"
                    >
                        <Upload {...uploadProps}>
                            <Button icon={<UploadOutlined />}>
                                Select Files to Upload
                            </Button>
                        </Upload>
                        {fileList.length > 0 && (
                            <Alert
                                message={`${fileList.length} file(s) selected`}
                                type="success"
                                showIcon
                                style={{ marginTop: 12 }}
                            />
                        )}
                    </Form.Item>

                    <Alert
                        message="Supervisor Review"
                        description="After submission, your supervisor will review the completion documents and notes, then grade your work on a scale of 1-5. The grade will affect your KPI achievement."
                        type="warning"
                        showIcon
                        style={{ marginBottom: 16 }}
                    />

                    <Form.Item>
                        <Space>
                            <Button onClick={() => navigate('/employee/tasks')}>
                                Cancel
                            </Button>
                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={submitting}
                                icon={<CheckCircleOutlined />}
                                disabled={fileList.length === 0}
                            >
                                Submit for Approval
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Card>
        </div>
    );
};

export default TaskCompletionSubmission;