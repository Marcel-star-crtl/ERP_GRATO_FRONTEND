import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Upload,
  Select,
  DatePicker,
  Typography,
  Tag,
  Space,
  Progress,
  Timeline,
  Descriptions,
  Alert,
  Spin,
  message,
  Tabs,
  Row,
  Col,
  Statistic,
  Tooltip,
  Badge,
  Drawer,
  List,
  Avatar,
  Divider,
  Steps,
  Empty,
  Popconfirm,
  notification,
  InputNumber,
  Checkbox,
  Rate,
  Image,
  Radio,
  Switch,
  Layout,
  Dropdown,
  Menu
} from 'antd';
import {
  FileTextOutlined,
  UploadOutlined,
  InboxOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  EyeOutlined,
  ReloadOutlined,
  PlusOutlined,
  DashboardOutlined,
  FileOutlined,
  CalendarOutlined,
  TeamOutlined,
  DollarOutlined,
  WarningOutlined,
  InfoCircleOutlined,
  BellOutlined,
  EditOutlined,
  DeleteOutlined,
  SendOutlined,
  HistoryOutlined,
  ExclamationCircleOutlined,
  BugOutlined,
  ShoppingCartOutlined,
  TagOutlined,
  PhoneOutlined,
  MailOutlined,
  UserOutlined,
  SaveOutlined,
  QuestionCircleOutlined,
  CopyOutlined,
  PrinterOutlined,
  DownloadOutlined,
  MessageOutlined,
  SolutionOutlined,
  StarOutlined,
  TruckOutlined,
  SafetyCertificateOutlined,
  BankOutlined,
  FilterOutlined,
  SearchOutlined,
  MoreOutlined,
  FileSearchOutlined
} from '@ant-design/icons';
import moment from 'moment';
import supplierApiService from '../../services/supplierAPI';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;
const { RangePicker } = DatePicker;
const { TextArea } = Input;
const { Dragger } = Upload;
const { Step } = Steps;
const { Header, Content, Sider } = Layout;

const UnifiedSupplierPortal = () => {
  // State Management
  const [activeMainTab, setActiveMainTab] = useState('rfq');
  const [invoices, setInvoices] = useState([]);
  const [rfqRequests, setRfqRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Modal States
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [rfqDetailModalVisible, setRfqDetailModalVisible] = useState(false);
  const [invoiceDetailModalVisible, setInvoiceDetailModalVisible] = useState(false);
  const [quoteModalVisible, setQuoteModalVisible] = useState(false);

  // Selected Items
  const [selectedRfq, setSelectedRfq] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  // Loading States
  const [uploadLoading, setUploadLoading] = useState(false);
  const [quoteSubmissionLoading, setQuoteSubmissionLoading] = useState(false);

  // Form instances
  const [form] = Form.useForm();
  const [quoteForm] = Form.useForm();

  // Fetch data on component mount
  useEffect(() => {
    fetchInitialData();
  }, []);

  // Fetch initial data
  const fetchInitialData = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchRfqData(),
        fetchInvoiceData()
      ]);
    } catch (error) {
      console.error('Error fetching initial data:', error);
      message.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch RFQ data from API
  const fetchRfqData = useCallback(async () => {
    try {
      console.log('Fetching RFQ data...');
      
      const response = await supplierApiService.getRfqRequests({
        page: 1,
        limit: 50
      });

      console.log('RFQ API Response:', response);

      if (response.success) {
        // Transform backend data to match frontend expectations
        const transformedRfqs = response.data.map(rfq => ({
          id: rfq.id || rfq._id || rfq.rfqId,
          rfqId: rfq.rfqId || rfq._id,
          requisitionId: rfq.requisitionId,
          title: rfq.title,
          buyer: rfq.buyer,
          buyerEmail: rfq.buyerEmail,
          buyerPhone: rfq.buyerPhone,
          department: rfq.department,
          requestDate: rfq.requestDate || rfq.issueDate,
          quotationDeadline: rfq.quotationDeadline || rfq.responseDeadline,
          expectedDelivery: rfq.expectedDelivery || rfq.expectedDeliveryDate,
          status: rfq.status,
          priority: rfq.priority || (rfq.daysLeft <= 2 ? 'high' : rfq.daysLeft <= 5 ? 'medium' : 'low'),
          paymentTerms: rfq.paymentTerms,
          deliveryLocation: rfq.deliveryLocation,
          evaluationCriteria: rfq.evaluationCriteria || { quality: 40, cost: 35, delivery: 25 },
          items: rfq.items || [],
          notes: rfq.notes || rfq.specialRequirements,
          attachments: rfq.attachments || [],
          submittedQuote: rfq.submittedQuote || rfq.existingQuote,
          daysLeft: rfq.daysLeft || calculateDaysLeft(rfq.quotationDeadline || rfq.responseDeadline),
          isExpired: rfq.isExpired,
          isUrgent: rfq.isUrgent || calculateDaysLeft(rfq.quotationDeadline || rfq.responseDeadline) <= 2,
          key: rfq.id || rfq._id
        }));

        setRfqRequests(transformedRfqs);
        console.log(`RFQ data loaded: ${transformedRfqs.length} requests`);
      } else {
        message.error(response.message || 'Failed to fetch RFQ data');
      }
    } catch (error) {
      console.error('Error fetching RFQ data:', error);
      message.error('Failed to load RFQ requests');
    }
  }, []);

  // Fetch invoice data from API
  const fetchInvoiceData = useCallback(async () => {
    try {
      console.log('Fetching invoice data...');
      
      const response = await supplierApiService.getInvoices({
        page: 1,
        limit: 50
      });

      console.log('Invoice API Response:', response);

      if (response.success) {
        const transformedInvoices = response.data.map(invoice => ({
          ...invoice,
          key: invoice._id || invoice.id
        }));
        
        setInvoices(transformedInvoices);
        console.log(`Invoice data loaded: ${transformedInvoices.length} invoices`);
      } else {
        message.error(response.message || 'Failed to fetch invoice data');
      }
    } catch (error) {
      console.error('Error fetching invoice data:', error);
      message.error('Failed to load invoices');
    }
  }, []);

  // Refresh all data
  const refreshAllData = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        fetchRfqData(),
        fetchInvoiceData()
      ]);
      message.success('Data refreshed successfully');
    } catch (error) {
      console.error('Refresh error:', error);
      message.error('Failed to refresh data');
    } finally {
      setRefreshing(false);
    }
  }, [fetchRfqData, fetchInvoiceData]);

  const handleDownloadAttachment = useCallback(async (attachment) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        message.error('Authentication required');
        return;
      }

      // Extract publicId from Cloudinary URL
      let publicId = '';
      if (attachment.url) {
        const urlParts = attachment.url.split('/');
        const uploadIndex = urlParts.findIndex(part => part === 'upload');
        if (uploadIndex !== -1 && uploadIndex + 2 < urlParts.length) {
          publicId = urlParts.slice(uploadIndex + 2).join('/');
          // Remove file extension from publicId
          const lastPart = publicId.split('/').pop();
          if (lastPart && lastPart.includes('.')) {
            publicId = publicId.replace(/\.[^/.]+$/, '');
          }
        }
      }

      if (!publicId) {
        message.error('Invalid attachment URL');
        return;
      }

      const response = await fetch(`/api/files/download/${encodeURIComponent(publicId)}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      // Create a temporary link to download the file
      const link = document.createElement('a');
      link.href = url;
      link.download = attachment.originalName || attachment.name || 'attachment';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the blob URL
      window.URL.revokeObjectURL(url);
      
      message.success('File downloaded successfully');
    } catch (error) {
      console.error('Error downloading attachment:', error);
      message.error('Failed to download attachment');
      
      // Fallback to direct URL if download fails
      if (attachment.url) {
        window.open(attachment.url, '_blank');
      }
    }
  }, []);

  // Calculate days left utility
  const calculateDaysLeft = (deadline) => {
    if (!deadline) return 0;
    const deadlineDate = moment(deadline);
    const today = moment();
    return deadlineDate.diff(today, 'days');
  };

  // Handle RFQ item price changes
  const handleItemPriceChange = useCallback((itemId, field, value) => {
    if (!selectedRfq) return;

    setSelectedRfq(prev => ({
      ...prev,
      items: prev.items.map(item => {
        if (item.id === itemId || item._id === itemId) {
          const updatedItem = { ...item, [field]: value };

          // Auto-calculate total price when unit price changes
          if (field === 'quotedPrice' && value && item.quantity) {
            updatedItem.totalPrice = value * item.quantity;
          }

          return updatedItem;
        }
        return item;
      })
    }));
  }, [selectedRfq]);

  // Handle quote submission
  const handleQuoteSubmission = async (values) => {
    try {
      setQuoteSubmissionLoading(true);

      if (!selectedRfq) {
        message.error('No RFQ selected');
        return;
      }

      // Validate that all items have prices
      const itemsWithoutPrices = selectedRfq.items.filter(item => !item.quotedPrice || item.quotedPrice <= 0);
      if (itemsWithoutPrices.length > 0) {
        message.error('Please provide valid quotes for all items');
        return;
      }

      // Calculate total amount
      const totalAmount = selectedRfq.items.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
      
      if (totalAmount <= 0) {
        message.error('Total quote amount must be greater than zero');
        return;
      }

      // Prepare quote data
      const quoteData = {
        items: selectedRfq.items.map(item => ({
          itemId: item.id || item._id,
          id: item.id || item._id,
          description: item.description,
          quantity: item.quantity,
          quotedPrice: parseFloat(item.quotedPrice),
          totalPrice: parseFloat(item.totalPrice),
          brand: item.brand || '',
          model: item.model || '',
          warranty: item.warranty || '',
          deliveryTime: item.deliveryTime || '',
          specifications: item.specifications || '',
          partNumber: item.partNumber || '',
          availability: item.availability || 'Available'
        })),
        totalAmount,
        validityPeriod: values.validityPeriod || 30,
        deliveryTerms: values.deliveryTerms || 'Standard delivery',
        paymentTerms: values.paymentTerms || selectedRfq.paymentTerms,
        additionalNotes: values.additionalNotes || '',
        warranty: values.warranty || '',
        deliveryTime: values.deliveryTime || ''
      };

      console.log('Submitting quote:', quoteData);

      // Submit quote to backend
      const response = await supplierApiService.submitQuote(selectedRfq.rfqId || selectedRfq.id, quoteData);

      if (response.success) {
        // Update local state
        setRfqRequests(prev => prev.map(rfq => {
          if (rfq.id === selectedRfq.id) {
            return {
              ...rfq,
              status: 'quote_submitted',
              submittedQuote: {
                quoteId: response.data.quoteId,
                quoteNumber: response.data.quoteNumber,
                totalAmount: response.data.totalAmount,
                submissionDate: response.data.submissionDate,
                validUntil: response.data.validUntil,
                status: response.data.status
              }
            };
          }
          return rfq;
        }));

        // Success feedback
        message.success('Quote submitted successfully!');
        notification.success({
          message: 'Quote Submitted Successfully',
          description: `Your quote for "${selectedRfq.title}" has been submitted for evaluation.`,
          duration: 5
        });

        // Close modals and reset forms
        setQuoteModalVisible(false);
        setRfqDetailModalVisible(false);
        quoteForm.resetFields();

        // Refresh RFQ data
        await fetchRfqData();
      } else {
        throw new Error(response.message || 'Failed to submit quote');
      }

    } catch (error) {
      console.error('Quote submission error:', error);
      message.error(error.message || 'Failed to submit quote');
    } finally {
      setQuoteSubmissionLoading(false);
    }
  };

  // Handle invoice upload
  const handleInvoiceUpload = async (values) => {
    try {
      setUploadLoading(true);
      
      console.log('Form values received:', values);
      console.log('PO File:', values.poFile);
      console.log('Invoice File:', values.invoiceFile);
  
      // Validate required fields
      if (!values.poNumber || !values.invoiceNumber) {
        message.error('Please fill in all required fields');
        return;
      }
  
      // Create FormData for multipart file upload
      const formData = new FormData();
      
      // Add text fields
      formData.append('poNumber', values.poNumber.trim().toUpperCase());
      formData.append('invoiceNumber', values.invoiceNumber.trim());
  
      // Handle PO file upload
      if (values.poFile && values.poFile.length > 0) {
        const poFile = values.poFile[0];
        console.log('Processing PO file:', poFile);
        
        // Get the actual file object
        const poFileObj = poFile.originFileObj || poFile.file || poFile;
        
        if (poFileObj instanceof File) {
          // Validate file size (10MB limit)
          if (poFileObj.size > 10 * 1024 * 1024) {
            message.error('PO file size must be less than 10MB');
            return;
          }
          
          // Validate file type
          const allowedTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'image/jpeg',
            'image/jpg', 
            'image/png'
          ];
          
          if (!allowedTypes.includes(poFileObj.type)) {
            message.error('PO file must be PDF, DOC, DOCX, JPG, or PNG format');
            return;
          }
          
          formData.append('poFile', poFileObj, poFileObj.name);
          console.log('PO file added to FormData:', {
            name: poFileObj.name,
            size: poFileObj.size,
            type: poFileObj.type
          });
        } else {
          console.warn('PO file is not a valid File object:', poFileObj);
        }
      }
  
      // Handle Invoice file upload
      if (values.invoiceFile && values.invoiceFile.length > 0) {
        const invoiceFile = values.invoiceFile[0];
        console.log('Processing Invoice file:', invoiceFile);
        
        // Get the actual file object
        const invoiceFileObj = invoiceFile.originFileObj || invoiceFile.file || invoiceFile;
        
        if (invoiceFileObj instanceof File) {
          // Validate file size (10MB limit)
          if (invoiceFileObj.size > 10 * 1024 * 1024) {
            message.error('Invoice file size must be less than 10MB');
            return;
          }
          
          // Validate file type
          const allowedTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'image/jpeg',
            'image/jpg',
            'image/png'
          ];
          
          if (!allowedTypes.includes(invoiceFileObj.type)) {
            message.error('Invoice file must be PDF, DOC, DOCX, JPG, or PNG format');
            return;
          }
          
          formData.append('invoiceFile', invoiceFileObj, invoiceFileObj.name);
          console.log('Invoice file added to FormData:', {
            name: invoiceFileObj.name,
            size: invoiceFileObj.size,
            type: invoiceFileObj.type
          });
        } else {
          console.warn('Invoice file is not a valid File object:', invoiceFileObj);
        }
      }
  
      // Debug: Log FormData contents
      console.log('FormData contents:');
      for (let [key, value] of formData.entries()) {
        if (value instanceof File) {
          console.log(`${key}:`, {
            name: value.name,
            size: value.size,
            type: value.type
          });
        } else {
          console.log(`${key}:`, value);
        }
      }
  
      // Submit to backend
      console.log('Submitting invoice to backend...');
      
      const response = await supplierApiService.submitInvoice(formData);
      
      console.log('Invoice submission response:', response);
  
      if (response.success) {
        message.success('Invoice uploaded successfully!');
        
        notification.success({
          message: 'Invoice Submitted Successfully',
          description: `Your invoice ${values.invoiceNumber} for PO ${values.poNumber} has been submitted for approval.`,
          duration: 5
        });
  
        // Reset form and close modal
        setUploadModalVisible(false);
        form.resetFields();
  
        // Refresh invoice data
        await fetchInvoiceData();
        
      } else {
        throw new Error(response.message || 'Failed to upload invoice');
      }
  
    } catch (error) {
      console.error('Invoice upload error:', error);
      
      // More specific error messages
      if (error.response?.status === 413) {
        message.error('Files are too large. Please ensure files are under 10MB each.');
      } else if (error.response?.status === 400) {
        message.error(error.response.data?.message || 'Invalid file format or missing required fields');
      } else if (error.response?.status === 500) {
        message.error('Server error occurred. Please try again later.');
      } else {
        message.error(error.message || 'Failed to upload invoice. Please check your connection and try again.');
      }
    } finally {
      setUploadLoading(false);
    }
  };
  

  // Status tag renderers
  const getRfqStatusTag = (status) => {
    const statusMap = {
      'pending_quote': { color: 'orange', text: 'Quote Pending', icon: <ClockCircleOutlined /> },
      'quote_submitted': { color: 'blue', text: 'Quote Submitted', icon: <SendOutlined /> },
      'quote_selected': { color: 'green', text: 'Quote Selected', icon: <CheckCircleOutlined /> },
      'quote_rejected': { color: 'red', text: 'Not Selected', icon: <CloseCircleOutlined /> },
      'expired': { color: 'default', text: 'Expired', icon: <ExclamationCircleOutlined /> }
    };
    const config = statusMap[status] || statusMap['pending_quote'];
    return <Tag color={config.color} icon={config.icon}>{config.text}</Tag>;
  };

  const getPriorityTag = (priority) => {
    const priorityMap = {
      'low': { color: 'default', text: 'Low' },
      'medium': { color: 'blue', text: 'Medium' },
      'high': { color: 'orange', text: 'High' },
      'urgent': { color: 'red', text: 'Urgent' }
    };
    const config = priorityMap[priority] || priorityMap['medium'];
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const getInvoiceStatusTag = (status) => {
    const statusMap = {
      'pending': { color: 'orange', text: 'Pending' },
      'approved': { color: 'green', text: 'Approved' },
      'rejected': { color: 'red', text: 'Rejected' }
    };
    const config = statusMap[status] || statusMap['pending'];
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  // Calculate statistics
  const rfqStats = useMemo(() => ({
    total: rfqRequests.length,
    pending: rfqRequests.filter(rfq => rfq.status === 'pending_quote').length,
    submitted: rfqRequests.filter(rfq => rfq.status === 'quote_submitted').length,
    selected: rfqRequests.filter(rfq => rfq.status === 'quote_selected').length,
    urgent: rfqRequests.filter(rfq => rfq.isUrgent && rfq.status === 'pending_quote').length
  }), [rfqRequests]);

  const invoiceStats = useMemo(() => ({
    total: invoices.length,
    pending: invoices.filter(inv => inv.approvalStatus === 'pending').length,
    approved: invoices.filter(inv => inv.approvalStatus === 'approved').length,
    rejected: invoices.filter(inv => inv.approvalStatus === 'rejected').length
  }), [invoices]);

  // Table columns
  const rfqColumns = [
    {
      title: 'RFQ Details',
      key: 'details',
      render: (_, record) => (
        <div>
          <Text strong>{record.title}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.id} | {record.requisitionId}
          </Text>
          <br />
          <Tag color="blue" style={{ fontSize: '10px' }}>{record.department}</Tag>
        </div>
      ),
      width: 200
    },
    {
      title: 'Buyer',
      key: 'buyer',
      render: (_, record) => (
        <div>
          <Text>{record.buyer}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: '11px' }}>
            <MailOutlined /> {record.buyerEmail}
          </Text>
          <br />
          <Text type="secondary" style={{ fontSize: '11px' }}>
            <PhoneOutlined /> {record.buyerPhone}
          </Text>
        </div>
      ),
      width: 160
    },
    {
      title: 'Timeline',
      key: 'timeline',
      render: (_, record) => {
        const deadline = moment(record.quotationDeadline);
        const daysLeft = deadline.diff(moment(), 'days');
        const isUrgent = daysLeft <= 2;

        return (
          <div>
            <Text strong style={{ color: isUrgent ? '#ff4d4f' : '#1890ff' }}>
              <CalendarOutlined /> Due: {deadline.format('MMM DD')}
            </Text>
            <br />
            <Text type={isUrgent ? 'danger' : 'secondary'} style={{ fontSize: '11px' }}>
              {daysLeft > 0 ? `${daysLeft} days left` : 'Overdue'}
            </Text>
            <br />
            <Text type="secondary" style={{ fontSize: '11px' }}>
              Expected: {moment(record.expectedDelivery).format('MMM DD')}
            </Text>
          </div>
        );
      },
      sorter: (a, b) => moment(a.quotationDeadline) - moment(b.quotationDeadline),
      width: 120
    },
    {
      title: 'Items',
      dataIndex: 'items',
      key: 'items',
      render: (items) => `${items?.length || 0} items`,
      align: 'center',
      width: 60
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority) => getPriorityTag(priority),
      width: 80
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => getRfqStatusTag(status),
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
            onClick={() => {
              setSelectedRfq(record);
              setRfqDetailModalVisible(true);
            }}
          >
            View
          </Button>
          {record.status === 'pending_quote' && (
            <Button
              size="small"
              type="primary"
              icon={<TagOutlined />}
              onClick={() => {
                setSelectedRfq(record);
                setQuoteModalVisible(true);
              }}
            >
              Quote
            </Button>
          )}
        </Space>
      ),
      width: 120,
      fixed: 'right'
    }
  ];

  const invoiceColumns = [
    {
      title: 'PO Number',
      dataIndex: 'poNumber',
      key: 'poNumber',
      render: (text) => <Text code>{text || 'N/A'}</Text>
    },
    {
      title: 'Invoice Number',
      dataIndex: 'invoiceNumber',
      key: 'invoiceNumber',
      render: (text) => <Text code>{text || 'N/A'}</Text>
    },
    {
      title: 'Upload Date',
      dataIndex: 'uploadedDate',
      key: 'uploadedDate',
      render: (date) => moment(date).format('DD/MM/YYYY')
    },
    {
      title: 'Department',
      dataIndex: 'assignedDepartment',
      key: 'department',
      render: (dept) => <Tag color="blue">{dept}</Tag>
    },
    {
      title: 'Status',
      dataIndex: 'approvalStatus',
      key: 'status',
      render: (status) => getInvoiceStatusTag(status)
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button
          size="small"
          icon={<EyeOutlined />}
          onClick={() => {
            setSelectedInvoice(record);
            setInvoiceDetailModalVisible(true);
          }}
        >
          View
        </Button>
      )
    }
  ];

  return (
    <Layout style={{ minHeight: '100vh', backgroundColor: '#f0f2f5' }}>
      <Content style={{ padding: '24px' }}>
        {/* Header */}
        <Card style={{ marginBottom: '24px' }}>
          <Row align="middle" justify="space-between">
            <Col>
              <Title level={2} style={{ margin: 0 }}>
                <ShoppingCartOutlined /> Supplier Portal
              </Title>
              <Text type="secondary">Manage RFQ responses and invoice submissions</Text>
            </Col>
            <Col>
              <Space>
                <Button 
                  icon={<ReloadOutlined />} 
                  onClick={refreshAllData} 
                  loading={refreshing}
                >
                  Refresh
                </Button>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => setUploadModalVisible(true)}
                >
                  Upload Invoice
                </Button>
              </Space>
            </Col>
          </Row>
        </Card>

        {/* Main Content */}
        <Spin spinning={loading}>
          <Tabs 
            activeKey={activeMainTab} 
            onChange={setActiveMainTab} 
            size="large"
            type="card"
          >
            {/* RFQ Tab */}
            <TabPane
              tab={
                <Badge count={rfqStats.urgent} size="small">
                  <Space>
                    <TagOutlined />
                    Request for Quotes ({rfqStats.pending} pending)
                  </Space>
                </Badge>
              }
              key="rfq"
            >
              {/* RFQ Statistics */}
              <Row gutter={16} style={{ marginBottom: '24px' }}>
                <Col span={6}>
                  <Card>
                    <Statistic
                      title="Total RFQs"
                      value={rfqStats.total}
                      prefix={<TagOutlined />}
                      valueStyle={{ color: '#1890ff' }}
                    />
                  </Card>
                </Col>
                <Col span={6}>
                  <Card>
                    <Statistic
                      title="Pending Quotes"
                      value={rfqStats.pending}
                      prefix={<ClockCircleOutlined />}
                      valueStyle={{ color: '#faad14' }}
                    />
                  </Card>
                </Col>
                <Col span={6}>
                  <Card>
                    <Statistic
                      title="Quotes Submitted"
                      value={rfqStats.submitted}
                      prefix={<SendOutlined />}
                      valueStyle={{ color: '#1890ff' }}
                    />
                  </Card>
                </Col>
                <Col span={6}>
                  <Card>
                    <Statistic
                      title="Selected"
                      value={rfqStats.selected}
                      prefix={<CheckCircleOutlined />}
                      valueStyle={{ color: '#52c41a' }}
                    />
                  </Card>
                </Col>
              </Row>

              {/* Urgent Alert */}
              {rfqStats.urgent > 0 && (
                <Alert
                  message={`${rfqStats.urgent} RFQ(s) require urgent attention - quotes due within 2 days!`}
                  type="warning"
                  showIcon
                  style={{ marginBottom: '16px' }}
                  action={
                    <Button 
                      size="small"
                      onClick={() => {
                        const urgentRfq = rfqRequests.find(rfq => 
                          rfq.isUrgent && rfq.status === 'pending_quote'
                        );
                        if (urgentRfq) {
                          setSelectedRfq(urgentRfq);
                          setQuoteModalVisible(true);
                        }
                      }}
                    >
                      Quote Now
                    </Button>
                  }
                />
              )}

              {/* RFQ Table */}
              <Card>
                <Table
                  columns={rfqColumns}
                  dataSource={rfqRequests}
                  loading={loading}
                  rowKey="id"
                  pagination={{
                    pageSize: 10,
                    showSizeChanger: true,
                    showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} RFQs`
                  }}
                  scroll={{ x: 1000 }}
                />
              </Card>
            </TabPane>

            {/* Invoice Tab */}
            <TabPane
              tab={
                <Space>
                  <FileTextOutlined />
                  Invoice Management ({invoiceStats.pending} pending)
                </Space>
              }
              key="invoices"
            >
              {/* Invoice Statistics */}
              <Row gutter={16} style={{ marginBottom: '24px' }}>
                <Col span={6}>
                  <Card>
                    <Statistic
                      title="Total Invoices"
                      value={invoiceStats.total}
                      prefix={<FileTextOutlined />}
                      valueStyle={{ color: '#1890ff' }}
                    />
                  </Card>
                </Col>
                <Col span={6}>
                  <Card>
                    <Statistic
                      title="Pending Approval"
                      value={invoiceStats.pending}
                      prefix={<ClockCircleOutlined />}
                      valueStyle={{ color: '#faad14' }}
                    />
                  </Card>
                </Col>
                <Col span={6}>
                  <Card>
                    <Statistic
                      title="Approved"
                      value={invoiceStats.approved}
                      prefix={<CheckCircleOutlined />}
                      valueStyle={{ color: '#52c41a' }}
                    />
                  </Card>
                </Col>
                <Col span={6}>
                  <Card>
                    <Statistic
                      title="Rejected"
                      value={invoiceStats.rejected}
                      prefix={<CloseCircleOutlined />}
                      valueStyle={{ color: '#ff4d4f' }}
                    />
                  </Card>
                </Col>
              </Row>

              {/* Invoice Table */}
              <Card>
                <Table
                  columns={invoiceColumns}
                  dataSource={invoices}
                  loading={loading}
                  rowKey={(record) => record._id || record.id || record.key}
                  pagination={{
                    pageSize: 10,
                    showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} invoices`
                  }}
                />
              </Card>
            </TabPane>
          </Tabs>
        </Spin>

        {/* RFQ Detail Modal */}
        <Modal
          title={
            <Space>
              <TagOutlined />
              RFQ Details - {selectedRfq?.title}
            </Space>
          }
          open={rfqDetailModalVisible}
          onCancel={() => {
            setRfqDetailModalVisible(false);
            setSelectedRfq(null);
          }}
          footer={
            selectedRfq?.status === 'pending_quote' ? (
              <Space>
                <Button onClick={() => setRfqDetailModalVisible(false)}>
                  Close
                </Button>
                <Button
                  type="primary"
                  icon={<TagOutlined />}
                  onClick={() => {
                    setRfqDetailModalVisible(false);
                    setQuoteModalVisible(true);
                  }}
                >
                  Submit Quote
                </Button>
              </Space>
            ) : (
              <Button onClick={() => setRfqDetailModalVisible(false)}>
                Close
              </Button>
            )
          }
          width={1200}
        >
          {selectedRfq && (
            <div>
              {/* RFQ Header Info */}
              <Card size="small" style={{ marginBottom: '16px' }}>
                <Row gutter={24}>
                  <Col span={12}>
                    <Descriptions column={1} size="small">
                      <Descriptions.Item label="RFQ ID">
                        <Text code>{selectedRfq.id}</Text>
                      </Descriptions.Item>
                      <Descriptions.Item label="Requisition ID">
                        <Text code>{selectedRfq.requisitionId}</Text>
                      </Descriptions.Item>
                      <Descriptions.Item label="Department">
                        <Tag color="blue">{selectedRfq.department}</Tag>
                      </Descriptions.Item>
                      <Descriptions.Item label="Priority">
                        {getPriorityTag(selectedRfq.priority)}
                      </Descriptions.Item>
                    </Descriptions>
                  </Col>
                  <Col span={12}>
                    <Descriptions column={1} size="small">
                      <Descriptions.Item label="Quote Deadline">
                        <Text strong style={{ color: selectedRfq.daysLeft <= 2 ? '#ff4d4f' : '#1890ff' }}>
                          {moment(selectedRfq.quotationDeadline).format('DD/MM/YYYY')}
                        </Text>
                      </Descriptions.Item>
                      <Descriptions.Item label="Expected Delivery">
                        {moment(selectedRfq.expectedDelivery).format('DD/MM/YYYY')}
                      </Descriptions.Item>
                      <Descriptions.Item label="Payment Terms">
                        <Tag color="green">{selectedRfq.paymentTerms}</Tag>
                      </Descriptions.Item>
                      <Descriptions.Item label="Status">
                        {getRfqStatusTag(selectedRfq.status)}
                      </Descriptions.Item>
                    </Descriptions>
                  </Col>
                </Row>
              </Card>

              {/* Buyer Contact */}
              <Card title="Buyer Contact" size="small" style={{ marginBottom: '16px' }}>
                <Space size="large">
                  <div>
                    <UserOutlined /> <Text strong>{selectedRfq.buyer}</Text>
                  </div>
                  <div>
                    <MailOutlined /> <Text copyable>{selectedRfq.buyerEmail}</Text>
                  </div>
                  <div>
                    <PhoneOutlined /> <Text copyable>{selectedRfq.buyerPhone}</Text>
                  </div>
                </Space>
              </Card>

              {/* Evaluation Criteria */}
              <Card title="Evaluation Criteria" size="small" style={{ marginBottom: '16px' }}>
                <Row gutter={16}>
                  <Col span={8}>
                    <div style={{ textAlign: 'center' }}>
                      <Progress
                        type="circle"
                        percent={selectedRfq.evaluationCriteria.quality}
                        format={() => `${selectedRfq.evaluationCriteria.quality}%`}
                        size={80}
                        strokeColor="#52c41a"
                      />
                      <div style={{ marginTop: '8px' }}>
                        <Text strong>Quality</Text>
                      </div>
                    </div>
                  </Col>
                  <Col span={8}>
                    <div style={{ textAlign: 'center' }}>
                      <Progress
                        type="circle"
                        percent={selectedRfq.evaluationCriteria.cost}
                        format={() => `${selectedRfq.evaluationCriteria.cost}%`}
                        size={80}
                        strokeColor="#1890ff"
                      />
                      <div style={{ marginTop: '8px' }}>
                        <Text strong>Cost</Text>
                      </div>
                    </div>
                  </Col>
                  <Col span={8}>
                    <div style={{ textAlign: 'center' }}>
                      <Progress
                        type="circle"
                        percent={selectedRfq.evaluationCriteria.delivery}
                        format={() => `${selectedRfq.evaluationCriteria.delivery}%`}
                        size={80}
                        strokeColor="#faad14"
                      />
                      <div style={{ marginTop: '8px' }}>
                        <Text strong>Delivery Time</Text>
                      </div>
                    </div>
                  </Col>
                </Row>
              </Card>

              {/* Items Table */}
              <Card title="Items to Quote" size="small" style={{ marginBottom: '16px' }}>
                <Table
                  columns={[
                    {
                      title: 'Item',
                      key: 'item',
                      render: (_, record) => (
                        <div>
                          <Text strong>{record.description}</Text>
                          <br />
                          <Text type="secondary" style={{ fontSize: '12px' }}>
                            {record.specifications}
                          </Text>
                        </div>
                      ),
                      width: 300
                    },
                    {
                      title: 'Qty',
                      dataIndex: 'quantity',
                      key: 'quantity',
                      align: 'center',
                      width: 60
                    },
                    {
                      title: 'Unit',
                      dataIndex: 'unit',
                      key: 'unit',
                      align: 'center',
                      width: 60
                    },
                    {
                      title: 'Your Quote',
                      key: 'quote',
                      render: (_, record) => {
                        if (selectedRfq.status === 'quote_submitted' || selectedRfq.status === 'quote_selected') {
                          return (
                            <div>
                              <Text strong style={{ color: '#52c41a' }}>
                                XAF {record.quotedPrice?.toLocaleString()}
                              </Text>
                              <br />
                              <Text type="secondary" style={{ fontSize: '11px' }}>
                                Total: XAF {record.totalPrice?.toLocaleString()}
                              </Text>
                            </div>
                          );
                        }
                        return <Text type="secondary">Quote pending</Text>;
                      },
                      align: 'right',
                      width: 120
                    }
                  ]}
                  dataSource={selectedRfq.items}
                  pagination={false}
                  size="small"
                  rowKey={(record) => record.id || record._id}
                />
              </Card>

              {/* Additional Information */}
              <Card title="Additional Information" size="small" style={{ marginBottom: '16px' }}>
                <Row gutter={16}>
                  <Col span={12}>
                    <div>
                      <Text strong>Delivery Location:</Text>
                      <br />
                      <Text><TruckOutlined /> {selectedRfq.deliveryLocation}</Text>
                    </div>
                  </Col>
                  <Col span={12}>
                    <div>
                      <Text strong>Special Notes:</Text>
                      <br />
                      <Paragraph style={{ margin: 0 }}>
                        {selectedRfq.notes || 'No additional notes provided.'}
                      </Paragraph>
                    </div>
                  </Col>
                </Row>
              </Card>

              {/* Attachments */}
              {selectedRfq.attachments && selectedRfq.attachments.length > 0 && (
                <Card title="Technical Documents" size="small" style={{ marginBottom: '16px' }}>
                  <List
                    size="small"
                    dataSource={selectedRfq.attachments}
                    renderItem={(file) => (
                      <List.Item
                        actions={[
                          <Button size="small" icon={<DownloadOutlined />} onClick={() => handleDownloadAttachment(file)}>
                            Download
                          </Button>
                        ]}
                      >
                        <List.Item.Meta
                          avatar={<FileOutlined />}
                          title={file.name}
                          description={file.size}
                        />
                      </List.Item>
                    )}
                  />
                </Card>
              )}

              {/* Submitted Quote Summary */}
              {selectedRfq.submittedQuote && (
                <Card title="Your Submitted Quote" size="small">
                  <Alert
                    message="Quote Successfully Submitted"
                    description={`Submitted on ${moment(selectedRfq.submittedQuote.submissionDate).format('DD/MM/YYYY HH:mm')}`}
                    type="success"
                    showIcon
                    style={{ marginBottom: '16px' }}
                  />
                  <Row gutter={16}>
                    <Col span={8}>
                      <Statistic
                        title="Total Quote Amount"
                        value={selectedRfq.submittedQuote.totalAmount}
                        prefix="XAF"
                        precision={0}
                        valueStyle={{ color: '#52c41a' }}
                      />
                    </Col>
                    <Col span={8}>
                      <Statistic
                        title="Validity Period"
                        value={selectedRfq.submittedQuote.validityPeriod || '30'}
                        suffix="days"
                      />
                    </Col>
                    <Col span={8}>
                      <div>
                        <Text type="secondary">Status:</Text>
                        <br />
                        <Text>{selectedRfq.submittedQuote.status || 'Submitted'}</Text>
                      </div>
                    </Col>
                  </Row>
                </Card>
              )}
            </div>
          )}
        </Modal>

        {/* Quote Submission Modal */}
        <Modal
          title={
            <Space>
              <TagOutlined />
              Submit Quote - {selectedRfq?.title}
            </Space>
          }
          open={quoteModalVisible}
          onCancel={() => {
            setQuoteModalVisible(false);
            quoteForm.resetFields();
          }}
          footer={null}
          width={1400}
          style={{ top: 20 }}
        >
          {selectedRfq && (
            <Form
              form={quoteForm}
              layout="vertical"
              onFinish={handleQuoteSubmission}
            >
              {/* Quote Header */}
              <Alert
                message="Quote Submission Guidelines"
                description={
                  <div>
                    <p>Please provide competitive pricing for all items. Quality and delivery time will be evaluated along with cost.</p>
                    <p><strong>Deadline:</strong> {moment(selectedRfq.quotationDeadline).format('DD/MM/YYYY HH:mm')} 
                       ({moment(selectedRfq.quotationDeadline).fromNow()})</p>
                  </div>
                }
                type="info"
                showIcon
                style={{ marginBottom: '16px' }}
              />

              {/* Items Pricing Table */}
              <Card title="Item Pricing" size="small" style={{ marginBottom: '16px' }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#fafafa', borderBottom: '1px solid #d9d9d9' }}>
                        <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #d9d9d9' }}>Item Details</th>
                        <th style={{ padding: '12px', textAlign: 'center', border: '1px solid #d9d9d9', width: '80px' }}>Qty</th>
                        <th style={{ padding: '12px', textAlign: 'center', border: '1px solid #d9d9d9', width: '100px' }}>Unit Price (XAF)</th>
                        <th style={{ padding: '12px', textAlign: 'center', border: '1px solid #d9d9d9', width: '120px' }}>Total (XAF)</th>
                        <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #d9d9d9', width: '150px' }}>Brand/Model</th>
                        <th style={{ padding: '12px', textAlign: 'center', border: '1px solid #d9d9d9', width: '100px' }}>Warranty</th>
                        <th style={{ padding: '12px', textAlign: 'center', border: '1px solid #d9d9d9', width: '100px' }}>Delivery</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedRfq.items.map((item, index) => (
                        <tr key={item.id || item._id} style={{ borderBottom: '1px solid #d9d9d9' }}>
                          <td style={{ padding: '12px', border: '1px solid #d9d9d9', verticalAlign: 'top' }}>
                            <div>
                              <Text strong>{item.description}</Text>
                              <br />
                              <Text type="secondary" style={{ fontSize: '12px' }}>
                                {item.specifications}
                              </Text>
                            </div>
                          </td>
                          <td style={{ padding: '12px', border: '1px solid #d9d9d9', textAlign: 'center', verticalAlign: 'middle' }}>
                            <Text strong>{item.quantity}</Text>
                            <br />
                            <Text type="secondary" style={{ fontSize: '11px' }}>{item.unit}</Text>
                          </td>
                          <td style={{ padding: '8px', border: '1px solid #d9d9d9', textAlign: 'center', verticalAlign: 'middle' }}>
                            <InputNumber
                              style={{ width: '100%' }}
                              placeholder="Unit price"
                              formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                              parser={value => value.replace(/\$\s?|(,*)/g, '')}
                              value={item.quotedPrice}
                              onChange={(value) => handleItemPriceChange(item.id || item._id, 'quotedPrice', value)}
                              min={0}
                            />
                          </td>
                          <td style={{ padding: '8px', border: '1px solid #d9d9d9', textAlign: 'center', verticalAlign: 'middle' }}>
                            <Text strong style={{ color: '#52c41a' }}>
                              {item.totalPrice ? item.totalPrice.toLocaleString() : '0'}
                            </Text>
                          </td>
                          <td style={{ padding: '8px', border: '1px solid #d9d9d9', verticalAlign: 'middle' }}>
                            <Input
                              placeholder="Brand"
                              value={item.brand}
                              onChange={(e) => handleItemPriceChange(item.id || item._id, 'brand', e.target.value)}
                              style={{ marginBottom: '4px' }}
                              size="small"
                            />
                            <Input
                              placeholder="Model"
                              value={item.model}
                              onChange={(e) => handleItemPriceChange(item.id || item._id, 'model', e.target.value)}
                              size="small"
                            />
                          </td>
                          <td style={{ padding: '8px', border: '1px solid #d9d9d9', textAlign: 'center', verticalAlign: 'middle' }}>
                            <Select
                              placeholder="Warranty"
                              style={{ width: '100%' }}
                              value={item.warranty}
                              onChange={(value) => handleItemPriceChange(item.id || item._id, 'warranty', value)}
                              size="small"
                            >
                              <Option value="6 months">6 months</Option>
                              <Option value="1 year">1 year</Option>
                              <Option value="2 years">2 years</Option>
                              <Option value="3 years">3 years</Option>
                              <Option value="5 years">5 years</Option>
                            </Select>
                          </td>
                          <td style={{ padding: '8px', border: '1px solid #d9d9d9', textAlign: 'center', verticalAlign: 'middle' }}>
                            <Select
                              placeholder="Days"
                              style={{ width: '100%' }}
                              value={item.deliveryTime}
                              onChange={(value) => handleItemPriceChange(item.id || item._id, 'deliveryTime', value)}
                              size="small"
                            >
                              <Option value="1-2 days">1-2 days</Option>
                              <Option value="3-5 days">3-5 days</Option>
                              <Option value="1 week">1 week</Option>
                              <Option value="2 weeks">2 weeks</Option>
                              <Option value="1 month">1 month</Option>
                            </Select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Total Calculation */}
                <div style={{ marginTop: '16px', padding: '16px', backgroundColor: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: '6px' }}>
                  <Row justify="space-between" align="middle">
                    <Col>
                      <Text strong style={{ fontSize: '16px' }}>Total Quote Amount:</Text>
                    </Col>
                    <Col>
                      <Text strong style={{ fontSize: '20px', color: '#52c41a' }}>
                        XAF {selectedRfq.items.reduce((sum, item) => sum + (item.totalPrice || 0), 0).toLocaleString()}
                      </Text>
                    </Col>
                  </Row>
                </div>
              </Card>

              {/* Quote Terms */}
              <Card title="Quote Terms & Conditions" size="small" style={{ marginBottom: '16px' }}>
                <Row gutter={16}>
                  <Col span={8}>
                    <Form.Item
                      name="validityPeriod"
                      label="Quote Validity"
                      initialValue="30"
                      rules={[{ required: true, message: 'Please specify validity period' }]}
                    >
                      <Select>
                        <Option value="15">15 days</Option>
                        <Option value="30">30 days</Option>
                        <Option value="45">45 days</Option>
                        <Option value="60">60 days</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item
                      name="paymentTerms"
                      label="Payment Terms"
                      initialValue={selectedRfq.paymentTerms}
                    >
                      <Select>
                        <Option value="Cash on delivery">Cash on delivery</Option>
                        <Option value="15 days">15 days</Option>
                        <Option value="30 days">30 days</Option>
                        <Option value="45 days">45 days</Option>
                        <Option value="60 days">60 days</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item
                      name="deliveryTerms"
                      label="Delivery Terms"
                      rules={[{ required: true, message: 'Please specify delivery terms' }]}
                    >
                      <Select>
                        <Option value="Free delivery">Free delivery</Option>
                        <Option value="Delivery charges apply">Delivery charges apply</Option>
                        <Option value="Customer pickup">Customer pickup</Option>
                        <Option value="Installation included">Installation included</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item
                  name="additionalNotes"
                  label="Additional Notes & Terms"
                >
                  <TextArea
                    rows={4}
                    placeholder="Add any special terms, conditions, or additional information about your quote..."
                  />
                </Form.Item>
              </Card>

              {/* Submit Actions */}
              <div style={{ textAlign: 'right', paddingTop: '16px', borderTop: '1px solid #d9d9d9' }}>
                <Space>
                  <Button
                    onClick={() => {
                      setQuoteModalVisible(false);
                      quoteForm.resetFields();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    icon={<SaveOutlined />}
                    onClick={() => {
                      message.info('Quote saved as draft');
                    }}
                  >
                    Save Draft
                  </Button>
                  <Button
                    type="primary"
                    icon={<SendOutlined />}
                    htmlType="submit"
                    loading={quoteSubmissionLoading}
                    disabled={selectedRfq.items.some(item => !item.quotedPrice)}
                  >
                    Submit Quote
                  </Button>
                </Space>
              </div>
            </Form>
          )}
        </Modal>

        {/* Invoice Upload Modal */}
        <Modal
          title={
            <Space>
              <UploadOutlined />
              Upload Invoice
            </Space>
          }
          open={uploadModalVisible}
          onCancel={() => {
            setUploadModalVisible(false);
            form.resetFields();
          }}
          footer={null}
          width={600}
        >
          <Alert
            message="Invoice Upload Requirements"
            description="Please ensure the PO number follows the format: PO-XX0000000000-X (e.g., PO-NG010000000-1)"
            type="info"
            showIcon
            style={{ marginBottom: '16px' }}
          />

          <Form
            form={form}
            layout="vertical"
            onFinish={handleInvoiceUpload}
          >
            <Form.Item
              name="poNumber"
              label="Purchase Order Number (PO)*"
              rules={[
                { required: true, message: 'Please enter PO number' },
                {
                  pattern: /^PO-\w{2}\d{10}-\d+$/i,
                  message: 'PO number format should be: PO-XX0000000000-X (e.g., PO-NG010000000-1)'
                }
              ]}
            >
              <Input 
                placeholder="e.g., PO-NG010000000-1" 
                style={{ textTransform: 'uppercase' }}
              />
            </Form.Item>

            <Form.Item
              name="invoiceNumber"
              label="Invoice Number*"
              rules={[{ required: true, message: 'Please enter invoice number' }]}
            >
              <Input placeholder="Enter invoice number" />
            </Form.Item>

            <Form.Item
              name="poFile"
              label="PO File (Optional)"
              valuePropName="fileList"
              getValueFromEvent={(e) => Array.isArray(e) ? e : e?.fileList}
            >
              <Dragger
                beforeUpload={() => false}
                maxCount={1}
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              >
                <p className="ant-upload-drag-icon">
                  <InboxOutlined />
                </p>
                <p className="ant-upload-text">Click or drag PO file to this area to upload</p>
                <p className="ant-upload-hint">Support for PDF, DOC, DOCX, JPG, PNG files (Max: 10MB)</p>
              </Dragger>
            </Form.Item>

            <Form.Item
              name="invoiceFile"
              label="Invoice File (Optional)"
              valuePropName="fileList"
              getValueFromEvent={(e) => Array.isArray(e) ? e : e?.fileList}
            >
              <Dragger
                beforeUpload={() => false}
                maxCount={1}
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              >
                <p className="ant-upload-drag-icon">
                  <InboxOutlined />
                </p>
                <p className="ant-upload-text">Click or drag invoice file to this area to upload</p>
                <p className="ant-upload-hint">Support for PDF, DOC, DOCX, JPG, PNG files (Max: 10MB)</p>
              </Dragger>
            </Form.Item>

            <Divider />

            <Form.Item>
              <Space>
                <Button onClick={() => {
                  setUploadModalVisible(false);
                  form.resetFields();
                }}>
                  Cancel
                </Button>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  loading={uploadLoading}
                  icon={<SendOutlined />}
                >
                  Submit Invoice
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>

        {/* Invoice Details Modal */}
        <Modal
          title="Invoice Details"
          open={invoiceDetailModalVisible}
          onCancel={() => {
            setInvoiceDetailModalVisible(false);
            setSelectedInvoice(null);
          }}
          footer={null}
          width={800}
        >
          {selectedInvoice && (
            <div>
              <Descriptions column={2} bordered>
                <Descriptions.Item label="Invoice Number">
                  {selectedInvoice.invoiceNumber}
                </Descriptions.Item>
                <Descriptions.Item label="PO Number">
                  {selectedInvoice.poNumber}
                </Descriptions.Item>
                <Descriptions.Item label="Upload Date">
                  {moment(selectedInvoice.uploadedDate).format('DD/MM/YYYY')}
                </Descriptions.Item>
                <Descriptions.Item label="Status">
                  {getInvoiceStatusTag(selectedInvoice.approvalStatus)}
                </Descriptions.Item>
                <Descriptions.Item label="Department">
                  {selectedInvoice.assignedDepartment}
                </Descriptions.Item>
              </Descriptions>

              {/* File downloads */}
              <div style={{ marginTop: '16px' }}>
                <Text strong>Attached Files:</Text>
                <div style={{ marginTop: '8px' }}>
                  {selectedInvoice.poFile && (
                    <Button
                      icon={<FileOutlined />}
                      onClick={() => handleDownloadAttachment(selectedInvoice.poFile)}
                      style={{ marginRight: '8px' }}
                    >
                      PO File
                    </Button>
                  )}
                  {selectedInvoice.invoiceFile && (
                    <Button
                      icon={<FileOutlined />}
                      onClick={() => handleDownloadAttachment(selectedInvoice.invoiceFile)}
                    >
                      Invoice File
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </Modal>
      </Content>
    </Layout>
  );
};

export default UnifiedSupplierPortal;




