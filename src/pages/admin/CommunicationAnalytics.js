import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Row,
  Col,
  Statistic,
  Typography,
  DatePicker,
  Space,
  Table,
  Tag,
  Progress,
  Empty,
  Spin
} from 'antd';
import {
  BarChartOutlined,
  LineChartOutlined,
  TeamOutlined,
  MailOutlined,
  EyeOutlined,
  TrophyOutlined
} from '@ant-design/icons';
import { Line, Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title as ChartTitle,
  Tooltip,
  Legend
} from 'chart.js';
import api from '../../services/api';
import moment from 'moment';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  ChartTitle,
  Tooltip,
  Legend
);

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const CommunicationAnalytics = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState([
    moment().subtract(30, 'days'),
    moment()
  ]);
  const [analytics, setAnalytics] = useState({
    overall: {},
    timeSeries: [],
    topSenders: [],
    engagementByType: []
  });

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      
      const params = {
        startDate: dateRange[0].toISOString(),
        endDate: dateRange[1].toISOString()
      };

      const response = await api.get('/communications/stats/analytics', { params });
      setAnalytics(response.data.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  // Prepare chart data
  const timeSeriesData = {
    labels: analytics.timeSeries?.map(d => moment(d._id).format('MMM DD')) || [],
    datasets: [
      {
        label: 'Messages Sent',
        data: analytics.timeSeries?.map(d => d.count) || [],
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.4
      },
      {
        label: 'Total Recipients',
        data: analytics.timeSeries?.map(d => d.totalRecipients) || [],
        borderColor: 'rgb(54, 162, 235)',
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        tension: 0.4
      },
      {
        label: 'Messages Read',
        data: analytics.timeSeries?.map(d => d.totalReads) || [],
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        tension: 0.4
      }
    ]
  };

  const engagementData = {
    labels: analytics.engagementByType?.map(e => e._id) || [],
    datasets: [
      {
        label: 'Average Read Rate (%)',
        data: analytics.engagementByType?.map(e => e.avgReadRate?.toFixed(1)) || [],
        backgroundColor: [
          'rgba(255, 99, 132, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(75, 192, 192, 0.6)',
          'rgba(153, 102, 255, 0.6)',
          'rgba(255, 159, 64, 0.6)'
        ]
      }
    ]
  };

  const topSendersColumns = [
    {
      title: 'Rank',
      key: 'rank',
      width: 60,
      render: (_, __, index) => (
        <Tag color={index === 0 ? 'gold' : index === 1 ? 'silver' : index === 2 ? '#cd7f32' : 'default'}>
          #{index + 1}
        </Tag>
      )
    },
    {
      title: 'Sender',
      dataIndex: 'name',
      key: 'name'
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      render: (email) => <Text type="secondary">{email}</Text>
    },
    {
      title: 'Messages Sent',
      dataIndex: 'count',
      key: 'count',
      render: (count) => <Tag color="blue">{count}</Tag>
    },
    {
      title: 'Total Recipients',
      dataIndex: 'totalRecipients',
      key: 'totalRecipients',
      render: (total) => <Tag color="green">{total}</Tag>
    }
  ];

  if (loading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  const overallStats = analytics.overall || {};

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <Card style={{ marginBottom: '24px' }}>
        <Row align="middle" justify="space-between">
          <Col>
            <Title level={2}>
              <BarChartOutlined /> Communication Analytics
            </Title>
            <Text type="secondary">
              Insights and performance metrics
            </Text>
          </Col>
          <Col>
            <Space>
              <Text strong>Date Range:</Text>
              <RangePicker
                value={dateRange}
                onChange={(dates) => setDateRange(dates)}
                format="YYYY-MM-DD"
              />
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Overall Statistics */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card>
            <Statistic
              title="Total Messages Sent"
              value={overallStats.totalSent || 0}
              prefix={<MailOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card>
            <Statistic
              title="Total Recipients"
              value={overallStats.totalRecipients || 0}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card>
            <Statistic
              title="Emails Delivered"
              value={overallStats.totalEmailsSent || 0}
              prefix={<MailOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
            {overallStats.totalEmailsFailed > 0 && (
              <Text type="danger" style={{ fontSize: '12px' }}>
                {overallStats.totalEmailsFailed} failed
              </Text>
            )}
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card>
            <Statistic
              title="Average Read Rate"
              value={overallStats.avgReadRate?.toFixed(1) || 0}
              suffix="%"
              prefix={<EyeOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Time Series Chart */}
      <Card 
        title={
          <>
            <LineChartOutlined /> Communication Trends Over Time
          </>
        }
        style={{ marginBottom: '24px' }}
      >
        {analytics.timeSeries?.length > 0 ? (
          <Line 
            data={timeSeriesData}
            options={{
              responsive: true,
              plugins: {
                legend: {
                  position: 'top'
                }
              },
              scales: {
                y: {
                  beginAtZero: true
                }
              }
            }}
          />
        ) : (
          <Empty description="No data available for selected period" />
        )}
      </Card>

      <Row gutter={16}>
        {/* Engagement by Type */}
        <Col xs={24} lg={12}>
          <Card 
            title="Read Rate by Message Type"
            style={{ marginBottom: '24px' }}
          >
            {analytics.engagementByType?.length > 0 ? (
              <Bar 
                data={engagementData}
                options={{
                  responsive: true,
                  plugins: {
                    legend: {
                      display: false
                    }
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      max: 100,
                      ticks: {
                        callback: (value) => value + '%'
                      }
                    }
                  }
                }}
              />
            ) : (
              <Empty description="No engagement data available" />
            )}
          </Card>
        </Col>

        {/* Top Senders */}
        <Col xs={24} lg={12}>
          <Card 
            title={
              <>
                <TrophyOutlined /> Top Senders
              </>
            }
            style={{ marginBottom: '24px' }}
          >
            {analytics.topSenders?.length > 0 ? (
              <Table
                columns={topSendersColumns}
                dataSource={analytics.topSenders}
                pagination={false}
                size="small"
                rowKey={(record) => record.email}
              />
            ) : (
              <Empty description="No sender data available" />
            )}
          </Card>
        </Col>
      </Row>

      {/* Engagement Details by Type */}
      <Card title="Detailed Engagement by Message Type">
        {analytics.engagementByType?.length > 0 ? (
          <Row gutter={16}>
            {analytics.engagementByType.map((type) => (
              <Col xs={24} sm={12} md={8} key={type._id}>
                <Card size="small" style={{ marginBottom: '16px' }}>
                  <div style={{ marginBottom: '12px' }}>
                    <Text strong style={{ fontSize: '16px' }}>
                      {type._id}
                    </Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {type.count} messages sent
                    </Text>
                  </div>
                  
                  <div>
                    <Text type="secondary">Average Read Rate</Text>
                    <Progress 
                      percent={type.avgReadRate?.toFixed(1)} 
                      status={
                        type.avgReadRate > 70 ? 'success' :
                        type.avgReadRate > 40 ? 'normal' : 'exception'
                      }
                    />
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        ) : (
          <Empty description="No engagement data available" />
        )}
      </Card>
    </div>
  );
};

export default CommunicationAnalytics;