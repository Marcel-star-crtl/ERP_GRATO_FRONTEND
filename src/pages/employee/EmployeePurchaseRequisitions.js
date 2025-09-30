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
  Progress,
  message,
  Spin,
  List,
  Tooltip
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
  PaperClipOutlined
} from '@ant-design/icons';
import { purchaseRequisitionAPI } from '../../services/purchaseRequisitionAPI';

const { Title, Text } = Typography;

const EmployeePurchaseRequisitions = ({ onCreateNew }) => {
  const { user } = useSelector((state) => state.auth);
  const [requisitions, setRequisitions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRequisition, setSelectedRequisition] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

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

  const getApprovalProgress = (requisition) => {
    const { status, approvalChain } = requisition;
    
    if (status === 'approved' || status === 'delivered' || status === 'procurement_complete') return 100;
    if (status === 'rejected' || status === 'supply_chain_rejected') return 0;
    
    if (!approvalChain || approvalChain.length === 0) return 0;
    
    const completedSteps = approvalChain.filter(step => step.status === 'approved').length;
    return Math.round((completedSteps / approvalChain.length) * 100);
  };

  const handleViewDetails = async (requisition) => {
    try {
      const response = await purchaseRequisitionAPI.getRequisition(requisition._id);
      if (response.success) {
        setSelectedRequisition(response.data);
        setDetailModalVisible(true);
      } else {
        message.error('Failed to fetch requisition details');
      }
    } catch (error) {
      console.error('Error fetching requisition details:', error);
      message.error('Failed to fetch requisition details');
    }
  };

  // FIXED: Handle attachment download
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

  // FIXED: Handle attachment preview
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

  // FIXED: Render attachments in modal
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
    // FIXED: Add attachments column
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
        <Button 
          size="small" 
          icon={<EyeOutlined />}
          onClick={() => handleViewDetails(record)}
        >
          Details
        </Button>
      ),
      width: 100
    }
  ];

  const stats = {
    total: requisitions.length,
    pending: requisitions.filter(r => r.status.includes('pending')).length,
    approved: requisitions.filter(r => ['approved', 'delivered', 'procurement_complete'].includes(r.status)).length,
    rejected: requisitions.filter(r => r.status.includes('rejected')).length
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
              onClick={onCreateNew}
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
              title="Rejected"
              value={stats.rejected}
              prefix={<CloseCircleOutlined />}
              valueStyle={{ color: '#f5222d' }}
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

      {/* FIXED: Detail Modal with proper attachment handling */}
      <Modal
        title={
          <Space>
            <FileTextOutlined />
            Purchase Requisition Details
          </Space>
        }
        open={detailModalVisible}
        onCancel={() => {
          setDetailModalVisible(false);
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

            {/* FIXED: Attachments Section */}
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
    </div>
  );
};

export default EmployeePurchaseRequisitions;



