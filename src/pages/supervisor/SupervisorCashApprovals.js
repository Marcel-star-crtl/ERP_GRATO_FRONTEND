// pages/supervisor/SupervisorCashApprovals.jsx - ENHANCED FOR REIMBURSEMENTS

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
  Tooltip,
  Badge,
  Divider,
  Image,
  notification
} from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  UserOutlined,
  CalendarOutlined,
  TeamOutlined,
  AuditOutlined,
  EyeOutlined,
  ReloadOutlined,
  ExclamationCircleOutlined,
  FileOutlined,
  FileTextOutlined,
  DownloadOutlined,
  ZoomInOutlined
} from '@ant-design/icons';
import { cashRequestAPI } from '../../services/cashRequestAPI';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const SupervisorCashApprovals = () => {
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
    total: 0,
    reimbursements: 0,
    advances: 0
  });
  
  const [form] = Form.useForm();

  const fetchAllData = useCallback(async () => {
    try {
      setLoading(true);
      console.log('Fetching all cash requests...');

      const response = await cashRequestAPI.getSupervisorRequests();

      if (response && response.success) {
        const allData = response.data || [];
        
        console.log('Total records fetched:', allData.length);
        
        setRequests(allData);

        // Calculate stats - separate reimbursements from advances
        const pending = allData.filter(req => req.teamRequestMetadata?.userHasPendingApproval).length;
        const approved = allData.filter(req => req.teamRequestMetadata?.userHasApproved).length;
        const rejected = allData.filter(req => req.teamRequestMetadata?.userHasRejected).length;
        const reimbursements = allData.filter(req => req.requestMode === 'reimbursement').length;
        const advances = allData.filter(req => req.requestMode === 'advance').length;

        setStats({
          pending,
          approved,
          rejected,
          total: allData.length,
          reimbursements,
          advances
        });
      } else {
        throw new Error('Failed to fetch data');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      message.error(error.response?.data?.message || 'Failed to load requests');
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.email) {
      fetchAllData();
    }
  }, [fetchAllData, user?.email]);

  const handleRefresh = async () => {
    await fetchAllData();
    message.success('Data refreshed successfully');
  };

  const canUserApprove = useCallback((request) => {
    if (!request.approvalChain || !user?.email) {
      return false;
    }

    if (request.teamRequestMetadata) {
      return request.teamRequestMetadata.userHasPendingApproval === true;
    }

    const currentLevel = request.approvalChain.find(step => step.status === 'pending')?.level;
    if (!currentLevel) return false;

    const userPendingStep = request.approvalChain.find(step => 
      step.approver?.email?.toLowerCase() === user.email.toLowerCase() &&
      step.status === 'pending' &&
      step.level === currentLevel
    );

    return !!userPendingStep;
  }, [user?.email]);

  const hasUserApproved = useCallback((request) => {
    if (!request.approvalChain || !user?.email) {
      return false;
    }

    if (request.teamRequestMetadata) {
      return request.teamRequestMetadata.userHasApproved === true;
    }
    
    return request.approvalChain.some(step => 
      step.approver?.email?.toLowerCase() === user.email.toLowerCase() &&
      step.status === 'approved'
    );
  }, [user?.email]);

  const hasUserRejected = useCallback((request) => {
    if (!request.approvalChain || !user?.email) {
      return false;
    }

    if (request.teamRequestMetadata) {
      return request.teamRequestMetadata.userHasRejected === true;
    }
    
    return request.approvalChain.some(step => 
      step.approver?.email?.toLowerCase() === user.email.toLowerCase() &&
      step.status === 'rejected'
    );
  }, [user?.email]);

  const handleApprovalDecision = async (values) => {
    if (!selectedRequest) return;

    try {
      setLoading(true);
      
      const payload = {
        decision: values.decision,
        comments: values.comments
      };

      const response = await cashRequestAPI.processSupervisorDecision(
        selectedRequest._id, 
        payload
      );
      
      if (response.success) {
        const actionText = values.decision === 'approved' ? 'approved' : 'rejected';
        const requestType = selectedRequest.requestMode === 'reimbursement' ? 'Reimbursement' : 'Cash advance';
        
        message.success(`${requestType} request ${actionText} successfully`);
        
        setApprovalModalVisible(false);
        form.resetFields();
        setSelectedRequest(null);
        
        await fetchAllData();
        
        notification.success({
          message: 'Approval Decision Recorded',
          description: `${requestType} request from ${selectedRequest.employee?.fullName} has been ${actionText}.`,
          duration: 4
        });
      } else {
        throw new Error(response.message || 'Failed to process decision');
      }
    } catch (error) {
      console.error('Approval decision error:', error);
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

  const handleDownloadReceipt = async (receipt) => {
    try {
      const blob = await cashRequestAPI.downloadAttachment(receipt.publicId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = receipt.name || receipt.publicId;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      message.success(`Downloaded ${receipt.name || 'file'}`);
    } catch (error) {
      console.error('Error downloading receipt:', error);
      message.error('Failed to download receipt');
    }
  };

  const getStatusTag = (status, request = null) => {
    const statusMap = {
      'pending_supervisor': { color: 'orange', text: 'Pending Supervisor', icon: <ClockCircleOutlined /> },
      'pending_departmental_head': { color: 'orange', text: 'Pending Departmental Head', icon: <ClockCircleOutlined /> },
      'pending_head_of_business': { color: 'orange', text: 'Pending Head of Business', icon: <ClockCircleOutlined /> },
      'pending_finance': { color: 'blue', text: 'Pending Finance', icon: <ClockCircleOutlined /> },
      'approved': { color: 'green', text: 'Approved', icon: <CheckCircleOutlined /> },
      'denied': { color: 'red', text: 'Denied', icon: <CloseCircleOutlined /> },
      'partially_disbursed': { color: 'processing', text: 'Partially Disbursed', icon: <DollarOutlined /> },
      'fully_disbursed': { color: 'cyan', text: 'Fully Disbursed', icon: <DollarOutlined /> },
      'completed': { color: 'green', text: 'Completed', icon: <CheckCircleOutlined /> }
    };

    const config = statusMap[status] || { color: 'default', text: status?.replace(/_/g, ' ') || 'Unknown', icon: null };
    return <Tag color={config.color} icon={config.icon}>{config.text}</Tag>;
  };

  const getUrgencyTag = (urgency) => {
    const urgencyMap = {
      'urgent': { color: 'red', text: 'Urgent' },
      'high': { color: 'red', text: 'High' },
      'medium': { color: 'orange', text: 'Medium' },
      'low': { color: 'green', text: 'Low' }
    };

    const urgencyInfo = urgencyMap[urgency] || { color: 'default', text: urgency };
    return <Tag color={urgencyInfo.color}>{urgencyInfo.text}</Tag>;
  };

  const getRequestModeTag = (mode) => {
    if (mode === 'reimbursement') {
      return <Tag color="purple">REIMBURSEMENT</Tag>;
    }
    return <Tag color="blue">ADVANCE</Tag>;
  };

  const getFilteredRequests = () => {
    return requests.filter(request => {
      switch (activeTab) {
        case 'pending':
          return canUserApprove(request);
        case 'approved':
          return hasUserApproved(request);
        case 'rejected':
          return hasUserRejected(request);
        default:
          return true;
      }
    });
  };

  const getApprovalProgress = (request) => {
    if (!request.approvalChain || request.approvalChain.length === 0) return 0;
    const approved = request.approvalChain.filter(step => step.status === 'approved').length;
    return Math.round((approved / request.approvalChain.length) * 100);
  };

  const columns = [
    {
      title: 'Type',
      key: 'mode',
      render: (_, record) => getRequestModeTag(record.requestMode),
      width: 120,
      filters: [
        { text: 'Reimbursement', value: 'reimbursement' },
        { text: 'Advance', value: 'advance' }
      ],
      onFilter: (value, record) => record.requestMode === value
    },
    {
      title: 'Request ID',
      dataIndex: '_id',
      key: '_id',
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
          {record.requestMode === 'reimbursement' && (
            <Tag color="purple" size="small" icon={<FileTextOutlined />}>
              {record.reimbursementDetails?.receiptDocuments?.length || 0} receipts
            </Tag>
          )}
          {record.itemizedBreakdown && record.itemizedBreakdown.length > 0 && (
            <Tag color="cyan" size="small">
              {record.itemizedBreakdown.length} items
            </Tag>
          )}
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
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status, record) => (
        <div>
          {getStatusTag(status, record)}
          {canUserApprove(record) && (
            <div style={{ marginTop: 4 }}>
              <Tag color="gold" size="small">Your Turn</Tag>
            </div>
          )}
        </div>
      ),
      width: 160
    },
    {
      title: 'Progress',
      key: 'progress',
      render: (_, record) => {
        const progress = getApprovalProgress(record);
        let status = 'active';
        if (record.status === 'denied') status = 'exception';
        if (['approved', 'fully_disbursed', 'completed'].includes(record.status)) status = 'success';
        
        return (
          <div style={{ width: 80 }}>
            <Progress 
              percent={progress} 
              size="small" 
              status={status}
              showInfo={false}
            />
            <Text style={{ fontSize: '11px' }}>{progress}%</Text>
          </div>
        );
      },
      width: 100
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
              onClick={() => {
                setSelectedRequest(record);
                form.resetFields();
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
        <div style={{ marginTop: '16px' }}>Loading approvals...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <Title level={2} style={{ margin: 0 }}>
            <TeamOutlined /> Cash Request Approvals
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
          <Col span={4}>
            <Statistic
              title="Pending Your Approval"
              value={stats.pending}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Col>
          <Col span={4}>
            <Statistic
              title="Approved by You"
              value={stats.approved}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Col>
          <Col span={4}>
            <Statistic
              title="Rejected by You"
              value={stats.rejected}
              prefix={<CloseCircleOutlined />}
              valueStyle={{ color: '#f5222d' }}
            />
          </Col>
          <Col span={4}>
            <Statistic
              title="Reimbursements"
              value={stats.reimbursements}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Col>
          <Col span={4}>
            <Statistic
              title="Advances"
              value={stats.advances}
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Col>
          <Col span={4}>
            <Statistic
              title="Total Assigned"
              value={stats.total}
              prefix={<AuditOutlined />}
              valueStyle={{ color: '#000' }}
            />
          </Col>
        </Row>

        {stats.pending > 0 && (
          <Alert
            message={`${stats.pending} request(s) require your approval`}
            type="warning"
            showIcon
            style={{ marginBottom: '16px' }}
          />
        )}

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
            if (canUserApprove(record)) {
              className += ' pending-approval-row';
            }
            if (record.urgency === 'high' || record.urgency === 'urgent') {
              className += ' high-urgency-row';
            }
            return className;
          }}
        />
      </Card>

      {/* Approval Modal - ENHANCED FOR REIMBURSEMENTS */}
      <Modal
        title={
          <Space>
            <AuditOutlined />
            {selectedRequest?.requestMode === 'reimbursement' ? 'Reimbursement' : 'Cash Request'} Approval Decision
          </Space>
        }
        open={approvalModalVisible}
        onCancel={() => {
          setApprovalModalVisible(false);
          setSelectedRequest(null);
          form.resetFields();
        }}
        footer={null}
        width={900}
      >
        {selectedRequest && (
          <div>
            <Alert
              message={selectedRequest.requestMode === 'reimbursement' ? 
                'Reimbursement Request - Employee has already spent personal funds' : 
                'Cash Advance Request - Employee requesting upfront funds'}
              description="Please review and make a decision on this request."
              type="info"
              showIcon
              style={{ marginBottom: '16px' }}
            />

            <Descriptions bordered column={2} size="small" style={{ marginBottom: '20px' }}>
              <Descriptions.Item label="Request Type">
                {getRequestModeTag(selectedRequest.requestMode)}
              </Descriptions.Item>
              <Descriptions.Item label="Request ID">
                <Tag color="blue">REQ-{selectedRequest._id?.slice(-6).toUpperCase()}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Employee">
                <Text strong>{selectedRequest.employee?.fullName}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Department">
                <Tag color="blue">{selectedRequest.employee?.department}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Expense Type">
                {selectedRequest.requestType?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </Descriptions.Item>
              <Descriptions.Item label="Urgency">
                {getUrgencyTag(selectedRequest.urgency)}
              </Descriptions.Item>
              <Descriptions.Item label="Amount Requested">
                <Text strong style={{ color: '#1890ff' }}>XAF {(selectedRequest.amountRequested || 0).toLocaleString()}</Text>
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

            {/* ✅ ITEMIZED BREAKDOWN (if exists) */}
            {selectedRequest.itemizedBreakdown && selectedRequest.itemizedBreakdown.length > 0 && (
              <Card size="small" title="Itemized Expenses" style={{ marginBottom: '20px' }}>
                <Table
                  dataSource={selectedRequest.itemizedBreakdown}
                  size="small"
                  pagination={false}
                  columns={[
                    {
                      title: 'Description',
                      dataIndex: 'description',
                      key: 'description'
                    },
                    {
                      title: 'Category',
                      dataIndex: 'category',
                      key: 'category',
                      render: (cat) => cat ? (
                        <Tag>{cat.replace(/-/g, ' ').toUpperCase()}</Tag>
                      ) : '-'
                    },
                    {
                      title: 'Amount',
                      dataIndex: 'amount',
                      key: 'amount',
                      render: (amt) => <Text strong>XAF {Number(amt || 0).toLocaleString()}</Text>
                    }
                  ]}
                  summary={(data) => {
                    const total = data.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
                    return (
                      <Table.Summary.Row>
                        <Table.Summary.Cell index={0} colSpan={2}>
                          <Text strong>Total</Text>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={1}>
                          <Text strong style={{ color: '#1890ff' }}>
                            XAF {total.toLocaleString()}
                          </Text>
                        </Table.Summary.Cell>
                      </Table.Summary.Row>
                    );
                  }}
                />
              </Card>
            )}

            {/* ✅ RECEIPT DOCUMENTS (for reimbursements) */}
            {selectedRequest.requestMode === 'reimbursement' && 
             selectedRequest.reimbursementDetails?.receiptDocuments && 
             selectedRequest.reimbursementDetails.receiptDocuments.length > 0 && (
              <Card 
                size="small" 
                title={
                  <Space>
                    <FileTextOutlined />
                    Receipt Documents ({selectedRequest.reimbursementDetails.receiptDocuments.length})
                  </Space>
                }
                style={{ marginBottom: '20px' }}
              >
                <Alert
                  message="Please verify receipts match the expenses claimed"
                  type="warning"
                  showIcon
                  style={{ marginBottom: '12px' }}
                />
                <Space wrap>
                  {selectedRequest.reimbursementDetails.receiptDocuments.map((receipt, index) => (
                    <Button
                      key={index}
                      icon={<DownloadOutlined />}
                      onClick={() => handleDownloadReceipt(receipt)}
                    >
                      {receipt.name || `Receipt ${index + 1}`}
                    </Button>
                  ))}
                </Space>
              </Card>
            )}

            {/* Attachments (for advance requests) */}
            {selectedRequest.requestMode === 'advance' && 
             selectedRequest.attachments && 
             selectedRequest.attachments.length > 0 && (
              <Card size="small" title="Attached Files" style={{ marginBottom: '20px' }}>
                <Space wrap>
                  {selectedRequest.attachments.map((attachment, index) => (
                    <Button
                      key={index}
                      icon={<FileOutlined />}
                      onClick={() => handleDownloadReceipt(attachment)}
                    >
                      {attachment.name || `Attachment ${index + 1}`}
                    </Button>
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
                label="Your Decision"
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

export default SupervisorCashApprovals;







// import React, { useState, useEffect, useCallback } from 'react';
// import { useNavigate, useSearchParams } from 'react-router-dom';
// import { useSelector } from 'react-redux';
// import {
//   Card,
//   Table,
//   Button,
//   Modal,
//   Form,
//   Input,
//   Typography,
//   Tag,
//   Space,
//   Tabs,
//   Alert,
//   Descriptions,
//   Timeline,
//   Progress,
//   message,
//   Radio,
//   Row,
//   Col,
//   Statistic,
//   Spin,
//   notification,
//   Tooltip,
//   Badge
// } from 'antd';
// import {
//   CheckCircleOutlined,
//   CloseCircleOutlined,
//   ClockCircleOutlined,
//   DollarOutlined,
//   UserOutlined,
//   CalendarOutlined,
//   TeamOutlined,
//   AuditOutlined,
//   EyeOutlined,
//   ReloadOutlined,
//   ExclamationCircleOutlined,
//   FileOutlined,
//   HistoryOutlined,
//   FileTextOutlined
// } from '@ant-design/icons';
// import { cashRequestAPI } from '../../services/cashRequestAPI';

// const PDFViewer = ({ url, name, authHeaders }) => {
//   const [pdfUrl, setPdfUrl] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   useEffect(() => {
//     const loadPDF = async () => {
//       try {
//         setLoading(true);
//         const response = await fetch(url, {
//           headers: authHeaders
//         });

//         if (!response.ok) {
//           throw new Error('Failed to load PDF');
//         }

//         const blob = await response.blob();
//         const pdfBlob = new Blob([blob], { type: 'application/pdf' });
//         const blobUrl = window.URL.createObjectURL(pdfBlob);
        
//         setPdfUrl(blobUrl);
//       } catch (err) {
//         console.error('PDF loading error:', err);
//         setError(err.message);
//       } finally {
//         setLoading(false);
//       }
//     };

//     if (url && authHeaders) {
//       loadPDF();
//     }

//     return () => {
//       if (pdfUrl) {
//         window.URL.revokeObjectURL(pdfUrl);
//       }
//     };
//   }, [url, authHeaders]);

//   if (loading) {
//     return (
//       <div style={{ 
//         display: 'flex', 
//         justifyContent: 'center', 
//         alignItems: 'center', 
//         height: '70vh',
//         border: '1px solid #d9d9d9',
//         borderRadius: '6px'
//       }}>
//         <Spin size="large" />
//         <span style={{ marginLeft: '16px' }}>Loading PDF...</span>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div style={{ 
//         display: 'flex', 
//         flexDirection: 'column',
//         justifyContent: 'center', 
//         alignItems: 'center', 
//         height: '70vh',
//         border: '1px solid #d9d9d9',
//         borderRadius: '6px',
//         backgroundColor: '#f5f5f5'
//       }}>
//         <Alert
//           message="PDF Loading Failed"
//           description={`Unable to load PDF: ${error}`}
//           type="error"
//           showIcon
//         />
//       </div>
//     );
//   }

//   return (
//     <iframe
//       src={pdfUrl}
//       style={{
//         width: '100%',
//         height: '70vh',
//         border: '1px solid #d9d9d9',
//         borderRadius: '6px'
//       }}
//       title={name}
//     />
//   );
// };

// const { Title, Text, Paragraph } = Typography;
// const { TabPane } = Tabs;
// const { TextArea } = Input;

// const SupervisorCashApprovals = () => {
//   const navigate = useNavigate();
//   const [searchParams] = useSearchParams();
//   const { user } = useSelector((state) => state.auth);
  
//   const autoApprovalId = searchParams.get('approve');
//   const autoRejectId = searchParams.get('reject');
  
//   const [requests, setRequests] = useState([]);
//   const [justifications, setJustifications] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [detailsModalVisible, setDetailsModalVisible] = useState(false);
//   const [approvalModalVisible, setApprovalModalVisible] = useState(false);
//   const [justificationDecisionModalVisible, setJustificationDecisionModalVisible] = useState(false);
//   const [selectedRequest, setSelectedRequest] = useState(null);
//   const [selectedJustification, setSelectedJustification] = useState(null);
//   const [activeTab, setActiveTab] = useState('pending');
//   const [stats, setStats] = useState({
//     pending: 0,
//     approved: 0,
//     rejected: 0,
//     total: 0,
//     justificationsPending: 0
//   });
  
//   const [fileViewerVisible, setFileViewerVisible] = useState(false);
//   const [viewingFile, setViewingFile] = useState(null);
//   const [fileViewerLoading, setFileViewerLoading] = useState(false);
  
//   const [form] = Form.useForm();

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

//   // Get current approval level from approval chain
//   const getCurrentApprovalLevel = (request) => {
//     if (!request.approvalChain || request.approvalChain.length === 0) return null;
    
//     // Find the first pending step in the chain
//     const currentStep = request.approvalChain.find(step => step.status === 'pending');
//     return currentStep ? currentStep.level : null;
//   };

//   // Get appropriate status based on current approval level
//   const getExpectedStatus = (currentLevel) => {
//     const statusLevelMap = {
//       1: 'pending_supervisor',
//       2: 'pending_departmental_head', 
//       3: 'pending_head_of_business',
//       4: 'pending_finance'
//     };
    
//     return statusLevelMap[currentLevel] || 'pending_supervisor';
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

//   // Check if user can approve cash request (initial approval, NOT justification)
//   const canUserApprove = useCallback((request) => {
//     if (!request.approvalChain || !user?.email) {
//       return false;
//     }

//     // CRITICAL: Exclude justification statuses
//     if (isJustificationStatus(request.status)) {
//       return false;
//     }
    
//     // Use teamRequestMetadata if available for more accurate checking
//     if (request.teamRequestMetadata) {
//       return request.teamRequestMetadata.userHasPendingApproval === true;
//     }

//     // Get current approval level
//     const currentLevel = getCurrentApprovalLevel(request);
//     if (!currentLevel) return false;

//     // Find user's pending step at the CURRENT level
//     const userPendingStep = request.approvalChain.find(step => 
//       step.approver?.email?.toLowerCase() === user.email.toLowerCase() &&
//       step.status === 'pending' &&
//       step.level === currentLevel
//     );

//     return !!userPendingStep;
//   }, [user?.email]);

//   // Check if user can approve justification
//   const canUserApproveJustification = useCallback((request) => {
//     if (!request.justificationApprovalChain || !user?.email) {
//       console.log('❌ canUserApproveJustification: Missing chain or user email', {
//         hasChain: !!request.justificationApprovalChain,
//         hasUserEmail: !!user?.email
//       });
//       return false;
//     }

//     // CRITICAL: Only check if status is actually a justification status
//     if (!isJustificationStatus(request.status)) {
//       console.log('❌ canUserApproveJustification: Not a justification status', {
//         status: request.status,
//         requestId: request._id
//       });
//       return false;
//     }

//     console.log('🔍 Checking justification approval for:', {
//       requestId: request._id,
//       status: request.status,
//       userEmail: user.email,
//       chainLength: request.justificationApprovalChain.length
//     });

//     // Get current status level from the status string
//     const currentStatusLevel = extractJustificationLevel(request.status);
//     console.log('📊 Current status level:', currentStatusLevel);
    
//     if (!currentStatusLevel) {
//       console.log('❌ Could not extract status level from:', request.status);
//       return false;
//     }

//     // Find ALL pending steps for this user at ANY level (to support multi-role users)
//     const userPendingSteps = request.justificationApprovalChain.filter(step => {
//       const emailMatch = step.approver?.email?.toLowerCase() === user.email.toLowerCase();
//       const isPending = step.status === 'pending';
      
//       console.log(`  Step L${step.level}:`, {
//         approverEmail: step.approver?.email,
//         status: step.status,
//         emailMatch,
//         isPending
//       });
      
//       return emailMatch && isPending;
//     });

//     console.log('📋 User pending steps found:', userPendingSteps.length);

//     if (userPendingSteps.length === 0) {
//       console.log('❌ No pending steps found for user');
//       return false;
//     }

//     // Check if ANY of the user's pending steps match the current status level
//     const canApprove = userPendingSteps.some(step => {
//       const levelMatch = step.level === currentStatusLevel;
//       console.log(`  Checking step L${step.level} against current level ${currentStatusLevel}: ${levelMatch}`);
//       return levelMatch;
//     });

//     console.log(`✅ User ${canApprove ? 'CAN' : 'CANNOT'} approve at current level ${currentStatusLevel}`);

//     return canApprove;
//   }, [user?.email]);


//   // Check if user has already approved cash request
//   const hasUserApproved = useCallback((request) => {
//     if (!request.approvalChain || !user?.email) {
//       return false;
//     }

//     // Use teamRequestMetadata if available
//     if (request.teamRequestMetadata) {
//       return request.teamRequestMetadata.userHasApproved === true;
//     }
    
//     return request.approvalChain.some(step => 
//       step.approver?.email?.toLowerCase() === user.email.toLowerCase() &&
//       step.status === 'approved'
//     );
//   }, [user?.email]);

//   // Check if user has rejected cash request
//   const hasUserRejected = useCallback((request) => {
//     if (!request.approvalChain || !user?.email) {
//       return false;
//     }

//     // Use teamRequestMetadata if available
//     if (request.teamRequestMetadata) {
//       return request.teamRequestMetadata.userHasRejected === true;
//     }
    
//     return request.approvalChain.some(step => 
//       step.approver?.email?.toLowerCase() === user.email.toLowerCase() &&
//       step.status === 'rejected'
//     );
//   }, [user?.email]);

//   const getStatusTag = (status, request = null) => {
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

//     // If we have the request object, determine status based on current approval level
//     if (request && request.approvalChain) {
//       const currentLevel = getCurrentApprovalLevel(request);
//       if (currentLevel) {
//         const expectedStatus = getExpectedStatus(currentLevel);
        
//         const statusMap = {
//           'pending_supervisor': { color: 'orange', text: 'Pending Supervisor', icon: <ClockCircleOutlined /> },
//           'pending_departmental_head': { color: 'orange', text: 'Pending Departmental Head', icon: <ClockCircleOutlined /> },
//           'pending_head_of_business': { color: 'orange', text: 'Pending Head of Business', icon: <ClockCircleOutlined /> },
//           'pending_finance': { color: 'blue', text: 'Pending Finance', icon: <ClockCircleOutlined /> },
//           'approved': { color: 'green', text: 'Approved', icon: <CheckCircleOutlined /> },
//           'denied': { color: 'red', text: 'Denied', icon: <CloseCircleOutlined /> },
//           'rejected': { color: 'red', text: 'Rejected', icon: <CloseCircleOutlined /> },
//           'disbursed': { color: 'purple', text: 'Disbursed', icon: <DollarOutlined /> }
//         };

//         const config = statusMap[expectedStatus] || { color: 'default', text: expectedStatus?.replace(/_/g, ' ') || 'Unknown', icon: null };
//         return <Tag color={config.color} icon={config.icon}>{config.text}</Tag>;
//       }
//     }

//     // Regular cash request statuses fallback
//     const statusMap = {
//       'pending_supervisor': { color: 'orange', text: 'Pending Supervisor', icon: <ClockCircleOutlined /> },
//       'pending_departmental_head': { color: 'orange', text: 'Pending Departmental Head', icon: <ClockCircleOutlined /> },
//       'pending_head_of_business': { color: 'orange', text: 'Pending Head of Business', icon: <ClockCircleOutlined /> },
//       'pending_finance': { color: 'blue', text: 'Pending Finance', icon: <ClockCircleOutlined /> },
//       'approved': { color: 'green', text: 'Approved', icon: <CheckCircleOutlined /> },
//       'denied': { color: 'red', text: 'Denied', icon: <CloseCircleOutlined /> },
//       'rejected': { color: 'red', text: 'Rejected', icon: <CloseCircleOutlined /> },
//       'disbursed': { color: 'purple', text: 'Disbursed', icon: <DollarOutlined /> }
//     };

//     const config = statusMap[status] || { color: 'default', text: status?.replace(/_/g, ' ') || 'Unknown', icon: null };
//     return <Tag color={config.color} icon={config.icon}>{config.text}</Tag>;
//   };

//   const getUrgencyTag = (urgency) => {
//     const urgencyMap = {
//       'high': { color: 'red', text: 'High Priority' },
//       'medium': { color: 'orange', text: 'Medium Priority' },
//       'low': { color: 'green', text: 'Low Priority' }
//     };

//     const urgencyInfo = urgencyMap[urgency] || { color: 'default', text: urgency };
    
//     return <Tag color={urgencyInfo.color}>{urgencyInfo.text}</Tag>;
//   };

//   const getApprovalProgress = (request) => {
//     if (!request.approvalChain || request.approvalChain.length === 0) return 0;
//     const approved = request.approvalChain.filter(step => step.status === 'approved').length;
//     return Math.round((approved / request.approvalChain.length) * 100);
//   };

//   const getTabCount = (status, type = 'request') => {
//     if (type === 'request') {
//       const filtered = requests.filter(req => {
//         // Exclude justification statuses from cash request tabs
//         if (isJustificationStatus(req.status)) {
//           return false;
//         }

//         switch (status) {
//           case 'pending':
//             return canUserApprove(req);
//           case 'approved':
//             return hasUserApproved(req);
//           case 'rejected':
//             return hasUserRejected(req);
//           default:
//             return false;
//         }
//       });
//       return filtered.length;
//     } else {
//       // For justifications, return count where user can approve
//       return justifications.filter(j => canUserApproveJustification(j)).length;
//     }
//   };

//   const getFilteredRequests = () => {
//     return requests.filter(request => {
//       // CRITICAL: Exclude requests with justification statuses
//       if (isJustificationStatus(request.status)) {
//         return false;
//       }

//       switch (activeTab) {
//         case 'pending':
//           return canUserApprove(request);
//         case 'approved':
//           return hasUserApproved(request);
//         case 'rejected':
//           return hasUserRejected(request);
//         default:
//           return true;
//       }
//     });
//   };

//   // ============ DATA FETCHING ============

//   const fetchCashRequests = useCallback(async () => {
//     try {
//       setLoading(true);
      
//       const response = await cashRequestAPI.getSupervisorRequests();
      
//       if (response.success) {
//         const requestsData = response.data || [];
//         setRequests(requestsData);

//         // Filter out justification statuses when counting cash requests
//         const cashRequestsOnly = requestsData.filter(req => !isJustificationStatus(req.status));

//         const pending = cashRequestsOnly.filter(req => canUserApprove(req)).length;
//         const approved = cashRequestsOnly.filter(req => hasUserApproved(req)).length;
//         const rejected = cashRequestsOnly.filter(req => hasUserRejected(req)).length;

//         setStats(prev => ({
//           ...prev,
//           pending,
//           approved,
//           rejected,
//           total: cashRequestsOnly.length
//         }));
//       } else {
//         throw new Error(response.message || 'Failed to fetch cash requests');
//       }

//     } catch (error) {
//       console.error('Error fetching cash requests:', error);
//       message.error(error.response?.data?.message || 'Failed to fetch cash requests');
//       setRequests([]);
//     } finally {
//       setLoading(false);
//     }
//   }, [canUserApprove, hasUserApproved, hasUserRejected]);

//   const fetchJustifications = useCallback(async () => {
//     try {
//       const response = await cashRequestAPI.getSupervisorJustifications();
      
//       if (response.success) {
//         const justificationsData = response.data || [];
        
//         // CRITICAL: Filter to only include items with justification statuses
//         const actualJustifications = justificationsData.filter(j => isJustificationStatus(j.status));
        
//         setJustifications(actualJustifications);

//         const pendingJustifications = actualJustifications.filter(j => 
//           canUserApproveJustification(j)
//         ).length;

//         setStats(prev => ({
//           ...prev,
//           justificationsPending: pendingJustifications
//         }));
//       }
//     } catch (error) {
//       console.error('Error fetching justifications:', error);
//       message.error('Failed to fetch justifications');
//       setJustifications([]);
//     }
//   }, [canUserApproveJustification]);

//   useEffect(() => {
//     if (user?.email) {
//       fetchCashRequests();
//       fetchJustifications();
//     }
//   }, [fetchCashRequests, fetchJustifications, user?.email]);

//   // Handle auto-approval from email links
//   useEffect(() => {
//     const handleAutoAction = async () => {
//       if (autoApprovalId || autoRejectId) {
//         const requestId = autoApprovalId || autoRejectId;
//         try {
//           const response = await cashRequestAPI.getRequestById(requestId);
//           if (response.success) {
//             setSelectedRequest(response.data);
//             setApprovalModalVisible(true);
//             form.setFieldsValue({ 
//               decision: autoApprovalId ? 'approved' : 'rejected' 
//             });
//           }
//         } catch (error) {
//           message.error('Failed to load cash request for approval');
//         }
//       }
//     };

//     handleAutoAction();
//   }, [autoApprovalId, autoRejectId, form]);

//   // ============ ACTION HANDLERS ============

//   const handleApprovalDecision = async (values) => {
//     if (!selectedRequest) return;

//     try {
//       setLoading(true);
      
//       const payload = {
//         decision: values.decision,
//         comments: values.comments
//       };

//       const response = await cashRequestAPI.processSupervisorDecision(
//         selectedRequest._id, 
//         payload
//       );
      
//       if (response.success) {
//         const actionText = values.decision === 'approved' ? 'approved' : 'rejected';
//         message.success(`Cash request ${actionText} successfully`);
        
//         setApprovalModalVisible(false);
//         form.resetFields();
//         setSelectedRequest(null);
        
//         await fetchCashRequests();
        
//         notification.success({
//           message: 'Approval Decision Recorded',
//           description: `Cash request from ${selectedRequest.employee?.fullName} has been ${actionText} and stakeholders have been notified.`,
//           duration: 4
//         });
//       } else {
//         throw new Error(response.message || 'Failed to process decision');
//       }
//     } catch (error) {
//       console.error('Approval decision error:', error);
//       message.error(error.response?.data?.message || 'Failed to process approval decision');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleJustificationDecision = async (values) => {
//     if (!selectedJustification) return;

//     try {
//       setLoading(true);

//       const response = await cashRequestAPI.processJustificationDecision(
//         selectedJustification._id,
//         {
//           decision: values.decision,
//           comments: values.comments
//         }
//       );

//       if (response.success) {
//         const actionText = values.decision === 'approved' ? 'approved' : 'rejected';
//         message.success(`Justification ${actionText} successfully`);

//         setJustificationDecisionModalVisible(false);
//         form.resetFields();
//         setSelectedJustification(null);

//         await Promise.all([fetchCashRequests(), fetchJustifications()]);

//         notification.success({
//           message: 'Decision Recorded',
//           description: `Justification for ${selectedJustification.employee?.fullName} has been ${actionText}.`,
//           duration: 4
//         });
//       } else {
//         throw new Error(response.message || 'Failed to process decision');
//       }
//     } catch (error) {
//       console.error('Error processing justification decision:', error);
//       message.error(error.response?.data?.message || 'Failed to process decision');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleViewDetails = async (request) => {
//     try {
//       const response = await cashRequestAPI.getRequestById(request._id);
      
//       if (response.success) {
//         setSelectedRequest(response.data);
//         setDetailsModalVisible(true);
//       }
//     } catch (error) {
//       console.error('Error fetching request details:', error);
//       message.error('Failed to fetch request details');
//     }
//   };

//   const handleDownloadAttachment = async (attachment) => {
//     try {
//       console.log('📥 Downloading attachment:', attachment);
      
//       if (!attachment || !attachment.publicId) {
//         message.error('Invalid attachment - no publicId found');
//         console.error('Attachment object:', attachment);
//         return;
//       }

//       // Show loading message
//       const loadingMessage = message.loading('Downloading file...', 0);

//       try {
//         // Download using publicId
//         const blob = await cashRequestAPI.downloadAttachment(attachment.publicId);
        
//         // Create download link
//         const url = window.URL.createObjectURL(blob);
//         const link = document.createElement('a');
//         link.href = url;
        
//         // Use the original filename from attachment
//         link.download = attachment.name || attachment.publicId;
        
//         document.body.appendChild(link);
//         link.click();
//         document.body.removeChild(link);
//         window.URL.revokeObjectURL(url);

//         loadingMessage();
//         message.success(`Downloaded ${attachment.name || 'file'}`);
//       } catch (downloadError) {
//         loadingMessage();
//         throw downloadError;
//       }

//     } catch (error) {
//       console.error('Error downloading attachment:', error);
//       message.error(`Failed to download: ${error.response?.data?.message || error.message}`);
//     }
//   };

//   const handleViewAttachment = async (attachment) => {
//     try {
//       if (!attachment) {
//         message.error('No attachment data available');
//         return;
//       }

//       setFileViewerLoading(true);
//       setFileViewerVisible(true);

//       const token = localStorage.getItem('token');
//       if (!token) {
//         message.error('Authentication required. Please login again.');
//         setFileViewerVisible(false);
//         setFileViewerLoading(false);
//         return;
//       }

//       const publicId = attachment.publicId || attachment.fileName || attachment.name;
      
//       if (!publicId) {
//         message.error('Unable to locate file. Invalid attachment data.');
//         setFileViewerVisible(false);
//         setFileViewerLoading(false);
//         return;
//       }

//       const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
//       const downloadUrl = `${apiUrl}/files/download/${encodeURIComponent(publicId)}`;
      
//       const response = await fetch(downloadUrl, {
//         method: 'GET',
//         headers: {
//           'Authorization': `Bearer ${token}`,
//           'Content-Type': 'application/json'
//         },
//       });

//       if (!response.ok) {
//         throw new Error(`Failed to fetch file: ${response.status}`);
//       }

//       const isImage = attachment.mimetype?.startsWith('image/') || 
//                      /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(attachment.name);
//       const isPDF = attachment.mimetype === 'application/pdf' || 
//                    /\.pdf$/i.test(attachment.name);

//       if (isPDF) {
//         const viewUrl = `${apiUrl}/files/view/${encodeURIComponent(publicId)}`;
        
//         setViewingFile({
//           name: attachment.name,
//           url: viewUrl,
//           type: 'pdf',
//           mimetype: attachment.mimetype,
//           isDirectUrl: true,
//           authHeaders: {
//             'Authorization': `Bearer ${token}`
//           }
//         });
//       } else {
//         const blob = await response.blob();
//         const fileUrl = window.URL.createObjectURL(blob);
        
//         setViewingFile({
//           name: attachment.name,
//           url: fileUrl,
//           type: isImage ? 'image' : 'other',
//           mimetype: attachment.mimetype
//         });
//       }
      
//       setFileViewerLoading(false);
//     } catch (error) {
//       console.error('Error viewing attachment:', error);
//       message.error(`Failed to view attachment: ${error.message}`);
//       setFileViewerVisible(false);
//       setFileViewerLoading(false);
//     }
//   };

//   const handleRefresh = async () => {
//     await Promise.all([fetchCashRequests(), fetchJustifications()]);
//     message.success('Data refreshed successfully');
//   };

//   // ============ TABLE COLUMNS ============

//   const columns = [
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
//           <Tag color="blue" size="small">
//             {record.employee?.department || 'N/A'}
//           </Tag>
//         </div>
//       ),
//       width: 180
//     },
//     {
//       title: 'Request Details',
//       key: 'requestDetails',
//       render: (_, record) => (
//         <div>
//           <Text strong>XAF {(record.amountRequested || 0).toLocaleString()}</Text>
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
//       width: 220
//     },
//     {
//       title: 'Priority & Dates',
//       key: 'priorityDate',
//       render: (_, record) => (
//         <div>
//           {getUrgencyTag(record.urgency)}
//           <br />
//           <Text type="secondary" style={{ fontSize: '11px' }}>
//             <CalendarOutlined /> Required: {record.requiredDate ? new Date(record.requiredDate).toLocaleDateString('en-GB') : 'N/A'}
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
//       title: 'Status',
//       dataIndex: 'status',
//       key: 'status',
//       render: (status, record) => (
//         <div>
//           {getStatusTag(status, record)}
//           {canUserApprove(record) && (
//             <div style={{ marginTop: 4 }}>
//               <Tag color="gold" size="small">Your Turn</Tag>
//             </div>
//           )}
//         </div>
//       ),
//       filters: [
//         { text: 'Pending Supervisor', value: 'pending_supervisor' },
//         { text: 'Pending Departmental Head', value: 'pending_departmental_head' },
//         { text: 'Pending Head of Business', value: 'pending_head_of_business' },
//         { text: 'Pending Finance', value: 'pending_finance' },
//         { text: 'Approved', value: 'approved' },
//         { text: 'Disbursed', value: 'disbursed' },
//         { text: 'Denied', value: 'denied' }
//       ],
//       onFilter: (value, record) => {
//         // For filtering, use the actual status from the request
//         const currentLevel = getCurrentApprovalLevel(record);
//         const expectedStatus = getExpectedStatus(currentLevel);
//         return expectedStatus === value;
//       },
//       width: 160
//     },
//     {
//       title: 'Progress',
//       key: 'progress',
//       render: (_, record) => {
//         const progress = getApprovalProgress(record);
//         let status = 'active';
//         if (record.status === 'denied') status = 'exception';
//         if (['approved', 'disbursed', 'completed'].includes(record.status)) status = 'success';
        
//         return (
//           <div style={{ width: 80 }}>
//             <Progress 
//               percent={progress} 
//               size="small" 
//               status={status}
//               showInfo={false}
//             />
//             <Text style={{ fontSize: '11px' }}>{progress}%</Text>
//           </div>
//         );
//       },
//       width: 100
//     },
//     {
//       title: 'Actions',
//       key: 'actions',
//       render: (_, record) => (
//         <Space size="small">
//           <Button 
//             size="small" 
//             icon={<EyeOutlined />}
//             onClick={() => handleViewDetails(record)}
//           >
//             View
//           </Button>
          
//           {canUserApprove(record) && (
//             <Button 
//               size="small" 
//               type="primary"
//               onClick={() => {
//                 setSelectedRequest(record);
//                 form.resetFields();
//                 setApprovalModalVisible(true);
//               }}
//             >
//               Review
//             </Button>
//           )}
//         </Space>
//       ),
//       width: 140,
//       fixed: 'right'
//     }
//   ];

//   const justificationColumns = [
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
//       title: 'Request Details',
//       key: 'details',
//       render: (_, record) => (
//         <div>
//           <Text strong>REQ-{record._id?.slice(-6).toUpperCase()}</Text>
//           <br />
//           <Text type="secondary" style={{ fontSize: '12px' }}>
//             Type: {record.requestType?.replace(/-/g, ' ').toUpperCase()}
//           </Text>
//         </div>
//       ),
//       width: 150
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
//           {getStatusTag(record.status, record)}
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
//       title: 'Actions',
//       key: 'actions',
//       render: (_, record) => (
//         <Space size="small">
//           <Button
//             size="small"
//             icon={<EyeOutlined />}
//             onClick={() => {
//               setSelectedJustification(record);
//               setDetailsModalVisible(true);
//             }}
//           >
//             View
//           </Button>

//           {canUserApproveJustification(record) && (
//             <Button
//               size="small"
//               type="primary"
//               icon={<AuditOutlined />}
//               onClick={() => {
//                 setSelectedJustification(record);
//                 form.resetFields();
//                 setJustificationDecisionModalVisible(true);
//               }}
//             >
//               Review
//             </Button>
//           )}
//         </Space>
//       ),
//       width: 140,
//       fixed: 'right'
//     }
//   ];

//   // ============ RENDER ============

//   if (loading && requests.length === 0 && justifications.length === 0) {
//     return (
//       <div style={{ padding: '24px', textAlign: 'center' }}>
//         <Spin size="large" />
//         <div style={{ marginTop: '16px' }}>Loading approvals...</div>
//       </div>
//     );
//   }

//   return (
//     <div style={{ padding: '24px' }}>
//       <Card>
//         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
//           <Title level={2} style={{ margin: 0 }}>
//             <TeamOutlined /> Cash Request Approvals
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

//         {/* Stats Cards */}
//         <Row gutter={16} style={{ marginBottom: '24px' }}>
//           <Col span={5}>
//             <Statistic
//               title="Pending Your Approval"
//               value={stats.pending}
//               prefix={<ClockCircleOutlined />}
//               valueStyle={{ color: '#faad14' }}
//             />
//           </Col>
//           <Col span={5}>
//             <Statistic
//               title="Approved by You"
//               value={stats.approved}
//               prefix={<CheckCircleOutlined />}
//               valueStyle={{ color: '#52c41a' }}
//             />
//           </Col>
//           <Col span={5}>
//             <Statistic
//               title="Rejected by You"
//               value={stats.rejected}
//               prefix={<CloseCircleOutlined />}
//               valueStyle={{ color: '#f5222d' }}
//             />
//           </Col>
//           <Col span={5}>
//             <Statistic
//               title="Pending Justifications"
//               value={stats.justificationsPending}
//               prefix={<FileTextOutlined />}
//               valueStyle={{ color: '#722ed1' }}
//             />
//           </Col>
//           <Col span={4}>
//             <Statistic
//               title="Total Assigned"
//               value={stats.total}
//               prefix={<AuditOutlined />}
//               valueStyle={{ color: '#1890ff' }}
//             />
//           </Col>
//         </Row>

//         {(stats.pending > 0 || stats.justificationsPending > 0) && (
//           <Alert
//             message={`${stats.pending} cash request(s) and ${stats.justificationsPending} justification(s) require your approval`}
//             type="warning"
//             showIcon
//             style={{ marginBottom: '16px' }}
//           />
//         )}

//         <Tabs activeKey={activeTab} onChange={setActiveTab}>
//           <TabPane 
//             tab={
//               <Badge count={getTabCount('pending', 'request')} offset={[10, 0]}>
//                 <span>Pending Approval</span>
//               </Badge>
//             } 
//             key="pending"
//           >
//             <Table
//               columns={columns}
//               dataSource={getFilteredRequests()}
//               loading={loading}
//               rowKey="_id"
//               pagination={{
//                 pageSize: 10,
//                 showSizeChanger: true,
//                 showQuickJumper: true,
//                 showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} requests`
//               }}
//               scroll={{ x: 1400 }}
//               size="small"
//               rowClassName={(record) => {
//                 let className = 'cash-request-row';
//                 if (canUserApprove(record)) {
//                   className += ' pending-approval-row';
//                 }
//                 if (record.urgency === 'high') {
//                   className += ' high-urgency-row';
//                 }
//                 return className;
//               }}
//             />
//           </TabPane>
          
//           <TabPane 
//             tab={
//               <Badge count={getTabCount('approved', 'request')} offset={[10, 0]}>
//                 <span>Approved</span>
//               </Badge>
//             } 
//             key="approved"
//           >
//             <Table
//               columns={columns}
//               dataSource={getFilteredRequests()}
//               loading={loading}
//               rowKey="_id"
//               pagination={{
//                 pageSize: 10,
//                 showSizeChanger: true,
//                 showQuickJumper: true,
//                 showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} requests`
//               }}
//               scroll={{ x: 1400 }}
//               size="small"
//             />
//           </TabPane>
          
//           <TabPane 
//             tab={
//               <Badge count={getTabCount('rejected', 'request')} offset={[10, 0]}>
//                 <span>Rejected</span>
//               </Badge>
//             } 
//             key="rejected"
//           >
//             <Table
//               columns={columns}
//               dataSource={getFilteredRequests()}
//               loading={loading}
//               rowKey="_id"
//               pagination={{
//                 pageSize: 10,
//                 showSizeChanger: true,
//                 showQuickJumper: true,
//                 showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} requests`
//               }}
//               scroll={{ x: 1400 }}
//               size="small"
//             />
//           </TabPane>

//           <TabPane 
//             tab={
//               <Badge count={stats.justificationsPending} offset={[10, 0]}>
//                 <span><FileTextOutlined /> Justification Approvals</span>
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
//                   showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} justifications`
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
//         </Tabs>
//       </Card>

//       {/* Cash Request Approval Modal */}
//       <Modal
//         title={
//           <Space>
//             <AuditOutlined />
//             Cash Request Approval Decision
//           </Space>
//         }
//         open={approvalModalVisible}
//         onCancel={() => {
//           setApprovalModalVisible(false);
//           setSelectedRequest(null);
//           form.resetFields();
//         }}
//         footer={null}
//         width={800}
//       >
//         {selectedRequest && (
//           <div>
//             <Alert
//               message="Review Required"
//               description="Please review and make a decision on this cash request."
//               type="info"
//               showIcon
//               style={{ marginBottom: '16px' }}
//             />

//             <Descriptions bordered column={2} size="small" style={{ marginBottom: '20px' }}>
//               <Descriptions.Item label="Employee">
//                 <Text strong>{selectedRequest.employee?.fullName}</Text>
//               </Descriptions.Item>
//               <Descriptions.Item label="Department">
//                 <Tag color="blue">{selectedRequest.employee?.department}</Tag>
//               </Descriptions.Item>
//               <Descriptions.Item label="Request Type">
//                 {selectedRequest.requestType?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
//               </Descriptions.Item>
//               <Descriptions.Item label="Urgency">
//                 {getUrgencyTag(selectedRequest.urgency)}
//               </Descriptions.Item>
//               <Descriptions.Item label="Amount Requested">
//                 <Text strong>XAF {(selectedRequest.amountRequested || 0).toLocaleString()}</Text>
//               </Descriptions.Item>
//               <Descriptions.Item label="Required Date">
//                 {selectedRequest.requiredDate ? new Date(selectedRequest.requiredDate).toLocaleDateString('en-GB') : 'N/A'}
//               </Descriptions.Item>
//               <Descriptions.Item label="Purpose" span={2}>
//                 {selectedRequest.purpose}
//               </Descriptions.Item>
//               {selectedRequest.businessJustification && (
//                 <Descriptions.Item label="Business Justification" span={2}>
//                   {selectedRequest.businessJustification}
//                 </Descriptions.Item>
//               )}
//             </Descriptions>

//             {/* Attachments */}
//             {selectedRequest.attachments && selectedRequest.attachments.length > 0 && (
//               <Card size="small" title="Attachments" style={{ marginBottom: '20px' }}>
//                 <Space wrap>
//                   {selectedRequest.attachments.map((attachment, index) => (
//                     <Space key={index}>
//                       <Button 
//                         icon={<EyeOutlined />}
//                         size="small"
//                         onClick={() => handleViewAttachment(attachment)}
//                       >
//                         View
//                       </Button>
//                       <Button 
//                         icon={<FileOutlined />}
//                         size="small"
//                         onClick={() => handleDownloadAttachment(attachment)}
//                       >
//                         Download {attachment.name || attachment.publicId}
//                       </Button>
//                     </Space>
//                   ))}
//                 </Space>
//               </Card>
//             )}

//             <Form
//               form={form}
//               layout="vertical"
//               onFinish={handleApprovalDecision}
//             >
//               <Form.Item
//                 name="decision"
//                 label="Your Decision"
//                 rules={[{ required: true, message: 'Please make a decision' }]}
//               >
//                 <Radio.Group>
//                   <Radio.Button value="approved" style={{ color: '#52c41a' }}>
//                     <CheckCircleOutlined /> Approve Request
//                   </Radio.Button>
//                   <Radio.Button value="rejected" style={{ color: '#f5222d' }}>
//                     <CloseCircleOutlined /> Reject Request
//                   </Radio.Button>
//                 </Radio.Group>
//               </Form.Item>

//               <Form.Item
//                 name="comments"
//                 label="Comments"
//                 rules={[{ required: true, message: 'Please provide comments for your decision' }]}
//               >
//                 <TextArea 
//                   rows={4} 
//                   placeholder="Explain your decision (required for audit trail)..."
//                   showCount
//                   maxLength={500}
//                 />
//               </Form.Item>

//               <Form.Item>
//                 <Space>
//                   <Button onClick={() => {
//                     setApprovalModalVisible(false);
//                     setSelectedRequest(null);
//                     form.resetFields();
//                   }}>
//                     Cancel
//                   </Button>
//                   <Button 
//                     type="primary" 
//                     htmlType="submit"
//                     loading={loading}
//                   >
//                     Submit Decision
//                   </Button>
//                 </Space>
//               </Form.Item>
//             </Form>
//           </div>
//         )}
//       </Modal>

//       {/* Justification Decision Modal */}
//       <Modal
//         title={
//           <Space>
//             <AuditOutlined />
//             Justification Decision
//           </Space>
//         }
//         open={justificationDecisionModalVisible}
//         onCancel={() => {
//           setJustificationDecisionModalVisible(false);
//           setSelectedJustification(null);
//           form.resetFields();
//         }}
//         footer={null}
//         width={900}
//       >
//         {selectedJustification && (
//           <div>
//             <Alert
//               message="Review Justification"
//               description="Please review and make a decision on this cash justification."
//               type="info"
//               showIcon
//               style={{ marginBottom: '16px' }}
//             />

//             {/* Status with Level Info */}
//             <Card size="small" style={{ marginBottom: '16px', backgroundColor: '#f0f2f5' }}>
//               <Row gutter={16}>
//                 <Col span={12}>
//                   <Text strong>Current Status:</Text>
//                   <div style={{ marginTop: '8px' }}>
//                     {getStatusTag(selectedJustification.status, selectedJustification)}
//                   </div>
//                 </Col>
//                 <Col span={12}>
//                   <Text strong>Approval Progress:</Text>
//                   <div style={{ marginTop: '8px' }}>
//                     {selectedJustification.justificationApprovalChain && (
//                       <Progress 
//                         percent={Math.round((selectedJustification.justificationApprovalChain.filter(s => s.status === 'approved').length / selectedJustification.justificationApprovalChain.length) * 100)} 
//                         status={selectedJustification.status === 'completed' ? 'success' : 'active'}
//                       />
//                     )}
//                   </div>
//                 </Col>
//               </Row>
//             </Card>

//             <Descriptions bordered column={2} size="small" style={{ marginBottom: '20px' }}>
//               <Descriptions.Item label="Employee">
//                 <Text strong>{selectedJustification.employee?.fullName}</Text>
//               </Descriptions.Item>
//               <Descriptions.Item label="Request ID">
//                 <Text code copyable>REQ-{selectedJustification._id?.slice(-6).toUpperCase()}</Text>
//               </Descriptions.Item>
//               <Descriptions.Item label="Amount Disbursed">
//                 <Text strong>XAF {(selectedJustification.disbursementDetails?.amount || 0).toLocaleString()}</Text>
//               </Descriptions.Item>
//               <Descriptions.Item label="Justification Date">
//                 {selectedJustification.justification?.justificationDate 
//                   ? new Date(selectedJustification.justification.justificationDate).toLocaleDateString('en-GB')
//                   : 'N/A'
//                 }
//               </Descriptions.Item>
//             </Descriptions>

//             {/* Justification Financial Details */}
//             <Card size="small" title="Financial Summary" style={{ marginBottom: '20px' }}>
//               <Row gutter={16}>
//                 <Col span={8}>
//                   <Statistic
//                     title="Amount Spent"
//                     value={selectedJustification.justification?.amountSpent || 0}
//                     prefix="XAF "
//                     precision={0}
//                     valueStyle={{ color: '#f5222d' }}
//                   />
//                 </Col>
//                 <Col span={8}>
//                   <Statistic
//                     title="Balance Returned"
//                     value={selectedJustification.justification?.balanceReturned || 0}
//                     prefix="XAF "
//                     precision={0}
//                     valueStyle={{ color: '#52c41a' }}
//                   />
//                 </Col>
//                 <Col span={8}>
//                   <Statistic
//                     title="Total"
//                     value={(selectedJustification.justification?.amountSpent || 0) + (selectedJustification.justification?.balanceReturned || 0)}
//                     prefix="XAF "
//                     precision={0}
//                   />
//                 </Col>
//               </Row>
//             </Card>

//             {/* Spending Details */}
//             <Card size="small" title="Spending Details" style={{ marginBottom: '20px' }}>
//               <Text type="secondary">Details:</Text>
//               <Paragraph style={{ marginTop: '8px', fontStyle: 'italic', backgroundColor: '#f5f5f5', padding: '12px', borderRadius: '4px' }}>
//                 {selectedJustification.justification?.details || 'No details provided'}
//               </Paragraph>
//             </Card>

//             {/* Justification Approval Chain Timeline */}
//             {selectedJustification.justificationApprovalChain && selectedJustification.justificationApprovalChain.length > 0 && (
//               <Card size="small" title="Approval Chain Progress" style={{ marginBottom: '20px' }}>
//                 <Timeline>
//                   {selectedJustification.justificationApprovalChain.map((step, index) => {
//                     let color = 'gray';
//                     let icon = <ClockCircleOutlined />;
                    
//                     if (step.status === 'approved') {
//                       color = 'green';
//                       icon = <CheckCircleOutlined />;
//                     } else if (step.status === 'rejected') {
//                       color = 'red';
//                       icon = <CloseCircleOutlined />;
//                     }

//                     const isCurrentLevel = extractJustificationLevel(selectedJustification.status) === step.level;
//                     const isUserStep = step.approver?.email?.toLowerCase() === user?.email?.toLowerCase();

//                     return (
//                       <Timeline.Item key={index} color={color} dot={icon}>
//                         <div>
//                           <Text strong>Level {step.level}: {step.approver?.name || 'Unknown'}</Text>
//                           {isCurrentLevel && <Tag color="gold" size="small" style={{marginLeft: 8}}>Current Level</Tag>}
//                           {isUserStep && step.status === 'pending' && <Tag color="red" size="small" style={{marginLeft: 8}}>Your Turn</Tag>}
//                           <br />
//                           <Text type="secondary">{step.approver?.role} - {step.approver?.email}</Text>
//                           <br />
//                           {step.status === 'pending' && (
//                             <Tag color={isCurrentLevel ? "gold" : "orange"}>
//                               {isCurrentLevel ? "Awaiting Action" : "Pending"}
//                             </Tag>
//                           )}
//                           {step.status === 'approved' && (
//                             <>
//                               <Tag color="green">Approved</Tag>
//                               {step.actionDate && (
//                                 <Text type="secondary">
//                                   {new Date(step.actionDate).toLocaleDateString('en-GB')} 
//                                   {step.actionTime && ` at ${step.actionTime}`}
//                                 </Text>
//                               )}
//                               {step.comments && (
//                                 <div style={{ marginTop: 4 }}>
//                                   <Text italic>"{step.comments}"</Text>
//                                 </div>
//                               )}
//                             </>
//                           )}
//                           {step.status === 'rejected' && (
//                             <>
//                               <Tag color="red">Rejected</Tag>
//                               {step.actionDate && (
//                                 <Text type="secondary">
//                                   {new Date(step.actionDate).toLocaleDateString('en-GB')}
//                                   {step.actionTime && ` at ${step.actionTime}`}
//                                 </Text>
//                               )}
//                               {step.comments && (
//                                 <div style={{ marginTop: 4, color: '#ff4d4f' }}>
//                                   <Text>Reason: "{step.comments}"</Text>
//                                 </div>
//                               )}
//                             </>
//                           )}
//                         </div>
//                       </Timeline.Item>
//                     );
//                   })}
//                 </Timeline>
//               </Card>
//             )}

//             {/* Supporting Documents */}
//             {selectedJustification.justification?.documents && selectedJustification.justification.documents.length > 0 && (
//               <Card size="small" title={`Supporting Documents (${selectedJustification.justification.documents.length})`} style={{ marginBottom: '20px' }}>
//                 <Space wrap>
//                   {selectedJustification.justification.documents.map((attachment, index) => (
//                     <Button 
//                       icon={<FileOutlined />}
//                       size="small"
//                       onClick={() => handleDownloadAttachment(attachment)}
//                     >
//                       Download {attachment.name || attachment.publicId}
//                     </Button>
//                   ))}
//                 </Space>
//               </Card>
//             )}

//             {/* Decision Form */}
//             <Form
//               form={form}
//               layout="vertical"
//               onFinish={handleJustificationDecision}
//             >
//               <Form.Item
//                 name="decision"
//                 label="Your Decision"
//                 rules={[{ required: true, message: 'Please make a decision' }]}
//               >
//                 <Radio.Group>
//                   <Radio.Button value="approved" style={{ color: '#52c41a' }}>
//                     <CheckCircleOutlined /> Approve Justification
//                   </Radio.Button>
//                   <Radio.Button value="rejected" style={{ color: '#f5222d' }}>
//                     <CloseCircleOutlined /> Reject Justification
//                   </Radio.Button>
//                 </Radio.Group>
//               </Form.Item>

//               <Form.Item
//                 name="comments"
//                 label="Comments"
//                 rules={[{ required: true, message: 'Please provide comments for your decision' }]}
//               >
//                 <TextArea
//                   rows={4}
//                   placeholder="Explain your decision (required for audit trail)..."
//                   showCount
//                   maxLength={500}
//                 />
//               </Form.Item>

//               <Form.Item>
//                 <Space>
//                   <Button onClick={() => {
//                     setJustificationDecisionModalVisible(false);
//                     setSelectedJustification(null);
//                     form.resetFields();
//                   }}>
//                     Cancel
//                   </Button>
//                   <Button
//                     type="primary"
//                     htmlType="submit"
//                     loading={loading}
//                   >
//                     Submit Decision
//                   </Button>
//                 </Space>
//               </Form.Item>
//             </Form>
//           </div>
//         )}
//       </Modal>

//       {/* Details Modal */}
//       <Modal
//         title={
//           <Space>
//             <DollarOutlined />
//             {selectedRequest && !isJustificationStatus(selectedRequest.status) ? 'Cash Request Details & Approval History' : 'Justification Details'}
//           </Space>
//         }
//         open={detailsModalVisible}
//         onCancel={() => {
//           setDetailsModalVisible(false);
//           setSelectedRequest(null);
//           setSelectedJustification(null);
//         }}
//         footer={null}
//         width={900}
//       >
//         {(selectedRequest || selectedJustification) && (
//           <div>
//             {selectedRequest && !isJustificationStatus(selectedRequest.status) ? (
//               // Cash Request Details
//               <>
//                 <Descriptions bordered column={2} size="small" style={{ marginBottom: '20px' }}>
//                   <Descriptions.Item label="Request ID">
//                     <Text code copyable>REQ-{selectedRequest._id?.slice(-6).toUpperCase()}</Text>
//                   </Descriptions.Item>
//                   <Descriptions.Item label="Status">
//                     {getStatusTag(selectedRequest.status, selectedRequest)}
//                   </Descriptions.Item>
//                   <Descriptions.Item label="Employee">
//                     <Text strong>{selectedRequest.employee?.fullName}</Text>
//                   </Descriptions.Item>
//                   <Descriptions.Item label="Department">
//                     <Tag color="blue">{selectedRequest.employee?.department}</Tag>
//                   </Descriptions.Item>
//                   <Descriptions.Item label="Amount Requested">
//                     <Text strong>XAF {(selectedRequest.amountRequested || 0).toLocaleString()}</Text>
//                   </Descriptions.Item>
//                   <Descriptions.Item label="Request Type">
//                     {selectedRequest.requestType?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
//                   </Descriptions.Item>
//                   <Descriptions.Item label="Urgency">
//                     {getUrgencyTag(selectedRequest.urgency)}
//                   </Descriptions.Item>
//                   <Descriptions.Item label="Required Date">
//                     {selectedRequest.requiredDate ? new Date(selectedRequest.requiredDate).toLocaleDateString('en-GB') : 'N/A'}
//                   </Descriptions.Item>
//                   <Descriptions.Item label="Purpose" span={2}>
//                     {selectedRequest.purpose}
//                   </Descriptions.Item>
//                   {selectedRequest.businessJustification && (
//                     <Descriptions.Item label="Business Justification" span={2}>
//                       {selectedRequest.businessJustification}
//                     </Descriptions.Item>
//                   )}
//                 </Descriptions>

//                 {/* Attachments */}
//                 {selectedRequest.attachments && selectedRequest.attachments.length > 0 && (
//                   <Card size="small" title="Attached Files" style={{ marginBottom: '20px' }}>
//                     <Space wrap>
//                       {selectedRequest.attachments.map((attachment, index) => (
//                         <Button 
//                           key={index}
//                           icon={<FileOutlined />}
//                           onClick={() => handleDownloadAttachment(selectedRequest._id, attachment)}
//                         >
//                           {attachment.name || attachment.fileName}
//                         </Button>
//                       ))}
//                     </Space>
//                   </Card>
//                 )}

//                 {/* Approval Chain */}
//                 {selectedRequest.approvalChain && selectedRequest.approvalChain.length > 0 && (
//                   <>
//                     <Title level={4}>
//                       <HistoryOutlined /> Approval Chain Progress
//                     </Title>
//                     <Timeline>
//                       {selectedRequest.approvalChain.map((step, index) => {
//                         let color = 'gray';
//                         let icon = <ClockCircleOutlined />;
                        
//                         if (step.status === 'approved') {
//                           color = 'green';
//                           icon = <CheckCircleOutlined />;
//                         } else if (step.status === 'rejected') {
//                           color = 'red';
//                           icon = <CloseCircleOutlined />;
//                         }

//                         const isCurrentStep = step.status === 'pending';

//                         return (
//                           <Timeline.Item key={index} color={color} dot={icon}>
//                             <div>
//                               <Text strong>Level {step.level}: {step.approver?.name || 'Unknown'}</Text>
//                               {isCurrentStep && <Tag color="gold" size="small" style={{marginLeft: 8}}>Current</Tag>}
//                               <br />
//                               <Text type="secondary">{step.approver?.role} - {step.approver?.email}</Text>
//                               <br />
//                               {step.status === 'pending' && (
//                                 <Tag color={isCurrentStep ? "gold" : "orange"}>
//                                   {isCurrentStep ? "Awaiting Action" : "Pending"}
//                                 </Tag>
//                               )}
//                               {step.status === 'approved' && (
//                                 <>
//                                   <Tag color="green">Approved</Tag>
//                                   {step.actionDate && (
//                                     <Text type="secondary">
//                                       {new Date(step.actionDate).toLocaleDateString('en-GB')} 
//                                       {step.actionTime && ` at ${step.actionTime}`}
//                                     </Text>
//                                   )}
//                                   {step.comments && (
//                                     <div style={{ marginTop: 4 }}>
//                                       <Text italic>"{step.comments}"</Text>
//                                     </div>
//                                   )}
//                                 </>
//                               )}
//                               {step.status === 'rejected' && (
//                                 <>
//                                   <Tag color="red">Rejected</Tag>
//                                   {step.actionDate && (
//                                     <Text type="secondary">
//                                       {new Date(step.actionDate).toLocaleDateString('en-GB')}
//                                       {step.actionTime && ` at ${step.actionTime}`}
//                                     </Text>
//                                   )}
//                                   {step.comments && (
//                                     <div style={{ marginTop: 4, color: '#ff4d4f' }}>
//                                       <Text>Reason: "{step.comments}"</Text>
//                                     </div>
//                                   )}
//                                 </>
//                               )}
//                             </div>
//                           </Timeline.Item>
//                         );
//                       })}
//                     </Timeline>

//                     {/* Current Status Information */}
//                     <Card size="small" title="Current Status" style={{ marginTop: '16px' }}>
//                       <Row gutter={16}>
//                         <Col span={12}>
//                           <Text strong>Overall Status: </Text>
//                           {getStatusTag(selectedRequest.status, selectedRequest)}
//                         </Col>
//                         <Col span={12}>
//                           <Text strong>Progress: </Text>
//                           <Progress 
//                             percent={getApprovalProgress(selectedRequest)} 
//                             size="small" 
//                             status={selectedRequest.status === 'denied' ? 'exception' : 'active'}
//                           />
//                         </Col>
//                       </Row>
                      
//                       {canUserApprove(selectedRequest) && (
//                         <Alert
//                           message="Action Required"
//                           description="This request is waiting for your approval decision."
//                           type="warning"
//                           showIcon
//                           style={{ marginTop: '12px' }}
//                           action={
//                             <Button 
//                               size="small" 
//                               type="primary"
//                               onClick={() => {
//                                 setDetailsModalVisible(false);
//                                 setApprovalModalVisible(true);
//                               }}
//                             >
//                               Make Decision
//                             </Button>
//                           }
//                         />
//                       )}
//                     </Card>

//                     {/* Financial Information */}
//                     {(selectedRequest.amountApproved || selectedRequest.disbursementDetails) && (
//                       <Card size="small" title="Financial Status" style={{ marginTop: '16px' }}>
//                         <Descriptions column={2} size="small">
//                           {selectedRequest.amountApproved && (
//                             <Descriptions.Item label="Amount Approved">
//                               XAF {selectedRequest.amountApproved.toLocaleString()}
//                             </Descriptions.Item>
//                           )}
//                           {selectedRequest.disbursementDetails && (
//                             <>
//                               <Descriptions.Item label="Disbursed Amount">
//                                 XAF {selectedRequest.disbursementDetails.amount?.toLocaleString()}
//                               </Descriptions.Item>
//                               <Descriptions.Item label="Disbursement Date">
//                                 {new Date(selectedRequest.disbursementDetails.date).toLocaleDateString('en-GB')}
//                               </Descriptions.Item>
//                             </>
//                           )}
//                         </Descriptions>
//                       </Card>
//                     )}

//                     {/* Justification Information */}
//                     {selectedRequest.justification && (
//                       <Card size="small" title="Justification Details" style={{ marginTop: '16px' }}>
//                         <Descriptions column={2} size="small">
//                           <Descriptions.Item label="Amount Spent">
//                             XAF {selectedRequest.justification.amountSpent?.toLocaleString()}
//                           </Descriptions.Item>
//                           <Descriptions.Item label="Balance Returned">
//                             XAF {selectedRequest.justification.balanceReturned?.toLocaleString()}
//                           </Descriptions.Item>
//                           <Descriptions.Item label="Justification Date">
//                             {new Date(selectedRequest.justification.justificationDate).toLocaleDateString('en-GB')}
//                           </Descriptions.Item>
//                           <Descriptions.Item label="Details" span={2}>
//                             {selectedRequest.justification.details}
//                           </Descriptions.Item>
//                         </Descriptions>
                        
//                         {selectedRequest.justification.documents && selectedRequest.justification.documents.length > 0 && (
//                           <div style={{ marginTop: '12px' }}>
//                             <Text strong>Supporting Documents:</Text>
//                             <div style={{ marginTop: '8px' }}>
//                               <Space wrap>
//                                 {selectedRequest.justification.documents.map((doc, index) => (
//                                   <Button 
//                                     key={index}
//                                     icon={<FileOutlined />}
//                                     size="small"
//                                     onClick={() => handleDownloadAttachment(selectedRequest._id, doc)}
//                                   >
//                                     {doc.name || doc.fileName}
//                                   </Button>
//                                 ))}
//                               </Space>
//                             </div>
//                           </div>
//                         )}
//                       </Card>
//                     )}
//                   </>
//                 )}
//               </>
//             ) : (
//               // Justification Details (when viewing from justification tab)
//               <>
//                 <Alert
//                   message="Justification Review"
//                   description="This is a justification submission for review."
//                   type="info"
//                   showIcon
//                   style={{ marginBottom: '16px' }}
//                 />

//                 <Descriptions bordered column={2} size="small" style={{ marginBottom: '20px' }}>
//                   <Descriptions.Item label="Employee">
//                     <Text strong>{(selectedJustification || selectedRequest)?.employee?.fullName}</Text>
//                   </Descriptions.Item>
//                   <Descriptions.Item label="Request ID">
//                     <Text code copyable>REQ-{(selectedJustification || selectedRequest)?._id?.slice(-6).toUpperCase()}</Text>
//                   </Descriptions.Item>
//                   <Descriptions.Item label="Amount Disbursed">
//                     <Text strong>XAF {((selectedJustification || selectedRequest)?.disbursementDetails?.amount || 0).toLocaleString()}</Text>
//                   </Descriptions.Item>
//                   <Descriptions.Item label="Justification Date">
//                     {(selectedJustification || selectedRequest)?.justification?.justificationDate 
//                       ? new Date((selectedJustification || selectedRequest).justification.justificationDate).toLocaleDateString('en-GB')
//                       : 'N/A'
//                     }
//                   </Descriptions.Item>
//                 </Descriptions>

//                 <Card size="small" title="Financial Summary" style={{ marginBottom: '20px' }}>
//                   <Row gutter={16}>
//                     <Col span={8}>
//                       <Statistic
//                         title="Amount Spent"
//                         value={(selectedJustification || selectedRequest)?.justification?.amountSpent || 0}
//                         prefix="XAF "
//                         precision={0}
//                         valueStyle={{ color: '#f5222d' }}
//                       />
//                     </Col>
//                     <Col span={8}>
//                       <Statistic
//                         title="Balance Returned"
//                         value={(selectedJustification || selectedRequest)?.justification?.balanceReturned || 0}
//                         prefix="XAF "
//                         precision={0}
//                         valueStyle={{ color: '#52c41a' }}
//                       />
//                     </Col>
//                     <Col span={8}>
//                       <Statistic
//                         title="Total"
//                         value={((selectedJustification || selectedRequest)?.justification?.amountSpent || 0) + ((selectedJustification || selectedRequest)?.justification?.balanceReturned || 0)}
//                         prefix="XAF "
//                         precision={0}
//                       />
//                     </Col>
//                   </Row>
//                 </Card>

//                 <Card size="small" title="Spending Details" style={{ marginBottom: '20px' }}>
//                   <Text type="secondary">Details:</Text>
//                   <Paragraph style={{ marginTop: '8px', fontStyle: 'italic', backgroundColor: '#f5f5f5', padding: '12px', borderRadius: '4px' }}>
//                     {(selectedJustification || selectedRequest)?.justification?.details || 'No details provided'}
//                   </Paragraph>
//                 </Card>

//                 {(selectedJustification || selectedRequest)?.justification?.documents && (selectedJustification || selectedRequest).justification.documents.length > 0 && (
//                   <Card size="small" title={`Supporting Documents (${(selectedJustification || selectedRequest).justification.documents.length})`} style={{ marginBottom: '20px' }}>
//                     <Space wrap>
//                       {(selectedJustification || selectedRequest).justification.documents.map((doc, index) => (
//                         <Button
//                           key={index}
//                           icon={<FileOutlined />}
//                           size="small"
//                           onClick={() => handleDownloadAttachment((selectedJustification || selectedRequest)._id, doc)}
//                         >
//                           {doc.name}
//                         </Button>
//                       ))}
//                     </Space>
//                   </Card>
//                 )}
//               </>
//             )}
//           </div>
//         )}
//       </Modal>

//       {/* File Viewer Modal */}
//       <Modal
//         title={viewingFile?.name || 'File Viewer'}
//         open={fileViewerVisible}
//         onCancel={() => {
//           setFileViewerVisible(false);
//           setViewingFile(null);
//           setFileViewerLoading(false);
//           if (viewingFile?.url && !viewingFile?.isDirectUrl) {
//             window.URL.revokeObjectURL(viewingFile.url);
//           }
//         }}
//         footer={[
//           <Button key="download" onClick={() => {
//             if (viewingFile?.url) {
//               const link = document.createElement('a');
//               link.href = viewingFile.url;
//               link.download = viewingFile.name || 'file';
//               document.body.appendChild(link);
//               link.click();
//               document.body.removeChild(link);
//               message.success('File downloaded successfully');
//             }
//           }}>
//             Download
//           </Button>,
//           <Button key="close" onClick={() => {
//             setFileViewerVisible(false);
//             setViewingFile(null);
//             setFileViewerLoading(false);
//             if (viewingFile?.url && !viewingFile?.isDirectUrl) {
//               window.URL.revokeObjectURL(viewingFile.url);
//             }
//           }}>
//             Close
//           </Button>
//         ]}
//         width="80%"
//         style={{ top: 20 }}
//         bodyStyle={{ padding: '20px', textAlign: 'center', minHeight: '60vh' }}
//       >
//         {fileViewerLoading ? (
//           <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
//             <Spin size="large" />
//             <div style={{ marginLeft: '16px' }}>Loading file...</div>
//           </div>
//         ) : viewingFile ? (
//           <div>
//             {viewingFile.type === 'image' ? (
//               <img 
//                 src={viewingFile.url} 
//                 alt={viewingFile.name}
//                 style={{ 
//                   maxWidth: '100%', 
//                   maxHeight: '70vh', 
//                   objectFit: 'contain',
//                   border: '1px solid #d9d9d9',
//                   borderRadius: '6px'
//                 }}
//               />
//             ) : viewingFile.type === 'pdf' ? (
//               <div>
//                 <PDFViewer 
//                   url={viewingFile.url}
//                   name={viewingFile.name}
//                   authHeaders={viewingFile.authHeaders}
//                 />
//                 <div style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
//                   If the PDF doesn't display correctly, please use the Download button below.
//                 </div>
//               </div>
//             ) : (
//               <div style={{ padding: '40px' }}>
//                 <Alert
//                   message="Preview not available"
//                   description={`File type "${viewingFile.mimetype}" cannot be previewed inline. Please download to view.`}
//                   type="info"
//                   showIcon
//                 />
//               </div>
//             )}
//           </div>
//         ) : null}
//       </Modal>

//       {/* Custom CSS for row styling */}
//       <style>{`
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
//         .high-urgency-row {
//           border-left: 3px solid #ff4d4f;
//         }
//         .high-urgency-row:hover {
//           background-color: #fff2f0 !important;
//         }
//       `}</style>
//     </div>
//   );
// };

// export default SupervisorCashApprovals;







