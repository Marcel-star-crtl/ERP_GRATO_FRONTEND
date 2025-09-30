import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
  Card,
  Form,
  Button,
  message,
  Typography,
  Space,
  Alert,
  Row,
  Col,
  Steps,
  Tag,
  Table,
  Modal,
  Radio,
  Descriptions,
  Progress,
  Statistic,
  Tabs,
  Input
} from 'antd';
import {
  MedicineBoxOutlined,
  UserOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  EyeOutlined,
  ReloadOutlined,
  TeamOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { TabPane } = Tabs;

// Supervisor Sick Leave Approvals Component
const SupervisorSickLeaveApprovals = () => {
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [approvalModalVisible, setApprovalModalVisible] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [activeTab, setActiveTab] = useState('pending');
  const [approvalForm] = Form.useForm();
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0, total: 0 });

  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    fetchSickLeaveRequests();
  }, []);

  const fetchSickLeaveRequests = async () => {
    setLoading(true);
    try {
      // Mock data for demonstration
      const mockRequests = [
        {
          _id: '1',
          leaveId: 'SL-2024-001',
          employee: { fullName: 'John Doe', department: 'Finance', position: 'Senior Accountant' },
          leaveType: 'sick_leave',
          startDate: '2024-08-20T00:00:00Z',
          endDate: '2024-08-22T23:59:59Z',
          totalDays: 3,
          reason: 'Flu symptoms - fever, cough, and body aches. Doctor advised rest.',
          status: 'pending_supervisor',
          submittedAt: '2024-08-18T14:30:00Z',
          urgency: 'medium',
          medicalCertificate: { provided: true, fileName: 'medical_cert.pdf' },
          doctorDetails: { name: 'Dr. Sarah Mbeki', hospital: 'Douala General Hospital' }
        },
        {
          _id: '2',
          leaveId: 'SL-2024-002',
          employee: { fullName: 'Sarah Wilson', department: 'IT', position: 'Software Developer' },
          leaveType: 'mental_health',
          startDate: '2024-08-15T00:00:00Z',
          endDate: '2024-08-17T23:59:59Z',
          totalDays: 3,
          reason: 'Experiencing high stress levels and anxiety.',
          status: 'approved',
          submittedAt: '2024-08-12T09:15:00Z',
          urgency: 'high',
          medicalCertificate: { provided: true, fileName: 'mental_health_cert.pdf' },
          supervisorReview: { decision: 'approved', comments: 'Mental health is important. Approved.' }
        }
      ];

      setLeaveRequests(mockRequests);
      setStats({
        pending: mockRequests.filter(r => r.status === 'pending_supervisor').length,
        approved: mockRequests.filter(r => r.status === 'approved').length,
        rejected: mockRequests.filter(r => r.status === 'rejected').length,
        total: mockRequests.length
      });
    } catch (error) {
      message.error('Failed to fetch sick leave requests');
    } finally {
      setLoading(false);
    }
  };

  const handleApprovalDecision = async (values) => {
    try {
      setLoading(true);
      
      const updatedRequests = leaveRequests.map(req =>
        req._id === selectedLeave._id
          ? {
              ...req,
              status: values.decision === 'approved' ? 'approved' : 'rejected',
              supervisorReview: {
                decision: values.decision,
                comments: values.comments,
                reviewedAt: new Date().toISOString(),
                reviewedBy: user.fullName
              }
            }
          : req
      );

      setLeaveRequests(updatedRequests);
      setApprovalModalVisible(false);
      approvalForm.resetFields();
      setSelectedLeave(null);

      const actionText = values.decision === 'approved' ? 'approved' : 'rejected';
      message.success(`Sick leave request ${actionText} successfully`);

      // Update stats
      setStats({
        pending: updatedRequests.filter(r => r.status === 'pending_supervisor').length,
        approved: updatedRequests.filter(r => r.status === 'approved').length,
        rejected: updatedRequests.filter(r => r.status === 'rejected').length,
        total: updatedRequests.length
      });
      
    } catch (error) {
      message.error('Failed to process approval decision');
    } finally {
      setLoading(false);
    }
  };

  const getStatusTag = (status) => {
    const statusMap = {
      'pending_supervisor': { color: 'orange', text: 'Pending Your Approval', icon: <ClockCircleOutlined /> },
      'approved': { color: 'green', text: 'Approved', icon: <CheckCircleOutlined /> },
      'rejected': { color: 'red', text: 'Rejected', icon: <CloseCircleOutlined /> },
      'pending_hr': { color: 'blue', text: 'Pending HR', icon: <ClockCircleOutlined /> }
    };

    const config = statusMap[status] || { color: 'default', text: status };
    return <Tag color={config.color} icon={config.icon}>{config.text}</Tag>;
  };

  const getUrgencyTag = (urgency) => {
    const urgencyMap = {
      'critical': { color: 'red', text: 'Critical' },
      'high': { color: 'orange', text: 'High' },
      'medium': { color: 'yellow', text: 'Medium' },
      'low': { color: 'green', text: 'Low' }
    };
    const urgencyInfo = urgencyMap[urgency] || { color: 'default', text: urgency };
    return <Tag color={urgencyInfo.color}>{urgencyInfo.text}</Tag>;
  };

  const getLeaveTypeTag = (type) => {
    const typeMap = {
      'sick_leave': { color: 'red', text: 'Sick Leave' },
      'mental_health': { color: 'purple', text: 'Mental Health' },
      'emergency_leave': { color: 'orange', text: 'Emergency' },
      'medical_appointment': { color: 'blue', text: 'Medical Appointment' }
    };
    const typeInfo = typeMap[type] || { color: 'default', text: type };
    return <Tag color={typeInfo.color}>{typeInfo.text}</Tag>;
  };

  const columns = [
    {
      title: 'Employee',
      key: 'employee',
      render: (_, record) => (
        <div>
          <Text strong>{record.employee.fullName}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.employee.position}
          </Text>
          <br />
          <Tag color="blue" size="small">{record.employee.department}</Tag>
        </div>
      ),
      width: 200
    },
    {
      title: 'Leave Details',
      key: 'leaveDetails',
      render: (_, record) => (
        <div>
          {getLeaveTypeTag(record.leaveType)}
          <br />
          <Text strong style={{ fontSize: '13px', display: 'block', marginTop: '4px' }}>
            {dayjs(record.startDate).format('MMM DD')} - {dayjs(record.endDate).format('MMM DD, YYYY')}
          </Text>
          <Text type="secondary" style={{ fontSize: '11px' }}>
            Duration: {record.totalDays} {record.totalDays === 1 ? 'day' : 'days'}
          </Text>
        </div>
      ),
      width: 180
    },
    {
      title: 'Medical Info',
      key: 'medicalInfo',
      render: (_, record) => (
        <div>
          <div style={{ marginBottom: '4px' }}>
            <Text strong style={{ fontSize: '11px' }}>Doctor:</Text>
            <br />
            <Text style={{ fontSize: '10px' }}>{record.doctorDetails?.name}</Text>
          </div>
          <div>
            {record.medicalCertificate?.provided ? (
              <Tag color="green" size="small">Certificate Provided</Tag>
            ) : (
              <Tag color="orange" size="small">No Certificate</Tag>
            )}
          </div>
        </div>
      ),
      width: 150
    },
    {
      title: 'Urgency',
      dataIndex: 'urgency',
      key: 'urgency',
      render: (urgency) => getUrgencyTag(urgency),
      width: 100
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => getStatusTag(status),
      width: 160
    },
    {
      title: 'Submitted',
      dataIndex: 'submittedAt',
      key: 'submittedAt',
      render: (date) => (
        <div>
          <div style={{ fontSize: '12px' }}>{new Date(date).toLocaleDateString()}</div>
          <div style={{ fontSize: '10px', color: '#666' }}>{dayjs(date).fromNow()}</div>
        </div>
      ),
      width: 100
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="small">
          <Button 
            size="small" 
            icon={<EyeOutlined />}
            onClick={() => {
              setSelectedLeave(record);
              setDetailsModalVisible(true);
            }}
          >
            View
          </Button>
          {record.status === 'pending_supervisor' && (
            <Button 
              size="small" 
              type="primary"
              onClick={() => {
                setSelectedLeave(record);
                setApprovalModalVisible(true);
              }}
            >
              Review
            </Button>
          )}
        </Space>
      ),
      width: 120
    }
  ];

  const getFilteredRequests = () => {
    return leaveRequests.filter(request => {
      switch (activeTab) {
        case 'pending':
          return request.status === 'pending_supervisor';
        case 'approved':
          return request.status === 'approved';
        case 'rejected':
          return request.status === 'rejected';
        default:
          return true;
      }
    });
  };

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <Title level={2} style={{ margin: 0 }}>
            <TeamOutlined /> Sick Leave Approvals
          </Title>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={fetchSickLeaveRequests} loading={loading}>
              Refresh
            </Button>
          </Space>
        </div>

        {/* Stats Cards */}
        <Row gutter={16} style={{ marginBottom: '24px' }}>
          <Col span={6}>
            <Statistic
              title="Pending Your Approval"
              value={stats.pending}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="Approved by You"
              value={stats.approved}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="Rejected by You"
              value={stats.rejected}
              prefix={<CloseCircleOutlined />}
              valueStyle={{ color: '#f5222d' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="Total Requests"
              value={stats.total}
              prefix={<MedicineBoxOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Col>
        </Row>

        {/* Pending Actions Alert */}
        {stats.pending > 0 && (
          <Alert
            message={`${stats.pending} sick leave request(s) require your approval`}
            type="warning"
            showIcon
            style={{ marginBottom: '16px' }}
            action={
              <Button size="small" type="primary" onClick={() => setActiveTab('pending')}>
                Review Now
              </Button>
            }
          />
        )}

        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab={`Pending Approval (${stats.pending})`} key="pending" />
          <TabPane tab={`Approved (${stats.approved})`} key="approved" />
          <TabPane tab={`Rejected (${stats.rejected})`} key="rejected" />
        </Tabs>

        <Table
          columns={columns}
          dataSource={getFilteredRequests()}
          loading={loading}
          rowKey="_id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} requests`
          }}
          scroll={{ x: 1200 }}
          size="small"
          rowClassName={(record) => {
            if (record.urgency === 'critical') return 'critical-leave-row';
            if (record.status === 'pending_supervisor') return 'pending-approval-row';
            return '';
          }}
        />
      </Card>

      {/* Details Modal */}
      <Modal
        title={`Sick Leave Details - ${selectedLeave?.leaveId}`}
        open={detailsModalVisible}
        onCancel={() => {
          setDetailsModalVisible(false);
          setSelectedLeave(null);
        }}
        footer={null}
        width={900}
      >
        {selectedLeave && (
          <div>
            <Descriptions bordered column={2} size="small" style={{ marginBottom: '20px' }}>
              <Descriptions.Item label="Employee">
                <Text strong>{selectedLeave.employee.fullName}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Department">
                <Tag color="blue">{selectedLeave.employee.department}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Leave Type">
                {getLeaveTypeTag(selectedLeave.leaveType)}
              </Descriptions.Item>
              <Descriptions.Item label="Urgency">
                {getUrgencyTag(selectedLeave.urgency)}
              </Descriptions.Item>
              <Descriptions.Item label="Duration">
                {selectedLeave.totalDays} {selectedLeave.totalDays === 1 ? 'day' : 'days'}
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                {getStatusTag(selectedLeave.status)}
              </Descriptions.Item>
              <Descriptions.Item label="Leave Period" span={2}>
                {dayjs(selectedLeave.startDate).format('MMMM DD, YYYY')} - {dayjs(selectedLeave.endDate).format('MMMM DD, YYYY')}
              </Descriptions.Item>
              <Descriptions.Item label="Reason" span={2}>
                {selectedLeave.reason}
              </Descriptions.Item>
            </Descriptions>

            {selectedLeave.doctorDetails && (
              <Card size="small" title="Medical Information" style={{ marginBottom: '16px' }}>
                <Descriptions column={2} size="small">
                  <Descriptions.Item label="Doctor">{selectedLeave.doctorDetails.name}</Descriptions.Item>
                  <Descriptions.Item label="Hospital">{selectedLeave.doctorDetails.hospital}</Descriptions.Item>
                  <Descriptions.Item label="Medical Certificate">
                    {selectedLeave.medicalCertificate?.provided ? (
                      <Tag color="green">Provided - {selectedLeave.medicalCertificate.fileName}</Tag>
                    ) : (
                      <Tag color="orange">Not Provided</Tag>
                    )}
                  </Descriptions.Item>
                </Descriptions>
              </Card>
            )}

            {selectedLeave.supervisorReview && (
              <Card size="small" title="Supervisor Review">
                <Descriptions column={1} size="small">
                  <Descriptions.Item label="Decision">
                    <Tag color={selectedLeave.supervisorReview.decision === 'approved' ? 'green' : 'red'}>
                      {selectedLeave.supervisorReview.decision.toUpperCase()}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Reviewed By">
                    {selectedLeave.supervisorReview.reviewedBy}
                  </Descriptions.Item>
                  <Descriptions.Item label="Review Date">
                    {dayjs(selectedLeave.supervisorReview.reviewedAt).format('MMMM DD, YYYY HH:mm')}
                  </Descriptions.Item>
                  <Descriptions.Item label="Comments">
                    {selectedLeave.supervisorReview.comments}
                  </Descriptions.Item>
                </Descriptions>
              </Card>
            )}
          </div>
        )}
      </Modal>

      {/* Approval Modal */}
      <Modal
        title={`Approve Sick Leave - ${selectedLeave?.leaveId}`}
        open={approvalModalVisible}
        onCancel={() => {
          setApprovalModalVisible(false);
          setSelectedLeave(null);
          approvalForm.resetFields();
        }}
        footer={null}
        width={700}
      >
        {selectedLeave && (
          <div>
            <Alert
              message="Review Required"
              description="Please review and make a decision on this sick leave request."
              type="info"
              showIcon
              style={{ marginBottom: '16px' }}
            />

            <Descriptions bordered column={2} size="small" style={{ marginBottom: '20px' }}>
              <Descriptions.Item label="Employee">
                <Text strong>{selectedLeave.employee.fullName}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Department">
                <Tag color="blue">{selectedLeave.employee.department}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Leave Type">
                {getLeaveTypeTag(selectedLeave.leaveType)}
              </Descriptions.Item>
              <Descriptions.Item label="Urgency">
                {getUrgencyTag(selectedLeave.urgency)}
              </Descriptions.Item>
              <Descriptions.Item label="Duration">
                {selectedLeave.totalDays} {selectedLeave.totalDays === 1 ? 'day' : 'days'}
              </Descriptions.Item>
              <Descriptions.Item label="Medical Certificate">
                {selectedLeave.medicalCertificate?.provided ? (
                  <Tag color="green">Provided</Tag>
                ) : (
                  <Tag color="orange">Not Provided</Tag>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Reason" span={2}>
                {selectedLeave.reason}
              </Descriptions.Item>
            </Descriptions>

            <Form
              form={approvalForm}
              layout="vertical"
              onFinish={handleApprovalDecision}
            >
              <Form.Item
                name="decision"
                label="Your Decision"
                rules={[{ required: true, message: 'Please make a decision' }]}
              >
                <Radio.Group>
                  <Radio.Button value="approved" style={{ color: '#52c41a' }}>
                    <CheckCircleOutlined /> Approve Request
                  </Radio.Button>
                  <Radio.Button value="rejected" style={{ color: '#f5222d' }}>
                    <CloseCircleOutlined /> Reject Request
                  </Radio.Button>
                </Radio.Group>
              </Form.Item>

              <Form.Item
                name="comments"
                label="Comments"
                rules={[{ required: true, message: 'Please provide comments for your decision' }]}
              >
                <TextArea 
                  rows={4} 
                  placeholder="Explain your decision (required for audit trail)..."
                  showCount
                  maxLength={500}
                />
              </Form.Item>

              <Form.Item>
                <Space>
                  <Button onClick={() => {
                    setApprovalModalVisible(false);
                    setSelectedLeave(null);
                    approvalForm.resetFields();
                  }}>
                    Cancel
                  </Button>
                  <Button type="primary" htmlType="submit" loading={loading}>
                    Submit Decision
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>

      {/* Custom CSS for row styling */}
      <style jsx>{`
        .critical-leave-row {
          background-color: #fff1f0 !important;
          border-left: 4px solid #ff4d4f !important;
        }
        .critical-leave-row:hover {
          background-color: #ffe7e6 !important;
        }
        .pending-approval-row {
          background-color: #fffbf0 !important;
          border-left: 3px solid #faad14 !important;
        }
        .pending-approval-row:hover {
          background-color: #fff1d6 !important;
        }
      `}</style>
    </div>
  );
};

export default SupervisorSickLeaveApprovals;
