import React, { useState, useEffect } from 'react';
import {
  Modal,
  Form,
  Select,
  InputNumber,
  Input,
  Radio,
  Alert,
  Space,
  Typography,
  Divider,
  Card,
  Tag,
  message
} from 'antd';
import {
  BankOutlined,
  DollarOutlined,
  ExclamationCircleOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import { supplyChainAPI } from '../../services/supplyChainAPI';

const { Option } = Select;
const { TextArea } = Input;
const { Text } = Typography;

const SupplyChainReviewComponent = ({ 
  visible, 
  requisition, 
  onClose, 
  onSuccess 
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [buyers, setBuyers] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('bank');
  const [paymentMethodInfo, setPaymentMethodInfo] = useState(null);

  useEffect(() => {
    if (visible && requisition) {
      loadBuyers();
      loadPaymentMethodOptions();
      
      // Set default values
      form.setFieldsValue({
        paymentMethod: 'bank', // Default to bank
        estimatedCost: requisition.budgetXAF,
        sourcingType: 'quotation_required',
        purchaseTypeAssigned: requisition.purchaseType || 'standard'
      });
    }
  }, [visible, requisition]);

  const loadBuyers = async () => {
    try {
      const response = await supplyChainAPI.getAvailableBuyers();
      if (response.success) {
        setBuyers(response.data || []);
      }
    } catch (error) {
      console.error('Error loading buyers:', error);
      message.error('Failed to load buyers');
    }
  };

  const loadPaymentMethodOptions = async () => {
    try {
      const response = await supplyChainAPI.getPaymentMethodOptions(requisition.id);
      if (response.success) {
        setPaymentMethodInfo(response.data);
        
        // Auto-select if only one option available
        if (response.data.availableMethods.length === 1) {
          form.setFieldsValue({
            paymentMethod: response.data.availableMethods[0]
          });
          setPaymentMethod(response.data.availableMethods[0]);
        }
      }
    } catch (error) {
      console.error('Error loading payment method options:', error);
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const response = await supplyChainAPI.assignBuyerWithPaymentMethod(
        requisition.id,
        values
      );

      if (response.success) {
        message.success(
          `Buyer assigned successfully with ${values.paymentMethod === 'cash' ? 'petty cash' : 'bank'} payment method`
        );
        form.resetFields();
        onSuccess();
        onClose();
      } else {
        message.error(response.message || 'Failed to assign buyer');
      }
    } catch (error) {
      console.error('Error assigning buyer:', error);
      message.error('Failed to assign buyer');
    } finally {
      setLoading(false);
    }
  };

  const renderPaymentMethodAlert = () => {
    if (!paymentMethodInfo) return null;

    const amount = requisition.budgetXAF;
    const isOverCashLimit = amount > paymentMethodInfo.limits.cash.maximum;
    const isOverCashRecommended = amount > paymentMethodInfo.limits.cash.recommended;

    if (isOverCashLimit) {
      return (
        <Alert
          message="Bank Payment Required"
          description={`Amount (XAF ${amount.toLocaleString()}) exceeds petty cash limit. Bank payment is mandatory.`}
          type="error"
          showIcon
          icon={<ExclamationCircleOutlined />}
          style={{ marginBottom: '16px' }}
        />
      );
    }

    if (isOverCashRecommended) {
      return (
        <Alert
          message="Bank Payment Recommended"
          description={`Amount (XAF ${amount.toLocaleString()}) exceeds recommended petty cash limit. Bank payment is recommended for better tracking.`}
          type="warning"
          showIcon
          icon={<ExclamationCircleOutlined />}
          style={{ marginBottom: '16px' }}
        />
      );
    }

    return (
      <Alert
        message="Payment Method Selection"
        description={`Amount: XAF ${amount.toLocaleString()}. Both payment methods are available for this requisition.`}
        type="info"
        showIcon
        icon={<InfoCircleOutlined />}
        style={{ marginBottom: '16px' }}
      />
    );
  };

  const renderPaymentMethodDetails = () => {
    if (!paymentMethod) return null;

    const details = {
      bank: {
        icon: <BankOutlined style={{ fontSize: '24px', color: '#1890ff' }} />,
        title: 'Bank Transfer Payment',
        description: 'Standard procurement process with bank transfer',
        features: [
          'Full RFQ process available',
          'Multiple supplier quotes',
          'Formal purchase order generation',
          'Bank transfer payment processing',
          'Complete audit trail'
        ],
        color: '#e6f7ff',
        borderColor: '#1890ff'
      },
      cash: {
        icon: <DollarOutlined style={{ fontSize: '24px', color: '#faad14' }} />,
        title: 'Petty Cash Payment',
        description: 'Simplified process with petty cash disbursement',
        features: [
          'Petty cash form auto-generated after Head approval',
          'Buyer downloads pre-approved form',
          'Direct cash disbursement to employee',
          'RFQ optional (can be used if needed)',
          'Simplified documentation'
        ],
        color: '#fffbe6',
        borderColor: '#faad14'
      }
    };

    const methodDetails = details[paymentMethod];

    return (
      <Card
        size="small"
        style={{
          backgroundColor: methodDetails.color,
          borderColor: methodDetails.borderColor,
          borderWidth: '2px',
          marginTop: '16px'
        }}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <Space>
            {methodDetails.icon}
            <div>
              <Text strong style={{ fontSize: '16px' }}>{methodDetails.title}</Text>
              <br />
              <Text type="secondary" style={{ fontSize: '12px' }}>
                {methodDetails.description}
              </Text>
            </div>
          </Space>
          
          <Divider style={{ margin: '12px 0' }} />
          
          <div>
            <Text strong>Process Features:</Text>
            <ul style={{ marginTop: '8px', marginBottom: '0' }}>
              {methodDetails.features.map((feature, index) => (
                <li key={index} style={{ fontSize: '13px', marginBottom: '4px' }}>
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        </Space>
      </Card>
    );
  };

  return (
    <Modal
      title="Assign Buyer and Payment Method"
      open={visible}
      onCancel={onClose}
      onOk={handleSubmit}
      okText="Assign Buyer"
      confirmLoading={loading}
      width={700}
      destroyOnClose
    >
      {requisition && (
        <div>
          {/* Requisition Summary */}
          <Card size="small" style={{ marginBottom: '16px', backgroundColor: '#fafafa' }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <Text strong>Requisition:</Text> {requisition.title}
              </div>
              <div>
                <Text strong>Requester:</Text> {requisition.requester}
              </div>
              <div>
                <Text strong>Amount:</Text>{' '}
                <Text strong style={{ color: '#1890ff' }}>
                  XAF {requisition.budgetXAF?.toLocaleString()}
                </Text>
              </div>
              <div>
                <Text strong>Category:</Text> <Tag>{requisition.itemCategory}</Tag>
              </div>
            </Space>
          </Card>

          {/* Payment Method Alert */}
          {renderPaymentMethodAlert()}

          {/* Form */}
          <Form form={form} layout="vertical">
            {/* Payment Method Selection */}
            <Form.Item
              name="paymentMethod"
              label={
                <Space>
                  <span>Payment Method</span>
                  <Tag color="red">Required</Tag>
                </Space>
              }
              rules={[{ required: true, message: 'Please select payment method' }]}
              extra="Select how this requisition will be paid"
            >
              <Radio.Group
                onChange={(e) => setPaymentMethod(e.target.value)}
                buttonStyle="solid"
                style={{ width: '100%' }}
                disabled={
                  paymentMethodInfo?.availableMethods.length === 1
                }
              >
                <Space direction="vertical" style={{ width: '100%' }}>
                  {(!paymentMethodInfo || paymentMethodInfo.availableMethods.includes('bank')) && (
                    <Radio.Button value="bank" style={{ width: '100%', height: 'auto', padding: '12px' }}>
                      <Space>
                        <BankOutlined style={{ fontSize: '20px' }} />
                        <div>
                          <div><Text strong>Bank Transfer</Text></div>
                          <div><Text type="secondary" style={{ fontSize: '12px' }}>
                            Standard procurement with full RFQ process
                          </Text></div>
                        </div>
                        {paymentMethodInfo?.recommendedMethod === 'bank' && (
                          <Tag color="blue">Recommended</Tag>
                        )}
                      </Space>
                    </Radio.Button>
                  )}
                  
                  {(!paymentMethodInfo || paymentMethodInfo.availableMethods.includes('cash')) && (
                    <Radio.Button value="cash" style={{ width: '100%', height: 'auto', padding: '12px' }}>
                      <Space>
                        <DollarOutlined style={{ fontSize: '20px' }} />
                        <div>
                          <div><Text strong>Petty Cash</Text></div>
                          <div><Text type="secondary" style={{ fontSize: '12px' }}>
                            Simplified process with auto-generated form
                          </Text></div>
                        </div>
                        {paymentMethodInfo?.recommendedMethod === 'cash' && (
                          <Tag color="orange">Recommended</Tag>
                        )}
                      </Space>
                    </Radio.Button>
                  )}
                </Space>
              </Radio.Group>
            </Form.Item>

            {/* Payment Method Details */}
            {renderPaymentMethodDetails()}

            <Divider />

            {/* Buyer Selection */}
            <Form.Item
              name="buyerId"
              label="Assign Buyer"
              rules={[{ required: true, message: 'Please select a buyer' }]}
              extra="Select the buyer who will handle this procurement"
            >
              <Select
                placeholder="Select buyer"
                showSearch
                optionFilterProp="children"
                filterOption={(input, option) =>
                  option.children.toLowerCase().includes(input.toLowerCase())
                }
              >
                {buyers.map(buyer => (
                  <Option key={buyer.id} value={buyer.id}>
                    <Space>
                      <span>{buyer.name}</span>
                      {buyer.specializations && buyer.specializations.length > 0 && (
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          ({buyer.specializations.join(', ')})
                        </Text>
                      )}
                      {buyer.currentWorkload && (
                        <Tag color={buyer.currentWorkload > 80 ? 'red' : 'green'}>
                          {buyer.currentWorkload}% capacity
                        </Tag>
                      )}
                    </Space>
                  </Option>
                ))}
              </Select>
            </Form.Item>

            {/* Additional Fields */}
            <Form.Item
              name="estimatedCost"
              label="Estimated Cost (XAF)"
              rules={[{ required: true, message: 'Please enter estimated cost' }]}
            >
              <InputNumber
                style={{ width: '100%' }}
                formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={value => value.replace(/\$\s?|(,*)/g, '')}
                min={0}
              />
            </Form.Item>

            <Form.Item
              name="sourcingType"
              label="Sourcing Type"
              rules={[{ required: true, message: 'Please select sourcing type' }]}
            >
              <Select>
                <Option value="direct_purchase">Direct Purchase</Option>
                <Option value="quotation_required">Quotation Required</Option>
                <Option value="tender_process">Tender Process</Option>
                <Option value="framework_agreement">Framework Agreement</Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="purchaseTypeAssigned"
              label="Purchase Type"
            >
              <Select>
                <Option value="standard">Standard</Option>
                <Option value="non_standard">Non-Standard</Option>
                <Option value="emergency">Emergency</Option>
                <Option value="framework">Framework</Option>
                <Option value="capital">Capital</Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="comments"
              label="Comments (Optional)"
            >
              <TextArea
                rows={3}
                placeholder="Add any special instructions or notes for the buyer..."
              />
            </Form.Item>
          </Form>

          {/* Warning for Cash Payment */}
          {paymentMethod === 'cash' && (
            <Alert
              message="Petty Cash Process"
              description={
                <div>
                  <p>When you assign a buyer with petty cash payment:</p>
                  <ol style={{ marginBottom: 0, paddingLeft: '20px' }}>
                    <li>The requisition will go to Head of Business for final approval</li>
                    <li>Upon Head approval, a petty cash form will be automatically generated</li>
                    <li>The assigned buyer will be notified and can download the form</li>
                    <li>The buyer can optionally create an RFQ if needed</li>
                    <li>After form download, the process is complete (no payment proof needed)</li>
                  </ol>
                </div>
              }
              type="info"
              showIcon
              style={{ marginTop: '16px' }}
            />
          )}
        </div>
      )}
    </Modal>
  );
};

export default SupplyChainReviewComponent;