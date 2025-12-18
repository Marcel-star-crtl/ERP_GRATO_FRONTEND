import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Card, Row, Col, Button, Space, Table, Tag, Typography, Breadcrumb,
  Empty, Modal, Form, Input, Select, Upload, message, Spin, Tooltip,
  Divider, Statistic, Badge, Tree, List, Alert, Radio
} from 'antd';
import {
  FolderOutlined, FileOutlined, UploadOutlined, DeleteOutlined,
  DownloadOutlined, FolderAddOutlined, SearchOutlined, LockOutlined,
  ShareAltOutlined, TeamOutlined, EyeOutlined, FilePdfOutlined,
  FileImageOutlined, FileWordOutlined, FileExcelOutlined, FileTextOutlined,
  HomeOutlined, CopyOutlined, ReloadOutlined, HistoryOutlined,
  BarChartOutlined, InfoCircleOutlined, UsergroupAddOutlined,
  SafetyOutlined, GlobalOutlined
} from '@ant-design/icons';
import sharepointAPI from '../../services/sharePointAPI';
import ManageAccessModal from './ManageAccessModal';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const SharePointPortal = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  
  // State Management
  const [folders, setFolders] = useState([]);
  const [files, setFiles] = useState([]);
  const [currentFolder, setCurrentFolder] = useState(null);
  const [breadcrumbs, setBreadcrumbs] = useState([{ label: 'Home', key: 'home' }]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploadLoading, setUploadLoading] = useState(false);
  
  // Modal States
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [folderModalVisible, setFolderModalVisible] = useState(false);
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [manageAccessModalVisible, setManageAccessModalVisible] = useState(false);
  
  // Forms
  const [form] = Form.useForm();
  const [uploadForm] = Form.useForm();
  const [shareForm] = Form.useForm();
  
  // File Upload
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedFolder, setSelectedFolder] = useState(null);
  
  // Stats
  const [stats, setStats] = useState({
    totalFiles: 0,
    totalFolders: 0,
    totalStorage: 0,
    totalDownloads: 0
  });

  const [userDepartmentInfo, setUserDepartmentInfo] = useState(null);

  useEffect(() => {
    fetchFolders();
    fetchStats();
  }, []);

  useEffect(() => {
    if (currentFolder) {
      fetchFiles(currentFolder);
      setSearchQuery('');
    } else {
      setFiles([]);
    }
  }, [currentFolder]);

  const fetchFolders = async () => {
    try {
      setLoading(true);
      const response = await sharepointAPI.getFolders();
      const foldersData = response.data.data || [];
      
      setFolders(foldersData);
      setUserDepartmentInfo({
        department: response.data.userDepartment,
        role: response.data.userRole
      });
      
      if (foldersData.length > 0 && !currentFolder) {
        const userDeptFolder = foldersData.find(f => f.department === response.data.userDepartment);
        const defaultFolder = userDeptFolder || foldersData[0];
        
        setCurrentFolder(defaultFolder._id);
        setBreadcrumbs([
          { label: 'Home', key: 'home' },
          { label: defaultFolder.name, key: defaultFolder._id }
        ]);
      }
      
      message.success(`${foldersData.length} accessible folders loaded`);
    } catch (error) {
      console.error('Error fetching folders:', error);
      message.error(error.response?.data?.message || 'Failed to load folders');
    } finally {
      setLoading(false);
    }
  };

  const fetchFiles = async (folderId, searchTerm = '') => {
    try {
      setLoading(true);
      const params = {};
      if (searchTerm) params.search = searchTerm;
      
      const response = await sharepointAPI.getFiles(folderId, params);
      setFiles(response.data.data || []);
      await fetchStats();
    } catch (error) {
      console.error('Error fetching files:', error);
      if (error.response?.status === 403) {
        message.error('You do not have access to this folder');
      } else {
        message.error('Failed to load files');
      }
      setFiles([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await sharepointAPI.getUserStats();
      const data = response.data.data;
      setStats({
        totalFiles: data.uploads?.filesUploaded || 0,
        totalStorage: data.uploads?.totalSize || 0,
        totalDownloads: data.uploads?.totalDownloads || 0,
        totalFolders: folders.length
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleNavigateFolder = useCallback((folder) => {
    setCurrentFolder(folder._id);
    setBreadcrumbs([
      { label: 'Home', key: 'home' },
      { label: folder.name, key: folder._id }
    ]);
  }, []);

  const handleCreateFolder = async (values) => {
    try {
      setLoading(true);
      
      await sharepointAPI.createFolder({
        name: values.folderName,
        description: values.description,
        department: user.role === 'admin' ? values.department : user.department,
        privacyLevel: values.privacyLevel,
        allowedDepartments: values.privacyLevel === 'public' ? [] : [values.department]
      });
      
      message.success('Folder created successfully');
      form.resetFields();
      setFolderModalVisible(false);
      await fetchFolders();
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to create folder');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadFiles = async (values) => {
    if (!currentFolder) {
      message.warning('Please select a folder first');
      return;
    }
    
    if (!uploadedFiles || uploadedFiles.length === 0) {
      message.warning('Please select at least one file to upload');
      return;
    }

    try {
      setUploadLoading(true);
      const formData = new FormData();
      
      uploadedFiles.forEach((file) => {
        const fileToAdd = file.originFileObj || file;
        formData.append('file', fileToAdd);
      });
      
      if (values.description) formData.append('description', values.description);
      if (values.tags) formData.append('tags', values.tags);

      await sharepointAPI.uploadFile(currentFolder, formData);
      
      message.success(`${uploadedFiles.length} file(s) uploaded successfully`);
      setUploadedFiles([]);
      uploadForm.resetFields();
      setUploadModalVisible(false);
      await fetchFiles(currentFolder);
    } catch (error) {
      console.error('Upload error:', error);
      message.error(error.response?.data?.message || 'Failed to upload files');
    } finally {
      setUploadLoading(false);
    }
  };

  const handleDownloadFile = async (file) => {
    try {
      const response = await sharepointAPI.downloadFile(file._id);
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', file.name);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      message.success(`Downloaded: ${file.name}`);
      await fetchStats();
    } catch (error) {
      console.error('Download error:', error);
      message.error('Failed to download file');
    }
  };

  const handleDeleteFile = (fileId, fileName) => {
    Modal.confirm({
      title: 'Delete File',
      content: `Are you sure you want to delete "${fileName}"?`,
      okText: 'Delete',
      okType: 'danger',
      async onOk() {
        try {
          await sharepointAPI.deleteFile(fileId, false);
          message.success('File deleted successfully');
          await fetchFiles(currentFolder);
        } catch (error) {
          message.error('Failed to delete file');
        }
      }
    });
  };

  const handleShareFile = async (values) => {
    try {
      if (!selectedFile) return;

      await sharepointAPI.shareFile(selectedFile._id, {
        shareWith: values.shareWith,
        permission: values.permissions,
        type: values.type
      });

      message.success('File shared successfully');
      setShareModalVisible(false);
      shareForm.resetFields();
      setSelectedFile(null);
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to share file');
    }
  };

  const handleGenerateShareLink = async (fileId) => {
    try {
      const response = await sharepointAPI.generateShareLink(fileId, 7 * 24 * 60 * 60);
      const shareLink = response.data.data.shareLink;
      
      Modal.success({
        title: 'Share Link Generated',
        content: (
          <div>
            <p>Share this link:</p>
            <Input 
              value={shareLink} 
              readOnly 
              addonAfter={<CopyOutlined onClick={() => {
                navigator.clipboard.writeText(shareLink);
                message.success('Link copied!');
              }} />}
            />
            <p style={{ marginTop: '10px', fontSize: '12px', color: '#999' }}>
              Link expires in 7 days
            </p>
          </div>
        )
      });
    } catch (error) {
      message.error('Failed to generate share link');
    }
  };

  const handleSearch = useCallback((value) => {
    setSearchQuery(value);
    if (currentFolder) {
      fetchFiles(currentFolder, value);
    }
  }, [currentFolder]);

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getFileIcon = (mimetype, fileName) => {
    if (!mimetype && !fileName) return <FileOutlined />;
    const type = mimetype || fileName.split('.').pop()?.toLowerCase();
    
    if (type.includes('pdf')) return <FilePdfOutlined style={{ color: '#ff4d4f' }} />;
    if (type.includes('image') || ['jpg', 'jpeg', 'png', 'gif'].includes(type)) 
      return <FileImageOutlined style={{ color: '#52c41a' }} />;
    if (type.includes('word') || ['doc', 'docx'].includes(type)) 
      return <FileWordOutlined style={{ color: '#1890ff' }} />;
    if (type.includes('excel') || ['xls', 'xlsx'].includes(type)) 
      return <FileExcelOutlined style={{ color: '#52c41a' }} />;
    if (type.includes('text') || ['txt', 'csv'].includes(type)) 
      return <FileTextOutlined style={{ color: '#faad14' }} />;
    
    return <FileOutlined />;
  };

  const getPrivacyIcon = (privacyLevel) => {
    if (privacyLevel === 'confidential') return <SafetyOutlined style={{ color: '#ff4d4f' }} />;
    if (privacyLevel === 'public') return <GlobalOutlined style={{ color: '#52c41a' }} />;
    return <TeamOutlined style={{ color: '#1890ff' }} />;
  };

  const foldersByDepartment = folders.reduce((acc, folder) => {
    const dept = folder.department || 'Other';
    if (!acc[dept]) acc[dept] = [];
    acc[dept].push(folder);
    return acc;
  }, {});

  const fileColumns = [
    {
      title: 'File Name',
      dataIndex: 'name',
      key: 'name',
      render: (name, record) => (
        <Space>
          {getFileIcon(record.mimetype, record.name)}
          <Text ellipsis style={{ maxWidth: 200 }}>{name}</Text>
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
      title: 'Uploaded By',
      dataIndex: ['uploadedBy', 'fullName'],
      key: 'uploadedBy',
      width: 120
    },
    {
      title: 'Date',
      dataIndex: 'uploadedAt',
      key: 'uploadedAt',
      width: 120,
      render: (date) => date ? new Date(date).toLocaleDateString() : 'N/A'
    },
    {
      title: 'Downloads',
      dataIndex: 'downloads',
      key: 'downloads',
      width: 80,
      render: (count) => <Badge count={count} style={{ backgroundColor: '#1890ff' }} />
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 180,
      render: (_, record) => {
        const permissions = record.userPermissions || {};
        return (
          <Space size="small">
            {permissions.canDownload !== false && (
              <Tooltip title="Download">
                <Button type="link" size="small" icon={<DownloadOutlined />}
                  onClick={() => handleDownloadFile(record)} />
              </Tooltip>
            )}
            {permissions.canShare !== false && (
              <Tooltip title="Share">
                <Button type="link" size="small" icon={<ShareAltOutlined />}
                  onClick={() => {
                    setSelectedFile(record);
                    setShareModalVisible(true);
                  }} />
              </Tooltip>
            )}
            {permissions.canShare !== false && (
              <Tooltip title="Get Share Link">
                <Button type="link" size="small" icon={<CopyOutlined />}
                  onClick={() => handleGenerateShareLink(record._id)} />
              </Tooltip>
            )}
            {permissions.canDelete !== false && (
              <Tooltip title="Delete">
                <Button type="link" size="small" danger icon={<DeleteOutlined />}
                  onClick={() => handleDeleteFile(record._id, record.name)} />
              </Tooltip>
            )}
          </Space>
        );
      }
    }
  ];

  const folderTreeData = Object.entries(foldersByDepartment).map(([dept, deptFolders]) => ({
    key: `dept-${dept}`,
    title: (
      <Text strong style={{ fontSize: '13px' }}>
        <TeamOutlined /> {dept}
      </Text>
    ),
    selectable: false,
    children: deptFolders.map((folder) => ({
      key: folder._id,
      title: (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '4px 0' }}
          onClick={() => handleNavigateFolder(folder)}>
          <FolderOutlined style={{ color: '#faad14' }} />
          <Text>{folder.name}</Text>
          {getPrivacyIcon(folder.privacyLevel)}
        </div>
      ),
      selectable: true,
      isLeaf: true
    }))
  }));

  const currentFolderData = folders.find(f => f._id === currentFolder);
  const filteredFiles = files.filter(f =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading && !currentFolder) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Spin size="large" />
        <div style={{ marginTop: '16px' }}>Loading SharePoint Portal...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <Card style={{ marginBottom: '24px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <Row align="middle" justify="space-between">
          <Col xs={24} sm={12}>
            <Title level={2} style={{ color: 'white', margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
              <ShareAltOutlined />
              File Sharing Portal
            </Title>
            <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: '14px', display: 'block', marginTop: '4px' }}>
              {userDepartmentInfo && (
                <>Department: {userDepartmentInfo.department} | Role: {userDepartmentInfo.role}</>
              )}
            </Text>
          </Col>
          <Col xs={24} sm={12} style={{ textAlign: 'right', marginTop: { xs: '12px', sm: '0px' } }}>
            <Space>
              <Button type="primary" icon={<FolderAddOutlined />}
                onClick={() => setFolderModalVisible(true)}
                style={{ backgroundColor: 'rgba(255,255,255,0.3)', borderColor: 'white', color: 'white' }}>
                New Folder
              </Button>
              <Button type="primary" icon={<UploadOutlined />}
                onClick={() => {
                  if (!currentFolder) {
                    message.warning('Please select a folder first');
                    return;
                  }
                  setUploadModalVisible(true);
                }}
                disabled={!currentFolder}
                style={{ background: 'white', color: '#667eea', border: 'none' }}>
                Upload Files
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Statistics */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic title="Total Files" value={stats.totalFiles}
              prefix={<FileOutlined />} valueStyle={{ color: '#1890ff' }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic title="Total Folders" value={folders.length}
              prefix={<FolderOutlined />} valueStyle={{ color: '#faad14' }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic title="Total Downloads" value={stats.totalDownloads}
              prefix={<DownloadOutlined />} valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic title="Storage Used" value={formatFileSize(stats.totalStorage)}
              valueStyle={{ color: '#722ed1' }} />
          </Card>
        </Col>
      </Row>

      {/* Main Content */}
      <Row gutter={24}>
        {/* Sidebar */}
        <Col xs={24} sm={24} md={6}>
          <Card title="Folders by Department" size="small" style={{ marginBottom: '16px' }}>
            <Button type="text" block icon={<HomeOutlined />}
              onClick={() => {
                setCurrentFolder(null);
                setBreadcrumbs([{ label: 'Home', key: 'home' }]);
              }}
              style={{ textAlign: 'left', marginBottom: '8px', justifyContent: 'flex-start' }}>
              All Folders
            </Button>
            <Divider style={{ margin: '12px 0' }} />
            <Tree treeData={folderTreeData}
              selectedKeys={currentFolder ? [currentFolder] : []}
              defaultExpandAll
              onSelect={(keys) => {
                if (keys.length > 0 && !keys[0].toString().startsWith('dept-')) {
                  const folder = folders.find(f => f._id === keys[0]);
                  if (folder) handleNavigateFolder(folder);
                }
              }} />
          </Card>

          <Card size="small">
            <Button block icon={<ReloadOutlined />}
              onClick={() => {
                fetchFolders();
                if (currentFolder) fetchFiles(currentFolder);
              }}
              loading={loading}>
              Refresh
            </Button>
          </Card>
        </Col>

        {/* Main Content Area */}
        <Col xs={24} sm={24} md={18}>
          <Breadcrumb style={{ marginBottom: '16px' }}>
            {breadcrumbs.map((bc) => (
              <Breadcrumb.Item key={bc.key}>
                <Button type="link" size="small"
                  onClick={() => {
                    if (bc.key === 'home') {
                      setCurrentFolder(null);
                      setBreadcrumbs([{ label: 'Home', key: 'home' }]);
                    }
                  }}>
                  {bc.label}
                </Button>
              </Breadcrumb.Item>
            ))}
          </Breadcrumb>

          {/* Folder Info */}
          {currentFolderData && (
            <Card style={{ marginBottom: '16px' }}>
              <Row gutter={16} align="middle">
                <Col xs={24} sm={16}>
                  <Space direction="vertical" size={4}>
                    <Title level={4} style={{ margin: 0 }}>
                      {currentFolderData.name}
                    </Title>
                    <Paragraph type="secondary" style={{ fontSize: '12px', margin: 0 }}>
                      {currentFolderData.description}
                    </Paragraph>
                    <Space wrap>
                      <Tag>{currentFolderData.department}</Tag>
                      <Tag color={
                        currentFolderData.privacyLevel === 'confidential' ? 'red' :
                        currentFolderData.privacyLevel === 'public' ? 'green' : 'blue'
                      }>
                        {currentFolderData.privacyLevel?.toUpperCase()}
                      </Tag>
                      {currentFolderData.userAccess?.permission && (
                        <Tag color="purple">
                          Your Access: {currentFolderData.userAccess.permission.toUpperCase()}
                        </Tag>
                      )}
                    </Space>
                  </Space>
                </Col>
                <Col xs={24} sm={8} style={{ textAlign: 'right' }}>
                  {currentFolderData.userAccess?.canManage && (
                    <Button
                      type="primary"
                      icon={<UsergroupAddOutlined />}
                      onClick={() => {
                        setSelectedFolder(currentFolderData);
                        setManageAccessModalVisible(true);
                      }}
                    >
                      Manage Access
                    </Button>
                  )}
                </Col>
              </Row>
            </Card>
          )}

          {/* Search */}
          {currentFolder && (
            <div style={{ marginBottom: '16px' }}>
              <Input.Search placeholder="Search files..." prefix={<SearchOutlined />}
                value={searchQuery} onChange={(e) => handleSearch(e.target.value)}
                allowClear size="large" />
            </div>
          )}

          {/* Files Table */}
          {currentFolder ? (
            <Card title={`Files (${filteredFiles.length})`}>
              {loading ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <Spin />
                  <div style={{ marginTop: '16px' }}>Loading files...</div>
                </div>
              ) : filteredFiles.length > 0 ? (
                <Table columns={fileColumns}
                  dataSource={filteredFiles.map((f) => ({ ...f, key: f._id }))}
                  pagination={{ pageSize: 10, size: 'small' }}
                  scroll={{ x: 'max-content' }} size="small" />
              ) : (
                <Empty description={searchQuery ? 'No files match your search' : 'No files in this folder'}
                  style={{ marginTop: '40px', marginBottom: '40px' }} />
              )}
            </Card>
          ) : (
            <Card>
              <Empty description="Please select a folder to view its contents"
                image={<FolderOutlined style={{ fontSize: '64px', color: '#faad14' }} />}
                style={{ marginTop: '40px', marginBottom: '40px' }}>
                <Text type="secondary">Browse folders by department from the sidebar</Text>
              </Empty>
            </Card>
          )}
        </Col>
      </Row>

      {/* Create Folder Modal */}
      <Modal title="Create New Folder" open={folderModalVisible}
        onOk={() => form.submit()} onCancel={() => {
          setFolderModalVisible(false);
          form.resetFields();
        }}
        confirmLoading={loading}>
        <Form form={form} layout="vertical" onFinish={handleCreateFolder}>
          <Form.Item name="folderName" label="Folder Name"
            rules={[{ required: true, message: 'Please enter folder name' }]}>
            <Input placeholder="e.g., Q4 Reports" />
          </Form.Item>
          <Form.Item name="description" label="Description"
            rules={[{ required: true, message: 'Please enter description' }]}>
            <TextArea rows={3} placeholder="Describe the folder contents..." />
          </Form.Item>
          {user.role === 'admin' && (
            <Form.Item name="department" label="Department"
              rules={[{ required: true, message: 'Please select department' }]}>
              <Select placeholder="Select department">
                <Option value="Company">Company</Option>
                <Option value="Finance">Finance</Option>
                <Option value="HR & Admin">HR & Admin</Option>
                <Option value="IT">IT</Option>
                <Option value="Supply Chain">Supply Chain</Option>
                <Option value="Technical">Technical</Option>
              </Select>
            </Form.Item>
          )}
          <Form.Item name="privacyLevel" label="Privacy Level"
            rules={[{ required: true, message: 'Please select privacy level' }]}
            initialValue="department">
            <Radio.Group>
              <Space direction="vertical">
                <Radio value="public">
                  <Space>
                    <GlobalOutlined style={{ color: '#52c41a' }} />
                    <div>
                      <Text strong>Public</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        Everyone in the organization can access
                      </Text>
                    </div>
                  </Space>
                </Radio>
                <Radio value="department">
                  <Space>
                    <TeamOutlined style={{ color: '#1890ff' }} />
                    <div>
                      <Text strong>Department</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        Only department members can access
                      </Text>
                    </div>
                  </Space>
                </Radio>
                <Radio value="confidential">
                  <Space>
                    <SafetyOutlined style={{ color: '#ff4d4f' }} />
                    <div>
                      <Text strong>Confidential</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        Only invited users can access (invisible to others)
                      </Text>
                    </div>
                  </Space>
                </Radio>
              </Space>
            </Radio.Group>
          </Form.Item>
        </Form>
      </Modal>

      {/* Upload Files Modal */}
      <Modal title="Upload Files" open={uploadModalVisible}
        onOk={() => uploadForm.submit()} onCancel={() => {
          setUploadModalVisible(false);
          uploadForm.resetFields();
          setUploadedFiles([]);
        }}
        confirmLoading={uploadLoading} width={600}>
        <Form form={uploadForm} layout="vertical" onFinish={handleUploadFiles}>
          <Form.Item label="Select Files"
            extra="You can upload multiple files at once (Max 100MB per file)">
            <Upload beforeUpload={() => false} multiple
              onChange={(info) => setUploadedFiles(info.fileList)}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.png,.jpg,.jpeg,.gif">
              <Button icon={<UploadOutlined />}>Click to Upload or Drag Files</Button>
            </Upload>
            {uploadedFiles.length > 0 && (
              <div style={{ marginTop: '12px' }}>
                <Text strong>Selected files ({uploadedFiles.length}):</Text>
                <List size="small"
                  dataSource={uploadedFiles}
                  renderItem={(file, idx) => (
                    <List.Item key={idx}>
                      <List.Item.Meta avatar={getFileIcon(file.type, file.name)}
                        title={file.name}
                        description={formatFileSize(file.size)} />
                    </List.Item>
                  )} />
              </div>
            )}
          </Form.Item>
          <Form.Item name="description" label="Description (Optional)">
            <TextArea rows={2} placeholder="Add a description for these files..." />
          </Form.Item>
          <Form.Item name="tags" label="Tags (Optional)">
            <Input placeholder="e.g., budget, 2024, important" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Share File Modal */}
      <Modal title={`Share: ${selectedFile?.name || ''}`}
        open={shareModalVisible}
        onOk={() => shareForm.submit()}
        onCancel={() => {
          setShareModalVisible(false);
          shareForm.resetFields();
          setSelectedFile(null);
        }}>
        <Form form={shareForm} layout="vertical" onFinish={handleShareFile}>
          <Form.Item name="type" label="Share Type"
            rules={[{ required: true }]}>
            <Select placeholder="Select share type">
              <Option value="user">Specific User</Option>
              <Option value="department">Department</Option>
            </Select>
          </Form.Item>
          <Form.Item name="shareWith" label="Share With"
            rules={[{ required: true }]}>
            <Input placeholder="Enter user email or department name" />
          </Form.Item>
          <Form.Item name="permissions" label="Permissions"
            rules={[{ required: true }]}>
            <Select placeholder="Select permissions">
              <Option value="view">View Only</Option>
              <Option value="download">Download</Option>
              <Option value="edit">Edit</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* Manage Access Modal */}
      {selectedFolder && (
        <ManageAccessModal
          visible={manageAccessModalVisible}
          onClose={() => {
            setManageAccessModalVisible(false);
            setSelectedFolder(null);
          }}
          folder={selectedFolder}
          onSuccess={() => {
            fetchFolders();
            if (currentFolder) fetchFiles(currentFolder);
          }}
        />
      )}
    </div>
  );
};

export default SharePointPortal;











// import React, { useState, useEffect, useCallback } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { useSelector } from 'react-redux';
// import {
//   Card,
//   Row,
//   Col,
//   Button,
//   Space,
//   Table,
//   Tag,
//   Typography,
//   Breadcrumb,
//   Empty,
//   Modal,
//   Form,
//   Input,
//   Select,
//   Upload,
//   message,
//   Spin,
//   Tooltip,
//   Divider,
//   Statistic,
//   Badge,
//   Tree,
//   List,
//   Alert
// } from 'antd';
// import {
//   FolderOutlined,
//   FileOutlined,
//   UploadOutlined,
//   DeleteOutlined,
//   DownloadOutlined,
//   FolderAddOutlined,
//   SearchOutlined,
//   LockOutlined,
//   ShareAltOutlined,
//   TeamOutlined,
//   EyeOutlined,
//   FilePdfOutlined,
//   FileImageOutlined,
//   FileWordOutlined,
//   FileExcelOutlined,
//   FileTextOutlined,
//   HomeOutlined,
//   CopyOutlined,
//   ReloadOutlined,
//   HistoryOutlined,
//   BarChartOutlined,
//   InfoCircleOutlined
// } from '@ant-design/icons';
// import sharepointAPI from '../../services/sharePointAPI';

// const { Title, Text, Paragraph } = Typography;
// const { Option } = Select;
// const { TextArea } = Input;

// const SharePointPortal = () => {
//   const navigate = useNavigate();
//   const { user } = useSelector((state) => state.auth);
  
//   // State Management
//   const [folders, setFolders] = useState([]);
//   const [files, setFiles] = useState([]);
//   const [currentFolder, setCurrentFolder] = useState(null);
//   const [breadcrumbs, setBreadcrumbs] = useState([{ label: 'Home', key: 'home' }]);
//   const [searchQuery, setSearchQuery] = useState('');
//   const [loading, setLoading] = useState(true);
//   const [uploadLoading, setUploadLoading] = useState(false);
  
//   // Modal States
//   const [uploadModalVisible, setUploadModalVisible] = useState(false);
//   const [folderModalVisible, setFolderModalVisible] = useState(false);
//   const [shareModalVisible, setShareModalVisible] = useState(false);
  
//   // Forms
//   const [form] = Form.useForm();
//   const [uploadForm] = Form.useForm();
//   const [shareForm] = Form.useForm();
  
//   // File Upload
//   const [uploadedFiles, setUploadedFiles] = useState([]);
//   const [selectedFile, setSelectedFile] = useState(null);
  
//   // Stats
//   const [stats, setStats] = useState({
//     totalFiles: 0,
//     totalFolders: 0,
//     totalStorage: 0,
//     totalDownloads: 0
//   });

//   // Department Info
//   const [userDepartmentInfo, setUserDepartmentInfo] = useState(null);

//   // Fetch folders on component mount
//   useEffect(() => {
//     fetchFolders();
//     fetchStats();
//   }, []);

//   // Fetch files when folder changes
//   useEffect(() => {
//     if (currentFolder) {
//       fetchFiles(currentFolder);
//       setSearchQuery('');
//     } else {
//       setFiles([]);
//     }
//   }, [currentFolder]);

//   /**
//    * Fetch all accessible folders based on user's department
//    */
//   const fetchFolders = async () => {
//     try {
//       setLoading(true);
//       const response = await sharepointAPI.getFolders();
//       const foldersData = response.data.data || [];
      
//       setFolders(foldersData);
//       setUserDepartmentInfo({
//         department: response.data.userDepartment,
//         role: response.data.userRole
//       });
      
//       // Set default folder to first one in user's department
//       if (foldersData.length > 0 && !currentFolder) {
//         const userDeptFolder = foldersData.find(f => f.department === response.data.userDepartment);
//         const defaultFolder = userDeptFolder || foldersData[0];
        
//         setCurrentFolder(defaultFolder._id);
//         setBreadcrumbs([
//           { label: 'Home', key: 'home' },
//           { label: defaultFolder.name, key: defaultFolder._id }
//         ]);
//       }
      
//       message.success(`${foldersData.length} folders loaded for your department`);
//     } catch (error) {
//       console.error('Error fetching folders:', error);
//       message.error(error.response?.data?.message || 'Failed to load folders');
//     } finally {
//       setLoading(false);
//     }
//   };

//   /**
//    * Fetch files for current folder
//    */
//   const fetchFiles = async (folderId, searchTerm = '') => {
//     try {
//       setLoading(true);
//       const params = {};
//       if (searchTerm) params.search = searchTerm;
      
//       const response = await sharepointAPI.getFiles(folderId, params);
//       setFiles(response.data.data || []);
      
//       // Update stats after fetching files
//       await fetchStats();
//     } catch (error) {
//       console.error('Error fetching files:', error);
      
//       if (error.response?.status === 403) {
//         message.error('You do not have access to this folder');
//       } else {
//         message.error('Failed to load files');
//       }
//       setFiles([]);
//     } finally {
//       setLoading(false);
//     }
//   };

//   /**
//    * Fetch user statistics
//    */
//   const fetchStats = async () => {
//     try {
//       const response = await sharepointAPI.getUserStats();
//       const data = response.data.data;
//       setStats({
//         totalFiles: data.uploads?.filesUploaded || 0,
//         totalStorage: data.uploads?.totalSize || 0,
//         totalDownloads: data.uploads?.totalDownloads || 0,
//         totalFolders: folders.length
//       });
//     } catch (error) {
//       console.error('Error fetching stats:', error);
//     }
//   };

//   /**
//    * Navigate to folder
//    */
//   const handleNavigateFolder = useCallback((folder) => {
//     console.log('Navigating to folder:', folder.name, folder._id);
//     setCurrentFolder(folder._id);
//     setBreadcrumbs([
//       { label: 'Home', key: 'home' },
//       { label: folder.name, key: folder._id }
//     ]);
//   }, []);

//   /**
//    * Create new folder
//    */
//   const handleCreateFolder = async (values) => {
//     try {
//       setLoading(true);
      
//       // Use user's department if not admin
//       const departmentToUse = user.role === 'admin' ? values.department : user.department;
      
//       await sharepointAPI.createFolder({
//         name: values.folderName,
//         description: values.description,
//         department: departmentToUse,
//         isPublic: values.accessLevel === 'public',
//         allowedDepartments: values.accessLevel === 'public' ? [] : [departmentToUse]
//       });
      
//       message.success('Folder created successfully');
//       form.resetFields();
//       setFolderModalVisible(false);
//       await fetchFolders();
//     } catch (error) {
//       message.error(error.response?.data?.message || 'Failed to create folder');
//     } finally {
//       setLoading(false);
//     }
//   };

//   /**
//    * Upload files
//    */
//   const handleUploadFiles = async (values) => {
//     if (!currentFolder) {
//       message.warning('Please select a folder first');
//       return;
//     }
    
//     if (!uploadedFiles || uploadedFiles.length === 0) {
//       message.warning('Please select at least one file to upload');
//       return;
//     }

//     try {
//       setUploadLoading(true);
//       const formData = new FormData();
      
//       uploadedFiles.forEach((file) => {
//         const fileToAdd = file.originFileObj || file;
//         formData.append('file', fileToAdd);
//       });
      
//       if (values.description) {
//         formData.append('description', values.description);
//       }
//       if (values.tags) {
//         formData.append('tags', values.tags);
//       }

//       const response = await sharepointAPI.uploadFile(currentFolder, formData);
      
//       message.success(`${uploadedFiles.length} file(s) uploaded successfully`);
//       setUploadedFiles([]);
//       uploadForm.resetFields();
//       setUploadModalVisible(false);
//       await fetchFiles(currentFolder);
//     } catch (error) {
//       console.error('Upload error:', error);
//       message.error(error.response?.data?.message || 'Failed to upload files');
//     } finally {
//       setUploadLoading(false);
//     }
//   };

//   /**
//    * Download file
//    */
//   const handleDownloadFile = async (file) => {
//     try {
//       const response = await sharepointAPI.downloadFile(file._id);
      
//       const url = window.URL.createObjectURL(new Blob([response.data]));
//       const link = document.createElement('a');
//       link.href = url;
//       link.setAttribute('download', file.name);
//       document.body.appendChild(link);
//       link.click();
//       link.parentNode.removeChild(link);
//       window.URL.revokeObjectURL(url);
      
//       message.success(`Downloaded: ${file.name}`);
//       await fetchStats();
//     } catch (error) {
//       console.error('Download error:', error);
//       message.error('Failed to download file');
//     }
//   };

//   /**
//    * Delete file
//    */
//   const handleDeleteFile = (fileId, fileName) => {
//     Modal.confirm({
//       title: 'Delete File',
//       content: `Are you sure you want to delete "${fileName}"? This action cannot be undone.`,
//       okText: 'Delete',
//       okType: 'danger',
//       async onOk() {
//         try {
//           await sharepointAPI.deleteFile(fileId, false);
//           message.success('File deleted successfully');
//           await fetchFiles(currentFolder);
//         } catch (error) {
//           message.error('Failed to delete file');
//         }
//       }
//     });
//   };

//   /**
//    * Share file
//    */
//   const handleShareFile = async (values) => {
//     try {
//       if (!selectedFile) return;

//       await sharepointAPI.shareFile(selectedFile._id, {
//         shareWith: values.shareWith,
//         shareType: values.permissions,
//         type: values.type
//       });

//       message.success('File shared successfully');
//       setShareModalVisible(false);
//       shareForm.resetFields();
//       setSelectedFile(null);
//     } catch (error) {
//       message.error(error.response?.data?.message || 'Failed to share file');
//     }
//   };

//   /**
//    * Generate share link
//    */
//   const handleGenerateShareLink = async (fileId) => {
//     try {
//       const response = await sharepointAPI.generateShareLink(fileId, 7 * 24 * 60 * 60);
//       const shareLink = response.data.data.shareLink;
      
//       Modal.success({
//         title: 'Share Link Generated',
//         content: (
//           <div>
//             <p>Share this link with others:</p>
//             <Input 
//               value={shareLink} 
//               readOnly 
//               addonAfter={<CopyOutlined onClick={() => {
//                 navigator.clipboard.writeText(shareLink);
//                 message.success('Link copied to clipboard');
//               }} />}
//             />
//             <p style={{ marginTop: '10px', fontSize: '12px', color: '#999' }}>
//               Link expires in 7 days
//             </p>
//           </div>
//         )
//       });
//     } catch (error) {
//       message.error('Failed to generate share link');
//     }
//   };

//   /**
//    * Search files
//    */
//   const handleSearch = useCallback((value) => {
//     setSearchQuery(value);
//     if (currentFolder) {
//       fetchFiles(currentFolder, value);
//     }
//   }, [currentFolder]);

//   /**
//    * Format file size
//    */
//   const formatFileSize = (bytes) => {
//     if (bytes === 0) return '0 Bytes';
//     const k = 1024;
//     const sizes = ['Bytes', 'KB', 'MB', 'GB'];
//     const i = Math.floor(Math.log(bytes) / Math.log(k));
//     return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
//   };

//   /**
//    * Get file icon
//    */
//   const getFileIcon = (mimetype, fileName) => {
//     if (!mimetype && !fileName) return <FileOutlined />;
    
//     const type = mimetype || fileName.split('.').pop()?.toLowerCase();
    
//     if (type.includes('pdf')) return <FilePdfOutlined style={{ color: '#ff4d4f' }} />;
//     if (type.includes('image') || ['jpg', 'jpeg', 'png', 'gif'].includes(type)) 
//       return <FileImageOutlined style={{ color: '#52c41a' }} />;
//     if (type.includes('word') || ['doc', 'docx'].includes(type)) 
//       return <FileWordOutlined style={{ color: '#1890ff' }} />;
//     if (type.includes('excel') || ['xls', 'xlsx'].includes(type)) 
//       return <FileExcelOutlined style={{ color: '#52c41a' }} />;
//     if (type.includes('text') || ['txt', 'csv'].includes(type)) 
//       return <FileTextOutlined style={{ color: '#faad14' }} />;
    
//     return <FileOutlined />;
//   };

//   // Group folders by department for better organization
//   const foldersByDepartment = folders.reduce((acc, folder) => {
//     const dept = folder.department || 'Other';
//     if (!acc[dept]) acc[dept] = [];
//     acc[dept].push(folder);
//     return acc;
//   }, {});

//   // Table columns for files
//   const fileColumns = [
//     {
//       title: 'File Name',
//       dataIndex: 'name',
//       key: 'name',
//       render: (name, record) => (
//         <Space>
//           {getFileIcon(record.mimetype, record.name)}
//           <Text ellipsis style={{ maxWidth: 200 }}>{name}</Text>
//         </Space>
//       )
//     },
//     {
//       title: 'Size',
//       dataIndex: 'size',
//       key: 'size',
//       width: 100,
//       render: (size) => formatFileSize(size)
//     },
//     {
//       title: 'Uploaded By',
//       dataIndex: ['uploadedBy', 'fullName'],
//       key: 'uploadedBy',
//       width: 120
//     },
//     {
//       title: 'Date',
//       dataIndex: 'uploadedAt',
//       key: 'uploadedAt',
//       width: 120,
//       render: (date) => date ? new Date(date).toLocaleDateString() : 'N/A'
//     },
//     {
//       title: 'Downloads',
//       dataIndex: 'downloads',
//       key: 'downloads',
//       width: 80,
//       render: (count) => <Badge count={count} style={{ backgroundColor: '#1890ff' }} />
//     },
//     {
//       title: 'Actions',
//       key: 'actions',
//       width: 180,
//       render: (_, record) => {
//         const permissions = record.userPermissions || {};
//         return (
//           <Space size="small">
//             {permissions.canDownload !== false && (
//               <Tooltip title="Download">
//                 <Button
//                   type="link"
//                   size="small"
//                   icon={<DownloadOutlined />}
//                   onClick={() => handleDownloadFile(record)}
//                 />
//               </Tooltip>
//             )}
//             {permissions.canShare !== false && (
//               <Tooltip title="Share">
//                 <Button
//                   type="link"
//                   size="small"
//                   icon={<ShareAltOutlined />}
//                   onClick={() => {
//                     setSelectedFile(record);
//                     setShareModalVisible(true);
//                   }}
//                 />
//               </Tooltip>
//             )}
//             {permissions.canShare !== false && (
//               <Tooltip title="Get Share Link">
//                 <Button
//                   type="link"
//                   size="small"
//                   icon={<CopyOutlined />}
//                   onClick={() => handleGenerateShareLink(record._id)}
//                 />
//               </Tooltip>
//             )}
//             {permissions.canDelete !== false && (
//               <Tooltip title="Delete">
//                 <Button
//                   type="link"
//                   size="small"
//                   danger
//                   icon={<DeleteOutlined />}
//                   onClick={() => handleDeleteFile(record._id, record.name)}
//                 />
//               </Tooltip>
//             )}
//           </Space>
//         );
//       }
//     }
//   ];

//   // Folder tree for sidebar with department grouping
//   const folderTreeData = Object.entries(foldersByDepartment).map(([dept, deptFolders]) => ({
//     key: `dept-${dept}`,
//     title: (
//       <Text strong style={{ fontSize: '13px' }}>
//         <TeamOutlined /> {dept}
//       </Text>
//     ),
//     selectable: false,
//     children: deptFolders.map((folder) => ({
//       key: folder._id,
//       title: (
//         <div 
//           style={{ 
//             display: 'flex', 
//             alignItems: 'center', 
//             gap: '8px',
//             cursor: 'pointer',
//             padding: '4px 0'
//           }}
//           onClick={() => handleNavigateFolder(folder)}
//         >
//           <FolderOutlined style={{ color: '#faad14' }} />
//           <Text>{folder.name}</Text>
//           {!folder.isPublic && <LockOutlined style={{ fontSize: '12px' }} />}
//         </div>
//       ),
//       selectable: true,
//       isLeaf: true
//     }))
//   }));

//   if (loading && !currentFolder) {
//     return (
//       <div style={{ padding: '24px', textAlign: 'center' }}>
//         <Spin size="large" />
//         <div style={{ marginTop: '16px' }}>Loading SharePoint Portal...</div>
//       </div>
//     );
//   }

//   const currentFolderData = folders.find(f => f._id === currentFolder);
//   const filteredFiles = files.filter(f =>
//     f.name.toLowerCase().includes(searchQuery.toLowerCase())
//   );

//   return (
//     <div style={{ padding: '24px' }}>
//       {/* Header */}
//       <Card style={{ marginBottom: '24px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
//         <Row align="middle" justify="space-between">
//           <Col xs={24} sm={12}>
//             <Title level={2} style={{ color: 'white', margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
//               <ShareAltOutlined />
//               File Sharing Portal
//             </Title>
//             <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: '14px', display: 'block', marginTop: '4px' }}>
//               {userDepartmentInfo && (
//                 <>Department: {userDepartmentInfo.department} | Role: {userDepartmentInfo.role}</>
//               )}
//             </Text>
//           </Col>
//           <Col xs={24} sm={12} style={{ textAlign: 'right', marginTop: { xs: '12px', sm: '0px' } }}>
//             <Space>
//               <Button
//                 type="primary"
//                 icon={<FolderAddOutlined />}
//                 onClick={() => setFolderModalVisible(true)}
//                 style={{ backgroundColor: 'rgba(255,255,255,0.3)', borderColor: 'white', color: 'white' }}
//               >
//                 New Folder
//               </Button>
//               <Button
//                 type="primary"
//                 icon={<UploadOutlined />}
//                 onClick={() => {
//                   if (!currentFolder) {
//                     message.warning('Please select a folder first');
//                     return;
//                   }
//                   setUploadModalVisible(true);
//                 }}
//                 disabled={!currentFolder}
//                 style={{ background: 'white', color: '#667eea', border: 'none' }}
//               >
//                 Upload Files
//               </Button>
//             </Space>
//           </Col>
//         </Row>
//       </Card>

//       {/* Department Access Alert */}
//       {userDepartmentInfo && (
//         <Alert
//           message="Department Access"
//           description={`You can access folders from ${userDepartmentInfo.department} department and any public folders. Your uploaded files will be associated with your department.`}
//           type="info"
//           icon={<InfoCircleOutlined />}
//           showIcon
//           closable
//           style={{ marginBottom: '16px' }}
//         />
//       )}

//       {/* Statistics */}
//       <Row gutter={16} style={{ marginBottom: '24px' }}>
//         <Col xs={24} sm={12} md={6}>
//           <Card>
//             <Statistic
//               title="Total Files"
//               value={stats.totalFiles}
//               prefix={<FileOutlined />}
//               valueStyle={{ color: '#1890ff' }}
//             />
//           </Card>
//         </Col>
//         <Col xs={24} sm={12} md={6}>
//           <Card>
//             <Statistic
//               title="Total Folders"
//               value={folders.length}
//               prefix={<FolderOutlined />}
//               valueStyle={{ color: '#faad14' }}
//             />
//           </Card>
//         </Col>
//         <Col xs={24} sm={12} md={6}>
//           <Card>
//             <Statistic
//               title="Total Downloads"
//               value={stats.totalDownloads}
//               prefix={<DownloadOutlined />}
//               valueStyle={{ color: '#52c41a' }}
//             />
//           </Card>
//         </Col>
//         <Col xs={24} sm={12} md={6}>
//           <Card>
//             <Statistic
//               title="Storage Used"
//               value={formatFileSize(stats.totalStorage)}
//               valueStyle={{ color: '#722ed1' }}
//             />
//           </Card>
//         </Col>
//       </Row>

//       {/* Main Content */}
//       <Row gutter={24}>
//         {/* Sidebar */}
//         <Col xs={24} sm={24} md={6}>
//           <Card title="Folders by Department" size="small" style={{ marginBottom: '16px' }}>
//             <Button
//               type="text"
//               block
//               icon={<HomeOutlined />}
//               onClick={() => {
//                 setCurrentFolder(null);
//                 setBreadcrumbs([{ label: 'Home', key: 'home' }]);
//               }}
//               style={{ textAlign: 'left', marginBottom: '8px', justifyContent: 'flex-start' }}
//             >
//               All Folders
//             </Button>
//             <Divider style={{ margin: '12px 0' }} />
//             <Tree
//               treeData={folderTreeData}
//               selectedKeys={currentFolder ? [currentFolder] : []}
//               defaultExpandAll
//               onSelect={(keys) => {
//                 if (keys.length > 0 && !keys[0].toString().startsWith('dept-')) {
//                   const folder = folders.find(f => f._id === keys[0]);
//                   if (folder) {
//                     handleNavigateFolder(folder);
//                   }
//                 }
//               }}
//             />
//           </Card>

//           <Card size="small">
//             <Button
//               block
//               icon={<ReloadOutlined />}
//               onClick={() => {
//                 fetchFolders();
//                 if (currentFolder) fetchFiles(currentFolder);
//               }}
//               loading={loading}
//             >
//               Refresh
//             </Button>
//           </Card>
//         </Col>

//         {/* Main Content Area */}
//         <Col xs={24} sm={24} md={12}>
//           {/* Breadcrumb */}
//           <Breadcrumb style={{ marginBottom: '16px' }}>
//             {breadcrumbs.map((bc) => (
//               <Breadcrumb.Item key={bc.key}>
//                 <Button 
//                   type="link" 
//                   size="small"
//                   onClick={() => {
//                     if (bc.key === 'home') {
//                       setCurrentFolder(null);
//                       setBreadcrumbs([{ label: 'Home', key: 'home' }]);
//                     }
//                   }}
//                 >
//                   {bc.label}
//                 </Button>
//               </Breadcrumb.Item>
//             ))}
//           </Breadcrumb>

//           {/* Folder Info */}
//           {currentFolderData && (
//             <Card style={{ marginBottom: '16px' }}>
//               <Row gutter={16}>
//                 <Col xs={24} sm={12}>
//                   <Text strong style={{ display: 'block', marginBottom: '8px' }}>Folder:</Text>
//                   <Title level={4} style={{ margin: '4px 0' }}>
//                     {currentFolderData.name}
//                   </Title>
//                   <Paragraph type="secondary" style={{ fontSize: '12px', margin: 0 }}>
//                     {currentFolderData.description}
//                   </Paragraph>
//                 </Col>
//                 <Col xs={24} sm={12}>
//                   <Space direction="vertical" size={4} style={{ width: '100%' }}>
//                     <div>
//                       <Text type="secondary" style={{ fontSize: '12px' }}>
//                         <strong>Department:</strong> {currentFolderData.department}
//                       </Text>
//                     </div>
//                     <div>
//                       <Text type="secondary" style={{ fontSize: '12px' }}>
//                         <strong>Access:</strong>{' '}
//                         {currentFolderData.isPublic ? (
//                           <Tag color="green">Public</Tag>
//                         ) : (
//                           <Tag color="orange">Restricted</Tag>
//                         )}
//                       </Text>
//                     </div>
//                     <div>
//                       <Text type="secondary" style={{ fontSize: '12px' }}>
//                         <strong>Your Access:</strong>{' '}
//                         {currentFolderData.userAccess?.canUpload && <Tag color="blue">Upload</Tag>}
//                         {currentFolderData.userAccess?.canManage && <Tag color="purple">Manage</Tag>}
//                       </Text>
//                     </div>
//                   </Space>
//                 </Col>
//               </Row>
//             </Card>
//           )}

//           {/* Search */}
//           {currentFolder && (
//             <div style={{ marginBottom: '16px' }}>
//               <Input.Search
//                 placeholder="Search files in this folder..."
//                 prefix={<SearchOutlined />}
//                 value={searchQuery}
//                 onChange={(e) => handleSearch(e.target.value)}
//                 allowClear
//                 size="large"
//               />
//             </div>
//           )}

//           {/* Files Table */}
//           {currentFolder ? (
//             <Card title={`Files (${filteredFiles.length})`}>
//               {loading ? (
//                 <div style={{ textAlign: 'center', padding: '40px' }}>
//                   <Spin />
//                   <div style={{ marginTop: '16px' }}>Loading files...</div>
//                 </div>
//               ) : filteredFiles.length > 0 ? (
//                 <Table
//                   columns={fileColumns}
//                   dataSource={filteredFiles.map((f) => ({ ...f, key: f._id }))}
//                   pagination={{ pageSize: 10, size: 'small' }}
//                   scroll={{ x: 'max-content' }}
//                   size="small"
//                 />
//               ) : (
//                 <Empty
//                   description={searchQuery ? 'No files match your search' : 'No files in this folder'}
//                   style={{ marginTop: '40px', marginBottom: '40px' }}
//                 />
//               )}
//             </Card>
//           ) : (
//             <Card>
//               <Empty
//                 description="Please select a folder to view its contents"
//                 image={<FolderOutlined style={{ fontSize: '64px', color: '#faad14' }} />}
//                 style={{ marginTop: '40px', marginBottom: '40px' }}
//               >
//                 <Text type="secondary">
//                   Browse folders by department from the sidebar
//                 </Text>
//               </Empty>
//             </Card>
//           )}
//         </Col>

//         {/* Right Sidebar */}
//         <Col xs={24} sm={24} md={6}>
//           <Card title="Quick Actions" size="small" style={{ marginBottom: '16px' }}>
//             <Space direction="vertical" style={{ width: '100%' }}>
//               <Button block icon={<TeamOutlined />} size="small">
//                 Team Access
//               </Button>
//               <Button block icon={<HistoryOutlined />} size="small">
//                 Activity Log
//               </Button>
//               <Button block icon={<BarChartOutlined />} size="small">
//                 Statistics
//               </Button>
//             </Space>
//           </Card>

//           {/* Department Folders Summary */}
//           <Card title="Department Folders" size="small">
//             <List
//               size="small"
//               dataSource={Object.entries(foldersByDepartment)}
//               renderItem={([dept, deptFolders]) => (
//                 <List.Item>
//                   <List.Item.Meta
//                     avatar={<TeamOutlined />}
//                     title={dept}
//                     description={`${deptFolders.length} folders`}
//                   />
//                 </List.Item>
//               )}
//             />
//           </Card>
//         </Col>
//       </Row>

//       {/* Create Folder Modal */}
//       <Modal
//         title="Create New Folder"
//         open={folderModalVisible}
//         onOk={() => form.submit()}
//         onCancel={() => {
//           setFolderModalVisible(false);
//           form.resetFields();
//         }}
//         confirmLoading={loading}
//       >
//         <Form form={form} layout="vertical" onFinish={handleCreateFolder}>
//           <Form.Item
//             name="folderName"
//             label="Folder Name"
//             rules={[{ required: true, message: 'Please enter folder name' }]}
//           >
//             <Input placeholder="e.g., Q4 Reports" />
//           </Form.Item>
//           <Form.Item
//             name="description"
//             label="Description"
//             rules={[{ required: true, message: 'Please enter description' }]}
//           >
//             <TextArea rows={3} placeholder="Describe the folder contents..." />
//           </Form.Item>
//           {user.role === 'admin' && (
//             <Form.Item
//               name="department"
//               label="Department"
//               rules={[{ required: true, message: 'Please select department' }]}
//             >
//               <Select placeholder="Select department">
//                 <Option value="Company">Company</Option>
//                 <Option value="Finance">Finance</Option>
//                 <Option value="HR">HR</Option>
//                 <Option value="IT">IT</Option>
//                 <Option value="Supply Chain">Supply Chain</Option>
//                 <Option value="Technical">Technical</Option>
//               </Select>
//             </Form.Item>
//           )}
//           {user.role !== 'admin' && (
//             <Alert
//               message={`This folder will be created in ${user.department} department`}
//               type="info"
//               showIcon
//               style={{ marginBottom: '16px' }}
//             />
//           )}
//           <Form.Item
//             name="accessLevel"
//             label="Access Level"
//             rules={[{ required: true, message: 'Please select access level' }]}
//           >
//             <Select placeholder="Select access level">
//               <Option value="public">Public (Everyone can access)</Option>
//               <Option value="restricted">Restricted (Department only)</Option>
//             </Select>
//           </Form.Item>
//         </Form>
//       </Modal>

//       {/* Upload Files Modal */}
//       <Modal
//         title="Upload Files"
//         open={uploadModalVisible}
//         onOk={() => uploadForm.submit()}
//         onCancel={() => {
//           setUploadModalVisible(false);
//           uploadForm.resetFields();
//           setUploadedFiles([]);
//         }}
//         confirmLoading={uploadLoading}
//         width={600}
//       >
//         <Form form={uploadForm} layout="vertical" onFinish={handleUploadFiles}>
//           <Form.Item
//             label="Select Files"
//             extra="You can upload multiple files at once (Max 100MB per file)"
//           >
//             <Upload
//               beforeUpload={() => false}
//               multiple
//               onChange={(info) => setUploadedFiles(info.fileList)}
//               accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.png,.jpg,.jpeg,.gif"
//             >
//               <Button icon={<UploadOutlined />}>Click to Upload or Drag Files</Button>
//             </Upload>
//             {uploadedFiles.length > 0 && (
//               <div style={{ marginTop: '12px' }}>
//                 <Text strong>Selected files ({uploadedFiles.length}):</Text>
//                 <List
//                   size="small"
//                   dataSource={uploadedFiles}
//                   renderItem={(file, idx) => (
//                     <List.Item key={idx}>
//                       <List.Item.Meta
//                         avatar={getFileIcon(file.type, file.name)}
//                         title={file.name}
//                         description={formatFileSize(file.size)}
//                       />
//                     </List.Item>
//                   )}
//                 />
//               </div>
//             )}
//           </Form.Item>
//           <Form.Item
//             name="description"
//             label="Description (Optional)"
//           >
//             <TextArea rows={2} placeholder="Add a description for these files..." />
//           </Form.Item>
//           <Form.Item
//             name="tags"
//             label="Tags (Optional)"
//           >
//             <Input placeholder="e.g., budget, 2024, important" />
//           </Form.Item>
//         </Form>
//       </Modal>

//       {/* Share File Modal */}
//       <Modal
//         title={`Share: ${selectedFile?.name || ''}`}
//         open={shareModalVisible}
//         onOk={() => shareForm.submit()}
//         onCancel={() => {
//           setShareModalVisible(false);
//           shareForm.resetFields();
//           setSelectedFile(null);
//         }}
//       >
//         <Form form={shareForm} layout="vertical" onFinish={handleShareFile}>
//           <Form.Item
//             name="type"
//             label="Share Type"
//             rules={[{ required: true }]}
//           >
//             <Select placeholder="Select share type">
//               <Option value="user">Specific User</Option>
//               <Option value="department">Department</Option>
//             </Select>
//           </Form.Item>
//           <Form.Item
//             name="shareWith"
//             label="Share With"
//             rules={[{ required: true }]}
//           >
//             <Input placeholder="Enter user email or department name" />
//           </Form.Item>
//           <Form.Item
//             name="permissions"
//             label="Permissions"
//             rules={[{ required: true }]}
//           >
//             <Select placeholder="Select permissions">
//               <Option value="view">View Only</Option>
//               <Option value="download">Download</Option>
//               <Option value="edit">Edit</Option>
//             </Select>
//           </Form.Item>
//         </Form>
//       </Modal>
//     </div>
//   );
// };

// export default SharePointPortal;




