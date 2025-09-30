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
  Tooltip,
  Badge,
  message,
  notification
} from 'antd';
import { 
  SafetyCertificateOutlined, 
  CheckCircleOutlined, 
  CloseCircleOutlined, 
  ClockCircleOutlined,
  EyeOutlined,
  ReloadOutlined,
  BarChartOutlined,
  WarningOutlined,
  UserOutlined,
  EditOutlined,
  FileTextOutlined,
  ExclamationCircleOutlined,
  AuditOutlined
} from '@ant-design/icons';
import { incidentReportsAPI } from '../../services/incidentReportAPI';
import { useSelector } from 'react-redux';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;
const { RangePicker } = DatePicker;
const { TextArea } = Input;

const HRIncidentReports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reviewModal, setReviewModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [reviewForm] = Form.useForm();
  const [filters, setFilters] = useState({
    status: 'all',
    severity: 'all',
    type: 'all',
    dateRange: null
  });
  const [stats, setStats] = useState({
    total: 0,
    pendingReviews: 0,
    highSeverity: 0,
    injuries: 0,
    workDaysLost: 0,
    investigations: 0
  });
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    fetchIncidentReports();
  }, []);

  useEffect(() => {
    // Calculate stats when reports change
    if (reports.length > 0) {
      const total = reports.length;
      const pendingReviews = reports.filter(r => 
        r.status === 'pending_hr_review' && !r.hrReview?.reviewed
      ).length;
      const highSeverity = reports.filter(r => 
        ['critical', 'high'].includes(r.severity)
      ).length;
      const injuries = reports.filter(r => r.injuriesReported).length;
      const workDaysLost = reports.reduce((sum, r) => sum + (r.workDaysLost || 0), 0);
      const investigations = reports.filter(r => 
        r.investigation?.required && r.status !== 'resolved'
      ).length;

      setStats({
        total,
        pendingReviews,
        highSeverity,
        injuries,
        workDaysLost,
        investigations
      });
    }
  }, [reports]);

  const fetchIncidentReports = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('Fetching HR incident reports...');
      const response = await incidentReportsAPI.getHRReports();
      
      if (response.success) {
        setReports(response.data || []);
        console.log('Loaded', response.data?.length || 0, 'HR reports');
      } else {
        throw new Error(response.message || 'Failed to fetch reports');
      }
    } catch (error) {
      console.error('Error fetching HR incident reports:', error);
      
      let errorMessage = 'Failed to fetch incident reports';
      if (error.response?.status === 401) {
        errorMessage = 'Your session has expired. Please log in again.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (values) => {
    if (!selectedReport) return;

    try {
      setLoading(true);

      console.log('Submitting HR review:', values);

      const response = await incidentReportsAPI.processHRDecision(selectedReport._id, values);

      if (response.success) {
        message.success('HR review submitted successfully');
        
        setReviewModal(false);
        setSelectedReport(null);
        reviewForm.resetFields();
        
        // Refresh data
        await fetchIncidentReports();
        
        // Show success notification
        notification.success({
          message: 'HR Review Completed',
          description: `Incident report ${selectedReport.reportNumber} has been processed. All stakeholders have been notified.`,
          duration: 4
        });
      } else {
        throw new Error(response.message || 'Failed to submit review');
      }
    } catch (error) {
      console.error('Error submitting HR review:', error);
      
      let errorMessage = 'Failed to submit HR review';
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

  const getStatusTag = (status) => {
    const statusMap = {
      'pending_hr_review': { 
        color: 'orange', 
        icon: <ClockCircleOutlined />, 
        text: 'Pending HR Review' 
      },
      'under_investigation': { 
        color: 'purple', 
        icon: <EyeOutlined />, 
        text: 'Under Investigation' 
      },
      'investigation_complete': { 
        color: 'geekblue', 
        icon: <CheckCircleOutlined />, 
        text: 'Investigation Complete' 
      },
      'resolved': { 
        color: 'green', 
        icon: <CheckCircleOutlined />, 
        text: 'Resolved' 
      },
      'escalated': { 
        color: 'red', 
        icon: <ExclamationCircleOutlined />, 
        text: 'Escalated' 
      }
    };

    const statusInfo = statusMap[status] || { 
      color: 'default', 
      text: status?.replace('_', ' ') || 'Unknown',
      icon: <FileTextOutlined />
    };

    return (
      <Tag color={statusInfo.color} icon={statusInfo.icon}>
        {statusInfo.text}
      </Tag>
    );
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
      'security': { color: 'purple', text: 'Security/HR', icon: '🔒' },
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

  const reportColumns = [
    {
      title: 'Report Details',
      key: 'reportDetails',
      render: (_, record) => (
        <div>
          <Text strong>{record.title}</Text>
          {record.confidential && <Tag color="purple" size="small" style={{ marginLeft: '8px' }}>Confidential</Tag>}
          <br />
          <Text code style={{ fontSize: '11px' }}>{record.reportNumber}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: '10px' }}>
            📍 {record.location}
          </Text>
        </div>
      ),
      width: 250
    },
    {
      title: 'Employee',
      key: 'employee',
      render: (_, record) => (
        <div>
          {record.confidential ? (
            <Text type="secondary">Confidential</Text>
          ) : (
            <>
              <Text strong>{record.reportedBy?.fullName || 'Unknown'}</Text>
              <br />
              <Text type="secondary" style={{ fontSize: '11px' }}>
                {record.reportedBy?.department || 'N/A'}
              </Text>
            </>
          )}
        </div>
      ),
      width: 150
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
      title: 'Status & Progress',
      key: 'statusProgress',
      render: (_, record) => (
        <div>
          {getStatusTag(record.status)}
          <div style={{ marginTop: '8px', width: '120px' }}>
            <Progress 
              size="small"
              percent={
                record.status === 'resolved' ? 100 :
                ['investigation_complete', 'under_investigation'].includes(record.status) ? 80 :
                record.status === 'pending_hr_review' ? 60 :
                record.status === 'pending_supervisor' ? 20 : 0
              }
              status={record.status === 'resolved' ? 'success' : 'active'}
              showInfo={false}
            />
          </div>
        </div>
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
          {record.investigation?.required && (
            <Tag color="orange" size="small" style={{ marginTop: '4px' }}>
              Investigation Required
            </Tag>
          )}
        </div>
      ),
      width: 120
    },
    {
      title: 'HR Review',
      key: 'hrReview',
      render: (_, record) => (
        <div>
          {record.hrReview?.reviewed ? (
            <div>
              <Tag color="green" size="small">✅ Reviewed</Tag>
              <div style={{ fontSize: '10px', marginTop: '4px' }}>
                by {record.hrReview.reviewedBy || record.hrReview.decidedBy?.fullName}
              </div>
            </div>
          ) : (
            <div>
              <Tag color="orange" size="small">⏳ Pending</Tag>
              {record.hrReview?.assignedOfficer && (
                <div style={{ fontSize: '10px', marginTop: '4px' }}>
                  Assigned: {record.hrReview.assignedOfficer}
                </div>
              )}
            </div>
          )}
        </div>
      ),
      width: 110
    },
    {
      title: 'Date',
      dataIndex: 'incidentDate',
      key: 'incidentDate',
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
      sorter: (a, b) => new Date(a.incidentDate) - new Date(b.incidentDate),
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
            onClick={() => navigate(`/hr/incident-reports/${record._id}`)}
            size="small"
          >
            View
          </Button>
          {!record.hrReview?.reviewed && (
            <Button 
              type="link" 
              icon={<EditOutlined />}
              onClick={() => {
                setSelectedReport(record);
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

  const filteredReports = reports.filter(report => {
    if (filters.status !== 'all' && report.status !== filters.status) return false;
    if (filters.severity !== 'all' && report.severity !== filters.severity) return false;
    if (filters.type !== 'all' && report.incidentType !== filters.type) return false;
    if (filters.dateRange) {
      const reportDate = dayjs(report.incidentDate);
      if (reportDate.isBefore(filters.dateRange[0]) || reportDate.isAfter(filters.dateRange[1])) {
        return false;
      }
    }
    return true;
  });

  const getStatsCards = () => {
    return (
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col xs={12} sm={8} md={4}>
          <Card size="small">
            <Statistic
              title="Total Reports"
              value={stats.total}
              prefix={<SafetyCertificateOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card size="small">
            <Statistic
              title="Pending Reviews"
              value={stats.pendingReviews}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card size="small">
            <Statistic
              title="High Severity"
              value={stats.highSeverity}
              prefix={<WarningOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card size="small">
            <Statistic
              title="Injuries"
              value={stats.injuries}
              prefix={<ExclamationCircleOutlined />}
              valueStyle={{ color: '#f5222d' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card size="small">
            <Statistic
              title="Days Lost"
              value={stats.workDaysLost}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card size="small">
            <Statistic
              title="Investigations"
              value={stats.investigations}
              prefix={<EyeOutlined />}
              valueStyle={{ color: '#13c2c2' }}
            />
          </Card>
        </Col>
      </Row>
    );
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
            <SafetyCertificateOutlined /> HR Incident Reports Management
          </Title>
          <Space>
            <Button 
              icon={<BarChartOutlined />}
              onClick={() => navigate('/hr/incident-reports/analytics')}
            >
              Analytics
            </Button>
            <Button 
              icon={<ReloadOutlined />}
              onClick={fetchIncidentReports}
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
            action={
              <Button size="small" onClick={fetchIncidentReports}>
                Retry
              </Button>
            }
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
                <Select.Option value="pending_hr_review">Pending HR</Select.Option>
                <Select.Option value="under_investigation">Investigating</Select.Option>
                <Select.Option value="investigation_complete">Investigation Complete</Select.Option>
                <Select.Option value="resolved">Resolved</Select.Option>
                <Select.Option value="escalated">Escalated</Select.Option>
              </Select>
            </Col>
            <Col>
              <Select
                style={{ width: 120 }}
                value={filters.severity}
                onChange={(value) => setFilters({...filters, severity: value})}
                placeholder="Severity"
              >
                <Select.Option value="all">All Severity</Select.Option>
                <Select.Option value="critical">Critical</Select.Option>
                <Select.Option value="high">High</Select.Option>
                <Select.Option value="medium">Medium</Select.Option>
                <Select.Option value="low">Low</Select.Option>
              </Select>
            </Col>
            <Col>
              <Select
                style={{ width: 140 }}
                value={filters.type}
                onChange={(value) => setFilters({...filters, type: value})}
                placeholder="Incident Type"
              >
                <Select.Option value="all">All Types</Select.Option>
                <Select.Option value="injury">Injury</Select.Option>
                <Select.Option value="near_miss">Near Miss</Select.Option>
                <Select.Option value="equipment">Equipment</Select.Option>
                <Select.Option value="security">Security/HR</Select.Option>
                <Select.Option value="environmental">Environmental</Select.Option>
                <Select.Option value="fire">Fire/Emergency</Select.Option>
                <Select.Option value="other">Other</Select.Option>
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
                  severity: 'all', 
                  type: 'all',
                  dateRange: null
                })}
              >
                Clear Filters
              </Button>
            </Col>
          </Row>
        </Card>

        {filteredReports.length === 0 ? (
          <Alert
            message="No Incident Reports Found"
            description={
              reports.length === 0 
                ? "No incident reports have been submitted yet."
                : "No reports match your current filter criteria. Try adjusting the filters above."
            }
            type="info"
            showIcon
            style={{ marginBottom: '16px' }}
          />
        ) : (
          <>
            <Text type="secondary" style={{ marginBottom: '8px', display: 'block' }}>
              Showing {filteredReports.length} of {reports.length} reports
            </Text>

            <Table 
              columns={reportColumns} 
              dataSource={filteredReports} 
              loading={loading}
              rowKey="_id"
              pagination={{ 
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) => 
                  `${range[0]}-${range[1]} of ${total} reports`
              }}
              scroll={{ x: 'max-content' }}
              rowClassName={(record) => {
                if (record.severity === 'critical' || record.severity === 'high') {
                  return 'high-severity-row';
                }
                if (!record.hrReview?.reviewed) {
                  return 'pending-review-row';
                }
                return '';
              }}
            />
          </>
        )}
      </Card>

      {/* HR Review Modal */}
      <Modal
        title={`HR Review - ${selectedReport?.reportNumber}`}
        open={reviewModal}
        onCancel={() => {
          setReviewModal(false);
          setSelectedReport(null);
          reviewForm.resetFields();
        }}
        footer={null}
        width={800}
      >
        {selectedReport && (
          <Form
            form={reviewForm}
            layout="vertical"
            onFinish={handleReview}
          >
            <Row gutter={16}>
              <Col span={24}>
                <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#f5f5f5', borderRadius: '6px' }}>
                  <Text strong>Incident Summary:</Text>
                  <br />
                  <Text>{selectedReport.title}</Text>
                  <br />
                  <Text type="secondary">{selectedReport.description}</Text>
                </div>
              </Col>
            </Row>

            <Form.Item
              name="decision"
              label="HR Decision"
              rules={[{ required: true, message: 'Please select a decision' }]}
            >
              <Select placeholder="Select HR decision">
                <Select.Option value="resolved">Mark as Resolved</Select.Option>
                <Select.Option value="requires_investigation">Requires Investigation</Select.Option>
                <Select.Option value="escalated">Escalate to Management</Select.Option>
                <Select.Option value="rejected">Reject Report</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="comments"
              label="HR Comments"
              rules={[{ required: true, message: 'Please provide HR comments' }]}
            >
              <TextArea 
                rows={3} 
                placeholder="Provide detailed HR review comments..."
                showCount
                maxLength={500}
              />
            </Form.Item>

            <Form.Item
              name="actionsTaken"
              label="Actions Taken"
            >
              <TextArea 
                rows={2} 
                placeholder="List any actions taken or policies updated..."
                showCount
                maxLength={300}
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
                
                if (decision === 'requires_investigation') {
                  return (
                    <>
                      <Form.Item
                        name="investigationRequired"
                        label="Investigation Details"
                        rules={[{ required: true, message: 'Please specify investigation requirements' }]}
                      >
                        <TextArea 
                          rows={2} 
                          placeholder="Describe what investigation is needed..."
                          showCount
                          maxLength={300}
                        />
                      </Form.Item>
                      <Form.Item
                        name="assignedOfficer"
                        label="Assign Investigation To"
                      >
                        <Input placeholder="Name of investigating officer" />
                      </Form.Item>
                    </>
                  );
                }

                if (decision === 'escalated') {
                  return (
                    <Form.Item
                      name="escalationReason"
                      label="Escalation Reason"
                      rules={[{ required: true, message: 'Please provide escalation reason' }]}
                    >
                      <TextArea 
                        rows={2} 
                        placeholder="Explain why this requires management escalation..."
                        showCount
                        maxLength={300}
                      />
                    </Form.Item>
                  );
                }

                return null;
              }}
            </Form.Item>

            <Form.Item
              name="followUpRequired"
              label="Follow-up Required"
            >
              <Select placeholder="Follow-up requirements">
                <Select.Option value="none">No Follow-up Required</Select.Option>
                <Select.Option value="weekly">Weekly Check-in</Select.Option>
                <Select.Option value="monthly">Monthly Review</Select.Option>
                <Select.Option value="investigation">Formal Investigation</Select.Option>
                <Select.Option value="training">Additional Training</Select.Option>
              </Select>
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
        .high-severity-row {
          background-color: #fff2f0 !important;
          border-left: 4px solid #ff4d4f !important;
        }
        .high-severity-row:hover {
          background-color: #ffe7e6 !important;
        }
        .pending-review-row {
          background-color: #fffbf0 !important;
          border-left: 3px solid #faad14 !important;
        }
        .pending-review-row:hover {
          background-color: #fff1d6 !important;
        }
      `}</style>
    </div>
  );
};

export default HRIncidentReports;


