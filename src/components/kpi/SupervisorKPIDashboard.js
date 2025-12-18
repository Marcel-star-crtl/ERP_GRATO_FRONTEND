import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Table,
  Button,
  Tag,
  Badge,
  Empty,
  Row,
  Col,
  Statistic,
  message
} from 'antd';
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  UserOutlined,
  CalendarOutlined,
  EyeOutlined
} from '@ant-design/icons';
import { kpiAPI } from '../../services/kpiAPI';
import dayjs from 'dayjs';

const SupervisorKPIDashboard = () => {
  const navigate = useNavigate();
  const [pendingKPIs, setPendingKPIs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPendingKPIs();
  }, []);

  const fetchPendingKPIs = async () => {
    try {
      setLoading(true);
      const result = await kpiAPI.getPendingApprovals();
      
      if (result.success) {
        setPendingKPIs(result.data);
      } else {
        message.error(result.message || 'Failed to fetch pending KPIs');
      }
    } catch (error) {
      console.error('Error fetching pending KPIs:', error);
      message.error('Failed to load pending KPIs');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'Employee',
      key: 'employee',
      width: 200,
      render: (_, record) => (
        <div>
          <div><strong>{record.employee.fullName}</strong></div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {record.employee.department}
          </div>
        </div>
      )
    },
    {
      title: 'Quarter',
      dataIndex: 'quarter',
      key: 'quarter',
      width: 100,
      render: (quarter) => <Tag color="blue">{quarter}</Tag>
    },
    {
      title: 'KPIs',
      dataIndex: 'kpis',
      key: 'kpiCount',
      width: 80,
      render: (kpis) => (
        <Badge count={kpis.length} showZero style={{ backgroundColor: '#1890ff' }} />
      )
    },
    {
      title: 'Total Weight',
      dataIndex: 'totalWeight',
      key: 'totalWeight',
      width: 120,
      render: (weight) => (
        <Tag color={weight === 100 ? 'success' : 'error'}>
          {weight}%
        </Tag>
      )
    },
    {
      title: 'Submitted',
      dataIndex: 'submittedAt',
      key: 'submittedAt',
      width: 150,
      render: (date) => dayjs(date).format('MMM DD, YYYY HH:mm')
    },
    {
      title: 'Action',
      key: 'action',
      width: 120,
      fixed: 'right',
      render: (_, record) => (
        <Button
          type="primary"
          size="small"
          icon={<CheckCircleOutlined />}
          onClick={() => navigate(`/supervisor/kpis/approve/${record._id}`)}
        >
          Review
        </Button>
      )
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ margin: 0 }}>
            <CheckCircleOutlined /> KPI Approvals Dashboard
          </h2>
          <p style={{ color: '#666', marginTop: '8px' }}>
            Review and approve quarterly KPIs submitted by your team
          </p>
        </div>

        <Row gutter={16} style={{ marginBottom: '24px' }}>
          <Col xs={24} sm={12}>
            <Card size="small">
              <Statistic
                title="Pending Approvals"
                value={pendingKPIs.length}
                prefix={<ClockCircleOutlined />}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12}>
            <Card size="small">
              <Statistic
                title="Employees"
                value={new Set(pendingKPIs.map(k => k.employee._id)).size}
                prefix={<UserOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
        </Row>

        <Card title="Pending KPI Approvals">
          {pendingKPIs.length === 0 ? (
            <Empty description="No KPIs pending approval" />
          ) : (
            <Table
              columns={columns}
              dataSource={pendingKPIs}
              rowKey="_id"
              loading={loading}
              pagination={{ pageSize: 10 }}
              scroll={{ x: 900 }}
            />
          )}
        </Card>
      </Card>
    </div>
  );
};

export default SupervisorKPIDashboard;