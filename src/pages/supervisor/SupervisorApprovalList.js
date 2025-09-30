import React, { useEffect, useState } from 'react';
import { Table, Tag, Typography, Button, Space, Card, Tabs, Alert } from 'antd';
import { 
  FileTextOutlined, 
  ExclamationCircleOutlined, 
  CheckSquareOutlined,
  DollarCircleOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

const SupervisorApprovalList = () => {
  const [requests, setRequests] = useState([]);
  const [justifications, setJustifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('requests');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        const [requestsResponse, justificationsResponse] = await Promise.all([
          api.get('/api/cash-requests/supervisor'),
          api.get('/api/cash-requests/supervisor/justifications')
        ]);
        
        setRequests(requestsResponse.data.data || []);
        setJustifications(justificationsResponse.data.data || []);
        
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Columns for cash requests
  const requestColumns = [
    {
      title: 'Request ID',
      dataIndex: '_id',
      key: '_id',
      render: (id) => `REQ-${id.slice(-6).toUpperCase()}`
    },
    {
      title: 'Employee',
      key: 'employee',
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>{record.employee?.fullName}</div>
          <small style={{ color: '#666' }}>{record.employee?.department}</small>
        </div>
      )
    },
    {
      title: 'Amount',
      dataIndex: 'amountRequested',
      key: 'amount',
      render: (amount) => `XAF ${amount.toFixed(2)}`,
      sorter: (a, b) => a.amountRequested - b.amountRequested
    },
    {
      title: 'Type',
      dataIndex: 'requestType',
      key: 'type',
      render: (type) => type.replace('-', ' ').toUpperCase()
    },
    {
      title: 'Urgency',
      dataIndex: 'urgency',
      key: 'urgency',
      render: (urgency) => (
        <Tag color={
          urgency === 'urgent' ? 'red' : 
          urgency === 'high' ? 'orange' : 
          urgency === 'medium' ? 'blue' : 'green'
        }>
          {urgency.toUpperCase()}
        </Tag>
      )
    },
    {
      title: 'Required Date',
      dataIndex: 'requiredDate',
      key: 'requiredDate',
      render: (date) => new Date(date).toLocaleDateString(),
      sorter: (a, b) => new Date(a.requiredDate) - new Date(b.requiredDate)
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color="orange" icon={<ClockCircleOutlined />}>
          PENDING APPROVAL
        </Tag>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button 
          type="primary" 
          onClick={() => navigate(`/supervisor/request/${record._id}`)}
          icon={<ExclamationCircleOutlined />}
        >
          Review Request
        </Button>
      )
    }
  ];

  // Columns for justifications
  const justificationColumns = [
    {
      title: 'Request ID',
      dataIndex: '_id',
      key: '_id',
      render: (id) => `REQ-${id.slice(-6).toUpperCase()}`
    },
    {
      title: 'Employee',
      key: 'employee',
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>{record.employee?.fullName}</div>
          <small style={{ color: '#666' }}>{record.employee?.department}</small>
        </div>
      )
    },
    {
      title: 'Disbursed Amount',
      key: 'disbursedAmount',
      render: (_, record) => `XAF ${(record.disbursementDetails?.amount || 0).toFixed(2)}`,
      sorter: (a, b) => (a.disbursementDetails?.amount || 0) - (b.disbursementDetails?.amount || 0)
    },
    {
      title: 'Amount Spent',
      key: 'amountSpent',
      render: (_, record) => (
        <span style={{ color: '#ff4d4f', fontWeight: 'bold' }}>
          XAF {(record.justification?.amountSpent || 0).toFixed(2)}
        </span>
      )
    },
    {
      title: 'Balance Returned',
      key: 'balanceReturned',
      render: (_, record) => (
        <span style={{ color: '#52c41a', fontWeight: 'bold' }}>
          XAF {(record.justification?.balanceReturned || 0).toFixed(2)}
        </span>
      )
    },
    {
      title: 'Justification Date',
      key: 'justificationDate',
      render: (_, record) => (
        record.justification?.justificationDate 
          ? new Date(record.justification.justificationDate).toLocaleDateString()
          : 'N/A'
      ),
      sorter: (a, b) => {
        const dateA = new Date(a.justification?.justificationDate || 0);
        const dateB = new Date(b.justification?.justificationDate || 0);
        return dateA - dateB;
      }
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: () => (
        <Tag color="blue" icon={<CheckSquareOutlined />}>
          JUSTIFICATION PENDING
        </Tag>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button 
          type="primary" 
          onClick={() => navigate(`/supervisor/justification/${record._id}`)}
          icon={<DollarCircleOutlined />}
        >
          Review Justification
        </Button>
      )
    }
  ];

  const totalPending = requests.length + justifications.length;

  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <Title level={3} style={{ margin: 0 }}>
          <FileTextOutlined /> Supervisor Dashboard
        </Title>
        {totalPending > 0 && (
          <Tag color="orange" style={{ fontSize: '14px', padding: '4px 8px' }}>
            {totalPending} Items Pending
          </Tag>
        )}
      </div>

      {totalPending === 0 && (
        <Alert
          message="No Pending Items"
          description="You have no cash requests or justifications pending your approval at this time."
          type="success"
          showIcon
          style={{ marginBottom: '24px' }}
        />
      )}

      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane 
          tab={
            <span>
              <ExclamationCircleOutlined />
              Cash Requests ({requests.length})
            </span>
          } 
          key="requests"
        >
          <Table 
            columns={requestColumns} 
            dataSource={requests} 
            loading={loading}
            rowKey="_id"
            pagination={{ 
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} requests`
            }}
            locale={{
              emptyText: 'No cash requests pending your approval'
            }}
          />
        </TabPane>
        
        <TabPane 
          tab={
            <span>
              <CheckSquareOutlined />
              Justifications ({justifications.length})
            </span>
          } 
          key="justifications"
        >
          <Alert
            message="Justification Review"
            description="These are cash justifications submitted by employees after funds were disbursed. Please review the spending details and supporting documents."
            type="info"
            showIcon
            style={{ marginBottom: '16px' }}
          />
          
          <Table 
            columns={justificationColumns} 
            dataSource={justifications} 
            loading={loading}
            rowKey="_id"
            pagination={{ 
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} justifications`
            }}
            locale={{
              emptyText: 'No justifications pending your approval'
            }}
          />
        </TabPane>
      </Tabs>
    </Card>
  );
};

export default SupervisorApprovalList;