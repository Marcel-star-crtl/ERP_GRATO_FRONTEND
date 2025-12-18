import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Row,
  Col,
  Descriptions,
  Button,
  Space,
  Typography,
  Tag,
  Progress,
  Statistic,
  Table,
  Timeline,
  Alert,
  message,
  Modal,
  Form,
  Input,
  InputNumber,
  Divider,
  Tabs,
  List,
  Badge,
  Tooltip,
  Spin
} from 'antd';
import {
  ArrowLeftOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  DollarOutlined,
  FileTextOutlined,
  SwapOutlined,
  LineChartOutlined,
  HistoryOutlined,
  LockOutlined,
  UnlockOutlined,
  ReloadOutlined,
  DownloadOutlined,
  EyeOutlined,
  TeamOutlined
} from '@ant-design/icons';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import api from '../../services/api';
import { exportBudgetToExcel, exportBudgetToPDF } from '../../services/exportService';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { TabPane } = Tabs;

const BudgetCodeDetails = () => {
  const { codeId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [budgetCode, setBudgetCode] = useState(null);
  const [forecastData, setForecastData] = useState(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [revisionModalVisible, setRevisionModalVisible] = useState(false);
  const [releaseModalVisible, setReleaseModalVisible] = useState(false);
  const [selectedAllocation, setSelectedAllocation] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  const [editForm] = Form.useForm();
  const [revisionForm] = Form.useForm();
  const [releaseForm] = Form.useForm();

  useEffect(() => {
    fetchBudgetCodeDetails();
    fetchForecast();
  }, [codeId]);

  const fetchBudgetCodeDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/budget-codes/${codeId}`);
      if (response.data.success) {
        setBudgetCode(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching budget code:', error);
      message.error('Failed to load budget code details');
      navigate('/finance/budget-management');
    } finally {
      setLoading(false);
    }
  };

  const fetchForecast = async () => {
    try {
      const response = await api.get(`/budget-codes/${codeId}/forecast`);
      if (response.data.success) {
        setForecastData(response.data.data.forecast);
      }
    } catch (error) {
      console.error('Error fetching forecast:', error);
    }
  };

  const handleUpdate = async (values) => {
    try {
      setLoading(true);
      const response = await api.put(`/budget-codes/${codeId}`, values);
      if (response.data.success) {
        message.success('Budget code updated successfully');
        setEditModalVisible(false);
        editForm.resetFields();
        fetchBudgetCodeDetails();
      }
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to update budget code');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestRevision = async (values) => {
    try {
      setLoading(true);
      const response = await api.post(`/budget-codes/${codeId}/revisions`, values);
      if (response.data.success) {
        message.success('Budget revision requested successfully');
        setRevisionModalVisible(false);
        revisionForm.resetFields();
        fetchBudgetCodeDetails();
      }
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to request revision');
    } finally {
      setLoading(false);
    }
  };

  const handleReleaseReservation = async (values) => {
    if (!selectedAllocation) return;

    try {
      setLoading(true);
      const response = await api.post(
        `/budget-codes/${codeId}/release/${selectedAllocation.requisitionId}`,
        { reason: values.reason }
      );
      if (response.data.success) {
        message.success('Budget reservation released successfully');
        setReleaseModalVisible(false);
        releaseForm.resetFields();
        setSelectedAllocation(null);
        fetchBudgetCodeDetails();
      }
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to release reservation');
    } finally {
      setLoading(false);
    }
  };

  const handleReleaseStale = async () => {
    Modal.confirm({
      title: 'Release Stale Reservations',
      content: 'This will release all reservations older than 30 days. Continue?',
      okText: 'Yes, Release',
      okType: 'danger',
      onOk: async () => {
        try {
          setLoading(true);
          const response = await api.post(`/budget-codes/${codeId}/release-stale`);
          if (response.data.success) {
            message.success(response.data.message);
            fetchBudgetCodeDetails();
          }
        } catch (error) {
          message.error('Failed to release stale reservations');
        } finally {
          setLoading(false);
        }
      }
    });
  };

  const handleToggleStatus = async () => {
    try {
      setLoading(true);
      const newStatus = !budgetCode.active;
      const response = await api.put(`/budget-codes/${codeId}`, {
        active: newStatus
      });
      if (response.data.success) {
        message.success(`Budget code ${newStatus ? 'activated' : 'deactivated'} successfully`);
        fetchBudgetCodeDetails();
      }
    } catch (error) {
      message.error('Failed to update status');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Modal.confirm({
      title: 'Delete Budget Code',
      content: 'Are you sure you want to delete this budget code? This action cannot be undone.',
      okText: 'Yes, Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          setLoading(true);
          const response = await api.delete(`/budget-codes/${codeId}`);
          if (response.data.success) {
            message.success('Budget code deleted successfully');
            navigate('/finance/budget-management');
          }
        } catch (error) {
          message.error(error.response?.data?.message || 'Failed to delete budget code');
        } finally {
          setLoading(false);
        }
      }
    });
  };

  const handleExportExcel = () => {
    if (!budgetCode) return;
    const result = exportBudgetToExcel([budgetCode], `budget_code_${budgetCode.code}`);
    if (result.success) {
      message.success(result.message);
    } else {
      message.error(result.message);
    }
  };

  const handleExportPDF = () => {
    if (!budgetCode) return;
    const result = exportBudgetToPDF([budgetCode], `budget_code_${budgetCode.code}`);
    if (result.success) {
      message.success(result.message);
    } else {
      message.error(result.message);
    }
  };

  const getStatusTag = (status) => {
    const statusConfig = {
      pending: { color: 'default', icon: <ClockCircleOutlined /> },
      pending_departmental_head: { color: 'processing', icon: <ClockCircleOutlined /> },
      pending_head_of_business: { color: 'processing', icon: <ClockCircleOutlined /> },
      pending_finance: { color: 'processing', icon: <ClockCircleOutlined /> },
      active: { color: 'success', icon: <CheckCircleOutlined /> },
      rejected: { color: 'error', icon: <CloseCircleOutlined /> },
      suspended: { color: 'warning', icon: <WarningOutlined /> },
      expired: { color: 'default', icon: <ClockCircleOutlined /> }
    };

    const config = statusConfig[status] || statusConfig.pending;
    return (
      <Tag color={config.color} icon={config.icon} style={{ fontSize: '14px' }}>
        {status.replace(/_/g, ' ').toUpperCase()}
      </Tag>
    );
  };

  const getUtilizationStatus = () => {
    if (!budgetCode) return 'success';
    const percentage = (budgetCode.used / budgetCode.budget) * 100;
    if (percentage >= 90) return 'exception';
    if (percentage >= 75) return 'active';
    return 'success';
  };

  const getUtilizationColor = () => {
    if (!budgetCode) return '#52c41a';
    const percentage = (budgetCode.used / budgetCode.budget) * 100;
    if (percentage >= 90) return '#f5222d';
    if (percentage >= 75) return '#faad14';
    return '#52c41a';
  };

  const prepareAllocationData = () => {
    if (!budgetCode?.allocations) return [];
    
    const statusCounts = {
      allocated: 0,
      spent: 0,
      released: 0
    };

    budgetCode.allocations.forEach(alloc => {
      statusCounts[alloc.status] = (statusCounts[alloc.status] || 0) + 1;
    });

    return Object.keys(statusCounts).map(status => ({
      name: status.charAt(0).toUpperCase() + status.slice(1),
      value: statusCounts[status]
    }));
  };

  const prepareSpendingTrend = () => {
    if (!budgetCode?.allocations) return [];

    const monthlyData = {};
    
    budgetCode.allocations
      .filter(a => a.status === 'spent')
      .forEach(alloc => {
        const month = new Date(alloc.allocatedDate).toISOString().slice(0, 7);
        if (!monthlyData[month]) {
          monthlyData[month] = { month, amount: 0 };
        }
        monthlyData[month].amount += alloc.amount;
      });

    return Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month));
  };

  const allocationColumns = [
    {
      title: 'Requisition',
      key: 'requisition',
      render: (_, record) => (
        <div>
          <Text strong>
            {record.requisitionId?.requisitionNumber || `REQ-${record.requisitionId?._id?.slice(-6)}`}
          </Text>
          <br />
          <Text type="secondary" style={{ fontSize: '11px' }}>
            {record.requisitionId?.title || 'N/A'}
          </Text>
        </div>
      )
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount) => (
        <Text strong style={{ color: '#1890ff' }}>
          XAF {amount.toLocaleString()}
        </Text>
      ),
      sorter: (a, b) => a.amount - b.amount
    },
    {
      title: 'Date',
      dataIndex: 'allocatedDate',
      key: 'allocatedDate',
      render: (date) => new Date(date).toLocaleDateString('en-GB'),
      sorter: (a, b) => new Date(a.allocatedDate) - new Date(b.allocatedDate)
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const colors = {
          allocated: 'processing',
          spent: 'success',
          released: 'default'
        };
        return <Tag color={colors[status]}>{status.toUpperCase()}</Tag>;
      }
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <>
          {record.status === 'allocated' && (
            <Tooltip title="Release Reservation">
              <Button
                size="small"
                danger
                onClick={() => {
                  setSelectedAllocation(record);
                  releaseForm.resetFields();
                  setReleaseModalVisible(true);
                }}
              >
                Release
              </Button>
            </Tooltip>
          )}
        </>
      )
    }
  ];

  const historyColumns = [
    {
      title: 'Date',
      dataIndex: 'changeDate',
      key: 'changeDate',
      render: (date) => new Date(date).toLocaleDateString('en-GB')
    },
    {
      title: 'Previous',
      dataIndex: 'previousBudget',
      key: 'previousBudget',
      render: (amount) => `XAF ${amount.toLocaleString()}`
    },
    {
      title: 'New',
      dataIndex: 'newBudget',
      key: 'newBudget',
      render: (amount) => `XAF ${amount.toLocaleString()}`
    },
    {
      title: 'Change',
      dataIndex: 'changeAmount',
      key: 'changeAmount',
      render: (change) => (
        <Tag color={change > 0 ? 'green' : 'orange'}>
          {change > 0 ? '+' : ''}XAF {Math.abs(change).toLocaleString()}
        </Tag>
      )
    },
    {
      title: 'Reason',
      dataIndex: 'reason',
      key: 'reason',
      ellipsis: true
    },
    {
      title: 'Changed By',
      key: 'changedBy',
      render: (_, record) => record.changedBy?.fullName || 'System'
    }
  ];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28'];

  if (loading && !budgetCode) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Spin size="large" />
        <br />
        <Text>Loading budget code details...</Text>
      </div>
    );
  }

  if (!budgetCode) {
    return (
      <div style={{ padding: '24px' }}>
        <Alert
          message="Budget Code Not Found"
          description="The requested budget code could not be found."
          type="error"
          showIcon
        />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/finance/budget-management')}
          style={{ marginBottom: '16px' }}
        >
          Back to Budget Management
        </Button>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Title level={2} style={{ margin: 0 }}>
              <DollarOutlined /> {budgetCode.code}
            </Title>
            <Text type="secondary">{budgetCode.name}</Text>
          </div>
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => {
                fetchBudgetCodeDetails();
                fetchForecast();
              }}
              loading={loading}
            >
              Refresh
            </Button>
            <Button
              icon={<DownloadOutlined />}
              onClick={handleExportExcel}
            >
              Export Excel
            </Button>
            <Button
              icon={<DownloadOutlined />}
              onClick={handleExportPDF}
            >
              Export PDF
            </Button>
            <Button
              icon={<EditOutlined />}
              type="primary"
              onClick={() => {
                editForm.setFieldsValue(budgetCode);
                setEditModalVisible(true);
              }}
            >
              Edit
            </Button>
            <Button
              icon={budgetCode.active ? <LockOutlined /> : <UnlockOutlined />}
              onClick={handleToggleStatus}
              loading={loading}
            >
              {budgetCode.active ? 'Deactivate' : 'Activate'}
            </Button>
            <Button
              icon={<DeleteOutlined />}
              danger
              onClick={handleDelete}
            >
              Delete
            </Button>
          </Space>
        </div>
      </div>

      {/* Status Alert */}
      {budgetCode.utilizationPercentage >= 90 && (
        <Alert
          message="Critical Budget Utilization"
          description={`This budget code is ${budgetCode.utilizationPercentage}% utilized. Immediate action may be required.`}
          type="error"
          showIcon
          icon={<WarningOutlined />}
          style={{ marginBottom: '24px' }}
        />
      )}

      {budgetCode.status !== 'active' && (
        <Alert
          message={`Budget Code Status: ${budgetCode.status.replace(/_/g, ' ').toUpperCase()}`}
          description={
            budgetCode.status === 'rejected'
              ? `Rejected: ${budgetCode.rejectionReason || 'No reason provided'}`
              : 'This budget code is pending approval.'
          }
          type="warning"
          showIcon
          style={{ marginBottom: '24px' }}
        />
      )}

      {/* Quick Stats */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Budget"
              value={budgetCode.budget}
              prefix="XAF"
              formatter={value => value.toLocaleString()}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Used"
              value={budgetCode.used}
              prefix="XAF"
              formatter={value => value.toLocaleString()}
              valueStyle={{ color: '#faad14' }}
            />
            <Progress
              percent={budgetCode.utilizationPercentage}
              status={getUtilizationStatus()}
              size="small"
              style={{ marginTop: '8px' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Remaining"
              value={budgetCode.remaining}
              prefix="XAF"
              formatter={value => value.toLocaleString()}
              valueStyle={{ color: getUtilizationColor() }}
            />
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {100 - budgetCode.utilizationPercentage}% available
            </Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Allocations"
              value={budgetCode.allocations?.length || 0}
              prefix={<FileTextOutlined />}
            />
            <Text type="secondary" style={{ fontSize: '12px' }}>
              Active: {budgetCode.allocations?.filter(a => a.status === 'allocated').length || 0}
            </Text>
          </Card>
        </Col>
      </Row>

      {/* Main Content Tabs */}
      <Card>
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          {/* Overview Tab */}
          <TabPane tab={<span><EyeOutlined />Overview</span>} key="overview">
            <Row gutter={[16, 16]}>
              <Col xs={24} lg={12}>
                <Card title="Budget Information" size="small">
                  <Descriptions column={1} size="small">
                    <Descriptions.Item label="Budget Code">
                      <Text code strong>{budgetCode.code}</Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="Name">
                      {budgetCode.name}
                    </Descriptions.Item>
                    <Descriptions.Item label="Description">
                      {budgetCode.description || 'No description provided'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Department">
                      <Tag color="blue">{budgetCode.department}</Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="Budget Type">
                      <Tag color="purple">{budgetCode.budgetType}</Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="Budget Period">
                      <Tag>{budgetCode.budgetPeriod}</Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="Fiscal Year">
                      {budgetCode.fiscalYear}
                    </Descriptions.Item>
                    <Descriptions.Item label="Status">
                      {getStatusTag(budgetCode.status)}
                    </Descriptions.Item>
                    <Descriptions.Item label="Active">
                      {budgetCode.active ? (
                        <Tag color="success" icon={<CheckCircleOutlined />}>Active</Tag>
                      ) : (
                        <Tag color="error" icon={<CloseCircleOutlined />}>Inactive</Tag>
                      )}
                    </Descriptions.Item>
                  </Descriptions>
                </Card>

                <Card title="Dates" size="small" style={{ marginTop: '16px' }}>
                  <Descriptions column={1} size="small">
                    <Descriptions.Item label="Start Date">
                      {new Date(budgetCode.startDate).toLocaleDateString('en-GB')}
                    </Descriptions.Item>
                    {budgetCode.endDate && (
                      <Descriptions.Item label="End Date">
                        {new Date(budgetCode.endDate).toLocaleDateString('en-GB')}
                      </Descriptions.Item>
                    )}
                    <Descriptions.Item label="Created">
                      {new Date(budgetCode.createdAt).toLocaleDateString('en-GB')}
                    </Descriptions.Item>
                    <Descriptions.Item label="Last Modified">
                      {new Date(budgetCode.updatedAt).toLocaleDateString('en-GB')}
                    </Descriptions.Item>
                  </Descriptions>
                </Card>

                <Card title="Ownership" size="small" style={{ marginTop: '16px' }}>
                  <Descriptions column={1} size="small">
                    <Descriptions.Item label="Budget Owner">
                      <Space>
                        <TeamOutlined />
                        <div>
                          <Text strong>{budgetCode.budgetOwner?.fullName || 'N/A'}</Text>
                          <br />
                          <Text type="secondary" style={{ fontSize: '11px' }}>
                            {budgetCode.budgetOwner?.email}
                          </Text>
                        </div>
                      </Space>
                    </Descriptions.Item>
                    <Descriptions.Item label="Created By">
                      {budgetCode.createdBy?.fullName || 'N/A'}
                    </Descriptions.Item>
                    {budgetCode.approvedBy && (
                      <Descriptions.Item label="Approved By">
                        {budgetCode.approvedBy?.fullName || 'N/A'}
                      </Descriptions.Item>
                    )}
                  </Descriptions>
                </Card>
              </Col>

              <Col xs={24} lg={12}>
                {/* Utilization Chart */}
                <Card title="Budget Utilization" size="small">
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Used', value: budgetCode.used },
                          { name: 'Remaining', value: budgetCode.remaining }
                        ]}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        <Cell fill="#faad14" />
                        <Cell fill="#52c41a" />
                      </Pie>
                      <RechartsTooltip formatter={(value) => `XAF ${value.toLocaleString()}`} />
                    </PieChart>
                  </ResponsiveContainer>
                </Card>

                {/* Allocation Status */}
                {budgetCode.allocations && budgetCode.allocations.length > 0 && (
                  <Card title="Allocation Status" size="small" style={{ marginTop: '16px' }}>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={prepareAllocationData()}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, value }) => `${name}: ${value}`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {prepareAllocationData().map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <RechartsTooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </Card>
                )}

                {/* Forecast */}
                {forecastData && (
                  <Card title="Budget Forecast" size="small" style={{ marginTop: '16px' }}>
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <div>
                        <Text strong>Average Monthly Burn:</Text>
                        <br />
                        <Text style={{ fontSize: '16px', color: '#1890ff' }}>
                          XAF {forecastData.averageMonthlyBurn?.toLocaleString()}
                        </Text>
                      </div>
                      <div>
                        <Text strong>Projected Duration:</Text>
                        <br />
                        <Text style={{ fontSize: '16px' }}>
                          {forecastData.projectedMonths === 999
                            ? 'Sufficient for foreseeable future'
                            : `${forecastData.projectedMonths} month${forecastData.projectedMonths !== 1 ? 's' : ''}`
                          }
                        </Text>
                      </div>
                      {forecastData.projectedExhaustionDate && (
                        <div>
                          <Text strong>Projected Exhaustion:</Text>
                          <br />
                          <Text style={{ fontSize: '16px', color: '#ff4d4f' }}>
                            {new Date(forecastData.projectedExhaustionDate).toLocaleDateString('en-GB')}
                          </Text>
                        </div>
                      )}
                      <Alert
                        message={forecastData.recommendation}
                        type={
                          forecastData.status === 'critical' ? 'error' :
                          forecastData.status === 'warning' ? 'warning' :
                          forecastData.status === 'healthy' ? 'success' : 'info'
                        }
                        showIcon
                        style={{ marginTop: '8px' }}
                      />
                    </Space>
                  </Card>
                )}
              </Col>
            </Row>

            {/* Quick Actions */}
            <Divider />
            <Title level={5}>Quick Actions</Title>
            <Space wrap>
              <Button
                type="primary"
                icon={<EditOutlined />}
                onClick={() => {
                  revisionForm.setFieldsValue({
                    currentBudget: budgetCode.budget,
                    newBudget: budgetCode.budget
                  });
                  setRevisionModalVisible(true);
                }}
              >
                Request Budget Revision
              </Button>
              <Button
                icon={<SwapOutlined />}
                onClick={() => navigate('/finance/budget-management')}
              >
                Transfer Budget
              </Button>
              <Button
                icon={<LineChartOutlined />}
                onClick={() => setActiveTab('analytics')}
              >
                View Analytics
              </Button>
              {budgetCode.allocations?.some(a => a.status === 'allocated') && (
                <Button
                  danger
                  icon={<ClockCircleOutlined />}
                  onClick={handleReleaseStale}
                >
                  Release Stale Reservations
                </Button>
              )}
            </Space>
          </TabPane>

          {/* Allocations Tab */}
          <TabPane 
            tab={
              <span>
                <FileTextOutlined />
                Allocations
                <Badge count={budgetCode.allocations?.length || 0} style={{ marginLeft: '8px' }} />
              </span>
            } 
            key="allocations"
          >
            <Alert
              message="Budget Allocations"
              description="Track all budget allocations to purchase requisitions and their current status."
              type="info"
              showIcon
              style={{ marginBottom: '16px' }}
            />

            <Table
              columns={allocationColumns}
              dataSource={budgetCode.allocations || []}
              rowKey="_id"
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showTotal: (total) => `Total ${total} allocations`
              }}
            />
          </TabPane>

          {/* Approval Chain Tab */}
          {budgetCode.approvalChain && budgetCode.approvalChain.length > 0 && (
            <TabPane tab={<span><CheckCircleOutlined />Approval Chain</span>} key="approvals">
              <Timeline>
                {budgetCode.approvalChain.map((step, index) => {
                  const color = step.status === 'approved' ? 'green' :
                               step.status === 'rejected' ? 'red' : 'gray';
                  const icon = step.status === 'approved' ? <CheckCircleOutlined /> :
                              step.status === 'rejected' ? <CloseCircleOutlined /> :
                              <ClockCircleOutlined />;

                  return (
                    <Timeline.Item key={index} color={color} dot={icon}>
                      <Card size="small" style={{ marginBottom: '8px' }}>
                        <Space direction="vertical" style={{ width: '100%' }}>
                          <div>
                            <Text strong>Level {step.level}: {step.approver.name}</Text>
                            <br />
                            <Tag color="blue">{step.approver.role}</Tag>
                            {step.approver.department && (
                              <Tag>{step.approver.department}</Tag>
                            )}
                          </div>
                          <div>
                            <Text strong>Status: </Text>
                            <Tag color={color}>{step.status.toUpperCase()}</Tag>
                          </div>
                          {step.status !== 'pending' && step.actionDate && (
                            <div>
                              <Text type="secondary" style={{ fontSize: '12px' }}>
                                {step.status === 'approved' ? 'Approved' : 'Rejected'} on{' '}
                                {new Date(step.actionDate).toLocaleDateString('en-GB')} at {step.actionTime}
                              </Text>
                            </div>
                          )}
                          {step.comments && (
                            <div>
                              <Text strong>Comments: </Text>
                              <Text italic>"{step.comments}"</Text>
                            </div>
                          )}
                        </Space>
                      </Card>
                    </Timeline.Item>
                  );
                })}
              </Timeline>
            </TabPane>
          )}

          {/* History Tab */}
          <TabPane tab={<span><HistoryOutlined />History</span>} key="history">
            {budgetCode.budgetHistory && budgetCode.budgetHistory.length > 0 ? (
              <Table
                columns={historyColumns}
                dataSource={budgetCode.budgetHistory}
                rowKey="_id"
                pagination={{
                  pageSize: 10,
                  showTotal: (total) => `Total ${total} changes`
                }}
              />
            ) : (
              <Alert
                message="No Budget History"
                description="There have been no changes to this budget code."
                type="info"
                showIcon
              />
            )}
          </TabPane>

          {/* Revisions Tab */}
          {budgetCode.budgetRevisions && budgetCode.budgetRevisions.length > 0 && (
            <TabPane 
              tab={
                <span>
                  <FileTextOutlined />
                  Revisions
                  <Badge count={budgetCode.budgetRevisions.length} style={{ marginLeft: '8px' }} />
                </span>
              } 
              key="revisions"
            >
              <List
                itemLayout="vertical"
                dataSource={budgetCode.budgetRevisions}
                renderItem={(revision, index) => (
                  <List.Item key={index}>
                    <Card size="small">
                      <Row gutter={16}>
                        <Col span={18}>
                          <Space direction="vertical" style={{ width: '100%' }}>
                            <div>
                              <Text strong>Revision #{budgetCode.budgetRevisions.length - index}</Text>
                              <br />
                              <Text type="secondary">
                                Requested on {new Date(revision.requestDate).toLocaleDateString('en-GB')}
                              </Text>
                            </div>
                            <div>
                              <Text>Previous: XAF {revision.previousBudget.toLocaleString()}</Text>
                              {' → '}
                              <Text strong style={{ color: '#1890ff' }}>
                                Requested: XAF {revision.requestedBudget.toLocaleString()}
                              </Text>
                            </div>
                            <div>
                              <Tag color={revision.changeAmount > 0 ? 'green' : 'orange'}>
                                {revision.changeAmount > 0 ? '+' : ''}
                                XAF {Math.abs(revision.changeAmount).toLocaleString()}
                              </Tag>
                            </div>
                            <div>
                              <Text strong>Reason: </Text>
                              <Text>{revision.reason}</Text>
                            </div>
                            {revision.status === 'approved' && revision.approvalDate && (
                              <Alert
                                message={`Approved on ${new Date(revision.approvalDate).toLocaleDateString('en-GB')}`}
                                type="success"
                                showIcon
                                size="small"
                              />
                            )}
                            {revision.status === 'rejected' && (
                              <Alert
                                message={`Rejected: ${revision.rejectionReason}`}
                                type="error"
                                showIcon
                                size="small"
                              />
                            )}
                          </Space>
                        </Col>
                        <Col span={6} style={{ textAlign: 'right' }}>
                          <Tag 
                            color={
                              revision.status === 'approved' ? 'success' :
                              revision.status === 'rejected' ? 'error' : 'processing'
                            }
                            style={{ fontSize: '14px' }}
                          >
                            {revision.status.toUpperCase()}
                          </Tag>
                        </Col>
                      </Row>
                    </Card>
                  </List.Item>
                )}
              />
            </TabPane>
          )}

          {/* Analytics Tab */}
          <TabPane tab={<span><LineChartOutlined />Analytics</span>} key="analytics">
            <Row gutter={[16, 16]}>
              {/* Spending Trend */}
              {prepareSpendingTrend().length > 0 && (
                <Col span={24}>
                  <Card title="Monthly Spending Trend" size="small">
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={prepareSpendingTrend()}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <RechartsTooltip formatter={(value) => `XAF ${value.toLocaleString()}`} />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="amount" 
                          stroke="#8884d8" 
                          name="Monthly Spending"
                          strokeWidth={2}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </Card>
                </Col>
              )}

              {/* Budget vs Usage */}
              <Col xs={24} lg={12}>
                <Card title="Budget vs Usage" size="small">
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart
                      data={[
                        {
                          name: 'Budget Status',
                          'Total Budget': budgetCode.budget,
                          'Used': budgetCode.used,
                          'Remaining': budgetCode.remaining
                        }
                      ]}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <RechartsTooltip formatter={(value) => `XAF ${value.toLocaleString()}`} />
                      <Legend />
                      <Bar dataKey="Total Budget" fill="#1890ff" />
                      <Bar dataKey="Used" fill="#faad14" />
                      <Bar dataKey="Remaining" fill="#52c41a" />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              </Col>

              {/* Performance Metrics */}
              <Col xs={24} lg={12}>
                <Card title="Performance Metrics" size="small">
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Statistic
                      title="Utilization Rate"
                      value={budgetCode.utilizationPercentage}
                      suffix="%"
                      valueStyle={{ color: getUtilizationColor() }}
                    />
                    <Divider style={{ margin: '12px 0' }} />
                    <Statistic
                      title="Total Allocations"
                      value={budgetCode.allocations?.length || 0}
                      prefix={<FileTextOutlined />}
                    />
                    <Divider style={{ margin: '12px 0' }} />
                    <Statistic
                      title="Active Reservations"
                      value={budgetCode.allocations?.filter(a => a.status === 'allocated').length || 0}
                      prefix={<ClockCircleOutlined />}
                      valueStyle={{ color: '#faad14' }}
                    />
                    <Divider style={{ margin: '12px 0' }} />
                    <Statistic
                      title="Completed Transactions"
                      value={budgetCode.allocations?.filter(a => a.status === 'spent').length || 0}
                      prefix={<CheckCircleOutlined />}
                      valueStyle={{ color: '#52c41a' }}
                    />
                  </Space>
                </Card>
              </Col>
            </Row>
          </TabPane>
        </Tabs>
      </Card>

      {/* Edit Budget Code Modal */}
      <Modal
        title={
          <Space>
            <EditOutlined />
            Edit Budget Code
          </Space>
        }
        open={editModalVisible}
        onCancel={() => {
          setEditModalVisible(false);
          editForm.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={editForm}
          layout="vertical"
          onFinish={handleUpdate}
        >
          <Form.Item
            name="name"
            label="Budget Name"
            rules={[{ required: true, message: 'Please enter budget name' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
          >
            <TextArea rows={3} />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="department"
                label="Department"
                rules={[{ required: true }]}
              >
                <Input disabled />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="budgetType"
                label="Budget Type"
                rules={[{ required: true }]}
              >
                <Input disabled />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item>
            <Space>
              <Button onClick={() => {
                setEditModalVisible(false);
                editForm.resetFields();
              }}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                Update
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Request Revision Modal */}
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
          revisionForm.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Alert
          message="Current Budget Information"
          description={
            <div>
              <Text><strong>Code:</strong> {budgetCode.code}</Text>
              <br />
              <Text><strong>Current Budget:</strong> XAF {budgetCode.budget.toLocaleString()}</Text>
              <br />
              <Text><strong>Used:</strong> XAF {budgetCode.used.toLocaleString()}</Text>
              <br />
              <Text><strong>Remaining:</strong> XAF {budgetCode.remaining.toLocaleString()}</Text>
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
                  if (value === budgetCode.budget) {
                    return Promise.reject('New budget must be different from current budget');
                  }
                  if (value < budgetCode.used) {
                    return Promise.reject('New budget cannot be less than already used amount');
                  }
                  return Promise.resolve();
                }
              }
            ]}
          >
            <InputNumber
              style={{ width: '100%' }}
              min={budgetCode.used}
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
              const currentBudget = budgetCode.budget;
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
                revisionForm.resetFields();
              }}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                Submit Revision Request
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Release Reservation Modal */}
      <Modal
        title={
          <Space>
            <CloseCircleOutlined />
            Release Budget Reservation
          </Space>
        }
        open={releaseModalVisible}
        onCancel={() => {
          setReleaseModalVisible(false);
          setSelectedAllocation(null);
          releaseForm.resetFields();
        }}
        footer={null}
        width={500}
      >
        {selectedAllocation && (
          <>
            <Alert
              message="Reservation Details"
              description={
                <div>
                  <Text><strong>Requisition:</strong> {selectedAllocation.requisitionId?.requisitionNumber}</Text>
                  <br />
                  <Text><strong>Amount:</strong> XAF {selectedAllocation.amount.toLocaleString()}</Text>
                  <br />
                  <Text><strong>Allocated:</strong> {new Date(selectedAllocation.allocatedDate).toLocaleDateString('en-GB')}</Text>
                </div>
              }
              type="warning"
              showIcon
              style={{ marginBottom: '20px' }}
            />

            <Form
              form={releaseForm}
              layout="vertical"
              onFinish={handleReleaseReservation}
            >
              <Form.Item
                name="reason"
                label="Reason for Release"
                rules={[
                  { required: true, message: 'Please provide a reason' },
                  { min: 10, message: 'Reason must be at least 10 characters' }
                ]}
              >
                <TextArea
                  rows={3}
                  placeholder="Explain why this reservation should be released..."
                  showCount
                  maxLength={300}
                />
              </Form.Item>

              <Form.Item>
                <Space>
                  <Button onClick={() => {
                    setReleaseModalVisible(false);
                    setSelectedAllocation(null);
                    releaseForm.resetFields();
                  }}>
                    Cancel
                  </Button>
                  <Button type="primary" danger htmlType="submit" loading={loading}>
                    Release Reservation
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

export default BudgetCodeDetails;