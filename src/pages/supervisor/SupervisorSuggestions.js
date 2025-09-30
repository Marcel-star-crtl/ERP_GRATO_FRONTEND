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
  Row,
  Col,
  Statistic,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  Tabs,
  Badge,
  Tooltip,
  message,
  Progress
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
  TeamOutlined,
  TrophyOutlined,
  HeartOutlined,
  ThunderboltOutlined,
  LikeOutlined,
  SendOutlined
} from '@ant-design/icons';
import { suggestions as suggestionsAPI } from '../../services/suggestionAPI';
import { useSelector } from 'react-redux';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;
const { RangePicker } = DatePicker;
const { TextArea } = Input;
const { TabPane } = Tabs;

const SupervisorSuggestions = () => {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [detailsModal, setDetailsModal] = useState(false);
  const [endorseModal, setEndorseModal] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState(null);
  const [endorseForm] = Form.useForm();
  const [activeTab, setActiveTab] = useState('all');
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    endorsed: 0,
    implemented: 0
  });
  const [filters, setFilters] = useState({
    status: 'all',
    category: 'all',
    priority: 'all',
    dateRange: null
  });
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    fetchTeamSuggestions();
  }, [filters, activeTab]);

  const fetchTeamSuggestions = async () => {
    try {
      setLoading(true);
      setError(null);

      // For supervisors, we need to get suggestions from team members
      const response = await suggestionsAPI.getSuggestionsByRole({
        status: filters.status !== 'all' ? filters.status : undefined,
        category: filters.category !== 'all' ? filters.category : undefined,
        priority: filters.priority !== 'all' ? filters.priority : undefined,
        supervisor: true, // Flag to get team suggestions
        limit: 100
      });

      if (response.success) {
        let filteredData = response.data || [];

        // Apply tab-based filtering
        if (activeTab === 'pending') {
          filteredData = filteredData.filter(s => s.status === 'pending' || s.status === 'under_review');
        } else if (activeTab === 'endorsed') {
          filteredData = filteredData.filter(s => s.supervisorEndorsement?.endorsed);
        } else if (activeTab === 'high_priority') {
          filteredData = filteredData.filter(s => s.priority === 'high' || s.priority === 'critical');
        }

        // Apply date filter locally if needed
        if (filters.dateRange) {
          filteredData = filteredData.filter(suggestion => {
            const suggestionDate = dayjs(suggestion.submittedAt);
            return suggestionDate.isBetween(filters.dateRange[0], filters.dateRange[1], 'day', '[]');
          });
        }

        setSuggestions(filteredData);
        
        // Calculate stats
        setStats({
          total: filteredData.length,
          pending: filteredData.filter(s => s.status === 'pending' || s.status === 'under_review').length,
          endorsed: filteredData.filter(s => s.supervisorEndorsement?.endorsed).length,
          implemented: filteredData.filter(s => s.status === 'implemented').length
        });
      } else {
        throw new Error(response.message || 'Failed to fetch team suggestions');
      }
    } catch (error) {
      console.error('Error fetching team suggestions:', error);
      setError(error.response?.data?.message || error.message || 'Failed to fetch team suggestions');
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEndorseSuggestion = async (values) => {
    try {
      setLoading(true);

      const response = await suggestionsAPI.submitSupervisorEndorsement(selectedSuggestion._id, {
        endorsed: values.endorsed,
        supervisorComments: values.supervisorComments,
        priorityRecommendation: values.priorityRecommendation,
        resourcesRequired: values.resourcesRequired
      });

      if (response.success) {
        message.success('Endorsement submitted successfully');
        setEndorseModal(false);
        setSelectedSuggestion(null);
        endorseForm.resetFields();
        await fetchTeamSuggestions();
      } else {
        throw new Error(response.message || 'Failed to submit endorsement');
      }
    } catch (error) {
      console.error('Error submitting endorsement:', error);
      message.error('Failed to submit endorsement');
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
      'critical': { color: 'red', text: 'Critical', icon: '🚨' },
      'high': { color: 'orange', text: 'High', icon: '🔥' },
      'medium': { color: 'yellow', text: 'Medium', icon: '⚡' },
      'low': { color: 'green', text: 'Low', icon: '📝' }
    };

    const priorityInfo = priorityMap[priority] || { color: 'default', text: priority, icon: '💡' };

    return (
      <Tag color={priorityInfo.color}>
        {priorityInfo.icon} {priorityInfo.text}
      </Tag>
    );
  };

  const getCategoryIcon = (category) => {
    const iconMap = {
      'workplace_improvement': <BulbOutlined style={{ color: '#52c41a' }} />,
      'technology': <ThunderboltOutlined style={{ color: '#1890ff' }} />,
      'process_improvement': <BarChartOutlined style={{ color: '#722ed1' }} />,
      'hr_policy': <TeamOutlined style={{ color: '#fa8c16' }} />,
      'environmental': <HeartOutlined style={{ color: '#52c41a' }} />,
      'cost_saving': <TrophyOutlined style={{ color: '#faad14' }} />,
      'customer_service': <StarOutlined style={{ color: '#13c2c2' }} />
    };

    return iconMap[category] || <BulbOutlined style={{ color: '#666' }} />;
  };

  const columns = [
    {
      title: 'Suggestion',
      key: 'suggestion',
      render: (_, record) => (
        <div>
          <Space style={{ marginBottom: '4px' }}>
            {getCategoryIcon(record.category)}
            <Text strong style={{ fontSize: '14px' }}>{record.title}</Text>
          </Space>
          <br />
          <Text type="secondary" style={{ fontSize: '12px' }}>
            by {record.employee?.fullName || record.submittedBy || 'Anonymous'}
          </Text>
          {record.isAnonymous && (
            <Tag size="small" color="purple" style={{ marginLeft: '8px' }}>
              Anonymous
            </Tag>
          )}
        </div>
      ),
      width: 280
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      render: (category) => (
        <Tag color="blue">{category?.replace('_', ' ').toUpperCase()}</Tag>
      ),
      width: 120
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority) => getPriorityTag(priority),
      width: 100
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => getStatusTag(status),
      width: 130
    },
    {
      title: 'Votes',
      key: 'votes',
      render: (_, record) => (
        <div style={{ textAlign: 'center' }}>
          <Space direction="vertical" size="small">
            <Text style={{ color: '#52c41a' }}>
              <LikeOutlined /> {record.votes?.up || 0}
            </Text>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {record.votes?.total || 0} total
            </Text>
          </Space>
        </div>
      ),
      width: 80
    },
    {
      title: 'Submitted',
      dataIndex: 'submittedAt',
      key: 'submittedAt',
      render: (date) => (
        <div>
          <div style={{ fontSize: '12px' }}>
            {dayjs(date).format('MMM DD')}
          </div>
          <div style={{ fontSize: '10px', color: '#666' }}>
            {dayjs(date).fromNow()}
          </div>
        </div>
      ),
      width: 100
    },
    {
      title: 'Endorsement',
      key: 'endorsement',
      render: (_, record) => (
        <div>
          {record.supervisorEndorsement?.endorsed ? (
            <Tag color="green" icon={<CheckCircleOutlined />}>
              Endorsed
            </Tag>
          ) : (
            <Tag color="orange" icon={<ClockCircleOutlined />}>
              Pending
            </Tag>
          )}
        </div>
      ),
      width: 110
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="View Details">
            <Button 
              type="link" 
              icon={<EyeOutlined />}
              onClick={() => {
                setSelectedSuggestion(record);
                setDetailsModal(true);
              }}
              size="small"
            />
          </Tooltip>
          {!record.supervisorEndorsement?.endorsed && (
            <Tooltip title="Endorse/Review">
              <Button 
                type="link" 
                icon={<SendOutlined />}
                onClick={() => {
                  setSelectedSuggestion(record);
                  endorseForm.setFieldsValue({
                    endorsed: true,
                    priorityRecommendation: record.priority
                  });
                  setEndorseModal(true);
                }}
                size="small"
              />
            </Tooltip>
          )}
        </Space>
      ),
      width: 100
    }
  ];

  const getStatsCards = () => (
    <Row gutter={16} style={{ marginBottom: '24px' }}>
      <Col xs={24} sm={12} md={6}>
        <Card size="small">
          <Statistic
            title="Total Team Suggestions"
            value={stats.total}
            valueStyle={{ color: '#1890ff' }}
            prefix={<BulbOutlined />}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} md={6}>
        <Card size="small">
          <Statistic
            title="Pending Review"
            value={stats.pending}
            valueStyle={{ color: '#faad14' }}
            prefix={<ClockCircleOutlined />}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} md={6}>
        <Card size="small">
          <Statistic
            title="Endorsed by You"
            value={stats.endorsed}
            valueStyle={{ color: '#52c41a' }}
            prefix={<CheckCircleOutlined />}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} md={6}>
        <Card size="small">
          <Statistic
            title="Implemented"
            value={stats.implemented}
            valueStyle={{ color: '#13c2c2' }}
            prefix={<StarOutlined />}
          />
        </Card>
      </Col>
    </Row>
  );

  if (loading && suggestions.length === 0) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Spin size="large" />
        <div style={{ marginTop: '16px' }}>Loading team suggestions...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <Title level={2} style={{ margin: 0 }}>
            <TeamOutlined /> Team Suggestions Management
          </Title>
          <Space>
            <Button 
              icon={<ReloadOutlined />}
              onClick={fetchTeamSuggestions}
              loading={loading}
            >
              Refresh
            </Button>
            <Button 
              type="primary" 
              icon={<BulbOutlined />}
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

        {/* Tabs */}
        <Tabs activeKey={activeTab} onChange={setActiveTab} style={{ marginBottom: '16px' }}>
          <TabPane 
            tab={
              <span>
                <BulbOutlined />
                All Suggestions ({stats.total})
              </span>
            } 
            key="all"
          />
          <TabPane 
            tab={
              <span>
                <ClockCircleOutlined />
                Pending Review ({stats.pending})
              </span>
            } 
            key="pending"
          />
          <TabPane 
            tab={
              <span>
                <CheckCircleOutlined />
                Endorsed ({stats.endorsed})
              </span>
            } 
            key="endorsed"
          />
          <TabPane 
            tab={
              <span>
                <StarOutlined />
                High Priority ({suggestions.filter(s => s.priority === 'high' || s.priority === 'critical').length})
              </span>
            } 
            key="high_priority"
          />
        </Tabs>

        {/* Filter Bar */}
        <Card size="small" style={{ marginBottom: '16px' }}>
          <Row gutter={16} align="middle">
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
              </Select>
            </Col>
            <Col>
              <Select
                style={{ width: 140 }}
                value={filters.category}
                onChange={(value) => setFilters({...filters, category: value})}
                placeholder="Category"
              >
                <Select.Option value="all">All Categories</Select.Option>
                <Select.Option value="workplace_improvement">Workplace</Select.Option>
                <Select.Option value="technology">Technology</Select.Option>
                <Select.Option value="process_improvement">Process</Select.Option>
                <Select.Option value="hr_policy">HR Policy</Select.Option>
                <Select.Option value="environmental">Environmental</Select.Option>
                <Select.Option value="cost_saving">Cost Saving</Select.Option>
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
            message="No Team Suggestions Found"
            description="No suggestions from your team members match the current filters."
            type="info"
            showIcon
            style={{ marginBottom: '16px' }}
          />
        ) : (
          <>
            <Text type="secondary" style={{ marginBottom: '8px', display: 'block' }}>
              Showing {suggestions.length} team suggestions
            </Text>
            
            <Table 
              columns={columns} 
              dataSource={suggestions} 
              loading={loading}
              rowKey="_id"
              pagination={{ 
                pageSize: 15,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) => 
                  `${range[0]}-${range[1]} of ${total} suggestions`
              }}
              scroll={{ x: 'max-content' }}
              rowClassName={(record) => {
                if (record.priority === 'critical') return 'critical-priority-row';
                if (!record.supervisorEndorsement?.endorsed && record.status === 'pending') return 'pending-endorsement-row';
                return '';
              }}
            />
          </>
        )}
      </Card>

      {/* Details Modal */}
      <Modal
        title={`Suggestion Details: ${selectedSuggestion?.title}`}
        open={detailsModal}
        onCancel={() => {
          setDetailsModal(false);
          setSelectedSuggestion(null);
        }}
        footer={null}
        width={700}
      >
        {selectedSuggestion && (
          <div>
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              <div>
                <Title level={4}>{selectedSuggestion.title}</Title>
                <Space>
                  <Text type="secondary">
                    Submitted by: {selectedSuggestion.employee?.fullName || 'Anonymous'}
                  </Text>
                  {getPriorityTag(selectedSuggestion.priority)}
                  {getStatusTag(selectedSuggestion.status)}
                </Space>
              </div>

              <div>
                <Title level={5}>Description</Title>
                <Paragraph>{selectedSuggestion.description}</Paragraph>
              </div>

              <div>
                <Title level={5}>Expected Benefits</Title>
                <Paragraph>{selectedSuggestion.expectedBenefit}</Paragraph>
              </div>

              {selectedSuggestion.votes && (
                <div>
                  <Title level={5}>Community Support</Title>
                  <Space>
                    <Badge count={selectedSuggestion.votes.up || 0} style={{ backgroundColor: '#52c41a' }}>
                      <Button icon={<LikeOutlined />} size="small">
                        Likes
                      </Button>
                    </Badge>
                    <Text type="secondary">
                      {selectedSuggestion.votes.total || 0} total votes
                    </Text>
                  </Space>
                </div>
              )}

              {selectedSuggestion.supervisorEndorsement?.endorsed && (
                <div>
                  <Title level={5}>Your Endorsement</Title>
                  <Alert
                    message="You have endorsed this suggestion"
                    description={selectedSuggestion.supervisorEndorsement.supervisorComments}
                    type="success"
                    showIcon
                  />
                </div>
              )}
            </Space>
          </div>
        )}
      </Modal>

      {/* Endorsement Modal */}
      <Modal
        title={`Endorse Suggestion: ${selectedSuggestion?.title}`}
        open={endorseModal}
        onCancel={() => {
          setEndorseModal(false);
          setSelectedSuggestion(null);
          endorseForm.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={endorseForm}
          layout="vertical"
          onFinish={handleEndorseSuggestion}
        >
          <Form.Item
            name="endorsed"
            label="Do you endorse this suggestion?"
            rules={[{ required: true, message: 'Please make a decision' }]}
          >
            <Select>
              <Select.Option value={true}>Yes, I endorse this suggestion</Select.Option>
              <Select.Option value={false}>No, I do not endorse this suggestion</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="priorityRecommendation"
            label="Priority Recommendation"
            rules={[{ required: true, message: 'Please recommend a priority level' }]}
          >
            <Select>
              <Select.Option value="critical">Critical - Needs immediate attention</Select.Option>
              <Select.Option value="high">High - Should be implemented soon</Select.Option>
              <Select.Option value="medium">Medium - Good idea for future</Select.Option>
              <Select.Option value="low">Low - Nice to have</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="resourcesRequired"
            label="Resources Required (Optional)"
          >
            <TextArea
              rows={2}
              placeholder="What resources would be needed to implement this suggestion?"
              maxLength={300}
            />
          </Form.Item>

          <Form.Item
            name="supervisorComments"
            label="Your Comments"
            rules={[{ required: true, message: 'Please provide your comments' }]}
          >
            <TextArea
              rows={4}
              placeholder="Share your thoughts on this suggestion, its feasibility, and potential impact..."
              maxLength={500}
              showCount
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button onClick={() => {
                setEndorseModal(false);
                setSelectedSuggestion(null);
                endorseForm.resetFields();
              }}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                Submit Endorsement
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <style jsx>{`
        .critical-priority-row {
          background-color: #fff1f0 !important;
          border-left: 4px solid #ff4d4f !important;
        }
        .critical-priority-row:hover {
          background-color: #ffe7e6 !important;
        }
        .pending-endorsement-row {
          background-color: #fffbf0 !important;
          border-left: 3px solid #faad14 !important;
        }
        .pending-endorsement-row:hover {
          background-color: #fff1d6 !important;
        }
      `}</style>
    </div>
  );
};

export default SupervisorSuggestions;