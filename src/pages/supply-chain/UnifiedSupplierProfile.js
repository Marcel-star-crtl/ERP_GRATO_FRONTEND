import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Tabs,
  Descriptions,
  Table,
  Tag,
  Progress,
  Button,
  Space,
  Statistic,
  Row,
  Col,
  Timeline,
  Alert,
  Spin,
  message
} from 'antd';
import {
  UserOutlined,
  FileTextOutlined,
  ContainerOutlined,
  StarOutlined,
  DollarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DownloadOutlined,
  EditOutlined,
  EyeOutlined
} from '@ant-design/icons';
import moment from 'moment';
import unifiedSupplierAPI from '../../services/unifiedSupplierAPI';

const { TabPane } = Tabs;

const UnifiedSupplierProfile = () => {
  const { supplierId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState(null);

  useEffect(() => {
    fetchCompleteProfile();
  }, [supplierId]);

  const fetchCompleteProfile = async () => {
    try {
      setLoading(true);
      const response = await unifiedSupplierAPI.getCompleteProfile(supplierId);
      if (response.success) {
        setProfileData(response.data);
      }
    } catch (error) {
      console.error('Error fetching supplier profile:', error);
      message.error('Failed to fetch supplier profile');
    } finally {
      setLoading(false);
    }
  };

  // Function to format address
  const formatAddress = (address) => {
    if (!address) return 'Not provided';
    
    if (typeof address === 'string') return address;
    
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

  // Function to download document
  const downloadDocument = (fileData, fileName = 'document') => {
    if (!fileData) {
      message.error('File not available');
      return;
    }

    try {
      const publicId = typeof fileData === 'string' ? fileData : fileData.publicId;
      const fileUrl = typeof fileData === 'string' 
        ? `${process.env.REACT_APP_API_URL || 'http://localhost:5001'}/files/supplier-document/${fileData}`
        : fileData.url || `${process.env.REACT_APP_API_URL || 'http://localhost:5001'}/files/supplier-document/${fileData.publicId}`;
      
      if (fileUrl) {
        window.open(fileUrl, '_blank');
      } else {
        message.error('No file URL available');
      }
    } catch (error) {
      console.error('Error downloading file:', error);
      message.error('Failed to download file');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!profileData) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <h3>Supplier not found</h3>
          <Button type="primary" onClick={() => navigate('/supply-chain/suppliers')}>
            Back to Suppliers
          </Button>
        </div>
      </Card>
    );
  }

  const { profile, contracts, invoices, performance, overallSummary } = profileData;

  const getStatusTag = (status) => {
    const colors = {
      approved: 'green',
      pending: 'orange',
      rejected: 'red',
      suspended: 'orange'
    };
    return <Tag color={colors[status] || 'default'}>{status?.toUpperCase()}</Tag>;
  };

  const getPerformanceColor = (score) => {
    if (score >= 90) return '#52c41a';
    if (score >= 80) return '#1890ff';
    if (score >= 70) return '#faad14';
    if (score >= 60) return '#fa8c16';
    return '#f5222d';
  };

  const getGradeColor = (grade) => {
    const colors = {
      A: 'green',
      B: 'blue',
      C: 'orange',
      D: 'red',
      F: 'red'
    };
    return colors[grade] || 'default';
  };

  const contractColumns = [
    {
      title: 'Contract Number',
      dataIndex: 'contractNumber',
      key: 'contractNumber',
      render: (text) => <span style={{ fontFamily: 'monospace' }}>{text}</span>
    },
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type) => <Tag color="blue">{type}</Tag>
    },
    {
      title: 'Value',
      key: 'value',
      render: (_, record) => (
        <span>
          {unifiedSupplierAPI.formatCurrency(
            record.financials?.totalValue || 0,
            record.financials?.currency || 'XAF'
          )}
        </span>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const colors = {
          active: 'green',
          expiring_soon: 'orange',
          expired: 'red',
          draft: 'default'
        };
        return <Tag color={colors[status]}>{status?.toUpperCase().replace('_', ' ')}</Tag>;
      }
    },
    {
      title: 'Period',
      key: 'period',
      render: (_, record) => (
        <div>
          <div>{moment(record.dates?.startDate).format('DD/MM/YYYY')}</div>
          <div>to {moment(record.dates?.endDate).format('DD/MM/YYYY')}</div>
        </div>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button 
            size="small" 
            icon={<EyeOutlined />}
            onClick={() => navigate(`/supply-chain/contracts/${record._id}`)}
          >
            View
          </Button>
        </Space>
      )
    }
  ];

  const invoiceColumns = [
    {
      title: 'Invoice Number',
      dataIndex: 'invoiceNumber',
      key: 'invoiceNumber',
      render: (text) => <span style={{ fontFamily: 'monospace' }}>{text}</span>
    },
    {
      title: 'PO Number',
      dataIndex: 'poNumber',
      key: 'poNumber'
    },
    {
      title: 'Amount',
      key: 'amount',
      render: (_, record) => (
        <span>
          {unifiedSupplierAPI.formatCurrency(
            record.invoiceAmount || 0,
            record.currency || 'XAF'
          )}
        </span>
      )
    },
    {
      title: 'Linked Contract',
      key: 'linkedContract',
      render: (_, record) => (
        record.linkedContract ? (
          <Tag color="blue">{record.linkedContract.contractNumber}</Tag>
        ) : (
          <Tag color="default">No Contract</Tag>
        )
      )
    },
    {
      title: 'Status',
      dataIndex: 'approvalStatus',
      key: 'approvalStatus',
      render: (status) => {
        const colors = {
          pending_finance_assignment: 'orange',
          pending_department_approval: 'blue',
          approved: 'green',
          paid: 'purple',
          rejected: 'red'
        };
        return <Tag color={colors[status]}>{status?.toUpperCase().replace(/_/g, ' ')}</Tag>;
      }
    },
    {
      title: 'Date',
      dataIndex: 'uploadedDate',
      key: 'uploadedDate',
      render: (date) => moment(date).format('DD/MM/YYYY')
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button 
            size="small" 
            icon={<EyeOutlined />}
            onClick={() => navigate(`/invoices/${record._id}`)}
          >
            View
          </Button>
        </Space>
      )
    }
  ];

  const performanceColumns = [
    {
      title: 'Evaluation Date',
      dataIndex: 'evaluationDate',
      key: 'evaluationDate',
      render: (date) => moment(date).format('DD/MM/YYYY')
    },
    {
      title: 'Overall Score',
      dataIndex: 'overallScore',
      key: 'overallScore',
      render: (score) => (
        <div>
          <Progress 
            percent={score} 
            strokeColor={getPerformanceColor(score)}
            format={percent => `${percent.toFixed(1)}%`}
          />
        </div>
      )
    },
    {
      title: 'Grade',
      key: 'grade',
      render: (_, record) => {
        const score = record.overallScore;
        const grade = score >= 90 ? 'A' :
                     score >= 80 ? 'B' :
                     score >= 70 ? 'C' :
                     score >= 60 ? 'D' : 'F';
        return (
          <Tag color={getGradeColor(grade)} style={{ fontSize: '16px', padding: '4px 12px' }}>
            {grade}
          </Tag>
        );
      }
    },
    {
      title: 'Recommendation',
      dataIndex: 'recommendation',
      key: 'recommendation',
      render: (rec) => {
        const colors = {
          preferred: 'green',
          approved: 'blue',
          conditional: 'orange',
          'not-recommended': 'red'
        };
        return (
          <Tag color={colors[rec] || 'default'}>
            {rec?.toUpperCase().replace('-', ' ')}
          </Tag>
        );
      }
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button 
          size="small"
          onClick={() => navigate(`/supply-chain/performance/${record._id}`)}
        >
          View Details
        </Button>
      )
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      {/* Header Card */}
      <Card style={{ marginBottom: '24px' }}>
        <Row gutter={16} align="middle">
          <Col span={16}>
            <Space direction="vertical" size="small">
              <div>
                <UserOutlined style={{ fontSize: '24px', marginRight: '12px' }} />
                <span style={{ fontSize: '24px', fontWeight: 'bold' }}>
                  {profile.supplierDetails?.companyName}
                </span>
              </div>
              <Space>
                {getStatusTag(profile.supplierStatus?.accountStatus)}
                <Tag color={profile.supplierStatus?.emailVerified ? 'green' : 'orange'}>
                  {profile.supplierStatus?.emailVerified ? 'Email Verified' : 'Email Pending'}
                </Tag>
                <Tag color="blue">{profile.supplierDetails?.supplierType}</Tag>
              </Space>
            </Space>
          </Col>
          <Col span={8} style={{ textAlign: 'right' }}>
            <Space>
              <Button 
                type="primary" 
                icon={<EditOutlined />}
                onClick={() => navigate(`/supply-chain/suppliers/${supplierId}/edit`)}
              >
                Edit Profile
              </Button>
              <Button 
                onClick={() => navigate(`/supply-chain/contracts/create?supplier=${supplierId}`)}
              >
                Create Contract
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Summary Statistics */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Contracts"
              value={overallSummary.contracts.total}
              prefix={<ContainerOutlined />}
              suffix={
                <span style={{ fontSize: '14px', color: '#52c41a' }}>
                  ({overallSummary.contracts.active} active)
                </span>
              }
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Contract Value"
              value={overallSummary.contracts.totalValue}
              prefix={<DollarOutlined />}
              precision={0}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Invoiced"
              value={overallSummary.invoices.totalInvoiced}
              prefix={<FileTextOutlined />}
              precision={0}
              valueStyle={{ color: '#722ed1' }}
              suffix={
                <span style={{ fontSize: '14px' }}>
                  ({overallSummary.invoices.total} invoices)
                </span>
              }
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Performance Score"
              value={overallSummary.performance.averageScore || 0}
              prefix={<StarOutlined />}
              suffix="%"
              valueStyle={{ 
                color: overallSummary.performance.averageScore >= 80 ? '#52c41a' : '#faad14' 
              }}
            />
          </Card>
        </Col>
      </Row>

      {/* Alert for Pending Items */}
      {overallSummary.invoices.pending > 0 && (
        <Alert
          message={`${overallSummary.invoices.pending} invoices pending approval`}
          type="warning"
          showIcon
          icon={<ClockCircleOutlined />}
          style={{ marginBottom: '24px' }}
        />
      )}

      {/* Detailed Tabs */}
      <Card>
        <Tabs defaultActiveKey="profile">
          {/* Profile Tab */}
          <TabPane 
            tab={
              <span>
                <UserOutlined />
                Profile
              </span>
            } 
            key="profile"
          >
            <Row gutter={16}>
              <Col span={12}>
                <Card size="small" title="Company Information" style={{ marginBottom: '16px' }}>
                  <Descriptions column={1} size="small">
                    <Descriptions.Item label="Company Name">
                      {profile.supplierDetails?.companyName}
                    </Descriptions.Item>
                    <Descriptions.Item label="Business Type">
                      {profile.supplierDetails?.businessType || 'N/A'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Supplier Type">
                      {profile.supplierDetails?.supplierType}
                    </Descriptions.Item>
                    <Descriptions.Item label="Business Reg. No.">
                      {profile.supplierDetails?.businessRegistrationNumber || 'N/A'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Tax ID">
                      {profile.supplierDetails?.taxIdNumber || 'N/A'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Established Year">
                      {profile.supplierDetails?.establishedYear || 'N/A'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Employee Count">
                      {profile.supplierDetails?.employeeCount || 'N/A'}
                    </Descriptions.Item>
                  </Descriptions>
                </Card>

                <Card size="small" title="Bank Details" style={{ marginBottom: '16px' }}>
                  <Descriptions column={1} size="small">
                    <Descriptions.Item label="Bank Name">
                      {profile.supplierDetails?.bankDetails?.bankName || 'N/A'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Account Name">
                      {profile.supplierDetails?.bankDetails?.accountName || 'N/A'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Account Number">
                      {profile.supplierDetails?.bankDetails?.accountNumber || 'N/A'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Payment Terms">
                      {profile.supplierDetails?.paymentTerms || 'N/A'}
                    </Descriptions.Item>
                  </Descriptions>
                </Card>
              </Col>

              <Col span={12}>
                <Card size="small" title="Contact Information" style={{ marginBottom: '16px' }}>
                  <Descriptions column={1} size="small">
                    <Descriptions.Item label="Contact Person">
                      {profile.supplierDetails?.contactName}
                    </Descriptions.Item>
                    <Descriptions.Item label="Email">
                      {profile.email}
                    </Descriptions.Item>
                    <Descriptions.Item label="Phone">
                      {profile.supplierDetails?.phoneNumber}
                    </Descriptions.Item>
                    <Descriptions.Item label="Alternate Phone">
                      {profile.supplierDetails?.alternatePhone || 'N/A'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Website">
                      {profile.supplierDetails?.website ? (
                        <a href={profile.supplierDetails.website} target="_blank" rel="noopener noreferrer">
                          {profile.supplierDetails.website}
                        </a>
                      ) : 'N/A'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Address">
                      {formatAddress(profile.supplierDetails?.address)}
                    </Descriptions.Item>
                  </Descriptions>
                </Card>

                <Card size="small" title="Services Offered" style={{ marginBottom: '16px' }}>
                  <Space wrap>
                    {profile.supplierDetails?.servicesOffered?.length > 0 ? (
                      profile.supplierDetails.servicesOffered.map(service => (
                        <Tag key={service} color="blue">{service}</Tag>
                      ))
                    ) : (
                      <span>No services listed</span>
                    )}
                  </Space>
                  {profile.supplierDetails?.businessDescription && (
                    <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
                      <strong>Description:</strong>
                      <p style={{ marginTop: '8px' }}>{profile.supplierDetails.businessDescription}</p>
                    </div>
                  )}
                </Card>

                <Card size="small" title="Account Status">
                  <Timeline>
                    <Timeline.Item color="green">
                      <strong>Registered:</strong> {moment(profile.createdAt).format('DD/MM/YYYY HH:mm')}
                    </Timeline.Item>
                    {profile.supplierStatus?.emailVerified && (
                      <Timeline.Item color="blue">
                        <strong>Email Verified</strong>
                      </Timeline.Item>
                    )}
                    {profile.supplierStatus?.approvalDate && (
                      <Timeline.Item color="green">
                        <strong>Approved:</strong> {moment(profile.supplierStatus.approvalDate).format('DD/MM/YYYY')}
                      </Timeline.Item>
                    )}
                    {profile.lastLogin && (
                      <Timeline.Item>
                        <strong>Last Login:</strong> {moment(profile.lastLogin).format('DD/MM/YYYY HH:mm')}
                      </Timeline.Item>
                    )}
                  </Timeline>
                </Card>
              </Col>
            </Row>

            {/* Documents Section */}
            {profile.supplierDetails?.documents && (
              <Card size="small" title="Submitted Documents" style={{ marginTop: '16px' }}>
                <Row gutter={[16, 16]}>
                  {profile.supplierDetails.documents.businessRegistrationCertificate && (
                    <Col span={12}>
                      <Card size="small" style={{ textAlign: 'center' }}>
                        <h4>Business Registration Certificate</h4>
                        <Button 
                          type="primary" 
                          icon={<EyeOutlined />}
                          style={{ marginRight: '8px' }}
                          onClick={() => downloadDocument(
                            profile.supplierDetails.documents.businessRegistrationCertificate,
                            'business-registration-certificate'
                          )}
                        >
                          View
                        </Button>
                        <Button 
                          icon={<DownloadOutlined />}
                          onClick={() => downloadDocument(
                            profile.supplierDetails.documents.businessRegistrationCertificate,
                            'business-registration-certificate'
                          )}
                        >
                          Download
                        </Button>
                      </Card>
                    </Col>
                  )}
                  {profile.supplierDetails.documents.taxClearanceCertificate && (
                    <Col span={12}>
                      <Card size="small" style={{ textAlign: 'center' }}>
                        <h4>Tax Clearance Certificate</h4>
                        <Button 
                          type="primary" 
                          icon={<EyeOutlined />}
                          style={{ marginRight: '8px' }}
                          onClick={() => downloadDocument(
                            profile.supplierDetails.documents.taxClearanceCertificate,
                            'tax-clearance-certificate'
                          )}
                        >
                          View
                        </Button>
                        <Button 
                          icon={<DownloadOutlined />}
                          onClick={() => downloadDocument(
                            profile.supplierDetails.documents.taxClearanceCertificate,
                            'tax-clearance-certificate'
                          )}
                        >
                          Download
                        </Button>
                      </Card>
                    </Col>
                  )}
                  {profile.supplierDetails.documents.bankStatement && (
                    <Col span={12}>
                      <Card size="small" style={{ textAlign: 'center' }}>
                        <h4>Bank Statement</h4>
                        <Button 
                          type="primary" 
                          icon={<EyeOutlined />}
                          style={{ marginRight: '8px' }}
                          onClick={() => downloadDocument(
                            profile.supplierDetails.documents.bankStatement,
                            'bank-statement'
                          )}
                        >
                          View
                        </Button>
                        <Button 
                          icon={<DownloadOutlined />}
                          onClick={() => downloadDocument(
                            profile.supplierDetails.documents.bankStatement,
                            'bank-statement'
                          )}
                        >
                          Download
                        </Button>
                      </Card>
                    </Col>
                  )}
                  {profile.supplierDetails.documents.insuranceCertificate && (
                    <Col span={12}>
                      <Card size="small" style={{ textAlign: 'center' }}>
                        <h4>Insurance Certificate</h4>
                        <Button 
                          type="primary" 
                          icon={<EyeOutlined />}
                          style={{ marginRight: '8px' }}
                          onClick={() => downloadDocument(
                            profile.supplierDetails.documents.insuranceCertificate,
                            'insurance-certificate'
                          )}
                        >
                          View
                        </Button>
                        <Button 
                          icon={<DownloadOutlined />}
                          onClick={() => downloadDocument(
                            profile.supplierDetails.documents.insuranceCertificate,
                            'insurance-certificate'
                          )}
                        >
                          Download
                        </Button>
                      </Card>
                    </Col>
                  )}
                </Row>
              </Card>
            )}
          </TabPane>

          {/* Contracts Tab */}
          <TabPane 
            tab={
              <span>
                <ContainerOutlined />
                Contracts ({contracts.list.length})
              </span>
            } 
            key="contracts"
          >
            <div style={{ marginBottom: '16px' }}>
              <Button 
                type="primary" 
                onClick={() => navigate(`/supply-chain/contracts/create?supplier=${supplierId}`)}
              >
                Create New Contract
              </Button>
            </div>
            <Table
              columns={contractColumns}
              dataSource={contracts.list}
              rowKey="_id"
              pagination={{ pageSize: 10 }}
            />
          </TabPane>

          {/* Invoices Tab */}
          <TabPane 
            tab={
              <span>
                <FileTextOutlined />
                Invoices ({invoices.list.length})
              </span>
            } 
            key="invoices"
          >
            <Row gutter={16} style={{ marginBottom: '16px' }}>
              <Col span={6}>
                <Card size="small">
                  <Statistic
                    title="Total Invoices"
                    value={invoices.summary.total}
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small">
                  <Statistic
                    title="Pending"
                    value={invoices.summary.pending}
                    valueStyle={{ color: '#faad14' }}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small">
                  <Statistic
                    title="Paid"
                    value={invoices.summary.paid}
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small">
                  <Statistic
                    title="Total Amount"
                    value={invoices.summary.totalInvoiced}
                    precision={0}
                    prefix="XAF"
                    valueStyle={{ color: '#722ed1' }}
                  />
                </Card>
              </Col>
            </Row>
            <Table
              columns={invoiceColumns}
              dataSource={invoices.list}
              rowKey="_id"
              pagination={{ pageSize: 10 }}
            />
          </TabPane>

          {/* Performance Tab */}
          <TabPane 
            tab={
              <span>
                <StarOutlined />
                Performance ({performance.evaluations.length})
              </span>
            } 
            key="performance"
          >
            {performance.summary.evaluationCount > 0 ? (
              <>
                <Row gutter={16} style={{ marginBottom: '16px' }}>
                  <Col span={8}>
                    <Card>
                      <Statistic
                        title="Average Score"
                        value={performance.summary.averageScore}
                        suffix="%"
                        precision={1}
                        valueStyle={{ 
                          color: performance.summary.averageScore >= 80 ? '#52c41a' : '#faad14' 
                        }}
                      />
                    </Card>
                  </Col>
                  <Col span={8}>
                    <Card>
                      <Statistic
                        title="Latest Score"
                        value={performance.summary.latestScore}
                        suffix="%"
                        precision={1}
                      />
                    </Card>
                  </Col>
                  <Col span={8}>
                    <Card>
                      <Statistic
                        title="Evaluations"
                        value={performance.summary.evaluationCount}
                      />
                    </Card>
                  </Col>
                </Row>
                <Table
                  columns={performanceColumns}
                  dataSource={performance.evaluations}
                  rowKey="_id"
                  pagination={{ pageSize: 10 }}
                />
              </>
            ) : (
              <Alert
                message="No Performance Evaluations"
                description="This supplier has not been evaluated yet. Performance evaluations are automatically created when contracts are completed."
                type="info"
                showIcon
              />
            )}
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
};

export default UnifiedSupplierProfile;