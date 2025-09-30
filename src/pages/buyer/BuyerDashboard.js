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
import EnhancedSupplierSelection from '../../components/EnhancedSupplierSelection';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const { Step } = Steps;

const BuyerRequisitionPortal = () => {
  const [requisitions, setRequisitions] = useState([]);
  const [selectedRequisition, setSelectedRequisition] = useState(null);
  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false);
  const [sourcingDrawerVisible, setSourcingDrawerVisible] = useState(false);
  const [supplierSelectionVisible, setSupplierSelectionVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suppliers, setSuppliers] = useState([]);
  const [selectedSuppliers, setSelectedSuppliers] = useState([]);
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
    return <Tag color={urgencyMap[urgency]}>{urgency}</Tag>;
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

  // Enhanced supplier selection handler
  const handleSupplierSelectionConfirm = async (supplierData) => {
    try {
      console.log('Supplier selection confirmed:', supplierData);
      
      // Validate form data first
      const isValid = await validateSourcingForm();
      if (!isValid) return;

      setLoading(true);

      // Get form values
      const formValues = sourcingForm.getFieldsValue(true);
      console.log('Form values:', formValues);

      // Prepare RFQ data with both registered and external suppliers
      const rfqData = {
        selectedSuppliers: supplierData.selectedSuppliers || [],
        externalSupplierEmails: supplierData.externalSupplierEmails || [],
        expectedDeliveryDate: formValues.expectedDeliveryDate ? formValues.expectedDeliveryDate.toISOString() : null,
        quotationDeadline: formValues.quotationDeadline ? formValues.quotationDeadline.toISOString() : null,
        paymentTerms: formValues.paymentTerms || '30 days',
        deliveryLocation: formValues.deliveryLocation || selectedRequisition.deliveryLocation,
        specialRequirements: formValues.specialRequirements || '',
        evaluationCriteria: formValues.evaluationCriteria || { quality: 40, cost: 35, delivery: 25 }
      };

      console.log('Prepared enhanced RFQ data:', rfqData);

      // Validate RFQ data using API utility
      const validation = buyerRequisitionAPI.validateRFQData(rfqData);
      
      if (!validation.isValid) {
        validation.errors.forEach(error => message.error(error));
        setLoading(false);
        return;
      }

      // Show warnings if any
      validation.warnings.forEach(warning => message.warning(warning));

      // Show confirmation with supplier breakdown
      const totalSuppliers = validation.totalSuppliers + validation.totalExternalSuppliers;
      
      Modal.confirm({
        title: 'Confirm RFQ Submission',
        content: (
          <div>
            <p>You are about to send an RFQ to the following suppliers:</p>
            <ul>
              <li><strong>Registered Suppliers:</strong> {validation.totalSuppliers}</li>
              <li><strong>External Suppliers:</strong> {validation.totalExternalSuppliers}</li>
              <li><strong>Total:</strong> {totalSuppliers} supplier(s)</li>
            </ul>
            <p>Quote deadline: {formValues.quotationDeadline?.format('MMM DD, YYYY')}</p>
            <p>Expected delivery: {formValues.expectedDeliveryDate?.format('MMM DD, YYYY')}</p>
            {validation.hasExternalSuppliers && (
              <Alert 
                message="External suppliers will receive invitation links via email to submit quotes without registering." 
                type="info" 
                showIcon 
                style={{ marginTop: '12px' }}
              />
            )}
          </div>
        ),
        onOk: async () => {
          try {
            // Submit RFQ to API
            console.log('Sending RFQ for requisition:', selectedRequisition.id);
            const response = await buyerRequisitionAPI.createAndSendRFQ(selectedRequisition.id, rfqData);

            console.log('RFQ response:', response);

            if (response.success) {
              const { registeredSuppliersInvited = 0, externalSuppliersInvited = 0, totalSuppliersInvited } = response.data;
              
              message.success(
                `RFQ sent successfully! ${totalSuppliersInvited} supplier(s) invited ` +
                `(${registeredSuppliersInvited} registered, ${externalSuppliersInvited} external)`
              );
              
              // Close drawers and reset state
              setSupplierSelectionVisible(false);
              setSourcingDrawerVisible(false);
              setCurrentStep(0);
              setSelectedSuppliers([]);
              setSelectedRequisition(null);
              
              // Reload requisitions to show updated status
              await loadRequisitions();
            } else {
              message.error(response.message || 'Failed to submit RFQ');
            }
          } catch (error) {
            console.error('RFQ submission error:', error);
            message.error(error.message || 'Failed to submit RFQ');
          } finally {
            setLoading(false);
          }
        },
        onCancel: () => {
          setLoading(false);
        }
      });

    } catch (error) {
      console.error('Error in supplier selection:', error);
      message.error(error.message || 'Failed to process supplier selection');
      setLoading(false);
    }
  };

  const validateSourcingForm = async () => {
    try {
      // Validate form fields
      await sourcingForm.validateFields();
      
      // Get form values for additional validation
      const expectedDeliveryDate = sourcingForm.getFieldValue('expectedDeliveryDate');
      const quotationDeadline = sourcingForm.getFieldValue('quotationDeadline');

      // Validate dates are present
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
      console.log('Opening supplier selection modal...');
      
      // Validate form first
      const isValid = await validateSourcingForm();
      if (!isValid) return;

      // Open supplier selection modal
      setSupplierSelectionVisible(true);
      
    } catch (error) {
      console.error('Error opening supplier selection:', error);
      message.error(error.message || 'Failed to open supplier selection');
    }
  };

  const columns = [
    {
      title: 'Requisition Details',
      key: 'details',
      render: (_, record) => (
        <Space direction="vertical" size="small">
          <Text strong>{record.title}</Text>
          <Space size="small">
            <Tag color="blue">{record.id}</Tag>
            <Tag color="green">{record.category}</Tag>
          </Space>
        </Space>
      ),
      width: 200
    },
    {
      title: 'Requester',
      key: 'requester',
      render: (_, record) => (
        <Space direction="vertical" size="small">
          <Text>{record.requester}</Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.department}
          </Text>
        </Space>
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
      render: (items) => (
        <Badge count={Array.isArray(items) ? items.length : 0} showZero>
          <FileTextOutlined />
        </Badge>
      ),
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
          <Space direction="vertical" size="small">
            <Text style={{ color: isOverdue ? '#ff4d4f' : 'inherit' }}>
              {moment(deliveryDate).format('MMM DD, YYYY')}
            </Text>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {moment(deliveryDate).fromNow()}
            </Text>
            {isOverdue && <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />}
          </Space>
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
        <Space>
          <Tooltip title="View Details">
            <Button
              type="link"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handleViewDetails(record)}
            />
          </Tooltip>
          {record.sourcingStatus === 'pending_sourcing' && (
            <Tooltip title="Start Sourcing">
              <Button
                type="primary"
                size="small"
                icon={<SendOutlined />}
                onClick={() => handleStartSourcing(record)}
              >
                Source
              </Button>
            </Tooltip>
          )}
          {record.sourcingStatus === 'in_progress' && (
            <Tooltip title="Manage Sourcing">
              <Button
                type="default"
                size="small"
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
      style={{ marginBottom: '12px' }}
      bodyStyle={{ padding: '12px' }}
    >
      <Space direction="vertical" style={{ width: '100%' }}>
        <Space>
          <Checkbox
            checked={selectedSuppliers.includes(supplier.id)}
            onChange={(e) => handleSupplierSelection(supplier.id, e.target.checked)}
            style={{ marginRight: '12px' }}
          />
          <Space direction="vertical" size="small">
            <Text strong>{supplier.name}</Text>
            <Space size="small">
              <Rate disabled defaultValue={supplier.rating || 0} size="small" />
              <Text type="secondary" style={{ fontSize: '12px' }}>
                {supplier.rating}/5.0
              </Text>
            </Space>
          </Space>
        </Space>
        
        <Row gutter={[8, 8]}>
          <Col span={12}>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              Contact:
            </Text>
            <div>
              <MailOutlined style={{ marginRight: '4px' }} />
              <Text style={{ fontSize: '11px' }}>{supplier.email}</Text>
            </div>
            <div>
              <PhoneOutlined style={{ marginRight: '4px' }} />
              <Text style={{ fontSize: '11px' }}>{supplier.phone}</Text>
            </div>
          </Col>
          <Col span={12}>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              Performance:
            </Text>
            <div>
              <Tag color="green" size="small">{supplier.reliability}</Tag>
            </div>
            <div>
              <Tag color="blue" size="small">{supplier.priceCompetitiveness}</Tag>
            </div>
          </Col>
        </Row>
        
        <div>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            Specializations:
          </Text>
          <div style={{ marginTop: '4px' }}>
            {supplier.specialization?.slice(0, 3).map(spec => (
              <Tag key={spec} size="small" color="processing">{spec}</Tag>
            ))}
            {supplier.specialization?.length > 3 && (
              <Tag size="small">+{supplier.specialization.length - 3}</Tag>
            )}
          </div>
        </div>
      </Space>
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
      {/* Header */}
      <Row justify="space-between" align="middle" style={{ marginBottom: '24px' }}>
        <Col>
          <Title level={2}>
            <ShoppingCartOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
            Purchase Requisition Management
          </Title>
        </Col>
        <Col>
          <Space>
            <Button icon={<ExportOutlined />}>
              Export Report
            </Button>
            <Button icon={<FilterOutlined />}>
              Filters
            </Button>
          </Space>
        </Col>
      </Row>

      {/* Statistics */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
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
            title="In Progress"
            value={stats.inProgress}
            prefix={<SendOutlined />}
            valueStyle={{ color: '#1890ff' }}
          />
        </Col>
        <Col span={6}>
          <Statistic
            title="Quotes Received"
            value={stats.quoted}
            prefix={<MailOutlined />}
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
          message={`You have ${stats.pending} requisition(s) pending sourcing`}
          description="These requisitions are ready for supplier selection and RFQ creation."
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
      <Tabs 
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: 'pending',
            label: (
              <Badge count={stats.pending} offset={[10, 0]}>
                Pending Sourcing ({stats.pending})
              </Badge>
            )
          },
          {
            key: 'in_progress',
            label: (
              <Badge count={stats.inProgress} offset={[10, 0]}>
                In Progress ({stats.inProgress})
              </Badge>
            )
          },
          {
            key: 'quoted',
            label: `Quotes Received (${stats.quoted})`
          },
          {
            key: 'completed',
            label: `Completed (${stats.completed})`
          },
          {
            key: 'all',
            label: 'All Requisitions'
          }
        ]}
      />

      {/* Requisitions Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={getFilteredRequisitions()}
          loading={loading}
          rowKey="id"
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `${range[0]}-${range[1]} of ${total} requisitions`
          }}
          scroll={{ x: 'max-content' }}
        />
      </Card>

      {/* Enhanced Supplier Selection Modal */}
      <EnhancedSupplierSelection
        visible={supplierSelectionVisible}
        onCancel={() => setSupplierSelectionVisible(false)}
        onConfirm={handleSupplierSelectionConfirm}
        loading={loading}
        category={selectedRequisition?.category}
      />

      {/* Requisition Details Drawer */}
      <Drawer
        title={
          <Title level={4}>
            Requisition Details
          </Title>
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
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            {/* Requisition Header */}
            <Card size="small">
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Text type="secondary">Requisition ID:</Text>
                  <div><Text strong>{selectedRequisition.id}</Text></div>
                  <Text type="secondary">Title:</Text>
                  <div><Text strong>{selectedRequisition.title}</Text></div>
                  <Text type="secondary">Requester:</Text>
                  <div>
                    <UserOutlined style={{ marginRight: 8 }} />
                    {selectedRequisition.requester}
                  </div>
                  <Text type="secondary">Department:</Text>
                  <div><Text>{selectedRequisition.department}</Text></div>
                  <Text type="secondary">Request Date:</Text>
                  <div>
                    <CalendarOutlined style={{ marginRight: 8 }} />
                    {moment(selectedRequisition.requestDate).format('MMM DD, YYYY')}
                  </div>
                </Col>
                <Col span={12}>
                  <Text type="secondary">Expected Delivery:</Text>
                  <div>
                    <TruckOutlined style={{ marginRight: 8 }} />
                    {selectedRequisition.expectedDeliveryDate ? 
                      moment(selectedRequisition.expectedDeliveryDate).format('MMM DD, YYYY') : 
                      'Not specified'
                    }
                  </div>
                  <Text type="secondary">Budget:</Text>
                  <div>
                    <DollarOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                    <Text strong style={{ color: '#1890ff' }}>
                      XAF {selectedRequisition.budget?.toLocaleString() || 'Not specified'}
                    </Text>
                  </div>
                  <Text type="secondary">Urgency:</Text>
                  <div>
                    {getUrgencyTag(selectedRequisition.urgency)}
                  </div>
                  <Text type="secondary">Category:</Text>
                  <div><Tag color="blue">{selectedRequisition.category}</Tag></div>
                  <Text type="secondary">Sourcing Status:</Text>
                  <div>
                    {getStatusTag(selectedRequisition.sourcingStatus)}
                  </div>
                  <Text type="secondary">Delivery Location:</Text>
                  <div>
                    <GlobalOutlined style={{ marginRight: 8 }} />
                    {selectedRequisition.deliveryLocation || 'Not specified'}
                  </div>
                </Col>
              </Row>
            </Card>

            {/* Items List */}
            <Card size="small" title="Items Requested">
              <Table
                columns={[
                  { title: 'Description', dataIndex: 'description', key: 'description' },
                  { title: 'Quantity', dataIndex: 'quantity', key: 'quantity', width: 80 },
                  { title: 'Unit', dataIndex: 'unit', key: 'unit', width: 80 },
                  { title: 'Specifications', dataIndex: 'specifications', key: 'specifications' }
                ]}
                dataSource={selectedRequisition.items || []}
                pagination={false}
                size="small"
                rowKey={(record, index) => index}
              />
            </Card>

            {/* Notes */}
            {selectedRequisition.notes && (
              <Card size="small" title="Notes">
                <Paragraph>{selectedRequisition.notes}</Paragraph>
              </Card>
            )}

            {/* Sourcing History */}
            {selectedRequisition.sourcingDetails && (
              <Card size="small" title="Sourcing Timeline">
                <Timeline size="small">
                  <Timeline.Item color="blue">
                    <Text strong>Assignment to Buyer</Text>
                    <div>
                      <Text type="secondary">
                        {moment(selectedRequisition.assignmentDate).format('MMM DD, YYYY HH:mm')}
                      </Text>
                    </div>
                  </Timeline.Item>
                  <Timeline.Item color="green">
                    <Text strong>Sourcing Initiated</Text>
                    <div>
                      <Text type="secondary">
                        {moment(selectedRequisition.sourcingDetails.submissionDate).format('MMM DD, YYYY HH:mm')}
                      </Text>
                    </div>
                    <div>
                      <Text type="secondary">
                        Sent to {selectedRequisition.sourcingDetails.selectedSuppliers?.length || 0} supplier(s)
                      </Text>
                    </div>
                  </Timeline.Item>
                  <Timeline.Item color="orange">
                    <Text strong>Expected Quote Response</Text>
                    <div>
                      <Text type="secondary">
                        {moment(selectedRequisition.sourcingDetails.expectedQuoteResponse).format('MMM DD, YYYY')}
                      </Text>
                    </div>
                  </Timeline.Item>
                </Timeline>
              </Card>
            )}

            {/* Action Buttons */}
            <Card size="small">
              <Space>
                {selectedRequisition.sourcingStatus === 'pending_sourcing' && (
                  <Button
                    type="primary"
                    icon={<SendOutlined />}
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
                    type="default"
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
            </Card>
          </Space>
        )}
      </Drawer>

      {/* Sourcing Management Drawer */}
      <Drawer
        title={
          <Title level={4}>
            Sourcing Management - {selectedRequisition?.title}
          </Title>
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
          <Row justify="space-between">
            <Col>
              <Button onClick={() => setSourcingDrawerVisible(false)}>
                Cancel
              </Button>
              {currentStep > 0 && (
                <Button onClick={() => setCurrentStep(currentStep - 1)}>
                  Previous
                </Button>
              )}
            </Col>
            <Col>
              <Space>
                <Text type="secondary">
                  Step {currentStep + 1} of {sourcingSteps.length}
                </Text>
                {currentStep < sourcingSteps.length - 1 ? (
                  <Button 
                    type="primary" 
                    onClick={() => setCurrentStep(currentStep + 1)}
                    disabled={currentStep === 0 && selectedSuppliers.length === 0}
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
                    Select Suppliers
                  </Button>
                )}
              </Space>
            </Col>
          </Row>
        }
      >
        {selectedRequisition && (
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            {/* Progress Steps */}
            <Steps current={currentStep}>
              {sourcingSteps.map((step, index) => (
                <Step key={index} title={step.title} description={step.description} />
              ))}
            </Steps>

            {/* Step Content */}
            {currentStep === 0 && (
              <Alert
                message="Ready for Supplier Selection"
                description="Click 'Select Suppliers' to choose registered suppliers and add external supplier emails for this RFQ."
                type="info"
                showIcon
              />
            )}

            {currentStep === 1 && (
              <Card title="Sourcing Criteria" bordered={false}>
                <Form
                  form={sourcingForm}
                  layout="vertical"
                  onFinish={handleSubmitSourcing}
                >
                  <Row gutter={[16, 16]}>
                    <Col span={12}>
                      <Form.Item
                        name="expectedDeliveryDate"
                        label="Expected Delivery Date"
                        rules={[{ required: true, message: 'Expected delivery date is required' }]}
                      >
                        <DatePicker 
                          style={{ width: '100%' }}
                          disabledDate={current => current && current < moment().add(1, 'day')}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name="quotationDeadline"
                        label="Quotation Deadline"
                        rules={[{ required: true, message: 'Quotation deadline is required' }]}
                      >
                        <DatePicker 
                          style={{ width: '100%' }}
                          disabledDate={current => current && current < moment().add(1, 'day')}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name="paymentTerms"
                        label="Payment Terms"
                        rules={[{ required: true, message: 'Payment terms are required' }]}
                      >
                        <Select>
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
                      >
                        <Input placeholder="Delivery address" />
                      </Form.Item>
                    </Col>
                  </Row>
                  
                  <Divider>Evaluation Criteria</Divider>
                  
                  <Row gutter={[16, 16]}>
                    <Col span={8}>
                      <Form.Item
                        name={['evaluationCriteria', 'quality']}
                        label="Quality Weight (%)"
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

                  <Form.Item
                    name="specialRequirements"
                    label="Special Requirements (Optional)"
                  >
                    <TextArea 
                      rows={3}
                      placeholder="Any special requirements or conditions for this procurement..."
                    />
                  </Form.Item>
                </Form>
              </Card>
            )}
          </Space>
        )}
      </Drawer>
    </div>
  );
};

export default BuyerRequisitionPortal;













// import React, { useState, useEffect } from 'react';
// import {
//   Card,
//   Row,
//   Col,
//   Statistic,
//   Typography,
//   Space,
//   Button,
//   Alert,
//   Progress,
//   Timeline,
//   List,
//   Avatar,
//   Tag,
//   Divider,
//   Tabs,
//   Badge,
//   Tooltip,
//   message,
//   Spin
// } from 'antd';
// import {
//   ShoppingCartOutlined,
//   FileTextOutlined,
//   TeamOutlined,
//   TruckOutlined,
//   ClockCircleOutlined,
//   CheckCircleOutlined,
//   DollarOutlined,
//   BarChartOutlined,
//   ExclamationCircleOutlined,
//   CalendarOutlined,
//   PhoneOutlined,
//   MailOutlined,
//   StarOutlined,
//   RiseOutlined,
//   FallOutlined,
//   UserOutlined,
//   ContactsOutlined,
//   DeliveredProcedureOutlined,
//   SolutionOutlined
// } from '@ant-design/icons';
// import { useNavigate } from 'react-router-dom';
// import moment from 'moment';
// import { buyerRequisitionAPI } from '../../services/buyerRequisitionAPI';

// const { Title, Text, Paragraph } = Typography;

// const BuyerDashboard = () => {
//   const navigate = useNavigate();
//   const [loading, setLoading] = useState(true);
//   const [dashboardData, setDashboardData] = useState({
//     stats: {
//       pendingRequisitions: 0,
//       inProgressSourcing: 0,
//       quotesReceived: 0,
//       completedThisMonth: 0,
//       activeSuppliers: 0,
//       averageResponseTime: 0,
//       costSavingsThisMonth: 0,
//       onTimeDeliveryRate: 0
//     },
//     recentActivity: [],
//     urgentTasks: [],
//     topSuppliers: []
//   });

//   // Load dashboard data on component mount
//   useEffect(() => {
//     loadDashboardData();
//   }, []);

//   const loadDashboardData = async () => {
//     try {
//       setLoading(true);
      
//       // Get current month filters
//       const currentMonth = moment().startOf('month').toISOString();
//       const endOfMonth = moment().endOf('month').toISOString();
      
//       const filters = {
//         startDate: currentMonth,
//         endDate: endOfMonth
//       };

//       // Fetch dashboard data from API
//       const response = await buyerRequisitionAPI.getBuyerDashboard(filters);
      
//       if (response.success) {
//         // Ensure the response has the expected structure
//         setDashboardData({
//           stats: {
//             pendingRequisitions: response.data?.stats?.pendingRequisitions || 0,
//             inProgressSourcing: response.data?.stats?.inProgressSourcing || 0,
//             quotesReceived: response.data?.stats?.quotesReceived || 0,
//             completedThisMonth: response.data?.stats?.completedThisMonth || 0,
//             activeSuppliers: response.data?.stats?.activeSuppliers || 0,
//             averageResponseTime: response.data?.stats?.averageResponseTime || 0,
//             costSavingsThisMonth: response.data?.stats?.costSavingsThisMonth || 0,
//             onTimeDeliveryRate: response.data?.stats?.onTimeDeliveryRate || 0
//           },
//           recentActivity: response.data?.recentActivity || [],
//           urgentTasks: response.data?.urgentTasks || [],
//           topSuppliers: response.data?.topSuppliers || []
//         });
//       } else {
//         message.error('Failed to load dashboard data');
//       }
//     } catch (error) {
//       console.error('Error loading dashboard:', error);
//       message.error('Error loading dashboard data. Please try again.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const getActivityIcon = (type) => {
//     const icons = {
//       quote_received: <FileTextOutlined />,
//       requisition_assigned: <SolutionOutlined />,
//       rfq_sent: <MailOutlined />,
//       delivery_confirmed: <TruckOutlined />
//     };
//     return icons[type] || <ClockCircleOutlined />;
//   };

//   const getStatusColor = (status) => {
//     const colors = {
//       quotes_received: 'green',
//       supplier_selection: 'orange',
//       awaiting_quotes: 'blue',
//       completed: 'success'
//     };
//     return colors[status] || 'default';
//   };

//   const getPriorityColor = (priority) => {
//     const colors = {
//       high: 'red',
//       medium: 'orange',
//       low: 'green'
//     };
//     return colors[priority] || 'default';
//   };

//   // Safe access to stats with fallback values
//   const stats = dashboardData?.stats || {};
  
//   const quickActions = [
//     {
//       title: 'View Pending Requisitions',
//       description: `${stats.pendingRequisitions || 0} items need your attention`,
//       icon: <ShoppingCartOutlined />,
//       color: '#1890ff',
//       path: '/buyer/requisitions',
//       count: stats.pendingRequisitions || 0
//     },
//     {
//       title: 'Evaluate Quotes',
//       description: `${stats.quotesReceived || 0} quotes ready for evaluation`,
//       icon: <FileTextOutlined />,
//       color: '#52c41a',
//       path: '/buyer/quotes',
//       count: stats.quotesReceived || 0
//     },
//     {
//       title: 'Manage Suppliers',
//       description: `${stats.activeSuppliers || 0} active suppliers`,
//       icon: <TeamOutlined />,
//       color: '#722ed1',
//       path: '/buyer/suppliers',
//       count: stats.activeSuppliers || 0
//     },
//     {
//       title: 'Track Deliveries',
//       description: 'Monitor ongoing deliveries',
//       icon: <TruckOutlined />,
//       color: '#fa8c16',
//       path: '/buyer/deliveries'
//     }
//   ];

//   if (loading) {
//     return (
//       <div style={{ padding: '24px', textAlign: 'center' }}>
//         <Spin size="large" />
//         <div style={{ marginTop: '16px' }}>
//           <Text>Loading dashboard data...</Text>
//         </div>
//       </div>
//     );
//   }

//   const urgentTasks = dashboardData?.urgentTasks || [];
//   const recentActivity = dashboardData?.recentActivity || [];
//   const topSuppliers = dashboardData?.topSuppliers || [];

//   return (
//     <div style={{ padding: '24px', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
//       {/* Header */}
//       <Card style={{ marginBottom: '24px' }}>
//         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
//           <div>
//             <Title level={2} style={{ margin: 0, color: '#1890ff' }}>
//               <SolutionOutlined /> Buyer Dashboard
//             </Title>
//             <Paragraph type="secondary" style={{ margin: '8px 0 0 0' }}>
//               Procurement workflow management and supplier relations
//             </Paragraph>
//           </div>
//           <Button 
//             type="primary" 
//             icon={<BarChartOutlined />}
//             onClick={() => navigate('/buyer/analytics')}
//           >
//             View Analytics
//           </Button>
//         </div>
//       </Card>

//       {/* Alert for urgent tasks */}
//       {urgentTasks.length > 0 && (
//         <Alert
//           message={`${urgentTasks.length} Urgent Task${urgentTasks.length !== 1 ? 's' : ''} Require Attention`}
//           description="You have high-priority procurement tasks with approaching deadlines."
//           type="error"
//           showIcon
//           action={
//             <Button 
//               size="small" 
//               danger 
//               onClick={() => navigate('/buyer/requisitions?filter=urgent')}
//             >
//               View Tasks
//             </Button>
//           }
//           style={{ marginBottom: '24px' }}
//         />
//       )}

//       {/* Key Performance Statistics */}
//       <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
//         <Col xs={24} sm={12} lg={6}>
//           <Card>
//             <Statistic
//               title="Pending Requisitions"
//               value={stats.pendingRequisitions || 0}
//               prefix={<ClockCircleOutlined />}
//               valueStyle={{ color: '#faad14' }}
//             />
//             <div style={{ marginTop: '8px' }}>
//               <Text type="secondary" style={{ fontSize: '12px' }}>
//                 Need sourcing action
//               </Text>
//             </div>
//           </Card>
//         </Col>
//         <Col xs={24} sm={12} lg={6}>
//           <Card>
//             <Statistic
//               title="In Progress Sourcing"
//               value={stats.inProgressSourcing || 0}
//               prefix={<ShoppingCartOutlined />}
//               valueStyle={{ color: '#1890ff' }}
//             />
//             <div style={{ marginTop: '8px' }}>
//               <Text type="secondary" style={{ fontSize: '12px' }}>
//                 Sourcing activities
//               </Text>
//             </div>
//           </Card>
//         </Col>
//         <Col xs={24} sm={12} lg={6}>
//           <Card>
//             <Statistic
//               title="Quotes Received"
//               value={stats.quotesReceived || 0}
//               prefix={<FileTextOutlined />}
//               valueStyle={{ color: '#52c41a' }}
//             />
//             <div style={{ marginTop: '8px' }}>
//               <Text type="secondary" style={{ fontSize: '12px' }}>
//                 Awaiting evaluation
//               </Text>
//             </div>
//           </Card>
//         </Col>
//         <Col xs={24} sm={12} lg={6}>
//           <Card>
//             <Statistic
//               title="Completed This Month"
//               value={stats.completedThisMonth || 0}
//               prefix={<CheckCircleOutlined />}
//               valueStyle={{ color: '#52c41a' }}
//             />
//             <div style={{ marginTop: '8px' }}>
//               <Text type="secondary" style={{ fontSize: '12px' }}>
//                 Successful procurements
//               </Text>
//             </div>
//           </Card>
//         </Col>
//       </Row>

//       {/* Performance Metrics */}
//       <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
//         <Col xs={24} sm={12} lg={6}>
//           <Card>
//             <Statistic
//               title="Cost Savings"
//               value={stats.costSavingsThisMonth || 0}
//               prefix={<RiseOutlined />}
//               valueStyle={{ color: '#52c41a' }}
//               formatter={(value) => `XAF ${value?.toLocaleString()}`}
//             />
//             <div style={{ marginTop: '8px' }}>
//               <Text type="secondary" style={{ fontSize: '12px' }}>
//                 This month
//               </Text>
//             </div>
//           </Card>
//         </Col>
//         <Col xs={24} sm={12} lg={6}>
//           <Card>
//             <Statistic
//               title="Avg Response Time"
//               value={stats.averageResponseTime || 0}
//               suffix="days"
//               prefix={<ClockCircleOutlined />}
//               valueStyle={{ color: '#1890ff' }}
//             />
//             <div style={{ marginTop: '8px' }}>
//               <Text type="secondary" style={{ fontSize: '12px' }}>
//                 Quote responses
//               </Text>
//             </div>
//           </Card>
//         </Col>
//         <Col xs={24} sm={12} lg={6}>
//           <Card>
//             <Statistic
//               title="On-Time Delivery"
//               value={stats.onTimeDeliveryRate || 0}
//               suffix="%"
//               prefix={<TruckOutlined />}
//               valueStyle={{ color: '#52c41a' }}
//             />
//           </Card>
//         </Col>
//         <Col xs={24} sm={12} lg={6}>
//           <Card>
//             <Statistic
//               title="Active Suppliers"
//               value={stats.activeSuppliers || 0}
//               prefix={<TeamOutlined />}
//               valueStyle={{ color: '#722ed1' }}
//             />
//             <div style={{ marginTop: '8px' }}>
//               <Text type="secondary" style={{ fontSize: '12px' }}>
//                 In supplier network
//               </Text>
//             </div>
//           </Card>
//         </Col>
//       </Row>

//       <Row gutter={[16, 16]}>
//         {/* Quick Actions */}
//         <Col xs={24} lg={12}>
//           <Card title="Quick Actions" style={{ height: '400px' }}>
//             <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
//               {quickActions.map((action, index) => (
//                 <Card
//                   key={index}
//                   hoverable
//                   size="small"
//                   onClick={() => navigate(action.path)}
//                   style={{ cursor: 'pointer' }}
//                   bodyStyle={{ padding: '12px' }}
//                 >
//                   <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
//                     <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
//                       <div style={{ 
//                         width: '40px', 
//                         height: '40px', 
//                         borderRadius: '8px', 
//                         backgroundColor: action.color + '20',
//                         display: 'flex',
//                         alignItems: 'center',
//                         justifyContent: 'center',
//                         color: action.color
//                       }}>
//                         {action.icon}
//                       </div>
//                       <div>
//                         <Text strong>{action.title}</Text>
//                         <div style={{ marginTop: '4px' }}>
//                           <Text type="secondary" style={{ fontSize: '12px' }}>
//                             {action.description}
//                           </Text>
//                         </div>
//                       </div>
//                     </div>
//                     {action.count !== undefined && (
//                       <Badge count={action.count} style={{ backgroundColor: action.color }} />
//                     )}
//                   </div>
//                 </Card>
//               ))}
//             </div>
//           </Card>
//         </Col>

//         {/* Recent Activity */}
//         <Col xs={24} lg={12}>
//           <Card title="Recent Activity" style={{ height: '400px' }}>
//             {recentActivity.length > 0 ? (
//               <List
//                 dataSource={recentActivity}
//                 renderItem={(activity) => (
//                   <List.Item>
//                     <List.Item.Meta
//                       avatar={<Avatar icon={getActivityIcon(activity.type)} size="small" />}
//                       title={activity.title}
//                       description={
//                         <div>
//                           <div style={{ marginBottom: '4px' }}>
//                             <Text type="secondary" style={{ fontSize: '12px' }}>
//                               {activity.description}
//                             </Text>
//                           </div>
//                           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
//                             <Text type="secondary" style={{ fontSize: '11px' }}>
//                               <ClockCircleOutlined /> {moment(activity.timestamp).fromNow()}
//                             </Text>
//                             <Tag color={getPriorityColor(activity.priority)} size="small">
//                               {activity.priority}
//                             </Tag>
//                           </div>
//                         </div>
//                       }
//                     />
//                   </List.Item>
//                 )}
//               />
//             ) : (
//               <div style={{ textAlign: 'center', padding: '40px 0' }}>
//                 <Text type="secondary">No recent activity</Text>
//               </div>
//             )}
//           </Card>
//         </Col>
//       </Row>

//       {/* Bottom Row */}
//       <Row gutter={[16, 16]} style={{ marginTop: '24px' }}>
//         {/* Urgent Tasks */}
//         <Col xs={24} lg={12}>
//           <Card 
//             title="Urgent Tasks"
//             extra={
//               <Button 
//                 type="link" 
//                 onClick={() => navigate('/buyer/requisitions?filter=urgent')}
//               >
//                 View All
//               </Button>
//             }
//           >
//             {urgentTasks.length > 0 ? (
//               <List
//                 dataSource={urgentTasks}
//                 renderItem={(task) => (
//                   <List.Item>
//                     <List.Item.Meta
//                       avatar={<Avatar icon={<ExclamationCircleOutlined />} size="small" />}
//                       title={
//                         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
//                           {task.title}
//                           <Tag color={getPriorityColor(task.priority)} size="small">
//                             {task.priority}
//                           </Tag>
//                         </div>
//                       }
//                       description={
//                         <div>
//                           <div style={{ marginBottom: '4px' }}>
//                             <Text type="secondary" style={{ fontSize: '12px' }}>
//                               ID: {task.id} • Value: XAF {task.value?.toLocaleString()}
//                             </Text>
//                           </div>
//                           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
//                             <Text type="secondary" style={{ fontSize: '11px' }}>
//                               <CalendarOutlined /> Due: {moment(task.deadline).format('MMM DD')}
//                             </Text>
//                             {moment(task.deadline).diff(moment(), 'days') <= 1 && (
//                               <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />
//                             )}
//                           </div>
//                         </div>
//                       }
//                     />
//                   </List.Item>
//                 )}
//               />
//             ) : (
//               <div style={{ textAlign: 'center', padding: '40px 0' }}>
//                 <Text type="secondary">No urgent tasks</Text>
//               </div>
//             )}
//           </Card>
//         </Col>

//         {/* Top Performing Suppliers */}
//         <Col xs={24} lg={12}>
//           <Card 
//             title="Top Performing Suppliers"
//             extra={
//               <Button 
//                 type="link" 
//                 onClick={() => navigate('/buyer/suppliers')}
//               >
//                 View All
//               </Button>
//             }
//           >
//             {topSuppliers.length > 0 ? (
//               <List
//                 dataSource={topSuppliers}
//                 renderItem={(supplier) => (
//                   <List.Item>
//                     <List.Item.Meta
//                       avatar={<Avatar icon={<ContactsOutlined />} size="small" />}
//                       title={
//                         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
//                           {supplier.name}
//                           <div style={{ display: 'flex', alignItems: 'center' }}>
//                             <StarOutlined style={{ color: '#faad14', fontSize: '12px' }} />
//                             <Text style={{ fontSize: '12px', marginLeft: '4px' }}>
//                               {supplier.rating}
//                             </Text>
//                           </div>
//                         </div>
//                       }
//                       description={
//                         <div>
//                           <div style={{ marginBottom: '4px' }}>
//                             <Text type="secondary" style={{ fontSize: '12px' }}>
//                               On-time: {supplier.onTimeDelivery}% • Orders: {supplier.totalOrders}
//                             </Text>
//                           </div>
//                           <div>
//                             <Text type="secondary" style={{ fontSize: '11px' }}>
//                               Last order: {moment(supplier.lastOrder).fromNow()}
//                             </Text>
//                           </div>
//                         </div>
//                       }
//                     />
//                   </List.Item>
//                 )}
//               />
//             ) : (
//               <div style={{ textAlign: 'center', padding: '40px 0' }}>
//                 <Text type="secondary">No supplier data available</Text>
//               </div>
//             )}
//           </Card>
//         </Col>
//       </Row>
//     </div>
//   );
// };

// export default BuyerDashboard;







