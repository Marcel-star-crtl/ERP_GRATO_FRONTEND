import React, { useState, useEffect } from 'react';
import {
  Card, Table, Button, Modal, Form, Input, Tag, Space, 
  Typography, Descriptions, Timeline, message, Radio
} from 'antd';
import {
  CheckCircleOutlined, CloseCircleOutlined, 
  ClockCircleOutlined, EyeOutlined
} from '@ant-design/icons';
import budgetCodeAPI from '../../services/budgetCodeAPI';

const { Title, Text } = Typography;
const { TextArea } = Input;

const BudgetCodeApprovals = () => {
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [approvalModalVisible, setApprovalModalVisible] = useState(false);
  const [selectedBudgetCode, setSelectedBudgetCode] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchPendingApprovals();
  }, []);

  const fetchPendingApprovals = async () => {
    try {
      setLoading(true);
      const response = await budgetCodeAPI.getPendingApprovals();
      
      if (response.success) {
        setPendingApprovals(response.data);
      }
    } catch (error) {
      console.error('Error fetching pending approvals:', error);
      message.error('Failed to fetch pending approvals');
    } finally {
      setLoading(false);
    }
  };

  const handleApprovalAction = (budgetCode) => {
    setSelectedBudgetCode(budgetCode);
    
    // Find current pending level
    const pendingStep = budgetCode.approvalChain.find(step => step.status === 'pending');
    
    form.setFieldsValue({
      decision: 'approved',
      comments: '',
      level: pendingStep ? pendingStep.level : 1
    });
    
    setApprovalModalVisible(true);
  };

  const handleSubmitApproval = async (values) => {
    try {
      setLoading(true);
      
      const response = await budgetCodeAPI.processApproval(
        selectedBudgetCode._id,
        values
      );
      
      if (response.success) {
        message.success(response.message);
        setApprovalModalVisible(false);
        form.resetFields();
        setSelectedBudgetCode(null);
        fetchPendingApprovals();
      } else {
        message.error(response.message || 'Failed to process approval');
      }
    } catch (error) {
      console.error('Error processing approval:', error);
      message.error(error.message || 'Failed to process approval');
    } finally {
      setLoading(false);
    }
  };

  const getStatusTag = (status) => {
    const statusMap = {
      'pending_departmental_approval': { color: 'orange', text: 'Pending Department Head' },
      'pending_head_of_business': { color: 'blue', text: 'Pending Executive' },
      'pending_finance_activation': { color: 'purple', text: 'Pending Finance' },
      'active': { color: 'green', text: 'Active' },
      'rejected': { color: 'red', text: 'Rejected' }
    };
    
    const config = statusMap[status] || { color: 'default', text: status };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const columns = [
    {
      title: 'Budget Code',
      dataIndex: 'code',
      key: 'code',
      render: (code, record) => (
        <div>
          <Text strong code>{code}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: '12px' }}>{record.name}</Text>
        </div>
      )
    },
    {
      title: 'Department',
      dataIndex: 'department',
      key: 'department'
    },
    {
      title: 'Budget Amount',
      dataIndex: 'budget',
      key: 'budget',
      render: (budget) => (
        <Text strong style={{ color: '#52c41a' }}>
          XAF {budget.toLocaleString()}
        </Text>
      )
    },
    {
      title: 'Budget Type',
      dataIndex: 'budgetType',
      key: 'budgetType',
      render: (type) => type.replace('_', ' ').toUpperCase()
    },
    {
      title: 'Created By',
      key: 'creator',
      render: (_, record) => (
        <div>
          <Text>{record.createdBy?.fullName}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: '11px' }}>
            {record.createdBy?.department}
          </Text>
        </div>
      )
    },
    {
      title: 'Submitted',
      dataIndex: 'submissionDate',
      key: 'submissionDate',
      render: (date) => new Date(date).toLocaleDateString()
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => getStatusTag(status)
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button
          type="primary"
          icon={<CheckCircleOutlined />}
          onClick={() => handleApprovalAction(record)}
        >
          Review
        </Button>
      )
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <Title level={2}>Budget Code Approvals</Title>
        
        <Table
          columns={columns}
          dataSource={pendingApprovals}
          loading={loading}
          rowKey="_id"
          pagination={{
            showTotal: (total) => `${total} budget codes awaiting approval`
          }}
        />
      </Card>

      <Modal
        title="Budget Code Approval"
        open={approvalModalVisible}
        onCancel={() => {
          setApprovalModalVisible(false);
          form.resetFields();
          setSelectedBudgetCode(null);
        }}
        footer={null}
        width={800}
      >
        {selectedBudgetCode && (
          <div>
            <Descriptions bordered column={2} size="small" style={{ marginBottom: '20px' }}>
              <Descriptions.Item label="Budget Code" span={2}>
                <Text code strong>{selectedBudgetCode.code}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Budget Name" span={2}>
                {selectedBudgetCode.name}
              </Descriptions.Item>
              <Descriptions.Item label="Department">
                {selectedBudgetCode.department}
              </Descriptions.Item>
              <Descriptions.Item label="Budget Type">
                {selectedBudgetCode.budgetType.replace('_', ' ').toUpperCase()}
              </Descriptions.Item>
              <Descriptions.Item label="Budget Amount" span={2}>
                <Text strong style={{ color: '#52c41a', fontSize: '16px' }}>
                  XAF {selectedBudgetCode.budget.toLocaleString()}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Period">
                {selectedBudgetCode.budgetPeriod.toUpperCase()}
              </Descriptions.Item>
              <Descriptions.Item label="Created By">
                {selectedBudgetCode.createdBy?.fullName}
              </Descriptions.Item>
              {selectedBudgetCode.description && (
                <Descriptions.Item label="Description" span={2}>
                  {selectedBudgetCode.description}
                </Descriptions.Item>
              )}
              {selectedBudgetCode.justification && (
                <Descriptions.Item label="Justification" span={2}>
                  {selectedBudgetCode.justification}
                </Descriptions.Item>
              )}
            </Descriptions>

            <Card size="small" title="Approval Progress" style={{ marginBottom: '20px' }}>
              <Timeline>
                {selectedBudgetCode.approvalChain.map((step, index) => {
                  let color = 'gray';
                  let icon = <ClockCircleOutlined />;
                  
                  if (step.status === 'approved') {
                    color = 'green';
                    icon = <CheckCircleOutlined />;
                  } else if (step.status === 'rejected') {
                    color = 'red';
                    icon = <CloseCircleOutlined />;
                  } else if (step.status === 'pending') {
                    color = 'blue';
                  }

                  return (
                    <Timeline.Item key={index} color={color} dot={icon}>
                      <Text strong>Level {step.level}: {step.approver.name}</Text>
                      <br />
                      <Text type="secondary">{step.approver.role}</Text>
                      <br />
                      <Tag color={color} style={{ marginTop: '4px' }}>
                        {step.status.toUpperCase()}
                      </Tag>
                    </Timeline.Item>
                  );
                })}
              </Timeline>
            </Card>

            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmitApproval}
            >
              <Form.Item name="level" hidden>
                <Input />
              </Form.Item>

              <Form.Item
                name="decision"
                label="Decision"
                rules={[{ required: true, message: 'Please select a decision' }]}
              >
                <Radio.Group>
                  <Radio.Button value="approved" style={{ color: '#52c41a' }}>
                    <CheckCircleOutlined /> Approve
                  </Radio.Button>
                  <Radio.Button value="rejected" style={{ color: '#ff4d4f' }}>
                    <CloseCircleOutlined /> Reject
                  </Radio.Button>
                </Radio.Group>
              </Form.Item>

              <Form.Item
                name="comments"
                label="Comments"
                rules={[{ required: true, message: 'Please provide comments' }]}
              >
                <TextArea
                  rows={4}
                  placeholder="Provide your feedback or reason for decision..."
                  maxLength={500}
                  showCount
                />
              </Form.Item>

              <Form.Item>
                <Space>
                  <Button onClick={() => {
                    setApprovalModalVisible(false);
                    form.resetFields();
                    setSelectedBudgetCode(null);
                  }}>
                    Cancel
                  </Button>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={loading}
                  >
                    Submit Decision
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default BudgetCodeApprovals;