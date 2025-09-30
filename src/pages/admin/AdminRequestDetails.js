import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Descriptions, 
  Typography, 
  Tag, 
  Divider, 
  Button,
  Space,
  Spin,
  Alert,
  Card
} from 'antd';
import { 
  ArrowLeftOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import api from '../../services/api';

const { Title, Text } = Typography;

const AdminRequestDetails = () => {
  const { requestId } = useParams();
  const navigate = useNavigate();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRequest = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/api/cash-requests/${requestId}/admin`);
        setRequest(response.data.data);
      } catch (error) {
        console.error('Error fetching request:', error);
        navigate('/admin/requests');
      } finally {
        setLoading(false);
      }
    };

    fetchRequest();
  }, [requestId, navigate]);

  const getStatusTag = (status) => {
    const statusMap = {
      'pending_supervisor': { color: 'orange', icon: <ClockCircleOutlined />, text: 'Pending Supervisor' },
      'pending_finance': { color: 'blue', icon: <ClockCircleOutlined />, text: 'Pending Finance' },
      'approved': { color: 'green', icon: <CheckCircleOutlined />, text: 'Approved' },
      'denied': { color: 'red', icon: <CloseCircleOutlined />, text: 'Denied' },
      'disbursed': { color: 'cyan', icon: <CheckCircleOutlined />, text: 'Disbursed' },
      'justification_pending': { color: 'purple', icon: <ClockCircleOutlined />, text: 'Justification Pending' },
      'completed': { color: 'green', icon: <CheckCircleOutlined />, text: 'Completed' }
    };

    const statusInfo = statusMap[status] || { color: 'default', text: status };
    return (
      <Tag color={statusInfo.color} icon={statusInfo.icon}>
        {statusInfo.text}
      </Tag>
    );
  };

  if (loading) {
    return <Spin size="large" />;
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
    <Card>
      <Title level={3} style={{ marginBottom: 24 }}>
        Cash Request Details (Admin View)
      </Title>

      <Descriptions bordered column={1}>
        <Descriptions.Item label="Request ID">REQ-{request._id.slice(-6).toUpperCase()}</Descriptions.Item>
        <Descriptions.Item label="Status">{getStatusTag(request.status)}</Descriptions.Item>
        <Descriptions.Item label="Employee">{request.employee?.fullName || 'N/A'}</Descriptions.Item>
        <Descriptions.Item label="Department">{request.employee?.department || 'N/A'}</Descriptions.Item>
        <Descriptions.Item label="Amount Requested">
          <Text strong>XAF {request.amountRequested?.toFixed(2) || '0.00'}</Text>
        </Descriptions.Item>
        <Descriptions.Item label="Amount Approved">
          <Text strong>XAF {request.amountApproved?.toFixed(2) || 'Pending'}</Text>
        </Descriptions.Item>
        <Descriptions.Item label="Request Type">
          {request.requestType?.replace('-', ' ') || 'N/A'}
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
            {request.urgency?.toUpperCase() || 'N/A'}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Required By">
          {request.requiredDate ? new Date(request.requiredDate).toLocaleDateString() : 'N/A'}
        </Descriptions.Item>
        <Descriptions.Item label="Created At">
          {request.createdAt ? new Date(request.createdAt).toLocaleDateString() : 'N/A'}
        </Descriptions.Item>
        
        {request.supervisorDecision && (
          <>
            <Descriptions.Item label="Supervisor Decision">
              {request.supervisorDecision.decision.toUpperCase()}
            </Descriptions.Item>
            <Descriptions.Item label="Supervisor Comments">
              {request.supervisorDecision.comments || 'N/A'}
            </Descriptions.Item>
          </>
        )}
        
        {request.financeDecision && (
          <>
            <Descriptions.Item label="Finance Decision">
              {request.financeDecision.decision.toUpperCase()}
            </Descriptions.Item>
            <Descriptions.Item label="Finance Comments">
              {request.financeDecision.comments || 'N/A'}
            </Descriptions.Item>
          </>
        )}
      </Descriptions>

      <Divider />

      <Space>
        <Button 
          type="default" 
          icon={<ArrowLeftOutlined />} 
          onClick={() => navigate('/admin/requests')}
        >
          Back to Requests
        </Button>
      </Space>
    </Card>
  );
};

export default AdminRequestDetails;