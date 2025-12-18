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
  Tooltip,
  Divider
} from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  EyeOutlined,
  SwapOutlined,
  ReloadOutlined,
  PlusOutlined,
  BarChartOutlined,
  ArrowRightOutlined,
  FileExcelOutlined
} from '@ant-design/icons';
import api from '../../services/api';
import { exportTransfersToExcel } from '../../services/exportService';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const BudgetTransfersList = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [transfers, setTransfers] = useState([]);
  const [pendingTransfers, setPendingTransfers] = useState([]);
  const [selectedTransfer, setSelectedTransfer] = useState(null);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [approvalModalVisible, setApprovalModalVisible] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    cancelled: 0,
    total: 0,
    totalPendingAmount: 0,
    totalApprovedAmount: 0
  });

  const [approvalForm] = Form.useForm();

  useEffect(() => {
    fetchTransfers();
    fetchPendingTransfers();
    fetchStatistics();
  }, [filterStatus]);

  const fetchTransfers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterStatus !== 'all') params.append('status', filterStatus);

      const response = await api.get(`/budget-transfers?${params}`);
      if (response.data.success) {
        setTransfers(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching transfers:', error);
      message.error('Failed to load budget transfers');
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingTransfers = async () => {
    try {
      const response = await api.get('/budget-transfers/pending');
      if (response.data.success) {
        setPendingTransfers(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching pending transfers:', error);
    }
  };

  const handleExportExcel = () => {
    const result = exportTransfersToExcel(transfers, 'budget_transfers');
    if (result.success) {
      message.success(result.message);
    } else {
      message.error(result.message);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await api.get('/budget-transfers/statistics');
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  const handleApprove = async (values) => {
    if (!selectedTransfer) return;

    try {
      setLoading(true);
      const response = await api.post(
        `/budget-transfers/${selectedTransfer._id}/approve`,
        { comments: values.comments }
      );

      if (response.data.success) {
        message.success('Budget transfer approved successfully');
        setApprovalModalVisible(false);
        approvalForm.resetFields();
        setSelectedTransfer(null);
        fetchTransfers();
        fetchPendingTransfers();
        fetchStatistics();
      }
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to approve transfer');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (values) => {
    if (!selectedTransfer) return;

    try {
      setLoading(true);
      const response = await api.post(
        `/budget-transfers/${selectedTransfer._id}/reject`,
        { rejectionReason: values.rejectionReason }
      );

      if (response.data.success) {
        message.success('Budget transfer rejected');
        setApprovalModalVisible(false);
        approvalForm.resetFields();
        setSelectedTransfer(null);
        fetchTransfers();
        fetchPendingTransfers();
        fetchStatistics();
      }
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to reject transfer');
    } finally {
      setLoading(false);
    }
  };

  const getStatusTag = (status) => {
    const statusConfig = {
      pending: { color: 'processing', icon: <ClockCircleOutlined />, text: 'Pending' },
      approved: { color: 'success', icon: <CheckCircleOutlined />, text: 'Approved' },
      rejected: { color: 'error', icon: <CloseCircleOutlined />, text: 'Rejected' },
      cancelled: { color: 'default', icon: <CloseCircleOutlined />, text: 'Cancelled' }
    };

    const config = statusConfig[status] || statusConfig.pending;
    return <Tag color={config.color} icon={config.icon}>{config.text}</Tag>;
  };

  const columns = [
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (date) => new Date(date).toLocaleDateString('en-GB'),
      sorter: (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    },
    {
      title: 'From Budget Code',
      key: 'fromBudgetCode',
      width: 180,
      render: (_, record) => (
        <div>
          <Text strong code>{record.fromBudgetCode?.code}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: '11px' }}>
            {record.fromBudgetCode?.name}
          </Text>
        </div>
      )
    },
    {
      title: '',
      key: 'arrow',
      width: 40,
      align: 'center',
      render: () => <ArrowRightOutlined style={{ color: '#1890ff' }} />
    },
    {
      title: 'To Budget Code',
      key: 'toBudgetCode',
      width: 180,
      render: (_, record) => (
        <div>
          <Text strong code>{record.toBudgetCode?.code}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: '11px' }}>
            {record.toBudgetCode?.name}
          </Text>
        </div>
      )
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      width: 130,
      render: (amount) => (
        <Text strong style={{ color: '#1890ff', fontSize: '14px' }}>
          XAF {amount.toLocaleString()}
        </Text>
      ),
      sorter: (a, b) => a.amount - b.amount
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
        { text: 'Rejected', value: 'rejected' },
        { text: 'Cancelled', value: 'cancelled' }
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
                setSelectedTransfer(record);
                setDetailsModalVisible(true);
              }}
            >
              View
            </Button>
          </Tooltip>
          {record.status === 'pending' && (
            <Tooltip title="Review Transfer">
              <Button
                size="small"
                type="primary"
                onClick={() => {
                  setSelectedTransfer(record);
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
          <SwapOutlined /> Budget Transfers
        </Title>
        <Space>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => {
              fetchTransfers();
              fetchPendingTransfers();
              fetchStatistics();
            }}
            loading={loading}
          >
            Refresh
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/finance/budget-management')}
          >
            New Transfer
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
        <Col xs={24} sm={12} lg={4}>
          <Card>
            <Statistic
              title="Pending"
              value={stats.pending}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
            <Text type="secondary" style={{ fontSize: '11px' }}>
              XAF {stats.totalPendingAmount?.toLocaleString() || 0}
            </Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <Card>
            <Statistic
              title="Approved"
              value={stats.approved}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
            <Text type="secondary" style={{ fontSize: '11px' }}>
              XAF {stats.totalApprovedAmount?.toLocaleString() || 0}
            </Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <Card>
            <Statistic
              title="Rejected"
              value={stats.rejected}
              prefix={<CloseCircleOutlined />}
              valueStyle={{ color: '#f5222d' }}
            />
            <Text type="secondary" style={{ fontSize: '11px' }}>
              XAF {stats.totalRejectedAmount?.toLocaleString() || 0}
            </Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <Card>
            <Statistic
              title="Cancelled"
              value={stats.cancelled}
              valueStyle={{ color: '#999' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <Card>
            <Statistic
              title="Total"
              value={stats.total}
              prefix={<SwapOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Pending Approvals Alert */}
      {pendingTransfers.length > 0 && (
        <Alert
          message={`${pendingTransfers.length} Transfer${pendingTransfers.length !== 1 ? 's' : ''} Awaiting Your Approval`}
          description="Review and approve budget transfer requests."
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
            <Option value="all">All Transfers</Option>
            <Option value="pending">
              <Badge status="processing" text="Pending" />
            </Option>
            <Option value="approved">
              <Badge status="success" text="Approved" />
            </Option>
            <Option value="rejected">
              <Badge status="error" text="Rejected" />
            </Option>
            <Option value="cancelled">
              <Badge status="default" text="Cancelled" />
            </Option>
          </Select>
        </Space>
      </Card>

      {/* Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={transfers}
          loading={loading}
          rowKey="_id"
          scroll={{ x: 1200 }}
          pagination={{
            showSizeChanger: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} transfers`,
          }}
        />
      </Card>

      {/* Details Modal */}
      <Modal
        title={
          <Space>
            <EyeOutlined />
            Budget Transfer Details
          </Space>
        }
        open={detailsModalVisible}
        onCancel={() => {
          setDetailsModalVisible(false);
          setSelectedTransfer(null);
        }}
        footer={[
          <Button
            key="close"
            onClick={() => {
              setDetailsModalVisible(false);
              setSelectedTransfer(null);
            }}
          >
            Close
          </Button>
        ]}
        width={700}
      >
        {selectedTransfer && (
          <div>
            {/* Transfer Overview */}
            <Card size="small" title="Transfer Overview" style={{ marginBottom: '20px' }}>
              <Row gutter={16} align="middle">
                <Col span={10}>
                  <div style={{ textAlign: 'center', padding: '10px', backgroundColor: '#fff2e8', borderRadius: '5px' }}>
                    <Text type="secondary">From</Text>
                    <br />
                    <Text strong code style={{ fontSize: '16px' }}>
                      {selectedTransfer.fromBudgetCode?.code}
                    </Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: '11px' }}>
                      {selectedTransfer.fromBudgetCode?.name}
                    </Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: '11px' }}>
                      Available: XAF {selectedTransfer.fromBudgetCode?.remaining?.toLocaleString()}
                    </Text>
                  </div>
                </Col>
                <Col span={4} style={{ textAlign: 'center' }}>
                  <ArrowRightOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
                  <br />
                  <Text strong style={{ color: '#1890ff', fontSize: '16px' }}>
                    XAF {selectedTransfer.amount?.toLocaleString()}
                  </Text>
                </Col>
                <Col span={10}>
                  <div style={{ textAlign: 'center', padding: '10px', backgroundColor: '#f6ffed', borderRadius: '5px' }}>
                    <Text type="secondary">To</Text>
                    <br />
                    <Text strong code style={{ fontSize: '16px' }}>
                      {selectedTransfer.toBudgetCode?.code}
                    </Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: '11px' }}>
                      {selectedTransfer.toBudgetCode?.name}
                    </Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: '11px' }}>
                      Current: XAF {selectedTransfer.toBudgetCode?.budget?.toLocaleString()}
                    </Text>
                  </div>
                </Col>
              </Row>
            </Card>

            {/* Transfer Details */}
            <Card size="small" title="Request Information" style={{ marginBottom: '20px' }}>
              <Descriptions column={2} size="small">
                <Descriptions.Item label="Requested By">
                  {selectedTransfer.requestedBy?.fullName}
                </Descriptions.Item>
                <Descriptions.Item label="Request Date">
                  {new Date(selectedTransfer.createdAt).toLocaleDateString('en-GB')}
                </Descriptions.Item>
                <Descriptions.Item label="Transfer Amount" span={2}>
                  <Text strong style={{ fontSize: '16px', color: '#1890ff' }}>
                    XAF {selectedTransfer.amount?.toLocaleString()}
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="Status" span={2}>
                  {getStatusTag(selectedTransfer.status)}
                </Descriptions.Item>
                <Descriptions.Item label="Reason" span={2}>
                  <Text>{selectedTransfer.reason}</Text>
                </Descriptions.Item>
              </Descriptions>
            </Card>

            {/* Approval Chain */}
            {selectedTransfer.approvalChain && selectedTransfer.approvalChain.length > 0 && (
              <Card size="small" title="Approval Progress">
                <Timeline>
                  {selectedTransfer.approvalChain.map((step, index) => {
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

            {/* Status Alerts */}
            {selectedTransfer.status === 'approved' && selectedTransfer.executedDate && (
              <Alert
                message="Transfer Executed"
                description={`Transfer completed on ${new Date(selectedTransfer.executedDate).toLocaleDateString('en-GB')}`}
                type="success"
                showIcon
                style={{ marginTop: '20px' }}
              />
            )}

            {selectedTransfer.status === 'rejected' && selectedTransfer.rejectionReason && (
              <Alert
                message="Transfer Rejected"
                description={
                  <div>
                    <Text><strong>Reason:</strong> {selectedTransfer.rejectionReason}</Text>
                    <br />
                    <Text type="secondary">
                      Rejected on {new Date(selectedTransfer.rejectionDate).toLocaleDateString('en-GB')}
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
            <SwapOutlined />
            Review Budget Transfer
          </Space>
        }
        open={approvalModalVisible}
        onCancel={() => {
          setApprovalModalVisible(false);
          setSelectedTransfer(null);
          approvalForm.resetFields();
        }}
        footer={null}
        width={600}
      >
        {selectedTransfer && (
          <>
            <Alert
              message="Transfer Request"
              description={
                <div>
                  <Row gutter={16}>
                    <Col span={11}>
                      <Text strong>From:</Text> {selectedTransfer.fromBudgetCode?.code}
                      <br />
                      <Text type="secondary" style={{ fontSize: '11px' }}>
                        Available: XAF {selectedTransfer.fromBudgetCode?.remaining?.toLocaleString()}
                      </Text>
                    </Col>
                    <Col span={2} style={{ textAlign: 'center' }}>
                      <ArrowRightOutlined style={{ fontSize: '20px', color: '#1890ff' }} />
                    </Col>
                    <Col span={11}>
                      <Text strong>To:</Text> {selectedTransfer.toBudgetCode?.code}
                    </Col>
                  </Row>
                  <Divider style={{ margin: '12px 0' }} />
                  <Text strong>Amount: </Text>
                  <Text style={{ fontSize: '16px', color: '#1890ff' }}>
                    XAF {selectedTransfer.amount?.toLocaleString()}
                  </Text>
                </div>
              }
              type="info"
              showIcon
              style={{ marginBottom: '20px' }}
            />

            <Card size="small" style={{ marginBottom: '20px' }}>
              <Text strong>Reason for Transfer:</Text>
              <br />
              <Text>{selectedTransfer.reason}</Text>
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
                      setSelectedTransfer(null);
                      approvalForm.resetFields();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    danger
                    onClick={() => {
                      Modal.confirm({
                        title: 'Reject Budget Transfer',
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

export default BudgetTransfersList;