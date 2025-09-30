import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Card, 
  Row, 
  Col, 
  Statistic, 
  Progress, 
  Typography, 
  Button, 
  Alert, 
  Spin, 
  Table,
  Tag,
  Space,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  List,
  Avatar,
  Tabs,
  Badge,
  Timeline,
  Tooltip,
  Rate,
  Descriptions
} from 'antd';
import { 
  HeartOutlined,
  UserOutlined,
  TeamOutlined,
  TrophyOutlined,
  MedicineBoxOutlined,
  SafetyCertificateOutlined,
  SmileOutlined,
  BulbOutlined,
  CalendarOutlined,
  BarChartOutlined,
  PlusOutlined,
  EyeOutlined,
  ReloadOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  PhoneOutlined,
  MailOutlined,
  HomeOutlined,
  StarOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import api from '../../services/api';
import { useSelector } from 'react-redux';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { TabPane } = Tabs;
const { RangePicker } = DatePicker;

const HREmployeeWelfare = () => {
  const [welfareData, setWelfareData] = useState(null);
  const [employeeWellness, setEmployeeWellness] = useState([]);
  const [welfarePrograms, setWelfarePrograms] = useState([]);
  const [supportCases, setSupportCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [supportModal, setSupportModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [supportForm] = Form.useForm();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    fetchWelfareData();
  }, [activeTab]);

  const fetchWelfareData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Mock data for demonstration - replace with actual API calls
      const mockWelfareData = {
        totalEmployees: 150,
        wellnessParticipation: 89,
        satisfactionScore: 4.2,
        activePrograms: 12,
        supportCasesOpen: 8,
        mentalHealthSupport: 15,
        workLifeBalance: 3.8,
        overallWelfareScore: 85
      };

      const mockEmployeeWellness = [
        {
          _id: 'emp1',
          employeeId: 'EMP001',
          fullName: 'John Doe',
          department: 'Finance',
          position: 'Senior Accountant',
          wellnessScore: 7.5,
          lastCheckIn: '2024-08-15T10:30:00Z',
          riskLevel: 'low',
          activePrograms: ['Health Insurance', 'Gym Membership'],
          recentConcerns: [],
          satisfactionRating: 4.0,
          workLifeBalance: 3.5,
          stressLevel: 'moderate',
          supportHistory: [
        {
          date: '2024-07-20',
          type: 'wellness_check',
          notes: 'Regular wellness check - doing well'
        }
      ]
    },
    {
      _id: 'emp2',
      employeeId: 'EMP002',
      fullName: 'Sarah Wilson',
      department: 'IT',
      position: 'Software Developer',
      wellnessScore: 6.2,
      lastCheckIn: '2024-08-10T14:20:00Z',
      riskLevel: 'medium',
      activePrograms: ['Mental Health Support', 'Flexible Hours'],
      recentConcerns: ['work_stress', 'work_life_balance'],
      satisfactionRating: 3.5,
      workLifeBalance: 2.8,
      stressLevel: 'high',
      supportHistory: [
        {
          date: '2024-08-01',
          type: 'mental_health_support',
          notes: 'Referred to EAP counselor for stress management'
        },
        {
          date: '2024-07-15',
          type: 'manager_discussion',
          notes: 'Discussed workload and project deadlines'
        }
      ]
    },
    {
      _id: 'emp3',
      employeeId: 'EMP003',
      fullName: 'Michael Brown',
      department: 'Marketing',
      position: 'Marketing Manager',
      wellnessScore: 8.1,
      lastCheckIn: '2024-08-18T09:15:00Z',
      riskLevel: 'low',
      activePrograms: ['Leadership Development', 'Health Insurance', 'Gym Membership'],
      recentConcerns: [],
      satisfactionRating: 4.5,
      workLifeBalance: 4.2,
      stressLevel: 'low',
      supportHistory: [
        {
          date: '2024-08-10',
          type: 'career_development',
          notes: 'Discussed promotion opportunities and career path'
        }
      ]
    },
    {
      _id: 'emp4',
      employeeId: 'EMP004',
      fullName: 'Lisa Johnson',
      department: 'Operations',
      position: 'Operations Coordinator',
      wellnessScore: 5.8,
      lastCheckIn: '2024-08-05T11:30:00Z',
      riskLevel: 'high',
      activePrograms: ['Maternity Support', 'Health Insurance'],
      recentConcerns: ['maternity_preparation', 'job_security'],
      satisfactionRating: 3.8,
      workLifeBalance: 3.2,
      stressLevel: 'moderate',
      supportHistory: [
        {
          date: '2024-08-01',
          type: 'maternity_support',
          notes: 'Discussed maternity leave plans and coverage arrangements'
        },
        {
          date: '2024-07-20',
          type: 'benefits_review',
          notes: 'Reviewed maternity benefits and support available'
        }
      ]
    }
  ];

  const mockWelfarePrograms = [
    {
      _id: 'prog1',
      name: 'Employee Assistance Program (EAP)',
      category: 'mental_health',
      status: 'active',
      participants: 45,
      budget: 300000,
      effectiveness: 4.3,
      description: 'Professional counseling and mental health support services',
      startDate: '2024-01-01',
      coordinator: 'HR Manager'
    },
    {
      _id: 'prog2',
      name: 'Wellness Wednesday Activities',
      category: 'physical_health',
      status: 'active',
      participants: 67,
      budget: 150000,
      effectiveness: 4.1,
      description: 'Weekly wellness activities including yoga, meditation, and health talks',
      startDate: '2024-03-01',
      coordinator: 'Wellness Committee'
    },
    {
      _id: 'prog3',
      name: 'Flexible Working Hours',
      category: 'work_life_balance',
      status: 'active',
      participants: 89,
      budget: 0,
      effectiveness: 4.5,
      description: 'Flexible start and end times within core business hours',
      startDate: '2024-02-01',
      coordinator: 'Operations Manager'
    },
    {
      _id: 'prog4',
      name: 'Health Insurance Plus',
      category: 'health_benefits',
      status: 'active',
      participants: 150,
      budget: 1200000,
      effectiveness: 4.0,
      description: 'Comprehensive health insurance coverage for employees and families',
      startDate: '2024-01-01',
      coordinator: 'HR Director'
    },
    {
      _id: 'prog5',
      name: 'Professional Development Fund',
      category: 'career_development',
      status: 'active',
      participants: 28,
      budget: 500000,
      effectiveness: 4.4,
      description: 'Financial support for courses, certifications, and professional growth',
      startDate: '2024-01-01',
      coordinator: 'Learning & Development'
    }
  ];

  const mockSupportCases = [
    {
      _id: 'case1',
      employeeId: 'EMP002',
      employeeName: 'Sarah Wilson',
      caseType: 'mental_health_support',
      priority: 'high',
      status: 'active',
      openedDate: '2024-08-01T10:00:00Z',
      description: 'Employee experiencing high stress levels and work-life balance issues',
      assignedTo: 'HR Manager',
      actions: [
        {
          date: '2024-08-01',
          action: 'Initial assessment and EAP referral',
          by: 'HR Manager'
        },
        {
          date: '2024-08-05',
          action: 'Follow-up call with employee',
          by: 'HR Manager'
        },
        {
          date: '2024-08-10',
          action: 'Coordinated with supervisor for workload adjustment',
          by: 'HR Manager'
        }
      ],
      nextFollowUp: '2024-08-25T10:00:00Z'
    },
    {
      _id: 'case2',
      employeeId: 'EMP004',
      employeeName: 'Lisa Johnson',
      caseType: 'maternity_support',
      priority: 'medium',
      status: 'active',
      openedDate: '2024-07-15T14:00:00Z',
      description: 'Maternity leave planning and support coordination',
      assignedTo: 'HR Officer',
      actions: [
        {
          date: '2024-07-15',
          action: 'Benefits review and maternity leave planning',
          by: 'HR Officer'
        },
        {
          date: '2024-07-25',
          action: 'Coordination with department for coverage planning',
          by: 'HR Officer'
        },
        {
          date: '2024-08-01',
          action: 'Health insurance coordination and benefit activation',
          by: 'HR Officer'
        }
      ],
      nextFollowUp: '2024-08-20T14:00:00Z'
    },
    {
      _id: 'case3',
      employeeId: 'EMP005',
      employeeName: 'David Chen',
      caseType: 'workplace_conflict',
      priority: 'medium',
      status: 'resolved',
      openedDate: '2024-07-10T09:00:00Z',
      closedDate: '2024-08-15T16:00:00Z',
      description: 'Interpersonal conflict with team member affecting work environment',
      assignedTo: 'HR Director',
      actions: [
        {
          date: '2024-07-10',
          action: 'Initial complaint received and documented',
          by: 'HR Director'
        },
        {
          date: '2024-07-12',
          action: 'Separate interviews with involved parties',
          by: 'HR Director'
        },
        {
          date: '2024-07-20',
          action: 'Mediation session conducted',
          by: 'HR Director'
        },
        {
          date: '2024-08-15',
          action: 'Follow-up confirmed resolution and case closed',
          by: 'HR Director'
        }
      ],
      resolution: 'Conflict resolved through mediation. Both parties agreed to improved communication protocols.'
    }
  ];

  setWelfareData(mockWelfareData);
  setEmployeeWellness(mockEmployeeWellness);
  setWelfarePrograms(mockWelfarePrograms);
  setSupportCases(mockSupportCases);

} catch (error) {
  console.error('Error fetching welfare data:', error);
  setError(error.response?.data?.message || 'Failed to fetch welfare data');
} finally {
  setLoading(false);
}
};

const handleCreateSupportCase = async (values) => {
try {
  setLoading(true);

  // Mock API call - replace with actual implementation
  console.log('Creating support case:', values);

  const newCase = {
    _id: `case${Date.now()}`,
    employeeId: selectedEmployee.employeeId,
    employeeName: selectedEmployee.fullName,
    caseType: values.caseType,
    priority: values.priority,
    status: 'active',
    openedDate: new Date().toISOString(),
    description: values.description,
    assignedTo: user.fullName,
    actions: [
      {
        date: new Date().toLocaleDateString(),
        action: 'Case created and initial assessment completed',
        by: user.fullName
      }
    ],
    nextFollowUp: values.nextFollowUp ? values.nextFollowUp.toISOString() : null
  };

  setSupportCases(prev => [newCase, ...prev]);
  setSupportModal(false);
  setSelectedEmployee(null);
  supportForm.resetFields();

} catch (error) {
  console.error('Error creating support case:', error);
} finally {
  setLoading(false);
}
};

const getRiskLevelTag = (riskLevel) => {
const riskMap = {
  'low': { color: 'green', text: 'Low Risk', icon: '✅' },
  'medium': { color: 'orange', text: 'Medium Risk', icon: '⚠️' },
  'high': { color: 'red', text: 'High Risk', icon: '🚨' }
};

const riskInfo = riskMap[riskLevel] || { color: 'default', text: riskLevel, icon: '❓' };

return (
  <Tag color={riskInfo.color}>
    {riskInfo.icon} {riskInfo.text}
  </Tag>
);
};

const getStressLevelColor = (level) => {
const colorMap = {
  'low': '#52c41a',
  'moderate': '#faad14',
  'high': '#ff4d4f'
};
return colorMap[level] || '#d9d9d9';
};

const getCaseStatusTag = (status) => {
const statusMap = {
  'active': { color: 'blue', text: 'Active', icon: <ClockCircleOutlined /> },
  'resolved': { color: 'green', text: 'Resolved', icon: <CheckCircleOutlined /> },
  'pending': { color: 'orange', text: 'Pending', icon: <ClockCircleOutlined /> },
  'escalated': { color: 'red', text: 'Escalated', icon: <WarningOutlined /> }
};

const statusInfo = statusMap[status] || { color: 'default', text: status, icon: null };

return (
  <Tag color={statusInfo.color} icon={statusInfo.icon}>
    {statusInfo.text}
  </Tag>
);
};

const wellnessColumns = [
{
  title: 'Employee',
  key: 'employee',
  render: (_, record) => (
    <div>
      <Text strong>{record.fullName}</Text>
      <br />
      <Text type="secondary" style={{ fontSize: '11px' }}>
        {record.department} - {record.position}
      </Text>
      <br />
      <Text code style={{ fontSize: '10px' }}>{record.employeeId}</Text>
    </div>
  ),
  width: 200
},
{
  title: 'Wellness Score',
  key: 'wellnessScore',
  render: (_, record) => (
    <div style={{ textAlign: 'center' }}>
      <div style={{ 
        fontSize: '18px', 
        fontWeight: 'bold', 
        color: record.wellnessScore >= 7 ? '#52c41a' : record.wellnessScore >= 5 ? '#faad14' : '#ff4d4f'
      }}>
        {record.wellnessScore}/10
      </div>
      <Progress
        percent={record.wellnessScore * 10}
        size="small"
        status={record.wellnessScore >= 7 ? 'success' : record.wellnessScore >= 5 ? 'normal' : 'exception'}
        showInfo={false}
      />
    </div>
  ),
  sorter: (a, b) => a.wellnessScore - b.wellnessScore,
  width: 100
},
{
  title: 'Risk Assessment',
  key: 'riskAssessment',
  render: (_, record) => (
    <div>
      {getRiskLevelTag(record.riskLevel)}
      <div style={{ marginTop: '4px' }}>
        <Text type="secondary" style={{ fontSize: '10px' }}>
          Stress: <span style={{ color: getStressLevelColor(record.stressLevel) }}>
            {record.stressLevel?.toUpperCase()}
          </span>
        </Text>
      </div>
    </div>
  ),
  filters: [
    { text: 'Low Risk', value: 'low' },
    { text: 'Medium Risk', value: 'medium' },
    { text: 'High Risk', value: 'high' }
  ],
  onFilter: (value, record) => record.riskLevel === value,
  width: 120
},
{
  title: 'Satisfaction & Balance',
  key: 'satisfaction',
  render: (_, record) => (
    <div>
      <div style={{ marginBottom: '4px' }}>
        <Text style={{ fontSize: '11px' }}>Satisfaction:</Text>
        <Rate disabled value={record.satisfactionRating} style={{ fontSize: '12px', marginLeft: '4px' }} />
      </div>
      <div>
        <Text style={{ fontSize: '11px' }}>Work-Life Balance:</Text>
        <Rate disabled value={record.workLifeBalance} style={{ fontSize: '12px', marginLeft: '4px' }} />
      </div>
    </div>
  ),
  width: 160
},
{
  title: 'Active Programs',
  key: 'activePrograms',
  render: (_, record) => (
    <div>
      {record.activePrograms?.slice(0, 2).map((program, index) => (
        <Tag key={index} size="small" style={{ marginBottom: '2px' }}>
          {program}
        </Tag>
      ))}
      {record.activePrograms?.length > 2 && (
        <Tooltip title={record.activePrograms.slice(2).join(', ')}>
          <Tag size="small" color="blue">
            +{record.activePrograms.length - 2} more
          </Tag>
        </Tooltip>
      )}
    </div>
  ),
  width: 150
},
{
  title: 'Last Check-in',
  dataIndex: 'lastCheckIn',
  key: 'lastCheckIn',
  render: (date) => (
    <div>
      <div style={{ fontSize: '11px' }}>
        {new Date(date).toLocaleDateString()}
      </div>
      <div style={{ fontSize: '10px', color: '#666' }}>
        {dayjs(date).fromNow()}
      </div>
    </div>
  ),
  sorter: (a, b) => new Date(a.lastCheckIn) - new Date(b.lastCheckIn),
  width: 100
},
{
  title: 'Actions',
  key: 'actions',
  render: (_, record) => (
    <Space size="small">
      <Button 
        type="link" 
        icon={<EyeOutlined />}
        size="small"
        onClick={() => {
          // View detailed employee wellness profile
        }}
      >
        View
      </Button>
      <Button 
        type="link" 
        icon={<PlusOutlined />}
        size="small"
        onClick={() => {
          setSelectedEmployee(record);
          setSupportModal(true);
        }}
      >
        Support
      </Button>
    </Space>
  ),
  width: 100
}
];

const supportCaseColumns = [
{
  title: 'Case Details',
  key: 'caseDetails',
  render: (_, record) => (
    <div>
      <Text strong>{record.employeeName}</Text>
      <br />
      <Text type="secondary" style={{ fontSize: '11px' }}>
        {record.caseType?.replace('_', ' ').toUpperCase()}
      </Text>
      <br />
      <Text style={{ fontSize: '10px' }}>
        Opened: {new Date(record.openedDate).toLocaleDateString()}
      </Text>
    </div>
  ),
  width: 150
},
{
  title: 'Description',
  dataIndex: 'description',
  key: 'description',
  render: (description) => (
    <Paragraph ellipsis={{ rows: 2 }} style={{ margin: 0, fontSize: '12px', maxWidth: '300px' }}>
      {description}
    </Paragraph>
  ),
  width: 300
},
{
  title: 'Priority & Status',
  key: 'priorityStatus',
  render: (_, record) => (
    <div>
      <Tag color={record.priority === 'high' ? 'red' : record.priority === 'medium' ? 'orange' : 'green'}>
        {record.priority?.toUpperCase()}
      </Tag>
      <br />
      {getCaseStatusTag(record.status)}
    </div>
  ),
  width: 120
},
{
  title: 'Assigned To',
  dataIndex: 'assignedTo',
  key: 'assignedTo',
  width: 100
},
{
  title: 'Next Follow-up',
  key: 'nextFollowUp',
  render: (_, record) => (
    <div>
      {record.nextFollowUp ? (
        <>
          <div style={{ fontSize: '11px' }}>
            {new Date(record.nextFollowUp).toLocaleDateString()}
          </div>
          <div style={{ fontSize: '10px', color: '#666' }}>
            {dayjs(record.nextFollowUp).fromNow()}
          </div>
        </>
      ) : (
        <Text type="secondary">None scheduled</Text>
      )}
    </div>
  ),
  width: 120
},
{
  title: 'Actions',
  key: 'actions',
  render: (_, record) => (
    <Space size="small">
      <Button type="link" icon={<EyeOutlined />} size="small">
        View
      </Button>
    </Space>
  ),
  width: 80
}
];

if (loading && !welfareData) {
return (
  <div style={{ padding: '24px', textAlign: 'center' }}>
    <Spin size="large" />
    <div style={{ marginTop: '16px' }}>Loading employee welfare data...</div>
  </div>
);
}

return (
<div style={{ padding: '24px' }}>
  <Card>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
      <Title level={2} style={{ margin: 0 }}>
        <HeartOutlined /> Employee Welfare Management
      </Title>
      <Space>
        <Button icon={<BarChartOutlined />}>
          Welfare Analytics
        </Button>
        <Button 
          icon={<ReloadOutlined />}
          onClick={fetchWelfareData}
          loading={loading}
        >
          Refresh
        </Button>
      </Space>
    </div>

    {error && (
      <Alert
        message="Error Loading Data"
        description={error}
        type="error"
        showIcon
        closable
        style={{ marginBottom: '16px' }}
        onClose={() => setError(null)}
      />
    )}

    <Tabs activeKey={activeTab} onChange={setActiveTab}>
      <TabPane 
        tab={
          <span>
            <BarChartOutlined />
            Welfare Overview
          </span>
        } 
        key="overview"
      >
        {/* Welfare Overview Stats */}
        <Row gutter={16} style={{ marginBottom: '24px' }}>
          <Col xs={12} sm={8} md={6}>
            <Card size="small">
              <Statistic
                title="Total Employees"
                value={welfareData?.totalEmployees || 0}
                prefix={<UserOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={8} md={6}>
            <Card size="small">
              <Statistic
                title="Wellness Participation"
                value={welfareData?.wellnessParticipation || 0}
                suffix="%"
                prefix={<HeartOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={8} md={6}>
            <Card size="small">
              <Statistic
                title="Satisfaction Score"
                value={welfareData?.satisfactionScore || 0}
                suffix="/5.0"
                prefix={<SmileOutlined />}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={8} md={6}>
            <Card size="small">
              <Statistic
                title="Active Programs"
                value={welfareData?.activePrograms || 0}
                prefix={<TrophyOutlined />}
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={8} md={6}>
            <Card size="small">
              <Statistic
                title="Support Cases Open"
                value={welfareData?.supportCasesOpen || 0}
                prefix={<MedicineBoxOutlined />}
                valueStyle={{ color: '#ff4d4f' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={8} md={6}>
            <Card size="small">
              <Statistic
                title="Mental Health Support"
                value={welfareData?.mentalHealthSupport || 0}
                prefix={<SafetyCertificateOutlined />}
                valueStyle={{ color: '#13c2c2' }}
              />
            </Card>
          </Col>
        </Row>

        {/* Welfare Score Overview */}
        <Row gutter={16} style={{ marginBottom: '24px' }}>
          <Col span={12}>
            <Card title="Overall Welfare Score" size="small">
              <div style={{ textAlign: 'center' }}>
                <Progress
                  type="circle"
                  percent={welfareData?.overallWelfareScore || 0}
                  format={(percent) => `${percent}%`}
                  width={120}
                  strokeColor={{
                    '0%': '#108ee9',
                    '100%': '#87d068',
                  }}
                />
                <div style={{ marginTop: '16px' }}>
                  <Text type="secondary">
                    Based on satisfaction surveys, program participation, and wellness metrics
                  </Text>
                </div>
              </div>
            </Card>
          </Col>
          <Col span={12}>
            <Card title="Work-Life Balance Average" size="small">
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#faad14' }}>
                  {welfareData?.workLifeBalance || 0}
                </div>
                <div style={{ fontSize: '16px', color: '#666' }}>out of 5.0</div>
                <Rate disabled value={welfareData?.workLifeBalance || 0} style={{ marginTop: '8px' }} />
              </div>
            </Card>
          </Col>
        </Row>

        {/* Quick Actions */}
        <Card title="Quick Actions" size="small">
          <Space wrap>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setSupportModal(true)}>
              Create Support Case
            </Button>
            <Button icon={<CalendarOutlined />}>
              Schedule Wellness Check
            </Button>
            <Button icon={<BulbOutlined />}>
              Launch Welfare Initiative
            </Button>
            <Button icon={<BarChartOutlined />}>
              Generate Welfare Report
            </Button>
          </Space>
        </Card>
      </TabPane>

      <TabPane 
        tab={
          <span>
            <UserOutlined />
            Employee Wellness ({employeeWellness.length})
          </span>
        } 
        key="wellness"
      >
        <Card title="Employee Wellness Monitoring" size="small" style={{ marginBottom: '16px' }}>
          <Alert
            message="Employee Wellness Tracking"
            description="Monitor employee wellness scores, satisfaction ratings, and identify those who may need additional support."
            type="info"
            showIcon
            style={{ marginBottom: '16px' }}
          />

          <Table
            columns={wellnessColumns}
            dataSource={employeeWellness}
            rowKey="_id"
            pagination={{ pageSize: 10 }}
            scroll={{ x: 'max-content' }}
            rowClassName={(record) => {
              if (record.riskLevel === 'high') {
                return 'high-risk-employee';
              }
              if (record.wellnessScore < 5) {
                return 'low-wellness-employee';
              }
              return '';
            }}
          />
        </Card>
      </TabPane>

      <TabPane 
        tab={
          <span>
            <TrophyOutlined />
            Welfare Programs ({welfarePrograms.length})
          </span>
        } 
        key="programs"
      >
        <Card title="Welfare Programs Management" size="small">
          <Row gutter={16}>
            {welfarePrograms.map((program) => (
              <Col xs={24} sm={12} md={8} key={program._id} style={{ marginBottom: '16px' }}>
                <Card size="small" hoverable>
                  <div style={{ marginBottom: '12px' }}>
                    <Text strong>{program.name}</Text>
                    <br />
                    <Tag color="blue" size="small">{program.category?.replace('_', ' ').toUpperCase()}</Tag>
                    <Tag color="green" size="small">{program.status?.toUpperCase()}</Tag>
                  </div>
                  
                  <Paragraph ellipsis={{ rows: 2 }} style={{ fontSize: '12px', marginBottom: '12px' }}>
                    {program.description}
                  </Paragraph>

                  <Row gutter={8}>
                    <Col span={12}>
                      <Text type="secondary" style={{ fontSize: '11px' }}>Participants</Text>
                      <div style={{ fontWeight: 'bold' }}>{program.participants}</div>
                    </Col>
                    <Col span={12}>
                      <Text type="secondary" style={{ fontSize: '11px' }}>Effectiveness</Text>
                      <div style={{ fontWeight: 'bold' }}>{program.effectiveness}/5.0</div>
                    </Col>
                  </Row>

                  <div style={{ marginTop: '12px' }}>
                    <Text type="secondary" style={{ fontSize: '11px' }}>Budget: XAF {program.budget?.toLocaleString() || 0}</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: '11px' }}>Coordinator: {program.coordinator}</Text>
                  </div>

                  <div style={{ marginTop: '12px', textAlign: 'center' }}>
                    <Space>
                      <Button type="link" size="small" icon={<EyeOutlined />}>
                        View Details
                      </Button>
                      <Button type="link" size="small" icon={<BarChartOutlined />}>
                        Analytics
                      </Button>
                    </Space>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        </Card>
      </TabPane>

      <TabPane 
        tab={
          <span>
            <MedicineBoxOutlined />
            Support Cases ({supportCases.length})
          </span>
        } 
        key="support"
      >
        <Card title="Employee Support Cases" size="small">
          <div style={{ marginBottom: '16px' }}>
            <Space>
              <Button 
                type="primary" 
                icon={<PlusOutlined />} 
                onClick={() => setSupportModal(true)}
              >
                New Support Case
              </Button>
              <Button icon={<ReloadOutlined />}>
                Refresh Cases
              </Button>
            </Space>
          </div>

          <Table
            columns={supportCaseColumns}
            dataSource={supportCases}
            rowKey="_id"
            pagination={{ pageSize: 10 }}
            scroll={{ x: 'max-content' }}
            expandable={{
              expandedRowRender: (record) => (
                <div style={{ padding: '16px', backgroundColor: '#fafafa' }}>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Descriptions title="Case Information" column={1} size="small">
                        <Descriptions.Item label="Employee">{record.employeeName}</Descriptions.Item>
                        <Descriptions.Item label="Case Type">{record.caseType?.replace('_', ' ').toUpperCase()}</Descriptions.Item>
                        <Descriptions.Item label="Priority">{record.priority?.toUpperCase()}</Descriptions.Item>
                        <Descriptions.Item label="Status">{getCaseStatusTag(record.status)}</Descriptions.Item>
                        <Descriptions.Item label="Assigned To">{record.assignedTo}</Descriptions.Item>
                        <Descriptions.Item label="Opened">
                          {new Date(record.openedDate).toLocaleDateString()}
                        </Descriptions.Item>
                        {record.closedDate && (
                          <Descriptions.Item label="Closed">
                            {new Date(record.closedDate).toLocaleDateString()}
                          </Descriptions.Item>
                        )}
                        {record.nextFollowUp && (
                          <Descriptions.Item label="Next Follow-up">
                            {new Date(record.nextFollowUp).toLocaleDateString()}
                          </Descriptions.Item>
                        )}
                      </Descriptions>

                      {record.resolution && (
                        <div style={{ marginTop: '16px' }}>
                          <Text strong>Resolution:</Text>
                          <div style={{ 
                            marginTop: '8px', 
                            padding: '12px', 
                            backgroundColor: '#f6ffed', 
                            borderRadius: '6px', 
                            border: '1px solid #b7eb8f' 
                          }}>
                            {record.resolution}
                          </div>
                        </div>
                      )}
                    </Col>

                    <Col span={12}>
                      <div>
                        <Text strong>Action Timeline:</Text>
                        <Timeline style={{ marginTop: '12px' }}>
                          {record.actions?.map((action, index) => (
                            <Timeline.Item 
                              key={index} 
                              color={index === 0 ? 'green' : 'blue'}
                            >
                              <div style={{ fontSize: '12px' }}>
                                <Text strong>{action.date}</Text> - {action.by}
                                <div style={{ marginTop: '4px', color: '#666' }}>
                                  {action.action}
                                </div>
                              </div>
                            </Timeline.Item>
                          ))}
                        </Timeline>
                      </div>
                    </Col>
                  </Row>
                </div>
              ),
              rowExpandable: () => true,
            }}
          />
        </Card>
      </TabPane>
    </Tabs>
  </Card>

  {/* Create Support Case Modal */}
  <Modal
    title="Create Employee Support Case"
    open={supportModal}
    onCancel={() => {
      setSupportModal(false);
      setSelectedEmployee(null);
      supportForm.resetFields();
    }}
    footer={null}
    width={700}
  >
    <Form
      form={supportForm}
      layout="vertical"
      onFinish={handleCreateSupportCase}
    >
      {!selectedEmployee && (
        <Form.Item
          name="employeeId"
          label="Select Employee"
          rules={[{ required: true, message: 'Please select an employee' }]}
        >
          <Select
            showSearch
            placeholder="Search and select employee"
            optionFilterProp="children"
            filterOption={(input, option) =>
              option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
            }
          >
            {employeeWellness.map((emp) => (
              <Select.Option key={emp._id} value={emp.employeeId}>
                {emp.fullName} - {emp.department}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
      )}

      {selectedEmployee && (
        <Alert
          message={`Creating support case for: ${selectedEmployee.fullName}`}
          type="info"
          style={{ marginBottom: '16px' }}
        />
      )}

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name="caseType"
            label="Case Type"
            rules={[{ required: true, message: 'Please select case type' }]}
          >
            <Select placeholder="Select support case type">
              <Select.Option value="mental_health_support">Mental Health Support</Select.Option>
              <Select.Option value="workplace_conflict">Workplace Conflict</Select.Option>
              <Select.Option value="harassment_complaint">Harassment Complaint</Select.Option>
              <Select.Option value="work_life_balance">Work-Life Balance</Select.Option>
              <Select.Option value="career_development">Career Development</Select.Option>
              <Select.Option value="maternity_support">Maternity/Paternity Support</Select.Option>
              <Select.Option value="financial_hardship">Financial Hardship</Select.Option>
              <Select.Option value="health_accommodation">Health Accommodation</Select.Option>
              <Select.Option value="other">Other</Select.Option>
            </Select>
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="priority"
            label="Priority Level"
            rules={[{ required: true, message: 'Please select priority' }]}
          >
            <Select placeholder="Select priority level">
              <Select.Option value="high">High - Immediate Attention</Select.Option>
              <Select.Option value="medium">Medium - Standard Processing</Select.Option>
              <Select.Option value="low">Low - Routine Follow-up</Select.Option>
            </Select>
          </Form.Item>
        </Col>
      </Row>

      <Form.Item
        name="description"
        label="Case Description"
        rules={[{ required: true, message: 'Please provide case description' }]}
      >
        <TextArea 
          rows={4} 
          placeholder="Provide detailed description of the support case, including background information, specific concerns, and any immediate actions taken..."
          showCount
          maxLength={1000}
        />
      </Form.Item>

      <Form.Item
        name="nextFollowUp"
        label="Schedule Follow-up"
      >
        <DatePicker 
          style={{ width: '100%' }}
          placeholder="Select follow-up date"
          disabledDate={(current) => current && current < dayjs().startOf('day')}
        />
      </Form.Item>

      <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
        <Space>
          <Button onClick={() => setSupportModal(false)}>
            Cancel
          </Button>
          <Button type="primary" htmlType="submit" loading={loading}>
            Create Support Case
          </Button>
        </Space>
      </Form.Item>
    </Form>
  </Modal>

  <style jsx>{`
    .high-risk-employee {
      background-color: #fff2f0 !important;
      border-left: 4px solid #ff4d4f !important;
    }
    .high-risk-employee:hover {
      background-color: #ffe7e6 !important;
    }
    .low-wellness-employee {
      background-color: #fffbf0 !important;
      border-left: 3px solid #faad14 !important;
    }
    .low-wellness-employee:hover {
      background-color: #fff1d6 !important;
    }
  `}</style>
</div>
);
};

export default HREmployeeWelfare;