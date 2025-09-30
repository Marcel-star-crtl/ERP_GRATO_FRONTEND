import React, { useState, useEffect } from 'react';
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
  Upload,
  Steps,
  Alert,
  Tabs,
  Drawer,
  message,
  Descriptions,
  Timeline,
  Checkbox,
  DatePicker,
  Progress,
  List,
  Avatar,
  Badge,
  Spin,
  notification
} from 'antd';
import {
  UserAddOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  FileTextOutlined,
  UploadOutlined,
  SendOutlined,
  TeamOutlined,
  BankOutlined,
  SafetyCertificateOutlined,
  GlobalOutlined,
  PhoneOutlined,
  MailOutlined,
  EditOutlined,
  DeleteOutlined,
  DownloadOutlined,
  ReloadOutlined,
  FileAddOutlined,
  InboxOutlined,
  UserOutlined,
  ShopOutlined
} from '@ant-design/icons';
import moment from 'moment';
import supplierApiService from '../../services/supplierAPI'; 

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const { TabPane } = Tabs;
const { Step } = Steps;
const { Dragger } = Upload;

const SupplyChainSupplierOnboarding = () => {
  const [loading, setLoading] = useState(false);
  const [applications, setApplications] = useState([]);
  const [onboardedSuppliers, setOnboardedSuppliers] = useState([]);
  const [combinedData, setCombinedData] = useState([]);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [onboardingModalVisible, setOnboardingModalVisible] = useState(false);
  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [bulkActionModalVisible, setBulkActionModalVisible] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [form] = Form.useForm();
  const [reviewForm] = Form.useForm();
  const [bulkForm] = Form.useForm();
  const [activeTab, setActiveTab] = useState('pending');
  const [currentStep, setCurrentStep] = useState(0);
  const [uploadedDocuments, setUploadedDocuments] = useState({});
  const [statistics, setStatistics] = useState({});

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchOnboardingApplications(),
        fetchOnboardedSuppliers(),
        fetchStatistics()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOnboardingApplications = async () => {
    try {
      const response = await supplierApiService.getAllOnboardingApplications();
      if (response.success) {
        setApplications(response.data || []);
        return response.data || [];
      }
    } catch (error) {
      console.error('Error fetching onboarding applications:', error);
      // If onboarding endpoint doesn't exist, return empty array
      setApplications([]);
      return [];
    }
  };

  const fetchOnboardedSuppliers = async () => {
    try {
      const response = await supplierApiService.getAllSuppliers({ limit: 1000 });
      if (response.success) {
        // Transform existing suppliers to match application structure for display
        const transformedSuppliers = response.data.map(supplier => ({
          id: supplier._id,
          type: 'existing_supplier', // Flag to identify existing suppliers
          companyName: supplier.supplierDetails?.companyName || 'N/A',
          contactPerson: supplier.supplierDetails?.contactName || supplier.fullName,
          email: supplier.email,
          phone: supplier.supplierDetails?.phoneNumber || 'N/A',
          address: supplier.supplierDetails?.address || 'N/A',
          category: supplier.supplierDetails?.supplierType || 'Unknown',
          status: supplier.supplierStatus?.accountStatus === 'approved' ? 'onboarded' : 'pending_activation',
          priority: 'Medium',
          completionPercentage: 100,
          submissionDate: supplier.createdAt,
          lastUpdated: supplier.updatedAt,
          businessType: 'Existing',
          taxId: supplier.supplierDetails?.taxIdNumber || 'N/A',
          businessLicense: supplier.supplierDetails?.businessRegistrationNumber || 'N/A',
          website: supplier.supplierDetails?.website || '',
          services: [],
          yearsInBusiness: 'N/A',
          estimatedAnnualRevenue: 0,
          emailVerified: supplier.supplierStatus?.emailVerified || false,
          accountStatus: supplier.supplierStatus?.accountStatus || 'pending',
          isActive: supplier.isActive || false,
          lastLogin: supplier.lastLogin
        }));
        setOnboardedSuppliers(transformedSuppliers);
        return transformedSuppliers;
      }
    } catch (error) {
      console.error('Error fetching onboarded suppliers:', error);
      setOnboardedSuppliers([]);
      return [];
    }
  };

  const fetchStatistics = async () => {
    try {
      // Try to get onboarding statistics if endpoint exists
      const response = await supplierApiService.getOnboardingStatistics();
      if (response.success) {
        setStatistics(response.data);
        return;
      }
    } catch (error) {
      console.log('Onboarding statistics endpoint not available, calculating from data');
    }
    
    // Fallback: calculate statistics from available data
    calculateStatisticsFromData();
  };

  const calculateStatisticsFromData = () => {
    const allApplications = [...applications];
    const allSuppliers = [...onboardedSuppliers];
    
    const stats = {
      totalApplications: allApplications.length,
      pendingReview: allApplications.filter(app => app.status === 'pending_review').length,
      underReview: allApplications.filter(app => app.status === 'under_review').length,
      approved: allApplications.filter(app => app.status === 'approved').length,
      rejected: allApplications.filter(app => app.status === 'rejected').length,
      onboarded: allSuppliers.filter(sup => sup.status === 'onboarded').length,
      totalSuppliers: allSuppliers.length,
      activeSuppliers: allSuppliers.filter(sup => sup.isActive).length
    };
    
    setStatistics(stats);
  };

  // Combine applications and existing suppliers based on active tab
  useEffect(() => {
    const combineData = () => {
      switch (activeTab) {
        case 'all':
          setCombinedData([...applications, ...onboardedSuppliers]);
          break;
        case 'pending':
          setCombinedData([
            ...applications.filter(app => app.status === 'pending_review'),
            ...onboardedSuppliers.filter(sup => sup.status === 'pending_activation')
          ]);
          break;
        case 'under_review':
          setCombinedData(applications.filter(app => app.status === 'under_review'));
          break;
        case 'approved':
          setCombinedData(applications.filter(app => ['approved', 'onboarded'].includes(app.status)));
          break;
        case 'onboarded':
          setCombinedData(onboardedSuppliers.filter(sup => sup.status === 'onboarded'));
          break;
        case 'rejected':
          setCombinedData(applications.filter(app => app.status === 'rejected'));
          break;
        default:
          setCombinedData([...applications, ...onboardedSuppliers]);
      }
    };

    combineData();
  }, [applications, onboardedSuppliers, activeTab]);

  const getStatusTag = (status, isExistingSupplier = false) => {
    if (isExistingSupplier) {
      const statusMap = {
        'onboarded': { color: 'purple', text: 'Onboarded', icon: <CheckCircleOutlined /> },
        'pending_activation': { color: 'orange', text: 'Pending Activation', icon: <ClockCircleOutlined /> }
      };
      const statusInfo = statusMap[status] || { color: 'default', text: status };
      return (
        <Tag color={statusInfo.color} icon={statusInfo.icon}>
          {statusInfo.text}
        </Tag>
      );
    }

    const statusMap = {
      'draft': { color: 'default', text: 'Draft', icon: <EditOutlined /> },
      'pending_review': { color: 'orange', text: 'Pending Review', icon: <ClockCircleOutlined /> },
      'under_review': { color: 'blue', text: 'Under Review', icon: <EyeOutlined /> },
      'approved': { color: 'green', text: 'Approved', icon: <CheckCircleOutlined /> },
      'rejected': { color: 'red', text: 'Rejected', icon: <ExclamationCircleOutlined /> },
      'onboarded': { color: 'purple', text: 'Onboarded', icon: <CheckCircleOutlined /> },
      'requires_clarification': { color: 'gold', text: 'Requires Clarification', icon: <ExclamationCircleOutlined /> }
    };

    const statusInfo = statusMap[status] || { color: 'default', text: status };
    return (
      <Tag color={statusInfo.color} icon={statusInfo.icon}>
        {statusInfo.text}
      </Tag>
    );
  };

  const getPriorityTag = (priority) => {
    const priorityMap = {
      'Low': 'green',
      'Medium': 'orange',
      'High': 'red'
    };
    return <Tag color={priorityMap[priority]}>{priority}</Tag>;
  };

  const handleStartOnboarding = () => {
    form.resetFields();
    setSelectedApplication(null);
    setCurrentStep(0);
    setUploadedDocuments({});
    setOnboardingModalVisible(true);
  };

  const handleViewDetails = async (application) => {
    try {
      if (application.type === 'existing_supplier') {
        // For existing suppliers, use the supplier data directly
        setSelectedApplication(application);
        setDetailDrawerVisible(true);
      } else {
        // For onboarding applications, try to fetch full details
        try {
          const response = await supplierApiService.getOnboardingApplicationById(application.id);
          if (response.success) {
            setSelectedApplication(response.data);
          } else {
            setSelectedApplication(application);
          }
        } catch (error) {
          setSelectedApplication(application);
        }
        setDetailDrawerVisible(true);
      }
    } catch (error) {
      message.error('Failed to load details');
    }
  };

  const handleReviewApplication = (application) => {
    if (application.type === 'existing_supplier') {
      message.info('This is an existing supplier. Use the supplier management page to modify their status.');
      return;
    }
    
    setSelectedApplication(application);
    reviewForm.resetFields();
    setReviewModalVisible(true);
  };

  const handleSubmitReview = async (values) => {
    try {
      setLoading(true);
      const response = await supplierApiService.updateApplicationStatus(
        selectedApplication.id,
        {
          status: values.decision,
          reviewComments: values.reviewComments,
          reviewedBy: 'current_user_id' // Replace with actual user ID from context
        }
      );

      if (response.success) {
        notification.success({
          message: 'Review Submitted',
          description: `Application ${values.decision} successfully!`,
        });
        
        setReviewModalVisible(false);
        reviewForm.resetFields();
        await fetchAllData();

        // If approved, create supplier account
        if (values.decision === 'approved') {
          await handleCreateSupplierAccount(selectedApplication);
        }
      }
    } catch (error) {
      message.error('Failed to submit review');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSupplierAccount = async (application) => {
    try {
      const supplierData = {
        fullName: application.contactPerson,
        email: application.email,
        password: `Temp${Date.now()}!`, // Generate temporary password
        companyName: application.companyName,
        contactName: application.contactPerson,
        phoneNumber: application.phone,
        address: application.address,
        supplierType: application.category || 'general',
        businessRegistrationNumber: application.businessLicense,
        taxIdNumber: application.taxId,
        bankDetails: application.bankDetails || {},
        businessInfo: {
          businessType: application.businessType,
          yearsInBusiness: application.yearsInBusiness,
          estimatedAnnualRevenue: application.estimatedAnnualRevenue,
          services: application.services || []
        },
        contractInfo: {}
      };

      await supplierApiService.register(supplierData);
      
      notification.success({
        message: 'Supplier Account Created',
        description: `Supplier account created successfully for ${application.companyName}. They will receive login credentials via email.`,
        duration: 6
      });
    } catch (error) {
      console.error('Error creating supplier account:', error);
      notification.error({
        message: 'Account Creation Failed',
        description: 'Application was approved but failed to create supplier account. Please contact IT support.',
        duration: 8
      });
    }
  };

  const handleDocumentUpload = (docType, fileList) => {
    setUploadedDocuments(prev => ({
      ...prev,
      [docType]: fileList
    }));
  };

  const handleSubmitOnboarding = async (values) => {
    try {
      setLoading(true);
      
      // Validate all required documents are uploaded
      const requiredDocs = ['businessRegistration', 'taxClearance', 'bankStatement'];
      const missingDocs = requiredDocs.filter(doc => !uploadedDocuments[doc] || uploadedDocuments[doc].length === 0);
      
      if (missingDocs.length > 0) {
        message.error(`Please upload all required documents: ${missingDocs.join(', ')}`);
        return;
      }

      const applicationData = {
        ...values,
        applicationId: `SOB${Date.now()}`,
        status: 'pending_review',
        submissionDate: new Date().toISOString(),
        completionPercentage: 100
      };

      const response = await supplierApiService.submitOnboardingApplication(
        applicationData, 
        uploadedDocuments
      );

      if (response.success) {
        notification.success({
          message: 'Application Submitted Successfully!',
          description: `Your supplier onboarding application has been submitted with ID: ${response.data.applicationId}. You will receive an email confirmation and status updates.`,
          duration: 6
        });
        
        setOnboardingModalVisible(false);
        form.resetFields();
        setCurrentStep(0);
        setUploadedDocuments({});
        await fetchAllData();
      }
    } catch (error) {
      console.error('Error submitting application:', error);
      message.error('Failed to submit application. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkAction = async (values) => {
    try {
      setLoading(true);
      const response = await supplierApiService.bulkUpdateApplications({
        applicationIds: selectedRowKeys,
        action: values.action,
        comments: values.comments
      });

      if (response.success) {
        message.success(`Bulk action completed for ${selectedRowKeys.length} applications`);
        setBulkActionModalVisible(false);
        setSelectedRowKeys([]);
        await fetchAllData();
      }
    } catch (error) {
      message.error('Failed to perform bulk action');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadDocument = async (applicationId, documentId) => {
    try {
      const blob = await supplierApiService.downloadDocument(applicationId, documentId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `document-${documentId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      message.error('Failed to download document');
    }
  };

  const handleExportApplications = async () => {
    try {
      const blob = await supplierApiService.exportApplications({ status: activeTab });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `supplier-applications-${activeTab}-${moment().format('YYYY-MM-DD')}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      message.error('Failed to export applications');
    }
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      render: (id, record) => (
        <div>
          <Text code>{record.type === 'existing_supplier' ? id.slice(-8) : id}</Text>
          {record.type === 'existing_supplier' && (
            <Tag size="small" color="purple" style={{ display: 'block', marginTop: 2 }}>
              <ShopOutlined /> Existing
            </Tag>
          )}
        </div>
      ),
      width: 140
    },
    {
      title: 'Company Details',
      key: 'company',
      render: (_, record) => (
        <div>
          <Text strong>{record.companyName}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: '12px' }}>
            <UserOutlined /> {record.contactPerson}
          </Text>
          <br />
          <Tag size="small" color="blue">{record.category}</Tag>
          {record.emailVerified && <Tag size="small" color="green">Email Verified</Tag>}
          {record.isActive && <Tag size="small" color="green">Active</Tag>}
        </div>
      ),
      width: 200
    },
    {
      title: 'Contact Info',
      key: 'contact',
      render: (_, record) => (
        <div>
          <div><MailOutlined /> {record.email}</div>
          <div><PhoneOutlined /> {record.phone}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {record.address?.length > 50 ? `${record.address.substring(0, 50)}...` : record.address}
          </div>
        </div>
      ),
      width: 180
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status, record) => getStatusTag(status, record.type === 'existing_supplier'),
      width: 140
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority) => getPriorityTag(priority),
      width: 90
    },
    {
      title: 'Completion',
      dataIndex: 'completionPercentage',
      key: 'completionPercentage',
      render: (percentage) => (
        <div style={{ width: 100 }}>
          <Progress percent={percentage || 0} size="small" />
        </div>
      ),
      width: 120
    },
    {
      title: 'Date',
      key: 'date',
      render: (_, record) => (
        <div>
          <div style={{ fontSize: '12px' }}>
            <strong>Submitted:</strong> {record.submissionDate ? new Date(record.submissionDate).toLocaleDateString('en-GB') : '-'}
          </div>
          {record.lastLogin && (
            <div style={{ fontSize: '12px', color: '#666' }}>
              <strong>Last Login:</strong> {new Date(record.lastLogin).toLocaleDateString('en-GB')}
            </div>
          )}
        </div>
      ),
      width: 120
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button 
            size="small" 
            icon={<EyeOutlined />} 
            onClick={() => handleViewDetails(record)}
          >
            View
          </Button>
          {record.type !== 'existing_supplier' && ['pending_review', 'under_review'].includes(record.status) && (
            <Button 
              size="small" 
              type="primary"
              onClick={() => handleReviewApplication(record)}
            >
              Review
            </Button>
          )}
          {record.type === 'existing_supplier' && (
            <Button 
              size="small" 
              icon={<EditOutlined />}
            >
              Manage
            </Button>
          )}
        </Space>
      ),
      width: 140,
      fixed: 'right'
    }
  ];

  const getFilteredData = () => {
    return combinedData;
  };

  const stats = {
    total: combinedData.length,
    applications: applications.length,
    onboardedSuppliers: onboardedSuppliers.length,
    pending: combinedData.filter(item => 
      item.status === 'pending_review' || item.status === 'pending_activation'
    ).length,
    underReview: combinedData.filter(item => item.status === 'under_review').length,
    approved: combinedData.filter(item => 
      ['approved', 'onboarded'].includes(item.status)
    ).length,
    rejected: combinedData.filter(item => item.status === 'rejected').length,
    active: onboardedSuppliers.filter(sup => sup.isActive).length
  };

  // [Previous onboarding form steps and render functions remain the same...]
  const onboardingSteps = [
    { title: 'Company Info', description: 'Basic company information' },
    { title: 'Contact Details', description: 'Contact and location details' },
    { title: 'Business Info', description: 'Business type and services' },
    { title: 'Documents', description: 'Required documentation' },
    { title: 'Compliance', description: 'Compliance declarations' }
  ];

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="companyName"
                  label="Company Name"
                  rules={[{ required: true, message: 'Please enter company name' }]}
                >
                  <Input placeholder="Digital Solutions Cameroon" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="businessType"
                  label="Business Type"
                  rules={[{ required: true, message: 'Please select business type' }]}
                >
                  <Select placeholder="Select business type">
                    <Option value="Corporation">Corporation</Option>
                    <Option value="Limited Company">Limited Company</Option>
                    <Option value="Partnership">Partnership</Option>
                    <Option value="Sole Proprietorship">Sole Proprietorship</Option>
                    <Option value="Cooperative">Cooperative</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item
                  name="taxId"
                  label="Tax ID"
                  rules={[{ required: true, message: 'Please enter tax ID' }]}
                >
                  <Input placeholder="M0123456789" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="businessLicense"
                  label="Business License"
                  rules={[{ required: true, message: 'Please enter business license number' }]}
                >
                  <Input placeholder="BL2024001" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="yearsInBusiness"
                  label="Years in Business"
                  rules={[{ required: true, message: 'Please enter years in business' }]}
                >
                  <Input type="number" placeholder="8" />
                </Form.Item>
              </Col>
            </Row>
          </>
        );
      case 1:
        return (
          <>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="contactPerson"
                  label="Contact Person"
                  rules={[{ required: true, message: 'Please enter contact person name' }]}
                >
                  <Input placeholder="Michel Fotso" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="email"
                  label="Email Address"
                  rules={[
                    { required: true, message: 'Please enter email address' },
                    { type: 'email', message: 'Please enter valid email' }
                  ]}
                >
                  <Input placeholder="contact@company.cm" />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="phone"
                  label="Phone Number"
                  rules={[{ required: true, message: 'Please enter phone number' }]}
                >
                  <Input placeholder="+237 677 334 556" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="website"
                  label="Website"
                >
                  <Input placeholder="www.company.cm" />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item
              name="address"
              label="Business Address"
              rules={[{ required: true, message: 'Please enter business address' }]}
            >
              <TextArea rows={2} placeholder="Complete business address" />
            </Form.Item>
          </>
        );
      case 2:
        return (
          <>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="category"
                  label="Business Category"
                  rules={[{ required: true, message: 'Please select business category' }]}
                >
                  <Select placeholder="Select category">
                    <Option value="IT Services">IT Services</Option>
                    <Option value="Construction">Construction</Option>
                    <Option value="Manufacturing">Manufacturing</Option>
                    <Option value="Energy & Environment">Energy & Environment</Option>
                    <Option value="Transportation">Transportation</Option>
                    <Option value="Professional Services">Professional Services</Option>
                    <Option value="Healthcare">Healthcare</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="estimatedAnnualRevenue"
                  label="Estimated Annual Revenue (XAF)"
                  rules={[{ required: true, message: 'Please enter estimated annual revenue' }]}
                >
                  <Input type="number" placeholder="250000000" />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item
              name="services"
              label="Services/Products Offered"
              rules={[{ required: true, message: 'Please select services/products' }]}
            >
              <Select mode="tags" placeholder="Add services/products">
                <Option value="Software Development">Software Development</Option>
                <Option value="IT Consulting">IT Consulting</Option>
                <Option value="System Integration">System Integration</Option>
                <Option value="Hardware Supply">Hardware Supply</Option>
                <Option value="Maintenance Services">Maintenance Services</Option>
              </Select>
            </Form.Item>
            <Form.Item
              name="businessDescription"
              label="Business Description"
              rules={[{ required: true, message: 'Please provide business description' }]}
            >
              <TextArea rows={4} placeholder="Describe your business activities, capabilities, and experience" />
            </Form.Item>
          </>
        );
      case 3:
        return (
          <div>
            <Alert
              message="Required Documents"
              description="Please upload the following required documents. All documents must be current and valid."
              type="info"
              showIcon
              style={{ marginBottom: '16px' }}
            />
            
            {/* Business Registration */}
            <Card size="small" style={{ marginBottom: '16px' }}>
              <Text strong>Business Registration Certificate *</Text>
              <Dragger
                accept=".pdf,.doc,.docx,.jpg,.png"
                multiple={false}
                fileList={uploadedDocuments.businessRegistration || []}
                onChange={({ fileList }) => handleDocumentUpload('businessRegistration', fileList)}
                beforeUpload={() => false}
              >
                <p className="ant-upload-drag-icon">
                  <InboxOutlined />
                </p>
                <p className="ant-upload-text">Click or drag file to this area to upload</p>
                <p className="ant-upload-hint">Business Registration Certificate</p>
              </Dragger>
            </Card>

            {/* Tax Clearance */}
            <Card size="small" style={{ marginBottom: '16px' }}>
              <Text strong>Tax Clearance Certificate *</Text>
              <Dragger
                accept=".pdf,.doc,.docx,.jpg,.png"
                multiple={false}
                fileList={uploadedDocuments.taxClearance || []}
                onChange={({ fileList }) => handleDocumentUpload('taxClearance', fileList)}
                beforeUpload={() => false}
              >
                <p className="ant-upload-drag-icon">
                  <InboxOutlined />
                </p>
                <p className="ant-upload-text">Click or drag file to this area to upload</p>
                <p className="ant-upload-hint">Tax Clearance Certificate</p>
              </Dragger>
            </Card>

            {/* Bank Statement */}
            <Card size="small" style={{ marginBottom: '16px' }}>
              <Text strong>Bank Statement (last 6 months) *</Text>
              <Dragger
                accept=".pdf,.doc,.docx"
                multiple={true}
                fileList={uploadedDocuments.bankStatement || []}
                onChange={({ fileList }) => handleDocumentUpload('bankStatement', fileList)}
                beforeUpload={() => false}
              >
                <p className="ant-upload-drag-icon">
                  <InboxOutlined />
                </p>
                <p className="ant-upload-text">Click or drag files to this area to upload</p>
                <p className="ant-upload-hint">Bank Statement (last 6 months)</p>
              </Dragger>
            </Card>

            {/* Insurance Certificate */}
            <Card size="small" style={{ marginBottom: '16px' }}>
              <Text strong>Insurance Certificate</Text>
              <Dragger
                accept=".pdf,.doc,.docx,.jpg,.png"
                multiple={false}
                fileList={uploadedDocuments.insuranceCertificate || []}
                onChange={({ fileList }) => handleDocumentUpload('insuranceCertificate', fileList)}
                beforeUpload={() => false}
              >
                <p className="ant-upload-drag-icon">
                  <InboxOutlined />
                </p>
                <p className="ant-upload-text">Click or drag file to this area to upload</p>
                <p className="ant-upload-hint">Insurance Certificate</p>
              </Dragger>
            </Card>

            {/* Quality Certifications */}
            <Card size="small" style={{ marginBottom: '16px' }}>
              <Text strong>Quality Certifications (if applicable)</Text>
              <Dragger
                accept=".pdf,.doc,.docx,.jpg,.png"
                multiple={true}
                fileList={uploadedDocuments.qualityCertifications || []}
                onChange={({ fileList }) => handleDocumentUpload('qualityCertifications', fileList)}
                beforeUpload={() => false}
              >
                <p className="ant-upload-drag-icon">
                  <InboxOutlined />
                </p>
                <p className="ant-upload-text">Click or drag files to this area to upload</p>
                <p className="ant-upload-hint">Quality Certifications, ISO certificates, etc.</p>
              </Dragger>
            </Card>

            {/* Additional Documents */}
            <Card size="small">
              <Text strong>Additional Documents</Text>
              <Dragger
                accept=".pdf,.doc,.docx,.jpg,.png"
                multiple={true}
                fileList={uploadedDocuments.additionalDocuments || []}
                onChange={({ fileList }) => handleDocumentUpload('additionalDocuments', fileList)}
                beforeUpload={() => false}
              >
                <p className="ant-upload-drag-icon">
                  <InboxOutlined />
                </p>
                <p className="ant-upload-text">Click or drag files to this area to upload</p>
                <p className="ant-upload-hint">Any additional supporting documents</p>
              </Dragger>
            </Card>
          </div>
        );
      case 4:
        return (
          <div>
            <Alert
              message="Compliance Declarations"
              description="Please confirm your compliance with the following requirements:"
              type="warning"
              showIcon
              style={{ marginBottom: '16px' }}
            />
            <Form.Item
              name="anticorruptionPolicy"
              valuePropName="checked"
              rules={[{ required: true, message: 'This declaration is required' }]}
            >
              <Checkbox>
                We have and will maintain adequate anti-corruption policies and procedures
              </Checkbox>
            </Form.Item>
            <Form.Item
              name="dataProtectionCompliance"
              valuePropName="checked"
              rules={[{ required: true, message: 'This declaration is required' }]}
            >
              <Checkbox>
                We comply with applicable data protection and privacy regulations
              </Checkbox>
            </Form.Item>
            <Form.Item
              name="environmentalCompliance"
              valuePropName="checked"
              rules={[{ required: true, message: 'This declaration is required' }]}
            >
              <Checkbox>
                We comply with applicable environmental regulations and standards
              </Checkbox>
            </Form.Item>
            <Form.Item
              name="laborStandards"
              valuePropName="checked"
              rules={[{ required: true, message: 'This declaration is required' }]}
            >
              <Checkbox>
                We comply with applicable labor standards and human rights principles
              </Checkbox>
            </Form.Item>
          </div>
        );
      default:
        return null;
    }
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: (selectedRowKeys) => {
      setSelectedRowKeys(selectedRowKeys);
    },
  };

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <Title level={2} style={{ margin: 0 }}>
            <UserAddOutlined /> Supplier Onboarding & Management
          </Title>
          <Space>
            <Button 
              icon={<ReloadOutlined />}
              onClick={fetchAllData}
              loading={loading}
            >
              Refresh
            </Button>
            <Button 
              icon={<DownloadOutlined />}
              onClick={handleExportApplications}
            >
              Export
            </Button>
            {selectedRowKeys.length > 0 && (
              <Button 
                type="dashed"
                onClick={() => setBulkActionModalVisible(true)}
              >
                Bulk Actions ({selectedRowKeys.length})
              </Button>
            )}
            <Button 
              type="primary" 
              icon={<UserAddOutlined />} 
              onClick={handleStartOnboarding}
            >
              Start Supplier Onboarding
            </Button>
          </Space>
        </div>

        {/* Enhanced Statistics */}
        <Row gutter={16} style={{ marginBottom: '24px' }}>
          <Col span={4}>
            <Statistic
              title="Total Records"
              value={stats.total}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Col>
          <Col span={4}>
            <Statistic
              title="New Applications"
              value={stats.applications}
              prefix={<FileAddOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Col>
          <Col span={4}>
            <Statistic
              title="Existing Suppliers"
              value={stats.onboardedSuppliers}
              prefix={<ShopOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Col>
          <Col span={4}>
            <Statistic
              title="Pending Review"
              value={stats.pending}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Col>
          <Col span={4}>
            <Statistic
              title="Under Review"
              value={stats.underReview}
              prefix={<EyeOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Col>
          <Col span={4}>
            <Statistic
              title="Active Suppliers"
              value={stats.active}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Col>
        </Row>

        {/* Enhanced Tabs with Combined Data */}
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane 
            tab={
              <Badge count={stats.total} size="small">
                <span>All Records ({stats.total})</span>
              </Badge>
            } 
            key="all"
          >
            <Table
              rowSelection={rowSelection}
              columns={columns}
              dataSource={getFilteredData()}
              rowKey="id"
              loading={loading}
              pagination={{
                pageSize: 10,
                showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} records`
              }}
              scroll={{ x: 'max-content' }}
            />
          </TabPane>

          <TabPane 
            tab={
              <Badge count={stats.pending} size="small">
                <span><ClockCircleOutlined /> Pending ({stats.pending})</span>
              </Badge>
            } 
            key="pending"
          >
            <Table
              rowSelection={rowSelection}
              columns={columns}
              dataSource={getFilteredData()}
              rowKey="id"
              loading={loading}
              pagination={false}
              scroll={{ x: 'max-content' }}
            />
          </TabPane>

          <TabPane 
            tab={
              <span><EyeOutlined /> Under Review ({stats.underReview})</span>
            } 
            key="under_review"
          >
            <Table
              rowSelection={rowSelection}
              columns={columns}
              dataSource={getFilteredData()}
              rowKey="id"
              loading={loading}
              pagination={false}
              scroll={{ x: 'max-content' }}
            />
          </TabPane>

          <TabPane 
            tab={
              <span><CheckCircleOutlined /> Approved ({stats.approved})</span>
            } 
            key="approved"
          >
            <Table
              rowSelection={rowSelection}
              columns={columns}
              dataSource={getFilteredData()}
              rowKey="id"
              loading={loading}
              pagination={false}
              scroll={{ x: 'max-content' }}
            />
          </TabPane>

          <TabPane 
            tab={
              <span><ShopOutlined /> Onboarded ({stats.onboardedSuppliers})</span>
            } 
            key="onboarded"
          >
            <Table
              rowSelection={rowSelection}
              columns={columns}
              dataSource={getFilteredData()}
              rowKey="id"
              loading={loading}
              pagination={false}
              scroll={{ x: 'max-content' }}
            />
          </TabPane>

          <TabPane 
            tab={
              <span><ExclamationCircleOutlined /> Rejected ({stats.rejected})</span>
            } 
            key="rejected"
          >
            <Table
              rowSelection={rowSelection}
              columns={columns}
              dataSource={getFilteredData()}
              rowKey="id"
              loading={loading}
              pagination={false}
              scroll={{ x: 'max-content' }}
            />
          </TabPane>
        </Tabs>
      </Card>

      {/* Onboarding Modal */}
      <Modal
        title="Supplier Onboarding Application"
        open={onboardingModalVisible}
        onCancel={() => {
          setOnboardingModalVisible(false);
          form.resetFields();
          setCurrentStep(0);
          setUploadedDocuments({});
        }}
        footer={null}
        width={900}
        destroyOnClose
      >
        <Steps current={currentStep} items={onboardingSteps} style={{ marginBottom: '24px' }} />
        
        <Spin spinning={loading}>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmitOnboarding}
          >
            {renderStepContent()}

            <div style={{ textAlign: 'right', marginTop: '24px' }}>
              <Space>
                {currentStep > 0 && (
                  <Button onClick={() => setCurrentStep(currentStep - 1)}>
                    Previous
                  </Button>
                )}
                {currentStep < onboardingSteps.length - 1 ? (
                  <Button type="primary" onClick={() => setCurrentStep(currentStep + 1)}>
                    Next
                  </Button>
                ) : (
                  <Button type="primary" htmlType="submit" icon={<SendOutlined />} loading={loading}>
                    Submit Application
                  </Button>
                )}
              </Space>
            </div>
          </Form>
        </Spin>
      </Modal>

      {/* Enhanced Detail Drawer */}
      <Drawer
        title={
          <Space>
            {selectedApplication?.type === 'existing_supplier' ? <ShopOutlined /> : <FileTextOutlined />}
            {selectedApplication?.type === 'existing_supplier' ? 'Supplier Details' : 'Application Details'}
          </Space>
        }
        placement="right"
        width={900}
        open={detailDrawerVisible}
        onClose={() => {
          setDetailDrawerVisible(false);
          setSelectedApplication(null);
        }}
      >
        {selectedApplication && (
          <div>
            {/* Application/Supplier Overview */}
            <Card size="small" title={selectedApplication.type === 'existing_supplier' ? 'Supplier Overview' : 'Application Overview'} style={{ marginBottom: '16px' }}>
              <Row gutter={16}>
                <Col span={12}>
                  <Descriptions column={1} size="small">
                    <Descriptions.Item label={selectedApplication.type === 'existing_supplier' ? 'Supplier ID' : 'Application ID'}>
                      <Text code>{selectedApplication.id}</Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="Company Name">
                      <Text strong>{selectedApplication.companyName}</Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="Status">
                      {getStatusTag(selectedApplication.status, selectedApplication.type === 'existing_supplier')}
                    </Descriptions.Item>
                    <Descriptions.Item label="Type">
                      <Tag color={selectedApplication.type === 'existing_supplier' ? 'purple' : 'blue'}>
                        {selectedApplication.type === 'existing_supplier' ? 'Existing Supplier' : 'New Application'}
                      </Tag>
                    </Descriptions.Item>
                  </Descriptions>
                </Col>
                <Col span={12}>
                  <Descriptions column={1} size="small">
                    <Descriptions.Item label="Registration Date">
                      {selectedApplication.submissionDate ? new Date(selectedApplication.submissionDate).toLocaleDateString('en-GB') : '-'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Last Updated">
                      {selectedApplication.lastUpdated ? new Date(selectedApplication.lastUpdated).toLocaleDateString('en-GB') : '-'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Completion">
                      <Progress percent={selectedApplication.completionPercentage || 0} size="small" style={{ width: 150 }} />
                    </Descriptions.Item>
                    {selectedApplication.type === 'existing_supplier' && (
                      <Descriptions.Item label="Active Status">
                        <Tag color={selectedApplication.isActive ? 'green' : 'red'}>
                          {selectedApplication.isActive ? 'Active' : 'Inactive'}
                        </Tag>
                      </Descriptions.Item>
                    )}
                  </Descriptions>
                </Col>
              </Row>
            </Card>

            {/* Company Information */}
            <Card size="small" title="Company Information" style={{ marginBottom: '16px' }}>
              <Row gutter={16}>
                <Col span={12}>
                  <Descriptions column={1} size="small">
                    <Descriptions.Item label="Business Type">
                      {selectedApplication.businessType}
                    </Descriptions.Item>
                    <Descriptions.Item label="Category">
                      <Tag color="blue">{selectedApplication.category}</Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="Years in Business">
                      {selectedApplication.yearsInBusiness} years
                    </Descriptions.Item>
                    <Descriptions.Item label="Annual Revenue">
                      {selectedApplication.estimatedAnnualRevenue ? `XAF ${selectedApplication.estimatedAnnualRevenue?.toLocaleString()}` : 'N/A'}
                    </Descriptions.Item>
                  </Descriptions>
                </Col>
                <Col span={12}>
                  <Descriptions column={1} size="small">
                    <Descriptions.Item label="Tax ID">
                      {selectedApplication.taxId}
                    </Descriptions.Item>
                    <Descriptions.Item label="Business License">
                      {selectedApplication.businessLicense}
                    </Descriptions.Item>
                    <Descriptions.Item label="Website">
                      {selectedApplication.website ? <><GlobalOutlined /> {selectedApplication.website}</> : 'N/A'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Address">
                      {selectedApplication.address}
                    </Descriptions.Item>
                  </Descriptions>
                </Col>
              </Row>
            </Card>

            {/* Contact Information */}
            <Card size="small" title="Contact Information" style={{ marginBottom: '16px' }}>
              <Descriptions column={1} size="small">
                <Descriptions.Item label="Contact Person">
                  <TeamOutlined /> {selectedApplication.contactPerson}
                </Descriptions.Item>
                <Descriptions.Item label="Email">
                  <MailOutlined /> {selectedApplication.email}
                  {selectedApplication.emailVerified && <Tag color="green" style={{ marginLeft: 8 }}>Verified</Tag>}
                </Descriptions.Item>
                <Descriptions.Item label="Phone">
                  <PhoneOutlined /> {selectedApplication.phone}
                </Descriptions.Item>
              </Descriptions>
            </Card>

            {/* Services/Products */}
            {selectedApplication.services && selectedApplication.services.length > 0 && (
              <Card size="small" title="Services & Products" style={{ marginBottom: '16px' }}>
                <Space wrap>
                  {selectedApplication.services.map(service => (
                    <Tag key={service} color="green">{service}</Tag>
                  ))}
                </Space>
              </Card>
            )}

            {/* Additional Info for Existing Suppliers */}
            {selectedApplication.type === 'existing_supplier' && (
              <Card size="small" title="Account Information" style={{ marginBottom: '16px' }}>
                <Descriptions column={2} size="small">
                  <Descriptions.Item label="Account Status">
                    <Tag color={selectedApplication.accountStatus === 'approved' ? 'green' : 'orange'}>
                      {selectedApplication.accountStatus}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Email Verified">
                    <Tag color={selectedApplication.emailVerified ? 'green' : 'red'}>
                      {selectedApplication.emailVerified ? 'Yes' : 'No'}
                    </Tag>
                  </Descriptions.Item>
                  {selectedApplication.lastLogin && (
                    <Descriptions.Item label="Last Login">
                      {new Date(selectedApplication.lastLogin).toLocaleDateString('en-GB')}
                    </Descriptions.Item>
                  )}
                </Descriptions>
              </Card>
            )}

            {/* Document Status */}
            {selectedApplication.documents && selectedApplication.documents.length > 0 && (
              <Card size="small" title="Document Status" style={{ marginBottom: '16px' }}>
                <List
                  dataSource={selectedApplication.documents}
                  renderItem={(doc, index) => (
                    <List.Item key={index}>
                      <List.Item.Meta
                        avatar={<Avatar icon={<FileTextOutlined />} />}
                        title={doc.name}
                        description={
                          <Space>
                            <Tag color={doc.status === 'submitted' ? 'blue' : doc.status === 'verified' ? 'green' : 'red'}>
                              {doc.status}
                            </Tag>
                            {doc.verified && <Tag color="green">Verified</Tag>}
                          </Space>
                        }
                      />
                      <Space>
                        {doc.status === 'submitted' && (
                          <>
                            <Button 
                              size="small" 
                              icon={<DownloadOutlined />}
                              onClick={() => handleDownloadDocument(selectedApplication.id, doc.id)}
                            >
                              Download
                            </Button>
                            <Button size="small" type="primary">
                              Verify
                            </Button>
                          </>
                        )}
                      </Space>
                    </List.Item>
                  )}
                />
              </Card>
            )}

            {/* Review Notes */}
            {selectedApplication.notes && selectedApplication.notes.length > 0 && (
              <Card size="small" title="Review Notes" style={{ marginBottom: '16px' }}>
                <Timeline>
                  {selectedApplication.notes.map((note, index) => (
                    <Timeline.Item key={index}>
                      <div>
                        <Text strong>{note.author}</Text>
                        <Text type="secondary" style={{ marginLeft: '8px' }}>
                          {new Date(note.date).toLocaleDateString('en-GB')}
                        </Text>
                        <br />
                        <Text>{note.note}</Text>
                      </div>
                    </Timeline.Item>
                  ))}
                </Timeline>
              </Card>
            )}

            {/* Action Buttons */}
            <Card size="small" title="Actions">
              <Space>
                {selectedApplication.type !== 'existing_supplier' && ['pending_review', 'under_review'].includes(selectedApplication.status) && (
                  <Button 
                    type="primary" 
                    icon={<CheckCircleOutlined />}
                    onClick={() => {
                      setDetailDrawerVisible(false);
                      handleReviewApplication(selectedApplication);
                    }}
                  >
                    Review Application
                  </Button>
                )}
                
                {selectedApplication.type === 'existing_supplier' && (
                  <Button 
                    type="primary"
                    icon={<EditOutlined />}
                  >
                    Manage Supplier
                  </Button>
                )}
                
                <Button 
                  icon={<EditOutlined />}
                >
                  {selectedApplication.type === 'existing_supplier' ? 'Edit Details' : 'Request Additional Info'}
                </Button>
                
                <Button 
                  icon={<DownloadOutlined />}
                  onClick={() => handleExportApplications()}
                >
                  Download {selectedApplication.type === 'existing_supplier' ? 'Details' : 'Application'}
                </Button>
              </Space>
            </Card>
          </div>
        )}
      </Drawer>

      {/* Review Modal */}
      <Modal
        title="Review Supplier Application"
        open={reviewModalVisible}
        onCancel={() => {
          setReviewModalVisible(false);
          reviewForm.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Spin spinning={loading}>
          <Form
            form={reviewForm}
            layout="vertical"
            onFinish={handleSubmitReview}
          >
            <Form.Item
              name="decision"
              label="Review Decision"
              rules={[{ required: true, message: 'Please select a decision' }]}
            >
              <Select placeholder="Select decision">
                <Option value="approved">
                  <CheckCircleOutlined style={{ color: '#52c41a' }} /> Approve Application
                </Option>
                <Option value="rejected">
                  <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} /> Reject Application
                </Option>
                <Option value="requires_clarification">
                  <ExclamationCircleOutlined style={{ color: '#faad14' }} /> Request Clarification
                </Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="reviewComments"
              label="Review Comments"
              rules={[{ required: true, message: 'Please provide review comments' }]}
            >
              <TextArea 
                rows={4} 
                placeholder="Provide detailed feedback on the application..."
                showCount
                maxLength={500}
              />
            </Form.Item>

            <div style={{ textAlign: 'right' }}>
              <Space>
                <Button onClick={() => setReviewModalVisible(false)}>
                  Cancel
                </Button>
                <Button type="primary" htmlType="submit" icon={<SendOutlined />} loading={loading}>
                  Submit Review
                </Button>
              </Space>
            </div>
          </Form>
        </Spin>
      </Modal>

      {/* Bulk Action Modal */}
      <Modal
        title={`Bulk Actions (${selectedRowKeys.length} selected)`}
        open={bulkActionModalVisible}
        onCancel={() => setBulkActionModalVisible(false)}
        footer={null}
        width={500}
      >
        <Form
          form={bulkForm}
          layout="vertical"
          onFinish={handleBulkAction}
        >
          <Form.Item
            name="action"
            label="Action"
            rules={[{ required: true, message: 'Please select an action' }]}
          >
            <Select placeholder="Select bulk action">
              <Option value="approve">Approve Selected</Option>
              <Option value="reject">Reject Selected</Option>
              <Option value="under_review">Mark Under Review</Option>
              <Option value="requires_clarification">Request Clarification</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="comments"
            label="Comments"
            rules={[{ required: true, message: 'Please provide comments' }]}
          >
            <TextArea 
              rows={3} 
              placeholder="Comments for bulk action..."
              showCount
              maxLength={300}
            />
          </Form.Item>

          <div style={{ textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setBulkActionModalVisible(false)}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                Apply to {selectedRowKeys.length} Records
              </Button>
            </Space>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default SupplyChainSupplierOnboarding;