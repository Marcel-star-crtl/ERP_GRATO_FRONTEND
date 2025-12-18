// src/pages/hr/EmployeeManagement.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Card,
  Table,
  Button,
  Space,
  Input,
  Select,
  Tag,
  Typography,
  Row,
  Col,
  Modal,
  message,
  Dropdown,
  Menu,
  Badge,
  Tooltip
} from 'antd';
import {
  SearchOutlined,
  PlusOutlined,
  FilterOutlined,
  ExportOutlined,
  ReloadOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  MoreOutlined,
  FileTextOutlined,
  FolderOutlined,
  UserSwitchOutlined,
  TeamOutlined,
  DownloadOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import api from '../../services/api';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;

const EmployeeManagement = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    department: searchParams.get('department') || '',
    status: searchParams.get('status') || '',
    contractType: searchParams.get('contractType') || ''
  });

  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    fetchEmployees();
    fetchDepartments();
  }, [pagination.current, pagination.pageSize, filters]);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      
      const params = {
        page: pagination.current,
        limit: pagination.pageSize,
        search: filters.search,
        department: filters.department,
        status: filters.status,
        contractType: filters.contractType
      };

      const response = await api.get('/hr/employees', { params });
      
      setEmployees(response.data.data || []);
      setPagination(prev => ({
        ...prev,
        total: response.data.pagination?.total || 0
      }));

    } catch (error) {
      console.error('Error fetching employees:', error);
      message.error('Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await api.get('/hr/employees/statistics');
      if (response.data.data?.departmentDistribution) {
        setDepartments(Object.keys(response.data.data.departmentDistribution));
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const handleSearch = (value) => {
    setFilters(prev => ({ ...prev, search: value }));
    setPagination(prev => ({ ...prev, current: 1 }));
    updateSearchParams({ search: value });
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, current: 1 }));
    updateSearchParams({ [key]: value });
  };

  const updateSearchParams = (newParams) => {
    const params = new URLSearchParams(searchParams);
    Object.entries(newParams).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });
    setSearchParams(params);
  };

  const handleTableChange = (pagination) => {
    setPagination(pagination);
  };

  const handleStatusChange = async (employeeId, newStatus) => {
    Modal.confirm({
      title: 'Change Employee Status',
      content: `Are you sure you want to change this employee's status to "${newStatus}"?`,
      onOk: async () => {
        try {
          await api.patch(`/hr/employees/${employeeId}/status`, {
            status: newStatus
          });
          message.success('Employee status updated successfully');
          fetchEmployees();
        } catch (error) {
          message.error(error.response?.data?.message || 'Failed to update status');
        }
      }
    });
  };

  const handleDelete = (employeeId) => {
    Modal.confirm({
      title: 'Deactivate Employee',
      content: 'Are you sure you want to deactivate this employee? This action can be reversed.',
      okText: 'Deactivate',
      okType: 'danger',
      onOk: async () => {
        try {
          await api.delete(`/hr/employees/${employeeId}`);
          message.success('Employee deactivated successfully');
          fetchEmployees();
        } catch (error) {
          message.error(error.response?.data?.message || 'Failed to deactivate employee');
        }
      }
    });
  };

  const handleExport = async () => {
    try {
      const response = await api.get('/hr/employees/export', {
        params: filters,
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `employees-${dayjs().format('YYYY-MM-DD')}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      message.success('Employee data exported successfully');
    } catch (error) {
      message.error('Failed to export employee data');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'Active': 'green',
      'Probation': 'blue',
      'On Leave': 'orange',
      'Suspended': 'red',
      'Notice Period': 'purple',
      'Inactive': 'default',
      'Terminated': 'red'
    };
    return colors[status] || 'default';
  };

  const getActionMenu = (record) => (
    <Menu>
      <Menu.Item
        key="view"
        icon={<EyeOutlined />}
        onClick={() => navigate(`/hr/employees/${record._id}`)}
      >
        View Profile
      </Menu.Item>
      <Menu.Item
        key="edit"
        icon={<EditOutlined />}
        onClick={() => navigate(`/hr/employees/${record._id}/edit`)}
      >
        Edit Details
      </Menu.Item>
      <Menu.Item
        key="documents"
        icon={<FolderOutlined />}
        onClick={() => navigate(`/hr/employees/${record._id}?tab=documents`)}
      >
        Manage Documents
      </Menu.Item>
      <Menu.Item
        key="contract"
        icon={<FileTextOutlined />}
        onClick={() => navigate(`/hr/employees/${record._id}?tab=employment`)}
      >
        View Contract
      </Menu.Item>
      <Menu.Divider />
      <Menu.SubMenu key="status" icon={<UserSwitchOutlined />} title="Change Status">
        {['Active', 'On Leave', 'Suspended', 'Notice Period', 'Inactive'].map(status => (
          <Menu.Item
            key={status}
            onClick={() => handleStatusChange(record._id, status)}
            disabled={record.employmentDetails?.employmentStatus === status}
          >
            {status}
          </Menu.Item>
        ))}
      </Menu.SubMenu>
      <Menu.Divider />
      <Menu.Item
        key="delete"
        icon={<DeleteOutlined />}
        danger
        onClick={() => handleDelete(record._id)}
      >
        Deactivate
      </Menu.Item>
    </Menu>
  );

  const columns = [
    {
      title: 'Employee',
      key: 'employee',
      fixed: 'left',
      width: 220,
      render: (_, record) => (
        <div>
          <Text strong style={{ display: 'block' }}>{record.fullName}</Text>
          <Text type="secondary" style={{ fontSize: '12px', display: 'block' }}>
            {record.email}
          </Text>
          {record.employmentDetails?.employeeId && (
            <Text code style={{ fontSize: '11px' }}>
              {record.employmentDetails.employeeId}
            </Text>
          )}
        </div>
      )
    },
    {
      title: 'Department',
      dataIndex: 'department',
      key: 'department',
      width: 150,
      render: (dept, record) => (
        <div>
          <Text>{dept}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: '11px' }}>
            {record.position}
          </Text>
        </div>
      )
    },
    {
      title: 'Status',
      key: 'status',
      width: 120,
      filters: [
        { text: 'Active', value: 'Active' },
        { text: 'Probation', value: 'Probation' },
        { text: 'On Leave', value: 'On Leave' },
        { text: 'Suspended', value: 'Suspended' },
        { text: 'Notice Period', value: 'Notice Period' },
        { text: 'Inactive', value: 'Inactive' }
      ],
      render: (_, record) => (
        <Tag color={getStatusColor(record.employmentDetails?.employmentStatus)}>
          {record.employmentDetails?.employmentStatus || 'N/A'}
        </Tag>
      )
    },
    {
      title: 'Contract Type',
      dataIndex: ['employmentDetails', 'contractType'],
      key: 'contractType',
      width: 140,
      render: (type) => type ? <Tag>{type}</Tag> : <Text type="secondary">N/A</Text>
    },
    {
      title: 'Start Date',
      dataIndex: ['employmentDetails', 'startDate'],
      key: 'startDate',
      width: 120,
      render: (date) => date ? dayjs(date).format('MMM DD, YYYY') : 'N/A',
      sorter: true
    },
    {
      title: 'Contract End',
      dataIndex: ['employmentDetails', 'contractEndDate'],
      key: 'contractEndDate',
      width: 140,
      render: (date, record) => {
        if (!date) return <Text type="secondary">Permanent</Text>;
        
        const daysRemaining = dayjs(date).diff(dayjs(), 'days');
        const isExpiringSoon = daysRemaining <= 30;
        
        return (
          <div>
            <Text type={isExpiringSoon ? 'danger' : undefined}>
              {dayjs(date).format('MMM DD, YYYY')}
            </Text>
            {isExpiringSoon && (
              <div>
                <Badge status="warning" />
                <Text type="danger" style={{ fontSize: '11px' }}>
                  {daysRemaining} days left
                </Text>
              </div>
            )}
          </div>
        );
      }
    },
    {
      title: 'Documents',
      key: 'documents',
      width: 100,
      render: (_, record) => {
        const requiredDocs = 10; // Total required documents
        const uploadedDocs = record.employmentDetails?.documents 
          ? Object.values(record.employmentDetails.documents).filter(doc => 
              doc && (doc.filename || doc.filePath)
            ).length 
          : 0;
        
        const percentage = Math.round((uploadedDocs / requiredDocs) * 100);
        const isComplete = percentage === 100;
        
        return (
          <Tooltip title={`${uploadedDocs}/${requiredDocs} documents uploaded`}>
            <Badge 
              count={isComplete ? <CheckCircleOutlined style={{ color: '#52c41a' }} /> : uploadedDocs}
              showZero
              style={{ backgroundColor: isComplete ? '#52c41a' : percentage > 50 ? '#faad14' : '#ff4d4f' }}
            >
              <FolderOutlined style={{ fontSize: '18px' }} />
            </Badge>
          </Tooltip>
        );
      }
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 100,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/hr/employees/${record._id}`)}
          >
            View
          </Button>
          <Dropdown overlay={getActionMenu(record)} trigger={['click']}>
            <Button type="text" size="small" icon={<MoreOutlined />} />
          </Dropdown>
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <Row justify="space-between" align="middle" gutter={[16, 16]}>
            <Col>
              <Title level={2} style={{ margin: 0 }}>
                <TeamOutlined /> Employee Management
              </Title>
              <Text type="secondary">
                {pagination.total} employee{pagination.total !== 1 ? 's' : ''} found
              </Text>
            </Col>
            <Col>
              <Space>
                <Button
                  icon={<ExportOutlined />}
                  onClick={handleExport}
                >
                  Export
                </Button>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={fetchEmployees}
                  loading={loading}
                >
                  Refresh
                </Button>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => navigate('/hr/employees/new')}
                >
                  Add Employee
                </Button>
              </Space>
            </Col>
          </Row>
        </div>

        {/* Filters */}
        <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Input
              placeholder="Search by name or email..."
              prefix={<SearchOutlined />}
              value={filters.search}
              onChange={(e) => handleSearch(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Select
              placeholder="Filter by Department"
              value={filters.department || undefined}
              onChange={(value) => handleFilterChange('department', value)}
              style={{ width: '100%' }}
              allowClear
            >
              {departments.map(dept => (
                <Option key={dept} value={dept}>{dept}</Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Select
              placeholder="Filter by Status"
              value={filters.status || undefined}
              onChange={(value) => handleFilterChange('status', value)}
              style={{ width: '100%' }}
              allowClear
            >
              <Option value="Active">Active</Option>
              <Option value="Probation">Probation</Option>
              <Option value="On Leave">On Leave</Option>
              <Option value="Suspended">Suspended</Option>
              <Option value="Notice Period">Notice Period</Option>
              <Option value="Inactive">Inactive</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Select
              placeholder="Filter by Contract Type"
              value={filters.contractType || undefined}
              onChange={(value) => handleFilterChange('contractType', value)}
              style={{ width: '100%' }}
              allowClear
            >
              <Option value="Permanent">Permanent</Option>
              <Option value="Fixed-Term Contract">Fixed-Term Contract</Option>
              <Option value="Probation">Probation</Option>
              <Option value="Intern">Intern</Option>
              <Option value="Consultant">Consultant</Option>
            </Select>
          </Col>
        </Row>

        {/* Table */}
        <Table
          columns={columns}
          dataSource={employees}
          rowKey="_id"
          loading={loading}
          pagination={pagination}
          onChange={handleTableChange}
          scroll={{ x: 1400 }}
          size="small"
        />
      </Card>
    </div>
  );
};

export default EmployeeManagement;