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
  InputNumber,
  Progress,
  Tabs,
  Alert,
  Divider,
  Badge,
  message,
  Tooltip,
  Descriptions,
  Drawer,
  List,
  notification,
  Checkbox,
  Spin
} from 'antd';
import {
  FileTextOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  StarOutlined,
  DownloadOutlined,
  MailOutlined,
  PhoneOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  SendOutlined,
  QuestionCircleOutlined,
  ThunderboltOutlined,
  TrophyOutlined,
  WarningOutlined
} from '@ant-design/icons';
import moment from 'moment';
import { buyerRequisitionAPI } from '../../services/buyerRequisitionAPI';

const { Title, Text } = Typography;
const { TextArea } = Input;

const BuyerQuoteManagement = () => {
  const [quotes, setQuotes] = useState([]);
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false);
  const [evaluationModalVisible, setEvaluationModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [evaluationForm] = Form.useForm();
  const [requisitions, setRequisitions] = useState([]);

  useEffect(() => {
    console.log('Component mounted - loading requisitions');
    loadQuotedRequisitions();
  }, []);

  useEffect(() => {
    console.log('Requisitions changed:', requisitions.length);
    if (requisitions.length > 0) {
      console.log('Loading quotes for requisitions...');
      loadQuotesForRequisitions();
    }
  }, [requisitions]);

  const loadQuotedRequisitions = async () => {
    try {
      setLoading(true);
      
      console.log('=== LOADING QUOTED REQUISITIONS ===');
      
      const response = await buyerRequisitionAPI.getAssignedRequisitions({
        status: 'in_procurement'
      });
      
      console.log('Requisitions response:', response);
      
      if (response.success && response.data) {
        const requisitionsWithQuotes = [];
        
        for (const requisition of response.data) {
          try {
            console.log(`Checking quotes for requisition: ${requisition.id}`);
            
            const quotesResponse = await buyerRequisitionAPI.getQuotes(requisition.id);
            console.log(`Quotes response for ${requisition.id}:`, quotesResponse);
            
            if (quotesResponse.success && quotesResponse.data && quotesResponse.data.length > 0) {
              requisitionsWithQuotes.push({
                ...requisition,
                quotesCount: quotesResponse.data.length,
                hasQuotes: true
              });
              console.log(`✓ Found ${quotesResponse.data.length} quotes for requisition ${requisition.id}`);
            } else {
              console.log(`✗ No quotes found for requisition ${requisition.id}`);
            }
          } catch (error) {
            console.error(`Error checking quotes for requisition ${requisition.id}:`, error);
          }
        }
        
        console.log(`Final requisitions with quotes: ${requisitionsWithQuotes.length}`);
        setRequisitions(requisitionsWithQuotes);
        
        if (requisitionsWithQuotes.length === 0) {
          console.log('No requisitions with quotes found');
        }
      } else {
        console.error('Failed to load requisitions:', response);
        message.error('Failed to load requisitions');
      }
    } catch (error) {
      console.error('Error loading quoted requisitions:', error);
      message.error('Error loading requisitions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadQuotesForRequisitions = async () => {
    try {
      setLoading(true);
      const allQuotes = [];
  
      console.log('=== LOADING QUOTES FOR REQUISITIONS (DEBUG) ===');
      console.log('Requisitions to check:', requisitions.length);
  
      for (const requisition of requisitions) {
        try {
          console.log(`\n--- Loading quotes for requisition: ${requisition.id} ---`);
          
          // Use getRFQDetails which provides complete data structure
          const response = await buyerRequisitionAPI.getRFQDetails(requisition.id);
          console.log('Raw API response:', response);
          
          if (response.success && response.data && response.data.quotes && response.data.quotes.length > 0) {
            console.log(`Found ${response.data.quotes.length} quotes for requisition ${requisition.id}`);
            
            const quotesWithContext = response.data.quotes.map((quote, index) => {
              console.log(`\n--- Processing quote ${index + 1} ---`);
              console.log('Raw quote data:', quote);
              
              // Transform quote with GUARANTEED requisitionId
              const transformedQuote = {
                // Core identifiers - ENSURE requisitionId is set from response data
                id: quote.id || quote._id,
                quoteNumber: quote.quoteNumber || `QUOTE-${quote.id || quote._id}`,
                rfqId: quote.rfqId,
                supplierId: quote.supplierId,
                
                // CRITICAL: Use requisition ID from the response data
                requisitionId: response.data.requisition.id,
                requisitionTitle: response.data.requisition.title,
                requisitionBudget: response.data.requisition.budget,
                
                // Supplier information
                supplierName: quote.supplierName || 'Unknown Supplier',
                supplierEmail: quote.supplierEmail || '',
                supplierPhone: quote.supplierPhone || '',
                
                // Quote details
                totalAmount: quote.totalAmount || 0,
                currency: quote.currency || 'XAF',
                submissionDate: quote.submissionDate || new Date(),
                validUntil: quote.validUntil || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                status: quote.status || 'received',
                
                // Terms
                deliveryTime: quote.deliveryTime || 7,
                deliveryTimeUnit: quote.deliveryTimeUnit || 'days',
                paymentTerms: quote.paymentTerms || '30 days',
                warranty: quote.warranty || 'Standard',
                
                // Additional data
                items: quote.items || [],
                notes: quote.supplierNotes || quote.notes || '',
                attachments: quote.attachments || [],
                
                // Evaluation
                evaluation: quote.evaluation || { 
                  evaluated: false,
                  qualityScore: 0,
                  costScore: 0,
                  deliveryScore: 0,
                  totalScore: 0
                },
                
                // Store full context for later use
                requisitionData: response.data.requisition,
                rfqData: response.data.rfq
              };
              
              // VALIDATION: Check that requisitionId is properly set
              if (!transformedQuote.requisitionId) {
                console.error('❌ CRITICAL ERROR: Quote missing requisitionId after transformation!');
                console.error('Original quote:', quote);
                console.error('Response data:', response.data);
              } else {
                console.log('✅ Quote properly transformed with requisitionId:', transformedQuote.requisitionId);
              }
              
              return transformedQuote;
            });
            
            allQuotes.push(...quotesWithContext);
            console.log(`✅ Added ${quotesWithContext.length} quotes from requisition ${requisition.id}`);
          } else {
            console.log(`❌ No quotes found for requisition ${requisition.id}`);
          }
        } catch (error) {
          console.error(`❌ Error loading quotes for ${requisition.id}:`, error);
        }
      }
  
      console.log(`\n=== FINAL RESULTS ===`);
      console.log(`Total quotes loaded: ${allQuotes.length}`);
      
      // Validate all quotes have requisitionId
      const quotesWithoutRequisitionId = allQuotes.filter(quote => !quote.requisitionId);
      if (quotesWithoutRequisitionId.length > 0) {
        console.error('❌ CRITICAL: Found quotes without requisitionId:', quotesWithoutRequisitionId);
      } else {
        console.log('✅ All quotes have valid requisitionId');
      }
      
      setQuotes(allQuotes);
      
    } catch (error) {
      console.error('❌ Error loading quotes:', error);
      message.error('Error loading quotes. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusTag = (status) => {
    const statusMap = {
      'received': { color: 'blue', text: 'Received', icon: <ClockCircleOutlined /> },
      'evaluated': { color: 'green', text: 'Evaluated', icon: <CheckCircleOutlined /> },
      'selected': { color: 'success', text: 'Selected', icon: <TrophyOutlined /> },
      'rejected': { color: 'red', text: 'Rejected', icon: <CloseCircleOutlined /> },
      'expired': { color: 'default', text: 'Expired', icon: <ExclamationCircleOutlined /> },
      'clarification': { color: 'orange', text: 'Clarification Requested', icon: <QuestionCircleOutlined /> }
    };
    const statusInfo = statusMap[status] || { color: 'default', text: status, icon: <ClockCircleOutlined /> };
    return (
      <Tag color={statusInfo.color} icon={statusInfo.icon}>
        {statusInfo.text}
      </Tag>
    );
  };

  const handleViewDetails = (quote) => {
    console.log('=== VIEW DETAILS CLICKED ===');
    console.log('Quote data:', {
      id: quote.id,
      requisitionId: quote.requisitionId,
      supplierName: quote.supplierName
    });
    
    // Since we already have complete data from loadQuotesForRequisitions, 
    // we don't need to make another API call
    if (!quote.requisitionId) {
      console.error('❌ Quote missing requisitionId in handleViewDetails!', quote);
      message.error('Quote is missing requisition information. Please refresh the page and try again.');
      return;
    }
    
    setSelectedQuote(quote);
    setDetailDrawerVisible(true);
  };

  const handleEvaluateQuote = (quote) => {
    console.log('=== EVALUATE QUOTE CLICKED ===');
    console.log('Quote data:', {
      id: quote.id,
      requisitionId: quote.requisitionId,
      supplierName: quote.supplierName
    });
    
    // VALIDATION: Check requisitionId
    if (!quote.requisitionId) {
      console.error('❌ CRITICAL: Quote missing requisitionId!', quote);
      message.error('Quote is missing requisition information. Please refresh the page and try again.');
      return;
    }
  
    setSelectedQuote(quote);
    evaluationForm.setFieldsValue({
      qualityScore: quote.evaluation?.qualityScore || 0,
      costScore: quote.evaluation?.costScore || 0,
      deliveryScore: quote.evaluation?.deliveryScore || 0,
      notes: quote.evaluation?.notes || ''
    });
    setEvaluationModalVisible(true);
  };

  const handleSubmitEvaluation = async () => {
    try {
      const values = await evaluationForm.validateFields();
      setLoading(true);
      
      if (!selectedQuote || !selectedQuote.id) {
        message.error('No quote selected for evaluation');
        return;
      }
  
      if (!selectedQuote.requisitionId) {
        message.error('Quote missing requisition information');
        console.error('Selected quote missing requisitionId:', selectedQuote);
        return;
      }
  
      console.log('=== SUBMITTING QUOTE EVALUATION ===');
      console.log('Quote ID:', selectedQuote.id);
      console.log('Requisition ID:', selectedQuote.requisitionId);
      console.log('Evaluation values:', values);
      
      const weights = { quality: 0.4, cost: 0.35, delivery: 0.25 };
      const totalScore = (
        values.qualityScore * weights.quality +
        values.costScore * weights.cost +
        values.deliveryScore * weights.delivery
      );
  
      const evaluationData = {
        quoteId: selectedQuote.id,
        evaluation: {
          qualityScore: values.qualityScore,
          costScore: values.costScore,
          deliveryScore: values.deliveryScore,
          totalScore: Math.round(totalScore * 100) / 100,
          notes: values.notes
        }
      };
  
      const response = await buyerRequisitionAPI.evaluateQuotes(selectedQuote.requisitionId, evaluationData);
      
      if (response.success) {
        message.success('Quote evaluation submitted successfully!');
        setEvaluationModalVisible(false);
        evaluationForm.resetFields();
        
        const updatedQuotes = quotes.map(quote => {
          if (quote.id === selectedQuote.id) {
            return {
              ...quote,
              status: 'evaluated',
              evaluation: {
                evaluated: true,
                ...evaluationData.evaluation,
                evaluationDate: new Date()
              }
            };
          }
          return quote;
        });
        
        setQuotes(updatedQuotes);
        loadQuotesForRequisitions();
      } else {
        message.error(response.message || 'Failed to submit evaluation');
      }
    } catch (error) {
      console.error('Error submitting evaluation:', error);
      message.error('Failed to submit evaluation');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectQuote = async (quote) => {
    if (!quote.requisitionId) {
      message.error('Quote is missing requisition information');
      return;
    }
  
    Modal.confirm({
      title: 'Select Quote & Create Purchase Order',
      content: (
        <div>
          <p>Are you sure you want to select the quote from <strong>{quote.supplierName}</strong>?</p>
          <p><strong>Amount:</strong> {quote.currency} {quote.totalAmount.toLocaleString()}</p>
          <p style={{ color: '#1890ff', fontSize: '12px' }}>
            A purchase order will be automatically created upon selection.
          </p>
        </div>
      ),
      onOk: async () => {
        try {
          setLoading(true);
          
          const selectionData = {
            selectionReason: 'Selected as best evaluated quote',
            createPurchaseOrder: true,
            purchaseOrderDetails: {
              deliveryDate: quote.expectedDeliveryDate,
              paymentTerms: quote.paymentTerms,
              specialInstructions: `Purchase order for quote ${quote.id}`
            }
          };
  
          console.log('Selecting quote with data:', selectionData);
  
          const response = await buyerRequisitionAPI.selectQuote(
            quote.requisitionId, 
            quote.id, 
            selectionData
          );
          
          if (response.success) {
            message.success('Quote selected and purchase order created successfully!');
            
            // Update local state
            const updatedQuotes = quotes.map(q => {
              if (q.id === quote.id) {
                return { ...q, status: 'selected' };
              } else if (q.requisitionId === quote.requisitionId) {
                return { ...q, status: 'rejected' };
              }
              return q;
            });
            
            setQuotes(updatedQuotes);
            setActiveTab('selected');
            
            // Show detailed success notification
            notification.success({
              message: 'Quote Selected & Purchase Order Created',
              description: (
                <div>
                  <p><strong>Supplier:</strong> {quote.supplierName}</p>
                  <p><strong>Amount:</strong> {quote.currency} {quote.totalAmount.toLocaleString()}</p>
                  {response.data.purchaseOrder && (
                    <p><strong>PO Number:</strong> {response.data.purchaseOrder.poNumber}</p>
                  )}
                </div>
              ),
              duration: 8
            });
            
          } else {
            message.error(response.message || 'Failed to select quote');
            console.error('Quote selection failed:', response);
          }
        } catch (error) {
          console.error('Error selecting quote:', error);
          message.error('Failed to select quote: ' + (error.response?.data?.message || error.message));
        } finally {
          setLoading(false);
        }
      }
    });
  };

  const handleRejectQuote = (quote) => {
    if (!quote.requisitionId) {
      message.error('Quote is missing requisition information');
      return;
    }
  
    let rejectionReason = '';
    
    Modal.confirm({
      title: 'Reject Quote',
      content: (
        <div>
          <p>Are you sure you want to reject the quote from {quote.supplierName}?</p>
          <TextArea 
            placeholder="Please provide a reason for rejection..."
            onChange={(e) => rejectionReason = e.target.value}
            rows={3}
          />
        </div>
      ),
      onOk: async () => {
        if (!rejectionReason.trim()) {
          message.error('Please provide a reason for rejection');
          return;
        }
  
        try {
          setLoading(true);
          
          const rejectionData = {
            rejectionReason: rejectionReason.trim()
          };
  
          const response = await buyerRequisitionAPI.rejectQuote(
            quote.requisitionId, 
            quote.id, 
            rejectionData
          );
          
          if (response.success) {
            message.success('Quote rejected successfully');
            
            // Update local state only
            const updatedQuotes = quotes.map(q => {
              if (q.id === quote.id) {
                return { ...q, status: 'rejected' };
              }
              return q;
            });
            
            setQuotes(updatedQuotes);
            
            // Don't auto-reload, let user refresh manually if needed
            
          } else {
            message.error(response.message || 'Failed to reject quote');
          }
        } catch (error) {
          console.error('Error rejecting quote:', error);
          message.error('Failed to reject quote');
        } finally {
          setLoading(false);
        }
      }
    });
  };

  const handleRequestClarification = async (quote) => {
    let clarificationText = '';
    
    Modal.confirm({
      title: `Request Clarification from ${quote.supplierName}`,
      content: (
        <div>
          <p>What clarification do you need regarding this quote?</p>
          <TextArea 
            placeholder="Enter your questions or clarification requests..." 
            onChange={(e) => clarificationText = e.target.value}
            rows={4}
          />
        </div>
      ),
      onOk: async () => {
        if (!clarificationText.trim()) {
          message.error('Please enter your clarification request');
          return;
        }
  
        try {
          setLoading(true);
          
          const clarificationRequest = {
            questions: clarificationText.trim(),
            priority: 'medium'
          };
  
          const response = await buyerRequisitionAPI.requestQuoteClarification(
            quote.requisitionId, 
            quote.id, 
            clarificationRequest
          );
          
          if (response.success) {
            message.success('Clarification request sent to supplier');
            
            notification.info({
              message: 'Clarification Request Sent',
              description: `Your clarification request has been sent to ${quote.supplierName}. They will be notified via email.`,
              duration: 5
            });
            
            await loadQuotesForRequisitions();
          } else {
            message.error(response.message || 'Failed to send clarification request');
          }
        } catch (error) {
          console.error('Error requesting clarification:', error);
          message.error('Failed to send clarification request');
        } finally {
          setLoading(false);
        }
      }
    });
  };

  const getFilteredQuotes = () => {
    console.log('Filtering quotes:', { activeTab, totalQuotes: quotes.length });
    
    let filtered = [];
    
    switch (activeTab) {
      case 'received':
        filtered = quotes.filter(q => q.status === 'received');
        break;
      case 'evaluated':
        filtered = quotes.filter(q => q.status === 'evaluated');
        break;
      case 'selected':
        filtered = quotes.filter(q => q.status === 'selected');
        break;
      case 'expired':
        filtered = quotes.filter(q => {
          const validUntil = new Date(q.validUntil);
          const now = new Date();
          return validUntil < now;
        });
        break;
      default: // 'all'
        filtered = quotes;
    }
    
    console.log(`Filtered quotes for tab '${activeTab}':`, filtered.length);
    return filtered;
  };

  const columns = [
    {
      title: 'Quote Details',
      key: 'details',
      render: (_, record) => (
        <div>
          <Text strong>{record.supplierName}</Text>
          <br />
          {/* <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.id} • Req: {record.requisitionId}
          </Text> */}
          <br />
          <Text type="secondary" style={{ fontSize: '11px' }}>
            {record.requisitionTitle}
          </Text>
          <br />
          <Text type="secondary" style={{ fontSize: '11px' }}>
            Submitted: {moment(record.submissionDate).format('MMM DD, HH:mm')}
          </Text>
        </div>
      ),
      width: 200
    },
    {
      title: 'Total Amount',
      key: 'amount',
      render: (_, record) => (
        <div>
          <Text strong style={{ color: '#1890ff', fontSize: '16px' }}>
            {record.currency} {record.totalAmount.toLocaleString()}
          </Text>
          <br />
          <Text type="secondary" style={{ fontSize: '12px' }}>
            Budget: XAF {record.requisitionBudget?.toLocaleString()}
          </Text>
        </div>
      ),
      width: 140,
      sorter: (a, b) => a.totalAmount - b.totalAmount
    },
    {
      title: 'Delivery Terms',
      key: 'delivery',
      render: (_, record) => (
        <div>
          <Text strong>{record.deliveryTime} {record.deliveryTimeUnit}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: '12px' }}>
            Payment: {record.paymentTerms}
          </Text>
          <br />
          <Text type="secondary" style={{ fontSize: '12px' }}>
            Warranty: {record.warranty}
          </Text>
        </div>
      ),
      width: 120
    },
    {
      title: 'Valid Until',
      key: 'validity',
      render: (_, record) => {
        const isExpired = moment(record.validUntil).isBefore(moment());
        const daysLeft = moment(record.validUntil).diff(moment(), 'days');
        
        return (
          <div>
            <Text type={isExpired ? 'danger' : daysLeft <= 2 ? 'warning' : 'default'}>
              {moment(record.validUntil).format('MMM DD')}
            </Text>
            <br />
            <Text type="secondary" style={{ fontSize: '11px' }}>
              {isExpired ? 'Expired' : `${daysLeft} days left`}
            </Text>
            {(isExpired || daysLeft <= 2) && (
              <ExclamationCircleOutlined style={{ color: '#ff4d4f', marginLeft: '4px' }} />
            )}
          </div>
        );
      },
      width: 100
    },
    {
      title: 'Evaluation Score',
      key: 'evaluation',
      render: (_, record) => (
        <div>
          {record.evaluation?.evaluated ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <Progress 
                  type="circle" 
                  percent={record.evaluation.totalScore} 
                  width={40}
                  strokeColor={
                    record.evaluation.totalScore >= 80 ? '#52c41a' : 
                    record.evaluation.totalScore >= 60 ? '#faad14' : '#ff4d4f'
                  }
                />
                <Text style={{ marginLeft: '8px', fontSize: '12px' }}>
                  {record.evaluation.totalScore}/100
                </Text>
              </div>
            </>
          ) : (
            <Text type="secondary">Not evaluated</Text>
          )}
        </div>
      ),
      width: 120
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => getStatusTag(status),
      width: 130
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="small" direction="vertical">
          <Tooltip title="View Details">
            <Button 
              size="small" 
              icon={<EyeOutlined />}
              onClick={() => handleViewDetails(record)}
            />
          </Tooltip>
          {record.status === 'received' && (
            <Tooltip title="Evaluate Quote">
              <Button 
                size="small" 
                type="primary"
                icon={<StarOutlined />}
                onClick={() => handleEvaluateQuote(record)}
              />
            </Tooltip>
          )}
          {record.status === 'evaluated' && (
            <>
              <Tooltip title="Select Quote">
                <Button 
                  size="small" 
                  type="primary"
                  icon={<CheckCircleOutlined />}
                  onClick={() => handleSelectQuote(record)}
                />
              </Tooltip>
              <Tooltip title="Reject Quote">
                <Button 
                  size="small" 
                  danger
                  icon={<CloseCircleOutlined />}
                  onClick={() => handleRejectQuote(record)}
                />
              </Tooltip>
            </>
          )}
          {!['selected', 'rejected', 'expired'].includes(record.status) && (
            <Tooltip title="Request Clarification">
              <Button 
                size="small" 
                icon={<QuestionCircleOutlined />}
                onClick={() => handleRequestClarification(record)}
              />
            </Tooltip>
          )}
        </Space>
      ),
      width: 100,
      fixed: 'right'
    }
  ];

  const stats = {
    total: quotes.length,
    received: quotes.filter(q => q.status === 'received').length,
    evaluated: quotes.filter(q => q.status === 'evaluated').length,
    selected: quotes.filter(q => q.status === 'selected').length,
    expired: quotes.filter(q => {
      try {
        const validUntil = new Date(q.validUntil);
        const now = new Date();
        return validUntil < now;
      } catch (error) {
        return false;
      }
    }).length
  };

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <Title level={2} style={{ margin: 0 }}>
            <FileTextOutlined /> Quote Management & Evaluation
          </Title>
          <Space>
            <Button icon={<DownloadOutlined />}>
              Export Report
            </Button>
          </Space>
        </div>

        {/* Statistics */}
        <Row gutter={16} style={{ marginBottom: '24px' }}>
          <Col span={6}>
            <Statistic
              title="Total Quotes"
              value={stats.total}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="Pending Evaluation"
              value={stats.received}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="Evaluated"
              value={stats.evaluated}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="Expired"
              value={stats.expired}
              prefix={<ExclamationCircleOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Col>
        </Row>

        {/* Alert for pending evaluations */}
        {stats.received > 0 && (
          <Alert
            message={`${stats.received} Quote${stats.received !== 1 ? 's' : ''} Awaiting Evaluation`}
            description="You have received quotes that require evaluation to proceed with the procurement process."
            type="info"
            showIcon
            action={
              <Button 
                size="small" 
                type="primary" 
                onClick={() => setActiveTab('received')}
              >
                Evaluate Now
              </Button>
            }
            style={{ marginBottom: '24px' }}
          />
        )}

        {/* Expired quotes alert */}
        {stats.expired > 0 && (
          <Alert
            message={`${stats.expired} Quote${stats.expired !== 1 ? 's' : ''} Have Expired`}
            description="Some quotes have passed their validity period. Contact suppliers for quote extensions if needed."
            type="warning"
            showIcon
            style={{ marginBottom: '24px' }}
          />
        )}

        {/* Tabs */}
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <Tabs.TabPane 
            tab={
              <Badge count={stats.total} size="small">
                <span>All Quotes ({stats.total})</span>
              </Badge>
            } 
            key="all"
          />
          <Tabs.TabPane 
            tab={
              <Badge count={stats.received} size="small">
                <span><ClockCircleOutlined /> Received ({stats.received})</span>
              </Badge>
            } 
            key="received"
          />
          <Tabs.TabPane 
            tab={
              <Badge count={stats.evaluated} size="small">
                <span><CheckCircleOutlined /> Evaluated ({stats.evaluated})</span>
              </Badge>
            } 
            key="evaluated"
          />
          <Tabs.TabPane 
            tab={
              <span><TrophyOutlined /> Selected ({stats.selected})</span>
            } 
            key="selected"
          />
          <Tabs.TabPane 
            tab={
              <Badge count={stats.expired} size="small">
                <span><ExclamationCircleOutlined /> Expired ({stats.expired})</span>
              </Badge>
            } 
            key="expired"
          />
        </Tabs>

        <Table
          columns={columns}
          dataSource={getFilteredQuotes()}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} quotes`
          }}
          scroll={{ x: 'max-content' }}
        />
      </Card>

      {/* Quote Details Drawer */}
      <Drawer
        title={
          <Space>
            <FileTextOutlined />
            Quote Details - {selectedQuote?.supplierName}
          </Space>
        }
        placement="right"
        width={800}
        open={detailDrawerVisible}
        onClose={() => setDetailDrawerVisible(false)}
      >
        {selectedQuote && (
          <div>
            {/* Quote Header */}
            <Card size="small" title="Quote Information" style={{ marginBottom: '16px' }}>
              <Descriptions column={2} size="small">
                <Descriptions.Item label="Quote ID">
                  <Text code>{selectedQuote.id}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Requisition">
                  {selectedQuote.requisitionId}
                </Descriptions.Item>
                <Descriptions.Item label="Supplier">
                  {selectedQuote.supplierName}
                </Descriptions.Item>
                <Descriptions.Item label="Total Amount">
                  <Text strong style={{ color: '#1890ff', fontSize: '16px' }}>
                    {selectedQuote.currency} {selectedQuote.totalAmount.toLocaleString()}
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="Submitted">
                  {moment(selectedQuote.submissionDate).format('MMM DD, YYYY HH:mm')}
                </Descriptions.Item>
                <Descriptions.Item label="Valid Until">
                  <Text type={moment(selectedQuote.validUntil).isBefore(moment()) ? 'danger' : 'default'}>
                    {moment(selectedQuote.validUntil).format('MMM DD, YYYY HH:mm')}
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="Delivery Time">
                  {selectedQuote.deliveryTime} {selectedQuote.deliveryTimeUnit}
                </Descriptions.Item>
                <Descriptions.Item label="Payment Terms">
                  {selectedQuote.paymentTerms}
                </Descriptions.Item>
                <Descriptions.Item label="Warranty">
                  {selectedQuote.warranty}
                </Descriptions.Item>
                <Descriptions.Item label="Status">
                  {getStatusTag(selectedQuote.status)}
                </Descriptions.Item>
              </Descriptions>
            </Card>

            {/* Contact Information */}
            <Card size="small" title="Supplier Contact" style={{ marginBottom: '16px' }}>
              <Space direction="vertical">
                <Text>
                  <MailOutlined /> {selectedQuote.supplierEmail}
                </Text>
                <Text>
                  <PhoneOutlined /> {selectedQuote.supplierPhone}
                </Text>
              </Space>
            </Card>

            {/* Items Table */}
            <Card size="small" title="Quoted Items" style={{ marginBottom: '16px' }}>
              <Table
                columns={[
                  {
                    title: 'Description',
                    dataIndex: 'description',
                    key: 'description'
                  },
                  {
                    title: 'Qty',
                    dataIndex: 'quantity',
                    key: 'quantity',
                    width: 60,
                    align: 'center'
                  },
                  {
                    title: 'Unit Price',
                    dataIndex: 'unitPrice',
                    key: 'unitPrice',
                    render: (price) => `XAF ${price.toLocaleString()}`,
                    width: 100
                  },
                  {
                    title: 'Total',
                    dataIndex: 'totalPrice',
                    key: 'totalPrice',
                    render: (price) => (
                      <Text strong>XAF {price.toLocaleString()}</Text>
                    ),
                    width: 100
                  }
                ]}
                dataSource={selectedQuote.items}
                pagination={false}
                size="small"
                rowKey="description"
                summary={(pageData) => {
                  const total = pageData.reduce((sum, item) => sum + item.totalPrice, 0);
                  return (
                    <Table.Summary.Row>
                      <Table.Summary.Cell index={0} colSpan={3}>
                        <Text strong>Total Amount:</Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={3}>
                        <Text strong style={{ color: '#1890ff', fontSize: '16px' }}>
                          XAF {total.toLocaleString()}
                        </Text>
                      </Table.Summary.Cell>
                    </Table.Summary.Row>
                  );
                }}
              />
            </Card>

            {/* Evaluation Score */}
            {selectedQuote.evaluation?.evaluated && (
              <Card size="small" title="Evaluation Results" style={{ marginBottom: '16px' }}>
                <Row gutter={[16, 16]}>
                  <Col span={6}>
                    <Statistic
                      title="Quality Score"
                      value={selectedQuote.evaluation.qualityScore}
                      suffix="/100"
                    />
                  </Col>
                  <Col span={6}>
                    <Statistic
                      title="Cost Score"
                      value={selectedQuote.evaluation.costScore}
                      suffix="/100"
                    />
                  </Col>
                  <Col span={6}>
                    <Statistic
                      title="Delivery Score"
                      value={selectedQuote.evaluation.deliveryScore}
                      suffix="/100"
                    />
                  </Col>
                  <Col span={6}>
                    <Statistic
                      title="Total Score"
                      value={selectedQuote.evaluation.totalScore}
                      suffix="/100"
                      valueStyle={{
                        color: selectedQuote.evaluation.totalScore >= 80 ? '#52c41a' : 
                               selectedQuote.evaluation.totalScore >= 60 ? '#faad14' : '#ff4d4f'
                      }}
                    />
                  </Col>
                </Row>
                
                <Divider />
                
                <Text strong>Evaluation Notes:</Text>
                <div style={{ marginTop: '8px', padding: '8px', background: '#f5f5f5', borderRadius: '4px' }}>
                  <Text>{selectedQuote.evaluation.notes}</Text>
                </div>
              </Card>
            )}

            {/* Notes */}
            <Card size="small" title="Supplier Notes" style={{ marginBottom: '16px' }}>
              <div style={{ padding: '8px', background: '#f5f5f5', borderRadius: '4px' }}>
                <Text>{selectedQuote.notes}</Text>
              </div>
            </Card>

            {/* Action Buttons */}
            <Space style={{ marginTop: '16px' }}>
              {selectedQuote.status === 'received' && (
                <Button 
                  type="primary" 
                  icon={<StarOutlined />}
                  onClick={() => {
                    setDetailDrawerVisible(false);
                    handleEvaluateQuote(selectedQuote);
                  }}
                >
                  Evaluate Quote
                </Button>
              )}
              {selectedQuote.status === 'evaluated' && (
                <>
                  <Button 
                    type="primary" 
                    icon={<CheckCircleOutlined />}
                    onClick={() => handleSelectQuote(selectedQuote)}
                  >
                    Select Quote
                  </Button>
                  <Button 
                    danger
                    icon={<CloseCircleOutlined />}
                    onClick={() => handleRejectQuote(selectedQuote)}
                  >
                    Reject
                  </Button>
                </>
              )}
              <Button 
                icon={<QuestionCircleOutlined />}
                onClick={() => {
                  setDetailDrawerVisible(false);
                  handleRequestClarification(selectedQuote);
                }}
              >
                Request Clarification
              </Button>
            </Space>
          </div>
        )}
      </Drawer>

      {/* Quote Evaluation Modal */}
      <Modal
        title="Quote Evaluation"
        open={evaluationModalVisible}
        onOk={handleSubmitEvaluation}
        onCancel={() => setEvaluationModalVisible(false)}
        confirmLoading={loading}
        width={600}
      >
        {selectedQuote && (
          <div>
            <Alert
              message={`Evaluating quote from ${selectedQuote.supplierName}`}
              description={`Total Amount: XAF ${selectedQuote.totalAmount.toLocaleString()}`}
              type="info"
              showIcon
              style={{ marginBottom: '24px' }}
            />

            <Form form={evaluationForm} layout="vertical">
              <Row gutter={[16, 16]}>
                <Col span={8}>
                  <Form.Item
                    name="qualityScore"
                    label="Quality Score (0-100)"
                    rules={[
                      { required: true, message: 'Please rate quality' },
                      { type: 'number', min: 0, max: 100, message: 'Score must be 0-100' }
                    ]}
                  >
                    <InputNumber
                      min={0}
                      max={100}
                      style={{ width: '100%' }}
                      formatter={value => `${value} pts`}
                      parser={value => value.replace(' pts', '')}
                    />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    name="costScore"
                    label="Cost Competitiveness (0-100)"
                    rules={[
                      { required: true, message: 'Please rate cost' },
                      { type: 'number', min: 0, max: 100, message: 'Score must be 0-100' }
                    ]}
                  >
                    <InputNumber
                      min={0}
                      max={100}
                      style={{ width: '100%' }}
                      formatter={value => `${value} pts`}
                      parser={value => value.replace(' pts', '')}
                    />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    name="deliveryScore"
                    label="Delivery Terms (0-100)"
                    rules={[
                      { required: true, message: 'Please rate delivery' },
                      { type: 'number', min: 0, max: 100, message: 'Score must be 0-100' }
                    ]}
                  >
                    <InputNumber
                      min={0}
                      max={100}
                      style={{ width: '100%' }}
                      formatter={value => `${value} pts`}
                      parser={value => value.replace(' pts', '')}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                name="notes"
                label="Evaluation Notes"
                rules={[{ required: true, message: 'Please add evaluation notes' }]}
              >
                <TextArea
                  rows={4}
                  placeholder="Add detailed evaluation notes, including strengths, weaknesses, and recommendations..."
                  showCount
                  maxLength={500}
                />
              </Form.Item>
            </Form>

            <Alert
              message="Evaluation Criteria Weights"
              description="Quality: 40% • Cost: 35% • Delivery: 25%"
              type="info"
              showIcon
              style={{ marginTop: '16px' }}
            />
          </div>
        )}
      </Modal>
    </div>
  );
};

export default BuyerQuoteManagement;





