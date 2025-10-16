import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  Progress,
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
  Avatar,
  Slider,
  InputNumber
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ProjectOutlined,
  UserOutlined,
  ReloadOutlined,
  FlagOutlined
} from '@ant-design/icons';
import moment from 'moment';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const { TabPane } = Tabs;

const ActionItemsManagement = () => {
  const [actionItems, setActionItems] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [activeTab, setActiveTab] = useState('my-tasks');
  const [selectedProject, setSelectedProject] = useState(null);
  const [stats, setStats] = useState({
    total: 15,
    notStarted: 3,
    inProgress: 6,
    completed: 4,
    onHold: 1,
    overdue: 2
  });
  const [form] = Form.useForm();

  // Mock user - replace with actual Redux selector
  const user = { _id: 'user1', fullName: 'John Doe', role: 'employee', department: 'IT' };

  useEffect(() => {
    loadInitialData();
  }, [activeTab, selectedProject]);

  const loadInitialData = () => {
    // Mock data
    setActionItems([
      {
        _id: '1',
        title: 'Subscribe to Odoo for the finance team',
        description: 'Set up Odoo subscription and configure finance module',
        priority: 'HIGH',
        status: 'Completed',
        progress: 100,
        dueDate: '2025-12-09',
        assignedTo: { _id: 'user1', fullName: 'John Doe' },
        project: { _id: 'proj1', name: 'September Grato Engineering' },
        notes: '',
        createdAt: '2025-09-01'
      },
      {
        _id: '2',
        title: 'Download and setup a new office suit for the receptionist',
        description: 'Install Microsoft Office and configure email',
        priority: 'HIGH',
        status: 'In Progress',
        progress: 50,
        dueDate: '2025-12-09',
        assignedTo: { _id: 'user2', fullName: 'Jane Smith' },
        project: { _id: 'proj1', name: 'September Grato Engineering' },
        notes: 'Poor Network',
        createdAt: '2025-09-02'
      },
      {
        _id: '3',
        title: 'Troubleshoot and resolve issues on 2 technicians computers',
        description: 'Fix software and hardware issues',
        priority: 'HIGH',
        status: 'In Progress',
        progress: 75,
        dueDate: '2025-12-09',
        assignedTo: { _id: 'user1', fullName: 'John Doe' },
        project: { _id: 'proj1', name: 'September Grato Engineering' },
        notes: '',
        createdAt: '2025-09-03'
      },
      {
        _id: '4',
        title: 'Setup network infrastructure',
        description: 'Configure routers and switches',
        priority: 'MEDIUM',
        status: 'Not Started',
        progress: 0,
        dueDate: '2025-12-15',
        assignedTo: { _id: 'user1', fullName: 'John Doe' },
        project: null,
        notes: 'Standalone task',
        createdAt: '2025-09-04'
      }
    ]);

    setProjects([
      { _id: 'proj1', name: 'September Grato Engineering 2025', code: 'WEEK-1' },
      { _id: 'proj2', name: 'October IT Infrastructure', code: 'WEEK-2' }
    ]);
  };

  const handleSaveTask = (values) => {
    const newTask = {
      _id: editingItem?._id || `task-${Date.now()}`,
      title: values.title,
      description: values.description,
      priority: values.priority,
      status: editingItem?.status || 'Not Started',
      progress: editingItem?.progress || 0,
      dueDate: values.dueDate?.format('YYYY-MM-DD'),
      assignedTo: { _id: user._id, fullName: user.fullName },
      project: values.projectId ? projects.find(p => p._id === values.projectId) : null,
      notes: values.notes || '',
      createdAt: editingItem?.createdAt || new Date().toISOString()
    };

    if (editingItem) {
      setActionItems(prev => prev.map(item => 
        item._id === editingItem._id ? { ...item, ...newTask } : item
      ));
      message.success('Task updated successfully');
    } else {
      setActionItems(prev => [...prev, newTask]);
      message.success('Task created successfully');
    }

    setModalVisible(false);
    form.resetFields();
    setEditingItem(null);
  };

  const handleUpdateProgress = (taskId, progress) => {
    setActionItems(prev => prev.map(item => {
      if (item._id === taskId) {
        const newStatus = progress === 100 ? 'Completed' : 
                         progress > 0 ? 'In Progress' : 'Not Started';
        return { ...item, progress, status: newStatus };
      }
      return item;
    }));
    message.success('Progress updated');
  };

  const handleUpdateStatus = (taskId, status) => {
    setActionItems(prev => prev.map(item => 
      item._id === taskId ? { ...item, status } : item
    ));
    message.success('Status updated');
  };

  const handleDelete = (taskId) => {
    Modal.confirm({
      title: 'Delete Task',
      content: 'Are you sure you want to delete this task?',
      okText: 'Delete',
      okType: 'danger',
      onOk: () => {
        setActionItems(prev => prev.filter(item => item._id !== taskId));
        message.success('Task deleted successfully');
      }
    });
  };

  const openModal = (item = null) => {
    setEditingItem(item);
    if (item) {
      form.setFieldsValue({
        title: item.title,
        description: item.description,
        priority: item.priority,
        dueDate: item.dueDate ? moment(item.dueDate) : null,
        projectId: item.project?._id,
        notes: item.notes
      });
    } else {
      form.resetFields();
    }
    setModalVisible(true);
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
      'Completed': 'success',
      'On Hold': 'warning'
    };
    return colors[status] || 'default';
  };

  const isOverdue = (dueDate, status) => {
    if (status === 'Completed') return false;
    return moment(dueDate).isBefore(moment(), 'day');
  };

  const getFilteredItems = () => {
    let filtered = actionItems;

    if (activeTab === 'my-tasks') {
      filtered = filtered.filter(item => item.assignedTo?._id === user._id);
    } else if (activeTab === 'project-tasks' && selectedProject) {
      filtered = filtered.filter(item => item.project?._id === selectedProject);
    } else if (activeTab === 'standalone-tasks') {
      filtered = filtered.filter(item => !item.project);
    }

    return filtered;
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
            {record.description}
          </Text>
          {record.project && (
            <>
              <br />
              <Tag size="small" color="blue" icon={<ProjectOutlined />}>
                {record.project.name}
              </Tag>
            </>
          )}
        </div>
      ),
      width: 300
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority) => (
        <Tag color={getPriorityColor(priority)} icon={<FlagOutlined />}>
          {priority}
        </Tag>
      ),
      width: 100
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status, record) => (
        <Select
          value={status}
          size="small"
          style={{ width: 120 }}
          onChange={(value) => handleUpdateStatus(record._id, value)}
        >
          <Option value="Not Started">Not Started</Option>
          <Option value="In Progress">In Progress</Option>
          <Option value="Completed">Completed</Option>
          <Option value="On Hold">On Hold</Option>
        </Select>
      ),
      width: 140
    },
    {
      title: 'Progress',
      key: 'progress',
      render: (_, record) => (
        <div style={{ width: 150 }}>
          <Progress 
            percent={record.progress || 0} 
            size="small"
            status={record.progress === 100 ? 'success' : 'active'}
          />
          <Slider
            value={record.progress || 0}
            onChange={(value) => handleUpdateProgress(record._id, value)}
            marks={{ 0: '0%', 50: '50%', 100: '100%' }}
            tipFormatter={value => `${value}%`}
            style={{ marginTop: 8 }}
          />
        </div>
      ),
      width: 180
    },
    {
      title: 'Due Date',
      key: 'dueDate',
      render: (_, record) => {
        const overdue = isOverdue(record.dueDate, record.status);
        return (
          <div>
            <Text type={overdue ? 'danger' : 'secondary'}>
              {moment(record.dueDate).format('MMM DD, YYYY')}
            </Text>
            {overdue && (
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
      title: 'Assigned To',
      key: 'assignedTo',
      render: (_, record) => (
        <Space>
          <Avatar size="small" icon={<UserOutlined />} />
          <Text>{record.assignedTo?.fullName || 'Unassigned'}</Text>
        </Space>
      ),
      width: 150
    },
    {
      title: 'Notes',
      dataIndex: 'notes',
      key: 'notes',
      render: (notes) => (
        <Tooltip title={notes}>
          <Text type="secondary" ellipsis style={{ maxWidth: 100, display: 'block' }}>
            {notes || '-'}
          </Text>
        </Tooltip>
      ),
      width: 120
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="small">
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
        </Space>
      ),
      width: 100,
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
            <CheckCircleOutlined /> Action Items Management
          </Title>
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={loadInitialData}
            >
              Refresh
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => openModal()}
            >
              New Task
            </Button>
          </Space>
        </div>

        <Card size="small" style={{ marginBottom: '24px', backgroundColor: '#f0f8ff' }}>
          <Row gutter={16}>
            <Col span={4}>
              <Statistic
                title="Total Tasks"
                value={stats.total}
                prefix={<CheckCircleOutlined />}
              />
            </Col>
            <Col span={4}>
              <Statistic
                title="Not Started"
                value={stats.notStarted}
                valueStyle={{ color: '#8c8c8c' }}
              />
            </Col>
            <Col span={4}>
              <Statistic
                title="In Progress"
                value={stats.inProgress}
                valueStyle={{ color: '#1890ff' }}
              />
            </Col>
            <Col span={4}>
              <Statistic
                title="Completed"
                value={stats.completed}
                valueStyle={{ color: '#52c41a' }}
              />
            </Col>
            <Col span={4}>
              <Statistic
                title="On Hold"
                value={stats.onHold}
                valueStyle={{ color: '#faad14' }}
              />
            </Col>
            <Col span={4}>
              <Statistic
                title="Overdue"
                value={stats.overdue}
                valueStyle={{ color: '#f5222d' }}
              />
            </Col>
          </Row>
        </Card>

        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab}
          style={{ marginBottom: '16px' }}
        >
          <TabPane 
            tab={
              <Badge count={stats.inProgress} size="small">
                <span>My Tasks</span>
              </Badge>
            } 
            key="my-tasks"
          />
          {['supply_chain', 'admin', 'supervisor'].includes(user.role) && (
            <TabPane 
              tab="Team Tasks" 
              key="team-tasks"
            />
          )}
          <TabPane 
            tab="Project Tasks" 
            key="project-tasks"
          />
          <TabPane 
            tab="Standalone Tasks" 
            key="standalone-tasks"
          />
        </Tabs>

        {activeTab === 'project-tasks' && (
          <div style={{ marginBottom: '16px' }}>
            <Select
              placeholder="Select a project"
              style={{ width: 300 }}
              onChange={setSelectedProject}
              value={selectedProject}
              allowClear
            >
              {projects.map(project => (
                <Option key={project._id} value={project._id}>
                  {project.name}
                </Option>
              ))}
            </Select>
          </div>
        )}

        <Table
          columns={columns}
          dataSource={getFilteredItems()}
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

      <Modal
        title={
          <Space>
            {editingItem ? <EditOutlined /> : <PlusOutlined />}
            {editingItem ? 'Edit Task' : 'Create New Task'}
          </Space>
        }
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditingItem(null);
          form.resetFields();
        }}
        footer={null}
        width={700}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSaveTask}
        >
          <Form.Item
            name="title"
            label="Task Title"
            rules={[{ required: true, message: 'Please enter task title' }]}
          >
            <Input placeholder="e.g., Setup new workstation" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true, message: 'Please enter description' }]}
          >
            <TextArea rows={3} placeholder="Detailed task description" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
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
            <Col span={12}>
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
            name="projectId"
            label="Associated Project (Optional)"
          >
            <Select placeholder="Select project (optional)" allowClear>
              {projects.map(project => (
                <Option key={project._id} value={project._id}>
                  {project.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="notes"
            label="Notes"
          >
            <TextArea rows={2} placeholder="Additional notes or comments" />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button onClick={() => {
                setModalVisible(false);
                setEditingItem(null);
                form.resetFields();
              }}>
                Cancel
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
              >
                {editingItem ? 'Update Task' : 'Create Task'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ActionItemsManagement;



