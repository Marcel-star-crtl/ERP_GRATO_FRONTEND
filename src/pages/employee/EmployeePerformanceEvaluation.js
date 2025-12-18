import React, { useState, useEffect } from 'react';
import {
  Card,
  Tabs,
  Table,
  Tag,
  Progress,
  Empty,
  Button,
  Descriptions,
  Alert,
  Row,
  Col,
  Statistic,
  message,
  Modal,
  Form,
  Input,
  Space
} from 'antd';
import {
  TrophyOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  BarChartOutlined,
  FileTextOutlined,
  StarOutlined
} from '@ant-design/icons';
import { quarterlyEvaluationAPI } from '../../services/quarterlyEvaluationAPI';
import { behavioralEvaluationAPI } from '../../services/behavioralEvaluationAPI';
import dayjs from 'dayjs';

const { TextArea } = Input;

const EmployeePerformanceEvaluation = () => {
  const [evaluations, setEvaluations] = useState([]);
  const [behavioralEvaluations, setBehavioralEvaluations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedEvaluation, setSelectedEvaluation] = useState(null);
  const [acknowledgeModalVisible, setAcknowledgeModalVisible] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    loadEvaluations();
    loadBehavioralEvaluations();
  }, []);

  const loadEvaluations = async () => {
    try {
      setLoading(true);
      const result = await quarterlyEvaluationAPI.getMyEvaluations();
      if (result.success) {
        setEvaluations(result.data);
      }
    } catch (error) {
      console.error('Error loading evaluations:', error);
      message.error('Failed to load evaluations');
    } finally {
      setLoading(false);
    }
  };

  const loadBehavioralEvaluations = async () => {
    try {
      const result = await behavioralEvaluationAPI.getMyEvaluations();
      if (result.success) {
        setBehavioralEvaluations(result.data);
      }
    } catch (error) {
      console.error('Error loading behavioral evaluations:', error);
    }
  };

  const handleAcknowledge = async (values) => {
    try {
      const result = await quarterlyEvaluationAPI.acknowledgeEvaluation(
        selectedEvaluation._id,
        values.comments
      );

      if (result.success) {
        message.success('Evaluation acknowledged successfully');
        setAcknowledgeModalVisible(false);
        form.resetFields();
        loadEvaluations();
      } else {
        message.error(result.message);
      }
    } catch (error) {
      console.error('Error acknowledging evaluation:', error);
      message.error('Failed to acknowledge evaluation');
    }
  };

  const handleAcknowledgeBehavioral = async (evaluationId) => {
    try {
      const result = await behavioralEvaluationAPI.acknowledgeEvaluation(evaluationId);
      if (result.success) {
        message.success('Behavioral evaluation acknowledged');
        loadBehavioralEvaluations();
      } else {
        message.error(result.message);
      }
    } catch (error) {
      console.error('Error:', error);
      message.error('Failed to acknowledge evaluation');
    }
  };

  const getGradeColor = (grade) => {
    if (grade.startsWith('A')) return '#52c41a';
    if (grade.startsWith('B')) return '#1890ff';
    if (grade.startsWith('C')) return '#faad14';
    if (grade === 'D') return '#fa8c16';
    return '#f5222d';
  };

  const quarterlyColumns = [
    {
      title: 'Quarter',
      dataIndex: 'quarter',
      key: 'quarter',
      width: 120
    },
    {
      title: 'Final Score',
      dataIndex: 'finalScore',
      key: 'finalScore',
      width: 150,
      render: (score, record) => (
        <div>
          <Progress
            percent={score}
            size="small"
            strokeColor={getGradeColor(record.grade)}
          />
          <Tag
            color={getGradeColor(record.grade)}
            style={{ marginTop: '4px', fontWeight: 'bold' }}
          >
            {record.grade}
          </Tag>
        </div>
      )
    },
    {
      title: 'Task Performance',
      dataIndex: ['taskMetrics', 'taskPerformanceScore'],
      key: 'taskPerformance',
      width: 150,
      render: (score) => (
        <Progress percent={score.toFixed(1)} size="small" strokeColor="#1890ff" />
      )
    },
    {
      title: 'Behavioral Score',
      dataIndex: 'behavioralScore',
      key: 'behavioralScore',
      width: 150,
      render: (score) => (
        <Progress percent={score.toFixed(1)} size="small" strokeColor="#52c41a" />
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status) => {
        const colors = {
          submitted: 'processing',
          approved: 'success',
          acknowledged: 'default'
        };
        return <Tag color={colors[status] || 'default'}>{status.toUpperCase()}</Tag>;
      }
    },
    {
      title: 'Action',
      key: 'action',
      width: 150,
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<FileTextOutlined />}
            onClick={() => setSelectedEvaluation(record)}
          >
            View Details
          </Button>
          {(record.status === 'submitted' || record.status === 'approved') && (
            <Button
              type="primary"
              size="small"
              onClick={() => {
                setSelectedEvaluation(record);
                setAcknowledgeModalVisible(true);
              }}
            >
              Acknowledge
            </Button>
          )}
        </Space>
      )
    }
  ];

  const behavioralColumns = [
    {
      title: 'Quarter',
      dataIndex: 'quarter',
      key: 'quarter',
      width: 120
    },
    {
      title: 'Overall Score',
      dataIndex: 'overallBehavioralScore',
      key: 'score',
      width: 200,
      render: (score) => (
        <Progress percent={score} strokeColor="#52c41a" />
      )
    },
    {
      title: 'Criteria Evaluated',
      dataIndex: 'criteria',
      key: 'criteria',
      width: 150,
      render: (criteria) => `${criteria.length} criteria`
    },
    {
      title: 'Evaluator',
      dataIndex: ['evaluator', 'fullName'],
      key: 'evaluator',
      width: 150
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status) => {
        const colors = {
          submitted: 'processing',
          acknowledged: 'success'
        };
        return <Tag color={colors[status] || 'default'}>{status.toUpperCase()}</Tag>;
      }
    },
    {
      title: 'Action',
      key: 'action',
      width: 150,
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            onClick={() => Modal.info({
              title: 'Behavioral Evaluation Details',
              width: 800,
              content: (
                <div>
                  <Descriptions bordered column={2} size="small" style={{ marginTop: '16px' }}>
                    <Descriptions.Item label="Quarter" span={2}>{record.quarter}</Descriptions.Item>
                    <Descriptions.Item label="Overall Score">
                      {record.overallBehavioralScore.toFixed(1)}%
                    </Descriptions.Item>
                    <Descriptions.Item label="Evaluator">
                      {record.evaluator.fullName}
                    </Descriptions.Item>
                  </Descriptions>

                  <h4 style={{ marginTop: '24px' }}>Criteria Scores:</h4>
                  {record.criteria.map((criterion, index) => (
                    <Card key={index} size="small" style={{ marginBottom: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ flex: 1 }}>
                          <strong>{criterion.name}</strong>
                          {criterion.comments && (
                            <p style={{ margin: '8px 0 0 0', color: '#666' }}>{criterion.comments}</p>
                          )}
                        </div>
                        <div style={{ marginLeft: '16px' }}>
                          <Tag color={criterion.score >= 4 ? 'green' : criterion.score >= 3 ? 'blue' : 'orange'}>
                            {criterion.score}/5 {'⭐'.repeat(criterion.score)}
                          </Tag>
                        </div>
                      </div>
                    </Card>
                  ))}

                  {record.overallComments && (
                    <>
                      <h4 style={{ marginTop: '24px' }}>Overall Comments:</h4>
                      <Alert
                        message={record.overallComments}
                        type="info"
                      />
                    </>
                  )}
                </div>
              )
            })}
          >
            View Details
          </Button>
          {record.status === 'submitted' && (
            <Button
              type="primary"
              size="small"
              onClick={() => handleAcknowledgeBehavioral(record._id)}
            >
              Acknowledge
            </Button>
          )}
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center' }}>
            <BarChartOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
            My Performance Evaluations
          </h2>
          <p style={{ color: '#666', margin: '8px 0 0 0' }}>
            View your quarterly performance evaluations and behavioral assessments
          </p>
        </div>

        <Alert
          message="Understanding Your Evaluation"
          description={
            <ul style={{ marginBottom: 0, paddingLeft: '20px' }}>
              <li><strong>Final Score:</strong> 70% from task completion grades + 30% from behavioral assessment</li>
              <li><strong>Task Performance:</strong> Weighted average of your completed task grades based on KPI importance</li>
              <li><strong>Behavioral Score:</strong> Your supervisor's assessment of your work behavior and professionalism</li>
              <li>You must acknowledge evaluations after reviewing them</li>
            </ul>
          }
          type="info"
          showIcon
          style={{ marginBottom: '24px' }}
        />

        <Tabs defaultActiveKey="quarterly">
          <Tabs.TabPane tab="Quarterly Evaluations" key="quarterly">
            <Table
              columns={quarterlyColumns}
              dataSource={evaluations}
              rowKey="_id"
              loading={loading}
              pagination={{ pageSize: 10 }}
              locale={{
                emptyText: <Empty description="No evaluations available yet" />
              }}
            />
          </Tabs.TabPane>

          <Tabs.TabPane tab="Behavioral Evaluations" key="behavioral">
            <Table
              columns={behavioralColumns}
              dataSource={behavioralEvaluations}
              rowKey="_id"
              loading={loading}
              pagination={{ pageSize: 10 }}
              locale={{
                emptyText: <Empty description="No behavioral evaluations available yet" />
              }}
            />
          </Tabs.TabPane>
        </Tabs>
      </Card>

      {/* Evaluation Details Modal */}
      {selectedEvaluation && !acknowledgeModalVisible && (
        <Modal
          title={
            <span>
              <TrophyOutlined style={{ marginRight: '8px' }} />
              Quarterly Evaluation - {selectedEvaluation.quarter}
            </span>
          }
          open={!!selectedEvaluation}
          onCancel={() => setSelectedEvaluation(null)}
          footer={null}
          width={900}
        >
          <Card size="small" style={{ marginBottom: '16px', backgroundColor: '#f0f8ff' }}>
            <Row gutter={16}>
              <Col xs={24} sm={8}>
                <Statistic
                  title="Final Score"
                  value={selectedEvaluation.finalScore.toFixed(1)}
                  suffix="%"
                  valueStyle={{ color: getGradeColor(selectedEvaluation.grade) }}
                />
                <Tag
                  color={getGradeColor(selectedEvaluation.grade)}
                  style={{ marginTop: '8px', fontSize: '16px', padding: '4px 12px', fontWeight: 'bold' }}
                >
                  Grade: {selectedEvaluation.grade}
                </Tag>
              </Col>
              <Col xs={24} sm={8}>
                <Statistic
                  title="Task Performance (70%)"
                  value={selectedEvaluation.taskMetrics.taskPerformanceScore.toFixed(1)}
                  suffix="%"
                  valueStyle={{ color: '#1890ff' }}
                />
              </Col>
              <Col xs={24} sm={8}>
                <Statistic
                  title="Behavioral (30%)"
                  value={selectedEvaluation.behavioralScore.toFixed(1)}
                  suffix="%"
                  valueStyle={{ color: '#52c41a' }}
                />
              </Col>
            </Row>
          </Card>

          <Descriptions bordered column={2} size="small" style={{ marginBottom: '16px' }}>
            <Descriptions.Item label="Performance Level" span={2}>
              <Tag color={getGradeColor(selectedEvaluation.grade)} style={{ fontSize: '14px' }}>
                {selectedEvaluation.performanceLevel}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Evaluation Period">
              {dayjs(selectedEvaluation.period.startDate).format('MMM DD, YYYY')} - {dayjs(selectedEvaluation.period.endDate).format('MMM DD, YYYY')}
            </Descriptions.Item>
            <Descriptions.Item label="Supervisor">
              {selectedEvaluation.supervisor?.fullName}
            </Descriptions.Item>
            <Descriptions.Item label="Total Tasks">
              {selectedEvaluation.taskMetrics.totalTasks}
            </Descriptions.Item>
            <Descriptions.Item label="Completed Tasks">
              {selectedEvaluation.taskMetrics.completedTasks}
            </Descriptions.Item>
            <Descriptions.Item label="Average Task Grade" span={2}>
              {selectedEvaluation.taskMetrics.averageCompletionGrade.toFixed(2)}/5
            </Descriptions.Item>
          </Descriptions>

          <h3 style={{ marginTop: '24px', marginBottom: '16px' }}>
            <StarOutlined style={{ marginRight: '8px' }} />
            KPI Achievement Breakdown
          </h3>
          {selectedEvaluation.taskMetrics.kpiAchievement.map((kpi, index) => (
            <Card key={index} size="small" style={{ marginBottom: '12px' }}>
              <div style={{ marginBottom: '8px' }}>
                <strong>{kpi.kpiTitle}</strong>
                <Tag color="blue" style={{ marginLeft: '8px' }}>
                  Weight: {kpi.kpiWeight}%
                </Tag>
              </div>
              <Row gutter={16}>
                <Col span={6}>
                  <Statistic
                    title="Tasks Completed"
                    value={kpi.tasksCompleted}
                    valueStyle={{ fontSize: '18px' }}
                  />
                </Col>
                <Col span={6}>
                  <Statistic
                    title="Average Grade"
                    value={kpi.averageGrade.toFixed(2)}
                    suffix="/ 5"
                    valueStyle={{ fontSize: '18px' }}
                  />
                </Col>
                <Col span={6}>
                  <Statistic
                    title="Achievement"
                    value={kpi.achievedScore.toFixed(1)}
                    suffix="%"
                    valueStyle={{ fontSize: '18px' }}
                  />
                </Col>
                <Col span={6}>
                  <Statistic
                    title="Weighted Score"
                    value={kpi.weightedScore.toFixed(2)}
                    valueStyle={{ fontSize: '18px', color: '#52c41a' }}
                  />
                </Col>
              </Row>
              <Progress
                percent={kpi.achievedScore}
                strokeColor="#52c41a"
                style={{ marginTop: '8px' }}
              />
            </Card>
          ))}

          {selectedEvaluation.supervisorComments && (
            <>
              <h3 style={{ marginTop: '24px', marginBottom: '16px' }}>Supervisor Comments</h3>
              <Alert
                message={selectedEvaluation.supervisorComments}
                type="info"
                style={{ marginBottom: '16px' }}
              />
            </>
          )}

          {selectedEvaluation.employeeComments && (
            <>
              <h3 style={{ marginTop: '24px', marginBottom: '16px' }}>Your Comments</h3>
              <Alert
                message={selectedEvaluation.employeeComments}
                type="success"
              />
            </>
          )}

          {(selectedEvaluation.status === 'submitted' || selectedEvaluation.status === 'approved') && (
            <Button
              type="primary"
              block
              size="large"
              style={{ marginTop: '24px' }}
              onClick={() => {
                setAcknowledgeModalVisible(true);
              }}
            >
              Acknowledge Evaluation
            </Button>
          )}
        </Modal>
      )}

      {/* Acknowledge Modal */}
      <Modal
        title="Acknowledge Evaluation"
        open={acknowledgeModalVisible}
        onCancel={() => {
          setAcknowledgeModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Alert
          message="Acknowledge Your Evaluation"
          description="By acknowledging this evaluation, you confirm that you have reviewed and understood your performance assessment. You may add optional comments."
          type="info"
          showIcon
          style={{ marginBottom: '16px' }}
        />

        <Form form={form} layout="vertical" onFinish={handleAcknowledge}>
          <Form.Item
            name="comments"
            label="Your Comments (Optional)"
          >
            <TextArea
              rows={4}
              placeholder="Share your thoughts about this evaluation, goals for improvement, or any feedback..."
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0 }}>
            <Space>
              <Button
                onClick={() => {
                  setAcknowledgeModalVisible(false);
                  form.resetFields();
                }}
              >
                Cancel
              </Button>
              <Button type="primary" htmlType="submit">
                Acknowledge Evaluation
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default EmployeePerformanceEvaluation;