import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Select,
  Typography,
  message,
  Spin,
  DatePicker,
  Space,
  Button,
  Statistic
} from 'antd';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import {
  BarChartOutlined,
  DollarOutlined,
  RiseOutlined,
  DownloadOutlined
} from '@ant-design/icons';
import api from '../../services/api';

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

const BudgetAnalytics = () => {
  const [loading, setLoading] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [filters, setFilters] = useState({
    fiscalYear: new Date().getFullYear(),
    department: null,
    budgetType: null
  });

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658'];

  useEffect(() => {
    fetchData();
  }, [filters]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams();
      if (filters.fiscalYear) params.append('fiscalYear', filters.fiscalYear);
      if (filters.department) params.append('department', filters.department);
      if (filters.budgetType) params.append('budgetType', filters.budgetType);

      const [dashboardResponse, reportResponse] = await Promise.all([
        api.get(`/budget-codes/dashboard?${params}`),
        api.get(`/budget-codes/reports/utilization?${params}`)
      ]);

      if (dashboardResponse.data.success) {
        setDashboardData(dashboardResponse.data.data);
      }

      if (reportResponse.data.success) {
        setReportData(reportResponse.data.data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      message.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const prepareDepartmentData = () => {
    if (!reportData?.byDepartment) return [];
    
    return Object.keys(reportData.byDepartment).map(dept => ({
      name: dept,
      budget: reportData.byDepartment[dept].budget,
      used: reportData.byDepartment[dept].used,
      remaining: reportData.byDepartment[dept].remaining,
      utilization: reportData.byDepartment[dept].utilization
    }));
  };

  const prepareBudgetTypeData = () => {
    if (!reportData?.byBudgetType) return [];
    
    return Object.keys(reportData.byBudgetType).map(type => ({
      name: type,
      value: reportData.byBudgetType[type].budget
    }));
  };

  const prepareUtilizationTrendData = () => {
    if (!dashboardData?.budgetCodes) return [];
    
    const sortedCodes = [...dashboardData.budgetCodes].sort((a, b) => {
      const aUtil = (a.used / a.budget) * 100;
      const bUtil = (b.used / b.budget) * 100;
      return bUtil - aUtil;
    });

    return sortedCodes.slice(0, 10).map(code => ({
      name: code.code,
      utilization: Math.round((code.used / code.budget) * 100),
      budget: code.budget,
      used: code.used
    }));
  };

  const prepareSpendingDistribution = () => {
    if (!reportData?.byDepartment) return [];
    
    return Object.keys(reportData.byDepartment).map(dept => ({
      name: dept,
      value: reportData.byDepartment[dept].used
    }));
  };

  if (loading && !dashboardData) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Spin size="large" />
        <br />
        <Text>Loading analytics...</Text>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <Title level={2} style={{ margin: 0 }}>
          <BarChartOutlined /> Budget Analytics
        </Title>
        <Space>
          <Button
            icon={<DownloadOutlined />}
            onClick={() => message.info('Export feature coming soon')}
          >
            Export Report
          </Button>
        </Space>
      </div>

      {/* Filters */}
      <Card style={{ marginBottom: '24px' }}>
        <Row gutter={16}>
          <Col span={8}>
            <Text strong>Fiscal Year:</Text>
            <Select
              style={{ width: '100%', marginTop: '8px' }}
              value={filters.fiscalYear}
              onChange={(value) => setFilters({ ...filters, fiscalYear: value })}
            >
              <Option value={2024}>2024</Option>
              <Option value={2025}>2025</Option>
              <Option value={2026}>2026</Option>
            </Select>
          </Col>
          <Col span={8}>
            <Text strong>Department:</Text>
            <Select
              style={{ width: '100%', marginTop: '8px' }}
              value={filters.department}
              onChange={(value) => setFilters({ ...filters, department: value })}
              allowClear
              placeholder="All Departments"
            >
              <Option value="IT">IT</Option>
              <Option value="Finance">Finance</Option>
              <Option value="HR">HR</Option>
              <Option value="Operations">Operations</Option>
              <Option value="Sales">Sales</Option>
              <Option value="Engineering">Engineering</Option>
            </Select>
          </Col>
          <Col span={8}>
            <Text strong>Budget Type:</Text>
            <Select
              style={{ width: '100%', marginTop: '8px' }}
              value={filters.budgetType}
              onChange={(value) => setFilters({ ...filters, budgetType: value })}
              allowClear
              placeholder="All Types"
            >
              <Option value="OPEX">OPEX</Option>
              <Option value="CAPEX">CAPEX</Option>
              <Option value="PROJECT">PROJECT</Option>
              <Option value="OPERATIONAL">OPERATIONAL</Option>
            </Select>
          </Col>
        </Row>
      </Card>

      {/* Summary Statistics */}
      {reportData && (
        <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
          <Col xs={24} sm={6}>
            <Card>
              <Statistic
                title="Total Budget"
                value={reportData.summary.totalBudget}
                prefix="XAF"
                formatter={value => (value / 1000000).toFixed(1)}
                suffix="M"
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={6}>
            <Card>
              <Statistic
                title="Total Spent"
                value={reportData.summary.totalUsed}
                prefix="XAF"
                formatter={value => (value / 1000000).toFixed(1)}
                suffix="M"
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={6}>
            <Card>
              <Statistic
                title="Remaining"
                value={reportData.summary.totalRemaining}
                prefix="XAF"
                formatter={value => (value / 1000000).toFixed(1)}
                suffix="M"
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={6}>
            <Card>
              <Statistic
                title="Avg Utilization"
                value={reportData.summary.averageUtilization}
                suffix="%"
                prefix={<RiseOutlined />}
                valueStyle={{
                  color: reportData.summary.averageUtilization >= 90 ? '#f5222d' :
                         reportData.summary.averageUtilization >= 75 ? '#faad14' : '#52c41a'
                }}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* Charts Row 1 */}
      <Row gutter={[16, 16]} style={{ marginBottom: '16px' }}>
        {/* Department Budget Comparison */}
        <Col xs={24} lg={12}>
          <Card title="Budget by Department" loading={loading}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={prepareDepartmentData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip formatter={(value) => `XAF ${value.toLocaleString()}`} />
                <Legend />
                <Bar dataKey="budget" fill="#8884d8" name="Total Budget" />
                <Bar dataKey="used" fill="#82ca9d" name="Used" />
                <Bar dataKey="remaining" fill="#ffc658" name="Remaining" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        {/* Budget Type Distribution */}
        <Col xs={24} lg={12}>
          <Card title="Budget Distribution by Type" loading={loading}>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={prepareBudgetTypeData()}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {prepareBudgetTypeData().map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `XAF ${value.toLocaleString()}`} />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* Charts Row 2 */}
      <Row gutter={[16, 16]} style={{ marginBottom: '16px' }}>
        {/* Top Utilizers */}
        <Col xs={24} lg={12}>
          <Card title="Top 10 Budget Code Utilization" loading={loading}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={prepareUtilizationTrendData()} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 100]} />
                <YAxis dataKey="name" type="category" width={100} />
                <Tooltip />
                <Legend />
                <Bar dataKey="utilization" fill="#ff7c7c" name="Utilization %" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        {/* Spending Distribution */}
        <Col xs={24} lg={12}>
          <Card title="Spending Distribution by Department" loading={loading}>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={prepareSpendingDistribution()}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: XAF ${(value / 1000000).toFixed(1)}M`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {prepareSpendingDistribution().map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `XAF ${value.toLocaleString()}`} />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* Charts Row 3 */}
      <Row gutter={[16, 16]}>
        {/* Department Utilization Trend */}
        <Col xs={24}>
          <Card title="Department Budget Utilization" loading={loading}>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={prepareDepartmentData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="budget" stackId="1" stroke="#8884d8" fill="#8884d8" name="Total Budget" />
                <Area type="monotone" dataKey="used" stackId="2" stroke="#82ca9d" fill="#82ca9d" name="Used" />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default BudgetAnalytics;