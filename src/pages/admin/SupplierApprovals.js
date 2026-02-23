// pages/admin/SupplierApprovals.jsx - COMPLETE WITH FIXED FILE HANDLING

import React, { useState, useEffect } from 'react';
import {
  Card, Table, Button, Modal, Form, Input, Tag, Space, 
  Typography, Descriptions, Timeline, message, Radio, Row, Col,
  Statistic, Tabs, Alert
} from 'antd';
import {
  CheckCircleOutlined, CloseCircleOutlined, 
  ClockCircleOutlined, ShopOutlined,
  PhoneOutlined, MailOutlined,
  BankOutlined, FileTextOutlined, GlobalOutlined,
  EyeOutlined, DownloadOutlined
} from '@ant-design/icons';
import UnifiedSupplierAPI from '../../services/unifiedSupplierAPI';

const { Title, Text } = Typography;
const { TextArea } = Input;

const SupplierApprovals = () => {
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [approvalModalVisible, setApprovalModalVisible] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [statistics, setStatistics] = useState({
    pending: 0,
    pending_supply_chain: 0,
    pending_head_of_business: 0,
    pending_finance: 0,
    approved: 0,
    rejected: 0
  });
  const [form] = Form.useForm();

  useEffect(() => {
    fetchPendingApprovals();
    fetchStatistics();
  }, []);

  // SIMPLIFIED FILE HANDLING - uses API helper methods
  const viewFile = (fileData) => {
    if (!fileData) {
      message.error('File not available');
      return;
    }

    const viewUrl = UnifiedSupplierAPI.getFileViewUrl(fileData);
    if (viewUrl) {
      window.open(viewUrl, '_blank');
    } else {
      message.error('No file URL available');
    }
  };

  const downloadFile = (fileData, defaultName = 'document') => {
    if (!fileData) {
      message.error('File not available');
      return;
    }

    const downloadUrl = UnifiedSupplierAPI.getFileDownloadUrl(fileData);
    if (downloadUrl) {
      // Open in new window for download
      window.open(downloadUrl, '_blank');
      message.success(`Downloading ${typeof fileData === 'object' && fileData.name ? fileData.name : defaultName}`);
    } else {
      message.error('No download URL available');
    }
  };

  // const fetchPendingApprovals = async () => {
  //   try {
  //     setLoading(true);
  //     const response = await UnifiedSupplierAPI.getPendingApprovals();
      
  //     if (response.success) {
  //       setPendingApprovals(response.data);
  //     }
  //   } catch (error) {
  //     console.error('Error fetching pending approvals:', error);
  //     message.error(error.message || 'Failed to fetch pending approvals');
  //   } finally {
  //     setLoading(false);
  //   }
  // };


  const fetchPendingApprovals = async () => {
    try {
      setLoading(true);
      console.log('Fetching pending approvals...');
      
      const response = await UnifiedSupplierAPI.getPendingApprovals();
      
      console.log('API Response:', response);
      
      if (response.success) {
        console.log(`Received ${response.data.length} pending suppliers`);
        setPendingApprovals(response.data);
      } else {
        message.error(response.message || 'Failed to fetch approvals');
      }
    } catch (error) {
      console.error('Error fetching pending approvals:', error);
      message.error(error.message || 'Failed to fetch pending approvals');
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await UnifiedSupplierAPI.getApprovalStatistics();
      
      if (response.success) {
        setStatistics(response.data);
      }
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  const handleApprovalAction = (supplier) => {
    setSelectedSupplier(supplier);
    
    form.setFieldsValue({
      decision: 'approved',
      comments: ''
    });
    
    setApprovalModalVisible(true);
  };

  const handleSubmitApproval = async (values) => {
    try {
      setLoading(true);
      
      const response = await UnifiedSupplierAPI.processApproval(
        selectedSupplier._id,
        values
      );
      
      if (response.success) {
        message.success(response.message);
        setApprovalModalVisible(false);
        form.resetFields();
        setSelectedSupplier(null);
        fetchPendingApprovals();
        fetchStatistics();
      } else {
        message.error(response.message || 'Failed to process approval');
      }
    } catch (error) {
      console.error('Error processing approval:', error);
      message.error(error.message || 'Failed to process approval');
    } finally {
      setLoading(false);
    }
  };

  const getStatusTag = (status) => {
    const statusMap = {
      'pending': { color: 'orange', text: 'Pending Review' },
      'pending_supply_chain': { color: 'orange', text: 'Pending Supply Chain' },
      'pending_head_of_business': { color: 'blue', text: 'Pending Executive' },
      'pending_finance': { color: 'purple', text: 'Pending Finance' },
      'approved': { color: 'green', text: 'Approved' },
      'rejected': { color: 'red', text: 'Rejected' },
      'suspended': { color: 'volcano', text: 'Suspended' },
      'inactive': { color: 'default', text: 'Inactive' }
    };
    
    const config = statusMap[status] || { color: 'default', text: status };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const getSupplierTypeTag = (type) => {
    const colors = {
      'General': 'default',
      'Supply Chain': 'blue',
      'HR/Admin': 'purple',
      'Operations': 'cyan',
      'HSE': 'orange',
      'Refurbishment': 'geekblue',
      'IT Services': 'magenta',
      'Construction': 'gold'
    };
    
    return <Tag color={colors[type] || 'default'}>{type}</Tag>;
  };

  // Helper to render document card
  // const renderDocumentCard = (doc, title, icon) => {
  //   if (!doc) return null;

  //   return (
  //     <Col span={12} key={title}>
  //       <Card size="small" style={{ textAlign: 'center' }}>
  //         {icon}
  //         <h4>{title}</h4>
  //         <Space>
  //           <Button 
  //             type="primary" 
  //             icon={<EyeOutlined />}
  //             onClick={() => viewFile(doc)}
  //           >
  //             View
  //           </Button>
  //           <Button 
  //             icon={<DownloadOutlined />}
  //             onClick={() => downloadFile(doc, title.toLowerCase().replace(/ /g, '-'))}
  //           >
  //             Download
  //           </Button>
  //         </Space>
  //       </Card>
  //     </Col>
  //   );
  // };


  const renderDocumentCard = (doc, title, icon) => {
  if (!doc) {
    console.log(`No document for ${title}`);
    return null;
  }

  console.log(`Rendering ${title}:`, doc);

  return (
    <Col span={12} key={title}>
      <Card size="small" style={{ textAlign: 'center' }}>
        {icon}
        <h4>{title}</h4>
        <Space>
          <Button 
            type="primary" 
            icon={<EyeOutlined />}
            onClick={() => viewFile(doc)}
          >
            View
          </Button>
          <Button 
            icon={<DownloadOutlined />}
            onClick={() => downloadFile(doc, title.toLowerCase().replace(/ /g, '-'))}
          >
            Download
          </Button>
        </Space>
      </Card>
    </Col>
  );
};

  const columns = [
    {
      title: 'Company Name',
      key: 'company',
      render: (_, record) => (
        <div>
          <Text strong>{record.supplierDetails?.companyName}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.supplierDetails?.contactName}
          </Text>
        </div>
      )
    },
    {
      title: 'Supplier Type',
      dataIndex: ['supplierDetails', 'supplierType'],
      key: 'supplierType',
      render: (type) => getSupplierTypeTag(type)
    },
    {
      title: 'Business Type',
      dataIndex: ['supplierDetails', 'businessType'],
      key: 'businessType',
      render: (type) => type || 'N/A'
    },
    {
      title: 'Contact Info',
      key: 'contact',
      render: (_, record) => (
        <div>
          <Text style={{ fontSize: '12px' }}>
            <MailOutlined /> {record.email}
          </Text>
          <br />
          <Text style={{ fontSize: '12px' }}>
            <PhoneOutlined /> {record.supplierDetails?.phoneNumber}
          </Text>
        </div>
      )
    },
    {
      title: 'Registration',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => new Date(date).toLocaleDateString()
    },
    {
      title: 'Status',
      dataIndex: ['supplierStatus', 'accountStatus'],
      key: 'status',
      render: (status) => getStatusTag(status)
    },
    {
      title: 'Progress',
      key: 'progress',
      render: (_, record) => {
        const progress = record.approvalProgress || 0;
        return (
          <div>
            <Text style={{ fontSize: '12px' }}>{progress}%</Text>
            <div style={{ 
              width: '60px', 
              height: '4px', 
              background: '#f0f0f0', 
              borderRadius: '2px',
              marginTop: '4px'
            }}>
              <div style={{
                width: `${progress}%`,
                height: '100%',
                background: progress === 100 ? '#52c41a' : '#1890ff',
                borderRadius: '2px'
              }} />
            </div>
          </div>
        );
      }
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button
          type="primary"
          icon={<CheckCircleOutlined />}
          onClick={() => handleApprovalAction(record)}
        >
          Review
        </Button>
      )
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      {/* Statistics Cards */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col span={4}>
          <Card>
            <Statistic
              title="Total Pending"
              value={statistics.pending}
              valueStyle={{ color: '#faad14' }}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={5}>
          <Card>
            <Statistic
              title="Supply Chain Review"
              value={statistics.pending_supply_chain}
              valueStyle={{ color: '#ff7a45' }}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={5}>
          <Card>
            <Statistic
              title="Executive Approval"
              value={statistics.pending_head_of_business}
              valueStyle={{ color: '#1890ff' }}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={5}>
          <Card>
            <Statistic
              title="Finance Approval"
              value={statistics.pending_finance}
              valueStyle={{ color: '#722ed1' }}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={5}>
          <Card>
            <Statistic
              title="Approved"
              value={statistics.approved}
              valueStyle={{ color: '#52c41a' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Card>
        <Title level={2}>
          <ShopOutlined /> Supplier Approvals
        </Title>
        
        <Table
          columns={columns}
          dataSource={pendingApprovals}
          loading={loading}
          rowKey="_id"
          pagination={{
            showTotal: (total) => `${total} suppliers awaiting approval`
          }}
        />
      </Card>

      {/* Approval Modal */}
      <Modal
        title="Supplier Approval Review"
        open={approvalModalVisible}
        onCancel={() => {
          setApprovalModalVisible(false);
          form.resetFields();
          setSelectedSupplier(null);
        }}
        footer={null}
        width={900}
      >
        {selectedSupplier && (
          <div>
            <Tabs defaultActiveKey="1">
              <Tabs.TabPane tab="Company Information" key="1">
                <Descriptions bordered column={2} size="small">
                  <Descriptions.Item label="Company Name" span={2}>
                    <Text strong>{selectedSupplier.supplierDetails?.companyName}</Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="Contact Person">
                    {selectedSupplier.supplierDetails?.contactName}
                  </Descriptions.Item>
                  <Descriptions.Item label="Email">
                    {selectedSupplier.email}
                  </Descriptions.Item>
                  <Descriptions.Item label="Phone Number">
                    {selectedSupplier.supplierDetails?.phoneNumber}
                  </Descriptions.Item>
                  <Descriptions.Item label="Alternate Phone">
                    {selectedSupplier.supplierDetails?.alternatePhone || 'N/A'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Supplier Type" span={2}>
                    {getSupplierTypeTag(selectedSupplier.supplierDetails?.supplierType)}
                  </Descriptions.Item>
                  <Descriptions.Item label="Business Type" span={2}>
                    {selectedSupplier.supplierDetails?.businessType || 'N/A'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Registration Number" span={2}>
                    {selectedSupplier.supplierDetails?.businessRegistrationNumber || 'N/A'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Tax ID">
                    {selectedSupplier.supplierDetails?.taxIdNumber || 'N/A'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Established Year">
                    {selectedSupplier.supplierDetails?.establishedYear || 'N/A'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Employee Count" span={2}>
                    {selectedSupplier.supplierDetails?.employeeCount || 'N/A'}
                  </Descriptions.Item>
                  {selectedSupplier.supplierDetails?.website && (
                    <Descriptions.Item label="Website" span={2}>
                      <a href={selectedSupplier.supplierDetails.website} target="_blank" rel="noopener noreferrer">
                        <GlobalOutlined /> {selectedSupplier.supplierDetails.website}
                      </a>
                    </Descriptions.Item>
                  )}
                  {selectedSupplier.supplierDetails?.businessDescription && (
                    <Descriptions.Item label="Business Description" span={2}>
                      {selectedSupplier.supplierDetails.businessDescription}
                    </Descriptions.Item>
                  )}
                </Descriptions>
              </Tabs.TabPane>

              <Tabs.TabPane tab="Address & Banking" key="2">
                <Descriptions bordered column={2} size="small">
                  <Descriptions.Item label="Street Address" span={2}>
                    {selectedSupplier.supplierDetails?.address?.street || 'N/A'}
                  </Descriptions.Item>
                  <Descriptions.Item label="City">
                    {selectedSupplier.supplierDetails?.address?.city || 'N/A'}
                  </Descriptions.Item>
                  <Descriptions.Item label="State">
                    {selectedSupplier.supplierDetails?.address?.state || 'N/A'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Country">
                    {selectedSupplier.supplierDetails?.address?.country || 'Cameroon'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Postal Code">
                    {selectedSupplier.supplierDetails?.address?.postalCode || 'N/A'}
                  </Descriptions.Item>
                </Descriptions>

                <Title level={5} style={{ marginTop: '20px', marginBottom: '12px' }}>
                  <BankOutlined /> Banking Information
                </Title>
                <Descriptions bordered column={2} size="small">
                  <Descriptions.Item label="Bank Name" span={2}>
                    {selectedSupplier.supplierDetails?.bankDetails?.bankName || 'N/A'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Account Number">
                    {selectedSupplier.supplierDetails?.bankDetails?.accountNumber || 'N/A'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Account Name">
                    {selectedSupplier.supplierDetails?.bankDetails?.accountName || 'N/A'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Payment Terms" span={2}>
                    {selectedSupplier.supplierDetails?.paymentTerms || '30 days NET'}
                  </Descriptions.Item>
                </Descriptions>
              </Tabs.TabPane>

              <Tabs.TabPane tab="Services & Documents" key="3">
                {selectedSupplier.supplierDetails?.servicesOffered && 
                 selectedSupplier.supplierDetails.servicesOffered.length > 0 && (
                  <div style={{ marginBottom: '20px' }}>
                    <Title level={5}>Services Offered</Title>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {selectedSupplier.supplierDetails.servicesOffered.map((service, index) => (
                        <Tag key={index} color="blue">{service}</Tag>
                      ))}
                    </div>
                  </div>
                )}

                <Title level={5}>Uploaded Documents</Title>
                <Row gutter={[16, 16]}>
                  {renderDocumentCard(
                    selectedSupplier.supplierDetails?.documents?.businessRegistrationCertificate,
                    'Business Registration Certificate',
                    <FileTextOutlined style={{ fontSize: '24px', color: '#52c41a', marginBottom: '8px' }} />
                  )}
                  
                  {renderDocumentCard(
                    selectedSupplier.supplierDetails?.documents?.taxClearanceCertificate,
                    'Tax Clearance Certificate',
                    <FileTextOutlined style={{ fontSize: '24px', color: '#1890ff', marginBottom: '8px' }} />
                  )}
                  
                  {renderDocumentCard(
                    selectedSupplier.supplierDetails?.documents?.bankStatement,
                    'Bank Statement',
                    <BankOutlined style={{ fontSize: '24px', color: '#722ed1', marginBottom: '8px' }} />
                  )}
                  
                  {renderDocumentCard(
                    selectedSupplier.supplierDetails?.documents?.insuranceCertificate,
                    'Insurance Certificate',
                    <FileTextOutlined style={{ fontSize: '24px', color: '#faad14', marginBottom: '8px' }} />
                  )}
                  
                  {selectedSupplier.supplierDetails?.documents?.additionalDocuments && 
                   selectedSupplier.supplierDetails.documents.additionalDocuments.length > 0 && (
                    <Col span={24}>
                      <Card size="small">
                        <h4>Additional Documents</h4>
                        <Space wrap>
                          {selectedSupplier.supplierDetails.documents.additionalDocuments.map((doc, index) => (
                            <Card key={index} size="small" style={{ textAlign: 'center', minWidth: '200px' }}>
                              <FileTextOutlined style={{ fontSize: '20px', marginBottom: '4px' }} />
                              <p style={{ margin: '4px 0', fontSize: '12px' }}>
                                {doc.name ? (doc.name.length > 30 ? doc.name.substring(0, 30) + '...' : doc.name) : `Document ${index + 1}`}
                              </p>
                              <Space>
                                <Button 
                                  size="small"
                                  type="primary" 
                                  icon={<EyeOutlined />}
                                  onClick={() => viewFile(doc)}
                                >
                                  View
                                </Button>
                                <Button 
                                  size="small"
                                  icon={<DownloadOutlined />}
                                  onClick={() => downloadFile(doc, `additional-document-${index + 1}`)}
                                >
                                  Download
                                </Button>
                              </Space>
                            </Card>
                          ))}
                        </Space>
                      </Card>
                    </Col>
                  )}
                  
                  {!selectedSupplier.supplierDetails?.documents?.businessRegistrationCertificate && 
                   !selectedSupplier.supplierDetails?.documents?.taxClearanceCertificate && 
                   !selectedSupplier.supplierDetails?.documents?.bankStatement && 
                   !selectedSupplier.supplierDetails?.documents?.insuranceCertificate && 
                   (!selectedSupplier.supplierDetails?.documents?.additionalDocuments || 
                    selectedSupplier.supplierDetails.documents.additionalDocuments.length === 0) && (
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
              </Tabs.TabPane>

              <Tabs.TabPane tab="Approval Progress" key="4">
                <Card size="small" title="Approval Timeline">
                  <Timeline>
                    {selectedSupplier.approvalChain?.map((step, index) => {
                      let color = 'gray';
                      let icon = <ClockCircleOutlined />;
                      
                      if (step.status === 'approved') {
                        color = 'green';
                        icon = <CheckCircleOutlined />;
                      } else if (step.status === 'rejected') {
                        color = 'red';
                        icon = <CloseCircleOutlined />;
                      } else if (step.status === 'pending') {
                        color = 'blue';
                      }

                      return (
                        <Timeline.Item key={index} color={color} dot={icon}>
                          <div>
                            <Text strong>Level {step.level}: {step.approver.name}</Text>
                            <br />
                            <Text type="secondary">{step.approver.role}</Text>
                            <br />
                            <Text type="secondary" style={{ fontSize: '12px' }}>
                              {step.approver.department}
                            </Text>
                            <br />
                            <Tag color={color} style={{ marginTop: '4px' }}>
                              {step.status.toUpperCase()}
                            </Tag>
                            {step.comments && (
                              <>
                                <br />
                                <Text type="secondary" style={{ fontSize: '12px', fontStyle: 'italic' }}>
                                  "{step.comments}"
                                </Text>
                              </>
                            )}
                            {step.actionDate && (
                              <>
                                <br />
                                <Text type="secondary" style={{ fontSize: '11px' }}>
                                  {new Date(step.actionDate).toLocaleString()}
                                </Text>
                              </>
                            )}
                          </div>
                        </Timeline.Item>
                      );
                    })}
                  </Timeline>
                </Card>
              </Tabs.TabPane>
            </Tabs>

            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmitApproval}
              style={{ marginTop: '24px' }}
            >
              <Form.Item
                name="decision"
                label="Decision"
                rules={[{ required: true, message: 'Please select a decision' }]}
              >
                <Radio.Group>
                  <Radio.Button value="approved" style={{ color: '#52c41a' }}>
                    <CheckCircleOutlined /> Approve
                  </Radio.Button>
                  <Radio.Button value="rejected" style={{ color: '#ff4d4f' }}>
                    <CloseCircleOutlined /> Reject
                  </Radio.Button>
                </Radio.Group>
              </Form.Item>

              <Form.Item
                name="comments"
                label="Comments"
                rules={[{ required: true, message: 'Please provide comments' }]}
              >
                <TextArea
                  rows={4}
                  placeholder="Provide your feedback or reason for decision..."
                  maxLength={500}
                  showCount
                />
              </Form.Item>

              <Form.Item>
                <Space>
                  <Button onClick={() => {
                    setApprovalModalVisible(false);
                    form.resetFields();
                    setSelectedSupplier(null);
                  }}>
                    Cancel
                  </Button>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={loading}
                    icon={<CheckCircleOutlined />}
                  >
                    Submit Decision
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default SupplierApprovals;








// // pages/admin/SupplierApprovals.jsx or pages/supply-chain/SupplierApprovals.jsx

// import React, { useState, useEffect } from 'react';
// import {
//   Card, Table, Button, Modal, Form, Input, Tag, Space, 
//   Typography, Descriptions, Timeline, message, Radio, Row, Col,
//   Statistic, Tabs, Alert
// } from 'antd';
// import {
//   CheckCircleOutlined, CloseCircleOutlined, 
//   ClockCircleOutlined, ShopOutlined,
//   PhoneOutlined, MailOutlined,
//   BankOutlined, FileTextOutlined, GlobalOutlined,
//   EyeOutlined, DownloadOutlined
// } from '@ant-design/icons';
// import UnifiedSupplierAPI from '../../services/unifiedSupplierAPI';

// const { Title, Text } = Typography;
// const { TextArea } = Input;

// const SupplierApprovals = () => {
//   const [pendingApprovals, setPendingApprovals] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [approvalModalVisible, setApprovalModalVisible] = useState(false);
//   const [selectedSupplier, setSelectedSupplier] = useState(null);
//   const [statistics, setStatistics] = useState({
//     pending: 0,
//     pending_supply_chain: 0,
//     pending_head_of_business: 0,
//     pending_finance: 0,
//     approved: 0,
//     rejected: 0
//   });
//   const [form] = Form.useForm();

//   useEffect(() => {
//     fetchPendingApprovals();
//     fetchStatistics();
//   }, []);

//   // Function to handle file downloads following project pattern
//   const downloadFile = async (fileData, fileName = 'document') => {
//     if (!fileData) {
//       message.error('File not available');
//       return;
//     }

//     try {
//       // Try secure download first
//       const publicId = typeof fileData === 'string' ? fileData : fileData.publicId;
      
//       if (publicId) {
//         // Check if it's a supplier document
//         if (publicId.startsWith('supplier_doc_')) {
//           // Use supplier-document route for supplier documents (public access)
//           const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5001'}/files/supplier-document/${publicId}`, {
//             method: 'GET',
//           });

//           if (response.ok) {
//             const blob = await response.blob();
//             const url = window.URL.createObjectURL(blob);
//             const link = document.createElement('a');
//             link.href = url;
//             link.download = (typeof fileData === 'object' && fileData.name) ? fileData.name : fileName;
//             document.body.appendChild(link);
//             link.click();
//             document.body.removeChild(link);
//             window.URL.revokeObjectURL(url);
//             message.success(`Downloaded ${(typeof fileData === 'object' && fileData.name) ? fileData.name : fileName}`);
//             return;
//           }
//         } else {
//           // Use download route for other files (requires auth)
//           const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5001'}/files/download/${publicId}`, {
//             method: 'GET',
//             headers: {
//               'Authorization': `Bearer ${localStorage.getItem('token')}`,
//             },
//           });

//           if (response.ok) {
//             const blob = await response.blob();
//             const url = window.URL.createObjectURL(blob);
//             const link = document.createElement('a');
//             link.href = url;
//             link.download = (typeof fileData === 'object' && fileData.name) ? fileData.name : fileName;
//             document.body.appendChild(link);
//             link.click();
//             document.body.removeChild(link);
//             window.URL.revokeObjectURL(url);
//             message.success(`Downloaded ${(typeof fileData === 'object' && fileData.name) ? fileData.name : fileName}`);
//             return;
//           }
//         }
//       }

//       // Fallback to direct URL for images (public access)
//       const extension = publicId ? publicId.split('.').pop().toLowerCase() : '';
//       let fileUrl;
      
//       if (publicId && publicId.startsWith('supplier_doc_')) {
//         // Use supplier-document route for supplier documents (public access)
//         fileUrl = `${process.env.REACT_APP_API_URL || 'http://localhost:5001'}/files/supplier-document/${publicId}`;
//       } else if (['png', 'jpg', 'jpeg', 'gif', 'bmp'].includes(extension)) {
//         // Use image route for images (no auth required)
//         fileUrl = typeof fileData === 'string' 
//           ? `${process.env.REACT_APP_API_URL || 'http://localhost:5001'}/files/image/${fileData}`
//           : fileData.publicId 
//             ? `${process.env.REACT_APP_API_URL || 'http://localhost:5001'}/files/image/${fileData.publicId}`
//             : fileData.url;
//       } else {
//         // For non-images, we need to use view route which requires auth - open in new tab
//         fileUrl = typeof fileData === 'string' 
//           ? `${process.env.REACT_APP_API_URL || 'http://localhost:5001'}/files/view/${fileData}`
//           : fileData.publicId 
//             ? `${process.env.REACT_APP_API_URL || 'http://localhost:5001'}/files/view/${fileData.publicId}`
//             : fileData.url;
//       }
      
//       if (fileUrl) {
//         window.open(fileUrl, '_blank');
//       } else {
//         message.error('No download URL available');
//       }
//     } catch (error) {
//       console.error('Error downloading file:', error);
//       message.error('Failed to download file');
//     }
//   };

//   // Function to view file inline
//   const viewFile = (fileData) => {
//     if (!fileData) {
//       message.error('File not available');
//       return;
//     }

//     // Determine the file URL based on file type and source
//     let fileUrl;
    
//     if (typeof fileData === 'string') {
//       // Legacy format - just filename
//       if (fileData.startsWith('supplier_doc_')) {
//         // Use supplier-document route for supplier documents (public access)
//         fileUrl = `${process.env.REACT_APP_API_URL || 'http://localhost:5001'}/files/supplier-document/${fileData}`;
//       } else {
//         const extension = fileData.split('.').pop().toLowerCase();
//         if (['png', 'jpg', 'jpeg', 'gif', 'bmp'].includes(extension)) {
//           // Use image route for images
//           fileUrl = `${process.env.REACT_APP_API_URL || 'http://localhost:5001'}/files/image/${fileData}`;
//         } else {
//           // Use view route for other files (requires auth)
//           fileUrl = `${process.env.REACT_APP_API_URL || 'http://localhost:5001'}/files/view/${fileData}`;
//         }
//       }
//     } else if (fileData.publicId) {
//       // New format - file object
//       if (fileData.publicId.startsWith('supplier_doc_')) {
//         // Use supplier-document route for supplier documents (public access)
//         fileUrl = `${process.env.REACT_APP_API_URL || 'http://localhost:5001'}/files/supplier-document/${fileData.publicId}`;
//       } else {
//         const extension = fileData.publicId.split('.').pop().toLowerCase();
//         if (['png', 'jpg', 'jpeg', 'gif', 'bmp'].includes(extension)) {
//           // Use image route for images
//           fileUrl = `${process.env.REACT_APP_API_URL || 'http://localhost:5001'}/files/image/${fileData.publicId}`;
//         } else {
//           // Use view route for other files (requires auth)
//           fileUrl = `${process.env.REACT_APP_API_URL || 'http://localhost:5001'}/files/view/${fileData.publicId}`;
//         }
//       }
//     } else if (fileData.url) {
//       fileUrl = fileData.url;
//     }
    
//     if (fileUrl) {
//       window.open(fileUrl, '_blank');
//     } else {
//       message.error('No file URL available');
//     }
//   };

//   const fetchPendingApprovals = async () => {
//     try {
//       setLoading(true);
//       const response = await UnifiedSupplierAPI.getPendingApprovals();
      
//       if (response.success) {
//         setPendingApprovals(response.data);
//       }
//     } catch (error) {
//       console.error('Error fetching pending approvals:', error);
//       message.error(error.message || 'Failed to fetch pending approvals');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const fetchStatistics = async () => {
//     try {
//       const response = await UnifiedSupplierAPI.getApprovalStatistics();
      
//       if (response.success) {
//         setStatistics(response.data);
//       }
//     } catch (error) {
//       console.error('Error fetching statistics:', error);
//     }
//   };

//   const handleApprovalAction = (supplier) => {
//     setSelectedSupplier(supplier);
    
//     form.setFieldsValue({
//       decision: 'approved',
//       comments: ''
//     });
    
//     setApprovalModalVisible(true);
//   };

//   const handleSubmitApproval = async (values) => {
//     try {
//       setLoading(true);
      
//       const response = await UnifiedSupplierAPI.processApproval(
//         selectedSupplier._id,
//         values
//       );
      
//       if (response.success) {
//         message.success(response.message);
//         setApprovalModalVisible(false);
//         form.resetFields();
//         setSelectedSupplier(null);
//         fetchPendingApprovals();
//         fetchStatistics();
//       } else {
//         message.error(response.message || 'Failed to process approval');
//       }
//     } catch (error) {
//       console.error('Error processing approval:', error);
//       message.error(error.message || 'Failed to process approval');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const getStatusTag = (status) => {
//     const statusMap = {
//       'pending': { color: 'orange', text: 'Pending Review' },
//       'pending_supply_chain': { color: 'orange', text: 'Pending Supply Chain' },
//       'pending_head_of_business': { color: 'blue', text: 'Pending Executive' },
//       'pending_finance': { color: 'purple', text: 'Pending Finance' },
//       'approved': { color: 'green', text: 'Approved' },
//       'rejected': { color: 'red', text: 'Rejected' },
//       'suspended': { color: 'volcano', text: 'Suspended' },
//       'inactive': { color: 'default', text: 'Inactive' }
//     };
    
//     const config = statusMap[status] || { color: 'default', text: status };
//     return <Tag color={config.color}>{config.text}</Tag>;
//   };

//   const getSupplierTypeTag = (type) => {
//     const colors = {
//       'General': 'default',
//       'Supply Chain': 'blue',
//       'HR/Admin': 'purple',
//       'Operations': 'cyan',
//       'HSE': 'orange',
//       'Refurbishment': 'geekblue',
//       'IT Services': 'magenta',
//       'Construction': 'gold'
//     };
    
//     return <Tag color={colors[type] || 'default'}>{type}</Tag>;
//   };

//   const columns = [
//     {
//       title: 'Company Name',
//       key: 'company',
//       render: (_, record) => (
//         <div>
//           <Text strong>{record.supplierDetails?.companyName}</Text>
//           <br />
//           <Text type="secondary" style={{ fontSize: '12px' }}>
//             {record.supplierDetails?.contactName}
//           </Text>
//         </div>
//       )
//     },
//     {
//       title: 'Supplier Type',
//       dataIndex: ['supplierDetails', 'supplierType'],
//       key: 'supplierType',
//       render: (type) => getSupplierTypeTag(type)
//     },
//     {
//       title: 'Business Type',
//       dataIndex: ['supplierDetails', 'businessType'],
//       key: 'businessType',
//       render: (type) => type || 'N/A'
//     },
//     {
//       title: 'Contact Info',
//       key: 'contact',
//       render: (_, record) => (
//         <div>
//           <Text style={{ fontSize: '12px' }}>
//             <MailOutlined /> {record.email}
//           </Text>
//           <br />
//           <Text style={{ fontSize: '12px' }}>
//             <PhoneOutlined /> {record.supplierDetails?.phoneNumber}
//           </Text>
//         </div>
//       )
//     },
//     {
//       title: 'Registration',
//       dataIndex: 'createdAt',
//       key: 'createdAt',
//       render: (date) => new Date(date).toLocaleDateString()
//     },
//     {
//       title: 'Status',
//       dataIndex: ['supplierStatus', 'accountStatus'],
//       key: 'status',
//       render: (status) => getStatusTag(status)
//     },
//     {
//       title: 'Progress',
//       key: 'progress',
//       render: (_, record) => {
//         const progress = record.approvalProgress || 0;
//         return (
//           <div>
//             <Text style={{ fontSize: '12px' }}>{progress}%</Text>
//             <div style={{ 
//               width: '60px', 
//               height: '4px', 
//               background: '#f0f0f0', 
//               borderRadius: '2px',
//               marginTop: '4px'
//             }}>
//               <div style={{
//                 width: `${progress}%`,
//                 height: '100%',
//                 background: progress === 100 ? '#52c41a' : '#1890ff',
//                 borderRadius: '2px'
//               }} />
//             </div>
//           </div>
//         );
//       }
//     },
//     {
//       title: 'Actions',
//       key: 'actions',
//       render: (_, record) => (
//         <Button
//           type="primary"
//           icon={<CheckCircleOutlined />}
//           onClick={() => handleApprovalAction(record)}
//         >
//           Review
//         </Button>
//       )
//     }
//   ];

//   return (
//     <div style={{ padding: '24px' }}>
//       {/* Statistics Cards */}
//       <Row gutter={16} style={{ marginBottom: '24px' }}>
//         <Col span={4}>
//           <Card>
//             <Statistic
//               title="Total Pending"
//               value={statistics.pending}
//               valueStyle={{ color: '#faad14' }}
//               prefix={<ClockCircleOutlined />}
//             />
//           </Card>
//         </Col>
//         <Col span={5}>
//           <Card>
//             <Statistic
//               title="Supply Chain Review"
//               value={statistics.pending_supply_chain}
//               valueStyle={{ color: '#ff7a45' }}
//               prefix={<ClockCircleOutlined />}
//             />
//           </Card>
//         </Col>
//         <Col span={5}>
//           <Card>
//             <Statistic
//               title="Executive Approval"
//               value={statistics.pending_head_of_business}
//               valueStyle={{ color: '#1890ff' }}
//               prefix={<ClockCircleOutlined />}
//             />
//           </Card>
//         </Col>
//         <Col span={5}>
//           <Card>
//             <Statistic
//               title="Finance Approval"
//               value={statistics.pending_finance}
//               valueStyle={{ color: '#722ed1' }}
//               prefix={<ClockCircleOutlined />}
//             />
//           </Card>
//         </Col>
//         <Col span={5}>
//           <Card>
//             <Statistic
//               title="Approved"
//               value={statistics.approved}
//               valueStyle={{ color: '#52c41a' }}
//               prefix={<CheckCircleOutlined />}
//             />
//           </Card>
//         </Col>
//       </Row>

//       <Card>
//         <Title level={2}>
//           <ShopOutlined /> Supplier Approvals
//         </Title>
        
//         <Table
//           columns={columns}
//           dataSource={pendingApprovals}
//           loading={loading}
//           rowKey="_id"
//           pagination={{
//             showTotal: (total) => `${total} suppliers awaiting approval`
//           }}
//         />
//       </Card>

//       {/* Approval Modal */}
//       <Modal
//         title="Supplier Approval Review"
//         open={approvalModalVisible}
//         onCancel={() => {
//           setApprovalModalVisible(false);
//           form.resetFields();
//           setSelectedSupplier(null);
//         }}
//         footer={null}
//         width={900}
//       >
//         {selectedSupplier && (
//           <div>
//             <Tabs defaultActiveKey="1">
//               <Tabs.TabPane tab="Company Information" key="1">
//                 <Descriptions bordered column={2} size="small">
//                   <Descriptions.Item label="Company Name" span={2}>
//                     <Text strong>{selectedSupplier.supplierDetails?.companyName}</Text>
//                   </Descriptions.Item>
//                   <Descriptions.Item label="Contact Person">
//                     {selectedSupplier.supplierDetails?.contactName}
//                   </Descriptions.Item>
//                   <Descriptions.Item label="Email">
//                     {selectedSupplier.email}
//                   </Descriptions.Item>
//                   <Descriptions.Item label="Phone Number">
//                     {selectedSupplier.supplierDetails?.phoneNumber}
//                   </Descriptions.Item>
//                   <Descriptions.Item label="Alternate Phone">
//                     {selectedSupplier.supplierDetails?.alternatePhone || 'N/A'}
//                   </Descriptions.Item>
//                   <Descriptions.Item label="Supplier Type" span={2}>
//                     {getSupplierTypeTag(selectedSupplier.supplierDetails?.supplierType)}
//                   </Descriptions.Item>
//                   <Descriptions.Item label="Business Type" span={2}>
//                     {selectedSupplier.supplierDetails?.businessType || 'N/A'}
//                   </Descriptions.Item>
//                   <Descriptions.Item label="Registration Number" span={2}>
//                     {selectedSupplier.supplierDetails?.businessRegistrationNumber || 'N/A'}
//                   </Descriptions.Item>
//                   <Descriptions.Item label="Tax ID">
//                     {selectedSupplier.supplierDetails?.taxIdNumber || 'N/A'}
//                   </Descriptions.Item>
//                   <Descriptions.Item label="Established Year">
//                     {selectedSupplier.supplierDetails?.establishedYear || 'N/A'}
//                   </Descriptions.Item>
//                   <Descriptions.Item label="Employee Count" span={2}>
//                     {selectedSupplier.supplierDetails?.employeeCount || 'N/A'}
//                   </Descriptions.Item>
//                   {selectedSupplier.supplierDetails?.website && (
//                     <Descriptions.Item label="Website" span={2}>
//                       <a href={selectedSupplier.supplierDetails.website} target="_blank" rel="noopener noreferrer">
//                         <GlobalOutlined /> {selectedSupplier.supplierDetails.website}
//                       </a>
//                     </Descriptions.Item>
//                   )}
//                   {selectedSupplier.supplierDetails?.businessDescription && (
//                     <Descriptions.Item label="Business Description" span={2}>
//                       {selectedSupplier.supplierDetails.businessDescription}
//                     </Descriptions.Item>
//                   )}
//                 </Descriptions>
//               </Tabs.TabPane>

//               <Tabs.TabPane tab="Address & Banking" key="2">
//                 <Descriptions bordered column={2} size="small">
//                   <Descriptions.Item label="Street Address" span={2}>
//                     {selectedSupplier.supplierDetails?.address?.street || 'N/A'}
//                   </Descriptions.Item>
//                   <Descriptions.Item label="City">
//                     {selectedSupplier.supplierDetails?.address?.city || 'N/A'}
//                   </Descriptions.Item>
//                   <Descriptions.Item label="State">
//                     {selectedSupplier.supplierDetails?.address?.state || 'N/A'}
//                   </Descriptions.Item>
//                   <Descriptions.Item label="Country">
//                     {selectedSupplier.supplierDetails?.address?.country || 'Cameroon'}
//                   </Descriptions.Item>
//                   <Descriptions.Item label="Postal Code">
//                     {selectedSupplier.supplierDetails?.address?.postalCode || 'N/A'}
//                   </Descriptions.Item>
//                 </Descriptions>

//                 <Title level={5} style={{ marginTop: '20px', marginBottom: '12px' }}>
//                   <BankOutlined /> Banking Information
//                 </Title>
//                 <Descriptions bordered column={2} size="small">
//                   <Descriptions.Item label="Bank Name" span={2}>
//                     {selectedSupplier.supplierDetails?.bankDetails?.bankName || 'N/A'}
//                   </Descriptions.Item>
//                   <Descriptions.Item label="Account Number">
//                     {selectedSupplier.supplierDetails?.bankDetails?.accountNumber || 'N/A'}
//                   </Descriptions.Item>
//                   <Descriptions.Item label="Account Name">
//                     {selectedSupplier.supplierDetails?.bankDetails?.accountName || 'N/A'}
//                   </Descriptions.Item>
//                   <Descriptions.Item label="Payment Terms" span={2}>
//                     {selectedSupplier.supplierDetails?.paymentTerms || '30 days NET'}
//                   </Descriptions.Item>
//                 </Descriptions>
//               </Tabs.TabPane>

//               <Tabs.TabPane tab="Services & Documents" key="3">
//                 {selectedSupplier.supplierDetails?.servicesOffered && 
//                  selectedSupplier.supplierDetails.servicesOffered.length > 0 && (
//                   <div style={{ marginBottom: '20px' }}>
//                     <Title level={5}>Services Offered</Title>
//                     <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
//                       {selectedSupplier.supplierDetails.servicesOffered.map((service, index) => (
//                         <Tag key={index} color="blue">{service}</Tag>
//                       ))}
//                     </div>
//                   </div>
//                 )}

//                 <Title level={5}>Uploaded Documents</Title>
//                 <Row gutter={[16, 16]}>
//                   {selectedSupplier.supplierDetails?.documents?.businessRegistrationCertificate && (
//                     <Col span={12}>
//                       <Card size="small" style={{ textAlign: 'center' }}>
//                         <FileTextOutlined style={{ fontSize: '24px', color: '#52c41a', marginBottom: '8px' }} />
//                         <h4>Business Registration Certificate</h4>
//                         <Space>
//                           <Button 
//                             type="primary" 
//                             icon={<EyeOutlined />}
//                             onClick={() => viewFile(selectedSupplier.supplierDetails.documents.businessRegistrationCertificate)}
//                           >
//                             View
//                           </Button>
//                           <Button 
//                             icon={<DownloadOutlined />}
//                             onClick={() => downloadFile(selectedSupplier.supplierDetails.documents.businessRegistrationCertificate, 'business-registration-certificate')}
//                           >
//                             Download
//                           </Button>
//                         </Space>
//                       </Card>
//                     </Col>
//                   )}
                  
//                   {selectedSupplier.supplierDetails?.documents?.taxClearanceCertificate && (
//                     <Col span={12}>
//                       <Card size="small" style={{ textAlign: 'center' }}>
//                         <FileTextOutlined style={{ fontSize: '24px', color: '#1890ff', marginBottom: '8px' }} />
//                         <h4>Tax Clearance Certificate</h4>
//                         <Space>
//                           <Button 
//                             type="primary" 
//                             icon={<EyeOutlined />}
//                             onClick={() => viewFile(selectedSupplier.supplierDetails.documents.taxClearanceCertificate)}
//                           >
//                             View
//                           </Button>
//                           <Button 
//                             icon={<DownloadOutlined />}
//                             onClick={() => downloadFile(selectedSupplier.supplierDetails.documents.taxClearanceCertificate, 'tax-clearance-certificate')}
//                           >
//                             Download
//                           </Button>
//                         </Space>
//                       </Card>
//                     </Col>
//                   )}
                  
//                   {selectedSupplier.supplierDetails?.documents?.bankStatement && (
//                     <Col span={12}>
//                       <Card size="small" style={{ textAlign: 'center' }}>
//                         <BankOutlined style={{ fontSize: '24px', color: '#722ed1', marginBottom: '8px' }} />
//                         <h4>Bank Statement</h4>
//                         <Space>
//                           <Button 
//                             type="primary" 
//                             icon={<EyeOutlined />}
//                             onClick={() => viewFile(selectedSupplier.supplierDetails.documents.bankStatement)}
//                           >
//                             View
//                           </Button>
//                           <Button 
//                             icon={<DownloadOutlined />}
//                             onClick={() => downloadFile(selectedSupplier.supplierDetails.documents.bankStatement, 'bank-statement')}
//                           >
//                             Download
//                           </Button>
//                         </Space>
//                       </Card>
//                     </Col>
//                   )}
                  
//                   {selectedSupplier.supplierDetails?.documents?.insuranceCertificate && (
//                     <Col span={12}>
//                       <Card size="small" style={{ textAlign: 'center' }}>
//                         <FileTextOutlined style={{ fontSize: '24px', color: '#faad14', marginBottom: '8px' }} />
//                         <h4>Insurance Certificate</h4>
//                         <Space>
//                           <Button 
//                             type="primary" 
//                             icon={<EyeOutlined />}
//                             onClick={() => viewFile(selectedSupplier.supplierDetails.documents.insuranceCertificate)}
//                           >
//                             View
//                           </Button>
//                           <Button 
//                             icon={<DownloadOutlined />}
//                             onClick={() => downloadFile(selectedSupplier.supplierDetails.documents.insuranceCertificate, 'insurance-certificate')}
//                           >
//                             Download
//                           </Button>
//                         </Space>
//                       </Card>
//                     </Col>
//                   )}
                  
//                   {selectedSupplier.supplierDetails?.documents?.additionalDocuments && 
//                    selectedSupplier.supplierDetails.documents.additionalDocuments.length > 0 && (
//                     <Col span={24}>
//                       <Card size="small">
//                         <h4>Additional Documents</h4>
//                         <Space wrap>
//                           {selectedSupplier.supplierDetails.documents.additionalDocuments.map((doc, index) => (
//                             <Card key={index} size="small" style={{ textAlign: 'center', minWidth: '200px' }}>
//                               <FileTextOutlined style={{ fontSize: '20px', marginBottom: '4px' }} />
//                               <p style={{ margin: '4px 0', fontSize: '12px' }}>
//                                 {doc.name ? (doc.name.length > 30 ? doc.name.substring(0, 30) + '...' : doc.name) : `Document ${index + 1}`}
//                               </p>
//                               <Space>
//                                 <Button 
//                                   size="small"
//                                   type="primary" 
//                                   icon={<EyeOutlined />}
//                                   onClick={() => viewFile(doc)}
//                                 >
//                                   View
//                                 </Button>
//                                 <Button 
//                                   size="small"
//                                   icon={<DownloadOutlined />}
//                                   onClick={() => downloadFile(doc, `additional-document-${index + 1}`)}
//                                 >
//                                   Download
//                                 </Button>
//                               </Space>
//                             </Card>
//                           ))}
//                         </Space>
//                       </Card>
//                     </Col>
//                   )}
                  
//                   {!selectedSupplier.supplierDetails?.documents?.businessRegistrationCertificate && 
//                    !selectedSupplier.supplierDetails?.documents?.taxClearanceCertificate && 
//                    !selectedSupplier.supplierDetails?.documents?.bankStatement && 
//                    !selectedSupplier.supplierDetails?.documents?.insuranceCertificate && 
//                    (!selectedSupplier.supplierDetails?.documents?.additionalDocuments || 
//                     selectedSupplier.supplierDetails.documents.additionalDocuments.length === 0) && (
//                     <Col span={24}>
//                       <Alert 
//                         message="No documents uploaded" 
//                         description="This supplier has not uploaded any documents yet." 
//                         type="info" 
//                         showIcon 
//                       />
//                     </Col>
//                   )}
//                 </Row>
//               </Tabs.TabPane>

//               <Tabs.TabPane tab="Approval Progress" key="4">
//                 <Card size="small" title="Approval Timeline">
//                   <Timeline>
//                     {selectedSupplier.approvalChain?.map((step, index) => {
//                       let color = 'gray';
//                       let icon = <ClockCircleOutlined />;
                      
//                       if (step.status === 'approved') {
//                         color = 'green';
//                         icon = <CheckCircleOutlined />;
//                       } else if (step.status === 'rejected') {
//                         color = 'red';
//                         icon = <CloseCircleOutlined />;
//                       } else if (step.status === 'pending') {
//                         color = 'blue';
//                       }

//                       return (
//                         <Timeline.Item key={index} color={color} dot={icon}>
//                           <div>
//                             <Text strong>Level {step.level}: {step.approver.name}</Text>
//                             <br />
//                             <Text type="secondary">{step.approver.role}</Text>
//                             <br />
//                             <Text type="secondary" style={{ fontSize: '12px' }}>
//                               {step.approver.department}
//                             </Text>
//                             <br />
//                             <Tag color={color} style={{ marginTop: '4px' }}>
//                               {step.status.toUpperCase()}
//                             </Tag>
//                             {step.comments && (
//                               <>
//                                 <br />
//                                 <Text type="secondary" style={{ fontSize: '12px', fontStyle: 'italic' }}>
//                                   "{step.comments}"
//                                 </Text>
//                               </>
//                             )}
//                             {step.actionDate && (
//                               <>
//                                 <br />
//                                 <Text type="secondary" style={{ fontSize: '11px' }}>
//                                   {new Date(step.actionDate).toLocaleString()}
//                                 </Text>
//                               </>
//                             )}
//                           </div>
//                         </Timeline.Item>
//                       );
//                     })}
//                   </Timeline>
//                 </Card>
//               </Tabs.TabPane>
//             </Tabs>

//             <Form
//               form={form}
//               layout="vertical"
//               onFinish={handleSubmitApproval}
//               style={{ marginTop: '24px' }}
//             >
//               <Form.Item
//                 name="decision"
//                 label="Decision"
//                 rules={[{ required: true, message: 'Please select a decision' }]}
//               >
//                 <Radio.Group>
//                   <Radio.Button value="approved" style={{ color: '#52c41a' }}>
//                     <CheckCircleOutlined /> Approve
//                   </Radio.Button>
//                   <Radio.Button value="rejected" style={{ color: '#ff4d4f' }}>
//                     <CloseCircleOutlined /> Reject
//                   </Radio.Button>
//                 </Radio.Group>
//               </Form.Item>

//               <Form.Item
//                 name="comments"
//                 label="Comments"
//                 rules={[{ required: true, message: 'Please provide comments' }]}
//               >
//                 <TextArea
//                   rows={4}
//                   placeholder="Provide your feedback or reason for decision..."
//                   maxLength={500}
//                   showCount
//                 />
//               </Form.Item>

//               <Form.Item>
//                 <Space>
//                   <Button onClick={() => {
//                     setApprovalModalVisible(false);
//                     form.resetFields();
//                     setSelectedSupplier(null);
//                   }}>
//                     Cancel
//                   </Button>
//                   <Button
//                     type="primary"
//                     htmlType="submit"
//                     loading={loading}
//                     icon={<CheckCircleOutlined />}
//                   >
//                     Submit Decision
//                   </Button>
//                 </Space>
//               </Form.Item>
//             </Form>
//           </div>
//         )}
//       </Modal>
//     </div>
//   );
// };

// export default SupplierApprovals;



