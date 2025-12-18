import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Typography,
  message,
  Modal,
  Form,
  Input,
  Alert,
  Descriptions,
  Timeline,
  Row,
  Col,
  Statistic,
  Select,
  Badge,
  Tooltip
} from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  EyeOutlined,
  FileTextOutlined,
  ReloadOutlined,
  FilterOutlined,
  BarChartOutlined,
  FileExcelOutlined
} from '@ant-design/icons';
import api from '../../services/api';
import { exportRevisionsToExcel } from '../../services/exportService';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const BudgetRevisionsList = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [revisions, setRevisions] = useState([]);
  const [pendingRevisions, setPendingRevisions] = useState([]);
  const [selectedRevision, setSelectedRevision] = useState(null);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [approvalModalVisible, setApprovalModalVisible] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    total: 0
  });

  const [approvalForm] = Form.useForm();

  useEffect(() => {
    fetchRevisions();
    fetchPendingRevisions();
  }, [filterStatus]);

  const fetchRevisions = async () => {
    try {
      setLoading(true);
      // Get all budget codes with their revisions
      const response = await api.get('/budget-codes?active=true');
      
      if (response.data.success) {
        const allRevisions = [];
        let pendingCount = 0;
        let approvedCount = 0;
        let rejectedCount = 0;

        response.data.data.forEach(budgetCode => {
          if (budgetCode.budgetRevisions && budgetCode.budgetRevisions.length > 0) {
            budgetCode.budgetRevisions.forEach(revision => {
              allRevisions.push({
                ...revision,
                budgetCode: {
                  _id: budgetCode._id,
                  code: budgetCode.code,
                  name: budgetCode.name,
                  currentBudget: budgetCode.budget
                }
              });

              if (revision.status === 'pending') pendingCount++;
              else if (revision.status === 'approved') approvedCount++;
              else if (revision.status === 'rejected') rejectedCount++;
            });
          }
        });

        // Sort by date (most recent first)
        allRevisions.sort((a, b) => new Date(b.requestDate) - new Date(a.requestDate));

        setRevisions(allRevisions);
        setStats({
          pending: pendingCount,
          approved: approvedCount,
          rejected: rejectedCount,
          total: allRevisions.length
        });
      }
    } catch (error) {
      console.error('Error fetching revisions:', error);
      message.error('Failed to load budget revisions');
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingRevisions = async () => {
    try {
      const response = await api.get('/budget-codes/revisions/pending');
      if (response.data.success) {
        setPendingRevisions(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching pending revisions:', error);
    }
  };

  const handleExportExcel = () => {
    const result = exportRevisionsToExcel(getFilteredRevisions(), 'budget_revisions');
    if (result.success) {
        message.success(result.message);
    } else {
        message.error(result.message);
    }
  };

  const handleApprove = async (values) => {
    if (!selectedRevision) return;

    try {
      setLoading(true);
      const response = await api.post(
        `/budget-codes/${selectedRevision.budgetCode._id}/revisions/${selectedRevision._id}/approve`,
        { comments: values.comments }
      );

      if (response.data.success) {
        message.success('Budget revision approved successfully');
        setApprovalModalVisible(false);
        approvalForm.resetFields();
        setSelectedRevision(null);
        fetchRevisions();
        fetchPendingRevisions();
      }
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to approve revision');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (values) => {
    if (!selectedRevision) return;

    try {
      setLoading(true);
      const response = await api.post(
        `/budget-codes/${selectedRevision.budgetCode._id}/revisions/${selectedRevision._id}/reject`,
        { rejectionReason: values.rejectionReason }
      );

      if (response.data.success) {
        message.success('Budget revision rejected');
        setApprovalModalVisible(false);
        approvalForm.resetFields();
        setSelectedRevision(null);
        fetchRevisions();
        fetchPendingRevisions();
      }
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to reject revision');
    } finally {
      setLoading(false);
    }
  };

  const getStatusTag = (status) => {
    const statusConfig = {
      pending: { color: 'processing', icon: <ClockCircleOutlined />, text: 'Pending' },
      approved: { color: 'success', icon: <CheckCircleOutlined />, text: 'Approved' },
      rejected: { color: 'error', icon: <CloseCircleOutlined />, text: 'Rejected' }
    };

    const config = statusConfig[status] || statusConfig.pending;
    return <Tag color={config.color} icon={config.icon}>{config.text}</Tag>;
  };

  const getFilteredRevisions = () => {
    if (filterStatus === 'all') return revisions;
    return revisions.filter(r => r.status === filterStatus);
  };

  const columns = [
    {
      title: 'Request Date',
      dataIndex: 'requestDate',
      key: 'requestDate',
      width: 120,
      render: (date) => new Date(date).toLocaleDateString('en-GB'),
      sorter: (a, b) => new Date(b.requestDate) - new Date(a.requestDate)
    },
    {
      title: 'Budget Code',
      key: 'budgetCode',
      width: 200,
      render: (_, record) => (
        <div>
          <Text strong code>{record.budgetCode.code}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: '11px' }}>
            {record.budgetCode.name}
          </Text>
        </div>
      )
    },
    {
      title: 'Current Budget',
      dataIndex: 'previousBudget',
      key: 'previousBudget',
      width: 130,
      render: (amount) => (
        <Text>XAF {amount.toLocaleString()}</Text>
      )
    },
    {
      title: 'Requested Budget',
      dataIndex: 'requestedBudget',
      key: 'requestedBudget',
      width: 130,
      render: (amount) => (
        <Text strong style={{ color: '#1890ff' }}>
          XAF {amount.toLocaleString()}
        </Text>
      )
    },
    {
      title: 'Change',
      dataIndex: 'changeAmount',
      key: 'changeAmount',
      width: 130,
      render: (change) => (
        <Tag color={change > 0 ? 'green' : 'orange'}>
          {change > 0 ? '+' : ''}XAF {Math.abs(change).toLocaleString()}
        </Tag>
      ),
      sorter: (a, b) => Math.abs(b.changeAmount) - Math.abs(a.changeAmount)
    },
    {
      title: 'Requested By',
      key: 'requestedBy',
      width: 150,
      render: (_, record) => (
        <div>
          <Text>{record.requestedBy?.fullName || 'N/A'}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: '11px' }}>
            {record.requestedBy?.department || ''}
          </Text>
        </div>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status) => getStatusTag(status),
      filters: [
        { text: 'Pending', value: 'pending' },
        { text: 'Approved', value: 'approved' },
        { text: 'Rejected', value: 'rejected' }
      ],
      onFilter: (value, record) => record.status === value
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 200,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="View Details">
            <Button
              size="small"
              icon={<EyeOutlined />}
              onClick={() => {
                setSelectedRevision(record);
                setDetailsModalVisible(true);
              }}
            >
              View
            </Button>
          </Tooltip>
          {record.status === 'pending' && (
            <Tooltip title="Review Request">
              <Button
                size="small"
                type="primary"
                onClick={() => {
                  setSelectedRevision(record);
                  approvalForm.resetFields();
                  setApprovalModalVisible(true);
                }}
              >
                Review
              </Button>
            </Tooltip>
          )}
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <Title level={2} style={{ margin: 0 }}>
          <FileTextOutlined /> Budget Revisions
        </Title>
        <Space>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => {
              fetchRevisions();
              fetchPendingRevisions();
            }}
            loading={loading}
          >
            Refresh
          </Button>
          <Button
            icon={<BarChartOutlined />}
            onClick={() => navigate('/finance/budget-management')}
          >
            Dashboard
          </Button>
          <Button
                icon={<FileExcelOutlined />}
                onClick={handleExportExcel}
          >
                Export Excel
          </Button>
        </Space>
      </div>

      {/* Statistics */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Pending"
              value={stats.pending}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Approved"
              value={stats.approved}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Rejected"
              value={stats.rejected}
              prefix={<CloseCircleOutlined />}
              valueStyle={{ color: '#f5222d' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Total"
              value={stats.total}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Pending Approvals Alert */}
      {pendingRevisions.length > 0 && (
        <Alert
          message={`${pendingRevisions.length} Revision${pendingRevisions.length !== 1 ? 's' : ''} Awaiting Your Approval`}
          description="Review and approve budget revision requests from your team."
          type="warning"
          showIcon
          action={
            <Button
              size="small"
              type="primary"
              onClick={() => setFilterStatus('pending')}
            >
              View Pending
            </Button>
          }
          style={{ marginBottom: '24px' }}
        />
      )}

      {/* Filters */}
      <Card size="small" style={{ marginBottom: '16px' }}>
        <Space>
          <Text strong>Filter by Status:</Text>
          <Select
            value={filterStatus}
            onChange={setFilterStatus}
            style={{ width: 200 }}
          >
            <Option value="all">All Revisions</Option>
            <Option value="pending">
              <Badge status="processing" text="Pending" />
            </Option>
            <Option value="approved">
              <Badge status="success" text="Approved" />
            </Option>
            <Option value="rejected">
              <Badge status="error" text="Rejected" />
            </Option>
          </Select>
        </Space>
      </Card>

      {/* Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={getFilteredRevisions()}
          loading={loading}
          rowKey="_id"
          scroll={{ x: 1200 }}
          pagination={{
            showSizeChanger: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} revisions`,
          }}
        />
      </Card>

      {/* Details Modal */}
      <Modal
        title={
          <Space>
            <EyeOutlined />
            Budget Revision Details
          </Space>
        }
        open={detailsModalVisible}
        onCancel={() => {
          setDetailsModalVisible(false);
          setSelectedRevision(null);
        }}
        footer={[
          <Button
            key="close"
            onClick={() => {
              setDetailsModalVisible(false);
              setSelectedRevision(null);
            }}
          >
            Close
          </Button>
        ]}
        width={700}
      >
        {selectedRevision && (
          <div>
            <Alert
              message="Budget Information"
              description={
                <Descriptions column={2} size="small">
                  <Descriptions.Item label="Budget Code">
                    <Text code strong>{selectedRevision.budgetCode.code}</Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="Name">
                    {selectedRevision.budgetCode.name}
                  </Descriptions.Item>
                  <Descriptions.Item label="Current Budget">
                    XAF {selectedRevision.budgetCode.currentBudget.toLocaleString()}
                  </Descriptions.Item>
                  <Descriptions.Item label="Status">
                    {getStatusTag(selectedRevision.status)}
                  </Descriptions.Item>
                </Descriptions>
              }
              type="info"
              showIcon
              style={{ marginBottom: '20px' }}
            />

            <Card size="small" title="Revision Details" style={{ marginBottom: '20px' }}>
              <Descriptions column={2} size="small">
                <Descriptions.Item label="Previous Budget">
                  XAF {selectedRevision.previousBudget.toLocaleString()}
                </Descriptions.Item>
                <Descriptions.Item label="Requested Budget">
                  <Text strong style={{ color: '#1890ff' }}>
                    XAF {selectedRevision.requestedBudget.toLocaleString()}
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="Change Amount" span={2}>
                  <Tag color={selectedRevision.changeAmount > 0 ? 'green' : 'orange'} style={{ fontSize: '14px' }}>
                    {selectedRevision.changeAmount > 0 ? '+' : ''}
                    XAF {Math.abs(selectedRevision.changeAmount).toLocaleString()}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Requested By">
                  {selectedRevision.requestedBy?.fullName || 'N/A'}
                </Descriptions.Item>
                <Descriptions.Item label="Request Date">
                  {new Date(selectedRevision.requestDate).toLocaleDateString('en-GB')}
                </Descriptions.Item>
                <Descriptions.Item label="Reason" span={2}>
                  <Text>{selectedRevision.reason}</Text>
                </Descriptions.Item>
              </Descriptions>
            </Card>

            {selectedRevision.approvalChain && selectedRevision.approvalChain.length > 0 && (
              <Card size="small" title="Approval Progress">
                <Timeline>
                  {selectedRevision.approvalChain.map((step, index) => {
                    const color = step.status === 'approved' ? 'green' :
                                 step.status === 'rejected' ? 'red' : 'gray';
                    const icon = step.status === 'approved' ? <CheckCircleOutlined /> :
                                step.status === 'rejected' ? <CloseCircleOutlined /> :
                                <ClockCircleOutlined />;

                    return (
                      <Timeline.Item key={index} color={color} dot={icon}>
                        <Text strong>Level {step.level}: {step.approver.name}</Text>
                        <br />
                        <Text type="secondary">{step.approver.role}</Text>
                        <br />
                        <Tag color={color}>{step.status.toUpperCase()}</Tag>
                        {step.actionDate && (
                          <>
                            <br />
                            <Text type="secondary" style={{ fontSize: '11px' }}>
                              {new Date(step.actionDate).toLocaleDateString()} at {step.actionTime}
                            </Text>
                          </>
                        )}
                        {step.comments && (
                          <div style={{ marginTop: 4 }}>
                            <Text italic>"{step.comments}"</Text>
                          </div>
                        )}
                      </Timeline.Item>
                    );
                  })}
                </Timeline>
              </Card>
            )}

            {selectedRevision.status === 'approved' && selectedRevision.approvalDate && (
              <Alert
                message="Revision Approved"
                description={`Approved on ${new Date(selectedRevision.approvalDate).toLocaleDateString('en-GB')}`}
                type="success"
                showIcon
                style={{ marginTop: '20px' }}
              />
            )}

            {selectedRevision.status === 'rejected' && selectedRevision.rejectionReason && (
              <Alert
                message="Revision Rejected"
                description={
                  <div>
                    <Text><strong>Reason:</strong> {selectedRevision.rejectionReason}</Text>
                    <br />
                    <Text type="secondary">
                      Rejected on {new Date(selectedRevision.rejectionDate).toLocaleDateString('en-GB')}
                    </Text>
                  </div>
                }
                type="error"
                showIcon
                style={{ marginTop: '20px' }}
              />
            )}
          </div>
        )}
      </Modal>

      {/* Approval Modal */}
      <Modal
        title={
          <Space>
            <FileTextOutlined />
            Review Budget Revision
          </Space>
        }
        open={approvalModalVisible}
        onCancel={() => {
          setApprovalModalVisible(false);
          setSelectedRevision(null);
          approvalForm.resetFields();
        }}
        footer={null}
        width={600}
      >
        {selectedRevision && (
          <>
            <Alert
              message="Revision Request"
              description={
                <div>
                  <Text><strong>Budget Code:</strong> {selectedRevision.budgetCode.code}</Text>
                  <br />
                  <Text><strong>Current:</strong> XAF {selectedRevision.previousBudget.toLocaleString()}</Text>
                  <br />
                  <Text><strong>Requested:</strong> XAF {selectedRevision.requestedBudget.toLocaleString()}</Text>
                  <br />
                  <Text><strong>Change:</strong> </Text>
                  <Tag color={selectedRevision.changeAmount > 0 ? 'green' : 'orange'}>
                    {selectedRevision.changeAmount > 0 ? '+' : ''}
                    XAF {Math.abs(selectedRevision.changeAmount).toLocaleString()}
                  </Tag>
                </div>
              }
              type="info"
              showIcon
              style={{ marginBottom: '20px' }}
            />

            <Card size="small" style={{ marginBottom: '20px' }}>
              <Text strong>Reason for Revision:</Text>
              <br />
              <Text>{selectedRevision.reason}</Text>
            </Card>

            <Form
              form={approvalForm}
              layout="vertical"
            >
              <Form.Item
                name="comments"
                label="Comments (Optional)"
              >
                <TextArea
                  rows={3}
                  placeholder="Add any comments or recommendations..."
                  showCount
                  maxLength={300}
                />
              </Form.Item>

              <Form.Item>
                <Space>
                  <Button
                    onClick={() => {
                      setApprovalModalVisible(false);
                      setSelectedRevision(null);
                      approvalForm.resetFields();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    danger
                    onClick={() => {
                      Modal.confirm({
                        title: 'Reject Budget Revision',
                        content: (
                          <Form>
                            <Form.Item
                              label="Rejection Reason"
                              required
                            >
                              <TextArea
                                rows={3}
                                placeholder="Please provide a reason for rejection..."
                                id="rejectionReason"
                              />
                            </Form.Item>
                          </Form>
                        ),
                        okText: 'Reject',
                        okType: 'danger',
                        cancelText: 'Cancel',
                        onOk: () => {
                          const reason = document.getElementById('rejectionReason').value;
                          if (!reason) {
                            message.error('Please provide a rejection reason');
                            return Promise.reject();
                          }
                          return handleReject({ rejectionReason: reason });
                        }
                      });
                    }}
                  >
                    Reject
                  </Button>
                  <Button
                    type="primary"
                    loading={loading}
                    onClick={() => {
                      approvalForm.validateFields().then(values => {
                        handleApprove(values);
                      });
                    }}
                  >
                    Approve
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </>
        )}
      </Modal>
    </div>
  );
};

export default BudgetRevisionsList;