import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Typography,
  Modal,
  Form,
  InputNumber,
  Input,
  message,
  Statistic,
  Row,
  Col,
  Alert,
  Progress,
  Tooltip,
  Badge
} from 'antd';
import {
  DollarOutlined,
  SendOutlined,
  EyeOutlined,
  HistoryOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import { cashRequestAPI } from '../../services/cashRequestAPI';

const { Title, Text } = Typography;
const { TextArea } = Input;

const FinanceDisbursementPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [disbursementModalVisible, setDisbursementModalVisible] = useState(false);
  const [disbursing, setDisbursing] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchPendingDisbursements();
  }, []);

  const fetchPendingDisbursements = async () => {
    try {
      setLoading(true);
      const response = await cashRequestAPI.getPendingDisbursements();
      
      if (response.success) {
        setRequests(response.data || []);
      } else {
        message.error('Failed to load pending disbursements');
      }
    } catch (error) {
      console.error('Error fetching disbursements:', error);
      message.error('Failed to load pending disbursements');
    } finally {
      setLoading(false);
    }
  };

  const showDisbursementModal = (request) => {
    setSelectedRequest(request);
    form.setFieldsValue({
      amount: request.remainingBalance,
      notes: ''
    });
    setDisbursementModalVisible(true);
  };

  const handleDisbursement = async (values) => {
    try {
      setDisbursing(true);

      const response = await cashRequestAPI.processDisbursement(
        selectedRequest._id,
        {
          amount: values.amount,
          notes: values.notes
        }
      );

      if (response.success) {
        const isFullyDisbursed = response.disbursement.isFullyDisbursed;
        
        message.success({
          content: isFullyDisbursed 
            ? 'Request fully disbursed successfully!' 
            : `Partial disbursement processed (${response.disbursement.progress}%)`,
          duration: 5
        });

        setDisbursementModalVisible(false);
        form.resetFields();
        setSelectedRequest(null);
        
        // Refresh the list
        await fetchPendingDisbursements();
      }
    } catch (error) {
      console.error('Disbursement error:', error);
      message.error(error.response?.data?.message || 'Failed to process disbursement');
    } finally {
      setDisbursing(false);
    }
  };

  const columns = [
    {
      title: 'Request ID',
      dataIndex: '_id',
      key: 'requestId',
      width: 130,
      render: (id) => (
        <Text code copyable>
          REQ-{id.slice(-6).toUpperCase()}
        </Text>
      )
    },
    {
      title: 'Employee',
      dataIndex: 'employee',
      key: 'employee',
      width: 200,
      render: (employee) => (
        <div>
          <Text strong>{employee.fullName}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {employee.department}
          </Text>
        </div>
      )
    },
    {
      title: 'Type',
      dataIndex: 'requestType',
      key: 'requestType',
      width: 150,
      render: (type) => type?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 150,
      render: (status) => {
        if (status === 'approved') {
          return <Tag color="green" icon={<ClockCircleOutlined />}>Awaiting Disbursement</Tag>;
        }
        if (status === 'partially_disbursed') {
          return <Tag color="processing" icon={<DollarOutlined />}>Partially Disbursed</Tag>;
        }
        return <Tag>{status}</Tag>;
      }
    },
    {
      title: 'Approved Amount',
      dataIndex: 'amountApproved',
      key: 'amountApproved',
      width: 150,
      align: 'right',
      render: (amount, record) => (
        <div>
          <Text strong style={{ color: '#52c41a' }}>
            XAF {amount.toLocaleString()}
          </Text>
          {amount < record.amountRequested && (
            <div>
              <Tag color="orange" style={{ fontSize: '10px', marginTop: '4px' }}>
                {Math.round((amount / record.amountRequested) * 100)}% of requested
              </Tag>
            </div>
          )}
        </div>
      )
    },
    {
      title: 'Already Disbursed',
      dataIndex: 'totalDisbursed',
      key: 'totalDisbursed',
      width: 150,
      align: 'right',
      render: (amount, record) => (
        <div>
          <Text style={{ color: '#1890ff' }}>
            XAF {amount.toLocaleString()}
          </Text>
          {record.disbursements && record.disbursements.length > 0 && (
            <div>
              <Tag color="blue" style={{ fontSize: '10px', marginTop: '4px' }}>
                {record.disbursements.length} payment(s)
              </Tag>
            </div>
          )}
        </div>
      )
    },
    {
      title: 'Remaining Balance',
      dataIndex: 'remainingBalance',
      key: 'remainingBalance',
      width: 150,
      align: 'right',
      render: (amount) => (
        <Text strong style={{ color: '#fa8c16', fontSize: '16px' }}>
          XAF {amount.toLocaleString()}
        </Text>
      )
    },
    {
      title: 'Progress',
      key: 'progress',
      width: 120,
      render: (_, record) => {
        const progress = Math.round((record.totalDisbursed / record.amountApproved) * 100);
        return (
          <Tooltip title={`${progress}% disbursed`}>
            <Progress 
              percent={progress} 
              size="small"
              status={progress === 100 ? 'success' : 'active'}
            />
          </Tooltip>
        );
      }
    },
    {
      title: 'Budget Code',
      dataIndex: ['budgetAllocation', 'budgetCode'],
      key: 'budgetCode',
      width: 120,
      render: (code) => code ? <Tag color="blue">{code}</Tag> : '-'
    },
    {
      title: 'Action',
      key: 'action',
      fixed: 'right',
      width: 180,
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/finance/cash-request/${record._id}`)}
          >
            View
          </Button>
          <Button
            type="primary"
            size="small"
            icon={<SendOutlined />}
            onClick={() => showDisbursementModal(record)}
          >
            Disburse
          </Button>
        </Space>
      )
    }
  ];

  // Calculate summary statistics
  const totalAwaitingDisbursement = requests.reduce((sum, req) => sum + req.remainingBalance, 0);
  const totalApproved = requests.reduce((sum, req) => sum + req.amountApproved, 0);
  const totalAlreadyDisbursed = requests.reduce((sum, req) => sum + req.totalDisbursed, 0);

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={3}>
          <DollarOutlined /> Pending Disbursements
        </Title>
        <Text type="secondary">
          Manage approved requests awaiting full or partial disbursement
        </Text>
      </div>

      {/* Summary Statistics */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Requests"
              value={requests.length}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Approved"
              value={totalApproved}
              precision={0}
              prefix="XAF"
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Already Disbursed"
              value={totalAlreadyDisbursed}
              precision={0}
              prefix="XAF"
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Awaiting Disbursement"
              value={totalAwaitingDisbursement}
              precision={0}
              prefix="XAF"
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Alert */}
      {requests.length > 0 && (
        <Alert
          message={`${requests.length} request(s) awaiting disbursement`}
          description="Click 'Disburse' to process full or partial payments. Employees will be notified immediately."
          type="info"
          showIcon
          style={{ marginBottom: '16px' }}
        />
      )}

      {/* Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={requests}
          rowKey="_id"
          loading={loading}
          scroll={{ x: 1400 }}
          pagination={{
            pageSize: 10,
            showTotal: (total) => `Total ${total} request(s)`,
            showSizeChanger: true
          }}
          locale={{
            emptyText: (
              <div style={{ padding: '40px', textAlign: 'center' }}>
                <CheckCircleOutlined style={{ fontSize: '48px', color: '#52c41a', marginBottom: '16px' }} />
                <div>
                  <Text strong style={{ fontSize: '16px' }}>No Pending Disbursements</Text>
                </div>
                <Text type="secondary">All approved requests have been fully disbursed</Text>
              </div>
            )
          }}
        />
      </Card>

      {/* Disbursement Modal */}
      <Modal
        title={
          <Space>
            <SendOutlined />
            <span>Process Disbursement</span>
          </Space>
        }
        open={disbursementModalVisible}
        onCancel={() => {
          setDisbursementModalVisible(false);
          form.resetFields();
          setSelectedRequest(null);
        }}
        footer={null}
        width={600}
      >
        {selectedRequest && (
          <>
            <Alert
              message="Disbursement Information"
              description={
                <div>
                  <div><strong>Employee:</strong> {selectedRequest.employee.fullName}</div>
                  <div><strong>Request ID:</strong> REQ-{selectedRequest._id.slice(-6).toUpperCase()}</div>
                  <div><strong>Approved Amount:</strong> XAF {selectedRequest.amountApproved.toLocaleString()}</div>
                  <div><strong>Already Disbursed:</strong> XAF {selectedRequest.totalDisbursed.toLocaleString()}</div>
                  <div><strong>Remaining Balance:</strong> XAF {selectedRequest.remainingBalance.toLocaleString()}</div>
                </div>
              }
              type="info"
              showIcon
              style={{ marginBottom: '24px' }}
            />

            <Form
              form={form}
              layout="vertical"
              onFinish={handleDisbursement}
              initialValues={{
                amount: selectedRequest.remainingBalance,
                notes: ''
              }}
            >
              <Form.Item
                name="amount"
                label="Disbursement Amount (XAF)"
                rules={[
                  { required: true, message: 'Please enter disbursement amount' },
                  {
                    validator: (_, value) => {
                      if (value > selectedRequest.remainingBalance) {
                        return Promise.reject(`Cannot exceed remaining balance (XAF ${selectedRequest.remainingBalance.toLocaleString()})`);
                      }
                      if (value <= 0) {
                        return Promise.reject('Amount must be greater than 0');
                      }
                      return Promise.resolve();
                    }
                  }
                ]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  max={selectedRequest.remainingBalance}
                  step={1000}
                  formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value) => value.replace(/,/g, '')}
                />
              </Form.Item>

              <Form.Item noStyle shouldUpdate={(prev, curr) => prev.amount !== curr.amount}>
                {({ getFieldValue }) => {
                  const amount = getFieldValue('amount') || 0;
                  const isFullDisbursement = amount === selectedRequest.remainingBalance;
                  const newTotal = selectedRequest.totalDisbursed + amount;
                  const newRemaining = selectedRequest.remainingBalance - amount;
                  const progress = Math.round((newTotal / selectedRequest.amountApproved) * 100);

                  return (
                    <div style={{ marginBottom: '16px' }}>
                      <Row gutter={16}>
                        <Col span={8}>
                          <Statistic
                            title="Will Disburse"
                            value={amount}
                            precision={0}
                            prefix="XAF"
                            valueStyle={{ color: '#1890ff', fontSize: '16px' }}
                          />
                        </Col>
                        <Col span={8}>
                          <Statistic
                            title="New Total"
                            value={newTotal}
                            precision={0}
                            prefix="XAF"
                            valueStyle={{ color: '#52c41a', fontSize: '16px' }}
                          />
                        </Col>
                        <Col span={8}>
                          <Statistic
                            title="New Remaining"
                            value={newRemaining}
                            precision={0}
                            prefix="XAF"
                            valueStyle={{ 
                              color: newRemaining === 0 ? '#52c41a' : '#fa8c16',
                              fontSize: '16px'
                            }}
                          />
                        </Col>
                      </Row>

                      <div style={{ marginTop: '16px' }}>
                        <Text strong>Completion Progress</Text>
                        <Progress 
                          percent={progress} 
                          status={progress === 100 ? 'success' : 'active'}
                          format={(percent) => `${percent}%`}
                        />
                      </div>

                      {isFullDisbursement ? (
                        <Alert
                          message="Full Disbursement"
                          description="This will complete the disbursement. Employee can submit justification after this."
                          type="success"
                          showIcon
                          style={{ marginTop: '16px' }}
                        />
                      ) : (
                        <Alert
                          message="Partial Disbursement"
                          description={`You can disburse the remaining XAF ${newRemaining.toLocaleString()} later.`}
                          type="warning"
                          showIcon
                          style={{ marginTop: '16px' }}
                        />
                      )}
                    </div>
                  );
                }}
              </Form.Item>

              <Form.Item
                name="notes"
                label="Notes (Optional)"
              >
                <TextArea
                  rows={3}
                  placeholder="Add any notes about this disbursement..."
                  maxLength={200}
                  showCount
                />
              </Form.Item>

              <Form.Item style={{ marginBottom: 0, marginTop: '24px' }}>
                <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                  <Button 
                    onClick={() => {
                      setDisbursementModalVisible(false);
                      form.resetFields();
                      setSelectedRequest(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={disbursing}
                    icon={<SendOutlined />}
                  >
                    {disbursing ? 'Processing...' : 'Process Disbursement'}
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

export default FinanceDisbursementPage;