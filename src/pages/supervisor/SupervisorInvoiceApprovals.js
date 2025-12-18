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
  Divider
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
  SendOutlined
} from '@ant-design/icons';
import api from '../../services/api';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
const { TextArea } = Input;
const { Dragger } = Upload;
const { Step } = Steps;

const SupervisorInvoiceApprovals = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useSelector((state) => state.auth);
  
  const autoApprovalId = searchParams.get('approve');
  const autoRejectId = searchParams.get('reject');
  
  const [invoices, setInvoices] = useState([]);
  const [supplierInvoices, setSupplierInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [approvalModalVisible, setApprovalModalVisible] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [activeTab, setActiveTab] = useState('employee-pending');
  const [stats, setStats] = useState({
    employee: { pending: 0, approved: 0, rejected: 0, total: 0 },
    supplier: { pending: 0, approved: 0, rejected: 0, total: 0 }
  });
  const [form] = Form.useForm();

  // Supplier invoice signing states
  const [signedDocumentFile, setSignedDocumentFile] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [downloadingInvoice, setDownloadingInvoice] = useState(false);
  const [documentDownloaded, setDocumentDownloaded] = useState(false);

  // Helper function to check if user can approve invoice
  const canUserApprove = useCallback((invoice) => {
    if (!invoice.approvalChain || !user?.email) return false;
    
    const currentStep = invoice.approvalChain.find(step => 
      step.level === invoice.currentApprovalLevel && 
      step.approver?.email === user.email &&
      step.status === 'pending'
    );
    
    return !!currentStep;
  }, [user?.email]);

  const fetchPendingApprovals = useCallback(async () => {
    try {
      setLoading(true);
      
      console.log('Fetching pending approvals for user:', user?.email);
      
      const [employeeResponse, supplierResponse] = await Promise.all([
        api.get('/invoices/supervisor/pending').catch(err => {
          console.error('Employee invoices fetch error:', err);
          return { data: { success: false, data: [] } };
        }),
        api.get('/suppliers/supervisor/pending').catch(err => {
          console.error('Supplier invoices fetch error:', err);
          return { data: { success: false, data: [] } };
        })
      ]);
      
      const employeeInvoices = employeeResponse.data.success ? 
        (employeeResponse.data.data || []).map(inv => ({
          ...inv,
          invoiceType: 'employee',
          key: `emp_${inv._id}`
        })) : [];
      
      const supplierInvs = supplierResponse.data.success ? 
        (supplierResponse.data.data || []).map(inv => ({
          ...inv,
          invoiceType: 'supplier',
          key: `sup_${inv._id}`
        })) : [];

      console.log('Employee invoices loaded:', employeeInvoices.length);
      console.log('Supplier invoices loaded:', supplierInvs.length);
      
      if (supplierInvs.length > 0) {
        console.log('First supplier invoice:', {
          id: supplierInvs[0]._id,
          invoiceNumber: supplierInvs[0].invoiceNumber,
          status: supplierInvs[0].approvalStatus,
          currentLevel: supplierInvs[0].currentApprovalLevel,
          currentApproverEmail: supplierInvs[0].approvalChain?.find(s => 
            s.level === supplierInvs[0].currentApprovalLevel
          )?.approver?.email
        });
      }

      setInvoices(employeeInvoices);
      setSupplierInvoices(supplierInvs);

      // Calculate stats for employee invoices
      const empPending = employeeInvoices.filter(inv => 
        inv.approvalStatus === 'pending_supervisor_approval'
      ).length;
      const empApproved = employeeInvoices.filter(inv => 
        ['approved', 'processed', 'paid'].includes(inv.approvalStatus)
      ).length;
      const empRejected = employeeInvoices.filter(inv => 
        inv.approvalStatus === 'rejected'
      ).length;

      // Calculate stats for supplier invoices
      // Count those where user can approve and status is pending
      const supPending = supplierInvs.filter(inv => {
        const isPending = inv.approvalStatus && (
          inv.approvalStatus.includes('pending') &&
          !inv.approvalStatus.includes('supply_chain_assignment') &&
          !inv.approvalStatus.includes('finance_assignment')
        );
        
        if (!isPending) return false;
        
        // Check if user is current approver
        if (!inv.approvalChain || !inv.currentApprovalLevel) return false;
        
        const currentApproverStep = inv.approvalChain.find(step => 
          step.level === inv.currentApprovalLevel && 
          step.status === 'pending'
        );
        
        if (!currentApproverStep) return false;
        
        const isCurrentApprover = currentApproverStep.approver?.email === user.email;
        
        return isCurrentApprover;
      }).length;
      
      const supApproved = supplierInvs.filter(inv => 
        ['approved', 'processed', 'paid'].includes(inv.approvalStatus)
      ).length;
      const supRejected = supplierInvs.filter(inv => 
        inv.approvalStatus === 'rejected'
      ).length;

      console.log('Stats calculated:', {
        employee: { pending: empPending, approved: empApproved, rejected: empRejected },
        supplier: { pending: supPending, approved: supApproved, rejected: supRejected }
      });

      setStats({
        employee: {
          pending: empPending,
          approved: empApproved,
          rejected: empRejected,
          total: employeeInvoices.length
        },
        supplier: {
          pending: supPending,
          approved: supApproved,
          rejected: supRejected,
          total: supplierInvs.length
        }
      });

    } catch (error) {
      console.error('Error fetching pending approvals:', error);
      message.error('Failed to fetch pending approvals');
    } finally {
      setLoading(false);
    }
  }, [user?.email]);

  useEffect(() => {
    if (user?.email) {
      fetchPendingApprovals();
    }
  }, [fetchPendingApprovals, user?.email]);

  // Auto-approval from email links
  useEffect(() => {
    const handleAutoAction = async () => {
      if (autoApprovalId) {
        try {
          let response = await api.get(`/invoices/${autoApprovalId}`).catch(() => null);
          if (response?.data.success) {
            setSelectedInvoice({...response.data.data, invoiceType: 'employee'});
            setApprovalModalVisible(true);
            form.setFieldsValue({ decision: 'approved' });
            return;
          }
          
          response = await api.get(`/suppliers/invoices/${autoApprovalId}`).catch(() => null);
          if (response?.data.success) {
            setSelectedInvoice({...response.data.data, invoiceType: 'supplier'});
            setApprovalModalVisible(true);
            form.setFieldsValue({ decision: 'approved' });
          }
        } catch (error) {
          message.error('Failed to load invoice for approval');
        }
      } else if (autoRejectId) {
        try {
          let response = await api.get(`/invoices/${autoRejectId}`).catch(() => null);
          if (response?.data.success) {
            setSelectedInvoice({...response.data.data, invoiceType: 'employee'});
            setApprovalModalVisible(true);
            form.setFieldsValue({ decision: 'rejected' });
            return;
          }
          
          response = await api.get(`/suppliers/invoices/${autoRejectId}`).catch(() => null);
          if (response?.data.success) {
            setSelectedInvoice({...response.data.data, invoiceType: 'supplier'});
            setApprovalModalVisible(true);
            form.setFieldsValue({ decision: 'rejected' });
          }
        } catch (error) {
          message.error('Failed to load invoice for rejection');
        }
      }
    };

    if (autoApprovalId || autoRejectId) {
      handleAutoAction();
    }
  }, [autoApprovalId, autoRejectId, form]);

  const handleDownloadInvoice = async () => {
    if (!selectedInvoice) {
      message.error('No invoice selected');
      return;
    }

    try {
      setDownloadingInvoice(true);
      const response = await api.get(`/suppliers/invoices/${selectedInvoice._id}/download-for-signing`);
      
      if (response.data.success) {
        const { url, originalName } = response.data.data;
        
        const link = document.createElement('a');
        link.href = url;
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

  const handleApprovalDecision = async (values) => {
    if (!selectedInvoice) return;

    try {
      setLoading(true);
      
      const isSupplierInvoice = selectedInvoice.invoiceType === 'supplier';
      
      if (isSupplierInvoice && values.decision === 'approved' && !signedDocumentFile) {
        message.error('Please download, sign, and upload the document before approving.');
        setLoading(false);
        return;
      }
      
      const endpoint = isSupplierInvoice 
        ? `/suppliers/supervisor/invoices/${selectedInvoice._id}/decision`
        : `/invoices/supervisor/approve/${selectedInvoice._id}`;
      
      let response;
      
      if (isSupplierInvoice && values.decision === 'approved') {
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
        response = await api.put(endpoint, {
          decision: values.decision,
          comments: values.comments
        });
      }
      
      if (response.data.success) {
        const actionText = values.decision === 'approved' ? 'approved' : 'rejected';
        message.success(`Invoice ${actionText} successfully`);
        
        setApprovalModalVisible(false);
        form.resetFields();
        resetSigningWorkflow();
        setSelectedInvoice(null);
        
        await fetchPendingApprovals();
        
        notification.success({
          message: 'Approval Decision Recorded',
          description: `${isSupplierInvoice ? 'Supplier' : 'Employee'} invoice ${selectedInvoice.poNumber || selectedInvoice.invoiceNumber} has been ${actionText}${isSupplierInvoice && values.decision === 'approved' ? ' with signed document' : ''}.`,
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

  const handleViewDetails = async (invoice) => {
    try {
      const isSupplierInvoice = invoice.invoiceType === 'supplier';
      const endpoint = isSupplierInvoice 
        ? `/suppliers/invoices/${invoice._id}`
        : `/invoices/${invoice._id}`;
      
      const response = await api.get(endpoint);
      
      if (response.data.success) {
        setSelectedInvoice({
          ...response.data.data,
          invoiceType: invoice.invoiceType
        });
        setDetailsModalVisible(true);
      }
    } catch (error) {
      console.error('Error fetching invoice details:', error);
      message.error('Failed to fetch invoice details');
    }
  };

  const getStatusTag = (status, invoiceType) => {
    const statusMap = {
      'pending_supervisor_approval': { color: 'orange', text: 'Pending Your Approval', icon: <ClockCircleOutlined /> },
      'pending_department_approval': { color: 'orange', text: 'Pending Approval', icon: <ClockCircleOutlined /> },
      'pending_department_head_approval': { color: 'orange', text: 'Pending Your Approval', icon: <ClockCircleOutlined /> },
      'pending_head_of_business_approval': { color: 'orange', text: 'Pending Your Approval', icon: <ClockCircleOutlined /> },
      'pending_finance_approval': { color: 'blue', text: 'Pending Finance', icon: <ClockCircleOutlined /> },
      'pending_finance_assignment': { color: 'blue', text: 'Pending Finance', icon: <ClockCircleOutlined /> },
      'approved': { color: 'green', text: 'Approved', icon: <CheckCircleOutlined /> },
      'rejected': { color: 'red', text: 'Rejected', icon: <CloseCircleOutlined /> },
      'processed': { color: 'purple', text: 'Processed', icon: <CheckCircleOutlined /> },
      'paid': { color: 'cyan', text: 'Paid', icon: <DollarOutlined /> }
    };

    const config = statusMap[status] || { color: 'default', text: status, icon: null };
    return <Tag color={config.color} icon={config.icon}>{config.text}</Tag>;
  };

  const getFilteredInvoices = (type, status) => {
    const source = type === 'employee' ? invoices : supplierInvoices;
    
    console.log(`\n=== Filtering ${type} invoices for ${status} ===`);
    console.log(`Source length: ${source.length}`);
    console.log(`User email: ${user?.email}`);
    
    const filtered = source.filter(invoice => {
      const userCanApprove = canUserApprove(invoice);
      
      if (source.length > 0 && invoice === source[0]) {
        console.log('First invoice details:', {
          invoiceNumber: invoice.invoiceNumber,
          status: invoice.approvalStatus,
          currentLevel: invoice.currentApprovalLevel,
          userCanApprove,
          approvalChain: invoice.approvalChain?.map(s => ({
            level: s.level,
            email: s.approver?.email,
            status: s.status
          }))
        });
      }
      
      switch (status) {
        case 'pending':
          if (type === 'employee') {
            return invoice.approvalStatus === 'pending_supervisor_approval';
          } else {
            // For supplier invoices: 
            // 1. Status must include "pending"
            // 2. Must NOT be supply chain or finance assignment stages
            // 3. User must be the current approver
            const isPending = invoice.approvalStatus && (
              invoice.approvalStatus.includes('pending') &&
              !invoice.approvalStatus.includes('supply_chain_assignment') &&
              !invoice.approvalStatus.includes('finance_assignment')
            );
            
            const result = isPending && userCanApprove;
            
            if (invoice === source[0]) {
              console.log('First invoice filter result:', {
                isPending,
                userCanApprove,
                finalResult: result
              });
            }
            
            return result;
          }
        case 'approved':
          return ['approved', 'processed', 'paid'].includes(invoice.approvalStatus);
        case 'rejected':
          return invoice.approvalStatus === 'rejected';
        default:
          return true;
      }
    });
    
    console.log(`Filtered result length: ${filtered.length}`);
    console.log('=== End filtering ===\n');
    
    return filtered;
  };

  const commonColumns = [
    {
      title: 'Type',
      dataIndex: 'invoiceType',
      key: 'type',
      width: 80,
      render: (type) => (
        <Tag color={type === 'supplier' ? 'green' : 'blue'} icon={type === 'supplier' ? <ShopOutlined /> : <UserOutlined />}>
          {type === 'supplier' ? 'Supplier' : 'Employee'}
        </Tag>
      )
    },
    {
      title: 'PO Number',
      dataIndex: 'poNumber',
      key: 'poNumber',
      render: (text) => <Text code>{text}</Text>,
      width: 150
    },
    {
      title: 'Invoice Number',
      dataIndex: 'invoiceNumber',
      key: 'invoiceNumber',
      width: 140
    },
    {
      title: 'Entity/Employee',
      key: 'entity',
      render: (_, record) => (
        <div>
          <Text strong>
            {record.invoiceType === 'supplier' 
              ? record.supplierDetails?.companyName 
              : record.employeeDetails?.name || record.employee?.fullName || 'N/A'
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
      width: 200
    },
    {
      title: 'Amount',
      dataIndex: 'invoiceAmount',
      key: 'amount',
      render: (amount, record) => (
        <Text strong>{record.currency || 'XAF'} {amount ? amount.toLocaleString() : '0'}</Text>
      ),
      width: 120
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, record) => (
        <div>
          {getStatusTag(record.approvalStatus, record.invoiceType)}
          {canUserApprove(record) && (
            <div style={{ marginTop: 4 }}>
              <Tag color="gold" size="small">Your Turn</Tag>
            </div>
          )}
        </div>
      ),
      width: 140
    },
    {
      title: 'Upload Date',
      key: 'uploadDate',
      render: (_, record) => (
        <div>
          {record.uploadedDate 
            ? new Date(record.uploadedDate).toLocaleDateString('en-GB')
            : record.createdAt 
            ? new Date(record.createdAt).toLocaleDateString('en-GB')
            : 'N/A'
          }
        </div>
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
          
          {canUserApprove(record) && (
            <Button 
              size="small" 
              type="primary"
              onClick={() => {
                setSelectedInvoice(record);
                setApprovalModalVisible(true);
                if (record.invoiceType === 'supplier') {
                  resetSigningWorkflow();
                }
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

  if (loading && !invoices.length && !supplierInvoices.length) {
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
            <AuditOutlined /> Invoice Approvals Dashboard
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
                title="Employee Pending"
                value={stats.employee.pending}
                prefix={<UserOutlined />}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Supplier Pending"
                value={stats.supplier.pending}
                prefix={<ShopOutlined />}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Total Approved"
                value={stats.employee.approved + stats.supplier.approved}
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Total Rejected"
                value={stats.employee.rejected + stats.supplier.rejected}
                prefix={<CloseCircleOutlined />}
                valueStyle={{ color: '#f5222d' }}
              />
            </Card>
          </Col>
        </Row>

        {(stats.employee.pending > 0 || stats.supplier.pending > 0) && (
          <Alert
            message={`${stats.employee.pending + stats.supplier.pending} invoice(s) require your approval`}
            description={
              <Space direction="vertical">
                {stats.employee.pending > 0 && <Text>• {stats.employee.pending} employee invoice(s)</Text>}
                {stats.supplier.pending > 0 && <Text>• {stats.supplier.pending} supplier invoice(s) (require document signing)</Text>}
              </Space>
            }
            type="warning"
            showIcon
            style={{ marginBottom: '16px' }}
          />
        )}

        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          {/* Employee Invoices Tabs */}
          <TabPane 
            tab={`Employee Pending (${stats.employee.pending})`} 
            key="employee-pending"
          >
            <Table
              columns={commonColumns}
              dataSource={getFilteredInvoices('employee', 'pending')}
              loading={loading}
              rowKey="key"
              pagination={{ pageSize: 10 }}
              scroll={{ x: 1200 }}
              size="small"
            />
          </TabPane>
          
          <TabPane 
            tab={`Employee Approved (${stats.employee.approved})`} 
            key="employee-approved"
          >
            <Table
              columns={commonColumns}
              dataSource={getFilteredInvoices('employee', 'approved')}
              loading={loading}
              rowKey="key"
              pagination={{ pageSize: 10 }}
              scroll={{ x: 1200 }}
              size="small"
            />
          </TabPane>
          
          <TabPane 
            tab={`Employee Rejected (${stats.employee.rejected})`} 
            key="employee-rejected"
          >
            <Table
              columns={commonColumns}
              dataSource={getFilteredInvoices('employee', 'rejected')}
              loading={loading}
              rowKey="key"
              pagination={{ pageSize: 10 }}
              scroll={{ x: 1200 }}
              size="small"
            />
          </TabPane>

          {/* Supplier Invoices Tabs */}
          <TabPane 
            tab={`Supplier Pending (${stats.supplier.pending})`} 
            key="supplier-pending"
          >
            <Alert
              message="Document Signing Required"
              description="Supplier invoices require you to download, sign manually, and upload the signed document before approval."
              type="info"
              showIcon
              icon={<FileTextOutlined />}
              style={{ marginBottom: '16px' }}
              closable
            />
            <Table
              columns={commonColumns}
              dataSource={getFilteredInvoices('supplier', 'pending')}
              loading={loading}
              rowKey="key"
              pagination={{ pageSize: 10 }}
              scroll={{ x: 1200 }}
              size="small"
            />
          </TabPane>
          
          <TabPane 
            tab={`Supplier Approved (${stats.supplier.approved})`} 
            key="supplier-approved"
          >
            <Table
              columns={commonColumns}
              dataSource={getFilteredInvoices('supplier', 'approved')}
              loading={loading}
              rowKey="key"
              pagination={{ pageSize: 10 }}
              scroll={{ x: 1200 }}
              size="small"
            />
          </TabPane>
          
          <TabPane 
            tab={`Supplier Rejected (${stats.supplier.rejected})`} 
            key="supplier-rejected"
          >
            <Table
              columns={commonColumns}
              dataSource={getFilteredInvoices('supplier', 'rejected')}
              loading={loading}
              rowKey="key"
              pagination={{ pageSize: 10 }}
              scroll={{ x: 1200 }}
              size="small"
            />
          </TabPane>
        </Tabs>
      </Card>

      {/* Approval Modal with Conditional Signing Workflow */}
      <Modal
        title={
          <Space>
            <AuditOutlined />
            {selectedInvoice?.invoiceType === 'supplier' ? 'Sign & Approve Invoice' : 'Invoice Approval Decision'}
          </Space>
        }
        open={approvalModalVisible}
        onCancel={() => {
          setApprovalModalVisible(false);
          setSelectedInvoice(null);
          form.resetFields();
          resetSigningWorkflow();
        }}
        footer={null}
        width={selectedInvoice?.invoiceType === 'supplier' ? 800 : 700}
        maskClosable={false}
      >
        {selectedInvoice && (
          <div>
            {selectedInvoice.invoiceType === 'supplier' ? (
              // Supplier Invoice Signing Workflow
              <>
                <Card size="small" style={{ marginBottom: 16, backgroundColor: '#f0f8ff' }}>
                  <Descriptions size="small" column={2}>
                    <Descriptions.Item label="Invoice">{selectedInvoice.invoiceNumber}</Descriptions.Item>
                    <Descriptions.Item label="PO">{selectedInvoice.poNumber}</Descriptions.Item>
                    <Descriptions.Item label="Supplier">{selectedInvoice.supplierDetails?.companyName}</Descriptions.Item>
                    <Descriptions.Item label="Amount">
                      {selectedInvoice.currency} {selectedInvoice.invoiceAmount?.toLocaleString()}
                    </Descriptions.Item>
                  </Descriptions>
                </Card>

                <Alert
                  message="Signing Workflow Required"
                  description="You must download, sign, and upload the document before approving this supplier invoice."
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
                    <Text strong>Step 1: Download Invoice</Text>
                    <Button
                      type={currentStep === 0 ? 'primary' : 'default'}
                      icon={<DownloadOutlined />}
                      loading={downloadingInvoice}
                      onClick={handleDownloadInvoice}
                      disabled={documentDownloaded}
                      block
                    >
                      {documentDownloaded ? 'Downloaded ✓' : 'Download Invoice'}
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
                        setSelectedInvoice(null);
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
              </>
            ) : (
              // Employee Invoice Simple Approval
              <>
                <Alert
                  message="Review Required"
                  description="Please review and make a decision on this employee invoice."
                  type="info"
                  showIcon
                  style={{ marginBottom: '16px' }}
                />

                <Descriptions bordered column={2} size="small" style={{ marginBottom: '20px' }}>
                  <Descriptions.Item label="PO Number">
                    <Text code>{selectedInvoice.poNumber}</Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="Invoice Number">
                    {selectedInvoice.invoiceNumber}
                  </Descriptions.Item>
                  <Descriptions.Item label="Amount">
                    <Text strong>
                      {selectedInvoice.currency || 'XAF'} {selectedInvoice.invoiceAmount?.toLocaleString()}
                    </Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="Employee">
                    {selectedInvoice.employeeDetails?.name || selectedInvoice.employee?.fullName}
                  </Descriptions.Item>
                </Descriptions>

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
                        <CheckCircleOutlined /> Approve Invoice
                      </Radio.Button>
                      <Radio.Button value="rejected" style={{ color: '#f5222d' }}>
                        <CloseCircleOutlined /> Reject Invoice
                      </Radio.Button>
                    </Radio.Group>
                  </Form.Item>

                  <Form.Item
                    name="comments"
                    label="Comments"
                    rules={[{ required: true, message: 'Please provide comments' }]}>
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
                        setSelectedInvoice(null);
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
              </>
            )}
          </div>
        )}
      </Modal>

      {/* Details Modal */}
      <Modal
        title={
          <Space>
            <FileTextOutlined />
            Invoice Details & Approval History
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
            <Descriptions bordered column={2} size="small" style={{ marginBottom: '20px' }}>
              <Descriptions.Item label="Type" span={2}>
                <Tag color={selectedInvoice.invoiceType === 'supplier' ? 'green' : 'blue'}>
                  {selectedInvoice.invoiceType === 'supplier' ? 'Supplier Invoice' : 'Employee Invoice'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="PO Number" span={2}>
                <Text code copyable>{selectedInvoice.poNumber}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Invoice Number">
                {selectedInvoice.invoiceNumber}
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                {getStatusTag(selectedInvoice.approvalStatus, selectedInvoice.invoiceType)}
              </Descriptions.Item>
              {selectedInvoice.invoiceType === 'supplier' ? (
                <>
                  <Descriptions.Item label="Supplier Company" span={2}>
                    {selectedInvoice.supplierDetails?.companyName}
                  </Descriptions.Item>
                  <Descriptions.Item label="Contact">
                    {selectedInvoice.supplierDetails?.contactName}
                  </Descriptions.Item>
                  <Descriptions.Item label="Service Category">
                    <Tag color="purple">{selectedInvoice.serviceCategory}</Tag>
                  </Descriptions.Item>
                </>
              ) : (
                <>
                  <Descriptions.Item label="Employee" span={2}>
                    {selectedInvoice.employeeDetails?.name || selectedInvoice.employee?.fullName}
                  </Descriptions.Item>
                  <Descriptions.Item label="Department">
                    <Tag color="geekblue">{selectedInvoice.employeeDetails?.department || 'N/A'}</Tag>
                  </Descriptions.Item>
                </>
              )}
              <Descriptions.Item label="Amount">
                <Text strong>
                  {selectedInvoice.currency || 'XAF'} {selectedInvoice.invoiceAmount?.toLocaleString()}
                </Text>
              </Descriptions.Item>
            </Descriptions>

            {/* File Downloads */}
            <Card size="small" title="Attached Files" style={{ marginBottom: '20px' }}>
              <Space>
                {selectedInvoice.poFile && (
                  <Button 
                    icon={<FileOutlined />}
                    onClick={() => window.open(selectedInvoice.poFile.url, '_blank')}
                  >
                    PO File
                  </Button>
                )}
                {selectedInvoice.invoiceFile && (
                  <Button 
                    icon={<FileOutlined />}
                    onClick={() => window.open(selectedInvoice.invoiceFile.url, '_blank')}
                  >
                    Invoice File
                  </Button>
                )}
                {!selectedInvoice.poFile && !selectedInvoice.invoiceFile && (
                  <Text type="secondary">No files attached</Text>
                )}
              </Space>
            </Card>

            {/* Approval Chain (for supplier invoices) */}
            {selectedInvoice.invoiceType === 'supplier' && selectedInvoice.approvalChain && selectedInvoice.approvalChain.length > 0 && (
              <>
                <Title level={4}>
                  <HistoryOutlined /> Approval Chain Progress
                </Title>
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

                    const isCurrentStep = step.level === selectedInvoice.currentApprovalLevel && step.status === 'pending';

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
                                  {new Date(step.actionDate).toLocaleDateString('en-GB')} 
                                  {step.actionTime && ` at ${step.actionTime}`}
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
                                  {new Date(step.actionDate).toLocaleDateString('en-GB')}
                                  {step.actionTime && ` at ${step.actionTime}`}
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

export default SupervisorInvoiceApprovals;










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
//   notification
// } from 'antd';
// import {
//   FileTextOutlined,
//   CheckCircleOutlined,
//   CloseCircleOutlined,
//   ClockCircleOutlined,
//   UserOutlined,
//   AuditOutlined,
//   FileOutlined,
//   EyeOutlined,
//   HistoryOutlined,
//   ReloadOutlined,
//   ShopOutlined,
//   DollarOutlined
// } from '@ant-design/icons';
// import api from '../../services/api';

// const { Title, Text } = Typography;
// const { TabPane } = Tabs;
// const { TextArea } = Input;

// const SupervisorInvoiceApprovals = () => {
//   const navigate = useNavigate();
//   const [searchParams] = useSearchParams();
//   const { user } = useSelector((state) => state.auth);
  
//   // Auto-approve from email link
//   const autoApprovalId = searchParams.get('approve');
//   const autoRejectId = searchParams.get('reject');
  
//   const [invoices, setInvoices] = useState([]);
//   const [supplierInvoices, setSupplierInvoices] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [detailsModalVisible, setDetailsModalVisible] = useState(false);
//   const [approvalModalVisible, setApprovalModalVisible] = useState(false);
//   const [selectedInvoice, setSelectedInvoice] = useState(null);
//   const [activeTab, setActiveTab] = useState('pending');
//   const [stats, setStats] = useState({
//     pending: 0,
//     approved: 0,
//     rejected: 0,
//     total: 0
//   });
//   const [form] = Form.useForm();

//   // Fetch pending approvals - FIXED to handle both employee and supplier invoices
//   const fetchPendingApprovals = useCallback(async () => {
//     try {
//       setLoading(true);
      
//       console.log('Fetching pending approvals for user:', user?.email);
      
//       // Fetch employee invoice approvals
//       const employeeResponse = await api.get('/invoices/supervisor/pending');
//       console.log('Employee invoices response:', employeeResponse.data);
      
//       const employeeInvoices = employeeResponse.data.success ? 
//         (employeeResponse.data.data || []).map(inv => ({
//           ...inv,
//           invoiceType: 'employee',
//           key: `emp_${inv._id}`
//         })) : [];
      
//       // Fetch supplier invoice approvals
//       const supplierResponse = await api.get('/suppliers/supervisor/pending');
//       console.log('Supplier invoices response:', supplierResponse.data);
      
//       const supplierInvoices = supplierResponse.data.success ? 
//         (supplierResponse.data.data || []).map(inv => ({
//           ...inv,
//           invoiceType: 'supplier',
//           key: `sup_${inv._id}`
//         })) : [];

//       setInvoices(employeeInvoices);
//       setSupplierInvoices(supplierInvoices);

//       // Calculate combined stats
//       const combined = [...employeeInvoices, ...supplierInvoices];
//       const pending = combined.filter(inv => 
//         inv.approvalStatus === 'pending_department_approval'
//       ).length;
//       const approved = combined.filter(inv => 
//         ['approved', 'processed', 'paid'].includes(inv.approvalStatus)
//       ).length;
//       const rejected = combined.filter(inv => 
//         inv.approvalStatus === 'rejected'
//       ).length;

//       setStats({
//         pending,
//         approved,
//         rejected,
//         total: combined.length
//       });

//       console.log('Stats calculated:', { pending, approved, rejected, total: combined.length });

//     } catch (error) {
//       console.error('Error fetching pending approvals:', error);
//       message.error('Failed to fetch pending approvals');
//     } finally {
//       setLoading(false);
//     }
//   }, [user?.email]);

//   useEffect(() => {
//     if (user?.email) {
//       fetchPendingApprovals();
//     }
//   }, [fetchPendingApprovals, user?.email]);

//   const handleDownloadAttachment = useCallback(async (attachment) => {
//     try {
//       const token = localStorage.getItem('token');
//       if (!token) {
//         message.error('Authentication required');
//         return;
//       }

//       // Extract publicId from Cloudinary URL
//       let publicId = '';
//       if (attachment.url) {
//         const urlParts = attachment.url.split('/');
//         const uploadIndex = urlParts.findIndex(part => part === 'upload');
//         if (uploadIndex !== -1 && uploadIndex + 2 < urlParts.length) {
//           publicId = urlParts.slice(uploadIndex + 2).join('/');
//           // Remove file extension from publicId
//           const lastPart = publicId.split('/').pop();
//           if (lastPart && lastPart.includes('.')) {
//             publicId = publicId.replace(/\.[^/.]+$/, '');
//           }
//         }
//       }

//       if (!publicId) {
//         message.error('Invalid attachment URL');
//         return;
//       }

//       const response = await fetch(`/files/download/${encodeURIComponent(publicId)}`, {
//         method: 'GET',
//         headers: {
//           'Authorization': `Bearer ${token}`,
//           'Content-Type': 'application/json'
//         }
//       });

//       if (!response.ok) {
//         throw new Error(`HTTP error! status: ${response.status}`);
//       }

//       const blob = await response.blob();
//       const url = window.URL.createObjectURL(blob);
      
//       // Create a temporary link to download the file
//       const link = document.createElement('a');
//       link.href = url;
//       link.download = attachment.originalName || attachment.name || 'attachment';
//       document.body.appendChild(link);
//       link.click();
//       document.body.removeChild(link);
      
//       // Clean up the blob URL
//       window.URL.revokeObjectURL(url);
      
//       message.success('File downloaded successfully');
//     } catch (error) {
//       console.error('Error downloading attachment:', error);
//       message.error('Failed to download attachment');
      
//       // Fallback to direct URL if download fails
//       if (attachment.url) {
//         window.open(attachment.url, '_blank');
//       }
//     }
//   }, []);

//   // Handle auto-approval from email links - FIXED
//   useEffect(() => {
//     const handleAutoAction = async () => {
//       if (autoApprovalId) {
//         try {
//           // Try employee invoice first
//           let response = await api.get(`/invoices/${autoApprovalId}`);
//           if (response.data.success) {
//             setSelectedInvoice({...response.data.data, invoiceType: 'employee'});
//             setApprovalModalVisible(true);
//             form.setFieldsValue({ decision: 'approved' });
//             return;
//           }
//         } catch (error) {
//           // Try supplier invoice
//           try {
//             const response = await api.get(`/suppliers/invoices/${autoApprovalId}`);
//             if (response.data.success) {
//               setSelectedInvoice({...response.data.data, invoiceType: 'supplier'});
//               setApprovalModalVisible(true);
//               form.setFieldsValue({ decision: 'approved' });
//             }
//           } catch (supplierError) {
//             message.error('Failed to load invoice for approval');
//           }
//         }
//       } else if (autoRejectId) {
//         try {
//           // Try employee invoice first
//           let response = await api.get(`/invoices/${autoRejectId}`);
//           if (response.data.success) {
//             setSelectedInvoice({...response.data.data, invoiceType: 'employee'});
//             setApprovalModalVisible(true);
//             form.setFieldsValue({ decision: 'rejected' });
//             return;
//           }
//         } catch (error) {
//           // Try supplier invoice
//           try {
//             const response = await api.get(`/suppliers/invoices/${autoRejectId}`);
//             if (response.data.success) {
//               setSelectedInvoice({...response.data.data, invoiceType: 'supplier'});
//               setApprovalModalVisible(true);
//               form.setFieldsValue({ decision: 'rejected' });
//             }
//           } catch (supplierError) {
//             message.error('Failed to load invoice for rejection');
//           }
//         }
//       }
//     };

//     if (autoApprovalId || autoRejectId) {
//       handleAutoAction();
//     }
//   }, [autoApprovalId, autoRejectId, form]);

//   // FIXED approval decision handler
//   const handleApprovalDecision = async (values) => {
//     if (!selectedInvoice) return;

//     try {
//       setLoading(true);
      
//       const isSupplierInvoice = selectedInvoice.invoiceType === 'supplier';
      
//       // Use the correct endpoints
//       const endpoint = isSupplierInvoice 
//         ? `/suppliers/supervisor/invoices/${selectedInvoice._id}/decision`
//         : `/invoices/supervisor/approve/${selectedInvoice._id}`;
      
//       const payload = {
//         decision: values.decision, // 'approved' or 'rejected'
//         comments: values.comments
//       };

//       console.log('Submitting approval decision:', { endpoint, payload });

//       const response = await api.put(endpoint, payload);
      
//       if (response.data.success) {
//         const actionText = values.decision === 'approved' ? 'approved' : 'rejected';
//         message.success(`Invoice ${actionText} successfully`);
        
//         setApprovalModalVisible(false);
//         form.resetFields();
//         setSelectedInvoice(null);
        
//         // Refresh data
//         await fetchPendingApprovals();
        
//         // Show success notification
//         notification.success({
//           message: 'Approval Decision Recorded',
//           description: `${isSupplierInvoice ? 'Supplier' : 'Employee'} invoice ${selectedInvoice.poNumber || selectedInvoice.invoiceNumber} has been ${actionText} and stakeholders have been notified.`,
//           duration: 4
//         });
//       } else {
//         throw new Error(response.data.message || 'Failed to process decision');
//       }
//     } catch (error) {
//       console.error('Approval decision error:', error);
//       message.error(error.response?.data?.message || 'Failed to process approval decision');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleViewDetails = async (invoice) => {
//     try {
//       const isSupplierInvoice = invoice.invoiceType === 'supplier';
//       const endpoint = isSupplierInvoice 
//         ? `/suppliers/invoices/${invoice._id}`
//         : `/invoices/${invoice._id}`;
      
//       const response = await api.get(endpoint);
      
//       if (response.data.success) {
//         setSelectedInvoice({
//           ...response.data.data,
//           invoiceType: invoice.invoiceType
//         });
//         setDetailsModalVisible(true);
//       }
//     } catch (error) {
//       console.error('Error fetching invoice details:', error);
//       message.error('Failed to fetch invoice details');
//     }
//   };

//   const getStatusTag = (status) => {
//     const statusMap = {
//       'pending_department_approval': { color: 'orange', text: 'Pending Your Approval', icon: <ClockCircleOutlined /> },
//       'pending_finance_assignment': { color: 'blue', text: 'Pending Finance Assignment', icon: <ClockCircleOutlined /> },
//       'approved': { color: 'green', text: 'Approved', icon: <CheckCircleOutlined /> },
//       'rejected': { color: 'red', text: 'Rejected', icon: <CloseCircleOutlined /> },
//       'processed': { color: 'purple', text: 'Processed', icon: <CheckCircleOutlined /> },
//       'paid': { color: 'cyan', text: 'Paid', icon: <DollarOutlined /> }
//     };

//     const config = statusMap[status] || { color: 'default', text: status, icon: null };
//     return <Tag color={config.color} icon={config.icon}>{config.text}</Tag>;
//   };

//   const getApprovalProgress = (invoice) => {
//     if (!invoice.approvalChain || invoice.approvalChain.length === 0) return 0;
//     const approved = invoice.approvalChain.filter(step => step.status === 'approved').length;
//     return Math.round((approved / invoice.approvalChain.length) * 100);
//   };

//   const getCombinedInvoices = () => {
//     const combined = [...invoices, ...supplierInvoices];
//     return combined.sort((a, b) => {
//       const dateA = new Date(a.uploadedDate || a.createdAt || 0);
//       const dateB = new Date(b.uploadedDate || b.createdAt || 0);
//       return dateB - dateA;
//     });
//   };

//   const getTabCount = (status) => {
//     const combined = getCombinedInvoices();
//     return combined.filter(inv => {
//       switch (status) {
//         case 'pending':
//           return inv.approvalStatus === 'pending_department_approval';
//         case 'approved':
//           return ['approved', 'processed', 'paid'].includes(inv.approvalStatus);
//         case 'rejected':
//           return inv.approvalStatus === 'rejected';
//         default:
//           return false;
//       }
//     }).length;
//   };

//   // Check if user can approve this invoice
//   const canUserApprove = (invoice) => {
//     if (!invoice.approvalChain || !user?.email) return false;
    
//     const currentStep = invoice.approvalChain.find(step => 
//       step.level === invoice.currentApprovalLevel && 
//       step.approver?.email === user.email &&
//       step.status === 'pending'
//     );
    
//     return !!currentStep;
//   };

//   const columns = [
//     {
//       title: 'Type',
//       dataIndex: 'invoiceType',
//       key: 'type',
//       width: 80,
//       render: (type) => (
//         <Tag color={type === 'supplier' ? 'green' : 'blue'} icon={type === 'supplier' ? <ShopOutlined /> : <UserOutlined />}>
//           {type === 'supplier' ? 'Supplier' : 'Employee'}
//         </Tag>
//       ),
//       filters: [
//         { text: 'Employee', value: 'employee' },
//         { text: 'Supplier', value: 'supplier' }
//       ],
//       onFilter: (value, record) => record.invoiceType === value
//     },
//     {
//       title: 'PO Number',
//       dataIndex: 'poNumber',
//       key: 'poNumber',
//       render: (text) => <Text code>{text}</Text>,
//       width: 150
//     },
//     {
//       title: 'Invoice Number',
//       dataIndex: 'invoiceNumber',
//       key: 'invoiceNumber',
//       width: 140
//     },
//     {
//       title: 'Entity/Employee',
//       key: 'entity',
//       render: (_, record) => (
//         <div>
//           <Text strong>
//             {record.invoiceType === 'supplier' 
//               ? record.supplierDetails?.companyName 
//               : record.employeeDetails?.name || record.employee?.fullName || 'N/A'
//             }
//           </Text>
//           <br />
//           <Text type="secondary" style={{ fontSize: '12px' }}>
//             {record.invoiceType === 'supplier'
//               ? record.supplierDetails?.contactName
//               : record.employeeDetails?.position || 'N/A'
//             }
//           </Text>
//           <br />
//           <Tag size="small" color={record.invoiceType === 'supplier' ? 'green' : 'geekblue'}>
//             {record.invoiceType === 'supplier'
//               ? record.serviceCategory || record.supplierDetails?.supplierType
//               : record.employeeDetails?.department || record.employee?.department || 'N/A'
//             }
//           </Tag>
//         </div>
//       ),
//       width: 220
//     },
//     {
//       title: 'Amount',
//       dataIndex: 'invoiceAmount',
//       key: 'amount',
//       render: (amount, record) => (
//         <div>
//           {amount > 0 ? (
//             <>
//               <Text strong>{record.currency || 'XAF'} {amount.toLocaleString()}</Text>
//               {record.invoiceType === 'supplier' && record.dueDate && (
//                 <>
//                   <br />
//                   <Text type="secondary" style={{ fontSize: '11px' }}>
//                     Due: {new Date(record.dueDate).toLocaleDateString('en-GB')}
//                   </Text>
//                 </>
//               )}
//             </>
//           ) : (
//             <Text type="secondary">Amount pending</Text>
//           )}
//         </div>
//       ),
//       width: 120,
//       sorter: (a, b) => (a.invoiceAmount || 0) - (b.invoiceAmount || 0)
//     },
//     {
//       title: 'Upload Date',
//       key: 'uploadDate',
//       render: (_, record) => (
//         <div>
//           {record.uploadedDate 
//             ? new Date(record.uploadedDate).toLocaleDateString('en-GB')
//             : record.createdAt 
//             ? new Date(record.createdAt).toLocaleDateString('en-GB')
//             : 'N/A'
//           }
//         </div>
//       ),
//       sorter: (a, b) => {
//         const dateA = new Date(a.uploadedDate || a.createdAt || 0);
//         const dateB = new Date(b.uploadedDate || b.createdAt || 0);
//         return dateA - dateB;
//       },
//       width: 120
//     },
//     {
//       title: 'Status',
//       dataIndex: 'approvalStatus',
//       key: 'status',
//       render: (status, record) => (
//         <div>
//           {getStatusTag(status)}
//           {status === 'pending_department_approval' && canUserApprove(record) && (
//             <div style={{ marginTop: 4 }}>
//               <Tag color="gold" size="small">Your Turn</Tag>
//             </div>
//           )}
//         </div>
//       ),
//       filters: [
//         { text: 'Pending Approval', value: 'pending_department_approval' },
//         { text: 'Approved', value: 'approved' },
//         { text: 'Rejected', value: 'rejected' },
//         { text: 'Processed', value: 'processed' },
//         { text: 'Paid', value: 'paid' }
//       ],
//       width: 160
//     },
//     {
//       title: 'Your Level',
//       key: 'approvalLevel',
//       render: (_, record) => {
//         if (!record.approvalChain || !user?.email) return 'N/A';
        
//         const userStep = record.approvalChain.find(step => 
//           step.approver?.email === user.email
//         );
        
//         if (!userStep) return 'N/A';
        
//         const isCurrent = userStep.level === record.currentApprovalLevel && userStep.status === 'pending';
        
//         return (
//           <div>
//             <Tag color={isCurrent ? "gold" : userStep.status === 'approved' ? "green" : "default"}>
//               Level {userStep.level}
//             </Tag>
//             {isCurrent && (
//               <div style={{ fontSize: '10px', color: '#faad14' }}>
//                 Active
//               </div>
//             )}
//           </div>
//         );
//       },
//       width: 100
//     },
//     {
//       title: 'Progress',
//       key: 'progress',
//       render: (_, record) => {
//         const progress = getApprovalProgress(record);
//         let status = 'active';
//         if (record.approvalStatus === 'rejected') status = 'exception';
//         if (['approved', 'processed', 'paid'].includes(record.approvalStatus)) status = 'success';
        
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
//       title: 'Files',
//       key: 'files',
//       render: (_, record) => (
//         <Space>
//           {record.poFile && (
//             <Button 
//               size="small" 
//               icon={<FileOutlined />} 
//               type="link"
//               onClick={() => handleDownloadAttachment(record.poFile)}
//             >
//               PO
//             </Button>
//           )}
//           {record.invoiceFile && (
//             <Button 
//               size="small" 
//               icon={<FileOutlined />} 
//               type="link"
//               onClick={() => handleDownloadAttachment(record.invoiceFile)}
//             >
//               Invoice
//             </Button>
//           )}
//         </Space>
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
//             onClick={() => handleViewDetails(record)}
//           >
//             View
//           </Button>
          
//           {record.approvalStatus === 'pending_department_approval' && canUserApprove(record) && (
//             <Button 
//               size="small" 
//               type="primary"
//               onClick={() => {
//                 setSelectedInvoice(record);
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

//   return (
//     <div style={{ padding: '24px' }}>
//       <Card>
//         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
//           <Title level={2} style={{ margin: 0 }}>
//             <AuditOutlined /> Invoice Approvals Dashboard
//           </Title>
//           <Space>
//             <Button 
//               icon={<ReloadOutlined />} 
//               onClick={fetchPendingApprovals}
//               loading={loading}
//             >
//               Refresh
//             </Button>
//           </Space>
//         </div>

//         {/* Stats Cards */}
//         <Row gutter={16} style={{ marginBottom: '24px' }}>
//           <Col span={8}>
//             <Statistic
//               title="Pending Your Approval"
//               value={stats.pending}
//               prefix={<ClockCircleOutlined />}
//               valueStyle={{ color: '#faad14' }}
//             />
//           </Col>
//           <Col span={8}>
//             <Statistic
//               title="Approved by You"
//               value={stats.approved}
//               prefix={<CheckCircleOutlined />}
//               valueStyle={{ color: '#52c41a' }}
//             />
//           </Col>
//           <Col span={8}>
//             <Statistic
//               title="Rejected by You"
//               value={stats.rejected}
//               prefix={<CloseCircleOutlined />}
//               valueStyle={{ color: '#f5222d' }}
//             />
//           </Col>
//         </Row>

//         {/* Pending Actions Alert */}
//         {stats.pending > 0 && (
//           <Alert
//             message={`${stats.pending} invoice(s) require your approval`}
//             type="warning"
//             showIcon
//             style={{ marginBottom: '16px' }}
//             action={
//               <Button 
//                 size="small" 
//                 type="primary"
//                 onClick={() => setActiveTab('pending')}
//               >
//                 Review Now
//               </Button>
//             }
//           />
//         )}

//         <Tabs activeKey={activeTab} onChange={setActiveTab}>
//           <TabPane 
//             tab={`Pending Approval (${getTabCount('pending')})`} 
//             key="pending"
//           />
//           <TabPane 
//             tab={`Approved (${getTabCount('approved')})`} 
//             key="approved"
//           />
//           <TabPane 
//             tab={`Rejected (${getTabCount('rejected')})`} 
//             key="rejected"
//           />
//         </Tabs>

//         <Table
//           columns={columns}
//           dataSource={getCombinedInvoices().filter(invoice => {
//             switch (activeTab) {
//               case 'pending':
//                 return invoice.approvalStatus === 'pending_department_approval';
//               case 'approved':
//                 return ['approved', 'processed', 'paid'].includes(invoice.approvalStatus);
//               case 'rejected':
//                 return invoice.approvalStatus === 'rejected';
//               default:
//                 return true;
//             }
//           })}
//           loading={loading}
//           rowKey="key"
//           pagination={{
//             pageSize: 10,
//             showSizeChanger: true,
//             showQuickJumper: true,
//             showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} invoices`
//           }}
//           scroll={{ x: 1400 }}
//           size="small"
//           rowClassName={(record) => {
//             let className = record.invoiceType === 'supplier' ? 'supplier-invoice-row' : 'employee-invoice-row';
//             if (record.approvalStatus === 'pending_department_approval' && canUserApprove(record)) {
//               className += ' pending-approval-row';
//             }
//             return className;
//           }}
//         />
//       </Card>

//       {/* FIXED Approval Modal */}
//       <Modal
//         title={
//           <Space>
//             <AuditOutlined />
//             Invoice Approval Decision
//           </Space>
//         }
//         open={approvalModalVisible}
//         onCancel={() => {
//           setApprovalModalVisible(false);
//           setSelectedInvoice(null);
//           form.resetFields();
//         }}
//         footer={null}
//         width={700}
//       >
//         {selectedInvoice && (
//           <div>
//             <Alert
//               message="Review Required"
//               description={`Please review and make a decision on this ${selectedInvoice.invoiceType} invoice.`}
//               type="info"
//               showIcon
//               style={{ marginBottom: '16px' }}
//             />

//             <Descriptions bordered column={2} size="small" style={{ marginBottom: '20px' }}>
//               <Descriptions.Item label="Invoice Type">
//                 <Tag color={selectedInvoice.invoiceType === 'supplier' ? 'green' : 'blue'}>
//                   {selectedInvoice.invoiceType === 'supplier' ? 'Supplier' : 'Employee'}
//                 </Tag>
//               </Descriptions.Item>
//               <Descriptions.Item label="PO Number">
//                 <Text code>{selectedInvoice.poNumber}</Text>
//               </Descriptions.Item>
//               <Descriptions.Item label="Invoice Number">
//                 {selectedInvoice.invoiceNumber}
//               </Descriptions.Item>
//               <Descriptions.Item label="Amount">
//                 <Text strong>
//                   {selectedInvoice.currency || 'XAF'} {selectedInvoice.invoiceAmount?.toLocaleString() || 'Pending'}
//                 </Text>
//               </Descriptions.Item>
//               <Descriptions.Item label="Entity" span={2}>
//                 {selectedInvoice.invoiceType === 'supplier' 
//                   ? `${selectedInvoice.supplierDetails?.companyName} (${selectedInvoice.supplierDetails?.contactName})`
//                   : `${selectedInvoice.employeeDetails?.name} (${selectedInvoice.employeeDetails?.position})`
//                 }
//               </Descriptions.Item>
//             </Descriptions>

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
//                     <CheckCircleOutlined /> Approve Invoice
//                   </Radio.Button>
//                   <Radio.Button value="rejected" style={{ color: '#f5222d' }}>
//                     <CloseCircleOutlined /> Reject Invoice
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
//                     setSelectedInvoice(null);
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
//             <FileTextOutlined />
//             Invoice Details & Approval History
//           </Space>
//         }
//         open={detailsModalVisible}
//         onCancel={() => {
//           setDetailsModalVisible(false);
//           setSelectedInvoice(null);
//         }}
//         footer={null}
//         width={900}
//       >
//         {selectedInvoice && (
//           <div>
//             <Descriptions bordered column={2} size="small" style={{ marginBottom: '20px' }}>
//               <Descriptions.Item label="PO Number" span={2}>
//                 <Text code copyable>{selectedInvoice.poNumber}</Text>
//               </Descriptions.Item>
//               <Descriptions.Item label="Invoice Number">
//                 {selectedInvoice.invoiceNumber}
//               </Descriptions.Item>
//               <Descriptions.Item label="Status">
//                 {getStatusTag(selectedInvoice.approvalStatus)}
//               </Descriptions.Item>
//               {selectedInvoice.invoiceType === 'supplier' ? (
//                 <>
//                   <Descriptions.Item label="Supplier Company" span={2}>
//                     {selectedInvoice.supplierDetails?.companyName}
//                   </Descriptions.Item>
//                   <Descriptions.Item label="Service Category">
//                     <Tag color="purple">{selectedInvoice.serviceCategory}</Tag>
//                   </Descriptions.Item>
//                 </>
//               ) : (
//                 <>
//                   <Descriptions.Item label="Employee" span={2}>
//                     {selectedInvoice.employeeDetails?.name}
//                   </Descriptions.Item>
//                   <Descriptions.Item label="Department">
//                     <Tag color="geekblue">{selectedInvoice.employeeDetails?.department}</Tag>
//                   </Descriptions.Item>
//                 </>
//               )}
//             </Descriptions>

//             {/* File Downloads */}
//             <Card size="small" title="Attached Files" style={{ marginBottom: '20px' }}>
//               <Space>
//                 {selectedInvoice.poFile && (
//                   <Button 
//                     icon={<FileOutlined />}
//                     onClick={() => handleDownloadAttachment(selectedInvoice.poFile)}
//                   >
//                     Download PO File
//                   </Button>
//                 )}
//                 {selectedInvoice.invoiceFile && (
//                   <Button 
//                     icon={<FileOutlined />}
//                     onClick={() => handleDownloadAttachment(selectedInvoice.invoiceFile)}
//                   >
//                     Download Invoice File
//                   </Button>
//                 )}
//                 {!selectedInvoice.poFile && !selectedInvoice.invoiceFile && (
//                   <Text type="secondary">No files attached</Text>
//                 )}
//               </Space>
//             </Card>

//             {/* Approval Chain */}
//             {selectedInvoice.approvalChain && selectedInvoice.approvalChain.length > 0 && (
//               <>
//                 <Title level={4}>
//                   <HistoryOutlined /> Approval Chain Progress
//                 </Title>
//                 <Timeline>
//                   {selectedInvoice.approvalChain.map((step, index) => {
//                     let color = 'gray';
//                     let icon = <ClockCircleOutlined />;
                    
//                     if (step.status === 'approved') {
//                       color = 'green';
//                       icon = <CheckCircleOutlined />;
//                     } else if (step.status === 'rejected') {
//                       color = 'red';
//                       icon = <CloseCircleOutlined />;
//                     }

//                     const isCurrentStep = step.level === selectedInvoice.currentApprovalLevel && step.status === 'pending';

//                     return (
//                       <Timeline.Item key={index} color={color} dot={icon}>
//                         <div>
//                           <Text strong>Level {step.level}: {step.approver?.name || 'Unknown'}</Text>
//                           {isCurrentStep && <Tag color="gold" size="small" style={{marginLeft: 8}}>Current</Tag>}
//                           <br />
//                           <Text type="secondary">{step.approver?.role} - {step.approver?.email}</Text>
//                           <br />
//                           {step.status === 'pending' && (
//                             <Tag color={isCurrentStep ? "gold" : "orange"}>
//                               {isCurrentStep ? "Awaiting Action" : "Pending"}
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
//               </>
//             )}
//           </div>
//         )}
//       </Modal>

//       {/* Custom CSS for row styling */}
//       <style jsx>{`
//         .supplier-invoice-row {
//           background-color: #f6ffed;
//         }
//         .employee-invoice-row {
//           background-color: #f0f8ff;
//         }
//         .supplier-invoice-row:hover {
//           background-color: #d9f7be !important;
//         }
//         .employee-invoice-row:hover {
//           background-color: #bae7ff !important;
//         }
//         .pending-approval-row {
//           border-left: 3px solid #faad14;
//         }
//         .pending-approval-row:hover {
//           background-color: #fff7e6 !important;
//         }
//       `}</style>
//     </div>
//   );
// };

// export default SupervisorInvoiceApprovals;



