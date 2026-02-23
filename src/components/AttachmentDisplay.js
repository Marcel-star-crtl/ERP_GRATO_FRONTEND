import React, { useState } from 'react';
import {
  Card,
  List,
  Button,
  Space,
  Tag,
  Empty,
  message,
  Tooltip,
  Progress
} from 'antd';
import {
  DownloadOutlined,
  FilePdfOutlined,
  FileImageOutlined,
  FileWordOutlined,
  FileExcelOutlined,
  FileUnknownOutlined,
  EyeOutlined,
  DeleteOutlined
} from '@ant-design/icons';

const AttachmentDisplay = ({ 
  attachments = [], 
  requisitionId, 
  onDownload,
  onDelete,
  allowDelete = false,
  loading = false,
  title = "📎 Attachments"
}) => {
  const [deletingAttachmentId, setDeletingAttachmentId] = useState(null);

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getFileIcon = (filename) => {
    if (!filename) return <FileUnknownOutlined />;
    
    const ext = filename.split('.').pop().toLowerCase();
    switch (ext) {
      case 'pdf':
        return <FilePdfOutlined style={{ color: '#ff4d4f' }} />;
      case 'doc':
      case 'docx':
        return <FileWordOutlined style={{ color: '#1890ff' }} />;
      case 'xls':
      case 'xlsx':
        return <FileExcelOutlined style={{ color: '#52c41a' }} />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return <FileImageOutlined style={{ color: '#faad14' }} />;
      default:
        return <FileUnknownOutlined />;
    }
  };

  const handleDelete = async (attachmentId, attachmentName) => {
    if (onDelete) {
      try {
        setDeletingAttachmentId(attachmentId);
        await onDelete(attachmentId);
        message.success(`${attachmentName} deleted successfully`);
      } catch (error) {
        message.error(`Failed to delete ${attachmentName}`);
      } finally {
        setDeletingAttachmentId(null);
      }
    }
  };

  if (!attachments || attachments.length === 0) {
    return (
      <Card size="small" title={title} style={{ marginBottom: '16px' }}>
        <Empty description="No attachments" />
      </Card>
    );
  }

  return (
    <Card 
      size="small" 
      title={title}
      style={{ marginBottom: '16px' }}
      extra={<Tag color="blue">{attachments.length} file(s)</Tag>}
    >
      <List
        dataSource={attachments}
        loading={loading}
        renderItem={(attachment) => (
          <List.Item
            key={attachment._id || attachment.id}
            style={{
              padding: '12px 0',
              borderBottom: '1px solid #f0f0f0'
            }}
          >
            <List.Item.Meta
              avatar={
                <div style={{ fontSize: '18px', marginRight: '8px' }}>
                  {getFileIcon(attachment.name || attachment.filename)}
                </div>
              }
              title={
                <div>
                  <strong>{attachment.name || attachment.filename}</strong>
                  <br />
                  <span style={{ fontSize: '12px', color: '#999' }}>
                    {formatFileSize(attachment.size || attachment.fileSize)}
                    {attachment.uploadedAt && (
                      <>
                        {' '} • {new Date(attachment.uploadedAt).toLocaleDateString('en-GB')} at{' '}
                        {new Date(attachment.uploadedAt).toLocaleTimeString('en-GB', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </>
                    )}
                    {attachment.uploadedBy && (
                      <> • Uploaded by {attachment.uploadedBy}</>
                    )}
                  </span>
                </div>
              }
            />
            <Space size="small">
              {attachment.url && (
                <Tooltip title="Download file">
                  <Button
                    size="small"
                    type="primary"
                    icon={<DownloadOutlined />}
                    onClick={() => onDownload && onDownload(attachment)}
                    loading={loading}
                  >
                    Download
                  </Button>
                </Tooltip>
              )}
              {allowDelete && onDelete && (
                <Tooltip title="Delete attachment">
                  <Button
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => handleDelete(attachment._id || attachment.id, attachment.name || attachment.filename)}
                    loading={deletingAttachmentId === (attachment._id || attachment.id)}
                  >
                    Delete
                  </Button>
                </Tooltip>
              )}
            </Space>
          </List.Item>
        )}
      />
    </Card>
  );
};

export default AttachmentDisplay;
