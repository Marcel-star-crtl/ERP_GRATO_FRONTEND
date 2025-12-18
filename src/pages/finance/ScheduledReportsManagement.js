import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Typography,
  message,
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  Switch,
  Row,
  Col,
  Statistic,
  Badge,
  Tooltip,
  TimePicker,
  Divider,
  Alert
} from 'antd';
import {
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  EyeOutlined,
  ReloadOutlined,
  BarChartOutlined,
  MailOutlined
} from '@ant-design/icons';
import api from '../../services/api';
import moment from 'moment';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const ScheduledReportsManagement = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [reports, setReports] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    totalRuns: 0
  });

  const [form] = Form.useForm();

  useEffect(() => {
    fetchReports();
    fetchStatistics();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await api.get('/scheduled-reports');
      if (response.data.success) {
        setReports(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
      message.error('Failed to load scheduled reports');
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await api.get('/scheduled-reports/statistics');
      if (response.data.success) {
        setStats(response.data.data.summary);
      }
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  const handleCreate = async (values) => {
    try {
      setLoading(true);

      // Format schedule time
      const scheduleTime = values.scheduleTime 
        ? values.scheduleTime.format('HH:mm')
        : '08:00';

      const payload = {
        ...values,
        schedule: {
          time: scheduleTime,
          dayOfWeek: values.dayOfWeek,
          dayOfMonth: values.dayOfMonth,
          timezone: 'Africa/Douala'
        }
      };

      delete payload.scheduleTime;
      delete payload.dayOfWeek;
      delete payload.dayOfMonth;

      const response = await api.post('/scheduled-reports', payload);

      if (response.data.success) {
        message.success('Scheduled report created successfully');
        setModalVisible(false);
        form.resetFields();
        fetchReports();
        fetchStatistics();
      }
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to create scheduled report');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (values) => {
    try {
      setLoading(true);

      const scheduleTime = values.scheduleTime 
        ? values.scheduleTime.format('HH:mm')
        : selectedReport.schedule.time;

      const payload = {
        ...values,
        schedule: {
          time: scheduleTime,
          dayOfWeek: values.dayOfWeek,
          dayOfMonth: values.dayOfMonth,
          timezone: 'Africa/Douala'
        }
      };

      delete payload.scheduleTime;
      delete payload.dayOfWeek;
      delete payload.dayOfMonth;

      const response = await api.put(`/scheduled-reports/${selectedReport._id}`, payload);

      if (response.data.success) {
        message.success('Scheduled report updated successfully');
        setModalVisible(false);
        setSelectedReport(null);
        form.resetFields();
        fetchReports();
      }
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to update scheduled report');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (reportId) => {
    Modal.confirm({
      title: 'Delete Scheduled Report',
      content: 'Are you sure you want to delete this scheduled report? This action cannot be undone.',
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          const response = await api.delete(`/scheduled-reports/${reportId}`);
          if (response.data.success) {
            message.success('Scheduled report deleted successfully');
            fetchReports();
            fetchStatistics();
          }
        } catch (error) {
          message.error('Failed to delete scheduled report');
        }
      }
    });
  };

  const handleTrigger = async (reportId) => {
    try {
      setLoading(true);
      const response = await api.post(`/scheduled-reports/${reportId}/trigger`);
      if (response.data.success) {
        message.success('Report triggered and sent successfully');
        fetchReports();
      }
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to trigger report');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (reportId) => {
    try {
      const response = await api.post(`/scheduled-reports/${reportId}/toggle`);
      if (response.data.success) {
        message.success(response.data.message);
        fetchReports();
        fetchStatistics();
      }
    } catch (error) {
      message.error('Failed to toggle report status');
    }
  };

  const openCreateModal = () => {
    setSelectedReport(null);
    form.resetFields();
    setModalVisible(true);
  };

  const openEditModal = (report) => {
    setSelectedReport(report);
    
    // Set form values
    form.setFieldsValues({
      name: report.name,
      description: report.description,
      reportType: report.reportType,
      frequency: report.frequency,
      scheduleTime: report.schedule?.time ? moment(report.schedule.time, 'HH:mm') : moment('08:00', 'HH:mm'),
      dayOfWeek: report.schedule?.dayOfWeek,
      dayOfMonth: report.schedule?.dayOfMonth,
      recipients: report.recipients,
      format: report.format,
      includeCharts: report.includeCharts,
      active: report.active,
      filters: report.filters
    });

    setModalVisible(true);
  };

  const getStatusTag = (active, lastRunStatus) => {
    if (!active) {
      return <Tag icon={<PauseCircleOutlined />} color="default">Inactive</Tag>;
    }

    if (lastRunStatus === 'success') {
      return <Tag icon={<CheckCircleOutlined />} color="success">Active</Tag>;
    } else if (lastRunStatus === 'failed') {
      return <Tag icon={<CloseCircleOutlined />} color="error">Active (Last Run Failed)</Tag>;
    }

    return <Tag icon={<ClockCircleOutlined />} color="processing">Active</Tag>;
  };

  const getFrequencyLabel = (frequency) => {
    const labels = {
      daily: 'Daily',
      weekly: 'Weekly',
      biweekly: 'Bi-weekly',
      monthly: 'Monthly',
      quarterly: 'Quarterly',
      custom: 'Custom'
    };
    return labels[frequency] || frequency;
  };

  const columns = [
    {
      title: 'Report Name',
      key: 'name',
      width: 250,
      render: (_, record) => (
        <div>
          <Text strong>{record.name}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: '11px' }}>
            {record.description}
          </Text>
        </div>
      )
    },
    {
      title: 'Type',
      dataIndex: 'reportType',
      key: 'reportType',
      width: 150,
      render: (type) => (
        <Tag color="blue">
          {type.replace(/_/g, ' ').toUpperCase()}
        </Tag>
      )
    },
    {
      title: 'Frequency',
      dataIndex: 'frequency',
      key: 'frequency',
      width: 120,
      render: (frequency) => getFrequencyLabel(frequency)
    },
    {
      title: 'Next Run',
      dataIndex: 'nextRun',
      key: 'nextRun',
      width: 150,
      render: (nextRun) => (
        <div>
          <Text>{moment(nextRun).format('DD/MM/YYYY')}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: '11px' }}>
            {moment(nextRun).format('HH:mm')}
          </Text>
        </div>
      ),
      sorter: (a, b) => new Date(a.nextRun) - new Date(b.nextRun)
    },
    {
      title: 'Recipients',
      dataIndex: 'recipients',
      key: 'recipients',
      width: 100,
      render: (recipients) => (
        <Tooltip title={recipients.map(r => r.email).join(', ')}>
          <Badge count={recipients.length} style={{ backgroundColor: '#52c41a' }}>
            <MailOutlined style={{ fontSize: '18px' }} />
          </Badge>
        </Tooltip>
      )
    },
    {
      title: 'Runs',
      dataIndex: 'runCount',
      key: 'runCount',
      width: 80,
      align: 'center',
      sorter: (a, b) => a.runCount - b.runCount
    },
    {
      title: 'Status',
      key: 'status',
      width: 150,
      render: (_, record) => getStatusTag(record.active, record.lastRunStatus)
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 280,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="View Details">
            <Button
              size="small"
              icon={<EyeOutlined />}
              onClick={() => {
                setSelectedReport(record);
                setDetailsModalVisible(true);
              }}
            />
          </Tooltip>
          <Tooltip title="Edit">
            <Button
              size="small"
              icon={<EditOutlined />}
              onClick={() => openEditModal(record)}
            />
          </Tooltip>
          <Tooltip title={record.active ? 'Pause' : 'Activate'}>
            <Button
              size="small"
              icon={record.active ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
              onClick={() => handleToggleStatus(record._id)}
            />
          </Tooltip>
          <Tooltip title="Trigger Now">
            <Button
              size="small"
              type="primary"
              icon={<PlayCircleOutlined />}
              onClick={() => handleTrigger(record._id)}
            />
          </Tooltip>
          <Tooltip title="Delete">
            <Button
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record._id)}
            />
          </Tooltip>
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <Title level={2} style={{ margin: 0 }}>
          <ClockCircleOutlined /> Scheduled Reports
        </Title>
        <Space>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => {
              fetchReports();
              fetchStatistics();
            }}
            loading={loading}
          >
            Refresh
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={openCreateModal}
          >
            New Scheduled Report
          </Button>
        </Space>
      </div>

      {/* Statistics */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Total Reports"
              value={stats.total}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Active"
              value={stats.active}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Inactive"
              value={stats.inactive}
              prefix={<PauseCircleOutlined />}
              valueStyle={{ color: '#999' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Total Runs"
              value={stats.totalRuns}
              prefix={<BarChartOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Info Alert */}
      <Alert
        message="Automated Budget Reports"
        description="Schedule automated budget reports to be sent to stakeholders at regular intervals. Reports are generated and emailed automatically based on your configuration."
        type="info"
        showIcon
        closable
        style={{ marginBottom: '24px' }}
      />

      {/* Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={reports}
          loading={loading}
          rowKey="_id"
          scroll={{ x: 1400 }}
          pagination={{
            showSizeChanger: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} reports`,
          }}
        />
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        title={
          <Space>
            <ClockCircleOutlined />
            {selectedReport ? 'Edit Scheduled Report' : 'Create Scheduled Report'}
          </Space>
        }
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setSelectedReport(null);
          form.resetFields();
        }}
        footer={null}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={selectedReport ? handleUpdate : handleCreate}
          initialValues={{
            frequency: 'weekly',
            scheduleTime: moment('08:00', 'HH:mm'),
            format: 'excel',
            includeCharts: true,
            active: true,
            recipients: []
          }}
        >
          {/* Basic Information */}
          <Divider orientation="left">Basic Information</Divider>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="Report Name"
                rules={[{ required: true, message: 'Please enter report name' }]}
              >
                <Input placeholder="e.g., Weekly Budget Summary" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="reportType"
                label="Report Type"
                rules={[{ required: true, message: 'Please select report type' }]}
              >
                <Select placeholder="Select report type">
                  <Option value="budget_dashboard">Budget Dashboard</Option>
                  <Option value="budget_utilization">Budget Utilization Report</Option>
                  <Option value="budget_alerts">Budget Alerts Report</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="description"
            label="Description"
          >
            <TextArea
              rows={2}
              placeholder="Brief description of this scheduled report..."
              showCount
              maxLength={200}
            />
          </Form.Item>

          {/* Schedule Configuration */}
          <Divider orientation="left">Schedule Configuration</Divider>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="frequency"
                label="Frequency"
                rules={[{ required: true, message: 'Please select frequency' }]}
              >
                <Select placeholder="Select frequency">
                  <Option value="daily">Daily</Option>
                  <Option value="weekly">Weekly</Option>
                  <Option value="biweekly">Bi-weekly</Option>
                  <Option value="monthly">Monthly</Option>
                  <Option value="quarterly">Quarterly</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="scheduleTime"
                label="Time"
                rules={[{ required: true, message: 'Please select time' }]}
              >
                <TimePicker
                  format="HH:mm"
                  style={{ width: '100%' }}
                  placeholder="Select time"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) => 
              prevValues.frequency !== currentValues.frequency
            }
          >
            {({ getFieldValue }) => {
              const frequency = getFieldValue('frequency');
              
              if (frequency === 'weekly' || frequency === 'biweekly') {
                return (
                  <Form.Item
                    name="dayOfWeek"
                    label="Day of Week"
                    rules={[{ required: true, message: 'Please select day' }]}
                  >
                    <Select placeholder="Select day">
                      <Option value={1}>Monday</Option>
                      <Option value={2}>Tuesday</Option>
                      <Option value={3}>Wednesday</Option>
                      <Option value={4}>Thursday</Option>
                      <Option value={5}>Friday</Option>
                      <Option value={6}>Saturday</Option>
                      <Option value={0}>Sunday</Option>
                    </Select>
                  </Form.Item>
                );
              }

              if (frequency === 'monthly' || frequency === 'quarterly') {
                return (
                  <Form.Item
                    name="dayOfMonth"
                    label="Day of Month"
                    rules={[
                      { required: true, message: 'Please enter day' },
                      { type: 'number', min: 1, max: 31, message: 'Day must be between 1 and 31' }
                    ]}
                  >
                    <InputNumber
                      style={{ width: '100%' }}
                      min={1}
                      max={31}
                      placeholder="Day of month (1-31)"
                    />
                  </Form.Item>
                );
              }

              return null;
            }}
          </Form.Item>

          {/* Recipients */}
          <Divider orientation="left">Recipients</Divider>

          <Form.List name="recipients">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }, index) => (
                  <Row key={key} gutter={16} align="middle">
                    <Col span={10}>
                      <Form.Item
                        {...restField}
                        name={[name, 'name']}
                        rules={[{ required: true, message: 'Please enter name' }]}
                      >
                        <Input placeholder="Recipient name" />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        {...restField}
                        name={[name, 'email']}
                        rules={[
                          { required: true, message: 'Please enter email' },
                          { type: 'email', message: 'Please enter valid email' }
                        ]}
                      >
                        <Input placeholder="recipient@example.com" />
                      </Form.Item>
                    </Col>
                    <Col span={2}>
                      <Button
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => remove(name)}
                      />
                    </Col>
                  </Row>
                ))}
                <Form.Item>
                  <Button
                    type="dashed"
                    onClick={() => add()}
                    block
                    icon={<PlusOutlined />}
                  >
                    Add Recipient
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>

          {/* Report Settings */}
          <Divider orientation="left">Report Settings</Divider>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="format"
                label="Format"
                rules={[{ required: true, message: 'Please select format' }]}
              >
                <Select placeholder="Select format">
                  <Option value="excel">Excel Only</Option>
                  <Option value="pdf">PDF Only</Option>
                  <Option value="both">Both Excel and PDF</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="includeCharts"
                label="Include Charts"
                valuePropName="checked"
              >
                <Switch checkedChildren="Yes" unCheckedChildren="No" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="active"
            label="Active"
            valuePropName="checked"
          >
            <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
          </Form.Item>

          {/* Submit */}
          <Form.Item>
            <Space>
              <Button onClick={() => {
                setModalVisible(false);
                setSelectedReport(null);
                form.resetFields();
              }}>
                Cancel
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                icon={selectedReport ? <EditOutlined /> : <PlusOutlined />}
              >
                {selectedReport ? 'Update Report' : 'Create Report'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Details Modal */}
      <Modal
        title={
          <Space>
            <EyeOutlined />
            Scheduled Report Details
          </Space>
        }
        open={detailsModalVisible}
        onCancel={() => {
          setDetailsModalVisible(false);
          setSelectedReport(null);
        }}
        footer={[
          <Button
            key="close"
            onClick={() => {
              setDetailsModalVisible(false);
              setSelectedReport(null);
            }}
          >
            Close
          </Button>
        ]}
        width={700}
      >
        {selectedReport && (
          <div>
            <Card size="small" title="Report Information" style={{ marginBottom: '20px' }}>
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Text type="secondary">Name:</Text>
                  <br />
                  <Text strong>{selectedReport.name}</Text>
                </Col>
                <Col span={12}>
                  <Text type="secondary">Type:</Text>
                  <br />
                  <Tag color="blue">
                    {selectedReport.reportType.replace(/_/g, ' ').toUpperCase()}
                  </Tag>
                </Col>
                <Col span={12}>
                  <Text type="secondary">Frequency:</Text>
                  <br />
                  <Text>{getFrequencyLabel(selectedReport.frequency)}</Text>
                </Col>
                <Col span={12}>
                  <Text type="secondary">Schedule Time:</Text>
                  <br />
                  <Text>{selectedReport.schedule?.time || '08:00'}</Text>
                </Col>
                <Col span={12}>
                  <Text type="secondary">Format:</Text>
                  <br />
                  <Text>{selectedReport.format.toUpperCase()}</Text>
                </Col>
                <Col span={12}>
                  <Text type="secondary">Status:</Text>
                  <br />
                  {getStatusTag(selectedReport.active, selectedReport.lastRunStatus)}
                </Col>
              </Row>
            </Card>

            <Card size="small" title="Schedule Information" style={{ marginBottom: '20px' }}>
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Text type="secondary">Next Run:</Text>
                  <br />
                  <Text strong>
                    {moment(selectedReport.nextRun).format('DD/MM/YYYY HH:mm')}
                  </Text>
                </Col>
                <Col span={12}>
                  <Text type="secondary">Last Run:</Text>
                  <br />
                  <Text>
                    {selectedReport.lastRun 
                      ? moment(selectedReport.lastRun).format('DD/MM/YYYY HH:mm')
                      : 'Never'
                    }
                  </Text>
                </Col>
                <Col span={12}>
                  <Text type="secondary">Total Runs:</Text>
                  <br />
                  <Text>{selectedReport.runCount}</Text>
                </Col>
                <Col span={12}>
                  <Text type="secondary">Last Run Status:</Text>
                  <br />
                  <Tag color={selectedReport.lastRunStatus === 'success' ? 'green' : 'red'}>
                    {selectedReport.lastRunStatus.toUpperCase()}
                  </Tag>
                </Col>
              </Row>
            </Card>

            <Card size="small" title={`Recipients (${selectedReport.recipients.length})`} style={{ marginBottom: '20px' }}>
              {selectedReport.recipients.map((recipient, index) => (
                <div key={index} style={{ marginBottom: '8px' }}>
                  <Text strong>{recipient.name}</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    {recipient.email}
                  </Text>
                  {index < selectedReport.recipients.length - 1 && <Divider style={{ margin: '8px 0' }} />}
                </div>
              ))}
            </Card>

            {selectedReport.description && (
              <Card size="small" title="Description">
                <Text>{selectedReport.description}</Text>
              </Card>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ScheduledReportsManagement;