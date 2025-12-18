import React, { useState, useEffect } from 'react';
import {
  Modal,
  Form,
  InputNumber,
  Input,
  Space,
  Typography,
  Alert,
  Row,
  Col,
  Statistic,
  Progress,
  Divider
} from 'antd';
import {
  DollarOutlined,
  WarningOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';

const { Text } = Typography;
const { TextArea } = Input;

const DisbursementModal = ({ visible, request, onSubmit, onCancel }) => {
  const [form] = Form.useForm();
  const [disbursementAmount, setDisbursementAmount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && request) {
      const remaining = request.remainingBalance || request.amountApproved || request.amountRequested || 0;
      setDisbursementAmount(remaining);
      form.setFieldsValue({
        amount: remaining,
        notes: ''
      });
    }
  }, [visible, request, form]);

  if (!request) return null;

  const approvedAmount = request.amountApproved || request.amountRequested || 0;
  const totalDisbursed = request.totalDisbursed || 0;
  const remainingBalance = request.remainingBalance || approvedAmount;
  const currentProgress = approvedAmount > 0 ? Math.round((totalDisbursed / approvedAmount) * 100) : 0;

  const handleAmountChange = (value) => {
    setDisbursementAmount(value || 0);
  };

  const handleSubmit = async () => {
    try {
      await form.validateFields();
      setLoading(true);

      const values = form.getFieldsValue();
      await onSubmit({
        requestId: request._id,
        amount: values.amount,
        notes: values.notes || ''
      });

      form.resetFields();
      setLoading(false);
    } catch (error) {
      console.error('Validation failed:', error);
      setLoading(false);
    }
  };

  const newProgress = approvedAmount > 0 
    ? Math.round(((totalDisbursed + disbursementAmount) / approvedAmount) * 100) 
    : 0;
  const isFullDisbursement = newProgress === 100;

  return (
    <Modal
      title={
        <Space>
          <DollarOutlined style={{ color: '#1890ff' }} />
          <span>Process Disbursement</span>
        </Space>
      }
      open={visible}
      onOk={handleSubmit}
      onCancel={() => {
        form.resetFields();
        onCancel();
      }}
      confirmLoading={loading}
      width={600}
      okText={isFullDisbursement ? 'Complete Disbursement' : 'Disburse Partial Amount'}
      cancelText="Cancel"
    >
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        {/* Request Info */}
        <Alert
          message={
            <div>
              <Text strong>Request ID: </Text>
              <Text>REQ-{request._id?.toString().slice(-6).toUpperCase()}</Text>
              <br />
              <Text strong>Employee: </Text>
              <Text>{request.employee?.fullName}</Text>
            </div>
          }
          type="info"
          showIcon
        />

        {/* Current Status */}
        <Row gutter={16}>
          <Col span={8}>
            <Statistic
              title="Approved Amount"
              value={approvedAmount}
              precision={0}
              valueStyle={{ color: '#3f8600', fontSize: '16px' }}
              prefix="XAF"
            />
          </Col>
          <Col span={8}>
            <Statistic
              title="Already Disbursed"
              value={totalDisbursed}
              precision={0}
              valueStyle={{ color: '#1890ff', fontSize: '16px' }}
              prefix="XAF"
            />
          </Col>
          <Col span={8}>
            <Statistic
              title="Remaining"
              value={remainingBalance}
              precision={0}
              valueStyle={{ color: '#cf1322', fontSize: '16px' }}
              prefix="XAF"
            />
          </Col>
        </Row>

        <div>
          <Text type="secondary" style={{ fontSize: '12px' }}>Current Progress:</Text>
          <Progress 
            percent={currentProgress} 
            status={currentProgress === 100 ? 'success' : 'active'}
            strokeColor="#1890ff"
          />
        </div>

        <Divider style={{ margin: '12px 0' }} />

        {/* Disbursement Form */}
        <Form form={form} layout="vertical">
          <Form.Item
            name="amount"
            label="Disbursement Amount (XAF)"
            rules={[
              { required: true, message: 'Please enter disbursement amount' },
              {
                validator: (_, value) => {
                  if (value <= 0) {
                    return Promise.reject('Amount must be greater than 0');
                  }
                  if (value > remainingBalance) {
                    return Promise.reject(
                      `Amount cannot exceed remaining balance (XAF ${remainingBalance.toLocaleString()})`
                    );
                  }
                  return Promise.resolve();
                }
              }
            ]}
          >
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              max={remainingBalance}
              step={1000}
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(value) => value.replace(/,/g, '')}
              onChange={handleAmountChange}
            />
          </Form.Item>

          <Space direction="vertical" style={{ width: '100%' }} size="small">
            <Space>
              <Text strong>Quick Actions:</Text>
            </Space>
            <Space wrap>
              <a onClick={() => {
                form.setFieldsValue({ amount: remainingBalance });
                setDisbursementAmount(remainingBalance);
              }}>
                Full Amount (XAF {remainingBalance.toLocaleString()})
              </a>
              <a onClick={() => {
                const halfAmount = Math.floor(remainingBalance / 2);
                form.setFieldsValue({ amount: halfAmount });
                setDisbursementAmount(halfAmount);
              }}>
                50% (XAF {Math.floor(remainingBalance / 2).toLocaleString()})
              </a>
              <a onClick={() => {
                const quarterAmount = Math.floor(remainingBalance / 4);
                form.setFieldsValue({ amount: quarterAmount });
                setDisbursementAmount(quarterAmount);
              }}>
                25% (XAF {Math.floor(remainingBalance / 4).toLocaleString()})
              </a>
            </Space>
          </Space>

          <Form.Item
            name="notes"
            label="Notes (Optional)"
            style={{ marginTop: '16px' }}
          >
            <TextArea
              rows={3}
              placeholder="Add any notes about this disbursement..."
              maxLength={200}
              showCount
            />
          </Form.Item>
        </Form>

        {/* Preview */}
        {disbursementAmount > 0 && (
          <Alert
            message={
              <div>
                <Text strong>After this disbursement:</Text>
                <br />
                <Text>Total Disbursed: XAF {(totalDisbursed + disbursementAmount).toLocaleString()}</Text>
                <br />
                <Text>Remaining: XAF {(remainingBalance - disbursementAmount).toLocaleString()}</Text>
                <br />
                <Text>Progress: {newProgress}%</Text>
              </div>
            }
            type={isFullDisbursement ? 'success' : 'warning'}
            icon={isFullDisbursement ? <InfoCircleOutlined /> : <WarningOutlined />}
            showIcon
            style={{ marginTop: '8px' }}
          />
        )}
      </Space>
    </Modal>
  );
};

export default DisbursementModal;