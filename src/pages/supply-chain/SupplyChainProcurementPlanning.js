import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Typography,
  Tag,
  Row,
  Col,
  Statistic,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  InputNumber,
  Progress,
  Timeline,
  Alert,
  Tabs,
  Drawer,
  message
} from 'antd';
import {
  CalendarOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  TruckOutlined,
  DollarOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  LineChartOutlined,
  TeamOutlined
} from '@ant-design/icons';
import moment from 'moment';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const { TabPane } = Tabs;
const { RangePicker } = DatePicker;

const SupplyChainProcurementPlanning = () => {
  const [loading, setLoading] = useState(false);
  const [procurementPlans, setProcurementPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [planModalVisible, setPlanModalVisible] = useState(false);
  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false);
  const [form] = Form.useForm();
  const [activeTab, setActiveTab] = useState('current');

  // Mock data
  const mockPlans = [
    {
      id: 'PP20241127001',
      title: 'Q1 2025 IT Equipment Procurement',
      category: 'IT Equipment',
      status: 'active',
      priority: 'High',
      startDate: '2024-12-01',
      endDate: '2025-03-31',
      totalBudget: 15000000,
      allocatedBudget: 12000000,
      completionPercentage: 35,
      assignedOfficer: 'Mary Johnson',
      department: 'IT',
      description: 'Comprehensive procurement plan for IT equipment including laptops, monitors, and networking gear',
      milestones: [
        { name: 'Requirements Gathering', date: '2024-12-15', status: 'completed' },
        { name: 'Vendor Selection', date: '2025-01-15', status: 'in_progress' },
        { name: 'Contract Negotiation', date: '2025-02-15', status: 'pending' },
        { name: 'Delivery & Implementation', date: '2025-03-31', status: 'pending' }
      ],
      associatedRequisitions: ['REQ20241127001', 'REQ20241125002'],
      riskFactors: [
        { risk: 'Supplier availability', level: 'Medium', mitigation: 'Multiple backup suppliers identified' },
        { risk: 'Budget overrun', level: 'Low', mitigation: 'Contingency fund allocated' }
      ]
    },
    {
      id: 'PP20241120002',
      title: 'Office Furniture Renewal Program',
      category: 'Furniture',
      status: 'planning',
      priority: 'Medium',
      startDate: '2025-01-01',
      endDate: '2025-06-30',
      totalBudget: 8500000,
      allocatedBudget: 8500000,
      completionPercentage: 5,
      assignedOfficer: 'David Wilson',
      department: 'Admin',
      description: 'Phased renewal of office furniture across all departments',
      milestones: [
        { name: 'Space Assessment', date: '2025-01-15', status: 'pending' },
        { name: 'Design Planning', date: '2025-02-28', status: 'pending' },
        { name: 'Procurement Phase 1', date: '2025-04-15', status: 'pending' },
        { name: 'Installation Complete', date: '2025-06-30', status: 'pending' }
      ],
      associatedRequisitions: [],
      riskFactors: [
        { risk: 'Delivery delays', level: 'High', mitigation: 'Early ordering with lead time buffer' }
      ]
    }
  ];

  useEffect(() => {
    fetchProcurementPlans();
  }, []);

  const fetchProcurementPlans = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setProcurementPlans(mockPlans);
    } catch (error) {
      console.error('Error fetching procurement plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusTag = (status) => {
    const statusMap = {
      'planning': { color: 'blue', text: 'Planning' },
      'active': { color: 'green', text: 'Active' },
      'on_hold': { color: 'orange', text: 'On Hold' },
      'completed': { color: 'purple', text: 'Completed' },
      'cancelled': { color: 'red', text: 'Cancelled' }
    };
    const statusInfo = statusMap[status] || { color: 'default', text: status };
    return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>;
  };

  const getPriorityTag = (priority) => {
    const priorityMap = {
      'Low': 'green',
      'Medium': 'orange',
      'High': 'red'
    };
    return <Tag color={priorityMap[priority]}>{priority}</Tag>;
  };

  const getMilestoneStatusTag = (status) => {
    const statusMap = {
      'completed': { color: 'green', text: 'Completed', icon: <CheckCircleOutlined /> },
      'in_progress': { color: 'blue', text: 'In Progress', icon: <ClockCircleOutlined /> },
      'pending': { color: 'default', text: 'Pending', icon: <ClockCircleOutlined /> }
    };
    const statusInfo = statusMap[status] || { color: 'default', text: status };
    return <Tag color={statusInfo.color} icon={statusInfo.icon}>{statusInfo.text}</Tag>;
  };

  const getRiskLevelTag = (level) => {
    const levelMap = {
      'Low': 'green',
      'Medium': 'orange',
      'High': 'red'
    };
    return <Tag color={levelMap[level]}>{level}</Tag>;
  };

  const handleCreatePlan = () => {
    form.resetFields();
    setSelectedPlan(null);
    setPlanModalVisible(true);
  };

  const handleEditPlan = (plan) => {
    setSelectedPlan(plan);
    form.setFieldsValue({
      ...plan,
      dateRange: [moment(plan.startDate), moment(plan.endDate)]
    });
    setPlanModalVisible(true);
  };

  const handleViewDetails = (plan) => {
    setSelectedPlan(plan);
    setDetailDrawerVisible(true);
  };

  const handleSubmitPlan = async (values) => {
    try {
      const planData = {
        ...values,
        startDate: values.dateRange[0].format('YYYY-MM-DD'),
        endDate: values.dateRange[1].format('YYYY-MM-DD'),
        id: selectedPlan ? selectedPlan.id : `PP${Date.now()}`,
        status: selectedPlan ? selectedPlan.status : 'planning'
      };

      if (selectedPlan) {
        message.success('Procurement plan updated successfully!');
      } else {
        message.success('Procurement plan created successfully!');
      }

      setPlanModalVisible(false);
      form.resetFields();
      await fetchProcurementPlans();
    } catch (error) {
      message.error('Failed to save procurement plan');
    }
  };

  const columns = [
    {
      title: 'Plan ID',
      dataIndex: 'id',
      key: 'id',
      render: (id) => <Text code>{id}</Text>,
      width: 150
    },
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
      width: 250
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      render: (category) => <Tag color="blue">{category}</Tag>,
      width: 130
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => getStatusTag(status),
      width: 110
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority) => getPriorityTag(priority),
      width: 100
    },
    {
      title: 'Progress',
      dataIndex: 'completionPercentage',
      key: 'completionPercentage',
      render: (percentage) => (
        <div style={{ width: 100 }}>
          <Progress percent={percentage} size="small" />
        </div>
      ),
      width: 120
    },
    {
      title: 'Budget (XAF)',
      key: 'budget',
      render: (_, record) => (
        <div>
          <div>{record.allocatedBudget.toLocaleString()}</div>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            of {record.totalBudget.toLocaleString()}
          </Text>
        </div>
      ),
      width: 140
    },
    {
      title: 'Timeline',
      key: 'timeline',
      render: (_, record) => (
        <div>
          <div>{new Date(record.startDate).toLocaleDateString('en-GB')}</div>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            to {new Date(record.endDate).toLocaleDateString('en-GB')}
          </Text>
        </div>
      ),
      width: 120
    },
    {
      title: 'Assigned Officer',
      dataIndex: 'assignedOfficer',
      key: 'assignedOfficer',
      render: (officer) => (
        <div>
          <TeamOutlined /> {officer}
        </div>
      ),
      width: 150
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button size="small" icon={<EyeOutlined />} onClick={() => handleViewDetails(record)}>
            View
          </Button>
          <Button size="small" icon={<EditOutlined />} onClick={() => handleEditPlan(record)}>
            Edit
          </Button>
        </Space>
      ),
      width: 120
    }
  ];

  const getFilteredPlans = () => {
    switch (activeTab) {
      case 'active':
        return procurementPlans.filter(p => p.status === 'active');
      case 'planning':
        return procurementPlans.filter(p => p.status === 'planning');
      case 'completed':
        return procurementPlans.filter(p => p.status === 'completed');
      default:
        return procurementPlans;
    }
  };

  const stats = {
    total: procurementPlans.length,
    active: procurementPlans.filter(p => p.status === 'active').length,
    planning: procurementPlans.filter(p => p.status === 'planning').length,
    completed: procurementPlans.filter(p => p.status === 'completed').length,
    totalBudget: procurementPlans.reduce((sum, plan) => sum + plan.totalBudget, 0)
  };

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <Title level={2} style={{ margin: 0 }}>
            <CalendarOutlined /> Procurement Planning
          </Title>
          <Space>
            <Button icon={<LineChartOutlined />} href="/supply-chain/analytics">
              View Analytics
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreatePlan}>
              New Procurement Plan
            </Button>
          </Space>
        </div>

        {/* Statistics */}
        <Row gutter={16} style={{ marginBottom: '24px' }}>
          <Col span={6}>
            <Statistic
              title="Total Plans"
              value={stats.total}
              prefix={<CalendarOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="Active Plans"
              value={stats.active}
              prefix={<TruckOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="In Planning"
              value={stats.planning}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="Total Budget (XAF)"
              value={stats.totalBudget}
              formatter={value => value.toLocaleString()}
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Col>
        </Row>

        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab={`All Plans (${stats.total})`} key="current">
            <Table
              columns={columns}
              dataSource={getFilteredPlans()}
              rowKey="id"
              loading={loading}
              pagination={{
                pageSize: 10,
                showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} plans`
              }}
              scroll={{ x: 'max-content' }}
            />
          </TabPane>

          <TabPane tab={`Active (${stats.active})`} key="active">
            <Table
              columns={columns}
              dataSource={getFilteredPlans()}
              rowKey="id"
              loading={loading}
              pagination={false}
              scroll={{ x: 'max-content' }}
            />
          </TabPane>

          <TabPane tab={`Planning (${stats.planning})`} key="planning">
            <Table
              columns={columns}
              dataSource={getFilteredPlans()}
              rowKey="id"
              loading={loading}
              pagination={false}
              scroll={{ x: 'max-content' }}
            />
          </TabPane>

          <TabPane tab={`Completed (${stats.completed})`} key="completed">
            <Table
              columns={columns}
              dataSource={getFilteredPlans()}
              rowKey="id"
              loading={loading}
              pagination={false}
              scroll={{ x: 'max-content' }}
            />
          </TabPane>
        </Tabs>
      </Card>

      {/* Create/Edit Plan Modal */}
      <Modal
        title={selectedPlan ? "Edit Procurement Plan" : "Create New Procurement Plan"}
        open={planModalVisible}
        onCancel={() => {
          setPlanModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmitPlan}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="title"
                label="Plan Title"
                rules={[{ required: true, message: 'Please enter plan title' }]}
              >
                <Input placeholder="Q1 2025 IT Equipment Procurement" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="category"
                label="Category"
                rules={[{ required: true, message: 'Please select category' }]}
              >
                <Select placeholder="Select category">
                  <Option value="IT Equipment">IT Equipment</Option>
                  <Option value="Office Supplies">Office Supplies</Option>
                  <Option value="Furniture">Furniture</Option>
                  <Option value="Consumables">Consumables</Option>
                  <Option value="Equipment">Equipment</Option>
                  <Option value="Software">Software</Option>
                  <Option value="Maintenance">Maintenance</Option>
                  <Option value="Other">Other</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="priority"
                label="Priority"
                rules={[{ required: true, message: 'Please select priority' }]}
              >
                <Select placeholder="Select priority">
                  <Option value="Low">Low</Option>
                  <Option value="Medium">Medium</Option>
                  <Option value="High">High</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="department"
                label="Department"
                rules={[{ required: true, message: 'Please enter department' }]}
              >
                <Input placeholder="IT" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="assignedOfficer"
                label="Assigned Officer"
                rules={[{ required: true, message: 'Please select assigned officer' }]}
              >
                <Select placeholder="Select officer">
                  <Option value="Mary Johnson">Mary Johnson</Option>
                  <Option value="David Wilson">David Wilson</Option>
                  <Option value="Sarah Brown">Sarah Brown</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="dateRange"
                label="Timeline"
                rules={[{ required: true, message: 'Please select timeline' }]}
              >
                <RangePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="totalBudget"
                label="Total Budget (XAF)"
                rules={[{ required: true, message: 'Please enter total budget' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value.replace(/\$\s?|(,*)/g, '')}
                  placeholder="15000000"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true, message: 'Please enter description' }]}
          >
            <TextArea
              rows={4}
              placeholder="Comprehensive procurement plan description..."
              showCount
              maxLength={500}
            />
          </Form.Item>

          <div style={{ textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setPlanModalVisible(false)}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit">
                {selectedPlan ? 'Update Plan' : 'Create Plan'}
              </Button>
            </Space>
          </div>
        </Form>
      </Modal>

      {/* Detail Drawer */}
      <Drawer
        title={
          <Space>
            <CalendarOutlined />
            Procurement Plan Details
          </Space>
        }
        placement="right"
        width={800}
        open={detailDrawerVisible}
        onClose={() => {
          setDetailDrawerVisible(false);
          setSelectedPlan(null);
        }}
      >
        {selectedPlan && (
          <div>
            {/* Plan Information */}
            <Card size="small" title="Plan Overview" style={{ marginBottom: '16px' }}>
              <Row gutter={16}>
                <Col span={12}>
                  <div style={{ marginBottom: '8px' }}>
                    <Text strong>Plan ID: </Text>
                    <Text code>{selectedPlan.id}</Text>
                  </div>
                  <div style={{ marginBottom: '8px' }}>
                    <Text strong>Title: </Text>
                    <Text>{selectedPlan.title}</Text>
                  </div>
                  <div style={{ marginBottom: '8px' }}>
                    <Text strong>Category: </Text>
                    <Tag color="blue">{selectedPlan.category}</Tag>
                  </div>
                  <div style={{ marginBottom: '8px' }}>
                    <Text strong>Status: </Text>
                    {getStatusTag(selectedPlan.status)}
                  </div>
                </Col>
                <Col span={12}>
                  <div style={{ marginBottom: '8px' }}>
                    <Text strong>Priority: </Text>
                    {getPriorityTag(selectedPlan.priority)}
                  </div>
                  <div style={{ marginBottom: '8px' }}>
                    <Text strong>Department: </Text>
                    <Text>{selectedPlan.department}</Text>
                  </div>
                  <div style={{ marginBottom: '8px' }}>
                    <Text strong>Assigned Officer: </Text>
                    <Text><TeamOutlined /> {selectedPlan.assignedOfficer}</Text>
                  </div>
                  <div style={{ marginBottom: '8px' }}>
                    <Text strong>Progress: </Text>
                    <Progress percent={selectedPlan.completionPercentage} size="small" style={{ width: 100 }} />
                  </div>
                </Col>
              </Row>
            </Card>

            {/* Timeline and Budget */}
            <Row gutter={16} style={{ marginBottom: '16px' }}>
              <Col span={12}>
                <Card size="small" title="Timeline">
                  <div style={{ marginBottom: '8px' }}>
                    <Text strong>Start Date: </Text>
                    <Text>{new Date(selectedPlan.startDate).toLocaleDateString('en-GB')}</Text>
                  </div>
                  <div>
                    <Text strong>End Date: </Text>
                    <Text>{new Date(selectedPlan.endDate).toLocaleDateString('en-GB')}</Text>
                  </div>
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small" title="Budget Information">
                  <div style={{ marginBottom: '8px' }}>
                    <Text strong>Total Budget: </Text>
                    <Text>{selectedPlan.totalBudget.toLocaleString()} XAF</Text>
                  </div>
                  <div>
                    <Text strong>Allocated: </Text>
                    <Text>{selectedPlan.allocatedBudget.toLocaleString()} XAF</Text>
                  </div>
                </Card>
              </Col>
            </Row>

            {/* Description */}
            <Card size="small" title="Description" style={{ marginBottom: '16px' }}>
              <Text>{selectedPlan.description}</Text>
            </Card>

            {/* Milestones */}
            <Card size="small" title="Milestones" style={{ marginBottom: '16px' }}>
              <Timeline>
                {selectedPlan.milestones.map((milestone, index) => (
                  <Timeline.Item
                    key={index}
                    color={milestone.status === 'completed' ? 'green' : 
                           milestone.status === 'in_progress' ? 'blue' : 'gray'}
                    dot={milestone.status === 'completed' ? <CheckCircleOutlined /> : 
                         milestone.status === 'in_progress' ? <ClockCircleOutlined /> : 
                         <ClockCircleOutlined />}
                  >
                    <div>
                      <Text strong>{milestone.name}</Text>
                      <br />
                      <Text type="secondary">
                        {new Date(milestone.date).toLocaleDateString('en-GB')}
                      </Text>
                      <br />
                      {getMilestoneStatusTag(milestone.status)}
                    </div>
                  </Timeline.Item>
                ))}
              </Timeline>
            </Card>

            {/* Associated Requisitions */}
            <Card size="small" title="Associated Requisitions" style={{ marginBottom: '16px' }}>
              {selectedPlan.associatedRequisitions.length > 0 ? (
                <Space wrap>
                  {selectedPlan.associatedRequisitions.map(reqId => (
                    <Tag key={reqId} color="blue">{reqId}</Tag>
                  ))}
                </Space>
              ) : (
                <Text type="secondary">No associated requisitions yet</Text>
              )}
            </Card>

            {/* Risk Factors */}
            <Card size="small" title="Risk Management">
              {selectedPlan.riskFactors.map((risk, index) => (
                <Alert
                  key={index}
                  message={
                    <div>
                      <Text strong>{risk.risk}</Text>
                      <span style={{ marginLeft: '8px' }}>
                        {getRiskLevelTag(risk.level)}
                      </span>
                    </div>
                  }
                  description={risk.mitigation}
                  type={risk.level === 'High' ? 'error' : risk.level === 'Medium' ? 'warning' : 'info'}
                  showIcon
                  style={{ marginBottom: '8px' }}
                />
              ))}
            </Card>
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default SupplyChainProcurementPlanning;