import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Card, 
  Row, 
  Col, 
  Statistic, 
  Typography, 
  Progress, 
  List, 
  Tag, 
  Space, 
  Button,
  Alert,
  Spin,
  Table,
  Timeline,
  Badge,
  Tooltip,
  Divider
} from 'antd';
import { 
  DashboardOutlined,
  LaptopOutlined,
  BugOutlined,
  ShoppingCartOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  UserOutlined,
  ToolOutlined,
  InboxOutlined,
  TrendingUpOutlined,
  TrendingDownOutlined,
  CalendarOutlined,
  PhoneOutlined,
  WifiOutlined,
  DesktopOutlined,
  PrinterOutlined,
  ExclamationCircleOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  ReloadOutlined,
  EyeOutlined,
  FireOutlined,
  PlusOutlined,
  ThunderboltOutlined
} from '@ant-design/icons';
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend
} from 'recharts';
import { useSelector } from 'react-redux';
import { itSupportAPI } from '../../services/api';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const ITDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('Fetching IT dashboard data...');
      const response = await itSupportAPI.getDashboardStats();
      
      if (response?.success && response?.data) {
        setDashboardData(response.data);
      } else {
        // Fallback to mock data if API fails
        console.warn('Using fallback mock data for IT dashboard');
        const mockData = {
        overview: {
          totalRequests: 156,
          pendingRequests: 23,
          inProgressRequests: 15,
          resolvedToday: 8,
          averageResolutionTime: 2.4, 
          customerSatisfaction: 4.2, 
          slaCompliance: 89, 
          criticalIssues: 3
        },
        trends: {
          requestVolume: [
            { date: '2024-08-12', requests: 12, resolved: 10 },
            { date: '2024-08-13', requests: 15, resolved: 13 },
            { date: '2024-08-14', requests: 18, resolved: 16 },
            { date: '2024-08-15', requests: 14, resolved: 14 },
            { date: '2024-08-16', requests: 16, resolved: 15 },
            { date: '2024-08-17', requests: 13, resolved: 11 },
            { date: '2024-08-18', requests: 11, resolved: 9 },
            { date: '2024-08-19', requests: 19, resolved: 17 }
          ],
          categoryBreakdown: [
            { category: 'Hardware', count: 45, color: '#1890ff' },
            { category: 'Software', count: 38, color: '#722ed1' },
            { category: 'Network', count: 28, color: '#13c2c2' },
            { category: 'Mobile', count: 22, color: '#eb2f96' },
            { category: 'Other', count: 23, color: '#52c41a' }
          ],
          priorityDistribution: [
            { priority: 'Critical', count: 3, color: '#ff4d4f' },
            { priority: 'High', count: 15, color: '#fa8c16' },
            { priority: 'Medium', count: 42, color: '#faad14' },
            { priority: 'Low', count: 96, color: '#52c41a' }
          ]
        },
        recentActivity: [
          {
            id: 1,
            type: 'resolved',
            ticket: 'IT-2024-045',
            title: 'Laptop screen flickering issue',
            employee: 'John Doe',
            technician: 'Tech Support',
            timestamp: '2024-08-19T14:30:00Z'
          },
          {
            id: 2,
            type: 'assigned',
            ticket: 'IT-2024-046',
            title: 'New monitor request',
            employee: 'Jane Smith',
            technician: 'Hardware Team',
            timestamp: '2024-08-19T13:45:00Z'
          },
          {
            id: 3,
            type: 'critical',
            ticket: 'IT-2024-047',
            title: 'Server connectivity issues',
            employee: 'Multiple Users',
            technician: 'Network Admin',
            timestamp: '2024-08-19T12:15:00Z'
          },
          {
            id: 4,
            type: 'resolved',
            ticket: 'IT-2024-044',
            title: 'Email sync problems',
            employee: 'Mike Johnson',
            technician: 'IT Support',
            timestamp: '2024-08-19T11:30:00Z'
          },
          {
            id: 5,
            type: 'created',
            ticket: 'IT-2024-048',
            title: 'Software installation request',
            employee: 'Sarah Wilson',
            technician: 'Unassigned',
            timestamp: '2024-08-19T10:45:00Z'
          }
        ],
        urgentItems: [
          {
            id: 1,
            type: 'critical_issue',
            title: 'Main server experiencing high CPU usage',
            description: 'Server load at 95% affecting multiple services',
            priority: 'critical',
            assignedTo: 'Network Admin',
            deadline: '2024-08-19T16:00:00Z'
          },
          {
            id: 2,
            type: 'sla_breach',
            title: 'Printer repair request overdue',
            description: 'HP LaserJet repair pending for 3 days',
            priority: 'high',
            assignedTo: 'Hardware Team',
            deadline: '2024-08-19T17:30:00Z'
          },
          {
            id: 3,
            type: 'inventory_alert',
            title: 'Mouse stock running low',
            description: 'Only 2 wireless mice remaining in stock',
            priority: 'medium',
            assignedTo: 'IT Manager',
            deadline: '2024-08-22T09:00:00Z'
          }
        ],
        teamPerformance: [
          {
            technician: 'John Tech',
            activeTickets: 8,
            resolvedToday: 3,
            avgResolutionTime: 1.8,
            satisfaction: 4.5
          },
          {
            technician: 'Network Admin',
            activeTickets: 5,
            resolvedToday: 2,
            avgResolutionTime: 3.2,
            satisfaction: 4.2
          },
          {
            technician: 'Hardware Team',
            activeTickets: 12,
            resolvedToday: 1,
            avgResolutionTime: 4.1,
            satisfaction: 3.9
          },
          {
            technician: 'Mobile Support',
            activeTickets: 3,
            resolvedToday: 2,
            avgResolutionTime: 1.5,
            satisfaction: 4.7
          }
        ],
        inventory: {
          totalItems: 234,
          availableItems: 89,
          assignedItems: 134,
          maintenanceItems: 11,
          lowStockItems: 8,
          totalValue: 15400000
        },
        systemHealth: {
          serverUptime: 99.8,
          networkLatency: 15, // ms
          storageUsage: 67,
          backupStatus: 'success',
          securityAlerts: 2,
          lastUpdate: '2024-08-19T14:00:00Z'
        },
      };
      
        setDashboardData(mockData);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError(error.response?.data?.message || 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    await fetchDashboardData();
  };

  const getActivityIcon = (type) => {
    const iconMap = {
      'resolved': <CheckCircleOutlined style={{ color: '#52c41a' }} />,
      'assigned': <UserOutlined style={{ color: '#1890ff' }} />,
      'critical': <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />,
      'created': <PlusOutlined style={{ color: '#722ed1' }} />,
      'in_progress': <ToolOutlined style={{ color: '#fa8c16' }} />
    };
    return iconMap[type] || <ClockCircleOutlined style={{ color: '#666' }} />;
  };

  const getUrgentItemIcon = (type) => {
    const iconMap = {
      'critical_issue': <FireOutlined style={{ color: '#ff4d4f' }} />,
      'sla_breach': <ClockCircleOutlined style={{ color: '#fa8c16' }} />,
      'inventory_alert': <InboxOutlined style={{ color: '#faad14' }} />
    };
    return iconMap[type] || <WarningOutlined style={{ color: '#666' }} />;
  };

  const teamColumns = [
    {
      title: 'Technician',
      dataIndex: 'technician',
      key: 'technician',
      render: (name) => (
        <Space>
          <UserOutlined />
          <Text strong>{name}</Text>
        </Space>
      )
    },
    {
      title: 'Active',
      dataIndex: 'activeTickets',
      key: 'activeTickets',
      align: 'center',
      render: (count) => <Badge count={count} showZero color="#1890ff" />
    },
    {
      title: 'Resolved Today',
      dataIndex: 'resolvedToday',
      key: 'resolvedToday',
      align: 'center',
      render: (count) => <Badge count={count} showZero color="#52c41a" />
    },
    {
      title: 'Avg Time',
      dataIndex: 'avgResolutionTime',
      key: 'avgResolutionTime',
      align: 'center',
      render: (time) => <Text>{time}h</Text>
    },
    {
      title: 'Rating',
      dataIndex: 'satisfaction',
      key: 'satisfaction',
      align: 'center',
      render: (rating) => (
        <Space>
          <Text>{rating}</Text>
          <Text type="secondary">⭐</Text>
        </Space>
      )
    }
  ];

  if (loading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Spin size="large" />
        <div style={{ marginTop: '16px' }}>Loading IT Dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '24px' }}>
        <Alert
          message="Error Loading Dashboard"
          description={error}
          type="error"
          showIcon
          action={
            <Button onClick={handleRefresh}>
              Retry
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <Title level={2} style={{ margin: 0 }}>
          <DashboardOutlined /> IT Department Dashboard
        </Title>
        <Space>
          <Text type="secondary">
            Last updated: {dayjs().format('MMM DD, YYYY HH:mm')}
          </Text>
          <Button 
            icon={<ReloadOutlined />}
            onClick={handleRefresh}
            loading={loading}
          >
            Refresh
          </Button>
        </Space>
      </div>

      {/* Key Metrics */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Requests"
              value={dashboardData.overview.totalRequests}
              prefix={<LaptopOutlined />}
              valueStyle={{ color: '#1890ff' }}
              suffix={
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  <ArrowUpOutlined /> +12%
                </Text>
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Pending"
              value={dashboardData.overview.pendingRequests}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
              suffix={
                <Button 
                  type="link" 
                  size="small"
                  onClick={() => navigate('/it/support-requests')}
                >
                  View
                </Button>
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="In Progress"
              value={dashboardData.overview.inProgressRequests}
              prefix={<ToolOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Resolved Today"
              value={dashboardData.overview.resolvedToday}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
              suffix={
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  <ArrowUpOutlined /> +25%
                </Text>
              }
            />
          </Card>
        </Col>
      </Row>

      {/* Performance Metrics */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Avg Resolution Time"
              value={dashboardData.overview.averageResolutionTime}
              suffix="hours"
              precision={1}
              valueStyle={{ color: '#13c2c2' }}
              prefix={<ThunderboltOutlined />}
            />
            <Progress 
              percent={75} 
              size="small" 
              strokeColor="#13c2c2"
              format={() => 'Target: 3h'}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Customer Satisfaction"
              value={dashboardData.overview.customerSatisfaction}
              suffix="/ 5"
              precision={1}
              valueStyle={{ color: '#52c41a' }}
              prefix={<span style={{ fontSize: '16px' }}>⭐</span>}
            />
            <Progress 
              percent={84} 
              size="small" 
              strokeColor="#52c41a"
              format={() => '84%'}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="SLA Compliance"
              value={dashboardData.overview.slaCompliance}
              suffix="%"
              valueStyle={{ color: '#1890ff' }}
              prefix={<CheckCircleOutlined />}
            />
            <Progress 
              percent={dashboardData.overview.slaCompliance} 
              size="small" 
              strokeColor="#1890ff"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Critical Issues"
              value={dashboardData.overview.criticalIssues}
              valueStyle={{ color: dashboardData.overview.criticalIssues > 0 ? '#ff4d4f' : '#52c41a' }}
              prefix={<FireOutlined />}
              suffix={
                dashboardData.overview.criticalIssues > 0 && (
                  <Button 
                    type="link" 
                    size="small" 
                    danger
                    onClick={() => navigate('/it/support-requests')}
                  >
                    Urgent
                  </Button>
                )
              }
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginBottom: '24px' }}>
        {/* Request Volume Trend */}
        <Col xs={24} lg={16}>
          <Card title="Request Volume Trend (Last 7 Days)" extra={<Button icon={<EyeOutlined />} size="small">Details</Button>}>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={dashboardData.trends.requestVolume}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => dayjs(value).format('MMM DD')}
                />
                <YAxis />
                <RechartsTooltip 
                  labelFormatter={(value) => dayjs(value).format('MMMM DD, YYYY')}
                />
                <Area 
                  type="monotone" 
                  dataKey="requests" 
                  stackId="1" 
                  stroke="#1890ff" 
                  fill="#1890ff" 
                  fillOpacity={0.3}
                  name="New Requests"
                />
                <Area 
                  type="monotone" 
                  dataKey="resolved" 
                  stackId="2" 
                  stroke="#52c41a" 
                  fill="#52c41a" 
                  fillOpacity={0.5}
                  name="Resolved"
                />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        {/* Category Breakdown */}
        <Col xs={24} lg={8}>
          <Card title="Request Categories" extra={<Button icon={<EyeOutlined />} size="small">View All</Button>}>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={dashboardData.trends.categoryBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  dataKey="count"
                  label={({category, percent}) => `${category} ${(percent * 100).toFixed(0)}%`}
                >
                  {dashboardData.trends.categoryBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginBottom: '24px' }}>
        {/* Recent Activity */}
        <Col xs={24} lg={12}>
          <Card 
            title="Recent Activity" 
            extra={
              <Button 
                icon={<EyeOutlined />} 
                size="small"
                onClick={() => navigate('/it/support-requests')}
              >
                View All
              </Button>
            }
          >
            <Timeline>
              {dashboardData.recentActivity.map(activity => (
                <Timeline.Item 
                  key={activity.id}
                  dot={getActivityIcon(activity.type)}
                >
                  <div style={{ marginBottom: '8px' }}>
                    <Text strong>{activity.title}</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {activity.ticket} • {activity.employee} • {activity.technician}
                    </Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: '11px' }}>
                      {dayjs(activity.timestamp).fromNow()}
                    </Text>
                  </div>
                </Timeline.Item>
              ))}
            </Timeline>
          </Card>
        </Col>

        {/* Urgent Items */}
        <Col xs={24} lg={12}>
          <Card title="Urgent Items Requiring Attention" extra={<Badge count={dashboardData.urgentItems.length} />}>
            <List
              dataSource={dashboardData.urgentItems}
              renderItem={item => (
                <List.Item>
                  <List.Item.Meta
                    avatar={getUrgentItemIcon(item.type)}
                    title={
                      <Space>
                        <Text strong>{item.title}</Text>
                        <Tag color={item.priority === 'critical' ? 'red' : item.priority === 'high' ? 'orange' : 'yellow'}>
                          {item.priority?.toUpperCase()}
                        </Tag>
                      </Space>
                    }
                    description={
                      <div>
                        <div style={{ marginBottom: '4px' }}>{item.description}</div>
                        <Space>
                          <Text type="secondary" style={{ fontSize: '11px' }}>
                            Assigned to: {item.assignedTo}
                          </Text>
                          <Text type="secondary" style={{ fontSize: '11px' }}>
                            Due: {dayjs(item.deadline).format('MMM DD, HH:mm')}
                          </Text>
                        </Space>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginBottom: '24px' }}>
        {/* Team Performance */}
        <Col xs={24} lg={14}>
          <Card title="Team Performance Today">
            <Table 
              dataSource={dashboardData.teamPerformance}
              columns={teamColumns}
              pagination={false}
              size="small"
              rowKey="technician"
            />
          </Card>
        </Col>

        {/* Inventory Summary */}
        <Col xs={24} lg={10}>
          <Card 
            title="Inventory Summary" 
            extra={
              <Button 
                icon={<EyeOutlined />} 
                size="small"
                onClick={() => navigate('/it/inventory')}
              >
                Manage
              </Button>
            }
          >
            <Row gutter={8}>
              <Col span={12}>
                <Statistic
                  title="Total Items"
                  value={dashboardData.inventory.totalItems}
                  prefix={<InboxOutlined />}
                  valueStyle={{ fontSize: '16px' }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="Available"
                  value={dashboardData.inventory.availableItems}
                  prefix={<CheckCircleOutlined />}
                  valueStyle={{ fontSize: '16px', color: '#52c41a' }}
                />
              </Col>
            </Row>
            <Divider style={{ margin: '12px 0' }} />
            <Row gutter={8}>
              <Col span={12}>
                <Statistic
                  title="Assigned"
                  value={dashboardData.inventory.assignedItems}
                  prefix={<UserOutlined />}
                  valueStyle={{ fontSize: '16px', color: '#1890ff' }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="Low Stock"
                  value={dashboardData.inventory.lowStockItems}
                  prefix={<WarningOutlined />}
                  valueStyle={{ 
                    fontSize: '16px', 
                    color: dashboardData.inventory.lowStockItems > 0 ? '#ff4d4f' : '#52c41a' 
                  }}
                />
              </Col>
            </Row>
            <Divider style={{ margin: '12px 0' }} />
            <Statistic
              title="Total Value"
              value={`${(dashboardData.inventory.totalValue / 1000000).toFixed(1)}M`}
              suffix="XAF"
              prefix={<span style={{ fontSize: '14px' }}>💰</span>}
              valueStyle={{ fontSize: '18px', color: '#722ed1' }}
            />
            
            {dashboardData.inventory.lowStockItems > 0 && (
              <Alert
                message={`${dashboardData.inventory.lowStockItems} items need restocking`}
                type="warning"
                size="small"
                style={{ marginTop: '12px' }}
                action={
                  <Button size="small" onClick={() => navigate('/it/inventory')}>
                    View
                  </Button>
                }
              />
            )}
          </Card>
        </Col>
      </Row>

      {/* System Health */}
      <Row gutter={16}>
        <Col span={24}>
          <Card title="System Health & Monitoring">
            <Row gutter={16}>
              <Col xs={24} sm={12} md={6}>
                <Card size="small">
                  <Statistic
                    title="Server Uptime"
                    value={dashboardData.systemHealth.serverUptime}
                    suffix="%"
                    precision={1}
                    valueStyle={{ 
                      color: dashboardData.systemHealth.serverUptime > 99 ? '#52c41a' : '#faad14' 
                    }}
                    prefix={<DesktopOutlined />}
                  />
                  <Progress 
                    percent={dashboardData.systemHealth.serverUptime} 
                    size="small" 
                    strokeColor={dashboardData.systemHealth.serverUptime > 99 ? '#52c41a' : '#faad14'}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card size="small">
                  <Statistic
                    title="Network Latency"
                    value={dashboardData.systemHealth.networkLatency}
                    suffix="ms"
                    valueStyle={{ 
                      color: dashboardData.systemHealth.networkLatency < 20 ? '#52c41a' : '#faad14' 
                    }}
                    prefix={<WifiOutlined />}
                  />
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    Target: &lt;25ms
                  </Text>
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card size="small">
                  <Statistic
                    title="Storage Usage"
                    value={dashboardData.systemHealth.storageUsage}
                    suffix="%"
                    valueStyle={{ 
                      color: dashboardData.systemHealth.storageUsage < 80 ? '#52c41a' : '#faad14' 
                    }}
                    prefix={<InboxOutlined />}
                  />
                  <Progress 
                    percent={dashboardData.systemHealth.storageUsage} 
                    size="small" 
                    strokeColor={dashboardData.systemHealth.storageUsage < 80 ? '#52c41a' : '#faad14'}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card size="small">
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ marginBottom: '8px' }}>
                      <Text strong>Backup Status</Text>
                    </div>
                    <div style={{ fontSize: '24px', marginBottom: '4px' }}>
                      {dashboardData.systemHealth.backupStatus === 'success' ? 
                        <CheckCircleOutlined style={{ color: '#52c41a' }} /> :
                        <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
                      }
                    </div>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      Last: {dayjs(dashboardData.systemHealth.lastUpdate).fromNow()}
                    </Text>
                  </div>
                </Card>
              </Col>
            </Row>
            
            {dashboardData.systemHealth.securityAlerts > 0 && (
              <Alert
                message={`${dashboardData.systemHealth.securityAlerts} security alerts require attention`}
                type="error"
                showIcon
                style={{ marginTop: '16px' }}
                action={
                  <Button size="small" type="primary" danger>
                    Review Alerts
                  </Button>
                }
              />
            )}
          </Card>
        </Col>
      </Row>

      {/* Quick Actions */}
      <Card title="Quick Actions" style={{ marginTop: '16px' }}>
        <Space wrap>
          <Button 
            type="primary" 
            icon={<LaptopOutlined />}
            onClick={() => navigate('/it/support-requests')}
          >
            View All Requests
          </Button>
          <Button 
            icon={<PlusOutlined />}
            onClick={() => navigate('/it/support-requests')}
          >
            New Request
          </Button>
          <Button 
            icon={<InboxOutlined />}
            onClick={() => navigate('/it/inventory')}
          >
            Manage Inventory
          </Button>
          <Button 
            icon={<UserOutlined />}
            onClick={() => navigate('/it/support-requests')}
          >
            Assign Tickets
          </Button>
          <Button 
            icon={<WarningOutlined />}
            onClick={() => navigate('/it/support-requests')}
          >
            Critical Issues
          </Button>
          <Button 
            icon={<CalendarOutlined />}
          >
            Schedule Maintenance
          </Button>
        </Space>
      </Card>
    </div>
  );
};

export default ITDashboard;