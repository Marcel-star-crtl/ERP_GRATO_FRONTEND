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
  Form,
  Input,
  message,
  Modal,
  Steps
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
  ReloadOutlined
} from '@ant-design/icons';
import { useSelector } from 'react-redux';
import { itSupportAPI } from '../../services/api';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const ITRequestDetails = () => {
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedDecision, setSelectedDecision] = useState(null);
  const [form] = Form.useForm();
  
  const navigate = useNavigate();
  const { requestId } = useParams();
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    if (requestId) {
      fetchRequestDetails();
    }
  }, [requestId]);

  useEffect(() => {
    if (request && user) {
      console.log('=== APPROVAL CHECK DEBUG ===');
      console.log('User:', {
        email: user.email,
        role: user.role,
        department: user.department
      });
      console.log('Request:', {
        ticketNumber: request.ticketNumber,
        status: request.status
      });
      console.log('Approval Chain:', request.approvalChain?.map(step => ({
        email: step.approver?.email,
        role: step.approver?.role,
        status: step.status,
        level: step.level
      })));
      console.log('canApprove():', canApprove());
      console.log('isPendingIT():', isPendingIT());
      console.log('========================');
    }
  }, [request, user]);

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

  const handleITDecision = async (values) => {
    if (!values.decision) {
      message.error('Please select a decision');
      return;
    }

    try {
      setSubmitting(true);
      
      const decision = {
        decision: values.decision,
        comments: values.comments || '',
        estimatedCost: values.estimatedCost ? Number(values.estimatedCost) : 0,
        technicianId: values.technicianId || user?._id || '',
        priorityLevel: values.priorityLevel || request.priority || 'medium',
        estimatedCompletionTime: values.estimatedCompletionTime || ''
      };

      console.log('Processing IT decision:', decision);
      const response = await itSupportAPI.processITDepartmentDecision(requestId, decision);
      
      if (response?.success) {
        const actionText = values.decision === 'approved' ? 'approved' : 'rejected';
        message.success(`Request ${actionText} successfully`);
        setModalVisible(false);
        setSelectedDecision(null);
        form.resetFields();
        await fetchRequestDetails();
      } else {
        throw new Error(response?.message || 'Failed to process decision');
      }
    } catch (error) {
      console.error('Error processing IT decision:', error);
      message.error(error?.response?.data?.message || error?.message || 'Failed to process decision');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusTag = (status) => {
    const statusMap = {
      'pending_it_approval': { color: 'blue', icon: <ClockCircleOutlined />, text: 'Pending IT Approval' },
      'pending_it_review': { color: 'blue', icon: <ClockCircleOutlined />, text: 'Pending IT Review' },
      'it_approved': { color: 'green', icon: <CheckCircleOutlined />, text: 'IT Approved' },
      'it_rejected': { color: 'red', icon: <CloseCircleOutlined />, text: 'IT Rejected' },
      'it_assigned': { color: 'cyan', icon: <UserOutlined />, text: 'Assigned' },
      'in_progress': { color: 'processing', icon: <ToolOutlined />, text: 'In Progress' },
      'resolved': { color: 'success', icon: <CheckCircleOutlined />, text: 'Resolved' }
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

  const canApprove = () => {
    if (!user || !request) {
      console.log('canApprove: Missing user or request', { user: !!user, request: !!request });
      return false;
    }
    
    console.log('Checking approval permissions:', {
      userEmail: user.email,
      userRole: user.role,
      requestStatus: request.status,
      approvalChain: request.approvalChain
    });
    
    const hasPermission = Array.isArray(request.approvalChain) && request.approvalChain.some(step => {
      const emailMatch = step?.approver?.email?.toLowerCase() === user?.email?.toLowerCase();
      const statusMatch = step?.status === 'pending';
      const roleMatch = step?.approver?.role === 'IT Department - Final Approval';
      
      console.log('Step check:', {
        stepEmail: step?.approver?.email,
        stepStatus: step?.status,
        stepRole: step?.approver?.role,
        emailMatch,
        statusMatch,
        roleMatch,
        allMatch: emailMatch && statusMatch && roleMatch
      });
      
      return emailMatch && statusMatch && roleMatch;
    });
    
    console.log('canApprove result:', hasPermission);
    return hasPermission;
  };

  const isPendingIT = () => {
    const result = request?.status === 'pending_it_approval' || request?.status === 'pending_it_review';
    console.log('isPendingIT:', { status: request?.status, result });
    return result;
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
          onClick={() => navigate('/it/dashboard')}
          style={{ marginBottom: '16px' }}
        >
          Back to Dashboard
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
            {(() => {
              const showApprovalButton = canApprove() && isPendingIT();
              console.log('Should show approval button:', showApprovalButton);
              
              if (showApprovalButton) {
                return (
                  <Button 
                    type="primary" 
                    icon={<CheckCircleOutlined />}
                    onClick={() => setModalVisible(true)}
                  >
                    Review & Approve
                  </Button>
                );
              }
              
              return null;
            })()}
          </Space>
        </div>
      </div>

      {/* Status Alert */}
      {canApprove() && isPendingIT() && (
        <Alert
          message="Action Required"
          description="This request requires your approval as IT Department final approver."
          type="info"
          showIcon
          style={{ marginBottom: '24px' }}
          action={
            <Button 
              type="primary" 
              size="small"
              onClick={() => setModalVisible(true)}
            >
              Review Now
            </Button>
          }
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
                {request.category}
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
              <Descriptions.Item label="Location">
                {request.location || 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label="Submitted">
                {dayjs(request.createdAt).format('MMM DD, YYYY HH:mm')}
                <Text type="secondary"> ({dayjs(request.createdAt).fromNow()})</Text>
              </Descriptions.Item>
            </Descriptions>
          </Card>

          {/* Employee Information */}
          <Card title="Employee Information" style={{ marginBottom: '16px' }}>
            <Descriptions column={2} bordered>
              <Descriptions.Item label="Name">
                {request.employee?.fullName || 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label="Department">
                {request.employee?.department || 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label="Email">
                {request.employee?.email || 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label="Phone">
                {request.contactInfo?.phone || 'N/A'}
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
                  {item.specifications && (
                    <div style={{ marginTop: '8px' }}>
                      <Text strong>Specifications:</Text> {item.specifications}
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
                <Descriptions.Item label="Model">
                  {request.deviceDetails.model || 'N/A'}
                </Descriptions.Item>
                <Descriptions.Item label="Serial Number" span={2}>
                  {request.deviceDetails.serialNumber || 'N/A'}
                </Descriptions.Item>
              </Descriptions>
            </Card>
          )}
        </Col>

        {/* Right Column - Approval Chain & Timeline */}
        <Col xs={24} lg={8}>
          {/* Approval Chain */}
          <Card title="Approval Chain" style={{ marginBottom: '16px' }}>
            <Steps
              direction="vertical"
              size="small"
              current={request.approvalChain?.findIndex(step => step.status === 'pending') || 0}
            >
              {request.approvalChain?.map((step, index) => {
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

      {/* IT Approval Modal */}
      <Modal
        title={`IT Department Approval: ${request.ticketNumber}`}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setSelectedDecision(null);
          form.resetFields();
        }}
        footer={null}
        width={800}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleITDecision}
        >
          <Alert
            message="Final Approval Step"
            description="As IT Department final approver, your decision will determine if this request proceeds to implementation."
            type="info"
            showIcon
            style={{ marginBottom: '24px' }}
          />

          <Form.Item label="IT Decision">
            <Space size="middle">
              <Button 
                type={selectedDecision === 'approved' ? 'primary' : 'default'}
                size="large"
                icon={<CheckCircleOutlined />}
                onClick={() => {
                  setSelectedDecision('approved');
                  form.setFieldsValue({ decision: 'approved' });
                }}
                style={{ 
                  backgroundColor: selectedDecision === 'approved' ? '#52c41a' : undefined, 
                  borderColor: selectedDecision === 'approved' ? '#52c41a' : undefined,
                  color: selectedDecision === 'approved' ? 'white' : undefined
                }}
              >
                Approve
              </Button>
              <Button 
                type={selectedDecision === 'rejected' ? 'primary' : 'default'}
                danger={selectedDecision === 'rejected'}
                size="large"
                icon={<CloseCircleOutlined />}
                onClick={() => {
                  setSelectedDecision('rejected');
                  form.setFieldsValue({ decision: 'rejected' });
                }}
              >
                Reject
              </Button>
            </Space>
            {selectedDecision && (
              <div style={{ marginTop: '8px' }}>
                <Text type={selectedDecision === 'approved' ? 'success' : 'danger'}>
                  ✓ Decision: {selectedDecision === 'approved' ? 'Approve' : 'Reject'} selected
                </Text>
              </div>
            )}
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
                loading={submitting}
                disabled={!selectedDecision}
              >
                Submit Decision
              </Button>
              <Button 
                onClick={() => {
                  setModalVisible(false);
                  setSelectedDecision(null);
                  form.resetFields();
                }}
              >
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ITRequestDetails;









// import React, { useState, useEffect } from 'react';
// import { useNavigate, useParams } from 'react-router-dom';
// import { 
//   Card, 
//   Row, 
//   Col, 
//   Typography, 
//   Button,
//   Alert,
//   Spin,
//   Tag,
//   Space,
//   Descriptions,
//   Timeline,
//   Divider,
//   Form,
//   Input,
//   message,
//   Modal,
//   Steps
// } from 'antd';
// import { 
//   ArrowLeftOutlined,
//   CheckCircleOutlined,
//   CloseCircleOutlined,
//   ClockCircleOutlined,
//   UserOutlined,
//   ToolOutlined,
//   WarningOutlined,
//   FileTextOutlined,
//   ReloadOutlined
// } from '@ant-design/icons';
// import { useSelector } from 'react-redux';
// import { itSupportAPI } from '../../services/api';
// import dayjs from 'dayjs';
// import relativeTime from 'dayjs/plugin/relativeTime';

// dayjs.extend(relativeTime);

// const { Title, Text, Paragraph } = Typography;
// const { TextArea } = Input;

// const ITRequestDetails = () => {
//   const [request, setRequest] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [modalVisible, setModalVisible] = useState(false);
//   const [submitting, setSubmitting] = useState(false);
//   const [form] = Form.useForm();
  
//   const navigate = useNavigate();
//   const { requestId } = useParams();
//   const { user } = useSelector((state) => state.auth);

//   useEffect(() => {
//     if (requestId) {
//       fetchRequestDetails();
//     }
//   }, [requestId]);

//   const fetchRequestDetails = async () => {
//     try {
//       setLoading(true);
//       setError(null);

//       console.log('Fetching IT request details for:', requestId);
//       const response = await itSupportAPI.getRequestById(requestId);
      
//       if (response?.success && response?.data) {
//         setRequest(response.data);
//       } else {
//         setError('Failed to load request details');
//       }
//     } catch (error) {
//       console.error('Error fetching request details:', error);
//       setError(error.response?.data?.message || 'Failed to fetch request details');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleITDecision = async (values) => {
//     if (!values.decision) {
//       message.error('Please select a decision');
//       return;
//     }

//     try {
//       setSubmitting(true);
      
//       const decision = {
//         decision: values.decision,
//         comments: values.comments || '',
//         estimatedCost: values.estimatedCost ? Number(values.estimatedCost) : 0,
//         technicianId: values.technicianId || user?._id || '',
//         priorityLevel: values.priorityLevel || request.priority || 'medium',
//         estimatedCompletionTime: values.estimatedCompletionTime || ''
//       };

//       console.log('Processing IT decision:', decision);
//       const response = await itSupportAPI.processITDepartmentDecision(requestId, decision);
      
//       if (response?.success) {
//         const actionText = values.decision === 'approved' ? 'approved' : 'rejected';
//         message.success(`Request ${actionText} successfully`);
//         setModalVisible(false);
//         form.resetFields();
//         await fetchRequestDetails();
//       } else {
//         throw new Error(response?.message || 'Failed to process decision');
//       }
//     } catch (error) {
//       console.error('Error processing IT decision:', error);
//       message.error(error?.response?.data?.message || error?.message || 'Failed to process decision');
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   const getStatusTag = (status) => {
//     const statusMap = {
//       'pending_it_approval': { color: 'blue', icon: <ClockCircleOutlined />, text: 'Pending IT Approval' },
//       'pending_it_review': { color: 'blue', icon: <ClockCircleOutlined />, text: 'Pending IT Review' },
//       'it_approved': { color: 'green', icon: <CheckCircleOutlined />, text: 'IT Approved' },
//       'it_rejected': { color: 'red', icon: <CloseCircleOutlined />, text: 'IT Rejected' },
//       'it_assigned': { color: 'cyan', icon: <UserOutlined />, text: 'Assigned' },
//       'in_progress': { color: 'processing', icon: <ToolOutlined />, text: 'In Progress' },
//       'resolved': { color: 'success', icon: <CheckCircleOutlined />, text: 'Resolved' }
//     };

//     const info = statusMap[status] || { color: 'default', icon: <ClockCircleOutlined />, text: status };
//     return <Tag color={info.color} icon={info.icon}>{info.text}</Tag>;
//   };

//   const getPriorityTag = (priority) => {
//     const priorityMap = {
//       'critical': { color: 'red', text: 'Critical', icon: '🚨' },
//       'high': { color: 'orange', text: 'High', icon: '🔥' },
//       'medium': { color: 'yellow', text: 'Medium', icon: '⚡' },
//       'low': { color: 'green', text: 'Low', icon: '📝' }
//     };
//     const info = priorityMap[priority] || { color: 'default', text: priority || 'N/A', icon: '📋' };
//     return <Tag color={info.color}>{info.icon} {info.text}</Tag>;
//   };

//   const canApprove = () => {
//     if (!user || !request) return false;
    
//     return Array.isArray(request.approvalChain) && request.approvalChain.some(step => 
//       step?.approver?.email?.toLowerCase() === user?.email?.toLowerCase() && 
//       step?.status === 'pending' &&
//       step?.approver?.role === 'IT Department - Final Approval'
//     );
//   };

//   const isPendingIT = () => {
//     return request?.status === 'pending_it_approval' || request?.status === 'pending_it_review';
//   };

//   if (loading) {
//     return (
//       <div style={{ padding: '24px', textAlign: 'center' }}>
//         <Spin size="large" />
//         <div style={{ marginTop: '16px' }}>Loading request details...</div>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div style={{ padding: '24px' }}>
//         <Alert
//           message="Error Loading Request"
//           description={error}
//           type="error"
//           showIcon
//           action={
//             <Button onClick={fetchRequestDetails}>
//               Retry
//             </Button>
//           }
//         />
//       </div>
//     );
//   }

//   if (!request) {
//     return (
//       <div style={{ padding: '24px' }}>
//         <Alert
//           message="Request Not Found"
//           description="The requested IT support request could not be found."
//           type="warning"
//           showIcon
//         />
//       </div>
//     );
//   }

//   return (
//     <div style={{ padding: '24px' }}>
//       {/* Header */}
//       <div style={{ marginBottom: '24px' }}>
//         <Button 
//           icon={<ArrowLeftOutlined />} 
//           onClick={() => navigate('/it/dashboard')}
//           style={{ marginBottom: '16px' }}
//         >
//           Back to Dashboard
//         </Button>
        
//         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
//           <div>
//             <Title level={2} style={{ margin: 0 }}>
//               <FileTextOutlined /> IT Request Details
//             </Title>
//             <Text type="secondary">Ticket: {request.ticketNumber}</Text>
//           </div>
//           <Space>
//             <Button 
//               icon={<ReloadOutlined />}
//               onClick={fetchRequestDetails}
//               loading={loading}
//             >
//               Refresh
//             </Button>
//             {canApprove() && isPendingIT() && (
//               <Button 
//                 type="primary" 
//                 icon={<CheckCircleOutlined />}
//                 onClick={() => setModalVisible(true)}
//               >
//                 Review & Approve
//               </Button>
//             )}
//           </Space>
//         </div>
//       </div>

//       {/* Status Alert */}
//       {canApprove() && isPendingIT() && (
//         <Alert
//           message="Action Required"
//           description="This request requires your approval as IT Department final approver."
//           type="info"
//           showIcon
//           style={{ marginBottom: '24px' }}
//           action={
//             <Button 
//               type="primary" 
//               size="small"
//               onClick={() => setModalVisible(true)}
//             >
//               Review Now
//             </Button>
//           }
//         />
//       )}

//       <Row gutter={[16, 16]}>
//         {/* Left Column - Request Details */}
//         <Col xs={24} lg={16}>
//           {/* Basic Information */}
//           <Card title="Request Information" style={{ marginBottom: '16px' }}>
//             <Descriptions column={1} bordered>
//               <Descriptions.Item label="Status">
//                 {getStatusTag(request.status)}
//               </Descriptions.Item>
//               <Descriptions.Item label="Priority">
//                 {getPriorityTag(request.priority)}
//               </Descriptions.Item>
//               <Descriptions.Item label="Type">
//                 {request.requestType === 'material_request' ? '🛒 Material Request' : '🔧 Technical Issue'}
//               </Descriptions.Item>
//               <Descriptions.Item label="Category">
//                 {request.category}
//               </Descriptions.Item>
//               <Descriptions.Item label="Title">
//                 <Text strong>{request.title}</Text>
//               </Descriptions.Item>
//               <Descriptions.Item label="Description">
//                 <Paragraph>{request.description}</Paragraph>
//               </Descriptions.Item>
//               {request.businessJustification && (
//                 <Descriptions.Item label="Business Justification">
//                   <Paragraph>{request.businessJustification}</Paragraph>
//                 </Descriptions.Item>
//               )}
//               <Descriptions.Item label="Location">
//                 {request.location || 'N/A'}
//               </Descriptions.Item>
//               <Descriptions.Item label="Submitted">
//                 {dayjs(request.createdAt).format('MMM DD, YYYY HH:mm')}
//                 <Text type="secondary"> ({dayjs(request.createdAt).fromNow()})</Text>
//               </Descriptions.Item>
//             </Descriptions>
//           </Card>

//           {/* Employee Information */}
//           <Card title="Employee Information" style={{ marginBottom: '16px' }}>
//             <Descriptions column={2} bordered>
//               <Descriptions.Item label="Name">
//                 {request.employee?.fullName || 'N/A'}
//               </Descriptions.Item>
//               <Descriptions.Item label="Department">
//                 {request.employee?.department || 'N/A'}
//               </Descriptions.Item>
//               <Descriptions.Item label="Email">
//                 {request.employee?.email || 'N/A'}
//               </Descriptions.Item>
//               <Descriptions.Item label="Phone">
//                 {request.contactInfo?.phone || 'N/A'}
//               </Descriptions.Item>
//             </Descriptions>
//           </Card>

//           {/* Requested Items (if material request) */}
//           {request.requestType === 'material_request' && request.requestedItems?.length > 0 && (
//             <Card title="Requested Items" style={{ marginBottom: '16px' }}>
//               {request.requestedItems.map((item, index) => (
//                 <Card key={index} size="small" style={{ marginBottom: '8px' }}>
//                   <Row gutter={16}>
//                     <Col span={12}>
//                       <Text strong>Item:</Text> {item.item}
//                     </Col>
//                     <Col span={6}>
//                       <Text strong>Quantity:</Text> {item.quantity}
//                     </Col>
//                     <Col span={6}>
//                       <Text strong>Est. Cost:</Text> {item.estimatedCost?.toLocaleString()} XAF
//                     </Col>
//                   </Row>
//                   {item.specifications && (
//                     <div style={{ marginTop: '8px' }}>
//                       <Text strong>Specifications:</Text> {item.specifications}
//                     </div>
//                   )}
//                 </Card>
//               ))}
//               <Divider />
//               <Text strong>Total Estimated Cost: </Text>
//               <Text style={{ fontSize: '18px', color: '#1890ff' }}>
//                 {request.totalEstimatedCost?.toLocaleString()} XAF
//               </Text>
//             </Card>
//           )}

//           {/* Device Details (if technical issue) */}
//           {request.requestType === 'technical_issue' && request.deviceDetails && (
//             <Card title="Device Information" style={{ marginBottom: '16px' }}>
//               <Descriptions column={2} bordered>
//                 <Descriptions.Item label="Device Type">
//                   {request.deviceDetails.deviceType || 'N/A'}
//                 </Descriptions.Item>
//                 <Descriptions.Item label="Model">
//                   {request.deviceDetails.model || 'N/A'}
//                 </Descriptions.Item>
//                 <Descriptions.Item label="Serial Number" span={2}>
//                   {request.deviceDetails.serialNumber || 'N/A'}
//                 </Descriptions.Item>
//               </Descriptions>
//             </Card>
//           )}
//         </Col>

//         {/* Right Column - Approval Chain & Timeline */}
//         <Col xs={24} lg={8}>
//           {/* Approval Chain */}
//           <Card title="Approval Chain" style={{ marginBottom: '16px' }}>
//             <Steps
//               direction="vertical"
//               size="small"
//               current={request.approvalChain?.findIndex(step => step.status === 'pending') || 0}
//             >
//               {request.approvalChain?.map((step, index) => {
//                 const stepStatus = 
//                   step.status === 'approved' ? 'finish' :
//                   step.status === 'rejected' ? 'error' :
//                   step.status === 'pending' ? 'process' : 'wait';

//                 return (
//                   <Steps.Step
//                     key={index}
//                     status={stepStatus}
//                     title={step.approver?.role || 'Unknown'}
//                     description={
//                       <div>
//                         <div><Text strong>{step.approver?.name || 'Unknown'}</Text></div>
//                         <div><Text type="secondary" style={{ fontSize: '12px' }}>{step.approver?.email}</Text></div>
//                         {step.status !== 'pending' && (
//                           <>
//                             <div style={{ marginTop: '4px' }}>
//                               <Tag color={step.status === 'approved' ? 'green' : 'red'} size="small">
//                                 {step.status}
//                               </Tag>
//                             </div>
//                             {step.actionDate && (
//                               <div style={{ fontSize: '11px', color: '#999' }}>
//                                 {dayjs(step.actionDate).format('MMM DD, HH:mm')}
//                               </div>
//                             )}
//                             {step.comments && (
//                               <div style={{ 
//                                 marginTop: '4px', 
//                                 fontSize: '12px',
//                                 padding: '4px 8px',
//                                 backgroundColor: '#f5f5f5',
//                                 borderRadius: '4px'
//                               }}>
//                                 "{step.comments}"
//                               </div>
//                             )}
//                           </>
//                         )}
//                       </div>
//                     }
//                     icon={
//                       step.status === 'approved' ? <CheckCircleOutlined /> :
//                       step.status === 'rejected' ? <CloseCircleOutlined /> :
//                       step.status === 'pending' ? <ClockCircleOutlined /> :
//                       <UserOutlined />
//                     }
//                   />
//                 );
//               })}
//             </Steps>
//           </Card>

//           {/* Activity Timeline */}
//           <Card title="Activity Timeline">
//             <Timeline>
//               <Timeline.Item color="blue">
//                 <Text strong>Request Submitted</Text>
//                 <br />
//                 <Text type="secondary" style={{ fontSize: '12px' }}>
//                   {dayjs(request.createdAt).format('MMM DD, YYYY HH:mm')}
//                 </Text>
//               </Timeline.Item>

//               {request.approvalChain?.filter(step => step.status !== 'pending').map((step, index) => (
//                 <Timeline.Item 
//                   key={index}
//                   color={step.status === 'approved' ? 'green' : 'red'}
//                   dot={step.status === 'approved' ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
//                 >
//                   <Text strong>{step.status === 'approved' ? 'Approved' : 'Rejected'} by {step.approver?.role}</Text>
//                   <br />
//                   <Text type="secondary" style={{ fontSize: '12px' }}>
//                     {step.approver?.name} • {dayjs(step.actionDate).format('MMM DD, YYYY HH:mm')}
//                   </Text>
//                   {step.comments && (
//                     <div style={{ 
//                       marginTop: '4px',
//                       padding: '8px',
//                       backgroundColor: '#f5f5f5',
//                       borderRadius: '4px',
//                       fontSize: '12px'
//                     }}>
//                       "{step.comments}"
//                     </div>
//                   )}
//                 </Timeline.Item>
//               ))}

//               {request.status === 'resolved' && (
//                 <Timeline.Item color="green" dot={<CheckCircleOutlined />}>
//                   <Text strong>Request Resolved</Text>
//                   <br />
//                   <Text type="secondary" style={{ fontSize: '12px' }}>
//                     {request.resolution?.resolvedDate && dayjs(request.resolution.resolvedDate).format('MMM DD, YYYY HH:mm')}
//                   </Text>
//                 </Timeline.Item>
//               )}
//             </Timeline>
//           </Card>
//         </Col>
//       </Row>

//       {/* IT Approval Modal */}
//       <Modal
//         title={`IT Department Approval: ${request.ticketNumber}`}
//         open={modalVisible}
//         onCancel={() => {
//           setModalVisible(false);
//           form.resetFields();
//         }}
//         footer={null}
//         width={800}
//         destroyOnClose
//       >
//         <Form
//           form={form}
//           layout="vertical"
//           onFinish={handleITDecision}
//         >
//           <Alert
//             message="Final Approval Step"
//             description="As IT Department final approver, your decision will determine if this request proceeds to implementation."
//             type="info"
//             showIcon
//             style={{ marginBottom: '24px' }}
//           />

//           <Form.Item label="IT Decision">
//             <Space size="middle">
//               <Button 
//                 type="primary" 
//                 size="large"
//                 icon={<CheckCircleOutlined />}
//                 onClick={() => form.setFieldsValue({ decision: 'approved' })}
//                 style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
//               >
//                 Approve
//               </Button>
//               <Button 
//                 danger 
//                 size="large"
//                 icon={<CloseCircleOutlined />}
//                 onClick={() => form.setFieldsValue({ decision: 'rejected' })}
//               >
//                 Reject
//               </Button>
//             </Space>
//           </Form.Item>

//           <Form.Item name="decision" hidden>
//             <Input />
//           </Form.Item>

//           <Form.Item
//             name="estimatedCost"
//             label="Estimated Cost (XAF)"
//           >
//             <Input type="number" min={0} placeholder="Enter estimated cost" />
//           </Form.Item>

//           <Form.Item
//             name="estimatedCompletionTime"
//             label="Estimated Completion Time"
//           >
//             <Input placeholder="e.g., 2 days, 1 week" />
//           </Form.Item>

//           <Form.Item
//             name="comments"
//             label="Comments"
//             rules={[{ required: true, message: 'Please provide comments' }]}
//           >
//             <TextArea
//               rows={4}
//               placeholder="Add technical assessment and next steps..."
//               showCount
//               maxLength={500}
//             />
//           </Form.Item>

//           <Form.Item>
//             <Space>
//               <Button 
//                 type="primary" 
//                 htmlType="submit" 
//                 loading={submitting}
//                 disabled={!form.getFieldValue('decision')}
//               >
//                 Submit Decision
//               </Button>
//               <Button 
//                 onClick={() => {
//                   setModalVisible(false);
//                   form.resetFields();
//                 }}
//               >
//                 Cancel
//               </Button>
//             </Space>
//           </Form.Item>
//         </Form>
//       </Modal>
//     </div>
//   );
// };

// export default ITRequestDetails;