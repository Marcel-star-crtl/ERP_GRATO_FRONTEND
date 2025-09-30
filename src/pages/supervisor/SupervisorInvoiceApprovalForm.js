import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Descriptions,
  Typography,
  Tag,
  Space,
  Form,
  Input,
  Radio,
  Button,
  message,
  Modal,
  Alert,
  Spin,
  Timeline,
  Progress,
  Divider,
  Tooltip
} from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  FileTextOutlined,
  UserOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  TeamOutlined,
  AuditOutlined,
  FileOutlined,
  DownloadOutlined,
  HistoryOutlined,
  ArrowLeftOutlined
} from '@ant-design/icons';
import api from '../../services/api';

const { Title, Text } = Typography;
const { TextArea } = Input;

const SupervisorInvoiceApprovalForm = () => {
  const { invoiceId } = useParams();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [decision, setDecision] = useState(null);
  const [userRole, setUserRole] = useState('');
  const [canApprove, setCanApprove] = useState(false);

  useEffect(() => {
    fetchInvoiceDetails();
  }, [invoiceId]);

  const fetchInvoiceDetails = async () => {
    try {
      setLoading(true);
      
      // Mock data for demonstration - this would be an API call
      const mockInvoice = {
        _id: invoiceId,
        poNumber: 'PO-NG0100000001-1',
        invoiceNumber: 'INV-2024-001',
        employeeDetails: {
          name: 'Ms. Sarah Johnson',
          email: 'sarah.johnson@gratoengineering.com',
          department: 'Business Development',
          position: 'Project Coordinator'
        },
        uploadedDate: '2024-08-14T10:30:00Z',
        uploadedTime: '10:30:00',
        approvalStatus: 'pending_department_approval',
        assignedDepartment: 'Business Development',
        currentApprovalLevel: 1,
        approvalChain: [
          {
            level: 1,
            approver: {
              name: 'Mr. Lukong Lambert',
              email: 'lukong.lambert@gratoengineering.com',
              role: 'Supply Chain Coordinator',
              department: 'Business Development'
            },
            status: 'pending'
          },
          {
            level: 2,
            approver: {
              name: 'Mr. E.T Kelvin',
              email: 'et.kelvin@gratoengineering.com',
              role: 'Department Head',
              department: 'Business Development'
            },
            status: 'pending'
          }
        ],
        assignmentDate: '2024-08-14T11:00:00Z',
        assignmentTime: '11:00:00',
        poFile: { 
          originalName: 'PO_Document_1.pdf', 
          url: '#',
          publicId: 'sample_po_1'
        },
        invoiceFile: { 
          originalName: 'Invoice_001.pdf', 
          url: '#',
          publicId: 'sample_invoice_1'
        },
        financeReview: {
          reviewDate: '2024-08-14T11:00:00Z',
          reviewTime: '11:00:00',
          finalComments: 'Assigned to Business Development department for approval'
        }
      };
      
      setInvoice(mockInvoice);
      setUserRole('Supply Chain Coordinator'); // This would come from API
      setCanApprove(true); // This would be determined by API based on current user
      
    } catch (error) {
      console.error('Error fetching invoice details:', error);
      message.error('Failed to load invoice details');
      navigate('/supervisor/invoice-approvals');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitDecision = async (values) => {
    try {
      setSubmitting(true);
      
      // Mock API call - replace with actual implementation
      console.log('Submitting decision:', {
        invoiceId,
        decision: values.decision,
        comments: values.comments
      });
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const actionText = values.decision === 'approved' ? 'approved' : 'rejected';
      message.success(`Invoice ${actionText} successfully`);
      navigate('/supervisor/invoice-approvals');
      
    } catch (error) {
      console.error('Error submitting decision:', error);
      message.error('Failed to submit decision');
    } finally {
      setSubmitting(false);
    }
  };

  const showConfirmModal = () => {
    const values = form.getFieldsValue();
    const actionText = decision === 'approved' ? 'approve' : 'reject';
    
    Modal.confirm({
      title: `Confirm ${decision === 'approved' ? 'Approval' : 'Rejection'}`,
      icon: decision === 'approved' ? <CheckCircleOutlined /> : <CloseCircleOutlined />,
      content: (
        <div>
          <p>Are you sure you want to {actionText} this invoice?</p>
          <div style={{ 
            marginTop: '10px', 
            padding: '10px', 
            backgroundColor: decision === 'approved' ? '#f6ffed' : '#fff2f0', 
            border: `1px solid ${decision === 'approved' ? '#b7eb8f' : '#ffccc7'}`, 
            borderRadius: '4px' 
          }}>
            <strong>Invoice:</strong> {invoice.poNumber}<br/>
            <strong>Employee:</strong> {invoice.employeeDetails.name}<br/>
            {values.comments && (
              <>
                <strong>Your Comments:</strong><br/>
                <em>"{values.comments}"</em>
              </>
            )}
          </div>
          {decision === 'approved' && (
            <Alert
              message="Note: This invoice will move to the next approval level after your approval."
              type="info"
              showIcon
              style={{ marginTop: '10px' }}
            />
          )}
        </div>
      ),
      onOk: () => form.submit(),
      okText: `Yes, ${actionText === 'approve' ? 'Approve' : 'Reject'}`,
      cancelText: 'Cancel',
      okButtonProps: {
        danger: decision === 'rejected',
        type: 'primary'
      }
    });
  };

  const getStatusTag = (status) => {
    const statusMap = {
      'pending': { color: 'orange', text: 'Pending', icon: <ClockCircleOutlined /> },
      'approved': { color: 'green', text: 'Approved', icon: <CheckCircleOutlined /> },
      'rejected': { color: 'red', text: 'Rejected', icon: <CloseCircleOutlined /> }
    };

    const config = statusMap[status] || { color: 'default', text: status, icon: null };
    return <Tag color={config.color} icon={config.icon}>{config.text}</Tag>;
  };

  const getApprovalProgress = () => {
    if (!invoice?.approvalChain || invoice.approvalChain.length === 0) return 0;
    const approved = invoice.approvalChain.filter(step => step.status === 'approved').length;
    return Math.round((approved / invoice.approvalChain.length) * 100);
  };

  const renderApprovalTimeline = () => {
    if (!invoice?.approvalChain || invoice.approvalChain.length === 0) {
      return <Alert message="No approval chain defined" type="info" showIcon />;
    }

    return (
      <Timeline>
        {invoice.approvalChain.map((step, index) => {
          let color = 'gray';
          let icon = <ClockCircleOutlined />;
          
          if (step.status === 'approved') {
            color = 'green';
            icon = <CheckCircleOutlined />;
          } else if (step.status === 'rejected') {
            color = 'red';
            icon = <CloseCircleOutlined />;
          } else if (step.approver.role === userRole) {
            color = 'blue';
            icon = <ExclamationCircleOutlined />;
          }

          const isCurrentUser = step.approver.role === userRole;

          return (
            <Timeline.Item 
              key={index} 
              color={color} 
              dot={icon}
              style={isCurrentUser ? { 
                backgroundColor: '#f0f8ff', 
                padding: '8px', 
                borderRadius: '4px', 
                margin: '4px 0' 
              } : {}}
            >
              <div>
                <Text strong style={isCurrentUser ? { color: '#1890ff' } : {}}>
                  {step.approver.role}: {step.approver.name}
                  {isCurrentUser && <Tag color="blue" size="small" style={{ marginLeft: '8px' }}>YOU</Tag>}
                </Text>
                <br />
                <Text type="secondary">{step.approver.email}</Text>
                <br />
                {step.status === 'pending' && (
                  <>
                    {isCurrentUser ? (
                      <Tag color="blue" icon={<ExclamationCircleOutlined />}>Your Action Required</Tag>
                    ) : (
                      <Tag color="orange">Pending Action</Tag>
                    )}
                  </>
                )}
                {step.status === 'approved' && (
                  <>
                    <Tag color="green">Approved</Tag>
                    <Text type="secondary">
                      {new Date(step.actionDate).toLocaleDateString('en-GB')} at {step.actionTime}
                    </Text>
                    {step.comments && (
                      <div style={{ marginTop: 4 }}>
                        <Text italic>"{step.comments}"</Text>
                      </div>
                    )}
                  </>
                )}
                {step.status === 'rejected' && (
                  <>
                    <Tag color="red">Rejected</Tag>
                    <Text type="secondary">
                      {new Date(step.actionDate).toLocaleDateString('en-GB')} at {step.actionTime}
                    </Text>
                    {step.comments && (
                      <div style={{ marginTop: 4, color: '#ff4d4f' }}>
                        <Text>Reason: "{step.comments}"</Text>
                      </div>
                    )}
                  </>
                )}
              </div>
            </Timeline.Item>
          );
        })}
      </Timeline>
    );
  };

  if (loading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Spin size="large" />
        <div style={{ marginTop: '16px' }}>Loading invoice details...</div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div style={{ padding: '24px' }}>
        <Alert message="Invoice not found" type="error" />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto' }}>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <Title level={3} style={{ margin: 0 }}>
            <AuditOutlined /> Invoice Approval
          </Title>
          <Space>
            <Button 
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate('/supervisor/invoice-approvals')}
            >
              Back to List
            </Button>
          </Space>
        </div>

        {/* Invoice Details */}
        <Card size="small" title={<><FileTextOutlined /> Invoice Information</>} style={{ marginBottom: '20px' }}>
          <Descriptions bordered column={2} size="small">
            <Descriptions.Item label="PO Number" span={2}>
              <Text code>{invoice.poNumber}</Text>
            </Descriptions.Item>
            
            <Descriptions.Item label="Invoice Number">
              {invoice.invoiceNumber}
            </Descriptions.Item>
            
            <Descriptions.Item label="Status">
              {getStatusTag(invoice.approvalStatus.replace('pending_department_approval', 'pending'))}
            </Descriptions.Item>
            
            <Descriptions.Item label="Employee">
              <div>
                <UserOutlined /> <Text strong>{invoice.employeeDetails.name}</Text>
                <br />
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  {invoice.employeeDetails.position}
                </Text>
              </div>
            </Descriptions.Item>
            
            <Descriptions.Item label="Department">
              <Tag color="blue">{invoice.employeeDetails.department}</Tag>
            </Descriptions.Item>
            
            <Descriptions.Item label="Upload Date/Time">
              <div>
                <CalendarOutlined /> {new Date(invoice.uploadedDate).toLocaleDateString('en-GB')}
                <br />
                <Text type="secondary"><ClockCircleOutlined /> {invoice.uploadedTime}</Text>
              </div>
            </Descriptions.Item>
            
            <Descriptions.Item label="Assignment Date/Time">
              <div>
                <CalendarOutlined /> {new Date(invoice.assignmentDate).toLocaleDateString('en-GB')}
                <br />
                <Text type="secondary"><ClockCircleOutlined /> {invoice.assignmentTime}</Text>
              </div>
            </Descriptions.Item>

            <Descriptions.Item label="Attached Files" span={2}>
              <Space>
                {invoice.poFile && (
                  <Tooltip title={invoice.poFile.originalName}>
                    <Button 
                      size="small" 
                      icon={<FileOutlined />} 
                      type="link"
                      href={invoice.poFile.url}
                      target="_blank"
                    >
                      <DownloadOutlined /> PO Document
                    </Button>
                  </Tooltip>
                )}
                {invoice.invoiceFile && (
                  <Tooltip title={invoice.invoiceFile.originalName}>
                    <Button 
                      size="small" 
                      icon={<FileOutlined />} 
                      type="link"
                      href={invoice.invoiceFile.url}
                      target="_blank"
                    >
                      <DownloadOutlined /> Invoice Document
                    </Button>
                  </Tooltip>
                )}
              </Space>
            </Descriptions.Item>

            {invoice.financeReview?.finalComments && (
              <Descriptions.Item label="Finance Comments" span={2}>
                <Alert 
                  message={invoice.financeReview.finalComments} 
                  type="info" 
                  showIcon 
                  size="small"
                />
              </Descriptions.Item>
            )}
          </Descriptions>
        </Card>

        {/* Approval Chain Progress */}
        <Card size="small" title={<><HistoryOutlined /> Approval Chain Progress</>} style={{ marginBottom: '20px' }}>
          <div style={{ marginBottom: '16px' }}>
            <Text>Overall Progress: </Text>
            <Progress 
              percent={getApprovalProgress()} 
              status="active"
              size="small"
            />
          </div>
          {renderApprovalTimeline()}
        </Card>

        {/* Approval Form */}
        {canApprove && (
          <Card 
            size="small" 
            title={
              <Space>
                <TeamOutlined />
                Your Decision Required
                <Tag color="blue">Acting as: {userRole}</Tag>
              </Space>
            }
          >
            <Alert
              message="Action Required"
              description="This invoice is waiting for your approval decision. Please review the documents and approval chain above before making your decision."
              type="warning"
              showIcon
              style={{ marginBottom: '20px' }}
            />

            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmitDecision}
            >
              <Form.Item
                name="decision"
                label="Your Decision"
                rules={[{ required: true, message: 'Please make a decision' }]}
              >
                <Radio.Group onChange={(e) => setDecision(e.target.value)}>
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

              <Form.Item
                name="comments"
                label="Comments"
                rules={decision === 'rejected' ? [
                  { required: true, message: 'Please provide a reason for rejection' }
                ] : []}
              >
                <TextArea 
                  rows={4} 
                  placeholder={decision === 'approved' ? 
                    "Add any comments about your approval (optional)..." : 
                    "Please explain why you are rejecting this invoice..."
                  }
                  showCount
                  maxLength={500}
                />
              </Form.Item>

              <Divider />

              <Form.Item style={{ marginBottom: 0 }}>
                <Space>
                  <Button 
                    onClick={() => navigate('/supervisor/invoice-approvals')}
                    disabled={submitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="primary"
                    onClick={showConfirmModal}
                    disabled={!decision}
                    loading={submitting}
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
        )}

        {/* Read-only message if cannot approve */}
        {!canApprove && (
          <Alert
            message="Information Only"
            description="You are viewing this invoice for information purposes. You do not have pending approval actions for this invoice."
            type="info"
            showIcon
          />
        )}
      </Card>
    </div>
  );
};

export default SupervisorInvoiceApprovalForm;