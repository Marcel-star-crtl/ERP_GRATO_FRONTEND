import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Card,
  Row,
  Col,
  Button,
  Space,
  Tag,
  Typography,
  Descriptions,
  Divider,
  Progress,
  Statistic,
  Table,
  message,
  Spin,
  Alert,
  Modal,
  List,
  Badge
} from 'antd';
import {
  ArrowLeftOutlined,
  EditOutlined,
  DeleteOutlined,
  SendOutlined,
  DownloadOutlined,
  EyeOutlined,
  MailOutlined,
  TeamOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  FileOutlined,
  BarChartOutlined
} from '@ant-design/icons';
import api from '../../services/api';
import moment from 'moment';

const { Title, Text, Paragraph } = Typography;

const CommunicationDetail = ({ readonly = false }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  
  const [loading, setLoading] = useState(true);
  const [communication, setCommunication] = useState(null);
  const [readStats, setReadStats] = useState(null);
  const [sendLoading, setSendLoading] = useState(false);

  useEffect(() => {
    fetchCommunicationDetail();
  }, [id]);

  const fetchCommunicationDetail = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/communications/${id}`);
      setCommunication(response.data.data);
      setReadStats(response.data.data.readStats);
    } catch (error) {
      console.error('Error fetching communication:', error);
      message.error('Failed to load communication details');
      navigate(-1);
    } finally {
      setLoading(false);
    }
  };

  const handleSendNow = () => {
    Modal.confirm({
      title: 'Send Communication Now',
      content: `This will send the message to ${communication.recipients.totalCount} recipients. Continue?`,
      okText: 'Send Now',
      okType: 'primary',
      onOk: async () => {
        try {
          setSendLoading(true);
          await api.post(`/communications/${id}/send`);
          message.success('Message is being sent in the background!');
          setTimeout(() => {
            fetchCommunicationDetail();
          }, 2000);
        } catch (error) {
          message.error(error.response?.data?.message || 'Failed to send message');
        } finally {
          setSendLoading(false);
        }
      }
    });
  };

  const handleDelete = () => {
    Modal.confirm({
      title: 'Delete Communication',
      content: 'Are you sure you want to delete this communication? This action cannot be undone.',
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          await api.delete(`/communications/${id}`);
          message.success('Communication deleted');
          navigate(-1);
        } catch (error) {
          message.error(error.response?.data?.message || 'Failed to delete');
        }
      }
    });
  };

  const downloadAttachment = async (attachmentId, filename) => {
    try {
      const response = await api.get(`/communications/${id}/attachment/${attachmentId}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      message.error('Failed to download attachment');
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!communication) {
    return (
      <div style={{ padding: '24px' }}>
        <Alert
          message="Communication not found"
          type="error"
          showIcon
        />
      </div>
    );
  }

  const canEdit = communication.status !== 'sent' && !readonly;
  const canDelete = (communication.status !== 'sent' || user.role === 'admin') && !readonly;
  const canSend = communication.status === 'draft' && !readonly;

  const statusConfig = {
    draft: { color: 'default', icon: <EditOutlined />, text: 'Draft' },
    scheduled: { color: 'blue', icon: <ClockCircleOutlined />, text: 'Scheduled' },
    sending: { color: 'processing', icon: <SendOutlined />, text: 'Sending...' },
    sent: { color: 'success', icon: <CheckCircleOutlined />, text: 'Sent' },
    failed: { color: 'error', icon: <CloseCircleOutlined />, text: 'Failed' }
  };

  const priorityConfig = {
    urgent: { color: 'red', icon: '🚨' },
    important: { color: 'orange', icon: '⚠️' },
    normal: { color: 'default', icon: '' }
  };

  const typeConfig = {
    announcement: { color: 'blue', icon: '📢' },
    policy: { color: 'purple', icon: '📋' },
    emergency: { color: 'red', icon: '🚨' },
    newsletter: { color: 'green', icon: '📰' },
    general: { color: 'default', icon: 'ℹ️' },
    training: { color: 'orange', icon: '🎓' },
    event: { color: 'cyan', icon: '📅' }
  };

  const readRate = communication.recipients.totalCount > 0
    ? ((communication.deliveryStats.readCount / communication.recipients.totalCount) * 100).toFixed(1)
    : 0;

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <Card style={{ marginBottom: '24px' }}>
        <Row align="middle" justify="space-between">
          <Col>
            <Space>
              <Button 
                icon={<ArrowLeftOutlined />}
                onClick={() => navigate(-1)}
              >
                Back
              </Button>
              <Title level={3} style={{ margin: 0 }}>
                Communication Details
              </Title>
            </Space>
          </Col>
          <Col>
            <Space>
              {canSend && (
                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  onClick={handleSendNow}
                  loading={sendLoading}
                >
                  Send Now
                </Button>
              )}
              {canEdit && (
                <Button
                  icon={<EditOutlined />}
                  onClick={() => navigate(`${window.location.pathname}/edit`)}
                >
                  Edit
                </Button>
              )}
              {canDelete && (
                <Button
                  danger
                  icon={<DeleteOutlined />}
                  onClick={handleDelete}
                >
                  Delete
                </Button>
              )}
            </Space>
          </Col>
        </Row>
      </Card>

      <Row gutter={24}>
        {/* Main Content */}
        <Col xs={24} lg={16}>
          {/* Basic Info */}
          <Card 
            title={communication.title}
            extra={
              <Space>
                <Tag 
                  color={statusConfig[communication.status].color}
                  icon={statusConfig[communication.status].icon}
                >
                  {statusConfig[communication.status].text}
                </Tag>
              </Space>
            }
            style={{ marginBottom: '24px' }}
          >
            <Space size="middle" style={{ marginBottom: '16px' }}>
              <Tag color={typeConfig[communication.messageType].color}>
                {typeConfig[communication.messageType].icon} {communication.messageType}
              </Tag>
              <Tag color={priorityConfig[communication.priority].color}>
                {priorityConfig[communication.priority].icon} {communication.priority}
              </Tag>
              <Text type="secondary">
                ID: COM-{communication._id.slice(-6).toUpperCase()}
              </Text>
            </Space>

            <Divider />

            {/* Message Content */}
            <div 
              style={{ 
                padding: '16px',
                background: '#fafafa',
                borderRadius: '8px',
                marginBottom: '16px'
              }}
              dangerouslySetInnerHTML={{ __html: communication.content }}
            />

            {/* Attachments */}
            {communication.attachments && communication.attachments.length > 0 && (
              <>
                <Divider />
                <div>
                  <Text strong style={{ marginBottom: '12px', display: 'block' }}>
                    <FileOutlined /> Attachments ({communication.attachments.length})
                  </Text>
                  <List
                    dataSource={communication.attachments}
                    renderItem={(attachment) => (
                      <List.Item
                        actions={[
                          <Button
                            type="link"
                            icon={<DownloadOutlined />}
                            onClick={() => downloadAttachment(attachment._id, attachment.originalName || attachment.filename)}
                          >
                            Download
                          </Button>
                        ]}
                      >
                        <List.Item.Meta
                          avatar={<FileOutlined style={{ fontSize: '24px' }} />}
                          title={attachment.originalName || attachment.filename}
                          description={`${(attachment.size / 1024).toFixed(2)} KB • ${attachment.mimetype}`}
                        />
                      </List.Item>
                    )}
                  />
                </div>
              </>
            )}

            {/* Metadata */}
            <Divider />
            <Descriptions column={2} size="small">
              <Descriptions.Item label="Created By">
                {communication.sender?.fullName}
              </Descriptions.Item>
              <Descriptions.Item label="Created At">
                {moment(communication.createdAt).format('YYYY-MM-DD HH:mm')}
              </Descriptions.Item>
              {communication.scheduledFor && (
                <Descriptions.Item label="Scheduled For">
                  {moment(communication.scheduledFor).format('YYYY-MM-DD HH:mm')}
                </Descriptions.Item>
              )}
              {communication.sentAt && (
                <Descriptions.Item label="Sent At">
                  {moment(communication.sentAt).format('YYYY-MM-DD HH:mm')}
                </Descriptions.Item>
              )}
              {communication.tags && communication.tags.length > 0 && (
                <Descriptions.Item label="Tags" span={2}>
                  <Space wrap>
                    {communication.tags.map((tag, idx) => (
                      <Tag key={idx}>{tag}</Tag>
                    ))}
                  </Space>
                </Descriptions.Item>
              )}
            </Descriptions>
          </Card>
        </Col>

        {/* Sidebar */}
        <Col xs={24} lg={8}>
          {/* Recipients Card */}
          <Card 
            title={
              <>
                <TeamOutlined /> Recipients
              </>
            }
            style={{ marginBottom: '24px' }}
          >
            <Statistic
              title="Total Recipients"
              value={communication.recipients.totalCount}
              valueStyle={{ color: '#1890ff' }}
            />
            
            <Divider />
            
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Target Type">
                <Tag>{communication.recipients.targetType}</Tag>
              </Descriptions.Item>
              
              {communication.recipients.departments?.length > 0 && (
                <Descriptions.Item label="Departments">
                  <Space wrap>
                    {communication.recipients.departments.map((dept, idx) => (
                      <Tag key={idx} color="blue">{dept}</Tag>
                    ))}
                  </Space>
                </Descriptions.Item>
              )}
              
              {communication.recipients.roles?.length > 0 && (
                <Descriptions.Item label="Roles">
                  <Space wrap>
                    {communication.recipients.roles.map((role, idx) => (
                      <Tag key={idx} color="purple">{role}</Tag>
                    ))}
                  </Space>
                </Descriptions.Item>
              )}
            </Descriptions>
          </Card>

          {/* Delivery Method Card */}
          <Card 
            title="Delivery Method"
            style={{ marginBottom: '24px' }}
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <MailOutlined style={{ marginRight: '8px', color: communication.deliveryMethod.email ? '#52c41a' : '#d9d9d9' }} />
                <Text>Email: </Text>
                <Tag color={communication.deliveryMethod.email ? 'success' : 'default'}>
                  {communication.deliveryMethod.email ? 'Enabled' : 'Disabled'}
                </Tag>
              </div>
              <div>
                <CheckCircleOutlined style={{ marginRight: '8px', color: communication.deliveryMethod.inApp ? '#52c41a' : '#d9d9d9' }} />
                <Text>In-App: </Text>
                <Tag color={communication.deliveryMethod.inApp ? 'success' : 'default'}>
                  {communication.deliveryMethod.inApp ? 'Enabled' : 'Disabled'}
                </Tag>
              </div>
            </Space>
          </Card>

          {/* Delivery Statistics (for sent messages) */}
          {communication.status === 'sent' && (
            <Card 
              title={
                <>
                  <BarChartOutlined /> Delivery Statistics
                </>
              }
              style={{ marginBottom: '24px' }}
            >
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Statistic
                    title="Emails Sent"
                    value={communication.deliveryStats.emailsSent}
                    prefix={<CheckCircleOutlined />}
                    valueStyle={{ color: '#52c41a', fontSize: '20px' }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="Emails Failed"
                    value={communication.deliveryStats.emailsFailed}
                    prefix={<CloseCircleOutlined />}
                    valueStyle={{ color: '#ff4d4f', fontSize: '20px' }}
                  />
                </Col>
                <Col span={24}>
                  <Divider style={{ margin: '12px 0' }} />
                  <div>
                    <Text strong>Read Rate</Text>
                    <Progress 
                      percent={parseFloat(readRate)}
                      status={
                        readRate > 70 ? 'success' :
                        readRate > 40 ? 'normal' : 'exception'
                      }
                      format={() => `${communication.deliveryStats.readCount}/${communication.recipients.totalCount}`}
                    />
                  </div>
                </Col>
                <Col span={12}>
                  <Statistic
                    title="Total Reads"
                    value={communication.deliveryStats.readCount}
                    prefix={<EyeOutlined />}
                    valueStyle={{ fontSize: '18px' }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="Link Clicks"
                    value={communication.deliveryStats.clickCount}
                    valueStyle={{ fontSize: '18px' }}
                  />
                </Col>
              </Row>
              
              <Divider />
              
              <Text type="secondary" style={{ fontSize: '12px' }}>
                Last updated: {moment(communication.deliveryStats.lastUpdated).format('YYYY-MM-DD HH:mm')}
              </Text>
            </Card>
          )}
        </Col>
      </Row>
    </div>
  );
};

export default CommunicationDetail;