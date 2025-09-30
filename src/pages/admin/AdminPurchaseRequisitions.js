import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
  Card,
  Table,
  Button,
  Space,
  Typography,
  Tag,
  Row,
  Col,
  Statistic,
  Modal,
  Descriptions,
  Timeline,
  Input,
  Select,
  DatePicker,
  Tabs,
  Progress,
  Alert,
  Drawer,
  message,
  Form,
  InputNumber,
  Spin
} from 'antd';
import {
  ShoppingCartOutlined,
  EyeOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ReloadOutlined,
  FileTextOutlined,
  SendOutlined,
  UserOutlined,
  DollarOutlined,
  CalendarOutlined,
  ExportOutlined,
  TeamOutlined,
  SettingOutlined,
  BarChartOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusOutlined
} from '@ant-design/icons';
import { purchaseRequisitionAPI } from '../../services/purchaseRequisitionAPI';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const { TabPane } = Tabs;
const { RangePicker } = DatePicker;

const AdminPurchaseRequisitions = () => {
  const { user } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(false);
  const [requisitions, setRequisitions] = useState([]);
  const [selectedRequisition, setSelectedRequisition] = useState(null);
  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false);
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 15,
    total: 0
  });
  const [filterOptions, setFilterOptions] = useState({
    department: 'all',
    status: 'all',
    category: 'all',
    dateRange: null
  });

  useEffect(() => {
    fetchRequisitions();
  }, [filterOptions, pagination.current, pagination.pageSize]);

  const fetchRequisitions = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.current,
        limit: pagination.pageSize,
        ...(filterOptions.department !== 'all' && { department: filterOptions.department }),
        ...(filterOptions.status !== 'all' && { status: filterOptions.status }),
      };

      console.log('Fetching admin requisitions with params:', params);
      
      const response = await purchaseRequisitionAPI.getAllRequisitions(params);
      
      if (response.success) {
        setRequisitions(response.data || []);
        setPagination(prev => ({
          ...prev,
          total: response.pagination?.totalRecords || response.data?.length || 0
        }));
        console.log('Admin requisitions fetched successfully:', response.data?.length);
      } else {
        message.error(response.message || 'Failed to fetch requisitions');
      }
    } catch (error) {
      console.error('Error fetching admin requisitions:', error);
      message.error('Failed to fetch requisitions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchRequisitionDetails = async (requisitionId) => {
    try {
      const response = await purchaseRequisitionAPI.getRequisition(requisitionId);
      if (response.success) {
        return response.data;
      } else {
        message.error('Failed to fetch requisition details');
        return null;
      }
    } catch (error) {
      console.error('Error fetching requisition details:', error);
      message.error('Failed to fetch requisition details');
      return null;
    }
  };

  const getStatusTag = (status) => {
    const statusMap = {
      'draft': { color: 'default', text: 'Draft' },
      'pending_supervisor': { color: 'orange', text: 'Pending Supervisor' },
      'pending_supply_chain_review': { color: 'purple', text: 'Supply Chain Review' },
      'supply_chain_approved': { color: 'blue', text: 'Supply Chain Approved' },
      'supply_chain_rejected': { color: 'red', text: 'Supply Chain Rejected' },
      'pending_finance': { color: 'gold', text: 'Finance Review' },
      'approved': { color: 'green', text: 'Approved' },
      'rejected': { color: 'red', text: 'Rejected' },
      'in_procurement': { color: 'cyan', text: 'In Procurement' },
      'procurement_complete': { color: 'lime', text: 'Procurement Complete' },
      'delivered': { color: 'green', text: 'Delivered' },
      'cancelled': { color: 'default', text: 'Cancelled' }
    };
    const statusInfo = statusMap[status] || { color: 'default', text: status };
    return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>;
  };

  const getUrgencyTag = (urgency) => {
    const urgencyMap = { 'Low': 'green', 'Medium': 'orange', 'High': 'red' };
    return <Tag color={urgencyMap[urgency]}>{urgency}</Tag>;
  };

  const handleViewDetails = async (requisition) => {
    setSelectedRequisition(null);
    setDetailDrawerVisible(true);
    
    // Fetch full details
    const fullDetails = await fetchRequisitionDetails(requisition._id || requisition.id);
    if (fullDetails) {
      setSelectedRequisition(fullDetails);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilterOptions(prev => ({
      ...prev,
      [key]: value
    }));
    setPagination(prev => ({ ...prev, current: 1 })); // Reset to first page when filtering
  };

  const handleTableChange = (paginationInfo) => {
    setPagination(prev => ({
      ...prev,
      current: paginationInfo.current,
      pageSize: paginationInfo.pageSize
    }));
  };

  const calculateProgress = (requisition) => {
    const statusOrder = [
      'draft',
      'pending_supervisor',
      'pending_supply_chain_review', 
      'supply_chain_approved',
      'pending_finance',
      'approved',
      'in_procurement',
      'procurement_complete',
      'delivered'
    ];
    
    const currentIndex = statusOrder.indexOf(requisition.status);
    const totalSteps = statusOrder.length - 1;
    return currentIndex >= 0 ? Math.round((currentIndex / totalSteps) * 100) : 0;
  };

  const calculateProcessingTime = (requisition) => {
    if (!requisition.createdAt) return null;
    
    const submittedDate = new Date(requisition.createdAt);
    const currentDate = new Date();
    const timeDiff = currentDate - submittedDate;
    const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
    
    return daysDiff;
  };

  const formatApprovalHistory = (approvalChain) => {
    if (!approvalChain || !Array.isArray(approvalChain)) return [];
    
    return approvalChain.map((step, index) => ({
      level: step.level || index + 1,
      approver: step.approver?.name || 'Unknown',
      status: step.status || 'pending',
      date: step.actionDate || step.assignedDate,
      comments: step.comments || ''
    }));
  };

  const columns = [
    {
      title: 'Requisition Number',
      dataIndex: 'requisitionNumber',
      key: 'requisitionNumber',
      render: (number) => <Text code>{number}</Text>,
      width: 150,
      fixed: 'left'
    },
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
      width: 200
    },
    {
      title: 'Requester',
      key: 'requester',
      render: (_, record) => (
        <div>
          <Text strong>{record.employee?.fullName || 'Unknown'}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: '12px' }}>{record.department}</Text>
        </div>
      ),
      width: 150
    },
    {
      title: 'Category',
      dataIndex: 'itemCategory',
      key: 'itemCategory',
      render: (category) => <Tag color="blue">{category}</Tag>,
      width: 130
    },
    {
      title: 'Items',
      dataIndex: 'items',
      key: 'items',
      render: (items) => items?.length || 0,
      align: 'center',
      width: 70
    },
    {
      title: 'Budget (XAF)',
      key: 'budget',
      render: (_, record) => (
        <div>
          <Text>{record.budgetXAF ? record.budgetXAF.toLocaleString() : 'N/A'}</Text>
          {record.supplyChainReview?.estimatedCost && (
            <>
              <br />
              <Text type="secondary" style={{ fontSize: '12px' }}>
                Est: {record.supplyChainReview.estimatedCost.toLocaleString()}
              </Text>
            </>
          )}
          {record.procurementDetails?.finalCost && (
            <>
              <br />
              <Text type="success" style={{ fontSize: '12px' }}>
                Final: {record.procurementDetails.finalCost.toLocaleString()}
              </Text>
            </>
          )}
        </div>
      ),
      width: 130,
      align: 'right'
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => getStatusTag(status),
      width: 150
    },
    {
      title: 'Progress',
      key: 'progress',
      render: (_, record) => {
        const progress = calculateProgress(record);
        return (
          <div>
            <Progress percent={progress} size="small" style={{ width: 80 }} />
            <Text style={{ fontSize: '11px' }}>{progress}%</Text>
          </div>
        );
      },
      width: 100
    },
    {
      title: 'Processing Time',
      key: 'processingTime',
      render: (_, record) => {
        const days = calculateProcessingTime(record);
        return (
          <div>
            {days && <Text>{days} days</Text>}
            {record.status === 'delivered' && record.updatedAt && (
              <>
                <br />
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  Completed: {new Date(record.updatedAt).toLocaleDateString('en-GB')}
                </Text>
              </>
            )}
          </div>
        );
      },
      width: 120
    },
    {
      title: 'Urgency',
      dataIndex: 'urgency',
      key: 'urgency',
      render: (urgency) => getUrgencyTag(urgency),
      width: 100
    },
    {
      title: 'Officer Assigned',
      key: 'assignedOfficer',
      render: (_, record) => {
        const officer = record.supplyChainReview?.assignedOfficer || record.procurementDetails?.assignedOfficer;
        return officer ? (
          <div>
            <TeamOutlined /> {officer}
          </div>
        ) : <Text type="secondary">Not assigned</Text>;
      },
      width: 150
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button size="small" icon={<EyeOutlined />} onClick={() => handleViewDetails(record)}>
            View
          </Button>
        </Space>
      ),
      width: 100,
      fixed: 'right'
    }
  ];

  const getStats = () => {
    return {
      total: requisitions.length,
      pending: requisitions.filter(r => ['pending_supervisor', 'pending_supply_chain_review', 'pending_finance'].includes(r.status)).length,
      inProgress: requisitions.filter(r => ['in_procurement', 'procurement_complete'].includes(r.status)).length,
      completed: requisitions.filter(r => r.status === 'delivered').length,
      totalBudget: requisitions.reduce((sum, req) => sum + (req.budgetXAF || 0), 0),
      avgProcessingTime: requisitions.length > 0 ? 
        requisitions.reduce((sum, req) => sum + (calculateProcessingTime(req) || 0), 0) / requisitions.length : 0
    };
  };

  const stats = getStats();

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <Title level={2} style={{ margin: 0 }}>
            <ShoppingCartOutlined /> Purchase Requisitions Management
          </Title>
          <Space>
            <Button icon={<BarChartOutlined />} onClick={() => message.info('Analytics feature coming soon')}>
              Analytics
            </Button>
            <Button icon={<SettingOutlined />} onClick={() => setSettingsModalVisible(true)}>
              Settings
            </Button>
            <Button icon={<ExportOutlined />} onClick={() => message.info('Export feature coming soon')}>
              Export Data
            </Button>
            <Button type="primary" icon={<ReloadOutlined />} onClick={fetchRequisitions} loading={loading}>
              Refresh
            </Button>
          </Space>
        </div>

        {/* Statistics Dashboard */}
        <Row gutter={16} style={{ marginBottom: '24px' }}>
          <Col span={4}>
            <Statistic
              title="Total Requisitions"
              value={stats.total}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Col>
          <Col span={4}>
            <Statistic
              title="Pending/In Review"
              value={stats.pending}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Col>
          <Col span={4}>
            <Statistic
              title="In Procurement"
              value={stats.inProgress}
              prefix={<ShoppingCartOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Col>
          <Col span={4}>
            <Statistic
              title="Completed"
              value={stats.completed}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Col>
          <Col span={4}>
            <Statistic
              title="Total Budget"
              value={stats.totalBudget}
              formatter={value => `${value.toLocaleString()}`}
              suffix="XAF"
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Col>
          <Col span={4}>
            <Statistic
              title="Avg Processing Time"
              value={stats.avgProcessingTime}
              precision={1}
              suffix="days"
              prefix={<CalendarOutlined />}
              valueStyle={{ color: '#13c2c2' }}
            />
          </Col>
        </Row>

        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab="Overview & Management" key="overview">
            {/* Filters */}
            <Card size="small" style={{ marginBottom: '16px' }}>
              <Row gutter={16} align="middle">
                <Col>
                  <Text strong>Filters:</Text>
                </Col>
                <Col>
                  <Select
                    value={filterOptions.department}
                    onChange={(value) => handleFilterChange('department', value)}
                    style={{ width: 150 }}
                    placeholder="Department"
                  >
                    <Option value="all">All Departments</Option>
                    <Option value="HR & Admin">HR & Admin</Option>
                    <Option value="IT">IT</Option>
                    <Option value="Finance">Finance</Option>
                    <Option value="Security">Security</Option>
                    <Option value="Business Development & Supply Chain">Supply Chain</Option>
                  </Select>
                </Col>
                <Col>
                  <Select
                    value={filterOptions.status}
                    onChange={(value) => handleFilterChange('status', value)}
                    style={{ width: 150 }}
                    placeholder="Status"
                  >
                    <Option value="all">All Status</Option>
                    <Option value="pending_supervisor">Pending Supervisor</Option>
                    <Option value="pending_supply_chain_review">Supply Chain Review</Option>
                    <Option value="pending_finance">Finance Review</Option>
                    <Option value="approved">Approved</Option>
                    <Option value="in_procurement">In Procurement</Option>
                    <Option value="delivered">Completed</Option>
                    <Option value="rejected">Rejected</Option>
                  </Select>
                </Col>
                <Col>
                  <Select
                    value={filterOptions.category}
                    onChange={(value) => handleFilterChange('category', value)}
                    style={{ width: 150 }}
                    placeholder="Category"
                  >
                    <Option value="all">All Categories</Option>
                    <Option value="IT Equipment">IT Equipment</Option>
                    <Option value="IT Accessories">IT Accessories</Option>
                    <Option value="Office Supplies">Office Supplies</Option>
                    <Option value="Consumables">Consumables</Option>
                    <Option value="Furniture">Furniture</Option>
                    <Option value="Equipment">Equipment</Option>
                  </Select>
                </Col>
                <Col>
                  <RangePicker
                    value={filterOptions.dateRange}
                    onChange={(dates) => handleFilterChange('dateRange', dates)}
                    style={{ width: 250 }}
                    placeholder={['Start Date', 'End Date']}
                  />
                </Col>
              </Row>
            </Card>

            {/* Main Table */}
            <Table
              columns={columns}
              dataSource={requisitions}
              rowKey={(record) => record._id || record.id}
              loading={loading}
              pagination={{
                current: pagination.current,
                pageSize: pagination.pageSize,
                total: pagination.total,
                showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} requisitions`,
                showSizeChanger: true,
                pageSizeOptions: ['10', '15', '25', '50'],
                onChange: (page, pageSize) => handleTableChange({ current: page, pageSize }),
                onShowSizeChange: (current, size) => handleTableChange({ current: 1, pageSize: size })
              }}
              scroll={{ x: 1500 }}
              size="small"
            />
          </TabPane>

          <TabPane tab="System Analytics" key="analytics">
            <Row gutter={16}>
              <Col span={24}>
                <Alert
                  message="Advanced Analytics"
                  description="Detailed procurement analytics, trends, and performance metrics will be available in future updates."
                  type="info"
                  showIcon
                  action={
                    <Button size="small" type="primary" onClick={() => message.info('Analytics dashboard coming soon!')}>
                      Coming Soon
                    </Button>
                  }
                />
              </Col>
            </Row>
          </TabPane>

          <TabPane tab="System Configuration" key="config">
            <Row gutter={16}>
              <Col span={12}>
                <Card title="Approval Workflow" size="small">
                  <div style={{ marginBottom: '12px' }}>
                    <Text strong>Current Workflow:</Text>
                  </div>
                  <Timeline size="small">
                    <Timeline.Item color="blue">Department Head Approval</Timeline.Item>
                    <Timeline.Item color="purple">Supply Chain Review</Timeline.Item>
                    <Timeline.Item color="gold">Finance Approval</Timeline.Item>
                    <Timeline.Item color="green">Procurement Execution</Timeline.Item>
                    <Timeline.Item color="green">Delivery & Completion</Timeline.Item>
                  </Timeline>
                  <Button size="small" icon={<EditOutlined />} style={{ marginTop: '12px' }} onClick={() => message.info('Workflow configuration coming soon')}>
                    Configure Workflow
                  </Button>
                </Card>
              </Col>
              <Col span={12}>
                <Card title="Budget Thresholds" size="small">
                  <div style={{ marginBottom: '12px' }}>
                    <Text strong>Approval Thresholds (XAF):</Text>
                  </div>
                  <ul>
                    <li>Up to 500,000: Department Head only</li>
                    <li>500,001 - 2,000,000: + Supply Chain Review</li>
                    <li>Above 2,000,000: + Finance Approval</li>
                  </ul>
                  <Button size="small" icon={<EditOutlined />} style={{ marginTop: '12px' }} onClick={() => message.info('Threshold configuration coming soon')}>
                    Update Thresholds
                  </Button>
                </Card>
              </Col>
            </Row>
          </TabPane>
        </Tabs>
      </Card>

      {/* Detail Drawer */}
      <Drawer
        title={
          <Space>
            <FileTextOutlined />
            Purchase Requisition Details
          </Space>
        }
        placement="right"
        width={1000}
        open={detailDrawerVisible}
        onClose={() => {
          setDetailDrawerVisible(false);
          setSelectedRequisition(null);
        }}
      >
        {!selectedRequisition ? (
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <Spin size="large" />
            <p style={{ marginTop: '16px' }}>Loading requisition details...</p>
          </div>
        ) : (
          <div>
            {/* Comprehensive Requisition Information */}
            <Card size="small" title="Requisition Overview" style={{ marginBottom: '16px' }}>
              <Descriptions column={3} size="small">
                <Descriptions.Item label="Requisition Number">
                  <Text code>{selectedRequisition.requisitionNumber}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Status">
                  {getStatusTag(selectedRequisition.status)}
                </Descriptions.Item>
                <Descriptions.Item label="Urgency">
                  {getUrgencyTag(selectedRequisition.urgency)}
                </Descriptions.Item>
                <Descriptions.Item label="Title" span={3}>
                  {selectedRequisition.title}
                </Descriptions.Item>
                <Descriptions.Item label="Requester">
                  <div>
                    <UserOutlined /> {selectedRequisition.employee?.fullName}
                    <br />
                    <Text type="secondary">{selectedRequisition.employee?.email}</Text>
                  </div>
                </Descriptions.Item>
                <Descriptions.Item label="Department">
                  {selectedRequisition.department}
                </Descriptions.Item>
                <Descriptions.Item label="Category">
                  <Tag color="blue">{selectedRequisition.itemCategory}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Budget (XAF)">
                  <DollarOutlined /> {selectedRequisition.budgetXAF?.toLocaleString() || 'N/A'}
                </Descriptions.Item>
                <Descriptions.Item label="Estimated Cost">
                  {selectedRequisition.supplyChainReview?.estimatedCost ? 
                    `${selectedRequisition.supplyChainReview.estimatedCost.toLocaleString()} XAF` : 
                    'Not estimated'
                  }
                </Descriptions.Item>
                <Descriptions.Item label="Final Cost">
                  {selectedRequisition.procurementDetails?.finalCost ? 
                    `${selectedRequisition.procurementDetails.finalCost.toLocaleString()} XAF` : 
                    'Not completed'
                  }
                </Descriptions.Item>
                <Descriptions.Item label="Expected Date">
                  <CalendarOutlined /> {new Date(selectedRequisition.expectedDate).toLocaleDateString('en-GB')}
                </Descriptions.Item>
                <Descriptions.Item label="Processing Time">
                  {calculateProcessingTime(selectedRequisition)} days
                </Descriptions.Item>
                <Descriptions.Item label="Assigned Officer">
                  {selectedRequisition.supplyChainReview?.assignedOfficer ? 
                    <><TeamOutlined /> {selectedRequisition.supplyChainReview.assignedOfficer}</> : 
                    'Not assigned'
                  }
                </Descriptions.Item>
                <Descriptions.Item label="Delivery Location" span={3}>
                  {selectedRequisition.deliveryLocation}
                </Descriptions.Item>
              </Descriptions>
            </Card>

            {/* Business Justification */}
            <Card size="small" title="Business Justification" style={{ marginBottom: '16px' }}>
              <div style={{ marginBottom: '12px' }}>
                <Text strong>Purchase Justification:</Text>
                <br />
                <Text>{selectedRequisition.justificationOfPurchase}</Text>
              </div>
              {selectedRequisition.justificationOfPreferredSupplier && (
                <div>
                  <Text strong>Preferred Supplier Justification:</Text>
                  <br />
                  <Text>{selectedRequisition.justificationOfPreferredSupplier}</Text>
                </div>
              )}
            </Card>

            {/* Items List */}
            <Card size="small" title={`Requested Items (${selectedRequisition.items?.length || 0})`} style={{ marginBottom: '16px' }}>
              <Table
                columns={[
                  { title: 'Description', dataIndex: 'description', key: 'description' },
                  { title: 'Quantity', dataIndex: 'quantity', key: 'quantity', width: 80, align: 'center' },
                  { title: 'Unit', dataIndex: 'measuringUnit', key: 'measuringUnit', width: 80, align: 'center' }
                ]}
                dataSource={selectedRequisition.items || []}
                pagination={false}
                size="small"
                rowKey={(record, index) => index}
              />
            </Card>

            {/* Approval Timeline */}
            <Card size="small" title="Approval Timeline & Progress" style={{ marginBottom: '16px' }}>
              <Timeline>
                {formatApprovalHistory(selectedRequisition.approvalChain).map((step, index) => {
                  let color = 'gray';
                  let icon = <ClockCircleOutlined />;

                  if (step.status === 'approved') {
                    color = 'green';
                    icon = <CheckCircleOutlined />;
                  } else if (step.status === 'rejected') {
                    color = 'red';
                    icon = <CloseCircleOutlined />;
                  } else if (step.status === 'pending') {
                    color = 'blue';
                    icon = <ClockCircleOutlined />;
                  }

                  return (
                    <Timeline.Item key={index} color={color} dot={icon}>
                      <div>
                        <Text strong>Level {step.level}: {step.approver}</Text>
                        <br />
                        {step.status === 'pending' && (
                          <Tag color="orange">Currently Reviewing</Tag>
                        )}
                        {step.status === 'approved' && (
                          <>
                            <Tag color="green">Approved</Tag>
                            {step.date && <Text type="secondary"> on {new Date(step.date).toLocaleDateString('en-GB')}</Text>}
                          </>
                        )}
                        {step.status === 'rejected' && (
                          <>
                            <Tag color="red">Rejected</Tag>
                            {step.date && <Text type="secondary"> on {new Date(step.date).toLocaleDateString('en-GB')}</Text>}
                          </>
                        )}
                        {step.comments && (
                          <div style={{ marginTop: 4 }}>
                            <Text italic>"{step.comments}"</Text>
                          </div>
                        )}
                      </div>
                    </Timeline.Item>
                  );
                })}
              </Timeline>
            </Card>

            {/* Administrative Actions */}
            <Card size="small" title="Administrative Actions">
              <Space wrap>
                <Button icon={<EditOutlined />} onClick={() => message.info('Edit feature coming soon')}>
                  Edit Details
                </Button>
                <Button icon={<TeamOutlined />} onClick={() => message.info('Reassignment feature coming soon')}>
                  Reassign Officer
                </Button>
                <Button icon={<CalendarOutlined />} onClick={() => message.info('Timeline update feature coming soon')}>
                  Update Timeline
                </Button>
                <Button icon={<DollarOutlined />} onClick={() => message.info('Budget adjustment feature coming soon')}>
                  Adjust Budget
                </Button>
                <Button danger icon={<DeleteOutlined />} onClick={() => message.warning('Cancellation feature coming soon')}>
                  Cancel Requisition
                </Button>
              </Space>
            </Card>
          </div>
        )}
      </Drawer>

      {/* Settings Modal */}
      <Modal
        title="System Settings"
        open={settingsModalVisible}
        onCancel={() => setSettingsModalVisible(false)}
        footer={null}
        width={600}
      >
        <Tabs>
          <TabPane tab="Approval Settings" key="approval">
            <Form layout="vertical">
              <Form.Item label="Auto-approval Threshold (XAF)">
                <InputNumber
                  style={{ width: '100%' }}
                  formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value.replace(/\$\s?|(,*)/g, '')}
                  placeholder="e.g., 500000"
                />
              </Form.Item>
              <Form.Item label="Maximum Processing Days">
                <InputNumber 
                  min={1} 
                  max={30} 
                  placeholder="e.g., 14"
                />
              </Form.Item>
              <Form.Item label="Require Finance Approval Above (XAF)">
                <InputNumber
                  style={{ width: '100%' }}
                  formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value.replace(/\$\s?|(,*)/g, '')}
                  placeholder="e.g., 2000000"
                />
              </Form.Item>
            </Form>
          </TabPane>
          <TabPane tab="Notification Settings" key="notifications">
            <Form layout="vertical">
              <Form.Item label="Email Notifications">
                <Select defaultValue="all">
                  <Option value="all">All Events</Option>
                  <Option value="critical">Critical Only</Option>
                  <Option value="none">None</Option>
                </Select>
              </Form.Item>
              <Form.Item label="Notification Recipients">
                <Select mode="multiple" placeholder="Select admin users">
                  <Option value="admin1">Admin User 1</Option>
                  <Option value="admin2">Admin User 2</Option>
                </Select>
              </Form.Item>
              <Form.Item label="SMS Notifications">
                <Select defaultValue="critical">
                  <Option value="all">All Events</Option>
                  <Option value="critical">Critical Only</Option>
                  <Option value="none">None</Option>
                </Select>
              </Form.Item>
            </Form>
          </TabPane>
        </Tabs>
      </Modal>
    </div>
  );
};

export default AdminPurchaseRequisitions;