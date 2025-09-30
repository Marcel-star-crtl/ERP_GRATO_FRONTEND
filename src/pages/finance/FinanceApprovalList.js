import React, { useEffect, useState } from 'react';
import { Table, Tag, Space, Typography, Button, Alert, Spin, Modal, Form, Input, message, Statistic, Card, Row, Col, Descriptions, Timeline, Divider } from 'antd';
import { 
  FileTextOutlined, 
  ExclamationCircleOutlined, 
  DollarOutlined,
  CalendarOutlined,
  UserOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  HistoryOutlined,
  FileOutlined,
  AuditOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import api from '../../services/api';

const { Title, Text } = Typography;
const { TextArea } = Input;

const FinanceApprovalList = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [approvalModalVisible, setApprovalModalVisible] = useState(false);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('Fetching finance requests...');
        const response = await api.get('/api/cash-requests/pending-approvals');
        
        console.log('Finance pending approvals response:', response.data);
        
        if (response.data.success) {
          setRequests(response.data.data || []);
          console.log(`Loaded ${response.data.data?.length || 0} requests for finance approval`);
        } else {
          throw new Error(response.data.message || 'Failed to fetch requests');
        }
      } catch (error) {
        console.error('Error fetching finance requests:', error);
        setError(error.response?.data?.message || error.message || 'Failed to fetch requests');
        setRequests([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, []);

  // Check if user can approve this request (Level 4 - Finance)
  const canUserApprove = (request) => {
    if (!user?.email) return false;
    
    console.log('Checking approval for request:', request._id, 'Status:', request.status, 'User:', user.email);
    
    // For finance users, check if the request is at finance level
    if (request.status === 'pending_finance') {
      console.log('Request is pending_finance, user can approve');
      return true;
    }
    
    // Also check approval chain if available
    if (request.approvalChain) {
      const currentStep = request.approvalChain.find(step => 
        step.approver?.email === user.email &&
        step.status === 'pending'
      );
      console.log('Approval chain step found:', !!currentStep);
      return !!currentStep;
    }
    
    console.log('User cannot approve this request');
    return false;
  };

  const handleApprove = (request) => {
    setSelectedRequest(request);
    setApprovalModalVisible(true);
    form.resetFields();
  };

  const handleApprovalSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      const payload = {
        decision: 'approved',
        comments: values.comments,
        amountApproved: values.amountApproved || selectedRequest.amountRequested,
        disbursementAmount: values.disbursementAmount
      };

      const response = await api.put(`/api/cash-requests/${selectedRequest._id}/approve`, payload);
      
      if (response.data.success) {
        message.success('Request approved and processed successfully!');
        setApprovalModalVisible(false);
        setSelectedRequest(null);
        form.resetFields();
        
        // Refresh the list
        const refreshResponse = await api.get('/api/cash-requests/pending-approvals');
        if (refreshResponse.data.success) {
          setRequests(refreshResponse.data.data || []);
        }
      } else {
        throw new Error(response.data.message || 'Approval failed');
      }
    } catch (error) {
      console.error('Approval error:', error);
      message.error(error.response?.data?.message || error.message || 'Failed to process approval');
    }
  };

  const handleReject = async (request) => {
    Modal.confirm({
      title: 'Reject Request',
      content: 'Are you sure you want to reject this cash request?',
      okText: 'Yes, Reject',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          const response = await api.put(`/api/cash-requests/${request._id}/approve`, {
            decision: 'rejected',
            comments: 'Rejected by finance'
          });
          
          if (response.data.success) {
            message.success('Request rejected successfully');
            
            // Refresh the list
            const refreshResponse = await api.get('/api/cash-requests/pending-approvals');
            if (refreshResponse.data.success) {
              setRequests(refreshResponse.data.data || []);
            }
          } else {
            throw new Error(response.data.message || 'Rejection failed');
          }
        } catch (error) {
          console.error('Rejection error:', error);
          message.error(error.response?.data?.message || error.message || 'Failed to reject request');
        }
      }
    });
  };

  const handleReview = async (requestId) => {
    try {
      setLoading(true);
      const response = await api.get(`/api/cash-requests/${requestId}`);
      
      if (response.data.success) {
        setSelectedRequest(response.data.data);
        setDetailsModalVisible(true);
      } else {
        message.error('Failed to fetch request details');
      }
    } catch (error) {
      console.error('Error fetching request details:', error);
      message.error('Failed to fetch request details');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (record) => {
    setSelectedRequest(record);
    setDetailsModalVisible(true);
  };

  const handleFinanceReview = (record) => {
    if (canUserApprove(record)) {
      setSelectedRequest(record);
      setDetailsModalVisible(true);
    } else {
      message.warning('You are not authorized to review this request');
    }
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  const columns = [
    {
      title: 'Request ID',
      dataIndex: '_id',
      key: '_id',
      render: (id) => id ? `REQ-${id.slice(-6).toUpperCase()}` : 'N/A'
    },
    {
      title: 'Employee',
      key: 'employee',
      render: (_, record) => (
        <Space direction="vertical" size="small">
          <span style={{ fontWeight: 'bold' }}>
            {record.employee?.fullName || 'N/A'}
          </span>
          <small style={{ color: '#666' }}>
            {record.employee?.department || 'No department'}
          </small>
        </Space>
      )
    },
    {
      title: 'Amount Requested',
      dataIndex: 'amountRequested',
      key: 'amountRequested',
      render: (amount) => `XAF ${Number(amount || 0).toFixed(2)}`,
      sorter: (a, b) => (a.amountRequested || 0) - (b.amountRequested || 0)
    },
    {
      title: 'Amount Approved',
      dataIndex: 'amountApproved',
      key: 'amountApproved',
      render: (amount, record) => {
        const approvedAmount = amount || record.amountRequested;
        return (
          <span style={{ fontWeight: 'bold', color: '#52c41a' }}>
            XAF {Number(approvedAmount).toFixed(2)}
          </span>
        );
      }
    },
    {
      title: 'Supervisor',
      key: 'supervisor',
      render: (_, record) => (
        <Space>
          <UserOutlined />
          {record.supervisor?.fullName || 'N/A'}
        </Space>
      )
    },
    {
      title: 'Approval Date',
      key: 'approvalDate',
      render: (_, record) => (
        <Space>
          <CalendarOutlined />
          {record.supervisorDecision?.decisionDate 
            ? new Date(record.supervisorDecision.decisionDate).toLocaleDateString()
            : 'N/A'
          }
        </Space>
      ),
      sorter: (a, b) => {
        const dateA = new Date(a.supervisorDecision?.decisionDate || 0);
        const dateB = new Date(b.supervisorDecision?.decisionDate || 0);
        return dateA - dateB;
      },
      defaultSortOrder: 'descend'
    },
    {
      title: 'Purpose',
      dataIndex: 'purpose',
      key: 'purpose',
      render: (purpose) => purpose ? 
        (purpose.length > 30 ? `${purpose.substring(0, 30)}...` : purpose) : 'N/A'
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status, record) => {
        const statusMap = {
          'pending_finance': { color: 'blue', text: 'Pending Finance Approval', icon: <ClockCircleOutlined /> },
          'approved': { color: 'green', text: 'Approved', icon: <CheckCircleOutlined /> },
          'disbursed': { color: 'purple', text: 'Disbursed', icon: <DollarOutlined /> },
          'completed': { color: 'cyan', text: 'Completed', icon: <CheckCircleOutlined /> }
        };
        
        const statusInfo = statusMap[status] || { color: 'default', text: status, icon: <ClockCircleOutlined /> };
        
        return (
          <Tag color={statusInfo.color} icon={statusInfo.icon}>
            {statusInfo.text}
          </Tag>
        );
      }
    },
    {
      title: 'Approval Level',
      key: 'approvalLevel',
      render: (_, record) => {
        if (!record.approvalChain || !user?.email) return 'N/A';
        
        const userStep = record.approvalChain.find(step => 
          step.approver?.email === user.email
        );
        
        if (!userStep) return 'N/A';
        
        const isCurrent = userStep.status === 'pending';
        
        return (
          <div>
            <Tag color={isCurrent ? "gold" : userStep.status === 'approved' ? "green" : "default"}>
              Level {userStep.level}: {userStep.approver?.role}
            </Tag>
            {isCurrent && (
              <div style={{ fontSize: '10px', color: '#faad14' }}>
                Your Turn
              </div>
            )}
          </div>
        );
      },
      width: 150
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button 
            type="default"
            size="small"
            onClick={() => handleViewDetails(record)}
            icon={<EyeOutlined />}
            disabled={!record._id}
          >
            View
          </Button>
          {canUserApprove(record) && (
            <>
              <Button 
                type="default"
                size="small"
                onClick={() => handleFinanceReview(record)}
                icon={<AuditOutlined />}
                style={{ color: '#1890ff', borderColor: '#1890ff' }}
              >
                Review
              </Button>
              <Button 
                type="primary"
                size="small"
                onClick={() => handleApprove(record)}
                icon={<CheckCircleOutlined />}
              >
                Approve & Disburse
              </Button>
              <Button 
                danger
                size="small"
                onClick={() => handleReject(record)}
                icon={<CloseCircleOutlined />}
              >
                Reject
              </Button>
            </>
          )}
        </Space>
      ),
      width: 300
    }
  ];

  if (loading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Spin size="large" />
        <div style={{ marginTop: '16px' }}>Loading requests for finance approval...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <Title level={2} style={{ margin: 0 }}>
          <DollarOutlined /> Finance Approvals
        </Title>
        <Button onClick={handleRefresh}>
          Refresh
        </Button>
      </div>

      {/* Statistics Cards */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Pending Your Approval"
              value={requests.filter(req => canUserApprove(req)).length}
              valueStyle={{ color: '#faad14' }}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Assigned"
              value={requests.length}
              valueStyle={{ color: '#1890ff' }}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Amount"
              value={requests.reduce((sum, req) => sum + (req.amountRequested || 0), 0)}
              valueStyle={{ color: '#52c41a' }}
              prefix="XAF"
              precision={2}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Average Request"
              value={requests.length > 0 ? requests.reduce((sum, req) => sum + (req.amountRequested || 0), 0) / requests.length : 0}
              valueStyle={{ color: '#722ed1' }}
              prefix="XAF"
              precision={2}
            />
          </Card>
        </Col>
      </Row>

      {error && (
        <Alert
          message="Error Loading Requests"
          description={error}
          type="error"
          showIcon
          closable
          style={{ marginBottom: '16px' }}
          action={
            <Button size="small" onClick={handleRefresh}>
              Retry
            </Button>
          }
        />
      )}

      {!error && requests.length === 0 && (
        <Alert
          message="No Pending Approvals"
          description="There are currently no cash requests pending finance approval. All requests must first be approved by supervisors."
          type="info"
          showIcon
          style={{ marginBottom: '16px' }}
        />
      )}

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
            `${range[0]}-${range[1]} of ${total} requests pending approval`
        }}
        scroll={{ x: 'max-content' }}
      />

      {/* Approval Modal */}
      <Modal
        title={`Approve Cash Request - ${selectedRequest?.employee?.fullName || 'N/A'}`}
        open={approvalModalVisible}
        onOk={handleApprovalSubmit}
        onCancel={() => {
          setApprovalModalVisible(false);
          setSelectedRequest(null);
          form.resetFields();
        }}
        width={600}
        okText="Approve & Disburse"
        cancelText="Cancel"
      >
        {selectedRequest && (
          <div>
            <Row gutter={16} style={{ marginBottom: '16px' }}>
              <Col span={12}>
                <Text strong>Request Amount:</Text>
                <br />
                <Text style={{ fontSize: '18px', color: '#1890ff' }}>
                  XAF {Number(selectedRequest.amountRequested || 0).toFixed(2)}
                </Text>
              </Col>
              <Col span={12}>
                <Text strong>Purpose:</Text>
                <br />
                <Text>{selectedRequest.purpose}</Text>
              </Col>
            </Row>
            
            <Form form={form} layout="vertical">
              <Form.Item
                name="amountApproved"
                label="Amount to Approve"
                initialValue={selectedRequest.amountRequested}
                rules={[
                  { required: true, message: 'Please enter the amount to approve' },
                  { type: 'number', min: 0, message: 'Amount must be positive' }
                ]}
              >
                <Input
                  type="number"
                  prefix="XAF"
                  placeholder="Enter amount to approve"
                  min={0}
                  step={0.01}
                />
              </Form.Item>
              
              <Form.Item
                name="disbursementAmount"
                label="Disbursement Amount (if different from approved amount)"
              >
                <Input
                  type="number"
                  prefix="XAF"
                  placeholder="Leave empty to use approved amount"
                  min={0}
                  step={0.01}
                />
              </Form.Item>

              <Form.Item
                name="comments"
                label="Comments"
                rules={[{ required: true, message: 'Please add approval comments' }]}
              >
                <TextArea
                  rows={4}
                  placeholder="Add your approval comments and any disbursement instructions..."
                />
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>

      {/* Details Modal */}
      <Modal
        title={selectedRequest ? `Cash Request Details - ${selectedRequest.employee?.fullName}` : 'Request Details'}
        open={detailsModalVisible}
        onCancel={() => {
          setDetailsModalVisible(false);
          setSelectedRequest(null);
        }}
        footer={[
          <Button key="close" onClick={() => {
            setDetailsModalVisible(false);
            setSelectedRequest(null);
          }}>
            Close
          </Button>,
          selectedRequest && canUserApprove(selectedRequest) && (
            <Button 
              key="approve" 
              type="primary" 
              onClick={() => {
                setDetailsModalVisible(false);
                handleApprove(selectedRequest);
              }}
            >
              Review & Approve
            </Button>
          )
        ]}
        width="80%"
        style={{ top: 20 }}
      >
        {selectedRequest && (
          <div>
            {/* Request Information */}
            <Descriptions title="Request Information" bordered column={2}>
              <Descriptions.Item label="Request ID">{selectedRequest.displayId || selectedRequest._id}</Descriptions.Item>
              <Descriptions.Item label="Amount Requested">
                <span style={{ fontWeight: 'bold', color: '#1890ff' }}>
                  XAF {Number(selectedRequest.amountRequested).toLocaleString()}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="Request Type">{selectedRequest.requestType}</Descriptions.Item>
              <Descriptions.Item label="Urgency">
                <Tag color={selectedRequest.urgency === 'urgent' ? 'red' : 'orange'}>
                  {selectedRequest.urgency?.toUpperCase()}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Required Date">
                {new Date(selectedRequest.requiredDate).toLocaleDateString()}
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color="blue">{selectedRequest.status?.replace('_', ' ').toUpperCase()}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Purpose" span={2}>
                {selectedRequest.purpose}
              </Descriptions.Item>
              <Descriptions.Item label="Business Justification" span={2}>
                {selectedRequest.businessJustification}
              </Descriptions.Item>
            </Descriptions>

            <Divider />

            {/* Approval Chain */}
            {selectedRequest.approvalChain && selectedRequest.approvalChain.length > 0 && (
              <>
                <Typography.Title level={4}>
                  <HistoryOutlined /> Approval Chain Progress
                </Typography.Title>
                <Timeline>
                  {selectedRequest.approvalChain.map((step, index) => {
                    let color = 'gray';
                    let icon = <ClockCircleOutlined />;
                    
                    if (step.status === 'approved') {
                      color = 'green';
                      icon = <CheckCircleOutlined />;
                    } else if (step.status === 'rejected') {
                      color = 'red';
                      icon = <CloseCircleOutlined />;
                    }

                    const isCurrentStep = step.status === 'pending';

                    return (
                      <Timeline.Item key={index} color={color} dot={icon}>
                        <div>
                          <Typography.Text strong>Level {step.level}: {step.approver?.name || 'Unknown'}</Typography.Text>
                          {isCurrentStep && <Tag color="gold" size="small" style={{marginLeft: 8}}>Current</Tag>}
                          <br />
                          <Typography.Text type="secondary">{step.approver?.role} - {step.approver?.email}</Typography.Text>
                          <br />
                          {step.status === 'pending' && (
                            <Tag color={isCurrentStep ? "gold" : "orange"}>
                              {isCurrentStep ? "Awaiting Action" : "Pending"}
                            </Tag>
                          )}
                          {step.status === 'approved' && (
                            <>
                              <Tag color="green">Approved</Tag>
                              {step.actionDate && (
                                <Typography.Text type="secondary" style={{ fontSize: '12px' }}>
                                  on {new Date(step.actionDate).toLocaleDateString()} at {step.actionTime}
                                </Typography.Text>
                              )}
                            </>
                          )}
                          {step.status === 'rejected' && (
                            <>
                              <Tag color="red">Rejected</Tag>
                              {step.actionDate && (
                                <Typography.Text type="secondary" style={{ fontSize: '12px' }}>
                                  on {new Date(step.actionDate).toLocaleDateString()} at {step.actionTime}
                                </Typography.Text>
                              )}
                            </>
                          )}
                          {step.comments && (
                            <div style={{ marginTop: '4px' }}>
                              <Typography.Text style={{ fontSize: '12px', fontStyle: 'italic' }}>
                                "{step.comments}"
                              </Typography.Text>
                            </div>
                          )}
                        </div>
                      </Timeline.Item>
                    );
                  })}
                </Timeline>
              </>
            )}

            {/* Attachments */}
            {selectedRequest.attachments && selectedRequest.attachments.length > 0 && (
              <>
                <Divider />
                <Typography.Title level={4}>
                  <FileOutlined /> Attachments
                </Typography.Title>
                <Space wrap>
                  {selectedRequest.attachments.map((attachment, index) => (
                    <Button
                      key={index}
                      icon={<FileOutlined />}
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = attachment.url;
                        link.download = attachment.name;
                        link.click();
                      }}
                    >
                      {attachment.name}
                    </Button>
                  ))}
                </Space>
              </>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default FinanceApprovalList;





