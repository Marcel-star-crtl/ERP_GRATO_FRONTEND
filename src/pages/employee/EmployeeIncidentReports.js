import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
  message,
  notification
} from 'antd';
import { 
  ExclamationCircleOutlined, 
  CheckCircleOutlined, 
  CloseCircleOutlined, 
  ClockCircleOutlined,
  PlusOutlined,
  SafetyCertificateOutlined,
  EyeOutlined,
  ReloadOutlined,
  EditOutlined,
  FileTextOutlined,
  MedicineBoxOutlined,
  WarningOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import { incidentReportsAPI } from '../../services/incidentReportAPI';
import { useSelector } from 'react-redux';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { confirm } = Modal;

const EmployeeIncidentReports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    status: 'all',
    severity: 'all',
    type: 'all',
    dateRange: null
  });
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    resolved: 0,
    withInjuries: 0
  });
  
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    fetchIncidentReports();
    
    // Show success message if navigated from form submission
    if (location.state?.message) {
      notification.success({
        message: 'Report Submitted',
        description: location.state.message,
        duration: 4
      });
      // Clear the location state
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  useEffect(() => {
    // Calculate stats when reports change
    if (reports.length > 0) {
      const total = reports.length;
      const pending = reports.filter(r => 
        ['pending_supervisor', 'pending_hr_review', 'under_investigation'].includes(r.status)
      ).length;
      const resolved = reports.filter(r => r.status === 'resolved').length;
      const withInjuries = reports.filter(r => r.injuriesReported).length;
      
      setStats({ total, pending, resolved, withInjuries });
    }
  }, [reports]);

  const fetchIncidentReports = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('Fetching employee incident reports...');
      const response = await incidentReportsAPI.getEmployeeReports();
      
      if (response.success) {
        setReports(response.data || []);
        console.log('Loaded', response.data?.length || 0, 'reports');
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
      
      setError(errorMessage);
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    await fetchIncidentReports();
    message.success('Data refreshed successfully');
  };

  const handleDelete = async (reportId, reportNumber) => {
    confirm({
      title: 'Delete Incident Report',
      content: `Are you sure you want to delete report ${reportNumber}? This action cannot be undone.`,
      okText: 'Yes, Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          setLoading(true);
          await incidentReportsAPI.deleteReport(reportId);
          
          message.success('Incident report deleted successfully');
          await fetchIncidentReports(); // Refresh the list
        } catch (error) {
          console.error('Error deleting report:', error);
          message.error(error.response?.data?.message || 'Failed to delete report');
        } finally {
          setLoading(false);
        }
      }
    });
  };

  const handleEdit = (reportId) => {
    navigate(`/employee/incident-reports/${reportId}/edit`);
  };

  const getStatusTag = (status) => {
    const statusMap = {
      'pending_supervisor': { 
        color: 'orange', 
        icon: <ClockCircleOutlined />, 
        text: 'Pending Supervisor Review' 
      },
      'pending_hr_review': { 
        color: 'blue', 
        icon: <FileTextOutlined />, 
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
      'rejected': { 
        color: 'red', 
        icon: <CloseCircleOutlined />, 
        text: 'Rejected' 
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

  const reportColumns = [
    {
      title: 'Report #',
      dataIndex: 'reportNumber',
      key: 'reportNumber',
      render: (reportNumber) => (
        <Text code style={{ fontSize: '12px' }}>{reportNumber}</Text>
      ),
      width: 120
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
            Date: {new Date(record.incidentDate).toLocaleDateString()}
          </Text>
        </div>
      ),
      width: 250
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
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => getStatusTag(status),
      filters: [
        { text: 'Pending Supervisor', value: 'pending_supervisor' },
        { text: 'Pending HR Review', value: 'pending_hr_review' },
        { text: 'Under Investigation', value: 'under_investigation' },
        { text: 'Investigation Complete', value: 'investigation_complete' },
        { text: 'Resolved', value: 'resolved' },
        { text: 'Rejected', value: 'rejected' }
      ],
      onFilter: (value, record) => record.status === value,
      width: 150
    },
    {
      title: 'Injuries',
      dataIndex: 'injuriesReported',
      key: 'injuries',
      render: (hasInjuries) => (
        <Tag color={hasInjuries ? 'red' : 'green'}>
          {hasInjuries ? '🤕 Yes' : '✅ None'}
        </Tag>
      ),
      width: 100
    },
    {
      title: 'Current Review Step',
      key: 'currentStep',
      render: (_, record) => {
        if (record.approvalChain && record.approvalChain.length > 0) {
          const currentStep = record.approvalChain.find(step => step.status === 'pending');
          if (currentStep) {
            return (
              <div>
                <Text style={{ fontSize: '11px' }}>
                  {currentStep.approver?.name || 'Unknown'}
                </Text>
                <br />
                <Text type="secondary" style={{ fontSize: '10px' }}>
                  {currentStep.approver?.role || 'Reviewer'}
                </Text>
              </div>
            );
          }
        }
        return <Text type="secondary" style={{ fontSize: '11px' }}>N/A</Text>;
      },
      width: 120
    },
    {
      title: 'Reported',
      dataIndex: 'reportedDate',
      key: 'reportedDate',
      render: (date) => (
        <div>
          <div style={{ fontSize: '12px' }}>
            {new Date(date).toLocaleDateString()}
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
                <FileTextOutlined style={{ fontSize: '16px' }} />
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
            type="link" 
            icon={<EyeOutlined />}
            onClick={() => navigate(`/employee/incident-reports/${record._id}`)}
            size="small"
          >
            View
          </Button>
          
          {record.status === 'pending_supervisor' && (
            <>
              <Button 
                type="link" 
                icon={<EditOutlined />}
                onClick={() => handleEdit(record._id)}
                size="small"
              >
                Edit
              </Button>
              <Button 
                type="link" 
                danger
                icon={<DeleteOutlined />}
                onClick={() => handleDelete(record._id, record.reportNumber)}
                size="small"
              >
                Delete
              </Button>
            </>
          )}
        </Space>
      ),
      width: 120
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
        <Col xs={12} sm={6}>
          <Card size="small">
            <div style={{ textAlign: 'center' }}>
              <Text type="secondary">Total Reports</Text>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1890ff' }}>
                {stats.total}
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <div style={{ textAlign: 'center' }}>
              <Text type="secondary">Pending Review</Text>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#faad14' }}>
                {stats.pending}
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <div style={{ textAlign: 'center' }}>
              <Text type="secondary">Resolved</Text>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#52c41a' }}>
                {stats.resolved}
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <div style={{ textAlign: 'center' }}>
              <Text type="secondary">With Injuries</Text>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ff4d4f' }}>
                {stats.withInjuries}
              </div>
            </div>
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
            <SafetyCertificateOutlined /> My Incident Reports
          </Title>
          <Space>
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
              onClick={() => navigate('/employee/incident-reports/new')}
            >
              Report New Incident
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
                <Select.Option value="pending_supervisor">Pending Supervisor</Select.Option>
                <Select.Option value="pending_hr_review">Pending HR</Select.Option>
                <Select.Option value="under_investigation">Investigating</Select.Option>
                <Select.Option value="resolved">Resolved</Select.Option>
                <Select.Option value="rejected">Rejected</Select.Option>
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
                <Select.Option value="security">Security</Select.Option>
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

        {/* Safety Guidelines Alert */}
        <Alert
          message="Important Safety Reminder"
          description="Report all incidents, injuries, near misses, and safety hazards immediately. Your reports help us maintain a safe workplace for everyone."
          type="info"
          showIcon
          style={{ marginBottom: '16px' }}
        />

        {filteredReports.length === 0 ? (
          <Alert
            message="No Incident Reports Found"
            description={
              reports.length === 0 
                ? "You haven't submitted any incident reports yet. If you witness or experience any workplace incidents, please report them immediately."
                : "No reports match your current filter criteria. Try adjusting the filters above."
            }
            type="info"
            showIcon
            style={{ marginBottom: '16px' }}
            action={
              reports.length === 0 ? (
                <Button 
                  type="primary" 
                  size="small"
                  onClick={() => navigate('/employee/incident-reports/new')}
                >
                  Report Incident
                </Button>
              ) : null
            }
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
                  return 'high-priority-row';
                }
                if (['pending_supervisor', 'pending_hr_review'].includes(record.status)) {
                  return 'pending-row';
                }
                return '';
              }}
            />
          </>
        )}
      </Card>

      <style jsx>{`
        .high-priority-row {
          background-color: #fff2f0 !important;
          border-left: 4px solid #ff4d4f !important;
        }
        .high-priority-row:hover {
          background-color: #ffe7e6 !important;
        }
        .pending-row {
          background-color: #fffbf0 !important;
          border-left: 3px solid #faad14 !important;
        }
        .pending-row:hover {
          background-color: #fff1d6 !important;
        }
      `}</style>
    </div>
  );
};

export default EmployeeIncidentReports;


