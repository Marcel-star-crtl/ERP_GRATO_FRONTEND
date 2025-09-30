import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Typography,
  Tag,
  Space,
  Input,
  Alert,
  Spin,
  message,
  Badge,
  Descriptions,
  Row,
  Col,
  Statistic,
  Timeline,
  Divider,
  Radio,
  Popconfirm
} from 'antd';
import {
  DollarOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  EyeOutlined,
  BankOutlined,
  FileTextOutlined,
  UserOutlined,
  CalendarOutlined,
  TagsOutlined
} from '@ant-design/icons';
import { purchaseRequisitionAPI } from '../../services/purchaseRequisitionAPI';

const { Title, Text } = Typography;
const { TextArea } = Input;

const SupervisorBudgetCodeApprovals = () => {
  const [budgetCodes, setBudgetCodes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [approvalModalVisible, setApprovalModalVisible] = useState(false);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [selectedBudgetCode, setSelectedBudgetCode] = useState(null);
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    total: 0
  });
  const [form] = Form.useForm();

  useEffect(() => {
    fetchPendingBudgetCodes();
    fetchStats();
  }, []);

  const fetchPendingBudgetCodes = async () => {
    try {
      setLoading(true);
      const response = await purchaseRequisitionAPI.getPendingForSupervisor();
      
      if (response.success) {
        setBudgetCodes(response.data);
      } else {
        message.error('Failed to fetch pending budget codes');
      }
    } catch (error) {
      console.error('Error fetching pending budget codes:', error);
      message.error('Failed to fetch budget codes');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await purchaseRequisitionAPI.getSupervisorStats();
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleViewDetails = (budgetCode) => {
    setSelectedBudgetCode(budgetCode);
    setDetailsModalVisible(true);
  };

  const handleStartApproval = (budgetCode) => {
    setSelectedBudgetCode(budgetCode);
    form.setFieldsValue({
      decision: 'approved',
      comments: ''
    });
    setApprovalModalVisible(true);
  };

const handleApprovalSubmit = async (values) => {
    if (!selectedBudgetCode) return;

    try {
        setLoading(true);
        
        const currentStep = selectedBudgetCode.currentApprovalStep || 
                            selectedBudgetCode.approvalChain?.find(step => step.status === 'pending');
        
        if (!currentStep) {
        message.error('No pending approval step found');
        return;
        }

        const approvalData = {
        decision: values.decision,
        comments: values.comments,
        level: currentStep.level
        };

        const response = await purchaseRequisitionAPI.processApproval(selectedBudgetCode._id, approvalData);

        if (response.success) {
        message.success(
            values.decision === 'approved' 
            ? 'Budget code approved successfully' 
            : 'Budget code rejected successfully'
        );
        
        setApprovalModalVisible(false);
        setSelectedBudgetCode(null);
        form.resetFields();
        
        // Refresh the data
        await fetchPendingBudgetCodes();
        await fetchStats();
        } else {
        throw new Error(response.message || 'Failed to process approval');
        }
    } catch (error) {
        console.error('Error processing approval:', error);
        message.error(error.message || 'Failed to process approval');
    } finally {
        setLoading(false);
    }
    };

    const getStatusTag = (status) => {
    const statusConfig = {
        'draft': { color: 'default', text: 'Draft' },
        'pending_supervisor': { color: 'orange', text: 'Pending Supervisor' },
        'pending_department_head': { color: 'blue', text: 'Pending Department Head' },
        'pending_business_head': { color: 'purple', text: 'Pending Business Head' },
        'approved': { color: 'green', text: 'Approved' },
        'rejected': { color: 'red', text: 'Rejected' }
    };

    const config = statusConfig[status] || { color: 'default', text: status };
    return <Tag color={config.color}>{config.text}</Tag>;
    };

    const getCurrentApprovalLevel = (budgetCode) => {
    const currentStep = budgetCode.currentApprovalStep || 
                        budgetCode.approvalChain?.find(step => step.status === 'pending');
    return currentStep ? currentStep.level : null;
    };

    const columns = [
    {
        title: 'Budget Code Details',
        key: 'details',
        render: (_, record) => (
        <div>
            <Text strong style={{ fontSize: '14px' }}>{record.name}</Text>
            <br />
            <Text code>{record.code}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: '12px' }}>
            Created: {new Date(record.createdAt).toLocaleDateString()}
            </Text>
        </div>
        ),
        width: 250
    },
    {
        title: 'Budget Amount',
        dataIndex: 'budget',
        key: 'budget',
        render: (budget) => (
        <Text strong style={{ color: '#1890ff', fontSize: '16px' }}>
            XAF {budget.toLocaleString()}
        </Text>
        ),
        width: 150,
        sorter: (a, b) => a.budget - b.budget
    },
    {
        title: 'Department',
        dataIndex: 'department',
        key: 'department',
        render: (department) => (
        <Tag color="blue">{department}</Tag>
        ),
        width: 120
    },
    {
        title: 'Budget Type',
        dataIndex: 'budgetType',
        key: 'budgetType',
        render: (type) => (
        <Tag color="green">{type?.replace('_', ' ')}</Tag>
        ),
        width: 120
    },
    {
        title: 'Current Step',
        key: 'currentStep',
        render: (_, record) => {
        const level = getCurrentApprovalLevel(record);
        const stepNames = {
            1: 'Supervisor Review',
            2: 'Department Head',
            3: 'Business Head'
        };
        return level ? (
            <Badge 
            count={level} 
            style={{ backgroundColor: '#1890ff' }}
            >
            <Text>{stepNames[level] || `Level ${level}`}</Text>
            </Badge>
        ) : (
            <Text type="secondary">No pending step</Text>
        );
        },
        width: 130
    },
    {
        title: 'Status',
        dataIndex: 'approvalStatus',
        key: 'status',
        render: (status) => getStatusTag(status),
        width: 120
    },
    {
        title: 'Created By',
        key: 'creator',
        render: (_, record) => (
        <div>
            <Text>{record.createdBy?.fullName || 'N/A'}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.createdBy?.email}
            </Text>
        </div>
        ),
        width: 150
    },
    {
        title: 'Actions',
        key: 'actions',
        render: (_, record) => (
        <Space size="small">
            <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetails(record)}
            >
            View
            </Button>
            {getCurrentApprovalLevel(record) && (
            <Button
                type="primary"
                size="small"
                icon={<CheckCircleOutlined />}
                onClick={() => handleStartApproval(record)}
            >
                Review
            </Button>
            )}
        </Space>
        ),
        width: 120,
        fixed: 'right'
    }
    ];

    return (
    <div style={{ padding: '24px' }}>
        <div style={{ marginBottom: '24px' }}>
        <Title level={2}>
            <BankOutlined style={{ marginRight: '8px' }} />
            Budget Code Approvals
        </Title>
        </div>

        {/* Statistics Cards */}
        <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col span={6}>
            <Card>
            <Statistic
                title="Pending Approvals"
                value={stats.pending}
                valueStyle={{ color: '#faad14' }}
                prefix={<ClockCircleOutlined />}
            />
            </Card>
        </Col>
        <Col span={6}>
            <Card>
            <Statistic
                title="Approved"
                value={stats.approved}
                valueStyle={{ color: '#52c41a' }}
                prefix={<CheckCircleOutlined />}
            />
            </Card>
        </Col>
        <Col span={6}>
            <Card>
            <Statistic
                title="Rejected"
                value={stats.rejected}
                valueStyle={{ color: '#ff4d4f' }}
                prefix={<CloseCircleOutlined />}
            />
            </Card>
        </Col>
        <Col span={6}>
            <Card>
            <Statistic
                title="Total Reviewed"
                value={stats.total}
                valueStyle={{ color: '#1890ff' }}
                prefix={<FileTextOutlined />}
            />
            </Card>
        </Col>
        </Row>

        {/* Main Table */}
        <Card>
        <Table
            columns={columns}
            dataSource={budgetCodes}
            loading={loading}
            rowKey="_id"
            pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} budget codes`,
            }}
            scroll={{ x: 1200 }}
            locale={{
            emptyText: loading ? <Spin /> : 'No pending budget codes found'
            }}
        />
        </Card>

        {/* Approval Modal */}
        <Modal
        title={
            <Space>
            <CheckCircleOutlined />
            Process Budget Code Approval
            </Space>
        }
        open={approvalModalVisible}
        onCancel={() => {
            setApprovalModalVisible(false);
            setSelectedBudgetCode(null);
            form.resetFields();
        }}
        footer={null}
        width={800}
        >
        {selectedBudgetCode && (
            <div>
            <Alert
                message={`Reviewing: ${selectedBudgetCode.name} (${selectedBudgetCode.code})`}
                description={`Budget Amount: XAF ${selectedBudgetCode.budget.toLocaleString()}`}
                type="info"
                style={{ marginBottom: '20px' }}
            />

            <Form
                form={form}
                layout="vertical"
                onFinish={handleApprovalSubmit}
            >
                <Row gutter={16}>
                <Col span={12}>
                    <Form.Item
                    name="decision"
                    label="Decision"
                    rules={[{ required: true, message: 'Please select your decision' }]}
                    >
                    <Radio.Group size="large">
                        <Radio.Button value="approved" style={{ color: '#52c41a' }}>
                        <CheckCircleOutlined /> Approve
                        </Radio.Button>
                        <Radio.Button value="rejected" style={{ color: '#ff4d4f' }}>
                        <CloseCircleOutlined /> Reject
                        </Radio.Button>
                    </Radio.Group>
                    </Form.Item>
                </Col>
                </Row>

                <Form.Item
                name="comments"
                label="Comments"
                rules={[{ required: true, message: 'Please provide your comments' }]}
                help="Please provide detailed feedback on your decision"
                >
                <TextArea
                    rows={4}
                    placeholder="Enter your approval/rejection comments..."
                    showCount
                    maxLength={500}
                />
                </Form.Item>

                <Form.Item>
                <Space>
                    <Button 
                    onClick={() => {
                        setApprovalModalVisible(false);
                        setSelectedBudgetCode(null);
                        form.resetFields();
                    }}
                    >
                    Cancel
                    </Button>
                    <Button
                    type="primary"
                    htmlType="submit"
                    loading={loading}
                    icon={<CheckCircleOutlined />}
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
        title={
            <Space>
            <FileTextOutlined />
            Budget Code Details
            </Space>
        }
        open={detailsModalVisible}
        onCancel={() => {
            setDetailsModalVisible(false);
            setSelectedBudgetCode(null);
        }}
        footer={[
            <Button key="close" onClick={() => setDetailsModalVisible(false)}>
            Close
            </Button>
        ]}
        width={900}
        >
        {selectedBudgetCode && (
            <div>
            <Descriptions bordered column={2} size="small">
                <Descriptions.Item label="Budget Code" span={2}>
                <Text code copyable>{selectedBudgetCode.code}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Budget Name" span={2}>
                <Text strong>{selectedBudgetCode.name}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Budget Amount">
                <Text strong style={{ color: '#1890ff', fontSize: '16px' }}>
                    XAF {selectedBudgetCode.budget.toLocaleString()}
                </Text>
                </Descriptions.Item>
                <Descriptions.Item label="Department">
                <Tag color="blue">{selectedBudgetCode.department}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Budget Type">
                <Tag color="green">{selectedBudgetCode.budgetType?.replace('_', ' ')}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Budget Period">
                <Tag color="purple">{selectedBudgetCode.budgetPeriod}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Budget Owner" span={2}>
                {selectedBudgetCode.budgetOwner}
                </Descriptions.Item>
                <Descriptions.Item label="Description" span={2}>
                {selectedBudgetCode.description}
                </Descriptions.Item>
                <Descriptions.Item label="Created By">
                {selectedBudgetCode.createdBy?.fullName}
                </Descriptions.Item>
                <Descriptions.Item label="Created Date">
                {new Date(selectedBudgetCode.createdAt).toLocaleDateString()}
                </Descriptions.Item>
                <Descriptions.Item label="Current Status" span={2}>
                {getStatusTag(selectedBudgetCode.approvalStatus)}
                </Descriptions.Item>
            </Descriptions>

            <Divider>Approval Process</Divider>

            {selectedBudgetCode.approvalChain && selectedBudgetCode.approvalChain.length > 0 && (
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
                        <Text strong>
                            Level {step.level}: {step.approverRole?.replace('_', ' ')?.toUpperCase()}
                        </Text>
                        <br />
                        <Text type="secondary">
                            {step.approverName || 'Pending Assignment'} 
                            {step.approverEmail && ` (${step.approverEmail})`}
                        </Text>
                        <br />
                        {step.status === 'pending' && (
                            <Tag color="orange">Awaiting Action</Tag>
                        )}
                        {step.status === 'approved' && (
                            <>
                            <Tag color="green">Approved</Tag>
                            <Text type="secondary">
                                {step.actionDate && new Date(step.actionDate).toLocaleDateString()}
                            </Text>
                            </>
                        )}
                        {step.status === 'rejected' && (
                            <>
                            <Tag color="red">Rejected</Tag>
                            <Text type="secondary">
                                {step.actionDate && new Date(step.actionDate).toLocaleDateString()}
                            </Text>
                            </>
                        )}
                        {step.comments && (
                            <div style={{ marginTop: 4, padding: '8px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
                            <Text italic>"{step.comments}"</Text>
                            </div>
                        )}
                        </div>
                    </Timeline.Item>
                    );
                })}
                </Timeline>
            )}
            </div>
        )}
        </Modal>
    </div>
    );
};

export default SupervisorBudgetCodeApprovals;