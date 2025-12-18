import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Descriptions,
  Table,
  Button,
  Space,
  message,
  Tag,
  Progress,
  Divider,
  Typography,
  Alert,
  Row,
  Col,
  Statistic,
  Form,
  Input,
  Modal
} from 'antd';
import {
  TrophyOutlined,
  CheckCircleOutlined,
  CalendarOutlined,
  UserOutlined
} from '@ant-design/icons';
import { quarterlyEvaluationAPI } from '../../services/quarterlyEvaluationAPI';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const EmployeeQuarterlyEvaluationView = () => {
  const { evaluationId } = useParams();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [evaluation, setEvaluation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [acknowledgeModalVisible, setAcknowledgeModalVisible] = useState(false);

  useEffect(() => {
    fetchEvaluation();
  }, [evaluationId]);

  const fetchEvaluation = async () => {
    try {
      setLoading(true);
      const result = await quarterlyEvaluationAPI.getEvaluation(evaluationId);
      
      if (result.success) {
        setEvaluation(result.data);
      } else {
        message.error(result.message || 'Failed to load evaluation');
        navigate('/evaluations/quarterly');
      }
    } catch (error) {
      console.error('Error fetching evaluation:', error);
      message.error('Failed to load evaluation');
      navigate('/evaluations/quarterly');
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledge = async (values) => {
    try {
      setLoading(true);
      const result = await quarterlyEvaluationAPI.acknowledgeEvaluation(
        evaluationId,
        values.employeeComments || ''
      );
      
      if (result.success) {
        message.success('Evaluation acknowledged successfully');
        setAcknowledgeModalVisible(false);
        await fetchEvaluation();
      } else {
        message.error(result.message || 'Failed to acknowledge evaluation');
      }
    } catch (error) {
      console.error('Error acknowledging evaluation:', error);
      message.error('Failed to acknowledge evaluation');
    } finally {
      setLoading(false);
    }
  };

  if (!evaluation) {
    return <div style={{ padding: '24px' }}>Loading...</div>;
  }

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
      width: 150,
      render: (score) => (
        <Progress 
          percent={score} 
          size="small" 
          format={(percent) => `${percent.toFixed(1)}%`}
        />
      )
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card loading={loading}>
        <Title level={3} style={{ marginBottom: '24px' }}>
          <TrophyOutlined /> Your Quarterly Performance Evaluation
        </Title>

        {evaluation.status === 'submitted' && (
          <Alert
            message="New Evaluation Available"
            description="Your quarterly performance evaluation is ready. Please review and acknowledge it."
            type="info"
            showIcon
            action={
              <Button 
                type="primary" 
                size="small" 
                onClick={() => setAcknowledgeModalVisible(true)}
              >
                Acknowledge
              </Button>
            }
            style={{ marginBottom: '24px' }}
          />
        )}

        {evaluation.status === 'acknowledged' && (
          <Alert
            message="Acknowledged"
            description={`You acknowledged this evaluation on ${dayjs(evaluation.acknowledgedAt).format('MMMM DD, YYYY')}`}
            type="success"
            showIcon
            style={{ marginBottom: '24px' }}
          />
        )}

        {/* Final Score Display */}
        <Card 
          style={{ 
            marginBottom: '24px', 
            backgroundColor: '#f0f8ff',
            border: `3px solid ${getGradeColor(evaluation.grade)}`
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <Title level={4}>Your Performance Score</Title>
            <div style={{ 
              fontSize: '64px', 
              fontWeight: 'bold', 
              color: getGradeColor(evaluation.grade),
              marginTop: '16px'
            }}>
              {evaluation.finalScore.toFixed(1)}%
            </div>
            <Tag 
              color={getGradeColor(evaluation.grade)}
              style={{ 
                fontSize: '20px', 
                padding: '6px 20px',
                marginTop: '16px'
              }}
            >
              Grade: {evaluation.grade}
            </Tag>
            <div style={{ marginTop: '16px' }}>
              <Tag color="blue" style={{ fontSize: '14px', padding: '4px 12px' }}>
                {evaluation.performanceLevel}
              </Tag>
            </div>
          </div>
        </Card>

        {/* Score Breakdown */}
        <Card size="small" style={{ marginBottom: '24px' }}>
          <Row gutter={16}>
            <Col xs={24} sm={6}>
              <Statistic
                title="Quarter"
                value={evaluation.quarter}
                prefix={<CalendarOutlined />}
              />
            </Col>
            <Col xs={24} sm={6}>
              <Statistic
                title="Supervisor"
                value={evaluation.supervisor.fullName}
                prefix={<UserOutlined />}
              />
            </Col>
            <Col xs={24} sm={6}>
              <Statistic
                title="Task Performance"
                value={evaluation.taskMetrics.taskPerformanceScore.toFixed(1)}
                suffix="%"
                valueStyle={{ color: '#1890ff' }}
              />
            </Col>
            <Col xs={24} sm={6}>
              <Statistic
                title="Behavioral Score"
                value={evaluation.behavioralScore.toFixed(1)}
                suffix="%"
                valueStyle={{ color: '#52c41a' }}
              />
            </Col>
          </Row>
        </Card>

        {/* Performance Breakdown */}
        <Card title="Performance Breakdown" style={{ marginBottom: '24px' }}>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <div style={{ marginBottom: '16px' }}>
                <Text strong>Task Performance (70% weight)</Text>
              </div>
              <Progress
                percent={evaluation.taskMetrics.taskPerformanceScore}
                strokeColor="#1890ff"
                format={(percent) => `${percent.toFixed(1)}%`}
              />
              <div style={{ marginTop: '8px' }}>
                <Text type="secondary">
                  Contribution to final: {(evaluation.taskMetrics.taskPerformanceScore * 0.7).toFixed(2)}%
                </Text>
              </div>
            </Col>
            <Col xs={24} md={12}>
              <div style={{ marginBottom: '16px' }}>
                <Text strong>Behavioral Performance (30% weight)</Text>
              </div>
              <Progress
                percent={evaluation.behavioralScore}
                strokeColor="#52c41a"
                format={(percent) => `${percent.toFixed(1)}%`}
              />
              <div style={{ marginTop: '8px' }}>
                <Text type="secondary">
                  Contribution to final: {(evaluation.behavioralScore * 0.3).toFixed(2)}%
                </Text>
              </div>
            </Col>
          </Row>
        </Card>

        <Divider />

        {/* Task Performance Details */}
        <Card title="Task Performance Details" style={{ marginBottom: '24px' }}>
          <Row gutter={16} style={{ marginBottom: '16px' }}>
            <Col xs={12} sm={6}>
              <Statistic
                title="Total Tasks"
                value={evaluation.taskMetrics.totalTasks}
              />
            </Col>
            <Col xs={12} sm={6}>
              <Statistic
                title="Completed"
                value={evaluation.taskMetrics.completedTasks}
                valueStyle={{ color: '#52c41a' }}
              />
            </Col>
            <Col xs={12} sm={6}>
              <Statistic
                title="Completion Rate"
                value={
                  evaluation.taskMetrics.totalTasks > 0
                    ? ((evaluation.taskMetrics.completedTasks / evaluation.taskMetrics.totalTasks) * 100).toFixed(1)
                    : 0
                }
                suffix="%"
              />
            </Col>
            <Col xs={12} sm={6}>
              <Statistic
                title="Avg Grade"
                value={evaluation.taskMetrics.averageCompletionGrade.toFixed(2)}
                suffix="/5"
                valueStyle={{ color: '#1890ff' }}
              />
            </Col>
          </Row>

          <Divider />

          <Title level={5}>KPI Performance</Title>
          <Table
            columns={kpiColumns}
            dataSource={evaluation.taskMetrics.kpiAchievement}
            pagination={false}
            rowKey="kpiTitle"
            size="small"
            bordered
            scroll={{ x: 700 }}
          />
        </Card>

        {/* Supervisor Comments */}
        {evaluation.supervisorComments && (
          <Card title="Supervisor's Comments" style={{ marginBottom: '24px' }}>
            <Paragraph>{evaluation.supervisorComments}</Paragraph>
          </Card>
        )}

        {/* Employee Comments */}
        {evaluation.employeeComments && (
          <Card title="Your Comments" style={{ marginBottom: '24px' }}>
            <Paragraph>{evaluation.employeeComments}</Paragraph>
          </Card>
        )}

        {/* Evaluation Info */}
        <Card size="small">
          <Descriptions column={2} size="small">
            <Descriptions.Item label="Evaluation Period">
              {dayjs(evaluation.period.startDate).format('MMM DD, YYYY')} - {dayjs(evaluation.period.endDate).format('MMM DD, YYYY')}
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              <Tag color={evaluation.status === 'acknowledged' ? 'success' : 'processing'}>
                {evaluation.status === 'acknowledged' ? 'Acknowledged' : 'Pending Acknowledgment'}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Submitted">
              {dayjs(evaluation.submittedAt).format('MMMM DD, YYYY HH:mm')}
            </Descriptions.Item>
            {evaluation.acknowledgedAt && (
              <Descriptions.Item label="Acknowledged">
                {dayjs(evaluation.acknowledgedAt).format('MMMM DD, YYYY HH:mm')}
              </Descriptions.Item>
            )}
          </Descriptions>
        </Card>

        <Divider />

        <Space>
          <Button onClick={() => navigate('/evaluations/quarterly')}>
            Back to Evaluations
          </Button>
          {evaluation.status === 'submitted' && (
            <Button
              type="primary"
              icon={<CheckCircleOutlined />}
              onClick={() => setAcknowledgeModalVisible(true)}
            >
              Acknowledge Evaluation
            </Button>
          )}
        </Space>
      </Card>

      {/* Acknowledge Modal */}
      <Modal
        title="Acknowledge Evaluation"
        open={acknowledgeModalVisible}
        onCancel={() => setAcknowledgeModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleAcknowledge}>
          <Alert
            message="Acknowledgment"
            description="By acknowledging, you confirm that you have reviewed and understood your quarterly performance evaluation."
            type="info"
            showIcon
            style={{ marginBottom: '16px' }}
          />

          <Form.Item
            name="employeeComments"
            label="Your Comments (Optional)"
          >
            <TextArea
              rows={4}
              placeholder="Add any comments or feedback about this evaluation..."
              showCount
              maxLength={2000}
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button onClick={() => setAcknowledgeModalVisible(false)}>
                Cancel
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                icon={<CheckCircleOutlined />}
              >
                Acknowledge Evaluation
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default EmployeeQuarterlyEvaluationView;