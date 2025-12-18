import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  DatePicker,
  Upload,
  Alert,
  Tabs,
  Drawer,
  message,
  Descriptions,
  Timeline,
  Progress,
  List,
  Avatar,
  Badge,
  Tooltip,
  Divider,
  InputNumber,
  Checkbox,
  Spin,
  notification
} from 'antd';
import {
  FileTextOutlined,
  PlusOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  DownloadOutlined,
  UploadOutlined,
  CalendarOutlined,
  DollarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  WarningOutlined,
  TeamOutlined,
  BankOutlined,
  SafetyCertificateOutlined,
  ReloadOutlined,
  ExportOutlined,
  SendOutlined,
  ContainerOutlined,
  AuditOutlined,
  MailOutlined,
  PhoneOutlined,
  InboxOutlined
} from '@ant-design/icons';
import moment from 'moment';
import contractApiService from '../../services/contractAPI';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const { TabPane } = Tabs;
const { RangePicker } = DatePicker;
const { Dragger } = Upload;

const SupplyChainContractManagement = () => {
  const [loading, setLoading] = useState(false);
  const [contracts, setContracts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const navigate = useNavigate();
  const [selectedContract, setSelectedContract] = useState(null);
  const [contractModalVisible, setContractModalVisible] = useState(false);
  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false);
  const [renewalModalVisible, setRenewalModalVisible] = useState(false);
  const [amendmentModalVisible, setAmendmentModalVisible] = useState(false);
  const [milestoneModalVisible, setMilestoneModalVisible] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [form] = Form.useForm();
  const [renewalForm] = Form.useForm();
  const [amendmentForm] = Form.useForm();
  const [milestoneForm] = Form.useForm();
  const [activeTab, setActiveTab] = useState('active');
  const [statistics, setStatistics] = useState({});
  const [uploadedDocuments, setUploadedDocuments] = useState([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState(null); 

  useEffect(() => {
    fetchContracts();
    fetchSuppliers();
    fetchStatistics();
  }, []);

  const fetchContracts = async () => {
    setLoading(true);
    try {
      const response = await contractApiService.getAllContracts();
      if (response.success) {
        setContracts(response.data);
      }
    } catch (error) {
      console.error('Error fetching contracts:', error);
      message.error('Failed to fetch contracts');
    } finally {
      setLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    try {
      // This would be a separate supplier service call
      // For now using mock data structure
      setSuppliers([]);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await contractApiService.getContractStatistics();
      if (response.success) {
        setStatistics(response.data.overview);
      }
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  const getStatusTag = (status) => {
    const statusMap = {
      'draft': { color: 'default', text: 'Draft', icon: <EditOutlined /> },
      'pending_approval': { color: 'orange', text: 'Pending Approval', icon: <ClockCircleOutlined /> },
      'active': { color: 'green', text: 'Active', icon: <CheckCircleOutlined /> },
      'expiring_soon': { color: 'gold', text: 'Expiring Soon', icon: <WarningOutlined /> },
      'expired': { color: 'red', text: 'Expired', icon: <ExclamationCircleOutlined /> },
      'terminated': { color: 'red', text: 'Terminated', icon: <ExclamationCircleOutlined /> },
      'renewed': { color: 'purple', text: 'Renewed', icon: <CheckCircleOutlined /> },
      'suspended': { color: 'orange', text: 'Suspended', icon: <WarningOutlined /> }
    };

    const statusInfo = statusMap[status] || { color: 'default', text: status };
    return (
      <Tag color={statusInfo.color} icon={statusInfo.icon}>
        {statusInfo.text}
      </Tag>
    );
  };

  const getPriorityTag = (priority) => {
    const priorityMap = {
      'Low': 'green',
      'Medium': 'orange',
      'High': 'red',
      'Critical': 'purple'
    };
    return <Tag color={priorityMap[priority]}>{priority}</Tag>;
  };

  const getRiskLevelTag = (level) => {
    const levelMap = {
      'Low': 'green',
      'Medium': 'orange',
      'High': 'red',
      'Critical': 'purple'
    };
    return <Tag color={levelMap[level]}>{level}</Tag>;
  };

  const handleAddContract = () => {
    form.resetFields();
    setSelectedContract(null);
    setUploadedDocuments([]);
    setContractModalVisible(true);
  };

  const handleEditContract = async (contract) => {
    try {
      const response = await contractApiService.getContractById(contract.id || contract._id);
      if (response.success) {
        setSelectedContract(response.data);
        form.setFieldsValue({
          ...response.data,
          dateRange: [
            moment(response.data.dates.startDate),
            moment(response.data.dates.endDate)
          ],
          supplierId: response.data.supplier.supplierId,
          totalValue: response.data.financials.totalValue,
          currency: response.data.financials.currency,
          paymentTerms: response.data.financials.paymentTerms,
          deliveryTerms: response.data.financials.deliveryTerms,
          contractManager: response.data.management.contractManager,
          department: response.data.management.department,
          isRenewable: response.data.renewal.isRenewable,
          autoRenewal: response.data.renewal.autoRenewal
        });
        setUploadedDocuments([]);
        setContractModalVisible(true);
      }
    } catch (error) {
      message.error('Failed to load contract details');
    }
  };

  const handleViewDetails = async (contract) => {
    try {
      const response = await contractApiService.getContractById(contract.id || contract._id);
      if (response.success) {
        setSelectedContract(response.data);
        setDetailDrawerVisible(true);
      }
    } catch (error) {
      message.error('Failed to load contract details');
    }
  };

  const handleRenewContract = (contract) => {
    setSelectedContract(contract);
    renewalForm.setFieldsValue({
      newEndDate: moment(contract.dates?.endDate || contract.endDate).add(1, 'year'),
      renewalType: 'standard',
      currentEndDate: contract.dates?.endDate || contract.endDate
    });
    setRenewalModalVisible(true);
  };

  const handleAmendContract = (contract) => {
    setSelectedContract(contract);
    amendmentForm.resetFields();
    setAmendmentModalVisible(true);
  };

  const handleAddMilestone = (contract) => {
    setSelectedContract(contract);
    milestoneForm.resetFields();
    setMilestoneModalVisible(true);
  };

  const handleSubmitContract = async (values) => {
    try {
      setLoading(true);
      
      // Validate the form data
      const validation = contractApiService.validateContractData(values);
      if (!validation.isValid) {
        Object.keys(validation.errors).forEach(field => {
          form.setFields([{
            name: field,
            errors: [validation.errors[field]]
          }]);
        });
        return;
      }

      const contractData = {
        ...values,
        startDate: values.dateRange[0].format('YYYY-MM-DD'),
        endDate: values.dateRange[1].format('YYYY-MM-DD')
      };

      delete contractData.dateRange;

      let response;
      if (selectedContract) {
        response = await contractApiService.updateContract(
          selectedContract._id,
          contractData,
          uploadedDocuments
        );
        message.success('Contract updated successfully!');
      } else {
        response = await contractApiService.createContract(contractData, uploadedDocuments);
        message.success('Contract created successfully!');
      }

      setContractModalVisible(false);
      form.resetFields();
      setUploadedDocuments([]);
      await fetchContracts();
      await fetchStatistics();
    } catch (error) {
      message.error(error.message || 'Failed to save contract');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitRenewal = async (values) => {
    try {
      setLoading(true);
      
      const validation = contractApiService.validateRenewalData(values);
      if (!validation.isValid) {
        Object.keys(validation.errors).forEach(field => {
          renewalForm.setFields([{
            name: field,
            errors: [validation.errors[field]]
          }]);
        });
        return;
      }

      const renewalData = {
        ...values,
        newEndDate: values.newEndDate.format('YYYY-MM-DD')
      };

      const response = await contractApiService.renewContract(selectedContract._id, renewalData);
      
      notification.success({
        message: 'Contract Renewed',
        description: `Contract ${selectedContract.contractNumber} has been successfully renewed.`,
      });
      
      setRenewalModalVisible(false);
      renewalForm.resetFields();
      await fetchContracts();
      await fetchStatistics();
    } catch (error) {
      message.error(error.message || 'Failed to renew contract');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAmendment = async (values) => {
    try {
      setLoading(true);
      
      const validation = contractApiService.validateAmendmentData(values);
      if (!validation.isValid) {
        Object.keys(validation.errors).forEach(field => {
          amendmentForm.setFields([{
            name: field,
            errors: [validation.errors[field]]
          }]);
        });
        return;
      }

      const amendmentData = {
        ...values,
        effectiveDate: values.effectiveDate.format('YYYY-MM-DD')
      };

      const response = await contractApiService.createAmendment(
        selectedContract._id,
        amendmentData,
        uploadedDocuments
      );
      
      message.success('Amendment created successfully!');
      
      setAmendmentModalVisible(false);
      amendmentForm.resetFields();
      setUploadedDocuments([]);
      await fetchContracts();
    } catch (error) {
      message.error(error.message || 'Failed to create amendment');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitMilestone = async (values) => {
    try {
      setLoading(true);
      
      const milestoneData = {
        ...values,
        dueDate: values.dueDate.format('YYYY-MM-DD')
      };

      const response = await contractApiService.addMilestone(selectedContract._id, milestoneData);
      
      message.success('Milestone added successfully!');
      
      setMilestoneModalVisible(false);
      milestoneForm.resetFields();
      
      // Refresh contract details
      if (detailDrawerVisible) {
        await handleViewDetails(selectedContract);
      }
      await fetchContracts();
    } catch (error) {
      message.error(error.message || 'Failed to add milestone');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateContractStatus = async (contractId, status, reason = '') => {
    try {
      setLoading(true);
      const response = await contractApiService.updateContractStatus(contractId, { status, reason });
      
      message.success(`Contract status updated to ${contractApiService.getContractStatusLabel(status)}`);
      await fetchContracts();
      await fetchStatistics();
    } catch (error) {
      message.error(error.message || 'Failed to update contract status');
    } finally {
      setLoading(false);
    }
  };

  const handleExportContracts = async () => {
    try {
      await contractApiService.exportAndDownload({ status: activeTab });
      message.success('Contracts exported successfully!');
    } catch (error) {
      message.error(error.message || 'Failed to export contracts');
    }
  };

  const handleDocumentUpload = ({ fileList }) => {
    setUploadedDocuments(fileList);
  };

  const getDaysUntilExpiry = (endDate) => {
    return contractApiService.calculateDaysUntilExpiry(endDate);
  };

  const columns = [
    {
      title: 'Contract Details',
      key: 'contract',
      render: (_, record) => (
        <div>
          <Text strong>{record.title}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.contractNumber}
          </Text>
          <br />
          <Tag size="small" color="blue">{record.type}</Tag>
          <Tag size="small" color="purple">{record.category}</Tag>
        </div>
      ),
      width: 250
    },
    {
      title: 'Supplier',
      key: 'supplier',
      render: (_, record) => (
        <div>
          <Text strong>{record.supplier?.supplierName || 'N/A'}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.supplier?.contactPerson || ''}
          </Text>
        </div>
      ),
      width: 180
    },
    {
      title: 'Value',
      key: 'value',
      render: (_, record) => (
        <div>
          <Text strong style={{ color: '#1890ff' }}>
            {contractApiService.formatCurrency(
              record.financials?.totalValue || record.value || 0,
              record.financials?.currency || record.currency || 'XAF'
            )}
          </Text>
        </div>
      ),
      width: 130,
      align: 'right'
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => getStatusTag(status),
      width: 140
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority) => getPriorityTag(priority),
      width: 100
    },
    {
      title: 'Contract Period',
      key: 'period',
      render: (_, record) => {
        const startDate = record.dates?.startDate || record.startDate;
        const endDate = record.dates?.endDate || record.endDate;
        const daysLeft = getDaysUntilExpiry(endDate);
        
        return (
          <div>
            <div>
              <CalendarOutlined /> {moment(startDate).format('DD/MM/YYYY')}
            </div>
            <div>
              <CalendarOutlined /> {moment(endDate).format('DD/MM/YYYY')}
            </div>
            <div>
              <Text type="secondary">
                {daysLeft >= 0 
                  ? `${daysLeft} days left`
                  : 'Expired'
                }
              </Text>
            </div>
          </div>
        );
      },
      width: 150
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button 
            size="small" 
            icon={<EyeOutlined />} 
            onClick={() => handleViewDetails(record)}
          >
            View
          </Button>
          <Button 
            size="small" 
            icon={<EditOutlined />}
            onClick={() => handleEditContract(record)}
          >
            Edit
          </Button>
          {(record.renewal?.isRenewable || record.renewalOption) && (
            <Button 
              size="small" 
              icon={<ReloadOutlined />}
              onClick={() => handleRenewContract(record)}
            >
              Renew
            </Button>
          )}
        </Space>
      ),
      width: 180,
      fixed: 'right'
    }
  ];

  const getFilteredContracts = () => {
    switch (activeTab) {
      case 'active':
        return contracts.filter(contract => contract.status === 'active');
      case 'expiring_soon':
        return contracts.filter(contract => contract.status === 'expiring_soon');
      case 'expired':
        return contracts.filter(contract => contract.status === 'expired');
      case 'draft':
        return contracts.filter(contract => contract.status === 'draft');
      case 'pending_approval':
        return contracts.filter(contract => contract.status === 'pending_approval');
      default:
        return contracts;
    }
  };

  const stats = {
    total: statistics.total || 0,
    active: statistics.active || 0,
    expiringSoon: statistics.expiringSoon || 0,
    expired: statistics.expired || 0,
    draft: statistics.draft || 0,
    pendingApproval: statistics.pendingApproval || 0
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: (selectedRowKeys) => {
      setSelectedRowKeys(selectedRowKeys);
    },
  };

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <Title level={2} style={{ margin: 0 }}>
            <FileTextOutlined /> Contract Management
          </Title>
          <Space>
            <Button 
              icon={<ReloadOutlined />}
              onClick={fetchContracts}
              loading={loading}
            >
              Refresh
            </Button>
            <Button 
              icon={<ExportOutlined />}
              onClick={handleExportContracts}
            >
              Export
            </Button>
            <Button 
              type="primary" 
              icon={<PlusOutlined />} 
              onClick={handleAddContract}
            >
              Add New Contract
            </Button>
          </Space>
        </div>

        {/* Statistics */}
        <Row gutter={16} style={{ marginBottom: '24px' }}>
          <Col span={4}>
            <Statistic
              title="Total Contracts"
              value={stats.total}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Col>
          <Col span={4}>
            <Statistic
              title="Active Contracts"
              value={stats.active}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Col>
          <Col span={4}>
            <Statistic
              title="Expiring Soon"
              value={stats.expiringSoon}
              prefix={<WarningOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Col>
          <Col span={4}>
            <Statistic
              title="Expired"
              value={stats.expired}
              prefix={<ExclamationCircleOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Col>
          <Col span={4}>
            <Statistic
              title="Draft"
              value={stats.draft}
              prefix={<EditOutlined />}
              valueStyle={{ color: '#666' }}
            />
          </Col>
          <Col span={4}>
            <Statistic
              title="Pending Approval"
              value={stats.pendingApproval}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Col>
        </Row>

        {/* Contracts Table */}
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane 
            tab={
              <Badge count={stats.total} size="small">
                <span>All Contracts ({stats.total})</span>
              </Badge>
            } 
            key="all"
          >
            <Table
              rowSelection={rowSelection}
              columns={columns}
              dataSource={getFilteredContracts()}
              rowKey="_id"
              loading={loading}
              pagination={{
                pageSize: 10,
                showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} contracts`
              }}
              scroll={{ x: 'max-content' }}
            />
          </TabPane>

          <TabPane 
            tab={
              <Badge count={stats.active} size="small">
                <span><CheckCircleOutlined /> Active ({stats.active})</span>
              </Badge>
            } 
            key="active"
          >
            <Table
              rowSelection={rowSelection}
              columns={columns}
              dataSource={getFilteredContracts()}
              rowKey="_id"
              loading={loading}
              pagination={false}
              scroll={{ x: 'max-content' }}
            />
          </TabPane>

          <TabPane 
            tab={
              <Badge count={stats.expiringSoon} size="small">
                <span><WarningOutlined /> Expiring Soon ({stats.expiringSoon})</span>
              </Badge>
            } 
            key="expiring_soon"
          >
            <Table
              rowSelection={rowSelection}
              columns={columns}
              dataSource={getFilteredContracts()}
              rowKey="_id"
              loading={loading}
              pagination={false}
              scroll={{ x: 'max-content' }}
            />
          </TabPane>

          <TabPane 
            tab={
              <span><ExclamationCircleOutlined /> Expired ({stats.expired})</span>
            } 
            key="expired"
          >
            <Table
              rowSelection={rowSelection}
              columns={columns}
              dataSource={getFilteredContracts()}
              rowKey="_id"
              loading={loading}
              pagination={false}
              scroll={{ x: 'max-content' }}
            />
          </TabPane>
        </Tabs>
      </Card>

      {/* Contract Modal */}
      <Modal
        title={selectedContract ? 'Edit Contract' : 'Add New Contract'}
        open={contractModalVisible}
        onCancel={() => {
          setContractModalVisible(false);
          form.resetFields();
          setUploadedDocuments([]);
        }}
        footer={null}
        width={1000}
        destroyOnClose
      >
        <Spin spinning={loading}>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmitContract}
          >
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="title"
                  label="Contract Title"
                  rules={[{ required: true, message: 'Please enter contract title' }]}
                >
                  <Input placeholder="IT Equipment Supply Agreement" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="type"
                  label="Contract Type"
                  rules={[{ required: true, message: 'Please select contract type' }]}
                >
                  <Select placeholder="Select contract type">
                    <Option value="Supply Agreement">Supply Agreement</Option>
                    <Option value="Service Agreement">Service Agreement</Option>
                    <Option value="Framework Agreement">Framework Agreement</Option>
                    <Option value="Purchase Order">Purchase Order</Option>
                    <Option value="Maintenance Contract">Maintenance Contract</Option>
                    <Option value="Consulting Agreement">Consulting Agreement</Option>
                    <Option value="Lease Agreement">Lease Agreement</Option>
                    <Option value="Other">Other</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="category"
                  label="Category"
                  rules={[{ required: true, message: 'Please select category' }]}
                >
                  <Select placeholder="Select category">
                    <Option value="IT Equipment">IT Equipment</Option>
                    <Option value="Office Supplies">Office Supplies</Option>
                    <Option value="Professional Services">Professional Services</Option>
                    <Option value="Maintenance">Maintenance</Option>
                    <Option value="Construction">Construction</Option>
                    <Option value="Energy & Environment">Energy & Environment</Option>
                    <Option value="Transportation">Transportation</Option>
                    <Option value="Healthcare">Healthcare</Option>
                    <Option value="Other">Other</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="priority"
                  label="Priority"
                  rules={[{ required: true, message: 'Please select priority' }]}
                >
                  <Select placeholder="Select priority">
                    <Option value="Low">Low</Option>
                    <Option value="Medium">Medium</Option>
                    <Option value="High">High</Option>
                    <Option value="Critical">Critical</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="description"
              label="Description"
              rules={[{ required: true, message: 'Please enter description' }]}
            >
              <TextArea 
                rows={3} 
                placeholder="Comprehensive agreement for supply of laptops, monitors, and IT accessories"
              />
            </Form.Item>

            {/* <Form.Item
              name="supplierId"
              label="Supplier"
              rules={[{ required: true, message: 'Please select supplier' }]}
            >
              <Select 
                placeholder="Select supplier"
                showSearch
                filterOption={(input, option) =>
                  option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                }
              >
                {suppliers.map(supplier => (
                  <Option key={supplier._id} value={supplier._id}>
                    {supplier.supplierDetails?.companyName} - {supplier.supplierDetails?.supplierType}
                  </Option>
                ))}
              </Select>
            </Form.Item> */}

            <Form.Item
              name="supplierId"
              label="Supplier"
              rules={[{ required: true, message: 'Please select supplier' }]}
            >
              <Select 
                placeholder="Select supplier"
                showSearch
                onChange={(value) => setSelectedSupplierId(value)} // FIX: Add onChange handler
                filterOption={(input, option) =>
                  option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                }
              >
                {suppliers.map(supplier => (
                  <Option key={supplier._id} value={supplier._id}>
                    {supplier.supplierDetails?.companyName} - {supplier.supplierDetails?.supplierType}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            {/* FIX: Add button to view supplier profile */}
            <Button 
              type="link"
              onClick={() => {
                if (selectedSupplierId) {
                  navigate(`/supply-chain/suppliers/${selectedSupplierId}/profile`);
                }
              }}
              disabled={!selectedSupplierId}
            >
              View Supplier Profile
            </Button>

            <Row gutter={16}>
              <Col span={8}>
                <Form.Item
                  name="totalValue"
                  label="Contract Value"
                  rules={[{ required: true, message: 'Please enter contract value' }]}
                >
                  <InputNumber 
                    style={{ width: '100%' }}
                    placeholder="25000000"
                    min={0}
                    formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={value => value.replace(/\$\s?|(,*)/g, '')}
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="currency"
                  label="Currency"
                  rules={[{ required: true, message: 'Please select currency' }]}
                >
                  <Select placeholder="XAF">
                    <Option value="XAF">XAF</Option>
                    <Option value="USD">USD</Option>
                    <Option value="EUR">EUR</Option>
                    <Option value="GBP">GBP</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="paymentTerms"
                  label="Payment Terms"
                  rules={[{ required: true, message: 'Please select payment terms' }]}
                >
                  <Select placeholder="30 days NET">
                    <Option value="15 days NET">15 days NET</Option>
                    <Option value="30 days NET">30 days NET</Option>
                    <Option value="45 days NET">45 days NET</Option>
                    <Option value="60 days NET">60 days NET</Option>
                    <Option value="Cash on Delivery">Cash on Delivery</Option>
                    <Option value="Advance Payment">Advance Payment</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="dateRange"
                  label="Contract Period"
                  rules={[{ required: true, message: 'Please select contract period' }]}
                >
                  <RangePicker style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="deliveryTerms"
                  label="Delivery Terms"
                  rules={[{ required: true, message: 'Please enter delivery terms' }]}
                >
                  <Input placeholder="FOB Destination" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="isRenewable"
                  valuePropName="checked"
                >
                  <Checkbox>Contract is renewable</Checkbox>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="autoRenewal"
                  valuePropName="checked"
                >
                  <Checkbox>Enable auto-renewal</Checkbox>
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="internalNotes"
              label="Internal Notes"
            >
              <TextArea 
                rows={2} 
                placeholder="Internal notes for contract management..."
              />
            </Form.Item>

            <Form.Item label="Contract Documents">
              <Dragger
                multiple
                fileList={uploadedDocuments}
                onChange={handleDocumentUpload}
                beforeUpload={() => false}
                accept=".pdf,.doc,.docx,.jpg,.png"
              >
                <p className="ant-upload-drag-icon">
                  <InboxOutlined />
                </p>
                <p className="ant-upload-text">Click or drag files to this area to upload</p>
                <p className="ant-upload-hint">
                  Support for contract documents, agreements, and related files
                </p>
              </Dragger>
            </Form.Item>

            <div style={{ textAlign: 'right' }}>
              <Space>
                <Button onClick={() => setContractModalVisible(false)}>
                  Cancel
                </Button>
                <Button type="primary" htmlType="submit" loading={loading}>
                  {selectedContract ? 'Update Contract' : 'Create Contract'}
                </Button>
              </Space>
            </div>
          </Form>
        </Spin>
      </Modal>

      {/* Renewal Modal */}
      <Modal
        title="Renew Contract"
        open={renewalModalVisible}
        onCancel={() => {
          setRenewalModalVisible(false);
          renewalForm.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Spin spinning={loading}>
          <Form
            form={renewalForm}
            layout="vertical"
            onFinish={handleSubmitRenewal}
          >
            <Form.Item
              name="renewalType"
              label="Renewal Type"
              rules={[{ required: true, message: 'Please select renewal type' }]}
            >
              <Select placeholder="Select renewal type">
                <Option value="standard">Standard Renewal</Option>
                <Option value="modified">Modified Terms</Option>
                <Option value="extension">Simple Extension</Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="newEndDate"
              label="New End Date"
              rules={[{ required: true, message: 'Please select new end date' }]}
            >
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item
              name="notes"
              label="Renewal Notes"
            >
              <TextArea rows={3} placeholder="Notes about the renewal..." />
            </Form.Item>

            <div style={{ textAlign: 'right' }}>
              <Space>
                <Button onClick={() => setRenewalModalVisible(false)}>
                  Cancel
                </Button>
                <Button type="primary" htmlType="submit" loading={loading}>
                  Renew Contract
                </Button>
              </Space>
            </div>
          </Form>
        </Spin>
      </Modal>

      {/* Amendment Modal */}
      <Modal
        title="Create Contract Amendment"
        open={amendmentModalVisible}
        onCancel={() => {
          setAmendmentModalVisible(false);
          amendmentForm.resetFields();
          setUploadedDocuments([]);
        }}
        footer={null}
        width={700}
      >
        <Spin spinning={loading}>
          <Form
            form={amendmentForm}
            layout="vertical"
            onFinish={handleSubmitAmendment}
          >
            <Form.Item
              name="type"
              label="Amendment Type"
              rules={[{ required: true, message: 'Please select amendment type' }]}
            >
              <Select placeholder="Select amendment type">
                <Option value="Price Adjustment">Price Adjustment</Option>
                <Option value="Scope Change">Scope Change</Option>
                <Option value="Term Extension">Term Extension</Option>
                <Option value="Performance Modification">Performance Modification</Option>
                <Option value="Compliance Update">Compliance Update</Option>
                <Option value="General Amendment">General Amendment</Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="description"
              label="Description"
              rules={[{ required: true, message: 'Please enter description' }]}
            >
              <TextArea rows={3} placeholder="Describe the amendment..." />
            </Form.Item>

            <Form.Item
              name="effectiveDate"
              label="Effective Date"
              rules={[{ required: true, message: 'Please select effective date' }]}
            >
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name={['financialImpact', 'amount']}
                  label="Financial Impact (XAF)"
                >
                  <InputNumber 
                    style={{ width: '100%' }}
                    placeholder="0"
                    min={0}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name={['financialImpact', 'type']}
                  label="Impact Type"
                >
                  <Select placeholder="Select type">
                    <Option value="increase">Increase</Option>
                    <Option value="decrease">Decrease</Option>
                    <Option value="neutral">No Change</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Form.Item label="Amendment Documents">
              <Dragger
                multiple
                fileList={uploadedDocuments}
                onChange={handleDocumentUpload}
                beforeUpload={() => false}
                accept=".pdf,.doc,.docx"
              >
                <p className="ant-upload-drag-icon">
                  <InboxOutlined />
                </p>
                <p className="ant-upload-text">Upload amendment documents</p>
              </Dragger>
            </Form.Item>

            <div style={{ textAlign: 'right' }}>
              <Space>
                <Button onClick={() => setAmendmentModalVisible(false)}>
                  Cancel
                </Button>
                <Button type="primary" htmlType="submit" loading={loading}>
                  Create Amendment
                </Button>
              </Space>
            </div>
          </Form>
        </Spin>
      </Modal>

      {/* Milestone Modal */}
      <Modal
        title="Add Contract Milestone"
        open={milestoneModalVisible}
        onCancel={() => {
          setMilestoneModalVisible(false);
          milestoneForm.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Spin spinning={loading}>
          <Form
            form={milestoneForm}
            layout="vertical"
            onFinish={handleSubmitMilestone}
          >
            <Form.Item
              name="name"
              label="Milestone Name"
              rules={[{ required: true, message: 'Please enter milestone name' }]}
            >
              <Input placeholder="Contract Signing" />
            </Form.Item>

            <Form.Item
              name="description"
              label="Description"
            >
              <TextArea rows={2} placeholder="Description of the milestone..." />
            </Form.Item>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="dueDate"
                  label="Due Date"
                  rules={[{ required: true, message: 'Please select due date' }]}
                >
                  <DatePicker style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="responsibleParty"
                  label="Responsible Party"
                  rules={[{ required: true, message: 'Please select responsible party' }]}
                >
                  <Select placeholder="Select party">
                    <Option value="supplier">Supplier</Option>
                    <Option value="client">Client</Option>
                    <Option value="both">Both Parties</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="notes"
              label="Notes"
            >
              <TextArea rows={2} placeholder="Additional notes..." />
            </Form.Item>

            <div style={{ textAlign: 'right' }}>
              <Space>
                <Button onClick={() => setMilestoneModalVisible(false)}>
                  Cancel
                </Button>
                <Button type="primary" htmlType="submit" loading={loading}>
                  Add Milestone
                </Button>
              </Space>
            </div>
          </Form>
        </Spin>
      </Modal>

      {/* Detail Drawer - This would contain the same detailed view as in your original code */}
      <Drawer
        title={
          <Space>
            <ContainerOutlined />
            Contract Details
          </Space>
        }
        placement="right"
        width={900}
        open={detailDrawerVisible}
        onClose={() => {
          setDetailDrawerVisible(false);
          setSelectedContract(null);
        }}
      >
        {selectedContract && (
          <div>
            {/* Contract overview and all the detailed sections from your original component */}
            <Card size="small" title="Contract Overview" style={{ marginBottom: '16px' }}>
              <Descriptions column={2} size="small">
                <Descriptions.Item label="Contract Number">
                  <Text code>{selectedContract.contractNumber}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Title">
                  <Text strong>{selectedContract.title}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Status">
                  {getStatusTag(selectedContract.status)}
                </Descriptions.Item>
                <Descriptions.Item label="Priority">
                  {getPriorityTag(selectedContract.priority)}
                </Descriptions.Item>
                <Descriptions.Item label="Value">
                  <Text strong style={{ color: '#1890ff' }}>
                    {contractApiService.formatCurrency(
                      selectedContract.financials?.totalValue || 0,
                      selectedContract.financials?.currency || 'XAF'
                    )}
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="Department">
                  {selectedContract.management?.department}
                </Descriptions.Item>
              </Descriptions>
            </Card>

            {/* Action Buttons */}
            <Card size="small" title="Contract Actions">
              <Space wrap>
                <Button 
                  type="primary" 
                  icon={<EditOutlined />}
                  onClick={() => {
                    setDetailDrawerVisible(false);
                    handleEditContract(selectedContract);
                  }}
                >
                  Edit Contract
                </Button>
                
                {selectedContract.renewal?.isRenewable && (
                  <Button 
                    icon={<ReloadOutlined />}
                    onClick={() => {
                      setDetailDrawerVisible(false);
                      handleRenewContract(selectedContract);
                    }}
                  >
                    Renew Contract
                  </Button>
                )}
                
                <Button 
                  icon={<AuditOutlined />}
                  onClick={() => {
                    setDetailDrawerVisible(false);
                    handleAmendContract(selectedContract);
                  }}
                >
                  Create Amendment
                </Button>
                
                <Button 
                  icon={<CalendarOutlined />}
                  onClick={() => {
                    setDetailDrawerVisible(false);
                    handleAddMilestone(selectedContract);
                  }}
                >
                  Add Milestone
                </Button>
                
                <Button 
                  icon={<DownloadOutlined />}
                  onClick={handleExportContracts}
                >
                  Download Contract
                </Button>
                
                {selectedContract.status === 'active' && (
                  <Button 
                    danger
                    icon={<ExclamationCircleOutlined />}
                    onClick={() => handleUpdateContractStatus(selectedContract._id, 'terminated', 'Manual termination')}
                  >
                    Terminate Contract
                  </Button>
                )}
              </Space>
            </Card>
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default SupplyChainContractManagement;


