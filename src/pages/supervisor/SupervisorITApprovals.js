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
  Tooltip,
  Modal,
  Form,
  Input,
  Row,
  Col,
  message,
  Progress,
  Divider,
  Badge,
  Statistic
} from 'antd';
import { 
  LaptopOutlined, 
  CheckCircleOutlined, 
  CloseCircleOutlined, 
  ClockCircleOutlined,
  EyeOutlined,
  ReloadOutlined,
  ShoppingCartOutlined,
  BugOutlined,
  DesktopOutlined,
  PhoneOutlined,
  PrinterOutlined,
  WifiOutlined,
  WarningOutlined,
  DollarCircleOutlined,
  TeamOutlined
} from '@ant-design/icons';
import { itSupportAPI } from '../../services/api';
import { useSelector } from 'react-redux';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const SupervisorITApprovals = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    fetchPendingRequests();
  }, []);

  const fetchPendingRequests = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('Fetching supervisor IT requests...');
      const response = await itSupportAPI.getSupervisorRequests();
      
      if (response?.success && response?.data) {
        setRequests(Array.isArray(response.data) ? response.data : []);
      } else {
        console.warn('Unexpected response structure:', response);
        setRequests([]);
      }
    } catch (error) {
      console.error('Error fetching supervisor IT requests:', error);
      setError(error.response?.data?.message || error.message || 'Failed to fetch IT support requests');
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApprovalDecision = async (values) => {
    try {
      setLoading(true);
      
      const decision = {
        decision: values.decision,
        comments: values.comments || ''
      };

      console.log('Processing supervisor decision:', decision);
      const response = await itSupportAPI.processSupervisorDecision(selectedRequest._id, decision);
      
      if (response.success) {
        message.success(`Request ${values.decision} successfully`);
        setModalVisible(false);
        setSelectedRequest(null);
        form.resetFields();
        await fetchPendingRequests();
      } else {
        throw new Error(response.message || 'Failed to process decision');
      }
    } catch (error) {
      console.error('Error processing supervisor decision:', error);
      message.error(error.response?.data?.message || error.message || 'Failed to process decision');
    } finally {
      setLoading(false);
    }
  };

  const getStatusTag = (status) => {
    const statusMap = {
      'pending_supervisor': { 
        color: 'orange', 
        icon: <ClockCircleOutlined />, 
        text: 'Pending Your Approval' 
      },
      'supervisor_approved': { 
        color: 'green', 
        icon: <CheckCircleOutlined />, 
        text: 'Approved' 
      },
      'supervisor_rejected': { 
        color: 'red', 
        icon: <CloseCircleOutlined />, 
        text: 'Rejected' 
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

    const priorityInfo = priorityMap[priority] || { color: 'default', text: priority, icon: '📋' };

    return (
      <Tag color={priorityInfo.color}>
        {priorityInfo.icon} {priorityInfo.text}
      </Tag>
    );
  };

  const getRequestTypeIcon = (type, category) => {
    if (type === 'material_request') {
      return <ShoppingCartOutlined style={{ color: '#1890ff' }} />;
    }
    
    const categoryIcons = {
      'hardware': <DesktopOutlined style={{ color: '#722ed1' }} />,
      'software': <BugOutlined style={{ color: '#fa8c16' }} />,
      'network': <WifiOutlined style={{ color: '#13c2c2' }} />,
      'printer': <PrinterOutlined style={{ color: '#52c41a' }} />,
      'mobile': <PhoneOutlined style={{ color: '#eb2f96' }} />,
      'other': <LaptopOutlined style={{ color: '#666' }} />
    };

    return categoryIcons[category] || <BugOutlined style={{ color: '#fa8c16' }} />;
  };

  const getTotalCost = (request) => {
    if (request.requestType === 'material_request' && request.requestedItems) {
      return request.requestedItems.reduce((total, item) => {
        return total + ((item.estimatedCost || 0) * (item.quantity || 1));
      }, 0);
    }
    return 0;
  };

  const columns = [
    {
      title: 'Ticket #',
      dataIndex: 'ticketNumber',
      key: 'ticketNumber',
      render: (ticketNumber) => (
        <Text code style={{ fontSize: '12px' }}>{ticketNumber}</Text>
      ),
      width: 120
    },
    {
      title: 'Request Details',
      key: 'requestDetails',
      render: (_, record) => (
        <div>
          <Space style={{ marginBottom: '4px' }}>
            {getRequestTypeIcon(record.requestType, record.category)}
            <Text strong style={{ fontSize: '13px' }}>{record.title}</Text>
          </Space>
          <br />
          <Text type="secondary" style={{ fontSize: '11px' }}>
            {record.requestType === 'material_request' ? '🛒 Material Request' : '🔧 Technical Issue'}
          </Text>
          <br />
          <Tooltip title={record.description}>
            <Text ellipsis style={{ fontSize: '11px', color: '#666', display: 'block', maxWidth: '250px' }}>
              {record.description && record.description.length > 60 ? 
                `${record.description.substring(0, 60)}...` : 
                record.description
              }
            </Text>
          </Tooltip>
        </div>
      ),
      width: 270
    },
    {
      title: 'Employee',
      key: 'employee',
      render: (_, record) => (
        <div>
          <Text strong style={{ fontSize: '12px' }}>
            {record.employee?.fullName || 'N/A'}
          </Text>
          <br />
          <Text type="secondary" style={{ fontSize: '11px' }}>
            {record.employee?.department || record.department || 'N/A'}
          </Text>
          <br />
          <Text type="secondary" style={{ fontSize: '10px' }}>
            {record.employee?.email || 'N/A'}
          </Text>
        </div>
      ),
      width: 150
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority) => getPriorityTag(priority),
      width: 100
    },
    {
      title: 'Category',
      key: 'category',
      render: (_, record) => (
        <div>
          <Tag color="blue" style={{ fontSize: '11px' }}>
            {record.category?.toUpperCase()}
          </Tag>
          {record.subcategory && (
            <>
              <br />
              <Text type="secondary" style={{ fontSize: '10px' }}>
                {record.subcategory}
              </Text>
            </>
          )}
        </div>
      ),
      width: 100
    },
    {
      title: 'Est. Cost',
      key: 'estimatedCost',
      render: (_, record) => {
        if (record.requestType === 'material_request') {
          const totalCost = getTotalCost(record);
          return (
            <div>
              <Text strong style={{ fontSize: '12px', color: totalCost > 50000 ? '#fa8c16' : '#666' }}>
                XAF {totalCost.toLocaleString()}
              </Text>
              {totalCost > 100000 && (
                <>
                  <br />
                  <Text type="secondary" style={{ fontSize: '10px' }}>
                    ⚠️ High Cost
                  </Text>
                </>
              )}
            </div>
          );
        }
        return <Text type="secondary">N/A</Text>;
      },
      width: 120
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => getStatusTag(status),
      width: 140
    },
    {
      title: 'Submitted',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => (
        <div>
          <div style={{ fontSize: '12px' }}>
            {dayjs(date).format('MMM DD, YYYY')}
          </div>
          <div style={{ fontSize: '10px', color: '#666' }}>
            {dayjs(date).fromNow()}
          </div>
        </div>
      ),
      sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
      defaultSortOrder: 'descend',
      width: 100
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
              onClick={() => navigate(`/supervisor/it-support/${record._id}`)}
              size="small"
            />
          </Tooltip>
          {record.status === 'pending_supervisor' && (
            <Tooltip title="Review & Approve">
              <Button 
                type="primary" 
                size="small"
                onClick={() => {
                  setSelectedRequest(record);
                  setModalVisible(true);
                }}
              >
                Review
              </Button>
            </Tooltip>
          )}
        </Space>
      ),
      width: 120
    }
  ];

  const getStatsCards = () => {
    const totalRequests = requests.length;
    const pendingRequests = requests.filter(r => r.status === 'pending_supervisor').length;
    const approvedToday = requests.filter(r => 
      r.status === 'supervisor_approved' && 
      dayjs(r.updatedAt).isAfter(dayjs().startOf('day'))
    ).length;
    const materialRequests = requests.filter(r => r.requestType === 'material_request').length;
    const technicalIssues = requests.filter(r => r.requestType === 'technical_issue').length;
    const criticalIssues = requests.filter(r => r.priority === 'critical').length;

    return (
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col xs={12} sm={8} md={4}>
          <Card size="small">
            <Statistic
              title="Total Requests"
              value={totalRequests}
              valueStyle={{ color: '#1890ff' }}
              prefix={<LaptopOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card size="small">
            <Statistic
              title="Pending Review"
              value={pendingRequests}
              valueStyle={{ color: '#faad14' }}
              prefix={<ClockCircleOutlined />}
            />
            {pendingRequests > 0 && (
              <Badge count={pendingRequests} offset={[8, -2]} />
            )}
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card size="small">
            <Statistic
              title="Approved Today"
              value={approvedToday}
              valueStyle={{ color: '#52c41a' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card size="small">
            <Statistic
              title="Material Requests"
              value={materialRequests}
              valueStyle={{ color: '#13c2c2' }}
              prefix={<ShoppingCartOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card size="small">
            <Statistic
              title="Technical Issues"
              value={technicalIssues}
              valueStyle={{ color: '#722ed1' }}
              prefix={<BugOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card size="small">
            <Statistic
              title="Critical Issues"
              value={criticalIssues}
              valueStyle={{ color: criticalIssues > 0 ? '#ff4d4f' : '#52c41a' }}
              prefix={<WarningOutlined />}
            />
          </Card>
        </Col>
      </Row>
    );
  };

  if (loading && requests.length === 0) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Spin size="large" />
        <div style={{ marginTop: '16px' }}>Loading IT support requests...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <Title level={2} style={{ margin: 0 }}>
            <LaptopOutlined /> IT Support Approvals
          </Title>
          <Space>
            <Button 
              icon={<ReloadOutlined />}
              onClick={fetchPendingRequests}
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

        {/* Supervisor Guidelines */}
        <Alert
          message="Supervisor Approval Guidelines"
          description={
            <div>
              <p><strong>Material Requests:</strong> Review business justification, cost estimates, and employee needs. Consider budget constraints and alternative solutions.</p>
              <p><strong>Technical Issues:</strong> Assess impact on productivity, urgency level, and priority based on business operations.</p>
              <p><strong>High-Cost Items:</strong> Items over XAF 100,000 will require additional finance approval after your approval.</p>
            </div>
          }
          type="info"
          showIcon
          style={{ marginBottom: '16px' }}
        />

        {requests.length === 0 ? (
          <Alert
            message="No IT Support Requests"
            description="There are no IT support requests pending your approval at this time."
            type="info"
            showIcon
          />
        ) : (
          <>
            <Text type="secondary" style={{ marginBottom: '8px', display: 'block' }}>
              Showing {requests.length} requests requiring your approval
            </Text>
            
            <Table 
              columns={columns} 
              dataSource={requests} 
              loading={loading}
              rowKey="_id"
              pagination={{ 
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) => 
                  `${range[0]}-${range[1]} of ${total} requests`
              }}
              scroll={{ x: 'max-content' }}
              rowClassName={(record) => {
                if (record.priority === 'critical') {
                  return 'critical-priority-row';
                }
                if (record.priority === 'high') {
                  return 'high-priority-row';
                }
                if (record.status === 'pending_supervisor') {
                  return 'pending-row';
                }
                return '';
              }}
            />
          </>
        )}
      </Card>

      {/* Approval Modal */}
      <Modal
        title={`Review IT Request: ${selectedRequest?.ticketNumber}`}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setSelectedRequest(null);
          form.resetFields();
        }}
        footer={null}
        width={800}
      >
        {selectedRequest && (
          <div>
            {/* Request Summary */}
            <Card size="small" style={{ marginBottom: '16px' }}>
              <Row gutter={16}>
                <Col span={12}>
                  <Text strong>Employee:</Text> {selectedRequest.employee?.fullName}
                  <br />
                  <Text strong>Department:</Text> {selectedRequest.employee?.department}
                  <br />
                  <Text strong>Type:</Text> {selectedRequest.requestType === 'material_request' ? 'Material Request' : 'Technical Issue'}
                </Col>
                <Col span={12}>
                  <Text strong>Priority:</Text> {getPriorityTag(selectedRequest.priority)}
                  <br />
                  <Text strong>Category:</Text> {selectedRequest.category}
                  <br />
                  {selectedRequest.requestType === 'material_request' && (
                    <>
                      <Text strong>Total Cost:</Text> XAF {getTotalCost(selectedRequest).toLocaleString()}
                    </>
                  )}
                </Col>
              </Row>
            </Card>

            {/* Request Details */}
            <div style={{ marginBottom: '16px' }}>
              <Text strong>Description:</Text>
              <div style={{ padding: '8px', backgroundColor: '#fafafa', borderRadius: '4px', marginTop: '4px' }}>
                {selectedRequest.description}
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <Text strong>Business Justification:</Text>
              <div style={{ padding: '8px', backgroundColor: '#fafafa', borderRadius: '4px', marginTop: '4px' }}>
                {selectedRequest.businessJustification || 'Not provided'}
              </div>
            </div>

            {/* Material Items (if applicable) */}
            {selectedRequest.requestType === 'material_request' && selectedRequest.requestedItems && (
              <div style={{ marginBottom: '16px' }}>
                <Text strong>Requested Items:</Text>
                <div style={{ marginTop: '8px' }}>
                  {selectedRequest.requestedItems.map((item, index) => (
                    <div key={index} style={{ 
                      padding: '8px', 
                      backgroundColor: '#f6ffed', 
                      borderRadius: '4px', 
                      border: '1px solid #b7eb8f',
                      marginBottom: '8px'
                    }}>
                      <Text strong>{item.item}</Text>
                      <br />
                      <Text type="secondary">
                        {item.brand} {item.model} | Qty: {item.quantity} | Est. Cost: XAF {(item.estimatedCost || 0).toLocaleString()}
                      </Text>
                      {item.justification && (
                        <>
                          <br />
                          <Text style={{ fontSize: '12px' }}>Justification: {item.justification}</Text>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Divider />

            {/* Decision Form */}
            <Form
              form={form}
              layout="vertical"
              onFinish={handleApprovalDecision}
            >
              <Form.Item
                name="decision"
                label="Your Decision"
                rules={[{ required: true, message: 'Please select your decision' }]}
              >
                <div>
                  <Button 
                    type="primary" 
                    size="large"
                    icon={<CheckCircleOutlined />}
                    onClick={() => {
                      form.setFieldsValue({ decision: 'approved' });
                      form.submit();
                    }}
                    style={{ marginRight: '8px', backgroundColor: '#52c41a', borderColor: '#52c41a' }}
                    loading={loading}
                  >
                    Approve Request
                  </Button>
                  <Button 
                    danger 
                    size="large"
                    icon={<CloseCircleOutlined />}
                    onClick={() => form.setFieldsValue({ decision: 'rejected' })}
                    loading={loading}
                  >
                    Reject Request
                  </Button>
                </div>
              </Form.Item>

              <Form.Item
                name="comments"
                label="Comments (Optional)"
                rules={[
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (getFieldValue('decision') === 'rejected' && !value) {
                        return Promise.reject(new Error('Please provide a reason for rejection'));
                      }
                      return Promise.resolve();
                    },
                  }),
                ]}
              >
                <TextArea
                  rows={3}
                  placeholder="Add any comments or feedback for the employee..."
                  showCount
                  maxLength={500}
                />
              </Form.Item>

              {form.getFieldValue('decision') === 'rejected' && (
                <Form.Item>
                  <Button type="primary" danger htmlType="submit" loading={loading}>
                    Confirm Rejection
                  </Button>
                </Form.Item>
              )}
            </Form>
          </div>
        )}
      </Modal>

      <style jsx>{`
        .critical-priority-row {
          background-color: #fff1f0 !important;
          border-left: 4px solid #ff4d4f !important;
        }
        .critical-priority-row:hover {
          background-color: #ffe7e6 !important;
        }
        .high-priority-row {
          background-color: #fff7e6 !important;
          border-left: 3px solid #fa8c16 !important;
        }
        .high-priority-row:hover {
          background-color: #fff1d6 !important;
        }
        .pending-row {
          background-color: #fffbf0 !important;
          border-left: 2px solid #faad14 !important;
        }
        .pending-row:hover {
          background-color: #fff8e1 !important;
        }
      `}</style>
    </div>
  );
};

export default SupervisorITApprovals;