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
  Steps
} from 'antd';
import { 
  CheckCircleOutlined, 
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  DollarOutlined,
  FileTextOutlined,
  CalendarOutlined,
  UserOutlined,
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
        // Use admin endpoint to get full details
        const response = await api.get(`/api/cash-requests/admin/${requestId}`);
        
        const requestData = response.data.data;
        
        // Verify this is a justification pending finance approval
        if (requestData.status !== 'justification_pending_finance') {
          message.warning('This justification is not pending finance approval');
          navigate('/finance/justifications');
          return;
        }
        
        setRequest(requestData);
      } catch (error) {
        console.error('Error fetching justification:', error);
        message.error(error.message || 'Failed to load justification details');
        navigate('/finance/justifications');
      } finally {
        setLoading(false);
      }
    };
  
    fetchJustification();
  }, [requestId, navigate]);

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      const response = await api.put(`/api/cash-requests/${requestId}/finance/justification`, {
        decision: values.decision,
        comments: values.comments
      });
      
      if (response.data.success) {
        message.success(`Justification ${values.decision === 'approve' ? 'approved and completed' : 'rejected'} successfully`);
        navigate('/finance/justifications');
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

  const showConfirmModal = () => {
    const action = decision === 'approve' ? 'approve and close' : 'reject';
    
    Modal.confirm({
      title: `Confirm Final ${decision === 'approve' ? 'Approval' : 'Rejection'}`,
      icon: decision === 'approve' ? <CheckCircleOutlined /> : <CloseCircleOutlined />,
      content: (
        <div>
          <p>Are you sure you want to {action} this justification?</p>
          {decision === 'approve' && (
            <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: '4px' }}>
              <strong>This will mark the entire cash request as COMPLETED.</strong>
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
      okText: `Yes, ${decision === 'approve' ? 'Approve & Complete' : 'Reject'}`,
      cancelText: 'Cancel',
      okButtonProps: {
        danger: decision === 'reject'
      }
    });
  };

  const downloadDocument = (doc) => {
    if (doc.url) {
      window.open(doc.url, '_blank');
    }
  };

  if (loading && !request) {
    return <div style={{ padding: '24px', textAlign: 'center' }}>Loading justification details...</div>;
  }

  if (!request) {
    return (
      <div style={{ padding: '24px' }}>
        <Alert message="Justification not found" type="error" />
      </div>
    );
  }

  const disbursedAmount = request.disbursementDetails?.amount || 0;
  const spentAmount = request.justification?.amountSpent || 0;
  const returnedAmount = request.justification?.balanceReturned || 0;
  const isBalanced = Math.abs((spentAmount + returnedAmount) - disbursedAmount) < 0.01;

  return (
    <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto' }}>
      <Card>
        <Title level={3} style={{ marginBottom: '24px' }}>
          <AuditOutlined /> Final Justification Review
        </Title>

        {/* Process Steps */}
        <Steps current={2} style={{ marginBottom: '32px' }}>
          <Step title="Request Submitted" description="Employee submitted cash request" />
          <Step title="Supervisor Approved" description="Request approved and disbursed" />
          <Step 
            title="Justification Submitted" 
            description="Employee submitted spending justification" 
          />
          <Step 
            title="Supervisor Reviewed" 
            description={`${request.justificationApproval?.supervisorDecision?.decision === 'approve' ? '✅ Approved' : '❌ Rejected'} by supervisor`}
          />
          <Step 
            title="Finance Final Review" 
            description="Awaiting your decision"
            status="process"
          />
        </Steps>

        {/* Supervisor Decision Summary */}
        <Card type="inner" title="Supervisor Review" style={{ marginBottom: '24px' }}>
          <Row gutter={16}>
            <Col span={12}>
              <Descriptions size="small" column={1}>
                <Descriptions.Item label="Supervisor">
                  {request.supervisor?.fullName}
                </Descriptions.Item>
                <Descriptions.Item label="Decision">
                  <Tag color="green" icon={<CheckCircleOutlined />}>
                    APPROVED
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Decision Date">
                  {request.justificationApproval?.supervisorDecision?.decisionDate
                    ? new Date(request.justificationApproval.supervisorDecision.decisionDate).toLocaleDateString()
                    : 'N/A'
                  }
                </Descriptions.Item>
              </Descriptions>
            </Col>
            <Col span={12}>
              <div>
                <Text strong>Supervisor Comments:</Text>
                <div style={{ 
                  marginTop: '8px', 
                  padding: '8px', 
                  backgroundColor: '#f5f5f5', 
                  borderRadius: '4px',
                  fontStyle: 'italic'
                }}>
                  {request.justificationApproval?.supervisorDecision?.comments || 'No comments provided'}
                </div>
              </div>
            </Col>
          </Row>
        </Card>

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
        <Card type="inner" title="Financial Analysis" style={{ marginBottom: '24px' }}>
          <Row gutter={16} style={{ marginBottom: '16px' }}>
            <Col span={6}>
              <Card size="small" style={{ textAlign: 'center' }}>
                <Text type="secondary">Originally Requested</Text>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#666' }}>
                  XAF {request.amountRequested?.toFixed(2)}
                </div>
              </Card>
            </Col>
            <Col span={6}>
              <Card size="small" style={{ textAlign: 'center' }}>
                <Text type="secondary">Amount Disbursed</Text>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1890ff' }}>
                  XAF {disbursedAmount.toFixed(2)}
                </div>
              </Card>
            </Col>
            <Col span={6}>
              <Card size="small" style={{ textAlign: 'center' }}>
                <Text type="secondary">Amount Spent</Text>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#ff4d4f' }}>
                  XAF {spentAmount.toFixed(2)}
                </div>
              </Card>
            </Col>
            <Col span={6}>
              <Card size="small" style={{ textAlign: 'center' }}>
                <Text type="secondary">Balance Returned</Text>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#52c41a' }}>
                  XAF {returnedAmount.toFixed(2)}
                </div>
              </Card>
            </Col>
          </Row>

          {/* Balance Check */}
          <Alert
            message={isBalanced ? 'Financial Balance Verified ✅' : 'Financial Discrepancy Detected ⚠️'}
            description={
              isBalanced 
                ? `Amount disbursed (${disbursedAmount.toFixed(2)}) = Amount spent (${spentAmount.toFixed(2)}) + Balance returned (${returnedAmount.toFixed(2)})`
                : `Mismatch: Disbursed ${disbursedAmount.toFixed(2)} ≠ Spent ${spentAmount.toFixed(2)} + Returned ${returnedAmount.toFixed(2)} = ${(spentAmount + returnedAmount).toFixed(2)}`
            }
            type={isBalanced ? 'success' : 'warning'}
            showIcon
            style={{ marginTop: '16px' }}
          />
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
          message="Finance Final Decision Required"
          description="This justification has been approved by the supervisor and requires your final decision to close the cash request."
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
                  <CheckCircleOutlined /> Approve & Complete Request
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
              <Button onClick={() => navigate('/finance/justifications')}>
                Back to Justifications
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
                {decision === 'approve' ? 'Approve & Complete' : decision === 'reject' ? 'Reject Justification' : 'Submit Decision'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default FinanceJustificationForm;