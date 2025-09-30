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
  Select,
  DatePicker,
  Row,
  Col,
  Progress,
  Statistic,
  message,
  Tabs,
  Collapse,
  Empty,
  Modal,
  notification
} from 'antd';
import { 
  CalendarOutlined, 
  CheckCircleOutlined, 
  CloseCircleOutlined, 
  ClockCircleOutlined,
  PlusOutlined,
  EyeOutlined,
  ReloadOutlined,
  UserOutlined,
  HeartOutlined,
  WarningOutlined,
  FileTextOutlined,
  SafetyCertificateOutlined,
  MedicineBoxOutlined,
  HomeOutlined,
  TeamOutlined,
  BookOutlined,
  RestOutlined,
  DownloadOutlined
} from '@ant-design/icons';
import leaveApi from '../../services/leaveApi';
import { useSelector } from 'react-redux';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { TabPane } = Tabs;
const { Panel } = Collapse;

const EmployeeLeaveManagement = () => {
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [leaveBalances, setLeaveBalances] = useState({});
  const [leaveTypes, setLeaveTypes] = useState({});
  const [filters, setFilters] = useState({
    status: 'all',
    category: 'all',
    type: 'all',
    dateRange: null
  });
  const [activeTab, setActiveTab] = useState('all');
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    fetchAllData();
  }, []);

  // Separate effect for filter changes to avoid infinite loops
  useEffect(() => {
    if (!loading) {
      fetchLeaveRequests();
    }
  }, [filters]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchLeaveRequests(),
        fetchLeaveBalances(),
        fetchLeaveTypes()
      ]);
    } catch (error) {
      console.error('Error fetching all data:', error);
      setError('Failed to load leave data. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaveRequests = async () => {
    try {
      setError(null);

      const params = {};
      if (filters.status !== 'all') params.status = filters.status;
      if (filters.category !== 'all') params.category = filters.category;
      if (filters.type !== 'all') params.type = filters.type;
      if (filters.dateRange) {
        params.startDate = filters.dateRange[0].format('YYYY-MM-DD');
        params.endDate = filters.dateRange[1].format('YYYY-MM-DD');
      }

      console.log('Fetching leave requests with params:', params);
      const response = await leaveApi.getEmployeeLeaves(params);
      console.log('Leave requests response:', response);
      
      if (response.success) {
        // Handle both paginated and direct array responses
        const leaves = response.data?.docs || response.data || [];
        setLeaveRequests(Array.isArray(leaves) ? leaves : []);
      } else {
        throw new Error(response.message || 'Failed to fetch leave requests');
      }

    } catch (error) {
      console.error('Error fetching leave requests:', error);
      setError(error.response?.data?.message || error.message || 'Failed to fetch leave requests');
      setLeaveRequests([]);
    }
  };

  const fetchLeaveBalances = async () => {
    try {
      console.log('Fetching leave balances...');
      const response = await leaveApi.getEmployeeLeaveBalance();
      console.log('Leave balances response:', response);
      
      if (response.success) {
        setLeaveBalances(response.data || {});
      }
    } catch (error) {
      console.error('Error fetching leave balances:', error);
      // Set default balances if API fails
      setLeaveBalances({
        vacation: { totalDays: 21, usedDays: 0, pendingDays: 0, remainingDays: 21 },
        medical: { totalDays: 10, usedDays: 0, pendingDays: 0, remainingDays: 10 },
        personal: { totalDays: 5, usedDays: 0, pendingDays: 0, remainingDays: 5 }
      });
    }
  };

  const fetchLeaveTypes = async () => {
    try {
      console.log('Fetching leave types...');
      const response = await leaveApi.getLeaveTypes();
      console.log('Leave types response:', response);
      
      if (response.success) {
        setLeaveTypes(response.data || {});
      }
    } catch (error) {
      console.error('Error fetching leave types:', error);
    }
  };

  const handleRefresh = async () => {
    await fetchAllData();
    message.success('Data refreshed successfully');
  };

  const handleDeleteDraft = (leaveId) => {
    Modal.confirm({
      title: 'Delete Draft',
      content: 'Are you sure you want to delete this draft leave request? This action cannot be undone.',
      okText: 'Yes, Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          const response = await leaveApi.deleteLeave(leaveId);
          if (response.success) {
            message.success('Draft deleted successfully');
            await fetchLeaveRequests(); // Refresh the list
          } else {
            message.error(response.message || 'Failed to delete draft');
          }
        } catch (error) {
          console.error('Delete draft error:', error);
          message.error(error.response?.data?.message || 'Failed to delete draft');
        }
      }
    });
  };

  // Helper function to get today's date for quick filtering
  const filterByToday = () => {
    const today = dayjs();
    setFilters({
      ...filters,
      dateRange: [today, today]
    });
  };

  // Helper function to filter current month
  const filterByCurrentMonth = () => {
    const startOfMonth = dayjs().startOf('month');
    const endOfMonth = dayjs().endOf('month');
    setFilters({
      ...filters,
      dateRange: [startOfMonth, endOfMonth]
    });
  };

  // Helper function to export leave data
  const exportLeaveData = () => {
    try {
      const csvContent = "data:text/csv;charset=utf-8," + 
        "Leave ID,Type,Category,Start Date,End Date,Days,Status,Submitted\n" +
        filteredRequests.map(record => 
          `${record.leaveNumber || 'N/A'},${getLeaveTypeDisplay(record.leaveType)},${record.leaveCategory},${dayjs(record.startDate).format('YYYY-MM-DD')},${dayjs(record.endDate).format('YYYY-MM-DD')},${record.totalDays},${record.status},${record.submittedAt ? dayjs(record.submittedAt).format('YYYY-MM-DD') : 'N/A'}`
        ).join("\n");
      
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `my_leave_requests_${dayjs().format('YYYY-MM-DD')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      message.success('Leave data exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      message.error('Failed to export data');
    }
  };

  const getStatusTag = (status) => {
    const statusMap = {
      'pending_supervisor': { 
        color: 'orange', 
        icon: <ClockCircleOutlined />, 
        text: 'Pending Supervisor' 
      },
      'pending_hr': { 
        color: 'blue', 
        icon: <ClockCircleOutlined />, 
        text: 'Pending HR' 
      },
      'pending_admin': { 
        color: 'purple', 
        icon: <ClockCircleOutlined />, 
        text: 'Pending Admin' 
      },
      'approved': { 
        color: 'green', 
        icon: <CheckCircleOutlined />, 
        text: 'Approved' 
      },
      'rejected': { 
        color: 'red', 
        icon: <CloseCircleOutlined />, 
        text: 'Rejected' 
      },
      'completed': { 
        color: 'cyan', 
        icon: <SafetyCertificateOutlined />, 
        text: 'Completed' 
      },
      'cancelled': { 
        color: 'gray', 
        icon: <CloseCircleOutlined />, 
        text: 'Cancelled' 
      },
      'draft': { 
        color: 'purple', 
        icon: <FileTextOutlined />, 
        text: 'Draft' 
      },
      'in_progress': { 
        color: 'blue', 
        icon: <CalendarOutlined />, 
        text: 'In Progress' 
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

  const getUrgencyTag = (urgency) => {
    const urgencyMap = {
      'critical': { color: 'red', text: 'Critical' },
      'high': { color: 'orange', text: 'High' },
      'medium': { color: 'yellow', text: 'Medium' },
      'low': { color: 'green', text: 'Low' }
    };

    const urgencyInfo = urgencyMap[urgency] || { color: 'default', text: urgency };

    return (
      <Tag color={urgencyInfo.color}>
        {urgencyInfo.text}
      </Tag>
    );
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

    const categoryInfo = categoryMap[category] || { 
      color: 'default', 
      text: category?.replace('_', ' ') || 'Other',
      icon: <FileTextOutlined />
    };

    return (
      <Tag color={categoryInfo.color} icon={categoryInfo.icon}>
        {categoryInfo.text}
      </Tag>
    );
  };

  const getLeaveTypeDisplay = (type) => {
    // Find the type in leaveTypes data
    for (const category of Object.values(leaveTypes)) {
      if (category.types) {
        const foundType = category.types.find(t => t.value === type);
        if (foundType) {
          return foundType.label;
        }
      }
    }
    return leaveApi.getLeaveTypeDisplay(type);
  };

  const leaveColumns = [
    {
      title: 'Leave ID',
      key: 'leaveId',
      render: (_, record) => (
        <Text code style={{ fontSize: '12px' }}>
          {record.leaveNumber || record.displayId || `LEA-${record._id?.slice(-6).toUpperCase()}`}
        </Text>
      ),
      width: 120
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
            {getLeaveTypeDisplay(record.leaveType)}
          </Text>
          <Text style={{ fontSize: '12px', color: '#666' }}>
            {dayjs(record.startDate).format('MMM DD')} - {dayjs(record.endDate).format('MMM DD, YYYY')}
          </Text>
          <br />
          <Text type="secondary" style={{ fontSize: '11px' }}>
            Duration: {record.totalDays} {record.totalDays === 1 ? 'day' : 'days'}
          </Text>
          <br />
          <Tooltip title={record.reason}>
            <Text ellipsis style={{ fontSize: '11px', color: '#666', display: 'block', maxWidth: '200px', marginTop: '2px' }}>
              {record.reason && record.reason.length > 50 ? 
                `${record.reason.substring(0, 50)}...` : 
                record.reason || 'No reason provided'
              }
            </Text>
          </Tooltip>
        </div>
      ),
      width: 280
    },
    {
      title: 'Medical Info',
      key: 'medicalInfo',
      render: (_, record) => {
        if (record.leaveCategory !== 'medical') {
          return <Text type="secondary" style={{ fontSize: '11px' }}>N/A</Text>;
        }
        
        return (
          <div>
            <div style={{ marginBottom: '4px' }}>
              <Text strong style={{ fontSize: '11px' }}>Doctor:</Text>
              <br />
              <Text style={{ fontSize: '10px' }}>{record.medicalInfo?.doctorDetails?.name || 'N/A'}</Text>
            </div>
            <div style={{ marginBottom: '4px' }}>
              <Text strong style={{ fontSize: '11px' }}>Hospital:</Text>
              <br />
              <Text style={{ fontSize: '10px' }}>{record.medicalInfo?.doctorDetails?.hospital || 'N/A'}</Text>
            </div>
            <div>
              {record.medicalInfo?.medicalCertificate?.provided ? (
                <Tag color="green" size="small">Certificate Provided</Tag>
              ) : (
                <Tag color="orange" size="small">No Certificate</Tag>
              )}
            </div>
          </div>
        );
      },
      width: 180
    },
    {
      title: 'Priority',
      key: 'priority',
      render: (_, record) => (
        <div>
          {getUrgencyTag(record.urgency)}
          <br />
          <Tag color={record.priority === 'critical' ? 'red' : record.priority === 'urgent' ? 'orange' : 'default'} 
               size="small" style={{ marginTop: '2px' }}>
            {(record.priority || 'routine').replace('_', ' ').toUpperCase()}
          </Tag>
        </div>
      ),
      width: 120
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => getStatusTag(status),
      filters: [
        { text: 'Draft', value: 'draft' },
        { text: 'Pending Supervisor', value: 'pending_supervisor' },
        { text: 'Pending HR', value: 'pending_hr' },
        { text: 'Pending Admin', value: 'pending_admin' },
        { text: 'Approved', value: 'approved' },
        { text: 'In Progress', value: 'in_progress' },
        { text: 'Completed', value: 'completed' },
        { text: 'Rejected', value: 'rejected' }
      ],
      onFilter: (value, record) => record.status === value,
      width: 150
    },
    {
      title: 'Submitted',
      dataIndex: 'submittedAt',
      key: 'submittedAt',
      render: (date) => (
        <div>
          <div style={{ fontSize: '12px' }}>
            {date ? dayjs(date).format('MMM DD, YYYY') : 'Not submitted'}
          </div>
          <div style={{ fontSize: '10px', color: '#666' }}>
            {date ? dayjs(date).fromNow() : ''}
          </div>
        </div>
      ),
      sorter: (a, b) => new Date(a.submittedAt || 0) - new Date(b.submittedAt || 0),
      defaultSortOrder: 'descend',
      width: 120
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
              onClick={() => navigate(`/employee/leave/${record._id}`)}
              size="small"
            >
              View
            </Button>
          </Tooltip>
          {/* Show edit/delete options for draft status */}
          {record.status === 'draft' && (
            <>
              <Tooltip title="Edit Draft">
                <Button 
                  type="link" 
                  icon={<FileTextOutlined />}
                  onClick={() => navigate(`/employee/leave/edit/${record._id}`)}
                  size="small"
                >
                  Edit
                </Button>
              </Tooltip>
              <Tooltip title="Delete Draft">
                <Button 
                  type="link" 
                  danger
                  icon={<CloseCircleOutlined />}
                  onClick={() => handleDeleteDraft(record._id)}
                  size="small"
                >
                  Delete
                </Button>
              </Tooltip>
            </>
          )}
        </Space>
      ),
      width: 120
    }
  ];

  const getLeaveBalanceCards = () => {
    const balanceCategories = ['vacation', 'medical', 'personal', 'emergency', 'family', 'bereavement', 'study'];
    
    return (
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        {balanceCategories.map(category => {
          const balance = leaveBalances[category] || { totalDays: 0, usedDays: 0, pendingDays: 0, remainingDays: 0 };
          
          // Safely calculate percentages
          const totalDays = Math.max(balance.totalDays, 1); // Avoid division by zero
          const usedPercentage = (balance.usedDays / totalDays) * 100;
          const pendingPercentage = (balance.pendingDays / totalDays) * 100;
          const remainingPercentage = (balance.remainingDays / totalDays) * 100;
          
          let statusColor = '#52c41a'; // Green
          if (remainingPercentage < 20) statusColor = '#ff4d4f'; // Red
          else if (remainingPercentage < 50) statusColor = '#faad14'; // Orange
          
          return (
            <Col xs={12} sm={8} md={6} lg={4} xl={3} key={category}>
              <Card size="small" hoverable>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '14px', fontWeight: 'bold', textTransform: 'capitalize', marginBottom: '8px' }}>
                    {category}
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: statusColor, marginBottom: '4px' }}>
                    {balance.remainingDays}
                  </div>
                  <div style={{ fontSize: '11px', color: '#666', marginBottom: '8px' }}>
                    / {balance.totalDays} days
                  </div>
                  <Progress
                    percent={Math.min(100, Math.max(0, remainingPercentage))}
                    strokeColor={statusColor}
                    trailColor="#f0f0f0"
                    strokeWidth={6}
                    showInfo={false}
                  />
                  <div style={{ fontSize: '10px', color: '#999', marginTop: '4px' }}>
                    Used: {balance.usedDays} | Pending: {balance.pendingDays}
                  </div>
                </div>
              </Card>
            </Col>
          );
        })}
      </Row>
    );
  };

  const getStatsCards = () => {
    const totalRequests = leaveRequests.length;
    const pendingRequests = leaveRequests.filter(r => r.status?.includes('pending')).length;
    const approvedRequests = leaveRequests.filter(r => r.status === 'approved').length;
    const inProgressRequests = leaveRequests.filter(r => r.status === 'in_progress').length;

    return (
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="Total Requests"
              value={totalRequests}
              valueStyle={{ color: '#722ed1' }}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="Pending Approval"
              value={pendingRequests}
              valueStyle={{ color: '#faad14' }}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="Approved"
              value={approvedRequests}
              valueStyle={{ color: '#52c41a' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="In Progress"
              value={inProgressRequests}
              valueStyle={{ color: '#1890ff' }}
              prefix={<CalendarOutlined />}
            />
          </Card>
        </Col>
      </Row>
    );
  };

  const filteredRequests = leaveRequests.filter(request => {
    if (activeTab !== 'all' && request.leaveCategory !== activeTab) return false;
    if (filters.status !== 'all' && request.status !== filters.status) return false;
    if (filters.category !== 'all' && request.leaveCategory !== filters.category) return false;
    if (filters.type !== 'all' && request.leaveType !== filters.type) return false;
    return true;
  });

  const getTabCounts = () => {
    const counts = { all: leaveRequests.length };
    
    ['medical', 'vacation', 'personal', 'family', 'emergency', 'bereavement', 'study'].forEach(category => {
      counts[category] = leaveRequests.filter(r => r.leaveCategory === category).length;
    });
    
    return counts;
  };

  const tabCounts = getTabCounts();

  if (loading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Spin size="large" />
        <div style={{ marginTop: '16px' }}>Loading leave requests...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <Title level={2} style={{ margin: 0 }}>
            <CalendarOutlined /> My Leave Requests
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
              icon={<PlusOutlined />}
              onClick={() => navigate('/employee/leave/new')}
            >
              New Leave Request
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

        {/* Leave Balance Overview */}
        <Card title="Leave Balance Overview" size="small" style={{ marginBottom: '16px' }}>
          {Object.keys(leaveBalances).length > 0 ? (
            getLeaveBalanceCards()
          ) : (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <Spin size="small" />
              <Text style={{ marginLeft: '8px' }}>Loading leave balances...</Text>
            </div>
          )}
        </Card>

        {/* Stats Cards */}
        {getStatsCards()}

        {/* Quick Actions */}
        <Card size="small" title="Quick Actions" style={{ marginBottom: '16px' }}>
          <Row gutter={16}>
            <Col>
              <Button 
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => navigate('/employee/leave/new')}
              >
                New Leave Request
              </Button>
            </Col>
            <Col>
              <Button 
                icon={<CalendarOutlined />}
                onClick={() => setFilters({ ...filters, status: 'pending_supervisor' })}
              >
                View Pending Requests
              </Button>
            </Col>
            <Col>
              <Button 
                icon={<CheckCircleOutlined />}
                onClick={() => setFilters({ ...filters, status: 'approved' })}
              >
                View Approved
              </Button>
            </Col>
            <Col>
              <Button 
                icon={<FileTextOutlined />}
                onClick={() => setFilters({ ...filters, status: 'draft' })}
              >
                View Drafts
              </Button>
            </Col>
            <Col>
              <Button 
                icon={<ReloadOutlined />}
                onClick={handleRefresh}
                loading={loading}
              >
                Refresh Data
              </Button>
            </Col>
          </Row>
        </Card>

        {/* Important Notices */}
        <Collapse style={{ marginBottom: '16px' }}>
          <Panel header="Leave Policy Guidelines" key="guidelines">
            <Alert
              message="Leave Policy Reminders"
              description={
                <div>
                  <p><strong>Medical Certificate:</strong> Required for medical leaves exceeding 1 day.</p>
                  <p><strong>Advance Notice:</strong> Submit requests as early as possible, except for emergencies.</p>
                  <p><strong>Emergency Leave:</strong> Contact supervisor immediately, submit request within 24 hours.</p>
                  <p><strong>Wellness:</strong> All leave types are supported - prioritize your wellbeing and work-life balance.</p>
                  <p><strong>Vacation:</strong> Use your vacation days! They're important for rest and rejuvenation.</p>
                  <p><strong>Family:</strong> Family care leaves are fully supported and confidential.</p>
                </div>
              }
              type="info"
              showIcon
              style={{ marginBottom: '16px' }}
            />
          </Panel>
        </Collapse>

        {/* Filters */}
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
                <Select.Option value="draft">Draft</Select.Option>
                <Select.Option value="pending_supervisor">Pending Supervisor</Select.Option>
                <Select.Option value="pending_hr">Pending HR</Select.Option>
                <Select.Option value="pending_admin">Pending Admin</Select.Option>
                <Select.Option value="approved">Approved</Select.Option>
                <Select.Option value="in_progress">In Progress</Select.Option>
                <Select.Option value="completed">Completed</Select.Option>
                <Select.Option value="rejected">Rejected</Select.Option>
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
                <Select.Option value="bereavement">Bereavement</Select.Option>
                <Select.Option value="study">Study</Select.Option>
                <Select.Option value="maternity">Maternity</Select.Option>
                <Select.Option value="paternity">Paternity</Select.Option>
                <Select.Option value="compensatory">Compensatory</Select.Option>
                <Select.Option value="sabbatical">Sabbatical</Select.Option>
                <Select.Option value="unpaid">Unpaid</Select.Option>
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
                  type: 'all',
                  dateRange: null
                })}
              >
                Clear Filters
              </Button>
            </Col>
            <Col>
              <Button onClick={filterByCurrentMonth}>
                This Month
              </Button>
            </Col>
            <Col>
              <Button 
                icon={<DownloadOutlined />}
                onClick={exportLeaveData} 
                disabled={filteredRequests.length === 0}
              >
                Export CSV
              </Button>
            </Col>
          </Row>
        </Card>

        {/* Leave Categories Tabs */}
        <Tabs activeKey={activeTab} onChange={setActiveTab} style={{ marginBottom: '16px' }}>
          <TabPane 
            tab={<Badge count={tabCounts.all} offset={[10, 0]}>All Leaves</Badge>} 
            key="all" 
          />
          <TabPane 
            tab={<Badge count={tabCounts.medical} offset={[10, 0]}><MedicineBoxOutlined /> Medical</Badge>} 
            key="medical" 
          />
          <TabPane 
            tab={<Badge count={tabCounts.vacation} offset={[10, 0]}><RestOutlined /> Vacation</Badge>} 
            key="vacation" 
          />
          <TabPane 
            tab={<Badge count={tabCounts.personal} offset={[10, 0]}><UserOutlined /> Personal</Badge>} 
            key="personal" 
          />
          <TabPane 
            tab={<Badge count={tabCounts.family} offset={[10, 0]}><TeamOutlined /> Family</Badge>} 
            key="family" 
          />
          <TabPane 
            tab={<Badge count={tabCounts.emergency} offset={[10, 0]}><WarningOutlined /> Emergency</Badge>} 
            key="emergency" 
          />
          <TabPane 
            tab={<Badge count={tabCounts.study} offset={[10, 0]}><BookOutlined /> Study</Badge>} 
            key="study" 
          />
        </Tabs>

        {/* Important Notifications */}
        {/* Low Balance Warnings */}
        {Object.entries(leaveBalances).map(([category, balance]) => {
          if (balance.remainingDays <= 2 && balance.totalDays > 0) {
            return (
              <Alert
                key={category}
                message={`Low ${category.charAt(0).toUpperCase() + category.slice(1)} Leave Balance`}
                description={`You have only ${balance.remainingDays} ${category} leave days remaining this year. Plan accordingly and consider your wellbeing needs.`}
                type="warning"
                showIcon
                style={{ marginBottom: '16px' }}
              />
            );
          }
          return null;
        })}

        {/* Overdue Requests Alert */}
        {leaveRequests.filter(r => 
          r.status?.includes('pending') && 
          dayjs().diff(dayjs(r.submittedAt), 'days') > 3
        ).length > 0 && (
          <Alert
            message="Overdue Requests"
            description={`You have ${leaveRequests.filter(r => r.status?.includes('pending') && dayjs().diff(dayjs(r.submittedAt), 'days') > 3).length} request(s) pending for more than 3 days. Consider following up with your supervisor or HR.`}
            type="info"
            showIcon
            action={
              <Button 
                size="small" 
                onClick={() => setFilters({ ...filters, status: 'pending_supervisor' })}
              >
                View Pending
              </Button>
            }
            style={{ marginBottom: '16px' }}
          />
        )}

        {/* Upcoming Leave Reminder */}
        {leaveRequests.filter(r => 
          r.status === 'approved' && 
          dayjs(r.startDate).isAfter(dayjs()) && 
          dayjs(r.startDate).diff(dayjs(), 'days') <= 7
        ).length > 0 && (
          <Alert
            message="Upcoming Approved Leave"
            description={`You have approved leave starting within the next 7 days. Make sure your work coverage is properly arranged.`}
            type="success"
            showIcon
            style={{ marginBottom: '16px' }}
          />
        )}

        {filteredRequests.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                leaveRequests.length === 0 
                  ? "You haven't submitted any leave requests yet. Remember to take time off for your wellbeing and work-life balance."
                  : "No requests match your current filter criteria. Try adjusting the filters above."
              }
            >
              {leaveRequests.length === 0 && (
                <Button 
                  type="primary" 
                  icon={<PlusOutlined />}
                  onClick={() => navigate('/employee/leave/new')}
                >
                  Create Leave Request
                </Button>
              )}
            </Empty>
          </div>
        ) : (
          <>
            <Text type="secondary" style={{ marginBottom: '8px', display: 'block' }}>
              Showing {filteredRequests.length} of {leaveRequests.length} requests
              {activeTab !== 'all' && ` in ${activeTab} category`}
            </Text>
            
            <Table 
              columns={leaveColumns} 
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
                if (record.urgency === 'critical') {
                  return 'critical-leave-row';
                }
                if (record.status?.includes('pending')) {
                  return 'pending-leave-row';
                }
                if (record.status === 'rejected') {
                  return 'rejected-leave-row';
                }
                if (record.status === 'approved') {
                  return 'approved-leave-row';
                }
                return '';
              }}
            />
          </>
        )}
      </Card>

      <style jsx>{`
        .critical-leave-row {
          background-color: #fff1f0 !important;
          border-left: 4px solid #ff4d4f !important;
        }
        .critical-leave-row:hover {
          background-color: #ffe7e6 !important;
        }
        .pending-leave-row {
          background-color: #fffbf0 !important;
          border-left: 3px solid #faad14 !important;
        }
        .pending-leave-row:hover {
          background-color: #fff1d6 !important;
        }
        .rejected-leave-row {
          background-color: #fff2f0 !important;
          border-left: 2px solid #ff7875 !important;
        }
        .rejected-leave-row:hover {
          background-color: #ffe7e6 !important;
        }
        .approved-leave-row {
          background-color: #f6ffed !important;
          border-left: 2px solid #52c41a !important;
        }
        .approved-leave-row:hover {
          background-color: #d9f7be !important;
        }
      `}</style>
    </div>
  );
};

export default EmployeeLeaveManagement;



