import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Tag,
  Button,
  Space,
  Typography,
  Alert,
  Spin,
  message,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  Tabs,
  Timeline,
  Progress,
  Tooltip,
  Badge,
  Descriptions,
  Divider,
  Chart as AntChart
} from 'antd';
import {
  LaptopOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  ToolOutlined,
  BankOutlined,
  UserOutlined,
  BarChartOutlined,
  LineChartOutlined,
  PieChartOutlined,
  ReloadOutlined,
  ExportOutlined,
  SettingOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  WarningOutlined,
  BugOutlined,
  ShoppingCartOutlined,
  CalendarOutlined,
  RiseOutlined,
  DollarOutlined
} from '@ant-design/icons';
import { itSupportAPI } from '../../services/api';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { RangePicker } = DatePicker;
const { TextArea } = Input;

const AdminITSupport = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [allRequests, setAllRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState([dayjs().subtract(30, 'day'), dayjs()]);
  const [form] = Form.useForm();
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
    fetchAllRequests();
  }, [dateRange]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await itSupportAPI.getDashboardStats();

      if (response?.success && response?.data) {
        setDashboardData(response.data);
      } else {
        // Fallback to comprehensive mock data for admin analytics
        const mockData = {
          totalRequests: 156,
          pendingRequests: 23,
          inProgressRequests: 12,
          resolvedRequests: 121,
          averageResolutionTime: 4.2,
          employeeSatisfaction: 4.6,
          totalBudgetRequested: 2500000,
          totalBudgetApproved: 2100000,
          criticalIssuesCount: 3,
          departmentBreakdown: {
            'IT Department': 45,
            'Finance': 28,
            'HR': 22,
            'Operations': 35,
            'Sales': 18,
            'Marketing': 8
          },
          categoryBreakdown: {
            'Hardware': 67,
            'Software': 42,
            'Network': 28,
            'Printer': 15,
            'Mobile': 4
          },
          priorityBreakdown: {
            'Critical': 8,
            'High': 32,
            'Medium': 84,
            'Low': 32
          },
          weeklyTrends: [
            { week: 'Week 1', requests: 12, resolved: 10, budget: 180000 },
            { week: 'Week 2', requests: 15, resolved: 13, budget: 220000 },
            { week: 'Week 3', requests: 18, resolved: 16, budget: 340000 },
            { week: 'Week 4', requests: 21, resolved: 19, budget: 280000 }
          ],
          topTechnicians: [
            { name: 'John Smith', resolved: 45, avgTime: 3.2, satisfaction: 4.8 },
            { name: 'Sarah Wilson', resolved: 38, avgTime: 3.8, satisfaction: 4.7 },
            { name: 'Mike Johnson', resolved: 32, avgTime: 4.1, satisfaction: 4.5 }
          ],
          urgentRequests: [
            {
              id: 'IT-2024-001',
              title: 'Server maintenance required',
              priority: 'Critical',
              employee: 'Admin User',
              department: 'IT',
              age: 2,
              status: 'pending_it_review'
            },
            {
              id: 'IT-2024-045',
              title: 'Network connectivity issues',
              priority: 'High',
              employee: 'Jane Doe',
              department: 'Finance',
              age: 4,
              status: 'in_progress'
            }
          ]
        };
        setDashboardData(mockData);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError(error.message || 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllRequests = async () => {
    try {
      const response = await itSupportAPI.getAllAdminRequests({
        page: 1,
        limit: 100,
        startDate: dateRange[0]?.format('YYYY-MM-DD'),
        endDate: dateRange[1]?.format('YYYY-MM-DD')
      });

      if (response?.success && response?.data) {
        setAllRequests(Array.isArray(response.data) ? response.data : []);
      }
    } catch (error) {
      console.error('Error fetching all requests:', error);
    }
  };

  const handleDeleteRequest = async (requestId) => {
    try {
      setLoading(true);
      const response = await itSupportAPI.deleteRequest(requestId);

      if (response.success) {
        message.success('Request deleted successfully');
        await fetchAllRequests();
        await fetchDashboardData();
      } else {
        throw new Error(response.message || 'Failed to delete request');
      }
    } catch (error) {
      console.error('Error deleting request:', error);
      message.error(error.message || 'Failed to delete request');
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
      icon: <ClockCircleOutlined />, 
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
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      render: (title, record) => (
        <div>
          <Space style={{ marginBottom: '4px' }}>
            {record.requestType === 'material_request' ? 
              <ShoppingCartOutlined style={{ color: '#1890ff' }} /> : 
              <BugOutlined style={{ color: '#fa8c16' }} />
            }
            <Text strong style={{ fontSize: '13px' }}>{title}</Text>
          </Space>
        </div>
      ),
      width: 250
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
      width: 140
    },
    {
      title: 'Cost',
      key: 'cost',
      render: (_, record) => (
        <Text style={{ fontSize: '12px', color: '#fa8c16' }}>
          ₦{(record.itReview?.estimatedCost || 0).toLocaleString()}
        </Text>
      ),
      width: 100
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
              onClick={() => {
                setSelectedRequest(record);
                setModalVisible(true);
              }}
              size="small"
            />
          </Tooltip>
          <Tooltip title="Edit Request">
            <Button 
              type="link" 
              icon={<EditOutlined />}
              onClick={() => navigate(`/it/support-requests/${record._id}`)}
              size="small"
            />
          </Tooltip>
          <Tooltip title="Delete Request">
            <Button 
              type="link" 
              danger
              icon={<DeleteOutlined />}
              onClick={() => {
                Modal.confirm({
                  title: 'Delete Request',
                  content: 'Are you sure you want to delete this request? This action cannot be undone.',
                  onOk: () => handleDeleteRequest(record._id)
                });
              }}
              size="small"
            />
          </Tooltip>
        </Space>
      ),
      width: 120
    }
  ];

  const getOverviewCards = () => {
    if (!dashboardData) return null;

    return (
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Requests"
              value={dashboardData.totalRequests}
              prefix={<LaptopOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Pending"
              value={dashboardData.pendingRequests}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Avg Resolution (Days)"
              value={dashboardData.averageResolutionTime}
              prefix={<RiseOutlined />}
              precision={1}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Budget Used"
              value={dashboardData.totalBudgetApproved}
              prefix="₦"
              formatter={(value) => value?.toLocaleString()}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>
    );
  };

  const getAnalyticsCharts = () => {
    if (!dashboardData) return null;

    return (
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col xs={24} lg={12}>
          <Card title="Request Categories" extra={<PieChartOutlined />}>
            <div style={{ height: '300px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <div>
                {Object.entries(dashboardData.categoryBreakdown || {}).map(([category, count]) => (
                  <div key={category} style={{ marginBottom: '8px' }}>
                    <Space>
                      <Tag color="blue">{category}</Tag>
                      <Text strong>{count} requests</Text>
                    </Space>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Priority Distribution" extra={<BarChartOutlined />}>
            <div style={{ height: '300px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <div>
                {Object.entries(dashboardData.priorityBreakdown || {}).map(([priority, count]) => (
                  <div key={priority} style={{ marginBottom: '8px' }}>
                    <Space>
                      {getPriorityTag(priority.toLowerCase())}
                      <Text strong>{count} requests</Text>
                    </Space>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    );
  };

  const getTopTechnicians = () => {
    if (!dashboardData?.topTechnicians) return null;

    return (
      <Card title="Top Performing Technicians" style={{ marginBottom: '24px' }}>
        <Row gutter={16}>
          {dashboardData.topTechnicians.map((tech, index) => (
            <Col xs={24} md={8} key={tech.name}>
              <Card size="small">
                <div style={{ textAlign: 'center' }}>
                  <Badge count={index + 1} style={{ backgroundColor: '#52c41a' }}>
                    <UserOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
                  </Badge>
                  <Title level={5} style={{ marginTop: '8px' }}>{tech.name}</Title>
                  <Space direction="vertical" size="small">
                    <Text type="secondary">Resolved: {tech.resolved}</Text>
                    <Text type="secondary">Avg Time: {tech.avgTime} days</Text>
                    <Text type="secondary">Rating: {tech.satisfaction}/5.0</Text>
                  </Space>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </Card>
    );
  };

  const getUrgentRequests = () => {
    if (!dashboardData?.urgentRequests) return null;

    return (
      <Card title="Urgent Requests Requiring Attention" extra={<WarningOutlined style={{ color: '#ff4d4f' }} />}>
        <Timeline>
          {dashboardData.urgentRequests.map((request) => (
            <Timeline.Item
              key={request.id}
              dot={<WarningOutlined style={{ fontSize: '16px', color: '#ff4d4f' }} />}
              color="red"
            >
              <div>
                <Space>
                  <Text strong>{request.title}</Text>
                  {getPriorityTag(request.priority.toLowerCase())}
                  {getStatusTag(request.status)}
                </Space>
                <br />
                <Text type="secondary">
                  {request.employee} ({request.department}) - {request.age} days old
                </Text>
                <br />
                <Button 
                  type="link" 
                  size="small" 
                  onClick={() => navigate(`/it/support-requests/${request.id}`)}
                >
                  View Details
                </Button>
              </div>
            </Timeline.Item>
          ))}
        </Timeline>
      </Card>
    );
  };

  if (loading && !dashboardData) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Spin size="large" />
        <div style={{ marginTop: '16px' }}>Loading admin dashboard...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <Title level={2} style={{ margin: 0 }}>
            <SettingOutlined /> IT Support Administration
          </Title>
          <Space>
            <RangePicker
              value={dateRange}
              onChange={(dates) => setDateRange(dates)}
              style={{ width: '240px' }}
            />
            <Button 
              icon={<ReloadOutlined />}
              onClick={() => {
                fetchDashboardData();
                fetchAllRequests();
              }}
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

        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab={<span><BarChartOutlined />Overview</span>} key="overview">
            {getOverviewCards()}
            {getAnalyticsCharts()}
            {getTopTechnicians()}
            {getUrgentRequests()}
          </TabPane>

          <TabPane tab={<span><LaptopOutlined />All Requests</span>} key="requests">
            <Text type="secondary" style={{ marginBottom: '16px', display: 'block' }}>
              Showing {allRequests.length} total requests
            </Text>
            <Table 
              columns={requestColumns} 
              dataSource={allRequests} 
              loading={loading}
              rowKey="_id"
              pagination={{ 
                pageSize: 20,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) => 
                  `${range[0]}-${range[1]} of ${total} requests`
              }}
              scroll={{ x: 'max-content' }}
              rowClassName={(record) => {
                if (record.priority === 'critical') return 'critical-priority-row';
                if (record.status === 'pending_supervisor' || record.status === 'pending_finance') return 'pending-row';
                return '';
              }}
            />
          </TabPane>

          <TabPane tab={<span><TeamOutlined />Technician Performance</span>} key="performance">
            <Row gutter={16}>
              <Col span={24}>
                <Card title="Performance Metrics" style={{ marginBottom: '16px' }}>
                  <Row gutter={16}>
                    <Col xs={24} sm={8}>
                      <Statistic
                        title="Average Resolution Time"
                        value={dashboardData?.averageResolutionTime || 0}
                        suffix="days"
                        precision={1}
                        valueStyle={{ color: '#52c41a' }}
                      />
                    </Col>
                    <Col xs={24} sm={8}>
                      <Statistic
                        title="Employee Satisfaction"
                        value={dashboardData?.employeeSatisfaction || 0}
                        suffix="/ 5.0"
                        precision={1}
                        valueStyle={{ color: '#1890ff' }}
                      />
                    </Col>
                    <Col xs={24} sm={8}>
                      <Statistic
                        title="Resolution Rate"
                        value={dashboardData ? 
                          ((dashboardData.resolvedRequests / dashboardData.totalRequests) * 100) : 0}
                        suffix="%"
                        precision={1}
                        valueStyle={{ color: '#722ed1' }}
                      />
                    </Col>
                  </Row>
                </Card>
              </Col>
            </Row>
            {getTopTechnicians()}
          </TabPane>

          <TabPane tab={<span><DollarOutlined />Budget Analysis</span>} key="budget">
            <Row gutter={16}>
              <Col xs={24} lg={12}>
                <Card title="Budget Overview">
                  <Space direction="vertical" size="large" style={{ width: '100%' }}>
                    <Statistic
                      title="Total Budget Requested"
                      value={dashboardData?.totalBudgetRequested || 0}
                      prefix="₦"
                      formatter={(value) => value.toLocaleString()}
                      valueStyle={{ color: '#faad14' }}
                    />
                    <Statistic
                      title="Total Budget Approved"
                      value={dashboardData?.totalBudgetApproved || 0}
                      prefix="₦"
                      formatter={(value) => value.toLocaleString()}
                      valueStyle={{ color: '#52c41a' }}
                    />
                    <Progress
                      percent={dashboardData ? 
                        ((dashboardData.totalBudgetApproved / dashboardData.totalBudgetRequested) * 100) : 0}
                      strokeColor="#52c41a"
                      format={(percent) => `${percent.toFixed(1)}% Approved`}
                    />
                  </Space>
                </Card>
              </Col>
              <Col xs={24} lg={12}>
                <Card title="Department Budget Usage">
                  <div>
                    {Object.entries(dashboardData?.departmentBreakdown || {}).map(([dept, requests]) => (
                      <div key={dept} style={{ marginBottom: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <Text strong>{dept}</Text>
                          <Text>{requests} requests</Text>
                        </div>
                        <Progress 
                          percent={(requests / (dashboardData?.totalRequests || 1)) * 100} 
                          showInfo={false}
                          strokeColor="#1890ff"
                        />
                      </div>
                    ))}
                  </div>
                </Card>
              </Col>
            </Row>
          </TabPane>
        </Tabs>
      </Card>

      {/* Request Details Modal */}
      <Modal
        title={`Request Details: ${selectedRequest?.ticketNumber}`}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setSelectedRequest(null);
        }}
        footer={null}
        width={700}
      >
        {selectedRequest && (
          <Descriptions bordered size="small" column={2}>
            <Descriptions.Item label="Ticket Number" span={1}>
              <Text code>{selectedRequest.ticketNumber}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Status" span={1}>
              {getStatusTag(selectedRequest.status)}
            </Descriptions.Item>
            <Descriptions.Item label="Request Type" span={2}>
              {selectedRequest.requestType === 'material_request' ? 'Material Request' : 'Technical Issue'}
            </Descriptions.Item>
            <Descriptions.Item label="Title" span={2}>
              {selectedRequest.title}
            </Descriptions.Item>
            <Descriptions.Item label="Description" span={2}>
              {selectedRequest.description}
            </Descriptions.Item>
            <Descriptions.Item label="Employee" span={1}>
              {selectedRequest.employee?.fullName}
            </Descriptions.Item>
            <Descriptions.Item label="Department" span={1}>
              {selectedRequest.employee?.department}
            </Descriptions.Item>
            <Descriptions.Item label="Priority" span={1}>
              {getPriorityTag(selectedRequest.priority)}
            </Descriptions.Item>
            <Descriptions.Item label="Category" span={1}>
              <Tag color="blue">{selectedRequest.category}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Created" span={1}>
              {dayjs(selectedRequest.createdAt).format('YYYY-MM-DD HH:mm')}
            </Descriptions.Item>
            <Descriptions.Item label="Last Updated" span={1}>
              {dayjs(selectedRequest.updatedAt).format('YYYY-MM-DD HH:mm')}
            </Descriptions.Item>
            {selectedRequest.itReview?.estimatedCost && (
              <Descriptions.Item label="Estimated Cost" span={1}>
                ₦{selectedRequest.itReview.estimatedCost.toLocaleString()}
              </Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Modal>

      <style jsx>{`
        .critical-priority-row {
          background-color: #fff1f0 !important;
          border-left: 4px solid #ff4d4f !important;
        }
        .critical-priority-row:hover {
          background-color: #ffe7e6 !important;
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

export default AdminITSupport;