import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Card, 
  Descriptions, 
  Typography, 
  Tag, 
  Divider, 
  Form, 
  Radio, 
  Button, 
  message,
  Modal,
  Space,
  Alert,
  Spin,
  Timeline,
  Row,
  Col,
  Image,
  Input
} from 'antd';
import { 
  CheckCircleOutlined, 
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  FileOutlined,
  UserOutlined,
  CalendarOutlined,
  ArrowLeftOutlined,
  DownloadOutlined,
  EyeOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { TextArea } = Input;

const InvoiceApprovalForm = () => {
  const { invoiceId } = useParams();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [approval, setApproval] = useState(null);
  const [loading, setLoading] = useState(false);
  const [decision, setDecision] = useState(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const fetchApprovalDetails = async () => {
      try {
        setLoading(true);
        // Mock API call - replace with actual API
        const response = await fetch(`/api/invoice-approval/approvals/${invoiceId}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const data = await response.json();
        
        if (data.success) {
          setApproval(data.data);
        } else {
          message.error(data.message || 'Failed to load approval details');
          navigate(-1);
        }
      } catch (error) {
        message.error('Failed to load approval details');
        console.error('Error:', error);
        navigate(-1);
      } finally {
        setLoading(false);
      }
    };

    if (invoiceId) {
      fetchApprovalDetails();
    }
  }, [invoiceId, navigate]);

  const handleDownloadAttachment = async (attachment) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        message.error('Authentication required');
        return;
      }

      // Extract publicId from Cloudinary URL
      let publicId = '';
      if (attachment.url) {
        const urlParts = attachment.url.split('/');
        const uploadIndex = urlParts.findIndex(part => part === 'upload');
        if (uploadIndex !== -1 && uploadIndex + 2 < urlParts.length) {
          publicId = urlParts.slice(uploadIndex + 2).join('/');
          // Remove file extension from publicId
          const lastPart = publicId.split('/').pop();
          if (lastPart && lastPart.includes('.')) {
            publicId = publicId.replace(/\.[^/.]+$/, '');
          }
        }
      }

      if (!publicId) {
        message.error('Invalid attachment URL');
        return;
      }

      const response = await fetch(`/api/files/download/${encodeURIComponent(publicId)}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      // Create a temporary link to download the file
      const link = document.createElement('a');
      link.href = url;
      link.download = attachment.originalName || attachment.name || 'attachment';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the blob URL
      window.URL.revokeObjectURL(url);
      
      message.success('File downloaded successfully');
    } catch (error) {
      console.error('Error downloading attachment:', error);
      message.error('Failed to download attachment');
      
      // Fallback to direct URL if download fails
      if (attachment.url) {
        window.open(attachment.url, '_blank');
      }
    }
  };

  const handleSubmit = async (values) => {
    try {
      setProcessing(true);
      
      const payload = {
        decision: values.decision,
        comments: values.comments,
        rejectionReason: values.rejectionReason
      };

      console.log('Submitting decision:', payload);
      
      // Mock API call - replace with actual API
      const response = await fetch(`/api/invoice-approval/approvals/${invoiceId}/decision`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(payload)
      });
      
      const data = await response.json();
      
      if (data.success) {
        message.success(`Invoice ${values.decision === 'approved' ? 'approved' : 'rejected'} successfully`);
        navigate(-1);
      } else {
        throw new Error(data.message || 'Failed to process decision');
      }
    } catch (error) {
      console.error('Error processing approval:', error);
      message.error(error.message || 'Failed to process approval');
    } finally {
      setProcessing(false);
    }
  };

  const showConfirmModal = () => {
    const values = form.getFieldsValue();
    const action = decision === 'approved' ? 'approve' : 'reject';
    
    Modal.confirm({
      title: `Confirm ${decision === 'approved' ? 'Approval' : 'Rejection'}`,
      icon: decision === 'approved' ? <CheckCircleOutlined /> : <CloseCircleOutlined />,
      content: (
        <div>
          <p>Are you sure you want to {action} this invoice?</p>
          {values.comments && (
            <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: '4px' }}>
              <strong>Your comments:</strong> {values.comments}
            </div>
          )}
          {decision === 'rejected' && values.rejectionReason && (
            <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#fff2f0', border: '1px solid #ffccc7', borderRadius: '4px' }}>
              <strong>Rejection reason:</strong> {values.rejectionReason}
            </div>
          )}
        </div>
      ),
      onOk: () => form.submit(),
      okText: `Yes, ${decision === 'approved' ? 'Approve' : 'Reject'}`,
      cancelText: 'Cancel',
      okButtonProps: {
        danger: decision === 'rejected'
      }
    });
  };

  const getStatusTag = (status) => {
    const statusMap = {
      'pending': { color: 'orange', icon: <ExclamationCircleOutlined />, text: 'Pending Review' },
      'in_progress': { color: 'blue', icon: <ExclamationCircleOutlined />, text: 'In Progress' },
      'approved': { color: 'green', icon: <CheckCircleOutlined />, text: 'Approved' },
      'rejected': { color: 'red', icon: <CloseCircleOutlined />, text: 'Rejected' },
      'completed': { color: 'green', icon: <CheckCircleOutlined />, text: 'Completed' }
    };

    const statusInfo = statusMap[status] || { color: 'default', text: status };
    
    return (
      <Tag color={statusInfo.color} icon={statusInfo.icon}>
        {statusInfo.text}
      </Tag>
    );
  };

  const getApprovalTimeline = () => {
    if (!approval?.approvalChain || approval.approvalChain.length === 0) {
      return <Text type="secondary">No approval steps yet</Text>;
    }

    const timelineItems = approval.approvalChain.map((step, index) => {
      const stepNames = {
        'finance_assignment': 'Finance Assignment',
        'supervisor_approval': 'Supervisor Approval',
        'department_head_approval': 'Department Head Approval',
        'admin_approval': 'Admin Approval'
      };

      const stepName = stepNames[step.level] || step.level;
      
      let color = 'gray';
      let icon = <ExclamationCircleOutlined />;
      
      if (step.status === 'completed') {
        if (step.decision === 'approved' || step.decision === 'assigned') {
          color = 'green';
          icon = <CheckCircleOutlined />;
        } else if (step.decision === 'rejected') {
          color = 'red';
          icon = <CloseCircleOutlined />;
        }
      } else if (step.status === 'pending') {
        color = 'blue';
        icon = <ExclamationCircleOutlined />;
      }

      return {
        color,
        dot: icon,
        children: (
          <div>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>
              {stepName}
            </div>
            <div style={{ marginBottom: 4 }}>
              <UserOutlined style={{ marginRight: 4 }} />
              {step.approver?.fullName || 'Unknown User'}
            </div>
            <div style={{ fontSize: '12px', color: '#666', marginBottom: 4 }}>
              <CalendarOutlined style={{ marginRight: 4 }} />
              {new Date(step.timestamp).toLocaleString()}
            </div>
            {step.status === 'completed' && (
              <div style={{ marginBottom: 4 }}>
                <Tag color={step.decision === 'rejected' ? 'red' : 'green'} size="small">
                  {step.decision?.toUpperCase()}
                </Tag>
              </div>
            )}
            {step.comments && (
              <div style={{ 
                fontStyle: 'italic', 
                fontSize: '13px', 
                color: '#666',
                backgroundColor: '#f5f5f5',
                padding: '8px',
                borderRadius: '4px',
                marginTop: '8px'
              }}>
                "{step.comments}"
              </div>
            )}
            {step.rejectionReason && (
              <div style={{ 
                fontSize: '13px', 
                color: '#ff4d4f',
                backgroundColor: '#fff2f0',
                padding: '8px',
                borderRadius: '4px',
                marginTop: '8px',
                border: '1px solid #ffccc7'
              }}>
                <strong>Rejection Reason:</strong> {step.rejectionReason}
              </div>
            )}
          </div>
        )
      };
    });

    return <Timeline items={timelineItems} />;
  };

  const canUserApprove = () => {
    return approval?.userContext?.canApprove && approval?.overallStatus === 'in_progress';
  };

  if (loading && !approval) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Spin size="large" />
        <div style={{ marginTop: '16px' }}>Loading approval details...</div>
      </div>
    );
  }

  if (!approval) {
    return (
      <div style={{ padding: '24px' }}>
        <Alert message="Approval details not found" type="error" />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <Button 
          icon={<ArrowLeftOutlined />} 
          onClick={() => navigate(-1)}
          style={{ marginBottom: '16px' }}
        >
          Back to List
        </Button>
        
        <Title level={3} style={{ margin: 0 }}>
          <FileOutlined /> Invoice Approval Details
        </Title>
      </div>

      <Row gutter={[24, 24]}>
        {/* Invoice Information */}
        <Col span={24} lg={12}>
          <Card title="Invoice Information" size="small">
            <Descriptions column={1} size="small">
              <Descriptions.Item label="PO Number">
                <Text code>{approval.invoice.poNumber}</Text>
              </Descriptions.Item>
              
              <Descriptions.Item label="Invoice Number">
                <Text code>{approval.invoice.invoiceNumber}</Text>
              </Descriptions.Item>
              
              <Descriptions.Item label="Employee">
                <Space>
                  <UserOutlined />
                  {approval.invoice.employee.fullName}
                </Space>
              </Descriptions.Item>
              
              <Descriptions.Item label="Department">
                {approval.invoice.employee.department}
              </Descriptions.Item>
              
              <Descriptions.Item label="Upload Date">
                <Space>
                  <CalendarOutlined />
                  {new Date(approval.invoice.uploadedDate).toLocaleString()}
                </Space>
              </Descriptions.Item>
              
              <Descriptions.Item label="Assigned Department">
                <Tag color="blue">{approval.assignedDepartment}</Tag>
              </Descriptions.Item>
              
              <Descriptions.Item label="Overall Status">
                {getStatusTag(approval.overallStatus)}
              </Descriptions.Item>
              
              <Descriptions.Item label="Current Level">
                <Tag color="purple">
                  {approval.currentApprovalLevel?.replace('_', ' ').toUpperCase() || 'N/A'}
                </Tag>
              </Descriptions.Item>
            </Descriptions>
          </Card>

          {/* Attached Files */}
          <Card title="Attached Files" size="small" style={{ marginTop: '16px' }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              {approval.invoice.poFile && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Space>
                    <FileOutlined />
                    <Text>PO File: {approval.invoice.poFile.originalName}</Text>
                  </Space>
                  <Space>
                    <Button 
                      size="small" 
                      icon={<EyeOutlined />}
                      onClick={() => handleDownloadAttachment(approval.invoice.poFile)}
                    >
                      View
                    </Button>
                    <Button 
                      size="small" 
                      icon={<DownloadOutlined />}
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = approval.invoice.poFile.url;
                        link.download = approval.invoice.poFile.originalName;
                        link.click();
                      }}
                    >
                      Download
                    </Button>
                  </Space>
                </div>
              )}
              
              {approval.invoice.invoiceFile && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Space>
                    <FileOutlined />
                    <Text>Invoice File: {approval.invoice.invoiceFile.originalName}</Text>
                  </Space>
                  <Space>
                    <Button 
                      size="small" 
                      icon={<EyeOutlined />}
                      onClick={() => window.open(approval.invoice.invoiceFile.url, '_blank')}
                    >
                      View
                    </Button>
                    <Button 
                      size="small" 
                      icon={<DownloadOutlined />}
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = approval.invoice.invoiceFile.url;
                        link.download = approval.invoice.invoiceFile.originalName;
                        link.click();
                      }}
                    >
                      Download
                    </Button>
                  </Space>
                </div>
              )}
              
              {!approval.invoice.poFile && !approval.invoice.invoiceFile && (
                <Text type="secondary">No files attached</Text>
              )}
            </Space>
          </Card>
        </Col>

        {/* Approval Timeline */}
        <Col span={24} lg={12}>
          <Card title="Approval Timeline" size="small">
            {getApprovalTimeline()}
          </Card>
        </Col>

        {/* Approval Form */}
        {canUserApprove() && (
          <Col span={24}>
            <Card title="Your Decision" style={{ borderColor: '#1890ff' }}>
              <Alert
                message="Action Required"
                description="This invoice is awaiting your approval. Please review the details above and make your decision."
                type="info"
                showIcon
                style={{ marginBottom: '24px' }}
              />

              <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
              >
                <Form.Item
                  name="decision"
                  label="Your Decision"
                  rules={[{ required: true, message: 'Please make a decision' }]}
                >
                  <Radio.Group onChange={(e) => setDecision(e.target.value)} size="large">
                    <Space direction="vertical">
                      <Radio.Button value="approved" style={{ color: '#52c41a', borderColor: '#52c41a' }}>
                        <CheckCircleOutlined /> Approve Invoice
                      </Radio.Button>
                      <Radio.Button value="rejected" style={{ color: '#ff4d4f', borderColor: '#ff4d4f' }}>
                        <CloseCircleOutlined /> Reject Invoice
                      </Radio.Button>
                    </Space>
                  </Radio.Group>
                </Form.Item>

                {decision === 'rejected' && (
                  <Form.Item
                    name="rejectionReason"
                    label="Reason for Rejection"
                    rules={[
                      { required: true, message: 'Please provide a reason for rejection' },
                      { min: 10, message: 'Please provide a detailed reason (minimum 10 characters)' }
                    ]}
                  >
                    <TextArea 
                      rows={4} 
                      placeholder="Please provide a clear reason why this invoice is being rejected..."
                      showCount
                      maxLength={500}
                    />
                  </Form.Item>
                )}

                <Form.Item
                  name="comments"
                  label="Additional Comments"
                >
                  <TextArea 
                    rows={3} 
                    placeholder="Any additional comments or notes (optional)"
                    showCount
                    maxLength={300}
                  />
                </Form.Item>

                <Form.Item>
                  <Space size="large">
                    <Button onClick={() => navigate(-1)} size="large">
                      Cancel
                    </Button>
                    <Button
                      type="primary"
                      size="large"
                      onClick={showConfirmModal}
                      disabled={!decision}
                      loading={processing}
                      icon={decision === 'approved' ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
                      style={{
                        backgroundColor: decision === 'approved' ? '#52c41a' : decision === 'rejected' ? '#ff4d4f' : undefined,
                        borderColor: decision === 'approved' ? '#52c41a' : decision === 'rejected' ? '#ff4d4f' : undefined
                      }}
                    >
                      {decision === 'approved' ? 'Approve Invoice' : decision === 'rejected' ? 'Reject Invoice' : 'Submit Decision'}
                    </Button>
                  </Space>
                </Form.Item>
              </Form>
            </Card>
          </Col>
        )}

        {/* Required Approvals Info */}
        <Col span={24}>
          <Card title="Approval Chain Configuration" size="small">
            <Row gutter={[16, 16]}>
              <Col span={8}>
                <div style={{ textAlign: 'center', padding: '16px' }}>
                  <div style={{ fontSize: '16px', marginBottom: '8px' }}>
                    {approval.requiredApprovals.supervisor.required ? (
                      <CheckCircleOutlined style={{ color: '#52c41a' }} />
                    ) : (
                      <CloseCircleOutlined style={{ color: '#d9d9d9' }} />
                    )}
                  </div>
                  <div style={{ fontWeight: 600 }}>Supervisor</div>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    {approval.requiredApprovals.supervisor.required ? 'Required' : 'Not Required'}
                  </div>
                </div>
              </Col>
              
              <Col span={8}>
                <div style={{ textAlign: 'center', padding: '16px' }}>
                  <div style={{ fontSize: '16px', marginBottom: '8px' }}>
                    {approval.requiredApprovals.departmentHead.required ? (
                      <CheckCircleOutlined style={{ color: '#52c41a' }} />
                    ) : (
                      <CloseCircleOutlined style={{ color: '#d9d9d9' }} />
                    )}
                  </div>
                  <div style={{ fontWeight: 600 }}>Department Head</div>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    {approval.requiredApprovals.departmentHead.required ? 'Required' : 'Not Required'}
                  </div>
                </div>
              </Col>
              
              <Col span={8}>
                <div style={{ textAlign: 'center', padding: '16px' }}>
                  <div style={{ fontSize: '16px', marginBottom: '8px' }}>
                    {approval.requiredApprovals.admin.required ? (
                      <CheckCircleOutlined style={{ color: '#52c41a' }} />
                    ) : (
                      <CloseCircleOutlined style={{ color: '#d9d9d9' }} />
                    )}
                  </div>
                  <div style={{ fontWeight: 600 }}>Admin</div>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    {approval.requiredApprovals.admin.required ? 'Required' : 'Not Required'}
                  </div>
                </div>
              </Col>
            </Row>
            
            <Divider />
            
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Descriptions column={1} size="small">
                  <Descriptions.Item label="Assigned By">
                    {approval.assignedBy?.fullName || 'Unknown'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Assignment Date">
                    {new Date(approval.assignmentTimestamp).toLocaleString()}
                  </Descriptions.Item>
                </Descriptions>
              </Col>
              
              <Col span={12}>
                <Descriptions column={1} size="small">
                  <Descriptions.Item label="Total Steps">
                    {approval.approvalChain?.length || 0}
                  </Descriptions.Item>
                  <Descriptions.Item label="Completed Steps">
                    {approval.approvalChain?.filter(step => step.status === 'completed').length || 0}
                  </Descriptions.Item>
                </Descriptions>
              </Col>
            </Row>
            
            {approval.metadata?.totalApprovalTime && (
              <Alert
                message="Performance Metrics"
                description={`Total approval time: ${Math.floor(approval.metadata.totalApprovalTime / (1000 * 60 * 60))} hours`}
                type="info"
                showIcon={false}
                style={{ marginTop: '16px' }}
              />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default InvoiceApprovalForm;