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
  Statistic,
  Select
} from 'antd';
import { 
  LaptopOutlined, 
  CheckCircleOutlined, 
  CloseCircleOutlined, 
  ClockCircleOutlined,
  EyeOutlined,
  ReloadOutlined,
  TeamOutlined,
  ToolOutlined,
  WarningOutlined
} from '@ant-design/icons';
import { itSupportAPI } from '../../services/api';
import { useSelector } from 'react-redux';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const ITDepartmentApprovals = () => {
  const [requests, setRequests] = useState([]);
  const [stats, setStats] = useState(null); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();
  const navigate = useNavigate();
  
  // Safe Redux state access with comprehensive fallbacks
  const auth = useSelector((state) => {
    if (!state) return {};
    return state.auth || {};
  });
  const user = auth?.user || null;

  useEffect(() => {
    if (user) {
      fetchITRequests();
      fetchDashboardStats();
    } else {
      setError('User not authenticated');
      setLoading(false);
    }
  }, [user]);

  const fetchDashboardStats = async () => {
    try {
      const response = await itSupportAPI.getDashboardStats();
      if (response?.success && response?.data) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      // Don't set error state, just log it
    }
  };

  const fetchITRequests = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('Fetching IT department requests...');
      const response = await itSupportAPI.getITDepartmentRequests();
      
      if (response?.success && response?.data) {
        const dataArray = Array.isArray(response.data) ? response.data : [];
        setRequests(dataArray);
        console.log(`Loaded ${dataArray.length} IT requests`);
      } else {
        console.warn('Unexpected response structure:', response);
        setRequests([]);
      }
    } catch (error) {
      console.error('Error fetching IT requests:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to fetch IT requests';
      setError(errorMessage);
      setRequests([]);
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleITDecision = async (values) => {
    if (!selectedRequest) {
      message.error('No request selected');
      return;
    }

    if (!values.decision) {
      message.error('Please select a decision');
      return;
    }

    try {
      setLoading(true);
      
      const decision = {
        decision: values.decision,
        comments: values.comments || '',
        estimatedCost: values.estimatedCost ? Number(values.estimatedCost) : 0,
        technicianId: values.technicianId || user?._id || '',
        priorityLevel: values.priorityLevel || selectedRequest.priority || 'medium',
        estimatedCompletionTime: values.estimatedCompletionTime || ''
      };

      console.log('Processing IT decision:', decision);
      const response = await itSupportAPI.processITDepartmentDecision(selectedRequest._id, decision);
      
      if (response?.success) {
        const actionText = values.decision === 'approved' ? 'approved' : 'rejected';
        message.success(`Request ${actionText} successfully`);
        setModalVisible(false);
        setSelectedRequest(null);
        form.resetFields();
        await fetchITRequests();
        await fetchDashboardStats();
      } else {
        throw new Error(response?.message || 'Failed to process decision');
      }
    } catch (error) {
      console.error('Error processing IT decision:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to process decision';
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getStatusTag = (status) => {
    if (!status) return <Tag>Unknown</Tag>;

    const statusMap = {
      'pending_it_approval': { 
        color: 'blue', 
        icon: <ClockCircleOutlined />, 
        text: 'Pending IT Approval' 
      },
      'pending_it_review': { 
        color: 'blue', 
        icon: <ClockCircleOutlined />, 
        text: 'Pending IT Review' 
      },
      'it_approved': { 
        color: 'green', 
        icon: <CheckCircleOutlined />, 
        text: 'IT Approved' 
      },
      'it_rejected': { 
        color: 'red', 
        icon: <CloseCircleOutlined />, 
        text: 'IT Rejected' 
      },
      'it_assigned': { 
        color: 'cyan', 
        icon: <TeamOutlined />, 
        text: 'Assigned to Technician' 
      },
      'in_progress': { 
        color: 'processing', 
        icon: <ToolOutlined />, 
        text: 'Work In Progress' 
      },
      'waiting_parts': { 
        color: 'warning', 
        icon: <WarningOutlined />, 
        text: 'Waiting for Parts' 
      },
      'resolved': { 
        color: 'success', 
        icon: <CheckCircleOutlined />, 
        text: 'Resolved' 
      }
    };

    const statusInfo = statusMap[status] || { 
      color: 'default', 
      icon: <ClockCircleOutlined />,
      text: status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    };

    return (
      <Tag color={statusInfo.color} icon={statusInfo.icon}>
        {statusInfo.text}
      </Tag>
    );
  };

  const columns = [
    {
      title: 'Ticket #',
      dataIndex: 'ticketNumber',
      key: 'ticketNumber',
      render: (ticketNumber) => (
        <Text code style={{ fontSize: '12px' }}>{ticketNumber || 'N/A'}</Text>
      ),
      width: 120
    },
    {
      title: 'Request Details',
      key: 'requestDetails',
      render: (_, record) => (
        <div>
          <Text strong style={{ fontSize: '13px' }}>{record?.title || 'Untitled'}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: '11px' }}>
            {record?.requestType === 'material_request' ? '🛒 Material Request' : '🔧 Technical Issue'}
          </Text>
        </div>
      ),
      width: 200
    },
    {
      title: 'Employee',
      key: 'employee',
      render: (_, record) => (
        <div>
          <Text strong style={{ fontSize: '12px' }}>
            {record?.employee?.fullName || 'N/A'}
          </Text>
          <br />
          <Text type="secondary" style={{ fontSize: '11px' }}>
            {record?.employee?.department || 'N/A'}
          </Text>
        </div>
      ),
      width: 150
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority) => {
        const priorityMap = {
          'critical': { color: 'red', text: 'Critical', icon: '🚨' },
          'high': { color: 'orange', text: 'High', icon: '🔥' },
          'medium': { color: 'yellow', text: 'Medium', icon: '⚡' },
          'low': { color: 'green', text: 'Low', icon: '📝' }
        };
        const info = priorityMap[priority] || { color: 'default', text: priority || 'N/A', icon: '📋' };
        return <Tag color={info.color}>{info.icon} {info.text}</Tag>;
      },
      width: 100
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status, record) => (
        <div>
          {getStatusTag(status)}
          {user && Array.isArray(record?.approvalChain) && record.approvalChain.some(step => 
            step?.approver?.email?.toLowerCase() === user?.email?.toLowerCase() && 
            step?.status === 'pending'
          ) && (
            <div style={{ marginTop: 4 }}>
              <Tag color="gold" size="small">Action Required</Tag>
            </div>
          )}
        </div>
      ),
      width: 160
    },
    {
      title: 'Submitted',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => {
        if (!date) return <Text type="secondary">N/A</Text>;
        return (
          <div>
            <div style={{ fontSize: '12px' }}>
              {dayjs(date).format('MMM DD, YYYY')}
            </div>
            <div style={{ fontSize: '10px', color: '#666' }}>
              {dayjs(date).fromNow()}
            </div>
          </div>
        );
      },
      width: 100
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => {
        if (!user || !record) return null;

        // Check if current user (IT) can approve this request
        const canApprove = Array.isArray(record.approvalChain) && record.approvalChain.some(step => 
          step?.approver?.email?.toLowerCase() === user?.email?.toLowerCase() && 
          step?.status === 'pending' &&
          step?.approver?.role === 'IT Department - Final Approval'
        );

        // Check if request is at IT approval stage
        const isPendingIT = record.status === 'pending_it_approval' || record.status === 'pending_it_review';

        return (
          <Space size="small">
            <Tooltip title="View Details">
              <Button 
                type="link" 
                icon={<EyeOutlined />}
                onClick={() => navigate(`/it/support-requests/${record._id}`)}
                size="small"
              />
            </Tooltip>
            
            {canApprove && isPendingIT && (
              <Tooltip title="Review & Approve IT Request">
                <Button 
                  type="primary" 
                  size="small"
                  icon={<CheckCircleOutlined />}
                  onClick={() => {
                    setSelectedRequest(record);
                    setModalVisible(true);
                  }}
                >
                  Review
                </Button>
              </Tooltip>
            )}
            
            {!canApprove && isPendingIT && (
              <Tooltip title="Waiting for IT approval">
                <Button 
                  type="default" 
                  size="small"
                  disabled
                >
                  Pending IT
                </Button>
              </Tooltip>
            )}

            {record.status === 'it_approved' && (
              <Tooltip title="Assign Technician">
                <Button 
                  type="default" 
                  size="small"
                  icon={<TeamOutlined />}
                  onClick={() => message.info('Technician assignment coming soon')}
                >
                  Assign
                </Button>
              </Tooltip>
            )}
          </Space>
        );
      },
      width: 160,
      fixed: 'right'
    }
  ];

  const getStatsCards = () => {
    const safeRequests = Array.isArray(requests) ? requests : [];
    const pendingApproval = safeRequests.filter(r => 
      r?.status === 'pending_it_approval' || r?.status === 'pending_it_review'
    ).length;
    const approved = safeRequests.filter(r => r?.status === 'it_approved').length;
    const inProgress = safeRequests.filter(r => 
      r?.status === 'in_progress' || r?.status === 'it_assigned'
    ).length;
    const resolved = safeRequests.filter(r => r?.status === 'resolved').length;

    return (
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} md={6}>
          <Card size="small">
            <Statistic
              title="Pending IT Approval"
              value={pendingApproval}
              valueStyle={{ color: '#1890ff' }}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card size="small">
            <Statistic
              title="Approved"
              value={approved}
              valueStyle={{ color: '#52c41a' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card size="small">
            <Statistic
              title="In Progress"
              value={inProgress}
              valueStyle={{ color: '#13c2c2' }}
              prefix={<ToolOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card size="small">
            <Statistic
              title="Resolved"
              value={resolved}
              valueStyle={{ color: '#52c41a' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>
    );
  };

  // Early return if user is not authenticated
  if (!user) {
    return (
      <div style={{ padding: '24px' }}>
        <Alert
          message="Authentication Required"
          description="Please log in to access IT Department Approvals."
          type="warning"
          showIcon
        />
      </div>
    );
  }

  if (loading && (!Array.isArray(requests) || requests.length === 0)) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Spin size="large" />
        <div style={{ marginTop: '16px' }}>Loading IT requests...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
          <Title level={2} style={{ margin: 0 }}>
            <LaptopOutlined /> IT Department Approvals
          </Title>
          <Space>
            <Button 
              icon={<ReloadOutlined />}
              onClick={() => {
                fetchITRequests();
                fetchDashboardStats();
              }}
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

        {getStatsCards()}

        <Alert
          message="IT Department Final Approval"
          description="You are the final approver in the chain. Once you approve, the request will be assigned for implementation."
          type="info"
          showIcon
          style={{ marginBottom: '16px' }}
        />

        {!Array.isArray(requests) || requests.length === 0 ? (
          <Alert
            message="No IT Requests"
            description="There are no IT support requests pending your approval at this time."
            type="info"
            showIcon
          />
        ) : (
          <Table 
            columns={columns} 
            dataSource={requests} 
            loading={loading}
            rowKey={(record) => record?._id || record?.ticketNumber || Math.random().toString()}
            pagination={{ 
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} requests`
            }}
            scroll={{ x: 'max-content' }}
            rowClassName={(record) => {
              if (!record || !user) return '';
              const canApprove = Array.isArray(record.approvalChain) && record.approvalChain.some(step => 
                step?.approver?.email?.toLowerCase() === user?.email?.toLowerCase() && 
                step?.status === 'pending'
              );
              return canApprove ? 'pending-approval-row' : '';
            }}
          />
        )}
      </Card>

      {/* IT Approval Modal */}
      <Modal
        title={`IT Department Approval: ${selectedRequest?.ticketNumber || 'N/A'}`}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setSelectedRequest(null);
          form.resetFields();
        }}
        footer={null}
        width={800}
        destroyOnClose
      >
        {selectedRequest && (
          <div>
            <Card size="small" style={{ marginBottom: '16px' }}>
              <Row gutter={16}>
                <Col span={12}>
                  <Text strong>Employee:</Text> {selectedRequest.employee?.fullName || 'N/A'}
                  <br />
                  <Text strong>Department:</Text> {selectedRequest.employee?.department || 'N/A'}
                  <br />
                  <Text strong>Type:</Text> {selectedRequest.requestType === 'material_request' ? 'Material Request' : 'Technical Issue'}
                </Col>
                <Col span={12}>
                  <Text strong>Priority:</Text> {selectedRequest.priority || 'N/A'}
                  <br />
                  <Text strong>Category:</Text> {selectedRequest.category || 'N/A'}
                  <br />
                  <Text strong>Status:</Text> {getStatusTag(selectedRequest.status)}
                </Col>
              </Row>
            </Card>

            <div style={{ marginBottom: '16px' }}>
              <Text strong>Description:</Text>
              <div style={{ padding: '8px', backgroundColor: '#fafafa', borderRadius: '4px', marginTop: '4px' }}>
                {selectedRequest.description || 'No description provided'}
              </div>
            </div>

            <Form
              form={form}
              layout="vertical"
              onFinish={handleITDecision}
            >
              <Form.Item
                label="IT Decision"
              >
                <Space size="middle">
                  <Button 
                    type="primary" 
                    size="large"
                    icon={<CheckCircleOutlined />}
                    onClick={() => {
                      form.setFieldsValue({ decision: 'approved' });
                    }}
                    style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
                  >
                    Approve
                  </Button>
                  <Button 
                    danger 
                    size="large"
                    icon={<CloseCircleOutlined />}
                    onClick={() => {
                      form.setFieldsValue({ decision: 'rejected' });
                    }}
                  >
                    Reject
                  </Button>
                </Space>
              </Form.Item>

              <Form.Item name="decision" hidden>
                <Input />
              </Form.Item>

              <Form.Item
                name="estimatedCost"
                label="Estimated Cost (XAF)"
              >
                <Input type="number" min={0} placeholder="Enter estimated cost" />
              </Form.Item>

              <Form.Item
                name="estimatedCompletionTime"
                label="Estimated Completion Time"
              >
                <Input placeholder="e.g., 2 days, 1 week" />
              </Form.Item>

              <Form.Item
                name="comments"
                label="Comments"
                rules={[{ required: true, message: 'Please provide comments' }]}
              >
                <TextArea
                  rows={4}
                  placeholder="Add technical assessment and next steps..."
                  showCount
                  maxLength={500}
                />
              </Form.Item>

              <Form.Item>
                <Space>
                  <Button 
                    type="primary" 
                    htmlType="submit" 
                    loading={loading}
                    disabled={!form.getFieldValue('decision')}
                  >
                    Submit Decision
                  </Button>
                  <Button 
                    onClick={() => {
                      setModalVisible(false);
                      setSelectedRequest(null);
                      form.resetFields();
                    }}
                  >
                    Cancel
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>

      <style>{`
        .pending-approval-row {
          background-color: #e6f7ff !important;
          border-left: 4px solid #1890ff !important;
        }
        .pending-approval-row:hover {
          background-color: #bae7ff !important;
        }
      `}</style>
    </div>
  );
};

export default ITDepartmentApprovals;










// import React, { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { 
//   Table, 
//   Tag, 
//   Space, 
//   Typography, 
//   Button, 
//   Alert, 
//   Spin, 
//   Card,
//   Tooltip,
//   Modal,
//   Form,
//   Input,
//   Row,
//   Col,
//   message,
//   Badge,
//   Statistic,
//   Select
// } from 'antd';
// import { 
//   LaptopOutlined, 
//   CheckCircleOutlined, 
//   CloseCircleOutlined, 
//   ClockCircleOutlined,
//   EyeOutlined,
//   ReloadOutlined,
//   TeamOutlined,
//   ToolOutlined,
//   WarningOutlined
// } from '@ant-design/icons';
// import { itSupportAPI } from '../../services/api';
// import { useSelector } from 'react-redux';
// import dayjs from 'dayjs';
// import relativeTime from 'dayjs/plugin/relativeTime';

// dayjs.extend(relativeTime);

// const { Title, Text } = Typography;
// const { TextArea } = Input;
// const { Option } = Select;

// const ITDepartmentApprovals = () => {
//   const [requests, setRequests] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [selectedRequest, setSelectedRequest] = useState(null);
//   const [modalVisible, setModalVisible] = useState(false);
//   const [form] = Form.useForm();
//   const navigate = useNavigate();
  
//   // Safe Redux state access with comprehensive fallbacks
//   const auth = useSelector((state) => {
//     if (!state) return {};
//     return state.auth || {};
//   });
//   const user = auth?.user || null;

//   useEffect(() => {
//     if (user) {
//       fetchITRequests();
//     } else {
//       setError('User not authenticated');
//       setLoading(false);
//     }
//   }, [user]);

//   const fetchITRequests = async () => {
//     try {
//       setLoading(true);
//       setError(null);

//       console.log('Fetching IT department requests...');
//       const response = await itSupportAPI.getITDepartmentRequests();
      
//       if (response?.success && response?.data) {
//         const dataArray = Array.isArray(response.data) ? response.data : [];
//         setRequests(dataArray);
//         console.log(`Loaded ${dataArray.length} IT requests`);
//       } else {
//         console.warn('Unexpected response structure:', response);
//         setRequests([]);
//       }
//     } catch (error) {
//       console.error('Error fetching IT requests:', error);
//       const errorMessage = error?.response?.data?.message || error?.message || 'Failed to fetch IT requests';
//       setError(errorMessage);
//       setRequests([]);
//       message.error(errorMessage);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleITDecision = async (values) => {
//     if (!selectedRequest) {
//       message.error('No request selected');
//       return;
//     }

//     if (!values.decision) {
//       message.error('Please select a decision');
//       return;
//     }

//     try {
//       setLoading(true);
      
//       const decision = {
//         decision: values.decision,
//         comments: values.comments || '',
//         estimatedCost: values.estimatedCost ? Number(values.estimatedCost) : 0,
//         technicianId: values.technicianId || user?._id || '',
//         priorityLevel: values.priorityLevel || selectedRequest.priority || 'medium',
//         estimatedCompletionTime: values.estimatedCompletionTime || ''
//       };

//       console.log('Processing IT decision:', decision);
//       const response = await itSupportAPI.processITDepartmentDecision(selectedRequest._id, decision);
      
//       if (response?.success) {
//         const actionText = values.decision === 'approved' ? 'approved' : 'rejected';
//         message.success(`Request ${actionText} successfully`);
//         setModalVisible(false);
//         setSelectedRequest(null);
//         form.resetFields();
//         await fetchITRequests();
//       } else {
//         throw new Error(response?.message || 'Failed to process decision');
//       }
//     } catch (error) {
//       console.error('Error processing IT decision:', error);
//       const errorMessage = error?.response?.data?.message || error?.message || 'Failed to process decision';
//       message.error(errorMessage);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const getStatusTag = (status) => {
//     if (!status) return <Tag>Unknown</Tag>;

//     const statusMap = {
//       'pending_it_approval': { 
//         color: 'blue', 
//         icon: <ClockCircleOutlined />, 
//         text: 'Pending IT Approval' 
//       },
//       'it_approved': { 
//         color: 'green', 
//         icon: <CheckCircleOutlined />, 
//         text: 'IT Approved' 
//       },
//       'it_rejected': { 
//         color: 'red', 
//         icon: <CloseCircleOutlined />, 
//         text: 'IT Rejected' 
//       },
//       'it_assigned': { 
//         color: 'cyan', 
//         icon: <TeamOutlined />, 
//         text: 'Assigned to Technician' 
//       },
//       'in_progress': { 
//         color: 'processing', 
//         icon: <ToolOutlined />, 
//         text: 'Work In Progress' 
//       },
//       'waiting_parts': { 
//         color: 'warning', 
//         icon: <WarningOutlined />, 
//         text: 'Waiting for Parts' 
//       },
//       'resolved': { 
//         color: 'success', 
//         icon: <CheckCircleOutlined />, 
//         text: 'Resolved' 
//       }
//     };

//     const statusInfo = statusMap[status] || { 
//       color: 'default', 
//       icon: <ClockCircleOutlined />,
//       text: status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
//     };

//     return (
//       <Tag color={statusInfo.color} icon={statusInfo.icon}>
//         {statusInfo.text}
//       </Tag>
//     );
//   };

//   const columns = [
//     {
//       title: 'Ticket #',
//       dataIndex: 'ticketNumber',
//       key: 'ticketNumber',
//       render: (ticketNumber) => (
//         <Text code style={{ fontSize: '12px' }}>{ticketNumber || 'N/A'}</Text>
//       ),
//       width: 120
//     },
//     {
//       title: 'Request Details',
//       key: 'requestDetails',
//       render: (_, record) => (
//         <div>
//           <Text strong style={{ fontSize: '13px' }}>{record?.title || 'Untitled'}</Text>
//           <br />
//           <Text type="secondary" style={{ fontSize: '11px' }}>
//             {record?.requestType === 'material_request' ? '🛒 Material Request' : '🔧 Technical Issue'}
//           </Text>
//         </div>
//       ),
//       width: 200
//     },
//     {
//       title: 'Employee',
//       key: 'employee',
//       render: (_, record) => (
//         <div>
//           <Text strong style={{ fontSize: '12px' }}>
//             {record?.employee?.fullName || 'N/A'}
//           </Text>
//           <br />
//           <Text type="secondary" style={{ fontSize: '11px' }}>
//             {record?.employee?.department || 'N/A'}
//           </Text>
//         </div>
//       ),
//       width: 150
//     },
//     {
//       title: 'Priority',
//       dataIndex: 'priority',
//       key: 'priority',
//       render: (priority) => {
//         const priorityMap = {
//           'critical': { color: 'red', text: 'Critical', icon: '🚨' },
//           'high': { color: 'orange', text: 'High', icon: '🔥' },
//           'medium': { color: 'yellow', text: 'Medium', icon: '⚡' },
//           'low': { color: 'green', text: 'Low', icon: '📝' }
//         };
//         const info = priorityMap[priority] || { color: 'default', text: priority || 'N/A', icon: '📋' };
//         return <Tag color={info.color}>{info.icon} {info.text}</Tag>;
//       },
//       width: 100
//     },
//     {
//       title: 'Status',
//       dataIndex: 'status',
//       key: 'status',
//       render: (status, record) => (
//         <div>
//           {getStatusTag(status)}
//           {user && Array.isArray(record?.approvalChain) && record.approvalChain.some(step => 
//             step?.approver?.email?.toLowerCase() === user?.email?.toLowerCase() && 
//             step?.status === 'pending'
//           ) && (
//             <div style={{ marginTop: 4 }}>
//               <Tag color="gold" size="small">Action Required</Tag>
//             </div>
//           )}
//         </div>
//       ),
//       width: 160
//     },
//     {
//       title: 'Submitted',
//       dataIndex: 'createdAt',
//       key: 'createdAt',
//       render: (date) => {
//         if (!date) return <Text type="secondary">N/A</Text>;
//         return (
//           <div>
//             <div style={{ fontSize: '12px' }}>
//               {dayjs(date).format('MMM DD, YYYY')}
//             </div>
//             <div style={{ fontSize: '10px', color: '#666' }}>
//               {dayjs(date).fromNow()}
//             </div>
//           </div>
//         );
//       },
//       width: 100
//     },
//     {
//       title: 'Actions',
//       key: 'actions',
//       render: (_, record) => {
//         if (!user || !record) return null;

//         // Check if current user (IT) can approve this request
//         const canApprove = Array.isArray(record.approvalChain) && record.approvalChain.some(step => 
//           step?.approver?.email?.toLowerCase() === user?.email?.toLowerCase() && 
//           step?.status === 'pending' &&
//           step?.approver?.role === 'IT Department - Final Approval'
//         );

//         // Check if request is at IT approval stage
//         const isPendingIT = record.status === 'pending_it_approval';

//         return (
//           <Space size="small">
//             <Tooltip title="View Details">
//               <Button 
//                 type="link" 
//                 icon={<EyeOutlined />}
//                 onClick={() => navigate(`/it/support-requests/${record._id}`)}
//                 size="small"
//               />
//             </Tooltip>
            
//             {canApprove && isPendingIT && (
//               <Tooltip title="Review & Approve IT Request">
//                 <Button 
//                   type="primary" 
//                   size="small"
//                   icon={<CheckCircleOutlined />}
//                   onClick={() => {
//                     setSelectedRequest(record);
//                     setModalVisible(true);
//                   }}
//                 >
//                   Review
//                 </Button>
//               </Tooltip>
//             )}
            
//             {!canApprove && isPendingIT && (
//               <Tooltip title="Waiting for IT approval">
//                 <Button 
//                   type="default" 
//                   size="small"
//                   disabled
//                 >
//                   Pending IT
//                 </Button>
//               </Tooltip>
//             )}

//             {record.status === 'it_approved' && (
//               <Tooltip title="Assign Technician">
//                 <Button 
//                   type="default" 
//                   size="small"
//                   icon={<TeamOutlined />}
//                   onClick={() => message.info('Technician assignment coming soon')}
//                 >
//                   Assign
//                 </Button>
//               </Tooltip>
//             )}
//           </Space>
//         );
//       },
//       width: 160,
//       fixed: 'right'
//     }
//   ];

//   const getStatsCards = () => {
//     const safeRequests = Array.isArray(requests) ? requests : [];
//     const pendingApproval = safeRequests.filter(r => r?.status === 'pending_it_approval' || r?.status === 'pending_it_review').length;
//     const approved = safeRequests.filter(r => r?.status === 'it_approved').length;
//     const inProgress = safeRequests.filter(r => r?.status === 'in_progress' || r?.status === 'it_assigned').length;
//     const resolved = safeRequests.filter(r => r?.status === 'resolved').length;

//     return (
//       <Row gutter={16} style={{ marginBottom: '24px' }}>
//         <Col xs={24} sm={12} md={6}>
//           <Card size="small">
//             <Statistic
//               title="Pending IT Approval"
//               value={pendingApproval}
//               valueStyle={{ color: '#1890ff' }}
//               prefix={<ClockCircleOutlined />}
//             />
//           </Card>
//         </Col>
//         <Col xs={24} sm={12} md={6}>
//           <Card size="small">
//             <Statistic
//               title="Approved"
//               value={approved}
//               valueStyle={{ color: '#52c41a' }}
//               prefix={<CheckCircleOutlined />}
//             />
//           </Card>
//         </Col>
//         <Col xs={24} sm={12} md={6}>
//           <Card size="small">
//             <Statistic
//               title="In Progress"
//               value={inProgress}
//               valueStyle={{ color: '#13c2c2' }}
//               prefix={<ToolOutlined />}
//             />
//           </Card>
//         </Col>
//         <Col xs={24} sm={12} md={6}>
//           <Card size="small">
//             <Statistic
//               title="Resolved"
//               value={resolved}
//               valueStyle={{ color: '#52c41a' }}
//               prefix={<CheckCircleOutlined />}
//             />
//           </Card>
//         </Col>
//       </Row>
//     );
//   };

//   // Early return if user is not authenticated
//   if (!user) {
//     return (
//       <div style={{ padding: '24px' }}>
//         <Alert
//           message="Authentication Required"
//           description="Please log in to access IT Department Approvals."
//           type="warning"
//           showIcon
//         />
//       </div>
//     );
//   }

//   if (loading && (!Array.isArray(requests) || requests.length === 0)) {
//     return (
//       <div style={{ padding: '24px', textAlign: 'center' }}>
//         <Spin size="large" />
//         <div style={{ marginTop: '16px' }}>Loading IT requests...</div>
//       </div>
//     );
//   }

//   return (
//     <div style={{ padding: '24px' }}>
//       <Card>
//         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
//           <Title level={2} style={{ margin: 0 }}>
//             <LaptopOutlined /> IT Department Approvals
//           </Title>
//           <Space>
//             <Button 
//               icon={<ReloadOutlined />}
//               onClick={fetchITRequests}
//               loading={loading}
//             >
//               Refresh
//             </Button>
//           </Space>
//         </div>

//         {error && (
//           <Alert
//             message="Error Loading Data"
//             description={error}
//             type="error"
//             showIcon
//             closable
//             style={{ marginBottom: '16px' }}
//             onClose={() => setError(null)}
//           />
//         )}

//         {getStatsCards()}

//         <Alert
//           message="IT Department Final Approval"
//           description="You are the final approver in the chain. Once you approve, the request will be assigned for implementation."
//           type="info"
//           showIcon
//           style={{ marginBottom: '16px' }}
//         />

//         {!Array.isArray(requests) || requests.length === 0 ? (
//           <Alert
//             message="No IT Requests"
//             description="There are no IT support requests pending your approval at this time."
//             type="info"
//             showIcon
//           />
//         ) : (
//           <Table 
//             columns={columns} 
//             dataSource={requests} 
//             loading={loading}
//             rowKey={(record) => record?._id || record?.ticketNumber || Math.random().toString()}
//             pagination={{ 
//               pageSize: 10,
//               showSizeChanger: true,
//               showQuickJumper: true,
//               showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} requests`
//             }}
//             scroll={{ x: 'max-content' }}
//             rowClassName={(record) => {
//               if (!record || !user) return '';
//               const canApprove = Array.isArray(record.approvalChain) && record.approvalChain.some(step => 
//                 step?.approver?.email?.toLowerCase() === user?.email?.toLowerCase() && 
//                 step?.status === 'pending'
//               );
//               return canApprove ? 'pending-approval-row' : '';
//             }}
//           />
//         )}
//       </Card>

//       {/* IT Approval Modal */}
//       <Modal
//         title={`IT Department Approval: ${selectedRequest?.ticketNumber || 'N/A'}`}
//         open={modalVisible}
//         onCancel={() => {
//           setModalVisible(false);
//           setSelectedRequest(null);
//           form.resetFields();
//         }}
//         footer={null}
//         width={800}
//         destroyOnClose
//       >
//         {selectedRequest && (
//           <div>
//             <Card size="small" style={{ marginBottom: '16px' }}>
//               <Row gutter={16}>
//                 <Col span={12}>
//                   <Text strong>Employee:</Text> {selectedRequest.employee?.fullName || 'N/A'}
//                   <br />
//                   <Text strong>Department:</Text> {selectedRequest.employee?.department || 'N/A'}
//                   <br />
//                   <Text strong>Type:</Text> {selectedRequest.requestType === 'material_request' ? 'Material Request' : 'Technical Issue'}
//                 </Col>
//                 <Col span={12}>
//                   <Text strong>Priority:</Text> {selectedRequest.priority || 'N/A'}
//                   <br />
//                   <Text strong>Category:</Text> {selectedRequest.category || 'N/A'}
//                   <br />
//                   <Text strong>Status:</Text> {getStatusTag(selectedRequest.status)}
//                 </Col>
//               </Row>
//             </Card>

//             <div style={{ marginBottom: '16px' }}>
//               <Text strong>Description:</Text>
//               <div style={{ padding: '8px', backgroundColor: '#fafafa', borderRadius: '4px', marginTop: '4px' }}>
//                 {selectedRequest.description || 'No description provided'}
//               </div>
//             </div>

//             <Form
//               form={form}
//               layout="vertical"
//               onFinish={handleITDecision}
//             >
//               <Form.Item
//                 label="IT Decision"
//               >
//                 <Space size="middle">
//                   <Button 
//                     type="primary" 
//                     size="large"
//                     icon={<CheckCircleOutlined />}
//                     onClick={() => {
//                       form.setFieldsValue({ decision: 'approved' });
//                       // Don't auto-submit, let user add comments first
//                     }}
//                     style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
//                   >
//                     Approve
//                   </Button>
//                   <Button 
//                     danger 
//                     size="large"
//                     icon={<CloseCircleOutlined />}
//                     onClick={() => {
//                       form.setFieldsValue({ decision: 'rejected' });
//                     }}
//                   >
//                     Reject
//                   </Button>
//                 </Space>
//               </Form.Item>

//               <Form.Item name="decision" hidden>
//                 <Input />
//               </Form.Item>

//               <Form.Item
//                 name="estimatedCost"
//                 label="Estimated Cost (XAF)"
//               >
//                 <Input type="number" min={0} placeholder="Enter estimated cost" />
//               </Form.Item>

//               <Form.Item
//                 name="estimatedCompletionTime"
//                 label="Estimated Completion Time"
//               >
//                 <Input placeholder="e.g., 2 days, 1 week" />
//               </Form.Item>

//               <Form.Item
//                 name="comments"
//                 label="Comments"
//                 rules={[{ required: true, message: 'Please provide comments' }]}
//               >
//                 <TextArea
//                   rows={4}
//                   placeholder="Add technical assessment and next steps..."
//                   showCount
//                   maxLength={500}
//                 />
//               </Form.Item>

//               <Form.Item>
//                 <Space>
//                   <Button 
//                     type="primary" 
//                     htmlType="submit" 
//                     loading={loading}
//                     disabled={!form.getFieldValue('decision')}
//                   >
//                     Submit Decision
//                   </Button>
//                   <Button 
//                     onClick={() => {
//                       setModalVisible(false);
//                       setSelectedRequest(null);
//                       form.resetFields();
//                     }}
//                   >
//                     Cancel
//                   </Button>
//                 </Space>
//               </Form.Item>
//             </Form>
//           </div>
//         )}
//       </Modal>

//       <style>{`
//         .pending-approval-row {
//           background-color: #e6f7ff !important;
//           border-left: 4px solid #1890ff !important;
//         }
//         .pending-approval-row:hover {
//           background-color: #bae7ff !important;
//         }
//       `}</style>
//     </div>
//   );
// };

// export default ITDepartmentApprovals;