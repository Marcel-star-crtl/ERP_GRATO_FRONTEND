import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Form,
  Input,
  Select,
  Button,
  Row,
  Col,
  Typography,
  Space,
  Alert,
  Radio,
  InputNumber,
  Upload,
  message,
  Divider,
  Tag,
  Steps,
  DatePicker
} from 'antd';
import {
  LaptopOutlined,
  ArrowLeftOutlined,
  PlusOutlined,
  DeleteOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  UploadOutlined,
  ToolOutlined
} from '@ant-design/icons';
import { itSupportAPI } from '../../services/api';
import { useSelector } from 'react-redux';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const { Step } = Steps;

const ITRequestForm = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [urgencyLevel, setUrgencyLevel] = useState('normal');
  const [requestItems, setRequestItems] = useState([{ 
    item: '', 
    quantity: 1, 
    justification: '', 
    estimatedCost: 0 
  }]);
  const [fileList, setFileList] = useState([]);
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const equipmentCategories = {
    'computer-peripherals': {
      label: 'Computer Peripherals',
      subcategory: 'peripherals',
      items: [
        { name: 'Wireless Mouse', estimatedCost: 15000 },
        { name: 'USB Mouse', estimatedCost: 8000 },
        { name: 'Mechanical Keyboard', estimatedCost: 35000 },
        { name: 'Wireless Keyboard', estimatedCost: 25000 },
        { name: '24" Monitor', estimatedCost: 180000 },
        { name: '27" Monitor', estimatedCost: 250000 },
        { name: 'Webcam', estimatedCost: 45000 },
        { name: 'Headphones/Headset', estimatedCost: 30000 },
        { name: 'Speakers', estimatedCost: 20000 },
        { name: 'Microphone', estimatedCost: 25000 },
        { name: 'USB Hub', estimatedCost: 12000 },
        { name: 'Mouse Pad', estimatedCost: 3000 },
        { name: 'Laptop Stand', estimatedCost: 18000 },
        { name: 'External Hard Drive (1TB)', estimatedCost: 65000 },
        { name: 'USB Flash Drive (32GB)', estimatedCost: 8000 }
      ]
    },
    'cables-adapters': {
      label: 'Cables & Adapters',
      subcategory: 'accessories',
      items: [
        { name: 'USB-C Cable', estimatedCost: 5000 },
        { name: 'Lightning Cable', estimatedCost: 8000 },
        { name: 'HDMI Cable', estimatedCost: 6000 },
        { name: 'VGA Cable', estimatedCost: 4000 },
        { name: 'Ethernet Cable', estimatedCost: 3000 },
        { name: 'Power Cable', estimatedCost: 5000 },
        { name: 'USB-C to HDMI Adapter', estimatedCost: 15000 },
        { name: 'USB-C to VGA Adapter', estimatedCost: 12000 },
        { name: 'HDMI to VGA Adapter', estimatedCost: 8000 },
        { name: 'USB Extension Cable', estimatedCost: 3000 },
        { name: 'Audio Cable (3.5mm)', estimatedCost: 2000 },
        { name: 'DisplayPort Cable', estimatedCost: 7000 }
      ]
    },
    'power-accessories': {
      label: 'Power & Accessories',
      subcategory: 'power',
      items: [
        { name: 'Laptop Charger/Adapter', estimatedCost: 25000 },
        { name: 'Phone Charger', estimatedCost: 8000 },
        { name: 'Power Bank', estimatedCost: 18000 },
        { name: 'Laptop Battery', estimatedCost: 45000 },
        { name: 'Power Strip', estimatedCost: 12000 },
        { name: 'UPS (500VA)', estimatedCost: 85000 },
        { name: 'UPS (1000VA)', estimatedCost: 150000 },
        { name: 'Surge Protector', estimatedCost: 15000 },
        { name: 'Car Charger', estimatedCost: 6000 },
        { name: 'Wireless Charging Pad', estimatedCost: 20000 }
      ]
    },
    'mobile-accessories': {
      label: 'Mobile & Tablet Accessories',
      subcategory: 'mobile',
      items: [
        { name: 'Phone Case', estimatedCost: 8000 },
        { name: 'Screen Protector', estimatedCost: 3000 },
        { name: 'Phone Stand', estimatedCost: 5000 },
        { name: 'Tablet Case', estimatedCost: 15000 },
        { name: 'Stylus/Pen', estimatedCost: 12000 },
        { name: 'Car Mount', estimatedCost: 10000 },
        { name: 'Bluetooth Earbuds', estimatedCost: 35000 },
        { name: 'Phone Ring Holder', estimatedCost: 2000 },
        { name: 'Tablet Keyboard', estimatedCost: 25000 }
      ]
    },
    'office-tech': {
      label: 'Office Technology',
      subcategory: 'office',
      items: [
        { name: 'Calculator', estimatedCost: 8000 },
        { name: 'Label Printer', estimatedCost: 120000 },
        { name: 'Barcode Scanner', estimatedCost: 85000 },
        { name: 'Presentation Remote', estimatedCost: 18000 },
        { name: 'Document Camera', estimatedCost: 180000 },
        { name: 'Conference Phone', estimatedCost: 250000 },
        { name: 'Desk Lamp with USB', estimatedCost: 15000 },
        { name: 'Digital Photo Frame', estimatedCost: 35000 }
      ]
    },
    'software-licenses': {
      label: 'Software & Licenses',
      subcategory: 'software',
      items: [
        { name: 'Microsoft Office License', estimatedCost: 180000 },
        { name: 'Adobe Creative Suite', estimatedCost: 350000 },
        { name: 'Antivirus Software', estimatedCost: 25000 },
        { name: 'VPN License', estimatedCost: 45000 },
        { name: 'Project Management Software', estimatedCost: 120000 },
        { name: 'Design Software License', estimatedCost: 200000 },
        { name: 'Database Software', estimatedCost: 500000 },
        { name: 'Development Tools', estimatedCost: 250000 }
      ]
    }
  };

  const urgencyOptions = [
    {
      value: 'low',
      label: 'Low Priority',
      description: 'Can wait 1-2 weeks',
      color: 'green'
    },
    {
      value: 'normal',
      label: 'Normal Priority',
      description: 'Needed within a week',
      color: 'blue'
    },
    {
      value: 'high',
      label: 'High Priority',
      description: 'Needed within 2-3 days',
      color: 'orange'
    },
    {
      value: 'urgent',
      label: 'Urgent',
      description: 'Critical for work - needed immediately',
      color: 'red'
    }
  ];

  // Handler Functions
  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      
      // Create a proper description that meets the minimum length requirement
      let description = '';
      const validItems = requestItems.filter(item => item.item);
      
      if (validItems.length > 0) {
        const itemNames = validItems.map(item => item.item).join(', ');
        description = `IT Equipment Request for: ${itemNames}`;
        
        if (values.businessJustification) {
          description += `. Business Justification: ${values.businessJustification}`;
        }
        
        if (values.businessImpact) {
          description += `. Impact: ${values.businessImpact}`;
        }
      } else {
        description = values.businessJustification || 'IT Equipment Request';
      }
      
      // Ensure description meets minimum length
      if (description.length < 10) {
        description = 'IT Equipment and Material Request - ' + (values.businessJustification || 'Equipment needed for work purposes');
      }
      
      const requestData = {
        title: values.businessJustification ? 
          `${values.businessJustification.substring(0, 50)}...` : 
          `Material Request - ${requestItems.length} items`,
        description: description, // Use the properly formatted description
        category: 'hardware',
        subcategory: equipmentCategories[selectedCategory]?.subcategory || 'accessories',
        priority: urgencyLevel === 'urgent' ? 'critical' : 
                 urgencyLevel === 'high' ? 'high' : 
                 urgencyLevel === 'normal' ? 'medium' : 'low',
        urgency: urgencyLevel,
        businessJustification: values.businessJustification,
        businessImpact: values.businessImpact,
        location: values.deliveryLocation,
        requestedItems: requestItems.filter(item => item.item).map(item => ({
          item: item.item,
          quantity: item.quantity || 1,
          justification: item.justification,
          estimatedCost: item.estimatedCost || 0
        })),
        contactInfo: {
          phone: user.phone,
          email: user.email
        },
        preferredContactMethod: values.preferredContactMethod || 'email',
        attachments: fileList,
        requiredDate: values.requiredDate,
        additionalNotes: values.additionalNotes
      };
  
      console.log('Submitting material request:', requestData);
      
      const response = await itSupportAPI.createMaterialRequest(requestData);
      
      if (response.success) {
        message.success('Material request submitted successfully!');
        navigate('/employee/it-support');
      } else {
        throw new Error(response.message || 'Failed to submit request');
      }
    } catch (error) {
      console.error('Error submitting material request:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to submit material request';
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const addRequestItem = () => {
    setRequestItems([...requestItems, { 
      item: '', 
      quantity: 1, 
      justification: '', 
      estimatedCost: 0 
    }]);
  };

  const removeRequestItem = (index) => {
    if (requestItems.length > 1) {
      const newItems = requestItems.filter((_, i) => i !== index);
      setRequestItems(newItems);
    }
  };

  const updateRequestItem = (index, field, value) => {
    const newItems = [...requestItems];
    newItems[index][field] = value;
    
    // Auto-update estimated cost when item is selected
    if (field === 'item' && selectedCategory) {
      const categoryItems = equipmentCategories[selectedCategory]?.items || [];
      const selectedItem = categoryItems.find(item => item.name === value);
      if (selectedItem) {
        newItems[index]['estimatedCost'] = selectedItem.estimatedCost;
      }
    }
    
    setRequestItems(newItems);
  };

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    setCurrentStep(1);
  };

  const handleFileUpload = ({ fileList }) => {
    setFileList(fileList);
  };

  const getTotalEstimatedCost = () => {
    return requestItems.reduce((sum, item) => sum + ((item.estimatedCost || 0) * (item.quantity || 1)), 0);
  };

  // Step 0: Category Selection
  const renderCategorySelection = () => (
    <div>
      <Title level={4}>Select Equipment Category</Title>
      <Paragraph type="secondary">
        Choose the category that best matches your equipment needs
      </Paragraph>
      
      <Row gutter={[16, 16]}>
        {Object.entries(equipmentCategories).map(([key, category]) => (
          <Col xs={24} sm={12} md={8} key={key}>
            <Card
              hoverable
              onClick={() => handleCategoryChange(key)}
              style={{ 
                textAlign: 'center',
                borderColor: selectedCategory === key ? '#1890ff' : '#d9d9d9',
                backgroundColor: selectedCategory === key ? '#f0f8ff' : 'white'
              }}
            >
              <LaptopOutlined style={{ fontSize: '24px', color: '#1890ff', marginBottom: '8px' }} />
              <div style={{ fontWeight: 'bold' }}>{category.label}</div>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                {category.items.length} items available
              </Text>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );

  // Step 1: Item Selection
  const renderItemSelection = () => (
    <div>
      <Title level={4}>Select Equipment Items</Title>
      <Paragraph type="secondary">
        Choose the specific items you need from the {equipmentCategories[selectedCategory]?.label} category
      </Paragraph>

      {requestItems.map((item, index) => (
        <Card key={index} size="small" style={{ marginBottom: '16px' }}>
          <Row gutter={[16, 8]} align="middle">
            <Col span={6}>
              <Select
                placeholder="Select equipment"
                style={{ width: '100%' }}
                value={item.item}
                onChange={(value) => updateRequestItem(index, 'item', value)}
                showSearch
                filterOption={(input, option) =>
                  option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                }
              >
                {equipmentCategories[selectedCategory]?.items.map(equipmentItem => (
                  <Option key={equipmentItem.name} value={equipmentItem.name}>
                    {equipmentItem.name} - XAF {equipmentItem.estimatedCost.toLocaleString()}
                  </Option>
                ))}
              </Select>
            </Col>
            <Col span={2}>
              <InputNumber
                min={1}
                max={10}
                value={item.quantity}
                onChange={(value) => updateRequestItem(index, 'quantity', value)}
                placeholder="Qty"
                style={{ width: '100%' }}
              />
            </Col>
            <Col span={3}>
              <Text strong>XAF {((item.estimatedCost || 0) * (item.quantity || 1)).toLocaleString()}</Text>
            </Col>
            <Col span={10}>
              <Input
                placeholder="Brief justification"
                value={item.justification}
                onChange={(e) => updateRequestItem(index, 'justification', e.target.value)}
              />
            </Col>
            <Col span={3}>
              <Space>
                {index === requestItems.length - 1 && (
                  <Button 
                    type="dashed" 
                    icon={<PlusOutlined />} 
                    onClick={addRequestItem}
                    size="small"
                  />
                )}
                {requestItems.length > 1 && (
                  <Button 
                    danger 
                    icon={<DeleteOutlined />} 
                    onClick={() => removeRequestItem(index)}
                    size="small"
                  />
                )}
              </Space>
            </Col>
          </Row>
        </Card>
      ))}

      <Card type="inner" style={{ marginTop: '16px' }}>
        <Row justify="space-between">
          <Col>
            <Text strong>Total Items: {requestItems.filter(item => item.item).length}</Text>
          </Col>
          <Col>
            <Text strong>Total Estimated Cost: XAF {getTotalEstimatedCost().toLocaleString()}</Text>
          </Col>
        </Row>
      </Card>

      <Alert
        message="Equipment Availability"
        description="Most common items are typically in stock. Specialized equipment may require ordering and take 3-5 business days."
        type="info"
        style={{ marginTop: '16px' }}
      />
    </div>
  );

  // Step 2: Request Details
  const renderRequestDetails = () => (
    <div>
      <Title level={4}>Request Details & Priority</Title>
      
      <Row gutter={[24, 16]}>
        <Col span={24}>
          <Form.Item
            label="Business Justification"
            name="businessJustification"
            rules={[{ required: true, message: 'Please provide business justification' }]}
          >
            <TextArea
              rows={3}
              placeholder="Explain why this equipment is needed for your work (e.g., current equipment broken, new project requirements, productivity improvement)"
              showCount
              maxLength={500}
            />
          </Form.Item>
        </Col>

        <Col span={24}>
          <Form.Item
            label="Business Impact"
            name="businessImpact"
          >
            <TextArea
              rows={2}
              placeholder="How does not having this equipment affect your work productivity?"
              showCount
              maxLength={300}
            />
          </Form.Item>
        </Col>

        <Col span={24}>
          <Form.Item
            label="Request Priority"
            name="urgency"
            rules={[{ required: true, message: 'Please select priority level' }]}
          >
            <Radio.Group 
              value={urgencyLevel} 
              onChange={(e) => setUrgencyLevel(e.target.value)}
            >
              <Space direction="vertical" style={{ width: '100%' }}>
                {urgencyOptions.map(option => (
                  <Radio.Button 
                    key={option.value} 
                    value={option.value}
                    style={{ 
                      width: '100%', 
                      textAlign: 'left',
                      borderColor: option.color === 'red' ? '#ff4d4f' : 
                                  option.color === 'orange' ? '#faad14' : '#d9d9d9'
                    }}
                  >
                    <div>
                      <Text strong style={{ color: option.color === 'red' ? '#ff4d4f' : 
                                                    option.color === 'orange' ? '#faad14' : 'inherit' }}>
                        {option.label}
                      </Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        {option.description}
                      </Text>
                    </div>
                  </Radio.Button>
                ))}
              </Space>
            </Radio.Group>
          </Form.Item>
        </Col>

        <Col span={12}>
          <Form.Item
            label="Required By Date"
            name="requiredDate"
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </Col>

        <Col span={12}>
          <Form.Item
            label="Delivery Location"
            name="deliveryLocation"
            rules={[{ required: true, message: 'Please specify delivery location' }]}
          >
            <Select placeholder="Select delivery location">
              <Option value="My Desk">My Desk</Option>
              <Option value="Reception">Reception</Option>
              <Option value="IT Department">IT Department</Option>
              <Option value="Meeting Room">Meeting Room</Option>
              <Option value="Other">Other (specify in notes)</Option>
            </Select>
          </Form.Item>
        </Col>

        <Col span={12}>
          <Form.Item
            label="Preferred Contact Method"
            name="preferredContactMethod"
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

        <Col span={12}>
          <Form.Item
            label="Additional Notes"
            name="additionalNotes"
          >
            <TextArea
              rows={2}
              placeholder="Any additional information or special requirements"
              showCount
              maxLength={200}
            />
          </Form.Item>
        </Col>

        <Col span={24}>
          <Form.Item
            label="Supporting Documents"
            name="attachments"
          >
            <Upload
              multiple
              fileList={fileList}
              onChange={handleFileUpload}
              beforeUpload={() => false}
              accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.txt"
            >
              <Button icon={<UploadOutlined />}>
                Upload Files (Optional)
              </Button>
            </Upload>
            <Text type="secondary" style={{ fontSize: '12px', marginTop: '4px', display: 'block' }}>
              Upload any relevant documents (quotes, specifications, etc.)
            </Text>
          </Form.Item>
        </Col>
      </Row>
    </div>
  );

  // Main render function for step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return renderCategorySelection();
      case 1:
        return renderItemSelection();
      case 2:
        return renderRequestDetails();
      default:
        return null;
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto' }}>
      <Card>
        {/* Header */}
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
                <LaptopOutlined /> IT Equipment Request
              </Title>
              <Text type="secondary">Request IT equipment and accessories for your work</Text>
            </div>
          </Space>
        </div>

        {/* Progress Steps */}
        <Steps current={currentStep} style={{ marginBottom: '32px' }}>
          <Step 
            title="Category" 
            description="Select equipment type"
            icon={currentStep > 0 ? <CheckCircleOutlined /> : <InfoCircleOutlined />}
          />
          <Step 
            title="Items" 
            description="Choose specific items"
            icon={currentStep > 1 ? <CheckCircleOutlined /> : <ClockCircleOutlined />}
          />
          <Step 
            title="Details" 
            description="Provide request details"
            icon={<ToolOutlined />}
          />
        </Steps>

        {/* Summary Card (shown after category selection) */}
        {currentStep > 0 && (
          <Card type="inner" style={{ marginBottom: '24px' }}>
            <Row gutter={[16, 8]}>
              <Col span={8}>
                <Text strong>Selected Category:</Text>
                <br />
                <Tag color="blue">{equipmentCategories[selectedCategory]?.label}</Tag>
              </Col>
              <Col span={8}>
                <Text strong>Total Items:</Text>
                <br />
                <Text>{requestItems.filter(item => item.item).length}</Text>
              </Col>
              <Col span={8}>
                <Text strong>Estimated Cost:</Text>
                <br />
                <Text>XAF {getTotalEstimatedCost().toLocaleString()}</Text>
              </Col>
            </Row>
          </Card>
        )}

        {/* Form with step content */}
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          autoComplete="off"
        >
          {renderStepContent()}

          <Divider />

          {/* Navigation Buttons */}
          <Row justify="space-between" align="middle">
            <Col>
              {currentStep > 0 && (
                <Button onClick={() => setCurrentStep(currentStep - 1)}>
                  Previous
                </Button>
              )}
            </Col>
            <Col>
              <Space>
                {currentStep < 2 ? (
                  <Button
                    type="primary"
                    onClick={() => setCurrentStep(currentStep + 1)}
                    disabled={
                      (currentStep === 0 && !selectedCategory) ||
                      (currentStep === 1 && !requestItems.some(item => item.item))
                    }
                  >
                    Next
                  </Button>
                ) : (
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={loading}
                    disabled={!requestItems.some(item => item.item)}
                  >
                    Submit Request
                  </Button>
                )}
              </Space>
            </Col>
          </Row>

          {/* Final step alert */}
          {currentStep === 2 && (
            <Alert
              message="Request Review"
              description="Please review all information before submitting. Your request will be sent to your supervisor for approval and then to the IT department for processing."
              type="info"
              style={{ marginTop: '16px' }}
            />
          )}
        </Form>
      </Card>
    </div>
  );
};

export default ITRequestForm;



