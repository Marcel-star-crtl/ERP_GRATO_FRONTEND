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
  Upload,
  Steps,
  Divider,
  List,
  Avatar
} from 'antd';
import {
  FileTextOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  UserOutlined,
  AuditOutlined,
  FileOutlined,
  EyeOutlined,
  HistoryOutlined,
  ReloadOutlined,
  ShopOutlined,
  DollarOutlined,
  DownloadOutlined,
  UploadOutlined,
  InboxOutlined,
  SendOutlined,
  ShoppingCartOutlined,
  WarningOutlined
} from '@ant-design/icons';
import moment from 'moment';
import { buyerRequisitionAPI } from '../../services/buyerRequisitionAPI';

const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { TextArea } = Input;
const { Dragger } = Upload;
const { Step } = Steps;

const SupervisorPOApprovals = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useSelector((state) => state.auth);
  
  const autoApprovalId = searchParams.get('approve');
  const autoRejectId = searchParams.get('reject');
  
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [approvalModalVisible, setApprovalModalVisible] = useState(false);
  const [selectedPO, setSelectedPO] = useState(null);
  const [activeTab, setActiveTab] = useState('pending');
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    total: 0
  });
  const [form] = Form.useForm();

  // Signing states
  const [signedDocumentFile, setSignedDocumentFile] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [downloadingPO, setDownloadingPO] = useState(false);
  const [documentDownloaded, setDocumentDownloaded] = useState(false);

  // Helper function to check if user can approve PO
  const canUserApprovePO = useCallback((po) => {
    if (!po.approvalChain || !user?.email) return false;
    
    const currentStep = po.approvalChain.find(step => 
      step.level === po.currentApprovalLevel && 
      step.approver?.email === user.email &&
      step.status === 'pending'
    );
    
    return !!currentStep;
  }, [user?.email]);

  const fetchPendingApprovals = useCallback(async () => {
    try {
      setLoading(true);
      
      const response = await buyerRequisitionAPI.getSupervisorPendingPOs();
      
      if (response.success) {
        const pos = response.data || [];
        setPurchaseOrders(pos);

        // Calculate stats
        const pending = pos.filter(po => canUserApprovePO(po)).length;
        const approved = pos.filter(po => 
          ['approved', 'completed'].includes(po.status)
        ).length;
        const rejected = pos.filter(po => 
          po.status === 'rejected'
        ).length;

        setStats({
          pending,
          approved,
          rejected,
          total: pos.length
        });
      }
    } catch (error) {
      console.error('Error fetching pending approvals:', error);
      message.error('Failed to fetch pending approvals');
    } finally {
      setLoading(false);
    }
  }, [canUserApprovePO]);

  useEffect(() => {
    if (user?.email) {
      fetchPendingApprovals();
    }
  }, [fetchPendingApprovals, user?.email]);

  // Auto-approval from email links
  useEffect(() => {
    const handleAutoAction = async () => {
      if (autoApprovalId || autoRejectId) {
        try {
          const poId = autoApprovalId || autoRejectId;
          const response = await buyerRequisitionAPI.getPurchaseOrderDetails(poId);
          
          if (response.success) {
            setSelectedPO(response.data.purchaseOrder);
            setApprovalModalVisible(true);
            form.setFieldsValue({ decision: autoApprovalId ? 'approved' : 'rejected' });
          }
        } catch (error) {
          message.error('Failed to load purchase order for approval');
        }
      }
    };

    if (autoApprovalId || autoRejectId) {
      handleAutoAction();
    }
  }, [autoApprovalId, autoRejectId, form]);

  const handleDownloadPO = async () => {
    if (!selectedPO) {
      message.error('No purchase order selected');
      return;
    }

    try {
      setDownloadingPO(true);
      const response = await buyerRequisitionAPI.downloadPOForSigning(selectedPO.id);
      
      if (response.success) {
        const { url, fileName } = response.data;
        
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName || `PO_${selectedPO.poNumber}.pdf`;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        message.success('Purchase order downloaded successfully. Please sign and upload.');
        setDocumentDownloaded(true);
        setCurrentStep(1);
      }
    } catch (error) {
      console.error('Error downloading PO:', error);
      message.error(error.response?.data?.message || 'Failed to download purchase order');
    } finally {
      setDownloadingPO(false);
    }
  };

  const handleFileUpload = (info) => {
    const { file } = info;
    
    const isValidType = file.type === 'application/pdf' || 
                        file.type === 'image/jpeg' || 
                        file.type === 'image/png' ||
                        file.type === 'image/jpg';
    
    if (!isValidType) {
      message.error('You can only upload PDF, JPG, or PNG files!');
      return;
    }

    const isValidSize = file.size / 1024 / 1024 < 10;
    if (!isValidSize) {
      message.error('File must be smaller than 10MB!');
      return;
    }

    setSignedDocumentFile(file);
    message.success(`${file.name} selected successfully`);
    setCurrentStep(2);
  };

  const handleApprovalDecision = async (values) => {
    if (!selectedPO) return;

    try {
      setLoading(true);
      
      if (values.decision === 'approved' && !signedDocumentFile) {
        message.error('Please download, sign, and upload the document before approving.');
        setLoading(false);
        return;
      }
      
      let response;
      
      if (values.decision === 'approved') {
        const formData = new FormData();
        formData.append('decision', values.decision);
        formData.append('comments', values.comments || '');
        formData.append('signedDocument', signedDocumentFile);
        
        response = await buyerRequisitionAPI.processPOApproval(selectedPO.id, formData);
      } else {
        response = await buyerRequisitionAPI.processPOApproval(selectedPO.id, {
          decision: values.decision,
          comments: values.comments
        });
      }
      
      if (response.success) {
        const actionText = values.decision === 'approved' ? 'approved' : 'rejected';
        message.success(`Purchase order ${actionText} successfully`);
        
        setApprovalModalVisible(false);
        form.resetFields();
        resetSigningWorkflow();
        setSelectedPO(null);
        
        await fetchPendingApprovals();
        
        notification.success({
          message: 'Approval Decision Recorded',
          description: `Purchase order ${selectedPO.poNumber} has been ${actionText}${values.decision === 'approved' ? ' with signed document' : ''}.`,
          duration: 4
        });
      }
    } catch (error) {
      console.error('Approval decision error:', error);
      message.error(error.response?.data?.message || 'Failed to process approval decision');
    } finally {
      setLoading(false);
    }
  };

  const resetSigningWorkflow = () => {
    setSignedDocumentFile(null);
    setDocumentDownloaded(false);
    setCurrentStep(0);
  };

  const handleViewDetails = async (po) => {
    try {
      const response = await buyerRequisitionAPI.getPurchaseOrderDetails(po.id);
      
      if (response.success) {
        setSelectedPO(response.data.purchaseOrder);
        setDetailsModalVisible(true);
      }
    } catch (error) {
      console.error('Error fetching PO details:', error);
      message.error('Failed to fetch purchase order details');
    }
  };

  const getStatusTag = (status) => {
    const statusMap = {
      'pending_approval': { color: 'orange', text: 'Pending Approval', icon: <ClockCircleOutlined /> },
      'pending_department_approval': { color: 'orange', text: 'Pending Your Approval', icon: <ClockCircleOutlined /> },
      'pending_head_approval': { color: 'orange', text: 'Pending Your Approval', icon: <ClockCircleOutlined /> },
      'approved': { color: 'green', text: 'Approved', icon: <CheckCircleOutlined /> },
      'rejected': { color: 'red', text: 'Rejected', icon: <CloseCircleOutlined /> },
      'completed': { color: 'success', text: 'Completed', icon: <CheckCircleOutlined /> }
    };

    const config = statusMap[status] || { color: 'default', text: status, icon: null };
    return <Tag color={config.color} icon={config.icon}>{config.text}</Tag>;
  };

  const getFilteredPOs = (status) => {
    switch (status) {
      case 'pending':
        return purchaseOrders.filter(po => canUserApprovePO(po));
      case 'approved':
        return purchaseOrders.filter(po => ['approved', 'completed'].includes(po.status));
      case 'rejected':
        return purchaseOrders.filter(po => po.status === 'rejected');
      default:
        return purchaseOrders;
    }
  };

  const columns = [
    {
      title: 'PO Number',
      dataIndex: 'poNumber',
      key: 'poNumber',
      render: (text) => <Text code>{text}</Text>,
      width: 140
    },
    {
      title: 'Supplier',
      key: 'supplier',
      render: (_, record) => (
        <div>
          <Text strong>{record.supplierName}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.supplierEmail}
          </Text>
        </div>
      ),
      width: 180
    },
    {
      title: 'Amount',
      dataIndex: 'totalAmount',
      key: 'amount',
      render: (amount, record) => (
        <Text strong>{record.currency || 'XAF'} {amount ? amount.toLocaleString() : '0'}</Text>
      ),
      width: 120,
      sorter: (a, b) => a.totalAmount - b.totalAmount
    },
    {
      title: 'Items',
      key: 'items',
      render: (_, record) => (
        <Text>{record.items?.length || 0} items</Text>
      ),
      width: 80
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, record) => (
        <div>
          {getStatusTag(record.status)}
          {canUserApprovePO(record) && (
            <div style={{ marginTop: 4 }}>
              <Tag color="gold" size="small">Your Turn</Tag>
            </div>
          )}
        </div>
      ),
      width: 140
    },
    {
      title: 'Created',
      key: 'created',
      render: (_, record) => (
        moment(record.creationDate).format('MMM DD, YYYY')
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
          
          {canUserApprovePO(record) && (
            <Button 
              size="small" 
              type="primary"
              onClick={() => {
                setSelectedPO(record);
                setApprovalModalVisible(true);
                resetSigningWorkflow();
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

  if (loading && !purchaseOrders.length) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <Title level={2} style={{ margin: 0 }}>
            <AuditOutlined /> Purchase Order Approvals Dashboard
          </Title>
          <Space>
            <Button 
              icon={<ReloadOutlined />} 
              onClick={fetchPendingApprovals}
              loading={loading}
            >
              Refresh
            </Button>
          </Space>
        </div>

        {/* Stats Cards */}
        <Row gutter={16} style={{ marginBottom: '24px' }}>
          <Col span={6}>
            <Card>
              <Statistic
                title="Pending Approval"
                value={stats.pending}
                prefix={<ClockCircleOutlined />}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Approved"
                value={stats.approved}
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Rejected"
                value={stats.rejected}
                prefix={<CloseCircleOutlined />}
                valueStyle={{ color: '#f5222d' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Total"
                value={stats.total}
                prefix={<ShoppingCartOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
        </Row>

        {stats.pending > 0 && (
          <Alert
            message={`${stats.pending} purchase order(s) require your approval`}
            description="Purchase orders require document signing before approval. Download, sign, and upload the signed document."
            type="warning"
            showIcon
            style={{ marginBottom: '16px' }}
          />
        )}

        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane 
            tab={`Pending (${stats.pending})`} 
            key="pending"
          >
            <Alert
              message="Document Signing Required"
              description="Purchase orders require you to download, sign manually, and upload the signed document before approval."
              type="info"
              showIcon
              icon={<FileTextOutlined />}
              style={{ marginBottom: '16px' }}
              closable
            />
            <Table
              columns={columns}
              dataSource={getFilteredPOs('pending')}
              loading={loading}
              rowKey="id"
              pagination={{ pageSize: 10 }}
              scroll={{ x: 1200 }}
              size="small"
            />
          </TabPane>
          
          <TabPane 
            tab={`Approved (${stats.approved})`} 
            key="approved"
          >
            <Table
              columns={columns}
              dataSource={getFilteredPOs('approved')}
              loading={loading}
              rowKey="id"
              pagination={{ pageSize: 10 }}
              scroll={{ x: 1200 }}
              size="small"
            />
          </TabPane>
          
          <TabPane 
            tab={`Rejected (${stats.rejected})`} 
            key="rejected"
          >
            <Table
              columns={columns}
              dataSource={getFilteredPOs('rejected')}
              loading={loading}
              rowKey="id"
              pagination={{ pageSize: 10 }}
              scroll={{ x: 1200 }}
              size="small"
            />
          </TabPane>
        </Tabs>
      </Card>

      {/* Approval Modal with Signing Workflow */}
      <Modal
        title={
          <Space>
            <AuditOutlined />
            Sign & Approve Purchase Order
          </Space>
        }
        open={approvalModalVisible}
        onCancel={() => {
          setApprovalModalVisible(false);
          setSelectedPO(null);
          form.resetFields();
          resetSigningWorkflow();
        }}
        footer={null}
        width={800}
        maskClosable={false}
      >
        {selectedPO && (
          <div>
            <Card size="small" style={{ marginBottom: 16, backgroundColor: '#f0f8ff' }}>
              <Descriptions size="small" column={2}>
                <Descriptions.Item label="PO Number">{selectedPO.poNumber}</Descriptions.Item>
                <Descriptions.Item label="Supplier">{selectedPO.supplierName}</Descriptions.Item>
                <Descriptions.Item label="Amount">
                  {selectedPO.currency} {selectedPO.totalAmount?.toLocaleString()}
                </Descriptions.Item>
                <Descriptions.Item label="Items">{selectedPO.items?.length || 0}</Descriptions.Item>
              </Descriptions>
            </Card>

            <Alert
              message="Signing Workflow Required"
              description="You must download, sign, and upload the document before approving this purchase order."
              type="warning"
              showIcon
              style={{ marginBottom: 16 }}
            />

            <Steps current={currentStep} style={{ marginBottom: 24 }}>
              <Step title="Download" icon={<DownloadOutlined />} />
              <Step title="Sign" icon={<FileTextOutlined />} />
              <Step title="Upload" icon={<UploadOutlined />} />
              <Step title="Approve" icon={<SendOutlined />} />
            </Steps>

            <Divider />

            {/* Step 1: Download */}
            <Card 
              size="small" 
              style={{ 
                marginBottom: 16,
                backgroundColor: currentStep === 0 ? '#fff7e6' : '#f5f5f5',
                borderColor: currentStep === 0 ? '#faad14' : '#d9d9d9'
              }}
            >
              <Space direction="vertical" style={{ width: '100%' }}>
                <Text strong>Step 1: Download Purchase Order</Text>
                <Button
                  type={currentStep === 0 ? 'primary' : 'default'}
                  icon={<DownloadOutlined />}
                  loading={downloadingPO}
                  onClick={handleDownloadPO}
                  disabled={documentDownloaded}
                  block
                >
                  {documentDownloaded ? 'Downloaded ✓' : 'Download PO'}
                </Button>
              </Space>
            </Card>

            {/* Step 2: Upload Signed */}
            <Card 
              size="small" 
              style={{ 
                marginBottom: 16,
                backgroundColor: currentStep === 1 ? '#fff7e6' : '#f5f5f5',
                borderColor: currentStep === 1 ? '#faad14' : '#d9d9d9'
              }}
            >
              <Space direction="vertical" style={{ width: '100%' }}>
                <Text strong>Step 2: Upload Signed Document {!signedDocumentFile && <Text type="danger">*</Text>}</Text>
                <Dragger
                  accept=".pdf,.jpg,.jpeg,.png"
                  maxCount={1}
                  beforeUpload={(file) => {
                    handleFileUpload({ file });
                    return false;
                  }}
                  onRemove={() => {
                    setSignedDocumentFile(null);
                    setCurrentStep(1);
                  }}
                  disabled={!documentDownloaded}
                  fileList={signedDocumentFile ? [{
                    uid: '-1',
                    name: signedDocumentFile.name,
                    status: 'done',
                  }] : []}
                >
                  <p className="ant-upload-drag-icon">
                    <InboxOutlined />
                  </p>
                  <p className="ant-upload-text">Upload signed document</p>
                  <p className="ant-upload-hint">PDF, JPG, PNG (Max 10MB)</p>
                </Dragger>
              </Space>
            </Card>

            {/* Step 3: Decision Form */}
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
                <Radio.Group disabled={!signedDocumentFile}>
                  <Radio.Button value="approved" style={{ color: '#52c41a' }}>
                    <CheckCircleOutlined /> Approve
                  </Radio.Button>
                  <Radio.Button value="rejected" style={{ color: '#f5222d' }}>
                    <CloseCircleOutlined /> Reject
                  </Radio.Button>
                </Radio.Group>
              </Form.Item>

              <Form.Item
                name="comments"
                label="Comments"
                rules={[{ required: true, message: 'Comments are required' }]}
              >
                <TextArea 
                  rows={4} 
                  placeholder="Explain your decision..."
                  maxLength={500}
                  showCount
                />
              </Form.Item>

              <Form.Item>
                <Space>
                  <Button onClick={() => {
                    setApprovalModalVisible(false);
                    setSelectedPO(null);
                    form.resetFields();
                    resetSigningWorkflow();
                  }}>
                    Cancel
                  </Button>
                  <Button 
                    type="primary" 
                    htmlType="submit"
                    loading={loading}
                    disabled={!signedDocumentFile}
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
        title={
          <Space>
            <FileTextOutlined />
            Purchase Order Details & Approval History
          </Space>
        }
        open={detailsModalVisible}
        onCancel={() => {
          setDetailsModalVisible(false);
          setSelectedPO(null);
        }}
        footer={null}
        width={900}
      >
        {selectedPO && (
          <div>
            <Descriptions bordered column={2} size="small" style={{ marginBottom: '20px' }}>
              <Descriptions.Item label="PO Number" span={2}>
                <Text code copyable>{selectedPO.poNumber}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Supplier">
                {selectedPO.supplierName}
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                {getStatusTag(selectedPO.status)}
              </Descriptions.Item>
              <Descriptions.Item label="Amount">
                <Text strong>
                  {selectedPO.currency || 'XAF'} {selectedPO.totalAmount?.toLocaleString()}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Created">
                {moment(selectedPO.creationDate).format('MMM DD, YYYY HH:mm')}
              </Descriptions.Item>
            </Descriptions>

            {/* Items Table */}
            <Card size="small" title="Items" style={{ marginBottom: '20px' }}>
              <List
                dataSource={selectedPO.items || []}
                renderItem={(item, index) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={<Avatar>{index + 1}</Avatar>}
                      title={item.description}
                      description={`Quantity: ${item.quantity} ${item.unitOfMeasure || ''} @ ${selectedPO.currency} ${item.unitPrice?.toLocaleString()}`}
                    />
                    <Text strong>
                      {selectedPO.currency} {item.totalPrice?.toLocaleString()}
                    </Text>
                  </List.Item>
                )}
              />
            </Card>

            {/* Approval Chain */}
            {selectedPO.approvalChain && selectedPO.approvalChain.length > 0 && (
              <>
                <Title level={4}>
                  <HistoryOutlined /> Approval Chain Progress
                </Title>
                <Timeline>
                  {selectedPO.approvalChain.map((step, index) => {
                    let color = 'gray';
                    let icon = <ClockCircleOutlined />;
                    
                    if (step.status === 'approved') {
                      color = 'green';
                      icon = <CheckCircleOutlined />;
                    } else if (step.status === 'rejected') {
                      color = 'red';
                      icon = <CloseCircleOutlined />;
                    }

                    const isCurrentStep = step.level === selectedPO.currentApprovalLevel && step.status === 'pending';

                    return (
                      <Timeline.Item key={index} color={color} dot={icon}>
                        <div>
                          <Text strong>Level {step.level}: {step.approver?.name || 'Unknown'}</Text>
                          {isCurrentStep && <Tag color="gold" size="small" style={{marginLeft: 8}}>Current</Tag>}
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
                              <Tag color="green">Approved & Signed</Tag>
                              {step.actionDate && (
                                <Text type="secondary">
                                  {moment(step.actionDate).format('MMM DD, YYYY HH:mm')}
                                </Text>
                              )}
                              {step.signedDocument && (
                                <div style={{ marginTop: 4 }}>
                                  <Button 
                                    size="small" 
                                    type="link" 
                                    icon={<DownloadOutlined />}
                                    onClick={() => window.open(step.signedDocument.url, '_blank')}
                                  >
                                    View Signed Document
                                  </Button>
                                </div>
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
                                  {moment(step.actionDate).format('MMM DD, YYYY HH:mm')}
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
              </>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default SupervisorPOApprovals;