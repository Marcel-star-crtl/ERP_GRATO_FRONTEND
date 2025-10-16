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
  Input,
  Select,
  Rate,
  Progress,
  Tabs,
  Badge,
  message,
  Tooltip,
  Descriptions,
  Drawer,
  Spin,
  Empty
} from 'antd';
import {
  TeamOutlined,
  StarOutlined,
  PhoneOutlined,
  MailOutlined,
  GlobalOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  BarChartOutlined,
  MessageOutlined,
  EyeOutlined,
  ContactsOutlined,
  SafetyCertificateOutlined,
  ShoppingCartOutlined,
  FileTextOutlined,
  RiseOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import moment from 'moment';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const BuyerSupplierManagement = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false);
  const [communicationModalVisible, setCommunicationModalVisible] = useState(false);
  const [ratingModalVisible, setRatingModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [sortBy, setSortBy] = useState('rating');
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

  // Communication form state
  const [commSubject, setCommSubject] = useState('');
  const [commPriority, setCommPriority] = useState('medium');
  const [commMessage, setCommMessage] = useState('');

  // Rating form state
  const [overallRating, setOverallRating] = useState(0);
  const [qualityRating, setQualityRating] = useState(0);
  const [costRating, setCostRating] = useState(0);
  const [deliveryRating, setDeliveryRating] = useState(0);
  const [ratingNotes, setRatingNotes] = useState('');

  useEffect(() => {
    loadSuppliers();
  }, [activeTab, searchQuery, categoryFilter, sortBy, pagination.current]);

  const loadSuppliers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const queryParams = new URLSearchParams({
        page: pagination.current,
        limit: pagination.pageSize,
        sortBy: sortBy
      });

      if (searchQuery) queryParams.append('search', searchQuery);
      if (categoryFilter) queryParams.append('category', categoryFilter);

      const response = await fetch(
        `${API_BASE_URL}/buyer/suppliers?${queryParams}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) throw new Error('Failed to fetch suppliers');

      const result = await response.json();

      if (result.success) {
        setSuppliers(result.data);
        setPagination(prev => ({ ...prev, total: result.pagination.totalRecords }));
      } else {
        message.error(result.message || 'Failed to load suppliers');
      }
    } catch (error) {
      console.error('Load suppliers error:', error);
      message.error('Failed to load suppliers. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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

  const handleViewDetails = async (supplier) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const response = await fetch(
        `${API_BASE_URL}/buyer/suppliers/${supplier.id}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) throw new Error('Failed to fetch supplier details');

      const result = await response.json();

      if (result.success) {
        setSelectedSupplier(result.data);
        setDetailDrawerVisible(true);
      } else {
        message.error(result.message || 'Failed to load supplier details');
      }
    } catch (error) {
      console.error('Load supplier details error:', error);
      message.error('Failed to load supplier details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = (supplier) => {
    setSelectedSupplier(supplier);
    setCommSubject('');
    setCommPriority('medium');
    setCommMessage('');
    setCommunicationModalVisible(true);
  };

  const handleRateSupplier = (supplier) => {
    setSelectedSupplier(supplier);
    setOverallRating(supplier.rating || 0);
    setQualityRating(supplier.qualityRating || 0);
    setCostRating(supplier.priceCompetitiveness === 'High' ? 5 : supplier.priceCompetitiveness === 'Medium' ? 3 : 2);
    setDeliveryRating(supplier.reliability === 'Excellent' ? 5 : supplier.reliability === 'Good' ? 4 : 3);
    setRatingNotes('');
    setRatingModalVisible(true);
  };

  const handleSubmitCommunication = async () => {
    if (!commSubject || !commMessage) {
      message.error('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const response = await fetch(
        `${API_BASE_URL}/buyer/suppliers/${selectedSupplier.id}/message`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            subject: commSubject,
            priority: commPriority,
            message: commMessage
          })
        }
      );

      if (!response.ok) throw new Error('Failed to send message');

      const result = await response.json();

      if (result.success) {
        message.success(`Message sent to ${selectedSupplier.name} successfully!`);
        setCommunicationModalVisible(false);
      } else {
        message.error(result.message || 'Failed to send message');
      }
    } catch (error) {
      console.error('Send message error:', error);
      message.error('Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitRating = async () => {
    if (!overallRating || !qualityRating || !costRating || !deliveryRating || !ratingNotes) {
      message.error('Please provide all ratings and notes');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const response = await fetch(
        `${API_BASE_URL}/buyer/suppliers/${selectedSupplier.id}/rate`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            overallRating,
            qualityRating,
            costRating,
            deliveryRating,
            notes: ratingNotes
          })
        }
      );

      if (!response.ok) throw new Error('Failed to rate supplier');

      const result = await response.json();

      if (result.success) {
        message.success('Supplier rated successfully!');
        setRatingModalVisible(false);
        loadSuppliers();
      } else {
        message.error(result.message || 'Failed to rate supplier');
      }
    } catch (error) {
      console.error('Rate supplier error:', error);
      message.error('Failed to rate supplier. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getFilteredSuppliers = () => {
    let filtered = suppliers;

    switch (activeTab) {
      case 'active':
        filtered = suppliers.filter(s => s.status === 'active');
        break;
      case 'high_performers':
        filtered = suppliers.filter(s => s.rating >= 4.5 && s.completionRate >= 90);
        break;
      case 'recent':
        filtered = suppliers.filter(s => {
          if (!s.lastTransaction) return false;
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          return new Date(s.lastTransaction) > thirtyDaysAgo;
        });
        break;
      default:
        filtered = suppliers;
    }

    return filtered;
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
            {record.specialization && record.specialization.slice(0, 2).map(cat => (
              <Tag key={cat} size="small" color="blue">{cat}</Tag>
            ))}
            {record.specialization && record.specialization.length > 2 && (
              <Tag size="small">+{record.specialization.length - 2}</Tag>
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
            <Rate disabled allowHalf value={record.rating} style={{ fontSize: '14px' }} />
          </div>
          <Text strong style={{ color: getPerformanceColor(record.rating, 'rating') }}>
            {record.rating}/5.0
          </Text>
          <div style={{ marginTop: '4px', fontSize: '12px' }}>
            <Text type="secondary">{record.totalOrders} orders</Text>
          </div>
        </div>
      ),
      width: 120,
      sorter: (a, b) => a.rating - b.rating
    },
    {
      title: 'Reliability',
      key: 'reliability',
      render: (_, record) => (
        <div style={{ textAlign: 'center' }}>
          <Progress 
            type="circle" 
            percent={record.completionRate} 
            width={50}
            strokeColor={getPerformanceColor(record.completionRate)}
            format={percent => `${percent}%`}
          />
          <div style={{ marginTop: '4px', fontSize: '12px' }}>
            <Text type="secondary">{record.reliability}</Text>
          </div>
        </div>
      ),
      width: 100
    },
    {
      title: 'Pricing',
      key: 'pricing',
      render: (_, record) => {
        const priceColor = 
          record.priceCompetitiveness === 'High' ? '#52c41a' :
          record.priceCompetitiveness === 'Medium' ? '#faad14' : '#ff4d4f';
        
        return (
          <div style={{ textAlign: 'center' }}>
            <Tag color={priceColor}>{record.priceCompetitiveness}</Tag>
            <br />
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {record.deliveryCapacity}
            </Text>
          </div>
        );
      },
      width: 120
    },
    {
      title: 'Last Transaction',
      key: 'lastTransaction',
      render: (_, record) => (
        <div>
          {record.lastTransaction ? (
            <>
              <CalendarOutlined /> {moment(record.lastTransaction).format('MMM DD')}
              <br />
              <Text type="secondary" style={{ fontSize: '12px' }}>
                {moment(record.lastTransaction).fromNow()}
              </Text>
            </>
          ) : (
            <Text type="secondary">No transactions</Text>
          )}
        </div>
      ),
      width: 120
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="View Details">
            <Button size="small" icon={<EyeOutlined />} onClick={() => handleViewDetails(record)} />
          </Tooltip>
          <Tooltip title="Send Message">
            <Button size="small" icon={<MessageOutlined />} onClick={() => handleSendMessage(record)} />
          </Tooltip>
          <Tooltip title="Rate Supplier">
            <Button size="small" icon={<StarOutlined />} onClick={() => handleRateSupplier(record)} />
          </Tooltip>
        </Space>
      ),
      width: 120,
      fixed: 'right'
    }
  ];

  const filteredSuppliers = getFilteredSuppliers();
  const stats = {
    total: suppliers.length,
    active: suppliers.filter(s => s.status === 'active').length,
    highPerformers: suppliers.filter(s => s.rating >= 4.5 && s.completionRate >= 90).length,
    averageRating: suppliers.length > 0 ? (suppliers.reduce((sum, s) => sum + s.rating, 0) / suppliers.length).toFixed(1) : 0
  };

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <Title level={2} style={{ margin: 0 }}>
            <ContactsOutlined /> Supplier Relationship Management
          </Title>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={loadSuppliers} loading={loading}>
              Refresh
            </Button>
            <Button icon={<BarChartOutlined />}>Performance Report</Button>
          </Space>
        </div>

        <Row gutter={16} style={{ marginBottom: '24px' }}>
          <Col span={6}>
            <Statistic title="Total Suppliers" value={stats.total} prefix={<TeamOutlined />} valueStyle={{ color: '#1890ff' }} />
          </Col>
          <Col span={6}>
            <Statistic title="Active Suppliers" value={stats.active} prefix={<CheckCircleOutlined />} valueStyle={{ color: '#52c41a' }} />
          </Col>
          <Col span={6}>
            <Statistic title="High Performers" value={stats.highPerformers} prefix={<StarOutlined />} valueStyle={{ color: '#faad14' }} />
          </Col>
          <Col span={6}>
            <Statistic title="Avg. Rating" value={stats.averageRating} suffix="/ 5.0" prefix={<RiseOutlined />} valueStyle={{ color: '#722ed1' }} />
          </Col>
        </Row>

        <Space style={{ marginBottom: '16px', width: '100%' }} direction="vertical">
          <Space>
            <Input.Search
              placeholder="Search suppliers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onSearch={loadSuppliers}
              style={{ width: 300 }}
              allowClear
            />
            <Select
              placeholder="Filter by category"
              value={categoryFilter}
              onChange={setCategoryFilter}
              style={{ width: 200 }}
              allowClear
            >
              <Option value="">All Categories</Option>
              <Option value="IT Equipment">IT Equipment</Option>
              <Option value="Office Supplies">Office Supplies</Option>
              <Option value="Furniture">Furniture</Option>
            </Select>
            <Select
              placeholder="Sort by"
              value={sortBy}
              onChange={setSortBy}
              style={{ width: 150 }}
            >
              <Option value="rating">Rating</Option>
              <Option value="name">Name</Option>
              <Option value="recent">Recent</Option>
              <Option value="reliability">Reliability</Option>
            </Select>
          </Space>
        </Space>

        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <Tabs.TabPane tab={<Badge count={stats.total} size="small"><span>All Suppliers ({stats.total})</span></Badge>} key="all" />
          <Tabs.TabPane tab={<Badge count={stats.active} size="small"><span><CheckCircleOutlined /> Active ({stats.active})</span></Badge>} key="active" />
          <Tabs.TabPane tab={<Badge count={stats.highPerformers} size="small"><span><StarOutlined /> High Performers ({stats.highPerformers})</span></Badge>} key="high_performers" />
          <Tabs.TabPane tab={<span><CalendarOutlined /> Recent Activity</span>} key="recent" />
        </Tabs>

        <Table
          columns={columns}
          dataSource={filteredSuppliers}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            onChange: (page, pageSize) => setPagination({ ...pagination, current: page, pageSize }),
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} suppliers`
          }}
          scroll={{ x: 'max-content' }}
          locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No suppliers found" /> }}
        />
      </Card>

      <Drawer
        title={<Space><ContactsOutlined /> Supplier Profile - {selectedSupplier?.name}</Space>}
        placement="right"
        width={900}
        open={detailDrawerVisible}
        onClose={() => setDetailDrawerVisible(false)}
      >
        {selectedSupplier && (
          <div>
            <Card size="small" title="Supplier Information" style={{ marginBottom: '16px' }}>
              <Descriptions column={2} size="small">
                <Descriptions.Item label="Company Name">{selectedSupplier.name}</Descriptions.Item>
                <Descriptions.Item label="Email"><MailOutlined /> {selectedSupplier.email}</Descriptions.Item>
                <Descriptions.Item label="Phone"><PhoneOutlined /> {selectedSupplier.phone}</Descriptions.Item>
                <Descriptions.Item label="Address">{selectedSupplier.address}</Descriptions.Item>
                {selectedSupplier.website && (
                  <Descriptions.Item label="Website"><GlobalOutlined /> {selectedSupplier.website}</Descriptions.Item>
                )}
                <Descriptions.Item label="Rating">
                  <Rate disabled allowHalf value={selectedSupplier.rating} style={{ fontSize: '14px' }} />
                </Descriptions.Item>
              </Descriptions>
            </Card>

            <Row gutter={[16, 16]} style={{ marginBottom: '16px' }}>
              <Col span={12}>
                <Card size="small" title="Specializations">
                  <Space wrap>
                    {selectedSupplier.specialization?.map(cat => (
                      <Tag key={cat} color="blue">{cat}</Tag>
                    ))}
                  </Space>
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small" title="Certifications">
                  <Space wrap>
                    {selectedSupplier.certifications?.length > 0 ? (
                      selectedSupplier.certifications.map(cert => (
                        <Tag key={cert} color="gold" icon={<SafetyCertificateOutlined />}>{cert}</Tag>
                      ))
                    ) : (
                      <Text type="secondary">No certifications</Text>
                    )}
                  </Space>
                </Card>
              </Col>
            </Row>

            <Card size="small" title="Performance Metrics" style={{ marginBottom: '16px' }}>
              <Row gutter={[16, 16]}>
                <Col span={6}>
                  <Statistic
                    title="Overall Rating"
                    value={selectedSupplier.rating}
                    suffix="/5.0"
                    valueStyle={{ color: getPerformanceColor(selectedSupplier.rating, 'rating') }}
                  />
                </Col>
                <Col span={6}>
                  <Statistic
                    title="Completion Rate"
                    value={selectedSupplier.completionRate}
                    suffix="%"
                    valueStyle={{ color: getPerformanceColor(selectedSupplier.completionRate) }}
                  />
                </Col>
                <Col span={6}>
                  <Statistic title="Total Orders" value={selectedSupplier.totalOrders} prefix={<ShoppingCartOutlined />} />
                </Col>
                <Col span={6}>
                  <Statistic
                    title="Reliability"
                    value={selectedSupplier.reliability}
                    valueStyle={{ color: selectedSupplier.reliability === 'Excellent' ? '#52c41a' : '#faad14' }}
                  />
                </Col>
              </Row>
            </Card>

            <Space style={{ marginTop: '16px' }}>
              <Button type="primary" icon={<MessageOutlined />} onClick={() => { setDetailDrawerVisible(false); handleSendMessage(selectedSupplier); }}>
                Send Message
              </Button>
              <Button icon={<StarOutlined />} onClick={() => { setDetailDrawerVisible(false); handleRateSupplier(selectedSupplier); }}>
                Update Rating
              </Button>
              <Button icon={<FileTextOutlined />}>View History</Button>
            </Space>
          </div>
        )}
      </Drawer>

      <Modal
        title={`Send Message to ${selectedSupplier?.name}`}
        open={communicationModalVisible}
        onOk={handleSubmitCommunication}
        onCancel={() => setCommunicationModalVisible(false)}
        confirmLoading={loading}
        width={600}
      >
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Subject *</label>
          <Input placeholder="Enter message subject..." value={commSubject} onChange={(e) => setCommSubject(e.target.value)} />
        </div>
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Priority *</label>
          <Select value={commPriority} onChange={setCommPriority} style={{ width: '100%' }}>
            <Option value="low">Low</Option>
            <Option value="medium">Medium</Option>
            <Option value="high">High</Option>
            <Option value="urgent">Urgent</Option>
          </Select>
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Message *</label>
          <TextArea rows={6} placeholder="Type your message..." value={commMessage} onChange={(e) => setCommMessage(e.target.value)} showCount maxLength={1000} />
        </div>
      </Modal>

      <Modal
        title={`Rate Supplier - ${selectedSupplier?.name}`}
        open={ratingModalVisible}
        onOk={handleSubmitRating}
        onCancel={() => setRatingModalVisible(false)}
        confirmLoading={loading}
        width={500}
      >
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Overall Rating *</label>
          <Rate allowHalf value={overallRating} onChange={setOverallRating} />
        </div>
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Quality Rating *</label>
          <Rate allowHalf value={qualityRating} onChange={setQualityRating} />
        </div>
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Cost Competitiveness *</label>
          <Rate allowHalf value={costRating} onChange={setCostRating} />
        </div>
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Delivery Performance *</label>
          <Rate allowHalf value={deliveryRating} onChange={setDeliveryRating} />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Rating Notes *</label>
          <TextArea
            rows={4}
            placeholder="Add notes about supplier performance, areas for improvement, etc..."
            value={ratingNotes}
            onChange={(e) => setRatingNotes(e.target.value)}
            showCount
            maxLength={500}
          />
        </div>
      </Modal>
    </div>
  );
};

export default BuyerSupplierManagement;






