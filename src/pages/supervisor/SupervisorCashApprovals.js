import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Tabs,
  Empty,
  Spin,
  message,
  Badge,
  Tooltip,
  Row,
  Col
} from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  FilePdfOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
  DollarOutlined
} from '@ant-design/icons';
import api from '../../services/api';
import { useSelector } from 'react-redux';

const SupervisorCashApprovals = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [activeTab, setActiveTab] = useState('approvals');
  const [cashRequests, setCashRequests] = useState([]);
  const [justifications, setJustifications] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'approvals') {
      fetchCashRequests();
    } else if (activeTab === 'justifications') {
      fetchJustifications();
    }
  }, [activeTab]);

  const fetchCashRequests = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/cash-requests/supervisor');
      
      if (response.data.success) {
        setCashRequests(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching cash requests:', error);
      message.error('Failed to load cash requests');
    } finally {
      setLoading(false);
    }
  };

  const fetchJustifications = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/cash-requests/supervisor/justifications');
      
      if (response.data.success) {
        setJustifications(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching justifications:', error);
      message.error('Failed to load justifications');
    } finally {
      setLoading(false);
    }
  };

  const handleViewCashRequest = (requestId) => {
    navigate(`/supervisor/cash-request/${requestId}`);
  };

  const handleReviewJustification = (requestId) => {
    navigate(`/supervisor/cash-approvals/justification/${requestId}/review`);
  };

  const getStatusTag = (status) => {
    const statusConfig = {
      'pending_supervisor': { color: 'warning', label: 'Pending Supervisor' },
      'pending_departmental_head': { color: 'processing', label: 'Pending Dept Head' },
      'pending_head_of_business': { color: 'processing', label: 'Pending HOB' },
      'pending_finance': { color: 'processing', label: 'Pending Finance' },
      'approved': { color: 'success', label: 'Approved' },
      'disbursed': { color: 'success', label: 'Disbursed' },
      'denied': { color: 'error', label: 'Denied' }
    };

    const config = statusConfig[status] || { color: 'default', label: status };
    return <Tag color={config.color}>{config.label}</Tag>;
  };

  const getJustificationStatusTag = (status) => {
    const statusConfig = {
      'justification_pending_supervisor': { color: 'warning', label: 'Pending Your Review' },
      'justification_pending_finance': { color: 'processing', label: 'With Finance' },
      'justification_rejected_supervisor': { color: 'error', label: 'Rejected - Awaiting Resubmission' },
      'justification_rejected_finance': { color: 'error', label: 'Finance Rejection' },
      'completed': { color: 'success', label: 'Completed' }
    };

    const config = statusConfig[status] || { color: 'default', label: status };
    return <Tag color={config.color}>{config.label}</Tag>;
  };

  const cashRequestsColumns = [
    {
      title: 'Request ID',
      dataIndex: '_id',
      key: '_id',
      width: 120,
      render: (id) => <Tag color="blue">REQ-{id.toString().slice(-6).toUpperCase()}</Tag>
    },
    {
      title: 'Employee',
      dataIndex: ['employee', 'fullName'],
      key: 'employee',
      width: 200
    },
    {
      title: 'Amount',
      dataIndex: 'amountRequested',
      key: 'amount',
      width: 150,
      render: (amount) => (
        <Space>
          <DollarOutlined />
          <span style={{ fontWeight: 'bold' }}>XAF {parseFloat(amount).toLocaleString()}</span>
        </Space>
      )
    },
    {
      title: 'Purpose',
      dataIndex: 'purpose',
      key: 'purpose',
      width: 250,
      ellipsis: {
        showTitle: false,
      },
      render: (text) => (
        <Tooltip title={text}>
          {text}
        </Tooltip>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 180,
      render: (status) => getStatusTag(status)
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (date) => new Date(date).toLocaleDateString('en-GB')
    },
    {
      title: 'Action',
      key: 'action',
      width: 120,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewCashRequest(record._id)}
          >
            View
          </Button>
        </Space>
      )
    }
  ];

  const justificationsColumns = [
    {
      title: 'Request ID',
      dataIndex: '_id',
      key: '_id',
      width: 120,
      render: (id) => <Tag color="blue">REQ-{id.toString().slice(-6).toUpperCase()}</Tag>
    },
    {
      title: 'Employee',
      dataIndex: ['employee', 'fullName'],
      key: 'employee',
      width: 200
    },
    {
      title: 'Disbursed Amount',
      dataIndex: ['disbursementDetails', 'amount'],
      key: 'disbursedAmount',
      width: 150,
      render: (amount) => (
        <Space>
          <DollarOutlined />
          <span style={{ fontWeight: 'bold' }}>XAF {parseFloat(amount || 0).toLocaleString()}</span>
        </Space>
      )
    },
    {
      title: 'Amount Spent',
      dataIndex: ['justification', 'amountSpent'],
      key: 'amountSpent',
      width: 150,
      render: (amount) => (
        <span>XAF {parseFloat(amount || 0).toLocaleString()}</span>
      )
    },
    {
      title: 'Documents',
      dataIndex: ['justification', 'documents'],
      key: 'documents',
      width: 100,
      render: (documents) => (
        <Badge 
          count={documents?.length || 0} 
          showZero 
          style={{ backgroundColor: '#1890ff' }}
        />
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 180,
      render: (status) => getJustificationStatusTag(status)
    },
    {
      title: 'Submitted',
      dataIndex: ['justification', 'justificationDate'],
      key: 'submittedDate',
      width: 120,
      render: (date) => date ? new Date(date).toLocaleDateString('en-GB') : 'N/A'
    },
    {
      title: 'Action',
      key: 'action',
      width: 120,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Review Justification">
            <Button
              type="primary"
              size="small"
              icon={<FileTextOutlined />}
              onClick={() => handleReviewJustification(record._id)}
            >
              Review
            </Button>
          </Tooltip>
        </Space>
      )
    }
  ];

  const pendingJustifications = justifications.filter(
    j => j.status === 'justification_pending_supervisor'
  );

  const completedJustifications = justifications.filter(
    j => j.status !== 'justification_pending_supervisor'
  );

  return (
    <div style={{ padding: '24px' }}>
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <ClockCircleOutlined style={{ fontSize: '24px', color: '#faad14', marginBottom: '8px' }} />
              <div style={{ fontSize: '12px', color: '#666' }}>Cash Pending</div>
              <div style={{ fontSize: '20px', fontWeight: 'bold' }}>
                {cashRequests.filter(r => r.status.includes('pending')).length}
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <FileTextOutlined style={{ fontSize: '24px', color: '#1890ff', marginBottom: '8px' }} />
              <div style={{ fontSize: '12px', color: '#666' }}>Justifications Pending</div>
              <div style={{ fontSize: '20px', fontWeight: 'bold' }}>
                {pendingJustifications.length}
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <CheckCircleOutlined style={{ fontSize: '24px', color: '#52c41a', marginBottom: '8px' }} />
              <div style={{ fontSize: '12px', color: '#666' }}>Cash Approved</div>
              <div style={{ fontSize: '20px', fontWeight: 'bold' }}>
                {cashRequests.filter(r => r.status === 'approved').length}
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <CloseCircleOutlined style={{ fontSize: '24px', color: '#ff4d4f', marginBottom: '8px' }} />
              <div style={{ fontSize: '12px', color: '#666' }}>Denied</div>
              <div style={{ fontSize: '20px', fontWeight: 'bold' }}>
                {cashRequests.filter(r => r.status === 'denied').length}
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: 'approvals',
            label: (
              <span>
                <DollarOutlined />
                Cash Request Approvals
              </span>
            ),
            children: (
              <Card>
                <Spin spinning={loading}>
                  {cashRequests.length === 0 ? (
                    <Empty description="No cash requests to approve" />
                  ) : (
                    <Table
                      columns={cashRequestsColumns}
                      dataSource={cashRequests}
                      rowKey="_id"
                      pagination={{ pageSize: 10 }}
                      scroll={{ x: 1200 }}
                    />
                  )}
                </Spin>
              </Card>
            )
          },
          {
            key: 'justifications',
            label: (
              <span>
                <FileTextOutlined />
                Justification Approvals
                {pendingJustifications.length > 0 && (
                  <Badge 
                    count={pendingJustifications.length} 
                    style={{ marginLeft: '8px', backgroundColor: '#ff4d4f' }}
                  />
                )}
              </span>
            ),
            children: (
              <Spin spinning={loading}>
                {justifications.length === 0 ? (
                  <Empty description="No justifications to review" />
                ) : (
                  <>
                    {pendingJustifications.length > 0 && (
                      <Card 
                        title={`Pending Your Review (${pendingJustifications.length})`}
                        style={{ marginBottom: '24px' }}
                        bodyStyle={{ padding: 0 }}
                      >
                        <Table
                          columns={justificationsColumns}
                          dataSource={pendingJustifications}
                          rowKey="_id"
                          pagination={false}
                          scroll={{ x: 1400 }}
                        />
                      </Card>
                    )}

                    {completedJustifications.length > 0 && (
                      <Card 
                        title={`Processing History (${completedJustifications.length})`}
                        bodyStyle={{ padding: 0 }}
                      >
                        <Table
                          columns={justificationsColumns}
                          dataSource={completedJustifications}
                          rowKey="_id"
                          pagination={{ pageSize: 10 }}
                          scroll={{ x: 1400 }}
                        />
                      </Card>
                    )}
                  </>
                )}
              </Spin>
            )
          }
        ]}
      />
    </div>
  );
};

export default SupervisorCashApprovals;





