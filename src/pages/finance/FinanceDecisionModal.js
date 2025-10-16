// FinanceApprovalModal.jsx
import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, InputNumber, Select, Alert, Divider, Typography, Space, Spin, Button, message } from 'antd';
import { DollarOutlined, InfoCircleOutlined, WarningOutlined } from '@ant-design/icons';

const { TextArea } = Input;
const { Option } = Select;
const { Text } = Typography;

const FinanceApprovalModal = ({ visible, onClose, request, onApprove, loading }) => {
  const [form] = Form.useForm();
  const [budgetCodes, setBudgetCodes] = useState([]);
  const [loadingBudgets, setLoadingBudgets] = useState(false);
  const [selectedBudgetCode, setSelectedBudgetCode] = useState(null);
  const [decision, setDecision] = useState('approved');

  useEffect(() => {
    if (visible) {
      console.log('Finance approval modal opened for request:', request);
      fetchAvailableBudgetCodes();
      
      // Pre-fill budget code if request has a project with budget
      if (request?.projectId && request?.budgetAllocation?.budgetCodeId) {
        form.setFieldsValue({
          budgetCodeId: request.budgetAllocation.budgetCodeId
        });
        // Fetch and set the selected budget code
        fetchBudgetCodeDetails(request.budgetAllocation.budgetCodeId);
      }
    }
  }, [visible, request]);

  const fetchAvailableBudgetCodes = async () => {
    try {
      setLoadingBudgets(true);
      console.log('Fetching available budget codes...');
      
      const response = await fetch('/api/budget-codes/available', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch budget codes');
      }

      const data = await response.json();
      console.log('Budget codes fetched:', data);

      if (data.success) {
        setBudgetCodes(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching budget codes:', error);
      message.error('Failed to load budget codes');
    } finally {
      setLoadingBudgets(false);
    }
  };

  const fetchBudgetCodeDetails = async (budgetCodeId) => {
    try {
      const response = await fetch(`/api/budget-codes/${budgetCodeId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSelectedBudgetCode(data.data);
        }
      }
    } catch (error) {
      console.error('Error fetching budget code details:', error);
    }
  };

  const handleBudgetCodeChange = (budgetCodeId) => {
    console.log('Budget code selected:', budgetCodeId);
    
    if (budgetCodeId) {
      const budgetCode = budgetCodes.find(bc => bc._id === budgetCodeId);
      setSelectedBudgetCode(budgetCode);
      console.log('Selected budget code details:', budgetCode);
    } else {
      setSelectedBudgetCode(null);
    }
  };

  const handleDecisionChange = (value) => {
    setDecision(value);
    console.log('Decision changed to:', value);
  };

  const handleSubmit = async (values) => {
    try {
      console.log('=== FINANCE APPROVAL SUBMISSION ===');
      console.log('Form values:', values);
      console.log('Decision:', decision);

      if (decision === 'approved') {
        // Validate budget code is selected
        if (!values.budgetCodeId) {
          message.error('Please select a budget code for approval');
          return;
        }

        // Validate budget availability
        const requestedAmount = values.disbursementAmount || values.amountApproved || request.amountRequested;
        
        if (selectedBudgetCode && selectedBudgetCode.remaining < requestedAmount) {
          message.error(
            `Insufficient budget! Available: XAF ${selectedBudgetCode.remaining.toLocaleString()}, Requested: XAF ${requestedAmount.toLocaleString()}`
          );
          return;
        }
      }

      const approvalData = {
        decision: decision,
        comments: values.comments,
        budgetCodeId: decision === 'approved' ? values.budgetCodeId : undefined,
        amountApproved: values.amountApproved,
        disbursementAmount: values.disbursementAmount
      };

      console.log('Approval data:', approvalData);

      if (onApprove) {
        await onApprove(approvalData);
      }

    } catch (error) {
      console.error('Finance approval error:', error);
      message.error(error.message || 'Failed to process approval');
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setSelectedBudgetCode(null);
    setDecision('approved');
    onClose();
  };

  return (
    <Modal
      title={
        <Space>
          <DollarOutlined />
          Finance Decision - Request #{request?.displayId || request?._id?.slice(-6).toUpperCase()}
        </Space>
      }
      open={visible}
      onCancel={handleCancel}
      footer={null}
      width={700}
      destroyOnClose
    >
      <Spin spinning={loading}>
        {/* Request Summary */}
        <Alert
          message="Request Summary"
          description={
            <div>
              <p><strong>Employee:</strong> {request?.employee?.fullName}</p>
              <p><strong>Amount Requested:</strong> XAF {request?.amountRequested?.toLocaleString()}</p>
              <p><strong>Purpose:</strong> {request?.purpose}</p>
              {request?.projectId && (
                <p><strong>Project:</strong> {request.projectId.name}</p>
              )}
              {request?.budgetAllocation?.budgetCode && (
                <p><strong>Current Budget Code:</strong> {request.budgetAllocation.budgetCode}</p>
              )}
            </div>
          }
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            decision: 'approved',
            amountApproved: request?.amountRequested,
            disbursementAmount: request?.amountRequested
          }}
        >
          {/* Decision */}
          <Form.Item
            name="decision"
            label="Decision"
            rules={[{ required: true, message: 'Please select a decision' }]}
          >
            <Select onChange={handleDecisionChange} placeholder="Select decision">
              <Option value="approved">
                <span style={{ color: '#52c41a' }}>✓ Approve</span>
              </Option>
              <Option value="rejected">
                <span style={{ color: '#f5222d' }}>✗ Reject</span>
              </Option>
            </Select>
          </Form.Item>

          {decision === 'approved' && (
            <>
              <Divider orientation="left">Budget Allocation</Divider>

              {/* Budget Code Selection - CRITICAL */}
              <Form.Item
                name="budgetCodeId"
                label="Budget Code"
                rules={[{ required: true, message: 'Budget code is required for approval' }]}
                extra={
                  request?.projectId && request?.budgetAllocation?.budgetCodeId
                    ? "This request is linked to a project with an assigned budget code."
                    : "No project selected. Please assign an appropriate budget code."
                }
              >
                <Select
                  placeholder="Select budget code"
                  loading={loadingBudgets}
                  onChange={handleBudgetCodeChange}
                  showSearch
                  filterOption={(input, option) =>
                    option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                  }
                >
                  {budgetCodes.map(bc => (
                    <Option key={bc._id} value={bc._id}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>{bc.code} - {bc.name}</span>
                        <span style={{ fontSize: '12px', color: bc.remaining > 0 ? '#52c41a' : '#f5222d' }}>
                          Available: XAF {bc.remaining?.toLocaleString() || '0'}
                        </span>
                      </div>
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              {/* Budget Code Information */}
              {selectedBudgetCode && (
                <Alert
                  message="Selected Budget Code Details"
                  description={
                    <div>
                      <p><strong>Code:</strong> {selectedBudgetCode.code}</p>
                      <p><strong>Name:</strong> {selectedBudgetCode.name}</p>
                      <p><strong>Department:</strong> {selectedBudgetCode.department}</p>
                      <p><strong>Total Budget:</strong> XAF {selectedBudgetCode.budget?.toLocaleString()}</p>
                      <p><strong>Used:</strong> XAF {selectedBudgetCode.used?.toLocaleString()}</p>
                      <p><strong>Available:</strong> <Text strong style={{ color: '#52c41a' }}>XAF {selectedBudgetCode.remaining?.toLocaleString()}</Text></p>
                      <p><strong>Utilization:</strong> {selectedBudgetCode.utilizationPercentage}%</p>
                    </div>
                  }
                  type={selectedBudgetCode.remaining >= (request?.amountRequested || 0) ? 'success' : 'error'}
                  showIcon
                  icon={selectedBudgetCode.remaining >= (request?.amountRequested || 0) ? 
                    <InfoCircleOutlined /> : <WarningOutlined />}
                  style={{ marginBottom: 16 }}
                />
              )}

              <Divider orientation="left">Approval Amounts</Divider>

              <Form.Item
                name="amountApproved"
                label="Amount Approved (XAF)"
                rules={[{ required: true, message: 'Please enter approved amount' }]}
                extra="This is the amount you are approving for this request"
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  max={request?.amountRequested}
                  step={1000}
                  formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value) => value.replace(/,/g, '')}
                />
              </Form.Item>

              <Form.Item
                name="disbursementAmount"
                label="Disbursement Amount (XAF)"
                extra="Enter amount if disbursing immediately, or leave blank to disburse later"
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  max={request?.amountRequested}
                  step={1000}
                  formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value) => value.replace(/,/g, '')}
                />
              </Form.Item>
            </>
          )}

          {/* Comments */}
          <Form.Item
            name="comments"
            label="Comments"
            rules={[{ required: decision === 'rejected', message: 'Comments are required for rejection' }]}
          >
            <TextArea
              rows={4}
              placeholder={decision === 'approved' ? 
                'Optional: Add any comments or instructions for the employee' : 
                'Please explain why this request is being rejected'
              }
              maxLength={500}
              showCount
            />
          </Form.Item>

          {/* Budget Warning */}
          {decision === 'approved' && selectedBudgetCode && 
           selectedBudgetCode.remaining < (request?.amountRequested || 0) && (
            <Alert
              message="Insufficient Budget"
              description={`The selected budget code has insufficient funds. Available: XAF ${selectedBudgetCode.remaining.toLocaleString()}, Required: XAF ${request?.amountRequested?.toLocaleString()}`}
              type="error"
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}

          {/* Action Buttons */}
          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={handleCancel}>
                Cancel
              </Button>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={loading}
                danger={decision === 'rejected'}
              >
                {decision === 'approved' ? 'Approve & Allocate Budget' : 'Reject Request'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Spin>
    </Modal>
  );
};

export default FinanceApprovalModal;



