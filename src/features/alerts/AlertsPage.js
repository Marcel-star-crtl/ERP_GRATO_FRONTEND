import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Table, Tag, Button, Card, Badge, Space } from 'antd';
import {
  BellOutlined,
  CheckOutlined,
  ExclamationCircleOutlined,
  FireOutlined,
} from '@ant-design/icons';
import { fetchAlerts, resolveAlert } from './alertSlice';

const AlertsPage = () => {
  const dispatch = useDispatch();
  const { alerts, loading } = useSelector((state) => state.alerts);

  useEffect(() => {
    dispatch(fetchAlerts());
  }, [dispatch]);

  const handleResolve = (id) => {
    dispatch(resolveAlert(id));
  };

  const columns = [
    {
      title: 'Generator',
      dataIndex: 'generator_id',
      key: 'generator',
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type) => {
        let icon, color;
        switch (type) {
          case 'low_fuel':
            icon = <ExclamationCircleOutlined />;
            color = 'gold';
            break;
          case 'overheating':
            icon = <FireOutlined />;
            color = 'volcano';
            break;
          case 'mechanical_issue':
            icon = <ExclamationCircleOutlined />;
            color = 'red';
            break;
          default:
            icon = <BellOutlined />;
            color = 'blue';
        }
        return (
          <Tag icon={icon} color={color}>
            {type.replace('_', ' ').toUpperCase()}
          </Tag>
        );
      },
    },
    {
      title: 'Severity',
      dataIndex: 'severity',
      key: 'severity',
      render: (severity) => (
        <Tag color={severity === 'critical' ? 'red' : 'orange'}>
          {severity.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Timestamp',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (date) => new Date(date).toLocaleString(),
    },
    {
      title: 'Status',
      dataIndex: 'resolved',
      key: 'status',
      render: (resolved) => (
        <Badge
          status={resolved ? 'success' : 'error'}
          text={resolved ? 'Resolved' : 'Active'}
        />
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="middle">
          {!record.resolved && (
            <Button
              type="link"
              icon={<CheckOutlined />}
              onClick={() => handleResolve(record._id)}
            >
              Resolve
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="alerts-page">
      <Card
        title={
          <Space>
            <BellOutlined />
            Alerts
          </Space>
        }
        extra={
          <Button onClick={() => dispatch(fetchAlerts())}>
            Refresh
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={alerts}
          rowKey="_id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );
};

export default AlertsPage;