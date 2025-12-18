// src/pages/hr/EmployeeProfile.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  Card,
  Row,
  Col,
  Descriptions,
  Tag,
  Button,
  Space,
  Tabs,
  Typography,
  Spin,
  message,
  Modal,
  Alert,
  Timeline,
  Divider,
  Avatar,
  Badge,
  Statistic
} from 'antd';
import {
  ArrowLeftOutlined,
  EditOutlined,
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  IdcardOutlined,
  BankOutlined,
  FileTextOutlined,
  FolderOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  CalendarOutlined,
  TeamOutlined,
  TrophyOutlined
} from '@ant-design/icons';
import api from '../../services/api';
import dayjs from 'dayjs';
import DocumentManager from './DocumentManager';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

const EmployeeProfile = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  
  const [loading, setLoading] = useState(true);
  const [employee, setEmployee] = useState(null);
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'personal');
  const [leaveBalance, setLeaveBalance] = useState(null);
  const [performanceData, setPerformanceData] = useState(null);

  useEffect(() => {
    fetchEmployeeData();
  }, [id]);

  useEffect(() => {
    if (activeTab === 'leave') {
      fetchLeaveBalance();
    } else if (activeTab === 'performance') {
      fetchPerformanceData();
    }
  }, [activeTab]);

  const fetchEmployeeData = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/hr/employees/${id}`);
      setEmployee(response.data.data);
    } catch (error) {
      console.error('Error fetching employee:', error);
      message.error('Failed to load employee data');
      navigate('/hr/employees');
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaveBalance = async () => {
    try {
      const response = await api.get(`/hr/employees/${id}/leave-balance`);
      setLeaveBalance(response.data.data);
    } catch (error) {
      console.error('Error fetching leave balance:', error);
    }
  };

  const fetchPerformanceData = async () => {
    try {
      const response = await api.get(`/hr/employees/${id}/performance`);
      setPerformanceData(response.data.data);
    } catch (error) {
      console.error('Error fetching performance data:', error);
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

  const checkDocumentCompletion = () => {
    if (!employee?.employmentDetails?.documents) return { total: 0, uploaded: 0, percentage: 0 };
    
    const requiredDocs = [
      'nationalId', 'birthCertificate', 'bankAttestation', 'locationPlan',
      'medicalCertificate', 'criminalRecord', 'employmentContract'
    ];
    
    const docs = employee.employmentDetails.documents;
    const uploaded = requiredDocs.filter(doc => docs[doc] && (docs[doc].filename || docs[doc].filePath)).length;
    
    // Add array documents
    if (docs.references && docs.references.length > 0) uploaded += 1;
    if (docs.academicDiplomas && docs.academicDiplomas.length > 0) uploaded += 1;
    if (docs.workCertificates && docs.workCertificates.length > 0) uploaded += 1;
    
    const total = 10; // Total required documents
    const percentage = Math.round((uploaded / total) * 100);
    
    return { total, uploaded, percentage };
  };

  if (loading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!employee) {
    return (
      <div style={{ padding: '24px' }}>
        <Alert
          message="Employee Not Found"
          description="The requested employee could not be found."
          type="error"
          showIcon
        />
      </div>
    );
  }

  const docCompletion = checkDocumentCompletion();
  const contractDaysRemaining = employee.employmentDetails?.contractEndDate
    ? dayjs(employee.employmentDetails.contractEndDate).diff(dayjs(), 'days')
    : null;
  const probationDaysRemaining = employee.employmentDetails?.probationEndDate
    ? dayjs(employee.employmentDetails.probationEndDate).diff(dayjs(), 'days')
    : null;

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <Card style={{ marginBottom: '24px' }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/hr/employees')}
          style={{ marginBottom: '16px' }}
        >
          Back to Employees
        </Button>

        <Row gutter={24} align="middle">
          <Col>
            <Avatar size={80} icon={<UserOutlined />} />
          </Col>
          <Col flex="auto">
            <Title level={2} style={{ margin: 0 }}>
              {employee.fullName}
            </Title>
            <Space direction="vertical" size="small">
              <Text type="secondary">{employee.position}</Text>
              <Space>
                <Tag color="blue">{employee.department}</Tag>
                <Tag color={getStatusColor(employee.employmentDetails?.employmentStatus)}>
                  {employee.employmentDetails?.employmentStatus || 'N/A'}
                </Tag>
                {employee.employmentDetails?.employeeId && (
                  <Tag>{employee.employmentDetails.employeeId}</Tag>
                )}
              </Space>
            </Space>
          </Col>
          <Col>
            <Space direction="vertical">
              <Button
                type="primary"
                icon={<EditOutlined />}
                onClick={() => navigate(`/hr/employees/${id}/edit`)}
              >
                Edit Profile
              </Button>
              <Button
                icon={<FolderOutlined />}
                onClick={() => setActiveTab('documents')}
              >
                Manage Documents
              </Button>
            </Space>
          </Col>
        </Row>

        {/* Quick Stats */}
        <Divider />
        <Row gutter={16}>
          <Col xs={12} sm={6}>
            <Statistic
              title="Days Employed"
              value={employee.employmentDetails?.startDate 
                ? dayjs().diff(dayjs(employee.employmentDetails.startDate), 'days')
                : 0
              }
              prefix={<CalendarOutlined />}
            />
          </Col>
          <Col xs={12} sm={6}>
            <Statistic
              title="Documents"
              value={`${docCompletion.uploaded}/${docCompletion.total}`}
              prefix={<FolderOutlined />}
              valueStyle={{ 
                color: docCompletion.percentage === 100 ? '#52c41a' : '#faad14' 
              }}
            />
          </Col>
          {contractDaysRemaining !== null && contractDaysRemaining > 0 && (
            <Col xs={12} sm={6}>
              <Statistic
                title="Contract Days Left"
                value={contractDaysRemaining}
                prefix={<ClockCircleOutlined />}
                valueStyle={{ 
                  color: contractDaysRemaining <= 30 ? '#ff4d4f' : '#1890ff' 
                }}
              />
            </Col>
          )}
          {probationDaysRemaining !== null && probationDaysRemaining > 0 && (
            <Col xs={12} sm={6}>
              <Statistic
                title="Probation Days Left"
                value={probationDaysRemaining}
                prefix={<ClockCircleOutlined />}
                valueStyle={{ color: '#faad14' }}
              />
            </Col>
          )}
        </Row>

        {/* Alerts */}
        {contractDaysRemaining !== null && contractDaysRemaining <= 30 && contractDaysRemaining > 0 && (
          <Alert
            message="Contract Expiring Soon"
            description={`This employee's contract expires in ${contractDaysRemaining} days. Please process renewal if needed.`}
            type="warning"
            showIcon
            style={{ marginTop: '16px' }}
            action={
              <Button size="small" onClick={() => navigate(`/hr/contracts?employee=${id}`)}>
                Manage Contract
              </Button>
            }
          />
        )}

        {probationDaysRemaining !== null && probationDaysRemaining <= 14 && probationDaysRemaining > 0 && (
          <Alert
            message="Probation Period Ending"
            description={`Probation period ends in ${probationDaysRemaining} days. Please complete evaluation.`}
            type="info"
            showIcon
            style={{ marginTop: '16px' }}
          />
        )}

        {docCompletion.percentage < 100 && (
          <Alert
            message="Incomplete Documentation"
            description={`${docCompletion.total - docCompletion.uploaded} required documents missing.`}
            type="warning"
            showIcon
            style={{ marginTop: '16px' }}
            action={
              <Button size="small" onClick={() => setActiveTab('documents')}>
                Upload Documents
              </Button>
            }
          />
        )}
      </Card>

      {/* Tabs */}
      <Card>
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          {/* Personal Information Tab */}
          <TabPane 
            tab={
              <span>
                <UserOutlined />
                Personal Info
              </span>
            } 
            key="personal"
          >
            <Descriptions bordered column={{ xs: 1, sm: 2 }}>
              <Descriptions.Item label="Full Name">
                {employee.fullName}
              </Descriptions.Item>
              <Descriptions.Item label="Email">
                <Space>
                  <MailOutlined />
                  {employee.email}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="Department">
                {employee.department}
              </Descriptions.Item>
              <Descriptions.Item label="Position">
                {employee.position}
              </Descriptions.Item>
              <Descriptions.Item label="System Role">
                <Tag color="blue">{employee.role}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Department Role">
                <Tag>{employee.departmentRole || 'Staff'}</Tag>
              </Descriptions.Item>
            </Descriptions>

            {/* Emergency Contacts */}
            {employee.employmentDetails?.emergencyContacts?.length > 0 && (
              <>
                <Divider orientation="left">
                  <PhoneOutlined /> Emergency Contacts
                </Divider>
                {employee.employmentDetails.emergencyContacts.map((contact, index) => (
                  <Card 
                    key={index} 
                    size="small" 
                    style={{ marginBottom: '16px' }}
                    title={
                      <Space>
                        {contact.name}
                        {contact.isPrimary && <Badge status="success" text="Primary" />}
                      </Space>
                    }
                  >
                    <Descriptions column={2} size="small">
                      <Descriptions.Item label="Relationship">
                        {contact.relationship}
                      </Descriptions.Item>
                      <Descriptions.Item label="Phone">
                        <Space>
                          <PhoneOutlined />
                          {contact.phone}
                        </Space>
                      </Descriptions.Item>
                      {contact.email && (
                        <Descriptions.Item label="Email" span={2}>
                          <Space>
                            <MailOutlined />
                            {contact.email}
                          </Space>
                        </Descriptions.Item>
                      )}
                    </Descriptions>
                  </Card>
                ))}
              </>
            )}
          </TabPane>

          {/* Employment Details Tab */}
          <TabPane 
            tab={
              <span>
                <IdcardOutlined />
                Employment
              </span>
            } 
            key="employment"
          >
            <Descriptions bordered column={{ xs: 1, sm: 2 }}>
              <Descriptions.Item label="Employee ID">
                {employee.employmentDetails?.employeeId || 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label="Contract Type">
                <Tag>{employee.employmentDetails?.contractType}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Employment Status">
                <Tag color={getStatusColor(employee.employmentDetails?.employmentStatus)}>
                  {employee.employmentDetails?.employmentStatus}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Start Date">
                {employee.employmentDetails?.startDate 
                  ? dayjs(employee.employmentDetails.startDate).format('MMM DD, YYYY')
                  : 'N/A'
                }
              </Descriptions.Item>
              {employee.employmentDetails?.probationEndDate && (
                <Descriptions.Item label="Probation End Date">
                  {dayjs(employee.employmentDetails.probationEndDate).format('MMM DD, YYYY')}
                  {probationDaysRemaining > 0 && (
                    <Text type="secondary" style={{ display: 'block', fontSize: '12px' }}>
                      {probationDaysRemaining} days remaining
                    </Text>
                  )}
                </Descriptions.Item>
              )}
              {employee.employmentDetails?.contractEndDate && (
                <Descriptions.Item label="Contract End Date">
                  {dayjs(employee.employmentDetails.contractEndDate).format('MMM DD, YYYY')}
                  {contractDaysRemaining > 0 && (
                    <Text 
                      type={contractDaysRemaining <= 30 ? 'danger' : 'secondary'}
                      style={{ display: 'block', fontSize: '12px' }}
                    >
                      {contractDaysRemaining} days remaining
                    </Text>
                  )}
                </Descriptions.Item>
              )}
            </Descriptions>

            <Divider orientation="left">
              <BankOutlined /> Compensation
            </Divider>

            <Descriptions bordered column={{ xs: 1, sm: 2 }}>
              <Descriptions.Item label="Salary">
                {employee.employmentDetails?.salary?.amount 
                  ? `${employee.employmentDetails.salary.currency} ${employee.employmentDetails.salary.amount.toLocaleString()}`
                  : 'Not specified'
                }
              </Descriptions.Item>
              <Descriptions.Item label="Payment Frequency">
                {employee.employmentDetails?.salary?.paymentFrequency || 'N/A'}
              </Descriptions.Item>
            </Descriptions>

            <Divider orientation="left">
              <IdcardOutlined /> Government IDs
            </Divider>

            <Descriptions bordered column={{ xs: 1, sm: 2 }}>
              <Descriptions.Item label="CNPS Number">
                {employee.employmentDetails?.governmentIds?.cnpsNumber || 'Not provided'}
              </Descriptions.Item>
              <Descriptions.Item label="Taxpayer Number">
                {employee.employmentDetails?.governmentIds?.taxPayerNumber || 'Not provided'}
              </Descriptions.Item>
              <Descriptions.Item label="National ID" span={2}>
                {employee.employmentDetails?.governmentIds?.nationalIdNumber || 'Not provided'}
              </Descriptions.Item>
            </Descriptions>

            {employee.employmentDetails?.hrNotes && (
              <>
                <Divider orientation="left">HR Notes</Divider>
                <Alert
                  message="Internal HR Notes"
                  description={employee.employmentDetails.hrNotes}
                  type="info"
                  showIcon
                />
              </>
            )}
          </TabPane>

          {/* Documents Tab */}
          <TabPane 
            tab={
              <span>
                <FolderOutlined />
                Documents
                {docCompletion.percentage < 100 && (
                  <Badge count={docCompletion.total - docCompletion.uploaded} style={{ marginLeft: '8px' }} />
                )}
              </span>
            } 
            key="documents"
          >
            <DocumentManager employeeId={id} employee={employee} onUpdate={fetchEmployeeData} />
          </TabPane>

          {/* Leave History Tab */}
          <TabPane 
            tab={
              <span>
                <CalendarOutlined />
                Leave History
              </span>
            } 
            key="leave"
          >
            {leaveBalance ? (
              <>
                <Row gutter={16} style={{ marginBottom: '24px' }}>
                  <Col xs={24} sm={8}>
                    <Card>
                      <Statistic
                        title="Annual Leave Balance"
                        value={leaveBalance.annualLeave?.balance || 0}
                        suffix={`/ ${leaveBalance.annualLeave?.total || 0} days`}
                        valueStyle={{ color: '#52c41a' }}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={8}>
                    <Card>
                      <Statistic
                        title="Sick Leave Used"
                        value={leaveBalance.sickLeave?.used || 0}
                        suffix="days"
                        valueStyle={{ color: '#faad14' }}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={8}>
                    <Card>
                      <Statistic
                        title="Total Leave Taken"
                        value={(leaveBalance.annualLeave?.used || 0) + (leaveBalance.sickLeave?.used || 0)}
                        suffix="days"
                        valueStyle={{ color: '#1890ff' }}
                      />
                    </Card>
                  </Col>
                </Row>

                {leaveBalance.recentLeaves?.length > 0 && (
                  <>
                    <Divider orientation="left">Recent Leave Requests</Divider>
                    <Timeline>
                      {leaveBalance.recentLeaves.map((leave, index) => (
                        <Timeline.Item
                          key={index}
                          color={leave.status === 'approved' ? 'green' : 'blue'}
                        >
                          <Text strong>{leave.leaveType}</Text>
                          <br />
                          <Text type="secondary">
                            {dayjs(leave.startDate).format('MMM DD')} - {dayjs(leave.endDate).format('MMM DD, YYYY')}
                          </Text>
                          <br />
                          <Tag color={leave.status === 'approved' ? 'green' : 'orange'}>
                            {leave.status}
                          </Tag>
                        </Timeline.Item>
                      ))}
                    </Timeline>
                  </>
                )}

                <Button
                  type="link"
                  onClick={() => navigate('/hr/sick-leave', { state: { employeeId: id } })}
                  style={{ padding: 0, marginTop: '16px' }}
                >
                  View Full Leave History →
                </Button>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <Spin />
                <div style={{ marginTop: '16px' }}>Loading leave data...</div>
              </div>
            )}
          </TabPane>

          {/* Performance Tab */}
          <TabPane 
            tab={
              <span>
                <TrophyOutlined />
                Performance
              </span>
            } 
            key="performance"
          >
            {performanceData ? (
              <>
                {performanceData.latestEvaluation && (
                  <Card 
                    title="Latest Performance Evaluation"
                    extra={
                      <Tag color="blue">
                        {dayjs(performanceData.latestEvaluation.evaluationDate).format('MMM YYYY')}
                      </Tag>
                    }
                    style={{ marginBottom: '24px' }}
                  >
                    <Row gutter={16}>
                      <Col xs={24} sm={12}>
                        <Statistic
                          title="Overall Score"
                          value={performanceData.latestEvaluation.overallScore}
                          suffix="/ 100"
                          valueStyle={{ color: '#52c41a' }}
                        />
                      </Col>
                      <Col xs={24} sm={12}>
                        <Statistic
                          title="Rating"
                          value={performanceData.latestEvaluation.rating}
                          valueStyle={{ color: '#1890ff' }}
                        />
                      </Col>
                    </Row>
                  </Card>
                )}

                {performanceData.kpiAchievement && (
                  <Card title="KPI Achievement" style={{ marginBottom: '24px' }}>
                    <Statistic
                      title="Current Quarter"
                      value={performanceData.kpiAchievement.overallAchievement}
                      suffix="%"
                      valueStyle={{ color: '#faad14' }}
                    />
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      Based on {performanceData.kpiAchievement.totalKPIs} KPIs
                    </Text>
                  </Card>
                )}

                <Button
                  type="link"
                  onClick={() => navigate(`/supervisor/quarterly-evaluations?employee=${id}`)}
                  style={{ padding: 0 }}
                >
                  View Full Performance History →
                </Button>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <Spin />
                <div style={{ marginTop: '16px' }}>Loading performance data...</div>
              </div>
            )}
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
};

export default EmployeeProfile;