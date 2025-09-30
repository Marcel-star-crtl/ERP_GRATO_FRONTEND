import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Card, 
  Typography, 
  Space, 
  Row, 
  Col,
  Alert,
  Spin,
  Button,
  Tag,
  Divider,
  message,
  Rate,
  Progress,
  Timeline
} from 'antd';
import { 
  ArrowLeftOutlined,
  BulbOutlined,
  LikeOutlined,
  CommentOutlined,
  EyeOutlined,
  StarOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined
} from '@ant-design/icons';
import { suggestions as suggestionsAPI } from '../../services/suggestionAPI';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;

const SuggestionDetails = () => {
  const { suggestionId } = useParams();
  const navigate = useNavigate();
  const [suggestion, setSuggestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (suggestionId) {
      fetchSuggestionDetails();
    } else {
      setError('No suggestion ID provided');
      setLoading(false);
    }
  }, [suggestionId]);

  const fetchSuggestionDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await suggestionsAPI.getSuggestionDetails(suggestionId);
      
      if (response.success) {
        setSuggestion(response.data);
      } else {
        throw new Error(response.message || 'Failed to fetch suggestion details');
      }
    } catch (error) {
      console.error('Error fetching suggestion details:', error);
      setError(error.response?.data?.message || error.message || 'Failed to fetch suggestion details');
    } finally {
      setLoading(false);
    }
  };

  const getStatusTag = (status) => {
    const statusMap = {
      'pending': { color: 'orange', text: 'Pending Review' },
      'under_review': { color: 'blue', text: 'Under Review' },
      'hr_review': { color: 'purple', text: 'HR Review' },
      'management_review': { color: 'geekblue', text: 'Management Review' },
      'approved': { color: 'green', text: 'Approved' },
      'rejected': { color: 'red', text: 'Rejected' },
      'implemented': { color: 'cyan', text: 'Implemented' },
      'on_hold': { color: 'gray', text: 'On Hold' }
    };

    const statusInfo = statusMap[status] || { color: 'default', text: status };
    return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>;
  };

  const getPriorityTag = (priority) => {
    const priorityMap = {
      'critical': { color: 'red', text: 'Critical' },
      'high': { color: 'orange', text: 'High' },
      'medium': { color: 'yellow', text: 'Medium' },
      'low': { color: 'green', text: 'Low' }
    };

    const priorityInfo = priorityMap[priority] || { color: 'default', text: priority };
    return <Tag color={priorityInfo.color}>{priorityInfo.text}</Tag>;
  };

  const handleVote = async (voteType) => {
    try {
      const response = await suggestionsAPI.voteSuggestion(suggestionId, voteType);
      if (response.success) {
        setSuggestion(prev => ({
          ...prev,
          votes: response.data.votes
        }));
        message.success('Vote recorded successfully');
      }
    } catch (error) {
      console.error('Error voting:', error);
      message.error('Failed to record vote');
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Spin size="large" />
        <div style={{ marginTop: '16px' }}>Loading suggestion details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '24px' }}>
        <Alert
          message="Error Loading Suggestion"
          description={error}
          type="error"
          showIcon
          action={
            <Space>
              <Button onClick={() => navigate(-1)} icon={<ArrowLeftOutlined />}>
                Go Back
              </Button>
              <Button type="primary" onClick={fetchSuggestionDetails}>
                Retry
              </Button>
            </Space>
          }
        />
      </div>
    );
  }

  if (!suggestion) {
    return (
      <div style={{ padding: '24px' }}>
        <Alert
          message="Suggestion Not Found"
          description="The requested suggestion could not be found."
          type="warning"
          showIcon
          action={
            <Button onClick={() => navigate(-1)} icon={<ArrowLeftOutlined />}>
              Go Back
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <Button 
          icon={<ArrowLeftOutlined />} 
          onClick={() => navigate(-1)}
          style={{ marginBottom: '16px' }}
        >
          Back to Suggestions
        </Button>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <Title level={2} style={{ margin: 0, marginBottom: '8px' }}>
              <BulbOutlined /> {suggestion.title}
            </Title>
            <Space size="middle" wrap>
              {getStatusTag(suggestion.status)}
              {getPriorityTag(suggestion.priority)}
              <Text type="secondary">
                ID: {suggestion.suggestionId || suggestion.displayId}
              </Text>
              {suggestion.isAnonymous && <Tag color="purple">Anonymous</Tag>}
            </Space>
          </div>
          
          {/* Vote buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Button
              type={suggestion.votes?.userVote === 'up' ? 'primary' : 'default'}
              icon={<LikeOutlined />}
              onClick={() => handleVote('up')}
            >
              {suggestion.votes?.upvotes || 0}
            </Button>
            <Button
              icon={<CommentOutlined />}
            >
              {suggestion.comments?.length || 0}
            </Button>
            <Button icon={<EyeOutlined />}>
              {suggestion.viewCount || 0}
            </Button>
          </div>
        </div>
      </div>

      <Row gutter={24}>
        {/* Main Content */}
        <Col xs={24} lg={16}>
          {/* Description */}
          <Card title="Suggestion Description" style={{ marginBottom: '24px' }}>
            <Paragraph style={{ fontSize: '14px', whiteSpace: 'pre-wrap' }}>
              {suggestion.description}
            </Paragraph>
          </Card>

          {/* Expected Benefits */}
          <Card title="Expected Benefits" style={{ marginBottom: '24px' }}>
            <div style={{ 
              padding: '16px', 
              backgroundColor: '#f6ffed', 
              borderRadius: '6px', 
              border: '1px solid #b7eb8f' 
            }}>
              <Paragraph style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                {suggestion.expectedBenefit}
              </Paragraph>
            </div>
          </Card>

          {/* Implementation Details */}
          {(suggestion.implementationSteps || suggestion.requiredResources || suggestion.potentialChallenges) && (
            <Card title="Implementation Details" style={{ marginBottom: '24px' }}>
              <Space direction="vertical" style={{ width: '100%' }} size="middle">
                {suggestion.implementationSteps && (
                  <div>
                    <Text strong>Implementation Steps:</Text>
                    <div style={{ marginTop: '8px' }}>
                      <Paragraph style={{ whiteSpace: 'pre-wrap' }}>
                        {suggestion.implementationSteps}
                      </Paragraph>
                    </div>
                  </div>
                )}
                
                {suggestion.requiredResources && (
                  <div>
                    <Text strong>Required Resources:</Text>
                    <div style={{ marginTop: '8px' }}>
                      <Paragraph style={{ whiteSpace: 'pre-wrap' }}>
                        {suggestion.requiredResources}
                      </Paragraph>
                    </div>
                  </div>
                )}
                
                {suggestion.potentialChallenges && (
                  <div>
                    <Text strong>Potential Challenges:</Text>
                    <div style={{ marginTop: '8px' }}>
                      <Paragraph style={{ whiteSpace: 'pre-wrap' }}>
                        {suggestion.potentialChallenges}
                      </Paragraph>
                    </div>
                  </div>
                )}
              </Space>
            </Card>
          )}

          {/* Comments Section */}
          <Card title={`Comments (${suggestion.comments?.length || 0})`}>
            {suggestion.comments && suggestion.comments.length > 0 ? (
              <Timeline
                items={suggestion.comments.map((comment) => ({
                  color: comment.isOfficial ? 'green' : 'blue',
                  children: (
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <Text strong>
                          {comment.user}
                          {comment.isOfficial && <Tag color="green" size="small" style={{ marginLeft: '8px' }}>Official</Tag>}
                        </Text>
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          {dayjs(comment.timestamp).fromNow()}
                        </Text>
                      </div>
                      <div style={{ fontSize: '14px' }}>
                        {comment.comment}
                      </div>
                    </div>
                  )
                }))}
              />
            ) : (
              <Text type="secondary">No comments yet</Text>
            )}
          </Card>
        </Col>

        {/* Sidebar */}
        <Col xs={24} lg={8}>
          {/* Submission Info */}
          <Card title="Submission Information" style={{ marginBottom: '16px' }}>
            <Space direction="vertical" style={{ width: '100%' }} size="small">
              <div>
                <Text type="secondary">Submitted by:</Text>
                <div>{suggestion.isAnonymous ? 'Anonymous' : (suggestion.submittedBy?.fullName || suggestion.submittedBy?.email || 'Unknown')}</div>
              </div>
              <div>
                <Text type="secondary">Department:</Text>
                <div>{suggestion.department || 'Not specified'}</div>
              </div>
              <div>
                <Text type="secondary">Submitted on:</Text>
                <div>{dayjs(suggestion.submittedAt).format('MMM DD, YYYY')}</div>
              </div>
              <div>
                <Text type="secondary">Category:</Text>
                <div>
                  <Tag color="blue">
                    {suggestion.category?.replace('_', ' ').toUpperCase()}
                  </Tag>
                </div>
              </div>
            </Space>
          </Card>

          {/* Cost & Timeline */}
          <Card title="Cost & Timeline" style={{ marginBottom: '16px' }}>
            <Space direction="vertical" style={{ width: '100%' }} size="small">
              <div>
                <Text type="secondary">Estimated Cost:</Text>
                <div><Tag color="orange">{suggestion.estimatedCost}</Tag></div>
              </div>
              <div>
                <Text type="secondary">Timeframe:</Text>
                <div><Tag color="blue">{suggestion.estimatedTimeframe}</Tag></div>
              </div>
              {suggestion.costJustification && (
                <div>
                  <Text type="secondary">Cost Justification:</Text>
                  <div style={{ marginTop: '4px', fontSize: '12px' }}>
                    {suggestion.costJustification}
                  </div>
                </div>
              )}
            </Space>
          </Card>

          {/* Review Status */}
          {suggestion.reviewStatus && (
            <Card title="Review Status" style={{ marginBottom: '16px' }}>
              <Space direction="vertical" style={{ width: '100%' }} size="small">
                <div>
                  <Text>HR Review: </Text>
                  {getStatusTag(suggestion.reviewStatus.hrReview || 'pending')}
                </div>
                <div>
                  <Text>Management Review: </Text>
                  {getStatusTag(suggestion.reviewStatus.managementReview || 'pending')}
                </div>
                {suggestion.reviewStatus.feasibilityScore && (
                  <div>
                    <Text>Feasibility Score:</Text>
                    <div style={{ marginTop: '8px' }}>
                      <Rate 
                        value={suggestion.reviewStatus.feasibilityScore / 2} 
                        disabled 
                        allowHalf 
                      />
                      <Text type="secondary" style={{ marginLeft: '8px' }}>
                        ({suggestion.reviewStatus.feasibilityScore}/10)
                      </Text>
                    </div>
                  </div>
                )}
              </Space>
            </Card>
          )}

          {suggestion.implementation && (
            <Card title="Implementation Status" style={{ marginBottom: '16px' }}>
              <Space direction="vertical" style={{ width: '100%' }} size="small">
                <div>
                  <Text strong>Status:</Text> 
                  <div>{suggestion.implementation.status?.replace('_', ' ').toUpperCase()}</div>
                </div>
                {suggestion.implementation.progress !== undefined && (
                  <div>
                    <Text strong>Progress:</Text>
                    <Progress 
                      percent={suggestion.implementation.progress} 
                      size="small" 
                      status={suggestion.implementation.status === 'completed' ? 'success' : 'active'}
                    />
                  </div>
                )}
                {suggestion.implementation.results && (
                  <div>
                    <Text strong>Results:</Text>
                    <div style={{ 
                      marginTop: '8px', 
                      padding: '8px', 
                      backgroundColor: '#f6ffed', 
                      borderRadius: '4px',
                      fontSize: '12px'
                    }}>
                      {suggestion.implementation.results}
                    </div>
                  </div>
                )}
              </Space>
            </Card>
          )}

          {suggestion.additionalNotes && (
            <Card title="Additional Notes" size="small">
              <Text style={{ fontSize: '12px' }}>
                {suggestion.additionalNotes}
              </Text>
            </Card>
          )}
        </Col>
      </Row>
    </div>
  );
};

export default SuggestionDetails;