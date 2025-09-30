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
  Modal
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
  EyeOutlined
} from '@ant-design/icons';
import api from '../../services/api';

const { Title, Text } = Typography;

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
  
  // File viewer modal state
  const [fileViewerVisible, setFileViewerVisible] = useState(false);
  const [viewingFile, setViewingFile] = useState(null);
  const [fileViewerLoading, setFileViewerLoading] = useState(false);

  useEffect(() => {
    const fetchRequest = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('Fetching request details for ID:', requestId);
        
        if (!requestId) {
          throw new Error('No request ID provided');
        }

        // Determine if this is a leave or cash request based on the current path
        let response;
        if (window.location.pathname.includes('/employee/sick-leave/')) {
          // Use leave endpoint
          response = await api.get(`/leave/${requestId}`);
        } else {
          // Default to cash request endpoint
          response = await api.get(`/api/cash-requests/${requestId}`);
        }
        
        console.log('Request details response:', response.data);
        
        if (response.data.success) {
          const requestData = response.data.data;
          console.log('Setting request data:', requestData);
          console.log('Attachments found:', requestData.attachments);
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
      'disbursed': { 
        color: 'cyan', 
        icon: <CheckCircleOutlined />, 
        text: 'Disbursed' 
      },
      'justification_pending': { 
        color: 'purple', 
        icon: <ClockCircleOutlined />, 
        text: 'Justification Pending' 
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

      // Get auth token - using 'token' as that's what's set in Login.js
      const token = localStorage.getItem('token');
      if (!token) {
        message.error('Authentication required. Please login again.');
        setFileViewerVisible(false);
        setFileViewerLoading(false);
        return;
      }

      // For local files, use the publicId directly
      let publicId = attachment.publicId || attachment.name;
      
      if (!publicId) {
        console.error('Could not get publicId from attachment:', attachment);
        message.error('Unable to locate file. Invalid attachment data.');
        setFileViewerVisible(false);
        setFileViewerLoading(false);
        return;
      }

      console.log('Fetching file for viewing:', publicId);

      // Determine file type first
      const isImage = attachment.mimetype?.startsWith('image/') || 
                     /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(attachment.name);
      const isPDF = attachment.mimetype === 'application/pdf' || 
                   /\.pdf$/i.test(attachment.name);

      if (isPDF) {
        // For PDFs, just set the viewing file with publicId for the PDFViewer component
        setViewingFile({
          name: attachment.name,
          publicId: publicId,
          type: 'pdf',
          mimetype: attachment.mimetype
        });
        setFileViewerLoading(false);
        return;
      }

      // For non-PDF files, fetch as blob
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
      
      // Fallback to download
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
      
      // Get auth token - using 'token' as that's what's set in Login.js
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
      
      // Determine what to use as the download identifier
      if (attachment.publicId) {
        // If publicId exists, use it directly (for local files, this will be the filename)
        downloadId = attachment.publicId;
      } else if (attachment.url) {
        // Extract publicId from Cloudinary URL for Cloudinary files
        const urlParts = attachment.url.split('/');
        const uploadIndex = urlParts.findIndex(part => part === 'upload');
        if (uploadIndex !== -1 && uploadIndex + 2 < urlParts.length) {
          downloadId = urlParts.slice(uploadIndex + 2).join('/');
          // Remove file extension from publicId for Cloudinary
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

      // Use correct API URL - REACT_APP_API_URL already includes /api
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

  const handleGoToJustification = () => {
    navigate(`/employee/request/${requestId}/justify`);
  };

  const handleGoBack = () => {
    navigate('/employee/requests');
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

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ background: 'yellow', padding: '10px', marginBottom: '16px', textAlign: 'center' }}>
        🔧 COMPONENT UPDATED - Attachments: {request.attachments ? request.attachments.length : 0}
      </div>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <Title level={3} style={{ margin: 0 }}>
            Cash Request Details
          </Title>
          <Text type="secondary">
            REQ-{request._id?.slice(-6).toUpperCase() || 'N/A'}
          </Text>
        </div>

        <Descriptions bordered column={1} size="middle">
          <Descriptions.Item label="Request ID">
            REQ-{request._id?.slice(-6).toUpperCase() || 'N/A'}
          </Descriptions.Item>
          
          <Descriptions.Item label="Status">
            {getStatusTag(request.status)}
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
          
          <Descriptions.Item label="Request Type">
            {request.requestType?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'N/A'}
          </Descriptions.Item>
          
          <Descriptions.Item label="Purpose">
            {request.purpose || 'N/A'}
          </Descriptions.Item>
          
          <Descriptions.Item label="Business Justification">
            {request.businessJustification || 'N/A'}
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

          {/* Attachments Section - This should always show */}
          <Descriptions.Item label="Attachments">
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
          
          {request.supervisorDecision && (
            <>
              <Descriptions.Item label="Supervisor Decision">
                <Tag color={request.supervisorDecision.decision === 'approved' ? 'green' : 'red'}>
                  {request.supervisorDecision.decision?.toUpperCase() || 'N/A'}
                </Tag>
              </Descriptions.Item>
              {request.supervisorDecision.comments && (
                <Descriptions.Item label="Supervisor Comments">
                  {request.supervisorDecision.comments}
                </Descriptions.Item>
              )}
              {request.supervisorDecision.decidedAt && (
                <Descriptions.Item label="Supervisor Decision Date">
                  {new Date(request.supervisorDecision.decidedAt).toLocaleDateString('en-GB')}
                </Descriptions.Item>
              )}
            </>
          )}
          
          {request.financeDecision && (
            <>
              <Descriptions.Item label="Finance Decision">
                <Tag color={request.financeDecision.decision === 'approved' ? 'green' : 'red'}>
                  {request.financeDecision.decision?.toUpperCase() || 'N/A'}
                </Tag>
              </Descriptions.Item>
              {request.financeDecision.comments && (
                <Descriptions.Item label="Finance Comments">
                  {request.financeDecision.comments}
                </Descriptions.Item>
              )}
              {request.financeDecision.decidedAt && (
                <Descriptions.Item label="Finance Decision Date">
                  {new Date(request.financeDecision.decidedAt).toLocaleDateString('en-GB')}
                </Descriptions.Item>
              )}
            </>
          )}

          {request.disbursementDetails && (
            <>
              <Descriptions.Item label="Disbursement Date">
                {request.disbursementDetails.disbursedAt ? 
                  new Date(request.disbursementDetails.disbursedAt).toLocaleDateString('en-GB') : 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label="Disbursed Amount">
                <Text strong style={{ color: '#1890ff' }}>
                  XAF {Number(request.disbursementDetails.amount || 0).toLocaleString()}
                </Text>
              </Descriptions.Item>
            </>
          )}
        </Descriptions>

        <Divider />

        <Space size="middle">
          <Button 
            type="default" 
            icon={<ArrowLeftOutlined />} 
            onClick={handleGoBack}
          >
            Back to Requests
          </Button>
          
          {(request.status === 'disbursed' || request.status === 'justification_pending') && (
            <Button 
              type="primary" 
              onClick={handleGoToJustification}
              icon={<DollarOutlined />}
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
          // Clean up the blob URL
          if (viewingFile?.url) {
            window.URL.revokeObjectURL(viewingFile.url);
          }
        }}
        footer={[
          <Button key="download" onClick={() => {
            if (viewingFile?.url) {
              const link = document.createElement('a');
              link.href = viewingFile.url;
              link.download = viewingFile.name || 'file';
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              message.success('File downloaded successfully');
            }
          }}>
            Download
          </Button>,
          <Button key="close" onClick={() => {
            setFileViewerVisible(false);
            setViewingFile(null);
            setFileViewerLoading(false);
            if (viewingFile?.url) {
              window.URL.revokeObjectURL(viewingFile.url);
            }
          }}>
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
    </div>
  );
};

export default RequestDetails;







