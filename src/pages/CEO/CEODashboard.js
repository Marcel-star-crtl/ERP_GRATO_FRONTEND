import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Typography, Statistic, Spin, Space, Button } from 'antd';
import { 
  DashboardOutlined, 
  BarChartOutlined, 
  DollarOutlined,
  ProjectOutlined,
  TeamOutlined,
  FileTextOutlined,
  ShoppingCartOutlined,
  TrophyOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

const CEODashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    activeProjects: 0,
    employeeCount: 0,
    pendingApprovals: 0,
    cashFlow: 0,
    procurement: 0
  });

  useEffect(() => {
    fetchExecutiveStats();
  }, []);

  const fetchExecutiveStats = async () => {
    try {
      // Fetch executive-level statistics
      // const response = await api.get('/ceo/dashboard-stats');
      // setStats(response.data);
      
      // Temporary mock data
      setTimeout(() => {
        setStats({
          totalRevenue: 2500000,
          activeProjects: 15,
          employeeCount: 150,
          pendingApprovals: 8,
          cashFlow: 450000,
          procurement: 1200000
        });
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error fetching CEO stats:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <Card style={{ marginBottom: '24px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <Space direction="vertical" size="small">
          <Title level={2} style={{ margin: 0, color: 'white' }}>
            Executive Dashboard
          </Title>
          <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: '16px' }}>
            Company-wide overview and strategic insights
          </Text>
        </Space>
      </Card>

      <Row gutter={[24, 24]}>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="Total Revenue"
              value={stats.totalRevenue}
              prefix={<DollarOutlined />}
              suffix="XAF"
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="Active Projects"
              value={stats.activeProjects}
              prefix={<ProjectOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="Employee Count"
              value={stats.employeeCount}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="Pending Approvals"
              value={stats.pendingApprovals}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="Cash Flow"
              value={stats.cashFlow}
              prefix={<DollarOutlined />}
              suffix="XAF"
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="Procurement"
              value={stats.procurement}
              prefix={<ShoppingCartOutlined />}
              suffix="XAF"
              valueStyle={{ color: '#13c2c2' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[24, 24]} style={{ marginTop: '24px' }}>
        <Col xs={24} md={12}>
          <Card 
            title="Quick Access" 
            extra={<DashboardOutlined />}
          >
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              <Button 
                block 
                type="primary" 
                icon={<BarChartOutlined />}
                onClick={() => navigate('/ceo/reports')}
              >
                Company Reports
              </Button>
              <Button 
                block 
                icon={<ProjectOutlined />}
                onClick={() => navigate('/ceo/projects')}
              >
                Strategic Projects
              </Button>
              <Button 
                block 
                icon={<DollarOutlined />}
                onClick={() => navigate('/ceo/financial-overview')}
              >
                Financial Overview
              </Button>
              <Button 
                block 
                icon={<TrophyOutlined />}
                onClick={() => navigate('/ceo/performance')}
              >
                Company Performance
              </Button>
            </Space>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card 
            title="Recent Activity" 
            extra={<FileTextOutlined />}
          >
            <Text type="secondary">Activity feed coming soon...</Text>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default CEODashboard;