import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Card, 
  Row, 
  Col, 
  Typography, 
  Button,
  Alert,
  Spin,
  Tag,
  Space,
  Descriptions,
  Timeline,
  Divider,
  Steps,
  Image,
  message,
  Empty
} from 'antd';
import { 
  ArrowLeftOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  UserOutlined,
  ToolOutlined,
  WarningOutlined,
  FileTextOutlined,
  ReloadOutlined,
  FileImageOutlined,
  FilePdfOutlined,
  FileWordOutlined,
  DownloadOutlined,
  DeleteOutlined,
  EditOutlined
} from '@ant-design/icons';
import { useSelector } from 'react-redux';
import { itSupportAPI } from '../../services/api';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const { Title, Text, Paragraph } = Typography;

const EmployeeITRequestDetails = () => {
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  
  const navigate = useNavigate();
  const { requestId } = useParams();
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    if (requestId) {
      fetchRequestDetails();
    }
  }, [requestId]);

  const fetchRequestDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('Fetching IT request details for:', requestId);
      const response = await itSupportAPI.getRequestById(requestId);
      
      if (response?.success && response?.data) {
        setRequest(response.data);
      } else {
        setError('Failed to load request details');
      }
    } catch (error) {
      console.error('Error fetching request details:', error);
      setError(error.response?.data?.message || 'Failed to fetch request details');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      const response = await itSupportAPI.deleteRequest(requestId);
      if (response.success) {
        message.success('Request deleted successfully');
        navigate('/employee/it-support');
      }
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to delete request');
    }
  };

  const getStatusTag = (status) => {
    const statusMap = {
      'draft': { color: 'default', icon: <EditOutlined />, text: 'Draft' },
      'pending_supervisor': { color: 'blue', icon: <ClockCircleOutlined />, text: 'Pending Supervisor' },
      'pending_departmental_head': { color: 'blue', icon: <ClockCircleOutlined />, text: 'Pending Dept Head' },
      'pending_head_of_business': { color: 'blue', icon: <ClockCircleOutlined />, text: 'Pending President' },
      'pending_it_approval': { color: 'blue', icon: <ClockCircleOutlined />, text: 'Pending IT Approval' },
      'supervisor_rejected': { color: 'red', icon: <CloseCircleOutlined />, text: 'Rejected by Supervisor' },
      'it_approved': { color: 'green', icon: <CheckCircleOutlined />, text: 'IT Approved' },
      'it_rejected': { color: 'red', icon: <CloseCircleOutlined />, text: 'IT Rejected' },
      'it_assigned': { color: 'cyan', icon: <UserOutlined />, text: 'Assigned to Technician' },
      'in_progress': { color: 'processing', icon: <ToolOutlined />, text: 'In Progress' },
      'waiting_parts': { color: 'warning', icon: <ClockCircleOutlined />, text: 'Waiting for Parts' },
      'resolved': { color: 'success', icon: <CheckCircleOutlined />, text: 'Resolved' },
      'closed': { color: 'default', icon: <CheckCircleOutlined />, text: 'Closed' }
    };

    const info = statusMap[status] || { color: 'default', icon: <ClockCircleOutlined />, text: status };
    return <Tag color={info.color} icon={info.icon}>{info.text}</Tag>;
  };

  const getPriorityTag = (priority) => {
    const priorityMap = {
      'critical': { color: 'red', text: 'Critical', icon: '🚨' },
      'high': { color: 'orange', text: 'High', icon: '🔥' },
      'medium': { color: 'yellow', text: 'Medium', icon: '⚡' },
      'low': { color: 'green', text: 'Low', icon: '📝' }
    };
    const info = priorityMap[priority] || { color: 'default', text: priority || 'N/A', icon: '📋' };
    return <Tag color={info.color}>{info.icon} {info.text}</Tag>;
  };

  const getFileIcon = (attachment) => {
    const isImage = attachment.mimetype?.startsWith('image/');
    const isPdf = attachment.mimetype === 'application/pdf';
    const isDoc = attachment.mimetype?.includes('word');
    
    if (isImage) return <FileImageOutlined style={{ fontSize: '32px', color: '#52c41a' }} />;
    if (isPdf) return <FilePdfOutlined style={{ fontSize: '32px', color: '#ff4d4f' }} />;
    if (isDoc) return <FileWordOutlined style={{ fontSize: '32px', color: '#1890ff' }} />;
    return <FileTextOutlined style={{ fontSize: '32px', color: '#8c8c8c' }} />;
  };

  const handleDownload = (attachment) => {
    const downloadUrl = `${process.env.REACT_APP_API_URL}/it-support/download/${request._id}/${attachment.publicId}`;
    window.open(downloadUrl, '_blank');
  };

  const handlePreview = (attachment) => {
    if (attachment.mimetype?.startsWith('image/')) {
      setPreviewImage(`${process.env.REACT_APP_API_URL}/it-support/download/${request._id}/${attachment.publicId}`);
      setPreviewVisible(true);
    }
  };

  const canEdit = () => {
    return request?.status === 'draft' && request?.employee?._id === user.userId;
  };

  const canDelete = () => {
    return request?.status === 'draft' && request?.employee?._id === user.userId;
  };

  if (loading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Spin size="large" />
        <div style={{ marginTop: '16px' }}>Loading request details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '24px' }}>
        <Alert
          message="Error Loading Request"
          description={error}
          type="error"
          showIcon
          action={
            <Button onClick={fetchRequestDetails}>
              Retry
            </Button>
          }
        />
      </div>
    );
  }

  if (!request) {
    return (
      <div style={{ padding: '24px' }}>
        <Alert
          message="Request Not Found"
          description="The requested IT support request could not be found."
          type="warning"
          showIcon
        />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <Button 
          icon={<ArrowLeftOutlined />} 
          onClick={() => navigate('/employee/it-support')}
          style={{ marginBottom: '16px' }}
        >
          Back to My Requests
        </Button>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <Title level={2} style={{ margin: 0 }}>
              <FileTextOutlined /> IT Request Details
            </Title>
            <Text type="secondary">Ticket: {request.ticketNumber}</Text>
          </div>
          <Space>
            <Button 
              icon={<ReloadOutlined />}
              onClick={fetchRequestDetails}
              loading={loading}
            >
              Refresh
            </Button>
            {canEdit() && (
              <Button 
                type="default"
                icon={<EditOutlined />}
                onClick={() => navigate(`/employee/it-support/edit/${request._id}`)}
              >
                Edit
              </Button>
            )}
            {canDelete() && (
              <Button 
                danger
                icon={<DeleteOutlined />}
                onClick={handleDelete}
              >
                Delete
              </Button>
            )}
          </Space>
        </div>
      </div>

      {/* Status Info */}
      {request.status === 'supervisor_rejected' && (
        <Alert
          message="Request Rejected"
          description="Your request has been rejected by your supervisor. Please review the comments below."
          type="error"
          showIcon
          style={{ marginBottom: '24px' }}
        />
      )}

      {request.status === 'it_rejected' && (
        <Alert
          message="IT Department Rejection"
          description="Your request has been rejected by the IT department. Please review the technical assessment below."
          type="error"
          showIcon
          style={{ marginBottom: '24px' }}
        />
      )}

      {request.status === 'resolved' && (
        <Alert
          message="Request Resolved"
          description="Your IT request has been successfully resolved. Please verify the solution and confirm."
          type="success"
          showIcon
          style={{ marginBottom: '24px' }}
        />
      )}

      <Row gutter={[16, 16]}>
        {/* Left Column - Request Details */}
        <Col xs={24} lg={16}>
          {/* Basic Information */}
          <Card title="Request Information" style={{ marginBottom: '16px' }}>
            <Descriptions column={1} bordered>
              <Descriptions.Item label="Status">
                {getStatusTag(request.status)}
              </Descriptions.Item>
              <Descriptions.Item label="Priority">
                {getPriorityTag(request.priority)}
              </Descriptions.Item>
              <Descriptions.Item label="Type">
                {request.requestType === 'material_request' ? '🛒 Material Request' : '🔧 Technical Issue'}
              </Descriptions.Item>
              <Descriptions.Item label="Category">
                <Tag>{request.category}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Subcategory">
                {request.subcategory || 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label="Title">
                <Text strong>{request.title}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Description">
                <Paragraph>{request.description}</Paragraph>
              </Descriptions.Item>
              {request.businessJustification && (
                <Descriptions.Item label="Business Justification">
                  <Paragraph>{request.businessJustification}</Paragraph>
                </Descriptions.Item>
              )}
              {request.businessImpact && (
                <Descriptions.Item label="Business Impact">
                  <Paragraph>{request.businessImpact}</Paragraph>
                </Descriptions.Item>
              )}
              <Descriptions.Item label="Location">
                {request.location || 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label="Submitted">
                {dayjs(request.createdAt).format('MMM DD, YYYY HH:mm')}
                <Text type="secondary"> ({dayjs(request.createdAt).fromNow()})</Text>
              </Descriptions.Item>
            </Descriptions>
          </Card>

          {/* Requested Items (if material request) */}
          {request.requestType === 'material_request' && request.requestedItems?.length > 0 && (
            <Card title="Requested Items" style={{ marginBottom: '16px' }}>
              {request.requestedItems.map((item, index) => (
                <Card key={index} size="small" style={{ marginBottom: '8px' }}>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Text strong>Item:</Text> {item.item}
                    </Col>
                    <Col span={6}>
                      <Text strong>Quantity:</Text> {item.quantity}
                    </Col>
                    <Col span={6}>
                      <Text strong>Est. Cost:</Text> {item.estimatedCost?.toLocaleString()} XAF
                    </Col>
                  </Row>
                  {item.brand && (
                    <div style={{ marginTop: '4px' }}>
                      <Text strong>Brand:</Text> {item.brand} {item.model && `- ${item.model}`}
                    </div>
                  )}
                  {item.specifications && (
                    <div style={{ marginTop: '4px' }}>
                      <Text strong>Specifications:</Text> {item.specifications}
                    </div>
                  )}
                  {item.justification && (
                    <div style={{ marginTop: '4px' }}>
                      <Text strong>Justification:</Text> {item.justification}
                    </div>
                  )}
                </Card>
              ))}
              <Divider />
              <Text strong>Total Estimated Cost: </Text>
              <Text style={{ fontSize: '18px', color: '#1890ff' }}>
                {request.totalEstimatedCost?.toLocaleString()} XAF
              </Text>
            </Card>
          )}

          {/* Device Details (if technical issue) */}
          {request.requestType === 'technical_issue' && request.deviceDetails && (
            <Card title="Device Information" style={{ marginBottom: '16px' }}>
              <Descriptions column={2} bordered>
                <Descriptions.Item label="Device Type">
                  {request.deviceDetails.deviceType || 'N/A'}
                </Descriptions.Item>
                <Descriptions.Item label="Brand">
                  {request.deviceDetails.brand || 'N/A'}
                </Descriptions.Item>
                <Descriptions.Item label="Model">
                  {request.deviceDetails.model || 'N/A'}
                </Descriptions.Item>
                <Descriptions.Item label="Serial Number">
                  {request.deviceDetails.serialNumber || 'N/A'}
                </Descriptions.Item>
                <Descriptions.Item label="Operating System" span={2}>
                  {request.deviceDetails.operatingSystem || 'N/A'}
                </Descriptions.Item>
              </Descriptions>
            </Card>
          )}

          {/* Issue Details (if technical issue) */}
          {request.requestType === 'technical_issue' && request.issueDetails && (
            <Card title="Issue Details" style={{ marginBottom: '16px' }}>
              <Descriptions column={2} bordered>
                {request.issueDetails.firstOccurred && (
                  <Descriptions.Item label="First Occurred" span={2}>
                    {dayjs(request.issueDetails.firstOccurred).format('MMM DD, YYYY HH:mm')}
                  </Descriptions.Item>
                )}
                {request.issueDetails.frequency && (
                  <Descriptions.Item label="Frequency">
                    {request.issueDetails.frequency}
                  </Descriptions.Item>
                )}
                {request.issueDetails.affectedUsers && (
                  <Descriptions.Item label="Affected Users">
                    {request.issueDetails.affectedUsers.replace('_', ' ')}
                  </Descriptions.Item>
                )}
                {request.issueDetails.workaroundAvailable && (
                  <Descriptions.Item label="Workaround Available" span={2}>
                    <Tag color={request.issueDetails.workaroundAvailable === 'yes' ? 'green' : 'red'}>
                      {request.issueDetails.workaroundAvailable.toUpperCase()}
                    </Tag>
                    {request.issueDetails.workaroundDescription && (
                      <div style={{ marginTop: '8px' }}>
                        {request.issueDetails.workaroundDescription}
                      </div>
                    )}
                  </Descriptions.Item>
                )}
                {request.issueDetails.errorMessages && (
                  <Descriptions.Item label="Error Messages" span={2}>
                    <pre style={{ 
                      backgroundColor: '#f5f5f5', 
                      padding: '8px', 
                      borderRadius: '4px',
                      overflow: 'auto'
                    }}>
                      {request.issueDetails.errorMessages}
                    </pre>
                  </Descriptions.Item>
                )}
                {request.issueDetails.stepsToReproduce && (
                  <Descriptions.Item label="Steps to Reproduce" span={2}>
                    <Paragraph>{request.issueDetails.stepsToReproduce}</Paragraph>
                  </Descriptions.Item>
                )}
              </Descriptions>
            </Card>
          )}

          {/* Troubleshooting Steps */}
          {request.troubleshootingAttempted && request.troubleshootingSteps?.length > 0 && (
            <Card title="Troubleshooting Steps Attempted" style={{ marginBottom: '16px' }}>
              <ul>
                {request.troubleshootingSteps.map((step, index) => (
                  <li key={index}>{step}</li>
                ))}
              </ul>
            </Card>
          )}

          {/* Attachments Section */}
          {request.attachments && request.attachments.length > 0 && (
            <Card 
              title={
                <Space>
                  <FileImageOutlined />
                  Attachments ({request.attachments.length})
                </Space>
              } 
              style={{ marginBottom: '16px' }}
            >
              <Row gutter={[16, 16]}>
                {request.attachments.map((attachment, index) => {
                  const isImage = attachment.mimetype?.startsWith('image/');
                  
                  return (
                    <Col xs={24} sm={12} md={8} key={index}>
                      <Card
                        size="small"
                        hoverable
                        style={{ textAlign: 'center' }}
                        cover={
                          isImage ? (
                            <div style={{ 
                              height: '150px', 
                              overflow: 'hidden',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              backgroundColor: '#f5f5f5',
                              cursor: 'pointer'
                            }}
                            onClick={() => handlePreview(attachment)}
                            >
                              <img
                                src={`${process.env.REACT_APP_API_URL}/it-support/download/${request._id}/${attachment.publicId}`}
                                alt={attachment.name}
                                style={{ 
                                  maxWidth: '100%',
                                  maxHeight: '150px',
                                  objectFit: 'contain'
                                }}
                              />
                            </div>
                          ) : (
                            <div style={{ 
                              height: '150px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              backgroundColor: '#fafafa'
                            }}>
                              {getFileIcon(attachment)}
                            </div>
                          )
                        }
                        actions={[
                          isImage && (
                            <Button
                              type="link"
                              icon={<FileImageOutlined />}
                              onClick={() => handlePreview(attachment)}
                            >
                              Preview
                            </Button>
                          ),
                          <Button
                            type="link"
                            icon={<DownloadOutlined />}
                            onClick={() => handleDownload(attachment)}
                          >
                            Download
                          </Button>
                        ].filter(Boolean)}
                      >
                        <Card.Meta
                          title={
                            <Text 
                              ellipsis={{ tooltip: attachment.name }}
                              style={{ fontSize: '13px' }}
                            >
                              {attachment.name}
                            </Text>
                          }
                          description={
                            <Text type="secondary" style={{ fontSize: '11px' }}>
                              {(attachment.size / 1024).toFixed(2)} KB
                            </Text>
                          }
                        />
                      </Card>
                    </Col>
                  );
                })}
              </Row>
            </Card>
          )}

          {/* IT Review (if available) */}
          {request.itReview && request.itReview.decision && (
            <Card title="IT Department Review" style={{ marginBottom: '16px' }}>
              <Descriptions column={2} bordered>
                <Descriptions.Item label="Decision">
                  <Tag color={request.itReview.decision === 'approve' ? 'green' : 'red'}>
                    {request.itReview.decision.toUpperCase()}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Review Date">
                  {dayjs(request.itReview.reviewDate).format('MMM DD, YYYY HH:mm')}
                </Descriptions.Item>
                {request.itReview.estimatedCost > 0 && (
                  <Descriptions.Item label="Estimated Cost">
                    {request.itReview.estimatedCost?.toLocaleString()} XAF
                  </Descriptions.Item>
                )}
                {request.itReview.estimatedCompletionTime && (
                  <Descriptions.Item label="Est. Completion Time">
                    {request.itReview.estimatedCompletionTime}
                  </Descriptions.Item>
                )}
                {request.itReview.comments && (
                  <Descriptions.Item label="IT Comments" span={2}>
                    <Paragraph>{request.itReview.comments}</Paragraph>
                  </Descriptions.Item>
                )}
              </Descriptions>
            </Card>
          )}

          {/* Resolution (if resolved) */}
          {request.resolution && request.resolution.description && (
            <Card title="Resolution" style={{ marginBottom: '16px' }}>
              <Descriptions column={1} bordered>
                <Descriptions.Item label="Resolved By">
                  {request.resolution.resolvedBy}
                </Descriptions.Item>
                <Descriptions.Item label="Resolved Date">
                  {dayjs(request.resolution.resolvedDate).format('MMM DD, YYYY HH:mm')}
                </Descriptions.Item>
                <Descriptions.Item label="Solution">
                  <Paragraph>{request.resolution.description}</Paragraph>
                </Descriptions.Item>
              </Descriptions>
            </Card>
          )}
        </Col>

        {/* Right Column - Approval Chain & Timeline */}
        <Col xs={24} lg={8}>
          {/* Approval Chain */}
          <Card title="Approval Chain" style={{ marginBottom: '16px' }}>
            {request.approvalChain && request.approvalChain.length > 0 ? (
              <Steps
                direction="vertical"
                size="small"
                current={request.approvalChain.findIndex(step => step.status === 'pending')}
              >
                {request.approvalChain.map((step, index) => {
                  const stepStatus = 
                    step.status === 'approved' ? 'finish' :
                    step.status === 'rejected' ? 'error' :
                    step.status === 'pending' ? 'process' : 'wait';

                  return (
                    <Steps.Step
                      key={index}
                      status={stepStatus}
                      title={step.approver?.role || 'Unknown'}
                      description={
                        <div>
                          <div><Text strong>{step.approver?.name || 'Unknown'}</Text></div>
                          <div><Text type="secondary" style={{ fontSize: '12px' }}>{step.approver?.email}</Text></div>
                          {step.status !== 'pending' && (
                            <>
                              <div style={{ marginTop: '4px' }}>
                                <Tag color={step.status === 'approved' ? 'green' : 'red'} size="small">
                                  {step.status}
                                </Tag>
                              </div>
                              {step.actionDate && (
                                <div style={{ fontSize: '11px', color: '#999' }}>
                                  {dayjs(step.actionDate).format('MMM DD, HH:mm')}
                                </div>
                              )}
                              {step.comments && (
                                <div style={{ 
                                  marginTop: '4px', 
                                  fontSize: '12px',
                                  padding: '4px 8px',
                                  backgroundColor: '#f5f5f5',
                                  borderRadius: '4px'
                                }}>
                                  "{step.comments}"
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      }
                      icon={
                        step.status === 'approved' ? <CheckCircleOutlined /> :
                        step.status === 'rejected' ? <CloseCircleOutlined /> :
                        step.status === 'pending' ? <ClockCircleOutlined /> :
                        <UserOutlined />
                      }
                    />
                  );
                })}
              </Steps>
            ) : (
              <Empty description="No approval chain" />
            )}
          </Card>

          {/* Activity Timeline */}
          <Card title="Activity Timeline">
            <Timeline>
              <Timeline.Item color="blue">
                <Text strong>Request Submitted</Text>
                <br />
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  {dayjs(request.createdAt).format('MMM DD, YYYY HH:mm')}
                </Text>
              </Timeline.Item>

              {request.approvalChain?.filter(step => step.status !== 'pending').map((step, index) => (
                <Timeline.Item 
                  key={index}
                  color={step.status === 'approved' ? 'green' : 'red'}
                  dot={step.status === 'approved' ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
                >
                  <Text strong>{step.status === 'approved' ? 'Approved' : 'Rejected'} by {step.approver?.role}</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    {step.approver?.name} • {dayjs(step.actionDate).format('MMM DD, YYYY HH:mm')}
                  </Text>
                  {step.comments && (
                    <div style={{ 
                      marginTop: '4px',
                      padding: '8px',
                      backgroundColor: '#f5f5f5',
                      borderRadius: '4px',
                      fontSize: '12px'
                    }}>
                      "{step.comments}"
                    </div>
                  )}
                </Timeline.Item>
              ))}

              {request.status === 'it_assigned' && (
                <Timeline.Item color="cyan" dot={<UserOutlined />}>
                  <Text strong>Assigned to Technician</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    {request.itReview?.technicianId?.fullName || 'IT Department'}
                  </Text>
                </Timeline.Item>
              )}

              {request.status === 'in_progress' && (
                <Timeline.Item color="processing" dot={<ToolOutlined />}>
                  <Text strong>Work In Progress</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    IT team is working on your request
                  </Text>
                </Timeline.Item>
              )}

              {request.status === 'resolved' && (
                <Timeline.Item color="green" dot={<CheckCircleOutlined />}>
                  <Text strong>Request Resolved</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    {request.resolution?.resolvedDate && dayjs(request.resolution.resolvedDate).format('MMM DD, YYYY HH:mm')}
                  </Text>
                </Timeline.Item>
              )}
            </Timeline>
          </Card>
        </Col>
      </Row>

      {/* Image Preview Modal */}
      <Image
        style={{ display: 'none' }}
        preview={{
          visible: previewVisible,
          src: previewImage,
          onVisibleChange: (visible) => setPreviewVisible(visible),
        }}
      />
    </div>
  );
};

export default EmployeeITRequestDetails;