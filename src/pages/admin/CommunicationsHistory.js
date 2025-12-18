import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Card,
  Table,
  Button,
  Input,
  Select,
  Space,
  Tag,
  Typography,
  Row,
  Col,
  Badge,
  Tooltip,
  Dropdown,
  Menu,
  message,
  Modal
} from 'antd';
import {
  SearchOutlined,
  FilterOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  SendOutlined,
  MoreOutlined,
  DownloadOutlined,
  CopyOutlined
} from '@ant-design/icons';
import api from '../../services/api';

const { Title, Text } = Typography;
const { Option } = Select;

const CommunicationsHistory = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  
  const [loading, setLoading] = useState(false);
  const [communications, setCommunications] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0
  });
  
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    messageType: '',
    priority: ''
  });

  useEffect(() => {
    fetchCommunications();
  }, [pagination.current, pagination.pageSize, filters]);

  const fetchCommunications = async () => {
    try {
      setLoading(true);
      
      const params = {
        page: pagination.current,
        limit: pagination.pageSize,
        ...filters
      };
      
      // Remove empty filters
      Object.keys(params).forEach(key => {
        if (!params[key]) delete params[key];
      });

      const response = await api.get('/communications', { params });
      
      setCommunications(response.data.data);
      setPagination({
        ...pagination,
        total: response.data.pagination.total
      });
    } catch (error) {
      console.error('Error fetching communications:', error);
      message.error('Failed to load communications');
    } finally {
      setLoading(false);
    }
  };

  const handleTableChange = (newPagination) => {
    setPagination({
      ...pagination,
      current: newPagination.current,
      pageSize: newPagination.pageSize
    });
  };

  const handleSearch = (value) => {
    setFilters({ ...filters, search: value });
    setPagination({ ...pagination, current: 1 });
  };

  const handleFilterChange = (key, value) => {
    setFilters({ ...filters, [key]: value });
    setPagination({ ...pagination, current: 1 });
  };

  const handleDelete = (id) => {
    Modal.confirm({
      title: 'Delete Communication',
      content: 'Are you sure you want to delete this communication?',
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          await api.delete(`/communications/${id}`);
          message.success('Communication deleted');
          fetchCommunications();
        } catch (error) {
          message.error(error.response?.data?.message || 'Failed to delete');
        }
      }
    });
  };

  const handleDuplicate = async (id) => {
    try {
      const response = await api.get(`/communications/${id}`);
      const original = response.data.data;
      
      navigate('/admin/communications/new', {
        state: {
          template: {
            title: `Copy of ${original.title}`,
            content: original.content,
            messageType: original.messageType,
            priority: original.priority,
            recipients: original.recipients,
            deliveryMethod: original.deliveryMethod
          }
        }
      });
    } catch (error) {
      message.error('Failed to duplicate communication');
    }
  };

  const getActionMenu = (record) => (
    <Menu>
      <Menu.Item
        key="view"
        icon={<EyeOutlined />}
        onClick={() => navigate(`/admin/communications/${record._id}`)}
      >
        View Details
      </Menu.Item>
      
      {record.status !== 'sent' && (
        <>
          <Menu.Item
            key="edit"
            icon={<EditOutlined />}
            onClick={() => navigate(`/admin/communications/${record._id}/edit`)}
          >
            Edit
          </Menu.Item>
          
          {record.status === 'draft' && (
            <Menu.Item
              key="send"
              icon={<SendOutlined />}
              onClick={() => navigate(`/admin/communications/${record._id}/send`)}
            >
              Send Now
            </Menu.Item>
          )}
        </>
      )}
      
      <Menu.Item
        key="duplicate"
        icon={<CopyOutlined />}
        onClick={() => handleDuplicate(record._id)}
      >
        Duplicate
      </Menu.Item>
      
      <Menu.Divider />
      
      <Menu.Item
        key="delete"
        icon={<DeleteOutlined />}
        danger
        onClick={() => handleDelete(record._id)}
        disabled={record.status === 'sent' && user.role !== 'admin'}
      >
        Delete
      </Menu.Item>
    </Menu>
  );

  const columns = [
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      width: 250,
      render: (title, record) => (
        <div>
          <Button 
            type="link" 
            style={{ padding: 0, height: 'auto', fontWeight: 'bold' }}
            onClick={() => navigate(`/admin/communications/${record._id}`)}
          >
            {title}
          </Button>
          <br />
          <Text type="secondary" style={{ fontSize: '11px' }}>
            ID: COM-{record._id.slice(-6).toUpperCase()}
          </Text>
        </div>
      )
    },
    {
      title: 'Type',
      dataIndex: 'messageType',
      key: 'messageType',
      width: 120,
      filters: [
        { text: 'Announcement', value: 'announcement' },
        { text: 'Policy', value: 'policy' },
        { text: 'Emergency', value: 'emergency' },
        { text: 'Newsletter', value: 'newsletter' },
        { text: 'General', value: 'general' },
        { text: 'Training', value: 'training' },
        { text: 'Event', value: 'event' }
      ],
      render: (type) => {
        const colors = {
          announcement: 'blue',
          policy: 'purple',
          emergency: 'red',
          newsletter: 'green',
          general: 'default',
          training: 'orange',
          event: 'cyan'
        };
        return <Tag color={colors[type]}>{type}</Tag>;
      }
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      width: 100,
      filters: [
        { text: 'Urgent', value: 'urgent' },
        { text: 'Important', value: 'important' },
        { text: 'Normal', value: 'normal' }
      ],
      render: (priority) => {
        const colors = {
          urgent: 'red',
          important: 'orange',
          normal: 'default'
        };
        const icons = {
          urgent: '🚨',
          important: '⚠️',
          normal: ''
        };
        return (
          <Tag color={colors[priority]}>
            {icons[priority]} {priority}
          </Tag>
        );
      }
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 110,
      filters: [
        { text: 'Draft', value: 'draft' },
        { text: 'Scheduled', value: 'scheduled' },
        { text: 'Sending', value: 'sending' },
        { text: 'Sent', value: 'sent' },
        { text: 'Failed', value: 'failed' }
      ],
      render: (status) => {
        const config = {
          draft: { color: 'default', text: 'Draft' },
          scheduled: { color: 'blue', text: 'Scheduled' },
          sending: { color: 'processing', text: 'Sending...' },
          sent: { color: 'success', text: 'Sent' },
          failed: { color: 'error', text: 'Failed' }
        };
        return (
          <Tag color={config[status]?.color}>
            {config[status]?.text}
          </Tag>
        );
      }
    },
    {
      title: 'Recipients',
      dataIndex: ['recipients', 'totalCount'],
      key: 'recipients',
      width: 100,
      render: (count, record) => {
        const targetType = record.recipients.targetType;
        const icons = {
          all: '🌐',
          department: '🏢',
          role: '👥',
          custom: '✉️'
        };
        return (
          <Tooltip title={`Target: ${targetType}`}>
            <Badge 
              count={count} 
              style={{ backgroundColor: '#1890ff' }}
              overflowCount={9999}
            />
            <span style={{ marginLeft: '8px' }}>{icons[targetType]}</span>
          </Tooltip>
        );
      }
    },
    {
      title: 'Delivery Stats',
      key: 'stats',
      width: 150,
      render: (_, record) => {
        if (record.status !== 'sent') return <Text type="secondary">-</Text>;
        
        const { emailsSent, emailsFailed, readCount } = record.deliveryStats;
        const totalCount = record.recipients.totalCount;
        const readRate = totalCount > 0 
          ? ((readCount / totalCount) * 100).toFixed(0)
          : 0;
        
        return (
          <div>
            <div style={{ marginBottom: '4px' }}>
              <Tag color="green" style={{ margin: 0 }}>
                ✓ {emailsSent}
              </Tag>
              {emailsFailed > 0 && (
                <Tag color="red" style={{ margin: 0, marginLeft: '4px' }}>
                  ✗ {emailsFailed}
                </Tag>
              )}
            </div>
            <div>
              <Tag color="blue" style={{ margin: 0 }}>
                👁️ {readCount} ({readRate}%)
              </Tag>
            </div>
          </div>
        );
      }
    },
    {
      title: 'Sender',
      dataIndex: ['sender', 'fullName'],
      key: 'sender',
      width: 120,
      render: (name) => <Text>{name}</Text>
    },
    {
      title: 'Date',
      key: 'date',
      width: 140,
      sorter: true,
      render: (_, record) => {
        const date = record.sentAt || record.scheduledFor || record.createdAt;
        const label = record.sentAt ? 'Sent' : record.scheduledFor ? 'Scheduled' : 'Created';
        
        return (
          <div>
            <Text type="secondary" style={{ fontSize: '11px', display: 'block' }}>
              {label}
            </Text>
            <Text style={{ fontSize: '12px' }}>
              {new Date(date).toLocaleDateString()}
            </Text>
            <br />
            <Text type="secondary" style={{ fontSize: '11px' }}>
              {new Date(date).toLocaleTimeString()}
            </Text>
          </div>
        );
      }
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 80,
      fixed: 'right',
      render: (_, record) => (
        <Dropdown overlay={getActionMenu(record)} trigger={['click']}>
          <Button type="text" icon={<MoreOutlined />} />
        </Dropdown>
      )
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <Title level={2}>Communications History</Title>
        <Text type="secondary">
          View and manage all communications
        </Text>
        
        <div style={{ marginTop: '24px', marginBottom: '16px' }}>
          <Row gutter={16}>
            <Col xs={24} sm={12} md={8}>
              <Input
                placeholder="Search title or content..."
                prefix={<SearchOutlined />}
                value={filters.search}
                onChange={(e) => handleSearch(e.target.value)}
                allowClear
              />
            </Col>
            
            <Col xs={24} sm={12} md={4}>
              <Select
                placeholder="Status"
                style={{ width: '100%' }}
                value={filters.status}
                onChange={(value) => handleFilterChange('status', value)}
                allowClear
              >
                <Option value="draft">Draft</Option>
                <Option value="scheduled">Scheduled</Option>
                <Option value="sent">Sent</Option>
                <Option value="failed">Failed</Option>
              </Select>
            </Col>
            
            <Col xs={24} sm={12} md={4}>
              <Select
                placeholder="Type"
                style={{ width: '100%' }}
                value={filters.messageType}
                onChange={(value) => handleFilterChange('messageType', value)}
                allowClear
              >
                <Option value="general">General</Option>
                <Option value="announcement">Announcement</Option>
                <Option value="policy">Policy</Option>
                <Option value="emergency">Emergency</Option>
                <Option value="newsletter">Newsletter</Option>
              </Select>
            </Col>
            
            <Col xs={24} sm={12} md={4}>
              <Select
                placeholder="Priority"
                style={{ width: '100%' }}
                value={filters.priority}
                onChange={(value) => handleFilterChange('priority', value)}
                allowClear
              >
                <Option value="normal">Normal</Option>
                <Option value="important">Important</Option>
                <Option value="urgent">Urgent</Option>
              </Select>
            </Col>
            
            <Col xs={24} sm={12} md={4}>
              <Button
                icon={<DownloadOutlined />}
                onClick={() => message.info('Export feature coming soon')}
                style={{ width: '100%' }}
              >
                Export
              </Button>
            </Col>
          </Row>
        </div>

        <Table
          columns={columns}
          dataSource={communications}
          rowKey="_id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} communications`
          }}
          onChange={handleTableChange}
          scroll={{ x: 1200 }}
        />
      </Card>
    </div>
  );
};

export default CommunicationsHistory;