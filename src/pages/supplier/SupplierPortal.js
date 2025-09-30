import React, { useState, useEffect, useCallback } from 'react';
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
  Row,
  Col,
  Statistic,
  Timeline,
  Descriptions,
  Progress,
  Badge,
  Steps,
  Empty,
  Drawer,
  List,
  Avatar,
  Select
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
  EyeOutlined,
  DashboardOutlined,
  ShopOutlined,
  HistoryOutlined,
  TruckOutlined,
  SafetyOutlined,
  ToolOutlined,
  BuildOutlined,
  TeamOutlined,
  HomeOutlined,
  GlobalOutlined,
  UserOutlined,
  CalendarOutlined,
  BellOutlined,
  StarOutlined
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;
const { Dragger } = Upload;
const { Step } = Steps;

// Mock API service (replace with your actual API)
const mockApi = {
  submitInvoice: async (formData) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    return {
      data: {
        success: true,
        data: {
          _id: 'INV' + Math.random().toString(36).substr(2, 9),
          invoiceNumber: formData.get('invoiceNumber'),
          contractNumber: formData.get('contractNumber'),
          supplierType: formData.get('supplierType'),
          amount: parseFloat(formData.get('amount')),
          description: formData.get('description'),
          submittedDate: new Date(),
          status: 'pending_review',
          approvalChain: [
            { level: 1, approver: 'Supply Chain Coordinator', status: 'pending' },
            { level: 2, approver: 'Technical Director', status: 'pending' },
            { level: 3, approver: 'Head of Business Dev', status: 'pending' }
          ]
        }
      }
    };
  },
  
  getSupplierInvoices: async () => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return {
      data: {
        success: true,
        data: [
          {
            _id: 'INV001',
            invoiceNumber: 'SUP-2024-001',
            contractNumber: 'CONT-2023-001',
            supplierType: 'HSE',
            amount: 25000,
            description: 'Safety equipment and training materials',
            submittedDate: '2024-01-15T10:30:00Z',
            status: 'approved',
            approvalProgress: 100,
            approvalChain: [
              { 
                level: 1, 
                approver: 'Mr. Ovo Becheni', 
                role: 'HSE Coordinator',
                status: 'approved', 
                actionDate: '2024-01-16T09:15:00Z',
                comments: 'All safety documentation verified'
              },
              { 
                level: 2, 
                approver: 'Mr. Didier Oyong', 
                role: 'Technical Director',
                status: 'approved', 
                actionDate: '2024-01-17T14:20:00Z',
                comments: 'Technical specifications approved'
              },
              { 
                level: 3, 
                approver: 'Mr. E.T Kelvin', 
                role: 'Head of Business Dev',
                status: 'approved', 
                actionDate: '2024-01-18T11:45:00Z',
                comments: 'Final approval granted'
              }
            ]
          },
          {
            _id: 'INV002',
            invoiceNumber: 'SUP-2024-002',
            contractNumber: 'CONT-2023-001',
            supplierType: 'Operations',
            amount: 15750,
            description: 'Equipment maintenance and spare parts',
            submittedDate: '2024-01-20T14:15:00Z',
            status: 'pending_approval',
            approvalProgress: 33,
            approvalChain: [
              { 
                level: 1, 
                approver: 'Mr. Pascal Assam', 
                role: 'Operations Manager',
                status: 'approved', 
                actionDate: '2024-01-21T08:30:00Z',
                comments: 'Operations requirements met'
              },
              { 
                level: 2, 
                approver: 'Mr. Didier Oyong', 
                role: 'Technical Director',
                status: 'pending' 
              },
              { 
                level: 3, 
                approver: 'Mr. E.T Kelvin', 
                role: 'Head of Business Dev',
                status: 'pending' 
              }
            ]
          },
          {
            _id: 'INV003',
            invoiceNumber: 'SUP-2024-003',
            contractNumber: 'CONT-2023-001',
            supplierType: 'General',
            amount: 8500,
            description: 'Office supplies and consumables',
            submittedDate: '2024-01-22T16:45:00Z',
            status: 'rejected',
            approvalProgress: 0,
            rejectionReason: 'Invoice does not match contract specifications. Please revise quantities.',
            approvalChain: [
              { 
                level: 1, 
                approver: 'Mr. E.T Kelvin', 
                role: 'Head of Business Dev',
                status: 'rejected', 
                actionDate: '2024-01-23T10:15:00Z',
                comments: 'Invoice does not match contract specifications. Please revise quantities.'
              }
            ]
          }
        ]
      }
    };
  },
  
  getInvoiceDetails: async (invoiceId) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    const invoices = (await mockApi.getSupplierInvoices()).data.data;
    return {
      data: {
        success: true,
        data: invoices.find(inv => inv._id === invoiceId)
      }
    };
  },
  
  getSupplierProfile: async () => {
    await new Promise(resolve => setTimeout(resolve, 800));
    return {
      data: {
        success: true,
        data: {
          companyName: 'Example Supplies Ltd',
          contactName: 'John Supplier',
          email: 'qiroketeam@gmail.com',
          supplierType: 'General',
          contractInfo: {
            contractNumber: 'CONT-2023-001',
            contractValue: 50000,
            paymentTerms: 'Net 30'
          },
          businessInfo: {
            yearsInBusiness: 5,
            primaryServices: ['Office Supplies', 'Equipment Rental'],
            certifications: ['ISO 9001', 'Green Business Certified']
          },
          performance: {
            totalInvoices: 3,
            approvedInvoices: 1,
            pendingInvoices: 1,
            rejectedInvoices: 1,
            averageProcessingTime: 3.2
          }
        }
      }
    };
  }
};

const SupplierPortal = () => {
  const [invoices, setInvoices] = useState([]);
  const [supplierProfile, setSupplierProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitModalVisible, setSubmitModalVisible] = useState(false);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [dashboardDrawerVisible, setDashboardDrawerVisible] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [form] = Form.useForm();

  // Fetch supplier invoices
  const fetchInvoices = useCallback(async () => {
    try {
      setLoading(true);
      const response = await mockApi.getSupplierInvoices();
      
      if (response.data.success) {
        setInvoices(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching invoices:', error);
      message.error('Failed to load invoices');
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch supplier profile
  const fetchSupplierProfile = useCallback(async () => {
    try {
      const response = await mockApi.getSupplierProfile();
      
      if (response.data.success) {
        setSupplierProfile(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  }, []);

  useEffect(() => {
    fetchInvoices();
    fetchSupplierProfile();
  }, [fetchInvoices, fetchSupplierProfile]);

  // Handle invoice submission
  const handleInvoiceSubmit = async (values) => {
    try {
      setSubmitLoading(true);
      
      const formData = new FormData();
      formData.append('invoiceNumber', values.invoiceNumber);
      formData.append('contractNumber', values.contractNumber);
      formData.append('supplierType', values.supplierType);
      formData.append('amount', values.amount);
      formData.append('description', values.description);
      
      if (values.invoiceFile && values.invoiceFile.length > 0) {
        formData.append('invoiceFile', values.invoiceFile[0].originFileObj);
      }
      
      if (values.supportingDocs && values.supportingDocs.length > 0) {
        values.supportingDocs.forEach(file => {
          formData.append('supportingDocs', file.originFileObj);
        });
      }

      const response = await mockApi.submitInvoice(formData);

      if (response.data.success) {
        message.success('Invoice submitted successfully! You will be notified of any status updates.');
        setSubmitModalVisible(false);
        form.resetFields();
        await fetchInvoices();
      } else {
        throw new Error(response.data.message || 'Failed to submit invoice');
      }
    } catch (error) {
      console.error('Invoice submission error:', error);
      message.error(error.message || 'Failed to submit invoice');
    } finally {
      setSubmitLoading(false);
    }
  };

  // Handle view invoice details
  const handleViewDetails = async (invoiceId) => {
    try {
      const response = await mockApi.getInvoiceDetails(invoiceId);
      
      if (response.data.success) {
        setSelectedInvoice(response.data.data);
        setDetailsModalVisible(true);
      }
    } catch (error) {
      message.error('Failed to fetch invoice details');
    }
  };

  const handleRefresh = async () => {
    await Promise.all([fetchInvoices(), fetchSupplierProfile()]);
    message.success('Data refreshed successfully');
  };

  const getStatusTag = (status) => {
    const statusMap = {
      'pending_review': { 
        color: 'orange', 
        icon: <ClockCircleOutlined />, 
        text: 'Under Review' 
      },
      'pending_approval': { 
        color: 'blue', 
        icon: <ClockCircleOutlined />, 
        text: 'Pending Approval' 
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
      'paid': { 
        color: 'purple', 
        icon: <CheckCircleOutlined />, 
        text: 'Paid' 
      }
    };
    
    const statusInfo = statusMap[status] || { 
      color: 'default', 
      text: status?.replace(/_/g, ' ').toUpperCase() || 'Unknown' 
    };
    
    return (
      <Tag color={statusInfo.color} icon={statusInfo.icon}>
        {statusInfo.text}
      </Tag>
    );
  };

  const getSupplierTypeIcon = (type) => {
    const iconMap = {
      'HSE': <SafetyOutlined style={{ color: '#52c41a' }} />,
      'Refurbishment': <ToolOutlined style={{ color: '#1890ff' }} />,
      'Project': <BuildOutlined style={{ color: '#722ed1' }} />,
      'Operations': <TruckOutlined style={{ color: '#fa8c16' }} />,
      'Diesel': <GlobalOutlined style={{ color: '#eb2f96' }} />,
      'Supply Chain': <ShopOutlined style={{ color: '#13c2c2' }} />,
      'HR/Admin': <TeamOutlined style={{ color: '#52c41a' }} />,
      'General': <HomeOutlined style={{ color: '#595959' }} />
    };
    return iconMap[type] || <FileTextOutlined />;
  };

  const calculateApprovalProgress = (approvalChain) => {
    if (!approvalChain || approvalChain.length === 0) return 0;
    const approved = approvalChain.filter(step => step.status === 'approved').length;
    return Math.round((approved / approvalChain.length) * 100);
  };

  const renderDashboard = () => {
    if (!supplierProfile) return <Spin />;

    const { performance } = supplierProfile;
    
    return (
      <div style={{ padding: '20px' }}>
        <Title level={3}>
          <DashboardOutlined /> Supplier Dashboard
        </Title>
        
        {/* Performance Overview */}
        <Row gutter={16} style={{ marginBottom: '24px' }}>
          <Col span={6}>
            <Statistic
              title="Total Invoices"
              value={performance.totalInvoices}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="Approved"
              value={performance.approvedInvoices}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="Pending"
              value={performance.pendingInvoices}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="Avg Processing Time"
              value={performance.averageProcessingTime}
              suffix="days"
              prefix={<CalendarOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Col>
        </Row>

        {/* Contract Information */}
        <Card title="Contract Information" style={{ marginBottom: '20px' }}>
          <Descriptions column={2} size="small">
            <Descriptions.Item label="Contract Number">
              <Text code>{supplierProfile.contractInfo.contractNumber}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Contract Value">
              <Text strong>${supplierProfile.contractInfo.contractValue.toLocaleString()}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Payment Terms">
              {supplierProfile.contractInfo.paymentTerms}
            </Descriptions.Item>
            <Descriptions.Item label="Supplier Type">
              <Tag color="blue" icon={getSupplierTypeIcon(supplierProfile.supplierType)}>
                {supplierProfile.supplierType}
              </Tag>
            </Descriptions.Item>
          </Descriptions>
        </Card>

        {/* Business Information */}
        <Card title="Business Profile">
          <Descriptions column={1} size="small">
            <Descriptions.Item label="Years in Business">
              {supplierProfile.businessInfo.yearsInBusiness} years
            </Descriptions.Item>
            <Descriptions.Item label="Primary Services">
              <Space>
                {supplierProfile.businessInfo.primaryServices.map(service => (
                  <Tag key={service} color="geekblue">{service}</Tag>
                ))}
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="Certifications">
              <Space>
                {supplierProfile.businessInfo.certifications.map(cert => (
                  <Tag key={cert} color="green" icon={<StarOutlined />}>{cert}</Tag>
                ))}
              </Space>
            </Descriptions.Item>
          </Descriptions>
        </Card>
      </div>
    );
  };

  const invoiceColumns = [
    {
      title: 'Invoice Number',
      dataIndex: 'invoiceNumber',
      key: 'invoiceNumber',
      render: (text) => <Text code>{text}</Text>,
      width: 150
    },
    {
      title: 'Contract',
      dataIndex: 'contractNumber',
      key: 'contractNumber',
      render: (text) => <Text type="secondary">{text}</Text>,
      width: 130
    },
    {
      title: 'Type',
      dataIndex: 'supplierType',
      key: 'supplierType',
      render: (type) => (
        <Tag icon={getSupplierTypeIcon(type)} color="blue">
          {type}
        </Tag>
      ),
      filters: [
        { text: 'HSE', value: 'HSE' },
        { text: 'Operations', value: 'Operations' },
        { text: 'General', value: 'General' },
        { text: 'Project', value: 'Project' },
        { text: 'Refurbishment', value: 'Refurbishment' }
      ],
      onFilter: (value, record) => record.supplierType === value,
      width: 120
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount) => <Text strong>${amount.toLocaleString()}</Text>,
      sorter: (a, b) => a.amount - b.amount,
      width: 100
    },
    {
      title: 'Submitted',
      dataIndex: 'submittedDate',
      key: 'submittedDate',
      render: (date) => (
        <div>
          <div>{new Date(date).toLocaleDateString('en-GB')}</div>
          <Text type="secondary" style={{ fontSize: '11px' }}>
            {new Date(date).toLocaleTimeString('en-GB', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </Text>
        </div>
      ),
      sorter: (a, b) => new Date(a.submittedDate) - new Date(b.submittedDate),
      defaultSortOrder: 'descend',
      width: 120
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => getStatusTag(status),
      filters: [
        { text: 'Under Review', value: 'pending_review' },
        { text: 'Pending Approval', value: 'pending_approval' },
        { text: 'Approved', value: 'approved' },
        { text: 'Rejected', value: 'rejected' },
        { text: 'Paid', value: 'paid' }
      ],
      onFilter: (value, record) => record.status === value,
      width: 130
    },
    {
      title: 'Progress',
      key: 'progress',
      render: (_, record) => {
        const progress = calculateApprovalProgress(record.approvalChain);
        return (
          <div style={{ width: 80 }}>
            <Progress 
              percent={progress} 
              size="small" 
              status={record.status === 'rejected' ? 'exception' : 'active'}
              showInfo={false}
            />
            <Text style={{ fontSize: '11px' }}>{progress}%</Text>
          </div>
        );
      },
      width: 100
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: (text) => (
        <Tooltip title={text}>
          <Text ellipsis style={{ maxWidth: 150 }}>
            {text}
          </Text>
        </Tooltip>
      ),
      width: 180
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
          View
        </Button>
      ),
      width: 80,
      fixed: 'right'
    }
  ];

  const uploadProps = {
    beforeUpload: () => false,
    accept: '.pdf,.doc,.docx,.jpg,.jpeg,.png,.xlsx,.xls',
    showUploadList: {
      showPreviewIcon: false,
      showRemoveIcon: true,
      showDownloadIcon: false
    }
  };

  const supplierTypes = [
    { value: 'HSE', label: 'HSE (Health, Safety & Environment)', icon: <SafetyOutlined /> },
    { value: 'Refurbishment', label: 'Refurbishment', icon: <ToolOutlined /> },
    { value: 'Project', label: 'Project Management', icon: <BuildOutlined /> },
    { value: 'Operations', label: 'Operations & Maintenance', icon: <TruckOutlined /> },
    { value: 'Diesel', label: 'Diesel & Fuel Supply', icon: <GlobalOutlined /> },
    { value: 'Supply Chain', label: 'Supply Chain Services', icon: <ShopOutlined /> },
    { value: 'HR/Admin', label: 'HR & Administrative', icon: <TeamOutlined /> },
    { value: 'General', label: 'General Supplies', icon: <HomeOutlined /> }
  ];

  if (loading && invoices.length === 0) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Spin size="large" />
        <div style={{ marginTop: '16px' }}>Loading your invoices...</div>
      </div>
    );
  }

  const pendingCount = invoices.filter(inv => 
    ['pending_review', 'pending_approval'].includes(inv.status)
  ).length;

  const approvedCount = invoices.filter(inv => inv.status === 'approved').length;

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <Title level={2} style={{ margin: 0 }}>
            <ShopOutlined /> Supplier Portal
          </Title>
          <Space>
            <Button 
              icon={<DashboardOutlined />}
              onClick={() => setDashboardDrawerVisible(true)}
            >
              Dashboard
            </Button>
            <Button 
              icon={<ReloadOutlined />}
              onClick={handleRefresh}
              loading={loading}
            >
              Refresh
            </Button>
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={() => setSubmitModalVisible(true)}
            >
              Submit Invoice
            </Button>
          </Space>
        </div>

        {/* Statistics Cards */}
        <Row gutter={16} style={{ marginBottom: '24px' }}>
          <Col span={6}>
            <Card size="small">
              <Statistic
                title="Total Invoices"
                value={invoices.length}
                prefix={<FileTextOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic
                title="Pending Review"
                value={pendingCount}
                prefix={<ClockCircleOutlined />}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic
                title="Approved"
                value={approvedCount}
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic
                title="Success Rate"
                value={invoices.length > 0 ? Math.round((approvedCount / invoices.length) * 100) : 0}
                suffix="%"
                prefix={<StarOutlined />}
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>
        </Row>

        {pendingCount > 0 && (
          <Alert
            message={`You have ${pendingCount} invoice(s) pending review`}
            description="These invoices are currently being reviewed by the Grato Engineering team."
            type="info"
            showIcon
            icon={<BellOutlined />}
            style={{ marginBottom: '16px' }}
          />
        )}

        {invoices.length === 0 ? (
          <Card>
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <div>
                  <Text>No invoices submitted yet</Text>
                  <br />
                  <Text type="secondary">
                    Click "Submit Invoice" to create your first invoice submission
                  </Text>
                </div>
              }
            >
              <Button type="primary" onClick={() => setSubmitModalVisible(true)}>
                Submit Your First Invoice
              </Button>
            </Empty>
          </Card>
        ) : (
          <Table 
            columns={invoiceColumns} 
            dataSource={invoices} 
            loading={loading}
            rowKey="_id"
            pagination={{ 
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => 
                `${range[0]}-${range[1]} of ${total} invoices`
            }}
            scroll={{ x: 'max-content' }}
            size="small"
          />
        )}
      </Card>

      {/* Dashboard Drawer */}
      <Drawer
        title="Supplier Dashboard"
        placement="right"
        width={800}
        open={dashboardDrawerVisible}
        onClose={() => setDashboardDrawerVisible(false)}
      >
        {renderDashboard()}
      </Drawer>

      {/* Invoice Submission Modal */}
      <Modal
        title={
          <Space>
            <UploadOutlined />
            Submit New Invoice
          </Space>
        }
        open={submitModalVisible}
        onCancel={() => {
          setSubmitModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        width={700}
        destroyOnClose
      >
        <Alert
          message="Invoice Submission Guidelines"
          description="Please ensure all information is accurate and complete. Incomplete submissions may delay processing."
          type="info"
          showIcon
          style={{ marginBottom: '20px' }}
        />
        
        <Form
          form={form}
          layout="vertical"
          onFinish={handleInvoiceSubmit}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="invoiceNumber"
                label="Invoice Number*"
                rules={[{ required: true, message: 'Please enter invoice number' }]}
              >
                <Input placeholder="e.g., SUP-2024-001" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="contractNumber"
                label="Contract Number*"
                rules={[{ required: true, message: 'Please enter contract number' }]}
                initialValue={supplierProfile?.contractInfo?.contractNumber}
              >
                <Input placeholder="e.g., CONT-2023-001" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="supplierType"
                label="Service Category*"
                rules={[{ required: true, message: 'Please select service category' }]}
              >
                <Select placeholder="Select your service category">
                  {supplierTypes.map(type => (
                    <Select.Option key={type.value} value={type.value}>
                      <Space>
                        {type.icon}
                        {type.label}
                      </Space>
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="amount"
                label="Invoice Amount (USD)*"
                rules={[
                  { required: true, message: 'Please enter invoice amount' },
                  { pattern: /^\d+(\.\d{1,2})?$/, message: 'Please enter a valid amount' }
                ]}
              >
                <Input 
                  prefix="$" 
                  placeholder="0.00" 
                  type="number"
                  min={0}
                  step={0.01}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="description"
            label="Invoice Description*"
            rules={[{ required: true, message: 'Please provide invoice description' }]}
          >
            <Input.TextArea 
              rows={3} 
              placeholder="Describe the goods/services provided..."
              showCount
              maxLength={500}
            />
          </Form.Item>

          <Form.Item
            name="invoiceFile"
            label="Invoice Document*"
            rules={[{ required: true, message: 'Please upload invoice document' }]}
            valuePropName="fileList"
            getValueFromEvent={(e) => Array.isArray(e) ? e : e?.fileList}
          >
            <Dragger {...uploadProps} maxCount={1}>
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p className="ant-upload-text">Click or drag invoice file here</p>
              <p className="ant-upload-hint">
                Support: PDF, DOC, DOCX, JPG, PNG (Max: 10MB)
              </p>
            </Dragger>
          </Form.Item>

          <Form.Item
            name="supportingDocs"
            label="Supporting Documents (Optional)"
            valuePropName="fileList"
            getValueFromEvent={(e) => Array.isArray(e) ? e : e?.fileList}
          >
            <Dragger {...uploadProps} multiple maxCount={5}>
              <p className="ant-upload-drag-icon">
                <FileOutlined />
              </p>
              <p className="ant-upload-text">Upload supporting documents</p>
              <p className="ant-upload-hint">
                Purchase orders, delivery notes, etc. (Max: 5 files)
              </p>
            </Dragger>
          </Form.Item>

          <Divider />

          <Form.Item>
            <Space>
              <Button onClick={() => {
                setSubmitModalVisible(false);
                form.resetFields();
              }}>
                Cancel
              </Button>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={submitLoading}
                icon={<SendOutlined />}
              >
                Submit Invoice
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Invoice Details Modal */}
      <Modal
        title={
          <Space>
            <FileTextOutlined />
            Invoice Details & Tracking
          </Space>
        }
        open={detailsModalVisible}
        onCancel={() => {
          setDetailsModalVisible(false);
          setSelectedInvoice(null);
        }}
        footer={null}
        width={900}
      >
        {selectedInvoice && (
          <div>
            {/* Invoice Header */}
            <Card size="small" style={{ marginBottom: '20px' }}>
              <Row gutter={16}>
                <Col span={12}>
                  <Descriptions column={1} size="small">
                    <Descriptions.Item label="Invoice Number">
                      <Text code copyable>{selectedInvoice.invoiceNumber}</Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="Contract Number">
                      <Text code>{selectedInvoice.contractNumber}</Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="Service Category">
                      <Tag icon={getSupplierTypeIcon(selectedInvoice.supplierType)} color="blue">
                        {selectedInvoice.supplierType}
                      </Tag>
                    </Descriptions.Item>
                  </Descriptions>
                </Col>
                <Col span={12}>
                  <Descriptions column={1} size="small">
                    <Descriptions.Item label="Amount">
                      <Text strong style={{ fontSize: '18px', color: '#52c41a' }}>
                        ${selectedInvoice.amount.toLocaleString()}
                      </Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="Status">
                      {getStatusTag(selectedInvoice.status)}
                    </Descriptions.Item>
                    <Descriptions.Item label="Submitted">
                      <Space>
                        <CalendarOutlined />
                        {new Date(selectedInvoice.submittedDate).toLocaleDateString('en-GB')}
                        <Text type="secondary">
                          {new Date(selectedInvoice.submittedDate).toLocaleTimeString('en-GB', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </Text>
                      </Space>
                    </Descriptions.Item>
                  </Descriptions>
                </Col>
              </Row>
            </Card>

            {/* Description */}
            <Card size="small" title="Invoice Description" style={{ marginBottom: '20px' }}>
              <Paragraph>{selectedInvoice.description}</Paragraph>
            </Card>

            {/* Approval Progress */}
            <Card size="small" title="Approval Progress" style={{ marginBottom: '20px' }}>
              <div style={{ marginBottom: '20px' }}>
                <Progress 
                  percent={calculateApprovalProgress(selectedInvoice.approvalChain)} 
                  status={selectedInvoice.status === 'rejected' ? 'exception' : 'active'}
                  strokeWidth={8}
                />
              </div>

              {selectedInvoice.status === 'rejected' && selectedInvoice.rejectionReason && (
                <Alert
                  message="Invoice Rejected"
                  description={selectedInvoice.rejectionReason}
                  type="error"
                  showIcon
                  style={{ marginBottom: '20px' }}
                  action={
                    <Button size="small" type="primary" ghost onClick={() => setSubmitModalVisible(true)}>
                      Resubmit
                    </Button>
                  }
                />
              )}

              <Steps
                direction="vertical"
                size="small"
                current={selectedInvoice.approvalChain.findIndex(step => step.status === 'pending')}
                status={selectedInvoice.status === 'rejected' ? 'error' : 'process'}
              >
                {selectedInvoice.approvalChain.map((step, index) => {
                  let stepStatus = 'wait';
                  let stepIcon = <ClockCircleOutlined />;
                  
                  if (step.status === 'approved') {
                    stepStatus = 'finish';
                    stepIcon = <CheckCircleOutlined />;
                  } else if (step.status === 'rejected') {
                    stepStatus = 'error';
                    stepIcon = <CloseCircleOutlined />;
                  } else if (step.status === 'pending' && selectedInvoice.status !== 'rejected') {
                    stepStatus = 'process';
                  }

                  return (
                    <Step
                      key={index}
                      title={
                        <div>
                          <Text strong>Level {step.level}: {step.approver}</Text>
                          <br />
                          <Text type="secondary" style={{ fontSize: '12px' }}>
                            {step.role}
                          </Text>
                        </div>
                      }
                      status={stepStatus}
                      icon={stepIcon}
                      description={
                        <div>
                          {step.status === 'pending' && selectedInvoice.status !== 'rejected' && (
                            <Tag color="blue">Awaiting Review</Tag>
                          )}
                          {step.status === 'approved' && (
                            <div>
                              <Tag color="green" icon={<CheckCircleOutlined />}>
                                Approved
                              </Tag>
                              <br />
                              <Text type="secondary" style={{ fontSize: '11px' }}>
                                {new Date(step.actionDate).toLocaleDateString('en-GB')} at{' '}
                                {new Date(step.actionDate).toLocaleTimeString('en-GB', { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </Text>
                              {step.comments && (
                                <div style={{ marginTop: 4 }}>
                                  <Text italic style={{ fontSize: '12px' }}>
                                    "{step.comments}"
                                  </Text>
                                </div>
                              )}
                            </div>
                          )}
                          {step.status === 'rejected' && (
                            <div>
                              <Tag color="red" icon={<CloseCircleOutlined />}>
                                Rejected
                              </Tag>
                              <br />
                              <Text type="secondary" style={{ fontSize: '11px' }}>
                                {new Date(step.actionDate).toLocaleDateString('en-GB')} at{' '}
                                {new Date(step.actionDate).toLocaleTimeString('en-GB', { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </Text>
                              {step.comments && (
                                <div style={{ marginTop: 4 }}>
                                  <Text style={{ fontSize: '12px', color: '#ff4d4f' }}>
                                    Reason: "{step.comments}"
                                  </Text>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      }
                    />
                  );
                })}
              </Steps>
            </Card>

            {/* Timeline View */}
            <Card size="small" title={<><HistoryOutlined /> Processing Timeline</>}>
              <Timeline>
                <Timeline.Item color="blue" dot={<UploadOutlined />}>
                  <div>
                    <Text strong>Invoice Submitted</Text>
                    <br />
                    <Text type="secondary">
                      {new Date(selectedInvoice.submittedDate).toLocaleDateString('en-GB')} at{' '}
                      {new Date(selectedInvoice.submittedDate).toLocaleTimeString('en-GB', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      Invoice #{selectedInvoice.invoiceNumber} submitted for review
                    </Text>
                  </div>
                </Timeline.Item>

                {selectedInvoice.approvalChain
                  .filter(step => step.status !== 'pending')
                  .map((step, index) => (
                    <Timeline.Item 
                      key={index}
                      color={step.status === 'approved' ? 'green' : 'red'}
                      dot={step.status === 'approved' ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
                    >
                      <div>
                        <Text strong>
                          {step.status === 'approved' ? 'Approved' : 'Rejected'} by {step.approver}
                        </Text>
                        <br />
                        <Text type="secondary">{step.role}</Text>
                        <br />
                        <Text type="secondary">
                          {new Date(step.actionDate).toLocaleDateString('en-GB')} at{' '}
                          {new Date(step.actionDate).toLocaleTimeString('en-GB', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </Text>
                        {step.comments && (
                          <div style={{ marginTop: 4 }}>
                            <Text italic style={{ fontSize: '12px' }}>
                              "{step.comments}"
                            </Text>
                          </div>
                        )}
                      </div>
                    </Timeline.Item>
                  ))}

                {selectedInvoice.status === 'approved' && (
                  <Timeline.Item color="purple" dot={<CheckCircleOutlined />}>
                    <div>
                      <Text strong>Invoice Fully Approved</Text>
                      <br />
                      <Text type="secondary">Ready for payment processing</Text>
                    </div>
                  </Timeline.Item>
                )}
              </Timeline>
            </Card>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default SupplierPortal;