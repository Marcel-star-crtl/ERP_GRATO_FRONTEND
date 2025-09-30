import React, { useEffect, useState } from 'react';
import { Table, Tag, Space, Typography, Button, Card, Spin } from 'antd';
import { 
  FileTextOutlined, 
  CheckCircleOutlined, 
  CloseCircleOutlined, 
  ClockCircleOutlined,
  EyeOutlined
} from '@ant-design/icons';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';

const { Title } = Typography;

const AdminRequestsList = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const response = await api.get('/api/cash-requests/admin');
        setRequests(response.data.data);
      } catch (error) {
        console.error('Error fetching requests:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, []);

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

  const columns = [
    {
      title: 'Request ID',
      dataIndex: '_id',
      key: '_id',
      render: (id) => `REQ-${id.slice(-6).toUpperCase()}`
    },
    {
      title: 'Employee',
      dataIndex: 'employee',
      key: 'employee',
      render: (employee) => employee?.fullName || 'N/A'
    },
    {
      title: 'Amount',
      dataIndex: 'amountRequested',
      key: 'amount',
      render: (amount) => `XAF ${amount?.toFixed(2) || '0.00'}`
    },
    {
      title: 'Type',
      dataIndex: 'requestType',
      key: 'type',
      render: (type) => type?.replace('-', ' ') || 'N/A'
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: getStatusTag
    },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'date',
      render: (date) => date ? new Date(date).toLocaleDateString() : 'N/A'
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="middle">
          <Button 
            type="link" 
            icon={<EyeOutlined />}
            onClick={() => navigate(`/admin/cash-requests/${record._id}`)}
          >
            View
          </Button>
        </Space>
      )
    }
  ];

  return (
    <Card>
      <Title level={3} style={{ marginBottom: '24px' }}>
        <FileTextOutlined /> Cash Requests Overview
      </Title>
      <Table 
        columns={columns} 
        dataSource={requests} 
        loading={loading}
        rowKey="_id"
        pagination={{ pageSize: 10 }}
      />
    </Card>
  );
};

export default AdminRequestsList;