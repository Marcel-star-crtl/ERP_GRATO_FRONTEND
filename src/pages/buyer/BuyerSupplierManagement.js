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
  Rate,
  Progress,
  Tabs,
  Alert,
  Divider,
  Badge,
  message,
  Tooltip,
  Descriptions,
  Drawer,
  List,
  Avatar,
  Timeline,
  DatePicker
} from 'antd';
import {
  TeamOutlined,
  StarOutlined,
  PhoneOutlined,
  MailOutlined,
  GlobalOutlined,
  TruckOutlined,
  DollarOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  BarChartOutlined,
  MessageOutlined,
  EyeOutlined,
  EditOutlined,
  ContactsOutlined,
  SafetyCertificateOutlined,
  ShoppingCartOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
  RiseOutlined,
  FallOutlined
} from '@ant-design/icons';
import moment from 'moment';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;

// Mock supplier data
const mockSuppliers = [
  {
    id: 'SUP001',
    name: 'TechSource Cameroon',
    email: 'sales@techsource.cm',
    phone: '+237 678 901 234',
    website: 'www.techsource.cm',
    address: 'Douala, Littoral Region',
    category: ['IT Accessories', 'Hardware', 'Software'],
    status: 'active',
    rating: 4.5,
    joinDate: '2023-06-15',
    lastTransaction: '2024-12-15',
    totalOrders: 23,
    totalValue: 45800000,
    onTimeDelivery: 95,
    qualityRating: 4.6,
    costCompetitiveness: 4.3,
    responseTime: 2.5, // hours
    paymentTerms: ['30 days', '45 days'],
    deliveryCapacity: 'Same day to 14 days',
    certifications: ['ISO 9001', 'ISO 27001'],
    performanceMetrics: {
      averageDeliveryTime: 3.2,
      orderFulfillmentRate: 98,
      defectRate: 1.2,
      costSavings: 12.5
    },
    recentActivity: [
      { type: 'order', description: 'PO-2024-156 delivered on time', date: '2024-12-15T10:30:00Z' },
      { type: 'quote', description: 'Quote submitted for REQ20241215001', date: '2024-12-16T14:30:00Z' },
      { type: 'communication', description: 'Clarification request responded', date: '2024-12-14T16:20:00Z' }
    ],
    contactHistory: [
      { type: 'email', subject: 'Quote Request - IT Accessories', date: '2024-12-16T10:00:00Z', direction: 'sent' },
      { type: 'email', subject: 'Quote Response with Specifications', date: '2024-12-16T14:30:00Z', direction: 'received' },
      { type: 'phone', subject: 'Delivery confirmation call', date: '2024-12-15T09:15:00Z', direction: 'outgoing' }
    ]
  },
  {
    id: 'SUP003',
    name: 'Central Africa Tech Hub',
    email: 'procurement@catechhub.com',
    phone: '+237 677 555 123',
    website: 'www.catechhub.com',
    address: 'Douala, Littoral Region',
    category: ['IT Accessories', 'Software', 'Hardware', 'Maintenance'],
    status: 'active',
    rating: 4.8,
    joinDate: '2023-03-10',
    lastTransaction: '2024-12-14',
    totalOrders: 18,
    totalValue: 38200000,
    onTimeDelivery: 92,
    qualityRating: 4.9,
    costCompetitiveness: 4.7,
    responseTime: 1.8,
    paymentTerms: ['30 days', '60 days'],
    deliveryCapacity: '2-10 days',
    certifications: ['ISO 9001', 'ISO 14001', 'OHSAS 18001'],
    performanceMetrics: {
      averageDeliveryTime: 4.1,
      orderFulfillmentRate: 96,
      defectRate: 0.8,
      costSavings: 15.2
    },
    recentActivity: [
      { type: 'quote', description: 'Quote submitted with extended warranty', date: '2024-12-16T16:45:00Z' },
      { type: 'order', description: 'PO-2024-145 completed successfully', date: '2024-12-14T11:20:00Z' }
    ],
    contactHistory: [
      { type: 'email', subject: 'New RFQ - Office Equipment', date: '2024-12-16T11:00:00Z', direction: 'sent' },
      { type: 'email', subject: 'Detailed quotation with specifications', date: '2024-12-16T16:45:00Z', direction: 'received' }
    ]
  },
  {
    id: 'SUP004',
    name: 'Office Furniture Solutions',
    email: 'sales@officefurniture.cm',
    phone: '+237 678 456 789',
    website: 'www.officefurniture.cm',
    address: 'Douala, Littoral Region',
    category: ['Furniture', 'Office Equipment'],
    status: 'active',
    rating: 4.3,
    joinDate: '2023-09-20',
    lastTransaction: '2024-12-12',
    totalOrders: 15,
    totalValue: 28500000,
    onTimeDelivery: 88,
    qualityRating: 4.4,
    costCompetitiveness: 4.1,
    responseTime: 4.2,
    paymentTerms: ['30 days', '45 days'],
    deliveryCapacity: '5-14 days',
    certifications: ['ISO 9001'],
    performanceMetrics: {
      averageDeliveryTime: 6.8,
      orderFulfillmentRate: 94,
      defectRate: 2.1,
      costSavings: 8.3
    },
    recentActivity: [
      { type: 'order', description: 'PO-2024-134 delivered with minor delay', date: '2024-12-12T15:30:00Z' },
      { type: 'communication', description: 'Installation support provided', date: '2024-12-10T09:00:00Z' }
    ],
    contactHistory: [
      { type: 'email', subject: 'Furniture Installation Schedule', date: '2024-12-10T08:00:00Z', direction: 'sent' },
      { type: 'phone', subject: 'Delivery coordination call', date: '2024-12-12T14:00:00Z', direction: 'outgoing' }
    ]
  }
];

const BuyerSupplierManagement = () => {
  const [suppliers, setSuppliers] = useState(mockSuppliers);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false);
  const [communicationModalVisible, setCommunicationModalVisible] = useState(false);
  const [ratingModalVisible, setRatingModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [communicationForm] = Form.useForm();
  const [ratingForm] = Form.useForm();

  const getStatusTag = (status) => {
    const statusMap = {
      'active': { color: 'green', text: 'Active' },
      'inactive': { color: 'orange', text: 'Inactive' },
      'suspended': { color: 'red', text: 'Suspended' },
      'pending': { color: 'blue', text: 'Pending Approval' }
    };
    const statusInfo = statusMap[status] || { color: 'default', text: status };
    return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>;
  };

  const getPerformanceColor = (value, type = 'percentage') => {
    if (type === 'percentage') {
      if (value >= 90) return '#52c41a';
      if (value >= 80) return '#faad14';
      if (value >= 70) return '#fa8c16';
      return '#ff4d4f';
    }
    if (type === 'rating') {
      if (value >= 4.5) return '#52c41a';
      if (value >= 4.0) return '#faad14';
      if (value >= 3.5) return '#fa8c16';
      return '#ff4d4f';
    }
    return '#1890ff';
  };

  const handleViewDetails = (supplier) => {
    setSelectedSupplier(supplier);
    setDetailDrawerVisible(true);
  };

  const handleSendMessage = (supplier) => {
    setSelectedSupplier(supplier);
    communicationForm.resetFields();
    setCommunicationModalVisible(true);
  };

  const handleRateSupplier = (supplier) => {
    setSelectedSupplier(supplier);
    ratingForm.setFieldsValue({
      overallRating: supplier.rating,
      qualityRating: supplier.qualityRating,
      costRating: supplier.costCompetitiveness,
      deliveryRating: supplier.onTimeDelivery / 20, // Convert percentage to 5-star scale
      notes: ''
    });
    setRatingModalVisible(true);
  };

  const handleSubmitCommunication = async () => {
    try {
      const values = await communicationForm.validateFields();
      setLoading(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      message.success(`Message sent to ${selectedSupplier.name} successfully!`);
      setCommunicationModalVisible(false);
      communicationForm.resetFields();
    } catch (error) {
      console.error('Error sending message:', error);
      message.error('Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitRating = async () => {
    try {
      const values = await ratingForm.validateFields();
      setLoading(true);
      
      // Update supplier rating
      const updatedSuppliers = suppliers.map(supplier => 
        supplier.id === selectedSupplier.id 
          ? { 
              ...supplier, 
              rating: values.overallRating,
              qualityRating: values.qualityRating,
              costCompetitiveness: values.costRating
            }
          : supplier
      );
      setSuppliers(updatedSuppliers);
      
      message.success('Supplier rating updated successfully!');
      setRatingModalVisible(false);
      ratingForm.resetFields();
    } catch (error) {
      console.error('Error updating rating:', error);
      message.error('Failed to update rating');
    } finally {
      setLoading(false);
    }
  };

  const getFilteredSuppliers = () => {
    switch (activeTab) {
      case 'active':
        return suppliers.filter(s => s.status === 'active');
      case 'high_performers':
        return suppliers.filter(s => s.rating >= 4.5 && s.onTimeDelivery >= 90);
      case 'recent':
        return suppliers.filter(s => moment(s.lastTransaction).isAfter(moment().subtract(30, 'days')));
      default:
        return suppliers;
    }
  };

  const columns = [
    {
      title: 'Supplier Details',
      key: 'details',
      render: (_, record) => (
        <div>
          <Text strong style={{ fontSize: '14px' }}>{record.name}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: '12px' }}>
            <MailOutlined /> {record.email}
          </Text>
          <br />
          <Text type="secondary" style={{ fontSize: '12px' }}>
            <PhoneOutlined /> {record.phone}
          </Text>
          <br />
          <Space wrap size="small" style={{ marginTop: '4px' }}>
            {record.category.slice(0, 2).map(cat => (
              <Tag key={cat} size="small" color="blue">{cat}</Tag>
            ))}
            {record.category.length > 2 && (
              <Tag size="small">+{record.category.length - 2}</Tag>
            )}
          </Space>
        </div>
      ),
      width: 250
    },
    {
      title: 'Performance Rating',
      key: 'performance',
      render: (_, record) => (
        <div style={{ textAlign: 'center' }}>
          <div style={{ marginBottom: '8px' }}>
            <Rate 
              disabled 
              allowHalf
              value={record.rating} 
              style={{ fontSize: '14px' }}
            />
          </div>
          <Text strong style={{ color: getPerformanceColor(record.rating, 'rating') }}>
            {record.rating}/5.0
          </Text>
          <div style={{ marginTop: '4px', fontSize: '12px' }}>
            <Text type="secondary">
              {record.totalOrders} orders
            </Text>
          </div>
        </div>
      ),
      width: 120
    },
    {
      title: 'On-Time Delivery',
      key: 'delivery',
      render: (_, record) => (
        <div style={{ textAlign: 'center' }}>
          <Progress 
            type="circle" 
            percent={record.onTimeDelivery} 
            width={50}
            strokeColor={getPerformanceColor(record.onTimeDelivery)}
            format={percent => `${percent}%`}
          />
          <div style={{ marginTop: '4px', fontSize: '12px' }}>
            <Text type="secondary">
              Avg: {record.performanceMetrics?.averageDeliveryTime || 'N/A'} days
            </Text>
          </div>
        </div>
      ),
      width: 100
    },
    {
      title: 'Business Value',
      key: 'value',
      render: (_, record) => (
        <div>
          <Text strong style={{ color: '#1890ff' }}>
            XAF {(record.totalValue / 1000000).toFixed(1)}M
          </Text>
          <br />
          <Text type="secondary" style={{ fontSize: '12px' }}>
            Cost Savings: {record.performanceMetrics?.costSavings || 0}%
          </Text>
          <br />
          <Text type="secondary" style={{ fontSize: '12px' }}>
            Response: {record.responseTime}h avg
          </Text>
        </div>
      ),
      width: 130
    },
    {
      title: 'Last Transaction',
      key: 'lastTransaction',
      render: (_, record) => (
        <div>
          <CalendarOutlined /> {moment(record.lastTransaction).format('MMM DD')}
          <br />
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {moment(record.lastTransaction).fromNow()}
          </Text>
        </div>
      ),
      width: 120
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => getStatusTag(status),
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
          <Tooltip title="Send Message">
            <Button 
              size="small" 
              icon={<MessageOutlined />}
              onClick={() => handleSendMessage(record)}
            />
          </Tooltip>
          <Tooltip title="Rate Supplier">
            <Button 
              size="small" 
              icon={<StarOutlined />}
              onClick={() => handleRateSupplier(record)}
            />
          </Tooltip>
        </Space>
      ),
      width: 120,
      fixed: 'right'
    }
  ];

  const stats = {
    total: suppliers.length,
    active: suppliers.filter(s => s.status === 'active').length,
    highPerformers: suppliers.filter(s => s.rating >= 4.5 && s.onTimeDelivery >= 90).length,
    averageRating: (suppliers.reduce((sum, s) => sum + s.rating, 0) / suppliers.length).toFixed(1),
    totalValue: suppliers.reduce((sum, s) => sum + s.totalValue, 0)
  };

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <Title level={2} style={{ margin: 0 }}>
            <ContactsOutlined /> Supplier Relationship Management
          </Title>
          <Space>
            <Button icon={<BarChartOutlined />}>
              Performance Report
            </Button>
            <Button type="primary" icon={<MessageOutlined />}>
              Broadcast Message
            </Button>
          </Space>
        </div>

        {/* Statistics */}
        <Row gutter={16} style={{ marginBottom: '24px' }}>
          <Col span={6}>
            <Statistic
              title="Total Suppliers"
              value={stats.total}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="Active Suppliers"
              value={stats.active}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="High Performers"
              value={stats.highPerformers}
              prefix={<StarOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="Total Business Value"
              value={`${(stats.totalValue / 1000000).toFixed(1)}M`}
              prefix={<DollarOutlined />}
              suffix="XAF"
              valueStyle={{ color: '#722ed1' }}
            />
          </Col>
        </Row>

        {/* Performance Alert */}
        <Alert
          message="Supplier Network Health"
          description={`Average supplier rating: ${stats.averageRating}/5.0 • ${stats.highPerformers} high-performing suppliers in your network`}
          type="success"
          showIcon
          style={{ marginBottom: '24px' }}
        />

        {/* Tabs */}
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <Tabs.TabPane 
            tab={
              <Badge count={stats.total} size="small">
                <span>All Suppliers ({stats.total})</span>
              </Badge>
            } 
            key="all"
          />
          <Tabs.TabPane 
            tab={
              <Badge count={stats.active} size="small">
                <span><CheckCircleOutlined /> Active ({stats.active})</span>
              </Badge>
            } 
            key="active"
          />
          <Tabs.TabPane 
            tab={
              <Badge count={stats.highPerformers} size="small">
                <span><StarOutlined /> High Performers ({stats.highPerformers})</span>
              </Badge>
            } 
            key="high_performers"
          />
          <Tabs.TabPane 
            tab={
              <span><CalendarOutlined /> Recent Activity</span>
            } 
            key="recent"
          />
        </Tabs>

        <Table
          columns={columns}
          dataSource={getFilteredSuppliers()}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} suppliers`
          }}
          scroll={{ x: 'max-content' }}
        />
      </Card>

      {/* Supplier Details Drawer */}
      <Drawer
        title={
          <Space>
            <ContactsOutlined />
            Supplier Profile - {selectedSupplier?.name}
          </Space>
        }
        placement="right"
        width={900}
        open={detailDrawerVisible}
        onClose={() => setDetailDrawerVisible(false)}
      >
        {selectedSupplier && (
          <div>
            {/* Supplier Overview */}
            <Card size="small" title="Supplier Information" style={{ marginBottom: '16px' }}>
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Descriptions column={1} size="small">
                    <Descriptions.Item label="Company Name">
                      {selectedSupplier.name}
                    </Descriptions.Item>
                    <Descriptions.Item label="Address">
                      {selectedSupplier.address}
                    </Descriptions.Item>
                    <Descriptions.Item label="Email">
                      <MailOutlined /> {selectedSupplier.email}
                    </Descriptions.Item>
                    <Descriptions.Item label="Phone">
                      <PhoneOutlined /> {selectedSupplier.phone}
                    </Descriptions.Item>
                    <Descriptions.Item label="Website">
                      <GlobalOutlined /> {selectedSupplier.website}
                    </Descriptions.Item>
                    <Descriptions.Item label="Status">
                      {getStatusTag(selectedSupplier.status)}
                    </Descriptions.Item>
                  </Descriptions>
                </Col>
                <Col span={12}>
                  <Descriptions column={1} size="small">
                    <Descriptions.Item label="Partner Since">
                      {moment(selectedSupplier.joinDate).format('MMM DD, YYYY')}
                    </Descriptions.Item>
                    <Descriptions.Item label="Last Transaction">
                      {moment(selectedSupplier.lastTransaction).format('MMM DD, YYYY')}
                    </Descriptions.Item>
                    <Descriptions.Item label="Total Orders">
                      {selectedSupplier.totalOrders}
                    </Descriptions.Item>
                    <Descriptions.Item label="Total Value">
                      XAF {selectedSupplier.totalValue.toLocaleString()}
                    </Descriptions.Item>
                    <Descriptions.Item label="Payment Terms">
                      <Space wrap>
                        {selectedSupplier.paymentTerms.map(term => (
                          <Tag key={term}>{term}</Tag>
                        ))}
                      </Space>
                    </Descriptions.Item>
                    <Descriptions.Item label="Delivery Capacity">
                      <TruckOutlined /> {selectedSupplier.deliveryCapacity}
                    </Descriptions.Item>
                  </Descriptions>
                </Col>
              </Row>
            </Card>

            {/* Categories and Certifications */}
            <Row gutter={[16, 16]} style={{ marginBottom: '16px' }}>
              <Col span={12}>
                <Card size="small" title="Specializations">
                  <Space wrap>
                    {selectedSupplier.category.map(cat => (
                      <Tag key={cat} color="blue">{cat}</Tag>
                    ))}
                  </Space>
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small" title="Certifications">
                  <Space wrap>
                    {selectedSupplier.certifications.map(cert => (
                      <Tag key={cert} color="gold" icon={<SafetyCertificateOutlined />}>
                        {cert}
                      </Tag>
                    ))}
                  </Space>
                </Card>
              </Col>
            </Row>

            {/* Performance Metrics */}
            <Card size="small" title="Performance Dashboard" style={{ marginBottom: '16px' }}>
              <Row gutter={[16, 16]}>
                <Col span={6}>
                  <Statistic
                    title="Overall Rating"
                    value={selectedSupplier.rating}
                    suffix="/5.0"
                    valueStyle={{ color: getPerformanceColor(selectedSupplier.rating, 'rating') }}
                  />
                  <Rate disabled allowHalf value={selectedSupplier.rating} style={{ fontSize: '14px' }} />
                </Col>
                <Col span={6}>
                  <Statistic
                    title="Quality Rating"
                    value={selectedSupplier.qualityRating}
                    suffix="/5.0"
                    valueStyle={{ color: getPerformanceColor(selectedSupplier.qualityRating, 'rating') }}
                  />
                  <Rate disabled allowHalf value={selectedSupplier.qualityRating} style={{ fontSize: '14px' }} />
                </Col>
                <Col span={6}>
                  <Statistic
                    title="On-Time Delivery"
                    value={selectedSupplier.onTimeDelivery}
                    suffix="%"
                    valueStyle={{ color: getPerformanceColor(selectedSupplier.onTimeDelivery) }}
                  />
                  <Progress percent={selectedSupplier.onTimeDelivery} size="small" showInfo={false} />
                </Col>
                <Col span={6}>
                  <Statistic
                    title="Cost Competitiveness"
                    value={selectedSupplier.costCompetitiveness}
                    suffix="/5.0"
                    valueStyle={{ color: getPerformanceColor(selectedSupplier.costCompetitiveness, 'rating') }}
                  />
                  <Rate disabled allowHalf value={selectedSupplier.costCompetitiveness} style={{ fontSize: '14px' }} />
                </Col>
              </Row>
              
              <Divider />
              
              <Row gutter={[16, 16]}>
                <Col span={6}>
                  <Statistic
                    title="Avg Delivery Time"
                    value={selectedSupplier.performanceMetrics.averageDeliveryTime}
                    suffix="days"
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Col>
                <Col span={6}>
                  <Statistic
                    title="Order Fulfillment"
                    value={selectedSupplier.performanceMetrics.orderFulfillmentRate}
                    suffix="%"
                    valueStyle={{ color: getPerformanceColor(selectedSupplier.performanceMetrics.orderFulfillmentRate) }}
                  />
                </Col>
                <Col span={6}>
                  <Statistic
                    title="Defect Rate"
                    value={selectedSupplier.performanceMetrics.defectRate}
                    suffix="%"
                    valueStyle={{ color: selectedSupplier.performanceMetrics.defectRate <= 2 ? '#52c41a' : '#ff4d4f' }}
                  />
                </Col>
                <Col span={6}>
                  <Statistic
                    title="Cost Savings"
                    value={selectedSupplier.performanceMetrics.costSavings}
                    suffix="%"
                    prefix={<RiseOutlined />}
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Col>
              </Row>
            </Card>

            {/* Recent Activity */}
            <Row gutter={[16, 16]} style={{ marginBottom: '16px' }}>
              <Col span={12}>
                <Card size="small" title="Recent Activity">
                  <Timeline size="small">
                    {selectedSupplier.recentActivity.map((activity, index) => (
                      <Timeline.Item key={index}>
                        <Text strong>{activity.description}</Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          {moment(activity.date).fromNow()}
                        </Text>
                      </Timeline.Item>
                    ))}
                  </Timeline>
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small" title="Communication History">
                  <List
                    size="small"
                    dataSource={selectedSupplier.contactHistory}
                    renderItem={contact => (
                      <List.Item>
                        <List.Item.Meta
                          avatar={
                            <Avatar 
                              icon={contact.type === 'email' ? <MailOutlined /> : <PhoneOutlined />} 
                              size="small"
                            />
                          }
                          title={<Text style={{ fontSize: '13px' }}>{contact.subject}</Text>}
                          description={
                            <Text type="secondary" style={{ fontSize: '11px' }}>
                              {contact.direction === 'sent' || contact.direction === 'outgoing' ? 'Sent' : 'Received'} • {moment(contact.date).format('MMM DD, HH:mm')}
                            </Text>
                          }
                        />
                      </List.Item>
                    )}
                  />
                </Card>
              </Col>
            </Row>

            {/* Action Buttons */}
            <Space style={{ marginTop: '16px' }}>
              <Button 
                type="primary" 
                icon={<MessageOutlined />}
                onClick={() => {
                  setDetailDrawerVisible(false);
                  handleSendMessage(selectedSupplier);
                }}
              >
                Send Message
              </Button>
              <Button 
                icon={<StarOutlined />}
                onClick={() => {
                  setDetailDrawerVisible(false);
                  handleRateSupplier(selectedSupplier);
                }}
              >
                Update Rating
              </Button>
              <Button icon={<FileTextOutlined />}>
                View Contracts
              </Button>
              <Button icon={<ShoppingCartOutlined />}>
                Order History
              </Button>
              <Button icon={<BarChartOutlined />}>
                Performance Report
              </Button>
            </Space>
          </div>
        )}
      </Drawer>

      {/* Communication Modal */}
      <Modal
        title={`Send Message to ${selectedSupplier?.name}`}
        open={communicationModalVisible}
        onOk={handleSubmitCommunication}
        onCancel={() => setCommunicationModalVisible(false)}
        confirmLoading={loading}
        width={600}
      >
        <Form form={communicationForm} layout="vertical">
          <Form.Item
            name="subject"
            label="Subject"
            rules={[{ required: true, message: 'Please enter subject' }]}
          >
            <Input placeholder="Enter message subject..." />
          </Form.Item>
          
          <Form.Item
            name="priority"
            label="Priority"
            rules={[{ required: true, message: 'Please select priority' }]}
          >
            <Select placeholder="Select priority">
              <Option value="low">Low</Option>
              <Option value="medium">Medium</Option>
              <Option value="high">High</Option>
              <Option value="urgent">Urgent</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="message"
            label="Message"
            rules={[{ required: true, message: 'Please enter message' }]}
          >
            <TextArea
              rows={6}
              placeholder="Type your message..."
              showCount
              maxLength={1000}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Rating Modal */}
      <Modal
        title={`Rate Supplier - ${selectedSupplier?.name}`}
        open={ratingModalVisible}
        onOk={handleSubmitRating}
        onCancel={() => setRatingModalVisible(false)}
        confirmLoading={loading}
        width={500}
      >
        <Form form={ratingForm} layout="vertical">
          <Form.Item
            name="overallRating"
            label="Overall Rating"
            rules={[{ required: true, message: 'Please provide overall rating' }]}
          >
            <Rate allowHalf />
          </Form.Item>
          
          <Form.Item
            name="qualityRating"
            label="Quality Rating"
            rules={[{ required: true, message: 'Please rate quality' }]}
          >
            <Rate allowHalf />
          </Form.Item>
          
          <Form.Item
            name="costRating"
            label="Cost Competitiveness"
            rules={[{ required: true, message: 'Please rate cost competitiveness' }]}
          >
            <Rate allowHalf />
          </Form.Item>
          
          <Form.Item
            name="deliveryRating"
            label="Delivery Performance"
            rules={[{ required: true, message: 'Please rate delivery performance' }]}
          >
            <Rate allowHalf />
          </Form.Item>

          <Form.Item
            name="notes"
            label="Rating Notes"
            rules={[{ required: true, message: 'Please add rating notes' }]}
          >
            <TextArea
              rows={4}
              placeholder="Add notes about supplier performance, areas for improvement, etc..."
              showCount
              maxLength={500}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default BuyerSupplierManagement;