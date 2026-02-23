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















// import React, { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import {
//   Card,
//   Table,
//   Button,
//   Space,
//   Tag,
//   Typography,
//   Modal,
//   Form,
//   InputNumber,
//   Input,
//   message,
//   Statistic,
//   Row,
//   Col,
//   Alert,
//   Progress,
//   Tooltip,
//   Badge,
//   Tabs,
//   Divider,
//   Timeline
// } from 'antd';
// import {
//   DollarOutlined,
//   SendOutlined,
//   EyeOutlined,
//   HistoryOutlined,
//   CheckCircleOutlined,
//   ClockCircleOutlined,
//   ShoppingCartOutlined,
//   WalletOutlined,
//   BarChartOutlined,
//   InfoCircleOutlined
// } from '@ant-design/icons';
// import { cashRequestAPI } from '../../services/cashRequestAPI';

// const { Title, Text } = Typography;
// const { TextArea } = Input;
// const { TabPane } = Tabs;

// // ✅ API helper for purchase requisitions
// const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

// const makeAuthenticatedRequest = async (url, options = {}) => {
//   const token = localStorage.getItem('token');
  
//   const defaultHeaders = {
//     'Content-Type': 'application/json',
//     'Authorization': `Bearer ${token}`,
//   };

//   const config = {
//     ...options,
//     headers: {
//       ...defaultHeaders,
//       ...options.headers,
//     },
//   };

//   const response = await fetch(url, config);
  
//   if (!response.ok) {
//     const errorData = await response.json().catch(() => ({}));
//     throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
//   }

//   return await response.json();
// };

// const FinanceDisbursementPage = () => {
//   const navigate = useNavigate();
//   const [loading, setLoading] = useState(false);
//   const [activeTab, setActiveTab] = useState('cash-requests'); // ✅ NEW: Tab state
  
//   // Cash Requests state
//   const [cashRequests, setCashRequests] = useState([]);
//   const [selectedCashRequest, setSelectedCashRequest] = useState(null);
//   const [cashDisbursementModalVisible, setCashDisbursementModalVisible] = useState(false);
//   const [disbursing, setDisbursing] = useState(false);
//   const [cashForm] = Form.useForm();
  
//   // ✅ NEW: Purchase Requisitions state
//   const [purchaseRequisitions, setPurchaseRequisitions] = useState([]);
//   const [selectedPurchaseReq, setSelectedPurchaseReq] = useState(null);
//   const [purchaseDisbursementModalVisible, setPurchaseDisbursementModalVisible] = useState(false);
//   const [purchaseDisbursing, setPurchaseDisbursing] = useState(false);
//   const [purchaseForm] = Form.useForm();

//   useEffect(() => {
//     fetchPendingCashDisbursements();
//     fetchPendingPurchaseDisbursements(); // ✅ NEW
//   }, []);

//   // ===================================
//   // CASH REQUESTS - Existing Functions
//   // ===================================
//   const fetchPendingCashDisbursements = async () => {
//     try {
//       setLoading(true);
//       const response = await cashRequestAPI.getPendingDisbursements();
      
//       if (response.success) {
//         setCashRequests(response.data || []);
//       } else {
//         message.error('Failed to load pending cash disbursements');
//       }
//     } catch (error) {
//       console.error('Error fetching cash disbursements:', error);
//       message.error('Failed to load pending cash disbursements');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const showCashDisbursementModal = (request) => {
//     setSelectedCashRequest(request);
//     cashForm.setFieldsValue({
//       amount: request.remainingBalance,
//       notes: ''
//     });
//     setCashDisbursementModalVisible(true);
//   };

//   const handleCashDisbursement = async (values) => {
//     try {
//       setDisbursing(true);

//       const response = await cashRequestAPI.processDisbursement(
//         selectedCashRequest._id,
//         {
//           amount: values.amount,
//           notes: values.notes
//         }
//       );

//       if (response.success) {
//         const isFullyDisbursed = response.disbursement.isFullyDisbursed;
        
//         message.success({
//           content: isFullyDisbursed 
//             ? 'Cash request fully disbursed successfully!' 
//             : `Partial disbursement processed (${response.disbursement.progress}%)`,
//           duration: 5
//         });

//         setCashDisbursementModalVisible(false);
//         cashForm.resetFields();
//         setSelectedCashRequest(null);
        
//         await fetchPendingCashDisbursements();
//       }
//     } catch (error) {
//       console.error('Cash disbursement error:', error);
//       message.error(error.response?.data?.message || 'Failed to process disbursement');
//     } finally {
//       setDisbursing(false);
//     }
//   };

//   // ===================================
//   // ✅ NEW: PURCHASE REQUISITIONS Functions
//   // ===================================
//   const fetchPendingPurchaseDisbursements = async () => {
//     try {
//       setLoading(true);
//       const response = await makeAuthenticatedRequest(
//         `${API_BASE_URL}/purchase-requisitions/finance/pending-disbursements`
//       );
      
//       if (response.success) {
//         setPurchaseRequisitions(response.data || []);
//       } else {
//         message.error('Failed to load pending purchase disbursements');
//       }
//     } catch (error) {
//       console.error('Error fetching purchase disbursements:', error);
//       message.error('Failed to load pending purchase disbursements');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const showPurchaseDisbursementModal = (requisition) => {
//     setSelectedPurchaseReq(requisition);
//     const remaining = requisition.remainingBalance || 
//                      (requisition.budgetXAF - (requisition.totalDisbursed || 0));
//     purchaseForm.setFieldsValue({
//       amount: remaining,
//       notes: ''
//     });
//     setPurchaseDisbursementModalVisible(true);
//   };

//   const handlePurchaseDisbursement = async (values) => {
//     try {
//       setPurchaseDisbursing(true);

//       const response = await makeAuthenticatedRequest(
//         `${API_BASE_URL}/purchase-requisitions/${selectedPurchaseReq._id}/disburse`,
//         {
//           method: 'POST',
//           body: JSON.stringify({
//             amount: values.amount,
//             notes: values.notes
//           })
//         }
//       );

//       if (response.success) {
//         const isFullyDisbursed = response.disbursement.isFullyDisbursed;
        
//         message.success({
//           content: isFullyDisbursed 
//             ? 'Purchase requisition fully disbursed!' 
//             : `Partial disbursement #${response.disbursement.number} processed (${response.disbursement.progress}%)`,
//           duration: 5
//         });

//         setPurchaseDisbursementModalVisible(false);
//         purchaseForm.resetFields();
//         setSelectedPurchaseReq(null);
        
//         await fetchPendingPurchaseDisbursements();
//       }
//     } catch (error) {
//       console.error('Purchase disbursement error:', error);
//       message.error(error.message || 'Failed to process disbursement');
//     } finally {
//       setPurchaseDisbursing(false);
//     }
//   };

//   // ===================================
//   // TABLE COLUMNS
//   // ===================================
  
//   // Cash Requests Columns (existing)
//   const cashRequestColumns = [
//     {
//       title: 'Request ID',
//       dataIndex: '_id',
//       key: 'requestId',
//       width: 130,
//       render: (id) => (
//         <Text code copyable>
//           CR-{id.slice(-6).toUpperCase()}
//         </Text>
//       )
//     },
//     {
//       title: 'Employee',
//       dataIndex: 'employee',
//       key: 'employee',
//       width: 200,
//       render: (employee) => (
//         <div>
//           <Text strong>{employee.fullName}</Text>
//           <br />
//           <Text type="secondary" style={{ fontSize: '12px' }}>
//             {employee.department}
//           </Text>
//         </div>
//       )
//     },
//     {
//       title: 'Type',
//       dataIndex: 'requestType',
//       key: 'requestType',
//       width: 150,
//       render: (type) => type?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
//     },
//     {
//       title: 'Status',
//       dataIndex: 'status',
//       key: 'status',
//       width: 150,
//       render: (status) => {
//         if (status === 'approved') {
//           return <Tag color="green" icon={<ClockCircleOutlined />}>Awaiting Disbursement</Tag>;
//         }
//         if (status === 'partially_disbursed') {
//           return <Tag color="processing" icon={<DollarOutlined />}>Partially Disbursed</Tag>;
//         }
//         return <Tag>{status}</Tag>;
//       }
//     },
//     {
//       title: 'Approved Amount',
//       dataIndex: 'amountApproved',
//       key: 'amountApproved',
//       width: 150,
//       align: 'right',
//       render: (amount, record) => (
//         <div>
//           <Text strong style={{ color: '#52c41a' }}>
//             XAF {amount.toLocaleString()}
//           </Text>
//           {amount < record.amountRequested && (
//             <div>
//               <Tag color="orange" style={{ fontSize: '10px', marginTop: '4px' }}>
//                 {Math.round((amount / record.amountRequested) * 100)}% of requested
//               </Tag>
//             </div>
//           )}
//         </div>
//       )
//     },
//     {
//       title: 'Already Disbursed',
//       dataIndex: 'totalDisbursed',
//       key: 'totalDisbursed',
//       width: 150,
//       align: 'right',
//       render: (amount, record) => (
//         <div>
//           <Text style={{ color: '#1890ff' }}>
//             XAF {amount.toLocaleString()}
//           </Text>
//           {record.disbursements && record.disbursements.length > 0 && (
//             <div>
//               <Tag color="blue" style={{ fontSize: '10px', marginTop: '4px' }}>
//                 {record.disbursements.length} payment(s)
//               </Tag>
//             </div>
//           )}
//         </div>
//       )
//     },
//     {
//       title: 'Remaining Balance',
//       dataIndex: 'remainingBalance',
//       key: 'remainingBalance',
//       width: 150,
//       align: 'right',
//       render: (amount) => (
//         <Text strong style={{ color: '#fa8c16', fontSize: '16px' }}>
//           XAF {amount.toLocaleString()}
//         </Text>
//       )
//     },
//     {
//       title: 'Progress',
//       key: 'progress',
//       width: 120,
//       render: (_, record) => {
//         const progress = Math.round((record.totalDisbursed / record.amountApproved) * 100);
//         return (
//           <Tooltip title={`${progress}% disbursed`}>
//             <Progress 
//               percent={progress} 
//               size="small"
//               status={progress === 100 ? 'success' : 'active'}
//             />
//           </Tooltip>
//         );
//       }
//     },
//     {
//       title: 'Action',
//       key: 'action',
//       fixed: 'right',
//       width: 180,
//       render: (_, record) => (
//         <Space>
//           <Button
//             type="link"
//             size="small"
//             icon={<EyeOutlined />}
//             onClick={() => navigate(`/finance/cash-request/${record._id}`)}
//           >
//             View
//           </Button>
//           <Button
//             type="primary"
//             size="small"
//             icon={<SendOutlined />}
//             onClick={() => showCashDisbursementModal(record)}
//           >
//             Disburse
//           </Button>
//         </Space>
//       )
//     }
//   ];

//   // ✅ NEW: Purchase Requisitions Columns
//   const purchaseRequisitionColumns = [
//     {
//       title: 'Requisition ID',
//       dataIndex: 'requisitionNumber',
//       key: 'requisitionNumber',
//       width: 150,
//       render: (number, record) => (
//         <Text code copyable>
//           {number || `PR-${record._id.slice(-6).toUpperCase()}`}
//         </Text>
//       )
//     },
//     {
//       title: 'Employee & Details',
//       key: 'employee',
//       width: 250,
//       render: (_, record) => (
//         <div>
//           <Text strong>{record.employee?.fullName || 'N/A'}</Text>
//           <br />
//           <Text type="secondary" style={{ fontSize: '12px' }}>
//             {record.employee?.department || record.department}
//           </Text>
//           <br />
//           <Tag color="blue" size="small">{record.itemCategory}</Tag>
//         </div>
//       )
//     },
//     {
//       title: 'Status',
//       dataIndex: 'status',
//       key: 'status',
//       width: 150,
//       render: (status) => {
//         if (status === 'approved') {
//           return <Tag color="green" icon={<ClockCircleOutlined />}>Awaiting Disbursement</Tag>;
//         }
//         if (status === 'partially_disbursed') {
//           return <Tag color="cyan" icon={<SendOutlined />}>Partially Disbursed</Tag>;
//         }
//         return <Tag>{status?.replace(/_/g, ' ')}</Tag>;
//       }
//     },
//     {
//       title: 'Total Budget',
//       dataIndex: 'budgetXAF',
//       key: 'budgetXAF',
//       width: 150,
//       align: 'right',
//       render: (amount) => (
//         <Text strong style={{ color: '#52c41a' }}>
//           XAF {amount?.toLocaleString() || '0'}
//         </Text>
//       )
//     },
//     {
//       title: 'Already Disbursed',
//       dataIndex: 'totalDisbursed',
//       key: 'totalDisbursed',
//       width: 150,
//       align: 'right',
//       render: (amount, record) => (
//         <div>
//           <Text style={{ color: '#1890ff' }}>
//             XAF {(amount || 0).toLocaleString()}
//           </Text>
//           {record.disbursements && record.disbursements.length > 0 && (
//             <div>
//               <Tag color="blue" style={{ fontSize: '10px', marginTop: '4px' }}>
//                 {record.disbursements.length} payment(s)
//               </Tag>
//             </div>
//           )}
//         </div>
//       )
//     },
//     {
//       title: 'Remaining Balance',
//       dataIndex: 'remainingBalance',
//       key: 'remainingBalance',
//       width: 150,
//       align: 'right',
//       render: (amount, record) => {
//         const remaining = amount || (record.budgetXAF - (record.totalDisbursed || 0));
//         return (
//           <Text strong style={{ color: '#fa8c16', fontSize: '16px' }}>
//             XAF {remaining.toLocaleString()}
//           </Text>
//         );
//       }
//     },
//     {
//       title: 'Progress',
//       key: 'progress',
//       width: 120,
//       render: (_, record) => {
//         const total = record.budgetXAF || 0;
//         const disbursed = record.totalDisbursed || 0;
//         const progress = total > 0 ? Math.round((disbursed / total) * 100) : 0;
        
//         return (
//           <Tooltip title={`${progress}% disbursed`}>
//             <Progress 
//               percent={progress} 
//               size="small"
//               status={progress === 100 ? 'success' : 'active'}
//             />
//           </Tooltip>
//         );
//       }
//     },
//     {
//       title: 'Items',
//       dataIndex: 'items',
//       key: 'items',
//       width: 80,
//       align: 'center',
//       render: (items) => (
//         <Badge count={items?.length || 0} style={{ backgroundColor: '#52c41a' }}>
//           <ShoppingCartOutlined style={{ fontSize: '18px' }} />
//         </Badge>
//       )
//     },
//     {
//       title: 'Action',
//       key: 'action',
//       fixed: 'right',
//       width: 180,
//       render: (_, record) => (
//         <Space>
//           <Button
//             type="link"
//             size="small"
//             icon={<EyeOutlined />}
//             onClick={() => navigate(`/finance/purchase-requisitions?reqId=${record._id}`)}
//           >
//             View
//           </Button>
//           <Button
//             type="primary"
//             size="small"
//             icon={<SendOutlined />}
//             onClick={() => showPurchaseDisbursementModal(record)}
//           >
//             Disburse
//           </Button>
//         </Space>
//       )
//     }
//   ];

//   // ===================================
//   // STATISTICS
//   // ===================================
  
//   // Cash Requests Stats
//   const totalCashAwaitingDisbursement = cashRequests.reduce((sum, req) => sum + req.remainingBalance, 0);
//   const totalCashApproved = cashRequests.reduce((sum, req) => sum + req.amountApproved, 0);
//   const totalCashDisbursed = cashRequests.reduce((sum, req) => sum + req.totalDisbursed, 0);

//   // ✅ NEW: Purchase Requisitions Stats
//   const totalPurchaseAwaitingDisbursement = purchaseRequisitions.reduce((sum, req) => {
//     const remaining = req.remainingBalance || (req.budgetXAF - (req.totalDisbursed || 0));
//     return sum + remaining;
//   }, 0);
//   const totalPurchaseBudget = purchaseRequisitions.reduce((sum, req) => sum + (req.budgetXAF || 0), 0);
//   const totalPurchaseDisbursed = purchaseRequisitions.reduce((sum, req) => sum + (req.totalDisbursed || 0), 0);

//   // ✅ NEW: Combined Stats
//   const grandTotalAwaiting = totalCashAwaitingDisbursement + totalPurchaseAwaitingDisbursement;
//   const grandTotalApproved = totalCashApproved + totalPurchaseBudget;
//   const grandTotalDisbursed = totalCashDisbursed + totalPurchaseDisbursed;

//   return (
//     <div style={{ padding: '24px' }}>
//       <div style={{ marginBottom: '24px' }}>
//         <Title level={3}>
//           <DollarOutlined /> Pending Disbursements
//         </Title>
//         <Text type="secondary">
//           Manage approved cash requests and purchase requisitions awaiting full or partial disbursement
//         </Text>
//       </div>

//       {/* ✅ UPDATED: Combined Summary Statistics */}
//       <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
//         <Col span={6}>
//           <Card>
//             <Statistic
//               title="Total Requests"
//               value={cashRequests.length + purchaseRequisitions.length}
//               prefix={<ClockCircleOutlined />}
//               valueStyle={{ color: '#1890ff' }}
//               suffix={
//                 <Text type="secondary" style={{ fontSize: '12px' }}>
//                   ({cashRequests.length} CR + {purchaseRequisitions.length} PR)
//                 </Text>
//               }
//             />
//           </Card>
//         </Col>
//         <Col span={6}>
//           <Card>
//             <Statistic
//               title="Total Approved"
//               value={grandTotalApproved}
//               precision={0}
//               prefix="XAF"
//               valueStyle={{ color: '#52c41a' }}
//             />
//           </Card>
//         </Col>
//         <Col span={6}>
//           <Card>
//             <Statistic
//               title="Already Disbursed"
//               value={grandTotalDisbursed}
//               precision={0}
//               prefix="XAF"
//               valueStyle={{ color: '#1890ff' }}
//             />
//           </Card>
//         </Col>
//         <Col span={6}>
//           <Card>
//             <Statistic
//               title="Awaiting Disbursement"
//               value={grandTotalAwaiting}
//               precision={0}
//               prefix="XAF"
//               valueStyle={{ color: '#fa8c16' }}
//             />
//           </Card>
//         </Col>
//       </Row>

//       {/* ✅ NEW: Tabbed Interface */}
//       <Card>
//         <Tabs 
//           activeKey={activeTab} 
//           onChange={setActiveTab}
//           type="card"
//         >
//           {/* Cash Requests Tab */}
//           <TabPane 
//             tab={
//               <Badge count={cashRequests.length} offset={[10, 0]}>
//                 <Space>
//                   <WalletOutlined />
//                   <span>Cash Requests</span>
//                 </Space>
//               </Badge>
//             } 
//             key="cash-requests"
//           >
//             {cashRequests.length > 0 && (
//               <Alert
//                 message={`${cashRequests.length} cash request(s) awaiting disbursement`}
//                 description="Click 'Disburse' to process full or partial payments. Employees will be notified immediately."
//                 type="info"
//                 showIcon
//                 icon={<WalletOutlined />}
//                 style={{ marginBottom: '16px' }}
//               />
//             )}

//             <Divider />

//             {/* Cash Requests Stats */}
//             <Row gutter={16} style={{ marginBottom: '16px' }}>
//               <Col span={8}>
//                 <Statistic
//                   title="Total Approved"
//                   value={totalCashApproved}
//                   precision={0}
//                   prefix="XAF"
//                   valueStyle={{ fontSize: '14px' }}
//                 />
//               </Col>
//               <Col span={8}>
//                 <Statistic
//                   title="Already Disbursed"
//                   value={totalCashDisbursed}
//                   precision={0}
//                   prefix="XAF"
//                   valueStyle={{ fontSize: '14px', color: '#1890ff' }}
//                 />
//               </Col>
//               <Col span={8}>
//                 <Statistic
//                   title="Remaining"
//                   value={totalCashAwaitingDisbursement}
//                   precision={0}
//                   prefix="XAF"
//                   valueStyle={{ fontSize: '14px', color: '#fa8c16' }}
//                 />
//               </Col>
//             </Row>

//             <Table
//               columns={cashRequestColumns}
//               dataSource={cashRequests}
//               rowKey="_id"
//               loading={loading}
//               scroll={{ x: 1400 }}
//               pagination={{
//                 pageSize: 10,
//                 showTotal: (total) => `Total ${total} cash request(s)`,
//                 showSizeChanger: true
//               }}
//               locale={{
//                 emptyText: (
//                   <div style={{ padding: '40px', textAlign: 'center' }}>
//                     <CheckCircleOutlined style={{ fontSize: '48px', color: '#52c41a', marginBottom: '16px' }} />
//                     <div>
//                       <Text strong style={{ fontSize: '16px' }}>No Pending Cash Disbursements</Text>
//                     </div>
//                     <Text type="secondary">All approved cash requests have been fully disbursed</Text>
//                   </div>
//                 )
//               }}
//             />
//           </TabPane>

//           {/* ✅ NEW: Purchase Requisitions Tab */}
//           <TabPane 
//             tab={
//               <Badge count={purchaseRequisitions.length} offset={[10, 0]}>
//                 <Space>
//                   <ShoppingCartOutlined />
//                   <span>Purchase Requisitions</span>
//                 </Space>
//               </Badge>
//             } 
//             key="purchase-requisitions"
//           >
//             {purchaseRequisitions.length > 0 && (
//               <Alert
//                 message={`${purchaseRequisitions.length} purchase requisition(s) awaiting disbursement`}
//                 description="Click 'Disburse' to process full or partial payments for approved purchase requisitions. Employees will be notified."
//                 type="info"
//                 showIcon
//                 icon={<ShoppingCartOutlined />}
//                 style={{ marginBottom: '16px' }}
//               />
//             )}

//             <Divider />

//             {/* Purchase Requisitions Stats */}
//             <Row gutter={16} style={{ marginBottom: '16px' }}>
//               <Col span={8}>
//                 <Statistic
//                   title="Total Budget"
//                   value={totalPurchaseBudget}
//                   precision={0}
//                   prefix="XAF"
//                   valueStyle={{ fontSize: '14px' }}
//                 />
//               </Col>
//               <Col span={8}>
//                 <Statistic
//                   title="Already Disbursed"
//                   value={totalPurchaseDisbursed}
//                   precision={0}
//                   prefix="XAF"
//                   valueStyle={{ fontSize: '14px', color: '#1890ff' }}
//                 />
//               </Col>
//               <Col span={8}>
//                 <Statistic
//                   title="Remaining"
//                   value={totalPurchaseAwaitingDisbursement}
//                   precision={0}
//                   prefix="XAF"
//                   valueStyle={{ fontSize: '14px', color: '#fa8c16' }}
//                 />
//               </Col>
//             </Row>

//             <Table
//               columns={purchaseRequisitionColumns}
//               dataSource={purchaseRequisitions}
//               rowKey="_id"
//               loading={loading}
//               scroll={{ x: 1500 }}
//               pagination={{
//                 pageSize: 10,
//                 showTotal: (total) => `Total ${total} purchase requisition(s)`,
//                 showSizeChanger: true
//               }}
//               locale={{
//                 emptyText: (
//                   <div style={{ padding: '40px', textAlign: 'center' }}>
//                     <CheckCircleOutlined style={{ fontSize: '48px', color: '#52c41a', marginBottom: '16px' }} />
//                     <div>
//                       <Text strong style={{ fontSize: '16px' }}>No Pending Purchase Disbursements</Text>
//                     </div>
//                     <Text type="secondary">All approved purchase requisitions have been fully disbursed</Text>
//                   </div>
//                 )
//               }}
//             />
//           </TabPane>
//         </Tabs>
//       </Card>

//       {/* ===================================
//           CASH REQUEST DISBURSEMENT MODAL (existing)
//           =================================== */}
//       <Modal
//         title={
//           <Space>
//             <SendOutlined />
//             <span>Process Cash Disbursement</span>
//           </Space>
//         }
//         open={cashDisbursementModalVisible}
//         onCancel={() => {
//           setCashDisbursementModalVisible(false);
//           cashForm.resetFields();
//           setSelectedCashRequest(null);
//         }}
//         footer={null}
//         width={600}
//       >
//         {selectedCashRequest && (
//           <>
//             <Alert
//               message="Cash Request Disbursement"
//               description={
//                 <div>
//                   <div><strong>Employee:</strong> {selectedCashRequest.employee.fullName}</div>
//                   <div><strong>Request ID:</strong> CR-{selectedCashRequest._id.slice(-6).toUpperCase()}</div>
//                   <div><strong>Approved Amount:</strong> XAF {selectedCashRequest.amountApproved.toLocaleString()}</div>
//                   <div><strong>Already Disbursed:</strong> XAF {selectedCashRequest.totalDisbursed.toLocaleString()}</div>
//                   <div><strong>Remaining Balance:</strong> XAF {selectedCashRequest.remainingBalance.toLocaleString()}</div>
//                 </div>
//               }
//               type="info"
//               showIcon
//               style={{ marginBottom: '24px' }}
//             />

//             {/* Show disbursement history if exists */}
//             {selectedCashRequest.disbursements && selectedCashRequest.disbursements.length > 0 && (
//               <Card size="small" title="Payment History" style={{ marginBottom: '16px' }}>
//                 <Timeline mode="left">
//                   {selectedCashRequest.disbursements.map((disbursement, index) => (
//                     <Timeline.Item
//                       key={index}
//                       color={index === selectedCashRequest.disbursements.length - 1 ? 'green' : 'blue'}
//                       dot={<DollarOutlined />}
//                     >
//                       <div style={{ fontSize: '12px' }}>
//                         <Text strong>Payment #{disbursement.disbursementNumber}</Text>
//                         <br />
//                         <Text type="secondary">
//                           <ClockCircleOutlined /> {new Date(disbursement.date).toLocaleString('en-GB')}
//                         </Text>
//                         <br />
//                         <Text strong style={{ color: '#1890ff' }}>
//                           XAF {disbursement.amount?.toLocaleString()}
//                         </Text>
//                         {disbursement.notes && (
//                           <>
//                             <br />
//                             <Text italic style={{ fontSize: '11px' }}>"{disbursement.notes}"</Text>
//                           </>
//                         )}
//                       </div>
//                     </Timeline.Item>
//                   ))}
//                 </Timeline>
//               </Card>
//             )}

//             <Form
//               form={cashForm}
//               layout="vertical"
//               onFinish={handleCashDisbursement}
//               initialValues={{
//                 amount: selectedCashRequest.remainingBalance,
//                 notes: ''
//               }}
//             >
//               <Form.Item
//                 name="amount"
//                 label="Disbursement Amount (XAF)"
//                 rules={[
//                   { required: true, message: 'Please enter disbursement amount' },
//                   {
//                     validator: (_, value) => {
//                       if (value > selectedCashRequest.remainingBalance) {
//                         return Promise.reject(`Cannot exceed remaining balance (XAF ${selectedCashRequest.remainingBalance.toLocaleString()})`);
//                       }
//                       if (value <= 0) {
//                         return Promise.reject('Amount must be greater than 0');
//                       }
//                       return Promise.resolve();
//                     }
//                   }
//                 ]}
//               >
//                 <InputNumber
//                   style={{ width: '100%' }}
//                   min={0}
//                   max={selectedCashRequest.remainingBalance}
//                   step={1000}
//                   formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
//                   parser={(value) => value.replace(/,/g, '')}
//                 />
//               </Form.Item>

//               <Form.Item noStyle shouldUpdate={(prev, curr) => prev.amount !== curr.amount}>
//                 {({ getFieldValue }) => {
//                   const amount = getFieldValue('amount') || 0;
//                   const isFullDisbursement = amount === selectedCashRequest.remainingBalance;
//                   const newTotal = selectedCashRequest.totalDisbursed + amount;
//                   const newRemaining = selectedCashRequest.remainingBalance - amount;
//                   const progress = Math.round((newTotal / selectedCashRequest.amountApproved) * 100);

//                   return (
//                     <div style={{ marginBottom: '16px' }}>
//                       <Row gutter={16}>
//                         <Col span={8}>
//                           <Statistic
//                             title="Will Disburse"
//                             value={amount}
//                             precision={0}
//                             prefix="XAF"
//                             valueStyle={{ color: '#1890ff', fontSize: '16px' }}
//                           />
//                         </Col>
//                         <Col span={8}>
//                           <Statistic
//                             title="New Total"
//                             value={newTotal}
//                             precision={0}
//                             prefix="XAF"
//                             valueStyle={{ color: '#52c41a', fontSize: '16px' }}
//                           />
//                         </Col>
//                         <Col span={8}>
//                           <Statistic
//                             title="New Remaining"
//                             value={newRemaining}
//                             precision={0}
//                             prefix="XAF"
//                             valueStyle={{ 
//                               color: newRemaining === 0 ? '#52c41a' : '#fa8c16',
//                               fontSize: '16px'
//                             }}
//                           />
//                         </Col>
//                       </Row>

//                       <div style={{ marginTop: '16px' }}>
//                         <Text strong>Completion Progress</Text>
//                         <Progress 
//                           percent={progress} 
//                           status={progress === 100 ? 'success' : 'active'}
//                           format={(percent) => `${percent}%`}
//                         />
//                       </div>

//                       {isFullDisbursement ? (
//                         <Alert
//                           message="Full Disbursement"
//                           description="This will complete the disbursement. Employee can submit justification after this."
//                           type="success"
//                           showIcon
//                           style={{ marginTop: '16px' }}
//                         />
//                       ) : (
//                         <Alert
//                           message="Partial Disbursement"
//                           description={`You can disburse the remaining XAF ${newRemaining.toLocaleString()} later.`}
//                           type="warning"
//                           showIcon
//                           style={{ marginTop: '16px' }}
//                         />
//                       )}
//                     </div>
//                   );
//                 }}
//               </Form.Item>

//               <Form.Item
//                 name="notes"
//                 label="Notes (Optional)"
//               >
//                 <TextArea
//                   rows={3}
//                   placeholder="Add any notes about this disbursement..."
//                   maxLength={200}
//                   showCount
//                 />
//               </Form.Item>

//               <Form.Item style={{ marginBottom: 0, marginTop: '24px' }}>
//                 <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
//                   <Button 
//                     onClick={() => {
//                       setCashDisbursementModalVisible(false);
//                       cashForm.resetFields();
//                       setSelectedCashRequest(null);
//                     }}
//                   >
//                     Cancel
//                   </Button>
//                   <Button
//                     type="primary"
//                     htmlType="submit"
//                     loading={disbursing}
//                     icon={<SendOutlined />}
//                   >
//                     {disbursing ? 'Processing...' : 'Process Disbursement'}
//                   </Button>
//                 </Space>
//               </Form.Item>
//             </Form>
//           </>
//         )}
//       </Modal>

//       {/* ===================================
//           ✅ NEW: PURCHASE REQUISITION DISBURSEMENT MODAL
//           =================================== */}
//       <Modal
//         title={
//           <Space>
//             <SendOutlined />
//             <span>Process Purchase Requisition Disbursement</span>
//           </Space>
//         }
//         open={purchaseDisbursementModalVisible}
//         onCancel={() => {
//           setPurchaseDisbursementModalVisible(false);
//           purchaseForm.resetFields();
//           setSelectedPurchaseReq(null);
//         }}
//         footer={null}
//         width={700}
//       >
//         {selectedPurchaseReq && (
//           <>
//             <Alert
//               message="Purchase Requisition Disbursement"
//               description={
//                 <div>
//                   <div><strong>Employee:</strong> {selectedPurchaseReq.employee?.fullName || 'N/A'}</div>
//                   <div><strong>Requisition #:</strong> {selectedPurchaseReq.requisitionNumber || `PR-${selectedPurchaseReq._id.slice(-6).toUpperCase()}`}</div>
//                   <div><strong>Title:</strong> {selectedPurchaseReq.title}</div>
//                   <div><strong>Total Budget:</strong> XAF {(selectedPurchaseReq.budgetXAF || 0).toLocaleString()}</div>
//                   <div><strong>Already Disbursed:</strong> XAF {(selectedPurchaseReq.totalDisbursed || 0).toLocaleString()}</div>
//                   <div><strong>Remaining Balance:</strong> XAF {(selectedPurchaseReq.remainingBalance || (selectedPurchaseReq.budgetXAF - (selectedPurchaseReq.totalDisbursed || 0))).toLocaleString()}</div>
//                   <div><strong>Items:</strong> {selectedPurchaseReq.items?.length || 0} item(s)</div>
//                 </div>
//               }
//               type="info"
//               showIcon
//               icon={<ShoppingCartOutlined />}
//               style={{ marginBottom: '24px' }}
//             />

//             {/* Show disbursement history if exists */}
//             {selectedPurchaseReq.disbursements && selectedPurchaseReq.disbursements.length > 0 && (
//               <Card 
//                 size="small" 
//                 title={
//                   <Space>
//                     <HistoryOutlined />
//                     <span>Payment History ({selectedPurchaseReq.disbursements.length})</span>
//                   </Space>
//                 }
//                 style={{ marginBottom: '16px' }}
//               >
//                 <Timeline mode="left">
//                   {selectedPurchaseReq.disbursements.map((disbursement, index) => (
//                     <Timeline.Item
//                       key={index}
//                       color={index === selectedPurchaseReq.disbursements.length - 1 ? 'green' : 'blue'}
//                       dot={<DollarOutlined />}
//                     >
//                       <div style={{ fontSize: '12px' }}>
//                         <Text strong>Payment #{disbursement.disbursementNumber}</Text>
//                         <br />
//                         <Text type="secondary">
//                           <ClockCircleOutlined /> {new Date(disbursement.date).toLocaleString('en-GB')}
//                         </Text>
//                         <br />
//                         <Text strong style={{ color: '#1890ff' }}>
//                           XAF {disbursement.amount?.toLocaleString()}
//                         </Text>
//                         {disbursement.notes && (
//                           <>
//                             <br />
//                             <Text italic style={{ fontSize: '11px' }}>"{disbursement.notes}"</Text>
//                           </>
//                         )}
//                       </div>
//                     </Timeline.Item>
//                   ))}
//                 </Timeline>
//               </Card>
//             )}

//             <Form
//               form={purchaseForm}
//               layout="vertical"
//               onFinish={handlePurchaseDisbursement}
//             >
//               <Form.Item
//                 name="amount"
//                 label="Disbursement Amount (XAF)"
//                 rules={[
//                   { required: true, message: 'Please enter disbursement amount' },
//                   {
//                     validator: (_, value) => {
//                       const remaining = selectedPurchaseReq.remainingBalance || 
//                                        (selectedPurchaseReq.budgetXAF - (selectedPurchaseReq.totalDisbursed || 0));
                      
//                       if (value > remaining) {
//                         return Promise.reject(`Cannot exceed remaining balance (XAF ${remaining.toLocaleString()})`);
//                       }
//                       if (value <= 0) {
//                         return Promise.reject('Amount must be greater than 0');
//                       }
//                       return Promise.resolve();
//                     }
//                   }
//                 ]}
//               >
//                 <InputNumber
//                   style={{ width: '100%' }}
//                   min={0}
//                   max={selectedPurchaseReq.remainingBalance || 
//                        (selectedPurchaseReq.budgetXAF - (selectedPurchaseReq.totalDisbursed || 0))}
//                   step={1000}
//                   formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
//                   parser={(value) => value.replace(/,/g, '')}
//                 />
//               </Form.Item>

//               <Form.Item noStyle shouldUpdate={(prev, curr) => prev.amount !== curr.amount}>
//                 {({ getFieldValue }) => {
//                   const amount = getFieldValue('amount') || 0;
//                   const totalBudget = selectedPurchaseReq.budgetXAF || 0;
//                   const totalDisbursed = selectedPurchaseReq.totalDisbursed || 0;
//                   const remainingBalance = selectedPurchaseReq.remainingBalance || (totalBudget - totalDisbursed);
                  
//                   const isFullDisbursement = amount === remainingBalance;
//                   const newTotal = totalDisbursed + amount;
//                   const newRemaining = remainingBalance - amount;
//                   const progress = totalBudget > 0 ? Math.round((newTotal / totalBudget) * 100) : 0;

//                   return (
//                     <div style={{ marginBottom: '16px' }}>
//                       <Card size="small" style={{ backgroundColor: '#f0f8ff' }}>
//                         <Row gutter={16}>
//                           <Col span={8}>
//                             <Statistic
//                               title="Will Disburse"
//                               value={amount}
//                               precision={0}
//                               prefix="XAF"
//                               valueStyle={{ color: '#1890ff', fontSize: '16px' }}
//                             />
//                           </Col>
//                           <Col span={8}>
//                             <Statistic
//                               title="New Total Disbursed"
//                               value={newTotal}
//                               precision={0}
//                               prefix="XAF"
//                               valueStyle={{ color: '#52c41a', fontSize: '16px' }}
//                             />
//                           </Col>
//                           <Col span={8}>
//                             <Statistic
//                               title="New Remaining"
//                               value={newRemaining}
//                               precision={0}
//                               prefix="XAF"
//                               valueStyle={{ 
//                                 color: newRemaining === 0 ? '#52c41a' : '#fa8c16',
//                                 fontSize: '16px'
//                               }}
//                             />
//                           </Col>
//                         </Row>

//                         <Divider style={{ margin: '12px 0' }} />

//                         <div>
//                           <Text strong>Disbursement Progress</Text>
//                           <Progress 
//                             percent={progress} 
//                             status={progress === 100 ? 'success' : 'active'}
//                             strokeColor={progress === 100 ? '#52c41a' : '#1890ff'}
//                             format={(percent) => `${percent}%`}
//                           />
//                         </div>
//                       </Card>

//                       {isFullDisbursement ? (
//                         <Alert
//                           message="Full Disbursement"
//                           description="This will complete the full disbursement for this purchase requisition. The status will be updated to 'Fully Disbursed'."
//                           type="success"
//                           showIcon
//                           icon={<CheckCircleOutlined />}
//                           style={{ marginTop: '16px' }}
//                         />
//                       ) : (
//                         <Alert
//                           message="Partial Disbursement"
//                           description={`After this payment, XAF ${newRemaining.toLocaleString()} will remain to be disbursed. You can make additional payments later.`}
//                           type="warning"
//                           showIcon
//                           icon={<InfoCircleOutlined />}
//                           style={{ marginTop: '16px' }}
//                         />
//                       )}
//                     </div>
//                   );
//                 }}
//               </Form.Item>

//               <Form.Item
//                 name="notes"
//                 label="Disbursement Notes (Optional)"
//                 help="Add any relevant notes about this payment (e.g., payment method, reference number)"
//               >
//                 <TextArea
//                   rows={3}
//                   placeholder="Enter notes about this disbursement..."
//                   maxLength={300}
//                   showCount
//                 />
//               </Form.Item>

//               <Alert
//                 message="Budget Code Allocation"
//                 description={
//                   selectedPurchaseReq.budgetCodeInfo ? 
//                     `This disbursement will be deducted from budget code: ${selectedPurchaseReq.budgetCodeInfo.code}` :
//                     selectedPurchaseReq.financeVerification?.budgetCode ?
//                       `This disbursement will be deducted from budget code: ${selectedPurchaseReq.financeVerification.budgetCode}` :
//                       'Budget code information not available'
//                 }
//                 type="info"
//                 showIcon
//                 icon={<InfoCircleOutlined />}
//                 style={{ marginBottom: '16px' }}
//               />

//               <Form.Item style={{ marginBottom: 0, marginTop: '24px' }}>
//                 <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
//                   <Button 
//                     onClick={() => {
//                       setPurchaseDisbursementModalVisible(false);
//                       purchaseForm.resetFields();
//                       setSelectedPurchaseReq(null);
//                     }}
//                   >
//                     Cancel
//                   </Button>
//                   <Button
//                     type="primary"
//                     htmlType="submit"
//                     loading={purchaseDisbursing}
//                     icon={<SendOutlined />}
//                     size="large"
//                   >
//                     {purchaseDisbursing ? 'Processing Disbursement...' : 'Process Disbursement'}
//                   </Button>
//                 </Space>
//               </Form.Item>
//             </Form>
//           </>
//         )}
//       </Modal>
//     </div>
//   );
// };

// export default FinanceDisbursementPage;











// // import React, { useState, useEffect } from 'react';
// // import { useNavigate } from 'react-router-dom';
// // import {
// //   Card,
// //   Table,
// //   Button,
// //   Space,
// //   Tag,
// //   Typography,
// //   Modal,
// //   Form,
// //   InputNumber,
// //   Input,
// //   message,
// //   Statistic,
// //   Row,
// //   Col,
// //   Alert,
// //   Progress,
// //   Tooltip,
// //   Badge
// // } from 'antd';
// // import {
// //   DollarOutlined,
// //   SendOutlined,
// //   EyeOutlined,
// //   HistoryOutlined,
// //   CheckCircleOutlined,
// //   ClockCircleOutlined
// // } from '@ant-design/icons';
// // import { cashRequestAPI } from '../../services/cashRequestAPI';

// // const { Title, Text } = Typography;
// // const { TextArea } = Input;

// // const FinanceDisbursementPage = () => {
// //   const navigate = useNavigate();
// //   const [loading, setLoading] = useState(false);
// //   const [requests, setRequests] = useState([]);
// //   const [selectedRequest, setSelectedRequest] = useState(null);
// //   const [disbursementModalVisible, setDisbursementModalVisible] = useState(false);
// //   const [disbursing, setDisbursing] = useState(false);
// //   const [form] = Form.useForm();

// //   useEffect(() => {
// //     fetchPendingDisbursements();
// //   }, []);

// //   const fetchPendingDisbursements = async () => {
// //     try {
// //       setLoading(true);
// //       const response = await cashRequestAPI.getPendingDisbursements();
      
// //       if (response.success) {
// //         setRequests(response.data || []);
// //       } else {
// //         message.error('Failed to load pending disbursements');
// //       }
// //     } catch (error) {
// //       console.error('Error fetching disbursements:', error);
// //       message.error('Failed to load pending disbursements');
// //     } finally {
// //       setLoading(false);
// //     }
// //   };

// //   const showDisbursementModal = (request) => {
// //     setSelectedRequest(request);
// //     form.setFieldsValue({
// //       amount: request.remainingBalance,
// //       notes: ''
// //     });
// //     setDisbursementModalVisible(true);
// //   };

// //   const handleDisbursement = async (values) => {
// //     try {
// //       setDisbursing(true);

// //       const response = await cashRequestAPI.processDisbursement(
// //         selectedRequest._id,
// //         {
// //           amount: values.amount,
// //           notes: values.notes
// //         }
// //       );

// //       if (response.success) {
// //         const isFullyDisbursed = response.disbursement.isFullyDisbursed;
        
// //         message.success({
// //           content: isFullyDisbursed 
// //             ? 'Request fully disbursed successfully!' 
// //             : `Partial disbursement processed (${response.disbursement.progress}%)`,
// //           duration: 5
// //         });

// //         setDisbursementModalVisible(false);
// //         form.resetFields();
// //         setSelectedRequest(null);
        
// //         // Refresh the list
// //         await fetchPendingDisbursements();
// //       }
// //     } catch (error) {
// //       console.error('Disbursement error:', error);
// //       message.error(error.response?.data?.message || 'Failed to process disbursement');
// //     } finally {
// //       setDisbursing(false);
// //     }
// //   };

// //   const columns = [
// //     {
// //       title: 'Request ID',
// //       dataIndex: '_id',
// //       key: 'requestId',
// //       width: 130,
// //       render: (id) => (
// //         <Text code copyable>
// //           REQ-{id.slice(-6).toUpperCase()}
// //         </Text>
// //       )
// //     },
// //     {
// //       title: 'Employee',
// //       dataIndex: 'employee',
// //       key: 'employee',
// //       width: 200,
// //       render: (employee) => (
// //         <div>
// //           <Text strong>{employee.fullName}</Text>
// //           <br />
// //           <Text type="secondary" style={{ fontSize: '12px' }}>
// //             {employee.department}
// //           </Text>
// //         </div>
// //       )
// //     },
// //     {
// //       title: 'Type',
// //       dataIndex: 'requestType',
// //       key: 'requestType',
// //       width: 150,
// //       render: (type) => type?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
// //     },
// //     {
// //       title: 'Status',
// //       dataIndex: 'status',
// //       key: 'status',
// //       width: 150,
// //       render: (status) => {
// //         if (status === 'approved') {
// //           return <Tag color="green" icon={<ClockCircleOutlined />}>Awaiting Disbursement</Tag>;
// //         }
// //         if (status === 'partially_disbursed') {
// //           return <Tag color="processing" icon={<DollarOutlined />}>Partially Disbursed</Tag>;
// //         }
// //         return <Tag>{status}</Tag>;
// //       }
// //     },
// //     {
// //       title: 'Approved Amount',
// //       dataIndex: 'amountApproved',
// //       key: 'amountApproved',
// //       width: 150,
// //       align: 'right',
// //       render: (amount, record) => (
// //         <div>
// //           <Text strong style={{ color: '#52c41a' }}>
// //             XAF {amount.toLocaleString()}
// //           </Text>
// //           {amount < record.amountRequested && (
// //             <div>
// //               <Tag color="orange" style={{ fontSize: '10px', marginTop: '4px' }}>
// //                 {Math.round((amount / record.amountRequested) * 100)}% of requested
// //               </Tag>
// //             </div>
// //           )}
// //         </div>
// //       )
// //     },
// //     {
// //       title: 'Already Disbursed',
// //       dataIndex: 'totalDisbursed',
// //       key: 'totalDisbursed',
// //       width: 150,
// //       align: 'right',
// //       render: (amount, record) => (
// //         <div>
// //           <Text style={{ color: '#1890ff' }}>
// //             XAF {amount.toLocaleString()}
// //           </Text>
// //           {record.disbursements && record.disbursements.length > 0 && (
// //             <div>
// //               <Tag color="blue" style={{ fontSize: '10px', marginTop: '4px' }}>
// //                 {record.disbursements.length} payment(s)
// //               </Tag>
// //             </div>
// //           )}
// //         </div>
// //       )
// //     },
// //     {
// //       title: 'Remaining Balance',
// //       dataIndex: 'remainingBalance',
// //       key: 'remainingBalance',
// //       width: 150,
// //       align: 'right',
// //       render: (amount) => (
// //         <Text strong style={{ color: '#fa8c16', fontSize: '16px' }}>
// //           XAF {amount.toLocaleString()}
// //         </Text>
// //       )
// //     },
// //     {
// //       title: 'Progress',
// //       key: 'progress',
// //       width: 120,
// //       render: (_, record) => {
// //         const progress = Math.round((record.totalDisbursed / record.amountApproved) * 100);
// //         return (
// //           <Tooltip title={`${progress}% disbursed`}>
// //             <Progress 
// //               percent={progress} 
// //               size="small"
// //               status={progress === 100 ? 'success' : 'active'}
// //             />
// //           </Tooltip>
// //         );
// //       }
// //     },
// //     {
// //       title: 'Budget Code',
// //       dataIndex: ['budgetAllocation', 'budgetCode'],
// //       key: 'budgetCode',
// //       width: 120,
// //       render: (code) => code ? <Tag color="blue">{code}</Tag> : '-'
// //     },
// //     {
// //       title: 'Action',
// //       key: 'action',
// //       fixed: 'right',
// //       width: 180,
// //       render: (_, record) => (
// //         <Space>
// //           <Button
// //             type="link"
// //             size="small"
// //             icon={<EyeOutlined />}
// //             onClick={() => navigate(`/finance/cash-request/${record._id}`)}
// //           >
// //             View
// //           </Button>
// //           <Button
// //             type="primary"
// //             size="small"
// //             icon={<SendOutlined />}
// //             onClick={() => showDisbursementModal(record)}
// //           >
// //             Disburse
// //           </Button>
// //         </Space>
// //       )
// //     }
// //   ];

// //   // Calculate summary statistics
// //   const totalAwaitingDisbursement = requests.reduce((sum, req) => sum + req.remainingBalance, 0);
// //   const totalApproved = requests.reduce((sum, req) => sum + req.amountApproved, 0);
// //   const totalAlreadyDisbursed = requests.reduce((sum, req) => sum + req.totalDisbursed, 0);

// //   return (
// //     <div style={{ padding: '24px' }}>
// //       <div style={{ marginBottom: '24px' }}>
// //         <Title level={3}>
// //           <DollarOutlined /> Pending Disbursements
// //         </Title>
// //         <Text type="secondary">
// //           Manage approved requests awaiting full or partial disbursement
// //         </Text>
// //       </div>

// //       {/* Summary Statistics */}
// //       <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
// //         <Col span={6}>
// //           <Card>
// //             <Statistic
// //               title="Total Requests"
// //               value={requests.length}
// //               prefix={<ClockCircleOutlined />}
// //               valueStyle={{ color: '#1890ff' }}
// //             />
// //           </Card>
// //         </Col>
// //         <Col span={6}>
// //           <Card>
// //             <Statistic
// //               title="Total Approved"
// //               value={totalApproved}
// //               precision={0}
// //               prefix="XAF"
// //               valueStyle={{ color: '#52c41a' }}
// //             />
// //           </Card>
// //         </Col>
// //         <Col span={6}>
// //           <Card>
// //             <Statistic
// //               title="Already Disbursed"
// //               value={totalAlreadyDisbursed}
// //               precision={0}
// //               prefix="XAF"
// //               valueStyle={{ color: '#1890ff' }}
// //             />
// //           </Card>
// //         </Col>
// //         <Col span={6}>
// //           <Card>
// //             <Statistic
// //               title="Awaiting Disbursement"
// //               value={totalAwaitingDisbursement}
// //               precision={0}
// //               prefix="XAF"
// //               valueStyle={{ color: '#fa8c16' }}
// //             />
// //           </Card>
// //         </Col>
// //       </Row>

// //       {/* Alert */}
// //       {requests.length > 0 && (
// //         <Alert
// //           message={`${requests.length} request(s) awaiting disbursement`}
// //           description="Click 'Disburse' to process full or partial payments. Employees will be notified immediately."
// //           type="info"
// //           showIcon
// //           style={{ marginBottom: '16px' }}
// //         />
// //       )}

// //       {/* Table */}
// //       <Card>
// //         <Table
// //           columns={columns}
// //           dataSource={requests}
// //           rowKey="_id"
// //           loading={loading}
// //           scroll={{ x: 1400 }}
// //           pagination={{
// //             pageSize: 10,
// //             showTotal: (total) => `Total ${total} request(s)`,
// //             showSizeChanger: true
// //           }}
// //           locale={{
// //             emptyText: (
// //               <div style={{ padding: '40px', textAlign: 'center' }}>
// //                 <CheckCircleOutlined style={{ fontSize: '48px', color: '#52c41a', marginBottom: '16px' }} />
// //                 <div>
// //                   <Text strong style={{ fontSize: '16px' }}>No Pending Disbursements</Text>
// //                 </div>
// //                 <Text type="secondary">All approved requests have been fully disbursed</Text>
// //               </div>
// //             )
// //           }}
// //         />
// //       </Card>

// //       {/* Disbursement Modal */}
// //       <Modal
// //         title={
// //           <Space>
// //             <SendOutlined />
// //             <span>Process Disbursement</span>
// //           </Space>
// //         }
// //         open={disbursementModalVisible}
// //         onCancel={() => {
// //           setDisbursementModalVisible(false);
// //           form.resetFields();
// //           setSelectedRequest(null);
// //         }}
// //         footer={null}
// //         width={600}
// //       >
// //         {selectedRequest && (
// //           <>
// //             <Alert
// //               message="Disbursement Information"
// //               description={
// //                 <div>
// //                   <div><strong>Employee:</strong> {selectedRequest.employee.fullName}</div>
// //                   <div><strong>Request ID:</strong> REQ-{selectedRequest._id.slice(-6).toUpperCase()}</div>
// //                   <div><strong>Approved Amount:</strong> XAF {selectedRequest.amountApproved.toLocaleString()}</div>
// //                   <div><strong>Already Disbursed:</strong> XAF {selectedRequest.totalDisbursed.toLocaleString()}</div>
// //                   <div><strong>Remaining Balance:</strong> XAF {selectedRequest.remainingBalance.toLocaleString()}</div>
// //                 </div>
// //               }
// //               type="info"
// //               showIcon
// //               style={{ marginBottom: '24px' }}
// //             />

// //             <Form
// //               form={form}
// //               layout="vertical"
// //               onFinish={handleDisbursement}
// //               initialValues={{
// //                 amount: selectedRequest.remainingBalance,
// //                 notes: ''
// //               }}
// //             >
// //               <Form.Item
// //                 name="amount"
// //                 label="Disbursement Amount (XAF)"
// //                 rules={[
// //                   { required: true, message: 'Please enter disbursement amount' },
// //                   {
// //                     validator: (_, value) => {
// //                       if (value > selectedRequest.remainingBalance) {
// //                         return Promise.reject(`Cannot exceed remaining balance (XAF ${selectedRequest.remainingBalance.toLocaleString()})`);
// //                       }
// //                       if (value <= 0) {
// //                         return Promise.reject('Amount must be greater than 0');
// //                       }
// //                       return Promise.resolve();
// //                     }
// //                   }
// //                 ]}
// //               >
// //                 <InputNumber
// //                   style={{ width: '100%' }}
// //                   min={0}
// //                   max={selectedRequest.remainingBalance}
// //                   step={1000}
// //                   formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
// //                   parser={(value) => value.replace(/,/g, '')}
// //                 />
// //               </Form.Item>

// //               <Form.Item noStyle shouldUpdate={(prev, curr) => prev.amount !== curr.amount}>
// //                 {({ getFieldValue }) => {
// //                   const amount = getFieldValue('amount') || 0;
// //                   const isFullDisbursement = amount === selectedRequest.remainingBalance;
// //                   const newTotal = selectedRequest.totalDisbursed + amount;
// //                   const newRemaining = selectedRequest.remainingBalance - amount;
// //                   const progress = Math.round((newTotal / selectedRequest.amountApproved) * 100);

// //                   return (
// //                     <div style={{ marginBottom: '16px' }}>
// //                       <Row gutter={16}>
// //                         <Col span={8}>
// //                           <Statistic
// //                             title="Will Disburse"
// //                             value={amount}
// //                             precision={0}
// //                             prefix="XAF"
// //                             valueStyle={{ color: '#1890ff', fontSize: '16px' }}
// //                           />
// //                         </Col>
// //                         <Col span={8}>
// //                           <Statistic
// //                             title="New Total"
// //                             value={newTotal}
// //                             precision={0}
// //                             prefix="XAF"
// //                             valueStyle={{ color: '#52c41a', fontSize: '16px' }}
// //                           />
// //                         </Col>
// //                         <Col span={8}>
// //                           <Statistic
// //                             title="New Remaining"
// //                             value={newRemaining}
// //                             precision={0}
// //                             prefix="XAF"
// //                             valueStyle={{ 
// //                               color: newRemaining === 0 ? '#52c41a' : '#fa8c16',
// //                               fontSize: '16px'
// //                             }}
// //                           />
// //                         </Col>
// //                       </Row>

// //                       <div style={{ marginTop: '16px' }}>
// //                         <Text strong>Completion Progress</Text>
// //                         <Progress 
// //                           percent={progress} 
// //                           status={progress === 100 ? 'success' : 'active'}
// //                           format={(percent) => `${percent}%`}
// //                         />
// //                       </div>

// //                       {isFullDisbursement ? (
// //                         <Alert
// //                           message="Full Disbursement"
// //                           description="This will complete the disbursement. Employee can submit justification after this."
// //                           type="success"
// //                           showIcon
// //                           style={{ marginTop: '16px' }}
// //                         />
// //                       ) : (
// //                         <Alert
// //                           message="Partial Disbursement"
// //                           description={`You can disburse the remaining XAF ${newRemaining.toLocaleString()} later.`}
// //                           type="warning"
// //                           showIcon
// //                           style={{ marginTop: '16px' }}
// //                         />
// //                       )}
// //                     </div>
// //                   );
// //                 }}
// //               </Form.Item>

// //               <Form.Item
// //                 name="notes"
// //                 label="Notes (Optional)"
// //               >
// //                 <TextArea
// //                   rows={3}
// //                   placeholder="Add any notes about this disbursement..."
// //                   maxLength={200}
// //                   showCount
// //                 />
// //               </Form.Item>

// //               <Form.Item style={{ marginBottom: 0, marginTop: '24px' }}>
// //                 <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
// //                   <Button 
// //                     onClick={() => {
// //                       setDisbursementModalVisible(false);
// //                       form.resetFields();
// //                       setSelectedRequest(null);
// //                     }}
// //                   >
// //                     Cancel
// //                   </Button>
// //                   <Button
// //                     type="primary"
// //                     htmlType="submit"
// //                     loading={disbursing}
// //                     icon={<SendOutlined />}
// //                   >
// //                     {disbursing ? 'Processing...' : 'Process Disbursement'}
// //                   </Button>
// //                 </Space>
// //               </Form.Item>
// //             </Form>
// //           </>
// //         )}
// //       </Modal>
// //     </div>
// //   );
// // };

// // export default FinanceDisbursementPage;