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
  EditOutlined,
  WarningOutlined,
  SafetyCertificateOutlined,
  TeamOutlined,
  PieChartOutlined,
  MedicineBoxOutlined,
  RestOutlined,
  DownloadOutlined,
  FilterOutlined,
  ThunderboltOutlined,
  ArrowUpOutlined,
  ExclamationCircleOutlined,
  InfoCircleOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import leaveApi from '../../services/leaveApi';
import HREmergencyActions from './HREmergencyActions';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

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
  const [emergencyActionsModal, setEmergencyActionsModal] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [selectedRows, setSelectedRows] = useState([]);
  const [reviewForm] = Form.useForm();
  const [bulkForm] = Form.useForm();
  const [activeTab, setActiveTab] = useState('all');
  const [filters, setFilters] = useState({
    status: 'all',
    category: 'all',
    urgency: 'all',
    department: 'all',
    dateRange: null,
    stuckOnly: false
  });
  const [summaryStats, setSummaryStats] = useState({});
  const [leaveTypes, setLeaveTypes] = useState({});
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    fetchLeaveRequests();
    fetchLeaveTypes();
  }, [filters, activeTab]);

  const fetchLeaveRequests = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {};
      
      // Apply tab-specific filters
      switch (activeTab) {
        case 'pending_hr':
          params.status = 'pending_hr_approval';
          break;
        case 'all_pending':
          // Will show all pending statuses
          break;
        case 'stuck':
          params.stuckOnly = true;
          break;
        case 'approved':
          params.status = 'approved';
          break;
        case 'urgent':
          params.urgency = 'critical,high';
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
        default:
          // 'all' - no filter
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
      if (filters.stuckOnly) params.stuckOnly = true;

      // Use full visibility endpoint
      const response = await leaveApi.getHRLeavesWithFullVisibility(params);
      
      if (response.success) {
        setLeaveRequests(response.data.leaves || []);
        setSummaryStats(response.data.summary || {});
      } else {
        throw new Error(response.message || 'Failed to fetch leave requests');
      }

    } catch (error) {
      console.error('Error fetching leave requests:', error);
      setError(error.response?.data?.message || error.message || 'Failed to fetch leave requests');
      setLeaveRequests([]);
      setSummaryStats({});
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

  const handleEmergencyActionSuccess = () => {
    fetchLeaveRequests();
    setEmergencyActionsModal(false);
    setSelectedLeave(null);
  };

  const getStatusTag = (status) => {
    const statusMap = {
      'pending_supervisor': { 
        color: 'orange', 
        icon: <ClockCircleOutlined />, 
        text: 'Pending Supervisor' 
      },
      'pending_departmental_head': { 
        color: 'blue', 
        icon: <ClockCircleOutlined />, 
        text: 'Pending Dept Head' 
      },
      'pending_head_of_business': { 
        color: 'purple', 
        icon: <ClockCircleOutlined />, 
        text: 'Pending President' 
      },
      'pending_hr_approval': { 
        color: 'cyan', 
        icon: <ClockCircleOutlined />, 
        text: 'Pending HR' 
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
      'personal': { color: 'purple', text: 'Personal', icon: <FileTextOutlined /> },
      'emergency': { color: 'orange', text: 'Emergency', icon: <WarningOutlined /> },
      'family': { color: 'green', text: 'Family', icon: <TeamOutlined /> },
      'bereavement': { color: 'gray', text: 'Bereavement', icon: '💔' },
      'study': { color: 'cyan', text: 'Study', icon: '📚' }
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
      title: 'Status & Alerts',
      key: 'statusAlerts',
      width: 140,
      fixed: 'left',
      render: (_, record) => (
        <div>
          {getStatusTag(record.status)}
          {record.currentPendingLevel?.isStuck && (
            <Tag color="red" icon={<WarningOutlined />} style={{ marginTop: '4px' }}>
              STUCK ({record.currentPendingLevel.hoursPending}h)
            </Tag>
          )}
          {record.currentPendingLevel?.isUrgentStuck && (
            <Tag color="red" icon={<ExclamationCircleOutlined />} style={{ marginTop: '4px' }}>
              URGENT STUCK
            </Tag>
          )}
          {leaveApi.isEligibleForEmergencyOverride(record) && (
            <Tag color="volcano" icon={<ThunderboltOutlined />} style={{ marginTop: '4px', fontSize: '10px' }}>
              Override Ready
            </Tag>
          )}
        </div>
      )
    },
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
      title: 'Duration & Dates',
      key: 'duration',
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
      title: 'Urgency & Priority',
      key: 'urgency',
      render: (_, record) => (
        <div>
          {getUrgencyTag(record.urgency)}
          <br />
          <Tag 
            color={record.priority === 'critical' ? 'red' : record.priority === 'urgent' ? 'orange' : 'default'} 
            size="small" 
            style={{ marginTop: '4px' }}
          >
            {record.priority?.toUpperCase() || 'ROUTINE'}
          </Tag>
          <br />
          {record.leaveCategory === 'medical' && record.medicalInfo && (
            <div style={{ marginTop: '4px' }}>
              {record.medicalInfo.medicalCertificate?.provided ? (
                <Tag color="green" size="small">📄 Certificate</Tag>
              ) : (
                <Tag color="orange" size="small">📋 No Cert</Tag>
              )}
            </div>
          )}
        </div>
      ),
      width: 120
    },
    {
      title: 'Current Pending With',
      key: 'currentPending',
      render: (_, record) => (
        <div>
          {record.currentPendingLevel ? (
            <>
              <Text strong style={{ fontSize: '11px' }}>
                {record.currentPendingLevel.approverName}
              </Text>
              <br />
              <Text type="secondary" style={{ fontSize: '10px' }}>
                {record.currentPendingLevel.approverRole}
              </Text>
              <br />
              <Text 
                style={{ 
                  fontSize: '10px', 
                  color: record.currentPendingLevel.isStuck ? '#ff4d4f' : '#666' 
                }}
              >
                ⏱ {record.currentPendingLevel.hoursPending}h pending
              </Text>
              {record.currentPendingLevel.isStuck && (
                <>
                  <br />
                  <Tag color="red" size="small" icon={<WarningOutlined />}>
                    Delayed
                  </Tag>
                </>
              )}
            </>
          ) : (
            <Text type="secondary">-</Text>
          )}
        </div>
      ),
      width: 150
    },
    {
      title: 'Time in System',
      key: 'timeInSystem',
      render: (_, record) => (
        <div>
          <Text strong style={{ fontSize: '12px' }}>
            {record.totalHoursInSystem || 0}h
          </Text>
          <br />
          {record.isOverdue && (
            <Tag color="red" size="small">OVERDUE</Tag>
          )}
          <br />
          <Text style={{ fontSize: '10px', color: '#666' }}>
            {dayjs(record.submittedAt).fromNow()}
          </Text>
        </div>
      ),
      sorter: (a, b) => (a.totalHoursInSystem || 0) - (b.totalHoursInSystem || 0),
      width: 100
    },
    {
      title: 'Progress',
      key: 'progress',
      render: (_, record) => {
        const progress = 
          record.status === 'completed' ? 100 :
          record.status === 'approved' ? 75 :
          record.status === 'pending_hr_approval' ? 60 :
          record.status === 'pending_head_of_business' ? 45 :
          record.status === 'pending_departmental_head' ? 30 :
          record.status === 'pending_supervisor' ? 15 : 0;

        return (
          <div style={{ width: '80px' }}>
            <Progress 
              percent={progress}
              size="small"
              status={
                record.status === 'rejected' ? 'exception' :
                record.status === 'approved' || record.status === 'completed' ? 'success' :
                'active'
              }
              showInfo={false}
            />
            <Text style={{ fontSize: '9px', color: '#666' }}>
              {progress}%
            </Text>
          </div>
        );
      },
      width: 100
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 210,
      render: (_, record) => (
        <Space direction="vertical" size="small" style={{ width: '100%' }}>
          <Button 
            type="link" 
            icon={<EyeOutlined />}
            onClick={() => navigate(`/hr/leave/${record._id}`)}
            size="small"
            block
          >
            View Details
          </Button>
          
          {record.status === 'pending_hr_approval' && (
            <Button 
              type="primary"
              icon={<EditOutlined />}
              onClick={() => {
                setSelectedLeave(record);
                setReviewModal(true);
              }}
              size="small"
              block
            >
              Standard Review
            </Button>
          )}

          {(leaveApi.isEligibleForEmergencyOverride(record) || 
            leaveApi.isLeaveStuck(record) ||
            leaveApi.isEligibleForDirectApproval(record)) && (
            <Button 
              danger={record.currentPendingLevel?.isUrgentStuck}
              type={record.currentPendingLevel?.isStuck ? 'primary' : 'default'}
              icon={<ThunderboltOutlined />}
              onClick={() => {
                setSelectedLeave(record);
                setEmergencyActionsModal(true);
              }}
              size="small"
              block
            >
              Emergency Actions
            </Button>
          )}
        </Space>
      )
    }
  ];

  const rowSelection = {
    selectedRowKeys: selectedRows,
    onChange: (selectedRowKeys) => {
      setSelectedRows(selectedRowKeys);
    },
    getCheckboxProps: (record) => ({
      disabled: record.hrReview != null || !['pending_hr_approval'].includes(record.status),
    }),
  };

  const getStatsCards = () => {
    const allPending = 
      (summaryStats.pendingSupervisor || 0) +
      (summaryStats.pendingDeptHead || 0) +
      (summaryStats.pendingHeadOfBusiness || 0) +
      (summaryStats.pendingHR || 0);

    return (
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col xs={12} sm={8} md={4}>
          <Card size="small" hoverable>
            <Statistic
              title="Total Requests"
              value={summaryStats.total || 0}
              prefix={<CalendarOutlined />}
              valueStyle={{ color: '#1890ff', fontSize: '20px' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card size="small" hoverable>
            <Statistic
              title="Pending HR Action"
              value={summaryStats.pendingHR || 0}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#13c2c2', fontSize: '20px' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card size="small" hoverable onClick={() => setActiveTab('stuck')} style={{ cursor: 'pointer' }}>
            <Statistic
              title="Stuck Requests"
              value={summaryStats.stuckRequests || 0}
              prefix={<WarningOutlined />}
              valueStyle={{ color: '#ff4d4f', fontSize: '20px' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card size="small" hoverable>
            <Statistic
              title="Urgent Stuck"
              value={summaryStats.urgentStuck || 0}
              prefix={<ExclamationCircleOutlined />}
              valueStyle={{ color: '#cf1322', fontSize: '20px' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card size="small" hoverable onClick={() => setActiveTab('urgent')} style={{ cursor: 'pointer' }}>
            <Statistic
              title="Critical/High"
              value={(summaryStats.critical || 0) + (summaryStats.high || 0)}
              prefix={<ThunderboltOutlined />}
              valueStyle={{ color: '#722ed1', fontSize: '20px' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card size="small" hoverable onClick={() => setActiveTab('all_pending')} style={{ cursor: 'pointer' }}>
            <Statistic
              title="All Pending"
              value={allPending}
              prefix={<PieChartOutlined />}
              valueStyle={{ color: '#faad14', fontSize: '20px' }}
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
        <div style={{ marginTop: '16px' }}>Loading HR leave management dashboard...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <Title level={2} style={{ margin: 0 }}>
            <SafetyCertificateOutlined style={{ color: '#1890ff' }} /> HR Leave Management
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
              onClick={() => message.info('Export feature coming soon')}
            >
              Export
            </Button>
            <Button 
              icon={<ReloadOutlined />}
              onClick={fetchLeaveRequests}
              loading={loading}
              type="primary"
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

        {/* Stuck Requests Alert */}
        {summaryStats.stuckRequests > 0 && (
          <Alert
            message={
              <Space>
                <ExclamationCircleOutlined />
                <Text strong>
                  {summaryStats.stuckRequests} Request(s) Stuck for &gt;24 Hours
                </Text>
              </Space>
            }
            description={
              <div>
                {summaryStats.urgentStuck > 0 && (
                  <div style={{ marginBottom: '8px' }}>
                    <Tag color="red" icon={<ThunderboltOutlined />}>
                      {summaryStats.urgentStuck} URGENT cases
                    </Tag>
                    <Text>require immediate attention</Text>
                  </div>
                )}
                <Button 
                  type="link" 
                  size="small"
                  onClick={() => setActiveTab('stuck')}
                  style={{ paddingLeft: 0 }}
                >
                  View Stuck Requests →
                </Button>
              </div>
            }
            type="error"
            showIcon
            style={{ marginBottom: '16px' }}
          />
        )}

        {/* HR Policy Reminders */}
        <Alert
          message={
            <Space>
              <InfoCircleOutlined />
              <Text strong>HR Emergency Powers Available</Text>
            </Space>
          }
          description={
            <Row gutter={16}>
              <Col span={8}>
                <Text strong>Emergency Override:</Text> Immediately approve critical medical/emergency cases
              </Col>
              <Col span={8}>
                <Text strong>Escalation:</Text> Move stuck requests to next level or admin
              </Col>
              <Col span={8}>
                <Text strong>Direct Approval:</Text> Fast-track policy-compliant simple requests
              </Col>
            </Row>
          }
          type="info"
          showIcon
          style={{ marginBottom: '16px' }}
        />

        {/* Bulk Actions Alert */}
        {selectedRows.length > 0 && (
          <Alert
            message={`${selectedRows.length} request(s) selected`}
            description={
              <Space>
                <Button 
                  type="primary" 
                  size="small"
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
              <Badge count={summaryStats.total || 0} offset={[10, 0]} showZero>
                <CalendarOutlined /> All Requests
              </Badge>
            } 
            key="all"
          />
          <TabPane 
            tab={
              <Badge count={summaryStats.pendingHR || 0} offset={[10, 0]} showZero>
                <CheckCircleOutlined /> My Action (HR)
              </Badge>
            } 
            key="pending_hr"
          />
          <TabPane 
            tab={
              <Badge 
                count={
                  (summaryStats.pendingSupervisor || 0) +
                  (summaryStats.pendingDeptHead || 0) +
                  (summaryStats.pendingHeadOfBusiness || 0)
                } 
                offset={[10, 0]}
                showZero
              >
                <ClockCircleOutlined /> All Pending
              </Badge>
            } 
            key="all_pending"
          />
          <TabPane 
            tab={
              <Badge count={summaryStats.stuckRequests || 0} offset={[10, 0]} showZero>
                <WarningOutlined /> Stuck Requests
              </Badge>
            } 
            key="stuck"
          />
          <TabPane 
            tab={
              <Badge count={summaryStats.approved || 0} offset={[10, 0]} showZero>
                <CheckCircleOutlined /> Approved
              </Badge>
            } 
            key="approved"
          />
          <TabPane 
            tab={
              <Badge count={(summaryStats.critical || 0) + (summaryStats.high || 0)} offset={[10, 0]} showZero>
                <ThunderboltOutlined /> Urgent Cases
              </Badge>
            } 
            key="urgent"
          />
          <TabPane 
            tab={<><MedicineBoxOutlined /> Medical</>} 
            key="medical"
          />
          <TabPane 
            tab={<><TeamOutlined /> Family</>} 
            key="family"
          />
          <TabPane 
            tab={<><RestOutlined /> Vacation</>} 
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
                  <Select.Option value="pending_departmental_head">Pending Dept Head</Select.Option>
                  <Select.Option value="pending_head_of_business">Pending President</Select.Option>
                  <Select.Option value="pending_hr_approval">Pending HR</Select.Option>
                  <Select.Option value="approved">Approved</Select.Option>
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
                  <Select.Option value="Technical">Technical</Select.Option>
                  <Select.Option value="Business Development & Supply Chain">Business Dev & Supply Chain</Select.Option>
                  <Select.Option value="HR & Admin">HR & Admin</Select.Option>
                  <Select.Option value="Executive">Executive</Select.Option>
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
                    urgency: 'all',
                    department: 'all',
                    dateRange: null,
                    stuckOnly: false
                  })}
                  block
                >
                  Clear
                </Button>
              </Col>
            </Row>
          </Panel>
        </Collapse>

        {leaveRequests.length === 0 ? (
          <Alert
            message="No Leave Requests Found"
            description={
              activeTab === 'stuck' 
                ? "Great news! No requests are currently stuck. All leaves are being processed smoothly."
                : activeTab === 'pending_hr'
                ? "No leave requests are currently pending HR approval."
                : "No requests match your current filter criteria. Try adjusting the filters above."
            }
            type="info"
            showIcon
            style={{ marginBottom: '16px' }}
          />
        ) : (
          <>
            <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text type="secondary">
                Showing {leaveRequests.length} request(s)
              </Text>
              {summaryStats.stuckRequests > 0 && activeTab !== 'stuck' && (
                <Button 
                  danger
                  size="small"
                  icon={<WarningOutlined />}
                  onClick={() => setActiveTab('stuck')}
                >
                  View {summaryStats.stuckRequests} Stuck Request(s)
                </Button>
              )}
            </div>

            <Table 
              columns={leaveColumns} 
              dataSource={leaveRequests} 
              loading={loading}
              rowKey="_id"
              rowSelection={activeTab === 'pending_hr' ? rowSelection : undefined}
              pagination={{ 
                pageSize: 20,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) => 
                  `${range[0]}-${range[1]} of ${total} requests`,
                pageSizeOptions: ['10', '20', '50', '100']
              }}
              scroll={{ x: 1800 }}
              rowClassName={(record) => {
                if (record.currentPendingLevel?.isUrgentStuck) {
                  return 'urgent-stuck-row';
                }
                if (record.currentPendingLevel?.isStuck) {
                  return 'stuck-row';
                }
                if (record.urgency === 'critical') {
                  return 'critical-row';
                }
                if (record.status === 'pending_hr_approval') {
                  return 'pending-hr-row';
                }
                return '';
              }}
            />
          </>
        )}
      </Card>

      {/* Standard HR Review Modal */}
      <Modal
        title={
          <Space>
            <CheckCircleOutlined style={{ color: '#1890ff' }} />
            <Text strong>
              HR Review - {selectedLeave?.leaveNumber || selectedLeave?.displayId || `LEA-${selectedLeave?._id?.slice(-6).toUpperCase()}`}
            </Text>
          </Space>
        }
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
                  </Descriptions>
                </div>
              </Col>
            </Row>

            {/* Medical Information */}
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
                  <Select placeholder="Assess priority" size="large">
                    <Select.Option value="immediate">🚨 Immediate Attention</Select.Option>
                    <Select.Option value="standard">⏱️ Standard Processing</Select.Option>
                    <Select.Option value="routine">📋 Routine Case</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="comments"
              label="HR Review Comments"
              rules={[{ required: true, message: 'Please provide comments' }]}
            >
              <TextArea 
                rows={3} 
                placeholder="Provide detailed HR assessment..."
                showCount
                maxLength={600}
              />
            </Form.Item>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="conditions"
                  label="Conditions/Requirements"
                >
                  <TextArea 
                    rows={2} 
                    placeholder="Any conditions for approval..."
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
                    placeholder="Internal notes (not shared with employee)..."
                    showCount
                    maxLength={300}
                  />
                </Form.Item>
              </Col>
            </Row>

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
                <Button onClick={() => {
                  setReviewModal(false);
                  reviewForm.resetFields();
                }}>
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
            message={`${selectedRows.length} request(s) selected for bulk action`}
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
            rules={[{ required: true, message: 'Please provide comments' }]}
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
              <Button onClick={() => {
                setBulkActionModal(false);
                bulkForm.resetFields();
              }}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                Execute Bulk Action
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Emergency Actions Modal */}
      <HREmergencyActions
        leave={selectedLeave}
        visible={emergencyActionsModal}
        onClose={() => {
          setEmergencyActionsModal(false);
          setSelectedLeave(null);
        }}
        onSuccess={handleEmergencyActionSuccess}
      />

      <style>{`
        .urgent-stuck-row {
          background-color: #fff1f0 !important;
          border-left: 4px solid #cf1322 !important;
          animation: pulse 2s infinite;
        }
        .urgent-stuck-row:hover {
          background-color: #ffccc7 !important;
        }
        .stuck-row {
          background-color: #fffbf0 !important;
          border-left: 3px solid #faad14 !important;
        }
        .stuck-row:hover {
          background-color: #fff1d6 !important;
        }
        .critical-row {
          background-color: #fff0f6 !important;
          border-left: 3px solid #eb2f96 !important;
        }
        .critical-row:hover {
          background-color: #ffd6e7 !important;
        }
        .pending-hr-row {
          background-color: #e6f7ff !important;
          border-left: 2px solid #1890ff !important;
        }
        .pending-hr-row:hover {
          background-color: #bae7ff !important;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.85; }
        }
      `}</style>
    </div>
  );
};

export default HRLeaveManagement;










// import React, { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { useSelector } from 'react-redux';
// import { 
//   Table, 
//   Tag, 
//   Space, 
//   Typography, 
//   Button, 
//   Alert, 
//   Spin, 
//   Card,
//   Select,
//   DatePicker,
//   Row,
//   Col,
//   Statistic,
//   Modal,
//   Form,
//   Input,
//   Progress,
//   Tabs,
//   Tooltip,
//   Descriptions,
//   message,
//   Badge,
//   Collapse,
//   List,
//   Avatar,
//   Checkbox
// } from 'antd';
// import { 
//   CalendarOutlined, 
//   CheckCircleOutlined, 
//   CloseCircleOutlined, 
//   ClockCircleOutlined,
//   EyeOutlined,
//   ReloadOutlined,
//   BarChartOutlined,
//   UserOutlined,
//   EditOutlined,
//   HeartOutlined,
//   WarningOutlined,
//   FileTextOutlined,
//   SafetyCertificateOutlined,
//   TeamOutlined,
//   PieChartOutlined,
//   MedicineBoxOutlined,
//   HomeOutlined,
//   BookOutlined,
//   RestOutlined,
//   UploadOutlined,
//   DownloadOutlined,
//   FilterOutlined
// } from '@ant-design/icons';
// import leaveApi from '../../services/leaveApi';
// import dayjs from 'dayjs';

// const { Title, Text, Paragraph } = Typography;
// const { RangePicker } = DatePicker;
// const { TextArea } = Input;
// const { TabPane } = Tabs;
// const { Panel } = Collapse;

// const HRLeaveManagement = () => {
//   const [leaveRequests, setLeaveRequests] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [reviewModal, setReviewModal] = useState(false);
//   const [bulkActionModal, setBulkActionModal] = useState(false);
//   const [selectedLeave, setSelectedLeave] = useState(null);
//   const [selectedRows, setSelectedRows] = useState([]);
//   const [reviewForm] = Form.useForm();
//   const [bulkForm] = Form.useForm();
//   const [activeTab, setActiveTab] = useState('all');
//   const [filters, setFilters] = useState({
//     status: 'all',
//     category: 'all',
//     type: 'all',
//     urgency: 'all',
//     department: 'all',
//     dateRange: null
//   });
//   const [leaveTypes, setLeaveTypes] = useState({});
//   const [analytics, setAnalytics] = useState({});
//   const navigate = useNavigate();
//   const { user } = useSelector((state) => state.auth);

//   useEffect(() => {
//     fetchLeaveRequests();
//     fetchLeaveTypes();
//     fetchAnalytics();
//   }, [filters, activeTab]);

//   const fetchLeaveRequests = async () => {
//     try {
//       setLoading(true);
//       setError(null);

//       const params = {};
      
//       // Apply tab-specific filters
//       switch (activeTab) {
//         case 'pending':
//           params.status = 'pending_hr';
//           break;
//         case 'approved':
//           // Will filter on frontend for multiple statuses
//           break;
//         case 'urgent':
//           params.urgent = 'true';
//           break;
//         case 'medical':
//           params.category = 'medical';
//           break;
//         case 'family':
//           params.category = 'family';
//           break;
//         case 'vacation':
//           params.category = 'vacation';
//           break;
//       }

//       // Apply additional filters
//       if (filters.status !== 'all') params.status = filters.status;
//       if (filters.category !== 'all') params.category = filters.category;
//       if (filters.type !== 'all') params.type = filters.type;
//       if (filters.urgency !== 'all') params.urgency = filters.urgency;
//       if (filters.department !== 'all') params.department = filters.department;
//       if (filters.dateRange) {
//         params.startDate = filters.dateRange[0].format('YYYY-MM-DD');
//         params.endDate = filters.dateRange[1].format('YYYY-MM-DD');
//       }

//       const response = await leaveApi.getHRLeaves(params);
      
//       if (response.success) {
//         let requests = response.data || [];
        
//         // Apply frontend filters for complex cases
//         if (activeTab === 'approved') {
//           requests = requests.filter(r => r.status === 'approved' || r.status === 'completed');
//         }
        
//         setLeaveRequests(requests);
//       } else {
//         throw new Error(response.message || 'Failed to fetch leave requests');
//       }

//     } catch (error) {
//       console.error('Error fetching leave requests:', error);
//       setError(error.response?.data?.message || error.message || 'Failed to fetch leave requests');
//       setLeaveRequests([]);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const fetchLeaveTypes = async () => {
//     try {
//       const response = await leaveApi.getLeaveTypes();
//       if (response.success) {
//         setLeaveTypes(response.data || {});
//       }
//     } catch (error) {
//       console.error('Error fetching leave types:', error);
//     }
//   };

//   const fetchAnalytics = async () => {
//     try {
//       const response = await leaveApi.getHRAnalytics();
//       if (response.success) {
//         setAnalytics(response.data || {});
//       }
//     } catch (error) {
//       console.error('Error fetching analytics:', error);
//     }
//   };

//   const handleHRReview = async (values) => {
//     try {
//       setLoading(true);

//       const reviewData = {
//         decision: values.decision,
//         comments: values.comments,
//         conditions: values.conditions,
//         medicalCertificateRequired: values.medicalCertificateRequired || false,
//         extendedLeaveGranted: values.extendedLeaveGranted || false,
//         returnToWorkCertificateRequired: values.returnToWorkCertificateRequired || false,
//         reviewNotes: values.reviewNotes,
//         followUpActions: values.followUpActions,
//         additionalSupport: values.additionalSupport
//       };

//       const response = await leaveApi.processHRDecision(selectedLeave._id, reviewData);

//       if (response.success) {
//         message.success(`Leave request ${values.decision}d by HR successfully`);

//         if (response.notifications) {
//           const { sent, failed } = response.notifications;
//           if (sent > 0) {
//             message.success(`${sent} notification(s) sent successfully`);
//           }
//           if (failed > 0) {
//             message.warning(`${failed} notification(s) failed to send`);
//           }
//         }

//         await fetchLeaveRequests();
//         setReviewModal(false);
//         setSelectedLeave(null);
//         reviewForm.resetFields();

//       } else {
//         throw new Error(response.message || 'Failed to process HR review');
//       }

//     } catch (error) {
//       console.error('Error submitting HR review:', error);
//       message.error(error.response?.data?.message || 'Failed to process HR review');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleBulkAction = async (values) => {
//     try {
//       setLoading(true);

//       let response;
//       if (values.action === 'approve') {
//         response = await leaveApi.bulkApprove(selectedRows, values.comments);
//       } else if (values.action === 'reject') {
//         response = await leaveApi.bulkReject(selectedRows, values.comments);
//       }

//       if (response.success) {
//         message.success(`Bulk ${values.action} completed successfully`);
//         await fetchLeaveRequests();
//         setBulkActionModal(false);
//         setSelectedRows([]);
//         bulkForm.resetFields();
//       } else {
//         throw new Error(response.message || 'Failed to process bulk action');
//       }

//     } catch (error) {
//       console.error('Error processing bulk action:', error);
//       message.error(error.response?.data?.message || 'Failed to process bulk action');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const getStatusTag = (status) => {
//     const statusMap = {
//       'pending_supervisor': { 
//         color: 'orange', 
//         icon: <ClockCircleOutlined />, 
//         text: 'Pending Supervisor' 
//       },
//       'pending_hr': { 
//         color: 'blue', 
//         icon: <ClockCircleOutlined />, 
//         text: 'Pending HR' 
//       },
//       'pending_admin': { 
//         color: 'purple', 
//         icon: <ClockCircleOutlined />, 
//         text: 'Pending Admin' 
//       },
//       'approved': { 
//         color: 'green', 
//         icon: <CheckCircleOutlined />, 
//         text: 'Approved' 
//       },
//       'rejected': { 
//         color: 'red', 
//         icon: <CloseCircleOutlined />, 
//         text: 'Rejected' 
//       },
//       'completed': { 
//         color: 'cyan', 
//         icon: <SafetyCertificateOutlined />, 
//         text: 'Completed' 
//       },
//       'in_progress': { 
//         color: 'blue', 
//         icon: <CalendarOutlined />, 
//         text: 'In Progress' 
//       },
//       'cancelled': { 
//         color: 'gray', 
//         icon: <CloseCircleOutlined />, 
//         text: 'Cancelled' 
//       }
//     };

//     const statusInfo = statusMap[status] || { 
//       color: 'default', 
//       text: status?.replace('_', ' ') || 'Unknown' 
//     };

//     return (
//       <Tag color={statusInfo.color} icon={statusInfo.icon}>
//         {statusInfo.text}
//       </Tag>
//     );
//   };

//   const getUrgencyTag = (urgency) => {
//     const urgencyMap = {
//       'critical': { color: 'red', text: 'Critical', icon: '🚨' },
//       'high': { color: 'orange', text: 'High', icon: '⚡' },
//       'medium': { color: 'yellow', text: 'Medium', icon: '⚠️' },
//       'low': { color: 'green', text: 'Low', icon: '📝' }
//     };

//     const urgencyInfo = urgencyMap[urgency] || { color: 'default', text: urgency, icon: '📋' };

//     return (
//       <Tag color={urgencyInfo.color}>
//         {urgencyInfo.icon} {urgencyInfo.text}
//       </Tag>
//     );
//   };

//   const getCategoryTag = (category) => {
//     const categoryMap = {
//       'medical': { color: 'red', text: 'Medical', icon: <MedicineBoxOutlined /> },
//       'vacation': { color: 'blue', text: 'Vacation', icon: <RestOutlined /> },
//       'personal': { color: 'purple', text: 'Personal', icon: <UserOutlined /> },
//       'emergency': { color: 'orange', text: 'Emergency', icon: <WarningOutlined /> },
//       'family': { color: 'green', text: 'Family', icon: <TeamOutlined /> },
//       'bereavement': { color: 'gray', text: 'Bereavement', icon: <HeartOutlined /> },
//       'study': { color: 'cyan', text: 'Study', icon: <BookOutlined /> },
//       'maternity': { color: 'pink', text: 'Maternity', icon: '🤱' },
//       'paternity': { color: 'lime', text: 'Paternity', icon: '👨‍👩‍👧‍👦' },
//       'compensatory': { color: 'gold', text: 'Comp Time', icon: '⏰' },
//       'sabbatical': { color: 'magenta', text: 'Sabbatical', icon: '🎓' },
//       'unpaid': { color: 'volcano', text: 'Unpaid', icon: '💸' }
//     };

//     const categoryInfo = categoryMap[category] || { 
//       color: 'default', 
//       text: category?.replace('_', ' ') || 'Other',
//       icon: <FileTextOutlined />
//     };

//     return (
//       <Tag color={categoryInfo.color} icon={categoryInfo.icon}>
//         {categoryInfo.text}
//       </Tag>
//     );
//   };

//   const getLeaveTypeDisplay = (type) => {
//     for (const category of Object.values(leaveTypes)) {
//       const foundType = category.types?.find(t => t.value === type);
//       if (foundType) {
//         return foundType.label;
//       }
//     }
//     return type?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown';
//   };

//   const leaveColumns = [
//     {
//       title: 'Employee & Leave',
//       key: 'employeeLeave',
//       render: (_, record) => (
//         <div>
//           <Text strong>{record.employee?.fullName || 'Unknown'}</Text>
//           <br />
//           <Text type="secondary" style={{ fontSize: '11px' }}>
//             {record.employee?.department} - {record.employee?.position}
//           </Text>
//           <br />
//           <Text code style={{ fontSize: '10px' }}>
//             {record.leaveNumber || record.displayId || `LEA-${record._id?.slice(-6).toUpperCase()}`}
//           </Text>
//           <br />
//           <div style={{ marginTop: '4px' }}>
//             {getCategoryTag(record.leaveCategory)}
//           </div>
//           <Text style={{ fontSize: '10px', color: '#666', marginTop: '2px', display: 'block' }}>
//             {getLeaveTypeDisplay(record.leaveType)}
//           </Text>
//         </div>
//       ),
//       width: 200
//     },
//     {
//       title: 'Leave Period',
//       key: 'leavePeriod',
//       render: (_, record) => (
//         <div>
//           <Text strong style={{ fontSize: '12px' }}>
//             {dayjs(record.startDate).format('MMM DD')} - {dayjs(record.endDate).format('MMM DD, YYYY')}
//           </Text>
//           <br />
//           <Text type="secondary" style={{ fontSize: '11px' }}>
//             Duration: {record.totalDays} {record.totalDays === 1 ? 'day' : 'days'}
//           </Text>
//           <br />
//           {record.totalDays > 10 && (
//             <Tag color="orange" size="small">Extended Leave</Tag>
//           )}
//           {record.isPartialDay && (
//             <Tag color="blue" size="small">Partial Day</Tag>
//           )}
//         </div>
//       ),
//       width: 140
//     },
//     {
//       title: 'Details & Urgency',
//       key: 'detailsUrgency',
//       render: (_, record) => (
//         <div>
//           {getUrgencyTag(record.urgency)}
//           <br />
//           <Tag color={record.priority === 'critical' ? 'red' : record.priority === 'urgent' ? 'orange' : 'default'} 
//                size="small" style={{ marginTop: '4px' }}>
//             {record.priority?.toUpperCase() || 'ROUTINE'}
//           </Tag>
//           <br />
//           {/* Medical Info for medical leaves */}
//           {record.leaveCategory === 'medical' && (
//             <div style={{ marginTop: '4px' }}>
//               {record.medicalInfo?.medicalCertificate?.provided ? (
//                 <Tag color="green" size="small">📄 Certificate</Tag>
//               ) : (
//                 <Tag color="orange" size="small">📋 No Certificate</Tag>
//               )}
//               <br />
//               <Text style={{ fontSize: '9px', color: '#666' }}>
//                 Dr: {record.medicalInfo?.doctorDetails?.name || 'N/A'}
//               </Text>
//             </div>
//           )}
//           {/* Show reason preview */}
//           <Tooltip title={record.reason}>
//             <Text style={{ fontSize: '9px', color: '#666', marginTop: '2px', display: 'block' }}>
//               {record.reason?.length > 30 ? `${record.reason.substring(0, 30)}...` : record.reason}
//             </Text>
//           </Tooltip>
//         </div>
//       ),
//       width: 150
//     },
//     {
//       title: 'Leave Balance Impact',
//       key: 'leaveBalance',
//       render: (_, record) => {
//         // Mock balance calculation - replace with actual data from backend
//         const balance = record.leaveBalance || {
//           previousBalance: Math.floor(Math.random() * 21) + 10,
//           daysDeducted: record.totalDays,
//           remainingBalance: Math.floor(Math.random() * 15) + 5
//         };

//         const usagePercentage = ((balance.daysDeducted / (balance.previousBalance || 21)) * 100);

//         return (
//           <div>
//             <div style={{ fontSize: '11px' }}>
//               <Text strong>Impact:</Text> -{record.totalDays} days
//             </div>
//             <div style={{ fontSize: '11px' }}>
//               <Text strong>Remaining:</Text> {balance.remainingBalance || 'N/A'}
//             </div>
//             <Progress
//               size="small"
//               percent={Math.min(usagePercentage, 100)}
//               status={
//                 usagePercentage > 80 ? 'exception' :
//                 usagePercentage > 60 ? 'normal' : 'success'
//               }
//               showInfo={false}
//               style={{ marginTop: '4px' }}
//             />
//             <Text style={{ fontSize: '9px', color: '#666' }}>
//               {record.leaveCategory} balance
//             </Text>
//           </div>
//         );
//       },
//       width: 120
//     },
//     {
//       title: 'HR Status & Review',
//       key: 'hrStatus',
//       render: (_, record) => (
//         <div>
//           {record.hrReview ? (
//             <div>
//               <Tag color={record.hrReview.decision === 'approve' ? 'green' : 'red'} size="small">
//                 {record.hrReview.decision === 'approve' ? '✅ Approved' : '❌ Rejected'}
//               </Tag>
//               <div style={{ fontSize: '10px', marginTop: '4px' }}>
//                 by {record.hrReview.decidedBy?.fullName || 'HR'}
//               </div>
//               <div style={{ fontSize: '9px', color: '#666' }}>
//                 {dayjs(record.hrReview.decisionDate).format('MMM DD')}
//               </div>
//             </div>
//           ) : (
//             <div>
//               <Tag color="orange" size="small">⏳ Pending HR</Tag>
//               {record.supervisorDecision?.decision === 'approve' && (
//                 <div style={{ fontSize: '10px', marginTop: '4px' }}>
//                   ✅ Supervisor Approved
//                 </div>
//               )}
//               {record.status === 'pending_hr' && (
//                 <Tag color="blue" size="small" style={{ marginTop: '2px' }}>
//                   Ready for Review
//                 </Tag>
//               )}
//             </div>
//           )}
//         </div>
//       ),
//       width: 130
//     },
//     {
//       title: 'Status & Progress',
//       key: 'statusProgress',
//       render: (_, record) => (
//         <div>
//           {getStatusTag(record.status)}
//           <div style={{ marginTop: '8px', width: '100px' }}>
//             <Progress 
//               size="small"
//               percent={
//                 record.status === 'completed' ? 100 :
//                 record.status === 'approved' ? 75 :
//                 record.status === 'pending_hr' ? 50 :
//                 record.status === 'pending_supervisor' ? 25 : 0
//               }
//               status={
//                 record.status === 'completed' ? 'success' :
//                 record.status === 'rejected' ? 'exception' : 'active'
//               }
//               showInfo={false}
//             />
//           </div>
//           <Text style={{ fontSize: '9px', color: '#666', marginTop: '2px', display: 'block' }}>
//             {record.status === 'approved' ? 'Approved & Active' :
//              record.status === 'pending_hr' ? 'Awaiting HR Review' :
//              record.status === 'completed' ? 'Leave Completed' :
//              'In Process'}
//           </Text>
//         </div>
//       ),
//       width: 120
//     },
//     {
//       title: 'Submitted',
//       dataIndex: 'submittedAt',
//       key: 'submittedAt',
//       render: (date) => (
//         <div>
//           <div style={{ fontSize: '12px' }}>
//             {date ? new Date(date).toLocaleDateString() : 'N/A'}
//           </div>
//           <div style={{ fontSize: '10px', color: '#666' }}>
//             {date ? dayjs(date).fromNow() : ''}
//           </div>
//         </div>
//       ),
//       sorter: (a, b) => new Date(a.submittedAt || 0) - new Date(b.submittedAt || 0),
//       defaultSortOrder: 'descend',
//       width: 100
//     },
//     {
//       title: 'Actions',
//       key: 'actions',
//       render: (_, record) => (
//         <Space size="small">
//           <Button 
//             type="link" 
//             icon={<EyeOutlined />}
//             onClick={() => navigate(`/hr/leave/${record._id}`)}
//             size="small"
//           >
//             View
//           </Button>
//           {!record.hrReview && (record.supervisorDecision?.decision === 'approve' || record.status === 'pending_hr') && (
//             <Button 
//               type="link" 
//               icon={<EditOutlined />}
//               onClick={() => {
//                 setSelectedLeave(record);
//                 setReviewModal(true);
//               }}
//               size="small"
//             >
//               Review
//             </Button>
//           )}
//         </Space>
//       ),
//       width: 100
//     }
//   ];

//   const rowSelection = {
//     selectedRowKeys: selectedRows,
//     onChange: (selectedRowKeys) => {
//       setSelectedRows(selectedRowKeys);
//     },
//     getCheckboxProps: (record) => ({
//       disabled: record.hrReview != null, // Disable if already reviewed
//     }),
//   };

//   const filteredRequests = leaveRequests.filter(request => {
//     return true; // Tab filtering is already applied in fetchLeaveRequests
//   });

//   const getStatsCards = () => {
//     const totalRequests = leaveRequests.length;
//     const pendingHRReviews = leaveRequests.filter(r => r.status === 'pending_hr').length;
//     const urgentCases = leaveRequests.filter(r => r.urgency === 'critical' || r.urgency === 'high').length;
//     const medicalLeaves = leaveRequests.filter(r => r.leaveCategory === 'medical').length;
//     const familyLeaves = leaveRequests.filter(r => r.leaveCategory === 'family').length;
//     const totalDaysRequested = leaveRequests.reduce((sum, r) => sum + r.totalDays, 0);

//     return (
//       <Row gutter={16} style={{ marginBottom: '24px' }}>
//         <Col xs={12} sm={8} md={4}>
//           <Card size="small">
//             <Statistic
//               title="Total Requests"
//               value={totalRequests}
//               prefix={<CalendarOutlined />}
//               valueStyle={{ color: '#1890ff' }}
//             />
//           </Card>
//         </Col>
//         <Col xs={12} sm={8} md={4}>
//           <Card size="small">
//             <Statistic
//               title="Pending HR Review"
//               value={pendingHRReviews}
//               prefix={<ClockCircleOutlined />}
//               valueStyle={{ color: '#faad14' }}
//             />
//           </Card>
//         </Col>
//         <Col xs={12} sm={8} md={4}>
//           <Card size="small">
//             <Statistic
//               title="Urgent Cases"
//               value={urgentCases}
//               prefix={<WarningOutlined />}
//               valueStyle={{ color: '#ff4d4f' }}
//             />
//           </Card>
//         </Col>
//         <Col xs={12} sm={8} md={4}>
//           <Card size="small">
//             <Statistic
//               title="Medical Leaves"
//               value={medicalLeaves}
//               prefix={<MedicineBoxOutlined />}
//               valueStyle={{ color: '#722ed1' }}
//             />
//           </Card>
//         </Col>
//         <Col xs={12} sm={8} md={4}>
//           <Card size="small">
//             <Statistic
//               title="Family Leaves"
//               value={familyLeaves}
//               prefix={<TeamOutlined />}
//               valueStyle={{ color: '#52c41a' }}
//             />
//           </Card>
//         </Col>
//         <Col xs={12} sm={8} md={4}>
//           <Card size="small">
//             <Statistic
//               title="Total Days"
//               value={totalDaysRequested}
//               prefix={<PieChartOutlined />}
//               valueStyle={{ color: '#13c2c2' }}
//             />
//           </Card>
//         </Col>
//       </Row>
//     );
//   };

//   if (loading && leaveRequests.length === 0) {
//     return (
//       <div style={{ padding: '24px', textAlign: 'center' }}>
//         <Spin size="large" />
//         <div style={{ marginTop: '16px' }}>Loading leave requests...</div>
//       </div>
//     );
//   }

//   return (
//     <div style={{ padding: '24px' }}>
//       <Card>
//         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
//           <Title level={2} style={{ margin: 0 }}>
//             <CalendarOutlined /> HR Leave Management
//           </Title>
//           <Space>
//             <Button 
//               icon={<BarChartOutlined />}
//               onClick={() => navigate('/hr/leave/analytics')}
//             >
//               Analytics
//             </Button>
//             <Button 
//               icon={<DownloadOutlined />}
//               onClick={() => {
//                 // Export functionality placeholder
//                 message.info('Export feature coming soon');
//               }}
//             >
//               Export
//             </Button>
//             <Button 
//               icon={<ReloadOutlined />}
//               onClick={fetchLeaveRequests}
//               loading={loading}
//             >
//               Refresh
//             </Button>
//           </Space>
//         </div>

//         {error && (
//           <Alert
//             message="Error Loading Data"
//             description={error}
//             type="error"
//             showIcon
//             closable
//             style={{ marginBottom: '16px' }}
//             onClose={() => setError(null)}
//           />
//         )}

//         {/* Stats Cards */}
//         {getStatsCards()}

//         {/* Bulk Actions */}
//         {selectedRows.length > 0 && (
//           <Alert
//             message={`${selectedRows.length} requests selected`}
//             description={
//               <Space>
//                 <Button 
//                   type="primary" 
//                   size="small"
//                   icon={<UploadOutlined />}
//                   onClick={() => setBulkActionModal(true)}
//                 >
//                   Bulk Actions
//                 </Button>
//                 <Button 
//                   size="small"
//                   onClick={() => setSelectedRows([])}
//                 >
//                   Clear Selection
//                 </Button>
//               </Space>
//             }
//             type="info"
//             showIcon
//             style={{ marginBottom: '16px' }}
//           />
//         )}

//         {/* Category Tabs */}
//         <Tabs activeKey={activeTab} onChange={setActiveTab} style={{ marginBottom: '16px' }}>
//           <TabPane 
//             tab={
//               <Badge count={leaveRequests.length} offset={[10, 0]}>
//                 <CalendarOutlined /> All Requests
//               </Badge>
//             } 
//             key="all"
//           />
//           <TabPane 
//             tab={
//               <Badge count={leaveRequests.filter(r => r.status === 'pending_hr').length} offset={[10, 0]}>
//                 <ClockCircleOutlined /> Pending HR
//               </Badge>
//             } 
//             key="pending"
//           />
//           <TabPane 
//             tab={
//               <Badge count={leaveRequests.filter(r => r.status === 'approved' || r.status === 'completed').length} offset={[10, 0]}>
//                 <CheckCircleOutlined /> Approved
//               </Badge>
//             } 
//             key="approved"
//           />
//           <TabPane 
//             tab={
//               <Badge count={leaveRequests.filter(r => r.urgency === 'critical' || r.urgency === 'high').length} offset={[10, 0]}>
//                 <WarningOutlined /> Urgent
//               </Badge>
//             } 
//             key="urgent"
//           />
//           <TabPane 
//             tab={
//               <Badge count={leaveRequests.filter(r => r.leaveCategory === 'medical').length} offset={[10, 0]}>
//                 <MedicineBoxOutlined /> Medical
//               </Badge>
//             } 
//             key="medical"
//           />
//           <TabPane 
//             tab={
//               <Badge count={leaveRequests.filter(r => r.leaveCategory === 'family').length} offset={[10, 0]}>
//                 <TeamOutlined /> Family
//               </Badge>
//             } 
//             key="family"
//           />
//           <TabPane 
//             tab={
//               <Badge count={leaveRequests.filter(r => r.leaveCategory === 'vacation').length} offset={[10, 0]}>
//                 <RestOutlined /> Vacation
//               </Badge>
//             } 
//             key="vacation"
//           />
//         </Tabs>

//         {/* Advanced Filters */}
//         <Collapse style={{ marginBottom: '16px' }}>
//           <Panel header={<><FilterOutlined /> Advanced Filters</>} key="filters">
//             <Row gutter={16} align="middle">
//               <Col xs={24} sm={8} md={6} lg={4}>
//                 <Select
//                   style={{ width: '100%' }}
//                   value={filters.status}
//                   onChange={(value) => setFilters({...filters, status: value})}
//                   placeholder="Status"
//                 >
//                   <Select.Option value="all">All Status</Select.Option>
//                   <Select.Option value="pending_supervisor">Pending Supervisor</Select.Option>
//                   <Select.Option value="pending_hr">Pending HR</Select.Option>
//                   <Select.Option value="pending_admin">Pending Admin</Select.Option>
//                   <Select.Option value="approved">Approved</Select.Option>
//                   <Select.Option value="in_progress">In Progress</Select.Option>
//                   <Select.Option value="completed">Completed</Select.Option>
//                   <Select.Option value="rejected">Rejected</Select.Option>
//                 </Select>
//               </Col>
//               <Col xs={24} sm={8} md={6} lg={4}>
//                 <Select
//                   style={{ width: '100%' }}
//                   value={filters.category}
//                   onChange={(value) => setFilters({...filters, category: value})}
//                   placeholder="Category"
//                 >
//                   <Select.Option value="all">All Categories</Select.Option>
//                   <Select.Option value="medical">Medical</Select.Option>
//                   <Select.Option value="vacation">Vacation</Select.Option>
//                   <Select.Option value="personal">Personal</Select.Option>
//                   <Select.Option value="family">Family</Select.Option>
//                   <Select.Option value="emergency">Emergency</Select.Option>
//                   <Select.Option value="bereavement">Bereavement</Select.Option>
//                   <Select.Option value="study">Study</Select.Option>
//                   <Select.Option value="maternity">Maternity</Select.Option>
//                   <Select.Option value="paternity">Paternity</Select.Option>
//                   <Select.Option value="compensatory">Compensatory</Select.Option>
//                   <Select.Option value="sabbatical">Sabbatical</Select.Option>
//                   <Select.Option value="unpaid">Unpaid</Select.Option>
//                 </Select>
//               </Col>
//               <Col xs={24} sm={8} md={6} lg={4}>
//                 <Select
//                   style={{ width: '100%' }}
//                   value={filters.urgency}
//                   onChange={(value) => setFilters({...filters, urgency: value})}
//                   placeholder="Urgency"
//                 >
//                   <Select.Option value="all">All Urgency</Select.Option>
//                   <Select.Option value="critical">Critical</Select.Option>
//                   <Select.Option value="high">High</Select.Option>
//                   <Select.Option value="medium">Medium</Select.Option>
//                   <Select.Option value="low">Low</Select.Option>
//                 </Select>
//               </Col>
//               <Col xs={24} sm={8} md={6} lg={4}>
//                 <Select
//                   style={{ width: '100%' }}
//                   value={filters.department}
//                   onChange={(value) => setFilters({...filters, department: value})}
//                   placeholder="Department"
//                 >
//                   <Select.Option value="all">All Departments</Select.Option>
//                   <Select.Option value="Engineering">Engineering</Select.Option>
//                   <Select.Option value="Marketing">Marketing</Select.Option>
//                   <Select.Option value="Sales">Sales</Select.Option>
//                   <Select.Option value="HR">Human Resources</Select.Option>
//                   <Select.Option value="Finance">Finance</Select.Option>
//                   <Select.Option value="Operations">Operations</Select.Option>
//                 </Select>
//               </Col>
//               <Col xs={24} sm={16} md={8} lg={6}>
//                 <RangePicker
//                   style={{ width: '100%' }}
//                   value={filters.dateRange}
//                   onChange={(dates) => setFilters({...filters, dateRange: dates})}
//                   placeholder={['Start Date', 'End Date']}
//                 />
//               </Col>
//               <Col xs={24} sm={8} md={4} lg={2}>
//                 <Button 
//                   onClick={() => setFilters({
//                     status: 'all',
//                     category: 'all',
//                     type: 'all',
//                     urgency: 'all',
//                     department: 'all',
//                     dateRange: null
//                   })}
//                   block
//                 >
//                   Clear
//                 </Button>
//               </Col>
//             </Row>
//           </Panel>
//         </Collapse>

//         {/* HR Policy Reminders */}
//         <Alert
//           message="HR Policy Reminders"
//           description={
//             <Row gutter={16}>
//               <Col span={6}>
//                 <Text strong>Medical Leaves:</Text> Require certificate for 1 day. Consider EAP referrals.
//               </Col>
//               <Col span={6}>
//                 <Text strong>Family Leaves:</Text> Handle with sensitivity. Check statutory entitlements.
//               </Col>
//               <Col span={6}>
//                 <Text strong>Emergency Cases:</Text> Prioritize approval. Arrange immediate support.
//               </Col>
//               <Col span={6}>
//                 <Text strong>Maternity/Paternity:</Text> Follow legal requirements. Coordinate benefits.
//               </Col>
//             </Row>
//           }
//           type="info"
//           showIcon
//           style={{ marginBottom: '16px' }}
//         />

//         {filteredRequests.length === 0 ? (
//           <Alert
//             message="No Leave Requests Found"
//             description={
//               leaveRequests.length === 0 
//                 ? "No leave requests are currently available for HR review."
//                 : "No requests match your current filter criteria. Try adjusting the filters above."
//             }
//             type="info"
//             showIcon
//             style={{ marginBottom: '16px' }}
//           />
//         ) : (
//           <>
//             <Text type="secondary" style={{ marginBottom: '8px', display: 'block' }}>
//               Showing {filteredRequests.length} of {leaveRequests.length} requests
//             </Text>

//             <Table 
//               columns={leaveColumns} 
//               dataSource={filteredRequests} 
//               loading={loading}
//               rowKey="_id"
//               rowSelection={rowSelection}
//               pagination={{ 
//                 pageSize: 15,
//                 showSizeChanger: true,
//                 showQuickJumper: true,
//                 showTotal: (total, range) => 
//                   `${range[0]}-${range[1]} of ${total} requests`
//               }}
//               scroll={{ x: 'max-content' }}
//               rowClassName={(record) => {
//                 if (record.urgency === 'critical') {
//                   return 'critical-leave-row';
//                 }
//                 if (record.status === 'pending_hr') {
//                   return 'pending-hr-row';
//                 }
//                 if (record.leaveCategory === 'medical' && record.urgency === 'high') {
//                   return 'medical-urgent-row';
//                 }
//                 if (record.leaveCategory === 'family') {
//                   return 'family-leave-row';
//                 }
//                 return '';
//               }}
//             />
//           </>
//         )}
//       </Card>

//       {/* HR Review Modal */}
//       <Modal
//         title={`HR Review - ${selectedLeave?.leaveNumber || selectedLeave?.displayId || `LEA-${selectedLeave?._id?.slice(-6).toUpperCase()}`}`}
//         open={reviewModal}
//         onCancel={() => {
//           setReviewModal(false);
//           setSelectedLeave(null);
//           reviewForm.resetFields();
//         }}
//         footer={null}
//         width={1000}
//       >
//         {selectedLeave && (
//           <Form
//             form={reviewForm}
//             layout="vertical"
//             onFinish={handleHRReview}
//           >
//             <Row gutter={16}>
//               <Col span={24}>
//                 <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#f5f5f5', borderRadius: '6px' }}>
//                   <Descriptions column={3} size="small">
//                     <Descriptions.Item label="Employee">{selectedLeave.employee?.fullName}</Descriptions.Item>
//                     <Descriptions.Item label="Department">{selectedLeave.employee?.department}</Descriptions.Item>
//                     <Descriptions.Item label="Position">{selectedLeave.employee?.position}</Descriptions.Item>
//                     <Descriptions.Item label="Leave Category">{getCategoryTag(selectedLeave.leaveCategory)}</Descriptions.Item>
//                     <Descriptions.Item label="Leave Type">{getLeaveTypeDisplay(selectedLeave.leaveType)}</Descriptions.Item>
//                     <Descriptions.Item label="Duration">{selectedLeave.totalDays} days</Descriptions.Item>
//                     <Descriptions.Item label="Urgency">{getUrgencyTag(selectedLeave.urgency)}</Descriptions.Item>
//                     <Descriptions.Item label="Priority">{selectedLeave.priority?.toUpperCase() || 'ROUTINE'}</Descriptions.Item>
//                     <Descriptions.Item label="Dates">
//                       {dayjs(selectedLeave.startDate).format('MMM DD')} - {dayjs(selectedLeave.endDate).format('MMM DD, YYYY')}
//                     </Descriptions.Item>
//                     <Descriptions.Item label="Reason" span={3}>
//                       <div style={{ whiteSpace: 'pre-wrap', maxHeight: '80px', overflow: 'auto', padding: '8px', backgroundColor: 'white', border: '1px solid #d9d9d9', borderRadius: '4px' }}>
//                         {selectedLeave.reason}
//                       </div>
//                     </Descriptions.Item>
//                     {selectedLeave.description && (
//                       <Descriptions.Item label="Additional Details" span={3}>
//                         <div style={{ whiteSpace: 'pre-wrap', maxHeight: '60px', overflow: 'auto', padding: '8px', backgroundColor: 'white', border: '1px solid #d9d9d9', borderRadius: '4px' }}>
//                           {selectedLeave.description}
//                         </div>
//                       </Descriptions.Item>
//                     )}
//                   </Descriptions>
//                 </div>
//               </Col>
//             </Row>

//             {/* Medical Information for Medical Leaves */}
//             {selectedLeave.leaveCategory === 'medical' && selectedLeave.medicalInfo && (
//               <Card size="small" title="Medical Information" style={{ marginBottom: '16px' }}>
//                 <Descriptions column={2} size="small">
//                   <Descriptions.Item label="Doctor">{selectedLeave.medicalInfo.doctorDetails?.name || 'N/A'}</Descriptions.Item>
//                   <Descriptions.Item label="Hospital">{selectedLeave.medicalInfo.doctorDetails?.hospital || 'N/A'}</Descriptions.Item>
//                   <Descriptions.Item label="Contact">{selectedLeave.medicalInfo.doctorDetails?.contactNumber || 'N/A'}</Descriptions.Item>
//                   <Descriptions.Item label="Certificate">
//                     {selectedLeave.medicalInfo.medicalCertificate?.provided ? 
//                       <Tag color="green">Provided</Tag> : 
//                       <Tag color="orange">Not Provided</Tag>
//                     }
//                   </Descriptions.Item>
//                   {selectedLeave.medicalInfo.symptoms && (
//                     <Descriptions.Item label="Symptoms" span={2}>{selectedLeave.medicalInfo.symptoms}</Descriptions.Item>
//                   )}
//                   {selectedLeave.medicalInfo.treatmentReceived && (
//                     <Descriptions.Item label="Treatment" span={2}>{selectedLeave.medicalInfo.treatmentReceived}</Descriptions.Item>
//                   )}
//                 </Descriptions>
//               </Card>
//             )}

//             {/* Emergency Contact */}
//             {selectedLeave.emergencyContact && (
//               <Card size="small" title="Emergency Contact" style={{ marginBottom: '16px' }}>
//                 <Descriptions column={3} size="small">
//                   <Descriptions.Item label="Name">{selectedLeave.emergencyContact.name}</Descriptions.Item>
//                   <Descriptions.Item label="Phone">{selectedLeave.emergencyContact.phone}</Descriptions.Item>
//                   <Descriptions.Item label="Relationship">{selectedLeave.emergencyContact.relationship}</Descriptions.Item>
//                 </Descriptions>
//               </Card>
//             )}

//             <Row gutter={16}>
//               <Col span={12}>
//                 <Form.Item
//                   name="decision"
//                   label="HR Decision"
//                   rules={[{ required: true, message: 'Please select a decision' }]}
//                 >
//                   <Select placeholder="Select HR decision" size="large">
//                     <Select.Option value="approve">✅ Approve Leave</Select.Option>
//                     <Select.Option value="reject">❌ Reject Leave</Select.Option>
//                     <Select.Option value="conditional_approve">⚠️ Conditional Approval</Select.Option>
//                     <Select.Option value="request_info">❓ Request More Information</Select.Option>
//                   </Select>
//                 </Form.Item>
//               </Col>
//               <Col span={12}>
//                 <Form.Item
//                   name="hrPriority"
//                   label="HR Priority Assessment"
//                 >
//                   <Select placeholder="Assess priority from HR perspective" size="large">
//                     <Select.Option value="immediate">🚨 Immediate Attention Required</Select.Option>
//                     <Select.Option value="standard">⏱️ Standard Processing</Select.Option>
//                     <Select.Option value="routine">📋 Routine Case</Select.Option>
//                     <Select.Option value="follow_up">🔄 Requires Follow-up</Select.Option>
//                   </Select>
//                 </Form.Item>
//               </Col>
//             </Row>

//             <Form.Item
//               name="comments"
//               label="HR Review Comments"
//               rules={[{ required: true, message: 'Please provide HR review comments' }]}
//             >
//               <TextArea 
//                 rows={3} 
//                 placeholder="Provide detailed HR assessment including policy compliance, employee support needs, impact on operations..."
//                 showCount
//                 maxLength={600}
//               />
//             </Form.Item>

//             <Row gutter={16}>
//               <Col span={12}>
//                 <Form.Item
//                   name="conditions"
//                   label="Conditions/Requirements (if applicable)"
//                 >
//                   <TextArea 
//                     rows={2} 
//                     placeholder="List any conditions for approval (e.g., medical certificate required by return date)..."
//                     showCount
//                     maxLength={300}
//                   />
//                 </Form.Item>
//               </Col>
//               <Col span={12}>
//                 <Form.Item
//                   name="reviewNotes"
//                   label="Internal HR Notes"
//                 >
//                   <TextArea 
//                     rows={2} 
//                     placeholder="Internal notes for HR records (not shared with employee)..."
//                     showCount
//                     maxLength={300}
//                   />
//                 </Form.Item>
//               </Col>
//             </Row>

//             {/* Checkbox Options */}
//             <Row gutter={16}>
//               <Col span={8}>
//                 <Form.Item name="medicalCertificateRequired" valuePropName="checked">
//                   <Checkbox>Require Medical Certificate</Checkbox>
//                 </Form.Item>
//               </Col>
//               <Col span={8}>
//                 <Form.Item name="returnToWorkCertificateRequired" valuePropName="checked">
//                   <Checkbox>Return-to-Work Certificate Required</Checkbox>
//                 </Form.Item>
//               </Col>
//               <Col span={8}>
//                 <Form.Item name="extendedLeaveGranted" valuePropName="checked">
//                   <Checkbox>Extended Leave Granted</Checkbox>
//                 </Form.Item>
//               </Col>
//             </Row>

//             <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
//               <Space>
//                 <Button onClick={() => setReviewModal(false)}>
//                   Cancel
//                 </Button>
//                 <Button type="primary" htmlType="submit" loading={loading}>
//                   Submit HR Review
//                 </Button>
//               </Space>
//             </Form.Item>
//           </Form>
//         )}
//       </Modal>

//       {/* Bulk Action Modal */}
//       <Modal
//         title="Bulk Actions"
//         open={bulkActionModal}
//         onCancel={() => {
//           setBulkActionModal(false);
//           bulkForm.resetFields();
//         }}
//         footer={null}
//       >
//         <Form
//           form={bulkForm}
//           layout="vertical"
//           onFinish={handleBulkAction}
//         >
//           <Alert
//             message={`${selectedRows.length} requests selected for bulk action`}
//             type="info"
//             showIcon
//             style={{ marginBottom: '16px' }}
//           />

//           <Form.Item
//             name="action"
//             label="Bulk Action"
//             rules={[{ required: true, message: 'Please select an action' }]}
//           >
//             <Select placeholder="Select bulk action" size="large">
//               <Select.Option value="approve">✅ Bulk Approve</Select.Option>
//               <Select.Option value="reject">❌ Bulk Reject</Select.Option>
//             </Select>
//           </Form.Item>

//           <Form.Item
//             name="comments"
//             label="Comments"
//             rules={[{ required: true, message: 'Please provide comments for bulk action' }]}
//           >
//             <TextArea 
//               rows={3} 
//               placeholder="Provide reason for bulk action..."
//               showCount
//               maxLength={300}
//             />
//           </Form.Item>

//           <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
//             <Space>
//               <Button onClick={() => setBulkActionModal(false)}>
//                 Cancel
//               </Button>
//               <Button type="primary" htmlType="submit" loading={loading}>
//                 Execute Bulk Action
//               </Button>
//             </Space>
//           </Form.Item>
//         </Form>
//       </Modal>

//       <style jsx>{`
//         .critical-leave-row {
//           background-color: #fff1f0 !important;
//           border-left: 4px solid #ff4d4f !important;
//         }
//         .critical-leave-row:hover {
//           background-color: #ffe7e6 !important;
//         }
//         .pending-hr-row {
//           background-color: #fffbf0 !important;
//           border-left: 3px solid #faad14 !important;
//         }
//         .pending-hr-row:hover {
//           background-color: #fff1d6 !important;
//         }
//         .medical-urgent-row {
//           background-color: #fff0f6 !important;
//           border-left: 3px solid #eb2f96 !important;
//         }
//         .medical-urgent-row:hover {
//           background-color: #ffd6e7 !important;
//         }
//         .family-leave-row {
//           background-color: #f6ffed !important;
//           border-left: 2px solid #52c41a !important;
//         }
//         .family-leave-row:hover {
//           background-color: #d9f7be !important;
//         }
//       `}</style>
//     </div>
//   );
// };

// export default HRLeaveManagement;



