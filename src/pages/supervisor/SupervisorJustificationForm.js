import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Card, 
  Descriptions, 
  Typography, 
  Tag, 
  Divider, 
  Form, 
  Input, 
  Radio, 
  Button, 
  message,
  Modal,
  Space,
  Alert,
  Row,
  Col,
  Image
} from 'antd';
import { 
  CheckCircleOutlined, 
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  DollarOutlined,
  FileTextOutlined,
  CalendarOutlined,
  UserOutlined,
  DownloadOutlined
} from '@ant-design/icons';
import api from '../../services/api';
import { useSelector } from 'react-redux';

const { Title, Text } = Typography;
const { TextArea } = Input;


const SupervisorJustificationForm = ({ requestId: propRequestId, onSuccess, isModal = false }) => {
  const { requestId: paramRequestId } = useParams();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(false);
  const [decision, setDecision] = useState(null);
  const { user } = useSelector((state) => state.auth);

  // Use prop requestId if provided (modal mode), otherwise use URL param (standalone mode)
  const requestId = propRequestId || paramRequestId;

  useEffect(() => {
    const fetchJustification = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/api/cash-requests/supervisor/justification/${requestId}`);
        
        if (!response.data.success) {
          throw new Error(response.data.message || 'Justification not found');
        }

        setRequest(response.data.data);
      } catch (error) {
        console.error('Error fetching justification:', error);
        message.error(error.message || 'Failed to load justification details');
        if (!isModal) {
          navigate('/supervisor/cash-approvals');
        }
      } finally {
        setLoading(false);
      }
    };
  
    if (requestId) {
      fetchJustification();
    }
  }, [requestId, navigate, isModal]);

  const handleDownloadAttachment = async (attachment) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        message.error('Authentication required');
        return;
      }

      let publicId = '';
      if (attachment.url) {
        const urlParts = attachment.url.split('/');
        const uploadIndex = urlParts.findIndex(part => part === 'upload');
        if (uploadIndex !== -1 && uploadIndex + 2 < urlParts.length) {
          publicId = urlParts.slice(uploadIndex + 2).join('/');
          const lastPart = publicId.split('/').pop();
          if (lastPart && lastPart.includes('.')) {
            publicId = publicId.replace(/\.[^/.]+$/, '');
          }
        }
      }

      if (!publicId) {
        message.error('Invalid attachment URL');
        return;
      }

      const response = await fetch(`/api/files/download/${encodeURIComponent(publicId)}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = attachment.originalName || attachment.name || 'attachment';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      window.URL.revokeObjectURL(url);
      
      message.success('File downloaded successfully');
    } catch (error) {
      console.error('Error downloading attachment:', error);
      message.error('Failed to download attachment');
      
      if (attachment.url) {
        window.open(attachment.url, '_blank');
      }
    }
  };

  // const handleSubmit = async (values) => {
  //   try {
  //     setLoading(true);
  //     const response = await api.put(`/api/cash-requests/${requestId}/supervisor/justification`, {
  //       decision: values.decision,
  //       comments: values.comments
  //     });
      
  //     if (response.data.success) {
  //       const actionText = values.decision === 'approve' ? 'approved' : 'rejected';
  //       message.success(`Justification ${actionText} successfully`);
        
  //       // Call onSuccess callback if provided (modal mode)
  //       if (onSuccess) {
  //         onSuccess();
  //       } else {
  //         // Navigate back if standalone mode
  //         navigate('/supervisor/cash-approvals');
  //       }
  //     } else {
  //       throw new Error(response.data.message || 'Failed to process justification');
  //     }
  //   } catch (error) {
  //     console.error('Error processing justification:', error);
  //     message.error(error.message || 'Failed to process justification');
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      const response = await api.put(`/api/cash-requests/${requestId}/supervisor/justification`, {
        decision: values.decision,
        comments: values.comments
      });
      
      if (response.data.success) {
        const actionText = values.decision === 'approved' ? 'approved' : 'rejected';
        message.success(`Justification ${actionText} successfully`);
        
        // Call onSuccess callback if provided (modal mode)
        if (onSuccess) {
          onSuccess();
        } else {
          // Navigate back if standalone mode
          navigate('/supervisor/cash-approvals');
        }
      } else {
        throw new Error(response.data.message || 'Failed to process justification');
      }
    } catch (error) {
      console.error('Error processing justification:', error);
      message.error(error.message || 'Failed to process justification');
    } finally {
      setLoading(false);
    }
  };

  const showConfirmModal = () => {
    Modal.confirm({
      title: `Confirm Justification ${decision === 'approved' ? 'Approval' : 'Rejection'}`,
      icon: decision === 'approved' ? <CheckCircleOutlined /> : <CloseCircleOutlined />,
      content: `Are you sure you want to ${decision === 'approved' ? 'approve' : 'reject'} this justification?`,
      onOk: () => form.submit(),
      okText: `Yes, ${decision === 'approved' ? 'Approve' : 'Reject'}`,
      cancelText: 'Cancel'
    });
  };

  const downloadDocument = (doc) => {
    if (doc.url) {
      handleDownloadAttachment(doc);
    }
  };

  if (loading && !request) {
    return <div>Loading justification details...</div>;
  }

  if (!request) {
    return (
      <Alert
        message="Justification Not Found"
        description="The justification you are trying to access does not exist or you don't have permission to view it."
        type="error"
        showIcon
      />
    );
  }

  const disbursedAmount = request.disbursementDetails?.amount || 0;
  const spentAmount = request.justification?.amountSpent || 0;
  const returnedAmount = request.justification?.balanceReturned || 0;
  const isBalanced = Math.abs((spentAmount + returnedAmount) - disbursedAmount) < 0.01;

  return (
    <Card loading={loading}>
      <Title level={3} style={{ marginBottom: '24px' }}>
        <FileTextOutlined /> Cash Justification Review
      </Title>

      {/* Original Request Details */}
      <Card type="inner" title="Original Request Details" style={{ marginBottom: '24px' }}>
        <Descriptions bordered column={2} size="small">
          <Descriptions.Item label="Request ID" span={2}>
            REQ-{request._id.slice(-6).toUpperCase()}
          </Descriptions.Item>
          <Descriptions.Item label="Employee">
            <Space>
              <UserOutlined />
              {request.employee?.fullName}
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="Department">
            {request.employee?.department || 'N/A'}
          </Descriptions.Item>
          <Descriptions.Item label="Request Type">
            {request.requestType?.replace('-', ' ')?.toUpperCase()}
          </Descriptions.Item>
          <Descriptions.Item label="Original Purpose" span={2}>
            {request.purpose}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* Financial Summary */}
      <Card type="inner" title="Financial Summary" style={{ marginBottom: '24px' }}>
        <Row gutter={16}>
          <Col span={8}>
            <Card size="small">
              <div style={{ textAlign: 'center' }}>
                <Text type="secondary">Amount Disbursed</Text>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#1890ff' }}>
                  XAF {disbursedAmount.toFixed(2)}
                </div>
              </div>
            </Card>
          </Col>
          <Col span={8}>
            <Card size="small">
              <div style={{ textAlign: 'center' }}>
                <Text type="secondary">Amount Spent</Text>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#ff4d4f' }}>
                  XAF {spentAmount.toFixed(2)}
                </div>
              </div>
            </Card>
          </Col>
          <Col span={8}>
            <Card size="small">
              <div style={{ textAlign: 'center' }}>
                <Text type="secondary">Balance Returned</Text>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#52c41a' }}>
                  XAF {returnedAmount.toFixed(2)}
                </div>
              </div>
            </Card>
          </Col>
        </Row>
        
        <div style={{ marginTop: '16px', padding: '12px', backgroundColor: isBalanced ? '#f6ffed' : '#fff2f0', border: `1px solid ${isBalanced ? '#b7eb8f' : '#ffccc7'}`, borderRadius: '4px' }}>
          <Text strong style={{ color: isBalanced ? '#52c41a' : '#ff4d4f' }}>
            {isBalanced ? '✅ Amounts Balance Correctly' : '⚠️ Amounts Do Not Balance'}
          </Text>
          {!isBalanced && (
            <div style={{ marginTop: '4px', fontSize: '12px', color: '#666' }}>
              Expected: XAF {disbursedAmount.toFixed(2)} = Spent + Returned: XAF {(spentAmount + returnedAmount).toFixed(2)}
            </div>
          )}
        </div>
      </Card>

      {/* Justification Details */}
      <Card type="inner" title="Justification Details" style={{ marginBottom: '24px' }}>
        <Descriptions bordered column={1}>
          <Descriptions.Item label="Submitted Date">
            <Space>
              <CalendarOutlined />
              {request.justification?.justificationDate 
                ? new Date(request.justification.justificationDate).toLocaleDateString()
                : 'N/A'
              }
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="Spending Details">
            <div style={{ whiteSpace: 'pre-wrap', maxHeight: '200px', overflowY: 'auto' }}>
              {request.justification?.details || 'No details provided'}
            </div>
          </Descriptions.Item>
        </Descriptions>

        {/* Supporting Documents */}
        {request.justification?.documents && request.justification.documents.length > 0 && (
          <div style={{ marginTop: '16px' }}>
            <Text strong>Supporting Documents:</Text>
            <div style={{ marginTop: '8px' }}>
              {request.justification.documents.map((doc, index) => (
                <Card key={index} size="small" style={{ marginBottom: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <Text strong>{doc.name}</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        {doc.size ? `${(doc.size / 1024).toFixed(1)} KB` : ''} • {doc.mimetype || 'Unknown type'}
                      </Text>
                    </div>
                    <Button 
                      type="primary" 
                      size="small" 
                      icon={<DownloadOutlined />}
                      onClick={() => downloadDocument(doc)}
                    >
                      View
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </Card>

      <Divider />

      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        {/* <Form.Item
          name="decision"
          label="Your Decision on This Justification"
          rules={[{ required: true, message: 'Please make a decision' }]}
        >
          <Radio.Group onChange={(e) => setDecision(e.target.value)}>
            <Space direction="vertical">
              <Radio.Button value="approve" style={{ color: '#52c41a' }}>
                <CheckCircleOutlined /> Approve Justification
              </Radio.Button>
              <Radio.Button value="reject" style={{ color: '#ff4d4f' }}>
                <CloseCircleOutlined /> Reject Justification (Requires Revision)
              </Radio.Button>
            </Space>
          </Radio.Group>
        </Form.Item> */}
        <Form.Item
          name="decision"
          label="Your Decision on This Justification"
          rules={[{ required: true, message: 'Please make a decision' }]}
        >
          <Radio.Group onChange={(e) => setDecision(e.target.value)}>
            <Space direction="vertical">
              <Radio.Button value="approved" style={{ color: '#52c41a' }}>
                <CheckCircleOutlined /> Approve Justification
              </Radio.Button>
              <Radio.Button value="rejected" style={{ color: '#ff4d4f' }}>
                <CloseCircleOutlined /> Reject Justification (Requires Revision)
              </Radio.Button>
            </Space>
          </Radio.Group>
        </Form.Item>

        <Form.Item
  name="comments"
  label="Comments"
  rules={decision === 'rejected' ? [{ required: true, message: 'Please provide feedback for rejection' }] : []}
>
  <TextArea 
    rows={4} 
    placeholder={
      decision === 'approved' 
        ? "Optional: Any additional comments about this justification..."
        : "Required: Please explain what needs to be corrected or provide additional feedback..."
    }
  />
</Form.Item>

        <Form.Item>
          <Space>
            {!isModal && (
              <Button onClick={() => navigate('/supervisor/cash-approvals')}>
                Back to List
              </Button>
            )}
            <Button
              type="primary"
              onClick={showConfirmModal}
              disabled={!decision}
              loading={loading}
            >
              Submit Decision
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default SupervisorJustificationForm;


// const SupervisorJustificationForm = () => {
//   const { requestId } = useParams();
//   const navigate = useNavigate();
//   const [form] = Form.useForm();
//   const [request, setRequest] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const [decision, setDecision] = useState(null);
//   const { user } = useSelector((state) => state.auth);

//   useEffect(() => {
//     const fetchJustification = async () => {
//       try {
//         setLoading(true);
//         const response = await api.get(`/api/cash-requests/supervisor/justification/${requestId}`);
        
//         if (!response.data.success) {
//           throw new Error(response.data.message || 'Justification not found');
//         }

//         setRequest(response.data.data);
//       } catch (error) {
//         console.error('Error fetching justification:', error);
//         message.error(error.message || 'Failed to load justification details');
//         navigate('/supervisor/requests');
//       } finally {
//         setLoading(false);
//       }
//     };
  
//     fetchJustification();
//   }, [requestId, navigate]);

//   const handleDownloadAttachment = async (attachment) => {
//     try {
//       const token = localStorage.getItem('token');
//       if (!token) {
//         message.error('Authentication required');
//         return;
//       }

//       // Extract publicId from Cloudinary URL
//       let publicId = '';
//       if (attachment.url) {
//         const urlParts = attachment.url.split('/');
//         const uploadIndex = urlParts.findIndex(part => part === 'upload');
//         if (uploadIndex !== -1 && uploadIndex + 2 < urlParts.length) {
//           publicId = urlParts.slice(uploadIndex + 2).join('/');
//           // Remove file extension from publicId
//           const lastPart = publicId.split('/').pop();
//           if (lastPart && lastPart.includes('.')) {
//             publicId = publicId.replace(/\.[^/.]+$/, '');
//           }
//         }
//       }

//       if (!publicId) {
//         message.error('Invalid attachment URL');
//         return;
//       }

//       const response = await fetch(`/api/files/download/${encodeURIComponent(publicId)}`, {
//         method: 'GET',
//         headers: {
//           'Authorization': `Bearer ${token}`,
//           'Content-Type': 'application/json'
//         }
//       });

//       if (!response.ok) {
//         throw new Error(`HTTP error! status: ${response.status}`);
//       }

//       const blob = await response.blob();
//       const url = window.URL.createObjectURL(blob);
      
//       // Create a temporary link to download the file
//       const link = document.createElement('a');
//       link.href = url;
//       link.download = attachment.originalName || attachment.name || 'attachment';
//       document.body.appendChild(link);
//       link.click();
//       document.body.removeChild(link);
      
//       // Clean up the blob URL
//       window.URL.revokeObjectURL(url);
      
//       message.success('File downloaded successfully');
//     } catch (error) {
//       console.error('Error downloading attachment:', error);
//       message.error('Failed to download attachment');
      
//       // Fallback to direct URL if download fails
//       if (attachment.url) {
//         window.open(attachment.url, '_blank');
//       }
//     }
//   };

//   const handleSubmit = async (values) => {
//     try {
//       setLoading(true);
//       const response = await api.put(`/api/cash-requests/${requestId}/supervisor/justification`, {
//         decision: values.decision,
//         comments: values.comments
//       });
      
//       if (response.data.success) {
//         message.success(`Justification ${values.decision === 'approve' ? 'approved' : 'rejected'} successfully`);
//         navigate('/supervisor/requests');
//       } else {
//         throw new Error(response.data.message || 'Failed to process justification');
//       }
//     } catch (error) {
//       console.error('Error processing justification:', error);
//       message.error(error.message || 'Failed to process justification');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const showConfirmModal = () => {
//     Modal.confirm({
//       title: `Confirm Justification ${decision === 'approve' ? 'Approval' : 'Rejection'}`,
//       icon: decision === 'approve' ? <CheckCircleOutlined /> : <CloseCircleOutlined />,
//       content: `Are you sure you want to ${decision === 'approve' ? 'approve' : 'reject'} this justification?`,
//       onOk: () => form.submit(),
//       okText: `Yes, ${decision === 'approve' ? 'Approve' : 'Reject'}`,
//       cancelText: 'Cancel'
//     });
//   };

//   const downloadDocument = (doc) => {
//     if (doc.url) {
//       handleDownloadAttachment(doc);
//     }
//   };

//   if (loading && !request) {
//     return <div>Loading justification details...</div>;
//   }

//   if (!request) {
//     return (
//       <Alert
//         message="Justification Not Found"
//         description="The justification you are trying to access does not exist or you don't have permission to view it."
//         type="error"
//         showIcon
//       />
//     );
//   }

//   const disbursedAmount = request.disbursementDetails?.amount || 0;
//   const spentAmount = request.justification?.amountSpent || 0;
//   const returnedAmount = request.justification?.balanceReturned || 0;
//   const isBalanced = Math.abs((spentAmount + returnedAmount) - disbursedAmount) < 0.01;

//   return (
//     <Card loading={loading}>
//       <Title level={3} style={{ marginBottom: '24px' }}>
//         <FileTextOutlined /> Cash Justification Review
//       </Title>

//       {/* Original Request Details */}
//       <Card type="inner" title="Original Request Details" style={{ marginBottom: '24px' }}>
//         <Descriptions bordered column={2} size="small">
//           <Descriptions.Item label="Request ID" span={2}>
//             REQ-{request._id.slice(-6).toUpperCase()}
//           </Descriptions.Item>
//           <Descriptions.Item label="Employee">
//             <Space>
//               <UserOutlined />
//               {request.employee?.fullName}
//             </Space>
//           </Descriptions.Item>
//           <Descriptions.Item label="Department">
//             {request.employee?.department || 'N/A'}
//           </Descriptions.Item>
//           <Descriptions.Item label="Request Type">
//             {request.requestType?.replace('-', ' ')?.toUpperCase()}
//           </Descriptions.Item>
//           <Descriptions.Item label="Original Purpose" span={2}>
//             {request.purpose}
//           </Descriptions.Item>
//         </Descriptions>
//       </Card>

//       {/* Financial Summary */}
//       <Card type="inner" title="Financial Summary" style={{ marginBottom: '24px' }}>
//         <Row gutter={16}>
//           <Col span={8}>
//             <Card size="small">
//               <div style={{ textAlign: 'center' }}>
//                 <Text type="secondary">Amount Disbursed</Text>
//                 <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#1890ff' }}>
//                   XAF {disbursedAmount.toFixed(2)}
//                 </div>
//               </div>
//             </Card>
//           </Col>
//           <Col span={8}>
//             <Card size="small">
//               <div style={{ textAlign: 'center' }}>
//                 <Text type="secondary">Amount Spent</Text>
//                 <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#ff4d4f' }}>
//                   XAF {spentAmount.toFixed(2)}
//                 </div>
//               </div>
//             </Card>
//           </Col>
//           <Col span={8}>
//             <Card size="small">
//               <div style={{ textAlign: 'center' }}>
//                 <Text type="secondary">Balance Returned</Text>
//                 <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#52c41a' }}>
//                   XAF {returnedAmount.toFixed(2)}
//                 </div>
//               </div>
//             </Card>
//           </Col>
//         </Row>
        
//         <div style={{ marginTop: '16px', padding: '12px', backgroundColor: isBalanced ? '#f6ffed' : '#fff2f0', border: `1px solid ${isBalanced ? '#b7eb8f' : '#ffccc7'}`, borderRadius: '4px' }}>
//           <Text strong style={{ color: isBalanced ? '#52c41a' : '#ff4d4f' }}>
//             {isBalanced ? '✅ Amounts Balance Correctly' : '⚠️ Amounts Do Not Balance'}
//           </Text>
//           {!isBalanced && (
//             <div style={{ marginTop: '4px', fontSize: '12px', color: '#666' }}>
//               Expected: XAF {disbursedAmount.toFixed(2)} = Spent + Returned: XAF {(spentAmount + returnedAmount).toFixed(2)}
//             </div>
//           )}
//         </div>
//       </Card>

//       {/* Justification Details */}
//       <Card type="inner" title="Justification Details" style={{ marginBottom: '24px' }}>
//         <Descriptions bordered column={1}>
//           <Descriptions.Item label="Submitted Date">
//             <Space>
//               <CalendarOutlined />
//               {request.justification?.justificationDate 
//                 ? new Date(request.justification.justificationDate).toLocaleDateString()
//                 : 'N/A'
//               }
//             </Space>
//           </Descriptions.Item>
//           <Descriptions.Item label="Spending Details">
//             <div style={{ whiteSpace: 'pre-wrap', maxHeight: '200px', overflowY: 'auto' }}>
//               {request.justification?.details || 'No details provided'}
//             </div>
//           </Descriptions.Item>
//         </Descriptions>

//         {/* Supporting Documents */}
//         {request.justification?.documents && request.justification.documents.length > 0 && (
//           <div style={{ marginTop: '16px' }}>
//             <Text strong>Supporting Documents:</Text>
//             <div style={{ marginTop: '8px' }}>
//               {request.justification.documents.map((doc, index) => (
//                 <Card key={index} size="small" style={{ marginBottom: '8px' }}>
//                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
//                     <div>
//                       <Text strong>{doc.name}</Text>
//                       <br />
//                       <Text type="secondary" style={{ fontSize: '12px' }}>
//                         {doc.size ? `${(doc.size / 1024).toFixed(1)} KB` : ''} • {doc.mimetype || 'Unknown type'}
//                       </Text>
//                     </div>
//                     <Button 
//                       type="primary" 
//                       size="small" 
//                       icon={<DownloadOutlined />}
//                       onClick={() => downloadDocument(doc)}
//                     >
//                       View
//                     </Button>
//                   </div>
//                 </Card>
//               ))}
//             </div>
//           </div>
//         )}
//       </Card>

//       <Divider />

//       <Form form={form} layout="vertical" onFinish={handleSubmit}>
//         <Form.Item
//           name="decision"
//           label="Your Decision on This Justification"
//           rules={[{ required: true, message: 'Please make a decision' }]}
//         >
//           <Radio.Group onChange={(e) => setDecision(e.target.value)}>
//             <Space direction="vertical">
//               <Radio.Button value="approve" style={{ color: '#52c41a' }}>
//                 <CheckCircleOutlined /> Approve Justification
//               </Radio.Button>
//               <Radio.Button value="reject" style={{ color: '#ff4d4f' }}>
//                 <CloseCircleOutlined /> Reject Justification (Requires Revision)
//               </Radio.Button>
//             </Space>
//           </Radio.Group>
//         </Form.Item>

//         <Form.Item
//           name="comments"
//           label="Comments"
//           rules={decision === 'reject' ? [{ required: true, message: 'Please provide feedback for rejection' }] : []}
//         >
//           <TextArea 
//             rows={4} 
//             placeholder={
//               decision === 'approve' 
//                 ? "Optional: Any additional comments about this justification..."
//                 : "Required: Please explain what needs to be corrected or provide additional feedback..."
//             }
//           />
//         </Form.Item>

//         <Form.Item>
//           <Space>
//             <Button onClick={() => navigate('/supervisor/requests')}>
//               Back to List
//             </Button>
//             <Button
//               type="primary"
//               onClick={showConfirmModal}
//               disabled={!decision}
//               loading={loading}
//             >
//               Submit Decision
//             </Button>
//           </Space>
//         </Form.Item>
//       </Form>
//     </Card>
//   );
// };

// export default SupervisorJustificationForm;


