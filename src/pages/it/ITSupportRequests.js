import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Table, 
  Tag, 
  Space, 
  Typography, 
  Button, 
  Alert, 
  Spin, 
  Card,
  Badge,
  Tooltip,
  Modal,
  Select,
  DatePicker,
  Row,
  Col,
  Progress,
  Tabs,
  Statistic,
  Input,
  Form,
  message,
  Divider, 
  Checkbox
} from 'antd';
import { 
  LaptopOutlined, 
  CheckCircleOutlined, 
  CloseCircleOutlined, 
  ClockCircleOutlined,
  PlusOutlined,
  ToolOutlined,
  EyeOutlined,
  ReloadOutlined,
  ShoppingCartOutlined,
  BugOutlined,
  DesktopOutlined,
  PhoneOutlined,
  PrinterOutlined,
  WifiOutlined,
  WarningOutlined,
  UserOutlined,
  EditOutlined,
  MessageOutlined,
  SearchOutlined,
  FilterOutlined,
  ExportOutlined,
  QuestionCircleOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useSelector } from 'react-redux';
import { itSupportAPI } from '../../services/api'; 

dayjs.extend(relativeTime);

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { TabPane } = Tabs;
const { TextArea } = Input;

const ITSupportRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [updateModalVisible, setUpdateModalVisible] = useState(false);
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [commentForm] = Form.useForm();
  const [filters, setFilters] = useState({
    status: 'all',
    priority: 'all',
    type: 'all',
    assignee: 'all',
    dateRange: null,
    searchText: ''
  });
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    fetchITRequests();
  }, [filters, activeTab]);

  // FIXED: Proper role-based API endpoint selection
  const fetchITRequests = async () => {
    try {
      setLoading(true);
      setError(null);

      let response;
      const params = {
        status: filters.status !== 'all' ? filters.status : undefined,
        priority: filters.priority !== 'all' ? filters.priority : undefined,
        requestType: filters.type !== 'all' ? filters.type : undefined,
        page: 1,
        limit: 100
      };

      // FIXED: Use the unified getRequestsByRole endpoint
      response = await itSupportAPI.getRequestsByRole(params);

      if (response?.success && response?.data) {
        setRequests(Array.isArray(response.data) ? response.data : []);
      } else {
        console.warn('Unexpected response structure:', response);
        setRequests([]);
      }
    } catch (error) {
      console.error('Error fetching IT requests:', error);
      setError(error.response?.data?.message || error.message || 'Failed to fetch IT support requests');
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    await fetchITRequests();
  };

  // FIXED: Use real API for status updates
  const handleUpdateStatus = async (values) => {
    try {
      setLoading(true);
      
      let response;
      if (user.role === 'supervisor') {
        response = await itSupportAPI.processSupervisorDecision(selectedRequest._id, {
          decision: values.status === 'supervisor_approved' ? 'approved' : 
                   values.status === 'supervisor_rejected' ? 'rejected' : 'approved',
          comments: values.internalNotes || values.resolution
        });
      } else if (user.role === 'it') {
        response = await itSupportAPI.processITDepartmentDecision(selectedRequest._id, {
          decision: values.status === 'approved' ? 'approved' : 
                   values.status === 'rejected' ? 'rejected' : 'approved',
          comments: values.internalNotes || values.resolution,
          estimatedCost: values.estimatedCost,
          technicianId: values.assignedTo,
          estimatedCompletionTime: values.estimatedCompletion?.format('YYYY-MM-DD HH:mm')
        });
      } else if (user.role === 'finance') {
        response = await itSupportAPI.processFinanceDecision(selectedRequest._id, {
          decision: values.status === 'approved' ? 'approved' : 'rejected',
          comments: values.internalNotes || values.resolution,
          approvedAmount: values.approvedAmount
        });
      } else {
        response = await itSupportAPI.updateRequest(selectedRequest._id, {
          status: values.status,
          priority: values.priority,
          assignedTo: values.assignedTo,
          estimatedCompletion: values.estimatedCompletion?.toISOString(),
          resolution: values.resolution,
          internalNotes: values.internalNotes
        });
      }

      if (response.success) {
        message.success('Request updated successfully');
        setUpdateModalVisible(false);
        setSelectedRequest(null);
        form.resetFields();
        await fetchITRequests();
      } else {
        throw new Error(response.message || 'Failed to update request');
      }
    } catch (error) {
      console.error('Error updating request:', error);
      message.error(error.response?.data?.message || error.message || 'Failed to update request');
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async (values) => {
    try {
      setLoading(true);
      
      const commentData = {
        comments: [
          ...(selectedRequest.comments || []),
          {
            id: Date.now(),
            author: user.fullName,
            authorId: user._id,
            message: values.message,
            timestamp: new Date(),
            isInternal: values.isInternal || false
          }
        ]
      };

      const response = await itSupportAPI.updateRequest(selectedRequest._id, commentData);
      
      if (response.success) {
        message.success('Comment added successfully');
        setCommentModalVisible(false);
        setSelectedRequest(null);
        commentForm.resetFields();
        await fetchITRequests();
      } else {
        throw new Error(response.message || 'Failed to add comment');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      message.error(error.response?.data?.message || error.message || 'Failed to add comment');
    } finally {
      setLoading(false);
    }
  };

  const getStatusTag = (status) => {
    const statusMap = {
      'draft': { color: 'default', icon: <EditOutlined />, text: 'Draft' },
      'pending_supervisor': { color: 'orange', icon: <ClockCircleOutlined />, text: 'Pending Supervisor' },
      'supervisor_approved': { color: 'green', icon: <CheckCircleOutlined />, text: 'Supervisor Approved' },
      'supervisor_rejected': { color: 'red', icon: <CloseCircleOutlined />, text: 'Supervisor Rejected' },
      'pending_it_review': { color: 'blue', icon: <ClockCircleOutlined />, text: 'Pending IT Review' },
      'it_assigned': { color: 'cyan', icon: <UserOutlined />, text: 'Assigned to IT' },
      'pending_finance': { color: 'purple', icon: <ClockCircleOutlined />, text: 'Pending Finance' },
      'approved': { color: 'green', icon: <CheckCircleOutlined />, text: 'Approved' },
      'rejected': { color: 'red', icon: <CloseCircleOutlined />, text: 'Rejected' },
      'in_progress': { color: 'cyan', icon: <ToolOutlined />, text: 'In Progress' },
      'waiting_parts': { color: 'yellow', icon: <ClockCircleOutlined />, text: 'Waiting Parts' },
      'resolved': { color: 'green', icon: <CheckCircleOutlined />, text: 'Resolved' },
      'closed': { color: 'gray', icon: <CheckCircleOutlined />, text: 'Closed' },
      'cancelled': { color: 'red', icon: <CloseCircleOutlined />, text: 'Cancelled' }
    };

    const statusInfo = statusMap[status] || { 
      color: 'default', 
      icon: <QuestionCircleOutlined />,
      text: status?.replace('_', ' ') || 'Unknown' 
    };

    return (
      <Tag color={statusInfo.color} icon={statusInfo.icon}>
        {statusInfo.text}
      </Tag>
    );
  };

  const getPriorityTag = (priority) => {
    const priorityMap = {
      'critical': { color: 'red', text: 'Critical', icon: '🚨' },
      'high': { color: 'orange', text: 'High', icon: '🔥' },
      'medium': { color: 'yellow', text: 'Medium', icon: '⚡' },
      'low': { color: 'green', text: 'Low', icon: '📝' }
    };

    const priorityInfo = priorityMap[priority] || { color: 'default', text: priority, icon: '📋' };

    return (
      <Tag color={priorityInfo.color}>
        {priorityInfo.icon} {priorityInfo.text}
      </Tag>
    );
  };

  const getRequestTypeIcon = (type, category) => {
    if (type === 'material_request') {
      return <ShoppingCartOutlined style={{ color: '#1890ff' }} />;
    }
    
    const categoryIcons = {
      'hardware': <DesktopOutlined style={{ color: '#722ed1' }} />,
      'software': <BugOutlined style={{ color: '#fa8c16' }} />,
      'network': <WifiOutlined style={{ color: '#13c2c2' }} />,
      'printer': <PrinterOutlined style={{ color: '#52c41a' }} />,
      'mobile': <PhoneOutlined style={{ color: '#eb2f96' }} />,
      'other': <ToolOutlined style={{ color: '#666' }} />
    };

    return categoryIcons[category] || <BugOutlined style={{ color: '#fa8c16' }} />;
  };

  const requestColumns = [
    {
      title: 'Ticket #',
      dataIndex: 'ticketNumber',
      key: 'ticketNumber',
      render: (ticketNumber) => (
        <Text code style={{ fontSize: '12px' }}>{ticketNumber}</Text>
      ),
      width: 120
    },
    {
      title: 'Request Details',
      key: 'requestDetails',
      render: (_, record) => (
        <div>
          <Space style={{ marginBottom: '4px' }}>
            {getRequestTypeIcon(record.requestType, record.category)}
            <Text strong style={{ fontSize: '13px' }}>{record.title}</Text>
          </Space>
          <br />
          <Text type="secondary" style={{ fontSize: '11px' }}>
            {record.requestType === 'material_request' ? '🛒 Material Request' : '🔧 Technical Issue'}
          </Text>
          <br />
          <Tooltip title={record.description}>
            <Text ellipsis style={{ fontSize: '11px', color: '#666', display: 'block', maxWidth: '250px' }}>
              {record.description && record.description.length > 80 ? 
                `${record.description.substring(0, 80)}...` : 
                record.description
              }
            </Text>
          </Tooltip>
        </div>
      ),
      width: 280
    },
    {
      title: 'Employee',
      key: 'employee',
      render: (_, record) => (
        <div>
          <Text strong style={{ fontSize: '12px' }}>
            {record.employee?.fullName || 'N/A'}
          </Text>
          <br />
          <Text type="secondary" style={{ fontSize: '11px' }}>
            {record.employee?.department || record.department || 'N/A'}
          </Text>
          <br />
          <Text type="secondary" style={{ fontSize: '10px' }}>
            {record.employee?.email || 'N/A'}
          </Text>
        </div>
      ),
      width: 150
    },
    {
      title: 'Category',
      key: 'category',
      render: (_, record) => (
        <div>
          <Tag color="blue" style={{ fontSize: '11px' }}>
            {record.category?.toUpperCase()}
          </Tag>
          {record.subcategory && (
            <>
              <br />
              <Text type="secondary" style={{ fontSize: '10px' }}>
                {record.subcategory}
              </Text>
            </>
          )}
        </div>
      ),
      width: 110
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
      title: 'Assigned To',
      key: 'assignedTo',
      render: (_, record) => (
        <div>
          <Text style={{ fontSize: '12px' }}>
            {record.itReview?.assignedTechnician || 
             record.assignedTo?.fullName || 
             'Unassigned'}
          </Text>
          {record.itReview?.estimatedCompletion && (
            <>
              <br />
              <Text type="secondary" style={{ fontSize: '10px' }}>
                ETA: {dayjs(record.itReview.estimatedCompletion).format('MMM DD')}
              </Text>
            </>
          )}
        </div>
      ),
      width: 130
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => (
        <div>
          <div style={{ fontSize: '12px' }}>
            {dayjs(date).format('MMM DD, YYYY')}
          </div>
          <div style={{ fontSize: '10px', color: '#666' }}>
            {dayjs(date).fromNow()}
          </div>
        </div>
      ),
      sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
      defaultSortOrder: 'descend',
      width: 100
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="View Details">
            <Button 
              type="link" 
              icon={<EyeOutlined />}
              onClick={() => navigate(`/it/support-requests/${record._id}`)}
              size="small"
            />
          </Tooltip>
          {(user.role === 'supervisor' || user.role === 'it' || user.role === 'finance' || user.role === 'admin') && (
            <Tooltip title="Update Status">
              <Button 
                type="link" 
                icon={<EditOutlined />}
                onClick={() => {
                  setSelectedRequest(record);
                  form.setFieldsValue({
                    status: record.status,
                    priority: record.priority,
                    assignedTo: record.itReview?.technicianId,
                    estimatedCompletion: record.itReview?.estimatedCompletion ? 
                      dayjs(record.itReview.estimatedCompletion) : null
                  });
                  setUpdateModalVisible(true);
                }}
                size="small"
              />
            </Tooltip>
          )}
          {(user.role === 'it' || user.role === 'admin') && (
            <Tooltip title="Add Comment">
              <Button 
                type="link" 
                icon={<MessageOutlined />}
                onClick={() => {
                  setSelectedRequest(record);
                  setCommentModalVisible(true);
                }}
                size="small"
              />
            </Tooltip>
          )}
        </Space>
      ),
      width: 120
    }
  ];

  const filteredRequests = requests.filter(request => {
    if (activeTab !== 'all') {
      if (activeTab === 'material_requests' && request.requestType !== 'material_request') return false;
      if (activeTab === 'technical_issues' && request.requestType !== 'technical_issue') return false;
      if (activeTab === 'my_assigned' && request.itReview?.technicianId !== user._id) return false;
    }
    if (filters.status !== 'all' && request.status !== filters.status) return false;
    if (filters.priority !== 'all' && request.priority !== filters.priority) return false;
    if (filters.type !== 'all' && request.category !== filters.type) return false;
    if (filters.dateRange) {
      const requestDate = dayjs(request.createdAt);
      if (requestDate.isBefore(filters.dateRange[0]) || requestDate.isAfter(filters.dateRange[1])) {
        return false;
      }
    }
    if (filters.searchText) {
      const searchText = filters.searchText.toLowerCase();
      const matchesTitle = request.title?.toLowerCase().includes(searchText);
      const matchesDescription = request.description?.toLowerCase().includes(searchText);
      const matchesEmployee = request.employee?.fullName?.toLowerCase().includes(searchText);
      const matchesTicket = request.ticketNumber?.toLowerCase().includes(searchText);
      if (!matchesTitle && !matchesDescription && !matchesEmployee && !matchesTicket) return false;
    }
    return true;
  });

  const getStatsCards = () => {
    const totalRequests = requests.length;
    const pendingRequests = requests.filter(r => ['pending_supervisor', 'pending_it_review', 'pending_finance'].includes(r.status)).length;
    const inProgressRequests = requests.filter(r => ['it_assigned', 'in_progress', 'waiting_parts'].includes(r.status)).length;
    const resolvedToday = requests.filter(r => 
      ['resolved', 'closed'].includes(r.status) && 
      dayjs(r.updatedAt).isAfter(dayjs().startOf('day'))
    ).length;
    const myAssigned = requests.filter(r => r.itReview?.technicianId === user._id).length;
    const criticalIssues = requests.filter(r => r.priority === 'critical' && !['resolved', 'closed'].includes(r.status)).length;

    return (
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col xs={12} sm={8} md={4}>
          <Card size="small">
            <Statistic
              title="Total Requests"
              value={totalRequests}
              valueStyle={{ color: '#1890ff' }}
              prefix={<LaptopOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card size="small">
            <Statistic
              title="Pending"
              value={pendingRequests}
              valueStyle={{ color: '#faad14' }}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card size="small">
            <Statistic
              title="In Progress"
              value={inProgressRequests}
              valueStyle={{ color: '#722ed1' }}
              prefix={<ToolOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card size="small">
            <Statistic
              title="Resolved Today"
              value={resolvedToday}
              valueStyle={{ color: '#52c41a' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card size="small">
            <Statistic
              title="My Assigned"
              value={myAssigned}
              valueStyle={{ color: '#13c2c2' }}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card size="small">
            <Statistic
              title="Critical Issues"
              value={criticalIssues}
              valueStyle={{ color: criticalIssues > 0 ? '#ff4d4f' : '#52c41a' }}
              prefix={<WarningOutlined />}
            />
          </Card>
        </Col>
      </Row>
    );
  };

  if (loading && requests.length === 0) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Spin size="large" />
        <div style={{ marginTop: '16px' }}>Loading IT support requests...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <Title level={2} style={{ margin: 0 }}>
            <LaptopOutlined /> IT Support Requests Management
          </Title>
          <Space>
            <Button 
              icon={<ReloadOutlined />}
              onClick={handleRefresh}
              loading={loading}
            >
              Refresh
            </Button>
            <Button 
              icon={<ExportOutlined />}
              onClick={() => message.info('Export functionality to be implemented')}
            >
              Export
            </Button>
          </Space>
        </div>

        {error && (
          <Alert
            message="Error Loading Data"
            description={error}
            type="error"
            showIcon
            closable
            style={{ marginBottom: '16px' }}
            onClose={() => setError(null)}
          />
        )}

        {/* Stats Cards */}
        {getStatsCards()}

        {/* Tabs for different views */}
        <Tabs activeKey={activeTab} onChange={setActiveTab} style={{ marginBottom: '16px' }}>
          <TabPane 
            tab={
              <span>
                <LaptopOutlined />
                All Requests ({requests.length})
              </span>
            } 
            key="all"
          />
          <TabPane 
            tab={
              <span>
                <ShoppingCartOutlined />
                Material Requests ({requests.filter(r => r.requestType === 'material_request').length})
              </span>
            } 
            key="material_requests"
          />
          <TabPane 
            tab={
              <span>
                <BugOutlined />
                Technical Issues ({requests.filter(r => r.requestType === 'technical_issue').length})
              </span>
            } 
            key="technical_issues"
          />
          {(user.role === 'it' || user.role === 'admin') && (
            <TabPane 
              tab={
                <span>
                  <UserOutlined />
                  My Assigned ({requests.filter(r => r.itReview?.technicianId === user._id).length})
                </span>
              } 
              key="my_assigned"
            />
          )}
        </Tabs>

        {/* Filters */}
        <Card size="small" style={{ marginBottom: '16px' }}>
          <Row gutter={16} align="middle">
            <Col flex="auto">
              <Input
                placeholder="Search by ticket number, title, description, or employee name..."
                prefix={<SearchOutlined />}
                value={filters.searchText}
                onChange={(e) => setFilters({...filters, searchText: e.target.value})}
                allowClear
              />
            </Col>
            <Col>
              <Select
                style={{ width: 120 }}
                value={filters.status}
                onChange={(value) => setFilters({...filters, status: value})}
                placeholder="Status"
              >
                <Select.Option value="all">All Status</Select.Option>
                <Select.Option value="pending_supervisor">Pending Supervisor</Select.Option>
                <Select.Option value="supervisor_approved">Supervisor Approved</Select.Option>
                <Select.Option value="it_assigned">IT Assigned</Select.Option>
                <Select.Option value="in_progress">In Progress</Select.Option>
                <Select.Option value="resolved">Resolved</Select.Option>
                <Select.Option value="closed">Closed</Select.Option>
              </Select>
            </Col>
            <Col>
              <Select
                style={{ width: 110 }}
                value={filters.priority}
                onChange={(value) => setFilters({...filters, priority: value})}
                placeholder="Priority"
              >
                <Select.Option value="all">All Priority</Select.Option>
                <Select.Option value="critical">Critical</Select.Option>
                <Select.Option value="high">High</Select.Option>
                <Select.Option value="medium">Medium</Select.Option>
                <Select.Option value="low">Low</Select.Option>
              </Select>
            </Col>
            <Col>
              <RangePicker
                style={{ width: 240 }}
                value={filters.dateRange}
                onChange={(dates) => setFilters({...filters, dateRange: dates})}
                placeholder={['Start Date', 'End Date']}
              />
            </Col>
            <Col>
              <Button 
                icon={<FilterOutlined />}
                onClick={() => setFilters({
                  status: 'all',
                  priority: 'all', 
                  type: 'all',
                  assignee: 'all',
                  dateRange: null,
                  searchText: ''
                })}
              >
                Clear
              </Button>
            </Col>
          </Row>
        </Card>

        {filteredRequests.length === 0 ? (
          <Alert
            message="No IT Support Requests Found"
            description={
              requests.length === 0 
                ? "No IT support requests have been submitted yet."
                : "No requests match your current filter criteria. Try adjusting the filters above."
            }
            type="info"
            showIcon
            style={{ marginBottom: '16px' }}
          />
        ) : (
          <>
            <Text type="secondary" style={{ marginBottom: '8px', display: 'block' }}>
              Showing {filteredRequests.length} of {requests.length} requests
            </Text>
            
            <Table 
              columns={requestColumns} 
              dataSource={filteredRequests} 
              loading={loading}
              rowKey="_id"
              pagination={{ 
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) => 
                  `${range[0]}-${range[1]} of ${total} requests`
              }}
              scroll={{ x: 'max-content' }}
            />
          </>
        )}
      </Card>

      {/* Update Status Modal */}
      <Modal
        title={`Update Request: ${selectedRequest?.ticketNumber}`}
        open={updateModalVisible}
        onCancel={() => {
          setUpdateModalVisible(false);
          setSelectedRequest(null);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        width={600}
        confirmLoading={loading}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleUpdateStatus}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="status"
                label="Status"
                rules={[{ required: true, message: 'Please select status' }]}
              >
                <Select>
                  {user.role === 'supervisor' && (
                    <>
                      <Select.Option value="supervisor_approved">Approve</Select.Option>
                      <Select.Option value="supervisor_rejected">Reject</Select.Option>
                    </>
                  )}
                  {user.role === 'it' && (
                    <>
                      <Select.Option value="it_assigned">Assign to IT</Select.Option>
                      <Select.Option value="in_progress">In Progress</Select.Option>
                      <Select.Option value="waiting_parts">Waiting Parts</Select.Option>
                      <Select.Option value="resolved">Resolved</Select.Option>
                      <Select.Option value="rejected">Reject</Select.Option>
                    </>
                  )}
                  {user.role === 'finance' && (
                    <>
                      <Select.Option value="approved">Approve</Select.Option>
                      <Select.Option value="rejected">Reject</Select.Option>
                    </>
                  )}
                  {user.role === 'admin' && (
                    <>
                      <Select.Option value="pending_supervisor">Pending Supervisor</Select.Option>
                      <Select.Option value="supervisor_approved">Supervisor Approved</Select.Option>
                      <Select.Option value="it_assigned">IT Assigned</Select.Option>
                      <Select.Option value="in_progress">In Progress</Select.Option>
                      <Select.Option value="resolved">Resolved</Select.Option>
                      <Select.Option value="closed">Closed</Select.Option>
                      <Select.Option value="cancelled">Cancelled</Select.Option>
                    </>
                  )}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="priority"
                label="Priority"
                rules={[{ required: true, message: 'Please select priority' }]}
              >
                <Select>
                  <Select.Option value="critical">Critical</Select.Option>
                  <Select.Option value="high">High</Select.Option>
                  <Select.Option value="medium">Medium</Select.Option>
                  <Select.Option value="low">Low</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          
          {user.role === 'it' && (
            <Form.Item
              name="assignedTo"
              label="Assign To Technician"
            >
              <Select placeholder="Select technician">
                <Select.Option value={user._id}>{user.fullName} (Me)</Select.Option>
              </Select>
            </Form.Item>
          )}

          <Form.Item
            name="estimatedCompletion"
            label="Estimated Completion"
          >
            <DatePicker
              showTime
              style={{ width: '100%' }}
              placeholder="Select estimated completion date"
            />
          </Form.Item>

          <Form.Item
            name="resolution"
            label="Resolution Notes"
          >
            <TextArea
              rows={3}
              placeholder="Describe the resolution (if resolved)"
              showCount
              maxLength={500}
            />
          </Form.Item>

          <Form.Item
            name="internalNotes"
            label="Internal Notes"
          >
            <TextArea
              rows={2}
              placeholder="Internal notes (not visible to employee)"
              showCount
              maxLength={300}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Add Comment Modal */}
      <Modal
        title={`Add Comment: ${selectedRequest?.ticketNumber}`}
        open={commentModalVisible}
        onCancel={() => {
          setCommentModalVisible(false);
          setSelectedRequest(null);
          commentForm.resetFields();
        }}
        onOk={() => commentForm.submit()}
        confirmLoading={loading}
      >
        <Form
          form={commentForm}
          layout="vertical"
          onFinish={handleAddComment}
        >
          <Form.Item
            name="message"
            label="Comment"
            rules={[{ required: true, message: 'Please enter a comment' }]}
          >
            <TextArea
              rows={4}
              placeholder="Enter your comment..."
              showCount
              maxLength={1000}
            />
          </Form.Item>

          <Form.Item name="isInternal" valuePropName="checked">
            <Checkbox>Internal comment (not visible to employee)</Checkbox>
          </Form.Item>

          <Form.Item name="notifyEmployee" valuePropName="checked">
            <Checkbox>Send email notification to employee</Checkbox>
          </Form.Item>
        </Form>
      </Modal>

      <style jsx>{`
        .critical-priority-row {
          background-color: #fff1f0 !important;
          border-left: 4px solid #ff4d4f !important;
        }
        .critical-priority-row:hover {
          background-color: #ffe7e6 !important;
        }
        .my-assigned-row {
          background-color: #f6ffed !important;
          border-left: 3px solid #52c41a !important;
        }
        .my-assigned-row:hover {
          background-color: #e6f7d2 !important;
        }
        .pending-row {
          background-color: #fffbf0 !important;
          border-left: 2px solid #faad14 !important;
        }
        .pending-row:hover {
          background-color: #fff8e1 !important;
        }
      `}</style>
    </div>
  );
};

export default ITSupportRequests;




