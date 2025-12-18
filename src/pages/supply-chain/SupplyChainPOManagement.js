import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Table,
  Button,
  Modal,
  Select,
  Typography,
  Tag,
  Space,
  Input,
  Descriptions,
  Alert,
  message,
  Tooltip,
  Badge,
  Statistic,
  Row,
  Col,
  notification,
  Upload,
  Steps,
  Divider,
  Spin
} from 'antd';
import {
  FileTextOutlined,
  SendOutlined,
  CloseCircleOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  EyeOutlined,
  ReloadOutlined,
  ShopOutlined,
  TeamOutlined,
  FileOutlined,
  DownloadOutlined,
  UploadOutlined,
  WarningOutlined,
  CrownOutlined,
  InboxOutlined
} from '@ant-design/icons';
import moment from 'moment';
import { buyerRequisitionAPI } from '../../services/buyerRequisitionAPI';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;
const { Dragger } = Upload;
const { Step } = Steps;

const SupplyChainPOManagement = () => {
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [selectedPO, setSelectedPO] = useState(null);
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    pendingAssignment: 0,
    assignedToday: 0,
    rejectedToday: 0,
    inApprovalChain: 0
  });

  // Assignment workflow states
  const [assignDepartment, setAssignDepartment] = useState('');
  const [assignComments, setAssignComments] = useState('');
  const [signedDocumentFile, setSignedDocumentFile] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [downloadingPO, setDownloadingPO] = useState(false);
  const [documentDownloaded, setDocumentDownloaded] = useState(false);
  
  // Rejection states
  const [rejectReason, setRejectReason] = useState('');

  // Fetch pending POs
  const fetchPendingPOs = useCallback(async () => {
    try {
      setLoading(true);
      
      const response = await buyerRequisitionAPI.getSupplyChainPendingPOs();
      
      if (response.success) {
        setPurchaseOrders(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching pending POs:', error);
      message.error('Failed to fetch pending purchase orders');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch dashboard stats
  const fetchStats = useCallback(async () => {
    try {
      const response = await buyerRequisitionAPI.getSupplyChainPOStats();
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }, []);

  useEffect(() => {
    fetchPendingPOs();
    fetchStats();
  }, [fetchPendingPOs, fetchStats]);

  // Handle download PO for signing
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

  // Handle file upload
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

  // Handle assignment with signed document
  const handleAssign = async () => {
    if (!assignDepartment) {
      message.error('Please select a department');
      return;
    }
    
    if (!signedDocumentFile) {
      message.error('Please upload the signed document');
      return;
    }
    
    try {
      setLoading(true);
      
      const formData = new FormData();
      formData.append('department', assignDepartment);
      if (assignComments) {
        formData.append('comments', assignComments);
      }
      formData.append('signedDocument', signedDocumentFile);
      
      const response = await buyerRequisitionAPI.assignPOToDepartment(
        selectedPO.id,
        formData
      );
      
      if (response.success) {
        notification.success({
          message: 'Purchase Order Assigned Successfully',
          description: `PO ${selectedPO.poNumber} has been signed and assigned to ${assignDepartment}. The Department Head will be notified.`,
          duration: 5
        });
        
        setAssignModalVisible(false);
        resetAssignmentForm();
        fetchPendingPOs();
        fetchStats();
      }
      
    } catch (error) {
      console.error('Assignment error:', error);
      message.error(error.response?.data?.message || 'Failed to assign purchase order');
    } finally {
      setLoading(false);
    }
  };

  // Reset assignment form
  const resetAssignmentForm = () => {
    setSelectedPO(null);
    setAssignDepartment('');
    setAssignComments('');
    setSignedDocumentFile(null);
    setDocumentDownloaded(false);
    setCurrentStep(0);
  };

  // Handle rejection
  const handleReject = async () => {
    if (!rejectReason || rejectReason.trim().length < 10) {
      message.error('Rejection reason must be at least 10 characters');
      return;
    }
    
    try {
      setLoading(true);
      
      const response = await buyerRequisitionAPI.rejectPO(selectedPO.id, {
        rejectionReason: rejectReason
      });
      
      if (response.success) {
        message.success('Purchase order rejected successfully');
        setRejectModalVisible(false);
        setSelectedPO(null);
        setRejectReason('');
        fetchPendingPOs();
        fetchStats();
      }
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to reject purchase order');
    } finally {
      setLoading(false);
    }
  };

  // View PO details
  const handleViewDetails = async (po) => {
    setSelectedPO(po);
    setDetailsModalVisible(true);
  };

  const columns = [
    {
      title: 'PO Number',
      dataIndex: 'poNumber',
      key: 'poNumber',
      render: (text) => <Text code>{text}</Text>,
      width: 150
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
      width: 200
    },
    {
      title: 'Amount',
      dataIndex: 'totalAmount',
      key: 'amount',
      render: (amount, record) => (
        <Text strong>{record.currency || 'XAF'} {amount.toLocaleString()}</Text>
      ),
      width: 120
    },
    {
      title: 'Items',
      key: 'items',
      render: (_, record) => (
        <div>
          <Text>{record.items?.length || 0} items</Text>
          <br />
          <Text type="secondary" style={{ fontSize: '11px' }}>
            {record.items?.[0]?.description}
            {record.items?.length > 1 && ` +${record.items.length - 1} more`}
          </Text>
        </div>
      ),
      width: 180
    },
    {
      title: 'Created',
      key: 'created',
      render: (_, record) => (
        <div>
          <div>{moment(record.creationDate).format('MMM DD, YYYY')}</div>
          <Text type="secondary" style={{ fontSize: '11px' }}>
            {moment(record.creationDate).format('HH:mm')}
          </Text>
        </div>
      ),
      width: 120
    },
    {
      title: 'Expected Delivery',
      key: 'delivery',
      render: (_, record) => (
        record.expectedDeliveryDate ? (
          <Text>{moment(record.expectedDeliveryDate).format('MMM DD, YYYY')}</Text>
        ) : (
          <Text type="secondary">Not set</Text>
        )
      ),
      width: 130
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 200,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="View Details">
            <Button 
              size="small" 
              icon={<EyeOutlined />}
              onClick={() => handleViewDetails(record)}
            />
          </Tooltip>
          
          <Tooltip title="Download, Sign & Assign">
            <Button 
              size="small" 
              type="primary"
              icon={<SendOutlined />}
              onClick={() => {
                setSelectedPO(record);
                setAssignModalVisible(true);
              }}
            >
              Assign
            </Button>
          </Tooltip>
          
          <Tooltip title="Reject PO">
            <Button 
              size="small" 
              danger
              icon={<CloseCircleOutlined />}
              onClick={() => {
                setSelectedPO(record);
                setRejectModalVisible(true);
              }}
            >
              Reject
            </Button>
          </Tooltip>
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <Title level={2} style={{ margin: 0 }}>
            <TeamOutlined /> Supply Chain - Purchase Order Management
          </Title>
          <Space>
            <Button 
              icon={<ReloadOutlined />} 
              onClick={() => {
                fetchPendingPOs();
                fetchStats();
              }}
              loading={loading}
            >
              Refresh
            </Button>
          </Space>
        </div>

        <Alert
          message="Document Signing Workflow"
          description="For each purchase order, you must: 1) Download the PO 2) Sign it manually 3) Upload the signed document before assigning to a department."
          type="info"
          showIcon
          icon={<FileTextOutlined />}
          style={{ marginBottom: '24px' }}
          closable
        />

        {/* Statistics */}
        <Row gutter={16} style={{ marginBottom: '24px' }}>
          <Col span={6}>
            <Card>
              <Statistic
                title="Pending Assignment"
                value={stats.pendingAssignment}
                prefix={<ClockCircleOutlined />}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Assigned Today"
                value={stats.assignedToday}
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Rejected Today"
                value={stats.rejectedToday}
                prefix={<CloseCircleOutlined />}
                valueStyle={{ color: '#ff4d4f' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="In Approval Chain"
                value={stats.inApprovalChain}
                prefix={<ShopOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={purchaseOrders}
          loading={loading}
          rowKey="id"
          scroll={{ x: 1300 }}
          size="small"
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `Total ${total} purchase orders`
          }}
        />
      </Card>

      {/* Assignment Modal with Signing Workflow */}
      <Modal
        title={
          <Space>
            <SendOutlined />
            Sign & Assign Purchase Order to Department
          </Space>
        }
        open={assignModalVisible}
        onCancel={() => {
          setAssignModalVisible(false);
          resetAssignmentForm();
        }}
        footer={null}
        width={700}
        maskClosable={false}
      >
        {selectedPO && (
          <div>
            {/* PO Info */}
            <Card size="small" style={{ marginBottom: 16, backgroundColor: '#f0f8ff' }}>
              <Descriptions size="small" column={2}>
                <Descriptions.Item label="PO Number">{selectedPO.poNumber}</Descriptions.Item>
                <Descriptions.Item label="Supplier">{selectedPO.supplierName}</Descriptions.Item>
                <Descriptions.Item label="Amount">
                  {selectedPO.currency} {selectedPO.totalAmount.toLocaleString()}
                </Descriptions.Item>
                <Descriptions.Item label="Items">{selectedPO.items?.length || 0}</Descriptions.Item>
              </Descriptions>
            </Card>

            {/* Workflow Steps */}
            <Steps current={currentStep} style={{ marginBottom: 24 }}>
              <Step title="Download" icon={<DownloadOutlined />} description="Get PO" />
              <Step title="Sign" icon={<FileTextOutlined />} description="Sign document" />
              <Step title="Upload" icon={<UploadOutlined />} description="Upload signed" />
              <Step title="Assign" icon={<SendOutlined />} description="Complete" />
            </Steps>

            <Divider />

            {/* Step 1: Download PO */}
            <Card 
              size="small" 
              style={{ 
                marginBottom: 16, 
                backgroundColor: currentStep === 0 ? '#fff7e6' : '#f5f5f5',
                borderColor: currentStep === 0 ? '#faad14' : '#d9d9d9'
              }}
            >
              <Space direction="vertical" style={{ width: '100%' }}>
                <Text strong>
                  <DownloadOutlined /> Step 1: Download Purchase Order for Signing
                </Text>
                <Button
                  type={currentStep === 0 ? 'primary' : 'default'}
                  icon={<DownloadOutlined />}
                  loading={downloadingPO}
                  onClick={handleDownloadPO}
                  disabled={documentDownloaded}
                  block
                >
                  {documentDownloaded ? 'PO Downloaded ✓' : 'Download Purchase Order'}
                </Button>
                {documentDownloaded && (
                  <Alert
                    message="Downloaded successfully. Please sign the document manually (print & scan or digital signature)."
                    type="success"
                    showIcon
                    style={{ marginTop: 8 }}
                  />
                )}
              </Space>
            </Card>

            {/* Step 2: Upload Signed Document */}
            <Card 
              size="small" 
              style={{ 
                marginBottom: 16,
                backgroundColor: currentStep === 1 ? '#fff7e6' : '#f5f5f5',
                borderColor: currentStep === 1 ? '#faad14' : '#d9d9d9'
              }}
            >
              <Space direction="vertical" style={{ width: '100%' }}>
                <Text strong>
                  <UploadOutlined /> Step 2: Upload Signed Document {!signedDocumentFile && <Text type="danger">*</Text>}
                </Text>
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
                  <p className="ant-upload-text">
                    Click or drag signed document to upload
                  </p>
                  <p className="ant-upload-hint">
                    Supports PDF, JPG, PNG (Max 10MB)
                  </p>
                </Dragger>
                {!documentDownloaded && (
                  <Alert
                    message="Please download the PO first before uploading signed version"
                    type="warning"
                    showIcon
                    style={{ marginTop: 8 }}
                  />
                )}
              </Space>
            </Card>

            {/* Step 3: Select Department */}
            <Card 
              size="small" 
              style={{ 
                marginBottom: 16,
                backgroundColor: currentStep === 2 ? '#fff7e6' : '#f5f5f5',
                borderColor: currentStep === 2 ? '#faad14' : '#d9d9d9'
              }}
            >
              <Space direction="vertical" style={{ width: '100%' }}>
                <Text strong>Step 3: Select Department {!assignDepartment && <Text type="danger">*</Text>}</Text>
                <Select 
                  placeholder="Choose department for assignment" 
                  size="large"
                  style={{ width: '100%' }}
                  value={assignDepartment}
                  onChange={(value) => {
                    setAssignDepartment(value);
                    if (value && signedDocumentFile) {
                      setCurrentStep(3);
                    }
                  }}
                  disabled={!signedDocumentFile}
                >
                  <Option value="Technical">
                    <div>
                      <Text strong>Technical</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: 11 }}>Head: Mr. Didier Oyong</Text>
                    </div>
                  </Option>
                  <Option value="Business Development & Supply Chain">
                    <div>
                      <Text strong>Business Development & Supply Chain</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: 11 }}>Head: Mr. E.T Kelvin</Text>
                    </div>
                  </Option>
                  <Option value="HR & Admin">
                    <div>
                      <Text strong>HR & Admin</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: 11 }}>Head: Mrs. Bruiline Tsitoh</Text>
                    </div>
                  </Option>
                </Select>
              </Space>
            </Card>

            {/* Step 4: Comments (Optional) */}
            <Card size="small" style={{ marginBottom: 16, backgroundColor: '#f5f5f5' }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Text strong>Step 4: Assignment Comments (Optional)</Text>
                <TextArea 
                  rows={3} 
                  placeholder="Add any comments about this assignment..."
                  maxLength={300}
                  showCount
                  value={assignComments}
                  onChange={(e) => setAssignComments(e.target.value)}
                  disabled={!assignDepartment || !signedDocumentFile}
                />
              </Space>
            </Card>

            {/* Action Buttons */}
            <Space style={{ marginTop: 16, width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => {
                setAssignModalVisible(false);
                resetAssignmentForm();
              }}>
                Cancel
              </Button>
              <Button 
                type="primary" 
                onClick={handleAssign}
                loading={loading}
                icon={<SendOutlined />}
                disabled={!assignDepartment || !signedDocumentFile}
                size="large"
              >
                Sign & Assign PO
              </Button>
            </Space>

            {/* Help Alert */}
            <Alert
              message="Assignment will auto-approve at Supply Chain level"
              description="Once assigned, the PO will move to the Department Head for their review and signature."
              type="info"
              showIcon
              style={{ marginTop: 16 }}
            />
          </div>
        )}
      </Modal>

      {/* Rejection Modal */}
      <Modal
        title={
          <Space>
            <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
            Reject Purchase Order
          </Space>
        }
        open={rejectModalVisible}
        onCancel={() => {
          setRejectModalVisible(false);
          setSelectedPO(null);
          setRejectReason('');
        }}
        footer={null}
        width={500}
      >
        <Alert
          message="Rejection Notice"
          description="The buyer will be notified and can revise the purchase order."
          type="warning"
          showIcon
          style={{ marginBottom: '16px' }}
        />

        <div>
          <div style={{ marginBottom: 16 }}>
            <Text strong>Rejection Reason:</Text>
            <TextArea 
              rows={4} 
              placeholder="Explain why this purchase order is being rejected..."
              maxLength={500}
              showCount
              style={{ marginTop: 8 }}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
          </div>

          <Space style={{ marginTop: 16 }}>
            <Button onClick={() => {
              setRejectModalVisible(false);
              setSelectedPO(null);
              setRejectReason('');
            }}>
              Cancel
            </Button>
            <Button 
              danger
              type="primary" 
              onClick={handleReject}
              loading={loading}
              icon={<CloseCircleOutlined />}
            >
              Reject Purchase Order
            </Button>
          </Space>
        </div>
      </Modal>

      {/* Details Modal */}
      <Modal
        title={<Space><FileTextOutlined /> Purchase Order Details</Space>}
        open={detailsModalVisible}
        onCancel={() => {
          setDetailsModalVisible(false);
          setSelectedPO(null);
        }}
        footer={null}
        width={700}
      >
        {selectedPO && (
          <Descriptions bordered column={2} size="small">
            <Descriptions.Item label="PO Number" span={2}>
              <Text code copyable>{selectedPO.poNumber}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Supplier">
              {selectedPO.supplierName}
            </Descriptions.Item>
            <Descriptions.Item label="Amount">
              <Text strong>{selectedPO.currency} {selectedPO.totalAmount.toLocaleString()}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Items" span={2}>
              {selectedPO.items?.map((item, index) => (
                <div key={index} style={{ marginBottom: 4 }}>
                  {item.quantity}x {item.description}
                </div>
              ))}
            </Descriptions.Item>
            <Descriptions.Item label="Expected Delivery" span={2}>
              {selectedPO.expectedDeliveryDate ? 
                moment(selectedPO.expectedDeliveryDate).format('MMM DD, YYYY') : 
                'Not set'
              }
            </Descriptions.Item>
            <Descriptions.Item label="Payment Terms">
              {selectedPO.paymentTerms}
            </Descriptions.Item>
            <Descriptions.Item label="Created">
              {moment(selectedPO.creationDate).format('MMM DD, YYYY HH:mm')}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default SupplyChainPOManagement;