import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { 
  Table, 
  Tag, 
  Space, 
  Typography, 
  Button, 
  Alert, 
  Spin, 
  Modal, 
  Card,
  Form,
  Input,
  Upload,
  message,
  Divider,
  Tooltip,
  Tabs,
  Badge,
  Row,
  Col,
  Statistic,
  Timeline,
  Descriptions,
  Select,
  Progress,
  Popconfirm,
  Drawer
} from 'antd';
import { 
  FileTextOutlined,
  CheckCircleOutlined, 
  CloseCircleOutlined, 
  ClockCircleOutlined,
  UploadOutlined,
  InboxOutlined,
  FileOutlined,
  SendOutlined,
  ReloadOutlined,
  PlusOutlined,
  TeamOutlined,
  AuditOutlined,
  EyeOutlined,
  HistoryOutlined,
  UserOutlined,
  CalendarOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import api from '../../services/api';

const { Title, Text, Paragraph } = Typography;
const { Dragger } = Upload;
const { TabPane } = Tabs;
const { TextArea } = Input;
const { Option } = Select;

const EmployeeInvoicesDashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const [invoices, setInvoices] = useState([]);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [approvalLoading, setApprovalLoading] = useState(false);
  const [invoiceModalVisible, setInvoiceModalVisible] = useState(false);
  const [approvalDrawerVisible, setApprovalDrawerVisible] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('my-invoices');
  const [form] = Form.useForm();
  const [approvalForm] = Form.useForm();

  // Check if user can approve invoices
  const canApprove = ['supervisor', 'admin'].includes(user?.role);

  // Fetch employee's own invoices
  const fetchMyInvoices = useCallback(async () => {
    try {
      const response = await api.get('/api/invoices/employee');
      if (response.data.success) {
        setInvoices(response.data.data || []);
      } else {
        throw new Error(response.data.message || 'Failed to fetch invoices');
      }
    } catch (error) {
      console.error('Error fetching my invoices:', error);
      setInvoices([]);
      message.error('Failed to load your invoices');
    }
  }, []);

  // Fetch pending approvals for supervisor
  const fetchPendingApprovals = useCallback(async () => {
    if (!canApprove) return;

    try {
      const response = await api.get('/api/invoices/supervisor/pending');
      if (response.data.success) {
        setPendingApprovals(response.data.data || []);
      } else {
        throw new Error(response.data.message || 'Failed to fetch pending approvals');
      }
    } catch (error) {
      console.error('Error fetching pending approvals:', error);
      setPendingApprovals([]);
      if (error.response?.status !== 403) {
        message.error('Failed to load pending approvals');
      }
    }
  }, [canApprove]);

  // Combined fetch function
  const fetchAllData = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchMyInvoices(),
        canApprove ? fetchPendingApprovals() : Promise.resolve()
      ]);
    } finally {
      setLoading(false);
    }
  }, [fetchMyInvoices, fetchPendingApprovals, canApprove]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const handleDownloadAttachment = useCallback(async (attachment) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        message.error('Authentication required');
        return;
      }

      // Extract publicId from Cloudinary URL
      let publicId = '';
      if (attachment.url) {
        const urlParts = attachment.url.split('/');
        const uploadIndex = urlParts.findIndex(part => part === 'upload');
        if (uploadIndex !== -1 && uploadIndex + 2 < urlParts.length) {
          publicId = urlParts.slice(uploadIndex + 2).join('/');
          // Remove file extension from publicId
          const lastPart = publicId.split('/').pop();
          if (lastPart && lastPart.includes('.')) {
            publicId = publicId.replace(/\.[^/.]+$/, '');
          }
        }
      }

      if (!publicId) {
        message.error('Invalid attachment URL');
        return;
      }

      const response = await fetch(`/api/files/download/${encodeURIComponent(publicId)}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      // Create a temporary link to download the file
      const link = document.createElement('a');
      link.href = url;
      link.download = attachment.originalName || attachment.name || 'attachment';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the blob URL
      window.URL.revokeObjectURL(url);
      
      message.success('File downloaded successfully');
    } catch (error) {
      console.error('Error downloading attachment:', error);
      message.error('Failed to download attachment');
      
      // Fallback to direct URL if download fails
      if (attachment.url) {
        window.open(attachment.url, '_blank');
      }
    }
  }, []);

  // Handle invoice upload
  const handleInvoiceUpload = async (values) => {
    try {
      setUploadLoading(true);

      const formData = new FormData();
      formData.append('poNumber', values.poNumber.toUpperCase());
      formData.append('invoiceNumber', values.invoiceNumber);

      if (values.poFile && values.poFile.length > 0) {
        formData.append('poFile', values.poFile[0].originFileObj);
      }

      if (values.invoiceFile && values.invoiceFile.length > 0) {
        formData.append('invoiceFile', values.invoiceFile[0].originFileObj);
      }

      const response = await api.post('/api/invoices/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 60000
      });

      if (response.data.success) {
        message.success('Invoice uploaded successfully! Approval chain has been initiated.');
        setInvoiceModalVisible(false);
        form.resetFields();
        await fetchAllData();
      } else {
        throw new Error(response.data.message || 'Failed to upload invoice');
      }
    } catch (error) {
      console.error('Invoice upload error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to upload invoice';
      message.error(errorMessage);
    } finally {
      setUploadLoading(false);
    }
  };

  // Handle approval decision
  const handleApprovalDecision = async (invoiceId, decision, comments) => {
    try {
      setApprovalLoading(true);

      const response = await api.put(`/api/invoices/approvals/${invoiceId}/decision`, {
        decision,
        comments
      });

      if (response.data.success) {
        const action = decision === 'approved' ? 'approved' : 'rejected';
        message.success(`Invoice ${action} successfully!`);
        setApprovalDrawerVisible(false);
        setSelectedInvoice(null);
        approvalForm.resetFields();
        await fetchAllData();
      } else {
        throw new Error(response.data.message || 'Failed to process approval');
      }
    } catch (error) {
      console.error('Approval error:', error);
      message.error(error.response?.data?.message || 'Failed to process approval');
    } finally {
      setApprovalLoading(false);
    }
  };

  // View invoice details
  const handleViewDetails = async (invoiceId) => {
    try {
      const response = await api.get(`/api/invoices/${invoiceId}`);
      if (response.data.success) {
        setSelectedInvoice(response.data.data);
        setApprovalDrawerVisible(true);
      }
    } catch (error) {
      message.error('Failed to fetch invoice details');
    }
  };

  const getStatusTag = (status) => {
    const statusMap = {
      'pending_finance_assignment': { 
        color: 'orange', 
        icon: <ClockCircleOutlined />, 
        text: 'Pending Assignment' 
      },
      'pending_department_approval': { 
        color: 'blue', 
        icon: <ClockCircleOutlined />, 
        text: 'Department Review' 
      },
      'approved': { 
        color: 'green', 
        icon: <CheckCircleOutlined />, 
        text: 'Approved' 
      },
      'rejected': { 
        color: 'red', 
        icon: <CloseCircleOutlined />, 
        text: 'Rejected' 
      },
      'processed': { 
        color: 'purple', 
        icon: <CheckCircleOutlined />, 
        text: 'Processed' 
      }
    };

    const statusInfo = statusMap[status] || { 
      color: 'default', 
      text: status?.replace(/_/g, ' ') || 'Unknown' 
    };

    return (
      <Tag color={statusInfo.color} icon={statusInfo.icon}>
        {statusInfo.text}
      </Tag>
    );
  };

  const getApprovalProgress = (invoice) => {
    if (!invoice.approvalChain || invoice.approvalChain.length === 0) return 0;
    const approved = invoice.approvalChain.filter(step => step.status === 'approved').length;
    return Math.round((approved / invoice.approvalChain.length) * 100);
  };

  // My Invoices columns
  const myInvoiceColumns = [
    {
      title: 'PO Number',
      dataIndex: 'poNumber',
      key: 'poNumber',
      render: (poNumber) => <Text code>{poNumber || 'N/A'}</Text>,
      width: 150
    },
    {
      title: 'Invoice Number',
      dataIndex: 'invoiceNumber',
      key: 'invoiceNumber',
      width: 150
    },
    {
      title: 'Upload Date',
      key: 'uploadDate',
      render: (_, record) => (
        <div>
          <div>{record.uploadedDate ? new Date(record.uploadedDate).toLocaleDateString('en-GB') : 'N/A'}</div>
          <Text type="secondary" style={{ fontSize: '11px' }}>
            {record.uploadedTime || 'N/A'}
          </Text>
        </div>
      ),
      width: 120,
      sorter: (a, b) => new Date(a.uploadedDate || 0) - new Date(b.uploadedDate || 0)
    },
    {
      title: 'Status',
      dataIndex: 'approvalStatus',
      key: 'status',
      render: (status) => getStatusTag(status),
      width: 150
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
              status={record.approvalStatus === 'rejected' ? 'exception' : 'active'}
              showInfo={false}
            />
            <Text style={{ fontSize: '11px' }}>{progress}%</Text>
          </div>
        );
      },
      width: 100
    },
    {
      title: 'Department',
      dataIndex: 'assignedDepartment',
      key: 'department',
      render: (dept) => dept ? <Tag color="blue">{dept}</Tag> : <Text type="secondary">Not assigned</Text>,
      width: 130
    },
    {
      title: 'Files',
      key: 'files',
      render: (_, record) => (
        <Space>
          {record.poFile && (
            <Button 
              size="small" 
              icon={<FileOutlined />} 
              type="link"
              onClick={() => handleDownloadAttachment(record.poFile)}
            >
              PO
            </Button>
          )}
          {record.invoiceFile && (
            <Button 
              size="small" 
              icon={<FileOutlined />} 
              type="link"
              onClick={() => handleDownloadAttachment(record.invoiceFile)}
            >
              Invoice
            </Button>
          )}
        </Space>
      ),
      width: 100
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button 
          size="small" 
          icon={<EyeOutlined />}
          onClick={() => handleViewDetails(record._id)}
        >
          Details
        </Button>
      ),
      width: 80
    }
  ];

  // Approval columns
  const approvalColumns = [
    {
      title: 'PO Number',
      dataIndex: 'poNumber',
      key: 'poNumber',
      render: (poNumber) => <Text code>{poNumber}</Text>,
      width: 150
    },
    {
      title: 'Employee',
      key: 'employee',
      render: (_, record) => (
        <div>
          <Text strong>{record.employeeDetails?.name || record.employee?.fullName}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.employeeDetails?.department || record.employee?.department}
          </Text>
        </div>
      ),
      width: 180
    },
    {
      title: 'Upload Date',
      key: 'uploadDate',
      render: (_, record) => (
        <div>
          <CalendarOutlined /> {record.uploadedDate ? new Date(record.uploadedDate).toLocaleDateString('en-GB') : 'N/A'}
          <br />
          <Text type="secondary">{record.uploadedTime || 'N/A'}</Text>
        </div>
      ),
      width: 120
    },
    {
      title: 'Current Level',
      key: 'currentLevel',
      render: (_, record) => {
        const currentStep = record.approvalChain?.find(step => step.status === 'pending');
        return currentStep ? (
          <div>
            <Tag color="blue">Level {currentStep.level}</Tag>
            <br />
            <Text type="secondary" style={{ fontSize: '11px' }}>
              {currentStep.approver.role}
            </Text>
          </div>
        ) : 'N/A';
      },
      width: 120
    },
    {
      title: 'Waiting Time',
      key: 'waitingTime',
      render: (_, record) => {
        const assignmentDate = record.assignmentDate || record.createdAt;
        if (!assignmentDate) return 'N/A';
        
        const days = Math.floor((new Date() - new Date(assignmentDate)) / (1000 * 60 * 60 * 24));
        return (
          <Tag color={days > 3 ? 'red' : days > 1 ? 'orange' : 'green'}>
            {days} day{days !== 1 ? 's' : ''}
          </Tag>
        );
      },
      width: 100
    },
    {
      title: 'Files',
      key: 'files',
      render: (_, record) => (
        <Space>
          {record.poFile && (
            <Button 
              size="small" 
              icon={<FileOutlined />} 
              type="link"
              onClick={() => handleDownloadAttachment(record.poFile)}
            >
              PO
            </Button>
          )}
          {record.invoiceFile && (
            <Button 
              size="small" 
              icon={<FileOutlined />} 
              type="link"
              onClick={() => handleDownloadAttachment(record.invoiceFile)}
            >
              Invoice
            </Button>
          )}
        </Space>
      ),
      width: 100
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button 
            size="small" 
            icon={<EyeOutlined />}
            onClick={() => handleViewDetails(record._id)}
          >
            Review
          </Button>
        </Space>
      ),
      width: 80
    }
  ];

  const uploadProps = {
    beforeUpload: () => false,
    maxCount: 1,
    accept: '.pdf,.doc,.docx,.jpg,.jpeg,.png',
    showUploadList: {
      showPreviewIcon: false,
      showRemoveIcon: true,
      showDownloadIcon: false,
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Spin size="large" />
        <div style={{ marginTop: '16px' }}>Loading invoice dashboard...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <Title level={2} style={{ margin: 0 }}>
            <FileTextOutlined /> Invoice Dashboard
          </Title>
          <Space>
            <Button 
              icon={<ReloadOutlined />}
              onClick={fetchAllData}
              loading={loading}
            >
              Refresh
            </Button>
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={() => setInvoiceModalVisible(true)}
            >
              Upload Invoice
            </Button>
          </Space>
        </div>

        {/* Summary Statistics */}
        <Row gutter={16} style={{ marginBottom: '24px' }}>
          <Col span={6}>
            <Statistic
              title="My Invoices"
              value={invoices.length}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="Pending My Review"
              value={invoices.filter(inv => ['pending_finance_assignment', 'pending_department_approval'].includes(inv.approvalStatus)).length}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Col>
          {canApprove && (
            <>
              <Col span={6}>
                <Statistic
                  title="Awaiting My Approval"
                  value={pendingApprovals.length}
                  prefix={<TeamOutlined />}
                  valueStyle={{ color: '#f5222d' }}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="Approved by Me"
                  value={pendingApprovals.filter(inv => 
                    inv.approvalChain?.some(step => 
                      step.approver.email === user.email && step.status === 'approved'
                    )
                  ).length}
                  prefix={<CheckCircleOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Col>
            </>
          )}
        </Row>

        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane 
            tab={
              <Badge count={invoices.length} size="small">
                <span><FileTextOutlined /> My Invoices</span>
              </Badge>
            } 
            key="my-invoices"
          >
            {invoices.length === 0 ? (
              <Alert
                message="No Invoices Found"
                description="You haven't uploaded any invoices yet. Click 'Upload Invoice' to submit your first invoice."
                type="info"
                showIcon
              />
            ) : (
              <Table 
                columns={myInvoiceColumns} 
                dataSource={invoices} 
                rowKey="_id"
                pagination={{ 
                  pageSize: 10,
                  showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} invoices`
                }}
                scroll={{ x: 'max-content' }}
              />
            )}
          </TabPane>

          {canApprove && (
            <TabPane 
              tab={
                <Badge count={pendingApprovals.length} size="small">
                  <span><TeamOutlined /> Pending Approvals ({pendingApprovals.length})</span>
                </Badge>
              } 
              key="approvals"
            >
              {pendingApprovals.length === 0 ? (
                <Alert
                  message="No Pending Approvals"
                  description="You don't have any invoices waiting for your approval at the moment."
                  type="info"
                  showIcon
                />
              ) : (
                <>
                  <Alert
                    message={`You have ${pendingApprovals.length} invoice(s) waiting for your approval`}
                    type="warning"
                    showIcon
                    style={{ marginBottom: '16px' }}
                  />
                  <Table 
                    columns={approvalColumns} 
                    dataSource={pendingApprovals} 
                    rowKey="_id"
                    pagination={{ 
                      pageSize: 10,
                      showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} pending approvals`
                    }}
                    scroll={{ x: 'max-content' }}
                  />
                </>
              )}
            </TabPane>
          )}
        </Tabs>
      </Card>

      {/* Invoice Upload Modal */}
      <Modal
        title={
          <Space>
            <UploadOutlined />
            Upload Invoice
          </Space>
        }
        open={invoiceModalVisible}
        onCancel={() => {
          setInvoiceModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Alert
          message="Invoice Upload Requirements"
          description="Please ensure the PO number follows the format: PO-XX0000000000-X (e.g., PO-NG010000000-1)"
          type="info"
          showIcon
          style={{ marginBottom: '16px' }}
        />

        <Form
          form={form}
          layout="vertical"
          onFinish={handleInvoiceUpload}
        >
          <Form.Item
            name="poNumber"
            label="Purchase Order Number (PO)*"
            rules={[
              { required: true, message: 'Please enter PO number' },
              {
                pattern: /^PO-\w{2}\d{10}-\d+$/i,
                message: 'PO number format should be: PO-XX0000000000-X'
              }
            ]}
          >
            <Input 
              placeholder="e.g., PO-NG010000000-1" 
              style={{ textTransform: 'uppercase' }}
              onChange={(e) => {
                e.target.value = e.target.value.toUpperCase();
              }}
            />
          </Form.Item>

          <Form.Item
            name="invoiceNumber"
            label="Invoice Number*"
            rules={[{ required: true, message: 'Please enter invoice number' }]}
          >
            <Input placeholder="Enter invoice number" />
          </Form.Item>

          <Form.Item
            name="poFile"
            label="PO File (Optional)"
            valuePropName="fileList"
            getValueFromEvent={(e) => Array.isArray(e) ? e : e?.fileList}
          >
            <Dragger {...uploadProps}>
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p className="ant-upload-text">Click or drag PO file here</p>
              <p className="ant-upload-hint">PDF, DOC, DOCX, JPG, PNG (Max: 10MB)</p>
            </Dragger>
          </Form.Item>

          <Form.Item
            name="invoiceFile"
            label="Invoice File (Optional)"
            valuePropName="fileList"
            getValueFromEvent={(e) => Array.isArray(e) ? e : e?.fileList}
          >
            <Dragger {...uploadProps}>
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p className="ant-upload-text">Click or drag invoice file here</p>
              <p className="ant-upload-hint">PDF, DOC, DOCX, JPG, PNG (Max: 10MB)</p>
            </Dragger>
          </Form.Item>

          <Form.Item>
            <Space>
              <Button onClick={() => {
                setInvoiceModalVisible(false);
                form.resetFields();
              }}>
                Cancel
              </Button>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={uploadLoading}
                icon={<SendOutlined />}
              >
                Submit Invoice
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Invoice Details and Approval Drawer */}
      <Drawer
        title={
          <Space>
            <AuditOutlined />
            Invoice Details & Approval
          </Space>
        }
        placement="right"
        width={800}
        open={approvalDrawerVisible}
        onClose={() => {
          setApprovalDrawerVisible(false);
          setSelectedInvoice(null);
          approvalForm.resetFields();
        }}
      >
        {selectedInvoice && (
          <div>
            {/* Invoice Information */}
            <Card size="small" title="Invoice Information" style={{ marginBottom: '16px' }}>
              <Descriptions column={2} size="small">
                <Descriptions.Item label="PO Number">
                  <Text code>{selectedInvoice.poNumber}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Invoice Number">
                  {selectedInvoice.invoiceNumber}
                </Descriptions.Item>
                <Descriptions.Item label="Employee">
                  <div>
                    <Text strong>{selectedInvoice.employeeDetails?.name || selectedInvoice.employee?.fullName}</Text>
                    <br />
                    <Text type="secondary">{selectedInvoice.employeeDetails?.department}</Text>
                  </div>
                </Descriptions.Item>
                <Descriptions.Item label="Upload Date">
                  <CalendarOutlined /> {selectedInvoice.uploadedDate ? new Date(selectedInvoice.uploadedDate).toLocaleDateString('en-GB') : 'N/A'}
                </Descriptions.Item>
                <Descriptions.Item label="Status" span={2}>
                  {getStatusTag(selectedInvoice.approvalStatus)}
                </Descriptions.Item>
              </Descriptions>
            </Card>

            {/* Files */}
            <Card size="small" title="Attached Files" style={{ marginBottom: '16px' }}>
              <Space>
                {selectedInvoice.poFile && (
                  <Button 
                    icon={<FileOutlined />}
                    onClick={() => handleDownloadAttachment(selectedInvoice.poFile)}
                  >
                    Download PO File
                  </Button>
                )}
                {selectedInvoice.invoiceFile && (
                  <Button 
                    icon={<FileOutlined />}
                    onClick={() => handleDownloadAttachment(selectedInvoice.invoiceFile)}
                  >
                    Download Invoice File
                  </Button>
                )}
                {!selectedInvoice.poFile && !selectedInvoice.invoiceFile && (
                  <Text type="secondary">No files attached</Text>
                )}
              </Space>
            </Card>

            {/* Approval Chain */}
            {selectedInvoice.approvalChain && selectedInvoice.approvalChain.length > 0 && (
              <Card size="small" title="Approval Chain Progress" style={{ marginBottom: '16px' }}>
                <Progress 
                  percent={getApprovalProgress(selectedInvoice)} 
                  status={selectedInvoice.approvalStatus === 'rejected' ? 'exception' : 'active'}
                  style={{ marginBottom: '16px' }}
                />
                
                <Timeline>
                  {selectedInvoice.approvalChain.map((step, index) => {
                    let color = 'gray';
                    let icon = <ClockCircleOutlined />;

                    if (step.status === 'approved') {
                      color = 'green';
                      icon = <CheckCircleOutlined />;
                    } else if (step.status === 'rejected') {
                      color = 'red';
                      icon = <CloseCircleOutlined />;
                    }

                    const isCurrentUserStep = step.approver.email === user.email;

                    return (
                      <Timeline.Item key={index} color={color} dot={icon}>
                        <div>
                          <Text strong>Level {step.level}: {step.approver.name}</Text>
                          {isCurrentUserStep && <Tag color="blue" size="small" style={{ marginLeft: 8 }}>YOU</Tag>}
                          <br />
                          <Text type="secondary">{step.approver.role} - {step.approver.email}</Text>
                          <br />
                          {step.status === 'pending' && (
                            <Tag color="orange">Pending Action</Tag>
                          )}
                          {step.status === 'approved' && (
                            <>
                              <Tag color="green">Approved</Tag>
                              <Text type="secondary">
                                {new Date(step.actionDate).toLocaleDateString('en-GB')} at {step.actionTime}
                              </Text>
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
                              <Text type="secondary">
                                {new Date(step.actionDate).toLocaleDateString('en-GB')} at {step.actionTime}
                              </Text>
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
              </Card>
            )}

            {/* Approval Actions - Only show if user can approve this specific invoice */}
            {canApprove && selectedInvoice.approvalChain?.some(step => 
              step.approver.email === user.email && step.status === 'pending'
            ) && (
              <Card size="small" title="Your Decision" style={{ marginBottom: '16px' }}>
                <Alert
                  message="This invoice is waiting for your approval"
                  description="Please review the attached files and approval history before making your decision."
                  type="warning"
                  showIcon
                  style={{ marginBottom: '16px' }}
                />

                <Form
                  form={approvalForm}
                  layout="vertical"
                  onFinish={(values) => {
                    Modal.confirm({
                      title: `Confirm ${values.decision === 'approved' ? 'Approval' : 'Rejection'}`,
                      content: `Are you sure you want to ${values.decision === 'approved' ? 'approve' : 'reject'} this invoice?`,
                      onOk: () => handleApprovalDecision(selectedInvoice._id, values.decision, values.comments),
                    });
                  }}
                >
                  <Form.Item
                    name="decision"
                    label="Decision"
                    rules={[{ required: true, message: 'Please select your decision' }]}
                  >
                    <Select placeholder="Select your decision">
                      <Option value="approved">
                        <CheckCircleOutlined style={{ color: '#52c41a' }} /> Approve
                      </Option>
                      <Option value="rejected">
                        <CloseCircleOutlined style={{ color: '#ff4d4f' }} /> Reject
                      </Option>
                    </Select>
                  </Form.Item>

                  <Form.Item
                    name="comments"
                    label="Comments (Optional)"
                    help="Provide any comments or feedback about your decision"
                  >
                    <TextArea 
                      rows={3} 
                      placeholder="Enter your comments here..."
                      showCount
                      maxLength={500}
                    />
                  </Form.Item>

                  <Form.Item>
                    <Space>
                      <Button 
                        type="primary" 
                        htmlType="submit"
                        loading={approvalLoading}
                        icon={<SendOutlined />}
                      >
                        Submit Decision
                      </Button>
                      <Button onClick={() => approvalForm.resetFields()}>
                        Clear Form
                      </Button>
                    </Space>
                  </Form.Item>
                </Form>
              </Card>
            )}

            {/* Show message if user cannot approve this invoice */}
            {canApprove && !selectedInvoice.approvalChain?.some(step => 
              step.approver.email === user.email && step.status === 'pending'
            ) && (
              <Alert
                message="No Action Required"
                description={
                  selectedInvoice.approvalChain?.some(step => 
                    step.approver.email === user.email && step.status !== 'pending'
                  ) 
                    ? "You have already processed this invoice."
                    : "This invoice is not currently assigned to you for approval."
                }
                type="info"
                showIcon
              />
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default EmployeeInvoicesDashboard;




