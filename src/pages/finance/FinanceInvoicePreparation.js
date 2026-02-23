import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Table,
  Button,
  Space,
  Typography,
  Tag,
  Row,
  Col,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  InputNumber,
  message,
  Alert,
  Divider,
  Tooltip,
  Badge,
  Drawer,
  Spin,
  Tabs,
  Progress,
  Upload,
  List,
  Steps,
  Statistic,
  Empty,
  Descriptions,
  Checkbox
} from 'antd';
import {
  FileTextOutlined,
  DollarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  PlusOutlined,
  EditOutlined,
  EyeOutlined,
  DeleteOutlined,
  DownloadOutlined,
  PrinterOutlined,
  MailOutlined,
  SearchOutlined,
  FilterOutlined,
  ReloadOutlined,
  SendOutlined,
  FilePdfOutlined,
  WarningOutlined,
  InboxOutlined,
  CheckOutlined
    , MinusCircleOutlined
} from '@ant-design/icons';
import moment from 'moment';
import api from '../../services/api';
import customerApiService from '../../services/customerAPI';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const { TabPane } = Tabs;
const { Dragger } = Upload;

const FinanceInvoicePreparation = () => {
  // ==================== STATE MANAGEMENT ====================
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [searchForm] = Form.useForm();
  
  // Data states
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [items, setItems] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [customerPOs, setCustomerPOs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  
  // Modal/Drawer states
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [selectedPO, setSelectedPO] = useState(null);
  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  
  // Filter/Tab states
  const [activeTab, setActiveTab] = useState('po-list');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Upload states
  const [invoiceFile, setInvoiceFile] = useState(null);
  const [fileUploading, setFileUploading] = useState(false);
  
  // Calculation states
  const [calculatedSubtotal, setCalculatedSubtotal] = useState(0);
  const [calculatedTax, setCalculatedTax] = useState(0);
  
  // Payment term selection state
  const [selectedPaymentTerms, setSelectedPaymentTerms] = useState([]);
  
  // Stats
  const [stats, setStats] = useState({
    totalPOs: 0,
    invoiced: 0,
    pending: 0,
    draft: 0,
    totalInvoiceValue: 0
  });

  useEffect(() => {
    fetchAllData();
    fetchCustomersAndPOs();
  }, []);

  const fetchCustomersAndPOs = async () => {
    try {
      setLoading(true);
      // Fetch all customers
      const customersResponse = await customerApiService.getAllCustomers({ status: 'approved' });
      
      if (customersResponse.success) {
        const customersData = customersResponse.data || [];
        setCustomers(customersData);
        
        // Fetch POs for all customers
        const allPOs = [];
        for (const customer of customersData) {
          const posResponse = await customerApiService.getCustomerPurchaseOrders(customer._id);
          if (posResponse.success && posResponse.data) {
            const customerPOsWithInfo = posResponse.data.map(po => ({
              ...po,
              customerName: customer.companyName,
              customerId: customer._id,
              customerEmail: customer.primaryEmail
            }));
            allPOs.push(...customerPOsWithInfo);
          }
        }
        setCustomerPOs(allPOs);
      }
    } catch (error) {
      console.error('Error fetching customers and POs:', error);
      message.error('Failed to fetch customer purchase orders');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllData = async () => {
    try {
      setLoading(true);
      
      // Fetch Purchase Orders for Finance
      const [posRes, invoicesRes, suppliersRes, itemsRes] = await Promise.all([
        api.get('/purchase-orders/finance/for-invoicing')
          .catch(() => ({ data: { success: false, data: [] } })),
        api.get('/invoices/finance/prepared')
          .catch(() => ({ data: { success: false, data: [] } })),
        api.get('/suppliers')
          .catch(() => ({ data: { success: false, data: [] } })),
        api.get('/items')
          .catch(() => ({ data: { success: false, data: [] } }))
      ]);

      const pos = posRes.data.success ? posRes.data.data : [];
      const invs = invoicesRes.data.success ? invoicesRes.data.data : [];
      const sups = suppliersRes.data.success ? suppliersRes.data.data : [];
      const itemsArr = itemsRes.data.success ? itemsRes.data.data : [];

      setPurchaseOrders(pos);
      setInvoices(invs);
      setSuppliers(sups);
      setItems(itemsArr);

      // Calculate stats
      const invoicedPos = pos.filter(p => p.hasInvoice).length;
      const pendingPos = pos.filter(p => !p.hasInvoice && p.status === 'approved').length;
      const draftInvoices = invs.filter(i => i.status === 'draft').length;
      const totalValue = invs.reduce((sum, i) => sum + (i.totalAmount || 0), 0);

      setStats({
        totalPOs: pos.length,
        invoiced: invoicedPos,
        pending: pendingPos,
        draft: draftInvoices,
        totalInvoiceValue: totalValue
      });

    } catch (error) {
      console.error('Error fetching data:', error);
      message.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // Invoices are isolated from POs; manual creation uses the New Invoice button.

  const openCreateManualInvoice = () => {
    setSelectedPO(null);
    form.resetFields();
    form.setFieldsValue({
      invoiceDate: moment(),
      dueDate: moment().add(30, 'days'),
      items: [{ description: '', quantity: 1, unitPrice: 0, taxRate: 19.25 }],
      manualPaymentTerms: []
    });
    setCreateModalVisible(true);
  };

  const handleInvoiceItemSelect = (value, index) => {
    const item = items.find(i => i._id === value);
    if (!item) return;
    const formItems = form.getFieldValue('items') || [];
    formItems[index] = {
      ...formItems[index],
      description: item.description || item.name || item.title,
      unitPrice: item.standardPrice || item.unitPrice || item.price || 0,
      quantity: formItems[index]?.quantity || 1,
      itemId: item._id,
      unitOfMeasure: item.unitOfMeasure || '',
      supplier: item.supplierId || item.supplier || undefined
    };
    form.setFieldsValue({ items: formItems });
  };

  const generateInvoiceNumber = (customerName) => {
    // Use the current invoice count to generate a sequential invoice number
    const count = (invoices && Array.isArray(invoices)) ? invoices.length : 0;
    const seq = String(count + 1).padStart(3, '0');
    const year = moment().format('YYYY');
    
    // Extract abbreviation from customer name (e.g., "IHS CAMEROON" -> "IHS")
    let customerAbbrev = 'CUST';
    if (customerName) {
      const words = customerName.split(' ');
      customerAbbrev = words[0].substring(0, 3).toUpperCase();
    }
    
    return `GRAE-INV-${customerAbbrev}-${year}-${seq}`;
  };

  const handleSubmitInvoice = async (values) => {
    try {
      setSubmitLoading(true);

      // Get current user info
      const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
      
      // Get customer name for invoice number generation
      const selectedCustomer = customers.find(c => c._id === values.supplier);
      const customerName = selectedCustomer?.companyName || selectedPO?.customerName || '';
      
      // Generate invoice number
      const invoiceNumber = generateInvoiceNumber(customerName);
      
      // Prepare invoice data object
      const invoiceData = {
        customerId: values.supplier,
        employee: userInfo._id || userInfo.id,
        invoiceNumber: invoiceNumber,
        poNumber: selectedPO?.poNumber || undefined,
        invoiceDate: values.invoiceDate.toISOString(),
        dueDate: values.dueDate.toISOString(),
        totalAmount: values.totalAmount || 0,
        taxAmount: values.taxAmount || 0,
        description: values.description || '',
        paymentTerms: values.paymentTerms,
        status: 'draft',
        items: values.items || []
      };

      // Only add PO reference if creating from a customer PO
      if (selectedPO && selectedPO._id) {
        invoiceData.customerPOId = selectedPO._id;
        invoiceData.poReference = selectedPO.poNumber;
        // Add selected payment terms info from PO
        if (selectedPaymentTerms.length > 0) {
          invoiceData.paymentTermsInvoiced = selectedPaymentTerms.map(idx => ({
            termIndex: idx,
            description: selectedPO.paymentTerms[idx]?.description,
            percentage: selectedPO.paymentTerms[idx]?.percentage
          }));
        }
      }

      // Add manual payment terms if defined
      if (values.manualPaymentTerms && values.manualPaymentTerms.length > 0) {
        invoiceData.paymentTermsBreakdown = values.manualPaymentTerms.map(term => ({
          description: term.description,
          percentage: term.percentage,
          amount: (invoiceData.totalAmount * term.percentage) / 100
        }));
      }

      const response = await api.post('/invoices/finance/prepare', invoiceData);

      if (response.data.success) {
        message.success('Invoice prepared successfully');
        setCreateModalVisible(false);
        setUploadModalVisible(false);
        setInvoiceFile(null);
        form.resetFields();
        setSelectedPO(null);
        await fetchAllData();
        await fetchCustomersAndPOs();
      }
    } catch (error) {
      console.error('Error creating invoice:', error);
      message.error(error.response?.data?.message || 'Failed to prepare invoice');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleUploadFile = async (file) => {
    setInvoiceFile(file);
    return false; // Prevent auto upload
  };

  const handleDeleteInvoice = async (invoiceId) => {
    Modal.confirm({
      title: 'Delete Invoice',
      content: 'Are you sure you want to delete this draft invoice?',
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          const response = await api.delete(`/invoices/${invoiceId}/finance`);
          if (response.data.success) {
            message.success('Invoice deleted');
            await fetchAllData();
          }
        } catch (error) {
          message.error('Failed to delete invoice');
        }
      }
    });
  };

  const handlePrepareInvoiceFromCustomerPO = (customerPO) => {
    // Pre-fill form with customer PO data
    form.setFieldsValue({
      supplier: customerPO.customerId,
      customerName: customerPO.customerName,
      customerId: customerPO.customerId,
      poNumber: customerPO.poNumber,
      totalAmount: customerPO.amount,
      invoiceDate: moment(),
      dueDate: customerPO.dueDate ? moment(customerPO.dueDate) : moment().add(30, 'days'),
      paymentTerms: typeof customerPO.paymentTerms === 'string' ? customerPO.paymentTerms : '',
      description: `Invoice for ${customerPO.poNumber} - ${customerPO.customerName}`,
      items: [{ description: '', quantity: 1, unitPrice: 0, taxRate: 19.25 }],
      manualPaymentTerms: []
    });
    setSelectedPO(customerPO);
    setSelectedPaymentTerms([]);
    setCreateModalVisible(true);
  };

  const handleSubmitForApproval = async (invoiceId) => {
    Modal.confirm({
      title: 'Submit Invoice for Approval',
      content: 'This invoice will be submitted for approval. Ensure all details are correct.',
      okText: 'Submit',
      onOk: async () => {
        try {
          const response = await api.put(`/invoices/${invoiceId}/finance/submit`, {});
          if (response.data.success) {
            message.success('Invoice submitted for approval');
            await fetchAllData();
          }
        } catch (error) {
          message.error('Failed to submit invoice');
        }
      }
    });
  };

  const handleDownloadInvoicePdf = async (invoiceId, invoiceNumber) => {
    try {
      const response = await api.get(`/invoices/finance/prepared/${invoiceId}/pdf`, {
        responseType: 'blob'
      });

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Invoice_${invoiceNumber || invoiceId}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      message.error('Failed to download invoice PDF');
    }
  };

  // ==================== TABLE COLUMNS ====================
  
  const poColumns = [
    {
      title: 'PO Number',
      dataIndex: 'poNumber',
      key: 'poNumber',
      render: (text) => <Tag color="blue">{text}</Tag>,
      width: 150
    },
    {
      title: 'Supplier',
      dataIndex: ['supplier', 'name'],
      key: 'supplier',
      width: 180
    },
    {
      title: 'Amount',
      dataIndex: 'totalAmount',
      key: 'amount',
      render: (amount) => <Text strong style={{ color: '#1890ff' }}>XAF {amount?.toLocaleString()}</Text>,
      width: 140
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const statusMap = {
          draft: { color: 'default', text: 'Draft' },
          approved: { color: 'success', text: 'Approved' },
          rejected: { color: 'error', text: 'Rejected' }
        };
        const info = statusMap[status] || { color: 'default', text: status };
        return <Tag color={info.color}>{info.text}</Tag>;
      },
      width: 100
    },
    {
      title: 'Invoiced',
      dataIndex: 'hasInvoice',
      key: 'hasInvoice',
      render: (hasInvoice) => (
        hasInvoice ? <CheckCircleOutlined style={{ color: '#52c41a', fontSize: '16px' }} /> : <ClockCircleOutlined />
      ),
      width: 100
    },
    {
      title: 'PO Date',
      dataIndex: 'poDate',
      key: 'poDate',
      render: (date) => date ? moment(date).format('DD/MM/YYYY') : '-',
      width: 120
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Tooltip title="View Details">
            <Button
              icon={<EyeOutlined />}
              size="small"
              onClick={() => {
                setSelectedPO(record);
                setDetailDrawerVisible(true);
              }}
            />
          </Tooltip>
        </Space>
      ),
      width: 140
    }
  ];

  const customerPOColumns = [
    {
      title: 'Customer',
      dataIndex: 'customerName',
      key: 'customerName',
      render: (text) => <Text strong>{text}</Text>,
      width: 200
    },
    {
      title: 'PO Number',
      dataIndex: 'poNumber',
      key: 'poNumber',
      render: (text) => <Tag color="blue">{text}</Tag>,
      width: 150
    },
    {
      title: 'PO Date',
      dataIndex: 'poDate',
      key: 'poDate',
      render: (date) => moment(date).format('MMM DD, YYYY'),
      width: 120
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount, record) => (
        <Text strong>{record.currency || 'XAF'} {amount?.toLocaleString()}</Text>
      ),
      width: 130
    },
    {
      title: 'Payment Terms',
      dataIndex: 'paymentTerms',
      key: 'paymentTerms',
      render: (terms) => {
        if (Array.isArray(terms)) {
          return (
            <div>
              {terms.map((term, idx) => (
                <div key={idx} style={{ fontSize: '12px' }}>
                  {term.percentage}% - {term.description}
                </div>
              ))}
            </div>
          );
        }
        return terms || 'N/A';
      },
      width: 120
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const statusColors = {
          pending: 'orange',
          approved: 'green',
          rejected: 'red',
          paid: 'blue'
        };
        return <Tag color={statusColors[status] || 'default'}>{status || 'pending'}</Tag>;
      },
      width: 100
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Tooltip title="Prepare Invoice">
            <Button 
              type="primary"
              size="small"
              icon={<FileTextOutlined />}
              onClick={() => handlePrepareInvoiceFromCustomerPO(record)}
            >
              Invoice
            </Button>
          </Tooltip>
        </Space>
      ),
      width: 120
    }
  ];

  const invoiceColumns = [
    {
      title: 'Invoice Number',
      dataIndex: 'invoiceNumber',
      key: 'invoiceNumber',
      render: (text) => <Tag color="cyan">{text}</Tag>,
      width: 150
    },
    {
      title: 'PO Reference',
      dataIndex: 'poNumber',
      key: 'poNumber',
      render: (text) => <Tag color="blue">{text}</Tag>,
      width: 150
    },
    {
      title: 'Supplier',
      dataIndex: ['supplier', 'name'],
      key: 'supplier',
      width: 180
    },
    {
      title: 'Amount',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (amount) => <Text strong style={{ color: '#1890ff' }}>XAF {amount?.toLocaleString()}</Text>,
      width: 140
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const statusMap = {
          draft: { color: 'default', text: '📝 Draft' },
          pending_approval: { color: 'orange', text: '⏳ Pending Approval' },
          approved: { color: 'success', text: '✅ Approved' },
          paid: { color: 'cyan', text: '💳 Paid' }
        };
        const info = statusMap[status] || { color: 'default', text: status };
        return <Tag color={info.color}>{info.text}</Tag>;
      },
      width: 150
    },
    {
      title: 'Invoice Date',
      dataIndex: 'invoiceDate',
      key: 'invoiceDate',
      render: (date) => date ? moment(date).format('DD/MM/YYYY') : '-',
      width: 120
    },
    {
      title: 'Due Date',
      dataIndex: 'dueDate',
      key: 'dueDate',
      render: (date) => {
        if (!date) return '-';
        const isOverdue = moment(date).isBefore(moment());
        return (
          <Text style={{ color: isOverdue ? '#ff4d4f' : '#1890ff' }}>
            {moment(date).format('DD/MM/YYYY')}
          </Text>
        );
      },
      width: 120
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Tooltip title="View Details">
            <Button
              icon={<EyeOutlined />}
              size="small"
              onClick={() => {
                setSelectedInvoice(record);
                setDetailDrawerVisible(true);
              }}
            />
          </Tooltip>
          {record.status === 'draft' && (
            <>
              <Tooltip title="Edit">
                <Button
                  icon={<EditOutlined />}
                  size="small"
                  onClick={() => {
                    setSelectedInvoice(record);
                    // TODO: Open edit modal
                  }}
                />
              </Tooltip>
              <Tooltip title="Submit for Approval">
                <Button
                  icon={<SendOutlined />}
                  type="primary"
                  size="small"
                  onClick={() => handleSubmitForApproval(record._id)}
                />
              </Tooltip>
              <Tooltip title="Delete">
                <Button
                  icon={<DeleteOutlined />}
                  danger
                  size="small"
                  onClick={() => handleDeleteInvoice(record._id)}
                />
              </Tooltip>
            </>
          )}
          <Tooltip title="Download PDF">
            <Button
              icon={<DownloadOutlined />}
              size="small"
              onClick={() => handleDownloadInvoicePdf(record._id, record.invoiceNumber)}
            />
          </Tooltip>
        </Space>
      ),
      width: 200
    }
  ];

  if (loading) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <Spin size="large" />
          <div style={{ marginTop: '16px' }}>Loading invoice data...</div>
        </div>
      </Card>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={2} style={{ margin: 0 }}>
              <FileTextOutlined /> Invoice Preparation
            </Title>
            <Text type="secondary">Prepare invoices from approved purchase orders</Text>
          </Col>
          <Col>
            <Space>
              <Button type="default" icon={<PlusOutlined />} onClick={openCreateManualInvoice}>
                New Invoice
              </Button>
              <Button type="primary" icon={<ReloadOutlined />} onClick={fetchAllData}>
                Refresh
              </Button>
            </Space>
          </Col>
        </Row>
      </div>

      {/* Statistics */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Purchase Orders"
              value={stats.totalPOs}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Pending Invoicing"
              value={stats.pending}
              prefix={<ExclamationCircleOutlined />}
              valueStyle={{ color: '#ff7a45' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Draft Invoices"
              value={stats.draft}
              prefix={<EditOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Invoice Value"
              value={stats.totalInvoiceValue}
              prefix="XAF"
              valueStyle={{ color: '#52c41a', fontSize: '20px' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Tabs */}
      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        {/* <TabPane 
          tab={
            <span>
              <FileTextOutlined /> Purchase Orders ({stats.totalPOs})
            </span>
          } 
          key="po-list"
        >
          <Card>
            {purchaseOrders.length === 0 ? (
              <Empty description="No purchase orders available" />
            ) : (
              <Table
                columns={poColumns}
                dataSource={purchaseOrders}
                rowKey="_id"
                size="middle"
                pagination={{ pageSize: 10 }}
                loading={loading}
              />
            )}
          </Card>
        </TabPane> */}

        <TabPane 
          tab={
            <span>
              <FileTextOutlined /> Customer Purchase Orders ({customerPOs.length})
            </span>
          } 
          key="customer-po-list"
        >
          <Card 
            extra={
              <Button 
                icon={<ReloadOutlined />}
                onClick={fetchCustomersAndPOs}
                loading={loading}
              >
                Refresh
              </Button>
            }
          >
            {customerPOs.length === 0 ? (
              <Empty description="No customer purchase orders available" />
            ) : (
              <Table
                columns={customerPOColumns}
                dataSource={customerPOs}
                rowKey={(record) => record._id || `${record.customerId}-${record.poNumber}`}
                size="middle"
                pagination={{ pageSize: 10 }}
                loading={loading}
              />
            )}
          </Card>
        </TabPane>

        <TabPane 
          tab={
            <span>
              <DollarOutlined /> My Invoices ({invoices.length})
            </span>
          } 
          key="invoice-list"
        >
          <Card>
            {invoices.length === 0 ? (
              <Empty description="No invoices prepared yet" />
            ) : (
              <Table
                columns={invoiceColumns}
                dataSource={invoices}
                rowKey="_id"
                size="middle"
                pagination={{ pageSize: 10 }}
                loading={loading}
              />
            )}
          </Card>
        </TabPane>
      </Tabs>

      {/* Create Invoice Modal */}
      <Modal
        title="Prepare Invoice"
        visible={createModalVisible}
        onCancel={() => {
          setCreateModalVisible(false);
          setUploadModalVisible(false);
          setInvoiceFile(null);
          form.resetFields();
        }}
        width={800}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmitInvoice}
          onValuesChange={(changed, all) => {
            if (changed.items) {
              // Calculate untaxed amount
              const subtotal = (all.items || []).reduce((sum, it) => sum + ((it?.quantity || 0) * (it?.unitPrice || 0)), 0);
              
              // Calculate total tax from all items
              const totalTax = (all.items || []).reduce((sum, it) => {
                const lineAmount = (it?.quantity || 0) * (it?.unitPrice || 0);
                const lineTax = lineAmount * ((it?.taxRate || 0) / 100);
                return sum + lineTax;
              }, 0);
              
              // Update both form and state
              form.setFieldsValue({ 
                totalAmount: subtotal,
                taxAmount: totalTax
              });
              setCalculatedSubtotal(subtotal);
              setCalculatedTax(totalTax);
            }
          }}
        >
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                name="supplier"
                label="Customer"
                rules={[{ required: true, message: 'Please select a customer' }]}
              >
                <Select
                  showSearch
                  placeholder="Select customer"
                  optionFilterProp="children"
                  filterOption={(input, option) => (option.children || '').toLowerCase().includes(input.toLowerCase())}
                  allowClear
                  size="large"
                  disabled={!!selectedPO}
                >
                  {(customers || []).map(c => (
                    <Select.Option key={c._id} value={c._id}>
                      {c.companyName || c.email || c.name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
              {selectedPO && (
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  Customer pre-filled from PO: {selectedPO.customerName}
                </Text>
              )}
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="invoiceDate"
                label="Invoice Date"
                rules={[{ required: true, message: 'Select invoice date' }]}
              >
                <DatePicker style={{ width: '100%' }} format="MM/DD/YYYY" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="paymentTerms"
                label="Payment Terms"
                rules={[{ required: true, message: 'Enter payment terms' }]}
              >
                <Input placeholder="e.g., 30 Days Net, 50% Advance, etc." />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="dueDate"
                label="Due Date"
                rules={[{ required: true, message: 'Select due date' }]}
              >
                <DatePicker style={{ width: '100%' }} format="MM/DD/YYYY" />
              </Form.Item>
            </Col>
          </Row>

          {selectedPO && (
            <Form.Item name="poNumber" label="PO Reference" hidden>
              <Input />
            </Form.Item>
          )}

          {selectedPO && selectedPO.paymentTerms && Array.isArray(selectedPO.paymentTerms) && selectedPO.paymentTerms.length > 0 ? (
            <Card 
              title={<><DollarOutlined /> Payment Term Breakdown (From PO)</>}
              size="small"
              style={{ marginBottom: '24px', background: '#f0f5ff', borderColor: '#1890ff' }}
              bordered
            >
              <Alert
                message="Select which payment term(s) to invoice"
                type="info"
                showIcon
                style={{ marginBottom: '16px' }}
              />
              
              <div>
                  <Table
                    dataSource={selectedPO.paymentTerms.map((term, idx) => ({
                      ...term,
                      key: idx,
                      amount: (selectedPO.amount * (term.percentage || 0)) / 100,
                      status: term.invoiced ? 'invoiced' : 'pending'
                    }))}
                    columns={[
                      {
                        title: 'Description',
                        dataIndex: 'description',
                        key: 'description',
                        render: (text) => <Text>{text}</Text>,
                        width: '40%'
                      },
                      {
                        title: 'Percentage',
                        dataIndex: 'percentage',
                        key: 'percentage',
                        render: (pct) => <Tag color="blue">{pct}%</Tag>,
                        width: '15%'
                      },
                      {
                        title: 'Amount',
                        dataIndex: 'amount',
                        key: 'amount',
                        render: (amt) => <Text strong>{amt.toLocaleString()} FCFA</Text>,
                        width: '20%'
                      },
                      {
                        title: 'Status',
                        dataIndex: 'status',
                        key: 'status',
                        render: (status) => (
                          status === 'invoiced' ? (
                            <Tag icon={<CheckCircleOutlined />} color="success">Invoiced</Tag>
                          ) : (
                            <Tag>Pending</Tag>
                          )
                        ),
                        width: '15%'
                      },
                      {
                        title: 'Action',
                        key: 'action',
                        render: (_, record, idx) => (
                          record.status !== 'invoiced' && (
                            <Checkbox
                              checked={selectedPaymentTerms.includes(idx)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedPaymentTerms([...selectedPaymentTerms, idx]);
                                  const selectedAmount = selectedPaymentTerms.reduce((sum, i) => {
                                    return sum + ((selectedPO.paymentTerms[i]?.percentage || 0) / 100) * selectedPO.amount;
                                  }, (record.percentage / 100) * selectedPO.amount);
                                  form.setFieldsValue({ totalAmount: selectedAmount });
                                  setCalculatedSubtotal(selectedAmount);
                                } else {
                                  const newSelected = selectedPaymentTerms.filter(i => i !== idx);
                                  setSelectedPaymentTerms(newSelected);
                                  const newAmount = newSelected.reduce((sum, i) => {
                                    return sum + ((selectedPO.paymentTerms[i]?.percentage || 0) / 100) * selectedPO.amount;
                                  }, 0);
                                  form.setFieldsValue({ totalAmount: newAmount });
                                  setCalculatedSubtotal(newAmount);
                                }
                              }}
                            />
                          )
                        ),
                        width: '10%'
                      }
                    ]}
                    pagination={false}
                    size="small"
                  />
                  
                  <Divider />
                  
                  <Row justify="space-between" style={{ padding: '16px 0' }}>
                    <Col>
                      <Text strong>Selected Payment Terms Total:</Text>
                    </Col>
                    <Col>
                      <Text strong style={{ fontSize: '16px', color: '#1890ff' }}>
                        {selectedPaymentTerms.reduce((sum, idx) => {
                          return sum + ((selectedPO.paymentTerms[idx]?.percentage || 0) / 100) * selectedPO.amount;
                        }, 0).toLocaleString()} FCFA
                      </Text>
                    </Col>
                  </Row>
                </div>
            </Card>
          ) : (
            <Card 
              title={<><DollarOutlined /> Manual Payment Term Breakdown</>}
              size="small"
              style={{ marginBottom: '24px', background: '#fff7e6', borderColor: '#faad14' }}
              bordered
            >
              <Alert
                message="Define payment term breakdown for this invoice (optional)"
                type="warning"
                showIcon
                style={{ marginBottom: '16px' }}
              />
              
              <div style={{ marginBottom: '16px' }}>
                <Row gutter={8} style={{ marginBottom: '8px', fontWeight: 500, color: '#595959' }}>
                  <Col span={9}>Description</Col>
                  <Col span={5}>Percentage (%)</Col>
                  <Col span={6}>Timeframe</Col>
                  <Col span={3}>Amount (FCFA)</Col>
                  <Col span={1}></Col>
                </Row>
                
                <Form.List name="manualPaymentTerms">
                  {(fields, { add, remove }) => (
                    <>
                      {fields.map((field, index) => {
                        const manualTerms = form.getFieldValue('manualPaymentTerms') || [];
                        const currentTerm = manualTerms[index] || {};
                        const baseAmount = calculatedSubtotal || 0;
                        const termAmount = (baseAmount * (currentTerm.percentage || 0)) / 100;
                        
                        return (
                          <div key={field.key} style={{ marginBottom: 8 }}>
                            <Row gutter={8} align="middle">
                              <Col span={9}>
                                <Form.Item
                                  {...field}
                                  name={[field.name, 'description']}
                                  fieldKey={[field.fieldKey, 'description']}
                                  rules={[{ required: true, message: 'Enter description' }]}
                                  style={{ marginBottom: 0 }}
                                >
                                  <Input placeholder="e.g., Advance payment, Balance, etc." />
                                </Form.Item>
                              </Col>
                              <Col span={5}>
                                <Form.Item
                                  {...field}
                                  name={[field.name, 'percentage']}
                                  fieldKey={[field.fieldKey, 'percentage']}
                                  rules={[{ required: true, message: 'Enter %' }]}
                                  style={{ marginBottom: 0 }}
                                >
                                  <InputNumber 
                                    min={0} 
                                    max={100}
                                    style={{ width: '100%' }} 
                                    placeholder="25"
                                    formatter={value => `${value}%`}
                                    parser={value => value.replace('%', '')}
                                  />
                                </Form.Item>
                              </Col>
                              <Col span={6}>
                                <Form.Item
                                  {...field}
                                  name={[field.name, 'timeframe']}
                                  fieldKey={[field.fieldKey, 'timeframe']}
                                  rules={[{ required: true, message: 'Select timeframe' }]}
                                  style={{ marginBottom: 0 }}
                                >
                                  <Select 
                                    placeholder="Select timeframe"
                                    showSearch
                                    optionFilterProp="children"
                                  >
                                    <Option value="Upon order">Upon order</Option>
                                    <Option value="Immediate">Immediate</Option>
                                    <Option value="Upon delivery">Upon delivery</Option>
                                    <Option value="Upon completion">Upon completion</Option>
                                    <Option value="7 days after invoice">7 days after invoice</Option>
                                    <Option value="15 days after invoice">15 days after invoice</Option>
                                    <Option value="30 days after invoice">30 days after invoice</Option>
                                    <Option value="45 days after invoice">45 days after invoice</Option>
                                    <Option value="60 days after invoice">60 days after invoice</Option>
                                    <Option value="90 days after invoice">90 days after invoice</Option>
                                    <Option value="End of month">End of month</Option>
                                    <Option value="End of next month">End of next month</Option>
                                    <Option value="custom">Custom (Enter manually)</Option>
                                  </Select>
                                </Form.Item>
                              </Col>
                              <Col span={3}>
                                <div style={{ 
                                  width: '100%', 
                                  padding: '4px 11px',
                                  textAlign: 'right',
                                  fontWeight: 500,
                                  color: '#faad14'
                                }}>
                                  {termAmount.toLocaleString()}
                                </div>
                              </Col>
                              <Col span={1}>
                                <Button 
                                  type="text" 
                                  danger 
                                  icon={<DeleteOutlined />} 
                                  onClick={() => remove(field.name)}
                                  size="small"
                                />
                              </Col>
                            </Row>
                            {form.getFieldValue('manualPaymentTerms')?.[field.name]?.timeframe === 'custom' && (
                              <Row gutter={8} style={{ marginTop: 4 }}>
                                <Col span={9} offset={0}>
                                  <Form.Item
                                    {...field}
                                    name={[field.name, 'customTimeframe']}
                                    fieldKey={[field.fieldKey, 'customTimeframe']}
                                    rules={[{ required: true, message: 'Enter custom timeframe' }]}
                                    style={{ marginBottom: 0 }}
                                  >
                                    <Input placeholder="Enter custom timeframe" size="small" />
                                  </Form.Item>
                                </Col>
                              </Row>
                            )}
                          </div>
                        );
                      })}
                      <Form.Item style={{ marginTop: '12px', marginBottom: 0 }}>
                        <Button type="dashed" onClick={() => add()} icon={<PlusOutlined />} block>
                          Add Payment Term
                        </Button>
                      </Form.Item>
                    </>
                  )}
                </Form.List>
              </div>
              
              <Alert
                message="Note: Total percentage should equal 100% for complete payment breakdown"
                type="info"
                showIcon
              />
            </Card>
          )}

          <Divider orientation="left" style={{ marginTop: '24px', marginBottom: '16px' }}>Invoice Lines</Divider>

          <div style={{ marginBottom: '16px' }}>
            <Row gutter={8} style={{ marginBottom: '8px', fontWeight: 500, color: '#595959' }}>
              <Col span={8}>Product</Col>
              <Col span={3}>Quantity</Col>
              <Col span={4}>Unit Price</Col>
              <Col span={3}>Tax %</Col>
              <Col span={5}>Amount</Col>
              <Col span={1}></Col>
            </Row>
            
            <Form.List name="items">
              {(fields, { add, remove }) => (
                <>
                  {(fields || []).map((field, index) => {
                    const items = form.getFieldValue('items') || [];
                    const currentItem = items[index] || {};
                    const lineAmount = (currentItem.quantity || 0) * (currentItem.unitPrice || 0);
                    
                    return (
                    <Row gutter={8} key={field.key} align="middle" style={{ marginBottom: 8 }}>
                      <Col span={8}>
                        <Form.Item
                          {...field}
                          name={[field.name, 'description']}
                          fieldKey={[field.fieldKey, 'description']}
                          rules={[{ required: true, message: 'Enter product/service' }]}
                          style={{ marginBottom: 0 }}
                        >
                          <Input placeholder="Product or Service" />
                        </Form.Item>
                      </Col>
                      <Col span={3}>
                        <Form.Item
                          {...field}
                          name={[field.name, 'quantity']}
                          fieldKey={[field.fieldKey, 'quantity']}
                          rules={[{ required: true, message: 'Qty' }]}
                          style={{ marginBottom: 0 }}
                        >
                          <InputNumber min={0} step={0.01} style={{ width: '100%' }} placeholder="1.00" />
                        </Form.Item>
                      </Col>
                      <Col span={4}>
                        <Form.Item
                          {...field}
                          name={[field.name, 'unitPrice']}
                          fieldKey={[field.fieldKey, 'unitPrice']}
                          rules={[{ required: true, message: 'Price' }]}
                          style={{ marginBottom: 0 }}
                        >
                          <InputNumber 
                            min={0} 
                            style={{ width: '100%' }} 
                            formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} 
                            parser={(v) => v.replace(/\D/g, '')} 
                            placeholder="0"
                          />
                        </Form.Item>
                      </Col>
                      <Col span={3}>
                        <Form.Item
                          {...field}
                          name={[field.name, 'taxRate']}
                          fieldKey={[field.fieldKey, 'taxRate']}
                          style={{ marginBottom: 0 }}
                        >
                          <InputNumber 
                            min={0} 
                            max={100} 
                            style={{ width: '100%' }} 
                            placeholder="19.25"
                            formatter={value => `${value}%`}
                            parser={value => value.replace('%', '')}
                          />
                        </Form.Item>
                      </Col>
                      <Col span={5}>
                        <div style={{ 
                          width: '100%', 
                          padding: '4px 11px',
                          textAlign: 'right',
                          fontWeight: 500,
                          color: '#1890ff'
                        }}>
                          {lineAmount.toLocaleString()} FCFA
                        </div>
                      </Col>
                      <Col span={1}>
                        <Button 
                          type="text" 
                          danger 
                          icon={<DeleteOutlined />} 
                          onClick={() => remove(field.name)}
                          size="small"
                        />
                      </Col>
                    </Row>
                  );
                  })}
                  <Form.Item style={{ marginTop: '12px' }}>
                    <Button type="link" onClick={() => add()} icon={<PlusOutlined />}>
                      Add a line
                    </Button>
                  </Form.Item>
                </>
              )}
            </Form.List>
          </div>

          <Divider orientation="left" style={{ marginTop: '24px', marginBottom: '16px' }}>Terms and Conditions</Divider>
          
          <Form.Item
            name="description"
            label="Notes"
          >
            <TextArea rows={3} placeholder="Terms and conditions..." />
          </Form.Item>

          <Row gutter={16} style={{ marginTop: '24px' }}>
            <Col span={12}>
              {/* Left side empty for layout */}
            </Col>
            <Col span={12}>
              <div style={{ background: '#fafafa', padding: '16px', borderRadius: '4px' }}>
                <Row justify="space-between" style={{ marginBottom: '8px' }}>
                  <Col><Text>Untaxed Amount:</Text></Col>
                  <Col>
                    <Form.Item name="totalAmount" noStyle>
                      <InputNumber
                        style={{ width: '150px', textAlign: 'right' }}
                        min={0}
                        formatter={(value) => `${value} FCFA`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                        parser={(value) => value.replace(/[^0-9]/g, '')}
                        bordered={false}
                      />
                    </Form.Item>
                  </Col>
                </Row>
                <Row justify="space-between" style={{ marginBottom: '8px' }}>
                  <Col><Text>Taxes:</Text></Col>
                  <Col>
                    <Form.Item name="taxAmount" noStyle>
                      <InputNumber
                        style={{ width: '150px', textAlign: 'right' }}
                        min={0}
                        formatter={(value) => `${value} FCFA`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                        parser={(value) => value.replace(/[^0-9]/g, '')}
                        bordered={false}
                      />
                    </Form.Item>
                  </Col>
                </Row>
                <Divider style={{ margin: '8px 0' }} />
                <Row justify="space-between">
                  <Col><Text strong style={{ fontSize: '16px' }}>Total:</Text></Col>
                  <Col>
                    <Text strong style={{ fontSize: '16px' }}>
                      {(calculatedSubtotal + calculatedTax).toLocaleString()} FCFA
                    </Text>
                  </Col>
                </Row>
              </div>
            </Col>
          </Row>

          <Form.Item name="invoiceNumber" hidden>
            <Input />
          </Form.Item>

          <Form.Item style={{ marginTop: '32px', marginBottom: 0 }}>
            <Space style={{ width: '100%', justifyContent: 'space-between' }}>
              <Button onClick={() => setCreateModalVisible(false)} size="large">
                Cancel
              </Button>
              <Space>
                <Button type="primary" loading={submitLoading} htmlType="submit" size="large">
                  Confirm
                </Button>
              </Space>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Detail Drawer */}
      <Drawer
        title={selectedPO ? `PO: ${selectedPO.poNumber}` : `Invoice: ${selectedInvoice?.invoiceNumber}`}
        placement="right"
        onClose={() => setDetailDrawerVisible(false)}
        visible={detailDrawerVisible}
        width={600}
      >
        {selectedPO && (
          <Descriptions bordered column={1}>
            <Descriptions.Item label="PO Number">
              <Tag color="blue">{selectedPO.poNumber}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Supplier">
              {selectedPO.supplier?.name}
            </Descriptions.Item>
            <Descriptions.Item label="Amount">
              <Text strong style={{ color: '#1890ff' }}>
                XAF {selectedPO.totalAmount?.toLocaleString()}
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              <Tag color={selectedPO.status === 'approved' ? 'success' : 'default'}>
                {selectedPO.status}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Items">
              <Table
                dataSource={selectedPO.items}
                columns={[
                  { title: 'Item', dataIndex: 'name', key: 'name' },
                  { title: 'Qty', dataIndex: 'quantity', key: 'quantity' },
                  { title: 'Unit Price', dataIndex: 'unitPrice', key: 'unitPrice' }
                ]}
                pagination={false}
                size="small"
              />
            </Descriptions.Item>
          </Descriptions>
        )}

        {selectedInvoice && (
          <div>
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="Invoice Number" span={2}>
                <Tag color="cyan">{selectedInvoice.invoiceNumber}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="PO Reference">
                {selectedInvoice.poNumber ? (
                  <Tag color="blue">{selectedInvoice.poNumber}</Tag>
                ) : (
                  <Text type="secondary">N/A</Text>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag>{selectedInvoice.status}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Approval Status">
                <Tag color="orange">{selectedInvoice.approvalStatus || 'N/A'}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Invoice Date">
                {selectedInvoice.invoiceDate ? moment(selectedInvoice.invoiceDate).format('DD/MM/YYYY') : 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label="Due Date">
                {selectedInvoice.dueDate ? moment(selectedInvoice.dueDate).format('DD/MM/YYYY') : 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label="Created By">
                {selectedInvoice.createdByDetails?.name || selectedInvoice.employee?.fullName || 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label="Creator Email">
                {selectedInvoice.createdByDetails?.email || selectedInvoice.employee?.email || 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label="Department">
                {selectedInvoice.createdByDetails?.department || 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label="Payment Terms">
                {selectedInvoice.paymentTerms || 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label="Total Amount">
                <Text strong style={{ color: '#1890ff' }}>
                  XAF {selectedInvoice.totalAmount?.toLocaleString()}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Tax Amount">
                XAF {selectedInvoice.taxAmount?.toLocaleString()}
              </Descriptions.Item>
              <Descriptions.Item label="Net Amount">
                XAF {selectedInvoice.netAmount?.toLocaleString()}
              </Descriptions.Item>
              <Descriptions.Item label="Notes" span={2}>
                {selectedInvoice.description || 'N/A'}
              </Descriptions.Item>
            </Descriptions>

            <Divider orientation="left" style={{ marginTop: '16px' }}>Invoice Items</Divider>
            {Array.isArray(selectedInvoice.items) && selectedInvoice.items.length > 0 ? (
              <Table
                dataSource={selectedInvoice.items}
                rowKey={(record, idx) => record._id || idx}
                pagination={false}
                size="small"
                columns={[
                  { title: 'Description', dataIndex: 'description', key: 'description' },
                  { title: 'Qty', dataIndex: 'quantity', key: 'quantity', width: 80 },
                  { title: 'Unit Price', dataIndex: 'unitPrice', key: 'unitPrice', width: 120,
                    render: (v) => `XAF ${Number(v || 0).toLocaleString()}` },
                  { title: 'Tax %', dataIndex: 'taxRate', key: 'taxRate', width: 80,
                    render: (v) => `${Number(v || 0)}%` },
                  { title: 'Line Amount', key: 'lineAmount', width: 140,
                    render: (_, record) => {
                      const lineAmount = (record.quantity || 0) * (record.unitPrice || 0);
                      return `XAF ${lineAmount.toLocaleString()}`;
                    }
                  }
                ]}
              />
            ) : (
              <Text type="secondary">No items found</Text>
            )}

            <Divider orientation="left" style={{ marginTop: '16px' }}>Payment Breakdown</Divider>
            {Array.isArray(selectedInvoice.paymentTermsBreakdown) && selectedInvoice.paymentTermsBreakdown.length > 0 ? (
              <Table
                dataSource={selectedInvoice.paymentTermsBreakdown}
                rowKey={(record, idx) => record._id || idx}
                pagination={false}
                size="small"
                columns={[
                  { title: 'Description', dataIndex: 'description', key: 'description' },
                  { title: 'Percentage', dataIndex: 'percentage', key: 'percentage', width: 120,
                    render: (v) => `${Number(v || 0)}%` },
                  { title: 'Amount', dataIndex: 'amount', key: 'amount', width: 140,
                    render: (v) => `XAF ${Number(v || 0).toLocaleString()}` }
                ]}
              />
            ) : (
              <Text type="secondary">No payment breakdown provided</Text>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default FinanceInvoicePreparation;
