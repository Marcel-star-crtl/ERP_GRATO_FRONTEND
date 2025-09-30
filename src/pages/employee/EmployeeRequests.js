import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Tabs,
  Form,
  Input,
  Upload,
  message,
  Divider,
  Badge,
  Tooltip
} from 'antd';
import { 
  FileTextOutlined, 
  CheckCircleOutlined, 
  CloseCircleOutlined, 
  ClockCircleOutlined,
  PlusOutlined,
  DollarOutlined,
  ExclamationCircleOutlined,
  UploadOutlined,
  InboxOutlined,
  FileOutlined,
  SendOutlined,
  EyeOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import api from '../../services/api';

const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { Dragger } = Upload;

const EmployeeRequests = () => {
  const [requests, setRequests] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [invoicesLoading, setInvoicesLoading] = useState(false);
  const [error, setError] = useState(null);
  const [canCreateNewRequest, setCanCreateNewRequest] = useState(false);
  const [activeTab, setActiveTab] = useState('requests');
  const [invoiceModalVisible, setInvoiceModalVisible] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [form] = Form.useForm();
  const navigate = useNavigate();

  // Fetch cash requests
  const fetchRequests = useCallback(async () => {
    try {
      console.log('Fetching employee cash requests...');
      const response = await api.get('/api/cash-requests/employee');
      
      console.log('Cash requests response:', response.data);
      
      if (response.data.success) {
        const employeeRequests = response.data.data || [];
        setRequests(employeeRequests);
        checkIfCanCreateNewRequest(employeeRequests);
      } else {
        throw new Error(response.data.message || 'Failed to fetch requests');
      }
    } catch (error) {
      console.error('Error fetching cash requests:', error);
      setError(error.response?.data?.message || 'Failed to fetch cash requests');
      setRequests([]);
    }
  }, []);

  // Fetch invoices
  const fetchInvoices = useCallback(async () => {
    try {
      setInvoicesLoading(true);
      console.log('Fetching employee invoices...');
      
      const response = await api.get('/api/invoices/employee');
      console.log('Invoices response:', response.data);
      
      if (response.data.success) {
        setInvoices(response.data.data || []);
      } else {
        throw new Error(response.data.message || 'Failed to fetch invoices');
      }
    } catch (error) {
      console.error('Error fetching invoices:', error);
      // Don't show error for invoices if it's not critical
      setInvoices([]);
    } finally {
      setInvoicesLoading(false);
    }
  }, []);

  // Initial data fetch
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Always fetch requests, optionally fetch invoices
        await fetchRequests();
        await fetchInvoices();
        
      } catch (error) {
        console.error('Error in initial data fetch:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [fetchRequests, fetchInvoices]);

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

  const checkIfCanCreateNewRequest = (requests) => {
    if (requests.length === 0) {
      setCanCreateNewRequest(true);
      return;
    }

    const sortedRequests = [...requests].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    const latestRequest = sortedRequests[0];
    const allowedStatuses = ['completed', 'denied'];
    const needsJustification = ['disbursed', 'justification_pending_supervisor', 
                              'justification_pending_finance', 'justification_rejected'];
    
    const hasPendingJustification = requests.some(r => needsJustification.includes(r.status));
    
    if (allowedStatuses.includes(latestRequest.status) && !hasPendingJustification) {
      setCanCreateNewRequest(true);
    } else {
      setCanCreateNewRequest(false);
    }
  };

  const showCannotCreateModal = () => {
    Modal.warning({
      title: 'Cannot Create New Request',
      content: (
        <div>
          <p>You currently have a pending cash request that requires your attention.</p>
          <p>Please complete the justification process for your existing request before creating a new one.</p>
        </div>
      ),
      okText: 'View My Requests',
    });
  };

  const handleNewRequestClick = () => {
    if (canCreateNewRequest) {
      navigate('/employee/request/new');
    } else {
      showCannotCreateModal();
    }
  };

  const handleInvoiceUpload = async (values) => {
    try {
      setUploadLoading(true);
      
      console.log('Starting invoice upload with values:', values);
      
      const formData = new FormData();
      formData.append('poNumber', values.poNumber.toUpperCase());
      formData.append('invoiceNumber', values.invoiceNumber);
      
      // Handle PO file
      if (values.poFile && values.poFile.length > 0) {
        console.log('Adding PO file:', values.poFile[0]);
        formData.append('poFile', values.poFile[0].originFileObj);
      }
      
      // Handle Invoice file
      if (values.invoiceFile && values.invoiceFile.length > 0) {
        console.log('Adding invoice file:', values.invoiceFile[0]);
        formData.append('invoiceFile', values.invoiceFile[0].originFileObj);
      }

      console.log('Sending upload request...');
      const response = await api.post('/api/invoices/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000 // 60 second timeout for file uploads
      });

      console.log('Upload response:', response.data);

      if (response.data.success) {
        message.success('Invoice uploaded successfully! Finance team has been notified.');
        setInvoiceModalVisible(false);
        form.resetFields();
        
        // Refresh invoices data
        await fetchInvoices();
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

  const handleRefresh = async () => {
    setLoading(true);
    await Promise.all([fetchRequests(), fetchInvoices()]);
    setLoading(false);
    message.success('Data refreshed successfully');
  };

  // FIXED: Updated to handle correct invoice status values
  const getStatusTag = (status, isInvoice = false) => {
    if (isInvoice) {
      const invoiceStatusMap = {
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
        },
        // Legacy support for old 'pending' status
        'pending': { 
          color: 'orange', 
          icon: <ClockCircleOutlined />, 
          text: 'Pending Review' 
        }
      };
      
      const statusInfo = invoiceStatusMap[status] || { 
        color: 'default', 
        text: status?.replace(/_/g, ' ') || 'Unknown' 
      };
      
      return (
        <Tag color={statusInfo.color} icon={statusInfo.icon}>
          {statusInfo.text}
        </Tag>
      );
    }

    // Cash request statuses
    const statusMap = {
      'pending_supervisor': { 
        color: 'orange', 
        icon: <ClockCircleOutlined />, 
        text: 'Pending Supervisor' 
      },
      'pending_finance': { 
        color: 'blue', 
        icon: <ClockCircleOutlined />, 
        text: 'Pending Finance' 
      },
      'approved': { 
        color: 'green', 
        icon: <CheckCircleOutlined />, 
        text: 'Approved' 
      },
      'denied': { 
        color: 'red', 
        icon: <CloseCircleOutlined />, 
        text: 'Denied' 
      },
      'rejected': { 
        color: 'red', 
        icon: <CloseCircleOutlined />, 
        text: 'Rejected' 
      },
      'disbursed': { 
        color: 'cyan', 
        icon: <DollarOutlined />, 
        text: 'Disbursed - Need Justification' 
      },
      'justification_pending_supervisor': { 
        color: 'purple', 
        icon: <ClockCircleOutlined />, 
        text: 'Justification - Pending Supervisor' 
      },
      'justification_pending_finance': { 
        color: 'geekblue', 
        icon: <ClockCircleOutlined />, 
        text: 'Justification - Pending Finance' 
      },
      'justification_rejected': { 
        color: 'red', 
        icon: <ExclamationCircleOutlined />, 
        text: 'Justification Rejected' 
      },
      'completed': { 
        color: 'green', 
        icon: <CheckCircleOutlined />, 
        text: 'Completed' 
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

  const getActionButtons = (record) => {
    const buttons = [
      <Button 
        type="link" 
        icon={<EyeOutlined />}
        onClick={() => navigate(`/employee/request/${record._id}`)}
        disabled={!record._id}
        key="view"
      >
        View Details
      </Button>
    ];

    if (record.status === 'disbursed') {
      buttons.push(
        <Button 
          type="link" 
          onClick={() => navigate(`/employee/request/${record._id}/justify`)}
          disabled={!record._id}
          style={{ color: '#1890ff' }}
          key="justify"
        >
          Submit Justification
        </Button>
      );
    }

    if (record.status === 'justification_rejected') {
      buttons.push(
        <Button 
          type="link" 
          onClick={() => navigate(`/employee/request/${record._id}/justify`)}
          disabled={!record._id}
          style={{ color: '#faad14' }}
          key="resubmit"
        >
          Resubmit Justification
        </Button>
      );
    }

    return buttons;
  };

  const requestColumns = [
    {
      title: 'Request ID',
      dataIndex: '_id',
      key: '_id',
      render: (id) => id ? `REQ-${id.slice(-6).toUpperCase()}` : 'N/A',
      width: 120
    },
    {
      title: 'Amount Requested',
      dataIndex: 'amountRequested',
      key: 'amount',
      render: (amount) => `XAF ${Number(amount || 0).toLocaleString()}`,
      sorter: (a, b) => (a.amountRequested || 0) - (b.amountRequested || 0),
      width: 150
    },
    {
      title: 'Type',
      dataIndex: 'requestType',
      key: 'type',
      render: (type) => type ? type.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'N/A',
      width: 120
    },
    {
      title: 'Purpose',
      dataIndex: 'purpose',
      key: 'purpose',
      render: (purpose) => purpose ? (
        <Tooltip title={purpose}>
          <Text ellipsis style={{ maxWidth: 200 }}>
            {purpose.length > 50 ? `${purpose.substring(0, 50)}...` : purpose}
          </Text>
        </Tooltip>
      ) : 'N/A',
      ellipsis: true
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => getStatusTag(status),
      filters: [
        { text: 'Pending Supervisor', value: 'pending_supervisor' },
        { text: 'Pending Finance', value: 'pending_finance' },
        { text: 'Approved', value: 'approved' },
        { text: 'Disbursed', value: 'disbursed' },
        { text: 'Completed', value: 'completed' },
        { text: 'Denied', value: 'denied' },
      ],
      onFilter: (value, record) => record.status === value,
      width: 200
    },
    {
      title: 'Date Submitted',
      dataIndex: 'createdAt',
      key: 'date',
      render: (date) => date ? new Date(date).toLocaleDateString('en-GB') : 'N/A',
      sorter: (a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0),
      defaultSortOrder: 'descend',
      width: 120
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="small">
          {getActionButtons(record)}
        </Space>
      ),
      width: 200
    }
  ];

  const invoiceColumns = [
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
      render: (invoiceNumber) => invoiceNumber || 'N/A',
      width: 150
    },
    {
      title: 'Employee',
      key: 'employee',
      render: (_, record) => (
        <div>
          <Text strong>{record.employeeDetails?.name || record.employee?.fullName || 'N/A'}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.employeeDetails?.department || record.employee?.department || 'N/A'}
          </Text>
        </div>
      ),
      width: 150
    },
    {
      title: 'Upload Date/Time',
      key: 'uploadDateTime',
      render: (_, record) => (
        <div>
          <div>{record.uploadedDate ? new Date(record.uploadedDate).toLocaleDateString('en-GB') : 'N/A'}</div>
          <Text type="secondary" style={{ fontSize: '11px' }}>
            {record.uploadedTime || record.formattedUploadDateTime || 'N/A'}
          </Text>
        </div>
      ),
      sorter: (a, b) => new Date(a.uploadedDate || 0) - new Date(b.uploadedDate || 0),
      defaultSortOrder: 'descend',
      width: 140
    },
    {
      title: 'Status',
      dataIndex: 'approvalStatus',
      key: 'status',
      render: (status) => getStatusTag(status, true),
      filters: [
        { text: 'Pending Assignment', value: 'pending_finance_assignment' },
        { text: 'Department Review', value: 'pending_department_approval' },
        { text: 'Approved', value: 'approved' },
        { text: 'Rejected', value: 'rejected' },
        { text: 'Processed', value: 'processed' },
        // Legacy support
        { text: 'Pending Review', value: 'pending' },
      ],
      onFilter: (value, record) => record.approvalStatus === value,
      width: 150
    },
    {
      title: 'Department',
      dataIndex: 'assignedDepartment',
      key: 'assignedDepartment',
      render: (dept) => dept ? <Tag color="blue">{dept}</Tag> : <Text type="secondary">Not assigned</Text>,
      width: 130
    },
    {
      title: 'Files',
      key: 'files',
      render: (_, record) => (
        <Space>
          {record.poFile && (
            <Tooltip title={record.poFile.originalName}>
              <Button 
                size="small" 
                icon={<FileOutlined />} 
                type="link"
                onClick={() => handleDownloadAttachment(record.poFile)}
              >
                PO
              </Button>
            </Tooltip>
          )}
          {record.invoiceFile && (
            <Tooltip title={record.invoiceFile.originalName}>
              <Button 
                size="small" 
                icon={<FileOutlined />} 
                type="link"
                onClick={() => handleDownloadAttachment(record.invoiceFile)}
              >
                Invoice
              </Button>
            </Tooltip>
          )}
        </Space>
      ),
      width: 100
    },
    {
      title: 'Comments',
      dataIndex: 'rejectionComments',
      key: 'comments',
      render: (comments) => comments ? (
        <Button size="small" type="link" onClick={() => {
          Modal.info({
            title: 'Rejection Comments',
            content: comments,
            width: 500
          });
        }}>
          View Comments
        </Button>
      ) : 'No comments',
      width: 120
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

  const totalPending = requests.filter(r => 
    ['disbursed', 'justification_rejected'].includes(r.status)
  ).length;

  // FIXED: Updated to handle correct invoice status
  const totalPendingInvoices = invoices.filter(inv =>
    ['pending_finance_assignment', 'pending'].includes(inv.approvalStatus)
  ).length;

  if (loading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Spin size="large" />
        <div style={{ marginTop: '16px' }}>Loading your data...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <Title level={2} style={{ margin: 0 }}>
            <FileTextOutlined /> Employee Dashboard
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
              type="default" 
              icon={<UploadOutlined />}
              onClick={() => setInvoiceModalVisible(true)}
            >
              Upload Invoice
            </Button>
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={handleNewRequestClick}
            >
              New Cash Request
            </Button>
          </Space>
        </div>

        {error && (
          <Alert
            message="Error Loading Data"
            description={error}
            type="error"
            showIcon
            closable
            style={{ marginBottom: '16px' }}
            onClose={() => setError(null)}
          />
        )}

        {totalPending > 0 && (
          <Alert
            message={`You have ${totalPending} cash request(s) that need your attention`}
            type="warning"
            showIcon
            style={{ marginBottom: '16px' }}
            action={
              <Button size="small" type="primary" onClick={() => setActiveTab('requests')}>
                View Pending
              </Button>
            }
          />
        )}

        {totalPendingInvoices > 0 && (
          <Alert
            message={`You have ${totalPendingInvoices} invoice(s) waiting for finance assignment`}
            type="info"
            showIcon
            style={{ marginBottom: '16px' }}
            action={
              <Button size="small" type="default" onClick={() => setActiveTab('invoices')}>
                View Invoices
              </Button>
            }
          />
        )}

        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane 
            tab={
              <Badge count={totalPending} offset={[10, 0]}>
                <span>
                  <DollarOutlined />
                  Cash Requests ({requests.length})
                </span>
              </Badge>
            } 
            key="requests"
          >
            {requests.length === 0 ? (
              <Alert
                message="No Cash Requests Found"
                description="You haven't submitted any cash requests yet. Click the 'New Cash Request' button to create your first request."
                type="info"
                showIcon
                style={{ marginBottom: '16px' }}
              />
            ) : (
              <Table 
                columns={requestColumns} 
                dataSource={requests} 
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
                  const needsAttention = ['disbursed', 'justification_rejected'];
                  if (needsAttention.includes(record.status)) {
                    return 'highlight-row'; 
                  }
                  return '';
                }}
              />
            )}
          </TabPane>
          
          <TabPane 
            tab={
              <Badge count={totalPendingInvoices} offset={[10, 0]}>
                <span>
                  <FileOutlined />
                  Invoice Uploads ({invoices.length})
                </span>
              </Badge>
            } 
            key="invoices"
          >
            {invoices.length === 0 ? (
              <Alert
                message="No Invoice Uploads Found"
                description="You haven't uploaded any invoices yet. Click the 'Upload Invoice' button to submit your first invoice."
                type="info"
                showIcon
                style={{ marginBottom: '16px' }}
              />
            ) : (
              <Table 
                columns={invoiceColumns} 
                dataSource={invoices} 
                loading={invoicesLoading}
                rowKey={(record) => record._id || `${record.poNumber}-${record.invoiceNumber}`}
                pagination={{ 
                  pageSize: 10,
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (total, range) => 
                    `${range[0]}-${range[1]} of ${total} invoices`
                }}
                scroll={{ x: 'max-content' }}
              />
            )}
          </TabPane>
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
                message: 'PO number format should be: PO-XX0000000000-X (e.g., PO-NG010000000-1)'
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
            help="Upload the Purchase Order file (PDF, DOC, DOCX, JPG, PNG)"
          >
            <Dragger {...uploadProps}>
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p className="ant-upload-text">Click or drag PO file to this area to upload</p>
              <p className="ant-upload-hint">
                Support for PDF, DOC, DOCX, JPG, PNG files (Max: 10MB)
              </p>
            </Dragger>
          </Form.Item>

          <Form.Item
            name="invoiceFile"
            label="Invoice File (Optional)"
            valuePropName="fileList"
            getValueFromEvent={(e) => Array.isArray(e) ? e : e?.fileList}
            help="Upload the Invoice file (PDF, DOC, DOCX, JPG, PNG)"
          >
            <Dragger {...uploadProps}>
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p className="ant-upload-text">Click or drag invoice file to this area to upload</p>
              <p className="ant-upload-hint">
                Support for PDF, DOC, DOCX, JPG, PNG files (Max: 10MB)
              </p>
            </Dragger>
          </Form.Item>

          <Divider />

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

      <style jsx>{`
        .highlight-row {
          background-color: #fff7e6 !important;
        }
        .highlight-row:hover {
          background-color: #fff1d6 !important;
        }
      `}</style>
    </div>
  );
};

export default EmployeeRequests;




