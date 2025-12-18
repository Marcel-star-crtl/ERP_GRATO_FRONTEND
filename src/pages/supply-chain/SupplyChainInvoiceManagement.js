// import React, { useState, useEffect, useCallback } from 'react';
// import {
//   Card,
//   Table,
//   Button,
//   Modal,
//   Select,
//   Form,
//   Typography,
//   Tag,
//   Space,
//   Input,
//   Descriptions,
//   Alert,
//   message,
//   Popconfirm,
//   Tooltip,
//   Badge,
//   Checkbox,
//   Statistic,
//   Row,
//   Col,
//   notification
// } from 'antd';
// import {
//   FileTextOutlined,
//   SendOutlined,
//   CloseCircleOutlined,
//   CheckCircleOutlined,
//   ClockCircleOutlined,
//   EyeOutlined,
//   ReloadOutlined,
//   ShopOutlined,
//   TeamOutlined,
//   FilterOutlined,
//   FileOutlined
// } from '@ant-design/icons';
// import api from '../../services/api';

// const { Title, Text, Paragraph } = Typography;
// const { Option } = Select;
// const { TextArea } = Input;

// const SupplyChainInvoiceManagement = () => {
//   const [invoices, setInvoices] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [selectedInvoices, setSelectedInvoices] = useState([]);
//   const [assignModalVisible, setAssignModalVisible] = useState(false);
//   const [rejectModalVisible, setRejectModalVisible] = useState(false);
//   const [detailsModalVisible, setDetailsModalVisible] = useState(false);
//   const [selectedInvoice, setSelectedInvoice] = useState(null);
//   const [stats, setStats] = useState(null);
//   const [filters, setFilters] = useState({
//     serviceCategory: null,
//     supplierType: null
//   });
//   const [form] = Form.useForm();
//   const [rejectForm] = Form.useForm();

//   // Fetch pending invoices
//   const fetchPendingInvoices = useCallback(async () => {
//     try {
//       setLoading(true);
//       const params = new URLSearchParams();
      
//       if (filters.serviceCategory) params.append('serviceCategory', filters.serviceCategory);
//       if (filters.supplierType) params.append('supplierType', filters.supplierType);
      
//       const response = await api.get(`/suppliers/supply-chain/invoices/pending?${params}`);
      
//       if (response.data.success) {
//         setInvoices(response.data.data || []);
//       }
//     } catch (error) {
//       console.error('Error fetching invoices:', error);
//       message.error('Failed to fetch invoices');
//     } finally {
//       setLoading(false);
//     }
//   }, [filters]);

//   // Fetch dashboard stats
//   const fetchStats = useCallback(async () => {
//     try {
//       const response = await api.get('/suppliers/supply-chain/dashboard/stats');
//       if (response.data.success) {
//         setStats(response.data.data);
//       }
//     } catch (error) {
//       console.error('Error fetching stats:', error);
//     }
//   }, []);

//   useEffect(() => {
//     fetchPendingInvoices();
//     fetchStats();
//   }, [fetchPendingInvoices, fetchStats]);

//   // Handle single assignment
//   const handleAssign = async (values) => {
//     try {
//       setLoading(true);
      
//       if (selectedInvoices.length === 1) {
//         // Single assignment
//         const response = await api.post(`/suppliers/supply-chain/invoices/${selectedInvoices[0]}/assign`, {
//           department: values.department,
//           comments: values.comments
//         });
        
//         if (response.data.success) {
//           message.success('Invoice assigned successfully');
//         }
//       } else {
//         // Bulk assignment
//         const response = await api.post('/suppliers/supply-chain/invoices/bulk-assign', {
//           invoiceIds: selectedInvoices,
//           department: values.department,
//           comments: values.comments
//         });
        
//         if (response.data.success) {
//           const { successful, failed } = response.data.data;
//           notification.success({
//             message: 'Bulk Assignment Completed',
//             description: `${successful.length} invoice(s) assigned successfully. ${failed.length} failed.`,
//             duration: 5
//           });
//         }
//       }
      
//       setSelectedInvoices([]);
//       setAssignModalVisible(false);
//       form.resetFields();
//       fetchPendingInvoices();
//       fetchStats();
      
//     } catch (error) {
//       message.error(error.response?.data?.message || 'Failed to assign invoice');
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Handle rejection
//   const handleReject = async (values) => {
//     try {
//       setLoading(true);
      
//       const response = await api.post(`/suppliers/supply-chain/invoices/${selectedInvoice._id}/reject`, {
//         rejectionReason: values.rejectionReason
//       });
      
//       if (response.data.success) {
//         message.success('Invoice rejected successfully');
//         setRejectModalVisible(false);
//         setSelectedInvoice(null);
//         rejectForm.resetFields();
//         fetchPendingInvoices();
//         fetchStats();
//       }
//     } catch (error) {
//       message.error(error.response?.data?.message || 'Failed to reject invoice');
//     } finally {
//       setLoading(false);
//     }
//   };

//   // View invoice details
//   const handleViewDetails = async (invoice) => {
//     setSelectedInvoice(invoice);
//     setDetailsModalVisible(true);
//   };

//   const columns = [
//     {
//       title: (
//         <Checkbox
//           indeterminate={selectedInvoices.length > 0 && selectedInvoices.length < invoices.length}
//           checked={invoices.length > 0 && selectedInvoices.length === invoices.length}
//           onChange={(e) => {
//             if (e.target.checked) {
//               setSelectedInvoices(invoices.map(inv => inv._id));
//             } else {
//               setSelectedInvoices([]);
//             }
//           }}
//         />
//       ),
//       dataIndex: 'select',
//       key: 'select',
//       width: 50,
//       render: (_, record) => (
//         <Checkbox
//           checked={selectedInvoices.includes(record._id)}
//           onChange={(e) => {
//             if (e.target.checked) {
//               setSelectedInvoices([...selectedInvoices, record._id]);
//             } else {
//               setSelectedInvoices(selectedInvoices.filter(id => id !== record._id));
//             }
//           }}
//         />
//       )
//     },
//     {
//       title: 'PO Number',
//       dataIndex: 'poNumber',
//       key: 'poNumber',
//       render: (text) => <Text code>{text}</Text>,
//       width: 150
//     },
//     {
//       title: 'Invoice Number',
//       dataIndex: 'invoiceNumber',
//       key: 'invoiceNumber',
//       width: 140
//     },
//     {
//       title: 'Supplier',
//       key: 'supplier',
//       render: (_, record) => (
//         <div>
//           <Text strong>{record.supplierDetails?.companyName}</Text>
//           <br />
//           <Text type="secondary" style={{ fontSize: '12px' }}>
//             {record.supplierDetails?.contactName}
//           </Text>
//           <br />
//           <Tag size="small" color="green">
//             {record.supplierDetails?.supplierType}
//           </Tag>
//         </div>
//       ),
//       width: 220
//     },
//     {
//       title: 'Amount',
//       dataIndex: 'invoiceAmount',
//       key: 'amount',
//       render: (amount, record) => (
//         <Text strong>{record.currency || 'XAF'} {amount.toLocaleString()}</Text>
//       ),
//       width: 120
//     },
//     {
//       title: 'Service Category',
//       dataIndex: 'serviceCategory',
//       key: 'category',
//       render: (cat) => <Tag color="purple">{cat}</Tag>,
//       width: 130
//     },
//     {
//       title: 'Submitted',
//       key: 'submitted',
//       render: (_, record) => (
//         <div>
//           <div>{new Date(record.uploadedDate).toLocaleDateString('en-GB')}</div>
//           <Text type="secondary" style={{ fontSize: '11px' }}>
//             {record.uploadedTime}
//           </Text>
//         </div>
//       ),
//       width: 100
//     },
//     {
//       title: 'Files',
//       key: 'files',
//       render: (_, record) => (
//         <Space>
//           {record.poFile && (
//             <Tooltip title="PO File">
//               <Button size="small" icon={<FileOutlined />} type="link" />
//             </Tooltip>
//           )}
//           {record.invoiceFile && (
//             <Tooltip title="Invoice File">
//               <Button size="small" icon={<FileOutlined />} type="link" />
//             </Tooltip>
//           )}
//         </Space>
//       ),
//       width: 80
//     },
//     {
//       title: 'Actions',
//       key: 'actions',
//       fixed: 'right',
//       width: 200,
//       render: (_, record) => (
//         <Space size="small">
//           <Tooltip title="View Details">
//             <Button 
//               size="small" 
//               icon={<EyeOutlined />}
//               onClick={() => handleViewDetails(record)}
//             />
//           </Tooltip>
          
//           <Tooltip title="Assign to Department">
//             <Button 
//               size="small" 
//               type="primary"
//               icon={<SendOutlined />}
//               onClick={() => {
//                 setSelectedInvoice(record);
//                 setSelectedInvoices([record._id]);
//                 setAssignModalVisible(true);
//               }}
//             >
//               Assign
//             </Button>
//           </Tooltip>
          
//           <Tooltip title="Reject Invoice">
//             <Button 
//               size="small" 
//               danger
//               icon={<CloseCircleOutlined />}
//               onClick={() => {
//                 setSelectedInvoice(record);
//                 setRejectModalVisible(true);
//               }}
//             >
//               Reject
//             </Button>
//           </Tooltip>
//         </Space>
//       )
//     }
//   ];

//   return (
//     <div style={{ padding: '24px' }}>
//       <Card>
//         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
//           <Title level={2} style={{ margin: 0 }}>
//             <TeamOutlined /> Supply Chain - Invoice Management
//           </Title>
//           <Space>
//             <Button 
//               icon={<ReloadOutlined />} 
//               onClick={() => {
//                 fetchPendingInvoices();
//                 fetchStats();
//               }}
//               loading={loading}
//             >
//               Refresh
//             </Button>
//           </Space>
//         </div>

//         {/* Statistics */}
//         {stats && (
//           <Row gutter={16} style={{ marginBottom: '24px' }}>
//             <Col span={6}>
//               <Card>
//                 <Statistic
//                   title="Pending Assignment"
//                   value={stats.pendingAssignment}
//                   prefix={<ClockCircleOutlined />}
//                   valueStyle={{ color: '#faad14' }}
//                 />
//               </Card>
//             </Col>
//             <Col span={6}>
//               <Card>
//                 <Statistic
//                   title="Assigned Today"
//                   value={stats.assignedToday}
//                   prefix={<CheckCircleOutlined />}
//                   valueStyle={{ color: '#52c41a' }}
//                 />
//               </Card>
//             </Col>
//             <Col span={6}>
//               <Card>
//                 <Statistic
//                   title="Rejected Today"
//                   value={stats.rejectedToday}
//                   prefix={<CloseCircleOutlined />}
//                   valueStyle={{ color: '#ff4d4f' }}
//                 />
//               </Card>
//             </Col>
//             <Col span={6}>
//               <Card>
//                 <Statistic
//                   title="In Approval Chain"
//                   value={stats.inApprovalChain}
//                   prefix={<ShopOutlined />}
//                   valueStyle={{ color: '#1890ff' }}
//                 />
//               </Card>
//             </Col>
//           </Row>
//         )}

//         {/* Filters */}
//         <Card size="small" style={{ marginBottom: '16px', backgroundColor: '#fafafa' }}>
//           <Row gutter={16}>
//             <Col span={8}>
//               <Select
//                 placeholder="Filter by Service Category"
//                 style={{ width: '100%' }}
//                 allowClear
//                 value={filters.serviceCategory}
//                 onChange={(value) => setFilters(prev => ({ ...prev, serviceCategory: value }))}
//               >
//                 <Option value="HSE">HSE</Option>
//                 <Option value="Refurbishment">Refurbishment</Option>
//                 <Option value="Project">Project</Option>
//                 <Option value="Operations">Operations</Option>
//                 <Option value="Diesel">Diesel</Option>
//                 <Option value="Supply Chain">Supply Chain</Option>
//                 <Option value="HR/Admin">HR/Admin</Option>
//                 <Option value="General">General</Option>
//               </Select>
//             </Col>
//             <Col span={8}>
//               <Select
//                 placeholder="Filter by Supplier Type"
//                 style={{ width: '100%' }}
//                 allowClear
//                 value={filters.supplierType}
//                 onChange={(value) => setFilters(prev => ({ ...prev, supplierType: value }))}
//               >
//                 <Option value="Materials">Materials</Option>
//                 <Option value="Services">Services</Option>
//                 <Option value="Equipment">Equipment</Option>
//                 <Option value="Contractor">Contractor</Option>
//               </Select>
//             </Col>
//           </Row>
//         </Card>

//         {/* Bulk Actions Alert */}
//         {selectedInvoices.length > 0 && (
//           <Alert
//             message={`${selectedInvoices.length} invoice(s) selected`}
//             type="info"
//             showIcon
//             action={
//               <Space>
//                 <Button size="small" onClick={() => setSelectedInvoices([])}>
//                   Clear Selection
//                 </Button>
//                 <Button 
//                   size="small" 
//                   type="primary"
//                   icon={<SendOutlined />}
//                   onClick={() => setAssignModalVisible(true)}
//                 >
//                   Bulk Assign
//                 </Button>
//               </Space>
//             }
//             style={{ marginBottom: '16px' }}
//           />
//         )}

//         <Table
//           columns={columns}
//           dataSource={invoices}
//           loading={loading}
//           rowKey="_id"
//           scroll={{ x: 1300 }}
//           size="small"
//           pagination={{
//             showSizeChanger: true,
//             showQuickJumper: true,
//             showTotal: (total) => `Total ${total} invoices`
//           }}
//         />
//       </Card>

//       {/* Assignment Modal */}
//       <Modal
//         title={
//           <Space>
//             <SendOutlined />
//             {selectedInvoices.length > 1 ? `Bulk Assign ${selectedInvoices.length} Invoices` : 'Assign Invoice to Department'}
//           </Space>
//         }
//         open={assignModalVisible}
//         onCancel={() => {
//           setAssignModalVisible(false);
//           setSelectedInvoice(null);
//           setSelectedInvoices([]);
//           form.resetFields();
//         }}
//         footer={null}
//         width={600}
//       >
//         <Alert
//           message="Supply Chain Assignment"
//           description={
//             <div>
//               <Paragraph>
//                 Assigning this invoice will:
//               </Paragraph>
//               <ul>
//                 <li><strong>Auto-approve</strong> at Supply Chain level</li>
//                 <li>Create 3-level approval chain: Dept Head → Head of Business → Finance</li>
//                 <li>Notify Department Head to begin approval process</li>
//               </ul>
//             </div>
//           }
//           type="warning"
//           showIcon
//           style={{ marginBottom: '16px' }}
//         />

//         <Form
//           form={form}
//           layout="vertical"
//           onFinish={handleAssign}
//         >
//           <Form.Item
//             name="department"
//             label="Assign to Department"
//             rules={[{ required: true, message: 'Please select a department' }]}
//           >
//             <Select placeholder="Select department">
//               <Option value="HSE">HSE</Option>
//               <Option value="Refurbishment">Refurbishment</Option>
//               <Option value="Project">Project</Option>
//               <Option value="Operations">Operations</Option>
//               <Option value="Diesel">Diesel</Option>
//               <Option value="Supply Chain">Supply Chain</Option>
//               <Option value="HR/Admin">HR/Admin</Option>
//               <Option value="Finance">Finance</Option>
//               <Option value="General">General</Option>
//             </Select>
//           </Form.Item>

//           <Form.Item
//             name="comments"
//             label="Comments (Optional)"
//           >
//             <TextArea 
//               rows={3}
//               placeholder="Add any comments for the department head..."
//               maxLength={300}
//               showCount
//             />
//           </Form.Item>

//           <Form.Item>
//             <Space>
//               <Button onClick={() => {
//                 setAssignModalVisible(false);
//                 setSelectedInvoice(null);
//                 setSelectedInvoices([]);
//                 form.resetFields();
//               }}>
//                 Cancel
//               </Button>
//               <Button 
//                 type="primary" 
//                 htmlType="submit"
//                 loading={loading}
//                 icon={<SendOutlined />}
//               >
//                 {selectedInvoices.length > 1 ? `Assign ${selectedInvoices.length} Invoices` : 'Assign Invoice'}
//               </Button>
//             </Space>
//           </Form.Item>
//         </Form>
//       </Modal>

//       {/* Rejection Modal */}
//       <Modal
//         title={
//           <Space>
//             <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
//             Reject Invoice
//           </Space>
//         }
//         open={rejectModalVisible}
//         onCancel={() => {
//           setRejectModalVisible(false);
//           setSelectedInvoice(null);
//           rejectForm.resetFields();
//         }}
//         footer={null}
//         width={500}
//       >
//         <Alert
//           message="Rejection Notice"
//           description="The supplier will be able to resubmit a corrected invoice after rejection."
//           type="warning"
//           showIcon
//           style={{ marginBottom: '16px' }}
//         />

//         <Form
//           form={rejectForm}
//           layout="vertical"
//           onFinish={handleReject}
//         >
//           <Form.Item
//             name="rejectionReason"
//             label="Rejection Reason"
//             rules={[
//               { required: true, message: 'Please provide a rejection reason' },
//               { min: 10, message: 'Reason must be at least 10 characters' }
//             ]}
//           >
//             <TextArea 
//               rows={4} 
//               placeholder="Explain why this invoice is being rejected..."
//               maxLength={500}
//               showCount
//             />
//           </Form.Item>

//           <Form.Item>
//             <Space>
//               <Button onClick={() => {
//                 setRejectModalVisible(false);
//                 setSelectedInvoice(null);
//                 rejectForm.resetFields();
//               }}>
//                 Cancel
//               </Button>
//               <Button 
//                 danger
//                 type="primary" 
//                 htmlType="submit"
//                 loading={loading}
//                 icon={<CloseCircleOutlined />}
//               >
//                 Reject Invoice
//               </Button>
//             </Space>
//           </Form.Item>
//         </Form>
//       </Modal>

//       {/* Details Modal */}
//       <Modal
//         title={<Space><FileTextOutlined /> Invoice Details</Space>}
//         open={detailsModalVisible}
//         onCancel={() => {
//           setDetailsModalVisible(false);
//           setSelectedInvoice(null);
//         }}
//         footer={null}
//         width={700}
//       >
//         {selectedInvoice && (
//           <Descriptions bordered column={2} size="small">
//             <Descriptions.Item label="PO Number" span={2}>
//               <Text code copyable>{selectedInvoice.poNumber}</Text>
//             </Descriptions.Item>
//             <Descriptions.Item label="Invoice Number">
//               {selectedInvoice.invoiceNumber}
//             </Descriptions.Item>
//             <Descriptions.Item label="Amount">
//               <Text strong>{selectedInvoice.currency} {selectedInvoice.invoiceAmount.toLocaleString()}</Text>
//             </Descriptions.Item>
//             <Descriptions.Item label="Supplier Company" span={2}>
//               <div>
//                 <Text strong>{selectedInvoice.supplierDetails?.companyName}</Text>
//                 <br />
//                 <Text type="secondary">{selectedInvoice.supplierDetails?.contactName}</Text>
//               </div>
//             </Descriptions.Item>
//             <Descriptions.Item label="Supplier Type">
//               <Tag color="green">{selectedInvoice.supplierDetails?.supplierType}</Tag>
//             </Descriptions.Item>
//             <Descriptions.Item label="Service Category">
//               <Tag color="purple">{selectedInvoice.serviceCategory}</Tag>
//             </Descriptions.Item>
//             <Descriptions.Item label="Submitted Date" span={2}>
//               {new Date(selectedInvoice.uploadedDate).toLocaleDateString('en-GB')} at {selectedInvoice.uploadedTime}
//             </Descriptions.Item>
//             {selectedInvoice.description && (
//               <Descriptions.Item label="Description" span={2}>
//                 <Paragraph>{selectedInvoice.description}</Paragraph>
//               </Descriptions.Item>
//             )}
//           </Descriptions>
//         )}
//       </Modal>
//     </div>
//   );
// };

// export default SupplyChainInvoiceManagement;









import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Table,
  Button,
  Modal,
  Select,
  Typography,
  Tag,
  Space,
  Input,
  Descriptions,
  Alert,
  message,
  Popconfirm,
  Tooltip,
  Badge,
  Checkbox,
  Statistic,
  Row,
  Col,
  notification,
  Upload,
  Steps,
  Divider
} from 'antd';
import {
  FileTextOutlined,
  SendOutlined,
  CloseCircleOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  EyeOutlined,
  ReloadOutlined,
  ShopOutlined,
  TeamOutlined,
  FilterOutlined,
  FileOutlined,
  DownloadOutlined,
  UploadOutlined,
  WarningOutlined,
  CrownOutlined,
  InboxOutlined
} from '@ant-design/icons';
import api from '../../services/api';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TextArea } = Input;
const { Dragger } = Upload;
const { Step } = Steps;

const SupplyChainInvoiceManagement = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedInvoices, setSelectedInvoices] = useState([]);
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [stats, setStats] = useState(null);
  const [filters, setFilters] = useState({
    serviceCategory: null,
    supplierType: null
  });

  // Assignment workflow states
  const [assignDepartment, setAssignDepartment] = useState('');
  const [assignComments, setAssignComments] = useState('');
  const [signedDocumentFile, setSignedDocumentFile] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [downloadingInvoice, setDownloadingInvoice] = useState(false);
  const [documentDownloaded, setDocumentDownloaded] = useState(false);
  
  // Rejection states
  const [rejectReason, setRejectReason] = useState('');

  // Fetch pending invoices
  const fetchPendingInvoices = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (filters.serviceCategory) params.append('serviceCategory', filters.serviceCategory);
      if (filters.supplierType) params.append('supplierType', filters.supplierType);
      
      const response = await api.get(`/suppliers/supply-chain/invoices/pending?${params}`);
      
      if (response.data.success) {
        setInvoices(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching invoices:', error);
      message.error('Failed to fetch invoices');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Fetch dashboard stats
  const fetchStats = useCallback(async () => {
    try {
      const response = await api.get('/suppliers/supply-chain/dashboard/stats');
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }, []);

  useEffect(() => {
    fetchPendingInvoices();
    fetchStats();
  }, [fetchPendingInvoices, fetchStats]);

  // Handle download invoice for signing
  const handleDownloadInvoice = async () => {
    if (!selectedInvoice) {
      message.error('No invoice selected');
      return;
    }

    try {
      setDownloadingInvoice(true);
      const response = await api.get(`/suppliers/invoices/${selectedInvoice._id}/download-for-signing`);
      
      if (response.data.success) {
        const { url, originalName } = response.data.data;
        
        // Create a temporary link and trigger download
        const link = document.createElement('a');
        link.href = url;
        link.download = originalName || 'invoice.pdf';
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        message.success('Invoice downloaded successfully. Please sign and upload.');
        setDocumentDownloaded(true);
        setCurrentStep(1);
      }
    } catch (error) {
      console.error('Error downloading invoice:', error);
      message.error(error.response?.data?.message || 'Failed to download invoice');
    } finally {
      setDownloadingInvoice(false);
    }
  };

  // Handle file upload
  const handleFileUpload = (info) => {
    const { file } = info;
    
    // Validate file type
    const isValidType = file.type === 'application/pdf' || 
                        file.type === 'image/jpeg' || 
                        file.type === 'image/png' ||
                        file.type === 'image/jpg';
    
    if (!isValidType) {
      message.error('You can only upload PDF, JPG, or PNG files!');
      return;
    }

    // Validate file size (max 10MB)
    const isValidSize = file.size / 1024 / 1024 < 10;
    if (!isValidSize) {
      message.error('File must be smaller than 10MB!');
      return;
    }

    setSignedDocumentFile(file);
    message.success(`${file.name} selected successfully`);
    setCurrentStep(2);
  };

  // Handle assignment with signed document
  const handleAssign = async () => {
    if (!assignDepartment) {
      message.error('Please select a department');
      return;
    }
    
    if (!signedDocumentFile) {
      message.error('Please upload the signed document');
      return;
    }
    
    try {
      setLoading(true);
      
      const formData = new FormData();
      formData.append('department', assignDepartment);
      if (assignComments) {
        formData.append('comments', assignComments);
      }
      formData.append('signedDocument', signedDocumentFile);
      
      const response = await api.post(
        `/suppliers/supply-chain/invoices/${selectedInvoice._id}/assign`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      if (response.data.success) {
        notification.success({
          message: 'Invoice Assigned Successfully',
          description: `Invoice ${selectedInvoice.invoiceNumber} has been signed and assigned to ${assignDepartment}. The Department Head will be notified.`,
          duration: 5
        });
        
        // Reset and close
        setAssignModalVisible(false);
        resetAssignmentForm();
        fetchPendingInvoices();
        fetchStats();
      }
      
    } catch (error) {
      console.error('Assignment error:', error);
      message.error(error.response?.data?.message || 'Failed to assign invoice');
    } finally {
      setLoading(false);
    }
  };

  // Reset assignment form
  const resetAssignmentForm = () => {
    setSelectedInvoice(null);
    setSelectedInvoices([]);
    setAssignDepartment('');
    setAssignComments('');
    setSignedDocumentFile(null);
    setDocumentDownloaded(false);
    setCurrentStep(0);
  };

  // Handle rejection
  const handleReject = async () => {
    if (!rejectReason || rejectReason.trim().length < 10) {
      message.error('Rejection reason must be at least 10 characters');
      return;
    }
    
    try {
      setLoading(true);
      
      const response = await api.post(`/suppliers/supply-chain/invoices/${selectedInvoice._id}/reject`, {
        rejectionReason: rejectReason
      });
      
      if (response.data.success) {
        message.success('Invoice rejected successfully');
        setRejectModalVisible(false);
        setSelectedInvoice(null);
        setRejectReason('');
        fetchPendingInvoices();
        fetchStats();
      }
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to reject invoice');
    } finally {
      setLoading(false);
    }
  };

  // View invoice details
  const handleViewDetails = async (invoice) => {
    setSelectedInvoice(invoice);
    setDetailsModalVisible(true);
  };

  const columns = [
    {
      title: (
        <Checkbox
          indeterminate={selectedInvoices.length > 0 && selectedInvoices.length < invoices.length}
          checked={invoices.length > 0 && selectedInvoices.length === invoices.length}
          onChange={(e) => {
            if (e.target.checked) {
              setSelectedInvoices(invoices.map(inv => inv._id));
            } else {
              setSelectedInvoices([]);
            }
          }}
        />
      ),
      dataIndex: 'select',
      key: 'select',
      width: 50,
      render: (_, record) => (
        <Checkbox
          checked={selectedInvoices.includes(record._id)}
          onChange={(e) => {
            if (e.target.checked) {
              setSelectedInvoices([...selectedInvoices, record._id]);
            } else {
              setSelectedInvoices(selectedInvoices.filter(id => id !== record._id));
            }
          }}
        />
      )
    },
    {
      title: 'PO Number',
      dataIndex: 'poNumber',
      key: 'poNumber',
      render: (text) => <Text code>{text}</Text>,
      width: 150
    },
    {
      title: 'Invoice Number',
      dataIndex: 'invoiceNumber',
      key: 'invoiceNumber',
      width: 140
    },
    {
      title: 'Supplier',
      key: 'supplier',
      render: (_, record) => (
        <div>
          <Text strong>{record.supplierDetails?.companyName}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.supplierDetails?.contactName}
          </Text>
          <br />
          <Tag size="small" color="green">
            {record.supplierDetails?.supplierType}
          </Tag>
        </div>
      ),
      width: 220
    },
    {
      title: 'Amount',
      dataIndex: 'invoiceAmount',
      key: 'amount',
      render: (amount, record) => (
        <Text strong>{record.currency || 'XAF'} {amount.toLocaleString()}</Text>
      ),
      width: 120
    },
    {
      title: 'Service Category',
      dataIndex: 'serviceCategory',
      key: 'category',
      render: (cat) => <Tag color="purple">{cat}</Tag>,
      width: 130
    },
    {
      title: 'Submitted',
      key: 'submitted',
      render: (_, record) => (
        <div>
          <div>{new Date(record.uploadedDate).toLocaleDateString('en-GB')}</div>
          <Text type="secondary" style={{ fontSize: '11px' }}>
            {record.uploadedTime}
          </Text>
        </div>
      ),
      width: 100
    },
    {
      title: 'Files',
      key: 'files',
      render: (_, record) => (
        <Space>
          {record.poFile && (
            <Tooltip title={record.poFile.originalName}>
              <Button 
                size="small" 
                icon={<FileOutlined />} 
                type="link"
                onClick={() => window.open(record.poFile.url, '_blank')}
              />
            </Tooltip>
          )}
          {record.invoiceFile && (
            <Tooltip title={record.invoiceFile.originalName}>
              <Button 
                size="small" 
                icon={<FileOutlined />} 
                type="link"
                onClick={() => window.open(record.invoiceFile.url, '_blank')}
              />
            </Tooltip>
          )}
        </Space>
      ),
      width: 80
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 200,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="View Details">
            <Button 
              size="small" 
              icon={<EyeOutlined />}
              onClick={() => handleViewDetails(record)}
            />
          </Tooltip>
          
          <Tooltip title="Download, Sign & Assign">
            <Button 
              size="small" 
              type="primary"
              icon={<SendOutlined />}
              onClick={() => {
                setSelectedInvoice(record);
                setSelectedInvoices([record._id]);
                setAssignModalVisible(true);
              }}
            >
              Assign
            </Button>
          </Tooltip>
          
          <Tooltip title="Reject Invoice">
            <Button 
              size="small" 
              danger
              icon={<CloseCircleOutlined />}
              onClick={() => {
                setSelectedInvoice(record);
                setRejectModalVisible(true);
              }}
            >
              Reject
            </Button>
          </Tooltip>
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <Title level={2} style={{ margin: 0 }}>
            <TeamOutlined /> Supply Chain - Supplier Invoice Management
          </Title>
          <Space>
            <Button 
              icon={<ReloadOutlined />} 
              onClick={() => {
                fetchPendingInvoices();
                fetchStats();
              }}
              loading={loading}
            >
              Refresh
            </Button>
          </Space>
        </div>

        <Alert
          message="Document Signing Workflow"
          description="For each invoice, you must: 1) Download the invoice 2) Sign it manually 3) Upload the signed document before assigning to a department."
          type="info"
          showIcon
          icon={<FileTextOutlined />}
          style={{ marginBottom: '24px' }}
          closable
        />

        {/* Statistics */}
        {stats && (
          <Row gutter={16} style={{ marginBottom: '24px' }}>
            <Col span={6}>
              <Card>
                <Statistic
                  title="Pending Assignment"
                  value={stats.pendingAssignment}
                  prefix={<ClockCircleOutlined />}
                  valueStyle={{ color: '#faad14' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="Assigned Today"
                  value={stats.assignedToday}
                  prefix={<CheckCircleOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="Rejected Today"
                  value={stats.rejectedToday}
                  prefix={<CloseCircleOutlined />}
                  valueStyle={{ color: '#ff4d4f' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="In Approval Chain"
                  value={stats.inApprovalChain}
                  prefix={<ShopOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
          </Row>
        )}

        {/* Filters */}
        <Card size="small" style={{ marginBottom: '16px', backgroundColor: '#fafafa' }}>
          <Row gutter={16}>
            <Col span={8}>
              <Select
                placeholder="Filter by Service Category"
                style={{ width: '100%' }}
                allowClear
                value={filters.serviceCategory}
                onChange={(value) => setFilters(prev => ({ ...prev, serviceCategory: value }))}
              >
                <Option value="HSE">HSE</Option>
                <Option value="Refurbishment">Refurbishment</Option>
                <Option value="Project">Project</Option>
                <Option value="Operations">Operations</Option>
                <Option value="Diesel">Diesel</Option>
                <Option value="Supply Chain">Supply Chain</Option>
                <Option value="HR/Admin">HR/Admin</Option>
                <Option value="General">General</Option>
              </Select>
            </Col>
            <Col span={8}>
              <Select
                placeholder="Filter by Supplier Type"
                style={{ width: '100%' }}
                allowClear
                value={filters.supplierType}
                onChange={(value) => setFilters(prev => ({ ...prev, supplierType: value }))}
              >
                <Option value="Materials">Materials</Option>
                <Option value="Services">Services</Option>
                <Option value="Equipment">Equipment</Option>
                <Option value="Contractor">Contractor</Option>
              </Select>
            </Col>
          </Row>
        </Card>

        {/* Bulk Actions Alert */}
        {selectedInvoices.length > 0 && (
          <Alert
            message={`${selectedInvoices.length} invoice(s) selected`}
            description="Note: Bulk assignment requires signing each invoice individually. Use single assignment for document signing workflow."
            type="info"
            showIcon
            action={
              <Button size="small" onClick={() => setSelectedInvoices([])}>
                Clear Selection
              </Button>
            }
            style={{ marginBottom: '16px' }}
          />
        )}

        <Table
          columns={columns}
          dataSource={invoices}
          loading={loading}
          rowKey="_id"
          scroll={{ x: 1300 }}
          size="small"
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `Total ${total} invoices`
          }}
        />
      </Card>

      {/* Assignment Modal with Signing Workflow */}
      <Modal
        title={
          <Space>
            <SendOutlined />
            Sign & Assign Invoice to Department
          </Space>
        }
        open={assignModalVisible}
        onCancel={() => {
          setAssignModalVisible(false);
          resetAssignmentForm();
        }}
        footer={null}
        width={700}
        maskClosable={false}
      >
        {selectedInvoice && (
          <div>
            {/* Invoice Info */}
            <Card size="small" style={{ marginBottom: 16, backgroundColor: '#f0f8ff' }}>
              <Descriptions size="small" column={2}>
                <Descriptions.Item label="Invoice">{selectedInvoice.invoiceNumber}</Descriptions.Item>
                <Descriptions.Item label="PO">{selectedInvoice.poNumber}</Descriptions.Item>
                <Descriptions.Item label="Supplier">{selectedInvoice.supplierDetails?.companyName}</Descriptions.Item>
                <Descriptions.Item label="Amount">
                  {selectedInvoice.currency} {selectedInvoice.invoiceAmount.toLocaleString()}
                </Descriptions.Item>
              </Descriptions>
            </Card>

            {/* Workflow Steps */}
            <Steps current={currentStep} style={{ marginBottom: 24 }}>
              <Step title="Download" icon={<DownloadOutlined />} description="Get invoice" />
              <Step title="Sign" icon={<FileTextOutlined />} description="Sign document" />
              <Step title="Upload" icon={<UploadOutlined />} description="Upload signed" />
              <Step title="Assign" icon={<SendOutlined />} description="Complete" />
            </Steps>

            <Divider />

            {/* Step 1: Download Invoice */}
            <Card 
              size="small" 
              style={{ 
                marginBottom: 16, 
                backgroundColor: currentStep === 0 ? '#fff7e6' : '#f5f5f5',
                borderColor: currentStep === 0 ? '#faad14' : '#d9d9d9'
              }}
            >
              <Space direction="vertical" style={{ width: '100%' }}>
                <Text strong>
                  <DownloadOutlined /> Step 1: Download Invoice for Signing
                </Text>
                <Button
                  type={currentStep === 0 ? 'primary' : 'default'}
                  icon={<DownloadOutlined />}
                  loading={downloadingInvoice}
                  onClick={handleDownloadInvoice}
                  disabled={documentDownloaded}
                  block
                >
                  {documentDownloaded ? 'Invoice Downloaded ✓' : 'Download Invoice Document'}
                </Button>
                {documentDownloaded && (
                  <Alert
                    message="Downloaded successfully. Please sign the document manually (print & scan or digital signature)."
                    type="success"
                    showIcon
                    style={{ marginTop: 8 }}
                  />
                )}
              </Space>
            </Card>

            {/* Step 2: Upload Signed Document */}
            <Card 
              size="small" 
              style={{ 
                marginBottom: 16,
                backgroundColor: currentStep === 1 ? '#fff7e6' : '#f5f5f5',
                borderColor: currentStep === 1 ? '#faad14' : '#d9d9d9'
              }}
            >
              <Space direction="vertical" style={{ width: '100%' }}>
                <Text strong>
                  <UploadOutlined /> Step 2: Upload Signed Document {!signedDocumentFile && <Text type="danger">*</Text>}
                </Text>
                <Dragger
                  accept=".pdf,.jpg,.jpeg,.png"
                  maxCount={1}
                  beforeUpload={(file) => {
                    handleFileUpload({ file });
                    return false;
                  }}
                  onRemove={() => {
                    setSignedDocumentFile(null);
                    setCurrentStep(1);
                  }}
                  disabled={!documentDownloaded}
                  fileList={signedDocumentFile ? [{
                    uid: '-1',
                    name: signedDocumentFile.name,
                    status: 'done',
                  }] : []}
                >
                  <p className="ant-upload-drag-icon">
                    <InboxOutlined />
                  </p>
                  <p className="ant-upload-text">
                    Click or drag signed document to upload
                  </p>
                  <p className="ant-upload-hint">
                    Supports PDF, JPG, PNG (Max 10MB)
                  </p>
                </Dragger>
                {!documentDownloaded && (
                  <Alert
                    message="Please download the invoice first before uploading signed version"
                    type="warning"
                    showIcon
                    style={{ marginTop: 8 }}
                  />
                )}
              </Space>
            </Card>

            {/* Step 3: Select Department */}
            <Card 
              size="small" 
              style={{ 
                marginBottom: 16,
                backgroundColor: currentStep === 2 ? '#fff7e6' : '#f5f5f5',
                borderColor: currentStep === 2 ? '#faad14' : '#d9d9d9'
              }}
            >
              <Space direction="vertical" style={{ width: '100%' }}>
                <Text strong>Step 3: Select Department {!assignDepartment && <Text type="danger">*</Text>}</Text>
                <Select 
                  placeholder="Choose department for assignment" 
                  size="large"
                  style={{ width: '100%' }}
                  value={assignDepartment}
                  onChange={(value) => {
                    setAssignDepartment(value);
                    if (value && signedDocumentFile) {
                      setCurrentStep(3);
                    }
                  }}
                  disabled={!signedDocumentFile}
                >
                  <Option value="Technical">
                    <div>
                      <Text strong>Technical</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: 11 }}>Head: Mr. Didier Oyong</Text>
                    </div>
                  </Option>
                  <Option value="Business Development & Supply Chain">
                    <div>
                      <Text strong>Business Development & Supply Chain</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: 11 }}>Head: Mr. E.T Kelvin</Text>
                    </div>
                  </Option>
                  <Option value="HR & Admin">
                    <div>
                      <Text strong>HR & Admin</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: 11 }}>Head: Mrs. Bruiline Tsitoh</Text>
                    </div>
                  </Option>
                </Select>
              </Space>
            </Card>

            {/* Step 4: Comments (Optional) */}
            <Card size="small" style={{ marginBottom: 16, backgroundColor: '#f5f5f5' }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Text strong>Step 4: Assignment Comments (Optional)</Text>
                <TextArea 
                  rows={3} 
                  placeholder="Add any comments about this assignment..."
                  maxLength={300}
                  showCount
                  value={assignComments}
                  onChange={(e) => setAssignComments(e.target.value)}
                  disabled={!assignDepartment || !signedDocumentFile}
                />
              </Space>
            </Card>

            {/* Action Buttons */}
            <Space style={{ marginTop: 16, width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => {
                setAssignModalVisible(false);
                resetAssignmentForm();
              }}>
                Cancel
              </Button>
              <Button 
                type="primary" 
                onClick={handleAssign}
                loading={loading}
                icon={<SendOutlined />}
                disabled={!assignDepartment || !signedDocumentFile}
                size="large"
              >
                Sign & Assign Invoice
              </Button>
            </Space>

            {/* Help Alert */}
            <Alert
              message="Assignment will auto-approve at Supply Chain level"
              description="Once assigned, the invoice will move to the Department Head for their review and signature."
              type="info"
              showIcon
              style={{ marginTop: 16 }}
            />
          </div>
        )}
      </Modal>

      {/* Rejection Modal */}
      <Modal
        title={
          <Space>
            <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
            Reject Invoice
          </Space>
        }
        open={rejectModalVisible}
        onCancel={() => {
          setRejectModalVisible(false);
          setSelectedInvoice(null);
          setRejectReason('');
        }}
        footer={null}
        width={500}
      >
        <Alert
          message="Rejection Notice"
          description="The supplier will be able to resubmit a corrected invoice after rejection."
          type="warning"
          showIcon
          style={{ marginBottom: '16px' }}
        />

        <div>
          <div style={{ marginBottom: 16 }}>
            <Text strong>Rejection Reason:</Text>
            <TextArea 
              rows={4} 
              placeholder="Explain why this invoice is being rejected..."
              maxLength={500}
              showCount
              style={{ marginTop: 8 }}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
          </div>

          <Space style={{ marginTop: 16 }}>
            <Button onClick={() => {
              setRejectModalVisible(false);
              setSelectedInvoice(null);
              setRejectReason('');
            }}>
              Cancel
            </Button>
            <Button 
              danger
              type="primary" 
              onClick={handleReject}
              loading={loading}
              icon={<CloseCircleOutlined />}
            >
              Reject Invoice
            </Button>
          </Space>
        </div>
      </Modal>

      {/* Details Modal */}
      <Modal
        title={<Space><FileTextOutlined /> Invoice Details</Space>}
        open={detailsModalVisible}
        onCancel={() => {
          setDetailsModalVisible(false);
          setSelectedInvoice(null);
        }}
        footer={null}
        width={700}
      >
        {selectedInvoice && (
          <Descriptions bordered column={2} size="small">
            <Descriptions.Item label="PO Number" span={2}>
              <Text code copyable>{selectedInvoice.poNumber}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Invoice Number">
              {selectedInvoice.invoiceNumber}
            </Descriptions.Item>
            <Descriptions.Item label="Amount">
              <Text strong>{selectedInvoice.currency} {selectedInvoice.invoiceAmount.toLocaleString()}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Supplier Company" span={2}>
              <div>
                <Text strong>{selectedInvoice.supplierDetails?.companyName}</Text>
                <br />
                <Text type="secondary">{selectedInvoice.supplierDetails?.contactName}</Text>
              </div>
            </Descriptions.Item>
            <Descriptions.Item label="Supplier Type">
              <Tag color="green">{selectedInvoice.supplierDetails?.supplierType}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Service Category">
              <Tag color="purple">{selectedInvoice.serviceCategory}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Submitted Date" span={2}>
              {new Date(selectedInvoice.uploadedDate).toLocaleDateString('en-GB')} at {selectedInvoice.uploadedTime}
            </Descriptions.Item>
            {selectedInvoice.description && (
              <Descriptions.Item label="Description" span={2}>
                <Paragraph>{selectedInvoice.description}</Paragraph>
              </Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default SupplyChainInvoiceManagement;