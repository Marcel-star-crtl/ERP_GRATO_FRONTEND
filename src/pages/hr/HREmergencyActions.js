// src/pages/hr/HREmergencyActions.jsx
import React, { useState } from 'react';
import { 
  Modal, 
  Form, 
  Input, 
  Button, 
  Space, 
  Alert, 
  Radio,
  Checkbox,
  Tag,
  Descriptions,
  Divider,
  message 
} from 'antd';
import {
  ThunderboltOutlined,
  ArrowUpOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  SafetyCertificateOutlined
} from '@ant-design/icons';
import leaveApi from '../../services/leaveApi';
import dayjs from 'dayjs';

const { TextArea } = Input;

const HREmergencyActions = ({ 
  leave, 
  visible, 
  onClose, 
  onSuccess 
}) => {
  const [form] = Form.useForm();
  const [actionType, setActionType] = useState(null); // 'override', 'escalate', 'direct'
  const [loading, setLoading] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);

  if (!leave) return null;

  const isStuck = leaveApi.isLeaveStuck(leave);
  const canOverride = leaveApi.isEligibleForEmergencyOverride(leave);
  const canDirectApprove = leaveApi.isEligibleForDirectApproval(leave);

  const handleActionSelect = (type) => {
    setActionType(type);
    form.resetFields();
  };

  const handleSubmit = async (values) => {
    setConfirmVisible(false);
    setLoading(true);

    try {
      let response;

      switch (actionType) {
        case 'override':
          response = await leaveApi.hrEmergencyOverride(
            leave._id,
            values.reason,
            values.notifyAll !== false
          );
          message.success('Emergency override applied successfully');
          break;

        case 'escalate':
          response = await leaveApi.escalateStuckRequest(
            leave._id,
            values.reason,
            values.escalateTo || 'next_level'
          );
          message.success('Request escalated successfully');
          break;

        case 'direct':
          response = await leaveApi.hrDirectApproval(
            leave._id,
            values.reason,
            values.skipNotifications || false
          );
          message.success('Direct approval processed successfully');
          break;

        default:
          throw new Error('Invalid action type');
      }

      if (response.success) {
        if (response.notifications) {
          const { sent, failed } = response.notifications;
          if (sent > 0) message.info(`${sent} notification(s) sent`);
          if (failed > 0) message.warning(`${failed} notification(s) failed`);
        }
        
        form.resetFields();
        setActionType(null);
        onSuccess?.();
        onClose?.();
      }

    } catch (error) {
      console.error('Emergency action error:', error);
      message.error(error.response?.data?.message || 'Failed to process action');
    } finally {
      setLoading(false);
    }
  };

  const getCategoryTag = (category) => {
    const categoryMap = {
      'medical': { color: 'red', text: 'Medical' },
      'vacation': { color: 'blue', text: 'Vacation' },
      'emergency': { color: 'orange', text: 'Emergency' },
      'family': { color: 'green', text: 'Family' },
      'bereavement': { color: 'gray', text: 'Bereavement' },
      'study': { color: 'cyan', text: 'Study' }
    };

    const info = categoryMap[category] || { color: 'default', text: category };
    return <Tag color={info.color}>{info.text}</Tag>;
  };

  const getUrgencyTag = (urgency) => {
    const urgencyMap = {
      'critical': { color: 'red', text: 'Critical', icon: '🚨' },
      'high': { color: 'orange', text: 'High', icon: '⚡' },
      'medium': { color: 'yellow', text: 'Medium', icon: '⚠️' },
      'low': { color: 'green', text: 'Low', icon: '📝' }
    };

    const info = urgencyMap[urgency] || { color: 'default', text: urgency, icon: '📋' };
    return <Tag color={info.color}>{info.icon} {info.text}</Tag>;
  };

  const renderActionForm = () => {
    switch (actionType) {
      case 'override':
        return (
          <>
            <Alert
              message="⚡ Emergency Override"
              description="This will IMMEDIATELY APPROVE the leave request, bypassing all pending approvers. Use only for critical emergencies."
              type="warning"
              showIcon
              icon={<ThunderboltOutlined />}
              style={{ marginBottom: '16px' }}
            />

            <Form.Item
              name="reason"
              label="Override Reason"
              rules={[
                { required: true, message: 'Reason is required' },
                { min: 20, message: 'Reason must be at least 20 characters' }
              ]}
            >
              <TextArea
                rows={4}
                placeholder="Explain why emergency override is necessary (e.g., critical medical emergency, life-threatening situation, immediate family crisis)..."
                showCount
                maxLength={500}
              />
            </Form.Item>

            <Form.Item
              name="notifyAll"
              valuePropName="checked"
              initialValue={true}
            >
              <Checkbox>
                Notify all bypassed approvers about this override
              </Checkbox>
            </Form.Item>

            <Alert
              message="Bypassed Approvers"
              description={
                <div>
                  {leave.approvalChain
                    ?.filter(step => step.status === 'pending')
                    .map(step => (
                      <Tag key={step.level} color="orange" style={{ marginTop: '4px' }}>
                        {step.approver?.name} ({step.approver?.role})
                      </Tag>
                    ))
                  }
                </div>
              }
              type="info"
              style={{ marginTop: '16px' }}
            />
          </>
        );

      case 'escalate':
        return (
          <>
            <Alert
              message="📈 Escalate Request"
              description="Move this request to the next approval level or directly to admin. Original approver will be notified."
              type="info"
              showIcon
              icon={<ArrowUpOutlined />}
              style={{ marginBottom: '16px' }}
            />

            <Form.Item
              name="escalateTo"
              label="Escalate To"
              initialValue="next_level"
              rules={[{ required: true }]}
            >
              <Radio.Group>
                <Space direction="vertical">
                  <Radio value="next_level">
                    Next Level in Chain
                    {leave.currentPendingLevel && (
                      <span style={{ color: '#666', fontSize: '12px', marginLeft: '8px' }}>
                        (Current: {leave.currentPendingLevel.approverRole})
                      </span>
                    )}
                  </Radio>
                  <Radio value="admin">
                    Directly to Head of Business (Admin Override)
                  </Radio>
                </Space>
              </Radio.Group>
            </Form.Item>

            <Form.Item
              name="reason"
              label="Escalation Reason"
              rules={[
                { required: true, message: 'Reason is required' },
                { min: 10, message: 'Reason must be at least 10 characters' }
              ]}
            >
              <TextArea
                rows={3}
                placeholder="Why is escalation necessary? (e.g., approver unavailable, urgent deadline, excessive delay)..."
                showCount
                maxLength={300}
              />
            </Form.Item>

            {isStuck && (
              <Alert
                message={`⏰ Request has been pending for ${leave.currentPendingLevel?.hoursPending} hours`}
                type="warning"
                showIcon
                style={{ marginBottom: '16px' }}
              />
            )}
          </>
        );

      case 'direct':
        return (
          <>
            <Alert
              message="✅ Direct Approval"
              description="Approve this policy-compliant request directly, bypassing standard approval chain. For simple, low-risk cases only."
              type="success"
              showIcon
              icon={<CheckCircleOutlined />}
              style={{ marginBottom: '16px' }}
            />

            <Alert
              message="Policy Compliance Check"
              description={
                <div>
                  <div>✓ Duration: {leave.totalDays} days {leave.totalDays <= 3 ? '(Short)' : ''}</div>
                  <div>✓ Category: {leave.leaveCategory}</div>
                  {leave.medicalInfo?.medicalCertificate?.provided && (
                    <div>✓ Medical certificate provided</div>
                  )}
                  <div>✓ Urgency: {leave.urgency}</div>
                </div>
              }
              type="info"
              style={{ marginBottom: '16px' }}
            />

            <Form.Item
              name="reason"
              label="Approval Reason"
              rules={[
                { required: true, message: 'Reason is required' },
                { min: 10, message: 'Reason must be at least 10 characters' }
              ]}
            >
              <TextArea
                rows={3}
                placeholder="Why is direct approval appropriate? (e.g., meets all policy requirements, low impact, standard vacation request)..."
                showCount
                maxLength={300}
              />
            </Form.Item>

            <Form.Item
              name="skipNotifications"
              valuePropName="checked"
              initialValue={false}
            >
              <Checkbox>
                Skip notifications (silent approval)
              </Checkbox>
            </Form.Item>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <Modal
        title={
          <Space>
            <SafetyCertificateOutlined style={{ color: '#1890ff' }} />
            HR Emergency Actions
          </Space>
        }
        open={visible}
        onCancel={() => {
          setActionType(null);
          form.resetFields();
          onClose?.();
        }}
        footer={null}
        width={700}
        destroyOnClose
      >
        {/* Leave Summary */}
        <Descriptions 
          size="small" 
          column={2} 
          bordered
          style={{ marginBottom: '24px' }}
        >
          <Descriptions.Item label="Employee">
            {leave.employee?.fullName}
          </Descriptions.Item>
          <Descriptions.Item label="Department">
            {leave.employee?.department}
          </Descriptions.Item>
          <Descriptions.Item label="Leave Type">
            {getCategoryTag(leave.leaveCategory)} - {leave.leaveType?.replace(/_/g, ' ')}
          </Descriptions.Item>
          <Descriptions.Item label="Duration">
            {leave.totalDays} days
          </Descriptions.Item>
          <Descriptions.Item label="Urgency">
            {getUrgencyTag(leave.urgency)}
          </Descriptions.Item>
          <Descriptions.Item label="Current Status">
            <Tag color="orange">{leave.status?.replace(/_/g, ' ')}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Dates" span={2}>
            {dayjs(leave.startDate).format('MMM DD')} - {dayjs(leave.endDate).format('MMM DD, YYYY')}
          </Descriptions.Item>
          {leave.currentPendingLevel && (
            <>
              <Descriptions.Item label="Pending With">
                {leave.currentPendingLevel.approverName}
              </Descriptions.Item>
              <Descriptions.Item label="Pending Duration">
                {leave.currentPendingLevel.hoursPending} hours
                {isStuck && <Tag color="red" style={{ marginLeft: '8px' }}>STUCK</Tag>}
              </Descriptions.Item>
            </>
          )}
        </Descriptions>

        <Divider>Select Action</Divider>

        {/* Action Selection */}
        {!actionType && (
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            {/* Emergency Override */}
            <Button
              size="large"
              danger
              icon={<ThunderboltOutlined />}
              onClick={() => handleActionSelect('override')}
              disabled={!canOverride}
              block
            >
              Emergency Override (Immediate Approval)
            </Button>
            {!canOverride && (
              <Alert
                message="Not eligible for emergency override"
                description="Only available for critical/high urgency or medical/emergency/bereavement leaves"
                type="warning"
                showIcon
                style={{ fontSize: '11px' }}
              />
            )}

            {/* Escalate */}
            <Button
              size="large"
              type="primary"
              icon={<ArrowUpOutlined />}
              onClick={() => handleActionSelect('escalate')}
              block
            >
              Escalate to Next Level
              {isStuck && <Tag color="red" style={{ marginLeft: '8px' }}>STUCK</Tag>}
            </Button>

            {/* Direct Approval */}
            <Button
              size="large"
              type="default"
              icon={<CheckCircleOutlined />}
              onClick={() => handleActionSelect('direct')}
              disabled={!canDirectApprove}
              block
            >
              Direct Approval (Policy-Compliant)
            </Button>
            {!canDirectApprove && (
              <Alert
                message="Not eligible for direct approval"
                description="Only for short duration (≤3 days), vacation/personal, or medical with certificate"
                type="info"
                showIcon
                style={{ fontSize: '11px' }}
              />
            )}
          </Space>
        )}

        {/* Action Form */}
        {actionType && (
          <Form
            form={form}
            layout="vertical"
            onFinish={() => setConfirmVisible(true)}
          >
            {renderActionForm()}

            <Divider />

            <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
              <Space>
                <Button onClick={() => setActionType(null)}>
                  Back
                </Button>
                <Button 
                  type="primary" 
                  htmlType="submit"
                  loading={loading}
                  danger={actionType === 'override'}
                >
                  {actionType === 'override' && 'Apply Emergency Override'}
                  {actionType === 'escalate' && 'Escalate Request'}
                  {actionType === 'direct' && 'Approve Directly'}
                </Button>
              </Space>
            </Form.Item>
          </Form>
        )}
      </Modal>

      {/* Confirmation Modal */}
      <Modal
        title="Confirm Action"
        open={confirmVisible}
        onCancel={() => setConfirmVisible(false)}
        onOk={() => form.submit()}
        okText="Confirm"
        okButtonProps={{ 
          danger: actionType === 'override',
          loading 
        }}
      >
        <Alert
          message="Are you sure?"
          description={
            <>
              {actionType === 'override' && (
                <p>This will <strong>immediately approve</strong> the leave request and bypass all pending approvers. This action cannot be undone.</p>
              )}
              {actionType === 'escalate' && (
                <p>This will <strong>escalate</strong> the request to the next approval level. The current approver will be notified.</p>
              )}
              {actionType === 'direct' && (
                <p>This will <strong>directly approve</strong> the leave request as it meets policy requirements. Standard approvers will be informed.</p>
              )}
            </>
          }
          type="warning"
          showIcon
        />
      </Modal>
    </>
  );
};

export default HREmergencyActions;