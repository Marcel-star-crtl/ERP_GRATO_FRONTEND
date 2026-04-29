import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Card, 
  Descriptions, 
  Typography, 
  Tag, 
  Divider, 
  Form, 
  Input, 
  Radio, 
  Button, 
  message,
  Modal,
  Space,
  Alert,
  Row,
  Col,
  Steps,
  Spin
} from 'antd';
import { 
  CheckCircleOutlined, 
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  DollarOutlined,
  FileTextOutlined,
  CalendarOutlined,
  DownloadOutlined,
  AuditOutlined
} from '@ant-design/icons';
import api from '../../services/api';
import { useSelector } from 'react-redux';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Step } = Steps;

const FinanceJustificationForm = () => {
  const { requestId } = useParams();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(false);
  const [decision, setDecision] = useState(null);
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    const fetchJustification = async () => {
      try {
        setLoading(true);
        console.log('=== FETCHING JUSTIFICATION ===');
        console.log('Request ID:', requestId);
        console.log('User Email:', user?.email);
        
        const response = await api.get(`/cash-requests/admin/${requestId}`);
        
        console.log('=== RAW API RESPONSE ===');
        console.log('Response.data:', response.data);
        
        const requestData = response.data.data;
        
        console.log('=== REQUEST DATA DETAILED ===');
        console.log('Full requestData:', requestData);
        console.log('totalDisbursed:', requestData.totalDisbursed);
        console.log('typeof totalDisbursed:', typeof requestData.totalDisbursed);
        console.log('disbursements array:', requestData.disbursements);
        console.log('disbursements length:', requestData.disbursements?.length);
        console.log('amountApproved:', requestData.amountApproved);
        console.log('status:', requestData.status);
        console.log('justification:', requestData.justification);
        console.log('justification.amountSpent:', requestData.justification?.amountSpent);
        console.log('justification.balanceReturned:', requestData.justification?.balanceReturned);
        
        const isJustificationStatus = requestData.status && (
          requestData.status.includes('justification_pending') || 
          requestData.status.includes('justification_rejected') ||
          requestData.status === 'completed'
        );
        
        console.log('=== VALIDATION CHECKS ===');
        console.log('Is justification status:', isJustificationStatus);
        
        if (!isJustificationStatus) {
          console.log('❌ NOT a justification request, redirecting...');
          message.warning('This is not a justification request');
          navigate('/finance/cash-approvals');
          return;
        }
        
        console.log('=== APPROVAL CHAIN CHECK ===');
        console.log('justificationApprovalChain:', requestData.justificationApprovalChain);
        
        const userCanApprove = requestData.justificationApprovalChain?.some(step => {
          const emailMatch = step.approver?.email?.toLowerCase() === user?.email?.toLowerCase();
          const isPending = step.status === 'pending';
          console.log(`Step ${step.level}: ${step.approver?.email} - emailMatch: ${emailMatch}, isPending: ${isPending}`);
          return emailMatch && isPending;
        });
        
        console.log('User can approve:', userCanApprove);
        console.log('Request status:', requestData.status);
        
        if (!userCanApprove && requestData.status !== 'completed') {
          console.log('❌ User does NOT have permission, redirecting...');
          message.warning('You do not have permission to approve this justification at this level');
          navigate('/finance/cash-approvals');
          return;
        }
        
        console.log('✅ Setting request data...');
        setRequest(requestData);
        console.log('✅ Request data set successfully');
      } catch (error) {
        console.error('=== ERROR FETCHING JUSTIFICATION ===');
        console.error('Error:', error);
        console.error('Error message:', error.message);
        message.error(error.message || 'Failed to load justification details');
        navigate('/finance/cash-approvals');
      } finally {
        setLoading(false);
        console.log('=== FETCH COMPLETE ===');
      }
    };
  
    fetchJustification();
  }, [requestId, navigate, user?.email]);

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      const response = await api.put(`/cash-requests/${requestId}/finance/justification`, {
        decision: values.decision,
        comments: values.comments
      });
      
      if (response.data.success) {
        message.success(`Justification ${values.decision === 'approve' ? 'approved and completed' : 'rejected'} successfully`);
        navigate('/finance/cash-approvals');
      } else {
        throw new Error(response.data.message || 'Failed to process justification');
      }
    } catch (error) {
      console.error('Error processing justification:', error);
      message.error(error.message || 'Failed to process justification');
    } finally {
      setLoading(false);
    }
  };

  const getCurrentApproverRole = () => {
    if (!request?.justificationApprovalChain || !user?.email) return 'Approver';
    
    const currentStep = request.justificationApprovalChain.find(
      step => step.approver?.email?.toLowerCase() === user.email.toLowerCase() && step.status === 'pending'
    );
    
    return currentStep?.approver?.role || 'Approver';
  };

  const isLastApprover = () => {
    if (!request?.justificationApprovalChain || !user?.email) return false;
    
    const currentStepIndex = request.justificationApprovalChain.findIndex(
      step => step.approver?.email?.toLowerCase() === user.email.toLowerCase() && step.status === 'pending'
    );
    
    if (currentStepIndex === -1) return false;
    
    return currentStepIndex === request.justificationApprovalChain.length - 1;
  };

  const getCurrentStepIndex = () => {
    if (!request?.justificationApprovalChain) return 2;
    
    const baseSteps = 3;
    
    const currentStepIndex = request.justificationApprovalChain.findIndex(
      step => step.status === 'pending' || step.status === 'rejected'
    );
    
    if (currentStepIndex === -1) {
      return baseSteps + request.justificationApprovalChain.length - 1;
    }
    
    return baseSteps + currentStepIndex;
  };

  const showConfirmModal = () => {
    const action = decision === 'approve' ? 'approve' : 'reject';
    const isLast = isLastApprover();
    
    Modal.confirm({
      title: `Confirm ${decision === 'approve' ? (isLast ? 'Final Approval' : 'Approval') : 'Rejection'}`,
      icon: decision === 'approve' ? <CheckCircleOutlined /> : <CloseCircleOutlined />,
      content: (
        <div>
          <p>Are you sure you want to {action} this justification?</p>
          {decision === 'approve' && isLast && (
            <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: '4px' }}>
              <strong>This will mark the entire cash request as COMPLETED.</strong>
            </div>
          )}
          {decision === 'approve' && !isLast && (
            <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#e6f7ff', border: '1px solid #91d5ff', borderRadius: '4px' }}>
              <strong>This will forward the justification to the next approval level.</strong>
            </div>
          )}
          {decision === 'reject' && (
            <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#fff2f0', border: '1px solid #ffccc7', borderRadius: '4px' }}>
              <strong>The employee will need to resubmit the justification.</strong>
            </div>
          )}
        </div>
      ),
      onOk: () => form.submit(),
      okText: `Yes, ${decision === 'approve' ? (isLast ? 'Approve & Complete' : 'Approve & Forward') : 'Reject'}`,
      cancelText: 'Cancel',
      okButtonProps: {
        danger: decision === 'reject'
      }
    });
  };

  const downloadDocument = async (doc) => {
    if (doc.url) {
      try {
        console.log('Downloading document:', {
          docName: doc.name,
          originalUrl: doc.url,
          requestId: request._id
        });
        
        // Use the API route to serve the document with authentication
        // Use publicId for correct file retrieval
        const documentUrl = `/cash-requests/justification-document/${request._id}/${encodeURIComponent(doc.publicId || doc.name)}`;
        
        console.log('Fetching from API route:', documentUrl);
        
        // Try to fetch the file through the API with authentication
        const response = await api.get(documentUrl, {
          responseType: 'blob',
          headers: {
            'Accept': 'application/pdf, image/*, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document'
          }
        });
        
        // Create a blob URL and open it
        const blob = new Blob([response.data], { 
          type: response.headers['content-type'] || doc.mimetype || 'application/pdf' 
        });
        const blobUrl = window.URL.createObjectURL(blob);
        window.open(blobUrl, '_blank');
        
        // Clean up the blob URL after a short delay
        setTimeout(() => window.URL.revokeObjectURL(blobUrl), 100);
        
      } catch (error) {
        console.error('Error downloading document:', error);
        
        if (error.response?.status === 404) {
          message.error('Document not found on server. It may have been deleted or not uploaded correctly.');
        } else if (error.response?.status === 403) {
          message.error('You do not have permission to view this document.');
        } else {
          message.error('Failed to download document. Please try again or contact support.');
        }
      }
    } else {
      message.error('Document URL not available');
    }
  };

  if (loading && !request) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Spin size="large" />
        <div style={{ marginTop: '16px' }}>Loading justification details...</div>
      </div>
    );
  }

  if (!request) {
    return (
      <div style={{ padding: '24px' }}>
        <Alert message="Justification not found" type="error" />
      </div>
    );
  }

  // Calculate financial details
  console.log('=== FINANCIAL CALCULATIONS START ===');
  console.log('request object exists:', !!request);
  console.log('request.totalDisbursed:', request.totalDisbursed);
  console.log('request.disbursements:', request.disbursements);
  console.log('request.amountApproved:', request.amountApproved);
  
  const disbursedAmount = request.totalDisbursed || 
    (request.disbursements && request.disbursements.length > 0 
      ? request.disbursements.reduce((sum, d) => sum + (d.amount || 0), 0)
      : request.amountApproved || 0);
  
  console.log('Calculated disbursedAmount:', disbursedAmount);
  console.log('Type of disbursedAmount:', typeof disbursedAmount);
  
  const spentAmount = request.justification?.amountSpent || 0;
  console.log('spentAmount:', spentAmount);
  
  const returnedAmount = request.justification?.balanceReturned || 0;
  console.log('returnedAmount:', returnedAmount);
  
  const isBalanced = Math.abs((spentAmount + returnedAmount) - disbursedAmount) < 0.01;
  console.log('isBalanced:', isBalanced);
  console.log('Balance check: (spent + returned) vs disbursed:', (spentAmount + returnedAmount), 'vs', disbursedAmount);
  console.log('=== FINANCIAL CALCULATIONS END ===');

  return (
    <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto' }}>
      <Card>
        <Title level={3} style={{ marginBottom: '24px' }}>
          <AuditOutlined /> Final Justification Review
        </Title>

        {/* Process Steps */}
        <Steps current={getCurrentStepIndex()} style={{ marginBottom: '32px' }} size="small">
          <Step title="Request Submitted" description="Employee submitted cash request" />
          <Step title="Request Approved" description="Cash request approved and disbursed" />
          <Step 
            title="Justification Submitted" 
            description="Employee submitted spending justification" 
          />
          {request.justificationApprovalChain?.map((step, index) => {
            const isCurrentStep = step.status === 'pending';
            const isApproved = step.status === 'approved';
            const isRejected = step.status === 'rejected';
            
            return (
              <Step
                key={step._id || index}
                title={`Level ${step.level}: ${step.approver?.role || 'Approver'}`}
                description={
                  <div>
                    <div>{step.approver?.name}</div>
                    {isApproved && (
                      <Tag color="green" size="small" style={{ marginTop: 4 }}>
                        ✅ Approved
                      </Tag>
                    )}
                    {isRejected && (
                      <Tag color="red" size="small" style={{ marginTop: 4 }}>
                        ❌ Rejected
                      </Tag>
                    )}
                    {isCurrentStep && (
                      <Tag color="orange" size="small" style={{ marginTop: 4 }}>
                        ⏳ Pending
                      </Tag>
                    )}
                  </div>
                }
                status={
                  isApproved ? 'finish' : 
                  isRejected ? 'error' : 
                  isCurrentStep ? 'process' : 
                  'wait'
                }
              />
            );
          })}
        </Steps>

        {/* Previous Approval Decisions */}
        {request.justificationApprovalChain?.filter(step => step.status !== 'pending').length > 0 && (
          <Card type="inner" title="Previous Approval Decisions" style={{ marginBottom: '24px' }}>
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              {request.justificationApprovalChain
                .filter(step => step.status !== 'pending')
                .map((step, index) => (
                  <Card key={step._id || index} size="small" style={{ backgroundColor: step.status === 'approved' ? '#f6ffed' : '#fff1f0' }}>
                    <Row gutter={16}>
                      <Col span={12}>
                        <Descriptions size="small" column={1}>
                          <Descriptions.Item label={`Level ${step.level} - ${step.approver?.role}`}>
                            {step.approver?.name}
                          </Descriptions.Item>
                          <Descriptions.Item label="Decision">
                            <Tag color={step.status === 'approved' ? 'green' : 'red'} icon={step.status === 'approved' ? <CheckCircleOutlined /> : <CloseCircleOutlined />}>
                              {step.status.toUpperCase()}
                            </Tag>
                          </Descriptions.Item>
                          <Descriptions.Item label="Decision Date">
                            {step.actionDate
                              ? new Date(step.actionDate).toLocaleDateString()
                              : 'N/A'
                            }
                          </Descriptions.Item>
                        </Descriptions>
                      </Col>
                      <Col span={12}>
                        <div>
                          <Text strong>Comments:</Text>
                          <div style={{ 
                            marginTop: '8px', 
                            padding: '8px', 
                            backgroundColor: '#f5f5f5', 
                            borderRadius: '4px',
                            fontStyle: 'italic'
                          }}>
                            {step.comments || 'No comments provided'}
                          </div>
                        </div>
                      </Col>
                    </Row>
                  </Card>
                ))}
            </Space>
          </Card>
        )}

        {/* Original Request Summary */}
        <Card type="inner" title="Original Request Summary" style={{ marginBottom: '24px' }}>
          <Descriptions bordered column={3} size="small">
            <Descriptions.Item label="Request ID">
              <Text code>REQ-{request._id.slice(-6).toUpperCase()}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Employee">
              {request.employee?.fullName}
            </Descriptions.Item>
            <Descriptions.Item label="Department">
              {request.employee?.department || 'N/A'}
            </Descriptions.Item>
            <Descriptions.Item label="Request Type">
              {request.requestType?.replace('-', ' ')?.toUpperCase()}
            </Descriptions.Item>
            <Descriptions.Item label="Original Purpose" span={2}>
              {request.purpose}
            </Descriptions.Item>
          </Descriptions>
        </Card>

        {/* Financial Analysis */}
        <Card type="inner" title="Financial Analysis & Budget Reconciliation" style={{ marginBottom: '24px' }}>
          <Row gutter={16} style={{ marginBottom: '16px' }}>
            <Col span={6}>
              <Card size="small" style={{ textAlign: 'center' }}>
                <Text type="secondary">Originally Requested</Text>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#666' }}>
                  XAF {(request.amountRequested || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </Card>
            </Col>
            <Col span={6}>
              <Card size="small" style={{ textAlign: 'center' }}>
                <Text type="secondary">Amount Disbursed</Text>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1890ff' }}>
                  XAF {disbursedAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </Card>
            </Col>
            <Col span={6}>
              <Card size="small" style={{ textAlign: 'center' }}>
                <Text type="secondary">Amount Spent</Text>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#ff4d4f' }}>
                  XAF {spentAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </Card>
            </Col>
            <Col span={6}>
              <Card size="small" style={{ textAlign: 'center', backgroundColor: returnedAmount < 0 ? '#fff7e6' : '#f6f9ff' }}>
                <Text type="secondary">
                  {returnedAmount < 0 ? '💰 Reimbursement Owed' : 'Balance to Return'}
                </Text>
                <div style={{ 
                  fontSize: '18px', 
                  fontWeight: 'bold', 
                  color: returnedAmount < 0 ? '#ff7a45' : '#52c41a' 
                }}>
                  XAF {Math.abs(returnedAmount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div style={{ fontSize: '10px', color: returnedAmount < 0 ? '#ff7a45' : '#52c41a', marginTop: '4px', fontWeight: 'bold' }}>
                  {returnedAmount < 0 ? `Company owes employee` : `Employee owes company`}
                </div>
              </Card>
            </Col>
          </Row>

          {/* Budget Impact Alert */}
          {returnedAmount < 0 && (
            <Alert
              message="⚠️ Budget Impact: Reimbursement Required"
              description={
                <div>
                  <p style={{ marginBottom: '8px' }}>
                    The employee spent <strong>XAF {Math.abs(returnedAmount).toLocaleString()}</strong> from their own pocket beyond the disbursed amount.
                  </p>
                  <ul style={{ marginBottom: 0, paddingLeft: '20px' }}>
                    <li>Original Budget Allocation: <strong>XAF {(request.amountApproved || disbursedAmount).toLocaleString()}</strong></li>
                    <li>Actual Expense: <strong>XAF {spentAmount.toLocaleString()}</strong></li>
                    <li>Budget Variance: <strong>XAF {Math.abs(returnedAmount).toLocaleString()} OVER</strong></li>
                    <li><strong style={{ color: '#ff7a45' }}>Action:</strong> Allocate additional budget and process reimbursement</li>
                  </ul>
                </div>
              }
              type="warning"
              showIcon
              style={{ marginTop: '16px' }}
            />
          )}

          {/* Normal Balance Check */}
          {returnedAmount >= 0 && (
            <Alert
              message={isBalanced ? '✅ Financial Balance Verified' : '⚠️ Financial Discrepancy Detected'}
              description={
                isBalanced 
                  ? `Amount disbursed (XAF ${disbursedAmount.toLocaleString()}) = Amount spent (XAF ${spentAmount.toLocaleString()}) + Balance to return (XAF ${returnedAmount.toLocaleString()})`
                  : `Mismatch: Disbursed ${disbursedAmount.toLocaleString()} ≠ Spent ${spentAmount.toLocaleString()} + Returned ${returnedAmount.toLocaleString()} = ${(spentAmount + returnedAmount).toLocaleString()}`
              }
              type={isBalanced ? 'success' : 'warning'}
              showIcon
              style={{ marginTop: '16px' }}
            />
          )}

          {/* No Overspend Case */}
          {returnedAmount === 0 && (
            <Alert
              message="✅ Exact Match"
              description={`Employee spent exactly the amount disbursed (XAF ${spentAmount.toLocaleString()}). No balance to return or reimburse.`}
              type="success"
              showIcon
              style={{ marginTop: '16px' }}
            />
          )}
        </Card>

        {/* Justification Details */}
        <Card type="inner" title="Employee Justification Details" style={{ marginBottom: '24px' }}>
          <Descriptions bordered column={1}>
            <Descriptions.Item label="Submission Date">
              <Space>
                <CalendarOutlined />
                {request.justification?.justificationDate 
                  ? new Date(request.justification.justificationDate).toLocaleDateString()
                  : 'N/A'
                }
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="Detailed Spending Explanation">
              <div style={{ 
                whiteSpace: 'pre-wrap', 
                maxHeight: '300px', 
                overflowY: 'auto',
                padding: '12px',
                backgroundColor: '#fafafa',
                border: '1px solid #d9d9d9',
                borderRadius: '6px'
              }}>
                {request.justification?.details || 'No details provided'}
              </div>
            </Descriptions.Item>
          </Descriptions>

          {/* Supporting Documents */}
          {request.justification?.documents && request.justification.documents.length > 0 && (
            <div style={{ marginTop: '16px' }}>
              <Text strong>Supporting Documents ({request.justification.documents.length}):</Text>
              <Row gutter={[16, 8]} style={{ marginTop: '8px' }}>
                {request.justification.documents.map((doc, index) => (
                  <Col span={12} key={index}>
                    <Card size="small">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ flex: 1 }}>
                          <Text strong>{doc.name}</Text>
                          <br />
                          <Text type="secondary" style={{ fontSize: '12px' }}>
                            {doc.size ? `${(doc.size / 1024).toFixed(1)} KB` : ''} • {doc.mimetype || 'Unknown type'}
                          </Text>
                        </div>
                        <Button 
                          type="primary" 
                          size="small" 
                          icon={<DownloadOutlined />}
                          onClick={() => downloadDocument(doc)}
                        >
                          View
                        </Button>
                      </div>
                    </Card>
                  </Col>
                ))}
              </Row>
            </div>
          )}
        </Card>

        <Divider />

        <Alert
          message={`${getCurrentApproverRole()} Decision Required`}
          description={`This justification has been approved by previous levels and requires your decision to ${isLastApprover() ? 'close the cash request' : 'proceed to the next approval level'}.`}
          type="info"
          showIcon
          style={{ marginBottom: '24px' }}
        />

        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="decision"
            label="Final Finance Decision"
            rules={[{ required: true, message: 'Please make a decision' }]}
          >
            <Radio.Group onChange={(e) => setDecision(e.target.value)}>
              <Space direction="vertical">
                <Radio.Button value="approve" style={{ color: '#52c41a' }}>
                  <CheckCircleOutlined /> Approve & {isLastApprover() ? 'Complete Request' : 'Forward'}
                </Radio.Button>
                <Radio.Button value="reject" style={{ color: '#ff4d4f' }}>
                  <CloseCircleOutlined /> Reject (Requires Resubmission)
                </Radio.Button>
              </Space>
            </Radio.Group>
          </Form.Item>

          <Form.Item
            name="comments"
            label="Finance Comments"
            rules={decision === 'reject' ? [{ required: true, message: 'Please explain why this justification is being rejected' }] : []}
          >
            <TextArea 
              rows={4} 
              placeholder={
                decision === 'approve' 
                  ? "Optional: Final comments or notes for completion..."
                  : "Required: Please explain what is wrong with this justification and what needs to be corrected..."
              }
              showCount
              maxLength={500}
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button onClick={() => navigate('/finance/cash-approvals')}>
                Back to Cash Approvals
              </Button>
              <Button
                type="primary"
                onClick={showConfirmModal}
                disabled={!decision}
                loading={loading}
                icon={decision === 'approve' ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
                style={{
                  backgroundColor: decision === 'approve' ? '#52c41a' : decision === 'reject' ? '#ff4d4f' : undefined
                }}
              >
                {decision === 'approve' 
                  ? (isLastApprover() ? 'Approve & Complete' : 'Approve & Forward') 
                  : decision === 'reject' 
                  ? 'Reject Justification' 
                  : 'Submit Decision'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default FinanceJustificationForm;






// import React, { useState, useEffect } from 'react';
// import { useParams, useNavigate } from 'react-router-dom';
// import { 
//   Card, 
//   Descriptions, 
//   Typography, 
//   Tag, 
//   Divider, 
//   Form, 
//   Input, 
//   Radio, 
//   Button, 
//   message,
//   Modal,
//   Space,
//   Alert,
//   Row,
//   Col,
//   Steps
// } from 'antd';
// import { 
//   CheckCircleOutlined, 
//   CloseCircleOutlined,
//   ExclamationCircleOutlined,
//   DollarOutlined,
//   FileTextOutlined,
//   CalendarOutlined,
//   UserOutlined,
//   DownloadOutlined,
//   AuditOutlined
// } from '@ant-design/icons';
// import api from '../../services/api';
// import { useSelector } from 'react-redux';

// const { Title, Text } = Typography;
// const { TextArea } = Input;
// const { Step } = Steps;

// const FinanceJustificationForm = () => {
//   const { requestId } = useParams();
//   const navigate = useNavigate();
//   const [form] = Form.useForm();
//   const [request, setRequest] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const [decision, setDecision] = useState(null);
//   const { user } = useSelector((state) => state.auth);

//   // useEffect(() => {
//   //   const fetchJustification = async () => {
//   //     try {
//   //       setLoading(true);
//   //       // Use admin endpoint to get full details
//   //       const response = await api.get(`/cash-requests/admin/${requestId}`);
        
//   //       const requestData = response.data.data;
        
//   //       // Verify this is a justification pending finance approval
//   //       if (requestData.status !== 'justification_pending_finance') {
//   //         message.warning('This justification is not pending finance approval');
//   //         navigate('/finance/justifications');
//   //         return;
//   //       }
        
//   //       setRequest(requestData);
//   //     } catch (error) {
//   //       console.error('Error fetching justification:', error);
//   //       message.error(error.message || 'Failed to load justification details');
//   //       navigate('/finance/justifications');
//   //     } finally {
//   //       setLoading(false);
//   //     }
//   //   };
  
//   //   fetchJustification();
//   // }, [requestId, navigate]);

//   useEffect(() => {
//     const fetchJustification = async () => {
//       try {
//         setLoading(true);
//         console.log('=== FETCHING JUSTIFICATION ===');
//         console.log('Request ID:', requestId);
//         console.log('User Email:', user?.email);
        
//         // Use admin endpoint to get full details
//         const response = await api.get(`/cash-requests/admin/${requestId}`);
        
//         console.log('=== RAW API RESPONSE ===');
//         console.log('Response:', response);
//         console.log('Response.data:', response.data);
        
//         const requestData = response.data.data;
        
//         console.log('=== REQUEST DATA DETAILED ===');
//         console.log('Full requestData:', requestData);
//         console.log('totalDisbursed:', requestData.totalDisbursed);
//         console.log('typeof totalDisbursed:', typeof requestData.totalDisbursed);
//         console.log('disbursements array:', requestData.disbursements);
//         console.log('disbursements length:', requestData.disbursements?.length);
//         console.log('amountApproved:', requestData.amountApproved);
//         console.log('status:', requestData.status);
//         console.log('justification:', requestData.justification);
//         console.log('justification.amountSpent:', requestData.justification?.amountSpent);
//         console.log('justification.balanceReturned:', requestData.justification?.balanceReturned);
        
//         // Check if this is a justification request
//         const isJustificationStatus = requestData.status && (
//           requestData.status.includes('justification_pending') || 
//           requestData.status.includes('justification_rejected') ||
//           requestData.status === 'completed'
//         );
        
//         console.log('=== VALIDATION CHECKS ===');
//         console.log('Is justification status:', isJustificationStatus);
        
//         if (!isJustificationStatus) {
//           console.log('❌ NOT a justification request, redirecting...');
//           message.warning('This is not a justification request');
//           navigate('/finance/cash-approvals');
//           return;
//         }
        
//         // Check if user has permission to approve at this level
//         console.log('=== APPROVAL CHAIN CHECK ===');
//         console.log('justificationApprovalChain:', requestData.justificationApprovalChain);
        
//         const userCanApprove = requestData.justificationApprovalChain?.some(step => {
//           const emailMatch = step.approver?.email?.toLowerCase() === user?.email?.toLowerCase();
//           const isPending = step.status === 'pending';
//           console.log(`Step ${step.level}: ${step.approver?.email} - emailMatch: ${emailMatch}, isPending: ${isPending}`);
//           return emailMatch && isPending;
//         });
        
//         console.log('User can approve:', userCanApprove);
//         console.log('Request status:', requestData.status);
        
//         if (!userCanApprove && requestData.status !== 'completed') {
//           console.log('❌ User does NOT have permission, redirecting...');
//           message.warning('You do not have permission to approve this justification at this level');
//           navigate('/finance/cash-approvals');
//           return;
//         }
        
//         console.log('✅ Setting request data...');
//         setRequest(requestData);
//         console.log('✅ Request data set successfully');
//       } catch (error) {
//         console.error('=== ERROR FETCHING JUSTIFICATION ===');
//         console.error('Error:', error);
//         console.error('Error message:', error.message);
//         console.error('Error response:', error.response);
//         message.error(error.message || 'Failed to load justification details');
//         navigate('/finance/cash-approvals');
//       } finally {
//         setLoading(false);
//         console.log('=== FETCH COMPLETE ===');
//       }
//     };
  
//     fetchJustification();
//   }, [requestId, navigate, user?.email]);

//   const handleSubmit = async (values) => {
//     try {
//       setLoading(true);
//       const response = await api.put(`/cash-requests/${requestId}/finance/justification`, {
//         decision: values.decision,
//         comments: values.comments
//       });
      
//       if (response.data.success) {
//         message.success(`Justification ${values.decision === 'approve' ? 'approved and completed' : 'rejected'} successfully`);
//         navigate('/finance/justifications');
//       } else {
//         throw new Error(response.data.message || 'Failed to process justification');
//       }
//     } catch (error) {
//       console.error('Error processing justification:', error);
//       message.error(error.message || 'Failed to process justification');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const showConfirmModal = () => {
//     const action = decision === 'approve' ? 'approve and close' : 'reject';
    
//     Modal.confirm({
//       title: `Confirm Final ${decision === 'approve' ? 'Approval' : 'Rejection'}`,
//       icon: decision === 'approve' ? <CheckCircleOutlined /> : <CloseCircleOutlined />,
//       content: (
//         <div>
//           <p>Are you sure you want to {action} this justification?</p>
//           {decision === 'approve' && (
//             <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: '4px' }}>
//               <strong>This will mark the entire cash request as COMPLETED.</strong>
//             </div>
//           )}
//           {decision === 'reject' && (
//             <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#fff2f0', border: '1px solid #ffccc7', borderRadius: '4px' }}>
//               <strong>The employee will need to resubmit the justification.</strong>
//             </div>
//           )}
//         </div>
//       ),
//       onOk: () => form.submit(),
//       okText: `Yes, ${decision === 'approve' ? 'Approve & Complete' : 'Reject'}`,
//       cancelText: 'Cancel',
//       okButtonProps: {
//         danger: decision === 'reject'
//       }
//     });
//   };

//   const downloadDocument = (doc) => {
//     if (doc.url) {
//       window.open(doc.url, '_blank');
//     }
//   };

//   if (loading && !request) {
//     return <div style={{ padding: '24px', textAlign: 'center' }}>Loading justification details...</div>;
//   }

//   if (!request) {
//     return (
//       <div style={{ padding: '24px' }}>
//         <Alert message="Justification not found" type="error" />
//       </div>
//     );
//   }

//   const disbursedAmount = request.disbursementDetails?.amount || 0;
//   const spentAmount = request.justification?.amountSpent || 0;
//   const returnedAmount = request.justification?.balanceReturned || 0;
//   const isBalanced = Math.abs((spentAmount + returnedAmount) - disbursedAmount) < 0.01;

//   return (
//     <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto' }}>
//       <Card>
//         <Title level={3} style={{ marginBottom: '24px' }}>
//           <AuditOutlined /> Final Justification Review
//         </Title>

//         {/* Process Steps */}
//         <Steps current={2} style={{ marginBottom: '32px' }}>
//           <Step title="Request Submitted" description="Employee submitted cash request" />
//           <Step title="Supervisor Approved" description="Request approved and disbursed" />
//           <Step 
//             title="Justification Submitted" 
//             description="Employee submitted spending justification" 
//           />
//           <Step 
//             title="Supervisor Reviewed" 
//             description={`${request.justificationApproval?.supervisorDecision?.decision === 'approve' ? '✅ Approved' : '❌ Rejected'} by supervisor`}
//           />
//           <Step 
//             title="Finance Final Review" 
//             description="Awaiting your decision"
//             status="process"
//           />
//         </Steps>

//         {/* Supervisor Decision Summary */}
//         <Card type="inner" title="Supervisor Review" style={{ marginBottom: '24px' }}>
//           <Row gutter={16}>
//             <Col span={12}>
//               <Descriptions size="small" column={1}>
//                 <Descriptions.Item label="Supervisor">
//                   {request.supervisor?.fullName}
//                 </Descriptions.Item>
//                 <Descriptions.Item label="Decision">
//                   <Tag color="green" icon={<CheckCircleOutlined />}>
//                     APPROVED
//                   </Tag>
//                 </Descriptions.Item>
//                 <Descriptions.Item label="Decision Date">
//                   {request.justificationApproval?.supervisorDecision?.decisionDate
//                     ? new Date(request.justificationApproval.supervisorDecision.decisionDate).toLocaleDateString()
//                     : 'N/A'
//                   }
//                 </Descriptions.Item>
//               </Descriptions>
//             </Col>
//             <Col span={12}>
//               <div>
//                 <Text strong>Supervisor Comments:</Text>
//                 <div style={{ 
//                   marginTop: '8px', 
//                   padding: '8px', 
//                   backgroundColor: '#f5f5f5', 
//                   borderRadius: '4px',
//                   fontStyle: 'italic'
//                 }}>
//                   {request.justificationApproval?.supervisorDecision?.comments || 'No comments provided'}
//                 </div>
//               </div>
//             </Col>
//           </Row>
//         </Card>

//         {/* Original Request Summary */}
//         <Card type="inner" title="Original Request Summary" style={{ marginBottom: '24px' }}>
//           <Descriptions bordered column={3} size="small">
//             <Descriptions.Item label="Request ID">
//               <Text code>REQ-{request._id.slice(-6).toUpperCase()}</Text>
//             </Descriptions.Item>
//             <Descriptions.Item label="Employee">
//               {request.employee?.fullName}
//             </Descriptions.Item>
//             <Descriptions.Item label="Department">
//               {request.employee?.department || 'N/A'}
//             </Descriptions.Item>
//             <Descriptions.Item label="Request Type">
//               {request.requestType?.replace('-', ' ')?.toUpperCase()}
//             </Descriptions.Item>
//             <Descriptions.Item label="Original Purpose" span={2}>
//               {request.purpose}
//             </Descriptions.Item>
//           </Descriptions>
//         </Card>

//         {/* Financial Analysis */}
//         <Card type="inner" title="Financial Analysis" style={{ marginBottom: '24px' }}>
//           <Row gutter={16} style={{ marginBottom: '16px' }}>
//             <Col span={6}>
//               <Card size="small" style={{ textAlign: 'center' }}>
//                 <Text type="secondary">Originally Requested</Text>
//                 <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#666' }}>
//                   XAF {request.amountRequested?.toFixed(2)}
//                 </div>
//               </Card>
//             </Col>
//             <Col span={6}>
//               <Card size="small" style={{ textAlign: 'center' }}>
//                 <Text type="secondary">Amount Disbursed</Text>
//                 <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1890ff' }}>
//                   XAF {disbursedAmount.toFixed(2)}
//                 </div>
//               </Card>
//             </Col>
//             <Col span={6}>
//               <Card size="small" style={{ textAlign: 'center' }}>
//                 <Text type="secondary">Amount Spent</Text>
//                 <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#ff4d4f' }}>
//                   XAF {spentAmount.toFixed(2)}
//                 </div>
//               </Card>
//             </Col>
//             <Col span={6}>
//               <Card size="small" style={{ textAlign: 'center' }}>
//                 <Text type="secondary">Balance Returned</Text>
//                 <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#52c41a' }}>
//                   XAF {returnedAmount.toFixed(2)}
//                 </div>
//               </Card>
//             </Col>
//           </Row>

//           {/* Balance Check */}
//           <Alert
//             message={isBalanced ? 'Financial Balance Verified ✅' : 'Financial Discrepancy Detected ⚠️'}
//             description={
//               isBalanced 
//                 ? `Amount disbursed (${disbursedAmount.toFixed(2)}) = Amount spent (${spentAmount.toFixed(2)}) + Balance returned (${returnedAmount.toFixed(2)})`
//                 : `Mismatch: Disbursed ${disbursedAmount.toFixed(2)} ≠ Spent ${spentAmount.toFixed(2)} + Returned ${returnedAmount.toFixed(2)} = ${(spentAmount + returnedAmount).toFixed(2)}`
//             }
//             type={isBalanced ? 'success' : 'warning'}
//             showIcon
//             style={{ marginTop: '16px' }}
//           />
//         </Card>

//         {/* Justification Details */}
//         <Card type="inner" title="Employee Justification Details" style={{ marginBottom: '24px' }}>
//           <Descriptions bordered column={1}>
//             <Descriptions.Item label="Submission Date">
//               <Space>
//                 <CalendarOutlined />
//                 {request.justification?.justificationDate 
//                   ? new Date(request.justification.justificationDate).toLocaleDateString()
//                   : 'N/A'
//                 }
//               </Space>
//             </Descriptions.Item>
//             <Descriptions.Item label="Detailed Spending Explanation">
//               <div style={{ 
//                 whiteSpace: 'pre-wrap', 
//                 maxHeight: '300px', 
//                 overflowY: 'auto',
//                 padding: '12px',
//                 backgroundColor: '#fafafa',
//                 border: '1px solid #d9d9d9',
//                 borderRadius: '6px'
//               }}>
//                 {request.justification?.details || 'No details provided'}
//               </div>
//             </Descriptions.Item>
//           </Descriptions>

//           {/* Supporting Documents */}
//           {request.justification?.documents && request.justification.documents.length > 0 && (
//             <div style={{ marginTop: '16px' }}>
//               <Text strong>Supporting Documents ({request.justification.documents.length}):</Text>
//               <Row gutter={[16, 8]} style={{ marginTop: '8px' }}>
//                 {request.justification.documents.map((doc, index) => (
//                   <Col span={12} key={index}>
//                     <Card size="small">
//                       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
//                         <div style={{ flex: 1 }}>
//                           <Text strong>{doc.name}</Text>
//                           <br />
//                           <Text type="secondary" style={{ fontSize: '12px' }}>
//                             {doc.size ? `${(doc.size / 1024).toFixed(1)} KB` : ''} • {doc.mimetype || 'Unknown type'}
//                           </Text>
//                         </div>
//                         <Button 
//                           type="primary" 
//                           size="small" 
//                           icon={<DownloadOutlined />}
//                           onClick={() => downloadDocument(doc)}
//                         >
//                           View
//                         </Button>
//                       </div>
//                     </Card>
//                   </Col>
//                 ))}
//               </Row>
//             </div>
//           )}
//         </Card>

//         <Divider />

//         <Alert
//           message="Finance Final Decision Required"
//           description="This justification has been approved by the supervisor and requires your final decision to close the cash request."
//           type="info"
//           showIcon
//           style={{ marginBottom: '24px' }}
//         />

//         <Form form={form} layout="vertical" onFinish={handleSubmit}>
//           <Form.Item
//             name="decision"
//             label="Final Finance Decision"
//             rules={[{ required: true, message: 'Please make a decision' }]}
//           >
//             <Radio.Group onChange={(e) => setDecision(e.target.value)}>
//               <Space direction="vertical">
//                 <Radio.Button value="approve" style={{ color: '#52c41a' }}>
//                   <CheckCircleOutlined /> Approve & Complete Request
//                 </Radio.Button>
//                 <Radio.Button value="reject" style={{ color: '#ff4d4f' }}>
//                   <CloseCircleOutlined /> Reject (Requires Resubmission)
//                 </Radio.Button>
//               </Space>
//             </Radio.Group>
//           </Form.Item>

//           <Form.Item
//             name="comments"
//             label="Finance Comments"
//             rules={decision === 'reject' ? [{ required: true, message: 'Please explain why this justification is being rejected' }] : []}
//           >
//             <TextArea 
//               rows={4} 
//               placeholder={
//                 decision === 'approve' 
//                   ? "Optional: Final comments or notes for completion..."
//                   : "Required: Please explain what is wrong with this justification and what needs to be corrected..."
//               }
//               showCount
//               maxLength={500}
//             />
//           </Form.Item>

//           <Form.Item>
//             <Space>
//               <Button onClick={() => navigate('/finance/justifications')}>
//                 Back to Justifications
//               </Button>
//               <Button
//                 type="primary"
//                 onClick={showConfirmModal}
//                 disabled={!decision}
//                 loading={loading}
//                 icon={decision === 'approve' ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
//                 style={{
//                   backgroundColor: decision === 'approve' ? '#52c41a' : decision === 'reject' ? '#ff4d4f' : undefined
//                 }}
//               >
//                 {decision === 'approve' ? 'Approve & Complete' : decision === 'reject' ? 'Reject Justification' : 'Submit Decision'}
//               </Button>
//             </Space>
//           </Form.Item>
//         </Form>
//       </Card>
//     </div>
//   );
// };

// export default FinanceJustificationForm;