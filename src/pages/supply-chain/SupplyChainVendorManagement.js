import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Card,
  Table,
  Button,
  Space,
  Typography,
  Tag,
  Row,
  Col,
  Statistic,
  Modal,
  Form,
  Input,
  Select,
  Rate,
  Progress,
  Alert,
  Tabs,
  Drawer,
  message,
  Descriptions,
  Upload,
  Spin
} from 'antd';
import {
  TeamOutlined,
  PlusOutlined,
  EditOutlined,
  EyeOutlined,
  DownloadOutlined,
  StarOutlined,
  TruckOutlined,
  DollarOutlined,
  PhoneOutlined,
  MailOutlined,
  GlobalOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  UploadOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import supplierApiService from '../../services/supplierAPI';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const { TabPane } = Tabs;

const SupplyChainVendorManagement = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [suppliers, setSuppliers] = useState([]);
  const [onboardingApplications, setOnboardingApplications] = useState([]);
  const [stats, setStats] = useState({});
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [supplierModalVisible, setSupplierModalVisible] = useState(false);
  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false);
  const [form] = Form.useForm();
  const [activeTab, setActiveTab] = useState('all');
  const [fileLists, setFileLists] = useState({});
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });

  // Function to format address object or string
  const formatAddress = (address) => {
    if (!address) return 'Not provided';
    
    if (typeof address === 'string') {
      return address;
    }
    
    if (typeof address === 'object') {
      const parts = [];
      if (address.street) parts.push(address.street);
      if (address.city) parts.push(address.city);
      if (address.state) parts.push(address.state);
      if (address.country) parts.push(address.country);
      if (address.postalCode) parts.push(address.postalCode);
      
      return parts.length > 0 ? parts.join(', ') : 'Not provided';
    }
    
    return 'Not provided';
  };

  // Function to handle file downloads following project pattern
  const downloadFile = async (fileData, fileName = 'document') => {
    if (!fileData) {
      message.error('File not available');
      return;
    }

    try {
      // Try secure download first
      const publicId = typeof fileData === 'string' ? fileData : fileData.publicId;
      
      if (publicId) {
        // Check if it's a supplier document
        if (publicId.startsWith('supplier_doc_')) {
          // Use supplier-document route for supplier documents (public access)
          const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5001'}/files/supplier-document/${publicId}`, {
            method: 'GET',
          });

          if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = (typeof fileData === 'object' && fileData.name) ? fileData.name : fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            message.success(`Downloaded ${(typeof fileData === 'object' && fileData.name) ? fileData.name : fileName}`);
            return;
          }
        } else {
          // Use download route for other files (requires auth)
          const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5001'}/files/download/${publicId}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
          });

          if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = (typeof fileData === 'object' && fileData.name) ? fileData.name : fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            message.success(`Downloaded ${(typeof fileData === 'object' && fileData.name) ? fileData.name : fileName}`);
            return;
          }
        }
      }

      // Fallback to direct URL for images (public access)
      const extension = publicId ? publicId.split('.').pop().toLowerCase() : '';
      let fileUrl;
      
      if (publicId && publicId.startsWith('supplier_doc_')) {
        // Use supplier-document route for supplier documents (public access)
        fileUrl = `${process.env.REACT_APP_API_URL || 'http://localhost:5001'}/files/supplier-document/${publicId}`;
      } else if (['png', 'jpg', 'jpeg', 'gif', 'bmp'].includes(extension)) {
        // Use image route for images (no auth required)
        fileUrl = typeof fileData === 'string' 
          ? `${process.env.REACT_APP_API_URL || 'http://localhost:5001'}/files/image/${fileData}`
          : fileData.publicId 
            ? `${process.env.REACT_APP_API_URL || 'http://localhost:5001'}/files/image/${fileData.publicId}`
            : fileData.url;
      } else {
        // For non-images, we need to use view route which requires auth - open in new tab
        fileUrl = typeof fileData === 'string' 
          ? `${process.env.REACT_APP_API_URL || 'http://localhost:5001'}/files/view/${fileData}`
          : fileData.publicId 
            ? `${process.env.REACT_APP_API_URL || 'http://localhost:5001'}/files/view/${fileData.publicId}`
            : fileData.url;
      }
      
      if (fileUrl) {
        window.open(fileUrl, '_blank');
      } else {
        message.error('No download URL available');
      }
    } catch (error) {
      console.error('Error downloading file:', error);
      message.error('Failed to download file');
    }
  };

  // Function to view file inline
  const viewFile = (fileData) => {
    if (!fileData) {
      message.error('File not available');
      return;
    }

    // Determine the file URL based on file type and source
    let fileUrl;
    
    if (typeof fileData === 'string') {
      // Legacy format - just filename
      if (fileData.startsWith('supplier_doc_')) {
        // Use supplier-document route for supplier documents (public access)
        fileUrl = `${process.env.REACT_APP_API_URL || 'http://localhost:5001'}/files/supplier-document/${fileData}`;
      } else {
        const extension = fileData.split('.').pop().toLowerCase();
        if (['png', 'jpg', 'jpeg', 'gif', 'bmp'].includes(extension)) {
          // Use image route for images
          fileUrl = `${process.env.REACT_APP_API_URL || 'http://localhost:5001'}/files/image/${fileData}`;
        } else {
          // Use view route for other files (requires auth)
          fileUrl = `${process.env.REACT_APP_API_URL || 'http://localhost:5001'}/files/view/${fileData}`;
        }
      }
    } else if (fileData.publicId) {
      // New format - file object
      if (fileData.publicId.startsWith('supplier_doc_')) {
        // Use supplier-document route for supplier documents (public access)
        fileUrl = `${process.env.REACT_APP_API_URL || 'http://localhost:5001'}/files/supplier-document/${fileData.publicId}`;
      } else {
        const extension = fileData.publicId.split('.').pop().toLowerCase();
        if (['png', 'jpg', 'jpeg', 'gif', 'bmp'].includes(extension)) {
          // Use image route for images
          fileUrl = `${process.env.REACT_APP_API_URL || 'http://localhost:5001'}/files/image/${fileData.publicId}`;
        } else {
          // Use view route for other files (requires auth)
          fileUrl = `${process.env.REACT_APP_API_URL || 'http://localhost:5001'}/files/view/${fileData.publicId}`;
        }
      }
    } else if (fileData.url) {
      fileUrl = fileData.url;
    }
    
    if (fileUrl) {
      window.open(fileUrl, '_blank');
    } else {
      message.error('No file URL available');
    }
  };

  useEffect(() => {
    fetchSuppliers();
    fetchOnboardingApplications();
    fetchDashboardStats();
  }, [activeTab, pagination.current, pagination.pageSize]);

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.current,
        limit: pagination.pageSize
      };

      // Add status filter based on active tab
      if (activeTab !== 'all' && activeTab !== 'onboarding') {
        switch (activeTab) {
          case 'active':
            params.status = 'approved';
            break;
          case 'pending':
            params.status = 'pending';
            break;
          case 'inactive':
            params.status = 'inactive';
            break;
        }
      }

      const response = await supplierApiService.getAllSuppliers(params);
      
      if (response.success) {
        setSuppliers(response.data);
        setPagination(prev => ({
          ...prev,
          total: response.pagination?.total || response.pagination?.totalRecords || 0
        }));
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      message.error('Failed to fetch suppliers');
    } finally {
      setLoading(false);
    }
  };

  const fetchOnboardingApplications = async () => {
    try {
      const params = {
        page: 1,
        limit: 100 // Get all applications for now
      };

      const response = await supplierApiService.getAllOnboardingApplications(params);
      
      if (response.success) {
        setOnboardingApplications(response.data);
      } else {
        console.error('Failed to fetch onboarding applications:', response.message);
      }
    } catch (error) {
      console.error('Error fetching onboarding applications:', error);
    }
  };

  const fetchDashboardStats = async () => {
    try {
      // Since there's no specific dashboard stats endpoint, we'll calculate from the supplier data
      const response = await supplierApiService.getAllSuppliers({ limit: 1000 }); // Get all for stats
      if (response.success) {
        const allSuppliers = response.data;
        const totalSuppliers = allSuppliers.length;
        const activeSuppliers = allSuppliers.filter(s => s.supplierStatus?.accountStatus === 'approved').length;
        const pendingApproval = allSuppliers.filter(s => s.supplierStatus?.accountStatus === 'pending').length;
        const activeRate = totalSuppliers > 0 ? Math.round((activeSuppliers / totalSuppliers) * 100) : 0;

        setStats({
          totalSuppliers,
          activeSuppliers,
          pendingApproval,
          activeRate
        });
      }
    } catch (error) {
      console.error('Error calculating dashboard stats:', error);
    }
  };

  const handleAddSupplier = () => {
    form.resetFields();
    setSelectedSupplier(null);
    setFileLists({});
    setSupplierModalVisible(true);
  };

  const handleEditSupplier = (supplier) => {
    setSelectedSupplier(supplier);
    form.setFieldsValue({
      fullName: supplier.fullName,
      email: supplier.email,
      companyName: supplier.supplierDetails?.companyName,
      contactName: supplier.supplierDetails?.contactName,
      phoneNumber: supplier.supplierDetails?.phoneNumber,
      address: formatAddress(supplier.supplierDetails?.address),
      supplierType: supplier.supplierDetails?.supplierType,
      businessRegistrationNumber: supplier.supplierDetails?.businessRegistrationNumber,
      taxIdNumber: supplier.supplierDetails?.taxIdNumber
    });
    setSupplierModalVisible(true);
  };

  const handleViewDetails = async (supplier) => {
    try {
      setSelectedSupplier(supplier);
      setDetailDrawerVisible(true);
    } catch (error) {
      message.error('Failed to fetch supplier details');
    }
  };

  const handleSubmitSupplier = async (values) => {
    try {
      setLoading(true);
  
      const formData = new FormData();
      
      Object.keys(values).forEach(key => {
        if (values[key] !== undefined && values[key] !== null) {
          formData.append(key, values[key]);
        }
      });

      Object.keys(fileLists).forEach(key => {
        if (fileLists[key] && fileLists[key].length > 0) {
          fileLists[key].forEach(file => {
            formData.append(key, file.originFileObj);
          });
        }
      });
  
      console.log('Frontend: Submitting supplier data via FormData');
  
      const response = await supplierApiService.submitOnboarding(formData);
  
      if (response.success) {
        message.success('Supplier added successfully! They appear in the suppliers list with "Pending" status.');
        setSupplierModalVisible(false);
        form.resetFields();
        setFileLists({});
        await fetchSuppliers();
        await fetchDashboardStats();
      } else {
        throw new Error(response.message || 'Unknown error occurred');
      }
    } catch (error) {
      console.error('Error saving supplier:', error);
      message.error(error.message || 'Failed to save supplier');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (info, name) => {
    setFileLists(prev => ({ ...prev, [name]: info.fileList }));
  };

  const handleApproveApplication = async (applicationId) => {
    try {
      setLoading(true);
      const response = await supplierApiService.updateApplicationStatus(applicationId, {
        status: 'approved',
        reviewComments: 'Application approved and supplier account created'
      });

      if (response.success) {
        message.success('Application approved successfully! Supplier account has been created.');
        await fetchOnboardingApplications();
        await fetchSuppliers();
        await fetchDashboardStats();
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      console.error('Error approving application:', error);
      message.error('Failed to approve application');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (supplierId, newStatus, reason = '') => {
    try {
      const response = await supplierApiService.updateSupplierStatus(supplierId, {
        status: newStatus,
        comments: reason,
        activateAccount: newStatus === 'approved' // Activate account when approving
      });
      if (response.success) {
        message.success(`Supplier status updated to ${newStatus === 'approved' ? 'Active' : newStatus}`);
        await fetchSuppliers();
        await fetchDashboardStats();
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      console.error('Error updating supplier status:', error);
      message.error('Failed to update supplier status');
    }
  };

  const handleTableChange = (newPagination) => {
    setPagination({
      ...pagination,
      current: newPagination.current,
      pageSize: newPagination.pageSize
    });
  };

  const getStatusTag = (status) => {
    const statusMap = {
      'approved': { color: 'green', text: 'Active' },
      'pending': { color: 'orange', text: 'Pending Approval' },
      'rejected': { color: 'red', text: 'Rejected' },
      'suspended': { color: 'orange', text: 'Suspended' }
    };
    const statusInfo = statusMap[status] || { color: 'default', text: status };
    return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>;
  };

  const getRiskLevelTag = (level) => {
    const levelMap = {
      'Low': 'green',
      'Medium': 'orange',
      'High': 'red'
    };
    return <Tag color={levelMap[level] || 'default'}>{level || 'Not Assessed'}</Tag>;
  };

  const columns = [
    {
      title: 'Supplier ID',
      dataIndex: '_id',
      key: '_id',
      render: (id) => <Text code>{id?.slice(-8)}</Text>, // Show last 8 chars
      width: 100
    },
    {
      title: 'Company Name',
      dataIndex: ['supplierDetails', 'companyName'],
      key: 'companyName',
      ellipsis: true,
      width: 200
    },
    {
      title: 'Contact Person',
      dataIndex: ['supplierDetails', 'contactName'],
      key: 'contactName',
      ellipsis: true,
      width: 150
    },
    {
      title: 'Supplier Type',
      dataIndex: ['supplierDetails', 'supplierType'],
      key: 'supplierType',
      render: (type) => <Tag color="blue">{type}</Tag>,
      width: 130
    },
    {
      title: 'Status',
      dataIndex: ['supplierStatus', 'accountStatus'],
      key: 'status',
      render: (status) => getStatusTag(status),
      width: 120
    },
    {
      title: 'Email Verified',
      dataIndex: ['supplierStatus', 'emailVerified'],
      key: 'emailVerified',
      render: (verified) => (
        <Tag color={verified ? 'green' : 'red'}>
          {verified ? 'Verified' : 'Pending'}
        </Tag>
      ),
      width: 120
    },
    {
      title: 'Registration Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => new Date(date).toLocaleDateString(),
      width: 130
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button 
            size="small" 
            icon={<EyeOutlined />} 
            onClick={() => navigate(`/supply-chain/suppliers/${record._id}/profile`)}
          >
            View Profile
          </Button>
          <Button 
            size="small" 
            icon={<EditOutlined />}
            onClick={() => handleEditSupplier(record)}
          >
            Edit
          </Button>
          {record.supplierStatus?.accountStatus === 'pending' && (
            <Button 
              size="small" 
              type="primary" 
              onClick={() => handleStatusUpdate(record._id, 'approved', 'Approved for supplier network')}
            >
              Approve
            </Button>
          )}
          {record.supplierStatus?.accountStatus === 'approved' && (
            <Button 
              size="small" 
              danger
              onClick={() => handleStatusUpdate(record._id, 'suspended', 'Temporarily suspended')}
            >
              Suspend
            </Button>
          )}
        </Space>
      ),
      width: 200,
      fixed: 'right'
    }
  ];

  const getFilteredSuppliers = () => {
    return suppliers; // Backend handles filtering now
  };

  const getFilteredOnboardingApplications = () => {
    return onboardingApplications;
  };

  const onboardingColumns = [
    {
      title: 'Application ID',
      dataIndex: '_id',
      key: '_id',
      render: (id) => <Text code>{id?.slice(-8)}</Text>,
      width: 100
    },
    {
      title: 'Company Name',
      dataIndex: 'companyName',
      key: 'companyName',
      ellipsis: true,
      width: 200
    },
    {
      title: 'Contact Person',
      dataIndex: 'contactName',
      key: 'contactName',
      ellipsis: true,
      width: 150
    },
    {
      title: 'Supplier Type',
      dataIndex: 'supplierType',
      key: 'supplierType',
      render: (type) => <Tag color="blue">{type}</Tag>,
      width: 130
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const statusMap = {
          'pending_review': { color: 'orange', text: 'Pending Review' },
          'under_review': { color: 'blue', text: 'Under Review' },
          'approved': { color: 'green', text: 'Approved' },
          'rejected': { color: 'red', text: 'Rejected' },
          'clarification_needed': { color: 'purple', text: 'Clarification Needed' }
        };
        const statusInfo = statusMap[status] || { color: 'default', text: status };
        return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>;
      },
      width: 150
    },
    {
      title: 'Documents',
      key: 'documents',
      render: (_, record) => {
        const docCount = Object.values(record.documents || {}).filter(doc => doc).length;
        return (
          <Tag color={docCount > 0 ? 'green' : 'red'}>
            {docCount} uploaded
          </Tag>
        );
      },
      width: 120
    },
    {
      title: 'Submitted Date',
      dataIndex: 'submittedAt',
      key: 'submittedAt',
      render: (date) => new Date(date).toLocaleDateString(),
      width: 130
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button size="small" icon={<EyeOutlined />} onClick={() => handleViewDetails(record)}>
            View
          </Button>
          {record.status === 'pending_review' && (
            <Button 
              size="small" 
              type="primary" 
              onClick={() => handleApproveApplication(record._id)}
            >
              Approve
            </Button>
          )}
        </Space>
      ),
      width: 150,
      fixed: 'right'
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <Title level={2} style={{ margin: 0 }}>
            <TeamOutlined /> Supplier Management
          </Title>
          <Space>
            <Button 
              icon={<ReloadOutlined />} 
              onClick={fetchSuppliers}
              loading={loading}
            >
              Refresh
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAddSupplier}>
              Add New Supplier
            </Button>
          </Space>
        </div>

        {/* Statistics */}
        <Row gutter={16} style={{ marginBottom: '24px' }}>
          <Col span={6}>
            <Statistic
              title="Total Suppliers"
              value={stats.totalSuppliers || 0}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="Active Suppliers"
              value={stats.activeSuppliers || 0}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="Pending Approval"
              value={stats.pendingApproval || 0}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="Active Rate"
              value={stats.activeRate || 0}
              suffix="%"
              prefix={<TruckOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Col>
        </Row>

        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab="All Suppliers" key="all">
            <Table
              columns={columns}
              dataSource={getFilteredSuppliers()}
              rowKey="_id"
              loading={loading}
              pagination={{
                ...pagination,
                showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} suppliers`
              }}
              onChange={handleTableChange}
              scroll={{ x: 'max-content' }}
            />
          </TabPane>

          <TabPane tab="Onboarding Applications" key="onboarding">
            <Table
              columns={onboardingColumns}
              dataSource={getFilteredOnboardingApplications()}
              rowKey="_id"
              loading={loading}
              pagination={{
                current: 1,
                pageSize: 10,
                total: onboardingApplications.length,
                showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} applications`
              }}
              scroll={{ x: 'max-content' }}
            />
          </TabPane>

          <TabPane tab="Active" key="active">
            <Table
              columns={columns}
              dataSource={getFilteredSuppliers()}
              rowKey="_id"
              loading={loading}
              pagination={{
                ...pagination,
                showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} suppliers`
              }}
              onChange={handleTableChange}
              scroll={{ x: 'max-content' }}
            />
          </TabPane>

          <TabPane tab="Pending Approval" key="pending">
            <Table
              columns={columns}
              dataSource={getFilteredSuppliers()}
              rowKey="_id"
              loading={loading}
              pagination={{
                ...pagination,
                showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} suppliers`
              }}
              onChange={handleTableChange}
              scroll={{ x: 'max-content' }}
            />
          </TabPane>
        </Tabs>
      </Card>

      <Modal
        title={selectedSupplier ? "Edit Supplier" : "Add New Supplier"}
        open={supplierModalVisible}
        onCancel={() => {
          setSupplierModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        width={900}
      >
        <Alert 
          message="Add New Supplier" 
          description="Fill out the supplier information below. Uploaded documents will be reviewed by administrators. The supplier will appear in the list with 'Pending' status until approved."
          type="info" 
          showIcon 
          style={{ marginBottom: 16 }}
        />
        <Spin spinning={loading}>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmitSupplier}
          >
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="companyName"
                  label="Company Name"
                  rules={[{ required: true, message: 'Please enter company name' }]}
                >
                  <Input placeholder="TechSolutions Cameroon" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="supplierType"
                  label="Supplier Type"
                  rules={[{ required: true, message: 'Please select supplier type' }]}
                >
                  <Select placeholder="Select supplier type">
                    <Option value="General">General</Option>
                    <Option value="Supply Chain">Supply Chain</Option>
                    <Option value="HR/Admin">HR/Admin</Option>
                    <Option value="Operations">Operations</Option>
                    <Option value="HSE">HSE</Option>
                    <Option value="Refurbishment">Refurbishment</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={8}>
                <Form.Item
                  name="contactName"
                  label="Contact Person"
                  rules={[{ required: true, message: 'Please enter contact person' }]}
                >
                  <Input placeholder="Jean Baptiste" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="email"
                  label="Email"
                  rules={[
                    { required: true, message: 'Please enter email' },
                    { type: 'email', message: 'Please enter valid email' }
                  ]}
                >
                  <Input placeholder="contact@supplier.cm" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="phoneNumber"
                  label="Phone"
                  rules={[{ required: true, message: 'Please enter phone number' }]}
                >
                  <Input placeholder="+237 677 123 456" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="fullName"
                  label="Full Name (Account Holder)"
                  rules={[{ required: true, message: 'Please enter full name' }]}
                >
                  <Input placeholder="Jean Baptiste Mballa" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item 
                  name="password" 
                  label="Password (for new suppliers)"
                  rules={!selectedSupplier ? [{ required: true, message: 'Password required for new suppliers' }] : []}
                >
                  <Input.Password placeholder="Enter temporary password" />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="address"
              label="Address"
              rules={[{ required: true, message: 'Please enter address' }]}
            >
              <TextArea rows={2} placeholder="Complete business address" />
            </Form.Item>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="businessRegistrationNumber" label="Business Registration Number">
                  <Input placeholder="RC/YAE/2023/A/123" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="taxIdNumber" label="Tax ID Number">
                  <Input placeholder="M051234567890J" />
                </Form.Item>
              </Col>
            </Row>

            <Title level={4}>Required Documents</Title>

            <Row gutter={16}>
                <Col span={12}>
                    <Form.Item label="Business Registration Certificate">
                        <Upload
                            name="businessRegistrationCertificate"
                            fileList={fileLists.businessRegistrationCertificate}
                            onChange={(info) => handleFileChange(info, 'businessRegistrationCertificate')}
                            beforeUpload={() => false}
                        >
                            <Button icon={<UploadOutlined />}>Click to Upload</Button>
                        </Upload>
                    </Form.Item>
                </Col>
                <Col span={12}>
                    <Form.Item label="Tax Clearance Certificate">
                        <Upload
                            name="taxClearanceCertificate"
                            fileList={fileLists.taxClearanceCertificate}
                            onChange={(info) => handleFileChange(info, 'taxClearanceCertificate')}
                            beforeUpload={() => false}
                        >
                            <Button icon={<UploadOutlined />}>Click to Upload</Button>
                        </Upload>
                    </Form.Item>
                </Col>
            </Row>
            <Row gutter={16}>
                <Col span={12}>
                    <Form.Item label="Bank Statement (last 6 months)">
                        <Upload
                            name="bankStatement"
                            fileList={fileLists.bankStatement}
                            onChange={(info) => handleFileChange(info, 'bankStatement')}
                            beforeUpload={() => false}
                        >
                            <Button icon={<UploadOutlined />}>Click to Upload</Button>
                        </Upload>
                    </Form.Item>
                </Col>
                <Col span={12}>
                    <Form.Item label="Insurance Certificate">
                        <Upload
                            name="insuranceCertificate"
                            fileList={fileLists.insuranceCertificate}
                            onChange={(info) => handleFileChange(info, 'insuranceCertificate')}
                            beforeUpload={() => false}
                        >
                            <Button icon={<UploadOutlined />}>Click to Upload</Button>
                        </Upload>
                    </Form.Item>
                </Col>
            </Row>
            <Row gutter={16}>
                <Col span={24}>
                    <Form.Item label="Additional Documents">
                        <Upload
                            name="additionalDocuments"
                            fileList={fileLists.additionalDocuments}
                            onChange={(info) => handleFileChange(info, 'additionalDocuments')}
                            beforeUpload={() => false}
                            multiple
                        >
                            <Button icon={<UploadOutlined />}>Click to Upload</Button>
                        </Upload>
                    </Form.Item>
                </Col>
            </Row>

            <div style={{ textAlign: 'right' }}>
              <Space>
                <Button onClick={() => setSupplierModalVisible(false)}>
                  Cancel
                </Button>
                <Button type="primary" htmlType="submit" loading={loading}>
                  {selectedSupplier ? 'Update Supplier' : 'Add Supplier'}
                </Button>
              </Space>
            </div>
          </Form>
        </Spin>
      </Modal>

      {/* Supplier Detail Drawer */}
      <Drawer
        title={
          <Space>
            <TeamOutlined />
            Supplier Details
          </Space>
        }
        placement="right"
        width={900}
        open={detailDrawerVisible}
        onClose={() => {
          setDetailDrawerVisible(false);
          setSelectedSupplier(null);
        }}
      >
        {selectedSupplier && (
          <div>
            {/* Basic Information */}
            <Card size="small" title="Supplier Information" style={{ marginBottom: '16px' }}>
              <Descriptions column={2} size="small">
                <Descriptions.Item label="Supplier ID">
                  <Text code>{selectedSupplier._id}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Status">
                  {getStatusTag(selectedSupplier.supplierStatus?.accountStatus)}
                </Descriptions.Item>
                <Descriptions.Item label="Company Name">
                  {selectedSupplier.supplierDetails?.companyName}
                </Descriptions.Item>
                <Descriptions.Item label="Supplier Type">
                  <Tag color="blue">{selectedSupplier.supplierDetails?.supplierType}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Contact Person">
                  {selectedSupplier.supplierDetails?.contactName}
                </Descriptions.Item>
                <Descriptions.Item label="Email Verified">
                  <Tag color={selectedSupplier.supplierStatus?.emailVerified ? 'green' : 'red'}>
                    {selectedSupplier.supplierStatus?.emailVerified ? 'Yes' : 'No'}
                  </Tag>
                </Descriptions.Item>
              </Descriptions>
            </Card>

            {/* Contact Information */}
            <Card size="small" title="Contact Information" style={{ marginBottom: '16px' }}>
              <Descriptions column={1} size="small">
                <Descriptions.Item label="Email">
                  <MailOutlined /> {selectedSupplier.email}
                </Descriptions.Item>
                <Descriptions.Item label="Phone">
                  <PhoneOutlined /> {selectedSupplier.supplierDetails?.phoneNumber}
                </Descriptions.Item>
                <Descriptions.Item label="Address">
                  {formatAddress(selectedSupplier.supplierDetails?.address)}
                </Descriptions.Item>
              </Descriptions>
            </Card>

            {/* Business Information */}
            <Card size="small" title="Business Information" style={{ marginBottom: '16px' }}>
              <Descriptions column={2} size="small">
                <Descriptions.Item label="Business Registration">
                  {selectedSupplier.supplierDetails?.businessRegistrationNumber || 'Not provided'}
                </Descriptions.Item>
                <Descriptions.Item label="Tax ID">
                  {selectedSupplier.supplierDetails?.taxIdNumber || 'Not provided'}
                </Descriptions.Item>
                <Descriptions.Item label="Registration Date">
                  {new Date(selectedSupplier.createdAt).toLocaleDateString()}
                </Descriptions.Item>
                <Descriptions.Item label="Last Login">
                  {selectedSupplier.lastLogin ? new Date(selectedSupplier.lastLogin).toLocaleDateString() : 'Never'}
                </Descriptions.Item>
              </Descriptions>
            </Card>

            {/* Documents Section */}
            {selectedSupplier.supplierDetails?.documents && (
              <Card size="small" title="Submitted Documents" style={{ marginBottom: '16px' }}>
                <Row gutter={[16, 16]}>
                  {selectedSupplier.supplierDetails.documents.businessRegistrationCertificate && (
                    <Col span={12}>
                      <Card size="small" style={{ textAlign: 'center' }}>
                        <h4>Business Registration Certificate</h4>
                        <Button 
                          type="primary" 
                          icon={<EyeOutlined />}
                          style={{ marginRight: '8px' }}
                          onClick={() => viewFile(selectedSupplier.supplierDetails.documents.businessRegistrationCertificate)}
                        >
                          View
                        </Button>
                        <Button 
                          icon={<DownloadOutlined />}
                          onClick={() => downloadFile(selectedSupplier.supplierDetails.documents.businessRegistrationCertificate, 'business-registration-certificate')}
                        >
                          Download
                        </Button>
                      </Card>
                    </Col>
                  )}
                  {selectedSupplier.supplierDetails.documents.taxClearanceCertificate && (
                    <Col span={12}>
                      <Card size="small" style={{ textAlign: 'center' }}>
                        <h4>Tax Clearance Certificate</h4>
                        <Button 
                          type="primary" 
                          icon={<EyeOutlined />}
                          style={{ marginRight: '8px' }}
                          onClick={() => viewFile(selectedSupplier.supplierDetails.documents.taxClearanceCertificate)}
                        >
                          View
                        </Button>
                        <Button 
                          icon={<DownloadOutlined />}
                          onClick={() => downloadFile(selectedSupplier.supplierDetails.documents.taxClearanceCertificate, 'tax-clearance-certificate')}
                        >
                          Download
                        </Button>
                      </Card>
                    </Col>
                  )}
                  {selectedSupplier.supplierDetails.documents.bankStatement && (
                    <Col span={12}>
                      <Card size="small" style={{ textAlign: 'center' }}>
                        <h4>Bank Statement</h4>
                        <Button 
                          type="primary" 
                          icon={<EyeOutlined />}
                          style={{ marginRight: '8px' }}
                          onClick={() => viewFile(selectedSupplier.supplierDetails.documents.bankStatement)}
                        >
                          View
                        </Button>
                        <Button 
                          icon={<DownloadOutlined />}
                          onClick={() => downloadFile(selectedSupplier.supplierDetails.documents.bankStatement, 'bank-statement')}
                        >
                          Download
                        </Button>
                      </Card>
                    </Col>
                  )}
                  {selectedSupplier.supplierDetails.documents.insuranceCertificate && (
                    <Col span={12}>
                      <Card size="small" style={{ textAlign: 'center' }}>
                        <h4>Insurance Certificate</h4>
                        <Button 
                          type="primary" 
                          icon={<EyeOutlined />}
                          style={{ marginRight: '8px' }}
                          onClick={() => viewFile(selectedSupplier.supplierDetails.documents.insuranceCertificate)}
                        >
                          View
                        </Button>
                        <Button 
                          icon={<DownloadOutlined />}
                          onClick={() => downloadFile(selectedSupplier.supplierDetails.documents.insuranceCertificate, 'insurance-certificate')}
                        >
                          Download
                        </Button>
                      </Card>
                    </Col>
                  )}
                  {selectedSupplier.supplierDetails.documents.additionalDocuments && selectedSupplier.supplierDetails.documents.additionalDocuments.length > 0 && (
                    <Col span={24}>
                      <Card size="small" style={{ textAlign: 'center' }}>
                        <h4>Additional Documents</h4>
                        <Space wrap>
                          {selectedSupplier.supplierDetails.documents.additionalDocuments.map((doc, index) => (
                            <Space key={index} direction="vertical" style={{ marginBottom: '8px' }}>
                              <Button 
                                type="primary" 
                                icon={<EyeOutlined />}
                                onClick={() => viewFile(doc)}
                                style={{ marginRight: '8px' }}
                              >
                                View Doc {index + 1}
                              </Button>
                              <Button 
                                icon={<DownloadOutlined />}
                                onClick={() => downloadFile(doc, `additional-document-${index + 1}`)}
                              >
                                Download
                              </Button>
                            </Space>
                          ))}
                        </Space>
                      </Card>
                    </Col>
                  )}
                  {!selectedSupplier.supplierDetails.documents.businessRegistrationCertificate && 
                   !selectedSupplier.supplierDetails.documents.taxClearanceCertificate && 
                   !selectedSupplier.supplierDetails.documents.bankStatement && 
                   !selectedSupplier.supplierDetails.documents.insuranceCertificate && 
                   (!selectedSupplier.supplierDetails.documents.additionalDocuments || selectedSupplier.supplierDetails.documents.additionalDocuments.length === 0) && (
                    <Col span={24}>
                      <Alert 
                        message="No documents uploaded" 
                        description="This supplier has not uploaded any documents yet." 
                        type="info" 
                        showIcon 
                      />
                    </Col>
                  )}
                </Row>
              </Card>
            )}

            {/* Action Buttons */}
            <Card size="small" title="Actions">
              <Space wrap>
                <Button 
                  type="primary" 
                  icon={<EditOutlined />}
                  onClick={() => {
                    setDetailDrawerVisible(false);
                    handleEditSupplier(selectedSupplier);
                  }}
                >
                  Edit Supplier
                </Button>
                
                {selectedSupplier.supplierStatus?.accountStatus === 'pending' && (
                  <Button 
                    type="primary"
                    style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
                    onClick={() => handleStatusUpdate(selectedSupplier._id, 'approved', 'Approved for supplier network')}
                  >
                    Approve Supplier
                  </Button>
                )}
                
                {selectedSupplier.supplierStatus?.accountStatus === 'approved' && (
                  <Button 
                    danger
                    onClick={() => handleStatusUpdate(selectedSupplier._id, 'suspended', 'Temporarily suspended')}
                  >
                    Suspend Supplier
                  </Button>
                )}
              </Space>
            </Card>
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default SupplyChainVendorManagement;