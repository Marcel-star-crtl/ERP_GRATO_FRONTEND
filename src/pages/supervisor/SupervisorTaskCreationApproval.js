import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Card, 
  Descriptions, 
  Typography, 
  Tag, 
  Divider, 
  Form, 
  Input, 
  Radio, 
  Button, 
  message,
  Modal,
  Space,
  Alert,
  Spin,
  Row,
  Col,
  Statistic,
  Timeline,
  Table,
  Tooltip,
  Badge
} from 'antd';
import { 
  CheckCircleOutlined, 
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  FlagOutlined,
  CalendarOutlined,
  UserOutlined,
  ProjectOutlined,
  FileOutlined,
  DownloadOutlined,
  HistoryOutlined,
  TeamOutlined
} from '@ant-design/icons';
import { actionItemAPI } from '../../services/actionItemAPI';
import { useSelector } from 'react-redux';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const SupervisorTaskCreationApproval = () => {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(false);
  const [decision, setDecision] = useState(null);
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    const fetchTask = async () => {
      try {
        setLoading(true);
        const result = await actionItemAPI.getActionItem(taskId);
        
        if (!result.success) {
          throw new Error(result.message || 'Task not found');
        }

        if (result.data.status !== 'Pending Approval') {
          message.warning('This task is not pending approval');
          navigate('/supervisor/action-items');
          return;
        }

        setTask(result.data);
      } catch (error) {
        console.error('Error fetching task:', error);
        message.error(error.message || 'Failed to load task details');
        navigate('/supervisor/action-items');
      } finally {
        setLoading(false);
      }
    };
  
    fetchTask();
  }, [taskId, navigate]);

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      const result = await actionItemAPI.processCreationApproval(
        taskId,
        values.decision,
        values.comments || ''
      );
      
      if (result.success) {
        message.success(`Task ${values.decision === 'approve' ? 'approved' : 'rejected'} successfully`);
        navigate('/supervisor/action-items');
      } else {
        throw new Error(result.message || 'Failed to process approval');
      }
    } catch (error) {
      console.error('Error processing approval:', error);
      message.error(error.message || 'Failed to process approval');
    } finally {
      setLoading(false);
    }
  };

  const showConfirmModal = () => {
    Modal.confirm({
      title: `Confirm ${decision === 'approve' ? 'Approval' : 'Rejection'}`,
      icon: decision === 'approve' ? <CheckCircleOutlined /> : <CloseCircleOutlined />,
      content: `Are you sure you want to ${decision === 'approve' ? 'approve' : 'reject'} this task creation?`,
      onOk: () => form.submit(),
      okText: `Yes, ${decision === 'approve' ? 'Approve' : 'Reject'}`,
      cancelText: 'Cancel'
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

  if (loading && !task) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <Spin size="large" />
        <div style={{ marginTop: '16px' }}>Loading task details...</div>
      </div>
    );
  }

  if (!task) {
    return (
      <div style={{ padding: '24px' }}>
        <Alert
          message="Task Not Found"
          description="The task you are trying to access does not exist or you don't have permission to view it."
          type="error"
          showIcon
        />
      </div>
    );
  }

  const isOverdue = dayjs(task.dueDate).isBefore(dayjs(), 'day');
  const assignedUsers = task.assignedTo || [];

  // Assignees table columns
  const assigneeColumns = [
    {
      title: 'Name',
      key: 'name',
      render: (_, record) => (
        <Space>
          <UserOutlined />
          <Text strong>{record.user?.fullName || 'Unassigned'}</Text>
        </Space>
      )
    },
    {
      title: 'Email',
      dataIndex: ['user', 'email'],
      key: 'email',
      render: (email) => <Text type="secondary">{email || 'N/A'}</Text>
    },
    {
      title: 'Department',
      dataIndex: ['user', 'department'],
      key: 'department',
      render: (dept) => <Tag color="blue">{dept || 'N/A'}</Tag>
    },
    {
      title: 'Position',
      dataIndex: ['user', 'position'],
      key: 'position',
      render: (pos) => <Text type="secondary">{pos || 'N/A'}</Text>
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card loading={loading}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <Title level={3} style={{ margin: 0 }}>
            <ExclamationCircleOutlined /> Task Creation Approval
          </Title>
          <Space>
            <Button onClick={() => navigate('/supervisor/action-items')}>
              Back to Tasks
            </Button>
          </Space>
        </div>

        <Alert
          message="Approval Required"
          description="The employee needs your approval before they can start working on this task. Review the task details carefully before making your decision."
          type="info"
          showIcon
          style={{ marginBottom: '24px' }}
        />

        {/* Task Summary Cards */}
        <Card size="small" style={{ marginBottom: '24px', backgroundColor: '#fff7e6', borderLeft: '4px solid #faad14' }}>
          <Title level={4} style={{ marginBottom: '16px' }}>Task Summary</Title>
          <Row gutter={16}>
            <Col xs={24} sm={12} md={6}>
              <Statistic
                title="Priority Level"
                value={task.priority}
                valueRender={() => (
                  <Tag color={getPriorityColor(task.priority)} icon={<FlagOutlined />} style={{ fontSize: '14px' }}>
                    {task.priority}
                  </Tag>
                )}
              />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Statistic
                title="Current Status"
                value={task.status}
                valueRender={() => (
                  <Tag color={getStatusColor(task.status)} style={{ fontSize: '14px' }}>
                    {task.status}
                  </Tag>
                )}
              />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Statistic
                title="Assigned Team"
                value={assignedUsers.length}
                suffix={assignedUsers.length === 1 ? 'person' : 'people'}
                prefix={<TeamOutlined />}
              />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Statistic
                title="Due Date"
                value={dayjs(task.dueDate).format('MMM DD, YYYY')}
                valueStyle={isOverdue ? { color: '#f5222d' } : { color: '#52c41a' }}
                prefix={<CalendarOutlined />}
              />
            </Col>
          </Row>
        </Card>

        {/* Warning for overdue */}
        {isOverdue && (
          <Alert
            message="Due Date Alert"
            description="The proposed due date for this task has already passed. Consider discussing a more realistic timeline with the employee."
            type="warning"
            showIcon
            style={{ marginBottom: '24px' }}
          />
        )}

        {/* Task Details */}
        <Card size="small" title="Task Details" style={{ marginBottom: '24px' }}>
          <Descriptions bordered column={1} size="small">
            <Descriptions.Item label="Task ID">
              <Tag color="blue" style={{ fontSize: '14px' }}>
                {task.displayId || `TASK-${task._id.slice(-6).toUpperCase()}`}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Created By">
              <Space>
                <UserOutlined />
                <Text strong>{task.createdBy?.fullName}</Text>
                <Text type="secondary">({task.createdBy?.email})</Text>
              </Space>
              <br />
              <Tag color="geekblue" size="small" style={{ marginTop: '4px' }}>
                {task.createdBy?.department}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Task Title">
              <Text strong style={{ fontSize: '15px' }}>{task.title}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Description">
              <Paragraph style={{ marginBottom: 0, whiteSpace: 'pre-wrap' }}>
                {task.description}
              </Paragraph>
            </Descriptions.Item>
            <Descriptions.Item label="Priority">
              <Tag color={getPriorityColor(task.priority)} icon={<FlagOutlined />}>
                {task.priority}
              </Tag>
              {task.priority === 'CRITICAL' && (
                <Text type="danger" style={{ marginLeft: '8px' }}>
                  Requires immediate attention
                </Text>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Due Date">
              <Space>
                <CalendarOutlined />
                <Text type={isOverdue ? 'danger' : 'secondary'}>
                  {dayjs(task.dueDate).format('dddd, MMMM DD, YYYY')}
                </Text>
                {isOverdue && (
                  <Tag color="red">Overdue</Tag>
                )}
                {!isOverdue && (
                  <Text type="secondary">
                    ({dayjs(task.dueDate).diff(dayjs(), 'day')} days from now)
                  </Text>
                )}
              </Space>
            </Descriptions.Item>
            {task.projectId && (
              <Descriptions.Item label="Associated Project">
                <Space>
                  <ProjectOutlined />
                  <Text strong>{task.projectId.name}</Text>
                  {task.projectId.code && (
                    <Tag color="purple">{task.projectId.code}</Tag>
                  )}
                </Space>
              </Descriptions.Item>
            )}
            {task.milestoneId && (
              <Descriptions.Item label="Milestone">
                <Text>{task.milestoneId.name || task.milestoneId}</Text>
              </Descriptions.Item>
            )}
            {task.taskWeight > 0 && (
              <Descriptions.Item label="Task Weight">
                <Badge count={`${task.taskWeight}%`} style={{ backgroundColor: '#52c41a' }} />
                <Text type="secondary" style={{ marginLeft: '8px' }}>
                  Contribution to project completion
                </Text>
              </Descriptions.Item>
            )}
            {task.notes && (
              <Descriptions.Item label="Additional Notes">
                <Paragraph style={{ marginBottom: 0, backgroundColor: '#f5f5f5', padding: '12px', borderRadius: '4px' }}>
                  {task.notes}
                </Paragraph>
              </Descriptions.Item>
            )}
            <Descriptions.Item label="Created On">
              {dayjs(task.createdAt).format('MMMM DD, YYYY [at] HH:mm')}
            </Descriptions.Item>
          </Descriptions>
        </Card>

        {/* Assigned Team Members */}
        {assignedUsers.length > 0 && (
          <Card 
            size="small" 
            title={
              <Space>
                <TeamOutlined />
                <span>Assigned Team Members ({assignedUsers.length})</span>
              </Space>
            }
            style={{ marginBottom: '24px' }}
          >
            <Table
              columns={assigneeColumns}
              dataSource={assignedUsers}
              rowKey="_id"
              pagination={false}
              size="small"
            />
          </Card>
        )}

        {/* Supervisor Information */}
        {task.supervisor && (
          <Card size="small" title="Supervisor Assignment" style={{ marginBottom: '24px' }}>
            <Descriptions column={2} size="small">
              <Descriptions.Item label="Supervisor">
                <Text strong>{task.supervisor.name}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Email">
                {task.supervisor.email}
              </Descriptions.Item>
              <Descriptions.Item label="Department">
                <Tag color="blue">{task.supervisor.department}</Tag>
              </Descriptions.Item>
            </Descriptions>
          </Card>
        )}

        <Divider />

        {/* Activity Log */}
        {task.activityLog && task.activityLog.length > 0 && (
          <Card 
            size="small" 
            title={
              <Space>
                <HistoryOutlined />
                Activity Timeline
              </Space>
            }
            style={{ marginBottom: '24px' }}
          >
            <Timeline>
              {task.activityLog.slice().reverse().map((entry, index) => (
                <Timeline.Item 
                  key={index}
                  color={entry.action === 'created' ? 'blue' : 'gray'}
                >
                  <div>
                    <Text strong>{entry.action.toUpperCase()}</Text>
                    {entry.performedBy && (
                      <>
                        <Text type="secondary"> by </Text>
                        <Text strong>{entry.performedBy.fullName}</Text>
                      </>
                    )}
                    <br />
                    <Text type="secondary">{entry.details || entry.description}</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      <CalendarOutlined style={{ marginRight: '4px' }} />
                      {dayjs(entry.timestamp).format('MMMM DD, YYYY [at] HH:mm')}
                    </Text>
                  </div>
                </Timeline.Item>
              ))}
            </Timeline>
          </Card>
        )}

        <Divider />

        {/* Approval Form */}
        <Card size="small" title="Make Your Decision" style={{ backgroundColor: '#f0f2f5' }}>
          <Form form={form} layout="vertical" onFinish={handleSubmit}>
            <Form.Item
              name="decision"
              label={<Text strong style={{ fontSize: '15px' }}>Your Decision</Text>}
              rules={[{ required: true, message: 'Please make a decision' }]}
            >
              <Radio.Group onChange={(e) => setDecision(e.target.value)} size="large">
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Radio.Button 
                    value="approve" 
                    style={{ 
                      width: '100%', 
                      height: 'auto', 
                      padding: '16px',
                      borderColor: decision === 'approve' ? '#52c41a' : undefined,
                      backgroundColor: decision === 'approve' ? '#f6ffed' : undefined
                    }}
                  >
                    <CheckCircleOutlined style={{ color: '#52c41a', fontSize: '18px' }} />
                    <Text strong style={{ marginLeft: '8px', fontSize: '15px' }}>
                      Approve Task Creation
                    </Text>
                    <br />
                    <Text type="secondary" style={{ marginLeft: '26px', fontSize: '13px' }}>
                      Employee can start working on this task immediately
                    </Text>
                  </Radio.Button>
                  
                  <Radio.Button 
                    value="reject" 
                    style={{ 
                      width: '100%', 
                      height: 'auto', 
                      padding: '16px',
                      borderColor: decision === 'reject' ? '#ff4d4f' : undefined,
                      backgroundColor: decision === 'reject' ? '#fff1f0' : undefined
                    }}
                  >
                    <CloseCircleOutlined style={{ color: '#ff4d4f', fontSize: '18px' }} />
                    <Text strong style={{ marginLeft: '8px', fontSize: '15px' }}>
                      Reject Task Creation
                    </Text>
                    <br />
                    <Text type="secondary" style={{ marginLeft: '26px', fontSize: '13px' }}>
                      Task is not appropriate or feasible at this time
                    </Text>
                  </Radio.Button>
                </Space>
              </Radio.Group>
            </Form.Item>

            {decision === 'approve' && (
              <>
                <Alert
                  message="Approval Effect"
                  description="Once approved, the task will move to 'In Progress' status and the assigned team members will be notified. They can begin working on it immediately."
                  type="success"
                  showIcon
                  style={{ marginBottom: '16px' }}
                />
                <Form.Item
                  name="comments"
                  label="Comments (Optional)"
                >
                  <TextArea 
                    rows={3} 
                    placeholder="Provide any additional guidance, suggestions, or context for the team..."
                    showCount
                    maxLength={500}
                  />
                </Form.Item>
              </>
            )}

            {decision === 'reject' && (
              <>
                <Alert
                  message="Rejection Effect"
                  description="The task will be rejected and removed from the system. The employee who created it will be notified with your rejection reason. They may create a revised task if needed."
                  type="warning"
                  showIcon
                  style={{ marginBottom: '16px' }}
                />
                <Form.Item
                  name="comments"
                  label="Reason for Rejection"
                  rules={[
                    { required: true, message: 'Please provide a reason for rejection' },
                    { min: 10, message: 'Please provide a detailed reason (at least 10 characters)' }
                  ]}
                >
                  <TextArea 
                    rows={4} 
                    placeholder="Explain why this task is not appropriate or feasible at this time. Be specific to help the employee understand what needs to change..."
                    showCount
                    maxLength={500}
                  />
                </Form.Item>
              </>
            )}

            <Form.Item style={{ marginBottom: 0 }}>
              <Space>
                <Button 
                  size="large"
                  onClick={() => navigate('/supervisor/action-items')}
                >
                  Cancel
                </Button>
                <Button
                  type="primary"
                  size="large"
                  onClick={showConfirmModal}
                  disabled={!decision}
                  loading={loading}
                  icon={decision === 'approve' ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
                  style={{
                    backgroundColor: decision === 'approve' ? '#52c41a' : decision === 'reject' ? '#ff4d4f' : undefined,
                    borderColor: decision === 'approve' ? '#52c41a' : decision === 'reject' ? '#ff4d4f' : undefined
                  }}
                >
                  {decision === 'approve' ? 'Approve Task' : decision === 'reject' ? 'Reject Task' : 'Submit Decision'}
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Card>
      </Card>

      {/* Custom CSS for better styling */}
      <style>{`
        .ant-descriptions-item-label {
          font-weight: 600;
          background-color: #fafafa;
        }
        .ant-card-head-title {
          font-weight: 600;
        }
        .ant-radio-button-wrapper-checked {
          border-width: 2px !important;
        }
      `}</style>
    </div>
  );
};

export default SupervisorTaskCreationApproval;