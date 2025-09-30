import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Typography,
  Modal,
  Form,
  Input,
  Select,
  Switch,
  message,
  Popconfirm,
  Row,
  Col,
  Statistic,
  Alert,
  Tooltip,
  Divider,
  Badge
} from 'antd';
import {
  UserOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  ReloadOutlined,
  LockOutlined,
  UnlockOutlined,
  MailOutlined,
  PhoneOutlined
} from '@ant-design/icons';
import api from '../../services/api';

const { Title, Text } = Typography;
const { Option } = Select;
const { Search } = Input;

const AdminUserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedRole, setSelectedRole] = useState('all');
  const [form] = Form.useForm();

  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    adminUsers: 0,
    departments: 0
  });

  const [departments] = useState([
    'Finance',
    'HR',
    'IT',
    'Operations',
    'Procurement',
    'Sales',
    'Marketing',
    'Engineering',
    'Legal',
    'Administration'
  ]);

  const [roles] = useState([
    'employee',
    'supervisor',
    'finance',
    'admin',
    'buyer',
    'hr'
  ]);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    calculateStats();
  }, [users]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/users/admin/all');
      
      if (response.data.success) {
        setUsers(response.data.data || []);
      } else {
        message.error('Failed to fetch users');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      message.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    const totalUsers = users.length;
    const activeUsers = users.filter(user => user.isActive !== false).length;
    const adminUsers = users.filter(user => user.role === 'admin').length;
    const uniqueDepartments = [...new Set(users.map(user => user.department).filter(Boolean))].length;

    setStats({
      totalUsers,
      activeUsers,
      adminUsers,
      departments: uniqueDepartments
    });
  };

  const handleCreateUser = () => {
    setEditingUser(null);
    form.resetFields();
    form.setFieldsValue({
      isActive: true,
      role: 'employee'
    });
    setModalVisible(true);
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    form.setFieldsValue({
      ...user,
      isActive: user.isActive !== false
    });
    setModalVisible(true);
  };

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      
      if (editingUser) {
        // Update user
        const response = await api.put(`/api/users/admin/${editingUser._id}`, values);
        if (response.data.success) {
          message.success('User updated successfully');
          await fetchUsers();
        } else {
          throw new Error(response.data.message || 'Failed to update user');
        }
      } else {
        // Create user
        const response = await api.post('/api/users/admin/create', values);
        if (response.data.success) {
          message.success('User created successfully');
          await fetchUsers();
        } else {
          throw new Error(response.data.message || 'Failed to create user');
        }
      }
      
      setModalVisible(false);
      form.resetFields();
      setEditingUser(null);
    } catch (error) {
      console.error('Error saving user:', error);
      message.error(error.message || 'Failed to save user');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      setLoading(true);
      const response = await api.delete(`/api/users/admin/${userId}`);
      
      if (response.data.success) {
        message.success('User deleted successfully');
        await fetchUsers();
      } else {
        throw new Error(response.data.message || 'Failed to delete user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      message.error(error.message || 'Failed to delete user');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (user) => {
    try {
      const newStatus = !user.isActive;
      const response = await api.put(`/api/users/admin/${user._id}/status`, {
        isActive: newStatus
      });
      
      if (response.data.success) {
        message.success(`User ${newStatus ? 'activated' : 'deactivated'} successfully`);
        await fetchUsers();
      } else {
        throw new Error(response.data.message || 'Failed to update user status');
      }
    } catch (error) {
      console.error('Error updating user status:', error);
      message.error('Failed to update user status');
    }
  };

  const getRoleTag = (role) => {
    const roleColors = {
      'admin': 'red',
      'finance': 'blue',
      'supervisor': 'purple',
      'buyer': 'cyan',
      'hr': 'orange',
      'employee': 'green'
    };
    
    return <Tag color={roleColors[role] || 'default'}>{role?.toUpperCase()}</Tag>;
  };

  const getFilteredUsers = () => {
    return users.filter(user => {
      const matchesSearch = 
        user.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.department?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesDepartment = selectedDepartment === 'all' || user.department === selectedDepartment;
      const matchesRole = selectedRole === 'all' || user.role === selectedRole;
      
      return matchesSearch && matchesDepartment && matchesRole;
    });
  };

  const columns = [
    {
      title: 'User Details',
      key: 'userDetails',
      render: (_, record) => (
        <div>
          <Text strong>{record.fullName || 'No Name'}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: '12px' }}>
            <MailOutlined /> {record.email}
          </Text>
          {record.phone && (
            <>
              <br />
              <Text type="secondary" style={{ fontSize: '12px' }}>
                <PhoneOutlined /> {record.phone}
              </Text>
            </>
          )}
        </div>
      ),
      width: 220
    },
    {
      title: 'Department & Position',
      key: 'department',
      render: (_, record) => (
        <div>
          <Tag color="blue">{record.department || 'Unassigned'}</Tag>
          <br />
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.position || 'No Position'}
          </Text>
        </div>
      ),
      width: 150
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: getRoleTag,
      filters: roles.map(role => ({ text: role.toUpperCase(), value: role })),
      onFilter: (value, record) => record.role === value,
      width: 100
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, record) => (
        <div>
          <Badge 
            status={record.isActive !== false ? 'success' : 'error'} 
            text={record.isActive !== false ? 'Active' : 'Inactive'}
          />
          <br />
          <Text type="secondary" style={{ fontSize: '11px' }}>
            Joined: {record.createdAt ? new Date(record.createdAt).toLocaleDateString() : 'Unknown'}
          </Text>
        </div>
      ),
      width: 120
    },
    {
      title: 'Last Activity',
      key: 'lastActivity',
      render: (_, record) => (
        <div>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.lastLogin ? 
              `Last login: ${new Date(record.lastLogin).toLocaleDateString()}` : 
              'Never logged in'
            }
          </Text>
        </div>
      ),
      width: 120
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="small" direction="vertical">
          <Space size="small">
            <Tooltip title="Edit User">
              <Button
                size="small"
                icon={<EditOutlined />}
                onClick={() => handleEditUser(record)}
              />
            </Tooltip>
            
            <Tooltip title={record.isActive !== false ? 'Deactivate User' : 'Activate User'}>
              <Button
                size="small"
                icon={record.isActive !== false ? <LockOutlined /> : <UnlockOutlined />}
                onClick={() => handleToggleStatus(record)}
                danger={record.isActive !== false}
              />
            </Tooltip>
          </Space>
          
          <Popconfirm
            title="Delete User"
            description="Are you sure you want to delete this user? This action cannot be undone."
            onConfirm={() => handleDeleteUser(record._id)}
            okText="Yes, Delete"
            cancelText="Cancel"
            okType="danger"
          >
            <Button
              size="small"
              icon={<DeleteOutlined />}
              danger
              disabled={record.role === 'admin' && stats.adminUsers <= 1}
            />
          </Popconfirm>
        </Space>
      ),
      width: 100,
      fixed: 'right'
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <Title level={2} style={{ margin: 0 }}>
            <TeamOutlined /> User Management
          </Title>
          <Space>
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={handleCreateUser}
            >
              Add New User
            </Button>
            <Button 
              icon={<ReloadOutlined />} 
              onClick={fetchUsers}
              loading={loading}
            >
              Refresh
            </Button>
          </Space>
        </div>

        {/* Stats Overview */}
        <Row gutter={16} style={{ marginBottom: '24px' }}>
          <Col span={6}>
            <Statistic
              title="Total Users"
              value={stats.totalUsers}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="Active Users"
              value={stats.activeUsers}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="Admin Users"
              value={stats.adminUsers}
              prefix={<LockOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="Departments"
              value={stats.departments}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Col>
        </Row>

        {/* Filters */}
        <Row gutter={16} style={{ marginBottom: '16px' }}>
          <Col span={8}>
            <Search
              placeholder="Search by name, email, or department"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              allowClear
            />
          </Col>
          <Col span={8}>
            <Select
              value={selectedDepartment}
              onChange={setSelectedDepartment}
              style={{ width: '100%' }}
              placeholder="Filter by Department"
            >
              <Option value="all">All Departments</Option>
              {departments.map(dept => (
                <Option key={dept} value={dept}>{dept}</Option>
              ))}
            </Select>
          </Col>
          <Col span={8}>
            <Select
              value={selectedRole}
              onChange={setSelectedRole}
              style={{ width: '100%' }}
              placeholder="Filter by Role"
            >
              <Option value="all">All Roles</Option>
              {roles.map(role => (
                <Option key={role} value={role}>{role.toUpperCase()}</Option>
              ))}
            </Select>
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={getFilteredUsers()}
          loading={loading}
          rowKey="_id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} users`
          }}
          scroll={{ x: 1000 }}
          size="small"
        />
      </Card>

      {/* Create/Edit User Modal */}
      <Modal
        title={
          <Space>
            <UserOutlined />
            {editingUser ? 'Edit User' : 'Create New User'}
          </Space>
        }
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditingUser(null);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="fullName"
                label="Full Name"
                rules={[{ required: true, message: 'Please enter full name' }]}
              >
                <Input placeholder="Enter full name" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="email"
                label="Email Address"
                rules={[
                  { required: true, message: 'Please enter email' },
                  { type: 'email', message: 'Please enter valid email' }
                ]}
              >
                <Input placeholder="Enter email address" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="department"
                label="Department"
                rules={[{ required: true, message: 'Please select department' }]}
              >
                <Select placeholder="Select department">
                  {departments.map(dept => (
                    <Option key={dept} value={dept}>{dept}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="position"
                label="Position/Title"
                rules={[{ required: true, message: 'Please enter position' }]}
              >
                <Input placeholder="Enter position/title" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="role"
                label="Role"
                rules={[{ required: true, message: 'Please select role' }]}
              >
                <Select placeholder="Select role">
                  {roles.map(role => (
                    <Option key={role} value={role}>{role.toUpperCase()}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="phone"
                label="Phone Number"
              >
                <Input placeholder="Enter phone number (optional)" />
              </Form.Item>
            </Col>
          </Row>

          {!editingUser && (
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="password"
                  label="Password"
                  rules={[
                    { required: true, message: 'Please enter password' },
                    { min: 6, message: 'Password must be at least 6 characters' }
                  ]}
                >
                  <Input.Password placeholder="Enter password" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="confirmPassword"
                  label="Confirm Password"
                  dependencies={['password']}
                  rules={[
                    { required: true, message: 'Please confirm password' },
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        if (!value || getFieldValue('password') === value) {
                          return Promise.resolve();
                        }
                        return Promise.reject(new Error('Passwords do not match!'));
                      },
                    }),
                  ]}
                >
                  <Input.Password placeholder="Confirm password" />
                </Form.Item>
              </Col>
            </Row>
          )}

          <Form.Item
            name="isActive"
            label="Account Status"
            valuePropName="checked"
          >
            <Switch 
              checkedChildren="Active" 
              unCheckedChildren="Inactive"
            />
          </Form.Item>

          <Divider />

          <Form.Item>
            <Space>
              <Button onClick={() => {
                setModalVisible(false);
                setEditingUser(null);
                form.resetFields();
              }}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                {editingUser ? 'Update User' : 'Create User'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AdminUserManagement;
