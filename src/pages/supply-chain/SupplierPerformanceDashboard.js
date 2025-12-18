import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Table,
  Button,
  Select,
  Space,
  Typography,
  Tag,
  Row,
  Col,
  Progress,
  Statistic,
  message,
  Tabs,
  DatePicker,
  Badge
} from 'antd';
import {
  StarOutlined,
  PlusOutlined,
  BarChartOutlined,
  TrophyOutlined,
  WarningOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import axios from 'axios';
import moment from 'moment';

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;
const { TabPane } = Tabs;

const SupplierPerformanceDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [evaluations, setEvaluations] = useState([]);
  const [rankings, setRankings] = useState([]);
  const [activeTab, setActiveTab] = useState('rankings');

  useEffect(() => {
    fetchRankings();
    fetchEvaluations();
  }, []);

  const fetchRankings = async () => {
    try {
      const response = await axios.get('/api/supplier-performance/rankings');
      setRankings(response.data.data.rankings || []);
    } catch (error) {
      console.error('Error fetching rankings:', error);
      message.error('Failed to load supplier rankings');
    }
  };

  const fetchEvaluations = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/supplier-performance/evaluations');
      setEvaluations(response.data.data.evaluations || []);
    } catch (error) {
      console.error('Error fetching evaluations:', error);
      message.error('Failed to load evaluations');
    } finally {
      setLoading(false);
    }
  };

  const getPerformanceColor = (score) => {
    if (score >= 90) return '#52c41a';
    if (score >= 80) return '#1890ff';
    if (score >= 70) return '#faad14';
    if (score >= 60) return '#fa8c16';
    return '#f5222d';
  };

  const getGradeColor = (grade) => {
    const colors = {
      A: 'green',
      B: 'blue',
      C: 'orange',
      D: 'red',
      F: 'red'
    };
    return colors[grade] || 'default';
  };

  const rankingsColumns = [
    {
      title: 'Rank',
      dataIndex: 'rank',
      key: 'rank',
      width: 80,
      render: (rank) => {
        if (rank === 1) return <TrophyOutlined style={{ fontSize: '24px', color: '#ffd700' }} />;
        if (rank === 2) return <TrophyOutlined style={{ fontSize: '24px', color: '#c0c0c0' }} />;
        if (rank === 3) return <TrophyOutlined style={{ fontSize: '24px', color: '#cd7f32' }} />;
        return <Text strong style={{ fontSize: '16px' }}>{rank}</Text>;
      }
    },
    {
      title: 'Supplier',
      dataIndex: 'supplierName',
      key: 'supplierName',
      render: (name, record) => (
        <div>
          <Text strong>{name}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.category}
          </Text>
        </div>
      )
    },
    {
      title: 'Overall Score',
      dataIndex: 'overallScore',
      key: 'overallScore',
      width: 150,
      render: (score) => (
        <div>
          <Progress
            percent={score}
            strokeColor={getPerformanceColor(score)}
            format={percent => `${percent.toFixed(1)}%`}
          />
        </div>
      )
    },
    {
      title: 'Grade',
      dataIndex: 'performanceGrade',
      key: 'performanceGrade',
      width: 80,
      align: 'center',
      render: (grade) => (
        <Tag color={getGradeColor(grade)} style={{ fontSize: '16px', padding: '4px 12px' }}>
          {grade}
        </Tag>
      )
    },
    {
      title: 'On-Time Delivery',
      dataIndex: 'onTimeDeliveryRate',
      key: 'onTimeDeliveryRate',
      width: 120,
      align: 'center',
      render: (rate) => `${rate.toFixed(1)}%`
    },
    {
      title: 'Quality',
      dataIndex: 'qualityRating',
      key: 'qualityRating',
      width: 100,
      align: 'center',
      render: (rate) => `${rate.toFixed(1)}%`
    },
    {
      title: 'Cost Compliance',
      dataIndex: 'costCompliance',
      key: 'costCompliance',
      width: 120,
      align: 'center',
      render: (rate) => `${rate.toFixed(1)}%`
    },
    {
      title: 'Responsiveness',
      dataIndex: 'responsivenessRating',
      key: 'responsivenessRating',
      width: 120,
      align: 'center',
      render: (rate) => `${rate.toFixed(1)}%`
    },
    {
      title: 'Recommendation',
      dataIndex: 'recommendation',
      key: 'recommendation',
      width: 120,
      render: (rec) => {
        const colors = {
          preferred: 'green',
          approved: 'blue',
          conditional: 'orange',
          'not-recommended': 'red',
          blacklisted: 'red'
        };
        return (
          <Tag color={colors[rec] || 'default'}>
            {rec?.toUpperCase().replace('-', ' ')}
          </Tag>
        );
      }
    },
    {
      title: 'Last Evaluated',
      dataIndex: 'evaluationDate',
      key: 'evaluationDate',
      width: 120,
      render: (date) => moment(date).format('DD/MM/YYYY')
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button
            size="small"
            onClick={() => navigate(`/supply-chain/supplier-performance/${record.supplier}`)}
          >
            View Details
          </Button>
        </Space>
      )
    }
  ];

  const evaluationsColumns = [
    {
      title: 'Supplier',
      dataIndex: 'supplierName',
      key: 'supplierName'
    },
    {
      title: 'Period',
      key: 'period',
      render: (_, record) => (
        <Text>
          {moment(record.evaluationPeriod.startDate).format('DD/MM/YYYY')} - 
          {' '}{moment(record.evaluationPeriod.endDate).format('DD/MM/YYYY')}
        </Text>
      )
    },
    {
      title: 'Overall Score',
      dataIndex: 'overallScore',
      key: 'overallScore',
      render: (score) => (
        <Tag color={getPerformanceColor(score)}>
          {score.toFixed(1)}%
        </Tag>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const colors = {
          draft: 'default',
          submitted: 'blue',
          reviewed: 'green',
          archived: 'gray'
        };
        return <Tag color={colors[status]}>{status.toUpperCase()}</Tag>;
      }
    },
    {
      title: 'Evaluator',
      dataIndex: 'evaluatorName',
      key: 'evaluatorName'
    },
    {
      title: 'Date',
      dataIndex: 'evaluationDate',
      key: 'evaluationDate',
      render: (date) => moment(date).format('DD/MM/YYYY')
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="small">
          <Button
            size="small"
            onClick={() => navigate(`/supply-chain/supplier-performance/evaluation/${record._id}`)}
          >
            View
          </Button>
          {record.status === 'draft' && (
            <Button
              size="small"
              type="primary"
              onClick={() => navigate(`/supply-chain/supplier-performance/evaluation/${record._id}/edit`)}
            >
              Edit
            </Button>
          )}
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <Card style={{ marginBottom: '24px' }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={2} style={{ margin: 0 }}>
              <StarOutlined /> Supplier Performance Management
            </Title>
            <Text type="secondary">
              Track and evaluate supplier performance metrics
            </Text>
          </Col>
          <Col>
            <Space>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => navigate('/supply-chain/supplier-performance/evaluate')}
              >
                New Evaluation
              </Button>
              <Button
                icon={<BarChartOutlined />}
                onClick={() => navigate('/supply-chain/supplier-performance/analytics')}
              >
                Analytics
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Summary Statistics */}
      {rankings.length > 0 && (
        <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Total Suppliers Evaluated"
                value={rankings.length}
                prefix={<StarOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Average Performance"
                value={rankings.reduce((sum, s) => sum + s.overallScore, 0) / rankings.length}
                suffix="%"
                precision={1}
                valueStyle={{ color: '#52c41a' }}
              />
              </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Top Performers (A Grade)"
                value={rankings.filter(s => s.performanceGrade === 'A').length}
                prefix={<TrophyOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Need Improvement (D/F)"
                value={rankings.filter(s => ['D', 'F'].includes(s.performanceGrade)).length}
                prefix={<WarningOutlined />}
                valueStyle={{ color: '#f5222d' }}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* Main Content Tabs */}
      <Card>
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane 
            tab={
              <span>
                <TrophyOutlined />
                Supplier Rankings
                <Badge 
                  count={rankings.length} 
                  style={{ backgroundColor: '#52c41a', marginLeft: '8px' }} 
                />
              </span>
            } 
            key="rankings"
          >
            <Table
              columns={rankingsColumns}
              dataSource={rankings}
              rowKey="supplier"
              pagination={{
                pageSize: 20,
                showTotal: (total) => `Total ${total} suppliers`
              }}
              scroll={{ x: 1400 }}
            />
          </TabPane>

          <TabPane 
            tab={
              <span>
                <BarChartOutlined />
                Evaluations
                <Badge 
                  count={evaluations.length} 
                  style={{ backgroundColor: '#1890ff', marginLeft: '8px' }} 
                />
              </span>
            } 
            key="evaluations"
          >
            <Table
              columns={evaluationsColumns}
              dataSource={evaluations}
              rowKey="_id"
              loading={loading}
              pagination={{
                pageSize: 20,
                showTotal: (total) => `Total ${total} evaluations`
              }}
            />
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
};

export default SupplierPerformanceDashboard;