import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
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
  Progress,
  message,
  Spin,
  List,
  Tooltip,
  Form,
  Input,
  Divider,
  Upload,
  Select
} from 'antd';
import {
  PlusOutlined,
  ShoppingCartOutlined,
  EyeOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  EditOutlined,
  ReloadOutlined,
  FileTextOutlined,
  DownloadOutlined,
  FileOutlined,
  PaperClipOutlined,
  DollarOutlined,
  UploadOutlined,
  StopOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { purchaseRequisitionAPI } from '../../services/purchaseRequisitionAPI';
import { itemAPI } from '../../services/itemAPI';
import api from '../../services/api';

const { TextArea } = Input;
const { Option } = Select;

const { Title, Text } = Typography;

const EmployeePurchaseRequisitions = ({ onCreateNew }) => {
  // State for database items
  const [databaseItems, setDatabaseItems] = useState([]);


  // Fetch database items on mount
  useEffect(() => {
    const fetchDatabaseItems = async () => {
      try {
        const response = await itemAPI.getActiveItems();
        if (response.success && Array.isArray(response.data)) {
          setDatabaseItems(response.data);
        } else {
          setDatabaseItems([]);
        }
      } catch (err) {
        setDatabaseItems([]);
      }
    };
    fetchDatabaseItems();
  }, []);
  const navigate = useNavigate();
  const [requisitions, setRequisitions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRequisition, setSelectedRequisition] = useState(null);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [acknowledgmentModalVisible, setAcknowledgmentModalVisible] = useState(false);
  const [selectedDisbursement, setSelectedDisbursement] = useState(null);
  const [acknowledgmentForm] = Form.useForm();

  // ✅ NEW: Resubmit modal states
  const [resubmitModalVisible, setResubmitModalVisible] = useState(false);
  const [resubmitForm] = Form.useForm();
  const [resubmitting, setResubmitting] = useState(false);
  const [rejectionHistory, setRejectionHistory] = useState(null);
  const [availableBudgetCodes, setAvailableBudgetCodes] = useState([]);
  const [editingItems, setEditingItems] = useState([]);
  const [editingItemsModal, setEditingItemsModal] = useState(false);
  const [attachmentFileList, setAttachmentFileList] = useState([]);
  const [removedAttachmentIds, setRemovedAttachmentIds] = useState([]);
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [cancellingRequisition, setCancellingRequisition] = useState(null);

  useEffect(() => {
    fetchRequisitions();
  }, []);

  const fetchRequisitions = async () => {
    setLoading(true);
    try {
      const response = await purchaseRequisitionAPI.getEmployeeRequisitions();
      if (response.success) {
        setRequisitions(response.data);
      } else {
        message.error('Failed to fetch requisitions');
      }
    } catch (error) {
      console.error('Error fetching requisitions:', error);
      message.error('Failed to fetch requisitions');
    } finally {
      setLoading(false);
    }
  };

  // Handle navigation to create new requisition
  const handleCreateNew = () => {
    if (onCreateNew) {
      // If parent component provides a handler, use it
      onCreateNew();
    } else {
      // Otherwise, navigate directly to the create page
      navigate('/purchase-requisitions/new');
    }
  };

  const getStatusTag = (status) => {
    const statusMap = {
      'draft': { color: 'default', text: 'Draft', icon: <EditOutlined /> },
      'pending_supervisor': { color: 'orange', text: 'Pending Supervisor', icon: <ClockCircleOutlined /> },
      'pending_finance_verification': { color: 'purple', text: 'Pending Finance', icon: <ClockCircleOutlined /> },
      'pending_supply_chain_review': { color: 'blue', text: 'Supply Chain Review', icon: <ClockCircleOutlined /> },
      'pending_buyer_assignment': { color: 'cyan', text: 'Buyer Assignment', icon: <ClockCircleOutlined /> },
      'pending_head_approval': { color: 'gold', text: 'Head Approval', icon: <ClockCircleOutlined /> },
      'supply_chain_approved': { color: 'cyan', text: 'Supply Chain Approved', icon: <CheckCircleOutlined /> },
      'supply_chain_rejected': { color: 'red', text: 'Supply Chain Rejected', icon: <CloseCircleOutlined /> },
      'approved': { color: 'green', text: 'Approved', icon: <CheckCircleOutlined /> },
      'rejected': { color: 'red', text: 'Rejected', icon: <CloseCircleOutlined /> },
      'in_procurement': { color: 'blue', text: 'In Procurement', icon: <ShoppingCartOutlined /> },
      'procurement_complete': { color: 'lime', text: 'Procurement Complete', icon: <CheckCircleOutlined /> },
      'delivered': { color: 'green', text: 'Delivered', icon: <CheckCircleOutlined /> },
      'partially_disbursed': { color: 'processing', text: 'Partially Disbursed', icon: <DollarOutlined /> },
      'fully_disbursed': { color: 'cyan', text: 'Fully Disbursed - Need Justification', icon: <FileTextOutlined /> }, // ✅ NEW
      'justification_pending_supervisor': { color: 'purple', text: 'Justification - Pending Supervisor', icon: <ClockCircleOutlined /> }, // ✅ NEW
      'justification_pending_finance': { color: 'geekblue', text: 'Justification - Pending Finance', icon: <ClockCircleOutlined /> }, // ✅ NEW
      'justification_rejected': { color: 'red', text: 'Justification Rejected', icon: <CloseCircleOutlined /> }, // ✅ NEW
      'completed': { color: 'green', text: 'Completed', icon: <CheckCircleOutlined /> }, 
      'pending_cancellation': { color: 'volcano', text: 'Cancellation Pending', icon: <StopOutlined /> },
      'cancelled': { color: 'error', text: 'Cancelled', icon: <CloseCircleOutlined /> },
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

  const getApprovalProgress = (requisition) => {
    const { status, approvalChain } = requisition;
    
    if (status === 'approved' || status === 'delivered' || status === 'procurement_complete') return 100;
    if (status === 'rejected' || status === 'supply_chain_rejected') return 0;
    
    if (!approvalChain || approvalChain.length === 0) return 0;
    
    const completedSteps = approvalChain.filter(step => step.status === 'approved').length;
    return Math.round((completedSteps / approvalChain.length) * 100);
  };


  // ✅ ALSO UPDATE: handleViewDetails to ensure fresh data
  const handleViewDetails = async (requisition) => {
    try {
      console.log('Viewing details for requisition:', requisition._id);
      
      // Always fetch fresh data from server
      const response = await purchaseRequisitionAPI.getRequisition(requisition._id);
      
      if (response.success) {
        console.log('Fresh requisition data:', response.data);
        setSelectedRequisition(response.data);
        setDetailsModalVisible(true);
      } else {
        message.error('Failed to fetch requisition details');
      }
    } catch (error) {
      console.error('Error fetching requisition details:', error);
      message.error('Failed to fetch requisition details');
    }
  };

// ...existing code...

  // ✅ NEW: Handle resubmit button click
  const handleResubmitClick = async (requisition) => {
    try {
      setSelectedRequisition(requisition);
      setEditingItems(requisition.items || []);
      setResubmitModalVisible(true);
      
      // Pre-fill form with current values
      resubmitForm.setFieldsValue({
        title: requisition.title,
        itemCategory: requisition.itemCategory,
        budgetXAF: requisition.budgetXAF,
        budgetCode: requisition.budgetCode?._id || requisition.budgetCode,
        urgency: requisition.urgency,
        deliveryLocation: requisition.deliveryLocation,
        expectedDate: requisition.expectedDate,
        justificationOfPurchase: requisition.justificationOfPurchase,
        justificationOfPreferredSupplier: requisition.justificationOfPreferredSupplier
      });

      // Initialize attachments
      const existingAttachments = requisition.attachments?.map((att, index) => ({
        uid: att._id || `existing-${index}`,
        name: att.name,
        status: 'done',
        url: att.url,
        existingId: att._id
      })) || [];
      setAttachmentFileList(existingAttachments);
      setRemovedAttachmentIds([]);

      // Fetch available budget codes
      try {
        const budgetResponse = await api.get('/budget-codes');
        if (budgetResponse.data.success) {
          setAvailableBudgetCodes(budgetResponse.data.data || []);
        }
      } catch (budgetError) {
        console.error('Failed to fetch budget codes:', budgetError);
      }

      // Fetch rejection history
      const historyResponse = await purchaseRequisitionAPI.getRejectionHistory(requisition._id);
      if (historyResponse.success) {
        setRejectionHistory(historyResponse.data);
      }
    } catch (error) {
      console.error('Error loading requisition for resubmit:', error);
      message.error('Failed to load requisition details');
    }
  };

  // ✅ NEW: Handle resubmit form submission
  const handleResubmit = async (values) => {
    if (!selectedRequisition) return;

    try {
      setResubmitting(true);
      
      // Create FormData for file uploads
      const formData = new FormData();
      
      // Add all form fields
      Object.keys(values).forEach(key => {
        if (values[key] !== undefined && values[key] !== null) {
          formData.append(key, values[key]);
        }
      });

      // Add items as JSON string
      formData.append('items', JSON.stringify(editingItems));

      // Add removed attachment IDs
      if (removedAttachmentIds.length > 0) {
        formData.append('removedAttachments', JSON.stringify(removedAttachmentIds));
      }

      // Add new attachment files
      attachmentFileList.forEach(file => {
        if (file.originFileObj) {
          formData.append('attachments', file.originFileObj);
        }
      });
      
      const response = await purchaseRequisitionAPI.resubmitRequisition(
        selectedRequisition._id,
        formData
      );

      if (response.success) {
        message.success('Requisition resubmitted successfully!');
        resubmitForm.resetFields();
        setResubmitModalVisible(false);
        setSelectedRequisition(null);
        setRejectionHistory(null);
        setEditingItems([]);
        setAttachmentFileList([]);
        setRemovedAttachmentIds([]);
        
        // Refresh requisitions list
        await fetchRequisitions();
      } else {
        message.error(response.message || 'Failed to resubmit requisition');
      }
    } catch (error) {
      console.error('Resubmit error:', error);
      message.error(error.response?.data?.message || 'Failed to resubmit requisition');
    } finally {
      setResubmitting(false);
    }
  };

  const handleAcknowledgeDisbursement = async (values) => {
    if (!selectedRequisition || !selectedDisbursement) return;

    try {
      setLoading(true);
      
      const response = await purchaseRequisitionAPI.acknowledgeDisbursement(
        selectedRequisition._id,
        selectedDisbursement._id,
        values
      );

      if (response.success) {
        message.success('Disbursement receipt acknowledged successfully!');
        setAcknowledgmentModalVisible(false);
        setSelectedDisbursement(null);
        acknowledgmentForm.resetFields();
        
        // ✅ REFRESH BOTH LIST AND MODAL
        await fetchRequisitions();
        
        // ✅ CRITICAL: Refresh the details modal
        const updatedResponse = await api.get(`/purchase-requisitions/${selectedRequisition._id}`);
        if (updatedResponse.data.success) {
          setSelectedRequisition(updatedResponse.data.data);
        }
      } else {
        message.error(response.message || 'Failed to acknowledge disbursement');
      }
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to acknowledge disbursement');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadAttachment = async (requisitionId, attachment) => {
    try {
      const response = await purchaseRequisitionAPI.downloadAttachment(requisitionId, attachment._id);
      if (!response.success) {
        message.error(response.message || 'Failed to download attachment');
      }
    } catch (error) {
      console.error('Error downloading attachment:', error);
      message.error('Failed to download attachment');
    }
  };

  const handlePreviewAttachment = async (requisitionId, attachment) => {
    try {
      const response = await purchaseRequisitionAPI.previewAttachment(requisitionId, attachment._id);
      if (!response.success) {
        message.error(response.message || 'Failed to preview attachment');
      }
    } catch (error) {
      console.error('Error previewing attachment:', error);
      message.error('Failed to preview attachment');
    }
  };

  const renderAttachments = (attachments, requisitionId) => {
    if (!attachments || attachments.length === 0) {
      return <Text type="secondary">No attachments</Text>;
    }

    return (
      <List
        size="small"
        dataSource={attachments}
        renderItem={(attachment) => (
          <List.Item
            actions={[
              <Tooltip title="Preview">
                <Button
                  size="small"
                  type="link"
                  icon={<EyeOutlined />}
                  onClick={() => handlePreviewAttachment(requisitionId, attachment)}
                  disabled={!attachment.canPreview}
                />
              </Tooltip>,
              <Tooltip title="Download">
                <Button
                  size="small"
                  type="link"
                  icon={<DownloadOutlined />}
                  onClick={() => handleDownloadAttachment(requisitionId, attachment)}
                />
              </Tooltip>
            ]}
          >
            <List.Item.Meta
              avatar={<FileOutlined style={{ color: '#1890ff' }} />}
              title={attachment.fileName || attachment.name || 'Unknown File'}
              description={
                <Space>
                  <Text type="secondary">
                    {attachment.fileSize ? 
                      `${(attachment.fileSize / 1024).toFixed(1)} KB` : 
                      attachment.size ? `${(attachment.size / 1024).toFixed(1)} KB` : 
                      'Unknown size'
                    }
                  </Text>
                  {attachment.fileType && (
                    <Tag size="small">{attachment.fileType.toUpperCase()}</Tag>
                  )}
                </Space>
              }
            />
          </List.Item>
        )}
      />
    );
  };

  
const NON_CANCELLABLE_STATUSES = [
  'draft', 'partially_disbursed', 'fully_disbursed', 'cancelled',
  'pending_cancellation', 'rejected', 'supply_chain_rejected', 'completed',
  'justification_pending_supervisor', 'justification_pending_finance',
  'justification_pending_supply_chain', 'justification_pending_head',
  'justification_rejected', 'justification_approved'
];

const handleCancelClick = (requisition) => {
  setCancellingRequisition(requisition);
  setCancelReason('');
  setCancelModalVisible(true);
};

const handleSubmitCancellation = async () => {
  if (!cancelReason.trim() || cancelReason.trim().length < 10) {
    message.error('Please provide a reason (minimum 10 characters)');
    return;
  }
  try {
    setCancelling(true);
    const response = await api.post(
      `/purchase-requisitions/${cancellingRequisition._id}/request-cancellation`,
      { reason: cancelReason.trim() }
    );
    if (response.data.success) {
      message.success('Cancellation request submitted. Awaiting approvals.');
      setCancelModalVisible(false);
      setCancellingRequisition(null);
      setCancelReason('');
      await fetchRequisitions();
    } else {
      message.error(response.data.message || 'Failed to submit cancellation request');
    }
  } catch (error) {
    message.error(error.response?.data?.message || 'Failed to submit cancellation request');
  } finally {
    setCancelling(false);
  }
};

  const columns = [
    {
      title: 'Requisition Number',
      dataIndex: 'requisitionNumber',
      key: 'requisitionNumber',
      render: (requisitionNumber) => <Text code>{requisitionNumber}</Text>,
      width: 180
    },
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
      width: 250
    },
    {
      title: 'Category',
      dataIndex: 'itemCategory',
      key: 'itemCategory',
      render: (category) => <Tag color="blue">{category}</Tag>,
      width: 150
    },
    {
      title: 'Items',
      dataIndex: 'items',
      key: 'items',
      render: (items) => items ? items.length : 0,
      align: 'center',
      width: 80
    },
    {
      title: 'Attachments',
      dataIndex: 'attachments',
      key: 'attachments',
      render: (attachments) => (
        <Space>
          <PaperClipOutlined />
          <Text>{attachments ? attachments.length : 0}</Text>
        </Space>
      ),
      align: 'center',
      width: 100
    },
    {
      title: 'Budget (XAF)',
      dataIndex: 'budgetXAF',
      key: 'budgetXAF',
      render: (amount) => amount ? amount.toLocaleString() : 'N/A',
      align: 'right',
      width: 120
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => getStatusTag(status),
      width: 150
    },
    {
      title: 'Urgency',
      dataIndex: 'urgency',
      key: 'urgency',
      render: (urgency) => getUrgencyTag(urgency),
      width: 100
    },
    {
      title: 'Progress',
      key: 'progress',
      render: (_, record) => {
        const progress = getApprovalProgress(record);
        return (
          <div style={{ width: 80 }}>
            <Progress 
              percent={progress} 
              size="small" 
              status={record.status.includes('rejected') ? 'exception' : 'active'}
              showInfo={false}
            />
            <Text style={{ fontSize: '11px' }}>{progress}%</Text>
          </div>
        );
      },
      width: 100
    },
    {
      title: 'Submitted',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => new Date(date).toLocaleDateString('en-GB'),
      width: 100,
      sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space direction="vertical" size="small">
          <Button 
            size="small" 
            icon={<EyeOutlined />}
            onClick={() => handleViewDetails(record)}
          >
            Details
          </Button>

          {/* ✅ NEW: Resubmit button for rejected requisitions */}
          {['rejected', 'supply_chain_rejected'].includes(record.status) && (
            <Button
              type="default"
              size="small"
              icon={<ReloadOutlined />}
              onClick={() => handleResubmitClick(record)}
              style={{ borderColor: '#faad14', color: '#faad14' }}
            >
              Resubmit
            </Button>
          )}
          {!NON_CANCELLABLE_STATUSES.includes(record.status) && (
            <Button
              size="small"
              danger
              icon={<StopOutlined />}
              onClick={() => handleCancelClick(record)}
              style={{ borderColor: '#ff4d4f', color: '#ff4d4f' }}
            >
              Cancel PR
            </Button>
          )}
        </Space>
      ),
      width: 120
    }
  ];

  const stats = {
    total: requisitions.length,
    pending: requisitions.filter(r => 
      r.status.includes('pending') || 
      r.status === 'fully_disbursed'
    ).length,
    approved: requisitions.filter(r => 
      ['approved', 'delivered', 'procurement_complete', 'completed'].includes(r.status)
    ).length,
    rejected: requisitions.filter(r => 
      r.status.includes('rejected')
    ).length,
    needsJustification: requisitions.filter(r => 
      r.status === 'fully_disbursed' || 
      r.status === 'justification_rejected'
    ).length
  };

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <Title level={2} style={{ margin: 0 }}>
            <ShoppingCartOutlined /> My Purchase Requisitions
          </Title>
          <Space>
            <Button 
              icon={<ReloadOutlined />}
              onClick={fetchRequisitions}
              loading={loading}
            >
              Refresh
            </Button>
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={handleCreateNew}
            >
              New Requisition
            </Button>
          </Space>
        </div>

        {/* Statistics */}
        <Row gutter={16} style={{ marginBottom: '24px' }}>
          <Col span={6}>
            <Statistic
              title="Total Requisitions"
              value={stats.total}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Col>
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
              title="Approved"
              value={stats.approved}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="Needs Justification"
              value={stats.needsJustification}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Col>
        </Row>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <Spin size="large" />
          </div>
        ) : requisitions.length === 0 ? (
          <Alert
            message="No Purchase Requisitions Found"
            description="You haven't submitted any purchase requisitions yet. Click 'New Requisition' to create your first one."
            type="info"
            showIcon
          />
        ) : (
          <Table
            columns={columns}
            dataSource={requisitions}
            rowKey="_id"
            loading={loading}
            pagination={{
              pageSize: 10,
              showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} requisitions`
            }}
            scroll={{ x: 'max-content' }}
          />
        )}
      </Card>

      {/* Detail Modal */}
      <Modal
        title={
          <Space>
            <FileTextOutlined />
            Purchase Requisition Details
          </Space>
        }
        open={detailsModalVisible}
        onCancel={() => {
          setDetailsModalVisible(false);
          setSelectedRequisition(null);
        }}
        footer={null}
        width={900}
      >
        {selectedRequisition && (
          <div>
            {/* Basic Information */}
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
                <Descriptions.Item label="Department">
                  {selectedRequisition.department}
                </Descriptions.Item>
                <Descriptions.Item label="Category">
                  <Tag color="blue">{selectedRequisition.itemCategory}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Budget (XAF)">
                  {selectedRequisition.budgetXAF ? selectedRequisition.budgetXAF.toLocaleString() : 'N/A'}
                </Descriptions.Item>
                <Descriptions.Item label="Expected Date">
                  {new Date(selectedRequisition.expectedDate).toLocaleDateString('en-GB')}
                </Descriptions.Item>
                <Descriptions.Item label="Delivery Location" span={2}>
                  {selectedRequisition.deliveryLocation}
                </Descriptions.Item>
              </Descriptions>
            </Card>

            {/* ✅ NEW: Disbursement History with Acknowledgment */}
            {selectedRequisition.disbursements && selectedRequisition.disbursements.length > 0 && (
              <Card 
                size="small" 
                title={
                  <Space>
                    <DollarOutlined />
                    Disbursement History ({selectedRequisition.disbursements.length})
                  </Space>
                }
                style={{ marginBottom: '16px' }}
              >
                <Timeline>
                  {selectedRequisition.disbursements.map((disbursement, index) => (
                    <Timeline.Item
                      key={index}
                      color={disbursement.acknowledged ? 'green' : 'blue'}
                      dot={disbursement.acknowledged ? <CheckCircleOutlined /> : <DollarOutlined />}
                    >
                      <Card size="small" style={{ marginBottom: '8px' }}>
                        <Space direction="vertical" style={{ width: '100%' }}>
                          <div>
                            <Text strong>Payment #{disbursement.disbursementNumber}</Text>
                            {disbursement.acknowledged && (
                              <Tag color="success" style={{ marginLeft: '8px' }}>
                                <CheckCircleOutlined /> Acknowledged
                              </Tag>
                            )}
                            {!disbursement.acknowledged && (
                              <Tag color="warning" style={{ marginLeft: '8px' }}>
                                <ClockCircleOutlined /> Awaiting Acknowledgment
                              </Tag>
                            )}
                          </div>
                          
                          <Descriptions column={2} size="small">
                            <Descriptions.Item label="Amount">
                              <Text strong style={{ color: '#1890ff' }}>
                                XAF {disbursement.amount?.toLocaleString()}
                              </Text>
                            </Descriptions.Item>
                            <Descriptions.Item label="Disbursed Date">
                              {new Date(disbursement.date).toLocaleString('en-GB')}
                            </Descriptions.Item>
                            
                            {disbursement.notes && (
                              <Descriptions.Item label="Disbursement Notes" span={2}>
                                <Text italic>"{disbursement.notes}"</Text>
                              </Descriptions.Item>
                            )}
                            
                            {disbursement.acknowledged && (
                              <>
                                <Descriptions.Item label="Acknowledged">
                                  {new Date(disbursement.acknowledgmentDate).toLocaleString('en-GB')}
                                </Descriptions.Item>
                                <Descriptions.Item label="Receipt Method">
                                  <Tag color="green">
                                    {disbursement.acknowledgmentMethod?.replace('_', ' ').toUpperCase()}
                                  </Tag>
                                </Descriptions.Item>
                                
                                {disbursement.acknowledgmentNotes && (
                                  <Descriptions.Item label="Acknowledgment Notes" span={2}>
                                    <Text italic type="success">"{disbursement.acknowledgmentNotes}"</Text>
                                  </Descriptions.Item>
                                )}
                              </>
                            )}
                          </Descriptions>

                          {/* ✅ Show acknowledge button only if not acknowledged */}
                          {!disbursement.acknowledged && (
                            <Button
                              type="primary"
                              size="small"
                              icon={<CheckCircleOutlined />}
                              onClick={() => {
                                setSelectedDisbursement(disbursement);
                                acknowledgmentForm.setFieldsValue({
                                  acknowledgmentMethod: 'cash',
                                  acknowledgmentNotes: ''
                                });
                                setAcknowledgmentModalVisible(true);
                              }}
                              style={{ backgroundColor: '#52c41a' }}
                            >
                              Acknowledge Receipt
                            </Button>
                          )}
                        </Space>
                      </Card>
                    </Timeline.Item>
                  ))}
                </Timeline>
                
              </Card>
            )}

            {selectedRequisition.cancellationRequest && (
              <Card
                size="small"
                title={
                  <Space>
                    <StopOutlined style={{ color: '#ff4d4f' }} />
                    <Text strong style={{ color: '#ff4d4f' }}>Cancellation Request</Text>
                  </Space>
                }
                style={{ marginBottom: '16px', borderColor: '#ff4d4f' }}
                headStyle={{ backgroundColor: '#fff2f0' }}
              >
                <Descriptions column={2} size="small" style={{ marginBottom: '12px' }}>
                  <Descriptions.Item label="Status">
                    {selectedRequisition.cancellationRequest.finalDecision === 'approved' ? (
                      <Tag color="error">Approved — PR Cancelled</Tag>
                    ) : selectedRequisition.cancellationRequest.finalDecision === 'rejected' ? (
                      <Tag color="warning">Rejected — PR Restored</Tag>
                    ) : (
                      <Tag color="volcano">Awaiting Approval</Tag>
                    )}
                  </Descriptions.Item>
                  <Descriptions.Item label="Requested On">
                    {new Date(selectedRequisition.cancellationRequest.requestedAt).toLocaleString('en-GB')}
                  </Descriptions.Item>
                  <Descriptions.Item label="Reason" span={2}>
                    <Text italic>"{selectedRequisition.cancellationRequest.reason}"</Text>
                  </Descriptions.Item>
                </Descriptions>

                <Divider style={{ margin: '8px 0' }} />

                <Text strong style={{ fontSize: '12px', color: '#666' }}>Approval Progress</Text>
                <Timeline style={{ marginTop: '12px' }}>
                  {selectedRequisition.cancellationRequest.approvalChain?.map((step, i) => (
                    <Timeline.Item
                      key={i}
                      color={step.status === 'approved' ? 'green' : step.status === 'rejected' ? 'red' : 'gray'}
                      dot={
                        step.status === 'approved' ? <CheckCircleOutlined /> :
                        step.status === 'rejected' ? <CloseCircleOutlined /> :
                        <ClockCircleOutlined />
                      }
                    >
                      <Text strong>Level {step.level}: {step.approver.name}</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: '12px' }}>{step.approver.role}</Text>
                      <br />
                      {step.status === 'approved' && <Tag color="green" style={{ marginTop: 4 }}>Approved</Tag>}
                      {step.status === 'rejected' && <Tag color="red" style={{ marginTop: 4 }}>Rejected</Tag>}
                      {step.status === 'pending' && <Tag color="default" style={{ marginTop: 4 }}>Pending</Tag>}
                      {step.comments && (
                        <div style={{ marginTop: 4 }}>
                          <Text type="secondary" italic>"{step.comments}"</Text>
                        </div>
                      )}
                      {step.actionDate && (
                        <Text type="secondary" style={{ fontSize: '11px' }}>
                          {new Date(step.actionDate).toLocaleDateString('en-GB')}
                        </Text>
                      )}
                    </Timeline.Item>
                  ))}
                </Timeline>
              </Card>
            )}

            {/* Items List */}
            <Card size="small" title={`Items (${selectedRequisition.items?.length || 0})`} style={{ marginBottom: '16px' }}>
              {selectedRequisition.items && selectedRequisition.items.length > 0 ? (
                <Table
                  columns={[
                    { title: 'Code', dataIndex: 'code', key: 'code', width: 100, render: code => <Text code>{code}</Text> },
                    { title: 'Description', dataIndex: 'description', key: 'description' },
                    { title: 'Quantity', dataIndex: 'quantity', key: 'quantity', width: 100, align: 'center' },
                    { title: 'Unit', dataIndex: 'measuringUnit', key: 'measuringUnit', width: 100, align: 'center' },
                    { 
                      title: 'Est. Price (XAF)', 
                      key: 'estimatedPrice', 
                      width: 120, 
                      align: 'right',
                      render: (_, record) => {
                        const total = (record.estimatedPrice || 0) * (record.quantity || 0);
                        return total > 0 ? total.toLocaleString() : 'TBD';
                      }
                    }
                  ]}
                  dataSource={selectedRequisition.items}
                  pagination={false}
                  size="small"
                  rowKey={(record, index) => index}
                />
              ) : (
                <Text type="secondary">No items specified</Text>
              )}
            </Card>

            {/* Attachments Section */}
            <Card 
              size="small" 
              title={
                <Space>
                  <PaperClipOutlined />
                  Attachments ({selectedRequisition.attachments?.length || 0})
                </Space>
              } 
              style={{ marginBottom: '16px' }}
            >
              {renderAttachments(selectedRequisition.attachments, selectedRequisition._id)}
            </Card>

            {/* Justification */}
            <Card size="small" title="Justification" style={{ marginBottom: '16px' }}>
              <Text>{selectedRequisition.justificationOfPurchase}</Text>
              {selectedRequisition.justificationOfPreferredSupplier && (
                <div style={{ marginTop: '8px' }}>
                  <Text strong>Preferred Supplier Justification:</Text>
                  <br />
                  <Text>{selectedRequisition.justificationOfPreferredSupplier}</Text>
                </div>
              )}
            </Card>

            {/* Finance Information */}
            {selectedRequisition.financeVerification && (
              <Card size="small" title="Finance Verification" style={{ marginBottom: '16px' }}>
                <Descriptions column={2} size="small">
                  <Descriptions.Item label="Decision">
                    <Tag color={selectedRequisition.financeVerification.decision === 'approved' ? 'green' : 'red'}>
                      {selectedRequisition.financeVerification.decision?.toUpperCase()}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Verified Date">
                    {new Date(selectedRequisition.financeVerification.verificationDate).toLocaleDateString('en-GB')}
                  </Descriptions.Item>
                  {selectedRequisition.financeVerification.assignedBudget && (
                    <Descriptions.Item label="Assigned Budget">
                      XAF {selectedRequisition.financeVerification.assignedBudget.toLocaleString()}
                    </Descriptions.Item>
                  )}
                  {selectedRequisition.financeVerification.budgetCode && (
                    <Descriptions.Item label="Budget Code">
                      <Tag color="gold">{selectedRequisition.financeVerification.budgetCode}</Tag>
                    </Descriptions.Item>
                  )}
                  {selectedRequisition.financeVerification.comments && (
                    <Descriptions.Item label="Comments" span={2}>
                      <Text italic>{selectedRequisition.financeVerification.comments}</Text>
                    </Descriptions.Item>
                  )}
                </Descriptions>
              </Card>
            )}

            {/* Supply Chain Information */}
            {selectedRequisition.supplyChainReview && (
              <Card size="small" title="Supply Chain Review" style={{ marginBottom: '16px' }}>
                <Descriptions column={2} size="small">
                  <Descriptions.Item label="Decision">
                    <Tag color={selectedRequisition.supplyChainReview.decision === 'approve' ? 'green' : 'red'}>
                      {selectedRequisition.supplyChainReview.decision?.toUpperCase()}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Review Date">
                    {new Date(selectedRequisition.supplyChainReview.decisionDate).toLocaleDateString('en-GB')}
                  </Descriptions.Item>
                  {selectedRequisition.supplyChainReview.estimatedCost && (
                    <Descriptions.Item label="Estimated Cost">
                      XAF {selectedRequisition.supplyChainReview.estimatedCost.toLocaleString()}
                    </Descriptions.Item>
                  )}
                  {selectedRequisition.supplyChainReview.purchaseTypeAssigned && (
                    <Descriptions.Item label="Purchase Type">
                      <Tag color="blue">{selectedRequisition.supplyChainReview.purchaseTypeAssigned.replace('_', ' ').toUpperCase()}</Tag>
                    </Descriptions.Item>
                  )}
                  {selectedRequisition.supplyChainReview.comments && (
                    <Descriptions.Item label="Comments" span={2}>
                      <Text italic>{selectedRequisition.supplyChainReview.comments}</Text>
                    </Descriptions.Item>
                  )}
                </Descriptions>
              </Card>
            )}

            {/* Procurement Details */}
            {selectedRequisition.procurementDetails && (
              <Card size="small" title="Procurement Details" style={{ marginBottom: '16px' }}>
                <Descriptions column={2} size="small">
                  {selectedRequisition.procurementDetails.procurementStartDate && (
                    <Descriptions.Item label="Start Date">
                      {new Date(selectedRequisition.procurementDetails.procurementStartDate).toLocaleDateString('en-GB')}
                    </Descriptions.Item>
                  )}
                  {selectedRequisition.procurementDetails.expectedDeliveryDate && (
                    <Descriptions.Item label="Expected Delivery">
                      {new Date(selectedRequisition.procurementDetails.expectedDeliveryDate).toLocaleDateString('en-GB')}
                    </Descriptions.Item>
                  )}
                  {selectedRequisition.procurementDetails.selectedVendor && (
                    <Descriptions.Item label="Selected Vendor">
                      {selectedRequisition.procurementDetails.selectedVendor}
                    </Descriptions.Item>
                  )}
                  {selectedRequisition.procurementDetails.finalCost && (
                    <Descriptions.Item label="Final Cost">
                      XAF {selectedRequisition.procurementDetails.finalCost.toLocaleString()}
                    </Descriptions.Item>
                  )}
                  {selectedRequisition.procurementDetails.deliveryDate && (
                    <Descriptions.Item label="Delivered Date">
                      {new Date(selectedRequisition.procurementDetails.deliveryDate).toLocaleDateString('en-GB')}
                    </Descriptions.Item>
                  )}
                  {selectedRequisition.procurementDetails.notes && (
                    <Descriptions.Item label="Notes" span={2}>
                      <Text italic>{selectedRequisition.procurementDetails.notes}</Text>
                    </Descriptions.Item>
                  )}
                </Descriptions>
              </Card>
            )}

            {/* Approval Progress */}
            <Card size="small" title="Approval Progress" style={{ marginBottom: '16px' }}>
              <Progress 
                percent={getApprovalProgress(selectedRequisition)} 
                status={selectedRequisition.status.includes('rejected') ? 'exception' : 'active'}
                style={{ marginBottom: '16px' }}
              />

              {selectedRequisition.approvalChain && selectedRequisition.approvalChain.length > 0 && (
                <Timeline>
                  {selectedRequisition.approvalChain.map((step, index) => {
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
                          <Text strong>Level {step.level}: {step.approver.name}</Text>
                          <br />
                          <Text type="secondary">{step.approver.role} - {step.approver.department}</Text>
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
                          {step.status === 'waiting' && (
                            <Tag color="default">Waiting</Tag>
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
              )}
            </Card>
          </div>
        )}
      </Modal>
      {/* ✅ NEW: Acknowledgment Modal */}
      <Modal
        title={
          <Space>
            <CheckCircleOutlined style={{ color: '#52c41a' }} />
            Acknowledge Disbursement Receipt
          </Space>
        }
        open={acknowledgmentModalVisible}
        onCancel={() => {
          setAcknowledgmentModalVisible(false);
          setSelectedDisbursement(null);
          acknowledgmentForm.resetFields();
        }}
        footer={null}
        width={600}
      >
        {selectedDisbursement && (
          <div>
            <Alert
              message="Confirm Money Receipt"
              description={`You are acknowledging receipt of XAF ${selectedDisbursement.amount?.toLocaleString()} for payment #${selectedDisbursement.disbursementNumber}.`}
              type="info"
              showIcon
              style={{ marginBottom: '20px' }}
            />

            <Alert
              message="Important"
              description="By acknowledging, you confirm that you have physically received the money. This action cannot be undone."
              type="warning"
              showIcon
              style={{ marginBottom: '20px' }}
            />

            <Form
              form={acknowledgmentForm}
              layout="vertical"
              onFinish={handleAcknowledgeDisbursement}
            >
              <Form.Item
                name="acknowledgmentMethod"
                label="How did you receive the money?"
                rules={[{ required: true, message: 'Please select receipt method' }]}
              >
                <Select placeholder="Select receipt method">
                  <Option value="cash">💵 Cash</Option>
                  <Option value="bank_transfer">🏦 Bank Transfer</Option>
                  <Option value="cheque">📝 Cheque</Option>
                  <Option value="mobile_money">📱 Mobile Money</Option>
                </Select>
              </Form.Item>

              <Form.Item
                name="acknowledgmentNotes"
                label="Additional Notes (Optional)"
                help="Any comments about receiving the money"
              >
                <TextArea
                  rows={3}
                  placeholder="E.g., Received in full, Transaction reference: ABC123..."
                  showCount
                  maxLength={200}
                />
              </Form.Item>

              <Form.Item>
                <Space>
                  <Button onClick={() => {
                    setAcknowledgmentModalVisible(false);
                    setSelectedDisbursement(null);
                    acknowledgmentForm.resetFields();
                  }}>
                    Cancel
                  </Button>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={loading}
                    icon={<CheckCircleOutlined />}
                    style={{ backgroundColor: '#52c41a' }}
                  >
                    Confirm Receipt
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>
      <Modal
        title={
          <Space>
            <CheckCircleOutlined style={{ color: '#52c41a' }} />
            Acknowledge Disbursement Receipt
          </Space>
        }
        open={acknowledgmentModalVisible}
        onCancel={() => {
          setAcknowledgmentModalVisible(false);
          setSelectedDisbursement(null);
          acknowledgmentForm.resetFields();
        }}
        footer={null}
        width={600}
      >
        {selectedDisbursement && (
          <div>
            <Alert
              message="Confirm Money Receipt"
              description={
                <div>
                  <p>You are acknowledging receipt of:</p>
                  <Text strong style={{ fontSize: '16px', color: '#1890ff' }}>
                    XAF {selectedDisbursement.amount?.toLocaleString()}
                  </Text>
                  <br />
                  <Text type="secondary">
                    Payment #{selectedDisbursement.disbursementNumber} • Disbursed on {new Date(selectedDisbursement.date).toLocaleDateString('en-GB')}
                  </Text>
                </div>
              }
              type="info"
              showIcon
              style={{ marginBottom: '20px' }}
            />

            <Alert
              message="Important"
              description="By acknowledging, you confirm that you have physically received the money. This action cannot be undone."
              type="warning"
              showIcon
              style={{ marginBottom: '20px' }}
            />

            <Form
              form={acknowledgmentForm}
              layout="vertical"
              onFinish={handleAcknowledgeDisbursement}
            >
              <Form.Item
                name="acknowledgmentMethod"
                label="How did you receive the money?"
                rules={[{ required: true, message: 'Please select receipt method' }]}
              >
                <Select placeholder="Select receipt method" size="large">
                  <Option value="cash">
                    <Space>
                      💵 <Text>Cash - Received physical cash</Text>
                    </Space>
                  </Option>
                  <Option value="bank_transfer">
                    <Space>
                      🏦 <Text>Bank Transfer - Money credited to bank account</Text>
                    </Space>
                  </Option>
                  {/* <Option value="cheque">
                    <Space>
                      📝 <Text>Cheque - Received cheque</Text>
                    </Space>
                  </Option> */}
                  <Option value="mobile_money">
                    <Space>
                      📱 <Text>Mobile Money - Received via mobile money</Text>
                    </Space>
                  </Option>
                </Select>
              </Form.Item>

              <Form.Item
                name="acknowledgmentNotes"
                label="Additional Notes (Optional)"
                help="Any comments about receiving the money (e.g., transaction reference, received from whom, etc.)"
              >
                <TextArea
                  rows={3}
                  placeholder="E.g., Received in full from Finance Officer. Transaction ref: TXN123456..."
                  showCount
                  maxLength={200}
                />
              </Form.Item>

              <Form.Item style={{ marginBottom: 0 }}>
                <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                  <Button onClick={() => {
                    setAcknowledgmentModalVisible(false);
                    setSelectedDisbursement(null);
                    acknowledgmentForm.resetFields();
                  }}>
                    Cancel
                  </Button>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={loading}
                    icon={<CheckCircleOutlined />}
                    size="large"
                    style={{ backgroundColor: '#52c41a' }}
                  >
                    ✅ Confirm I Received the Money
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>

      {/* ✅ NEW: Resubmit Modal */}
      <Modal
        title={
          <Space>
            <ReloadOutlined style={{ color: '#faad14' }} />
            Resubmit Rejected Requisition
          </Space>
        }
        open={resubmitModalVisible}
        onCancel={() => {
          setResubmitModalVisible(false);
          setSelectedRequisition(null);
          setRejectionHistory(null);
          setAttachmentFileList([]);
          setRemovedAttachmentIds([]);
          resubmitForm.resetFields();
        }}
        footer={null}
        width={900}
      >
        {selectedRequisition && (
          <div>
            {/* ✅ Show Rejection Details */}
            {rejectionHistory && rejectionHistory.rejectionHistory && rejectionHistory.rejectionHistory.length > 0 && (
              <Card 
                size="small" 
                title="Previous Rejection Details"
                style={{ marginBottom: '16px', borderColor: '#ff4d4f' }}
                headStyle={{ borderColor: '#ff4d4f', backgroundColor: '#fff1f0' }}
              >
                {rejectionHistory.rejectionHistory.map((rejection, index) => (
                  <div key={index} style={{ marginBottom: index < rejectionHistory.rejectionHistory.length - 1 ? '16px' : '0' }}>
                    <Row gutter={16}>
                      <Col span={12}>
                        <Text strong>Rejected by:</Text> {rejection.rejectorName}
                        <br />
                        <Text type="secondary" style={{ fontSize: '12px' }}>{rejection.rejectorRole}</Text>
                      </Col>
                      <Col span={12}>
                        <Text strong>Date:</Text> {new Date(rejection.rejectionDate).toLocaleString('en-GB')}
                      </Col>
                    </Row>
                    <div style={{ marginTop: '8px', padding: '10px', backgroundColor: '#fff7e6', borderRadius: '4px' }}>
                      <Text strong>Reason:</Text>
                      <br />
                      <Text italic>{rejection.rejectionReason || 'No reason provided'}</Text>
                    </div>
                    {rejection.resubmitted && (
                      <div style={{ marginTop: '8px', padding: '10px', backgroundColor: '#f6ffed', borderRadius: '4px' }}>
                        <Text style={{ color: '#52c41a' }}>✓ Resubmitted on {new Date(rejection.resubmittedDate).toLocaleString('en-GB')}</Text>
                        {rejection.resubmissionNotes && (
                          <>
                            <br />
                            <Text type="secondary" italic>Notes: {rejection.resubmissionNotes}</Text>
                          </>
                        )}
                      </div>
                    )}
                    {index < rejectionHistory.rejectionHistory.length - 1 && (
                      <Divider />
                    )}
                  </div>
                ))}
              </Card>
            )}

            {/* Edit Form */}
            <Card size="small" title="Update Requisition Details" style={{ marginBottom: '16px' }}>
              <Form
                form={resubmitForm}
                layout="vertical"
                onFinish={handleResubmit}
              >
                <Form.Item
                  label="Title"
                  name="title"
                  rules={[{ required: true, message: 'Please enter title' }]}
                >
                  <Input placeholder="Requisition title" />
                </Form.Item>

                <Form.Item
                  label="Category"
                  name="itemCategory"
                  rules={[{ required: true, message: 'Please select category' }]}
                >
                  <Select placeholder="Select category">
                    <Option value="IT">IT</Option>
                    <Option value="Office Supplies">Office Supplies</Option>
                    <Option value="Hardware">Hardware</Option>
                    <Option value="all">All</Option>
                    <Option value="Other">Other</Option>
                  </Select>
                </Form.Item>

                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      label="Budget (XAF)"
                      name="budgetXAF"
                      rules={[{ required: true, message: 'Please enter budget amount' }]}
                    >
                      <Input type="number" placeholder="Budget amount" />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      label="Budget Code"
                      name="budgetCode"
                      rules={[{ required: true, message: 'Please select budget code' }]}
                    >
                      <Select placeholder="Select budget code" showSearch optionFilterProp="children">
                        {availableBudgetCodes.map(code => (
                          <Option key={code._id} value={code._id}>
                            {code.code} - {code.name} (Available: XAF {(code.budget - code.used).toLocaleString()})
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>

                {/* Attachments Management */}
                <Form.Item label="Attachments">
                  <Upload
                    fileList={attachmentFileList}
                    onChange={({ fileList: newFileList }) => setAttachmentFileList(newFileList)}
                    onRemove={(file) => {
                      // If it's an existing file, add to removed list
                      if (file.existingId) {
                        setRemovedAttachmentIds([...removedAttachmentIds, file.existingId]);
                      }
                      return true;
                    }}
                    beforeUpload={() => false}
                    multiple
                    maxCount={5}
                  >
                    <Button icon={<UploadOutlined />}>Select Files (Max 5)</Button>
                  </Upload>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    You can add new files or remove existing ones. Maximum 5 files total.
                  </Text>
                </Form.Item>

                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      label="Urgency"
                      name="urgency"
                      rules={[{ required: true, message: 'Please select urgency' }]}
                    >
                      <Select placeholder="Select urgency">
                        <Option value="Low">Low</Option>
                        <Option value="Medium">Medium</Option>
                        <Option value="High">High</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item label="Items">
                      <Button 
                        icon={<EditOutlined />}
                        onClick={() => setEditingItemsModal(true)}
                        block
                      >
                        Edit Items ({editingItems.length})
                      </Button>
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item
                  label="Delivery Location"
                  name="deliveryLocation"
                  rules={[{ required: true, message: 'Please enter delivery location' }]}
                >
                  <Input placeholder="Where should items be delivered?" />
                </Form.Item>

                <Form.Item
                  label="Expected Delivery Date"
                  name="expectedDate"
                  rules={[{ required: true, message: 'Please select expected date' }]}
                >
                  <Input type="date" />
                </Form.Item>

                <Form.Item
                  label="Justification of Purchase"
                  name="justificationOfPurchase"
                  rules={[
                    { required: true, message: 'Please enter justification' },
                    { min: 20, message: 'Justification must be at least 20 characters' }
                  ]}
                >
                  <TextArea rows={3} placeholder="Explain why these items are needed..." />
                </Form.Item>

                <Form.Item
                  label="Preferred Supplier Justification (Optional)"
                  name="justificationOfPreferredSupplier"
                >
                  <TextArea rows={3} placeholder="Explain why you prefer this supplier..." />
                </Form.Item>

                <Form.Item
                  label="Resubmission Notes"
                  name="resubmissionNotes"
                  help="Explain what changes you made in response to the rejection feedback"
                >
                  <TextArea 
                    rows={3}
                    placeholder="E.g., Increased budget to meet quality requirements, found more reliable supplier, adjusted delivery timeline..." 
                  />
                </Form.Item>

                <Form.Item style={{ marginBottom: 0 }}>
                  <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                    <Button onClick={() => {
                      setResubmitModalVisible(false);
                      setSelectedRequisition(null);
                      setRejectionHistory(null);
                      resubmitForm.resetFields();
                    }}>
                      Cancel
                    </Button>
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={resubmitting}
                      icon={<ReloadOutlined />}
                      style={{ backgroundColor: '#faad14' }}
                    >
                      Resubmit Requisition
                    </Button>
                  </Space>
                </Form.Item>
              </Form>
            </Card>
          </div>
        )}
      </Modal>

      {/* ✅ NEW: Items Editor Modal (Refactored to select from database) */}
      <Modal
        title={<Space><EditOutlined />Edit Items</Space>}
        open={editingItemsModal}
        onCancel={() => setEditingItemsModal(false)}
        width={900}
        footer={[
          <Button key="cancel" onClick={() => setEditingItemsModal(false)}>
            Cancel
          </Button>,
          <Button 
            key="save" 
            type="primary" 
            onClick={() => {
              if (editingItems.length === 0) {
                message.error('At least one item is required');
                return;
              }
              setEditingItemsModal(false);
            }}
          >
            Save Items
          </Button>,
        ]}
      >
        <div style={{ marginBottom: '16px' }}>
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingItems([
                ...editingItems,
                {
                  itemId: '',
                  quantity: 1,
                  customDescription: '',
                  customUnitPrice: undefined
                }
              ]);
            }}
          >
            Add Item
          </Button>
        </div>

        <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
          {editingItems.map((item, index) => (
            <Card 
              key={index}
              size="small"
              style={{ marginBottom: '12px' }}
              extra={
                <Button
                  type="text"
                  danger
                  onClick={() => {
                    setEditingItems(editingItems.filter((_, i) => i !== index));
                  }}
                >
                  Remove
                </Button>
              }
            >
              <Form layout="vertical">
                <Row gutter={12}>
                  <Col span={10}>
                    <Form.Item label="Select Item" required>
                      <Select
                        showSearch
                        placeholder="Select from database"
                        value={item.itemId}
                        onChange={value => {
                          // Assume databaseItems is available in scope
                          const selected = databaseItems.find(dbItem => (dbItem._id || dbItem.id) === value);
                          const newItems = [...editingItems];
                          newItems[index] = {
                            ...newItems[index],
                            itemId: value,
                            code: selected?.code || '',
                            description: selected?.description || '',
                            category: selected?.category || '',
                            subcategory: selected?.subcategory || '',
                            measuringUnit: selected?.unitOfMeasure || '',
                            estimatedPrice: selected?.standardPrice || 0
                          };
                          setEditingItems(newItems);
                        }}
                        filterOption={(input, option) => {
                          const dbItem = databaseItems.find(i => (i._id || i.id) === option.value);
                          if (!dbItem) return false;
                          return (
                            dbItem.description.toLowerCase().includes(input.toLowerCase()) ||
                            dbItem.code.toLowerCase().includes(input.toLowerCase()) ||
                            dbItem.category.toLowerCase().includes(input.toLowerCase())
                          );
                        }}
                      >
                        {databaseItems && databaseItems.map(dbItem => (
                          <Option key={dbItem._id || dbItem.id} value={dbItem._id || dbItem.id}>
                            <span><b>{dbItem.code}</b> - {dbItem.description}</span>
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col span={4}>
                    <Form.Item label="Quantity" required>
                      <Input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={e => {
                          const newItems = [...editingItems];
                          newItems[index].quantity = parseInt(e.target.value) || 1;
                          setEditingItems(newItems);
                        }}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={5}>
                    <Form.Item label="Description (optional)">
                      <Input
                        placeholder="Custom description"
                        value={item.customDescription}
                        onChange={e => {
                          const newItems = [...editingItems];
                          newItems[index].customDescription = e.target.value;
                          setEditingItems(newItems);
                        }}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={5}>
                    <Form.Item label="Unit Price (optional)">
                      <Input
                        type="number"
                        min={0}
                        placeholder="Custom unit price"
                        value={item.customUnitPrice}
                        onChange={e => {
                          const newItems = [...editingItems];
                          newItems[index].customUnitPrice = e.target.value ? parseFloat(e.target.value) : undefined;
                          setEditingItems(newItems);
                        }}
                      />
                    </Form.Item>
                  </Col>
                </Row>
                {item.itemId && (
                  <Row gutter={12}>
                    <Col span={24}>
                      <Alert
                        message="Selected Item Details"
                        description={() => {
                          const dbItem = databaseItems.find(i => (i._id || i.id) === item.itemId);
                          return dbItem ? (
                            <div>
                              <b>Code:</b> {dbItem.code} | <b>Category:</b> {dbItem.category} | <b>Unit:</b> {dbItem.unitOfMeasure}<br />
                              <b>Standard Price:</b> {dbItem.standardPrice ? dbItem.standardPrice.toLocaleString() + ' XAF' : 'TBD'}
                            </div>
                          ) : null;
                        }}
                        type="info"
                        style={{ marginTop: 8, marginBottom: 0 }}
                      />
                    </Col>
                  </Row>
                )}
              </Form>
            </Card>
          ))}
        </div>
      </Modal>
      
<Modal
  title={
    <Space>
      <StopOutlined style={{ color: '#ff4d4f' }} />
      <Text strong>Request PR Cancellation</Text>
    </Space>
  }
  open={cancelModalVisible}
  onCancel={() => {
    setCancelModalVisible(false);
    setCancellingRequisition(null);
    setCancelReason('');
  }}
  footer={
    <Space>
      <Button onClick={() => {
        setCancelModalVisible(false);
        setCancellingRequisition(null);
        setCancelReason('');
      }}>
        Go Back
      </Button>
      <Button
        danger
        loading={cancelling}
        icon={<StopOutlined />}
        onClick={handleSubmitCancellation}
        disabled={cancelReason.trim().length < 10}
      >
        Submit Cancellation Request
      </Button>
    </Space>
  }
  width={560}
>
  {cancellingRequisition && (
    <div>
      <Alert
        message="This will go through the full approval chain"
        description={
          <div>
            Your cancellation request will be reviewed by all approvers in the
            original chain (Supervisor → Finance → Supply Chain → Head of Business).
            The PR will only be cancelled once all levels approve.
          </div>
        }
        type="warning"
        showIcon
        icon={<ExclamationCircleOutlined />}
        style={{ marginBottom: '16px' }}
      />

      <Descriptions column={1} size="small" bordered style={{ marginBottom: '16px' }}>
        <Descriptions.Item label="Requisition">
          <Text code>{cancellingRequisition.requisitionNumber}</Text>
        </Descriptions.Item>
        <Descriptions.Item label="Title">{cancellingRequisition.title}</Descriptions.Item>
        <Descriptions.Item label="Budget">
          XAF {(cancellingRequisition.budgetXAF || 0).toLocaleString()}
        </Descriptions.Item>
        <Descriptions.Item label="Current Status">
          {getStatusTag(cancellingRequisition.status)}
        </Descriptions.Item>
      </Descriptions>

      <Form layout="vertical">
        <Form.Item
          label="Reason for Cancellation"
          required
          help={`${cancelReason.length} characters (minimum 10)`}
        >
          <TextArea
            rows={4}
            value={cancelReason}
            onChange={e => setCancelReason(e.target.value)}
            placeholder="Explain why this PR needs to be cancelled. E.g., requirements have changed, items are no longer needed, revised PR will be submitted..."
            maxLength={500}
            showCount
          />
        </Form.Item>
      </Form>
    </div>
  )}
</Modal>
    </div>
  );
};

export default EmployeePurchaseRequisitions;



