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
  Badge,
  message,
  notification,
  Tabs
} from 'antd';
import { 
  SafetyCertificateOutlined, 
  CheckCircleOutlined, 
  ClockCircleOutlined,
  EyeOutlined,
  ReloadOutlined,
  BarChartOutlined,
  WarningOutlined,
  EditOutlined,
  FileTextOutlined,
  ExclamationCircleOutlined,
  PlayCircleOutlined,
  SearchOutlined,
  PlusOutlined
} from '@ant-design/icons';
import { incidentReportsAPI } from '../../services/incidentReportAPI';
import { useSelector } from 'react-redux';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { TextArea } = Input;

const HSEIncidentReports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionModal, setActionModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [actionForm] = Form.useForm();
  const [activeTab, setActiveTab] = useState('all');
  const [filters, setFilters] = useState({
    status: 'all',
    severity: 'all',
    type: 'all',
    dateRange: null
  });
  const [stats, setStats] = useState({
    total: 0,
    submitted: 0,
    underReview: 0,
    underInvestigation: 0,
    actionRequired: 0,
    resolved: 0,
    critical: 0,
    withInjuries: 0
  });
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    fetchIncidentReports();
  }, []);

  useEffect(() => {
    if (reports.length > 0) {
      calculateStats();
    }
  }, [reports]);

  const calculateStats = () => {
    const total = reports.length;
    const submitted = reports.filter(r => r.status === 'submitted').length;
    const underReview = reports.filter(r => r.status === 'under_review').length;
    const underInvestigation = reports.filter(r => r.status === 'under_investigation').length;
    const actionRequired = reports.filter(r => r.status === 'action_required').length;
    const resolved = reports.filter(r => r.status === 'resolved').length;
    const critical = reports.filter(r => r.severity === 'critical' && r.status !== 'resolved').length;
    const withInjuries = reports.filter(r => r.injuriesReported && r.status !== 'resolved').length;

    setStats({
      total,
      submitted,
      underReview,
      underInvestigation,
      actionRequired,
      resolved,
      critical,
      withInjuries
    });
  };

  const fetchIncidentReports = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('📋 Fetching HSE incident reports...');
      const response = await incidentReportsAPI.getHSEReports();
      
      if (response.success) {
        setReports(response.data || []);
        console.log('✅ Loaded', response.data?.length || 0, 'HSE reports');
      } else {
        throw new Error(response.message || 'Failed to fetch reports');
      }
    } catch (error) {
      console.error('❌ Error fetching HSE incident reports:', error);
      
      let errorMessage = 'Failed to fetch incident reports';
      if (error.response?.status === 401) {
        errorMessage = 'Your session has expired. Please log in again.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      setError(errorMessage);
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusTag = (status) => {
    const statusMap = {
      'submitted': { 
        color: 'blue', 
        icon: <FileTextOutlined />, 
        text: 'Submitted - New' 
      },
      'under_review': { 
        color: 'orange', 
        icon: <EyeOutlined />, 
        text: 'Under Review' 
      },
      'under_investigation': { 
        color: 'purple', 
        icon: <SearchOutlined />, 
        text: 'Investigating' 
      },
      'action_required': { 
        color: 'gold', 
        icon: <ExclamationCircleOutlined />, 
        text: 'Action Required' 
      },
      'resolved': { 
        color: 'green', 
        icon: <CheckCircleOutlined />, 
        text: 'Resolved' 
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

  const reportColumns = [
    {
      title: 'Report Details',
      key: 'reportDetails',
      render: (_, record) => (
        <div>
          <Text strong>{record.title}</Text>
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
          <Text strong>{record.reportedBy?.fullName || 'Unknown'}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: '11px' }}>
            {record.reportedBy?.department || 'N/A'}
          </Text>
        </div>
      ),
      width: 150
    },
    {
      title: 'Type & Severity',
      key: 'typeAndSeverity',
      render: (_, record) => (
        <Space direction="vertical" size="small">
          {record.incidentType && <Tag>{record.incidentType.replace('_', ' ')}</Tag>}
          {getSeverityTag(record.severity)}
        </Space>
      ),
      width: 130
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, record) => (
        <div>
          {getStatusTag(record.status)}
          <div style={{ marginTop: '8px', width: '120px' }}>
            <Progress 
              size="small"
              percent={
                record.status === 'resolved' ? 100 :
                record.status === 'action_required' ? 80 :
                record.status === 'under_investigation' ? 60 :
                record.status === 'under_review' ? 40 :
                record.status === 'submitted' ? 20 : 0
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
          {record.hseManagement?.investigationRequired && (
            <Tag color="orange" size="small" style={{ marginTop: '4px' }}>
              Investigation Required
            </Tag>
          )}
        </div>
      ),
      width: 120
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
            onClick={() => navigate(`/hse/incident-reports/${record._id}`)}
            size="small"
          >
            View
          </Button>
          {record.status !== 'resolved' && (
            <Button 
              type="link" 
              icon={<EditOutlined />}
              onClick={() => {
                setSelectedReport(record);
                setActionModal(true);
              }}
              size="small"
            >
              Manage
            </Button>
          )}
        </Space>
      ),
      width: 100
    }
  ];

  const filteredReports = reports.filter(report => {
    // Tab filtering
    if (activeTab !== 'all') {
      if (activeTab === 'new' && report.status !== 'submitted') return false;
      if (activeTab === 'active' && ['resolved', 'archived'].includes(report.status)) return false;
      if (activeTab === 'urgent' && (!['critical', 'high'].includes(report.severity) || report.status === 'resolved')) return false;
    }

    // Status filtering
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

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <Title level={2} style={{ margin: 0 }}>
            <SafetyCertificateOutlined /> HSE Incident Management
          </Title>
          <Space>
            <Button 
              icon={<BarChartOutlined />}
              onClick={() => navigate('/hse/incident-analytics')}
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
          />
        )}

        {/* Stats Cards */}
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
                title="New"
                value={stats.submitted}
                prefix={<FileTextOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={8} md={4}>
            <Card size="small">
              <Statistic
                title="Investigating"
                value={stats.underInvestigation}
                prefix={<SearchOutlined />}
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={8} md={4}>
            <Card size="small">
              <Statistic
                title="Action Required"
                value={stats.actionRequired}
                prefix={<ExclamationCircleOutlined />}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={8} md={4}>
            <Card size="small">
              <Statistic
                title="Critical Open"
                value={stats.critical}
                prefix={<WarningOutlined />}
                valueStyle={{ color: '#ff4d4f' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={8} md={4}>
            <Card size="small">
              <Statistic
                title="Resolved"
                value={stats.resolved}
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
        </Row>

        {/* Tabs */}
        <Tabs 
          activeKey={activeTab}
          onChange={setActiveTab}
          style={{ marginBottom: '16px' }}
          items={[
            {
              key: 'all',
              label: `All Reports (${reports.length})`
            },
            {
              key: 'new',
              label: (
                <Badge count={stats.submitted} offset={[10, 0]}>
                  New Submissions
                </Badge>
              )
            },
            {
              key: 'active',
              label: `Active Cases (${stats.underReview + stats.underInvestigation + stats.actionRequired})`
            },
            {
              key: 'urgent',
              label: (
                <Badge count={stats.critical + stats.withInjuries} offset={[10, 0]}>
                  <span style={{ color: '#ff4d4f' }}>Urgent</span>
                </Badge>
              )
            }
          ]}
        />

        {/* Filters */}
        <Card size="small" style={{ marginBottom: '16px' }}>
          <Row gutter={16} align="middle">
            <Col>
              <Text strong>Filters:</Text>
            </Col>
            <Col>
              <Select
                style={{ width: 140 }}
                value={filters.status}
                onChange={(value) => setFilters({...filters, status: value})}
                placeholder="Status"
              >
                <Select.Option value="all">All Status</Select.Option>
                <Select.Option value="submitted">Submitted</Select.Option>
                <Select.Option value="under_review">Under Review</Select.Option>
                <Select.Option value="under_investigation">Investigating</Select.Option>
                <Select.Option value="action_required">Action Required</Select.Option>
                <Select.Option value="resolved">Resolved</Select.Option>
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

        {loading && reports.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Spin size="large" />
            <div style={{ marginTop: '16px' }}>Loading incident reports...</div>
          </div>
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
            />
          </>
        )}
      </Card>
    </div>
  );
};

export default HSEIncidentReports;