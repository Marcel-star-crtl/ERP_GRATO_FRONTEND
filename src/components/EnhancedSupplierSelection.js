import React, { useState, useEffect } from 'react';
import {
  Modal,
  Table,
  Button,
  Input,
  Select,
  Tag,
  Space,
  Card,
  Row,
  Col,
  Checkbox,
  Form,
  Divider,
  Alert,
  Typography,
  Tooltip,
  message,
  Tabs,
  List,
  Avatar,
  Rate,
  Badge,
  Popover
} from 'antd';
import {
  SearchOutlined,
  UserAddOutlined,
  MailOutlined,
  PhoneOutlined,
  StarOutlined,
  CheckCircleOutlined,
  PlusOutlined,
  DeleteOutlined,
  InfoCircleOutlined,
  TeamOutlined,
  GlobalOutlined,
  SendOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';

const { Option } = Select;
const { Text, Title } = Typography;
const { TabPane } = Tabs;

const EnhancedSupplierSelection = ({ visible, onCancel, onConfirm, loading, category }) => {
  const [registeredSuppliers, setRegisteredSuppliers] = useState([]);
  const [selectedSuppliers, setSelectedSuppliers] = useState([]);
  const [externalEmails, setExternalEmails] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [sortBy, setSortBy] = useState('rating');
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);
  const [activeTab, setActiveTab] = useState('registered');
  const [form] = Form.useForm();

  useEffect(() => {
    if (visible) {
      loadRegisteredSuppliers();
    }
  }, [visible, category, searchText, sortBy]);

  const loadRegisteredSuppliers = async () => {
    try {
      setLoadingSuppliers(true);
      
      const params = new URLSearchParams({
        page: 1,
        limit: 50,
        sortBy: sortBy
      });
      
      if (category) params.append('category', category);
      if (searchText) params.append('search', searchText);
      
      const response = await fetch(`/api/buyer/suppliers?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const result = await response.json();
      
      if (result.success) {
        setRegisteredSuppliers(result.data);
      } else {
        message.error('Failed to load suppliers');
      }
    } catch (error) {
      console.error('Error loading suppliers:', error);
      message.error('Failed to load suppliers');
    } finally {
      setLoadingSuppliers(false);
    }
  };

  const handleSupplierSelect = (supplier, checked) => {
    if (checked) {
      setSelectedSuppliers([...selectedSuppliers, supplier]);
    } else {
      setSelectedSuppliers(selectedSuppliers.filter(s => s.id !== supplier.id));
    }
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleAddExternalEmail = (values) => {
    const { email, companyName } = values;
    
    // Validate email format
    if (!validateEmail(email)) {
      message.error('Please enter a valid email address');
      return;
    }
    
    // Check if email already exists in external list
    const existsInExternal = externalEmails.some(ext => ext.email.toLowerCase() === email.toLowerCase());
    if (existsInExternal) {
      message.error('This email is already in your external supplier list');
      return;
    }
    
    // Check if email already exists in registered suppliers
    const existsInRegistered = registeredSuppliers.some(sup => sup.email.toLowerCase() === email.toLowerCase());
    if (existsInRegistered) {
      message.warning('This email belongs to a registered supplier. They will be automatically included in registered suppliers section.');
      return;
    }
    
    // Add to external suppliers list
    setExternalEmails([...externalEmails, { 
      email: email.toLowerCase(), 
      companyName: companyName || 'External Supplier',
      id: `ext_${Date.now()}` // Temporary ID for frontend handling
    }]);
    
    form.resetFields();
    message.success('External supplier added successfully');
  };

  const handleRemoveExternalEmail = (email) => {
    setExternalEmails(externalEmails.filter(ext => ext.email !== email));
    message.success('External supplier removed');
  };

  const getTotalSuppliersCount = () => {
    return selectedSuppliers.length + externalEmails.length;
  };

  const handleConfirm = () => {
    const totalSuppliers = getTotalSuppliersCount();
    
    if (totalSuppliers === 0) {
      message.error('Please select at least one registered supplier or add an external supplier email');
      return;
    }

    // Prepare data for backend
    const supplierData = {
      selectedSuppliers: selectedSuppliers.map(s => s.id),
      externalSupplierEmails: externalEmails.map(ext => ({
        email: ext.email,
        companyName: ext.companyName
      }))
    };

    console.log('Confirming supplier selection:', supplierData);
    onConfirm(supplierData);
  };

  const supplierColumns = [
    {
      title: 'Select',
      key: 'select',
      width: 60,
      render: (_, record) => (
        <Checkbox
          checked={selectedSuppliers.some(s => s.id === record.id)}
          onChange={(e) => handleSupplierSelect(record, e.target.checked)}
        />
      )
    },
    {
      title: 'Supplier Details',
      key: 'supplier',
      render: (_, record) => (
        <Space direction="vertical" size="small">
          <div>
            <Text strong style={{ fontSize: '14px' }}>{record.name}</Text>
            {record.rating && (
              <div style={{ marginTop: '2px' }}>
                <Rate disabled defaultValue={record.rating} size="small" />
                <Text type="secondary" style={{ marginLeft: '8px', fontSize: '12px' }}>
                  {record.rating}/5
                </Text>
              </div>
            )}
          </div>
          <Space size="small">
            <MailOutlined style={{ color: '#1890ff' }} />
            <Text type="secondary" style={{ fontSize: '12px' }}>{record.email}</Text>
          </Space>
          {record.phone && (
            <Space size="small">
              <PhoneOutlined style={{ color: '#1890ff' }} />
              <Text type="secondary" style={{ fontSize: '12px' }}>{record.phone}</Text>
            </Space>
          )}
        </Space>
      ),
      width: 280
    },
    {
      title: 'Performance',
      key: 'performance',
      render: (_, record) => (
        <Space direction="vertical" size="small">
          <Tag color={record.reliability === 'Excellent' ? 'green' : 
                     record.reliability === 'Good' ? 'blue' : 
                     record.reliability === 'Average' ? 'orange' : 'red'}>
            {record.reliability || 'Not Rated'}
          </Tag>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.totalOrders || 0} orders
          </Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.completionRate || 0}% completion
          </Text>
        </Space>
      ),
      width: 120
    },
    {
      title: 'Categories',
      dataIndex: 'specialization',
      key: 'specialization',
      render: (categories) => (
        <div>
          {(categories || []).slice(0, 2).map(cat => (
            <Tag key={cat} size="small" color="blue">{cat}</Tag>
          ))}
          {categories && categories.length > 2 && (
            <Popover 
              content={
                <div>
                  {categories.slice(2).map(cat => (
                    <Tag key={cat} size="small" color="blue" style={{ margin: '2px' }}>
                      {cat}
                    </Tag>
                  ))}
                </div>
              }
              title="Additional Categories"
            >
              <Tag size="small" color="default" style={{ cursor: 'pointer' }}>
                +{categories.length - 2} more
              </Tag>
            </Popover>
          )}
        </div>
      ),
      width: 150
    }
  ];

  return (
    <Modal
      title={
        <div>
          <TeamOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
          Select Suppliers for RFQ
        </div>
      }
      open={visible}
      onCancel={onCancel}
      onOk={handleConfirm}
      okText={`Send RFQ to ${getTotalSuppliersCount()} Supplier(s)`}
      cancelText="Cancel"
      width={1200}
      confirmLoading={loading}
      okButtonProps={{
        disabled: getTotalSuppliersCount() === 0,
        icon: <SendOutlined />
      }}
      styles={{
        body: { padding: '16px' }
      }}
    >
      <Alert
        message="Supplier Selection"
        description={`Select registered suppliers and/or add external supplier emails. You can invite both registered suppliers (who have accounts) and external suppliers (who will receive invitation links to submit quotes).`}
        type="info"
        showIcon
        style={{ marginBottom: '16px' }}
      />

      <Tabs 
        activeKey={activeTab} 
        onChange={setActiveTab}
        items={[
          {
            key: 'registered',
            label: (
              <Space>
                <TeamOutlined />
                Registered Suppliers
                {selectedSuppliers.length > 0 && (
                  <Badge count={selectedSuppliers.length} size="small" />
                )}
              </Space>
            ),
            children: (
              <div>
                {/* Search and Filter Controls */}
                <Row gutter={[16, 16]} style={{ marginBottom: '16px' }}>
                  <Col span={8}>
                    <Input
                      prefix={<SearchOutlined />}
                      placeholder="Search suppliers..."
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                      allowClear
                    />
                  </Col>
                  <Col span={6}>
                    <Select
                      style={{ width: '100%' }}
                      value={sortBy}
                      onChange={setSortBy}
                      placeholder="Sort by"
                    >
                      <Option value="rating">Rating</Option>
                      <Option value="name">Name</Option>
                      <Option value="recent">Recent Activity</Option>
                      <Option value="reliability">Reliability</Option>
                      <Option value="price">Price Competitiveness</Option>
                    </Select>
                  </Col>
                  <Col span={6}>
                    <Button 
                      onClick={loadRegisteredSuppliers}
                      loading={loadingSuppliers}
                      icon={<GlobalOutlined />}
                    >
                      Refresh
                    </Button>
                  </Col>
                  <Col span={4}>
                    <Text type="secondary">
                      {registeredSuppliers.length} suppliers found
                    </Text>
                  </Col>
                </Row>

                {/* Suppliers Table */}
                <Table
                  columns={supplierColumns}
                  dataSource={registeredSuppliers}
                  loading={loadingSuppliers}
                  rowKey="id"
                  pagination={{
                    pageSize: 10,
                    showSizeChanger: false,
                    showQuickJumper: true
                  }}
                  size="small"
                  scroll={{ y: 300 }}
                />

                {/* Selected Suppliers Summary */}
                {selectedSuppliers.length > 0 && (
                  <Card 
                    size="small" 
                    title={`Selected Suppliers (${selectedSuppliers.length})`}
                    style={{ marginTop: '16px' }}
                  >
                    <Space wrap>
                      {selectedSuppliers.map(supplier => (
                        <Tag 
                          key={supplier.id}
                          closable
                          onClose={() => handleSupplierSelect(supplier, false)}
                          color="blue"
                        >
                          {supplier.name}
                        </Tag>
                      ))}
                    </Space>
                  </Card>
                )}
              </div>
            )
          },
          {
            key: 'external',
            label: (
              <Space>
                <MailOutlined />
                External Suppliers
                {externalEmails.length > 0 && (
                  <Badge count={externalEmails.length} size="small" />
                )}
              </Space>
            ),
            children: (
              <div>
                <Alert
                  message="Add External Suppliers"
                  description="Add email addresses of suppliers who don't have accounts. They will receive invitation links to submit quotes directly without registering."
                  type="info"
                  showIcon
                  style={{ marginBottom: '16px' }}
                />

                {/* Add External Supplier Form */}
                <Card title="Add External Supplier" size="small" style={{ marginBottom: '16px' }}>
                  <Form
                    form={form}
                    layout="inline"
                    onFinish={handleAddExternalEmail}
                    style={{ width: '100%' }}
                  >
                    <Form.Item
                      name="email"
                      rules={[
                        { required: true, message: 'Email is required' },
                        { type: 'email', message: 'Please enter a valid email' }
                      ]}
                      style={{ flex: 1, minWidth: '200px' }}
                    >
                      <Input 
                        placeholder="supplier@company.com" 
                        prefix={<MailOutlined />}
                      />
                    </Form.Item>
                    <Form.Item
                      name="companyName"
                      rules={[
                        { required: true, message: 'Company name is required' }
                      ]}
                      style={{ flex: 1, minWidth: '150px' }}
                    >
                      <Input 
                        placeholder="Company Name"
                        prefix={<TeamOutlined />}
                      />
                    </Form.Item>
                    <Form.Item>
                      <Button 
                        type="primary" 
                        htmlType="submit"
                        icon={<PlusOutlined />}
                      >
                        Add
                      </Button>
                    </Form.Item>
                  </Form>
                </Card>

                {/* External Suppliers List */}
                {externalEmails.length > 0 ? (
                  <List
                    size="small"
                    bordered
                    dataSource={externalEmails}
                    renderItem={(item) => (
                      <List.Item
                        actions={[
                          <Button
                            type="link"
                            danger
                            size="small"
                            icon={<DeleteOutlined />}
                            onClick={() => handleRemoveExternalEmail(item.email)}
                          >
                            Remove
                          </Button>
                        ]}
                      >
                        <List.Item.Meta
                          avatar={
                            <Avatar 
                              style={{ backgroundColor: '#52c41a' }} 
                              icon={<MailOutlined />} 
                            />
                          }
                          title={item.companyName}
                          description={
                            <Space direction="vertical" size="small">
                              <Text type="secondary">
                                <MailOutlined style={{ marginRight: '4px' }} />
                                {item.email}
                              </Text>
                              <Text type="secondary" style={{ fontSize: '12px' }}>
                                <InfoCircleOutlined style={{ marginRight: '4px' }} />
                                Will receive invitation link to submit quote
                              </Text>
                            </Space>
                          }
                        />
                      </List.Item>
                    )}
                    style={{ maxHeight: '300px', overflowY: 'auto' }}
                  />
                ) : (
                  <Card style={{ textAlign: 'center', padding: '40px 0' }}>
                    <MailOutlined style={{ fontSize: '48px', color: '#d9d9d9' }} />
                    <Title level={4} type="secondary">
                      No external suppliers added yet
                    </Title>
                    <Text type="secondary">
                      Add supplier emails above to invite them to submit quotes
                    </Text>
                  </Card>
                )}
              </div>
            )
          }
        ]}
      />

      {/* Summary Card */}
      <Card 
        size="small" 
        style={{ 
          marginTop: '16px',
          background: getTotalSuppliersCount() > 0 ? '#f6ffed' : '#fafafa',
          border: getTotalSuppliersCount() > 0 ? '1px solid #b7eb8f' : '1px solid #d9d9d9'
        }}
      >
        <Row justify="space-between" align="middle">
          <Col>
            <Space>
              <Text strong style={{ color: '#52c41a' }}>
                <TeamOutlined style={{ marginRight: '8px' }} />
                Registered Suppliers: {selectedSuppliers.length}
              </Text>
              <Divider type="vertical" />
              <Text strong style={{ color: '#1890ff' }}>
                <MailOutlined style={{ marginRight: '8px' }} />
                External Suppliers: {externalEmails.length}
              </Text>
            </Space>
          </Col>
          <Col>
            <Text strong style={{ fontSize: '16px' }}>
              Total Suppliers to Invite: {getTotalSuppliersCount()}
            </Text>
          </Col>
        </Row>
        
        {getTotalSuppliersCount() === 0 && (
          <Alert
            message="No suppliers selected"
            description="Please select at least one registered supplier or add an external supplier email to proceed."
            type="warning"
            showIcon
            style={{ marginTop: '12px' }}
          />
        )}
      </Card>
    </Modal>
  );
};

export default EnhancedSupplierSelection;








