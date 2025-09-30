import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Card,
  Descriptions,
  Tag,
  Button,
  Space,
  Typography,
  Row,
  Col,
  Timeline,
  Alert,
  Spin,
  Divider,
  Image,
  List,
  Avatar,
  Modal,
  Form,
  Input,
  Select,
  message,
  Steps,
  Progress,
  Tooltip
} from 'antd';
import {
  ArrowLeftOutlined,
  CalendarOutlined,
  UserOutlined,
  MedicineBoxOutlined,
  FileTextOutlined,
  PhoneOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  EditOutlined,
  DownloadOutlined,
  PrinterOutlined,
  WarningOutlined,
  TeamOutlined,
  HeartOutlined,
  BookOutlined,
  RestOutlined,
  SafetyCertificateOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import leaveApi from '../../services/leaveApi';

dayjs.extend(relativeTime);

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Step } = Steps;

const LeaveDetailView = () => {
  const { requestId } = useParams();
  const leaveId = requestId; // Use requestId from route params
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  
  const [leave, setLeave] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionModal, setActionModal] = useState(false);
  const [actionForm] = Form.useForm();
  const [actionType, setActionType] = useState('');

  useEffect(() => {
    fetchLeaveDetails();
  }, [leaveId]);

  const fetchLeaveDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await leaveApi.getLeaveById(leaveId);
      
      if (response.success) {
        setLeave(response.data);
      } else {
        throw new Error(response.message || 'Failed to fetch leave details');
      }
    } catch (error) {
      console.error('Error fetching leave details:', error);
      setError(error.response?.data?.message || error.message || 'Failed to load leave details');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (values) => {
    try {
      setLoading(true);
      
      let response;
      const actionData = {
        decision: values.decision,
        comments: values.comments || '',
        conditions: values.conditions || ''
      };

      if (actionType === 'supervisor') {
        response = await leaveApi.processSupervisorDecision(leaveId, actionData);
      } else if (actionType === 'hr') {
        response = await leaveApi.processHRDecision(leaveId, {
          ...actionData,
          medicalCertificateRequired: values.medicalCertificateRequired || false,
          returnToWorkCertificateRequired: values.returnToWorkCertificateRequired || false,
          reviewNotes: values.reviewNotes || ''
        });
      }

      if (response && response.success) {
        message.success(`Leave request ${values.decision}d successfully`);
        setActionModal(false);
        actionForm.resetFields();
        await fetchLeaveDetails();
      } else {
        throw new Error(response?.message || 'Failed to process action');
      }
    } catch (error) {
      console.error('Action error:', error);
      message.error(error.response?.data?.message || error.message || 'Failed to process action');
    } finally {
      setLoading(false);
    }
  };

  const openActionModal = (type) => {
    setActionType(type);
    setActionModal(true);
  };

  const getStatusTag = (status) => {
    const statusMap = {
      'pending_supervisor': { color: 'orange', text: 'Pending Supervisor', icon: <ClockCircleOutlined /> },
      'pending_hr': { color: 'blue', text: 'Pending HR Review', icon: <ClockCircleOutlined /> },
      'pending_admin': { color: 'purple', text: 'Pending Admin', icon: <ClockCircleOutlined /> },
      'approved': { color: 'green', text: 'Approved', icon: <CheckCircleOutlined /> },
      'rejected': { color: 'red', text: 'Rejected', icon: <CloseCircleOutlined /> },
      'completed': { color: 'cyan', text: 'Completed', icon: <SafetyCertificateOutlined /> },
      'cancelled': { color: 'gray', text: 'Cancelled', icon: <CloseCircleOutlined /> },
      'in_progress': { color: 'blue', text: 'In Progress', icon: <CalendarOutlined /> },
      'draft': { color: 'purple', text: 'Draft', icon: <FileTextOutlined /> }
    };

    const statusInfo = statusMap[status] || { color: 'default', text: status };
    return <Tag color={statusInfo.color} icon={statusInfo.icon}>{statusInfo.text}</Tag>;
  };

  const getCategoryTag = (category) => {
    const categoryMap = {
      'medical': { color: 'red', text: 'Medical', icon: <MedicineBoxOutlined /> },
      'vacation': { color: 'blue', text: 'Vacation', icon: <RestOutlined /> },
      'personal': { color: 'purple', text: 'Personal', icon: <UserOutlined /> },
      'emergency': { color: 'orange', text: 'Emergency', icon: <WarningOutlined /> },
      'family': { color: 'green', text: 'Family', icon: <TeamOutlined /> },
      'bereavement': { color: 'gray', text: 'Bereavement', icon: <HeartOutlined /> },
      'study': { color: 'cyan', text: 'Study', icon: <BookOutlined /> },
      'maternity': { color: 'pink', text: 'Maternity' },
      'paternity': { color: 'lime', text: 'Paternity' }
    };

    const categoryInfo = categoryMap[category] || { color: 'default', text: category, icon: <FileTextOutlined /> };
    return <Tag color={categoryInfo.color} icon={categoryInfo.icon}>{categoryInfo.text}</Tag>;
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

  const getApprovalTimeline = () => {
    if (!leave.approvalChain || leave.approvalChain.length === 0) {
      return [];
    }

    return leave.approvalChain.map((step, index) => ({
      color: step.status === 'approved' ? 'green' : 
             step.status === 'rejected' ? 'red' :
             step.status === 'pending' ? 'blue' : 'gray',
      dot: step.status === 'approved' ? <CheckCircleOutlined /> :
           step.status === 'rejected' ? <CloseCircleOutlined /> :
           step.status === 'pending' ? <ClockCircleOutlined /> : null,
      children: (
        <div>
          <div style={{ fontWeight: 'bold' }}>
            {step.approver.name} ({step.approver.role})
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {step.approver.department}
          </div>
          {step.comments && (
            <div style={{ marginTop: '4px', fontSize: '12px' }}>
              <Text type="secondary">{step.comments}</Text>
            </div>
          )}
          {step.actionDate && (
            <div style={{ fontSize: '11px', color: '#999', marginTop: '2px' }}>
              {dayjs(step.actionDate).format('MMM DD, YYYY HH:mm')}
            </div>
          )}
        </div>
      )
    }));
  };

  const canTakeAction = () => {
    if (!leave || !user) return false;
    
    // Check if user can approve as supervisor
    if (leave.status === 'pending_supervisor' && user.role === 'supervisor') {
      // Additional check: user should be the actual supervisor of the employee
      return true;
    }
    
    // Check if user can approve as HR
    if (leave.status === 'pending_hr' && (user.role === 'hr' || user.role === 'admin')) {
      return true;
    }

    return false;
  };

  const getActionButtonText = () => {
    if (leave.status === 'pending_supervisor') {
      return 'Review as Supervisor';
    } else if (leave.status === 'pending_hr') {
      return 'Review as HR';
    }
    return 'Review';
  };

  if (loading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Spin size="large" />
        <div style={{ marginTop: '16px' }}>Loading leave details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '24px' }}>
        <Alert
          message="Error"
          description={error}
          type="error"
          showIcon
          action={
            <Button size="small" onClick={fetchLeaveDetails}>
              Retry
            </Button>
          }
        />
      </div>
    );
  }

  if (!leave) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Alert
          message="Leave Not Found"
          description="The requested leave request could not be found."
          type="warning"
          showIcon
        />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <Card>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <Space>
            <Button 
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate(-1)}
            >
              Back
            </Button>
            <div>
              <Title level={2} style={{ margin: 0 }}>
                Leave Request Details
              </Title>
              <Text type="secondary">
                {leave.leaveNumber || leave.displayId || `LEA-${leave._id?.slice(-6).toUpperCase()}`}
              </Text>
            </div>
          </Space>
          <Space>
            {canTakeAction() && (
              <Button 
                type="primary"
                icon={<EditOutlined />}
                onClick={() => openActionModal(leave.status === 'pending_supervisor' ? 'supervisor' : 'hr')}
              >
                {getActionButtonText()}
              </Button>
            )}
            <Button 
              icon={<PrinterOutlined />}
              onClick={() => window.print()}
            >
              Print
            </Button>
          </Space>
        </div>

        {/* Status Banner */}
        <Alert
          message={
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Leave Status: {getStatusTag(leave.status)}</span>
              <span>Priority: {getUrgencyTag(leave.urgency)}</span>
            </div>
          }
          type={leave.status === 'approved' ? 'success' : 
                leave.status === 'rejected' ? 'error' :
                leave.status?.includes('pending') ? 'warning' : 'info'}
          style={{ marginBottom: '24px' }}
          showIcon
        />

        <Row gutter={24}>
          <Col span={16}>
            {/* Employee Information */}
            <Card size="small" title="Employee Information" style={{ marginBottom: '16px' }}>
              <Descriptions size="small" column={2}>
                <Descriptions.Item label="Name">
                  <Text strong>{leave.employee?.fullName || 'Unknown'}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Employee ID">
                  {leave.employee?.employeeId || 'N/A'}
                </Descriptions.Item>
                <Descriptions.Item label="Department">
                  {leave.employee?.department || 'N/A'}
                </Descriptions.Item>
                <Descriptions.Item label="Position">
                  {leave.employee?.position || 'N/A'}
                </Descriptions.Item>
                <Descriptions.Item label="Email">
                  {leave.employee?.email || 'N/A'}
                </Descriptions.Item>
                <Descriptions.Item label="Phone">
                  {leave.employee?.phone || 'N/A'}
                </Descriptions.Item>
              </Descriptions>
            </Card>

            {/* Leave Information */}
            <Card size="small" title="Leave Information" style={{ marginBottom: '16px' }}>
              <Descriptions size="small" column={2}>
                <Descriptions.Item label="Category">
                  {getCategoryTag(leave.leaveCategory)}
                </Descriptions.Item>
                <Descriptions.Item label="Type">
                  {leaveApi.getLeaveTypeDisplay(leave.leaveType)}
                </Descriptions.Item>
                <Descriptions.Item label="Start Date">
                  <Text strong>{dayjs(leave.startDate).format('dddd, MMMM DD, YYYY')}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="End Date">
                  <Text strong>{dayjs(leave.endDate).format('dddd, MMMM DD, YYYY')}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Duration">
                  <Text strong>{leave.totalDays} {leave.totalDays === 1 ? 'day' : 'days'}</Text>
                  {leave.isPartialDay && (
                    <Tag size="small" color="blue" style={{ marginLeft: '8px' }}>
                      Partial Day
                    </Tag>
                  )}
                </Descriptions.Item>
                <Descriptions.Item label="Business Days">
                  {leave.businessDays || leave.totalDays} business days
                </Descriptions.Item>
                {leave.isPartialDay && (
                  <>
                    <Descriptions.Item label="Start Time">
                      {leave.partialStartTime || 'N/A'}
                    </Descriptions.Item>
                    <Descriptions.Item label="End Time">
                      {leave.partialEndTime || 'N/A'}
                    </Descriptions.Item>
                  </>
                )}
                <Descriptions.Item label="Submitted">
                  {leave.submittedAt ? dayjs(leave.submittedAt).format('MMMM DD, YYYY HH:mm') : 'Not submitted'}
                </Descriptions.Item>
                <Descriptions.Item label="Time Since">
                  {leave.submittedAt ? dayjs(leave.submittedAt).fromNow() : 'N/A'}
                </Descriptions.Item>
              </Descriptions>
            </Card>

            {/* Reason for Leave */}
            <Card size="small" title="Reason for Leave" style={{ marginBottom: '16px' }}>
              <div style={{ 
                padding: '12px', 
                backgroundColor: '#f5f5f5', 
                borderRadius: '6px',
                border: '1px solid #d9d9d9'
              }}>
                <Paragraph style={{ margin: 0 }}>
                  {leave.reason}
                </Paragraph>
              </div>
              {leave.description && (
                <div style={{ marginTop: '12px' }}>
                  <Text strong>Additional Details:</Text>
                  <div style={{ 
                    padding: '8px 12px', 
                    backgroundColor: '#fafafa', 
                    borderRadius: '4px', 
                    marginTop: '4px' 
                  }}>
                    {leave.description}
                  </div>
                </div>
              )}
            </Card>

            {/* Medical Information (if applicable) */}
            {leave.leaveCategory === 'medical' && leave.medicalInfo && (
              <Card size="small" title="Medical Information" style={{ marginBottom: '16px' }}>
                <Row gutter={16}>
                  <Col span={12}>
                    <div style={{ marginBottom: '12px' }}>
                      <Text strong>Doctor Information:</Text>
                      <div style={{ marginTop: '4px' }}>
                        <div>Name: {leave.medicalInfo.doctorDetails?.name || 'N/A'}</div>
                        <div>Hospital: {leave.medicalInfo.doctorDetails?.hospital || 'N/A'}</div>
                        <div>Contact: {leave.medicalInfo.doctorDetails?.contactNumber || 'N/A'}</div>
                        {leave.medicalInfo.doctorDetails?.address && (
                          <div>Address: {leave.medicalInfo.doctorDetails.address}</div>
                        )}
                      </div>
                    </div>
                  </Col>
                  <Col span={12}>
                    <div style={{ marginBottom: '12px' }}>
                      <Text strong>Medical Details:</Text>
                      <div style={{ marginTop: '4px' }}>
                        {leave.medicalInfo.diagnosisCode && (
                          <div>Diagnosis Code: {leave.medicalInfo.diagnosisCode}</div>
                        )}
                        {leave.medicalInfo.expectedRecoveryDate && (
                          <div>
                            Expected Recovery: {dayjs(leave.medicalInfo.expectedRecoveryDate).format('MMM DD, YYYY')}
                          </div>
                        )}
                        <div>
                          Recurring Condition: {leave.medicalInfo.isRecurring ? 'Yes' : 'No'}
                        </div>
                      </div>
                    </div>
                  </Col>
                </Row>

                {leave.medicalInfo.symptoms && (
                  <div style={{ marginBottom: '12px' }}>
                    <Text strong>Symptoms:</Text>
                    <div style={{ 
                      padding: '8px 12px', 
                      backgroundColor: '#f5f5f5', 
                      borderRadius: '4px', 
                      marginTop: '4px' 
                    }}>
                      {leave.medicalInfo.symptoms}
                    </div>
                  </div>
                )}

                {leave.medicalInfo.treatmentReceived && (
                  <div style={{ marginBottom: '12px' }}>
                    <Text strong>Treatment Received:</Text>
                    <div style={{ 
                      padding: '8px 12px', 
                      backgroundColor: '#f5f5f5', 
                      borderRadius: '4px', 
                      marginTop: '4px' 
                    }}>
                      {leave.medicalInfo.treatmentReceived}
                    </div>
                  </div>
                )}

                <div style={{ marginTop: '12px' }}>
                  <Text strong>Medical Certificate:</Text>
                  <div style={{ marginTop: '4px' }}>
                    {leave.medicalInfo.medicalCertificate?.provided ? (
                      <div>
                        <Tag color="green" icon={<CheckCircleOutlined />}>Certificate Provided</Tag>
                        {leave.medicalInfo.medicalCertificate.fileName && (
                          <div style={{ marginTop: '4px' }}>
                            <Text type="secondary">File: {leave.medicalInfo.medicalCertificate.fileName}</Text>
                            {leave.medicalInfo.medicalCertificate.url && (
                              <Button 
                                type="link" 
                                size="small"
                                icon={<DownloadOutlined />}
                                onClick={() => window.open(leave.medicalInfo.medicalCertificate.url, '_blank')}
                              >
                                View Certificate
                              </Button>
                            )}
                          </div>
                        )}
                        <div style={{ marginTop: '4px', fontSize: '11px', color: '#666' }}>
                          Verification: {leave.medicalInfo.medicalCertificate.verificationStatus || 'Pending'}
                        </div>
                      </div>
                    ) : (
                      <Tag color="orange" icon={<WarningOutlined />}>No Certificate Provided</Tag>
                    )}
                  </div>
                </div>
              </Card>
            )}

            {/* Supporting Documents */}
            {leave.supportingDocuments && leave.supportingDocuments.length > 0 && (
              <Card size="small" title="Supporting Documents" style={{ marginBottom: '16px' }}>
                <List
                  size="small"
                  dataSource={leave.supportingDocuments}
                  renderItem={doc => (
                    <List.Item
                      actions={[
                        <Button 
                          type="link" 
                          size="small"
                          icon={<DownloadOutlined />}
                          onClick={() => window.open(doc.url, '_blank')}
                        >
                          Download
                        </Button>
                      ]}
                    >
                      <List.Item.Meta
                        avatar={<Avatar icon={<FileTextOutlined />} />}
                        title={doc.name}
                        description={
                          <div>
                            <Text type="secondary">
                              Size: {(doc.size / 1024 / 1024).toFixed(2)} MB
                            </Text>
                            <br />
                            <Text type="secondary">
                              Uploaded: {dayjs(doc.uploadedAt).format('MMM DD, YYYY')}
                            </Text>
                          </div>
                        }
                      />
                      <Tag color={doc.verificationStatus === 'verified' ? 'green' : 'orange'}>
                        {doc.verificationStatus || 'Pending'}
                      </Tag>
                    </List.Item>
                  )}
                />
              </Card>
            )}

            {/* Work Coverage and Return Plan */}
            {(leave.workCoverage || leave.returnToWorkPlan) && (
              <Card size="small" title="Work Arrangements" style={{ marginBottom: '16px' }}>
                {leave.workCoverage && (
                  <div style={{ marginBottom: '12px' }}>
                    <Text strong>Work Coverage:</Text>
                    <div style={{ 
                      padding: '8px 12px', 
                      backgroundColor: '#f5f5f5', 
                      borderRadius: '4px', 
                      marginTop: '4px' 
                    }}>
                      {leave.workCoverage}
                    </div>
                  </div>
                )}
                {leave.returnToWorkPlan && (
                  <div>
                    <Text strong>Return to Work Plan:</Text>
                    <div style={{ 
                      padding: '8px 12px', 
                      backgroundColor: '#f5f5f5', 
                      borderRadius: '4px', 
                      marginTop: '4px' 
                    }}>
                      {leave.returnToWorkPlan}
                    </div>
                  </div>
                )}
              </Card>
            )}

            {/* Emergency Contact */}
            {leave.emergencyContact && (
              <Card size="small" title="Emergency Contact" style={{ marginBottom: '16px' }}>
                <Descriptions size="small" column={2}>
                  <Descriptions.Item label="Name">
                    {leave.emergencyContact.name}
                  </Descriptions.Item>
                  <Descriptions.Item label="Phone">
                    <Text copyable>{leave.emergencyContact.phone}</Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="Relationship">
                    {leave.emergencyContact.relationship}
                  </Descriptions.Item>
                  {leave.emergencyContact.address && (
                    <Descriptions.Item label="Address" span={2}>
                      {leave.emergencyContact.address}
                    </Descriptions.Item>
                  )}
                </Descriptions>
              </Card>
            )}

            {/* Additional Notes */}
            {leave.additionalNotes && (
              <Card size="small" title="Additional Notes">
                <div style={{ 
                  padding: '12px', 
                  backgroundColor: '#f5f5f5', 
                  borderRadius: '6px' 
                }}>
                  {leave.additionalNotes}
                </div>
              </Card>
            )}
          </Col>

          <Col span={8}>
            {/* Approval Status */}
            <Card size="small" title="Approval Progress" style={{ marginBottom: '16px' }}>
              {leave.approvalChain && leave.approvalChain.length > 0 ? (
                <Timeline items={getApprovalTimeline()} />
              ) : (
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  <Text type="secondary">No approval workflow available</Text>
                </div>
              )}
            </Card>

            {/* Leave Balance Impact */}
            {leave.leaveBalance && (
              <Card size="small" title="Leave Balance Impact" style={{ marginBottom: '16px' }}>
                <Descriptions size="small" column={1}>
                  <Descriptions.Item label="Balance Type">
                    {leave.leaveBalance.balanceType?.toUpperCase()}
                  </Descriptions.Item>
                  <Descriptions.Item label="Previous Balance">
                    {leave.leaveBalance.previousBalance} days
                  </Descriptions.Item>
                  <Descriptions.Item label="Days Deducted">
                    <Text type="danger">-{leave.leaveBalance.daysDeducted} days</Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="Remaining Balance">
                    <Text strong>{leave.leaveBalance.remainingBalance} days</Text>
                  </Descriptions.Item>
                </Descriptions>
              </Card>
            )}

            {/* Decision History */}
            {(leave.supervisorDecision || leave.hrReview) && (
              <Card size="small" title="Decision History" style={{ marginBottom: '16px' }}>
                {leave.supervisorDecision && (
                  <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#f9f9f9', borderRadius: '4px' }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                      Supervisor Review
                    </div>
                    <div style={{ fontSize: '12px', marginBottom: '4px' }}>
                      Decision: <Tag color={leave.supervisorDecision.decision === 'approve' ? 'green' : 'red'}>
                        {leave.supervisorDecision.decision?.toUpperCase()}
                      </Tag>
                    </div>
                    {leave.supervisorDecision.comments && (
                      <div style={{ fontSize: '12px', marginBottom: '4px' }}>
                        <Text type="secondary">"{leave.supervisorDecision.comments}"</Text>
                      </div>
                    )}
                    <div style={{ fontSize: '11px', color: '#666' }}>
                      {leave.supervisorDecision.decisionDate ? 
                        dayjs(leave.supervisorDecision.decisionDate).format('MMM DD, YYYY HH:mm') : 
                        'Date not recorded'
                      }
                    </div>
                  </div>
                )}
                
                {leave.hrReview && (
                  <div style={{ padding: '12px', backgroundColor: '#f0f9ff', borderRadius: '4px' }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                      HR Review
                    </div>
                    <div style={{ fontSize: '12px', marginBottom: '4px' }}>
                      Decision: <Tag color={leave.hrReview.decision === 'approve' ? 'green' : 'red'}>
                        {leave.hrReview.decision?.toUpperCase()}
                      </Tag>
                    </div>
                    {leave.hrReview.comments && (
                      <div style={{ fontSize: '12px', marginBottom: '4px' }}>
                        <Text type="secondary">"{leave.hrReview.comments}"</Text>
                      </div>
                    )}
                    {leave.hrReview.conditions && (
                      <div style={{ fontSize: '12px', marginBottom: '4px' }}>
                        <Text strong>Conditions:</Text> {leave.hrReview.conditions}
                      </div>
                    )}
                    <div style={{ fontSize: '11px', color: '#666' }}>
                      {leave.hrReview.decisionDate ? 
                        dayjs(leave.hrReview.decisionDate).format('MMM DD, YYYY HH:mm') : 
                        'Date not recorded'
                      }
                    </div>
                  </div>
                )}
              </Card>
            )}

            {/* System Information */}
            <Card size="small" title="System Information">
              <Descriptions size="small" column={1}>
                <Descriptions.Item label="Leave ID">
                  <Text code>{leave.leaveNumber || leave._id}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Fiscal Year">
                  {leave.fiscalYear || new Date().getFullYear()}
                </Descriptions.Item>
                <Descriptions.Item label="Created">
                  {dayjs(leave.createdAt).format('MMM DD, YYYY HH:mm')}
                </Descriptions.Item>
                <Descriptions.Item label="Last Modified">
                  {dayjs(leave.updatedAt || leave.lastModified).format('MMM DD, YYYY HH:mm')}
                </Descriptions.Item>
                <Descriptions.Item label="Submitted By">
                  {leave.submittedBy || leave.employee?.email}
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </Col>
        </Row>
      </Card>

      {/* Action Modal */}
      <Modal
        title={
          <div>
            <EditOutlined style={{ marginRight: '8px' }} />
            {actionType === 'supervisor' ? 'Supervisor Review' : 'HR Review'} - {leave.employee?.fullName}
          </div>
        }
        visible={actionModal}
        onCancel={() => {
          setActionModal(false);
          actionForm.resetFields();
        }}
        footer={null}
        width={700}
      >
        <Form
          form={actionForm}
          layout="vertical"
          onFinish={handleAction}
        >
          <Form.Item
            name="decision"
            label="Decision"
            rules={[{ required: true, message: 'Please select a decision' }]}
          >
            <Select placeholder="Select your decision" size="large">
              <Select.Option value="approve">
                <CheckCircleOutlined style={{ color: 'green' }} /> Approve
              </Select.Option>
              <Select.Option value="reject">
                <CloseCircleOutlined style={{ color: 'red' }} /> Reject
              </Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="comments"
            label="Comments"
            rules={[{ required: true, message: 'Please provide comments' }]}
          >
            <TextArea
              rows={3}
              placeholder="Provide your feedback and comments..."
              showCount
              maxLength={500}
            />
          </Form.Item>

          {actionType === 'hr' && (
            <>
              <Form.Item name="medicalCertificateRequired" valuePropName="checked">
                <input type="checkbox" /> Medical certificate required for return
              </Form.Item>
              <Form.Item name="returnToWorkCertificateRequired" valuePropName="checked">
                <input type="checkbox" /> Return to work certificate required
              </Form.Item>
              <Form.Item name="reviewNotes" label="Internal HR Notes">
                <TextArea
                  rows={2}
                  placeholder="Internal notes for HR records..."
                  showCount
                  maxLength={300}
                />
              </Form.Item>
            </>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <Button onClick={() => setActionModal(false)}>
              Cancel
            </Button>
            <Button type="primary" htmlType="submit" loading={loading}>
              Submit Decision
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default LeaveDetailView;