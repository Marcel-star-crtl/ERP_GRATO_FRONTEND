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
  InputNumber,
  Space,
  Typography,
  Row,
  Col,
  message,
  Tag,
  Tooltip,
  Progress,
  Statistic,
  Alert,
  Divider,
  Upload,
  Badge
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  FileTextOutlined,
  CalendarOutlined,
  DollarOutlined,
  ReloadOutlined,
  UploadOutlined,
  DownloadOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  ProjectOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { projectPlanAPI } from '../../services/api';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const EmployeeProjectPlans = () => {
  const [projectPlans, setProjectPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    draft: 0,
    submitted: 0,
    approved: 0,
    inProgress: 0
  });
  const [formData, setFormData] = useState({
    projectName: '',
    week: '',
    description: '',
    department: '',
    responsible: '',
    objectives: '',
    priorityLevel: 'MEDIUM',
    startDate: null,
    deadline: null,
    amountNeeded: 0,
    projectProgress: 0,
    status: 'Draft',
    issuesAndConcerns: ''
  });
  const [attachments, setAttachments] = useState([]);
  const [completionItems, setCompletionItems] = useState([]);
  const [newItemDescription, setNewItemDescription] = useState('');

  // Get user info from localStorage
  const userInfo = JSON.parse(localStorage.getItem('user') || '{}');
  const userName = userInfo.fullName || userInfo.name || 'User';
  const userDepartment = userInfo.department || 'General';

  useEffect(() => {
    loadProjectPlans();
    loadStats();
  }, []);

  const loadProjectPlans = async () => {
    try {
      setLoading(true);
      const result = await projectPlanAPI.getMyPlans();
      
      if (result.success) {
        setProjectPlans(result.data || []);
      } else {
        message.error('Failed to load project plans');
      }
    } catch (error) {
      console.error('Error loading project plans:', error);
      message.error('Failed to load project plans');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const result = await projectPlanAPI.getStats();
      if (result.success) {
        setStats(result.data);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      projectName: '',
      week: '',
      description: '',
      department: userDepartment,
      responsible: userName,
      objectives: '',
      priorityLevel: 'MEDIUM',
      startDate: null,
      deadline: null,
      amountNeeded: 0,
      projectProgress: 0,
      status: 'Draft',
      issuesAndConcerns: ''
    });
    setAttachments([]);
    setCompletionItems([]);
    setNewItemDescription('');
  };

  const openModal = (plan = null) => {
    if (plan) {
      setEditMode(true);
      setSelectedPlan(plan);
      setFormData({
        ...plan,
        startDate: dayjs(plan.startDate),
        deadline: dayjs(plan.deadline)
      });
    } else {
      setEditMode(false);
      setSelectedPlan(null);
      resetForm();
    }
    setModalVisible(true);
  };

  const openViewModal = (plan) => {
    setSelectedPlan(plan);
    setViewModalVisible(true);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    const required = ['projectName', 'week', 'description', 'department', 'responsible', 'objectives', 'priorityLevel', 'startDate', 'deadline', 'amountNeeded', 'status'];
    const missing = required.filter(field => !formData[field]);
    
    if (missing.length > 0) {
      message.error(`Please fill in: ${missing.join(', ')}`);
      return false;
    }
    
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);

      // Calculate estimated duration if both dates are provided
      let estimatedDuration = '';
      if (formData.startDate && formData.deadline) {
        const start = dayjs(formData.startDate);
        const end = dayjs(formData.deadline);
        const months = end.diff(start, 'month', true);
        estimatedDuration = `${Math.round(months)} month${Math.round(months) !== 1 ? 's' : ''}`;
      }

      const planData = {
        ...formData,
        startDate: formData.startDate.format('YYYY-MM-DD'),
        deadline: formData.deadline.format('YYYY-MM-DD'),
        estimatedDuration,
        completionItems: completionItems
      };

      let result;
      if (editMode && selectedPlan) {
        result = await projectPlanAPI.updatePlan(selectedPlan._id, planData);
      } else {
        result = await projectPlanAPI.createPlan(planData);
      }

      if (result.success) {
        message.success(result.message);
        setModalVisible(false);
        resetForm();
        await loadProjectPlans();
        await loadStats();
      } else {
        message.error(result.message || 'Failed to save project plan');
      }
    } catch (error) {
      console.error('Error saving project plan:', error);
      message.error('Failed to save project plan');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitForApproval = async (planId) => {
    Modal.confirm({
      title: 'Submit Project Plan for Approval?',
      content: (
        <div>
          <p>This project plan will be submitted to:</p>
          <ol style={{ marginTop: '12px' }}>
            <li><strong>Project Coordinator</strong> (Ms. Christabel Mangwi)</li>
            <li><strong>Supply Chain Coordinator</strong> (Mr. Lukong Lambert)</li>
            <li><strong>Head of Business</strong> (Mr. E.T Kelvin)</li>
          </ol>
          <p style={{ marginTop: '12px' }}>You will not be able to edit it once submitted.</p>
        </div>
      ),
      okText: 'Submit',
      okType: 'primary',
      onOk: async () => {
        try {
          setLoading(true);
          const result = await projectPlanAPI.submitForApproval(planId);
          
          if (result.success) {
            message.success({
              content: 'Project plan submitted successfully! It will now be reviewed by the Project Coordinator.',
              duration: 5
            });
            await loadProjectPlans();
            await loadStats();
          } else {
            message.error(result.message || 'Failed to submit project plan');
          }
        } catch (error) {
          console.error('Error submitting project plan:', error);
          message.error('Failed to submit project plan');
        } finally {
          setLoading(false);
        }
      }
    });
  };

  const handleAddCompletionItem = () => {
    if (!newItemDescription.trim()) {
      message.warning('Please enter item description');
      return;
    }

    const newItem = {
      _id: Date.now().toString(), // Temporary ID for new items
      description: newItemDescription,
      isCompleted: false,
      completedBy: null,
      completedDate: null,
      notes: ''
    };

    setCompletionItems([...completionItems, newItem]);
    setNewItemDescription('');
    message.success('Item added');
  };

  const handleRemoveCompletionItem = (itemId) => {
    setCompletionItems(completionItems.filter(item => item._id !== itemId));
    message.success('Item removed');
  };

  const handleDelete = (planId) => {
    Modal.confirm({
      title: 'Delete Project Plan',
      content: 'Are you sure you want to delete this project plan? This action cannot be undone.',
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          const result = await projectPlanAPI.deletePlan(planId);
          
          if (result.success) {
            message.success('Project plan deleted successfully');
            await loadProjectPlans();
            await loadStats();
          } else {
            message.error('Failed to delete project plan');
          }
        } catch (error) {
          console.error('Error deleting project plan:', error);
          message.error('Failed to delete project plan');
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

  const getStatusColor = (status) => {
    const colors = {
      'Draft': 'default',
      'Submitted': 'processing',
      'Pending Project Coordinator Approval': 'processing',
      'Pending Supply Chain Coordinator Approval': 'warning',
      'Pending Head of Business Approval': 'warning',
      'Approved': 'success',
      'In Progress': 'processing',
      'Completed': 'success',
      'On Hold': 'warning',
      'Cancelled': 'error',
      'Rejected': 'error'
    };
    return colors[status] || 'default';
  };

  const uploadProps = {
    fileList: attachments,
    onChange: (info) => setAttachments(info.fileList),
    beforeUpload: () => false,
    multiple: true
  };

  const columns = [
    {
      title: 'Project Name',
      dataIndex: 'projectName',
      key: 'projectName',
      width: 200,
      fixed: 'left',
      render: (text, record) => (
        <div>
          <Text strong>{text}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.week}
          </Text>
        </div>
      )
    },
    {
      title: 'Department',
      dataIndex: 'department',
      key: 'department',
      width: 120,
      render: (text) => <Tag color="blue">{text}</Tag>
    },
    {
      title: 'Responsible',
      dataIndex: 'responsible',
      key: 'responsible',
      width: 150
    },
    {
      title: 'Priority',
      dataIndex: 'priorityLevel',
      key: 'priorityLevel',
      width: 100,
      render: (priority) => (
        <Tag color={getPriorityColor(priority)}>{priority}</Tag>
      )
    },
    {
      title: 'Timeline',
      key: 'timeline',
      width: 200,
      render: (_, record) => (
        <div>
          <Space size="small">
            <CalendarOutlined />
            <Text style={{ fontSize: '12px' }}>
              {dayjs(record.startDate).format('MMM DD')} - {dayjs(record.deadline).format('MMM DD, YYYY')}
            </Text>
          </Space>
          <br />
          <Text type="secondary" style={{ fontSize: '11px' }}>
            Duration: {record.estimatedDuration}
          </Text>
        </div>
      )
    },
    {
      title: 'Budget',
      dataIndex: 'amountNeeded',
      key: 'amountNeeded',
      width: 120,
      render: (amount) => (
        <Text strong style={{ color: '#52c41a' }}>
          ${amount?.toLocaleString()}
        </Text>
      )
    },
    {
      title: 'Progress',
      dataIndex: 'projectProgress',
      key: 'projectProgress',
      width: 120,
      render: (progress) => (
        <Progress 
          percent={progress} 
          size="small" 
          status={progress === 100 ? 'success' : 'active'}
        />
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status) => (
        <Tag color={getStatusColor(status)}>{status}</Tag>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 200,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small" wrap>
          <Tooltip title="View Details">
            <Button
              size="small"
              icon={<EyeOutlined />}
              onClick={() => openViewModal(record)}
            />
          </Tooltip>
          {record.status === 'Draft' && (
            <>
              <Tooltip title="Submit for Approval">
                <Button
                  type="primary"
                  size="small"
                  icon={<CheckCircleOutlined />}
                  onClick={() => handleSubmitForApproval(record._id)}
                  style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
                >
                  Submit
                </Button>
              </Tooltip>
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
            </>
          )}
          {record.status === 'Rejected' && (
            <>
              <Tooltip title="Edit and Resubmit">
                <Button
                  size="small"
                  type="primary"
                  icon={<EditOutlined />}
                  onClick={() => openModal(record)}
                >
                  Edit
                </Button>
              </Tooltip>
            </>
          )}
          {['Pending Project Coordinator Approval', 'Pending Supply Chain Coordinator Approval', 'Pending Head of Business Approval'].includes(record.status) && (
            <Tag color="processing">Pending Approval</Tag>
          )}
        </Space>
      )
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
            <ProjectOutlined /> My Project Plans
          </Title>
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => {
                loadProjectPlans();
                loadStats();
              }}
              loading={loading}
            >
              Refresh
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => openModal()}
            >
              New Project Plan
            </Button>
          </Space>
        </div>

        {/* Statistics */}
        <Card size="small" style={{ marginBottom: '24px', backgroundColor: '#f0f8ff' }}>
          <Row gutter={16}>
            <Col xs={12} sm={8} md={4}>
              <Statistic
                title="Total Plans"
                value={stats.total}
                prefix={<FileTextOutlined />}
              />
            </Col>
            <Col xs={12} sm={8} md={4}>
              <Statistic
                title="Draft"
                value={stats.draft}
                valueStyle={{ color: '#8c8c8c' }}
              />
            </Col>
            <Col xs={12} sm={8} md={4}>
              <Statistic
                title="Submitted"
                value={stats.submitted}
                valueStyle={{ color: '#1890ff' }}
              />
            </Col>
            <Col xs={12} sm={8} md={4}>
              <Statistic
                title="Approved"
                value={stats.approved}
                valueStyle={{ color: '#52c41a' }}
              />
            </Col>
            <Col xs={12} sm={8} md={4}>
              <Statistic
                title="In Progress"
                value={stats.inProgress}
                valueStyle={{ color: '#faad14' }}
              />
            </Col>
          </Row>
        </Card>

        <Alert
          message="Project Plan Submission Guidelines"
          description="Submit detailed project plans including objectives, timelines, budgets, and expected outcomes. All submitted plans will be reviewed by your supervisor and relevant department heads."
          type="info"
          showIcon
          closable
          style={{ marginBottom: '16px' }}
        />

        <Table
          columns={columns}
          dataSource={projectPlans}
          loading={loading}
          rowKey="_id"
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `Total ${total} project plans`
          }}
          scroll={{ x: 1600 }}
          size="small"
        />
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        title={
          <Space>
            <ProjectOutlined />
            {editMode ? 'Edit Project Plan' : 'New Project Plan'}
          </Space>
        }
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          resetForm();
        }}
        onOk={handleSubmit}
        width={900}
        confirmLoading={loading}
        okText={editMode ? 'Update' : 'Submit'}
      >
        <Alert
          message="Required Information"
          description="Please provide complete and accurate information for your project plan. All fields are required."
          type="info"
          showIcon
          style={{ marginBottom: '16px' }}
        />

        <Row gutter={16} style={{ marginBottom: '16px' }}>
          <Col span={12}>
            <Text strong>Project Name <Text type="danger">*</Text></Text>
            <Input
              value={formData.projectName}
              onChange={(e) => handleInputChange('projectName', e.target.value)}
              placeholder="e.g., Network Infrastructure Upgrade"
              style={{ marginTop: '4px' }}
            />
          </Col>
          <Col span={12}>
            <Text strong>Week <Text type="danger">*</Text></Text>
            <Input
              value={formData.week}
              onChange={(e) => handleInputChange('week', e.target.value)}
              placeholder="e.g., Week 12"
              style={{ marginTop: '4px' }}
            />
          </Col>
        </Row>

        <div style={{ marginBottom: '16px' }}>
          <Text strong>Description <Text type="danger">*</Text></Text>
          <TextArea
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            rows={3}
            placeholder="Provide a detailed description of the project..."
            style={{ marginTop: '4px' }}
          />
        </div>

        <Row gutter={16} style={{ marginBottom: '16px' }}>
          <Col span={12}>
            <Text strong>Department <Text type="danger">*</Text></Text>
            <Select
              value={formData.department}
              onChange={(value) => handleInputChange('department', value)}
              placeholder="Select department"
              style={{ width: '100%', marginTop: '4px' }}
            >
              <Option value="IT">IT</Option>
              <Option value="Finance">Finance</Option>
              <Option value="HR">HR</Option>
              <Option value="Operations">Operations</Option>
              <Option value="Supply Chain">Supply Chain</Option>
              <Option value="Technical">Technical</Option>
              <Option value="HSE">HSE</Option>
            </Select>
          </Col>
          <Col span={12}>
            <Text strong>Responsible Person <Text type="danger">*</Text></Text>
            <Input
              value={formData.responsible}
              onChange={(e) => handleInputChange('responsible', e.target.value)}
              placeholder="Person responsible for execution"
              style={{ marginTop: '4px' }}
            />
          </Col>
        </Row>

        <div style={{ marginBottom: '16px' }}>
          <Text strong>Objectives <Text type="danger">*</Text></Text>
          <TextArea
            value={formData.objectives}
            onChange={(e) => handleInputChange('objectives', e.target.value)}
            rows={3}
            placeholder="What are the key objectives and expected outcomes?"
            style={{ marginTop: '4px' }}
          />
        </div>

        <Row gutter={16} style={{ marginBottom: '16px' }}>
          <Col span={8}>
            <Text strong>Priority Level <Text type="danger">*</Text></Text>
            <Select
              value={formData.priorityLevel}
              onChange={(value) => handleInputChange('priorityLevel', value)}
              style={{ width: '100%', marginTop: '4px' }}
            >
              <Option value="LOW">🟢 Low</Option>
              <Option value="MEDIUM">🟡 Medium</Option>
              <Option value="HIGH">🟠 High</Option>
              <Option value="CRITICAL">🔴 Critical</Option>
            </Select>
          </Col>
          <Col span={8}>
            <Text strong>Start Date <Text type="danger">*</Text></Text>
            <DatePicker
              value={formData.startDate}
              onChange={(date) => handleInputChange('startDate', date)}
              style={{ width: '100%', marginTop: '4px' }}
            />
          </Col>
          <Col span={8}>
            <Text strong>Deadline <Text type="danger">*</Text></Text>
            <DatePicker
              value={formData.deadline}
              onChange={(date) => handleInputChange('deadline', date)}
              style={{ width: '100%', marginTop: '4px' }}
            />
          </Col>
        </Row>

        <Row gutter={16} style={{ marginBottom: '16px' }}>
          <Col span={12}>
            <Text strong>Amount Needed (Budget) <Text type="danger">*</Text></Text>
            <InputNumber
              value={formData.amountNeeded}
              onChange={(value) => handleInputChange('amountNeeded', value)}
              style={{ width: '100%', marginTop: '4px' }}
              min={0}
              formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value.replace(/\$\s?|(,*)/g, '')}
              placeholder="Enter budget amount"
            />
          </Col>
          <Col span={12}>
            <Text strong>Project Progress (%) <Text type="danger">*</Text></Text>
            <InputNumber
              value={formData.projectProgress}
              onChange={(value) => handleInputChange('projectProgress', value)}
              style={{ width: '100%', marginTop: '4px' }}
              min={0}
              max={100}
              formatter={value => `${value}%`}
              parser={value => value.replace('%', '')}
            />
          </Col>
        </Row>

        <div style={{ marginBottom: '16px' }}>
          <Text strong>Status <Text type="danger">*</Text></Text>
          <Select
            value={formData.status}
            onChange={(value) => handleInputChange('status', value)}
            style={{ width: '100%', marginTop: '4px' }}
          >
            <Option value="Draft">Draft</Option>
            <Option value="Submitted">Submitted</Option>
            <Option value="Approved">Approved</Option>
            <Option value="In Progress">In Progress</Option>
            <Option value="On Hold">On Hold</Option>
            <Option value="Completed">Completed</Option>
          </Select>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <Text strong>Issues and Concerns</Text>
          <TextArea
            value={formData.issuesAndConcerns}
            onChange={(e) => handleInputChange('issuesAndConcerns', e.target.value)}
            rows={3}
            placeholder="List any challenges, risks, or concerns..."
            style={{ marginTop: '4px' }}
          />
        </div>

        {/* Completion Items Section */}
        <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
          <Text strong style={{ fontSize: '14px' }}>Completion Items</Text>
          <Text type="secondary" style={{ display: 'block', marginBottom: '12px', fontSize: '12px' }}>
            Add checklist items that need to be completed for this project
          </Text>

          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            <Input
              placeholder="Describe an item to be completed (e.g., 'Complete Site Audit')"
              value={newItemDescription}
              onChange={(e) => setNewItemDescription(e.target.value)}
              onPressEnter={handleAddCompletionItem}
            />
            <Button type="primary" onClick={handleAddCompletionItem} icon={<PlusOutlined />}>
              Add
            </Button>
          </div>

          {completionItems.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {completionItems.map((item) => (
                <div
                  key={item._id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 12px',
                    backgroundColor: '#fff',
                    border: '1px solid #d9d9d9',
                    borderRadius: '4px'
                  }}
                >
                  <Text>{item.description}</Text>
                  <Button
                    type="text"
                    danger
                    size="small"
                    icon={<DeleteOutlined />}
                    onClick={() => handleRemoveCompletionItem(item._id)}
                  />
                </div>
              ))}
            </div>
          ) : (
            <Text type="secondary" style={{ fontSize: '12px', fontStyle: 'italic' }}>
              No completion items added yet
            </Text>
          )}
        </div>

        <div>
          <Text strong>Attachments</Text>
          <Upload {...uploadProps} listType="picture-card" style={{ marginTop: '4px' }}>
            <div>
              <UploadOutlined />
              <div style={{ marginTop: 8 }}>Upload</div>
            </div>
          </Upload>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            Upload project documents, diagrams, budgets, etc.
          </Text>
        </div>
      </Modal>

      {/* View Details Modal */}
      <Modal
        title={<Space><EyeOutlined />Project Plan Details</Space>}
        open={viewModalVisible}
        onCancel={() => {
          setViewModalVisible(false);
          setSelectedPlan(null);
        }}
        footer={[
          <Button key="close" onClick={() => setViewModalVisible(false)}>
            Close
          </Button>,
          selectedPlan && ['Draft', 'Submitted'].includes(selectedPlan.status) && (
            <Button
              key="edit"
              type="primary"
              icon={<EditOutlined />}
              onClick={() => {
                setViewModalVisible(false);
                openModal(selectedPlan);
              }}
            >
              Edit
            </Button>
          )
        ]}
        width={800}
      >
        {selectedPlan && (
          <div>
            <Card size="small" style={{ marginBottom: '16px' }}>
              <Title level={4}>{selectedPlan.projectName}</Title>
              <Space size="small" wrap style={{ marginBottom: '12px' }}>
                <Tag color="blue">{selectedPlan.week}</Tag>
                <Tag color={getPriorityColor(selectedPlan.priorityLevel)}>
                  {selectedPlan.priorityLevel}
                </Tag>
                <Tag color={getStatusColor(selectedPlan.status)}>
                  {selectedPlan.status}
                </Tag>
              </Space>

              <Divider style={{ margin: '12px 0' }} />

              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Text type="secondary">Department:</Text>
                  <br />
                  <Text strong>{selectedPlan.department}</Text>
                </Col>
                <Col span={12}>
                  <Text type="secondary">Responsible:</Text>
                  <br />
                  <Text strong>{selectedPlan.responsible}</Text>
                </Col>
                <Col span={12}>
                  <Text type="secondary">Start Date:</Text>
                  <br />
                  <Text strong>{dayjs(selectedPlan.startDate).format('MMMM DD, YYYY')}</Text>
                </Col>
                <Col span={12}>
                  <Text type="secondary">Deadline:</Text>
                  <br />
                  <Text strong>{dayjs(selectedPlan.deadline).format('MMMM DD, YYYY')}</Text>
                </Col>
                <Col span={12}>
                  <Text type="secondary">Duration:</Text>
                  <br />
                  <Text strong>{selectedPlan.estimatedDuration}</Text>
                </Col>
                <Col span={12}>
                  <Text type="secondary">Budget:</Text>
                  <br />
                  <Text strong style={{ color: '#52c41a', fontSize: '16px' }}>
                    ${selectedPlan.amountNeeded?.toLocaleString()}
                  </Text>
                </Col>
              </Row>
            </Card>

            <Card size="small" title="Description" style={{ marginBottom: '16px' }}>
              <Text>{selectedPlan.description}</Text>
            </Card>

            <Card size="small" title="Objectives" style={{ marginBottom: '16px' }}>
              <Text>{selectedPlan.objectives}</Text>
            </Card>

            <Card size="small" title="Progress" style={{ marginBottom: '16px' }}>
              <Progress 
                percent={selectedPlan.projectProgress} 
                status={selectedPlan.projectProgress === 100 ? 'success' : 'active'}
              />
            </Card>

            {selectedPlan.completionItems && selectedPlan.completionItems.length > 0 && (
              <Card 
                size="small" 
                title={
                  <Space>
                    <CheckCircleOutlined style={{ color: '#52c41a' }} />
                    Completion Items
                  </Space>
                }
                style={{ marginBottom: '16px' }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {selectedPlan.completionItems.map((item) => (
                    <div
                      key={item._id}
                      style={{
                        padding: '8px 12px',
                        backgroundColor: item.isCompleted ? '#f6ffed' : '#fafafa',
                        border: '1px solid ' + (item.isCompleted ? '#b7eb8f' : '#d9d9d9'),
                        borderRadius: '4px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                          type="checkbox"
                          checked={item.isCompleted}
                          disabled
                          style={{ width: '18px', height: '18px' }}
                        />
                        <Text
                          style={{
                            textDecoration: item.isCompleted ? 'line-through' : 'none',
                            color: item.isCompleted ? '#999' : 'inherit'
                          }}
                        >
                          {item.description}
                        </Text>
                      </div>
                      {item.isCompleted && (
                        <div style={{ marginTop: '6px', paddingLeft: '26px', fontSize: '12px' }}>
                          <Text type="success">
                            ✓ Completed on {dayjs(item.completedDate).format('MMM DD, YYYY')}
                          </Text>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {selectedPlan.issuesAndConcerns && (
              <Card 
                size="small" 
                title={
                  <Space>
                    <ExclamationCircleOutlined style={{ color: '#faad14' }} />
                    Issues and Concerns
                  </Space>
                }
                style={{ marginBottom: '16px' }}
              >
                <Text>{selectedPlan.issuesAndConcerns}</Text>
              </Card>
            )}

            <Card size="small" style={{ backgroundColor: '#f5f5f5' }}>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                Created: {dayjs(selectedPlan.createdAt).format('MMMM DD, YYYY HH:mm')}
                <br />
                Last Updated: {dayjs(selectedPlan.updatedAt).format('MMMM DD, YYYY HH:mm')}
              </Text>
            </Card>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default EmployeeProjectPlans;