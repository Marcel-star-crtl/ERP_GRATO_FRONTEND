// src/pages/hr/ContractManagement.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Typography,
  Row,
  Col,
  Select,
  message,
  Modal,
  Form,
  Input,
  DatePicker,
  Alert,
  Statistic
} from 'antd';
import {
  FileTextOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  ReloadOutlined,
  FilterOutlined,
  SendOutlined
} from '@ant-design/icons';
import api from '../../services/api';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const ContractManagement = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [loading, setLoading] = useState(false);
  const [contracts, setContracts] = useState([]);
  const [stats, setStats] = useState({
    expiring: 0,
    probation: 0,
    renewal: 0
  });
  const [filter, setFilter] = useState(searchParams.get('filter') || 'all');
  const [renewalModal, setRenewalModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchContracts();
    fetchStats();
  }, [filter]);

  const fetchContracts = async () => {
    try {
      setLoading(true);
      
      let url = '/hr/employees?';
      if (filter === 'expiring') {
        url += 'contractExpiring=30';
      } else if (filter === 'probation') {
        url += 'status=Probation';
      }

      const response = await api.get(url);
      setContracts(response.data.data || []);
    } catch (error) {
      console.error('Error fetching contracts:', error);
      message.error('Failed to load contracts');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/hr/contracts/expiring');
      const expiringData = response.data.data || [];
      
      const probationResponse = await api.get('/hr/employees?status=Probation');
      const probationData = probationResponse.data.data || [];

      setStats({
        expiring: expiringData.length,
        probation: probationData.filter(emp => {
          const daysLeft = dayjs(emp.employmentDetails?.probationEndDate).diff(dayjs(), 'days');
          return daysLeft <= 14 && daysLeft > 0;
        }).length,
        renewal: 0 // Will be populated from backend
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const openRenewalModal = (employee) => {
    setSelectedEmployee(employee);
    form.setFieldsValue({
      newEndDate: dayjs(employee.employmentDetails?.contractEndDate).add(1, 'year'),
      contractType: employee.employmentDetails?.contractType
    });
    setRenewalModal(true);
  };

  const handleRenewal = async (values) => {
    try {
      await api.post(`/hr/contracts/${selectedEmployee._id}/renew`, {
        newEndDate: values.newEndDate.format('YYYY-MM-DD'),
        contractType: values.contractType,
        notes: values.notes
      });

      message.success('Contract renewal request submitted for admin approval');
      setRenewalModal(false);
      form.resetFields();
      fetchContracts();
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to submit renewal request');
    }
  };

  const confirmProbation = async (employeeId) => {
    Modal.confirm({
      title: 'Confirm Probation Completion',
      content: 'This will convert the employee to permanent status. Continue?',
      onOk: async () => {
        try {
          await api.patch(`/hr/employees/${employeeId}/status`, {
            status: 'Active'
          });
          await api.put(`/hr/employees/${employeeId}`, {
            employmentDetails: {
              contractType: 'Permanent',
              employmentStatus: 'Active'
            }
          });
          message.success('Employee confirmed as permanent');
          fetchContracts();
        } catch (error) {
          message.error('Failed to confirm probation');
        }
      }
    });
  };

  const columns = [
    {
      title: 'Employee',
      key: 'employee',
      render: (_, record) => (
        <div>
          <Text strong style={{ display: 'block' }}>{record.fullName}</Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.department}
          </Text>
        </div>
      )
    },
    {
      title: 'Contract Type',
      dataIndex: ['employmentDetails', 'contractType'],
      key: 'contractType',
      render: (type) => <Tag>{type}</Tag>
    },
    {
      title: 'Start Date',
      dataIndex: ['employmentDetails', 'startDate'],
      key: 'startDate',
      render: (date) => dayjs(date).format('MMM DD, YYYY')
    },
    {
      title: 'End Date',
      key: 'endDate',
      render: (_, record) => {
        const endDate = record.employmentDetails?.contractEndDate || 
                       record.employmentDetails?.probationEndDate;
        
        if (!endDate) return <Text type="secondary">Permanent</Text>;
        
        const daysLeft = dayjs(endDate).diff(dayjs(), 'days');
        const isExpiring = daysLeft <= 30 && daysLeft > 0;
        
        return (
          <div>
            <Text type={isExpiring ? 'danger' : undefined}>
              {dayjs(endDate).format('MMM DD, YYYY')}
            </Text>
            {isExpiring && (
              <div>
                <WarningOutlined style={{ color: '#ff4d4f', marginRight: '4px' }} />
                <Text type="danger" style={{ fontSize: '11px' }}>
                  {daysLeft} days left
                </Text>
              </div>
            )}
          </div>
        );
      },
      sorter: (a, b) => {
        const aDate = a.employmentDetails?.contractEndDate || a.employmentDetails?.probationEndDate;
        const bDate = b.employmentDetails?.contractEndDate || b.employmentDetails?.probationEndDate;
        if (!aDate) return 1;
        if (!bDate) return -1;
        return dayjs(aDate).diff(dayjs(bDate));
      }
    },
    {
      title: 'Status',
      dataIndex: ['employmentDetails', 'employmentStatus'],
      key: 'status',
      render: (status) => {
        const colors = {
          'Active': 'green',
          'Probation': 'blue',
          'On Leave': 'orange',
          'Suspended': 'red'
        };
        return <Tag color={colors[status]}>{status}</Tag>;
      }
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => {
        const isProbation = record.employmentDetails?.employmentStatus === 'Probation';
        const hasEndDate = record.employmentDetails?.contractEndDate;
        const daysLeft = hasEndDate 
          ? dayjs(record.employmentDetails.contractEndDate).diff(dayjs(), 'days')
          : null;

        return (
          <Space size="small">
            <Button
              type="link"
              size="small"
              onClick={() => navigate(`/hr/employees/${record._id}?tab=employment`)}
            >
              View
            </Button>
            
            {isProbation && (
              <Button
                type="link"
                size="small"
                onClick={() => confirmProbation(record._id)}
              >
                Confirm
              </Button>
            )}
            
            {hasEndDate && daysLeft <= 60 && daysLeft > 0 && (
              <Button
                type="primary"
                size="small"
                icon={<SendOutlined />}
                onClick={() => openRenewalModal(record)}
              >
                Renew
              </Button>
            )}
          </Space>
        );
      }
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <Row justify="space-between" align="middle">
            <Col>
              <Title level={2} style={{ margin: 0 }}>
                <FileTextOutlined /> Contract Management
              </Title>
            </Col>
            <Col>
              <Space>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={() => {
                    fetchContracts();
                    fetchStats();
                  }}
                  loading={loading}
                >
                  Refresh
                </Button>
              </Space>
            </Col>
          </Row>
        </div>

        {/* Statistics */}
        <Row gutter={16} style={{ marginBottom: '24px' }}>
          <Col xs={24} sm={8}>
            <Card size="small">
              <Statistic
                title="Contracts Expiring (30 days)"
                value={stats.expiring}
                prefix={<WarningOutlined />}
                valueStyle={{ color: '#ff4d4f' }}
              />
              <Button
                type="link"
                size="small"
                onClick={() => setFilter('expiring')}
                style={{ padding: 0, marginTop: '8px' }}
              >
                View All
              </Button>
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card size="small">
              <Statistic
                title="Probation Ending Soon"
                value={stats.probation}
                prefix={<ClockCircleOutlined />}
                valueStyle={{ color: '#faad14' }}
              />
              <Button
                type="link"
                size="small"
                onClick={() => setFilter('probation')}
                style={{ padding: 0, marginTop: '8px' }}
              >
                View All
              </Button>
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card size="small">
              <Statistic
                title="Pending Renewal"
                value={stats.renewal}
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
        </Row>

        {/* Alerts */}
        {stats.expiring > 0 && (
          <Alert
            message={`${stats.expiring} contract(s) expiring in the next 30 days`}
            description="Review and process renewals to avoid employment gaps"
            type="warning"
            showIcon
            closable
            style={{ marginBottom: '16px' }}
          />
        )}

        {stats.probation > 0 && (
          <Alert
            message={`${stats.probation} employee(s) completing probation soon`}
            description="Complete evaluations and confirm permanent employment status"
            type="info"
            showIcon
            closable
            style={{ marginBottom: '16px' }}
          />
        )}

        {/* Filters */}
        <Row style={{ marginBottom: '16px' }}>
          <Col>
            <Space>
              <Text>Filter: </Text>
              <Select
                value={filter}
                onChange={setFilter}
                style={{ width: '200px' }}
              >
                <Option value="all">All Contracts</Option>
                <Option value="expiring">Expiring Soon</Option>
                <Option value="probation">Probation Period</Option>
              </Select>
            </Space>
          </Col>
        </Row>

        {/* Table */}
        <Table
          columns={columns}
          dataSource={contracts}
          rowKey="_id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      {/* Renewal Modal */}
      <Modal
        title="Contract Renewal Request"
        open={renewalModal}
        onCancel={() => {
          setRenewalModal(false);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        {selectedEmployee && (
          <>
            <Alert
              message="Admin Approval Required"
              description="Contract renewals require approval from the Head of Business (Admin). The employee will be notified once approved."
              type="info"
              showIcon
              style={{ marginBottom: '16px' }}
            />

            <Card size="small" style={{ marginBottom: '16px', backgroundColor: '#fafafa' }}>
              <Space direction="vertical">
                <Text strong>{selectedEmployee.fullName}</Text>
                <Text type="secondary">{selectedEmployee.department} - {selectedEmployee.position}</Text>
                <Text>
                  Current Contract: {selectedEmployee.employmentDetails?.contractType}
                </Text>
                <Text>
                  Expires: {dayjs(selectedEmployee.employmentDetails?.contractEndDate).format('MMM DD, YYYY')}
                </Text>
              </Space>
            </Card>

            <Form
              form={form}
              layout="vertical"
              onFinish={handleRenewal}
            >
              <Form.Item
                name="contractType"
                label="New Contract Type"
                rules={[{ required: true, message: 'Please select contract type' }]}
              >
                <Select>
                  <Option value="Permanent">Permanent</Option>
                  <Option value="Fixed-Term Contract">Fixed-Term Contract</Option>
                </Select>
              </Form.Item>

              <Form.Item
                name="newEndDate"
                label="New Contract End Date"
                rules={[{ required: true, message: 'Please select end date' }]}
              >
                <DatePicker
                  style={{ width: '100%' }}
                  disabledDate={(current) => {
                    return current && current < dayjs().endOf('day');
                  }}
                />
              </Form.Item>

              <Form.Item
                name="notes"
                label="Notes"
              >
                <TextArea
                  rows={3}
                  placeholder="Justification for renewal or any special conditions..."
                />
              </Form.Item>

              <Form.Item style={{ marginBottom: 0 }}>
                <Space style={{ float: 'right' }}>
                  <Button onClick={() => setRenewalModal(false)}>
                    Cancel
                  </Button>
                  <Button type="primary" htmlType="submit" icon={<SendOutlined />}>
                    Submit for Approval
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </>
        )}
      </Modal>
    </div>
  );
};

export default ContractManagement;