import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Descriptions,
  Tag,
  Space,
  Button,
  Alert,
  Spin,
  Typography,
  Divider,
  Row,
  Col,
  Timeline,
  Modal,
  Form,
  Input,
  Select,
  message,
  Tabs,
  Table,
  Progress,
  Badge,
  Upload
} from 'antd';
import {
  ArrowLeftOutlined,
  SafetyCertificateOutlined,
  UserOutlined,
  EnvironmentOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  FileTextOutlined,
  PlusOutlined,
  EditOutlined,
  DownloadOutlined,
  SearchOutlined,
  WarningOutlined
} from '@ant-design/icons';
import { incidentReportsAPI } from '../../services/incidentReportAPI';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const HSEIncidentReportDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionModal, setActionModal] = useState(false);
  const [modalType, setModalType] = useState(''); // 'status', 'investigation', 'action', 'resolve'
  const [actionForm] = Form.useForm();
  const [activeTab, setActiveTab] = useState('details');

  useEffect(() => {
    fetchReportDetails();
  }, [id]);

  const fetchReportDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('📋 Fetching incident report:', id);
      const response = await incidentReportsAPI.getReportById(id);

      if (response.success) {
        setReport(response.data);
        console.log('✅ Report loaded:', response.data);
      } else {
        throw new Error(response.message || 'Failed to fetch report');
      }
    } catch (error) {
      console.error('❌ Error fetching report:', error);
      setError(error.response?.data?.message || error.message || 'Failed to load report details');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (values) => {
    try {
      setLoading(true);
      const response = await incidentReportsAPI.updateIncidentStatus(id, values);

      if (response.success) {
        message.success('Status updated successfully');
        setActionModal(false);
        actionForm.resetFields();
        await fetchReportDetails();
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to update status');
    } finally {
      setLoading(false);
    }
  };

  const handleStartInvestigation = async (values) => {
    try {
      setLoading(true);
      const response = await incidentReportsAPI.startInvestigation(id, values);

      if (response.success) {
        message.success('Investigation started successfully');
        setActionModal(false);
        actionForm.resetFields();
        await fetchReportDetails();
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to start investigation');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteInvestigation = async (values) => {
    try {
      setLoading(true);
      const response = await incidentReportsAPI.completeInvestigation(id, values);

      if (response.success) {
        message.success('Investigation completed successfully');
        setActionModal(false);
        actionForm.resetFields();
        await fetchReportDetails();
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to complete investigation');
    } finally {
      setLoading(false);
    }
  };

  const handleAddAction = async (values) => {
    try {
      setLoading(true);
      const apiCall = values.actionType === 'corrective' 
        ? incidentReportsAPI.addCorrectiveAction 
        : incidentReportsAPI.addPreventiveAction;

      const response = await apiCall(id, values);

      if (response.success) {
        message.success(`${values.actionType === 'corrective' ? 'Corrective' : 'Preventive'} action added successfully`);
        setActionModal(false);
        actionForm.resetFields();
        await fetchReportDetails();
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to add action');
    } finally {
      setLoading(false);
    }
  };

  const handleResolveIncident = async (values) => {
    try {
      setLoading(true);
      const response = await incidentReportsAPI.resolveIncident(id, values);

      if (response.success) {
        message.success('Incident resolved successfully');
        setActionModal(false);
        actionForm.resetFields();
        await fetchReportDetails();
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to resolve incident');
    } finally {
      setLoading(false);
    }
  };

  const openActionModal = (type) => {
    setModalType(type);
    setActionModal(true);
    actionForm.resetFields();
  };

  const getStatusTag = (status) => {
    const statusMap = {
      'submitted': { color: 'blue', icon: <FileTextOutlined />, text: 'Submitted' },
      'under_review': { color: 'orange', icon: <EyeOutlined />, text: 'Under Review' },
      'under_investigation': { color: 'purple', icon: <SearchOutlined />, text: 'Investigating' },
      'action_required': { color: 'gold', icon: <ExclamationCircleOutlined />, text: 'Action Required' },
      'resolved': { color: 'green', icon: <CheckCircleOutlined />, text: 'Resolved' }
    };

    const info = statusMap[status] || { color: 'default', text: status };
    return <Tag color={info.color} icon={info.icon}>{info.text}</Tag>;
  };

  const getSeverityTag = (severity) => {
    const severityMap = {
      'critical': { color: 'red', text: 'Critical' },
      'high': { color: 'orange', text: 'High' },
      'medium': { color: 'yellow', text: 'Medium' },
      'low': { color: 'green', text: 'Low' }
    };

    const info = severityMap[severity] || { color: 'default', text: severity };
    return <Tag color={info.color}>{info.text}</Tag>;
  };

  const renderActionModal = () => {
    const modalConfig = {
      status: {
        title: 'Update Incident Status',
        fields: (
          <>
            <Form.Item
              name="status"
              label="New Status"
              rules={[{ required: true, message: 'Please select status' }]}
            >
              <Select>
                <Select.Option value="under_review">Under Review</Select.Option>
                <Select.Option value="under_investigation">Under Investigation</Select.Option>
                <Select.Option value="action_required">Action Required</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item
              name="reviewNotes"
              label="Notes"
              rules={[{ required: true, message: 'Please provide notes' }]}
            >
              <TextArea rows={4} placeholder="Describe the status update..." />
            </Form.Item>
          </>
        ),
        onFinish: handleStatusUpdate
      },
      investigation: {
        title: report?.status === 'under_investigation' ? 'Complete Investigation' : 'Start Investigation',
        fields: report?.status === 'under_investigation' ? (
          <>
            <Form.Item
              name="findings"
              label="Investigation Findings"
              rules={[{ required: true, message: 'Please provide findings' }]}
            >
              <TextArea rows={4} placeholder="Document investigation findings..." />
            </Form.Item>
            <Form.Item
              name="recommendations"
              label="Recommendations"
              rules={[{ required: true, message: 'Please provide recommendations' }]}
            >
              <TextArea rows={3} placeholder="List recommendations..." />
            </Form.Item>
            <Form.Item
              name="notifyStakeholders"
              label="Notify Stakeholders"
              valuePropName="checked"
            >
              <Select defaultValue={true}>
                <Select.Option value={true}>Yes, notify all stakeholders</Select.Option>
                <Select.Option value={false}>No, internal only</Select.Option>
              </Select>
            </Form.Item>
          </>
        ) : (
          <>
            <Form.Item
              name="investigationDetails"
              label="Investigation Plan"
              rules={[{ required: true, message: 'Please describe investigation plan' }]}
            >
              <TextArea rows={4} placeholder="Describe the investigation approach..." />
            </Form.Item>
            <Form.Item
              name="estimatedDuration"
              label="Estimated Duration (days)"
            >
              <Input type="number" placeholder="e.g., 7" />
            </Form.Item>
          </>
        ),
        onFinish: report?.status === 'under_investigation' ? handleCompleteInvestigation : handleStartInvestigation
      },
      action: {
        title: 'Add Corrective/Preventive Action',
        fields: (
          <>
            <Form.Item
              name="actionType"
              label="Action Type"
              rules={[{ required: true, message: 'Please select action type' }]}
            >
              <Select>
                <Select.Option value="corrective">Corrective Action</Select.Option>
                <Select.Option value="preventive">Preventive Action</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item
              name="action"
              label="Action Description"
              rules={[{ required: true, message: 'Please describe the action' }]}
            >
              <TextArea rows={3} placeholder="Describe the action to be taken..." />
            </Form.Item>
            <Form.Item
              name="assignedTo"
              label="Assign To"
              rules={[{ required: true, message: 'Please specify who is responsible' }]}
            >
              <Input placeholder="Person/Department responsible" />
            </Form.Item>
            <Form.Item
              name="dueDate"
              label="Due Date"
            >
              <Input type="date" />
            </Form.Item>
            <Form.Item
              name="notes"
              label="Additional Notes"
            >
              <TextArea rows={2} placeholder="Any additional information..." />
            </Form.Item>
          </>
        ),
        onFinish: handleAddAction
      },
      resolve: {
        title: 'Resolve Incident',
        fields: (
          <>
            <Form.Item
              name="resolutionSummary"
              label="Resolution Summary"
              rules={[{ required: true, message: 'Please provide resolution summary' }]}
            >
              <TextArea rows={4} placeholder="Summarize how the incident was resolved..." />
            </Form.Item>
            <Form.Item
              name="lessonsLearned"
              label="Lessons Learned"
            >
              <TextArea rows={3} placeholder="Document lessons learned and improvements made..." />
            </Form.Item>
          </>
        ),
        onFinish: handleResolveIncident
      }
    };

    const config = modalConfig[modalType];
    if (!config) return null;

    return (
      <Modal
        title={config.title}
        open={actionModal}
        onCancel={() => {
          setActionModal(false);
          actionForm.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={actionForm}
          layout="vertical"
          onFinish={config.onFinish}
        >
          {config.fields}
          <Form.Item style={{ marginBottom: 0, marginTop: '24px' }}>
            <Space style={{ float: 'right' }}>
              <Button onClick={() => {
                setActionModal(false);
                actionForm.resetFields();
              }}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                Submit
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    );
  };

  const actionColumns = [
    {
      title: 'Action',
      dataIndex: 'action',
      key: 'action',
      width: '40%'
    },
    {
      title: 'Assigned To',
      dataIndex: 'assignedTo',
      key: 'assignedTo',
      width: '20%'
    },
    {
      title: 'Due Date',
      dataIndex: 'dueDate',
      key: 'dueDate',
      render: (date) => date ? dayjs(date).format('MMM DD, YYYY') : 'N/A',
      width: '20%'
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'completed' ? 'green' : status === 'in_progress' ? 'blue' : 'orange'}>
          {status?.replace('_', ' ') || 'pending'}
        </Tag>
      ),
      width: '20%'
    }
  ];

  if (loading && !report) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Spin size="large" />
        <div style={{ marginTop: '16px' }}>Loading incident report...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '24px' }}>
        <Alert
          message="Error Loading Report"
          description={error}
          type="error"
          showIcon
          action={
            <Space>
              <Button size="small" onClick={() => navigate(-1)}>
                Go Back
              </Button>
              <Button size="small" type="primary" onClick={fetchReportDetails}>
                Retry
              </Button>
            </Space>
          }
        />
      </div>
    );
  }

  if (!report) {
    return (
      <div style={{ padding: '24px' }}>
        <Alert
          message="Report Not Found"
          description="The requested incident report could not be found."
          type="warning"
          showIcon
          action={
            <Button size="small" onClick={() => navigate('/hse/incident-reports')}>
              Back to Reports
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/hse/incident-reports')}
            style={{ marginBottom: '16px' }}
          >
            Back to Reports
          </Button>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <Title level={2} style={{ margin: 0 }}>
                <SafetyCertificateOutlined /> {report.title}
              </Title>
              <Space style={{ marginTop: '8px' }}>
                <Text code>{report.reportNumber}</Text>
                {getStatusTag(report.status)}
                {getSeverityTag(report.severity)}
                {report.injuriesReported && <Tag color="red">Injuries Reported</Tag>}
              </Space>
            </div>

            <Space>
              {report.status !== 'resolved' && (
                <>
                  <Button
                    icon={<EditOutlined />}
                    onClick={() => openActionModal('status')}
                  >
                    Update Status
                  </Button>
                  <Button
                    type="primary"
                    icon={report.status === 'under_investigation' ? <CheckCircleOutlined /> : <SearchOutlined />}
                    onClick={() => openActionModal('investigation')}
                  >
                    {report.status === 'under_investigation' ? 'Complete Investigation' : 'Start Investigation'}
                  </Button>
                </>
              )}
            </Space>
          </div>
        </div>

        <Divider />

        {/* Tabs */}
        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab}
          items={[
            {
              key: 'details',
              label: 'Incident Details',
              children: (
                <div>
                  <Row gutter={[24, 24]}>
                    <Col span={12}>
                      <Card title="Basic Information" size="small">
                        <Descriptions column={1} size="small">
                          <Descriptions.Item label="Reported By">
                            <Space>
                              <UserOutlined />
                              {report.reportedBy?.fullName || 'Unknown'}
                            </Space>
                          </Descriptions.Item>
                          <Descriptions.Item label="Department">
                            {report.reportedBy?.department || 'N/A'}
                          </Descriptions.Item>
                          <Descriptions.Item label="Incident Date">
                            <Space>
                              <ClockCircleOutlined />
                              {dayjs(report.incidentDate).format('MMM DD, YYYY')} at {report.incidentTime}
                            </Space>
                          </Descriptions.Item>
                          <Descriptions.Item label="Reported Date">
                            {dayjs(report.reportedDate).format('MMM DD, YYYY')}
                          </Descriptions.Item>
                          <Descriptions.Item label="Location">
                            <Space>
                              <EnvironmentOutlined />
                              {report.location} - {report.specificLocation}
                            </Space>
                          </Descriptions.Item>
                          <Descriptions.Item label="Incident Type">
                            <Tag>{report.incidentType?.replace('_', ' ')}</Tag>
                          </Descriptions.Item>
                        </Descriptions>
                      </Card>
                    </Col>

                    <Col span={12}>
                      <Card title="HSE Management" size="small">
                        <Descriptions column={1} size="small">
                          <Descriptions.Item label="Assigned To">
                            {report.hseManagement?.assignedTo || 'Mr. Ovo Becheni'}
                          </Descriptions.Item>
                          <Descriptions.Item label="Investigation Required">
                            <Tag color={report.hseManagement?.investigationRequired ? 'orange' : 'green'}>
                              {report.hseManagement?.investigationRequired ? 'Yes' : 'No'}
                            </Tag>
                          </Descriptions.Item>
                          {report.hseManagement?.reviewStartDate && (
                            <Descriptions.Item label="Review Started">
                              {dayjs(report.hseManagement.reviewStartDate).format('MMM DD, YYYY')}
                            </Descriptions.Item>
                          )}
                          {report.hseManagement?.resolutionDate && (
                            <Descriptions.Item label="Resolved Date">
                              {dayjs(report.hseManagement.resolutionDate).format('MMM DD, YYYY')}
                            </Descriptions.Item>
                          )}
                        </Descriptions>
                      </Card>
                    </Col>
                  </Row>

                  <Card title="Incident Description" style={{ marginTop: '24px' }} size="small">
                    <Paragraph>{report.description}</Paragraph>
                  </Card>

                  {report.immediateActions && (
                    <Card title="Immediate Actions Taken" style={{ marginTop: '16px' }} size="small">
                      <Paragraph>{report.immediateActions}</Paragraph>
                    </Card>
                  )}

                  {report.contributingFactors && (
                    <Card title="Contributing Factors" style={{ marginTop: '16px' }} size="small">
                      <Paragraph>{report.contributingFactors}</Paragraph>
                    </Card>
                  )}

                  {report.preventiveMeasures && (
                    <Card title="Preventive Measures" style={{ marginTop: '16px' }} size="small">
                      <Paragraph>{report.preventiveMeasures}</Paragraph>
                    </Card>
                  )}

                  {report.attachments && report.attachments.length > 0 && (
                    <Card title="Attachments" style={{ marginTop: '16px' }} size="small">
                      <Space direction="vertical">
                        {report.attachments.map((file, index) => (
                          <Button
                            key={index}
                            icon={<DownloadOutlined />}
                            type="link"
                            href={file.url}
                            target="_blank"
                          >
                            {file.name}
                          </Button>
                        ))}
                      </Space>
                    </Card>
                  )}
                </div>
              )
            },
            {
              key: 'investigation',
              label: (
                <Badge dot={report.status === 'under_investigation'}>
                  Investigation
                </Badge>
              ),
              children: (
                <div>
                  {report.hseManagement?.investigationStartDate && (
                    <Card title="Investigation Timeline" size="small">
                      <Timeline>
                        <Timeline.Item color="blue">
                          <Text strong>Investigation Started</Text>
                          <br />
                          <Text type="secondary">
                            {dayjs(report.hseManagement.investigationStartDate).format('MMM DD, YYYY')}
                          </Text>
                        </Timeline.Item>
                        {report.hseManagement?.investigationCompletedDate && (
                          <Timeline.Item color="green">
                            <Text strong>Investigation Completed</Text>
                            <br />
                            <Text type="secondary">
                              {dayjs(report.hseManagement.investigationCompletedDate).format('MMM DD, YYYY')}
                            </Text>
                          </Timeline.Item>
                        )}
                      </Timeline>
                    </Card>
                  )}

                  {report.hseManagement?.investigationFindings && (
                    <Card title="Findings" style={{ marginTop: '16px' }} size="small">
                      <Paragraph>{report.hseManagement.investigationFindings}</Paragraph>
                    </Card>
                  )}

                  {report.hseManagement?.investigationRecommendations && (
                    <Card title="Recommendations" style={{ marginTop: '16px' }} size="small">
                      <Paragraph>{report.hseManagement.investigationRecommendations}</Paragraph>
                    </Card>
                  )}

                  {!report.hseManagement?.investigationStartDate && (
                    <Alert
                      message="Investigation Not Started"
                      description="This incident has not been investigated yet."
                      type="info"
                      showIcon
                      action={
                        <Button type="primary" onClick={() => openActionModal('investigation')}>
                          Start Investigation
                        </Button>
                      }
                    />
                  )}
                </div>
              )
            },
            {
              key: 'actions',
              label: (
                <Badge count={(report.hseManagement?.correctiveActions?.length || 0) + (report.hseManagement?.preventiveActions?.length || 0)}>
                  Actions
                </Badge>
              ),
              children: (
                <div>
                  <Space style={{ marginBottom: '16px' }}>
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={() => openActionModal('action')}
                      disabled={report.status === 'resolved'}
                    >
                      Add Action
                    </Button>
                  </Space>

                  {report.hseManagement?.correctiveActions && report.hseManagement.correctiveActions.length > 0 && (
                    <Card title="Corrective Actions" size="small" style={{ marginBottom: '16px' }}>
                      <Table
                        columns={actionColumns}
                        dataSource={report.hseManagement.correctiveActions}
                        rowKey={(record, index) => `corrective-${index}`}
                        pagination={false}
                        size="small"
                      />
                    </Card>
                  )}

                  {report.hseManagement?.preventiveActions && report.hseManagement.preventiveActions.length > 0 && (
                    <Card title="Preventive Actions" size="small">
                      <Table
                        columns={actionColumns}
                        dataSource={report.hseManagement.preventiveActions}
                        rowKey={(record, index) => `preventive-${index}`}
                        pagination={false}
                        size="small"
                      />
                    </Card>
                  )}

                  {(!report.hseManagement?.correctiveActions?.length && !report.hseManagement?.preventiveActions?.length) && (
                    <Alert
                      message="No Actions Added"
                      description="No corrective or preventive actions have been added yet."
                      type="info"
                      showIcon
                    />
                  )}
                </div>
              )
            },
            {
              key: 'resolution',
              label: 'Resolution',
              children: (
                <div>
                  {report.status === 'resolved' ? (
                    <>
                      <Card title="Resolution Summary" size="small">
                        <Descriptions column={1}>
                          <Descriptions.Item label="Resolved Date">
                            {dayjs(report.hseManagement?.resolutionDate).format('MMM DD, YYYY')}
                          </Descriptions.Item>
                          <Descriptions.Item label="Summary">
                            <Paragraph>{report.hseManagement?.resolutionSummary}</Paragraph>
                          </Descriptions.Item>
                          {report.hseManagement?.lessonsLearned && (
                            <Descriptions.Item label="Lessons Learned">
                              <Paragraph>{report.hseManagement.lessonsLearned}</Paragraph>
                            </Descriptions.Item>
                          )}
                        </Descriptions>
                      </Card>
                    </>
                  ) : (
                    <Alert
                      message="Incident Not Yet Resolved"
                      description="This incident is still being managed. Complete all required actions before resolving."
                      type="warning"
                      showIcon
                      action={
                        report.status === 'action_required' && (
                          <Button type="primary" onClick={() => openActionModal('resolve')}>
                            Resolve Incident
                          </Button>
                        )
                      }
                    />
                  )}
                </div>
              )
            },
            {
              key: 'timeline',
              label: 'Activity Timeline',
              children: (
                <Card>
                  <Timeline>
                    <Timeline.Item color="blue">
                      <Text strong>Incident Reported</Text>
                      <br />
                      <Text type="secondary">
                        {dayjs(report.reportedDate).format('MMM DD, YYYY HH:mm')}
                      </Text>
                      <br />
                      <Text>by {report.reportedBy?.fullName}</Text>
                    </Timeline.Item>

                    {report.hseManagement?.reviewStartDate && (
                      <Timeline.Item color="orange">
                        <Text strong>Review Started</Text>
                        <br />
                        <Text type="secondary">
                          {dayjs(report.hseManagement.reviewStartDate).format('MMM DD, YYYY HH:mm')}
                        </Text>
                      </Timeline.Item>
                    )}

                    {report.hseManagement?.investigationStartDate && (
                      <Timeline.Item color="purple">
                        <Text strong>Investigation Started</Text>
                        <br />
                        <Text type="secondary">
                          {dayjs(report.hseManagement.investigationStartDate).format('MMM DD, YYYY HH:mm')}
                        </Text>
                      </Timeline.Item>
                    )}

                    {report.hseManagement?.investigationCompletedDate && (
                      <Timeline.Item color="blue">
                        <Text strong>Investigation Completed</Text>
                        <br />
                        <Text type="secondary">
                          {dayjs(report.hseManagement.investigationCompletedDate).format('MMM DD, YYYY HH:mm')}
                        </Text>
                      </Timeline.Item>
                    )}

                    {report.hseManagement?.updates?.map((update, index) => (
                      <Timeline.Item key={index} color="cyan">
                        <Text strong>HSE Update</Text>
                        <br />
                        <Text type="secondary">
                          {dayjs(update.date).format('MMM DD, YYYY HH:mm')}
                        </Text>
                        <br />
                        <Text>{update.comment}</Text>
                        <br />
                        <Text type="secondary">by {update.updatedBy}</Text>
                      </Timeline.Item>
                    ))}

                    {report.hseManagement?.resolutionDate && (
                      <Timeline.Item color="green">
                        <Text strong>Incident Resolved</Text>
                        <br />
                        <Text type="secondary">
                          {dayjs(report.hseManagement.resolutionDate).format('MMM DD, YYYY HH:mm')}
                        </Text>
                      </Timeline.Item>
                    )}
                  </Timeline>
                </Card>
              )
            }
          ]}
        />
      </Card>

      {renderActionModal()}
    </div>
  );
};

export default HSEIncidentReportDetail;