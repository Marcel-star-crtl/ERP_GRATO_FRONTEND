import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Table, 
  Tag, 
  Space, 
  Typography, 
  Button, 
  Alert, 
  Spin, 
  Card,
  Tooltip,
  Modal,
  Form,
  Input,
  Row,
  Col,
  message,
  Divider,
  Badge,
  Statistic,
  Descriptions,
  Timeline,
  Tabs,
  Switch
} from 'antd';
import { 
  DollarOutlined,
  CheckCircleOutlined, 
  CloseCircleOutlined, 
  ClockCircleOutlined,
  EyeOutlined,
  ReloadOutlined,
  BankOutlined,
  TagOutlined,
  WarningOutlined,
  UserOutlined,
  TeamOutlined,
  CalendarOutlined,
  FilterOutlined
} from '@ant-design/icons';
import api from '../../services/api';
import { useSelector } from 'react-redux';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const { Title, Text } = Typography;
const { TextArea } = Input;
const { TabPane } = Tabs;

const SupervisorBudgetCodeApprovals = () => {
  const [budgetCodes, setBudgetCodes] = useState([]);
  const [allBudgetCodes, setAllBudgetCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedBudgetCode, setSelectedBudgetCode] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('my-pending');
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    await Promise.all([
      fetchPendingBudgetCodes(),
      fetchAllPendingBudgetCodes()
    ]);
  };

  const fetchPendingBudgetCodes = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('Fetching MY pending budget code approvals...');
      console.log('Current user:', user?.email, user?.fullName);
      
      const response = await api.get('/budget-codes/pending-approvals');
      
      console.log('API Response:', response);
      
      if (response?.data?.success && response?.data?.data) {
        const myPending = Array.isArray(response.data.data) ? response.data.data : [];
        setBudgetCodes(myPending);
        console.log(`Found ${myPending.length} budget codes pending my approval`);
        
        if (myPending.length > 0) {
          console.log('First pending approval:', myPending[0]);
        }
      } else {
        console.warn('Unexpected response structure:', response);
        setBudgetCodes([]);
      }
    } catch (error) {
      console.error('Error fetching my pending budget codes:', error);
      console.error('Error response:', error.response);
      setError(error.response?.data?.message || error.message || 'Failed to fetch budget code approvals');
      setBudgetCodes([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllPendingBudgetCodes = async () => {
    try {
      console.log('Fetching ALL pending budget codes...');
      
      // Fetch all budget codes and filter on the client side
      const response = await api.get('/budget-codes');
      
      if (response?.data?.success && response?.data?.data) {
        const allCodes = Array.isArray(response.data.data) ? response.data.data : [];
        
        // Filter for pending codes (those not yet active)
        const pendingCodes = allCodes.filter(code => 
          code.active === false && 
          ['pending', 'pending_departmental_head', 'pending_head_of_business', 'pending_finance'].includes(code.status)
        );
        
        setAllBudgetCodes(pendingCodes);
        console.log('All pending budget codes:', pendingCodes);
        console.log(`Found ${pendingCodes.length} pending budget codes out of ${allCodes.length} total`);
      } else {
        console.warn('Unexpected response structure:', response);
        setAllBudgetCodes([]);
      }
    } catch (error) {
      console.error('Error fetching all pending budget codes:', error);
      setAllBudgetCodes([]);
    }
  };

  const handleApprovalDecision = async (values) => {
    try {
      setLoading(true);
      
      const decision = {
        decision: values.decision,
        comments: values.comments || ''
      };

      console.log('Processing budget code approval:', decision);
      const response = await api.post(
        `/budget-codes/${selectedBudgetCode._id}/approve`,
        decision
      );
      
      if (response.data.success) {
        message.success(`Budget code ${values.decision} successfully`);
        setModalVisible(false);
        setSelectedBudgetCode(null);
        form.resetFields();
        await fetchData();
      } else {
        throw new Error(response.data.message || 'Failed to process approval');
      }
    } catch (error) {
      console.error('Error processing budget code approval:', error);
      message.error(error.response?.data?.message || error.message || 'Failed to process approval');
    } finally {
      setLoading(false);
    }
  };

  const getStatusTag = (status) => {
    const statusMap = {
      'pending': { 
        color: 'default', 
        icon: <ClockCircleOutlined />, 
        text: 'Pending' 
      },
      'pending_departmental_head': { 
        color: 'orange', 
        icon: <ClockCircleOutlined />, 
        text: 'Pending Dept Head' 
      },
      'pending_head_of_business': { 
        color: 'gold', 
        icon: <ClockCircleOutlined />, 
        text: 'Pending President' 
      },
      'pending_finance': { 
        color: 'blue', 
        icon: <ClockCircleOutlined />, 
        text: 'Pending Finance' 
      },
      'active': { 
        color: 'success', 
        icon: <CheckCircleOutlined />, 
        text: 'Active' 
      },
      'rejected': { 
        color: 'error', 
        icon: <CloseCircleOutlined />, 
        text: 'Rejected' 
      }
    };

    const statusInfo = statusMap[status] || { 
      color: 'default', 
      icon: <ClockCircleOutlined />,
      text: status?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown' 
    };

    return (
      <Tag color={statusInfo.color} icon={statusInfo.icon}>
        {statusInfo.text}
      </Tag>
    );
  };

  const getBudgetTypeTag = (type) => {
    const typeMap = {
      'OPEX': { color: 'blue', icon: '💼' },
      'CAPEX': { color: 'purple', icon: '🏗️' },
      'PROJECT': { color: 'cyan', icon: '📊' },
      'OPERATIONAL': { color: 'green', icon: '⚙️' }
    };

    const typeInfo = typeMap[type] || { color: 'default', icon: '📋' };

    return (
      <Tag color={typeInfo.color}>
        {typeInfo.icon} {type}
      </Tag>
    );
  };

  const getCurrentApprovalLevel = (budgetCode) => {
    const currentStep = budgetCode.approvalChain?.find(step => step.status === 'pending');
    return currentStep || null;
  };

  const canUserApprove = (budgetCode) => {
    const currentStep = getCurrentApprovalLevel(budgetCode);
    if (!currentStep) return false;

    return currentStep.approver?.email?.toLowerCase() === user?.email?.toLowerCase();
  };

  const columns = [
    {
      title: 'Budget Code',
      dataIndex: 'code',
      key: 'code',
      render: (code, record) => (
        <div>
          <Text code strong style={{ fontSize: '13px' }}>{code}</Text>
          <br />
          <Text type="secondary" ellipsis style={{ fontSize: '11px', maxWidth: '150px', display: 'block' }}>
            {record.name}
          </Text>
        </div>
      ),
      width: 160,
      fixed: 'left'
    },
    {
      title: 'Department',
      dataIndex: 'department',
      key: 'department',
      render: (dept) => (
        <Tag color="blue" icon={<TeamOutlined />}>
          {dept}
        </Tag>
      ),
      width: 140
    },
    {
      title: 'Budget Type',
      dataIndex: 'budgetType',
      key: 'budgetType',
      render: (type) => getBudgetTypeTag(type),
      width: 120
    },
    {
      title: 'Total Budget',
      dataIndex: 'budget',
      key: 'budget',
      render: (budget) => (
        <Text strong style={{ fontSize: '12px', color: '#1890ff' }}>
          XAF {budget?.toLocaleString() || '0'}
        </Text>
      ),
      width: 140,
      sorter: (a, b) => (a.budget || 0) - (b.budget || 0)
    },
    {
      title: 'Budget Owner',
      key: 'budgetOwner',
      render: (_, record) => (
        <div>
          <Text strong style={{ fontSize: '12px' }}>
            {record.budgetOwner?.fullName || 'N/A'}
          </Text>
          <br />
          <Text type="secondary" style={{ fontSize: '10px' }}>
            {record.budgetOwner?.department || ''}
          </Text>
        </div>
      ),
      width: 150
    },
    {
      title: 'Created',
      key: 'createdAt',
      render: (_, record) => (
        <div>
          <Text style={{ fontSize: '11px' }}>
            {dayjs(record.createdAt).format('MMM DD, YYYY')}
          </Text>
          <br />
          <Text type="secondary" style={{ fontSize: '10px' }}>
            {dayjs(record.createdAt).fromNow()}
          </Text>
        </div>
      ),
      width: 120,
      sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
    },
    {
      title: 'Current Approval',
      key: 'currentApproval',
      render: (_, record) => {
        const currentStep = getCurrentApprovalLevel(record);
        if (!currentStep) {
          return getStatusTag(record.status);
        }

        const isYourTurn = canUserApprove(record);

        return (
          <div>
            {getStatusTag(record.status)}
            <br />
            <Text type="secondary" style={{ fontSize: '11px' }}>
              Level {currentStep.level}: {currentStep.approver.role}
            </Text>
            <br />
            <Text type="secondary" style={{ fontSize: '10px' }}>
              {currentStep.approver.name}
            </Text>
            {isYourTurn && (
              <div style={{ marginTop: 4 }}>
                <Tag color="gold" size="small" icon={<UserOutlined />}>
                  Your Turn
                </Tag>
              </div>
            )}
          </div>
        );
      },
      width: 180
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => {
        const isYourTurn = canUserApprove(record);
        const isPending = ['pending', 'pending_departmental_head', 'pending_head_of_business', 'pending_finance'].includes(record.status);

        return (
          <Space size="small">
            <Tooltip title="View Details">
              <Button 
                type="link" 
                icon={<EyeOutlined />}
                onClick={() => {
                  setSelectedBudgetCode(record);
                  setDetailsModalVisible(true);
                }}
                size="small"
              />
            </Tooltip>
            
            {isYourTurn && isPending && (
              <Tooltip title="Review & Approve">
                <Button 
                  type="primary" 
                  size="small"
                  onClick={() => {
                    setSelectedBudgetCode(record);
                    setModalVisible(true);
                  }}
                >
                  Review
                </Button>
              </Tooltip>
            )}
            
            {!isYourTurn && isPending && (
              <Tooltip title="Waiting for another approver">
                <Button 
                  type="default" 
                  size="small"
                  disabled
                >
                  Pending
                </Button>
              </Tooltip>
            )}
          </Space>
        );
      },
      width: 140,
      fixed: 'right'
    }
  ];

  const getStatsCards = (dataSource) => {
    const totalCodes = dataSource.length;
    const pendingDeptHead = dataSource.filter(c => c.status === 'pending_departmental_head').length;
    const pendingPresident = dataSource.filter(c => c.status === 'pending_head_of_business').length;
    const pendingFinance = dataSource.filter(c => c.status === 'pending_finance').length;
    const myPending = dataSource.filter(c => canUserApprove(c)).length;
    const totalBudget = dataSource.reduce((sum, c) => sum + (c.budget || 0), 0);

    return (
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} md={8} lg={6} xl={4}>
          <Card size="small">
            <Statistic
              title="Total Pending"
              value={totalCodes}
              valueStyle={{ color: '#1890ff' }}
              prefix={<TagOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6} xl={4}>
          <Card size="small">
            <Statistic
              title="Your Action Needed"
              value={myPending}
              valueStyle={{ color: myPending > 0 ? '#faad14' : '#52c41a' }}
              prefix={<UserOutlined />}
            />
            {myPending > 0 && (
              <Badge count={myPending} style={{ position: 'absolute', top: 8, right: 8 }} />
            )}
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6} xl={4}>
          <Card size="small">
            <Statistic
              title="Pending Dept Head"
              value={pendingDeptHead}
              valueStyle={{ color: '#ff7a45' }}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6} xl={4}>
          <Card size="small">
            <Statistic
              title="Pending President"
              value={pendingPresident}
              valueStyle={{ color: '#faad14' }}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6} xl={4}>
          <Card size="small">
            <Statistic
              title="Pending Finance"
              value={pendingFinance}
              valueStyle={{ color: '#1890ff' }}
              prefix={<BankOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6} xl={4}>
          <Card size="small">
            <Statistic
              title="Total Budget Value"
              value={totalBudget / 1000000}
              suffix="M"
              prefix="XAF"
              valueStyle={{ color: '#52c41a' }}
              precision={1}
            />
          </Card>
        </Col>
      </Row>
    );
  };

  if (loading && budgetCodes.length === 0 && allBudgetCodes.length === 0) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Spin size="large" />
        <div style={{ marginTop: '16px' }}>Loading budget code approvals...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <Title level={2} style={{ margin: 0 }}>
            <TagOutlined /> Budget Code Approvals
          </Title>
          <Space>
            <Button 
              icon={<ReloadOutlined />}
              onClick={fetchData}
              loading={loading}
            >
              Refresh
            </Button>
            <Button
              icon={<DollarOutlined />}
              onClick={() => navigate('/finance/budget-management')}
            >
              Budget Dashboard
            </Button>
          </Space>
        </div>

        {error && (
          <Alert
            message="Error Loading Data"
            description={error}
            type="error"
            showIcon
            closable
            style={{ marginBottom: '16px' }}
            onClose={() => setError(null)}
          />
        )}

        {/* Tabs for different views */}
        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab}
          style={{ marginTop: '16px' }}
        >
          <TabPane 
            tab={
              <span>
                <UserOutlined />
                My Pending Approvals
                {budgetCodes.length > 0 && (
                  <Badge 
                    count={budgetCodes.length} 
                    style={{ marginLeft: 8 }} 
                  />
                )}
              </span>
            } 
            key="my-pending"
          >
            {getStatsCards(budgetCodes)}

            {/* Debug Info */}
            <Alert
              message="Debug Information"
              description={
                <div style={{ fontSize: '11px', fontFamily: 'monospace' }}>
                  <div><strong>Your Email:</strong> {user?.email}</div>
                  <div><strong>Your Name:</strong> {user?.fullName}</div>
                  <div><strong>Your Role:</strong> {user?.role}</div>
                  <div><strong>Budget Codes Found:</strong> {budgetCodes.length}</div>
                  <div><strong>All Pending Found:</strong> {allBudgetCodes.length}</div>
                </div>
              }
              type="info"
              showIcon
              closable
              style={{ marginBottom: '16px' }}
            />

            <Alert
              message="Your Pending Approvals"
              description="These budget codes require your immediate action. You are the current approver in the approval chain."
              type="info"
              showIcon
              style={{ marginBottom: '16px' }}
            />

            {budgetCodes.length === 0 ? (
              <Alert
                message="No Pending Approvals"
                description="You don't have any budget codes waiting for your approval at this time. Great job staying on top of approvals!"
                type="success"
                showIcon
                icon={<CheckCircleOutlined />}
              />
            ) : (
              <Table 
                columns={columns} 
                dataSource={budgetCodes} 
                loading={loading}
                rowKey="_id"
                pagination={{ 
                  pageSize: 10,
                  showSizeChanger: true,
                  showTotal: (total) => `${total} budget code${total !== 1 ? 's' : ''} requiring your approval`
                }}
                scroll={{ x: 'max-content' }}
                rowClassName={() => 'your-turn-row'}
              />
            )}
          </TabPane>

          <TabPane 
            tab={
              <span>
                <FilterOutlined />
                All Pending Budget Codes
                {allBudgetCodes.length > 0 && (
                  <Badge 
                    count={allBudgetCodes.length} 
                    style={{ marginLeft: 8, backgroundColor: '#1890ff' }} 
                  />
                )}
              </span>
            } 
            key="all-pending"
          >
            {getStatsCards(allBudgetCodes)}

            <Alert
              message="All Pending Budget Codes"
              description="This shows all budget codes currently in the approval pipeline, regardless of who needs to approve them next."
              type="info"
              showIcon
              style={{ marginBottom: '16px' }}
            />

            {allBudgetCodes.length === 0 ? (
              <Alert
                message="No Pending Budget Codes"
                description="There are no budget codes pending approval in the system."
                type="info"
                showIcon
              />
            ) : (
              <Table 
                columns={columns} 
                dataSource={allBudgetCodes} 
                loading={loading}
                rowKey="_id"
                pagination={{ 
                  pageSize: 10,
                  showSizeChanger: true,
                  showTotal: (total) => `${total} budget code${total !== 1 ? 's' : ''} in approval pipeline`
                }}
                scroll={{ x: 'max-content' }}
                rowClassName={(record) => canUserApprove(record) ? 'your-turn-row' : ''}
              />
            )}
          </TabPane>
        </Tabs>
      </Card>

      {/* Details Modal */}
      <Modal
        title={
          <Space>
            <EyeOutlined />
            Budget Code Details
          </Space>
        }
        open={detailsModalVisible}
        onCancel={() => {
          setDetailsModalVisible(false);
          setSelectedBudgetCode(null);
        }}
        footer={[
          <Button
            key="close"
            onClick={() => {
              setDetailsModalVisible(false);
              setSelectedBudgetCode(null);
            }}
          >
            Close
          </Button>,
          selectedBudgetCode && canUserApprove(selectedBudgetCode) && (
            <Button
              key="review"
              type="primary"
              onClick={() => {
                setDetailsModalVisible(false);
                setModalVisible(true);
              }}
            >
              Review & Approve
            </Button>
          )
        ]}
        width={900}
      >
        {selectedBudgetCode && (
          <div>
            {/* Budget Code Summary */}
            <Card size="small" style={{ marginBottom: '16px', backgroundColor: '#f0f8ff' }}>
              <Row gutter={16}>
                <Col span={12}>
                  <Descriptions column={1} size="small">
                    <Descriptions.Item label="Budget Code">
                      <Text code strong style={{ fontSize: '14px' }}>{selectedBudgetCode.code}</Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="Name">
                      <Text strong>{selectedBudgetCode.name}</Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="Department">
                      <Tag color="blue">{selectedBudgetCode.department}</Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="Budget Type">
                      {getBudgetTypeTag(selectedBudgetCode.budgetType)}
                    </Descriptions.Item>
                  </Descriptions>
                </Col>
                <Col span={12}>
                  <Descriptions column={1} size="small">
                    <Descriptions.Item label="Total Budget">
                      <Text strong style={{ fontSize: '16px', color: '#1890ff' }}>
                        XAF {selectedBudgetCode.budget?.toLocaleString() || '0'}
                      </Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="Budget Period">
                      <Tag icon={<CalendarOutlined />}>
                        {selectedBudgetCode.budgetPeriod?.charAt(0).toUpperCase() + selectedBudgetCode.budgetPeriod?.slice(1)}
                      </Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="Fiscal Year">
                      {selectedBudgetCode.fiscalYear}
                    </Descriptions.Item>
                    <Descriptions.Item label="Status">
                      {getStatusTag(selectedBudgetCode.status)}
                    </Descriptions.Item>
                  </Descriptions>
                </Col>
              </Row>
            </Card>

            {/* Description */}
            {selectedBudgetCode.description && (
              <div style={{ marginBottom: '16px' }}>
                <Text strong>Description:</Text>
                <div style={{ padding: '8px', backgroundColor: '#fafafa', borderRadius: '4px', marginTop: '4px' }}>
                  {selectedBudgetCode.description}
                </div>
              </div>
            )}

            <Divider />

            {/* Approval Chain */}
            <Card size="small" title="Approval Progress">
              <Timeline>
                {selectedBudgetCode.approvalChain && selectedBudgetCode.approvalChain.map((step, index) => {
                  const color = step.status === 'approved' ? 'green' :
                               step.status === 'rejected' ? 'red' : 'gray';
                  const icon = step.status === 'approved' ? <CheckCircleOutlined /> :
                              step.status === 'rejected' ? <CloseCircleOutlined /> :
                              <ClockCircleOutlined />;
                  
                  const isCurrentUser = step.approver?.email?.toLowerCase() === user?.email?.toLowerCase();

                  return (
                    <Timeline.Item key={index} color={color} dot={icon}>
                      <Space direction="vertical" size="small">
                        <div>
                          <Text strong>Level {step.level}: {step.approver.name}</Text>
                          {isCurrentUser && step.status === 'pending' && (
                            <Tag color="gold" style={{ marginLeft: '8px' }}>
                              Your Turn
                            </Tag>
                          )}
                        </div>
                        <Text type="secondary">{step.approver.role}</Text>
                        <Text type="secondary" style={{ fontSize: '11px' }}>{step.approver.email}</Text>
                        <Tag color={color}>{step.status.toUpperCase()}</Tag>
                        {step.actionDate && (
                          <Text type="secondary" style={{ fontSize: '11px' }}>
                            {dayjs(step.actionDate).format('MMM DD, YYYY')} at {step.actionTime}
                          </Text>
                        )}
                        {step.comments && (
                          <div style={{ marginTop: 4, padding: '4px 8px', backgroundColor: '#f0f0f0', borderRadius: '4px' }}>
                            <Text italic style={{ fontSize: '11px' }}>"{step.comments}"</Text>
                          </div>
                        )}
                      </Space>
                    </Timeline.Item>
                  );
                })}
              </Timeline>
            </Card>
          </div>
        )}
      </Modal>

      {/* Approval Modal */}
      <Modal
        title={`Review Budget Code: ${selectedBudgetCode?.code}`}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setSelectedBudgetCode(null);
          form.resetFields();
        }}
        footer={null}
        width={700}
      >
        {selectedBudgetCode && (
          <div>
            <Card size="small" style={{ marginBottom: '16px', backgroundColor: '#f6ffed' }}>
              <Row gutter={16}>
                <Col span={12}>
                  <Text strong>Budget Code:</Text> {selectedBudgetCode.code}
                  <br />
                  <Text strong>Department:</Text> {selectedBudgetCode.department}
                </Col>
                <Col span={12}>
                  <Text strong>Total Budget:</Text>
                  <br />
                  <Text style={{ fontSize: '18px', color: '#1890ff' }}>
                    XAF {selectedBudgetCode.budget?.toLocaleString() || '0'}
                  </Text>
                </Col>
              </Row>
            </Card>

            <Divider />

            <Form
              form={form}
              layout="vertical"
              onFinish={handleApprovalDecision}
            >
              <Form.Item
                name="decision"
                label="Your Decision"
                rules={[{ required: true, message: 'Please select your decision' }]}
              >
                <div>
                  <Button 
                    type="primary" 
                    size="large"
                    icon={<CheckCircleOutlined />}
                    onClick={() => {
                      form.setFieldsValue({ decision: 'approved' });
                      form.submit();
                    }}
                    style={{ marginRight: '8px', width: '48%' }}
                  >
                    Approve
                  </Button>
                  <Button 
                    danger
                    size="large"
                    icon={<CloseCircleOutlined />}
                    onClick={() => {
                      form.setFieldsValue({ decision: 'rejected' });
                      form.submit();
                    }}
                    style={{ width: '48%' }}
                  >
                    Reject
                  </Button>
                </div>
              </Form.Item>

              <Form.Item
                name="comments"
                label="Comments"
              >
                <TextArea
                  rows={4}
                  placeholder="Add any comments..."
                  maxLength={500}
                />
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>

      <style jsx>{`
        .your-turn-row {
          background-color: #fffbf0 !important;
        }
        .your-turn-row:hover {
          background-color: #fff7e6 !important;
        }
      `}</style>
    </div>
  );
};

export default SupervisorBudgetCodeApprovals;








// import React, { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { 
//   Table, 
//   Tag, 
//   Space, 
//   Typography, 
//   Button, 
//   Alert, 
//   Spin, 
//   Card,
//   Tooltip,
//   Modal,
//   Form,
//   Input,
//   Row,
//   Col,
//   message,
//   Progress,
//   Divider,
//   Badge,
//   Statistic,
//   Descriptions,
//   Timeline
// } from 'antd';
// import { 
//   DollarOutlined,
//   CheckCircleOutlined, 
//   CloseCircleOutlined, 
//   ClockCircleOutlined,
//   EyeOutlined,
//   ReloadOutlined,
//   BankOutlined,
//   TagOutlined,
//   FileTextOutlined,
//   WarningOutlined,
//   UserOutlined,
//   TeamOutlined,
//   CalendarOutlined,
//   FundOutlined
// } from '@ant-design/icons';
// import api from '../../services/api';
// import { useSelector } from 'react-redux';
// import dayjs from 'dayjs';
// import relativeTime from 'dayjs/plugin/relativeTime';

// dayjs.extend(relativeTime);

// const { Title, Text, Paragraph } = Typography;
// const { TextArea } = Input;

// const SupervisorBudgetCodeApprovals = () => {
//   const [budgetCodes, setBudgetCodes] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [selectedBudgetCode, setSelectedBudgetCode] = useState(null);
//   const [modalVisible, setModalVisible] = useState(false);
//   const [detailsModalVisible, setDetailsModalVisible] = useState(false);
//   const [form] = Form.useForm();
//   const navigate = useNavigate();
//   const { user } = useSelector((state) => state.auth);

//   useEffect(() => {
//     fetchPendingBudgetCodes();
//   }, []);

//   const fetchPendingBudgetCodes = async () => {
//     try {
//       setLoading(true);
//       setError(null);

//       console.log('Fetching pending budget code approvals...');
//       const response = await api.get('/budget-codes/pending-approvals');
      
//       if (response?.data?.success && response?.data?.data) {
//         setBudgetCodes(Array.isArray(response.data.data) ? response.data.data : []);
//       } else {
//         console.warn('Unexpected response structure:', response);
//         setBudgetCodes([]);
//       }
//     } catch (error) {
//       console.error('Error fetching pending budget codes:', error);
//       setError(error.response?.data?.message || error.message || 'Failed to fetch budget code approvals');
//       setBudgetCodes([]);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleApprovalDecision = async (values) => {
//     try {
//       setLoading(true);
      
//       const decision = {
//         decision: values.decision,
//         comments: values.comments || ''
//       };

//       console.log('Processing budget code approval:', decision);
//       const response = await api.post(
//         `/budget-codes/${selectedBudgetCode._id}/approve`,
//         decision
//       );
      
//       if (response.data.success) {
//         message.success(`Budget code ${values.decision} successfully`);
//         setModalVisible(false);
//         setSelectedBudgetCode(null);
//         form.resetFields();
//         await fetchPendingBudgetCodes();
//       } else {
//         throw new Error(response.data.message || 'Failed to process approval');
//       }
//     } catch (error) {
//       console.error('Error processing budget code approval:', error);
//       message.error(error.response?.data?.message || error.message || 'Failed to process approval');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const getStatusTag = (status) => {
//     const statusMap = {
//       'pending': { 
//         color: 'default', 
//         icon: <ClockCircleOutlined />, 
//         text: 'Pending' 
//       },
//       'pending_departmental_head': { 
//         color: 'orange', 
//         icon: <ClockCircleOutlined />, 
//         text: 'Pending Dept Head' 
//       },
//       'pending_head_of_business': { 
//         color: 'gold', 
//         icon: <ClockCircleOutlined />, 
//         text: 'Pending President' 
//       },
//       'pending_finance': { 
//         color: 'blue', 
//         icon: <ClockCircleOutlined />, 
//         text: 'Pending Finance' 
//       },
//       'active': { 
//         color: 'success', 
//         icon: <CheckCircleOutlined />, 
//         text: 'Active' 
//       },
//       'rejected': { 
//         color: 'error', 
//         icon: <CloseCircleOutlined />, 
//         text: 'Rejected' 
//       },
//       'suspended': { 
//         color: 'red', 
//         icon: <CloseCircleOutlined />, 
//         text: 'Suspended' 
//       },
//       'expired': { 
//         color: 'default', 
//         icon: <ClockCircleOutlined />, 
//         text: 'Expired' 
//       }
//     };

//     const statusInfo = statusMap[status] || { 
//       color: 'default', 
//       icon: <ClockCircleOutlined />,
//       text: status?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown' 
//     };

//     return (
//       <Tag color={statusInfo.color} icon={statusInfo.icon}>
//         {statusInfo.text}
//       </Tag>
//     );
//   };

//   const getBudgetTypeTag = (type) => {
//     const typeMap = {
//       'OPEX': { color: 'blue', icon: '💼' },
//       'CAPEX': { color: 'purple', icon: '🏗️' },
//       'PROJECT': { color: 'cyan', icon: '📊' },
//       'OPERATIONAL': { color: 'green', icon: '⚙️' }
//     };

//     const typeInfo = typeMap[type] || { color: 'default', icon: '📋' };

//     return (
//       <Tag color={typeInfo.color}>
//         {typeInfo.icon} {type}
//       </Tag>
//     );
//   };

//   const getUtilizationColor = (percentage) => {
//     if (percentage >= 90) return '#f5222d';
//     if (percentage >= 75) return '#faad14';
//     if (percentage >= 50) return '#1890ff';
//     return '#52c41a';
//   };

//   const getCurrentApprovalLevel = (budgetCode) => {
//     const currentStep = budgetCode.approvalChain?.find(step => step.status === 'pending');
//     return currentStep || null;
//   };

//   const canUserApprove = (budgetCode) => {
//     const currentStep = getCurrentApprovalLevel(budgetCode);
//     if (!currentStep) return false;

//     return currentStep.approver?.email?.toLowerCase() === user?.email?.toLowerCase();
//   };

//   const columns = [
//     {
//       title: 'Budget Code',
//       dataIndex: 'code',
//       key: 'code',
//       render: (code, record) => (
//         <div>
//           <Text code strong style={{ fontSize: '13px' }}>{code}</Text>
//           <br />
//           <Text type="secondary" ellipsis style={{ fontSize: '11px', maxWidth: '150px', display: 'block' }}>
//             {record.name}
//           </Text>
//         </div>
//       ),
//       width: 160
//     },
//     {
//       title: 'Department',
//       dataIndex: 'department',
//       key: 'department',
//       render: (dept) => (
//         <Tag color="blue" icon={<TeamOutlined />}>
//           {dept}
//         </Tag>
//       ),
//       width: 140,
//       filters: [
//         { text: 'IT', value: 'IT' },
//         { text: 'Finance', value: 'Finance' },
//         { text: 'HR', value: 'HR' },
//         { text: 'Operations', value: 'Operations' },
//         { text: 'Sales', value: 'Sales' },
//         { text: 'Engineering', value: 'Engineering' },
//         { text: 'Supply Chain', value: 'Business Development & Supply Chain' }
//       ],
//       onFilter: (value, record) => record.department === value
//     },
//     {
//       title: 'Budget Type',
//       dataIndex: 'budgetType',
//       key: 'budgetType',
//       render: (type) => getBudgetTypeTag(type),
//       width: 120,
//       filters: [
//         { text: 'OPEX', value: 'OPEX' },
//         { text: 'CAPEX', value: 'CAPEX' },
//         { text: 'PROJECT', value: 'PROJECT' },
//         { text: 'OPERATIONAL', value: 'OPERATIONAL' }
//       ],
//       onFilter: (value, record) => record.budgetType === value
//     },
//     {
//       title: 'Total Budget',
//       dataIndex: 'budget',
//       key: 'budget',
//       render: (budget) => (
//         <Text strong style={{ fontSize: '12px', color: '#1890ff' }}>
//           XAF {budget.toLocaleString()}
//         </Text>
//       ),
//       width: 140,
//       sorter: (a, b) => a.budget - b.budget
//     },
//     {
//       title: 'Period',
//       dataIndex: 'budgetPeriod',
//       key: 'budgetPeriod',
//       render: (period) => (
//         <Tag icon={<CalendarOutlined />}>
//           {period?.charAt(0).toUpperCase() + period?.slice(1)}
//         </Tag>
//       ),
//       width: 100
//     },
//     {
//       title: 'Budget Owner',
//       key: 'budgetOwner',
//       render: (_, record) => (
//         <div>
//           <Text strong style={{ fontSize: '12px' }}>
//             {record.budgetOwner?.fullName || 'N/A'}
//           </Text>
//           <br />
//           <Text type="secondary" style={{ fontSize: '10px' }}>
//             {record.budgetOwner?.email || ''}
//           </Text>
//         </div>
//       ),
//       width: 150
//     },
//     {
//       title: 'Created By',
//       key: 'createdBy',
//       render: (_, record) => (
//         <div>
//           <Text style={{ fontSize: '12px' }}>
//             {record.createdBy?.fullName || 'N/A'}
//           </Text>
//           <br />
//           <Text type="secondary" style={{ fontSize: '10px' }}>
//             {dayjs(record.createdAt).format('MMM DD, YYYY')}
//           </Text>
//           <br />
//           <Text type="secondary" style={{ fontSize: '10px' }}>
//             {dayjs(record.createdAt).fromNow()}
//           </Text>
//         </div>
//       ),
//       width: 140,
//       sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
//     },
//     {
//       title: 'Current Approval',
//       key: 'currentApproval',
//       render: (_, record) => {
//         const currentStep = getCurrentApprovalLevel(record);
//         if (!currentStep) {
//           return getStatusTag(record.status);
//         }

//         const isYourTurn = canUserApprove(record);

//         return (
//           <div>
//             {getStatusTag(record.status)}
//             <br />
//             <Text type="secondary" style={{ fontSize: '11px' }}>
//               Level {currentStep.level}: {currentStep.approver.role}
//             </Text>
//             {isYourTurn && (
//               <div style={{ marginTop: 4 }}>
//                 <Tag color="gold" size="small" icon={<UserOutlined />}>
//                   Your Turn
//                 </Tag>
//               </div>
//             )}
//           </div>
//         );
//       },
//       width: 180
//     },
//     {
//       title: 'Actions',
//       key: 'actions',
//       render: (_, record) => {
//         const isYourTurn = canUserApprove(record);
//         const isPending = ['pending', 'pending_departmental_head', 'pending_head_of_business', 'pending_finance'].includes(record.status);

//         return (
//           <Space size="small">
//             <Tooltip title="View Details">
//               <Button 
//                 type="link" 
//                 icon={<EyeOutlined />}
//                 onClick={() => {
//                   setSelectedBudgetCode(record);
//                   setDetailsModalVisible(true);
//                 }}
//                 size="small"
//               />
//             </Tooltip>
            
//             {isYourTurn && isPending && (
//               <Tooltip title="Review & Approve">
//                 <Button 
//                   type="primary" 
//                   size="small"
//                   onClick={() => {
//                     setSelectedBudgetCode(record);
//                     setModalVisible(true);
//                   }}
//                 >
//                   Review
//                 </Button>
//               </Tooltip>
//             )}
            
//             {!isYourTurn && isPending && (
//               <Tooltip title="Waiting for another approver">
//                 <Button 
//                   type="default" 
//                   size="small"
//                   disabled
//                 >
//                   Pending
//                 </Button>
//               </Tooltip>
//             )}
//           </Space>
//         );
//       },
//       width: 140,
//       fixed: 'right'
//     }
//   ];

//   const getStatsCards = () => {
//     const totalCodes = budgetCodes.length;
//     const pendingDeptHead = budgetCodes.filter(c => c.status === 'pending_departmental_head').length;
//     const pendingPresident = budgetCodes.filter(c => c.status === 'pending_head_of_business').length;
//     const pendingFinance = budgetCodes.filter(c => c.status === 'pending_finance').length;
//     const myPending = budgetCodes.filter(c => canUserApprove(c)).length;
//     const totalBudget = budgetCodes.reduce((sum, c) => sum + c.budget, 0);
//     const activeCodes = budgetCodes.filter(c => c.status === 'active').length;
//     const rejectedCodes = budgetCodes.filter(c => c.status === 'rejected').length;

//     return (
//       <Row gutter={16} style={{ marginBottom: '24px' }}>
//         <Col xs={24} sm={12} md={8} lg={6} xl={4}>
//           <Card size="small">
//             <Statistic
//               title="Total Budget Codes"
//               value={totalCodes}
//               valueStyle={{ color: '#1890ff' }}
//               prefix={<TagOutlined />}
//             />
//           </Card>
//         </Col>
//         <Col xs={24} sm={12} md={8} lg={6} xl={4}>
//           <Card size="small">
//             <Statistic
//               title="Your Pending"
//               value={myPending}
//               valueStyle={{ color: '#faad14' }}
//               prefix={<UserOutlined />}
//             />
//             {myPending > 0 && (
//               <Badge count={myPending} offset={[8, -2]} />
//             )}
//           </Card>
//         </Col>
//         <Col xs={24} sm={12} md={8} lg={6} xl={4}>
//           <Card size="small">
//             <Statistic
//               title="Pending Dept Head"
//               value={pendingDeptHead}
//               valueStyle={{ color: '#ff7a45' }}
//               prefix={<ClockCircleOutlined />}
//             />
//           </Card>
//         </Col>
//         <Col xs={24} sm={12} md={8} lg={6} xl={4}>
//           <Card size="small">
//             <Statistic
//               title="Pending President"
//               value={pendingPresident}
//               valueStyle={{ color: '#faad14' }}
//               prefix={<ClockCircleOutlined />}
//             />
//           </Card>
//         </Col>
//         <Col xs={24} sm={12} md={8} lg={6} xl={4}>
//           <Card size="small">
//             <Statistic
//               title="Pending Finance"
//               value={pendingFinance}
//               valueStyle={{ color: '#1890ff' }}
//               prefix={<BankOutlined />}
//             />
//           </Card>
//         </Col>
//         <Col xs={24} sm={12} md={8} lg={6} xl={4}>
//           <Card size="small">
//             <Statistic
//               title="Total Budget Value"
//               value={totalBudget / 1000000}
//               suffix="M"
//               prefix="XAF"
//               valueStyle={{ color: '#52c41a' }}
//               precision={1}
//             />
//           </Card>
//         </Col>
//       </Row>
//     );
//   };

//   if (loading && budgetCodes.length === 0) {
//     return (
//       <div style={{ padding: '24px', textAlign: 'center' }}>
//         <Spin size="large" />
//         <div style={{ marginTop: '16px' }}>Loading budget code approvals...</div>
//       </div>
//     );
//   }

//   return (
//     <div style={{ padding: '24px' }}>
//       <Card>
//         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
//           <Title level={2} style={{ margin: 0 }}>
//             <TagOutlined /> Budget Code Approvals
//           </Title>
//           <Space>
//             <Button 
//               icon={<ReloadOutlined />}
//               onClick={fetchPendingBudgetCodes}
//               loading={loading}
//             >
//               Refresh
//             </Button>
//             <Button
//               icon={<DollarOutlined />}
//               onClick={() => navigate('/finance/budget-management')}
//             >
//               Budget Dashboard
//             </Button>
//           </Space>
//         </div>

//         {error && (
//           <Alert
//             message="Error Loading Data"
//             description={error}
//             type="error"
//             showIcon
//             closable
//             style={{ marginBottom: '16px' }}
//             onClose={() => setError(null)}
//           />
//         )}

//         {/* Stats Cards */}
//         {getStatsCards()}

//         {/* Approval Guidelines */}
//         <Alert
//           message="Budget Code Approval Guidelines"
//           description={
//             <div>
//               <p><strong>Approval Chain:</strong> Budget codes go through a 3-level approval process:</p>
//               <ul>
//                 <li><strong>Level 1:</strong> Departmental Head - Reviews department budget allocation and justification</li>
//                 <li><strong>Level 2:</strong> Head of Business (President) - Reviews strategic alignment and overall budget impact</li>
//                 <li><strong>Level 3:</strong> Finance Officer - Final approval and budget code activation</li>
//               </ul>
//               <p><strong>Your Role:</strong> Review the budget justification, ensure proper allocation, and verify alignment with organizational goals.</p>
//               <p><strong>Note:</strong> Budget codes marked "Your Turn" require your immediate attention. You can only approve codes at your current level in the approval chain.</p>
//             </div>
//           }
//           type="info"
//           showIcon
//           style={{ marginBottom: '16px' }}
//         />

//         {budgetCodes.length === 0 ? (
//           <Alert
//             message="No Budget Code Approvals"
//             description="There are no budget codes pending your approval at this time."
//             type="info"
//             showIcon
//           />
//         ) : (
//           <>
//             <Text type="secondary" style={{ marginBottom: '8px', display: 'block' }}>
//               Showing {budgetCodes.length} budget code{budgetCodes.length !== 1 ? 's' : ''} requiring approval
//             </Text>
            
//             <Table 
//               columns={columns} 
//               dataSource={budgetCodes} 
//               loading={loading}
//               rowKey="_id"
//               pagination={{ 
//                 pageSize: 10,
//                 showSizeChanger: true,
//                 showQuickJumper: true,
//                 showTotal: (total, range) => 
//                   `${range[0]}-${range[1]} of ${total} budget codes`
//               }}
//               scroll={{ x: 'max-content' }}
//               rowClassName={(record) => {
//                 const isYourTurn = canUserApprove(record);
                
//                 if (isYourTurn) {
//                   return 'your-turn-row';
//                 }
                
//                 if (record.status === 'pending_finance') {
//                   return 'pending-finance-row';
//                 }
                
//                 return '';
//               }}
//             />
//           </>
//         )}
//       </Card>

//       {/* Details Modal */}
//       <Modal
//         title={
//           <Space>
//             <EyeOutlined />
//             Budget Code Details
//           </Space>
//         }
//         open={detailsModalVisible}
//         onCancel={() => {
//           setDetailsModalVisible(false);
//           setSelectedBudgetCode(null);
//         }}
//         footer={[
//           <Button
//             key="close"
//             onClick={() => {
//               setDetailsModalVisible(false);
//               setSelectedBudgetCode(null);
//             }}
//           >
//             Close
//           </Button>,
//           selectedBudgetCode && canUserApprove(selectedBudgetCode) && (
//             <Button
//               key="review"
//               type="primary"
//               onClick={() => {
//                 setDetailsModalVisible(false);
//                 setModalVisible(true);
//               }}
//             >
//               Review & Approve
//             </Button>
//           )
//         ]}
//         width={900}
//       >
//         {selectedBudgetCode && (
//           <div>
//             {/* Budget Code Summary */}
//             <Card size="small" style={{ marginBottom: '16px', backgroundColor: '#f0f8ff' }}>
//               <Row gutter={16}>
//                 <Col span={12}>
//                   <Descriptions column={1} size="small">
//                     <Descriptions.Item label="Budget Code">
//                       <Text code strong style={{ fontSize: '14px' }}>{selectedBudgetCode.code}</Text>
//                     </Descriptions.Item>
//                     <Descriptions.Item label="Name">
//                       <Text strong>{selectedBudgetCode.name}</Text>
//                     </Descriptions.Item>
//                     <Descriptions.Item label="Department">
//                       <Tag color="blue">{selectedBudgetCode.department}</Tag>
//                     </Descriptions.Item>
//                     <Descriptions.Item label="Budget Type">
//                       {getBudgetTypeTag(selectedBudgetCode.budgetType)}
//                     </Descriptions.Item>
//                   </Descriptions>
//                 </Col>
//                 <Col span={12}>
//                   <Descriptions column={1} size="small">
//                     <Descriptions.Item label="Total Budget">
//                       <Text strong style={{ fontSize: '16px', color: '#1890ff' }}>
//                         XAF {selectedBudgetCode.budget.toLocaleString()}
//                       </Text>
//                     </Descriptions.Item>
//                     <Descriptions.Item label="Budget Period">
//                       <Tag icon={<CalendarOutlined />}>
//                         {selectedBudgetCode.budgetPeriod?.charAt(0).toUpperCase() + selectedBudgetCode.budgetPeriod?.slice(1)}
//                       </Tag>
//                     </Descriptions.Item>
//                     <Descriptions.Item label="Fiscal Year">
//                       {selectedBudgetCode.fiscalYear}
//                     </Descriptions.Item>
//                     <Descriptions.Item label="Status">
//                       {getStatusTag(selectedBudgetCode.status)}
//                     </Descriptions.Item>
//                   </Descriptions>
//                 </Col>
//               </Row>
//             </Card>

//             {/* Budget Owner & Creator */}
//             <Card size="small" title="Ownership & Creation" style={{ marginBottom: '16px' }}>
//               <Row gutter={16}>
//                 <Col span={12}>
//                   <Text strong>Budget Owner:</Text>
//                   <div style={{ marginTop: '4px' }}>
//                     <Text>{selectedBudgetCode.budgetOwner?.fullName || 'N/A'}</Text>
//                     <br />
//                     <Text type="secondary" style={{ fontSize: '11px' }}>
//                       {selectedBudgetCode.budgetOwner?.email || ''}
//                     </Text>
//                     <br />
//                     <Text type="secondary" style={{ fontSize: '11px' }}>
//                       {selectedBudgetCode.budgetOwner?.department || ''}
//                     </Text>
//                   </div>
//                 </Col>
//                 <Col span={12}>
//                   <Text strong>Created By:</Text>
//                   <div style={{ marginTop: '4px' }}>
//                     <Text>{selectedBudgetCode.createdBy?.fullName || 'N/A'}</Text>
//                     <br />
//                     <Text type="secondary" style={{ fontSize: '11px' }}>
//                       {dayjs(selectedBudgetCode.createdAt).format('MMM DD, YYYY [at] HH:mm')}
//                     </Text>
//                     <br />
//                     <Text type="secondary" style={{ fontSize: '11px' }}>
//                       {dayjs(selectedBudgetCode.createdAt).fromNow()}
//                     </Text>
//                   </div>
//                 </Col>
//               </Row>
//             </Card>

//             {/* Description */}
//             {selectedBudgetCode.description && (
//               <div style={{ marginBottom: '16px' }}>
//                 <Text strong>Description:</Text>
//                 <div style={{ padding: '8px', backgroundColor: '#fafafa', borderRadius: '4px', marginTop: '4px' }}>
//                   {selectedBudgetCode.description}
//                 </div>
//               </div>
//             )}

//             {/* Budget Dates */}
//             <Card size="small" title="Budget Period" style={{ marginBottom: '16px' }}>
//               <Row gutter={16}>
//                 <Col span={12}>
//                   <Text strong>Start Date:</Text>
//                   <br />
//                   <Text>{dayjs(selectedBudgetCode.startDate).format('MMM DD, YYYY')}</Text>
//                 </Col>
//                 <Col span={12}>
//                   <Text strong>End Date:</Text>
//                   <br />
//                   <Text>
//                     {selectedBudgetCode.endDate 
//                       ? dayjs(selectedBudgetCode.endDate).format('MMM DD, YYYY')
//                       : 'No end date specified'
//                     }
//                   </Text>
//                 </Col>
//               </Row>
//             </Card>

//             <Divider />

//             {/* Approval Chain */}
//             <Card size="small" title="Approval Progress">
//               <Timeline>
//                 {selectedBudgetCode.approvalChain && selectedBudgetCode.approvalChain.map((step, index) => {
//                   const color = step.status === 'approved' ? 'green' :
//                                step.status === 'rejected' ? 'red' : 'gray';
//                   const icon = step.status === 'approved' ? <CheckCircleOutlined /> :
//                               step.status === 'rejected' ? <CloseCircleOutlined /> :
//                               <ClockCircleOutlined />;
                  
//                   const isCurrentUser = step.approver?.email?.toLowerCase() === user?.email?.toLowerCase();

//                   return (
//                     <Timeline.Item key={index} color={color} dot={icon}>
//                       <Space direction="vertical" size="small">
//                         <div>
//                           <Text strong>Level {step.level}: {step.approver.name}</Text>
//                           {isCurrentUser && step.status === 'pending' && (
//                             <Tag color="gold" style={{ marginLeft: '8px' }}>
//                               Your Turn
//                             </Tag>
//                           )}
//                         </div>
//                         <Text type="secondary">{step.approver.role}</Text>
//                         <Tag color={color}>{step.status.toUpperCase()}</Tag>
//                         {step.actionDate && (
//                           <Text type="secondary" style={{ fontSize: '11px' }}>
//                             {dayjs(step.actionDate).format('MMM DD, YYYY')} at {step.actionTime}
//                           </Text>
//                         )}
//                         {step.comments && (
//                           <div style={{ marginTop: 4, padding: '4px 8px', backgroundColor: '#f0f0f0', borderRadius: '4px' }}>
//                             <Text italic style={{ fontSize: '11px' }}>"{step.comments}"</Text>
//                           </div>
//                         )}
//                       </Space>
//                     </Timeline.Item>
//                   );
//                 })}
//               </Timeline>
//             </Card>
//           </div>
//         )}
//       </Modal>

//       {/* Approval Modal */}
//       <Modal
//         title={`Review Budget Code: ${selectedBudgetCode?.code}`}
//         open={modalVisible}
//         onCancel={() => {
//           setModalVisible(false);
//           setSelectedBudgetCode(null);
//           form.resetFields();
//         }}
//         footer={null}
//         width={700}
//       >
//         {selectedBudgetCode && (
//           <div>
//             {/* Quick Summary */}
//             <Card size="small" style={{ marginBottom: '16px', backgroundColor: '#f6ffed' }}>
//               <Row gutter={16}>
//                 <Col span={12}>
//                   <Text strong>Budget Code:</Text> {selectedBudgetCode.code}
//                   <br />
//                   <Text strong>Department:</Text> {selectedBudgetCode.department}
//                   <br />
//                   <Text strong>Budget Type:</Text> {selectedBudgetCode.budgetType}
//                 </Col>
//                 <Col span={12}>
//                   <Text strong>Total Budget:</Text>
//                   <br />
//                   <Text style={{ fontSize: '18px', color: '#1890ff' }}>
//                     XAF {selectedBudgetCode.budget.toLocaleString()}
//                   </Text>
//                   <br />
//                   <Text strong>Period:</Text> {selectedBudgetCode.budgetPeriod}
//                 </Col>
//               </Row>
//             </Card>

//             <div style={{ marginBottom: '16px' }}>
//               <Text strong>Budget Owner:</Text>
//               <br />
//               <Text>{selectedBudgetCode.budgetOwner?.fullName} ({selectedBudgetCode.budgetOwner?.department})</Text>
//             </div>

//             {selectedBudgetCode.description && (
//               <div style={{ marginBottom: '16px' }}>
//                 <Text strong>Description:</Text>
//                 <div style={{ padding: '8px', backgroundColor: '#fafafa', borderRadius: '4px', marginTop: '4px' }}>
//                   {selectedBudgetCode.description}
//                 </div>
//               </div>
//             )}

//             <Divider />

//             {/* Decision Form */}
//             <Form
//               form={form}
//               layout="vertical"
//               onFinish={handleApprovalDecision}
//             >
//               <Form.Item
//                 name="decision"
//                 label="Your Decision"
//                 rules={[{ required: true, message: 'Please select your decision' }]}
//               >
//                 <div>
//                   <Button 
//                     type="primary" 
//                     size="large"
//                     icon={<CheckCircleOutlined />}
//                     onClick={() => {
//                       form.setFieldsValue({ decision: 'approved' });
//                       form.submit();
//                     }}
//                     style={{ marginRight: '8px', width: '48%' }}
//                   >
//                     Approve
//                   </Button>
//                   <Button 
//                     danger
//                     size="large"
//                     icon={<CloseCircleOutlined />}
//                     onClick={() => {
//                       form.setFieldsValue({ decision: 'rejected' });
//                       form.submit();
//                     }}
//                     style={{ width: '48%' }}
//                   >
//                     Reject
//                   </Button>
//                 </div>
//               </Form.Item>

//               <Form.Item
//                 name="comments"
//                 label="Comments (Optional for approval, Required for rejection)"
//                 rules={[
//                   ({ getFieldValue }) => ({
//                     validator(_, value) {
//                       if (getFieldValue('decision') === 'rejected' && !value) {
//                         return Promise.reject(new Error('Please provide a reason for rejection'));
//                       }
//                       return Promise.resolve();
//                     }
//                   })
//                 ]}
//               >
//                 <TextArea
//                   rows={4}
//                   placeholder="Add any comments or recommendations..."
//                   showCount
//                   maxLength={500}
//                 />
//               </Form.Item>

//               <Alert
//                 message="Important"
//                 description={
//                   <div>
//                     <p><strong>Before approving:</strong></p>
//                     <ul style={{ marginBottom: 0, paddingLeft: '20px' }}>
//                       <li>Verify the budget amount is justified and appropriate</li>
//                       <li>Ensure alignment with organizational budget policies</li>
//                       <li>Confirm the budget period and fiscal year are correct</li>
//                       <li>Check that the budget owner is appropriate for this allocation</li>
//                     </ul>
//                   </div>
//                 }
//                 type="warning"
//                 showIcon
//                 style={{ marginBottom: '16px' }}
//               />

//               <Form.Item style={{ marginBottom: 0 }}>
//                 <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
//                   <Button 
//                     onClick={() => {
//                       setModalVisible(false);
//                       setSelectedBudgetCode(null);
//                       form.resetFields();
//                     }}
//                   >
//                     Cancel
//                   </Button>
//                 </Space>
//               </Form.Item>
//             </Form>
//           </div>
//         )}
//       </Modal>

//       {/* Custom CSS for row highlighting */}
//       <style jsx>{`
//         .your-turn-row {
//           background-color: #fffbf0 !important;
//         }
//         .your-turn-row:hover {
//           background-color: #fff7e6 !important;
//         }
//         .pending-finance-row {
//           background-color: #f0f8ff !important;
//         }
//         .pending-finance-row:hover {
//           background-color: #e6f4ff !important;
//         }
//       `}</style>
//     </div>
//   );
// };

// export default SupervisorBudgetCodeApprovals;


