import React, { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Input,
  InputNumber,
  Button,
  Space,
  Typography,
  Alert,
  Divider,
  Row,
  Col,
  Table,
  Checkbox,
  Select,
  DatePicker,
  Upload,
  message,
  Spin,
  Steps,
  Badge,
  Tag,
  Descriptions,
  Modal,
  Progress
} from 'antd';
import {
  SendOutlined,
  CalculatorOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  UploadOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  TruckOutlined,
  SafetyCertificateOutlined,
  PhoneOutlined,
  MailOutlined,
  GlobalOutlined
} from '@ant-design/icons';
import moment from 'moment';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const { Step } = Steps;

const ExternalQuoteForm = () => {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [rfqData, setRfqData] = useState(null);
  const [form] = Form.useForm();
  const [currentStep, setCurrentStep] = useState(0);
  const [quotedItems, setQuotedItems] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [token, setToken] = useState(null);
  const [existingQuote, setExistingQuote] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(null);

  // Extract token from URL on component mount
  useEffect(() => {
    const urlPath = window.location.pathname;
    const tokenMatch = urlPath.match(/\/external-quote\/([^\/]+)/);
    if (tokenMatch) {
      setToken(tokenMatch[1]);
      loadRFQData(tokenMatch[1]);
    } else {
      message.error('Invalid invitation link');
    }
  }, []);

  // Update time remaining every minute
  useEffect(() => {
    if (rfqData?.rfq?.responseDeadline) {
      const updateTimeRemaining = () => {
        const deadline = moment(rfqData.rfq.responseDeadline);
        const now = moment();
        const remaining = deadline.diff(now);
        
        if (remaining > 0) {
          const days = Math.floor(remaining / (24 * 60 * 60 * 1000));
          const hours = Math.floor((remaining % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
          const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
          
          setTimeRemaining({ days, hours, minutes, total: remaining });
        } else {
          setTimeRemaining({ days: 0, hours: 0, minutes: 0, total: 0 });
        }
      };

      updateTimeRemaining();
      const interval = setInterval(updateTimeRemaining, 60000); // Update every minute

      return () => clearInterval(interval);
    }
  }, [rfqData]);

  const loadRFQData = async (invitationToken) => {
    try {
      setLoading(true);
      
      const response = await fetch(`/api/external-quote/${invitationToken}/rfq`);
      const result = await response.json();
      
      if (result.success) {
        setRfqData(result.data);
        setExistingQuote(result.data.existingQuote);
        
        // Initialize quoted items from RFQ items
        const initialItems = result.data.rfq.items.map(item => ({
          id: item.id,
          description: item.description,
          quantity: item.quantity,
          unit: item.unit,
          specifications: item.specifications,
          unitPrice: 0,
          totalPrice: 0,
          brand: '',
          model: '',
          warranty: '',
          deliveryTime: 7
        }));
        
        setQuotedItems(initialItems);
        
        // If editing existing quote, populate form
        if (result.data.existingQuote) {
          populateFormWithExistingQuote(result.data.existingQuote);
        } else {
          // Set default form values
          form.setFieldsValue({
            supplierInfo: {
              companyName: '',
              contactPerson: '',
              email: '',
              phone: '',
              address: '',
              preferredContactMethod: 'email'
            },
            deliveryTime: 7,
            deliveryTimeUnit: 'days',
            paymentTerms: result.data.rfq.paymentTerms || '30 days',
            warranty: '1 year manufacturer warranty',
            validityPeriod: 30,
            termsAccepted: false
          });
        }
      } else {
        message.error(result.message || 'Failed to load RFQ data');
      }
    } catch (error) {
      console.error('Error loading RFQ:', error);
      message.error('Failed to load RFQ data. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const populateFormWithExistingQuote = (quote) => {
    // Populate form with existing quote data
    form.setFieldsValue({
      supplierInfo: {
        companyName: quote.supplierName || '',
        contactPerson: quote.supplierContactPerson || '',
        email: quote.supplierEmail || '',
        phone: quote.supplierPhone || '',
        address: quote.supplierAddress || ''
      },
      deliveryTime: quote.deliveryTime || 7,
      deliveryTimeUnit: quote.deliveryTimeUnit || 'days',
      paymentTerms: quote.paymentTerms || '30 days',
      warranty: quote.warranty || '',
      validityPeriod: 30,
      supplierNotes: quote.supplierNotes || ''
    });

    // Populate quoted items
    if (quote.items && quote.items.length > 0) {
      setQuotedItems(quote.items.map(item => ({
        ...item,
        id: item.id || item._id
      })));
      setTotalAmount(quote.totalAmount || 0);
    }
    
    setCurrentStep(1); // Move to review step
  };

  const handleItemPriceChange = (index, field, value) => {
    const updatedItems = [...quotedItems];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value
    };

    // Recalculate total price for the item
    if (field === 'unitPrice' || field === 'quantity') {
      const unitPrice = field === 'unitPrice' ? value : updatedItems[index].unitPrice;
      const quantity = field === 'quantity' ? value : updatedItems[index].quantity;
      updatedItems[index].totalPrice = (unitPrice || 0) * (quantity || 0);
    }

    setQuotedItems(updatedItems);
    
    // Recalculate total amount
    const newTotal = updatedItems.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
    setTotalAmount(newTotal);
  };

  const validateStep = async (step) => {
    try {
      switch (step) {
        case 0: // Supplier Information
          await form.validateFields([
            'supplierInfo.companyName',
            'supplierInfo.contactPerson', 
            'supplierInfo.email',
            'supplierInfo.phone'
          ]);
          return true;

        case 1: // Items Pricing
          const hasValidPrices = quotedItems.every(item => 
            item.unitPrice > 0 && item.totalPrice > 0
          );
          if (!hasValidPrices) {
            message.error('Please provide unit prices for all items');
            return false;
          }
          if (totalAmount <= 0) {
            message.error('Total amount must be greater than zero');
            return false;
          }
          return true;

        case 2: // Terms & Conditions
          await form.validateFields([
            'deliveryTime',
            'paymentTerms',
            'warranty',
            'termsAccepted'
          ]);
          return true;

        default:
          return true;
      }
    } catch (error) {
      return false;
    }
  };

  const handleNext = async () => {
    const isValid = await validateStep(currentStep);
    if (isValid) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async () => {
    try {
      const isValid = await validateStep(2);
      if (!isValid) return;

      setSubmitting(true);

      const formValues = form.getFieldsValue();
      
      const quoteData = {
        supplierInfo: formValues.supplierInfo,
        quotedItems: quotedItems.map(item => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
          specifications: item.specifications,
          brand: item.brand || '',
          model: item.model || '',
          warranty: item.warranty || formValues.warranty,
          deliveryTime: item.deliveryTime || formValues.deliveryTime
        })),
        totalAmount,
        deliveryTime: formValues.deliveryTime,
        deliveryTimeUnit: formValues.deliveryTimeUnit,
        paymentTerms: formValues.paymentTerms,
        warranty: formValues.warranty,
        validityPeriod: formValues.validityPeriod,
        supplierNotes: formValues.supplierNotes,
        termsAccepted: formValues.termsAccepted
      };

      const response = await fetch(`/api/external-quote/${token}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(quoteData)
      });

      const result = await response.json();

      if (result.success) {
        message.success('Quote submitted successfully!');
        
        // Show success modal
        Modal.success({
          title: 'Quote Submitted Successfully!',
          content: (
            <div>
              <p>Your quote has been submitted and is being reviewed by the procurement team.</p>
              <Descriptions column={1} size="small">
                <Descriptions.Item label="Quote Number">{result.data.quoteNumber}</Descriptions.Item>
                <Descriptions.Item label="Total Amount">XAF {result.data.totalAmount.toLocaleString()}</Descriptions.Item>
                <Descriptions.Item label="Submission Date">
                  {moment(result.data.submissionDate).format('MMM DD, YYYY HH:mm')}
                </Descriptions.Item>
                <Descriptions.Item label="Valid Until">
                  {moment(result.data.validUntil).format('MMM DD, YYYY')}
                </Descriptions.Item>
              </Descriptions>
              <Alert 
                message="What happens next?" 
                description="The procurement team will evaluate your quote and notify you of the results. You can modify your quote using this same link until the validity period expires."
                type="info" 
                showIcon 
                style={{ marginTop: '16px' }}
              />
            </div>
          ),
          width: 600,
          onOk: () => {
            // Refresh to show updated status
            loadRFQData(token);
            setCurrentStep(3); // Move to confirmation step
          }
        });
        
      } else {
        message.error(result.message || 'Failed to submit quote');
      }
    } catch (error) {
      console.error('Submit quote error:', error);
      message.error('Failed to submit quote. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const itemColumns = [
    {
      title: 'Item',
      key: 'item',
      render: (_, record, index) => (
        <div>
          <Text strong>{record.description}</Text>
          <div>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              Qty: {record.quantity} {record.unit}
            </Text>
          </div>
          {record.specifications && (
            <div>
              <Text type="secondary" style={{ fontSize: '11px' }}>
                {record.specifications}
              </Text>
            </div>
          )}
        </div>
      ),
      width: 200
    },
    {
      title: 'Unit Price (XAF)',
      key: 'unitPrice',
      render: (_, record, index) => (
        <InputNumber
          value={record.unitPrice}
          onChange={(value) => handleItemPriceChange(index, 'unitPrice', value)}
          min={0}
          precision={0}
          formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
          parser={value => value.replace(/\$\s?|(,*)/g, '')}
          style={{ width: '100%' }}
          placeholder="Enter price"
        />
      ),
      width: 120
    },
    {
      title: 'Total Price (XAF)',
      key: 'totalPrice',
      render: (_, record) => (
        <Text strong style={{ color: '#1890ff' }}>
          {record.totalPrice ? `XAF ${record.totalPrice.toLocaleString()}` : 'XAF 0'}
        </Text>
      ),
      width: 120
    },
    {
      title: 'Brand/Model',
      key: 'brand',
      render: (_, record, index) => (
        <Space direction="vertical" size="small" style={{ width: '100%' }}>
          <Input
            placeholder="Brand"
            value={record.brand}
            onChange={(e) => handleItemPriceChange(index, 'brand', e.target.value)}
            size="small"
          />
          <Input
            placeholder="Model"
            value={record.model}
            onChange={(e) => handleItemPriceChange(index, 'model', e.target.value)}
            size="small"
          />
        </Space>
      ),
      width: 120
    },
    {
      title: 'Warranty',
      key: 'warranty',
      render: (_, record, index) => (
        <Input
          placeholder="e.g., 1 year"
          value={record.warranty}
          onChange={(e) => handleItemPriceChange(index, 'warranty', e.target.value)}
          size="small"
        />
      ),
      width: 100
    }
  ];

  const renderSupplierInfoStep = () => (
    <Card title="Supplier Information" bordered={false}>
      <Alert
        message="Please provide your company information"
        description="This information will be used to contact you and process your quote."
        type="info"
        showIcon
        style={{ marginBottom: '24px' }}
      />
      
      <Row gutter={[16, 16]}>
        <Col span={12}>
          <Form.Item
            name={['supplierInfo', 'companyName']}
            label="Company Name"
            rules={[{ required: true, message: 'Company name is required' }]}
          >
            <Input prefix={<GlobalOutlined />} placeholder="Your Company Name" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name={['supplierInfo', 'contactPerson']}
            label="Contact Person"
            rules={[{ required: true, message: 'Contact person is required' }]}
          >
            <Input placeholder="Full Name" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name={['supplierInfo', 'email']}
            label="Email Address"
            rules={[
              { required: true, message: 'Email is required' },
              { type: 'email', message: 'Please enter a valid email' }
            ]}
          >
            <Input prefix={<MailOutlined />} placeholder="your.email@company.com" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name={['supplierInfo', 'phone']}
            label="Phone Number"
            rules={[{ required: true, message: 'Phone number is required' }]}
          >
            <Input prefix={<PhoneOutlined />} placeholder="+237 6XX XXX XXX" />
          </Form.Item>
        </Col>
        <Col span={24}>
          <Form.Item
            name={['supplierInfo', 'address']}
            label="Business Address"
          >
            <TextArea 
              placeholder="Complete business address including city and country"
              rows={3}
            />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name={['supplierInfo', 'preferredContactMethod']}
            label="Preferred Contact Method"
            initialValue="email"
          >
            <Select>
              <Option value="email">Email</Option>
              <Option value="phone">Phone</Option>
              <Option value="both">Both Email and Phone</Option>
            </Select>
          </Form.Item>
        </Col>
      </Row>
    </Card>
  );

  const renderItemsPricingStep = () => (
    <div>
      <Card title="Items Pricing" bordered={false}>
        <Alert
          message="Price Calculation"
          description="Enter unit prices for each item. Total prices will be calculated automatically."
          type="info"
          showIcon
          style={{ marginBottom: '16px' }}
        />
        
        <Table
          columns={itemColumns}
          dataSource={quotedItems}
          rowKey="id"
          pagination={false}
          size="small"
          scroll={{ x: 'max-content' }}
        />
        
        <div style={{ 
          marginTop: '16px', 
          padding: '16px', 
          backgroundColor: '#f6ffed',
          borderRadius: '8px',
          border: '1px solid #b7eb8f'
        }}>
          <Row justify="space-between" align="middle">
            <Col>
              <Space>
                <CalculatorOutlined style={{ color: '#52c41a' }} />
                <Text strong>Quote Summary</Text>
              </Space>
            </Col>
            <Col>
              <Text strong style={{ fontSize: '18px', color: '#52c41a' }}>
                Total Amount: XAF {totalAmount.toLocaleString()}
              </Text>
            </Col>
          </Row>
        </div>
      </Card>
    </div>
  );

  const renderTermsStep = () => (
    <div>
      <Card title="Terms & Conditions" bordered={false}>
        <Row gutter={[16, 16]}>
          <Col span={12}>
            <Form.Item
              name="deliveryTime"
              label="Delivery Time"
              rules={[{ required: true, message: 'Delivery time is required' }]}
            >
              <InputNumber 
                min={1}
                style={{ width: '70%' }}
                placeholder="7"
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="deliveryTimeUnit"
              label="Time Unit"
              initialValue="days"
            >
              <Select style={{ width: '100%' }}>
                <Option value="days">Days</Option>
                <Option value="weeks">Weeks</Option>
                <Option value="months">Months</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="paymentTerms"
              label="Payment Terms"
              rules={[{ required: true, message: 'Payment terms are required' }]}
            >
              <Select>
                <Option value="Cash on delivery">Cash on Delivery</Option>
                <Option value="15 days">15 Days</Option>
                <Option value="30 days">30 Days</Option>
                <Option value="45 days">45 Days</Option>
                <Option value="60 days">60 Days</Option>
                <Option value="Advance payment">Advance Payment Required</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="validityPeriod"
              label="Quote Validity (Days)"
              initialValue={30}
            >
              <InputNumber min={7} max={90} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item
              name="warranty"
              label="Warranty Information"
              rules={[{ required: true, message: 'Warranty information is required' }]}
            >
              <TextArea 
                placeholder="e.g., 1 year manufacturer warranty, 6 months parts and labor..."
                rows={2}
              />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item
              name="supplierNotes"
              label="Additional Notes (Optional)"
            >
              <TextArea 
                placeholder="Any additional information, special conditions, or notes you'd like to include with your quote..."
                rows={3}
              />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item
              name="termsAccepted"
              valuePropName="checked"
              rules={[
                { 
                  required: true,
                  transform: (value) => value || undefined,
                  type: 'boolean',
                  message: 'You must accept the terms and conditions'
                }
              ]}
            >
              <Checkbox>
                <Text>
                  I confirm that all information provided is accurate and I accept the 
                  <Button type="link" style={{ padding: '0 4px' }}>
                    terms and conditions
                  </Button>
                  for this quotation process.
                </Text>
              </Checkbox>
            </Form.Item>
          </Col>
        </Row>
      </Card>
    </div>
  );

  const renderConfirmationStep = () => (
    <div style={{ textAlign: 'center', padding: '40px 0' }}>
      <CheckCircleOutlined 
        style={{ 
          fontSize: '64px', 
          color: '#52c41a',
          marginBottom: '16px'
        }} 
      />
      <Title level={2} style={{ color: '#52c41a' }}>
        Quote Submitted Successfully!
      </Title>
      <Paragraph style={{ fontSize: '16px', marginBottom: '24px' }}>
        Thank you for submitting your quote. The procurement team will review your 
        submission and notify you of the results.
      </Paragraph>
      
      {existingQuote && (
        <Card style={{ maxWidth: 500, margin: '0 auto' }}>
          <Descriptions title="Quote Details" column={1}>
            <Descriptions.Item label="Quote Number">
              {existingQuote.quoteNumber}
            </Descriptions.Item>
            <Descriptions.Item label="Total Amount">
              XAF {existingQuote.totalAmount?.toLocaleString()}
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              <Tag color="blue">{existingQuote.status}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Submission Date">
              {moment(existingQuote.submissionDate).format('MMM DD, YYYY HH:mm')}
            </Descriptions.Item>
          </Descriptions>
        </Card>
      )}
    </div>
  );

  const steps = [
    {
      title: 'Supplier Info',
      description: 'Contact Details',
      content: renderSupplierInfoStep
    },
    {
      title: 'Pricing',
      description: 'Item Prices',
      content: renderItemsPricingStep
    },
    {
      title: 'Terms',
      description: 'Conditions',
      content: renderTermsStep
    },
    {
      title: 'Complete',
      description: 'Confirmation',
      content: renderConfirmationStep
    }
  ];

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '50vh' 
      }}>
        <Spin size="large" tip="Loading RFQ details..." />
      </div>
    );
  }

  if (!rfqData) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <ExclamationCircleOutlined 
          style={{ fontSize: '48px', color: '#ff4d4f', marginBottom: '16px' }} 
        />
        <Title level={3}>RFQ Not Found</Title>
        <Paragraph>
          The RFQ invitation link is invalid or has expired.
        </Paragraph>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
      {/* Header */}
      <Card style={{ marginBottom: '24px' }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={3} style={{ margin: 0 }}>
              <FileTextOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
              {rfqData.rfq.title}
            </Title>
            <Text type="secondary">
              RFQ Number: {rfqData.rfq.rfqNumber} | 
              Invited Company: {rfqData.invitation.companyName}
            </Text>
          </Col>
          <Col>
            {timeRemaining && (
              <div style={{ textAlign: 'right' }}>
                <div>
                  <ClockCircleOutlined style={{ color: timeRemaining.total < 86400000 ? '#ff4d4f' : '#1890ff' }} />
                  <Text 
                    style={{ 
                      marginLeft: '8px',
                      color: timeRemaining.total < 86400000 ? '#ff4d4f' : '#1890ff',
                      fontWeight: 'bold'
                    }}
                  >
                    {timeRemaining.days}d {timeRemaining.hours}h {timeRemaining.minutes}m remaining
                  </Text>
                </div>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  Deadline: {moment(rfqData.rfq.responseDeadline).format('MMM DD, YYYY HH:mm')}
                </Text>
              </div>
            )}
          </Col>
        </Row>
      </Card>

      {/* Existing Quote Alert */}
      {existingQuote && currentStep < 3 && (
        <Alert
          message="Existing Quote Found"
          description={`You have already submitted a quote (${existingQuote.quoteNumber}) for this RFQ. You can review and modify it below.`}
          type="info"
          showIcon
          action={
            <Button size="small" onClick={() => setCurrentStep(3)}>
              View Status
            </Button>
          }
          style={{ marginBottom: '24px' }}
        />
      )}

      {/* Time Remaining Alert */}
      {timeRemaining && timeRemaining.total < 86400000 && timeRemaining.total > 0 && (
        <Alert
          message="Deadline Approaching!"
          description="Less than 24 hours remaining to submit your quote."
          type="warning"
          showIcon
          style={{ marginBottom: '24px' }}
        />
      )}

      {timeRemaining && timeRemaining.total <= 0 && (
        <Alert
          message="Quote Deadline Passed"
          description="The deadline for this RFQ has passed. Quote submissions are no longer accepted."
          type="error"
          showIcon
          style={{ marginBottom: '24px' }}
        />
      )}

      {/* Steps */}
      <Card style={{ marginBottom: '24px' }}>
        <Steps 
          current={currentStep} 
          items={steps.map((step, index) => ({
            title: step.title,
            description: step.description,
            status: index === currentStep ? 'process' : 
                   index < currentStep ? 'finish' : 'wait'
          }))}
        />
      </Card>

      {/* Form Content */}
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        style={{ marginBottom: '24px' }}
      >
        {steps[currentStep].content()}
      </Form>

      {/* Navigation Buttons */}
      {timeRemaining && timeRemaining.total > 0 && currentStep < 3 && (
        <Card>
          <Row justify="space-between">
            <Col>
              {currentStep > 0 && (
                <Button onClick={handlePrevious}>
                  Previous
                </Button>
              )}
            </Col>
            <Col>
              <Space>
                <Text type="secondary">
                  Step {currentStep + 1} of {steps.length}
                </Text>
                {currentStep < 2 ? (
                  <Button 
                    type="primary" 
                    onClick={handleNext}
                    loading={loading}
                  >
                    Next
                  </Button>
                ) : (
                  <Button
                    type="primary"
                    onClick={handleSubmit}
                    loading={submitting}
                    icon={<SendOutlined />}
                  >
                    Submit Quote
                  </Button>
                )}
              </Space>
            </Col>
          </Row>
        </Card>
      )}

      {/* RFQ Details Sidebar */}
      <Card 
        title="RFQ Details" 
        size="small" 
        style={{ marginTop: '24px' }}
        extra={
          <Button 
            type="link" 
            size="small"
            onClick={() => {
              Modal.info({
                title: 'Complete RFQ Details',
                width: 800,
                content: (
                  <div>
                    <Descriptions column={1} size="small">
                      <Descriptions.Item label="Title">{rfqData.rfq.title}</Descriptions.Item>
                      <Descriptions.Item label="Description">{rfqData.rfq.description}</Descriptions.Item>
                      <Descriptions.Item label="Buyer">{rfqData.buyer.name}</Descriptions.Item>
                      <Descriptions.Item label="Expected Delivery">
                        {moment(rfqData.rfq.expectedDeliveryDate).format('MMM DD, YYYY')}
                      </Descriptions.Item>
                      <Descriptions.Item label="Delivery Location">{rfqData.rfq.deliveryLocation}</Descriptions.Item>
                      <Descriptions.Item label="Payment Terms">{rfqData.rfq.paymentTerms}</Descriptions.Item>
                      {rfqData.rfq.specialRequirements && (
                        <Descriptions.Item label="Special Requirements">
                          {rfqData.rfq.specialRequirements}
                        </Descriptions.Item>
                      )}
                    </Descriptions>
                  </div>
                )
              });
            }}
          >
            View Full Details
          </Button>
        }
      >
        <Descriptions column={1} size="small">
          <Descriptions.Item label="Delivery Location">
            <TruckOutlined style={{ marginRight: '4px' }} />
            {rfqData.rfq.deliveryLocation}
          </Descriptions.Item>
          <Descriptions.Item label="Expected Delivery">
            {moment(rfqData.rfq.expectedDeliveryDate).format('MMM DD, YYYY')}
          </Descriptions.Item>
          <Descriptions.Item label="Payment Terms">
            <DollarOutlined style={{ marginRight: '4px' }} />
            {rfqData.rfq.paymentTerms}
          </Descriptions.Item>
        </Descriptions>
      </Card>
    </div>
  );
};

export default ExternalQuoteForm;







