// import React, { useState, useEffect, useCallback } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { useSelector } from 'react-redux';
// import {
//   Card,
//   Table,
//   Button,
//   Modal,
//   Form,
//   Typography,
//   Tag,
//   Space,
//   Tabs,
//   Alert,
//   Descriptions,
//   Timeline,
//   message,
//   notification,
//   Upload,
//   Steps,
//   Divider,
//   Radio
// } from 'antd';
// import {
//   FileTextOutlined,
//   CheckCircleOutlined,
//   CloseCircleOutlined,
//   ClockCircleOutlined,
//   UserOutlined,
//   AuditOutlined,
//   EyeOutlined,
//   DownloadOutlined,
//   UploadOutlined,
//   InboxOutlined,
//   SendOutlined,
//   DollarOutlined
// } from '@ant-design/icons';
// import api from '../../services/api';

// const { Title, Text } = Typography;
// const { TabPane } = Tabs;
// const { TextArea } = Input;
// const { Dragger } = Upload;
// const { Step } = Steps;

// const SupervisorReimbursementApprovals = () => {
//   const navigate = useNavigate();
//   const { user } = useSelector((state) => state.auth);
  
//   const [reimbursements, setReimbursements] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [detailsModalVisible, setDetailsModalVisible] = useState(false);
//   const [approvalModalVisible, setApprovalModalVisible] = useState(false);
//   const [selectedReimbursement, setSelectedReimbursement] = useState(null);
//   const [activeTab, setActiveTab] = useState('pending');
//   const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0, total: 0 });
//   const [form] = Form.useForm();

//   // Signing workflow states
//   const [signedDocumentFile, setSignedDocumentFile] = useState(null);
//   const [currentStep, setCurrentStep] = useState(0);
//   const [downloadingDocument, setDownloadingDocument] = useState(false);
//   const [documentDownloaded, setDocumentDownloaded] = useState(false);

//   const canUserApprove = useCallback((reimbursement) => {
//     if (!reimbursement.approvalChain || !user?.email) return false;
    
//     const currentStep = reimbursement.approvalChain.find(step => 
//       step.level === reimbursement.currentApprovalLevel && 
//       step.approver?.email === user.email &&
//       step.status === 'pending'
//     );
    
//     return !!currentStep;
//   }, [user?.email]);

//   const fetchPendingReimbursements = useCallback(async () => {
//     try {
//       setLoading(true);
      
//       // Using existing endpoint - filter for reimbursements on frontend
//       const response = await api.get('/cash-requests/supervisor/pending');
      
//       if (response.data.success) {
//         const allRequests = response.data.data || [];
        
//         // Filter for reimbursement requests only
//         const reimbursementRequests = allRequests.filter(req => 
//           req.requestMode === 'reimbursement'
//         ).map(req => ({
//           ...req,
//           key: `reimbursement_${req._id}`
//         }));
        
//         console.log('Reimbursement requests loaded:', reimbursementRequests.length);
//         setReimbursements(reimbursementRequests);

//         // Calculate stats
//         const pending = reimbursementRequests.filter(req => 
//           ['pending_supervisor', 'pending_departmental_head', 'pending_head_of_business', 'pending_finance'].includes(req.status) &&
//           canUserApprove(req)
//         ).length;
//         const approved = reimbursementRequests.filter(req => 
//           ['approved', 'disbursed', 'completed'].includes(req.status)
//         ).length;
//         const rejected = reimbursementRequests.filter(req => 
//           req.status === 'denied'
//         ).length;

//         setStats({
//           pending,
//           approved,
//           rejected,
//           total: reimbursementRequests.length
//         });
//       }
//     } catch (error) {
//       console.error('Error fetching reimbursements:', error);
//       message.error('Failed to fetch reimbursement requests');
//     } finally {
//       setLoading(false);
//     }
//   }, [canUserApprove]);

//   useEffect(() => {
//     if (user?.email) {
//       fetchPendingReimbursements();
//     }
//   }, [fetchPendingReimbursements, user?.email]);

//   const handleDownloadDocument = async () => {
//     if (!selectedReimbursement) {
//       message.error('No reimbursement selected');
//       return;
//     }

//     try {
//       setDownloadingDocument(true);
//       const response = await api.get(`/cash-requests/${selectedReimbursement._id}/reimbursement/download-for-signing`);
      
//       if (response.data.success) {
//         const { url, originalName } = response.data.data;
        
//         const link = document.createElement('a');
//         link.href = url;
//         link.download = originalName || 'reimbursement.pdf';
//         link.target = '_blank';
//         document.body.appendChild(link);
//         link.click();
//         document.body.removeChild(link);
        
//         message.success('Document downloaded. Please sign and upload.');
//         setDocumentDownloaded(true);
//         setCurrentStep(1);
//       }
//     } catch (error) {
//       console.error('Error downloading document:', error);
//       message.error(error.response?.data?.message || 'Failed to download document');
//     } finally {
//       setDownloadingDocument(false);
//     }
//   };

//   const handleFileUpload = (info) => {
//     const { file } = info;
    
//     const isValidType = file.type === 'application/pdf' || 
//                         file.type === 'image/jpeg' || 
//                         file.type === 'image/png' ||
//                         file.type === 'image/jpg';
    
//     if (!isValidType) {
//       message.error('You can only upload PDF, JPG, or PNG files!');
//       return;
//     }

//     const isValidSize = file.size / 1024 / 1024 < 10;
//     if (!isValidSize) {
//       message.error('File must be smaller than 10MB!');
//       return;
//     }

//     setSignedDocumentFile(file);
//     message.success(`${file.name} selected successfully`);
//     setCurrentStep(2);
//   };

//   const handleApprovalDecision = async (values) => {
//     if (!selectedReimbursement) return;

//     try {
//       setLoading(true);
      
//       if (values.decision === 'approved' && !signedDocumentFile) {
//         message.error('Please download, sign, and upload the document before approving.');
//         setLoading(false);
//         return;
//       }
      
//       const formData = new FormData();
//       formData.append('decision', values.decision);
//       formData.append('comments', values.comments || '');
      
//       if (values.decision === 'approved' && signedDocumentFile) {
//         formData.append('signedDocument', signedDocumentFile);
//       }
      
//       const response = await api.put(
//         `/cash-requests/${selectedReimbursement._id}/reimbursement/approval-with-signature`,
//         formData,
//         {
//           headers: {
//             'Content-Type': 'multipart/form-data'
//           }
//         }
//       );
      
//       if (response.data.success) {
//         const actionText = values.decision === 'approved' ? 'approved' : 'rejected';
//         message.success(`Reimbursement ${actionText} successfully`);
        
//         setApprovalModalVisible(false);
//         form.resetFields();
//         resetSigningWorkflow();
//         setSelectedReimbursement(null);
        
//         await fetchPendingReimbursements();
        
//         notification.success({
//           message: 'Approval Decision Recorded',
//           description: `Reimbursement request ${selectedReimbursement._id.slice(-6).toUpperCase()} has been ${actionText}${values.decision === 'approved' ? ' with signed document' : ''}.`,
//           duration: 4
//         });
//       }
//     } catch (error) {
//       console.error('Approval decision error:', error);
//       message.error(error.response?.data?.message || 'Failed to process approval decision');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const resetSigningWorkflow = () => {
//     setSignedDocumentFile(null);
//     setDocumentDownloaded(false);
//     setCurrentStep(0);
//   };

//   const handleViewDetails = async (reimbursement) => {
//     try {
//       const response = await api.get(`/cash-requests/${reimbursement._id}`);
      
//       if (response.data.success) {
//         setSelectedReimbursement({
//           ...response.data.data,
//           requestMode: 'reimbursement'
//         });
//         setDetailsModalVisible(true);
//       }
//     } catch (error) {
//       console.error('Error fetching reimbursement details:', error);
//       message.error('Failed to fetch reimbursement details');
//     }
//   };

//   const getStatusTag = (status) => {
//     const statusMap = {
//       'pending_supervisor': { color: 'orange', text: 'Pending Your Approval', icon: <ClockCircleOutlined /> },
//       'pending_departmental_head': { color: 'orange', text: 'Pending Your Approval', icon: <ClockCircleOutlined /> },
//       'pending_head_of_business': { color: 'orange', text: 'Pending Your Approval', icon: <ClockCircleOutlined /> },
//       'pending_finance': { color: 'blue', text: 'Pending Finance', icon: <ClockCircleOutlined /> },
//       'approved': { color: 'green', text: 'Approved', icon: <CheckCircleOutlined /> },
//       'denied': { color: 'red', text: 'Rejected', icon: <CloseCircleOutlined /> },
//       'disbursed': { color: 'purple', text: 'Disbursed', icon: <CheckCircleOutlined /> },
//       'completed': { color: 'cyan', text: 'Completed', icon: <DollarOutlined /> }
//     };

//     const config = statusMap[status] || { color: 'default', text: status, icon: null };
//     return <Tag color={config.color} icon={config.icon}>{config.text}</Tag>;
//   };

//   const getFilteredReimbursements = (status) => {
//     switch (status) {
//       case 'pending':
//         return reimbursements.filter(req => {
//           const isPending = req.status && (
//             req.status.includes('pending') &&
//             !req.status.includes('finance_assignment')
//           );
//           return isPending && canUserApprove(req);
//         });
//       case 'approved':
//         return reimbursements.filter(req => 
//           ['approved', 'disbursed', 'completed'].includes(req.status)
//         );
//       case 'rejected':
//         return reimbursements.filter(req => req.status === 'denied');
//       default:
//         return reimbursements;
//     }
//   };

//   const columns = [
//     {
//       title: 'Request ID',
//       dataIndex: '_id',
//       key: 'id',
//       render: (id) => <Text code>REQ-{id.slice(-6).toUpperCase()}</Text>,
//       width: 120
//     },
//     {
//       title: 'Employee',
//       key: 'employee',
//       render: (_, record) => (
//         <div>
//           <Text strong>{record.employee?.fullName}</Text>
//           <br />
//           <Text type="secondary" style={{ fontSize: '12px' }}>
//             {record.employee?.department}
//           </Text>
//         </div>
//       ),
//       width: 180
//     },
//     {
//       title: 'Request Type',
//       dataIndex: 'requestType',
//       key: 'requestType',
//       render: (type) => (
//         <Tag color="blue">
//           {type?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
//         </Tag>
//       ),
//       width: 140
//     },
//     {
//       title: 'Amount',
//       dataIndex: 'amountRequested',
//       key: 'amount',
//       render: (amount) => (
//         <Text strong>XAF {amount ? amount.toLocaleString() : '0'}</Text>
//       ),
//       width: 120
//     },
//     {
//       title: 'Expense Items',
//       key: 'items',
//       render: (_, record) => (
//         <Text>{record.reimbursementDetails?.itemizedBreakdown?.length || 0} items</Text>
//       ),
//       width: 100
//     },
//     {
//       title: 'Status',
//       key: 'status',
//       render: (_, record) => (
//         <div>
//           {getStatusTag(record.status)}
//           {canUserApprove(record) && (
//             <div style={{ marginTop: 4