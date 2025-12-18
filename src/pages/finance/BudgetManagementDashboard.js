import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Button,
  Space,
  Tag,
  Progress,
  Alert,
  List,
  Typography,
  message,
  Modal,
  Form,
  InputNumber,
  Input,
  Select,
  Divider,
  Tabs,
  Tooltip,
  Badge,
  DatePicker,
  Spin
} from 'antd';
import {
  DollarOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  PlusOutlined,
  EditOutlined,
  SwapOutlined,
  EyeOutlined,
  ReloadOutlined,
  BarChartOutlined,
  LineChartOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  FileExcelOutlined,
  FilePdfOutlined
} from '@ant-design/icons';
import {
  exportBudgetToExcel,
  exportBudgetToPDF
} from '../../services/exportService';
import api from '../../services/api';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const { TabPane } = Tabs;
const { RangePicker } = DatePicker;

const BudgetManagementDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [selectedCode, setSelectedCode] = useState(null);
  const [revisionModalVisible, setRevisionModalVisible] = useState(false);
  const [transferModalVisible, setTransferModalVisible] = useState(false);
  const [forecastModalVisible, setForecastModalVisible] = useState(false);
  const [forecastData, setForecastData] = useState(null);
  const [budgetCodes, setBudgetCodes] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [projects, setProjects] = useState([]);
  const [budgetOwners, setBudgetOwners] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [loadingBudgetOwners, setLoadingBudgetOwners] = useState(false);

  const [revisionForm] = Form.useForm();
  const [transferForm] = Form.useForm();
  const [createForm] = Form.useForm();

  useEffect(() => {
    fetchDashboard();
    fetchAllBudgetCodes();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const response = await api.get('/budget-codes/dashboard');
      setDashboardData(response.data.data);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
      message.error('Failed to load budget dashboard');
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
        setLoadingProjects(true);
        const response = await api.get('/projects/active');
        if (response.data.success) {
        setProjects(response.data.data);
        }
    } catch (error) {
        console.error('Error fetching projects:', error);
        setProjects([]);
    } finally {
        setLoadingProjects(false);
    }
    };

  const fetchAllBudgetCodes = async () => {
    try {
      const response = await api.get('/budget-codes?active=true&status=active');
      if (response.data.success) {
        setBudgetCodes(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching budget codes:', error);
    }
  };

  const fetchBudgetOwners = async () => {
    try {
        setLoadingBudgetOwners(true);
        const response = await api.get('/auth/active-users');
        if (response.data.success && response.data.data) {
        setBudgetOwners(response.data.data);
        } else {
        setBudgetOwners([]);
        }
    } catch (error) {
        console.error('Error fetching budget owners:', error);
        setBudgetOwners([]);
    } finally {
        setLoadingBudgetOwners(false);
    }
  };

  const handleCreateBudgetCode = async (values) => {
    try {
        setLoading(true);
        
        // Format the dates if provided
        const requestData = {
        ...values,
        startDate: values.dateRange ? values.dateRange[0].format('YYYY-MM-DD') : undefined,
        endDate: values.dateRange ? values.dateRange[1].format('YYYY-MM-DD') : undefined
        };
        
        // Remove dateRange from the request as we've extracted start and end dates
        delete requestData.dateRange;

        const response = await api.post('/budget-codes', requestData);

        if (response.data.success) {
        message.success('Budget code created successfully and sent for approval');
        setCreateModalVisible(false);
        createForm.resetFields();
        fetchDashboard();
        fetchAllBudgetCodes();
        } else {
        message.error(response.data.message || 'Failed to create budget code');
        }
    } catch (error) {
        message.error(error.response?.data?.message || 'Failed to create budget code');
    } finally {
        setLoading(false);
    }
    };

  const handleExportExcel = () => {
    const result = exportBudgetToExcel(dashboardData.budgetCodes, 'budget_codes');
    if (result.success) {
        message.success(result.message);
    } else {
        message.error(result.message);
    }
  };

  const handleExportPDF = () => {
    const result = exportBudgetToPDF(dashboardData.budgetCodes, 'budget_codes');
    if (result.success) {
        message.success(result.message);
    } else {
        message.error(result.message);
    }
  };

  const handleRequestRevision = async (values) => {
    try {
      setLoading(true);
      const response = await api.post(`/budget-codes/${selectedCode._id}/revisions`, {
        newBudget: values.newBudget,
        reason: values.reason
      });

      if (response.data.success) {
        message.success('Budget revision requested successfully');
        setRevisionModalVisible(false);
        revisionForm.resetFields();
        setSelectedCode(null);
        fetchDashboard();
      }
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to request revision');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestTransfer = async (values) => {
    try {
      setLoading(true);
      const response = await api.post('/budget-transfers', {
        fromBudgetCode: values.fromBudgetCode,
        toBudgetCode: values.toBudgetCode,
        amount: values.amount,
        reason: values.reason
      });

      if (response.data.success) {
        message.success('Budget transfer requested successfully');
        setTransferModalVisible(false);
        transferForm.resetFields();
        fetchDashboard();
      }
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to request transfer');
    } finally {
      setLoading(false);
    }
  };

  const handleViewForecast = async (budgetCode) => {
    try {
      setLoading(true);
      const response = await api.get(`/budget-codes/${budgetCode._id}/forecast`);
      if (response.data.success) {
        setForecastData(response.data.data);
        setForecastModalVisible(true);
      }
    } catch (error) {
      message.error('Failed to load forecast');
    } finally {
      setLoading(false);
    }
  };

  const getAlertColor = (type) => {
    const colors = {
      critical: 'error',
      warning: 'warning',
      info: 'info'
    };
    return colors[type] || 'info';
  };

  const getUtilizationStatus = (percentage) => {
    if (percentage >= 90) return 'exception';
    if (percentage >= 75) return 'active';
    return 'success';
  };

  const columns = [
    {
      title: 'Code',
      dataIndex: 'code',
      key: 'code',
      fixed: 'left',
      width: 120,
      render: (code, record) => (
        <div>
          <Text strong code>{code}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: '11px' }}>{record.name}</Text>
        </div>
      )
    },
    {
      title: 'Department',
      dataIndex: 'department',
      key: 'department',
      width: 120,
      render: (dept) => <Tag color="blue">{dept}</Tag>
    },
    {
      title: 'Budget',
      dataIndex: 'budget',
      key: 'budget',
      width: 130,
      render: (budget) => (
        <Text strong>XAF {budget.toLocaleString()}</Text>
      ),
      sorter: (a, b) => a.budget - b.budget
    },
    {
      title: 'Used',
      dataIndex: 'used',
      key: 'used',
      width: 130,
      render: (used) => (
        <Text style={{ color: '#faad14' }}>XAF {used.toLocaleString()}</Text>
      ),
      sorter: (a, b) => a.used - b.used
    },
    {
      title: 'Remaining',
      key: 'remaining',
      width: 130,
      render: (_, record) => {
        const remaining = record.budget - record.used;
        return (
          <Text strong style={{ color: remaining < record.budget * 0.1 ? '#f5222d' : '#52c41a' }}>
            XAF {remaining.toLocaleString()}
          </Text>
        );
      },
      sorter: (a, b) => (a.budget - a.used) - (b.budget - b.used)
    },
    {
      title: 'Utilization',
      key: 'utilization',
      width: 150,
      render: (_, record) => {
        const percentage = Math.round((record.used / record.budget) * 100);
        return (
          <div>
            <Progress
              percent={percentage}
              size="small"
              status={getUtilizationStatus(percentage)}
            />
            <Text type="secondary" style={{ fontSize: '11px' }}>
              {percentage}%
            </Text>
          </div>
        );
      },
      sorter: (a, b) => (a.used / a.budget) - (b.used / b.budget)
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => {
        const statusColors = {
          active: 'success',
          pending: 'processing',
          suspended: 'error',
          expired: 'default'
        };
        return <Tag color={statusColors[status]}>{status.toUpperCase()}</Tag>;
      }
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 280,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="View Details">
            <Button
              size="small"
              icon={<EyeOutlined />}
              onClick={() => navigate(`/finance/budget-codes/${record._id}`)}
            >
              View
            </Button>
          </Tooltip>
          <Tooltip title="Request Budget Revision">
            <Button
              size="small"
              icon={<EditOutlined />}
              onClick={() => {
                setSelectedCode(record);
                revisionForm.setFieldsValue({
                  currentBudget: record.budget,
                  newBudget: record.budget
                });
                setRevisionModalVisible(true);
              }}
            >
              Revise
            </Button>
          </Tooltip>
          <Tooltip title="View Forecast">
            <Button
              size="small"
              icon={<LineChartOutlined />}
              onClick={() => handleViewForecast(record)}
            >
              Forecast
            </Button>
          </Tooltip>
        </Space>
      )
    }
  ];

  if (!dashboardData) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Card loading={loading}>
          <Text>Loading budget dashboard...</Text>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <Title level={2} style={{ margin: 0 }}>
          <DollarOutlined /> Budget Management Dashboard
        </Title>
        <Space>
          <Button
            icon={<ReloadOutlined />}
            onClick={fetchDashboard}
            loading={loading}
          >
            Refresh
          </Button>
          {/* <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
                setCreateModalVisible(true);
                if (projects.length === 0) fetchProjects();
                if (budgetOwners.length === 0) fetchBudgetOwners();
            }}
            >
            Create Budget Code
          </Button> */}
          <Button
            type="primary"
            icon={<SwapOutlined />}
            onClick={() => setTransferModalVisible(true)}
          >
            Transfer Budget
          </Button>
          <Button
            icon={<BarChartOutlined />}
            onClick={() => navigate('/finance/budget-reports')}
          >
            View Reports
          </Button>
          <Button
            icon={<ClockCircleOutlined />}
            onClick={() => navigate('/finance/scheduled-reports')}
            >
            Scheduled Reports
          </Button>
          <Button
            icon={<FileExcelOutlined />}
            onClick={handleExportExcel}
            >
                Export Excel
            </Button>
            {/* <Button
                icon={<FilePdfOutlined />}
                onClick={handleExportPDF}
            >
                Export PDF
          </Button> */}
        </Space>
      </div>

      {/* Summary Statistics */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Budget"
              value={dashboardData.summary.totalBudget}
              prefix="XAF"
              formatter={value => value.toLocaleString()}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Used"
              value={dashboardData.summary.totalUsed}
              prefix="XAF"
              formatter={value => value.toLocaleString()}
              valueStyle={{ color: '#faad14' }}
            />
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {dashboardData.summary.overallUtilization}% utilized
            </Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Remaining"
              value={dashboardData.summary.totalRemaining}
              prefix="XAF"
              formatter={value => value.toLocaleString()}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Active Codes"
              value={dashboardData.summary.totalCodes}
              suffix={`/ ${dashboardData.summary.totalCodes}`}
            />
            <div style={{ marginTop: '8px' }}>
              <Text type="danger">Critical: {dashboardData.summary.criticalCodes}</Text>
              <br />
              <Text type="warning">Warning: {dashboardData.summary.warningCodes}</Text>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Alerts Section */}
      {dashboardData.alerts && dashboardData.alerts.length > 0 && (
        <Alert
          message={`${dashboardData.alerts.length} Budget Alert${dashboardData.alerts.length !== 1 ? 's' : ''}`}
          description={
            <List
              size="small"
              dataSource={dashboardData.alerts}
              renderItem={alert => (
                <List.Item>
                  <Space>
                    {alert.type === 'critical' && (
                      <WarningOutlined style={{ color: '#f5222d', fontSize: '16px' }} />
                    )}
                    {alert.type === 'warning' && (
                      <ExclamationCircleOutlined style={{ color: '#faad14', fontSize: '16px' }} />
                    )}
                    {alert.type === 'info' && (
                      <ClockCircleOutlined style={{ color: '#1890ff', fontSize: '16px' }} />
                    )}
                    <div>
                      <Text strong>{alert.budgetCode}</Text>
                      <br />
                      <Text>{alert.message}</Text>
                      {alert.action && (
                        <>
                          <br />
                          <Text type="secondary" style={{ fontSize: '11px' }}>
                            Action: {alert.action}
                          </Text>
                        </>
                      )}
                    </div>
                  </Space>
                </List.Item>
              )}
            />
          }
          type={dashboardData.alerts.some(a => a.type === 'critical') ? 'error' : 'warning'}
          showIcon
          style={{ marginBottom: '24px' }}
        />
      )}

      {/* Tabs */}
      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane 
          tab={
            <span>
              <BarChartOutlined />
              Overview
            </span>
          } 
          key="overview"
        >
          <Card title="All Budget Codes"
            extra={
            <Button
                type="primary"
                size="small"
                icon={<PlusOutlined />}
                onClick={() => {
                    setCreateModalVisible(true);
                    if (projects.length === 0) fetchProjects();
                    if (budgetOwners.length === 0) fetchBudgetOwners();
                }}
                >
                Create Budget Code
            </Button>
            }
          >
            <Table
              columns={columns}
              dataSource={dashboardData.budgetCodes}
              loading={loading}
              rowKey="_id"
              scroll={{ x: 1200 }}
              pagination={{
                showSizeChanger: true,
                showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} codes`,
              }}
            />
          </Card>
        </TabPane>

        <TabPane 
          tab={
            <Badge count={dashboardData.summary.criticalCodes}>
              <span>
                <WarningOutlined />
                Critical ({dashboardData.summary.criticalCodes})
              </span>
            </Badge>
          } 
          key="critical"
        >
          <Card title="Critical Budget Codes (≥90% Utilized)">
            <Table
              columns={columns}
              dataSource={dashboardData.budgetCodes.filter(
                code => (code.used / code.budget) * 100 >= 90
              )}
              loading={loading}
              rowKey="_id"
              scroll={{ x: 1200 }}
            />
          </Card>
        </TabPane>

        <TabPane 
          tab={
            <Badge count={dashboardData.summary.warningCodes}>
              <span>
                <ExclamationCircleOutlined />
                Warning ({dashboardData.summary.warningCodes})
              </span>
            </Badge>
          } 
          key="warning"
        >
          <Card title="Warning Budget Codes (75-89% Utilized)">
            <Table
              columns={columns}
              dataSource={dashboardData.budgetCodes.filter(
                code => {
                  const utilization = (code.used / code.budget) * 100;
                  return utilization >= 75 && utilization < 90;
                }
              )}
              loading={loading}
              rowKey="_id"
              scroll={{ x: 1200 }}
            />
          </Card>
        </TabPane>

        <TabPane 
          tab={
            <span>
              <CheckCircleOutlined />
              Healthy
            </span>
          } 
          key="healthy"
        >
          <Card title="Healthy Budget Codes (<75% Utilized)">
            <Table
              columns={columns}
              dataSource={dashboardData.budgetCodes.filter(
                code => (code.used / code.budget) * 100 < 75
              )}
              loading={loading}
              rowKey="_id"
              scroll={{ x: 1200 }}
            />
          </Card>
        </TabPane>
      </Tabs>

      {/* Budget Revision Modal */}
      <Modal
        title={
          <Space>
            <EditOutlined />
            Request Budget Revision
          </Space>
        }
        open={revisionModalVisible}
        onCancel={() => {
          setRevisionModalVisible(false);
          setSelectedCode(null);
          revisionForm.resetFields();
        }}
        footer={null}
        width={600}
      >
        {selectedCode && (
          <>
            <Alert
              message="Current Budget Information"
              description={
                <div>
                  <Text><strong>Code:</strong> {selectedCode.code}</Text>
                  <br />
                  <Text><strong>Current Budget:</strong> XAF {selectedCode.budget.toLocaleString()}</Text>
                  <br />
                  <Text><strong>Used:</strong> XAF {selectedCode.used.toLocaleString()}</Text>
                  <br />
                  <Text><strong>Remaining:</strong> XAF {(selectedCode.budget - selectedCode.used).toLocaleString()}</Text>
                </div>
              }
              type="info"
              showIcon
              style={{ marginBottom: '20px' }}
            />

            <Form
              form={revisionForm}
              layout="vertical"
              onFinish={handleRequestRevision}
            >
              <Form.Item
                name="currentBudget"
                label="Current Budget (XAF)"
              >
                <InputNumber
                  style={{ width: '100%' }}
                  disabled
                  formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                />
              </Form.Item>

              <Form.Item
                name="newBudget"
                label="New Budget Amount (XAF)"
                rules={[
                  { required: true, message: 'Please enter new budget amount' },
                  {
                    validator: (_, value) => {
                      if (!value) return Promise.resolve();
                      if (value === selectedCode.budget) {
                        return Promise.reject('New budget must be different from current budget');
                      }
                      if (value < selectedCode.used) {
                        return Promise.reject('New budget cannot be less than already used amount');
                      }
                      return Promise.resolve();
                    }
                  }
                ]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={selectedCode.used}
                  formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value.replace(/\$\s?|(,*)/g, '')}
                  placeholder="Enter new budget amount"
                />
              </Form.Item>

              <Form.Item
                noStyle
                shouldUpdate={(prevValues, currentValues) => 
                  prevValues.newBudget !== currentValues.newBudget
                }
              >
                {({ getFieldValue }) => {
                  const newBudget = getFieldValue('newBudget');
                  const currentBudget = selectedCode.budget;
                  const change = newBudget - currentBudget;

                  if (newBudget && change !== 0) {
                    return (
                      <Alert
                        message={`Budget ${change > 0 ? 'Increase' : 'Decrease'}`}
                        description={
                          <Text strong>
                            {change > 0 ? '+' : ''}XAF {Math.abs(change).toLocaleString()}
                          </Text>
                        }
                        type={change > 0 ? 'success' : 'warning'}
                        showIcon
                        style={{ marginBottom: '20px' }}
                      />
                    );
                  }
                  return null;
                }}
              </Form.Item>

              <Form.Item
                name="reason"
                label="Reason for Revision"
                rules={[
                  { required: true, message: 'Please provide a reason' },
                  { min: 20, message: 'Reason must be at least 20 characters' }
                ]}
              >
                <TextArea
                  rows={4}
                  placeholder="Explain why this budget revision is needed..."
                  showCount
                  maxLength={500}
                />
              </Form.Item>

              <Form.Item>
                <Space>
                  <Button onClick={() => {
                    setRevisionModalVisible(false);
                    setSelectedCode(null);
                    revisionForm.resetFields();
                  }}>
                    Cancel
                  </Button>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={loading}
                    icon={<FileTextOutlined />}
                  >
                    Submit Revision Request
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </>
        )}
      </Modal>

      {/* Budget Transfer Modal */}
      <Modal
        title={
          <Space>
            <SwapOutlined />
            Request Budget Transfer
          </Space>
        }
        open={transferModalVisible}
        onCancel={() => {
          setTransferModalVisible(false);
          transferForm.resetFields();
        }}
        footer={null}
        width={700}
      >
        <Alert
          message="Budget Transfer"
          description="Transfer budget between active budget codes. Both source and destination codes must be active."
          type="info"
          showIcon
          style={{ marginBottom: '20px' }}
        />

        <Form
          form={transferForm}
          layout="vertical"
          onFinish={handleRequestTransfer}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="fromBudgetCode"
                label="From Budget Code"
                rules={[{ required: true, message: 'Please select source budget code' }]}
              >
                <Select
                  showSearch
                  placeholder="Select source budget code"
                  optionFilterProp="children"
                  filterOption={(input, option) =>
                    option.children.toLowerCase().includes(input.toLowerCase())
                  }
                >
                  {budgetCodes.map(code => (
                    <Option key={code._id} value={code._id}>
                      {code.code} - XAF {(code.budget - code.used).toLocaleString()} available
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="toBudgetCode"
                label="To Budget Code"
                rules={[
                  { required: true, message: 'Please select destination budget code' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('fromBudgetCode') !== value) {
                        return Promise.resolve();
                      }
                      return Promise.reject('Source and destination must be different');
                    }
                  })
                ]}
              >
                <Select
                  showSearch
                  placeholder="Select destination budget code"
                  optionFilterProp="children"
                  filterOption={(input, option) =>
                    option.children.toLowerCase().includes(input.toLowerCase())
                  }
                >
                  {budgetCodes.map(code => (
                    <Option key={code._id} value={code._id}>
                      {code.code} - {code.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="amount"
            label="Transfer Amount (XAF)"
            rules={[
              { required: true, message: 'Please enter transfer amount' },
              {
                validator: (_, value) => {
                  const fromCode = transferForm.getFieldValue('fromBudgetCode');
                  if (!value || !fromCode) return Promise.resolve();

                  const sourceCode = budgetCodes.find(c => c._id === fromCode);
                  if (sourceCode) {
                    const available = sourceCode.budget - sourceCode.used;
                    if (value > available) {
                      return Promise.reject(
                        `Amount exceeds available budget (XAF ${available.toLocaleString()})`
                      );
                    }
                  }
                  return Promise.resolve();
                }
              }
            ]}
          >
            <InputNumber
              style={{ width: '100%' }}
              min={1}
              formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value.replace(/\$\s?|(,*)/g, '')}
              placeholder="Enter amount to transfer"
            />
          </Form.Item>

          <Form.Item
            name="reason"
            label="Reason for Transfer"
            rules={[
              { required: true, message: 'Please provide a reason' },
              { min: 20, message: 'Reason must be at least 20 characters' }
            ]}
          >
            <TextArea
              rows={4}
              placeholder="Explain why this budget transfer is needed..."
              showCount
              maxLength={500}
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button onClick={() => {
                setTransferModalVisible(false);
                transferForm.resetFields();
              }}>
                Cancel
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                icon={<SwapOutlined />}
              >
                Submit Transfer Request
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Budget Forecast Modal */}
      <Modal
        title={
          <Space>
            <LineChartOutlined />
            Budget Forecast
          </Space>
        }
        open={forecastModalVisible}
        onCancel={() => {
          setForecastModalVisible(false);
          setForecastData(null);
        }}
        footer={[
          <Button key="close" onClick={() => {
            setForecastModalVisible(false);
            setForecastData(null);
          }}>
            Close
          </Button>
        ]}
        width={600}
      >
        {forecastData && (
          <div>
            <Alert
              message="Budget Code Information"
              description={
                <div>
                  <Text><strong>Code:</strong> {forecastData.budgetCode.code}</Text>
                  <br />
                  <Text><strong>Name:</strong> {forecastData.budgetCode.name}</Text>
                  <br />
                  <Text><strong>Total Budget:</strong> XAF {forecastData.budgetCode.budget.toLocaleString()}</Text>
                </div>
              }
              type="info"
              showIcon
              style={{ marginBottom: '20px' }}
            />

            <Divider />

            <Card size="small" title="Current Status">
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Statistic
                    title="Used"
                    value={forecastData.budgetCode.used}
                    prefix="XAF"
                    formatter={value => value.toLocaleString()}
                    valueStyle={{ color: '#faad14' }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="Remaining"
                    value={forecastData.forecast.currentRemaining}
                    prefix="XAF"
                    formatter={value => value.toLocaleString()}
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Col>
              </Row>
            </Card>

            <Divider />

            <Card size="small" title="Forecast Analysis">
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  <Text strong>Average Monthly Burn Rate:</Text>
                  <br />
                  <Text style={{ fontSize: '16px', color: '#1890ff' }}>
                    XAF {forecastData.forecast.averageMonthlyBurn.toLocaleString()}
                  </Text>
                </div>

                <div>
                  <Text strong>Projected Duration:</Text>
                  <br />
                  <Text style={{ fontSize: '16px' }}>
                    {forecastData.forecast.projectedMonths === 999 
                      ? 'Sufficient for foreseeable future'
                      : `${forecastData.forecast.projectedMonths} month${forecastData.forecast.projectedMonths !== 1 ? 's' : ''}`
                    }
                  </Text>
                </div>

                {forecastData.forecast.projectedExhaustionDate && (
                  <div>
                    <Text strong>Projected Exhaustion Date:</Text>
                    <br />
                    <Text style={{ fontSize: '16px', color: '#ff4d4f' }}>
                      {new Date(forecastData.forecast.projectedExhaustionDate).toLocaleDateString('en-GB')}
                    </Text>
                  </div>
                )}

                <Divider />

                <Alert
                  message={forecastData.forecast.recommendation}
                  type={
                    forecastData.forecast.status === 'critical' ? 'error' :
                    forecastData.forecast.status === 'warning' ? 'warning' :
                    forecastData.forecast.status === 'healthy' ? 'success' : 'info'
                  }
                  showIcon
                />
              </Space>
            </Card>
          </div>
        )}
      </Modal>

      {/* Create Budget Code Modal */}
        <Modal
        title={
            <Space>
            <PlusOutlined />
            Create New Budget Code
            </Space>
        }
        open={createModalVisible}
        onCancel={() => {
            setCreateModalVisible(false);
            createForm.resetFields();
        }}
        footer={null}
        width={700}
        destroyOnClose
        >
        <Alert
            message="Budget Code Approval Process"
            description="New budget codes require approval from department head, head of business, and finance before activation."
            type="info"
            showIcon
            style={{ marginBottom: '20px' }}
        />

        <Form
            form={createForm}
            layout="vertical"
            onFinish={handleCreateBudgetCode}
        >
            <Row gutter={16}>
            <Col span={12}>
                <Form.Item
                name="code"
                label="Budget Code"
                rules={[
                    { required: true, message: 'Please enter budget code' },
                    { 
                    pattern: /^[A-Z0-9\-_]+$/, 
                    message: 'Only uppercase letters, numbers, hyphens and underscores allowed' 
                    },
                    { min: 3, message: 'Code must be at least 3 characters' },
                    { max: 20, message: 'Code must not exceed 20 characters' }
                ]}
                help="Format: DEPT-IT-2025 or PROJ-ALPHA-2025"
                >
                <Input
                    placeholder="e.g., DEPT-IT-2025"
                    style={{ textTransform: 'uppercase' }}
                    onChange={(e) => {
                    createForm.setFieldsValue({ 
                        code: e.target.value.toUpperCase() 
                    });
                    }}
                />
                </Form.Item>
            </Col>
            <Col span={12}>
                <Form.Item
                name="name"
                label="Budget Name"
                rules={[
                    { required: true, message: 'Please enter budget name' },
                    { min: 5, message: 'Name must be at least 5 characters' }
                ]}
                >
                <Input placeholder="e.g., IT Department 2025 Budget" />
                </Form.Item>
            </Col>
            </Row>

            <Form.Item
            name="description"
            label="Budget Description"
            help="Provide details about what this budget covers"
            >
            <TextArea
                rows={3}
                placeholder="Describe the purpose and scope of this budget allocation..."
                showCount
                maxLength={300}
            />
            </Form.Item>

            <Row gutter={16}>
            <Col span={12}>
                <Form.Item
                name="budget"
                label="Total Budget Allocation (XAF)"
                rules={[
                    { required: true, message: 'Please enter budget amount' },
                    {
                    validator: (_, value) => {
                        if (!value || value <= 0) {
                        return Promise.reject('Budget must be greater than zero');
                        }
                        return Promise.resolve();
                    }
                    }
                ]}
                >
                <InputNumber
                    style={{ width: '100%' }}
                    formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={value => value.replace(/\$\s?|(,*)/g, '')}
                    min={1}
                    placeholder="Enter total budget"
                />
                </Form.Item>
            </Col>
            <Col span={12}>
                <Form.Item
                name="fiscalYear"
                label="Fiscal Year"
                rules={[{ required: true, message: 'Please select fiscal year' }]}
                initialValue={new Date().getFullYear()}
                >
                <Select placeholder="Select fiscal year">
                    <Option value={2024}>2024</Option>
                    <Option value={2025}>2025</Option>
                    <Option value={2026}>2026</Option>
                    <Option value={2027}>2027</Option>
                </Select>
                </Form.Item>
            </Col>
            </Row>

            <Row gutter={16}>
            <Col span={12}>
                <Form.Item
                name="department"
                label="Department/Project"
                rules={[{ required: true, message: 'Please select department or project' }]}
                help="Select existing department or active project"
                >
                <Select 
                    placeholder="Select department or project"
                    showSearch
                    loading={loadingProjects}
                    filterOption={(input, option) =>
                    option.children.toLowerCase().includes(input.toLowerCase())
                    }
                >
                    <Select.OptGroup label="Departments">
                      <Option value="Technical Operations">Technical Operations</Option>
                      <Option value="Technical Roll Out">Technical Roll Out</Option>
                      <Option value="Technical QHSE">Technical QHSE</Option>
                      <Option value="IT">IT Department</Option>
                      <Option value="Finance">Finance</Option>
                      <Option value="HR">Human Resources</Option>
                      <Option value="Marketing">Marketing</Option>
                      <Option value="Refurbishment">Refurbishment</Option>
                      <Option value="Supply Chain">Supply Chain</Option>
                      <Option value="Business">Business</Option>
                      <Option value="Facilities">Facilities</Option>
                      
                    </Select.OptGroup>
                    {projects.length > 0 && (
                    <Select.OptGroup label="Active Projects">
                        {projects.map(project => (
                        <Option key={`project-${project._id}`} value={`PROJECT-${project._id}`}>
                            {project.name} ({project.department})
                        </Option>
                        ))}
                    </Select.OptGroup>
                    )}
                </Select>
                </Form.Item>
            </Col>
            <Col span={12}>
                <Form.Item
                name="budgetType"
                label="Budget Type"
                rules={[{ required: true, message: 'Please select budget type' }]}
                >
                <Select placeholder="Select budget type">
                    <Option value="OPEX">OPEX - Operating Expenses</Option>
                    <Option value="CAPEX">CAPEX - Capital Expenditure</Option>
                    <Option value="PROJECT">PROJECT - Project Budget</Option>
                    <Option value="OPERATIONAL">OPERATIONAL - Operational</Option>
                </Select>
                </Form.Item>
            </Col>
            </Row>

            <Row gutter={16}>
            <Col span={12}>
                <Form.Item
                name="budgetPeriod"
                label="Budget Period"
                rules={[{ required: true, message: 'Please select budget period' }]}
                >
                <Select placeholder="Select budget period">
                    <Option value="monthly">Monthly</Option>
                    <Option value="quarterly">Quarterly</Option>
                    <Option value="yearly">Yearly</Option>
                    <Option value="project">Project Duration</Option>
                </Select>
                </Form.Item>
            </Col>
            <Col span={12}>
                <Form.Item
                name="dateRange"
                label="Start & End Date (Optional)"
                help="Leave empty for ongoing budgets"
                >
                <RangePicker 
                    style={{ width: '100%' }}
                    format="DD/MM/YYYY"
                />
                </Form.Item>
            </Col>
            </Row>

            <Form.Item
            name="budgetOwner"
            label="Budget Owner"
            rules={[{ required: true, message: 'Please select budget owner' }]}
            help="Person responsible for this budget"
            >
            <Select
                placeholder="Select budget owner"
                showSearch
                loading={loadingBudgetOwners}
                filterOption={(input, option) => {
                const user = budgetOwners.find(u => u._id === option.value);
                if (!user) return false;
                return (
                    (user.fullName || '').toLowerCase().includes(input.toLowerCase()) ||
                    (user.email || '').toLowerCase().includes(input.toLowerCase())
                );
                }}
                notFoundContent={loadingBudgetOwners ? <Spin size="small" /> : "No users found"}
            >
                {budgetOwners.map(user => (
                <Option key={user._id} value={user._id}>
                    <div>
                    <Text strong>{user.fullName}</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                        {user.role} | {user.department}
                    </Text>
                    </div>
                </Option>
                ))}
            </Select>
            </Form.Item>

            <Divider />

            <Alert
            message="Important Information"
            description={
                <ul style={{ marginBottom: 0, paddingLeft: '20px' }}>
                <li>Budget code will be created with status "Pending Approval"</li>
                <li>Requires approval from department head, head of business, and finance</li>
                <li>Once approved, the budget code will be activated and available for use</li>
                <li>You will receive email notifications at each approval stage</li>
                </ul>
            }
            type="warning"
            showIcon
            style={{ marginBottom: '20px' }}
            />

            <Form.Item>
            <Space>
                <Button 
                onClick={() => {
                    setCreateModalVisible(false);
                    createForm.resetFields();
                }}
                >
                Cancel
                </Button>
                <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                icon={<PlusOutlined />}
                >
                Create Budget Code
                </Button>
            </Space>
            </Form.Item>
        </Form>
        </Modal>
    </div>
  );
};

export default BudgetManagementDashboard;