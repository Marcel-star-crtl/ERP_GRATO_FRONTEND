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
  Upload,
  Spin,
  Alert
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
  FlagOutlined,
  FileOutlined,
  UploadOutlined
} from '@ant-design/icons';
import { actionItemAPI } from '../../services/actionItemAPI';
import { useSelector } from 'react-redux';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const { TabPane } = Tabs;

const ActionItemsManagement = () => {
  const { user } = useSelector((state) => state.auth);
  const [actionItems, setActionItems] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [submitCompletionModalVisible, setSubmitCompletionModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [selectedTaskForCompletion, setSelectedTaskForCompletion] = useState(null);
  const [activeTab, setActiveTab] = useState('my-tasks');
  const [selectedProject, setSelectedProject] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    notStarted: 0,
    inProgress: 0,
    completed: 0,
    onHold: 0,
    overdue: 0
  });
  const [form] = Form.useForm();
  const [completionForm] = Form.useForm();
  const [uploadingFiles, setUploadingFiles] = useState([]);
  const [submittingCompletion, setSubmittingCompletion] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, [activeTab, selectedProject]);

  const loadInitialData = async () => {
    await fetchActionItems();
    await fetchStats();
    await fetchProjects();
  };

  const fetchActionItems = async () => {
    try {
      setLoading(true);
      const filters = { view: activeTab };
      
      if (activeTab === 'project-tasks' && selectedProject) {
        filters.projectId = selectedProject;
      }

      const result = await actionItemAPI.getActionItems(filters);
      
      if (result.success) {
        setActionItems(result.data);
      } else {
        message.error(result.message);
      }
    } catch (error) {
      console.error('Error fetching action items:', error);
      message.error('Failed to load action items');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const result = await actionItemAPI.getActionItemStats();
      
      if (result.success) {
        setStats(result.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchProjects = async () => {
    try {
      // Fetch projects from your API endpoint
      // This assumes you have an endpoint to get all projects
      // Adjust based on your actual API
      const result = await actionItemAPI.getActionItems({ view: 'project-tasks' });
      if (result.success && result.data) {
        const uniqueProjects = [...new Map(
          result.data
            .filter(item => item.projectId)
            .map(item => [item.projectId._id, item.projectId])
        ).values()];
        setProjects(uniqueProjects);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const handleSaveTask = async (values) => {
    try {
      setLoading(true);
      const taskData = {
        title: values.title,
        description: values.description,
        priority: values.priority,
        dueDate: values.dueDate.format('YYYY-MM-DD'),
        projectId: values.projectId || null,
        notes: values.notes || ''
      };

      let result;
      if (editingItem) {
        result = await actionItemAPI.updateActionItem(editingItem._id, taskData);
        if (result.success) {
          message.success('Task updated successfully');
        }
      } else {
        result = await actionItemAPI.createActionItem(taskData);
        if (result.success) {
          message.success('Task created successfully and sent for supervisor approval');
        }
      }

      if (result.success) {
        setModalVisible(false);
        form.resetFields();
        setEditingItem(null);
        await fetchActionItems();
      } else {
        message.error(result.message);
      }
    } catch (error) {
      console.error('Error saving task:', error);
      message.error('Failed to save task');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProgress = async (taskId, progress) => {
    try {
      const result = await actionItemAPI.updateProgress(taskId, progress);
      
      if (result.success) {
        message.success('Progress updated');
        await fetchActionItems();
        await fetchStats();
      } else {
        message.error(result.message);
      }
    } catch (error) {
      console.error('Error updating progress:', error);
      message.error('Failed to update progress');
    }
  };

  const handleUpdateStatus = async (taskId, status) => {
    try {
      const result = await actionItemAPI.updateStatus(taskId, status);
      
      if (result.success) {
        message.success('Status updated');
        await fetchActionItems();
        await fetchStats();
      } else {
        message.error(result.message);
      }
    } catch (error) {
      console.error('Error updating status:', error);
      message.error('Failed to update status');
    }
  };

  const handleSubmitForCompletion = async (values) => {
    try {
      setSubmittingCompletion(true);
      
      const formData = new FormData();
      formData.append('completionNotes', values.completionNotes || '');
      
      // Append all uploaded files
      uploadingFiles.forEach(file => {
        if (file.originFileObj) {
          formData.append('documents', file.originFileObj);
        }
      });

      const result = await actionItemAPI.submitForCompletion(
        selectedTaskForCompletion._id,
        formData
      );

      if (result.success) {
        message.success('Task submitted for supervisor completion approval');
        setSubmitCompletionModalVisible(false);
        setUploadingFiles([]);
        completionForm.resetFields();
        setSelectedTaskForCompletion(null);
        await fetchActionItems();
        await fetchStats();
      } else {
        message.error(result.message);
      }
    } catch (error) {
      console.error('Error submitting for completion:', error);
      message.error('Failed to submit task for completion');
    } finally {
      setSubmittingCompletion(false);
    }
  };

  const handleDelete = (taskId) => {
    Modal.confirm({
      title: 'Delete Task',
      content: 'Are you sure you want to delete this task?',
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          const result = await actionItemAPI.deleteActionItem(taskId);
          
          if (result.success) {
            message.success('Task deleted successfully');
            await fetchActionItems();
            await fetchStats();
          } else {
            message.error(result.message);
          }
        } catch (error) {
          console.error('Error deleting task:', error);
          message.error('Failed to delete task');
        }
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
        dueDate: dayjs(item.dueDate),
        projectId: item.projectId?._id || undefined,
        notes: item.notes
      });
    } else {
      form.resetFields();
    }
    setModalVisible(true);
  };

  const openSubmitCompletionModal = (task) => {
    setSelectedTaskForCompletion(task);
    completionForm.resetFields();
    setUploadingFiles([]);
    setSubmitCompletionModalVisible(true);
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

  const isOverdue = (dueDate, status) => {
    if (status === 'Completed') return false;
    return dayjs(dueDate).isBefore(dayjs(), 'day');
  };

  const getFilteredItems = () => {
    let filtered = actionItems;

    if (activeTab === 'project-tasks' && selectedProject) {
      filtered = filtered.filter(item => item.projectId?._id === selectedProject);
    } else if (activeTab === 'standalone-tasks') {
      filtered = filtered.filter(item => !item.projectId);
    }

    return filtered;
  };

  const canSubmitForCompletion = (task) => {
    return task.status === 'In Progress' || 
           (task.status === 'Pending Completion Approval' && task.completionApproval?.status === 'rejected');
  };

  const uploadProps = {
    fileList: uploadingFiles,
    onChange: (info) => {
      setUploadingFiles(info.fileList);
    },
    onRemove: (file) => {
      setUploadingFiles(uploadingFiles.filter(f => f.uid !== file.uid));
    },
    beforeUpload: () => false // Prevent automatic upload
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
          {record.projectId && (
            <>
              <br />
              <Tag size="small" color="blue" icon={<ProjectOutlined />}>
                {record.projectId.name}
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
        <Tag color={getStatusColor(status)}>
          {status}
        </Tag>
      ),
      width: 150
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
            disabled={record.status === 'Pending Approval' || record.status === 'Completed' || record.status === 'Rejected'}
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
              {dayjs(record.dueDate).format('MMM DD, YYYY')}
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
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="small" wrap>
          {record.status === 'Pending Approval' && (
            <Tooltip title="Awaiting supervisor approval">
              <Button size="small" type="dashed" disabled>
                Pending
              </Button>
            </Tooltip>
          )}
          {canSubmitForCompletion(record) && (
            <Tooltip title="Submit task for completion approval">
              <Button
                size="small"
                type="primary"
                icon={<FileOutlined />}
                onClick={() => openSubmitCompletionModal(record)}
              >
                Submit
              </Button>
            </Tooltip>
          )}
          {record.status !== 'Completed' && record.status !== 'Rejected' && record.status !== 'Pending Approval' && (
            <Tooltip title="Edit">
              <Button
                size="small"
                icon={<EditOutlined />}
                onClick={() => openModal(record)}
              />
            </Tooltip>
          )}
          {['Not Started', 'In Progress'].includes(record.status) && (
            <Tooltip title="Delete">
              <Button
                size="small"
                danger
                icon={<DeleteOutlined />}
                onClick={() => handleDelete(record._id)}
              />
            </Tooltip>
          )}
        </Space>
      ),
      width: 200,
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
              loading={loading}
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
            <Col xs={12} sm={8} md={4}>
              <Statistic
                title="Total Tasks"
                value={stats.total}
                prefix={<CheckCircleOutlined />}
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
            <Col xs={12} sm={8} md={4}>
              <Statistic
                title="On Hold"
                value={stats.onHold}
                valueStyle={{ color: '#faad14' }}
              />
            </Col>
            <Col xs={12} sm={8} md={4}>
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
          {['supply_chain', 'admin', 'supervisor'].includes(user?.role) && (
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

      {/* Create/Edit Task Modal */}
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

      {/* Submit for Completion Modal */}
      <Modal
        title={
          <Space>
            <FileOutlined />
            Submit Task for Completion Approval
          </Space>
        }
        open={submitCompletionModalVisible}
        onCancel={() => {
          setSubmitCompletionModalVisible(false);
          setSelectedTaskForCompletion(null);
          setUploadingFiles([]);
          completionForm.resetFields();
        }}
        footer={null}
        width={700}
      >
        {selectedTaskForCompletion && (
          <Form
            form={completionForm}
            layout="vertical"
            onFinish={handleSubmitForCompletion}
          >
            <Alert
              message="Submit for Approval"
              description="Upload completion documents and provide notes. Your supervisor will review and approve the completion."
              type="info"
              showIcon
              style={{ marginBottom: '16px' }}
            />

            <Form.Item label="Task" style={{ marginBottom: '16px' }}>
              <Text strong>{selectedTaskForCompletion.title}</Text>
            </Form.Item>

            <Form.Item
              name="completionNotes"
              label="Completion Notes"
            >
              <TextArea 
                rows={3} 
                placeholder="Describe what was completed, any challenges, and relevant details" 
              />
            </Form.Item>

            <Form.Item
              label="Completion Documents"
              required
            >
              <Upload
                {...uploadProps}
                multiple
                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.zip"
                style={{
                  border: '1px dashed #d9d9d9',
                  padding: '16px',
                  borderRadius: '4px',
                  textAlign: 'center'
                }}
              >
                <Button icon={<UploadOutlined />}>
                  Click to Upload Documents
                </Button>
                <p style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
                  Drag and drop files here or click to select
                </p>
              </Upload>
              <Text type="secondary" style={{ fontSize: '12px', marginTop: '8px', display: 'block' }}>
                {uploadingFiles.length} file(s) selected
              </Text>
            </Form.Item>

            <Form.Item>
              <Space>
                <Button onClick={() => {
                  setSubmitCompletionModalVisible(false);
                  setSelectedTaskForCompletion(null);
                  setUploadingFiles([]);
                  completionForm.resetFields();
                }}>
                  Cancel
                </Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={submittingCompletion}
                  disabled={uploadingFiles.length === 0}
                >
                  Submit for Approval
                </Button>
              </Space>
            </Form.Item>
          </Form>
        )}
      </Modal>
    </div>
  );
};

export default ActionItemsManagement;






