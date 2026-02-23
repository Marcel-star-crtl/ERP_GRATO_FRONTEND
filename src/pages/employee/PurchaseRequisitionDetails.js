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
  Tooltip
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
  SendOutlined,
  InfoCircleOutlined,
  ShoppingCartOutlined,
  TagOutlined,
  WarningOutlined,
  PaperClipOutlined,
  
} from '@ant-design/icons';
import api from '../../services/api';

const { Title, Text, Paragraph } = Typography;

// PDF Viewer Component
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

const PurchaseRequisitionDetails = () => {
  const { requisitionId } = useParams();
  const navigate = useNavigate();
  
  const [requisition, setRequisition] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloadingFiles, setDownloadingFiles] = useState(new Set());
  
  const [fileViewerVisible, setFileViewerVisible] = useState(false);
  const [viewingFile, setViewingFile] = useState(null);
  const [fileViewerLoading, setFileViewerLoading] = useState(false);

  useEffect(() => {
    const fetchRequisition = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('Fetching requisition details for ID:', requisitionId);
        
        if (!requisitionId) {
          throw new Error('No requisition ID provided');
        }

        const response = await api.get(`/purchase-requisitions/${requisitionId}`);
        
        console.log('Requisition details response:', response.data);
        
        if (response.data.success) {
          const requisitionData = response.data.data;
          console.log('Setting requisition data:', requisitionData);
          setRequisition(requisitionData);
        } else {
          throw new Error(response.data.message || 'Failed to fetch requisition details');
        }
      } catch (error) {
        console.error('Error fetching requisition:', error);
        const errorMessage = error.response?.data?.message || error.message || 'Failed to load requisition details';
        setError(errorMessage);
        message.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchRequisition();
  }, [requisitionId]);

  const getStatusTag = (status) => {
    const statusMap = {
      'draft': { color: 'default', text: 'Draft', icon: <ClockCircleOutlined /> },
      'pending_supervisor': { color: 'orange', text: 'Pending Supervisor', icon: <ClockCircleOutlined /> },
      'pending_finance_verification': { color: 'purple', text: 'Pending Finance', icon: <ClockCircleOutlined /> },
      'pending_supply_chain_review': { color: 'blue', text: 'Supply Chain Review', icon: <ClockCircleOutlined /> },
      'pending_buyer_assignment': { color: 'cyan', text: 'Buyer Assignment', icon: <ClockCircleOutlined /> },
      'pending_head_approval': { color: 'gold', text: 'Head Approval', icon: <ClockCircleOutlined /> },
      'approved': { color: 'green', text: 'Approved', icon: <CheckCircleOutlined /> },
      'rejected': { color: 'red', text: 'Rejected', icon: <CloseCircleOutlined /> },
      'partially_disbursed': { color: 'processing', text: 'Partially Disbursed', icon: <DollarOutlined /> },
      'fully_disbursed': { color: 'cyan', text: 'Fully Disbursed - Need Justification', icon: <DollarOutlined /> },
      'justification_pending_supervisor': { color: 'purple', text: 'Justification - Pending Supervisor', icon: <ClockCircleOutlined /> },
      'justification_pending_finance': { color: 'geekblue', text: 'Justification - Pending Finance', icon: <ClockCircleOutlined /> },
      'justification_rejected': { color: 'red', text: 'Justification Rejected', icon: <CloseCircleOutlined /> },
      'in_procurement': { color: 'blue', text: 'In Procurement', icon: <ShoppingCartOutlined /> },
      'completed': { color: 'green', text: 'Completed', icon: <CheckCircleOutlined /> }
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
      link.download = attachment.name || 'attachment';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      message.success(`Downloaded ${attachment.name}`);
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

  const handleGoBack = () => {
    navigate('/employee/purchase-requisitions');
  };

  const handleGoToJustification = () => {
    navigate(`/employee/purchase-requisitions/${requisitionId}/justify`);
  };

  const renderAttachments = () => {
    if (!requisition.attachments || requisition.attachments.length === 0) {
      return null;
    }

    return (
      <Card 
        size="small" 
        title={
          <Space>
            <PaperClipOutlined />
            Attachments ({requisition.attachments.length})
          </Space>
        } 
        style={{ marginBottom: '16px' }}
      >
        <List
          dataSource={requisition.attachments}
          renderItem={(attachment) => (
            <List.Item
              key={attachment._id}
              actions={[
                <Tooltip title="Preview">
                  <Button
                    size="small"
                    type="link"
                    icon={<EyeOutlined />}
                    onClick={() => handleViewAttachment(attachment)}
                  >
                    Preview
                  </Button>
                </Tooltip>,
                <Tooltip title="Download">
                  <Button
                    size="small"
                    type="link"
                    icon={<DownloadOutlined />}
                    loading={downloadingFiles.has(attachment._id)}
                    onClick={() => handleDownloadAttachment(attachment)}
                  >
                    Download
                  </Button>
                </Tooltip>
              ]}
            >
              <List.Item.Meta
                avatar={getFileIcon(attachment.mimetype, attachment.name)}
                title={
                  <Space>
                    <Text strong>{attachment.name}</Text>
                  </Space>
                }
                description={
                  <Space split="|">
                    <Text type="secondary">{formatFileSize(attachment.size)}</Text>
                    <Text type="secondary">
                      {new Date(attachment.uploadedAt).toLocaleDateString('en-GB')}
                    </Text>
                  </Space>
                }
              />
            </List.Item>
          )}
        />
      </Card>
    );
  };

  // Disbursement Progress Section
  const DisbursementProgressSection = ({ requisition }) => {
    if (!['partially_disbursed', 'fully_disbursed'].includes(requisition.status)) {
      return null;
    }

    const totalBudget = requisition.budgetXAF || 0;
    const totalDisbursed = requisition.totalDisbursed || 0;
    const remainingBalance = requisition.remainingBalance || 0;
    const progress = requisition.disbursementProgress || 0;

    return (
      <>
        <Divider orientation="left">
          <Title level={4} style={{ margin: 0 }}>
            <DollarOutlined /> Disbursement Progress
          </Title>
        </Divider>

        <Alert
          message={
            requisition.status === 'fully_disbursed' 
              ? '✅ Requisition Fully Disbursed' 
              : '💰 Partial Disbursement in Progress'
          }
          description={
            requisition.status === 'fully_disbursed'
              ? 'All approved funds have been disbursed. Please submit your justification with receipts.'
              : 'Your requisition is being disbursed in installments. You will be notified on each payment.'
          }
          type={requisition.status === 'fully_disbursed' ? 'success' : 'info'}
          showIcon
          style={{ marginBottom: '16px' }}
        />

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

        <Descriptions bordered column={2} size="small" style={{ marginBottom: '24px' }}>
          <Descriptions.Item label="Total Budget">
            <Text strong>XAF {totalBudget.toLocaleString()}</Text>
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
            <Tag color="blue">{requisition.disbursements?.length || 0}</Tag>
          </Descriptions.Item>
        </Descriptions>

        {/* {requisition.disbursements && requisition.disbursements.length > 0 && (
          <>
            <Title level={5}>
              <HistoryOutlined /> Payment History
            </Title>
            <Timeline>
              {requisition.disbursements.map((disb, index) => (
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
        )} */}

        {requisition.disbursements && requisition.disbursements.length > 0 && (
          <>
            <Title level={5}>
              <HistoryOutlined /> Payment History
            </Title>
            <Timeline>
              {requisition.disbursements.map((disb, index) => (
                <Timeline.Item 
                  key={index}
                  color={disb.acknowledged ? "green" : "blue"} // ✅ Change color based on acknowledgment
                  dot={
                    disb.acknowledged ? 
                    <CheckCircleOutlined style={{ fontSize: '16px' }} /> : 
                    <DollarOutlined style={{ fontSize: '16px' }} />
                  }
                >
                  <div>
                    <Space>
                      <Text strong>Payment #{disb.disbursementNumber}</Text>
                      {/* ✅ ADD ACKNOWLEDGMENT TAG */}
                      {disb.acknowledged ? (
                        <Tag color="success" icon={<CheckCircleOutlined />}>
                          Acknowledged
                        </Tag>
                      ) : (
                        <Tag color="warning" icon={<ClockCircleOutlined />}>
                          Awaiting Acknowledgment
                        </Tag>
                      )}
                    </Space>
                    <br />
                    <Text>Amount: XAF {disb.amount.toLocaleString()}</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      Disbursed: {new Date(disb.date).toLocaleString('en-GB')}
                    </Text>
                    
                    {/* ✅ SHOW ACKNOWLEDGMENT DETAILS */}
                    {disb.acknowledged && (
                      <>
                        <br />
                        <Text type="success" style={{ fontSize: '12px' }}>
                          ✅ Acknowledged: {new Date(disb.acknowledgmentDate).toLocaleString('en-GB')}
                        </Text>
                        {disb.acknowledgmentMethod && (
                          <>
                            <br />
                            <Text style={{ fontSize: '12px' }}>
                              Receipt Method: {disb.acknowledgmentMethod.replace('_', ' ').toUpperCase()}
                            </Text>
                          </>
                        )}
                        {disb.acknowledgmentNotes && (
                          <>
                            <br />
                            <Text italic style={{ fontSize: '12px', color: '#52c41a' }}>
                              Note: "{disb.acknowledgmentNotes}"
                            </Text>
                          </>
                        )}
                      </>
                    )}

                    {disb.notes && (
                      <>
                        <br />
                        <Text italic style={{ fontSize: '12px', color: '#666' }}>
                          Disbursement Note: {disb.notes}
                        </Text>
                      </>
                    )}
                  </div>
                </Timeline.Item>
              ))}
            </Timeline>
          </>
        )}

        {requisition.status === 'fully_disbursed' && (
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
        <div style={{ marginTop: '16px' }}>Loading requisition details...</div>
      </div>
    );
  }

  if (error || !requisition) {
    return (
      <div style={{ padding: '24px' }}>
        <Alert
          message="Error Loading Requisition"
          description={error || "The requisition you are trying to access does not exist or you don't have permission to view it."}
          type="error"
          showIcon
          action={
            <Button onClick={handleGoBack}>
              Back to Requisitions
            </Button>
          }
        />
      </div>
    );
  }

  console.log('Rendering with requisition:', requisition);

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <Title level={3} style={{ margin: 0 }}>
            Purchase Requisition Details
          </Title>
          <Space>
            <Text type="secondary">
              {requisition.requisitionNumber}
            </Text>
          </Space>
        </div>

        {/* Justification alerts removed - only buyers justify purchases */}

        <Descriptions bordered column={1} size="middle">
          <Descriptions.Item label="Requisition Number">
            <Text code copyable>{requisition.requisitionNumber}</Text>
          </Descriptions.Item>
          
          <Descriptions.Item label="Status">
            <Space>
              {getStatusTag(requisition.status)}
            </Space>
          </Descriptions.Item>
          
          <Descriptions.Item label="Title">
            <Text strong>{requisition.title}</Text>
          </Descriptions.Item>

          <Descriptions.Item label="Department">
            <Tag color="blue">{requisition.department}</Tag>
          </Descriptions.Item>

          <Descriptions.Item label="Category">
            <Tag color="green">{requisition.itemCategory}</Tag>
          </Descriptions.Item>
          
          <Descriptions.Item label="Budget (XAF)">
            <Text strong style={{ fontSize: '16px', color: '#1890ff' }}>
              XAF {Number(requisition.budgetXAF || 0).toLocaleString()}
            </Text>
          </Descriptions.Item>

          {requisition.budgetCodeInfo && (
            <Descriptions.Item label="Budget Code">
              <Tag color="gold">
                <TagOutlined /> {requisition.budgetCodeInfo.code} - {requisition.budgetCodeInfo.name}
              </Tag>
            </Descriptions.Item>
          )}
          
          {(requisition.totalDisbursed > 0 || requisition.disbursements?.length > 0) && (
            <Descriptions.Item label="Total Disbursed">
              <Text strong style={{ fontSize: '16px', color: '#52c41a' }}>
                XAF {Number(requisition.totalDisbursed || 0).toLocaleString()}
              </Text>
              {requisition.disbursements && requisition.disbursements.length > 0 && (
                <Tag color="blue" style={{ marginLeft: '8px' }}>
                  {requisition.disbursements.length} payment(s)
                </Tag>
              )}
            </Descriptions.Item>
          )}

          {requisition.remainingBalance > 0 && (
            <Descriptions.Item label="Remaining Balance">
              <Text strong style={{ fontSize: '16px', color: '#faad14' }}>
                XAF {Number(requisition.remainingBalance || 0).toLocaleString()}
              </Text>
            </Descriptions.Item>
          )}

          <Descriptions.Item label="Urgency">
            <Tag color={
              requisition.urgency === 'High' ? 'red' : 
              requisition.urgency === 'Medium' ? 'orange' : 'green'
            }>
              {requisition.urgency}
            </Tag>
          </Descriptions.Item>

          <Descriptions.Item label="Delivery Location">
            {requisition.deliveryLocation}
          </Descriptions.Item>
          
          <Descriptions.Item label="Expected Delivery Date">
            {requisition.expectedDate ? new Date(requisition.expectedDate).toLocaleDateString('en-GB') : 'N/A'}
          </Descriptions.Item>
          
          <Descriptions.Item label="Date Submitted">
            {requisition.createdAt ? new Date(requisition.createdAt).toLocaleDateString('en-GB') : 'N/A'}
          </Descriptions.Item>

          {requisition.project && (
            <Descriptions.Item label="Project">
              <Text strong>{requisition.project.name || 'N/A'}</Text>
              {requisition.project.code && <Tag style={{ marginLeft: 8 }}>{requisition.project.code}</Tag>}
            </Descriptions.Item>
          )}

          <Descriptions.Item label="Justification">
            <Paragraph style={{ marginBottom: 0 }}>
              {requisition.justificationOfPurchase || 'N/A'}
            </Paragraph>
          </Descriptions.Item>

          {requisition.justificationOfPreferredSupplier && (
            <Descriptions.Item label="Preferred Supplier Justification">
              <Paragraph style={{ marginBottom: 0 }}>
                {requisition.justificationOfPreferredSupplier}
              </Paragraph>
            </Descriptions.Item>
          )}
        </Descriptions>

        {/* Attachments Section */}
        {renderAttachments()}

        {/* Items List */}
        <Card size="small" title={`Items to Purchase (${requisition.items?.length || 0})`} style={{ marginBottom: '20px' }}>
          <Table
            dataSource={requisition.items || []}
            pagination={false}
            size="small"
            columns={[
              { 
                title: 'Code', 
                dataIndex: 'code', 
                key: 'code',
                width: 100,
                render: code => <Text code>{code}</Text>
              },
              { 
                title: 'Description', 
                dataIndex: 'description', 
                key: 'description',
                ellipsis: true
              },
              { 
                title: 'Category', 
                dataIndex: 'category', 
                key: 'category',
                width: 150,
                render: category => <Tag color="blue">{category}</Tag>
              },
              { 
                title: 'Quantity', 
                dataIndex: 'quantity', 
                key: 'quantity', 
                width: 100,
                align: 'center'
              },
              { 
                title: 'Unit', 
                dataIndex: 'measuringUnit', 
                key: 'unit', 
                width: 100,
                align: 'center'
              },
              {
                title: 'Est. Price (XAF)',
                key: 'estimatedPrice',
                width: 150,
                align: 'right',
                render: (_, record) => {
                  const total = (record.estimatedPrice || 0) * (record.quantity || 0);
                  return total > 0 ? total.toLocaleString() : 'TBD';
                }
              }
            ]}
          />
        </Card>

        {/* Budget Code Information */}
        {requisition.budgetCodeInfo && (
          <Card size="small" title="Budget Code Information" style={{ marginBottom: '20px' }}>
            <Descriptions column={2} size="small">
              <Descriptions.Item label="Budget Code">
                <Tag color="gold">
                  <TagOutlined /> {requisition.budgetCodeInfo.code}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Budget Name">
                <Text>{requisition.budgetCodeInfo.name}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Department">
                <Tag color="blue">{requisition.budgetCodeInfo.department}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Available at Submission">
                <Text strong>XAF {requisition.budgetCodeInfo.availableAtSubmission?.toLocaleString()}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Submitted Amount">
                <Text strong style={{ color: '#1890ff' }}>
                  XAF {requisition.budgetCodeInfo.submittedAmount?.toLocaleString()}
                </Text>
              </Descriptions.Item>
            </Descriptions>
          </Card>
        )}

        {/* Finance Verification Details */}
        {requisition.financeVerification && (
          <Card size="small" title="Finance Verification Details" style={{ marginBottom: '20px' }}>
            <Descriptions column={2} size="small">
              <Descriptions.Item label="Decision"><Tag color={requisition.financeVerification.decision === 'approved' ? 'green' : 
                           requisition.financeVerification.decision === 'rejected' ? 'red' : 'orange'}>
                  {requisition.financeVerification.decision === 'approved' ? '✅ Approved' : 
                   requisition.financeVerification.decision === 'rejected' ? '❌ Rejected' : 
                   '⏳ Pending'}
                </Tag>
              </Descriptions.Item>
              {requisition.financeVerification.verificationDate && (
                <Descriptions.Item label="Verification Date">
                  {new Date(requisition.financeVerification.verificationDate).toLocaleDateString('en-GB')}
                </Descriptions.Item>
              )}
              {requisition.financeVerification.verifiedBy && (
                <Descriptions.Item label="Verified By">
                  <Text>{requisition.financeVerification.verifiedBy.fullName || 'Finance Officer'}</Text>
                </Descriptions.Item>
              )}
              {requisition.financeVerification.comments && (
                <Descriptions.Item label="Comments" span={2}>
                  <Text italic>{requisition.financeVerification.comments}</Text>
                </Descriptions.Item>
              )}
            </Descriptions>
          </Card>
        )}

        {/* Disbursement Progress Section */}
        <DisbursementProgressSection requisition={requisition} />

        {/* Approval Chain Progress */}
        {requisition.approvalChain && requisition.approvalChain.length > 0 && (
          <>
            <Divider orientation="left">
              <Title level={4} style={{ margin: 0 }}>Approval Progress</Title>
            </Divider>
            
            <Timeline>
              {requisition.approvalChain.map((step, index) => {
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
                      <Text strong>Level {step.level}: {step.approver.name}</Text>
                      <br />
                      <Text type="secondary">{step.approver.role} - {step.approver.email}</Text>
                      <br />
                      {step.status === 'pending' && (
                        <Tag color="orange">Pending Action</Tag>
                      )}
                      {step.status === 'approved' && (
                        <>
                          <Tag color="green">Approved</Tag>
                          {step.actionDate && (
                            <Text type="secondary">
                              {' '}on {new Date(step.actionDate).toLocaleDateString('en-GB')}
                              {step.actionTime && ` at ${step.actionTime}`}
                            </Text>
                          )}
                        </>
                      )}
                      {step.status === 'rejected' && (
                        <>
                          <Tag color="red">Rejected</Tag>
                          {step.actionDate && (
                            <Text type="secondary">
                              {' '}on {new Date(step.actionDate).toLocaleDateString('en-GB')}
                              {step.actionTime && ` at ${step.actionTime}`}
                            </Text>
                          )}
                        </>
                      )}
                      {step.comments && (
                        <div style={{ marginTop: 4 }}>
                          <Text italic style={{ fontSize: '12px' }}>"{step.comments}"</Text>
                        </div>
                      )}
                    </div>
                  </Timeline.Item>
                );
              })}
            </Timeline>
          </>
        )}

        {/* Action Buttons */}
        <div style={{ marginTop: '24px', textAlign: 'center' }}>
          <Space size="middle" wrap>
            <Button 
              type="default" 
              icon={<ArrowLeftOutlined />} 
              onClick={handleGoBack}
            >
              Back to Requisitions
            </Button>
            
            {/* Justification buttons removed - only buyers justify purchases */}

            {/* {canEditRequest() && (
              <Button 
                type="primary" 
                icon={<EditOutlined />}
                onClick={() => navigate(`/employee/purchase-requisitions/${requestId}/edit`)}
                style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
              >
                Edit Request
              </Button>
            )}
            
            {canDeleteRequest() && (
              <Button 
                type="primary" 
                danger
                icon={<DeleteOutlined />}
                onClick={() => setDeleteModalVisible(true)}
              >
                Delete Request
              </Button>
            )} */}
          </Space>
        </div>
      </Card>

      {/* File Viewer Modal */}
      <Modal
        title={viewingFile?.name || 'File Preview'}
        open={fileViewerVisible}
        onCancel={() => {
          setFileViewerVisible(false);
          setViewingFile(null);
          if (viewingFile?.url) {
            window.URL.revokeObjectURL(viewingFile.url);
          }
        }}
        footer={[
          <Button 
            key="download" 
            type="primary"
            icon={<DownloadOutlined />}
            onClick={() => {
              if (viewingFile) {
                const currentFile = requisition.attachments.find(
                  att => att.publicId === viewingFile.publicId || att.name === viewingFile.name
                );
                if (currentFile) {
                  handleDownloadAttachment(currentFile);
                }
              }
            }}
          >
            Download
          </Button>,
          <Button 
            key="close" 
            onClick={() => {
              setFileViewerVisible(false);
              setViewingFile(null);
              if (viewingFile?.url) {
                window.URL.revokeObjectURL(viewingFile.url);
              }
            }}
          >
            Close
          </Button>
        ]}
        width={900}
        centered
        destroyOnClose
      >
        {fileViewerLoading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Spin size="large" />
            <div style={{ marginTop: '16px' }}>Loading file...</div>
          </div>
        ) : viewingFile ? (
          viewingFile.type === 'pdf' ? (
            <PDFViewer 
              publicId={viewingFile.publicId} 
              fileName={viewingFile.name}
              onError={(error) => {
                console.error('PDF viewer error:', error);
                message.error('Failed to load PDF. Please try downloading instead.');
                setFileViewerVisible(false);
              }}
            />
          ) : viewingFile.type === 'image' ? (
            <div style={{ textAlign: 'center' }}>
              <img 
                src={viewingFile.url} 
                alt={viewingFile.name}
                style={{ 
                  maxWidth: '100%', 
                  maxHeight: '70vh',
                  objectFit: 'contain'
                }}
              />
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <FileOutlined style={{ fontSize: '48px', color: '#bfbfbf', marginBottom: '16px' }} />
              <div>
                <Text>Preview not available for this file type.</Text>
                <br />
                <Button 
                  type="primary" 
                  icon={<DownloadOutlined />}
                  onClick={() => {
                    const currentFile = requisition.attachments.find(
                      att => att.publicId === viewingFile.publicId || att.name === viewingFile.name
                    );
                    if (currentFile) {
                      handleDownloadAttachment(currentFile);
                    }
                  }}
                  style={{ marginTop: '16px' }}
                >
                  Download File
                </Button>
              </div>
            </div>
          )
        ) : null}
      </Modal>
    </div>
  );
};

export default PurchaseRequisitionDetails;















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
//   Modal
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
//   EyeOutlined
// } from '@ant-design/icons';
// import api from '../../services/api';

// const { Title, Text } = Typography;

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

//         // Determine if this is a leave or cash request based on the current path
//         let response;
//         if (window.location.pathname.includes('/employee/sick-leave/')) {
//           // Use leave endpoint
//           response = await api.get(`/leave/${requestId}`);
//         } else {
//           // Default to cash request endpoint
//           response = await api.get(`/cash-requests/${requestId}`);
//         }
        
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
//         icon: <CheckCircleOutlined />, 
//         text: 'Disbursed' 
//       },
//       'justification_pending': { 
//         color: 'purple', 
//         icon: <ClockCircleOutlined />, 
//         text: 'Justification Pending' 
//       },
//       'completed': { 
//         color: 'green', 
//         icon: <CheckCircleOutlined />, 
//         text: 'Completed' 
//       }
//     };

//     const statusInfo = statusMap[status] || { 
//       color: 'default', 
//       text: status?.replace('_', ' ') || 'Unknown' 
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

//       // Get auth token - using 'token' as that's what's set in Login.js
//       const token = localStorage.getItem('token');
//       if (!token) {
//         message.error('Authentication required. Please login again.');
//         setFileViewerVisible(false);
//         setFileViewerLoading(false);
//         return;
//       }

//       // For local files, use the publicId directly
//       let publicId = attachment.publicId || attachment.name;
      
//       if (!publicId) {
//         console.error('Could not get publicId from attachment:', attachment);
//         message.error('Unable to locate file. Invalid attachment data.');
//         setFileViewerVisible(false);
//         setFileViewerLoading(false);
//         return;
//       }

//       console.log('Fetching file for viewing:', publicId);

//       // Determine file type first
//       const isImage = attachment.mimetype?.startsWith('image/') || 
//                      /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(attachment.name);
//       const isPDF = attachment.mimetype === 'application/pdf' || 
//                    /\.pdf$/i.test(attachment.name);

//       if (isPDF) {
//         // For PDFs, just set the viewing file with publicId for the PDFViewer component
//         setViewingFile({
//           name: attachment.name,
//           publicId: publicId,
//           type: 'pdf',
//           mimetype: attachment.mimetype
//         });
//         setFileViewerLoading(false);
//         return;
//       }

//       // For non-PDF files, fetch as blob
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
      
//       // Fallback to download
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
      
//       // Get auth token - using 'token' as that's what's set in Login.js
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
      
//       // Determine what to use as the download identifier
//       if (attachment.publicId) {
//         // If publicId exists, use it directly (for local files, this will be the filename)
//         downloadId = attachment.publicId;
//       } else if (attachment.url) {
//         // Extract publicId from Cloudinary URL for Cloudinary files
//         const urlParts = attachment.url.split('/');
//         const uploadIndex = urlParts.findIndex(part => part === 'upload');
//         if (uploadIndex !== -1 && uploadIndex + 2 < urlParts.length) {
//           downloadId = urlParts.slice(uploadIndex + 2).join('/');
//           // Remove file extension from publicId for Cloudinary
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

//       // Use correct API URL - REACT_APP_API_URL already includes /api
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

//   const handleGoToJustification = () => {
//     navigate(`/employee/request/${requestId}/justify`);
//   };

//   const handleGoBack = () => {
//     navigate('/employee/requests');
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

//   return (
//     <div style={{ padding: '24px' }}>
//       <div style={{ background: 'yellow', padding: '10px', marginBottom: '16px', textAlign: 'center' }}>
//         🔧 COMPONENT UPDATED - Attachments: {request.attachments ? request.attachments.length : 0}
//       </div>
//       <Card>
//         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
//           <Title level={3} style={{ margin: 0 }}>
//             Cash Request Details
//           </Title>
//           <Text type="secondary">
//             REQ-{request._id?.slice(-6).toUpperCase() || 'N/A'}
//           </Text>
//         </div>

//         <Descriptions bordered column={1} size="middle">
//           <Descriptions.Item label="Request ID">
//             REQ-{request._id?.slice(-6).toUpperCase() || 'N/A'}
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
          
//           <Descriptions.Item label="Request Type">
//             {request.requestType?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'N/A'}
//           </Descriptions.Item>
          
//           <Descriptions.Item label="Purpose">
//             {request.purpose || 'N/A'}
//           </Descriptions.Item>
          
//           <Descriptions.Item label="Business Justification">
//             {request.businessJustification || 'N/A'}
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

//           {/* Attachments Section - This should always show */}
//           <Descriptions.Item label="Attachments">
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
          
//           {request.supervisorDecision && (
//             <>
//               <Descriptions.Item label="Supervisor Decision">
//                 <Tag color={request.supervisorDecision.decision === 'approved' ? 'green' : 'red'}>
//                   {request.supervisorDecision.decision?.toUpperCase() || 'N/A'}
//                 </Tag>
//               </Descriptions.Item>
//               {request.supervisorDecision.comments && (
//                 <Descriptions.Item label="Supervisor Comments">
//                   {request.supervisorDecision.comments}
//                 </Descriptions.Item>
//               )}
//               {request.supervisorDecision.decidedAt && (
//                 <Descriptions.Item label="Supervisor Decision Date">
//                   {new Date(request.supervisorDecision.decidedAt).toLocaleDateString('en-GB')}
//                 </Descriptions.Item>
//               )}
//             </>
//           )}
          
//           {request.financeDecision && (
//             <>
//               <Descriptions.Item label="Finance Decision">
//                 <Tag color={request.financeDecision.decision === 'approved' ? 'green' : 'red'}>
//                   {request.financeDecision.decision?.toUpperCase() || 'N/A'}
//                 </Tag>
//               </Descriptions.Item>
//               {request.financeDecision.comments && (
//                 <Descriptions.Item label="Finance Comments">
//                   {request.financeDecision.comments}
//                 </Descriptions.Item>
//               )}
//               {request.financeDecision.decidedAt && (
//                 <Descriptions.Item label="Finance Decision Date">
//                   {new Date(request.financeDecision.decidedAt).toLocaleDateString('en-GB')}
//                 </Descriptions.Item>
//               )}
//             </>
//           )}

//           {request.disbursementDetails && (
//             <>
//               <Descriptions.Item label="Disbursement Date">
//                 {request.disbursementDetails.disbursedAt ? 
//                   new Date(request.disbursementDetails.disbursedAt).toLocaleDateString('en-GB') : 'N/A'}
//               </Descriptions.Item>
//               <Descriptions.Item label="Disbursed Amount">
//                 <Text strong style={{ color: '#1890ff' }}>
//                   XAF {Number(request.disbursementDetails.amount || 0).toLocaleString()}
//                 </Text>
//               </Descriptions.Item>
//             </>
//           )}
//         </Descriptions>

//         <Divider />

//         <Space size="middle">
//           <Button 
//             type="default" 
//             icon={<ArrowLeftOutlined />} 
//             onClick={handleGoBack}
//           >
//             Back to Requests
//           </Button>
          
//           {(request.status === 'disbursed' || request.status === 'justification_pending') && (
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
//           // Clean up the blob URL
//           if (viewingFile?.url) {
//             window.URL.revokeObjectURL(viewingFile.url);
//           }
//         }}
//         footer={[
//           <Button key="download" onClick={() => {
//             if (viewingFile?.url) {
//               const link = document.createElement('a');
//               link.href = viewingFile.url;
//               link.download = viewingFile.name || 'file';
//               document.body.appendChild(link);
//               link.click();
//               document.body.removeChild(link);
//               message.success('File downloaded successfully');
//             }
//           }}>
//             Download
//           </Button>,
//           <Button key="close" onClick={() => {
//             setFileViewerVisible(false);
//             setViewingFile(null);
//             setFileViewerLoading(false);
//             if (viewingFile?.url) {
//               window.URL.revokeObjectURL(viewingFile.url);
//             }
//           }}>
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







