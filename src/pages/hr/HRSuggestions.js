import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Table, 
  Tag, 
  Space, 
  Typography, 
  Button, 
  Alert, 
  Spin, 
  Card,
  Select,
  DatePicker,
  Row,
  Col,
  Statistic,
  Modal,
  Form,
  Input,
  Progress,
  Rate,
  Tabs,
  Badge,
  Tooltip,
  message
} from 'antd';
import { 
  BulbOutlined, 
  CheckCircleOutlined, 
  CloseCircleOutlined, 
  ClockCircleOutlined,
  EyeOutlined,
  ReloadOutlined,
  BarChartOutlined,
  StarOutlined,
  CommentOutlined,
  EditOutlined,
  LikeOutlined,
  TrophyOutlined,
  TeamOutlined
} from '@ant-design/icons';
import { suggestions as suggestionsAPI } from '../../services/suggestionAPI';
import { useSelector } from 'react-redux';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;
const { RangePicker } = DatePicker;
const { TextArea } = Input;
const { TabPane } = Tabs;

const HRSuggestions = () => {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reviewModal, setReviewModal] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState(null);
  const [reviewForm] = Form.useForm();
  const [activeTab, setActiveTab] = useState('all');
  const [filters, setFilters] = useState({
    status: 'all',
    category: 'all',
    priority: 'all',
    dateRange: null
  });
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    fetchSuggestions();
  }, [filters, activeTab]);

  const fetchSuggestions = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await suggestionsAPI.getSuggestionsByRole({
        status: filters.status !== 'all' ? filters.status : undefined,
        category: filters.category !== 'all' ? filters.category : undefined,
        priority: filters.priority !== 'all' ? filters.priority : undefined,
        limit: 100
      });

      if (response.success) {
        let filteredData = response.data || [];

        // Apply tab-based filtering
        if (activeTab === 'pending') {
          filteredData = filteredData.filter(s => !s.hrReview?.reviewed);
        } else if (activeTab === 'reviewed') {
          filteredData = filteredData.filter(s => s.hrReview?.reviewed);
        } else if (activeTab === 'hr_focus') {
          filteredData = filteredData.filter(s => s.category === 'hr_policy');
        }

        // Apply date filter locally if needed
        if (filters.dateRange) {
          filteredData = filteredData.filter(suggestion => {
            const suggestionDate = dayjs(suggestion.submittedAt);
            return suggestionDate.isBetween(filters.dateRange[0], filters.dateRange[1], 'day', '[]');
          });
        }

        setSuggestions(filteredData);
      } else {
        throw new Error(response.message || 'Failed to fetch suggestions');
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setError(error.response?.data?.message || error.message || 'Failed to fetch suggestions');
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleHRReview = async (values) => {
    try {
      setLoading(true);

      const response = await suggestionsAPI.submitHRReview(selectedSuggestion._id, {
        recommendation: values.recommendation,
        comments: values.comments,
        feasibilityScore: values.feasibilityScore,
        hrPriority: values.hrPriority
      });

      if (response.success) {
        message.success('HR review submitted successfully');
        setReviewModal(false);
        setSelectedSuggestion(null);
        reviewForm.resetFields();
        await fetchSuggestions(); // Refresh data
      } else {
        throw new Error(response.message || 'Failed to submit HR review');
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      message.error('Failed to submit HR review');
    } finally {
      setLoading(false);
    }
  };

  const getStatusTag = (status) => {
    const statusMap = {
      'pending': { 
        color: 'orange', 
        icon: <ClockCircleOutlined />, 
        text: 'Pending Review' 
      },
      'under_review': { 
        color: 'blue', 
        icon: <EyeOutlined />, 
        text: 'Under Review' 
      },
      'hr_review': {
        color: 'purple',
        icon: <EyeOutlined />,
        text: 'HR Review'
      },
      'management_review': {
        color: 'geekblue',
        icon: <EyeOutlined />,
        text: 'Management Review'
      },
      'approved': { 
        color: 'green', 
        icon: <CheckCircleOutlined />, 
        text: 'Approved' 
      },
      'rejected': { 
        color: 'red', 
        icon: <CloseCircleOutlined />, 
        text: 'Rejected' 
      },
      'implemented': { 
        color: 'cyan', 
        icon: <StarOutlined />, 
        text: 'Implemented' 
      }
    };

    const statusInfo = statusMap[status] || { 
      color: 'default', 
      text: status?.replace('_', ' ') || 'Unknown' 
    };

    return (
      <Tag color={statusInfo.color} icon={statusInfo.icon}>
        {statusInfo.text}
      </Tag>
    );
  };

  const getPriorityTag = (priority) => {
    const priorityMap = {
      'critical': { color: 'red', text: 'Critical' },
      'high': { color: 'orange', text: 'High' },
      'medium': { color: 'yellow', text: 'Medium' },
      'low': { color: 'green', text: 'Low' }
    };

    const priorityInfo = priorityMap[priority] || { color: 'default', text: priority };

    return (
      <Tag color={priorityInfo.color}>
        {priorityInfo.text}
      </Tag>
    );
  };

  const getCategoryTag = (category) => {
    const categoryMap = {
      'workplace_improvement': { color: 'blue', text: 'Workplace', icon: '🏢' },
      'hr_policy': { color: 'purple', text: 'HR Policy', icon: '👥' },
      'technology': { color: 'cyan', text: 'Technology', icon: '💻' },
      'environmental': { color: 'green', text: 'Environmental', icon: '🌍' },
      'team_building': { color: 'orange', text: 'Team Building', icon: '🤝' },
      'cost_saving': { color: 'gold', text: 'Cost Saving', icon: '💰' },
      'other': { color: 'gray', text: 'Other', icon: '📋' }
    };

    const categoryInfo = categoryMap[category] || { color: 'default', text: category, icon: '📋' };

    return (
      <Tag color={categoryInfo.color}>
        {categoryInfo.icon} {categoryInfo.text}
      </Tag>
    );
  };

  const suggestionColumns = [
    {
      title: 'Suggestion Details',
      key: 'suggestionDetails',
      render: (_, record) => (
        <div>
          <Text strong style={{ fontSize: '13px' }}>{record.title}</Text>
          {record.isAnonymous && <Tag color="purple" size="small" style={{ marginLeft: '8px' }}>Anonymous</Tag>}
          <br />
          <Text code style={{ fontSize: '11px' }}>{record.suggestionId || record.displayId}</Text>
          <br />
          <Paragraph ellipsis={{ rows: 2 }} style={{ fontSize: '11px', color: '#666', margin: '4px 0 0 0', maxWidth: '300px' }}>
            {record.description}
          </Paragraph>
        </div>
      ),
      width: 320
    },
    {
      title: 'Employee',
      key: 'employee',
      render: (_, record) => (
        <div>
          {record.isAnonymous ? (
            <Text type="secondary">Anonymous</Text>
          ) : (
            <>
              <Text strong>{record.submittedBy?.fullName || record.employee?.fullName || 'Unknown'}</Text>
              <br />
              <Text type="secondary" style={{ fontSize: '11px' }}>
                {record.department || record.submittedBy?.department || record.employee?.department}
              </Text>
            </>
          )}
        </div>
      ),
      width: 150
    },
    {
      title: 'Category & Priority',
      key: 'categoryPriority',
      render: (_, record) => (
        <Space direction="vertical" size="small">
          {getCategoryTag(record.category)}
          {getPriorityTag(record.priority)}
        </Space>
      ),
      width: 150
    },
    {
      title: 'Community Impact',
      key: 'communityImpact',
      render: (_, record) => (
        <div style={{ textAlign: 'center' }}>
          <Space>
            <Tooltip title="Upvotes">
              <Badge count={record.votes?.upvotes || 0} color="#52c41a">
                <LikeOutlined style={{ color: '#52c41a' }} />
              </Badge>
            </Tooltip>
            <Tooltip title="Comments">
              <Badge count={record.comments?.length || 0} color="#1890ff">
                <CommentOutlined style={{ color: '#1890ff' }} />
              </Badge>
            </Tooltip>
          </Space>
          {record.hrReview?.feasibilityScore && (
            <div style={{ marginTop: '8px' }}>
              <Text type="secondary" style={{ fontSize: '10px' }}>Feasibility:</Text>
              <br />
              <Rate 
                value={record.hrReview.feasibilityScore / 2} 
                disabled 
                allowHalf 
                style={{ fontSize: '12px' }}
              />
            </div>
          )}
        </div>
      ),
      width: 120
    },
    {
      title: 'HR Review Status',
      key: 'hrReviewStatus',
      render: (_, record) => (
        <div>
          {record.hrReview?.reviewed ? (
            <div>
              <Tag color="green" size="small">✅ Reviewed</Tag>
              <div style={{ fontSize: '10px', marginTop: '4px' }}>
                by {record.hrReview.reviewedBy}
              </div>
              <div style={{ fontSize: '10px' }}>
                {record.hrReview.recommendation?.toUpperCase()}
              </div>
            </div>
          ) : (
            <div>
              <Tag color="orange" size="small">⏳ Pending HR Review</Tag>
            </div>
          )}
        </div>
      ),
      width: 130
    },
    {
      title: 'Status & Progress',
      key: 'statusProgress',
      render: (_, record) => (
        <div>
          {getStatusTag(record.status)}
          {record.implementation && (
            <div style={{ marginTop: '8px', width: '120px' }}>
              <Progress 
                size="small"
                percent={record.implementation.progress || 0}
                status={record.implementation.status === 'completed' ? 'success' : 'active'}
                showInfo={false}
              />
              <Text style={{ fontSize: '10px' }}>
                {record.implementation.status?.replace('_', ' ').toUpperCase()}
              </Text>
            </div>
          )}
        </div>
      ),
      width: 140
    },
    {
      title: 'Submitted',
      dataIndex: 'submittedAt',
      key: 'submittedAt',
      render: (date) => (
        <div>
          <div style={{ fontSize: '12px' }}>
            {new Date(date).toLocaleDateString()}
          </div>
          <div style={{ fontSize: '10px', color: '#666' }}>
            {dayjs(date).fromNow()}
          </div>
        </div>
      ),
      sorter: (a, b) => new Date(a.submittedAt) - new Date(b.submittedAt),
      defaultSortOrder: 'descend',
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
            onClick={() => navigate(`/hr/suggestions/${record._id}`)}
            size="small"
          >
            View
          </Button>
          {!record.hrReview?.reviewed && (
            <Button 
              type="link" 
              icon={<EditOutlined />}
              onClick={() => {
                setSelectedSuggestion(record);
                setReviewModal(true);
              }}
              size="small"
            >
              Review
            </Button>
          )}
        </Space>
      ),
      width: 100
    }
  ];

  const getStatsCards = () => {
    const totalSuggestions = suggestions.length;
    const pendingHRReview = suggestions.filter(s => !s.hrReview?.reviewed).length;
    const hrPolicySuggestions = suggestions.filter(s => s.category === 'hr_policy').length;
    const implementedSuggestions = suggestions.filter(s => s.status === 'implemented').length;
    const totalVotes = suggestions.reduce((sum, s) => sum + (s.votes?.totalVotes || 0), 0);
    const avgFeasibilityScore = suggestions.filter(s => s.hrReview?.feasibilityScore).length > 0 ?
      (suggestions.reduce((sum, s) => sum + (s.hrReview?.feasibilityScore || 0), 0) / 
       suggestions.filter(s => s.hrReview?.feasibilityScore).length).toFixed(1) : 0;

    return (
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col xs={12} sm={8} md={4}>
          <Card size="small">
            <Statistic
              title="Total Suggestions"
              value={totalSuggestions}
              prefix={<BulbOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card size="small">
            <Statistic
              title="Pending HR Review"
              value={pendingHRReview}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card size="small">
            <Statistic
              title="HR Policy Ideas"
              value={hrPolicySuggestions}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card size="small">
            <Statistic
              title="Implemented"
              value={implementedSuggestions}
              prefix={<TrophyOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card size="small">
            <Statistic
              title="Community Votes"
              value={totalVotes}
              prefix={<LikeOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card size="small">
            <Statistic
              title="Avg Feasibility"
              value={avgFeasibilityScore}
              suffix="/10"
              prefix={<StarOutlined />}
              valueStyle={{ color: '#13c2c2' }}
            />
          </Card>
        </Col>
      </Row>
    );
  };

  if (loading && suggestions.length === 0) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Spin size="large" />
        <div style={{ marginTop: '16px' }}>Loading suggestions...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <Title level={2} style={{ margin: 0 }}>
            <BulbOutlined /> HR Employee Suggestions Management
          </Title>
          <Space>
            <Button 
              icon={<BarChartOutlined />}
              onClick={() => navigate('/hr/suggestions/analytics')}
            >
              Analytics
            </Button>
            <Button 
              icon={<ReloadOutlined />}
              onClick={fetchSuggestions}
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

        {/* Stats Cards */}
        {getStatsCards()}

        {/* Tabs for different views */}
        <Tabs activeKey={activeTab} onChange={setActiveTab} style={{ marginBottom: '16px' }}>
          <TabPane 
            tab={
              <span>
                <BulbOutlined />
                All Suggestions ({suggestions.length})
              </span>
            } 
            key="all"
          />
          <TabPane 
            tab={
              <span>
                <ClockCircleOutlined />
                Pending HR Review ({suggestions.filter(s => !s.hrReview?.reviewed).length})
              </span>
            } 
            key="pending"
          />
          <TabPane 
            tab={
              <span>
                <CheckCircleOutlined />
                HR Reviewed ({suggestions.filter(s => s.hrReview?.reviewed).length})
              </span>
            } 
            key="reviewed"
          />
          <TabPane 
            tab={
              <span>
                <TeamOutlined />
                HR Policy Focus ({suggestions.filter(s => s.category === 'hr_policy').length})
              </span>
            } 
            key="hr_focus"
          />
        </Tabs>

        {/* Filters */}
        <Card size="small" style={{ marginBottom: '16px' }}>
          <Row gutter={16} align="middle">
            <Col>
              <Text strong>Filters:</Text>
            </Col>
            <Col>
              <Select
                style={{ width: 120 }}
                value={filters.status}
                onChange={(value) => setFilters({...filters, status: value})}
                placeholder="Status"
              >
                <Select.Option value="all">All Status</Select.Option>
                <Select.Option value="pending">Pending</Select.Option>
                <Select.Option value="under_review">Under Review</Select.Option>
                <Select.Option value="approved">Approved</Select.Option>
                <Select.Option value="implemented">Implemented</Select.Option>
                <Select.Option value="rejected">Rejected</Select.Option>
              </Select>
            </Col>
            <Col>
              <Select
                style={{ width: 150 }}
                value={filters.category}
                onChange={(value) => setFilters({...filters, category: value})}
                placeholder="Category"
              >
                <Select.Option value="all">All Categories</Select.Option>
                <Select.Option value="hr_policy">HR Policy</Select.Option>
                <Select.Option value="workplace_improvement">Workplace</Select.Option>
                <Select.Option value="technology">Technology</Select.Option>
                <Select.Option value="environmental">Environmental</Select.Option>
                <Select.Option value="team_building">Team Building</Select.Option>
                <Select.Option value="cost_saving">Cost Saving</Select.Option>
                <Select.Option value="other">Other</Select.Option>
              </Select>
            </Col>
            <Col>
              <Select
                style={{ width: 110 }}
                value={filters.priority}
                onChange={(value) => setFilters({...filters, priority: value})}
                placeholder="Priority"
              >
                <Select.Option value="all">All Priority</Select.Option>
                <Select.Option value="critical">Critical</Select.Option>
                <Select.Option value="high">High</Select.Option>
                <Select.Option value="medium">Medium</Select.Option>
                <Select.Option value="low">Low</Select.Option>
              </Select>
            </Col>
            <Col>
              <RangePicker
                style={{ width: 240 }}
                value={filters.dateRange}
                onChange={(dates) => setFilters({...filters, dateRange: dates})}
                placeholder={['Start Date', 'End Date']}
              />
            </Col>
            <Col>
              <Button 
                onClick={() => setFilters({
                  status: 'all',
                  category: 'all', 
                  priority: 'all',
                  dateRange: null
                })}
              >
                Clear Filters
              </Button>
            </Col>
          </Row>
        </Card>

        {suggestions.length === 0 ? (
          <Alert
            message="No Suggestions Found"
            description={
              "No suggestions match your current filter criteria. Try adjusting the filters above."
            }
            type="info"
            showIcon
            style={{ marginBottom: '16px' }}
          />
        ) : (
          <>
            <Text type="secondary" style={{ marginBottom: '8px', display: 'block' }}>
              Showing {suggestions.length} suggestions
            </Text>

            <Table 
              columns={suggestionColumns} 
              dataSource={suggestions} 
              loading={loading}
              rowKey="_id"
              pagination={{ 
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) => 
                  `${range[0]}-${range[1]} of ${total} suggestions`
              }}
              scroll={{ x: 'max-content' }}
              rowClassName={(record) => {
                if (record.status === 'implemented') {
                  return 'implemented-suggestion-row';
                }
                if (!record.hrReview?.reviewed) {
                  return 'pending-hr-review-row';
                }
                if (record.category === 'hr_policy') {
                  return 'hr-policy-row';
                }
                return '';
              }}
              expandable={{
                expandedRowRender: (record) => (
                  <div style={{ padding: '16px', backgroundColor: '#fafafa' }}>
                    <Row gutter={24}>
                      <Col span={12}>
                        <Space direction="vertical" style={{ width: '100%' }} size="middle">
                          <div>
                            <Text strong>Full Description:</Text>
                            <div style={{ 
                              marginTop: '8px', 
                              padding: '12px', 
                              backgroundColor: '#fff', 
                              borderRadius: '6px', 
                              border: '1px solid #d9d9d9',
                              whiteSpace: 'pre-wrap'
                            }}>
                              {record.description}
                            </div>
                          </div>

                          <div>
                            <Text strong>Expected Benefits:</Text>
                            <div style={{ 
                              marginTop: '8px', 
                              padding: '12px', 
                              backgroundColor: '#f6ffed', 
                              borderRadius: '6px', 
                              border: '1px solid #b7eb8f' 
                            }}>
                              {record.expectedBenefit}
                            </div>
                          </div>

                          <Row gutter={16}>
                            <Col span={12}>
                              <div>
                                <Text strong>Estimated Cost:</Text>
                                <div style={{ marginTop: '4px' }}>
                                  <Tag color="orange">{record.estimatedCost}</Tag>
                                </div>
                              </div>
                            </Col>
                            <Col span={12}>
                              <div>
                                <Text strong>Timeframe:</Text>
                                <div style={{ marginTop: '4px' }}>
                                  <Tag color="blue">{record.estimatedTimeframe}</Tag>
                                </div>
                              </div>
                            </Col>
                          </Row>
                        </Space>
                      </Col>

                      <Col span={12}>
                        <Space direction="vertical" style={{ width: '100%' }} size="middle">
                          {/* HR Review Details */}
                          <div>
                            <Text strong>HR Review Status:</Text>
                            <div style={{ marginTop: '8px' }}>
                              {record.hrReview?.reviewed ? (
                                <div style={{ 
                                  padding: '12px', 
                                  backgroundColor: '#f6ffed', 
                                  borderRadius: '6px', 
                                  border: '1px solid #b7eb8f' 
                                }}>
                                  <div><Text strong>Reviewed by:</Text> {record.hrReview.reviewedBy}</div>
                                  <div><Text strong>Date:</Text> {dayjs(record.hrReview.reviewedAt).format('MMM DD, YYYY')}</div>
                                  <div><Text strong>Recommendation:</Text> 
                                    <Tag color={record.hrReview.recommendation === 'approve' ? 'green' : 'red'} style={{ marginLeft: '8px' }}>
                                      {record.hrReview.recommendation?.toUpperCase()}
                                    </Tag>
                                  </div>
                                  {record.hrReview.feasibilityScore && (
                                    <div style={{ marginTop: '8px' }}>
                                      <Text strong>Feasibility Score:</Text>
                                      <Rate 
                                        value={record.hrReview.feasibilityScore / 2} 
                                        disabled 
                                        allowHalf 
                                        style={{ marginLeft: '8px' }}
                                      />
                                      <Text type="secondary"> ({record.hrReview.feasibilityScore}/10)</Text>
                                    </div>
                                  )}
                                  <div style={{ marginTop: '8px' }}>
                                    <Text strong>Comments:</Text>
                                    <div style={{ fontStyle: 'italic', marginTop: '4px' }}>
                                      "{record.hrReview.comments}"
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <Tag color="orange">Pending HR Review</Tag>
                              )}
                            </div>
                          </div>

                          {/* Implementation Details */}
                          {record.implementation && (
                            <div>
                              <Text strong>Implementation Details:</Text>
                              <div style={{ 
                                marginTop: '8px', 
                                padding: '12px', 
                                backgroundColor: '#e6f7ff', 
                                borderRadius: '6px', 
                                border: '1px solid #91d5ff' 
                              }}>
                                <div><Text strong>Status:</Text> {record.implementation.status?.replace('_', ' ').toUpperCase()}</div>
                                {record.implementation.assignedTeam && (
                                  <div><Text strong>Assigned Team:</Text> {record.implementation.assignedTeam}</div>
                                )}
                                {record.implementation.budget && (
                                  <div><Text strong>Budget:</Text> XAF {record.implementation.budget.toLocaleString()}</div>
                                )}
                                {record.implementation.startDate && (
                                  <div><Text strong>Start Date:</Text> {new Date(record.implementation.startDate).toLocaleDateString()}</div>
                                )}
                                {record.implementation.results && (
                                  <div style={{ marginTop: '8px' }}>
                                    <Text strong>Results:</Text>
                                    <div style={{ fontStyle: 'italic', color: '#52c41a' }}>
                                      {record.implementation.results}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Rejection Reason */}
                          {record.rejectionReason && (
                            <div>
                              <Text strong>Rejection Reason:</Text>
                              <div style={{ 
                                marginTop: '8px', 
                                padding: '12px', 
                                backgroundColor: '#fff2f0', 
                                borderRadius: '6px', 
                                border: '1px solid #ffccc7' 
                              }}>
                                {record.rejectionReason}
                              </div>
                            </div>
                          )}

                          {/* Community Comments */}
                          <div>
                            <Text strong>Community Comments ({record.comments?.length || 0}):</Text>
                            <div style={{ marginTop: '8px', maxHeight: '200px', overflowY: 'auto' }}>
                              {record.comments?.map((comment) => (
                                <div 
                                  key={comment.id}
                                  style={{ 
                                    padding: '8px', 
                                    backgroundColor: comment.isOfficial ? '#f6ffed' : '#fff', 
                                    borderRadius: '4px', 
                                    border: '1px solid #d9d9d9',
                                    marginBottom: '8px'
                                  }}
                                >
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Text strong style={{ fontSize: '12px' }}>
                                      {comment.user}
                                      {comment.isOfficial && <Tag color="green" size="small" style={{ marginLeft: '4px' }}>Official</Tag>}
                                    </Text>
                                    <Text type="secondary" style={{ fontSize: '10px' }}>
                                      {dayjs(comment.timestamp).fromNow()}
                                    </Text>
                                  </div>
                                  <div style={{ marginTop: '4px', fontSize: '12px' }}>
                                    {comment.comment}
                                  </div>
                                </div>
                              )) || <Text type="secondary" style={{ fontSize: '12px' }}>No comments yet</Text>}
                            </div>
                          </div>
                        </Space>
                      </Col>
                    </Row>
                  </div>
                ),
                rowExpandable: () => true,
              }}
            />
          </>
        )}
      </Card>

      {/* HR Review Modal */}
      <Modal
        title={`HR Review - ${selectedSuggestion?.suggestionId || selectedSuggestion?.displayId}`}
        open={reviewModal}
        onCancel={() => {
          setReviewModal(false);
          setSelectedSuggestion(null);
          reviewForm.resetFields();
        }}
        footer={null}
        width={800}
      >
        {selectedSuggestion && (
          <Form
            form={reviewForm}
            layout="vertical"
            onFinish={handleHRReview}
          >
            <Row gutter={16}>
              <Col span={24}>
                <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#f5f5f5', borderRadius: '6px' }}>
                  <Text strong>Suggestion Summary:</Text>
                  <br />
                  <Text>{selectedSuggestion.title}</Text>
                  <br />
                  <Text type="secondary">{selectedSuggestion.description}</Text>
                  <br />
                  <div style={{ marginTop: '8px' }}>
                    {getCategoryTag(selectedSuggestion.category)}
                    {getPriorityTag(selectedSuggestion.priority)}
                  </div>
                </div>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="recommendation"
                  label="HR Recommendation"
                  rules={[{ required: true, message: 'Please select a recommendation' }]}
                >
                  <Select placeholder="Select HR recommendation">
                    <Select.Option value="approve">Approve - Forward to Management</Select.Option>
                    <Select.Option value="reject">Reject - Not Feasible</Select.Option>
                    <Select.Option value="modify">Needs Modification</Select.Option>
                    <Select.Option value="investigate">Requires Further Investigation</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="hrPriority"
                  label="HR Priority Level"
                  rules={[{ required: true, message: 'Please set HR priority' }]}
                >
                  <Select placeholder="Set priority from HR perspective">
                    <Select.Option value="high">High Priority</Select.Option>
                    <Select.Option value="medium">Medium Priority</Select.Option>
                    <Select.Option value="low">Low Priority</Select.Option>
                    <Select.Option value="future">Future Consideration</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="feasibilityScore"
              label="Feasibility Score (1-10)"
              rules={[
                { required: true, message: 'Please provide feasibility score' },
                { type: 'number', min: 1, max: 10, message: 'Score must be between 1 and 10' }
              ]}
            >
              <Rate 
                count={10} 
                allowHalf
                style={{ fontSize: '20px' }}
              />
            </Form.Item>

            <Form.Item
              name="comments"
              label="HR Review Comments"
              rules={[{ required: true, message: 'Please provide HR review comments' }]}
            >
              <TextArea 
                rows={4} 
                placeholder="Provide detailed HR assessment including feasibility, alignment with company policies, potential impact on HR operations..."
                showCount
                maxLength={800}
              />
            </Form.Item>

            <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
              <Space>
                <Button onClick={() => setReviewModal(false)}>
                  Cancel
                </Button>
                <Button type="primary" htmlType="submit" loading={loading}>
                  Submit HR Review
                </Button>
              </Space>
            </Form.Item>
          </Form>
        )}
      </Modal>

      <style jsx>{`
        .implemented-suggestion-row {
          background-color: #f6ffed !important;
          border-left: 4px solid #52c41a !important;
        }
        .implemented-suggestion-row:hover {
          background-color: #e6f7d2 !important;
        }
        .pending-hr-review-row {
          background-color: #fffbf0 !important;
          border-left: 3px solid #faad14 !important;
        }
        .pending-hr-review-row:hover {
          background-color: #fff1d6 !important;
        }
        .hr-policy-row {
          background-color: #f9f0ff !important;
          border-left: 2px solid #722ed1 !important;
        }
        .hr-policy-row:hover {
          background-color: #efe6ff !important;
        }
      `}</style>
    </div>
  );
};

export default HRSuggestions;



