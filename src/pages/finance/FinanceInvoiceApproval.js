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
  Timeline,
  Descriptions,
  Progress,
  Alert,
  message,
  Popconfirm,
  Tooltip,
  Badge,
  Statistic,
  Row,
  Col,
  notification,
  Drawer,
  List,
  Avatar,
  Tabs
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
  ReloadOutlined,
  DashboardOutlined,
  ExportOutlined,
  ShopOutlined,
  BankOutlined,
  DollarOutlined,
  CrownOutlined,
  EyeOutlined,
  HistoryOutlined
} from '@ant-design/icons';
import api from '../../services/api';
import * as XLSX from 'xlsx';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;
const { TextArea } = Input;

const FinanceInvoiceApprovalPage = () => {
  const [combinedInvoices, setCombinedInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [approvalModalVisible, setApprovalModalVisible] = useState(false);
  const [analyticsDrawerVisible, setAnalyticsDrawerVisible] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [activeTab, setActiveTab] = useState('pending_finance_approval');
  const [analytics, setAnalytics] = useState(null);
  const [approvalDecision, setApprovalDecision] = useState('');
  const [approvalComments, setApprovalComments] = useState('');
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });

  const fetchEmployeeInvoices = useCallback(async () => {
    try {
      const response = await api.get(`/invoices/finance`);
      
      if (response.data.success) {
        return (response.data.data || []).map(invoice => ({
          ...invoice,
          invoiceType: 'employee',
          key: `emp_${invoice._id}`
        }));
      }
      return [];
    } catch (error) {
      console.error('Error fetching employee invoices:', error);
      return [];
    }
  }, []);

  const fetchSupplierInvoices = useCallback(async () => {
    try {
      const response = await api.get(`/suppliers/admin/invoices`);
      
      if (response.data.success) {
        return (response.data.data || []).map(invoice => ({
          ...invoice,
          invoiceType: 'supplier',
          key: `sup_${invoice._id}`,
          employeeDetails: {
            name: invoice.supplierDetails?.companyName || 'N/A',
            position: invoice.supplierDetails?.contactName || 'Contact',
            department: invoice.serviceCategory || 'Supplier'
          }
        }));
      }
      return [];
    } catch (error) {
      console.error('Error fetching supplier invoices:', error);
      return [];
    }
  }, []);

  const fetchAllInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const [employeeResults, supplierResults] = await Promise.all([
        fetchEmployeeInvoices(),
        fetchSupplierInvoices()
      ]);
      
      const combined = [...employeeResults, ...supplierResults].sort((a, b) => {
        const dateA = new Date(a.uploadedDate || a.createdAt || 0);
        const dateB = new Date(b.uploadedDate || b.createdAt || 0);
        return dateB - dateA;
      });
      
      setCombinedInvoices(combined);
      setPagination(prev => ({ ...prev, total: combined.length }));
    } catch (error) {
      console.error('Error fetching invoices:', error);
      message.error('Failed to fetch invoices');
    } finally {
      setLoading(false);
    }
  }, [fetchEmployeeInvoices, fetchSupplierInvoices]);

  const fetchAnalytics = useCallback(async () => {
    try {
      const results = await Promise.allSettled([
        api.get('/suppliers/admin/analytics'),
        api.get('/invoices/analytics/dashboard')
      ]);
      
      const combinedAnalytics = {
        topSuppliers: [],
        recentActivity: []
      };
      
      if (results[0].status === 'fulfilled' && results[0].value.data.success) {
        const supplierData = results[0].value.data.data;
        if (supplierData.topSuppliers) {
          combinedAnalytics.topSuppliers = supplierData.topSuppliers;
        }
        if (supplierData.recentActivity) {
          combinedAnalytics.recentActivity = supplierData.recentActivity.map(item => ({...item, type: 'supplier'}));
        }
      }
      
      combinedAnalytics.recentActivity.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
      combinedAnalytics.recentActivity = combinedAnalytics.recentActivity.slice(0, 15);
      
      setAnalytics(combinedAnalytics);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    }
  }, []);

  useEffect(() => {
    fetchAllInvoices();
    fetchAnalytics();
  }, [fetchAllInvoices, fetchAnalytics]);

  const handleFinanceApproval = async () => {
    if (!approvalDecision) {
      message.error('Please select approve or reject');
      return;
    }

    if (approvalDecision === 'rejected' && !approvalComments.trim()) {
      message.error('Please provide a reason for rejection');
      return;
    }

    try {
      setLoading(true);
      
      const response = await api.put(
        `/suppliers/supervisor/invoices/${selectedInvoice._id}/decision`,
        { decision: approvalDecision, comments: approvalComments }
      );
      
      if (response.data.success) {
        notification.success({
          message: `Invoice ${approvalDecision}`,
          description: approvalDecision === 'approved' 
            ? 'Invoice has been approved and is ready for payment processing.'
            : 'Invoice has been rejected and supplier will be notified.',
          duration: 5
        });
        setApprovalModalVisible(false);
        setSelectedInvoice(null);
        setApprovalDecision('');
        setApprovalComments('');
        fetchAllInvoices();
      }
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to process approval');
    } finally {
      setLoading(false);
    }
  };

  const handleProcessPayment = async (invoice) => {
    try {
      setLoading(true);
      
      const isSupplierInvoice = invoice.invoiceType === 'supplier';
      const endpoint = isSupplierInvoice 
        ? `/suppliers/admin/invoices/${invoice._id}/payment`
        : `/invoices/finance/process/${invoice._id}`;
      
      const response = await api.put(endpoint, {
        paymentAmount: invoice.invoiceAmount,
        paymentMethod: 'Bank Transfer',
        comments: 'Payment processed by finance'
      });
      
      if (response.data.success) {
        notification.success({
          message: 'Payment Processed',
          description: `Payment of ${invoice.currency} ${invoice.invoiceAmount.toLocaleString()} has been processed successfully.`,
          duration: 5
        });
        fetchAllInvoices();
      }
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to process payment');
    } finally {
      setLoading(false);
    }
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
      message.error('Failed to fetch invoice details');
    }
  };

  const downloadFile = async (fileData, type = 'file') => {
    if (!fileData || !fileData.publicId) {
      message.error('File not available');
      return;
    }

    try {
      const response = await api.get(`/invoices/files/${type}/${fileData.publicId}`);
      
      if (response.data.success) {
        const { url, filename } = response.data.data;
        const link = document.createElement('a');
        link.href = url;
        link.target = '_blank';
        link.download = filename || `${type}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        message.success('Download started');
      }
    } catch (error) {
      console.error('Download error:', error);
      message.error('Failed to download file');
    }
  };

  const exportToExcel = () => {
    const exportData = combinedInvoices.map(invoice => ({
      'Type': invoice.invoiceType === 'supplier' ? 'Supplier' : 'Employee',
      'PO Number': invoice.poNumber,
      'Invoice Number': invoice.invoiceNumber,
      'Company/Employee': invoice.invoiceType === 'supplier' 
        ? invoice.supplierDetails?.companyName 
        : invoice.employeeDetails?.name || 'N/A',
      'Amount': `${invoice.currency || 'XAF'} ${invoice.invoiceAmount}`,
      'Status': invoice.approvalStatus?.replace(/_/g, ' ').toUpperCase(),
      'Department': invoice.assignedDepartment || 'Not assigned'
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Finance Invoices');
    XLSX.writeFile(wb, `finance_invoices_${new Date().toISOString().split('T')[0]}.xlsx`);
    message.success('Invoice data exported successfully');
  };

  const getStatusTag = (status) => {
    const statusMap = {
      'pending_finance_approval': { color: 'purple', text: 'Awaiting Finance Approval', icon: <BankOutlined /> },
      'approved': { color: 'green', text: 'Fully Approved', icon: <CheckCircleOutlined /> },
      'rejected': { color: 'red', text: 'Rejected', icon: <CloseCircleOutlined /> },
      'paid': { color: 'cyan', text: 'Paid', icon: <DollarOutlined /> }
    };
    const config = statusMap[status] || { color: 'default', text: status?.replace(/_/g, ' ') || 'Unknown', icon: null };
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
        case 'pending_finance_approval':
          return inv.approvalStatus === 'pending_finance_approval' ||
                 (inv.invoiceType === 'supplier' && 
                  inv.currentApprovalLevel === 3 && 
                  inv.approvalChain?.find(step => step.level === 3)?.status === 'pending');
        case 'approved':
          return inv.approvalStatus === 'approved';
        case 'rejected':
          return inv.approvalStatus === 'rejected';
        case 'paid':
          return inv.approvalStatus === 'paid' || inv.paymentStatus === 'paid';
        default:
          return false;
      }
    }).length;
  };

  const columns = [
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
      title: 'Company/Employee',
      key: 'entity',
      render: (_, record) => (
        <div>
          <Text strong>
            {record.invoiceType === 'supplier' 
              ? record.supplierDetails?.companyName 
              : record.employeeDetails?.name || 'N/A'}
          </Text>
          <br />
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.invoiceType === 'supplier'
              ? record.supplierDetails?.contactName
              : record.employeeDetails?.position || 'N/A'}
          </Text>
        </div>
      ),
      width: 220
    },
    {
      title: 'Amount',
      dataIndex: 'invoiceAmount',
      key: 'amount',
      render: (amount, record) => (
        <Text strong>{record.currency || 'XAF'} {amount?.toLocaleString() || 0}</Text>
      ),
      width: 120
    },
    {
      title: 'Status',
      dataIndex: 'approvalStatus',
      key: 'status',
      render: (status, record) => (
        <div>
          {getStatusTag(status)}
          {record.invoiceType === 'supplier' && 
           status === 'pending_finance_approval' && 
           record.currentApprovalLevel === 3 && (
            <>
              <br />
              <Tag size="small" color="purple">Level 3 - Finance</Tag>
            </>
          )}
        </div>
      ),
      width: 180
    },
    {
      title: 'Progress',
      key: 'progress',
      render: (_, record) => {
        const progress = getApprovalProgress(record);
        let status = 'active';
        if (record.approvalStatus === 'rejected') status = 'exception';
        if (record.approvalStatus === 'approved' || record.approvalStatus === 'paid') status = 'success';
        
        return (
          <div style={{ width: 80 }}>
            <Progress percent={progress} size="small" status={status} showInfo={false} />
            <Text style={{ fontSize: '11px' }}>{progress}%</Text>
          </div>
        );
      },
      width: 100
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="View Details">
            <Button size="small" icon={<EyeOutlined />} onClick={() => handleViewDetails(record)} />
          </Tooltip>
          
          {record.invoiceType === 'supplier' && 
           record.approvalStatus === 'pending_finance_approval' &&
           record.currentApprovalLevel === 3 && (
            <Tooltip title="Approve/Reject (Level 3 - Final)">
              <Button 
                size="small" 
                type="primary"
                icon={<CheckCircleOutlined />}
                onClick={() => {
                  setSelectedInvoice(record);
                  setApprovalModalVisible(true);
                }}
              >
                Review
              </Button>
            </Tooltip>
          )}
          
          {record.approvalStatus === 'approved' && (
            <Popconfirm
              title="Process payment for this invoice?"
              description={`Amount: ${record.currency} ${record.invoiceAmount?.toLocaleString()}`}
              onConfirm={() => handleProcessPayment(record)}
              okText="Process"
              cancelText="Cancel"
            >
              <Button size="small" type="primary" ghost icon={<DollarOutlined />}>Pay</Button>
            </Popconfirm>
          )}
        </Space>
      ),
      width: 150,
      fixed: 'right'
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <Title level={2} style={{ margin: 0 }}>
            <AuditOutlined /> Finance Invoice Management
          </Title>
          <Space>
            <Button icon={<DashboardOutlined />} onClick={() => setAnalyticsDrawerVisible(true)}>Analytics</Button>
            <Button icon={<ExportOutlined />} onClick={exportToExcel}>Export</Button>
            <Button icon={<ReloadOutlined />} onClick={() => { fetchAllInvoices(); fetchAnalytics(); }} loading={loading}>Refresh</Button>
          </Space>
        </div>

        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane 
            tab={<Badge count={getTabCount('pending_finance_approval')} size="small" style={{ backgroundColor: '#722ed1' }}>
              <span><ClockCircleOutlined /> Awaiting Approval ({getTabCount('pending_finance_approval')})</span>
            </Badge>} 
            key="pending_finance_approval"
          />
          <TabPane 
            tab={<Badge count={getTabCount('approved')} size="small" style={{ backgroundColor: '#52c41a' }}>
              <span><CheckCircleOutlined /> Approved ({getTabCount('approved')})</span>
            </Badge>} 
            key="approved"
          />
          <TabPane 
            tab={<Badge count={getTabCount('rejected')} size="small" style={{ backgroundColor: '#ff4d4f' }}>
              <span><CloseCircleOutlined /> Rejected ({getTabCount('rejected')})</span>
            </Badge>} 
            key="rejected"
          />
          <TabPane 
            tab={<Badge count={getTabCount('paid')} size="small" style={{ backgroundColor: '#13c2c2' }}>
              <span><DollarOutlined /> Paid ({getTabCount('paid')})</span>
            </Badge>} 
            key="paid"
          />
        </Tabs>

        <Table
          columns={columns}
          dataSource={combinedInvoices.filter(invoice => {
            switch (activeTab) {
              case 'pending_finance_approval':
                if (invoice.invoiceType === 'supplier') {
                  return invoice.approvalStatus === 'pending_finance_approval' &&
                         invoice.currentApprovalLevel === 3 &&
                         invoice.approvalChain?.find(step => step.level === 3)?.status === 'pending';
                }
                return invoice.approvalStatus === 'pending_finance_processing' || invoice.approvalStatus === 'approved';
              case 'approved':
                return invoice.approvalStatus === 'approved';
              case 'rejected':
                return invoice.approvalStatus === 'rejected';
              case 'paid':
                return invoice.approvalStatus === 'paid' || invoice.paymentStatus === 'paid';
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
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} invoices`
          }}
          scroll={{ x: 1500 }}
          size="small"
        />
      </Card>

      {/* Approval Modal */}
      <Modal
        title={<Space><CheckCircleOutlined />Finance Final Approval (Level 3)</Space>}
        open={approvalModalVisible}
        onCancel={() => {
          setApprovalModalVisible(false);
          setSelectedInvoice(null);
          setApprovalDecision('');
          setApprovalComments('');
        }}
        footer={null}
        width={600}
      >
        {selectedInvoice && (
          <div>
            <Alert
              message="Final Approval Level"
              description="As Finance Officer, you are the final approver (Level 3). After your approval, the invoice will be ready for payment processing."
              type="warning"
              showIcon
              style={{ marginBottom: 16 }}
            />
            
            <Descriptions bordered size="small" column={1} style={{ marginBottom: 16 }}>
              <Descriptions.Item label="Supplier">{selectedInvoice.supplierDetails?.companyName}</Descriptions.Item>
              <Descriptions.Item label="Invoice Number">{selectedInvoice.invoiceNumber}</Descriptions.Item>
              <Descriptions.Item label="Amount">
                <Text strong>{selectedInvoice.currency} {selectedInvoice.invoiceAmount?.toLocaleString()}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Department">{selectedInvoice.assignedDepartment}</Descriptions.Item>
            </Descriptions>
            
            <div style={{ marginBottom: 16 }}>
              <Text strong>Your Decision:</Text>
              <Select
                placeholder="Select decision"
                style={{ width: '100%', marginTop: 8 }}
                value={approvalDecision}
                onChange={setApprovalDecision}
              >
                <Option value="approved"><CheckCircleOutlined style={{ color: '#52c41a' }} /> Approve</Option>
                <Option value="rejected"><CloseCircleOutlined style={{ color: '#ff4d4f' }} /> Reject</Option>
              </Select>
            </div>
            
            <div style={{ marginBottom: 16 }}>
              <Text strong>Comments {approvalDecision === 'rejected' && <Text type="danger">*</Text>}:</Text>
              <TextArea
                rows={3}
                placeholder={approvalDecision === 'rejected' ? "Please provide reason for rejection..." : "Add any comments..."}
                maxLength={300}
                showCount
                style={{ marginTop: 8 }}
                value={approvalComments}
                onChange={(e) => setApprovalComments(e.target.value)}
              />
            </div>
            
            <Space style={{ marginTop: 16 }}>
              <Button onClick={() => {
                setApprovalModalVisible(false);
                setSelectedInvoice(null);
                setApprovalDecision('');
                setApprovalComments('');
              }}>Cancel</Button>
              <Button 
                type="primary"
                icon={approvalDecision === 'approved' ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
                onClick={handleFinanceApproval}
                loading={loading}
                disabled={!approvalDecision || (approvalDecision === 'rejected' && !approvalComments)}
              >
                Submit {approvalDecision === 'approved' ? 'Approval' : 'Rejection'}
              </Button>
            </Space>
          </div>
        )}
      </Modal>

      {/* Analytics Drawer */}
      <Drawer
        title="Invoice Analytics Dashboard"
        placement="right"
        width={800}
        open={analyticsDrawerVisible}
        onClose={() => setAnalyticsDrawerVisible(false)}
      >
        {analytics && (
          <div style={{ padding: '20px' }}>
            <Title level={4}><DashboardOutlined /> Combined Invoice Analytics</Title>
            
            <Row gutter={16} style={{ marginBottom: '20px' }}>
              <Col span={8}>
                <Statistic title="Total Invoices" value={combinedInvoices.length} prefix={<FileTextOutlined />} />
              </Col>
              <Col span={8}>
                <Statistic 
                  title="Employee Invoices" 
                  value={combinedInvoices.filter(inv => inv.invoiceType === 'employee').length} 
                  valueStyle={{ color: '#1890ff' }}
                  prefix={<UserOutlined />} 
                />
              </Col>
              <Col span={8}>
                <Statistic 
                  title="Supplier Invoices" 
                  value={combinedInvoices.filter(inv => inv.invoiceType === 'supplier').length} 
                  valueStyle={{ color: '#52c41a' }}
                  prefix={<ShopOutlined />} 
                />
              </Col>
            </Row>

            {analytics.topSuppliers && analytics.topSuppliers.length > 0 && (
              <Card title="Top Suppliers by Value" style={{ marginBottom: '20px' }}>
                <List
                  dataSource={analytics.topSuppliers}
                  renderItem={(item) => (
                    <List.Item>
                      <List.Item.Meta
                        avatar={<Avatar icon={<ShopOutlined />} />}
                        title={item.supplierName}
                        description={`Invoices: ${item.count} | Total: XAF ${item.totalAmount?.toLocaleString() || 0}`}
                      />
                    </List.Item>
                  )}
                />
              </Card>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default FinanceInvoiceApprovalPage;












// import React, { useState, useEffect, useCallback } from 'react';
// import {
//   Card,
//   Table,
//   Button,
//   Modal,
//   Select,
//   Form,
//   Typography,
//   Tag,
//   Space,
//   Input,
//   Timeline,
//   Descriptions,
//   Progress,
//   Alert,
//   Spin,
//   message,
//   Popconfirm,
//   Tooltip,
//   Badge,
//   Statistic,
//   Row,
//   Col,
//   notification,
//   Drawer,
//   List,
//   Avatar,
//   Divider,
//   DatePicker,
//   Tabs
// } from 'antd';
// import {
//   FileTextOutlined,
//   TeamOutlined,
//   CheckCircleOutlined,
//   CloseCircleOutlined,
//   ClockCircleOutlined,
//   UserOutlined,
//   CalendarOutlined,
//   AuditOutlined,
//   FileOutlined,
//   ReloadOutlined,
//   DashboardOutlined,
//   BellOutlined,
//   ExportOutlined,
//   ShopOutlined,
//   BankOutlined,
//   DollarOutlined,
//   CrownOutlined,
//   EyeOutlined,
//   HistoryOutlined,
//   FilterOutlined,
//   DownloadOutlined
// } from '@ant-design/icons';
// import api from '../../services/api';
// import * as XLSX from 'xlsx';

// const { Title, Text, Paragraph } = Typography;
// const { TabPane } = Tabs;
// const { Option } = Select;
// const { RangePicker } = DatePicker;
// const { TextArea } = Input;
// const { Tabs } = Typography;

// const FinanceInvoiceApprovalPage = () => {
//   const [invoices, setInvoices] = useState([]);
//   const [supplierInvoices, setSupplierInvoices] = useState([]);
//   const [combinedInvoices, setCombinedInvoices] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [detailsModalVisible, setDetailsModalVisible] = useState(false);
//   const [approvalModalVisible, setApprovalModalVisible] = useState(false);
//   const [analyticsDrawerVisible, setAnalyticsDrawerVisible] = useState(false);
//   const [selectedInvoice, setSelectedInvoice] = useState(null);
//   const [activeTab, setActiveTab] = useState('pending_finance_approval');
//   const [analytics, setAnalytics] = useState(null);
//   const [approvalDecision, setApprovalDecision] = useState('');
//   const [approvalComments, setApprovalComments] = useState('');
//   const [filters, setFilters] = useState({
//     department: null,
//     status: null,
//     dateRange: null,
//     employee: null,
//     serviceCategory: null
//   });
//   const [pagination, setPagination] = useState({
//     current: 1,
//     pageSize: 10,
//     total: 0
//   });

//   // Fetch employee invoices
//   const fetchEmployeeInvoices = useCallback(async () => {
//     try {
//       const params = new URLSearchParams({
//         page: pagination.current,
//         limit: pagination.pageSize
//       });
      
//       if (filters.status) params.append('status', filters.status);
//       if (filters.department) params.append('department', filters.department);
//       if (filters.dateRange && filters.dateRange.length === 2) {
//         params.append('startDate', filters.dateRange[0].format('YYYY-MM-DD'));
//         params.append('endDate', filters.dateRange[1].format('YYYY-MM-DD'));
//       }
//       if (filters.employee) params.append('employee', filters.employee);
      
//       const response = await api.get(`/invoices/finance?${params}`);
      
//       if (response.data.success) {
//         const employeeInvoices = (response.data.data || []).map(invoice => ({
//           ...invoice,
//           invoiceType: 'employee',
//           key: `emp_${invoice._id}`
//         }));
        
//         setInvoices(employeeInvoices);
//         return employeeInvoices;
//       }
//       return [];
//     } catch (error) {
//       console.error('Error fetching employee invoices:', error);
//       message.error('Failed to fetch employee invoices');
//       setInvoices([]);
//       return [];
//     }
//   }, [filters, pagination.current, pagination.pageSize]);

//   // Download file
//   const downloadFile = async (fileData, type = 'file') => {
//     if (!fileData || !fileData.publicId) {
//       message.error('File not available');
//       return;
//     }

//     try {
//       message.loading('Preparing download...');
      
//       const response = await api.get(`/invoices/files/${type}/${fileData.publicId}`);
      
//       if (response.data.success) {
//         const { url, filename } = response.data.data;
        
//         const link = document.createElement('a');
//         link.href = url;
//         link.target = '_blank';
//         link.download = filename || `${type}.pdf`;
//         document.body.appendChild(link);
//         link.click();
//         document.body.removeChild(link);
        
//         message.success('Download started');
//       }
//     } catch (error) {
//       console.error('Download error:', error);
//       message.error('Failed to download file');
      
//       if (fileData.url) {
//         try {
//           window.open(fileData.url, '_blank');
//         } catch (fallbackError) {
//           message.error('Please contact support for file access');
//         }
//       }
//     }
//   };

//   // Fetch supplier invoices
//   const fetchSupplierInvoices = useCallback(async () => {
//     try {
//       const params = new URLSearchParams({
//         page: pagination.current,
//         limit: pagination.pageSize
//       });
      
//       if (filters.status) params.append('status', filters.status);
//       if (filters.serviceCategory) params.append('serviceCategory', filters.serviceCategory);
//       if (filters.dateRange && filters.dateRange.length === 2) {
//         params.append('startDate', filters.dateRange[0].format('YYYY-MM-DD'));
//         params.append('endDate', filters.dateRange[1].format('YYYY-MM-DD'));
//       }
      
//       const response = await api.get(`/suppliers/admin/invoices?${params}`);
      
//       if (response.data.success) {
//         const supplierInvoices = (response.data.data || []).map(invoice => ({
//           ...invoice,
//           invoiceType: 'supplier',
//           key: `sup_${invoice._id}`,
//           employeeDetails: {
//             name: invoice.supplierDetails?.companyName || 'N/A',
//             position: invoice.supplierDetails?.contactName || 'Contact',
//             department: invoice.serviceCategory || 'Supplier'
//           }
//         }));
//         setSupplierInvoices(supplierInvoices);
//         return supplierInvoices;
//       }
//       return [];
//     } catch (error) {
//       console.error('Error fetching supplier invoices:', error);
//       message.error('Failed to fetch supplier invoices');
//       setSupplierInvoices([]);
//       return [];
//     }
//   }, [filters, pagination.current, pagination.pageSize]);

//   // Fetch both invoice types and combine
//   const fetchAllInvoices = useCallback(async () => {
//     setLoading(true);
//     try {
//       const [employeeResults, supplierResults] = await Promise.all([
//         fetchEmployeeInvoices(),
//         fetchSupplierInvoices()
//       ]);
      
//       const combined = [...employeeResults, ...supplierResults].sort((a, b) => {
//         const dateA = new Date(a.uploadedDate || a.createdAt || 0);
//         const dateB = new Date(b.uploadedDate || b.createdAt || 0);
//         return dateB - dateA;
//       });
      
//       setCombinedInvoices(combined);
      
//       setPagination(prev => ({
//         ...prev,
//         total: combined.length
//       }));
      
//     } catch (error) {
//       console.error('Error fetching invoices:', error);
//       message.error('Failed to fetch invoices');
//       setCombinedInvoices([]);
//     } finally {
//       setLoading(false);
//     }
//   }, [fetchEmployeeInvoices, fetchSupplierInvoices]);

//   // Fetch analytics
//   const fetchAnalytics = useCallback(async () => {
//     try {
//       const promises = [
//         api.get('/suppliers/admin/analytics'),
//         api.get('/invoices/analytics/dashboard')
//       ];
      
//       const results = await Promise.allSettled(promises);
      
//       const combinedAnalytics = {
//         overall: [],
//         byDepartment: [],
//         byCategory: [],
//         topSuppliers: [],
//         recentActivity: []
//       };
      
//       if (results[0].status === 'fulfilled' && results[0].value.data.success) {
//         const supplierData = results[0].value.data.data;
//         if (supplierData.overall) {
//           combinedAnalytics.overall = [...combinedAnalytics.overall, ...supplierData.overall.map(item => ({...item, type: 'supplier'}))];
//         }
//         if (supplierData.byCategory) {
//           combinedAnalytics.byCategory = supplierData.byCategory.map(item => ({...item, type: 'supplier'}));
//         }
//         if (supplierData.topSuppliers) {
//           combinedAnalytics.topSuppliers = supplierData.topSuppliers;
//         }
//         if (supplierData.recentActivity) {
//           combinedAnalytics.recentActivity = [...combinedAnalytics.recentActivity, ...supplierData.recentActivity.map(item => ({...item, type: 'supplier'}))];
//         }
//       }
      
//       if (results[1].status === 'fulfilled' && results[1].value.data.success) {
//         const employeeData = results[1].value.data.data;
//         if (employeeData.overall) {
//           combinedAnalytics.overall = [...combinedAnalytics.overall, ...employeeData.overall.map(item => ({...item, type: 'employee'}))];
//         }
//         if (employeeData.byDepartment) {
//           combinedAnalytics.byDepartment = employeeData.byDepartment.map(item => ({...item, type: 'employee'}));
//         }
//       }
      
//       combinedAnalytics.recentActivity.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
//       combinedAnalytics.recentActivity = combinedAnalytics.recentActivity.slice(0, 15);
      
//       setAnalytics(combinedAnalytics);
//     } catch (error) {
//       console.error('Failed to fetch analytics:', error);
//     }
//   }, []);

//   useEffect(() => {
//     fetchAllInvoices();
//     fetchAnalytics();
//   }, [fetchAllInvoices, fetchAnalytics]);

//   // Handle Finance approval (Level 3 for supplier invoices)
//   const handleFinanceApproval = async () => {
//     if (!approvalDecision) {
//       message.error('Please select approve or reject');
//       return;
//     }

//     if (approvalDecision === 'rejected' && !approvalComments.trim()) {
//       message.error('Please provide a reason for rejection');
//       return;
//     }

//     try {
//       setLoading(true);
      
//       const response = await api.put(
//         `/suppliers/supervisor/invoices/${selectedInvoice._id}/decision`,
//         {
//           decision: approvalDecision,
//           comments: approvalComments
//         }
//       );
      
//       if (response.data.success) {
//         notification.success({
//           message: `Invoice ${approvalDecision}`,
//           description: approvalDecision === 'approved' 
//             ? 'Invoice has been approved and is ready for payment processing.'
//             : 'Invoice has been rejected and supplier will be notified.',
//           duration: 5
//         });
//         setApprovalModalVisible(false);
//         setSelectedInvoice(null);
//         setApprovalDecision('');
//         setApprovalComments('');
//         fetchAllInvoices();
//       }
//     } catch (error) {
//       message.error(error.response?.data?.message || 'Failed to process approval');
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Handle payment processing
//   const handleProcessPayment = async (invoice) => {
//     try {
//       setLoading(true);
      
//       const isSupplierInvoice = invoice.invoiceType === 'supplier';
//       const endpoint = isSupplierInvoice 
//         ? `/suppliers/admin/invoices/${invoice._id}/payment`
//         : `/invoices/finance/process/${invoice._id}`;
      
//       const response = await api.put(endpoint, {
//         paymentAmount: invoice.invoiceAmount,
//         paymentMethod: 'Bank Transfer',
//         comments: 'Payment processed by finance'
//       });
      
//       if (response.data.success) {
//         notification.success({
//           message: 'Payment Processed',
//           description: `Payment of ${invoice.currency} ${invoice.invoiceAmount.toLocaleString()} has been processed successfully.`,
//           duration: 5
//         });
//         fetchAllInvoices();
//       }
//     } catch (error) {
//       message.error(error.response?.data?.message || 'Failed to process payment');
//     } finally {
//       setLoading(false);
//     }
//   };

//   // View invoice details
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
//       message.error('Failed to fetch invoice details');
//     }
//   };

//   // Export to Excel
//   const exportToExcel = () => {
//     const exportData = combinedInvoices.map(invoice => ({
//       'Type': invoice.invoiceType === 'supplier' ? 'Supplier' : 'Employee',
//       'PO Number': invoice.poNumber,
//       'Invoice Number': invoice.invoiceNumber,
//       'Company/Employee': invoice.invoiceType === 'supplier' 
//         ? invoice.supplierDetails?.companyName 
//         : invoice.employeeDetails?.name || 'N/A',
//       'Amount': `${invoice.currency || 'XAF'} ${invoice.invoiceAmount}`,
//       'Status': invoice.approvalStatus?.replace(/_/g, ' ').toUpperCase(),
//       'Department': invoice.assignedDepartment || 'Not assigned',
//       'Current Level': invoice.currentApprovalLevel || 'N/A'
//     }));

//     const ws = XLSX.utils.json_to_sheet(exportData);
//     const wb = XLSX.utils.book_new();
//     XLSX.utils.book_append_sheet(wb, ws, 'Finance Invoices');
    
//     const fileName = `finance_invoices_${new Date().toISOString().split('T')[0]}.xlsx`;
//     XLSX.writeFile(wb, fileName);
    
//     message.success('Invoice data exported successfully');
//   };

//   // Status tags
//   const getStatusTag = (status) => {
//     const statusMap = {
//       'pending_supply_chain_assignment': { color: 'orange', text: 'Pending SC Assignment', icon: <ClockCircleOutlined /> },
//       'pending_department_head_approval': { color: 'blue', text: 'Department Head Review', icon: <TeamOutlined /> },
//       'pending_head_of_business_approval': { color: 'geekblue', text: 'Head of Business Review', icon: <CrownOutlined /> },
//       'pending_finance_approval': { color: 'purple', text: 'Awaiting Finance Approval', icon: <BankOutlined /> },
//       'approved': { color: 'green', text: 'Fully Approved', icon: <CheckCircleOutlined /> },
//       'rejected': { color: 'red', text: 'Rejected', icon: <CloseCircleOutlined /> },
//       'paid': { color: 'cyan', text: 'Paid', icon: <DollarOutlined /> },
//       'pending_finance_assignment': { color: 'orange', text: 'Pending Assignment', icon: <ClockCircleOutlined /> },
//       'pending_department_approval': { color: 'blue', text: 'In Approval Chain', icon: <TeamOutlined /> },
//       'processed': { color: 'cyan', text: 'Processed', icon: <CheckCircleOutlined /> }
//     };

//     const config = statusMap[status] || { color: 'default', text: status?.replace(/_/g, ' ') || 'Unknown', icon: null };
//     return <Tag color={config.color} icon={config.icon}>{config.text}</Tag>;
//   };

//   const getApprovalProgress = (invoice) => {
//     if (!invoice.approvalChain || invoice.approvalChain.length === 0) return 0;
//     const approved = invoice.approvalChain.filter(step => step.status === 'approved').length;
//     return Math.round((approved / invoice.approvalChain.length) * 100);
//   };

//   // Tab counts
//   const getTabCount = (status) => {
//     return combinedInvoices.filter(inv => {
//       switch (status) {
//         case 'pending_finance_approval':
//           return inv.approvalStatus === 'pending_finance_approval' ||
//                  (inv.invoiceType === 'supplier' && 
//                   inv.currentApprovalLevel === 3 && 
//                   inv.approvalChain?.find(step => step.level === 3)?.status === 'pending');
//         case 'approved':
//           return inv.approvalStatus === 'approved';
//         case 'rejected':
//           return inv.approvalStatus === 'rejected';
//         case 'paid':
//           return inv.approvalStatus === 'paid' || inv.paymentStatus === 'paid';
//         default:
//           return false;
//       }
//     }).length;
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
//       )
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
//       title: 'Company/Employee',
//       key: 'entity',
//       render: (_, record) => (
//         <div>
//           <Text strong>
//             {record.invoiceType === 'supplier' 
//               ? record.supplierDetails?.companyName 
//               : record.employeeDetails?.name || 'N/A'
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
//               ? record.serviceCategory
//               : record.employeeDetails?.department || 'N/A'
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
//         <Text strong>{record.currency || 'XAF'} {amount.toLocaleString()}</Text>
//       ),
//       width: 120
//     },
//     {
//       title: 'Status',
//       dataIndex: 'approvalStatus',
//       key: 'status',
//       render: (status, record) => (
//         <div>
//           {getStatusTag(status)}
//           {record.invoiceType === 'supplier' && 
//            status === 'pending_finance_approval' && 
//            record.currentApprovalLevel === 3 && (
//             <>
//               <br />
//               <Tag size="small" color="purple">Level 3 - Finance</Tag>
//             </>
//           )}
//         </div>
//       ),
//       width: 180
//     },
//     {
//       title: 'Progress',
//       key: 'progress',
//       render: (_, record) => {
//         const progress = getApprovalProgress(record);
//         let status = 'active';
//         if (record.approvalStatus === 'rejected') status = 'exception';
//         if (record.approvalStatus === 'approved' || record.approvalStatus === 'paid') status = 'success';
        
//         return (
//           <div style={{ width: 80 }}>
//             <Progress 
//               percent={progress} 
//               size="small" 
//               status={status}
//               showInfo={false}
//             />
//             <Text style={{ fontSize: '11px' }}>{progress}%</Text>
//             {record.invoiceType === 'supplier' && 
//              record.currentApprovalLevel > 0 && 
//              record.approvalChain && (
//               <Text style={{ fontSize: '10px', display: 'block', color: '#1890ff' }}>
//                 L{record.currentApprovalLevel}/{record.approvalChain.length}
//               </Text>
//             )}
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
//             <Tooltip title={record.poFile.originalName}>
//               <Button 
//                 size="small" 
//                 icon={<FileOutlined />} 
//                 type="link"
//                 onClick={() => downloadFile(record.poFile, 'po')}
//               >
//                 PO
//               </Button>
//             </Tooltip>
//           )}
//           {record.invoiceFile && (
//             <Tooltip title={record.invoiceFile.originalName}>
//               <Button 
//                 size="small" 
//                 icon={<FileOutlined />} 
//                 type="link"
//                 onClick={() => downloadFile(record.invoiceFile, 'invoice')}
//               >
//                 Invoice
//               </Button>
//             </Tooltip>
//           )}
//         </Space>
//       ),
//       width: 80
//     },
//     {
//       title: 'Actions',
//       key: 'actions',
//       render: (_, record) => (
//         <Space size="small">
//           <Tooltip title="View Details">
//             <Button 
//               size="small" 
//               icon={<EyeOutlined />}
//               onClick={() => handleViewDetails(record)}
//             />
//           </Tooltip>
          
//           {record.invoiceType === 'supplier' && 
//            record.approvalStatus === 'pending_finance_approval' &&
//            record.currentApprovalLevel === 3 && (
//             <Tooltip title="Approve/Reject (Level 3 - Final)">
//               <Button 
//                 size="small" 
//                 type="primary"
//                 icon={<CheckCircleOutlined />}
//                 onClick={() => {
//                   setSelectedInvoice(record);
//                   setApprovalModalVisible(true);
//                 }}
//               >
//                 Review
//               </Button>
//             </Tooltip>
//           )}
          
//           {record.approvalStatus === 'approved' && (
//             <Popconfirm
//               title="Process payment for this invoice?"
//               description={`Amount: ${record.currency} ${record.invoiceAmount.toLocaleString()}`}
//               onConfirm={() => handleProcessPayment(record)}
//               okText="Process"
//               cancelText="Cancel"
//             >
//               <Button 
//                 size="small" 
//                 type="primary"
//                 ghost
//                 icon={<DollarOutlined />}
//               >
//                 Pay
//               </Button>
//             </Popconfirm>
//           )}
//         </Space>
//       ),
//       width: 150,
//       fixed: 'right'
//     }
//   ];

//   return (
//     <div style={{ padding: '24px' }}>
//       <Card>
//         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
//           <Title level={2} style={{ margin: 0 }}>
//             <AuditOutlined /> Finance Invoice Management - Final Approval & Payment
//           </Title>
//           <Space>
//             <Button 
//               icon={<DashboardOutlined />}
//               onClick={() => setAnalyticsDrawerVisible(true)}
//             >
//               Analytics
//             </Button>
//             <Button 
//               icon={<ExportOutlined />}
//               onClick={exportToExcel}
//             >
//               Export
//             </Button>
//             <Button 
//               icon={<ReloadOutlined />} 
//               onClick={() => {
//                 fetchAllInvoices();
//                 fetchAnalytics();
//               }}
//               loading={loading}
//             >
//               Refresh
//             </Button>
//           </Space>
//         </div>

//         <Alert
//           message="Updated Workflow: Supplier Invoices"
//           description={
//             <div>
//               <Paragraph>
//                 <strong>New Process:</strong> Supplier invoices are now handled by Supply Chain Coordinator first.
//               </Paragraph>
//               <ul style={{ marginBottom: 0 }}>
//                 <li>Supply Chain Coordinator (Lukong Lambert) reviews and assigns supplier invoices</li>
//                 <li>Department Head approves (Level 1)</li>
//                 <li>Head of Business approves (Level 2)</li>
//                 <li><strong>You approve and process payment (Level 3 - Final)</strong></li>
//               </ul>
//               <Paragraph style={{ marginTop: 8, marginBottom: 0 }}>
//                 <Text type="secondary">Employee invoices follow the existing workflow unchanged.</Text>
//               </Paragraph>
//             </div>
//           }
//           type="info"
//           showIcon
//           icon={<CrownOutlined />}
//           style={{ marginBottom: '16px' }}
//           closable
//         />

//         <Tabs activeKey={activeTab} onChange={setActiveTab}>
//           <TabPane 
//             tab={
//               <Badge count={getTabCount('pending_finance_approval')} size="small" style={{ backgroundColor: '#722ed1' }}>
//                 <span><ClockCircleOutlined /> Awaiting My Approval ({getTabCount('pending_finance_approval')})</span>
//               </Badge>
//             } 
//             key="pending_finance_approval"
//           />
//           <TabPane 
//             tab={
//               <Badge count={getTabCount('approved')} size="small" style={{ backgroundColor: '#52c41a' }}>
//                 <span><CheckCircleOutlined /> Approved ({getTabCount('approved')})</span>
//               </Badge>
//             } 
//             key="approved"
//           />
//           <TabPane 
//             tab={
//               <Badge count={getTabCount('rejected')} size="small" style={{ backgroundColor: '#ff4d4f' }}>
//                 <span><CloseCircleOutlined /> Rejected ({getTabCount('rejected')})</span>
//               </Badge>
//             } 
//             key="rejected"
//           />
//           <TabPane 
//             tab={
//               <Badge count={getTabCount('paid')} size="small" style={{ backgroundColor: '#13c2c2' }}>
//                 <span><DollarOutlined /> Paid ({getTabCount('paid')})</span>
//               </Badge>
//             } 
//             key="paid"
//           />
//         </Tabs>

//         <Table
//           columns={columns}
//           dataSource={combinedInvoices.filter(invoice => {
//             switch (activeTab) {
//               case 'pending_finance_approval':
//                 if (invoice.invoiceType === 'supplier') {
//                   return invoice.approvalStatus === 'pending_finance_approval' &&
//                          invoice.currentApprovalLevel === 3 &&
//                          invoice.approvalChain?.find(step => step.level === 3)?.status === 'pending';
//                 } else {
//                   return invoice.approvalStatus === 'pending_finance_processing' ||
//                          invoice.approvalStatus === 'approved';
//                 }
//               case 'approved':
//                 return invoice.approvalStatus === 'approved';
//               case 'rejected':
//                 return invoice.approvalStatus === 'rejected';
//               case 'paid':
//                 return invoice.approvalStatus === 'paid' || invoice.paymentStatus === 'paid';
//               default:
//                 return true;
//             }
//           })}
//           loading={loading}
//           rowKey="key"
//           pagination={{
//             ...pagination,
//             showSizeChanger: true,
//             showQuickJumper: true,
//             showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} invoices`
//           }}
//           scroll={{ x: 1500 }}
//           size="small"
//         />
//       </Card>

//       {/* Finance Approval Modal (Level 3) */}
//       <Modal
//         title={
//           <Space>
//             <CheckCircleOutlined />
//             Finance Final Approval (Level 3)
//           </Space>
//         }
//         open={approvalModalVisible}
//         onCancel={() => {
//           setApprovalModalVisible(false);
//           setSelectedInvoice(null);
//           setApprovalDecision('');
//           setApprovalComments('');
//         }}
//         footer={null}
//         width={600}
//       >
//         {selectedInvoice && (
//           <div>
//             <Alert
//               message="Final Approval Level"
//               description="As Finance Officer, you are the final approver (Level 3). After your approval, the invoice will be ready for payment processing."
//               type="warning"
//               showIcon
//               style={{ marginBottom: 16 }}
//             />
            
//             <Descriptions bordered size="small" column={1} style={{ marginBottom: 16 }}>
//               <Descriptions.Item label="Supplier">
//                 {selectedInvoice.supplierDetails?.companyName}
//               </Descriptions.Item>
//               <Descriptions.Item label="Invoice Number">
//                 {selectedInvoice.invoiceNumber}
//               </Descriptions.Item>
//               <Descriptions.Item label="Amount">
//                 <Text strong>{selectedInvoice.currency} {selectedInvoice.invoiceAmount.toLocaleString()}</Text>
//               </Descriptions.Item>
//               <Descriptions.Item label="Department">
//                 {selectedInvoice.assignedDepartment}
//               </Descriptions.Item>
//             </Descriptions>
            
//             <Card size="small" title="Approval Chain Progress" style={{ marginBottom: 16 }}>
//               <Timeline>
//                 <Timeline.Item color="green" dot={<CheckCircleOutlined />}>
//                   <Text strong>Supply Chain Coordinator</Text> - Assigned
//                   <br />
//                   <Text type="secondary" style={{ fontSize: 11 }}>
//                     Lukong Lambert
//                   </Text>
//                 </Timeline.Item>
//                 {selectedInvoice.approvalChain?.map((step, index) => (
//                   <Timeline.Item 
//                     key={index}
//                     color={
//                       step.status === 'approved' ? 'green' : 
//                       step.level === 3 ? 'blue' : 'gray'
//                     }
//                     dot={
//                       step.status === 'approved' ? <CheckCircleOutlined /> :
//                       step.level === 3 ? <ClockCircleOutlined spin /> :
//                       <ClockCircleOutlined />
//                     }
//                   >
//                     <Text strong>Level {step.level}: {step.approver.name}</Text>
//                     {step.level === 3 && <Tag color="blue" style={{ marginLeft: 8 }}>YOU ARE HERE</Tag>}
//                     <br />
//                     <Text type="secondary" style={{ fontSize: 11 }}>
//                       {step.approver.role} - {step.status.toUpperCase()}
//                     </Text>
//                     {step.status === 'approved' && step.actionDate && (
//                       <>
//                         <br />
//                         <Text type="secondary" style={{ fontSize: 10 }}>
//                           Approved: {new Date(step.actionDate).toLocaleDateString('en-GB')}
//                         </Text>
//                       </>
//                     )}
//                   </Timeline.Item>
//                 ))}
//               </Timeline>
//             </Card>
            
//             <div style={{ marginBottom: 16 }}>
//               <Text strong>Your Decision:</Text>
//               <Select
//                 placeholder="Select decision"
//                 style={{ width: '100%', marginTop: 8 }}
//                 value={approvalDecision}
//                 onChange={setApprovalDecision}
//               >
//                 <Option value="approved">
//                   <CheckCircleOutlined style={{ color: '#52c41a' }} /> Approve
//                 </Option>
//                 <Option value="rejected">
//                   <CloseCircleOutlined style={{ color: '#ff4d4f' }} /> Reject
//                 </Option>
//               </Select>
//             </div>
            
//             <div style={{ marginBottom: 16 }}>
//               <Text strong>Comments {approvalDecision === 'rejected' && <Text type="danger">*</Text>}:</Text>
//               <TextArea
//                 rows={3}
//                 placeholder={approvalDecision === 'rejected' ? "Please provide reason for rejection..." : "Add any comments..."}
//                 maxLength={300}
//                 showCount
//                 style={{ marginTop: 8 }}
//                 value={approvalComments}
//                 onChange={(e) => setApprovalComments(e.target.value)}
//               />
//             </div>
            
//             <Space style={{ marginTop: 16 }}>
//               <Button onClick={() => {
//                 setApprovalModalVisible(false);
//                 setSelectedInvoice(null);
//                 setApprovalDecision('');
//                 setApprovalComments('');
//               }}>
//                 Cancel
//               </Button>
//               <Button 
//                 type="primary"
//                 icon={approvalDecision === 'approved' ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
//                 onClick={handleFinanceApproval}
//                 loading={loading}
//                 disabled={!approvalDecision || (approvalDecision === 'rejected' && !approvalComments)}
//               >
//                 Submit {approvalDecision === 'approved' ? 'Approval' : 'Rejection'}
//               </Button>
//             </Space>
//           </div>
//         )}
//       </Modal>

//       {/* Details Modal */}
//       <Modal
//         title={<Space><FileTextOutlined /> Invoice Details</Space>}
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
//               <Descriptions.Item label="Invoice Type" span={2}>
//                 <Tag color={selectedInvoice.invoiceType === 'supplier' ? 'green' : 'blue'} icon={selectedInvoice.invoiceType === 'supplier' ? <ShopOutlined /> : <UserOutlined />}>
//                   {selectedInvoice.invoiceType === 'supplier' ? 'Supplier Invoice' : 'Employee Invoice'}
//                 </Tag>
//                 {selectedInvoice.invoiceType === 'supplier' && selectedInvoice.approvalChain && (
//                   <Tag color="purple" style={{ marginLeft: 8 }}>
//                     {selectedInvoice.approvalChain.length} Level Approval Chain
//                   </Tag>
//                 )}
//               </Descriptions.Item>
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
//                   <Descriptions.Item label="Supplier Company">
//                     <div>
//                       <Text strong>{selectedInvoice.supplierDetails?.companyName}</Text>
//                       <br />
//                       <Text type="secondary">{selectedInvoice.supplierDetails?.contactName}</Text>
//                     </div>
//                   </Descriptions.Item>
//                   <Descriptions.Item label="Supplier Type">
//                     <Tag color="green">{selectedInvoice.supplierDetails?.supplierType}</Tag>
//                   </Descriptions.Item>
//                   <Descriptions.Item label="Service Category">
//                     <Tag color="purple">{selectedInvoice.serviceCategory}</Tag>
//                   </Descriptions.Item>
//                   <Descriptions.Item label="Invoice Amount">
//                     <Text strong>{selectedInvoice.currency || 'XAF'} {selectedInvoice.invoiceAmount?.toLocaleString()}</Text>
//                   </Descriptions.Item>
//                   {selectedInvoice.currentApprovalLevel > 0 && selectedInvoice.approvalChain && (
//                     <Descriptions.Item label="Current Approval Level" span={2}>
//                       <div>
//                         <Tag color="blue">Level {selectedInvoice.currentApprovalLevel} of {selectedInvoice.approvalChain.length}</Tag>
//                         <br />
//                         <Text type="secondary">
//                           Current Approver: {selectedInvoice.approvalChain.find(step => step.level === selectedInvoice.currentApprovalLevel)?.approver?.name || 'N/A'}
//                         </Text>
//                       </div>
//                     </Descriptions.Item>
//                   )}
//                 </>
//               ) : (
//                 <>
//                   <Descriptions.Item label="Employee">
//                     <div>
//                       <Text strong>{selectedInvoice.employeeDetails?.name || selectedInvoice.employee?.fullName}</Text>
//                       <br />
//                       <Text type="secondary">{selectedInvoice.employeeDetails?.position}</Text>
//                     </div>
//                   </Descriptions.Item>
//                   <Descriptions.Item label="Department">
//                     <Tag color="geekblue">{selectedInvoice.employeeDetails?.department}</Tag>
//                   </Descriptions.Item>
//                 </>
//               )}
              
//               <Descriptions.Item label="Upload Date/Time">
//                 <div>
//                   <CalendarOutlined /> {selectedInvoice.uploadedDate 
//                     ? new Date(selectedInvoice.uploadedDate).toLocaleDateString('en-GB')
//                     : 'N/A'
//                   }
//                   <br />
//                   <Text type="secondary">
//                     {selectedInvoice.uploadedTime || 'N/A'}
//                   </Text>
//                 </div>
//               </Descriptions.Item>
//               <Descriptions.Item label="Assigned Department">
//                 {selectedInvoice.assignedDepartment ? (
//                   <Tag color="green">{selectedInvoice.assignedDepartment}</Tag>
//                 ) : (
//                   <Text type="secondary">Not assigned</Text>
//                 )}
//               </Descriptions.Item>
//             </Descriptions>

//             {/* File Downloads */}
//             <Card size="small" title="Attached Files" style={{ marginBottom: '20px' }}>
//               <Space>
//                 {selectedInvoice.poFile && (
//                   <Button 
//                     icon={<FileOutlined />}
//                     onClick={() => downloadFile(selectedInvoice.poFile, 'po')}
//                   >
//                     Download PO File
//                   </Button>
//                 )}
//                 {selectedInvoice.invoiceFile && (
//                   <Button 
//                     icon={<FileOutlined />}
//                     onClick={() => downloadFile(selectedInvoice.invoiceFile, 'invoice')}
//                   >
//                     Download Invoice File
//                   </Button>
//                 )}
//                 {!selectedInvoice.poFile && !selectedInvoice.invoiceFile && (
//                   <Text type="secondary">No files attached</Text>
//                 )}
//               </Space>
//             </Card>

//             {selectedInvoice.invoiceType === 'supplier' && selectedInvoice.description && (
//               <Card size="small" title="Invoice Description" style={{ marginBottom: '20px' }}>
//                 <Paragraph>{selectedInvoice.description}</Paragraph>
//               </Card>
//             )}

//             {/* Supplier Invoice Approval Chain */}
//             {selectedInvoice.invoiceType === 'supplier' && selectedInvoice.approvalChain && selectedInvoice.approvalChain.length > 0 && (
//               <>
//                 <Title level={4}>
//                   <HistoryOutlined /> Approval Chain Progress
//                 </Title>
//                 <Progress 
//                   percent={getApprovalProgress(selectedInvoice)} 
//                   status={selectedInvoice.approvalStatus === 'rejected' ? 'exception' : 
//                           selectedInvoice.approvalStatus === 'approved' || selectedInvoice.approvalStatus === 'paid' ? 'success' : 'active'}
//                   style={{ marginBottom: '20px' }}
//                 />
                
//                 <Timeline>
//                   <Timeline.Item color="green" dot={<CheckCircleOutlined />}>
//                     <Text strong>Supply Chain Coordinator - Assigned</Text>
//                     <br />
//                     <Text type="secondary">Lukong Lambert</Text>
//                     {selectedInvoice.supplyChainReview?.reviewDate && (
//                       <>
//                         <br />
//                         <Text type="secondary" style={{ fontSize: 11 }}>
//                           {new Date(selectedInvoice.supplyChainReview.reviewDate).toLocaleDateString('en-GB')}
//                         </Text>
//                       </>
//                     )}
//                   </Timeline.Item>
                  
//                   {selectedInvoice.approvalChain.map((step, index) => {
//                     let color = 'gray';
//                     let icon = <ClockCircleOutlined />;
                    
//                     if (step.status === 'approved') {
//                       color = 'green';
//                       icon = <CheckCircleOutlined />;
//                     } else if (step.status === 'rejected') {
//                       color = 'red';
//                       icon = <CloseCircleOutlined />;
//                     } else if (step.level === selectedInvoice.currentApprovalLevel) {
//                       color = 'blue';
//                       icon = <ClockCircleOutlined spin />;
//                     }

//                     return (
//                       <Timeline.Item key={index} color={color} dot={icon}>
//                         <div>
//                           <Text strong>Level {step.level}: {step.approver.name}</Text>
//                           {step.level === selectedInvoice.currentApprovalLevel && step.status === 'pending' && (
//                             <Tag color="blue" style={{ marginLeft: 8 }}>CURRENT LEVEL</Tag>
//                           )}
//                           {step.level === 3 && step.approver.role === 'Finance Officer' && (
//                             <Tag color="purple" style={{ marginLeft: 8 }}>FINANCE</Tag>
//                           )}
//                           <br />
//                           <Text type="secondary">{step.approver.role} - {step.approver.email}</Text>
//                           <br />
//                           <Tag size="small" color="purple">{step.approver.department}</Tag>
//                           <br />
                          
//                           {step.status === 'pending' && step.level === selectedInvoice.currentApprovalLevel && (
//                             <div style={{ marginTop: 8 }}>
//                               <Tag color="orange" icon={<ClockCircleOutlined />}>⏳ Awaiting Action</Tag>
//                             </div>
//                           )}
                          
//                           {step.status === 'approved' && (
//                             <div style={{ marginTop: 8 }}>
//                               <Tag color="green" icon={<CheckCircleOutlined />}>✅ Approved</Tag>
//                               <br />
//                               <Text type="secondary">
//                                 {new Date(step.actionDate).toLocaleDateString('en-GB')} at {step.actionTime}
//                               </Text>
//                               {step.comments && (
//                                 <div style={{ marginTop: 4, padding: '8px', backgroundColor: '#f6ffed', borderRadius: '4px', borderLeft: '3px solid #52c41a' }}>
//                                   <Text italic style={{ fontSize: '12px' }}>"{step.comments}"</Text>
//                                 </div>
//                               )}
//                             </div>
//                           )}
                          
//                           {step.status === 'rejected' && (
//                             <div style={{ marginTop: 8 }}>
//                               <Tag color="red" icon={<CloseCircleOutlined />}>❌ Rejected</Tag>
//                               <br />
//                               <Text type="secondary">
//                                 {new Date(step.actionDate).toLocaleDateString('en-GB')} at {step.actionTime}
//                               </Text>
//                               {step.comments && (
//                                 <div style={{ marginTop: 4, padding: '8px', backgroundColor: '#fff2f0', borderRadius: '4px', borderLeft: '3px solid #ff4d4f' }}>
//                                   <Text strong style={{ color: '#ff4d4f', fontSize: '12px' }}>Rejection Reason:</Text>
//                                   <br />
//                                   <Text style={{ fontSize: '12px' }}>"{step.comments}"</Text>
//                                 </div>
//                               )}
//                             </div>
//                           )}
//                         </div>
//                       </Timeline.Item>
//                     );
//                   })}
//                 </Timeline>
//               </>
//             )}

//             {selectedInvoice.approvalStatus === 'pending_finance_approval' && 
//              selectedInvoice.currentApprovalLevel === 3 && (
//               <Alert
//                 message="Action Required"
//                 description="This supplier invoice is waiting for your final approval (Level 3). After your approval, it will be ready for payment processing."
//                 type="warning"
//                 showIcon
//                 action={
//                   <Button 
//                     size="small" 
//                     type="primary"
//                     onClick={() => {
//                       setDetailsModalVisible(false);
//                       setApprovalModalVisible(true);
//                     }}
//                   >
//                     Review Now
//                   </Button>
//                 }
//                 style={{ marginTop: '20px' }}
//               />
//             )}

//             {selectedInvoice.approvalStatus === 'approved' && (
//               <Alert
//                 message="Fully Approved"
//                 description="This invoice has completed all approval levels and is ready for payment processing."
//                 type="success"
//                 showIcon
//                 action={
//                   <Button 
//                     size="small" 
//                     type="primary"
//                     icon={<DollarOutlined />}
//                     onClick={() => {
//                       setDetailsModalVisible(false);
//                       handleProcessPayment(selectedInvoice);
//                     }}
//                   >
//                     Process Payment
//                   </Button>
//                 }
//                 style={{ marginTop: '20px' }}
//               />
//             )}

//             {selectedInvoice.paymentDetails && (
//               <Card size="small" title="Payment Details" style={{ marginTop: '20px' }}>
//                 <Descriptions column={2} size="small">
//                   <Descriptions.Item label="Amount Paid">
//                     <Text strong>{selectedInvoice.currency} {selectedInvoice.paymentDetails.amountPaid?.toLocaleString()}</Text>
//                   </Descriptions.Item>
//                   <Descriptions.Item label="Payment Date">
//                     {new Date(selectedInvoice.paymentDetails.paymentDate).toLocaleDateString('en-GB')}
//                   </Descriptions.Item>
//                   <Descriptions.Item label="Payment Method">
//                     {selectedInvoice.paymentDetails.paymentMethod}
//                   </Descriptions.Item>
//                   {selectedInvoice.paymentDetails.transactionReference && (
//                     <Descriptions.Item label="Transaction Ref">
//                       <Text code>{selectedInvoice.paymentDetails.transactionReference}</Text>
//                     </Descriptions.Item>
//                   )}
//                 </Descriptions>
//               </Card>
//             )}
//           </div>
//         )}
//       </Modal>

//       {/* Analytics Drawer */}
//       <Drawer
//         title="Invoice Analytics Dashboard"
//         placement="right"
//         width={800}
//         open={analyticsDrawerVisible}
//         onClose={() => setAnalyticsDrawerVisible(false)}
//       >
//         {analytics && (
//           <div style={{ padding: '20px' }}>
//             <Title level={4}>
//               <DashboardOutlined /> Combined Invoice Analytics
//             </Title>
            
//             <Row gutter={16} style={{ marginBottom: '20px' }}>
//               <Col span={8}>
//                 <Statistic
//                   title="Total Invoices"
//                   value={combinedInvoices.length}
//                   prefix={<FileTextOutlined />}
//                 />
//               </Col>
//               <Col span={8}>
//                 <Statistic
//                   title="Employee Invoices"
//                   value={combinedInvoices.filter(inv => inv.invoiceType === 'employee').length}
//                   valueStyle={{ color: '#1890ff' }}
//                   prefix={<UserOutlined />}
//                 />
//               </Col>
//               <Col span={8}>
//                 <Statistic
//                   title="Supplier Invoices"
//                   value={combinedInvoices.filter(inv => inv.invoiceType === 'supplier').length}
//                   valueStyle={{ color: '#52c41a' }}
//                   prefix={<ShopOutlined />}
//                 />
//               </Col>
//             </Row>

//             {analytics.topSuppliers && analytics.topSuppliers.length > 0 && (
//               <Card title="Top Suppliers by Value" style={{ marginBottom: '20px' }}>
//                 <Table
//                   dataSource={analytics.topSuppliers}
//                   pagination={false}
//                   size="small"
//                   columns={[
//                     {
//                       title: 'Supplier',
//                       dataIndex: 'supplierName',
//                       key: 'supplier',
//                       render: (name, record) => (
//                         <div>
//                           <Text strong>{name}</Text>
//                           <br />
//                           <Tag size="small">{record.supplierType}</Tag>
//                         </div>
//                       )
//                     },
//                     {
//                       title: 'Invoice Count',
//                       dataIndex: 'count',
//                       key: 'count'
//                     },
//                     {
//                       title: 'Total Value',
//                       dataIndex: 'totalAmount',
//                       key: 'total',
//                       render: (amount) => `XAF ${amount?.toLocaleString() || 0}`
//                     }
//                   ]}
//                 />
//               </Card>
//             )}

//             {analytics.recentActivity && analytics.recentActivity.length > 0 && (
//               <Card title="Recent Activity" style={{ marginBottom: '20px' }}>
//                 <List
//                   dataSource={analytics.recentActivity}
//                   renderItem={(item) => (
//                     <List.Item>
//                       <List.Item.Meta
//                         avatar={<Avatar icon={item.type === 'supplier' ? <ShopOutlined /> : <UserOutlined />} />}
//                         title={`${item.poNumber} - ${item.invoiceNumber}`}
//                         description={
//                           <div>
//                             <Text>
//                               {item.type === 'supplier' 
//                                 ? `Supplier: ${item.supplierDetails?.companyName}` 
//                                 : `Employee: ${item.employeeDetails?.name}`
//                               }
//                             </Text>
//                             <br />
//                             <Text type="secondary">
//                               {getStatusTag(item.approvalStatus)}
//                               {' '}Updated: {new Date(item.updatedAt).toLocaleDateString('en-GB')}
//                               {' '}<Tag color={item.type === 'supplier' ? 'green' : 'blue'}>{item.type}</Tag>
//                             </Text>
//                           </div>
//                         }
//                       />
//                     </List.Item>
//                   )}
//                 />
//               </Card>
//             )}
//           </div>
//         )}
//       </Drawer>
//     </div>
//   );
// };

// export default FinanceInvoiceApprovalPage;




