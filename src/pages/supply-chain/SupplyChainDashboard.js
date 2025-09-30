import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Typography,
  Table,
  Progress,
  Tag,
  Space,
  Button,
  Alert,
  Timeline,
  Tabs,
  Divider
} from 'antd';
import {
  ShoppingCartOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  DollarOutlined,
  TeamOutlined,
  TruckOutlined,
  WarningOutlined,
  RiseOutlined,
  LineChartOutlined,
  CalendarOutlined,
  FileTextOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

const SupplyChainDashboard = () => {
  const [loading, setLoading] = useState(false);
  const [dashboardData, setDashboardData] = useState({});

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock dashboard data
      setDashboardData({
        statistics: {
          totalRequisitions: 156,
          pendingReview: 23,
          activeProcurements: 12,
          completedThisMonth: 89,
          totalBudgetAllocated: 125000000,
          budgetUtilized: 87500000,
          averageProcessingTime: 5.2,
          supplierCount: 45
        },
        recentRequisitions: [
          {
            id: 'REQ20241127001',
            title: 'IT Accessories - Safety Stock',
            department: 'IT/HR',
            budget: 1500000,
            status: 'pending_review',
            urgency: 'Low',
            submittedDate: '2024-11-27'
          },
          {
            id: 'REQ20241126002',
            title: 'Office Furniture Replacement',
            department: 'Admin',
            budget: 3200000,
            status: 'in_procurement',
            urgency: 'Medium',
            submittedDate: '2024-11-26'
          },
          {
            id: 'REQ20241125003',
            title: 'Security Equipment Upgrade',
            department: 'Security',
            budget: 5500000,
            status: 'approved',
            urgency: 'High',
            submittedDate: '2024-11-25'
          }
        ],
        upcomingDeadlines: [
          {
            id: 'REQ20241120001',
            title: 'Medical Supplies Procurement',
            dueDate: '2024-12-02',
            status: 'in_procurement',
            daysLeft: 3
          },
          {
            id: 'REQ20241119002',
            title: 'Vehicle Maintenance Parts',
            dueDate: '2024-12-05',
            status: 'approved',
            daysLeft: 6
          }
        ],
        alerts: [
          {
            type: 'warning',
            message: '5 requisitions approaching deadline',
            description: 'Review and expedite processing for critical items'
          },
          {
            type: 'info',
            message: 'Budget utilization at 70%',
            description: 'Q4 budget tracking on schedule'
          }
        ]
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusTag = (status) => {
    const statusMap = {
      'pending_review': { color: 'orange', text: 'Pending Review' },
      'approved': { color: 'green', text: 'Approved' },
      'in_procurement': { color: 'blue', text: 'In Procurement' },
      'completed': { color: 'purple', text: 'Completed' },
      'rejected': { color: 'red', text: 'Rejected' }
    };
    const status_info = statusMap[status] || { color: 'default', text: status };
    return <Tag color={status_info.color}>{status_info.text}</Tag>;
  };

  const getUrgencyTag = (urgency) => {
    const urgencyMap = {
      'Low': 'green',
      'Medium': 'orange', 
      'High': 'red'
    };
    return <Tag color={urgencyMap[urgency]}>{urgency}</Tag>;
  };

  const requisitionColumns = [
    {
      title: 'Requisition ID',
      dataIndex: 'id',
      key: 'id',
      render: (id) => <Text code>{id}</Text>
    },
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true
    },
    {
      title: 'Department',
      dataIndex: 'department', 
      key: 'department'
    },
    {
      title: 'Budget (XAF)',
      dataIndex: 'budget',
      key: 'budget',
      render: (budget) => budget.toLocaleString(),
      align: 'right'
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status', 
      render: (status) => getStatusTag(status)
    },
    {
      title: 'Urgency',
      dataIndex: 'urgency',
      key: 'urgency',
      render: (urgency) => getUrgencyTag(urgency)
    },
    {
      title: 'Submitted',
      dataIndex: 'submittedDate',
      key: 'submittedDate',
      render: (date) => new Date(date).toLocaleDateString('en-GB')
    }
  ];

  const { statistics, recentRequisitions, upcomingDeadlines, alerts } = dashboardData;

  if (!statistics) return <div>Loading...</div>;

  const budgetUtilizationPercentage = Math.round((statistics.budgetUtilized / statistics.totalBudgetAllocated) * 100);

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <Title level={2}>
          <ShoppingCartOutlined /> Supply Chain Dashboard
        </Title>
        <Text type="secondary">
          Overview of purchase requisitions, procurement activities, and supply chain performance
        </Text>
      </div>

      {/* Alerts */}
      {alerts && alerts.length > 0 && (
        <Row gutter={16} style={{ marginBottom: '24px' }}>
          {alerts.map((alert, index) => (
            <Col span={12} key={index}>
              <Alert
                message={alert.message}
                description={alert.description}
                type={alert.type}
                showIcon
              />
            </Col>
          ))}
        </Row>
      )}

      {/* Key Statistics */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Requisitions"
              value={statistics.totalRequisitions}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Pending Review"
              value={statistics.pendingReview}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Active Procurements"
              value={statistics.activeProcurements}
              prefix={<ShoppingCartOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Completed (This Month)"
              value={statistics.completedThisMonth}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Financial Overview */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col xs={24} md={12}>
          <Card title={<><DollarOutlined /> Budget Overview</>}>
            <div style={{ marginBottom: '16px' }}>
              <Text strong>Total Budget Allocated: </Text>
              <Text>{statistics.totalBudgetAllocated.toLocaleString()} XAF</Text>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <Text strong>Budget Utilized: </Text>
              <Text>{statistics.budgetUtilized.toLocaleString()} XAF</Text>
            </div>
            <Progress 
              percent={budgetUtilizationPercentage} 
              status={budgetUtilizationPercentage > 90 ? 'exception' : 'active'}
            />
            <Text type="secondary" style={{ fontSize: '12px' }}>
              Budget utilization: {budgetUtilizationPercentage}%
            </Text>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title={<><RiseOutlined /> Performance Metrics</>}>
            <Row gutter={16}>
              <Col span={12}>
                <Statistic
                  title="Avg Processing Time"
                  value={statistics.averageProcessingTime}
                  suffix="days"
                  precision={1}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="Active Suppliers"
                  value={statistics.supplierCount}
                  prefix={<TeamOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      {/* Main Content Tabs */}
      <Tabs defaultActiveKey="recent">
        <TabPane 
          tab={<><FileTextOutlined /> Recent Requisitions</>} 
          key="recent"
        >
          <Card>
            <Table
              columns={requisitionColumns}
              dataSource={recentRequisitions}
              rowKey="id"
              loading={loading}
              pagination={false}
              size="small"
            />
            <Divider />
            <div style={{ textAlign: 'center' }}>
              <Button type="primary" href="/supply-chain/requisitions">
                View All Requisitions
              </Button>
            </div>
          </Card>
        </TabPane>

        <TabPane 
          tab={<><CalendarOutlined /> Upcoming Deadlines</>} 
          key="deadlines"
        >
          <Card>
            <Timeline>
              {upcomingDeadlines && upcomingDeadlines.map(item => (
                <Timeline.Item 
                  key={item.id}
                  color={item.daysLeft <= 3 ? 'red' : item.daysLeft <= 7 ? 'orange' : 'green'}
                  dot={item.daysLeft <= 3 ? <WarningOutlined /> : <ClockCircleOutlined />}
                >
                  <div>
                    <Text strong>{item.title}</Text>
                    <br />
                    <Text code>{item.id}</Text> - {getStatusTag(item.status)}
                    <br />
                    <Text type="secondary">
                      Due: {new Date(item.dueDate).toLocaleDateString('en-GB')} 
                      ({item.daysLeft} days left)
                    </Text>
                  </div>
                </Timeline.Item>
              ))}
            </Timeline>
          </Card>
        </TabPane>

        <TabPane 
          tab={<><LineChartOutlined /> Analytics</>} 
          key="analytics"
        >
          <Row gutter={16}>
            <Col span={24}>
              <Alert
                message="Analytics Dashboard"
                description="Detailed procurement analytics and insights will be available in the dedicated analytics section."
                type="info"
                showIcon
                action={
                  <Button size="small" href="/supply-chain/analytics">
                    View Analytics
                  </Button>
                }
              />
            </Col>
          </Row>
        </TabPane>
      </Tabs>

      {/* Quick Actions */}
      <Card title="Quick Actions" style={{ marginTop: '24px' }}>
        <Space wrap>
          <Button type="primary" icon={<ShoppingCartOutlined />} href="/supply-chain/requisitions">
            Manage Requisitions
          </Button>
          <Button icon={<TeamOutlined />} href="/supply-chain/vendors">
            Vendor Management
          </Button>
          <Button icon={<TruckOutlined />} href="/supply-chain/procurement-planning">
            Procurement Planning
          </Button>
          <Button icon={<LineChartOutlined />} href="/supply-chain/analytics">
            View Analytics
          </Button>
        </Space>
      </Card>
    </div>
  );
};

export default SupplyChainDashboard;