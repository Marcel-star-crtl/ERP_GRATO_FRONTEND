import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Form, 
  Input, 
  Select, 
  Button, 
  Card, 
  Typography, 
  Space, 
  Row, 
  Col,
  InputNumber,
  message,
  Alert,
  Divider,
  Upload,
  DatePicker,
  Table,
  Tag,
  Modal
} from 'antd';
import { 
  ShoppingCartOutlined,
  PlusOutlined,
  MinusOutlined,
  UploadOutlined,
  InfoCircleOutlined,
  DollarOutlined,
  DeleteOutlined,
  EditOutlined,
  ArrowLeftOutlined
} from '@ant-design/icons';
import { useSelector } from 'react-redux';
import dayjs from 'dayjs';
import { itSupportAPI } from '../../services/api'; 

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const ITMaterialRequestForm = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [requestItems, setRequestItems] = useState([
    { 
      id: 1, 
      item: '', 
      category: '', 
      subcategory: '', 
      brand: '', 
      model: '', 
      specifications: '', 
      quantity: 1, 
      estimatedCost: null,
      urgency: 'medium',
      justification: ''
    }
  ]);
  const [totalEstimatedCost, setTotalEstimatedCost] = useState(0);
  const [fileList, setFileList] = useState([]);
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const itCategories = {
    'hardware': {
      label: 'Hardware',
      subcategories: [
        'Desktop Computer',
        'Laptop',
        'Monitor',
        'Keyboard',
        'Mouse',
        'Printer',
        'Scanner',
        'External Hard Drive',
        'USB Flash Drive',
        'Webcam',
        'Headphones/Headset',
        'Speakers',
        'Network Equipment',
        'Server Hardware',
        'Other Hardware'
      ]
    },
    'software': {
      label: 'Software',
      subcategories: [
        'Operating System License',
        'Microsoft Office',
        'Adobe Creative Suite',
        'Antivirus Software',
        'Development Tools',
        'Design Software',
        'Accounting Software',
        'CRM Software',
        'Database Software',
        'Project Management Tools',
        'Other Software'
      ]
    },
    'accessories': {
      label: 'Accessories',
      subcategories: [
        'Cables (HDMI, USB, etc.)',
        'Adapters/Converters',
        'Power Supplies',
        'Batteries',
        'Memory Cards',
        'Phone/Tablet Cases',
        'Stands/Mounts',
        'Cleaning Supplies',
        'Other Accessories'
      ]
    },
    'mobile': {
      label: 'Mobile Devices',
      subcategories: [
        'Smartphone',
        'Tablet',
        'Mobile Charger',
        'Phone Accessories',
        'Mobile Plan/SIM',
        'Other Mobile'
      ]
    },
    'networking': {
      label: 'Networking',
      subcategories: [
        'Router',
        'Switch',
        'Access Point',
        'Ethernet Cables',
        'Network Cards',
        'Firewall',
        'Other Network Equipment'
      ]
    }
  };

  const urgencyOptions = [
    { value: 'critical', label: 'Critical', color: 'red', description: 'Work completely stopped' },
    { value: 'high', label: 'High', color: 'orange', description: 'Major impact on productivity' },
    { value: 'medium', label: 'Medium', color: 'yellow', description: 'Minor impact, can wait' },
    { value: 'low', label: 'Low', color: 'green', description: 'Nice to have, no rush' }
  ];

  const calculateTotalCost = () => {
    const total = requestItems.reduce((sum, item) => {
      const itemCost = (item.estimatedCost || 0) * (item.quantity || 1);
      return sum + itemCost;
    }, 0);
    setTotalEstimatedCost(total);
  };

  const addRequestItem = () => {
    const newItem = { 
      id: Date.now(), 
      item: '', 
      category: '', 
      subcategory: '', 
      brand: '', 
      model: '', 
      specifications: '', 
      quantity: 1, 
      estimatedCost: null,
      urgency: 'medium',
      justification: ''
    };
    setRequestItems([...requestItems, newItem]);
  };

  const removeRequestItem = (id) => {
    if (requestItems.length > 1) {
      setRequestItems(requestItems.filter(item => item.id !== id));
      setTimeout(calculateTotalCost, 100);
    }
  };

  const updateRequestItem = (id, field, value) => {
    setRequestItems(prev => {
      const updated = prev.map(item => 
        item.id === id ? { ...item, [field]: value } : item
      );
      setTimeout(calculateTotalCost, 100);
      return updated;
    });
  };

  const handleCategoryChange = (id, category) => {
    updateRequestItem(id, 'category', category);
    updateRequestItem(id, 'subcategory', ''); // Reset subcategory
  };

  const validateRequestItems = () => {
    for (const item of requestItems) {
      if (!item.item || !item.category || !item.justification) {
        return false;
      }
    }
    return true;
  };

  // FIXED: Handle submit with proper API integration
  const handleSubmit = async (values) => {
    if (!validateRequestItems()) {
      message.error('Please fill in all required fields for each item');
      return;
    }

    try {
      setLoading(true);
      
      // FIXED: Create proper request data structure
      const requestData = {
        title: values.requestTitle || `Material Request - ${requestItems.length} items`,
        // FIXED: Create proper description that meets minimum length
        description: values.description || `Material request for ${requestItems.length} IT items: ${requestItems.map(item => item.item).filter(Boolean).join(', ')}`,
        businessJustification: values.businessJustification,
        businessImpact: values.businessImpact,
        priority: values.priority,
        urgency: values.urgency || 'normal',
        category: 'hardware', // Primary category
        subcategory: 'accessories', // Default subcategory
        location: values.deliveryLocation || 'Office',
        requestedItems: requestItems.filter(item => item.item).map(item => ({
          item: item.item,
          category: item.category,
          subcategory: item.subcategory,
          brand: item.brand || '',
          model: item.model || '',
          specifications: item.specifications || '',
          quantity: item.quantity || 1,
          estimatedCost: item.estimatedCost || 0,
          justification: item.justification
        })),
        contactInfo: {
          phone: user.phone || '',
          email: user.email,
          alternateContact: ''
        },
        preferredContactMethod: values.preferredContactMethod || 'email',
        attachments: fileList,
        requiredDate: values.requiredBy?.toISOString(),
        additionalNotes: values.additionalNotes
      };

      console.log('Submitting material request:', requestData);
      
      const response = await itSupportAPI.createMaterialRequest(requestData);
      
      if (response.success) {
        message.success(`Material request submitted successfully! Ticket: ${response.data.ticketNumber}`);
        navigate('/employee/it-support');
      } else {
        throw new Error(response.message || 'Failed to submit request');
      }
    } catch (error) {
      console.error('Error submitting request:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to submit material request';
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = ({ fileList }) => {
    setFileList(fileList);
  };

  const requestItemColumns = [
    {
      title: 'Item Details',
      key: 'itemDetails',
      width: 300,
      render: (_, record, index) => (
        <div>
          <Input
            placeholder="Item name *"
            value={record.item}
            onChange={(e) => updateRequestItem(record.id, 'item', e.target.value)}
            style={{ marginBottom: '8px' }}
          />
          <Row gutter={8}>
            <Col span={12}>
              <Select
                placeholder="Category *"
                value={record.category}
                onChange={(value) => handleCategoryChange(record.id, value)}
                style={{ width: '100%' }}
                size="small"
              >
                {Object.entries(itCategories).map(([key, cat]) => (
                  <Option key={key} value={key}>{cat.label}</Option>
                ))}
              </Select>
            </Col>
            <Col span={12}>
              <Select
                placeholder="Subcategory"
                value={record.subcategory}
                onChange={(value) => updateRequestItem(record.id, 'subcategory', value)}
                style={{ width: '100%' }}
                size="small"
                disabled={!record.category}
              >
                {record.category && itCategories[record.category]?.subcategories.map(sub => (
                  <Option key={sub} value={sub}>{sub}</Option>
                ))}
              </Select>
            </Col>
          </Row>
        </div>
      )
    },
    {
      title: 'Specifications',
      key: 'specifications',
      width: 250,
      render: (_, record) => (
        <div>
          <Row gutter={8}>
            <Col span={12}>
              <Input
                placeholder="Brand"
                value={record.brand}
                onChange={(e) => updateRequestItem(record.id, 'brand', e.target.value)}
                size="small"
                style={{ marginBottom: '8px' }}
              />
            </Col>
            <Col span={12}>
              <Input
                placeholder="Model"
                value={record.model}
                onChange={(e) => updateRequestItem(record.id, 'model', e.target.value)}
                size="small"
                style={{ marginBottom: '8px' }}
              />
            </Col>
          </Row>
          <TextArea
            placeholder="Technical specifications"
            value={record.specifications}
            onChange={(e) => updateRequestItem(record.id, 'specifications', e.target.value)}
            rows={2}
            size="small"
          />
        </div>
      )
    },
    {
      title: 'Qty & Cost',
      key: 'quantityCost',
      width: 150,
      render: (_, record) => (
        <div>
          <InputNumber
            placeholder="Quantity"
            value={record.quantity}
            onChange={(value) => updateRequestItem(record.id, 'quantity', value)}
            min={1}
            max={100}
            style={{ width: '100%', marginBottom: '8px' }}
            size="small"
          />
          <InputNumber
            placeholder="Est. cost (XAF)"
            value={record.estimatedCost}
            onChange={(value) => updateRequestItem(record.id, 'estimatedCost', value)}
            min={0}
            formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            parser={value => value.replace(/\$\s?|(,*)/g, '')}
            style={{ width: '100%' }}
            size="small"
          />
        </div>
      )
    },
    {
      title: 'Priority',
      key: 'urgency',
      width: 120,
      render: (_, record) => (
        <Select
          value={record.urgency}
          onChange={(value) => updateRequestItem(record.id, 'urgency', value)}
          style={{ width: '100%' }}
          size="small"
        >
          {urgencyOptions.map(option => (
            <Option key={option.value} value={option.value}>
              <Tag color={option.color} size="small">{option.label}</Tag>
            </Option>
          ))}
        </Select>
      )
    },
    {
      title: 'Justification',
      key: 'justification',
      width: 200,
      render: (_, record) => (
        <TextArea
          placeholder="Why do you need this item? *"
          value={record.justification}
          onChange={(e) => updateRequestItem(record.id, 'justification', e.target.value)}
          rows={3}
          size="small"
          showCount
          maxLength={200}
        />
      )
    },
    {
      title: 'Action',
      key: 'action',
      width: 60,
      render: (_, record) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => removeRequestItem(record.id)}
          disabled={requestItems.length <= 1}
          size="small"
        />
      )
    }
  ];

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <Card>
        <div style={{ marginBottom: '24px' }}>
          <Space align="center">
            <Button 
              icon={<ArrowLeftOutlined />} 
              onClick={() => navigate('/employee/it-support')}
            >
              Back
            </Button>
            <div>
              <Title level={2} style={{ margin: 0 }}>
                <ShoppingCartOutlined /> IT Material Request Form
              </Title>
              <Text type="secondary">Request IT equipment and materials for your work</Text>
            </div>
          </Space>
        </div>

        <Alert
          message="IT Material Request Guidelines"
          description={
            <div>
              <p><strong>📋 What to include:</strong> Specify exact items needed with technical specifications</p>
              <p><strong>💰 Cost estimates:</strong> Provide realistic cost estimates for budget planning</p>
              <p><strong>⚡ Priority levels:</strong> Set appropriate urgency based on business impact</p>
              <p><strong>✅ Approval process:</strong> Requests over 50,000 XAF require management approval</p>
            </div>
          }
          type="info"
          showIcon
          style={{ marginBottom: '24px' }}
        />

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          autoComplete="off"
        >
          <Row gutter={16}>
            <Col xs={24} md={16}>
              <Form.Item
                name="requestTitle"
                label="Request Title"
                rules={[{ required: true, message: 'Please enter a request title' }]}
              >
                <Input 
                  placeholder="Brief description of what you're requesting"
                  maxLength={100}
                  showCount
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                name="priority"
                label="Overall Priority"
                rules={[{ required: true, message: 'Please select priority' }]}
              >
                <Select placeholder="Select request priority">
                  {urgencyOptions.map(option => (
                    <Option key={option.value} value={option.value}>
                      <Space>
                        <Tag color={option.color}>{option.label}</Tag>
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          {option.description}
                        </Text>
                      </Space>
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="description"
            label="Request Description"
            rules={[{ required: true, message: 'Please provide a detailed description' }]}
          >
            <TextArea
              rows={3}
              placeholder="Provide a comprehensive description of your IT material needs..."
              showCount
              maxLength={500}
            />
          </Form.Item>

          <Divider orientation="left">
            <Space>
              <ShoppingCartOutlined />
              <Text strong>Requested Items</Text>
            </Space>
          </Divider>

          <div style={{ marginBottom: '16px' }}>
            <Table
              dataSource={requestItems}
              columns={requestItemColumns}
              pagination={false}
              rowKey="id"
              size="small"
              scroll={{ x: 'max-content' }}
              footer={() => (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Button
                    type="dashed"
                    icon={<PlusOutlined />}
                    onClick={addRequestItem}
                  >
                    Add Another Item
                  </Button>
                  <div>
                    <Text strong style={{ fontSize: '16px' }}>
                      Total Estimated Cost: XAF {totalEstimatedCost.toLocaleString()}
                    </Text>
                    {totalEstimatedCost > 50000 && (
                      <div>
                        <Tag color="orange" icon={<InfoCircleOutlined />}>
                          Management Approval Required
                        </Tag>
                      </div>
                    )}
                  </div>
                </div>
              )}
            />
          </div>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                name="businessJustification"
                label="Business Justification"
                rules={[{ required: true, message: 'Please provide business justification' }]}
              >
                <TextArea
                  rows={4}
                  placeholder="Explain how these items will benefit the business, improve productivity, or solve specific problems..."
                  showCount
                  maxLength={800}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Row gutter={16}>
                <Col span={24}>
                  <Form.Item
                    name="requiredBy"
                    label="Required By Date"
                  >
                    <DatePicker
                      style={{ width: '100%' }}
                      placeholder="When do you need these items?"
                      disabledDate={(current) => current && current < dayjs().endOf('day')}
                      format="YYYY-MM-DD"
                    />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item
                    name="deliveryLocation"
                    label="Delivery Location"
                    rules={[{ required: true, message: 'Please specify delivery location' }]}
                  >
                    <Select placeholder="Where should items be delivered?">
                      <Option value="My Desk">My Desk</Option>
                      <Option value="Reception">Reception</Option>
                      <Option value="IT Department">IT Department</Option>
                      <Option value="Meeting Room">Meeting Room</Option>
                      <Option value="Other">Other (specify in notes)</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item
                    name="preferredContactMethod"
                    label="Preferred Contact Method"
                    rules={[{ required: true, message: 'Please select contact method' }]}
                  >
                    <Select placeholder="How should we contact you?">
                      <Option value="email">Email</Option>
                      <Option value="phone">Phone Call</Option>
                      <Option value="in_person">Visit my desk</Option>
                      <Option value="teams">Microsoft Teams</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item
                    name="attachments"
                    label="Supporting Documents"
                  >
                    <Upload
                      multiple
                      fileList={fileList}
                      onChange={handleFileUpload}
                      beforeUpload={() => false} // Prevent auto upload
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xlsx,.xls"
                    >
                      <Button icon={<UploadOutlined />}>
                        Attach Files
                      </Button>
                    </Upload>
                    <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginTop: '4px' }}>
                      Quotes, specifications, or related documents (PDF, DOC, Images)
                    </Text>
                  </Form.Item>
                </Col>
              </Row>
            </Col>
          </Row>

          <Form.Item
            name="businessImpact"
            label="Business Impact"
          >
            <TextArea
              rows={2}
              placeholder="How does not having these items affect your work productivity?"
              showCount
              maxLength={300}
            />
          </Form.Item>

          <Form.Item
            name="additionalNotes"
            label="Additional Notes"
          >
            <TextArea
              rows={2}
              placeholder="Any additional information or special requirements"
              showCount
              maxLength={200}
            />
          </Form.Item>

          <Card size="small" style={{ marginBottom: '24px', backgroundColor: '#f9f9f9' }}>
            <Title level={5}>
              <InfoCircleOutlined /> Request Summary
            </Title>
            <Row gutter={16}>
              <Col span={6}>
                <Text type="secondary">Total Items:</Text>
                <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
                  {requestItems.filter(item => item.item).length}
                </div>
              </Col>
              <Col span={6}>
                <Text type="secondary">Total Quantity:</Text>
                <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
                  {requestItems.reduce((sum, item) => sum + (item.quantity || 0), 0)}
                </div>
              </Col>
              <Col span={6}>
                <Text type="secondary">Estimated Cost:</Text>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1890ff' }}>
                  XAF {totalEstimatedCost.toLocaleString()}
                </div>
              </Col>
              <Col span={6}>
                <Text type="secondary">Approval Needed:</Text>
                <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
                  <Tag color={totalEstimatedCost > 50000 ? 'orange' : 'green'}>
                    {totalEstimatedCost > 50000 ? 'Yes' : 'No'}
                  </Tag>
                </div>
              </Col>
            </Row>
          </Card>

          <Form.Item>
            <Space>
              <Button onClick={() => navigate('/employee/it-support')}>
                Cancel
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                icon={<ShoppingCartOutlined />}
              >
                Submit Material Request
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default ITMaterialRequestForm;



