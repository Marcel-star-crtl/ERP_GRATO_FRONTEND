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
    invoiceType: 'all', // 'employee', 'supplier', 'all'
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
      
      // Add filters to params
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
      
      // Add filters to params
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
          // Map supplier fields to match employee invoice structure for table display
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
      // Method 1: Create a backend endpoint for secure file downloads
      const response = await api.get(`/api/files/download/${fileData.publicId}`, {
        responseType: 'blob',
        params: { 
          type: type,
          filename: fileData.originalName 
        }
      });
  
      // Create blob URL and trigger download
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
      
      // Fallback: Try direct URL access
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
      
      // Combine and sort by upload date
      const combined = [...employeeResults, ...supplierResults].sort((a, b) => {
        const dateA = new Date(a.uploadedDate || a.createdAt || 0);
        const dateB = new Date(b.uploadedDate || b.createdAt || 0);
        return dateB - dateA;
      });
      
      setCombinedInvoices(combined);
      
      // Update pagination total
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
      
      // Fetch employee invoice analytics
      if (showEmployeeInvoices) {
        const empParams = new URLSearchParams();
        if (filters.department) empParams.append('department', filters.department);
        if (filters.dateRange && filters.dateRange.length === 2) {
          empParams.append('startDate', filters.dateRange[0].format('YYYY-MM-DD'));
          empParams.append('endDate', filters.dateRange[1].format('YYYY-MM-DD'));
        }
        promises.push(api.get(`/api/invoices/analytics/dashboard?${empParams}`));
      }
      
      // Fetch supplier invoice analytics
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
      
      // Process employee analytics
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
      
      // Process supplier analytics
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
      
      // Sort recent activity by date
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

  // Handle bulk assignment for both invoice types
  const handleBulkAssignment = async (values) => {
    if (selectedInvoices.length === 0) {
      message.warning('Please select invoices to assign');
      return;
    }

    try {
      setLoading(true);
      
      // Separate employee and supplier invoices
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
      
      // Process employee invoices
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
          }
        } catch (error) {
          results.failed.push(...employeeInvoiceIds.map(id => ({
            invoiceId: id,
            error: 'Failed to assign employee invoice',
            type: 'employee'
          })));
        }
      }
      
      // Process supplier invoices
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
        message.success(`Successfully assigned ${totalSuccessful} invoices`);
      }
      if (totalFailed > 0) {
        message.warning(`Failed to assign ${totalFailed} invoices`);
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

  // Handle single assignment for both types
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
        message.success('Invoice assigned successfully');
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

  // Handle mark as processed
  // Handle mark as processed (NEW WORKFLOW: pending_finance_processing -> processed)
  const handleMarkAsProcessed = async (invoice) => {
    try {
      setLoading(true);
      
      const isSupplierInvoice = invoice.invoiceType === 'supplier';
      let endpoint, data;
      
      if (isSupplierInvoice) {
        // For supplier invoices, mark as processed (not payment yet)
        endpoint = `/api/suppliers/admin/invoices/${invoice._id}/process`;
        data = {
          comments: 'Invoice processed by finance and ready for payment'
        };
      } else {
        // For employee invoices, mark as processed
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

  // Handle payment processing (NEW: processed -> paid)
  const handleMarkAsPaid = async (invoice) => {
    try {
      setLoading(true);
      
      const isSupplierInvoice = invoice.invoiceType === 'supplier';
      let endpoint, data;
      
      if (isSupplierInvoice) {
        // For supplier invoices, process payment
        endpoint = `/api/suppliers/admin/invoices/${invoice._id}/payment`;
        data = {
          paymentAmount: invoice.invoiceAmount,
          paymentMethod: 'Bank Transfer',
          comments: 'Payment processed by finance'
        };
      } else {
        // For employee invoices, mark as paid
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
      'Approval Progress': `${getApprovalProgress(invoice)}%`
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'All Invoices');
    
    const fileName = `all_invoices_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
    
    message.success('Invoice data exported successfully');
  };

  const getStatusTag = (status) => {
    const statusMap = {
      'pending_finance_assignment': { color: 'orange', text: 'Pending Assignment', icon: <ClockCircleOutlined /> },
      'pending_department_head_approval': { color: 'blue', text: 'Department Head Review', icon: <TeamOutlined /> },
      'pending_head_of_business_approval': { color: 'geekblue', text: 'Head of Business Review', icon: <CrownOutlined /> },
      'pending_finance_processing': { color: 'purple', text: 'Pending Finance Processing', icon: <DollarOutlined /> },
      'approved': { color: 'green', text: 'Approved', icon: <CheckCircleOutlined /> },
      'rejected': { color: 'red', text: 'Rejected', icon: <CloseCircleOutlined /> },
      'processed': { color: 'cyan', text: 'Processed', icon: <CheckCircleOutlined /> },
      'paid': { color: 'lime', text: 'Paid', icon: <DollarOutlined /> }
    };

    const config = statusMap[status] || { color: 'default', text: status, icon: null };
    return <Tag color={config.color} icon={config.icon}>{config.text}</Tag>;
  };

  const getApprovalProgress = (invoice) => {
    if (!invoice.approvalChain || invoice.approvalChain.length === 0) return 0;
    const approved = invoice.approvalChain.filter(step => step.status === 'approved').length;
    return Math.round((approved / invoice.approvalChain.length) * 100);
  };

  const getTabCount = (status) => {
    return combinedInvoices.filter(inv => {
      switch (status) {
        case 'unassigned':
          return inv.approvalStatus === 'pending_finance_assignment';
        case 'pending':
          return inv.approvalStatus === 'pending_department_head_approval' || 
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
        
        {/* Summary Statistics */}
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

        {/* Invoice Type Distribution */}
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

        {/* Top Suppliers */}
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
          </Card>
        )}

        {/* Department Performance */}
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

        {/* Service Categories */}
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

        {/* Recent Activity */}
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
              {record.invoiceType === 'supplier' && (
                <br />
              )}
              {record.invoiceType === 'supplier' && record.dueDate && (
                <Text type="secondary" style={{ fontSize: '11px' }}>
                  Due: {new Date(record.dueDate).toLocaleDateString('en-GB')}
                </Text>
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
      render: (status) => getStatusTag(status),
      filters: [
        { text: 'Pending Assignment', value: 'pending_finance_assignment' },
        { text: 'Department Head Review', value: 'pending_department_head_approval' },
        { text: 'Head of Business Review', value: 'pending_head_of_business_approval' },
        { text: 'Pending Finance Processing', value: 'pending_finance_processing' },
        { text: 'Approved', value: 'approved' },
        { text: 'Rejected', value: 'rejected' },
        { text: 'Processed', value: 'processed' },
        { text: 'Paid', value: 'paid' }
      ],
      width: 140
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
        if (record.approvalStatus === 'pending_finance_processing' || 
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
            <Tooltip title="Assign Department">
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
          
          {record.approvalStatus === 'pending_finance_processing' && (
            <Popconfirm
              title="Mark as processed?"
              description="This will mark the invoice as processed and ready for payment."
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
                <Option value="pending_department_approval">Department Review</Option>
                <Option value="approved">Approved</Option>
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
                return invoice.approvalStatus === 'pending_department_head_approval' || 
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
          scroll={{ x: 1400 }}
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
          description={`Assigning ${selectedInvoices.length} invoice(s) to the appropriate department for approval chain processing.`}
          type="info"
          showIcon
          style={{ marginBottom: '16px' }}
        />

        {/* Show breakdown of selected invoice types */}
        {selectedInvoices.length > 1 && (
          <div style={{ marginBottom: '16px' }}>
            <Text strong>Selected Invoices:</Text>
            <Row gutter={16} style={{ marginTop: '8px' }}>
              <Col span={12}>
                <Statistic
                  title="Employee Invoices"
                  value={selectedInvoices.filter(id => id.startsWith('emp_')).length}
                  prefix={<UserOutlined />}
                  valueStyle={{ fontSize: '16px' }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="Supplier Invoices"
                  value={selectedInvoices.filter(id => id.startsWith('sup_')).length}
                  prefix={<ShopOutlined />}
                  valueStyle={{ fontSize: '16px' }}
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
              <Option value="Business Development">
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
              <Option value="Finance">
                <div>
                  <Text strong>Finance</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    Head: Ms. Ranibell Mambo
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

          {selectedInvoices.length > 1 && (
            <Alert
              message={`You are about to assign ${selectedInvoices.length} invoices`}
              description="This action will create approval chains for all selected invoices and notify the appropriate approvers."
              type="warning"
              showIcon
              style={{ marginBottom: '16px' }}
            />
          )}

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
                {selectedInvoices.length > 1 ? `Assign ${selectedInvoices.length} Invoices` : 'Assign to Department'}
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
                    onClick={() => window.open(selectedInvoice.poFile.url, '_blank')}
                  >
                    Download PO File ({selectedInvoice.poFile.originalName})
                  </Button>
                )}
                {selectedInvoice.invoiceFile && (
                  <Button 
                    icon={<FileOutlined />}
                    onClick={() => window.open(selectedInvoice.invoiceFile.url, '_blank')}
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

            {selectedInvoice.approvalChain && selectedInvoice.approvalChain.length > 0 && (
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

            {selectedInvoice.approvalStatus === 'pending_finance_assignment' && (
              <Alert
                message="Action Required"
                description={`This ${selectedInvoice.invoiceType} invoice is waiting to be assigned to a department for approval processing.`}
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

            {/* Additional supplier-specific information */}
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



