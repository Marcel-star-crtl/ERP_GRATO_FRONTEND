import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
  Card,
  Form,
  Button,
  message,
  Typography,
  Space,
  Alert,
  Row,
  Col,
  Tag,
  Table,
  Modal,
  Descriptions,
  Statistic,
  Tabs,
  Input,
  Select,
  DatePicker,
  Badge,
  Empty,
  Tooltip,
  Divider
} from 'antd';
import {
  MedicineBoxOutlined,
  UserOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  EyeOutlined,
  ReloadOutlined,
  TeamOutlined,
  CalendarOutlined,
  WarningOutlined,
  FileTextOutlined,
  RestOutlined,
  BookOutlined,
  HeartOutlined,
  EditOutlined,
  SendOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import leaveApi from '../../services/leaveApi';

dayjs.extend(relativeTime);

const { Title, Text } = Typography;
const { TextArea } = Input;
const { TabPane } = Tabs;
const { RangePicker } = DatePicker;

const SupervisorLeaveManagementComplete = () => {
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [approvalModalVisible, setApprovalModalVisible] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [activeTab, setActiveTab] = useState('pending');
  const [approvalForm] = Form.useForm();
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0, total: 0 });
  const [filters, setFilters] = useState({
    status: 'all',
    category: 'all',
    urgency: 'all',
    dateRange: null
  });
  const [error, setError] = useState(null);

  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    fetchData();
  }, [activeTab, filters]);

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchLeaveRequests(),
        fetchStats()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load supervisor data');
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
          params.status = 'pending_supervisor';
          break;
        case 'approved':
          // Will filter on frontend
          break;
        case 'rejected':
          params.status = 'rejected';
          break;
        case 'medical':
          params.category = 'medical';
          break;
        case 'urgent':
          params.urgency = 'high,critical';
          break;
        default:
          break;
      }

      // Apply additional filters
      if (filters.status !== 'all') params.status = filters.status;
      if (filters.category !== 'all') params.category = filters.category;
      if (filters.urgency !== 'all') params.urgency = filters.urgency;
      if (filters.dateRange) {
        params.startDate = filters.dateRange[0].format('YYYY-MM-DD');
        params.endDate = filters.dateRange[1].format('YYYY-MM-DD');
      }

      console.log('Fetching supervisor leaves with params:', params);
      const response = await leaveApi.getSupervisorLeaves(params);
      
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

  const fetchStats = async () => {
    try {
      const response = await leaveApi.getDashboardStats();
      if (response.success && response.data) {
        setStats({
          pending: response.data.pendingApproval || 0,
          teamOnLeave: response.data.teamOnLeave || 0,
          total: leaveRequests.length
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleApprovalDecision = async (values) => {
    try {
      setLoading(true);
      
      const decisionData = {
        decision: values.decision,
        comments: values.comments || '',
        conditions: values.conditions || ''
      };

      console.log('Processing supervisor decision:', decisionData);
      const response = await leaveApi.processSupervisorDecision(selectedLeave._id, decisionData);

      if (response.success) {
        const actionText = values.decision === 'approve' ? 'approved' : 'rejected';
        message.success(`Leave request ${actionText} successfully`);
        
        setApprovalModalVisible(false);
        approvalForm.resetFields();
        setSelectedLeave(null);
        
        // Refresh data
        await fetchData();
      } else {
        throw new Error(response.message || 'Failed to process decision');
      }
      
    } catch (error) {
      console.error('Approval decision error:', error);
      message.error(error.response?.data?.message || error.message || 'Failed to process approval decision');
    } finally {
      setLoading(false);
    }
  };

  const openApprovalModal = (record) => {
    setSelectedLeave(record);
    approvalForm.setFieldsValue({
      employeeName: record.employee?.fullName,
      leaveType: leaveApi.getLeaveTypeDisplay(record.leaveType),
      duration: `${record.totalDays} days`,
      period: `${dayjs(record.startDate).format('MMM DD')} - ${dayjs(record.endDate).format('MMM DD, YYYY')}`,
      reason: record.reason
    });
    setApprovalModalVisible(true);
  };

  const openDetailsModal = (record) => {
    setSelectedLeave(record);
    setDetailsModalVisible(true);
  };

  const getStatusTag = (status) => {
    const statusMap = {
      'pending_supervisor': { color: 'orange', text: 'Pending Your Approval', icon: <ClockCircleOutlined /> },
      'approved': { color: 'green', text: 'Approved', icon: <CheckCircleOutlined /> },
      'rejected': { color: 'red', text: 'Rejected', icon: <CloseCircleOutlined /> },
      'pending_hr': { color: 'blue', text: 'Pending HR', icon: <ClockCircleOutlined /> },
      'completed': { color: 'cyan', text: 'Completed', icon: <CheckCircleOutlined /> },
      'in_progress': { color: 'blue', text: 'In Progress', icon: <CalendarOutlined /> }
    };

    const config = statusMap[status] || { color: 'default', text: status };
    return <Tag color={config.color} icon={config.icon}>{config.text}</Tag>;
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
      'paternity': { color: 'lime', text: 'Paternity' }
    };

    const categoryInfo = categoryMap[category] || { 
      color: 'default', 
      text: category?.replace('_', ' ') || 'Other',
      icon: <FileTextOutlined />
    };

    return <Tag color={categoryInfo.color} icon={categoryInfo.icon}>{categoryInfo.text}</Tag>;
  };

  const columns = [
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
      width: 220
    },
    {
      title: 'Reason',
      key: 'reason',
      render: (_, record) => (
        <Tooltip title={record.reason}>
          <Text style={{ fontSize: '12px' }}>
            {record.reason && record.reason.length > 50 ? 
              `${record.reason.substring(0, 50)}...` : 
              record.reason || 'No reason provided'
            }
          </Text>
        </Tooltip>
      ),
      width: 200
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
            View
          </Button>
          {record.status === 'pending_supervisor' && (
            <Button 
              type="primary" 
              size="small"
              icon={<EditOutlined />}
              onClick={() => openApprovalModal(record)}
            >
              Review
            </Button>
          )}
        </Space>
      ),
      width: 120
    }
  ];

  const getTabCounts = () => {
    const counts = {
      all: leaveRequests.length,
      pending: leaveRequests.filter(r => r.status === 'pending_supervisor').length,
      approved: leaveRequests.filter(r => ['approved', 'completed'].includes(r.status)).length,
      rejected: leaveRequests.filter(r => r.status === 'rejected').length,
      medical: leaveRequests.filter(r => r.leaveCategory === 'medical').length,
      urgent: leaveRequests.filter(r => ['high', 'critical'].includes(r.urgency)).length
    };
    return counts;
  };

  const tabCounts = getTabCounts();

  const statsCards = [
    {
      title: "Pending Approval",
      value: tabCounts.pending,
      icon: <ClockCircleOutlined />,
      color: "#faad14"
    },
    {
      title: "Team on Leave",
      value: stats.teamOnLeave,
      icon: <CalendarOutlined />,
      color: "#1890ff"
    },
    {
      title: "Approved Requests",
      value: tabCounts.approved,
      icon: <CheckCircleOutlined />,
      color: "#52c41a"
    },
    {
      title: "Urgent Requests",
      value: tabCounts.urgent,
      icon: <WarningOutlined />,
      color: "#ff4d4f"
    }
  ];

  if (loading && leaveRequests.length === 0) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <div>Loading supervisor leave management...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <Title level={2} style={{ margin: 0 }}>
            <TeamOutlined /> Team Leave Approvals
          </Title>
          <Space>
            <Button 
              icon={<ReloadOutlined />}
              onClick={fetchData}
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
                <Select.Option value="pending_supervisor">Pending</Select.Option>
                <Select.Option value="approved">Approved</Select.Option>
                <Select.Option value="rejected">Rejected</Select.Option>
                <Select.Option value="pending_hr">Pending HR</Select.Option>
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
                  dateRange: null
                })}
              >
                Clear
              </Button>
            </Col>
          </Row>
        </Card>

        {/* Tabs */}
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
            tab={<Badge count={tabCounts.rejected} offset={[10, 0]}><CloseCircleOutlined /> Rejected</Badge>} 
            key="rejected" 
          />
          <TabPane 
            tab={<Badge count={tabCounts.medical} offset={[10, 0]}><MedicineBoxOutlined /> Medical</Badge>} 
            key="medical" 
          />
          <TabPane 
            tab={<Badge count={tabCounts.urgent} offset={[10, 0]}><WarningOutlined /> Urgent</Badge>} 
            key="urgent" 
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
                  "No leave requests are currently pending your approval." :
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
              columns={columns} 
              dataSource={leaveRequests} 
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
                if (record.status === 'pending_supervisor') {
                  return 'pending-leave-row';
                }
                return '';
              }}
            />
          </>
        )}
      </Card>

      {/* Approval Modal */}
      <Modal
        title={
          <div>
            <EditOutlined style={{ marginRight: '8px' }} />
            Review Leave Request - {selectedLeave?.employee?.fullName}
          </div>
        }
        visible={approvalModalVisible}
        onCancel={() => {
          setApprovalModalVisible(false);
          setSelectedLeave(null);
          approvalForm.resetFields();
        }}
        footer={null}
        width={700}
      >
        <Form
          form={approvalForm}
          layout="vertical"
          onFinish={handleApprovalDecision}
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
                {selectedLeave && getCategoryTag(selectedLeave.leaveCategory)}
                <span style={{ marginLeft: '8px' }}>
                  {selectedLeave && leaveApi.getLeaveTypeDisplay(selectedLeave.leaveType)}
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

          {/* Leave Reason */}
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

          {/* Medical Info (if applicable) */}
          {selectedLeave?.leaveCategory === 'medical' && selectedLeave?.medicalInfo && (
            <Card size="small" title="Medical Information" style={{ marginBottom: '20px' }}>
              <Row gutter={16}>
                <Col span={12}>
                  <Text strong>Doctor:</Text>
                  <div>{selectedLeave.medicalInfo.doctorDetails?.name || 'N/A'}</div>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    {selectedLeave.medicalInfo.doctorDetails?.hospital || 'N/A'}
                  </div>
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

          {/* Work Coverage */}
          {selectedLeave?.workCoverage && (
            <div style={{ marginBottom: '20px' }}>
              <Text strong>Work Coverage Plan:</Text>
              <div style={{ 
                padding: '8px 12px', 
                backgroundColor: '#f5f5f5', 
                borderRadius: '4px', 
                marginTop: '4px' 
              }}>
                {selectedLeave.workCoverage}
              </div>
            </div>
          )}

          {/* Decision */}
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="decision"
                label="Your Decision"
                rules={[{ required: true, message: 'Please select a decision' }]}
              >
                <Select placeholder="Select your decision" size="large">
                  <Select.Option value="approve">
                    <CheckCircleOutlined style={{ color: 'green' }} /> Approve
                  </Select.Option>
                  <Select.Option value="reject">
                    <CloseCircleOutlined style={{ color: 'red' }} /> Reject
                  </Select.Option>
                </Select>
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
              placeholder="Provide your feedback and comments..."
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

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <Button onClick={() => setApprovalModalVisible(false)}>
              Cancel
            </Button>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading}
              icon={<SendOutlined />}
            >
              Submit Decision
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Details Modal */}
      <Modal
        title={
          <div>
            <EyeOutlined style={{ marginRight: '8px' }} />
            Leave Request Details
          </div>
        }
        visible={detailsModalVisible}
        onCancel={() => {
          setDetailsModalVisible(false);
          setSelectedLeave(null);
        }}
        footer={
          <Button onClick={() => setDetailsModalVisible(false)}>
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
                  {selectedLeave.submittedAt ? dayjs(selectedLeave.submittedAt).format('MMMM DD, YYYY') : 'N/A'}
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

            {/* Work Coverage */}
            {selectedLeave.workCoverage && (
              <Card size="small" title="Work Coverage Plan">
                <div>{selectedLeave.workCoverage}</div>
              </Card>
            )}
          </div>
        )}
      </Modal>

      <style jsx>{`
        .critical-leave-row {
          background-color: #fff1f0 !important;
        }
        .pending-leave-row {
          background-color: #fff7e6 !important;
        }
      `}</style>
    </div>
  );
};

export default SupervisorLeaveManagementComplete;