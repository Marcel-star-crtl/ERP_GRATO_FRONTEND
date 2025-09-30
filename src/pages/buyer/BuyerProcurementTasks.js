import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Typography,
  Tag,
  Row,
  Col,
  Statistic,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  Progress,
  Tabs,
  Alert,
  Divider,
  Steps,
  Badge,
  message,
  Tooltip,
  Timeline,
  List,
  Avatar
} from 'antd';
import {
  ShoppingCartOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  FileTextOutlined,
  UserOutlined,
  CalendarOutlined,
  DollarOutlined,
  TeamOutlined,
  SendOutlined,
  EyeOutlined,
  EditOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  SolutionOutlined,
  MailOutlined,
  PhoneOutlined
} from '@ant-design/icons';
import moment from 'moment';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const { Step } = Steps;

// Mock data
const mockTasks = [
  {
    id: 'TASK001',
    requisitionId: 'REQ20241215001',
    title: 'IT Accessories Procurement',
    description: 'Source and procure IT accessories including wireless mice, keyboards, converters, and external drives',
    assignedDate: '2024-12-16',
    dueDate: '2024-12-20',
    status: 'in_progress',
    priority: 'high',
    stage: 'supplier_sourcing',
    progress: 60,
    budget: 2500000,
    department: 'IT Department',
    requester: 'John Doe',
    currentStep: 2,
    totalSteps: 5,
    suppliersContacted: 3,
    quotesReceived: 2,
    estimatedSavings: 250000,
    lastActivity: '2024-12-16T14:30:00Z',
    activities: [
      { type: 'sourcing', description: 'RFQ sent to 3 suppliers', timestamp: '2024-12-16T10:00:00Z' },
      { type: 'quote', description: 'Quote received from TechSource Cameroon', timestamp: '2024-12-16T14:30:00Z' }
    ]
  },
  {
    id: 'TASK002',
    requisitionId: 'REQ20241214002',
    title: 'Office Furniture Replacement',
    description: 'Procure ergonomic office chairs and desks for meeting rooms',
    assignedDate: '2024-12-15',
    dueDate: '2024-12-22',
    status: 'pending_start',
    priority: 'medium',
    stage: 'initial_review',
    progress: 10,
    budget: 1800000,
    department: 'HR Department',
    requester: 'Jane Smith',
    currentStep: 0,
    totalSteps: 5,
    suppliersContacted: 0,
    quotesReceived: 0,
    estimatedSavings: 0,
    lastActivity: '2024-12-15T16:20:00Z',
    activities: [
      { type: 'assignment', description: 'Task assigned to buyer', timestamp: '2024-12-15T16:20:00Z' }
    ]
  },
  {
    id: 'TASK003',
    requisitionId: 'REQ20241213003',
    title: 'Medical Supplies Sourcing',
    description: 'Emergency procurement of medical supplies for company clinic',
    assignedDate: '2024-12-14',
    dueDate: '2024-12-18',
    status: 'quote_evaluation',
    priority: 'high',
    stage: 'quote_evaluation',
    progress: 85,
    budget: 3200000,
    department: 'Medical Department',
    requester: 'Dr. Adams',
    currentStep: 4,
    totalSteps: 5,
    suppliersContacted: 4,
    quotesReceived: 4,
    estimatedSavings: 480000,
    lastActivity: '2024-12-16T11:15:00Z',
    activities: [
      { type: 'sourcing', description: 'RFQ sent to 4 suppliers', timestamp: '2024-12-14T09:00:00Z' },
      { type: 'quote', description: 'All quotes received', timestamp: '2024-12-16T11:15:00Z' }
    ]
  }
];

const BuyerProcurementTasks = () => {
  const [tasks, setTasks] = useState(mockTasks);
  const [selectedTask, setSelectedTask] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [form] = Form.useForm();

  const getStatusTag = (status) => {
    const statusMap = {
      'pending_start': { color: 'orange', text: 'Pending Start' },
      'in_progress': { color: 'blue', text: 'In Progress' },
      'quote_evaluation': { color: 'purple', text: 'Quote Evaluation' },
      'completed': { color: 'green', text: 'Completed' },
      'on_hold': { color: 'red', text: 'On Hold' }
    };
    const statusInfo = statusMap[status] || { color: 'default', text: status };
    return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>;
  };

  const getPriorityTag = (priority) => {
    const priorityMap = {
      'low': 'green',
      'medium': 'orange',
      'high': 'red',
      'urgent': 'volcano'
    };
    return <Tag color={priorityMap[priority] || 'default'}>{priority.toUpperCase()}</Tag>;
  };

  const getStageDescription = (stage) => {
    const stages = {
      'initial_review': 'Initial Review',
      'supplier_sourcing': 'Supplier Sourcing',
      'rfq_sent': 'RFQ Sent',
      'quote_evaluation': 'Quote Evaluation',
      'award_recommendation': 'Award Recommendation'
    };
    return stages[stage] || stage;
  };

  const procurementSteps = [
    'Initial Review',
    'Supplier Sourcing',
    'RFQ Preparation',
    'Quote Evaluation',
    'Award & PO Creation'
  ];

  const handleStartTask = (task) => {
    setSelectedTask(task);
    setActionModalVisible(true);
    form.setFieldsValue({
      action: 'start_sourcing',
      notes: '',
      expectedCompletion: moment().add(5, 'days')
    });
  };

  const handleViewDetails = (task) => {
    setSelectedTask(task);
    setDetailModalVisible(true);
  };

  const handleSubmitAction = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update task status
      const updatedTasks = tasks.map(task => 
        task.id === selectedTask.id 
          ? { ...task, status: 'in_progress', stage: 'supplier_sourcing', currentStep: 1, progress: 20 }
          : task
      );
      setTasks(updatedTasks);
      
      message.success('Task updated successfully!');
      setActionModalVisible(false);
      form.resetFields();
    } catch (error) {
      console.error('Error updating task:', error);
      message.error('Failed to update task');
    } finally {
      setLoading(false);
    }
  };

  const getFilteredTasks = () => {
    switch (activeTab) {
      case 'pending':
        return tasks.filter(task => task.status === 'pending_start');
      case 'in_progress':
        return tasks.filter(task => task.status === 'in_progress');
      case 'evaluation':
        return tasks.filter(task => task.status === 'quote_evaluation');
      case 'urgent':
        return tasks.filter(task => task.priority === 'high' || task.priority === 'urgent');
      default:
        return tasks;
    }
  };

  const columns = [
    {
      title: 'Task Details',
      key: 'details',
      render: (_, record) => (
        <div>
          <Text strong>{record.title}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.id} • Req: {record.requisitionId}
          </Text>
          <br />
          <Text type="secondary" style={{ fontSize: '11px' }}>
            {record.department}
          </Text>
        </div>
      ),
      width: 200
    },
    {
      title: 'Progress',
      key: 'progress',
      render: (_, record) => (
        <div>
          <Progress 
            percent={record.progress} 
            size="small" 
            status={record.status === 'on_hold' ? 'exception' : 'active'}
          />
          <Text type="secondary" style={{ fontSize: '11px' }}>
            Step {record.currentStep + 1} of {record.totalSteps}
          </Text>
          <br />
          <Text type="secondary" style={{ fontSize: '11px' }}>
            {getStageDescription(record.stage)}
          </Text>
        </div>
      ),
      width: 150
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority) => getPriorityTag(priority),
      width: 100
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => getStatusTag(status),
      width: 130
    },
    {
      title: 'Budget',
      dataIndex: 'budget',
      key: 'budget',
      render: (budget) => (
        <Text strong style={{ color: '#1890ff' }}>
          XAF {budget?.toLocaleString()}
        </Text>
      ),
      width: 120
    },
    {
      title: 'Due Date',
      key: 'dueDate',
      render: (_, record) => {
        const daysUntilDue = moment(record.dueDate).diff(moment(), 'days');
        const isOverdue = daysUntilDue < 0;
        const isUrgent = daysUntilDue <= 1 && daysUntilDue >= 0;
        
        return (
          <div>
            <CalendarOutlined /> {moment(record.dueDate).format('MMM DD')}
            <br />
            <Text 
              type={isOverdue ? "danger" : isUrgent ? "warning" : "secondary"}
              style={{ fontSize: '11px' }}
            >
              {isOverdue ? `${Math.abs(daysUntilDue)} days overdue` : 
               isUrgent ? `${daysUntilDue} day${daysUntilDue !== 1 ? 's' : ''} left` : 
               `${daysUntilDue} days left`}
            </Text>
            {(isOverdue || isUrgent) && (
              <ExclamationCircleOutlined style={{ color: '#ff4d4f', marginLeft: '4px' }} />
            )}
          </div>
        );
      },
      width: 120
    },
    {
      title: 'Sourcing Status',
      key: 'sourcing',
      render: (_, record) => (
        <div>
          <Text style={{ fontSize: '12px' }}>
            Suppliers: {record.suppliersContacted}
          </Text>
          <br />
          <Text style={{ fontSize: '12px' }}>
            Quotes: {record.quotesReceived}/{record.suppliersContacted}
          </Text>
        </div>
      ),
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
              icon={<EyeOutlined />}
              onClick={() => handleViewDetails(record)}
            />
          </Tooltip>
          {record.status === 'pending_start' && (
            <Tooltip title="Start Task">
              <Button 
                size="small" 
                type="primary"
                icon={<PlayCircleOutlined />}
                onClick={() => handleStartTask(record)}
              />
            </Tooltip>
          )}
          {record.status === 'in_progress' && (
            <Tooltip title="Manage Task">
              <Button 
                size="small" 
                type="primary"
                ghost
                icon={<EditOutlined />}
                onClick={() => handleStartTask(record)}
              />
            </Tooltip>
          )}
        </Space>
      ),
      width: 100,
      fixed: 'right'
    }
  ];

  const stats = {
    total: tasks.length,
    pending: tasks.filter(t => t.status === 'pending_start').length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
    evaluation: tasks.filter(t => t.status === 'quote_evaluation').length,
    overdue: tasks.filter(t => moment(t.dueDate).isBefore(moment(), 'day')).length
  };

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <Title level={2} style={{ margin: 0 }}>
            <SolutionOutlined /> Procurement Task Management
          </Title>
          <Space>
            <Button type="primary" icon={<FileTextOutlined />}>
              Generate Report
            </Button>
          </Space>
        </div>

        {/* Statistics */}
        <Row gutter={16} style={{ marginBottom: '24px' }}>
          <Col span={6}>
            <Statistic
              title="Total Tasks"
              value={stats.total}
              prefix={<SolutionOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="Pending Start"
              value={stats.pending}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="In Progress"
              value={stats.inProgress}
              prefix={<ShoppingCartOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="Quote Evaluation"
              value={stats.evaluation}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Col>
        </Row>

        {/* Alert for overdue tasks */}
        {stats.overdue > 0 && (
          <Alert
            message={`${stats.overdue} Task${stats.overdue !== 1 ? 's' : ''} Overdue`}
            description="You have procurement tasks that have passed their due dates. Immediate attention required."
            type="error"
            showIcon
            action={
              <Button 
                size="small" 
                danger 
                onClick={() => setActiveTab('urgent')}
              >
                View Urgent
              </Button>
            }
            style={{ marginBottom: '24px' }}
          />
        )}

        {/* Tabs */}
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <Tabs.TabPane 
            tab={
              <Badge count={stats.total} size="small">
                <span>All Tasks ({stats.total})</span>
              </Badge>
            } 
            key="all"
          />
          <Tabs.TabPane 
            tab={
              <Badge count={stats.pending} size="small">
                <span><ClockCircleOutlined /> Pending ({stats.pending})</span>
              </Badge>
            } 
            key="pending"
          />
          <Tabs.TabPane 
            tab={
              <Badge count={stats.inProgress} size="small">
                <span><ShoppingCartOutlined /> In Progress ({stats.inProgress})</span>
              </Badge>
            } 
            key="in_progress"
          />
          <Tabs.TabPane 
            tab={
              <Badge count={stats.evaluation} size="small">
                <span><FileTextOutlined /> Evaluation ({stats.evaluation})</span>
              </Badge>
            } 
            key="evaluation"
          />
          <Tabs.TabPane 
            tab={
              <Badge count={stats.overdue} size="small">
                <span><ExclamationCircleOutlined /> Urgent ({stats.overdue})</span>
              </Badge>
            } 
            key="urgent"
          />
        </Tabs>

        <Table
          columns={columns}
          dataSource={getFilteredTasks()}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} tasks`
          }}
          scroll={{ x: 'max-content' }}
        />
      </Card>

      {/* Task Detail Modal */}
      <Modal
        title={
          <Space>
            <SolutionOutlined />
            Task Details - {selectedTask?.title}
          </Space>
        }
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        width={800}
        footer={null}
      >
        {selectedTask && (
          <div>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Card size="small" title="Task Information">
                  <p><strong>ID:</strong> {selectedTask.id}</p>
                  <p><strong>Requisition:</strong> {selectedTask.requisitionId}</p>
                  <p><strong>Department:</strong> {selectedTask.department}</p>
                  <p><strong>Requester:</strong> {selectedTask.requester}</p>
                  <p><strong>Assigned:</strong> {moment(selectedTask.assignedDate).format('MMM DD, YYYY')}</p>
                  <p><strong>Due:</strong> {moment(selectedTask.dueDate).format('MMM DD, YYYY')}</p>
                  <p><strong>Priority:</strong> {getPriorityTag(selectedTask.priority)}</p>
                  <p><strong>Status:</strong> {getStatusTag(selectedTask.status)}</p>
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small" title="Progress Overview">
                  <Steps 
                    current={selectedTask.currentStep} 
                    direction="vertical" 
                    size="small"
                  >
                    {procurementSteps.map((step, index) => (
                      <Step key={index} title={step} />
                    ))}
                  </Steps>
                </Card>
              </Col>
            </Row>

            <Row gutter={[16, 16]} style={{ marginTop: '16px' }}>
              <Col span={24}>
                <Card size="small" title="Description">
                  <p>{selectedTask.description}</p>
                </Card>
              </Col>
            </Row>

            <Row gutter={[16, 16]} style={{ marginTop: '16px' }}>
              <Col span={12}>
                <Card size="small" title="Sourcing Status">
                  <Statistic
                    title="Suppliers Contacted"
                    value={selectedTask.suppliersContacted}
                    prefix={<TeamOutlined />}
                  />
                  <Statistic
                    title="Quotes Received"
                    value={selectedTask.quotesReceived}
                    prefix={<FileTextOutlined />}
                  />
                  <Statistic
                    title="Estimated Savings"
                    value={selectedTask.estimatedSavings}
                    prefix={<DollarOutlined />}
                    formatter={(value) => `XAF ${value?.toLocaleString()}`}
                  />
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small" title="Recent Activity">
                  <Timeline size="small">
                    {selectedTask.activities.map((activity, index) => (
                      <Timeline.Item key={index}>
                        <Text strong>{activity.description}</Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          {moment(activity.timestamp).fromNow()}
                        </Text>
                      </Timeline.Item>
                    ))}
                  </Timeline>
                </Card>
              </Col>
            </Row>
          </div>
        )}
      </Modal>

      {/* Action Modal */}
      <Modal
        title="Task Action"
        open={actionModalVisible}
        onOk={handleSubmitAction}
        onCancel={() => setActionModalVisible(false)}
        confirmLoading={loading}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="action"
            label="Action"
            rules={[{ required: true, message: 'Please select an action' }]}
          >
            <Select placeholder="Select action">
              <Option value="start_sourcing">Start Sourcing Process</Option>
              <Option value="update_progress">Update Progress</Option>
              <Option value="request_extension">Request Deadline Extension</Option>
              <Option value="escalate">Escalate Issue</Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            name="expectedCompletion"
            label="Expected Completion"
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="notes"
            label="Notes"
            rules={[{ required: true, message: 'Please add notes' }]}
          >
            <TextArea rows={4} placeholder="Add notes about the action..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default BuyerProcurementTasks;