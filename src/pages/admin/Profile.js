import React from 'react';
import { 
  Card, 
  Descriptions, 
  Avatar, 
  Button, 
  Typography,
  Divider,
  List,
  Space
} from 'antd';
import { 
  UserOutlined, 
  EditOutlined,
  SafetyOutlined,
  LogoutOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;

const Profile = () => {
  // Mock data - replace with actual user data
  const user = {
    name: 'John Doe',
    email: 'john.doe@powergen.com',
    phone: '+234 812 345 6789',
    employeeId: 'TECH-1001',
    role: 'Senior Technician',
    team: 'Lagos West',
    certifications: [
      'Generator Maintenance Certified (2022)',
      'Electrical Safety (2021)',
      'First Aid Certified (2023)'
    ]
  };

  return (
    <div className="profile-page">
      <Card>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Avatar size={100} icon={<UserOutlined />} style={{ marginBottom: 16 }} />
          <Title level={4}>{user.name}</Title>
          <Text type="secondary">{user.role}</Text>
        </div>

        <Descriptions column={1} bordered>
          <Descriptions.Item label="Employee ID">{user.employeeId}</Descriptions.Item>
          <Descriptions.Item label="Email">{user.email}</Descriptions.Item>
          <Descriptions.Item label="Phone">{user.phone}</Descriptions.Item>
          <Descriptions.Item label="Team">{user.team}</Descriptions.Item>
        </Descriptions>

        <Divider orientation="left">Certifications</Divider>
        <List
          dataSource={user.certifications}
          renderItem={(item) => (
            <List.Item>
              <SafetyOutlined style={{ marginRight: 8, color: '#52c41a' }} />
              {item}
            </List.Item>
          )}
        />

        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <Space>
            <Button type="primary" icon={<EditOutlined />}>
              Edit Profile
            </Button>
            <Button danger icon={<LogoutOutlined />}>
              Logout
            </Button>
          </Space>
        </div>
      </Card>
    </div>
  );
};

export default Profile;