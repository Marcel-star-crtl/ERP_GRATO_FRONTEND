import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Typography,
  Space,
  Button,
  Progress,
  Timeline,
  Table,
  Tag,
  Alert,
  Spin,
  message,
  Avatar,
  List,
  Badge,
  Tooltip,
  Divider
} from 'antd';
import {
  DashboardOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  TrendingUpOutlined,
  CalendarOutlined,
  DollarOutlined,
  ShopOutlined,
  BellOutlined,
  PlusOutlined,
  EyeOutlined,
  WarningOutlined,
  StarOutlined,
  TeamOutlined,
  SafetyOutlined,
  ToolOutlined,
  BuildOutlined,
  TruckOutlined,
  GlobalOutlined,
  HomeOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import api from '../../services/api';

const { Title, Text, Paragraph } = Typography;

const SupplierDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [recentInvoices, setRecentInvoices] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const navigate = useNavigate();
  const { user } = useSelector(state => state.auth);

  // Fetch dashboard data
  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Mock API calls - replace with your actual API endpoints
      const [dashboardResponse, invoicesResponse, notificationsResponse] = await Promise.all([
        // Replace with actual API calls
        new Promise(resolve => setTimeout(() => resolve({
          data: {
            success: true,
            data: {
              totalInvoices: 15,
              pendingInvoices: 3,
              approvedInvoices: 10,
              rejectedInvoices: 2,
              totalValue: 125000,
              pendingValue: 18500,
              averageProcessingTime: 3.2,
              approvalRate: 83.3,
              contractInfo: {
                contractNumber: 'CONT-2023-001',
                contractValue: 250000,
                remainingValue: 125000,
                paymentTerms: 'Net 30',
                expiryDate: '2024-12-31'
              },
              monthlyStats: [
                { month: 'Jan', submitted: 2, approved: 2, value: 15000 },
                { month: 'Feb', submitted: 3, approved: 2, value: 22000 },
                { month: 'Mar', submitted: 4, approved: 3, value: 28000 },
                { month: 'Apr', submitted: 3, approved: 3, value: 35000 },
                { month: 'May', submitted: 3, approved: 0, value: 18500 }
              ]
            }
          }
        }), 1500)),
        
        new Promise(resolve => setTimeout(() => resolve({
          data: {
            success: true,
            data: [
              {
                _id: 'INV001',
                invoiceNumber: 'SUP-2024-005',
                amount: 8500,
                status: 'pending_approval',
                submittedDate: '2024-05-20T10:30:00Z',
                supplierType: 'Operations'
              },
              {
                _id: 'INV002',
                invoiceNumber: 'SUP-2024-004',
                amount: 12500,
                status: 'approved',
                submittedDate: '2024-05-15T14:20:00Z',
                supplierType: 'HSE'
              },
              {
                _id: 'INV003',
                invoiceNumber: 'SUP-2024-003',
                amount: 6000,
                status: 'rejected',
                submittedDate: '2024-05-10T09:15:00Z',
                supplierType: 'General'
              }
            ]
          }
        }), 1200)),
        
        new Promise(resolve => setTimeout(() => resolve({
          data: {
            success: true,
            data: [
              {
                id: 1,
                type: 'approval',
                title: 'Invoice SUP-2024-005 approved by Level 1',
                description: 'Your Operations invoice has been approved by the Operations Manager',
                time: '2 hours ago',
                read: false
              },
              {
                id: 2,
                type: 'reminder',
                title: 'Contract renewal reminder',
                description: 'Your contract expires in 7 months. Consider renewal discussions.',
                time: '1 day ago',
                read: false
              },
              {
                id: 3,
                type: 'payment',
                title: 'Payment processed',
                description: 'Invoice SUP-2024-002 payment of $15,000 has been processed',
                time: '3 days ago',
                read: true
              }
            ]
          }
        }), 800))
      ]);

      setDashboardData(dashboardResponse.data.data);
      setRecentInvoices(invoicesResponse.data.data);
      setNotifications(notificationsResponse.data.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      message.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const getStatusTag = (status) => {
    const statusMap = {
      'pending_review': { color: 'orange', text: 'Under Review', icon: <ClockCircleOutlined /> },
      'pending_approval': { color: 'blue', text: 'Pending Approval', icon: <ClockCircleOutlined /> },
      'approved': { color: 'green', text: 'Approved', icon: <CheckCircleOutlined /> },
      'rejected': { color: 'red', text: 'Rejected', icon: <CloseCircleOutlined /> },
      'paid': { color: 'purple', text: 'Paid', icon: <CheckCircleOutlined /> }
    };
    
    const config = statusMap[status] || { color: 'default', text: status };
    return <Tag color={config.color} icon={config.icon}>{config.text}</Tag>;
  };

  const getSupplierTypeIcon = (type) => {
    const iconMap = {
      'HSE': <SafetyOutlined style={{ color: '#52c41a' }} />,
      'Refurbishment': <ToolOutlined style={{ color: '#1890ff' }} />,
      'Project': <BuildOutlined style={{ color: '#722ed1' }} />,
      'Operations': <TruckOutlined style={{ color: '#fa8c16' }} />,
      'Diesel': <GlobalOutlined style={{ color: '#eb2f96' }} />,
      'Supply Chain': <ShopOutlined style={{ color: '#13c2c2' }} />,
      'HR/Admin': <TeamOutlined style={{ color: '#52c41a' }} />,
      'General': <HomeOutlined style={{ color: '#595959' }} />
    };
    return iconMap[type] || <FileTextOutlined />;
  };

  const getNotificationIcon = (type) => {
    const iconMap = {
      'approval': <CheckCircleOutlined style={{ color: '#52c41a' }} />,
      'rejection': <CloseCircleOutlined style={{ color: '#ff4d4f' }} />,
      'reminder': <BellOutlined style={{ color: '#faad14' }} />,
      'payment': <DollarOutlined style={{ color: '#722ed1' }} />,
      'info': <BellOutlined style={{ color: '#1890ff' }} />
    };
    return iconMap[type] || <BellOutlined />;
  };

  const recentInvoicesColumns = [
    {
      title: 'Invoice Number',
      dataIndex: 'invoiceNumber',
      key: 'invoiceNumber',
      render: (text) => <Text code>{text}</Text>
    },
    {
      title: 'Type',
      dataIndex: 'supplierType',
      key: 'supplierType',
      render: (type) => (
        <Tag icon={getSupplierTypeIcon(type)} color="blue" size="small">
          {type}
        </Tag>
      )
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount) => <Text strong>${amount.toLocaleString()}</Text>
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => getStatusTag(status)
    },
    {
      title: 'Submitted',
      dataIndex: 'submittedDate',
      key: 'submittedDate',
      render: (date) => (
        <Text type="secondary" style={{ fontSize: '12px' }}>
          {new Date(date).toLocaleDateString('en-GB')}
        </Text>
      )
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Button
          size="small"
          icon={<EyeOutlined />}
          onClick={() => navigate(`/supplier/invoices/${record._id}`)}
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
        <div style={{ marginTop: '16px' }}>Loading dashboard...</div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div style={{ padding: '24px' }}>
        <Alert
          message="Error Loading Dashboard"
          description="Unable to load dashboard data. Please try again."
          type="error"
          showIcon
          action={
            <Button size="small" onClick={fetchDashboardData}>
              Retry
            </Button>
          }
        />
      </div>
    );
  }

  const unreadNotifications = notifications.filter(n => !n.read).length;

  return (
    <div style={{ padding: '24px', background: '#f0f2f5', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Space direction="vertical" size="small">
              <Title level={2} style={{ margin: 0 }}>
                <DashboardOutlined /> Welcome back, {user?.companyName || user?.fullName}
              </Title>
              <Text type="secondary" style={{ fontSize: '16px' }}>
                Here's an overview of your supplier account performance
              </Text>
            </Space>
          </Col>
          <Col>
            <Space>
              <Badge count={unreadNotifications} size="small">
                <Button icon={<BellOutlined />} type="text">
                  Notifications
                </Button>
              </Badge>
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                onClick={() => navigate('/supplier/portal')}
                size="large"
              >
                Submit Invoice
              </Button>
            </Space>
          </Col>
        </Row>
      </div>

      {/* Key Metrics */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Invoices"
              value={dashboardData.totalInvoices}
              prefix={<FileTextOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Pending Review"
              value={dashboardData.pendingInvoices}
              prefix={<ClockCircleOutlined style={{ color: '#faad14' }} />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Approved"
              value={dashboardData.approvedInvoices}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Success Rate"
              value={dashboardData.approvalRate}
              suffix="%"
              prefix={<StarOutlined style={{ color: '#722ed1' }} />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Financial Overview */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} lg={12}>
          <Card title="Financial Overview" extra={<DollarOutlined />}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Row gutter={16}>
                <Col span={12}>
                  <Statistic
                    title="Total Invoice Value"
                    value={dashboardData.totalValue}
                    prefix="$"
                    precision={0}
                    valueStyle={{ fontSize: '20px' }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="Pending Value"
                    value={dashboardData.pendingValue}
                    prefix="$"
                    precision={0}
                    valueStyle={{ fontSize: '20px', color: '#faad14' }}
                  />
                </Col>
              </Row>
              <Divider style={{ margin: '12px 0' }} />
              <Row gutter={16}>
                <Col span={12}>
                  <Text type="secondary">Average Processing Time</Text>
                  <div>
                    <Text strong style={{ fontSize: '16px' }}>
                      {dashboardData.averageProcessingTime} days
                    </Text>
                  </div>
                </Col>
                <Col span={12}>
                  <Text type="secondary">Payment Terms</Text>
                  <div>
                    <Text strong style={{ fontSize: '16px' }}>
                      {dashboardData.contractInfo.paymentTerms}
                    </Text>
                  </div>
                </Col>
              </Row>
            </Space>
          </Card>
        </Col>
        
        <Col xs={24} lg={12}>
          <Card title="Contract Status" extra={<FileTextOutlined />}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <Text type="secondary">Contract Number</Text>
                <div>
                  <Text code strong>{dashboardData.contractInfo.contractNumber}</Text>
                </div>
              </div>
              <div>
                <Text type="secondary">Contract Utilization</Text>
                <Progress
                  percent={Math.round(((dashboardData.contractInfo.contractValue - dashboardData.contractInfo.remainingValue) / dashboardData.contractInfo.contractValue) * 100)}
                  strokeColor="#52c41a"
                  style={{ marginTop: '8px' }}
                />
                <div style={{ marginTop: '8px' }}>
                  <Text>
                    ${(dashboardData.contractInfo.contractValue - dashboardData.contractInfo.remainingValue).toLocaleString()} / ${dashboardData.contractInfo.contractValue.toLocaleString()}
                  </Text>
                </div>
              </div>
              <div>
                <Text type="secondary">Contract Expires</Text>
                <div>
                  <Text strong>
                    {new Date(dashboardData.contractInfo.expiryDate).toLocaleDateString('en-GB')}
                  </Text>
                  {new Date(dashboardData.contractInfo.expiryDate) < new Date(Date.now() + 365*24*60*60*1000) && (
                    <Tag color="orange" style={{ marginLeft: '8px' }}>
                      <WarningOutlined /> Renewal Due Soon
                    </Tag>
                  )}
                </div>
              </div>
            </Space>
          </Card>
        </Col>
      </Row>

      {/* Recent Activity */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card 
            title="Recent Invoices" 
            extra={
              <Button 
                type="text" 
                onClick={() => navigate('/supplier/invoices')}
              >
                View All
              </Button>
            }
          >
            <Table
              columns={recentInvoicesColumns}
              dataSource={recentInvoices}
              rowKey="_id"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
        
        <Col xs={24} lg={8}>
          <Card 
            title={
              <Space>
                <BellOutlined />
                Notifications
                {unreadNotifications > 0 && (
                  <Badge count={unreadNotifications} size="small" />
                )}
              </Space>
            }
            extra={
              <Button type="text" size="small">
                Mark all read
              </Button>
            }
          >
            <List
              dataSource={notifications}
              renderItem={(item) => (
                <List.Item style={{ padding: '8px 0' }}>
                  <List.Item.Meta
                    avatar={<Avatar icon={getNotificationIcon(item.type)} size="small" />}
                    title={
                      <Text strong={!item.read} style={{ fontSize: '13px' }}>
                        {item.title}
                      </Text>
                    }
                    description={
                      <div>
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          {item.description}
                        </Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: '11px' }}>
                          {item.time}
                        </Text>
                      </div>
                    }
                  />
                  {!item.read && (
                    <div style={{ width: '8px', height: '8px', background: '#1890ff', borderRadius: '50%' }} />
                  )}
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      {/* Quick Actions */}
      <Card 
        title="Quick Actions" 
        style={{ marginTop: '24px' }}
        bodyStyle={{ padding: '16px' }}
      >
        <Row gutter={16}>
          <Col xs={24} sm={12} md={6}>
            <Button 
              type="primary" 
              block 
              icon={<PlusOutlined />}
              onClick={() => navigate('/supplier/portal')}
              size="large"
            >
              Submit New Invoice
            </Button>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Button 
              block 
              icon={<FileTextOutlined />}
              onClick={() => navigate('/supplier/invoices')}
              size="large"
            >
              View All Invoices
            </Button>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Button 
              block 
              icon={<ShopOutlined />}
              onClick={() => navigate('/supplier/profile')}
              size="large"
            >
              Update Profile
            </Button>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Button 
              block 
              icon={<CalendarOutlined />}
              onClick={() => navigate('/supplier/portal')}
              size="large"
            >
              Schedule Meeting
            </Button>
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default SupplierDashboard;