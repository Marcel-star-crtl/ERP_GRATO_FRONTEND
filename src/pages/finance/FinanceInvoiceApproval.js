import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Table,
  Button,
  Modal,
  Select,
  Form,
  Typography,
  Tag,
  Space,
  Tabs,
  DatePicker,
  Input,
  Timeline,
  Descriptions,
  Progress,
  Alert,
  Spin,
  message,
  Popconfirm,
  Tooltip,
  Badge,
  Checkbox,
  Statistic,
  Row,
  Col,
  notification,
  Drawer,
  List,
  Avatar,
  Divider,
  Switch
} from 'antd';
import {
  FileTextOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  UserOutlined,
  CalendarOutlined,
  AuditOutlined,
  FileOutlined,
  SendOutlined,
  FilterOutlined,
  EyeOutlined,
  HistoryOutlined,
  ReloadOutlined,
  DashboardOutlined,
  BellOutlined,
  ExportOutlined,
  WarningOutlined,
  ShopOutlined,
  TagOutlined,
  BankOutlined,
  DollarOutlined,
  CrownOutlined
} from '@ant-design/icons';
import api from '../../services/api';
import * as XLSX from 'xlsx';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;
const { RangePicker } = DatePicker;
const { TextArea } = Input;

const FinanceInvoiceApprovalPage = () => {
  const [invoices, setInvoices] = useState([]);
  const [supplierInvoices, setSupplierInvoices] = useState([]);
  const [combinedInvoices, setCombinedInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedInvoices, setSelectedInvoices] = useState([]);
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [analyticsDrawerVisible, setAnalyticsDrawerVisible] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [activeTab, setActiveTab] = useState('unassigned');
  const [analytics, setAnalytics] = useState(null);
  const [showSupplierInvoices, setShowSupplierInvoices] = useState(true);
  const [showEmployeeInvoices, setShowEmployeeInvoices] = useState(true);
  const [filters, setFilters] = useState({
    department: null,
    status: null,
    dateRange: null,
    employee: null,
    invoiceType: 'all',
    serviceCategory: null,
    supplierType: null
  });
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  const [form] = Form.useForm();

  // Fetch employee invoices from API
  const fetchEmployeeInvoices = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        page: pagination.current,
        limit: pagination.pageSize
      });
      
      if (filters.status) params.append('status', filters.status);
      if (filters.department) params.append('department', filters.department);
      if (filters.dateRange && filters.dateRange.length === 2) {
        params.append('startDate', filters.dateRange[0].format('YYYY-MM-DD'));
        params.append('endDate', filters.dateRange[1].format('YYYY-MM-DD'));
      }
      if (filters.employee) params.append('employee', filters.employee);
      
      const response = await api.get(`/api/invoices/finance?${params}`);
      
      if (response.data.success) {
        const employeeInvoices = (response.data.data || []).map(invoice => ({
          ...invoice,
          invoiceType: 'employee',
          key: `emp_${invoice._id}`
        }));
        setInvoices(employeeInvoices);
        return employeeInvoices;
      } else {
        throw new Error(response.data.message || 'Failed to fetch employee invoices');
      }
    } catch (error) {
      console.error('Error fetching employee invoices:', error);
      message.error(error.response?.data?.message || 'Failed to fetch employee invoices');
      setInvoices([]);
      return [];
    }
  }, [filters, pagination.current, pagination.pageSize]);

  // Fetch supplier invoices from API
  const fetchSupplierInvoices = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        page: pagination.current,
        limit: pagination.pageSize
      });
      
      if (filters.status) params.append('status', filters.status);
      if (filters.serviceCategory) params.append('serviceCategory', filters.serviceCategory);
      if (filters.dateRange && filters.dateRange.length === 2) {
        params.append('startDate', filters.dateRange[0].format('YYYY-MM-DD'));
        params.append('endDate', filters.dateRange[1].format('YYYY-MM-DD'));
      }
      
      const response = await api.get(`/api/suppliers/admin/invoices?${params}`);
      
      if (response.data.success) {
        const supplierInvoices = (response.data.data || []).map(invoice => ({
          ...invoice,
          invoiceType: 'supplier',
          key: `sup_${invoice._id}`,
          employeeDetails: {
            name: invoice.supplierDetails?.companyName || 'N/A',
            position: invoice.supplierDetails?.contactName || 'Contact',
            department: invoice.serviceCategory || 'Supplier'
          }
        }));
        setSupplierInvoices(supplierInvoices);
        return supplierInvoices;
      } else {
        throw new Error(response.data.message || 'Failed to fetch supplier invoices');
      }
    } catch (error) {
      console.error('Error fetching supplier invoices:', error);
      message.error(error.response?.data?.message || 'Failed to fetch supplier invoices');
      setSupplierInvoices([]);
      return [];
    }
  }, [filters, pagination.current, pagination.pageSize]);

  const downloadFile = async (fileData, type = 'file') => {
    if (!fileData || !fileData.url) {
      message.error('File not available');
      return;
    }
  
    try {
      const response = await api.get(`/api/files/download/${fileData.publicId}`, {
        responseType: 'blob',
        params: { 
          type: type,
          filename: fileData.originalName 
        }
      });
  
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileData.originalName || `${type}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      message.success('File downloaded successfully');
    } catch (error) {
      console.error('Download error:', error);
      
      try {
        const link = document.createElement('a');
        link.href = fileData.url;
        link.target = '_blank';
        link.download = fileData.originalName || `${type}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (fallbackError) {
        message.error('Failed to download file. Please contact support.');
      }
    }
  };

  // Fetch both invoice types and combine
  const fetchAllInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const promises = [];
      
      if (showEmployeeInvoices && (filters.invoiceType === 'all' || filters.invoiceType === 'employee')) {
        promises.push(fetchEmployeeInvoices());
      } else {
        promises.push(Promise.resolve([]));
      }
      
      if (showSupplierInvoices && (filters.invoiceType === 'all' || filters.invoiceType === 'supplier')) {
        promises.push(fetchSupplierInvoices());
      } else {
        promises.push(Promise.resolve([]));
      }
      
      const [employeeResults, supplierResults] = await Promise.all(promises);
      
      const combined = [...employeeResults, ...supplierResults].sort((a, b) => {
        const dateA = new Date(a.uploadedDate || a.createdAt || 0);
        const dateB = new Date(b.uploadedDate || b.createdAt || 0);
        return dateB - dateA;
      });
      
      setCombinedInvoices(combined);
      
      setPagination(prev => ({
        ...prev,
        total: combined.length
      }));
      
    } catch (error) {
      console.error('Error fetching invoices:', error);
      message.error('Failed to fetch invoices');
      setCombinedInvoices([]);
    } finally {
      setLoading(false);
    }
  }, [fetchEmployeeInvoices, fetchSupplierInvoices, showEmployeeInvoices, showSupplierInvoices, filters.invoiceType]);

  // Fetch analytics for both invoice types
  const fetchAnalytics = useCallback(async () => {
    try {
      const promises = [];
      
      if (showEmployeeInvoices) {
        const empParams = new URLSearchParams();
        if (filters.department) empParams.append('department', filters.department);
        if (filters.dateRange && filters.dateRange.length === 2) {
          empParams.append('startDate', filters.dateRange[0].format('YYYY-MM-DD'));
          empParams.append('endDate', filters.dateRange[1].format('YYYY-MM-DD'));
        }
        promises.push(api.get(`/api/invoices/analytics/dashboard?${empParams}`));
      }
      
      if (showSupplierInvoices) {
        const supParams = new URLSearchParams();
        if (filters.serviceCategory) supParams.append('serviceCategory', filters.serviceCategory);
        if (filters.dateRange && filters.dateRange.length === 2) {
          supParams.append('startDate', filters.dateRange[0].format('YYYY-MM-DD'));
          supParams.append('endDate', filters.dateRange[1].format('YYYY-MM-DD'));
        }
        promises.push(api.get(`/api/suppliers/admin/analytics?${supParams}`));
      }
      
      const results = await Promise.allSettled(promises);
      
      const combinedAnalytics = {
        overall: [],
        byDepartment: [],
        byCategory: [],
        topSuppliers: [],
        recentActivity: [],
        employeeStats: null,
        supplierStats: null
      };
      
      if (results[0] && results[0].status === 'fulfilled' && results[0].value.data.success) {
        combinedAnalytics.employeeStats = results[0].value.data.data;
        if (results[0].value.data.data.overall) {
          combinedAnalytics.overall = [...combinedAnalytics.overall, ...results[0].value.data.data.overall.map(item => ({...item, type: 'employee'}))];
        }
        if (results[0].value.data.data.byDepartment) {
          combinedAnalytics.byDepartment = results[0].value.data.data.byDepartment.map(item => ({...item, type: 'employee'}));
        }
        if (results[0].value.data.data.recentActivity) {
          combinedAnalytics.recentActivity = [...combinedAnalytics.recentActivity, ...results[0].value.data.data.recentActivity.map(item => ({...item, type: 'employee'}))];
        }
      }
      
      const supplierIndex = showEmployeeInvoices ? 1 : 0;
      if (results[supplierIndex] && results[supplierIndex].status === 'fulfilled' && results[supplierIndex].value.data.success) {
        combinedAnalytics.supplierStats = results[supplierIndex].value.data.data;
        if (results[supplierIndex].value.data.data.overall) {
          combinedAnalytics.overall = [...combinedAnalytics.overall, ...results[supplierIndex].value.data.data.overall.map(item => ({...item, type: 'supplier'}))];
        }
        if (results[supplierIndex].value.data.data.byCategory) {
          combinedAnalytics.byCategory = results[supplierIndex].value.data.data.byCategory.map(item => ({...item, type: 'supplier'}));
        }
        if (results[supplierIndex].value.data.data.topSuppliers) {
          combinedAnalytics.topSuppliers = results[supplierIndex].value.data.data.topSuppliers;
        }
        if (results[supplierIndex].value.data.data.recentActivity) {
          combinedAnalytics.recentActivity = [...combinedAnalytics.recentActivity, ...results[supplierIndex].value.data.data.recentActivity.map(item => ({...item, type: 'supplier'}))];
        }
      }
      
      combinedAnalytics.recentActivity.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
      combinedAnalytics.recentActivity = combinedAnalytics.recentActivity.slice(0, 15);
      
      setAnalytics(combinedAnalytics);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    }
  }, [filters, showEmployeeInvoices, showSupplierInvoices]);

  useEffect(() => {
    fetchAllInvoices();
    fetchAnalytics();
  }, [fetchAllInvoices, fetchAnalytics]);

  // UPDATED: Handle bulk assignment - generates approval chains for employee invoices
  const handleBulkAssignment = async (values) => {
    if (selectedInvoices.length === 0) {
      message.warning('Please select invoices to assign');
      return;
    }

    try {
      setLoading(true);
      
      const employeeInvoiceIds = [];
      const supplierInvoiceIds = [];
      
      selectedInvoices.forEach(id => {
        if (id.startsWith('emp_')) {
          employeeInvoiceIds.push(id.replace('emp_', ''));
        } else if (id.startsWith('sup_')) {
          supplierInvoiceIds.push(id.replace('sup_', ''));
        }
      });
      
      const results = { successful: [], failed: [] };
      
      // Process employee invoices - THIS NOW GENERATES APPROVAL CHAINS
      if (employeeInvoiceIds.length > 0) {
        try {
          const empResponse = await api.post('/api/invoices/finance/bulk-assign', {
            invoiceIds: employeeInvoiceIds,
            department: values.department,
            comments: values.comments
          });
          
          if (empResponse.data.success) {
            results.successful.push(...empResponse.data.data.successful.map(item => ({...item, type: 'employee'})));
            results.failed.push(...empResponse.data.data.failed.map(item => ({...item, type: 'employee'})));
            
            // Show notification about approval chains created
            if (empResponse.data.data.successful.length > 0) {
              notification.success({
                message: 'Employee Invoices Assigned',
                description: `${empResponse.data.data.successful.length} employee invoice(s) assigned with approval chains created. First approvers have been notified.`,
                duration: 5
              });
            }
          }
        } catch (error) {
          results.failed.push(...employeeInvoiceIds.map(id => ({
            invoiceId: id,
            error: 'Failed to assign employee invoice',
            type: 'employee'
          })));
        }
      }
      
      // Process supplier invoices - REMAINS THE SAME
      if (supplierInvoiceIds.length > 0) {
        try {
          const supResponse = await api.post('/api/suppliers/admin/invoices/bulk-assign', {
            invoiceIds: supplierInvoiceIds,
            department: values.department,
            comments: values.comments
          });
          
          if (supResponse.data.success) {
            results.successful.push(...supResponse.data.data.successful.map(item => ({...item, type: 'supplier'})));
            results.failed.push(...supResponse.data.data.failed.map(item => ({...item, type: 'supplier'})));
            
            if (supResponse.data.data.successful.length > 0) {
              notification.success({
                message: 'Supplier Invoices Assigned',
                description: `${supResponse.data.data.successful.length} supplier invoice(s) assigned successfully.`,
                duration: 5
              });
            }
          }
        } catch (error) {
          results.failed.push(...supplierInvoiceIds.map(id => ({
            invoiceId: id,
            error: 'Failed to assign supplier invoice',
            type: 'supplier'
          })));
        }
      }
      
      const totalSuccessful = results.successful.length;
      const totalFailed = results.failed.length;
      
      if (totalSuccessful > 0) {
        message.success(`Successfully assigned ${totalSuccessful} invoice(s)`);
      }
      if (totalFailed > 0) {
        message.warning(`Failed to assign ${totalFailed} invoice(s)`);
      }
      
      setSelectedInvoices([]);
      setAssignModalVisible(false);
      form.resetFields();
      fetchAllInvoices();
      
    } catch (error) {
      message.error('Failed to assign invoices');
    } finally {
      setLoading(false);
    }
  };

  // UPDATED: Handle single assignment - generates approval chain for employee invoices
  const handleSingleAssignment = async (invoice, department, comments) => {
    try {
      setLoading(true);
      
      const isSupplierInvoice = invoice.invoiceType === 'supplier';
      const endpoint = isSupplierInvoice 
        ? `/api/suppliers/admin/invoices/${invoice._id}/assign`
        : `/api/invoices/finance/assign/${invoice._id}`;
      
      const response = await api.post(endpoint, {
        department,
        comments
      });
      
      if (response.data.success) {
        if (isSupplierInvoice) {
          message.success('Supplier invoice assigned successfully');
        } else {
          message.success('Employee invoice assigned successfully. Approval chain has been created and first approver notified.');
        }
        fetchAllInvoices();
      } else {
        throw new Error(response.data.message);
      }
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to assign invoice');
    } finally {
      setLoading(false);
    }
  };

  // UPDATED: Handle mark as processed - only for invoices that completed approval chain
  const handleMarkAsProcessed = async (invoice) => {
    try {
      setLoading(true);
      
      const isSupplierInvoice = invoice.invoiceType === 'supplier';
      let endpoint, data;
      
      if (isSupplierInvoice) {
        endpoint = `/api/suppliers/admin/invoices/${invoice._id}/process`;
        data = {
          comments: 'Invoice processed by finance and ready for payment'
        };
      } else {
        // For employee invoices - only process if fully approved
        if (invoice.approvalStatus !== 'approved') {
          message.warning('Employee invoice must be fully approved before processing');
          return;
        }
        endpoint = `/api/invoices/finance/process/${invoice._id}`;
        data = {
          comments: 'Invoice processed by finance'
        };
      }
      
      const response = await api.put(endpoint, data);
      
      if (response.data.success) {
        message.success('Invoice marked as processed successfully');
        fetchAllInvoices();
      } else {
        throw new Error(response.data.message);
      }
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to process invoice');
    } finally {
      setLoading(false);
    }
  };

  // Handle payment processing
  const handleMarkAsPaid = async (invoice) => {
    try {
      setLoading(true);
      
      const isSupplierInvoice = invoice.invoiceType === 'supplier';
      let endpoint, data;
      
      if (isSupplierInvoice) {
        endpoint = `/api/suppliers/admin/invoices/${invoice._id}/payment`;
        data = {
          paymentAmount: invoice.invoiceAmount,
          paymentMethod: 'Bank Transfer',
          comments: 'Payment processed by finance'
        };
      } else {
        endpoint = `/api/invoices/finance/process/${invoice._id}`;
        data = {
          paymentAmount: invoice.invoiceAmount,
          paymentMethod: 'Bank Transfer',
          comments: 'Payment processed by finance'
        };
      }
      
      const response = await api.put(endpoint, data);
      
      if (response.data.success) {
        message.success('Payment processed successfully');
        fetchAllInvoices();
      } else {
        throw new Error(response.data.message);
      }
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to process payment');
    } finally {
      setLoading(false);
    }
  };

  // Handle view invoice details
  const handleViewDetails = async (invoice) => {
    try {
      const isSupplierInvoice = invoice.invoiceType === 'supplier';
      const endpoint = isSupplierInvoice 
        ? `/api/suppliers/invoices/${invoice._id}`
        : `/api/invoices/${invoice._id}`;
      
      const response = await api.get(endpoint);
      
      if (response.data.success) {
        setSelectedInvoice({
          ...response.data.data,
          invoiceType: invoice.invoiceType
        });
        setDetailsModalVisible(true);
      } else {
        throw new Error(response.data.message);
      }
    } catch (error) {
      message.error('Failed to fetch invoice details');
    }
  };

  // Export to Excel
  const exportToExcel = () => {
    const exportData = combinedInvoices.map(invoice => ({
      'Type': invoice.invoiceType === 'supplier' ? 'Supplier' : 'Employee',
      'PO Number': invoice.poNumber,
      'Invoice Number': invoice.invoiceNumber,
      'Company/Employee': invoice.invoiceType === 'supplier' 
        ? invoice.supplierDetails?.companyName 
        : invoice.employeeDetails?.name || 'N/A',
      'Contact/Position': invoice.invoiceType === 'supplier'
        ? invoice.supplierDetails?.contactName
        : invoice.employeeDetails?.position || 'N/A',
      'Department/Category': invoice.invoiceType === 'supplier'
        ? invoice.serviceCategory
        : invoice.employeeDetails?.department || 'N/A',
      'Amount': invoice.invoiceAmount ? `${invoice.currency || 'XAF'} ${invoice.invoiceAmount}` : 'N/A',
      'Upload Date': invoice.uploadedDate ? new Date(invoice.uploadedDate).toLocaleDateString('en-GB') : 'N/A',
      'Status': invoice.statusDisplay || invoice.approvalStatus?.replace(/_/g, ' ').toUpperCase(),
      'Assigned Department': invoice.assignedDepartment || 'Not assigned',
      'Assignment Date': invoice.assignmentDate ? new Date(invoice.assignmentDate).toLocaleDateString('en-GB') : 'N/A',
      'Approval Progress': `${getApprovalProgress(invoice)}%`,
      'Current Approver': invoice.currentApprovalLevel > 0 && invoice.approvalChain 
        ? invoice.approvalChain.find(step => step.level === invoice.currentApprovalLevel)?.approver?.name || 'N/A'
        : 'N/A'
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'All Invoices');
    
    const fileName = `all_invoices_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
    
    message.success('Invoice data exported successfully');
  };

  // UPDATED: Status tags with new approval statuses
  const getStatusTag = (status) => {
    const statusMap = {
      // Employee invoice statuses (approval chain)
      'pending_finance_assignment': { color: 'orange', text: 'Pending Assignment', icon: <ClockCircleOutlined /> },
      'pending_department_approval': { color: 'blue', text: 'In Approval Chain', icon: <TeamOutlined /> },
      'approved': { color: 'green', text: 'Fully Approved', icon: <CheckCircleOutlined /> },
      'rejected': { color: 'red', text: 'Rejected', icon: <CloseCircleOutlined /> },
      'processed': { color: 'cyan', text: 'Processed', icon: <CheckCircleOutlined /> },
      
      // Supplier invoice statuses (remain the same)
      'pending_department_head_approval': { color: 'blue', text: 'Department Head Review', icon: <TeamOutlined /> },
      'pending_head_of_business_approval': { color: 'geekblue', text: 'Head of Business Review', icon: <CrownOutlined /> },
      'pending_finance_processing': { color: 'purple', text: 'Pending Finance Processing', icon: <DollarOutlined /> },
      'paid': { color: 'lime', text: 'Paid', icon: <DollarOutlined /> }
    };

    const config = statusMap[status] || { color: 'default', text: status?.replace(/_/g, ' ') || 'Unknown', icon: null };
    return <Tag color={config.color} icon={config.icon}>{config.text}</Tag>;
  };

  const getApprovalProgress = (invoice) => {
    if (!invoice.approvalChain || invoice.approvalChain.length === 0) return 0;
    const approved = invoice.approvalChain.filter(step => step.status === 'approved').length;
    return Math.round((approved / invoice.approvalChain.length) * 100);
  };

  // UPDATED: Tab counts with new statuses
  const getTabCount = (status) => {
    return combinedInvoices.filter(inv => {
      switch (status) {
        case 'unassigned':
          return inv.approvalStatus === 'pending_finance_assignment';
        case 'pending':
          // Employee invoices in approval chain + Supplier invoices in review
          return inv.approvalStatus === 'pending_department_approval' ||
                 inv.approvalStatus === 'pending_department_head_approval' || 
                 inv.approvalStatus === 'pending_head_of_business_approval';
        case 'ready_for_processing':
          return inv.approvalStatus === 'pending_finance_processing';
        case 'approved':
          return inv.approvalStatus === 'approved';
        case 'rejected':
          return inv.approvalStatus === 'rejected';
        case 'processed':
          return inv.approvalStatus === 'processed' || inv.approvalStatus === 'paid';
        default:
          return false;
      }
    }).length;
  };

  const renderAnalyticsDashboard = () => {
    if (!analytics) return <Spin />;

    return (
      <div style={{ padding: '20px' }}>
        <Title level={4}>
          <DashboardOutlined /> Combined Invoice Analytics Dashboard
        </Title>
        
        <Row gutter={16} style={{ marginBottom: '20px' }}>
          <Col span={6}>
            <Statistic
              title="Total Invoices"
              value={combinedInvoices.length}
              prefix={<FileTextOutlined />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="Employee Invoices"
              value={combinedInvoices.filter(inv => inv.invoiceType === 'employee').length}
              valueStyle={{ color: '#1890ff' }}
              prefix={<UserOutlined />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="Supplier Invoices"
              value={combinedInvoices.filter(inv => inv.invoiceType === 'supplier').length}
              valueStyle={{ color: '#52c41a' }}
              prefix={<ShopOutlined />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="Pending Assignment"
              value={getTabCount('unassigned')}
              valueStyle={{ color: '#faad14' }}
              prefix={<ClockCircleOutlined />}
            />
          </Col>
        </Row>

        <Card title="Invoice Type Distribution" style={{ marginBottom: '20px' }}>
          <Row gutter={16}>
            <Col span={12}>
              <Statistic
                title="Employee Invoices"
                value={combinedInvoices.filter(inv => inv.invoiceType === 'employee').length}
                suffix={`/ ${combinedInvoices.length}`}
                prefix={<UserOutlined />}
              />
            </Col>
            <Col span={12}>
              <Statistic
                title="Supplier Invoices"
                value={combinedInvoices.filter(inv => inv.invoiceType === 'supplier').length}
                suffix={`/ ${combinedInvoices.length}`}
                prefix={<ShopOutlined />}
              />
            </Col>
          </Row>
        </Card>

        {analytics.topSuppliers && analytics.topSuppliers.length > 0 && (
          <Card title="Top Suppliers by Value" style={{ marginBottom: '20px' }}>
            <Table
              dataSource={analytics.topSuppliers}
              pagination={false}
              size="small"
              columns={[
                {
                  title: 'Supplier',
                  dataIndex: 'supplierName',
                  key: 'supplier',
                  render: (name, record) => (
                    <div>
                      <Text strong>{name}</Text>
                      <br />
                      <Tag size="small">{record.supplierType}</Tag>
                    </div>
                  )
                },
                {
                  title: 'Invoice Count',
                  dataIndex: 'count',
                  key: 'count'
                },
                {
                  title: 'Total Value',
                  dataIndex: 'totalAmount',
                  key: 'total',
                  render: (amount) => `XAF ${amount?.toLocaleString() || 0}`
                }
              ]}
            />
          </Card>)}

        {analytics.byDepartment && analytics.byDepartment.length > 0 && (
          <Card title="Department Performance (Employee Invoices)" style={{ marginBottom: '20px' }}>
            <Table
              dataSource={analytics.byDepartment}
              pagination={false}
              size="small"
              columns={[
                {
                  title: 'Department',
                  dataIndex: '_id',
                  key: 'department',
                  render: (dept) => <Tag color="blue">{dept}</Tag>
                },
                {
                  title: 'Total Invoices',
                  dataIndex: 'totalInvoices',
                  key: 'total'
                },
                {
                  title: 'Statuses',
                  dataIndex: 'statuses',
                  key: 'statuses',
                  render: (statuses) => (
                    <Space>
                      {statuses?.map(status => (
                        <Tag key={status.status} color="geekblue">
                          {status.status}: {status.count}
                        </Tag>
                      ))}
                    </Space>
                  )
                }
              ]}
            />
          </Card>
        )}

        {analytics.byCategory && analytics.byCategory.length > 0 && (
          <Card title="Service Categories (Supplier Invoices)" style={{ marginBottom: '20px' }}>
            <Table
              dataSource={analytics.byCategory}
              pagination={false}
              size="small"
              columns={[
                {
                  title: 'Category',
                  dataIndex: '_id',
                  key: 'category',
                  render: (cat) => <Tag color="green">{cat}</Tag>
                },
                {
                  title: 'Count',
                  dataIndex: 'count',
                  key: 'count'
                },
                {
                  title: 'Total Amount',
                  dataIndex: 'totalAmount',
                  key: 'total',
                  render: (amount) => `XAF ${amount?.toLocaleString() || 0}`
                },
                {
                  title: 'Paid',
                  dataIndex: 'paidCount',
                  key: 'paid',
                  render: (paid) => <Tag color="cyan">{paid}</Tag>
                }
              ]}
            />
          </Card>
        )}

        {analytics.recentActivity && analytics.recentActivity.length > 0 && (
          <Card title="Recent Activity" style={{ marginBottom: '20px' }}>
            <List
              dataSource={analytics.recentActivity}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<Avatar icon={item.type === 'supplier' ? <ShopOutlined /> : <UserOutlined />} />}
                    title={`${item.poNumber} - ${item.invoiceNumber}`}
                    description={
                      <div>
                        <Text>
                          {item.type === 'supplier' 
                            ? `Supplier: ${item.supplierDetails?.companyName}` 
                            : `Employee: ${item.employeeDetails?.name}`
                          }
                        </Text>
                        <br />
                        <Text type="secondary">
                          {getStatusTag(item.approvalStatus)}
                          {' '}Updated: {new Date(item.updatedAt).toLocaleDateString('en-GB')}
                          {' '}<Tag color={item.type === 'supplier' ? 'green' : 'blue'}>{item.type}</Tag>
                        </Text>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        )}
      </div>
    );
  };

  const columns = [
    {
      title: (
        <Checkbox
          indeterminate={selectedInvoices.length > 0 && selectedInvoices.length < combinedInvoices.length}
          checked={combinedInvoices.length > 0 && selectedInvoices.length === combinedInvoices.length}
          onChange={(e) => {
            if (e.target.checked) {
              setSelectedInvoices(combinedInvoices.map(inv => inv.key));
            } else {
              setSelectedInvoices([]);
            }
          }}
        />
      ),
      dataIndex: 'select',
      key: 'select',
      width: 50,
      render: (_, record) => (
        <Checkbox
          checked={selectedInvoices.includes(record.key)}
          onChange={(e) => {
            if (e.target.checked) {
              setSelectedInvoices([...selectedInvoices, record.key]);
            } else {
              setSelectedInvoices(selectedInvoices.filter(id => id !== record.key));
            }
          }}
          disabled={record.approvalStatus !== 'pending_finance_assignment'}
        />
      )
    },
    {
      title: 'Type',
      dataIndex: 'invoiceType',
      key: 'type',
      width: 80,
      render: (type) => (
        <Tag color={type === 'supplier' ? 'green' : 'blue'} icon={type === 'supplier' ? <ShopOutlined /> : <UserOutlined />}>
          {type === 'supplier' ? 'Supplier' : 'Employee'}
        </Tag>
      ),
      filters: [
        { text: 'Employee', value: 'employee' },
        { text: 'Supplier', value: 'supplier' }
      ],
      onFilter: (value, record) => record.invoiceType === value
    },
    {
      title: 'PO Number',
      dataIndex: 'poNumber',
      key: 'poNumber',
      render: (text) => <Text code>{text}</Text>,
      width: 150,
      sorter: (a, b) => a.poNumber.localeCompare(b.poNumber)
    },
    {
      title: 'Invoice Number',
      dataIndex: 'invoiceNumber',
      key: 'invoiceNumber',
      width: 140
    },
    {
      title: 'Company/Employee',
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
          <br />
          <Tag size="small" color={record.invoiceType === 'supplier' ? 'green' : 'geekblue'}>
            {record.invoiceType === 'supplier'
              ? record.serviceCategory || record.supplierDetails?.supplierType
              : record.employeeDetails?.department || record.employee?.department || 'N/A'
            }
          </Tag>
        </div>
      ),
      width: 220
    },
    {
      title: 'Amount',
      dataIndex: 'invoiceAmount',
      key: 'amount',
      render: (amount, record) => (
        <div>
          {amount > 0 ? (
            <>
              <Text strong>{record.currency || 'XAF'} {amount.toLocaleString()}</Text>
              {record.invoiceType === 'supplier' && record.dueDate && (
                <>
                  <br />
                  <Text type="secondary" style={{ fontSize: '11px' }}>
                    Due: {new Date(record.dueDate).toLocaleDateString('en-GB')}
                  </Text>
                </>
              )}
            </>
          ) : (
            <Text type="secondary">Amount pending</Text>
          )}
        </div>
      ),
      width: 120,
      sorter: (a, b) => (a.invoiceAmount || 0) - (b.invoiceAmount || 0)
    },
    {
      title: 'Upload Date/Time',
      key: 'uploadDateTime',
      render: (_, record) => (
        <div>
          <div>
            {record.uploadedDate 
              ? new Date(record.uploadedDate).toLocaleDateString('en-GB')
              : record.createdAt 
              ? new Date(record.createdAt).toLocaleDateString('en-GB')
              : 'N/A'
            }
          </div>
          <Text type="secondary" style={{ fontSize: '11px' }}>
            {record.uploadedTime || 
             (record.createdAt ? new Date(record.createdAt).toTimeString().split(' ')[0] : 'N/A')
            }
          </Text>
        </div>
      ),
      sorter: (a, b) => {
        const dateA = new Date(a.uploadedDate || a.createdAt || 0);
        const dateB = new Date(b.uploadedDate || b.createdAt || 0);
        return dateA - dateB;
      },
      width: 120
    },
    {
      title: 'Status',
      dataIndex: 'approvalStatus',
      key: 'status',
      render: (status, record) => (
        <div>
          {getStatusTag(status)}
          {/* Show current approver for employee invoices in approval chain */}
          {record.invoiceType === 'employee' && 
           status === 'pending_department_approval' && 
           record.currentApprovalLevel > 0 && 
           record.approvalChain && (
            <>
              <br />
              <Text type="secondary" style={{ fontSize: '11px' }}>
                Current: {record.approvalChain.find(step => step.level === record.currentApprovalLevel)?.approver?.name || 'N/A'}
              </Text>
            </>
          )}
        </div>
      ),
      filters: [
        { text: 'Pending Assignment', value: 'pending_finance_assignment' },
        { text: 'In Approval Chain', value: 'pending_department_approval' },
        { text: 'Department Head Review', value: 'pending_department_head_approval' },
        { text: 'Head of Business Review', value: 'pending_head_of_business_approval' },
        { text: 'Pending Finance Processing', value: 'pending_finance_processing' },
        { text: 'Approved', value: 'approved' },
        { text: 'Rejected', value: 'rejected' },
        { text: 'Processed', value: 'processed' },
        { text: 'Paid', value: 'paid' }
      ],
      width: 180
    },
    {
      title: 'Assigned Department',
      dataIndex: 'assignedDepartment',
      key: 'department',
      render: (dept) => dept ? <Tag color="blue">{dept}</Tag> : <Text type="secondary">Not assigned</Text>,
      width: 130
    },
    {
      title: 'Progress',
      key: 'progress',
      render: (_, record) => {
        const progress = getApprovalProgress(record);
        let status = 'active';
        if (record.approvalStatus === 'rejected') status = 'exception';
        if (record.approvalStatus === 'approved' || 
            record.approvalStatus === 'pending_finance_processing' || 
            record.approvalStatus === 'processed' || 
            record.approvalStatus === 'paid') status = 'success';
        
        return (
          <div style={{ width: 80 }}>
            <Progress 
              percent={progress} 
              size="small" 
              status={status}
              showInfo={false}
            />
            <Text style={{ fontSize: '11px' }}>{progress}%</Text>
            {/* Show approval level for employee invoices */}
            {record.invoiceType === 'employee' && 
             record.currentApprovalLevel > 0 && 
             record.approvalChain && (
              <Text style={{ fontSize: '10px', display: 'block', color: '#1890ff' }}>
                L{record.currentApprovalLevel}/{record.approvalChain.length}
              </Text>
            )}
          </div>
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
            <Tooltip title={record.poFile.originalName}>
              <Button 
                size="small" 
                icon={<FileOutlined />} 
                type="link"
                onClick={() => downloadFile(record.poFile, 'po')}
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
                onClick={() => downloadFile(record.invoiceFile, 'invoice')}
              >
                Invoice
              </Button>
            </Tooltip>
          )}
        </Space>
      ),
      width: 80
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="View Details">
            <Button 
              size="small" 
              icon={<EyeOutlined />}
              onClick={() => handleViewDetails(record)}
            />
          </Tooltip>
          
          {record.approvalStatus === 'pending_finance_assignment' && (
            <Tooltip title={record.invoiceType === 'employee' ? 'Assign & Create Approval Chain' : 'Assign Department'}>
              <Button 
                size="small" 
                type="primary"
                icon={<SendOutlined />}
                onClick={() => {
                  setSelectedInvoice(record);
                  setSelectedInvoices([record.key]);
                  setAssignModalVisible(true);
                }}
              >
                Assign
              </Button>
            </Tooltip>
          )}
          
          {/* Only show Process button for approved invoices or supplier invoices at finance processing */}
          {(record.approvalStatus === 'approved' || 
            (record.invoiceType === 'supplier' && record.approvalStatus === 'pending_finance_processing')) && (
            <Popconfirm
              title="Mark as processed?"
              description={`This will mark the ${record.invoiceType} invoice as processed and ready for payment.`}
              onConfirm={() => handleMarkAsProcessed(record)}
              okText="Yes"
              cancelText="No"
            >
              <Button 
                size="small" 
                type="primary" 
                icon={<AuditOutlined />}
              >
                Process
              </Button>
            </Popconfirm>
          )}
          
          {(record.approvalStatus === 'processed') && (
            <Popconfirm
              title={`${record.invoiceType === 'supplier' ? 'Process payment' : 'Mark as paid'}?`}
              description={`This will ${record.invoiceType === 'supplier' ? 'process the payment for this supplier invoice' : 'mark the invoice as paid'}.`}
              onConfirm={() => handleMarkAsPaid(record)}
              okText="Yes"
              cancelText="No"
            >
              <Button 
                size="small" 
                type="primary" 
                ghost
                icon={<DollarOutlined />}
              >
                Pay
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
      width: 120,
      fixed: 'right'
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <Title level={2} style={{ margin: 0 }}>
            <AuditOutlined /> Finance Invoice Management System
          </Title>
          <Space>
            <Button 
              icon={<DashboardOutlined />}
              onClick={() => setAnalyticsDrawerVisible(true)}
            >
              Analytics
            </Button>
            <Button 
              icon={<ExportOutlined />}
              onClick={exportToExcel}
            >
              Export
            </Button>
            <Button 
              icon={<ReloadOutlined />} 
              onClick={() => {
                fetchAllInvoices();
                fetchAnalytics();
              }}
              loading={loading}
            >
              Refresh
            </Button>
          </Space>
        </div>

        {/* Invoice Type Filters */}
        <Card size="small" style={{ marginBottom: '16px', backgroundColor: '#f0f8ff' }}>
          <Row gutter={16} align="middle">
            <Col span={4}>
              <Text strong>Show Invoices:</Text>
            </Col>
            <Col span={6}>
              <Space>
                <Switch 
                  checked={showEmployeeInvoices}
                  onChange={setShowEmployeeInvoices}
                  checkedChildren={<UserOutlined />}
                  unCheckedChildren={<UserOutlined />}
                />
                <Text>Employee ({invoices.length})</Text>
              </Space>
            </Col>
            <Col span={6}>
              <Space>
                <Switch 
                  checked={showSupplierInvoices}
                  onChange={setShowSupplierInvoices}
                  checkedChildren={<ShopOutlined />}
                  unCheckedChildren={<ShopOutlined />}
                />
                <Text>Supplier ({supplierInvoices.length})</Text>
              </Space>
            </Col>
            <Col span={8}>
              <Select
                placeholder="Filter by type"
                style={{ width: '100%' }}
                allowClear
                value={filters.invoiceType}
                onChange={(value) => setFilters(prev => ({ ...prev, invoiceType: value || 'all' }))}
              >
                <Option value="all">All Types</Option>
                <Option value="employee">Employee Only</Option>
                <Option value="supplier">Supplier Only</Option>
              </Select>
            </Col>
          </Row>
        </Card>

        {/* Enhanced Filters */}
        <Card size="small" style={{ marginBottom: '16px', backgroundColor: '#fafafa' }}>
          <Row gutter={16}>
            <Col span={6}>
              <Select
                placeholder="Filter by Department"
                style={{ width: '100%' }}
                allowClear
                value={filters.department}
                onChange={(value) => setFilters(prev => ({ ...prev, department: value }))}
              >
                <Option value="Technical">Technical</Option>
                <Option value="Business Development">Business Development</Option>
                <Option value="HR & Admin">HR & Admin</Option>
                <Option value="Finance">Finance</Option>
              </Select>
            </Col>
            
            <Col span={6}>
              <Select
                placeholder="Filter by Status"
                style={{ width: '100%' }}
                allowClear
                value={filters.status}
                onChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
              >
                <Option value="pending_finance_assignment">Pending Assignment</Option>
                <Option value="pending_department_approval">In Approval Chain</Option>
                <Option value="approved">Fully Approved</Option>
                <Option value="rejected">Rejected</Option>
                <Option value="processed">Processed</Option>
                <Option value="paid">Paid</Option>
              </Select>
            </Col>

            <Col span={6}>
              <RangePicker
                style={{ width: '100%' }}
                placeholder={['Start Date', 'End Date']}
                value={filters.dateRange}
                onChange={(dates) => setFilters(prev => ({ ...prev, dateRange: dates }))}
              />
            </Col>

            <Col span={6}>
              <Input
                placeholder="Search employee/supplier"
                allowClear
                prefix={<FilterOutlined />}
                value={filters.employee}
                onChange={(e) => setFilters(prev => ({ ...prev, employee: e.target.value }))}
              />
            </Col>
          </Row>
        </Card>

        {/* Bulk Actions */}
        {selectedInvoices.length > 0 && (
          <Alert
            message={`${selectedInvoices.length} invoice(s) selected`}
            description={
              <div>
                {selectedInvoices.filter(id => id.startsWith('emp_')).length > 0 && (
                  <Text>Employee: {selectedInvoices.filter(id => id.startsWith('emp_')).length} (will create approval chains) </Text>
                )}
                {selectedInvoices.filter(id => id.startsWith('sup_')).length > 0 && (
                  <Text>Supplier: {selectedInvoices.filter(id => id.startsWith('sup_')).length} </Text>
                )}
              </div>
            }
            type="info"
            showIcon
            action={
              <Space>
                <Button 
                  size="small"
                  onClick={() => setSelectedInvoices([])}
                >
                  Clear Selection
                </Button>
                <Button 
                  size="small" 
                  type="primary"
                  icon={<SendOutlined />}
                  onClick={() => setAssignModalVisible(true)}
                >
                  Bulk Assign
                </Button>
              </Space>
            }
            style={{ marginBottom: '16px' }}
          />
        )}

        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane 
            tab={
              <Badge count={getTabCount('unassigned')} size="small">
                <span><ClockCircleOutlined /> Unassigned ({getTabCount('unassigned')})</span>
              </Badge>
            } 
            key="unassigned"
          />
          <TabPane 
            tab={
              <Badge count={getTabCount('pending')} size="small">
                <span><TeamOutlined /> Pending Approval ({getTabCount('pending')})</span>
              </Badge>
            } 
            key="pending"
          />
          <TabPane 
            tab={
              <Badge count={getTabCount('ready_for_processing')} size="small" style={{ backgroundColor: '#722ed1' }}>
                <span><AuditOutlined /> Ready for Processing ({getTabCount('ready_for_processing')})</span>
              </Badge>
            } 
            key="ready_for_processing"
          />
          <TabPane 
            tab={
              <Badge count={getTabCount('approved')} size="small" style={{ backgroundColor: '#52c41a' }}>
                <span><CheckCircleOutlined /> Approved ({getTabCount('approved')})</span>
              </Badge>
            } 
            key="approved"
          />
          <TabPane 
            tab={
              <Badge count={getTabCount('rejected')} size="small" style={{ backgroundColor: '#ff4d4f' }}>
                <span><CloseCircleOutlined /> Rejected ({getTabCount('rejected')})</span>
              </Badge>
            } 
            key="rejected"
          />
          <TabPane 
            tab={
              <Badge count={getTabCount('processed')} size="small" style={{ backgroundColor: '#722ed1' }}>
                <span><CheckCircleOutlined /> Processed/Paid ({getTabCount('processed')})</span>
              </Badge>
            } 
            key="processed"
          />
        </Tabs>

        <Table
          columns={columns}
          dataSource={combinedInvoices.filter(invoice => {
            switch (activeTab) {
              case 'unassigned':
                return invoice.approvalStatus === 'pending_finance_assignment';
              case 'pending':
                return invoice.approvalStatus === 'pending_department_approval' ||
                       invoice.approvalStatus === 'pending_department_head_approval' || 
                       invoice.approvalStatus === 'pending_head_of_business_approval';
              case 'ready_for_processing':
                return invoice.approvalStatus === 'pending_finance_processing';
              case 'approved':
                return invoice.approvalStatus === 'approved';
              case 'rejected':
                return invoice.approvalStatus === 'rejected';
              case 'processed':
                return invoice.approvalStatus === 'processed' || invoice.approvalStatus === 'paid';
              default:
                return true;
            }
          })}
          loading={loading}
          rowKey="key"
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} invoices`,
            onChange: (page, pageSize) => {
              setPagination(prev => ({ ...prev, current: page, pageSize }));
            }
          }}
          scroll={{ x: 1500 }}
          size="small"
          rowClassName={(record) => 
            record.invoiceType === 'supplier' ? 'supplier-invoice-row' : 'employee-invoice-row'
          }
        />
      </Card>

      {/* Enhanced Assignment Modal */}
      <Modal
        title={
          <Space>
            <TeamOutlined />
            {selectedInvoices.length > 1 ? `Bulk Assign ${selectedInvoices.length} Invoices` : 'Assign Invoice to Department'}
          </Space>
        }
        open={assignModalVisible}
        onCancel={() => {
          setAssignModalVisible(false);
          setSelectedInvoice(null);
          setSelectedInvoices([]);
          form.resetFields();
        }}
        footer={null}
        width={700}
      >
        <Alert
          message={selectedInvoices.length > 1 ? "Bulk Invoice Assignment" : "Invoice Assignment"}
          description={
            <div>
              <Paragraph>
                Assigning {selectedInvoices.length} invoice(s) to the appropriate department.
              </Paragraph>
              {selectedInvoices.filter(id => id.startsWith('emp_')).length > 0 && (
                <Alert
                  type="info"
                  showIcon
                  message="Employee Invoice Approval Chain"
                  description={`${selectedInvoices.filter(id => id.startsWith('emp_')).length} employee invoice(s) will have approval chains created based on department hierarchy. First approvers will be notified automatically.`}
                  style={{ marginTop: '8px' }}
                />
              )}
              {selectedInvoices.filter(id => id.startsWith('sup_')).length > 0 && (
                <Alert
                  type="success"
                  showIcon
                  message="Supplier Invoice Assignment"
                  description={`${selectedInvoices.filter(id => id.startsWith('sup_')).length} supplier invoice(s) will be assigned for department review.`}
                  style={{ marginTop: '8px' }}
                />
              )}
            </div>
          }
          type="warning"
          showIcon
          style={{ marginBottom: '16px' }}
        />

        {selectedInvoices.length > 1 && (
          <div style={{ marginBottom: '16px' }}>
            <Text strong>Selected Invoices Breakdown:</Text>
            <Row gutter={16} style={{ marginTop: '8px' }}>
              <Col span={12}>
                <Statistic
                  title="Employee Invoices"
                  value={selectedInvoices.filter(id => id.startsWith('emp_')).length}
                  prefix={<UserOutlined />}
                  valueStyle={{ fontSize: '16px', color: '#1890ff' }}
                  suffix="(with approval chains)"
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="Supplier Invoices"
                  value={selectedInvoices.filter(id => id.startsWith('sup_')).length}
                  prefix={<ShopOutlined />}
                  valueStyle={{ fontSize: '16px', color: '#52c41a' }}
                />
              </Col>
            </Row>
          </div>
        )}

        <Form
          form={form}
          layout="vertical"
          onFinish={handleBulkAssignment}
        >
          <Form.Item
            name="department"
            label="Select Department"
            rules={[{ required: true, message: 'Please select a department' }]}
            help="For employee invoices, this will determine the approval chain hierarchy"
          >
            <Select placeholder="Choose department for approval" size="large">
              <Option value="Technical">
                <div>
                  <Text strong>Technical</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    Head: Mr. Didier Oyong
                  </Text>
                </div>
              </Option>
              <Option value="Business Development & Supply Chain">
                <div>
                  <Text strong>Business Development & Supply Chain</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    Head: Mr. E.T Kelvin
                  </Text>
                </div>
              </Option>
              <Option value="HR & Admin">
                <div>
                  <Text strong>HR & Admin</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    Head: Mrs. Bruiline Tsitoh
                  </Text>
                </div>
              </Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="comments"
            label="Assignment Comments (Optional)"
          >
            <TextArea 
              rows={3} 
              placeholder="Add any comments about this assignment..."
              showCount
              maxLength={300}
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button onClick={() => {
                setAssignModalVisible(false);
                setSelectedInvoice(null);
                setSelectedInvoices([]);
                form.resetFields();
              }}>
                Cancel
              </Button>
              <Button 
                type="primary" 
                htmlType="submit"
                loading={loading}
                icon={<SendOutlined />}
              >
                {selectedInvoices.length > 1 ? `Assign ${selectedInvoices.length} Invoices` : 'Assign & Create Approval Chain'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Analytics Drawer */}
      <Drawer
        title="Combined Invoice Analytics Dashboard"
        placement="right"
        width={800}
        open={analyticsDrawerVisible}
        onClose={() => setAnalyticsDrawerVisible(false)}
      >
        {renderAnalyticsDashboard()}
      </Drawer>

      {/* Enhanced Details Modal */}
      <Modal
        title={
          <Space>
            <FileTextOutlined />
            {selectedInvoice?.invoiceType === 'supplier' ? 'Supplier' : 'Employee'} Invoice Details & Approval History
            <Tag color={selectedInvoice?.invoiceType === 'supplier' ? 'green' : 'blue'}>
              {selectedInvoice?.invoiceType?.toUpperCase()}
            </Tag>
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
              <Descriptions.Item label="Invoice Type" span={2}>
                <Tag color={selectedInvoice.invoiceType === 'supplier' ? 'green' : 'blue'} icon={selectedInvoice.invoiceType === 'supplier' ? <ShopOutlined /> : <UserOutlined />}>
                  {selectedInvoice.invoiceType === 'supplier' ? 'Supplier Invoice' : 'Employee Invoice'}
                </Tag>
                {selectedInvoice.invoiceType === 'employee' && selectedInvoice.approvalChain && (
                  <Tag color="purple" style={{ marginLeft: 8 }}>
                    {selectedInvoice.approvalChain.length} Level Approval Chain
                  </Tag>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="PO Number" span={2}>
                <Text code copyable>{selectedInvoice.poNumber}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Invoice Number">
                {selectedInvoice.invoiceNumber}
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                {getStatusTag(selectedInvoice.approvalStatus)}
              </Descriptions.Item>
              
              {selectedInvoice.invoiceType === 'supplier' ? (
                <>
                  <Descriptions.Item label="Supplier Company">
                    <div>
                      <Text strong>{selectedInvoice.supplierDetails?.companyName}</Text>
                      <br />
                      <Text type="secondary">{selectedInvoice.supplierDetails?.contactName}</Text>
                    </div>
                  </Descriptions.Item>
                  <Descriptions.Item label="Supplier Type">
                    <Tag color="green">{selectedInvoice.supplierDetails?.supplierType}</Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Service Category">
                    <Tag color="purple">{selectedInvoice.serviceCategory}</Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Invoice Amount">
                    <Text strong>{selectedInvoice.currency || 'XAF'} {selectedInvoice.invoiceAmount?.toLocaleString() || 'Pending'}</Text>
                  </Descriptions.Item>
                  {selectedInvoice.dueDate && (
                    <Descriptions.Item label="Due Date">
                      <CalendarOutlined /> {new Date(selectedInvoice.dueDate).toLocaleDateString('en-GB')}
                    </Descriptions.Item>
                  )}
                  {selectedInvoice.paymentDetails && (
                    <Descriptions.Item label="Payment Status" span={2}>
                      <div>
                        <Tag color="cyan" icon={<DollarOutlined />}>PAID</Tag>
                        <Text>Amount: {selectedInvoice.currency || 'XAF'} {selectedInvoice.paymentDetails.amountPaid?.toLocaleString()}</Text>
                        <br />
                        <Text type="secondary">
                          Paid on: {new Date(selectedInvoice.paymentDetails.paymentDate).toLocaleDateString('en-GB')}
                          {selectedInvoice.paymentDetails.transactionReference && (
                            <> | Ref: {selectedInvoice.paymentDetails.transactionReference}</>
                          )}
                        </Text>
                      </div>
                    </Descriptions.Item>
                  )}
                </>
              ) : (
                <>
                  <Descriptions.Item label="Employee">
                    <div>
                      <Text strong>{selectedInvoice.employeeDetails?.name || selectedInvoice.employee?.fullName}</Text>
                      <br />
                      <Text type="secondary">{selectedInvoice.employeeDetails?.position}</Text>
                    </div>
                  </Descriptions.Item>
                  <Descriptions.Item label="Department">
                    <Tag color="geekblue">{selectedInvoice.employeeDetails?.department}</Tag>
                  </Descriptions.Item>
                  {selectedInvoice.currentApprovalLevel > 0 && selectedInvoice.approvalChain && (
                    <Descriptions.Item label="Current Approval Level" span={2}>
                      <div>
                        <Tag color="blue">Level {selectedInvoice.currentApprovalLevel} of {selectedInvoice.approvalChain.length}</Tag>
                        <br />
                        <Text type="secondary">
                          Current Approver: {selectedInvoice.approvalChain.find(step => step.level === selectedInvoice.currentApprovalLevel)?.approver?.name || 'N/A'}
                        </Text>
                      </div>
                    </Descriptions.Item>
                  )}
                </>
              )}
              
              <Descriptions.Item label="Upload Date/Time">
                <div>
                  <CalendarOutlined /> {selectedInvoice.uploadedDate 
                    ? new Date(selectedInvoice.uploadedDate).toLocaleDateString('en-GB')
                    : selectedInvoice.createdAt
                    ? new Date(selectedInvoice.createdAt).toLocaleDateString('en-GB')
                    : 'N/A'
                  }
                  <br />
                  <Text type="secondary">
                    {selectedInvoice.uploadedTime || 
                     (selectedInvoice.createdAt ? new Date(selectedInvoice.createdAt).toTimeString().split(' ')[0] : 'N/A')
                    }
                  </Text>
                </div>
              </Descriptions.Item>
              <Descriptions.Item label="Assigned Department">
                {selectedInvoice.assignedDepartment ? (
                  <Tag color="green">{selectedInvoice.assignedDepartment}</Tag>
                ) : (
                  <Text type="secondary">Not assigned</Text>
                )}
              </Descriptions.Item>
            </Descriptions>

            {/* File Downloads */}
            <Card size="small" title="Attached Files" style={{ marginBottom: '20px' }}>
              <Space>
                {selectedInvoice.poFile && (
                  <Button 
                    icon={<FileOutlined />}
                    onClick={() => downloadFile(selectedInvoice.poFile, 'po')}
                  >
                    Download PO File ({selectedInvoice.poFile.originalName})
                  </Button>
                )}
                {selectedInvoice.invoiceFile && (
                  <Button 
                    icon={<FileOutlined />}
                    onClick={() => downloadFile(selectedInvoice.invoiceFile, 'invoice')}
                  >
                    Download Invoice File ({selectedInvoice.invoiceFile.originalName})
                  </Button>
                )}
                {!selectedInvoice.poFile && !selectedInvoice.invoiceFile && (
                  <Text type="secondary">No files attached</Text>
                )}
              </Space>
            </Card>

            {/* Supplier specific information */}
            {selectedInvoice.invoiceType === 'supplier' && selectedInvoice.description && (
              <Card size="small" title="Invoice Description" style={{ marginBottom: '20px' }}>
                <Paragraph>{selectedInvoice.description}</Paragraph>
              </Card>
            )}

            {/* UPDATED: Employee Invoice Approval Chain - Sequential Display */}
            {selectedInvoice.invoiceType === 'employee' && selectedInvoice.approvalChain && selectedInvoice.approvalChain.length > 0 && (
              <>
                <Title level={4}>
                  <HistoryOutlined /> Sequential Approval Chain Progress
                </Title>
                
                <Alert
                  message="Employee Invoice Approval Chain"
                  description={`This invoice follows a ${selectedInvoice.approvalChain.length}-level sequential approval process. Each level must be completed before the next can proceed.`}
                  type="info"
                  showIcon
                  style={{ marginBottom: '16px' }}
                />

                <Progress 
                  percent={getApprovalProgress(selectedInvoice)} 
                  status={selectedInvoice.approvalStatus === 'rejected' ? 'exception' : 
                          selectedInvoice.approvalStatus === 'approved' ? 'success' : 'active'}
                  style={{ marginBottom: '20px' }}
                  strokeColor={{
                    '0%': '#108ee9',
                    '100%': '#87d068',
                  }}
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
                    } else if (step.level === selectedInvoice.currentApprovalLevel) {
                      color = 'blue';
                      icon = <ClockCircleOutlined spin />;
                    }

                    const isCurrentLevel = step.level === selectedInvoice.currentApprovalLevel;
                    const isCompleted = step.status !== 'pending';
                    const isWaiting = step.status === 'pending' && step.level > selectedInvoice.currentApprovalLevel;

                    return (
                      <Timeline.Item key={index} color={color} dot={icon}>
                        <div>
                          <Space>
                            <Text strong>Level {step.level}: {step.approver.name}</Text>
                            {isCurrentLevel && <Tag color="blue">CURRENT LEVEL</Tag>}
                            {isWaiting && <Tag color="default">WAITING</Tag>}
                          </Space>
                          <br />
                          <Text type="secondary">{step.approver.role} - {step.approver.email}</Text>
                          <br />
                          <Tag size="small" color="purple">{step.approver.department}</Tag>
                          <br />
                          
                          {step.status === 'pending' && isCurrentLevel && (
                            <div style={{ marginTop: 8 }}>
                              <Tag color="orange" icon={<ClockCircleOutlined />}>⏳ Awaiting Action</Tag>
                              <br />
                              <Text type="secondary" style={{ fontSize: '11px' }}>
                                Activated: {step.activatedDate ? new Date(step.activatedDate).toLocaleDateString('en-GB') : 'N/A'}
                              </Text>
                            </div>
                          )}
                          
                          {step.status === 'pending' && isWaiting && (
                            <div style={{ marginTop: 8 }}>
                              <Tag color="default">⏸ Waiting for previous level</Tag>
                            </div>
                          )}
                          
                          {step.status === 'approved' && (
                            <div style={{ marginTop: 8 }}>
                              <Tag color="green" icon={<CheckCircleOutlined />}>✅ Approved</Tag>
                              <br />
                              <Text type="secondary">
                                {new Date(step.actionDate).toLocaleDateString('en-GB')} at {step.actionTime}
                              </Text>
                              {step.comments && (
                                <div style={{ marginTop: 4, padding: '8px', backgroundColor: '#f6ffed', borderRadius: '4px', borderLeft: '3px solid #52c41a' }}>
                                  <Text italic style={{ fontSize: '12px' }}>"{step.comments}"</Text>
                                </div>
                              )}
                            </div>
                          )}
                          
                          {step.status === 'rejected' && (
                            <div style={{ marginTop: 8 }}>
                              <Tag color="red" icon={<CloseCircleOutlined />}>❌ Rejected</Tag>
                              <br />
                              <Text type="secondary">
                                {new Date(step.actionDate).toLocaleDateString('en-GB')} at {step.actionTime}
                              </Text>
                              {step.comments && (
                                <div style={{ marginTop: 4, padding: '8px', backgroundColor: '#fff2f0', borderRadius: '4px', borderLeft: '3px solid #ff4d4f' }}>
                                  <Text strong style={{ color: '#ff4d4f', fontSize: '12px' }}>Rejection Reason:</Text>
                                  <br />
                                  <Text style={{ fontSize: '12px' }}>"{step.comments}"</Text>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </Timeline.Item>
                    );
                  })}
                </Timeline>

                {/* Show notification status */}
                {selectedInvoice.currentApprovalLevel > 0 && (
                  <Card size="small" style={{ backgroundColor: '#e6f7ff', marginTop: '16px' }}>
                    <Space>
                      <BellOutlined style={{ color: '#1890ff' }} />
                      <div>
                        <Text strong>Notification Status:</Text>
                        <br />
                        {selectedInvoice.approvalChain.find(step => step.level === selectedInvoice.currentApprovalLevel)?.notificationSent ? (
                          <Text type="secondary">
                            Current approver was notified on{' '}
                            {new Date(selectedInvoice.approvalChain.find(step => step.level === selectedInvoice.currentApprovalLevel).notificationSentAt).toLocaleDateString('en-GB')}
                          </Text>
                        ) : (
                          <Text type="secondary">Notification pending</Text>
                        )}
                      </div>
                    </Space>
                  </Card>
                )}
              </>
            )}

            {/* Supplier Invoice Approval Chain (remains the same) */}
            {selectedInvoice.invoiceType === 'supplier' && selectedInvoice.approvalChain && selectedInvoice.approvalChain.length > 0 && (
              <>
                <Title level={4}>
                  <HistoryOutlined /> Approval Chain Progress
                </Title>
                <Progress 
                  percent={getApprovalProgress(selectedInvoice)} 
                  status={selectedInvoice.approvalStatus === 'rejected' ? 'exception' : 
                          selectedInvoice.approvalStatus === 'approved' || selectedInvoice.approvalStatus === 'paid' ? 'success' : 'active'}
                  style={{ marginBottom: '20px' }}
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

                    return (
                      <Timeline.Item key={index} color={color} dot={icon}>
                        <div>
                          <Text strong>Level {step.level}: {step.approver.name}</Text>
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
              </>
            )}

            {/* Action Buttons based on status */}
            {selectedInvoice.approvalStatus === 'pending_finance_assignment' && (
              <Alert
                message="Action Required"
                description={`This ${selectedInvoice.invoiceType} invoice is waiting to be assigned to a department ${selectedInvoice.invoiceType === 'employee' ? 'to create the approval chain' : 'for approval processing'}.`}
                type="warning"
                showIcon
                action={
                  <Button 
                    size="small" 
                    type="primary"
                    onClick={() => {
                      setDetailsModalVisible(false);
                      setSelectedInvoices([selectedInvoice.key || `${selectedInvoice.invoiceType === 'supplier' ? 'sup' : 'emp'}_${selectedInvoice._id}`]);
                      setAssignModalVisible(true);
                    }}
                  >
                    Assign Now
                  </Button>
                }
                style={{ marginTop: '20px' }}
              />
            )}

            {selectedInvoice.invoiceType === 'employee' && selectedInvoice.approvalStatus === 'pending_department_approval' && (
              <Alert
                message="In Approval Process"
                description={`This employee invoice is currently at Level ${selectedInvoice.currentApprovalLevel} of ${selectedInvoice.approvalChain?.length || 0}. Waiting for ${selectedInvoice.approvalChain?.find(step => step.level === selectedInvoice.currentApprovalLevel)?.approver?.name || 'approver'} to review.`}
                type="info"
                showIcon
                style={{ marginTop: '20px' }}
              />
            )}

            {selectedInvoice.approvalStatus === 'approved' && (
              <Alert
                message="Fully Approved"
                description={`This ${selectedInvoice.invoiceType} invoice has completed all approval levels and is ready for finance processing.`}
                type="success"
                showIcon
                action={
                  <Button 
                    size="small" 
                    type="primary"
                    icon={<AuditOutlined />}
                    onClick={() => {
                      setDetailsModalVisible(false);
                      handleMarkAsProcessed(selectedInvoice);
                    }}
                  >
                    Process Now
                  </Button>
                }
                style={{ marginTop: '20px' }}
              />
            )}

            {selectedInvoice.financeReview && selectedInvoice.financeReview.finalComments && (
              <Card size="small" title="Finance Comments" style={{ marginTop: '20px' }}>
                <Text>{selectedInvoice.financeReview.finalComments}</Text>
                <br />
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  By: {selectedInvoice.financeReview.reviewedBy?.fullName} on{' '}
                  {selectedInvoice.financeReview.reviewDate ? new Date(selectedInvoice.financeReview.reviewDate).toLocaleDateString('en-GB') : 'N/A'}
                </Text>
              </Card>
            )}

            {/* Supplier-specific additional information */}
            {selectedInvoice.invoiceType === 'supplier' && (
              <>
                {selectedInvoice.lineItems && selectedInvoice.lineItems.length > 0 && (
                  <Card size="small" title="Line Items" style={{ marginTop: '20px' }}>
                    <Table
                      dataSource={selectedInvoice.lineItems}
                      pagination={false}
                      size="small"
                      columns={[
                        {
                          title: 'Description',
                          dataIndex: 'description',
                          key: 'description'
                        },
                        {
                          title: 'Quantity',
                          dataIndex: 'quantity',
                          key: 'quantity'
                        },
                        {
                          title: 'Unit Price',
                          dataIndex: 'unitPrice',
                          key: 'unitPrice',
                          render: (price) => `${selectedInvoice.currency || 'XAF'} ${price?.toLocaleString() || 0}`
                        },
                        {
                          title: 'Total',
                          dataIndex: 'total',
                          key: 'total',
                          render: (total, record) => {
                            const amount = total || (record.quantity * record.unitPrice) || 0;
                            return `${selectedInvoice.currency || 'XAF'} ${amount.toLocaleString()}`;
                          }
                        }
                      ]}
                    />
                  </Card>
                )}

                {selectedInvoice.supplierDetails?.businessRegistrationNumber && (
                  <Card size="small" title="Supplier Registration Details" style={{ marginTop: '20px' }}>
                    <Descriptions column={1} size="small">
                      <Descriptions.Item label="Business Registration Number">
                        {selectedInvoice.supplierDetails.businessRegistrationNumber}
                      </Descriptions.Item>
                      {selectedInvoice.supplierDetails.taxNumber && (
                        <Descriptions.Item label="Tax Number">
                          {selectedInvoice.supplierDetails.taxNumber}
                        </Descriptions.Item>
                      )}
                      {selectedInvoice.supplierDetails.address && (
                        <Descriptions.Item label="Address">
                          {selectedInvoice.supplierDetails.address}
                        </Descriptions.Item>
                      )}
                    </Descriptions>
                  </Card>
                )}
              </>
            )}
          </div>
        )}
      </Modal>

      {/* Custom CSS for row styling */}
      <style jsx>{`
        .supplier-invoice-row {
          background-color: #f6ffed;
        }
        .employee-invoice-row {
          background-color: #f0f8ff;
        }
        .supplier-invoice-row:hover {
          background-color: #d9f7be !important;
        }
        .employee-invoice-row:hover {
          background-color: #bae7ff !important;
        }
      `}</style>
    </div>
  );
};

export default FinanceInvoiceApprovalPage;





