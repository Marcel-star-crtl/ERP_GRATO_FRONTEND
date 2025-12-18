import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Select,
  DatePicker,
  Button,
  Tag,
  Progress,
  Empty
} from 'antd';
import {
  BarChartOutlined,
  TrophyOutlined,
  TeamOutlined,
  RiseOutlined,
  FallOutlined
} from '@ant-design/icons';
import { quarterlyEvaluationAPI } from '../../services/quarterlyEvaluationAPI';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const { Option } = Select;

const AdminPerformanceAnalytics = () => {
  const [statistics, setStatistics] = useState(null);
  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedQuarter, setSelectedQuarter] = useState(null);
  const [selectedDepartment, setSelectedDepartment] = useState(null);

  useEffect(() => {
    loadData();
  }, [selectedQuarter, selectedDepartment]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsResult, evalsResult] = await Promise.all([
        quarterlyEvaluationAPI.getStatistics(selectedQuarter, selectedDepartment),
        quarterlyEvaluationAPI.getEvaluations({ 
          quarter: selectedQuarter, 
          department: selectedDepartment 
        })
      ]);

      if (statsResult.success) {
        setStatistics(statsResult.data);
      }

      if (evalsResult.success) {
        setEvaluations(evalsResult.data);
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getGradeColor = (grade) => {
    if (grade.startsWith('A')) return '#52c41a';
    if (grade.startsWith('B')) return '#1890ff';
    if (grade.startsWith('C')) return '#faad14';
    if (grade === 'D') return '#fa8c16';
    return '#f5222d';
  };

  const gradeDistributionData = statistics ? {
    labels: Object.keys(statistics.byGrade),
    datasets: [
      {
        data: Object.values(statistics.byGrade),
        backgroundColor: [
          '#52c41a', '#52c41a', '#1890ff', '#1890ff', 
          '#faad14', '#faad14', '#fa8c16', '#f5222d'
        ],
      },
    ],
  } : null;

  const performanceComparisonData = statistics ? {
    labels: ['Task Performance', 'Behavioral Performance', 'Final Score'],
    datasets: [
      {
        label: 'Average Scores',
        data: [
          statistics.averageScores.taskPerformance,
          statistics.averageScores.behavioral,
          statistics.averageScores.finalScore
        ],
        backgroundColor: ['#1890ff', '#52c41a', '#722ed1'],
      },
    ],
  } : null;

  const columns = [
    {
      title: 'Employee',
      dataIndex: ['employee', 'fullName'],
      key: 'employee',
      width: 200,
      render: (text, record) => (
        <div>
          <strong>{text}</strong>
          <br />
          <span style={{ fontSize: '12px', color: '#666' }}>
            {record.employee.department} - {record.employee.position}
          </span>
        </div>
      )
    },
    {
      title: 'Quarter',
      dataIndex: 'quarter',
      key: 'quarter',
      width: 100
    },
    {
      title: 'Final Score',
      dataIndex: 'finalScore',
      key: 'finalScore',
      width: 150,
      sorter: (a, b) => a.finalScore - b.finalScore,
      render: (score, record) => (
        <div>
          <Progress percent={score} size="small" strokeColor={getGradeColor(record.grade)} />
          <Tag color={getGradeColor(record.grade)} style={{ marginTop: '4px' }}>
            {record.grade}
          </Tag>
        </div>
      )
    },
    {
      title: 'Task Perf.',
      dataIndex: ['taskMetrics', 'taskPerformanceScore'],
      key: 'taskPerf',
      width: 120,
      sorter: (a, b) => a.taskMetrics.taskPerformanceScore - b.taskMetrics.taskPerformanceScore,
      render: (score) => `${score.toFixed(1)}%`
    },
    {
      title: 'Behavioral',
      dataIndex: 'behavioralScore',
      key: 'behavioral',
      width: 120,
      sorter: (a, b) => a.behavioralScore - b.behavioralScore,
      render: (score) => `${score.toFixed(1)}%`
    },
    {
      title: 'Performance Level',
      dataIndex: 'performanceLevel',
      key: 'level',
      width: 180,
      render: (level) => (
        <Tag color={
          level === 'Outstanding' ? 'green' :
          level === 'Exceeds Expectations' ? 'blue' :
          level === 'Meets Expectations' ? 'cyan' :
          level === 'Needs Improvement' ? 'orange' : 'red'
        }>
          {level}
        </Tag>
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
        return <Tag color={colors[status]}>{status.toUpperCase()}</Tag>;
      }
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center' }}>
            <BarChartOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
            Performance Analytics Dashboard
          </h2>
          <p style={{ color: '#666', margin: '8px 0 0 0' }}>
            Organization-wide performance evaluation analytics and insights
          </p>
        </div>

        {/* Filters */}
        <Row gutter={16} style={{ marginBottom: '24px' }}>
          <Col span={8}>
            <Select
              placeholder="Select Quarter"
              style={{ width: '100%' }}
              onChange={setSelectedQuarter}
              allowClear
            >
              <Option value="Q1-2025">Q1-2025</Option>
              <Option value="Q2-2025">Q2-2025</Option>
              <Option value="Q3-2025">Q3-2025</Option>
              <Option value="Q4-2025">Q4-2025</Option>
            </Select>
          </Col>
          <Col span={8}>
            <Select
              placeholder="Select Department"
              style={{ width: '100%' }}
              onChange={setSelectedDepartment}
              allowClear
            >
              <Option value="Engineering">Engineering</Option>
              <Option value="Finance">Finance</Option>
              <Option value="HR">HR</Option>
              <Option value="IT">IT</Option>
              <Option value="Supply Chain">Supply Chain</Option>
            </Select>
          </Col>
          <Col span={8}>
            <Button type="primary" onClick={loadData} loading={loading}>
              Apply Filters
            </Button>
          </Col>
        </Row>

        {statistics && (
          <>
            {/* Statistics Cards */}
            <Row gutter={16} style={{ marginBottom: '24px' }}>
              <Col xs={24} sm={12} md={6}>
                <Card>
                  <Statistic
                    title="Total Evaluations"
                    value={statistics.total}
                    prefix={<TeamOutlined />}
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card>
                  <Statistic
                    title="Avg Final Score"
                    value={statistics.averageScores.finalScore.toFixed(1)}
                    suffix="%"
                    prefix={<TrophyOutlined />}
                    valueStyle={{ color: '#722ed1' }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card>
                  <Statistic
                    title="Avg Task Performance"
                    value={statistics.averageScores.taskPerformance.toFixed(1)}
                    suffix="%"
                    prefix={<RiseOutlined />}
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card>
                  <Statistic
                    title="Avg Behavioral"
                    value={statistics.averageScores.behavioral.toFixed(1)}
                    suffix="%"
                    prefix={<RiseOutlined />}
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Card>
              </Col>
            </Row>

            {/* Charts */}
            <Row gutter={16} style={{ marginBottom: '24px' }}>
              <Col xs={24} lg={12}>
                <Card title="Grade Distribution">
                  {gradeDistributionData && (
                    <Pie
                      data={gradeDistributionData}
                      options={{
                        responsive: true,
                        plugins: {
                          legend: {
                            position: 'bottom',
                          },
                          title: {
                            display: false,
                          },
                        },
                      }}
                    />
                  )}
                </Card>
              </Col>
              <Col xs={24} lg={12}>
                <Card title="Performance Comparison">
                  {performanceComparisonData && (
                    <Bar
                      data={performanceComparisonData}
                      options={{
                        responsive: true,
                        plugins: {
                          legend: {
                            display: false,
                          },
                        },
                        scales: {
                          y: {
                            beginAtZero: true,
                            max: 100,
                          },
                        },
                      }}
                    />
                  )}
                </Card>
              </Col>
            </Row>

            {/* Status Breakdown */}
            <Card title="Evaluation Status" style={{ marginBottom: '24px' }}>
              <Row gutter={16}>
                <Col span={6}>
                  <Statistic
                    title="Draft"
                    value={statistics.byStatus.draft}
                    valueStyle={{ color: '#8c8c8c' }}
                  />
                </Col>
                <Col span={6}>
                  <Statistic
                    title="Calculated"
                    value={statistics.byStatus.calculated}
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Col>
                <Col span={6}>
                  <Statistic
                    title="Submitted"
                    value={statistics.byStatus.submitted}
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Col>
                <Col span={6}>
                  <Statistic
                    title="Acknowledged"
                    value={statistics.byStatus.acknowledged}
                    valueStyle={{ color: '#722ed1' }}
                  />
                </Col>
              </Row>
            </Card>
          </>
        )}

        {/* Detailed Table */}
        <Card title="Detailed Evaluations">
          <Table
            columns={columns}
            dataSource={evaluations}
            rowKey="_id"
            loading={loading}
            pagination={{ pageSize: 10 }}
            scroll={{ x: 1200 }}
          />
        </Card>
      </Card>
    </div>
  );
};

export default AdminPerformanceAnalytics;