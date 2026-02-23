import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Space,
  Tag,
  Progress,
  Alert,
  Typography,
  message,
  Button,
  Tabs,
  Badge,
  Modal,
  List,
  Divider,
  Spin
} from 'antd';
import {
  DollarOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ReloadOutlined,
  BarChartOutlined,
  EyeOutlined,
  PieChartOutlined,
  LineChartOutlined,
  FileExcelOutlined
} from '@ant-design/icons';
import { budgetCodeAPI } from '../../services/budgetCodeAPI';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

const DepartmentBudgetDashboard = () => {
  const [loading, setLoading] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [usageTrackingModalVisible, setUsageTrackingModalVisible] = useState(false);
  const [usageTrackingData, setUsageTrackingData] = useState(null);
  const [loadingUsageTracking, setLoadingUsageTracking] = useState(false);
  const [selectedCode, setSelectedCode] = useState(null);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const response = await budgetCodeAPI.getDepartmentBudgetDashboard();
      if (response.success) {
        setDashboardData(response.data);
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error);
      message.error('Failed to load department budget dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleViewUsageTracking = async (budgetCode) => {
    try {
      setLoadingUsageTracking(true);
      setSelectedCode(budgetCode);
      const response = await budgetCodeAPI.getBudgetCodeUsageTracking(budgetCode._id);
      if (response.success) {
        setUsageTrackingData(response.data);
        setUsageTrackingModalVisible(true);
      }
    } catch (error) {
      message.error('Failed to load usage tracking data');
      console.error('Usage tracking error:', error);
    } finally {
      setLoadingUsageTracking(false);
    }
  };

  const getUtilizationStatus = (percentage) => {
    if (percentage >= 90) return 'exception';
    if (percentage >= 75) return 'active';
    return 'success';
  };

  const getAlertColor = (type) => {
    const colors = {
      critical: 'error',
      warning: 'warning',
      info: 'info'
    };
    return colors[type] || 'info';
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
      title: 'Type',
      dataIndex: 'budgetType',
      key: 'budgetType',
      width: 100,
      render: (type) => {
        const colors = {
          OPEX: 'blue',
          CAPEX: 'green',
          PROJECT: 'purple',
          OPERATIONAL: 'orange'
        };
        return <Tag color={colors[type] || 'default'}>{type}</Tag>;
      }
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
        const percentage = record.utilizationPercentage;
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
      sorter: (a, b) => a.utilizationPercentage - b.utilizationPercentage
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
      width: 120,
      render: (_, record) => (
        <Space size="small">
          <Button
            size="small"
            type="primary"
            icon={<BarChartOutlined />}
            onClick={() => handleViewUsageTracking(record)}
          >
            Track
          </Button>
        </Space>
      )
    }
  ];

  if (!dashboardData) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Card loading={loading}>
          <Text>Loading department budget dashboard...</Text>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <Title level={2} style={{ margin: 0 }}>
          <DollarOutlined /> {dashboardData.department} Budget Dashboard
        </Title>
        <Space>
          <Button
            icon={<ReloadOutlined />}
            onClick={fetchDashboard}
            loading={loading}
          >
            Refresh
          </Button>
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
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {dashboardData.summary.totalCodes} budget code{dashboardData.summary.totalCodes !== 1 ? 's' : ''}
            </Text>
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
              title="Status Overview"
              value={dashboardData.summary.healthyCodes}
              suffix={`/ ${dashboardData.summary.totalCodes}`}
              valueStyle={{ color: '#52c41a' }}
            />
            <div style={{ marginTop: '8px' }}>
              <Text type="danger">Critical: {dashboardData.summary.criticalCodes}</Text>
              <br />
              <Text type="warning">Warning: {dashboardData.summary.warningCodes}</Text>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Budget Type Breakdown */}
      <Card title={<><PieChartOutlined /> Budget by Type</>} style={{ marginBottom: '24px' }}>
        <Row gutter={[16, 16]}>
          {Object.entries(dashboardData.summary.byBudgetType).map(([type, data]) => (
            data.count > 0 && (
              <Col key={type} xs={24} sm={12} md={6}>
                <Card type="inner" style={{ background: '#f0f2f5' }}>
                  <Statistic
                    title={type}
                    value={data.used}
                    prefix="XAF"
                    suffix={
                      <div>
                        <Tag color="blue">{data.count} codes</Tag>
                        <br />
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          of XAF {data.budget.toLocaleString()}
                        </Text>
                      </div>
                    }
                  />
                  <Progress 
                    percent={data.utilizationPercentage} 
                    size="small" 
                    status={getUtilizationStatus(data.utilizationPercentage)}
                  />
                </Card>
              </Col>
            )
          ))}
        </Row>
      </Card>

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
              All Budget Codes
            </span>
          } 
          key="overview"
        >
          <Card>
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
                code => code.utilizationPercentage >= 90
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
                  const utilization = code.utilizationPercentage;
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
                code => code.utilizationPercentage < 75
              )}
              loading={loading}
              rowKey="_id"
              scroll={{ x: 1200 }}
            />
          </Card>
        </TabPane>
      </Tabs>

      {/* Usage Tracking Modal */}
      <Modal
        title={
          <Space>
            <BarChartOutlined />
            <span>
              Budget Code Usage Tracking
              {selectedCode && ` - ${selectedCode.code}`}
            </span>
          </Space>
        }
        visible={usageTrackingModalVisible}
        onCancel={() => {
          setUsageTrackingModalVisible(false);
          setUsageTrackingData(null);
          setSelectedCode(null);
        }}
        width={1200}
        footer={[
          <Button
            key="close"
            onClick={() => {
              setUsageTrackingModalVisible(false);
              setUsageTrackingData(null);
              setSelectedCode(null);
            }}
          >
            Close
          </Button>
        ]}
      >
        {loadingUsageTracking ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Spin size="large" />
            <div style={{ marginTop: '16px' }}>Loading usage tracking data...</div>
          </div>
        ) : usageTrackingData ? (
          <>
            {/* Budget Summary */}
            <Card size="small" style={{ marginBottom: '16px' }}>
              <Row gutter={16}>
                <Col span={6}>
                  <Statistic
                    title="Total Budget"
                    value={usageTrackingData.budgetCode.budget}
                    prefix="XAF"
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Col>
                <Col span={6}>
                  <Statistic
                    title="Total Used"
                    value={usageTrackingData.budgetCode.used}
                    prefix="XAF"
                    valueStyle={{ color: '#faad14' }}
                  />
                </Col>
                <Col span={6}>
                  <Statistic
                    title="Remaining"
                    value={usageTrackingData.budgetCode.remaining}
                    prefix="XAF"
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Col>
                <Col span={6}>
                  <Statistic
                    title="Utilization"
                    value={usageTrackingData.budgetCode.utilizationPercentage}
                    suffix="%"
                    valueStyle={{ 
                      color: usageTrackingData.budgetCode.utilizationPercentage >= 90 
                        ? '#ff4d4f' 
                        : usageTrackingData.budgetCode.utilizationPercentage >= 75 
                        ? '#faad14' 
                        : '#52c41a' 
                    }}
                  />
                </Col>
              </Row>
              <Divider style={{ margin: '12px 0' }} />
              <Progress
                percent={usageTrackingData.budgetCode.utilizationPercentage}
                status={getUtilizationStatus(usageTrackingData.budgetCode.utilizationPercentage)}
                strokeWidth={12}
              />
            </Card>

            {/* Usage by Source */}
            <Card 
              title={<><BarChartOutlined /> Usage by Source</>}
              size="small" 
              style={{ marginBottom: '16px' }}
            >
              <Row gutter={16}>
                <Col span={8}>
                  <Card type="inner" style={{ background: '#f0f2f5' }}>
                    <Statistic
                      title="Purchase Requisitions"
                      value={usageTrackingData.summary.bySource.purchaseRequisitions.total}
                      prefix="XAF"
                      suffix={
                        <Tag color="blue" style={{ marginLeft: '8px' }}>
                          {usageTrackingData.summary.bySource.purchaseRequisitions.count} items
                        </Tag>
                      }
                    />
                  </Card>
                </Col>
                <Col span={8}>
                  <Card type="inner" style={{ background: '#f0f2f5' }}>
                    <Statistic
                      title="Cash Requests"
                      value={usageTrackingData.summary.bySource.cashRequests.total}
                      prefix="XAF"
                      suffix={
                        <Tag color="green" style={{ marginLeft: '8px' }}>
                          {usageTrackingData.summary.bySource.cashRequests.count} items
                        </Tag>
                      }
                    />
                  </Card>
                </Col>
                <Col span={8}>
                  <Card type="inner" style={{ background: '#f0f2f5' }}>
                    <Statistic
                      title="Salary Payments"
                      value={usageTrackingData.summary.bySource.salaryPayments.total}
                      prefix="XAF"
                      suffix={
                        <Tag color="purple" style={{ marginLeft: '8px' }}>
                          {usageTrackingData.summary.bySource.salaryPayments.count} items
                        </Tag>
                      }
                    />
                  </Card>
                </Col>
              </Row>
            </Card>

            {/* Recent Transactions */}
            <Card title="Recent Transactions" size="small">
              <List
                size="small"
                dataSource={[
                  ...usageTrackingData.recentTransactions.purchaseRequisitions,
                  ...usageTrackingData.recentTransactions.cashRequests,
                  ...usageTrackingData.recentTransactions.salaryPayments
                ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10)}
                renderItem={(item) => (
                  <List.Item
                    actions={[
                      <Tag color={
                        item.type === 'Purchase Requisition' ? 'blue' :
                        item.type === 'Cash Request' ? 'green' : 'purple'
                      }>
                        {item.type}
                      </Tag>,
                      <Text strong>XAF {item.amount?.toLocaleString()}</Text>
                    ]}
                  >
                    <List.Item.Meta
                      title={
                        <Space>
                          {item.requisitionNumber || item.requestType || item.department}
                          {item.title && <Text type="secondary">- {item.title}</Text>}
                        </Space>
                      }
                      description={
                        <Space split={<Divider type="vertical" />}>
                          {item.employee && (
                            <Text type="secondary">
                              {item.employee.fullName}
                            </Text>
                          )}
                          {item.submittedBy && (
                            <Text type="secondary">
                              By: {item.submittedBy.fullName}
                            </Text>
                          )}
                          <Text type="secondary">
                            {new Date(item.date).toLocaleDateString()}
                          </Text>
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            </Card>
          </>
        ) : (
          <Alert
            message="No Usage Data"
            description="No usage tracking data available for this budget code."
            type="info"
            showIcon
          />
        )}
      </Modal>
    </div>
  );
};

export default DepartmentBudgetDashboard;
