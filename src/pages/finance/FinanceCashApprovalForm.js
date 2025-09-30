import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Card, 
  Descriptions, 
  Typography, 
  Tag, 
  Divider, 
  Form, 
  Input, 
  InputNumber,
  Radio, 
  Button, 
  message,
  Modal,
  Space,
  Alert,
  Spin
} from 'antd';
import { 
  CheckCircleOutlined, 
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  DollarOutlined,
  UserOutlined,
  CalendarOutlined
} from '@ant-design/icons';
import api from '../../services/api';
import { useSelector } from 'react-redux';

const { Title, Text } = Typography;
const { TextArea } = Input;

const FinanceApprovalForm = () => {
  const { requestId } = useParams();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(false);
  const [decision, setDecision] = useState(null);
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    const fetchRequest = async () => {
      try {
        setLoading(true);
        console.log('Fetching request for finance approval:', requestId);
        
        const response = await api.get(`/api/cash-requests/admin/${requestId}`);
        
        if (user.role !== 'finance' && user.role !== 'admin') {
          message.error('You are not authorized to approve this request');
          navigate('/finance/requests');
          return;
        }

        const requestData = response.data.data;
        
        // Verify request is in the correct status for finance approval
        if (requestData.status !== 'pending_finance') {
          message.warning('This request is not pending finance approval');
          navigate('/finance/requests');
          return;
        }
        
        setRequest(requestData);
        
        // Set default disbursement amount to approved amount or requested amount
        form.setFieldsValue({
          disbursedAmount: requestData.amountApproved || requestData.amountRequested
        });
        
      } catch (error) {
        console.error('Error fetching request:', error);
        message.error(error.response?.data?.message || 'Failed to load request details');
        navigate('/finance/requests');
      } finally {
        setLoading(false);
      }
    };

    if (requestId) {
      fetchRequest();
    }
  }, [requestId, user, navigate, form]);

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      
      const payload = {
        decision: values.decision,
        comments: values.comments,
        denialReason: values.denialReason
      };

      // Add disbursed amount if approving
      if (values.decision === 'approve') {
        payload.disbursedAmount = values.disbursedAmount;
      }

      console.log('Submitting finance decision:', payload);
      
      const response = await api.put(`/api/cash-requests/${requestId}/finance`, payload);
      
      if (response.data.success) {
        message.success(`Request ${values.decision === 'approve' ? 'approved and disbursed' : 'denied'} successfully`);
        navigate('/finance/requests');
      } else {
        throw new Error(response.data.message || 'Failed to process decision');
      }
    } catch (error) {
      console.error('Error processing approval:', error);
      message.error(error.response?.data?.message || 'Failed to process approval');
    } finally {
      setLoading(false);
    }
  };

  const showConfirmModal = () => {
    const values = form.getFieldsValue();
    const action = decision === 'approve' ? 'approve and disburse' : 'deny';
    const amount = decision === 'approve' ? values.disbursedAmount : null;
    
    Modal.confirm({
      title: `Confirm ${decision === 'approve' ? 'Approval & Disbursement' : 'Denial'}`,
      icon: decision === 'approve' ? <CheckCircleOutlined /> : <CloseCircleOutlined />,
      content: (
        <div>
          <p>Are you sure you want to {action} this request?</p>
          {decision === 'approve' && amount && (
            <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: '4px' }}>
              <strong>Amount to be disbursed: XAF {Number(amount).toFixed(2)}</strong>
            </div>
          )}
        </div>
      ),
      onOk: () => form.submit(),
      okText: `Yes, ${decision === 'approve' ? 'Approve & Disburse' : 'Deny'}`,
      cancelText: 'Cancel',
      okButtonProps: {
        danger: decision === 'deny'
      }
    });
  };

  if (loading && !request) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Spin size="large" />
        <div style={{ marginTop: '16px' }}>Loading request details...</div>
      </div>
    );
  }

  if (!request) {
    return (
      <div style={{ padding: '24px' }}>
        <Alert message="Request not found" type="error" />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: '900px', margin: '0 auto' }}>
      <Card>
        <Title level={3} style={{ marginBottom: '24px' }}>
          <DollarOutlined /> Finance Approval & Disbursement
        </Title>

        {/* Request Details */}
        <Descriptions bordered column={2} size="small">
          <Descriptions.Item label="Request ID" span={2}>
            <Text code>REQ-{request._id.slice(-6).toUpperCase()}</Text>
          </Descriptions.Item>
          
          <Descriptions.Item label="Employee">
            <Space>
              <UserOutlined />
              {request.employee?.fullName}
            </Space>
          </Descriptions.Item>
          
          <Descriptions.Item label="Department">
            {request.employee?.department || 'N/A'}
          </Descriptions.Item>
          
          <Descriptions.Item label="Request Type">
            {request.requestType?.replace('-', ' ')?.toUpperCase()}
          </Descriptions.Item>
          
          <Descriptions.Item label="Urgency">
            <Tag color={request.urgency === 'high' ? 'red' : request.urgency === 'medium' ? 'orange' : 'green'}>
              {request.urgency?.toUpperCase()}
            </Tag>
          </Descriptions.Item>
          
          <Descriptions.Item label="Amount Requested">
            <Text strong>XAF {request.amountRequested?.toFixed(2)}</Text>
          </Descriptions.Item>
          
          <Descriptions.Item label="Amount Approved by Supervisor">
            <Text strong style={{ color: '#52c41a' }}>
              XAF {(request.amountApproved || request.amountRequested)?.toFixed(2)}
            </Text>
          </Descriptions.Item>
          
          <Descriptions.Item label="Purpose" span={2}>
            {request.purpose}
          </Descriptions.Item>
          
          <Descriptions.Item label="Business Justification" span={2}>
            {request.businessJustification}
          </Descriptions.Item>
          
          <Descriptions.Item label="Supervisor">
            <Space>
              <UserOutlined />
              {request.supervisor?.fullName}
            </Space>
          </Descriptions.Item>
          
          <Descriptions.Item label="Supervisor Decision">
            <Tag color="green" icon={<CheckCircleOutlined />}>
              APPROVED
            </Tag>
          </Descriptions.Item>
          
          <Descriptions.Item label="Approval Date">
            <Space>
              <CalendarOutlined />
              {request.supervisorDecision?.decisionDate 
                ? new Date(request.supervisorDecision.decisionDate).toLocaleDateString()
                : 'N/A'
              }
            </Space>
          </Descriptions.Item>
          
          <Descriptions.Item label="Supervisor Comments">
            {request.supervisorDecision?.comments || 'None provided'}
          </Descriptions.Item>
        </Descriptions>

        <Divider />

        <Alert
          message="Finance Decision Required"
          description="This request has been approved by the supervisor and requires your final approval for disbursement."
          type="info"
          showIcon
          style={{ marginBottom: '24px' }}
        />

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="decision"
            label="Finance Decision"
            rules={[{ required: true, message: 'Please make a decision' }]}
          >
            <Radio.Group onChange={(e) => setDecision(e.target.value)}>
              <Space direction="vertical">
                <Radio.Button value="approve" style={{ color: '#52c41a' }}>
                  <CheckCircleOutlined /> Approve & Disburse
                </Radio.Button>
                <Radio.Button value="deny" style={{ color: '#ff4d4f' }}>
                  <CloseCircleOutlined /> Deny Request
                </Radio.Button>
              </Space>
            </Radio.Group>
          </Form.Item>

          {decision === 'approve' && (
            <Form.Item
              name="disbursedAmount"
              label="Amount to Disburse"
              rules={[
                { required: true, message: 'Please enter the disbursement amount' },
                { type: 'number', min: 0.01, message: 'Amount must be greater than 0' },
                {
                  validator: (_, value) => {
                    const maxAmount = request.amountApproved || request.amountRequested;
                    if (value && value > maxAmount) {
                      return Promise.reject(new Error(`Amount cannot exceed approved amount of XAF ${maxAmount.toFixed(2)}`));
                    }
                    return Promise.resolve();
                  }
                }
              ]}
            >
              <InputNumber
                style={{ width: '100%' }}
                formatter={value => `XAF ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={value => value.replace(/XAF\s?|(,*)/g, '')}
                precision={2}
                placeholder="Enter amount to disburse"
                max={request.amountApproved || request.amountRequested}
              />
            </Form.Item>
          )}

          {decision === 'deny' && (
            <Form.Item
              name="denialReason"
              label="Reason for Denial"
              rules={[{ required: true, message: 'Please provide a reason for denial' }]}
            >
              <TextArea 
                rows={3} 
                placeholder="Please explain why this request is being denied..."
                showCount
                maxLength={500}
              />
            </Form.Item>
          )}

          <Form.Item
            name="comments"
            label="Additional Comments"
          >
            <TextArea 
              rows={2} 
              placeholder="Any additional comments (optional)"
              showCount
              maxLength={300}
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button onClick={() => navigate('/finance/invoice-approvals')}>
                Back to List
              </Button>
              <Button
                type="primary"
                onClick={showConfirmModal}
                disabled={!decision}
                loading={loading}
                icon={decision === 'approve' ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
                style={{
                  backgroundColor: decision === 'approve' ? '#52c41a' : decision === 'deny' ? '#ff4d4f' : undefined
                }}
              >
                {decision === 'approve' ? 'Approve & Disburse' : decision === 'deny' ? 'Deny Request' : 'Submit Decision'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default FinanceApprovalForm;