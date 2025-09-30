// technician-app/pages/Maintenance.js
import React, { useState } from 'react';
import { Tabs, Button, Space, Typography } from 'antd';
import { PlusOutlined, UnorderedListOutlined } from '@ant-design/icons';
import { Link, Outlet } from 'react-router-dom';
// import './Maintenance.css';

const { Title } = Typography;
const { TabPane } = Tabs;

const Maintenance = () => {
  const [activeTab, setActiveTab] = useState('list');

  return (
    <div className="maintenance-page">
      <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>
          <UnorderedListOutlined style={{ marginRight: 8 }} />
          Maintenance Records
        </Title>
        <Link to="/technician/maintenance/new">
          <Button type="primary" icon={<PlusOutlined />}>
            New Report
          </Button>
        </Link>
      </Space>

      <Tabs 
        activeKey={activeTab}
        onChange={setActiveTab}
        type="card"
      >
        <TabPane tab="All Records" key="list" />
        <TabPane tab="Pending Approval" key="pending" />
        <TabPane tab="Completed" key="completed" />
      </Tabs>

      <Outlet />
    </div>
  );
};

export default Maintenance;