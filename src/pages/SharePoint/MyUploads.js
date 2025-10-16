import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Card, Table, Button, Space, Tag, Typography, Empty, Spin, message,
  Modal, Row, Col, Statistic, Tooltip, Input, Select
} from 'antd';
import {
  FileOutlined, DownloadOutlined, DeleteOutlined, ShareAltOutlined,
  FolderOutlined, ArrowLeftOutlined, UploadOutlined, SearchOutlined,
  FilePdfOutlined, FileImageOutlined, FileWordOutlined, FileExcelOutlined, FileTextOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import sharepointAPI from '../../services/sharePointAPI';

dayjs.extend(relativeTime);

const { Title, Text } = Typography;
const { Option } = Select;

const MyUploads = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [myFiles, setMyFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ filesUploaded: 0, totalSize: 0, totalDownloads: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [filterFolder, setFilterFolder] = useState('all');

  useEffect(() => {
    fetchMyUploads();
    fetchMyStats();
  }, []);

  const fetchMyUploads = async () => {
    try {
      setLoading(true);
      const response = await sharepointAPI.getUserFiles();
      setMyFiles(response.data.data || []);
      
      // If no files, show empty state instead of mock data
      if (!response.data.data || response.data.data.length === 0) {
        message.info('No files uploaded yet');
      }
    } catch (error) {
      console.error('Error fetching uploads:', error);
      message.error(error.response?.data?.message || 'Failed to load your uploads');
      setMyFiles([]); // Set to empty array instead of mock data
    } finally {
      setLoading(false);
    }
  };

  const fetchMyStats = async () => {
    try {
      const response = await sharepointAPI.getUserStats();
      const uploadData = response.data.data.uploads || {};
      setStats({
        filesUploaded: uploadData.filesUploaded || 0,
        totalSize: uploadData.totalSize || 0,
        totalDownloads: uploadData.totalDownloads || 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      // Set to zero instead of showing error
      setStats({
        filesUploaded: 0,
        totalSize: 0,
        totalDownloads: 0
      });
    }
  };

  const getFileIcon = (mimetype) => {
    if (mimetype?.includes('pdf')) return <FilePdfOutlined style={{ color: '#ff4d4f', fontSize: '20px' }} />;
    if (mimetype?.includes('image')) return <FileImageOutlined style={{ color: '#52c41a', fontSize: '20px' }} />;
    if (mimetype?.includes('word')) return <FileWordOutlined style={{ color: '#1890ff', fontSize: '20px' }} />;
    if (mimetype?.includes('excel') || mimetype?.includes('spreadsheet')) 
      return <FileExcelOutlined style={{ color: '#52c41a', fontSize: '20px' }} />;
    return <FileTextOutlined style={{ fontSize: '20px' }} />;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const handleDelete = (fileId) => {
    Modal.confirm({
      title: 'Delete File',
      content: 'Are you sure you want to delete this file?',
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          await sharepointAPI.deleteFile(fileId);
          message.success('File deleted successfully');
          fetchMyUploads();
        } catch (error) {
          message.error('Failed to delete file');
        }
      }
    });
  };

  const handleDownload = async (file) => {
    try {
      const response = await sharepointAPI.downloadFile(file._id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', file.name);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      message.success(`Downloaded: ${file.name}`);
    } catch (error) {
      message.error('Failed to download file');
    }
  };

  const columns = [
    {
      title: 'File',
      dataIndex: 'name',
      key: 'name',
      render: (name, record) => (
        <Space>
          {getFileIcon(record.mimetype)}
          <div>
            <div style={{ fontWeight: 500 }}>{name}</div>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {record.folderId?.name || 'Unknown Folder'}
            </Text>
          </div>
        </Space>
      )
    },
    {
      title: 'Size',
      dataIndex: 'size',
      key: 'size',
      width: 100,
      render: (size) => formatFileSize(size)
    },
    {
      title: 'Uploaded',
      dataIndex: 'uploadedAt',
      key: 'uploadedAt',
      width: 120,
      render: (date) => dayjs(date).fromNow()
    },
    {
      title: 'Downloads',
      dataIndex: 'downloads',
      key: 'downloads',
      width: 100,
      render: (count) => <Tag color="blue">{count}</Tag>
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Download">
            <Button type="link" size="small" icon={<DownloadOutlined />} 
              onClick={() => handleDownload(record)} />
          </Tooltip>
          <Tooltip title="Share">
            <Button type="link" size="small" icon={<ShareAltOutlined />} />
          </Tooltip>
          <Tooltip title="Delete">
            <Button type="link" size="small" danger icon={<DeleteOutlined />} 
              onClick={() => handleDelete(record._id)} />
          </Tooltip>
        </Space>
      )
    }
  ];

  const filteredFiles = myFiles.filter(file => {
    const matchesSearch = file.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFolder = filterFolder === 'all' || file.folderId?.name === filterFolder;
    return matchesSearch && matchesFolder;
  });

  return (
    <div style={{ padding: '24px' }}>
      <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/sharepoint/portal')} 
        style={{ marginBottom: '16px' }}>
        Back to Portal
      </Button>

      <Card style={{ marginBottom: '24px' }}>
        <Title level={3} style={{ margin: 0 }}>
          <FileOutlined /> My Uploads
        </Title>
        <Text type="secondary">Files you've uploaded to the SharePoint Portal</Text>
      </Card>

      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic title="Files Uploaded" value={stats.filesUploaded} 
              prefix={<UploadOutlined />} valueStyle={{ color: '#1890ff' }} />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic title="Total Size" value={formatFileSize(stats.totalSize)} 
              prefix={<FolderOutlined />} valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic title="Total Downloads" value={stats.totalDownloads} 
              prefix={<DownloadOutlined />} valueStyle={{ color: '#faad14' }} />
          </Card>
        </Col>
      </Row>

      <Card style={{ marginBottom: '24px' }}>
        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Input placeholder="Search your files..." prefix={<SearchOutlined />}
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} allowClear />
          </Col>
          <Col xs={24} sm={12}>
            <Select style={{ width: '100%' }} placeholder="Filter by folder" 
              value={filterFolder} onChange={setFilterFolder}>
              <Option value="all">All Folders</Option>
              <Option value="Company Shared">Company Shared</Option>
              <Option value="Finance Department">Finance Department</Option>
              <Option value="HR Department">HR Department</Option>
            </Select>
          </Col>
        </Row>
      </Card>

      <Card title={`Your Files (${filteredFiles.length})`}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}><Spin size="large" /></div>
        ) : filteredFiles.length > 0 ? (
          <Table columns={columns} dataSource={filteredFiles} rowKey="_id" 
            pagination={{ pageSize: 10 }} />
        ) : (
          <Empty description="No files found" style={{ margin: '40px 0' }} />
        )}
      </Card>
    </div>
  );
};

export default MyUploads;




