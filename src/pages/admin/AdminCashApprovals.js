import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Typography,
  Tag,
  Space,
  Tabs,
  Alert,
  Descriptions,
  Timeline,
  Progress,
  message,
  Radio,
  Row,
  Col,
  Statistic,
  Spin,
  notification,
  Tooltip
} from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  CalendarOutlined,
  SettingOutlined,
  AuditOutlined,
  EyeOutlined,
  ReloadOutlined,
  ExclamationCircleOutlined,
  FileOutlined,
  HistoryOutlined,
  CrownOutlined
} from '@ant-design/icons';
import { cashRequestAPI } from '../../services/cashRequestAPI';

// PDFViewer component
const PDFViewer = ({ url, name, authHeaders }) => {
  const [pdfUrl, setPdfUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadPDF = async () => {
      try {
        setLoading(true);
        const response = await fetch(url, { headers: authHeaders });
        if (!response.ok) throw new Error('Failed to load PDF');
        
        const blob = await response.blob();
        const pdfBlob = new Blob([blob], { type: 'application/pdf' });
        const blobUrl = window.URL.createObjectURL(pdfBlob);
        setPdfUrl(blobUrl);
      } catch (err) {
        console.error('PDF loading error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (url && authHeaders) loadPDF();
    return () => { if (pdfUrl) window.URL.revokeObjectURL(pdfUrl); };
  }, [url, authHeaders]);

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '70vh', border: '1px solid #d9d9d9', borderRadius: '6px' }}>
      <Spin size="large" />
      <span style={{ marginLeft: '16px' }}>Loading PDF...</span>
    </div>
  );

  if (error) return (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '70vh', border: '1px solid #d9d9d9', borderRadius: '6px', backgroundColor: '#f5f5f5' }}>
      <Alert message="PDF Loading Failed" description={`Unable to load PDF: ${error}`} type="error" showIcon />
    </div>
  );

  return <iframe src={pdfUrl} style={{ width: '100%', height: '70vh', border: '1px solid #d9d9d9', borderRadius: '6px' }} title={name} />;
};

const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { TextArea } = Input;

const AdminCashApprovals = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useSelector((state) => state.auth);
  
  const autoApprovalId = searchParams.get('approve');
  const autoRejectId = searchParams.get('reject');
  
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [approvalModalVisible, setApprovalModalVisible] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [activeTab, setActiveTab] = useState('pending');
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    total: 0
  });
  
  const [fileViewerVisible, setFileViewerVisible] = useState(false);
  const [viewingFile, setViewingFile] = useState(null);
  const [fileViewerLoading, setFileViewerLoading] = useState(false);
  
  const [form] = Form.useForm();

  // Fetch cash requests for admin approval - using dedicated admin endpoint
  const fetchCashRequests = useCallback(async () => {
    try {
      setLoading(true);
      console.log('Fetching admin cash approvals for:', user?.email);
      
      // Use the dedicated admin-approvals endpoint
      const response = await cashRequestAPI.getAllRequests();
      console.log('Admin cash requests response:', response);
      
      if (response.success) {
        const requestsData = response.data || [];
        setRequests(requestsData);

        // Calculate stats based on admin's approval requirements
        const pending = requestsData.filter(req => canUserApprove(req)).length;
        const approved = requestsData.filter(req => 
          ['approved', 'pending_finance', 'disbursed', 'completed'].includes(req.status) &&
          hasUserApproved(req)
        ).length;
        const rejected = requestsData.filter(req => 
          req.status === 'denied' && hasUserRejected(req)
        ).length;

        setStats({
          pending,
          approved,
          rejected,
          total: requestsData.length
        });

        console.log('Admin stats calculated:', { pending, approved, rejected, total: requestsData.length });
      } else {
        throw new Error(response.message || 'Failed to fetch cash requests');
      }
    } catch (error) {
      console.error('Error fetching admin cash requests:', error);
      message.error(error.response?.data?.message || 'Failed to fetch cash requests');
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, [user?.email]);

  useEffect(() => {
    if (user?.email && user?.role === 'admin') {
      fetchCashRequests();
    }
  }, [fetchCashRequests, user?.email, user?.role]);

  // Handle auto-approval from email links
  useEffect(() => {
    const handleAutoAction = async () => {
      if (autoApprovalId || autoRejectId) {
        const requestId = autoApprovalId || autoRejectId;
        try {
          const response = await cashRequestAPI.getRequestById(requestId);
          if (response.success) {
            setSelectedRequest(response.data);
            setApprovalModalVisible(true);
            form.setFieldsValue({ 
              decision: autoApprovalId ? 'approved' : 'rejected' 
            });
          }
        } catch (error) {
          message.error('Failed to load cash request for approval');
        }
      }
    };
    handleAutoAction();
  }, [autoApprovalId, autoRejectId, form]);

  // Check if admin can approve this request
  const canUserApprove = (request) => {
    if (!request.approvalChain || !user?.email) return false;
    
    // Find if current user has a pending approval step
    const currentStep = request.approvalChain.find(step => 
      step.approver?.email === user.email &&
      step.status === 'pending'
    );
    
    if (!currentStep) return false;
    
    // Admin can approve at any level 2 or 3 (including Finance Officer at level 2, President at level 3)
    // Check if the request is in a state that matches this user's pending step
    const statusLevelMap = {
      1: 'pending_supervisor',
      2: 'pending_departmental_head', 
      3: 'pending_head_of_business',
      4: 'pending_finance'
    };
    
    const expectedStatus = statusLevelMap[currentStep.level];
    
    // For admin, allow approval if:
    // 1. User has a pending step in approval chain
    // 2. Request status matches the expected status for that level OR user is at level 2/3
    return currentStep.status === 'pending' && 
           (request.status === expectedStatus || 
            (currentStep.level >= 2 && currentStep.level <= 3));
  };

  const hasUserApproved = (request) => {
    if (!request.approvalChain || !user?.email) return false;
    return request.approvalChain.some(step => 
      step.approver?.email === user.email && step.status === 'approved'
    );
  };

  const hasUserRejected = (request) => {
    if (!request.approvalChain || !user?.email) return false;
    return request.approvalChain.some(step => 
      step.approver?.email === user.email && step.status === 'rejected'
    );
  };

  // Handle approval decision - using cashRequestAPI
  const handleApprovalDecision = async (values) => {
    if (!selectedRequest) return;

    try {
      setLoading(true);
      
      const payload = {
        decision: values.decision,
        comments: values.comments
      };

      console.log('Submitting admin approval decision:', payload);

      const response = await cashRequestAPI.processSupervisorDecision(
        selectedRequest._id, 
        payload
      );
      
      if (response.success) {
        const actionText = values.decision === 'approved' ? 'approved' : 'rejected';
        message.success(`Cash request ${actionText} successfully`);
        
        setApprovalModalVisible(false);
        form.resetFields();
        setSelectedRequest(null);
        await fetchCashRequests();
        
        notification.success({
          message: 'Admin Decision Recorded',
          description: `Cash request from ${selectedRequest.employee?.fullName} has been ${actionText} and will proceed to the next approval level.`,
          duration: 4
        });
      } else {
        throw new Error(response.message || 'Failed to process decision');
      }
    } catch (error) {
      console.error('Admin approval decision error:', error);
      message.error(error.response?.data?.message || 'Failed to process approval decision');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (request) => {
    try {
      const response = await cashRequestAPI.getRequestById(request._id);
      if (response.success) {
        setSelectedRequest(response.data);
        setDetailsModalVisible(true);
      }
    } catch (error) {
      console.error('Error fetching request details:', error);
      message.error('Failed to fetch request details');
    }
  };

  const getStatusTag = (status) => {
    const statusMap = {
      'pending_supervisor': { color: 'orange', text: 'Pending Supervisor', icon: <ClockCircleOutlined /> },
      'pending_departmental_head': { color: 'gold', text: 'Pending Dept. Head', icon: <ClockCircleOutlined /> },
      'pending_head_of_business': { color: 'orange', text: 'Pending Head of Business', icon: <ClockCircleOutlined /> },
      'pending_finance': { color: 'blue', text: 'Pending Finance', icon: <ClockCircleOutlined /> },
      'approved': { color: 'green', text: 'Approved', icon: <CheckCircleOutlined /> },
      'denied': { color: 'red', text: 'Denied', icon: <CloseCircleOutlined /> },
      'rejected': { color: 'red', text: 'Rejected', icon: <CloseCircleOutlined /> },
      'disbursed': { color: 'purple', text: 'Disbursed', icon: <DollarOutlined /> },
      'completed': { color: 'cyan', text: 'Completed', icon: <CheckCircleOutlined /> }
    };

    const config = statusMap[status] || { color: 'default', text: status?.replace('_', ' ') || 'Unknown', icon: null };
    return <Tag color={config.color} icon={config.icon}>{config.text}</Tag>;
  };

  const getUrgencyTag = (urgency) => {
    const urgencyMap = {
      'high': { color: 'red', text: 'High Priority' },
      'medium': { color: 'orange', text: 'Medium Priority' },
      'low': { color: 'green', text: 'Low Priority' }
    };
    const urgencyInfo = urgencyMap[urgency] || { color: 'default', text: urgency };
    return <Tag color={urgencyInfo.color}>{urgencyInfo.text}</Tag>;
  };

  const getApprovalProgress = (request) => {
    if (!request.approvalChain || request.approvalChain.length === 0) return 0;
    const approved = request.approvalChain.filter(step => step.status === 'approved').length;
    return Math.round((approved / request.approvalChain.length) * 100);
  };

  const getTabCount = (status) => {
    return requests.filter(req => {
      switch (status) {
        case 'pending':
          return canUserApprove(req);
        case 'approved':
          return ['approved', 'pending_finance', 'disbursed', 'completed'].includes(req.status) && hasUserApproved(req);
        case 'rejected':
          return req.status === 'denied' && hasUserRejected(req);
        default:
          return false;
      }
    }).length;
  };

  const getFilteredRequests = () => {
    return requests.filter(request => {
      switch (activeTab) {
        case 'pending':
          return canUserApprove(request);
        case 'approved':
          return ['approved', 'pending_finance', 'disbursed', 'completed'].includes(request.status) && hasUserApproved(request);
        case 'rejected':
          return request.status === 'denied' && hasUserRejected(request);
        default:
          return true;
      }
    });
  };

  // File download handler
  const handleDownloadAttachment = async (requestId, attachment) => {
    try {
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

  const handleViewAttachment = async (attachment) => {
    try {
      setFileViewerLoading(true);
      setFileViewerVisible(true);

      const token = localStorage.getItem('token');
      if (!token) {
        message.error('Authentication required');
        setFileViewerVisible(false);
        setFileViewerLoading(false);
        return;
      }

      const publicId = attachment.publicId || attachment.fileName || attachment.name;
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
      const downloadUrl = `${apiUrl}/files/download/${encodeURIComponent(publicId)}`;
      
      const response = await fetch(downloadUrl, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to fetch file');

      const isImage = attachment.mimetype?.startsWith('image/') || /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(attachment.name);
      const isPDF = attachment.mimetype === 'application/pdf' || /\.pdf$/i.test(attachment.name);

      if (isPDF) {
        const viewUrl = `${apiUrl}/files/view/${encodeURIComponent(publicId)}`;
        setViewingFile({
          name: attachment.name,
          url: viewUrl,
          type: 'pdf',
          mimetype: attachment.mimetype,
          isDirectUrl: true,
          authHeaders: { 'Authorization': `Bearer ${token}` }
        });
      } else {
        const blob = await response.blob();
        const fileUrl = window.URL.createObjectURL(blob);
        setViewingFile({
          name: attachment.name,
          url: fileUrl,
          type: isImage ? 'image' : 'other',
          mimetype: attachment.mimetype
        });
      }
      setFileViewerLoading(false);
    } catch (error) {
      console.error('Error viewing attachment:', error);
      message.error('Failed to view attachment');
      setFileViewerVisible(false);
      setFileViewerLoading(false);
    }
  };

  const handleRefresh = async () => {
    await fetchCashRequests();
    message.success('Data refreshed successfully');
  };

  const columns = [
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
      width: 200
    },
    {
      title: 'Request Details',
      key: 'requestDetails',
      render: (_, record) => (
        <div>
          <Text strong>XAF {(record.amountRequested || 0).toLocaleString()}</Text>
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
      width: 220
    },
    {
      title: 'Priority & Dates',
      key: 'priorityDate',
      render: (_, record) => (
        <div>
          {getUrgencyTag(record.urgency)}
          <br />
          <Text type="secondary" style={{ fontSize: '11px' }}>
            <CalendarOutlined /> Required: {record.requiredDate ? new Date(record.requiredDate).toLocaleDateString('en-GB') : 'N/A'}
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
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status, record) => (
        <div>
          {getStatusTag(status)}
          {canUserApprove(record) && (
            <div style={{ marginTop: 4 }}>
              <Tag color="gold" size="small"><CrownOutlined /> Your Turn</Tag>
            </div>
          )}
        </div>
      ),
      filters: [
        { text: 'Pending Dept. Head', value: 'pending_departmental_head' },
        { text: 'Pending Head of Business', value: 'pending_head_of_business' },
        { text: 'Pending Finance', value: 'pending_finance' },
        { text: 'Approved', value: 'approved' },
        { text: 'Disbursed', value: 'disbursed' },
        { text: 'Denied', value: 'denied' }
      ],
      onFilter: (value, record) => record.status === value,
      width: 180
    },
    {
      title: 'Your Level',
      key: 'approvalLevel',
      render: (_, record) => {
        if (!record.approvalChain || !user?.email) return 'N/A';
        
        const userStep = record.approvalChain.find(step => 
          step.approver?.email === user.email
        );
        
        if (!userStep) return 'N/A';
        
        const isCurrent = userStep.status === 'pending';
        const levelNames = {
          2: 'Dept. Head',
          3: 'Head of Business'
        };
        
        return (
          <div>
            <Tag color={isCurrent ? "gold" : userStep.status === 'approved' ? "green" : userStep.status === 'rejected' ? "red" : "default"}>
              {levelNames[userStep.level] || `Level ${userStep.level}`}
            </Tag>
            {isCurrent && (
              <div style={{ fontSize: '10px', color: '#faad14' }}>
                <CrownOutlined /> Active
              </div>
            )}
          </div>
        );
      },
      width: 120
    },
    {
      title: 'Progress',
      key: 'progress',
      render: (_, record) => {
        const progress = getApprovalProgress(record);
        let status = 'active';
        if (record.status === 'denied') status = 'exception';
        if (['approved', 'disbursed', 'completed'].includes(record.status)) status = 'success';
        
        return (
          <div style={{ width: 80 }}>
            <Progress percent={progress} size="small" status={status} showInfo={false} />
            <Text style={{ fontSize: '11px' }}>{progress}%</Text>
          </div>
        );
      },
      width: 100
    },
    {
      title: 'Attachments',
      key: 'attachments',
      render: (_, record) => (
        <div>
          {record.attachments && record.attachments.length > 0 ? (
            <Space direction="vertical" size="small">
              {record.attachments.map((attachment, index) => (
                <Space key={index} size="small">
                  <Button 
                    size="small" 
                    type="link"
                    icon={<EyeOutlined />}
                    onClick={() => handleViewAttachment(attachment)}
                    style={{ padding: 0, fontSize: '11px' }}
                  >
                    View
                  </Button>
                  <Button 
                    size="small" 
                    type="link"
                    icon={<FileOutlined />}
                    onClick={() => handleDownloadAttachment(record._id, attachment)}
                    style={{ padding: 0, fontSize: '11px' }}
                  >
                    {attachment.name || attachment.fileName}
                  </Button>
                </Space>
              ))}
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
        <Space size="small">
          <Button 
            size="small" 
            icon={<EyeOutlined />}
            onClick={() => handleViewDetails(record)}
          >
            View
          </Button>
          {canUserApprove(record) && (
            <Button 
              size="small" 
              type="primary"
              icon={<CrownOutlined />}
              onClick={() => {
                setSelectedRequest(record);
                setApprovalModalVisible(true);
              }}
            >
              Review
            </Button>
          )}
        </Space>
      ),
      width: 140,
      fixed: 'right'
    }
  ];

  if (loading && requests.length === 0) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Spin size="large" />
        <div style={{ marginTop: '16px' }}>Loading admin cash approvals...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <Title level={2} style={{ margin: 0 }}>
            <SettingOutlined /> Admin Cash Approvals
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

        {/* Stats Cards */}
        <Row gutter={16} style={{ marginBottom: '24px' }}>
          <Col span={6}>
            <Statistic
              title="Pending Your Approval"
              value={stats.pending}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="Approved by You"
              value={stats.approved}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="Rejected by You"
              value={stats.rejected}
              prefix={<CloseCircleOutlined />}
              valueStyle={{ color: '#f5222d' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="Total Requests"
              value={stats.total}
              prefix={<AuditOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Col>
        </Row>

        {stats.pending > 0 && (
          <Alert
            message={`${stats.pending} cash request(s) require your admin approval`}
            description="These requests need departmental head or head of business approval"
            type="warning"
            showIcon
            icon={<CrownOutlined />}
            style={{ marginBottom: '16px' }}
            action={
              <Button 
                size="small" 
                type="primary"
                onClick={() => setActiveTab('pending')}
              >
                Review Now
              </Button>
            }
          />
        )}

        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane 
            tab={`Pending Approval (${getTabCount('pending')})`} 
            key="pending"
          />
          <TabPane 
            tab={`Approved (${getTabCount('approved')})`} 
            key="approved"
          />
          <TabPane 
            tab={`Rejected (${getTabCount('rejected')})`} 
            key="rejected"
          />
        </Tabs>

        <Table
          columns={columns}
          dataSource={getFilteredRequests()}
          loading={loading}
          rowKey="_id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} requests`
          }}
          scroll={{ x: 1400 }}
          size="small"
          rowClassName={(record) => {
            let className = 'cash-request-row';
            if (canUserApprove(record)) className += ' pending-approval-row';
            if (record.urgency === 'high') className += ' high-urgency-row';
            return className;
          }}
        />
      </Card>

      {/* Approval Modal */}
      <Modal
        title={<Space><AuditOutlined />Admin Approval Decision</Space>}
        open={approvalModalVisible}
        onCancel={() => {
          setApprovalModalVisible(false);
          setSelectedRequest(null);
          form.resetFields();
        }}
        footer={null}
        width={800}
      >
        {selectedRequest && (
          <div>
            <Alert
              message="Admin Review Required"
              description="Review this cash request and make your admin-level approval decision."
              type="info"
              showIcon
              style={{ marginBottom: '16px' }}
            />

            <Descriptions bordered column={2} size="small" style={{ marginBottom: '20px' }}>
              <Descriptions.Item label="Employee">
                <Text strong>{selectedRequest.employee?.fullName}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Department">
                <Tag color="blue">{selectedRequest.employee?.department}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Request Type">
                {selectedRequest.requestType?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </Descriptions.Item>
              <Descriptions.Item label="Urgency">
                {getUrgencyTag(selectedRequest.urgency)}
              </Descriptions.Item>
              <Descriptions.Item label="Amount Requested">
                <Text strong>XAF {(selectedRequest.amountRequested || 0).toLocaleString()}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Required Date">
                {selectedRequest.requiredDate ? new Date(selectedRequest.requiredDate).toLocaleDateString('en-GB') : 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label="Purpose" span={2}>
                {selectedRequest.purpose}
              </Descriptions.Item>
              {selectedRequest.businessJustification && (
                <Descriptions.Item label="Business Justification" span={2}>
                  {selectedRequest.businessJustification}
                </Descriptions.Item>
              )}
            </Descriptions>

            {selectedRequest.attachments && selectedRequest.attachments.length > 0 && (
              <Card size="small" title="Attachments" style={{ marginBottom: '20px' }}>
                <Space wrap>
                  {selectedRequest.attachments.map((attachment, index) => (
                    <Space key={index}>
                      <Button 
                        icon={<EyeOutlined />}
                        size="small"
                        onClick={() => handleViewAttachment(attachment)}
                      >
                        View
                      </Button>
                      <Button 
                        icon={<FileOutlined />}
                        size="small"
                        onClick={() => handleDownloadAttachment(selectedRequest._id, attachment)}
                      >
                        Download {attachment.name || attachment.fileName}
                      </Button>
                    </Space>
                  ))}
                </Space>
              </Card>
            )}

            <Form
              form={form}
              layout="vertical"
              onFinish={handleApprovalDecision}
            >
              <Form.Item
                name="decision"
                label="Your Admin Decision"
                rules={[{ required: true, message: 'Please make a decision' }]}
              >
                <Radio.Group>
                  <Radio.Button value="approved" style={{ color: '#52c41a' }}>
                    <CheckCircleOutlined /> Approve Request
                  </Radio.Button>
                  <Radio.Button value="rejected" style={{ color: '#f5222d' }}>
                    <CloseCircleOutlined /> Reject Request
                  </Radio.Button>
                </Radio.Group>
              </Form.Item>

              <Form.Item
                name="comments"
                label="Comments"
                rules={[{ required: true, message: 'Please provide comments for your decision' }]}
              >
                <TextArea 
                  rows={4} 
                  placeholder="Explain your decision (required for audit trail)..."
                  showCount
                  maxLength={500}
                />
              </Form.Item>

              <Form.Item>
                <Space>
                  <Button onClick={() => {
                    setApprovalModalVisible(false);
                    setSelectedRequest(null);
                    form.resetFields();
                  }}>
                    Cancel
                  </Button>
                  <Button 
                    type="primary" 
                    htmlType="submit"
                    loading={loading}
                  >
                    Submit Decision
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>

      {/* Details Modal */}
      <Modal
        title={<Space><DollarOutlined />Cash Request Details & Approval History</Space>}
        open={detailsModalVisible}
        onCancel={() => {
          setDetailsModalVisible(false);
          setSelectedRequest(null);
        }}
        footer={null}
        width={900}
      >
        {selectedRequest && (
          <div>
            <Descriptions bordered column={2} size="small" style={{ marginBottom: '20px' }}>
              <Descriptions.Item label="Request ID">
                <Text code copyable>REQ-{selectedRequest._id?.slice(-6).toUpperCase()}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                {getStatusTag(selectedRequest.status)}
              </Descriptions.Item>
              <Descriptions.Item label="Employee">
                <Text strong>{selectedRequest.employee?.fullName}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Department">
                <Tag color="blue">{selectedRequest.employee?.department}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Amount Requested">
                <Text strong>XAF {(selectedRequest.amountRequested || 0).toLocaleString()}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Request Type">
                {selectedRequest.requestType?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </Descriptions.Item>
              <Descriptions.Item label="Urgency">
                {getUrgencyTag(selectedRequest.urgency)}
              </Descriptions.Item>
              <Descriptions.Item label="Required Date">
                {selectedRequest.requiredDate ? new Date(selectedRequest.requiredDate).toLocaleDateString('en-GB') : 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label="Purpose" span={2}>
                {selectedRequest.purpose}
              </Descriptions.Item>
              {selectedRequest.businessJustification && (
                <Descriptions.Item label="Business Justification" span={2}>
                  {selectedRequest.businessJustification}
                </Descriptions.Item>
              )}
            </Descriptions>

            {selectedRequest.attachments && selectedRequest.attachments.length > 0 && (
              <Card size="small" title="Attached Files" style={{ marginBottom: '20px' }}>
                <Space wrap>
                  {selectedRequest.attachments.map((attachment, index) => (
                    <Button 
                      key={index}
                      icon={<FileOutlined />}
                      onClick={() => handleDownloadAttachment(selectedRequest._id, attachment)}
                    >
                      {attachment.name || attachment.fileName}
                    </Button>
                  ))}
                </Space>
              </Card>
            )}

            {selectedRequest.approvalChain && selectedRequest.approvalChain.length > 0 && (
              <>
                <Title level={4}>
                  <HistoryOutlined /> Approval Chain Progress
                </Title>
                <Timeline>
                  {selectedRequest.approvalChain.map((step, index) => {
                    let color = 'gray';
                    let icon = <ClockCircleOutlined />;
                    
                    if (step.status === 'approved') {
                      color = 'green';
                      icon = <CheckCircleOutlined />;
                    } else if (step.status === 'rejected') {
                      color = 'red';
                      icon = <CloseCircleOutlined />;
                    }

                    const isCurrentStep = step.status === 'pending';
                    const isAdminLevel = step.level === 2 || step.level === 3;

                    return (
                      <Timeline.Item key={index} color={color} dot={icon}>
                        <div>
                          <Text strong>Level {step.level}: {step.approver?.name || 'Unknown'}</Text>
                          {isCurrentStep && <Tag color="gold" size="small" style={{marginLeft: 8}}>Current</Tag>}
                          {isAdminLevel && <Tag color="purple" size="small" style={{marginLeft: 8}}><CrownOutlined /> Admin Level</Tag>}
                          <br />
                          <Text type="secondary">{step.approver?.role} - {step.approver?.email}</Text>
                          <br />
                          {step.status === 'pending' && (
                            <Tag color={isCurrentStep ? "gold" : "orange"}>
                              {isCurrentStep ? "Awaiting Action" : "Pending"}
                            </Tag>
                          )}
                          {step.status === 'approved' && (
                            <>
                              <Tag color="green">Approved</Tag>
                              {step.actionDate && (
                                <Text type="secondary">
                                  {new Date(step.actionDate).toLocaleDateString('en-GB')} 
                                  {step.actionTime && ` at ${step.actionTime}`}
                                </Text>
                              )}
                              {step.comments && (
                                <div style={{ marginTop: 4 }}>
                                  <Text italic>"{step.comments}"</Text>
                                </div>
                              )}
                            </>
                          )}
                          {step.status === 'rejected' && (
                            <>
                              <Tag color="red">Rejected</Tag>
                              {step.actionDate && (
                                <Text type="secondary">
                                  {new Date(step.actionDate).toLocaleDateString('en-GB')}
                                  {step.actionTime && ` at ${step.actionTime}`}
                                </Text>
                              )}
                              {step.comments && (
                                <div style={{ marginTop: 4, color: '#ff4d4f' }}>
                                  <Text>Reason: "{step.comments}"</Text>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </Timeline.Item>
                    );
                  })}
                </Timeline>

                <Card size="small" title="Current Status" style={{ marginTop: '16px' }}>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Text strong>Overall Status: </Text>
                      {getStatusTag(selectedRequest.status)}
                    </Col>
                    <Col span={12}>
                      <Text strong>Progress: </Text>
                      <Progress 
                        percent={getApprovalProgress(selectedRequest)} 
                        size="small" 
                        status={selectedRequest.status === 'denied' ? 'exception' : 'active'}
                      />
                    </Col>
                  </Row>
                  
                  {canUserApprove(selectedRequest) && (
                    <Alert
                      message="Admin Action Required"
                      description="This request is waiting for your admin-level approval decision."
                      type="warning"
                      showIcon
                      icon={<CrownOutlined />}
                      style={{ marginTop: '12px' }}
                      action={
                        <Button 
                          size="small" 
                          type="primary"
                          onClick={() => {
                            setDetailsModalVisible(false);
                            setApprovalModalVisible(true);
                          }}
                        >
                          Make Decision
                        </Button>
                      }
                    />
                  )}
                </Card>

                {(selectedRequest.amountApproved || selectedRequest.disbursementDetails) && (
                  <Card size="small" title="Financial Status" style={{ marginTop: '16px' }}>
                    <Descriptions column={2} size="small">
                      {selectedRequest.amountApproved && (
                        <Descriptions.Item label="Amount Approved">
                          XAF {selectedRequest.amountApproved.toLocaleString()}
                        </Descriptions.Item>
                      )}
                      {selectedRequest.disbursementDetails && (
                        <>
                          <Descriptions.Item label="Disbursed Amount">
                            XAF {selectedRequest.disbursementDetails.amount?.toLocaleString()}
                          </Descriptions.Item>
                          <Descriptions.Item label="Disbursement Date">
                            {new Date(selectedRequest.disbursementDetails.date).toLocaleDateString('en-GB')}
                          </Descriptions.Item>
                        </>
                      )}
                    </Descriptions>
                  </Card>
                )}

                {selectedRequest.justification && (
                  <Card size="small" title="Justification Details" style={{ marginTop: '16px' }}>
                    <Descriptions column={2} size="small">
                      <Descriptions.Item label="Amount Spent">
                        XAF {selectedRequest.justification.amountSpent?.toLocaleString()}
                      </Descriptions.Item>
                      <Descriptions.Item label="Balance Returned">
                        XAF {selectedRequest.justification.balanceReturned?.toLocaleString()}
                      </Descriptions.Item>
                      <Descriptions.Item label="Justification Date">
                        {new Date(selectedRequest.justification.justificationDate).toLocaleDateString('en-GB')}
                      </Descriptions.Item>
                      <Descriptions.Item label="Details" span={2}>
                        {selectedRequest.justification.details}
                      </Descriptions.Item>
                    </Descriptions>
                    
                    {selectedRequest.justification.documents && selectedRequest.justification.documents.length > 0 && (
                      <div style={{ marginTop: '12px' }}>
                        <Text strong>Supporting Documents:</Text>
                        <div style={{ marginTop: '8px' }}>
                          <Space wrap>
                            {selectedRequest.justification.documents.map((doc, index) => (
                              <Button 
                                key={index}
                                icon={<FileOutlined />}
                                size="small"
                                onClick={() => handleDownloadAttachment(selectedRequest._id, doc)}
                              >
                                {doc.name || doc.fileName}
                              </Button>
                            ))}
                          </Space>
                        </div>
                      </div>
                    )}
                  </Card>
                )}
              </>
            )}
          </div>
        )}
      </Modal>

      {/* File Viewer Modal */}
      <Modal
        title={viewingFile?.name || 'File Viewer'}
        open={fileViewerVisible}
        onCancel={() => {
          setFileViewerVisible(false);
          setViewingFile(null);
          setFileViewerLoading(false);
          if (viewingFile?.url && !viewingFile?.isDirectUrl) {
            window.URL.revokeObjectURL(viewingFile.url);
          }
        }}
        footer={[
          <Button key="download" onClick={() => {
            if (viewingFile?.url) {
              const link = document.createElement('a');
              link.href = viewingFile.url;
              link.download = viewingFile.name || 'file';
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              message.success('File downloaded successfully');
            }
          }}>
            Download
          </Button>,
          <Button key="close" onClick={() => {
            setFileViewerVisible(false);
            setViewingFile(null);
            setFileViewerLoading(false);
            if (viewingFile?.url && !viewingFile?.isDirectUrl) {
              window.URL.revokeObjectURL(viewingFile.url);
            }
          }}>
            Close
          </Button>
        ]}
        width="80%"
        style={{ top: 20 }}
        bodyStyle={{ padding: '20px', textAlign: 'center', minHeight: '60vh' }}
      >
        {fileViewerLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
            <Spin size="large" />
            <div style={{ marginLeft: '16px' }}>Loading file...</div>
          </div>
        ) : viewingFile ? (
          <div>
            {viewingFile.type === 'image' ? (
              <img 
                src={viewingFile.url} 
                alt={viewingFile.name}
                style={{ 
                  maxWidth: '100%', 
                  maxHeight: '70vh', 
                  objectFit: 'contain',
                  border: '1px solid #d9d9d9',
                  borderRadius: '6px'
                }}
              />
            ) : viewingFile.type === 'pdf' ? (
              <div>
                <PDFViewer 
                  url={viewingFile.url}
                  name={viewingFile.name}
                  authHeaders={viewingFile.authHeaders}
                />
                <div style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
                  If the PDF doesn't display correctly, please use the Download button below.
                </div>
              </div>
            ) : (
              <div style={{ padding: '40px' }}>
                <Alert
                  message="Preview not available"
                  description={`File type "${viewingFile.mimetype}" cannot be previewed inline. Please download to view.`}
                  type="info"
                  showIcon
                />
              </div>
            )}
          </div>
        ) : null}
      </Modal>

      {/* Custom CSS for row styling */}
      <style>{`
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
        .high-urgency-row {
          border-left: 3px solid #ff4d4f;
        }
        .high-urgency-row:hover {
          background-color: #fff2f0 !important;
        }
      `}</style>
    </div>
  );
};

export default AdminCashApprovals;



