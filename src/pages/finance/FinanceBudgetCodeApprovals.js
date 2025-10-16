import React, { useState, useEffect } from 'react';
import {
  Card, Table, Button, Modal, Form, Input, Tag, Space, 
  Typography, Descriptions, Timeline, message, Radio, Badge,
  Row, Col, Statistic, Alert, Spin, Divider
} from 'antd';
import {
  CheckCircleOutlined, CloseCircleOutlined, 
  ClockCircleOutlined, EyeOutlined, AuditOutlined,
  ReloadOutlined, DollarOutlined, BankOutlined,
  BarChartOutlined
} from '@ant-design/icons';
import { budgetCodeAPI } from '../../services/budgetCodeAPI';

const { Title, Text } = Typography;
const { TextArea } = Input;

const FinanceBudgetCodeApprovals = () => {
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [allBudgetCodes, setAllBudgetCodes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [approvalModalVisible, setApprovalModalVisible] = useState(false);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [selectedBudgetCode, setSelectedBudgetCode] = useState(null);
  const [form] = Form.useForm();
  const [stats, setStats] = useState({
    pending: 0,
    active: 0,
    totalBudget: 0,
    utilization: 0
  });

  useEffect(() => {
    fetchPendingApprovals();
    fetchAllBudgetCodes();
  }, []);

  const fetchPendingApprovals = async () => {
    try {
      setLoading(true);
      const response = await budgetCodeAPI.getPendingApprovals();
      
      if (response.success) {
        // Filter for codes pending finance activation (Level 3)
        const financePending = response.data.filter(bc => 
          bc.status === 'pending_finance_activation' &&
          bc.approvalChain.some(step => 
            step.level === 3 && 
            step.status === 'pending' &&
            step.approver.role === 'Finance Officer'
          )
        );
        
        setPendingApprovals(financePending);
        setStats(prev => ({ ...prev, pending: financePending.length }));
      }
    } catch (error) {
      console.error('Error fetching pending approvals:', error);
      message.error('Failed to fetch pending approvals');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllBudgetCodes = async () => {
    try {
      const response = await budgetCodeAPI.getBudgetCodes();
      
      if (response.success) {
        setAllBudgetCodes(response.data);
        
        // Calculate stats
        const activeCodes = response.data.filter(bc => bc.active);
        const totalBudget = activeCodes.reduce((sum, bc) => sum + bc.budget, 0);
        const totalUsed = activeCodes.reduce((sum, bc) => sum + bc.used, 0);
        const utilization = totalBudget > 0 ? Math.round((totalUsed / totalBudget) * 100) : 0;
        
        setStats(prev => ({
          ...prev,
          active: activeCodes.length,
          totalBudget,
          utilization
        }));
      }
    } catch (error) {
      console.error('Error fetching budget codes:', error);
    }
  };

  const handleApprovalAction = (budgetCode) => {
    setSelectedBudgetCode(budgetCode);
    
    form.setFieldsValue({
      decision: 'approved',
      comments: '',
      level: 3 
    });
    
    setApprovalModalVisible(true);
  };

  const handleViewDetails = (budgetCode) => {
    setSelectedBudgetCode(budgetCode);
    setDetailsModalVisible(true);
  };

  const handleSubmitApproval = async (values) => {
    try {
      setLoading(true);
      
      const response = await budgetCodeAPI.processApproval(
        selectedBudgetCode._id,
        values
      );
      
      if (response.success) {
        if (values.decision === 'approved') {
          message.success('Budget code activated successfully! It is now available for use.');
        } else {
          message.info('Budget code request has been rejected.');
        }
        
        setApprovalModalVisible(false);
        form.resetFields();
        setSelectedBudgetCode(null);
        fetchPendingApprovals();
        fetchAllBudgetCodes();
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
      'pending_departmental_approval': { color: 'orange', text: 'Pending Department' },
      'pending_head_of_business': { color: 'blue', text: 'Pending Executive' },
      'pending_finance_activation': { color: 'purple', text: 'Pending Finance Activation' },
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
        <Text strong style={{ color: '#52c41a', fontSize: '14px' }}>
          XAF {budget.toLocaleString()}
        </Text>
      )
    },
    {
      title: 'Budget Type',
      dataIndex: 'budgetType',
      key: 'budgetType',
      render: (type) => (
        <Tag color="blue">{type.replace('_', ' ').toUpperCase()}</Tag>
      )
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
      title: 'Approvals',
      key: 'approvals',
      render: (_, record) => {
        const approvedLevels = record.approvalChain.filter(s => s.status === 'approved').length;
        const totalLevels = record.approvalChain.length;
        return (
          <div>
            <Text>{approvedLevels}/{totalLevels} Approved</Text>
            <br />
            <Text type="secondary" style={{ fontSize: '11px' }}>
              {approvedLevels === totalLevels - 1 ? 'Final Approval' : 'In Progress'}
            </Text>
          </div>
        );
      }
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetails(record)}
          >
            View
          </Button>
          <Button
            type="primary"
            size="small"
            icon={<BankOutlined />}
            onClick={() => handleApprovalAction(record)}
          >
            Activate
          </Button>
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <Title level={2} style={{ margin: 0 }}>
            <BankOutlined /> Finance - Budget Code Activation
          </Title>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => {
              fetchPendingApprovals();
              fetchAllBudgetCodes();
            }}
            loading={loading}
          >
            Refresh
          </Button>
        </div>

        {/* Statistics */}
        <Row gutter={16} style={{ marginBottom: '24px' }}>
          <Col span={6}>
            <Card>
              <Statistic
                title="Pending Activation"
                value={stats.pending}
                valueStyle={{ color: '#722ed1' }}
                prefix={<ClockCircleOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Active Budget Codes"
                value={stats.active}
                valueStyle={{ color: '#52c41a' }}
                prefix={<CheckCircleOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Total Active Budget"
                value={`XAF ${stats.totalBudget.toLocaleString()}`}
                valueStyle={{ color: '#1890ff' }}
                prefix={<DollarOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Overall Utilization"
                value={stats.utilization}
                suffix="%"
                valueStyle={{ color: '#fa8c16' }}
                prefix={<BarChartOutlined />}
              />
            </Card>
          </Col>
        </Row>

        <Alert
          message="Budget Code Activation - Final Approval"
          description="As the Finance Officer, your approval activates the budget code in the accounting system. Review the budget allocation carefully before activating."
          type="info"
          showIcon
          style={{ marginBottom: '16px' }}
        />

        <Table
          columns={columns}
          dataSource={pendingApprovals}
          loading={loading}
          rowKey="_id"
          pagination={{
            showTotal: (total) => `${total} budget codes awaiting finance activation`
          }}
          locale={{
            emptyText: loading ? <Spin /> : 'No budget codes pending activation'
          }}
        />
      </Card>

      {/* Activation/Approval Modal */}
      <Modal
        title={
          <Space>
            <BankOutlined />
            Budget Code Activation
          </Space>
        }
        open={approvalModalVisible}
        onCancel={() => {
          setApprovalModalVisible(false);
          form.resetFields();
          setSelectedBudgetCode(null);
        }}
        footer={null}
        width={900}
      >
        {selectedBudgetCode && (
          <div>
            <Alert
              message="Final Approval - Budget Code Activation"
              description="This is the final step in the approval process. Approving will activate this budget code in the accounting system and make it available for requisition assignments."
              type="warning"
              showIcon
              style={{ marginBottom: '20px' }}
            />

            <Descriptions bordered column={2} size="small" style={{ marginBottom: '20px' }}>
              <Descriptions.Item label="Budget Code" span={2}>
                <Text code strong style={{ fontSize: '16px' }}>{selectedBudgetCode.code}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Budget Name" span={2}>
                <Text strong>{selectedBudgetCode.name}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Department">
                {selectedBudgetCode.department}
              </Descriptions.Item>
              <Descriptions.Item label="Budget Type">
                {selectedBudgetCode.budgetType.replace('_', ' ').toUpperCase()}
              </Descriptions.Item>
              <Descriptions.Item label="Total Budget" span={2}>
                <Text strong style={{ color: '#52c41a', fontSize: '18px' }}>
                  XAF {selectedBudgetCode.budget.toLocaleString()}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Budget Period">
                {selectedBudgetCode.budgetPeriod.toUpperCase()}
              </Descriptions.Item>
              <Descriptions.Item label="Created By">
                {selectedBudgetCode.createdBy?.fullName}
              </Descriptions.Item>
              {selectedBudgetCode.startDate && (
                <Descriptions.Item label="Start Date">
                  {new Date(selectedBudgetCode.startDate).toLocaleDateString()}
                </Descriptions.Item>
              )}
              {selectedBudgetCode.endDate && (
                <Descriptions.Item label="End Date">
                  {new Date(selectedBudgetCode.endDate).toLocaleDateString()}
                </Descriptions.Item>
              )}
              {selectedBudgetCode.description && (
                <Descriptions.Item label="Description" span={2}>
                  {selectedBudgetCode.description}
                </Descriptions.Item>
              )}
              {selectedBudgetCode.justification && (
                <Descriptions.Item label="Justification" span={2}>
                  <Text italic>{selectedBudgetCode.justification}</Text>
                </Descriptions.Item>
              )}
            </Descriptions>

            <Card size="small" title="Approval History" style={{ marginBottom: '20px' }}>
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
                    icon = <ClockCircleOutlined />;
                  }

                  return (
                    <Timeline.Item key={index} color={color} dot={icon}>
                      <div>
                        <Text strong>Level {step.level}: {step.approver.name}</Text>
                        <br />
                        <Text type="secondary">{step.approver.role}</Text>
                        <br />
                        <Tag color={color} style={{ marginTop: '4px' }}>
                          {step.status.toUpperCase()}
                        </Tag>
                        {step.status === 'approved' && step.actionDate && (
                          <div style={{ marginTop: '4px' }}>
                            <Text type="secondary" style={{ fontSize: '11px' }}>
                              Approved on {new Date(step.actionDate).toLocaleDateString()}
                            </Text>
                          </div>
                        )}
                        {step.comments && (
                          <div style={{ marginTop: '4px', fontStyle: 'italic', color: '#666' }}>
                            "{step.comments}"
                          </div>
                        )}
                      </div>
                    </Timeline.Item>
                  );
                })}
              </Timeline>
            </Card>

            <Divider />

            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmitApproval}
            >
              <Form.Item name="level" hidden initialValue={3}>
                <Input />
              </Form.Item>

              <Form.Item
                name="decision"
                label="Activation Decision"
                rules={[{ required: true, message: 'Please select a decision' }]}
              >
                <Radio.Group size="large">
                  <Radio.Button value="approved" style={{ color: '#52c41a', marginRight: '8px' }}>
                    <CheckCircleOutlined /> Activate Budget Code
                  </Radio.Button>
                  <Radio.Button value="rejected" style={{ color: '#ff4d4f' }}>
                    <CloseCircleOutlined /> Reject
                  </Radio.Button>
                </Radio.Group>
              </Form.Item>

              <Form.Item
                name="comments"
                label="Activation Notes"
                rules={[{ required: true, message: 'Please provide activation notes' }]}
                help="Add any relevant notes about the budget code activation or rejection"
              >
                <TextArea
                  rows={4}
                  placeholder="Enter notes about budget code activation, accounting system integration, or any special instructions..."
                  maxLength={500}
                  showCount
                />
              </Form.Item>

              <Alert
                message="Finance Officer Responsibilities"
                description={
                  <ul style={{ marginBottom: 0, paddingLeft: '20px' }}>
                    <li>Create budget code in accounting system</li>
                    <li>Set up budget tracking and monitoring</li>
                    <li>Ensure financial compliance</li>
                    <li>Configure spending limits and alerts</li>
                  </ul>
                }
                type="info"
                showIcon
                style={{ marginBottom: '16px' }}
              />

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
                    size="large"
                  >
                    Submit Decision
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>

      {/* Details Modal */}
      <Modal
        title="Budget Code Details"
        open={detailsModalVisible}
        onCancel={() => {
          setDetailsModalVisible(false);
          setSelectedBudgetCode(null);
        }}
        footer={[
          <Button key="close" onClick={() => {
            setDetailsModalVisible(false);
            setSelectedBudgetCode(null);
          }}>
            Close
          </Button>
        ]}
        width={800}
      >
        {selectedBudgetCode && (
          <div>
            <Descriptions bordered column={2} size="small" style={{ marginBottom: '20px' }}>
              <Descriptions.Item label="Budget Code" span={2}>
                <Text code strong style={{ fontSize: '16px' }}>{selectedBudgetCode.code}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Name" span={2}>
                {selectedBudgetCode.name}
              </Descriptions.Item>
              <Descriptions.Item label="Department">
                {selectedBudgetCode.department}
              </Descriptions.Item>
              <Descriptions.Item label="Type">
                {selectedBudgetCode.budgetType.replace('_', ' ').toUpperCase()}
              </Descriptions.Item>
              <Descriptions.Item label="Total Budget">
                <Text strong style={{ color: '#52c41a' }}>
                  XAF {selectedBudgetCode.budget.toLocaleString()}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Period">
                {selectedBudgetCode.budgetPeriod.toUpperCase()}
              </Descriptions.Item>
              <Descriptions.Item label="Status" span={2}>
                {getStatusTag(selectedBudgetCode.status)}
              </Descriptions.Item>
              {selectedBudgetCode.description && (
                <Descriptions.Item label="Description" span={2}>
                  {selectedBudgetCode.description}
                </Descriptions.Item>
              )}
            </Descriptions>

            <Card size="small" title="Approval Chain" style={{ marginTop: '20px' }}>
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
                      <Text strong>{step.approver.name}</Text>
                      <br />
                      <Text type="secondary">{step.approver.role}</Text>
                      <br />
                      <Tag color={color}>{step.status.toUpperCase()}</Tag>
                    </Timeline.Item>
                  );
                })}
              </Timeline>
            </Card>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default FinanceBudgetCodeApprovals;