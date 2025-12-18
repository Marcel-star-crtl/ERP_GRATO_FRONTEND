import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Row,
  Col,
  Statistic,
  Button,
  Space,
  Alert,
  Tag,
  Table,
  Progress,
  Typography,
  Spin,
  Badge,
  Divider
} from 'antd';
import {
  TeamOutlined,
  UserAddOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  FolderOutlined,
  BarChartOutlined,
  CalendarOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import api from '../../services/api';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const HRDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [expiringContracts, setExpiringContracts] = useState([]);
  const [pendingProbation, setPendingProbation] = useState([]);
  const [recentEmployees, setRecentEmployees] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      const [statsRes, contractsRes, employeesRes] = await Promise.all([
        api.get('/hr/employees/statistics'),
        api.get('/hr/contracts/expiring'),
        api.get('/hr/employees?limit=5&sort=-createdAt')
      ]);

      setStats(statsRes.data.data);
      setExpiringContracts(contractsRes.data.data || []);
      setRecentEmployees(employeesRes.data.data || []);
      
      // Filter probation ending soon
      const probation = employeesRes.data.data?.filter(emp => 
        emp.employmentDetails?.employmentStatus === 'Probation' &&
        emp.employmentDetails?.probationEndDate &&
        dayjs(emp.employmentDetails.probationEndDate).diff(dayjs(), 'days') <= 30
      ) || [];
      setPendingProbation(probation);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'Active': 'green',
      'Probation': 'blue',
      'On Leave': 'orange',
      'Suspended': 'red',
      'Notice Period': 'purple',
      'Inactive': 'default',
      'Terminated': 'red'
    };
    return colors[status] || 'default';
  };

  const contractColumns = [
    {
      title: 'Employee',
      dataIndex: 'fullName',
      key: 'fullName',
      render: (name, record) => (
        <div>
          <Text strong>{name}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.department}
          </Text>
        </div>
      )
    },
    {
      title: 'Contract End Date',
      dataIndex: ['employmentDetails', 'contractEndDate'],
      key: 'endDate',
      render: (date) => (
        <div>
          <Text>{dayjs(date).format('MMM DD, YYYY')}</Text>
          <br />
          <Text type="danger" style={{ fontSize: '11px' }}>
            {dayjs(date).diff(dayjs(), 'days')} days remaining
          </Text>
        </div>
      ),
      sorter: (a, b) => 
        dayjs(a.employmentDetails?.contractEndDate).diff(
          dayjs(b.employmentDetails?.contractEndDate)
        )
    },
    {
      title: 'Contract Type',
      dataIndex: ['employmentDetails', 'contractType'],
      key: 'contractType',
      render: (type) => <Tag>{type}</Tag>
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Button 
          type="link" 
          size="small"
          onClick={() => navigate(`/hr/employees/${record._id}`)}
        >
          View
        </Button>
      )
    }
  ];

  if (loading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Spin size="large" />
        <div style={{ marginTop: '16px' }}>Loading HR Dashboard...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <Card style={{ marginBottom: '24px' }}>
        <Row align="middle" justify="space-between">
          <Col>
            <Title level={2} style={{ margin: 0 }}>
              <TeamOutlined /> HR Management Dashboard
            </Title>
            <Text type="secondary">Manage employees, contracts, and HR operations</Text>
          </Col>
          <Col>
            <Space>
              <Button
                type="primary"
                icon={<UserAddOutlined />}
                onClick={() => navigate('/hr/employees/new')}
                size="large"
              >
                Add Employee
              </Button>
              <Button
                icon={<BarChartOutlined />}
                onClick={() => navigate('/hr/reports')}
              >
                Reports
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Statistics Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Employees"
              value={stats?.totalEmployees || 0}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
            <Button 
              type="link" 
              size="small"
              onClick={() => navigate('/hr/employees')}
              style={{ padding: 0, marginTop: '8px' }}
            >
              View All →
            </Button>
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Active Employees"
              value={stats?.activeEmployees || 0}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {stats?.inactiveEmployees || 0} inactive
            </Text>
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="On Probation"
              value={stats?.onProbation || 0}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
            {pendingProbation.length > 0 && (
              <Text type="warning" style={{ fontSize: '12px' }}>
                {pendingProbation.length} ending soon
              </Text>
            )}
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Contracts Expiring"
              value={expiringContracts.length}
              prefix={<WarningOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
            <Text type="secondary" style={{ fontSize: '12px' }}>
              Next 30 days
            </Text>
          </Card>
        </Col>
      </Row>

      {/* Additional Statistics */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="On Leave"
              value={stats?.onLeave || 0}
              prefix={<CalendarOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Notice Period"
              value={stats?.noticePeriod || 0}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Pending Documents"
              value={stats?.pendingDocuments || 0}
              prefix={<FolderOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Suspended"
              value={stats?.suspended || 0}
              prefix={<WarningOutlined />}
              valueStyle={{ color: '#f5222d' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Department Distribution */}
      {stats?.departmentDistribution && (
        <Card 
          title="Department Distribution" 
          style={{ marginBottom: '24px' }}
          extra={
            <Button 
              type="link" 
              onClick={() => navigate('/hr/reports?view=departments')}
            >
              View Details
            </Button>
          }
        >
          <Row gutter={[16, 16]}>
            {Object.entries(stats.departmentDistribution).map(([dept, count]) => (
              <Col xs={24} sm={12} md={8} lg={6} key={dept}>
                <Card size="small">
                  <Statistic
                    title={dept}
                    value={count}
                    valueStyle={{ fontSize: '24px' }}
                  />
                  <Progress
                    percent={Math.round((count / stats.totalEmployees) * 100)}
                    size="small"
                    showInfo={false}
                  />
                </Card>
              </Col>
            ))}
          </Row>
        </Card>
      )}

      {/* Alerts Section */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        {expiringContracts.length > 0 && (
          <Col xs={24} lg={12}>
            <Alert
              message={`${expiringContracts.length} Contracts Expiring Soon`}
              description="Review and process contract renewals"
              type="warning"
              showIcon
              icon={<WarningOutlined />}
              action={
                <Button 
                  size="small" 
                  type="primary" 
                  danger
                  onClick={() => navigate('/hr/contracts?filter=expiring')}
                >
                  Review
                </Button>
              }
            />
          </Col>
        )}

        {pendingProbation.length > 0 && (
          <Col xs={24} lg={12}>
            <Alert
              message={`${pendingProbation.length} Probation Periods Ending`}
              description="Evaluate employees and confirm employment"
              type="info"
              showIcon
              icon={<ClockCircleOutlined />}
              action={
                <Button 
                  size="small"
                  onClick={() => navigate('/hr/employees?status=Probation')}
                >
                  Review
                </Button>
              }
            />
          </Col>
        )}

        {stats?.pendingDocuments > 0 && (
          <Col xs={24} lg={12}>
            <Alert
              message={`${stats.pendingDocuments} Employees Missing Documents`}
              description="Complete required documentation"
              type="warning"
              showIcon
              icon={<FolderOutlined />}
              action={
                <Button 
                  size="small"
                  onClick={() => navigate('/hr/documents?status=pending')}
                >
                  View
                </Button>
              }
            />
          </Col>
        )}
      </Row>

      {/* Expiring Contracts Table */}
      {expiringContracts.length > 0 && (
        <Card 
          title={
            <Space>
              <FileTextOutlined />
              <span>Contracts Expiring (Next 30 Days)</span>
              <Badge count={expiringContracts.length} />
            </Space>
          }
          style={{ marginBottom: '24px' }}
          extra={
            <Button 
              type="link"
              onClick={() => navigate('/hr/contracts')}
            >
              View All Contracts
            </Button>
          }
        >
          <Table
            columns={contractColumns}
            dataSource={expiringContracts}
            rowKey="_id"
            pagination={false}
            size="small"
          />
        </Card>
      )}

      {/* Recent Employees */}
      {recentEmployees.length > 0 && (
        <Card 
          title="Recently Added Employees"
          extra={
            <Button 
              type="link"
              onClick={() => navigate('/hr/employees')}
            >
              View All
            </Button>
          }
        >
          <Row gutter={[16, 16]}>
            {recentEmployees.map(emp => (
              <Col xs={24} sm={12} md={8} key={emp._id}>
                <Card 
                  size="small" 
                  hoverable
                  onClick={() => navigate(`/hr/employees/${emp._id}`)}
                >
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text strong>{emp.fullName}</Text>
                      <Tag color={getStatusColor(emp.employmentDetails?.employmentStatus)}>
                        {emp.employmentDetails?.employmentStatus}
                      </Tag>
                    </div>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {emp.department} - {emp.position}
                    </Text>
                    <Text type="secondary" style={{ fontSize: '11px' }}>
                      Started: {dayjs(emp.employmentDetails?.startDate).format('MMM DD, YYYY')}
                    </Text>
                  </Space>
                </Card>
              </Col>
            ))}
          </Row>
        </Card>
      )}

      {/* Quick Actions */}
      <Card title="Quick Actions" style={{ marginTop: '24px' }}>
        <Space wrap>
          <Button 
            icon={<UserAddOutlined />}
            onClick={() => navigate('/hr/employees/new')}
          >
            Add Employee
          </Button>
          <Button 
            icon={<TeamOutlined />}
            onClick={() => navigate('/hr/employees')}
          >
            Manage Employees
          </Button>
          <Button 
            icon={<FileTextOutlined />}
            onClick={() => navigate('/hr/contracts')}
          >
            Contract Management
          </Button>
          <Button 
            icon={<FolderOutlined />}
            onClick={() => navigate('/hr/documents')}
          >
            Document Manager
          </Button>
          <Button 
            icon={<BarChartOutlined />}
            onClick={() => navigate('/hr/reports')}
          >
            Generate Reports
          </Button>
          <Button 
            icon={<SafetyCertificateOutlined />}
            onClick={() => navigate('/hr/sick-leave')}
          >
            Leave Management
          </Button>
        </Space>
      </Card>
    </div>
  );
};

export default HRDashboard;