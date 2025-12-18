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
  Rate,
  Progress,
  Divider,
  Typography,
  Alert,
  Row,
  Col,
  Statistic
} from 'antd';
import {
  CheckCircleOutlined,
  StarOutlined,
  UserOutlined,
  CalendarOutlined
} from '@ant-design/icons';
import { behavioralEvaluationAPI } from '../../services/behavioralEvaluationAPI';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;

const EmployeeBehavioralEvaluationView = () => {
  const { evaluationId } = useParams();
  const navigate = useNavigate();
  const [evaluation, setEvaluation] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchEvaluation();
  }, [evaluationId]);

  const fetchEvaluation = async () => {
    try {
      setLoading(true);
      const result = await behavioralEvaluationAPI.getEvaluation(evaluationId);
      
      if (result.success) {
        setEvaluation(result.data);
      } else {
        message.error(result.message || 'Failed to load evaluation');
        navigate('/evaluations');
      }
    } catch (error) {
      console.error('Error fetching evaluation:', error);
      message.error('Failed to load evaluation');
      navigate('/evaluations');
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledge = async () => {
    try {
      setLoading(true);
      const result = await behavioralEvaluationAPI.acknowledgeEvaluation(evaluationId);
      
      if (result.success) {
        message.success('Evaluation acknowledged successfully');
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

  const criteriaColumns = [
    {
      title: 'Criterion',
      dataIndex: 'name',
      key: 'name',
      width: 250,
      render: (name) => <strong>{name}</strong>
    },
    {
      title: 'Your Rating',
      dataIndex: 'score',
      key: 'score',
      width: 200,
      render: (score) => (
        <Space>
          <Rate disabled value={score} />
          <Tag color={score >= 4 ? 'success' : score >= 3 ? 'warning' : 'error'}>
            {score}/5
          </Tag>
        </Space>
      )
    },
    {
      title: 'Comments',
      dataIndex: 'comments',
      key: 'comments',
      render: (comments) => comments || <Text type="secondary">No comments</Text>
    }
  ];

  const getScoreColor = (score) => {
    if (score >= 80) return '#52c41a';
    if (score >= 60) return '#faad14';
    return '#f5222d';
  };

  return (
    <div style={{ padding: '24px' }}>
      <Card loading={loading}>
        <Title level={3} style={{ marginBottom: '24px' }}>
          <StarOutlined /> Your Behavioral Evaluation
        </Title>

        {evaluation.status === 'submitted' && (
          <Alert
            message="New Evaluation"
            description="Your supervisor has completed your behavioral evaluation. Please review and acknowledge it."
            type="info"
            showIcon
            action={
              <Button type="primary" size="small" onClick={handleAcknowledge}>
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

        {/* Summary Statistics */}
        <Card size="small" style={{ marginBottom: '24px', backgroundColor: '#f0f8ff' }}>
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
                title="Evaluator"
                value={evaluation.evaluator.fullName}
                prefix={<UserOutlined />}
              />
            </Col>
            <Col xs={24} sm={6}>
              <Statistic
                title="Criteria Evaluated"
                value={evaluation.criteria.length}
              />
            </Col>
            <Col xs={24} sm={6}>
              <Statistic
                title="Overall Score"
                value={evaluation.overallBehavioralScore.toFixed(1)}
                suffix="%"
                valueStyle={{ color: getScoreColor(evaluation.overallBehavioralScore) }}
              />
            </Col>
          </Row>
        </Card>

        {/* Score Visualization */}
        <Card size="small" style={{ marginBottom: '24px' }}>
          <div style={{ marginBottom: '8px' }}>
            <strong>Performance Level:</strong>
          </div>
          <Progress
            percent={evaluation.overallBehavioralScore}
            strokeColor={getScoreColor(evaluation.overallBehavioralScore)}
            format={(percent) => `${percent.toFixed(1)}%`}
          />
          <div style={{ marginTop: '8px', textAlign: 'center' }}>
            <Tag 
              color={getScoreColor(evaluation.overallBehavioralScore)}
              style={{ fontSize: '14px', padding: '4px 12px' }}
            >
              {evaluation.overallBehavioralScore >= 90 ? 'Outstanding' :
               evaluation.overallBehavioralScore >= 80 ? 'Exceeds Expectations' :
               evaluation.overallBehavioralScore >= 70 ? 'Meets Expectations' :
               evaluation.overallBehavioralScore >= 60 ? 'Needs Improvement' :
               'Unsatisfactory'}
            </Tag>
          </div>
        </Card>

        <Divider />

        {/* Criteria Details */}
        <Card title="Evaluation Details" style={{ marginBottom: '24px' }}>
          <Table
            columns={criteriaColumns}
            dataSource={evaluation.criteria}
            pagination={false}
            rowKey="name"
            size="small"
            bordered
          />
        </Card>

        {/* Overall Comments */}
        {evaluation.overallComments && (
          <Card title="Supervisor's Overall Comments" style={{ marginBottom: '24px' }}>
            <Paragraph>{evaluation.overallComments}</Paragraph>
          </Card>
        )}

        {/* Evaluation Info */}
        <Card size="small">
          <Descriptions column={2} size="small">
            <Descriptions.Item label="Submitted">
              {dayjs(evaluation.submittedAt).format('MMMM DD, YYYY HH:mm')}
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              <Tag color={evaluation.status === 'acknowledged' ? 'success' : 'processing'}>
                {evaluation.status === 'acknowledged' ? 'Acknowledged' : 'Pending Acknowledgment'}
              </Tag>
            </Descriptions.Item>
          </Descriptions>
        </Card>

        <Divider />

        <Space>
          <Button onClick={() => navigate('/evaluations')}>
            Back to Evaluations
          </Button>
          {evaluation.status === 'submitted' && (
            <Button
              type="primary"
              icon={<CheckCircleOutlined />}
              onClick={handleAcknowledge}
              loading={loading}
            >
              Acknowledge Evaluation
            </Button>
          )}
        </Space>
      </Card>
    </div>
  );
};

export default EmployeeBehavioralEvaluationView;