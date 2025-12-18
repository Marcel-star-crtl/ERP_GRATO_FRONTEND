import React, { useState, useEffect } from 'react';
import {
  Modal, Form, Input, Select, Button, Table, Space, Tag, message,
  Divider, Typography, Tooltip, Popconfirm, Alert, Spin, Avatar
} from 'antd';
import {
  UserAddOutlined, DeleteOutlined, EditOutlined, SearchOutlined,
  LockOutlined, UnlockOutlined, UserOutlined, TeamOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import sharepointAPI from '../../services/sharePointAPI';

const { Option } = Select;
const { Text } = Typography;
const { Search } = Input;

const ManageAccessModal = ({ visible, onClose, folder, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [accessList, setAccessList] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [invitePermission, setInvitePermission] = useState('download');

  useEffect(() => {
    if (visible && folder) {
      fetchAccessList();
    }
  }, [visible, folder]);

  const fetchAccessList = async () => {
    try {
      setLoading(true);
      const response = await sharepointAPI.getFolderAccess(folder._id);
      setAccessList(response.data.data);
    } catch (error) {
      message.error('Failed to load access list');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchUsers = async (value) => {
    if (!value || value.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      setSearchLoading(true);
      const response = await sharepointAPI.searchUsers(value);
      setSearchResults(response.data.data || []);
    } catch (error) {
      message.error('Failed to search users');
    } finally {
      setSearchLoading(false);
    }
  };

  const handleInviteUsers = async () => {
    if (selectedUsers.length === 0) {
      message.warning('Please select at least one user');
      return;
    }

    try {
      setLoading(true);
      await sharepointAPI.inviteUsersToFolder(folder._id, {
        userEmails: selectedUsers.map(u => u.email),
        permission: invitePermission
      });

      message.success(`${selectedUsers.length} user(s) invited successfully`);
      setSelectedUsers([]);
      setSearchResults([]);
      fetchAccessList();
      if (onSuccess) onSuccess();
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to invite users');
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeAccess = async (userId) => {
    try {
      await sharepointAPI.revokeUserAccess(folder._id, userId);
      message.success('Access revoked successfully');
      fetchAccessList();
      if (onSuccess) onSuccess();
    } catch (error) {
      message.error('Failed to revoke access');
    }
  };

  const handleUpdatePermission = async (userId, newPermission) => {
    try {
      await sharepointAPI.updateUserPermission(folder._id, userId, { permission: newPermission });
      message.success('Permission updated successfully');
      fetchAccessList();
      if (onSuccess) onSuccess();
    } catch (error) {
      message.error('Failed to update permission');
    }
  };

  const handleBlockUser = async (values) => {
    try {
      await sharepointAPI.blockUserFromFolder(folder._id, {
        userEmail: values.userEmail,
        reason: values.reason
      });
      message.success('User blocked successfully');
      fetchAccessList();
      form.resetFields();
    } catch (error) {
      message.error('Failed to block user');
    }
  };

  const handleUnblockUser = async (userId) => {
    try {
      await sharepointAPI.unblockUserFromFolder(folder._id, userId);
      message.success('User unblocked successfully');
      fetchAccessList();
    } catch (error) {
      message.error('Failed to unblock user');
    }
  };

  const permissionColors = {
    view: 'blue',
    download: 'green',
    upload: 'orange',
    manage: 'purple'
  };

  const permissionLabels = {
    view: 'View Only',
    download: 'Download',
    upload: 'Upload',
    manage: 'Manage'
  };

  const invitedUsersColumns = [
    {
      title: 'User',
      key: 'user',
      render: (_, record) => (
        <Space>
          <Avatar size="small" icon={<UserOutlined />} />
          <div>
            <div><Text strong>{record.userId.fullName}</Text></div>
            <Text type="secondary" style={{ fontSize: '12px' }}>{record.userId.email}</Text>
          </div>
        </Space>
      )
    },
    {
      title: 'Department',
      dataIndex: ['userId', 'department'],
      key: 'department',
      render: (dept) => <Tag icon={<TeamOutlined />}>{dept}</Tag>
    },
    {
      title: 'Permission',
      dataIndex: 'permission',
      key: 'permission',
      render: (permission, record) => (
        <Select
          value={permission}
          size="small"
          style={{ width: 120 }}
          onChange={(value) => handleUpdatePermission(record.userId._id, value)}
        >
          <Option value="view">
            <Tag color={permissionColors.view}>{permissionLabels.view}</Tag>
          </Option>
          <Option value="download">
            <Tag color={permissionColors.download}>{permissionLabels.download}</Tag>
          </Option>
          <Option value="upload">
            <Tag color={permissionColors.upload}>{permissionLabels.upload}</Tag>
          </Option>
          <Option value="manage">
            <Tag color={permissionColors.manage}>{permissionLabels.manage}</Tag>
          </Option>
        </Select>
      )
    },
    {
      title: 'Invited',
      key: 'invited',
      render: (_, record) => (
        <Text type="secondary" style={{ fontSize: '12px' }}>
          {new Date(record.invitedAt).toLocaleDateString()}
        </Text>
      )
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Popconfirm
          title="Remove access?"
          description="This user will no longer have access to this folder"
          onConfirm={() => handleRevokeAccess(record.userId._id)}
          okText="Remove"
          cancelText="Cancel"
        >
          <Button type="link" danger size="small" icon={<DeleteOutlined />}>
            Remove
          </Button>
        </Popconfirm>
      )
    }
  ];

  const blockedUsersColumns = [
    {
      title: 'User',
      key: 'user',
      render: (_, record) => (
        <Space>
          <Avatar size="small" icon={<UserOutlined />} style={{ backgroundColor: '#ff4d4f' }} />
          <div>
            <div><Text strong>{record.userId.fullName}</Text></div>
            <Text type="secondary" style={{ fontSize: '12px' }}>{record.userId.email}</Text>
          </div>
        </Space>
      )
    },
    {
      title: 'Reason',
      dataIndex: 'reason',
      key: 'reason',
      render: (reason) => <Text type="secondary">{reason || 'No reason'}</Text>
    },
    {
      title: 'Blocked',
      key: 'blocked',
      render: (_, record) => (
        <Text type="secondary" style={{ fontSize: '12px' }}>
          {new Date(record.blockedAt).toLocaleDateString()}
        </Text>
      )
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Button
          type="link"
          size="small"
          icon={<UnlockOutlined />}
          onClick={() => handleUnblockUser(record.userId._id)}
        >
          Unblock
        </Button>
      )
    }
  ];

  return (
    <Modal
      title={
        <Space>
          <LockOutlined />
          <span>Manage Access: {folder?.name}</span>
        </Space>
      }
      open={visible}
      onCancel={onClose}
      width={900}
      footer={null}
      destroyOnClose
    >
      {loading && !accessList ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <Spin size="large" />
        </div>
      ) : (
        <>
          {/* Folder Info */}
          <Alert
            message={
              <Space>
                <Tag color={folder?.privacyLevel === 'confidential' ? 'red' : folder?.privacyLevel === 'public' ? 'green' : 'blue'}>
                  {folder?.privacyLevel?.toUpperCase()}
                </Tag>
                <Text>
                  {folder?.privacyLevel === 'confidential' && 'Only invited users can see and access this folder'}
                  {folder?.privacyLevel === 'department' && 'Department members have default access'}
                  {folder?.privacyLevel === 'public' && 'Everyone in the organization can access'}
                </Text>
              </Space>
            }
            type="info"
            style={{ marginBottom: '20px' }}
            showIcon
          />

          {/* Invite Users Section */}
          <div style={{ marginBottom: '20px', padding: '16px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
            <Text strong style={{ display: 'block', marginBottom: '12px' }}>
              <UserAddOutlined /> Invite Users
            </Text>
            
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              <Search
                placeholder="Search users by name or email..."
                onSearch={handleSearchUsers}
                onChange={(e) => handleSearchUsers(e.target.value)}
                loading={searchLoading}
                prefix={<SearchOutlined />}
                allowClear
              />

              {searchResults.length > 0 && (
                <div style={{ maxHeight: '150px', overflowY: 'auto', border: '1px solid #d9d9d9', borderRadius: '4px', padding: '8px' }}>
                  {searchResults.map(user => (
                    <div
                      key={user._id}
                      style={{
                        padding: '8px',
                        marginBottom: '4px',
                        backgroundColor: selectedUsers.find(u => u._id === user._id) ? '#e6f7ff' : 'white',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                      onClick={() => {
                        const isSelected = selectedUsers.find(u => u._id === user._id);
                        if (isSelected) {
                          setSelectedUsers(selectedUsers.filter(u => u._id !== user._id));
                        } else {
                          setSelectedUsers([...selectedUsers, user]);
                        }
                      }}
                    >
                      <Space>
                        <Avatar size="small" icon={<UserOutlined />} />
                        <div>
                          <div><Text strong>{user.fullName}</Text></div>
                          <Text type="secondary" style={{ fontSize: '12px' }}>{user.email} • {user.department}</Text>
                        </div>
                      </Space>
                      {selectedUsers.find(u => u._id === user._id) && (
                        <CheckCircleOutlined style={{ color: '#52c41a' }} />
                      )}
                    </div>
                  ))}
                </div>
              )}

              {selectedUsers.length > 0 && (
                <div style={{ padding: '12px', backgroundColor: 'white', borderRadius: '4px', border: '1px solid #d9d9d9' }}>
                  <Text strong style={{ display: 'block', marginBottom: '8px' }}>
                    Selected Users ({selectedUsers.length})
                  </Text>
                  <Space wrap>
                    {selectedUsers.map(user => (
                      <Tag
                        key={user._id}
                        closable
                        onClose={() => setSelectedUsers(selectedUsers.filter(u => u._id !== user._id))}
                      >
                        {user.fullName}
                      </Tag>
                    ))}
                  </Space>
                </div>
              )}

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Select
                  value={invitePermission}
                  onChange={setInvitePermission}
                  style={{ width: 200 }}
                >
                  <Option value="view">
                    <Tag color={permissionColors.view}>{permissionLabels.view}</Tag>
                  </Option>
                  <Option value="download">
                    <Tag color={permissionColors.download}>{permissionLabels.download}</Tag>
                  </Option>
                  <Option value="upload">
                    <Tag color={permissionColors.upload}>{permissionLabels.upload}</Tag>
                  </Option>
                  <Option value="manage">
                    <Tag color={permissionColors.manage}>{permissionLabels.manage}</Tag>
                  </Option>
                </Select>

                <Button
                  type="primary"
                  icon={<UserAddOutlined />}
                  onClick={handleInviteUsers}
                  disabled={selectedUsers.length === 0}
                  loading={loading}
                >
                  Invite {selectedUsers.length > 0 && `(${selectedUsers.length})`}
                </Button>
              </Space>
            </Space>
          </div>

          <Divider />

          {/* Current Access List */}
          <div style={{ marginBottom: '20px' }}>
            <Text strong style={{ display: 'block', marginBottom: '12px' }}>
              Invited Users ({accessList?.invitedUsers?.length || 0})
            </Text>
            <Table
              columns={invitedUsersColumns}
              dataSource={accessList?.invitedUsers || []}
              rowKey={(record) => record.userId._id}
              pagination={false}
              size="small"
              locale={{ emptyText: 'No users invited yet' }}
            />
          </div>

          <Divider />

          {/* Blocked Users */}
          <div>
            <Text strong style={{ display: 'block', marginBottom: '12px' }}>
              Blocked Users ({accessList?.blockedUsers?.length || 0})
            </Text>
            <Table
              columns={blockedUsersColumns}
              dataSource={accessList?.blockedUsers || []}
              rowKey={(record) => record.userId._id}
              pagination={false}
              size="small"
              locale={{ emptyText: 'No blocked users' }}
            />
          </div>

          <Divider />

          {/* Block User Form */}
          <div style={{ padding: '16px', backgroundColor: '#fff1f0', borderRadius: '8px' }}>
            <Text strong style={{ display: 'block', marginBottom: '12px' }}>
              <LockOutlined /> Block User
            </Text>
            <Form form={form} layout="inline" onFinish={handleBlockUser}>
              <Form.Item
                name="userEmail"
                rules={[{ required: true, type: 'email', message: 'Enter valid email' }]}
                style={{ flex: 1 }}
              >
                <Input placeholder="User email to block" />
              </Form.Item>
              <Form.Item
                name="reason"
                style={{ flex: 1 }}
              >
                <Input placeholder="Reason (optional)" />
              </Form.Item>
              <Form.Item>
                <Button type="primary" danger htmlType="submit">
                  Block
                </Button>
              </Form.Item>
            </Form>
          </div>
        </>
      )}
    </Modal>
  );
};

export default ManageAccessModal;