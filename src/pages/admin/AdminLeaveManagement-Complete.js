import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { 
  Table, 
  Tag, 
  Space, 
  Typography, 
  Button, 
  Alert, 
  Spin, 
  Card,
  Select,
  DatePicker,
  Row,
  Col,
  Statistic,
  Modal,
  Form,
  Input,
  Tabs,
  Tooltip,
  Descriptions,
  message,
  Badge,
  List,
  Avatar,
  Empty,
  Progress,
  Collapse,
  Divider
} from 'antd';
import { 
  CalendarOutlined, 
  CheckCircleOutlined, 
  CloseCircleOutlined, 
  ClockCircleOutlined,
  EyeOutlined,
  ReloadOutlined,
  BarChartOutlined,
  UserOutlined,
  EditOutlined,
  HeartOutlined,
  WarningOutlined,
  FileTextOutlined,
  SafetyCertificateOutlined,
  TeamOutlined,
  PieChartOutlined,
  MedicineBoxOutlined,
  HomeOutlined,
  BookOutlined,
  RestOutlined,
  SettingOutlined,
  DashboardOutlined,
  FilterOutlined,
  DownloadOutlined,
  BulkOutlined,
  AuditOutlined
} from '@ant-design/icons';
import leaveApi from '../../services/leaveApi';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const { Title, Text, Paragraph } = Typography;
const { RangePicker } = DatePicker;
const { TextArea } = Input;
const { TabPane } = Tabs;
const { Panel } = Collapse;

const AdminLeaveManagementComplete = () => {
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [detailsModal, setDetailsModal] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [filters, setFilters] = useState({
    status: 'all',
    category: 'all',
    urgency: 'all',
    department: 'all',
    dateRange: null
  });
  const [analytics, setAnalytics] = useState({});
  const [stats, setStats] = useState({});
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    fetchData();
  }, [filters, activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchLeaveRequests(),
        fetchAnalytics(),
        fetchStats()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaveRequests = async () => {
    try {
      setError(null);
      const params = {};
      
      // Apply tab-specific filters
      switch (activeTab) {
        case 'pending':
          params.status = 'pending_supervisor,pending_hr,pending_admin';
          break;
        case 'approved':
          params.status = 'approved,completed';
          break;
        case 'urgent':
          params.urgency = 'high,critical';
          break;
        case 'medical':
          params.category = 'medical';
          break;
        case 'analytics':
          // Skip fetching individual requests for analytics tab
          setLeaveRequests([]);
          return;
        default:
          break;
      }

      // Apply additional filters
      if (filters.status !== 'all') params.status = filters.status;
      if (filters.category !== 'all') params.category = filters.category;
      if (filters.urgency !== 'all') params.urgency = filters.urgency;
      if (filters.department !== 'all') params.department = filters.department;
      if (filters.dateRange) {
        params.startDate = filters.dateRange[0].format('YYYY-MM-DD');
        params.endDate = filters.dateRange[1].format('YYYY-MM-DD');
      }

      const response = await leaveApi.getAllLeaves(params);
      
      if (response.success) {
        const requests = Array.isArray(response.data) ? response.data : 
                        (response.data?.docs ? response.data.docs : []);
        setLeaveRequests(requests);
      } else {
        throw new Error(response.message || 'Failed to fetch leave requests');
      }

    } catch (error) {
      console.error('Error fetching leave requests:', error);
      setError(error.response?.data?.message || error.message || 'Failed to fetch leave requests');
      setLeaveRequests([]);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const response = await leaveApi.getHRAnalytics();
      if (response.success) {
        setAnalytics(response.data || {});
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await leaveApi.getDashboardStats();
      if (response.success) {
        setStats(response.data || {});
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const openDetailsModal = (record) => {
    setSelectedLeave(record);
    setDetailsModal(true);
  };

  const getStatusTag = (status) => {
    const statusMap = {
      'pending_supervisor': { color: 'orange', text: 'Pending Supervisor', icon: <ClockCircleOutlined /> },
      'pending_hr': { color: 'blue', text: 'Pending HR', icon: <ClockCircleOutlined /> },
      'pending_admin': { color: 'purple', text: 'Pending Admin', icon: <ClockCircleOutlined /> },
      'approved': { color: 'green', text: 'Approved', icon: <CheckCircleOutlined /> },
      'rejected': { color: 'red', text: 'Rejected', icon: <CloseCircleOutlined /> },
      'completed': { color: 'cyan', text: 'Completed', icon: <SafetyCertificateOutlined /> },
      'cancelled': { color: 'gray', text: 'Cancelled', icon: <CloseCircleOutlined /> },
      'in_progress': { color: 'blue', text: 'In Progress', icon: <CalendarOutlined /> }
    };

    const statusInfo = statusMap[status] || { color: 'default', text: status };
    return <Tag color={statusInfo.color} icon={statusInfo.icon}>{statusInfo.text}</Tag>;
  };

  const getCategoryTag = (category) => {
    const categoryMap = {
      'medical': { color: 'red', text: 'Medical', icon: <MedicineBoxOutlined /> },
      'vacation': { color: 'blue', text: 'Vacation', icon: <RestOutlined /> },
      'personal': { color: 'purple', text: 'Personal', icon: <UserOutlined /> },
      'emergency': { color: 'orange', text: 'Emergency', icon: <WarningOutlined /> },
      'family': { color: 'green', text: 'Family', icon: <TeamOutlined /> },
      'bereavement': { color: 'gray', text: 'Bereavement', icon: <HeartOutlined /> },
      'study': { color: 'cyan', text: 'Study', icon: <BookOutlined /> },
      'maternity': { color: 'pink', text: 'Maternity' },
      'paternity': { color: 'lime', text: 'Paternity' },
      'compensatory': { color: 'gold', text: 'Comp Time' },
      'sabbatical': { color: 'magenta', text: 'Sabbatical' },
      'unpaid': { color: 'volcano', text: 'Unpaid' }
    };

    const categoryInfo = categoryMap[category] || { color: 'default', text: category, icon: <FileTextOutlined /> };
    return <Tag color={categoryInfo.color} icon={categoryInfo.icon}>{categoryInfo.text}</Tag>;
  };

  const getUrgencyTag = (urgency) => {
    const urgencyMap = {
      'critical': { color: 'red', text: 'Critical' },
      'high': { color: 'orange', text: 'High' },
      'medium': { color: 'yellow', text: 'Medium' },
      'low': { color: 'green', text: 'Low' }
    };
    const urgencyInfo = urgencyMap[urgency] || { color: 'default', text: urgency };
    return <Tag color={urgencyInfo.color}>{urgencyInfo.text}</Tag>;
  };

  const leaveColumns = [
    {
      title: 'Employee',
      key: 'employee',
      render: (_, record) => (
        <div>
          <Text strong>{record.employee?.fullName || 'Unknown'}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.employee?.position || 'N/A'}
          </Text>
          <br />
          <Tag color="blue" size="small">{record.employee?.department || 'N/A'}</Tag>
        </div>
      ),
      width: 200
    },
    {
      title: 'Leave Details',
      key: 'leaveDetails',
      render: (_, record) => (
        <div>
          <div style={{ marginBottom: '4px' }}>
            {getCategoryTag(record.leaveCategory)}
          </div>
          <Text strong style={{ fontSize: '13px', display: 'block', marginTop: '4px' }}>
            {leaveApi.getLeaveTypeDisplay(record.leaveType)}
          </Text>
          <Text style={{ fontSize: '12px', color: '#666' }}>
            {dayjs(record.startDate).format('MMM DD')} - {dayjs(record.endDate).format('MMM DD, YYYY')}
          </Text>
          <br />
          <Text type="secondary" style={{ fontSize: '11px' }}>
            Duration: {record.totalDays} {record.totalDays === 1 ? 'day' : 'days'}
          </Text>
        </div>
      ),
      width: 250
    },
    {
      title: 'Priority & Status',
      key: 'priorityStatus',
      render: (_, record) => (
        <div>
          {getUrgencyTag(record.urgency)}
          <br />
          <div style={{ marginTop: '4px' }}>
            {getStatusTag(record.status)}
          </div>
        </div>
      ),
      width: 150
    },
    {
      title: 'Submitted',
      key: 'submitted',
      render: (_, record) => (
        <div>
          <div style={{ fontSize: '12px' }}>
            {record.submittedAt ? dayjs(record.submittedAt).format('MMM DD, YYYY') : 'Not submitted'}
          </div>
          <div style={{ fontSize: '10px', color: '#666' }}>
            {record.submittedAt ? dayjs(record.submittedAt).fromNow() : ''}
          </div>
        </div>
      ),
      sorter: (a, b) => new Date(a.submittedAt || 0) - new Date(b.submittedAt || 0),
      width: 120
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="small">
          <Button 
            type="link" 
            icon={<EyeOutlined />}
            onClick={() => openDetailsModal(record)}
            size="small"
          >
            Details
          </Button>
        </Space>
      ),
      width: 100
    }
  ];

  const getTabCounts = () => {
    const counts = {
      all: leaveRequests.length,
      pending: leaveRequests.filter(r => r.status?.includes('pending')).length,
      approved: leaveRequests.filter(r => ['approved', 'completed'].includes(r.status)).length,
      urgent: leaveRequests.filter(r => ['high', 'critical'].includes(r.urgency)).length,
      medical: leaveRequests.filter(r => r.leaveCategory === 'medical').length
    };
    return counts;
  };

  const tabCounts = getTabCounts();

  const statsCards = [
    {
      title: "Total Requests",
      value: stats.totalLeaves || 0,
      icon: <FileTextOutlined />,
      color: "#722ed1"
    },
    {
      title: "Pending Approval",
      value: tabCounts.pending,
      icon: <ClockCircleOutlined />,
      color: "#faad14"
    },
    {
      title: "On Leave Today",
      value: stats.onLeaveToday || 0,
      icon: <CalendarOutlined />,
      color: "#1890ff"
    },
    {
      title: "Urgent Requests",
      value: tabCounts.urgent,
      icon: <WarningOutlined />,
      color: "#ff4d4f"
    }
  ];

  const departmentStats = analytics.breakdown?.department || [];
  const statusStats = analytics.breakdown?.status || [];
  const categoryStats = analytics.breakdown?.category || [];

  const renderOverviewTab = () => (
    <div>
      {/* System Statistics */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        {statsCards.map((stat, index) => (
          <Col xs={12} sm={6} key={index}>
            <Card size="small">
              <Statistic
                title={stat.title}
                value={stat.value}
                valueStyle={{ color: stat.color }}
                prefix={stat.icon}
              />
            </Card>
          </Col>
        ))}
      </Row>

      {/* Department Breakdown */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col span={12}>
          <Card title="Leave Requests by Department" size="small">
            {departmentStats.length > 0 ? (
              <List
                size="small"
                dataSource={departmentStats}
                renderItem={item => (
                  <List.Item>
                    <div style={{ width: '100%' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text strong>{item._id || 'Unknown'}</Text>
                        <Text>{item.count} requests</Text>
                      </div>
                      <Progress 
                        percent={Math.round((item.count / (stats.totalLeaves || 1)) * 100)} 
                        size="small" 
                        showInfo={false}
                      />
                      <Text type="secondary" style={{ fontSize: '11px' }}>
                        {item.totalDays} days total
                      </Text>
                    </div>
                  </List.Item>
                )}
              />
            ) : (
              <Empty description="No department data available" />
            )}
          </Card>
        </Col>
        <Col span={12}>
          <Card title="Leave Categories" size="small">
            {categoryStats.length > 0 ? (
              <List
                size="small"
                dataSource={categoryStats}
                renderItem={item => (
                  <List.Item>
                    <div style={{ width: '100%' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          {getCategoryTag(item._id)}
                        </div>
                        <Text>{item.count} requests</Text>
                      </div>
                      <Progress 
                        percent={Math.round((item.count / (stats.totalLeaves || 1)) * 100)} 
                        size="small" 
                        showInfo={false}
                      />
                    </div>
                  </List.Item>
                )}
              />
            ) : (
              <Empty description="No category data available" />
            )}
          </Card>
        </Col>
      </Row>

      {/* Recent Activity */}
      <Card title="Recent Leave Activity" size="small">
        {leaveRequests.length > 0 ? (
          <List
            size="small"
            dataSource={leaveRequests.slice(0, 5)}
            renderItem={item => (
              <List.Item
                actions={[
                  <Button type="link" size="small" onClick={() => openDetailsModal(item)}>
                    View
                  </Button>
                ]}
              >
                <List.Item.Meta
                  avatar={<Avatar icon={<UserOutlined />} />}
                  title={
                    <div>
                      <Text strong>{item.employee?.fullName}</Text>
                      <span style={{ marginLeft: '8px' }}>
                        {getCategoryTag(item.leaveCategory)}
                      </span>
                    </div>
                  }
                  description={
                    <div>
                      <Text type="secondary">
                        {leaveApi.getLeaveTypeDisplay(item.leaveType)} - {item.totalDays} days
                      </Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: '11px' }}>
                        {item.submittedAt ? dayjs(item.submittedAt).fromNow() : 'Recently'}
                      </Text>
                    </div>
                  }
                />
                {getStatusTag(item.status)}
              </List.Item>
            )}
          />
        ) : (
          <Empty description="No recent activity" />
        )}
      </Card>
    </div>
  );

  const renderAnalyticsTab = () => (
    <div>
      <Alert
        message="Analytics Dashboard"
        description="Comprehensive leave management analytics and insights for system administrators."
        type="info"
        showIcon
        style={{ marginBottom: '24px' }}
      />
      
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col span={8}>
          <Card title="Leave Approval Rate" size="small">
            <div style={{ textAlign: 'center' }}>
              <Progress
                type="circle"
                percent={analytics.summary?.approvalRate || 0}
                format={percent => `${percent}%`}
              />
              <div style={{ marginTop: '16px' }}>
                <Text type="secondary">
                  {analytics.summary?.approvedCount || 0} of {analytics.summary?.totalRequests || 0} approved
                </Text>
              </div>
            </div>
          </Card>
        </Col>
        <Col span={8}>
          <Card title="Average Processing Time" size="small">
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#1890ff' }}>
                2.4
              </div>
              <div style={{ fontSize: '16px', color: '#666' }}>days</div>
              <div style={{ marginTop: '8px' }}>
                <Text type="secondary">Average approval time</Text>
              </div>
            </div>
          </Card>
        </Col>
        <Col span={8}>
          <Card title="Peak Leave Months" size="small">
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#52c41a' }}>
                Dec - Jan
              </div>
              <div style={{ marginTop: '8px' }}>
                <Text type="secondary">Holiday season peak</Text>
              </div>
              <div style={{ marginTop: '16px' }}>
                <Tag color="green">+45% requests</Tag>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Card title="Leave Status Distribution" size="small">
            {statusStats.length > 0 ? (
              <List
                size="small"
                dataSource={statusStats}
                renderItem={item => (
                  <List.Item>
                    <div style={{ width: '100%' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        {getStatusTag(item._id)}
                        <Text>{item.count} requests</Text>
                      </div>
                      <div style={{ marginTop: '4px' }}>
                        <Text type="secondary" style={{ fontSize: '11px' }}>
                          {item.totalDays} days total
                        </Text>
                      </div>
                    </div>
                  </List.Item>
                )}
              />
            ) : (
              <Empty description="No status data available" />
            )}
          </Card>
        </Col>
        <Col span={12}>
          <Card title="System Health" size="small">
            <List size="small">
              <List.Item>
                <div style={{ width: '100%' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Text>Pending Approvals</Text>
                    <Tag color={tabCounts.pending > 10 ? 'orange' : 'green'}>
                      {tabCounts.pending}
                    </Tag>
                  </div>
                </div>
              </List.Item>
              <List.Item>
                <div style={{ width: '100%' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Text>Urgent Requests</Text>
                    <Tag color={tabCounts.urgent > 5 ? 'red' : 'green'}>
                      {tabCounts.urgent}
                    </Tag>
                  </div>
                </div>
              </List.Item>
              <List.Item>
                <div style={{ width: '100%' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Text>Medical Certificates</Text>
                    <Tag color="blue">
                      {analytics.breakdown?.medicalCertificate?.find(m => m._id === true)?.count || 0}
                    </Tag>
                  </div>
                </div>
              </List.Item>
            </List>
          </Card>
        </Col>
      </Row>
    </div>
  );

  if (loading && leaveRequests.length === 0 && activeTab !== 'analytics') {
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
            <SettingOutlined /> Admin Leave Management
          </Title>
          <Space>
            <Button 
              icon={<ReloadOutlined />}
              onClick={fetchData}
              loading={loading}
            >
              Refresh
            </Button>
            <Button 
              icon={<DownloadOutlined />}
              onClick={() => message.info('Export functionality would be implemented here')}
            >
              Export
            </Button>
            <Button 
              icon={<BarChartOutlined />}
              type="primary"
              onClick={() => setActiveTab('analytics')}
            >
              View Analytics
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

        {/* Filters (only show for non-analytics tabs) */}
        {activeTab !== 'overview' && activeTab !== 'analytics' && (
          <Card size="small" style={{ marginBottom: '16px' }}>
            <Row gutter={16} align="middle">
              <Col>
                <Text strong>Filters:</Text>
              </Col>
              <Col>
                <Select
                  style={{ width: 150 }}
                  value={filters.status}
                  onChange={(value) => setFilters({...filters, status: value})}
                  placeholder="Status"
                >
                  <Select.Option value="all">All Status</Select.Option>
                  <Select.Option value="pending_supervisor">Pending Supervisor</Select.Option>
                  <Select.Option value="pending_hr">Pending HR</Select.Option>
                  <Select.Option value="pending_admin">Pending Admin</Select.Option>
                  <Select.Option value="approved">Approved</Select.Option>
                  <Select.Option value="rejected">Rejected</Select.Option>
                  <Select.Option value="completed">Completed</Select.Option>
                </Select>
              </Col>
              <Col>
                <Select
                  style={{ width: 160 }}
                  value={filters.category}
                  onChange={(value) => setFilters({...filters, category: value})}
                  placeholder="Category"
                >
                  <Select.Option value="all">All Categories</Select.Option>
                  <Select.Option value="medical">Medical</Select.Option>
                  <Select.Option value="vacation">Vacation</Select.Option>
                  <Select.Option value="personal">Personal</Select.Option>
                  <Select.Option value="family">Family</Select.Option>
                  <Select.Option value="emergency">Emergency</Select.Option>
                </Select>
              </Col>
              <Col>
                <Select
                  style={{ width: 120 }}
                  value={filters.urgency}
                  onChange={(value) => setFilters({...filters, urgency: value})}
                  placeholder="Urgency"
                >
                  <Select.Option value="all">All Urgency</Select.Option>
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
                  onClick={() => setFilters({
                    status: 'all',
                    category: 'all',
                    urgency: 'all',
                    department: 'all',
                    dateRange: null
                  })}
                >
                  Clear
                </Button>
              </Col>
            </Row>
          </Card>
        )}

        {/* Tabs */}
        <Tabs activeKey={activeTab} onChange={setActiveTab} style={{ marginBottom: '16px' }}>
          <TabPane 
            tab={<span><DashboardOutlined /> Overview</span>} 
            key="overview" 
          />
          <TabPane 
            tab={<Badge count={tabCounts.pending} offset={[10, 0]}><ClockCircleOutlined /> Pending</Badge>} 
            key="pending" 
          />
          <TabPane 
            tab={<Badge count={tabCounts.approved} offset={[10, 0]}><CheckCircleOutlined /> Approved</Badge>} 
            key="approved" 
          />
          <TabPane 
            tab={<Badge count={tabCounts.urgent} offset={[10, 0]}><WarningOutlined /> Urgent</Badge>} 
            key="urgent" 
          />
          <TabPane 
            tab={<Badge count={tabCounts.medical} offset={[10, 0]}><MedicineBoxOutlined /> Medical</Badge>} 
            key="medical" 
          />
          <TabPane 
            tab={<span><BarChartOutlined /> Analytics</span>} 
            key="analytics" 
          />
          <TabPane 
            tab={<Badge count={tabCounts.all} offset={[10, 0]}>All Requests</Badge>} 
            key="all" 
          />
        </Tabs>

        {/* Tab Content */}
        {activeTab === 'overview' && renderOverviewTab()}
        {activeTab === 'analytics' && renderAnalyticsTab()}
        
        {!['overview', 'analytics'].includes(activeTab) && (
          <>
            {leaveRequests.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="No leave requests found"
                >
                  <Text type="secondary">
                    No requests match your current filter criteria.
                  </Text>
                </Empty>
              </div>
            ) : (
              <>
                <Text type="secondary" style={{ marginBottom: '8px', display: 'block' }}>
                  Showing {leaveRequests.length} requests
                  {activeTab !== 'all' && ` in ${activeTab} category`}
                </Text>
                
                <Table 
                  columns={leaveColumns} 
                  dataSource={leaveRequests} 
                  loading={loading}
                  rowKey="_id"
                  pagination={{ 
                    pageSize: 15,
                    showSizeChanger: true,
                    showQuickJumper: true,
                    showTotal: (total, range) => 
                      `${range[0]}-${range[1]} of ${total} requests`
                  }}
                  scroll={{ x: 'max-content' }}
                />
              </>
            )}
          </>
        )}
      </Card>

      {/* Leave Details Modal */}
      <Modal
        title={
          <div>
            <EyeOutlined style={{ marginRight: '8px' }} />
            Leave Request Details
          </div>
        }
        visible={detailsModal}
        onCancel={() => {
          setDetailsModal(false);
          setSelectedLeave(null);
        }}
        footer={
          <Button onClick={() => setDetailsModal(false)}>
            Close
          </Button>
        }
        width={800}
      >
        {selectedLeave && (
          <div>
            {/* Employee Information */}
            <Card size="small" title="Employee Information" style={{ marginBottom: '16px' }}>
              <Row gutter={16}>
                <Col span={8}>
                  <Text strong>Name:</Text>
                  <div>{selectedLeave.employee?.fullName}</div>
                </Col>
                <Col span={8}>
                  <Text strong>Department:</Text>
                  <div>{selectedLeave.employee?.department}</div>
                </Col>
                <Col span={8}>
                  <Text strong>Position:</Text>
                  <div>{selectedLeave.employee?.position}</div>
                </Col>
              </Row>
            </Card>

            {/* Leave Information */}
            <Card size="small" title="Leave Information" style={{ marginBottom: '16px' }}>
              <Descriptions size="small" column={2}>
                <Descriptions.Item label="Category">
                  {getCategoryTag(selectedLeave.leaveCategory)}
                </Descriptions.Item>
                <Descriptions.Item label="Type">
                  {leaveApi.getLeaveTypeDisplay(selectedLeave.leaveType)}
                </Descriptions.Item>
                <Descriptions.Item label="Start Date">
                  {dayjs(selectedLeave.startDate).format('MMMM DD, YYYY')}
                </Descriptions.Item>
                <Descriptions.Item label="End Date">
                  {dayjs(selectedLeave.endDate).format('MMMM DD, YYYY')}
                </Descriptions.Item>
                <Descriptions.Item label="Duration">
                  {selectedLeave.totalDays} days
                </Descriptions.Item>
                <Descriptions.Item label="Urgency">
                  {getUrgencyTag(selectedLeave.urgency)}
                </Descriptions.Item>
                <Descriptions.Item label="Status">
                  {getStatusTag(selectedLeave.status)}
                </Descriptions.Item>
                <Descriptions.Item label="Submitted">
                  {selectedLeave.submittedAt ? dayjs(selectedLeave.submittedAt).format('MMMM DD, YYYY HH:mm') : 'N/A'}
                </Descriptions.Item>
              </Descriptions>
            </Card>

            {/* Reason */}
            <Card size="small" title="Reason for Leave" style={{ marginBottom: '16px' }}>
              <div style={{ 
                padding: '8px 12px', 
                backgroundColor: '#f5f5f5', 
                borderRadius: '4px' 
              }}>
                {selectedLeave.reason}
              </div>
            </Card>

            {/* Approval History */}
            {(selectedLeave.supervisorDecision || selectedLeave.hrReview) && (
              <Card size="small" title="Approval History">
                {selectedLeave.supervisorDecision && (
                  <div style={{ marginBottom: '12px' }}>
                    <Text strong>Supervisor Review:</Text>
                    <div>Decision: {selectedLeave.supervisorDecision.decision}</div>
                    <div>Comments: {selectedLeave.supervisorDecision.comments || 'No comments'}</div>
                    <div>Date: {selectedLeave.supervisorDecision.decisionDate ? dayjs(selectedLeave.supervisorDecision.decisionDate).format('MMMM DD, YYYY') : 'N/A'}</div>
                  </div>
                )}
                
                {selectedLeave.hrReview && (
                  <div>
                    <Text strong>HR Review:</Text>
                    <div>Decision: {selectedLeave.hrReview.decision}</div>
                    <div>Comments: {selectedLeave.hrReview.comments || 'No comments'}</div>
                    <div>Date: {selectedLeave.hrReview.decisionDate ? dayjs(selectedLeave.hrReview.decisionDate).format('MMMM DD, YYYY') : 'N/A'}</div>
                  </div>
                )}
              </Card>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminLeaveManagementComplete;