// technician-app/pages/Generators.js
import React, { useState } from 'react';
import { 
  List, 
  Card, 
  Input, 
  Button, 
  Tag, 
  Typography, 
  Space,
  Select,
  Badge
} from 'antd';
import { 
  ThunderboltOutlined, 
  SearchOutlined,
  PlusOutlined,
  FilterOutlined
} from '@ant-design/icons';
import { Link } from 'react-router-dom';
// import './Generators.css';

const { Search } = Input;
const { Option } = Select;
const { Title, Text } = Typography;

const Generators = () => {
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Mock data - replace with API call
  const generators = [
    {
      id: 'GEN_ABJ_001',
      name: 'Generator ABJ 001',
      status: 'running',
      fuelLevel: 85,
      powerOutput: 42,
      location: 'Tower ABJ-001',
      lastMaintenance: '2023-05-15',
      alerts: 0
    },
    {
      id: 'GEN_ABJ_002',
      name: 'Generator ABJ 002',
      status: 'standby',
      fuelLevel: 92,
      powerOutput: 0,
      location: 'Tower ABJ-002',
      lastMaintenance: '2023-05-10',
      alerts: 0
    },
    {
      id: 'GEN_ABJ_003',
      name: 'Generator ABJ 003',
      status: 'maintenance',
      fuelLevel: 45,
      powerOutput: 0,
      location: 'Tower ABJ-003',
      lastMaintenance: '2023-05-18',
      alerts: 2
    },
  ];

  const getStatusTag = (status) => {
    const statusMap = {
      running: { color: 'green', text: 'Running' },
      standby: { color: 'blue', text: 'Standby' },
      maintenance: { color: 'orange', text: 'Maintenance' },
      fault: { color: 'red', text: 'Fault' },
    };
    const { color, text } = statusMap[status] || { color: 'default', text: status };
    return <Tag color={color}>{text}</Tag>;
  };

  const filteredGenerators = generators.filter(gen => {
    const matchesSearch = gen.name.toLowerCase().includes(searchText.toLowerCase()) || 
                         gen.id.toLowerCase().includes(searchText.toLowerCase());
    const matchesStatus = statusFilter === 'all' || gen.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="generators-page">
      <Card>
        <Title level={4} style={{ marginBottom: 16 }}>
          <ThunderboltOutlined style={{ marginRight: 8 }} />
          Generators
        </Title>

        <Space style={{ marginBottom: 16, width: '100%' }}>
          <Search
            placeholder="Search generators..."
            allowClear
            enterButton={<SearchOutlined />}
            size="large"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ flex: 1 }}
          />
          <Select
            defaultValue="all"
            style={{ width: 150 }}
            onChange={setStatusFilter}
            suffixIcon={<FilterOutlined />}
          >
            <Option value="all">All Status</Option>
            <Option value="running">Running</Option>
            <Option value="standby">Standby</Option>
            <Option value="maintenance">Maintenance</Option>
            <Option value="fault">Fault</Option>
          </Select>
        </Space>

        <List
          itemLayout="vertical"
          dataSource={filteredGenerators}
          renderItem={(generator) => (
            <List.Item
              key={generator.id}
              actions={[
                <Link to={`/technician/generators/${generator.id}`}>
                  <Button type="link">View Details</Button>
                </Link>,
                <Link to={`/technician/maintenance/new?generator=${generator.id}`}>
                  <Button type="link" icon={<PlusOutlined />}>
                    New Report
                  </Button>
                </Link>
              ]}
            >
              <List.Item.Meta
                title={
                  <Space>
                    <Text strong>{generator.name}</Text>
                    {generator.alerts > 0 && (
                      <Badge count={generator.alerts} style={{ backgroundColor: '#f5222d' }} />
                    )}
                  </Space>
                }
                description={
                  <Space>
                    {getStatusTag(generator.status)}
                    <Text type="secondary">{generator.location}</Text>
                    <Text type="secondary">•</Text>
                    <Text type="secondary">Fuel: {generator.fuelLevel}%</Text>
                  </Space>
                }
              />
              <div>
                <Text type="secondary">Last maintenance: {generator.lastMaintenance}</Text>
              </div>
            </List.Item>
          )}
        />
      </Card>
    </div>
  );
};

export default Generators;