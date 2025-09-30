import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Table, 
  Tag, 
  Space, 
  Typography, 
  Button, 
  Alert, 
  Spin, 
  Modal, 
  Card,
  Badge,
  Tooltip
} from 'antd';
import { 
  FileTextOutlined, 
  CheckCircleOutlined, 
  CloseCircleOutlined, 
  ClockCircleOutlined,
  PlusOutlined,
  DollarOutlined,
  ExclamationCircleOutlined,
  EyeOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import api from '../../services/api';

const { Title, Text } = Typography;

const EmployeeCashRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [canCreateNewRequest, setCanCreateNewRequest] = useState(false);
  const navigate = useNavigate();

  // Fetch cash requests
  const fetchRequests = useCallback(async () => {
    try {
      console.log('Fetching employee cash requests...');
      const response = await api.get('/api/cash-requests/employee');
      
      console.log('Cash requests response:', response.data);
      
      if (response.data.success) {
        const employeeRequests = response.data.data || [];
        setRequests(employeeRequests);
        checkIfCanCreateNewRequest(employeeRequests);
      } else {
        throw new Error(response.data.message || 'Failed to fetch requests');
      }
    } catch (error) {
      console.error('Error fetching cash requests:', error);
      setError(error.response?.data?.message || 'Failed to fetch cash requests');
      setRequests([]);
    }
  }, []);

  // Initial data fetch
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        setError(null);
        await fetchRequests();
      } catch (error) {
        console.error('Error in initial data fetch:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [fetchRequests]);

  const checkIfCanCreateNewRequest = (requests) => {
    if (requests.length === 0) {
      setCanCreateNewRequest(true);
      return;
    }

    const sortedRequests = [...requests].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    const latestRequest = sortedRequests[0];
    const allowedStatuses = ['completed', 'denied'];
    const needsJustification = ['disbursed', 'justification_pending_supervisor', 
                              'justification_pending_finance', 'justification_rejected'];
    
    const hasPendingJustification = requests.some(r => needsJustification.includes(r.status));
    
    if (allowedStatuses.includes(latestRequest.status) && !hasPendingJustification) {
      setCanCreateNewRequest(true);
    } else {
      setCanCreateNewRequest(false);
    }
  };

  const showCannotCreateModal = () => {
    Modal.warning({
      title: 'Cannot Create New Request',
      content: (
        <div>
          <p>You currently have a pending cash request that requires your attention.</p>
          <p>Please complete the justification process for your existing request before creating a new one.</p>
        </div>
      ),
      okText: 'View My Requests',
    });
  };

  const handleNewRequestClick = () => {
    if (canCreateNewRequest) {
      navigate('/employee/cash-request/new');
    } else {
      showCannotCreateModal();
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    await fetchRequests();
    setLoading(false);
  };

  const getStatusTag = (status) => {
    const statusMap = {
      'pending_supervisor': { 
        color: 'orange', 
        icon: <ClockCircleOutlined />, 
        text: 'Pending Supervisor' 
      },
      'pending_finance': { 
        color: 'blue', 
        icon: <ClockCircleOutlined />, 
        text: 'Pending Finance' 
      },
      'approved': { 
        color: 'green', 
        icon: <CheckCircleOutlined />, 
        text: 'Approved' 
      },
      'denied': { 
        color: 'red', 
        icon: <CloseCircleOutlined />, 
        text: 'Denied' 
      },
      'rejected': { 
        color: 'red', 
        icon: <CloseCircleOutlined />, 
        text: 'Rejected' 
      },
      'disbursed': { 
        color: 'cyan', 
        icon: <DollarOutlined />, 
        text: 'Disbursed - Need Justification' 
      },
      'justification_pending_supervisor': { 
        color: 'purple', 
        icon: <ClockCircleOutlined />, 
        text: 'Justification - Pending Supervisor' 
      },
      'justification_pending_finance': { 
        color: 'geekblue', 
        icon: <ClockCircleOutlined />, 
        text: 'Justification - Pending Finance' 
      },
      'justification_rejected': { 
        color: 'red', 
        icon: <ExclamationCircleOutlined />, 
        text: 'Justification Rejected' 
      },
      'completed': { 
        color: 'green', 
        icon: <CheckCircleOutlined />, 
        text: 'Completed' 
      }
    };

    const statusInfo = statusMap[status] || { 
      color: 'default', 
      text: status?.replace('_', ' ') || 'Unknown' 
    };
    
    return (
      <Tag color={statusInfo.color} icon={statusInfo.icon}>
        {statusInfo.text}
      </Tag>
    );
  };

  const getActionButtons = (record) => {
    const buttons = [
      <Button 
        type="link" 
        icon={<EyeOutlined />}
        onClick={() => navigate(`/employee/cash-request/${record._id}`)}
        disabled={!record._id}
        key="view"
      >
        View Details
      </Button>
    ];

    if (record.status === 'disbursed') {
      buttons.push(
        <Button 
          type="link" 
          onClick={() => navigate(`/employee/cash-request/${record._id}/justify`)}
          disabled={!record._id}
          style={{ color: '#1890ff' }}
          key="justify"
        >
          Submit Justification
        </Button>
      );
    }

    if (record.status === 'justification_rejected') {
      buttons.push(
        <Button 
          type="link" 
          onClick={() => navigate(`/employee/cash-request/${record._id}/justify`)}
          disabled={!record._id}
          style={{ color: '#faad14' }}
          key="resubmit"
        >
          Resubmit Justification
        </Button>
      );
    }

    return buttons;
  };

  const requestColumns = [
    {
      title: 'Request ID',
      dataIndex: '_id',
      key: '_id',
      render: (id) => id ? `REQ-${id.slice(-6).toUpperCase()}` : 'N/A',
      width: 120
    },
    {
      title: 'Amount Requested',
      dataIndex: 'amountRequested',
      key: 'amount',
      render: (amount) => `XAF ${Number(amount || 0).toLocaleString()}`,
      sorter: (a, b) => (a.amountRequested || 0) - (b.amountRequested || 0),
      width: 150
    },
    {
      title: 'Type',
      dataIndex: 'requestType',
      key: 'type',
      render: (type) => type ? type.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'N/A',
      width: 120
    },
    {
      title: 'Purpose',
      dataIndex: 'purpose',
      key: 'purpose',
      render: (purpose) => purpose ? (
        <Tooltip title={purpose}>
          <Text ellipsis style={{ maxWidth: 200 }}>
            {purpose.length > 50 ? `${purpose.substring(0, 50)}...` : purpose}
          </Text>
        </Tooltip>
      ) : 'N/A',
      ellipsis: true
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => getStatusTag(status),
      filters: [
        { text: 'Pending Supervisor', value: 'pending_supervisor' },
        { text: 'Pending Finance', value: 'pending_finance' },
        { text: 'Approved', value: 'approved' },
        { text: 'Disbursed', value: 'disbursed' },
        { text: 'Completed', value: 'completed' },
        { text: 'Denied', value: 'denied' },
      ],
      onFilter: (value, record) => record.status === value,
      width: 200
    },
    {
      title: 'Date Submitted',
      dataIndex: 'createdAt',
      key: 'date',
      render: (date) => date ? new Date(date).toLocaleDateString('en-GB') : 'N/A',
      sorter: (a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0),
      defaultSortOrder: 'descend',
      width: 120
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="small">
          {getActionButtons(record)}
        </Space>
      ),
      width: 200
    }
  ];

  const totalPending = requests.filter(r => 
    ['disbursed', 'justification_rejected'].includes(r.status)
  ).length;

  if (loading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Spin size="large" />
        <div style={{ marginTop: '16px' }}>Loading your cash requests...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <Title level={2} style={{ margin: 0 }}>
            <DollarOutlined /> My Cash Requests
          </Title>
          <Space>
            <Button 
              icon={<ReloadOutlined />}
              onClick={handleRefresh}
              loading={loading}
            >
              Refresh
            </Button>
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={handleNewRequestClick}
            >
              New Cash Request
            </Button>
          </Space>
        </div>

        {error && (
          <Alert
            message="Error Loading Data"
            description={error}
            type="error"
            showIcon
            closable
            style={{ marginBottom: '16px' }}
            onClose={() => setError(null)}
          />
        )}

        {totalPending > 0 && (
          <Alert
            message={`You have ${totalPending} cash request(s) that need your attention`}
            type="warning"
            showIcon
            style={{ marginBottom: '16px' }}
            action={
              <Button size="small" type="primary">
                Review Pending
              </Button>
            }
          />
        )}

        {requests.length === 0 ? (
          <Alert
            message="No Cash Requests Found"
            description="You haven't submitted any cash requests yet. Click the 'New Cash Request' button to create your first request."
            type="info"
            showIcon
            style={{ marginBottom: '16px' }}
          />
        ) : (
          <Table 
            columns={requestColumns} 
            dataSource={requests} 
            loading={loading}
            rowKey="_id"
            pagination={{ 
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => 
                `${range[0]}-${range[1]} of ${total} requests`
            }}
            scroll={{ x: 'max-content' }}
            rowClassName={(record) => {
              const needsAttention = ['disbursed', 'justification_rejected'];
              if (needsAttention.includes(record.status)) {
                return 'highlight-row'; 
              }
              return '';
            }}
          />
        )}
      </Card>

      <style jsx>{`
        .highlight-row {
          background-color: #fff7e6 !important;
        }
        .highlight-row:hover {
          background-color: #fff1d6 !important;
        }
      `}</style>
    </div>
  );
};

export default EmployeeCashRequests;