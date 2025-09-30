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
  UserOutlined,
  CalendarOutlined,
  BankOutlined,
  AuditOutlined,
  EyeOutlined,
  ReloadOutlined,
  ExclamationCircleOutlined,
  SendOutlined
} from '@ant-design/icons';
import api from '../../services/api';

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
    rejected: 0
  });

  useEffect(() => {
    fetchCashRequests();
  }, []);

  const fetchCashRequests = async () => {
    try {
      setLoading(true);
      console.log('Fetching finance cash approvals...');
    
      // Mock data for demonstration
      const mockResponse = {
        success: true,
        data: [
          {
            _id: '1',
            employee: {
              _id: 'emp1',
              fullName: 'Ms. Sarah Johnson',
              email: 'sarah.johnson@gratoengineering.com',
              department: 'Business Development',
              position: 'Project Coordinator'
            },
            amountRequested: 250000,
            requestType: 'travel-expenses',
            purpose: 'Client meeting in Douala - transportation and accommodation costs',
            urgency: 'medium',
            expectedDate: '2024-08-20',
            status: 'pending_finance',
            createdAt: '2024-08-14T10:30:00Z',
            supervisorApproval: {
              approvedBy: 'Mr. Department Head',
              approvedAt: '2024-08-14T15:30:00Z',
              comments: 'Approved. Client meeting is essential for project closure.'
            },
            justification: 'Need to meet with potential client to discuss new project requirements and finalize contract terms.',
            attachments: [
              {
                fileName: 'travel_itinerary.pdf',
                fileUrl: '#',
                uploadedAt: '2024-08-14T10:30:00Z'
              }
            ]
          },
          {
            _id: '2',
            employee: {
              _id: 'emp2',
              fullName: 'Mr. John Doe',
              email: 'john.doe@gratoengineering.com',
              department: 'Engineering',
              position: 'Senior Engineer'
            },
            amountRequested: 500000,
            requestType: 'equipment-purchase',
            purpose: 'New laptop for development work',
            urgency: 'high',
            expectedDate: '2024-08-18',
            status: 'approved',
            createdAt: '2024-08-13T09:15:00Z',
            supervisorApproval: {
              approvedBy: 'Mr. Tech Lead',
              approvedAt: '2024-08-13T14:30:00Z',
              comments: 'Current laptop is outdated. Approval granted.'
            },
            financeApproval: {
              approvedBy: 'Ms. Finance Manager',
              approvedAt: '2024-08-14T11:00:00Z',
              comments: 'Budget available. Approved for disbursement.'
            },
            justification: 'Current development laptop is 5 years old and causing significant delays in project delivery.',
            attachments: [
              {
                fileName: 'laptop_specifications.pdf',
                fileUrl: '#',
                uploadedAt: '2024-08-13T09:15:00Z'
              }
            ]
          },
          {
            _id: '3',
            employee: {
              _id: 'emp3',
              fullName: 'Ms. Jane Smith',
              email: 'jane.smith@gratoengineering.com',
              department: 'Marketing',
              position: 'Marketing Manager'
            },
            amountRequested: 750000,
            requestType: 'marketing-expenses',
            purpose: 'Q3 marketing campaign and advertising costs',
            urgency: 'low',
            expectedDate: '2024-09-01',
            status: 'disbursed',
            createdAt: '2024-08-10T14:20:00Z',
            supervisorApproval: {
              approvedBy: 'Mr. Marketing Director',
              approvedAt: '2024-08-11T10:00:00Z',
              comments: 'Marketing budget approved for Q3 campaign.'
            },
            financeApproval: {
              approvedBy: 'Ms. Finance Manager',
              approvedAt: '2024-08-12T09:30:00Z',
              comments: 'Disbursed. Awaiting justification documents.'
            },
            disbursement: {
              disbursedBy: 'Mr. Finance Officer',
              disbursedAt: '2024-08-12T16:00:00Z',
              disbursedAmount: 750000,
              method: 'Bank Transfer',
              reference: 'TXN-202408120001'
            },
            justification: 'Q3 marketing campaign to increase brand awareness and drive sales growth.',
            attachments: []
          }
        ],
        stats: {
          pendingFinance: 1,
          approved: 1,
          disbursed: 1,
          completed: 5,
          rejected: 2
        }
      };
      
      if (mockResponse.success) {
        setRequests(mockResponse.data || []);
        setStats(mockResponse.stats || {});
      } else {
        throw new Error('Failed to fetch cash requests');
      }
    } catch (error) {
      console.error('Error fetching cash requests:', error);
      message.error('Failed to load cash request approvals');
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
      
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      message.success('Cash request disbursed successfully');
      await fetchCashRequests();
      
    } catch (error) {
      console.error('Error disbursing request:', error);
      message.error('Failed to disburse cash request');
    }
  };

  // Secure file download handler
  const handleDownloadAttachment = async (attachment) => {
    try {
      if (!attachment.publicId && !attachment.fileUrl && !attachment.url) {
        message.error('No download link available for this attachment');
        return;
      }

      // Try secure download first if publicId is available
      if (attachment.publicId) {
        const actualPublicId = attachment.publicId.includes('/') 
          ? attachment.publicId.split('/').pop() 
          : attachment.publicId;

        const token = localStorage.getItem('token');
        const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5001/api'}/files/download/${actualPublicId}?filename=${encodeURIComponent(attachment.fileName || attachment.name)}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = attachment.fileName || attachment.name || 'attachment';
          
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);

          message.success(`Downloaded ${attachment.fileName || attachment.name}`);
          return;
        }
      }

      // Fallback to direct URL (fileUrl or url)
      const downloadUrl = attachment.fileUrl || attachment.url;
      if (downloadUrl) {
        window.open(downloadUrl, '_blank');
      } else {
        message.error('No download URL available');
      }
    } catch (error) {
      console.error('Error downloading attachment:', error);
      
      // Final fallback: try direct URL if available
      const downloadUrl = attachment.fileUrl || attachment.url;
      if (downloadUrl) {
        try {
          window.open(downloadUrl, '_blank');
          message.info('Opened attachment in new tab');
        } catch (fallbackError) {
          message.error('Failed to download attachment');
        }
      } else {
        message.error('Failed to download attachment');
      }
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
      'rejected': { 
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
        return requests.filter(req => req.status === 'pending_finance');
      case 'approved':
        return requests.filter(req => req.status === 'approved');
      case 'disbursed':
        return requests.filter(req => req.status === 'disbursed');
      case 'completed':
        return requests.filter(req => req.status === 'completed');
      case 'rejected':
        return requests.filter(req => req.status === 'rejected');
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
          <Text strong style={{ color: '#1890ff' }}>XAF {Number(record.amountRequested || 0).toLocaleString()}</Text>
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
            <CalendarOutlined /> Expected: {record.expectedDate ? new Date(record.expectedDate).toLocaleDateString('en-GB') : 'N/A'}
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
      render: (_, record) => (
        <div>
          {record.supervisorApproval ? (
            <>
              <Tag color="green" size="small">
                <CheckCircleOutlined /> Approved
              </Tag>
              <br />
              <Text type="secondary" style={{ fontSize: '11px' }}>
                By: {record.supervisorApproval.approvedBy}
              </Text>
              <br />
              <Text type="secondary" style={{ fontSize: '11px' }}>
                {new Date(record.supervisorApproval.approvedAt).toLocaleDateString('en-GB')}
              </Text>
              {record.supervisorApproval.comments && (
                <Tooltip title={record.supervisorApproval.comments}>
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
      ),
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
          {record.disbursement ? (
            <>
              <Tag color="cyan" size="small">
                <DollarOutlined /> Disbursed
              </Tag>
              <br />
              <Text type="secondary" style={{ fontSize: '11px' }}>
                Amount: XAF {Number(record.disbursement.disbursedAmount || 0).toLocaleString()}
              </Text>
              <br />
              <Text type="secondary" style={{ fontSize: '11px' }}>
                Method: {record.disbursement.method}
              </Text>
              <br />
              <Text type="secondary" style={{ fontSize: '10px' }}>
                Ref: {record.disbursement.reference}
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
                  onClick={() => handleDownloadAttachment(attachment)}
                  style={{ padding: 0, fontSize: '11px' }}
                >
                  📎 {attachment.fileName.length > 15 ? 
                    `${attachment.fileName.substring(0, 15)}...` : 
                    attachment.fileName
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
              icon={<AuditOutlined />}
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

  const pendingForMe = requests.filter(req => req.status === 'pending_finance').length;
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

      <style jsx>{`
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