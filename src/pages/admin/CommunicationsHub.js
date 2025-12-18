import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Card,
  Row,
  Col,
  Button,
  Space,
  Table,
  Tag,
  Typography,
  Statistic,
  Badge,
  message,
  Modal,
  Tooltip,
  Dropdown,
  Menu,
  Empty,
  Spin
} from 'antd';
import {
  NotificationOutlined,
  PlusOutlined,
  SendOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  HistoryOutlined,
  BarChartOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
  MailOutlined,
  TeamOutlined,
  CopyOutlined,
  MoreOutlined
} from '@ant-design/icons';
import api from '../../services/api';

const { Title, Text } = Typography;

const CommunicationsHub = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    drafts: 0,
    scheduled: 0,
    sent: 0,
    totalRecipients: 0,
    avgReadRate: 0
  });
  const [recentCommunications, setRecentCommunications] = useState([]);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      const [statsResponse, recentResponse] = await Promise.all([
        api.get('/communications/stats/dashboard'),
        api.get('/communications?status=sent&limit=10')
      ]);

      const statsData = statsResponse.data.data;
      setStats({
        drafts: statsData.drafts || 0,
        scheduled: statsData.scheduled || 0,
        sent: statsData.overall?.totalSent || 0,
        totalRecipients: statsData.overall?.totalRecipients || 0,
        avgReadRate: statsData.overall?.avgReadRate || 0
      });

      setRecentCommunications(recentResponse.data.data || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      message.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCommunication = (id) => {
    Modal.confirm({
      title: 'Delete Communication',
      content: 'Are you sure you want to delete this communication? This action cannot be undone.',
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          setDeletingId(id);
          await api.delete(`/communications/${id}`);
          message.success('Communication deleted successfully');
          fetchDashboardData();
        } catch (error) {
          message.error(error.response?.data?.message || 'Failed to delete communication');
        } finally {
          setDeletingId(null);
        }
      }
    });
  };

  const handleDuplicateCommunication = async (id) => {
    try {
      const response = await api.get(`/communications/${id}`);
      const original = response.data.data;
      
      navigate('/admin/communications/new', {
        state: {
          template: {
            title: `Copy of ${original.title}`,
            content: original.content,
            messageType: original.messageType,
            priority: original.priority,
            recipients: original.recipients,
            deliveryMethod: original.deliveryMethod
          }
        }
      });
    } catch (error) {
      message.error('Failed to duplicate communication');
    }
  };

  const getActionMenu = (record) => (
    <Menu>
      <Menu.Item
        key="view"
        icon={<EyeOutlined />}
        onClick={() => navigate(`/admin/communications/${record._id}`)}
      >
        View Details
      </Menu.Item>
      
      {record.status !== 'sent' && (
        <Menu.Item
          key="edit"
          icon={<EditOutlined />}
          onClick={() => navigate(`/admin/communications/${record._id}/edit`)}
        >
          Edit
        </Menu.Item>
      )}
      
      {record.status === 'draft' && (
        <Menu.Item
          key="send"
          icon={<SendOutlined />}
          onClick={() => navigate(`/admin/communications/${record._id}/send`)}
        >
          Send Now
        </Menu.Item>
      )}
      
      <Menu.Item
        key="duplicate"
        icon={<CopyOutlined />}
        onClick={() => handleDuplicateCommunication(record._id)}
      >
        Duplicate
      </Menu.Item>
      
      <Menu.Divider />
      
      <Menu.Item
        key="delete"
        icon={<DeleteOutlined />}
        danger
        onClick={() => handleDeleteCommunication(record._id)}
        disabled={record.status === 'sent' && user.role !== 'admin'}
      >
        Delete
      </Menu.Item>
    </Menu>
  );

  const columns = [
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      render: (title, record) => (
        <div>
          <Text strong style={{ display: 'block' }}>{title}</Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            ID: COM-{record._id.slice(-6).toUpperCase()}
          </Text>
        </div>
      )
    },
    {
      title: 'Type',
      dataIndex: 'messageType',
      key: 'messageType',
      width: 120,
      render: (type) => {
        const colors = {
          announcement: 'blue',
          policy: 'purple',
          emergency: 'red',
          newsletter: 'green',
          general: 'default',
          training: 'orange',
          event: 'cyan'
        };
        return <Tag color={colors[type]}>{type}</Tag>;
      }
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      width: 100,
      render: (priority) => {
        const colors = {
          urgent: 'red',
          important: 'orange',
          normal: 'default'
        };
        return <Tag color={colors[priority]}>{priority}</Tag>;
      }
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (status) => {
        const config = {
          draft: { color: 'default', text: 'Draft' },
          scheduled: { color: 'blue', text: 'Scheduled' },
          sending: { color: 'processing', text: 'Sending' },
          sent: { color: 'success', text: 'Sent' },
          failed: { color: 'error', text: 'Failed' }
        };
        return (
          <Tag color={config[status]?.color}>
            {config[status]?.text || status}
          </Tag>
        );
      }
    },
    {
      title: 'Recipients',
      dataIndex: ['recipients', 'totalCount'],
      key: 'recipients',
      width: 100,
      render: (count) => (
        <Badge count={count} style={{ backgroundColor: '#1890ff' }} />
      )
    },
    {
      title: 'Sent / Read',
      key: 'stats',
      width: 120,
      render: (_, record) => {
        if (record.status !== 'sent') return '-';
        const readRate = record.recipients.totalCount > 0
          ? ((record.deliveryStats.readCount / record.recipients.totalCount) * 100).toFixed(0)
          : 0;
        return (
          <Tooltip title={`${record.deliveryStats.readCount} of ${record.recipients.totalCount} read`}>
            <div>
              <Text>{record.deliveryStats.emailsSent}</Text>
              <Text type="secondary"> / </Text>
              <Text type="success">{record.deliveryStats.readCount}</Text>
              <div style={{ fontSize: '11px', color: '#999' }}>
                {readRate}% read rate
              </div>
            </div>
          </Tooltip>
        );
      }
    },
    {
      title: 'Date',
      key: 'date',
      width: 140,
      render: (_, record) => {
        const date = record.sentAt || record.scheduledFor || record.createdAt;
        return (
          <div>
            <Text style={{ fontSize: '12px' }}>
              {new Date(date).toLocaleDateString()}
            </Text>
            <br />
            <Text type="secondary" style={{ fontSize: '11px' }}>
              {new Date(date).toLocaleTimeString()}
            </Text>
          </div>
        );
      }
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 80,
      fixed: 'right',
      render: (_, record) => (
        <Dropdown overlay={getActionMenu(record)} trigger={['click']}>
          <Button 
            type="text" 
            icon={<MoreOutlined />}
            loading={deletingId === record._id}
          />
        </Dropdown>
      )
    }
  ];

  if (loading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <Card 
        style={{ 
          marginBottom: '24px', 
          background: 'linear-gradient(135deg, #fa541c 0%, #ff7a45 100%)' 
        }}
      >
        <Row align="middle" justify="space-between">
          <Col>
            <Title level={2} style={{ color: 'white', margin: 0 }}>
              <NotificationOutlined /> Communications Hub
            </Title>
            <Text style={{ color: 'rgba(255,255,255,0.85)' }}>
              Manage company-wide messages and announcements
            </Text>
          </Col>
          <Col>
            <Space>
              <Button
                type="primary"
                size="large"
                icon={<PlusOutlined />}
                onClick={() => navigate('/admin/communications/new')}
                style={{ background: 'white', color: '#fa541c', borderColor: 'white' }}
              >
                New Message
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Statistics */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card>
            <Statistic
              title="Drafts"
              value={stats.drafts}
              prefix={<EditOutlined />}
              valueStyle={{ color: '#8c8c8c' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card>
            <Statistic
              title="Scheduled"
              value={stats.scheduled}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card>
            <Statistic
              title="Sent"
              value={stats.sent}
              prefix={<SendOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card>
            <Statistic
              title="Total Recipients"
              value={stats.totalRecipients}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card>
            <Statistic
              title="Avg Read Rate"
              value={stats.avgReadRate}
              suffix="%"
              prefix={<EyeOutlined />}
              valueStyle={{ color: '#fa8c16' }}
              precision={1}
            />
          </Card>
        </Col>
      </Row>

      {/* Quick Actions */}
      <Card style={{ marginBottom: '24px' }}>
        <Space wrap size="middle">
          <Button
            icon={<HistoryOutlined />}
            onClick={() => navigate('/admin/communications/history')}
          >
            Message History
          </Button>
          <Button
            icon={<FileTextOutlined />}
            onClick={() => navigate('/admin/communications/templates')}
          >
            Templates
          </Button>
          {user.role === 'admin' && (
            <Button
              icon={<BarChartOutlined />}
              onClick={() => navigate('/admin/communications/analytics')}
            >
              Analytics
            </Button>
          )}
          <Button
            icon={<ClockCircleOutlined />}
            onClick={() => navigate('/admin/communications/scheduled')}
          >
            Scheduled Messages
          </Button>
        </Space>
      </Card>

      {/* Recent Communications Table */}
      <Card title={`Recent Communications (${recentCommunications.length})`}>
        {recentCommunications.length > 0 ? (
          <Table
            columns={columns}
            dataSource={recentCommunications}
            rowKey="_id"
            pagination={{ pageSize: 10 }}
            scroll={{ x: 'max-content' }}
          />
        ) : (
          <Empty
            description="No communications found"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => navigate('/admin/communications/new')}
            >
              Create First Message
            </Button>
          </Empty>
        )}
      </Card>
    </div>
  );
};

export default CommunicationsHub;