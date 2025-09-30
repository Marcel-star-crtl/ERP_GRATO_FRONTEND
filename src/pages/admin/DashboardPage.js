import React from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Statistic, 
  Typography, 
  List, 
  Badge,
  Button
} from 'antd';
import { 
  ThunderboltOutlined, 
  ToolOutlined, 
  ClockCircleOutlined,
  SyncOutlined
} from '@ant-design/icons';
// import './Dashboard.css';

const { Title, Text } = Typography;

const Dashboard = () => {
  const pendingWorkOrders = [
    { id: 'WO-1001', generator: 'GEN_ABJ_001', type: 'Routine', due: 'Today' },
    { id: 'WO-1002', generator: 'GEN_ABJ_005', type: 'Repair', due: 'Tomorrow' }
  ];

  const recentActivities = [
    { id: 'MA-2001', generator: 'GEN_ABJ_003', date: '2 hours ago', status: 'Completed' },
    { id: 'MA-2002', generator: 'GEN_ABJ_007', date: 'Yesterday', status: 'Completed' }
  ];

  return (
    <div className="technician-dashboard">
      <Title level={4}>Today's Overview</Title>
      
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={12} sm={8}>
          <Card>
            <Statistic 
              title="Assigned Work" 
              value={3} 
              prefix={<ToolOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8}>
          <Card>
            <Statistic 
              title="Generators" 
              value={12} 
              prefix={<ThunderboltOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic 
              title="Pending Parts" 
              value={2} 
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col xs={24} md={12}>
          <Card 
            title="Pending Work Orders"
            extra={<Button type="link">View All</Button>}
          >
            <List
              dataSource={pendingWorkOrders}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    title={<Text strong>{item.id}</Text>}
                    description={`${item.generator} • ${item.type}`}
                  />
                  <div>
                    <Badge status="processing" text={item.due} />
                  </div>
                </List.Item>
              )}
            />
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card 
            title="Recent Activities"
            extra={<Button type="link">View All</Button>}
          >
            <List
              dataSource={recentActivities}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    title={<Text strong>{item.id}</Text>}
                    description={item.generator}
                  />
                  <div>
                    <Text type="secondary">{item.date}</Text>
                  </div>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;