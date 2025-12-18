// components/admin/HeadApprovalPage.jsx

import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Typography,
  Tag,
  Modal,
  Form,
  Input,
  Radio,
  message,
  Badge,
  Row,
  Col,
  Statistic,
  Descriptions,
  Timeline,
  Alert,
  Divider,
  Tabs,
  Spin
} from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  ExclamationCircleOutlined,
  UserOutlined,
  DollarOutlined,
  CalendarOutlined,
  FileTextOutlined,
  TeamOutlined,
  BankOutlined,
  ShoppingCartOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import moment from 'moment';
import { headApprovalAPI } from '../../services/headApprovalAPI';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const HeadApprovalPage = () => {
  const [requisitions, setRequisitions] = useState([]);
  const [selectedRequisition, setSelectedRequisition] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [approvalModalVisible, setApprovalModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState('pending');
  const [form] = Form.useForm();

  useEffect(() => {
    loadRequisitions();
    loadStats();
  }, [activeTab]);

  const loadRequisitions = async () => {
    try {
      setLoading(true);
      const filters = {
        status: activeTab === 'pending' ? 'pending_head_approval' : null,
        tab: activeTab
      };

      const response = await headApprovalAPI.getPendingHeadApprovals(filters);
      
      if (response.success) {
        setRequisitions(response.data || []);
      } else {
        message.error(response.message || 'Failed to load requisitions');
      }
    } catch (error) {
      console.error('Error loading requisitions:', error);
      message.error('Error loading requisitions');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await headApprovalAPI.getHeadApprovalStats();
      
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleViewDetails = async (requisition) => {
    try {
      setLoading(true);
      const response = await headApprovalAPI.getRequisitionDetails(requisition.id);
      
      if (response.success) {
        setSelectedRequisition(response.data);
        setDetailModalVisible(true);
      } else {
        message.error('Failed to load requisition details');
      }
    } catch (error) {
      console.error('Error loading details:', error);
      message.error('Error loading requisition details');
    } finally {
      setLoading(false);
    }
  };

  const handleApprovalAction = (requisition, decision) => {
    setSelectedRequisition(requisition);
    form.setFieldsValue({ decision });
    setApprovalModalVisible(true);
  };

  const handleSubmitApproval = async () => {
    try {
      const values = await form.validateFields();
      setActionLoading(true);

      const response = await headApprovalAPI.processHeadApproval(
        selectedRequisition.id,
        values
      );

      if (response.success) {
        const isPettyCash = selectedRequisition.paymentMethod === 'cash';
        
        if (values.decision === 'approved' && isPettyCash) {
          message.success(
            `Requisition approved! Petty cash form ${response.data.pettyCashForm?.formNumber} has been generated.`,
            5
          );
        } else {
          message.success(
            `Requisition ${values.decision === 'approved' ? 'approved' : 'rejected'} successfully`
          );
        }
        
        form.resetFields();
        setApprovalModalVisible(false);
        setSelectedRequisition(null);
        
        // Reload data
        await loadRequisitions();
        await loadStats();
      } else {
        message.error(response.message || 'Failed to process approval');
      }
    } catch (error) {
      console.error('Error processing approval:', error);
      message.error('Failed to process approval');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusTag = (status) => {
    const statusMap = {
      'pending_head_approval': { color: 'orange', text: 'Pending Head Approval', icon: <ClockCircleOutlined /> },
      'approved': { color: 'green', text: 'Approved', icon: <CheckCircleOutlined /> },
      'rejected': { color: 'red', text: 'Rejected', icon: <CloseCircleOutlined /> }
    };
    const statusInfo = statusMap[status] || { color: 'default', text: status };
    return (
      <Tag color={statusInfo.color} icon={statusInfo.icon}>
        {statusInfo.text}
      </Tag>
    );
  };

  const getUrgencyTag = (urgency) => {
    const urgencyMap = {
      'High': 'red',
      'Medium': 'orange',
      'Low': 'green'
    };
    return <Tag color={urgencyMap[urgency]}>{urgency}</Tag>;
  };

  const getPaymentMethodTag = (method) => {
    return method === 'cash' ? (
      <Tag color="orange" icon={<DollarOutlined />}>Petty Cash</Tag>
    ) : (
      <Tag color="blue" icon={<BankOutlined />}>Bank Transfer</Tag>
    );
  };

  const columns = [
    {
      title: 'Requisition Details',
      key: 'details',
      render: (_, record) => (
        <div>
          <Text strong>{record.title}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.requisitionNumber}
          </Text>
          <br />
          <Space size="small" style={{ marginTop: '4px' }}>
            <Tag size="small">{record.category}</Tag>
            {getPaymentMethodTag(record.paymentMethod)}
          </Space>
        </div>
      ),
      width: 250
    },
    {
      title: 'Requester',
      key: 'requester',
      render: (_, record) => (
        <div>
          <Text><UserOutlined /> {record.requester}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.department}
          </Text>
        </div>
      ),
      width: 150
    },
    {
      title: 'Assigned Buyer',
      key: 'buyer',
      render: (_, record) => (
        <div>
          {record.assignedBuyer ? (
            <>
              <Text><TeamOutlined /> {record.assignedBuyer.name}</Text>
              <br />
              <Text type="secondary" style={{ fontSize: '12px' }}>
                {record.assignedBuyer.email}
              </Text>
            </>
          ) : (
            <Text type="secondary">Not assigned</Text>
          )}
        </div>
      ),
      width: 150
    },
    {
      title: 'Budget',
      dataIndex: 'budgetXAF',
      key: 'budgetXAF',
      render: (amount) => (
        <Text strong style={{ color: '#1890ff' }}>
          XAF {amount?.toLocaleString()}
        </Text>
      ),
      width: 120,
      align: 'right'
    },
    {
      title: 'Submitted',
      dataIndex: 'submittedDate',
      key: 'submittedDate',
      render: (date) => (
        <div>
          <CalendarOutlined /> {moment(date).format('MMM DD, YYYY')}
          <br />
          <Text type="secondary" style={{ fontSize: '11px' }}>
            {moment(date).fromNow()}
          </Text>
        </div>
      ),
      width: 130
    },
    {
      title: 'Urgency',
      dataIndex: 'urgency',
      key: 'urgency',
      render: (urgency) => getUrgencyTag(urgency),
      width: 100
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => getStatusTag(status),
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
          {record.status === 'pending_head_approval' && (
            <>
              <Button
                size="small"
                type="primary"
                icon={<CheckCircleOutlined />}
                onClick={() => handleApprovalAction(record, 'approved')}
              >
                Approve
              </Button>
              <Button
                size="small"
                danger
                icon={<CloseCircleOutlined />}
                onClick={() => handleApprovalAction(record, 'rejected')}
              >
                Reject
              </Button>
            </>
          )}
        </Space>
      ),
      width: 220,
      fixed: 'right'
    }
  ];

  const renderStats = () => {
    if (!stats) return null;

    return (
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col span={6}>
          <Statistic
            title="Pending Approval"
            value={stats.pending}
            prefix={<ClockCircleOutlined />}
            valueStyle={{ color: '#faad14' }}
          />
        </Col>
        <Col span={6}>
          <Statistic
            title="Approved Today"
            value={stats.approvedToday}
            prefix={<CheckCircleOutlined />}
            valueStyle={{ color: '#52c41a' }}
          />
        </Col>
        <Col span={6}>
          <Statistic
            title="Total Value (Pending)"
            value={stats.totalPendingValue}
            prefix="XAF"
            formatter={(value) => value.toLocaleString()}
            valueStyle={{ color: '#1890ff' }}
          />
        </Col>
        <Col span={6}>
          <Statistic
            title="Petty Cash Forms"
            value={stats.pettyCashFormsGenerated}
            prefix={<FileTextOutlined />}
            valueStyle={{ color: '#722ed1' }}
          />
        </Col>
      </Row>
    );
  };

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <Title level={2} style={{ margin: 0 }}>
            <CheckCircleOutlined /> Head Approval - Purchase Requisitions
          </Title>
          <Button icon={<FileTextOutlined />} onClick={loadRequisitions}>
            Refresh
          </Button>
        </div>

        {stats && stats.pending > 0 && (
          <Alert
            message={`${stats.pending} Requisition${stats.pending !== 1 ? 's' : ''} Awaiting Your Approval`}
            description="These requisitions have been reviewed by supply chain and are ready for final approval. Please review and approve to proceed with procurement."
            type="warning"
            showIcon
            icon={<ExclamationCircleOutlined />}
            closable
            style={{ marginBottom: '24px' }}
          />
        )}

        {renderStats()}

        <Tabs activeKey={activeTab} onChange={setActiveTab} style={{ marginBottom: '16px' }}>
          <Tabs.TabPane
            tab={
              <Badge count={stats?.pending || 0} offset={[10, 0]}>
                <span><ClockCircleOutlined /> Pending Approval</span>
              </Badge>
            }
            key="pending"
          />
          <Tabs.TabPane
            tab={<span><CheckCircleOutlined /> Approved</span>}
            key="approved"
          />
          <Tabs.TabPane
            tab={<span><CloseCircleOutlined /> Rejected</span>}
            key="rejected"
          />
          <Tabs.TabPane
            tab={<span>All Requisitions</span>}
            key="all"
          />
        </Tabs>

        <Table
          columns={columns}
          dataSource={requisitions}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} requisitions`
          }}
          scroll={{ x: 'max-content' }}
        />
      </Card>

      {/* Details Modal */}
      <Modal
        title={
          <Space>
            <FileTextOutlined />
            Requisition Details
          </Space>
        }
        open={detailModalVisible}
        onCancel={() => {
          setDetailModalVisible(false);
          setSelectedRequisition(null);
        }}
        width={900}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            Close
          </Button>,
          selectedRequisition?.status === 'pending_head_approval' && (
            <Space key="actions">
              <Button
                danger
                icon={<CloseCircleOutlined />}
                onClick={() => {
                  setDetailModalVisible(false);
                  handleApprovalAction(selectedRequisition, 'rejected');
                }}
              >
                Reject
              </Button>
              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                onClick={() => {
                  setDetailModalVisible(false);
                  handleApprovalAction(selectedRequisition, 'approved');
                }}
              >
                Approve
              </Button>
            </Space>
          )
        ]}
      >
        {selectedRequisition && (
          <div>
            {/* Requisition Summary */}
            <Card size="small" title="Requisition Information" style={{ marginBottom: '16px' }}>
              <Descriptions column={2} size="small">
                <Descriptions.Item label="Requisition Number">
                  <Text code>{selectedRequisition.requisitionNumber}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Status">
                  {getStatusTag(selectedRequisition.status)}
                </Descriptions.Item>
                <Descriptions.Item label="Title">
                  {selectedRequisition.title}
                </Descriptions.Item>
                <Descriptions.Item label="Category">
                  <Tag>{selectedRequisition.category}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Requester">
                  <UserOutlined /> {selectedRequisition.requester}
                </Descriptions.Item>
                <Descriptions.Item label="Department">
                  {selectedRequisition.department}
                </Descriptions.Item>
                <Descriptions.Item label="Budget">
                  <Text strong style={{ color: '#1890ff' }}>
                    XAF {selectedRequisition.budgetXAF?.toLocaleString()}
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="Urgency">
                  {getUrgencyTag(selectedRequisition.urgency)}
                </Descriptions.Item>
                <Descriptions.Item label="Payment Method">
                  {getPaymentMethodTag(selectedRequisition.paymentMethod)}
                </Descriptions.Item>
                <Descriptions.Item label="Expected Delivery">
                  <CalendarOutlined /> {moment(selectedRequisition.expectedDeliveryDate).format('MMM DD, YYYY')}
                </Descriptions.Item>
              </Descriptions>
            </Card>

            {/* Buyer Assignment */}
            {selectedRequisition.assignedBuyer && (
              <Card size="small" title="Buyer Assignment" style={{ marginBottom: '16px' }}>
                <Descriptions column={2} size="small">
                  <Descriptions.Item label="Assigned Buyer">
                    <TeamOutlined /> {selectedRequisition.assignedBuyer.name}
                  </Descriptions.Item>
                  <Descriptions.Item label="Email">
                    {selectedRequisition.assignedBuyer.email}
                  </Descriptions.Item>
                  <Descriptions.Item label="Assignment Date">
                    {moment(selectedRequisition.buyerAssignmentDate).format('MMM DD, YYYY HH:mm')}
                  </Descriptions.Item>
                  <Descriptions.Item label="Sourcing Type">
                    <Tag>{selectedRequisition.sourcingType?.replace(/_/g, ' ').toUpperCase()}</Tag>
                  </Descriptions.Item>
                </Descriptions>
              </Card>
            )}

            {/* Payment Method Details */}
            {selectedRequisition.paymentMethod === 'cash' && (
              <Alert
                message="Petty Cash Payment"
                description={
                  <div>
                    <p>This requisition will be paid through petty cash.</p>
                    <ul style={{ marginBottom: 0, paddingLeft: '20px' }}>
                      <li>Upon approval, a petty cash form will be automatically generated</li>
                      <li>The assigned buyer will be notified to download the form</li>
                      <li>Form number will follow format: PC-YYYY-NNNNNN</li>
                      <li>Buyer can optionally create RFQ if needed</li>
                    </ul>
                  </div>
                }
                type="info"
                showIcon
                style={{ marginBottom: '16px' }}
              />
            )}

            {/* Items List */}
            <Card size="small" title="Items Requested" style={{ marginBottom: '16px' }}>
              <Table
                columns={[
                  {
                    title: 'Description',
                    dataIndex: 'description',
                    key: 'description'
                  },
                  {
                    title: 'Quantity',
                    dataIndex: 'quantity',
                    key: 'quantity',
                    width: 80,
                    align: 'center'
                  },
                  {
                    title: 'Unit',
                    dataIndex: 'measuringUnit',
                    key: 'measuringUnit',
                    width: 80,
                    align: 'center'
                  },
                  {
                    title: 'Est. Price',
                    dataIndex: 'estimatedPrice',
                    key: 'estimatedPrice',
                    width: 120,
                    align: 'right',
                    render: (price) => price ? `XAF ${price.toLocaleString()}` : 'TBD'
                  }
                ]}
                dataSource={selectedRequisition.items}
                pagination={false}
                size="small"
              />
            </Card>

            {/* Justification */}
            <Card size="small" title="Justification" style={{ marginBottom: '16px' }}>
              <Paragraph>{selectedRequisition.justification}</Paragraph>
            </Card>

            {/* Approval History */}
            <Card size="small" title="Approval History">
              <Timeline>
                {selectedRequisition.approvalChain?.map((step, index) => (
                  <Timeline.Item
                    key={index}
                    color={
                      step.status === 'approved' ? 'green' :
                      step.status === 'rejected' ? 'red' : 'gray'
                    }
                  >
                    <div>
                      <Text strong>Level {step.level}: {step.approver.name}</Text>
                      <br />
                      <Text type="secondary">{step.approver.role}</Text>
                      <br />
                      <Tag color={
                        step.status === 'approved' ? 'green' :
                        step.status === 'rejected' ? 'red' : 'orange'
                      }>
                        {step.status.toUpperCase()}
                      </Tag>
                      {step.actionDate && (
                        <Text type="secondary" style={{ marginLeft: '8px' }}>
                          {moment(step.actionDate).format('MMM DD, YYYY')} {step.actionTime}
                        </Text>
                      )}
                      {step.comments && (
                        <div style={{ marginTop: '4px' }}>
                          <Text style={{ fontSize: '12px' }}>{step.comments}</Text>
                        </div>
                      )}
                    </div>
                  </Timeline.Item>
                ))}
              </Timeline>
            </Card>
          </div>
        )}
      </Modal>

      {/* Approval Action Modal */}
      <Modal
        title={
          <Space>
            {form.getFieldValue('decision') === 'approved' ? (
              <CheckCircleOutlined style={{ color: '#52c41a' }} />
            ) : (
              <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
            )}
            {form.getFieldValue('decision') === 'approved' ? 'Approve' : 'Reject'} Requisition
          </Space>
        }
        open={approvalModalVisible}
        onCancel={() => {
          setApprovalModalVisible(false);
          setSelectedRequisition(null);
          form.resetFields();
        }}
        onOk={handleSubmitApproval}
        confirmLoading={actionLoading}
        okText="Confirm"
        okButtonProps={{
          danger: form.getFieldValue('decision') === 'rejected'
        }}
        width={600}
      >
        {selectedRequisition && (
          <div>
            <Card size="small" style={{ marginBottom: '16px', backgroundColor: '#fafafa' }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  <Text strong>Requisition:</Text> {selectedRequisition.title}
                </div>
                <div>
                  <Text strong>Number:</Text> <Text code>{selectedRequisition.requisitionNumber}</Text>
                </div>
                <div>
                  <Text strong>Requester:</Text> {selectedRequisition.requester}
                </div>
                <div>
                  <Text strong>Amount:</Text>{' '}
                  <Text strong style={{ color: '#1890ff' }}>
                    XAF {selectedRequisition.budgetXAF?.toLocaleString()}
                  </Text>
                </div>
                <div>
                  <Text strong>Payment Method:</Text>{' '}
                  {getPaymentMethodTag(selectedRequisition.paymentMethod)}
                </div>
              </Space>
            </Card>

            <Form form={form} layout="vertical">
              <Form.Item
                name="decision"
                label="Decision"
                rules={[{ required: true }]}
                hidden
              >
                <Input />
              </Form.Item>

              <Form.Item
                name="comments"
                label="Comments"
                rules={[
                  {
                    required: form.getFieldValue('decision') === 'rejected',
                    message: 'Please provide rejection reason'
                  }
                ]}
                extra={
                  form.getFieldValue('decision') === 'approved'
                    ? 'Optional: Add any special instructions or notes'
                    : 'Required: Explain why this requisition is being rejected'
                }
              >
                <TextArea
                  rows={4}
                  placeholder={
                    form.getFieldValue('decision') === 'approved'
                      ? 'Enter any special instructions for procurement...'
                      : 'Enter rejection reason...'
                  }
                  showCount
                  maxLength={500}
                />
              </Form.Item>
            </Form>

            {form.getFieldValue('decision') === 'approved' && selectedRequisition.paymentMethod === 'cash' && (
              <Alert
                message="Petty Cash Form Will Be Generated"
                description={
                  <div>
                    <p>Upon approval, the following will happen automatically:</p>
                    <ol style={{ marginBottom: 0, paddingLeft: '20px' }}>
                      <li>A petty cash form will be generated with a unique form number (PC-YYYY-NNNNNN)</li>
                      <li>The assigned buyer ({selectedRequisition.assignedBuyer?.name}) will be notified via email</li>
                      <li>The requester ({selectedRequisition.requester}) will be notified of approval</li>
                      <li>The buyer can download the form from their dashboard</li>
                      <li>The requisition will move to approved status</li>
                    </ol>
                  </div>
                }
                type="info"
                showIcon
                style={{ marginTop: '16px' }}
              />
            )}

            {form.getFieldValue('decision') === 'approved' && selectedRequisition.paymentMethod === 'bank' && (
              <Alert
                message="Standard Procurement Process"
                description="This requisition will proceed through the standard procurement process with bank transfer payment. The assigned buyer will create RFQs and manage the sourcing process."
                type="info"
                showIcon
                style={{ marginTop: '16px' }}
              />
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default HeadApprovalPage;