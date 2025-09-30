import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Typography,
  Tag,
  Space,
  Tabs,
  Alert,
  Descriptions,
  Progress,
  message,
  Radio,
  Row,
  Col,
  Statistic,
  Spin,
  notification,
  Tooltip,
  Divider,
  Select,
  Badge
} from 'antd';
import {
  SafetyCertificateOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  UserOutlined,
  CalendarOutlined,
  EnvironmentOutlined,
  AuditOutlined,
  EyeOutlined,
  ReloadOutlined,
  EditOutlined,
  FileTextOutlined,
  MedicineBoxOutlined,
  WarningOutlined,
  TeamOutlined,
  SendOutlined,
  FileOutlined,
  HistoryOutlined
} from '@ant-design/icons';
import { incidentReportsAPI } from '../../services/incidentReportAPI';

const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { TextArea } = Input;

const SupervisorIncidentReports = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useSelector((state) => state.auth);
  
  // Auto-review from email link
  const autoReviewId = searchParams.get('review');
  const autoAcceptId = searchParams.get('accept');
  
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [activeTab, setActiveTab] = useState('pending');
  const [stats, setStats] = useState({
    pending: 0,
    reviewed: 0,
    escalated: 0,
    closed: 0,
    total: 0
  });
  const [form] = Form.useForm();

  // Fetch incident reports for supervisor review
  const fetchIncidentReports = useCallback(async () => {
    try {
      setLoading(true);
      
      console.log('Fetching incident reports for supervisor:', user?.email);
      
      const response = await incidentReportsAPI.getSupervisorReports();
      
      if (response.success) {
        setReports(response.data || []);
        
        // Calculate stats
        const allReports = response.data || [];
        const pending = allReports.filter(r => r.status === 'pending_supervisor').length;
        const reviewed = allReports.filter(r => r.status === 'supervisor_reviewed').length;
        const escalated = allReports.filter(r => r.status === 'escalated').length;
        const closed = allReports.filter(r => r.status === 'resolved').length;

        setStats({
          pending,
          reviewed,
          escalated,
          closed,
          total: allReports.length
        });

        console.log('Stats calculated:', { pending, reviewed, escalated, closed, total: allReports.length });
      } else {
        throw new Error(response.message || 'Failed to fetch reports');
      }
    } catch (error) {
      console.error('Error fetching incident reports:', error);
      
      let errorMessage = 'Failed to fetch incident reports';
      if (error.response?.status === 401) {
        errorMessage = 'Your session has expired. Please log in again.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      message.error(errorMessage);
      setReports([]);
    } finally {
      setLoading(false);
    }
  }, [user?.email]);

  useEffect(() => {
    if (user?.email) {
      fetchIncidentReports();
    }
  }, [fetchIncidentReports, user?.email]);

  // Handle auto-review from email links
  useEffect(() => {
    const handleAutoAction = async () => {
      if (autoReviewId || autoAcceptId) {
        const reportId = autoReviewId || autoAcceptId;
        try {
          // Find the report in our data
          const report = reports.find(r => r._id === reportId);
          if (report) {
            setSelectedReport(report);
            setReviewModalVisible(true);
            if (autoAcceptId) {
              form.setFieldsValue({ decision: 'approved' });
            }
          } else {
            message.error('Failed to load incident report');
          }
        } catch (error) {
          message.error('Failed to load incident report for review');
        }
      }
    };

    if (reports.length > 0 && (autoReviewId || autoAcceptId)) {
      handleAutoAction();
    }
  }, [autoReviewId, autoAcceptId, reports, form]);

  // Handle supervisor review decision
  const handleReviewDecision = async (values) => {
    if (!selectedReport) return;

    try {
      setLoading(true);
      
      const payload = {
        decision: values.decision,
        comments: values.comments,
        actionsTaken: values.actionsTaken,
        followUpRequired: values.followUpRequired || false,
        followUpDate: values.followUpDate,
        escalationReason: values.escalationReason
      };

      console.log('Submitting supervisor review:', payload);

      const response = await incidentReportsAPI.processSupervisorDecision(selectedReport._id, payload);

      if (response.success) {
        const actionText = {
          'approved': 'approved and will be processed',
          'requires_investigation': 'marked for further investigation',
          'escalated': 'escalated to higher management',
          'rejected': 'rejected with comments'
        }[values.decision] || 'processed';

        message.success(`Incident report ${actionText} successfully`);
        
        setReviewModalVisible(false);
        form.resetFields();
        setSelectedReport(null);
        
        // Refresh data
        await fetchIncidentReports();
        
        // Show success notification
        notification.success({
          message: 'Supervisor Review Completed',
          description: `Incident report ${selectedReport.reportNumber} has been ${actionText}. All stakeholders have been notified via email.`,
          duration: 4
        });
      } else {
        throw new Error(response.message || 'Failed to process review');
      }
    } catch (error) {
      console.error('Review decision error:', error);
      
      let errorMessage = 'Failed to process review decision';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (report) => {
    try {
      // Fetch full details if needed
      const response = await incidentReportsAPI.getReportById(report._id);
      if (response.success) {
        setSelectedReport(response.data);
      } else {
        setSelectedReport(report);
      }
    } catch (error) {
      console.error('Error fetching report details:', error);
      setSelectedReport(report);
    }
    setDetailsModalVisible(true);
  };

  // Secure file download handler
  const handleDownloadAttachment = async (attachment) => {
    try {
      if (!attachment.publicId && !attachment.url) {
        message.error('No download link available for this attachment');
        return;
      }

      // If no publicId, try direct URL fallback
      if (!attachment.publicId) {
        window.open(attachment.url, '_blank');
        return;
      }

      // Extract the actual public ID from the path (remove folder structure)
      const actualPublicId = attachment.publicId.includes('/') 
        ? attachment.publicId.split('/').pop() 
        : attachment.publicId;

      // Use authenticated download endpoint
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5001/api'}/files/download/${actualPublicId}?filename=${encodeURIComponent(attachment.name)}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to download file');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = attachment.name || 'attachment';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      message.success(`Downloaded ${attachment.name}`);
    } catch (error) {
      console.error('Error downloading attachment:', error);
      
      // Fallback: try direct URL if available
      if (attachment.url) {
        try {
          window.open(attachment.url, '_blank');
          message.info('Opened attachment in new tab');
        } catch (fallbackError) {
          message.error('Failed to download attachment');
        }
      } else {
        message.error('Failed to download attachment');
      }
    }
  };

  const getStatusTag = (status) => {
    const statusMap = {
      'pending_supervisor': { color: 'orange', text: 'Pending Your Review', icon: <ClockCircleOutlined /> },
      'supervisor_reviewed': { color: 'green', text: 'Reviewed', icon: <CheckCircleOutlined /> },
      'escalated': { color: 'red', text: 'Escalated', icon: <ExclamationCircleOutlined /> },
      'under_investigation': { color: 'blue', text: 'Under Investigation', icon: <AuditOutlined /> },
      'resolved': { color: 'purple', text: 'Resolved', icon: <CheckCircleOutlined /> },
      'rejected': { color: 'red', text: 'Rejected', icon: <CloseCircleOutlined /> }
    };

    const config = statusMap[status] || { 
      color: 'default', 
      text: status?.replace('_', ' ') || 'Unknown', 
      icon: null 
    };
    
    return <Tag color={config.color} icon={config.icon}>{config.text}</Tag>;
  };

  const getSeverityTag = (severity) => {
    const severityMap = {
      'critical': { color: 'red', text: 'Critical', icon: '🚨' },
      'high': { color: 'orange', text: 'High', icon: '⚡' },
      'medium': { color: 'yellow', text: 'Medium', icon: '⚠️' },
      'low': { color: 'green', text: 'Low', icon: '📝' }
    };

    const severityInfo = severityMap[severity] || { 
      color: 'default', 
      text: severity, 
      icon: '📋' 
    };

    return (
      <Tag color={severityInfo.color}>
        {severityInfo.icon} {severityInfo.text}
      </Tag>
    );
  };

  const getIncidentTypeTag = (type) => {
    const typeMap = {
      'injury': { color: 'red', text: 'Injury', icon: '🤕' },
      'near_miss': { color: 'orange', text: 'Near Miss', icon: '⚠️' },
      'equipment': { color: 'blue', text: 'Equipment', icon: '🔧' },
      'security': { color: 'purple', text: 'Security', icon: '🔒' },
      'environmental': { color: 'green', text: 'Environmental', icon: '🌍' },
      'fire': { color: 'red', text: 'Fire/Emergency', icon: '🔥' },
      'other': { color: 'gray', text: 'Other', icon: '📋' }
    };

    const typeInfo = typeMap[type] || { 
      color: 'default', 
      text: type, 
      icon: '📋' 
    };

    return (
      <Tag color={typeInfo.color}>
        {typeInfo.icon} {typeInfo.text}
      </Tag>
    );
  };

  const getPriorityTag = (severity, hasInjuries) => {
    let priority = 'medium';
    let color = 'yellow';
    
    if (severity === 'critical' || (severity === 'high' && hasInjuries)) {
      priority = 'high';
      color = 'red';
    } else if (severity === 'high' || hasInjuries) {
      priority = 'medium';
      color = 'orange';
    } else if (severity === 'low') {
      priority = 'low';
      color = 'green';
    }
    
    return <Tag color={color}>{priority.toUpperCase()} Priority</Tag>;
  };

  const getTabCount = (status) => {
    return reports.filter(report => {
      switch (status) {
        case 'pending':
          return report.status === 'pending_supervisor';
        case 'reviewed':
          return ['supervisor_reviewed', 'pending_hr_review'].includes(report.status);
        case 'escalated':
          return report.status === 'escalated';
        case 'closed':
          return report.status === 'resolved';
        default:
          return false;
      }
    }).length;
  };

  const getFilteredReports = () => {
    return reports.filter(report => {
      switch (activeTab) {
        case 'pending':
          return report.status === 'pending_supervisor';
        case 'reviewed':
          return ['supervisor_reviewed', 'pending_hr_review'].includes(report.status);
        case 'escalated':
          return report.status === 'escalated';
        case 'closed':
          return report.status === 'resolved';
        default:
          return true;
      }
    });
  };

  const columns = [
    {
      title: 'Report Number',
      dataIndex: 'reportNumber',
      key: 'reportNumber',
      render: (number) => <Text code>{number}</Text>,
      width: 130
    },
    {
      title: 'Incident Details',
      key: 'incidentDetails',
      render: (_, record) => (
        <div>
          <Text strong>{record.title}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: '12px' }}>
            📍 {record.location}
          </Text>
          <br />
          <Text type="secondary" style={{ fontSize: '11px' }}>
            {new Date(record.incidentDate).toLocaleDateString()}
          </Text>
        </div>
      ),
      width: 250
    },
    {
      title: 'Reporter',
      key: 'reporter',
      render: (_, record) => (
        <div>
          <Text strong>{record.reportedBy?.fullName || 'Unknown'}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.reportedBy?.department || 'N/A'}
          </Text>
          <br />
          <Tag size="small" color="blue">
            {record.reportedBy?.employeeId || 'N/A'}
          </Tag>
        </div>
      ),
      width: 160
    },
    {
      title: 'Type & Severity',
      key: 'typeAndSeverity',
      render: (_, record) => (
        <Space direction="vertical" size="small">
          {getIncidentTypeTag(record.incidentType)}
          {getSeverityTag(record.severity)}
        </Space>
      ),
      width: 130
    },
    {
      title: 'Impact',
      key: 'impact',
      render: (_, record) => (
        <div>
          <div style={{ fontSize: '11px' }}>
            <Text type={record.injuriesReported ? 'danger' : 'secondary'}>
              {record.injuriesReported ? '🤕 Injury' : '✅ No Injury'}
            </Text>
          </div>
          <div style={{ fontSize: '11px' }}>
            <Text type="secondary">Days Lost: {record.workDaysLost || 0}</Text>
          </div>
          {record.investigationRequired && (
            <Tag color="orange" size="small" style={{ marginTop: '4px' }}>
              Investigation Required
            </Tag>
          )}
        </div>
      ),
      width: 120
    },
    {
      title: 'Priority & Status',
      key: 'priorityStatus',
      render: (_, record) => (
        <div>
          {getPriorityTag(record.severity, record.injuriesReported)}
          <div style={{ marginTop: '4px' }}>
            {getStatusTag(record.status)}
          </div>
          {record.status === 'pending_supervisor' && (
            <div style={{ marginTop: 4 }}>
              <Tag color="gold" size="small">Your Turn</Tag>
            </div>
          )}
        </div>
      ),
      width: 160
    },
    {
      title: 'Reported',
      dataIndex: 'reportedDate',
      key: 'reportedDate',
      render: (date) => (
        <div>
          <div style={{ fontSize: '12px' }}>
            {new Date(date).toLocaleDateString('en-GB')}
          </div>
          <div style={{ fontSize: '10px', color: '#666' }}>
            {new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      ),
      sorter: (a, b) => new Date(a.reportedDate) - new Date(b.reportedDate),
      defaultSortOrder: 'descend',
      width: 100
    },
    {
      title: 'Attachments',
      key: 'attachments',
      render: (_, record) => (
        <div>
          {record.attachments && record.attachments.length > 0 ? (
            <Tooltip title={`${record.attachments.length} file(s) attached`}>
              <Badge count={record.attachments.length} size="small">
                <FileOutlined style={{ fontSize: '16px' }} />
              </Badge>
            </Tooltip>
          ) : (
            <Text type="secondary" style={{ fontSize: '11px' }}>None</Text>
          )}
        </div>
      ),
      align: 'center',
      width: 80
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="small">
          <Button 
            size="small" 
            icon={<EyeOutlined />}
            onClick={() => handleViewDetails(record)}
          >
            View
          </Button>
          
          {record.status === 'pending_supervisor' && (
            <Button 
              size="small" 
              type="primary"
              icon={<EditOutlined />}
              onClick={() => {
                setSelectedReport(record);
                setReviewModalVisible(true);
              }}
            >
              Review
            </Button>
          )}
        </Space>
      ),
      width: 140,
      fixed: 'right'
    }
  ];

  const handleRefresh = async () => {
    await fetchIncidentReports();
    message.success('Data refreshed successfully');
  };

  if (loading && reports.length === 0) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Spin size="large" />
        <div style={{ marginTop: '16px' }}>Loading incident reports...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <Title level={2} style={{ margin: 0 }}>
            <SafetyCertificateOutlined /> Incident Report Reviews
          </Title>
          <Space>
            <Button 
              icon={<ReloadOutlined />} 
              onClick={handleRefresh}
              loading={loading}
            >
              Refresh
            </Button>
          </Space>
        </div>

        {/* Stats Cards */}
        <Row gutter={16} style={{ marginBottom: '24px' }}>
          <Col span={6}>
            <Statistic
              title="Pending Your Review"
              value={stats.pending}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="Reviewed by You"
              value={stats.reviewed}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="Escalated"
              value={stats.escalated}
              prefix={<ExclamationCircleOutlined />}
              valueStyle={{ color: '#f5222d' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="Total Reports"
              value={stats.total}
              prefix={<SafetyCertificateOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Col>
        </Row>

        {/* Pending Actions Alert */}
        {stats.pending > 0 && (
          <Alert
            message={`${stats.pending} incident report(s) require your review`}
            type="warning"
            showIcon
            style={{ marginBottom: '16px' }}
            action={
              <Button 
                size="small" 
                type="primary"
                onClick={() => setActiveTab('pending')}
              >
                Review Now
              </Button>
            }
          />
        )}

        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane 
            tab={`Pending Review (${getTabCount('pending')})`} 
            key="pending"
          />
          <TabPane 
            tab={`Reviewed (${getTabCount('reviewed')})`} 
            key="reviewed"
          />
          <TabPane 
            tab={`Escalated (${getTabCount('escalated')})`} 
            key="escalated"
          />
          <TabPane 
            tab={`Resolved (${getTabCount('closed')})`} 
            key="closed"
          />
        </Tabs>

        <Table
          columns={columns}
          dataSource={getFilteredReports()}
          loading={loading}
          rowKey="_id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} reports`
          }}
          scroll={{ x: 1400 }}
          size="small"
          rowClassName={(record) => {
            let className = 'incident-report-row';
            if (record.status === 'pending_supervisor') {
              className += ' pending-review-row';
            }
            if (record.severity === 'critical' || record.severity === 'high') {
              className += ' high-severity-row';
            }
            return className;
          }}
        />
      </Card>

      {/* Review Modal */}
      <Modal
        title={
          <Space>
            <SafetyCertificateOutlined />
            Supervisor Review - {selectedReport?.reportNumber}
          </Space>
        }
        open={reviewModalVisible}
        onCancel={() => {
          setReviewModalVisible(false);
          setSelectedReport(null);
          form.resetFields();
        }}
        footer={null}
        width={900}
      >
        {selectedReport && (
          <div>
            <Alert
              message="Supervisor Review Required"
              description="Please review this incident report and take appropriate action."
              type="info"
              showIcon
              style={{ marginBottom: '16px' }}
            />

            <Descriptions bordered column={2} size="small" style={{ marginBottom: '20px' }}>
              <Descriptions.Item label="Report Number">
                <Text code>{selectedReport.reportNumber}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Severity">
                {getSeverityTag(selectedReport.severity)}
              </Descriptions.Item>
              <Descriptions.Item label="Type">
                {getIncidentTypeTag(selectedReport.incidentType)}
              </Descriptions.Item>
              <Descriptions.Item label="Priority">
                {getPriorityTag(selectedReport.severity, selectedReport.injuriesReported)}
              </Descriptions.Item>
              <Descriptions.Item label="Reporter">
                <Text strong>{selectedReport.reportedBy?.fullName}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Department">
                <Tag color="blue">{selectedReport.reportedBy?.department}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Incident Date">
                {new Date(selectedReport.incidentDate).toLocaleString()}
              </Descriptions.Item>
              <Descriptions.Item label="Reported Date">
                {new Date(selectedReport.reportedDate || selectedReport.createdAt).toLocaleString()}
              </Descriptions.Item>
              <Descriptions.Item label="Location" span={2}>
                📍 {selectedReport.location}{selectedReport.specificLocation && ` - ${selectedReport.specificLocation}`}
              </Descriptions.Item>
              <Descriptions.Item label="Description" span={2}>
                {selectedReport.description}
              </Descriptions.Item>
              <Descriptions.Item label="Immediate Actions" span={2}>
                {selectedReport.immediateActions}
              </Descriptions.Item>
              {selectedReport.contributingFactors && (
                <Descriptions.Item label="Contributing Factors" span={2}>
                  {selectedReport.contributingFactors}
                </Descriptions.Item>
              )}
              {selectedReport.preventiveMeasures && (
                <Descriptions.Item label="Preventive Measures" span={2}>
                  {selectedReport.preventiveMeasures}
                </Descriptions.Item>
              )}
            </Descriptions>

            {/* Injury Details */}
            {selectedReport.injuriesReported && selectedReport.injuryDetails && (
              <Card size="small" title="Injury Information" style={{ marginBottom: '20px' }}>
                <Descriptions column={2} size="small">
                  <Descriptions.Item label="Medical Attention">
                    <Tag color={selectedReport.injuryDetails.medicalAttentionRequired !== 'none' ? 'red' : 'green'}>
                      {selectedReport.injuryDetails.medicalAttentionRequired !== 'none' ? 'Required' : 'Not Required'}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Work Restrictions">
                    {selectedReport.injuryDetails.workRestrictions || 'None specified'}
                  </Descriptions.Item>
                  {selectedReport.injuryDetails.bodyPartsAffected && (
                    <Descriptions.Item label="Body Parts Affected" span={2}>
                      {selectedReport.injuryDetails.bodyPartsAffected.join(', ')}
                    </Descriptions.Item>
                  )}
                  {selectedReport.injuryDetails.injuryType && (
                    <Descriptions.Item label="Injury Type" span={2}>
                      {selectedReport.injuryDetails.injuryType.join(', ')}
                    </Descriptions.Item>
                  )}
                </Descriptions>
              </Card>
            )}

            {/* Attachments */}
            {selectedReport.attachments && selectedReport.attachments.length > 0 && (
              <Card size="small" title="Attachments" style={{ marginBottom: '20px' }}>
                <Space wrap>
                  {selectedReport.attachments.map((attachment, index) => (
                    <Button 
                      key={index}
                      icon={<FileOutlined />}
                      size="small"
                      onClick={() => handleDownloadAttachment(attachment)}
                    >
                      {attachment.name}
                    </Button>
                  ))}
                </Space>
              </Card>
            )}

            <Form
              form={form}
              layout="vertical"
              onFinish={handleReviewDecision}
            >
              <Form.Item
                name="decision"
                label="Supervisor Decision"
                rules={[{ required: true, message: 'Please select your decision' }]}
              >
                <Radio.Group>
                  <Space direction="vertical">
                    <Radio.Button value="approved" style={{ color: '#52c41a' }}>
                      <CheckCircleOutlined /> Approve - Continue to HR Review
                    </Radio.Button>
                    <Radio.Button value="requires_investigation" style={{ color: '#faad14' }}>
                      <AuditOutlined /> Requires Further Investigation
                    </Radio.Button>
                    <Radio.Button value="escalated" style={{ color: '#f5222d' }}>
                      <ExclamationCircleOutlined /> Escalate to Higher Management
                    </Radio.Button>
                    <Radio.Button value="rejected" style={{ color: '#722ed1' }}>
                      <CloseCircleOutlined /> Reject Report
                    </Radio.Button>
                  </Space>
                </Radio.Group>
              </Form.Item>

              <Form.Item
                name="comments"
                label="Review Comments"
                rules={[{ required: true, message: 'Please provide review comments' }]}
              >
                <TextArea 
                  rows={4} 
                  placeholder="Provide detailed comments on your decision and any observations..."
                  showCount
                  maxLength={800}
                />
              </Form.Item>

              <Form.Item
                name="actionsTaken"
                label="Actions Taken"
                rules={[{ required: true, message: 'Please describe actions taken' }]}
              >
                <TextArea 
                  rows={3} 
                  placeholder="List immediate actions taken or corrective measures implemented..."
                  showCount
                  maxLength={500}
                />
              </Form.Item>

              <Form.Item
                noStyle
                shouldUpdate={(prevValues, currentValues) => 
                  prevValues.decision !== currentValues.decision
                }
              >
                {({ getFieldValue }) => {
                  const decision = getFieldValue('decision');
                  
                  if (decision === 'escalated') {
                    return (
                      <Form.Item
                        name="escalationReason"
                        label="Escalation Reason"
                        rules={[{ required: true, message: 'Please provide escalation reason' }]}
                      >
                        <TextArea 
                          rows={2} 
                          placeholder="Explain why this incident requires escalation..."
                          showCount
                          maxLength={300}
                        />
                      </Form.Item>
                    );
                  }

                  if (decision === 'rejected') {
                    return (
                      <Alert
                        message="Report Rejection"
                        description="Please ensure you have valid reasons for rejecting this incident report. The employee will be notified of your decision."
                        type="warning"
                        showIcon
                        style={{ marginBottom: '16px' }}
                      />
                    );
                  }

                  return null;
                }}
              </Form.Item>

              <Form.Item name="followUpRequired" valuePropName="checked">
                <Space>
                  <input type="checkbox" />
                  <Text>Follow-up review required</Text>
                </Space>
              </Form.Item>

              <Form.Item
                noStyle
                shouldUpdate={(prevValues, currentValues) => 
                  prevValues.followUpRequired !== currentValues.followUpRequired
                }
              >
                {({ getFieldValue }) =>
                  getFieldValue('followUpRequired') ? (
                    <Form.Item
                      name="followUpDate"
                      label="Follow-up Date"
                      rules={[{ required: true, message: 'Please specify follow-up date' }]}
                    >
                      <Input 
                        type="date"
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </Form.Item>
                  ) : null
                }
              </Form.Item>

              <Divider />

              <Form.Item>
                <Space>
                  <Button onClick={() => {
                    setReviewModalVisible(false);
                    setSelectedReport(null);
                    form.resetFields();
                  }}>
                    Cancel
                  </Button>
                  <Button 
                    type="primary" 
                    htmlType="submit"
                    loading={loading}
                    icon={<SendOutlined />}
                  >
                    Submit Review
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>

      {/* Details Modal */}
      <Modal
        title={
          <Space>
            <SafetyCertificateOutlined />
            Incident Report Details - {selectedReport?.reportNumber}
          </Space>
        }
        open={detailsModalVisible}
        onCancel={() => {
          setDetailsModalVisible(false);
          setSelectedReport(null);
        }}
        footer={null}
        width={1000}
      >
        {selectedReport && (
          <div>
            <Descriptions bordered column={2} size="small" style={{ marginBottom: '20px' }}>
              <Descriptions.Item label="Report Number" span={2}>
                <Text code copyable>{selectedReport.reportNumber}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Title" span={2}>
                <Text strong>{selectedReport.title}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Type">
                {getIncidentTypeTag(selectedReport.incidentType)}
              </Descriptions.Item>
              <Descriptions.Item label="Severity">
                {getSeverityTag(selectedReport.severity)}
              </Descriptions.Item>
              <Descriptions.Item label="Priority">
                {getPriorityTag(selectedReport.severity, selectedReport.injuriesReported)}
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                {getStatusTag(selectedReport.status)}
              </Descriptions.Item>
              <Descriptions.Item label="Incident Date">
                <CalendarOutlined /> {new Date(selectedReport.incidentDate).toLocaleString()}
              </Descriptions.Item>
              <Descriptions.Item label="Reported Date">
                <CalendarOutlined /> {new Date(selectedReport.reportedDate || selectedReport.createdAt).toLocaleString()}
              </Descriptions.Item>
              <Descriptions.Item label="Location" span={2}>
                <EnvironmentOutlined /> {selectedReport.location}{selectedReport.specificLocation && ` - ${selectedReport.specificLocation}`}
              </Descriptions.Item>
            </Descriptions>

            {/* Reporter Information */}
            <Card size="small" title={<><UserOutlined /> Reporter Information</>} style={{ marginBottom: '20px' }}>
              <Descriptions column={2} size="small">
                <Descriptions.Item label="Name">
                  <Text strong>{selectedReport.reportedBy?.fullName}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Employee ID">
                  <Text code>{selectedReport.reportedBy?.employeeId}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Department">
                  <Tag color="blue">{selectedReport.reportedBy?.department}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Contact">
                  {selectedReport.reportedBy?.phone || 'Not provided'}
                </Descriptions.Item>
              </Descriptions>
            </Card>

            {/* Incident Description */}
            <Card size="small" title="Incident Description" style={{ marginBottom: '20px' }}>
              <div style={{ marginBottom: '12px' }}>
                <Text strong>What happened:</Text>
                <br />
                <Text>{selectedReport.description}</Text>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <Text strong>Immediate actions taken:</Text>
                <br />
                <Text>{selectedReport.immediateActions}</Text>
              </div>
              {selectedReport.witnesses && selectedReport.witnesses.length > 0 && (
                <div style={{ marginBottom: '12px' }}>
                  <Text strong>Witnesses:</Text>
                  <br />
                  <Text>{Array.isArray(selectedReport.witnesses) ? selectedReport.witnesses.join(', ') : selectedReport.witnesses}</Text>
                </div>
              )}
            </Card>

            {/* Injury Information */}
            {selectedReport.injuriesReported && (
              <Card size="small" title={<><MedicineBoxOutlined /> Injury Information</>} style={{ marginBottom: '20px' }}>
                <Descriptions column={2} size="small">
                  <Descriptions.Item label="Medical Attention Required">
                    <Tag color={selectedReport.injuryDetails?.medicalAttentionRequired !== 'none' ? 'red' : 'green'}>
                      {selectedReport.injuryDetails?.medicalAttentionRequired !== 'none' ? 'Yes' : 'No'}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Work Restrictions">
                    {selectedReport.injuryDetails?.workRestrictions || 'None specified'}
                  </Descriptions.Item>
                  {selectedReport.injuryDetails?.bodyPartsAffected && (
                    <Descriptions.Item label="Body Parts Affected" span={2}>
                      <Space wrap>
                        {selectedReport.injuryDetails.bodyPartsAffected.map((part, index) => (
                          <Tag key={index} color="red">{part}</Tag>
                        ))}
                      </Space>
                    </Descriptions.Item>
                  )}
                  {selectedReport.injuryDetails?.injuryType && (
                    <Descriptions.Item label="Injury Type" span={2}>
                      <Space wrap>
                        {selectedReport.injuryDetails.injuryType.map((type, index) => (
                          <Tag key={index} color="orange">{type}</Tag>
                        ))}
                      </Space>
                    </Descriptions.Item>
                  )}
                </Descriptions>
              </Card>
            )}

            {/* Contributing Factors & Recommendations */}
            {(selectedReport.contributingFactors || selectedReport.preventiveMeasures) && (
              <Card size="small" title="Analysis & Recommendations" style={{ marginBottom: '20px' }}>
                {selectedReport.contributingFactors && (
                  <div style={{ marginBottom: '12px' }}>
                    <Text strong>Contributing Factors:</Text>
                    <br />
                    <Text>{selectedReport.contributingFactors}</Text>
                  </div>
                )}
                {selectedReport.preventiveMeasures && (
                  <div>
                    <Text strong>Preventive Measures:</Text>
                    <br />
                    <Text>{selectedReport.preventiveMeasures}</Text>
                  </div>
                )}
              </Card>
            )}

            {/* Attachments */}
            {selectedReport.attachments && selectedReport.attachments.length > 0 && (
              <Card size="small" title="Attached Files" style={{ marginBottom: '20px' }}>
                <Space wrap>
                  {selectedReport.attachments.map((attachment, index) => (
                    <Button 
                      key={index}
                      icon={<FileOutlined />}
                      onClick={() => handleDownloadAttachment(attachment)}
                    >
                      {attachment.name}
                    </Button>
                  ))}
                </Space>
              </Card>
            )}

            {/* Supervisor Review */}
            {selectedReport.supervisorReview && (
              <Card size="small" title={<><HistoryOutlined /> Supervisor Review</>} style={{ marginBottom: '20px' }}>
                <Descriptions column={2} size="small">
                  <Descriptions.Item label="Reviewed By">
                    <Text strong>{selectedReport.supervisorReview.decidedBy?.fullName || selectedReport.supervisorReview.reviewedBy}</Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="Review Date">
                    {new Date(selectedReport.supervisorReview.decisionDate || selectedReport.supervisorReview.reviewedAt).toLocaleString()}
                  </Descriptions.Item>
                  <Descriptions.Item label="Decision">
                    <Tag color={
                      selectedReport.supervisorReview.decision === 'approved' ? 'green' :
                      selectedReport.supervisorReview.decision === 'escalated' ? 'red' :
                      selectedReport.supervisorReview.decision === 'rejected' ? 'red' :
                      'purple'
                    }>
                      {selectedReport.supervisorReview.decision?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Follow-up Required">
                    <Tag color={selectedReport.supervisorReview.followUpRequired ? 'orange' : 'green'}>
                      {selectedReport.supervisorReview.followUpRequired ? 'Yes' : 'No'}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Comments" span={2}>
                    <Text italic>"{selectedReport.supervisorReview.comments}"</Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="Actions Taken" span={2}>
                    <Text>{selectedReport.supervisorReview.actionsTaken}</Text>
                  </Descriptions.Item>
                  {selectedReport.supervisorReview.escalationReason && (
                    <Descriptions.Item label="Escalation Reason" span={2}>
                      <Text type="danger">{selectedReport.supervisorReview.escalationReason}</Text>
                    </Descriptions.Item>
                  )}
                  {selectedReport.supervisorReview.followUpDate && (
                    <Descriptions.Item label="Follow-up Date">
                      {new Date(selectedReport.supervisorReview.followUpDate).toLocaleDateString('en-GB')}
                    </Descriptions.Item>
                  )}
                </Descriptions>
              </Card>
            )}

            {/* Action Button for Pending Reviews */}
            {selectedReport.status === 'pending_supervisor' && (
              <Card size="small" style={{ textAlign: 'center', backgroundColor: '#fff7e6' }}>
                <Text strong>This report is awaiting your review</Text>
                <br />
                <Button 
                  type="primary"
                  size="large"
                  icon={<EditOutlined />}
                  style={{ marginTop: '12px' }}
                  onClick={() => {
                    setDetailsModalVisible(false);
                    setReviewModalVisible(true);
                  }}
                >
                  Review Now
                </Button>
              </Card>
            )}
          </div>
        )}
      </Modal>

      {/* Custom CSS for row styling */}
      <style jsx>{`
        .incident-report-row {
          background-color: #fafafa;
        }
        .incident-report-row:hover {
          background-color: #f0f0f0 !important;
        }
        .pending-review-row {
          border-left: 3px solid #faad14;
          background-color: #fff7e6;
        }
        .pending-review-row:hover {
          background-color: #fff1d6 !important;
        }
        .high-severity-row {
          border-left: 3px solid #ff4d4f;
        }
        .high-severity-row:hover {
          background-color: #fff2f0 !important;
        }
      `}</style>
    </div>
  );
};

export default SupervisorIncidentReports;


