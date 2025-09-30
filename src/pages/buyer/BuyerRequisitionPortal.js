import React, { useState, useEffect } from 'react';
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
  InputNumber,
  Tabs,
  Badge,
  Drawer,
  message,
  Alert,
  Divider,
  Tooltip,
  Steps,
  Checkbox,
  Rate,
  Timeline,
  Avatar,
  List,
  Upload,
  Spin
} from 'antd';
import {
  ShoppingCartOutlined,
  EyeOutlined,
  SendOutlined,
  UserOutlined,
  DollarOutlined,
  CalendarOutlined,
  FileTextOutlined,
  StarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  MailOutlined,
  SettingOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  TeamOutlined,
  TruckOutlined,
  BankOutlined,
  BarChartOutlined,
  FilterOutlined,
  ExportOutlined,
  PhoneOutlined,
  GlobalOutlined,
  SafetyCertificateOutlined,
  TagOutlined,
  CopyOutlined,
  UploadOutlined,
  DownloadOutlined,
  ExclamationCircleOutlined,
  SolutionOutlined
} from '@ant-design/icons';
import moment from 'moment';
import { buyerRequisitionAPI } from '../../services/buyerRequisitionAPI';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const { Step } = Steps;

const BuyerRequisitionPortal = () => {
  const [requisitions, setRequisitions] = useState([]);
  const [selectedRequisition, setSelectedRequisition] = useState(null);
  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false);
  const [sourcingDrawerVisible, setSourcingDrawerVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suppliers, setSuppliers] = useState([]);
  const [selectedSuppliers, setSelectedSuppliers] = useState([]);
  const [externalSupplierEmails, setExternalSupplierEmails] = useState([]);
  const [emailInput, setEmailInput] = useState('');
  const [sourcingForm] = Form.useForm();
  const [activeTab, setActiveTab] = useState('pending');
  const [currentStep, setCurrentStep] = useState(0);

  // Load requisitions on component mount
  useEffect(() => {
    loadRequisitions();
  }, [activeTab]);

  const loadRequisitions = async () => {
    try {
      setLoading(true);
      
      // Map activeTab to API filter
      const statusFilter = {
        'pending': { sourcingStatus: 'pending_sourcing' },
        'in_progress': { sourcingStatus: 'in_progress' },
        'quoted': { sourcingStatus: 'quotes_received' },
        'completed': { sourcingStatus: 'completed' },
        'all': {}
      };

      const filters = statusFilter[activeTab] || {};
      console.log('Loading requisitions with filters:', filters);
      
      const response = await buyerRequisitionAPI.getAssignedRequisitions(filters);
      
      if (response.success) {
        setRequisitions(response.data || []);
        console.log('Loaded requisitions:', response.data?.length || 0);
      } else {
        message.error(response.message || 'Failed to load requisitions');
      }
    } catch (error) {
      console.error('Error loading requisitions:', error);
      message.error(error.message || 'Error loading requisitions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadSuppliers = async (category) => {
    if (!category) {
      message.warning('No category specified for supplier search');
      return;
    }

    try {
      setLoading(true);
      console.log('Loading suppliers for category:', category);
      
      const response = await buyerRequisitionAPI.getSuppliersByCategory(category);
      
      if (response.success) {
        setSuppliers(response.data || []);
        console.log('Loaded suppliers:', response.data?.length || 0);
      } else {
        message.error(response.message || 'Failed to load suppliers');
        setSuppliers([]);
      }
    } catch (error) {
      console.error('Error loading suppliers:', error);
      message.error(error.message || 'Error loading suppliers. Please try again.');
      setSuppliers([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter requisitions by status
  const getFilteredRequisitions = () => {
    return requisitions; // Already filtered by API call
  };

  const getStatusTag = (status) => {
    const statusMap = {
      'pending_sourcing': { color: 'orange', text: 'Pending Sourcing' },
      'in_progress': { color: 'blue', text: 'Sourcing in Progress' },
      'quotes_received': { color: 'purple', text: 'Quotes Received' },
      'completed': { color: 'green', text: 'Completed' }
    };
    const statusInfo = statusMap[status] || { color: 'default', text: status };
    return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>;
  };

  const getUrgencyTag = (urgency) => {
    const urgencyMap = {
      'Low': 'green',
      'Medium': 'orange',
      'High': 'red',
      'Urgent': 'volcano'
    };
    return <Tag color={urgencyMap[urgency] || 'default'}>{urgency}</Tag>;
  };

  const handleViewDetails = async (requisition) => {
    try {
      setLoading(true);
      console.log('Loading details for requisition:', requisition.id);
      
      const response = await buyerRequisitionAPI.getRequisitionDetails(requisition.id);
      
      if (response.success) {
        setSelectedRequisition(response.data);
        setDetailDrawerVisible(true);
      } else {
        message.error(response.message || 'Failed to load requisition details');
      }
    } catch (error) {
      console.error('Error loading requisition details:', error);
      message.error(error.message || 'Error loading requisition details');
    } finally {
      setLoading(false);
    }
  };

  const handleStartSourcing = async (requisition) => {
    try {
      console.log('Starting sourcing for requisition:', requisition);
      
      setSelectedRequisition(requisition);
      
      // Load suppliers for this category
      await loadSuppliers(requisition.category);
      
      setSelectedSuppliers([]);
      sourcingForm.resetFields();
      
      // Set default form values
      sourcingForm.setFieldsValue({
        expectedDeliveryDate: requisition.expectedDeliveryDate ? moment(requisition.expectedDeliveryDate) : moment().add(14, 'days'),
        quotationDeadline: moment().add(5, 'days'),
        paymentTerms: '30 days',
        deliveryLocation: requisition.deliveryLocation || '',
        evaluationCriteria: {
          quality: 40,
          cost: 35,
          delivery: 25
        }
      });
      
      setCurrentStep(0);
      setSourcingDrawerVisible(true);
    } catch (error) {
      console.error('Error starting sourcing:', error);
      message.error('Failed to initialize sourcing process');
    }
  };

  const handleSupplierSelection = (supplierId, checked) => {
    console.log('Supplier selection changed:', { supplierId, checked });
    
    if (checked) {
      setSelectedSuppliers(prev => [...prev, supplierId]);
    } else {
      setSelectedSuppliers(prev => prev.filter(id => id !== supplierId));
    }
  };

  const handleAddExternalSupplier = () => {
    const email = emailInput.trim();
    if (!email) {
      message.error('Please enter an email address');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      message.error('Please enter a valid email address');
      return;
    }

    if (externalSupplierEmails.includes(email)) {
      message.error('This email has already been added');
      return;
    }

    setExternalSupplierEmails(prev => [...prev, email]);
    setEmailInput('');
    message.success('External supplier email added successfully');
  };

  const handleRemoveExternalSupplier = (email) => {
    setExternalSupplierEmails(prev => prev.filter(e => e !== email));
    message.success('External supplier email removed');
  };

  const validateSourcingForm = async () => {
    try {
      // Validate form fields
      await sourcingForm.validateFields();
      
      // Check supplier selection (either registered or external)
      if (selectedSuppliers.length === 0 && externalSupplierEmails.length === 0) {
        throw new Error('Please select at least one registered supplier or add at least one external supplier email');
      }
  
      // Get form values for additional validation
      const expectedDeliveryDate = sourcingForm.getFieldValue('expectedDeliveryDate');
      const quotationDeadline = sourcingForm.getFieldValue('quotationDeadline');
  
      // Validate dates are present (Ant Design should handle this with rules, but double-check)
      if (!expectedDeliveryDate) {
        throw new Error('Expected delivery date is required');
      }
  
      if (!quotationDeadline) {
        throw new Error('Quotation deadline is required');
      }
  
      // Validate date logic
      if (quotationDeadline.isAfter(expectedDeliveryDate)) {
        throw new Error('Quotation deadline must be before expected delivery date');
      }
  
      // Validate evaluation criteria weights
      const criteria = sourcingForm.getFieldValue('evaluationCriteria');
      if (criteria) {
        const quality = criteria.quality || 0;
        const cost = criteria.cost || 0;
        const delivery = criteria.delivery || 0;
        const totalWeight = quality + cost + delivery;
        
        if (totalWeight !== 100) {
          throw new Error(`Evaluation criteria weights must total 100% (currently: ${totalWeight}%)`);
        }
      }
  
      return true;
    } catch (error) {
      if (error.errorFields) {
        // Form validation errors from Ant Design
        const firstError = error.errorFields[0];
        message.error(`Please fix: ${firstError.errors[0]}`);
      } else {
        // Custom validation errors
        message.error(error.message);
      }
      return false;
    }
  };

  const handleSubmitSourcing = async () => {
    try {
      console.log('Submitting sourcing request...');
      
      // Validate form and selections
      const isValid = await validateSourcingForm();
      if (!isValid) return;
  
      setLoading(true);
  
      // Get form values - use getFieldsValue(true) to get all values including nested ones
      const formValues = sourcingForm.getFieldsValue(true);
      console.log('Form values:', formValues);
  
      // Additional validation to check if dates are actually present
      const expectedDeliveryDate = sourcingForm.getFieldValue('expectedDeliveryDate');
      const quotationDeadline = sourcingForm.getFieldValue('quotationDeadline');
      
      console.log('Expected delivery date:', expectedDeliveryDate);
      console.log('Quotation deadline:', quotationDeadline);
  
      // Validate that required dates are present
      if (!expectedDeliveryDate) {
        message.error('Expected delivery date is required');
        setLoading(false);
        return;
      }
  
      if (!quotationDeadline) {
        message.error('Quotation deadline is required');
        setLoading(false);
        return;
      }
  
      // Prepare RFQ data with proper date formatting
      const rfqData = {
        selectedSuppliers: selectedSuppliers,
        externalSupplierEmails: externalSupplierEmails,
        expectedDeliveryDate: expectedDeliveryDate ? expectedDeliveryDate.toISOString() : null,
        quotationDeadline: quotationDeadline ? quotationDeadline.toISOString() : null,
        paymentTerms: formValues.paymentTerms || '30 days',
        deliveryLocation: formValues.deliveryLocation || selectedRequisition.deliveryLocation,
        specialRequirements: formValues.specialRequirements || '',
        evaluationCriteria: formValues.evaluationCriteria || { quality: 40, cost: 35, delivery: 25 }
      };
  
      console.log('Prepared RFQ data:', rfqData);
  
      // Additional check after preparing RFQ data
      if (!rfqData.expectedDeliveryDate) {
        message.error('Expected delivery date is required');
        setLoading(false);
        return;
      }
  
      if (!rfqData.quotationDeadline) {
        message.error('Quotation deadline is required');
        setLoading(false);
        return;
      }
  
      // Validate RFQ data
      const validation = buyerRequisitionAPI.validateRFQData(rfqData);
      
      if (!validation.isValid) {
        validation.errors.forEach(error => message.error(error));
        setLoading(false);
        return;
      }
  
      // Show warnings if any
      validation.warnings.forEach(warning => message.warning(warning));
  
      // Submit RFQ to API
      console.log('Sending RFQ for requisition:', selectedRequisition.id);
      const response = await buyerRequisitionAPI.createAndSendRFQ(selectedRequisition.id, rfqData);
  
      console.log('RFQ response:', response);
  
      if (response.success) {
        const totalRecipients = selectedSuppliers.length + externalSupplierEmails.length;
        message.success(`Sourcing request sent to ${totalRecipients} supplier(s) successfully! (${selectedSuppliers.length} registered, ${externalSupplierEmails.length} external)`);
        
        // Close drawer and reset state
        setSourcingDrawerVisible(false);
        setCurrentStep(0);
        setSelectedSuppliers([]);
        setExternalSupplierEmails([]);
        setEmailInput('');
        setSelectedRequisition(null);
        
        // Reload requisitions to show updated status
        await loadRequisitions();
      } else {
        message.error(response.message || 'Failed to submit sourcing request');
      }
  
    } catch (error) {
      console.error('Error submitting sourcing:', error);
      message.error(error.message || 'Failed to submit sourcing request');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'Requisition Details',
      key: 'details',
      render: (_, record) => (
        <div>
          <Text strong>{record.title}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.id}
          </Text>
          <br />
          <Tag size="small" color="blue">{record.category}</Tag>
        </div>
      ),
      width: 200
    },
    {
      title: 'Requester',
      key: 'requester',
      render: (_, record) => (
        <div>
          <Text strong>{record.requester}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.department}
          </Text>
        </div>
      ),
      width: 150
    },
    {
      title: 'Budget',
      key: 'budget',
      render: (_, record) => (
        <Text strong style={{ color: '#1890ff' }}>
          XAF {record.budget?.toLocaleString()}
        </Text>
      ),
      width: 120
    },
    {
      title: 'Items',
      dataIndex: 'items',
      key: 'items',
      render: (items) => Array.isArray(items) ? items.length : 0,
      align: 'center',
      width: 80
    },
    {
      title: 'Expected Delivery',
      key: 'delivery',
      render: (_, record) => {
        const deliveryDate = record.expectedDeliveryDate;
        if (!deliveryDate) return 'Not specified';
        
        const isOverdue = moment(deliveryDate).isBefore(moment());
        return (
          <div>
            <CalendarOutlined /> {moment(deliveryDate).format('MMM DD, YYYY')}
            <br />
            <Text type={isOverdue ? "danger" : "secondary"} style={{ fontSize: '11px' }}>
              {moment(deliveryDate).fromNow()}
            </Text>
            {isOverdue && <ExclamationCircleOutlined style={{ color: '#ff4d4f', marginLeft: 4 }} />}
          </div>
        );
      },
      width: 130
    },
    {
      title: 'Urgency',
      dataIndex: 'urgency',
      key: 'urgency',
      render: (urgency) => getUrgencyTag(urgency),
      width: 100
    },
    {
      title: 'Sourcing Status',
      dataIndex: 'sourcingStatus',
      key: 'sourcingStatus',
      render: (status) => getStatusTag(status),
      width: 150
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
          {record.sourcingStatus === 'pending_sourcing' && (
            <Tooltip title="Start Sourcing">
              <Button 
                size="small" 
                type="primary"
                icon={<ShoppingCartOutlined />}
                onClick={() => handleStartSourcing(record)}
              >
                Source
              </Button>
            </Tooltip>
          )}
          {record.sourcingStatus === 'in_progress' && (
            <Tooltip title="Manage Sourcing">
              <Button 
                size="small" 
                type="primary"
                ghost
                icon={<SettingOutlined />}
                onClick={() => handleStartSourcing(record)}
              >
                Manage
              </Button>
            </Tooltip>
          )}
        </Space>
      ),
      width: 120,
      fixed: 'right'
    }
  ];

  const stats = {
    pending: requisitions.filter(req => req.sourcingStatus === 'pending_sourcing').length,
    inProgress: requisitions.filter(req => req.sourcingStatus === 'in_progress').length,
    quoted: requisitions.filter(req => req.sourcingStatus === 'quotes_received').length,
    completed: requisitions.filter(req => req.sourcingStatus === 'completed').length
  };

  const renderSupplierCard = (supplier) => (
    <Card 
      key={supplier.id}
      size="small" 
      style={{ 
        marginBottom: '12px',
        border: selectedSuppliers.includes(supplier.id) ? '2px solid #1890ff' : '1px solid #d9d9d9'
      }}
      bodyStyle={{ padding: '16px' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
            <Checkbox
              checked={selectedSuppliers.includes(supplier.id)}
              onChange={(e) => handleSupplierSelection(supplier.id, e.target.checked)}
              style={{ marginRight: '12px' }}
            />
            <div>
              <Text strong style={{ fontSize: '16px' }}>{supplier.name}</Text>
              <div style={{ marginTop: '4px' }}>
                <Rate disabled defaultValue={supplier.rating} style={{ fontSize: '12px' }} />
                <Text type="secondary" style={{ marginLeft: '8px', fontSize: '12px' }}>
                  {supplier.rating}/5.0
                </Text>
              </div>
            </div>
          </div>
          
          <Row gutter={[16, 8]}>
            <Col span={12}>
              <Text type="secondary" style={{ fontSize: '12px' }}>Contact:</Text>
              <br />
              <Text style={{ fontSize: '12px' }}>
                <MailOutlined /> {supplier.email}
              </Text>
              <br />
              <Text style={{ fontSize: '12px' }}>
                <PhoneOutlined /> {supplier.phone}
              </Text>
            </Col>
            <Col span={12}>
              <Text type="secondary" style={{ fontSize: '12px' }}>Location & Website:</Text>
              <br />
              <Text style={{ fontSize: '12px' }}>
                {typeof supplier.address === 'string' ? supplier.address : 
                 supplier.address ? `${supplier.address.street || ''}, ${supplier.address.city || ''}, ${supplier.address.state || ''} ${supplier.address.postalCode || ''}, ${supplier.address.country || ''}`.replace(/^,\s*|,\s*$/g, '').replace(/,\s*,/g, ',') : 
                 'Address not available'}
              </Text>
              {/* <Text style={{ fontSize: '12px' }}>{supplier.address}</Text> */}
              <br />
              <Text style={{ fontSize: '12px' }}>
                <GlobalOutlined /> {supplier.website}
              </Text>
            </Col>
          </Row>
          
          <Divider style={{ margin: '12px 0' }} />
          
          <Row gutter={[16, 8]}>
            <Col span={8}>
              <Text type="secondary" style={{ fontSize: '11px' }}>Reliability:</Text>
              <br />
              <Tag color={supplier.reliability === 'Excellent' ? 'green' : supplier.reliability === 'Good' ? 'blue' : 'orange'}>
                {supplier.reliability}
              </Tag>
            </Col>
            <Col span={8}>
              <Text type="secondary" style={{ fontSize: '11px' }}>Price Level:</Text>
              <br />
              <Tag color={supplier.priceCompetitiveness === 'High' ? 'green' : supplier.priceCompetitiveness === 'Medium' ? 'blue' : 'orange'}>
                {supplier.priceCompetitiveness}
              </Tag>
            </Col>
            <Col span={8}>
              <Text type="secondary" style={{ fontSize: '11px' }}>Delivery:</Text>
              <br />
              <Text style={{ fontSize: '11px' }}>{supplier.deliveryCapacity}</Text>
            </Col>
          </Row>
          
          <div style={{ marginTop: '8px' }}>
            <Text type="secondary" style={{ fontSize: '11px' }}>Specializations:</Text>
            <br />
            <Space wrap size="small" style={{ marginTop: '4px' }}>
              {supplier.specialization?.map(spec => (
                <Tag key={spec} size="small" color="purple">{spec}</Tag>
              ))}
            </Space>
          </div>
          
          <div style={{ marginTop: '8px' }}>
            <Text type="secondary" style={{ fontSize: '11px' }}>Certifications:</Text>
            <br />
            <Space wrap size="small" style={{ marginTop: '4px' }}>
              {supplier.certifications?.map(cert => (
                <Tag key={cert} size="small" color="gold" icon={<SafetyCertificateOutlined />}>
                  {cert}
                </Tag>
              ))}
            </Space>
          </div>
          
          <div style={{ marginTop: '8px' }}>
            <Text type="secondary" style={{ fontSize: '11px' }}>
              Last Transaction: {moment(supplier.lastTransaction).format('MMM DD, YYYY')}
            </Text>
          </div>
        </div>
      </div>
    </Card>
  );

  const sourcingSteps = [
    {
      title: 'Supplier Selection',
      description: 'Choose suppliers to invite for quotation'
    },
    {
      title: 'Sourcing Criteria',
      description: 'Set evaluation criteria and requirements'
    },
    {
      title: 'Review & Submit',
      description: 'Review details and send to suppliers'
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <Title level={2} style={{ margin: 0 }}>
            <ShoppingCartOutlined /> Buyer - Purchase Requisition Management
          </Title>
          <Space>
            <Button icon={<ExportOutlined />}>
              Export Report
            </Button>
            <Button icon={<FilterOutlined />}>
              Filters
            </Button>
          </Space>
        </div>

        {/* Statistics */}
        <Row gutter={16} style={{ marginBottom: '24px' }}>
          <Col span={6}>
            <Statistic
              title="Pending Sourcing"
              value={stats.pending}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="Sourcing in Progress"
              value={stats.inProgress}
              prefix={<ShoppingCartOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="Quotes Received"
              value={stats.quoted}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="Completed"
              value={stats.completed}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Col>
        </Row>

        {/* Alert for pending actions */}
        {stats.pending > 0 && (
          <Alert
            message={`${stats.pending} Requisition${stats.pending !== 1 ? 's' : ''} Awaiting Sourcing`}
            description="You have purchase requisitions that require sourcing attention. Start the procurement process to meet delivery deadlines."
            type="warning"
            showIcon
            action={
              <Button 
                size="small" 
                type="primary" 
                onClick={() => setActiveTab('pending')}
              >
                View Pending
              </Button>
            }
            style={{ marginBottom: '24px' }}
          />
        )}

        {/* Tabs */}
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <Tabs.TabPane 
            tab={
              <Badge count={stats.pending} size="small">
                <span><ClockCircleOutlined /> Pending Sourcing ({stats.pending})</span>
              </Badge>
            } 
            key="pending"
          />
          <Tabs.TabPane 
            tab={
              <Badge count={stats.inProgress} size="small">
                <span><ShoppingCartOutlined /> In Progress ({stats.inProgress})</span>
              </Badge>
            } 
            key="in_progress"
          />
          <Tabs.TabPane 
            tab={
              <span><FileTextOutlined /> Quotes Received ({stats.quoted})</span>
            } 
            key="quoted"
          />
          <Tabs.TabPane 
            tab={
              <span><CheckCircleOutlined /> Completed ({stats.completed})</span>
            } 
            key="completed"
          />
          <Tabs.TabPane 
            tab={
              <span>All Requisitions</span>
            } 
            key="all"
          />
        </Tabs>

        <Table
          columns={columns}
          dataSource={getFilteredRequisitions()}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} requisitions`
          }}
          scroll={{ x: 'max-content' }}
        />
      </Card>

      {/* Requisition Details Drawer */}
      <Drawer
        title={
          <Space>
            <FileTextOutlined />
            Requisition Details
          </Space>
        }
        placement="right"
        width={800}
        open={detailDrawerVisible}
        onClose={() => {
          setDetailDrawerVisible(false);
          setSelectedRequisition(null);
        }}
      >
        {selectedRequisition && (
          <div>
            {/* Requisition Header */}
            <Card size="small" title="Requisition Information" style={{ marginBottom: '16px' }}>
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Text strong>Requisition ID:</Text>
                  <br />
                  <Text code>{selectedRequisition.id}</Text>
                </Col>
                <Col span={12}>
                  <Text strong>Title:</Text>
                  <br />
                  <Text>{selectedRequisition.title}</Text>
                </Col>
                <Col span={12}>
                  <Text strong>Requester:</Text>
                  <br />
                  <Avatar size="small" icon={<UserOutlined />} style={{ marginRight: 8 }} />
                  {selectedRequisition.requester}
                </Col>
                <Col span={12}>
                  <Text strong>Department:</Text>
                  <br />
                  <Text>{selectedRequisition.department}</Text>
                </Col>
                <Col span={12}>
                  <Text strong>Request Date:</Text>
                  <br />
                  <CalendarOutlined /> {moment(selectedRequisition.requestDate).format('MMM DD, YYYY')}
                </Col>
                <Col span={12}>
                  <Text strong>Expected Delivery:</Text>
                  <br />
                  <CalendarOutlined /> {selectedRequisition.expectedDeliveryDate ? 
                    moment(selectedRequisition.expectedDeliveryDate).format('MMM DD, YYYY') : 
                    'Not specified'
                  }
                </Col>
                <Col span={12}>
                  <Text strong>Budget:</Text>
                  <br />
                  <Text strong style={{ color: '#1890ff' }}>
                    <DollarOutlined /> XAF {selectedRequisition.budget?.toLocaleString() || 'Not specified'}
                  </Text>
                </Col>
                <Col span={12}>
                  <Text strong>Urgency:</Text>
                  <br />
                  {getUrgencyTag(selectedRequisition.urgency)}
                </Col>
                <Col span={12}>
                  <Text strong>Category:</Text>
                  <br />
                  <Tag color="blue">{selectedRequisition.category}</Tag>
                </Col>
                <Col span={12}>
                  <Text strong>Sourcing Status:</Text>
                  <br />
                  {getStatusTag(selectedRequisition.sourcingStatus)}
                </Col>
                <Col span={24}>
                  <Text strong>Delivery Location:</Text>
                  <br />
                  <TruckOutlined /> {selectedRequisition.deliveryLocation || 'Not specified'}
                </Col>
              </Row>
            </Card>

            {/* Items List */}
            <Card size="small" title="Items to Procure" style={{ marginBottom: '16px' }}>
              <Table
                columns={[
                  {
                    title: 'Description',
                    dataIndex: 'description',
                    key: 'description'
                  },
                  {
                    title: 'Quantity',
                    dataIndex: 'quantity',
                    key: 'quantity',
                    width: 80,
                    align: 'center'
                  },
                  {
                    title: 'Unit',
                    dataIndex: 'unit',
                    key: 'unit',
                    width: 80,
                    align: 'center'
                  },
                  {
                    title: 'Specifications',
                    dataIndex: 'specifications',
                    key: 'specifications'
                  }
                ]}
                dataSource={selectedRequisition.items || []}
                pagination={false}
                size="small"
                rowKey="id"
              />
            </Card>

            {/* Notes */}
            {selectedRequisition.notes && (
              <Card size="small" title="Additional Notes" style={{ marginBottom: '16px' }}>
                <Paragraph>{selectedRequisition.notes}</Paragraph>
              </Card>
            )}

            {/* Sourcing History */}
            {selectedRequisition.sourcingDetails && (
              <Card size="small" title="Sourcing History" style={{ marginBottom: '16px' }}>
                <Timeline>
                  <Timeline.Item color="blue">
                    <Text strong>Assignment to Buyer</Text>
                    <br />
                    <Text type="secondary">
                      {moment(selectedRequisition.assignmentDate).format('MMM DD, YYYY HH:mm')}
                    </Text>
                  </Timeline.Item>
                  <Timeline.Item color="orange">
                    <Text strong>Sourcing Initiated</Text>
                    <br />
                    <Text type="secondary">
                      {moment(selectedRequisition.sourcingDetails.submissionDate).format('MMM DD, YYYY HH:mm')}
                    </Text>
                    <br />
                    <Text style={{ fontSize: '12px' }}>
                      Sent to {selectedRequisition.sourcingDetails.selectedSuppliers?.length || 0} supplier(s)
                    </Text>
                  </Timeline.Item>
                  <Timeline.Item color="purple">
                    <Text strong>Expected Quote Response</Text>
                    <br />
                    <Text type="secondary">
                      {moment(selectedRequisition.sourcingDetails.expectedQuoteResponse).format('MMM DD, YYYY')}
                    </Text>
                  </Timeline.Item>
                </Timeline>
              </Card>
            )}

            {/* Action Buttons */}
            <Space style={{ marginTop: '16px' }}>
              {selectedRequisition.sourcingStatus === 'pending_sourcing' && (
                <Button 
                  type="primary" 
                  icon={<ShoppingCartOutlined />}
                  onClick={() => {
                    setDetailDrawerVisible(false);
                    handleStartSourcing(selectedRequisition);
                  }}
                >
                  Start Sourcing Process
                </Button>
              )}
              {selectedRequisition.sourcingStatus === 'in_progress' && (
                <Button 
                  type="primary" 
                  ghost
                  icon={<SettingOutlined />}
                  onClick={() => {
                    setDetailDrawerVisible(false);
                    handleStartSourcing(selectedRequisition);
                  }}
                >
                  Manage Sourcing
                </Button>
              )}
              <Button icon={<CopyOutlined />}>
                Copy Requisition ID
              </Button>
              <Button icon={<DownloadOutlined />}>
                Download PDF
              </Button>
            </Space>
          </div>
        )}
      </Drawer>

      {/* Sourcing Management Drawer */}
      <Drawer
        title={
          <Space>
            <ShoppingCartOutlined />
            Sourcing Management - {selectedRequisition?.title}
          </Space>
        }
        placement="right"
        width={1000}
        open={sourcingDrawerVisible}
        onClose={() => {
          setSourcingDrawerVisible(false);
          setSelectedRequisition(null);
          setCurrentStep(0);
        }}
        footer={
          <div style={{ textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setSourcingDrawerVisible(false)}>
                Cancel
              </Button>
              {currentStep > 0 && (
                <Button onClick={() => setCurrentStep(currentStep - 1)}>
                  Previous
                </Button>
              )}
              {currentStep < sourcingSteps.length - 1 ? (
                <Button 
                  type="primary" 
                  onClick={() => setCurrentStep(currentStep + 1)}
                  disabled={currentStep === 0 && selectedSuppliers.length === 0 && externalSupplierEmails.length === 0}
                >
                  Next
                </Button>
              ) : (
                <Button 
                  type="primary" 
                  icon={<SendOutlined />}
                  loading={loading}
                  onClick={handleSubmitSourcing}
                >
                  Send to Suppliers
                </Button>
              )}
            </Space>
          </div>
        }
      >
        {selectedRequisition && (
          <div>
            {/* Progress Steps */}
            <Steps current={currentStep} style={{ marginBottom: '32px' }}>
              {sourcingSteps.map((step, index) => (
                <Step key={index} title={step.title} description={step.description} />
              ))}
            </Steps>

            {/* Step 0: Supplier Selection */}
            {currentStep === 0 && (
              <div>
                <Card size="small" title="Available Suppliers" style={{ marginBottom: '16px' }}>
                  <Alert
                    message={`Found ${suppliers.length} supplier(s) for category: ${selectedRequisition.category}`}
                    description="Select suppliers you want to invite for quotation. The system automatically filtered suppliers based on the item category."
                    type="info"
                    showIcon
                    style={{ marginBottom: '16px' }}
                  />
                  
                  {loading ? (
                    <div style={{ textAlign: 'center', padding: '20px' }}>
                      <Spin size="large" />
                      <div style={{ marginTop: '16px' }}>Loading suppliers...</div>
                    </div>
                  ) : suppliers.length === 0 ? (
                    <Alert
                      message="No suppliers found"
                      description="No suppliers are registered for this category. Please contact the system administrator."
                      type="warning"
                      showIcon
                    />
                  ) : (
                    <div>
                      {suppliers.map(supplier => renderSupplierCard(supplier))}
                    </div>
                  )}
                </Card>

                <Card size="small" title="Selection Summary">
                  <Text strong>{selectedSuppliers.length}</Text> supplier(s) selected
                  {selectedSuppliers.length > 0 && (
                    <div style={{ marginTop: '8px' }}>
                      <Space wrap>
                        {selectedSuppliers.map(supplierId => {
                          const supplier = suppliers.find(s => s.id === supplierId);
                          return supplier ? (
                            <Tag key={supplierId} color="blue" closable onClose={() => handleSupplierSelection(supplierId, false)}>
                              {supplier.name}
                            </Tag>
                          ) : null;
                        })}
                      </Space>
                    </div>
                  )}
                </Card>

                <Card size="small" title="External Suppliers" style={{ marginBottom: '16px' }}>
                  <Alert
                    message="Add External Suppliers"
                    description="You can also send RFQs to suppliers who are not registered in our system by adding their email addresses."
                    type="info"
                    showIcon
                    style={{ marginBottom: '16px' }}
                  />
                  
                  <Space.Compact style={{ width: '100%', marginBottom: '16px' }}>
                    <Input 
                      placeholder="Enter supplier email address"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      onPressEnter={handleAddExternalSupplier}
                    />
                    <Button type="primary" icon={<PlusOutlined />} onClick={handleAddExternalSupplier}>
                      Add
                    </Button>
                  </Space.Compact>

                  {externalSupplierEmails.length > 0 && (
                    <div>
                      <Text strong style={{ display: 'block', marginBottom: '8px' }}>
                        External Suppliers ({externalSupplierEmails.length}):
                      </Text>
                      <Space wrap>
                        {externalSupplierEmails.map((email, index) => (
                          <Tag 
                            key={index} 
                            color="orange" 
                            closable 
                            onClose={() => handleRemoveExternalSupplier(email)}
                            icon={<MailOutlined />}
                          >
                            {email}
                          </Tag>
                        ))}
                      </Space>
                    </div>
                  )}
                </Card>
              </div>
            )}

            {/* Step 1: Sourcing Criteria */}
            {currentStep === 1 && (
              <Form form={sourcingForm} layout="vertical">
                <Card size="small" title="Sourcing Requirements" style={{ marginBottom: '16px' }}>
                  <Row gutter={[16, 16]}>
                    <Col span={12}>
                      <Form.Item
                        name="expectedDeliveryDate"
                        label="Expected Delivery Date"
                        rules={[{ required: true, message: 'Please select expected delivery date' }]}
                      >
                        <DatePicker 
                          style={{ width: '100%' }}
                          disabledDate={(current) => current && current < moment().add(1, 'day')}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name="quotationDeadline"
                        label="Quotation Response Deadline"
                        rules={[{ required: true, message: 'Please select quotation deadline' }]}
                      >
                        <DatePicker 
                          style={{ width: '100%' }}
                          disabledDate={(current) => current && current < moment().add(1, 'day')}
                        />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={[16, 16]}>
                    <Col span={12}>
                      <Form.Item
                        name="paymentTerms"
                        label="Payment Terms"
                        rules={[{ required: true, message: 'Please select payment terms' }]}
                      >
                        <Select placeholder="Select payment terms">
                          <Option value="15 days">15 days</Option>
                          <Option value="30 days">30 days</Option>
                          <Option value="45 days">45 days</Option>
                          <Option value="60 days">60 days</Option>
                          <Option value="Cash on delivery">Cash on delivery</Option>
                          <Option value="Advance payment">Advance payment</Option>
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name="deliveryLocation"
                        label="Delivery Location"
                        rules={[{ required: true, message: 'Please specify delivery location' }]}
                      >
                        <Input placeholder="Specify delivery location" />
                      </Form.Item>
                    </Col>
                  </Row>
                </Card>

                <Card size="small" title="Evaluation Criteria" style={{ marginBottom: '16px' }}>
                  <Alert
                    message="Evaluation Weights"
                    description="Set the importance weights for each evaluation criterion. Total must equal 100%."
                    type="info"
                    showIcon
                    style={{ marginBottom: '16px' }}
                  />
                  
                  <Row gutter={[16, 16]}>
                    <Col span={8}>
                      <Form.Item
                        name={['evaluationCriteria', 'quality']}
                        label="Quality Weight (%)"
                        rules={[{ required: true, message: 'Please set quality weight' }]}
                      >
                        <InputNumber 
                          min={0} 
                          max={100} 
                          style={{ width: '100%' }}
                          formatter={value => `${value}%`}
                          parser={value => value.replace('%', '')}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item
                        name={['evaluationCriteria', 'cost']}
                        label="Cost Weight (%)"
                        rules={[{ required: true, message: 'Please set cost weight' }]}
                      >
                        <InputNumber 
                          min={0} 
                          max={100} 
                          style={{ width: '100%' }}
                          formatter={value => `${value}%`}
                          parser={value => value.replace('%', '')}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item
                        name={['evaluationCriteria', 'delivery']}
                        label="Delivery Weight (%)"
                        rules={[{ required: true, message: 'Please set delivery weight' }]}
                      >
                        <InputNumber 
                          min={0} 
                          max={100} 
                          style={{ width: '100%' }}
                          formatter={value => `${value}%`}
                          parser={value => value.replace('%', '')}
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                </Card>

                <Card size="small" title="Additional Requirements" style={{ marginBottom: '16px' }}>
                  <Form.Item
                    name="specialRequirements"
                    label="Special Requirements or Instructions"
                  >
                    <TextArea 
                      rows={4}
                      placeholder="Enter any special requirements, technical specifications, quality standards, or delivery instructions..."
                      showCount
                      maxLength={1000}
                    />
                  </Form.Item>

                  <Form.Item
                    name="attachments"
                    label="Technical Specifications (Optional)"
                  >
                    <Upload.Dragger
                      multiple
                      beforeUpload={() => false}
                      accept=".pdf,.doc,.docx,.jpg,.png,.xlsx"
                    >
                      <p className="ant-upload-drag-icon">
                        <UploadOutlined />
                      </p>
                      <p className="ant-upload-text">Click or drag file to upload technical specifications</p>
                      <p className="ant-upload-hint">
                        Support for multiple file upload. Accepted formats: PDF, DOC, DOCX, JPG, PNG, XLSX
                      </p>
                    </Upload.Dragger>
                  </Form.Item>
                </Card>
              </Form>
            )}

            {/* Step 2: Review & Submit */}
            {currentStep === 2 && (
              <div>
                <Alert
                  message="Review Sourcing Details"
                  description="Please review all details before sending the Request for Quotation (RFQ) to selected suppliers."
                  type="info"
                  showIcon
                  style={{ marginBottom: '16px' }}
                />

                <Card size="small" title="Selected Suppliers" style={{ marginBottom: '16px' }}>
                  {selectedSuppliers.length > 0 && (
                    <>
                      <Text strong style={{ display: 'block', marginBottom: '12px' }}>
                        Registered Suppliers ({selectedSuppliers.length}):
                      </Text>
                      <List
                        dataSource={selectedSuppliers.map(id => suppliers.find(s => s.id === id)).filter(Boolean)}
                        renderItem={supplier => (
                          <List.Item>
                            <List.Item.Meta
                              avatar={<Avatar icon={<TeamOutlined />} />}
                              title={supplier.name}
                              description={
                                <div>
                                  <Text type="secondary">{supplier.email} | {supplier.phone}</Text>
                                  <br />
                                  <Space size="small">
                                    <Tag color="blue">Rating: {supplier.rating}/5</Tag>
                                    <Tag color="green">{supplier.reliability}</Tag>
                                  </Space>
                                </div>
                              }
                            />
                          </List.Item>
                        )}
                      />
                    </>
                  )}

                  {externalSupplierEmails.length > 0 && (
                    <>
                      {selectedSuppliers.length > 0 && <Divider />}
                      <Text strong style={{ display: 'block', marginBottom: '12px' }}>
                        External Suppliers ({externalSupplierEmails.length}):
                      </Text>
                      <List
                        dataSource={externalSupplierEmails}
                        renderItem={email => (
                          <List.Item>
                            <List.Item.Meta
                              avatar={<Avatar icon={<MailOutlined />} style={{ backgroundColor: '#ff7a00' }} />}
                              title={email}
                              description={<Text type="secondary">External supplier - will receive RFQ via email</Text>}
                            />
                          </List.Item>
                        )}
                      />
                    </>
                  )}

                  {selectedSuppliers.length === 0 && externalSupplierEmails.length === 0 && (
                    <Text type="secondary">No suppliers selected</Text>
                  )}
                </Card>

                <Card size="small" title="Sourcing Summary" style={{ marginBottom: '16px' }}>
                  <Row gutter={[16, 16]}>
                    <Col span={12}>
                      <Text strong>Expected Delivery:</Text>
                      <br />
                      <CalendarOutlined /> {sourcingForm.getFieldValue('expectedDeliveryDate')?.format('MMM DD, YYYY')}
                    </Col>
                    <Col span={12}>
                      <Text strong>Payment Terms:</Text>
                      <br />
                      <BankOutlined /> {sourcingForm.getFieldValue('paymentTerms')}
                    </Col>
                    <Col span={12}>
                      <Text strong>Quote Deadline:</Text>
                      <br />
                      <ClockCircleOutlined /> {sourcingForm.getFieldValue('quotationDeadline')?.format('MMM DD, YYYY')}
                    </Col>
                    <Col span={12}>
                      <Text strong>Delivery Location:</Text>
                      <br />
                      <TruckOutlined /> {sourcingForm.getFieldValue('deliveryLocation')}
                    </Col>
                  </Row>
                  
                  <Divider />
                  
                  <Text strong>Evaluation Criteria:</Text>
                  <Row gutter={[16, 8]} style={{ marginTop: '8px' }}>
                    <Col span={8}>
                      Quality: {sourcingForm.getFieldValue(['evaluationCriteria', 'quality'])}%
                    </Col>
                    <Col span={8}>
                      Cost: {sourcingForm.getFieldValue(['evaluationCriteria', 'cost'])}%
                    </Col>
                    <Col span={8}>
                      Delivery: {sourcingForm.getFieldValue(['evaluationCriteria', 'delivery'])}%
                    </Col>
                  </Row>
                </Card>

                <Card size="small" title="Items to be Quoted">
                  <Table
                    columns={[
                      {
                        title: 'Item Description',
                        dataIndex: 'description',
                        key: 'description'
                      },
                      {
                        title: 'Quantity',
                        dataIndex: 'quantity',
                        key: 'quantity',
                        width: 80,
                        align: 'center'
                      },
                      {
                        title: 'Unit',
                        dataIndex: 'unit',
                        key: 'unit',
                        width: 80,
                        align: 'center'
                      },
                      {
                        title: 'Specifications',
                        dataIndex: 'specifications',
                        key: 'specifications'
                      }
                    ]}
                    dataSource={selectedRequisition.items || []}
                    pagination={false}
                    size="small"
                    rowKey="id"
                  />
                </Card>
              </div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default BuyerRequisitionPortal;










// import React, { useState, useEffect } from 'react';
// import {
//   Card,
//   Table,
//   Button,
//   Space,
//   Typography,
//   Tag,
//   Row,
//   Col,
//   Statistic,
//   Modal,
//   Form,
//   Input,
//   Select,
//   DatePicker,
//   InputNumber,
//   Tabs,
//   Badge,
//   Drawer,
//   message,
//   Alert,
//   Divider,
//   Tooltip,
//   Steps,
//   Checkbox,
//   Rate,
//   Progress,
//   Timeline,
//   Avatar,
//   List,
//   Upload,
//   Spin
// } from 'antd';
// import {
//   ShoppingCartOutlined,
//   EyeOutlined,
//   SendOutlined,
//   UserOutlined,
//   DollarOutlined,
//   CalendarOutlined,
//   FileTextOutlined,
//   StarOutlined,
//   CheckCircleOutlined,
//   ClockCircleOutlined,
//   MailOutlined,
//   SettingOutlined,
//   PlusOutlined,
//   EditOutlined,
//   DeleteOutlined,
//   TeamOutlined,
//   TruckOutlined,
//   BankOutlined,
//   BarChartOutlined,
//   FilterOutlined,
//   ExportOutlined,
//   PhoneOutlined,
//   GlobalOutlined,
//   SafetyCertificateOutlined,
//   TagOutlined,
//   CopyOutlined,
//   UploadOutlined,
//   DownloadOutlined,
//   ExclamationCircleOutlined,
//   SolutionOutlined
// } from '@ant-design/icons';
// import moment from 'moment';
// import { buyerRequisitionAPI } from '../../services/buyerRequisitionAPI';

// const { Title, Text, Paragraph } = Typography;
// const { TextArea } = Input;
// const { Option } = Select;
// const { Step } = Steps;

// const BuyerRequisitionPortal = () => {
//   const [requisitions, setRequisitions] = useState([]);
//   const [selectedRequisition, setSelectedRequisition] = useState(null);
//   const [detailDrawerVisible, setDetailDrawerVisible] = useState(false);
//   const [sourcingDrawerVisible, setSourcingDrawerVisible] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const [suppliers, setSuppliers] = useState([]);
//   const [selectedSuppliers, setSelectedSuppliers] = useState([]);
//   const [sourcingForm] = Form.useForm();
//   const [activeTab, setActiveTab] = useState('pending');
//   const [currentStep, setCurrentStep] = useState(0);

//   // Load requisitions on component mount
//   useEffect(() => {
//     loadRequisitions();
//   }, [activeTab]);

//   const loadRequisitions = async () => {
//     try {
//       setLoading(true);
      
//       // Map activeTab to API filter
//       const statusFilter = {
//         'pending': { sourcingStatus: 'pending_sourcing' },
//         'in_progress': { sourcingStatus: 'in_progress' },
//         'quoted': { sourcingStatus: 'quotes_received' },
//         'completed': { sourcingStatus: 'completed' },
//         'all': {}
//       };

//       const filters = statusFilter[activeTab] || {};
//       const response = await buyerRequisitionAPI.getAssignedRequisitions(filters);
      
//       if (response.success) {
//         setRequisitions(response.data);
//       } else {
//         message.error('Failed to load requisitions');
//       }
//     } catch (error) {
//       console.error('Error loading requisitions:', error);
//       message.error('Error loading requisitions. Please try again.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const loadSuppliers = async (category) => {
//     try {
//       setLoading(true);
//       const response = await buyerRequisitionAPI.getSuppliersByCategory(category);
      
//       if (response.success) {
//         setSuppliers(response.data);
//       } else {
//         message.error('Failed to load suppliers');
//       }
//     } catch (error) {
//       console.error('Error loading suppliers:', error);
//       message.error('Error loading suppliers. Please try again.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Filter requisitions by status
//   const getFilteredRequisitions = () => {
//     return requisitions; // Already filtered by API call
//   };

//   const getStatusTag = (status) => {
//     const statusMap = {
//       'pending_sourcing': { color: 'orange', text: 'Pending Sourcing' },
//       'in_progress': { color: 'blue', text: 'Sourcing in Progress' },
//       'quotes_received': { color: 'purple', text: 'Quotes Received' },
//       'completed': { color: 'green', text: 'Completed' }
//     };
//     const statusInfo = statusMap[status] || { color: 'default', text: status };
//     return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>;
//   };

//   const getUrgencyTag = (urgency) => {
//     const urgencyMap = {
//       'Low': 'green',
//       'Medium': 'orange',
//       'High': 'red',
//       'Urgent': 'volcano'
//     };
//     return <Tag color={urgencyMap[urgency] || 'default'}>{urgency}</Tag>;
//   };

//   const handleViewDetails = async (requisition) => {
//     try {
//       setLoading(true);
//       const response = await buyerRequisitionAPI.getRequisitionDetails(requisition.id);
      
//       if (response.success) {
//         setSelectedRequisition(response.data);
//         setDetailDrawerVisible(true);
//       } else {
//         message.error('Failed to load requisition details');
//       }
//     } catch (error) {
//       console.error('Error loading requisition details:', error);
//       message.error('Error loading requisition details');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleStartSourcing = async (requisition) => {
//     setSelectedRequisition(requisition);
//     await loadSuppliers(requisition.category);
//     setSelectedSuppliers([]);
//     sourcingForm.resetFields();
//     sourcingForm.setFieldsValue({
//       expectedDeliveryDate: moment(requisition.expectedDeliveryDate),
//       quotationDeadline: moment().add(5, 'days'),
//       paymentTerms: '30 days',
//       deliveryLocation: requisition.deliveryLocation,
//       evaluationCriteria: {
//         quality: 40,
//         cost: 35,
//         delivery: 25
//       }
//     });
//     setCurrentStep(0);
//     setSourcingDrawerVisible(true);
//   };

//   const handleSupplierSelection = (supplierId, checked) => {
//     if (checked) {
//       setSelectedSuppliers([...selectedSuppliers, supplierId]);
//     } else {
//       setSelectedSuppliers(selectedSuppliers.filter(id => id !== supplierId));
//     }
//   };

//   const handleSubmitSourcing = async () => {
//     if (selectedSuppliers.length === 0) {
//       message.error('Please select at least one supplier');
//       return;
//     }

//     try {
//       const values = await sourcingForm.validateFields();
//       setLoading(true);

//       // Validate RFQ data
//       const rfqData = {
//         selectedSuppliers,
//         ...values,
//         expectedDeliveryDate: values.expectedDeliveryDate.toISOString(),
//         quotationDeadline: values.quotationDeadline.toISOString()
//       };

//       const validation = buyerRequisitionAPI.validateRFQData(rfqData);
      
//       if (!validation.isValid) {
//         validation.errors.forEach(error => message.error(error));
//         return;
//       }

//       // Show warnings if any
//       validation.warnings.forEach(warning => message.warning(warning));

//       // Submit RFQ to API
//       const response = await buyerRequisitionAPI.createAndSendRFQ(selectedRequisition.id, rfqData);

//       if (response.success) {
//         message.success(`Sourcing request sent to ${selectedSuppliers.length} supplier(s) successfully!`);
//         setSourcingDrawerVisible(false);
//         setCurrentStep(0);
//         loadRequisitions(); // Reload to get updated data
//       } else {
//         message.error(response.message || 'Failed to submit sourcing request');
//       }

//     } catch (error) {
//       console.error('Error submitting sourcing:', error);
//       message.error('Failed to submit sourcing request');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const columns = [
//     {
//       title: 'Requisition Details',
//       key: 'details',
//       render: (_, record) => (
//         <div>
//           <Text strong>{record.title}</Text>
//           <br />
//           <Text type="secondary" style={{ fontSize: '12px' }}>
//             {record.id}
//           </Text>
//           <br />
//           <Tag size="small" color="blue">{record.category}</Tag>
//         </div>
//       ),
//       width: 200
//     },
//     {
//       title: 'Requester',
//       key: 'requester',
//       render: (_, record) => (
//         <div>
//           <Text strong>{record.requester}</Text>
//           <br />
//           <Text type="secondary" style={{ fontSize: '12px' }}>
//             {record.department}
//           </Text>
//         </div>
//       ),
//       width: 150
//     },
//     {
//       title: 'Budget',
//       key: 'budget',
//       render: (_, record) => (
//         <Text strong style={{ color: '#1890ff' }}>
//           XAF {record.budget?.toLocaleString()}
//         </Text>
//       ),
//       width: 120
//     },
//     {
//       title: 'Items',
//       dataIndex: 'items',
//       key: 'items',
//       render: (items) => items?.length || 0,
//       align: 'center',
//       width: 80
//     },
//     {
//       title: 'Expected Delivery',
//       key: 'delivery',
//       render: (_, record) => {
//         const isOverdue = moment(record.expectedDeliveryDate).isBefore(moment());
//         return (
//           <div>
//             <CalendarOutlined /> {moment(record.expectedDeliveryDate).format('MMM DD, YYYY')}
//             <br />
//             <Text type={isOverdue ? "danger" : "secondary"} style={{ fontSize: '11px' }}>
//               {moment(record.expectedDeliveryDate).fromNow()}
//             </Text>
//             {isOverdue && <ExclamationCircleOutlined style={{ color: '#ff4d4f', marginLeft: 4 }} />}
//           </div>
//         );
//       },
//       width: 130
//     },
//     {
//       title: 'Urgency',
//       dataIndex: 'urgency',
//       key: 'urgency',
//       render: (urgency) => getUrgencyTag(urgency),
//       width: 100
//     },
//     {
//       title: 'Sourcing Status',
//       dataIndex: 'sourcingStatus',
//       key: 'sourcingStatus',
//       render: (status) => getStatusTag(status),
//       width: 150
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
//           {record.sourcingStatus === 'pending_sourcing' && (
//             <Tooltip title="Start Sourcing">
//               <Button 
//                 size="small" 
//                 type="primary"
//                 icon={<ShoppingCartOutlined />}
//                 onClick={() => handleStartSourcing(record)}
//               >
//                 Source
//               </Button>
//             </Tooltip>
//           )}
//           {record.sourcingStatus === 'in_progress' && (
//             <Tooltip title="Manage Sourcing">
//               <Button 
//                 size="small" 
//                 type="primary"
//                 ghost
//                 icon={<SettingOutlined />}
//                 onClick={() => handleStartSourcing(record)}
//               >
//                 Manage
//               </Button>
//             </Tooltip>
//           )}
//         </Space>
//       ),
//       width: 120,
//       fixed: 'right'
//     }
//   ];

//   const stats = {
//     pending: requisitions.filter(req => req.sourcingStatus === 'pending_sourcing').length,
//     inProgress: requisitions.filter(req => req.sourcingStatus === 'in_progress').length,
//     quoted: requisitions.filter(req => req.sourcingStatus === 'quotes_received').length,
//     completed: requisitions.filter(req => req.sourcingStatus === 'completed').length
//   };

//   const renderSupplierCard = (supplier) => (
//     <Card 
//       key={supplier.id}
//       size="small" 
//       style={{ 
//         marginBottom: '12px',
//         border: selectedSuppliers.includes(supplier.id) ? '2px solid #1890ff' : '1px solid #d9d9d9'
//       }}
//       bodyStyle={{ padding: '16px' }}
//     >
//       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
//         <div style={{ flex: 1 }}>
//           <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
//             <Checkbox
//               checked={selectedSuppliers.includes(supplier.id)}
//               onChange={(e) => handleSupplierSelection(supplier.id, e.target.checked)}
//               style={{ marginRight: '12px' }}
//             />
//             <div>
//               <Text strong style={{ fontSize: '16px' }}>{supplier.name}</Text>
//               <div style={{ marginTop: '4px' }}>
//                 <Rate disabled defaultValue={supplier.rating} style={{ fontSize: '12px' }} />
//                 <Text type="secondary" style={{ marginLeft: '8px', fontSize: '12px' }}>
//                   {supplier.rating}/5.0
//                 </Text>
//               </div>
//             </div>
//           </div>
          
//           <Row gutter={[16, 8]}>
//             <Col span={12}>
//               <Text type="secondary" style={{ fontSize: '12px' }}>Contact:</Text>
//               <br />
//               <Text style={{ fontSize: '12px' }}>
//                 <MailOutlined /> {supplier.email}
//               </Text>
//               <br />
//               <Text style={{ fontSize: '12px' }}>
//                 <PhoneOutlined /> {supplier.phone}
//               </Text>
//             </Col>
//             <Col span={12}>
//               <Text type="secondary" style={{ fontSize: '12px' }}>Location & Website:</Text>
//               <br />
//               <Text style={{ fontSize: '12px' }}>{supplier.address}</Text>
//               <br />
//               <Text style={{ fontSize: '12px' }}>
//                 <GlobalOutlined /> {supplier.website}
//               </Text>
//             </Col>
//           </Row>
          
//           <Divider style={{ margin: '12px 0' }} />
          
//           <Row gutter={[16, 8]}>
//             <Col span={8}>
//               <Text type="secondary" style={{ fontSize: '11px' }}>Reliability:</Text>
//               <br />
//               <Tag color={supplier.reliability === 'Excellent' ? 'green' : supplier.reliability === 'Good' ? 'blue' : 'orange'}>
//                 {supplier.reliability}
//               </Tag>
//             </Col>
//             <Col span={8}>
//               <Text type="secondary" style={{ fontSize: '11px' }}>Price Level:</Text>
//               <br />
//               <Tag color={supplier.priceCompetitiveness === 'High' ? 'green' : supplier.priceCompetitiveness === 'Medium' ? 'blue' : 'orange'}>
//                 {supplier.priceCompetitiveness}
//               </Tag>
//             </Col>
//             <Col span={8}>
//               <Text type="secondary" style={{ fontSize: '11px' }}>Delivery:</Text>
//               <br />
//               <Text style={{ fontSize: '11px' }}>{supplier.deliveryCapacity}</Text>
//             </Col>
//           </Row>
          
//           <div style={{ marginTop: '8px' }}>
//             <Text type="secondary" style={{ fontSize: '11px' }}>Specializations:</Text>
//             <br />
//             <Space wrap size="small" style={{ marginTop: '4px' }}>
//               {supplier.specialization?.map(spec => (
//                 <Tag key={spec} size="small" color="purple">{spec}</Tag>
//               ))}
//             </Space>
//           </div>
          
//           <div style={{ marginTop: '8px' }}>
//             <Text type="secondary" style={{ fontSize: '11px' }}>Certifications:</Text>
//             <br />
//             <Space wrap size="small" style={{ marginTop: '4px' }}>
//               {supplier.certifications?.map(cert => (
//                 <Tag key={cert} size="small" color="gold" icon={<SafetyCertificateOutlined />}>
//                   {cert}
//                 </Tag>
//               ))}
//             </Space>
//           </div>
          
//           <div style={{ marginTop: '8px' }}>
//             <Text type="secondary" style={{ fontSize: '11px' }}>
//               Last Transaction: {moment(supplier.lastTransaction).format('MMM DD, YYYY')}
//             </Text>
//           </div>
//         </div>
//       </div>
//     </Card>
//   );

//   const sourcingSteps = [
//     {
//       title: 'Supplier Selection',
//       description: 'Choose suppliers to invite for quotation'
//     },
//     {
//       title: 'Sourcing Criteria',
//       description: 'Set evaluation criteria and requirements'
//     },
//     {
//       title: 'Review & Submit',
//       description: 'Review details and send to suppliers'
//     }
//   ];

//   return (
//     <div style={{ padding: '24px' }}>
//       <Card>
//         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
//           <Title level={2} style={{ margin: 0 }}>
//             <ShoppingCartOutlined /> Buyer - Purchase Requisition Management
//           </Title>
//           <Space>
//             <Button icon={<ExportOutlined />}>
//               Export Report
//             </Button>
//             <Button icon={<FilterOutlined />}>
//               Filters
//             </Button>
//           </Space>
//         </div>

//         {/* Statistics */}
//         <Row gutter={16} style={{ marginBottom: '24px' }}>
//           <Col span={6}>
//             <Statistic
//               title="Pending Sourcing"
//               value={stats.pending}
//               prefix={<ClockCircleOutlined />}
//               valueStyle={{ color: '#faad14' }}
//             />
//           </Col>
//           <Col span={6}>
//             <Statistic
//               title="Sourcing in Progress"
//               value={stats.inProgress}
//               prefix={<ShoppingCartOutlined />}
//               valueStyle={{ color: '#1890ff' }}
//             />
//           </Col>
//           <Col span={6}>
//             <Statistic
//               title="Quotes Received"
//               value={stats.quoted}
//               prefix={<FileTextOutlined />}
//               valueStyle={{ color: '#722ed1' }}
//             />
//           </Col>
//           <Col span={6}>
//             <Statistic
//               title="Completed"
//               value={stats.completed}
//               prefix={<CheckCircleOutlined />}
//               valueStyle={{ color: '#52c41a' }}
//             />
//           </Col>
//         </Row>

//         {/* Alert for pending actions */}
//         {stats.pending > 0 && (
//           <Alert
//             message={`${stats.pending} Requisition${stats.pending !== 1 ? 's' : ''} Awaiting Sourcing`}
//             description="You have purchase requisitions that require sourcing attention. Start the procurement process to meet delivery deadlines."
//             type="warning"
//             showIcon
//             action={
//               <Button 
//                 size="small" 
//                 type="primary" 
//                 onClick={() => setActiveTab('pending')}
//               >
//                 View Pending
//               </Button>
//             }
//             style={{ marginBottom: '24px' }}
//           />
//         )}

//         {/* Tabs */}
//         <Tabs activeKey={activeTab} onChange={setActiveTab}>
//           <Tabs.TabPane 
//             tab={
//               <Badge count={stats.pending} size="small">
//                 <span><ClockCircleOutlined /> Pending Sourcing ({stats.pending})</span>
//               </Badge>
//             } 
//             key="pending"
//           />
//           <Tabs.TabPane 
//             tab={
//               <Badge count={stats.inProgress} size="small">
//                 <span><ShoppingCartOutlined /> In Progress ({stats.inProgress})</span>
//               </Badge>
//             } 
//             key="in_progress"
//           />
//           <Tabs.TabPane 
//             tab={
//               <span><FileTextOutlined /> Quotes Received ({stats.quoted})</span>
//             } 
//             key="quoted"
//           />
//           <Tabs.TabPane 
//             tab={
//               <span><CheckCircleOutlined /> Completed ({stats.completed})</span>
//             } 
//             key="completed"
//           />
//           <Tabs.TabPane 
//             tab={
//               <span>All Requisitions</span>
//             } 
//             key="all"
//           />
//         </Tabs>

//         <Table
//           columns={columns}
//           dataSource={getFilteredRequisitions()}
//           rowKey="id"
//           loading={loading}
//           pagination={{
//             pageSize: 10,
//             showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} requisitions`
//           }}
//           scroll={{ x: 'max-content' }}
//         />
//       </Card>

//       {/* Requisition Details Drawer */}
//       <Drawer
//         title={
//           <Space>
//             <FileTextOutlined />
//             Requisition Details
//           </Space>
//         }
//         placement="right"
//         width={800}
//         open={detailDrawerVisible}
//         onClose={() => {
//           setDetailDrawerVisible(false);
//           setSelectedRequisition(null);
//         }}
//       >
//         {selectedRequisition && (
//           <div>
//             {/* Requisition Header */}
//             <Card size="small" title="Requisition Information" style={{ marginBottom: '16px' }}>
//               <Row gutter={[16, 16]}>
//                 <Col span={12}>
//                   <Text strong>Requisition ID:</Text>
//                   <br />
//                   <Text code>{selectedRequisition.id}</Text>
//                 </Col>
//                 <Col span={12}>
//                   <Text strong>Title:</Text>
//                   <br />
//                   <Text>{selectedRequisition.title}</Text>
//                 </Col>
//                 <Col span={12}>
//                   <Text strong>Requester:</Text>
//                   <br />
//                   <Avatar size="small" icon={<UserOutlined />} style={{ marginRight: 8 }} />
//                   {selectedRequisition.requester}
//                 </Col>
//                 <Col span={12}>
//                   <Text strong>Department:</Text>
//                   <br />
//                   <Text>{selectedRequisition.department}</Text>
//                 </Col>
//                 <Col span={12}>
//                   <Text strong>Request Date:</Text>
//                   <br />
//                   <CalendarOutlined /> {moment(selectedRequisition.requestDate).format('MMM DD, YYYY')}
//                 </Col>
//                 <Col span={12}>
//                   <Text strong>Expected Delivery:</Text>
//                   <br />
//                   <CalendarOutlined /> {moment(selectedRequisition.expectedDeliveryDate).format('MMM DD, YYYY')}
//                 </Col>
//                 <Col span={12}>
//                   <Text strong>Budget:</Text>
//                   <br />
//                   <Text strong style={{ color: '#1890ff' }}>
//                     <DollarOutlined /> XAF {selectedRequisition.budget?.toLocaleString()}
//                   </Text>
//                 </Col>
//                 <Col span={12}>
//                   <Text strong>Urgency:</Text>
//                   <br />
//                   {getUrgencyTag(selectedRequisition.urgency)}
//                 </Col>
//                 <Col span={12}>
//                   <Text strong>Category:</Text>
//                   <br />
//                   <Tag color="blue">{selectedRequisition.category}</Tag>
//                 </Col>
//                 <Col span={12}>
//                   <Text strong>Sourcing Status:</Text>
//                   <br />
//                   {getStatusTag(selectedRequisition.sourcingStatus)}
//                 </Col>
//                 <Col span={24}>
//                   <Text strong>Delivery Location:</Text>
//                   <br />
//                   <TruckOutlined /> {selectedRequisition.deliveryLocation}
//                 </Col>
//               </Row>
//             </Card>

//             {/* Items List */}
//             <Card size="small" title="Items to Procure" style={{ marginBottom: '16px' }}>
//               <Table
//                 columns={[
//                   {
//                     title: 'Description',
//                     dataIndex: 'description',
//                     key: 'description'
//                   },
//                   {
//                     title: 'Quantity',
//                     dataIndex: 'quantity',
//                     key: 'quantity',
//                     width: 80,
//                     align: 'center'
//                   },
//                   {
//                     title: 'Unit',
//                     dataIndex: 'unit',
//                     key: 'unit',
//                     width: 80,
//                     align: 'center'
//                   },
//                   {
//                     title: 'Specifications',
//                     dataIndex: 'specifications',
//                     key: 'specifications'
//                   }
//                 ]}
//                 dataSource={selectedRequisition.items}
//                 pagination={false}
//                 size="small"
//                 rowKey="id"
//               />
//             </Card>

//             {/* Notes */}
//             {selectedRequisition.notes && (
//               <Card size="small" title="Additional Notes" style={{ marginBottom: '16px' }}>
//                 <Paragraph>{selectedRequisition.notes}</Paragraph>
//               </Card>
//             )}

//             {/* Sourcing History */}
//             {selectedRequisition.sourcingDetails && (
//               <Card size="small" title="Sourcing History" style={{ marginBottom: '16px' }}>
//                 <Timeline>
//                   <Timeline.Item color="blue">
//                     <Text strong>Assignment to Buyer</Text>
//                     <br />
//                     <Text type="secondary">
//                       {moment(selectedRequisition.assignmentDate).format('MMM DD, YYYY HH:mm')}
//                     </Text>
//                   </Timeline.Item>
//                   <Timeline.Item color="orange">
//                     <Text strong>Sourcing Initiated</Text>
//                     <br />
//                     <Text type="secondary">
//                       {moment(selectedRequisition.sourcingDetails.submissionDate).format('MMM DD, YYYY HH:mm')}
//                     </Text>
//                     <br />
//                     <Text style={{ fontSize: '12px' }}>
//                       Sent to {selectedRequisition.sourcingDetails.selectedSuppliers.length} supplier(s)
//                     </Text>
//                   </Timeline.Item>
//                   <Timeline.Item color="purple">
//                     <Text strong>Expected Quote Response</Text>
//                     <br />
//                     <Text type="secondary">
//                       {moment(selectedRequisition.sourcingDetails.expectedQuoteResponse).format('MMM DD, YYYY')}
//                     </Text>
//                   </Timeline.Item>
//                 </Timeline>
//               </Card>
//             )}

//             {/* Action Buttons */}
//             <Space style={{ marginTop: '16px' }}>
//               {selectedRequisition.sourcingStatus === 'pending_sourcing' && (
//                 <Button 
//                   type="primary" 
//                   icon={<ShoppingCartOutlined />}
//                   onClick={() => {
//                     setDetailDrawerVisible(false);
//                     handleStartSourcing(selectedRequisition);
//                   }}
//                 >
//                   Start Sourcing Process
//                 </Button>
//               )}
//               {selectedRequisition.sourcingStatus === 'in_progress' && (
//                 <Button 
//                   type="primary" 
//                   ghost
//                   icon={<SettingOutlined />}
//                   onClick={() => {
//                     setDetailDrawerVisible(false);
//                     handleStartSourcing(selectedRequisition);
//                   }}
//                 >
//                   Manage Sourcing
//                 </Button>
//               )}
//               <Button icon={<CopyOutlined />}>
//                 Copy Requisition ID
//               </Button>
//               <Button icon={<DownloadOutlined />}>
//                 Download PDF
//               </Button>
//             </Space>
//           </div>
//         )}
//       </Drawer>

//       {/* Sourcing Management Drawer */}
//       <Drawer
//         title={
//           <Space>
//             <ShoppingCartOutlined />
//             Sourcing Management - {selectedRequisition?.title}
//           </Space>
//         }
//         placement="right"
//         width={1000}
//         open={sourcingDrawerVisible}
//         onClose={() => {
//           setSourcingDrawerVisible(false);
//           setSelectedRequisition(null);
//           setCurrentStep(0);
//         }}
//         footer={
//           <div style={{ textAlign: 'right' }}>
//             <Space>
//               <Button onClick={() => setSourcingDrawerVisible(false)}>
//                 Cancel
//               </Button>
//               {currentStep > 0 && (
//                 <Button onClick={() => setCurrentStep(currentStep - 1)}>
//                   Previous
//                 </Button>
//               )}
//               {currentStep < sourcingSteps.length - 1 ? (
//                 <Button 
//                   type="primary" 
//                   onClick={() => setCurrentStep(currentStep + 1)}
//                   disabled={currentStep === 0 && selectedSuppliers.length === 0}
//                 >
//                   Next
//                 </Button>
//               ) : (
//                 <Button 
//                   type="primary" 
//                   icon={<SendOutlined />}
//                   loading={loading}
//                   onClick={handleSubmitSourcing}
//                 >
//                   Send to Suppliers
//                 </Button>
//               )}
//             </Space>
//           </div>
//         }
//       >
//         {selectedRequisition && (
//           <div>
//             {/* Progress Steps */}
//             <Steps current={currentStep} style={{ marginBottom: '32px' }}>
//               {sourcingSteps.map((step, index) => (
//                 <Step key={index} title={step.title} description={step.description} />
//               ))}
//             </Steps>

//             {/* Step 0: Supplier Selection */}
//             {currentStep === 0 && (
//               <div>
//                 <Card size="small" title="Available Suppliers" style={{ marginBottom: '16px' }}>
//                   <Alert
//                     message={`Found ${suppliers.length} supplier(s) for category: ${selectedRequisition.category}`}
//                     description="Select suppliers you want to invite for quotation. The system automatically filtered suppliers based on the item category."
//                     type="info"
//                     showIcon
//                     style={{ marginBottom: '16px' }}
//                   />
                  
//                   {loading ? (
//                     <div style={{ textAlign: 'center', padding: '20px' }}>
//                       <Spin size="large" />
//                       <div style={{ marginTop: '16px' }}>Loading suppliers...</div>
//                     </div>
//                   ) : suppliers.length === 0 ? (
//                     <Alert
//                       message="No suppliers found"
//                       description="No suppliers are registered for this category. Please contact the system administrator."
//                       type="warning"
//                       showIcon
//                     />
//                   ) : (
//                     <div>
//                       {suppliers.map(supplier => renderSupplierCard(supplier))}
//                     </div>
//                   )}
//                 </Card>

//                 <Card size="small" title="Selection Summary">
//                   <Text strong>{selectedSuppliers.length}</Text> supplier(s) selected
//                   {selectedSuppliers.length > 0 && (
//                     <div style={{ marginTop: '8px' }}>
//                       <Space wrap>
//                         {selectedSuppliers.map(supplierId => {
//                           const supplier = suppliers.find(s => s.id === supplierId);
//                           return supplier ? (
//                             <Tag key={supplierId} color="blue" closable onClose={() => handleSupplierSelection(supplierId, false)}>
//                               {supplier.name}
//                             </Tag>
//                           ) : null;
//                         })}
//                       </Space>
//                     </div>
//                   )}
//                 </Card>
//               </div>
//             )}

//             {/* Step 1: Sourcing Criteria */}
//             {currentStep === 1 && (
//               <Form form={sourcingForm} layout="vertical">
//                 <Card size="small" title="Sourcing Requirements" style={{ marginBottom: '16px' }}>
//                   <Row gutter={[16, 16]}>
//                     <Col span={12}>
//                       <Form.Item
//                         name="expectedDeliveryDate"
//                         label="Expected Delivery Date"
//                         rules={[{ required: true, message: 'Please select expected delivery date' }]}
//                       >
//                         <DatePicker 
//                           style={{ width: '100%' }}
//                           disabledDate={(current) => current && current < moment().add(1, 'day')}
//                         />
//                       </Form.Item>
//                     </Col>
//                     <Col span={12}>
//                       <Form.Item
//                         name="quotationDeadline"
//                         label="Quotation Response Deadline"
//                         rules={[{ required: true, message: 'Please select quotation deadline' }]}
//                       >
//                         <DatePicker 
//                           style={{ width: '100%' }}
//                           disabledDate={(current) => current && current < moment().add(1, 'day')}
//                         />
//                       </Form.Item>
//                     </Col>
//                   </Row>

//                   <Row gutter={[16, 16]}>
//                     <Col span={12}>
//                       <Form.Item
//                         name="paymentTerms"
//                         label="Payment Terms"
//                         rules={[{ required: true, message: 'Please select payment terms' }]}
//                       >
//                         <Select placeholder="Select payment terms">
//                           <Option value="15 days">15 days</Option>
//                           <Option value="30 days">30 days</Option>
//                           <Option value="45 days">45 days</Option>
//                           <Option value="60 days">60 days</Option>
//                           <Option value="Cash on delivery">Cash on delivery</Option>
//                           <Option value="Advance payment">Advance payment</Option>
//                         </Select>
//                       </Form.Item>
//                     </Col>
//                     <Col span={12}>
//                       <Form.Item
//                         name="deliveryLocation"
//                         label="Delivery Location"
//                         rules={[{ required: true, message: 'Please specify delivery location' }]}
//                       >
//                         <Input placeholder="Specify delivery location" />
//                       </Form.Item>
//                     </Col>
//                   </Row>
//                 </Card>

//                 <Card size="small" title="Evaluation Criteria" style={{ marginBottom: '16px' }}>
//                   <Alert
//                     message="Evaluation Weights"
//                     description="Set the importance weights for each evaluation criterion. Total must equal 100%."
//                     type="info"
//                     showIcon
//                     style={{ marginBottom: '16px' }}
//                   />
                  
//                   <Row gutter={[16, 16]}>
//                     <Col span={8}>
//                       <Form.Item
//                         name={['evaluationCriteria', 'quality']}
//                         label="Quality Weight (%)"
//                         rules={[{ required: true, message: 'Please set quality weight' }]}
//                       >
//                         <InputNumber 
//                           min={0} 
//                           max={100} 
//                           style={{ width: '100%' }}
//                           formatter={value => `${value}%`}
//                           parser={value => value.replace('%', '')}
//                         />
//                       </Form.Item>
//                     </Col>
//                     <Col span={8}>
//                       <Form.Item
//                         name={['evaluationCriteria', 'cost']}
//                         label="Cost Weight (%)"
//                         rules={[{ required: true, message: 'Please set cost weight' }]}
//                       >
//                         <InputNumber 
//                           min={0} 
//                           max={100} 
//                           style={{ width: '100%' }}
//                           formatter={value => `${value}%`}
//                           parser={value => value.replace('%', '')}
//                         />
//                       </Form.Item>
//                     </Col>
//                     <Col span={8}>
//                       <Form.Item
//                         name={['evaluationCriteria', 'delivery']}
//                         label="Delivery Weight (%)"
//                         rules={[{ required: true, message: 'Please set delivery weight' }]}
//                       >
//                         <InputNumber 
//                           min={0} 
//                           max={100} 
//                           style={{ width: '100%' }}
//                           formatter={value => `${value}%`}
//                           parser={value => value.replace('%', '')}
//                         />
//                       </Form.Item>
//                     </Col>
//                   </Row>
//                 </Card>

//                 <Card size="small" title="Additional Requirements" style={{ marginBottom: '16px' }}>
//                   <Form.Item
//                     name="specialRequirements"
//                     label="Special Requirements or Instructions"
//                   >
//                     <TextArea 
//                       rows={4}
//                       placeholder="Enter any special requirements, technical specifications, quality standards, or delivery instructions..."
//                       showCount
//                       maxLength={1000}
//                     />
//                   </Form.Item>

//                   <Form.Item
//                     name="attachments"
//                     label="Technical Specifications (Optional)"
//                   >
//                     <Upload.Dragger
//                       multiple
//                       beforeUpload={() => false}
//                       accept=".pdf,.doc,.docx,.jpg,.png,.xlsx"
//                     >
//                       <p className="ant-upload-drag-icon">
//                         <UploadOutlined />
//                       </p>
//                       <p className="ant-upload-text">Click or drag file to upload technical specifications</p>
//                       <p className="ant-upload-hint">
//                         Support for multiple file upload. Accepted formats: PDF, DOC, DOCX, JPG, PNG, XLSX
//                       </p>
//                     </Upload.Dragger>
//                   </Form.Item>
//                 </Card>
//               </Form>
//             )}

//             {/* Step 2: Review & Submit */}
//             {currentStep === 2 && (
//               <div>
//                 <Alert
//                   message="Review Sourcing Details"
//                   description="Please review all details before sending the Request for Quotation (RFQ) to selected suppliers."
//                   type="info"
//                   showIcon
//                   style={{ marginBottom: '16px' }}
//                 />

//                 <Card size="small" title="Selected Suppliers" style={{ marginBottom: '16px' }}>
//                   <List
//                     dataSource={selectedSuppliers.map(id => suppliers.find(s => s.id === id)).filter(Boolean)}
//                     renderItem={supplier => (
//                       <List.Item>
//                         <List.Item.Meta
//                           avatar={<Avatar icon={<TeamOutlined />} />}
//                           title={supplier.name}
//                           description={
//                             <div>
//                               <Text type="secondary">{supplier.email} | {supplier.phone}</Text>
//                               <br />
//                               <Space size="small">
//                                 <Tag color="blue">Rating: {supplier.rating}/5</Tag>
//                                 <Tag color="green">{supplier.reliability}</Tag>
//                               </Space>
//                             </div>
//                           }
//                         />
//                       </List.Item>
//                     )}
//                   />
//                 </Card>

//                 <Card size="small" title="Sourcing Summary" style={{ marginBottom: '16px' }}>
//                   <Row gutter={[16, 16]}>
//                     <Col span={12}>
//                       <Text strong>Expected Delivery:</Text>
//                       <br />
//                       <CalendarOutlined /> {sourcingForm.getFieldValue('expectedDeliveryDate')?.format('MMM DD, YYYY')}
//                     </Col>
//                     <Col span={12}>
//                       <Text strong>Payment Terms:</Text>
//                       <br />
//                       <BankOutlined /> {sourcingForm.getFieldValue('paymentTerms')}
//                     </Col>
//                     <Col span={12}>
//                       <Text strong>Quote Deadline:</Text>
//                       <br />
//                       <ClockCircleOutlined /> {sourcingForm.getFieldValue('quotationDeadline')?.format('MMM DD, YYYY')}
//                     </Col>
//                     <Col span={12}>
//                       <Text strong>Delivery Location:</Text>
//                       <br />
//                       <TruckOutlined /> {sourcingForm.getFieldValue('deliveryLocation')}
//                     </Col>
//                   </Row>
                  
//                   <Divider />
                  
//                   <Text strong>Evaluation Criteria:</Text>
//                   <Row gutter={[16, 8]} style={{ marginTop: '8px' }}>
//                     <Col span={8}>
//                       Quality: {sourcingForm.getFieldValue(['evaluationCriteria', 'quality'])}%
//                     </Col>
//                     <Col span={8}>
//                       Cost: {sourcingForm.getFieldValue(['evaluationCriteria', 'cost'])}%
//                     </Col>
//                     <Col span={8}>
//                       Delivery: {sourcingForm.getFieldValue(['evaluationCriteria', 'delivery'])}%
//                     </Col>
//                   </Row>
//                 </Card>

//                 <Card size="small" title="Items to be Quoted">
//                   <Table
//                     columns={[
//                       {
//                         title: 'Item Description',
//                         dataIndex: 'description',
//                         key: 'description'
//                       },
//                       {
//                         title: 'Quantity',
//                         dataIndex: 'quantity',
//                         key: 'quantity',
//                         width: 80,
//                         align: 'center'
//                       },
//                       {
//                         title: 'Unit',
//                         dataIndex: 'unit',
//                         key: 'unit',
//                         width: 80,
//                         align: 'center'
//                       },
//                       {
//                         title: 'Specifications',
//                         dataIndex: 'specifications',
//                         key: 'specifications'
//                       }
//                     ]}
//                     dataSource={selectedRequisition.items}
//                     pagination={false}
//                     size="small"
//                     rowKey="id"
//                   />
//                 </Card>
//               </div>
//             )}
//           </div>
//         )}
//       </Drawer>
//     </div>
//   );
// };

// export default BuyerRequisitionPortal;








// import React, { useState, useEffect } from 'react';
// import {
//   Card,
//   Table,
//   Button,
//   Space,
//   Typography,
//   Tag,
//   Row,
//   Col,
//   Statistic,
//   Modal,
//   Descriptions,
//   Form,
//   Input,
//   Select,
//   DatePicker,
//   InputNumber,
//   Tabs,
//   Badge,
//   Drawer,
//   message,
//   Alert,
//   Divider,
//   Tooltip,
//   Steps,
//   Checkbox,
//   Rate,
//   Progress,
//   Timeline,
//   Avatar,
//   List,
//   Upload,
//   Spin
// } from 'antd';
// import {
//   ShoppingCartOutlined,
//   EyeOutlined,
//   SendOutlined,
//   UserOutlined,
//   DollarOutlined,
//   CalendarOutlined,
//   FileTextOutlined,
//   StarOutlined,
//   CheckCircleOutlined,
//   ClockCircleOutlined,
//   MailOutlined,
//   SettingOutlined,
//   PlusOutlined,
//   EditOutlined,
//   DeleteOutlined,
//   TeamOutlined,
//   TruckOutlined,
//   BankOutlined,
//   BarChartOutlined,
//   FilterOutlined,
//   ExportOutlined,
//   PhoneOutlined,
//   GlobalOutlined,
//   SafetyCertificateOutlined,
//   TagOutlined,
//   CopyOutlined,
//   UploadOutlined,
//   DownloadOutlined
// } from '@ant-design/icons';
// import moment from 'moment';

// const { Title, Text, Paragraph } = Typography;
// const { TextArea } = Input;
// const { Option } = Select;
// const { Step } = Steps;

// // Mock data - replace with actual API calls
// const mockRequisitions = [
//   {
//     id: 'REQ20241215001',
//     title: 'IT Accessories - Safety Stock',
//     requester: 'John Doe',
//     department: 'IT Department',
//     requestDate: '2024-12-15',
//     expectedDeliveryDate: '2024-12-30',
//     urgency: 'High',
//     status: 'assigned_to_buyer',
//     budget: 2500000,
//     category: 'IT Accessories',
//     assignmentDate: '2024-12-16',
//     sourcingStatus: 'pending_sourcing',
//     items: [
//       { id: 1, description: 'Wireless Mouse', quantity: 10, unit: 'Pieces', specifications: 'Rechargeable, 7 days battery autonomy' },
//       { id: 2, description: 'USB Keyboards', quantity: 15, unit: 'Pieces', specifications: 'Standard layout, wired connection' },
//       { id: 3, description: 'VGA to HDMI Converter', quantity: 5, unit: 'Pieces', specifications: 'High quality conversion' },
//       { id: 4, description: 'External Hard Drive 500GB', quantity: 3, unit: 'Pieces', specifications: 'USB 3.0, portable' }
//     ],
//     deliveryLocation: 'Main Office - IT Department',
//     notes: 'These items are needed for backup inventory'
//   },
//   {
//     id: 'REQ20241214002',
//     title: 'Office Furniture Replacement',
//     requester: 'Jane Smith',
//     department: 'HR Department',
//     requestDate: '2024-12-14',
//     expectedDeliveryDate: '2024-12-28',
//     urgency: 'Medium',
//     status: 'assigned_to_buyer',
//     budget: 1800000,
//     category: 'Furniture',
//     assignmentDate: '2024-12-15',
//     sourcingStatus: 'in_progress',
//     items: [
//       { id: 1, description: 'Office Chair', quantity: 8, unit: 'Pieces', specifications: 'Ergonomic, adjustable height' },
//       { id: 2, description: 'Office Desk', quantity: 4, unit: 'Pieces', specifications: '120x60cm, with drawers' }
//     ],
//     deliveryLocation: 'Main Office - HR Department',
//     notes: 'Replace old furniture in meeting rooms'
//   }
// ];

// const mockSuppliers = {
//   'IT Accessories': [
//     {
//       id: 'SUP001',
//       name: 'TechSource Cameroon',
//       email: 'sales@techsource.cm',
//       phone: '+237 678 901 234',
//       address: 'Douala, Littoral',
//       website: 'www.techsource.cm',
//       rating: 4.5,
//       specialization: ['IT Accessories', 'Hardware', 'Software'],
//       paymentTerms: ['30 days', '45 days'],
//       deliveryCapacity: 'Same day to 14 days',
//       certifications: ['ISO 9001', 'ISO 27001'],
//       lastTransaction: '2024-11-15',
//       reliability: 'Excellent',
//       priceCompetitiveness: 'High'
//     },
//     {
//       id: 'SUP002',
//       name: 'Digital Solutions SARL',
//       email: 'info@digitalsolutions.cm',
//       phone: '+237 699 123 456',
//       address: 'Yaounde, Centre',
//       website: 'www.digitalsolutions.cm',
//       rating: 4.2,
//       specialization: ['IT Accessories', 'Network Equipment'],
//       paymentTerms: ['15 days', '30 days'],
//       deliveryCapacity: '1-7 days',
//       certifications: ['ISO 9001'],
//       lastTransaction: '2024-10-20',
//       reliability: 'Good',
//       priceCompetitiveness: 'Medium'
//     },
//     {
//       id: 'SUP003',
//       name: 'Central Africa Tech Hub',
//       email: 'procurement@catechhub.com',
//       phone: '+237 677 555 123',
//       address: 'Douala, Littoral',
//       website: 'www.catechhub.com',
//       rating: 4.8,
//       specialization: ['IT Accessories', 'Software', 'Hardware', 'Maintenance'],
//       paymentTerms: ['30 days', '60 days'],
//       deliveryCapacity: '2-10 days',
//       certifications: ['ISO 9001', 'ISO 14001', 'OHSAS 18001'],
//       lastTransaction: '2024-12-01',
//       reliability: 'Excellent',
//       priceCompetitiveness: 'High'
//     }
//   ],
//   'Furniture': [
//     {
//       id: 'SUP004',
//       name: 'Office Furniture Solutions',
//       email: 'sales@officefurniture.cm',
//       phone: '+237 678 456 789',
//       address: 'Douala, Littoral',
//       website: 'www.officefurniture.cm',
//       rating: 4.3,
//       specialization: ['Furniture', 'Office Equipment'],
//       paymentTerms: ['30 days', '45 days'],
//       deliveryCapacity: '5-14 days',
//       certifications: ['ISO 9001'],
//       lastTransaction: '2024-11-30',
//       reliability: 'Good',
//       priceCompetitiveness: 'Medium'
//     }
//   ]
// };

// const BuyerRequisitionPortal = () => {
//   const [requisitions, setRequisitions] = useState(mockRequisitions);
//   const [selectedRequisition, setSelectedRequisition] = useState(null);
//   const [detailDrawerVisible, setDetailDrawerVisible] = useState(false);
//   const [sourcingDrawerVisible, setSourcingDrawerVisible] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const [suppliers, setSuppliers] = useState([]);
//   const [selectedSuppliers, setSelectedSuppliers] = useState([]);
//   const [sourcingForm] = Form.useForm();
//   const [activeTab, setActiveTab] = useState('pending');
//   const [currentStep, setCurrentStep] = useState(0);

//   // Filter requisitions by status
//   const getFilteredRequisitions = () => {
//     switch (activeTab) {
//       case 'pending':
//         return requisitions.filter(req => req.sourcingStatus === 'pending_sourcing');
//       case 'in_progress':
//         return requisitions.filter(req => req.sourcingStatus === 'in_progress');
//       case 'quoted':
//         return requisitions.filter(req => req.sourcingStatus === 'quotes_received');
//       case 'completed':
//         return requisitions.filter(req => req.sourcingStatus === 'completed');
//       default:
//         return requisitions;
//     }
//   };

//   const getStatusTag = (status) => {
//     const statusMap = {
//       'pending_sourcing': { color: 'orange', text: 'Pending Sourcing' },
//       'in_progress': { color: 'blue', text: 'Sourcing in Progress' },
//       'quotes_received': { color: 'purple', text: 'Quotes Received' },
//       'completed': { color: 'green', text: 'Completed' }
//     };
//     const statusInfo = statusMap[status] || { color: 'default', text: status };
//     return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>;
//   };

//   const getUrgencyTag = (urgency) => {
//     const urgencyMap = {
//       'Low': 'green',
//       'Medium': 'orange',
//       'High': 'red'
//     };
//     return <Tag color={urgencyMap[urgency] || 'default'}>{urgency}</Tag>;
//   };

//   const handleViewDetails = (requisition) => {
//     setSelectedRequisition(requisition);
//     setDetailDrawerVisible(true);
//   };

//   const handleStartSourcing = (requisition) => {
//     setSelectedRequisition(requisition);
//     const categorySuppliers = mockSuppliers[requisition.category] || [];
//     setSuppliers(categorySuppliers);
//     setSelectedSuppliers([]);
//     sourcingForm.resetFields();
//     sourcingForm.setFieldsValue({
//       expectedDeliveryDate: moment(requisition.expectedDeliveryDate),
//       paymentTerms: '30 days',
//       evaluationCriteria: {
//         quality: 40,
//         cost: 35,
//         delivery: 25
//       }
//     });
//     setCurrentStep(0);
//     setSourcingDrawerVisible(true);
//   };

//   const handleSupplierSelection = (supplierId, checked) => {
//     if (checked) {
//       setSelectedSuppliers([...selectedSuppliers, supplierId]);
//     } else {
//       setSelectedSuppliers(selectedSuppliers.filter(id => id !== supplierId));
//     }
//   };

//   const handleSubmitSourcing = async () => {
//     if (selectedSuppliers.length === 0) {
//       message.error('Please select at least one supplier');
//       return;
//     }

//     try {
//       const values = await sourcingForm.validateFields();
//       setLoading(true);

//       // Simulate API call
//       await new Promise(resolve => setTimeout(resolve, 2000));

//       // Update requisition status
//       const updatedRequisitions = requisitions.map(req => {
//         if (req.id === selectedRequisition.id) {
//           return {
//             ...req,
//             sourcingStatus: 'in_progress',
//             sourcingDetails: {
//               ...values,
//               selectedSuppliers: selectedSuppliers,
//               submissionDate: moment().format('YYYY-MM-DD HH:mm:ss'),
//               expectedQuoteResponse: moment().add(5, 'days').format('YYYY-MM-DD')
//             }
//           };
//         }
//         return req;
//       });

//       setRequisitions(updatedRequisitions);
//       message.success(`Sourcing request sent to ${selectedSuppliers.length} supplier(s) successfully!`);
//       setSourcingDrawerVisible(false);
//       setCurrentStep(0);

//     } catch (error) {
//       console.error('Error submitting sourcing:', error);
//       message.error('Failed to submit sourcing request');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const columns = [
//     {
//       title: 'Requisition Details',
//       key: 'details',
//       render: (_, record) => (
//         <div>
//           <Text strong>{record.title}</Text>
//           <br />
//           <Text type="secondary" style={{ fontSize: '12px' }}>
//             {record.id}
//           </Text>
//           <br />
//           <Tag size="small" color="blue">{record.category}</Tag>
//         </div>
//       ),
//       width: 200
//     },
//     {
//       title: 'Requester',
//       key: 'requester',
//       render: (_, record) => (
//         <div>
//           <Text strong>{record.requester}</Text>
//           <br />
//           <Text type="secondary" style={{ fontSize: '12px' }}>
//             {record.department}
//           </Text>
//         </div>
//       ),
//       width: 150
//     },
//     {
//       title: 'Budget',
//       key: 'budget',
//       render: (_, record) => (
//         <Text strong style={{ color: '#1890ff' }}>
//           XAF {record.budget?.toLocaleString()}
//         </Text>
//       ),
//       width: 120
//     },
//     {
//       title: 'Items',
//       dataIndex: 'items',
//       key: 'items',
//       render: (items) => items?.length || 0,
//       align: 'center',
//       width: 80
//     },
//     {
//       title: 'Expected Delivery',
//       key: 'delivery',
//       render: (_, record) => (
//         <div>
//           <CalendarOutlined /> {moment(record.expectedDeliveryDate).format('MMM DD, YYYY')}
//           <br />
//           <Text type="secondary" style={{ fontSize: '11px' }}>
//             {moment(record.expectedDeliveryDate).fromNow()}
//           </Text>
//         </div>
//       ),
//       width: 130
//     },
//     {
//       title: 'Urgency',
//       dataIndex: 'urgency',
//       key: 'urgency',
//       render: (urgency) => getUrgencyTag(urgency),
//       width: 100
//     },
//     {
//       title: 'Sourcing Status',
//       dataIndex: 'sourcingStatus',
//       key: 'sourcingStatus',
//       render: (status) => getStatusTag(status),
//       width: 150
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
//           {record.sourcingStatus === 'pending_sourcing' && (
//             <Tooltip title="Start Sourcing">
//               <Button 
//                 size="small" 
//                 type="primary"
//                 icon={<ShoppingCartOutlined />}
//                 onClick={() => handleStartSourcing(record)}
//               >
//                 Source
//               </Button>
//             </Tooltip>
//           )}
//           {record.sourcingStatus === 'in_progress' && (
//             <Tooltip title="Manage Sourcing">
//               <Button 
//                 size="small" 
//                 type="primary"
//                 ghost
//                 icon={<SettingOutlined />}
//                 onClick={() => handleStartSourcing(record)}
//               >
//                 Manage
//               </Button>
//             </Tooltip>
//           )}
//         </Space>
//       ),
//       width: 120,
//       fixed: 'right'
//     }
//   ];

//   const stats = {
//     pending: requisitions.filter(req => req.sourcingStatus === 'pending_sourcing').length,
//     inProgress: requisitions.filter(req => req.sourcingStatus === 'in_progress').length,
//     quoted: requisitions.filter(req => req.sourcingStatus === 'quotes_received').length,
//     completed: requisitions.filter(req => req.sourcingStatus === 'completed').length
//   };

//   const renderSupplierCard = (supplier) => (
//     <Card 
//       key={supplier.id}
//       size="small" 
//       style={{ 
//         marginBottom: '12px',
//         border: selectedSuppliers.includes(supplier.id) ? '2px solid #1890ff' : '1px solid #d9d9d9'
//       }}
//       bodyStyle={{ padding: '16px' }}
//     >
//       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
//         <div style={{ flex: 1 }}>
//           <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
//             <Checkbox
//               checked={selectedSuppliers.includes(supplier.id)}
//               onChange={(e) => handleSupplierSelection(supplier.id, e.target.checked)}
//               style={{ marginRight: '12px' }}
//             />
//             <div>
//               <Text strong style={{ fontSize: '16px' }}>{supplier.name}</Text>
//               <div style={{ marginTop: '4px' }}>
//                 <Rate disabled defaultValue={supplier.rating} style={{ fontSize: '12px' }} />
//                 <Text type="secondary" style={{ marginLeft: '8px', fontSize: '12px' }}>
//                   {supplier.rating}/5.0
//                 </Text>
//               </div>
//             </div>
//           </div>
          
//           <Row gutter={[16, 8]}>
//             <Col span={12}>
//               <Text type="secondary" style={{ fontSize: '12px' }}>Contact:</Text>
//               <br />
//               <Text style={{ fontSize: '12px' }}>
//                 <MailOutlined /> {supplier.email}
//               </Text>
//               <br />
//               <Text style={{ fontSize: '12px' }}>
//                 <PhoneOutlined /> {supplier.phone}
//               </Text>
//             </Col>
//             <Col span={12}>
//               <Text type="secondary" style={{ fontSize: '12px' }}>Location & Website:</Text>
//               <br />
//               <Text style={{ fontSize: '12px' }}>{supplier.address}</Text>
//               <br />
//               <Text style={{ fontSize: '12px' }}>
//                 <GlobalOutlined /> {supplier.website}
//               </Text>
//             </Col>
//           </Row>
          
//           <Divider style={{ margin: '12px 0' }} />
          
//           <Row gutter={[16, 8]}>
//             <Col span={8}>
//               <Text type="secondary" style={{ fontSize: '11px' }}>Reliability:</Text>
//               <br />
//               <Tag color={supplier.reliability === 'Excellent' ? 'green' : supplier.reliability === 'Good' ? 'blue' : 'orange'}>
//                 {supplier.reliability}
//               </Tag>
//             </Col>
//             <Col span={8}>
//               <Text type="secondary" style={{ fontSize: '11px' }}>Price Level:</Text>
//               <br />
//               <Tag color={supplier.priceCompetitiveness === 'High' ? 'green' : supplier.priceCompetitiveness === 'Medium' ? 'blue' : 'orange'}>
//                 {supplier.priceCompetitiveness}
//               </Tag>
//             </Col>
//             <Col span={8}>
//               <Text type="secondary" style={{ fontSize: '11px' }}>Delivery:</Text>
//               <br />
//               <Text style={{ fontSize: '11px' }}>{supplier.deliveryCapacity}</Text>
//             </Col>
//           </Row>
          
//           <div style={{ marginTop: '8px' }}>
//             <Text type="secondary" style={{ fontSize: '11px' }}>Specializations:</Text>
//             <br />
//             <Space wrap size="small" style={{ marginTop: '4px' }}>
//               {supplier.specialization.map(spec => (
//                 <Tag key={spec} size="small" color="purple">{spec}</Tag>
//               ))}
//             </Space>
//           </div>
          
//           <div style={{ marginTop: '8px' }}>
//             <Text type="secondary" style={{ fontSize: '11px' }}>Certifications:</Text>
//             <br />
//             <Space wrap size="small" style={{ marginTop: '4px' }}>
//               {supplier.certifications.map(cert => (
//                 <Tag key={cert} size="small" color="gold" icon={<SafetyCertificateOutlined />}>
//                   {cert}
//                 </Tag>
//               ))}
//             </Space>
//           </div>
          
//           <div style={{ marginTop: '8px' }}>
//             <Text type="secondary" style={{ fontSize: '11px' }}>
//               Last Transaction: {moment(supplier.lastTransaction).format('MMM DD, YYYY')}
//             </Text>
//           </div>
//         </div>
//       </div>
//     </Card>
//   );

//   const sourcingSteps = [
//     {
//       title: 'Supplier Selection',
//       description: 'Choose suppliers to invite for quotation'
//     },
//     {
//       title: 'Sourcing Criteria',
//       description: 'Set evaluation criteria and requirements'
//     },
//     {
//       title: 'Review & Submit',
//       description: 'Review details and send to suppliers'
//     }
//   ];

//   return (
//     <div style={{ padding: '24px' }}>
//       <Card>
//         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
//           <Title level={2} style={{ margin: 0 }}>
//             <ShoppingCartOutlined /> Buyer - Purchase Requisition Management
//           </Title>
//           <Space>
//             <Button icon={<ExportOutlined />}>
//               Export Report
//             </Button>
//             <Button icon={<FilterOutlined />}>
//               Filters
//             </Button>
//           </Space>
//         </div>

//         {/* Statistics */}
//         <Row gutter={16} style={{ marginBottom: '24px' }}>
//           <Col span={6}>
//             <Statistic
//               title="Pending Sourcing"
//               value={stats.pending}
//               prefix={<ClockCircleOutlined />}
//               valueStyle={{ color: '#faad14' }}
//             />
//           </Col>
//           <Col span={6}>
//             <Statistic
//               title="Sourcing in Progress"
//               value={stats.inProgress}
//               prefix={<ShoppingCartOutlined />}
//               valueStyle={{ color: '#1890ff' }}
//             />
//           </Col>
//           <Col span={6}>
//             <Statistic
//               title="Quotes Received"
//               value={stats.quoted}
//               prefix={<FileTextOutlined />}
//               valueStyle={{ color: '#722ed1' }}
//             />
//           </Col>
//           <Col span={6}>
//             <Statistic
//               title="Completed"
//               value={stats.completed}
//               prefix={<CheckCircleOutlined />}
//               valueStyle={{ color: '#52c41a' }}
//             />
//           </Col>
//         </Row>

//         {/* Alert for pending actions */}
//         {stats.pending > 0 && (
//           <Alert
//             message={`${stats.pending} Requisition${stats.pending !== 1 ? 's' : ''} Awaiting Sourcing`}
//             description="You have purchase requisitions that require sourcing attention. Start the procurement process to meet delivery deadlines."
//             type="warning"
//             showIcon
//             action={
//               <Button 
//                 size="small" 
//                 type="primary" 
//                 onClick={() => setActiveTab('pending')}
//               >
//                 View Pending
//               </Button>
//             }
//             style={{ marginBottom: '24px' }}
//           />
//         )}

//         {/* Tabs */}
//         <Tabs activeKey={activeTab} onChange={setActiveTab}>
//           <Tabs.TabPane 
//             tab={
//               <Badge count={stats.pending} size="small">
//                 <span><ClockCircleOutlined /> Pending Sourcing ({stats.pending})</span>
//               </Badge>
//             } 
//             key="pending"
//           >
//             <Table
//               columns={columns}
//               dataSource={getFilteredRequisitions()}
//               rowKey="id"
//               loading={loading}
//               pagination={{
//                 pageSize: 10,
//                 showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} requisitions`
//               }}
//               scroll={{ x: 'max-content' }}
//             />
//           </Tabs.TabPane>

//           <Tabs.TabPane 
//             tab={
//               <Badge count={stats.inProgress} size="small">
//                 <span><ShoppingCartOutlined /> In Progress ({stats.inProgress})</span>
//               </Badge>
//             } 
//             key="in_progress"
//           >
//             <Table
//               columns={columns}
//               dataSource={getFilteredRequisitions()}
//               rowKey="id"
//               loading={loading}
//               pagination={{
//                 pageSize: 10,
//                 showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} requisitions`
//               }}
//               scroll={{ x: 'max-content' }}
//             />
//           </Tabs.TabPane>

//           <Tabs.TabPane 
//             tab={
//               <span><FileTextOutlined /> Quotes Received ({stats.quoted})</span>
//             } 
//             key="quoted"
//           >
//             <Table
//               columns={columns}
//               dataSource={getFilteredRequisitions()}
//               rowKey="id"
//               loading={loading}
//               pagination={{
//                 pageSize: 10,
//                 showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} requisitions`
//               }}
//               scroll={{ x: 'max-content' }}
//             />
//           </Tabs.TabPane>

//           <Tabs.TabPane 
//             tab={
//               <span><CheckCircleOutlined /> Completed ({stats.completed})</span>
//             } 
//             key="completed"
//           >
//             <Table
//               columns={columns}
//               dataSource={getFilteredRequisitions()}
//               rowKey="id"
//               loading={loading}
//               pagination={{
//                 pageSize: 10,
//                 showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} requisitions`
//               }}
//               scroll={{ x: 'max-content' }}
//             />
//           </Tabs.TabPane>
//         </Tabs>
//       </Card>

//       {/* Requisition Details Drawer */}
//       <Drawer
//         title={
//           <Space>
//             <FileTextOutlined />
//             Requisition Details
//           </Space>
//         }
//         placement="right"
//         width={800}
//         open={detailDrawerVisible}
//         onClose={() => {
//           setDetailDrawerVisible(false);
//           setSelectedRequisition(null);
//         }}
//       >
//         {selectedRequisition && (
//           <div>
//             {/* Requisition Header */}
//             <Card size="small" title="Requisition Information" style={{ marginBottom: '16px' }}>
//               <Descriptions column={2} size="small">
//                 <Descriptions.Item label="Requisition ID">
//                   <Text code>{selectedRequisition.id}</Text>
//                 </Descriptions.Item>
//                 <Descriptions.Item label="Title">
//                   {selectedRequisition.title}
//                 </Descriptions.Item>
//                 <Descriptions.Item label="Requester">
//                   <Avatar size="small" icon={<UserOutlined />} style={{ marginRight: 8 }} />
//                   {selectedRequisition.requester}
//                 </Descriptions.Item>
//                 <Descriptions.Item label="Department">
//                   {selectedRequisition.department}
//                 </Descriptions.Item>
//                 <Descriptions.Item label="Request Date">
//                   <CalendarOutlined /> {moment(selectedRequisition.requestDate).format('MMM DD, YYYY')}
//                 </Descriptions.Item>
//                 <Descriptions.Item label="Expected Delivery">
//                   <CalendarOutlined /> {moment(selectedRequisition.expectedDeliveryDate).format('MMM DD, YYYY')}
//                 </Descriptions.Item>
//                 <Descriptions.Item label="Budget">
//                   <Text strong style={{ color: '#1890ff' }}>
//                     <DollarOutlined /> XAF {selectedRequisition.budget?.toLocaleString()}
//                   </Text>
//                 </Descriptions.Item>
//                 <Descriptions.Item label="Urgency">
//                   {getUrgencyTag(selectedRequisition.urgency)}
//                 </Descriptions.Item>
//                 <Descriptions.Item label="Category">
//                   <Tag color="blue">{selectedRequisition.category}</Tag>
//                 </Descriptions.Item>
//                 <Descriptions.Item label="Sourcing Status">
//                   {getStatusTag(selectedRequisition.sourcingStatus)}
//                 </Descriptions.Item>
//                 <Descriptions.Item label="Delivery Location" span={2}>
//                   <TruckOutlined /> {selectedRequisition.deliveryLocation}
//                 </Descriptions.Item>
//               </Descriptions>
//             </Card>

//             {/* Items List */}
//             <Card size="small" title="Items to Procure" style={{ marginBottom: '16px' }}>
//               <Table
//                 columns={[
//                   {
//                     title: 'Description',
//                     dataIndex: 'description',
//                     key: 'description'
//                   },
//                   {
//                     title: 'Quantity',
//                     dataIndex: 'quantity',
//                     key: 'quantity',
//                     width: 80,
//                     align: 'center'
//                   },
//                   {
//                     title: 'Unit',
//                     dataIndex: 'unit',
//                     key: 'unit',
//                     width: 80,
//                     align: 'center'
//                   },
//                   {
//                     title: 'Specifications',
//                     dataIndex: 'specifications',
//                     key: 'specifications'
//                   }
//                 ]}
//                 dataSource={selectedRequisition.items}
//                 pagination={false}
//                 size="small"
//                 rowKey="id"
//               />
//             </Card>

//             {/* Notes */}
//             {selectedRequisition.notes && (
//               <Card size="small" title="Additional Notes" style={{ marginBottom: '16px' }}>
//                 <Paragraph>{selectedRequisition.notes}</Paragraph>
//               </Card>
//             )}

//             {/* Sourcing History */}
//             {selectedRequisition.sourcingDetails && (
//               <Card size="small" title="Sourcing History" style={{ marginBottom: '16px' }}>
//                 <Timeline>
//                   <Timeline.Item color="blue">
//                     <Text strong>Assignment to Buyer</Text>
//                     <br />
//                     <Text type="secondary">
//                       {moment(selectedRequisition.assignmentDate).format('MMM DD, YYYY HH:mm')}
//                     </Text>
//                   </Timeline.Item>
//                   <Timeline.Item color="orange">
//                     <Text strong>Sourcing Initiated</Text>
//                     <br />
//                     <Text type="secondary">
//                       {moment(selectedRequisition.sourcingDetails.submissionDate).format('MMM DD, YYYY HH:mm')}
//                     </Text>
//                     <br />
//                     <Text style={{ fontSize: '12px' }}>
//                       Sent to {selectedRequisition.sourcingDetails.selectedSuppliers.length} supplier(s)
//                     </Text>
//                   </Timeline.Item>
//                   <Timeline.Item color="purple">
//                     <Text strong>Expected Quote Response</Text>
//                     <br />
//                     <Text type="secondary">
//                       {moment(selectedRequisition.sourcingDetails.expectedQuoteResponse).format('MMM DD, YYYY')}
//                     </Text>
//                   </Timeline.Item>
//                 </Timeline>
//               </Card>
//             )}

//             {/* Action Buttons */}
//             <Space style={{ marginTop: '16px' }}>
//               {selectedRequisition.sourcingStatus === 'pending_sourcing' && (
//                 <Button 
//                   type="primary" 
//                   icon={<ShoppingCartOutlined />}
//                   onClick={() => {
//                     setDetailDrawerVisible(false);
//                     handleStartSourcing(selectedRequisition);
//                   }}
//                 >
//                   Start Sourcing Process
//                 </Button>
//               )}
//               {selectedRequisition.sourcingStatus === 'in_progress' && (
//                 <Button 
//                   type="primary" 
//                   ghost
//                   icon={<SettingOutlined />}
//                   onClick={() => {
//                     setDetailDrawerVisible(false);
//                     handleStartSourcing(selectedRequisition);
//                   }}
//                 >
//                   Manage Sourcing
//                 </Button>
//               )}
//               <Button icon={<CopyOutlined />}>
//                 Copy Requisition ID
//               </Button>
//               <Button icon={<DownloadOutlined />}>
//                 Download PDF
//               </Button>
//             </Space>
//           </div>
//         )}
//       </Drawer>

//       {/* Sourcing Management Drawer */}
//       <Drawer
//         title={
//           <Space>
//             <ShoppingCartOutlined />
//             Sourcing Management - {selectedRequisition?.title}
//           </Space>
//         }
//         placement="right"
//         width={1000}
//         open={sourcingDrawerVisible}
//         onClose={() => {
//           setSourcingDrawerVisible(false);
//           setSelectedRequisition(null);
//           setCurrentStep(0);
//         }}
//         footer={
//           <div style={{ textAlign: 'right' }}>
//             <Space>
//               <Button onClick={() => setSourcingDrawerVisible(false)}>
//                 Cancel
//               </Button>
//               {currentStep > 0 && (
//                 <Button onClick={() => setCurrentStep(currentStep - 1)}>
//                   Previous
//                 </Button>
//               )}
//               {currentStep < sourcingSteps.length - 1 ? (
//                 <Button 
//                   type="primary" 
//                   onClick={() => setCurrentStep(currentStep + 1)}
//                   disabled={currentStep === 0 && selectedSuppliers.length === 0}
//                 >
//                   Next
//                 </Button>
//               ) : (
//                 <Button 
//                   type="primary" 
//                   icon={<SendOutlined />}
//                   loading={loading}
//                   onClick={handleSubmitSourcing}
//                 >
//                   Send to Suppliers
//                 </Button>
//               )}
//             </Space>
//           </div>
//         }
//       >
//         {selectedRequisition && (
//           <div>
//             {/* Progress Steps */}
//             <Steps current={currentStep} style={{ marginBottom: '32px' }}>
//               {sourcingSteps.map((step, index) => (
//                 <Step key={index} title={step.title} description={step.description} />
//               ))}
//             </Steps>

//             {/* Step 0: Supplier Selection */}
//             {currentStep === 0 && (
//               <div>
//                 <Card size="small" title="Available Suppliers" style={{ marginBottom: '16px' }}>
//                   <Alert
//                     message={`Found ${suppliers.length} supplier(s) for category: ${selectedRequisition.category}`}
//                     description="Select suppliers you want to invite for quotation. The system automatically filtered suppliers based on the item category."
//                     type="info"
//                     showIcon
//                     style={{ marginBottom: '16px' }}
//                   />
                  
//                   {suppliers.length === 0 ? (
//                     <Alert
//                       message="No suppliers found"
//                       description="No suppliers are registered for this category. Please contact the system administrator."
//                       type="warning"
//                       showIcon
//                     />
//                   ) : (
//                     <div>
//                       {suppliers.map(supplier => renderSupplierCard(supplier))}
//                     </div>
//                   )}
//                 </Card>

//                 <Card size="small" title="Selection Summary">
//                   <Text strong>{selectedSuppliers.length}</Text> supplier(s) selected
//                   {selectedSuppliers.length > 0 && (
//                     <div style={{ marginTop: '8px' }}>
//                       <Space wrap>
//                         {selectedSuppliers.map(supplierId => {
//                           const supplier = suppliers.find(s => s.id === supplierId);
//                           return supplier ? (
//                             <Tag key={supplierId} color="blue" closable onClose={() => handleSupplierSelection(supplierId, false)}>
//                               {supplier.name}
//                             </Tag>
//                           ) : null;
//                         })}
//                       </Space>
//                     </div>
//                   )}
//                 </Card>
//               </div>
//             )}

//             {/* Step 1: Sourcing Criteria */}
//             {currentStep === 1 && (
//               <Form form={sourcingForm} layout="vertical">
//                 <Card size="small" title="Sourcing Requirements" style={{ marginBottom: '16px' }}>
//                   <Row gutter={[16, 16]}>
//                     <Col span={12}>
//                       <Form.Item
//                         name="expectedDeliveryDate"
//                         label="Expected Delivery Date"
//                         rules={[{ required: true, message: 'Please select expected delivery date' }]}
//                       >
//                         <DatePicker 
//                           style={{ width: '100%' }}
//                           disabledDate={(current) => current && current < moment().add(1, 'day')}
//                         />
//                       </Form.Item>
//                     </Col>
//                     <Col span={12}>
//                       <Form.Item
//                         name="paymentTerms"
//                         label="Payment Terms"
//                         rules={[{ required: true, message: 'Please select payment terms' }]}
//                       >
//                         <Select placeholder="Select payment terms">
//                           <Option value="15 days">15 days</Option>
//                           <Option value="30 days">30 days</Option>
//                           <Option value="45 days">45 days</Option>
//                           <Option value="60 days">60 days</Option>
//                           <Option value="Cash on delivery">Cash on delivery</Option>
//                           <Option value="Advance payment">Advance payment</Option>
//                         </Select>
//                       </Form.Item>
//                     </Col>
//                   </Row>

//                   <Row gutter={[16, 16]}>
//                     <Col span={12}>
//                       <Form.Item
//                         name="quotationDeadline"
//                         label="Quotation Response Deadline"
//                         rules={[{ required: true, message: 'Please select quotation deadline' }]}
//                       >
//                         <DatePicker 
//                           style={{ width: '100%' }}
//                           disabledDate={(current) => current && current < moment().add(1, 'day')}
//                           defaultValue={moment().add(5, 'days')}
//                         />
//                       </Form.Item>
//                     </Col>
//                     <Col span={12}>
//                       <Form.Item
//                         name="deliveryLocation"
//                         label="Delivery Location"
//                         rules={[{ required: true, message: 'Please specify delivery location' }]}
//                         initialValue={selectedRequisition.deliveryLocation}
//                       >
//                         <Input placeholder="Specify delivery location" />
//                       </Form.Item>
//                     </Col>
//                   </Row>
//                 </Card>

//                 <Card size="small" title="Evaluation Criteria" style={{ marginBottom: '16px' }}>
//                   <Alert
//                     message="Evaluation Weights"
//                     description="Set the importance weights for each evaluation criterion. Total must equal 100%."
//                     type="info"
//                     showIcon
//                     style={{ marginBottom: '16px' }}
//                   />
                  
//                   <Row gutter={[16, 16]}>
//                     <Col span={8}>
//                       <Form.Item
//                         name={['evaluationCriteria', 'quality']}
//                         label="Quality Weight (%)"
//                         rules={[{ required: true, message: 'Please set quality weight' }]}
//                       >
//                         <InputNumber 
//                           min={0} 
//                           max={100} 
//                           style={{ width: '100%' }}
//                           formatter={value => `${value}%`}
//                           parser={value => value.replace('%', '')}
//                         />
//                       </Form.Item>
//                     </Col>
//                     <Col span={8}>
//                       <Form.Item
//                         name={['evaluationCriteria', 'cost']}
//                         label="Cost Weight (%)"
//                         rules={[{ required: true, message: 'Please set cost weight' }]}
//                       >
//                         <InputNumber 
//                           min={0} 
//                           max={100} 
//                           style={{ width: '100%' }}
//                           formatter={value => `${value}%`}
//                           parser={value => value.replace('%', '')}
//                         />
//                       </Form.Item>
//                     </Col>
//                     <Col span={8}>
//                       <Form.Item
//                         name={['evaluationCriteria', 'delivery']}
//                         label="Delivery Weight (%)"
//                         rules={[{ required: true, message: 'Please set delivery weight' }]}
//                       >
//                         <InputNumber 
//                           min={0} 
//                           max={100} 
//                           style={{ width: '100%' }}
//                           formatter={value => `${value}%`}
//                           parser={value => value.replace('%', '')}
//                         />
//                       </Form.Item>
//                     </Col>
//                   </Row>
//                 </Card>

//                 <Card size="small" title="Additional Requirements" style={{ marginBottom: '16px' }}>
//                   <Form.Item
//                     name="specialRequirements"
//                     label="Special Requirements or Instructions"
//                   >
//                     <TextArea 
//                       rows={4}
//                       placeholder="Enter any special requirements, technical specifications, quality standards, or delivery instructions..."
//                       showCount
//                       maxLength={1000}
//                     />
//                   </Form.Item>

//                   <Form.Item
//                     name="attachments"
//                     label="Technical Specifications (Optional)"
//                   >
//                     <Upload.Dragger
//                       multiple
//                       beforeUpload={() => false}
//                       accept=".pdf,.doc,.docx,.jpg,.png,.xlsx"
//                     >
//                       <p className="ant-upload-drag-icon">
//                         <UploadOutlined />
//                       </p>
//                       <p className="ant-upload-text">Click or drag file to upload technical specifications</p>
//                       <p className="ant-upload-hint">
//                         Support for multiple file upload. Accepted formats: PDF, DOC, DOCX, JPG, PNG, XLSX
//                       </p>
//                     </Upload.Dragger>
//                   </Form.Item>
//                 </Card>
//               </Form>
//             )}

//             {/* Step 2: Review & Submit */}
//             {currentStep === 2 && (
//               <div>
//                 <Alert
//                   message="Review Sourcing Details"
//                   description="Please review all details before sending the Request for Quotation (RFQ) to selected suppliers."
//                   type="info"
//                   showIcon
//                   style={{ marginBottom: '16px' }}
//                 />

//                 <Card size="small" title="Selected Suppliers" style={{ marginBottom: '16px' }}>
//                   <List
//                     dataSource={selectedSuppliers.map(id => suppliers.find(s => s.id === id)).filter(Boolean)}
//                     renderItem={supplier => (
//                       <List.Item>
//                         <List.Item.Meta
//                           avatar={<Avatar icon={<TeamOutlined />} />}
//                           title={supplier.name}
//                           description={
//                             <div>
//                               <Text type="secondary">{supplier.email} | {supplier.phone}</Text>
//                               <br />
//                               <Space size="small">
//                                 <Tag color="blue">Rating: {supplier.rating}/5</Tag>
//                                 <Tag color="green">{supplier.reliability}</Tag>
//                               </Space>
//                             </div>
//                           }
//                         />
//                       </List.Item>
//                     )}
//                   />
//                 </Card>

//                 <Card size="small" title="Sourcing Summary" style={{ marginBottom: '16px' }}>
//                   {sourcingForm.getFieldsValue() && (
//                     <Descriptions column={2} size="small">
//                       <Descriptions.Item label="Expected Delivery">
//                         <CalendarOutlined /> {sourcingForm.getFieldValue('expectedDeliveryDate')?.format('MMM DD, YYYY')}
//                       </Descriptions.Item>
//                       <Descriptions.Item label="Payment Terms">
//                         <BankOutlined /> {sourcingForm.getFieldValue('paymentTerms')}
//                       </Descriptions.Item>
//                       <Descriptions.Item label="Quote Deadline">
//                         <ClockCircleOutlined /> {sourcingForm.getFieldValue('quotationDeadline')?.format('MMM DD, YYYY')}
//                       </Descriptions.Item>
//                       <Descriptions.Item label="Delivery Location">
//                         <TruckOutlined /> {sourcingForm.getFieldValue('deliveryLocation')}
//                       </Descriptions.Item>
//                       <Descriptions.Item label="Quality Weight">
//                         <StarOutlined /> {sourcingForm.getFieldValue(['evaluationCriteria', 'quality'])}%
//                       </Descriptions.Item>
//                       <Descriptions.Item label="Cost Weight">
//                         <DollarOutlined /> {sourcingForm.getFieldValue(['evaluationCriteria', 'cost'])}%
//                       </Descriptions.Item>
//                       <Descriptions.Item label="Delivery Weight">
//                         <TruckOutlined /> {sourcingForm.getFieldValue(['evaluationCriteria', 'delivery'])}%
//                       </Descriptions.Item>
//                       <Descriptions.Item label="Total Weight">
//                         {(sourcingForm.getFieldValue(['evaluationCriteria', 'quality']) || 0) + 
//                          (sourcingForm.getFieldValue(['evaluationCriteria', 'cost']) || 0) + 
//                          (sourcingForm.getFieldValue(['evaluationCriteria', 'delivery']) || 0)}%
//                       </Descriptions.Item>
//                     </Descriptions>
//                   )}
//                 </Card>

//                 <Card size="small" title="Items to be Quoted">
//                   <Table
//                     columns={[
//                       {
//                         title: 'Item Description',
//                         dataIndex: 'description',
//                         key: 'description'
//                       },
//                       {
//                         title: 'Quantity',
//                         dataIndex: 'quantity',
//                         key: 'quantity',
//                         width: 80,
//                         align: 'center'
//                       },
//                       {
//                         title: 'Unit',
//                         dataIndex: 'unit',
//                         key: 'unit',
//                         width: 80,
//                         align: 'center'
//                       },
//                       {
//                         title: 'Specifications',
//                         dataIndex: 'specifications',
//                         key: 'specifications'
//                       }
//                     ]}
//                     dataSource={selectedRequisition.items}
//                     pagination={false}
//                     size="small"
//                     rowKey="id"
//                   />
//                 </Card>

//                 {/* Email Preview */}
//                 <Card size="small" title="Email Preview" style={{ marginTop: '16px' }}>
//                   <div style={{ 
//                     background: '#f5f5f5', 
//                     padding: '16px', 
//                     borderRadius: '4px',
//                     fontFamily: 'monospace',
//                     fontSize: '12px'
//                   }}>
//                     <Text strong>Subject:</Text> Request for Quotation - {selectedRequisition.title} ({selectedRequisition.id})
//                     <br /><br />
                    
//                     <Text>Dear Supplier,</Text>
//                     <br /><br />
                    
//                     We invite you to submit a quotation for the following items:
//                     <br /><br />
                    
//                     <Text strong>Requisition Details:</Text>
//                     <br />
//                     - Requisition ID: {selectedRequisition.id}
//                     <br />
//                     - Title: {selectedRequisition.title}
//                     <br />
//                     - Expected Delivery: {sourcingForm.getFieldValue('expectedDeliveryDate')?.format('MMM DD, YYYY')}
//                     <br />
//                     - Payment Terms: {sourcingForm.getFieldValue('paymentTerms')}
//                     <br />
//                     - Delivery Location: {sourcingForm.getFieldValue('deliveryLocation')}
//                     <br /><br />
                    
//                     <Text strong>Evaluation Criteria:</Text>
//                     <br />
//                     - Quality: {sourcingForm.getFieldValue(['evaluationCriteria', 'quality'])}%
//                     <br />
//                     - Cost: {sourcingForm.getFieldValue(['evaluationCriteria', 'cost'])}%
//                     <br />
//                     - Delivery Time: {sourcingForm.getFieldValue(['evaluationCriteria', 'delivery'])}%
//                     <br /><br />
                    
//                     Please submit your quotation by {sourcingForm.getFieldValue('quotationDeadline')?.format('MMM DD, YYYY')}.
//                     <br /><br />
                    
//                     Best regards,
//                     <br />
//                     Procurement Team
//                   </div>
//                 </Card>
//               </div>
//             )}
//           </div>
//         )}
//       </Drawer>
//     </div>
//   );
// };

// export default BuyerRequisitionPortal;


