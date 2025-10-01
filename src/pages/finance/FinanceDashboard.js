import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Typography, 
  Statistic, 
  Table, 
  Tag, 
  Space, 
  Button,
  Alert,
  Spin,
  Progress,
  Timeline,
  Divider,
  Select,
  DatePicker,
  Input,
  Badge
} from 'antd';
import { 
  DollarOutlined, 
  FileTextOutlined, 
  CheckCircleOutlined, 
  ClockCircleOutlined,
  TrendingUpOutlined,
  TrendingDownOutlined,
  ExclamationCircleOutlined,
  SearchOutlined,
  FilterOutlined,
  EyeOutlined
} from '@ant-design/icons';
import { Line, Column, Pie } from '@ant-design/plots';
import { purchaseRequisitionAPI } from '../../services/purchaseRequisitionAPI';

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

const FinanceDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [filteredRequisitions, setFilteredRequisitions] = useState([]);
  const [filters, setFilters] = useState({
    status: 'all',
    urgency: 'all',
    department: 'all',
    searchTerm: ''
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (dashboardData?.pendingRequisitions) {
      applyFilters();
    }
  }, [dashboardData, filters]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await purchaseRequisitionAPI.getFinanceDashboardData();
      
      if (response.success) {
        setDashboardData(response.data);
      } else {
        console.error('Failed to fetch dashboard data:', response.message);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = dashboardData.pendingRequisitions || [];

    if (filters.status !== 'all') {
      filtered = filtered.filter(req => req.status === filters.status);
    }

    if (filters.urgency !== 'all') {
      filtered = filtered.filter(req => req.urgency === filters.urgency);
    }

    if (filters.department !== 'all') {
      filtered = filtered.filter(req => req.employee?.department === filters.department);
    }

    if (filters.searchTerm) {
      const searchTerm = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(req => 
        req.title?.toLowerCase().includes(searchTerm) ||
        req.requisitionNumber?.toLowerCase().includes(searchTerm) ||
        req.employee?.fullName?.toLowerCase().includes(searchTerm)
      );
    }

    setFilteredRequisitions(filtered);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const getStatusColor = (status) => {
    const statusColors = {
      'pending_finance_verification': 'orange',
      'pending_supply_chain_review': 'blue',
      'pending_buyer_assignment': 'purple',
      'pending_head_approval': 'yellow',
      'approved': 'green',
      'rejected': 'red',
      'in_procurement': 'cyan',
      'procurement_complete': 'lime'
    };
    return statusColors[status] || 'default';
  };

  const getUrgencyColor = (urgency) => {
    const urgencyColors = {
      'High': 'red',
      'Medium': 'orange',
      'Low': 'green'
    };
    return urgencyColors[urgency] || 'default';
  };

  const columns = [
    {
      title: 'Requisition',
      dataIndex: 'requisitionNumber',
      key: 'requisitionNumber',
      render: (text, record) => (
        <div>
          <Text strong>{text}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.title}
          </Text>
        </div>
      ),
      width: 200
    },
    {
      title: 'Requestor',
      dataIndex: ['employee', 'fullName'],
      key: 'employee',
      render: (text, record) => (
        <div>
          <Text>{text}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.employee?.department}
          </Text>
        </div>
      ),
      width: 180
    },
    {
      title: 'Amount',
      dataIndex: 'budgetXAF',
      key: 'budgetXAF',
      render: (amount) => (
        <Text strong style={{ color: '#1890ff' }}>
          {formatCurrency(amount)}
        </Text>
      ),
      sorter: (a, b) => (a.budgetXAF || 0) - (b.budgetXAF || 0),
      width: 120
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={getStatusColor(status)}>
          {status.replace(/_/g, ' ').toUpperCase()}
        </Tag>
      ),
      width: 150
    },
    {
      title: 'Urgency',
      dataIndex: 'urgency',
      key: 'urgency',
      render: (urgency) => (
        <Tag color={getUrgencyColor(urgency)}>
          {urgency}
        </Tag>
      ),
      width: 100
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => new Date(date).toLocaleDateString(),
      sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
      width: 100
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button 
            icon={<EyeOutlined />} 
            size="small" 
            onClick={() => window.open(`/finance/requisition/${record._id}`, '_blank')}
          >
            View
          </Button>
        </Space>
      ),
      width: 100
    }
  ];

  // Get unique departments for filter
  const departments = [...new Set(
    (dashboardData?.pendingRequisitions || [])
      .map(req => req.employee?.department)
      .filter(Boolean)
  )];

  if (loading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Spin size="large" />
        <div style={{ marginTop: '16px' }}>Loading Finance Dashboard...</div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div style={{ padding: '24px' }}>
        <Alert
          message="Error"
          description="Failed to load finance dashboard data"
          type="error"
          showIcon
        />
      </div>
    );
  }

  const { statistics, urgentItems, recentActivity, departmentBreakdown, monthlyTrends } = dashboardData;

  // Prepare chart data
  const trendData = monthlyTrends.map(trend => ({
    month: trend.month,
    requests: trend.totalRequests,
    value: trend.totalValue / 1000000, // Convert to millions
    approved: trend.approved,
    rejected: trend.rejected
  }));

  const departmentData = Object.entries(departmentBreakdown).map(([dept, data]) => ({
    department: dept,
    amount: data.totalAmount / 1000000, // Convert to millions
    count: data.count,
    pending: data.pending,
    approved: data.approved
  }));

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>Finance Dashboard</Title>
      
      {/* Statistics Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Portfolio Value"
              value={statistics.totalValue}
              precision={0}
              valueStyle={{ color: '#3f8600' }}
              prefix={<DollarOutlined />}
              formatter={(value) => formatCurrency(value)}
            />
          </Card>
        </Col>
        
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Pending Verification"
              value={statistics.pendingVerification}
              valueStyle={{ color: '#cf1322' }}
              prefix={<FileTextOutlined />}
            />
            <div style={{ marginTop: '8px' }}>
              <Text type="secondary">Requires Finance Review</Text>
            </div>
          </Card>
        </Col>
        
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Approved This Month"
              value={statistics.approvedThisMonth}
              valueStyle={{ color: '#3f8600' }}
              prefix={<CheckCircleOutlined />}
            />
            <div style={{ marginTop: '8px' }}>
              <Text type="secondary">Monthly Approvals</Text>
            </div>
          </Card>
        </Col>
        
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Rejected This Month"
              value={statistics.rejectedThisMonth}
              valueStyle={{ color: '#cf1322' }}
              prefix={<ExclamationCircleOutlined />}
            />
            <div style={{ marginTop: '8px' }}>
              <Text type="secondary">Monthly Rejections</Text>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Urgent Items Alert */}
      {urgentItems && urgentItems.length > 0 && (
        <Row style={{ marginBottom: '24px' }}>
          <Col span={24}>
            <Alert
              message={`${urgentItems.length} Urgent Items Require Attention`}
              description="High priority requisitions or items pending over 7 days"
              type="warning"
              showIcon
              action={
                <Button size="small" danger>
                  Review Urgent Items
                </Button>
              }
            />
          </Col>
        </Row>
      )}

      {/* Charts */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} lg={12}>
          <Card title="Monthly Trends" style={{ height: '400px' }}>
            <Line
              data={trendData}
              xField="month"
              yField="value"
              seriesField="type"
              height={300}
              smooth={true}
              point={{
                size: 5,
                shape: 'diamond'
              }}
              tooltip={{
                formatter: (datum) => {
                  return {
                    name: 'Value (Millions XAF)',
                    value: datum.value.toFixed(2)
                  };
                }
              }}
            />
          </Card>
        </Col>
        
        <Col xs={24} lg={12}>
          <Card title="Department Budget Distribution" style={{ height: '400px' }}>
            <Column
              data={departmentData}
              xField="department"
              yField="amount"
              height={300}
              columnStyle={{
                radius: [4, 4, 0, 0]
              }}
              tooltip={{
                formatter: (datum) => {
                  return {
                    name: 'Amount (Millions XAF)',
                    value: datum.amount.toFixed(2)
                  };
                }
              }}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters and Pending Requisitions */}
      <Card 
        title="Pending Requisitions" 
        extra={
          <Space>
            <Badge count={filteredRequisitions.length} showZero>
              <Button icon={<FilterOutlined />}>
                Filtered Results
              </Button>
            </Badge>
          </Space>
        }
      >
        {/* Filters */}
        <Row gutter={[16, 16]} style={{ marginBottom: '16px' }}>
          <Col xs={24} sm={12} md={6}>
            <Input
              placeholder="Search requisitions..."
              prefix={<SearchOutlined />}
              value={filters.searchTerm}
              onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Select
              placeholder="Filter by Status"
              style={{ width: '100%' }}
              value={filters.status}
              onChange={(value) => setFilters({ ...filters, status: value })}
            >
              <Option value="all">All Statuses</Option>
              <Option value="pending_finance_verification">Pending Verification</Option>
              <Option value="pending_supply_chain_review">Supply Chain Review</Option>
              <Option value="approved">Approved</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Select
              placeholder="Filter by Urgency"
              style={{ width: '100%' }}
              value={filters.urgency}
              onChange={(value) => setFilters({ ...filters, urgency: value })}
            >
              <Option value="all">All Urgency Levels</Option>
              <Option value="High">High</Option>
              <Option value="Medium">Medium</Option>
              <Option value="Low">Low</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Select
              placeholder="Filter by Department"
              style={{ width: '100%' }}
              value={filters.department}
              onChange={(value) => setFilters({ ...filters, department: value })}
            >
              <Option value="all">All Departments</Option>
              {departments.map(dept => (
                <Option key={dept} value={dept}>{dept}</Option>
              ))}
            </Select>
          </Col>
        </Row>

        {/* Table */}
        <Table
          columns={columns}
          dataSource={filteredRequisitions}
          rowKey="_id"
          pagination={{
            total: filteredRequisitions.length,
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`
          }}
          scroll={{ x: 1200 }}
          size="small"
        />
      </Card>

      {/* Recent Activity */}
      <Row gutter={[16, 16]} style={{ marginTop: '24px' }}>
        <Col xs={24} lg={12}>
          <Card title="Recent Finance Activity">
            <Timeline
              items={recentActivity.slice(0, 5).map(activity => ({
                children: (
                  <div>
                    <Text strong>{activity.requisitionNumber}</Text>
                    <br />
                    <Text>{activity.title}</Text>
                    <br />
                    <Text type="secondary">
                      {activity.action === 'approved' ? 'Approved' : 'Rejected'} by {activity.verifiedBy?.fullName} - {formatCurrency(activity.amount)}
                    </Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {new Date(activity.date).toLocaleDateString()}
                    </Text>
                  </div>
                ),
                color: activity.action === 'approved' ? 'green' : 'red'
              }))}
            />
          </Card>
        </Col>
        
        <Col xs={24} lg={12}>
          <Card title="Department Overview">
            <Row gutter={[16, 16]}>
              {Object.entries(departmentBreakdown).slice(0, 5).map(([dept, data]) => (
                <Col span={24} key={dept}>
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <Text>{dept}</Text>
                      <Text strong>{formatCurrency(data.totalAmount)}</Text>
                    </div>
                    <Progress
                      percent={(data.approved / data.count) * 100}
                      size="small"
                      format={(percent) => `${data.approved}/${data.count} approved`}
                    />
                  </div>
                </Col>
              ))}
            </Row>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default FinanceDashboard;