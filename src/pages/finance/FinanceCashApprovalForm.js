import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DOMPurify from 'dompurify';
import {
  Card,
  Form,
  Input,
  Button,
  Radio,
  Typography,
  Space,
  Alert,
  Descriptions,
  Tag,
  Divider,
  InputNumber,
  Select,
  message,
  Spin,
  Row,
  Col,
  Statistic,
  Table,
  Progress,
  Badge,
  Tooltip,
  Timeline
} from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  DollarOutlined,
  FileTextOutlined,
  BankOutlined,
  SendOutlined,
  WarningOutlined,
  InfoCircleOutlined,
  DownloadOutlined,
  EyeOutlined,
  ClockCircleOutlined,
  UserOutlined,
  HourglassOutlined
} from '@ant-design/icons';
import { cashRequestAPI } from '../../services/cashRequestAPI';
import { budgetCodeAPI } from '../../services/budgetCodeAPI';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const FinanceCashApprovalForm = () => {
  const { requestId } = useParams();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [request, setRequest] = useState(null);
  const [budgetCodes, setBudgetCodes] = useState([]);
  const [selectedBudgetCode, setSelectedBudgetCode] = useState(null);
  
  const [canApprove, setCanApprove] = useState(false);
  const [canDisburse, setCanDisburse] = useState(false);
  const [isAwaitingCEO, setIsAwaitingCEO] = useState(false);
  
  const [enableDisbursement, setEnableDisbursement] = useState(false);
  const [disbursementAmount, setDisbursementAmount] = useState(0);
  const [downloadingPDF, setDownloadingPDF] = useState(false);

  const handleDownloadPDF = async () => {
    try {
      setDownloadingPDF(true);
      message.loading({ content: 'Generating PDF...', key: 'pdf-download' });

      const token = localStorage.getItem('token');
      if (!token) {
        message.error('Authentication required');
        return;
      }

      const apiBaseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
      const pdfUrl = `${apiBaseUrl}/cash-requests/${requestId}/pdf`;

      const response = await fetch(pdfUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to generate PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Cash_Request_${request.displayId || requestId.slice(-6).toUpperCase()}_${Date.now()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      message.success({ content: 'PDF downloaded successfully!', key: 'pdf-download' });
    } catch (error) {
      console.error('PDF download error:', error);
      message.error({ content: error.message || 'Failed to download PDF', key: 'pdf-download' });
    } finally {
      setDownloadingPDF(false);
    }
  };

  // ✅ FLEXIBLE: Get true status (same as list component)
  const getTrueStatus = useCallback((reqData) => {
    if (!reqData || !reqData.approvalChain) return reqData.status;

    const approvalChain = reqData.approvalChain;
    
    // If backend status is pending_finance, trust it
    if (reqData.status === 'pending_finance') {
      return 'pending_finance';
    }
    
    // ✅ Check if Finance step is pending (by role, not level)
    const financeStep = approvalChain.find(step => 
      step.approver?.role === 'Finance Officer' ||
      step.approver?.email?.toLowerCase() === 'ranibellmambo@gratoengineering.com'
    );
    
    // If Finance step exists and is pending
    if (financeStep && financeStep.status === 'pending') {
      const previousSteps = approvalChain.filter(s => s.level < financeStep.level);
      const allPreviousApproved = previousSteps.every(s => s.status === 'approved');
      
      if (allPreviousApproved) {
        console.log(`✅ FORM OVERRIDE: Request ${reqData._id.slice(-6)} - Finance step is pending`);
        return 'pending_finance';
      }
    }
    
    // Find Head of Business step
    const hobStep = approvalChain.find(step => 
      step.approver?.role === 'Head of Business' ||
      step.approver?.email?.toLowerCase() === 'kelvin.eyong@gratoglobal.com'
    );

    // Check if Finance approved but HOB pending
    if (hobStep && hobStep.status === 'pending' && financeStep && financeStep.status === 'approved') {
      console.log(`✅ FORM OVERRIDE: Request ${reqData._id.slice(-6)} - Finance approved, awaiting HOB`);
      return 'pending_head_of_business';
    }

    // If all approved
    const allApproved = approvalChain.every(step => step.status === 'approved');
    if (allApproved && reqData.status === 'approved') {
      return 'approved';
    }

    return reqData.status;
  }, []);

  useEffect(() => {
    fetchRequestDetails();
    fetchBudgetCodes();
  }, [requestId]);

  const fetchRequestDetails = async () => {
    try {
      setLoading(true);
      const response = await cashRequestAPI.getRequestById(requestId);
      
      if (response.success) {
        const reqData = response.data;
        setRequest(reqData);
        
        // ✅ Get TRUE status using flexible logic
        const trueStatus = getTrueStatus(reqData);
        
        console.log('✅ Finance Form - Request Details:', {
          requestId: reqData._id.slice(-6),
          backendStatus: reqData.status,
          trueStatus: trueStatus,
          approvalChain: reqData.approvalChain?.map(s => ({
            level: s.level,
            role: s.approver?.role,
            status: s.status
          }))
        });
        
        // ✅ FLEXIBLE: Find Finance step by role/email, not level
        const financeStep = reqData.approvalChain?.find(step =>
          (step.approver?.role === 'Finance Officer' ||
           step.approver?.email?.toLowerCase() === 'ranibellmambo@gratoengineering.com')
        );
        
        console.log('Finance step found:', financeStep);
        
        // Finance can APPROVE if Finance step is pending and previous steps approved
        let canFinanceApprove = false;
        if (financeStep && financeStep.status === 'pending') {
          const previousSteps = reqData.approvalChain.filter(s => s.level < financeStep.level);
          const allPreviousApproved = previousSteps.every(s => s.status === 'approved');
          canFinanceApprove = allPreviousApproved;
        }
        
        setCanApprove(canFinanceApprove);
        
        // Finance can DISBURSE if TRUE status is 'approved' or 'partially_disbursed'
        const canFinanceDisburse = ['approved', 'partially_disbursed'].includes(trueStatus);
        setCanDisburse(canFinanceDisburse);
        
        // Request is awaiting HOB
        const awaitingCEO = trueStatus === 'pending_head_of_business';
        setIsAwaitingCEO(awaitingCEO);
        
        console.log('✅ Finance Actions:', {
          canApprove: canFinanceApprove,
          canDisburse: canFinanceDisburse,
          awaitingCEO
        });
        
        // Calculate remaining balance
        const amountToApprove = reqData.amountRequested;
        const alreadyDisbursed = reqData.totalDisbursed || 0;
        const remaining = amountToApprove - alreadyDisbursed;
        
        // Set initial form values based on action type
        if (canFinanceApprove) {
          form.setFieldsValue({
            decision: 'approved',
            amountApproved: amountToApprove
          });
        } else if (canFinanceDisburse) {
          setEnableDisbursement(true);
          setDisbursementAmount(Math.max(0, remaining));
        }
      } else {
        message.error('Failed to load request details');
        navigate('/finance/cash-approvals');
      }
    } catch (error) {
      console.error('Error fetching request:', error);
      message.error('Failed to load request details');
      navigate('/finance/cash-approvals');
    } finally {
      setLoading(false);
    }
  };

  const fetchBudgetCodes = async () => {
    try {
      const response = await budgetCodeAPI.getBudgetCodes();
      
      if (response.success) {
        const activeCodes = response.data.filter(
          code => code.status === 'active' && code.remaining > 0
        );
        setBudgetCodes(activeCodes);
      }
    } catch (error) {
      console.error('Error fetching budget codes:', error);
      message.warning('Could not load budget codes');
    }
  };

  const handleBudgetCodeChange = (budgetCodeId) => {
    const budgetCode = budgetCodes.find(bc => bc._id === budgetCodeId);
    setSelectedBudgetCode(budgetCode);
  };

  const handleSubmit = async (values) => {
    try {
      setSubmitting(true);

      const isReimbursement = request.requestMode === 'reimbursement';

      // Disbursement mode
      if (canDisburse) {
        console.log('💰 Processing disbursement (HOB already approved)');
        
        if (!disbursementAmount || disbursementAmount <= 0) {
          message.error('Please enter a valid disbursement amount');
          return;
        }
        
        const response = await cashRequestAPI.processDisbursement(requestId, {
          amount: disbursementAmount,
          notes: values.disbursementNotes || 'Disbursement by Finance'
        });

        if (response.success) {
          message.success({
            content: `XAF ${disbursementAmount.toLocaleString()} disbursed successfully`,
            duration: 5
          });
          
          setTimeout(() => {
            navigate('/finance/cash-approvals');
          }, 1500);
        } else {
          throw new Error(response.message || 'Failed to process disbursement');
        }
        
        return;
      }

      // Approval mode
      if (canApprove) {
        const decision = values.decision;
        
        if (decision === 'approved' && !values.budgetCodeId) {
          message.error('Please select a budget code for approval');
          return;
        }

        const payload = {
          decision: decision === 'approved' ? 'approved' : 'rejected',
          comments: values.comments || '',
          amountApproved: decision === 'approved' ? parseFloat(values.amountApproved) : null,
          budgetCodeId: decision === 'approved' ? values.budgetCodeId : null
        };

        console.log('✅ Submitting finance approval:', payload);

        const response = await cashRequestAPI.processFinanceDecision(requestId, payload);

        if (response.success) {
          message.success({
            content: `${isReimbursement ? 'Reimbursement' : 'Cash request'} ${decision === 'approved' ? 'approved and forwarded to Head of Business' : 'rejected'}`,
            duration: 5
          });
          
          setTimeout(() => {
            navigate('/finance/cash-approvals');
          }, 1500);
        } else {
          throw new Error(response.message || 'Failed to process decision');
        }
        
        return;
      }

      message.error('Invalid action for current request status');
      
    } catch (error) {
      console.error('Submit error:', error);
      message.error(error.response?.data?.message || 'Failed to process request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadReceipt = async (attachment) => {
    try {
      const blob = await cashRequestAPI.downloadAttachment(attachment.publicId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = attachment.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      message.success('Receipt downloaded successfully');
    } catch (error) {
      console.error('Download error:', error);
      message.error('Failed to download receipt');
    }
  };

  if (loading) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <Spin size="large" />
          <div style={{ marginTop: '16px' }}>Loading request details...</div>
        </div>
      </Card>
    );
  }

  if (!request) {
    return (
      <Card>
        <Alert
          message="Request Not Found"
          description="The requested cash request could not be found."
          type="error"
          showIcon
        />
      </Card>
    );
  }

  const isReimbursement = request.requestMode === 'reimbursement';
  const hasReceiptDocuments = request.reimbursementDetails?.receiptDocuments?.length > 0;
  const hasItemizedBreakdown = 
    (isReimbursement && request.reimbursementDetails?.itemizedBreakdown?.length > 0) ||
    (!isReimbursement && request.itemizedBreakdown?.length > 0);

  const itemizedData = isReimbursement 
    ? request.reimbursementDetails?.itemizedBreakdown 
    : request.itemizedBreakdown;

  const itemizedColumns = [
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      width: '40%'
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      width: '30%',
      render: (category) => category ? (
        <Tag color="blue">{category.replace(/-/g, ' ').toUpperCase()}</Tag>
      ) : '-'
    },
    {
      title: 'Amount (XAF)',
      dataIndex: 'amount',
      key: 'amount',
      width: '30%',
      render: (amount) => (
        <Text strong style={{ color: '#1890ff' }}>
          {parseFloat(amount).toLocaleString()}
        </Text>
      )
    }
  ];


  // --- Reimbursement fields ---
  const advanceReceived = request.advanceReceived || 0;
  const amountSpent = request.amountSpent || 0;
  const reimbursementDue = amountSpent - advanceReceived;

  const amountRequested = request.amountRequested || 0;
  const totalDisbursed = request.totalDisbursed || 0;
  const remainingBalance = request.remainingBalance || (amountRequested - totalDisbursed);
  const disbursementProgress = amountRequested > 0 
    ? Math.round((totalDisbursed / amountRequested) * 100) 
    : 0;
  const hasExistingDisbursements = (request.disbursements?.length || 0) > 0;

  const approvedAmount = parseFloat(form.getFieldValue('amountApproved') || amountRequested);
  const remainingAfterDisbursement = Math.max(0, remainingBalance - disbursementAmount);
  const newDisbursementProgress = amountRequested > 0 
    ? Math.round(((totalDisbursed + disbursementAmount) / amountRequested) * 100) 
    : 0;

  const trueStatus = getTrueStatus(request);

  return (
    <>
      <style>
        {`
          /* Optimize scrolling performance with hardware acceleration */
          .ant-card-body,
          .ant-modal-body,
          .ant-table-body,
          .ant-form {
            -webkit-overflow-scrolling: touch;
            transform: translateZ(0);
            will-change: transform;
          }
          
          /* Remove smooth scroll behavior for better performance */
          * {
            scroll-behavior: auto !important;
          }
          
          /* Optimize rendering with CSS containment - exclude interactive elements */
          .ant-table-tbody > tr {
            contain: layout style;
          }
          
          /* Custom scrollbar styling */
          ::-webkit-scrollbar {
            width: 8px;
            height: 8px;
          }
          
          ::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 4px;
          }
          
          ::-webkit-scrollbar-thumb {
            background: #888;
            border-radius: 4px;
          }
          
          ::-webkit-scrollbar-thumb:hover {
            background: #555;
          }
          
          /* Optimize table scrolling */
          .ant-table-body {
            overflow-y: auto !important;
            transform: translateZ(0);
            -webkit-overflow-scrolling: touch;
          }
          
          /* Ensure dropdowns render correctly above all content */
          .ant-select-dropdown,
          .ant-picker-dropdown,
          .ant-dropdown,
          .ant-popover,
          .ant-tooltip {
            transform: none !important;
            will-change: auto !important;
            contain: none !important;
            z-index: 9999 !important;
          }
          
          /* Ensure modal content allows dropdowns to show */
          .ant-modal-body,
          .ant-modal-content {
            overflow: visible !important;
          }
          
          /* Ensure form items don't hide dropdowns */
          .ant-form-item {
            position: relative;
            z-index: auto;
          }
          
          /* Reduce animations for better scroll performance */
          .ant-input,
          .ant-select,
          .ant-input-number,
          .ant-picker {
            transition: border-color 0.2s ease, box-shadow 0.2s ease;
          }
          
          /* Fast modal transitions */
          .ant-modal {
            transition: opacity 0.2s ease;
          }
        `}
      </style>
      
      <div style={{ padding: '24px' }}>
        <Card>
          {/* <Title level={3}>
            <BankOutlined /> {isReimbursement ? 'Reimbursement' : 'Cash Advance'} 
            {canApprove && ' - Finance Approval'}
            {canDisburse && ' - Disbursement'}
            {isAwaitingCEO && ' - Awaiting HOB'}
          </Title> */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <Title level={3} style={{ margin: 0 }}>
              <BankOutlined /> {isReimbursement ? 'Reimbursement' : 'Cash Advance'} 
              {canApprove && ' - Finance Approval'}
              {canDisburse && ' - Disbursement'}
              {isAwaitingCEO && ' - Awaiting HOB'}
            </Title>
            
            {/* PDF Download Button - Visible for disbursed/completed requests */}
            {['partially_disbursed', 'fully_disbursed', 'completed', 
              'justification_pending_supervisor', 'justification_pending_departmental_head',
              'justification_pending_hr', 'justification_pending_finance'].includes(trueStatus) && (
              <Tooltip title="Download official PDF with approval chain and disbursement details">
                <Button
                  type="primary"
                  danger
                  icon={<DownloadOutlined />}
                  onClick={handleDownloadPDF}
                  loading={downloadingPDF}
                  size="large"
                >
                  {downloadingPDF ? 'Generating PDF...' : 'Download PDF'}
                </Button>
              </Tooltip>
            )}
          </div>

          {/* Status-based alerts */}
          {isAwaitingCEO && (
            <Alert
              message="Awaiting Head of Business Approval"
              description="You have approved this request and allocated budget. It is now awaiting final approval from the Head of Business before disbursement can proceed."
              type="info"
              icon={<HourglassOutlined />}
              showIcon
              closable
              style={{ marginBottom: '24px' }}
            />
          )}

          {canDisburse && (
          <Alert
            message="Ready for Disbursement"
            description="This request has been fully approved (including by Head of Business). You can now disburse funds to the employee."
            type="success"
            icon={<CheckCircleOutlined />}
            showIcon
            closable
            style={{ marginBottom: '24px' }}
          />
        )}

        {/* Request Type Badge */}
        {isReimbursement && (
          <Alert
            message="Reimbursement Request"
            description="Employee has already spent personal funds and is requesting reimbursement."
            type="info"
            icon={<DollarOutlined />}
            showIcon
            style={{ marginBottom: '24px' }}
          />
        )}

        {/* Disbursement Status Card - keep same as before */}
        {hasExistingDisbursements && (
          <Card 
            size="small" 
            title={
              <Space>
                <SendOutlined />
                <Text strong>Disbursement Status</Text>
                {remainingBalance > 0 && (
                  <Tag color="orange">Partial Payment</Tag>
                )}
                {remainingBalance === 0 && (
                  <Tag color="success">Fully Paid</Tag>
                )}
              </Space>
            }
            style={{ marginBottom: '24px', backgroundColor: '#f9f9f9' }}
          >
            {/* Keep existing disbursement status UI */}
            <Row gutter={16} style={{ marginBottom: '16px' }}>
              <Col span={6}>
                <Statistic
                  title="Amount Requested"
                  value={amountRequested}
                  precision={0}
                  valueStyle={{ fontSize: '16px' }}
                  prefix="XAF"
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="Already Disbursed"
                  value={totalDisbursed}
                  precision={0}
                  valueStyle={{ color: '#1890ff', fontSize: '16px' }}
                  prefix="XAF"
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="Remaining Balance"
                  value={remainingBalance}
                  precision={0}
                  valueStyle={{ color: remainingBalance > 0 ? '#cf1322' : '#52c41a', fontSize: '16px' }}
                  prefix="XAF"
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="Progress"
                  value={disbursementProgress}
                  precision={0}
                  valueStyle={{ fontSize: '16px' }}
                  suffix="%"
                />
              </Col>
            </Row>

            <Progress 
              percent={disbursementProgress} 
              status={disbursementProgress === 100 ? 'success' : 'active'}
              strokeColor={disbursementProgress === 100 ? '#52c41a' : '#1890ff'}
            />

            {/* Disbursement History */}
            {request.disbursements && request.disbursements.length > 0 && (
              <>
                <Divider style={{ margin: '16px 0' }} />
                <Text strong style={{ display: 'block', marginBottom: '12px' }}>
                  Payment History ({request.disbursements.length})
                </Text>
                <Timeline mode="left" style={{ marginTop: '12px' }}>
                  {request.disbursements.map((disbursement, index) => (
                    <Timeline.Item
                      key={index}
                      color={index === request.disbursements.length - 1 ? 'green' : 'blue'}
                      dot={<DollarOutlined />}
                    >
                      <div style={{ fontSize: '12px' }}>
                        <Text strong>Payment #{disbursement.disbursementNumber}</Text>
                        <br />
                        <Text type="secondary">
                          <ClockCircleOutlined /> {new Date(disbursement.date).toLocaleString('en-GB')}
                        </Text>
                        <br />
                        <Text strong style={{ color: '#1890ff' }}>
                          XAF {disbursement.amount?.toLocaleString()}
                        </Text>
                        <br />
                        {disbursement.acknowledged ? (
                          <>
                            <Tag color="green">Acknowledged</Tag>
                            {disbursement.acknowledgmentDate && (
                              <Text type="secondary" style={{ fontSize: '11px' }}>
                                <ClockCircleOutlined /> {new Date(disbursement.acknowledgmentDate).toLocaleString('en-GB')}
                              </Text>
                            )}
                            {disbursement.acknowledgmentNotes && (
                              <>
                                <br />
                                <Text italic style={{ fontSize: '11px' }}>
                                  "{disbursement.acknowledgmentNotes}"
                                </Text>
                              </>
                            )}
                          </>
                        ) : (
                          <Tag color="orange">Not Acknowledged</Tag>
                        )}
                        {disbursement.notes && (
                          <>
                            <br />
                            <Text italic style={{ fontSize: '11px' }}>"{disbursement.notes}"</Text>
                          </>
                        )}
                      </div>
                    </Timeline.Item>
                  ))}
                </Timeline>
                <Divider style={{ margin: '16px 0' }} />
                  <Button
                    type="dashed"
                    block
                    icon={<DownloadOutlined />}
                    onClick={handleDownloadPDF}
                    loading={downloadingPDF}
                  >
                    {downloadingPDF ? 'Generating PDF...' : 'Download Complete Report (PDF)'}
                  </Button>
              </>
            )}

            {remainingBalance > 0 && canDisburse && (
              <Alert
                message="Action Required"
                description={`This request still has XAF ${remainingBalance.toLocaleString()} remaining to be disbursed.`}
                type="warning"
                showIcon
                icon={<WarningOutlined />}
                style={{ marginTop: '12px' }}
              />
            )}
          </Card>
        )}

        {/* ✅ NEW: Budget Reconciliation Card - Track impact on allocated budget */}
        {request.justification && (() => {
          const disbursedAmount = request.disbursementDetails?.amount || request.amountApproved || 0;
          return (
          <Card 
            size="small" 
            title={
              <Space>
                <BankOutlined />
                <Text strong>Budget Reconciliation & Reimbursement Status</Text>
              </Space>
            }
            style={{ marginBottom: '24px', backgroundColor: request.justification.balanceReturned < 0 ? '#fff7e6' : '#f6f9ff' }}
          >
            <Row gutter={16} style={{ marginBottom: '16px' }}>
              <Col span={6}>
                <Card size="small" style={{ textAlign: 'center' }}>
                  <Text type="secondary">Allocated Budget</Text>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1890ff' }}>
                    XAF {(disbursedAmount).toLocaleString()}
                  </div>
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small" style={{ textAlign: 'center' }}>
                  <Text type="secondary">Amount Spent</Text>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#ff4d4f' }}>
                    XAF {(request.justification?.amountSpent || 0).toLocaleString()}
                  </div>
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small" style={{ textAlign: 'center', backgroundColor: request.justification.balanceReturned < 0 ? '#fff7e6' : '#f6f9ff' }}>
                  <Text type="secondary">
                    {request.justification.balanceReturned < 0 ? '💰 Reimbursement Due' : 'Budget Return'}
                  </Text>
                  <div style={{ 
                    fontSize: '18px', 
                    fontWeight: 'bold', 
                    color: request.justification.balanceReturned < 0 ? '#ff7a45' : '#52c41a' 
                  }}>
                    XAF {Math.abs(request.justification.balanceReturned).toLocaleString()}
                  </div>
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small" style={{ textAlign: 'center' }}>
                  <Text type="secondary">Budget Variance</Text>
                  <div style={{ 
                    fontSize: '18px', 
                    fontWeight: 'bold', 
                    color: Math.abs(request.justification.balanceReturned) > (disbursedAmount) * 0.1 ? '#ff4d4f' : '#52c41a'
                  }}>
                    {request.justification.balanceReturned < 0 ? '+' : '-'} XAF {Math.abs(request.justification.balanceReturned).toLocaleString()}
                  </div>
                </Card>
              </Col>
            </Row>

            {/* Budget Impact Alert */}
            {request.justification.balanceReturned < 0 && (
              <Alert
                message="⚠️ Budget Overspend - Reimbursement Required"
                description={
                  <div>
                    <p style={{ marginBottom: '8px' }}>
                      Employee spent <strong>XAF {Math.abs(request.justification.balanceReturned).toLocaleString()}</strong> more than allocated, using their own funds.
                    </p>
                    <ul style={{ marginBottom: 0, paddingLeft: '20px' }}>
                      <li>Original Budget Allocation: <strong>XAF {(disbursedAmount).toLocaleString()}</strong></li>
                      <li>Total Actual Spending: <strong>XAF {(request.justification.amountSpent || 0).toLocaleString()}</strong></li>
                      <li><strong style={{ color: '#ff7a45' }}>Budget Overspend: XAF {Math.abs(request.justification.balanceReturned).toLocaleString()}</strong></li>
                      <li style={{ marginTop: '8px' }}>
                        <strong style={{ color: '#ff7a45' }}>⚠️ Action Required:</strong>
                        <ul style={{ marginTop: '4px' }}>
                          <li>Approve additional budget allocation</li>
                          <li>Process reimbursement to employee</li>
                          <li>Update cost center budget records</li>
                        </ul>
                      </li>
                    </ul>
                  </div>
                }
                type="warning"
                showIcon
                style={{ marginTop: '16px' }}
              />
            )}

            {request.justification.balanceReturned > 0 && (
              <Alert
                message="✅ Budget Under Spent"
                description={
                  <div>
                    <p style={{ marginBottom: '8px' }}>
                      Employee spent less than allocated and will return <strong>XAF {request.justification.balanceReturned.toLocaleString()}</strong> to the company.
                    </p>
                    <ul style={{ marginBottom: 0, paddingLeft: '20px' }}>
                      <li>Allocated: <strong>XAF {(disbursedAmount).toLocaleString()}</strong></li>
                      <li>Spent: <strong>XAF {(request.justification.amountSpent || 0).toLocaleString()}</strong></li>
                      <li><strong style={{ color: '#52c41a' }}>Amount to Return: XAF {request.justification.balanceReturned.toLocaleString()}</strong></li>
                    </ul>
                  </div>
                }
                type="success"
                showIcon
                style={{ marginTop: '16px' }}
              />
            )}

            {request.justification.balanceReturned === 0 && (
              <Alert
                message="✅ Exact Budget Match"
                description={`Employee spent exactly the allocated amount. Budget is balanced with no return or reimbursement required.`}
                type="success"
                showIcon
                style={{ marginTop: '16px' }}
              />
            )}
          </Card>
        );
        })()}

        {/* Employee & Request Details */}
        <Descriptions bordered column={2} size="small" style={{ marginBottom: '24px' }}>
          <Descriptions.Item label="Request ID">
            <Tag color="blue">REQ-{requestId.slice(-6).toUpperCase()}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Request Mode">
            <Tag color={isReimbursement ? 'orange' : 'green'}>
              {isReimbursement ? 'Reimbursement' : 'Cash Advance'}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Employee">
            <Text strong>{request.employee?.fullName}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="Department">
            <Tag color="blue">{request.employee?.department}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Type">
            {request.requestType?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </Descriptions.Item>
          <Descriptions.Item label="Urgency">
            <Tag color={request.urgency === 'high' ? 'red' : request.urgency === 'medium' ? 'orange' : 'green'}>
              {request.urgency?.toUpperCase()}
            </Tag>
          </Descriptions.Item>
           <Descriptions.Item label="Amount Requested">
             {isReimbursement ? (
               <div>
                 <Text strong>Advance Received: </Text>
                 <Text>XAF {advanceReceived.toLocaleString()}</Text>
                 <br />
                 <Text strong>Amount Spent: </Text>
                 <Text>XAF {amountSpent.toLocaleString()}</Text>
                 <br />
                 <Text strong>Reimbursement Due: </Text>
                 <Text type={reimbursementDue > 0 ? 'danger' : 'success'}>
                   XAF {reimbursementDue.toLocaleString()}
                 </Text>
               </div>
             ) : (
               <Text strong style={{ color: '#1890ff', fontSize: '16px' }}>
                 XAF {amountRequested.toLocaleString()}
               </Text>
             )}
           </Descriptions.Item>
          <Descriptions.Item label="Submitted Date">
            {new Date(request.createdAt).toLocaleDateString('en-GB')}
          </Descriptions.Item>
          <Descriptions.Item label="Current Status">
            <Space direction="vertical" size="small">
              <Tag color={
                trueStatus === 'pending_finance' ? 'orange' :
                trueStatus === 'pending_head_of_business' ? 'purple' :
                trueStatus === 'approved' ? 'green' :
                trueStatus === 'partially_disbursed' ? 'blue' :
                'default'
              }>
                {trueStatus?.replace(/_/g, ' ').toUpperCase()}
              </Tag>
              {request.status !== trueStatus && (
                <Text type="secondary" style={{ fontSize: '10px' }}>
                  (Backend: {request.status.replace(/_/g, ' ')})
                </Text>
              )}
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="Purpose" span={2}>
            <div 
              dangerouslySetInnerHTML={{ 
                __html: DOMPurify.sanitize(request.purpose || '') 
              }}
              style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
            />
          </Descriptions.Item>
        </Descriptions>

        {/* Itemized Breakdown - keep same */}
        {hasItemizedBreakdown && (
          <Card 
            size="small" 
            title={
              <Space>
                <FileTextOutlined />
                <Text strong>Itemized Breakdown</Text>
                <Badge count={itemizedData.length} style={{ backgroundColor: '#52c41a' }} />
              </Space>
            }
            style={{ marginBottom: '24px' }}
          >
            <Table
              dataSource={itemizedData}
              columns={itemizedColumns}
              pagination={false}
              size="small"
              rowKey={(record, index) => index}
              summary={() => (
                <Table.Summary fixed>
                  <Table.Summary.Row>
                    <Table.Summary.Cell index={0} colSpan={2}>
                      <Text strong>Total</Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={1}>
                      <Text strong style={{ color: '#1890ff', fontSize: '16px' }}>
                        XAF {itemizedData.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0).toLocaleString()}
                      </Text>
                    </Table.Summary.Cell>
                  </Table.Summary.Row>
                </Table.Summary>
              )}
            />
          </Card>
        )}

        {/* Receipt Documents - keep same */}
        {isReimbursement && hasReceiptDocuments && (
          <Card
            size="small"
            title={
              <Space>
                <FileTextOutlined />
                <Text strong>Receipt Documents</Text>
                <Badge count={request.reimbursementDetails.receiptDocuments.length} style={{ backgroundColor: '#52c41a' }} />
              </Space>
            }
            style={{ marginBottom: '24px' }}
          >
            <Space wrap>
              {request.reimbursementDetails.receiptDocuments.map((doc, index) => (
                <Space key={index}>
                  <Button
                    icon={<EyeOutlined />}
                    size="small"
                    onClick={() => window.open(doc.url, '_blank')}
                  >
                    View
                  </Button>
                  <Button
                    icon={<DownloadOutlined />}
                    size="small"
                    onClick={() => handleDownloadReceipt(doc)}
                  >
                    {doc.name}
                  </Button>
                </Space>
              ))}
            </Space>
          </Card>
        )}

        {/* Approval Chain Progress - keep same */}
        {request.approvalChain && request.approvalChain.length > 0 && (
          <Card size="small" title="Approval Chain Progress" style={{ marginBottom: '24px' }}>
            <Row gutter={[16, 16]}>
              {request.approvalChain.map((step, index) => (
                <Col span={24} key={index}>
                  <div style={{ 
                    padding: '12px', 
                    border: `1px solid ${step.status === 'approved' ? '#52c41a' : step.status === 'rejected' ? '#ff4d4f' : '#d9d9d9'}`,
                    borderRadius: '6px',
                    backgroundColor: step.status === 'pending' ? '#fff7e6' : '#fafafa'
                  }}>
                    <Row align="middle">
                      <Col span={16}>
                        <Space>
                          {step.status === 'approved' ? (
                            <CheckCircleOutlined style={{ color: '#52c41a', fontSize: '20px' }} />
                          ) : step.status === 'rejected' ? (
                            <CloseCircleOutlined style={{ color: '#ff4d4f', fontSize: '20px' }} />
                          ) : (
                            <WarningOutlined style={{ color: '#faad14', fontSize: '20px' }} />
                          )}
                          <div>
                            <Text strong>Level {step.level}: {step.approver?.name}</Text>
                            <br />
                            <Text type="secondary" style={{ fontSize: '12px' }}>
                              {step.approver?.role} - {step.approver?.email}
                            </Text>
                          </div>
                        </Space>
                      </Col>
                      <Col span={8} style={{ textAlign: 'right' }}>
                        <Tag color={
                          step.status === 'approved' ? 'green' : 
                          step.status === 'rejected' ? 'red' : 
                          'orange'
                        }>
                          {step.status.toUpperCase()}
                        </Tag>
                        {step.actionDate && (
                          <div style={{ fontSize: '11px', marginTop: '4px' }}>
                            {new Date(step.actionDate).toLocaleDateString('en-GB')}
                          </div>
                        )}
                      </Col>
                    </Row>
                    {step.comments && (
                      <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #f0f0f0' }}>
                        <Text italic style={{ fontSize: '12px' }}>"{step.comments}"</Text>
                      </div>
                    )}
                  </div>
                </Col>
              ))}
            </Row>
          </Card>
        )}

        <Divider />

        {/* CONDITIONAL FORM RENDERING - Same as before but with updated logic */}
        
        {/* MODE 1: Awaiting HOB */}
        {isAwaitingCEO && (
          <Alert
            message="No Action Required at This Time"
            description={
              <div>
                <p>You have successfully approved this request and allocated budget code.</p>
                <p>The request is now awaiting final approval from <Text strong>Head of Business (Mr. E.T Kelvin)</Text>.</p>
                <p>Once the Head of Business approves, you will be able to disburse funds.</p>
              </div>
            }
            type="info"
            showIcon
            icon={<InfoCircleOutlined />}
            action={
              <Button size="small" onClick={() => navigate('/finance/cash-approvals')}>
                Back to Approvals
              </Button>
            }
          />
        )}

        {/* MODE 2: Finance Approval Form */}
        {canApprove && (
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            initialValues={{
              decision: 'approved',
              amountApproved: amountRequested
            }}
          >
            <Alert
              message="Finance Approval Required"
              description="Review the request details above and make your approval decision. If approved, allocate a budget code. The request will then go to Head of Business for final approval."
              type="warning"
              showIcon
              icon={<WarningOutlined />}
              style={{ marginBottom: '16px' }}
            />

            <Form.Item
              name="decision"
              label="Your Decision"
              rules={[{ required: true, message: 'Please make a decision' }]}
            >
              <Radio.Group>
                <Radio.Button value="approved" style={{ color: '#52c41a' }}>
                  <CheckCircleOutlined /> Approve & Forward to HOB
                </Radio.Button>
                <Radio.Button value="rejected" style={{ color: '#f5222d' }}>
                  <CloseCircleOutlined /> Reject {isReimbursement ? 'Reimbursement' : 'Request'}
                </Radio.Button>
              </Radio.Group>
            </Form.Item>

            <Form.Item noStyle shouldUpdate={(prev,curr) => prev.decision !== curr.decision}>
              {({ getFieldValue }) =>
                getFieldValue('decision') === 'approved' ? (
                  <>
                    <Form.Item
                      name="budgetCodeId"
                      label={
                        <Space>
                          <span>Budget Code</span>
                          <Tag color="red">Required</Tag>
                        </Space>
                      }
                      rules={[{ required: true, message: 'Budget code is required for approval' }]}
                    >
                      <Select
                        placeholder="Select budget code"
                        showSearch
                        filterOption={(input, option) =>
                          option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                        }
                        onChange={handleBudgetCodeChange}
                      >
                        {budgetCodes.map(bc => (
                          <Option key={bc._id} value={bc._id}>
                            {bc.code} - {bc.name} (Available: XAF {bc.remaining.toLocaleString()})
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>

                    {selectedBudgetCode && (
                      <Alert
                        message="Budget Code Information"
                        description={
                          <div>
                            <Text>Budget: XAF {selectedBudgetCode.budget.toLocaleString()}</Text>
                            <br />
                            <Text>Used: XAF {selectedBudgetCode.used.toLocaleString()}</Text>
                            <br />
                            <Text strong>Available: XAF {selectedBudgetCode.remaining.toLocaleString()}</Text>
                          </div>
                        }
                        type="info"
                        showIcon
                        style={{ marginBottom: '16px' }}
                      />
                    )}

                    <Form.Item
                      name="amountApproved"
                      label="Amount to Approve (XAF)"
                      rules={[{ required: true, message: 'Please enter amount to approve' }]}
                    >
                      <InputNumber
                        style={{ width: '100%' }}
                        min={0}
                        max={amountRequested}
                        step={1000}
                        formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                        parser={(value) => value.replace(/,/g, '')}
                      />
                    </Form.Item>

                    <Alert
                      message="Next Step: HOB Approval"
                      description="After you approve, this request will be sent to the Head of Business for final approval. You will be able to disburse funds once the HOB approves."
                      type="info"
                      showIcon
                      icon={<InfoCircleOutlined />}
                      style={{ marginBottom: '16px' }}
                    />
                  </>
                ) : null
              }
            </Form.Item>

            <Form.Item
              name="comments"
              label="Comments"
              rules={[{ required: true, message: 'Please provide comments for your decision' }]}
            >
              <TextArea
                rows={4}
                placeholder="Explain your decision (required for audit trail)..."
                showCount
                maxLength={500}
              />
            </Form.Item>

            <Form.Item>
              <Space>
                <Button onClick={() => navigate('/finance/cash-approvals')}>
                  Cancel
                </Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={submitting}
                  icon={form.getFieldValue('decision') === 'approved' ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
                >
                  {submitting ? 'Processing...' : `${form.getFieldValue('decision') === 'approved' ? 'Approve & Forward to HOB' : 'Reject'}`}
                </Button>
              </Space>
            </Form.Item>
          </Form>
        )}

        {/* MODE 3: Disbursement Form */}
        {canDisburse && (
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
          >
            <Alert
              message="Disbursement Ready"
              description="This request has been fully approved (including by Head of Business). You can now disburse funds to the employee."
              type="success"
              showIcon
              icon={<CheckCircleOutlined />}
              style={{ marginBottom: '24px' }}
            />

            <Card 
              size="small" 
              title={
                <Space>
                  <SendOutlined />
                  <Text strong>Disbursement Details</Text>
                  {hasExistingDisbursements && (
                    <Tag color="blue">Additional Payment</Tag>
                  )}
                </Space>
              }
              style={{ marginBottom: '24px', backgroundColor: '#f9f9f9' }}
            >
              <Space direction="vertical" style={{ width: '100%' }} size="large">
                {hasExistingDisbursements && (
                  <Alert
                    message={`XAF ${totalDisbursed.toLocaleString()} already disbursed. Remaining: XAF ${remainingBalance.toLocaleString()}`}
                    type="info"
                    showIcon
                    icon={<InfoCircleOutlined />}
                  />
                )}

                {!hasExistingDisbursements && (
                  <Alert
                    message="First Disbursement"
                    description="This is the first payment for this request. You can disburse the full amount or make a partial payment."
                    type="info"
                    showIcon
                  />
                )}

                <Form.Item 
                  label={
                    <Space>
                      <span>Disbursement Amount (XAF)</span>
                      <Tag color="red">Required</Tag>
                    </Space>
                  }
                  style={{ marginBottom: 0 }}
                >
                  <InputNumber
                    style={{ width: '100%' }}
                    min={0}
                    max={remainingBalance}
                    step={1000}
                    value={disbursementAmount}
                    onChange={setDisbursementAmount}
                    formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={(value) => value.replace(/,/g, '')}
                  />
                  <Text type="secondary" style={{ fontSize: '12px', marginTop: '4px', display: 'block' }}>
                    Maximum: XAF {remainingBalance.toLocaleString()}
                  </Text>
                </Form.Item>

                <Row gutter={[16, 16]} style={{ marginTop: '16px' }}>
                  <Col span={8}>
                    <Statistic
                      title="Amount Requested"
                      value={amountRequested}
                      precision={0}
                      valueStyle={{ fontSize: '14px' }}
                      prefix="XAF"
                    />
                  </Col>
                  <Col span={8}>
                    <Statistic
                      title="Disbursing Now"
                      value={disbursementAmount}
                      precision={0}
                      valueStyle={{ color: '#1890ff', fontSize: '14px' }}
                      prefix="XAF"
                    />
                  </Col>
                  <Col span={8}>
                    <Statistic
                      title="After This Payment"
                      value={remainingAfterDisbursement}
                      precision={0}
                      valueStyle={{ 
                        color: remainingAfterDisbursement > 0 ? '#cf1322' : '#3f8600', 
                        fontSize: '14px' 
                      }}
                      prefix="XAF"
                    />
                  </Col>
                </Row>

                <Progress 
                  percent={newDisbursementProgress} 
                  status={newDisbursementProgress === 100 ? 'success' : 'active'}
                  strokeColor={newDisbursementProgress === 100 ? '#52c41a' : '#1890ff'}
                  format={(percent) => `${percent}% ${newDisbursementProgress === 100 ? '(Full Payment)' : '(Partial)'}`}
                />

                {remainingAfterDisbursement > 0 && disbursementAmount > 0 && (
                  <Alert
                    message="Partial Disbursement"
                    description={`After this payment, XAF ${remainingAfterDisbursement.toLocaleString()} will remain to be disbursed. You can make additional payments later.`}
                    type="warning"
                    showIcon
                    icon={<WarningOutlined />}
                  />
                )}

                {newDisbursementProgress === 100 && disbursementAmount > 0 && (
                  <Alert
                    message="Full Disbursement"
                    description="This payment will complete the full disbursement. The request will move to 'Fully Disbursed' status and await justification from the employee."
                    type="success"
                    showIcon
                    icon={<CheckCircleOutlined />}
                  />
                )}
              </Space>
            </Card>

            <Form.Item
              name="disbursementNotes"
              label="Disbursement Notes"
              rules={[{ required: false }]}
            >
              <TextArea
                rows={3}
                placeholder="Optional notes about this disbursement (e.g., payment method, reference number)..."
                showCount
                maxLength={300}
              />
            </Form.Item>

            <Form.Item>
              <Space>
                <Button onClick={() => navigate('/finance/cash-approvals')}>
                  Cancel
                </Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={submitting}
                  icon={<SendOutlined />}
                  disabled={!disbursementAmount || disbursementAmount <= 0 || disbursementAmount > remainingBalance}
                >
                  {submitting ? 'Processing Disbursement...' : `Disburse XAF ${disbursementAmount.toLocaleString()}`}
                </Button>
              </Space>
            </Form.Item>
          </Form>
        )}

        {/* If none of the modes apply */}
        {!canApprove && !canDisburse && !isAwaitingCEO && (
          <Alert
            message="Invalid Action"
            description="This request cannot be processed at this time. It may have already been processed or is in an invalid state."
            type="error"
            showIcon
            action={
              <Button size="small" onClick={() => navigate('/finance/cash-approvals')}>
                Back to Approvals
              </Button>
            }
          />
        )}
      </Card>
    </div>
    </>
  );
};

export default FinanceCashApprovalForm;










// import React, { useState, useEffect, useCallback } from 'react';
// import { useParams, useNavigate } from 'react-router-dom';
// import {
//   Card,
//   Form,
//   Input,
//   Button,
//   Radio,
//   Typography,
//   Space,
//   Alert,
//   Descriptions,
//   Tag,
//   Divider,
//   InputNumber,
//   Select,
//   message,
//   Spin,
//   Row,
//   Col,
//   Statistic,
//   Table,
//   Progress,
//   Badge,
//   Tooltip,
//   Timeline
// } from 'antd';
// import {
//   CheckCircleOutlined,
//   CloseCircleOutlined,
//   DollarOutlined,
//   FileTextOutlined,
//   BankOutlined,
//   SendOutlined,
//   WarningOutlined,
//   InfoCircleOutlined,
//   DownloadOutlined,
//   EyeOutlined,
//   ClockCircleOutlined,
//   ExclamationCircleOutlined,
//   UserOutlined,
//   HourglassOutlined
// } from '@ant-design/icons';
// import { cashRequestAPI } from '../../services/cashRequestAPI';
// import { budgetCodeAPI } from '../../services/budgetCodeAPI';

// const { Title, Text } = Typography;
// const { TextArea } = Input;
// const { Option } = Select;

// const FinanceCashApprovalForm = () => {
//   const { requestId } = useParams();
//   const navigate = useNavigate();
//   const [form] = Form.useForm();
  
//   const [loading, setLoading] = useState(true);
//   const [submitting, setSubmitting] = useState(false);
//   const [request, setRequest] = useState(null);
//   const [budgetCodes, setBudgetCodes] = useState([]);
//   const [selectedBudgetCode, setSelectedBudgetCode] = useState(null);
  
//   // ✅ NEW: Track what action Finance can take
//   const [canApprove, setCanApprove] = useState(false);
//   const [canDisburse, setCanDisburse] = useState(false);
//   const [isAwaitingCEO, setIsAwaitingCEO] = useState(false);
  
//   // Disbursement state
//   const [enableDisbursement, setEnableDisbursement] = useState(false);
//   const [disbursementAmount, setDisbursementAmount] = useState(0);

//   // ✅ IMPROVED: Get true status from approval chain with better logic
//   const getTrueStatus = useCallback((reqData) => {
//     if (!reqData || !reqData.approvalChain) return reqData.status;

//     const approvalChain = reqData.approvalChain;
    
//     // ✅ FIX 1: If backend status is pending_finance, trust it (Finance hasn't acted yet)
//     if (reqData.status === 'pending_finance') {
//       console.log(`✅ FORM: Request ${reqData._id?.slice(-6)} - Status is pending_finance (Finance hasn't acted)`);
//       return 'pending_finance';
//     }
    
//     // Find Head of Business step
//     const hobStep = approvalChain.find(step => 
//       step.approver?.role === 'Head of Business' ||
//       step.approver?.email?.toLowerCase() === 'kelvin.eyong@gratoglobal.com'
//     );

//     // Only override if HOB exists AND is pending AND Finance already approved
//     if (hobStep && hobStep.status === 'pending') {
//       // Check if Finance has already approved
//       const financeStep = approvalChain.find(step =>
//         step.approver?.role === 'Finance Officer' ||
//         step.approver?.email?.toLowerCase() === 'ranibellmambo@gratoengineering.com'
//       );
      
//       // Only return pending_head_of_business if Finance already approved
//       if (financeStep && financeStep.status === 'approved') {
//         console.log(`✅ FORM OVERRIDE: Request ${reqData._id?.slice(-6)} - Finance approved, awaiting HOB`);
//         return 'pending_head_of_business';
//       }
//     }

//     // If all approval steps are approved, it's truly approved
//     const allApproved = approvalChain.every(step => step.status === 'approved');
//     if (allApproved && reqData.status === 'approved') {
//       console.log(`✅ FORM: Request ${reqData._id?.slice(-6)} - All approvals complete, ready for disbursement`);
//       return 'approved'; // Truly ready for disbursement
//     }

//     // Otherwise, return backend status
//     return reqData.status;
//   }, []);

//   useEffect(() => {
//     fetchRequestDetails();
//     fetchBudgetCodes();
//   }, [requestId]);

//   const fetchRequestDetails = async () => {
//     try {
//       setLoading(true);
//       const response = await cashRequestAPI.getRequestById(requestId);
      
//       if (response.success) {
//         const reqData = response.data;
//         setRequest(reqData);
        
//         // ✅ V2 FLOW: Determine Finance's allowed actions using TRUE status
//         const trueStatus = getTrueStatus(reqData);
        
//         console.log('✅ Finance Form Action Status:', {
//           backendStatus: reqData.status,
//           trueStatus: trueStatus,
//           financeStep: reqData.approvalChain?.find(s => s.approver?.role === 'Finance Officer'),
//           hobStep: reqData.approvalChain?.find(s => s.approver?.role === 'Head of Business')
//         });
        
//         // Finance can APPROVE if TRUE status is 'pending_finance'
//         const canFinanceApprove = trueStatus === 'pending_finance';
//         setCanApprove(canFinanceApprove);
        
//         // ✅ FIX: Finance can DISBURSE only if TRUE status is 'approved' or 'partially_disbursed'
//         const canFinanceDisburse = ['approved', 'partially_disbursed'].includes(trueStatus);
//         setCanDisburse(canFinanceDisburse);
        
//         // ✅ FIX: Request is awaiting HOB approval (after Finance approved)
//         const awaitingCEO = trueStatus === 'pending_head_of_business';
//         setIsAwaitingCEO(awaitingCEO);
        
//         console.log('✅ Finance Form Actions Allowed:', {
//           canApprove: canFinanceApprove,
//           canDisburse: canFinanceDisburse,
//           awaitingCEO
//         });
        
//         // Calculate remaining balance
//         const amountToApprove = reqData.amountRequested;
//         const alreadyDisbursed = reqData.totalDisbursed || 0;
//         const remaining = amountToApprove - alreadyDisbursed;
        
//         // Set initial form values based on action type
//         if (canFinanceApprove) {
//           // Finance approval mode
//           form.setFieldsValue({
//             decision: 'approved',
//             amountApproved: amountToApprove
//           });
//         } else if (canFinanceDisburse) {
//           // Disbursement mode - no approval decision needed
//           setEnableDisbursement(true);
//           setDisbursementAmount(Math.max(0, remaining));
//         }
//       } else {
//         message.error('Failed to load request details');
//         navigate('/finance/cash-approvals');
//       }
//     } catch (error) {
//       console.error('Error fetching request:', error);
//       message.error('Failed to load request details');
//       navigate('/finance/cash-approvals');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const fetchBudgetCodes = async () => {
//     try {
//       const response = await budgetCodeAPI.getBudgetCodes();
      
//       if (response.success) {
//         const activeCodes = response.data.filter(
//           code => code.status === 'active' && code.remaining > 0
//         );
//         setBudgetCodes(activeCodes);
//       }
//     } catch (error) {
//       console.error('Error fetching budget codes:', error);
//       message.warning('Could not load budget codes');
//     }
//   };

//   const handleBudgetCodeChange = (budgetCodeId) => {
//     const budgetCode = budgetCodes.find(bc => bc._id === budgetCodeId);
//     setSelectedBudgetCode(budgetCode);
//   };

//   const handleSubmit = async (values) => {
//     try {
//       setSubmitting(true);

//       const isReimbursement = request.requestMode === 'reimbursement';

//       // ✅ V2 FIX: Handle DISBURSEMENT ONLY (when status is 'approved' or 'partially_disbursed')
//       if (canDisburse) {
//         console.log('💰 Processing disbursement (HOB already approved)');
        
//         if (!disbursementAmount || disbursementAmount <= 0) {
//           message.error('Please enter a valid disbursement amount');
//           return;
//         }
        
//         // Use processDisbursement endpoint
//         const response = await cashRequestAPI.processDisbursement(requestId, {
//           amount: disbursementAmount,
//           notes: values.disbursementNotes || 'Disbursement by Finance'
//         });

//         if (response.success) {
//           message.success({
//             content: `XAF ${disbursementAmount.toLocaleString()} disbursed successfully`,
//             duration: 5
//           });
          
//           setTimeout(() => {
//             navigate('/finance/cash-approvals');
//           }, 1500);
//         } else {
//           throw new Error(response.message || 'Failed to process disbursement');
//         }
        
//         return; // Exit early
//       }

//       // ✅ V2 APPROVAL LOGIC (for pending_finance requests)
//       if (canApprove) {
//         const decision = values.decision;
        
//         if (decision === 'approved' && !values.budgetCodeId) {
//           message.error('Please select a budget code for approval');
//           return;
//         }

//         const payload = {
//           decision: decision === 'approved' ? 'approved' : 'rejected',
//           comments: values.comments || '',
//           amountApproved: decision === 'approved' ? parseFloat(values.amountApproved) : null,
//           budgetCodeId: decision === 'approved' ? values.budgetCodeId : null
//         };

//         console.log('✅ Submitting finance approval:', payload);

//         const response = await cashRequestAPI.processFinanceDecision(requestId, payload);

//         if (response.success) {
//           message.success({
//             content: `${isReimbursement ? 'Reimbursement' : 'Cash request'} ${decision === 'approved' ? 'approved and forwarded to Head of Business' : 'rejected'}`,
//             duration: 5
//           });
          
//           setTimeout(() => {
//             navigate('/finance/cash-approvals');
//           }, 1500);
//         } else {
//           throw new Error(response.message || 'Failed to process decision');
//         }
        
//         return;
//       }

//       // If neither canApprove nor canDisburse, show error
//       message.error('Invalid action for current request status');
      
//     } catch (error) {
//       console.error('Submit error:', error);
//       message.error(error.response?.data?.message || 'Failed to process request');
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   const handleDownloadReceipt = async (attachment) => {
//     try {
//       const blob = await cashRequestAPI.downloadAttachment(attachment.publicId);
//       const url = window.URL.createObjectURL(blob);
//       const link = document.createElement('a');
//       link.href = url;
//       link.download = attachment.name;
//       document.body.appendChild(link);
//       link.click();
//       document.body.removeChild(link);
//       window.URL.revokeObjectURL(url);
//       message.success('Receipt downloaded successfully');
//     } catch (error) {
//       console.error('Download error:', error);
//       message.error('Failed to download receipt');
//     }
//   };

//   if (loading) {
//     return (
//       <Card>
//         <div style={{ textAlign: 'center', padding: '40px' }}>
//           <Spin size="large" />
//           <div style={{ marginTop: '16px' }}>Loading request details...</div>
//         </div>
//       </Card>
//     );
//   }

//   if (!request) {
//     return (
//       <Card>
//         <Alert
//           message="Request Not Found"
//           description="The requested cash request could not be found."
//           type="error"
//           showIcon
//         />
//       </Card>
//     );
//   }

//   const isReimbursement = request.requestMode === 'reimbursement';
//   const hasReceiptDocuments = request.reimbursementDetails?.receiptDocuments?.length > 0;
//   const hasItemizedBreakdown = 
//     (isReimbursement && request.reimbursementDetails?.itemizedBreakdown?.length > 0) ||
//     (!isReimbursement && request.itemizedBreakdown?.length > 0);

//   const itemizedData = isReimbursement 
//     ? request.reimbursementDetails?.itemizedBreakdown 
//     : request.itemizedBreakdown;

//   const itemizedColumns = [
//     {
//       title: 'Description',
//       dataIndex: 'description',
//       key: 'description',
//       width: '40%'
//     },
//     {
//       title: 'Category',
//       dataIndex: 'category',
//       key: 'category',
//       width: '30%',
//       render: (category) => category ? (
//         <Tag color="blue">{category.replace(/-/g, ' ').toUpperCase()}</Tag>
//       ) : '-'
//     },
//     {
//       title: 'Amount (XAF)',
//       dataIndex: 'amount',
//       key: 'amount',
//       width: '30%',
//       render: (amount) => (
//         <Text strong style={{ color: '#1890ff' }}>
//           {parseFloat(amount).toLocaleString()}
//         </Text>
//       )
//     }
//   ];

//   // ✅ CALCULATE DISBURSEMENT INFO
//   const amountRequested = request.amountRequested || 0;
//   const totalDisbursed = request.totalDisbursed || 0;
//   const remainingBalance = request.remainingBalance || (amountRequested - totalDisbursed);
//   const disbursementProgress = amountRequested > 0 
//     ? Math.round((totalDisbursed / amountRequested) * 100) 
//     : 0;
//   const hasExistingDisbursements = (request.disbursements?.length || 0) > 0;

//   const approvedAmount = parseFloat(form.getFieldValue('amountApproved') || amountRequested);
//   const remainingAfterDisbursement = Math.max(0, remainingBalance - disbursementAmount);
//   const newDisbursementProgress = amountRequested > 0 
//     ? Math.round(((totalDisbursed + disbursementAmount) / amountRequested) * 100) 
//     : 0;

//   // ✅ Get true status for display
//   const trueStatus = getTrueStatus(request);

//   return (
//     <div style={{ padding: '24px' }}>
//       <Card>
//         <Title level={3}>
//           <BankOutlined /> {isReimbursement ? 'Reimbursement' : 'Cash Advance'} 
//           {canApprove && ' - Finance Approval'}
//           {canDisburse && ' - Disbursement'}
//           {isAwaitingCEO && ' - Awaiting HOB'}
//         </Title>

//         {/* ✅ NEW: Status-based alerts */}
//         {isAwaitingCEO && (
//           <Alert
//             message="Awaiting Head of Business Approval"
//             description="You have approved this request and allocated budget. It is now awaiting final approval from the Head of Business before disbursement can proceed."
//             type="info"
//             icon={<HourglassOutlined />}
//             showIcon
//             closable
//             style={{ marginBottom: '24px' }}
//           />
//         )}

//         {canDisburse && (
//           <Alert
//             message="Ready for Disbursement"
//             description="This request has been fully approved (including by Head of Business). You can now disburse funds to the employee."
//             type="success"
//             icon={<CheckCircleOutlined />}
//             showIcon
//             closable
//             style={{ marginBottom: '24px' }}
//           />
//         )}

//         {canApprove && (
//           <Alert
//             message="Finance Approval Required"
//             description="This request is awaiting your approval at the Finance level. Review the details below and make your decision."
//             type="warning"
//             icon={<ExclamationCircleOutlined />}
//             showIcon
//             closable
//             style={{ marginBottom: '24px' }}
//           />
//         )}

//         {/* Request Type Badge */}
//         {isReimbursement && (
//           <Alert
//             message="Reimbursement Request"
//             description="Employee has already spent personal funds and is requesting reimbursement."
//             type="info"
//             icon={<DollarOutlined />}
//             showIcon
//             style={{ marginBottom: '24px' }}
//           />
//         )}

//         {/* ✅ DISBURSEMENT STATUS CARD */}
//         {hasExistingDisbursements && (
//           <Card 
//             size="small" 
//             title={
//               <Space>
//                 <SendOutlined />
//                 <Text strong>Disbursement Status</Text>
//                 {remainingBalance > 0 && (
//                   <Tag color="orange">Partial Payment</Tag>
//                 )}
//                 {remainingBalance === 0 && (
//                   <Tag color="success">Fully Paid</Tag>
//                 )}
//               </Space>
//             }
//             style={{ marginBottom: '24px', backgroundColor: '#f9f9f9' }}
//           >
//             <Row gutter={16} style={{ marginBottom: '16px' }}>
//               <Col span={6}>
//                 <Statistic
//                   title="Amount Requested"
//                   value={amountRequested}
//                   precision={0}
//                   valueStyle={{ fontSize: '16px' }}
//                   prefix="XAF"
//                 />
//               </Col>
//               <Col span={6}>
//                 <Statistic
//                   title="Already Disbursed"
//                   value={totalDisbursed}
//                   precision={0}
//                   valueStyle={{ color: '#1890ff', fontSize: '16px' }}
//                   prefix="XAF"
//                 />
//               </Col>
//               <Col span={6}>
//                 <Statistic
//                   title="Remaining Balance"
//                   value={remainingBalance}
//                   precision={0}
//                   valueStyle={{ color: remainingBalance > 0 ? '#cf1322' : '#52c41a', fontSize: '16px' }}
//                   prefix="XAF"
//                 />
//               </Col>
//               <Col span={6}>
//                 <Statistic
//                   title="Progress"
//                   value={disbursementProgress}
//                   precision={0}
//                   valueStyle={{ fontSize: '16px' }}
//                   suffix="%"
//                 />
//               </Col>
//             </Row>

//             <Progress 
//               percent={disbursementProgress} 
//               status={disbursementProgress === 100 ? 'success' : 'active'}
//               strokeColor={disbursementProgress === 100 ? '#52c41a' : '#1890ff'}
//             />

//             {/* DISBURSEMENT HISTORY */}
//             {request.disbursements && request.disbursements.length > 0 && (
//               <>
//                 <Divider style={{ margin: '16px 0' }} />
//                 <Text strong style={{ display: 'block', marginBottom: '12px' }}>
//                   Payment History ({request.disbursements.length})
//                 </Text>
//                 <Timeline mode="left" style={{ marginTop: '12px' }}>
//                   {request.disbursements.map((disbursement, index) => (
//                     <Timeline.Item
//                       key={index}
//                       color={index === request.disbursements.length - 1 ? 'green' : 'blue'}
//                       dot={<DollarOutlined />}
//                     >
//                       <div style={{ fontSize: '12px' }}>
//                         <Text strong>Payment #{disbursement.disbursementNumber}</Text>
//                         <br />
//                         <Text type="secondary">
//                           <ClockCircleOutlined /> {new Date(disbursement.date).toLocaleString('en-GB')}
//                         </Text>
//                         <br />
//                         <Text strong style={{ color: '#1890ff' }}>
//                           XAF {disbursement.amount?.toLocaleString()}
//                         </Text>
//                         {disbursement.notes && (
//                           <>
//                             <br />
//                             <Text italic style={{ fontSize: '11px' }}>"{disbursement.notes}"</Text>
//                           </>
//                         )}
//                       </div>
//                     </Timeline.Item>
//                   ))}
//                 </Timeline>
//               </>
//             )}

//             {remainingBalance > 0 && canDisburse && (
//               <Alert
//                 message="Action Required"
//                 description={`This request still has XAF ${remainingBalance.toLocaleString()} remaining to be disbursed.`}
//                 type="warning"
//                 showIcon
//                 icon={<WarningOutlined />}
//                 style={{ marginTop: '12px' }}
//               />
//             )}
//           </Card>
//         )}

//         {/* Employee & Request Details */}
//         <Descriptions bordered column={2} size="small" style={{ marginBottom: '24px' }}>
//           <Descriptions.Item label="Request ID">
//             <Tag color="blue">REQ-{requestId.slice(-6).toUpperCase()}</Tag>
//           </Descriptions.Item>
//           <Descriptions.Item label="Request Mode">
//             <Tag color={isReimbursement ? 'orange' : 'green'}>
//               {isReimbursement ? 'Reimbursement' : 'Cash Advance'}
//             </Tag>
//           </Descriptions.Item>
//           <Descriptions.Item label="Employee">
//             <Text strong>{request.employee?.fullName}</Text>
//           </Descriptions.Item>
//           <Descriptions.Item label="Department">
//             <Tag color="blue">{request.employee?.department}</Tag>
//           </Descriptions.Item>
//           <Descriptions.Item label="Type">
//             {request.requestType?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
//           </Descriptions.Item>
//           <Descriptions.Item label="Urgency">
//             <Tag color={request.urgency === 'high' ? 'red' : request.urgency === 'medium' ? 'orange' : 'green'}>
//               {request.urgency?.toUpperCase()}
//             </Tag>
//           </Descriptions.Item>
//           <Descriptions.Item label="Amount Requested">
//             <Text strong style={{ color: '#1890ff', fontSize: '16px' }}>
//               XAF {amountRequested.toLocaleString()}
//             </Text>
//           </Descriptions.Item>
//           <Descriptions.Item label="Submitted Date">
//             {new Date(request.createdAt).toLocaleDateString('en-GB')}
//           </Descriptions.Item>
//           <Descriptions.Item label="Current Status" span={2}>
//             <Space direction="vertical" size="small">
//               <Tag color={
//                 trueStatus === 'pending_finance' ? 'orange' :
//                 trueStatus === 'pending_head_of_business' ? 'purple' :
//                 trueStatus === 'approved' ? 'green' :
//                 trueStatus === 'partially_disbursed' ? 'blue' :
//                 'default'
//               }>
//                 {trueStatus?.replace(/_/g, ' ').toUpperCase()}
//               </Tag>
//               {/* ✅ Show warning if backend status differs */}
//               {request.status !== trueStatus && (
//                 <Text type="secondary" style={{ fontSize: '10px' }}>
//                   (Backend status: {request.status.replace(/_/g, ' ')})
//                 </Text>
//               )}
//             </Space>
//           </Descriptions.Item>
//           <Descriptions.Item label="Purpose" span={2}>
//             {request.purpose}
//           </Descriptions.Item>
//           <Descriptions.Item label="Business Justification" span={2}>
//             {request.businessJustification}
//           </Descriptions.Item>
//         </Descriptions>

//         {/* Itemized Breakdown */}
//         {hasItemizedBreakdown && (
//           <Card 
//             size="small" 
//             title={
//               <Space>
//                 <FileTextOutlined />
//                 <Text strong>Itemized Breakdown</Text>
//                 <Badge count={itemizedData.length} style={{ backgroundColor: '#52c41a' }} />
//               </Space>
//             }
//             style={{ marginBottom: '24px' }}
//           >
//             <Table
//               dataSource={itemizedData}
//               columns={itemizedColumns}
//               pagination={false}
//               size="small"
//               rowKey={(record, index) => index}
//               summary={() => (
//                 <Table.Summary fixed>
//                   <Table.Summary.Row>
//                     <Table.Summary.Cell index={0} colSpan={2}>
//                       <Text strong>Total</Text>
//                     </Table.Summary.Cell>
//                     <Table.Summary.Cell index={1}>
//                       <Text strong style={{ color: '#1890ff', fontSize: '16px' }}>
//                         XAF {itemizedData.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0).toLocaleString()}
//                       </Text>
//                     </Table.Summary.Cell>
//                   </Table.Summary.Row>
//                 </Table.Summary>
//               )}
//             />
//           </Card>
//         )}

//         {/* Receipt Documents */}
//         {isReimbursement && hasReceiptDocuments && (
//           <Card
//             size="small"
//             title={
//               <Space>
//                 <FileTextOutlined />
//                 <Text strong>Receipt Documents</Text>
//                 <Badge count={request.reimbursementDetails.receiptDocuments.length} style={{ backgroundColor: '#52c41a' }} />
//               </Space>
//             }
//             style={{ marginBottom: '24px' }}
//           >
//             <Space wrap>
//               {request.reimbursementDetails.receiptDocuments.map((doc, index) => (
//                 <Space key={index}>
//                   <Button
//                     icon={<EyeOutlined />}
//                     size="small"
//                     onClick={() => window.open(doc.url, '_blank')}
//                   >
//                     View
//                   </Button>
//                   <Button
//                     icon={<DownloadOutlined />}
//                     size="small"
//                     onClick={() => handleDownloadReceipt(doc)}
//                   >
//                     {doc.name}
//                   </Button>
//                 </Space>
//               ))}
//             </Space>
//           </Card>
//         )}

//         {/* Approval Chain Progress */}
//         {request.approvalChain && request.approvalChain.length > 0 && (
//           <Card size="small" title="Approval Chain Progress" style={{ marginBottom: '24px' }}>
//             <Row gutter={[16, 16]}>
//               {request.approvalChain.map((step, index) => (
//                 <Col span={24} key={index}>
//                   <div style={{ 
//                     padding: '12px', 
//                     border: `1px solid ${step.status === 'approved' ? '#52c41a' : step.status === 'rejected' ? '#ff4d4f' : '#d9d9d9'}`,
//                     borderRadius: '6px',
//                     backgroundColor: step.status === 'pending' ? '#fff7e6' : '#fafafa'
//                   }}>
//                     <Row align="middle">
//                       <Col span={16}>
//                         <Space>
//                           {step.status === 'approved' ? (
//                             <CheckCircleOutlined style={{ color: '#52c41a', fontSize: '20px' }} />
//                           ) : step.status === 'rejected' ? (
//                             <CloseCircleOutlined style={{ color: '#ff4d4f', fontSize: '20px' }} />
//                           ) : (
//                             <WarningOutlined style={{ color: '#faad14', fontSize: '20px' }} />
//                           )}
//                           <div>
//                             <Text strong>Level {step.level}: {step.approver?.name}</Text>
//                             <br />
//                             <Text type="secondary" style={{ fontSize: '12px' }}>
//                               {step.approver?.role} - {step.approver?.email}
//                             </Text>
//                           </div>
//                         </Space>
//                       </Col>
//                       <Col span={8} style={{ textAlign: 'right' }}>
//                         <Tag color={
//                           step.status === 'approved' ? 'green' : 
//                           step.status === 'rejected' ? 'red' : 
//                           'orange'
//                         }>
//                           {step.status.toUpperCase()}
//                         </Tag>
//                         {step.actionDate && (
//                           <div style={{ fontSize: '11px', marginTop: '4px' }}>
//                             {new Date(step.actionDate).toLocaleDateString('en-GB')}
//                           </div>
//                         )}
//                       </Col>
//                     </Row>
//                     {step.comments && (
//                       <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #f0f0f0' }}>
//                         <Text italic style={{ fontSize: '12px' }}>"{step.comments}"</Text>
//                       </div>
//                     )}
//                   </div>
//                 </Col>
//               ))}
//             </Row>
//           </Card>
//         )}

//         <Divider />

//         {/* ✅ V2 CONDITIONAL FORM RENDERING */}
        
//         {/* MODE 1: Awaiting HOB - Show info only */}
//         {isAwaitingCEO && (
//           <Alert
//             message="No Action Required at This Time"
//             description={
//               <div>
//                 <p>You have successfully approved this request and allocated budget code.</p>
//                 <p>The request is now awaiting final approval from <Text strong>Head of Business (Mr. E.T Kelvin)</Text>.</p>
//                 <p>Once the Head of Business approves, you will be able to disburse funds.</p>
//               </div>
//             }
//             type="info"
//             showIcon
//             icon={<InfoCircleOutlined />}
//             action={
//               <Button size="small" onClick={() => navigate('/finance/cash-approvals')}>
//                 Back to Approvals
//               </Button>
//             }
//           />
//         )}

//         {/* MODE 2: Finance Approval Form (pending_finance) */}
//         {canApprove && (
//           <Form
//             form={form}
//             layout="vertical"
//             onFinish={handleSubmit}
//             initialValues={{
//               decision: 'approved',
//               amountApproved: amountRequested
//             }}
//           >
//             <Alert
//               message="Finance Approval Required"
//               description="Review the request details above and make your approval decision. If approved, allocate a budget code. The request will then go to Head of Business for final approval."
//               type="warning"
//               showIcon
//               icon={<WarningOutlined />}
//               style={{ marginBottom: '16px' }}
//             />

//             <Form.Item
//               name="decision"
//               label="Your Decision"
//               rules={[{ required: true, message: 'Please make a decision' }]}
//             >
//               <Radio.Group>
//                 <Radio.Button value="approved" style={{ color:'#52c41a' }}>
//                   <CheckCircleOutlined /> Approve & Forward to HOB
//                 </Radio.Button>
//                 <Radio.Button value="rejected" style={{ color: '#f5222d' }}>
//                   <CloseCircleOutlined /> Reject {isReimbursement ? 'Reimbursement' : 'Request'}
//                 </Radio.Button>
//               </Radio.Group>
//             </Form.Item>

//             <Form.Item noStyle shouldUpdate={(prev, curr) => prev.decision !== curr.decision}>
//               {({ getFieldValue }) =>
//                 getFieldValue('decision') === 'approved' ? (
//                   <>
//                     <Form.Item
//                       name="budgetCodeId"
//                       label={
//                         <Space>
//                           <span>Budget Code</span>
//                           <Tag color="red">Required</Tag>
//                         </Space>
//                       }
//                       rules={[{ required: true, message: 'Budget code is required for approval' }]}
//                     >
//                       <Select
//                         placeholder="Select budget code"
//                         showSearch
//                         filterOption={(input, option) =>
//                           option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
//                         }
//                         onChange={handleBudgetCodeChange}
//                       >
//                         {budgetCodes.map(bc => (
//                           <Option key={bc._id} value={bc._id}>
//                             {bc.code} - {bc.name} (Available: XAF {bc.remaining.toLocaleString()})
//                           </Option>
//                         ))}
//                       </Select>
//                     </Form.Item>

//                     {selectedBudgetCode && (
//                       <Alert
//                         message="Budget Code Information"
//                         description={
//                           <div>
//                             <Text>Budget: XAF {selectedBudgetCode.budget.toLocaleString()}</Text>
//                             <br />
//                             <Text>Used: XAF {selectedBudgetCode.used.toLocaleString()}</Text>
//                             <br />
//                             <Text strong>Available: XAF {selectedBudgetCode.remaining.toLocaleString()}</Text>
//                           </div>
//                         }
//                         type="info"
//                         showIcon
//                         style={{ marginBottom: '16px' }}
//                       />
//                     )}

//                     <Form.Item
//                       name="amountApproved"
//                       label="Amount to Approve (XAF)"
//                       rules={[{ required: true, message: 'Please enter amount to approve' }]}
//                     >
//                       <InputNumber
//                         style={{ width: '100%' }}
//                         min={0}
//                         max={amountRequested}
//                         step={1000}
//                         formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
//                         parser={(value) => value.replace(/,/g, '')}
//                       />
//                     </Form.Item>

//                     <Alert
//                       message="Next Step: HOB Approval"
//                       description="After you approve, this request will be sent to the Head of Business for final approval. You will be able to disburse funds once the HOB approves."
//                       type="info"
//                       showIcon
//                       icon={<InfoCircleOutlined />}
//                       style={{ marginBottom: '16px' }}
//                     />
//                   </>
//                 ) : null
//               }
//             </Form.Item>

//             <Form.Item
//               name="comments"
//               label="Comments"
//               rules={[{ required: true, message: 'Please provide comments for your decision' }]}
//             >
//               <TextArea
//                 rows={4}
//                 placeholder="Explain your decision (required for audit trail)..."
//                 showCount
//                 maxLength={500}
//               />
//             </Form.Item>

//             <Form.Item>
//               <Space>
//                 <Button onClick={() => navigate('/finance/cash-approvals')}>
//                   Cancel
//                 </Button>
//                 <Button
//                   type="primary"
//                   htmlType="submit"
//                   loading={submitting}
//                   icon={form.getFieldValue('decision') === 'approved' ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
//                 >
//                   {submitting ? 'Processing...' : `${form.getFieldValue('decision') === 'approved' ? 'Approve & Forward to HOB' : 'Reject'}`}
//                 </Button>
//               </Space>
//             </Form.Item>
//           </Form>
//         )}

//         {/* MODE 3: Disbursement Form (approved or partially_disbursed) */}
//         {canDisburse && (
//           <Form
//             form={form}
//             layout="vertical"
//             onFinish={handleSubmit}
//           >
//             <Alert
//               message="Disbursement Ready"
//               description="This request has been fully approved (including by Head of Business). You can now disburse funds to the employee."
//               type="success"
//               showIcon
//               icon={<CheckCircleOutlined />}
//               style={{ marginBottom: '24px' }}
//             />

//             <Card 
//               size="small" 
//               title={
//                 <Space>
//                   <SendOutlined />
//                   <Text strong>Disbursement Details</Text>
//                   {hasExistingDisbursements && (
//                     <Tag color="blue">Additional Payment</Tag>
//                   )}
//                 </Space>
//               }
//               style={{ marginBottom: '24px', backgroundColor: '#f9f9f9' }}
//             >
//               <Space direction="vertical" style={{ width: '100%' }} size="large">
//                 {hasExistingDisbursements && (
//                   <Alert
//                     message={`XAF ${totalDisbursed.toLocaleString()} already disbursed. Remaining: XAF ${remainingBalance.toLocaleString()}`}
//                     type="info"
//                     showIcon
//                     icon={<InfoCircleOutlined />}
//                   />
//                 )}

//                 {!hasExistingDisbursements && (
//                   <Alert
//                     message="First Disbursement"
//                     description="This is the first payment for this request. You can disburse the full amount or make a partial payment."
//                     type="info"
//                     showIcon
//                   />
//                 )}

//                 <Form.Item 
//                   label={
//                     <Space>
//                       <span>Disbursement Amount (XAF)</span>
//                       <Tag color="red">Required</Tag>
//                     </Space>
//                   }
//                   style={{ marginBottom: 0 }}
//                 >
//                   <InputNumber
//                     style={{ width: '100%' }}
//                     min={0}
//                     max={remainingBalance}
//                     step={1000}
//                     value={disbursementAmount}
//                     onChange={setDisbursementAmount}
//                     formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
//                     parser={(value) => value.replace(/,/g, '')}
//                   />
//                   <Text type="secondary" style={{ fontSize: '12px', marginTop: '4px', display: 'block' }}>
//                     Maximum: XAF {remainingBalance.toLocaleString()}
//                   </Text>
//                 </Form.Item>

//                 {/* ✅ DISBURSEMENT PREVIEW */}
//                 <Row gutter={[16, 16]} style={{ marginTop: '16px' }}>
//                   <Col span={8}>
//                     <Statistic
//                       title="Amount Requested"
//                       value={amountRequested}
//                       precision={0}
//                       valueStyle={{ fontSize: '14px' }}
//                       prefix="XAF"
//                     />
//                   </Col>
//                   <Col span={8}>
//                     <Statistic
//                       title="Disbursing Now"
//                       value={disbursementAmount}
//                       precision={0}
//                       valueStyle={{ color: '#1890ff', fontSize: '14px' }}
//                       prefix="XAF"
//                     />
//                   </Col>
//                   <Col span={8}>
//                     <Statistic
//                       title="After This Payment"
//                       value={remainingAfterDisbursement}
//                       precision={0}
//                       valueStyle={{ 
//                         color: remainingAfterDisbursement > 0 ? '#cf1322' : '#3f8600', 
//                         fontSize: '14px' 
//                       }}
//                       prefix="XAF"
//                     />
//                   </Col>
//                 </Row>

//                 <Progress 
//                   percent={newDisbursementProgress} 
//                   status={newDisbursementProgress === 100 ? 'success' : 'active'}
//                   strokeColor={newDisbursementProgress === 100 ? '#52c41a' : '#1890ff'}
//                   format={(percent) => `${percent}% ${newDisbursementProgress === 100 ? '(Full Payment)' : '(Partial)'}`}
//                 />

//                 {remainingAfterDisbursement > 0 && disbursementAmount > 0 && (
//                   <Alert
//                     message="Partial Disbursement"
//                     description={`After this payment, XAF ${remainingAfterDisbursement.toLocaleString()} will remain to be disbursed. You can make additional payments later.`}
//                     type="warning"
//                     showIcon
//                     icon={<WarningOutlined />}
//                   />
//                 )}

//                 {newDisbursementProgress === 100 && disbursementAmount > 0 && (
//                   <Alert
//                     message="Full Disbursement"
//                     description="This payment will complete the full disbursement. The request will move to 'Fully Disbursed' status and await justification from the employee."
//                     type="success"
//                     showIcon
//                     icon={<CheckCircleOutlined />}
//                   />
//                 )}
//               </Space>
//             </Card>

//             <Form.Item
//               name="disbursementNotes"
//               label="Disbursement Notes"
//               rules={[{ required: false }]}
//             >
//               <TextArea
//                 rows={3}
//                 placeholder="Optional notes about this disbursement (e.g., payment method, reference number)..."
//                 showCount
//                 maxLength={300}
//               />
//             </Form.Item>

//             <Form.Item>
//               <Space>
//                 <Button onClick={() => navigate('/finance/cash-approvals')}>
//                   Cancel
//                 </Button>
//                 <Button
//                   type="primary"
//                   htmlType="submit"
//                   loading={submitting}
//                   icon={<SendOutlined />}
//                   disabled={!disbursementAmount || disbursementAmount <= 0 || disbursementAmount > remainingBalance}
//                 >
//                   {submitting ? 'Processing Disbursement...' : `Disburse XAF ${disbursementAmount.toLocaleString()}`}
//                 </Button>
//               </Space>
//             </Form.Item>
//           </Form>
//         )}

//         {/* If somehow none of the modes apply, show error */}
//         {!canApprove && !canDisburse && !isAwaitingCEO && (
//           <Alert
//             message="Invalid Action"
//             description="This request cannot be processed at this time. It may have already been processed or is in an invalid state."
//             type="error"
//             showIcon
//             action={
//               <Button size="small" onClick={() => navigate('/finance/cash-approvals')}>
//                 Back to Approvals
//               </Button>
//             }
//           />
//         )}
//       </Card>
//     </div>
//   );
// };

// export default FinanceCashApprovalForm;




