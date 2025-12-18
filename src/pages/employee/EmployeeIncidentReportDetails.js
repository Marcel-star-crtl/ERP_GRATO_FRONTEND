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
  message,
  Image,
  Modal
} from 'antd';
import {
  ArrowLeftOutlined,
  SafetyCertificateOutlined,
  UserOutlined,
  EnvironmentOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  FileTextOutlined,
  DownloadOutlined,
  EditOutlined,
  FilePdfOutlined,
  FileImageOutlined,
  FileOutlined,
  EyeOutlined
} from '@ant-design/icons';
import { incidentReportsAPI } from '../../services/incidentReportAPI';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const { Title, Text, Paragraph } = Typography;

const EmployeeIncidentReportDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(null);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const [previewTitle, setPreviewTitle] = useState('');

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

  const handleDownload = async (publicId, originalName) => {
    try {
      setDownloading(publicId);
      message.loading({ content: 'Downloading file...', key: 'download' });

      await incidentReportsAPI.downloadAttachment(publicId, originalName);

      message.success({ 
        content: 'File downloaded successfully!', 
        key: 'download', 
        duration: 2 
      });
    } catch (error) {
      console.error('Download error:', error);
      message.error({ 
        content: error.message || 'Failed to download file', 
        key: 'download',
        duration: 3 
      });
    } finally {
      setDownloading(null);
    }
  };

  const handlePreview = (file) => {
    const token = localStorage.getItem('token');
    const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
    
    setPreviewImage(`${API_BASE_URL}/incident-reports/download/${file.publicId}?token=${token}`);
    setPreviewTitle(file.name);
    setPreviewVisible(true);
  };

  const getFileIcon = (mimetype) => {
    if (mimetype?.startsWith('image/')) {
      return <FileImageOutlined style={{ fontSize: '24px', color: '#52c41a' }} />;
    } else if (mimetype === 'application/pdf') {
      return <FilePdfOutlined style={{ fontSize: '24px', color: '#ff4d4f' }} />;
    } else if (mimetype?.includes('document') || mimetype?.includes('word')) {
      return <FileTextOutlined style={{ fontSize: '24px', color: '#1890ff' }} />;
    }
    return <FileOutlined style={{ fontSize: '24px', color: '#8c8c8c' }} />;
  };

  const isImage = (mimetype) => {
    return mimetype?.startsWith('image/');
  };

  const getStatusTag = (status) => {
    const statusMap = {
      'submitted': { color: 'blue', icon: <FileTextOutlined />, text: 'Submitted' },
      'under_review': { color: 'orange', icon: <ClockCircleOutlined />, text: 'Under Review' },
      'under_investigation': { color: 'purple', text: 'Under Investigation' },
      'action_required': { color: 'gold', text: 'Action Required' },
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
              <Button size="small" onClick={() => navigate('/employee/incident-reports')}>
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
            <Button size="small" onClick={() => navigate('/employee/incident-reports')}>
              Back to My Reports
            </Button>
          }
        />
      </div>
    );
  }

  const canEdit = report.status === 'submitted';

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/employee/incident-reports')}
            style={{ marginBottom: '16px' }}
          >
            Back to My Reports
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

            {canEdit && (
              <Button
                type="primary"
                icon={<EditOutlined />}
                onClick={() => navigate(`/employee/incident-reports/${report._id}/edit`)}
              >
                Edit Report
              </Button>
            )}
          </div>
        </div>

        <Divider />

        {/* Basic Information */}
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
            <Card title="HSE Management Status" size="small">
              <Descriptions column={1} size="small">
                <Descriptions.Item label="Assigned HSE Coordinator">
                  {report.hseManagement?.assignedTo || 'Mr. Ovo Becheni'}
                </Descriptions.Item>
                <Descriptions.Item label="Current Status">
                  {getStatusTag(report.status)}
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

        {/* Description */}
        <Card title="Incident Description" style={{ marginTop: '24px' }} size="small">
          <Paragraph>{report.description}</Paragraph>
        </Card>

        {/* Immediate Actions */}
        {report.immediateActions && (
          <Card title="Immediate Actions Taken" style={{ marginTop: '16px' }} size="small">
            <Paragraph>{report.immediateActions}</Paragraph>
          </Card>
        )}

        {/* Contributing Factors */}
        {report.contributingFactors && (
          <Card title="Contributing Factors" style={{ marginTop: '16px' }} size="small">
            <Paragraph>{report.contributingFactors}</Paragraph>
          </Card>
        )}

        {/* Preventive Measures */}
        {report.preventiveMeasures && (
          <Card title="Preventive Measures Suggested" style={{ marginTop: '16px' }} size="small">
            <Paragraph>{report.preventiveMeasures}</Paragraph>
          </Card>
        )}

        {/* Attachments - Enhanced with Preview and Download */}
        {report.attachments && report.attachments.length > 0 && (
          <Card title="Attachments" style={{ marginTop: '16px' }} size="small">
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              {report.attachments.map((file, index) => (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px',
                    border: '1px solid #f0f0f0',
                    borderRadius: '8px',
                    backgroundColor: '#fafafa',
                    transition: 'all 0.3s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f0f7ff';
                    e.currentTarget.style.borderColor = '#1890ff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#fafafa';
                    e.currentTarget.style.borderColor = '#f0f0f0';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                    {getFileIcon(file.mimetype)}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 500, marginBottom: '4px' }}>
                        {file.name}
                      </div>
                      <Space size="small">
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          {(file.size / 1024).toFixed(2)} KB
                        </Text>
                        {file.mimetype && (
                          <Text type="secondary" style={{ fontSize: '12px' }}>
                            • {file.mimetype.split('/')[1]?.toUpperCase()}
                          </Text>
                        )}
                      </Space>
                    </div>
                  </div>

                  <Space>
                    {isImage(file.mimetype) && (
                      <Button
                        icon={<EyeOutlined />}
                        size="small"
                        onClick={() => handlePreview(file)}
                      >
                        Preview
                      </Button>
                    )}
                    <Button
                      icon={<DownloadOutlined />}
                      type="primary"
                      size="small"
                      loading={downloading === file.publicId}
                      onClick={() => handleDownload(file.publicId, file.name)}
                    >
                      Download
                    </Button>
                  </Space>
                </div>
              ))}
            </Space>
          </Card>
        )}

        {/* HSE Actions (if any) */}
        {(report.hseManagement?.correctiveActions?.length > 0 || report.hseManagement?.preventiveActions?.length > 0) && (
          <Card title="HSE Actions Taken" style={{ marginTop: '24px' }} size="small">
            {report.hseManagement?.correctiveActions?.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <Text strong>Corrective Actions:</Text>
                <ul>
                  {report.hseManagement.correctiveActions.map((action, index) => (
                    <li key={index}>
                      {action.action}
                      {action.status === 'completed' && (
                        <Tag color="green" style={{ marginLeft: '8px' }}>Completed</Tag>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {report.hseManagement?.preventiveActions?.length > 0 && (
              <div>
                <Text strong>Preventive Actions:</Text>
                <ul>
                  {report.hseManagement.preventiveActions.map((action, index) => (
                    <li key={index}>
                      {action.action}
                      {action.status === 'completed' && (
                        <Tag color="green" style={{ marginLeft: '8px' }}>Completed</Tag>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Card>
        )}

        {/* Resolution */}
        {report.status === 'resolved' && report.hseManagement?.resolutionSummary && (
          <Card title="Resolution Summary" style={{ marginTop: '24px' }} size="small">
            <Descriptions column={1}>
              <Descriptions.Item label="Resolved Date">
                {dayjs(report.hseManagement.resolutionDate).format('MMM DD, YYYY')}
              </Descriptions.Item>
              <Descriptions.Item label="Summary">
                <Paragraph>{report.hseManagement.resolutionSummary}</Paragraph>
              </Descriptions.Item>
              {report.hseManagement?.lessonsLearned && (
                <Descriptions.Item label="Lessons Learned">
                  <Paragraph>{report.hseManagement.lessonsLearned}</Paragraph>
                </Descriptions.Item>
              )}
            </Descriptions>
          </Card>
        )}

        {/* Timeline */}
        <Card title="Activity Timeline" style={{ marginTop: '24px' }} size="small">
          <Timeline>
            <Timeline.Item color="blue">
              <Text strong>Incident Reported</Text>
              <br />
              <Text type="secondary">
                {dayjs(report.reportedDate).format('MMM DD, YYYY HH:mm')}
              </Text>
            </Timeline.Item>

            {report.hseManagement?.reviewStartDate && (
              <Timeline.Item color="orange">
                <Text strong>HSE Review Started</Text>
                <br />
                <Text type="secondary">
                  {dayjs(report.hseManagement.reviewStartDate).format('MMM DD, YYYY')}
                </Text>
              </Timeline.Item>
            )}

            {report.hseManagement?.investigationStartDate && (
              <Timeline.Item color="purple">
                <Text strong>Investigation Started</Text>
                <br />
                <Text type="secondary">
                  {dayjs(report.hseManagement.investigationStartDate).format('MMM DD, YYYY')}
                </Text>
              </Timeline.Item>
            )}

            {report.hseManagement?.investigationCompletedDate && (
              <Timeline.Item color="blue">
                <Text strong>Investigation Completed</Text>
                <br />
                <Text type="secondary">
                  {dayjs(report.hseManagement.investigationCompletedDate).format('MMM DD, YYYY')}
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
              </Timeline.Item>
            ))}

            {report.hseManagement?.resolutionDate && (
              <Timeline.Item color="green">
                <Text strong>Incident Resolved</Text>
                <br />
                <Text type="secondary">
                  {dayjs(report.hseManagement.resolutionDate).format('MMM DD, YYYY')}
                </Text>
              </Timeline.Item>
            )}
          </Timeline>
        </Card>

        {/* Status Alert */}
        {report.status === 'submitted' && (
          <Alert
            message="Report Under Review"
            description="Your incident report has been submitted and is awaiting HSE review. You will be notified of any updates."
            type="info"
            showIcon
            style={{ marginTop: '24px' }}
          />
        )}

        {report.status === 'under_investigation' && (
          <Alert
            message="Investigation in Progress"
            description="HSE is currently investigating this incident. You may be contacted for additional information."
            type="warning"
            showIcon
            style={{ marginTop: '24px' }}
          />
        )}

        {report.status === 'resolved' && (
          <Alert
            message="Incident Resolved"
            description="This incident has been fully resolved by HSE. Thank you for reporting."
            type="success"
            showIcon
            style={{ marginTop: '24px' }}
          />
        )}
      </Card>

      {/* Image Preview Modal */}
      <Modal
        open={previewVisible}
        title={previewTitle}
        footer={null}
        onCancel={() => setPreviewVisible(false)}
        width={800}
        centered
      >
        <Image
          alt={previewTitle}
          style={{ width: '100%' }}
          src={previewImage}
          preview={false}
        />
      </Modal>
    </div>
  );
};

export default EmployeeIncidentReportDetails;









// import React, { useState, useEffect } from 'react';
// import { useParams, useNavigate } from 'react-router-dom';
// import {
//   Card,
//   Descriptions,
//   Tag,
//   Space,
//   Button,
//   Alert,
//   Spin,
//   Typography,
//   Divider,
//   Row,
//   Col,
//   Timeline,
//   Table,
//   Empty
// } from 'antd';
// import {
//   ArrowLeftOutlined,
//   SafetyCertificateOutlined,
//   UserOutlined,
//   EnvironmentOutlined,
//   ClockCircleOutlined,
//   CheckCircleOutlined,
//   FileTextOutlined,
//   DownloadOutlined,
//   EditOutlined
// } from '@ant-design/icons';
// import { incidentReportsAPI } from '../../services/incidentReportAPI';
// import dayjs from 'dayjs';
// import relativeTime from 'dayjs/plugin/relativeTime';

// dayjs.extend(relativeTime);

// const { Title, Text, Paragraph } = Typography;

// const EmployeeIncidentReportDetails = () => {
//   const { id } = useParams();
//   const navigate = useNavigate();
//   const [report, setReport] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   useEffect(() => {
//     fetchReportDetails();
//   }, [id]);

//   const fetchReportDetails = async () => {
//     try {
//       setLoading(true);
//       setError(null);

//       console.log('📋 Fetching incident report:', id);
//       const response = await incidentReportsAPI.getReportById(id);

//       if (response.success) {
//         setReport(response.data);
//         console.log('✅ Report loaded:', response.data);
//       } else {
//         throw new Error(response.message || 'Failed to fetch report');
//       }
//     } catch (error) {
//       console.error('❌ Error fetching report:', error);
//       setError(error.response?.data?.message || error.message || 'Failed to load report details');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const getStatusTag = (status) => {
//     const statusMap = {
//       'submitted': { color: 'blue', icon: <FileTextOutlined />, text: 'Submitted' },
//       'under_review': { color: 'orange', icon: <ClockCircleOutlined />, text: 'Under Review' },
//       'under_investigation': { color: 'purple', text: 'Under Investigation' },
//       'action_required': { color: 'gold', text: 'Action Required' },
//       'resolved': { color: 'green', icon: <CheckCircleOutlined />, text: 'Resolved' }
//     };

//     const info = statusMap[status] || { color: 'default', text: status };
//     return <Tag color={info.color} icon={info.icon}>{info.text}</Tag>;
//   };

//   const getSeverityTag = (severity) => {
//     const severityMap = {
//       'critical': { color: 'red', text: 'Critical' },
//       'high': { color: 'orange', text: 'High' },
//       'medium': { color: 'yellow', text: 'Medium' },
//       'low': { color: 'green', text: 'Low' }
//     };

//     const info = severityMap[severity] || { color: 'default', text: severity };
//     return <Tag color={info.color}>{info.text}</Tag>;
//   };

//   if (loading && !report) {
//     return (
//       <div style={{ padding: '24px', textAlign: 'center' }}>
//         <Spin size="large" />
//         <div style={{ marginTop: '16px' }}>Loading incident report...</div>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div style={{ padding: '24px' }}>
//         <Alert
//           message="Error Loading Report"
//           description={error}
//           type="error"
//           showIcon
//           action={
//             <Space>
//               <Button size="small" onClick={() => navigate('/employee/incident-reports')}>
//                 Go Back
//               </Button>
//               <Button size="small" type="primary" onClick={fetchReportDetails}>
//                 Retry
//               </Button>
//             </Space>
//           }
//         />
//       </div>
//     );
//   }

//   if (!report) {
//     return (
//       <div style={{ padding: '24px' }}>
//         <Alert
//           message="Report Not Found"
//           description="The requested incident report could not be found."
//           type="warning"
//           showIcon
//           action={
//             <Button size="small" onClick={() => navigate('/employee/incident-reports')}>
//               Back to My Reports
//             </Button>
//           }
//         />
//       </div>
//     );
//   }

//   const canEdit = report.status === 'submitted';

//   return (
//     <div style={{ padding: '24px' }}>
//       <Card>
//         {/* Header */}
//         <div style={{ marginBottom: '24px' }}>
//           <Button
//             icon={<ArrowLeftOutlined />}
//             onClick={() => navigate('/employee/incident-reports')}
//             style={{ marginBottom: '16px' }}
//           >
//             Back to My Reports
//           </Button>

//           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
//             <div>
//               <Title level={2} style={{ margin: 0 }}>
//                 <SafetyCertificateOutlined /> {report.title}
//               </Title>
//               <Space style={{ marginTop: '8px' }}>
//                 <Text code>{report.reportNumber}</Text>
//                 {getStatusTag(report.status)}
//                 {getSeverityTag(report.severity)}
//                 {report.injuriesReported && <Tag color="red">Injuries Reported</Tag>}
//               </Space>
//             </div>

//             {canEdit && (
//               <Button
//                 type="primary"
//                 icon={<EditOutlined />}
//                 onClick={() => navigate(`/employee/incident-reports/${report._id}/edit`)}
//               >
//                 Edit Report
//               </Button>
//             )}
//           </div>
//         </div>

//         <Divider />

//         {/* Basic Information */}
//         <Row gutter={[24, 24]}>
//           <Col span={12}>
//             <Card title="Basic Information" size="small">
//               <Descriptions column={1} size="small">
//                 <Descriptions.Item label="Reported By">
//                   <Space>
//                     <UserOutlined />
//                     {report.reportedBy?.fullName || 'Unknown'}
//                   </Space>
//                 </Descriptions.Item>
//                 <Descriptions.Item label="Department">
//                   {report.reportedBy?.department || 'N/A'}
//                 </Descriptions.Item>
//                 <Descriptions.Item label="Incident Date">
//                   <Space>
//                     <ClockCircleOutlined />
//                     {dayjs(report.incidentDate).format('MMM DD, YYYY')} at {report.incidentTime}
//                   </Space>
//                 </Descriptions.Item>
//                 <Descriptions.Item label="Reported Date">
//                   {dayjs(report.reportedDate).format('MMM DD, YYYY')}
//                 </Descriptions.Item>
//                 <Descriptions.Item label="Location">
//                   <Space>
//                     <EnvironmentOutlined />
//                     {report.location} - {report.specificLocation}
//                   </Space>
//                 </Descriptions.Item>
//                 <Descriptions.Item label="Incident Type">
//                   <Tag>{report.incidentType?.replace('_', ' ')}</Tag>
//                 </Descriptions.Item>
//               </Descriptions>
//             </Card>
//           </Col>

//           <Col span={12}>
//             <Card title="HSE Management Status" size="small">
//               <Descriptions column={1} size="small">
//                 <Descriptions.Item label="Assigned HSE Coordinator">
//                   {report.hseManagement?.assignedTo || 'Mr. Ovo Becheni'}
//                 </Descriptions.Item>
//                 <Descriptions.Item label="Current Status">
//                   {getStatusTag(report.status)}
//                 </Descriptions.Item>
//                 {report.hseManagement?.reviewStartDate && (
//                   <Descriptions.Item label="Review Started">
//                     {dayjs(report.hseManagement.reviewStartDate).format('MMM DD, YYYY')}
//                   </Descriptions.Item>
//                 )}
//                 {report.hseManagement?.resolutionDate && (
//                   <Descriptions.Item label="Resolved Date">
//                     {dayjs(report.hseManagement.resolutionDate).format('MMM DD, YYYY')}
//                   </Descriptions.Item>
//                 )}
//               </Descriptions>
//             </Card>
//           </Col>
//         </Row>

//         {/* Description */}
//         <Card title="Incident Description" style={{ marginTop: '24px' }} size="small">
//           <Paragraph>{report.description}</Paragraph>
//         </Card>

//         {/* Immediate Actions */}
//         {report.immediateActions && (
//           <Card title="Immediate Actions Taken" style={{ marginTop: '16px' }} size="small">
//             <Paragraph>{report.immediateActions}</Paragraph>
//           </Card>
//         )}

//         {/* Contributing Factors */}
//         {report.contributingFactors && (
//           <Card title="Contributing Factors" style={{ marginTop: '16px' }} size="small">
//             <Paragraph>{report.contributingFactors}</Paragraph>
//           </Card>
//         )}

//         {/* Preventive Measures */}
//         {report.preventiveMeasures && (
//           <Card title="Preventive Measures Suggested" style={{ marginTop: '16px' }} size="small">
//             <Paragraph>{report.preventiveMeasures}</Paragraph>
//           </Card>
//         )}

//         {/* Attachments */}
//         {report.attachments && report.attachments.length > 0 && (
//           <Card title="Attachments" style={{ marginTop: '16px' }} size="small">
//             <Space direction="vertical">
//               {report.attachments.map((file, index) => (
//                 <Button
//                   key={index}
//                   icon={<DownloadOutlined />}
//                   type="link"
//                   href={file.url}
//                   target="_blank"
//                 >
//                   {file.name} ({(file.size / 1024).toFixed(2)} KB)
//                 </Button>
//               ))}
//             </Space>
//           </Card>
//         )}

//         {/* HSE Actions (if any) */}
//         {(report.hseManagement?.correctiveActions?.length > 0 || report.hseManagement?.preventiveActions?.length > 0) && (
//           <Card title="HSE Actions Taken" style={{ marginTop: '24px' }} size="small">
//             {report.hseManagement?.correctiveActions?.length > 0 && (
//               <div style={{ marginBottom: '16px' }}>
//                 <Text strong>Corrective Actions:</Text>
//                 <ul>
//                   {report.hseManagement.correctiveActions.map((action, index) => (
//                     <li key={index}>
//                       {action.action}
//                       {action.status === 'completed' && (
//                         <Tag color="green" style={{ marginLeft: '8px' }}>Completed</Tag>
//                       )}
//                     </li>
//                   ))}
//                 </ul>
//               </div>
//             )}

//             {report.hseManagement?.preventiveActions?.length > 0 && (
//               <div>
//                 <Text strong>Preventive Actions:</Text>
//                 <ul>
//                   {report.hseManagement.preventiveActions.map((action, index) => (
//                     <li key={index}>
//                       {action.action}
//                       {action.status === 'completed' && (
//                         <Tag color="green" style={{ marginLeft: '8px' }}>Completed</Tag>
//                       )}
//                     </li>
//                   ))}
//                 </ul>
//               </div>
//             )}
//           </Card>
//         )}

//         {/* Resolution */}
//         {report.status === 'resolved' && report.hseManagement?.resolutionSummary && (
//           <Card title="Resolution Summary" style={{ marginTop: '24px' }} size="small">
//             <Descriptions column={1}>
//               <Descriptions.Item label="Resolved Date">
//                 {dayjs(report.hseManagement.resolutionDate).format('MMM DD, YYYY')}
//               </Descriptions.Item>
//               <Descriptions.Item label="Summary">
//                 <Paragraph>{report.hseManagement.resolutionSummary}</Paragraph>
//               </Descriptions.Item>
//               {report.hseManagement?.lessonsLearned && (
//                 <Descriptions.Item label="Lessons Learned">
//                   <Paragraph>{report.hseManagement.lessonsLearned}</Paragraph>
//                 </Descriptions.Item>
//               )}
//             </Descriptions>
//           </Card>
//         )}

//         {/* Timeline */}
//         <Card title="Activity Timeline" style={{ marginTop: '24px' }} size="small">
//           <Timeline>
//             <Timeline.Item color="blue">
//               <Text strong>Incident Reported</Text>
//               <br />
//               <Text type="secondary">
//                 {dayjs(report.reportedDate).format('MMM DD, YYYY HH:mm')}
//               </Text>
//             </Timeline.Item>

//             {report.hseManagement?.reviewStartDate && (
//               <Timeline.Item color="orange">
//                 <Text strong>HSE Review Started</Text>
//                 <br />
//                 <Text type="secondary">
//                   {dayjs(report.hseManagement.reviewStartDate).format('MMM DD, YYYY')}
//                 </Text>
//               </Timeline.Item>
//             )}

//             {report.hseManagement?.investigationStartDate && (
//               <Timeline.Item color="purple">
//                 <Text strong>Investigation Started</Text>
//                 <br />
//                 <Text type="secondary">
//                   {dayjs(report.hseManagement.investigationStartDate).format('MMM DD, YYYY')}
//                 </Text>
//               </Timeline.Item>
//             )}

//             {report.hseManagement?.investigationCompletedDate && (
//               <Timeline.Item color="blue">
//                 <Text strong>Investigation Completed</Text>
//                 <br />
//                 <Text type="secondary">
//                   {dayjs(report.hseManagement.investigationCompletedDate).format('MMM DD, YYYY')}
//                 </Text>
//               </Timeline.Item>
//             )}

//             {report.hseManagement?.updates?.map((update, index) => (
//               <Timeline.Item key={index} color="cyan">
//                 <Text strong>HSE Update</Text>
//                 <br />
//                 <Text type="secondary">
//                   {dayjs(update.date).format('MMM DD, YYYY HH:mm')}
//                 </Text>
//                 <br />
//                 <Text>{update.comment}</Text>
//               </Timeline.Item>
//             ))}

//             {report.hseManagement?.resolutionDate && (
//               <Timeline.Item color="green">
//                 <Text strong>Incident Resolved</Text>
//                 <br />
//                 <Text type="secondary">
//                   {dayjs(report.hseManagement.resolutionDate).format('MMM DD, YYYY')}
//                 </Text>
//               </Timeline.Item>
//             )}
//           </Timeline>
//         </Card>

//         {/* Status Alert */}
//         {report.status === 'submitted' && (
//           <Alert
//             message="Report Under Review"
//             description="Your incident report has been submitted and is awaiting HSE review. You will be notified of any updates."
//             type="info"
//             showIcon
//             style={{ marginTop: '24px' }}
//           />
//         )}

//         {report.status === 'under_investigation' && (
//           <Alert
//             message="Investigation in Progress"
//             description="HSE is currently investigating this incident. You may be contacted for additional information."
//             type="warning"
//             showIcon
//             style={{ marginTop: '24px' }}
//           />
//         )}

//         {report.status === 'resolved' && (
//           <Alert
//             message="Incident Resolved"
//             description="This incident has been fully resolved by HSE. Thank you for reporting."
//             type="success"
//             showIcon
//             style={{ marginTop: '24px' }}
//           />
//         )}
//       </Card>
//     </div>
//   );
// };

// export default EmployeeIncidentReportDetails;









// import React, { useEffect, useState } from 'react';
// import { useParams, useNavigate } from 'react-router-dom';
// import { Card, Typography, Tag, Divider, Button, Space, Spin, Alert, List, Image } from 'antd';
// import { ArrowLeftOutlined, FileImageOutlined, FileTextOutlined, DownloadOutlined } from '@ant-design/icons';
// import { incidentReportsAPI } from '../../services/incidentReportAPI';

// const { Title, Text } = Typography;

// const EmployeeIncidentReportDetails = () => {
//   const { id } = useParams();
//   const navigate = useNavigate();
//   const [report, setReport] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   useEffect(() => {
//     const fetchReport = async () => {
//       try {
//         setLoading(true);
//         setError(null);
//         const response = await incidentReportsAPI.getReportById(id);
//         if (response.success) {
//           setReport(response.data);
//         } else {
//           throw new Error(response.message || 'Failed to fetch report');
//         }
//       } catch (err) {
//         setError(err.message);
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchReport();
//   }, [id]);

//   if (loading) return <Spin tip="Loading incident report..." />;
//   if (error) return <Alert type="error" message={error} />;
//   if (!report) return <Alert type="warning" message="Incident report not found." />;

//   return (
//     <Card bordered style={{ maxWidth: 800, margin: '0 auto' }}>
//       <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)} style={{ marginBottom: 16 }}>
//         Back
//       </Button>
//       <Title level={3}>Incident Report #{report.reportNumber}</Title>
//       <Divider />
//       <Space direction="vertical" size="small" style={{ width: '100%' }}>
//         <Text strong>Title:</Text> <Text>{report.title}</Text>
//         <Text strong>Type:</Text> <Tag>{report.incidentType}</Tag>
//         <Text strong>Severity:</Text> <Tag>{report.severity}</Tag>
//         <Text strong>Status:</Text> <Tag>{report.status}</Tag>
//         <Text strong>Location:</Text> <Text>{report.location}</Text>
//         <Text strong>Date:</Text> <Text>{new Date(report.incidentDate).toLocaleString()}</Text>
//         <Text strong>Description:</Text> <Text>{report.description}</Text>
//         <Divider />
//         <Text strong>Attachments:</Text>
//         {report.attachments && report.attachments.length > 0 ? (
//           <List
//             dataSource={report.attachments}
//             renderItem={file => (
//               <List.Item>
//                 {file.mimetype && file.mimetype.startsWith('image') ? (
//                   <Image width={120} src={file.url} alt={file.name} style={{ marginRight: 8 }} />
//                 ) : (
//                   <FileTextOutlined style={{ fontSize: 20, marginRight: 8 }} />
//                 )}
//                 <a href={file.url} target="_blank" rel="noopener noreferrer">
//                   {file.name}
//                 </a>
//                 <Button
//                   icon={<DownloadOutlined />}
//                   size="small"
//                   style={{ marginLeft: 8 }}
//                   href={file.url}
//                   target="_blank"
//                   download={file.name}
//                 >
//                   Download
//                 </Button>
//               </List.Item>
//             )}
//           />
//         ) : (
//           <Text type="secondary">No attachments</Text>
//         )}
//       </Space>
//       <Divider />
//       <Button type="primary" onClick={() => navigate(`/employee/incident-reports/${id}/edit`)}>
//         Edit Report
//       </Button>
//     </Card>
//   );
// };

// export default EmployeeIncidentReportDetails;
