// technician-app/pages/GeneratorDetail.js
import React from 'react';
import { 
  Card, 
  Descriptions, 
  Tabs, 
  Tag, 
  Button, 
  Typography,
  Statistic,
  Row,
  Col,
  List
} from 'antd';
import { 
  ThunderboltOutlined, 
  ToolOutlined, 
  HistoryOutlined,
  AlertOutlined
} from '@ant-design/icons';
import { Link, useParams } from 'react-router-dom';

const { TabPane } = Tabs;
const { Title, Text } = Typography;

const GeneratorDetail = () => {
  const { id } = useParams();
  
  // Mock data - replace with API call
  const generator = {
    id: id,
    name: `Generator ${id}`,
    status: 'running',
    fuelLevel: 78,
    powerOutput: 45,
    temperature: 65,
    lastMaintenance: '2023-05-15',
    nextMaintenance: '2023-06-15',
    location: 'Tower ABJ-001',
    maintenanceHistory: [
      { id: 'MA-1001', date: '2023-05-15', type: 'Routine', technician: 'John Doe' },
      { id: 'MA-0987', date: '2023-04-10', type: 'Oil Change', technician: 'Jane Smith' },
      { id: 'MA-0954', date: '2023-03-01', type: 'Inspection', technician: 'Mike Johnson' },
    ],
    alerts: [
      { id: 'AL-1001', date: '2023-05-10', type: 'High Temperature', resolved: true },
      { id: 'AL-0999', date: '2023-04-05', type: 'Low Fuel', resolved: true },
    ]
  };

  const getStatusTag = (status) => {
    const statusMap = {
      running: { color: 'green', text: 'Running' },
      standby: { color: 'blue', text: 'Standby' },
      fault: { color: 'red', text: 'Fault' },
      maintenance: { color: 'orange', text: 'Maintenance' },
    };
    const { color, text } = statusMap[status] || { color: 'default', text: status };
    return <Tag color={color}>{text}</Tag>;
  };

  return (
    <div className="generator-detail">
      <Card>
        <Title level={4}>
          <ThunderboltOutlined style={{ marginRight: 8 }} />
          {generator.name}
        </Title>
        
        <Descriptions column={1} bordered>
          <Descriptions.Item label="Status">
            {getStatusTag(generator.status)}
          </Descriptions.Item>
          <Descriptions.Item label="Location">
            {generator.location}
          </Descriptions.Item>
        </Descriptions>

        <Row gutter={16} style={{ margin: '16px 0' }}>
          <Col xs={12} sm={8}>
            <Statistic 
              title="Fuel Level" 
              value={generator.fuelLevel} 
              suffix="%" 
            />
          </Col>
          <Col xs={12} sm={8}>
            <Statistic 
              title="Power Output" 
              value={generator.powerOutput} 
              suffix="kW" 
            />
          </Col>
          <Col xs={24} sm={8}>
            <Statistic 
              title="Temperature" 
              value={generator.temperature} 
              suffix="°C" 
            />
          </Col>
        </Row>

        <Tabs defaultActiveKey="1">
          <TabPane
            tab={
              <span>
                <HistoryOutlined />
                Maintenance History
              </span>
            }
            key="1"
          >
            <List
              dataSource={generator.maintenanceHistory}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    title={<Link to={`/technician/maintenance/${item.id}`}>{item.id}</Link>}
                    description={`${item.type} • ${item.date}`}
                  />
                  <Text type="secondary">{item.technician}</Text>
                </List.Item>
              )}
            />
          </TabPane>
          <TabPane
            tab={
              <span>
                <AlertOutlined />
                Alerts
              </span>
            }
            key="2"
          >
            <List
              dataSource={generator.alerts}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    title={item.type}
                    description={item.date}
                  />
                  <Tag color={item.resolved ? 'green' : 'red'}>
                    {item.resolved ? 'Resolved' : 'Active'}
                  </Tag>
                </List.Item>
              )}
            />
          </TabPane>
        </Tabs>

        <div style={{ marginTop: 16, textAlign: 'center' }}>
          <Link to={`/technician/maintenance/new?generator=${generator.id}`}>
            <Button type="primary" icon={<ToolOutlined />}>
              Create Maintenance Report
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
};

export default GeneratorDetail;