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
  Statistic,
  Modal,
  Form,
  Input,
  Select,
  Tabs,
  Drawer,
  message,
  Descriptions,
  InputNumber,
  DatePicker,
  Upload,
  Tooltip
} from 'antd';
import {
  TeamOutlined,
  PlusOutlined,
  EditOutlined,
  EyeOutlined,
  UserOutlined,
  ShopOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  StopOutlined,
  MailOutlined,
  PhoneOutlined,
  GlobalOutlined,
  BankOutlined,
  ReloadOutlined,
  UploadOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import moment from 'moment';
import customerApiService from '../../services/customerAPI';
import supplierApiService from '../../services/supplierAPI';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const { TabPane } = Tabs;

const SupplyChainCustomerVendorManagement = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [suppliers, setSuppliers] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [stats, setStats] = useState({ suppliers: {}, customers: {} });
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false);
  const [poUploadModalVisible, setPOUploadModalVisible] = useState(false);
  const [poEditModalVisible, setPOEditModalVisible] = useState(false);
  const [selectedPO, setSelectedPO] = useState(null);
  const [poForm] = Form.useForm();
  const [poFile, setPOFile] = useState(null);
  const [form] = Form.useForm();
  const [activeMainTab, setActiveMainTab] = useState('suppliers');
  const [activeSubTab, setActiveSubTab] = useState('all');
  const [customerPOs, setCustomerPOs] = useState([]);
  const [posLoading, setPOsLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  const [userRole, setUserRole] = useState('');

  // Get user info from localStorage
  useEffect(() => {
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    setUserRole(userInfo.role || '');
  }, []);

  useEffect(() => {
    if (activeMainTab === 'suppliers') {
      fetchSuppliers();
      fetchSupplierStats();
    } else if (activeMainTab === 'customers') {
      fetchCustomers();
      fetchCustomerStats();
    }
  }, [activeMainTab, activeSubTab, pagination.current, pagination.pageSize]);

  // ==========================================
  // SUPPLIER METHODS
  // ==========================================

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.current,
        limit: pagination.pageSize
      };

      if (activeSubTab !== 'all') {
        params.status = activeSubTab;
      }

      const response = await supplierApiService.getAllSuppliers(params);
      
      if (response.success) {
        setSuppliers(response.data);
        setPagination(prev => ({
          ...prev,
          total: response.pagination?.total || 0
        }));
      }
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      message.error('Failed to fetch suppliers');
    } finally {
      setLoading(false);
    }
  };

  const fetchSupplierStats = async () => {
    try {
      const response = await supplierApiService.getDashboardStats();
      if (response.success) {
        setStats(prev => ({ ...prev, suppliers: response.data }));
      }
    } catch (error) {
      console.error('Error fetching supplier stats:', error);
    }
  };

  // ==========================================
  // CUSTOMER METHODS
  // ==========================================

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.current,
        limit: pagination.pageSize
      };

      if (activeSubTab !== 'all') {
        params.status = activeSubTab;
      }

      const response = await customerApiService.getAllCustomers(params);
      
      if (response.success) {
        setCustomers(response.data);
        setPagination(prev => ({
          ...prev,
          total: response.pagination?.total || 0
        }));
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
      message.error('Failed to fetch customers');
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomerStats = async () => {
    try {
      const response = await customerApiService.getDashboardStats();
      if (response.success) {
        setStats(prev => ({ ...prev, customers: response.data }));
      }
    } catch (error) {
      console.error('Error fetching customer stats:', error);
    }
  };

  // ==========================================
  // CUSTOMER HANDLERS
  // ==========================================

  const handleAddCustomer = () => {
    form.resetFields();
    setSelectedRecord(null);
    setModalVisible(true);
  };

  const handleEditCustomer = (customer) => {
    setSelectedRecord(customer);
    form.setFieldsValue({
      ...customer,
      contactName: customer.contactPersons?.[0]?.name,
      contactEmail: customer.contactPersons?.[0]?.email,
      contactPhone: customer.contactPersons?.[0]?.phone,
      contactPosition: customer.contactPersons?.[0]?.position,
      street: customer.address?.street,
      city: customer.address?.city,
      state: customer.address?.state,
      country: customer.address?.country,
      postalCode: customer.address?.postalCode,
    });
    setModalVisible(true);
  };

  const handleViewCustomer = async (customer) => {
    try {
      const response = await customerApiService.getCustomerById(customer._id);
      if (response.success) {
        setSelectedRecord(response.data);
        setDetailDrawerVisible(true);
        // Fetch POs for this customer
        fetchCustomerPOs(customer._id);
      }
    } catch (error) {
      message.error('Failed to load customer details');
    }
  };

  const fetchCustomerPOs = async (customerId) => {
    try {
      setPOsLoading(true);
      const response = await customerApiService.getCustomerPurchaseOrders(customerId);
      if (response.success) {
        setCustomerPOs(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching customer POs:', error);
      setCustomerPOs([]);
    } finally {
      setPOsLoading(false);
    }
  };

  const handleSubmitCustomer = async (values) => {
    try {
      setLoading(true);

      const customerData = {
        companyName: values.companyName,
        tradingName: values.tradingName,
        contactPersons: [{
          name: values.contactName,
          email: values.contactEmail,
          phone: values.contactPhone,
          position: values.contactPosition,
          isPrimary: true
        }],
        primaryEmail: values.primaryEmail,
        primaryPhone: values.primaryPhone,
        alternatePhone: values.alternatePhone,
        website: values.website,
        address: {
          street: values.street,
          city: values.city,
          state: values.state,
          country: values.country,
          postalCode: values.postalCode
        },
        businessType: values.businessType,
        industry: values.industry,
        businessRegistrationNumber: values.businessRegistrationNumber,
        taxIdNumber: values.taxIdNumber,
        establishedYear: values.establishedYear,
        customerType: values.customerType,
        creditLimit: values.creditLimit,
        creditTerms: values.creditTerms,
        currency: values.currency,
        bankDetails: {
          bankName: values.bankName,
          accountNumber: values.accountNumber,
          accountName: values.accountName,
          swiftCode: values.swiftCode,
          iban: values.iban
        }
      };

      let response;
      if (selectedRecord) {
        response = await customerApiService.updateCustomer(selectedRecord._id, customerData);
      } else {
        response = await customerApiService.createCustomer(customerData);
      }

      if (response.success) {
        message.success(response.message);
        setModalVisible(false);
        form.resetFields();
        fetchCustomers();
        fetchCustomerStats();
      } else {
        message.error(response.message);
      }
    } catch (error) {
      message.error('Failed to save customer');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveCustomer = async (customerId) => {
    try {
      const response = await customerApiService.approveCustomer(customerId);
      if (response.success) {
        message.success(response.message);
        fetchCustomers();
        fetchCustomerStats();
      } else {
        message.error(response.message);
      }
    } catch (error) {
      message.error('Failed to approve customer');
    }
  };

  const handleUpdateCustomerStatus = async (customerId, newStatus, reason = '') => {
    Modal.confirm({
      title: `${newStatus === 'suspended' ? 'Suspend' : 'Update'} Customer Status`,
      content: newStatus === 'suspended' 
        ? 'Are you sure you want to suspend this customer?' 
        : `Update customer status to ${newStatus}?`,
      onOk: async () => {
        try {
          const response = await customerApiService.updateCustomerStatus(customerId, newStatus, reason);
          if (response.success) {
            message.success(response.message);
            fetchCustomers();
            fetchCustomerStats();
          } else {
            message.error(response.message);
          }
        } catch (error) {
          message.error('Failed to update customer status');
        }
      }
    });
  };

  const handleTableChange = (newPagination) => {
    setPagination({
      current: newPagination.current,
      pageSize: newPagination.pageSize,
      total: pagination.total
    });
  };

  const handleUploadPO = (customer) => {
    setSelectedRecord(customer);
    setPOUploadModalVisible(true);
    poForm.resetFields();
    setPOFile(null);
  };

  const handleEditPO = (po, customer) => {
    setSelectedPO(po);
    setSelectedRecord(customer);
    
    // Pre-fill form with existing PO data
    poForm.setFieldsValue({
      poNumber: po.poNumber,
      poDate: moment(po.poDate),
      amount: po.amount,
      paymentTerms: typeof po.paymentTerms === 'string' ? po.paymentTerms : '',
      description: po.description || '',
      paymentTermBreakdown: Array.isArray(po.paymentTerms) ? po.paymentTerms : []
    });
    
    setPOEditModalVisible(true);
  };

  const handlePOEditSubmit = async (values) => {
    try {
      const poData = {
        poNumber: values.poNumber,
        amount: values.amount,
        poDate: values.poDate.format('YYYY-MM-DD'),
        paymentTerms: values.paymentTerms,
        description: values.description || ''
      };

      // Add payment term breakdown if defined
      if (values.paymentTermBreakdown && values.paymentTermBreakdown.length > 0) {
        poData.paymentTerms = values.paymentTermBreakdown;
      }

      const result = await customerApiService.updatePurchaseOrder(
        selectedRecord._id,
        selectedPO._id,
        poData,
        poFile
      );

      if (result.success) {
        message.success('Purchase Order updated successfully');
        setPOEditModalVisible(false);
        poForm.resetFields();
        setPOFile(null);
        setSelectedPO(null);
        // Refresh customer data
        fetchCustomers();
        if (selectedRecord) {
          fetchCustomerPOs(selectedRecord._id);
        }
      } else {
        message.error(result.message || 'Failed to update Purchase Order');
      }
    } catch (error) {
      console.error('Error updating PO:', error);
      message.error('Failed to update Purchase Order');
    }
  };

  const handlePOUploadSubmit = async (values) => {
    try {
      const poData = {
        poNumber: values.poNumber,
        amount: values.amount,
        poDate: values.poDate.format('YYYY-MM-DD'),
        paymentTerms: values.paymentTerms,
        description: values.description || ''
      };

      // Add payment term breakdown if defined
      if (values.paymentTermBreakdown && values.paymentTermBreakdown.length > 0) {
        poData.paymentTerms = values.paymentTermBreakdown;
      }

      const result = await customerApiService.uploadPurchaseOrder(
        selectedRecord._id,
        poData,
        poFile
      );

      if (result.success) {
        message.success('Purchase Order uploaded successfully');
        setPOUploadModalVisible(false);
        poForm.resetFields();
        setPOFile(null);
        // Refresh customer data if needed
        fetchCustomers();
      } else {
        message.error(result.message || 'Failed to upload Purchase Order');
      }
    } catch (error) {
      console.error('Error uploading PO:', error);
      message.error('Failed to upload Purchase Order');
    }
  };

  const getStatusTag = (status) => {
    const statusConfig = {
      pending: { color: 'orange', text: 'Pending' },
      approved: { color: 'green', text: 'Approved' },
      active: { color: 'blue', text: 'Active' },
      suspended: { color: 'red', text: 'Suspended' },
      inactive: { color: 'gray', text: 'Inactive' },
      rejected: { color: 'red', text: 'Rejected' }
    };
    const config = statusConfig[status] || { color: 'default', text: status };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  // ==========================================
  // CUSTOMER TABLE COLUMNS
  // ==========================================

  const customerColumns = [
    {
      title: 'Customer ID',
      dataIndex: 'customerId',
      key: 'customerId',
      render: (id) => <Text code>{id?.slice(-8)}</Text>,
      width: 120
    },
    {
      title: 'Company Name',
      dataIndex: 'companyName',
      key: 'companyName',
      ellipsis: true,
      width: 200
    },
    {
      title: 'Contact Person',
      dataIndex: ['contactPersons', 0, 'name'],
      key: 'contactName',
      ellipsis: true,
      width: 150
    },
    {
      title: 'Email',
      dataIndex: 'primaryEmail',
      key: 'primaryEmail',
      ellipsis: true,
      width: 180
    },
    {
      title: 'Phone',
      dataIndex: 'primaryPhone',
      key: 'primaryPhone',
      width: 130
    },
    {
      title: 'Customer Type',
      dataIndex: 'customerType',
      key: 'customerType',
      render: (type) => <Tag color="blue">{type}</Tag>,
      width: 120
    },
    {
      title: 'Industry',
      dataIndex: 'industry',
      key: 'industry',
      ellipsis: true,
      width: 130
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => getStatusTag(status),
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
            onClick={() => handleViewCustomer(record)}
          >
            View
          </Button>
          <Button 
            size="small" 
            icon={<EditOutlined />}
            onClick={() => handleEditCustomer(record)}
          >
            Edit
          </Button>
          {(userRole === 'admin' || userRole === 'finance') && (
            <Button 
              size="small" 
              icon={<UploadOutlined />}
              onClick={() => handleUploadPO(record)}
            >
              Upload PO
            </Button>
          )}
          {record.status === 'pending' && (
            <Button 
              size="small" 
              type="primary" 
              onClick={() => handleApproveCustomer(record._id)}
            >
              Approve
            </Button>
          )}
          {record.status === 'active' && (
            <Button 
              size="small" 
              danger
              onClick={() => handleUpdateCustomerStatus(record._id, 'suspended', 'Temporarily suspended')}
            >
              Suspend
            </Button>
          )}
        </Space>
      ),
      width: 200,
      fixed: 'right'
    }
  ];

  // ==========================================
  // SUPPLIER TABLE COLUMNS (Simplified)
  // ==========================================

  const supplierColumns = [
    {
      title: 'Supplier ID',
      dataIndex: '_id',
      key: '_id',
      render: (id) => <Text code>{id?.slice(-8)}</Text>,
      width: 100
    },
    {
      title: 'Company Name',
      dataIndex: ['supplierDetails', 'companyName'],
      key: 'companyName',
      ellipsis: true,
      width: 200
    },
    {
      title: 'Contact',
      dataIndex: ['supplierDetails', 'contactName'],
      key: 'contactName',
      ellipsis: true,
      width: 150
    },
    {
      title: 'Type',
      dataIndex: ['supplierDetails', 'supplierType'],
      key: 'supplierType',
      render: (type) => <Tag color="blue">{type}</Tag>,
      width: 130
    },
    {
      title: 'Status',
      dataIndex: ['supplierStatus', 'accountStatus'],
      key: 'status',
      render: (status) => getStatusTag(status),
      width: 120
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button 
            size="small" 
            icon={<EyeOutlined />} 
            onClick={() => navigate(`/supply-chain/suppliers/${record._id}/profile`)}
          >
            View
          </Button>
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
            <TeamOutlined /> Customer & Vendor Management
          </Title>
        </div>

        <Tabs activeKey={activeMainTab} onChange={setActiveMainTab}>
          {/* SUPPLIERS TAB */}
          <TabPane tab={<span><ShopOutlined /> Suppliers</span>} key="suppliers">
            <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between' }}>
              <Space>
                <Button 
                  icon={<ReloadOutlined />} 
                  onClick={fetchSuppliers}
                  loading={loading}
                >
                  Refresh
                </Button>
              </Space>
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                onClick={() => navigate('/supply-chain/supplier-management?action=add')}
              >
                Add Supplier
              </Button>
            </div>

            <Row gutter={16} style={{ marginBottom: '24px' }}>
              <Col span={6}>
                <Statistic
                  title="Total Suppliers"
                  value={stats.suppliers?.total || 0}
                  prefix={<ShopOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="Active"
                  value={stats.suppliers?.approved || 0}
                  prefix={<CheckCircleOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="Pending"
                  value={stats.suppliers?.pending || 0}
                  prefix={<ClockCircleOutlined />}
                  valueStyle={{ color: '#faad14' }}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="Suspended"
                  value={stats.suppliers?.suspended || 0}
                  prefix={<StopOutlined />}
                  valueStyle={{ color: '#ff4d4f' }}
                />
              </Col>
            </Row>

            <Tabs activeKey={activeSubTab} onChange={setActiveSubTab}>
              <TabPane tab="All" key="all" />
              <TabPane tab="Active" key="approved" />
              <TabPane tab="Pending" key="pending" />
              <TabPane tab="Suspended" key="suspended" />
            </Tabs>

            <Table
              columns={supplierColumns}
              dataSource={suppliers}
              rowKey="_id"
              loading={loading}
              pagination={pagination}
              onChange={handleTableChange}
              scroll={{ x: 1200 }}
            />
          </TabPane>

          {/* CUSTOMERS TAB */}
          <TabPane tab={<span><UserOutlined /> Customers</span>} key="customers">
            <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between' }}>
              <Space>
                <Button 
                  icon={<ReloadOutlined />} 
                  onClick={fetchCustomers}
                  loading={loading}
                >
                  Refresh
                </Button>
              </Space>
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                onClick={handleAddCustomer}
              >
                Add Customer
              </Button>
            </div>

            <Row gutter={16} style={{ marginBottom: '24px' }}>
              <Col span={6}>
                <Statistic
                  title="Total Customers"
                  value={stats.customers?.total || 0}
                  prefix={<UserOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="Active"
                  value={stats.customers?.active || 0}
                  prefix={<CheckCircleOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="Pending Approval"
                  value={stats.customers?.pending || 0}
                  prefix={<ClockCircleOutlined />}
                  valueStyle={{ color: '#faad14' }}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="Suspended"
                  value={stats.customers?.suspended || 0}
                  prefix={<StopOutlined />}
                  valueStyle={{ color: '#ff4d4f' }}
                />
              </Col>
            </Row>

            <Tabs activeKey={activeSubTab} onChange={setActiveSubTab}>
              <TabPane tab="All" key="all" />
              <TabPane tab="Active" key="active" />
              <TabPane tab="Pending" key="pending" />
              <TabPane tab="Suspended" key="suspended" />
            </Tabs>

            <Table
              columns={customerColumns}
              dataSource={customers}
              rowKey="_id"
              loading={loading}
              pagination={pagination}
              onChange={handleTableChange}
              scroll={{ x: 1400 }}
            />
          </TabPane>
        </Tabs>
      </Card>

      {/* CUSTOMER ADD/EDIT MODAL */}
      <Modal
        title={selectedRecord ? 'Edit Customer' : 'Add New Customer'}
        visible={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        width={800}
        confirmLoading={loading}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmitCustomer}
        >
          <Title level={5}>Company Information</Title>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="companyName"
                label="Company Name"
                rules={[{ required: true, message: 'Please enter company name' }]}
              >
                <Input placeholder="e.g., IHS CAMEROON SA" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="tradingName" label="Trading Name">
                <Input placeholder="Trading name (if different)" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="taxIdNumber"
                label="Tax ID / VAT Registration"
                rules={[{ required: true, message: 'Please enter tax ID' }]}
              >
                <Input placeholder="e.g., M091200042863X" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="businessRegistrationNumber" label="Business Registration Number">
                <Input placeholder="Company registration number" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="businessType"
                label="Business Type"
                rules={[{ required: true, message: 'Please select business type' }]}
              >
                <Select placeholder="Select business type">
                  <Option value="Corporation">Corporation</Option>
                  <Option value="Limited Company">Limited Company</Option>
                  <Option value="Partnership">Partnership</Option>
                  <Option value="Sole Proprietorship">Sole Proprietorship</Option>
                  <Option value="Government">Government</Option>
                  <Option value="NGO">NGO</Option>
                  <Option value="Other">Other</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="industry"
                label="Industry"
                rules={[{ required: true, message: 'Please select industry' }]}
              >
                <Select placeholder="Select industry">
                  <Option value="Telecommunications">Telecommunications</Option>
                  <Option value="Technology">Technology</Option>
                  <Option value="Manufacturing">Manufacturing</Option>
                  <Option value="Construction">Construction</Option>
                  <Option value="Real Estate">Real Estate</Option>
                  <Option value="Healthcare">Healthcare</Option>
                  <Option value="Education">Education</Option>
                  <Option value="Retail">Retail</Option>
                  <Option value="Hospitality">Hospitality</Option>
                  <Option value="Finance">Finance</Option>
                  <Option value="Government">Government</Option>
                  <Option value="Energy">Energy</Option>
                  <Option value="Transportation">Transportation</Option>
                  <Option value="Other">Other</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="customerType"
                label="Customer Type"
                rules={[{ required: true, message: 'Please select customer type' }]}
              >
                <Select placeholder="Select customer type">
                  <Option value="Enterprise">Enterprise</Option>
                  <Option value="SME">SME</Option>
                  <Option value="Government">Government</Option>
                  <Option value="Individual">Individual</Option>
                  <Option value="Partner">Partner</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="establishedYear" label="Established Year">
                <InputNumber placeholder="e.g., 2010" style={{ width: '100%' }} min={1900} max={new Date().getFullYear()} />
              </Form.Item>
            </Col>
          </Row>

          <Title level={5} style={{ marginTop: '16px' }}>Contact Information</Title>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="contactName"
                label="Contact Person Name"
                rules={[{ required: true, message: 'Please enter contact name' }]}
              >
                <Input placeholder="Full name" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="contactPosition" label="Position">
                <Input placeholder="e.g., General Manager" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="primaryEmail"
                label="Primary Email"
                rules={[
                  { required: true, message: 'Please enter email' },
                  { type: 'email', message: 'Please enter valid email' }
                ]}
              >
                <Input prefix={<MailOutlined />} placeholder="email@company.com" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="primaryPhone"
                label="Primary Phone"
                rules={[{ required: true, message: 'Please enter phone number' }]}
              >
                <Input prefix={<PhoneOutlined />} placeholder="+237 XXX XXX XXX" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="alternatePhone" label="Alternate Phone">
                <Input prefix={<PhoneOutlined />} placeholder="+237 XXX XXX XXX" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="website" label="Website">
                <Input prefix={<GlobalOutlined />} placeholder="https://www.company.com" />
              </Form.Item>
            </Col>
          </Row>

          <Title level={5} style={{ marginTop: '16px' }}>Address</Title>
          <Form.Item
            name="street"
            label="Street Address"
            rules={[{ required: true, message: 'Please enter street address' }]}
          >
            <Input placeholder="e.g., 1602/1606 Boulevard de la Liberte Akwa" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="city"
                label="City"
                rules={[{ required: true, message: 'Please enter city' }]}
              >
                <Input placeholder="e.g., Douala" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="state" label="State/Region">
                <Input placeholder="e.g., Littoral" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="country"
                label="Country"
                rules={[{ required: true, message: 'Please enter country' }]}
                initialValue="Cameroon"
              >
                <Input placeholder="Cameroon" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="postalCode" label="Postal Code">
                <Input placeholder="Postal code" />
              </Form.Item>
            </Col>
          </Row>

          <Title level={5} style={{ marginTop: '16px' }}>Financial Information</Title>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="creditLimit" label="Credit Limit">
                <InputNumber 
                  placeholder="0" 
                  style={{ width: '100%' }} 
                  min={0}
                  formatter={value => `XAF ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value.replace(/XAF\s?|(,*)/g, '')}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="creditTerms" label="Credit Terms" initialValue="30 days NET">
                <Select placeholder="Select credit terms">
                  <Option value="15 days NET">15 days NET</Option>
                  <Option value="30 days NET">30 days NET</Option>
                  <Option value="45 days NET">45 days NET</Option>
                  <Option value="60 days NET">60 days NET</Option>
                  <Option value="90 days NET">90 days NET</Option>
                  <Option value="Cash on Delivery">Cash on Delivery</Option>
                  <Option value="Advance Payment">Advance Payment</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={24}>
              <Form.Item name="currency" label="Currency" initialValue="XAF">
                <Select placeholder="Select currency">
                  <Option value="XAF">XAF (Central African CFA Franc)</Option>
                  <Option value="USD">USD (US Dollar)</Option>
                  <Option value="EUR">EUR (Euro)</Option>
                  <Option value="GBP">GBP (British Pound)</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Title level={5} style={{ marginTop: '16px' }}>Bank Details</Title>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="bankName" label="Bank Name">
                <Input prefix={<BankOutlined />} placeholder="Bank name" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="accountName" label="Account Name">
                <Input placeholder="Account holder name" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="accountNumber" label="Account Number">
                <Input placeholder="Bank account number" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="swiftCode" label="SWIFT/BIC Code">
                <Input placeholder="SWIFT code" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* CUSTOMER DETAIL DRAWER */}
      <Drawer
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <span>Customer Details</span>
            {(userRole === 'admin' || userRole === 'finance') && selectedRecord && (
              <Button 
                type="primary" 
                size="small"
                icon={<UploadOutlined />}
                onClick={() => {
                  setDetailDrawerVisible(false);
                  handleUploadPO(selectedRecord);
                }}
              >
                Upload PO
              </Button>
            )}
          </div>
        }
        placement="right"
        width={720}
        visible={detailDrawerVisible}
        onClose={() => setDetailDrawerVisible(false)}
      >
        {selectedRecord && (
          <div>
            {/* Always show upload button for now - DEBUG */}
            <div style={{ marginBottom: '24px' }}>
              <Button 
                type="primary" 
                icon={<UploadOutlined />}
                onClick={() => {
                  setDetailDrawerVisible(false);
                  handleUploadPO(selectedRecord);
                }}
                block
              >
                Upload PO for {selectedRecord.companyName}
              </Button>
              <div style={{ fontSize: '11px', color: '#999', marginTop: '4px' }}>
                Current user role: {userRole || '(empty)'}
              </div>
            </div>
            
            <Descriptions title="Company Information" bordered column={2}>
              <Descriptions.Item label="Company Name" span={2}>
                {selectedRecord.companyName}
              </Descriptions.Item>
              <Descriptions.Item label="Customer ID">
                {selectedRecord.customerId}
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                {getStatusTag(selectedRecord.status)}
              </Descriptions.Item>
              <Descriptions.Item label="Tax ID">
                {selectedRecord.taxIdNumber}
              </Descriptions.Item>
              <Descriptions.Item label="Industry">
                {selectedRecord.industry}
              </Descriptions.Item>
              <Descriptions.Item label="Customer Type">
                {selectedRecord.customerType}
              </Descriptions.Item>
              <Descriptions.Item label="Business Type">
                {selectedRecord.businessType}
              </Descriptions.Item>
            </Descriptions>

            <Descriptions title="Contact Information" bordered column={2} style={{ marginTop: '24px' }}>
              <Descriptions.Item label="Primary Email" span={2}>
                <a href={`mailto:${selectedRecord.primaryEmail}`}>{selectedRecord.primaryEmail}</a>
              </Descriptions.Item>
              <Descriptions.Item label="Primary Phone">
                {selectedRecord.primaryPhone}
              </Descriptions.Item>
              <Descriptions.Item label="Website">
                {selectedRecord.website ? (
                  <a href={selectedRecord.website} target="_blank" rel="noopener noreferrer">
                    {selectedRecord.website}
                  </a>
                ) : 'N/A'}
              </Descriptions.Item>
            </Descriptions>

            <Descriptions title="Address" bordered column={1} style={{ marginTop: '24px' }}>
              <Descriptions.Item label="Full Address">
                {selectedRecord.address?.street}<br />
                {selectedRecord.address?.city}, {selectedRecord.address?.state}<br />
                {selectedRecord.address?.country} {selectedRecord.address?.postalCode}
              </Descriptions.Item>
            </Descriptions>

            <Descriptions title="Financial Information" bordered column={2} style={{ marginTop: '24px' }}>
              <Descriptions.Item label="Credit Limit">
                {selectedRecord.creditLimit?.toLocaleString()} {selectedRecord.currency}
              </Descriptions.Item>
              <Descriptions.Item label="Credit Terms">
                {selectedRecord.creditTerms}
              </Descriptions.Item>
            </Descriptions>

            {/* Purchase Orders Section */}
            <div style={{ marginTop: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ margin: 0 }}>Purchase Orders ({customerPOs.length})</h3>
                <Button 
                  size="small"
                  icon={<ReloadOutlined />}
                  onClick={() => selectedRecord && fetchCustomerPOs(selectedRecord._id)}
                  loading={posLoading}
                >
                  Refresh
                </Button>
              </div>
              
              {customerPOs.length > 0 ? (
                <Table
                  columns={[
                    {
                      title: 'PO Number',
                      dataIndex: 'poNumber',
                      key: 'poNumber',
                      render: (text) => <Text strong>{text}</Text>
                    },
                    {
                      title: 'Date',
                      dataIndex: 'poDate',
                      key: 'poDate',
                      render: (date) => new Date(date).toLocaleDateString()
                    },
                    {
                      title: 'Amount',
                      dataIndex: 'amount',
                      key: 'amount',
                      render: (amount, record) => `${record.currency || 'XAF'} ${amount?.toLocaleString()}`
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
                      }
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
                      }
                    },
                    {
                      title: 'Actions',
                      key: 'actions',
                      render: (_, record) => (
                        <Space size="small">
                          <Tooltip title="Edit PO">
                            <Button
                              size="small"
                              icon={<EditOutlined />}
                              onClick={() => handleEditPO(record, selectedRecord)}
                            />
                          </Tooltip>
                          <Tooltip title="View Details">
                            <Button
                              size="small"
                              icon={<EyeOutlined />}
                              type="primary"
                              onClick={() => {
                                setSelectedPO(record);
                                // Can add a detail modal here if needed
                              }}
                            />
                          </Tooltip>
                        </Space>
                      )
                    }
                  ]}
                  dataSource={customerPOs}
                  pagination={false}
                  loading={posLoading}
                  size="small"
                  rowKey={(record) => record._id || Math.random()}
                />
              ) : (
                <div style={{ padding: '20px', textAlign: 'center', backgroundColor: '#fafafa', borderRadius: '4px' }}>
                  <p>No Purchase Orders uploaded yet</p>
                </div>
              )}
            </div>
          </div>
        )}
      </Drawer>

      {/* Purchase Order Upload Modal */}
      <Modal
        title="Upload Purchase Order"
        open={poUploadModalVisible}
        onCancel={() => {
          setPOUploadModalVisible(false);
          poForm.resetFields();
          setPOFile(null);
        }}
        footer={null}
        width={600}
      >
        <Form
          form={poForm}
          layout="vertical"
          onFinish={handlePOUploadSubmit}
        >
          <Form.Item
            label="PO Number"
            name="poNumber"
            rules={[{ required: true, message: 'Please enter PO number' }]}
          >
            <Input placeholder="e.g., PO-2026-001" />
          </Form.Item>

          <Form.Item
            label="PO Date"
            name="poDate"
            rules={[{ required: true, message: 'Please select PO date' }]}
          >
            <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
          </Form.Item>

          <Form.Item
            label="Amount"
            name="amount"
            rules={[{ required: true, message: 'Please enter amount' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value.replace(/\$\s?|(,*)/g, '')}
              placeholder="Enter amount"
            />
          </Form.Item>

          <Form.Item
            label="Payment Terms (General)"
            name="paymentTerms"
          >
            <Input placeholder="e.g., 30 days NET, 50% Advance, etc." />
          </Form.Item>

          <Card 
            title="Payment Term Breakdown (Optional)"
            size="small"
            style={{ marginBottom: '16px', background: '#f0f5ff' }}
          >
            <Text type="secondary" style={{ display: 'block', marginBottom: '12px' }}>
              Define milestone-based payment terms for this PO
            </Text>
            
            <Row gutter={8} style={{ marginBottom: '8px', fontWeight: 500 }}>
              <Col span={9}>Description</Col>
              <Col span={6}>Percentage (%)</Col>
              <Col span={7}>Timeframe</Col>
              <Col span={2}></Col>
            </Row>
            
            <Form.List name="paymentTermBreakdown">
              {(fields, { add, remove }) => (
                <>
                  {fields.map((field) => (
                    <Row gutter={8} key={field.key} style={{ marginBottom: 8 }}>
                      <Col span={9}>
                        <Form.Item
                          {...field}
                          name={[field.name, 'description']}
                          fieldKey={[field.fieldKey, 'description']}
                          rules={[{ required: true, message: 'Enter description' }]}
                          style={{ marginBottom: 0 }}
                        >
                          <Input placeholder="e.g., Advance payment, Upon delivery" />
                        </Form.Item>
                      </Col>
                      <Col span={6}>
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
                      <Col span={7}>
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
                        {poForm.getFieldValue('paymentTermBreakdown')?.[field.name]?.timeframe === 'custom' && (
                          <Form.Item
                            {...field}
                            name={[field.name, 'customTimeframe']}
                            fieldKey={[field.fieldKey, 'customTimeframe']}
                            rules={[{ required: true, message: 'Enter custom timeframe' }]}
                            style={{ marginBottom: 0, marginTop: 4 }}
                          >
                            <Input placeholder="Enter custom timeframe" size="small" />
                          </Form.Item>
                        )}
                      </Col>
                      <Col span={2}>
                        <Button 
                          type="text" 
                          danger 
                          icon={<DeleteOutlined />} 
                          onClick={() => remove(field.name)}
                        />
                      </Col>
                    </Row>
                  ))}
                  <Form.Item style={{ marginBottom: 0 }}>
                    <Button type="dashed" onClick={() => add()} icon={<PlusOutlined />} block>
                      Add Payment Term
                    </Button>
                  </Form.Item>
                </>
              )}
            </Form.List>
            
            <Text type="secondary" style={{ display: 'block', marginTop: '12px', fontSize: '12px' }}>
              💡 Total percentage should equal 100% for complete breakdown
            </Text>
          </Card>

          <Form.Item
            label="Description"
            name="description"
          >
            <TextArea rows={3} placeholder="Optional description" />
          </Form.Item>

          <Form.Item label="Attach PO Document (Optional)">
            <Upload
              beforeUpload={(file) => {
                setPOFile(file);
                return false; // Prevent auto upload
              }}
              onRemove={() => setPOFile(null)}
              maxCount={1}
            >
              <Button icon={<UploadOutlined />}>Select File</Button>
            </Upload>
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                Upload PO
              </Button>
              <Button onClick={() => {
                setPOUploadModalVisible(false);
                poForm.resetFields();
                setPOFile(null);
              }}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Purchase Order Edit Modal */}
      <Modal
        title={`Edit Purchase Order - ${selectedPO?.poNumber || ''}`}
        open={poEditModalVisible}
        onCancel={() => {
          setPOEditModalVisible(false);
          poForm.resetFields();
          setPOFile(null);
          setSelectedPO(null);
        }}
        footer={null}
        width={600}
      >
        <Form
          form={poForm}
          layout="vertical"
          onFinish={handlePOEditSubmit}
        >
          <Form.Item
            label="PO Number"
            name="poNumber"
            rules={[{ required: true, message: 'Please enter PO number' }]}
          >
            <Input placeholder="e.g., PO-2026-001" />
          </Form.Item>

          <Form.Item
            label="PO Date"
            name="poDate"
            rules={[{ required: true, message: 'Please select PO date' }]}
          >
            <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
          </Form.Item>

          <Form.Item
            label="Amount"
            name="amount"
            rules={[{ required: true, message: 'Please enter amount' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value.replace(/\$\s?|(,*)/g, '')}
              placeholder="Enter amount"
            />
          </Form.Item>

          <Form.Item
            label="Payment Terms (General)"
            name="paymentTerms"
          >
            <Input placeholder="e.g., 30 days NET, 50% Advance, etc." />
          </Form.Item>

          <Card 
            title="Payment Term Breakdown (Optional)"
            size="small"
            style={{ marginBottom: '16px', background: '#f0f5ff' }}
          >
            <Text type="secondary" style={{ display: 'block', marginBottom: '12px' }}>
              Define milestone-based payment terms for this PO
            </Text>
            
            <Row gutter={8} style={{ marginBottom: '8px', fontWeight: 500 }}>
              <Col span={9}>Description</Col>
              <Col span={6}>Percentage (%)</Col>
              <Col span={7}>Timeframe</Col>
              <Col span={2}></Col>
            </Row>
            
            <Form.List name="paymentTermBreakdown">
              {(fields, { add, remove }) => (
                <>
                  {fields.map((field) => (
                    <Row gutter={8} key={field.key} style={{ marginBottom: 8 }}>
                      <Col span={9}>
                        <Form.Item
                          {...field}
                          name={[field.name, 'description']}
                          fieldKey={[field.fieldKey, 'description']}
                          rules={[{ required: true, message: 'Enter description' }]}
                          style={{ marginBottom: 0 }}
                        >
                          <Input placeholder="e.g., Advance payment, Upon delivery" />
                        </Form.Item>
                      </Col>
                      <Col span={6}>
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
                      <Col span={7}>
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
                        {poForm.getFieldValue('paymentTermBreakdown')?.[field.name]?.timeframe === 'custom' && (
                          <Form.Item
                            {...field}
                            name={[field.name, 'customTimeframe']}
                            fieldKey={[field.fieldKey, 'customTimeframe']}
                            rules={[{ required: true, message: 'Enter custom timeframe' }]}
                            style={{ marginBottom: 0, marginTop: 4 }}
                          >
                            <Input placeholder="Enter custom timeframe" size="small" />
                          </Form.Item>
                        )}
                      </Col>
                      <Col span={2}>
                        <Button 
                          type="text" 
                          danger 
                          icon={<DeleteOutlined />} 
                          onClick={() => remove(field.name)}
                        />
                      </Col>
                    </Row>
                  ))}
                  <Form.Item style={{ marginBottom: 0 }}>
                    <Button type="dashed" onClick={() => add()} icon={<PlusOutlined />} block>
                      Add Payment Term
                    </Button>
                  </Form.Item>
                </>
              )}
            </Form.List>
            
            <Text type="secondary" style={{ display: 'block', marginTop: '12px', fontSize: '12px' }}>
              💡 Total percentage should equal 100% for complete breakdown
            </Text>
          </Card>

          <Form.Item
            label="Description"
            name="description"
          >
            <TextArea rows={3} placeholder="Optional description" />
          </Form.Item>

          <Form.Item label="Update PO Document (Optional)">
            <Upload
              beforeUpload={(file) => {
                setPOFile(file);
                return false; // Prevent auto upload
              }}
              onRemove={() => setPOFile(null)}
              maxCount={1}
            >
              <Button icon={<UploadOutlined />}>Select File</Button>
            </Upload>
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                Update PO
              </Button>
              <Button onClick={() => {
                setPOEditModalVisible(false);
                poForm.resetFields();
                setPOFile(null);
                setSelectedPO(null);
              }}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default SupplyChainCustomerVendorManagement;
