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
  Tabs,
  Progress
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
  WarningOutlined
} from '@ant-design/icons';
import { itSupportAPI } from '../../services/api';
import { useSelector } from 'react-redux';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { TabPane } = Tabs;

const EmployeeITSupport = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [filters, setFilters] = useState({
    status: 'all',
    priority: 'all',
    type: 'all',
    requestType: 'all',
    page: 1,
    limit: 10,
    dateRange: null
  });
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    fetchITRequests();
  }, [filters]);

  const fetchITRequests = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        status: filters.status !== 'all' ? filters.status : undefined,
        priority: filters.priority !== 'all' ? filters.priority : undefined,
        requestType: filters.requestType !== 'all' ? filters.requestType : undefined,
        page: filters.page,
        limit: filters.limit
      };

      // Add date range filter if set
      if (filters.dateRange && filters.dateRange.length === 2) {
        params.startDate = filters.dateRange[0].format('YYYY-MM-DD');
        params.endDate = filters.dateRange[1].format('YYYY-MM-DD');
      }

      console.log('Fetching employee IT requests with params:', params);
      const response = await itSupportAPI.getEmployeeRequests(params);
      
      if (response?.success && response?.data) {
        const requestsData = Array.isArray(response.data) ? response.data : [];
        console.log('Received requests data:', requestsData);
        setRequests(requestsData);
      } else {
        console.warn('Unexpected response structure:', response);
        setRequests([]);
      }
    } catch (error) {
      console.error('Error fetching IT requests:', error);
      setError(error.response?.data?.message || 'Failed to fetch IT support requests');
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    await fetchITRequests();
  };

  const getStatusTag = (status) => {
    const statusMap = {
      'pending': { 
        color: 'orange', 
        icon: <ClockCircleOutlined />, 
        text: 'Pending Review' 
      },
      'under_review': { 
        color: 'blue', 
        icon: <ToolOutlined />, 
        text: 'Under Review' 
      },
      'approved': { 
        color: 'cyan', 
        icon: <CheckCircleOutlined />, 
        text: 'Approved' 
      },
      'in_progress': { 
        color: 'purple', 
        icon: <ToolOutlined />, 
        text: 'In Progress' 
      },
      'completed': { 
        color: 'green', 
        icon: <CheckCircleOutlined />, 
        text: 'Completed' 
      },
      'rejected': { 
        color: 'red', 
        icon: <CloseCircleOutlined />, 
        text: 'Rejected' 
      },
      'cancelled': { 
        color: 'gray', 
        icon: <CloseCircleOutlined />, 
        text: 'Cancelled' 
      }
    };

    const statusInfo = statusMap[status] || { 
      color: 'default', 
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
    
    // Technical issue icons based on category
    const categoryIcons = {
      'hardware': <DesktopOutlined style={{ color: '#722ed1' }} />,
      'software': <BugOutlined style={{ color: '#fa8c16' }} />,
      'network': <WifiOutlined style={{ color: '#13c2c2' }} />,
      'printer': <PrinterOutlined style={{ color: '#52c41a' }} />,
      'phone': <PhoneOutlined style={{ color: '#eb2f96' }} />,
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
            <Text ellipsis style={{ fontSize: '11px', color: '#666', display: 'block', maxWidth: '200px' }}>
              {record.description.length > 60 ? 
                `${record.description.substring(0, 60)}...` : 
                record.description
              }
            </Text>
          </Tooltip>
        </div>
      ),
      width: 250
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
      width: 100
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority) => getPriorityTag(priority),
      filters: [
        { text: 'Critical', value: 'critical' },
        { text: 'High', value: 'high' },
        { text: 'Medium', value: 'medium' },
        { text: 'Low', value: 'low' }
      ],
      onFilter: (value, record) => record.priority === value,
      width: 100
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => getStatusTag(status),
      filters: [
        { text: 'Pending', value: 'pending' },
        { text: 'Under Review', value: 'under_review' },
        { text: 'Approved', value: 'approved' },
        { text: 'In Progress', value: 'in_progress' },
        { text: 'Completed', value: 'completed' },
        { text: 'Rejected', value: 'rejected' }
      ],
      onFilter: (value, record) => record.status === value,
      width: 130
    },
    {
      title: 'Assigned To',
      dataIndex: 'assignedTo',
      key: 'assignedTo',
      render: (assignedTo) => (
        <Text style={{ fontSize: '12px' }}>
          {assignedTo || 'Unassigned'}
        </Text>
      ),
      width: 120
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => (
        <div>
          <div style={{ fontSize: '12px' }}>
            {new Date(date).toLocaleDateString()}
          </div>
          <div style={{ fontSize: '10px', color: '#666' }}>
            {new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
          <Button 
            type="link" 
            icon={<EyeOutlined />}
            onClick={() => navigate(`/employee/it-support/${record._id}`)}
            size="small"
          >
            View
          </Button>
        </Space>
      ),
      width: 80
    }
  ];

  // Simplified filtering for testing
  console.log('Raw requests array:', requests);
  console.log('Active tab:', activeTab);
  console.log('Current filters:', filters);
  
  const filteredRequests = requests.filter(request => {
    // For 'all' tab, show all requests
    if (activeTab === 'all') {
      return true;
    }
    // For specific tabs, filter by request type
    return request.requestType === activeTab;
  });
  
  console.log('Filtered requests after tab filter:', filteredRequests);

  const getStatsCards = () => {
    const totalRequests = requests.length;
    const pendingRequests = requests.filter(r => ['pending', 'under_review'].includes(r.status)).length;
    const inProgressRequests = requests.filter(r => r.status === 'in_progress').length;
    const completedRequests = requests.filter(r => r.status === 'completed').length;
    const materialRequests = requests.filter(r => r.requestType === 'material_request').length;
    const technicalIssues = requests.filter(r => r.requestType === 'technical_issue').length;

    return (
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col xs={12} sm={8} md={4}>
          <Card size="small">
            <div style={{ textAlign: 'center' }}>
              <Text type="secondary">Total</Text>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#1890ff' }}>
                {totalRequests}
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card size="small">
            <div style={{ textAlign: 'center' }}>
              <Badge count={pendingRequests} offset={[8, -2]} color="#faad14">
                <Text type="secondary">Pending</Text>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#faad14' }}>
                  {pendingRequests}
                </div>
              </Badge>
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card size="small">
            <div style={{ textAlign: 'center' }}>
              <Text type="secondary">In Progress</Text>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#722ed1' }}>
                {inProgressRequests}
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card size="small">
            <div style={{ textAlign: 'center' }}>
              <Text type="secondary">Completed</Text>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#52c41a' }}>
                {completedRequests}
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card size="small">
            <div style={{ textAlign: 'center' }}>
              <Text type="secondary">Material</Text>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#13c2c2' }}>
                {materialRequests}
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card size="small">
            <div style={{ textAlign: 'center' }}>
              <Text type="secondary">Tech Issues</Text>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#fa8c16' }}>
                {technicalIssues}
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    );
  };

  if (loading) {
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
            <LaptopOutlined /> My IT Support Requests
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
              type="primary" 
              icon={<ShoppingCartOutlined />}
              onClick={() => navigate('/employee/it-support/materials/new')}
            >
              Request Materials
            </Button>
            <Button 
              type="default" 
              icon={<BugOutlined />}
              onClick={() => navigate('/employee/it-support/issues/new')}
            >
              Report Issue
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

        {/* Tabs for different request types */}
        <Tabs activeKey={activeTab} onChange={setActiveTab} style={{ marginBottom: '16px' }}>
          <TabPane 
            tab={
              <span>
                <ToolOutlined />
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
            key="material_request"
          />
          <TabPane 
            tab={
              <span>
                <BugOutlined />
                Technical Issues ({requests.filter(r => r.requestType === 'technical_issue').length})
              </span>
            } 
            key="technical_issue"
          />
        </Tabs>

        {/* Filters */}
        <Card size="small" style={{ marginBottom: '16px' }}>
          <Row gutter={16} align="middle">
            <Col>
              <Text strong>Filters:</Text>
            </Col>
            <Col>
              <Select
                style={{ width: 120 }}
                value={filters.status}
                onChange={(value) => setFilters({...filters, status: value})}
                placeholder="Status"
              >
                <Select.Option value="all">All Status</Select.Option>
                <Select.Option value="pending">Pending</Select.Option>
                <Select.Option value="pending_supervisor">Pending Supervisor</Select.Option>
                <Select.Option value="under_review">Under Review</Select.Option>
                <Select.Option value="approved">Approved</Select.Option>
                <Select.Option value="in_progress">In Progress</Select.Option>
                <Select.Option value="completed">Completed</Select.Option>
                <Select.Option value="rejected">Rejected</Select.Option>
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
              <Select
                style={{ width: 120 }}
                value={filters.type}
                onChange={(value) => setFilters({...filters, type: value})}
                placeholder="Category"
              >
                <Select.Option value="all">All Categories</Select.Option>
                <Select.Option value="hardware">Hardware</Select.Option>
                <Select.Option value="software">Software</Select.Option>
                <Select.Option value="network">Network</Select.Option>
                <Select.Option value="printer">Printer</Select.Option>
                <Select.Option value="phone">Phone</Select.Option>
                <Select.Option value="other">Other</Select.Option>
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
                onClick={() => setFilters({
                  status: 'all',
                  priority: 'all', 
                  type: 'all',
                  requestType: 'all',
                  page: 1,
                  limit: 10,
                  dateRange: null
                })}
              >
                Clear Filters
              </Button>
            </Col>
          </Row>
        </Card>

        {/* IT Support Guidelines */}
        <Alert
          message="IT Support Guidelines"
          description={
            <div>
              <p><strong>Material Requests:</strong> Request IT equipment like mouse, keyboard, cables, etc. Include business justification.</p>
              <p><strong>Technical Issues:</strong> Report device problems, software issues, network connectivity problems.</p>
              <p><strong>Priority Levels:</strong> Critical (system down), High (impacting work), Medium (minor issues), Low (enhancement requests).</p>
            </div>
          }
          type="info"
          showIcon
          style={{ marginBottom: '16px' }}
        />

        {filteredRequests.length === 0 ? (
          <Alert
            message="No IT Support Requests Found"
            description={
              requests.length === 0 
                ? "You haven't submitted any IT support requests yet. Use the buttons above to request materials or report technical issues."
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
              rowClassName={(record) => {
                if (record.priority === 'critical') {
                  return 'critical-priority-row';
                }
                if (record.priority === 'high') {
                  return 'high-priority-row';
                }
                if (record.status === 'pending') {
                  return 'pending-row';
                }
                return '';
              }}
              expandable={{
                expandedRowRender: (record) => (
                  <div style={{ padding: '16px', backgroundColor: '#fafafa' }}>
                    <Row gutter={16}>
                      <Col span={12}>
                        <Space direction="vertical" style={{ width: '100%' }}>
                          <div>
                            <Text strong>Description:</Text>
                            <div style={{ marginTop: '4px', padding: '8px', backgroundColor: '#fff', borderRadius: '4px', border: '1px solid #d9d9d9' }}>
                              {record.description}
                            </div>
                          </div>
                          
                          <div>
                            <Text strong>Business Justification:</Text>
                            <div style={{ marginTop: '4px', padding: '8px', backgroundColor: '#fff', borderRadius: '4px', border: '1px solid #d9d9d9' }}>
                              {record.businessJustification}
                            </div>
                          </div>
                        </Space>
                      </Col>
                      
                      <Col span={12}>
                        <Space direction="vertical" style={{ width: '100%' }}>
                          {/* Material Requests Details */}
                          {record.requestType === 'material_request' && record.requestedItems && (
                            <div>
                              <Text strong>Requested Items:</Text>
                              <div style={{ marginTop: '8px' }}>
                                {record.requestedItems.map((item, index) => (
                                  <div key={index} style={{ 
                                    padding: '8px', 
                                    backgroundColor: '#fff', 
                                    borderRadius: '4px', 
                                    border: '1px solid #d9d9d9',
                                    marginBottom: '8px'
                                  }}>
                                    <Text strong>{item.item}</Text>
                                    <br />
                                    <Text type="secondary">
                                      {item.brand} {item.model} | Qty: {item.quantity} | Est. Cost: XAF {item.estimatedCost?.toLocaleString()}
                                    </Text>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Technical Issue Details */}
                          {record.requestType === 'technical_issue' && record.deviceDetails && (
                            <div>
                              <Text strong>Device Details:</Text>
                              <div style={{ marginTop: '8px', padding: '8px', backgroundColor: '#fff', borderRadius: '4px', border: '1px solid #d9d9d9' }}>
                                <div><Text strong>Device:</Text> {record.deviceDetails.deviceType}</div>
                                <div><Text strong>Brand/Model:</Text> {record.deviceDetails.brand} {record.deviceDetails.model}</div>
                                {record.deviceDetails.serialNumber && (
                                  <div><Text strong>Serial:</Text> {record.deviceDetails.serialNumber}</div>
                                )}
                                {record.deviceDetails.operatingSystem && (
                                  <div><Text strong>OS:</Text> {record.deviceDetails.operatingSystem}</div>
                                )}
                                {record.deviceDetails.location && (
                                  <div><Text strong>Location:</Text> {record.deviceDetails.location}</div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Progress Information */}
                          <div>
                            <Text strong>Progress:</Text>
                            <div style={{ marginTop: '8px' }}>
                              <Progress 
                                percent={
                                  record.status === 'completed' ? 100 :
                                  record.status === 'in_progress' ? 60 :
                                  record.status === 'approved' ? 40 :
                                  record.status === 'under_review' ? 20 : 10
                                }
                                status={
                                  record.status === 'completed' ? 'success' :
                                  record.status === 'rejected' ? 'exception' : 'active'
                                }
                                format={(percent) => `${record.status.replace('_', ' ').toUpperCase()}`}
                              />
                            </div>
                          </div>

                          {record.estimatedCompletion && (
                            <div>
                              <Text strong>Estimated Completion:</Text>
                              <div style={{ marginTop: '4px' }}>
                                <Text>{new Date(record.estimatedCompletion).toLocaleString()}</Text>
                              </div>
                            </div>
                          )}

                          {record.resolution && (
                            <div>
                              <Text strong>Resolution:</Text>
                              <div style={{ marginTop: '4px', padding: '8px', backgroundColor: '#f6ffed', borderRadius: '4px', border: '1px solid #b7eb8f' }}>
                                {record.resolution}
                              </div>
                            </div>
                          )}
                        </Space>
                      </Col>
                    </Row>
                  </div>
                ),
                rowExpandable: () => true,
              }}
            />
          </>
        )}
      </Card>

      <style jsx>{`
        .critical-priority-row {
          background-color: #fff1f0 !important;
          border-left: 4px solid #ff4d4f !important;
        }
        .critical-priority-row:hover {
          background-color: #ffe7e6 !important;
        }
        .high-priority-row {
          background-color: #fff7e6 !important;
          border-left: 3px solid #fa8c16 !important;
        }
        .high-priority-row:hover {
          background-color: #fff1d6 !important;
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

export default EmployeeITSupport;