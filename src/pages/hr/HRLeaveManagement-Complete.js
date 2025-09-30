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
  Checkbox,
  Switch,
  Empty,
  Divider,
  Upload
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
  FilterOutlined,
  BulkOutlined,
  SendOutlined,
  CommentOutlined,
  PhoneOutlined
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

const HRLeaveManagementComplete = () => {
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reviewModal, setReviewModal] = useState(false);
  const [bulkActionModal, setBulkActionModal] = useState(false);
  const [detailsModal, setDetailsModal] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [selectedRows, setSelectedRows] = useState([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [reviewForm] = Form.useForm();
  const [bulkForm] = Form.useForm();
  const [activeTab, setActiveTab] = useState('pending');
  const [filters, setFilters] = useState({
    status: 'all',
    category: 'all',
    urgency: 'all',
    department: 'all',
    dateRange: null
  });
  const [leaveTypes, setLeaveTypes] = useState({});
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
        fetchLeaveTypes(),
        fetchAnalytics(),
        fetchStats()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load data');
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
          params.status = 'pending_hr';
          break;
        case 'approved':
          // Will filter on frontend for multiple statuses
          break;
        case 'urgent':
          params.urgency = 'high,critical';
          break;
        case 'medical':
          params.category = 'medical';
          break;
        case 'family':
          params.category = 'family,maternity,paternity';
          break;
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

      const response = await leaveApi.getHRLeaves(params);
      
      if (response.success) {
        let requests = Array.isArray(response.data) ? response.data : 
                      (response.data?.docs ? response.data.docs : []);
        
        // Apply frontend filters for complex cases
        if (activeTab === 'approved') {
          requests = requests.filter(r => ['approved', 'completed'].includes(r.status));
        }
        
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

  const handleHRReview = async (values) => {
    try {
      setLoading(true);

      const reviewData = {
        decision: values.decision,
        comments: values.comments || '',
        conditions: values.conditions || '',
        medicalCertificateRequired: values.medicalCertificateRequired || false,
        extendedLeaveGranted: values.extendedLeaveGranted || false,
        returnToWorkCertificateRequired: values.returnToWorkCertificateRequired || false,
        reviewNotes: values.reviewNotes || ''
      };

      const response = await leaveApi.processHRDecision(selectedLeave._id, reviewData);

      if (response.success) {
        message.success(`Leave request ${values.decision}d by HR successfully`);
        setReviewModal(false);
        reviewForm.resetFields();
        setSelectedLeave(null);
        await fetchLeaveRequests();
      } else {
        throw new Error(response.message || 'Failed to process HR decision');
      }

    } catch (error) {
      console.error('HR review error:', error);
      message.error(error.response?.data?.message || error.message || 'Failed to process HR decision');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkAction = async (values) => {
    try {
      setLoading(true);
      
      const { action, comments } = values;
      const leaveIds = selectedRowKeys;

      let response;
      if (action === 'approve') {
        response = await leaveApi.bulkApprove(leaveIds, comments);
      } else if (action === 'reject') {
        response = await leaveApi.bulkReject(leaveIds, comments);
      } else {
        throw new Error('Invalid bulk action');
      }

      if (response.success) {
        message.success(`${leaveIds.length} leave requests ${action}d successfully`);
        setBulkActionModal(false);
        bulkForm.resetFields();
        setSelectedRowKeys([]);
        setSelectedRows([]);
        await fetchLeaveRequests();
      } else {
        throw new Error(response.message || 'Bulk action failed');
      }

    } catch (error) {
      console.error('Bulk action error:', error);
      message.error(error.response?.data?.message || error.message || 'Bulk action failed');
    } finally {
      setLoading(false);
    }
  };

  const openReviewModal = (record) => {
    setSelectedLeave(record);
    reviewForm.setFieldsValue({
      employeeName: record.employee?.fullName || 'Unknown',
      leaveType: record.leaveType,
      startDate: dayjs(record.startDate).format('MMM DD, YYYY'),
      endDate: dayjs(record.endDate).format('MMM DD, YYYY'),
      totalDays: record.totalDays,
      reason: record.reason
    });
    setReviewModal(true);
  };

  const openDetailsModal = (record) => {
    setSelectedLeave(record);
    setDetailsModal(true);
  };

  const getStatusTag = (status) => {
    const statusMap = {
      'pending_supervisor': { color: 'orange', text: 'Pending Supervisor', icon: <ClockCircleOutlined /> },
      'pending_hr': { color: 'blue', text: 'Pending HR Review', icon: <ClockCircleOutlined /> },
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
          <br />
          <Tooltip title={record.reason}>
            <Text ellipsis style={{ fontSize: '11px', color: '#666', display: 'block', maxWidth: '250px', marginTop: '2px' }}>
              {record.reason && record.reason.length > 60 ? 
                `${record.reason.substring(0, 60)}...` : 
                record.reason || 'No reason provided'
              }
            </Text>
          </Tooltip>
        </div>
      ),
      width: 300
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
            {(record.priority || 'routine').toUpperCase()}
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
          {record.status === 'pending_hr' && (
            <Button 
              type="primary" 
              size="small"
              icon={<EditOutlined />}
              onClick={() => openReviewModal(record)}
            >
              Review
            </Button>
          )}
        </Space>
      ),
      width: 120
    }
  ];

  const rowSelection = {
    type: 'checkbox',
    selectedRowKeys,
    onChange: (selectedRowKeys, selectedRows) => {
      setSelectedRowKeys(selectedRowKeys);
      setSelectedRows(selectedRows);
    },
    getCheckboxProps: (record) => ({
      disabled: record.status !== 'pending_hr',
      name: record._id,
    }),
  };

  const getTabCounts = () => {
    const counts = { 
      all: leaveRequests.length,
      pending: leaveRequests.filter(r => r.status === 'pending_hr').length,
      approved: leaveRequests.filter(r => ['approved', 'completed'].includes(r.status)).length,
      urgent: leaveRequests.filter(r => ['high', 'critical'].includes(r.urgency)).length,
      medical: leaveRequests.filter(r => r.leaveCategory === 'medical').length,
      family: leaveRequests.filter(r => ['family', 'maternity', 'paternity'].includes(r.leaveCategory)).length
    };
    return counts;
  };

  const tabCounts = getTabCounts();

  const statsCards = [
    {
      title: "Pending HR Review",
      value: tabCounts.pending,
      icon: <ClockCircleOutlined />,
      color: "#faad14"
    },
    {
      title: "Approved Today",
      value: stats.approvedToday || 0,
      icon: <CheckCircleOutlined />,
      color: "#52c41a"
    },
    {
      title: "Urgent Requests",
      value: tabCounts.urgent,
      icon: <WarningOutlined />,
      color: "#ff4d4f"
    },
    {
      title: "On Leave Today",
      value: stats.onLeaveToday || 0,
      icon: <CalendarOutlined />,
      color: "#1890ff"
    }
  ];

  if (loading && leaveRequests.length === 0) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Spin size="large" />
        <div style={{ marginTop: '16px' }}>Loading HR leave management...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <Title level={2} style={{ margin: 0 }}>
            <TeamOutlined /> HR Leave Management
          </Title>
          <Space>
            <Button 
              icon={<ReloadOutlined />}
              onClick={fetchData}
              loading={loading}
            >
              Refresh
            </Button>
            {selectedRowKeys.length > 0 && (
              <Button 
                type="primary"
                icon={<BulkOutlined />}
                onClick={() => setBulkActionModal(true)}
              >
                Bulk Action ({selectedRowKeys.length})
              </Button>
            )}
            <Button 
              icon={<BarChartOutlined />}
              onClick={() => navigate('/hr/analytics')}
            >
              Analytics
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
                <Select.Option value="pending_hr">Pending HR</Select.Option>
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
                <Select.Option value="bereavement">Bereavement</Select.Option>
                <Select.Option value="study">Study</Select.Option>
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
                Clear Filters
              </Button>
            </Col>
          </Row>
        </Card>

        {/* Leave Categories Tabs */}
        <Tabs activeKey={activeTab} onChange={setActiveTab} style={{ marginBottom: '16px' }}>
          <TabPane 
            tab={<Badge count={tabCounts.pending} offset={[10, 0]}><ClockCircleOutlined /> Pending Review</Badge>} 
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
            tab={<Badge count={tabCounts.family} offset={[10, 0]}><HeartOutlined /> Family</Badge>} 
            key="family" 
          />
          <TabPane 
            tab={<Badge count={tabCounts.all} offset={[10, 0]}>All Requests</Badge>} 
            key="all" 
          />
        </Tabs>

        {leaveRequests.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="No leave requests found"
            >
              <Text type="secondary">
                {activeTab === 'pending' ? 
                  "No leave requests are currently pending HR review." :
                  "No requests match your current filter criteria."
                }
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
              rowSelection={activeTab === 'pending' ? rowSelection : undefined}
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

      {/* HR Review Modal */}
      <Modal
        title={
          <div>
            <FileTextOutlined style={{ marginRight: '8px' }} />
            HR Review - {selectedLeave?.employee?.fullName}
          </div>
        }
        visible={reviewModal}
        onCancel={() => {
          setReviewModal(false);
          setSelectedLeave(null);
          reviewForm.resetFields();
        }}
        footer={null}
        width={800}
      >
        <Form
          form={reviewForm}
          layout="vertical"
          onFinish={handleHRReview}
          style={{ marginTop: '20px' }}
        >
          {/* Employee Info */}
          <Card size="small" style={{ marginBottom: '20px', backgroundColor: '#f9f9f9' }}>
            <Descriptions size="small" column={2}>
              <Descriptions.Item label="Employee">
                <Text strong>{selectedLeave?.employee?.fullName}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Department">
                {selectedLeave?.employee?.department}
              </Descriptions.Item>
              <Descriptions.Item label="Leave Type">
                {getCategoryTag(selectedLeave?.leaveCategory)}
                <span style={{ marginLeft: '8px' }}>
                  {leaveApi.getLeaveTypeDisplay(selectedLeave?.leaveType)}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="Duration">
                {selectedLeave?.totalDays} days
              </Descriptions.Item>
              <Descriptions.Item label="Period">
                {selectedLeave && dayjs(selectedLeave.startDate).format('MMM DD, YYYY')} - {selectedLeave && dayjs(selectedLeave.endDate).format('MMM DD, YYYY')}
              </Descriptions.Item>
              <Descriptions.Item label="Urgency">
                {selectedLeave && getUrgencyTag(selectedLeave.urgency)}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          {/* Leave Details */}
          <div style={{ marginBottom: '20px' }}>
            <Text strong>Reason for Leave:</Text>
            <div style={{ 
              padding: '8px 12px', 
              backgroundColor: '#f5f5f5', 
              borderRadius: '4px', 
              marginTop: '4px' 
            }}>
              {selectedLeave?.reason}
            </div>
          </div>

          {/* Medical Information (if applicable) */}
          {selectedLeave?.leaveCategory === 'medical' && (
            <Card size="small" title="Medical Information" style={{ marginBottom: '20px' }}>
              <Row gutter={16}>
                <Col span={12}>
                  <Text strong>Doctor:</Text>
                  <div>{selectedLeave?.medicalInfo?.doctorDetails?.name || 'N/A'}</div>
                </Col>
                <Col span={12}>
                  <Text strong>Hospital:</Text>
                  <div>{selectedLeave?.medicalInfo?.doctorDetails?.hospital || 'N/A'}</div>
                </Col>
              </Row>
              <div style={{ marginTop: '12px' }}>
                <Text strong>Symptoms:</Text>
                <div>{selectedLeave?.medicalInfo?.symptoms || 'Not provided'}</div>
              </div>
              <div style={{ marginTop: '12px' }}>
                <Text strong>Medical Certificate:</Text>
                <div>
                  {selectedLeave?.medicalInfo?.medicalCertificate?.provided ? (
                    <Tag color="green">Provided</Tag>
                  ) : (
                    <Tag color="red">Not Provided</Tag>
                  )}
                </div>
              </div>
            </Card>
          )}

          {/* HR Decision */}
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="decision"
                label="HR Decision"
                rules={[{ required: true, message: 'Please select a decision' }]}
              >
                <Select placeholder="Select decision" size="large">
                  <Select.Option value="approve">
                    <CheckCircleOutlined style={{ color: 'green' }} /> Approve
                  </Select.Option>
                  <Select.Option value="reject">
                    <CloseCircleOutlined style={{ color: 'red' }} /> Reject
                  </Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="medicalCertificateRequired" valuePropName="checked">
                <Checkbox>Medical certificate required for return</Checkbox>
              </Form.Item>
              <Form.Item name="returnToWorkCertificateRequired" valuePropName="checked">
                <Checkbox>Return to work certificate required</Checkbox>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="comments"
            label="Comments"
            rules={[{ required: true, message: 'Please provide comments' }]}
          >
            <TextArea
              rows={3}
              placeholder="Provide feedback and comments for the employee..."
              showCount
              maxLength={500}
            />
          </Form.Item>

          <Form.Item name="conditions" label="Conditions/Requirements (if any)">
            <TextArea
              rows={2}
              placeholder="Any specific conditions or requirements..."
              showCount
              maxLength={300}
            />
          </Form.Item>

          <Form.Item name="reviewNotes" label="Internal HR Notes">
            <TextArea
              rows={2}
              placeholder="Internal notes for HR records..."
              showCount
              maxLength={300}
            />
          </Form.Item>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <Button onClick={() => setReviewModal(false)}>
              Cancel
            </Button>
            <Button type="primary" htmlType="submit" loading={loading}>
              Submit Review
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Bulk Action Modal */}
      <Modal
        title={`Bulk Action - ${selectedRowKeys.length} requests selected`}
        visible={bulkActionModal}
        onCancel={() => {
          setBulkActionModal(false);
          bulkForm.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form form={bulkForm} layout="vertical" onFinish={handleBulkAction}>
          <Alert
            message="Bulk Action"
            description={`You are about to perform a bulk action on ${selectedRowKeys.length} leave requests. This action cannot be undone.`}
            type="warning"
            showIcon
            style={{ marginBottom: '20px' }}
          />

          <Form.Item
            name="action"
            label="Action"
            rules={[{ required: true, message: 'Please select an action' }]}
          >
            <Select placeholder="Select action" size="large">
              <Select.Option value="approve">
                <CheckCircleOutlined style={{ color: 'green' }} /> Approve All
              </Select.Option>
              <Select.Option value="reject">
                <CloseCircleOutlined style={{ color: 'red' }} /> Reject All
              </Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="comments"
            label="Comments"
            rules={[{ required: true, message: 'Please provide comments for bulk action' }]}
          >
            <TextArea
              rows={3}
              placeholder="Provide comments that will be applied to all selected requests..."
              showCount
              maxLength={500}
            />
          </Form.Item>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <Button onClick={() => setBulkActionModal(false)}>
              Cancel
            </Button>
            <Button type="primary" htmlType="submit" loading={loading}>
              Execute Bulk Action
            </Button>
          </div>
        </Form>
      </Modal>

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
                <Descriptions.Item label="Leave Category">
                  {getCategoryTag(selectedLeave.leaveCategory)}
                </Descriptions.Item>
                <Descriptions.Item label="Leave Type">
                  {leaveApi.getLeaveTypeDisplay(selectedLeave.leaveType)}
                </Descriptions.Item>
                <Descriptions.Item label="Start Date">
                  {dayjs(selectedLeave.startDate).format('MMMM DD, YYYY')}
                </Descriptions.Item>
                <Descriptions.Item label="End Date">
                  {dayjs(selectedLeave.endDate).format('MMMM DD, YYYY')}
                </Descriptions.Item>
                <Descriptions.Item label="Total Days">
                  {selectedLeave.totalDays}
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

            {/* Medical Information (if applicable) */}
            {selectedLeave.leaveCategory === 'medical' && selectedLeave.medicalInfo && (
              <Card size="small" title="Medical Information" style={{ marginBottom: '16px' }}>
                <Row gutter={16}>
                  <Col span={12}>
                    <Text strong>Doctor Details:</Text>
                    <div>Name: {selectedLeave.medicalInfo.doctorDetails?.name || 'N/A'}</div>
                    <div>Hospital: {selectedLeave.medicalInfo.doctorDetails?.hospital || 'N/A'}</div>
                    <div>Contact: {selectedLeave.medicalInfo.doctorDetails?.contactNumber || 'N/A'}</div>
                  </Col>
                  <Col span={12}>
                    <Text strong>Medical Certificate:</Text>
                    <div>
                      {selectedLeave.medicalInfo.medicalCertificate?.provided ? (
                        <Tag color="green">Provided</Tag>
                      ) : (
                        <Tag color="red">Not Provided</Tag>
                      )}
                    </div>
                  </Col>
                </Row>
                {selectedLeave.medicalInfo.symptoms && (
                  <div style={{ marginTop: '12px' }}>
                    <Text strong>Symptoms:</Text>
                    <div>{selectedLeave.medicalInfo.symptoms}</div>
                  </div>
                )}
              </Card>
            )}

            {/* Emergency Contact */}
            {selectedLeave.emergencyContact && (
              <Card size="small" title="Emergency Contact" style={{ marginBottom: '16px' }}>
                <Row gutter={16}>
                  <Col span={12}>
                    <Text strong>Name:</Text>
                    <div>{selectedLeave.emergencyContact.name}</div>
                  </Col>
                  <Col span={12}>
                    <Text strong>Phone:</Text>
                    <div>{selectedLeave.emergencyContact.phone}</div>
                  </Col>
                </Row>
                <div style={{ marginTop: '8px' }}>
                  <Text strong>Relationship:</Text>
                  <div>{selectedLeave.emergencyContact.relationship}</div>
                </div>
              </Card>
            )}

            {/* Approval Status */}
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

export default HRLeaveManagementComplete;