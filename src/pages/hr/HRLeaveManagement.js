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
  Progress,
  Tabs,
  Tooltip,
  Descriptions,
  message,
  Badge,
  Collapse,
  List,
  Avatar,
  Checkbox
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
  UploadOutlined,
  DownloadOutlined,
  FilterOutlined
} from '@ant-design/icons';
import leaveApi from '../../services/leaveApi';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;
const { RangePicker } = DatePicker;
const { TextArea } = Input;
const { TabPane } = Tabs;
const { Panel } = Collapse;

const HRLeaveManagement = () => {
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reviewModal, setReviewModal] = useState(false);
  const [bulkActionModal, setBulkActionModal] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [selectedRows, setSelectedRows] = useState([]);
  const [reviewForm] = Form.useForm();
  const [bulkForm] = Form.useForm();
  const [activeTab, setActiveTab] = useState('all');
  const [filters, setFilters] = useState({
    status: 'all',
    category: 'all',
    type: 'all',
    urgency: 'all',
    department: 'all',
    dateRange: null
  });
  const [leaveTypes, setLeaveTypes] = useState({});
  const [analytics, setAnalytics] = useState({});
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    fetchLeaveRequests();
    fetchLeaveTypes();
    fetchAnalytics();
  }, [filters, activeTab]);

  const fetchLeaveRequests = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {};
      
      // Apply tab-specific filters
      switch (activeTab) {
        case 'pending':
          params.status = 'pending_hr';
          break;
        case 'approved':
          // Will filter on frontend for multiple statuses
          break;
        case 'urgent':
          params.urgent = 'true';
          break;
        case 'medical':
          params.category = 'medical';
          break;
        case 'family':
          params.category = 'family';
          break;
        case 'vacation':
          params.category = 'vacation';
          break;
      }

      // Apply additional filters
      if (filters.status !== 'all') params.status = filters.status;
      if (filters.category !== 'all') params.category = filters.category;
      if (filters.type !== 'all') params.type = filters.type;
      if (filters.urgency !== 'all') params.urgency = filters.urgency;
      if (filters.department !== 'all') params.department = filters.department;
      if (filters.dateRange) {
        params.startDate = filters.dateRange[0].format('YYYY-MM-DD');
        params.endDate = filters.dateRange[1].format('YYYY-MM-DD');
      }

      const response = await leaveApi.getHRLeaves(params);
      
      if (response.success) {
        let requests = response.data || [];
        
        // Apply frontend filters for complex cases
        if (activeTab === 'approved') {
          requests = requests.filter(r => r.status === 'approved' || r.status === 'completed');
        }
        
        setLeaveRequests(requests);
      } else {
        throw new Error(response.message || 'Failed to fetch leave requests');
      }

    } catch (error) {
      console.error('Error fetching leave requests:', error);
      setError(error.response?.data?.message || error.message || 'Failed to fetch leave requests');
      setLeaveRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaveTypes = async () => {
    try {
      const response = await leaveApi.getLeaveTypes();
      if (response.success) {
        setLeaveTypes(response.data || {});
      }
    } catch (error) {
      console.error('Error fetching leave types:', error);
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

  const handleHRReview = async (values) => {
    try {
      setLoading(true);

      const reviewData = {
        decision: values.decision,
        comments: values.comments,
        conditions: values.conditions,
        medicalCertificateRequired: values.medicalCertificateRequired || false,
        extendedLeaveGranted: values.extendedLeaveGranted || false,
        returnToWorkCertificateRequired: values.returnToWorkCertificateRequired || false,
        reviewNotes: values.reviewNotes,
        followUpActions: values.followUpActions,
        additionalSupport: values.additionalSupport
      };

      const response = await leaveApi.processHRDecision(selectedLeave._id, reviewData);

      if (response.success) {
        message.success(`Leave request ${values.decision}d by HR successfully`);

        if (response.notifications) {
          const { sent, failed } = response.notifications;
          if (sent > 0) {
            message.success(`${sent} notification(s) sent successfully`);
          }
          if (failed > 0) {
            message.warning(`${failed} notification(s) failed to send`);
          }
        }

        await fetchLeaveRequests();
        setReviewModal(false);
        setSelectedLeave(null);
        reviewForm.resetFields();

      } else {
        throw new Error(response.message || 'Failed to process HR review');
      }

    } catch (error) {
      console.error('Error submitting HR review:', error);
      message.error(error.response?.data?.message || 'Failed to process HR review');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkAction = async (values) => {
    try {
      setLoading(true);

      let response;
      if (values.action === 'approve') {
        response = await leaveApi.bulkApprove(selectedRows, values.comments);
      } else if (values.action === 'reject') {
        response = await leaveApi.bulkReject(selectedRows, values.comments);
      }

      if (response.success) {
        message.success(`Bulk ${values.action} completed successfully`);
        await fetchLeaveRequests();
        setBulkActionModal(false);
        setSelectedRows([]);
        bulkForm.resetFields();
      } else {
        throw new Error(response.message || 'Failed to process bulk action');
      }

    } catch (error) {
      console.error('Error processing bulk action:', error);
      message.error(error.response?.data?.message || 'Failed to process bulk action');
    } finally {
      setLoading(false);
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
      'in_progress': { 
        color: 'blue', 
        icon: <CalendarOutlined />, 
        text: 'In Progress' 
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

  const getUrgencyTag = (urgency) => {
    const urgencyMap = {
      'critical': { color: 'red', text: 'Critical', icon: '🚨' },
      'high': { color: 'orange', text: 'High', icon: '⚡' },
      'medium': { color: 'yellow', text: 'Medium', icon: '⚠️' },
      'low': { color: 'green', text: 'Low', icon: '📝' }
    };

    const urgencyInfo = urgencyMap[urgency] || { color: 'default', text: urgency, icon: '📋' };

    return (
      <Tag color={urgencyInfo.color}>
        {urgencyInfo.icon} {urgencyInfo.text}
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
      'maternity': { color: 'pink', text: 'Maternity', icon: '🤱' },
      'paternity': { color: 'lime', text: 'Paternity', icon: '👨‍👩‍👧‍👦' },
      'compensatory': { color: 'gold', text: 'Comp Time', icon: '⏰' },
      'sabbatical': { color: 'magenta', text: 'Sabbatical', icon: '🎓' },
      'unpaid': { color: 'volcano', text: 'Unpaid', icon: '💸' }
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
    for (const category of Object.values(leaveTypes)) {
      const foundType = category.types?.find(t => t.value === type);
      if (foundType) {
        return foundType.label;
      }
    }
    return type?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown';
  };

  const leaveColumns = [
    {
      title: 'Employee & Leave',
      key: 'employeeLeave',
      render: (_, record) => (
        <div>
          <Text strong>{record.employee?.fullName || 'Unknown'}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: '11px' }}>
            {record.employee?.department} - {record.employee?.position}
          </Text>
          <br />
          <Text code style={{ fontSize: '10px' }}>
            {record.leaveNumber || record.displayId || `LEA-${record._id?.slice(-6).toUpperCase()}`}
          </Text>
          <br />
          <div style={{ marginTop: '4px' }}>
            {getCategoryTag(record.leaveCategory)}
          </div>
          <Text style={{ fontSize: '10px', color: '#666', marginTop: '2px', display: 'block' }}>
            {getLeaveTypeDisplay(record.leaveType)}
          </Text>
        </div>
      ),
      width: 200
    },
    {
      title: 'Leave Period',
      key: 'leavePeriod',
      render: (_, record) => (
        <div>
          <Text strong style={{ fontSize: '12px' }}>
            {dayjs(record.startDate).format('MMM DD')} - {dayjs(record.endDate).format('MMM DD, YYYY')}
          </Text>
          <br />
          <Text type="secondary" style={{ fontSize: '11px' }}>
            Duration: {record.totalDays} {record.totalDays === 1 ? 'day' : 'days'}
          </Text>
          <br />
          {record.totalDays > 10 && (
            <Tag color="orange" size="small">Extended Leave</Tag>
          )}
          {record.isPartialDay && (
            <Tag color="blue" size="small">Partial Day</Tag>
          )}
        </div>
      ),
      width: 140
    },
    {
      title: 'Details & Urgency',
      key: 'detailsUrgency',
      render: (_, record) => (
        <div>
          {getUrgencyTag(record.urgency)}
          <br />
          <Tag color={record.priority === 'critical' ? 'red' : record.priority === 'urgent' ? 'orange' : 'default'} 
               size="small" style={{ marginTop: '4px' }}>
            {record.priority?.toUpperCase() || 'ROUTINE'}
          </Tag>
          <br />
          {/* Medical Info for medical leaves */}
          {record.leaveCategory === 'medical' && (
            <div style={{ marginTop: '4px' }}>
              {record.medicalInfo?.medicalCertificate?.provided ? (
                <Tag color="green" size="small">📄 Certificate</Tag>
              ) : (
                <Tag color="orange" size="small">📋 No Certificate</Tag>
              )}
              <br />
              <Text style={{ fontSize: '9px', color: '#666' }}>
                Dr: {record.medicalInfo?.doctorDetails?.name || 'N/A'}
              </Text>
            </div>
          )}
          {/* Show reason preview */}
          <Tooltip title={record.reason}>
            <Text style={{ fontSize: '9px', color: '#666', marginTop: '2px', display: 'block' }}>
              {record.reason?.length > 30 ? `${record.reason.substring(0, 30)}...` : record.reason}
            </Text>
          </Tooltip>
        </div>
      ),
      width: 150
    },
    {
      title: 'Leave Balance Impact',
      key: 'leaveBalance',
      render: (_, record) => {
        // Mock balance calculation - replace with actual data from backend
        const balance = record.leaveBalance || {
          previousBalance: Math.floor(Math.random() * 21) + 10,
          daysDeducted: record.totalDays,
          remainingBalance: Math.floor(Math.random() * 15) + 5
        };

        const usagePercentage = ((balance.daysDeducted / (balance.previousBalance || 21)) * 100);

        return (
          <div>
            <div style={{ fontSize: '11px' }}>
              <Text strong>Impact:</Text> -{record.totalDays} days
            </div>
            <div style={{ fontSize: '11px' }}>
              <Text strong>Remaining:</Text> {balance.remainingBalance || 'N/A'}
            </div>
            <Progress
              size="small"
              percent={Math.min(usagePercentage, 100)}
              status={
                usagePercentage > 80 ? 'exception' :
                usagePercentage > 60 ? 'normal' : 'success'
              }
              showInfo={false}
              style={{ marginTop: '4px' }}
            />
            <Text style={{ fontSize: '9px', color: '#666' }}>
              {record.leaveCategory} balance
            </Text>
          </div>
        );
      },
      width: 120
    },
    {
      title: 'HR Status & Review',
      key: 'hrStatus',
      render: (_, record) => (
        <div>
          {record.hrReview ? (
            <div>
              <Tag color={record.hrReview.decision === 'approve' ? 'green' : 'red'} size="small">
                {record.hrReview.decision === 'approve' ? '✅ Approved' : '❌ Rejected'}
              </Tag>
              <div style={{ fontSize: '10px', marginTop: '4px' }}>
                by {record.hrReview.decidedBy?.fullName || 'HR'}
              </div>
              <div style={{ fontSize: '9px', color: '#666' }}>
                {dayjs(record.hrReview.decisionDate).format('MMM DD')}
              </div>
            </div>
          ) : (
            <div>
              <Tag color="orange" size="small">⏳ Pending HR</Tag>
              {record.supervisorDecision?.decision === 'approve' && (
                <div style={{ fontSize: '10px', marginTop: '4px' }}>
                  ✅ Supervisor Approved
                </div>
              )}
              {record.status === 'pending_hr' && (
                <Tag color="blue" size="small" style={{ marginTop: '2px' }}>
                  Ready for Review
                </Tag>
              )}
            </div>
          )}
        </div>
      ),
      width: 130
    },
    {
      title: 'Status & Progress',
      key: 'statusProgress',
      render: (_, record) => (
        <div>
          {getStatusTag(record.status)}
          <div style={{ marginTop: '8px', width: '100px' }}>
            <Progress 
              size="small"
              percent={
                record.status === 'completed' ? 100 :
                record.status === 'approved' ? 75 :
                record.status === 'pending_hr' ? 50 :
                record.status === 'pending_supervisor' ? 25 : 0
              }
              status={
                record.status === 'completed' ? 'success' :
                record.status === 'rejected' ? 'exception' : 'active'
              }
              showInfo={false}
            />
          </div>
          <Text style={{ fontSize: '9px', color: '#666', marginTop: '2px', display: 'block' }}>
            {record.status === 'approved' ? 'Approved & Active' :
             record.status === 'pending_hr' ? 'Awaiting HR Review' :
             record.status === 'completed' ? 'Leave Completed' :
             'In Process'}
          </Text>
        </div>
      ),
      width: 120
    },
    {
      title: 'Submitted',
      dataIndex: 'submittedAt',
      key: 'submittedAt',
      render: (date) => (
        <div>
          <div style={{ fontSize: '12px' }}>
            {date ? new Date(date).toLocaleDateString() : 'N/A'}
          </div>
          <div style={{ fontSize: '10px', color: '#666' }}>
            {date ? dayjs(date).fromNow() : ''}
          </div>
        </div>
      ),
      sorter: (a, b) => new Date(a.submittedAt || 0) - new Date(b.submittedAt || 0),
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
            onClick={() => navigate(`/hr/leave/${record._id}`)}
            size="small"
          >
            View
          </Button>
          {!record.hrReview && (record.supervisorDecision?.decision === 'approve' || record.status === 'pending_hr') && (
            <Button 
              type="link" 
              icon={<EditOutlined />}
              onClick={() => {
                setSelectedLeave(record);
                setReviewModal(true);
              }}
              size="small"
            >
              Review
            </Button>
          )}
        </Space>
      ),
      width: 100
    }
  ];

  const rowSelection = {
    selectedRowKeys: selectedRows,
    onChange: (selectedRowKeys) => {
      setSelectedRows(selectedRowKeys);
    },
    getCheckboxProps: (record) => ({
      disabled: record.hrReview != null, // Disable if already reviewed
    }),
  };

  const filteredRequests = leaveRequests.filter(request => {
    return true; // Tab filtering is already applied in fetchLeaveRequests
  });

  const getStatsCards = () => {
    const totalRequests = leaveRequests.length;
    const pendingHRReviews = leaveRequests.filter(r => r.status === 'pending_hr').length;
    const urgentCases = leaveRequests.filter(r => r.urgency === 'critical' || r.urgency === 'high').length;
    const medicalLeaves = leaveRequests.filter(r => r.leaveCategory === 'medical').length;
    const familyLeaves = leaveRequests.filter(r => r.leaveCategory === 'family').length;
    const totalDaysRequested = leaveRequests.reduce((sum, r) => sum + r.totalDays, 0);

    return (
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col xs={12} sm={8} md={4}>
          <Card size="small">
            <Statistic
              title="Total Requests"
              value={totalRequests}
              prefix={<CalendarOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card size="small">
            <Statistic
              title="Pending HR Review"
              value={pendingHRReviews}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card size="small">
            <Statistic
              title="Urgent Cases"
              value={urgentCases}
              prefix={<WarningOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card size="small">
            <Statistic
              title="Medical Leaves"
              value={medicalLeaves}
              prefix={<MedicineBoxOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card size="small">
            <Statistic
              title="Family Leaves"
              value={familyLeaves}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card size="small">
            <Statistic
              title="Total Days"
              value={totalDaysRequested}
              prefix={<PieChartOutlined />}
              valueStyle={{ color: '#13c2c2' }}
            />
          </Card>
        </Col>
      </Row>
    );
  };

  if (loading && leaveRequests.length === 0) {
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
            <CalendarOutlined /> HR Leave Management
          </Title>
          <Space>
            <Button 
              icon={<BarChartOutlined />}
              onClick={() => navigate('/hr/leave/analytics')}
            >
              Analytics
            </Button>
            <Button 
              icon={<DownloadOutlined />}
              onClick={() => {
                // Export functionality placeholder
                message.info('Export feature coming soon');
              }}
            >
              Export
            </Button>
            <Button 
              icon={<ReloadOutlined />}
              onClick={fetchLeaveRequests}
              loading={loading}
            >
              Refresh
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

        {/* Bulk Actions */}
        {selectedRows.length > 0 && (
          <Alert
            message={`${selectedRows.length} requests selected`}
            description={
              <Space>
                <Button 
                  type="primary" 
                  size="small"
                  icon={<UploadOutlined />}
                  onClick={() => setBulkActionModal(true)}
                >
                  Bulk Actions
                </Button>
                <Button 
                  size="small"
                  onClick={() => setSelectedRows([])}
                >
                  Clear Selection
                </Button>
              </Space>
            }
            type="info"
            showIcon
            style={{ marginBottom: '16px' }}
          />
        )}

        {/* Category Tabs */}
        <Tabs activeKey={activeTab} onChange={setActiveTab} style={{ marginBottom: '16px' }}>
          <TabPane 
            tab={
              <Badge count={leaveRequests.length} offset={[10, 0]}>
                <CalendarOutlined /> All Requests
              </Badge>
            } 
            key="all"
          />
          <TabPane 
            tab={
              <Badge count={leaveRequests.filter(r => r.status === 'pending_hr').length} offset={[10, 0]}>
                <ClockCircleOutlined /> Pending HR
              </Badge>
            } 
            key="pending"
          />
          <TabPane 
            tab={
              <Badge count={leaveRequests.filter(r => r.status === 'approved' || r.status === 'completed').length} offset={[10, 0]}>
                <CheckCircleOutlined /> Approved
              </Badge>
            } 
            key="approved"
          />
          <TabPane 
            tab={
              <Badge count={leaveRequests.filter(r => r.urgency === 'critical' || r.urgency === 'high').length} offset={[10, 0]}>
                <WarningOutlined /> Urgent
              </Badge>
            } 
            key="urgent"
          />
          <TabPane 
            tab={
              <Badge count={leaveRequests.filter(r => r.leaveCategory === 'medical').length} offset={[10, 0]}>
                <MedicineBoxOutlined /> Medical
              </Badge>
            } 
            key="medical"
          />
          <TabPane 
            tab={
              <Badge count={leaveRequests.filter(r => r.leaveCategory === 'family').length} offset={[10, 0]}>
                <TeamOutlined /> Family
              </Badge>
            } 
            key="family"
          />
          <TabPane 
            tab={
              <Badge count={leaveRequests.filter(r => r.leaveCategory === 'vacation').length} offset={[10, 0]}>
                <RestOutlined /> Vacation
              </Badge>
            } 
            key="vacation"
          />
        </Tabs>

        {/* Advanced Filters */}
        <Collapse style={{ marginBottom: '16px' }}>
          <Panel header={<><FilterOutlined /> Advanced Filters</>} key="filters">
            <Row gutter={16} align="middle">
              <Col xs={24} sm={8} md={6} lg={4}>
                <Select
                  style={{ width: '100%' }}
                  value={filters.status}
                  onChange={(value) => setFilters({...filters, status: value})}
                  placeholder="Status"
                >
                  <Select.Option value="all">All Status</Select.Option>
                  <Select.Option value="pending_supervisor">Pending Supervisor</Select.Option>
                  <Select.Option value="pending_hr">Pending HR</Select.Option>
                  <Select.Option value="pending_admin">Pending Admin</Select.Option>
                  <Select.Option value="approved">Approved</Select.Option>
                  <Select.Option value="in_progress">In Progress</Select.Option>
                  <Select.Option value="completed">Completed</Select.Option>
                  <Select.Option value="rejected">Rejected</Select.Option>
                </Select>
              </Col>
              <Col xs={24} sm={8} md={6} lg={4}>
                <Select
                  style={{ width: '100%' }}
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
              <Col xs={24} sm={8} md={6} lg={4}>
                <Select
                  style={{ width: '100%' }}
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
              <Col xs={24} sm={8} md={6} lg={4}>
                <Select
                  style={{ width: '100%' }}
                  value={filters.department}
                  onChange={(value) => setFilters({...filters, department: value})}
                  placeholder="Department"
                >
                  <Select.Option value="all">All Departments</Select.Option>
                  <Select.Option value="Engineering">Engineering</Select.Option>
                  <Select.Option value="Marketing">Marketing</Select.Option>
                  <Select.Option value="Sales">Sales</Select.Option>
                  <Select.Option value="HR">Human Resources</Select.Option>
                  <Select.Option value="Finance">Finance</Select.Option>
                  <Select.Option value="Operations">Operations</Select.Option>
                </Select>
              </Col>
              <Col xs={24} sm={16} md={8} lg={6}>
                <RangePicker
                  style={{ width: '100%' }}
                  value={filters.dateRange}
                  onChange={(dates) => setFilters({...filters, dateRange: dates})}
                  placeholder={['Start Date', 'End Date']}
                />
              </Col>
              <Col xs={24} sm={8} md={4} lg={2}>
                <Button 
                  onClick={() => setFilters({
                    status: 'all',
                    category: 'all',
                    type: 'all',
                    urgency: 'all',
                    department: 'all',
                    dateRange: null
                  })}
                  block
                >
                  Clear
                </Button>
              </Col>
            </Row>
          </Panel>
        </Collapse>

        {/* HR Policy Reminders */}
        <Alert
          message="HR Policy Reminders"
          description={
            <Row gutter={16}>
              <Col span={6}>
                <Text strong>Medical Leaves:</Text> Require certificate for 1 day. Consider EAP referrals.
              </Col>
              <Col span={6}>
                <Text strong>Family Leaves:</Text> Handle with sensitivity. Check statutory entitlements.
              </Col>
              <Col span={6}>
                <Text strong>Emergency Cases:</Text> Prioritize approval. Arrange immediate support.
              </Col>
              <Col span={6}>
                <Text strong>Maternity/Paternity:</Text> Follow legal requirements. Coordinate benefits.
              </Col>
            </Row>
          }
          type="info"
          showIcon
          style={{ marginBottom: '16px' }}
        />

        {filteredRequests.length === 0 ? (
          <Alert
            message="No Leave Requests Found"
            description={
              leaveRequests.length === 0 
                ? "No leave requests are currently available for HR review."
                : "No requests match your current filter criteria. Try adjusting the filters above."
            }
            type="info"
            showIcon
            style={{ marginBottom: '16px' }}
          />
        ) : (
          <>
            <Text type="secondary" style={{ marginBottom: '8px', display: 'block' }}>
              Showing {filteredRequests.length} of {leaveRequests.length} requests
            </Text>

            <Table 
              columns={leaveColumns} 
              dataSource={filteredRequests} 
              loading={loading}
              rowKey="_id"
              rowSelection={rowSelection}
              pagination={{ 
                pageSize: 15,
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
                if (record.status === 'pending_hr') {
                  return 'pending-hr-row';
                }
                if (record.leaveCategory === 'medical' && record.urgency === 'high') {
                  return 'medical-urgent-row';
                }
                if (record.leaveCategory === 'family') {
                  return 'family-leave-row';
                }
                return '';
              }}
            />
          </>
        )}
      </Card>

      {/* HR Review Modal */}
      <Modal
        title={`HR Review - ${selectedLeave?.leaveNumber || selectedLeave?.displayId || `LEA-${selectedLeave?._id?.slice(-6).toUpperCase()}`}`}
        open={reviewModal}
        onCancel={() => {
          setReviewModal(false);
          setSelectedLeave(null);
          reviewForm.resetFields();
        }}
        footer={null}
        width={1000}
      >
        {selectedLeave && (
          <Form
            form={reviewForm}
            layout="vertical"
            onFinish={handleHRReview}
          >
            <Row gutter={16}>
              <Col span={24}>
                <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#f5f5f5', borderRadius: '6px' }}>
                  <Descriptions column={3} size="small">
                    <Descriptions.Item label="Employee">{selectedLeave.employee?.fullName}</Descriptions.Item>
                    <Descriptions.Item label="Department">{selectedLeave.employee?.department}</Descriptions.Item>
                    <Descriptions.Item label="Position">{selectedLeave.employee?.position}</Descriptions.Item>
                    <Descriptions.Item label="Leave Category">{getCategoryTag(selectedLeave.leaveCategory)}</Descriptions.Item>
                    <Descriptions.Item label="Leave Type">{getLeaveTypeDisplay(selectedLeave.leaveType)}</Descriptions.Item>
                    <Descriptions.Item label="Duration">{selectedLeave.totalDays} days</Descriptions.Item>
                    <Descriptions.Item label="Urgency">{getUrgencyTag(selectedLeave.urgency)}</Descriptions.Item>
                    <Descriptions.Item label="Priority">{selectedLeave.priority?.toUpperCase() || 'ROUTINE'}</Descriptions.Item>
                    <Descriptions.Item label="Dates">
                      {dayjs(selectedLeave.startDate).format('MMM DD')} - {dayjs(selectedLeave.endDate).format('MMM DD, YYYY')}
                    </Descriptions.Item>
                    <Descriptions.Item label="Reason" span={3}>
                      <div style={{ whiteSpace: 'pre-wrap', maxHeight: '80px', overflow: 'auto', padding: '8px', backgroundColor: 'white', border: '1px solid #d9d9d9', borderRadius: '4px' }}>
                        {selectedLeave.reason}
                      </div>
                    </Descriptions.Item>
                    {selectedLeave.description && (
                      <Descriptions.Item label="Additional Details" span={3}>
                        <div style={{ whiteSpace: 'pre-wrap', maxHeight: '60px', overflow: 'auto', padding: '8px', backgroundColor: 'white', border: '1px solid #d9d9d9', borderRadius: '4px' }}>
                          {selectedLeave.description}
                        </div>
                      </Descriptions.Item>
                    )}
                  </Descriptions>
                </div>
              </Col>
            </Row>

            {/* Medical Information for Medical Leaves */}
            {selectedLeave.leaveCategory === 'medical' && selectedLeave.medicalInfo && (
              <Card size="small" title="Medical Information" style={{ marginBottom: '16px' }}>
                <Descriptions column={2} size="small">
                  <Descriptions.Item label="Doctor">{selectedLeave.medicalInfo.doctorDetails?.name || 'N/A'}</Descriptions.Item>
                  <Descriptions.Item label="Hospital">{selectedLeave.medicalInfo.doctorDetails?.hospital || 'N/A'}</Descriptions.Item>
                  <Descriptions.Item label="Contact">{selectedLeave.medicalInfo.doctorDetails?.contactNumber || 'N/A'}</Descriptions.Item>
                  <Descriptions.Item label="Certificate">
                    {selectedLeave.medicalInfo.medicalCertificate?.provided ? 
                      <Tag color="green">Provided</Tag> : 
                      <Tag color="orange">Not Provided</Tag>
                    }
                  </Descriptions.Item>
                  {selectedLeave.medicalInfo.symptoms && (
                    <Descriptions.Item label="Symptoms" span={2}>{selectedLeave.medicalInfo.symptoms}</Descriptions.Item>
                  )}
                  {selectedLeave.medicalInfo.treatmentReceived && (
                    <Descriptions.Item label="Treatment" span={2}>{selectedLeave.medicalInfo.treatmentReceived}</Descriptions.Item>
                  )}
                </Descriptions>
              </Card>
            )}

            {/* Emergency Contact */}
            {selectedLeave.emergencyContact && (
              <Card size="small" title="Emergency Contact" style={{ marginBottom: '16px' }}>
                <Descriptions column={3} size="small">
                  <Descriptions.Item label="Name">{selectedLeave.emergencyContact.name}</Descriptions.Item>
                  <Descriptions.Item label="Phone">{selectedLeave.emergencyContact.phone}</Descriptions.Item>
                  <Descriptions.Item label="Relationship">{selectedLeave.emergencyContact.relationship}</Descriptions.Item>
                </Descriptions>
              </Card>
            )}

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="decision"
                  label="HR Decision"
                  rules={[{ required: true, message: 'Please select a decision' }]}
                >
                  <Select placeholder="Select HR decision" size="large">
                    <Select.Option value="approve">✅ Approve Leave</Select.Option>
                    <Select.Option value="reject">❌ Reject Leave</Select.Option>
                    <Select.Option value="conditional_approve">⚠️ Conditional Approval</Select.Option>
                    <Select.Option value="request_info">❓ Request More Information</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="hrPriority"
                  label="HR Priority Assessment"
                >
                  <Select placeholder="Assess priority from HR perspective" size="large">
                    <Select.Option value="immediate">🚨 Immediate Attention Required</Select.Option>
                    <Select.Option value="standard">⏱️ Standard Processing</Select.Option>
                    <Select.Option value="routine">📋 Routine Case</Select.Option>
                    <Select.Option value="follow_up">🔄 Requires Follow-up</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="comments"
              label="HR Review Comments"
              rules={[{ required: true, message: 'Please provide HR review comments' }]}
            >
              <TextArea 
                rows={3} 
                placeholder="Provide detailed HR assessment including policy compliance, employee support needs, impact on operations..."
                showCount
                maxLength={600}
              />
            </Form.Item>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="conditions"
                  label="Conditions/Requirements (if applicable)"
                >
                  <TextArea 
                    rows={2} 
                    placeholder="List any conditions for approval (e.g., medical certificate required by return date)..."
                    showCount
                    maxLength={300}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="reviewNotes"
                  label="Internal HR Notes"
                >
                  <TextArea 
                    rows={2} 
                    placeholder="Internal notes for HR records (not shared with employee)..."
                    showCount
                    maxLength={300}
                  />
                </Form.Item>
              </Col>
            </Row>

            {/* Checkbox Options */}
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item name="medicalCertificateRequired" valuePropName="checked">
                  <Checkbox>Require Medical Certificate</Checkbox>
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="returnToWorkCertificateRequired" valuePropName="checked">
                  <Checkbox>Return-to-Work Certificate Required</Checkbox>
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="extendedLeaveGranted" valuePropName="checked">
                  <Checkbox>Extended Leave Granted</Checkbox>
                </Form.Item>
              </Col>
            </Row>

            <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
              <Space>
                <Button onClick={() => setReviewModal(false)}>
                  Cancel
                </Button>
                <Button type="primary" htmlType="submit" loading={loading}>
                  Submit HR Review
                </Button>
              </Space>
            </Form.Item>
          </Form>
        )}
      </Modal>

      {/* Bulk Action Modal */}
      <Modal
        title="Bulk Actions"
        open={bulkActionModal}
        onCancel={() => {
          setBulkActionModal(false);
          bulkForm.resetFields();
        }}
        footer={null}
      >
        <Form
          form={bulkForm}
          layout="vertical"
          onFinish={handleBulkAction}
        >
          <Alert
            message={`${selectedRows.length} requests selected for bulk action`}
            type="info"
            showIcon
            style={{ marginBottom: '16px' }}
          />

          <Form.Item
            name="action"
            label="Bulk Action"
            rules={[{ required: true, message: 'Please select an action' }]}
          >
            <Select placeholder="Select bulk action" size="large">
              <Select.Option value="approve">✅ Bulk Approve</Select.Option>
              <Select.Option value="reject">❌ Bulk Reject</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="comments"
            label="Comments"
            rules={[{ required: true, message: 'Please provide comments for bulk action' }]}
          >
            <TextArea 
              rows={3} 
              placeholder="Provide reason for bulk action..."
              showCount
              maxLength={300}
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setBulkActionModal(false)}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                Execute Bulk Action
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <style jsx>{`
        .critical-leave-row {
          background-color: #fff1f0 !important;
          border-left: 4px solid #ff4d4f !important;
        }
        .critical-leave-row:hover {
          background-color: #ffe7e6 !important;
        }
        .pending-hr-row {
          background-color: #fffbf0 !important;
          border-left: 3px solid #faad14 !important;
        }
        .pending-hr-row:hover {
          background-color: #fff1d6 !important;
        }
        .medical-urgent-row {
          background-color: #fff0f6 !important;
          border-left: 3px solid #eb2f96 !important;
        }
        .medical-urgent-row:hover {
          background-color: #ffd6e7 !important;
        }
        .family-leave-row {
          background-color: #f6ffed !important;
          border-left: 2px solid #52c41a !important;
        }
        .family-leave-row:hover {
          background-color: #d9f7be !important;
        }
      `}</style>
    </div>
  );
};

export default HRLeaveManagement;



