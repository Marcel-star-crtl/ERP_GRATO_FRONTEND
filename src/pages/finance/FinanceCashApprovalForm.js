import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  UserOutlined
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
  
  // Disbursement state
  const [enableDisbursement, setEnableDisbursement] = useState(false);
  const [disbursementAmount, setDisbursementAmount] = useState(0);

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
        
        // Calculate remaining balance
        const amountToApprove = reqData.amountRequested;
        const alreadyDisbursed = reqData.totalDisbursed || 0;
        const remaining = amountToApprove - alreadyDisbursed;
        
        // Set initial form values
        form.setFieldsValue({
          decision: 'approved',
          amountApproved: amountToApprove
        });
        
        // Initialize disbursement amount to remaining balance
        setDisbursementAmount(Math.max(0, remaining));
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

  // const handleSubmit = async (values) => {
  //   try {
  //     setSubmitting(true);

  //     const isReimbursement = request.requestMode === 'reimbursement';
  //     const decision = values.decision;

  //     if (decision === 'approved' && !values.budgetCodeId) {
  //       message.error('Please select a budget code for approval');
  //       return;
  //     }

  //     const payload = {
  //       decision: decision === 'approved' ? 'approved' : 'rejected',
  //       comments: values.comments || '',
  //       amountApproved: decision === 'approved' ? parseFloat(values.amountApproved) : null,
  //       budgetCodeId: decision === 'approved' ? values.budgetCodeId : null
  //     };

  //     if (decision === 'approved' && enableDisbursement && disbursementAmount > 0) {
  //       payload.disbursementAmount = parseFloat(disbursementAmount);
  //     }

  //     console.log('Submitting finance decision:', payload);

  //     const response = await cashRequestAPI.processFinanceDecision(requestId, payload);

  //     if (response.success) {
  //       const disbursementText = payload.disbursementAmount 
  //         ? ` and XAF ${payload.disbursementAmount.toLocaleString()} disbursed`
  //         : '';
        
  //       message.success({
  //         content: `${isReimbursement ? 'Reimbursement' : 'Cash request'} ${decision === 'approved' ? 'approved' : 'rejected'} successfully${disbursementText}`,
  //         duration: 5
  //       });
        
  //       setTimeout(() => {
  //         navigate('/finance/cash-approvals');
  //       }, 1500);
  //     } else {
  //       throw new Error(response.message || 'Failed to process decision');
  //     }
  //   } catch (error) {
  //     console.error('Submit error:', error);
  //     message.error(error.response?.data?.message || 'Failed to process approval');
  //   } finally {
  //     setSubmitting(false);
  //   }
  // };


  const handleSubmit = async (values) => {
    try {
      setSubmitting(true);

      const isReimbursement = request.requestMode === 'reimbursement';
      const decision = values.decision;

      // ✅ FIX: Check if this is an additional disbursement
      const isAdditionalDisbursement = 
        ['approved', 'partially_disbursed'].includes(request.status) && 
        enableDisbursement && 
        disbursementAmount > 0;

      if (isAdditionalDisbursement) {
        console.log('💰 Processing additional disbursement via dedicated endpoint');
        
        // Use processDisbursement instead of processFinanceDecision
        const response = await cashRequestAPI.processDisbursement(requestId, {
          amount: disbursementAmount,
          notes: values.comments || 'Additional disbursement by Finance'
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
        
        return; // Exit early
      }

      // ✅ ORIGINAL APPROVAL LOGIC (for pending_finance requests)
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

      if (decision === 'approved' && enableDisbursement && disbursementAmount > 0) {
        payload.disbursementAmount = parseFloat(disbursementAmount);
      }

      console.log('Submitting finance decision:', payload);

      const response = await cashRequestAPI.processFinanceDecision(requestId, payload);

      if (response.success) {
        const disbursementText = payload.disbursementAmount 
          ? ` and XAF ${payload.disbursementAmount.toLocaleString()} disbursed`
          : '';
        
        message.success({
          content: `${isReimbursement ? 'Reimbursement' : 'Cash request'} ${decision === 'approved' ? 'approved' : 'rejected'} successfully${disbursementText}`,
          duration: 5
        });
        
        setTimeout(() => {
          navigate('/finance/cash-approvals');
        }, 1500);
      } else {
        throw new Error(response.message || 'Failed to process decision');
      }
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

  // ✅ CALCULATE DISBURSEMENT INFO
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

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <Title level={3}>
          <BankOutlined /> {isReimbursement ? 'Reimbursement' : 'Cash Advance'} Approval
        </Title>

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

        {/* ✅ DISBURSEMENT STATUS CARD (NEW) */}
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

            {/* ✅ DISBURSEMENT HISTORY (NEW) */}
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
              </>
            )}

            {remainingBalance > 0 && (
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
            <Text strong style={{ color: '#1890ff', fontSize: '16px' }}>
              XAF {amountRequested.toLocaleString()}
            </Text>
          </Descriptions.Item>
          <Descriptions.Item label="Submitted Date">
            {new Date(request.createdAt).toLocaleDateString('en-GB')}
          </Descriptions.Item>
          <Descriptions.Item label="Purpose" span={2}>
            {request.purpose}
          </Descriptions.Item>
          <Descriptions.Item label="Business Justification" span={2}>
            {request.businessJustification}
          </Descriptions.Item>
        </Descriptions>

        {/* Itemized Breakdown (if exists) */}
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

        {/* Receipt Documents (for reimbursements) */}
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

        {/* Approval Chain Progress */}
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

        {/* Finance Decision Form */}
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            decision: 'approved',
            amountApproved: amountRequested
          }}
        >
          <Form.Item
            name="decision"
            label="Your Decision"
            rules={[{ required: true, message: 'Please make a decision' }]}
          >
            <Radio.Group>
              <Radio.Button value="approved" style={{ color: '#52c41a' }}>
                <CheckCircleOutlined /> Approve {isReimbursement ? 'Reimbursement' : 'Request'}
              </Radio.Button>
              <Radio.Button value="rejected" style={{ color: '#f5222d' }}>
                <CloseCircleOutlined /> Reject {isReimbursement ? 'Reimbursement' : 'Request'}
              </Radio.Button>
            </Radio.Group>
          </Form.Item>

          <Form.Item noStyle shouldUpdate={(prev, curr) => prev.decision !== curr.decision}>
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
                      onChange={(value) => {
                        if (enableDisbursement) {
                          setDisbursementAmount(Math.min(value, remainingBalance));
                        }
                      }}
                    />
                  </Form.Item>

                  <Divider />

                  {/* ✅ UPDATED DISBURSEMENT SECTION */}
                  <Card 
                    size="small" 
                    title={
                      <Space>
                        <SendOutlined />
                        <Text strong>Immediate Disbursement</Text>
                        <Tag color="orange">Optional</Tag>
                        {hasExistingDisbursements && (
                          <Tag color="blue">Additional Payment</Tag>
                        )}
                      </Space>
                    }
                    style={{ marginBottom: '24px', backgroundColor: '#f9f9f9' }}
                  >
                    <Space direction="vertical" style={{ width: '100%' }}>
                      {hasExistingDisbursements && (
                        <Alert
                          message={`XAF ${totalDisbursed.toLocaleString()} already disbursed. Remaining: XAF ${remainingBalance.toLocaleString()}`}
                          type="info"
                          showIcon
                          icon={<InfoCircleOutlined />}
                        />
                      )}

                      <Space>
                        <Button
                          type={enableDisbursement ? 'primary' : 'default'}
                          onClick={() => {
                            setEnableDisbursement(!enableDisbursement);
                            if (!enableDisbursement) {
                              setDisbursementAmount(remainingBalance);
                            }
                          }}
                        >
                          {enableDisbursement ? 'Disbursement Enabled' : 'Enable Disbursement'}
                        </Button>
                        <Tooltip title={hasExistingDisbursements 
                          ? "Add an additional payment to this partially disbursed request" 
                          : "You can approve now and disburse later, or disburse immediately"
                        }>
                          <InfoCircleOutlined style={{ color: '#1890ff' }} />
                        </Tooltip>
                      </Space>

                      {enableDisbursement && (
                        <>
                          <Alert
                            message="Immediate Disbursement"
                            description={hasExistingDisbursements 
                              ? "You are adding an additional payment. Enter the amount to disburse now." 
                              : "Funds will be disbursed immediately upon approval. You can disburse partial or full amount."
                            }
                            type="info"
                            showIcon
                          />

                          <Form.Item label="Disbursement Amount (XAF)" style={{ marginBottom: 0 }}>
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
                          </Form.Item>

                          <Row gutter={[16, 16]} style={{ marginTop: '16px' }}>
                            <Col span={8}>
                              <Statistic
                                title="Amount Requested"
                                value={amountRequested}
                                precision={0}
                                valueStyle={{ color: '#3f8600', fontSize: '14px' }}
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
                                valueStyle={{ color: remainingAfterDisbursement > 0 ? '#cf1322' : '#3f8600', fontSize: '14px' }}
                                prefix="XAF"
                              />
                            </Col>
                          </Row>

                          <Progress 
                            percent={newDisbursementProgress} 
                            status={newDisbursementProgress === 100 ? 'success' : 'active'}
                            format={(percent) => `${percent}% ${newDisbursementProgress === 100 ? '(Full)' : '(Partial)'}`}
                          />
                        </>
                      )}
                    </Space>
                  </Card>
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
                {submitting ? 'Processing...' : `${form.getFieldValue('decision') === 'approved' ? 'Approve' : 'Reject'} ${isReimbursement ? 'Reimbursement' : 'Request'}`}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default FinanceCashApprovalForm;











// import React, { useState, useEffect } from 'react';
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
//   Tooltip
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
//   EyeOutlined
// } from '@ant-design/icons';
// import { cashRequestAPI } from '../../services/cashRequestAPI';
// import { budgetCodeAPI } from '../../services/budgetCodeAPI';

// const { Title, Text, Paragraph } = Typography;
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
  
//   // Disbursement state
//   const [enableDisbursement, setEnableDisbursement] = useState(false);
//   const [disbursementAmount, setDisbursementAmount] = useState(0);

//   useEffect(() => {
//     fetchRequestDetails();
//     fetchBudgetCodes();
//   }, [requestId]);

//   const fetchRequestDetails = async () => {
//     try {
//       setLoading(true);
//       const response = await cashRequestAPI.getRequestById(requestId);
      
//       if (response.success) {
//         setRequest(response.data);
        
//         // Set initial form values
//         form.setFieldsValue({
//           decision: 'approved',
//           amountApproved: response.data.amountRequested
//         });
        
//         // Initialize disbursement amount
//         setDisbursementAmount(response.data.amountRequested);
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
//         // Filter active budget codes with remaining balance
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

//   // const fetchBudgetCodes = async () => {
//   //   try {
//   //     // Call your budget codes API
//   //     const response = await cashRequestAPI.get('/budget-codes/available');
//   //     if (response.data.success) {
//   //       setBudgetCodes(response.data.data || []);
//   //     }
//   //   } catch (error) {
//   //     console.error('Error fetching budget codes:', error);
//   //     // Non-blocking error
//   //   }
//   // };

//   const handleBudgetCodeChange = (budgetCodeId) => {
//     const budgetCode = budgetCodes.find(bc => bc._id === budgetCodeId);
//     setSelectedBudgetCode(budgetCode);
//   };

//   const handleSubmit = async (values) => {
//     try {
//       setSubmitting(true);

//       const isReimbursement = request.requestMode === 'reimbursement';
//       const decision = values.decision;

//       if (decision === 'approved' && !values.budgetCodeId) {
//         message.error('Please select a budget code for approval');
//         return;
//       }

//       // Build payload
//       const payload = {
//         decision: decision === 'approved' ? 'approved' : 'rejected',
//         comments: values.comments || '',
//         amountApproved: decision === 'approved' ? parseFloat(values.amountApproved) : null,
//         budgetCodeId: decision === 'approved' ? values.budgetCodeId : null
//       };

//       // Add disbursement if enabled
//       if (decision === 'approved' && enableDisbursement && disbursementAmount > 0) {
//         payload.disbursementAmount = parseFloat(disbursementAmount);
//       }

//       console.log('Submitting finance decision:', payload);

//       const response = await cashRequestAPI.processFinanceDecision(requestId, payload);

//       if (response.success) {
//         const disbursementText = payload.disbursementAmount 
//           ? ` and XAF ${payload.disbursementAmount.toLocaleString()} disbursed`
//           : '';
        
//         message.success({
//           content: `${isReimbursement ? 'Reimbursement' : 'Cash request'} ${decision === 'approved' ? 'approved' : 'rejected'} successfully${disbursementText}`,
//           duration: 5
//         });
        
//         setTimeout(() => {
//           navigate('/finance/cash-approvals');
//         }, 1500);
//       } else {
//         throw new Error(response.message || 'Failed to process decision');
//       }
//     } catch (error) {
//       console.error('Submit error:', error);
//       message.error(error.response?.data?.message || 'Failed to process approval');
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

//   const approvedAmount = parseFloat(form.getFieldValue('amountApproved') || request.amountRequested);
//   const remainingAfterDisbursement = approvedAmount - disbursementAmount;
//   const disbursementProgress = approvedAmount > 0 ? Math.round((disbursementAmount / approvedAmount) * 100) : 0;

//   return (
//     <div style={{ padding: '24px' }}>
//       <Card>
//         <Title level={3}>
//           <BankOutlined /> {isReimbursement ? 'Reimbursement' : 'Cash Advance'} Approval
//         </Title>

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
//               XAF {request.amountRequested.toLocaleString()}
//             </Text>
//           </Descriptions.Item>
//           <Descriptions.Item label="Submitted Date">
//             {new Date(request.createdAt).toLocaleDateString('en-GB')}
//           </Descriptions.Item>
//           <Descriptions.Item label="Purpose" span={2}>
//             {request.purpose}
//           </Descriptions.Item>
//           <Descriptions.Item label="Business Justification" span={2}>
//             {request.businessJustification}
//           </Descriptions.Item>
//         </Descriptions>

//         {/* Itemized Breakdown (if exists) */}
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

//         {/* Receipt Documents (for reimbursements) */}
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

//         {/* Finance Decision Form */}
//         <Form
//           form={form}
//           layout="vertical"
//           onFinish={handleSubmit}
//           initialValues={{
//             decision: 'approved',
//             amountApproved: request.amountRequested
//           }}
//         >
//           <Form.Item
//             name="decision"
//             label="Your Decision"
//             rules={[{ required: true, message: 'Please make a decision' }]}
//           >
//             <Radio.Group>
//               <Radio.Button value="approved" style={{ color: '#52c41a' }}>
//                 <CheckCircleOutlined /> Approve {isReimbursement ? 'Reimbursement' : 'Request'}
//               </Radio.Button>
//               <Radio.Button value="rejected" style={{ color: '#f5222d' }}>
//                 <CloseCircleOutlined /> Reject {isReimbursement ? 'Reimbursement' : 'Request'}
//               </Radio.Button>
//             </Radio.Group>
//           </Form.Item>

//           <Form.Item noStyle shouldUpdate={(prev, curr) => prev.decision !== curr.decision}>
//             {({ getFieldValue }) =>
//               getFieldValue('decision') === 'approved' ? (
//                 <>
//                   <Form.Item
//                     name="budgetCodeId"
//                     label={
//                       <Space>
//                         <span>Budget Code</span>
//                         <Tag color="red">Required</Tag>
//                       </Space>
//                     }
//                     rules={[{ required: true, message: 'Budget code is required for approval' }]}
//                   >
//                     <Select
//                       placeholder="Select budget code"
//                       showSearch
//                       filterOption={(input, option) =>
//                         option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
//                       }
//                       onChange={handleBudgetCodeChange}
//                     >
//                       {budgetCodes.map(bc => (
//                         <Option key={bc._id} value={bc._id}>
//                           {bc.code} - {bc.name} (Available: XAF {bc.remaining.toLocaleString()})
//                         </Option>
//                       ))}
//                     </Select>
//                   </Form.Item>

//                   {selectedBudgetCode && (
//                     <Alert
//                       message="Budget Code Information"
//                       description={
//                         <div>
//                           <Text>Budget: XAF {selectedBudgetCode.budget.toLocaleString()}</Text>
//                           <br />
//                           <Text>Used: XAF {selectedBudgetCode.used.toLocaleString()}</Text>
//                           <br />
//                           <Text strong>Available: XAF {selectedBudgetCode.remaining.toLocaleString()}</Text>
//                         </div>
//                       }
//                       type="info"
//                       showIcon
//                       style={{ marginBottom: '16px' }}
//                     />
//                   )}

//                   <Form.Item
//                     name="amountApproved"
//                     label="Amount to Approve (XAF)"
//                     rules={[{ required: true, message: 'Please enter amount to approve' }]}
//                   >
//                     <InputNumber
//                       style={{ width: '100%' }}
//                       min={0}
//                       max={request.amountRequested}
//                       step={1000}
//                       formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
//                       parser={(value) => value.replace(/,/g, '')}
//                       onChange={(value) => {
//                         if (enableDisbursement) {
//                           setDisbursementAmount(value);
//                         }
//                       }}
//                     />
//                   </Form.Item>

//                   <Divider />

//                   {/* Disbursement Section */}
//                   <Card 
//                     size="small" 
//                     title={
//                       <Space>
//                         <SendOutlined />
//                         <Text strong>Immediate Disbursement</Text>
//                         <Tag color="orange">Optional</Tag>
//                       </Space>
//                     }
//                     style={{ marginBottom: '24px', backgroundColor: '#f9f9f9' }}
//                   >
//                     <Space direction="vertical" style={{ width: '100%' }}>
//                       <Space>
//                         <Button
//                           type={enableDisbursement ? 'primary' : 'default'}
//                           onClick={() => {
//                             setEnableDisbursement(!enableDisbursement);
//                             if (!enableDisbursement) {
//                               setDisbursementAmount(approvedAmount);
//                             }
//                           }}
//                         >
//                           {enableDisbursement ? 'Disbursement Enabled' : 'Enable Disbursement'}
//                         </Button>
//                         <Tooltip title="You can approve now and disburse later, or disburse immediately">
//                           <InfoCircleOutlined style={{ color: '#1890ff' }} />
//                         </Tooltip>
//                       </Space>

//                       {enableDisbursement && (
//                         <>
//                           <Alert
//                             message="Immediate Disbursement"
//                             description="Funds will be disbursed immediately upon approval. You can disburse partial or full amount."
//                             type="info"
//                             showIcon
//                           />

//                           <Form.Item label="Disbursement Amount (XAF)" style={{ marginBottom: 0 }}>
//                             <InputNumber
//                               style={{ width: '100%' }}
//                               min={0}
//                               max={approvedAmount}
//                               step={1000}
//                               value={disbursementAmount}
//                               onChange={setDisbursementAmount}
//                               formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
//                               parser={(value) => value.replace(/,/g, '')}
//                             />
//                           </Form.Item>

//                           <Row gutter={[16, 16]} style={{ marginTop: '16px' }}>
//                             <Col span={8}>
//                               <Statistic
//                                 title="Approved Amount"
//                                 value={approvedAmount}
//                                 precision={0}
//                                 valueStyle={{ color: '#3f8600' }}
//                                 prefix="XAF"
//                               />
//                             </Col>
//                             <Col span={8}>
//                               <Statistic
//                                 title="Disbursing Now"
//                                 value={disbursementAmount}
//                                 precision={0}
//                                 valueStyle={{ color: '#1890ff' }}
//                                 prefix="XAF"
//                               />
//                             </Col>
//                             <Col span={8}>
//                               <Statistic
//                                 title="Remaining"
//                                 value={remainingAfterDisbursement}
//                                 precision={0}
//                                 valueStyle={{ color: remainingAfterDisbursement > 0 ? '#cf1322' : '#3f8600' }}
//                                 prefix="XAF"
//                               />
//                             </Col>
//                           </Row>

//                           <Progress 
//                             percent={disbursementProgress} 
//                             status={disbursementProgress === 100 ? 'success' : 'active'}
//                             format={(percent) => `${percent}% ${disbursementProgress === 100 ? '(Full)' : '(Partial)'}`}
//                           />
//                         </>
//                       )}
//                     </Space>
//                   </Card>
//                 </>
//               ) : null
//             }
//           </Form.Item>

//           <Form.Item
//             name="comments"
//             label="Comments"
//             rules={[{ required: true, message: 'Please provide comments for your decision' }]}
//           >
//             <TextArea
//               rows={4}
//               placeholder="Explain your decision (required for audit trail)..."
//               showCount
//               maxLength={500}
//             />
//           </Form.Item>

//           <Form.Item>
//             <Space>
//               <Button onClick={() => navigate('/finance/cash-approvals')}>
//                 Cancel
//               </Button>
//               <Button
//                 type="primary"
//                 htmlType="submit"
//                 loading={submitting}
//                 icon={form.getFieldValue('decision') === 'approved' ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
//               >
//                 {submitting ? 'Processing...' : `${form.getFieldValue('decision') === 'approved' ? 'Approve' : 'Reject'} ${isReimbursement ? 'Reimbursement' : 'Request'}`}
//               </Button>
//             </Space>
//           </Form.Item>
//         </Form>
//       </Card>
//     </div>
//   );
// };

// export default FinanceCashApprovalForm;









// import React, { useState, useEffect } from 'react';
// import { useParams, useNavigate } from 'react-router-dom';
// import {
//   Card,
//   Form,
//   Input,
//   InputNumber,
//   Button,
//   Select,
//   Space,
//   Typography,
//   Descriptions,
//   Tag,
//   Divider,
//   Alert,
//   message,
//   Spin,
//   Modal,
//   Radio,
//   Row,
//   Col
// } from 'antd';
// import {
//   CheckCircleOutlined,
//   CloseCircleOutlined,
//   DollarOutlined,
//   ArrowLeftOutlined,
//   BankOutlined,
//   InfoCircleOutlined
// } from '@ant-design/icons';
// import { cashRequestAPI } from '../../services/cashRequestAPI';
// import { budgetCodeAPI } from '../../services/budgetCodeAPI';

// const { Title, Text } = Typography;
// const { TextArea } = Input;

// const FinanceCashApprovalForm = () => {
//   const { requestId } = useParams();
//   const navigate = useNavigate();
//   const [form] = Form.useForm();

//   const [request, setRequest] = useState(null);
//   const [budgetCodes, setBudgetCodes] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [submitting, setSubmitting] = useState(false);
//   const [decision, setDecision] = useState(null);
//   const [selectedBudgetCode, setSelectedBudgetCode] = useState(null);

//   useEffect(() => {
//     fetchRequestDetails();
//     fetchBudgetCodes();
//   }, [requestId]);

//   const fetchRequestDetails = async () => {
//     try {
//       const response = await cashRequestAPI.getFinanceRequests();
      
//       if (response.success) {
//         const req = response.data.find(r => r._id === requestId);
        
//         if (req) {
//           setRequest(req);
          
//           // Pre-fill form with request amount
//           form.setFieldsValue({
//             amountApproved: req.amountRequested
//           });

//           // If budget already allocated, select it
//           if (req.budgetAllocation && req.budgetAllocation.budgetCodeId) {
//             form.setFieldsValue({
//               budgetCodeId: req.budgetAllocation.budgetCodeId
//             });
            
//             // Find and set the selected budget code for display
//             const existingBudgetCode = await budgetCodeAPI.getBudgetCodeById(req.budgetAllocation.budgetCodeId);
//             if (existingBudgetCode.success) {
//               setSelectedBudgetCode(existingBudgetCode.data);
//             }
//           }
//         } else {
//           message.error('Request not found');
//           navigate('/finance/cash-approvals');
//         }
//       }
//     } catch (error) {
//       console.error('Error fetching request:', error);
//       message.error('Failed to load request details');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const fetchBudgetCodes = async () => {
//     try {
//       const response = await budgetCodeAPI.getBudgetCodes();
      
//       if (response.success) {
//         // Filter active budget codes with remaining balance
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
//     const selected = budgetCodes.find(code => code._id === budgetCodeId);
//     setSelectedBudgetCode(selected);
//   };

//   const handleSubmit = async (values) => {
//     if (!decision) {
//       message.error('Please select Approve or Reject');
//       return;
//     }

//     console.log('=== SUBMITTING FINANCE DECISION ===');
//     console.log('Decision:', decision);
//     console.log('Form Values:', values);

//     Modal.confirm({
//       title: `${decision === 'approve' ? 'Approve' : 'Reject'} Cash Request?`,
//       content: decision === 'approve' 
//         ? (
//             <div>
//               <p>You are about to approve this cash request for XAF {values.amountApproved?.toLocaleString()}.</p>
//               {selectedBudgetCode && (
//                 <div style={{ marginTop: '12px', padding: '10px', backgroundColor: '#f0f5ff', borderRadius: '4px' }}>
//                   <strong>Budget Impact:</strong>
//                   <div style={{ marginTop: '4px', fontSize: '12px' }}>
//                     • Budget Code: {selectedBudgetCode.code}
//                     <br />
//                     • Current Available: XAF {selectedBudgetCode.remaining?.toLocaleString()}
//                     <br />
//                     • After Approval: XAF {(selectedBudgetCode.remaining - values.amountApproved)?.toLocaleString()}
//                   </div>
//                 </div>
//               )}
//               <p style={{ marginTop: '12px', color: '#ff4d4f', fontWeight: 'bold' }}>
//                 This action cannot be undone.
//               </p>
//             </div>
//           )
//         : 'You are about to reject this cash request. This action cannot be undone.',
//       okText: decision === 'approve' ? 'Yes, Approve' : 'Yes, Reject',
//       okType: decision === 'approve' ? 'primary' : 'danger',
//       cancelText: 'Cancel',
//       onOk: async () => {
//         try {
//           setSubmitting(true);

//           const finalAmountApproved = decision === 'approve' ? values.amountApproved : undefined;
//           const finalDisbursementAmount = decision === 'approve'
//             ? (values.disbursementAmount || values.amountApproved)
//             : undefined;

//           const payload = {
//             decision: decision === 'approve' ? 'approved' : 'rejected',
//             comments: values.comments || '',
//             amountApproved: finalAmountApproved,
//             budgetCodeId: decision === 'approve' ? values.budgetCodeId : undefined,
//             disbursementAmount: finalDisbursementAmount
//           };

//           console.log('Sending payload:', payload);

//           const response = await cashRequestAPI.processFinanceDecision(
//             requestId,
//             payload
//           );

//           if (response.success) {
//             // Enhanced success message with budget info
//             if (decision === 'approve' && response.data.budgetAllocation) {
//               const budgetInfo = response.data.budgetAllocation;
//               message.success({
//                 content: (
//                   <div>
//                     <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
//                       ✅ Cash request {budgetInfo.status === 'disbursed' ? 'approved and disbursed' : 'approved'}!
//                     </div>
//                     <div style={{ fontSize: '12px' }}>
//                       💰 Budget {budgetInfo.status === 'disbursed' ? 'disbursed' : 'reserved'} from {budgetInfo.budgetCode}
//                     </div>
//                     <div style={{ fontSize: '12px' }}>
//                       📊 Remaining: XAF {budgetInfo.remainingBudget?.toLocaleString()}
//                     </div>
//                   </div>
//                 ),
//                 duration: 5
//               });
//             } else {
//               message.success(
//                 decision === 'approve' 
//                   ? 'Cash request approved successfully!' 
//                   : 'Cash request rejected'
//               );
//             }
            
//             setTimeout(() => {
//               navigate('/finance/cash-approvals');
//             }, 1500);
//           } else {
//             throw new Error(response.message || 'Failed to process decision');
//           }

//         } catch (error) {
//           console.error('Error processing decision:', error);
//           message.error(
//             error.response?.data?.message || 
//             error.message || 
//             'Failed to process finance decision'
//           );
//         } finally {
//           setSubmitting(false);
//         }
//       }
//     });
//   };

//   const getStatusTag = (status) => {
//     const statusMap = {
//       'pending_finance': { color: 'orange', text: 'Pending Your Approval' },
//       'approved': { color: 'green', text: 'Approved' },
//       'disbursed': { color: 'cyan', text: 'Disbursed' },
//       'denied': { color: 'red', text: 'Denied' }
//     };

//     const info = statusMap[status] || { color: 'default', text: status };
//     return <Tag color={info.color}>{info.text}</Tag>;
//   };

//   const getAllocationStatusTag = (status) => {
//     const statusMap = {
//       'allocated': { color: 'orange', text: 'Reserved', icon: '🔒' },
//       'spent': { color: 'red', text: 'Disbursed', icon: '💸' },
//       'released': { color: 'blue', text: 'Released', icon: '🔓' },
//       'pending': { color: 'gold', text: 'Pending', icon: '⏳' }
//     };

//     const info = statusMap[status] || { color: 'default', text: status, icon: '❓' };
//     return (
//       <Tag color={info.color}>
//         {info.icon} {info.text}
//       </Tag>
//     );
//   };

//   if (loading) {
//     return (
//       <div style={{ padding: '24px', textAlign: 'center' }}>
//         <Spin size="large" />
//         <div style={{ marginTop: '16px' }}>Loading request details...</div>
//       </div>
//     );
//   }

//   if (!request) {
//     return (
//       <div style={{ padding: '24px' }}>
//         <Alert
//           message="Request Not Found"
//           description="The requested cash request could not be found."
//           type="error"
//           showIcon
//         />
//       </div>
//     );
//   }

//   // Check if finance can still approve/reject
//   const financeStep = request.approvalChain?.find(
//     s => s.approver.email === 'ranibellmambo@gratoengineering.com'
//   );

//   const canProcess = financeStep && financeStep.status === 'pending';

//   return (
//     <div style={{ padding: '24px' }}>
//       <Button
//         icon={<ArrowLeftOutlined />}
//         onClick={() => navigate('/finance/cash-approvals')}
//         style={{ marginBottom: '16px' }}
//       >
//         Back to Finance Approvals
//       </Button>

//       <Card>
//         <Title level={2}>
//           <DollarOutlined /> Finance Approval - Cash Request
//         </Title>

//         {!canProcess && (
//           <Alert
//             message="Cannot Process"
//             description={`This request has already been ${financeStep?.status || 'processed'} and cannot be modified.`}
//             type="warning"
//             showIcon
//             style={{ marginBottom: '24px' }}
//           />
//         )}

//         {/* ============================================ */}
//         {/* NEW: BUDGET STATUS CARD */}
//         {/* ============================================ */}
//         {request.budgetAllocation && request.budgetAllocation.budgetCodeId && (
//           <>
//             <Divider orientation="left">
//               <BankOutlined /> Current Budget Allocation
//             </Divider>
            
//             <Card 
//               type="inner" 
//               style={{ 
//                 marginBottom: '24px',
//                 backgroundColor: request.budgetAllocation.allocationStatus === 'spent' ? '#fff7e6' : '#f0f5ff',
//                 borderLeft: `4px solid ${
//                   request.budgetAllocation.allocationStatus === 'spent' ? '#fa8c16' : 
//                   request.budgetAllocation.allocationStatus === 'allocated' ? '#1890ff' : 
//                   '#52c41a'
//                 }`
//               }}
//             >
//               <Row gutter={16}>
//                 <Col span={12}>
//                   <Descriptions bordered size="small" column={1}>
//                     <Descriptions.Item label="Budget Code">
//                       <Tag color="blue" style={{ fontSize: '14px' }}>
//                         {request.budgetAllocation.budgetCode}
//                       </Tag>
//                     </Descriptions.Item>
//                     <Descriptions.Item label="Allocated Amount">
//                       <Text strong style={{ fontSize: '16px', color: '#1890ff' }}>
//                         XAF {request.budgetAllocation.allocatedAmount?.toLocaleString()}
//                       </Text>
//                     </Descriptions.Item>
//                     <Descriptions.Item label="Allocation Status">
//                       {getAllocationStatusTag(request.budgetAllocation.allocationStatus)}
//                     </Descriptions.Item>
//                   </Descriptions>
//                 </Col>
//                 <Col span={12}>
//                   <Descriptions bordered size="small" column={1}>
//                     {request.budgetAllocation.actualSpent > 0 && (
//                       <Descriptions.Item label="Actually Spent">
//                         <Text type="danger" strong>
//                           XAF {request.budgetAllocation.actualSpent?.toLocaleString()}
//                         </Text>
//                       </Descriptions.Item>
//                     )}
//                     {request.budgetAllocation.balanceReturned > 0 && (
//                       <Descriptions.Item label="Balance Returned">
//                         <Text type="success" strong>
//                           XAF {request.budgetAllocation.balanceReturned?.toLocaleString()}
//                         </Text>
//                       </Descriptions.Item>
//                     )}
//                     <Descriptions.Item label="Assigned By">
//                       <Text type="secondary">
//                         {request.budgetAllocation.assignedBy?.fullName || 'System'}
//                       </Text>
//                     </Descriptions.Item>
//                     <Descriptions.Item label="Assigned Date">
//                       <Text type="secondary">
//                         {request.budgetAllocation.assignedAt 
//                           ? new Date(request.budgetAllocation.assignedAt).toLocaleDateString('en-GB')
//                           : 'N/A'
//                         }
//                       </Text>
//                     </Descriptions.Item>
//                   </Descriptions>
//                 </Col>
//               </Row>

//               {/* Budget Impact Explanation */}
//               <Alert
//                 style={{ marginTop: '12px' }}
//                 message={
//                   request.budgetAllocation.allocationStatus === 'spent' 
//                     ? '💸 Budget Disbursed' 
//                     : request.budgetAllocation.allocationStatus === 'allocated'
//                     ? '🔒 Budget Reserved'
//                     : 'ℹ️ Budget Status'
//                 }
//                 description={
//                   request.budgetAllocation.allocationStatus === 'spent' 
//                     ? `This budget has been disbursed. Funds have been deducted from ${request.budgetAllocation.budgetCode}.` 
//                     : request.budgetAllocation.allocationStatus === 'allocated'
//                     ? `This budget is reserved but not yet disbursed. Funds will be deducted when you disburse the cash.`
//                     : `Budget allocation status: ${request.budgetAllocation.allocationStatus}`
//                 }
//                 type={
//                   request.budgetAllocation.allocationStatus === 'spent' ? 'warning' :
//                   request.budgetAllocation.allocationStatus === 'allocated' ? 'info' :
//                   'default'
//                 }
//                 showIcon
//                 icon={<InfoCircleOutlined />}
//               />
//             </Card>
//           </>
//         )}

//         {/* Request Details */}
//         <Divider orientation="left">Request Information</Divider>
        
//         <Descriptions bordered column={2}>
//           <Descriptions.Item label="Request ID">
//             {request.displayId || `REQ-${requestId.slice(-6).toUpperCase()}`}
//           </Descriptions.Item>
//           <Descriptions.Item label="Status">
//             {getStatusTag(request.status)}
//           </Descriptions.Item>
//           <Descriptions.Item label="Employee">
//             {request.employee?.fullName || 'N/A'}
//           </Descriptions.Item>
//           <Descriptions.Item label="Department">
//             {request.employee?.department || 'N/A'}
//           </Descriptions.Item>
//           <Descriptions.Item label="Request Type">
//             {request.requestType?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
//           </Descriptions.Item>
//           <Descriptions.Item label="Urgency">
//             <Tag color={request.urgency === 'high' ? 'red' : request.urgency === 'medium' ? 'orange' : 'green'}>
//               {request.urgency?.toUpperCase()}
//             </Tag>
//           </Descriptions.Item>
//           <Descriptions.Item label="Amount Requested" span={2}>
//             <Text strong style={{ fontSize: '18px', color: '#1890ff' }}>
//               XAF {Number(request.amountRequested || 0).toLocaleString()}
//             </Text>
//           </Descriptions.Item>
//           <Descriptions.Item label="Purpose" span={2}>
//             {request.purpose}
//           </Descriptions.Item>
//           <Descriptions.Item label="Business Justification" span={2}>
//             {request.businessJustification}
//           </Descriptions.Item>
//         </Descriptions>

//         {/* Approval Chain */}
//         <Divider orientation="left">Approval History</Divider>
        
//         {request.approvalChain && request.approvalChain.length > 0 && (
//           <div style={{ marginBottom: '24px' }}>
//             {request.approvalChain.map((step, index) => (
//               <Card
//                 key={index}
//                 size="small"
//                 style={{ marginBottom: '12px' }}
//                 type={step.status === 'approved' ? 'default' : step.status === 'pending' ? 'inner' : undefined}
//               >
//                 <Space direction="vertical" style={{ width: '100%' }}>
//                   <Space>
//                     <Text strong>Level {step.level}:</Text>
//                     <Text>{step.approver.name}</Text>
//                     <Tag>{step.approver.role}</Tag>
//                     <Tag color={
//                       step.status === 'approved' ? 'green' : 
//                       step.status === 'pending' ? 'orange' : 
//                       'red'
//                     }>
//                       {step.status === 'approved' ? <CheckCircleOutlined /> : 
//                        step.status === 'pending' ? '⏳' : 
//                        <CloseCircleOutlined />}
//                       {' '}{step.status.toUpperCase()}
//                     </Tag>
//                   </Space>
                  
//                   {step.comments && (
//                     <Text type="secondary" italic>
//                       💬 {step.comments}
//                     </Text>
//                   )}
                  
//                   {step.actionDate && (
//                     <Text type="secondary" style={{ fontSize: '12px' }}>
//                       {new Date(step.actionDate).toLocaleString('en-GB')}
//                     </Text>
//                   )}
//                 </Space>
//               </Card>
//             ))}
//           </div>
//         )}

//         {/* Approval Form */}
//         {canProcess && (
//           <>
//             <Divider orientation="left">Your Decision</Divider>

//             <Form
//               form={form}
//               layout="vertical"
//               onFinish={handleSubmit}
//               disabled={submitting}
//             >
//               {/* Decision Radio */}
//               <Form.Item
//                 label={<Text strong style={{ fontSize: '16px' }}>Decision</Text>}
//                 required
//               >
//                 <Radio.Group
//                   value={decision}
//                   onChange={(e) => setDecision(e.target.value)}
//                   size="large"
//                   buttonStyle="solid"
//                 >
//                   <Radio.Button value="approve" style={{ marginRight: '12px' }}>
//                     <CheckCircleOutlined /> Approve
//                   </Radio.Button>
//                   <Radio.Button value="reject">
//                     <CloseCircleOutlined /> Reject
//                   </Radio.Button>
//                 </Radio.Group>
//               </Form.Item>

//               {/* Approval Fields */}
//               {decision === 'approve' && (
//                 <>
//                   <Form.Item
//                     name="budgetCodeId"
//                     label="Budget Code"
//                     rules={[{ required: true, message: 'Please select a budget code' }]}
//                   >
//                     <Select
//                       placeholder="Select budget code"
//                       showSearch
//                       optionFilterProp="children"
//                       size="large"
//                       onChange={handleBudgetCodeChange}
//                     >
//                       {budgetCodes.map(code => (
//                         <Select.Option key={code._id} value={code._id}>
//                           {code.code} - {code.name} (Available: XAF {code.remaining.toLocaleString()})
//                         </Select.Option>
//                       ))}
//                     </Select>
//                   </Form.Item>

//                   {/* Budget Preview Card */}
//                   {selectedBudgetCode && (
//                     <Card 
//                       size="small" 
//                       style={{ 
//                         marginBottom: '16px', 
//                         backgroundColor: '#f0f5ff',
//                         borderLeft: '4px solid #1890ff'
//                       }}
//                     >
//                       <Row gutter={16}>
//                         <Col span={8}>
//                           <Text type="secondary" style={{ fontSize: '12px' }}>
//                             Current Available
//                           </Text>
//                           <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#52c41a' }}>
//                             XAF {selectedBudgetCode.remaining?.toLocaleString()}
//                           </div>
//                         </Col>
//                         <Col span={8}>
//                           <Text type="secondary" style={{ fontSize: '12px' }}>
//                             To Reserve/Disburse
//                           </Text>
//                           <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#1890ff' }}>
//                             XAF {form.getFieldValue('amountApproved')?.toLocaleString() || '0'}
//                           </div>
//                         </Col>
//                         <Col span={8}>
//                           <Text type="secondary" style={{ fontSize: '12px' }}>
//                             After Transaction
//                           </Text>
//                           <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#fa8c16' }}>
//                             XAF {(selectedBudgetCode.remaining - (form.getFieldValue('amountApproved') || 0))?.toLocaleString()}
//                           </div>
//                         </Col>
//                       </Row>
//                     </Card>
//                   )}

//                   <Form.Item
//                     name="amountApproved"
//                     label="Amount to Approve"
//                     rules={[
//                       { required: true, message: 'Please enter amount to approve' },
//                       { type: 'number', min: 1, message: 'Amount must be greater than 0' },
//                       {
//                         validator: (_, value) => {
//                           if (selectedBudgetCode && value > selectedBudgetCode.remaining) {
//                             return Promise.reject(
//                               new Error(`Amount exceeds available budget (XAF ${selectedBudgetCode.remaining.toLocaleString()})`)
//                             );
//                           }
//                           return Promise.resolve();
//                         }
//                       }
//                     ]}
//                   >
//                     <InputNumber
//                       style={{ width: '100%' }}
//                       placeholder="Enter amount"
//                       formatter={value => `XAF ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
//                       parser={value => value.replace(/XAF\s?|(,*)/g, '')}
//                       size="large"
//                       onChange={() => {
//                         // Trigger re-render of budget preview card
//                         setSelectedBudgetCode({...selectedBudgetCode});
//                       }}
//                     />
//                   </Form.Item>

//                   <Form.Item
//                     name="disbursementAmount"
//                     label={
//                       <span>
//                         Disburse Immediately (Optional)
//                         <Text type="secondary" style={{ fontSize: '12px', marginLeft: '8px' }}>
//                           💡 Leave empty to reserve only
//                         </Text>
//                       </span>
//                     }
//                     tooltip="Leave empty to approve only (reserves budget). Enter amount to approve and disburse in one step (deducts budget)."
//                   >
//                     <InputNumber
//                       style={{ width: '100%' }}
//                       placeholder="Enter amount to disburse (optional)"
//                       formatter={value => value ? `XAF ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : ''}
//                       parser={value => value.replace(/XAF\s?|(,*)/g, '')}
//                       size="large"
//                     />
//                   </Form.Item>

//                   <Alert
//                     message="Budget Allocation Workflow"
//                     description={
//                       <div style={{ fontSize: '12px' }}>
//                         <div style={{ marginBottom: '8px' }}>
//                           <strong>🔒 Reserve Only (No Disbursement):</strong>
//                           <ul style={{ marginTop: '4px', paddingLeft: '20px' }}>
//                             <li>Budget will be <strong>reserved</strong> but not deducted</li>
//                             <li>Request status becomes "Approved - Awaiting Disbursement"</li>
//                             <li>Budget remains available for other allocations</li>
//                           </ul>
//                         </div>
//                         <div>
//                           <strong>💸 Reserve & Disburse (Immediate):</strong>
//                           <ul style={{ marginTop: '4px', paddingLeft: '20px' }}>
//                             <li>Budget will be <strong>reserved and immediately deducted</strong></li>
//                             <li>Request status becomes "Disbursed - Awaiting Justification"</li>
//                             <li>Budget is removed from available pool</li>
//                           </ul>
//                         </div>
//                       </div>
//                     }
//                     type="info"
//                     showIcon
//                     icon={<InfoCircleOutlined />}
//                     style={{ marginBottom: '16px' }}
//                   />
//                 </>
//               )}

//               {/* Comments */}
//               <Form.Item
//                 name="comments"
//                 label="Comments"
//                 rules={[
//                   { required: decision === 'reject', message: 'Please provide a reason for rejection' }
//                 ]}
//               >
//                 <TextArea
//                   rows={4}
//                   placeholder={
//                     decision === 'approve' 
//                       ? 'Add any comments or notes (optional)' 
//                       : 'Please explain why this request is being rejected'
//                   }
//                 />
//               </Form.Item>

//               {/* Submit Buttons */}
//               <Form.Item>
//                 <Space>
//                   <Button
//                     type="primary"
//                     htmlType="submit"
//                     size="large"
//                     icon={decision === 'approve' ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
//                     loading={submitting}
//                     disabled={!decision}
//                     danger={decision === 'reject'}
//                   >
//                     {decision === 'approve' ? 'Approve Request' : 'Reject Request'}
//                   </Button>
                  
//                   <Button
//                     size="large"
//                     onClick={() => navigate('/finance/cash-approvals')}
//                     disabled={submitting}
//                   >
//                     Cancel
//                   </Button>
//                 </Space>
//               </Form.Item>
//             </Form>
//           </>
//         )}
//       </Card>
//     </div>
//   );
// };

// export default FinanceCashApprovalForm;






// import React, { useState, useEffect } from 'react';
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
//   Tooltip
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
//   EyeOutlined
// } from '@ant-design/icons';
// import { cashRequestAPI } from '../../services/cashRequestAPI';
// import { budgetCodeAPI } from '../../services/budgetCodeAPI';

// const { Title, Text, Paragraph } = Typography;
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
  
//   // Disbursement state
//   const [enableDisbursement, setEnableDisbursement] = useState(false);
//   const [disbursementAmount, setDisbursementAmount] = useState(0);

//   useEffect(() => {
//     fetchRequestDetails();
//     fetchBudgetCodes();
//   }, [requestId]);

//   const fetchRequestDetails = async () => {
//     try {
//       setLoading(true);
//       const response = await cashRequestAPI.getRequestById(requestId);
      
//       if (response.success) {
//         setRequest(response.data);
        
//         // Set initial form values
//         form.setFieldsValue({
//           decision: 'approved',
//           amountApproved: response.data.amountRequested
//         });
        
//         // Initialize disbursement amount
//         setDisbursementAmount(response.data.amountRequested);
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
//         // Filter active budget codes with remaining balance
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

//   // const fetchBudgetCodes = async () => {
//   //   try {
//   //     // Call your budget codes API
//   //     const response = await cashRequestAPI.get('/budget-codes/available');
//   //     if (response.data.success) {
//   //       setBudgetCodes(response.data.data || []);
//   //     }
//   //   } catch (error) {
//   //     console.error('Error fetching budget codes:', error);
//   //     // Non-blocking error
//   //   }
//   // };

//   const handleBudgetCodeChange = (budgetCodeId) => {
//     const budgetCode = budgetCodes.find(bc => bc._id === budgetCodeId);
//     setSelectedBudgetCode(budgetCode);
//   };

//   const handleSubmit = async (values) => {
//     try {
//       setSubmitting(true);

//       const isReimbursement = request.requestMode === 'reimbursement';
//       const decision = values.decision;

//       if (decision === 'approved' && !values.budgetCodeId) {
//         message.error('Please select a budget code for approval');
//         return;
//       }

//       // Build payload
//       const payload = {
//         decision: decision === 'approved' ? 'approved' : 'rejected',
//         comments: values.comments || '',
//         amountApproved: decision === 'approved' ? parseFloat(values.amountApproved) : null,
//         budgetCodeId: decision === 'approved' ? values.budgetCodeId : null
//       };

//       // Add disbursement if enabled
//       if (decision === 'approved' && enableDisbursement && disbursementAmount > 0) {
//         payload.disbursementAmount = parseFloat(disbursementAmount);
//       }

//       console.log('Submitting finance decision:', payload);

//       const response = await cashRequestAPI.processFinanceDecision(requestId, payload);

//       if (response.success) {
//         const disbursementText = payload.disbursementAmount 
//           ? ` and XAF ${payload.disbursementAmount.toLocaleString()} disbursed`
//           : '';
        
//         message.success({
//           content: `${isReimbursement ? 'Reimbursement' : 'Cash request'} ${decision === 'approved' ? 'approved' : 'rejected'} successfully${disbursementText}`,
//           duration: 5
//         });
        
//         setTimeout(() => {
//           navigate('/finance/cash-approvals');
//         }, 1500);
//       } else {
//         throw new Error(response.message || 'Failed to process decision');
//       }
//     } catch (error) {
//       console.error('Submit error:', error);
//       message.error(error.response?.data?.message || 'Failed to process approval');
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

//   const approvedAmount = parseFloat(form.getFieldValue('amountApproved') || request.amountRequested);
//   const remainingAfterDisbursement = approvedAmount - disbursementAmount;
//   const disbursementProgress = approvedAmount > 0 ? Math.round((disbursementAmount / approvedAmount) * 100) : 0;

//   return (
//     <div style={{ padding: '24px' }}>
//       <Card>
//         <Title level={3}>
//           <BankOutlined /> {isReimbursement ? 'Reimbursement' : 'Cash Advance'} Approval
//         </Title>

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
//               XAF {request.amountRequested.toLocaleString()}
//             </Text>
//           </Descriptions.Item>
//           <Descriptions.Item label="Submitted Date">
//             {new Date(request.createdAt).toLocaleDateString('en-GB')}
//           </Descriptions.Item>
//           <Descriptions.Item label="Purpose" span={2}>
//             {request.purpose}
//           </Descriptions.Item>
//           <Descriptions.Item label="Business Justification" span={2}>
//             {request.businessJustification}
//           </Descriptions.Item>
//         </Descriptions>

//         {/* Itemized Breakdown (if exists) */}
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

//         {/* Receipt Documents (for reimbursements) */}
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

//         {/* Finance Decision Form */}
//         <Form
//           form={form}
//           layout="vertical"
//           onFinish={handleSubmit}
//           initialValues={{
//             decision: 'approved',
//             amountApproved: request.amountRequested
//           }}
//         >
//           <Form.Item
//             name="decision"
//             label="Your Decision"
//             rules={[{ required: true, message: 'Please make a decision' }]}
//           >
//             <Radio.Group>
//               <Radio.Button value="approved" style={{ color: '#52c41a' }}>
//                 <CheckCircleOutlined /> Approve {isReimbursement ? 'Reimbursement' : 'Request'}
//               </Radio.Button>
//               <Radio.Button value="rejected" style={{ color: '#f5222d' }}>
//                 <CloseCircleOutlined /> Reject {isReimbursement ? 'Reimbursement' : 'Request'}
//               </Radio.Button>
//             </Radio.Group>
//           </Form.Item>

//           <Form.Item noStyle shouldUpdate={(prev, curr) => prev.decision !== curr.decision}>
//             {({ getFieldValue }) =>
//               {getFieldValue('decision') === 'approved' && (
//                 <>
//                   {/* Budget Code Selection */}
//                   <Form.Item
//                     name="budgetCodeId"
//                     label={
//                       <Space>
//                         <span>Budget Code</span>
//                         <Tag color="red">Required</Tag>
//                       </Space>
//                     }
//                     rules={[{ required: true, message: 'Budget code is required for approval' }]}
//                   >
//                     <Select
//                       placeholder="Select budget code"
//                       showSearch
//                       filterOption={(input, option) =>
//                         option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
//                       }
//                       onChange={handleBudgetCodeChange}
//                     >
//                       {budgetCodes.map(bc => (
//                         <Option key={bc._id} value={bc._id}>
//                           {bc.code} - {bc.name} (Available: XAF {bc.remaining.toLocaleString()})
//                         </Option>
//                       ))}
//                     </Select>
//                   </Form.Item>

//                   {selectedBudgetCode && (
//                     <Alert
//                       message="Budget Code Information"
//                       description={
//                         <div>
//                           <Text>Budget: XAF {selectedBudgetCode.budget.toLocaleString()}</Text>
//                           <br />
//                           <Text>Used: XAF {selectedBudgetCode.used.toLocaleString()}</Text>
//                           <br />
//                           <Text strong>Available: XAF {selectedBudgetCode.remaining.toLocaleString()}</Text>
//                         </div>
//                       }
//                       type="info"
//                       showIcon
//                       style={{ marginBottom: '16px' }}
//                     />
//                   )}

//                   {/* Approved Amount */}
//                   <Form.Item
//                     name="amountApproved"
//                     label="Amount to Approve (XAF)"
//                     rules={[{ required: true, message: 'Please enter amount to approve' }]}
//                     extra={
//                       approvedAmount < request.amountRequested && (
//                         <Text type="warning">
//                           You are approving {Math.round((approvedAmount / request.amountRequested) * 100)}% of requested amount
//                         </Text>
//                       )
//                     }
//                   >
//                     <InputNumber
//                       style={{ width: '100%' }}
//                       min={0}
//                       max={request.amountRequested}
//                       step={1000}
//                       formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
//                       parser={(value) => value.replace(/,/g, '')}
//                       onChange={(value) => {
//                         setDisbursementAmount(value);
//                         form.setFieldsValue({ disbursementAmount: value });
//                       }}
//                     />
//                   </Form.Item>

//                   <Divider />

//                   {/* Disbursement Section - NEW DESIGN */}
//                   <Card 
//                     size="small" 
//                     title={
//                       <Space>
//                         <SendOutlined />
//                         <Text strong>Disbursement Options</Text>
//                       </Space>
//                     }
//                     style={{ marginBottom: '24px', backgroundColor: '#f9f9f9' }}
//                   >
//                     <Space direction="vertical" style={{ width: '100%' }} size="large">
                      
//                       {/* Disbursement Mode Selection */}
//                       <div>
//                         <Text strong style={{ display: 'block', marginBottom: '8px' }}>
//                           When would you like to disburse funds?
//                         </Text>
//                         <Radio.Group 
//                           value={enableDisbursement ? 'now' : 'later'}
//                           onChange={(e) => {
//                             const isNow = e.target.value === 'now';
//                             setEnableDisbursement(isNow);
//                             if (isNow) {
//                               setDisbursementAmount(approvedAmount);
//                               form.setFieldsValue({ disbursementAmount: approvedAmount });
//                             }
//                           }}
//                           style={{ width: '100%' }}
//                         >
//                           <Space direction="vertical" style={{ width: '100%' }}>
//                             <Radio value="now" style={{ display: 'block', padding: '12px', border: '1px solid #d9d9d9', borderRadius: '4px', marginBottom: '8px' }}>
//                               <Space direction="vertical" size="small">
//                                 <Text strong>Disburse Immediately</Text>
//                                 <Text type="secondary" style={{ fontSize: '12px' }}>
//                                   Funds will be disbursed now (full or partial amount)
//                                 </Text>
//                               </Space>
//                             </Radio>
                            
//                             <Radio value="later" style={{ display: 'block', padding: '12px', border: '1px solid #d9d9d9', borderRadius: '4px' }}>
//                               <Space direction="vertical" size="small">
//                                 <Text strong>Approve Now, Disburse Later</Text>
//                                 <Text type="secondary" style={{ fontSize: '12px' }}>
//                                   Budget will be reserved. You can disburse anytime from Finance Dashboard.
//                                 </Text>
//                               </Space>
//                             </Radio>
//                           </Space>
//                         </Radio.Group>
//                       </div>

//                       {/* Immediate Disbursement Section */}
//                       {enableDisbursement && (
//                         <>
//                           <Alert
//                             message="Immediate Disbursement Mode"
//                             description="You can disburse the full approved amount now, or make a partial payment."
//                             type="info"
//                             showIcon
//                             icon={<InfoCircleOutlined />}
//                           />

//                           <Form.Item 
//                             name="disbursementAmount"
//                             label="Disbursement Amount (XAF)" 
//                             style={{ marginBottom: 0 }}
//                             rules={[
//                               { required: true, message: 'Please enter disbursement amount' },
//                               {
//                                 validator: (_, value) => {
//                                   if (value > approvedAmount) {
//                                     return Promise.reject('Cannot exceed approved amount');
//                                   }
//                                   return Promise.resolve();
//                                 }
//                               }
//                             ]}
//                           >
//                             <InputNumber
//                               style={{ width: '100%' }}
//                               min={0}
//                               max={approvedAmount}
//                               step={1000}
//                               value={disbursementAmount}
//                               onChange={setDisbursementAmount}
//                               formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
//                               parser={(value) => value.replace(/,/g, '')}
//                             />
//                           </Form.Item>

//                           <Row gutter={[16, 16]} style={{ marginTop: '16px' }}>
//                             <Col span={8}>
//                               <Statistic
//                                 title="Approved Amount"
//                                 value={approvedAmount}
//                                 precision={0}
//                                 valueStyle={{ color: '#3f8600', fontSize: '18px' }}
//                                 prefix="XAF"
//                               />
//                             </Col>
//                             <Col span={8}>
//                               <Statistic
//                                 title="Disbursing Now"
//                                 value={disbursementAmount}
//                                 precision={0}
//                                 valueStyle={{ color: '#1890ff', fontSize: '18px' }}
//                                 prefix="XAF"
//                               />
//                             </Col>
//                             <Col span={8}>
//                               <Statistic
//                                 title="Remaining"
//                                 value={approvedAmount - disbursementAmount}
//                                 precision={0}
//                                 valueStyle={{ 
//                                   color: (approvedAmount - disbursementAmount) > 0 ? '#faad14' : '#52c41a',
//                                   fontSize: '18px'
//                                 }}
//                                 prefix="XAF"
//                               />
//                             </Col>
//                           </Row>

//                           <Progress 
//                             percent={disbursementProgress} 
//                             status={disbursementProgress === 100 ? 'success' : 'active'}
//                             format={(percent) => `${percent}% ${disbursementProgress === 100 ? '(Full Disbursement)' : '(Partial Disbursement)'}`}
//                             strokeColor={{
//                               '0%': '#108ee9',
//                               '100%': '#52c41a',
//                             }}
//                           />

//                           {disbursementProgress < 100 && (
//                             <Alert
//                               message="Partial Disbursement"
//                               description={`You can disburse the remaining XAF ${(approvedAmount - disbursementAmount).toLocaleString()} later from the Finance Dashboard.`}
//                               type="warning"
//                               showIcon
//                             />
//                           )}
//                         </>
//                       )}

//                       {/* Approve Later Mode */}
//                       {!enableDisbursement && (
//                         <Alert
//                           message="Funds Reserved"
//                           description="Budget will be reserved for this request. You can process disbursement anytime from Finance Dashboard > Pending Disbursements."
//                           type="success"
//                           showIcon
//                           icon={<CheckCircleOutlined />}
//                         />
//                       )}
//                     </Space>
//                   </Card>
//                 </>
//               )}
//             }
//           </Form.Item>

//           <Form.Item
//             name="comments"
//             label="Comments"
//             rules={[{ required: true, message: 'Please provide comments for your decision' }]}
//           >
//             <TextArea
//               rows={4}
//               placeholder="Explain your decision (required for audit trail)..."
//               showCount
//               maxLength={500}
//             />
//           </Form.Item>

//           <Form.Item>
//             <Space>
//               <Button onClick={() => navigate('/finance/cash-approvals')}>
//                 Cancel
//               </Button>
//               <Button
//                 type="primary"
//                 htmlType="submit"
//                 loading={submitting}
//                 icon={form.getFieldValue('decision') === 'approved' ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
//               >
//                 {submitting ? 'Processing...' : `${form.getFieldValue('decision') === 'approved' ? 'Approve' : 'Reject'} ${isReimbursement ? 'Reimbursement' : 'Request'}`}
//               </Button>
//             </Space>
//           </Form.Item>
//         </Form>
//       </Card>
//     </div>
//   );
// };

// export default FinanceCashApprovalForm;

