import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
  Card,
  Table,
  Button,
  Space,
  Typography,
  Tag,
  Alert,
  Row,
  Col,
  Statistic,
  Modal,
  Descriptions,
  Timeline,
  Input,
  Select,
  Tabs,
  Badge,
  Drawer,
  message,
  List,
  Tooltip
} from 'antd';
import {
  ShoppingCartOutlined,
  EyeOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ReloadOutlined,
  FileTextOutlined,
  SendOutlined,
  UserOutlined,
  DollarOutlined,
  CalendarOutlined,
  ExportOutlined,
  TeamOutlined,
  DownloadOutlined,
  FilePdfOutlined,
  FileImageOutlined,
  FileWordOutlined,
  FileExcelOutlined,
  FileUnknownOutlined,
  PaperClipOutlined
} from '@ant-design/icons';
import { purchaseRequisitionAPI } from '../../services/purchaseRequisitionAPI'; 

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const { TabPane } = Tabs;

const SupervisorPurchaseRequisitions = () => {
  const { user } = useSelector((state) => state.auth);
  const [requisitions, setRequisitions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRequisition, setSelectedRequisition] = useState(null);
  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('pending');
  const [decision, setDecision] = useState('');
  const [comments, setComments] = useState('');
  const [downloadingAttachment, setDownloadingAttachment] = useState(null);

  useEffect(() => {
    fetchRequisitions();
  }, []);

  const fetchRequisitions = async () => {
    setLoading(true);
    try {
      console.log('Fetching supervisor requisitions...');
      const response = await purchaseRequisitionAPI.getSupervisorRequisitions();
      
      if (response.success) {
        console.log('Fetched requisitions:', response.data);
        setRequisitions(response.data);
      } else {
        message.error('Failed to fetch requisitions');
        setRequisitions([]);
      }
    } catch (error) {
      console.error('Error fetching requisitions:', error);
      message.error('Failed to fetch requisitions: ' + (error.response?.data?.message || error.message));
      setRequisitions([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusTag = (status) => {
    const statusMap = {
      'pending_supervisor': { color: 'orange', text: 'Pending Your Approval', icon: <ClockCircleOutlined /> },
      'pending_supply_chain_review': { color: 'blue', text: 'Supply Chain Review', icon: <ShoppingCartOutlined /> },
      'supply_chain_approved': { color: 'purple', text: 'Supply Chain Approved', icon: <CheckCircleOutlined /> },
      'pending_finance': { color: 'gold', text: 'Finance Review', icon: <DollarOutlined /> },
      'approved': { color: 'green', text: 'Approved', icon: <CheckCircleOutlined /> },
      'rejected': { color: 'red', text: 'Rejected', icon: <CloseCircleOutlined /> },
      'in_procurement': { color: 'cyan', text: 'In Procurement', icon: <ShoppingCartOutlined /> },
      'delivered': { color: 'green', text: 'Delivered', icon: <CheckCircleOutlined /> }
    };

    const statusInfo = statusMap[status] || { color: 'default', text: status };
    return (
      <Tag color={statusInfo.color} icon={statusInfo.icon}>
        {statusInfo.text}
      </Tag>
    );
  };

  const getUrgencyTag = (urgency) => {
    const urgencyMap = {
      'Low': 'green',
      'Medium': 'orange',
      'High': 'red'
    };
    return <Tag color={urgencyMap[urgency] || 'default'}>{urgency}</Tag>;
  };

  const resetForm = () => {
    setDecision('');
    setComments('');
  };

  const handleRequisitionAction = async (requisitionId, action) => {
    setActionLoading(true);
    try {
      console.log(`Processing ${action} for requisition:`, requisitionId);
      
      const response = await purchaseRequisitionAPI.processSupervisorDecision(
        requisitionId, 
        action, 
        comments
      );
      
      if (response.success) {
        const actionText = action === 'approved' ? 'approved' : 'rejected';
        message.success(`Purchase requisition ${actionText} successfully!`);
        
        setDetailDrawerVisible(false);
        resetForm();
        await fetchRequisitions(); // Refresh the list
      } else {
        message.error(response.message || `Failed to ${action} requisition`);
      }
    } catch (error) {
      console.error(`Error ${action}ing requisition:`, error);
      message.error(`Failed to ${action} requisition: ` + (error.response?.data?.message || error.message));
    } finally {
      setActionLoading(false);
    }
  };

  const handleViewDetails = async (requisition) => {
    try {
      // Fetch full details of the requisition
      const response = await purchaseRequisitionAPI.getRequisition(requisition._id);
      if (response.success) {
        console.log('📎 Fetched requisition with attachments:', response.data.attachments);
        setSelectedRequisition(response.data);
        setDetailDrawerVisible(true);
        resetForm();
      } else {
        message.error('Failed to load requisition details');
      }
    } catch (error) {
      console.error('Error fetching requisition details:', error);
      message.error('Failed to load requisition details');
    }
  };

  // ✅ NEW: Get file icon based on mimetype
  const getFileIcon = (mimetype) => {
    if (!mimetype) return <FileUnknownOutlined />;
    
    if (mimetype.includes('pdf')) return <FilePdfOutlined style={{ color: '#ff4d4f' }} />;
    if (mimetype.includes('image')) return <FileImageOutlined style={{ color: '#52c41a' }} />;
    if (mimetype.includes('word') || mimetype.includes('document')) return <FileWordOutlined style={{ color: '#1890ff' }} />;
    if (mimetype.includes('excel') || mimetype.includes('spreadsheet')) return <FileExcelOutlined style={{ color: '#52c41a' }} />;
    
    return <FileUnknownOutlined />;
  };

  // ✅ NEW: Format file size
  const formatFileSize = (bytes) => {
    if (!bytes) return 'Unknown size';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // ✅ NEW: Check if file can be previewed
  const canPreviewFile = (mimetype) => {
    if (!mimetype) return false;
    return mimetype.includes('pdf') || mimetype.includes('image');
  };

  // ✅ NEW: Handle attachment download
  const handleDownloadAttachment = async (attachment) => {
    if (!selectedRequisition?._id || !attachment._id) {
      message.error('Invalid attachment information');
      return;
    }

    setDownloadingAttachment(attachment._id);

    try {
      const token = localStorage.getItem('token');
      const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

      console.log('📥 Downloading attachment:', {
        requisitionId: selectedRequisition._id,
        attachmentId: attachment._id,
        name: attachment.name
      });

      const response = await fetch(
        `${API_BASE_URL}/purchase-requisitions/${selectedRequisition._id}/attachments/${attachment._id}/download`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to download file');
      }

      // Get filename from Content-Disposition header or use attachment name
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = attachment.name || 'attachment';
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/i);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      // Get the blob
      const blob = await response.blob();

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up
      window.URL.revokeObjectURL(url);

      message.success(`Downloaded: ${filename}`);
    } catch (error) {
      console.error('❌ Download error:', error);
      message.error(error.message || 'Failed to download attachment');
    } finally {
      setDownloadingAttachment(null);
    }
  };

  // ✅ NEW: Handle attachment preview
  const handlePreviewAttachment = async (attachment) => {
    if (!selectedRequisition?._id || !attachment._id) {
      message.error('Invalid attachment information');
      return;
    }

    if (!canPreviewFile(attachment.mimetype)) {
      message.info('This file type cannot be previewed. Downloading instead...');
      handleDownloadAttachment(attachment);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

      console.log('👁️ Previewing attachment:', {
        requisitionId: selectedRequisition._id,
        attachmentId: attachment._id,
        name: attachment.name
      });

      // Open in new tab with token
      window.open(
        `${API_BASE_URL}/purchase-requisitions/${selectedRequisition._id}/attachments/${attachment._id}/preview?token=${token}`,
        '_blank'
      );
    } catch (error) {
      console.error('❌ Preview error:', error);
      message.error('Failed to preview attachment');
    }
  };

  // ✅ NEW: Render attachments section
  const renderAttachments = () => {
    if (!selectedRequisition?.attachments || selectedRequisition.attachments.length === 0) {
      return null;
    }

    return (
      <Card 
        size="small" 
        title={
          <Space>
            <PaperClipOutlined />
            Attachments ({selectedRequisition.attachments.length})
          </Space>
        } 
        style={{ marginBottom: '16px' }}
      >
        <List
          dataSource={selectedRequisition.attachments}
          renderItem={(attachment) => (
            <List.Item
              key={attachment._id}
              actions={[
                canPreviewFile(attachment.mimetype) && (
                  <Tooltip title="Preview">
                    <Button
                      size="small"
                      type="link"
                      icon={<EyeOutlined />}
                      onClick={() => handlePreviewAttachment(attachment)}
                    >
                      Preview
                    </Button>
                  </Tooltip>
                ),
                <Tooltip title="Download">
                  <Button
                    size="small"
                    type="link"
                    icon={<DownloadOutlined />}
                    loading={downloadingAttachment === attachment._id}
                    onClick={() => handleDownloadAttachment(attachment)}
                  >
                    Download
                  </Button>
                </Tooltip>
              ].filter(Boolean)}
            >
              <List.Item.Meta
                avatar={getFileIcon(attachment.mimetype)}
                title={
                  <Space>
                    <Text strong>{attachment.name}</Text>
                    {canPreviewFile(attachment.mimetype) && (
                      <Tag color="blue" size="small">Can Preview</Tag>
                    )}
                  </Space>
                }
                description={
                  <Space split="|">
                    <Text type="secondary">{formatFileSize(attachment.size)}</Text>
                    <Text type="secondary">
                      {new Date(attachment.uploadedAt).toLocaleDateString('en-GB')}
                    </Text>
                  </Space>
                }
              />
            </List.Item>
          )}
        />
      </Card>
    );
  };

  const getFilteredRequisitions = () => {
    switch (activeTab) {
      case 'pending':
        return requisitions.filter(r => r.status === 'pending_supervisor');
      case 'approved':
        return requisitions.filter(r => 
          ['pending_supply_chain_review', 'supply_chain_approved', 'pending_finance', 'approved', 'in_procurement', 'delivered'].includes(r.status)
        );
      case 'rejected':
        return requisitions.filter(r => r.status === 'rejected');
      default:
        return requisitions;
    }
  };

  const handleSubmitDecision = () => {
    if (!decision) {
      message.error('Please select your decision');
      return;
    }
    if (!comments || comments.trim().length < 10) {
      message.error('Please provide meaningful comments (at least 10 characters)');
      return;
    }

    Modal.confirm({
      title: `Confirm ${decision === 'approved' ? 'Approval' : 'Rejection'}`,
      content: `Are you sure you want to ${decision === 'approved' ? 'approve' : 'reject'} this purchase requisition?`,
      onOk: () => handleRequisitionAction(selectedRequisition._id, decision),
    });
  };

  const columns = [
    {
      title: 'Requisition Number',
      dataIndex: 'requisitionNumber',
      key: 'requisitionNumber',
      render: (number) => <Text code>{number}</Text>,
      width: 150
    },
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
      width: 200
    },
    {
      title: 'Requester',
      key: 'requester',
      render: (_, record) => (
        <div>
          <Text strong>{record.employee?.fullName}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: '12px' }}>{record.department}</Text>
        </div>
      ),
      width: 150
    },
    {
      title: 'Category',
      dataIndex: 'itemCategory',
      key: 'itemCategory',
      render: (category) => <Tag color="blue">{category}</Tag>,
      width: 130
    },
    {
      title: 'Items',
      key: 'itemCount',
      render: (_, record) => record.items?.length || 0,
      align: 'center',
      width: 70
    },
    {
      title: 'Budget (XAF)',
      dataIndex: 'budgetXAF',
      key: 'budgetXAF',
      render: (amount) => amount ? Number(amount).toLocaleString() : 'N/A',
      align: 'right',
      width: 120
    },
    {
      title: 'Urgency',
      dataIndex: 'urgency',
      key: 'urgency',
      render: (urgency) => getUrgencyTag(urgency),
      width: 100
    },
    {
      title: 'Submitted',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => new Date(date).toLocaleDateString('en-GB'),
      width: 100
    },
    {
      title: 'Expected',
      dataIndex: 'expectedDate',
      key: 'expectedDate',
      render: (date) => new Date(date).toLocaleDateString('en-GB'),
      width: 100
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => getStatusTag(status),
      width: 180
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button 
          size="small" 
          icon={<EyeOutlined />}
          onClick={() => handleViewDetails(record)}
        >
          Review
        </Button>
      ),
      width: 100
    }
  ];

  const filteredData = getFilteredRequisitions();
  const stats = {
    pending: requisitions.filter(r => r.status === 'pending_supervisor').length,
    approved: requisitions.filter(r => 
      ['pending_supply_chain_review', 'supply_chain_approved', 'pending_finance', 'approved', 'in_procurement', 'delivered'].includes(r.status)
    ).length,
    rejected: requisitions.filter(r => r.status === 'rejected').length,
    total: requisitions.length
  };

  const renderApprovalChain = (approvalChain) => {
    if (!approvalChain || approvalChain.length === 0) {
      return <Text type="secondary">No approval chain available</Text>;
    }

    return (
      <Timeline>
        {approvalChain.map((step, index) => {
          let color = 'gray';
          let icon = <ClockCircleOutlined />;

          if (step.status === 'approved') {
            color = 'green';
            icon = <CheckCircleOutlined />;
          } else if (step.status === 'rejected') {
            color = 'red';
            icon = <CloseCircleOutlined />;
          } else if (step.status === 'pending') {
            color = 'blue';
            icon = <ClockCircleOutlined />;
          }

          return (
            <Timeline.Item key={index} color={color} dot={icon}>
              <div>
                <Text strong>Level {step.level}: {step.approver?.name}</Text>
                <br />
                <Text type="secondary">{step.approver?.role} - {step.approver?.department}</Text>
                <br />
                {step.status === 'pending' && (
                  <Tag color="orange">Currently Reviewing</Tag>
                )}
                {step.status === 'approved' && (
                  <>
                    <Tag color="green">Approved</Tag>
                    {step.actionDate && (
                      <Text type="secondary"> on {new Date(step.actionDate).toLocaleDateString('en-GB')}</Text>
                    )}
                  </>
                )}
                {step.status === 'rejected' && (
                  <>
                    <Tag color="red">Rejected</Tag>
                    {step.actionDate && (
                      <Text type="secondary"> on {new Date(step.actionDate).toLocaleDateString('en-GB')}</Text>
                    )}
                  </>
                )}
                {step.comments && (
                  <div style={{ marginTop: 4 }}>
                    <Text italic>"{step.comments}"</Text>
                  </div>
                )}
              </div>
            </Timeline.Item>
          );
        })}
      </Timeline>
    );
  };

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <Title level={2} style={{ margin: 0 }}>
            <ShoppingCartOutlined /> Purchase Requisition Approvals
          </Title>
          <Space>
            <Button 
              icon={<ReloadOutlined />}
              onClick={fetchRequisitions}
              loading={loading}
            >
              Refresh
            </Button>
            <Button icon={<ExportOutlined />}>
              Export
            </Button>
          </Space>
        </div>

        {/* Statistics */}
        <Row gutter={16} style={{ marginBottom: '24px' }}>
          <Col span={6}>
            <Statistic
              title="Pending Approval"
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
              title="Rejected"
              value={stats.rejected}
              prefix={<CloseCircleOutlined />}
              valueStyle={{ color: '#f5222d' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="Total Reviewed"
              value={stats.total}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Col>
        </Row>

        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane 
            tab={
              <Badge count={stats.pending} size="small">
                <span><ClockCircleOutlined /> Pending Approval ({stats.pending})</span>
              </Badge>
            } 
            key="pending"
          >
            {filteredData.length === 0 ? (
              <Alert
                message="No Pending Approvals"
                description="There are no purchase requisitions waiting for your approval at the moment."
                type="info"
                showIcon
              />
            ) : (
              <Table
                columns={columns}
                dataSource={filteredData}
                rowKey="_id"
                loading={loading}
                pagination={{
                  pageSize: 10,
                  showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} requisitions`
                }}
                scroll={{ x: 'max-content' }}
              />
            )}
          </TabPane>

          <TabPane 
            tab={
              <span><CheckCircleOutlined /> Approved ({stats.approved})</span>
            } 
            key="approved"
          >
            <Table
              columns={columns}
              dataSource={filteredData}
              rowKey="_id"
              loading={loading}
              pagination={{
                pageSize: 10,
                showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} requisitions`
              }}
              scroll={{ x: 'max-content' }}
            />
          </TabPane>

          <TabPane 
            tab={
              <span><CloseCircleOutlined /> Rejected ({stats.rejected})</span>
            } 
            key="rejected"
          >
            <Table
              columns={columns}
              dataSource={filteredData}
              rowKey="_id"
              loading={loading}
              pagination={{
                pageSize: 10,
                showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} requisitions`
              }}
              scroll={{ x: 'max-content' }}
            />
          </TabPane>
        </Tabs>
      </Card>

      {/* Detail Drawer */}
      <Drawer
        title={
          <Space>
            <FileTextOutlined />
            Purchase Requisition Review
          </Space>
        }
        placement="right"
        width={900}
        open={detailDrawerVisible}
        onClose={() => {
          setDetailDrawerVisible(false);
          setSelectedRequisition(null);
          resetForm();
        }}
      >
        {selectedRequisition && (
          <div>
            {/* Requisition Information */}
            <Card size="small" title="Requisition Information" style={{ marginBottom: '16px' }}>
              <Descriptions column={2} size="small">
                <Descriptions.Item label="Requisition Number">
                  <Text code>{selectedRequisition.requisitionNumber}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Status">
                  {getStatusTag(selectedRequisition.status)}
                </Descriptions.Item>
                <Descriptions.Item label="Title">
                  {selectedRequisition.title}
                </Descriptions.Item>
                <Descriptions.Item label="Urgency">
                  {getUrgencyTag(selectedRequisition.urgency)}
                </Descriptions.Item>
                <Descriptions.Item label="Requester">
                  <div>
                    <UserOutlined /> {selectedRequisition.employee?.fullName}
                    <br />
                    <Text type="secondary">{selectedRequisition.employee?.email}</Text>
                    <br />
                    <Text type="secondary">{selectedRequisition.department}</Text>
                  </div>
                </Descriptions.Item>
                <Descriptions.Item label="Category">
                  <Tag color="blue">{selectedRequisition.itemCategory}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Budget (XAF)">
                  <DollarOutlined /> {selectedRequisition.budgetXAF ? Number(selectedRequisition.budgetXAF).toLocaleString() : 'N/A'}
                </Descriptions.Item>
                <Descriptions.Item label="Expected Date">
                  <CalendarOutlined /> {new Date(selectedRequisition.expectedDate).toLocaleDateString('en-GB')}
                </Descriptions.Item>
                <Descriptions.Item label="Delivery Location" span={2}>
                  {selectedRequisition.deliveryLocation}
                </Descriptions.Item>
              </Descriptions>
            </Card>

            {/* Items List */}
            <Card size="small" title={`Items Requested (${selectedRequisition.items?.length || 0})`} style={{ marginBottom: '16px' }}>
              <Table
                columns={[
                  { title: 'Description', dataIndex: 'description', key: 'description' },
                  { title: 'Quantity', dataIndex: 'quantity', key: 'quantity', width: 80, align: 'center' },
                  { title: 'Unit', dataIndex: 'measuringUnit', key: 'measuringUnit', width: 80, align: 'center' }
                ]}
                dataSource={selectedRequisition.items || []}
                pagination={false}
                size="small"
                rowKey={(record, index) => index}
              />
            </Card>

            {/* ✅ NEW: Attachments Section */}
            {renderAttachments()}

            {/* Business Justification */}
            <Card size="small" title="Business Justification" style={{ marginBottom: '16px' }}>
              <div style={{ marginBottom: '12px' }}>
                <Text strong>Purchase Justification:</Text>
                <br />
                <Text>{selectedRequisition.justificationOfPurchase}</Text>
              </div>
              {selectedRequisition.justificationOfPreferredSupplier && (
                <div>
                  <Text strong>Preferred Supplier Justification:</Text>
                  <br />
                  <Text>{selectedRequisition.justificationOfPreferredSupplier}</Text>
                </div>
              )}
            </Card>

            {/* Approval Progress */}
            <Card size="small" title="Approval Progress" style={{ marginBottom: '16px' }}>
              {renderApprovalChain(selectedRequisition.approvalChain)}
            </Card>

            {/* Action Section - Only show if user can take action */}
            {selectedRequisition.status === 'pending_supervisor' && (
              <Card size="small" title="Supervisor Decision" style={{ marginBottom: '16px' }}>
                <Alert
                  message="This requisition requires your approval"
                  description="Please review all items and justification before approving or rejecting this requisition."
                  type="warning"
                  showIcon
                  style={{ marginBottom: '16px' }}
                />

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <Text strong style={{ display: 'block', marginBottom: '8px' }}>Decision *</Text>
                    <Select 
                      placeholder="Select your decision" 
                      style={{ width: '100%' }}
                      value={decision}
                      onChange={setDecision}
                    >
                      <Option value="approved">
                        <CheckCircleOutlined style={{ color: '#52c41a' }} /> Approve Requisition
                      </Option>
                      <Option value="rejected">
                        <CloseCircleOutlined style={{ color: '#ff4d4f' }} /> Reject Requisition
                      </Option>
                    </Select>
                  </div>

                  <div>
                    <Text strong style={{ display: 'block', marginBottom: '8px' }}>Comments *</Text>
                    <TextArea 
                      rows={3} 
                      placeholder="Enter your approval/rejection comments... (minimum 10 characters)"
                      showCount
                      maxLength={500}
                      value={comments}
                      onChange={(e) => setComments(e.target.value)}
                    />
                  </div>

                  <Space>
                    <Button 
                      type="primary" 
                      loading={actionLoading}
                      icon={<SendOutlined />}
                      onClick={handleSubmitDecision}
                    >
                      Submit Decision
                    </Button>
                    <Button onClick={resetForm}>
                      Clear Form
                    </Button>
                  </Space>
                </div>
              </Card>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default SupervisorPurchaseRequisitions;










// import React, { useState, useEffect } from 'react';
// import { useSelector } from 'react-redux';
// import {
//   Card,
//   Table,
//   Button,
//   Space,
//   Typography,
//   Tag,
//   Alert,
//   Row,
//   Col,
//   Statistic,
//   Modal,
//   Descriptions,
//   Timeline,
//   Input,
//   Select,
//   Tabs,
//   Badge,
//   Drawer,
//   message
// } from 'antd';
// import {
//   ShoppingCartOutlined,
//   EyeOutlined,
//   ClockCircleOutlined,
//   CheckCircleOutlined,
//   CloseCircleOutlined,
//   ReloadOutlined,
//   FileTextOutlined,
//   SendOutlined,
//   UserOutlined,
//   DollarOutlined,
//   CalendarOutlined,
//   ExportOutlined,
//   TeamOutlined
// } from '@ant-design/icons';
// import { purchaseRequisitionAPI } from '../../services/purchaseRequisitionAPI'; 

// const { Title, Text } = Typography;
// const { TextArea } = Input;
// const { Option } = Select;
// const { TabPane } = Tabs;

// const SupervisorPurchaseRequisitions = () => {
//   const { user } = useSelector((state) => state.auth);
//   const [requisitions, setRequisitions] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [selectedRequisition, setSelectedRequisition] = useState(null);
//   const [detailDrawerVisible, setDetailDrawerVisible] = useState(false);
//   const [actionLoading, setActionLoading] = useState(false);
//   const [activeTab, setActiveTab] = useState('pending');
//   const [decision, setDecision] = useState('');
//   const [comments, setComments] = useState('');

//   useEffect(() => {
//     fetchRequisitions();
//   }, []);

//   const fetchRequisitions = async () => {
//     setLoading(true);
//     try {
//       console.log('Fetching supervisor requisitions...');
//       const response = await purchaseRequisitionAPI.getSupervisorRequisitions();
      
//       if (response.success) {
//         console.log('Fetched requisitions:', response.data);
//         setRequisitions(response.data);
//       } else {
//         message.error('Failed to fetch requisitions');
//         setRequisitions([]);
//       }
//     } catch (error) {
//       console.error('Error fetching requisitions:', error);
//       message.error('Failed to fetch requisitions: ' + (error.response?.data?.message || error.message));
//       setRequisitions([]);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const getStatusTag = (status) => {
//     const statusMap = {
//       'pending_supervisor': { color: 'orange', text: 'Pending Your Approval', icon: <ClockCircleOutlined /> },
//       'pending_supply_chain_review': { color: 'blue', text: 'Supply Chain Review', icon: <ShoppingCartOutlined /> },
//       'supply_chain_approved': { color: 'purple', text: 'Supply Chain Approved', icon: <CheckCircleOutlined /> },
//       'pending_finance': { color: 'gold', text: 'Finance Review', icon: <DollarOutlined /> },
//       'approved': { color: 'green', text: 'Approved', icon: <CheckCircleOutlined /> },
//       'rejected': { color: 'red', text: 'Rejected', icon: <CloseCircleOutlined /> },
//       'in_procurement': { color: 'cyan', text: 'In Procurement', icon: <ShoppingCartOutlined /> },
//       'delivered': { color: 'green', text: 'Delivered', icon: <CheckCircleOutlined /> }
//     };

//     const statusInfo = statusMap[status] || { color: 'default', text: status };
//     return (
//       <Tag color={statusInfo.color} icon={statusInfo.icon}>
//         {statusInfo.text}
//       </Tag>
//     );
//   };

//   const getUrgencyTag = (urgency) => {
//     const urgencyMap = {
//       'Low': 'green',
//       'Medium': 'orange',
//       'High': 'red'
//     };
//     return <Tag color={urgencyMap[urgency] || 'default'}>{urgency}</Tag>;
//   };

//   const resetForm = () => {
//     setDecision('');
//     setComments('');
//   };

//   const handleRequisitionAction = async (requisitionId, action) => {
//     setActionLoading(true);
//     try {
//       console.log(`Processing ${action} for requisition:`, requisitionId);
      
//       const response = await purchaseRequisitionAPI.processSupervisorDecision(
//         requisitionId, 
//         action, 
//         comments
//       );
      
//       if (response.success) {
//         const actionText = action === 'approved' ? 'approved' : 'rejected';
//         message.success(`Purchase requisition ${actionText} successfully!`);
        
//         setDetailDrawerVisible(false);
//         resetForm();
//         await fetchRequisitions(); // Refresh the list
//       } else {
//         message.error(response.message || `Failed to ${action} requisition`);
//       }
//     } catch (error) {
//       console.error(`Error ${action}ing requisition:`, error);
//       message.error(`Failed to ${action} requisition: ` + (error.response?.data?.message || error.message));
//     } finally {
//       setActionLoading(false);
//     }
//   };

//   const handleViewDetails = async (requisition) => {
//     try {
//       // Fetch full details of the requisition
//       const response = await purchaseRequisitionAPI.getRequisition(requisition._id);
//       if (response.success) {
//         setSelectedRequisition(response.data);
//         setDetailDrawerVisible(true);
//         resetForm();
//       } else {
//         message.error('Failed to load requisition details');
//       }
//     } catch (error) {
//       console.error('Error fetching requisition details:', error);
//       message.error('Failed to load requisition details');
//     }
//   };

//   const getFilteredRequisitions = () => {
//     switch (activeTab) {
//       case 'pending':
//         return requisitions.filter(r => r.status === 'pending_supervisor');
//       case 'approved':
//         return requisitions.filter(r => 
//           ['pending_supply_chain_review', 'supply_chain_approved', 'pending_finance', 'approved', 'in_procurement', 'delivered'].includes(r.status)
//         );
//       case 'rejected':
//         return requisitions.filter(r => r.status === 'rejected');
//       default:
//         return requisitions;
//     }
//   };

//   const handleSubmitDecision = () => {
//     if (!decision) {
//       message.error('Please select your decision');
//       return;
//     }
//     if (!comments || comments.trim().length < 10) {
//       message.error('Please provide meaningful comments (at least 10 characters)');
//       return;
//     }

//     Modal.confirm({
//       title: `Confirm ${decision === 'approved' ? 'Approval' : 'Rejection'}`,
//       content: `Are you sure you want to ${decision === 'approved' ? 'approve' : 'reject'} this purchase requisition?`,
//       onOk: () => handleRequisitionAction(selectedRequisition._id, decision),
//     });
//   };

//   const columns = [
//     {
//       title: 'Requisition Number',
//       dataIndex: 'requisitionNumber',
//       key: 'requisitionNumber',
//       render: (number) => <Text code>{number}</Text>,
//       width: 150
//     },
//     {
//       title: 'Title',
//       dataIndex: 'title',
//       key: 'title',
//       ellipsis: true,
//       width: 200
//     },
//     {
//       title: 'Requester',
//       key: 'requester',
//       render: (_, record) => (
//         <div>
//           <Text strong>{record.employee?.fullName}</Text>
//           <br />
//           <Text type="secondary" style={{ fontSize: '12px' }}>{record.department}</Text>
//         </div>
//       ),
//       width: 150
//     },
//     {
//       title: 'Category',
//       dataIndex: 'itemCategory',
//       key: 'itemCategory',
//       render: (category) => <Tag color="blue">{category}</Tag>,
//       width: 130
//     },
//     {
//       title: 'Items',
//       key: 'itemCount',
//       render: (_, record) => record.items?.length || 0,
//       align: 'center',
//       width: 70
//     },
//     {
//       title: 'Budget (XAF)',
//       dataIndex: 'budgetXAF',
//       key: 'budgetXAF',
//       render: (amount) => amount ? Number(amount).toLocaleString() : 'N/A',
//       align: 'right',
//       width: 120
//     },
//     {
//       title: 'Urgency',
//       dataIndex: 'urgency',
//       key: 'urgency',
//       render: (urgency) => getUrgencyTag(urgency),
//       width: 100
//     },
//     {
//       title: 'Submitted',
//       dataIndex: 'createdAt',
//       key: 'createdAt',
//       render: (date) => new Date(date).toLocaleDateString('en-GB'),
//       width: 100
//     },
//     {
//       title: 'Expected',
//       dataIndex: 'expectedDate',
//       key: 'expectedDate',
//       render: (date) => new Date(date).toLocaleDateString('en-GB'),
//       width: 100
//     },
//     {
//       title: 'Status',
//       dataIndex: 'status',
//       key: 'status',
//       render: (status) => getStatusTag(status),
//       width: 180
//     },
//     {
//       title: 'Actions',
//       key: 'actions',
//       render: (_, record) => (
//         <Button 
//           size="small" 
//           icon={<EyeOutlined />}
//           onClick={() => handleViewDetails(record)}
//         >
//           Review
//         </Button>
//       ),
//       width: 100
//     }
//   ];

//   const filteredData = getFilteredRequisitions();
//   const stats = {
//     pending: requisitions.filter(r => r.status === 'pending_supervisor').length,
//     approved: requisitions.filter(r => 
//       ['pending_supply_chain_review', 'supply_chain_approved', 'pending_finance', 'approved', 'in_procurement', 'delivered'].includes(r.status)
//     ).length,
//     rejected: requisitions.filter(r => r.status === 'rejected').length,
//     total: requisitions.length
//   };

//   const renderApprovalChain = (approvalChain) => {
//     if (!approvalChain || approvalChain.length === 0) {
//       return <Text type="secondary">No approval chain available</Text>;
//     }

//     return (
//       <Timeline>
//         {approvalChain.map((step, index) => {
//           let color = 'gray';
//           let icon = <ClockCircleOutlined />;

//           if (step.status === 'approved') {
//             color = 'green';
//             icon = <CheckCircleOutlined />;
//           } else if (step.status === 'rejected') {
//             color = 'red';
//             icon = <CloseCircleOutlined />;
//           } else if (step.status === 'pending') {
//             color = 'blue';
//             icon = <ClockCircleOutlined />;
//           }

//           return (
//             <Timeline.Item key={index} color={color} dot={icon}>
//               <div>
//                 <Text strong>Level {step.level}: {step.approver?.name}</Text>
//                 <br />
//                 <Text type="secondary">{step.approver?.role} - {step.approver?.department}</Text>
//                 <br />
//                 {step.status === 'pending' && (
//                   <Tag color="orange">Currently Reviewing</Tag>
//                 )}
//                 {step.status === 'approved' && (
//                   <>
//                     <Tag color="green">Approved</Tag>
//                     {step.actionDate && (
//                       <Text type="secondary"> on {new Date(step.actionDate).toLocaleDateString('en-GB')}</Text>
//                     )}
//                   </>
//                 )}
//                 {step.status === 'rejected' && (
//                   <>
//                     <Tag color="red">Rejected</Tag>
//                     {step.actionDate && (
//                       <Text type="secondary"> on {new Date(step.actionDate).toLocaleDateString('en-GB')}</Text>
//                     )}
//                   </>
//                 )}
//                 {step.comments && (
//                   <div style={{ marginTop: 4 }}>
//                     <Text italic>"{step.comments}"</Text>
//                   </div>
//                 )}
//               </div>
//             </Timeline.Item>
//           );
//         })}
//       </Timeline>
//     );
//   };

//   return (
//     <div style={{ padding: '24px' }}>
//       <Card>
//         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
//           <Title level={2} style={{ margin: 0 }}>
//             <ShoppingCartOutlined /> Purchase Requisition Approvals
//           </Title>
//           <Space>
//             <Button 
//               icon={<ReloadOutlined />}
//               onClick={fetchRequisitions}
//               loading={loading}
//             >
//               Refresh
//             </Button>
//             <Button icon={<ExportOutlined />}>
//               Export
//             </Button>
//           </Space>
//         </div>

//         {/* Statistics */}
//         <Row gutter={16} style={{ marginBottom: '24px' }}>
//           <Col span={6}>
//             <Statistic
//               title="Pending Approval"
//               value={stats.pending}
//               prefix={<ClockCircleOutlined />}
//               valueStyle={{ color: '#faad14' }}
//             />
//           </Col>
//           <Col span={6}>
//             <Statistic
//               title="Approved by You"
//               value={stats.approved}
//               prefix={<CheckCircleOutlined />}
//               valueStyle={{ color: '#52c41a' }}
//             />
//           </Col>
//           <Col span={6}>
//             <Statistic
//               title="Rejected"
//               value={stats.rejected}
//               prefix={<CloseCircleOutlined />}
//               valueStyle={{ color: '#f5222d' }}
//             />
//           </Col>
//           <Col span={6}>
//             <Statistic
//               title="Total Reviewed"
//               value={stats.total}
//               prefix={<FileTextOutlined />}
//               valueStyle={{ color: '#1890ff' }}
//             />
//           </Col>
//         </Row>

//         <Tabs activeKey={activeTab} onChange={setActiveTab}>
//           <TabPane 
//             tab={
//               <Badge count={stats.pending} size="small">
//                 <span><ClockCircleOutlined /> Pending Approval ({stats.pending})</span>
//               </Badge>
//             } 
//             key="pending"
//           >
//             {filteredData.length === 0 ? (
//               <Alert
//                 message="No Pending Approvals"
//                 description="There are no purchase requisitions waiting for your approval at the moment."
//                 type="info"
//                 showIcon
//               />
//             ) : (
//               <Table
//                 columns={columns}
//                 dataSource={filteredData}
//                 rowKey="_id"
//                 loading={loading}
//                 pagination={{
//                   pageSize: 10,
//                   showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} requisitions`
//                 }}
//                 scroll={{ x: 'max-content' }}
//               />
//             )}
//           </TabPane>

//           <TabPane 
//             tab={
//               <span><CheckCircleOutlined /> Approved ({stats.approved})</span>
//             } 
//             key="approved"
//           >
//             <Table
//               columns={columns}
//               dataSource={filteredData}
//               rowKey="_id"
//               loading={loading}
//               pagination={{
//                 pageSize: 10,
//                 showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} requisitions`
//               }}
//               scroll={{ x: 'max-content' }}
//             />
//           </TabPane>

//           <TabPane 
//             tab={
//               <span><CloseCircleOutlined /> Rejected ({stats.rejected})</span>
//             } 
//             key="rejected"
//           >
//             <Table
//               columns={columns}
//               dataSource={filteredData}
//               rowKey="_id"
//               loading={loading}
//               pagination={{
//                 pageSize: 10,
//                 showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} requisitions`
//               }}
//               scroll={{ x: 'max-content' }}
//             />
//           </TabPane>
//         </Tabs>
//       </Card>

//       {/* Detail Drawer */}
//       <Drawer
//         title={
//           <Space>
//             <FileTextOutlined />
//             Purchase Requisition Review
//           </Space>
//         }
//         placement="right"
//         width={900}
//         open={detailDrawerVisible}
//         onClose={() => {
//           setDetailDrawerVisible(false);
//           setSelectedRequisition(null);
//           resetForm();
//         }}
//       >
//         {selectedRequisition && (
//           <div>
//             {/* Requisition Information */}
//             <Card size="small" title="Requisition Information" style={{ marginBottom: '16px' }}>
//               <Descriptions column={2} size="small">
//                 <Descriptions.Item label="Requisition Number">
//                   <Text code>{selectedRequisition.requisitionNumber}</Text>
//                 </Descriptions.Item>
//                 <Descriptions.Item label="Status">
//                   {getStatusTag(selectedRequisition.status)}
//                 </Descriptions.Item>
//                 <Descriptions.Item label="Title">
//                   {selectedRequisition.title}
//                 </Descriptions.Item>
//                 <Descriptions.Item label="Urgency">
//                   {getUrgencyTag(selectedRequisition.urgency)}
//                 </Descriptions.Item>
//                 <Descriptions.Item label="Requester">
//                   <div>
//                     <UserOutlined /> {selectedRequisition.employee?.fullName}
//                     <br />
//                     <Text type="secondary">{selectedRequisition.employee?.email}</Text>
//                     <br />
//                     <Text type="secondary">{selectedRequisition.department}</Text>
//                   </div>
//                 </Descriptions.Item>
//                 <Descriptions.Item label="Category">
//                   <Tag color="blue">{selectedRequisition.itemCategory}</Tag>
//                 </Descriptions.Item>
//                 <Descriptions.Item label="Budget (XAF)">
//                   <DollarOutlined /> {selectedRequisition.budgetXAF ? Number(selectedRequisition.budgetXAF).toLocaleString() : 'N/A'}
//                 </Descriptions.Item>
//                 <Descriptions.Item label="Expected Date">
//                   <CalendarOutlined /> {new Date(selectedRequisition.expectedDate).toLocaleDateString('en-GB')}
//                 </Descriptions.Item>
//                 <Descriptions.Item label="Delivery Location" span={2}>
//                   {selectedRequisition.deliveryLocation}
//                 </Descriptions.Item>
//               </Descriptions>
//             </Card>

//             {/* Items List */}
//             <Card size="small" title={`Items Requested (${selectedRequisition.items?.length || 0})`} style={{ marginBottom: '16px' }}>
//               <Table
//                 columns={[
//                   { title: 'Description', dataIndex: 'description', key: 'description' },
//                   { title: 'Quantity', dataIndex: 'quantity', key: 'quantity', width: 80, align: 'center' },
//                   { title: 'Unit', dataIndex: 'measuringUnit', key: 'measuringUnit', width: 80, align: 'center' }
//                 ]}
//                 dataSource={selectedRequisition.items || []}
//                 pagination={false}
//                 size="small"
//                 rowKey={(record, index) => index}
//               />
//             </Card>

//             {/* Business Justification */}
//             <Card size="small" title="Business Justification" style={{ marginBottom: '16px' }}>
//               <div style={{ marginBottom: '12px' }}>
//                 <Text strong>Purchase Justification:</Text>
//                 <br />
//                 <Text>{selectedRequisition.justificationOfPurchase}</Text>
//               </div>
//               {selectedRequisition.justificationOfPreferredSupplier && (
//                 <div>
//                   <Text strong>Preferred Supplier Justification:</Text>
//                   <br />
//                   <Text>{selectedRequisition.justificationOfPreferredSupplier}</Text>
//                 </div>
//               )}
//             </Card>

//             {/* Approval Progress */}
//             <Card size="small" title="Approval Progress" style={{ marginBottom: '16px' }}>
//               {renderApprovalChain(selectedRequisition.approvalChain)}
//             </Card>

//             {/* Action Section - Only show if user can take action */}
//             {selectedRequisition.status === 'pending_supervisor' && (
//               <Card size="small" title="Supervisor Decision" style={{ marginBottom: '16px' }}>
//                 <Alert
//                   message="This requisition requires your approval"
//                   description="Please review all items and justification before approving or rejecting this requisition."
//                   type="warning"
//                   showIcon
//                   style={{ marginBottom: '16px' }}
//                 />

//                 <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
//                   <div>
//                     <Text strong style={{ display: 'block', marginBottom: '8px' }}>Decision *</Text>
//                     <Select 
//                       placeholder="Select your decision" 
//                       style={{ width: '100%' }}
//                       value={decision}
//                       onChange={setDecision}
//                     >
//                       <Option value="approved">
//                         <CheckCircleOutlined style={{ color: '#52c41a' }} /> Approve Requisition
//                       </Option>
//                       <Option value="rejected">
//                         <CloseCircleOutlined style={{ color: '#ff4d4f' }} /> Reject Requisition
//                       </Option>
//                     </Select>
//                   </div>

//                   <div>
//                     <Text strong style={{ display: 'block', marginBottom: '8px' }}>Comments *</Text>
//                     <TextArea 
//                       rows={3} 
//                       placeholder="Enter your approval/rejection comments... (minimum 10 characters)"
//                       showCount
//                       maxLength={500}
//                       value={comments}
//                       onChange={(e) => setComments(e.target.value)}
//                     />
//                   </div>

//                   <Space>
//                     <Button 
//                       type="primary" 
//                       loading={actionLoading}
//                       icon={<SendOutlined />}
//                       onClick={handleSubmitDecision}
//                     >
//                       Submit Decision
//                     </Button>
//                     <Button onClick={resetForm}>
//                       Clear Form
//                     </Button>
//                   </Space>
//                 </div>
//               </Card>
//             )}
//           </div>
//         )}
//       </Drawer>
//     </div>
//   );
// };

// export default SupervisorPurchaseRequisitions;



