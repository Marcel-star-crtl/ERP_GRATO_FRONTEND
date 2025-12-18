import React, { useState, useEffect } from 'react';
import { Card, Progress, Row, Col, Statistic, Tag, Empty } from 'antd';
import { BarChartOutlined, TrophyOutlined } from '@ant-design/icons';
import { quarterlyEvaluationAPI } from '../services/quarterlyEvaluationAPI';

const PerformanceScoreCard = () => {
  const [latestEvaluation, setLatestEvaluation] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadLatestEvaluation();
  }, []);

  const loadLatestEvaluation = async () => {
    try {
      setLoading(true);
      const result = await quarterlyEvaluationAPI.getMyEvaluations();
      if (result.success && result.data.length > 0) {
        // Get most recent evaluation
        setLatestEvaluation(result.data[0]);
      }
    } catch (error) {
      console.error('Error loading evaluation:', error);
    } finally {
      setLoading(false);
    }
  };

  const getGradeColor = (grade) => {
    if (!grade) return '#8c8c8c';
    if (grade.startsWith('A')) return '#52c41a';
    if (grade.startsWith('B')) return '#1890ff';
    if (grade.startsWith('C')) return '#faad14';
    if (grade === 'D') return '#fa8c16';
    return '#f5222d';
  };

  if (!latestEvaluation) {
    return (
      <Card
        title={
          <span>
            <BarChartOutlined style={{ marginRight: '8px' }} />
            Latest Performance
          </span>
        }
        loading={loading}
      >
        <Empty
          description="No performance evaluations yet"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      </Card>
    );
  }

  return (
    <Card
      title={
        <span>
          <BarChartOutlined style={{ marginRight: '8px' }} />
          Performance - {latestEvaluation.quarter}
        </span>
      }
      loading={loading}
    >
      <Row gutter={16} style={{ marginBottom: '16px' }}>
        <Col span={12}>
          <Statistic
            title="Final Score"
            value={latestEvaluation.finalScore.toFixed(1)}
            suffix="%"
            valueStyle={{ color: getGradeColor(latestEvaluation.grade) }}
          />
        </Col>
        <Col span={12}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>Grade</div>
            <Tag
              color={getGradeColor(latestEvaluation.grade)}
              style={{ fontSize: '24px', padding: '8px 16px', fontWeight: 'bold' }}
            >
              {latestEvaluation.grade}
            </Tag>
          </div>
        </Col>
      </Row>

      <div style={{ marginTop: '16px' }}>
        <div style={{ marginBottom: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ fontSize: '12px' }}>Task Performance (70%)</span>
            <span style={{ fontSize: '12px', fontWeight: 'bold' }}>
              {latestEvaluation.taskMetrics.taskPerformanceScore.toFixed(1)}%
            </span>
          </div>
          <Progress
            percent={latestEvaluation.taskMetrics.taskPerformanceScore}
            strokeColor="#1890ff"
            size="small"
            showInfo={false}
          />
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ fontSize: '12px' }}>Behavioral (30%)</span>
            <span style={{ fontSize: '12px', fontWeight: 'bold' }}>
              {latestEvaluation.behavioralScore.toFixed(1)}%
            </span>
          </div>
          <Progress
            percent={latestEvaluation.behavioralScore}
            strokeColor="#52c41a"
            size="small"
            showInfo={false}
          />
        </div>
      </div>

      <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#f0f8ff', borderRadius: '4px' }}>
        <Row gutter={16}>
          <Col span={12}>
            <Statistic
              title="Tasks Completed"
              value={latestEvaluation.taskMetrics.completedTasks}
              prefix={<TrophyOutlined />}
              valueStyle={{ fontSize: '18px' }}
            />
          </Col>
          <Col span={12}>
            <Statistic
              title="Avg Grade"
              value={latestEvaluation.taskMetrics.averageCompletionGrade.toFixed(1)}
              suffix="/ 5"
              valueStyle={{ fontSize: '18px' }}
            />
          </Col>
        </Row>
      </div>
    </Card>
  );
};

export default PerformanceScoreCard;