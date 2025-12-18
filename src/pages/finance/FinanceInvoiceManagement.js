import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Table,
  Tag,
  Space,
  Typography,
  Button,
  Alert,
  Spin,
  message,
  Modal,
  Select,
  Form,
  Input,
  Divider,
  Badge,
  Tooltip,
  Progress,
  Tabs,
  Upload,
  Steps
} from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  UserOutlined,
  CalendarOutlined,
  BankOutlined,
  TeamOutlined,
  FileOutlined,
  DownloadOutlined,
  EyeOutlined,
  ReloadOutlined,
  SendOutlined,
  SettingOutlined,
  ExclamationCircleOutlined,
  FilterOutlined,
  UploadOutlined,
  InboxOutlined,
  DollarOutlined
} from '@ant-design/icons';
import api from '../../services/api';

const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;
const { TextArea } = Input;
const { Dragger } = Upload;
const { Step } = Steps;

const FinanceInvoiceManagement = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [bulkForm] = Form.useForm();
  const [approvalForm] = Form.useForm();
  
  const [invoices, setInvoices] = useState([]);
  const [supplierInvoices, setSupplierInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [bulkAssignModalVisible, setBulkAssignModalVisible] = useState(false);
  const [approvalModalVisible, setApprovalModalVisible] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [assigning, setAssigning] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [departmentEmployees, setDepartmentEmployees] = useState([]);
  const [activeTab, setActiveTab] = useState('unassigned');
  
  // Finance approval states
  const [signedDocumentFile, setSignedDocumentFile] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [downloadingInvoice, setDownloadingInvoice] = useState(false);
  const [documentDownloaded, setDocumentDownloaded] = useState(false);
  
  const [stats, setStats] = useState({
    unassigned: 0,
    assigned: 0,
    pendingFinance: 0,
    approved: 0,
    rejected: 0,
    processed: 0
  });

  useEffect(() => {
    fetchAllInvoices();
    fetchDepartments();
  }, []);

  const fetchAllInvoices = async () => {
    try {
      setLoading(true);
      
      // Fetch both employee and supplier invoices
      const [employeeRes, supplierRes] = await Promise.all([
        api.get('/invoices/finance').catch(() => ({ data: { success: false, data: [] } })),
        api.get('/suppliers/admin/invoices').catch(() => ({ data: { success: false, data: [] } }))
      ]);
      
      const employeeInvs = employeeRes.data.success ? employeeRes.data.data : [];
      const supplierInvs = supplierRes.data.success ? supplierRes.data.data : [];
      
      setInvoices(employeeInvs.map(inv => ({ ...inv, invoiceType: 'employee' })));
      setSupplierInvoices(supplierInvs.map(inv => ({ ...inv, invoiceType: 'supplier' })));
      
      // Calculate stats
      const allInvoices = [...employeeInvs, ...supplierInvs];
      setStats({
        unassigned: allInvoices.filter(inv => 
          inv.approvalStatus === 'pending_finance_assignment' ||
          inv.approvalStatus === 'pending_supply_chain_assignment'
        ).length,
        assigned: allInvoices.filter(inv => 
          inv.approvalStatus?.includes('pending') && 
          inv.approvalStatus !== 'pending_finance_assignment' &&
          inv.approvalStatus !== 'pending_supply_chain_assignment' &&
          inv.approvalStatus !== 'pending_finance_approval'
        ).length,
        pendingFinance: allInvoices.filter(inv => 
          inv.approvalStatus === 'pending_finance_approval'
        ).length,
        approved: allInvoices.filter(inv => inv.approvalStatus === 'approved').length,
        rejected: allInvoices.filter(inv => inv.approvalStatus === 'rejected').length,
        processed: allInvoices.filter(inv => 
          inv.approvalStatus === 'processed' || inv.approvalStatus === 'paid'
        ).length
      });
      
    } catch (error) {
      console.error('Error fetching invoices:', error);
      message.error('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    const mockDepartments = [
      'Business Development & Supply Chain',
      'HR & Admin',
      'Technical',
      'Finance'
    ];
    setDepartments(mockDepartments);
  };

  const handleDownloadInvoice = async (invoice) => {
    try {
      setDownloadingInvoice(true);
      
      const response = await api.get(
        `/suppliers/invoices/${invoice._id}/download-for-signing`
      );
      
      if (response.data.success) {
        const { url, originalName } = response.data.data;
        
        // ✅ FIXED: Handle both local and Cloudinary URLs
        let downloadUrl = url;
        
        // If it's a local path (starts with /uploads), prepend the API base URL
        if (url.startsWith('/uploads')) {
          const baseURL = api.defaults.baseURL || 'http://localhost:5001';
          downloadUrl = `${baseURL}${url}`;
        }
        
        // Create a temporary link and trigger download
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = originalName || 'invoice.pdf';
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        message.success('Invoice downloaded successfully. Please sign and upload.');
        setDocumentDownloaded(true);
        setCurrentStep(1);
      }
    } catch (error) {
      console.error('Error downloading invoice:', error);
      message.error(error.response?.data?.message || 'Failed to download invoice');
    } finally {
      setDownloadingInvoice(false);
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

  const handleFinanceApproval = async (values) => {
    if (!selectedInvoice) return;

    try {
      setProcessing(true);
      
      const isSupplierInvoice = selectedInvoice.invoiceType === 'supplier';
      
      // For supplier invoices, require signed document if approving
      if (isSupplierInvoice && values.decision === 'approved' && !signedDocumentFile) {
        message.error('Please download, sign, and upload the document before approving.');
        setProcessing(false);
        return;
      }
      
      const endpoint = isSupplierInvoice 
        ? `/suppliers/supervisor/invoices/${selectedInvoice._id}/decision`
        : `/invoices/finance/${selectedInvoice._id}/approve`;
      
      let response;
      
      if (isSupplierInvoice && values.decision === 'approved') {
        // Upload with signed document
        const formData = new FormData();
        formData.append('decision', values.decision);
        formData.append('comments', values.comments || '');
        formData.append('signedDocument', signedDocumentFile);
        
        response = await api.put(endpoint, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
      } else {
        // Regular approval without document
        response = await api.put(endpoint, {
          decision: values.decision,
          comments: values.comments
        });
      }
      
      if (response.data.success) {
        message.success(`Invoice ${values.decision} successfully`);
        setApprovalModalVisible(false);
        approvalForm.resetFields();
        resetSigningWorkflow();
        setSelectedInvoice(null);
        await fetchAllInvoices();
      }
    } catch (error) {
      console.error('Finance approval error:', error);
      message.error(error.response?.data?.message || 'Failed to process approval');
    } finally {
      setProcessing(false);
    }
  };

  const handleMarkAsProcessed = async (invoice) => {
    try {
      setProcessing(true);
      
      const isSupplierInvoice = invoice.invoiceType === 'supplier';
      const endpoint = isSupplierInvoice
        ? `/suppliers/admin/invoices/${invoice._id}/process`
        : `/invoices/finance/${invoice._id}/process`;
      
      const response = await api.put(endpoint, {
        comments: 'Invoice processed and ready for payment'
      });
      
      if (response.data.success) {
        message.success('Invoice marked as processed successfully');
        await fetchAllInvoices();
      }
    } catch (error) {
      console.error('Error marking as processed:', error);
      message.error('Failed to mark invoice as processed');
    } finally {
      setProcessing(false);
    }
  };

  const resetSigningWorkflow = () => {
    setSignedDocumentFile(null);
    setDocumentDownloaded(false);
    setCurrentStep(0);
  };

  const handleAssignInvoice = async (values) => {
    try {
      setAssigning(true);
      
      const isSupplierInvoice = selectedInvoice.invoiceType === 'supplier';
      const endpoint = isSupplierInvoice
        ? `/suppliers/admin/invoices/${selectedInvoice._id}/assign`
        : `/invoices/finance/assign/${selectedInvoice._id}`;
      
      const response = await api.post(endpoint, {
        department: values.department,
        comments: values.comments
      });
      
      if (response.data.success) {
        message.success('Invoice assigned successfully');
        setAssignModalVisible(false);
        setSelectedInvoice(null);
        form.resetFields();
        await fetchAllInvoices();
      }
    } catch (error) {
      console.error('Error assigning invoice:', error);
      message.error(error.response?.data?.message || 'Failed to assign invoice');
    } finally {
      setAssigning(false);
    }
  };

  const handleBulkAssign = async (values) => {
    try {
      setAssigning(true);
      
      // Separate employee and supplier invoices
      const employeeIds = selectedRowKeys.filter(id => 
        invoices.some(inv => inv._id === id)
      );
      const supplierIds = selectedRowKeys.filter(id => 
        supplierInvoices.some(inv => inv._id === id)
      );
      
      const promises = [];
      
      if (employeeIds.length > 0) {
        promises.push(
          api.post('/invoices/finance/bulk-assign', {
            invoiceIds: employeeIds,
            department: values.department,
            comments: values.comments
          })
        );
      }
      
      if (supplierIds.length > 0) {
        promises.push(
          api.post('/suppliers/admin/invoices/bulk-assign', {
            invoiceIds: supplierIds,
            department: values.department,
            comments: values.comments
          })
        );
      }
      
      await Promise.all(promises);
      
      message.success(`${selectedRowKeys.length} invoices assigned successfully`);
      setBulkAssignModalVisible(false);
      setSelectedRowKeys([]);
      bulkForm.resetFields();
      await fetchAllInvoices();
      
    } catch (error) {
      console.error('Error bulk assigning invoices:', error);
      message.error('Failed to bulk assign invoices');
    } finally {
      setAssigning(false);
    }
  };

  const getStatusTag = (status) => {
    const statusMap = {
      'pending_finance_assignment': { 
        color: 'orange', 
        icon: <ClockCircleOutlined />, 
        text: 'Pending Assignment' 
      },
      'pending_supply_chain_assignment': {
        color: 'gold',
        icon: <ClockCircleOutlined />,
        text: 'Pending SC Assignment'
      },
      'pending_department_approval': { 
        color: 'blue', 
        icon: <ClockCircleOutlined />, 
        text: 'Department Review' 
      },
      'pending_department_head_approval': {
        color: 'blue',
        icon: <ClockCircleOutlined />,
        text: 'Dept Head Review'
      },
      'pending_head_of_business_approval': {
        color: 'blue',
        icon: <ClockCircleOutlined />,
        text: 'HOB Review'
      },
      'pending_finance_approval': {
        color: 'purple',
        icon: <ClockCircleOutlined />,
        text: 'Finance Approval Required'
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
      'paid': {
        color: 'cyan',
        icon: <DollarOutlined />,
        text: 'Paid'
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

  const getFilteredInvoices = () => {
    const allInvoices = [...invoices, ...supplierInvoices];
    
    switch (activeTab) {
      case 'unassigned':
        return allInvoices.filter(inv => 
          inv.approvalStatus === 'pending_finance_assignment' ||
          inv.approvalStatus === 'pending_supply_chain_assignment'
        );
      case 'assigned':
        return allInvoices.filter(inv => 
          inv.approvalStatus?.includes('pending') && 
          inv.approvalStatus !== 'pending_finance_assignment' &&
          inv.approvalStatus !== 'pending_supply_chain_assignment' &&
          inv.approvalStatus !== 'pending_finance_approval'
        );
      case 'pendingFinance':
        return allInvoices.filter(inv => 
          inv.approvalStatus === 'pending_finance_approval'
        );
      case 'approved':
        return allInvoices.filter(inv => inv.approvalStatus === 'approved');
      case 'rejected':
        return allInvoices.filter(inv => inv.approvalStatus === 'rejected');
      case 'processed':
        return allInvoices.filter(inv => 
          inv.approvalStatus === 'processed' || inv.approvalStatus === 'paid'
        );
      default:
        return allInvoices;
    }
  };

  const invoiceColumns = [
    {
      title: 'Type',
      dataIndex: 'invoiceType',
      key: 'type',
      width: 80,
      render: (type) => (
        <Tag color={type === 'supplier' ? 'green' : 'blue'}>
          {type === 'supplier' ? 'Supplier' : 'Employee'}
        </Tag>
      )
    },
    {
      title: 'Invoice Details',
      key: 'invoiceDetails',
      render: (_, record) => (
        <div>
          <Text strong code>{record.poNumber}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: '12px' }}>
            Invoice: {record.invoiceNumber}
          </Text>
        </div>
      ),
      width: 150
    },
    {
      title: 'Entity/Employee',
      key: 'entity',
      render: (_, record) => (
        <div>
          <Text strong>
            {record.invoiceType === 'supplier' 
              ? record.supplierDetails?.companyName 
              : record.employeeDetails?.name || 'N/A'
            }
          </Text>
          <br />
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.invoiceType === 'supplier'
              ? record.supplierDetails?.contactName
              : record.employeeDetails?.position || 'N/A'
            }
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
        </div>
      ),
      sorter: (a, b) => new Date(a.uploadedDate || 0) - new Date(b.uploadedDate || 0),
      width: 120
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, record) => getStatusTag(record.approvalStatus),
      width: 160
    },
    {
      title: 'Assignment',
      key: 'assignment',
      render: (_, record) => (
        <div>
          {record.assignedDepartment ? (
            <>
              <Tag color="green">{record.assignedDepartment}</Tag>
              <br />
              <Text type="secondary" style={{ fontSize: '11px' }}>
                {record.assignmentDate ? new Date(record.assignmentDate).toLocaleDateString('en-GB') : 'N/A'}
              </Text>
            </>
          ) : (
            <Tag color="orange">Not Assigned</Tag>
          )}
        </div>
      ),
      width: 150
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space direction="vertical" size="small">
          <Button 
            type="link" 
            icon={<EyeOutlined />}
            onClick={() => navigate(`/finance/invoice/${record._id}`)}
            size="small"
          >
            View
          </Button>
          
          {(record.approvalStatus === 'pending_finance_assignment' || 
            record.approvalStatus === 'pending_supply_chain_assignment') && (
            <Button 
              type="primary"
              size="small"
              icon={<SendOutlined />}
              onClick={() => {
                setSelectedInvoice(record);
                setAssignModalVisible(true);
              }}
            >
              Assign
            </Button>
          )}
          
          {record.approvalStatus === 'pending_finance_approval' && (
            <Button 
              type="primary"
              size="small"
              icon={<CheckCircleOutlined />}
              onClick={() => {
                setSelectedInvoice(record);
                setApprovalModalVisible(true);
                resetSigningWorkflow();
              }}
            >
              Review & Approve
            </Button>
          )}
          
          {record.approvalStatus === 'approved' && (
            <Button 
              type="default"
              size="small"
              icon={<CheckCircleOutlined />}
              onClick={() => handleMarkAsProcessed(record)}
              loading={processing}
            >
              Mark Processed
            </Button>
          )}
        </Space>
      ),
      width: 140,
      fixed: 'right'
    }
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: setSelectedRowKeys,
    getCheckboxProps: (record) => ({
      disabled: record.approvalStatus !== 'pending_finance_assignment' &&
                record.approvalStatus !== 'pending_supply_chain_assignment'
    }),
  };

  const filteredInvoices = getFilteredInvoices();
  const canBulkAssign = selectedRowKeys.length > 0 && activeTab === 'unassigned';

  if (loading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Spin size="large" />
        <div style={{ marginTop: '16px' }}>Loading invoice management...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      {/* Stats Cards */}
      <div style={{ marginBottom: '24px' }}>
        <Space size="large" wrap>
          <Card size="small" style={{ minWidth: '150px' }}>
            <Badge count={stats.unassigned} offset={[10, 0]} color="#faad14">
              <div>
                <Text type="secondary">Unassigned</Text>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#faad14' }}>
                  {stats.unassigned}
                </div>
              </div>
            </Badge>
          </Card>
          
          <Card size="small" style={{ minWidth: '150px' }}>
            <div>
              <Text type="secondary">In Review</Text>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1890ff' }}>
                {stats.assigned}
              </div>
            </div>
          </Card>
          
          <Card size="small" style={{ minWidth: '150px' }}>
            <Badge count={stats.pendingFinance} offset={[10, 0]} color="#722ed1">
              <div>
                <Text type="secondary">Pending Finance</Text>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#722ed1' }}>
                  {stats.pendingFinance}
                </div>
              </div>
            </Badge>
          </Card>
          
          <Card size="small" style={{ minWidth: '150px' }}>
            <div>
              <Text type="secondary">Approved</Text>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#52c41a' }}>
                {stats.approved}
              </div>
            </div>
          </Card>
          
          <Card size="small" style={{ minWidth: '150px' }}>
            <div>
              <Text type="secondary">Rejected</Text>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ff4d4f' }}>
                {stats.rejected}
              </div>
            </div>
          </Card>

          <Card size="small" style={{ minWidth: '150px' }}>
            <div>
              <Text type="secondary">Processed</Text>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#722ed1' }}>
                {stats.processed}
              </div>
            </div>
          </Card>
        </Space>
      </div>

      {/* Main Content */}
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <Title level={2} style={{ margin: 0 }}>
            <BankOutlined /> Finance Invoice Management
          </Title>
          <Space>
            <Button 
              icon={<ReloadOutlined />}
              onClick={fetchAllInvoices}
              loading={loading}
            >
              Refresh
            </Button>
            {canBulkAssign && (
              <Button 
                type="primary"
                icon={<SendOutlined />}
                onClick={() => setBulkAssignModalVisible(true)}
              >
                Bulk Assign ({selectedRowKeys.length})
              </Button>
            )}
          </Space>
        </div>

        {(stats.unassigned > 0 || stats.pendingFinance > 0) && (
          <Alert
            message={
              <>
                {stats.unassigned > 0 && `${stats.unassigned} invoice(s) waiting for assignment. `}
                {stats.pendingFinance > 0 && `${stats.pendingFinance} invoice(s) require your approval.`}
              </>
            }
            type="warning"
            showIcon
            style={{ marginBottom: '16px' }}
          />
        )}

        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane 
            tab={
              <Badge count={stats.unassigned} offset={[10, 0]} color="#faad14">
                <span>Unassigned ({stats.unassigned})</span>
              </Badge>
            } 
            key="unassigned"
          >
            <Table 
              columns={invoiceColumns} 
              dataSource={filteredInvoices} 
              loading={loading}
              rowKey="_id"
              rowSelection={rowSelection}
              pagination={{ pageSize: 10 }}
              scroll={{ x: 'max-content' }}
            />
          </TabPane>
          
          <TabPane 
            tab={<span>In Review ({stats.assigned})</span>} 
            key="assigned"
          >
            <Table 
              columns={invoiceColumns} 
              dataSource={filteredInvoices} 
              loading={loading}
              rowKey="_id"
              pagination={{ pageSize: 10 }}
              scroll={{ x: 'max-content' }}
            />
          </TabPane>

          <TabPane 
            tab={
              <Badge count={stats.pendingFinance} offset={[10, 0]} color="#722ed1">
                <span>Pending Finance ({stats.pendingFinance})</span>
              </Badge>
            } 
            key="pendingFinance"
          >
            <Table 
              columns={invoiceColumns} 
              dataSource={filteredInvoices} 
              loading={loading}
              rowKey="_id"
              pagination={{ pageSize: 10 }}
              scroll={{ x: 'max-content' }}
            />
          </TabPane>

          <TabPane 
            tab={<span>Approved ({stats.approved})</span>} 
            key="approved"
          >
            <Table 
              columns={invoiceColumns} 
              dataSource={filteredInvoices} 
              loading={loading}
              rowKey="_id"
              pagination={{ pageSize: 10 }}
              scroll={{ x: 'max-content' }}
            />
          </TabPane>

          <TabPane 
            tab={<span>Rejected ({stats.rejected})</span>} 
            key="rejected"
          >
            <Table 
              columns={invoiceColumns} 
              dataSource={filteredInvoices} 
              loading={loading}
              rowKey="_id"
              pagination={{ pageSize: 10 }}
              scroll={{ x: 'max-content' }}
            />
          </TabPane>

          <TabPane 
            tab={<span>Processed ({stats.processed})</span>} 
            key="processed"
          >
            <Table 
              columns={invoiceColumns} 
              dataSource={filteredInvoices} 
              loading={loading}
              rowKey="_id"
              pagination={{ pageSize: 10 }}
              scroll={{ x: 'max-content' }}
            />
          </TabPane>
        </Tabs>
      </Card>

      {/* Finance Approval Modal */}
      <Modal
        title={
          <Space>
            <CheckCircleOutlined />
            Finance Approval - Sign & Approve Invoice
          </Space>
        }
        open={approvalModalVisible}
        onCancel={() => {
          setApprovalModalVisible(false);
          setSelectedInvoice(null);
          approvalForm.resetFields();
          resetSigningWorkflow();
        }}
        footer={null}
        width={800}
        maskClosable={false}
      >
        {selectedInvoice && (
          <div>
            <Alert
              message="Finance Approval Required"
              description={`You are the final approver for ${selectedInvoice.invoiceType} invoice ${selectedInvoice.invoiceNumber}. ${selectedInvoice.invoiceType === 'supplier' ? 'Document signing is required.' : ''}`}
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />

            {selectedInvoice.invoiceType === 'supplier' && (
              <>
                <Steps current={currentStep} style={{ marginBottom: 24 }}>
                  <Step title="Download" icon={<DownloadOutlined />} />
                  <Step title="Sign" icon={<FileTextOutlined />} />
                  <Step title="Upload" icon={<UploadOutlined />} />
                  <Step title="Approve" icon={<SendOutlined />} />
                </Steps>

                <Card size="small" style={{ marginBottom: 16 }}>
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Text strong>Step 1: Download Invoice</Text>
                    <Button
                      type="primary"
                      icon={<DownloadOutlined />}
                      loading={downloadingInvoice}
                      onClick={() => handleDownloadInvoice(selectedInvoice)}
                      disabled={documentDownloaded}
                      block
                    >
                      {documentDownloaded ? 'Downloaded ✓' : 'Download Invoice'}
                    </Button>
                  </Space>
                </Card>

                <Card size="small" style={{ marginBottom: 16 }}>
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Text strong>Step 2: Upload Signed Document</Text>
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

                <Divider />
              </>
            )}

            <Form
              form={approvalForm}
              layout="vertical"
              onFinish={handleFinanceApproval}
            >
              <Form.Item
                name="decision"
                label="Your Decision"
                rules={[{ required: true, message: 'Please make a decision' }]}
              >
                <Select
                  placeholder="Select your decision"
                  disabled={selectedInvoice.invoiceType === 'supplier' && !signedDocumentFile}
                >
                  <Option value="approved">
                    <CheckCircleOutlined style={{ color: '#52c41a' }} /> Approve Invoice
                  </Option>
                  <Option value="rejected">
                    <CloseCircleOutlined style={{ color: '#f5222d' }} /> Reject Invoice
                  </Option>
                </Select>
              </Form.Item>

              <Form.Item
                name="comments"
                label="Comments"
                rules={[{ required: true, message: 'Please provide comments' }]}
              >
                <TextArea 
                  rows={4} 
                  placeholder="Provide your decision rationale..."
                  maxLength={500}
                  showCount
                />
              </Form.Item>

              <Form.Item>
                <Space>
                  <Button onClick={() => {
                    setApprovalModalVisible(false);
                    setSelectedInvoice(null);
                    approvalForm.resetFields();
                    resetSigningWorkflow();
                  }}>
                    Cancel
                  </Button>
                  <Button 
                    type="primary" 
                    htmlType="submit"
                    loading={processing}
                    disabled={selectedInvoice.invoiceType === 'supplier' && !signedDocumentFile}
                  >
                    Submit Decision
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>

      {/* Assignment Modal */}
      <Modal
        title={
          <Space>
            <SendOutlined />
            Assign Invoice to Department
          </Space>
        }
        open={assignModalVisible}
        onCancel={() => {
          setAssignModalVisible(false);
          setSelectedInvoice(null);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        {selectedInvoice && (
          <>
            <Alert
              message={
                <div>
                  <strong>Invoice:</strong> {selectedInvoice.poNumber} | 
                  <strong> Type:</strong> {selectedInvoice.invoiceType}
                </div>
              }
              type="info"
              showIcon
              style={{ marginBottom: '16px' }}
            />
            
            <Form
              form={form}
              layout="vertical"
              onFinish={handleAssignInvoice}
            >
              <Form.Item
                name="department"
                label="Assign to Department"
                rules={[{ required: true, message: 'Please select a department' }]}
              >
                <Select placeholder="Select department">
                  {departments.map(dept => (
                    <Option key={dept} value={dept}>{dept}</Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item
                name="comments"
                label="Assignment Comments (Optional)"
              >
                <TextArea 
                  rows={3} 
                  placeholder="Add any comments about this assignment..."
                  maxLength={300}
                  showCount
                />
              </Form.Item>

              <Divider />

              <Form.Item style={{ marginBottom: 0 }}>
                <Space>
                  <Button onClick={() => {
                    setAssignModalVisible(false);
                    setSelectedInvoice(null);
                    form.resetFields();
                  }}>
                    Cancel
                  </Button>
                  <Button 
                    type="primary" 
                    htmlType="submit" 
                    loading={assigning}
                    icon={<SendOutlined />}
                  >
                    Assign Invoice
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </>
        )}
      </Modal>

      {/* Bulk Assignment Modal */}
      <Modal
        title={
          <Space>
            <SendOutlined />
            Bulk Assign Invoices ({selectedRowKeys.length})
          </Space>
        }
        open={bulkAssignModalVisible}
        onCancel={() => {
          setBulkAssignModalVisible(false);
          bulkForm.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Alert
          message={`You are about to assign ${selectedRowKeys.length} invoice(s) to a department`}
          type="warning"
          showIcon
          style={{ marginBottom: '16px' }}
        />
        
        <Form
          form={bulkForm}
          layout="vertical"
          onFinish={handleBulkAssign}
        >
          <Form.Item
            name="department"
            label="Assign to Department"
            rules={[{ required: true, message: 'Please select a department' }]}
          >
            <Select placeholder="Select department">
              {departments.map(dept => (
                <Option key={dept} value={dept}>{dept}</Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="comments"
            label="Assignment Comments (Optional)"
          >
            <TextArea 
              rows={3} 
              placeholder="Add any comments about this bulk assignment..."
              maxLength={300}
              showCount
            />
          </Form.Item>

          <Divider />

          <Form.Item style={{ marginBottom: 0 }}>
            <Space>
              <Button onClick={() => {
                setBulkAssignModalVisible(false);
                bulkForm.resetFields();
              }}>
                Cancel
              </Button>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={assigning}
                icon={<SendOutlined />}
              >
                Assign {selectedRowKeys.length} Invoices
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default FinanceInvoiceManagement;









// import React, { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import {
//   Card,
//   Table,
//   Tag,
//   Space,
//   Typography,
//   Button,
//   Alert,
//   Spin,
//   message,
//   Modal,
//   Select,
//   Form,
//   Input,
//   Divider,
//   Badge,
//   Tooltip,
//   Progress,
//   Tabs
// } from 'antd';
// import {
//   CheckCircleOutlined,
//   CloseCircleOutlined,
//   ClockCircleOutlined,
//   FileTextOutlined,
//   UserOutlined,
//   CalendarOutlined,
//   BankOutlined,
//   TeamOutlined,
//   FileOutlined,
//   DownloadOutlined,
//   EyeOutlined,
//   ReloadOutlined,
//   SendOutlined,
//   SettingOutlined,
//   ExclamationCircleOutlined,
//   FilterOutlined
// } from '@ant-design/icons';
// import api from '../../services/api';

// const { Title, Text } = Typography;
// const { Option } = Select;
// const { TabPane } = Tabs;

// const FinanceInvoiceManagement = () => {
//   const navigate = useNavigate();
//   const [form] = Form.useForm();
//   const [bulkForm] = Form.useForm();
  
//   const [invoices, setInvoices] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [assignModalVisible, setAssignModalVisible] = useState(false);
//   const [bulkAssignModalVisible, setBulkAssignModalVisible] = useState(false);
//   const [selectedInvoice, setSelectedInvoice] = useState(null);
//   const [selectedRowKeys, setSelectedRowKeys] = useState([]);
//   const [assigning, setAssigning] = useState(false);
//   const [departments, setDepartments] = useState([]);
//   const [departmentEmployees, setDepartmentEmployees] = useState([]);
//   const [activeTab, setActiveTab] = useState('unassigned');
//   const [stats, setStats] = useState({
//     unassigned: 0,
//     assigned: 0,
//     approved: 0,
//     rejected: 0,
//     processed: 0
//   });

//   useEffect(() => {
//     fetchInvoices();
//     fetchDepartments();
//   }, []);

//   const fetchInvoices = async () => {
//     try {
//       setLoading(true);
//       console.log('Fetching finance invoices...');
      
//       // Mock data for demonstration
//       const mockResponse = {
//         success: true,
//         data: [
//           {
//             _id: '1',
//             poNumber: 'PO-NG0100000001-1',
//             invoiceNumber: 'INV-2024-001',
//             employeeDetails: {
//               name: 'Ms. Sarah Johnson',
//               email: 'sarah.johnson@gratoengineering.com',
//               department: 'Business Development',
//               position: 'Project Coordinator'
//             },
//             uploadedDate: '2024-08-14T10:30:00Z',
//             uploadedTime: '10:30:00',
//             approvalStatus: 'pending_finance_assignment',
//             assignedDepartment: null,
//             currentApprovalLevel: 0,
//             poFile: { 
//               originalName: 'PO_Document_1.pdf', 
//               url: '#',
//               publicId: 'sample_po_1'
//             },
//             invoiceFile: { 
//               originalName: 'Invoice_001.pdf', 
//               url: '#',
//               publicId: 'sample_invoice_1'
//             }
//           },
//           {
//             _id: '2',
//             poNumber: 'PO-NG0100000002-1',
//             invoiceNumber: 'INV-2024-002',
//             employeeDetails: {
//               name: 'Mr. Cristabel Maneni',
//               email: 'cristabel.maneni@gratoengineering.com',
//               department: 'Business Development',
//               position: 'Order Management Assistant'
//             },
//             uploadedDate: '2024-08-15T14:20:00Z',
//             uploadedTime: '14:20:00',
//             approvalStatus: 'pending_department_approval',
//             assignedDepartment: 'Business Development',
//             currentApprovalLevel: 1,
//             assignmentDate: '2024-08-15T15:00:00Z',
//             assignmentTime: '15:00:00',
//             approvalChain: [
//               {
//                 level: 1,
//                 approver: {
//                   name: 'Mr. Lukong Lambert',
//                   email: 'lukong.lambert@gratoengineering.com',
//                   role: 'Supply Chain Coordinator',
//                   department: 'Business Development'
//                 },
//                 status: 'pending'
//               },
//               {
//                 level: 2,
//                 approver: {
//                   name: 'Mr. E.T Kelvin',
//                   email: 'et.kelvin@gratoengineering.com',
//                   role: 'Department Head',
//                   department: 'Business Development'
//                 },
//                 status: 'pending'
//               }
//             ],
//             poFile: { 
//               originalName: 'PO_Document_2.pdf', 
//               url: '#',
//               publicId: 'sample_po_2'
//             },
//             invoiceFile: { 
//               originalName: 'Invoice_002.pdf', 
//               url: '#',
//               publicId: 'sample_invoice_2'
//             }
//           },
//           {
//             _id: '3',
//             poNumber: 'PO-NG0100000003-1',
//             invoiceNumber: 'INV-2024-003',
//             employeeDetails: {
//               name: 'Mr. John Doe',
//               email: 'john.doe@gratoengineering.com',
//               department: 'Engineering',
//               position: 'Senior Engineer'
//             },
//             uploadedDate: '2024-08-13T09:15:00Z',
//             uploadedTime: '09:15:00',
//             approvalStatus: 'approved',
//             assignedDepartment: 'Engineering',
//             currentApprovalLevel: 0,
//             assignmentDate: '2024-08-13T10:00:00Z',
//             assignmentTime: '10:00:00',
//             approvalChain: [
//               {
//                 level: 1,
//                 approver: {
//                   name: 'Mr. Tech Lead',
//                   email: 'tech.lead@gratoengineering.com',
//                   role: 'Technical Lead',
//                   department: 'Engineering'
//                 },
//                 status: 'approved',
//                 actionDate: '2024-08-13T14:30:00Z',
//                 comments: 'Approved after technical review'
//               }
//             ],
//             poFile: { 
//               originalName: 'PO_Document_3.pdf', 
//               url: '#',
//               publicId: 'sample_po_3'
//             },
//             invoiceFile: { 
//               originalName: 'Invoice_003.pdf', 
//               url: '#',
//               publicId: 'sample_invoice_3'
//             }
//           }
//         ],
//         stats: {
//           unassigned: 1,
//           assigned: 1,
//           approved: 1,
//           rejected: 0,
//           processed: 0
//         }
//       };
      
//       if (mockResponse.success) {
//         setInvoices(mockResponse.data || []);
//         setStats(mockResponse.stats || {});
//       } else {
//         throw new Error('Failed to fetch invoices');
//       }
//     } catch (error) {
//       console.error('Error fetching invoices:', error);
//       message.error('Failed to load invoices');
//       setInvoices([]);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const fetchDepartments = async () => {
//     try {
//       // Mock departments data
//       const mockDepartments = [
//         'Business Development',
//         'Engineering',
//         'Operations',
//         'Marketing',
//         'Human Resources',
//         'Finance'
//       ];
//       setDepartments(mockDepartments);
//     } catch (error) {
//       console.error('Error fetching departments:', error);
//     }
//   };

//   const fetchDepartmentEmployees = async (department) => {
//     try {
//       // Mock employee data based on department
//       const mockEmployees = {
//         'Business Development': [
//           { id: '1', name: 'Mr. Lukong Lambert', role: 'Supply Chain Coordinator', email: 'lukong.lambert@gratoengineering.com' },
//           { id: '2', name: 'Mr. E.T Kelvin', role: 'Department Head', email: 'et.kelvin@gratoengineering.com' }
//         ],
//         'Engineering': [
//           { id: '3', name: 'Mr. Tech Lead', role: 'Technical Lead', email: 'tech.lead@gratoengineering.com' },
//           { id: '4', name: 'Ms. Jane Engineer', role: 'Senior Engineer', email: 'jane.engineer@gratoengineering.com' }
//         ]
//       };
      
//       setDepartmentEmployees(mockEmployees[department] || []);
//     } catch (error) {
//       console.error('Error fetching department employees:', error);
//       setDepartmentEmployees([]);
//     }
//   };

//   const handleAssignInvoice = async (values) => {
//     try {
//       setAssigning(true);
      
//       // Mock API call
//       console.log('Assigning invoice:', {
//         invoiceId: selectedInvoice._id,
//         department: values.department,
//         approvers: values.approvers,
//         comments: values.comments
//       });
      
//       await new Promise(resolve => setTimeout(resolve, 2000));
      
//       message.success('Invoice assigned successfully');
//       setAssignModalVisible(false);
//       setSelectedInvoice(null);
//       form.resetFields();
//       await fetchInvoices();
      
//     } catch (error) {
//       console.error('Error assigning invoice:', error);
//       message.error('Failed to assign invoice');
//     } finally {
//       setAssigning(false);
//     }
//   };

//   const handleBulkAssign = async (values) => {
//     try {
//       setAssigning(true);
      
//       // Mock API call
//       console.log('Bulk assigning invoices:', {
//         invoiceIds: selectedRowKeys,
//         department: values.department,
//         approvers: values.approvers,
//         comments: values.comments
//       });
      
//       await new Promise(resolve => setTimeout(resolve, 2000));
      
//       message.success(`${selectedRowKeys.length} invoices assigned successfully`);
//       setBulkAssignModalVisible(false);
//       setSelectedRowKeys([]);
//       bulkForm.resetFields();
//       await fetchInvoices();
      
//     } catch (error) {
//       console.error('Error bulk assigning invoices:', error);
//       message.error('Failed to bulk assign invoices');
//     } finally {
//       setAssigning(false);
//     }
//   };

//   const handleMarkAsProcessed = async (invoiceId) => {
//     try {
//       // Mock API call
//       console.log('Marking invoice as processed:', invoiceId);
      
//       await new Promise(resolve => setTimeout(resolve, 1000));
      
//       message.success('Invoice marked as processed');
//       await fetchInvoices();
      
//     } catch (error) {
//       console.error('Error marking as processed:', error);
//       message.error('Failed to mark invoice as processed');
//     }
//   };

//   const handleRefresh = async () => {
//     await fetchInvoices();
//     message.success('Data refreshed successfully');
//   };

//   const getStatusTag = (status) => {
//     const statusMap = {
//       'pending_finance_assignment': { 
//         color: 'orange', 
//         icon: <ClockCircleOutlined />, 
//         text: 'Pending Assignment' 
//       },
//       'pending_department_approval': { 
//         color: 'blue', 
//         icon: <ClockCircleOutlined />, 
//         text: 'Department Review' 
//       },
//       'approved': { 
//         color: 'green', 
//         icon: <CheckCircleOutlined />, 
//         text: 'Approved' 
//       },
//       'rejected': { 
//         color: 'red', 
//         icon: <CloseCircleOutlined />, 
//         text: 'Rejected' 
//       },
//       'processed': { 
//         color: 'purple', 
//         icon: <CheckCircleOutlined />, 
//         text: 'Processed' 
//       }
//     };
    
//     const statusInfo = statusMap[status] || { 
//       color: 'default', 
//       text: status?.replace(/_/g, ' ') || 'Unknown' 
//     };
    
//     return (
//       <Tag color={statusInfo.color} icon={statusInfo.icon}>
//         {statusInfo.text}
//       </Tag>
//     );
//   };

//   const getApprovalProgress = (approvalChain) => {
//     if (!approvalChain || approvalChain.length === 0) return 0;
//     const approved = approvalChain.filter(step => step.status === 'approved').length;
//     return Math.round((approved / approvalChain.length) * 100);
//   };

//   const getFilteredInvoices = () => {
//     switch (activeTab) {
//       case 'unassigned':
//         return invoices.filter(inv => inv.approvalStatus === 'pending_finance_assignment');
//       case 'assigned':
//         return invoices.filter(inv => inv.approvalStatus === 'pending_department_approval');
//       case 'approved':
//         return invoices.filter(inv => inv.approvalStatus === 'approved');
//       case 'rejected':
//         return invoices.filter(inv => inv.approvalStatus === 'rejected');
//       case 'processed':
//         return invoices.filter(inv => inv.approvalStatus === 'processed');
//       default:
//         return invoices;
//     }
//   };

//   const invoiceColumns = [
//     {
//       title: 'Invoice Details',
//       key: 'invoiceDetails',
//       render: (_, record) => (
//         <div>
//           <Text strong code>{record.poNumber}</Text>
//           <br />
//           <Text type="secondary" style={{ fontSize: '12px' }}>
//             Invoice: {record.invoiceNumber}
//           </Text>
//         </div>
//       ),
//       width: 150
//     },
//     {
//       title: 'Employee',
//       key: 'employee',
//       render: (_, record) => (
//         <div>
//           <Text strong>{record.employeeDetails?.name || 'N/A'}</Text>
//           <br />
//           <Text type="secondary" style={{ fontSize: '12px' }}>
//             {record.employeeDetails?.position || 'N/A'}
//           </Text>
//           <br />
//           <Tag color="blue" size="small">{record.employeeDetails?.department || 'N/A'}</Tag>
//         </div>
//       ),
//       width: 180
//     },
//     {
//       title: 'Upload Date',
//       key: 'uploadDate',
//       render: (_, record) => (
//         <div>
//           <CalendarOutlined /> {record.uploadedDate ? new Date(record.uploadedDate).toLocaleDateString('en-GB') : 'N/A'}
//           <br />
//           <Text type="secondary" style={{ fontSize: '11px' }}>
//             {record.uploadedTime || 'N/A'}
//           </Text>
//         </div>
//       ),
//       sorter: (a, b) => new Date(a.uploadedDate || 0) - new Date(b.uploadedDate || 0),
//       defaultSortOrder: 'descend',
//       width: 120
//     },
//     {
//       title: 'Status & Progress',
//       key: 'statusProgress',
//       render: (_, record) => (
//         <div>
//           {getStatusTag(record.approvalStatus)}
//           <br />
//           {record.approvalChain && record.approvalChain.length > 0 && (
//             <div style={{ marginTop: '8px', width: '100px' }}>
//               <Progress 
//                 percent={getApprovalProgress(record.approvalChain)} 
//                 size="small"
//                 status={record.approvalStatus === 'rejected' ? 'exception' : 'active'}
//               />
//               <Text type="secondary" style={{ fontSize: '10px' }}>
//                 Level {record.currentApprovalLevel} of {record.approvalChain?.length || 0}
//               </Text>
//             </div>
//           )}
//         </div>
//       ),
//       width: 160
//     },
//     {
//       title: 'Assignment',
//       key: 'assignment',
//       render: (_, record) => (
//         <div>
//           {record.assignedDepartment ? (
//             <>
//               <Tag color="green">{record.assignedDepartment}</Tag>
//               <br />
//               <Text type="secondary" style={{ fontSize: '11px' }}>
//                 Assigned: {record.assignmentDate ? new Date(record.assignmentDate).toLocaleDateString('en-GB') : 'N/A'}
//               </Text>
//             </>
//           ) : (
//             <Tag color="orange">Not Assigned</Tag>
//           )}
//         </div>
//       ),
//       width: 150
//     },
//     {
//       title: 'Files',
//       key: 'files',
//       render: (_, record) => (
//         <Space direction="vertical" size="small">
//           {record.poFile && (
//             <Tooltip title={record.poFile.originalName}>
//               <Button 
//                 size="small" 
//                 icon={<FileOutlined />} 
//                 type="link"
//                 onClick={() => window.open(record.poFile.url, '_blank')}
//               >
//                 <DownloadOutlined /> PO
//               </Button>
//             </Tooltip>
//           )}
//           {record.invoiceFile && (
//             <Tooltip title={record.invoiceFile.originalName}>
//               <Button 
//                 size="small" 
//                 icon={<FileOutlined />} 
//                 type="link"
//                 onClick={() => window.open(record.invoiceFile.url, '_blank')}
//               >
//                 <DownloadOutlined /> Invoice
//               </Button>
//             </Tooltip>
//           )}
//         </Space>
//       ),
//       width: 100
//     },
//     {
//       title: 'Actions',
//       key: 'actions',
//       render: (_, record) => (
//         <Space direction="vertical" size="small">
//           <Button 
//             type="link" 
//             icon={<EyeOutlined />}
//             onClick={() => navigate(`/finance/invoice/${record._id}`)}
//             size="small"
//           >
//             View Details
//           </Button>
//           {record.approvalStatus === 'pending_finance_assignment' && (
//             <Button 
//               type="primary"
//               size="small"
//               icon={<SendOutlined />}
//               onClick={() => {
//                 setSelectedInvoice(record);
//                 setAssignModalVisible(true);
//               }}
//             >
//               Assign
//             </Button>
//           )}
//           {record.approvalStatus === 'approved' && (
//             <Button 
//               type="default"
//               size="small"
//               icon={<CheckCircleOutlined />}
//               onClick={() => handleMarkAsProcessed(record._id)}
//             >
//               Mark Processed
//             </Button>
//           )}
//         </Space>
//       ),
//       width: 120
//     }
//   ];

//   const rowSelection = {
//     selectedRowKeys,
//     onChange: setSelectedRowKeys,
//     getCheckboxProps: (record) => ({
//       disabled: record.approvalStatus !== 'pending_finance_assignment'
//     }),
//   };

//   const unassignedInvoices = getFilteredInvoices();
//   const canBulkAssign = selectedRowKeys.length > 0 && activeTab === 'unassigned';

//   if (loading) {
//     return (
//       <div style={{ padding: '24px', textAlign: 'center' }}>
//         <Spin size="large" />
//         <div style={{ marginTop: '16px' }}>Loading invoice management...</div>
//       </div>
//     );
//   }

//   return (
//     <div style={{ padding: '24px' }}>
//       {/* Stats Cards */}
//       <div style={{ marginBottom: '24px' }}>
//         <Space size="large" wrap>
//           <Card size="small" style={{ minWidth: '150px' }}>
//             <Badge count={stats.unassigned} offset={[10, 0]} color="#faad14">
//               <div>
//                 <Text type="secondary">Unassigned</Text>
//                 <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#faad14' }}>
//                   {stats.unassigned}
//                 </div>
//               </div>
//             </Badge>
//           </Card>
          
//           <Card size="small" style={{ minWidth: '150px' }}>
//             <div>
//               <Text type="secondary">In Review</Text>
//               <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1890ff' }}>
//                 {stats.assigned}
//               </div>
//             </div>
//           </Card>
          
//           <Card size="small" style={{ minWidth: '150px' }}>
//             <div>
//               <Text type="secondary">Approved</Text>
//               <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#52c41a' }}>
//                 {stats.approved}
//               </div>
//             </div>
//           </Card>
          
//           <Card size="small" style={{ minWidth: '150px' }}>
//             <div>
//               <Text type="secondary">Rejected</Text>
//               <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ff4d4f' }}>
//                 {stats.rejected}
//               </div>
//             </div>
//           </Card>

//           <Card size="small" style={{ minWidth: '150px' }}>
//             <div>
//               <Text type="secondary">Processed</Text>
//               <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#722ed1' }}>
//                 {stats.processed}
//               </div>
//             </div>
//           </Card>
//         </Space>
//       </div>

//       {/* Main Content */}
//       <Card>
//         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
//           <Title level={2} style={{ margin: 0 }}>
//             <BankOutlined /> Invoice Management
//           </Title>
//           <Space>
//             <Button 
//               icon={<ReloadOutlined />}
//               onClick={handleRefresh}
//               loading={loading}
//             >
//               Refresh
//             </Button>
//             {canBulkAssign && (
//               <Button 
//                 type="primary"
//                 icon={<SendOutlined />}
//                 onClick={() => setBulkAssignModalVisible(true)}
//               >
//                 Bulk Assign ({selectedRowKeys.length})
//               </Button>
//             )}
//           </Space>
//         </div>

//         {stats.unassigned > 0 && (
//           <Alert
//             message={`${stats.unassigned} invoice(s) are waiting for department assignment`}
//             type="warning"
//             showIcon
//             style={{ marginBottom: '16px' }}
//             action={
//               <Button 
//                 size="small" 
//                 type="primary" 
//                 onClick={() => setActiveTab('unassigned')}
//               >
//                 View Unassigned
//               </Button>
//             }
//           />
//         )}

//         <Tabs activeKey={activeTab} onChange={setActiveTab}>
//           <TabPane 
//             tab={
//               <Badge count={stats.unassigned} offset={[10, 0]} color="#faad14">
//                 <span>
//                   <ExclamationCircleOutlined />
//                   Unassigned ({stats.unassigned})
//                 </span>
//               </Badge>
//             } 
//             key="unassigned"
//           >
//             <Table 
//               columns={invoiceColumns} 
//               dataSource={unassignedInvoices} 
//               loading={loading}
//               rowKey="_id"
//               rowSelection={activeTab === 'unassigned' ? rowSelection : null}
//               pagination={{ 
//                 pageSize: 10,
//                 showSizeChanger: true,
//                 showQuickJumper: true,
//                 showTotal: (total, range) => 
//                   `${range[0]}-${range[1]} of ${total} invoices`
//               }}
//               scroll={{ x: 'max-content' }}
//             />
//           </TabPane>
          
//           <TabPane 
//             tab={
//               <Badge count={stats.assigned} offset={[10, 0]} color="#1890ff">
//                 <span>
//                   <ClockCircleOutlined />
//                   In Review ({stats.assigned})
//                 </span>
//               </Badge>
//             } 
//             key="assigned"
//           >
//             <Table 
//               columns={invoiceColumns} 
//               dataSource={unassignedInvoices} 
//               loading={loading}
//               rowKey="_id"
//               pagination={{ 
//                 pageSize: 10,
//                 showSizeChanger: true,
//                 showQuickJumper: true,
//                 showTotal: (total, range) => 
//                   `${range[0]}-${range[1]} of ${total} invoices`
//               }}
//               scroll={{ x: 'max-content' }}
//             />
//           </TabPane>

//           <TabPane 
//             tab={
//               <span>
//                 <CheckCircleOutlined />
//                 Approved ({stats.approved})
//               </span>
//             } 
//             key="approved"
//           >
//             <Table 
//               columns={invoiceColumns} 
//               dataSource={unassignedInvoices} 
//               loading={loading}
//               rowKey="_id"
//               pagination={{ 
//                 pageSize: 10,
//                 showSizeChanger: true,
//                 showQuickJumper: true,
//                 showTotal: (total, range) => 
//                   `${range[0]}-${range[1]} of ${total} invoices`
//               }}
//               scroll={{ x: 'max-content' }}
//             />
//           </TabPane>

//           <TabPane 
//             tab={
//               <span>
//                 <CloseCircleOutlined />
//                 Rejected ({stats.rejected})
//               </span>
//             } 
//             key="rejected"
//           >
//             <Table 
//               columns={invoiceColumns} 
//               dataSource={unassignedInvoices} 
//               loading={loading}
//               rowKey="_id"
//               pagination={{ 
//                 pageSize: 10,
//                 showSizeChanger: true,
//                 showQuickJumper: true,
//                 showTotal: (total, range) => 
//                   `${range[0]}-${range[1]} of ${total} invoices`
//               }}
//               scroll={{ x: 'max-content' }}
//             />
//           </TabPane>

//           <TabPane 
//             tab={
//               <span>
//                 <CheckCircleOutlined style={{ color: '#722ed1' }} />
//                 Processed ({stats.processed})
//               </span>
//             } 
//             key="processed"
//           >
//             <Table 
//               columns={invoiceColumns} 
//               dataSource={unassignedInvoices} 
//               loading={loading}
//               rowKey="_id"
//               pagination={{ 
//                 pageSize: 10,
//                 showSizeChanger: true,
//                 showQuickJumper: true,
//                 showTotal: (total, range) => 
//                   `${range[0]}-${range[1]} of ${total} invoices`
//               }}
//               scroll={{ x: 'max-content' }}
//             />
//           </TabPane>
//         </Tabs>
//       </Card>

//       {/* Single Invoice Assignment Modal */}
//       <Modal
//         title={
//           <Space>
//             <SendOutlined />
//             Assign Invoice to Department
//           </Space>
//         }
//         open={assignModalVisible}
//         onCancel={() => {
//           setAssignModalVisible(false);
//           setSelectedInvoice(null);
//           form.resetFields();
//           setDepartmentEmployees([]);
//         }}
//         footer={null}
//         width={600}
//       >
//         {selectedInvoice && (
//           <>
//             <Alert
//               message={
//                 <div>
//                   <strong>Invoice:</strong> {selectedInvoice.poNumber} | 
//                   <strong> Employee:</strong> {selectedInvoice.employeeDetails.name}
//                 </div>
//               }
//               type="info"
//               showIcon
//               style={{ marginBottom: '16px' }}
//             />
            
//             <Form
//               form={form}
//               layout="vertical"
//               onFinish={handleAssignInvoice}
//             >
//               <Form.Item
//                 name="department"
//                 label="Assign to Department*"
//                 rules={[{ required: true, message: 'Please select a department' }]}
//               >
//                 <Select 
//                   placeholder="Select department"
//                   onChange={fetchDepartmentEmployees}
//                 >
//                   {departments.map(dept => (
//                     <Option key={dept} value={dept}>{dept}</Option>
//                   ))}
//                 </Select>
//               </Form.Item>

//               <Form.Item
//                 name="approvers"
//                 label="Approval Chain (Optional)"
//                 help="Select specific employees for approval chain. Leave empty for automatic assignment based on department hierarchy."
//               >
//                 <Select 
//                   mode="multiple"
//                   placeholder="Select approvers (optional)"
//                   disabled={departmentEmployees.length === 0}
//                 >
//                   {departmentEmployees.map(emp => (
//                     <Option key={emp.id} value={emp.id}>
//                       {emp.name} - {emp.role}
//                     </Option>
//                   ))}
//                 </Select>
//               </Form.Item>

//               <Form.Item
//                 name="comments"
//                 label="Assignment Comments (Optional)"
//               >
//                 <Input.TextArea 
//                   rows={3} 
//                   placeholder="Add any comments about this assignment..."
//                   maxLength={300}
//                   showCount
//                 />
//               </Form.Item>

//               <Divider />

//               <Form.Item style={{ marginBottom: 0 }}>
//                 <Space>
//                   <Button onClick={() => {
//                     setAssignModalVisible(false);
//                     setSelectedInvoice(null);
//                     form.resetFields();
//                     setDepartmentEmployees([]);
//                   }}>
//                     Cancel
//                   </Button>
//                   <Button 
//                     type="primary" 
//                     htmlType="submit" 
//                     loading={assigning}
//                     icon={<SendOutlined />}
//                   >
//                     Assign Invoice
//                   </Button>
//                 </Space>
//               </Form.Item>
//             </Form>
//           </>
//         )}
//       </Modal>

//       {/* Bulk Assignment Modal */}
//       <Modal
//         title={
//           <Space>
//             <SendOutlined />
//             Bulk Assign Invoices ({selectedRowKeys.length})
//           </Space>
//         }
//         open={bulkAssignModalVisible}
//         onCancel={() => {
//           setBulkAssignModalVisible(false);
//           bulkForm.resetFields();
//           setDepartmentEmployees([]);
//         }}
//         footer={null}
//         width={600}
//       >
//         <Alert
//           message={`You are about to assign ${selectedRowKeys.length} invoice(s) to a department`}
//           type="warning"
//           showIcon
//           style={{ marginBottom: '16px' }}
//         />
        
//         <Form
//           form={bulkForm}
//           layout="vertical"
//           onFinish={handleBulkAssign}
//         >
//           <Form.Item
//             name="department"
//             label="Assign to Department*"
//             rules={[{ required: true, message: 'Please select a department' }]}
//           >
//             <Select 
//               placeholder="Select department"
//               onChange={fetchDepartmentEmployees}
//             >
//               {departments.map(dept => (
//                 <Option key={dept} value={dept}>{dept}</Option>
//               ))}
//             </Select>
//           </Form.Item>

//           <Form.Item
//             name="approvers"
//             label="Approval Chain (Optional)"
//             help="Select specific employees for approval chain. Leave empty for automatic assignment based on department hierarchy."
//           >
//             <Select 
//               mode="multiple"
//               placeholder="Select approvers (optional)"
//               disabled={departmentEmployees.length === 0}
//             >
//               {departmentEmployees.map(emp => (
//                 <Option key={emp.id} value={emp.id}>
//                   {emp.name} - {emp.role}
//                 </Option>
//               ))}
//             </Select>
//           </Form.Item>

//           <Form.Item
//             name="comments"
//             label="Assignment Comments (Optional)"
//           >
//             <Input.TextArea 
//               rows={3} 
//               placeholder="Add any comments about this bulk assignment..."
//               maxLength={300}
//               showCount
//             />
//           </Form.Item>

//           <Divider />

//           <Form.Item style={{ marginBottom: 0 }}>
//             <Space>
//               <Button onClick={() => {
//                 setBulkAssignModalVisible(false);
//                 bulkForm.resetFields();
//                 setDepartmentEmployees([]);
//               }}>
//                 Cancel
//               </Button>
//               <Button 
//                 type="primary" 
//                 htmlType="submit" 
//                 loading={assigning}
//                 icon={<SendOutlined />}
//               >
//                 Assign {selectedRowKeys.length} Invoices
//               </Button>
//             </Space>
//           </Form.Item>
//         </Form>
//       </Modal>
//     </div>
//   );
// };

// export default FinanceInvoiceManagement;