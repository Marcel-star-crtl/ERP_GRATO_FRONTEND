import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  Space,
  Typography,
  Tag,
  Alert,
  Row,
  Col,
  message,
  Empty,
  Tooltip
} from 'antd';
import {
  PlusOutlined,
  InfoCircleOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  SendOutlined
} from '@ant-design/icons';
import { itemAPI } from '../../services/itemAPI';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const EmployeeItemRequests = () => {
  const { user } = useSelector((state) => state.auth);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [form] = Form.useForm();

  const itemCategories = [
    'IT Accessories',
    'Office Supplies',
    'Equipment',
    'Consumables',
    'Software',
    'Hardware',
    'Furniture',
    'Safety Equipment',
    'Maintenance Supplies',
    'Other'
  ];

  const subcategories = {
    'IT Accessories': ['Input Devices', 'Displays', 'Storage Devices', 'Cables & Connectors', 'Other IT'],
    'Office Supplies': ['Paper Products', 'Writing Materials', 'Filing & Organization', 'Presentation Materials'],
    'Equipment': ['Audio/Visual', 'Computing Equipment', 'Telecommunication', 'Other Equipment'],
    'Hardware': ['Memory', 'Storage', 'Processors', 'Motherboards', 'Other Hardware'],
    'Consumables': ['Printer Supplies', 'Cleaning Supplies', 'Kitchen Supplies', 'Other Consumables'],
    'Software': ['Operating Systems', 'Applications', 'Utilities', 'Other Software'],
    'Furniture': ['Office Chairs', 'Desks', 'Storage', 'Meeting Room', 'Other Furniture'],
    'Safety Equipment': ['PPE', 'First Aid', 'Fire Safety', 'Other Safety'],
    'Maintenance Supplies': ['Cleaning', 'Repair Tools', 'Spare Parts', 'Other Maintenance'],
    'Other': ['Miscellaneous']
  };

  const measurementUnits = [
    'Pieces', 'Sets', 'Boxes', 'Packs', 'Units', 'Kg', 'Litres', 'Meters', 'Pairs', 'Each', 'Reams'
  ];

  // Track selected category for dynamic subcategory options
  const [selectedCategory, setSelectedCategory] = useState(null);

  useEffect(() => {
    fetchMyRequests();
  }, []);

  const fetchMyRequests = async () => {
    setLoading(true);
    try {
      // This would be a filtered API call for current user's requests
      const response = await itemAPI.getItemRequests();
      if (response.success) {
        // Filter by current user
        const myRequests = Array.isArray(response.data)
          ? response.data.filter(req => req.requestedBy === user?.fullName || req.requestedBy === user?.email)
          : [];
        setRequests(myRequests);
      } else {
        message.error(response.message);
      }
    } catch (error) {
      message.error('Failed to fetch your item requests');
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = (value) => {
    setSelectedCategory(value);
    // Clear subcategory when category changes
    form.setFieldsValue({ subcategory: undefined });
  };

  const handleSubmitRequest = async () => {
    try {
      const values = await form.validateFields();
      
      const requestData = {
        ...values,
        requestedBy: user?.fullName || user?.email,
        department: user?.department || '',
        requestDate: new Date().toISOString(),
        status: 'pending'
      };

      const response = await itemAPI.requestNewItem(requestData);
      
      if (response.success) {
        message.success('Item request submitted successfully! You will be notified when it is reviewed.');
        setShowRequestModal(false);
        form.resetFields();
        setSelectedCategory(null);
        fetchMyRequests();
      } else {
        message.error(response.message || 'Failed to submit item request');
      }
    } catch (error) {
      console.error('Request failed:', error);
      message.error('Failed to submit item request');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'orange',
      approved: 'blue',
      rejected: 'red',
      completed: 'green'
    };
    return colors[status] || 'default';
  };

  const getStatusIcon = (status) => {
    const icons = {
      pending: <ClockCircleOutlined />,
      approved: <CheckCircleOutlined />,
      rejected: <CloseCircleOutlined />,
      completed: <CheckCircleOutlined />
    };
    return icons[status] || <InfoCircleOutlined />;
  };

  const columns = [
    {
      title: 'Request ID',
      dataIndex: 'id',
      key: 'id',
      width: 100,
      render: (id) => <Text code>#{id}</Text>
    },
    {
      title: 'Item Description',
      dataIndex: 'description',
      key: 'description',
      width: 250,
      render: (description, record) => (
        <div>
          <Text strong>{description}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.category} {record.subcategory && `- ${record.subcategory}`} | {record.unitOfMeasure}
          </Text>
        </div>
      )
    },
    {
      title: 'Request Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (date) => new Date(date).toLocaleDateString()
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status) => (
        <Tag icon={getStatusIcon(status)} color={getStatusColor(status)}>
          {status.toUpperCase()}
        </Tag>
      )
    },
    {
      title: 'Response',
      dataIndex: 'response',
      key: 'response',
      width: 200,
      render: (response, record) => {
        if (record.status === 'pending') {
          return <Text type="secondary">Awaiting review</Text>;
        }
        if (record.status === 'completed') {
          return (
            <div>
              <Text type="success">✓ Item added to database</Text>
              <br />
              <Text type="secondary" style={{ fontSize: '12px' }}>
                Code: {record.itemCode}
              </Text>
            </div>
          );
        }
        if (record.status === 'rejected') {
          return (
            <Tooltip title={response || 'No reason provided'}>
              <Text type="danger">Request rejected</Text>
            </Tooltip>
          );
        }
        return response || 'No response yet';
      }
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      render: (_, record) => (
        <Space>
          <Button
            size="small"
            icon={<InfoCircleOutlined />}
            onClick={() => showRequestDetails(record)}
          >
            Details
          </Button>
        </Space>
      )
    }
  ];

  const showRequestDetails = (request) => {
    Modal.info({
      title: `Request #${request.id} Details`,
      width: 600,
      content: (
        <div>
          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Text strong>Description:</Text>
              <br />
              <Text>{request.description}</Text>
            </Col>
            <Col span={12}>
              <Text strong>Category:</Text>
              <br />
              <Text>{request.category}</Text>
            </Col>
            {request.subcategory && (
              <Col span={12}>
                <Text strong>Subcategory:</Text>
                <br />
                <Text>{request.subcategory}</Text>
              </Col>
            )}
            <Col span={12}>
              <Text strong>Unit of Measure:</Text>
              <br />
              <Text>{request.unitOfMeasure}</Text>
            </Col>
            <Col span={12}>
              <Text strong>Request Date:</Text>
              <br />
              <Text>{new Date(request.createdAt).toLocaleDateString()}</Text>
            </Col>
            <Col span={24}>
              <Text strong>Justification:</Text>
              <br />
              <Text>{request.justification}</Text>
            </Col>
            {request.estimatedPrice && (
              <Col span={12}>
                <Text strong>Estimated Price:</Text>
                <br />
                <Text>{request.estimatedPrice.toLocaleString()} XAF</Text>
              </Col>
            )}
            {request.preferredSupplier && (
              <Col span={12}>
                <Text strong>Preferred Supplier:</Text>
                <br />
                <Text>{request.preferredSupplier}</Text>
              </Col>
            )}
            <Col span={24}>
              <Text strong>Status:</Text>
              <br />
              <Tag icon={getStatusIcon(request.status)} color={getStatusColor(request.status)}>
                {request.status.toUpperCase()}
              </Tag>
            </Col>
            {request.response && (
              <Col span={24}>
                <Text strong>Supply Chain Response:</Text>
                <br />
                <Text>{request.response}</Text>
              </Col>
            )}
            {request.status === 'completed' && request.itemCode && (
              <Col span={24}>
                <Alert
                  message="Item Successfully Added"
                  description={`Your requested item has been added to the database with code: ${request.itemCode}. You can now select this item in purchase requisitions.`}
                  type="success"
                  showIcon
                />
              </Col>
            )}
          </Row>
        </div>
      )
    });
  };

  const stats = {
    total: requests.length,
    pending: requests.filter(req => req.status === 'pending').length,
    approved: requests.filter(req => req.status === 'approved').length,
    completed: requests.filter(req => req.status === 'completed').length,
    rejected: requests.filter(req => req.status === 'rejected').length
  };

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <Card style={{ marginBottom: '24px' }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={2} style={{ margin: 0 }}>
              My Item Requests
            </Title>
            <Text type="secondary">
              Request new items to be added to the purchase requisition database
            </Text>
          </Col>
          <Col>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                form.resetFields();
                setSelectedCategory(null);
                setShowRequestModal(true);
              }}
            >
              Request New Item
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Statistics */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={12} sm={6}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <Title level={3} style={{ margin: '8px 0', color: '#1890ff' }}>
                {stats.total}
              </Title>
              <Text type="secondary">Total Requests</Text>
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <Title level={3} style={{ margin: '8px 0', color: '#faad14' }}>
                {stats.pending}
              </Title>
              <Text type="secondary">Pending Review</Text>
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <Title level={3} style={{ margin: '8px 0', color: '#52c41a' }}>
                {stats.completed}
              </Title>
              <Text type="secondary">Completed</Text>
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <Title level={3} style={{ margin: '8px 0', color: '#f5222d' }}>
                {stats.rejected}
              </Title>
              <Text type="secondary">Rejected</Text>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Information Alert */}
      <Alert
        message="How Item Requests Work"
        description="Submit requests for items not currently in the database. The Supply Chain team will review your request and either add the item to the database or provide feedback. Approved items become available for selection in purchase requisitions."
        type="info"
        showIcon
        style={{ marginBottom: '24px' }}
      />

      {/* Requests Table */}
      <Card>
        {requests.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <div>
                <Text type="secondary">You haven't submitted any item requests yet</Text>
                <br />
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => {
                    form.resetFields();
                    setSelectedCategory(null);
                    setShowRequestModal(true);
                  }}
                  style={{ marginTop: '16px' }}
                >
                  Submit Your First Request
                </Button>
              </div>
            }
          />
        ) : (
          <Table
            columns={columns}
            dataSource={requests}
            rowKey="id"
            loading={loading}
            pagination={{
              pageSize: 10,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} of ${total} requests`,
            }}
          />
        )}
      </Card>

      {/* Request New Item Modal */}
      <Modal
        title="Request New Item"
        open={showRequestModal}
        onOk={handleSubmitRequest}
        onCancel={() => {
          setShowRequestModal(false);
          setSelectedCategory(null);
          form.resetFields();
        }}
        width={700}
        okText="Submit Request"
        okButtonProps={{ icon: <SendOutlined /> }}
      >
        <Alert
          message="Request Process"
          description="Submit detailed information about the item you need. The Supply Chain team will review your request within 1-3 business days and either add it to the database or provide feedback."
          type="info"
          showIcon
          style={{ marginBottom: '16px' }}
        />

        <div>
          <Form.Item
            name="description"
            label="Item Description"
            rules={[
              { required: true, message: 'Please describe the item' },
              { min: 10, message: 'Description must be at least 10 characters' }
            ]}
            help="Provide a detailed, specific description that would help identify the exact item"
          >
            <Input
              placeholder="e.g., 'Wireless optical mouse with USB receiver, compatible with Windows/Mac'"
              maxLength={200}
              showCount
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="category"
                label="Category"
                rules={[{ required: true, message: 'Please select category' }]}
              >
                <Select 
                  placeholder="Select most appropriate category"
                  onChange={handleCategoryChange}
                >
                  {itemCategories.map(category => (
                    <Option key={category} value={category}>
                      {category}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="subcategory"
                label="Subcategory (Optional)"
                help="Select a specific subcategory if applicable"
              >
                <Select 
                  placeholder="Select subcategory"
                  disabled={!selectedCategory}
                  allowClear
                  notFoundContent={
                    !selectedCategory ? "Please select a category first" : "No subcategories available"
                  }
                >
                  {selectedCategory && subcategories[selectedCategory]?.map(sub => (
                    <Option key={sub} value={sub}>
                      {sub}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="unitOfMeasure"
            label="Unit of Measure"
            rules={[{ required: true, message: 'Please specify unit' }]}
            help="How is this item typically counted/measured?"
          >
            <Select placeholder="Select unit">
              {measurementUnits.map(unit => (
                <Option key={unit} value={unit}>
                  {unit}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="justification"
            label="Business Justification"
            rules={[
              { required: true, message: 'Please justify why this item is needed' },
              { min: 20, message: 'Justification must be at least 20 characters' }
            ]}
            help="Explain the business need and how this item will be used"
          >
            <TextArea
              rows={4}
              placeholder="Explain why this item is needed, how it will be used, expected frequency of ordering, and why it should be added to the standard database..."
              maxLength={500}
              showCount
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="estimatedPrice"
                label="Estimated Price (XAF)"
                help="If you know the approximate price, please include it"
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value.replace(/\$\s?|(,)/g, '')}
                  placeholder="Estimated price in XAF"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="preferredSupplier"
                label="Preferred Supplier"
                help="Optional: Suggest a supplier if you have one in mind"
              >
                <Input placeholder="Supplier name or company" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="urgency"
            label="Urgency Level"
            rules={[{ required: true, message: 'Please indicate urgency' }]}
            help="How urgent is it to have this item available?"
          >
            <Select placeholder="Select urgency level">
              <Option value="low">
                <Tag color="green">Low</Tag> Can wait for next procurement cycle
              </Option>
              <Option value="medium">
                <Tag color="orange">Medium</Tag> Needed within 2-4 weeks
              </Option>
              <Option value="high">
                <Tag color="red">High</Tag> Urgent business need
              </Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="additionalNotes"
            label="Additional Notes"
            help="Any other relevant information (specifications, compatibility requirements, etc.)"
          >
            <TextArea
              rows={3}
              placeholder="Any technical specifications, compatibility requirements, or other relevant details..."
              maxLength={300}
              showCount
            />
          </Form.Item>
        </div>

        <Alert
          message="What Happens Next?"
          description={
            <div>
              1. Your request will be reviewed by the Supply Chain team<br />
              2. They may contact you for additional information<br />
              3. If approved, the item will be added to the database<br />
              4. You'll be notified and can then use it in purchase requisitions
            </div>
          }
          type="success"
          style={{ marginTop: '16px' }}
        />
      </Modal>
    </div>
  );
};

export default EmployeeItemRequests;


