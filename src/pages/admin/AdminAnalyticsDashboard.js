import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Typography,
  Tag,
  Space,
  Button,
  DatePicker,
  Select,
  Spin,
  message,
  Progress,
  Tooltip,
  Alert
} from 'antd';
import {
  DashboardOutlined,
  DollarOutlined,
  UserOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  TrendingUpOutlined,
  BarChartOutlined,
  FileTextOutlined,
  TeamOutlined,
  CalendarOutlined,
  ExclamationCircleOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import moment from 'moment';
import api from '../../services/api';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

const AdminAnalyticsDashboard = () => {
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState([
    moment().subtract(30, 'days'),
    moment()
  ]);
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [analytics, setAnalytics] = useState({
    overview: {
      totalRequests: 0,
      totalAmount: 0,
      pendingRequests: 0,
      pendingAmount: 0,
      approvedRequests: 0,
      approvedAmount: 0,
      rejectedRequests: 0,
      rejectedAmount: 0,
      averageProcessingTime: 0,
      approvalRate: 0
    },
    departmentBreakdown: [],
    statusDistribution: [],
    monthlyTrends: [],
    topRequesters: [],
    urgencyDistribution: []
  });

  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    fetchAnalytics();
    fetchDepartments();
  }, [dateRange, selectedDepartment]);

  const fetchDepartments = async () => {
    try {
      const response = await api.get('/api/users/departments');
      if (response.data.success) {
        setDepartments(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      
      const params = {
        startDate: dateRange[0].format('YYYY-MM-DD'),
        endDate: dateRange[1].format('YYYY-MM-DD'),
        department: selectedDepartment === 'all' ? undefined : selectedDepartment
      };

      const response = await api.get('/api/cash-requests/admin/analytics', { params });
      
      if (response.data.success) {
        setAnalytics(response.data.data);
      } else {
        message.error('Failed to fetch analytics data');
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      message.error('Failed to load analytics data');
      
      // Set default empty analytics to prevent UI crashes
      setAnalytics({
        overview: {
          totalRequests: 0,
          totalAmount: 0,
          pendingRequests: 0,
          pendingAmount: 0,
          approvedRequests: 0,
          approvedAmount: 0,
          rejectedRequests: 0,
          rejectedAmount: 0,
          averageProcessingTime: 0,
          approvalRate: 0
        },
        departmentBreakdown: [],
        statusDistribution: [],
        monthlyTrends: [],
        topRequesters: [],
        urgencyDistribution: []
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusTag = (status) => {
    const statusMap = {
      'pending_supervisor': { color: 'orange', text: 'Pending Supervisor' },
      'pending_finance': { color: 'blue', text: 'Pending Finance' },
      'approved': { color: 'green', text: 'Approved' },
      'denied': { color: 'red', text: 'Denied' },
      'disbursed': { color: 'cyan', text: 'Disbursed' },
      'completed': { color: 'green', text: 'Completed' }
    };

    const config = statusMap[status] || { color: 'default', text: status };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const departmentColumns = [
    {
      title: 'Department',
      dataIndex: 'department',
      key: 'department',
      render: (dept) => <Text strong>{dept || 'Unknown'}</Text>
    },
    {
      title: 'Total Requests',
      dataIndex: 'totalRequests',
      key: 'totalRequests',
      sorter: (a, b) => a.totalRequests - b.totalRequests
    },
    {
      title: 'Total Amount',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (amount) => `XAF ${(amount || 0).toLocaleString()}`,
      sorter: (a, b) => a.totalAmount - b.totalAmount
    },
    {
      title: 'Approval Rate',
      dataIndex: 'approvalRate',
      key: 'approvalRate',
      render: (rate) => (
        <Progress 
          percent={Math.round(rate || 0)} 
          size="small" 
          status={rate >= 80 ? 'success' : rate >= 60 ? 'normal' : 'exception'}
        />
      ),
      sorter: (a, b) => a.approvalRate - b.approvalRate
    },
    {
      title: 'Avg Processing Time',
      dataIndex: 'avgProcessingTime',
      key: 'avgProcessingTime',
      render: (time) => `${Math.round(time || 0)} hours`
    }
  ];

  const topRequestersColumns = [
    {
      title: 'Employee',
      dataIndex: 'employeeName',
      key: 'employeeName',
      render: (name) => <Text strong>{name || 'Unknown'}</Text>
    },
    {
      title: 'Department',
      dataIndex: 'department',
      key: 'department',
      render: (dept) => <Tag color="blue">{dept || 'Unknown'}</Tag>
    },
    {
      title: 'Requests',
      dataIndex: 'requestCount',
      key: 'requestCount',
      sorter: (a, b) => a.requestCount - b.requestCount
    },
    {
      title: 'Total Amount',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (amount) => `XAF ${(amount || 0).toLocaleString()}`,
      sorter: (a, b) => a.totalAmount - b.totalAmount
    },
    {
      title: 'Success Rate',
      dataIndex: 'successRate',
      key: 'successRate',
      render: (rate) => (
        <Progress 
          percent={Math.round(rate || 0)} 
          size="small" 
          status={rate >= 80 ? 'success' : rate >= 60 ? 'normal' : 'exception'}
        />
      )
    }
  ];

  if (loading && Object.keys(analytics.overview).length === 0) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Spin size="large" />
        <div style={{ marginTop: '16px' }}>Loading analytics dashboard...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <Title level={2} style={{ margin: 0 }}>
            <DashboardOutlined /> Petty Cash Analytics Dashboard
          </Title>
          <Space>
            <RangePicker
              value={dateRange}
              onChange={(dates) => setDateRange(dates)}
              format="YYYY-MM-DD"
            />
            <Select
              value={selectedDepartment}
              onChange={setSelectedDepartment}
              style={{ width: 200 }}
              placeholder="Select Department"
            >
              <Option value="all">All Departments</Option>
              {departments.map(dept => (
                <Option key={dept} value={dept}>{dept}</Option>
              ))}
            </Select>
            <Button 
              icon={<ReloadOutlined />} 
              onClick={fetchAnalytics}
              loading={loading}
            >
              Refresh
            </Button>
          </Space>
        </div>

        {/* Overview Statistics */}
        <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
          <Col span={6}>
            <Card>
              <Statistic
                title="Total Requests"
                value={analytics.overview.totalRequests}
                prefix={<FileTextOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Total Amount"
                value={analytics.overview.totalAmount}
                prefix="XAF"
                formatter={(value) => value?.toLocaleString() || '0'}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Pending Requests"
                value={analytics.overview.pendingRequests}
                prefix={<ClockCircleOutlined />}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Approval Rate"
                value={analytics.overview.approvalRate}
                suffix="%"
                prefix={<CheckCircleOutlined />}
                valueStyle={{ 
                  color: analytics.overview.approvalRate >= 80 ? '#52c41a' : 
                         analytics.overview.approvalRate >= 60 ? '#faad14' : '#f5222d' 
                }}
              />
            </Card>
          </Col>
        </Row>

        {/* Status Breakdown */}
        <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
          <Col span={6}>
            <Card size="small">
              <Statistic
                title="Approved"
                value={analytics.overview.approvedRequests}
                valueStyle={{ color: '#52c41a', fontSize: '18px' }}
                suffix={<Text type="secondary">({analytics.overview.approvedAmount?.toLocaleString()} XAF)</Text>}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic
                title="Rejected"
                value={analytics.overview.rejectedRequests}
                valueStyle={{ color: '#f5222d', fontSize: '18px' }}
                suffix={<Text type="secondary">({analytics.overview.rejectedAmount?.toLocaleString()} XAF)</Text>}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic
                title="Pending Finance"
                value={analytics.overview.pendingRequests}
                valueStyle={{ color: '#1890ff', fontSize: '18px' }}
                suffix={<Text type="secondary">({analytics.overview.pendingAmount?.toLocaleString()} XAF)</Text>}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic
                title="Avg Processing Time"
                value={Math.round(analytics.overview.averageProcessingTime || 0)}
                suffix="hours"
                valueStyle={{ color: '#722ed1', fontSize: '18px' }}
              />
            </Card>
          </Col>
        </Row>

        {/* Department Performance */}
        <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
          <Col span={24}>
            <Card
              title={
                <Space>
                  <TeamOutlined />
                  Department Performance Analysis
                </Space>
              }
              extra={
                <Tooltip title="Shows cash request performance by department">
                  <ExclamationCircleOutlined />
                </Tooltip>
              }
            >
              <Table
                columns={departmentColumns}
                dataSource={analytics.departmentBreakdown || []}
                loading={loading}
                rowKey="department"
                pagination={{ pageSize: 10 }}
                size="small"
              />
            </Card>
          </Col>
        </Row>

        {/* Top Requesters */}
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Card
              title={
                <Space>
                  <UserOutlined />
                  Top Requesters Analysis
                </Space>
              }
              extra={
                <Tooltip title="Shows employees with highest request frequency and amounts">
                  <ExclamationCircleOutlined />
                </Tooltip>
              }
            >
              <Table
                columns={topRequestersColumns}
                dataSource={analytics.topRequesters || []}
                loading={loading}
                rowKey="employeeId"
                pagination={{ pageSize: 10 }}
                size="small"
              />
            </Card>
          </Col>
        </Row>

        {/* Data Availability Notice */}
        {analytics.overview.totalRequests === 0 && !loading && (
          <Alert
            message="No Data Available"
            description="No cash requests found for the selected time period and filters. Try adjusting your date range or department filter."
            type="info"
            showIcon
            style={{ marginTop: '24px' }}
          />
        )}
      </Card>
    </div>
  );
};

export default AdminAnalyticsDashboard;
