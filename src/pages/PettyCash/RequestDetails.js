import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Card, 
  Descriptions, 
  Typography, 
  Tag, 
  Divider, 
  Button,
  Space,
  Spin,
  Alert,
  message,
  List,
  Modal,
  Timeline,
  Progress,
  Table,
  Row,
  Col,
  Statistic,
  Tooltip,
  Popconfirm
} from 'antd';
import { 
  ArrowLeftOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  DownloadOutlined,
  FileOutlined,
  FilePdfOutlined,
  FileImageOutlined,
  FileTextOutlined,
  FileWordOutlined,
  FileExcelOutlined,
  EyeOutlined,
  HistoryOutlined,
  DeleteOutlined,
  EditOutlined,
  SyncOutlined,
  SendOutlined,
  InfoCircleOutlined 
} from '@ant-design/icons';
import api from '../../services/api';

const { Title, Text, Paragraph } = Typography;

// PDF Viewer Component for secure PDF display
const PDFViewer = ({ publicId, fileName, onError }) => {
  const [pdfUrl, setPdfUrl] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPDF = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
        
        const response = await fetch(`${apiUrl}/files/view/${encodeURIComponent(publicId)}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to load PDF');
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        setPdfUrl(url);
      } catch (error) {
        console.error('Error loading PDF:', error);
        onError?.(error);
      } finally {
        setLoading(false);
      }
    };

    if (publicId) {
      loadPDF();
    }

    // Cleanup
    return () => {
      if (pdfUrl) {
        window.URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [publicId, onError]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <Spin size="large" />
        <div style={{ marginTop: '16px' }}>Loading PDF...</div>
      </div>
    );
  }

  if (!pdfUrl) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <Text type="danger">Failed to load PDF</Text>
      </div>
    );
  }

  return (
    <object
      data={pdfUrl}
      type="application/pdf"
      style={{
        width: '100%',
        height: '70vh',
        border: '1px solid #d9d9d9',
        borderRadius: '6px'
      }}
      title={fileName}
    >
      <p style={{ textAlign: 'center', padding: '20px' }}>
        PDF cannot be displayed inline. 
        <br />
        <Button 
          type="primary" 
          style={{ marginTop: '10px' }}
          onClick={() => {
            const link = document.createElement('a');
            link.href = pdfUrl;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }}
        >
          Download PDF
        </Button>
      </p>
    </object>
  );
};

const RequestDetails = () => {
  const { requestId } = useParams();
  const navigate = useNavigate();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloadingFiles, setDownloadingFiles] = useState(new Set());
  const [generatingPDF, setGeneratingPDF] = useState(false);
  
  // File viewer modal state
  const [fileViewerVisible, setFileViewerVisible] = useState(false);
  const [viewingFile, setViewingFile] = useState(null);
  const [fileViewerLoading, setFileViewerLoading] = useState(false);

  // Delete modal state
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Get current user ID from localStorage or context
  const currentUserId = JSON.parse(localStorage.getItem('user'))?._id;

  useEffect(() => {
    const fetchRequest = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('Fetching request details for ID:', requestId);
        
        if (!requestId) {
          throw new Error('No request ID provided');
        }

        const response = await api.get(`/cash-requests/${requestId}`);
        
        console.log('Request details response:', response.data);
        
        if (response.data.success) {
          const requestData = response.data.data;
          console.log('Setting request data:', requestData);
          console.log('Attachments found:', requestData.attachments);
          console.log('Disbursements found:', requestData.disbursements);
          setRequest(requestData);
        } else {
          throw new Error(response.data.message || 'Failed to fetch request details');
        }
      } catch (error) {
        console.error('Error fetching request:', error);
        const errorMessage = error.response?.data?.message || error.message || 'Failed to load request details';
        setError(errorMessage);
        message.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchRequest();
  }, [requestId]);

  const getStatusTag = (status) => {
    const statusMap = {
      'pending_supervisor': { 
        color: 'orange', 
        icon: <ClockCircleOutlined />, 
        text: 'Pending Supervisor' 
      },
      'pending_departmental_head': { 
        color: 'orange', 
        icon: <ClockCircleOutlined />, 
        text: 'Pending Departmental Head' 
      },
      'pending_head_of_business': { 
        color: 'orange', 
        icon: <ClockCircleOutlined />, 
        text: 'Pending Head of Business' 
      },
      'pending_finance': { 
        color: 'blue', 
        icon: <ClockCircleOutlined />, 
        text: 'Pending Finance' 
      },
      'approved': { 
        color: 'green', 
        icon: <CheckCircleOutlined />, 
        text: 'Approved' 
      },
      'denied': { 
        color: 'red', 
        icon: <CloseCircleOutlined />, 
        text: 'Denied' 
      },
      'partially_disbursed': { 
        color: 'processing', 
        icon: <SyncOutlined spin />, 
        text: 'Partially Disbursed' 
      },
      'fully_disbursed': { 
        color: 'cyan', 
        icon: <DollarOutlined />, 
        text: 'Fully Disbursed - Need Justification' 
      },
      'justification_pending_supervisor': { 
        color: 'purple', 
        icon: <ClockCircleOutlined />, 
        text: 'Justification - Pending Supervisor' 
      },
      'justification_pending_finance': { 
        color: 'geekblue', 
        icon: <ClockCircleOutlined />, 
        text: 'Justification - Pending Finance' 
      },
      'justification_rejected': { 
        color: 'red', 
        icon: <CloseCircleOutlined />, 
        text: 'Justification Rejected' 
      },
      'completed': { 
        color: 'green', 
        icon: <CheckCircleOutlined />, 
        text: 'Completed' 
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

  const getFileIcon = (mimetype, fileName) => {
    if (!mimetype && !fileName) return <FileOutlined />;
    
    const type = mimetype || fileName.split('.').pop()?.toLowerCase();
    
    if (type.includes('pdf')) return <FilePdfOutlined style={{ color: '#ff4d4f' }} />;
    if (type.includes('image') || ['jpg', 'jpeg', 'png', 'gif', 'bmp'].includes(type)) 
      return <FileImageOutlined style={{ color: '#52c41a' }} />;
    if (type.includes('word') || ['doc', 'docx'].includes(type)) 
      return <FileWordOutlined style={{ color: '#1890ff' }} />;
    if (type.includes('excel') || type.includes('spreadsheet') || ['xls', 'xlsx'].includes(type)) 
      return <FileExcelOutlined style={{ color: '#52c41a' }} />;
    if (type.includes('text') || ['txt', 'csv'].includes(type)) 
      return <FileTextOutlined style={{ color: '#faad14' }} />;
    
    return <FileOutlined />;
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'Unknown size';
    
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const handleViewAttachment = async (attachment) => {
    try {
      console.log('Viewing attachment:', attachment);
      
      if (!attachment) {
        message.error('No attachment data available');
        return;
      }

      setFileViewerLoading(true);
      setFileViewerVisible(true);

      const token = localStorage.getItem('token');
      if (!token) {
        message.error('Authentication required. Please login again.');
        setFileViewerVisible(false);
        setFileViewerLoading(false);
        return;
      }

      let publicId = attachment.publicId || attachment.name;
      
      if (!publicId) {
        console.error('Could not get publicId from attachment:', attachment);
        message.error('Unable to locate file. Invalid attachment data.');
        setFileViewerVisible(false);
        setFileViewerLoading(false);
        return;
      }

      console.log('Fetching file for viewing:', publicId);

      const isImage = attachment.mimetype?.startsWith('image/') || 
                     /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(attachment.name);
      const isPDF = attachment.mimetype === 'application/pdf' || 
                   /\.pdf$/i.test(attachment.name);

      if (isPDF) {
        setViewingFile({
          name: attachment.name,
          publicId: publicId,
          type: 'pdf',
          mimetype: attachment.mimetype
        });
        setFileViewerLoading(false);
        return;
      }

      const apiBaseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
      const downloadUrl = `${apiBaseUrl}/files/download/${encodeURIComponent(publicId)}`;
      
      const response = await fetch(downloadUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('File fetch failed:', errorText);
        throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
      }

      const blob = await response.blob();
      const fileUrl = window.URL.createObjectURL(blob);

      setViewingFile({
        name: attachment.name,
        url: fileUrl,
        type: isImage ? 'image' : 'other',
        mimetype: attachment.mimetype
      });
      
      setFileViewerLoading(false);
    } catch (error) {
      console.error('Error viewing attachment:', error);
      message.error(`Failed to view attachment: ${error.message}`);
      setFileViewerVisible(false);
      setFileViewerLoading(false);
      
      handleDownloadAttachment(attachment);
    }
  };

  const handleDownloadAttachment = async (attachment) => {
    if (!attachment) {
      message.error('No attachment data available');
      return;
    }

    const fileId = attachment._id || attachment.id;
    setDownloadingFiles(prev => new Set(prev).add(fileId));

    try {
      console.log('Downloading attachment:', attachment);
      
      const token = localStorage.getItem('token');
      if (!token) {
        message.error('Authentication required. Please login again.');
        setDownloadingFiles(prev => {
          const newSet = new Set(prev);
          newSet.delete(fileId);
          return newSet;
        });
        return;
      }

      let downloadId = '';
      
      if (attachment.publicId) {
        downloadId = attachment.publicId;
      } else if (attachment.url) {
        const urlParts = attachment.url.split('/');
        const uploadIndex = urlParts.findIndex(part => part === 'upload');
        if (uploadIndex !== -1 && uploadIndex + 2 < urlParts.length) {
          downloadId = urlParts.slice(uploadIndex + 2).join('/');
          const lastPart = downloadId.split('/').pop();
          if (lastPart && lastPart.includes('.')) {
            downloadId = downloadId.replace(/\.[^/.]+$/, '');
          }
        }
      }

      if (!downloadId) {
        console.error('Could not extract download ID from attachment:', attachment);
        message.error('Unable to locate file. Invalid attachment data.');
        setDownloadingFiles(prev => {
          const newSet = new Set(prev);
          newSet.delete(fileId);
          return newSet;
        });
        return;
      }

      console.log('Using download ID:', downloadId);

      const apiBaseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
      const downloadUrl = `${apiBaseUrl}/files/download/${encodeURIComponent(downloadId)}`;
      
      console.log('Download URL:', downloadUrl);

      const response = await fetch(downloadUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Download failed:', errorText);
        throw new Error(`Download failed: ${response.status} ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = attachment.originalName || attachment.name || 'attachment';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      message.success(`Downloaded ${attachment.originalName || attachment.name}`);
    } catch (error) {
      console.error('Error downloading attachment:', error);
      message.error(`Failed to download attachment: ${error.message}`);
    } finally {
      setDownloadingFiles(prev => {
        const newSet = new Set(prev);
        newSet.delete(fileId);
        return newSet;
      });
    }
  };

  const handleGeneratePDF = async () => {
    try {
      setGeneratingPDF(true);
      message.loading({ content: 'Generating PDF...', key: 'pdf-gen' });
      
      const token = localStorage.getItem('token');
      if (!token) {
        message.error('Authentication required. Please login again.');
        return;
      }

      const apiBaseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
      const pdfUrl = `${apiBaseUrl}/cash-requests/${requestId}/pdf`;
      
      console.log('Generating PDF from:', pdfUrl);

      const response = await fetch(pdfUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to generate PDF');
      }

      const blob = await response.blob();
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Cash_Request_${request.displayId || requestId.slice(-6).toUpperCase()}_${Date.now()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      message.success({ content: 'PDF generated and downloaded successfully!', key: 'pdf-gen' });
      
      const refreshResponse = await api.get(`/cash-requests/${requestId}`);
      if (refreshResponse.data.success) {
        setRequest(refreshResponse.data.data);
      }
      
    } catch (error) {
      console.error('PDF generation error:', error);
      message.error({ 
        content: error.message || 'Failed to generate PDF', 
        key: 'pdf-gen' 
      });
    } finally {
      setGeneratingPDF(false);
    }
  };

  const canDeleteRequest = () => {
    if (!request || !currentUserId) return false;
    
    // Must be owner
    if (request.employee._id !== currentUserId) return false;
    
    // STRICT: Only if pending_supervisor AND first approver hasn't acted
    if (request.status !== 'pending_supervisor') return false;
    
    const firstStep = request.approvalChain?.[0];
    if (!firstStep) return false;
    
    // Once ANY approver takes action, NEVER allow delete
    return firstStep.status === 'pending';
  };

  const canEditRequest = () => {
    if (!request || !currentUserId) return false;
    
    // Must be owner
    if (request.employee._id !== currentUserId) return false;
    
    // STRICT: ONLY after rejection (denied or justification_rejected)
    // NOT allowed if just pending with no approvals
    
    // Scenario 1: Request denied
    if (request.status === 'denied') return true;
    
    // Scenario 2: Justification rejected
    if (request.status && request.status.includes('justification_rejected')) return true;
    
    // All other cases: CANNOT EDIT
    return false;
  };

  const handleDeleteRequest = async () => {
    try {
      setDeleting(true);
      
      const response = await api.delete(`/cash-requests/${requestId}`);
      
      if (response.data.success) {
        message.success('Request deleted successfully');
        navigate('/employee/cash-requests');
      }
    } catch (error) {
      console.error('Delete error:', error);
      message.error(error.response?.data?.message || 'Failed to delete request');
    } finally {
      setDeleting(false);
      setDeleteModalVisible(false);
    }
  };

  const handleGoToJustification = () => {
    navigate(`/employee/cash-request/${requestId}/justify`);
  };

  const handleGoBack = () => {
    navigate('/employee/cash-requests');
  };

  // ============================================
  // DISBURSEMENT PROGRESS SECTION
  // ============================================
  const DisbursementProgressSection = ({ request }) => {
    if (!['partially_disbursed', 'fully_disbursed'].includes(request.status)) {
      return null;
    }

    const amountApproved = request.amountApproved || request.amountRequested;
    const totalDisbursed = request.totalDisbursed || 0;
    const remainingBalance = request.remainingBalance || 0;
    const progress = request.disbursementProgress || 0;

    return (
      <>
        <Divider orientation="left">
          <Title level={4} style={{ margin: 0 }}>
            <DollarOutlined /> Disbursement Progress
          </Title>
        </Divider>

        <Alert
          message={
            request.status === 'fully_disbursed' 
              ? '✅ Request Fully Disbursed' 
              : '💰 Partial Disbursement in Progress'
          }
          description={
            request.status === 'fully_disbursed'
              ? 'All approved funds have been disbursed. Please submit your justification with receipts.'
              : 'Your request is being disbursed in installments. You will be notified on each payment.'
          }
          type={request.status === 'fully_disbursed' ? 'success' : 'info'}
          showIcon
          style={{ marginBottom: '16px' }}
        />

        {/* Progress Bar */}
        <div style={{ marginBottom: '24px' }}>
          <Text strong>Payment Progress</Text>
          <Progress 
            percent={progress} 
            status={progress === 100 ? 'success' : 'active'}
            strokeColor={{
              '0%': '#108ee9',
              '100%': '#52c41a',
            }}
          />
        </div>

        {/* Financial Summary */}
        <Descriptions bordered column={2} size="small" style={{ marginBottom: '24px' }}>
          <Descriptions.Item label="Amount Approved">
            <Text strong>XAF {amountApproved.toLocaleString()}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="Total Disbursed">
            <Text strong style={{ color: '#1890ff' }}>
              XAF {totalDisbursed.toLocaleString()}
            </Text>
          </Descriptions.Item>
          <Descriptions.Item label="Remaining Balance">
            <Text strong style={{ color: remainingBalance > 0 ? '#faad14' : '#52c41a' }}>
              XAF {remainingBalance.toLocaleString()}
            </Text>
          </Descriptions.Item>
          <Descriptions.Item label="Payments Received">
            <Tag color="blue">{request.disbursements?.length || 0}</Tag>
          </Descriptions.Item>
        </Descriptions>

        {/* Disbursement History */}
        {request.disbursements && request.disbursements.length > 0 && (
          <>
            <Title level={5}>
              <HistoryOutlined /> Payment History
            </Title>
            <Timeline>
              {request.disbursements.map((disb, index) => (
                <Timeline.Item 
                  key={index}
                  color="green"
                  dot={<DollarOutlined style={{ fontSize: '16px' }} />}
                >
                  <div>
                    <Text strong>Payment #{disb.disbursementNumber}</Text>
                    <br />
                    <Text>Amount: XAF {disb.amount.toLocaleString()}</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {new Date(disb.date).toLocaleString('en-GB')}
                    </Text>
                    {disb.notes && (
                      <>
                        <br />
                        <Text italic style={{ fontSize: '12px', color: '#666' }}>
                          Note: {disb.notes}
                        </Text>
                      </>
                    )}
                  </div>
                </Timeline.Item>
              ))}
            </Timeline>
          </>
        )}

        {request.status === 'fully_disbursed' && (
          <div style={{ marginTop: '16px', textAlign: 'center' }}>
            <Button 
              type="primary" 
              size="large"
              onClick={handleGoToJustification}
              icon={<SendOutlined />}
            >
              Submit Justification
            </Button>
          </div>
        )}
      </>
    );
  };

  if (loading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Spin size="large" />
        <div style={{ marginTop: '16px' }}>Loading request details...</div>
      </div>
    );
  }

  if (error || !request) {
    return (
      <div style={{ padding: '24px' }}>
        <Alert
          message="Error Loading Request"
          description={error || "The request you are trying to access does not exist or you don't have permission to view it."}
          type="error"
          showIcon
          action={
            <Button onClick={handleGoBack}>
              Back to Requests
            </Button>
          }
        />
      </div>
    );
  }

  console.log('Rendering with request:', request);
  console.log('Attachments in render:', request.attachments);

  const canGeneratePDF = ['partially_disbursed', 'fully_disbursed', 'completed'].includes(request.status);

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <Title level={3} style={{ margin: 0 }}>
            Cash Request Details
          </Title>
          <Space>
            <Text type="secondary">
              REQ-{request._id?.slice(-6).toUpperCase() || 'N/A'}
            </Text>
            {request.isEdited && request.totalEdits > 0 && (
              <Tag color="orange">
                <EditOutlined /> Edited {request.totalEdits}x
              </Tag>
            )}
            {canGeneratePDF && (
              <Button
                type="primary"
                icon={<FilePdfOutlined />}
                onClick={handleGeneratePDF}
                loading={generatingPDF}
                danger
                size="large"
              >
                {generatingPDF ? 'Generating...' : 'Download PDF'}
              </Button>
            )}
          </Space>
        </div>

        {/* PDF Available Alert */}
        {canGeneratePDF && (
          <Alert
            message="Official PDF Document Available"
            description="This request has been disbursed. You can download the official PDF document with complete approval chain details and all request information."
            type="success"
            showIcon
            icon={<FilePdfOutlined />}
            style={{ marginBottom: '24px' }}
            action={
              <Button 
                type="primary" 
                size="small"
                onClick={handleGeneratePDF}
                loading={generatingPDF}
              >
                Download PDF
              </Button>
            }
          />
        )}

        {/* Edit/Delete Warning (if editable/deletable) */}
        {(canEditRequest() || canDeleteRequest()) && (
          <Alert
            message={canEditRequest() ? "Request Can Be Edited" : "Request Can Be Deleted"}
            description={
              <div>
                {canEditRequest() && (
                  <>
                    <p>This request was rejected and can be edited for resubmission.</p>
                    <ul style={{ marginBottom: 0, paddingLeft: '20px' }}>
                      <li>Edit the request to address rejection reasons</li>
                      <li>Approval process will restart from Level 1 after resubmission</li>
                    </ul>
                  </>
                )}
                {canDeleteRequest() && (
                  <>
                    <p>This request is still pending first approval and can be deleted.</p>
                    <ul style={{ marginBottom: 0, paddingLeft: '20px' }}>
                      <li>Once any approver takes action, deletion is no longer possible</li>
                      <li>Consider editing instead of deleting if changes are needed</li>
                    </ul>
                  </>
                )}
              </div>
            }
            type={canEditRequest() ? "warning" : "info"}
            showIcon
            style={{ marginBottom: '24px' }}
            action={
              <Space>
                {canEditRequest() && (
                  <Button 
                    size="small"
                    icon={<EditOutlined />}
                    onClick={() => navigate(`/employee/cash-request/${requestId}/edit`)}
                  >
                    Edit & Resubmit
                  </Button>
                )}
                {canDeleteRequest() && (
                  <Button 
                    danger
                    size="small"
                    icon={<DeleteOutlined />}
                    onClick={() => setDeleteModalVisible(true)}
                  >
                    Delete
                  </Button>
                )}
              </Space>
            }
          />
        )}

        <Descriptions bordered column={1} size="middle">
          <Descriptions.Item label="Request ID">
            <Text code copyable>REQ-{request._id?.slice(-6).toUpperCase() || 'N/A'}</Text>
          </Descriptions.Item>
          
          <Descriptions.Item label="Status">
            <Space>
              {getStatusTag(request.status)}
              {request.isEdited && (
                <Tag color="orange" icon={<EditOutlined />}>
                  Edited {request.totalEdits}x
                </Tag>
              )}
            </Space>
          </Descriptions.Item>
          
          <Descriptions.Item label="Amount Requested">
            <Text strong style={{ fontSize: '16px' }}>
              XAF {Number(request.amountRequested || 0).toLocaleString()}
            </Text>
          </Descriptions.Item>
          
          {request.amountApproved !== undefined && (
            <Descriptions.Item label="Amount Approved">
              <Text strong style={{ fontSize: '16px', color: '#52c41a' }}>
                XAF {Number(request.amountApproved || 0).toLocaleString()}
              </Text>
            </Descriptions.Item>
          )}
          
          {(request.totalDisbursed > 0 || request.disbursements?.length > 0) && (
            <Descriptions.Item label="Total Disbursed">
              <Text strong style={{ fontSize: '16px', color: '#1890ff' }}>
                XAF {Number(request.totalDisbursed || 0).toLocaleString()}
              </Text>
              {request.disbursements && request.disbursements.length > 0 && (
                <Tag color="blue" style={{ marginLeft: '8px' }}>
                  {request.disbursements.length} payment(s)
                </Tag>
              )}
            </Descriptions.Item>
          )}

          {request.remainingBalance > 0 && (
            <Descriptions.Item label="Remaining Balance">
              <Text strong style={{ fontSize: '16px', color: '#faad14' }}>
                XAF {Number(request.remainingBalance || 0).toLocaleString()}
              </Text>
            </Descriptions.Item>
          )}
          
          <Descriptions.Item label="Request Type">
            {request.requestType?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'N/A'}
          </Descriptions.Item>
          
          <Descriptions.Item label="Purpose">
            <Paragraph style={{ marginBottom: 0 }}>
              {request.purpose || 'N/A'}
            </Paragraph>
          </Descriptions.Item>
          
          <Descriptions.Item label="Business Justification">
            <Paragraph style={{ marginBottom: 0 }}>
              {request.businessJustification || 'N/A'}
            </Paragraph>
          </Descriptions.Item>
          
          <Descriptions.Item label="Urgency">
            <Tag color={
              request.urgency === 'urgent' ? 'red' : 
              request.urgency === 'high' ? 'orange' : 
              request.urgency === 'medium' ? 'blue' : 'green'
            }>
              {request.urgency?.toUpperCase() || 'N/A'}
            </Tag>
          </Descriptions.Item>
          
          <Descriptions.Item label="Required By">
            {request.requiredDate ? new Date(request.requiredDate).toLocaleDateString('en-GB') : 'N/A'}
          </Descriptions.Item>
          
          <Descriptions.Item label="Date Submitted">
            {request.createdAt ? new Date(request.createdAt).toLocaleDateString('en-GB') : 'N/A'}
          </Descriptions.Item>

          {request.disbursementDetails?.date && (
            <Descriptions.Item label="First Disbursement Date">
              {new Date(request.disbursementDetails.date).toLocaleDateString('en-GB')}
            </Descriptions.Item>
          )}

          {/* Project Information */}
          {request.projectId && (
            <Descriptions.Item label="Project">
              <Text strong>{request.projectId.name || 'N/A'}</Text>
              {request.projectId.code && <Tag style={{ marginLeft: 8 }}>{request.projectId.code}</Tag>}
            </Descriptions.Item>
          )}

          {/* Budget Allocation */}
          {request.budgetAllocation && request.budgetAllocation.budgetCodeId && (
            <>
              <Descriptions.Item label="Budget Code">
                <Text code>{request.budgetAllocation.budgetCode}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Budget Name">
                {request.budgetAllocation.budgetCodeId.name || 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label="Allocated Amount">
                <Text strong>XAF {Number(request.budgetAllocation.allocatedAmount || 0).toLocaleString()}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Allocation Status">
                <Tag color="blue">{request.budgetAllocation.allocationStatus?.toUpperCase() || 'N/A'}</Tag>
              </Descriptions.Item>
            </>
          )}

          {/* Attachments Section */}
          <Descriptions.Item label="Supporting Documents">
            {request.attachments && Array.isArray(request.attachments) && request.attachments.length > 0 ? (
              <div>
                <div style={{ marginBottom: '12px' }}>
                  <Text type="secondary">
                    {request.attachments.length} file{request.attachments.length !== 1 ? 's' : ''} attached
                  </Text>
                </div>
                <List
                  size="small"
                  bordered
                  dataSource={request.attachments}
                  renderItem={(attachment, index) => (
                    <List.Item
                      key={attachment._id || attachment.id || index}
                      actions={[
                        <Button
                          key="view"
                          type="link"
                          size="small"
                          icon={<EyeOutlined />}
                          onClick={() => handleViewAttachment(attachment)}
                        >
                          View
                        </Button>,
                        <Button
                          key="download"
                          type="primary"
                          size="small"
                          icon={<DownloadOutlined />}
                          loading={downloadingFiles.has(attachment._id || attachment.id)}
                          onClick={() => handleDownloadAttachment(attachment)}
                        >
                          Download
                        </Button>
                      ]}
                    >
                      <List.Item.Meta
                        avatar={getFileIcon(attachment.mimetype, attachment.name)}
                        title={
                          <Text strong>{attachment.name || 'Unnamed file'}</Text>
                        }
                        description={
                          <div>
                            <div>{formatFileSize(attachment.size)}</div>
                            {attachment.mimetype && (
                              <Text type="secondary" style={{ fontSize: '11px' }}>
                                {attachment.mimetype}
                              </Text>
                            )}
                          </div>
                        }
                      />
                    </List.Item>
                  )}
                />
              </div>
            ) : (
              <Text type="secondary" italic>No attachments uploaded</Text>
            )}
          </Descriptions.Item>
        </Descriptions>

        {/* Requested vs Approved Amount Comparison */}
        {request.amountApproved && request.amountApproved !== request.amountRequested && (
          <>
            <Divider orientation="left">
              <Title level={4} style={{ margin: 0 }}>
                <InfoCircleOutlined /> Amount Adjustment
              </Title>
            </Divider>

            <Alert
              message="Approved Amount Differs from Requested"
              description={
                <div>
                  <Row gutter={16} style={{ marginTop: '12px' }}>
                    <Col span={8}>
                      <Statistic
                        title="Requested"
                        value={request.amountRequested}
                        precision={0}
                        prefix="XAF"
                        valueStyle={{ fontSize: '18px' }}
                      />
                    </Col>
                    <Col span={8}>
                      <Statistic
                        title="Approved"
                        value={request.amountApproved}
                        precision={0}
                        prefix="XAF"
                        valueStyle={{ color: '#52c41a', fontSize: '18px' }}
                      />
                    </Col>
                    <Col span={8}>
                      <Statistic
                        title="Difference"
                        value={request.amountRequested - request.amountApproved}
                        precision={0}
                        prefix="-XAF"
                        valueStyle={{ color: '#fa8c16', fontSize: '18px' }}
                      />
                    </Col>
                  </Row>
                  <div style={{ marginTop: '16px' }}>
                    <Text>
                      Finance approved <strong>{Math.round((request.amountApproved / request.amountRequested) * 100)}%</strong> of your requested amount.
                    </Text>
                  </div>
                </div>
              }
              type="warning"
              showIcon
              style={{ marginBottom: '24px' }}
            />
          </>
        )}

        {/* Itemized Breakdown Section */}
        {request.itemizedBreakdown && request.itemizedBreakdown.length > 0 && (
          <>
            <Divider orientation="left">
              <Title level={4} style={{ margin: 0 }}>
                <FileTextOutlined /> Itemized Expense Breakdown
              </Title>
            </Divider>
            
            <Table
              dataSource={request.itemizedBreakdown}
              pagination={false}
              size="middle"
              bordered
              rowKey={(record, index) => index}
              summary={(pageData) => {
                const total = pageData.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
                return (
                  <Table.Summary fixed>
                    <Table.Summary.Row>
                      <Table.Summary.Cell index={0} colSpan={2}>
                        <Text strong style={{ fontSize: '16px' }}>Total Amount</Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={1} align="right">
                        <Text strong style={{ fontSize: '16px', color: '#1890ff' }}>
                          XAF {total.toLocaleString()}
                        </Text>
                      </Table.Summary.Cell>
                    </Table.Summary.Row>
                  </Table.Summary>
                );
              }}
            >
              <Table.Column 
                title="Description" 
                dataIndex="description" 
                key="description"
                render={(text) => <Text>{text}</Text>}
              />
              <Table.Column 
                title="Category" 
                dataIndex="category" 
                key="category"
                render={(text) => text ? (
                  <Tag color="blue">
                    {text.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </Tag>
                ) : '-'}
              />
              <Table.Column 
                title="Amount (XAF)" 
                dataIndex="amount" 
                key="amount"
                align="right"
                render={(amount) => (
                  <Text strong style={{ color: '#52c41a' }}>
                    {parseFloat(amount || 0).toLocaleString()}
                  </Text>
                )}
              />
            </Table>
          </>
        )}

        {/* DISBURSEMENT PROGRESS SECTION */}
        <DisbursementProgressSection request={request} />

        {/* Edit History */}
        {request.editHistory && request.editHistory.length > 0 && (
          <>
            <Divider orientation="left">
              <Title level={4} style={{ margin: 0 }}>
                <HistoryOutlined /> Edit History
              </Title>
            </Divider>
            
            <Alert
              message={`This request has been edited ${request.totalEdits} time${request.totalEdits > 1 ? 's' : ''}`}
              type="info"
              showIcon
              style={{ marginBottom: '16px' }}
            />
            
            <Timeline>
              {request.editHistory.map((edit, index) => (
                <Timeline.Item key={index} color="orange" dot={<EditOutlined />}>
                  <div>
                    <Text strong>Edit #{edit.editNumber}</Text>
                    <br />
                    <Text type="secondary">
                      Edited on {new Date(edit.editedAt).toLocaleString('en-GB', { 
                        dateStyle: 'medium', 
                        timeStyle: 'short' 
                      })}
                    </Text>
                    <br />
                    <Text type="secondary">
                      Previous Status: {edit.previousStatus?.replace(/_/g, ' ').toUpperCase()}
                    </Text>
                    {edit.reason && (
                      <div style={{ marginTop: '8px', padding: '8px', backgroundColor: '#fff7e6', borderRadius: 4 }}>
                        <Text italic>Reason: "{edit.reason}"</Text>
                      </div>
                    )}
                    {edit.changes && Object.keys(edit.changes).length > 0 && (
                      <div style={{ marginTop: '8px' }}>
                        <Text strong>Fields Changed:</Text>
                        <ul style={{ marginTop: '4px', marginBottom: 0 }}>
                          {Object.entries(edit.changes).map(([field, change]) => (
                            <li key={field}>
                              <Text code>{field}</Text>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </Timeline.Item>
              ))}
            </Timeline>
          </>
        )}

        {/* Approval Chain Timeline */}
        {request.approvalChain && request.approvalChain.length > 0 && (
          <>
            <Divider orientation="left">
              <Title level={4} style={{ margin: 0 }}>Approval Chain</Title>
            </Divider>
            
            <div style={{ marginBottom: '16px' }}>
              <Progress 
                percent={Math.round((request.approvalChain.filter(s => s.status === 'approved').length / request.approvalChain.length) * 100)} 
                status={request.status === 'completed' ? 'success' : request.status === 'denied' ? 'exception' : 'active'}
                strokeColor={{
                  '0%': '#108ee9',
                  '100%': '#52c41a',
                }}
              />
            </div>

            <Timeline>
              {request.approvalChain.map((step, index) => {
                let color = 'gray';
                let icon = <ClockCircleOutlined />;
                
                if (step.status === 'approved') {
                  color = 'green';
                  icon = <CheckCircleOutlined />;
                } else if (step.status === 'rejected') {
                  color = 'red';
                  icon = <CloseCircleOutlined />;
                }

                return (
                  <Timeline.Item key={index} color={color} dot={icon}>
                    <div>
                      <Text strong>Level {step.level}: {step.approver?.name || 'Unknown'}</Text>
                      <br />
                      <Text type="secondary">{step.approver?.role || 'N/A'} - {step.approver?.department || 'N/A'}</Text>
                      <br />
                      {step.status === 'approved' && (
                        <>
                          <Tag color="green" style={{ marginTop: 4 }}>Approved</Tag>
                          {step.actionDate && (
                            <Text type="secondary" style={{ marginLeft: 8 }}>
                              {new Date(step.actionDate).toLocaleDateString('en-GB')}
                              {step.actionTime && ` at ${step.actionTime}`}
                            </Text>
                          )}
                          {step.comments && (
                            <div style={{ marginTop: 8, padding: 8, backgroundColor: '#f6ffed', borderRadius: 4 }}>
                              <Text italic>"{step.comments}"</Text>
                            </div>
                          )}
                        </>
                      )}
                      {step.status === 'rejected' && (
                        <>
                          <Tag color="red" style={{ marginTop: 4 }}>Rejected</Tag>
                          {step.actionDate && (
                            <Text type="secondary" style={{ marginLeft: 8 }}>
                              {new Date(step.actionDate).toLocaleDateString('en-GB')}
                              {step.actionTime && ` at ${step.actionTime}`}
                            </Text>
                          )}
                          {step.comments && (
                            <div style={{ marginTop: 8, padding: 8, backgroundColor: '#fff1f0', borderRadius: 4 }}>
                              <Text type="danger">Reason: "{step.comments}"</Text>
                            </div>
                          )}
                        </>
                      )}
                      {step.status === 'pending' && (
                        <Tag color="orange" style={{ marginTop: 4 }}>Pending</Tag>
                      )}
                    </div>
                  </Timeline.Item>
                );
              })}
            </Timeline>
          </>
        )}

        {/* PDF Download History */}
        {request.pdfDownloadHistory && request.pdfDownloadHistory.length > 0 && (
          <>
            <Divider orientation="left">
              <Title level={4} style={{ margin: 0 }}>
                <HistoryOutlined /> PDF Download History
              </Title>
            </Divider>
            <Timeline>
              {request.pdfDownloadHistory.map((download, index) => (
                <Timeline.Item key={index} color="blue" dot={<FilePdfOutlined />}>
                  <Text type="secondary">
                    Downloaded on {new Date(download.downloadedAt).toLocaleString('en-GB', { 
                      dateStyle: 'medium', 
                      timeStyle: 'short' 
                    })}
                  </Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    {download.filename}
                  </Text>
                </Timeline.Item>
              ))}
            </Timeline>
          </>
        )}

        <Divider />

        {/* Action Buttons */}
        <Space size="middle" wrap>
          <Button 
            type="default" 
            icon={<ArrowLeftOutlined />} 
            onClick={handleGoBack}
          >
            Back to Requests
          </Button>
          
          {/* Edit Button - Only show if allowed */}
          {canEditRequest() && (
            <Button 
              type="primary" 
              icon={<EditOutlined />}
              onClick={() => navigate(`/employee/cash-request/${requestId}/edit`)}
              style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
            >
              Edit Request
            </Button>
          )}
          
          {/* Delete Button - Only show if allowed */}
          {canDeleteRequest() && (
            <Button 
              type="primary" 
              danger
              icon={<DeleteOutlined />}
              onClick={() => setDeleteModalVisible(true)}
            >
              Delete Request
            </Button>
          )}
          
          {canGeneratePDF && (
            <Button 
              type="primary" 
              danger
              icon={<FilePdfOutlined />}
              onClick={handleGeneratePDF}
              loading={generatingPDF}
              size="large"
            >
              {generatingPDF ? 'Generating PDF...' : 'Download Official PDF'}
            </Button>
          )}
          
          {request.status === 'fully_disbursed' && (
            <Button 
              type="primary" 
              onClick={handleGoToJustification}
              icon={<SendOutlined />}
              size="large"
            >
              Submit Justification
            </Button>
          )}
        </Space>
      </Card>

      {/* File Viewer Modal */}
      <Modal
        title={viewingFile?.name || 'File Viewer'}
        open={fileViewerVisible}
        onCancel={() => {
          setFileViewerVisible(false);
          setViewingFile(null);
          setFileViewerLoading(false);
          if (viewingFile?.url) {
            window.URL.revokeObjectURL(viewingFile.url);
          }
        }}
        footer={[
          <Button 
            key="download" 
            icon={<DownloadOutlined />}
            onClick={() => {
              if (viewingFile?.url) {
                const link = document.createElement('a');
                link.href = viewingFile.url;
                link.download = viewingFile.name || 'file';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                message.success('File downloaded successfully');
              }
            }}
          >
            Download
          </Button>,
          <Button 
            key="close" 
            type="primary"
            onClick={() => {
              setFileViewerVisible(false);
              setViewingFile(null);
              setFileViewerLoading(false);
              if (viewingFile?.url) {
                window.URL.revokeObjectURL(viewingFile.url);
              }
            }}
          >
            Close
          </Button>
        ]}
        width="80%"
        style={{ top: 20 }}
        bodyStyle={{ padding: '20px', textAlign: 'center', minHeight: '60vh' }}
      >
        {fileViewerLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
            <Spin size="large" />
            <div style={{ marginLeft: '16px' }}>Loading file...</div>
          </div>
        ) : viewingFile ? (
          <div>
            {viewingFile.type === 'image' ? (
              <img 
                src={viewingFile.url} 
                alt={viewingFile.name}
                style={{ 
                  maxWidth: '100%', 
                  maxHeight: '70vh', 
                  objectFit: 'contain',
                  border: '1px solid #d9d9d9',
                  borderRadius: '6px'
                }}
              />
            ) : viewingFile.type === 'pdf' ? (
              <PDFViewer 
                publicId={viewingFile.publicId}
                fileName={viewingFile.name}
                onError={(error) => {
                  console.error('PDF viewer error:', error);
                  message.error('Failed to load PDF. Please try downloading instead.');
                }}
              />
            ) : (
              <div style={{ padding: '40px' }}>
                <Alert
                  message="Preview not available"
                  description={`File type "${viewingFile.mimetype}" cannot be previewed inline. Please download to view.`}
                  type="info"
                  showIcon
                />
              </div>
            )}
          </div>
        ) : null}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        title="Delete Cash Request"
        open={deleteModalVisible}
        onCancel={() => setDeleteModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setDeleteModalVisible(false)}>
            Cancel
          </Button>,
          <Button 
            key="delete" 
            type="primary" 
            danger 
            loading={deleting}
            onClick={handleDeleteRequest}
            icon={<DeleteOutlined />}
          >
            Yes, Delete Request
          </Button>
        ]}
      >
        <Alert
          message="Are you sure you want to delete this request?"
          description={
            <div>
              <p style={{ marginTop: '12px' }}>
                This action cannot be undone. The request and all associated data will be permanently removed.
              </p>
              <Divider style={{ margin: '12px 0' }} />
              <div style={{ backgroundColor: '#f5f5f5', padding: '12px', borderRadius: '4px' }}>
                <Text strong>Request Details:</Text>
                <div style={{ marginTop: '8px' }}>
                  <div>ID: REQ-{request._id?.slice(-6).toUpperCase()}</div>
                  <div>Amount: XAF {Number(request.amountRequested || 0).toLocaleString()}</div>
                  <div>Type: {request.requestType?.replace(/-/g, ' ')}</div>
                  <div>Status: {request.status}</div>
                  {request.isEdited && (
                    <div>Edited: {request.totalEdits} time{request.totalEdits > 1 ? 's' : ''}</div>
                  )}
                </div>
              </div>
            </div>
          }
          type="warning"
          showIcon
        />
      </Modal>
    </div>
  );
};

export default RequestDetails;








// import React, { useEffect, useState } from 'react';
// import { useParams, useNavigate } from 'react-router-dom';
// import { 
//   Card, 
//   Descriptions, 
//   Typography, 
//   Tag, 
//   Divider, 
//   Button,
//   Space,
//   Spin,
//   Alert,
//   message,
//   List,
//   Modal,
//   Timeline,
//   Progress,
//   Table
// } from 'antd';
// import { 
//   ArrowLeftOutlined,
//   CheckCircleOutlined,
//   CloseCircleOutlined,
//   ClockCircleOutlined,
//   DollarOutlined,
//   DownloadOutlined,
//   FileOutlined,
//   FilePdfOutlined,
//   FileImageOutlined,
//   FileTextOutlined,
//   FileWordOutlined,
//   FileExcelOutlined,
//   EyeOutlined,
//   HistoryOutlined,
//   DeleteOutlined,
//   EditOutlined
// } from '@ant-design/icons';
// import api from '../../services/api';

// const { Title, Text, Paragraph } = Typography;

// // PDF Viewer Component for secure PDF display
// const PDFViewer = ({ publicId, fileName, onError }) => {
//   const [pdfUrl, setPdfUrl] = useState(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const loadPDF = async () => {
//       try {
//         setLoading(true);
//         const token = localStorage.getItem('token');
//         const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
        
//         const response = await fetch(`${apiUrl}/files/view/${encodeURIComponent(publicId)}`, {
//           headers: {
//             'Authorization': `Bearer ${token}`
//           }
//         });

//         if (!response.ok) {
//           throw new Error('Failed to load PDF');
//         }

//         const blob = await response.blob();
//         const url = window.URL.createObjectURL(blob);
//         setPdfUrl(url);
//       } catch (error) {
//         console.error('Error loading PDF:', error);
//         onError?.(error);
//       } finally {
//         setLoading(false);
//       }
//     };

//     if (publicId) {
//       loadPDF();
//     }

//     // Cleanup
//     return () => {
//       if (pdfUrl) {
//         window.URL.revokeObjectURL(pdfUrl);
//       }
//     };
//   }, [publicId, onError]);

//   if (loading) {
//     return (
//       <div style={{ textAlign: 'center', padding: '40px' }}>
//         <Spin size="large" />
//         <div style={{ marginTop: '16px' }}>Loading PDF...</div>
//       </div>
//     );
//   }

//   if (!pdfUrl) {
//     return (
//       <div style={{ textAlign: 'center', padding: '40px' }}>
//         <Text type="danger">Failed to load PDF</Text>
//       </div>
//     );
//   }

//   return (
//     <object
//       data={pdfUrl}
//       type="application/pdf"
//       style={{
//         width: '100%',
//         height: '70vh',
//         border: '1px solid #d9d9d9',
//         borderRadius: '6px'
//       }}
//       title={fileName}
//     >
//       <p style={{ textAlign: 'center', padding: '20px' }}>
//         PDF cannot be displayed inline. 
//         <br />
//         <Button 
//           type="primary" 
//           style={{ marginTop: '10px' }}
//           onClick={() => {
//             const link = document.createElement('a');
//             link.href = pdfUrl;
//             link.download = fileName;
//             document.body.appendChild(link);
//             link.click();
//             document.body.removeChild(link);
//           }}
//         >
//           Download PDF
//         </Button>
//       </p>
//     </object>
//   );
// };

// const RequestDetails = () => {
//   const { requestId } = useParams();
//   const navigate = useNavigate();
//   const [request, setRequest] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [downloadingFiles, setDownloadingFiles] = useState(new Set());
//   const [generatingPDF, setGeneratingPDF] = useState(false);
  
//   // File viewer modal state
//   const [fileViewerVisible, setFileViewerVisible] = useState(false);
//   const [viewingFile, setViewingFile] = useState(null);
//   const [fileViewerLoading, setFileViewerLoading] = useState(false);

//   // Delete modal state
//   const [deleteModalVisible, setDeleteModalVisible] = useState(false);
//   const [deleting, setDeleting] = useState(false);

//   // Get current user ID from localStorage or context
//   const currentUserId = JSON.parse(localStorage.getItem('user'))?._id;

//   useEffect(() => {
//     const fetchRequest = async () => {
//       try {
//         setLoading(true);
//         setError(null);
        
//         console.log('Fetching request details for ID:', requestId);
        
//         if (!requestId) {
//           throw new Error('No request ID provided');
//         }

//         const response = await api.get(`/cash-requests/${requestId}`);
        
//         console.log('Request details response:', response.data);
        
//         if (response.data.success) {
//           const requestData = response.data.data;
//           console.log('Setting request data:', requestData);
//           console.log('Attachments found:', requestData.attachments);
//           setRequest(requestData);
//         } else {
//           throw new Error(response.data.message || 'Failed to fetch request details');
//         }
//       } catch (error) {
//         console.error('Error fetching request:', error);
//         const errorMessage = error.response?.data?.message || error.message || 'Failed to load request details';
//         setError(errorMessage);
//         message.error(errorMessage);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchRequest();
//   }, [requestId]);

//   const getStatusTag = (status) => {
//     const statusMap = {
//       'pending_supervisor': { 
//         color: 'orange', 
//         icon: <ClockCircleOutlined />, 
//         text: 'Pending Supervisor' 
//       },
//       'pending_departmental_head': { 
//         color: 'orange', 
//         icon: <ClockCircleOutlined />, 
//         text: 'Pending Departmental Head' 
//       },
//       'pending_head_of_business': { 
//         color: 'orange', 
//         icon: <ClockCircleOutlined />, 
//         text: 'Pending Head of Business' 
//       },
//       'pending_finance': { 
//         color: 'blue', 
//         icon: <ClockCircleOutlined />, 
//         text: 'Pending Finance' 
//       },
//       'approved': { 
//         color: 'green', 
//         icon: <CheckCircleOutlined />, 
//         text: 'Approved' 
//       },
//       'denied': { 
//         color: 'red', 
//         icon: <CloseCircleOutlined />, 
//         text: 'Denied' 
//       },
//       'disbursed': { 
//         color: 'cyan', 
//         icon: <DollarOutlined />, 
//         text: 'Disbursed' 
//       },
//       'justification_pending_supervisor': { 
//         color: 'purple', 
//         icon: <ClockCircleOutlined />, 
//         text: 'Justification Pending Supervisor' 
//       },
//       'justification_pending_finance': { 
//         color: 'purple', 
//         icon: <ClockCircleOutlined />, 
//         text: 'Justification Pending Finance' 
//       },
//       'justification_rejected': { 
//         color: 'orange', 
//         icon: <CloseCircleOutlined />, 
//         text: 'Justification Rejected' 
//       },
//       'completed': { 
//         color: 'green', 
//         icon: <CheckCircleOutlined />, 
//         text: 'Completed' 
//       }
//     };

//     const statusInfo = statusMap[status] || { 
//       color: 'default', 
//       text: status?.replace(/_/g, ' ') || 'Unknown' 
//     };
    
//     return (
//       <Tag color={statusInfo.color} icon={statusInfo.icon}>
//         {statusInfo.text}
//       </Tag>
//     );
//   };

//   const getFileIcon = (mimetype, fileName) => {
//     if (!mimetype && !fileName) return <FileOutlined />;
    
//     const type = mimetype || fileName.split('.').pop()?.toLowerCase();
    
//     if (type.includes('pdf')) return <FilePdfOutlined style={{ color: '#ff4d4f' }} />;
//     if (type.includes('image') || ['jpg', 'jpeg', 'png', 'gif', 'bmp'].includes(type)) 
//       return <FileImageOutlined style={{ color: '#52c41a' }} />;
//     if (type.includes('word') || ['doc', 'docx'].includes(type)) 
//       return <FileWordOutlined style={{ color: '#1890ff' }} />;
//     if (type.includes('excel') || type.includes('spreadsheet') || ['xls', 'xlsx'].includes(type)) 
//       return <FileExcelOutlined style={{ color: '#52c41a' }} />;
//     if (type.includes('text') || ['txt', 'csv'].includes(type)) 
//       return <FileTextOutlined style={{ color: '#faad14' }} />;
    
//     return <FileOutlined />;
//   };

//   const formatFileSize = (bytes) => {
//     if (!bytes) return 'Unknown size';
    
//     const sizes = ['Bytes', 'KB', 'MB', 'GB'];
//     if (bytes === 0) return '0 Bytes';
    
//     const i = Math.floor(Math.log(bytes) / Math.log(1024));
//     return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
//   };

//   const handleViewAttachment = async (attachment) => {
//     try {
//       console.log('Viewing attachment:', attachment);
      
//       if (!attachment) {
//         message.error('No attachment data available');
//         return;
//       }

//       setFileViewerLoading(true);
//       setFileViewerVisible(true);

//       const token = localStorage.getItem('token');
//       if (!token) {
//         message.error('Authentication required. Please login again.');
//         setFileViewerVisible(false);
//         setFileViewerLoading(false);
//         return;
//       }

//       let publicId = attachment.publicId || attachment.name;
      
//       if (!publicId) {
//         console.error('Could not get publicId from attachment:', attachment);
//         message.error('Unable to locate file. Invalid attachment data.');
//         setFileViewerVisible(false);
//         setFileViewerLoading(false);
//         return;
//       }

//       console.log('Fetching file for viewing:', publicId);

//       const isImage = attachment.mimetype?.startsWith('image/') || 
//                      /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(attachment.name);
//       const isPDF = attachment.mimetype === 'application/pdf' || 
//                    /\.pdf$/i.test(attachment.name);

//       if (isPDF) {
//         setViewingFile({
//           name: attachment.name,
//           publicId: publicId,
//           type: 'pdf',
//           mimetype: attachment.mimetype
//         });
//         setFileViewerLoading(false);
//         return;
//       }

//       const apiBaseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
//       const downloadUrl = `${apiBaseUrl}/files/download/${encodeURIComponent(publicId)}`;
      
//       const response = await fetch(downloadUrl, {
//         method: 'GET',
//         headers: {
//           'Authorization': `Bearer ${token}`,
//           'Content-Type': 'application/json'
//         },
//       });

//       if (!response.ok) {
//         const errorText = await response.text();
//         console.error('File fetch failed:', errorText);
//         throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
//       }

//       const blob = await response.blob();
//       const fileUrl = window.URL.createObjectURL(blob);

//       setViewingFile({
//         name: attachment.name,
//         url: fileUrl,
//         type: isImage ? 'image' : 'other',
//         mimetype: attachment.mimetype
//       });
      
//       setFileViewerLoading(false);
//     } catch (error) {
//       console.error('Error viewing attachment:', error);
//       message.error(`Failed to view attachment: ${error.message}`);
//       setFileViewerVisible(false);
//       setFileViewerLoading(false);
      
//       handleDownloadAttachment(attachment);
//     }
//   };

//   const handleDownloadAttachment = async (attachment) => {
//     if (!attachment) {
//       message.error('No attachment data available');
//       return;
//     }

//     const fileId = attachment._id || attachment.id;
//     setDownloadingFiles(prev => new Set(prev).add(fileId));

//     try {
//       console.log('Downloading attachment:', attachment);
      
//       const token = localStorage.getItem('token');
//       if (!token) {
//         message.error('Authentication required. Please login again.');
//         setDownloadingFiles(prev => {
//           const newSet = new Set(prev);
//           newSet.delete(fileId);
//           return newSet;
//         });
//         return;
//       }

//       let downloadId = '';
      
//       if (attachment.publicId) {
//         downloadId = attachment.publicId;
//       } else if (attachment.url) {
//         const urlParts = attachment.url.split('/');
//         const uploadIndex = urlParts.findIndex(part => part === 'upload');
//         if (uploadIndex !== -1 && uploadIndex + 2 < urlParts.length) {
//           downloadId = urlParts.slice(uploadIndex + 2).join('/');
//           const lastPart = downloadId.split('/').pop();
//           if (lastPart && lastPart.includes('.')) {
//             downloadId = downloadId.replace(/\.[^/.]+$/, '');
//           }
//         }
//       }

//       if (!downloadId) {
//         console.error('Could not extract download ID from attachment:', attachment);
//         message.error('Unable to locate file. Invalid attachment data.');
//         setDownloadingFiles(prev => {
//           const newSet = new Set(prev);
//           newSet.delete(fileId);
//           return newSet;
//         });
//         return;
//       }

//       console.log('Using download ID:', downloadId);

//       const apiBaseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
//       const downloadUrl = `${apiBaseUrl}/files/download/${encodeURIComponent(downloadId)}`;
      
//       console.log('Download URL:', downloadUrl);

//       const response = await fetch(downloadUrl, {
//         method: 'GET',
//         headers: {
//           'Authorization': `Bearer ${token}`,
//           'Content-Type': 'application/json'
//         },
//       });

//       console.log('Response status:', response.status);

//       if (!response.ok) {
//         const errorText = await response.text();
//         console.error('Download failed:', errorText);
//         throw new Error(`Download failed: ${response.status} ${response.statusText}`);
//       }

//       const blob = await response.blob();
//       const url = window.URL.createObjectURL(blob);
//       const link = document.createElement('a');
//       link.href = url;
//       link.download = attachment.originalName || attachment.name || 'attachment';
      
//       document.body.appendChild(link);
//       link.click();
//       document.body.removeChild(link);
//       window.URL.revokeObjectURL(url);

//       message.success(`Downloaded ${attachment.originalName || attachment.name}`);
//     } catch (error) {
//       console.error('Error downloading attachment:', error);
//       message.error(`Failed to download attachment: ${error.message}`);
//     } finally {
//       setDownloadingFiles(prev => {
//         const newSet = new Set(prev);
//         newSet.delete(fileId);
//         return newSet;
//       });
//     }
//   };

//   const handleGeneratePDF = async () => {
//     try {
//       setGeneratingPDF(true);
//       message.loading({ content: 'Generating PDF...', key: 'pdf-gen' });
      
//       const token = localStorage.getItem('token');
//       if (!token) {
//         message.error('Authentication required. Please login again.');
//         return;
//       }

//       const apiBaseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
//       const pdfUrl = `${apiBaseUrl}/cash-requests/${requestId}/pdf`;
      
//       console.log('Generating PDF from:', pdfUrl);

//       const response = await fetch(pdfUrl, {
//         method: 'GET',
//         headers: {
//           'Authorization': `Bearer ${token}`
//         }
//       });

//       if (!response.ok) {
//         const errorData = await response.json().catch(() => ({}));
//         throw new Error(errorData.message || 'Failed to generate PDF');
//       }

//       const blob = await response.blob();
      
//       const url = window.URL.createObjectURL(blob);
//       const link = document.createElement('a');
//       link.href = url;
//       link.download = `Cash_Request_${request.displayId || requestId.slice(-6).toUpperCase()}_${Date.now()}.pdf`;
//       document.body.appendChild(link);
//       link.click();
//       document.body.removeChild(link);
//       window.URL.revokeObjectURL(url);
      
//       message.success({ content: 'PDF generated and downloaded successfully!', key: 'pdf-gen' });
      
//       const refreshResponse = await api.get(`/cash-requests/${requestId}`);
//       if (refreshResponse.data.success) {
//         setRequest(refreshResponse.data.data);
//       }
      
//     } catch (error) {
//       console.error('PDF generation error:', error);
//       message.error({ 
//         content: error.message || 'Failed to generate PDF', 
//         key: 'pdf-gen' 
//       });
//     } finally {
//       setGeneratingPDF(false);
//     }
//   };

//   const canDeleteRequest = () => {
//     if (!request || !currentUserId) return false;
    
//     // Must be owner
//     if (request.employee._id !== currentUserId) return false;
    
//     // STRICT: Only if pending_supervisor AND first approver hasn't acted
//     if (request.status !== 'pending_supervisor') return false;
    
//     const firstStep = request.approvalChain?.[0];
//     if (!firstStep) return false;
    
//     // Once ANY approver takes action, NEVER allow delete
//     return firstStep.status === 'pending';
//   };

//   const canEditRequest = () => {
//     if (!request || !currentUserId) return false;
    
//     // Must be owner
//     if (request.employee._id !== currentUserId) return false;
    
//     // STRICT: ONLY after rejection (denied or justification_rejected)
//     // NOT allowed if just pending with no approvals
    
//     // Scenario 1: Request denied
//     if (request.status === 'denied') return true;
    
//     // Scenario 2: Justification rejected
//     if (request.status && request.status.includes('justification_rejected')) return true;
    
//     // All other cases: CANNOT EDIT
//     return false;
//   };

//   const handleDeleteRequest = async () => {
//     try {
//       setDeleting(true);
      
//       const response = await api.delete(`/cash-requests/${requestId}`);
      
//       if (response.data.success) {
//         message.success('Request deleted successfully');
//         navigate('/employee/cash-requests');
//       }
//     } catch (error) {
//       console.error('Delete error:', error);
//       message.error(error.response?.data?.message || 'Failed to delete request');
//     } finally {
//       setDeleting(false);
//       setDeleteModalVisible(false);
//     }
//   };

//   const handleGoToJustification = () => {
//     navigate(`/employee/cash-request/${requestId}/justify`);
//   };

//   const handleGoBack = () => {
//     navigate('/employee/cash-requests');
//   };

//   if (loading) {
//     return (
//       <div style={{ padding: '24px', textAlign: 'center' }}>
//         <Spin size="large" />
//         <div style={{ marginTop: '16px' }}>Loading request details...</div>
//       </div>
//     );
//   }

//   if (error || !request) {
//     return (
//       <div style={{ padding: '24px' }}>
//         <Alert
//           message="Error Loading Request"
//           description={error || "The request you are trying to access does not exist or you don't have permission to view it."}
//           type="error"
//           showIcon
//           action={
//             <Button onClick={handleGoBack}>
//               Back to Requests
//             </Button>
//           }
//         />
//       </div>
//     );
//   }

//   console.log('Rendering with request:', request);
//   console.log('Attachments in render:', request.attachments);

//   const canGeneratePDF = ['disbursed', 'completed'].includes(request.status);

//   return (
//     <div style={{ padding: '24px' }}>
//       <Card>
//         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
//           <Title level={3} style={{ margin: 0 }}>
//             Cash Request Details
//           </Title>
//           <Space>
//             <Text type="secondary">
//               REQ-{request._id?.slice(-6).toUpperCase() || 'N/A'}
//             </Text>
//             {request.isEdited && request.totalEdits > 0 && (
//               <Tag color="orange">
//                 <EditOutlined /> Edited {request.totalEdits}x
//               </Tag>
//             )}
//             {canGeneratePDF && (
//               <Button
//                 type="primary"
//                 icon={<FilePdfOutlined />}
//                 onClick={handleGeneratePDF}
//                 loading={generatingPDF}
//                 danger
//                 size="large"
//               >
//                 {generatingPDF ? 'Generating...' : 'Download PDF'}
//               </Button>
//             )}
//           </Space>
//         </div>

//         {/* PDF Available Alert */}
//         {canGeneratePDF && (
//           <Alert
//             message="Official PDF Document Available"
//             description="This request has been disbursed. You can download the official PDF document with complete approval chain details and all request information."
//             type="success"
//             showIcon
//             icon={<FilePdfOutlined />}
//             style={{ marginBottom: '24px' }}
//             action={
//               <Button 
//                 type="primary" 
//                 size="small"
//                 onClick={handleGeneratePDF}
//                 loading={generatingPDF}
//               >
//                 Download PDF
//               </Button>
//             }
//           />
//         )}

//         {/* Edit/Delete Warning (if editable/deletable) */}
//         {/* Edit/Delete Warning (if editable/deletable) */}
//         {(canEditRequest() || canDeleteRequest()) && (
//           <Alert
//             message={canEditRequest() ? "Request Can Be Edited" : "Request Can Be Deleted"}
//             description={
//               <div>
//                 {canEditRequest() && (
//                   <>
//                     <p>This request was rejected and can be edited for resubmission.</p>
//                     <ul style={{ marginBottom: 0, paddingLeft: '20px' }}>
//                       <li>Edit the request to address rejection reasons</li>
//                       <li>Approval process will restart from Level 1 after resubmission</li>
//                     </ul>
//                   </>
//                 )}
//                 {canDeleteRequest() && (
//                   <>
//                     <p>This request is still pending first approval and can be deleted.</p>
//                     <ul style={{ marginBottom: 0, paddingLeft: '20px' }}>
//                       <li>Once any approver takes action, deletion is no longer possible</li>
//                       <li>Consider editing instead of deleting if changes are needed</li>
//                     </ul>
//                   </>
//                 )}
//               </div>
//             }
//             type={canEditRequest() ? "warning" : "info"}
//             showIcon
//             style={{ marginBottom: '24px' }}
//             action={
//               <Space>
//                 {canEditRequest() && (
//                   <Button 
//                     size="small"
//                     icon={<EditOutlined />}
//                     onClick={() => navigate(`/employee/cash-request/${requestId}/edit`)}
//                   >
//                     Edit & Resubmit
//                   </Button>
//                 )}
//                 {canDeleteRequest() && (
//                   <Button 
//                     danger
//                     size="small"
//                     icon={<DeleteOutlined />}
//                     onClick={() => setDeleteModalVisible(true)}
//                   >
//                     Delete
//                   </Button>
//                 )}
//               </Space>
//             }
//           />
//         )}

//         <Descriptions bordered column={1} size="middle">
//           <Descriptions.Item label="Request ID">
//             <Text code copyable>REQ-{request._id?.slice(-6).toUpperCase() || 'N/A'}</Text>
//           </Descriptions.Item>
          
//           <Descriptions.Item label="Status">
//             <Space>
//               {getStatusTag(request.status)}
//               {request.isEdited && (
//                 <Tag color="orange" icon={<EditOutlined />}>
//                   Edited {request.totalEdits}x
//                 </Tag>
//               )}
//             </Space>
//           </Descriptions.Item>
          
//           <Descriptions.Item label="Amount Requested">
//             <Text strong style={{ fontSize: '16px' }}>
//               XAF {Number(request.amountRequested || 0).toLocaleString()}
//             </Text>
//           </Descriptions.Item>
          
//           {request.amountApproved !== undefined && (
//             <Descriptions.Item label="Amount Approved">
//               <Text strong style={{ fontSize: '16px', color: '#52c41a' }}>
//                 XAF {Number(request.amountApproved || 0).toLocaleString()}
//               </Text>
//             </Descriptions.Item>
//           )}
          
//           {request.disbursementDetails && (
//             <Descriptions.Item label="Amount Disbursed">
//               <Text strong style={{ fontSize: '16px', color: '#1890ff' }}>
//                 XAF {Number(request.disbursementDetails.amount || 0).toLocaleString()}
//               </Text>
//             </Descriptions.Item>
//           )}
          
//           <Descriptions.Item label="Request Type">
//             {request.requestType?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'N/A'}
//           </Descriptions.Item>
          
//           <Descriptions.Item label="Purpose">
//             <Paragraph style={{ marginBottom: 0 }}>
//               {request.purpose || 'N/A'}
//             </Paragraph>
//           </Descriptions.Item>
          
//           <Descriptions.Item label="Business Justification">
//             <Paragraph style={{ marginBottom: 0 }}>
//               {request.businessJustification || 'N/A'}
//             </Paragraph>
//           </Descriptions.Item>
          
//           <Descriptions.Item label="Urgency">
//             <Tag color={
//               request.urgency === 'urgent' ? 'red' : 
//               request.urgency === 'high' ? 'orange' : 
//               request.urgency === 'medium' ? 'blue' : 'green'
//             }>
//               {request.urgency?.toUpperCase() || 'N/A'}
//             </Tag>
//           </Descriptions.Item>
          
//           <Descriptions.Item label="Required By">
//             {request.requiredDate ? new Date(request.requiredDate).toLocaleDateString('en-GB') : 'N/A'}
//           </Descriptions.Item>
          
//           <Descriptions.Item label="Date Submitted">
//             {request.createdAt ? new Date(request.createdAt).toLocaleDateString('en-GB') : 'N/A'}
//           </Descriptions.Item>

//           {request.disbursementDetails?.date && (
//             <Descriptions.Item label="Disbursement Date">
//               {new Date(request.disbursementDetails.date).toLocaleDateString('en-GB')}
//             </Descriptions.Item>
//           )}

//           {/* Project Information */}
//           {request.projectId && (
//             <Descriptions.Item label="Project">
//               <Text strong>{request.projectId.name || 'N/A'}</Text>
//               {request.projectId.code && <Tag style={{ marginLeft: 8 }}>{request.projectId.code}</Tag>}
//             </Descriptions.Item>
//           )}

//           {/* Budget Allocation */}
//           {request.budgetAllocation && request.budgetAllocation.budgetCodeId && (
//             <>
//               <Descriptions.Item label="Budget Code">
//                 <Text code>{request.budgetAllocation.budgetCode}</Text>
//               </Descriptions.Item>
//               <Descriptions.Item label="Budget Name">
//                 {request.budgetAllocation.budgetCodeId.name || 'N/A'}
//               </Descriptions.Item>
//               <Descriptions.Item label="Allocated Amount">
//                 <Text strong>XAF {Number(request.budgetAllocation.allocatedAmount || 0).toLocaleString()}</Text>
//               </Descriptions.Item>
//               <Descriptions.Item label="Allocation Status">
//                 <Tag color="blue">{request.budgetAllocation.allocationStatus?.toUpperCase() || 'N/A'}</Tag>
//               </Descriptions.Item>
//             </>
//           )}

//           {/* Attachments Section */}
//           <Descriptions.Item label="Supporting Documents">
//             {request.attachments && Array.isArray(request.attachments) && request.attachments.length > 0 ? (
//               <div>
//                 <div style={{ marginBottom: '12px' }}>
//                   <Text type="secondary">
//                     {request.attachments.length} file{request.attachments.length !== 1 ? 's' : ''} attached
//                   </Text>
//                 </div>
//                 <List
//                   size="small"
//                   bordered
//                   dataSource={request.attachments}
//                   renderItem={(attachment, index) => (
//                     <List.Item
//                       key={attachment._id || attachment.id || index}
//                       actions={[
//                         <Button
//                           key="view"
//                           type="link"
//                           size="small"
//                           icon={<EyeOutlined />}
//                           onClick={() => handleViewAttachment(attachment)}
//                         >
//                           View
//                         </Button>,
//                         <Button
//                           key="download"
//                           type="primary"
//                           size="small"
//                           icon={<DownloadOutlined />}
//                           loading={downloadingFiles.has(attachment._id || attachment.id)}
//                           onClick={() => handleDownloadAttachment(attachment)}
//                         >
//                           Download
//                         </Button>
//                       ]}
//                     >
//                       <List.Item.Meta
//                         avatar={getFileIcon(attachment.mimetype, attachment.name)}
//                         title={
//                           <Text strong>{attachment.name || 'Unnamed file'}</Text>
//                         }
//                         description={
//                           <div>
//                             <div>{formatFileSize(attachment.size)}</div>
//                             {attachment.mimetype && (
//                               <Text type="secondary" style={{ fontSize: '11px' }}>
//                                 {attachment.mimetype}
//                               </Text>
//                             )}
//                           </div>
//                         }
//                       />
//                     </List.Item>
//                   )}
//                 />
//               </div>
//             ) : (
//               <Text type="secondary" italic>No attachments uploaded</Text>
//             )}
//           </Descriptions.Item>
//         </Descriptions>

//         {/* Itemized Breakdown Section */}
//         {request.itemizedBreakdown && request.itemizedBreakdown.length > 0 && (
//           <>
//             <Divider orientation="left">
//               <Title level={4} style={{ margin: 0 }}>
//                 <FileTextOutlined /> Itemized Expense Breakdown
//               </Title>
//             </Divider>
            
//             <Table
//               dataSource={request.itemizedBreakdown}
//               pagination={false}
//               size="middle"
//               bordered
//               rowKey={(record, index) => index}
//               summary={(pageData) => {
//                 const total = pageData.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
//                 return (
//                   <Table.Summary fixed>
//                     <Table.Summary.Row>
//                       <Table.Summary.Cell index={0} colSpan={2}>
//                         <Text strong style={{ fontSize: '16px' }}>Total Amount</Text>
//                       </Table.Summary.Cell>
//                       <Table.Summary.Cell index={1} align="right">
//                         <Text strong style={{ fontSize: '16px', color: '#1890ff' }}>
//                           XAF {total.toLocaleString()}
//                         </Text>
//                       </Table.Summary.Cell>
//                     </Table.Summary.Row>
//                   </Table.Summary>
//                 );
//               }}
//             >
//               <Table.Column 
//                 title="Description" 
//                 dataIndex="description" 
//                 key="description"
//                 render={(text) => <Text>{text}</Text>}
//               />
//               <Table.Column 
//                 title="Category" 
//                 dataIndex="category" 
//                 key="category"
//                 render={(text) => text ? (
//                   <Tag color="blue">
//                     {text.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
//                   </Tag>
//                 ) : '-'}
//               />
//               <Table.Column 
//                 title="Amount (XAF)" 
//                 dataIndex="amount" 
//                 key="amount"
//                 align="right"
//                 render={(amount) => (
//                   <Text strong style={{ color: '#52c41a' }}>
//                     {parseFloat(amount || 0).toLocaleString()}
//                   </Text>
//                 )}
//               />
//             </Table>
//           </>
//         )}

//         {/* Edit History */}
//         {request.editHistory && request.editHistory.length > 0 && (
//           <>
//             <Divider orientation="left">
//               <Title level={4} style={{ margin: 0 }}>
//                 <HistoryOutlined /> Edit History
//               </Title>
//             </Divider>
            
//             <Alert
//               message={`This request has been edited ${request.totalEdits} time${request.totalEdits > 1 ? 's' : ''}`}
//               type="info"
//               showIcon
//               style={{ marginBottom: '16px' }}
//             />
            
//             <Timeline>
//               {request.editHistory.map((edit, index) => (
//                 <Timeline.Item key={index} color="orange" dot={<EditOutlined />}>
//                   <div>
//                     <Text strong>Edit #{edit.editNumber}</Text>
//                     <br />
//                     <Text type="secondary">
//                       Edited on {new Date(edit.editedAt).toLocaleString('en-GB', { 
//                         dateStyle: 'medium', 
//                         timeStyle: 'short' 
//                       })}
//                     </Text>
//                     <br />
//                     <Text type="secondary">
//                       Previous Status: {edit.previousStatus?.replace(/_/g, ' ').toUpperCase()}
//                     </Text>
//                     {edit.reason && (
//                       <div style={{ marginTop: '8px', padding: '8px', backgroundColor: '#fff7e6', borderRadius: 4 }}>
//                         <Text italic>Reason: "{edit.reason}"</Text>
//                       </div>
//                     )}
//                     {edit.changes && Object.keys(edit.changes).length > 0 && (
//                       <div style={{ marginTop: '8px' }}>
//                         <Text strong>Fields Changed:</Text>
//                         <ul style={{ marginTop: '4px', marginBottom: 0 }}>
//                           {Object.entries(edit.changes).map(([field, change]) => (
//                             <li key={field}>
//                               <Text code>{field}</Text>
//                             </li>
//                           ))}
//                         </ul>
//                       </div>
//                     )}
//                   </div>
//                 </Timeline.Item>
//               ))}
//             </Timeline>
//           </>
//         )}

//         {/* Approval Chain Timeline */}
//         {request.approvalChain && request.approvalChain.length > 0 && (
//           <>
//             <Divider orientation="left">
//               <Title level={4} style={{ margin: 0 }}>Approval Chain</Title>
//             </Divider>
            
//             <div style={{ marginBottom: '16px' }}>
//               <Progress 
//                 percent={Math.round((request.approvalChain.filter(s => s.status === 'approved').length / request.approvalChain.length) * 100)} 
//                 status={request.status === 'completed' ? 'success' : request.status === 'denied' ? 'exception' : 'active'}
//                 strokeColor={{
//                   '0%': '#108ee9',
//                   '100%': '#52c41a',
//                 }}
//               />
//             </div>

//             <Timeline>
//               {request.approvalChain.map((step, index) => {
//                 let color = 'gray';
//                 let icon = <ClockCircleOutlined />;
                
//                 if (step.status === 'approved') {
//                   color = 'green';
//                   icon = <CheckCircleOutlined />;
//                 } else if (step.status === 'rejected') {
//                   color = 'red';
//                   icon = <CloseCircleOutlined />;
//                 }

//                 return (
//                   <Timeline.Item key={index} color={color} dot={icon}>
//                     <div>
//                       <Text strong>Level {step.level}: {step.approver?.name || 'Unknown'}</Text>
//                       <br />
//                       <Text type="secondary">{step.approver?.role || 'N/A'} - {step.approver?.department || 'N/A'}</Text>
//                       <br />
//                       {step.status === 'approved' && (
//                         <>
//                           <Tag color="green" style={{ marginTop: 4 }}>Approved</Tag>
//                           {step.actionDate && (
//                             <Text type="secondary" style={{ marginLeft: 8 }}>
//                               {new Date(step.actionDate).toLocaleDateString('en-GB')}
//                               {step.actionTime && ` at ${step.actionTime}`}
//                             </Text>
//                           )}
//                           {step.comments && (
//                             <div style={{ marginTop: 8, padding: 8, backgroundColor: '#f6ffed', borderRadius: 4 }}>
//                               <Text italic>"{step.comments}"</Text>
//                             </div>
//                           )}
//                         </>
//                       )}
//                       {step.status === 'rejected' && (
//                         <>
//                           <Tag color="red" style={{ marginTop: 4 }}>Rejected</Tag>
//                           {step.actionDate && (
//                             <Text type="secondary" style={{ marginLeft: 8 }}>
//                               {new Date(step.actionDate).toLocaleDateString('en-GB')}
//                               {step.actionTime && ` at ${step.actionTime}`}
//                             </Text>
//                           )}
//                           {step.comments && (
//                             <div style={{ marginTop: 8, padding: 8, backgroundColor: '#fff1f0', borderRadius: 4 }}>
//                               <Text type="danger">Reason: "{step.comments}"</Text>
//                             </div>
//                           )}
//                         </>
//                       )}
//                       {step.status === 'pending' && (
//                         <Tag color="orange" style={{ marginTop: 4 }}>Pending</Tag>
//                       )}
//                     </div>
//                   </Timeline.Item>
//                 );
//               })}
//             </Timeline>
//           </>
//         )}

//         {/* PDF Download History */}
//         {request.pdfDownloadHistory && request.pdfDownloadHistory.length > 0 && (
//           <>
//             <Divider orientation="left">
//               <Title level={4} style={{ margin: 0 }}>
//                 <HistoryOutlined /> PDF Download History
//               </Title>
//             </Divider>
//             <Timeline>
//               {request.pdfDownloadHistory.map((download, index) => (
//                 <Timeline.Item key={index} color="blue" dot={<FilePdfOutlined />}>
//                   <Text type="secondary">
//                     Downloaded on {new Date(download.downloadedAt).toLocaleString('en-GB', { 
//                       dateStyle: 'medium', 
//                       timeStyle: 'short' 
//                     })}
//                   </Text>
//                   <br />
//                   <Text type="secondary" style={{ fontSize: '12px' }}>
//                     {download.filename}
//                   </Text>
//                 </Timeline.Item>
//               ))}
//             </Timeline>
//           </>
//         )}

//         <Divider />

//         {/* Action Buttons */}
//         <Space size="middle" wrap>
//           <Button 
//             type="default" 
//             icon={<ArrowLeftOutlined />} 
//             onClick={handleGoBack}
//           >
//             Back to Requests
//           </Button>
          
//           {/* Edit Button - Only show if allowed */}
//           {canEditRequest() && (
//             <Button 
//               type="primary" 
//               icon={<EditOutlined />}
//               onClick={() => navigate(`/employee/cash-request/${requestId}/edit`)}
//               style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
//             >
//               Edit Request
//             </Button>
//           )}
          
//           {/* Delete Button - Only show if allowed */}
//           {canDeleteRequest() && (
//             <Button 
//               type="primary" 
//               danger
//               icon={<DeleteOutlined />}
//               onClick={() => setDeleteModalVisible(true)}
//             >
//               Delete Request
//             </Button>
//           )}
          
//           {canGeneratePDF && (
//             <Button 
//               type="primary" 
//               danger
//               icon={<FilePdfOutlined />}
//               onClick={handleGeneratePDF}
//               loading={generatingPDF}
//               size="large"
//             >
//               {generatingPDF ? 'Generating PDF...' : 'Download Official PDF'}
//             </Button>
//           )}
          
//           {(request.status === 'disbursed' || request.status === 'justification_pending_supervisor') && (
//             <Button 
//               type="primary" 
//               onClick={handleGoToJustification}
//               icon={<DollarOutlined />}
//             >
//               Submit Justification
//             </Button>
//           )}
//         </Space>
//       </Card>

//       {/* File Viewer Modal */}
//       <Modal
//         title={viewingFile?.name || 'File Viewer'}
//         open={fileViewerVisible}
//         onCancel={() => {
//           setFileViewerVisible(false);
//           setViewingFile(null);
//           setFileViewerLoading(false);
//           if (viewingFile?.url) {
//             window.URL.revokeObjectURL(viewingFile.url);
//           }
//         }}
//         footer={[
//           <Button 
//             key="download" 
//             icon={<DownloadOutlined />}
//             onClick={() => {
//               if (viewingFile?.url) {
//                 const link = document.createElement('a');
//                 link.href = viewingFile.url;
//                 link.download = viewingFile.name || 'file';
//                 document.body.appendChild(link);
//                 link.click();
//                 document.body.removeChild(link);
//                 message.success('File downloaded successfully');
//               }
//             }}
//           >
//             Download
//           </Button>,
//           <Button 
//             key="close" 
//             type="primary"
//             onClick={() => {
//               setFileViewerVisible(false);
//               setViewingFile(null);
//               setFileViewerLoading(false);
//               if (viewingFile?.url) {
//                 window.URL.revokeObjectURL(viewingFile.url);
//               }
//             }}
//           >
//             Close
//           </Button>
//         ]}
//         width="80%"
//         style={{ top: 20 }}
//         bodyStyle={{ padding: '20px', textAlign: 'center', minHeight: '60vh' }}
//       >
//         {fileViewerLoading ? (
//           <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
//             <Spin size="large" />
//             <div style={{ marginLeft: '16px' }}>Loading file...</div>
//           </div>
//         ) : viewingFile ? (
//           <div>
//             {viewingFile.type === 'image' ? (
//               <img 
//                 src={viewingFile.url} 
//                 alt={viewingFile.name}
//                 style={{ 
//                   maxWidth: '100%', 
//                   maxHeight: '70vh', 
//                   objectFit: 'contain',
//                   border: '1px solid #d9d9d9',
//                   borderRadius: '6px'
//                 }}
//               />
//             ) : viewingFile.type === 'pdf' ? (
//               <PDFViewer 
//                 publicId={viewingFile.publicId}
//                 fileName={viewingFile.name}
//                 onError={(error) => {
//                   console.error('PDF viewer error:', error);
//                   message.error('Failed to load PDF. Please try downloading instead.');
//                 }}
//               />
//             ) : (
//               <div style={{ padding: '40px' }}>
//                 <Alert
//                   message="Preview not available"
//                   description={`File type "${viewingFile.mimetype}" cannot be previewed inline. Please download to view.`}
//                   type="info"
//                   showIcon
//                 />
//               </div>
//             )}
//           </div>
//         ) : null}
//       </Modal>

//       {/* Delete Confirmation Modal */}
//       <Modal
//         title="Delete Cash Request"
//         open={deleteModalVisible}
//         onCancel={() => setDeleteModalVisible(false)}
//         footer={[
//           <Button key="cancel" onClick={() => setDeleteModalVisible(false)}>
//             Cancel
//           </Button>,
//           <Button 
//             key="delete" 
//             type="primary" 
//             danger 
//             loading={deleting}
//             onClick={handleDeleteRequest}
//             icon={<DeleteOutlined />}
//           >
//             Yes, Delete Request
//           </Button>
//         ]}
//       >
//         <Alert
//           message="Are you sure you want to delete this request?"
//           description={
//             <div>
//               <p style={{ marginTop: '12px' }}>
//                 This action cannot be undone. The request and all associated data will be permanently removed.
//               </p>
//               <Divider style={{ margin: '12px 0' }} />
//               <div style={{ backgroundColor: '#f5f5f5', padding: '12px', borderRadius: '4px' }}>
//                 <Text strong>Request Details:</Text>
//                 <div style={{ marginTop: '8px' }}>
//                   <div>ID: REQ-{request._id?.slice(-6).toUpperCase()}</div>
//                   <div>Amount: XAF {Number(request.amountRequested || 0).toLocaleString()}</div>
//                   <div>Type: {request.requestType?.replace(/-/g, ' ')}</div>
//                   <div>Status: {request.status}</div>
//                   {request.isEdited && (
//                     <div>Edited: {request.totalEdits} time{request.totalEdits > 1 ? 's' : ''}</div>
//                   )}
//                 </div>
//               </div>
//             </div>
//           }
//           type="warning"
//           showIcon
//         />
//       </Modal>
//     </div>
//   );
// };

// export default RequestDetails;










// import React, { useEffect, useState } from 'react';
// import { useParams, useNavigate } from 'react-router-dom';
// import { 
//   Card, 
//   Descriptions, 
//   Typography, 
//   Tag, 
//   Divider, 
//   Button,
//   Space,
//   Spin,
//   Alert,
//   message,
//   List,
//   Modal,
//   Timeline,
//   Progress,
//   Table
// } from 'antd';
// import { 
//   ArrowLeftOutlined,
//   CheckCircleOutlined,
//   CloseCircleOutlined,
//   ClockCircleOutlined,
//   DollarOutlined,
//   DownloadOutlined,
//   FileOutlined,
//   FilePdfOutlined,
//   FileImageOutlined,
//   FileTextOutlined,
//   FileWordOutlined,
//   FileExcelOutlined,
//   EyeOutlined,
//   HistoryOutlined
// } from '@ant-design/icons';
// import api from '../../services/api';

// const { Title, Text, Paragraph } = Typography;

// // PDF Viewer Component for secure PDF display
// const PDFViewer = ({ publicId, fileName, onError }) => {
//   const [pdfUrl, setPdfUrl] = useState(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const loadPDF = async () => {
//       try {
//         setLoading(true);
//         const token = localStorage.getItem('token');
//         const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
        
//         const response = await fetch(`${apiUrl}/files/view/${encodeURIComponent(publicId)}`, {
//           headers: {
//             'Authorization': `Bearer ${token}`
//           }
//         });

//         if (!response.ok) {
//           throw new Error('Failed to load PDF');
//         }

//         const blob = await response.blob();
//         const url = window.URL.createObjectURL(blob);
//         setPdfUrl(url);
//       } catch (error) {
//         console.error('Error loading PDF:', error);
//         onError?.(error);
//       } finally {
//         setLoading(false);
//       }
//     };

//     if (publicId) {
//       loadPDF();
//     }

//     // Cleanup
//     return () => {
//       if (pdfUrl) {
//         window.URL.revokeObjectURL(pdfUrl);
//       }
//     };
//   }, [publicId, onError]);

//   if (loading) {
//     return (
//       <div style={{ textAlign: 'center', padding: '40px' }}>
//         <Spin size="large" />
//         <div style={{ marginTop: '16px' }}>Loading PDF...</div>
//       </div>
//     );
//   }

//   if (!pdfUrl) {
//     return (
//       <div style={{ textAlign: 'center', padding: '40px' }}>
//         <Text type="danger">Failed to load PDF</Text>
//       </div>
//     );
//   }

//   return (
//     <object
//       data={pdfUrl}
//       type="application/pdf"
//       style={{
//         width: '100%',
//         height: '70vh',
//         border: '1px solid #d9d9d9',
//         borderRadius: '6px'
//       }}
//       title={fileName}
//     >
//       <p style={{ textAlign: 'center', padding: '20px' }}>
//         PDF cannot be displayed inline. 
//         <br />
//         <Button 
//           type="primary" 
//           style={{ marginTop: '10px' }}
//           onClick={() => {
//             const link = document.createElement('a');
//             link.href = pdfUrl;
//             link.download = fileName;
//             document.body.appendChild(link);
//             link.click();
//             document.body.removeChild(link);
//           }}
//         >
//           Download PDF
//         </Button>
//       </p>
//     </object>
//   );
// };

// const RequestDetails = () => {
//   const { requestId } = useParams();
//   const navigate = useNavigate();
//   const [request, setRequest] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [downloadingFiles, setDownloadingFiles] = useState(new Set());
//   const [generatingPDF, setGeneratingPDF] = useState(false);
  
//   // File viewer modal state
//   const [fileViewerVisible, setFileViewerVisible] = useState(false);
//   const [viewingFile, setViewingFile] = useState(null);
//   const [fileViewerLoading, setFileViewerLoading] = useState(false);

//   useEffect(() => {
//     const fetchRequest = async () => {
//       try {
//         setLoading(true);
//         setError(null);
        
//         console.log('Fetching request details for ID:', requestId);
        
//         if (!requestId) {
//           throw new Error('No request ID provided');
//         }

//         const response = await api.get(`/cash-requests/${requestId}`);
        
//         console.log('Request details response:', response.data);
        
//         if (response.data.success) {
//           const requestData = response.data.data;
//           console.log('Setting request data:', requestData);
//           console.log('Attachments found:', requestData.attachments);
//           setRequest(requestData);
//         } else {
//           throw new Error(response.data.message || 'Failed to fetch request details');
//         }
//       } catch (error) {
//         console.error('Error fetching request:', error);
//         const errorMessage = error.response?.data?.message || error.message || 'Failed to load request details';
//         setError(errorMessage);
//         message.error(errorMessage);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchRequest();
//   }, [requestId]);

//   const getStatusTag = (status) => {
//     const statusMap = {
//       'pending_supervisor': { 
//         color: 'orange', 
//         icon: <ClockCircleOutlined />, 
//         text: 'Pending Supervisor' 
//       },
//       'pending_departmental_head': { 
//         color: 'orange', 
//         icon: <ClockCircleOutlined />, 
//         text: 'Pending Departmental Head' 
//       },
//       'pending_head_of_business': { 
//         color: 'orange', 
//         icon: <ClockCircleOutlined />, 
//         text: 'Pending Head of Business' 
//       },
//       'pending_finance': { 
//         color: 'blue', 
//         icon: <ClockCircleOutlined />, 
//         text: 'Pending Finance' 
//       },
//       'approved': { 
//         color: 'green', 
//         icon: <CheckCircleOutlined />, 
//         text: 'Approved' 
//       },
//       'denied': { 
//         color: 'red', 
//         icon: <CloseCircleOutlined />, 
//         text: 'Denied' 
//       },
//       'disbursed': { 
//         color: 'cyan', 
//         icon: <DollarOutlined />, 
//         text: 'Disbursed' 
//       },
//       'justification_pending_supervisor': { 
//         color: 'purple', 
//         icon: <ClockCircleOutlined />, 
//         text: 'Justification Pending Supervisor' 
//       },
//       'justification_pending_finance': { 
//         color: 'purple', 
//         icon: <ClockCircleOutlined />, 
//         text: 'Justification Pending Finance' 
//       },
//       'justification_rejected': { 
//         color: 'orange', 
//         icon: <CloseCircleOutlined />, 
//         text: 'Justification Rejected' 
//       },
//       'completed': { 
//         color: 'green', 
//         icon: <CheckCircleOutlined />, 
//         text: 'Completed' 
//       }
//     };

//     const statusInfo = statusMap[status] || { 
//       color: 'default', 
//       text: status?.replace(/_/g, ' ') || 'Unknown' 
//     };
    
//     return (
//       <Tag color={statusInfo.color} icon={statusInfo.icon}>
//         {statusInfo.text}
//       </Tag>
//     );
//   };

//   const getFileIcon = (mimetype, fileName) => {
//     if (!mimetype && !fileName) return <FileOutlined />;
    
//     const type = mimetype || fileName.split('.').pop()?.toLowerCase();
    
//     if (type.includes('pdf')) return <FilePdfOutlined style={{ color: '#ff4d4f' }} />;
//     if (type.includes('image') || ['jpg', 'jpeg', 'png', 'gif', 'bmp'].includes(type)) 
//       return <FileImageOutlined style={{ color: '#52c41a' }} />;
//     if (type.includes('word') || ['doc', 'docx'].includes(type)) 
//       return <FileWordOutlined style={{ color: '#1890ff' }} />;
//     if (type.includes('excel') || type.includes('spreadsheet') || ['xls', 'xlsx'].includes(type)) 
//       return <FileExcelOutlined style={{ color: '#52c41a' }} />;
//     if (type.includes('text') || ['txt', 'csv'].includes(type)) 
//       return <FileTextOutlined style={{ color: '#faad14' }} />;
    
//     return <FileOutlined />;
//   };

//   const formatFileSize = (bytes) => {
//     if (!bytes) return 'Unknown size';
    
//     const sizes = ['Bytes', 'KB', 'MB', 'GB'];
//     if (bytes === 0) return '0 Bytes';
    
//     const i = Math.floor(Math.log(bytes) / Math.log(1024));
//     return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
//   };

//   const handleViewAttachment = async (attachment) => {
//     try {
//       console.log('Viewing attachment:', attachment);
      
//       if (!attachment) {
//         message.error('No attachment data available');
//         return;
//       }

//       setFileViewerLoading(true);
//       setFileViewerVisible(true);

//       const token = localStorage.getItem('token');
//       if (!token) {
//         message.error('Authentication required. Please login again.');
//         setFileViewerVisible(false);
//         setFileViewerLoading(false);
//         return;
//       }

//       let publicId = attachment.publicId || attachment.name;
      
//       if (!publicId) {
//         console.error('Could not get publicId from attachment:', attachment);
//         message.error('Unable to locate file. Invalid attachment data.');
//         setFileViewerVisible(false);
//         setFileViewerLoading(false);
//         return;
//       }

//       console.log('Fetching file for viewing:', publicId);

//       const isImage = attachment.mimetype?.startsWith('image/') || 
//                      /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(attachment.name);
//       const isPDF = attachment.mimetype === 'application/pdf' || 
//                    /\.pdf$/i.test(attachment.name);

//       if (isPDF) {
//         setViewingFile({
//           name: attachment.name,
//           publicId: publicId,
//           type: 'pdf',
//           mimetype: attachment.mimetype
//         });
//         setFileViewerLoading(false);
//         return;
//       }

//       const apiBaseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
//       const downloadUrl = `${apiBaseUrl}/files/download/${encodeURIComponent(publicId)}`;
      
//       const response = await fetch(downloadUrl, {
//         method: 'GET',
//         headers: {
//           'Authorization': `Bearer ${token}`,
//           'Content-Type': 'application/json'
//         },
//       });

//       if (!response.ok) {
//         const errorText = await response.text();
//         console.error('File fetch failed:', errorText);
//         throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
//       }

//       const blob = await response.blob();
//       const fileUrl = window.URL.createObjectURL(blob);

//       setViewingFile({
//         name: attachment.name,
//         url: fileUrl,
//         type: isImage ? 'image' : 'other',
//         mimetype: attachment.mimetype
//       });
      
//       setFileViewerLoading(false);
//     } catch (error) {
//       console.error('Error viewing attachment:', error);
//       message.error(`Failed to view attachment: ${error.message}`);
//       setFileViewerVisible(false);
//       setFileViewerLoading(false);
      
//       handleDownloadAttachment(attachment);
//     }
//   };

//   const handleDownloadAttachment = async (attachment) => {
//     if (!attachment) {
//       message.error('No attachment data available');
//       return;
//     }

//     const fileId = attachment._id || attachment.id;
//     setDownloadingFiles(prev => new Set(prev).add(fileId));

//     try {
//       console.log('Downloading attachment:', attachment);
      
//       const token = localStorage.getItem('token');
//       if (!token) {
//         message.error('Authentication required. Please login again.');
//         setDownloadingFiles(prev => {
//           const newSet = new Set(prev);
//           newSet.delete(fileId);
//           return newSet;
//         });
//         return;
//       }

//       let downloadId = '';
      
//       if (attachment.publicId) {
//         downloadId = attachment.publicId;
//       } else if (attachment.url) {
//         const urlParts = attachment.url.split('/');
//         const uploadIndex = urlParts.findIndex(part => part === 'upload');
//         if (uploadIndex !== -1 && uploadIndex + 2 < urlParts.length) {
//           downloadId = urlParts.slice(uploadIndex + 2).join('/');
//           const lastPart = downloadId.split('/').pop();
//           if (lastPart && lastPart.includes('.')) {
//             downloadId = downloadId.replace(/\.[^/.]+$/, '');
//           }
//         }
//       }

//       if (!downloadId) {
//         console.error('Could not extract download ID from attachment:', attachment);
//         message.error('Unable to locate file. Invalid attachment data.');
//         setDownloadingFiles(prev => {
//           const newSet = new Set(prev);
//           newSet.delete(fileId);
//           return newSet;
//         });
//         return;
//       }

//       console.log('Using download ID:', downloadId);

//       const apiBaseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
//       const downloadUrl = `${apiBaseUrl}/files/download/${encodeURIComponent(downloadId)}`;
      
//       console.log('Download URL:', downloadUrl);

//       const response = await fetch(downloadUrl, {
//         method: 'GET',
//         headers: {
//           'Authorization': `Bearer ${token}`,
//           'Content-Type': 'application/json'
//         },
//       });

//       console.log('Response status:', response.status);

//       if (!response.ok) {
//         const errorText = await response.text();
//         console.error('Download failed:', errorText);
//         throw new Error(`Download failed: ${response.status} ${response.statusText}`);
//       }

//       const blob = await response.blob();
//       const url = window.URL.createObjectURL(blob);
//       const link = document.createElement('a');
//       link.href = url;
//       link.download = attachment.originalName || attachment.name || 'attachment';
      
//       document.body.appendChild(link);
//       link.click();
//       document.body.removeChild(link);
//       window.URL.revokeObjectURL(url);

//       message.success(`Downloaded ${attachment.originalName || attachment.name}`);
//     } catch (error) {
//       console.error('Error downloading attachment:', error);
//       message.error(`Failed to download attachment: ${error.message}`);
//     } finally {
//       setDownloadingFiles(prev => {
//         const newSet = new Set(prev);
//         newSet.delete(fileId);
//         return newSet;
//       });
//     }
//   };

//   // NEW: Generate PDF function
//   const handleGeneratePDF = async () => {
//     try {
//       setGeneratingPDF(true);
//       message.loading({ content: 'Generating PDF...', key: 'pdf-gen' });
      
//       const token = localStorage.getItem('token');
//       if (!token) {
//         message.error('Authentication required. Please login again.');
//         return;
//       }

//       const apiBaseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
//       const pdfUrl = `${apiBaseUrl}/cash-requests/${requestId}/pdf`;
      
//       console.log('Generating PDF from:', pdfUrl);

//       const response = await fetch(pdfUrl, {
//         method: 'GET',
//         headers: {
//           'Authorization': `Bearer ${token}`
//         }
//       });

//       if (!response.ok) {
//         const errorData = await response.json().catch(() => ({}));
//         throw new Error(errorData.message || 'Failed to generate PDF');
//       }

//       // Get the blob
//       const blob = await response.blob();
      
//       // Create download link
//       const url = window.URL.createObjectURL(blob);
//       const link = document.createElement('a');
//       link.href = url;
//       link.download = `Cash_Request_${request.displayId || requestId.slice(-6).toUpperCase()}_${Date.now()}.pdf`;
//       document.body.appendChild(link);
//       link.click();
//       document.body.removeChild(link);
//       window.URL.revokeObjectURL(url);
      
//       message.success({ content: 'PDF generated and downloaded successfully!', key: 'pdf-gen' });
      
//       // Refresh request data to update download history
//       const refreshResponse = await api.get(`/cash-requests/${requestId}`);
//       if (refreshResponse.data.success) {
//         setRequest(refreshResponse.data.data);
//       }
      
//     } catch (error) {
//       console.error('PDF generation error:', error);
//       message.error({ 
//         content: error.message || 'Failed to generate PDF', 
//         key: 'pdf-gen' 
//       });
//     } finally {
//       setGeneratingPDF(false);
//     }
//   };

//   const handleGoToJustification = () => {
//     navigate(`/employee/cash-request/${requestId}/justify`);
//   };

//   const handleGoBack = () => {
//     navigate('/employee/cash-requests');
//   };

//   if (loading) {
//     return (
//       <div style={{ padding: '24px', textAlign: 'center' }}>
//         <Spin size="large" />
//         <div style={{ marginTop: '16px' }}>Loading request details...</div>
//       </div>
//     );
//   }

//   if (error || !request) {
//     return (
//       <div style={{ padding: '24px' }}>
//         <Alert
//           message="Error Loading Request"
//           description={error || "The request you are trying to access does not exist or you don't have permission to view it."}
//           type="error"
//           showIcon
//           action={
//             <Button onClick={handleGoBack}>
//               Back to Requests
//             </Button>
//           }
//         />
//       </div>
//     );
//   }

//   console.log('Rendering with request:', request);
//   console.log('Attachments in render:', request.attachments);

//   // Check if PDF can be generated
//   const canGeneratePDF = ['disbursed', 'completed'].includes(request.status);

//   return (
//     <div style={{ padding: '24px' }}>
//       <Card>
//         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
//           <Title level={3} style={{ margin: 0 }}>
//             Cash Request Details
//           </Title>
//           <Space>
//             <Text type="secondary">
//               REQ-{request._id?.slice(-6).toUpperCase() || 'N/A'}
//             </Text>
//             {canGeneratePDF && (
//               <Button
//                 type="primary"
//                 icon={<FilePdfOutlined />}
//                 onClick={handleGeneratePDF}
//                 loading={generatingPDF}
//                 danger
//                 size="large"
//               >
//                 {generatingPDF ? 'Generating...' : 'Download PDF'}
//               </Button>
//             )}
//           </Space>
//         </div>

//         {/* PDF Available Alert */}
//         {canGeneratePDF && (
//           <Alert
//             message="Official PDF Document Available"
//             description="This request has been disbursed. You can download the official PDF document with complete approval chain details and all request information."
//             type="success"
//             showIcon
//             icon={<FilePdfOutlined />}
//             style={{ marginBottom: '24px' }}
//             action={
//               <Button 
//                 type="primary" 
//                 size="small"
//                 onClick={handleGeneratePDF}
//                 loading={generatingPDF}
//               >
//                 Download PDF
//               </Button>
//             }
//           />
//         )}

//         <Descriptions bordered column={1} size="middle">
//           <Descriptions.Item label="Request ID">
//             <Text code copyable>REQ-{request._id?.slice(-6).toUpperCase() || 'N/A'}</Text>
//           </Descriptions.Item>
          
//           <Descriptions.Item label="Status">
//             {getStatusTag(request.status)}
//           </Descriptions.Item>
          
//           <Descriptions.Item label="Amount Requested">
//             <Text strong style={{ fontSize: '16px' }}>
//               XAF {Number(request.amountRequested || 0).toLocaleString()}
//             </Text>
//           </Descriptions.Item>
          
//           {request.amountApproved !== undefined && (
//             <Descriptions.Item label="Amount Approved">
//               <Text strong style={{ fontSize: '16px', color: '#52c41a' }}>
//                 XAF {Number(request.amountApproved || 0).toLocaleString()}
//               </Text>
//             </Descriptions.Item>
//           )}
          
//           {request.disbursementDetails && (
//             <Descriptions.Item label="Amount Disbursed">
//               <Text strong style={{ fontSize: '16px', color: '#1890ff' }}>
//                 XAF {Number(request.disbursementDetails.amount || 0).toLocaleString()}
//               </Text>
//             </Descriptions.Item>
//           )}
          
//           <Descriptions.Item label="Request Type">
//             {request.requestType?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'N/A'}
//           </Descriptions.Item>
          
//           <Descriptions.Item label="Purpose">
//             <Paragraph style={{ marginBottom: 0 }}>
//               {request.purpose || 'N/A'}
//             </Paragraph>
//           </Descriptions.Item>
          
//           <Descriptions.Item label="Business Justification">
//             <Paragraph style={{ marginBottom: 0 }}>
//               {request.businessJustification || 'N/A'}
//             </Paragraph>
//           </Descriptions.Item>
          
//           <Descriptions.Item label="Urgency">
//             <Tag color={
//               request.urgency === 'urgent' ? 'red' : 
//               request.urgency === 'high' ? 'orange' : 
//               request.urgency === 'medium' ? 'blue' : 'green'
//             }>
//               {request.urgency?.toUpperCase() || 'N/A'}
//             </Tag>
//           </Descriptions.Item>
          
//           <Descriptions.Item label="Required By">
//             {request.requiredDate ? new Date(request.requiredDate).toLocaleDateString('en-GB') : 'N/A'}
//           </Descriptions.Item>
          
//           <Descriptions.Item label="Date Submitted">
//             {request.createdAt ? new Date(request.createdAt).toLocaleDateString('en-GB') : 'N/A'}
//           </Descriptions.Item>

//           {request.disbursementDetails?.date && (
//             <Descriptions.Item label="Disbursement Date">
//               {new Date(request.disbursementDetails.date).toLocaleDateString('en-GB')}
//             </Descriptions.Item>
//           )}

//           {/* Project Information */}
//           {request.projectId && (
//             <Descriptions.Item label="Project">
//               <Text strong>{request.projectId.name || 'N/A'}</Text>
//               {request.projectId.code && <Tag style={{ marginLeft: 8 }}>{request.projectId.code}</Tag>}
//             </Descriptions.Item>
//           )}

//           {/* Budget Allocation */}
//           {request.budgetAllocation && request.budgetAllocation.budgetCodeId && (
//             <>
//               <Descriptions.Item label="Budget Code">
//                 <Text code>{request.budgetAllocation.budgetCode}</Text>
//               </Descriptions.Item>
//               <Descriptions.Item label="Budget Name">
//                 {request.budgetAllocation.budgetCodeId.name || 'N/A'}
//               </Descriptions.Item>
//               <Descriptions.Item label="Allocated Amount">
//                 <Text strong>XAF {Number(request.budgetAllocation.allocatedAmount || 0).toLocaleString()}</Text>
//               </Descriptions.Item>
//               <Descriptions.Item label="Allocation Status">
//                 <Tag color="blue">{request.budgetAllocation.allocationStatus?.toUpperCase() || 'N/A'}</Tag>
//               </Descriptions.Item>
//             </>
//           )}

//           {/* Attachments Section */}
//           <Descriptions.Item label="Supporting Documents">
//             {request.attachments && Array.isArray(request.attachments) && request.attachments.length > 0 ? (
//               <div>
//                 <div style={{ marginBottom: '12px' }}>
//                   <Text type="secondary">
//                     {request.attachments.length} file{request.attachments.length !== 1 ? 's' : ''} attached
//                   </Text>
//                 </div>
//                 <List
//                   size="small"
//                   bordered
//                   dataSource={request.attachments}
//                   renderItem={(attachment, index) => (
//                     <List.Item
//                       key={attachment._id || attachment.id || index}
//                       actions={[
//                         <Button
//                           key="view"
//                           type="link"
//                           size="small"
//                           icon={<EyeOutlined />}
//                           onClick={() => handleViewAttachment(attachment)}
//                         >
//                           View
//                         </Button>,
//                         <Button
//                           key="download"
//                           type="primary"
//                           size="small"
//                           icon={<DownloadOutlined />}
//                           loading={downloadingFiles.has(attachment._id || attachment.id)}
//                           onClick={() => handleDownloadAttachment(attachment)}
//                         >
//                           Download
//                         </Button>
//                       ]}
//                     >
//                       <List.Item.Meta
//                         avatar={getFileIcon(attachment.mimetype, attachment.name)}
//                         title={
//                           <Text strong>{attachment.name || 'Unnamed file'}</Text>
//                         }
//                         description={
//                           <div>
//                             <div>{formatFileSize(attachment.size)}</div>
//                             {attachment.mimetype && (
//                               <Text type="secondary" style={{ fontSize: '11px' }}>
//                                 {attachment.mimetype}
//                               </Text>
//                             )}
//                           </div>
//                         }
//                       />
//                     </List.Item>
//                   )}
//                 />
//               </div>
//             ) : (
//               <Text type="secondary" italic>No attachments uploaded</Text>
//             )}
//           </Descriptions.Item>
//         </Descriptions>

//         {/* Itemized Breakdown Section */}
//         {request.itemizedBreakdown && request.itemizedBreakdown.length > 0 && (
//           <>
//             <Divider orientation="left">
//               <Title level={4} style={{ margin: 0 }}>
//                 <FileTextOutlined /> Itemized Expense Breakdown
//               </Title>
//             </Divider>
            
//             <Table
//               dataSource={request.itemizedBreakdown}
//               pagination={false}
//               size="middle"
//               bordered
//               summary={(pageData) => {
//                 const total = pageData.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
//                 return (
//                   <Table.Summary fixed>
//                     <Table.Summary.Row>
//                       <Table.Summary.Cell index={0} colSpan={2}>
//                         <Text strong style={{ fontSize: '16px' }}>Total Amount</Text>
//                       </Table.Summary.Cell>
//                       <Table.Summary.Cell index={1}>
//                         <Text strong style={{ fontSize: '16px', color: '#1890ff' }}>
//                           XAF {total.toLocaleString()}
//                         </Text>
//                       </Table.Summary.Cell>
//                     </Table.Summary.Row>
//                   </Table.Summary>
//                 );
//               }}
//             >
//               <Table.Column 
//                 title="Description" 
//                 dataIndex="description" 
//                 key="description"
//                 render={(text) => <Text>{text}</Text>}
//               />
//               <Table.Column 
//                 title="Category" 
//                 dataIndex="category" 
//                 key="category"
//                 render={(text) => text ? <Tag color="blue">{text.replace(/-/g, ' ').toUpperCase()}</Tag> : '-'}
//               />
//               <Table.Column 
//                 title="Amount (XAF)" 
//                 dataIndex="amount" 
//                 key="amount"
//                 align="right"
//                 render={(amount) => (
//                   <Text strong style={{ color: '#52c41a' }}>
//                     {parseFloat(amount || 0).toLocaleString()}
//                   </Text>
//                 )}
//               />
//             </Table>
//           </>
//         )}

//         {/* Approval Chain Timeline */}
//         {request.approvalChain && request.approvalChain.length > 0 && (
//           <>
//             <Divider orientation="left">
//               <Title level={4} style={{ margin: 0 }}>Approval Chain</Title>
//             </Divider>
            
//             <div style={{ marginBottom: '16px' }}>
//               <Progress 
//                 percent={Math.round((request.approvalChain.filter(s => s.status === 'approved').length / request.approvalChain.length) * 100)} 
//                 status={request.status === 'completed' ? 'success' : request.status === 'denied' ? 'exception' : 'active'}
//                 strokeColor={{
//                   '0%': '#108ee9',
//                   '100%': '#52c41a',
//                 }}
//               />
//             </div>

//             <Timeline>
//               {request.approvalChain.map((step, index) => {
//                 let color = 'gray';
//                 let icon = <ClockCircleOutlined />;
                
//                 if (step.status === 'approved') {
//                   color = 'green';
//                   icon = <CheckCircleOutlined />;
//                 } else if (step.status === 'rejected') {
//                   color = 'red';
//                   icon = <CloseCircleOutlined />;
//                 }

//                 return (
//                   <Timeline.Item key={index} color={color} dot={icon}>
//                     <div>
//                       <Text strong>Level {step.level}: {step.approver?.name || 'Unknown'}</Text>
//                       <br />
//                       <Text type="secondary">{step.approver?.role || 'N/A'} - {step.approver?.department || 'N/A'}</Text>
//                       <br />
//                       {step.status === 'approved' && (
//                         <>
//                           <Tag color="green" style={{ marginTop: 4 }}>Approved</Tag>
//                           {step.actionDate && (
//                             <Text type="secondary" style={{ marginLeft: 8 }}>
//                               {new Date(step.actionDate).toLocaleDateString('en-GB')}
//                               {step.actionTime && ` at ${step.actionTime}`}
//                             </Text>
//                           )}
//                           {step.comments && (
//                             <div style={{ marginTop: 8, padding: 8, backgroundColor: '#f6ffed', borderRadius: 4 }}>
//                               <Text italic>"{step.comments}"</Text>
//                             </div>
//                           )}
//                         </>
//                       )}
//                       {step.status === 'rejected' && (
//                         <>
//                           <Tag color="red" style={{ marginTop: 4 }}>Rejected</Tag>
//                           {step.actionDate && (
//                             <Text type="secondary" style={{ marginLeft: 8 }}>
//                               {new Date(step.actionDate).toLocaleDateString('en-GB')}
//                               {step.actionTime && ` at ${step.actionTime}`}
//                             </Text>
//                           )}
//                           {step.comments && (
//                             <div style={{ marginTop: 8, padding: 8, backgroundColor: '#fff1f0', borderRadius: 4 }}>
//                               <Text type="danger">Reason: "{step.comments}"</Text>
//                             </div>
//                           )}
//                         </>
//                       )}
//                       {step.status === 'pending' && (
//                         <Tag color="orange" style={{ marginTop: 4 }}>Pending</Tag>
//                       )}
//                     </div>
//                   </Timeline.Item>
//                 );
//               })}
//             </Timeline>
//           </>
//         )}

//         {/* PDF Download History */}
//         {request.pdfDownloadHistory && request.pdfDownloadHistory.length > 0 && (
//           <>
//             <Divider orientation="left">
//               <Title level={4} style={{ margin: 0 }}>
//                 <HistoryOutlined /> PDF Download History
//               </Title>
//             </Divider>
//             <Timeline>
//               {request.pdfDownloadHistory.map((download, index) => (
//                 <Timeline.Item key={index} color="blue" dot={<FilePdfOutlined />}>
//                   <Text type="secondary">
//                     Downloaded on {new Date(download.downloadedAt).toLocaleString('en-GB', { 
//                       dateStyle: 'medium', 
//                       timeStyle: 'short' 
//                     })}
//                   </Text>
//                   <br />
//                   <Text type="secondary" style={{ fontSize: '12px' }}>
//                     {download.filename}
//                   </Text>
//                 </Timeline.Item>
//               ))}
//             </Timeline>
//           </>
//         )}

//         <Divider />

//         {/* Action Buttons */}
//         <Space size="middle">
//           <Button 
//             type="default" 
//             icon={<ArrowLeftOutlined />} 
//             onClick={handleGoBack}
//           >
//             Back to Requests
//           </Button>
          
//           {canGeneratePDF && (
//             <Button 
//               type="primary" 
//               danger
//               icon={<FilePdfOutlined />}
//               onClick={handleGeneratePDF}
//               loading={generatingPDF}
//               size="large"
//             >
//               {generatingPDF ? 'Generating PDF...' : 'Download Official PDF'}
//             </Button>
//           )}
          
//           {(request.status === 'disbursed' || request.status === 'justification_pending_supervisor') && (
//             <Button 
//               type="primary" 
//               onClick={handleGoToJustification}
//               icon={<DollarOutlined />}
//             >
//               Submit Justification
//             </Button>
//           )}
//         </Space>
//       </Card>

//       {/* File Viewer Modal */}
//       <Modal
//         title={viewingFile?.name || 'File Viewer'}
//         open={fileViewerVisible}
//         onCancel={() => {
//           setFileViewerVisible(false);
//           setViewingFile(null);
//           setFileViewerLoading(false);
//           if (viewingFile?.url) {
//             window.URL.revokeObjectURL(viewingFile.url);
//           }
//         }}
//         footer={[
//           <Button 
//             key="download" 
//             icon={<DownloadOutlined />}
//             onClick={() => {
//               if (viewingFile?.url) {
//                 const link = document.createElement('a');
//                 link.href = viewingFile.url;
//                 link.download = viewingFile.name || 'file';
//                 document.body.appendChild(link);
//                 link.click();
//                 document.body.removeChild(link);
//                 message.success('File downloaded successfully');
//               }
//             }}
//           >
//             Download
//           </Button>,
//           <Button 
//             key="close" 
//             type="primary"
//             onClick={() => {
//               setFileViewerVisible(false);
//               setViewingFile(null);
//               setFileViewerLoading(false);
//               if (viewingFile?.url) {
//                 window.URL.revokeObjectURL(viewingFile.url);
//               }
//             }}
//           >
//             Close
//           </Button>
//         ]}
//         width="80%"
//         style={{ top: 20 }}
//         bodyStyle={{ padding: '20px', textAlign: 'center', minHeight: '60vh' }}
//       >
//         {fileViewerLoading ? (
//           <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
//             <Spin size="large" />
//             <div style={{ marginLeft: '16px' }}>Loading file...</div>
//           </div>
//         ) : viewingFile ? (
//           <div>
//             {viewingFile.type === 'image' ? (
//               <img 
//                 src={viewingFile.url} 
//                 alt={viewingFile.name}
//                 style={{ 
//                   maxWidth: '100%', 
//                   maxHeight: '70vh', 
//                   objectFit: 'contain',
//                   border: '1px solid #d9d9d9',
//                   borderRadius: '6px'
//                 }}
//               />
//             ) : viewingFile.type === 'pdf' ? (
//               <PDFViewer 
//                 publicId={viewingFile.publicId}
//                 fileName={viewingFile.name}
//                 onError={(error) => {
//                   console.error('PDF viewer error:', error);
//                   message.error('Failed to load PDF. Please try downloading instead.');
//                 }}
//               />
//             ) : (
//               <div style={{ padding: '40px' }}>
//                 <Alert
//                   message="Preview not available"
//                   description={`File type "${viewingFile.mimetype}" cannot be previewed inline. Please download to view.`}
//                   type="info"
//                   showIcon
//                 />
//               </div>
//             )}
//           </div>
//         ) : null}
//       </Modal>
//     </div>
//   );
// };

// export default RequestDetails;











