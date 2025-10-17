import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Table,
  Tag,
  Space,
  Typography,
  Button,
  Alert,
  Spin,
  message,
  Badge,
  Tooltip,
  Tabs
} from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  CalendarOutlined,
  BankOutlined,
  EyeOutlined,
  ReloadOutlined,
  ExclamationCircleOutlined,
  SendOutlined
} from '@ant-design/icons';
import { cashRequestAPI } from '../../services/cashRequestAPI';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

const FinanceCashApprovals = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [stats, setStats] = useState({
    pendingFinance: 0,
    approved: 0,
    disbursed: 0,
    completed: 0,
    rejected: 0,
    justificationsPending: 0
  });
  const [justifications, setJustifications] = useState([]);

  useEffect(() => {
    // Fetch requests or justifications depending on activeTab
    if (activeTab === 'justifications') {
      fetchJustifications();
    } else {
      fetchCashRequests();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const fetchCashRequests = async () => {
    try {
      setLoading(true);
      console.log('Fetching cash approvals using supervisor logic...');

      // Use the same backend logic as the supervisor view: fetch requests where the current user
      // appears in the approvalChain and the server has already applied hierarchy checks.
      const response = await cashRequestAPI.getSupervisorRequests();

      if (response && response.success) {
        const requestsData = response.data || [];
        setRequests(requestsData);

        // The supervisor endpoint enriches requests with teamRequestMetadata which indicates
        // whether the current user has pending approvals or has approved specific levels.
        const calculatedStats = {
          pendingFinance: requestsData.filter(req => req.teamRequestMetadata?.userHasPendingApproval).length,
          approved: requestsData.filter(req => req.teamRequestMetadata?.userHasApproved).length,
          disbursed: requestsData.filter(req => req.status === 'disbursed').length,
          completed: requestsData.filter(req => req.status === 'completed').length,
          rejected: requestsData.filter(req => req.status === 'denied').length,
          justificationsPending: requestsData.filter(req => (req.status || '').startsWith('justification')).length
        };

        setStats(calculatedStats);
      } else {
        throw new Error('Failed to fetch cash requests');
      }
    } catch (error) {
      console.error('Error fetching cash requests (supervisor logic):', error);
      message.error(error.response?.data?.message || 'Failed to load cash request approvals');
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    await fetchCashRequests();
    message.success('Data refreshed successfully');
  };

  const handleDisburse = async (requestId) => {
    try {
      console.log('Disbursing cash request:', requestId);
      
      // Navigate to the approval form to handle disbursement
      navigate(`/finance/cash-request/${requestId}`);

    } catch (error) {
      console.error('Error disbursing request:', error);
      message.error('Failed to disburse cash request');
    }
  };

  const fetchJustifications = async () => {
    try {
      setLoading(true);
      console.log('Fetching finance justifications...');
      const response = await cashRequestAPI.getFinanceJustifications();
      if (response.success) {
        const data = response.data || [];
        setJustifications(data);
        setStats(prev => ({ ...prev, justificationsPending: data.filter(d => d.status === 'justification_pending_finance' || d.status === 'justification_pending').length }));
      } else {
        throw new Error('Failed to fetch justifications');
      }
    } catch (error) {
      console.error('Error fetching justifications:', error);
      message.error(error.response?.data?.message || 'Failed to load justifications');
      setJustifications([]);
    } finally {
      setLoading(false);
    }
  };

  const handleReviewJustification = (requestId) => {
    // Navigate to the finance request detail where the justification can be reviewed
    navigate(`/finance/cash-request/${requestId}`);
  };

  // Secure file download handler
  const handleDownloadAttachment = async (requestId, attachment) => {
    try {
      if (!attachment.fileName && !attachment.name) {
        message.error('No filename available for this attachment');
        return;
      }

      const fileName = attachment.fileName || attachment.name;
      const blob = await cashRequestAPI.downloadAttachment(requestId, fileName);
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      message.success(`Downloaded ${fileName}`);
    } catch (error) {
      console.error('Error downloading attachment:', error);
      message.error('Failed to download attachment');
    }
  };

  const getStatusTag = (status) => {
    const statusMap = {
      'pending_finance': { 
        color: 'orange', 
        icon: <ClockCircleOutlined />, 
        text: 'Your Approval Required' 
      },
      'approved': { 
        color: 'green', 
        icon: <CheckCircleOutlined />, 
        text: 'Approved - Ready for Disbursement' 
      },
      'disbursed': { 
        color: 'cyan', 
        icon: <DollarOutlined />, 
        text: 'Disbursed - Awaiting Justification' 
      },
      'completed': { 
        color: 'green', 
        icon: <CheckCircleOutlined />, 
        text: 'Completed' 
      },
      'denied': { 
        color: 'red', 
        icon: <CloseCircleOutlined />, 
        text: 'Rejected' 
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

  const getUrgencyTag = (urgency) => {
    const urgencyMap = {
      'high': { color: 'red', text: 'High' },
      'medium': { color: 'orange', text: 'Medium' },
      'low': { color: 'green', text: 'Low' }
    };

    const urgencyInfo = urgencyMap[urgency] || { color: 'default', text: urgency };

    return (
      <Tag color={urgencyInfo.color}>
        {urgencyInfo.text}
      </Tag>
    );
  };

  const getFilteredRequests = () => {
    switch (activeTab) {
      case 'pending':
        // Use supervisor-style metadata when available so "pending" matches the counts
        return requests.filter(req => {
          if (req.teamRequestMetadata && typeof req.teamRequestMetadata.userHasPendingApproval !== 'undefined') {
            return req.teamRequestMetadata.userHasPendingApproval;
          }
          // Fallback to status-based filtering
          return req.status === 'pending_finance';
        });
      case 'approved':
        return requests.filter(req => {
          if (req.teamRequestMetadata && typeof req.teamRequestMetadata.userHasApproved !== 'undefined') {
            return req.teamRequestMetadata.userHasApproved || req.status === 'approved';
          }
          return req.status === 'approved';
        });
      case 'disbursed':
        return requests.filter(req => req.status === 'disbursed');
      case 'completed':
        return requests.filter(req => req.status === 'completed');
      case 'rejected':
        return requests.filter(req => req.status === 'denied');
      default:
        return requests;
    }
  };

  const requestColumns = [
    {
      title: 'Employee',
      key: 'employee',
      render: (_, record) => (
        <div>
          <Text strong>{record.employee?.fullName || 'N/A'}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.employee?.position || 'N/A'}
          </Text>
          <br />
          <Tag color="blue" size="small">{record.employee?.department || 'N/A'}</Tag>
        </div>
      ),
      width: 180
    },
    {
      title: 'Request Details',
      key: 'requestDetails',
      render: (_, record) => (
        <div>
          <Text strong style={{ color: '#1890ff' }}>
            XAF {Number(record.amountRequested || 0).toLocaleString()}
          </Text>
          <br />
          <Text type="secondary" style={{ fontSize: '12px' }}>
            Type: {record.requestType?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'N/A'}
          </Text>
          <br />
          <Tooltip title={record.purpose}>
            <Text ellipsis style={{ maxWidth: 200, fontSize: '11px', color: '#666' }}>
              {record.purpose && record.purpose.length > 40 ? 
                `${record.purpose.substring(0, 40)}...` : 
                record.purpose || 'No purpose specified'
              }
            </Text>
          </Tooltip>
        </div>
      ),
      width: 200
    },
    {
      title: 'Priority & Dates',
      key: 'priorityDate',
      render: (_, record) => (
        <div>
          {getUrgencyTag(record.urgency)}
          <br />
          <Text type="secondary" style={{ fontSize: '11px' }}>
            <CalendarOutlined /> Expected: {record.requiredDate ? new Date(record.requiredDate).toLocaleDateString('en-GB') : 'N/A'}
          </Text>
          <br />
          <Text type="secondary" style={{ fontSize: '11px' }}>
            Submitted: {record.createdAt ? new Date(record.createdAt).toLocaleDateString('en-GB') : 'N/A'}
          </Text>
        </div>
      ),
      sorter: (a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0),
      width: 140
    },
    {
      title: 'Supervisor Approval',
      key: 'supervisorApproval',
      render: (_, record) => {
        // Check approval chain for supervisor approval
        const supervisorApproval = record.approvalChain?.find(step => step.level === 1 && step.status === 'approved');
        
        return (
          <div>
            {supervisorApproval ? (
              <>
                <Tag color="green" size="small">
                  <CheckCircleOutlined /> Approved
                </Tag>
                <br />
                <Text type="secondary" style={{ fontSize: '11px' }}>
                  By: {supervisorApproval.approver?.name || 'Supervisor'}
                </Text>
                <br />
                <Text type="secondary" style={{ fontSize: '11px' }}>
                  {supervisorApproval.actionDate ? new Date(supervisorApproval.actionDate).toLocaleDateString('en-GB') : 'N/A'}
                </Text>
                {supervisorApproval.comments && (
                  <Tooltip title={supervisorApproval.comments}>
                    <br />
                    <Text style={{ fontSize: '10px', color: '#666' }}>
                      💬 View comments
                    </Text>
                  </Tooltip>
                )}
              </>
            ) : (
              <Tag color="orange" size="small">
                <ClockCircleOutlined /> Pending
              </Tag>
            )}
          </div>
        );
      },
      width: 140
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => getStatusTag(status),
      width: 180
    },
    {
      title: 'Disbursement Info',
      key: 'disbursement',
      render: (_, record) => (
        <div>
          {record.disbursementDetails ? (
            <>
              <Tag color="cyan" size="small">
                <DollarOutlined /> Disbursed
              </Tag>
              <br />
              <Text type="secondary" style={{ fontSize: '11px' }}>
                Amount: XAF {Number(record.disbursementDetails.amount || 0).toLocaleString()}
              </Text>
              <br />
              <Text type="secondary" style={{ fontSize: '11px' }}>
                Date: {record.disbursementDetails.date ? new Date(record.disbursementDetails.date).toLocaleDateString('en-GB') : 'N/A'}
              </Text>
            </>
          ) : record.status === 'approved' ? (
            <Tag color="orange" size="small">
              <ExclamationCircleOutlined /> Ready for Disbursement
            </Tag>
          ) : (
            <Text type="secondary" style={{ fontSize: '11px' }}>
              Not disbursed
            </Text>
          )}
        </div>
      ),
      width: 160
    },
    {
      title: 'Attachments',
      key: 'attachments',
      render: (_, record) => (
        <div>
          {record.attachments && record.attachments.length > 0 ? (
            <Space direction="vertical" size="small">
              {record.attachments.slice(0, 2).map((attachment, index) => (
                <Button 
                  key={index}
                  size="small" 
                  type="link"
                  onClick={() => handleDownloadAttachment(record._id, attachment)}
                  style={{ padding: 0, fontSize: '11px' }}
                >
                  📎 {(attachment.fileName || attachment.name).length > 15 ? 
                    `${(attachment.fileName || attachment.name).substring(0, 15)}...` : 
                    (attachment.fileName || attachment.name)
                  }
                </Button>
              ))}
              {record.attachments.length > 2 && (
                <Text type="secondary" style={{ fontSize: '10px' }}>
                  +{record.attachments.length - 2} more
                </Text>
              )}
            </Space>
          ) : (
            <Text type="secondary" style={{ fontSize: '11px' }}>No attachments</Text>
          )}
        </div>
      ),
      width: 120
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space direction="vertical" size="small">
          <Button 
            type="link" 
            icon={<EyeOutlined />}
            onClick={() => navigate(`/finance/cash-request/${record._id}`)}
            size="small"
          >
            View Details
          </Button>
          {record.status === 'pending_finance' && (
            <Button 
              type="primary"
              size="small"
              icon={<CheckCircleOutlined />}
              onClick={() => navigate(`/finance/cash-request/${record._id}`)}
            >
              Process Approval
            </Button>
          )}
          {record.status === 'approved' && (
            <Button 
              type="default"
              size="small"
              icon={<SendOutlined />}
              onClick={() => handleDisburse(record._id)}
              style={{ color: '#52c41a', borderColor: '#52c41a' }}
            >
              Disburse
            </Button>
          )}
        </Space>
      ),
      width: 130
    }
  ];

  // Use teamRequestMetadata from supervisor endpoint so "pending for me" matches the same logic
  const pendingForMe = requests.filter(req => req.teamRequestMetadata?.userHasPendingApproval).length;
  const readyForDisbursement = requests.filter(req => req.status === 'approved').length;

  if (loading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Spin size="large" />
        <div style={{ marginTop: '16px' }}>Loading finance cash approvals...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      {/* Stats Cards */}
      <div style={{ marginBottom: '24px' }}>
        <Space size="large" wrap>
          <Card size="small" style={{ minWidth: '150px' }}>
            <Badge count={pendingForMe} offset={[10, 0]} color="#faad14">
              <div>
                <Text type="secondary">Your Approvals</Text>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#faad14' }}>
                  {pendingForMe}
                </div>
              </div>
            </Badge>
          </Card>

          <Card size="small" style={{ minWidth: '150px' }}>
            <Badge count={readyForDisbursement} offset={[10, 0]} color="#52c41a">
              <div>
                <Text type="secondary">Ready to Disburse</Text>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#52c41a' }}>
                  {readyForDisbursement}
                </div>
              </div>
            </Badge>
          </Card>

          <Card size="small" style={{ minWidth: '150px' }}>
            <div>
              <Text type="secondary">Disbursed</Text>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1890ff' }}>
                {stats.disbursed || 0}
              </div>
            </div>
          </Card>

          <Card size="small" style={{ minWidth: '150px' }}>
            <div>
              <Text type="secondary">Completed</Text>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#722ed1' }}>
                {stats.completed || 0}
              </div>
            </div>
          </Card>

          <Card size="small" style={{ minWidth: '150px' }}>
            <div>
              <Text type="secondary">Rejected</Text>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ff4d4f' }}>
                {stats.rejected || 0}
              </div>
            </div>
          </Card>
        </Space>
      </div>

      {/* Main Content */}
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <Title level={2} style={{ margin: 0 }}>
            <BankOutlined /> Finance Cash Approvals
          </Title>
          <Space>
            <Button 
              icon={<ReloadOutlined />}
              onClick={handleRefresh}
              loading={loading}
            >
              Refresh
            </Button>
          </Space>
        </div>

        {(pendingForMe > 0 || readyForDisbursement > 0) && (
          <Alert
            message={
              <div>
                {pendingForMe > 0 && (
                  <div>🔔 You have {pendingForMe} cash request(s) waiting for your approval</div>
                )}
                {readyForDisbursement > 0 && (
                  <div>💰 {readyForDisbursement} request(s) are ready for disbursement</div>
                )}
              </div>
            }
            type="warning"
            showIcon
            style={{ marginBottom: '16px' }}
          />
        )}

        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane 
            tab={
              <Badge count={stats.pendingFinance} offset={[10, 0]} color="#faad14">
                <span>
                  <ExclamationCircleOutlined />
                  Pending Approval ({stats.pendingFinance})
                </span>
              </Badge>
            } 
            key="pending"
          >
            <Table 
              columns={requestColumns} 
              dataSource={getFilteredRequests()} 
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
                if (record.status === 'pending_finance') {
                  return 'highlight-row-urgent'; 
                }
                return '';
              }}
            />
          </TabPane>

          <TabPane
            tab={
              <Badge count={justifications.length} offset={[10, 0]} color="#1890ff">
                <span>
                  <ExclamationCircleOutlined />
                  Justifications ({justifications.length})
                </span>
              </Badge>
            }
            key="justifications"
          >
            <Table
              columns={[
                {
                  title: 'Request ID',
                  dataIndex: '_id',
                  key: '_id',
                  width: 140,
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
                    <span style={{ fontWeight: 'bold' }}>XAF {parseFloat(amount || 0).toLocaleString()}</span>
                  )
                },
                {
                  title: 'Amount Spent',
                  dataIndex: ['justification', 'amountSpent'],
                  key: 'amountSpent',
                  width: 140,
                  render: (amount) => <span>XAF {parseFloat(amount || 0).toLocaleString()}</span>
                },
                {
                  title: 'Documents',
                  dataIndex: ['justification', 'documents'],
                  key: 'documents',
                  width: 100,
                  render: (documents) => (
                    <Badge count={documents?.length || 0} showZero style={{ backgroundColor: '#1890ff' }} />
                  )
                },
                {
                  title: 'Status',
                  dataIndex: 'status',
                  key: 'status',
                  width: 180,
                  render: (status) => {
                    const tag = status === 'justification_pending_finance' || status === 'justification_pending' ?
                      { color: 'orange', text: 'Pending Finance Review' } : { color: 'default', text: status };
                    return <Tag color={tag.color}>{tag.text}</Tag>;
                  }
                },
                {
                  title: 'Submitted',
                  dataIndex: ['justification', 'justificationDate'],
                  key: 'submittedDate',
                  width: 140,
                  render: (date) => date ? new Date(date).toLocaleDateString('en-GB') : 'N/A'
                },
                {
                  title: 'Action',
                  key: 'action',
                  width: 120,
                  render: (_, record) => (
                    <Space size="small">
                      <Button type="link" size="small" onClick={() => handleReviewJustification(record._id)}>Review</Button>
                    </Space>
                  )
                }
              ]}
              dataSource={justifications}
              loading={loading}
              rowKey="_id"
              pagination={{ pageSize: 10, showSizeChanger: true }}
            />
          </TabPane>

          <TabPane 
            tab={
              <Badge count={stats.approved} offset={[10, 0]} color="#52c41a">
                <span>
                  <DollarOutlined />
                  Ready to Disburse ({stats.approved})
                </span>
              </Badge>
            } 
            key="approved"
          >
            <Table 
              columns={requestColumns} 
              dataSource={getFilteredRequests()} 
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
              rowClassName={() => 'highlight-row-ready'}
            />
          </TabPane>

          <TabPane 
            tab={
              <span>
                <SendOutlined />
                Disbursed ({stats.disbursed})
              </span>
            } 
            key="disbursed"
          >
            <Table 
              columns={requestColumns} 
              dataSource={getFilteredRequests()} 
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
            />
          </TabPane>

          <TabPane 
            tab={
              <span>
                <CheckCircleOutlined />
                Completed ({stats.completed})
              </span>
            } 
            key="completed"
          >
            <Table 
              columns={requestColumns} 
              dataSource={getFilteredRequests()} 
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
            />
          </TabPane>

          <TabPane 
            tab={
              <span>
                <CloseCircleOutlined />
                Rejected ({stats.rejected})
              </span>
            } 
            key="rejected"
          >
            <Table 
              columns={requestColumns} 
              dataSource={getFilteredRequests()} 
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
            />
          </TabPane>
        </Tabs>
      </Card>

      <style>{`
        .highlight-row-urgent {
          background-color: #fff7e6 !important;
          border-left: 4px solid #faad14 !important;
        }
        .highlight-row-urgent:hover {
          background-color: #fff1d6 !important;
        }
        .highlight-row-ready {
          background-color: #f6ffed !important;
          border-left: 4px solid #52c41a !important;
        }
        .highlight-row-ready:hover {
          background-color: #d9f7be !important;
        }
      `}</style>
    </div>
  );
};

export default FinanceCashApprovals;





