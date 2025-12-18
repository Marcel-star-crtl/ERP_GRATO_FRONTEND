import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
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
  Tabs,
  Progress,
  Statistic,
  Row,
  Col
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
  SendOutlined,
  FileTextOutlined,
  AuditOutlined,
  DownloadOutlined,
  SyncOutlined
} from '@ant-design/icons';
import { cashRequestAPI } from '../../services/cashRequestAPI';
import CashRequestExportModal from './CashRequestExport';
import DisbursementModal from './DisbursementModal';
import JustificationApprovalModal from './JustificationApprovalModal';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

const FinanceCashApprovals = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [exportModalVisible, setExportModalVisible] = useState(false);
  
  // Disbursement modal state
  const [disbursementModalVisible, setDisbursementModalVisible] = useState(false);
  const [selectedDisbursementRequest, setSelectedDisbursementRequest] = useState(null);
  
  // Justification modal state
  const [justificationModalVisible, setJustificationModalVisible] = useState(false);
  const [selectedJustificationRequest, setSelectedJustificationRequest] = useState(null);
  
  const [stats, setStats] = useState({
    pendingFinance: 0,
    approved: 0,
    partiallyDisbursed: 0,
    fullyDisbursed: 0,
    completed: 0,
    rejected: 0,
    justificationsPending: 0
  });
  const [justifications, setJustifications] = useState([]);

  // ============ HELPER FUNCTIONS ============

  const isJustificationStatus = (status) => {
    return status && (
      status.includes('justification_pending') || 
      status.includes('justification_rejected') ||
      status === 'completed'
    );
  };

  const extractJustificationLevel = (status) => {
    if (!status || !status.includes('justification_')) return null;
    
    const levelMap = {
      'justification_pending_supervisor': 1,
      'justification_pending_departmental_head': 2,
      'justification_pending_head_of_business': 3,
      'justification_pending_finance': 4,
      'justification_rejected_supervisor': 1,
      'justification_rejected_departmental_head': 2,
      'justification_rejected_head_of_business': 3,
      'justification_rejected_finance': 4
    };
    
    return levelMap[status] || null;
  };

  const getJustificationStatusInfo = (status, level = null) => {
    const statusLevel = level || extractJustificationLevel(status);
    
    const levelNames = {
      1: 'Supervisor',
      2: 'Departmental Head',
      3: 'Head of Business',
      4: 'Finance'
    };
    
    if (status === 'completed') {
      return {
        text: 'Completed',
        color: 'cyan',
        icon: <CheckCircleOutlined />,
        description: 'All approvals completed'
      };
    }
    
    if (status?.includes('justification_rejected')) {
      return {
        text: `Revision Required (${levelNames[statusLevel]})`,
        color: 'gold',
        icon: <ExclamationCircleOutlined />,
        description: `Rejected at Level ${statusLevel} - ${levelNames[statusLevel]}`
      };
    }
    
    if (status?.includes('justification_pending')) {
      return {
        text: `Level ${statusLevel}/4: Pending ${levelNames[statusLevel]}`,
        color: 'orange',
        icon: <ClockCircleOutlined />,
        description: `Awaiting approval from ${levelNames[statusLevel]}`
      };
    }
    
    return {
      text: status?.replace(/_/g, ' ') || 'Unknown',
      color: 'default',
      icon: null,
      description: ''
    };
  };

  const canUserApproveJustification = useCallback((request) => {
    if (!request.justificationApprovalChain || !user?.email) {
      return false;
    }

    if (!isJustificationStatus(request.status)) {
      return false;
    }

    const currentStatusLevel = extractJustificationLevel(request.status);
    
    if (!currentStatusLevel) {
      return false;
    }

    const userPendingSteps = request.justificationApprovalChain.filter(step => {
      const emailMatch = step.approver?.email?.toLowerCase() === user.email.toLowerCase();
      const isPending = step.status === 'pending';
      
      return emailMatch && isPending;
    });

    if (userPendingSteps.length === 0) {
      return false;
    }

    const canApprove = userPendingSteps.some(step => step.level === currentStatusLevel);

    return canApprove;
  }, [user?.email]);

  // ============ DATA FETCHING ============

  const fetchAllData = useCallback(async () => {
    try {
      setLoading(true);
      console.log('Fetching all cash requests and justifications...');

      const response = await cashRequestAPI.getFinanceRequests();

      if (response && response.success) {
        const allData = response.data || [];
        
        console.log('Total records fetched:', allData.length);
        
        // Improved: More precise separation
        const cashRequestsOnly = allData.filter(req =>
          !isJustificationStatus(req.status) &&
          ['pending_finance', 'approved', 'disbursed', 'partially_disbursed', 'fully_disbursed', 'denied'].includes(req.status)
        );
        const justificationsOnly = allData.filter(req => isJustificationStatus(req.status));
        
        console.log('Cash requests:', cashRequestsOnly.length);
        console.log('Justifications:', justificationsOnly.length);
        
        setRequests(cashRequestsOnly);
        setJustifications(justificationsOnly);

        const pendingJustifications = justificationsOnly.filter(j => 
          canUserApproveJustification(j)
        ).length;

        console.log('Pending justifications for user:', pendingJustifications);

        const calculatedStats = {
          pendingFinance: cashRequestsOnly.filter(req => req.teamRequestMetadata?.userHasPendingApproval).length,
          approved: cashRequestsOnly.filter(req => req.status === 'approved').length,
          partiallyDisbursed: cashRequestsOnly.filter(req => 
            req.status === 'partially_disbursed' || 
            (req.status === 'disbursed' && (req.remainingBalance || 0) > 0)
          ).length,
          fullyDisbursed: cashRequestsOnly.filter(req => 
            req.status === 'fully_disbursed' || 
            (req.status === 'disbursed' && (req.remainingBalance || 0) === 0)
          ).length,
          completed: allData.filter(req => req.status === 'completed').length,
          rejected: cashRequestsOnly.filter(req => req.status === 'denied').length,
          justificationsPending: pendingJustifications
        };

        console.log('Calculated stats:', calculatedStats);
        setStats(calculatedStats);
      } else {
        throw new Error('Failed to fetch data');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      message.error(error.response?.data?.message || 'Failed to load finance approvals');
      setRequests([]);
      setJustifications([]);
    } finally {
      setLoading(false);
    }
  }, [canUserApproveJustification]);

  useEffect(() => {
    if (user?.email) {
      fetchAllData();
    }
  }, [fetchAllData, user?.email]);

  const handleRefresh = async () => {
    await fetchAllData();
    message.success('Data refreshed successfully');
  };

  // ============ DISBURSEMENT HANDLERS ============

  const handleOpenDisbursementModal = (request) => {
    setSelectedDisbursementRequest(request);
    setDisbursementModalVisible(true);
  };

  const handleDisbursementSubmit = async ({ requestId, amount, notes }) => {
    try {
      console.log('Processing disbursement:', { requestId, amount, notes });
      
      const response = await cashRequestAPI.processDisbursement(requestId, {
        amount,
        notes
      });

      if (response.success) {
        message.success(response.message || 'Disbursement processed successfully');
        setDisbursementModalVisible(false);
        setSelectedDisbursementRequest(null);
        await fetchAllData();
      } else {
        throw new Error(response.message || 'Failed to process disbursement');
      }
    } catch (error) {
      console.error('Disbursement error:', error);
      message.error(error.response?.data?.message || 'Failed to process disbursement');
    }
  };

  // ============ JUSTIFICATION HANDLERS ============

  const handleOpenJustificationModal = (request) => {
    setSelectedJustificationRequest(request);
    setJustificationModalVisible(true);
  };

  const handleJustificationSubmit = async ({ requestId, decision, comments }) => {
    try {
      console.log('Processing justification decision:', { requestId, decision, comments });
      
      const response = await cashRequestAPI.processJustificationDecision(requestId, {
        decision,
        comments
      });

      if (response.success) {
        message.success(response.message || `Justification ${decision} successfully`);
        setJustificationModalVisible(false);
        setSelectedJustificationRequest(null);
        await fetchAllData();
      } else {
        throw new Error(response.message || 'Failed to process justification');
      }
    } catch (error) {
      console.error('Justification decision error:', error);
      message.error(error.response?.data?.message || 'Failed to process justification');
    }
  };

  const handleReviewJustification = (requestId) => {
    navigate(`/finance/cash-request/${requestId}`);
  };

  const getStatusTag = (status) => {
    if (isJustificationStatus(status)) {
      const statusInfo = getJustificationStatusInfo(status);
      return (
        <Tooltip title={statusInfo.description}>
          <Tag color={statusInfo.color} icon={statusInfo.icon}>
            {statusInfo.text}
          </Tag>
        </Tooltip>
      );
    }

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
        color: 'processing',
        icon: <SyncOutlined spin />,
        text: 'Disbursed'
      },
      'partially_disbursed': { 
        color: 'processing', 
        icon: <SyncOutlined spin />, 
        text: 'Partially Disbursed' 
      },
      'fully_disbursed': { 
        color: 'cyan', 
        icon: <DollarOutlined />, 
        text: 'Fully Disbursed - Awaiting Justification' 
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
      'urgent': { color: 'red', text: 'Urgent' },
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
      case 'partially_disbursed':
        return requests.filter(req =>
          req.status === 'partially_disbursed' ||
          (req.status === 'disbursed' && (req.remainingBalance || 0) > 0)
        );
      case 'fully_disbursed':
        return requests.filter(req =>
          req.status === 'fully_disbursed' ||
          (req.status === 'disbursed' && (req.remainingBalance || 0) === 0)
        );
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
      title: 'Request ID',
      dataIndex: 'id',
      key: 'id',
      render: (id) => (
        <Tag color="blue">
          REQ-{id.toString().slice(-6).toUpperCase()}
        </Tag>
      ),
      width: 120
    },
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
              {record.purpose && record.purpose.length > 40 
                ? `${record.purpose.substring(0, 40)}...` 
                : record.purpose || 'No purpose specified'
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
      title: 'Disbursement Status',
      key: 'disbursementStatus',
      render: (_, record) => {
        const amountRequested = record.amountRequested || 0;
        const totalDisbursed = record.totalDisbursed || 0;
        const remainingBalance = record.remainingBalance || 0;
        
        // Calculate progress based on amountRequested
        const progress = amountRequested > 0 
          ? Math.round((totalDisbursed / amountRequested) * 100) 
          : 0;

        if (record.status === 'approved') {
          return (
            <div>
              <Tag color="orange" size="small">
                <ExclamationCircleOutlined /> Ready
              </Tag>
              <br />
              <Text type="secondary" style={{ fontSize: '10px' }}>
                0 / {amountRequested.toLocaleString()}
              </Text>
            </div>
          );
        }

        if (['partially_disbursed', 'fully_disbursed', 'disbursed'].includes(record.status)) {
          return (
            <div>
              <Progress 
                percent={progress} 
                size="small" 
                status={progress === 100 ? 'success' : 'active'}
                style={{ marginBottom: '4px' }}
              />
              <Text style={{ fontSize: '11px', display: 'block' }}>
                <Text strong style={{ color: progress === 100 ? '#52c41a' : '#1890ff' }}>
                  {totalDisbursed.toLocaleString()}
                </Text>
                {' / '}
                <Text type="secondary">{amountRequested.toLocaleString()}</Text>
              </Text>
              {remainingBalance > 0 && (
                <Text type="secondary" style={{ fontSize: '10px', display: 'block' }}>
                  Remaining: {remainingBalance.toLocaleString()}
                </Text>
              )}
              <Text type="secondary" style={{ fontSize: '10px' }}>
                {record.disbursements?.length || 0} payment(s)
              </Text>
            </div>
          );
        }

        return <Text type="secondary" style={{ fontSize: '11px' }}>Not disbursed</Text>;
      },
      width: 180
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => getStatusTag(status),
      width: 200
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
          {(['approved', 'partially_disbursed'].includes(record.status) || 
            (record.status === 'disbursed' && (record.remainingBalance || 0) > 0)) && (
            <Button 
              type="default"
              size="small"
              icon={<SendOutlined />}
              onClick={() => handleOpenDisbursementModal(record)}
              style={{ color: '#52c41a', borderColor: '#52c41a' }}
            >
              Disburse
            </Button>
          )}
        </Space>
      ),
      width: 150
    }
  ];

  const justificationColumns = [
    {
      title: 'Request ID',
      dataIndex: 'id',
      key: 'id',
      width: 140,
      render: (id) => <Tag color="blue">REQ-{id.toString().slice(-6).toUpperCase()}</Tag>
    },
    {
      title: 'Employee',
      key: 'employee',
      render: (_, record) => (
        <div>
          <Text strong>{record.employee?.fullName || 'N/A'}</Text>
          <br />
          <Tag color="blue" size="small">
            {record.employee?.department || 'N/A'}
          </Tag>
        </div>
      ),
      width: 180
    },
    {
      title: 'Financial Summary',
      key: 'financial',
      render: (_, record) => {
        const disbursed = record.disbursementDetails?.amount || record.totalDisbursed || 0;
        const spent = record.justification?.amountSpent || 0;
        const returned = record.justification?.balanceReturned || 0;
        const isBalanced = Math.abs((spent + returned) - disbursed) < 0.01;

        return (
          <div>
            <Text type="secondary" style={{ fontSize: '11px' }}>
              Disbursed: XAF {disbursed.toLocaleString()}
            </Text>
            <br />
            <Text type="secondary" style={{ fontSize: '11px' }}>
              Spent: XAF {spent.toLocaleString()}
            </Text>
            <br />
            <Text type="secondary" style={{ fontSize: '11px' }}>
              Returned: XAF {returned.toLocaleString()}
            </Text>
            <br />
            {!isBalanced && (
              <Tag color="warning" size="small">Unbalanced</Tag>
            )}
          </div>
        );
      },
      width: 180
    },
    {
      title: 'Submitted Date',
      key: 'date',
      render: (_, record) => (
        <Text type="secondary">
          {record.justification?.justificationDate 
            ? new Date(record.justification.justificationDate).toLocaleDateString('en-GB')
            : 'N/A'
          }
        </Text>
      ),
      width: 120
    },
    {
      title: 'Approval Progress',
      key: 'progress',
      render: (_, record) => {
        if (!record.justificationApprovalChain) return <Text type="secondary">No chain</Text>;
        
        const currentLevel = extractJustificationLevel(record.status);
        const totalLevels = record.justificationApprovalChain.length;
        const approvedCount = record.justificationApprovalChain.filter(s => s.status === 'approved').length;
        
        return (
          <div>
            <Progress 
              percent={Math.round((approvedCount / totalLevels) * 100)} 
              size="small"
              status={record.status === 'completed' ? 'success' : 'active'}
              showInfo={false}
            />
            <Text style={{ fontSize: '11px' }}>
              Level {currentLevel || approvedCount + 1}/{totalLevels}
            </Text>
          </div>
        );
      },
      width: 120
    },
    {
      title: 'Status',
      key: 'justificationStatus',
      render: (_, record) => (
        <div>
          {getStatusTag(record.status)}
          {canUserApproveJustification(record) && (
            <div style={{ marginTop: 4 }}>
              <Tag color="gold" size="small">Your Turn</Tag>
            </div>
          )}
        </div>
      ),
      width: 200
    },
    {
      title: 'Documents',
      key: 'documents',
      render: (_, record) => (
        <Badge 
          count={record.justification?.documents?.length || 0} 
          showZero
          style={{ backgroundColor: '#52c41a' }}
        >
          <FileTextOutlined style={{ fontSize: '16px' }} />
        </Badge>
      ),
      width: 100
    },
    {
      title: 'Action',
      key: 'action',
      width: 180,
      render: (_, record) => (
        <Space size="small" direction="vertical">
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleReviewJustification(record._id)}
            block
          >
            View Details
          </Button>
          {canUserApproveJustification(record) && (
            <Button
              size="small"
              type="primary"
              icon={<AuditOutlined />}
              onClick={() => handleOpenJustificationModal(record)}
              block
            >
              Approve/Reject
            </Button>
          )}
        </Space>
      )
    }
  ];

  const pendingForMe = requests.filter(req => req.teamRequestMetadata?.userHasPendingApproval).length;
  const readyForDisbursement = stats.approved + stats.partiallyDisbursed;

  if (loading && requests.length === 0 && justifications.length === 0) {
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
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col span={4}>
          <Card size="small">
            <Statistic
              title="Your Approvals"
              value={pendingForMe}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card size="small">
            <Statistic
              title="Ready to Disburse"
              value={stats.approved}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card size="small">
            <Statistic
              title="Partial Disbursed"
              value={stats.partiallyDisbursed}
              prefix={<SyncOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card size="small">
            <Statistic
              title="Fully Disbursed"
              value={stats.fullyDisbursed}
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#13c2c2' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card size="small">
            <Statistic
              title="Justifications"
              value={stats.justificationsPending}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card size="small">
            <Statistic
              title="Completed"
              value={stats.completed}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

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
            <Button 
              type="primary"
              icon={<DownloadOutlined />}
              onClick={() => setExportModalVisible(true)}
            >
              Export Data
            </Button>
          </Space>
        </div>

        {(pendingForMe > 0 || readyForDisbursement > 0 || stats.justificationsPending > 0) && (
          <Alert
            message={
              <div>
                {pendingForMe > 0 && (
                  <div>🔔 You have {pendingForMe} cash request(s) waiting for your approval</div>
                )}
                {readyForDisbursement > 0 && (
                  <div>💰 {readyForDisbursement} request(s) are ready for disbursement</div>
                )}
                {stats.justificationsPending > 0 && (
                  <div>📄 {stats.justificationsPending} justification(s) require your review</div>
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
              <Badge count={stats.justificationsPending} offset={[10, 0]} color="#1890ff">
                <span>
                  <FileTextOutlined />
                  Justifications ({stats.justificationsPending})
                </span>
              </Badge>
            }
            key="justifications"
          >
            {activeTab === 'justifications' && (
              <Table
                columns={justificationColumns}
                dataSource={justifications}
                loading={loading}
                rowKey="_id"
                pagination={{ 
                  pageSize: 10, 
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (total, range) => 
                    `${range[0]}-${range[1]} of ${total} justifications`
                }}
                scroll={{ x: 1200 }}
                size="small"
                rowClassName={(record) => {
                  let className = 'cash-request-row';
                  if (canUserApproveJustification(record)) {
                    className += ' pending-approval-row';
                  }
                  return className;
                }}
              />
            )}
          </TabPane>

          <TabPane 
            tab={
              <Badge count={stats.approved} offset={[10, 0]} color="#52c41a">
                <span>
                  <CheckCircleOutlined />
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
              <Badge count={stats.partiallyDisbursed} offset={[10, 0]} color="#1890ff">
                <span>
                  <SyncOutlined />
                  Partially Disbursed ({stats.partiallyDisbursed})
                </span>
              </Badge>
            } 
            key="partially_disbursed"
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
              rowClassName={() => 'highlight-row-partial'}
            />
          </TabPane>

          <TabPane 
            tab={
              <Badge count={stats.fullyDisbursed} offset={[10, 0]} color="#13c2c2">
                <span>
                  <DollarOutlined />
                  Fully Disbursed ({stats.fullyDisbursed})
                </span>
              </Badge>
            } 
            key="fully_disbursed"
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

      {/* Modals */}
      <DisbursementModal
        visible={disbursementModalVisible}
        request={selectedDisbursementRequest}
        onSubmit={handleDisbursementSubmit}
        onCancel={() => {
          setDisbursementModalVisible(false);
          setSelectedDisbursementRequest(null);
        }}
      />

      <JustificationApprovalModal
        visible={justificationModalVisible}
        request={selectedJustificationRequest}
        onSubmit={handleJustificationSubmit}
        onCancel={() => {
          setJustificationModalVisible(false);
          setSelectedJustificationRequest(null);
        }}
      />

      <CashRequestExportModal
        visible={exportModalVisible}
        onCancel={() => setExportModalVisible(false)}
      />

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
        .highlight-row-partial {
          background-color: #e6f7ff !important;
          border-left: 4px solid #1890ff !important;
        }
        .highlight-row-partial:hover {
          background-color: #bae7ff !important;
        }
        .cash-request-row {
          background-color: #fafafa;
        }
        .cash-request-row:hover {
          background-color: #f0f0f0 !important;
        }
        .pending-approval-row {
          border-left: 3px solid #faad14;
          background-color: #fff7e6;
        }
        .pending-approval-row:hover {
          background-color: #fff1d6 !important;
        }
      `}</style>
    </div>
  );
};

export default FinanceCashApprovals;












// import React, { useState, useEffect, useCallback } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { useSelector } from 'react-redux';
// import {
//   Card,
//   Table,
//   Tag,
//   Space,
//   Typography,
//   Button,
//   Alert,
//   Spin,
//   message,
//   Badge,
//   Tooltip,
//   Tabs,
//   Progress,
//   Statistic,
//   Row,
//   Col
// } from 'antd';
// import {
//   CheckCircleOutlined,
//   CloseCircleOutlined,
//   ClockCircleOutlined,
//   DollarOutlined,
//   CalendarOutlined,
//   BankOutlined,
//   EyeOutlined,
//   ReloadOutlined,
//   ExclamationCircleOutlined,
//   SendOutlined,
//   FileTextOutlined,
//   AuditOutlined,
//   DownloadOutlined,
//   SyncOutlined
// } from '@ant-design/icons';
// import { cashRequestAPI } from '../../services/cashRequestAPI';
// import CashRequestExportModal from './CashRequestExport';
// import DisbursementModal from './DisbursementModal';
// import JustificationApprovalModal from './JustificationApprovalModal';

// const { Title, Text } = Typography;
// const { TabPane } = Tabs;

// const FinanceCashApprovals = () => {
//   const navigate = useNavigate();
//   const { user } = useSelector((state) => state.auth);
  
//   const [requests, setRequests] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [activeTab, setActiveTab] = useState('pending');
//   const [exportModalVisible, setExportModalVisible] = useState(false);
  
//   // Disbursement modal state
//   const [disbursementModalVisible, setDisbursementModalVisible] = useState(false);
//   const [selectedDisbursementRequest, setSelectedDisbursementRequest] = useState(null);
  
//   // Justification modal state
//   const [justificationModalVisible, setJustificationModalVisible] = useState(false);
//   const [selectedJustificationRequest, setSelectedJustificationRequest] = useState(null);
  
//   const [stats, setStats] = useState({
//     pendingFinance: 0,
//     approved: 0,
//     partiallyDisbursed: 0,
//     fullyDisbursed: 0,
//     completed: 0,
//     rejected: 0,
//     justificationsPending: 0
//   });
//   const [justifications, setJustifications] = useState([]);

//   // ============ HELPER FUNCTIONS ============

//   const isJustificationStatus = (status) => {
//     return status && (
//       status.includes('justification_pending') || 
//       status.includes('justification_rejected') ||
//       status === 'completed'
//     );
//   };

//   const extractJustificationLevel = (status) => {
//     if (!status || !status.includes('justification_')) return null;
    
//     const levelMap = {
//       'justification_pending_supervisor': 1,
//       'justification_pending_departmental_head': 2,
//       'justification_pending_head_of_business': 3,
//       'justification_pending_finance': 4,
//       'justification_rejected_supervisor': 1,
//       'justification_rejected_departmental_head': 2,
//       'justification_rejected_head_of_business': 3,
//       'justification_rejected_finance': 4
//     };
    
//     return levelMap[status] || null;
//   };

//   const getJustificationStatusInfo = (status, level = null) => {
//     const statusLevel = level || extractJustificationLevel(status);
    
//     const levelNames = {
//       1: 'Supervisor',
//       2: 'Departmental Head',
//       3: 'Head of Business',
//       4: 'Finance'
//     };
    
//     if (status === 'completed') {
//       return {
//         text: 'Completed',
//         color: 'cyan',
//         icon: <CheckCircleOutlined />,
//         description: 'All approvals completed'
//       };
//     }
    
//     if (status?.includes('justification_rejected')) {
//       return {
//         text: `Revision Required (${levelNames[statusLevel]})`,
//         color: 'gold',
//         icon: <ExclamationCircleOutlined />,
//         description: `Rejected at Level ${statusLevel} - ${levelNames[statusLevel]}`
//       };
//     }
    
//     if (status?.includes('justification_pending')) {
//       return {
//         text: `Level ${statusLevel}/4: Pending ${levelNames[statusLevel]}`,
//         color: 'orange',
//         icon: <ClockCircleOutlined />,
//         description: `Awaiting approval from ${levelNames[statusLevel]}`
//       };
//     }
    
//     return {
//       text: status?.replace(/_/g, ' ') || 'Unknown',
//       color: 'default',
//       icon: null,
//       description: ''
//     };
//   };

//   const canUserApproveJustification = useCallback((request) => {
//     if (!request.justificationApprovalChain || !user?.email) {
//       return false;
//     }

//     if (!isJustificationStatus(request.status)) {
//       return false;
//     }

//     const currentStatusLevel = extractJustificationLevel(request.status);
    
//     if (!currentStatusLevel) {
//       return false;
//     }

//     const userPendingSteps = request.justificationApprovalChain.filter(step => {
//       const emailMatch = step.approver?.email?.toLowerCase() === user.email.toLowerCase();
//       const isPending = step.status === 'pending';
      
//       return emailMatch && isPending;
//     });

//     if (userPendingSteps.length === 0) {
//       return false;
//     }

//     const canApprove = userPendingSteps.some(step => step.level === currentStatusLevel);

//     return canApprove;
//   }, [user?.email]);

//   // ============ DATA FETCHING ============

//   const fetchAllData = useCallback(async () => {
//     try {
//       setLoading(true);
//       console.log('Fetching all cash requests and justifications...');

//       const response = await cashRequestAPI.getFinanceRequests();

//       if (response && response.success) {
//         const allData = response.data || [];
        
//         console.log('Total records fetched:', allData.length);
        
//         // Improved: More precise separation
//         const cashRequestsOnly = allData.filter(req =>
//           !isJustificationStatus(req.status) &&
//           ['pending_finance', 'approved', 'disbursed', 'partially_disbursed', 'fully_disbursed', 'denied'].includes(req.status)
//         );
//         const justificationsOnly = allData.filter(req => isJustificationStatus(req.status));
        
//         console.log('Cash requests:', cashRequestsOnly.length);
//         console.log('Justifications:', justificationsOnly.length);
        
//         setRequests(cashRequestsOnly);
//         setJustifications(justificationsOnly);

//         const pendingJustifications = justificationsOnly.filter(j => 
//           canUserApproveJustification(j)
//         ).length;

//         console.log('Pending justifications for user:', pendingJustifications);

//         const calculatedStats = {
//           pendingFinance: cashRequestsOnly.filter(req => req.teamRequestMetadata?.userHasPendingApproval).length,
//           approved: cashRequestsOnly.filter(req => req.status === 'approved').length,
//           partiallyDisbursed: cashRequestsOnly.filter(req => 
//             req.status === 'partially_disbursed' || 
//             (req.status === 'disbursed' && (req.remainingBalance || 0) > 0)
//           ).length,
//           fullyDisbursed: cashRequestsOnly.filter(req => 
//             req.status === 'fully_disbursed' || 
//             (req.status === 'disbursed' && (req.remainingBalance || 0) === 0)
//           ).length,
//           completed: allData.filter(req => req.status === 'completed').length,
//           rejected: cashRequestsOnly.filter(req => req.status === 'denied').length,
//           justificationsPending: pendingJustifications
//         };

//         console.log('Calculated stats:', calculatedStats);
//         setStats(calculatedStats);
//       } else {
//         throw new Error('Failed to fetch data');
//       }
//     } catch (error) {
//       console.error('Error fetching data:', error);
//       message.error(error.response?.data?.message || 'Failed to load finance approvals');
//       setRequests([]);
//       setJustifications([]);
//     } finally {
//       setLoading(false);
//     }
//   }, [canUserApproveJustification]);

//   useEffect(() => {
//     if (user?.email) {
//       fetchAllData();
//     }
//   }, [fetchAllData, user?.email]);

//   const handleRefresh = async () => {
//     await fetchAllData();
//     message.success('Data refreshed successfully');
//   };

//   // ============ DISBURSEMENT HANDLERS ============

//   const handleOpenDisbursementModal = (request) => {
//     setSelectedDisbursementRequest(request);
//     setDisbursementModalVisible(true);
//   };

//   const handleDisbursementSubmit = async ({ requestId, amount, notes }) => {
//     try {
//       console.log('Processing disbursement:', { requestId, amount, notes });
      
//       const response = await cashRequestAPI.processDisbursement(requestId, {
//         amount,
//         notes
//       });

//       if (response.success) {
//         message.success(response.message || 'Disbursement processed successfully');
//         setDisbursementModalVisible(false);
//         setSelectedDisbursementRequest(null);
//         await fetchAllData();
//       } else {
//         throw new Error(response.message || 'Failed to process disbursement');
//       }
//     } catch (error) {
//       console.error('Disbursement error:', error);
//       message.error(error.response?.data?.message || 'Failed to process disbursement');
//     }
//   };

//   // ============ JUSTIFICATION HANDLERS ============

//   const handleOpenJustificationModal = (request) => {
//     setSelectedJustificationRequest(request);
//     setJustificationModalVisible(true);
//   };

//   const handleJustificationSubmit = async ({ requestId, decision, comments }) => {
//     try {
//       console.log('Processing justification decision:', { requestId, decision, comments });
      
//       const response = await cashRequestAPI.processJustificationDecision(requestId, {
//         decision,
//         comments
//       });

//       if (response.success) {
//         message.success(response.message || `Justification ${decision} successfully`);
//         setJustificationModalVisible(false);
//         setSelectedJustificationRequest(null);
//         await fetchAllData();
//       } else {
//         throw new Error(response.message || 'Failed to process justification');
//       }
//     } catch (error) {
//       console.error('Justification decision error:', error);
//       message.error(error.response?.data?.message || 'Failed to process justification');
//     }
//   };

//   const handleReviewJustification = (requestId) => {
//     navigate(`/finance/cash-request/${requestId}`);
//   };

//   const getStatusTag = (status) => {
//     if (isJustificationStatus(status)) {
//       const statusInfo = getJustificationStatusInfo(status);
//       return (
//         <Tooltip title={statusInfo.description}>
//           <Tag color={statusInfo.color} icon={statusInfo.icon}>
//             {statusInfo.text}
//           </Tag>
//         </Tooltip>
//       );
//     }

//     const statusMap = {
//       'pending_finance': { 
//         color: 'orange', 
//         icon: <ClockCircleOutlined />, 
//         text: 'Your Approval Required' 
//       },
//       'approved': { 
//         color: 'green', 
//         icon: <CheckCircleOutlined />, 
//         text: 'Approved - Ready for Disbursement' 
//       },
//       'disbursed': {
//         color: 'processing',
//         icon: <SyncOutlined spin />,
//         text: 'Disbursed'
//       },
//       'partially_disbursed': { 
//         color: 'processing', 
//         icon: <SyncOutlined spin />, 
//         text: 'Partially Disbursed' 
//       },
//       'fully_disbursed': { 
//         color: 'cyan', 
//         icon: <DollarOutlined />, 
//         text: 'Fully Disbursed - Awaiting Justification' 
//       },
//       'completed': { 
//         color: 'green', 
//         icon: <CheckCircleOutlined />, 
//         text: 'Completed' 
//       },
//       'denied': { 
//         color: 'red', 
//         icon: <CloseCircleOutlined />, 
//         text: 'Rejected' 
//       }
//     };

//     const statusInfo = statusMap[status] || { 
//       color: 'default', 
//       text: status?.replace('_', ' ') || 'Unknown' 
//     };

//     return (
//       <Tag color={statusInfo.color} icon={statusInfo.icon}>
//         {statusInfo.text}
//       </Tag>
//     );
//   };

//   const getUrgencyTag = (urgency) => {
//     const urgencyMap = {
//       'urgent': { color: 'red', text: 'Urgent' },
//       'high': { color: 'red', text: 'High' },
//       'medium': { color: 'orange', text: 'Medium' },
//       'low': { color: 'green', text: 'Low' }
//     };
//     const urgencyInfo = urgencyMap[urgency] || { color: 'default', text: urgency };

//     return (
//       <Tag color={urgencyInfo.color}>
//         {urgencyInfo.text}
//       </Tag>
//     );
//   };

//   const getFilteredRequests = () => {
//     switch (activeTab) {
//       case 'pending':
//         return requests.filter(req => req.status === 'pending_finance');
//       case 'approved':
//         return requests.filter(req => req.status === 'approved');
//       case 'partially_disbursed':
//         return requests.filter(req =>
//           req.status === 'partially_disbursed' ||
//           (req.status === 'disbursed' && (req.remainingBalance || 0) > 0)
//         );
//       case 'fully_disbursed':
//         return requests.filter(req =>
//           req.status === 'fully_disbursed' ||
//           (req.status === 'disbursed' && (req.remainingBalance || 0) === 0)
//         );
//       case 'completed':
//         return requests.filter(req => req.status === 'completed');
//       case 'rejected':
//         return requests.filter(req => req.status === 'denied');
//       default:
//         return requests;
//     }
//   };

//   const requestColumns = [
//     {
//       title: 'Request ID',
//       dataIndex: 'id',
//       key: 'id',
//       render: (id) => (
//         <Tag color="blue">
//           REQ-{id.toString().slice(-6).toUpperCase()}
//         </Tag>
//       ),
//       width: 120
//     },
//     {
//       title: 'Employee',
//       key: 'employee',
//       render: (_, record) => (
//         <div>
//           <Text strong>{record.employee?.fullName || 'N/A'}</Text>
//           <br />
//           <Text type="secondary" style={{ fontSize: '12px' }}>
//             {record.employee?.position || 'N/A'}
//           </Text>
//           <br />
//           <Tag color="blue" size="small">{record.employee?.department || 'N/A'}</Tag>
//         </div>
//       ),
//       width: 180
//     },
//     {
//       title: 'Request Details',
//       key: 'requestDetails',
//       render: (_, record) => (
//         <div>
//           <Text strong style={{ color: '#1890ff' }}>
//             XAF {Number(record.amountRequested || 0).toLocaleString()}
//           </Text>
//           <br />
//           <Text type="secondary" style={{ fontSize: '12px' }}>
//             Type: {record.requestType?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'N/A'}
//           </Text>
//           <br />
//           <Tooltip title={record.purpose}>
//             <Text ellipsis style={{ maxWidth: 200, fontSize: '11px', color: '#666' }}>
//               {record.purpose && record.purpose.length > 40 
//                 ? `${record.purpose.substring(0, 40)}...` 
//                 : record.purpose || 'No purpose specified'
//               }
//             </Text>
//           </Tooltip>
//         </div>
//       ),
//       width: 200
//     },
//     {
//       title: 'Priority & Dates',
//       key: 'priorityDate',
//       render: (_, record) => (
//         <div>
//           {getUrgencyTag(record.urgency)}
//           <br />
//           <Text type="secondary" style={{ fontSize: '11px' }}>
//             <CalendarOutlined /> Expected: {record.requiredDate ? new Date(record.requiredDate).toLocaleDateString('en-GB') : 'N/A'}
//           </Text>
//           <br />
//           <Text type="secondary" style={{ fontSize: '11px' }}>
//             Submitted: {record.createdAt ? new Date(record.createdAt).toLocaleDateString('en-GB') : 'N/A'}
//           </Text>
//         </div>
//       ),
//       sorter: (a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0),
//       width: 140
//     },
//     {
//       title: 'Disbursement Status',
//       key: 'disbursementStatus',
//       render: (_, record) => {
//         const amountRequested = record.amountRequested || 0;
//         const totalDisbursed = record.totalDisbursed || 0;
//         const remainingBalance = record.remainingBalance || 0;
        
//         // Calculate progress based on amountRequested (not amountApproved)
//         const progress = amountRequested > 0 
//           ? Math.round((totalDisbursed / amountRequested) * 100) 
//           : 0;

//         if (record.status === 'approved') {
//           return (
//             <Tag color="orange" size="small">
//               <ExclamationCircleOutlined /> Ready for Disbursement
//             </Tag>
//           );
//         }

//         if (['partially_disbursed', 'fully_disbursed', 'disbursed'].includes(record.status)) {
//           return (
//             <div>
//               <Progress 
//                 percent={progress} 
//                 size="small" 
//                 status={progress === 100 ? 'success' : 'active'}
//               />
//               <Text style={{ fontSize: '11px' }}>
//                 {totalDisbursed.toLocaleString()} / {amountRequested.toLocaleString()}
//               </Text>
//               <br />
//               <Text type="secondary" style={{ fontSize: '10px' }}>
//                 {record.disbursements?.length || 0} payment(s)
//               </Text>
//             </div>
//           );
//         }

//         return <Text type="secondary" style={{ fontSize: '11px' }}>Not disbursed</Text>;
//       },
//       width: 160
//     },
//     {
//       title: 'Status',
//       dataIndex: 'status',
//       key: 'status',
//       render: (status) => getStatusTag(status),
//       width: 200
//     },
//     {
//       title: 'Actions',
//       key: 'actions',
//       render: (_, record) => (
//         <Space direction="vertical" size="small">
//           <Button 
//             type="link" 
//             icon={<EyeOutlined />}
//             onClick={() => navigate(`/finance/cash-request/${record._id}`)}
//             size="small"
//           >
//             View Details
//           </Button>
//           {record.status === 'pending_finance' && (
//             <Button 
//               type="primary"
//               size="small"
//               icon={<CheckCircleOutlined />}
//               onClick={() => navigate(`/finance/cash-request/${record._id}`)}
//             >
//               Process Approval
//             </Button>
//           )}
//           {(['approved', 'partially_disbursed'].includes(record.status) || 
//             (record.status === 'disbursed' && (record.remainingBalance || 0) > 0)) && (
//             <Button 
//               type="default"
//               size="small"
//               icon={<SendOutlined />}
//               onClick={() => handleOpenDisbursementModal(record)}
//               style={{ color: '#52c41a', borderColor: '#52c41a' }}
//             >
//               Disburse
//             </Button>
//           )}
//         </Space>
//       ),
//       width: 150
//     }
//   ];

//   const justificationColumns = [
//     {
//       title: 'Request ID',
//       dataIndex: 'id',
//       key: 'id',
//       width: 140,
//       render: (id) => <Tag color="blue">REQ-{id.toString().slice(-6).toUpperCase()}</Tag>
//     },
//     {
//       title: 'Employee',
//       key: 'employee',
//       render: (_, record) => (
//         <div>
//           <Text strong>{record.employee?.fullName || 'N/A'}</Text>
//           <br />
//           <Tag color="blue" size="small">
//             {record.employee?.department || 'N/A'}
//           </Tag>
//         </div>
//       ),
//       width: 180
//     },
//     {
//       title: 'Financial Summary',
//       key: 'financial',
//       render: (_, record) => {
//         const disbursed = record.disbursementDetails?.amount || record.totalDisbursed || 0;
//         const spent = record.justification?.amountSpent || 0;
//         const returned = record.justification?.balanceReturned || 0;
//         const isBalanced = Math.abs((spent + returned) - disbursed) < 0.01;

//         return (
//           <div>
//             <Text type="secondary" style={{ fontSize: '11px' }}>
//               Disbursed: XAF {disbursed.toLocaleString()}
//             </Text>
//             <br />
//             <Text type="secondary" style={{ fontSize: '11px' }}>
//               Spent: XAF {spent.toLocaleString()}
//             </Text>
//             <br />
//             <Text type="secondary" style={{ fontSize: '11px' }}>
//               Returned: XAF {returned.toLocaleString()}
//             </Text>
//             <br />
//             {!isBalanced && (
//               <Tag color="warning" size="small">Unbalanced</Tag>
//             )}
//           </div>
//         );
//       },
//       width: 180
//     },
//     {
//       title: 'Submitted Date',
//       key: 'date',
//       render: (_, record) => (
//         <Text type="secondary">
//           {record.justification?.justificationDate 
//             ? new Date(record.justification.justificationDate).toLocaleDateString('en-GB')
//             : 'N/A'
//           }
//         </Text>
//       ),
//       width: 120
//     },
//     {
//       title: 'Approval Progress',
//       key: 'progress',
//       render: (_, record) => {
//         if (!record.justificationApprovalChain) return <Text type="secondary">No chain</Text>;
        
//         const currentLevel = extractJustificationLevel(record.status);
//         const totalLevels = record.justificationApprovalChain.length;
//         const approvedCount = record.justificationApprovalChain.filter(s => s.status === 'approved').length;
        
//         return (
//           <div>
//             <Progress 
//               percent={Math.round((approvedCount / totalLevels) * 100)} 
//               size="small"
//               status={record.status === 'completed' ? 'success' : 'active'}
//               showInfo={false}
//             />
//             <Text style={{ fontSize: '11px' }}>
//               Level {currentLevel || approvedCount + 1}/{totalLevels}
//             </Text>
//           </div>
//         );
//       },
//       width: 120
//     },
//     {
//       title: 'Status',
//       key: 'justificationStatus',
//       render: (_, record) => (
//         <div>
//           {getStatusTag(record.status)}
//           {canUserApproveJustification(record) && (
//             <div style={{ marginTop: 4 }}>
//               <Tag color="gold" size="small">Your Turn</Tag>
//             </div>
//           )}
//         </div>
//       ),
//       width: 200
//     },
//     {
//       title: 'Documents',
//       key: 'documents',
//       render: (_, record) => (
//         <Badge 
//           count={record.justification?.documents?.length || 0} 
//           showZero
//           style={{ backgroundColor: '#52c41a' }}
//         >
//           <FileTextOutlined style={{ fontSize: '16px' }} />
//         </Badge>
//       ),
//       width: 100
//     },
//     {
//       title: 'Action',
//       key: 'action',
//       width: 180,
//       render: (_, record) => (
//         <Space size="small" direction="vertical">
//           <Button
//             size="small"
//             icon={<EyeOutlined />}
//             onClick={() => handleReviewJustification(record._id)}
//             block
//           >
//             View Details
//           </Button>
//           {canUserApproveJustification(record) && (
//             <Button
//               size="small"
//               type="primary"
//               icon={<AuditOutlined />}
//               onClick={() => handleOpenJustificationModal(record)}
//               block
//             >
//               Approve/Reject
//             </Button>
//           )}
//         </Space>
//       )
//     }
//   ];

//   const pendingForMe = requests.filter(req => req.teamRequestMetadata?.userHasPendingApproval).length;
//   const readyForDisbursement = stats.approved + stats.partiallyDisbursed;

//   if (loading && requests.length === 0 && justifications.length === 0) {
//     return (
//       <div style={{ padding: '24px', textAlign: 'center' }}>
//         <Spin size="large" />
//         <div style={{ marginTop: '16px' }}>Loading finance cash approvals...</div>
//       </div>
//     );
//   }

//   return (
//     <div style={{ padding: '24px' }}>
//       {/* Stats Cards */}
//       <Row gutter={16} style={{ marginBottom: '24px' }}>
//         <Col span={4}>
//           <Card size="small">
//             <Statistic
//               title="Your Approvals"
//               value={pendingForMe}
//               prefix={<ClockCircleOutlined />}
//               valueStyle={{ color: '#faad14' }}
//             />
//           </Card>
//         </Col>
//         <Col span={4}>
//           <Card size="small">
//             <Statistic
//               title="Ready to Disburse"
//               value={stats.approved}
//               prefix={<CheckCircleOutlined />}
//               valueStyle={{ color: '#52c41a' }}
//             />
//           </Card>
//         </Col>
//         <Col span={4}>
//           <Card size="small">
//             <Statistic
//               title="Partial Disbursed"
//               value={stats.partiallyDisbursed}
//               prefix={<SyncOutlined />}
//               valueStyle={{ color: '#1890ff' }}
//             />
//           </Card>
//         </Col>
//         <Col span={4}>
//           <Card size="small">
//             <Statistic
//               title="Fully Disbursed"
//               value={stats.fullyDisbursed}
//               prefix={<DollarOutlined />}
//               valueStyle={{ color: '#13c2c2' }}
//             />
//           </Card>
//         </Col>
//         <Col span={4}>
//           <Card size="small">
//             <Statistic
//               title="Justifications"
//               value={stats.justificationsPending}
//               prefix={<FileTextOutlined />}
//               valueStyle={{ color: '#722ed1' }}
//             />
//           </Card>
//         </Col>
//         <Col span={4}>
//           <Card size="small">
//             <Statistic
//               title="Completed"
//               value={stats.completed}
//               prefix={<CheckCircleOutlined />}
//               valueStyle={{ color: '#52c41a' }}
//             />
//           </Card>
//         </Col>
//       </Row>

//       {/* Main Content */}
//       <Card>
//         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
//           <Title level={2} style={{ margin: 0 }}>
//             <BankOutlined /> Finance Cash Approvals
//           </Title>
//           <Space>
//             <Button 
//               icon={<ReloadOutlined />}
//               onClick={handleRefresh}
//               loading={loading}
//             >
//               Refresh
//             </Button>
//             <Button 
//               type="primary"
//               icon={<DownloadOutlined />}
//               onClick={() => setExportModalVisible(true)}
//             >
//               Export Data
//             </Button>
//           </Space>
//         </div>

//         {(pendingForMe > 0 || readyForDisbursement > 0 || stats.justificationsPending > 0) && (
//           <Alert
//             message={
//               <div>
//                 {pendingForMe > 0 && (
//                   <div>🔔 You have {pendingForMe} cash request(s) waiting for your approval</div>
//                 )}
//                 {readyForDisbursement > 0 && (
//                   <div>💰 {readyForDisbursement} request(s) are ready for disbursement</div>
//                 )}
//                 {stats.justificationsPending > 0 && (
//                   <div>📄 {stats.justificationsPending} justification(s) require your review</div>
//                 )}
//               </div>
//             }
//             type="warning"
//             showIcon
//             style={{ marginBottom: '16px' }}
//           />
//         )}

//         <Tabs activeKey={activeTab} onChange={setActiveTab}>
//           <TabPane 
//             tab={
//               <Badge count={stats.pendingFinance} offset={[10, 0]} color="#faad14">
//                 <span>
//                   <ExclamationCircleOutlined />
//                   Pending Approval ({stats.pendingFinance})
//                 </span>
//               </Badge>
//             } 
//             key="pending"
//           >
//             <Table 
//               columns={requestColumns} 
//               dataSource={getFilteredRequests()} 
//               loading={loading}
//               rowKey="_id"
//               pagination={{ 
//                 pageSize: 10,
//                 showSizeChanger: true,
//                 showQuickJumper: true,
//                 showTotal: (total, range) => 
//                   `${range[0]}-${range[1]} of ${total} requests`
//               }}
//               scroll={{ x: 'max-content' }}
//               rowClassName={(record) => {
//                 if (record.status === 'pending_finance') {
//                   return 'highlight-row-urgent'; 
//                 }
//                 return '';
//               }}
//             />
//           </TabPane>

//           <TabPane
//             tab={
//               <Badge count={stats.justificationsPending} offset={[10, 0]} color="#1890ff">
//                 <span>
//                   <FileTextOutlined />
//                   Justifications ({stats.justificationsPending})
//                 </span>
//               </Badge>
//             }
//             key="justifications"
//           >
//             {activeTab === 'justifications' && (
//               <Table
//                 columns={justificationColumns}
//                 dataSource={justifications}
//                 loading={loading}
//                 rowKey="_id"
//                 pagination={{ 
//                   pageSize: 10, 
//                   showSizeChanger: true,
//                   showQuickJumper: true,
//                   showTotal: (total, range) => 
//                     `${range[0]}-${range[1]} of ${total} justifications`
//                 }}
//                 scroll={{ x: 1200 }}
//                 size="small"
//                 rowClassName={(record) => {
//                   let className = 'cash-request-row';
//                   if (canUserApproveJustification(record)) {
//                     className += ' pending-approval-row';
//                   }
//                   return className;
//                 }}
//               />
//             )}
//           </TabPane>

//           <TabPane 
//             tab={
//               <Badge count={stats.approved} offset={[10, 0]} color="#52c41a">
//                 <span>
//                   <CheckCircleOutlined />
//                   Ready to Disburse ({stats.approved})
//                 </span>
//               </Badge>
//             } 
//             key="approved"
//           >
//             <Table 
//               columns={requestColumns} 
//               dataSource={getFilteredRequests()} 
//               loading={loading}
//               rowKey="_id"
//               pagination={{ 
//                 pageSize: 10,
//                 showSizeChanger: true,
//                 showQuickJumper: true,
//                 showTotal: (total, range) => 
//                   `${range[0]}-${range[1]} of ${total} requests`
//               }}
//               scroll={{ x: 'max-content' }}
//               rowClassName={() => 'highlight-row-ready'}
//             />
//           </TabPane>

//           <TabPane 
//             tab={
//               <Badge count={stats.partiallyDisbursed} offset={[10, 0]} color="#1890ff">
//                 <span>
//                   <SyncOutlined />
//                   Partially Disbursed ({stats.partiallyDisbursed})
//                 </span>
//               </Badge>
//             } 
//             key="partially_disbursed"
//           >
//             <Table 
//               columns={requestColumns} 
//               dataSource={getFilteredRequests()} 
//               loading={loading}
//               rowKey="_id"
//               pagination={{ 
//                 pageSize: 10,
//                 showSizeChanger: true,
//                 showQuickJumper: true,
//                 showTotal: (total, range) => 
//                   `${range[0]}-${range[1]} of ${total} requests`
//               }}
//               scroll={{ x: 'max-content' }}
//               rowClassName={() => 'highlight-row-partial'}
//             />
//           </TabPane>

//           <TabPane 
//             tab={
//               <Badge count={stats.fullyDisbursed} offset={[10, 0]} color="#13c2c2">
//                 <span>
//                   <DollarOutlined />
//                   Fully Disbursed ({stats.fullyDisbursed})
//                 </span>
//               </Badge>
//             } 
//             key="fully_disbursed"
//           >
//             <Table 
//               columns={requestColumns} 
//               dataSource={getFilteredRequests()} 
//               loading={loading}
//               rowKey="_id"
//               pagination={{ 
//                 pageSize: 10,
//                 showSizeChanger: true,
//                 showQuickJumper: true,
//                 showTotal: (total, range) => 
//                   `${range[0]}-${range[1]} of ${total} requests`
//               }}
//               scroll={{ x: 'max-content' }}
//             />
//           </TabPane>

//           <TabPane 
//             tab={
//               <span>
//                 <CheckCircleOutlined />
//                 Completed ({stats.completed})
//               </span>
//             } 
//             key="completed"
//           >
//             <Table 
//               columns={requestColumns} 
//               dataSource={getFilteredRequests()} 
//               loading={loading}
//               rowKey="_id"
//               pagination={{ 
//                 pageSize: 10,
//                 showSizeChanger: true,
//                 showQuickJumper: true,
//                 showTotal: (total, range) => 
//                   `${range[0]}-${range[1]} of ${total} requests`
//               }}
//               scroll={{ x: 'max-content' }}
//             />
//           </TabPane>

//           <TabPane 
//             tab={
//               <span>
//                 <CloseCircleOutlined />
//                 Rejected ({stats.rejected})
//               </span>
//             } 
//             key="rejected"
//           >
//             <Table 
//               columns={requestColumns} 
//               dataSource={getFilteredRequests()} 
//               loading={loading}
//               rowKey="_id"
//               pagination={{ 
//                 pageSize: 10,
//                 showSizeChanger: true,
//                 showQuickJumper: true,
//                 showTotal: (total, range) => 
//                   `${range[0]}-${range[1]} of ${total} requests`
//               }}
//               scroll={{ x: 'max-content' }}
//             />
//           </TabPane>
//         </Tabs>
//       </Card>

//       {/* Modals */}
//       <DisbursementModal
//         visible={disbursementModalVisible}
//         request={selectedDisbursementRequest}
//         onSubmit={handleDisbursementSubmit}
//         onCancel={() => {
//           setDisbursementModalVisible(false);
//           setSelectedDisbursementRequest(null);
//         }}
//       />

//       <JustificationApprovalModal
//         visible={justificationModalVisible}
//         request={selectedJustificationRequest}
//         onSubmit={handleJustificationSubmit}
//         onCancel={() => {
//           setJustificationModalVisible(false);
//           setSelectedJustificationRequest(null);
//         }}
//       />

//       <CashRequestExportModal
//         visible={exportModalVisible}
//         onCancel={() => setExportModalVisible(false)}
//       />

//       <style>{`
//         .highlight-row-urgent {
//           background-color: #fff7e6 !important;
//           border-left: 4px solid #faad14 !important;
//         }
//         .highlight-row-urgent:hover {
//           background-color: #fff1d6 !important;
//         }
//         .highlight-row-ready {
//           background-color: #f6ffed !important;
//           border-left: 4px solid #52c41a !important;
//         }
//         .highlight-row-ready:hover {
//           background-color: #d9f7be !important;
//         }
//         .highlight-row-partial {
//           background-color: #e6f7ff !important;
//           border-left: 4px solid #1890ff !important;
//         }
//         .highlight-row-partial:hover {
//           background-color: #bae7ff !important;
//         }
//         .cash-request-row {
//           background-color: #fafafa;
//         }
//         .cash-request-row:hover {
//           background-color: #f0f0f0 !important;
//         }
//         .pending-approval-row {
//           border-left: 3px solid #faad14;
//           background-color: #fff7e6;
//         }
//         .pending-approval-row:hover {
//           background-color: #fff1d6 !important;
//         }
//       `}</style>
//     </div>
//   );
// };

// export default FinanceCashApprovals;














// import React, { useState, useEffect, useCallback } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { useSelector } from 'react-redux';
// import {
//   Card,
//   Table,
//   Tag,
//   Space,
//   Typography,
//   Button,
//   Alert,
//   Spin,
//   message,
//   Badge,
//   Tooltip,
//   Tabs,
//   Progress,
//   Statistic,
//   Row,
//   Col
// } from 'antd';
// import {
//   CheckCircleOutlined,
//   CloseCircleOutlined,
//   ClockCircleOutlined,
//   DollarOutlined,
//   CalendarOutlined,
//   BankOutlined,
//   EyeOutlined,
//   ReloadOutlined,
//   ExclamationCircleOutlined,
//   SendOutlined,
//   FileTextOutlined,
//   AuditOutlined,
//   DownloadOutlined,
//   SyncOutlined
// } from '@ant-design/icons';
// import { cashRequestAPI } from '../../services/cashRequestAPI';
// import CashRequestExportModal from './CashRequestExport';

// const { Title, Text } = Typography;
// const { TabPane } = Tabs;

// const FinanceCashApprovals = () => {
//   const navigate = useNavigate();
//   const { user } = useSelector((state) => state.auth);
  
//   const [requests, setRequests] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [activeTab, setActiveTab] = useState('pending');
//   const [exportModalVisible, setExportModalVisible] = useState(false);
//   const [stats, setStats] = useState({
//     pendingFinance: 0,
//     approved: 0,
//     partiallyDisbursed: 0,
//     fullyDisbursed: 0,
//     completed: 0,
//     rejected: 0,
//     justificationsPending: 0
//   });
//   const [justifications, setJustifications] = useState([]);

//   // ============ HELPER FUNCTIONS ============

//   // Check if status is a justification status
//   const isJustificationStatus = (status) => {
//     return status && (
//       status.includes('justification_pending') || 
//       status.includes('justification_rejected') ||
//       status === 'completed'
//     );
//   };

//   // Extract level number from justification status
//   const extractJustificationLevel = (status) => {
//     if (!status || !status.includes('justification_')) return null;
    
//     const levelMap = {
//       'justification_pending_supervisor': 1,
//       'justification_pending_departmental_head': 2,
//       'justification_pending_head_of_business': 3,
//       'justification_pending_finance': 4,
//       'justification_rejected_supervisor': 1,
//       'justification_rejected_departmental_head': 2,
//       'justification_rejected_head_of_business': 3,
//       'justification_rejected_finance': 4
//     };
    
//     return levelMap[status] || null;
//   };

//   // Get human-readable justification status
//   const getJustificationStatusInfo = (status, level = null) => {
//     const statusLevel = level || extractJustificationLevel(status);
    
//     const levelNames = {
//       1: 'Supervisor',
//       2: 'Departmental Head',
//       3: 'Head of Business',
//       4: 'Finance'
//     };
    
//     if (status === 'completed') {
//       return {
//         text: 'Completed',
//         color: 'cyan',
//         icon: <CheckCircleOutlined />,
//         description: 'All approvals completed'
//       };
//     }
    
//     if (status?.includes('justification_rejected')) {
//       return {
//         text: `Revision Required (${levelNames[statusLevel]})`,
//         color: 'gold',
//         icon: <ExclamationCircleOutlined />,
//         description: `Rejected at Level ${statusLevel} - ${levelNames[statusLevel]}`
//       };
//     }
    
//     if (status?.includes('justification_pending')) {
//       return {
//         text: `Level ${statusLevel}/4: Pending ${levelNames[statusLevel]}`,
//         color: 'orange',
//         icon: <ClockCircleOutlined />,
//         description: `Awaiting approval from ${levelNames[statusLevel]}`
//       };
//     }
    
//     return {
//       text: status?.replace(/_/g, ' ') || 'Unknown',
//       color: 'default',
//       icon: null,
//       description: ''
//     };
//   };

//   // Check if user can approve justification
//   const canUserApproveJustification = useCallback((request) => {
//     if (!request.justificationApprovalChain || !user?.email) {
//       return false;
//     }

//     if (!isJustificationStatus(request.status)) {
//       return false;
//     }

//     const currentStatusLevel = extractJustificationLevel(request.status);
    
//     if (!currentStatusLevel) {
//       return false;
//     }

//     const userPendingSteps = request.justificationApprovalChain.filter(step => {
//       const emailMatch = step.approver?.email?.toLowerCase() === user.email.toLowerCase();
//       const isPending = step.status === 'pending';
      
//       return emailMatch && isPending;
//     });

//     if (userPendingSteps.length === 0) {
//       return false;
//     }

//     const canApprove = userPendingSteps.some(step => step.level === currentStatusLevel);

//     return canApprove;
//   }, [user?.email]);

//   // ============ DATA FETCHING ============

//   const fetchAllData = useCallback(async () => {
//     try {
//       setLoading(true);
//       console.log('Fetching all cash requests and justifications...');

//       const response = await cashRequestAPI.getSupervisorRequests();

//       if (response && response.success) {
//         const allData = response.data || [];
        
//         console.log('Total records fetched:', allData.length);
        
//         // Separate cash requests from justifications
//         const cashRequestsOnly = allData.filter(req => !isJustificationStatus(req.status));
//         const justificationsOnly = allData.filter(req => isJustificationStatus(req.status));
        
//         console.log('Cash requests:', cashRequestsOnly.length);
//         console.log('Justifications:', justificationsOnly.length);
        
//         setRequests(cashRequestsOnly);
//         setJustifications(justificationsOnly);

//         // Calculate stats
//         const pendingJustifications = justificationsOnly.filter(j => 
//           canUserApproveJustification(j)
//         ).length;

//         console.log('Pending justifications for user:', pendingJustifications);

//         const calculatedStats = {
//           pendingFinance: cashRequestsOnly.filter(req => req.teamRequestMetadata?.userHasPendingApproval).length,
//           approved: cashRequestsOnly.filter(req => req.status === 'approved').length,
//           partiallyDisbursed: cashRequestsOnly.filter(req => req.status === 'partially_disbursed').length,
//           fullyDisbursed: cashRequestsOnly.filter(req => req.status === 'fully_disbursed').length,
//           completed: allData.filter(req => req.status === 'completed').length,
//           rejected: cashRequestsOnly.filter(req => req.status === 'denied').length,
//           justificationsPending: pendingJustifications
//         };

//         console.log('Calculated stats:', calculatedStats);
//         setStats(calculatedStats);
//       } else {
//         throw new Error('Failed to fetch data');
//       }
//     } catch (error) {
//       console.error('Error fetching data:', error);
//       message.error(error.response?.data?.message || 'Failed to load finance approvals');
//       setRequests([]);
//       setJustifications([]);
//     } finally {
//       setLoading(false);
//     }
//   }, [canUserApproveJustification]);

//   useEffect(() => {
//     if (user?.email) {
//       fetchAllData();
//     }
//   }, [fetchAllData, user?.email]);

//   const handleRefresh = async () => {
//     await fetchAllData();
//     message.success('Data refreshed successfully');
//   };

//   const handleDisburse = async (requestId) => {
//     try {
//       console.log('Navigating to disburse:', requestId);
//       navigate(`/finance/cash-request/${requestId}`);
//     } catch (error) {
//       console.error('Error navigating:', error);
//       message.error('Failed to open request');
//     }
//   };

//   const handleReviewJustification = (requestId) => {
//     navigate(`/finance/cash-request/${requestId}`);
//   };

//   const getStatusTag = (status) => {
//     // Handle justification statuses specially
//     if (isJustificationStatus(status)) {
//       const statusInfo = getJustificationStatusInfo(status);
//       return (
//         <Tooltip title={statusInfo.description}>
//           <Tag color={statusInfo.color} icon={statusInfo.icon}>
//             {statusInfo.text}
//           </Tag>
//         </Tooltip>
//       );
//     }

//     const statusMap = {
//       'pending_finance': { 
//         color: 'orange', 
//         icon: <ClockCircleOutlined />, 
//         text: 'Your Approval Required' 
//       },
//       'approved': { 
//         color: 'green', 
//         icon: <CheckCircleOutlined />, 
//         text: 'Approved - Ready for Disbursement' 
//       },
//       'partially_disbursed': { 
//         color: 'processing', 
//         icon: <SyncOutlined spin />, 
//         text: 'Partially Disbursed' 
//       },
//       'fully_disbursed': { 
//         color: 'cyan', 
//         icon: <DollarOutlined />, 
//         text: 'Fully Disbursed - Awaiting Justification' 
//       },
//       'completed': { 
//         color: 'green', 
//         icon: <CheckCircleOutlined />, 
//         text: 'Completed' 
//       },
//       'denied': { 
//         color: 'red', 
//         icon: <CloseCircleOutlined />, 
//         text: 'Rejected' 
//       }
//     };

//     const statusInfo = statusMap[status] || { 
//       color: 'default', 
//       text: status?.replace('_', ' ') || 'Unknown' 
//     };

//     return (
//       <Tag color={statusInfo.color} icon={statusInfo.icon}>
//         {statusInfo.text}
//       </Tag>
//     );
//   };

//   const getUrgencyTag = (urgency) => {
//     const urgencyMap = {
//       'urgent': { color: 'red', text: 'Urgent' },
//       'high': { color: 'red', text: 'High' },
//       'medium': { color: 'orange', text: 'Medium' },
//       'low': { color: 'green', text: 'Low' }
//     };

//     const urgencyInfo = urgencyMap[urgency] || { color: 'default', text: urgency };

//     return (
//       <Tag color={urgencyInfo.color}>
//         {urgencyInfo.text}
//       </Tag>
//     );
//   };

//   const getFilteredRequests = () => {
//     switch (activeTab) {
//       case 'pending':
//         return requests.filter(req => {
//           if (req.teamRequestMetadata && typeof req.teamRequestMetadata.userHasPendingApproval !== 'undefined') {
//             return req.teamRequestMetadata.userHasPendingApproval;
//           }
//           return req.status === 'pending_finance';
//         });
//       case 'approved':
//         return requests.filter(req => req.status === 'approved');
//       case 'partially_disbursed':
//         return requests.filter(req => req.status === 'partially_disbursed');
//       case 'fully_disbursed':
//         return requests.filter(req => req.status === 'fully_disbursed');
//       case 'completed':
//         return requests.filter(req => req.status === 'completed');
//       case 'rejected':
//         return requests.filter(req => req.status === 'denied');
//       default:
//         return requests;
//     }
//   };

//   const requestColumns = [
//     {
//       title: 'Request ID',
//       dataIndex: '_id',
//       key: '_id',
//       render: (id) => (
//         <Tag color="blue">
//           REQ-{id.toString().slice(-6).toUpperCase()}
//         </Tag>
//       ),
//       width: 120
//     },
//     {
//       title: 'Employee',
//       key: 'employee',
//       render: (_, record) => (
//         <div>
//           <Text strong>{record.employee?.fullName || 'N/A'}</Text>
//           <br />
//           <Text type="secondary" style={{ fontSize: '12px' }}>
//             {record.employee?.position || 'N/A'}
//           </Text>
//           <br />
//           <Tag color="blue" size="small">{record.employee?.department || 'N/A'}</Tag>
//         </div>
//       ),
//       width: 180
//     },
//     {
//       title: 'Request Details',
//       key: 'requestDetails',
//       render: (_, record) => (
//         <div>
//           <Text strong style={{ color: '#1890ff' }}>
//             XAF {Number(record.amountRequested || 0).toLocaleString()}
//           </Text>
//           <br />
//           <Text type="secondary" style={{ fontSize: '12px' }}>
//             Type: {record.requestType?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'N/A'}
//           </Text>
//           <br />
//           <Tooltip title={record.purpose}>
//             <Text ellipsis style={{ maxWidth: 200, fontSize: '11px', color: '#666' }}>
//               {record.purpose && record.purpose.length > 40 ? 
//                 `${record.purpose.substring(0, 40)}...` : 
//                 record.purpose || 'No purpose specified'
//               }
//             </Text>
//           </Tooltip>
//         </div>
//       ),
//       width: 200
//     },
//     {
//       title: 'Priority & Dates',
//       key: 'priorityDate',
//       render: (_, record) => (
//         <div>
//           {getUrgencyTag(record.urgency)}
//           <br />
//           <Text type="secondary" style={{ fontSize: '11px' }}>
//             <CalendarOutlined /> Expected: {record.requiredDate ? new Date(record.requiredDate).toLocaleDateString('en-GB') : 'N/A'}
//           </Text>
//           <br />
//           <Text type="secondary" style={{ fontSize: '11px' }}>
//             Submitted: {record.createdAt ? new Date(record.createdAt).toLocaleDateString('en-GB') : 'N/A'}
//           </Text>
//         </div>
//       ),
//       sorter: (a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0),
//       width: 140
//     },
//     {
//       title: 'Disbursement Status',
//       key: 'disbursementStatus',
//       render: (_, record) => {
//         const amountApproved = record.amountApproved || record.amountRequested || 0;
//         const totalDisbursed = record.totalDisbursed || 0;
//         const remainingBalance = record.remainingBalance || 0;
//         const progress = record.disbursementProgress || 0;

//         if (record.status === 'approved') {
//           return (
//             <Tag color="orange" size="small">
//               <ExclamationCircleOutlined /> Ready for Disbursement
//             </Tag>
//           );
//         }

//         if (['partially_disbursed', 'fully_disbursed'].includes(record.status)) {
//           return (
//             <div>
//               <Progress 
//                 percent={progress} 
//                 size="small" 
//                 status={progress === 100 ? 'success' : 'active'}
//               />
//               <Text style={{ fontSize: '11px' }}>
//                 {totalDisbursed.toLocaleString()} / {amountApproved.toLocaleString()}
//               </Text>
//               <br />
//               <Text type="secondary" style={{ fontSize: '10px' }}>
//                 {record.disbursements?.length || 0} payment(s)
//               </Text>
//             </div>
//           );
//         }

//         return <Text type="secondary" style={{ fontSize: '11px' }}>Not disbursed</Text>;
//       },
//       width: 160
//     },
//     {
//       title: 'Status',
//       dataIndex: 'status',
//       key: 'status',
//       render: (status) => getStatusTag(status),
//       width: 200
//     },
//     {
//       title: 'Actions',
//       key: 'actions',
//       render: (_, record) => (
//         <Space direction="vertical" size="small">
//           <Button 
//             type="link" 
//             icon={<EyeOutlined />}
//             onClick={() => navigate(`/finance/cash-request/${record._id}`)}
//             size="small"
//           >
//             View Details
//           </Button>
//           {record.status === 'pending_finance' && (
//             <Button 
//               type="primary"
//               size="small"
//               icon={<CheckCircleOutlined />}
//               onClick={() => navigate(`/finance/cash-request/${record._id}`)}
//             >
//               Process Approval
//             </Button>
//           )}
//           {['approved', 'partially_disbursed'].includes(record.status) && (
//             <Button 
//               type="default"
//               size="small"
//               icon={<SendOutlined />}
//               onClick={() => handleDisburse(record._id)}
//               style={{ color: '#52c41a', borderColor: '#52c41a' }}
//             >
//               Disburse
//             </Button>
//           )}
//         </Space>
//       ),
//       width: 150
//     }
//   ];

//   const justificationColumns = [
//     {
//       title: 'Request ID',
//       dataIndex: '_id',
//       key: '_id',
//       width: 140,
//       render: (id) => <Tag color="blue">REQ-{id.toString().slice(-6).toUpperCase()}</Tag>
//     },
//     {
//       title: 'Employee',
//       key: 'employee',
//       render: (_, record) => (
//         <div>
//           <Text strong>{record.employee?.fullName || 'N/A'}</Text>
//           <br />
//           <Tag color="blue" size="small">
//             {record.employee?.department || 'N/A'}
//           </Tag>
//         </div>
//       ),
//       width: 180
//     },
//     {
//       title: 'Financial Summary',
//       key: 'financial',
//       render: (_, record) => {
//         const disbursed = record.disbursementDetails?.amount || record.totalDisbursed || 0;
//         const spent = record.justification?.amountSpent || 0;
//         const returned = record.justification?.balanceReturned || 0;
//         const isBalanced = Math.abs((spent + returned) - disbursed) < 0.01;

//         return (
//           <div>
//             <Text type="secondary" style={{ fontSize: '11px' }}>
//               Disbursed: XAF {disbursed.toLocaleString()}
//             </Text>
//             <br />
//             <Text type="secondary" style={{ fontSize: '11px' }}>
//               Spent: XAF {spent.toLocaleString()}
//             </Text>
//             <br />
//             <Text type="secondary" style={{ fontSize: '11px' }}>
//               Returned: XAF {returned.toLocaleString()}
//             </Text>
//             <br />
//             {!isBalanced && (
//               <Tag color="warning" size="small">Unbalanced</Tag>
//             )}
//           </div>
//         );
//       },
//       width: 180
//     },
//     {
//       title: 'Submitted Date',
//       key: 'date',
//       render: (_, record) => (
//         <Text type="secondary">
//           {record.justification?.justificationDate 
//             ? new Date(record.justification.justificationDate).toLocaleDateString('en-GB')
//             : 'N/A'
//           }
//         </Text>
//       ),
//       width: 120
//     },
//     {
//       title: 'Approval Progress',
//       key: 'progress',
//       render: (_, record) => {
//         if (!record.justificationApprovalChain) return <Text type="secondary">No chain</Text>;
        
//         const currentLevel = extractJustificationLevel(record.status);
//         const totalLevels = record.justificationApprovalChain.length;
//         const approvedCount = record.justificationApprovalChain.filter(s => s.status === 'approved').length;
        
//         return (
//           <div>
//             <Progress 
//               percent={Math.round((approvedCount / totalLevels) * 100)} 
//               size="small"
//               status={record.status === 'completed' ? 'success' : 'active'}
//               showInfo={false}
//             />
//             <Text style={{ fontSize: '11px' }}>
//               Level {currentLevel || approvedCount + 1}/{totalLevels}
//             </Text>
//           </div>
//         );
//       },
//       width: 120
//     },
//     {
//       title: 'Status',
//       key: 'justificationStatus',
//       render: (_, record) => (
//         <div>
//           {getStatusTag(record.status)}
//           {canUserApproveJustification(record) && (
//             <div style={{ marginTop: 4 }}>
//               <Tag color="gold" size="small">Your Turn</Tag>
//             </div>
//           )}
//         </div>
//       ),
//       width: 200
//     },
//     {
//       title: 'Documents',
//       key: 'documents',
//       render: (_, record) => (
//         <Badge 
//           count={record.justification?.documents?.length || 0} 
//           showZero
//           style={{ backgroundColor: '#52c41a' }}
//         >
//           <FileTextOutlined style={{ fontSize: '16px' }} />
//         </Badge>
//       ),
//       width: 100
//     },
//     {
//       title: 'Action',
//       key: 'action',
//       width: 140,
//       render: (_, record) => (
//         <Space size="small">
//           <Button
//             size="small"
//             icon={<EyeOutlined />}
//             onClick={() => handleReviewJustification(record._id)}
//           >
//             View
//           </Button>
//           {canUserApproveJustification(record) && (
//             <Button
//               size="small"
//               type="primary"
//               icon={<AuditOutlined />}
//               onClick={() => handleReviewJustification(record._id)}
//             >
//               Review
//             </Button>
//           )}
//         </Space>
//       )
//     }
//   ];

//   const pendingForMe = requests.filter(req => req.teamRequestMetadata?.userHasPendingApproval).length;
//   const readyForDisbursement = stats.approved + stats.partiallyDisbursed;

//   if (loading && requests.length === 0 && justifications.length === 0) {
//     return (
//       <div style={{ padding: '24px', textAlign: 'center' }}>
//         <Spin size="large" />
//         <div style={{ marginTop: '16px' }}>Loading finance cash approvals...</div>
//       </div>
//     );
//   }

//   return (
//     <div style={{ padding: '24px' }}>
//       {/* Stats Cards */}
//       <Row gutter={16} style={{ marginBottom: '24px' }}>
//         <Col span={4}>
//           <Card size="small">
//             <Statistic
//               title="Your Approvals"
//               value={pendingForMe}
//               prefix={<ClockCircleOutlined />}
//               valueStyle={{ color: '#faad14' }}
//             />
//           </Card>
//         </Col>
//         <Col span={4}>
//           <Card size="small">
//             <Statistic
//               title="Ready to Disburse"
//               value={stats.approved}
//               prefix={<CheckCircleOutlined />}
//               valueStyle={{ color: '#52c41a' }}
//             />
//           </Card>
//         </Col>
//         <Col span={4}>
//           <Card size="small">
//             <Statistic
//               title="Partial Disbursed"
//               value={stats.partiallyDisbursed}
//               prefix={<SyncOutlined />}
//               valueStyle={{ color: '#1890ff' }}
//             />
//           </Card>
//         </Col>
//         <Col span={4}>
//           <Card size="small">
//             <Statistic
//               title="Fully Disbursed"
//               value={stats.fullyDisbursed}
//               prefix={<DollarOutlined />}
//               valueStyle={{ color: '#13c2c2' }}
//             />
//           </Card>
//         </Col>
//         <Col span={4}>
//           <Card size="small">
//             <Statistic
//               title="Justifications"
//               value={stats.justificationsPending}
//               prefix={<FileTextOutlined />}
//               valueStyle={{ color: '#722ed1' }}
//             />
//           </Card>
//         </Col>
//         <Col span={4}>
//           <Card size="small">
//             <Statistic
//               title="Completed"
//               value={stats.completed}
//               prefix={<CheckCircleOutlined />}
//               valueStyle={{ color: '#52c41a' }}
//             />
//           </Card>
//         </Col>
//       </Row>

//       {/* Main Content */}
//       <Card>
//         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
//           <Title level={2} style={{ margin: 0 }}>
//             <BankOutlined /> Finance Cash Approvals
//           </Title>
//           <Space>
//             <Button 
//               icon={<ReloadOutlined />}
//               onClick={handleRefresh}
//               loading={loading}
//             >
//               Refresh
//             </Button>
//             <Button 
//               type="primary"
//               icon={<DownloadOutlined />}
//               onClick={() => setExportModalVisible(true)}
//             >
//               Export Data
//             </Button>
//           </Space>
//         </div>

//         {(pendingForMe > 0 || readyForDisbursement > 0 || stats.justificationsPending > 0) && (
//           <Alert
//             message={
//               <div>
//                 {pendingForMe > 0 && (
//                   <div>🔔 You have {pendingForMe} cash request(s) waiting for your approval</div>
//                 )}
//                 {readyForDisbursement > 0 && (
//                   <div>💰 {readyForDisbursement} request(s) are ready for disbursement</div>
//                 )}
//                 {stats.justificationsPending > 0 && (
//                   <div>📄 {stats.justificationsPending} justification(s) require your review</div>
//                 )}
//               </div>
//             }
//             type="warning"
//             showIcon
//             style={{ marginBottom: '16px' }}
//           />
//         )}

//         <Tabs activeKey={activeTab} onChange={setActiveTab}>
//           <TabPane 
//             tab={
//               <Badge count={stats.pendingFinance} offset={[10, 0]} color="#faad14">
//                 <span>
//                   <ExclamationCircleOutlined />
//                   Pending Approval ({stats.pendingFinance})
//                 </span>
//               </Badge>
//             } 
//             key="pending"
//           >
//             <Table 
//               columns={requestColumns} 
//               dataSource={getFilteredRequests()} 
//               loading={loading}
//               rowKey="_id"
//               pagination={{ 
//                 pageSize: 10,
//                 showSizeChanger: true,
//                 showQuickJumper: true,
//                 showTotal: (total, range) => 
//                   `${range[0]}-${range[1]} of ${total} requests`
//               }}
//               scroll={{ x: 'max-content' }}
//               rowClassName={(record) => {
//                 if (record.status === 'pending_finance') {
//                   return 'highlight-row-urgent'; 
//                 }
//                 return '';
//               }}
//             />
//           </TabPane>

//           <TabPane
//             tab={
//               <Badge count={stats.justificationsPending} offset={[10, 0]} color="#1890ff">
//                 <span>
//                   <FileTextOutlined />
//                   Justifications ({stats.justificationsPending})
//                 </span>
//               </Badge>
//             }
//             key="justifications"
//           >
//             {activeTab === 'justifications' && (
//               <Table
//                 columns={justificationColumns}
//                 dataSource={justifications}
//                 loading={loading}
//                 rowKey="_id"
//                 pagination={{ 
//                   pageSize: 10, 
//                   showSizeChanger: true,
//                   showQuickJumper: true,
//                   showTotal: (total, range) => 
//                     `${range[0]}-${range[1]} of ${total} justifications`
//                 }}
//                 scroll={{ x: 1200 }}
//                 size="small"
//                 rowClassName={(record) => {
//                   let className = 'cash-request-row';
//                   if (canUserApproveJustification(record)) {
//                     className += ' pending-approval-row';
//                   }
//                   return className;
//                 }}
//               />
//             )}
//           </TabPane>

//           <TabPane 
//             tab={
//               <Badge count={stats.approved} offset={[10, 0]} color="#52c41a">
//                 <span>
//                   <CheckCircleOutlined />
//                   Ready to Disburse ({stats.approved})
//                 </span>
//               </Badge>
//             } 
//             key="approved"
//           >
//             <Table 
//               columns={requestColumns} 
//               dataSource={getFilteredRequests()} 
//               loading={loading}
//               rowKey="_id"
//               pagination={{ 
//                 pageSize: 10,
//                 showSizeChanger: true,
//                 showQuickJumper: true,
//                 showTotal: (total, range) => 
//                   `${range[0]}-${range[1]} of ${total} requests`
//               }}
//               scroll={{ x: 'max-content' }}
//               rowClassName={() => 'highlight-row-ready'}
//             />
//           </TabPane>

//           <TabPane 
//             tab={
//               <Badge count={stats.partiallyDisbursed} offset={[10, 0]} color="#1890ff">
//                 <span>
//                   <SyncOutlined />
//                   Partially Disbursed ({stats.partiallyDisbursed})
//                 </span>
//               </Badge>
//             } 
//             key="partially_disbursed"
//           >
//             <Table 
//               columns={requestColumns} 
//               dataSource={getFilteredRequests()} 
//               loading={loading}
//               rowKey="_id"
//               pagination={{ 
//                 pageSize: 10,
//                 showSizeChanger: true,
//                 showQuickJumper: true,
//                 showTotal: (total, range) => 
//                   `${range[0]}-${range[1]} of ${total} requests`
//               }}
//               scroll={{ x: 'max-content' }}
//               rowClassName={() => 'highlight-row-partial'}
//             />
//           </TabPane>

//           <TabPane 
//             tab={
//               <Badge count={stats.fullyDisbursed} offset={[10, 0]} color="#13c2c2">
//                 <span>
//                   <DollarOutlined />
//                   Fully Disbursed ({stats.fullyDisbursed})
//                 </span>
//               </Badge>
//             } 
//             key="fully_disbursed"
//           >
//             <Table 
//               columns={requestColumns} 
//               dataSource={getFilteredRequests()} 
//               loading={loading}
//               rowKey="_id"
//               pagination={{ 
//                 pageSize: 10,
//                 showSizeChanger: true,
//                 showQuickJumper: true,
//                 showTotal: (total, range) => 
//                   `${range[0]}-${range[1]} of ${total} requests`
//               }}
//               scroll={{ x: 'max-content' }}
//             />
//           </TabPane>

//           <TabPane 
//             tab={
//               <span>
//                 <CheckCircleOutlined />
//                 Completed ({stats.completed})
//               </span>
//             } 
//             key="completed"
//           >
//             <Table 
//               columns={requestColumns} 
//               dataSource={getFilteredRequests()} 
//               loading={loading}
//               rowKey="_id"
//               pagination={{ 
//                 pageSize: 10,
//                 showSizeChanger: true,
//                 showQuickJumper: true,
//                 showTotal: (total, range) => 
//                   `${range[0]}-${range[1]} of ${total} requests`
//               }}
//               scroll={{ x: 'max-content' }}
//             />
//           </TabPane>

//           <TabPane 
//             tab={
//               <span>
//                 <CloseCircleOutlined />
//                 Rejected ({stats.rejected})
//               </span>
//             } 
//             key="rejected"
//           >
//             <Table 
//               columns={requestColumns} 
//               dataSource={getFilteredRequests()} 
//               loading={loading}
//               rowKey="_id"
//               pagination={{ 
//                 pageSize: 10,
//                 showSizeChanger: true,
//                 showQuickJumper: true,
//                 showTotal: (total, range) => 
//                   `${range[0]}-${range[1]} of ${total} requests`
//               }}
//               scroll={{ x: 'max-content' }}
//             />
//           </TabPane>
//         </Tabs>
//       </Card>

//       {/* Export Modal */}
//       <CashRequestExportModal
//         visible={exportModalVisible}
//         onCancel={() => setExportModalVisible(false)}
//       />

//       <style>{`
//         .highlight-row-urgent {
//           background-color: #fff7e6 !important;
//           border-left: 4px solid #faad14 !important;
//         }
//         .highlight-row-urgent:hover {
//           background-color: #fff1d6 !important;
//         }
//         .highlight-row-ready {
//           background-color: #f6ffed !important;
//           border-left: 4px solid #52c41a !important;
//         }
//         .highlight-row-ready:hover {
//           background-color: #d9f7be !important;
//         }
//         .highlight-row-partial {
//           background-color: #e6f7ff !important;
//           border-left: 4px solid #1890ff !important;
//         }
//         .highlight-row-partial:hover {
//           background-color: #bae7ff !important;
//         }
//         .cash-request-row {
//           background-color: #fafafa;
//         }
//         .cash-request-row:hover {
//           background-color: #f0f0f0 !important;
//         }
//         .pending-approval-row {
//           border-left: 3px solid #faad14;
//           background-color: #fff7e6;
//         }
//         .pending-approval-row:hover {
//           background-color: #fff1d6 !important;
//         }
//       `}</style>
//     </div>
//   );
// };

// export default FinanceCashApprovals;








// import React, { useState, useEffect, useCallback } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { useSelector } from 'react-redux';
// import {
//   Card,
//   Table,
//   Tag,
//   Space,
//   Typography,
//   Button,
//   Alert,
//   Spin,
//   message,
//   Badge,
//   Tooltip,
//   Tabs,
//   Progress,
//   Statistic,
//   Row,
//   Col
// } from 'antd';
// import {
//   CheckCircleOutlined,
//   CloseCircleOutlined,
//   ClockCircleOutlined,
//   DollarOutlined,
//   CalendarOutlined,
//   BankOutlined,
//   EyeOutlined,
//   ReloadOutlined,
//   ExclamationCircleOutlined,
//   SendOutlined,
//   FileTextOutlined,
//   AuditOutlined
// } from '@ant-design/icons';
// import { cashRequestAPI } from '../../services/cashRequestAPI';

// const { Title, Text } = Typography;
// const { TabPane } = Tabs;

// const FinanceCashApprovals = () => {
//   const navigate = useNavigate();
//   const { user } = useSelector((state) => state.auth);
  
//   const [requests, setRequests] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [activeTab, setActiveTab] = useState('pending');
//   const [stats, setStats] = useState({
//     pendingFinance: 0,
//     approved: 0,
//     disbursed: 0,
//     completed: 0,
//     rejected: 0,
//     justificationsPending: 0
//   });
//   const [justifications, setJustifications] = useState([]);

//   // ============ HELPER FUNCTIONS ============

//   // Check if status is a justification status
//   const isJustificationStatus = (status) => {
//     return status && (
//       status.includes('justification_pending') || 
//       status.includes('justification_rejected') ||
//       status === 'completed'
//     );
//   };

//   // Extract level number from justification status
//   const extractJustificationLevel = (status) => {
//     if (!status || !status.includes('justification_')) return null;
    
//     const levelMap = {
//       'justification_pending_supervisor': 1,
//       'justification_pending_departmental_head': 2,
//       'justification_pending_head_of_business': 3,
//       'justification_pending_finance': 4,
//       'justification_rejected_supervisor': 1,
//       'justification_rejected_departmental_head': 2,
//       'justification_rejected_head_of_business': 3,
//       'justification_rejected_finance': 4
//     };
    
//     return levelMap[status] || null;
//   };

//   // Get human-readable justification status
//   const getJustificationStatusInfo = (status, level = null) => {
//     const statusLevel = level || extractJustificationLevel(status);
    
//     const levelNames = {
//       1: 'Supervisor',
//       2: 'Departmental Head',
//       3: 'Head of Business',
//       4: 'Finance'
//     };
    
//     if (status === 'completed') {
//       return {
//         text: 'Completed',
//         color: 'cyan',
//         icon: <CheckCircleOutlined />,
//         description: 'All approvals completed'
//       };
//     }
    
//     if (status?.includes('justification_rejected')) {
//       return {
//         text: `Revision Required (${levelNames[statusLevel]})`,
//         color: 'gold',
//         icon: <ExclamationCircleOutlined />,
//         description: `Rejected at Level ${statusLevel} - ${levelNames[statusLevel]}`
//       };
//     }
    
//     if (status?.includes('justification_pending')) {
//       return {
//         text: `Level ${statusLevel}/4: Pending ${levelNames[statusLevel]}`,
//         color: 'orange',
//         icon: <ClockCircleOutlined />,
//         description: `Awaiting approval from ${levelNames[statusLevel]}`
//       };
//     }
    
//     return {
//       text: status?.replace(/_/g, ' ') || 'Unknown',
//       color: 'default',
//       icon: null,
//       description: ''
//     };
//   };

//   // Check if user can approve justification
//   const canUserApproveJustification = useCallback((request) => {
//     if (!request.justificationApprovalChain || !user?.email) {
//       return false;
//     }

//     // CRITICAL: Only check if status is actually a justification status
//     if (!isJustificationStatus(request.status)) {
//       return false;
//     }

//     // Get current status level from the status string
//     const currentStatusLevel = extractJustificationLevel(request.status);
    
//     if (!currentStatusLevel) {
//       return false;
//     }

//     // Find ALL pending steps for this user at ANY level (to support multi-role users)
//     const userPendingSteps = request.justificationApprovalChain.filter(step => {
//       const emailMatch = step.approver?.email?.toLowerCase() === user.email.toLowerCase();
//       const isPending = step.status === 'pending';
      
//       return emailMatch && isPending;
//     });

//     if (userPendingSteps.length === 0) {
//       return false;
//     }

//     // Check if ANY of the user's pending steps match the current status level
//     const canApprove = userPendingSteps.some(step => step.level === currentStatusLevel);

//     return canApprove;
//   }, [user?.email]);

//   // ============ DATA FETCHING ============

//   const fetchAllData = useCallback(async () => {
//     try {
//       setLoading(true);
//       console.log('Fetching all cash requests and justifications using supervisor endpoint...');

//       // Use the supervisor endpoint which has the most complete and current data
//       const response = await cashRequestAPI.getSupervisorRequests();

//       if (response && response.success) {
//         const allData = response.data || [];
        
//         console.log('Total records fetched:', allData.length);
        
//         // Separate cash requests from justifications
//         const cashRequestsOnly = allData.filter(req => !isJustificationStatus(req.status));
//         const justificationsOnly = allData.filter(req => isJustificationStatus(req.status));
        
//         console.log('Cash requests:', cashRequestsOnly.length);
//         console.log('Justifications:', justificationsOnly.length);
        
//         setRequests(cashRequestsOnly);
//         setJustifications(justificationsOnly);

//         // Calculate stats
//         const pendingJustifications = justificationsOnly.filter(j => 
//           canUserApproveJustification(j)
//         ).length;

//         console.log('Pending justifications for user:', pendingJustifications);

//         const calculatedStats = {
//           pendingFinance: cashRequestsOnly.filter(req => req.teamRequestMetadata?.userHasPendingApproval).length,
//           approved: cashRequestsOnly.filter(req => req.teamRequestMetadata?.userHasApproved).length,
//           disbursed: cashRequestsOnly.filter(req => req.status === 'disbursed').length,
//           completed: allData.filter(req => req.status === 'completed').length,
//           rejected: cashRequestsOnly.filter(req => req.status === 'denied').length,
//           justificationsPending: pendingJustifications
//         };

//         console.log('Calculated stats:', calculatedStats);
//         setStats(calculatedStats);
//       } else {
//         throw new Error('Failed to fetch data');
//       }
//     } catch (error) {
//       console.error('Error fetching data:', error);
//       message.error(error.response?.data?.message || 'Failed to load finance approvals');
//       setRequests([]);
//       setJustifications([]);
//     } finally {
//       setLoading(false);
//     }
//   }, [canUserApproveJustification]);

//   useEffect(() => {
//     if (user?.email) {
//       fetchAllData();
//     }
//   }, [fetchAllData, user?.email]);

//   const handleRefresh = async () => {
//     await fetchAllData();
//     message.success('Data refreshed successfully');
//   };

//   const handleDisburse = async (requestId) => {
//     try {
//       console.log('Disbursing cash request:', requestId);
//       navigate(`/finance/cash-request/${requestId}`);
//     } catch (error) {
//       console.error('Error disbursing request:', error);
//       message.error('Failed to disburse cash request');
//     }
//   };

//   const handleReviewJustification = (requestId) => {
//     navigate(`/finance/cash-request/${requestId}`);
//   };

//   // Secure file download handler
//   const handleDownloadAttachment = async (requestId, attachment) => {
//     try {
//       if (!attachment.fileName && !attachment.name) {
//         message.error('No filename available for this attachment');
//         return;
//       }

//       const fileName = attachment.fileName || attachment.name;
//       const blob = await cashRequestAPI.downloadAttachment(requestId, fileName);
      
//       const url = window.URL.createObjectURL(blob);
//       const link = document.createElement('a');
//       link.href = url;
//       link.download = fileName;
      
//       document.body.appendChild(link);
//       link.click();
//       document.body.removeChild(link);
//       window.URL.revokeObjectURL(url);
      
//       message.success(`Downloaded ${fileName}`);
//     } catch (error) {
//       console.error('Error downloading attachment:', error);
//       message.error('Failed to download attachment');
//     }
//   };

//   const getStatusTag = (status) => {
//     // Handle justification statuses specially
//     if (isJustificationStatus(status)) {
//       const statusInfo = getJustificationStatusInfo(status);
//       return (
//         <Tooltip title={statusInfo.description}>
//           <Tag color={statusInfo.color} icon={statusInfo.icon}>
//             {statusInfo.text}
//           </Tag>
//         </Tooltip>
//       );
//     }

//     const statusMap = {
//       'pending_finance': { 
//         color: 'orange', 
//         icon: <ClockCircleOutlined />, 
//         text: 'Your Approval Required' 
//       },
//       'approved': { 
//         color: 'green', 
//         icon: <CheckCircleOutlined />, 
//         text: 'Approved - Ready for Disbursement' 
//       },
//       'disbursed': { 
//         color: 'cyan', 
//         icon: <DollarOutlined />, 
//         text: 'Disbursed - Awaiting Justification' 
//       },
//       'completed': { 
//         color: 'green', 
//         icon: <CheckCircleOutlined />, 
//         text: 'Completed' 
//       },
//       'denied': { 
//         color: 'red', 
//         icon: <CloseCircleOutlined />, 
//         text: 'Rejected' 
//       }
//     };

//     const statusInfo = statusMap[status] || { 
//       color: 'default', 
//       text: status?.replace('_', ' ') || 'Unknown' 
//     };

//     return (
//       <Tag color={statusInfo.color} icon={statusInfo.icon}>
//         {statusInfo.text}
//       </Tag>
//     );
//   };

//   const getUrgencyTag = (urgency) => {
//     const urgencyMap = {
//       'high': { color: 'red', text: 'High' },
//       'medium': { color: 'orange', text: 'Medium' },
//       'low': { color: 'green', text: 'Low' }
//     };

//     const urgencyInfo = urgencyMap[urgency] || { color: 'default', text: urgency };

//     return (
//       <Tag color={urgencyInfo.color}>
//         {urgencyInfo.text}
//       </Tag>
//     );
//   };

//   const getFilteredRequests = () => {
//     switch (activeTab) {
//       case 'pending':
//         return requests.filter(req => {
//           if (req.teamRequestMetadata && typeof req.teamRequestMetadata.userHasPendingApproval !== 'undefined') {
//             return req.teamRequestMetadata.userHasPendingApproval;
//           }
//           return req.status === 'pending_finance';
//         });
//       case 'approved':
//         return requests.filter(req => {
//           if (req.teamRequestMetadata && typeof req.teamRequestMetadata.userHasApproved !== 'undefined') {
//             return req.teamRequestMetadata.userHasApproved || req.status === 'approved';
//           }
//           return req.status === 'approved';
//         });
//       case 'disbursed':
//         return requests.filter(req => req.status === 'disbursed');
//       case 'completed':
//         return requests.filter(req => req.status === 'completed');
//       case 'rejected':
//         return requests.filter(req => req.status === 'denied');
//       default:
//         return requests;
//     }
//   };

//   const requestColumns = [
//     {
//       title: 'Employee',
//       key: 'employee',
//       render: (_, record) => (
//         <div>
//           <Text strong>{record.employee?.fullName || 'N/A'}</Text>
//           <br />
//           <Text type="secondary" style={{ fontSize: '12px' }}>
//             {record.employee?.position || 'N/A'}
//           </Text>
//           <br />
//           <Tag color="blue" size="small">{record.employee?.department || 'N/A'}</Tag>
//         </div>
//       ),
//       width: 180
//     },
//     {
//       title: 'Request Details',
//       key: 'requestDetails',
//       render: (_, record) => (
//         <div>
//           <Text strong style={{ color: '#1890ff' }}>
//             XAF {Number(record.amountRequested || 0).toLocaleString()}
//           </Text>
//           <br />
//           <Text type="secondary" style={{ fontSize: '12px' }}>
//             Type: {record.requestType?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'N/A'}
//           </Text>
//           <br />
//           <Tooltip title={record.purpose}>
//             <Text ellipsis style={{ maxWidth: 200, fontSize: '11px', color: '#666' }}>
//               {record.purpose && record.purpose.length > 40 ? 
//                 `${record.purpose.substring(0, 40)}...` : 
//                 record.purpose || 'No purpose specified'
//               }
//             </Text>
//           </Tooltip>
//         </div>
//       ),
//       width: 200
//     },
//     {
//       title: 'Priority & Dates',
//       key: 'priorityDate',
//       render: (_, record) => (
//         <div>
//           {getUrgencyTag(record.urgency)}
//           <br />
//           <Text type="secondary" style={{ fontSize: '11px' }}>
//             <CalendarOutlined /> Expected: {record.requiredDate ? new Date(record.requiredDate).toLocaleDateString('en-GB') : 'N/A'}
//           </Text>
//           <br />
//           <Text type="secondary" style={{ fontSize: '11px' }}>
//             Submitted: {record.createdAt ? new Date(record.createdAt).toLocaleDateString('en-GB') : 'N/A'}
//           </Text>
//         </div>
//       ),
//       sorter: (a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0),
//       width: 140
//     },
//     {
//       title: 'Supervisor Approval',
//       key: 'supervisorApproval',
//       render: (_, record) => {
//         const supervisorApproval = record.approvalChain?.find(step => step.level === 1 && step.status === 'approved');
        
//         return (
//           <div>
//             {supervisorApproval ? (
//               <>
//                 <Tag color="green" size="small">
//                   <CheckCircleOutlined /> Approved
//                 </Tag>
//                 <br />
//                 <Text type="secondary" style={{ fontSize: '11px' }}>
//                   By: {supervisorApproval.approver?.name || 'Supervisor'}
//                 </Text>
//                 <br />
//                 <Text type="secondary" style={{ fontSize: '11px' }}>
//                   {supervisorApproval.actionDate ? new Date(supervisorApproval.actionDate).toLocaleDateString('en-GB') : 'N/A'}
//                 </Text>
//                 {supervisorApproval.comments && (
//                   <Tooltip title={supervisorApproval.comments}>
//                     <br />
//                     <Text style={{ fontSize: '10px', color: '#666' }}>
//                       💬 View comments
//                     </Text>
//                   </Tooltip>
//                 )}
//               </>
//             ) : (
//               <Tag color="orange" size="small">
//                 <ClockCircleOutlined /> Pending
//               </Tag>
//             )}
//           </div>
//         );
//       },
//       width: 140
//     },
//     {
//       title: 'Status',
//       dataIndex: 'status',
//       key: 'status',
//       render: (status) => getStatusTag(status),
//       width: 180
//     },
//     {
//       title: 'Disbursement Info',
//       key: 'disbursement',
//       render: (_, record) => (
//         <div>
//           {record.disbursementDetails ? (
//             <>
//               <Tag color="cyan" size="small">
//                 <DollarOutlined /> Disbursed
//               </Tag>
//               <br />
//               <Text type="secondary" style={{ fontSize: '11px' }}>
//                 Amount: XAF {Number(record.disbursementDetails.amount || 0).toLocaleString()}
//               </Text>
//               <br />
//               <Text type="secondary" style={{ fontSize: '11px' }}>
//                 Date: {record.disbursementDetails.date ? new Date(record.disbursementDetails.date).toLocaleDateString('en-GB') : 'N/A'}
//               </Text>
//             </>
//           ) : record.status === 'approved' ? (
//             <Tag color="orange" size="small">
//               <ExclamationCircleOutlined /> Ready for Disbursement
//             </Tag>
//           ) : (
//             <Text type="secondary" style={{ fontSize: '11px' }}>
//               Not disbursed
//             </Text>
//           )}
//         </div>
//       ),
//       width: 160
//     },
//     {
//       title: 'Attachments',
//       key: 'attachments',
//       render: (_, record) => (
//         <div>
//           {record.attachments && record.attachments.length > 0 ? (
//             <Space direction="vertical" size="small">
//               {record.attachments.slice(0, 2).map((attachment, index) => (
//                 <Button 
//                   key={index}
//                   size="small" 
//                   type="link"
//                   onClick={() => handleDownloadAttachment(record._id, attachment)}
//                   style={{ padding: 0, fontSize: '11px' }}
//                 >
//                   📎 {(attachment.fileName || attachment.name).length > 15 ? 
//                     `${(attachment.fileName || attachment.name).substring(0, 15)}...` : 
//                     (attachment.fileName || attachment.name)
//                   }
//                 </Button>
//               ))}
//               {record.attachments.length > 2 && (
//                 <Text type="secondary" style={{ fontSize: '10px' }}>
//                   +{record.attachments.length - 2} more
//                 </Text>
//               )}
//             </Space>
//           ) : (
//             <Text type="secondary" style={{ fontSize: '11px' }}>No attachments</Text>
//           )}
//         </div>
//       ),
//       width: 120
//     },
//     {
//       title: 'Actions',
//       key: 'actions',
//       render: (_, record) => (
//         <Space direction="vertical" size="small">
//           <Button 
//             type="link" 
//             icon={<EyeOutlined />}
//             onClick={() => navigate(`/finance/cash-request/${record._id}`)}
//             size="small"
//           >
//             View Details
//           </Button>
//           {record.status === 'pending_finance' && (
//             <Button 
//               type="primary"
//               size="small"
//               icon={<CheckCircleOutlined />}
//               onClick={() => navigate(`/finance/cash-request/${record._id}`)}
//             >
//               Process Approval
//             </Button>
//           )}
//           {record.status === 'approved' && (
//             <Button 
//               type="default"
//               size="small"
//               icon={<SendOutlined />}
//               onClick={() => handleDisburse(record._id)}
//               style={{ color: '#52c41a', borderColor: '#52c41a' }}
//             >
//               Disburse
//             </Button>
//           )}
//         </Space>
//       ),
//       width: 130
//     }
//   ];

//   const justificationColumns = [
//     {
//       title: 'Request ID',
//       dataIndex: '_id',
//       key: '_id',
//       width: 140,
//       render: (id) => <Tag color="blue">REQ-{id.toString().slice(-6).toUpperCase()}</Tag>
//     },
//     {
//       title: 'Employee',
//       key: 'employee',
//       render: (_, record) => (
//         <div>
//           <Text strong>{record.employee?.fullName || 'N/A'}</Text>
//           <br />
//           <Tag color="blue" size="small">
//             {record.employee?.department || 'N/A'}
//           </Tag>
//         </div>
//       ),
//       width: 180
//     },
//     {
//       title: 'Financial Summary',
//       key: 'financial',
//       render: (_, record) => {
//         const disbursed = record.disbursementDetails?.amount || 0;
//         const spent = record.justification?.amountSpent || 0;
//         const returned = record.justification?.balanceReturned || 0;
//         const isBalanced = Math.abs((spent + returned) - disbursed) < 0.01;

//         return (
//           <div>
//             <Text type="secondary" style={{ fontSize: '11px' }}>
//               Disbursed: XAF {disbursed.toLocaleString()}
//             </Text>
//             <br />
//             <Text type="secondary" style={{ fontSize: '11px' }}>
//               Spent: XAF {spent.toLocaleString()}
//             </Text>
//             <br />
//             <Text type="secondary" style={{ fontSize: '11px' }}>
//               Returned: XAF {returned.toLocaleString()}
//             </Text>
//             <br />
//             {!isBalanced && (
//               <Tag color="warning" size="small">Unbalanced</Tag>
//             )}
//           </div>
//         );
//       },
//       width: 180
//     },
//     {
//       title: 'Submitted Date',
//       key: 'date',
//       render: (_, record) => (
//         <Text type="secondary">
//           {record.justification?.justificationDate 
//             ? new Date(record.justification.justificationDate).toLocaleDateString('en-GB')
//             : 'N/A'
//           }
//         </Text>
//       ),
//       width: 120
//     },
//     {
//       title: 'Approval Progress',
//       key: 'progress',
//       render: (_, record) => {
//         if (!record.justificationApprovalChain) return <Text type="secondary">No chain</Text>;
        
//         const currentLevel = extractJustificationLevel(record.status);
//         const totalLevels = record.justificationApprovalChain.length;
//         const approvedCount = record.justificationApprovalChain.filter(s => s.status === 'approved').length;
        
//         return (
//           <div>
//             <Progress 
//               percent={Math.round((approvedCount / totalLevels) * 100)} 
//               size="small"
//               status={record.status === 'completed' ? 'success' : 'active'}
//               showInfo={false}
//             />
//             <Text style={{ fontSize: '11px' }}>
//               Level {currentLevel || approvedCount + 1}/{totalLevels}
//             </Text>
//           </div>
//         );
//       },
//       width: 120
//     },
//     {
//       title: 'Status',
//       key: 'justificationStatus',
//       render: (_, record) => (
//         <div>
//           {getStatusTag(record.status)}
//           {canUserApproveJustification(record) && (
//             <div style={{ marginTop: 4 }}>
//               <Tag color="gold" size="small">Your Turn</Tag>
//             </div>
//           )}
//         </div>
//       ),
//       width: 200
//     },
//     {
//       title: 'Documents',
//       key: 'documents',
//       render: (_, record) => (
//         <Badge 
//           count={record.justification?.documents?.length || 0} 
//           showZero
//           style={{ backgroundColor: '#52c41a' }}
//         >
//           <FileTextOutlined style={{ fontSize: '16px' }} />
//         </Badge>
//       ),
//       width: 100
//     },
//     {
//       title: 'Action',
//       key: 'action',
//       width: 140,
//       render: (_, record) => (
//         <Space size="small">
//           <Button
//             size="small"
//             icon={<EyeOutlined />}
//             onClick={() => handleReviewJustification(record._id)}
//           >
//             View
//           </Button>
//           {canUserApproveJustification(record) && (
//             <Button
//               size="small"
//               type="primary"
//               icon={<AuditOutlined />}
//               onClick={() => handleReviewJustification(record._id)}
//             >
//               Review
//             </Button>
//           )}
//         </Space>
//       )
//     }
//   ];

//   const pendingForMe = requests.filter(req => req.teamRequestMetadata?.userHasPendingApproval).length;
//   const readyForDisbursement = requests.filter(req => req.status === 'approved').length;

//   if (loading && requests.length === 0 && justifications.length === 0) {
//     return (
//       <div style={{ padding: '24px', textAlign: 'center' }}>
//         <Spin size="large" />
//         <div style={{ marginTop: '16px' }}>Loading finance cash approvals...</div>
//       </div>
//     );
//   }

//   return (
//     <div style={{ padding: '24px' }}>
//       {/* Stats Cards */}
//       <Row gutter={16} style={{ marginBottom: '24px' }}>
//         <Col span={5}>
//           <Card size="small">
//             <Statistic
//               title="Your Approvals"
//               value={pendingForMe}
//               prefix={<ClockCircleOutlined />}
//               valueStyle={{ color: '#faad14' }}
//             />
//           </Card>
//         </Col>
//         <Col span={5}>
//           <Card size="small">
//             <Statistic
//               title="Ready to Disburse"
//               value={readyForDisbursement}
//               prefix={<CheckCircleOutlined />}
//               valueStyle={{ color: '#52c41a' }}
//             />
//           </Card>
//         </Col>
//         <Col span={4}>
//           <Card size="small">
//             <Statistic
//               title="Disbursed"
//               value={stats.disbursed || 0}
//               prefix={<DollarOutlined />}
//               valueStyle={{ color: '#1890ff' }}
//             />
//           </Card>
//         </Col>
//         <Col span={5}>
//           <Card size="small">
//             <Statistic
//               title="Pending Justifications"
//               value={stats.justificationsPending}
//               prefix={<FileTextOutlined />}
//               valueStyle={{ color: '#722ed1' }}
//             />
//           </Card>
//         </Col>
//         <Col span={5}>
//           <Card size="small">
//             <Statistic
//               title="Completed"
//               value={stats.completed || 0}
//               prefix={<CheckCircleOutlined />}
//               valueStyle={{ color: '#52c41a' }}
//             />
//           </Card>
//         </Col>
//       </Row>

//       {/* Main Content */}
//       <Card>
//         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
//           <Title level={2} style={{ margin: 0 }}>
//             <BankOutlined /> Finance Cash Approvals
//           </Title>
//           <Space>
//             <Button 
//               icon={<ReloadOutlined />}
//               onClick={handleRefresh}
//               loading={loading}
//             >
//               Refresh
//             </Button>
//           </Space>
//         </div>

//         {(pendingForMe > 0 || readyForDisbursement > 0 || stats.justificationsPending > 0) && (
//           <Alert
//             message={
//               <div>
//                 {pendingForMe > 0 && (
//                   <div>🔔 You have {pendingForMe} cash request(s) waiting for your approval</div>
//                 )}
//                 {readyForDisbursement > 0 && (
//                   <div>💰 {readyForDisbursement} request(s) are ready for disbursement</div>
//                 )}
//                 {stats.justificationsPending > 0 && (
//                   <div>📄 {stats.justificationsPending} justification(s) require your review</div>
//                 )}
//               </div>
//             }
//             type="warning"
//             showIcon
//             style={{ marginBottom: '16px' }}
//           />
//         )}

//         <Tabs activeKey={activeTab} onChange={setActiveTab}>
//           <TabPane 
//             tab={
//               <Badge count={stats.pendingFinance} offset={[10, 0]} color="#faad14">
//                 <span>
//                   <ExclamationCircleOutlined />
//                   Pending Approval ({stats.pendingFinance})
//                 </span>
//               </Badge>
//             } 
//             key="pending"
//           >
//             <Table 
//               columns={requestColumns} 
//               dataSource={getFilteredRequests()} 
//               loading={loading}
//               rowKey="_id"
//               pagination={{ 
//                 pageSize: 10,
//                 showSizeChanger: true,
//                 showQuickJumper: true,
//                 showTotal: (total, range) => 
//                   `${range[0]}-${range[1]} of ${total} requests`
//               }}
//               scroll={{ x: 'max-content' }}
//               rowClassName={(record) => {
//                 if (record.status === 'pending_finance') {
//                   return 'highlight-row-urgent'; 
//                 }
//                 return '';
//               }}
//             />
//           </TabPane>

//           <TabPane
//             tab={
//               <Badge count={stats.justificationsPending} offset={[10, 0]} color="#1890ff">
//                 <span>
//                   <FileTextOutlined />
//                   Justifications ({stats.justificationsPending})
//                 </span>
//               </Badge>
//             }
//             key="justifications"
//           >
//             {activeTab === 'justifications' && (
//               <Table
//                 columns={justificationColumns}
//                 dataSource={justifications}
//                 loading={loading}
//                 rowKey="_id"
//                 pagination={{ 
//                   pageSize: 10, 
//                   showSizeChanger: true,
//                   showQuickJumper: true,
//                   showTotal: (total, range) => 
//                     `${range[0]}-${range[1]} of ${total} justifications`
//                 }}
//                 scroll={{ x: 1200 }}
//                 size="small"
//                 rowClassName={(record) => {
//                   let className = 'cash-request-row';
//                   if (canUserApproveJustification(record)) {
//                     className += ' pending-approval-row';
//                   }
//                   return className;
//                 }}
//               />
//             )}
//           </TabPane>

//           <TabPane 
//             tab={
//               <Badge count={stats.approved} offset={[10, 0]} color="#52c41a">
//                 <span>
//                   <DollarOutlined />
//                   Ready to Disburse ({stats.approved})
//                 </span>
//               </Badge>
//             } 
//             key="approved"
//           >
//             <Table 
//               columns={requestColumns} 
//               dataSource={getFilteredRequests()} 
//               loading={loading}
//               rowKey="_id"
//               pagination={{ 
//                 pageSize: 10,
//                 showSizeChanger: true,
//                 showQuickJumper: true,
//                 showTotal: (total, range) => 
//                   `${range[0]}-${range[1]} of ${total} requests`
//               }}
//               scroll={{ x: 'max-content' }}
//               rowClassName={() => 'highlight-row-ready'}
//             />
//           </TabPane>

//           <TabPane 
//             tab={
//               <span>
//                 <SendOutlined />
//                 Disbursed ({stats.disbursed})
//               </span>
//             } 
//             key="disbursed"
//           >
//             <Table 
//               columns={requestColumns} 
//               dataSource={getFilteredRequests()} 
//               loading={loading}
//               rowKey="_id"
//               pagination={{ 
//                 pageSize: 10,
//                 showSizeChanger: true,
//                 showQuickJumper: true,
//                 showTotal: (total, range) => 
//                   `${range[0]}-${range[1]} of ${total} requests`
//               }}
//               scroll={{ x: 'max-content' }}
//             />
//           </TabPane>

//           <TabPane 
//             tab={
//               <span>
//                 <CheckCircleOutlined />
//                 Completed ({stats.completed})
//               </span>
//             } 
//             key="completed"
//           >
//             <Table 
//               columns={requestColumns} 
//               dataSource={getFilteredRequests()} 
//               loading={loading}
//               rowKey="_id"
//               pagination={{ 
//                 pageSize: 10,
//                 showSizeChanger: true,
//                 showQuickJumper: true,
//                 showTotal: (total, range) => 
//                   `${range[0]}-${range[1]} of ${total} requests`
//               }}
//               scroll={{ x: 'max-content' }}
//             />
//           </TabPane>

//           <TabPane 
//             tab={
//               <span>
//                 <CloseCircleOutlined />
//                 Rejected ({stats.rejected})
//               </span>
//             } 
//             key="rejected"
//           >
//             <Table 
//               columns={requestColumns} 
//               dataSource={getFilteredRequests()} 
//               loading={loading}
//               rowKey="_id"
//               pagination={{ 
//                 pageSize: 10,
//                 showSizeChanger: true,
//                 showQuickJumper: true,
//                 showTotal: (total, range) => 
//                   `${range[0]}-${range[1]} of ${total} requests`
//               }}
//               scroll={{ x: 'max-content' }}
//             />
//           </TabPane>
//         </Tabs>
//       </Card>

//       <style>{`
//         .highlight-row-urgent {
//           background-color: #fff7e6 !important;
//           border-left: 4px solid #faad14 !important;
//         }
//         .highlight-row-urgent:hover {
//           background-color: #fff1d6 !important;
//         }
//         .highlight-row-ready {
//           background-color: #f6ffed !important;
//           border-left: 4px solid #52c41a !important;
//         }
//         .highlight-row-ready:hover {
//           background-color: #d9f7be !important;
//         }
//         .cash-request-row {
//           background-color: #fafafa;
//         }
//         .cash-request-row:hover {
//           background-color: #f0f0f0 !important;
//         }
//         .pending-approval-row {
//           border-left: 3px solid #faad14;
//           background-color: #fff7e6;
//         }
//         .pending-approval-row:hover {
//           background-color: #fff1d6 !important;
//         }
//       `}</style>
//     </div>
//   );
// };

// export default FinanceCashApprovals;






