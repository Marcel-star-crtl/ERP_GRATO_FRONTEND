import React, { useState, useEffect } from 'react';
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
  Form,
  Input,
  Select,
  DatePicker,
  Progress,
  Tabs,
  Alert,
  Divider,
  Badge,
  message,
  Tooltip,
  Timeline,
  Steps,
  List,
  Avatar,
  Rate,
  Upload
} from 'antd';
import {
  TruckOutlined,
//   PackageOutlined,
  BoxPlotOutlined,
  InboxOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  WarningOutlined,
  CalendarOutlined,
  PhoneOutlined,
  MailOutlined,
  EnvironmentOutlined,
  EyeOutlined,
  EditOutlined,
  FileTextOutlined,
  StarOutlined,
  CameraOutlined,
  UploadOutlined,
  ReloadOutlined,
  MessageOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const { Step } = Steps;

// Mock delivery data
const mockDeliveries = [
  {
    id: 'DEL-2024-178',
    poId: 'PO-2024-178',
    requisitionId: 'REQ20241215001',
    supplierId: 'SUP001',
    supplierName: 'TechSource Cameroon',
    supplierPhone: '+237 678 901 234',
    trackingNumber: 'TSC202412170001',
    status: 'in_transit',
    dispatchDate: '2024-12-17T08:00:00Z',
    estimatedDeliveryDate: '2024-12-21T17:00:00Z',
    actualDeliveryDate: null,
    deliveryAddress: 'Main Office - IT Department, Douala',
    totalAmount: 2350000,
    itemCount: 4,
    priority: 'high',
    deliveryMethod: 'courier_service',
    courierCompany: 'Express Delivery Cameroon',
    courierContact: '+237 695 123 456',
    progress: 60,
    currentLocation: 'Douala Distribution Center',
    trackingUpdates: [
      {
        status: 'dispatched',
        description: 'Package dispatched from supplier warehouse',
        location: 'TechSource Warehouse, Douala',
        timestamp: '2024-12-17T08:00:00Z'
      },
      {
        status: 'in_transit',
        description: 'Package picked up by courier',
        location: 'Express Delivery Pickup Point',
        timestamp: '2024-12-17T10:30:00Z'
      },
      {
        status: 'at_facility',
        description: 'Package arrived at distribution center',
        location: 'Douala Distribution Center',
        timestamp: '2024-12-17T14:20:00Z'
      }
    ],
    expectedItems: [
      { description: 'Wireless Mouse', quantity: 10, delivered: false },
      { description: 'USB Keyboards', quantity: 15, delivered: false },
      { description: 'VGA to HDMI Converter', quantity: 5, delivered: false },
      { description: 'External Hard Drive 500GB', quantity: 3, delivered: false }
    ],
    issues: []
  },
  {
    id: 'DEL-2024-176',
    poId: 'PO-2024-176',
    requisitionId: 'REQ20241213003',
    supplierId: 'SUP005',
    supplierName: 'MedSupply Pro',
    supplierPhone: '+237 699 876 543',
    trackingNumber: 'MSP202412160001',
    status: 'out_for_delivery',
    dispatchDate: '2024-12-16T10:30:00Z',
    estimatedDeliveryDate: '2024-12-17T16:00:00Z',
    actualDeliveryDate: null,
    deliveryAddress: 'Main Office - Medical Department, Douala',
    totalAmount: 2950000,
    itemCount: 4,
    priority: 'urgent',
    deliveryMethod: 'direct_delivery',
    courierCompany: 'MedSupply Direct',
    courierContact: '+237 699 876 543',
    progress: 85,
    currentLocation: 'Out for delivery - Douala Area',
    trackingUpdates: [
      {
        status: 'dispatched',
        description: 'Medical supplies prepared for delivery',
        location: 'MedSupply Warehouse',
        timestamp: '2024-12-16T10:30:00Z'
      },
      {
        status: 'in_transit',
        description: 'Package in transit to destination',
        location: 'En route to Douala',
        timestamp: '2024-12-16T14:30:00Z'
      },
      {
        status: 'out_for_delivery',
        description: 'Out for delivery - scheduled for today',
        location: 'Delivery vehicle - Douala Area',
        timestamp: '2024-12-17T08:00:00Z'
      }
    ],
    expectedItems: [
      { description: 'Medical Gloves', quantity: 100, delivered: false },
      { description: 'Surgical Masks', quantity: 500, delivered: false },
      { description: 'Hand Sanitizer', quantity: 50, delivered: false },
      { description: 'Digital Thermometer', quantity: 10, delivered: false }
    ],
    issues: []
  },
  {
    id: 'DEL-2024-175',
    poId: 'PO-2024-175',
    requisitionId: 'REQ20241210001',
    supplierId: 'SUP004',
    supplierName: 'Office Furniture Solutions',
    supplierPhone: '+237 678 456 789',
    trackingNumber: 'OFS202412150001',
    status: 'delivered',
    dispatchDate: '2024-12-15T09:00:00Z',
    estimatedDeliveryDate: '2024-12-16T14:00:00Z',
    actualDeliveryDate: '2024-12-16T15:20:00Z',
    deliveryAddress: 'Main Office - HR Department, Douala',
    totalAmount: 1800000,
    itemCount: 2,
    priority: 'medium',
    deliveryMethod: 'installation_service',
    courierCompany: 'OFS Installation Team',
    courierContact: '+237 678 456 789',
    progress: 100,
    currentLocation: 'Delivered',
    deliveryRating: 4,
    deliveryFeedback: 'Delivered on time with professional installation service',
    receivedBy: 'Jane Smith - HR Manager',
    trackingUpdates: [
      {
        status: 'dispatched',
        description: 'Furniture prepared for delivery and installation',
        location: 'OFS Warehouse',
        timestamp: '2024-12-15T09:00:00Z'
      },
      {
        status: 'out_for_delivery',
        description: 'Installation team en route',
        location: 'Delivery truck - Douala',
        timestamp: '2024-12-16T08:00:00Z'
      },
      {
        status: 'delivered',
        description: 'Successfully delivered and installed',
        location: 'HR Department - Main Office',
        timestamp: '2024-12-16T15:20:00Z'
      }
    ],
    expectedItems: [
      { description: 'Office Chair', quantity: 8, delivered: true, condition: 'excellent' },
      { description: 'Office Desk', quantity: 4, delivered: true, condition: 'excellent' }
    ],
    issues: [],
    deliveryPhotos: ['delivery_confirmation_1.jpg', 'installation_complete_1.jpg']
  },
  {
    id: 'DEL-2024-174',
    poId: 'PO-2024-174',
    requisitionId: 'REQ20241208002',
    supplierId: 'SUP002',
    supplierName: 'Digital Solutions SARL',
    supplierPhone: '+237 699 123 456',
    trackingNumber: 'DS202412140001',
    status: 'delivery_issue',
    dispatchDate: '2024-12-14T11:00:00Z',
    estimatedDeliveryDate: '2024-12-16T17:00:00Z',
    actualDeliveryDate: null,
    deliveryAddress: 'Main Office - Finance Department, Douala',
    totalAmount: 1250000,
    itemCount: 3,
    priority: 'medium',
    deliveryMethod: 'courier_service',
    courierCompany: 'City Express',
    courierContact: '+237 677 888 999',
    progress: 40,
    currentLocation: 'Delayed at customs',
    trackingUpdates: [
      {
        status: 'dispatched',
        description: 'Package prepared for shipment',
        location: 'Digital Solutions Warehouse',
        timestamp: '2024-12-14T11:00:00Z'
      },
      {
        status: 'delayed',
        description: 'Package delayed at customs clearance',
        location: 'Douala Port Customs',
        timestamp: '2024-12-16T09:00:00Z'
      }
    ],
    expectedItems: [
      { description: 'Network Switch', quantity: 2, delivered: false },
      { description: 'Ethernet Cables', quantity: 50, delivered: false },
      { description: 'Router', quantity: 1, delivered: false }
    ],
    issues: [
      {
        type: 'customs_delay',
        description: 'Package held at customs for additional documentation',
        reportedDate: '2024-12-16T09:00:00Z',
        status: 'pending_resolution',
        estimatedResolution: '2024-12-18T17:00:00Z'
      }
    ]
  }
];

const BuyerDeliveryTracking = () => {
  const [deliveries, setDeliveries] = useState(mockDeliveries);
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [confirmationModalVisible, setConfirmationModalVisible] = useState(false);
  const [issueModalVisible, setIssueModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [confirmationForm] = Form.useForm();
  const [issueForm] = Form.useForm();

  const getStatusTag = (status) => {
    const statusMap = {
      'pending': { color: 'default', text: 'Pending Dispatch', icon: <ClockCircleOutlined /> },
      'dispatched': { color: 'blue', text: 'Dispatched', icon: < InboxOutlined /> },
      'in_transit': { color: 'purple', text: 'In Transit', icon: <TruckOutlined /> },
      'at_facility': { color: 'cyan', text: 'At Facility', icon: <EnvironmentOutlined /> },
      'out_for_delivery': { color: 'orange', text: 'Out for Delivery', icon: <TruckOutlined /> },
      'delivered': { color: 'green', text: 'Delivered', icon: <CheckCircleOutlined /> },
      'delivery_issue': { color: 'red', text: 'Delivery Issue', icon: <ExclamationCircleOutlined /> },
      'delayed': { color: 'volcano', text: 'Delayed', icon: <WarningOutlined /> },
      'cancelled': { color: 'default', text: 'Cancelled', icon: <ExclamationCircleOutlined /> }
    };
    const statusInfo = statusMap[status] || { color: 'default', text: status, icon: <ClockCircleOutlined /> };
    return (
      <Tag color={statusInfo.color} icon={statusInfo.icon}>
        {statusInfo.text}
      </Tag>
    );
  };

  const getPriorityTag = (priority) => {
    const priorityMap = {
      'low': 'green',
      'medium': 'orange',
      'high': 'red',
      'urgent': 'volcano'
    };
    return <Tag color={priorityMap[priority]}>{priority.toUpperCase()}</Tag>;
  };

  const handleViewDetails = (delivery) => {
    setSelectedDelivery(delivery);
    setDetailModalVisible(true);
  };

  const handleConfirmDelivery = (delivery) => {
    setSelectedDelivery(delivery);
    confirmationForm.resetFields();
    confirmationForm.setFieldsValue({
      receivedBy: '',
      actualDeliveryDate: new Date(),
      condition: 'excellent',
      rating: 5
    });
    setConfirmationModalVisible(true);
  };

  const handleReportIssue = (delivery) => {
    setSelectedDelivery(delivery);
    issueForm.resetFields();
    setIssueModalVisible(true);
  };

  const handleSubmitConfirmation = async () => {
    try {
      const values = await confirmationForm.validateFields();
      setLoading(true);
      
      // Update delivery status
      const updatedDeliveries = deliveries.map(delivery => 
        delivery.id === selectedDelivery.id 
          ? { 
              ...delivery, 
              status: 'delivered',
              actualDeliveryDate: values.actualDeliveryDate.toISOString(),
              receivedBy: values.receivedBy,
              deliveryRating: values.rating,
              deliveryFeedback: values.feedback,
              progress: 100,
              expectedItems: delivery.expectedItems.map(item => ({
                ...item,
                delivered: true,
                condition: values.condition
              })),
              trackingUpdates: [
                ...delivery.trackingUpdates,
                {
                  status: 'delivered',
                  description: `Successfully delivered and confirmed by ${values.receivedBy}`,
                  location: delivery.deliveryAddress,
                  timestamp: values.actualDeliveryDate.toISOString()
                }
              ]
            }
          : delivery
      );
      setDeliveries(updatedDeliveries);
      
      message.success('Delivery confirmed successfully!');
      setConfirmationModalVisible(false);
      confirmationForm.resetFields();
    } catch (error) {
      console.error('Error confirming delivery:', error);
      message.error('Failed to confirm delivery');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitIssue = async () => {
    try {
      const values = await issueForm.validateFields();
      setLoading(true);
      
      // Update delivery with issue
      const updatedDeliveries = deliveries.map(delivery => 
        delivery.id === selectedDelivery.id 
          ? { 
              ...delivery, 
              status: 'delivery_issue',
              issues: [
                ...delivery.issues,
                {
                  type: values.issueType,
                  description: values.description,
                  reportedDate: new Date().toISOString(),
                  status: 'reported',
                  priority: values.priority
                }
              ]
            }
          : delivery
      );
      setDeliveries(updatedDeliveries);
      
      message.success('Delivery issue reported successfully!');
      setIssueModalVisible(false);
      issueForm.resetFields();
    } catch (error) {
      console.error('Error reporting issue:', error);
      message.error('Failed to report issue');
    } finally {
      setLoading(false);
    }
  };

  const refreshTracking = async (deliveryId) => {
    setLoading(true);
    message.loading('Refreshing tracking information...', 1);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    message.success('Tracking information updated');
    setLoading(false);
  };

  const getFilteredDeliveries = () => {
    switch (activeTab) {
      case 'in_transit':
        return deliveries.filter(d => ['in_transit', 'out_for_delivery'].includes(d.status));
      case 'today':
        const today = new Date().toISOString().split('T')[0];
        return deliveries.filter(d => 
          d.estimatedDeliveryDate.startsWith(today) && d.status !== 'delivered'
        );
      case 'overdue':
        const now = new Date();
        return deliveries.filter(d => 
          new Date(d.estimatedDeliveryDate) < now &&
          !['delivered', 'cancelled'].includes(d.status)
        );
      case 'issues':
        return deliveries.filter(d => d.status === 'delivery_issue' || d.issues.length > 0);
      case 'delivered':
        return deliveries.filter(d => d.status === 'delivered');
      default:
        return deliveries;
    }
  };

  const columns = [
    {
      title: 'Delivery Details',
      key: 'details',
      render: (_, record) => (
        <div>
          <div>
            <Text strong>{record.trackingNumber}</Text>
          </div>
          <div>
            <Text type="secondary">
              PO: {record.poId}
            </Text>
          </div>
          <div>
            <Text type="secondary">
              {record.itemCount} items • {getPriorityTag(record.priority)}
            </Text>
          </div>
        </div>
      ),
      width: 160
    },
    {
      title: 'Supplier',
      key: 'supplier',
      render: (_, record) => (
        <div>
          <div>
            <Text strong>{record.supplierName}</Text>
          </div>
          <div>
            <Text type="secondary">
              <PhoneOutlined /> {record.supplierPhone}
            </Text>
          </div>
        </div>
      ),
      width: 180
    },
    {
      title: 'Current Status',
      key: 'status',
      render: (_, record) => (
        <div>
          <div>
            {getStatusTag(record.status)}
          </div>
          <div>
            <Text type="secondary">
              {record.currentLocation}
            </Text>
          </div>
        </div>
      ),
      width: 160
    },
    {
      title: 'Progress',
      key: 'progress',
      render: (_, record) => (
        <div>
          <div>
            <Progress percent={record.progress} size="small" />
          </div>
          <div>
            <Text type="secondary">
              {record.deliveryMethod.replace('_', ' ')}
            </Text>
          </div>
        </div>
      ),
      width: 120
    },
    {
      title: 'Delivery Schedule',
      key: 'schedule',
      render: (_, record) => {
        const isOverdue = new Date(record.estimatedDeliveryDate) < new Date() && 
                          record.status !== 'delivered';
        const isToday = new Date(record.estimatedDeliveryDate).toDateString() === new Date().toDateString();
        
        return (
          <div>
            <div>
              <Text type={isOverdue ? 'danger' : isToday ? 'warning' : 'secondary'}>
                {new Date(record.estimatedDeliveryDate).toLocaleDateString()} {new Date(record.estimatedDeliveryDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </Text>
            </div>
            <div>
              <Text type="secondary">
                {record.actualDeliveryDate ? 
                  `Delivered: ${new Date(record.actualDeliveryDate).toLocaleDateString()}` :
                  isOverdue ? `Overdue` :
                  `Due ${isToday ? 'today' : 'soon'}`
                }
              </Text>
              {isOverdue && (
                <WarningOutlined style={{ color: '#ff4d4f', marginLeft: 4 }} />
              )}
            </div>
          </div>
        );
      },
      width: 140
    },
    {
      title: 'Value',
      key: 'value',
      render: (_, record) => (
        <Text strong>
          XAF {(record.totalAmount / 1000000).toFixed(1)}M
        </Text>
      ),
      width: 100
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="View Details">
            <Button
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handleViewDetails(record)}
            />
          </Tooltip>
          <Tooltip title="Refresh Tracking">
            <Button
              size="small"
              icon={<ReloadOutlined />}
              onClick={() => refreshTracking(record.id)}
              loading={loading}
            />
          </Tooltip>
          {record.status === 'out_for_delivery' && (
            <Tooltip title="Confirm Delivery">
              <Button
                size="small"
                type="primary"
                icon={<CheckCircleOutlined />}
                onClick={() => handleConfirmDelivery(record)}
              />
            </Tooltip>
          )}
          {!['delivered', 'cancelled'].includes(record.status) && (
            <Tooltip title="Report Issue">
              <Button
                size="small"
                danger
                icon={<ExclamationCircleOutlined />}
                onClick={() => handleReportIssue(record)}
              />
            </Tooltip>
          )}
        </Space>
      ),
      width: 140,
      fixed: 'right'
    }
  ];

  const stats = {
    total: deliveries.length,
    inTransit: deliveries.filter(d => ['in_transit', 'out_for_delivery'].includes(d.status)).length,
    dueToday: deliveries.filter(d => {
      const today = new Date().toDateString();
      return new Date(d.estimatedDeliveryDate).toDateString() === today && d.status !== 'delivered';
    }).length,
    overdue: deliveries.filter(d => 
      new Date(d.estimatedDeliveryDate) < new Date() && 
      !['delivered', 'cancelled'].includes(d.status)
    ).length,
    delivered: deliveries.filter(d => d.status === 'delivered').length,
    issues: deliveries.filter(d => d.status === 'delivery_issue' || d.issues.length > 0).length
  };

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <div style={{ marginBottom: '24px' }}>
          <Row justify="space-between" align="middle">
            <Col>
              <Title level={3}>
                <TruckOutlined /> Delivery Tracking
              </Title>
            </Col>
            <Col>
              <Space>
                <Button 
                  icon={<ReloadOutlined />} 
                  onClick={() => refreshTracking('all')}
                >
                  Refresh All
                </Button>
                <Button icon={<FileTextOutlined />}>
                  Delivery Report
                </Button>
              </Space>
            </Col>
          </Row>
        </div>

        {/* Statistics */}
        <Row gutter={16} style={{ marginBottom: '24px' }}>
          <Col span={4}>
            <Statistic
              title="Total Deliveries"
              value={stats.total}
              prefix={<InboxOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Col>
          <Col span={4}>
            <Statistic
              title="In Transit"
              value={stats.inTransit}
              prefix={<TruckOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Col>
          <Col span={4}>
            <Statistic
              title="Due Today"
              value={stats.dueToday}
              prefix={<CalendarOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Col>
          <Col span={4}>
            <Statistic
              title="Overdue"
              value={stats.overdue}
              prefix={<WarningOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Col>
          <Col span={4}>
            <Statistic
              title="Delivered"
              value={stats.delivered}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Col>
          <Col span={4}>
            <Statistic
              title="Issues"
              value={stats.issues}
              prefix={<ExclamationCircleOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Col>
        </Row>

        {/* Alerts */}
        {stats.overdue > 0 && (
          <Alert
            message={`${stats.overdue} deliveries are overdue`}
            type="error"
            showIcon
            action={
              <Button 
                size="small" 
                danger 
                onClick={() => setActiveTab('overdue')}
              >
                View Overdue
              </Button>
            }
            style={{ marginBottom: '24px' }}
          />
        )}

        {stats.dueToday > 0 && (
          <Alert
            message={`${stats.dueToday} deliveries are due today`}
            type="warning"
            showIcon
            style={{ marginBottom: '24px' }}
          />
        )}

        {stats.issues > 0 && (
          <Alert
            message={`${stats.issues} deliveries have reported issues`}
            type="error"
            showIcon
            style={{ marginBottom: '24px' }}
          />
        )}

        {/* Tabs */}
        <Tabs activeKey={activeTab} onChange={setActiveTab} style={{ marginBottom: '16px' }}>
          <Tabs.TabPane 
            tab={
              <Badge count={stats.total} size="small">
                All Deliveries ({stats.total})
              </Badge>
            } 
            key="all"
          />
          <Tabs.TabPane 
            tab={
              <Badge count={stats.inTransit} size="small">
                <TruckOutlined /> In Transit ({stats.inTransit})
              </Badge>
            } 
            key="in_transit"
          />
          <Tabs.TabPane 
            tab={
              <Badge count={stats.dueToday} size="small">
                <CalendarOutlined /> Due Today ({stats.dueToday})
              </Badge>
            } 
            key="today"
          />
          <Tabs.TabPane 
            tab={
              <Badge count={stats.overdue} size="small">
                <WarningOutlined /> Overdue ({stats.overdue})
              </Badge>
            } 
            key="overdue"
          />
          <Tabs.TabPane 
            tab={
              <Badge count={stats.issues} size="small">
                <ExclamationCircleOutlined /> Issues ({stats.issues})
              </Badge>
            } 
            key="issues"
          />
          <Tabs.TabPane 
            tab={<span><CheckCircleOutlined /> Delivered ({stats.delivered})</span>} 
            key="delivered"
          />
        </Tabs>

        <Table
          dataSource={getFilteredDeliveries()}
          columns={columns}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `${range[0]}-${range[1]} of ${total} deliveries`
          }}
          scroll={{ x: 'max-content' }}
        />
      </Card>

      {/* Delivery Details Modal */}
      <Modal
        title={
          <div>
            <TruckOutlined /> 
            Delivery Tracking - {selectedDelivery?.trackingNumber}
          </div>
        }
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        width={800}
        footer={null}
      >
        {selectedDelivery && (
          <div>
            {/* Delivery Header */}
            <Row gutter={16} style={{ marginBottom: '24px' }}>
              <Col span={12}>
                <div style={{ marginBottom: '8px' }}>
                  <Text strong>Tracking Number: </Text>{selectedDelivery.trackingNumber}
                </div>
                <div style={{ marginBottom: '8px' }}>
                  <Text strong>PO Number: </Text>{selectedDelivery.poId}
                </div>
                <div style={{ marginBottom: '8px' }}>
                  <Text strong>Supplier: </Text>{selectedDelivery.supplierName}
                </div>
                <div style={{ marginBottom: '8px' }}>
                  <Text strong>Method: </Text>{selectedDelivery.deliveryMethod.replace('_', ' ')}
                </div>
                <div style={{ marginBottom: '8px' }}>
                  <Text strong>Courier: </Text>{selectedDelivery.courierCompany}
                </div>
                <div>
                  <Text strong>Status: </Text>{getStatusTag(selectedDelivery.status)}
                </div>
              </Col>
              <Col span={12}>
                <div style={{ marginBottom: '8px' }}>
                  <Text strong>Dispatched: </Text>{new Date(selectedDelivery.dispatchDate).toLocaleDateString()} {new Date(selectedDelivery.dispatchDate).toLocaleTimeString()}
                </div>
                <div style={{ marginBottom: '8px' }}>
                  <Text strong>Expected: </Text>{new Date(selectedDelivery.estimatedDeliveryDate).toLocaleDateString()} {new Date(selectedDelivery.estimatedDeliveryDate).toLocaleTimeString()}
                </div>
                {selectedDelivery.actualDeliveryDate && (
                  <div style={{ marginBottom: '8px' }}>
                    <Text strong>Delivered: </Text>{new Date(selectedDelivery.actualDeliveryDate).toLocaleDateString()} {new Date(selectedDelivery.actualDeliveryDate).toLocaleTimeString()}
                  </div>
                )}
                <div style={{ marginBottom: '8px' }}>
                  <Text strong>Current Location: </Text>{selectedDelivery.currentLocation}
                </div>
                <div>
                  <Text strong>Destination: </Text>{selectedDelivery.deliveryAddress}
                </div>
              </Col>
            </Row>

            {/* Progress */}
            <div style={{ marginBottom: '24px' }}>
              <Progress percent={selectedDelivery.progress} />
            </div>

            {/* Tracking Timeline */}
            <div style={{ marginBottom: '24px' }}>
              <Title level={5}>Tracking Timeline</Title>
              <Timeline>
                {selectedDelivery.trackingUpdates.map((update, index) => (
                  <Timeline.Item key={index}>
                    <div>{update.description}</div>
                    <div>
                      <Text type="secondary">{update.location}</Text>
                    </div>
                    <div>
                      <Text type="secondary">
                        {new Date(update.timestamp).toLocaleDateString()} {new Date(update.timestamp).toLocaleTimeString()}
                      </Text>
                    </div>
                  </Timeline.Item>
                ))}
              </Timeline>
            </div>

            {/* Expected Items */}
            <div style={{ marginBottom: '24px' }}>
              <Title level={5}>Expected Items</Title>
              <List
                dataSource={selectedDelivery.expectedItems}
                renderItem={(item) => (
                  <List.Item>
                    <List.Item.Meta
                      title={`${item.description} (Qty: ${item.quantity})`}
                      description={
                        <div>
                          {item.delivered ? (
                            <Tag color="green" icon={<CheckCircleOutlined />}>
                              Delivered ({item.condition})
                            </Tag>
                          ) : (
                            <Tag color="orange" icon={<ClockCircleOutlined />}>
                              Pending
                            </Tag>
                          )}
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            </div>

            {/* Issues */}
            {selectedDelivery.issues && selectedDelivery.issues.length > 0 && (
              <div style={{ marginBottom: '24px' }}>
                <Title level={5}>Reported Issues</Title>
                {selectedDelivery.issues.map((issue, index) => (
                  <Alert
                    key={index}
                    message={
                      <div>
                        <div>{issue.description}</div>
                        <div>
                          <Text type="secondary">
                            Reported: {new Date(issue.reportedDate).toLocaleDateString()} {new Date(issue.reportedDate).toLocaleTimeString()}
                          </Text>
                        </div>
                        {issue.estimatedResolution && (
                          <div>
                            <Text type="secondary">
                              Expected Resolution: {new Date(issue.estimatedResolution).toLocaleDateString()} {new Date(issue.estimatedResolution).toLocaleTimeString()}
                            </Text>
                          </div>
                        )}
                      </div>
                    }
                    type="warning"
                    showIcon
                    style={{ marginBottom: '8px' }}
                  />
                ))}
              </div>
            )}

            {/* Delivery Rating */}
            {selectedDelivery.status === 'delivered' && selectedDelivery.deliveryRating && (
              <div style={{ marginBottom: '24px' }}>
                <Title level={5}>Delivery Feedback</Title>
                <div style={{ marginBottom: '8px' }}>
                  <Text strong>Rating: </Text>
                  <Rate disabled value={selectedDelivery.deliveryRating} />
                  <Text type="secondary" style={{ marginLeft: '8px' }}>
                    ({selectedDelivery.deliveryRating}/5.0)
                  </Text>
                </div>
                <div style={{ marginBottom: '8px' }}>
                  <Text strong>Received by: </Text>{selectedDelivery.receivedBy}
                </div>
                <div>
                  <Text strong>Feedback: </Text>{selectedDelivery.deliveryFeedback}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ textAlign: 'center', marginTop: '24px' }}>
              <Space>
                {selectedDelivery.status === 'out_for_delivery' && (
                  <Button
                    type="primary"
                    icon={<CheckCircleOutlined />}
                    onClick={() => {
                      setDetailModalVisible(false);
                      handleConfirmDelivery(selectedDelivery);
                    }}
                  >
                    Confirm Delivery
                  </Button>
                )}
                {!['delivered', 'cancelled'].includes(selectedDelivery.status) && (
                  <Button
                    danger
                    icon={<ExclamationCircleOutlined />}
                    onClick={() => {
                      setDetailModalVisible(false);
                      handleReportIssue(selectedDelivery);
                    }}
                  >
                    Report Issue
                  </Button>
                )}
                <Button icon={<ReloadOutlined />} onClick={() => refreshTracking(selectedDelivery.id)}>
                  Refresh Tracking
                </Button>
                <Button icon={<PhoneOutlined />}>
                  Contact Courier
                </Button>
                <Button icon={<FileTextOutlined />}>
                  Download Receipt
                </Button>
              </Space>
            </div>
          </div>
        )}
      </Modal>

      {/* Delivery Confirmation Modal */}
      <Modal
        title="Confirm Delivery"
        open={confirmationModalVisible}
        onOk={handleSubmitConfirmation}
        onCancel={() => setConfirmationModalVisible(false)}
        confirmLoading={loading}
        width={600}
      >
        {selectedDelivery && (
          <div>
            <Alert
              message={`Confirming delivery for ${selectedDelivery.trackingNumber}`}
              description="Please verify all items have been received in good condition before confirming"
              type="info"
              showIcon
              style={{ marginBottom: '24px' }}
            />

            <Form form={confirmationForm} layout="vertical">
              <Form.Item
                name="receivedBy"
                label="Received By"
                rules={[{ required: true, message: 'Please enter who received the delivery' }]}
              >
                <Input placeholder="Enter full name and title" />
              </Form.Item>
              
              <Form.Item
                name="actualDeliveryDate"
                label="Actual Delivery Date & Time"
                rules={[{ required: true, message: 'Please select delivery date and time' }]}
              >
                <DatePicker showTime style={{ width: '100%' }} />
              </Form.Item>

              <Form.Item
                name="condition"
                label="Item Condition"
                rules={[{ required: true, message: 'Please select item condition' }]}
              >
                <Select placeholder="Select overall condition of received items">
                  <Option value="excellent">Excellent - All items perfect</Option>
                  <Option value="good">Good - Minor cosmetic issues</Option>
                  <Option value="fair">Fair - Some damage but functional</Option>
                  <Option value="poor">Poor - Significant damage</Option>
                </Select>
              </Form.Item>

              <Form.Item
                name="rating"
                label="Delivery Service Rating"
              >
                <Rate />
              </Form.Item>

              <Form.Item
                name="feedback"
                label="Delivery Feedback (Optional)"
              >
                <TextArea
                  rows={3}
                  placeholder="Any comments about the delivery service, timeliness, courier professionalism, etc."
                  showCount
                  maxLength={200}
                />
              </Form.Item>

              <Form.Item
                name="photos"
                label="Delivery Photos (Optional)"
              >
                <Upload.Dragger
                  multiple
                  beforeUpload={() => false}
                  accept="image/*"
                >
                  <p className="ant-upload-drag-icon">
                    <CameraOutlined />
                  </p>
                  <p className="ant-upload-text">Click or drag photos to upload</p>
                  <p className="ant-upload-hint">
                    Upload photos of delivered items for records
                  </p>
                </Upload.Dragger>
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>

      {/* Report Issue Modal */}
      <Modal
        title="Report Delivery Issue"
        open={issueModalVisible}
        onOk={handleSubmitIssue}
        onCancel={() => setIssueModalVisible(false)}
        confirmLoading={loading}
        width={600}
      >
        {selectedDelivery && (
          <div>
            <Alert
              message={`Reporting issue for ${selectedDelivery.trackingNumber}`}
              description={`This will notify the supplier and initiate resolution process`}
              type="warning"
              showIcon
              style={{ marginBottom: '24px' }}
            />

            <Form form={issueForm} layout="vertical">
              <Form.Item
                name="issueType"
                label="Issue Type"
                rules={[{ required: true, message: 'Please select issue type' }]}
              >
                <Select placeholder="Select the type of issue">
                  <Option value="delayed_delivery">Delayed Delivery</Option>
                  <Option value="missing_items">Missing Items</Option>
                  <Option value="damaged_items">Damaged Items</Option>
                  <Option value="wrong_items">Wrong Items Delivered</Option>
                  <Option value="incomplete_delivery">Incomplete Delivery</Option>
                  <Option value="delivery_location">Wrong Delivery Location</Option>
                  <Option value="courier_issue">Courier Service Issue</Option>
                  <Option value="documentation_issue">Documentation Problem</Option>
                  <Option value="other">Other Issue</Option>
                </Select>
              </Form.Item>

              <Form.Item
                name="priority"
                label="Issue Priority"
                rules={[{ required: true, message: 'Please select priority level' }]}
              >
                <Select placeholder="Select priority level">
                  <Option value="low">Low - Minor issue, can wait</Option>
                  <Option value="medium">Medium - Needs attention soon</Option>
                  <Option value="high">High - Urgent attention required</Option>
                  <Option value="critical">Critical - Business impact</Option>
                </Select>
              </Form.Item>

              <Form.Item
                name="description"
                label="Issue Description"
                rules={[{ required: true, message: 'Please describe the issue' }]}
              >
                <TextArea
                  rows={4}
                  placeholder="Provide detailed description of the issue, including what happened, when it occurred, and any immediate actions taken..."
                  showCount
                  maxLength={500}
                />
              </Form.Item>

              <Form.Item
                name="expectedResolution"
                label="Expected Resolution"
              >
                <TextArea
                  rows={2}
                  placeholder="What resolution do you expect? (e.g., replacement items, refund, re-delivery, etc.)"
                  showCount
                  maxLength={200}
                />
              </Form.Item>

              <Form.Item
                name="photos"
                label="Supporting Photos (Optional)"
              >
                <Upload.Dragger
                  multiple
                  beforeUpload={() => false}
                  accept="image/*"
                >
                  <p className="ant-upload-drag-icon">
                    <CameraOutlined />
                  </p>
                  <p className="ant-upload-text">Upload photos as evidence</p>
                  <p className="ant-upload-hint">
                    Photos help resolve issues faster
                  </p>
                </Upload.Dragger>
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default BuyerDeliveryTracking;