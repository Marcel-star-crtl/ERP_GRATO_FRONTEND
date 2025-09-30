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
  Badge,
  Tooltip,
  Modal,
  Select,
  DatePicker,
  Row,
  Col,
  Progress,
  Rate,
  Switch,
  message
} from 'antd';
import { 
  BulbOutlined, 
  CheckCircleOutlined, 
  CloseCircleOutlined, 
  ClockCircleOutlined,
  PlusOutlined,
  EyeOutlined,
  ReloadOutlined,
  StarOutlined,
  HeartOutlined,
  CommentOutlined,
  LikeOutlined,
  EyeInvisibleOutlined,
  SafetyCertificateOutlined,
  EnvironmentOutlined,
  TeamOutlined,
  ToolOutlined,
  DollarOutlined,
  SmileOutlined
} from '@ant-design/icons';
import { suggestions as suggestionsAPI } from '../../services/suggestionAPI';
import { useSelector } from 'react-redux';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;
const { RangePicker } = DatePicker;

const EmployeeSuggestions = () => {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAnonymous, setShowAnonymous] = useState(true);
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
  }, [filters]);

  const fetchSuggestions = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await suggestionsAPI.getSuggestionsByRole({
        status: filters.status !== 'all' ? filters.status : undefined,
        category: filters.category !== 'all' ? filters.category : undefined,
        priority: filters.priority !== 'all' ? filters.priority : undefined,
        limit: 100 // Get more results for local filtering
      });

      if (response.success) {
        let filteredData = response.data || [];

        // Apply date filter locally if needed
        if (filters.dateRange) {
          filteredData = filteredData.filter(suggestion => {
            const suggestionDate = dayjs(suggestion.submittedAt);
            return suggestionDate.isBetween(filters.dateRange[0], filters.dateRange[1], 'day', '[]');
          });
        }

        // Apply anonymous filter if needed
        if (!showAnonymous) {
          filteredData = filteredData.filter(s => 
            (s.employee && s.employee._id === user._id) || 
            s.submittedBy === user.email
          );
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

  const handleRefresh = async () => {
    await fetchSuggestions();
  };

  const handleVote = async (suggestionId, voteType) => {
    try {
      const response = await suggestionsAPI.voteSuggestion(suggestionId, voteType);
      
      if (response.success) {
        // Update local state
        setSuggestions(prev => prev.map(suggestion => {
          if (suggestion._id === suggestionId) {
            return {
              ...suggestion,
              votes: response.data.votes
            };
          }
          return suggestion;
        }));
        
        message.success('Vote recorded successfully');
      }
    } catch (error) {
      console.error('Error voting:', error);
      message.error('Failed to record vote');
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
      },
      'on_hold': { 
        color: 'gray', 
        icon: <ClockCircleOutlined />, 
        text: 'On Hold' 
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

  const getCategoryIcon = (category) => {
    const categoryIcons = {
      'workplace_improvement': <EnvironmentOutlined style={{ color: '#52c41a' }} />,
      'technology': <ToolOutlined style={{ color: '#1890ff' }} />,
      'environmental': <SafetyCertificateOutlined style={{ color: '#13c2c2' }} />,
      'hr_policy': <TeamOutlined style={{ color: '#722ed1' }} />,
      'team_building': <SmileOutlined style={{ color: '#fa8c16' }} />,
      'cost_saving': <DollarOutlined style={{ color: '#faad14' }} />,
      'safety': <SafetyCertificateOutlined style={{ color: '#f5222d' }} />,
      'process_improvement': <ToolOutlined style={{ color: '#eb2f96' }} />,
      'other': <BulbOutlined style={{ color: '#666' }} />
    };

    return categoryIcons[category] || <BulbOutlined style={{ color: '#666' }} />;
  };

  const suggestionColumns = [
    {
      title: 'Suggestion',
      key: 'suggestion',
      render: (_, record) => (
        <div>
          <Space style={{ marginBottom: '4px' }}>
            {getCategoryIcon(record.category)}
            <Text strong style={{ fontSize: '13px' }}>{record.title}</Text>
            {record.isAnonymous && <Tag color="purple" size="small">Anonymous</Tag>}
          </Space>
          <br />
          <Text type="secondary" style={{ fontSize: '11px' }}>
            ID: {record.suggestionId || record.displayId}
          </Text>
          <br />
          <Paragraph ellipsis={{ rows: 2 }} style={{ fontSize: '11px', color: '#666', margin: '4px 0 0 0', maxWidth: '300px' }}>
            {record.description}
          </Paragraph>
        </div>
      ),
      width: 320
    },
    {
      title: 'Category & Priority',
      key: 'categoryPriority',
      render: (_, record) => (
        <Space direction="vertical" size="small">
          <Tag color="blue" style={{ fontSize: '11px' }}>
            {record.category?.replace('_', ' ').toUpperCase()}
          </Tag>
          {getPriorityTag(record.priority)}
        </Space>
      ),
      width: 130
    },
    {
      title: 'Community',
      key: 'community',
      render: (_, record) => (
        <div style={{ textAlign: 'center' }}>
          <Space>
            <Tooltip title="Upvotes">
              <Button 
                type={record.votes?.userVote === 'up' ? 'primary' : 'text'}
                size="small"
                icon={<LikeOutlined />}
                onClick={() => handleVote(record._id, 'up')}
              >
                {record.votes?.upvotes || 0}
              </Button>
            </Tooltip>
            <Tooltip title="Comments">
              <Button 
                type="text"
                size="small"
                icon={<CommentOutlined />}
              >
                {record.comments?.length || 0}
              </Button>
            </Tooltip>
          </Space>
          {record.reviewStatus?.feasibilityScore && (
            <div style={{ marginTop: '4px' }}>
              <Text type="secondary" style={{ fontSize: '10px' }}>Score:</Text>
              <br />
              <Rate 
                value={record.reviewStatus.feasibilityScore / 2} 
                disabled 
                allowHalf 
                style={{ fontSize: '12px' }}
              />
            </div>
          )}
        </div>
      ),
      width: 100
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status, record) => (
        <div>
          {getStatusTag(status)}
          {record.implementation?.status && (
            <div style={{ marginTop: '4px' }}>
              <Progress 
                size="small"
                percent={record.implementation.progress || 0}
                status={record.implementation.status === 'completed' ? 'success' : 'active'}
                format={() => record.implementation.status.replace('_', ' ').toUpperCase()}
              />
            </div>
          )}
        </div>
      ),
      filters: [
        { text: 'Pending', value: 'pending' },
        { text: 'Under Review', value: 'under_review' },
        { text: 'HR Review', value: 'hr_review' },
        { text: 'Management Review', value: 'management_review' },
        { text: 'Approved', value: 'approved' },
        { text: 'Implemented', value: 'implemented' },
        { text: 'Rejected', value: 'rejected' },
        { text: 'On Hold', value: 'on_hold' }
      ],
      onFilter: (value, record) => record.status === value,
      width: 150
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
            onClick={() => navigate(`/employee/suggestions/${record._id}`)}
            size="small"
          >
            View
          </Button>
        </Space>
      ),
      width: 80
    }
  ];

  const getStatsCards = () => {
    const totalSuggestions = suggestions.length;
    const mySuggestions = suggestions.filter(s => 
      (s.employee && s.employee._id === user._id) || 
      s.submittedBy === user.email
    ).length;
    const pendingSuggestions = suggestions.filter(s => s.status === 'pending').length;
    const implementedSuggestions = suggestions.filter(s => s.status === 'implemented').length;
    const totalUpvotes = suggestions.reduce((sum, s) => sum + (s.votes?.upvotes || 0), 0);
    const avgScore = suggestions.length > 0 ? 
      (suggestions.reduce((sum, s) => sum + (s.reviewStatus?.feasibilityScore || 0), 0) / suggestions.length).toFixed(1) : 0;

    return (
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col xs={12} sm={8} md={4}>
          <Card size="small">
            <div style={{ textAlign: 'center' }}>
              <Text type="secondary">Total Ideas</Text>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#1890ff' }}>
                {totalSuggestions}
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card size="small">
            <div style={{ textAlign: 'center' }}>
              <Text type="secondary">My Suggestions</Text>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#722ed1' }}>
                {mySuggestions}
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card size="small">
            <div style={{ textAlign: 'center' }}>
              <Text type="secondary">Pending Review</Text>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#faad14' }}>
                {pendingSuggestions}
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card size="small">
            <div style={{ textAlign: 'center' }}>
              <Text type="secondary">Implemented</Text>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#52c41a' }}>
                {implementedSuggestions}
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card size="small">
            <div style={{ textAlign: 'center' }}>
              <Text type="secondary">Community Votes</Text>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#fa8c16' }}>
                {totalUpvotes}
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card size="small">
            <div style={{ textAlign: 'center' }}>
              <Text type="secondary">Avg Score</Text>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#13c2c2' }}>
                {avgScore}/10
              </div>
            </div>
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
            <BulbOutlined /> Employee Suggestions
          </Title>
          <Space>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <Text style={{ marginRight: '8px' }}>Show all suggestions:</Text>
              <Switch 
                checked={showAnonymous}
                onChange={setShowAnonymous}
                checkedChildren={<EyeOutlined />}
                unCheckedChildren={<EyeInvisibleOutlined />}
              />
            </div>
            <Button 
              icon={<ReloadOutlined />}
              onClick={handleRefresh}
              loading={loading}
            >
              Refresh
            </Button>
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={() => navigate('/employee/suggestions/new')}
            >
              Submit Suggestion
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
                <Select.Option value="hr_review">HR Review</Select.Option>
                <Select.Option value="management_review">Management Review</Select.Option>
                <Select.Option value="approved">Approved</Select.Option>
                <Select.Option value="implemented">Implemented</Select.Option>
                <Select.Option value="rejected">Rejected</Select.Option>
                <Select.Option value="on_hold">On Hold</Select.Option>
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
                <Select.Option value="workplace_improvement">Workplace</Select.Option>
                <Select.Option value="technology">Technology</Select.Option>
                <Select.Option value="environmental">Environmental</Select.Option>
                <Select.Option value="hr_policy">HR Policy</Select.Option>
                <Select.Option value="team_building">Team Building</Select.Option>
                <Select.Option value="cost_saving">Cost Saving</Select.Option>
                <Select.Option value="safety">Safety</Select.Option>
                <Select.Option value="process_improvement">Process</Select.Option>
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

        {/* Guidelines */}
        <Alert
          message="Suggestion Guidelines"
          description={
            <div>
              <p><strong>💡 Share your ideas:</strong> All suggestions are welcome - from small improvements to big innovations!</p>
              <p><strong>🔒 Anonymous option:</strong> You can submit suggestions anonymously if you prefer.</p>
              <p><strong>👥 Community voting:</strong> Vote on suggestions to help prioritize the best ideas.</p>
              <p><strong>⭐ Implementation:</strong> Approved suggestions may be implemented with proper recognition.</p>
            </div>
          }
          type="info"
          showIcon
          style={{ marginBottom: '16px' }}
        />

        {suggestions.length === 0 ? (
          <Alert
            message="No Suggestions Found"
            description={
              "No suggestions match your current filter criteria. Try adjusting the filters above or submit a new suggestion!"
            }
            type="info"
            showIcon
            style={{ marginBottom: '16px' }}
          />
        ) : (
          <>
            <Text type="secondary" style={{ marginBottom: '8px', display: 'block' }}>
              Showing {suggestions.length} suggestions
              {!showAnonymous && ' (filtered to your view)'}
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
                  return 'implemented-row';
                }
                if (record.status === 'approved') {
                  return 'approved-row';
                }
                if ((record.employee && record.employee._id === user._id) || record.submittedBy === user.email) {
                  return 'my-suggestion-row';
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
                          {/* Review Status */}
                          <div>
                            <Text strong>Review Status:</Text>
                            <div style={{ marginTop: '8px' }}>
                              <Space direction="vertical" size="small">
                                <div>
                                  <Text>HR Review: </Text>
                                  {getStatusTag(record.reviewStatus?.hrReview || 'pending')}
                                </div>
                                <div>
                                  <Text>Management Review: </Text>
                                  {getStatusTag(record.reviewStatus?.managementReview || 'pending')}
                                </div>
                                {record.reviewStatus?.feasibilityScore && (
                                  <div>
                                    <Text>Feasibility Score: </Text>
                                    <Rate 
                                      value={record.reviewStatus.feasibilityScore / 2} 
                                      disabled 
                                      allowHalf 
                                    />
                                    <Text type="secondary"> ({record.reviewStatus.feasibilityScore}/10)</Text>
                                  </div>
                                )}
                              </Space>
                            </div>
                          </div>

                          {/* Implementation Details */}
                          {record.implementation && (
                            <div>
                              <Text strong>Implementation:</Text>
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

                          {/* Comments */}
                          <div>
                            <Text strong>Comments ({record.comments?.length || 0}):</Text>
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

      <style jsx>{`
        .implemented-row {
          background-color: #f6ffed !important;
          border-left: 4px solid #52c41a !important;
        }
        .implemented-row:hover {
          background-color: #e6f7d2 !important;
        }
        .approved-row {
          background-color: #e6f7ff !important;
          border-left: 3px solid #1890ff !important;
        }
        .approved-row:hover {
          background-color: #d6f0ff !important;
        }
        .my-suggestion-row {
          background-color: #f9f0ff !important;
          border-left: 2px solid #722ed1 !important;
        }
        .my-suggestion-row:hover {
          background-color: #efe6ff !important;
        }
      `}</style>
    </div>
  );
};

export default EmployeeSuggestions;


