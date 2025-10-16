import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Form,
  Input,
  InputNumber,
  Button,
  Select,
  Space,
  Typography,
  Descriptions,
  Tag,
  Divider,
  Alert,
  message,
  Spin,
  Modal,
  Radio
} from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  DollarOutlined,
  ArrowLeftOutlined
} from '@ant-design/icons';
import { cashRequestAPI } from '../../services/cashRequestAPI';
import { budgetCodeAPI } from '../../services/budgetCodeAPI';

const { Title, Text } = Typography;
const { TextArea } = Input;

const FinanceCashApprovalForm = () => {
  const { requestId } = useParams();
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const [request, setRequest] = useState(null);
  const [budgetCodes, setBudgetCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [decision, setDecision] = useState(null); 

  useEffect(() => {
    fetchRequestDetails();
    fetchBudgetCodes();
  }, [requestId]);

  const fetchRequestDetails = async () => {
    try {
      const response = await cashRequestAPI.getFinanceRequests();
      
      if (response.success) {
        const req = response.data.find(r => r._id === requestId);
        
        if (req) {
          setRequest(req);
          
          // Pre-fill form with request amount
          form.setFieldsValue({
            amountApproved: req.amountRequested
          });
        } else {
          message.error('Request not found');
          navigate('/finance/cash-approvals');
        }
      }
    } catch (error) {
      console.error('Error fetching request:', error);
      message.error('Failed to load request details');
    } finally {
      setLoading(false);
    }
  };

  const fetchBudgetCodes = async () => {
    try {
      const response = await budgetCodeAPI.getBudgetCodes();
      
      if (response.success) {
        // Filter active budget codes with remaining balance
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

  const handleSubmit = async (values) => {
    if (!decision) {
      message.error('Please select Approve or Reject');
      return;
    }

    console.log('=== SUBMITTING FINANCE DECISION ===');
    console.log('Decision:', decision);
    console.log('Form Values:', values);

    Modal.confirm({
      title: `${decision === 'approve' ? 'Approve' : 'Reject'} Cash Request?`,
      content: decision === 'approve' 
        ? `You are about to approve this cash request for XAF ${values.amountApproved?.toLocaleString()}. This action cannot be undone.`
        : 'You are about to reject this cash request. This action cannot be undone.',
      okText: decision === 'approve' ? 'Yes, Approve' : 'Yes, Reject',
      okType: decision === 'approve' ? 'primary' : 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          setSubmitting(true);

          const payload = {
            decision: decision === 'approve' ? 'approved' : 'rejected',
            comments: values.comments || '',
            amountApproved: decision === 'approve' ? values.amountApproved : undefined,
            budgetCodeId: decision === 'approve' ? values.budgetCodeId : undefined,
            disbursementAmount: values.disbursementAmount || undefined
          };

          console.log('Sending payload:', payload);

          const response = await cashRequestAPI.processFinanceDecision(
            requestId,
            payload
          );

          if (response.success) {
            message.success(
              decision === 'approve' 
                ? 'Cash request approved successfully!' 
                : 'Cash request rejected'
            );
            
            setTimeout(() => {
              navigate('/finance/cash-approvals');
            }, 1500);
          } else {
            throw new Error(response.message || 'Failed to process decision');
          }

        } catch (error) {
          console.error('Error processing decision:', error);
          message.error(
            error.response?.data?.message || 
            error.message || 
            'Failed to process finance decision'
          );
        } finally {
          setSubmitting(false);
        }
      }
    });
  };

  const getStatusTag = (status) => {
    const statusMap = {
      'pending_finance': { color: 'orange', text: 'Pending Your Approval' },
      'approved': { color: 'green', text: 'Approved' },
      'disbursed': { color: 'cyan', text: 'Disbursed' },
      'denied': { color: 'red', text: 'Denied' }
    };

    const info = statusMap[status] || { color: 'default', text: status };
    return <Tag color={info.color}>{info.text}</Tag>;
  };

  if (loading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Spin size="large" />
        <div style={{ marginTop: '16px' }}>Loading request details...</div>
      </div>
    );
  }

  if (!request) {
    return (
      <div style={{ padding: '24px' }}>
        <Alert
          message="Request Not Found"
          description="The requested cash request could not be found."
          type="error"
          showIcon
        />
      </div>
    );
  }

  // Check if finance can still approve/reject
  const financeStep = request.approvalChain?.find(
    s => s.approver.email === 'ranibellmambo@gratoengineering.com'
  );

  const canProcess = financeStep && financeStep.status === 'pending';

  return (
    <div style={{ padding: '24px' }}>
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate('/finance/cash-approvals')}
        style={{ marginBottom: '16px' }}
      >
        Back to Finance Approvals
      </Button>

      <Card>
        <Title level={2}>
          <DollarOutlined /> Finance Approval - Cash Request
        </Title>

        {!canProcess && (
          <Alert
            message="Cannot Process"
            description={`This request has already been ${financeStep?.status || 'processed'} and cannot be modified.`}
            type="warning"
            showIcon
            style={{ marginBottom: '24px' }}
          />
        )}

        {/* Request Details */}
        <Divider orientation="left">Request Information</Divider>
        
        <Descriptions bordered column={2}>
          <Descriptions.Item label="Request ID">
            {request.displayId || `REQ-${requestId.slice(-6).toUpperCase()}`}
          </Descriptions.Item>
          <Descriptions.Item label="Status">
            {getStatusTag(request.status)}
          </Descriptions.Item>
          <Descriptions.Item label="Employee">
            {request.employee?.fullName || 'N/A'}
          </Descriptions.Item>
          <Descriptions.Item label="Department">
            {request.employee?.department || 'N/A'}
          </Descriptions.Item>
          <Descriptions.Item label="Request Type">
            {request.requestType?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </Descriptions.Item>
          <Descriptions.Item label="Urgency">
            <Tag color={request.urgency === 'high' ? 'red' : request.urgency === 'medium' ? 'orange' : 'green'}>
              {request.urgency?.toUpperCase()}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Amount Requested" span={2}>
            <Text strong style={{ fontSize: '18px', color: '#1890ff' }}>
              XAF {Number(request.amountRequested || 0).toLocaleString()}
            </Text>
          </Descriptions.Item>
          <Descriptions.Item label="Purpose" span={2}>
            {request.purpose}
          </Descriptions.Item>
          <Descriptions.Item label="Business Justification" span={2}>
            {request.businessJustification}
          </Descriptions.Item>
        </Descriptions>

        {/* Approval Chain */}
        <Divider orientation="left">Approval History</Divider>
        
        {request.approvalChain && request.approvalChain.length > 0 && (
          <div style={{ marginBottom: '24px' }}>
            {request.approvalChain.map((step, index) => (
              <Card
                key={index}
                size="small"
                style={{ marginBottom: '12px' }}
                type={step.status === 'approved' ? 'default' : step.status === 'pending' ? 'inner' : undefined}
              >
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Space>
                    <Text strong>Level {step.level}:</Text>
                    <Text>{step.approver.name}</Text>
                    <Tag>{step.approver.role}</Tag>
                    <Tag color={
                      step.status === 'approved' ? 'green' : 
                      step.status === 'pending' ? 'orange' : 
                      'red'
                    }>
                      {step.status === 'approved' ? <CheckCircleOutlined /> : 
                       step.status === 'pending' ? '⏳' : 
                       <CloseCircleOutlined />}
                      {' '}{step.status.toUpperCase()}
                    </Tag>
                  </Space>
                  
                  {step.comments && (
                    <Text type="secondary" italic>
                      💬 {step.comments}
                    </Text>
                  )}
                  
                  {step.actionDate && (
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {new Date(step.actionDate).toLocaleString('en-GB')}
                    </Text>
                  )}
                </Space>
              </Card>
            ))}
          </div>
        )}

        {/* Approval Form */}
        {canProcess && (
          <>
            <Divider orientation="left">Your Decision</Divider>

            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
              disabled={submitting}
            >
              {/* Decision Radio */}
              <Form.Item
                label={<Text strong style={{ fontSize: '16px' }}>Decision</Text>}
                required
              >
                <Radio.Group
                  value={decision}
                  onChange={(e) => setDecision(e.target.value)}
                  size="large"
                  buttonStyle="solid"
                >
                  <Radio.Button value="approve" style={{ marginRight: '12px' }}>
                    <CheckCircleOutlined /> Approve
                  </Radio.Button>
                  <Radio.Button value="reject">
                    <CloseCircleOutlined /> Reject
                  </Radio.Button>
                </Radio.Group>
              </Form.Item>

              {/* Approval Fields */}
              {decision === 'approve' && (
                <>
                  <Form.Item
                    name="budgetCodeId"
                    label="Budget Code"
                    rules={[{ required: true, message: 'Please select a budget code' }]}
                  >
                    <Select
                      placeholder="Select budget code"
                      showSearch
                      optionFilterProp="children"
                      size="large"
                    >
                      {budgetCodes.map(code => (
                        <Select.Option key={code._id} value={code._id}>
                          {code.code} - {code.name} (Available: XAF {code.remaining.toLocaleString()})
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>

                  <Form.Item
                    name="amountApproved"
                    label="Amount to Approve"
                    rules={[
                      { required: true, message: 'Please enter amount to approve' },
                      { type: 'number', min: 1, message: 'Amount must be greater than 0' }
                    ]}
                  >
                    <InputNumber
                      style={{ width: '100%' }}
                      placeholder="Enter amount"
                      formatter={value => `XAF ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                      parser={value => value.replace(/XAF\s?|(,*)/g, '')}
                      size="large"
                    />
                  </Form.Item>

                  <Form.Item
                    name="disbursementAmount"
                    label="Disburse Immediately (Optional)"
                    tooltip="Leave empty to approve only. Enter amount to approve and disburse in one step."
                  >
                    <InputNumber
                      style={{ width: '100%' }}
                      placeholder="Enter amount to disburse (optional)"
                      formatter={value => value ? `XAF ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : ''}
                      parser={value => value.replace(/XAF\s?|(,*)/g, '')}
                      size="large"
                    />
                  </Form.Item>
                </>
              )}

              {/* Comments */}
              <Form.Item
                name="comments"
                label="Comments"
                rules={[
                  { required: decision === 'reject', message: 'Please provide a reason for rejection' }
                ]}
              >
                <TextArea
                  rows={4}
                  placeholder={
                    decision === 'approve' 
                      ? 'Add any comments or notes (optional)' 
                      : 'Please explain why this request is being rejected'
                  }
                />
              </Form.Item>

              {/* Submit Buttons */}
              <Form.Item>
                <Space>
                  <Button
                    type="primary"
                    htmlType="submit"
                    size="large"
                    icon={decision === 'approve' ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
                    loading={submitting}
                    disabled={!decision}
                    danger={decision === 'reject'}
                  >
                    {decision === 'approve' ? 'Approve Request' : 'Reject Request'}
                  </Button>
                  
                  <Button
                    size="large"
                    onClick={() => navigate('/finance/cash-approvals')}
                    disabled={submitting}
                  >
                    Cancel
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </>
        )}
      </Card>
    </div>
  );
};

export default FinanceCashApprovalForm;