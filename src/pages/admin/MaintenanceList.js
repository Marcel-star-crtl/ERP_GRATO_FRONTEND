// technician-app/pages/MaintenanceList.js
import React, { useState } from 'react';
import { 
  List, 
  Button, 
  Tag, 
  Space, 
  Input, 
  DatePicker, 
  Select, 
  Card,
  Typography
} from 'antd';
import { 
  SearchOutlined, 
  FilterOutlined, 
  FileTextOutlined 
} from '@ant-design/icons';
import { Link } from 'react-router-dom';
import dayjs from 'dayjs';

const { Search } = Input;
const { RangePicker } = DatePicker;
const { Option } = Select;
const { Text } = Typography;

const MaintenanceList = () => {
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  
  const maintenanceData = [
    {
      id: 'MA-1001',
      generatorId: 'GEN_ABJ_001',
      type: 'Routine Maintenance',
      date: dayjs().subtract(1, 'day'),
      status: 'completed',
      technician: 'John Doe'
    },
    {
      id: 'MA-1002',
      generatorId: 'GEN_ABJ_003',
      type: 'Emergency Repair',
      date: dayjs().subtract(3, 'days'),
      status: 'completed',
      technician: 'Jane Smith'
    },
    {
      id: 'MA-1003',
      generatorId: 'GEN_ABJ_005',
      type: 'Oil Change',
      date: dayjs().subtract(5, 'days'),
      status: 'completed',
      technician: 'Mike Johnson'
    },
  ];

  const getStatusTag = (status) => {
    const statusMap = {
      completed: { color: 'green', text: 'Completed' },
      pending: { color: 'orange', text: 'Pending' },
      in_progress: { color: 'blue', text: 'In Progress' },
    };
    const { color, text } = statusMap[status] || { color: 'default', text: status };
    return <Tag color={color}>{text}</Tag>;
  };

  const filteredData = maintenanceData.filter(item => 
    statusFilter === 'all' || item.status === statusFilter
  );

  return (
    <div className="maintenance-list">
      <Card>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Space style={{ marginBottom: 16, width: '100%' }}>
            <Search 
              placeholder="Search maintenance records..." 
              enterButton={<SearchOutlined />} 
              style={{ flex: 1 }}
            />
            <Button 
              icon={<FilterOutlined />} 
              onClick={() => setFiltersVisible(!filtersVisible)}
            >
              Filters
            </Button>
          </Space>

          {filtersVisible && (
            <Space style={{ marginBottom: 16, width: '100%' }}>
              <Select
                defaultValue="all"
                style={{ width: 120 }}
                onChange={setStatusFilter}
              >
                <Option value="all">All Status</Option>
                <Option value="completed">Completed</Option>
                <Option value="pending">Pending</Option>
                <Option value="in_progress">In Progress</Option>
              </Select>
              <RangePicker />
            </Space>
          )}

          <List
            itemLayout="vertical"
            dataSource={filteredData}
            renderItem={(item) => (
              <List.Item
                key={item.id}
                actions={[
                  <Link to={`/technician/maintenance/${item.id}`}>
                    <Button type="link" icon={<FileTextOutlined />}>
                      View Details
                    </Button>
                  </Link>
                ]}
              >
                <List.Item.Meta
                  title={<Text strong>{item.id}</Text>}
                  description={
                    <Space>
                      <Text>{item.generatorId}</Text>
                      <Text type="secondary">•</Text>
                      <Text type="secondary">{item.type}</Text>
                      <Text type="secondary">•</Text>
                      <Text type="secondary">{item.date.format('MMM D, YYYY')}</Text>
                    </Space>
                  }
                />
                <Space>
                  {getStatusTag(item.status)}
                  <Text type="secondary">Technician: {item.technician}</Text>
                </Space>
              </List.Item>
            )}
          />
        </Space>
      </Card>
    </div>
  );
};

export default MaintenanceList;