import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Typography,
  Tag,
  Space,
  Input,
  Select,
  InputNumber,
  Descriptions,
  Alert,
  Spin,
  message,
  Badge,
  Row,
  Col,
  Statistic,
  Divider,
  Tooltip,
  Tabs,
  DatePicker,
  Progress,
  Timeline
} from 'antd';
import {
  BankOutlined,
  DollarOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  ReloadOutlined,
  EyeOutlined,
  AuditOutlined,
  SendOutlined,
  CalendarOutlined,
  ExportOutlined,
  BarChartOutlined,
  ShoppingCartOutlined,
  BugOutlined,
  LaptopOutlined,
  FileTextOutlined,
  SearchOutlined,
  FilterOutlined
} from '@ant-design/icons';
import { itSupportAPI } from '../../services/api';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useSelector } from 'react-redux';

dayjs.extend(relativeTime);

const { Title, Text } = Typography;
const { TextArea } = Input;
const { TabPane } = Tabs;
const { RangePicker } = DatePicker;

const FinanceITApprovals = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [approvalModalVisible, setApprovalModalVisible] = useState(false);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [activeTab, setActiveTab] = useState('pending');
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    total: 0,
    totalBudgetRequested: 0,
    totalApproved: 0
  });
  const [filters, setFilters] = useState({
    searchText: '',
    priority: 'all',
    requestType: 'all',
    dateRange: null
  });
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    fetchFinanceRequests();
  }, [activeTab, filters]);

  const fetchFinanceRequests = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page: 1,
        limit: 100,
        ...(filters.priority !== 'all' && { priority: filters.priority }),
        ...(filters.requestType !== 'all' && { requestType: filters.requestType })
      };

      const response = await itSupportAPI.getFinanceRequests(params);

      if (response?.success && response?.data) {
        setRequests(Array.isArray(response.data) ? response.data : []);
        calculateStats(response.data);
      } else {
        console.warn('Unexpected response structure:', response);
        setRequests([]);
      }
    } catch (error) {
      console.error('Error fetching finance IT requests:', error);
      setError(error.response?.data?.message || error.message || 'Failed to fetch finance requests');
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data) => {
    const totalRequests = data.length;
    const pendingRequests = data.filter(r => r.status === 'pending_finance').length;
    const approvedRequests = data.filter(r => r.financeApproval?.decision === 'approved').length;
    const rejectedRequests = data.filter(r => r.financeApproval?.decision === 'rejected').length;
    
    const totalBudgetRequested = data.reduce((sum, r) => sum + (r.itReview?.estimatedCost || 0), 0);
    const totalApproved = data
      .filter(r => r.financeApproval?.decision === 'approved')
      .reduce((sum, r) => sum + (r.financeApproval?.approvedAmount || r.itReview?.estimatedCost || 0), 0);

    setStats({
      pending: pendingRequests,
      approved: approvedRequests,
      rejected: rejectedRequests,
      total: totalRequests,
      totalBudgetRequested,
      totalApproved
    });
  };

  const handleApproveRequest = async (values) => {
    if (!selectedRequest) return;

    try {
      setLoading(true);
      
      const approvalData = {
        decision: 'approved',
        approvedAmount: values.approvedAmount,
        comments: values.comments,
        budgetCode: values.budgetCode,
        expectedPaymentDate: values.expectedPaymentDate?.format('YYYY-MM-DD'),
        approvalConditions: values.approvalConditions
      };

      const response = await itSupportAPI.processFinanceDecision(selectedRequest._id, approvalData);

      if (response.success) {
        message.success('Request approved successfully');
        setApprovalModalVisible(false);
        setSelectedRequest(null);
        form.resetFields();
        await fetchFinanceRequests();
      } else {
        throw new Error(response.message || 'Failed to approve request');
      }
    } catch (error) {
      console.error('Error approving request:', error);
      message.error(error.response?.data?.message || error.message || 'Failed to approve request');
    } finally {
      setLoading(false);
    }
  };

  const handleRejectRequest = async (comments) => {
    if (!selectedRequest) return;

    try {
      setLoading(true);
      
      const rejectionData = {
        decision: 'rejected',
        comments: comments || 'Request rejected by finance department',
        rejectionReason: comments
      };

      const response = await itSupportAPI.processFinanceDecision(selectedRequest._id, rejectionData);

      if (response.success) {
        message.success('Request rejected successfully');
        setApprovalModalVisible(false);
        setSelectedRequest(null);
        form.resetFields();
        await fetchFinanceRequests();
      } else {
        throw new Error(response.message || 'Failed to reject request');
      }
    } catch (error) {
      console.error('Error rejecting request:', error);
      message.error(error.response?.data?.message || error.message || 'Failed to reject request');
    } finally {
      setLoading(false);
    }
  };

  const getStatusTag = (request) => {
    const { status, financeApproval } = request;
    
    if (financeApproval?.decision === 'approved') {
      return <Tag color="green" icon={<CheckCircleOutlined />}>Approved</Tag>;
    }
    if (financeApproval?.decision === 'rejected') {
      return <Tag color="red" icon={<CloseCircleOutlined />}>Rejected</Tag>;
    }
    if (status === 'pending_finance') {
      return <Tag color="orange" icon={<ClockCircleOutlined />}>Pending Review</Tag>;
    }
    return <Tag color="blue">{status?.replace('_', ' ') || 'Unknown'}</Tag>;
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

  const columns = [
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
            {record.requestType === 'material_request' ? 
              <ShoppingCartOutlined style={{ color: '#1890ff' }} /> : 
              <BugOutlined style={{ color: '#fa8c16' }} />
            }
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
      title: 'Estimated Cost',
      key: 'estimatedCost',
      render: (_, record) => (
        <div>
          <Text strong style={{ fontSize: '13px', color: '#fa8c16' }}>
            ₦{(record.itReview?.estimatedCost || 0).toLocaleString()}
          </Text>
          {record.financeApproval?.approvedAmount && (
            <>
              <br />
              <Text style={{ fontSize: '11px', color: '#52c41a' }}>
                Approved: ₦{record.financeApproval.approvedAmount.toLocaleString()}
              </Text>
            </>
          )}
        </div>
      ),
      sorter: (a, b) => (a.itReview?.estimatedCost || 0) - (b.itReview?.estimatedCost || 0),
      width: 140
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, record) => getStatusTag(record),
      width: 120
    },
    {
      title: 'Submitted',
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
                setDetailsModalVisible(true);
              }}
              size="small"
            />
          </Tooltip>
          {record.status === 'pending_finance' && (
            <Tooltip title="Review & Approve">
              <Button 
                type="link" 
                icon={<AuditOutlined />}
                onClick={() => {
                  setSelectedRequest(record);
                  form.setFieldsValue({
                    approvedAmount: record.itReview?.estimatedCost || 0,
                    budgetCode: '',
                    expectedPaymentDate: null
                  });
                  setApprovalModalVisible(true);
                }}
                size="small"
              />
            </Tooltip>
          )}
        </Space>
      ),
      width: 100
    }
  ];

  const filteredRequests = requests.filter(request => {
    if (activeTab === 'pending' && request.status !== 'pending_finance') return false;
    if (activeTab === 'approved' && request.financeApproval?.decision !== 'approved') return false;
    if (activeTab === 'rejected' && request.financeApproval?.decision !== 'rejected') return false;
    
    if (filters.searchText) {
      const searchText = filters.searchText.toLowerCase();
      const matchesTitle = request.title?.toLowerCase().includes(searchText);
      const matchesDescription = request.description?.toLowerCase().includes(searchText);
      const matchesEmployee = request.employee?.fullName?.toLowerCase().includes(searchText);
      const matchesTicket = request.ticketNumber?.toLowerCase().includes(searchText);
      if (!matchesTitle && !matchesDescription && !matchesEmployee && !matchesTicket) return false;
    }
    
    if (filters.priority !== 'all' && request.priority !== filters.priority) return false;
    if (filters.requestType !== 'all' && request.requestType !== filters.requestType) return false;
    
    if (filters.dateRange) {
      const requestDate = dayjs(request.createdAt);
      if (requestDate.isBefore(filters.dateRange[0]) || requestDate.isAfter(filters.dateRange[1])) {
        return false;
      }
    }
    
    return true;
  });

  const getStatsCards = () => (
    <Row gutter={16} style={{ marginBottom: '24px' }}>
      <Col xs={24} sm={12} md={6}>
        <Card size="small">
          <Statistic
            title="Pending Approvals"
            value={stats.pending}
            valueStyle={{ color: '#faad14' }}
            prefix={<ClockCircleOutlined />}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} md={6}>
        <Card size="small">
          <Statistic
            title="Approved"
            value={stats.approved}
            valueStyle={{ color: '#52c41a' }}
            prefix={<CheckCircleOutlined />}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} md={6}>
        <Card size="small">
          <Statistic
            title="Budget Requested"
            value={stats.totalBudgetRequested}
            valueStyle={{ color: '#1890ff' }}
            prefix="₦"
            formatter={(value) => value.toLocaleString()}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} md={6}>
        <Card size="small">
          <Statistic
            title="Budget Approved"
            value={stats.totalApproved}
            valueStyle={{ color: '#52c41a' }}
            prefix="₦"
            formatter={(value) => value.toLocaleString()}
          />
        </Card>
      </Col>
    </Row>
  );

  if (loading && requests.length === 0) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Spin size="large" />
        <div style={{ marginTop: '16px' }}>Loading finance requests...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <Title level={2} style={{ margin: 0 }}>
            <BankOutlined /> Finance IT Approvals
          </Title>
          <Space>
            <Button 
              icon={<ReloadOutlined />}
              onClick={fetchFinanceRequests}
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
                <ClockCircleOutlined />
                Pending ({stats.pending})
              </span>
            } 
            key="pending"
          />
          <TabPane 
            tab={
              <span>
                <CheckCircleOutlined />
                Approved ({stats.approved})
              </span>
            } 
            key="approved"
          />
          <TabPane 
            tab={
              <span>
                <CloseCircleOutlined />
                Rejected ({stats.rejected})
              </span>
            } 
            key="rejected"
          />
          <TabPane 
            tab={
              <span>
                <LaptopOutlined />
                All Requests ({stats.total})
              </span>
            } 
            key="all"
          />
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
                style={{ width: 140 }}
                value={filters.requestType}
                onChange={(value) => setFilters({...filters, requestType: value})}
                placeholder="Request Type"
              >
                <Select.Option value="all">All Types</Select.Option>
                <Select.Option value="material_request">Material Request</Select.Option>
                <Select.Option value="technical_issue">Technical Issue</Select.Option>
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
                  searchText: '',
                  priority: 'all',
                  requestType: 'all',
                  dateRange: null
                })}
              >
                Clear
              </Button>
            </Col>
          </Row>
        </Card>

        {filteredRequests.length === 0 ? (
          <Alert
            message="No Finance Requests Found"
            description={
              requests.length === 0 
                ? "No IT finance requests have been submitted yet."
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
              columns={columns} 
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

      {/* Approval Modal */}
      <Modal
        title={`Finance Approval: ${selectedRequest?.ticketNumber}`}
        open={approvalModalVisible}
        onCancel={() => {
          setApprovalModalVisible(false);
          setSelectedRequest(null);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        {selectedRequest && (
          <div>
            <Descriptions bordered size="small" column={1} style={{ marginBottom: '16px' }}>
              <Descriptions.Item label="Request Type">
                {selectedRequest.requestType === 'material_request' ? 'Material Request' : 'Technical Issue'}
              </Descriptions.Item>
              <Descriptions.Item label="Title">{selectedRequest.title}</Descriptions.Item>
              <Descriptions.Item label="Employee">{selectedRequest.employee?.fullName}</Descriptions.Item>
              <Descriptions.Item label="Department">{selectedRequest.employee?.department}</Descriptions.Item>
              <Descriptions.Item label="Priority">{getPriorityTag(selectedRequest.priority)}</Descriptions.Item>
              <Descriptions.Item label="Estimated Cost">
                ₦{(selectedRequest.itReview?.estimatedCost || 0).toLocaleString()}
              </Descriptions.Item>
            </Descriptions>

            <Form
              form={form}
              layout="vertical"
              onFinish={handleApproveRequest}
            >
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="approvedAmount"
                    label="Approved Amount (₦)"
                    rules={[{ required: true, message: 'Please enter approved amount' }]}
                  >
                    <InputNumber
                      style={{ width: '100%' }}
                      formatter={value => `₦ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                      parser={value => value.replace(/₦\s?|(,*)/g, '')}
                      min={0}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="budgetCode"
                    label="Budget Code"
                    rules={[{ required: true, message: 'Please enter budget code' }]}
                  >
                    <Select placeholder="Select budget code">
                      <Select.Option value="DEPT-IT-2024">DEPT-IT-2024 (IT Department)</Select.Option>
                      <Select.Option value="MAINT-2024">MAINT-2024 (Maintenance)</Select.Option>
                      <Select.Option value="EQUIP-2024">EQUIP-2024 (Equipment)</Select.Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                name="expectedPaymentDate"
                label="Expected Payment Date"
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>

              <Form.Item
                name="approvalConditions"
                label="Approval Conditions"
              >
                <TextArea
                  rows={2}
                  placeholder="Any conditions or requirements for this approval..."
                  showCount
                  maxLength={300}
                />
              </Form.Item>

              <Form.Item
                name="comments"
                label="Comments"
                rules={[{ required: true, message: 'Please provide comments' }]}
              >
                <TextArea
                  rows={3}
                  placeholder="Finance approval comments..."
                  showCount
                  maxLength={500}
                />
              </Form.Item>

              <div style={{ textAlign: 'right', marginTop: '16px' }}>
                <Space>
                  <Button
                    danger
                    onClick={() => {
                      Modal.confirm({
                        title: 'Reject Request',
                        content: 'Are you sure you want to reject this request?',
                        onOk: () => handleRejectRequest(form.getFieldValue('comments'))
                      });
                    }}
                  >
                    Reject
                  </Button>
                  <Button type="primary" htmlType="submit" loading={loading}>
                    Approve
                  </Button>
                </Space>
              </div>
            </Form>
          </div>
        )}
      </Modal>

      {/* Details Modal */}
      <Modal
        title={`Request Details: ${selectedRequest?.ticketNumber}`}
        open={detailsModalVisible}
        onCancel={() => {
          setDetailsModalVisible(false);
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
              {getStatusTag(selectedRequest)}
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
            <Descriptions.Item label="Estimated Cost" span={1}>
              ₦{(selectedRequest.itReview?.estimatedCost || 0).toLocaleString()}
            </Descriptions.Item>
            <Descriptions.Item label="Created" span={1}>
              {dayjs(selectedRequest.createdAt).format('YYYY-MM-DD HH:mm')}
            </Descriptions.Item>
            {selectedRequest.financeApproval && (
              <>
                <Descriptions.Item label="Finance Decision" span={1}>
                  <Tag color={selectedRequest.financeApproval.decision === 'approved' ? 'green' : 'red'}>
                    {selectedRequest.financeApproval.decision}
                  </Tag>
                </Descriptions.Item>
                {selectedRequest.financeApproval.approvedAmount && (
                  <Descriptions.Item label="Approved Amount" span={1}>
                    ₦{selectedRequest.financeApproval.approvedAmount.toLocaleString()}
                  </Descriptions.Item>
                )}
                {selectedRequest.financeApproval.comments && (
                  <Descriptions.Item label="Finance Comments" span={2}>
                    {selectedRequest.financeApproval.comments}
                  </Descriptions.Item>
                )}
              </>
            )}
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default FinanceITApprovals;