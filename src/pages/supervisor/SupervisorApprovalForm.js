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
  Radio, 
  Button, 
  message,
  Modal,
  Space,
  Alert
} from 'antd';
import { 
  CheckCircleOutlined, 
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  DollarOutlined
} from '@ant-design/icons';
import api from '../../services/api';
import { useSelector } from 'react-redux';

const { Title, Text } = Typography;
const { TextArea } = Input;

const SupervisorApprovalForm = () => {
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
        const response = await api.get(`/api/cash-requests/supervisor/${requestId}`);
        
        if (!response.data.success) {
          throw new Error(response.data.message || 'Request not found');
        }

        setRequest(response.data.data);
        form.setFieldsValue({
          approvedAmount: response.data.data.amountRequested
        });
      } catch (error) {
        console.error('Error fetching request:', error);
        message.error(error.message || 'Failed to load request details');
        navigate('/supervisor/requests');
      } finally {
        setLoading(false);
      }
    };
  
    fetchRequest();
  }, [requestId, navigate, form]);

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      const response = await api.put(`/api/cash-requests/${requestId}/supervisor`, {
        decision: values.decision,
        comments: values.comments,
        approvedAmount: values.approvedAmount,
        denialReason: values.denialReason
      });
      
      if (response.data.success) {
        message.success(`Request ${values.decision === 'approve' ? 'approved' : 'denied'} successfully`);
        navigate('/supervisor/requests');
      } else {
        throw new Error(response.data.message || 'Failed to process approval');
      }
    } catch (error) {
      console.error('Error processing approval:', error);
      message.error(error.message || 'Failed to process approval');
    } finally {
      setLoading(false);
    }
  };

  const showConfirmModal = () => {
    Modal.confirm({
      title: `Confirm ${decision === 'approve' ? 'Approval' : 'Denial'}`,
      icon: decision === 'approve' ? <CheckCircleOutlined /> : <CloseCircleOutlined />,
      content: `Are you sure you want to ${decision === 'approve' ? 'approve' : 'deny'} this request?`,
      onOk: () => form.submit(),
      okText: `Yes, ${decision === 'approve' ? 'Approve' : 'Deny'}`,
      cancelText: 'Cancel'
    });
  };

  if (loading && !request) {
    return <div>Loading request details...</div>;
  }

  if (!request) {
    return (
      <Alert
        message="Request Not Found"
        description="The request you are trying to access does not exist or you don't have permission to view it."
        type="error"
        showIcon
      />
    );
  }

  return (
    <Card loading={loading}>
      <Title level={3} style={{ marginBottom: '24px' }}>
        <ExclamationCircleOutlined /> Cash Request Approval
      </Title>

      <Descriptions bordered column={1}>
        <Descriptions.Item label="Request ID">REQ-{request._id.slice(-6).toUpperCase()}</Descriptions.Item>
        <Descriptions.Item label="Employee">
          {request.employee?.fullName} ({request.employee?.department})
        </Descriptions.Item>
        <Descriptions.Item label="Amount Requested">
          <Text strong>XAF {request.amountRequested.toFixed(2)}</Text>
        </Descriptions.Item>
        <Descriptions.Item label="Request Type">
          {request.requestType.replace('-', ' ')}
        </Descriptions.Item>
        <Descriptions.Item label="Purpose">{request.purpose}</Descriptions.Item>
        <Descriptions.Item label="Business Justification">
          {request.businessJustification}
        </Descriptions.Item>
        <Descriptions.Item label="Urgency">
          <Tag color={
            request.urgency === 'urgent' ? 'red' : 
            request.urgency === 'high' ? 'orange' : 
            request.urgency === 'medium' ? 'blue' : 'green'
          }>
            {request.urgency.toUpperCase()}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Required By">
          {new Date(request.requiredDate).toLocaleDateString()}
        </Descriptions.Item>
      </Descriptions>

      <Divider />

      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item
          name="decision"
          label="Your Decision"
          rules={[{ required: true, message: 'Please make a decision' }]}
        >
          <Radio.Group onChange={(e) => setDecision(e.target.value)}>
            <Space direction="vertical">
              <Radio.Button value="approve" style={{ color: '#52c41a' }}>
                <CheckCircleOutlined /> Approve Request
              </Radio.Button>
              <Radio.Button value="deny" style={{ color: '#ff4d4f' }}>
                <CloseCircleOutlined /> Deny Request
              </Radio.Button>
            </Space>
          </Radio.Group>
        </Form.Item>

        {decision === 'approve' && (
          <Form.Item
            name="approvedAmount"
            label="Approved Amount"
            rules={[
              { required: true, message: 'Please enter approved amount' },
              { 
                type: 'number',
                min: 0,
                max: request.amountRequested,
                message: `Amount must be between 0 and ${request.amountRequested}`
              }
            ]}
          >
            <Input
              prefix={<DollarOutlined />}
              type="number"
              min={0}
              max={request.amountRequested}
              step={0.01}
            />
          </Form.Item>
        )}

        {decision === 'deny' && (
          <Form.Item
            name="denialReason"
            label="Reason for Denial"
            rules={[{ required: true, message: 'Please provide a reason for denial' }]}
          >
            <TextArea rows={3} placeholder="Explain why this request is being denied..." />
          </Form.Item>
        )}

        <Form.Item
          name="comments"
          label="Comments"
        >
          <TextArea rows={2} placeholder="Additional comments (optional)" />
        </Form.Item>

        <Form.Item>
          <Space>
            <Button onClick={() => navigate('/supervisor/requests')}>
              Back to List
            </Button>
            <Button
              type="primary"
              onClick={showConfirmModal}
              disabled={!decision}
              loading={loading}
            >
              Submit Decision
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default SupervisorApprovalForm;


