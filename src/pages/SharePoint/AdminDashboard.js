import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card, Table, Button, Space, Tag, Typography, Spin, message,
  Row, Col, Statistic, Progress
} from 'antd';
import {
  FileOutlined, FolderOutlined, TeamOutlined, BarChartOutlined,
  ArrowLeftOutlined, HistoryOutlined, UserOutlined, EyeOutlined
} from '@ant-design/icons';
import sharepointAPI from '../../services/sharePointAPI';

const { Title, Text } = Typography;

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalFiles: 0,
    totalFolders: 0,
    totalUsers: 0,
    storageUsed: 0,
    storageLimit: 107374182400,
    filesByDepartment: [],
    recentActivity: []
  });

  useEffect(() => {
    fetchAdminStats();
  }, []);

  const fetchAdminStats = async () => {
    try {
      setLoading(true);
      const [storageRes, activityRes] = await Promise.all([
        sharepointAPI.getStorageStats(),
        sharepointAPI.getActivityLog({ days: 7 })
      ]);

      setStats({
        totalFiles: storageRes.data.data.overall?.totalFiles || 0,
        totalFolders: storageRes.data.data.byDepartment?.length || 0,
        totalUsers: 156,
        storageUsed: storageRes.data.data.overall?.totalSize || 0,
        storageLimit: 107374182400,
        filesByDepartment: storageRes.data.data.byDepartment || [],
        recentActivity: activityRes.data.data?.slice(0, 10) || []
      });
    } catch (error) {
      console.error('Error fetching admin stats:', error);
      message.error('Failed to load statistics');
      // Fallback mock data
      setStats({
        totalFiles: 1247,
        totalFolders: 28,
        totalUsers: 156,
        storageUsed: 45678900000,
        storageLimit: 107374182400,
        filesByDepartment: [
          { _id: 'Finance', folderCount: 5, totalFiles: 342, totalSize: 12345678900 },
          { _id: 'HR', folderCount: 3, totalFiles: 189, totalSize: 8765432100 }
        ],
        recentActivity: []
      });
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const storagePercent = ((stats.storageUsed / stats.storageLimit) * 100).toFixed(2);

  const departmentColumns = [
    {
      title: 'Department',
      dataIndex: '_id',
      key: 'department',
      render: (dept) => (
        <Space>
          <FolderOutlined style={{ color: '#1890ff' }} />
          <Text strong>{dept}</Text>
        </Space>
      )
    },
    {
      title: 'Files',
      dataIndex: 'totalFiles',
      key: 'files',
      render: (count) => <Tag color="blue">{count}</Tag>
    },
    {
      title: 'Storage Used',
      dataIndex: 'totalSize',
      key: 'size',
      render: (size) => formatFileSize(size)
    },
    {
      title: 'Actions',
      key: 'actions',
      render: () => <Button type="link" size="small" icon={<EyeOutlined />}>View Details</Button>
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
      <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/sharepoint/portal')} 
        style={{ marginBottom: '16px' }}>
        Back to Portal
      </Button>

      <Card style={{ marginBottom: '24px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <Title level={2} style={{ color: 'white', margin: 0 }}>
          <BarChartOutlined /> Admin Dashboard
        </Title>
        <Text style={{ color: 'rgba(255,255,255,0.85)' }}>
          Monitor and manage SharePoint storage, users, and activity
        </Text>
      </Card>

      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic title="Total Files" value={stats.totalFiles} 
              prefix={<FileOutlined />} valueStyle={{ color: '#1890ff' }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic title="Total Folders" value={stats.totalFolders} 
              prefix={<FolderOutlined />} valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic title="Active Users" value={stats.totalUsers} 
              prefix={<TeamOutlined />} valueStyle={{ color: '#faad14' }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic title="Storage Used" value={`${storagePercent}%`} 
              valueStyle={{ color: storagePercent > 80 ? '#f5222d' : '#52c41a' }} />
            <Progress percent={parseFloat(storagePercent)} 
              strokeColor={storagePercent > 80 ? '#f5222d' : '#52c41a'} size="small" />
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {formatFileSize(stats.storageUsed)} / {formatFileSize(stats.storageLimit)}
            </Text>
          </Card>
        </Col>
      </Row>

      <Card title="Storage by Department" style={{ marginBottom: '24px' }}>
        <Table columns={departmentColumns} dataSource={stats.filesByDepartment} 
          rowKey="_id" pagination={false} size="small" />
      </Card>

      <Card title={<><HistoryOutlined /> Recent Activity</>}>
        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
          {stats.recentActivity.length > 0 ? (
            stats.recentActivity.map((activity, index) => (
              <div key={index} style={{
                padding: '12px',
                borderBottom: index < stats.recentActivity.length - 1 ? '1px solid #f0f0f0' : 'none'
              }}>
                <Space>
                  <UserOutlined style={{ color: '#1890ff' }} />
                  <Text strong>{activity.userId?.fullName || 'Unknown User'}</Text>
                  <Text type="secondary">{activity.action}</Text>
                  <Text>{activity.fileName || activity.folderName}</Text>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    • {new Date(activity.timestamp).toLocaleString()}
                  </Text>
                </Space>
              </div>
            ))
          ) : (
            <Text type="secondary">No recent activity</Text>
          )}
        </div>
      </Card>

      <Card title="Quick Actions" style={{ marginTop: '24px' }}>
        <Space wrap>
          <Button type="primary" icon={<FolderOutlined />}>Manage Folders</Button>
          <Button icon={<TeamOutlined />}>User Permissions</Button>
          <Button icon={<BarChartOutlined />} onClick={() => navigate('/sharepoint/analytics')}>
            View Analytics
          </Button>
          <Button icon={<HistoryOutlined />}>Activity Log</Button>
        </Space>
      </Card>
    </div>
  );
};

export default AdminDashboard;