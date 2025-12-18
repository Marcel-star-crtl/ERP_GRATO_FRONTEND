import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Form,
  Select,
  Button,
  Space,
  message,
  Alert,
  Steps,
  Descriptions,
  Table,
  Progress,
  Divider,
  Typography,
  Row,
  Col,
  Statistic,
  Tag,
  Spin,
  TextArea
} from 'antd';
import {
  TrophyOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  SendOutlined
} from '@ant-design/icons';
import { quarterlyEvaluationAPI } from '../../services/quarterlyEvaluationAPI';
import { useSelector } from 'react-redux';

const { Option } = Select;
const { Title, Text } = Typography;
const { Step } = Steps;

const QuarterlyEvaluationGenerate = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedQuarter, setSelectedQuarter] = useState('');
  const [generatedEvaluation, setGeneratedEvaluation] = useState(null);

  useEffect(() => {
    loadEmployees();
    
    // Set current quarter
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    const quarter = Math.ceil(month / 3);
    setSelectedQuarter(`Q${quarter}-${year}`);
  }, []);

  const loadEmployees = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/auth/active-users', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          const filtered = result.data.filter(u => 
            u.department === user.department && 
            u.role !== 'supervisor' &&
            u._id !== user._id
          );
          setEmployees(filtered);
        }
      }
    } catch (error) {
      console.error('Error loading employees:', error);
    }
  };

  const handleGenerate = async () => {
    if (!selectedEmployee) {
      message.error('Please select an employee');
      return;
    }

    try {
      setLoading(true);
      const result = await quarterlyEvaluationAPI.generateEvaluation(
        selectedEmployee,
        selectedQuarter
      );

      if (result.success) {
        message.success('Quarterly evaluation generated successfully');
        setGeneratedEvaluation(result.data);
        setCurrentStep(1);
      } else {
        message.error(result.message || 'Failed to generate evaluation');
      }
    } catch (error) {
      console.error('Error generating evaluation:', error);
      message.error('Failed to generate evaluation');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    const supervisorComments = form.getFieldValue('supervisorComments') || '';

    try {
      setLoading(true);
      const result = await quarterlyEvaluationAPI.submitEvaluation(
        generatedEvaluation._id,
        supervisorComments
      );

      if (result.success) {
        message.success('Evaluation submitted to employee');
        navigate('/supervisor/evaluations/quarterly');
      } else {
        message.error(result.message || 'Failed to submit evaluation');
      }
    } catch (error) {
      console.error('Error submitting evaluation:', error);
      message.error('Failed to submit evaluation');
    } finally {
      setLoading(false);
    }
  };

  const getGradeColor = (grade) => {
    if (grade.startsWith('A')) return '#52c41a';
    if (grade.startsWith('B')) return '#1890ff';
    if (grade.startsWith('C')) return '#faad14';
    if (grade.startsWith('D')) return '#ff7a45';
    return '#f5222d';
  };

  const kpiColumns = [
    {
      title: 'KPI',
      dataIndex: 'kpiTitle',
      key: 'kpiTitle',
      width: 250,
      render: (text) => <strong>{text}</strong>
    },
    {
      title: 'Weight',
      dataIndex: 'kpiWeight',
      key: 'kpiWeight',
      width: 80,
      render: (weight) => <Tag color="blue">{weight}%</Tag>
    },
    {
      title: 'Tasks Completed',
      dataIndex: 'tasksCompleted',
      key: 'tasksCompleted',
      width: 120
    },
    {
      title: 'Avg Grade',
      dataIndex: 'averageGrade',
      key: 'averageGrade',
      width: 100,
      render: (grade) => (
        <Tag color={grade >= 4 ? 'success' : grade >= 3 ? 'warning' : 'error'}>
          {grade.toFixed(2)}/5
        </Tag>
      )
    },
    {
      title: 'Achievement',
      dataIndex: 'achievedScore',
      key: 'achievedScore',
      width: 120,
      render: (score) => (
        <Progress 
          percent={score} 
          size="small" 
          format={(percent) => `${percent.toFixed(1)}%`}
        />
      )
    },
    {
      title: 'Weighted Score',
      dataIndex: 'weightedScore',
      key: 'weightedScore',
      width: 120,
      render: (score) => (
        <Tag color="purple">{score.toFixed(2)}%</Tag>
      )
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <Title level={3} style={{ marginBottom: '24px' }}>
          <TrophyOutlined /> Generate Quarterly Evaluation
        </Title>

        <Steps current={currentStep} style={{ marginBottom: '32px' }}>
          <Step title="Select Employee" description="Choose employee to evaluate" />
          <Step title="Review Results" description="Check calculated scores" />
          <Step title="Submit" description="Send to employee" />
        </Steps>

        {currentStep === 0 && (
          <>
            <Alert
              message="Prerequisites"
              description={
                <ul style={{ marginBottom: 0, paddingLeft: '20px' }}>
                  <li>Employee must have approved KPIs for the quarter</li>
                  <li>Employee must have completed tasks linked to KPIs</li>
                  <li>Behavioral evaluation must be completed and submitted</li>
                  <li>All completed tasks must be graded (1-5 scale)</li>
                </ul>
              }
              type="info"
              showIcon
              closable
              style={{ marginBottom: '24px' }}
            />

            <Form form={form} layout="vertical">
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="Select Employee"
                    required
                  >
                    <Select
                      placeholder="Choose employee to evaluate"
                      showSearch
                      value={selectedEmployee}
                      onChange={setSelectedEmployee}
                      filterOption={(input, option) =>
                        option.children.toLowerCase().includes(input.toLowerCase())
                      }
                    >
                      {employees.map(emp => (
                        <Option key={emp._id} value={emp._id}>
                          {emp.fullName} - {emp.position}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item label="Quarter">
                    <Select value={selectedQuarter} onChange={setSelectedQuarter}>
                      <Option value={`Q1-${new Date().getFullYear()}`}>
                        Q1-{new Date().getFullYear()}
                      </Option>
                      <Option value={`Q2-${new Date().getFullYear()}`}>
                        Q2-{new Date().getFullYear()}
                      </Option>
                      <Option value={`Q3-${new Date().getFullYear()}`}>
                        Q3-{new Date().getFullYear()}
                      </Option>
                      <Option value={`Q4-${new Date().getFullYear()}`}>
                        Q4-{new Date().getFullYear()}
                      </Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Button
                type="primary"
                icon={<TrophyOutlined />}
                onClick={handleGenerate}
                loading={loading}
                disabled={!selectedEmployee}
                size="large"
              >
                Generate Evaluation
              </Button>
            </Form>
          </>
        )}

        {currentStep === 1 && generatedEvaluation && (
          <>
            {/* Final Score Display */}
            <Card 
              style={{ 
                marginBottom: '24px', 
                backgroundColor: '#f0f8ff',
                border: `3px solid ${getGradeColor(generatedEvaluation.grade)}`
              }}
            >
              <div style={{ textAlign: 'center' }}>
                <Title level={4}>Quarterly Performance Score</Title>
                <div style={{ 
                  fontSize: '72px', 
                  fontWeight: 'bold', 
                  color: getGradeColor(generatedEvaluation.grade),
                  marginTop: '16px'
                }}>
                  {generatedEvaluation.finalScore.toFixed(1)}%
                </div>
                <Tag 
                  color={getGradeColor(generatedEvaluation.grade)}
                  style={{ 
                    fontSize: '24px', 
                    padding: '8px 24px',
                    marginTop: '16px'
                  }}
                >
                  Grade: {generatedEvaluation.grade}
                </Tag>
                <div style={{ marginTop: '16px' }}>
                  <Tag color="blue" style={{ fontSize: '16px', padding: '4px 12px' }}>
                    {generatedEvaluation.performanceLevel}
                  </Tag>
                </div>
              </div>
            </Card>

            {/* Score Breakdown */}
            <Card size="small" style={{ marginBottom: '24px' }}>
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Statistic
                    title="Task Performance (70%)"
                    value={generatedEvaluation.taskMetrics.taskPerformanceScore.toFixed(1)}
                    suffix="%"
                    valueStyle={{ color: '#1890ff' }}
                  />
                  <Progress
                    percent={generatedEvaluation.taskMetrics.taskPerformanceScore}
                    strokeColor="#1890ff"
                    showInfo={false}
                  />
                </Col>
                <Col xs={24} md={12}>
                  <Statistic
                    title="Behavioral Performance (30%)"
                    value={generatedEvaluation.behavioralScore.toFixed(1)}
                    suffix="%"
                    valueStyle={{ color: '#52c41a' }}
                  />
                  <Progress
                    percent={generatedEvaluation.behavioralScore}
                    strokeColor="#52c41a"
                    showInfo={false}
                  />
                </Col>
              </Row>
            </Card>

            {/* Employee Info */}
            <Card title="Employee Information" size="small" style={{ marginBottom: '24px' }}>
              <Descriptions column={2}>
                <Descriptions.Item label="Employee">
                  {generatedEvaluation.employee.fullName}
                </Descriptions.Item>
                <Descriptions.Item label="Department">
                  {generatedEvaluation.employee.department}
                </Descriptions.Item>
                <Descriptions.Item label="Quarter">
                  {generatedEvaluation.quarter}
                </Descriptions.Item>
                <Descriptions.Item label="Position">
                  {generatedEvaluation.employee.position}
                </Descriptions.Item>
              </Descriptions>
            </Card>

            <Divider />

            {/* Task Performance Details */}
            <Card title="Task Performance Breakdown (70%)" style={{ marginBottom: '24px' }}>
              <Row gutter={16} style={{ marginBottom: '16px' }}>
                <Col xs={12} sm={8}>
                  <Statistic
                    title="Total Tasks"
                    value={generatedEvaluation.taskMetrics.totalTasks}
                  />
                </Col>
                <Col xs={12} sm={8}>
                  <Statistic
                    title="Completed"
                    value={generatedEvaluation.taskMetrics.completedTasks}
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Col>
                <Col xs={12} sm={8}>
                  <Statistic
                    title="Avg Grade"
                    value={generatedEvaluation.taskMetrics.averageCompletionGrade.toFixed(2)}
                    suffix="/5"
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Col>
              </Row>

              <Divider />

              <Title level={5}>KPI Achievement</Title>
              <Table
                columns={kpiColumns}
                dataSource={generatedEvaluation.taskMetrics.kpiAchievement}
                pagination={false}
                rowKey="kpiTitle"
                size="small"
                bordered
                scroll={{ x: 900 }}
              />

              <div style={{ marginTop: '16px', textAlign: 'right' }}>
                <Text strong>Total Task Performance Score: </Text>
                <Tag color="blue" style={{ fontSize: '16px', padding: '4px 12px' }}>
                  {generatedEvaluation.taskMetrics.taskPerformanceScore.toFixed(2)}%
                </Tag>
              </div>
            </Card>

            {/* Behavioral Performance */}
            <Card title="Behavioral Performance (30%)" style={{ marginBottom: '24px' }}>
              <div style={{ textAlign: 'center', padding: '24px' }}>
                <Progress
                  type="circle"
                  percent={generatedEvaluation.behavioralScore}
                  format={(percent) => `${percent.toFixed(1)}%`}
                  strokeColor="#52c41a"
                  width={120}
                />
                <div style={{ marginTop: '16px' }}>
                  <Text>Based on supervisor behavioral evaluation</Text>
                </div>
              </div>
            </Card>

            {/* Calculation Formula */}
            <Alert
              message="Calculation Method"
              description={
                <div>
                  <p><strong>Final Score = (Task Performance × 70%) + (Behavioral Score × 30%)</strong></p>
                  <p>
                    = ({generatedEvaluation.taskMetrics.taskPerformanceScore.toFixed(2)}% × 0.7) + 
                    ({generatedEvaluation.behavioralScore.toFixed(2)}% × 0.3)
                  </p>
                  <p>
                    = {(generatedEvaluation.taskMetrics.taskPerformanceScore * 0.7).toFixed(2)}% + 
                    {(generatedEvaluation.behavioralScore * 0.3).toFixed(2)}%
                  </p>
                  <p><strong>= {generatedEvaluation.finalScore.toFixed(2)}%</strong></p>
                </div>
              }
              type="info"
              showIcon
              style={{ marginBottom: '24px' }}
            />

            {/* Actions */}
            <Space>
              <Button onClick={() => setCurrentStep(0)}>
                Back
              </Button>
              <Button
                type="primary"
                icon={<SendOutlined />}
                onClick={() => setCurrentStep(2)}
              >
                Continue to Submit
              </Button>
            </Space>
          </>
        )}

        {currentStep === 2 && generatedEvaluation && (
          <>
            <Alert
              message="Ready to Submit"
              description="The evaluation will be sent to the employee for review and acknowledgment. You can optionally add supervisor comments."
              type="success"
              showIcon
              style={{ marginBottom: '24px' }}
            />

            <Card style={{ marginBottom: '24px' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>
                  🎯
                </div>
                <Title level={4}>Final Score: {generatedEvaluation.finalScore.toFixed(1)}%</Title>
                <Tag 
                  color={getGradeColor(generatedEvaluation.grade)}
                  style={{ fontSize: '20px', padding: '6px 16px' }}
                >
                  Grade: {generatedEvaluation.grade}
                </Tag>
                <div style={{ marginTop: '8px' }}>
                  <Text type="secondary">{generatedEvaluation.performanceLevel}</Text>
                </div>
              </div>
            </Card>

            <Form form={form} layout="vertical">
              <Form.Item
                name="supervisorComments"
                label="Supervisor Comments (Optional)"
              >
                <TextArea
                  rows={4}
                  placeholder="Add any additional comments or feedback for the employee..."
                  showCount
                  maxLength={2000}
                />
              </Form.Item>

              <Space>
                <Button onClick={() => setCurrentStep(1)}>
                  Back to Review
                </Button>
                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  onClick={handleSubmit}
                  loading={loading}
                  size="large"
                  style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
                >
                  Submit Evaluation to Employee
                </Button>
              </Space>
            </Form>
          </>
        )}
      </Card>
    </div>
  );
};

export default QuarterlyEvaluationGenerate;